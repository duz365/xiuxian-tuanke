import { PlayerState } from '../types'

interface Props {
  players: PlayerState[]
  currentTurn: string
  selfId: string
}

export default function PlayerBar({ players, currentTurn, selfId }: Props) {
  return (
    <div style={{
      display: 'flex', gap: '12px', padding: '8px 12px',
      background: '#0d1b2a', borderBottom: '1px solid #1b2838'
    }}>
      {players.map(p => (
        <div key={p.id} style={{
          padding: '8px 14px',
          background: p.id === currentTurn ? '#1a3a5c' : '#16213e',
          border: p.id === currentTurn ? '2px solid #e2b04a' : '1px solid #333',
          borderRadius: '6px',
          minWidth: '140px',
          opacity: p.hp <= 0 ? 0.5 : 1
        }}>
          <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {p.id === currentTurn && <span style={{ color: '#e2b04a' }}>▶</span>}
            {p.name}
            {p.id === selfId && <span style={{ fontSize: '0.7em', color: '#e2b04a' }}>(你)</span>}
            {p.hp <= 0 && <span style={{ color: '#e74c3c', fontSize: '0.8em' }}>💀</span>}
          </div>
          <div style={{ fontSize: '0.8em', color: '#8a8a9a' }}>{p.rootType} · {p.trait}</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '0.85em' }}>
            <span style={{ color: '#e74c3c' }}>HP {p.hp}/{p.maxHp}</span>
            <span style={{ color: '#3498db' }}>MP {p.mp}/{p.maxMp}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
