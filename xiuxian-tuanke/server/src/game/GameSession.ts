import { v4 as uuidv4 } from 'uuid'
import { Player, NPC, GameLogEntry, ScriptNode, EquipSlot } from '../types'
import { TurnScheduler } from './TurnScheduler'
import { AIService } from '../ai/AIService'
import { INITIAL_HAND_CARDS } from '../cards/CardRegistry'

const PRESET_CHARACTERS: Record<string, Omit<Player, 'id' | 'handCards' | 'equipment' | 'inventory' | 'spiritStones' | 'shield' | 'attackBonus' | 'defenseBonus'>> = {
  '凌霄': {
    name: '凌霄',
    rootType: '金灵根',
    stats: { spirit: 14, body: 16, mind: 10 },
    hp: 28, maxHp: 28,
    mp: 12, maxMp: 12,
    trait: '剑心通明',
    traitDescription: '使用剑类卡牌时判定+1'
  },
  '青鸾': {
    name: '青鸾',
    rootType: '水灵根',
    stats: { spirit: 17, body: 9, mind: 14 },
    hp: 22, maxHp: 22,
    mp: 20, maxMp: 20,
    trait: '天一生水',
    traitDescription: '水法卡牌可额外指定一个目标'
  },
  '石岩': {
    name: '石岩',
    rootType: '土灵根',
    stats: { spirit: 10, body: 18, mind: 12 },
    hp: 32, maxHp: 32,
    mp: 8, maxMp: 8,
    trait: '不动如山',
    traitDescription: '防御卡牌效果翻倍'
  }
}

const SCRIPT_NODES: ScriptNode[] = [
  {
    id: 'mountain-foot',
    name: '山脚石碑',
    description: '九嶷山脚下，一块布满苔藓的古旧石碑立在路口。旁边有一条蜿蜒向上的石阶，隐入迷雾之中。一位游方商人在石碑旁摆了个小摊。',
    difficulty: 10,
    exits: ['bamboo-mist'],
    npcs: [],
    hasShop: true,
    onEnterDMInstructions: '描述山脚的荒凉氛围。石碑上刻着"九嶷洞天"四字。游方商人向你招手。'
  },
  {
    id: 'bamboo-mist',
    name: '迷雾竹林',
    description: '一片茂密的竹林，白雾翻涌。竹叶沙沙作响，雾中似乎有东西在移动。一条路通往断崖，另一条低洼处弥漫紫色瘴气。',
    difficulty: 13,
    exits: ['cliff-bridge', 'poison-swamp'],
    npcs: ['bamboo-viper'],
    hasShop: false,
    onEnterDMInstructions: '竹林中有竹叶青蛇妖潜伏。使用侦察卡牌可发现毒瘴沼泽的隐藏路径。'
  },
  {
    id: 'cliff-bridge',
    name: '断崖索桥',
    description: '一道深不见底的峡谷。破旧的铁索桥在风中摇晃，桥板腐朽。对岸隐约可见石门。崖壁上传来嘶嘶声。',
    difficulty: 14,
    exits: ['cave-entrance'],
    npcs: ['cliff-lizard'],
    hasShop: false,
    onEnterDMInstructions: '索桥被腐朽咒侵蚀。需要土行灵力稳固或御风飞越。石壁蜥会在过桥时袭击。'
  },
  {
    id: 'cave-entrance',
    name: '洞府入口',
    description: '巨大的石门嵌在山壁中，门上刻满符文。两尊石像手持长戟立在两侧，眼中闪烁微光。一位散修在此兜售法器。',
    difficulty: 16,
    exits: ['trial-hall'],
    npcs: ['stone-guardian'],
    hasShop: true,
    onEnterDMInstructions: '石门上布有三才锁灵阵，需要三种灵根同时注入灵力。守护石像会攻击闯入者。'
  },
  {
    id: 'trial-hall',
    name: '试炼大殿',
    description: '宽阔的大殿中央悬浮着紫电缠绕的长剑。一道黑影站在高台前。一位神秘老者在角落摆摊，似乎对魔修毫不在意。',
    difficulty: 18,
    exits: ['treasure-room'],
    npcs: ['dark-cultivator'],
    hasShop: true,
    onEnterDMInstructions: '魔修「幽煞散人」在此等候。这是最终BOSS战。'
  },
  {
    id: 'treasure-room',
    name: '藏宝密室',
    description: '石室中堆放着灵石、丹药和功法玉简。正中央的玉盒中盛着一枚散发柔光的筑基丹。',
    difficulty: 10,
    exits: [],
    npcs: [],
    hasShop: false,
    onEnterDMInstructions: '冒险的终点。总结本次旅程，描述获得筑基丹的喜悦。'
  }
]

export class GameSession {
  id: string
  players: Map<string, Player> = new Map()
  npcs: Map<string, NPC> = new Map()
  log: GameLogEntry[] = []
  currentNodeId: string = 'mountain-foot'
  scheduler: TurnScheduler | null = null
  currentTurn: string = ''
  aiService: AIService
  started: boolean = false
  gameOver: boolean = false

  constructor(sessionId: string, aiService: AIService) {
    this.id = sessionId
    this.aiService = aiService
    this.initNPCs()
  }

