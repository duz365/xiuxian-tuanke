import { CardAction, CardDefinition, AIResponse, StateChange } from '../types'
import { cardRegistry } from './CardRegistry'
import { AIService } from '../ai/AIService'
import { PromptBuilder } from './PromptBuilder'
import { GameSession } from '../game/GameSession'

export class CardExecutor {
  private aiService: AIService
  private promptBuilder: PromptBuilder

  constructor(aiService: AIService) {
    this.aiService = aiService
    this.promptBuilder = new PromptBuilder()
  }

  async execute(
    session: GameSession,
    action: CardAction
  ): Promise<{
    publicNarrative: string
    privateMessages: Map<string, string>
    stateChanges: StateChange[]
  }> {
    const card = cardRegistry[action.cardId]
    if (!card) throw new Error(`卡牌不存在: ${action.cardId}`)

    this.validate(session, card, action)

    const { systemPrompt, userPrompt } = this.promptBuilder.build(card, action, session)

    const rawResponse = await this.aiService.generate(systemPrompt, userPrompt, {
      requireJSON: !!card.structuredOutput,
      maxTokens: card.maxResponseLength ? Math.ceil(card.maxResponseLength * 3) : 400
    })

    const response = this.parseResponse(rawResponse, card)

    const stateChanges = this.applyEffects(session, card, action, response)

    if (card.consumable) {
      session.removeCardFromHand(action.playerId, action.cardId)
      stateChanges.push({
        type: 'card_remove',
        targetId: action.playerId,
        targetType: 'player',
        value: action.cardId
      })
    }

    const { publicNarrative, privateMessages } = this.splitNarrative(
      response,
      session.getPlayerIds()
    )

    return { publicNarrative, privateMessages, stateChanges }
  }

  private validate(session: GameSession, card: CardDefinition, action: CardAction): void {
    if (session.currentTurn !== action.playerId) {
      throw new Error('不是你的回合')
    }
    if (!card.allowedTargets.includes(action.targetType) && card.allowedTargets.length > 0) {
      throw new Error(`此卡不能以${action.targetType}为目标`)
    }
    const player = session.getPlayer(action.playerId)
    if (!player || !player.handCards.includes(action.cardId)) {
      throw new Error('手牌中没有此卡')
    }
  }

  private parseResponse(raw: string, card: CardDefinition): AIResponse {
    if (!card.structuredOutput) {
      return { narrative: raw.trim() }
    }

    try {
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/)
      let narrative = raw
      let structured: any = {}

      if (jsonMatch) {
        narrative = raw.replace(/```json[\s\S]*?```/, '').trim()
        structured = JSON.parse(jsonMatch[1])
      } else {
        // 尝试直接解析整段为JSON
        try {
          structured = JSON.parse(raw)
          narrative = structured.narrative || ''
        } catch {
          narrative = raw
        }
      }

      return { narrative: narrative || raw, structured }
    } catch {
      return { narrative: raw }
    }
  }

  private applyEffects(
    session: GameSession,
    card: CardDefinition,
    action: CardAction,
    response: AIResponse
  ): StateChange[] {
    const changes: StateChange[] = []
    if (!response.structured) return changes

    const s = response.structured

    if (s.damage && (action.targetType === 'enemy' || action.targetType === 'npc')) {
      const npc = session.getNPC(action.targetId)
      if (npc) {
        npc.hp = Math.max(0, npc.hp - s.damage)
        changes.push({
          type: 'hp_change',
          targetId: action.targetId,
          targetType: 'npc',
          delta: -s.damage,
          newValue: npc.hp
        })
        if (npc.hp <= 0) {
          changes.push({
            type: 'npc_remove',
            targetId: action.targetId,
            targetType: 'npc'
          })
        }
      }
    }

    if (s.heal && (action.targetType === 'self' || action.targetType === 'ally')) {
      const target = session.getPlayer(action.targetId)
      if (target) {
        target.hp = Math.min(target.hp + s.heal, target.maxHp)
        changes.push({
          type: 'hp_change',
          targetId: action.targetId,
          targetType: 'player',
          delta: s.heal,
          newValue: target.hp
        })
      }
    }

    if (s.statusEffect) {
      const npc = session.getNPC(action.targetId)
      if (npc && (action.targetType === 'enemy' || action.targetType === 'npc')) {
        npc.status.push(s.statusEffect)
        changes.push({
          type: 'status_add',
          targetId: action.targetId,
          targetType: 'npc',
          value: s.statusEffect
        })
      }
    }

    return changes
  }

  private splitNarrative(
    response: AIResponse,
    allPlayerIds: string[]
  ): {
    publicNarrative: string
    privateMessages: Map<string, string>
  } {
    const privateMessages = new Map<string, string>()

    if (response.structured?.hiddenInfo && response.structured?.hiddenFor) {
      response.structured.hiddenFor.forEach(id => {
        privateMessages.set(id, response.structured!.hiddenInfo!)
      })

      return {
        publicNarrative: response.narrative + '\n*（某些信息仅对特定玩家可见）*',
        privateMessages
      }
    }

    return { publicNarrative: response.narrative, privateMessages }
  }
}
