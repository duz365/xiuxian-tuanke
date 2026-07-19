import { useState, useMemo } from 'react'
import { PlayerState, SelfInfo, NPCState, GameLogEntry, ScriptNodeInfo, TargetOption, CardInfo } from '../types'
import PlayerBar from './PlayerBar'
import NarrativeLog from './NarrativeLog'
import NPCList from './NPCList'
import HandArea from './HandArea'
import TargetSelector from './TargetSelector'

interface Props {
  sessionId: string
  selfInfo: SelfInfo | null
  players: PlayerState[]
  npcs: NPCState[]
  log: GameLogEntry[]
  handCards: string[]
  currentTurn: string
  turnOrder: string[]
  currentNode: ScriptNodeInfo | null
  gameOver: { victory: boolean; message: string } | null
  onPlayCard: (cardId: string, targetId: string, targetType: string, supplement?: string) => void
}

const CARD_DEFS: CardInfo[] = [
  { id: 'sword-fly', name: '御剑术', type: 'attack', allowedTargets: ['enemy', 'npc'], consumable: false },
  { id: 'qi-slash', name: '剑气斩', type: 'attack', allowedTargets: ['enemy'], consumable: false },
  { id: 'water-dragon', name: '水龙吟', type: 'attack', allowedTargets: ['enemy', 'npc'], consumable: false },
  { id: 'mountain-fist', name: '崩山拳', type: 'attack', allowedTargets: ['enemy'], consumable: false },
  { id: 'ice-curse', name: '寒冰咒', type: 'attack', allowedTargets: ['enemy', 'npc'], consumable: false },
  { id: 'gold-shield', name: '金盾诀', type: 'defense', allowedTargets: ['self', 'ally'], consumable: false },
  { id: 'diamond-body', name: '金刚体', type: 'defense', allowedTargets: ['self'], consumable: false },
  { id: 'spirit-rain', name: '灵雨术', type: 'heal', allowedTargets: ['self', 'ally'], consumable: false },
  { id: 'spirit-eye', name: '灵目术', type: 'scout', allowedTargets: ['area', 'obstacle', 'npc'], consumable: false },
  { id: 'qi-gaze', name: '望气术', type: 'scout', allowedTargets: ['area', 'npc'], consumable: false },
  { id: 'earth-listen', name: '地听术', type: 'scout', allowedTargets: ['area'], consumable: false },
  { id: 'earth-escape', name: '土遁术', type: 'movement', allowedTargets: ['obstacle'], consumable: false },
  { id: 'wind-ride', name: '御风术', type: 'movement', allowedTargets: ['area'], consumable: false },
  { id: 'spirit-pressure', name: '灵压外放', type: 'social', allowedTargets: ['npc'], consumable: false },
  { id: 'soul-search', name: '搜魂术', type: 'social', allowedTargets: ['npc'], consumable: false },
  { id: 'spirit-pill', name: '聚灵丹', type: 'special', allowedTargets: ['self', 'ally'], consumable: true },
  { id: 'break-talisman', name: '破阵符', type: 'special', allowedTargets: ['obstacle', 'area'], consumable: true },
  { id: 'help-talisman', name: '求救信符', type: 'special', allowedTargets: [], consumable: true },
  { id: 'enlightenment', name: '顿悟', type: 'special', allowedTargets: ['self'], consumable: false },
  { id: 'reinforce', name: '灵力共鸣', type: 'special', allowedTargets: ['ally'], consumable: false },
  { id: 'transfer', name: '灵力渡让', type: 'special', allowedTargets: ['ally'], consumable: false },
  { id: 'cover', name: '掩护', type: 'defense', allowedTargets: ['ally'], consumable: false }
]