  private initNPCs(): void {
    const npcDefs: NPC[] = [
      { id: 'bamboo-viper', name: '竹叶青蛇妖', description: '通体碧绿的巨蛇，毒牙滴着翠绿毒液。', hp: 20, maxHp: 20, status: [], faction: 'hostile', shield: 0, attack: 6 },
      { id: 'cliff-lizard', name: '石壁蜥', description: '贴在崖壁上的灰褐色巨蜥，爪牙锋利。', hp: 18, maxHp: 18, status: [], faction: 'hostile', shield: 0, attack: 5 },
      { id: 'stone-guardian', name: '守护石像', description: '手持长戟的石像，眼中灵光闪烁。', hp: 30, maxHp: 30, status: ['石肤护体'], faction: 'hostile', shield: 5, attack: 8 },
      { id: 'dark-cultivator', name: '幽煞散人', description: '身穿黑袍的魔修，周身萦绕黑色煞气。', hp: 50, maxHp: 50, status: ['煞气护体', '毒功'], faction: 'hostile', shield: 10, attack: 12 }
    ]
    npcDefs.forEach(npc => this.npcs.set(npc.id, { ...npc }))
  }

  addPlayer(name: string): Player {
    const preset = PRESET_CHARACTERS[name]
    if (!preset) throw new Error(`未知角色: ${name}`)

    const id = uuidv4()
    const player: Player = {
      ...preset,
      id,
      handCards: [...(INITIAL_HAND_CARDS[name] || [])],
      shield: 0,
      equipment: { weapon: null, armor: null, accessory: null },
      inventory: [],
      spiritStones: 50,
      attackBonus: 0,
      defenseBonus: 0
    }
    this.players.set(id, player)
    this.addLog({ text: `${player.name}加入了队伍。`, type: 'system', timestamp: Date.now() })
    return player
  }

  startGame(): void {
    if (this.players.size < 2) throw new Error('至少需要2名玩家')
    this.scheduler = new TurnScheduler(Array.from(this.players.keys()))
    this.currentTurn = this.scheduler.currentPlayerId
    this.started = true
    this.addLog({ text: '冒险开始！', type: 'system', timestamp: Date.now() })
  }

  async generateDMNarrative(): Promise<string | null> {
    const node = this.getCurrentNode()
    if (!node) return null
    const currentPlayer = this.getPlayer(this.currentTurn)

    const prompt = `当前场景：${node.name} - ${node.description}
${node.onEnterDMInstructions || ''}
当前行动玩家是${currentPlayer?.name}。
请以DM口吻描述当前场景，引导玩家行动。80字以内。`

    try {
      const narrative = await this.aiService.generate(
        '你是一个修仙跑团DM。描述场景，引导玩家行动。',
        prompt,
        { maxTokens: 200 }
      )
      this.addLog({ text: narrative, type: 'dm', timestamp: Date.now() })
      return narrative
    } catch {
      const fallback = `${node.name}：${node.description}`
      this.addLog({ text: fallback, type: 'dm', timestamp: Date.now() })
      return fallback
    }
  }

  advanceTurn(): string {
    if (!this.scheduler) return ''
    this.currentTurn = this.scheduler.advance()
    return this.currentTurn
  }

  moveToNode(nodeId: string): void {
    this.currentNodeId = nodeId
    this.addLog({
      text: `队伍来到了${this.getCurrentNode()?.name || nodeId}。`,
      type: 'system',
      timestamp: Date.now()
    })
  }

  getCurrentNode(): ScriptNode | undefined {
    return SCRIPT_NODES.find(n => n.id === this.currentNodeId)
  }

  getCurrentSceneDescription(): string {
    const node = this.getCurrentNode()
    return node ? `${node.name}：${node.description}` : '未知之地'
  }

  getCurrentDifficulty(): number {
    return this.getCurrentNode()?.difficulty || 12
  }

  getAreaDescription(areaId: string): string {
    if (areaId === 'current') return this.getCurrentSceneDescription()
    const node = SCRIPT_NODES.find(n => n.id === areaId)
    return node ? `${node.name}：${node.description}` : areaId
  }

  getObstacleDescription(obstacleId: string): string {
    const descriptions: Record<string, string> = {
      'bridge': '破旧的铁索桥，桥板腐朽，被黑气缠绕',
      'gate': '刻满符文的石门，需要三种灵根同时注入灵力',
      'cliff': '深不见底的峡谷断崖',
      'swamp': '弥漫紫色毒瘴的低洼沼泽'
    }
    return descriptions[obstacleId] || obstacleId
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id)
  }

  getPlayerIds(): string[] {
    return Array.from(this.players.keys())
  }

  getPlayers(): any[] {
    return Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      rootType: p.rootType,
      stats: p.stats,
      hp: p.hp,
      maxHp: p.maxHp,
      mp: p.mp,
      maxMp: p.maxMp,
      shield: p.shield,
      trait: p.trait,
      spiritStones: p.spiritStones,
      equipment: p.equipment,
      handCardCount: p.handCards.length
    }))
  }

  getNPC(id: string): NPC | undefined {
    return this.npcs.get(id)
  }

  getActiveNPCs(): NPC[] {
    const node = this.getCurrentNode()
    if (!node) return []
    return node.npcs
      .map(id => this.npcs.get(id))
      .filter((n): n is NPC => n !== undefined && n.hp > 0)
  }

  removeCardFromHand(playerId: string, cardId: string): void {
    const player = this.players.get(playerId)
    if (!player) return
    const idx = player.handCards.indexOf(cardId)
    if (idx !== -1) player.handCards.splice(idx, 1)
  }

  addCardToHand(playerId: string, cardId: string): void {
    const player = this.players.get(playerId)
    if (!player) return
    player.handCards.push(cardId)
  }

  addLog(entry: GameLogEntry): void {
    this.log.push(entry)
    if (this.log.length > 200) this.log = this.log.slice(-200)
  }

  isGameOver(): boolean {
    if (this.gameOver) return true
    const allDead = Array.from(this.players.values()).every(p => p.hp <= 0)
    if (allDead) { this.gameOver = true; return true }
    const boss = this.npcs.get('dark-cultivator')
    if (boss && boss.hp <= 0 && this.currentNodeId === 'treasure-room') {
      this.gameOver = true; return true
    }
    return false
  }
}
