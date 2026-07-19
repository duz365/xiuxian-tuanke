import { cards } from './CardRegistry'
import { AIService } from '../ai/AIService'
import { GameSession } from '../game/GameSession'

export class CardExecutor {
  constructor(private ai: AIService) {}

  async execute(
    session: GameSession,
    playerId: string,
    cardId: string,
    targetId: string,
    targetType: string,
    supplement?: string
  ): Promise<any> {
    const card = cards[cardId]
    if (!card) throw new Error(`未知卡牌: ${cardId}`)

    const caster = session.getPlayer(playerId)
    if (!caster) throw new Error('玩家不存在')
    if (card.manaCost && caster.mp < card.manaCost) throw new Error('灵力不足')

    // 装备卡
    if (card.type === 'equipment') {
      return this.handleEquip(session, playerId, card)
    }

    // 组装prompt
    const target = targetType === 'self' ? caster : (session.getPlayer(targetId) || session.getNPC(targetId))
    const targetName = target?.name || '目标'
    const node = session.getCurrentNode()
    const stat = card.effect.stat || 'spirit'
    const statVal = (caster.stats[stat] || 10) + (caster.attackBonus || 0)
    const dc = (node?.difficulty || 12)

    let prompt = card.aiPrompt
      .replace(/\{caster\}/g, caster.name)
      .replace(/\{target\}/g, targetName)
      .replace(/\{stat\}/g, String(statVal))
      .replace(/\{dc\}/g, String(dc))
      .replace(/\{damageRoll\}/g, card.effect.dice || String(card.effect.value || 0))
    if (supplement) prompt += ` 玩家补充：${supplement}`

    // 调用AI
    const raw = await this.ai.generate(
      `你是修仙跑团DM。根据行动进行D20判定并叙述。返回JSON：
{"narrative":"叙事(80字内)","dcResult":"success|fail|critical","damage":0,"heal":0,"shield":0,"statusEffect":null,"hiddenInfo":null}`,
      `场景：${session.getCurrentSceneDescription()}\n${prompt}`
    )

    // 解析AI响应
    let result: any = { narrative: raw, dcResult: 'success', damage: 0, heal: 0, shield: 0, statusEffect: null, hiddenInfo: null }
    try {
      const parsed = JSON.parse(raw)
      result = {
        narrative: parsed.narrative || raw,
        dcResult: parsed.dcResult || 'success',
        damage: Number(parsed.damage) || 0,
        heal: Number(parsed.heal) || 0,
        shield: Number(parsed.shield) || 0,
        statusEffect: parsed.statusEffect || null,
        hiddenInfo: parsed.hiddenInfo || null
      }
    } catch {
      // 解析失败用默认值
    }

    // 扣法力
    if (card.manaCost) caster.mp = Math.max(0, caster.mp - card.manaCost)

    // 应用效果
    const tgt = session.getPlayer(targetId) || session.getNPC(targetId)
    if (tgt) {
      if (result.damage > 0) {
        if (tgt.shield > 0) {
          const absorbed = Math.min(tgt.shield, result.damage)
          tgt.shield -= absorbed
          result.damage -= absorbed
        }
        tgt.hp = Math.max(0, tgt.hp - result.damage)
      }
      if (result.heal > 0) {
        tgt.hp = Math.min(tgt.maxHp, tgt.hp + result.heal)
        if (card.id === 'spirit-pill' && tgt.mp !== undefined) tgt.mp = Math.min(tgt.maxMp, tgt.mp + result.heal)
      }
      if (result.shield > 0) tgt.shield = (tgt.shield || 0) + result.shield
      if (result.statusEffect && tgt.status) tgt.status.push(result.statusEffect)
    }

    // 消耗
    if (card.consumable) session.removeCardFromHand(playerId, cardId)

    // 掉落
    let loot: string[] = []
    if ((targetType === 'enemy' || targetType === 'npc') && tgt && tgt.hp <= 0) {
      loot = this.rollLoot(targetId)
      loot.forEach(id => session.addCardToHand(playerId, id))
    }
    if (card.effect.type === 'scout' && result.dcResult === 'success') {
      const found = this.rollDiscovery()
      found.forEach(id => session.addCardToHand(playerId, id))
      loot = [...loot, ...found]
    }

    return { ...result, loot }
  }

  private handleEquip(session: GameSession, playerId: string, card: any): any {
    const player = session.getPlayer(playerId)
    if (!player || !card.equipSlot) throw new Error('无法装备')
    const slot = card.equipSlot as 'weapon' | 'armor' | 'accessory'
    const old = player.equipment[slot]
    if (old) {
      player.inventory.push(old)
      const oldCard = cards[old]
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
    if (old) narrative += ` 卸下了【${cards[old]?.name || '旧装备'}】。`
    return { narrative, dcResult: 'success', damage: 0, heal: 0, shield: 0, statusEffect: null, hiddenInfo: null, loot: old ? [old] : [] }
  }

  private rollLoot(targetId: string): string[] {
    const tables: Record<string, { id: string; chance: number }[]> = {
      'dark-cultivator': [
        { id: 'purple-sword', chance: 1 }, { id: 'flame-blast', chance: 0.8 },
        { id: 'enlightenment-tea', chance: 0.6 }, { id: 'spirit-pill', chance: 1 }, { id: 'hp-pill', chance: 1 }
      ],
      'bamboo-viper': [{ id: 'spirit-herb', chance: 0.7 }, { id: 'hp-pill', chance: 0.4 }, { id: 'spirit-pill', chance: 0.3 }],
      'cliff-lizard': [{ id: 'iron-vest', chance: 0.25 }, { id: 'spirit-herb', chance: 0.5 }, { id: 'hp-pill', chance: 0.4 }],
      'stone-guardian': [{ id: 'spirit-jade', chance: 0.5 }, { id: 'cloud-boots', chance: 0.3 }, { id: 'full-strike', chance: 0.4 }]
    }
    return (tables[targetId] || []).filter(e => Math.random() < e.chance).map(e => e.id)
  }

  private rollDiscovery(): string[] {
    const pool = ['spirit-herb', 'spirit-pill', 'hp-pill', 'search-area', 'meditate', 'defend-stance', 'break-talisman']
    const n = Math.random() < 0.5 ? 1 : Math.random() < 0.8 ? 2 : 3
    return Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)])
  }
}
