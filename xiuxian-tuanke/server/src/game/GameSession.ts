import { v4 as uuid } from 'uuid'
import { Player, NPC, ScriptNode } from '../types'
import { TurnScheduler } from './TurnScheduler'
import { AIService } from '../ai/AIService'
import { INITIAL_HAND } from '../cards/CardRegistry'

const PRESETS: Record<string, any> = {
  '凌霄': { name: '凌霄', rootType: '金灵根', stats: { spirit: 14, body: 16, mind: 10 }, hp: 28, maxHp: 28, mp: 12, maxMp: 12, trait: '剑心通明', traitDescription: '剑类卡牌判定+1' },
  '青鸾': { name: '青鸾', rootType: '水灵根', stats: { spirit: 17, body: 9, mind: 14 }, hp: 22, maxHp: 22, mp: 20, maxMp: 20, trait: '天一生水', traitDescription: '水法可额外指定目标' },
  '石岩': { name: '石岩', rootType: '土灵根', stats: { spirit: 10, body: 18, mind: 12 }, hp: 32, maxHp: 32, mp: 8, maxMp: 8, trait: '不动如山', traitDescription: '防御效果翻倍' }
}

const NODES: ScriptNode[] = [
  { id: 'mountain-foot', name: '山脚石碑', description: '九嶷山脚下，古旧石碑立在路口，石阶隐入迷雾。一位游方商人在此摆摊。', difficulty: 10, exits: ['bamboo-mist'], npcs: [], hasShop: true, onEnter: '描述山脚荒凉氛围。石碑刻着"九嶷洞天"。商人向你招手。' },
  { id: 'bamboo-mist', name: '迷雾竹林', description: '茂密竹林，白雾翻涌。竹叶沙沙作响，雾中有东西移动。', difficulty: 13, exits: ['cliff-bridge'], npcs: ['bamboo-viper'], hasShop: false, onEnter: '竹叶青蛇妖潜伏在雾中。' },
  { id: 'cliff-bridge', name: '断崖索桥', description: '深不见底的峡谷，铁索桥在风中摇晃，桥板腐朽。崖壁传来嘶嘶声。', difficulty: 14, exits: ['cave-entrance'], npcs: ['cliff-lizard'], hasShop: false, onEnter: '索桥被腐朽咒侵蚀。崖壁石蜥伺机袭击。' },
  { id: 'cave-entrance', name: '洞府入口', description: '巨大的石门嵌在山壁，刻满符文。两尊石像手持长戟。', difficulty: 16, exits: ['trial-hall'], npcs: ['stone-guardian'], hasShop: true, onEnter: '石门有三才锁灵阵。守护石像会攻击闯入者。' },
  { id: 'trial-hall', name: '试炼大殿', description: '宽阔大殿，高台上悬浮紫电缠绕的长剑。黑影站在台前。', difficulty: 18, exits: ['treasure-room'], npcs: ['dark-cultivator'], hasShop: true, onEnter: '魔修「幽煞散人」在此等候。最终决战。' },
  { id: 'treasure-room', name: '藏宝密室', description: '石室堆满灵石丹药。中央玉盒盛着筑基丹。', difficulty: 10, exits: [], npcs: [], hasShop: false, onEnter: '冒险终点。总结旅程，描述获得筑基丹。' }
]

export class GameSession {
  id: string
  players: Map<string, Player> = new Map()
  npcs: Map<string, NPC> = new Map()
  log: any[] = []
  currentNodeId = 'mountain-foot'
  scheduler: TurnScheduler | null = null
  currentTurn = ''
  aiService: AIService
  started = false
  gameOver = false

