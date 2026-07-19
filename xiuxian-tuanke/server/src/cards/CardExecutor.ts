import { CardDefinition, ExecuteResult, TargetType } from '../types'
import { cardRegistry } from './CardRegistry'
import { AIService } from '../ai/AIService'
import { GameSession } from '../game/GameSession'

export class CardExecutor {
  private aiService: AIService

  constructor(aiService: AIService) {
    this.aiService = aiService
  }

  async execute(
    session: GameSession,
    playerId: string,
    cardId: string,
    targetId: string,
    targetType: TargetType,
    supplement?: string
  ): Promise<ExecuteResult> {
    const card = cardRegistry[cardId]
    if (!card) throw new Error(`未知卡牌: ${cardId}`)

    const caster = session.getPlayer(playerId)
    if (!caster) throw new Error('玩家不存在')

    if (card.manaCost && caster.mp < card.manaCost) {
      throw new Error(`灵力不足！需要${card.manaCost}点，当前${caster.mp}点`)
    }

    if (card.type === 'equipment' && card.effect.type === 'equip') {
      return this.handleEquip(session, playerId, card)
    }

    const prompt = this.buildPrompt(card, caster, targetId, targetType, session, supplement)

    const rawResponse = await this.aiService.generate(
      `你是一个修仙跑团DM。请根据玩家的行动进行D20判定并叙述结果。
必须返回JSON格式：
{
  "narrative": "叙事文本（80字以内）",
  "dcResult": "success" | "fail" | "critical",
  "damage": 数值,
  "heal": 数值,
  "shield": 数值,
  "statusEffect": "状态名" 或 null,
  "hiddenInfo": "仅特定玩家可见的信息" 或 null
}`,
      prompt,
      { requireJSON: true, maxTokens: 400, temperature: 0.8 }
    )

    const result = this.parseAIResponse(rawResponse)

    if (card.manaCost) {
      caster.mp = Math.max(0, caster.mp - card.manaCost)
    }

    this.applyResult(session, playerId, targetId, card, result)

    if (card.consumable) {
      session.removeCardFromHand(playerId, card.id)
    }

    let lootDropped: string[] = []
    let cardGained: string[] = []

    if (targetType === 'enemy' || targetType === 'npc') {
      const target = session.getNPC(targetId)
      if (target && target.hp <= 0) {
        lootDropped = this.rollLoot(targetId)
        lootDropped.forEach(cid => session.addCardToHand(playerId, cid))
      }
    }

    if (card.effect.type === 'scout' && result.dcResult === 'success') {
      cardGained = this.rollDiscovery()
      cardGained.forEach(cid => session.addCardToHand(playerId, cid))
    }

    return { ...result, lootDropped, cardGained }
  }

  private buildPrompt(
    card: CardDefinition,
    caster: any,
    targetId: string,
    targetType: TargetType,
    session: GameSession,
    supplement?: string
  ): string {
    const target = targetType === 'self' ? caster :
      (session.getPlayer(targetId) || session.getNPC(targetId))
    const targetName = target?.name || '目标'
    const scene = session.getCurrentSceneDescription()
    const node = session.getCurrentNode()

    const statKey = card.effect.stat || 'spirit'
    const statValue = (caster.stats[statKey] || 10) + (caster.attackBonus || 0)
    const dc = (node?.difficulty || 12) + (card.cooldown ? 2 : 0)
    const damageRoll = card.effect.dice || '0'
    const healRoll = card.effect.dice || String(card.effect.value || 0)

    let prompt = card.aiPromptTemplate
      .replace(/\{caster\}/g, caster.name)
      .replace(/\{target\}/g, targetName)
      .replace(/\{statValue\}/g, String(statValue))
      .replace(/\{dc\}/g, String(dc))
      .replace(/\{damageRoll\}/g, damageRoll)
      .replace(/\{healRoll\}/g, healRoll)
      .replace(/\{maxLength\}/g, '80')

    prompt = prompt.replace(/\{extraHint\}/g, supplement ? `玩家补充：${supplement}` : '')

    return `当前场景：${scene}\n\n${prompt}`
  }

