export type RootType = '金灵根' | '水灵根' | '土灵根'
export type CardType = 'attack' | 'defense' | 'heal' | 'scout' | 'movement' | 'social' | 'special'
export type TargetType = 'self' | 'ally' | 'enemy' | 'npc' | 'area' | 'obstacle'

export interface PlayerState {
  id: string
  name: string
  rootType: RootType
  stats: { spirit: number; body: number; mind: number }
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  trait: string
}

export interface SelfInfo extends PlayerState {
  handCards: string[]
  traitDescription: string
}

export interface NPCState {
  id: string
  name: string
  description: string
  hp: number
  maxHp: number
  status: string[]
  faction: 'friendly' | 'neutral' | 'hostile'
}

export interface ScriptNodeInfo {
  id: string
  name: string
  description: string
  difficulty: number
  exits: string[]
  npcs: string[]
}

export interface GameLogEntry {
  text: string
  type: 'dm' | 'card' | 'system' | 'combat'
  playerId?: string
  cardId?: string
  timestamp: number
}

export interface CardInfo {
  id: string
  name: string
  type: CardType
  allowedTargets: TargetType[]
  consumable: boolean
}

export interface TargetOption {
  id: string
  label: string
  type: TargetType
}