export default function GameTable({
  selfInfo, players, npcs, log, handCards, currentTurn, turnOrder,
  currentNode, gameOver, onPlayCard
}: Props) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [supplement, setSupplement] = useState('')

  const isMyTurn = selfInfo?.id === currentTurn

  const selectedCard = useMemo(() => {
    if (!selectedCardId) return null
    return CARD_DEFS.find(c => c.id === selectedCardId) || null
  }, [selectedCardId])

  const getAvailableTargets = (): TargetOption[] => {
    if (!selectedCard || !selfInfo) return []

    const targets: TargetOption[] = []

    if (selectedCard.allowedTargets.includes('self')) {
      targets.push({ id: selfInfo.id, label: `自己（${selfInfo.name}）`, type: 'self' })
    }

    if (selectedCard.allowedTargets.includes('ally')) {
      players
        .filter(p => p.id !== selfInfo.id && p.hp > 0)
        .forEach(p => targets.push({
          id: p.id,
          label: `${p.name}（${p.rootType} · HP ${p.hp}/${p.maxHp}）`,
          type: 'ally'
        }))
    }

    if (selectedCard.allowedTargets.includes('enemy') || selectedCard.allowedTargets.includes('npc')) {
      npcs
        .filter(n => n.hp > 0)
        .forEach(n => targets.push({
          id: n.id,
          label: `${n.faction === 'hostile' ? '⚔️ ' : ''}${n.name}（HP ${n.hp}/${n.maxHp}）`,
          type: n.faction === 'hostile' ? 'enemy' : 'npc'
        }))
    }

    if (selectedCard.allowedTargets.includes('area')) {
      targets.push({ id: 'current', label: `当前场景：${currentNode?.name || '未知'}`, type: 'area' })
    }

    if (selectedCard.allowedTargets.includes('obstacle')) {
      targets.push(
        { id: 'bridge', label: '铁索桥', type: 'obstacle' },
        { id: 'gate', label: '石门禁制', type: 'obstacle' },
        { id: 'swamp', label: '毒瘴', type: 'obstacle' }
      )
    }

    return targets
  }

  const handleCardClick = (cardId: string) => {
    if (!isMyTurn) return
    setSelectedCardId(prev => prev === cardId ? null : cardId)
  }

  const handleTargetSelect = (target: TargetOption) => {
    if (!selectedCardId) return
    onPlayCard(selectedCardId, target.id, target.type, supplement || undefined)
    setSelectedCardId(null)
    setSupplement('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 场景信息 */}
      {currentNode && (
        <div style={{
          padding: '8px 16px', background: '#0d1b2a',
          borderBottom: '1px solid #1b2838',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontSize: '0.85em'
        }}>
          <span>
            📍 <strong style={{ color: '#e2b04a' }}>{currentNode.name}</strong>
            <span style={{ color: '#8a8a9a', marginLeft: '8px' }}>{currentNode.description.slice(0, 40)}...</span>
          </span>
          <span style={{ color: '#8a8a9a' }}>
            回合顺序：{turnOrder.map(id => {
              const p = players.find(pp => pp.id === id)
              return p ? (id === currentTurn ? `▶${p.name}` : p.name) : '?'
            }).join(' → ')}
          </span>
        </div>
      )}

      {/* 玩家状态栏 */}
      <PlayerBar players={players} currentTurn={currentTurn} selfId={selfInfo?.id || ''} />

      {/* 主体区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 叙事日志 */}
        <NarrativeLog log={log} />

        {/* NPC列表 */}
        <NPCList
          npcs={npcs}
          onSelect={(npc) => {
            if (!selectedCard || !isMyTurn) return
            const targetType = npc.faction === 'hostile' ? 'enemy' : 'npc'
            onPlayCard(selectedCardId!, npc.id, targetType, supplement || undefined)
            setSelectedCardId(null)
            setSupplement('')
          }}
        />

        {/* 补充输入框 */}
        {selectedCard && isMyTurn && (
          <div style={{ padding: '4px 12px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="补充描述（可选，限20字）"
              value={supplement}
              onChange={e => setSupplement(e.target.value.slice(0, 20))}
              style={{
                flex: 1, padding: '6px 10px',
                background: '#16213e', color: '#e0d8c8',
                border: '1px solid #555', borderRadius: '4px',
                outline: 'none', fontSize: '0.85em'
              }}
            />
            <button
              onClick={() => {
                setSelectedCardId(null)
                setSupplement('')
              }}
              style={{
                padding: '6px 14px',
                background: 'transparent', border: '1px solid #555',
                color: '#8a8a9a', cursor: 'pointer', borderRadius: '4px'
              }}
            >
              取消
            </button>
          </div>
        )}
      </div>

      {/* 手牌区 */}
      <HandArea
        handCards={handCards}
        cardDefs={CARD_DEFS}
        selectedCardId={selectedCardId}
        onSelectCard={handleCardClick}
        isMyTurn={isMyTurn}
      />

      {/* 目标选择器弹窗 */}
      {selectedCard && isMyTurn && (
        <TargetSelector
          targets={getAvailableTargets()}
          onSelect={handleTargetSelect}
          onCancel={() => { setSelectedCardId(null); setSupplement('') }}
          cardName={selectedCard.name}
        />
      )}

      {/* 游戏结束弹窗 */}
      {gameOver && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200
        }}>
          <div style={{
            background: '#16213e', borderRadius: '16px',
            padding: '40px', textAlign: 'center',
            border: `3px solid ${gameOver.victory ? '#e2b04a' : '#e74c3c'}`,
            maxWidth: '500px'
          }}>
            <h2 style={{
              color: gameOver.victory ? '#e2b04a' : '#e74c3c',
              fontSize: '2em', marginBottom: '16px'
            }}>
              {gameOver.victory ? '🏆 冒险成功！' : '💀 冒险失败'}
            </h2>
            <p style={{ color: '#e0d8c8', fontSize: '1.1em', lineHeight: '1.6' }}>
              {gameOver.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '24px', padding: '10px 32px',
                background: '#e2b04a', color: '#1a1a2e',
                border: 'none', borderRadius: '6px',
                fontWeight: 'bold', cursor: 'pointer', fontSize: '1em'
              }}
            >
              再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
