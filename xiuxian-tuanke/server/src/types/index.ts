export type RootType = '金灵根' | '水灵根' | '土灵根'
export type CardType = 'attack' | 'defense' | 'heal' | 'scout' | 'movement' | 'social' | 'special'
export type TargetType = 'self' | 'ally' | 'enemy' | 'npc' | 'area' | 'obstacle'

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
  handCards: string[]
  trait: string
  traitDescription: string
}

export interface CardDefinition {
  id: string
  name: string
  type: CardType
  allowedTargets: TargetType[]
  aiPromptTemplate: string
  params: {
    stat?: 'spirit' | 'body' | 'mind'
    modifier?: number
    dice?: string
    heal?: string
    dcModifier?: number
  }
  structuredOutput?: {
    fields: string[]
  }
  consumable?: boolean
  maxResponseLength?: number
  tone?: string
}

export interface CardAction {
  playerId: string
  cardId: string
  targetId: string
  targetType: TargetType
  supplement?: string
}

export interface AIResponse {
  narrative: string
  structured?: {
    damage?: number
    heal?: number
    statusEffect?: string
    dcResult?: 'success' | 'fail' | 'critical'
    hiddenInfo?: string
    hiddenFor?: string[]
  }
}

export interface NPC {
  id: string
  name: string
  description: string
  hp: number
  maxHp: number
  status: string[]
  faction: 'friendly' | 'neutral' | 'hostile'
}

export interface ScriptNode {
  id: string
  name: string
  description: string
  difficulty: number
  exits: string[]
  npcs: string[]
  conditions?: {
    requiredItem?: string
    requiredFlag?: string
  }
  onEnterDMInstructions?: string
}

export interface GameLogEntry {
  text: string
  type: 'dm' | 'card' | 'system' | 'combat'
  playerId?: string
  cardId?: string
  timestamp: number
}

export interface StateChange {
  type: 'hp_change' | 'status_add' | 'card_remove' | 'mp_change' | 'npc_remove'
  targetId: string
  targetType?: 'player' | 'npc'
  delta?: number
  newValue?: number
  value?: string
}
