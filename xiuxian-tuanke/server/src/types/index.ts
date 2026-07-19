export type RootType = '金灵根' | '水灵根' | '土灵根'
export type CardType = 'skill' | 'equipment' | 'action' | 'item' | 'character'
export type TargetType = 'self' | 'ally' | 'enemy' | 'npc' | 'area' | 'obstacle' | 'any' | 'none'
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic'
export type EquipSlot = 'weapon' | 'armor' | 'accessory'

export interface Player {
  id: string
  name: string
  rootType: RootType
  stats: {
    spirit: number
    body: number
    mind: number
  }
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  shield: number
  handCards: string[]
  equipment: Record<EquipSlot, string | null>
  inventory: string[]
  spiritStones: number
  trait: string
  traitDescription: string
  attackBonus: number
  defenseBonus: number
}

export interface CardDefinition {
  id: string
  name: string
  type: CardType
  rarity: CardRarity
  description: string
  equipSlot?: EquipSlot
  equipBonus?: {
    attack?: number
    defense?: number
    spirit?: number
    body?: number
    mind?: number
  }
  targetType: TargetType
  allowedTargets: TargetType[]
  effect: CardEffect
  cooldown?: number
  manaCost?: number
  consumable?: boolean
  sellPrice?: number
  buyPrice?: number
  aiPromptTemplate: string
}

export interface CardEffect {
  type: 'damage' | 'heal' | 'shield' | 'buff' | 'debuff' | 'scout' | 'summon' | 'teleport' | 'equip'
  value?: number
  dice?: string
  stat?: 'spirit' | 'body' | 'mind'
  duration?: number
  statusEffect?: string
}

export interface CardAction {
  playerId: string
  cardId: string
  targetId: string
  targetType: TargetType
  supplement?: string
}

export interface ExecuteResult {
  narrative: string
  dcResult: 'success' | 'fail' | 'critical'
  damage: number
  heal: number
  shield: number
  statusEffect: string | null
  hiddenInfo: string | null
  lootDropped?: string[]
  cardGained?: string[]
}

export interface NPC {
  id: string
  name: string
  description: string
  hp: number
  maxHp: number
  status: string[]
  faction: 'friendly' | 'neutral' | 'hostile'
  shield: number
  attack: number
}

export interface ScriptNode {
  id: string
  name: string
  description: string
  difficulty: number
  exits: string[]
  npcs: string[]
  hasShop: boolean
  onEnterDMInstructions?: string
}

export interface GameLogEntry {
  text: string
  type: 'dm' | 'card' | 'system' | 'combat' | 'loot' | 'shop'
  playerId?: string
  cardId?: string
  timestamp: number
}

export interface StateChange {
  type: 'hp_change' | 'status_add' | 'card_remove' | 'card_add' | 'mp_change' |
        'npc_remove' | 'equipment_change' | 'spirit_stones_change' | 'shield_change'
  targetId: string
  targetType?: 'player' | 'npc'
  delta?: number
  newValue?: number
  value?: string
}

export interface TargetOption {
  id: string
  label: string
  type: TargetType
}
