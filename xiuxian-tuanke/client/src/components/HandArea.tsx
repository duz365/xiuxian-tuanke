import { CardInfo } from '../types'

interface Props {
  handCards: string[]
  cardDefs: CardInfo[]
  selectedCardId: string | null
  onSelectCard: (cardId: string) => void
  isMyTurn: boolean
}

const TYPE_COLORS: Record<string, string> = {
  attack: '#e74c3c',
  defense: '#3498db',
  heal: '#2ecc71',
  scout: '#f39c12',
  movement: '#9b59b6',
  social: '#1abc9c',
  special: '#e2b04a'
}

const TYPE_LABELS: Record<string, string> = {
  attack: '攻击',
  defense: '防御',
  heal: '治疗',
  scout: '侦察',
  movement: '移动',
  social: '社交',
  special: '特殊'
}

export default function HandArea({ handCards, cardDefs, selectedCardId, onSelectCard, isMyTurn }: Props) {
  const getCardInfo = (cardId: string): CardInfo | undefined => {
    return cardDefs.find(c => c.id === cardId)
  }

  return (
    <div style={{
      padding: '12px',
      background: '#0d1b2a',
      borderTop: '2px solid #1b2838'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'
      }}>
        <span style={{ color: '#8a8a9a', fontSize: '0.85em' }}>你的手牌</span>
        {!isMyTurn && (
          <span style={{ color: '#e74c3c', fontSize: '0.8em' }}>（等待你的回合）</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {handCards.map(cardId => {
          const info = getCardInfo(cardId)
          if (!info) return null

          const isSelected = selectedCardId === cardId
          return (
            <button
              key={cardId}
              onClick={() => isMyTurn && onSelectCard(cardId)}
              disabled={!isMyTurn}
              style={{
                padding: '10px 14px',
                background: isSelected ? '#1a3a5c' : '#16213e',
                border: isSelected
                  ? `2px solid ${TYPE_COLORS[info.type] || '#e2b04a'}`
                  : '1px solid #333',
                borderRadius: '8px',
                cursor: isMyTurn ? 'pointer' : 'not-allowed',
                color: '#e0d8c8',
                minWidth: '100px',
                textAlign: 'left',
                opacity: isMyTurn ? 1 : 0.6,
                transition: 'all 0.15s'
              }}
            >
              <div style={{
                fontWeight: 'bold', fontSize: '0.95em',
                color: TYPE_COLORS[info.type] || '#e0d8c8'
              }}>
                {info.name}
              </div>
              <div style={{
                fontSize: '0.7em', color: '#8a8a9a', marginTop: '2px'
              }}>
                {TYPE_LABELS[info.type] || info.type}
                {info.consumable && ' · 消耗品'}
              </div>
            </button>
          )
        })}
        {handCards.length === 0 && (
          <span style={{ color: '#555' }}>暂无手牌</span>
        )}
      </div>
    </div>
  )
}
