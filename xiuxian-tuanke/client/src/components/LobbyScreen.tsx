import { PlayerState } from '../types'

interface Props {
  sessionId: string
  players: PlayerState[]
  onStart: () => void
  connected: boolean
}

export default function LobbyScreen({ sessionId, players, onStart, connected }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: '24px'
    }}>
      <h2 style={{ color: '#e2b04a' }}>房间等待中</h2>

      <div style={{
        background: '#16213e', padding: '16px 24px', borderRadius: '8px',
        border: '1px solid #e2b04a'
      }}>
        <p style={{ color: '#8a8a9a', marginBottom: '8px' }}>房间号</p>
        <p style={{ fontSize: '1.5em', letterSpacing: '3px', color: '#e2b04a', userSelect: 'all' }}>
          {sessionId}
        </p>
      </div>

      <div style={{ color: '#8a8a9a' }}>
        {connected ? '🟢 已连接' : '🔴 连接中...'}
      </div>

      <div style={{ minWidth: '300px' }}>
        <h3 style={{ color: '#8a8a9a', marginBottom: '8px' }}>
          已加入玩家 ({players.length})
        </h3>
        {players.map(p => (
          <div key={p.id} style={{
            padding: '8px 12px', margin: '4px 0',
            background: '#16213e', borderRadius: '4px',
            display: 'flex', justifyContent: 'space-between'
          }}>
            <span>{p.name}</span>
            <span style={{ color: '#8a8a9a' }}>{p.rootType}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        disabled={players.length < 2}
        style={{
          padding: '12px 32px',
          background: players.length >= 2 ? '#e2b04a' : '#555',
          color: '#1a1a2e',
          border: 'none', fontWeight: 'bold', cursor: players.length >= 2 ? 'pointer' : 'not-allowed',
          opacity: players.length >= 2 ? 1 : 0.5
        }}
      >
        开始冒险
      </button>

      {players.length < 2 && (
        <p style={{ color: '#8a8a9a', fontSize: '0.9em' }}>至少需要2名玩家</p>
      )}
    </div>
  )
}
