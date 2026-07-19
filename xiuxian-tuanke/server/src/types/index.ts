export interface Player {
  id: string
  name: string
  rootType: string
  stats: { spirit: number; body: number; mind: number }
  hp: number; maxHp: number
  mp: number; maxMp: number
  shield: number
  handCards: string[]
  equipment: { weapon: string | null; armor: string | null; accessory: string | null }
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
  type: 'skill' | 'equipment' | 'action' | 'item'
  rarity: string
  description: string
  equipSlot?: string
  equipBonus?: { attack?: number; defense?: number; spirit?: number; body?: number; mind?: number }
  targetType: string
  allowedTargets: string[]
  effect: any
  manaCost?: number
  cooldown?: number
  consumable?: boolean
  sellPrice: number
  buyPrice: number
  aiPrompt: string
}

export interface NPC {
  id: string
  name: string
  description: string
  hp: number; maxHp: number
  status: string[]
  faction: string
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
  onEnter: string
}
