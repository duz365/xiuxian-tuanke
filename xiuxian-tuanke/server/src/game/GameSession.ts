import { v4 as uuidv4 } from 'uuid'
import { Player, NPC, GameLogEntry, ScriptNode, RootType } from '../types'
import { TurnScheduler } from './TurnScheduler'
import { AIService } from '../ai/AIService'

const PRESET_CHARACTERS: Record<string, Omit<Player, 'id' | 'handCards'>> = {
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

const INITIAL_HAND_CARDS: Record<string, string[]> = {
  '凌霄': ['sword-fly', 'qi-slash', 'gold-shield', 'spirit-eye', 'spirit-pill'],
  '青鸾': ['water-dragon', 'ice-curse', 'spirit-rain', 'qi-gaze', 'help-talisman'],
  '石岩': ['mountain-fist', 'diamond-body', 'earth-listen', 'earth-escape', 'break-talisman']
}

const SCRIPT_NODES: ScriptNode[] = [
  {
    id: 'mountain-foot',
    name: '山脚石碑',
    description: '九嶷山脚下，一块布满苔藓的古旧石碑立在路口。碑上刻着模糊的铭文，旁边有一条蜿蜒向上的石阶，隐入迷雾之中。',
    difficulty: 10,
    exits: ['bamboo-mist'],
    npcs: [],
    onEnterDMInstructions: '描述山脚的荒凉氛围，石碑上隐约可见"九嶷洞天"四字。远处传来隐约的兽吼。'
  },
  {
    id: 'bamboo-mist',
    name: '迷雾竹林',
    description: '一片茂密的竹林，白色的迷雾在地面翻涌。竹叶沙沙作响，似乎有什么东西在雾中移动。隐约可见两条路：一条通往断崖方向，另一条地势低洼处弥漫着淡紫色的瘴气。',
    difficulty: 13,
    exits: ['cliff-bridge', 'poison-swamp'],
    npcs: ['bamboo-viper'],
    onEnterDMInstructions: '竹林中有竹叶青蛇妖潜伏。如果玩家使用侦察类卡牌，可以发现隐藏的毒瘴沼泽路径。'
  },
  {
    id: 'poison-swamp',
    name: '毒瘴沼泽',
    description: '低洼地带积聚着紫色的毒瘴，沼泽中冒着气泡。一棵枯死的老树横在沼泽中央，树干上似乎有什么东西在发光。',
    difficulty: 15,
    exits: ['cave-entrance'],
    npcs: [],
    onEnterDMInstructions: '这是隐藏路径。沼泽中有毒瘴，需要通过判定才能安全通过。枯树上有一枚「避毒珠」（给通过的玩家一张临时卡牌）。'
  },
  {
    id: 'cliff-bridge',
    name: '断崖索桥',
    description: '一道深不见底的峡谷横在前方。破旧的铁索桥在风中摇晃，桥板腐朽。对岸隐约可见一道石门。峡谷下方传来嘶嘶声，崖壁上似乎有东西爬行。',
    difficulty: 14,
    exits: ['cave-entrance'],
    npcs: ['cliff-lizard'],
    onEnterDMInstructions: '索桥被魔修的腐朽咒侵蚀。需要用土行灵力稳固桥身才能安全通过。崖壁上的石蜥会在玩家过桥时袭击。如果玩家用御风术可以直接飞过去。'
  },
  {
    id: 'cave-entrance',
    name: '洞府入口',
    description: '一道巨大的石门嵌在山壁中，门上刻满符文。门两侧立着两尊石像，手持长戟，眼中闪烁着微弱的光芒。',
    difficulty: 16,
    exits: ['trial-hall'],
    npcs: ['stone-guardian'],
    onEnterDMInstructions: '石门上布有三才锁灵阵，需要金、水、土三种灵根同时注入灵力才能开启。强行闯入会触发守护石像的攻击。守护石像掉落「石髓丹」配方线索。'
  },
  {
    id: 'trial-hall',
    name: '试炼大殿',
    description: '宽阔的大殿中央有一座高台，台上悬浮着一柄紫色电光缠绕的长剑——正是传说中的紫电剑。高台四周环绕着四个石台，每个石台上放着不同的考验之物。一道黑影站在高台前。',
    difficulty: 18,
    exits: ['treasure-room'],
    npcs: ['dark-cultivator'],
    onEnterDMInstructions: '魔修「幽煞散人」在此等候。他是此行的BOSS。战斗不可避免。如果玩家之前在沼泽获得了避毒珠，可以对魔修的毒功产生克制。'
  },
  {
    id: 'treasure-room',
    name: '藏宝密室',
    description: '试炼大殿的后方，一间石室中堆放着灵石、丹药和功法玉简。正中央的石台上放着一个玉盒，盒中盛着一枚散发柔光的丹药——筑基丹。',
    difficulty: 10,
    exits: [],
    npcs: [],
    onEnterDMInstructions: '这是终点。描述获得战利品的满足感。如果有玩家阵亡，在这里可以找到一张「还魂符」。总结本次冒险。'
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
      {
        id: 'bamboo-viper',
        name: '竹叶青蛇妖',
        description: '一条通体碧绿的巨蛇，盘踞在竹枝上，毒牙滴着翠绿的毒液。',
        hp: 20, maxHp: 20,
        status: [],
        faction: 'hostile'
      },
      {
        id: 'cliff-lizard',
        name: '石壁蜥',
        description: '贴在崖壁上的灰褐色巨蜥，爪牙锋利，能在垂直的岩壁上自如爬行。',
        hp: 18, maxHp: 18,
        status: [],
        faction: 'hostile'
      },
      {
        id: 'stone-guardian',
        name: '守护石像',
        description: '两尊手持长戟的石像，眼中灵光闪烁，是洞府的守护者。',
        hp: 30, maxHp: 30,
        status: ['石肤护体'],
        faction: 'hostile'
      },
      {
        id: 'dark-cultivator',
        name: '幽煞散人',
        description: '一名身穿黑袍的魔修，面容枯槁，周身萦绕着黑色的煞气。已在此等候多时。',
        hp: 50, maxHp: 50,
        status: ['煞气护体', '毒功'],
        faction: 'hostile'
      }
    ]
    npcDefs.forEach(npc => this.npcs.set(npc.id, { ...npc }))
  }

  addPlayer(name: string): Player {
    const preset = PRESET_CHARACTERS[name]
    if (!preset) throw new Error(`未知角色: ${name}`)

    const id = uuidv4()
    const handCards = [...(INITIAL_HAND_CARDS[name] || [])]

    const player: Player = {
      ...preset,
      id,
      handCards
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

请以DM口吻描述当前场景，引导玩家行动。100字以内。`

    const narrative = await this.aiService.generate(
      '你是一个修仙跑团DM。描述场景，引导玩家行动。',
      prompt,
      { maxTokens: 200 }
    )

    this.addLog({ text: narrative, type: 'dm', timestamp: Date.now() })
    return narrative
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

  getPlayers(): Player[] {
    return Array.from(this.players.values()).map(p => ({
      ...p,
      handCards: p.handCards.map(() => '???') // 对其他玩家隐藏手牌内容，只显示数量
    }))
  }

  getPlayerForSelf(playerId: string): Player | undefined {
    return this.players.get(playerId)
  }

  getNPC(id: string): NPC | undefined {
    return this.npcs.get(id)
  }

  getNPCs(): NPC[] {
    return Array.from(this.npcs.values())
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
    player.handCards = player.handCards.filter(id => id !== cardId)
  }

  addCardToHand(playerId: string, cardId: string): void {
    const player = this.players.get(playerId)
    if (!player) return
    player.handCards.push(cardId)
  }

  addLog(entry: GameLogEntry): void {
    this.log.push(entry)
    // 只保留最近200条
    if (this.log.length > 200) {
      this.log = this.log.slice(-200)
    }
  }

  getLog(): GameLogEntry[] {
    return [...this.log]
  }

  isGameOver(): boolean {
    if (this.gameOver) return true

    // 所有玩家HP归零
    const allDead = Array.from(this.players.values()).every(p => p.hp <= 0)
    if (allDead) {
      this.gameOver = true
      return true
    }

    // BOSS被击败且到达终点
    const boss = this.npcs.get('dark-cultivator')
    if (boss && boss.hp <= 0 && this.currentNodeId === 'treasure-room') {
      this.gameOver = true
      return true
    }

    return false
  }

  toJSON() {
    return {
      id: this.id,
      players: this.getPlayers(),
      npcs: this.getNPCs(),
      currentNode: this.getCurrentNode(),
      currentTurn: this.currentTurn,
      turnOrder: this.scheduler?.getOrder() || [],
      started: this.started,
      gameOver: this.isGameOver(),
      activeNPCs: this.getActiveNPCs()
    }
  }
}
