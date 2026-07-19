import { useState } from 'react'
const CHARS = [{ name: '凌霄', desc: '金灵根·剑修·攻守兼备' }, { name: '青鸾', desc: '水灵根·法修·灵力充沛' }, { name: '石岩', desc: '土灵根·体修·坚韧不拔' }]

export default function LoginScreen({ onCreate, onJoin }: { onCreate: (n: string) => void; onJoin: (n: string, s: string) => void }) {
  const [name, setName] = useState('凌霄')
  const [joinId, setJoinId] = useState('')
  const [mode, setMode] = useState<'create'|'join'>('create')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
      <pre style={{ color: '#666', fontSize: '11px', lineHeight: 1.2 }}>{`
    ██╗██╗   ██╗██╗   ██╗
    ██║╚██╗ ██╔╝██║   ██║
    ██║ ╚████╔╝ ██║   ██║
    ██║  ╚██╔╝  ██║   ██║
    ██║   ██║   ╚██████╔╝
    ╚═╝   ╚═╝    ╚═════╝
      `}</pre>
      <div style={{ color: '#999', fontSize: '20px', letterSpacing: '6px' }}>九 嶷 洞 天</div>
      <div style={{ color: '#555', fontSize: '12px' }}>修仙跑团 · MUD</div>

      <div style={{ display: 'flex', gap: '1px', marginTop: '8px' }}>
        <button onClick={() => setMode('create')} style={{ background: mode === 'create' ? '#111' : '#0a0a0a', border: mode === 'create' ? '1px solid #555' : '1px solid #1a1a1a', color: mode === 'create' ? '#aaa' : '#555' }}>[ 创建房间 ]</button>
        <button onClick={() => setMode('join')} style={{ background: mode === 'join' ? '#111' : '#0a0a0a', border: mode === 'join' ? '1px solid #555' : '1px solid #1a1a1a', color: mode === 'join' ? '#aaa' : '#555' }}>[ 加入房间 ]</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '340px' }}>
        <div style={{ color: '#666', fontSize: '12px' }}>选择角色：</div>
        {CHARS.map(c => (
          <button key={c.name} onClick={() => setName(c.name)} style={{ padding: '10px 14px', textAlign: 'left', background: name === c.name ? '#111' : '#0a0a0a', border: name === c.name ? '1px solid #666' : '1px solid #1a1a1a', color: name === c.name ? '#bbb' : '#666' }}>
            <span style={{ fontSize: '14px' }}>{c.name}</span>
            <span style={{ marginLeft: '10px', color: '#444', fontSize: '11px' }}>{c.desc}</span>
          </button>
        ))}
        {mode === 'join' && <input placeholder="输入房间号..." value={joinId} onChange={e => setJoinId(e.target.value)} style={{ marginTop: '4px' }} />}
        <button onClick={() => mode === 'create' ? onCreate(name) : onJoin(name, joinId)} disabled={mode === 'join' && !joinId} style={{ marginTop: '6px', padding: '10px', border: '1px solid #555', color: '#aaa', letterSpacing: '2px' }}>
          {mode === 'create' ? '创 建 房 间' : '加 入 房 间'}
        </button>
      </div>
    </div>
  )
}
