export default function LobbyScreen({ sessionId, players, onStart, connected }: { sessionId: string; players: any[]; onStart: () => void; connected: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '18px' }}>
      <div style={{ color: '#888', fontSize: '15px', letterSpacing: '3px' }}>等 待 队 友</div>
      <div style={{ padding: '12px 24px', border: '1px solid #222', background: '#0a0a0a' }}>
        <div style={{ color: '#555', fontSize: '11px' }}>房间号</div>
        <div style={{ color: '#999', fontSize: '18px', letterSpacing: '2px', userSelect: 'all' }}>{sessionId}</div>
      </div>
      <div style={{ color: connected ? '#555' : '#333', fontSize: '11px' }}>{connected ? '[ 已连接 ]' : '[ 连接中... ]'}</div>
      <div style={{ minWidth: '300px' }}>
        <div style={{ color: '#555', fontSize: '11px', marginBottom: '6px' }}>已加入 ({players.length}/4)：</div>
        {players.map((p: any) => (
          <div key={p.id} style={{ padding: '6px 12px', margin: '2px 0', border: '1px solid #1a1a1a', background: '#0a0a0a', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#999' }}>{p.name}</span><span style={{ color: '#555', fontSize: '11px' }}>{p.rootType}</span>
          </div>
        ))}
      </div>
      <button onClick={onStart} disabled={players.length < 2} style={{ marginTop: '6px', padding: '8px 24px', border: players.length >= 2 ? '1px solid #555' : '1px solid #1a1a1a', color: players.length >= 2 ? '#999' : '#333', letterSpacing: '2px' }}>开 始 冒 险</button>
      {players.length < 2 && <div style={{ color: '#333', fontSize: '11px' }}>至少需要2名玩家</div>}
    </div>
  )
}
