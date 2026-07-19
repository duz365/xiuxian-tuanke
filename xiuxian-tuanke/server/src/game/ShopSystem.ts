import { cards, CardDefinition } from '../cards/CardRegistry'
import { GameSession } from './GameSession'

export class ShopSystem {
  static getItems(sceneId: string): CardDefinition[] {
    const tables: Record<string, string[]> = {
      'mountain-foot': ['spirit-pill', 'hp-pill', 'search-area', 'defend-stance', 'iron-vest', 'meditate'],
      'cave-entrance': ['spirit-pill', 'hp-pill', 'full-strike', 'spirit-jade', 'flame-blast', 'break-talisman'],
      'trial-hall': ['spirit-pill', 'hp-pill', 'enlightenment-tea', 'healing-light', 'cloud-boots', 'flame-gloves']
    }
    return (tables[sceneId] || tables['mountain-foot']).map(id => cards[id]).filter(Boolean)
  }

  static buy(session: GameSession, playerId: string, cardId: string): { success: boolean; message: string } {
    const card = cards[cardId]
    if (!card) return { success: false, message: '此物不存在。' }
    if (!card.buyPrice) return { success: false, message: '此物不卖。' }
    const player = session.getPlayer(playerId)
    if (!player) return { success: false, message: '找不到你。' }
    if (player.spiritStones < card.buyPrice) return { success: false, message: `灵石不足。需要${card.buyPrice}灵石，你有${player.spiritStones}灵石。` }
    player.spiritStones -= card.buyPrice
    session.addCardToHand(playerId, cardId)
    return { success: true, message: `付出${card.buyPrice}灵石，获得【${card.name}】。` }
  }

  static sell(session: GameSession, playerId: string, cardId: string): { success: boolean; message: string } {
    const card = cards[cardId]
    if (!card) return { success: false, message: '此物不存在。' }
    if (!card.sellPrice) return { success: false, message: '此物无法出售。' }
    const player = session.getPlayer(playerId)
    if (!player) return { success: false, message: '找不到你。' }
    const inHand = player.handCards.includes(cardId)
    const inInv = player.inventory.includes(cardId)
    if (!inHand && !inInv) return { success: false, message: '你没有此物。' }
    if (inHand) session.removeCardFromHand(playerId, cardId)
    else player.inventory = player.inventory.filter(id => id !== cardId)
    player.spiritStones += card.sellPrice
    return { success: true, message: `出售【${card.name}】，获得${card.sellPrice}灵石。` }
  }
}