  constructor(sessionId: string, ai: AIService) {
    this.id = sessionId
    this.aiService = ai
    this.npcs.set('bamboo-viper', { id: 'bamboo-viper', name: '竹叶青蛇妖', description: '碧绿巨蛇，毒牙滴翠。', hp: 20, maxHp: 20, status: [], faction: 'hostile', shield: 0, attack: 6 })
    this.npcs.set('cliff-lizard', { id: 'cliff-lizard', name: '石壁蜥', description: '灰褐巨蜥，爪牙锋利。', hp: 18, maxHp: 18, status: [], faction: 'hostile', shield: 0, attack: 5 })
    this.npcs.set('stone-guardian', { id: 'stone-guardian', name: '守护石像', description: '手持长戟，灵光闪烁。', hp: 30, maxHp: 30, status: ['石肤'], faction: 'hostile', shield: 5, attack: 8 })
    this.npcs.set('dark-cultivator', { id: 'dark-cultivator', name: '幽煞散人', description: '黑袍魔修，煞气萦绕。', hp: 50, maxHp: 50, status: ['煞气护体'], faction: 'hostile', shield: 10, attack: 12 })
  }

  addPlayer(name: string): Player {
    const preset = PRESETS[name]
    if (!preset) throw new Error(`未知角色: ${name}`)
    const id = uuid()
    const player: Player = {
      ...preset, id,
      handCards: [...(INITIAL_HAND[name] || [])],
      shield: 0,
      equipment: { weapon: null, armor: null, accessory: null },
      inventory: [],
      spiritStones: 50,
      attackBonus: 0,
      defenseBonus: 0
    }
    this.players.set(id, player)
    this.log.push({ text: `${player.name}加入队伍。`, type: 'system', timestamp: Date.now() })
    return player
  }

  startGame(): void {
    if (this.players.size < 2) throw new Error('至少需要2名玩家')
    this.scheduler = new TurnScheduler(Array.from(this.players.keys()))
    this.currentTurn = this.scheduler.currentPlayerId
    this.started = true
    this.log.push({ text: '冒险开始！', type: 'system', timestamp: Date.now() })
  }

  async generateDMNarrative(): Promise<string> {
    const node = this.getCurrentNode()
    if (!node) return ''
    const player = this.getPlayer(this.currentTurn)
    try {
      return await this.aiService.generate(
        '你是修仙跑团DM。描述场景引导玩家。80字内。',
        `场景：${node.name}-${node.description}。${node.onEnter}。当前行动：${player?.name}。`
      )
    } catch {
      return `${node.name}：${node.description}`
    }
  }

  advanceTurn(): string {
    if (!this.scheduler) return ''
    this.currentTurn = this.scheduler.advance()
    return this.currentTurn
  }

  getCurrentNode(): ScriptNode | undefined { return NODES.find(n => n.id === this.currentNodeId) }
  getCurrentSceneDescription(): string { const n = this.getCurrentNode(); return n ? `${n.name}：${n.description}` : '未知' }
  getPlayer(id: string): Player | undefined { return this.players.get(id) }
  getPlayerIds(): string[] { return Array.from(this.players.keys()) }
  getNPC(id: string): NPC | undefined { return this.npcs.get(id) }

  getPlayers(): any[] {
    return Array.from(this.players.values()).map(p => ({
      id: p.id, name: p.name, rootType: p.rootType, stats: p.stats,
      hp: p.hp, maxHp: p.maxHp, mp: p.mp, maxMp: p.maxMp, shield: p.shield,
      trait: p.trait, spiritStones: p.spiritStones, equipment: p.equipment,
      handCardCount: p.handCards.length
    }))
  }

  getActiveNPCs(): NPC[] {
    const node = this.getCurrentNode()
    if (!node) return []
    return node.npcs.map(id => this.npcs.get(id)).filter((n): n is NPC => n !== undefined && n.hp > 0)
  }

  removeCardFromHand(playerId: string, cardId: string): void {
    const p = this.players.get(playerId)
    if (!p) return
    const i = p.handCards.indexOf(cardId)
    if (i !== -1) p.handCards.splice(i, 1)
  }

  addCardToHand(playerId: string, cardId: string): void {
    const p = this.players.get(playerId)
    if (p) p.handCards.push(cardId)
  }
}
