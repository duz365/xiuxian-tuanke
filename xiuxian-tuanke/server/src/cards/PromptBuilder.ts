import { CardDefinition, CardAction, Player, NPC } from '../types'
import { GameSession } from '../game/GameSession'

export class PromptBuilder {
  build(
    card: CardDefinition,
    action: CardAction,
    session: GameSession
  ): { systemPrompt: string; userPrompt: string } {
    const caster = session.getPlayer(action.playerId)
    if (!caster) throw new Error('玩家不存在')

    const target = this.getTargetDescription(action, session)
    const scene = session.getCurrentSceneDescription()
    const node = session.getCurrentNode()

    const statValue = card.params.stat ? caster.stats[card.params.stat] : 10
    const modifier = card.params.modifier || 0
    const dcModifier = card.params.dcModifier || 0
    const baseDC = node?.difficulty || 12
    const dc = baseDC + dcModifier

    const damage = card.params.dice ? this.rollDice(card.params.dice) : 0
    const heal = card.params.heal ? this.rollDice(card.params.heal) : 0

    // 系统Prompt
    const systemPrompt = `你是一个修仙跑团游戏的地下城主（DM）。

游戏设定：修真世界，九嶷山秘境探索。

当前场景：${scene}

叙述要求：以DM口吻直接描述发生的事。不要替玩家做决定，不要询问玩家。描述客观、简洁、有画面感。

${card.tone ? `语言风格参考：${card.tone}。` : ''}

${card.maxResponseLength ? `回复控制在${card.maxResponseLength}字以内。` : ''}

${
  card.structuredOutput
    ? `必须在叙事文本之后附加一个JSON对象，用\`\`\`json包裹。JSON包含字段：${card.structuredOutput.fields.join(', ')}。dcResult取值"success"或"fail"或"critical"。叙事文本放在JSON的narrative字段中。`
    : ''
}`

    // 用户Prompt
    let userPrompt = card.aiPromptTemplate
      .replace(/\{caster\}/g, caster.name)
      .replace(/\{target\}/g, target)
      .replace(/\{stat\}/g, String(statValue + modifier))
      .replace(/\{dc\}/g, String(dc))
      .replace(/\{damage\}/g, String(damage))
      .replace(/\{heal\}/g, String(heal))
      .replace(/\{maxLength\}/g, String(card.maxResponseLength || 100))
      .replace(/\{tone\}/g, card.tone || '仙侠')

    // 处理隐藏信息指令
    if (userPrompt.includes('{hiddenInstruction}')) {
      userPrompt = userPrompt.replace(
        '{hiddenInstruction}',
        '如果你判断有仅特定玩家应知晓的信息（如隐藏线索、秘密通道、暗中观察到的细节），请在JSON中设置hiddenInfo字段描述该信息，并在hiddenFor数组中列出应接收此信息的玩家ID列表。其他玩家不应看到这些信息。'
      )
    }

    // 补充描述
    if (action.supplement) {
      userPrompt += `\n玩家额外说明：${action.supplement}`
    }

    // JSON输出格式要求
    if (card.structuredOutput) {
      userPrompt += `\n\n请严格按照以下格式输出：

叙事文本内容...

\`\`\`json
{
${card.structuredOutput.fields.map(f => `  "${f}": ...`).join(',\n')}
}
\`\`\``
    }

    return { systemPrompt, userPrompt }
  }

  private getTargetDescription(action: CardAction, session: GameSession): string {
    switch (action.targetType) {
      case 'self': {
        const player = session.getPlayer(action.playerId)
        return `自己（${player?.name || '施法者'}）`
      }
      case 'ally': {
        const ally = session.getPlayer(action.targetId)
        return ally ? `${ally.name}（${ally.rootType}修士）` : '队友'
      }
      case 'enemy':
      case 'npc': {
        const npc = session.getNPC(action.targetId)
        return npc ? `${npc.name}（${npc.description}）` : '目标'
      }
      case 'area':
        return session.getAreaDescription(action.targetId)
      case 'obstacle':
        return session.getObstacleDescription(action.targetId)
      default:
        return '目标'
    }
  }

  private rollDice(diceExpr: string): number {
    const match = diceExpr.match(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?/)
    if (!match) return 0
    const count = parseInt(match[1])
    const sides = parseInt(match[2])
    const bonus = match[3] ? parseInt(match[3]) : 0
    let total = bonus
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1
    }
    return total
  }
}