  private parseAIResponse(raw: string): {
    narrative: string
    dcResult: 'success' | 'fail' | 'critical'
    damage: number
    heal: number
    shield: number
    statusEffect: string | null
    hiddenInfo: string | null
  } {
    const defaults = {
      narrative: raw,
      dcResult: 'success' as const,
      damage: 0, heal: 0, shield: 0,
      statusEffect: null as string | null,
      hiddenInfo: null as string | null
    }

    try {
      const parsed = JSON.parse(raw)
      return {
        narrative: parsed.narrative || raw,
        dcResult: parsed.dcResult || 'success',
        damage: Number(parsed.damage) || 0,
        heal: Number(parsed.heal) || 0,
        shield: Number(parsed.shield) || 0,
        statusEffect: parsed.statusEffect || null,
        hiddenInfo: parsed.hiddenInfo || null
      }
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            narrative: parsed.narrative || raw,
            dcResult: parsed.dcResult || 'success',
            damage: Number(parsed.damage) || 0,
            heal: Number(parsed.heal) || 0,
            shield: Number(parsed.shield) || 0,
            statusEffect: parsed.statusEffect || null,
            hiddenInfo: parsed.hiddenInfo || null
          }
        } catch {}
      }
    }
    return defaults
  }

  private applyResult(
    session: GameSession,
    playerId: string,
    targetId: string,
    card: CardDefinition,
    result: { damage: number; heal: number; shield: number; statusEffect: string | null }
  ): void {
    const target = session.getPlayer(targetId) || session.getNPC(targetId)
    if (!target) return

    if (result.damage > 0) {
      let remaining = result.damage
      if (target.shield > 0) {
        const absorbed = Math.min(target.shield, remaining)
        target.shield -= absorbed
        remaining -= absorbed
      }
      target.hp = Math.max(0, target.hp - remaining)
    }

    if (result.heal > 0) {
      target.hp = Math.min(target.maxHp, target.hp + result.heal)
      if (card.effect.type === 'heal' && card.id === 'spirit-pill' && target.mp !== undefined) {
        target.mp = Math.min(target.maxMp, target.mp + result.heal)
      }
    }

    if (result.shield > 0) {
      target.shield = (target.shield || 0) + result.shield
    }

    if (result.statusEffect && target.status) {
      target.status.push(result.statusEffect)
    }
  }

  private handleEquip(session: GameSession, playerId: string, card: CardDefinition): ExecuteResult {
    const player = session.getPlayer(playerId)
    if (!player || !card.equipSlot) throw new Error('无法装备')

    const slot = card.equipSlot
    const oldEquipId = player.equipment[slot]
    if (oldEquipId) {
      player.inventory.push(oldEquipId)
      const oldCard = cardRegistry[oldEquipId]
      if (oldCard?.equipBonus) {
        player.attackBonus -= (oldCard.equipBonus.attack || 0)
        player.defenseBonus -= (oldCard.equipBonus.defense || 0)
      }
    }

    player.equipment[slot] = card.id
    session.removeCardFromHand(playerId, card.id)

    if (card.equipBonus) {
      player.attackBonus += (card.equipBonus.attack || 0)
      player.defenseBonus += (card.equipBonus.defense || 0)
    }

    let narrative = `${player.name}装备了【${card.name}】。`
    if (oldEquipId) {
      narrative += ` 卸下了【${cardRegistry[oldEquipId]?.name || '旧装备'}】。`
    }

    return {
      narrative,
      dcResult: 'success',
      damage: 0, heal: 0, shield: 0,
      statusEffect: null, hiddenInfo: null,
      cardGained: oldEquipId ? [oldEquipId] : undefined
    }
  }

  private rollLoot(targetId: string): string[] {
    const dropTables: Record<string, { cardId: string; chance: number }[]> = {
      'dark-cultivator': [
        { cardId: 'purple-lightning-sword', chance: 1.0 },
        { cardId: 'flame-blast', chance: 0.8 },
        { cardId: 'enlightenment-tea', chance: 0.6 },
        { cardId: 'spirit-pill', chance: 1.0 },
        { cardId: 'hp-pill', chance: 1.0 }
      ],
      'bamboo-viper': [
        { cardId: 'spirit-herb', chance: 0.7 },
        { cardId: 'hp-pill', chance: 0.4 },
        { cardId: 'spirit-pill', chance: 0.3 }
      ],
      'cliff-lizard': [
        { cardId: 'iron-vest', chance: 0.25 },
        { cardId: 'spirit-herb', chance: 0.5 },
        { cardId: 'hp-pill', chance: 0.4 }
      ],
      'stone-guardian': [
        { cardId: 'spirit-jade', chance: 0.5 },
        { cardId: 'cloud-boots', chance: 0.3 },
        { cardId: 'full-power-strike', chance: 0.4 }
      ]
    }

    const table = dropTables[targetId] || []
    return table.filter(e => Math.random() < e.chance).map(e => e.cardId)
  }

  private rollDiscovery(): string[] {
    const pool = ['spirit-herb', 'spirit-pill', 'hp-pill', 'search-area', 'meditate', 'defend-stance', 'break-talisman']
    const count = Math.random() < 0.5 ? 1 : Math.random() < 0.8 ? 2 : 3
    const result: string[] = []
    for (let i = 0; i < count; i++) {
      result.push(pool[Math.floor(Math.random() * pool.length)])
    }
    return result
  }
}
