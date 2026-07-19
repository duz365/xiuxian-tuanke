import { useState } from 'react'

const CHARACTERS = ['凌霄', '青鸾', '石岩']

interface Props {
  onCreate: (name: string) => void
  onJoin: (name: string, sessionId: string) => void
}

export default function LoginScreen({ onCreate, onJoin }: Props) {
  const [name, setName] = useState('凌霄')
  const [joinId, setJoinId] = useState('')
  const [mode, setMode] = useState<'create' | 'join'>('create')

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: '20px'
    }}>
      <h1 style={{ color: '#e2b04a', fontSize: '2.5em', letterSpacing: '4px' }}>
        九嶷洞天
      </h1>
      <p style={{ color: '#8a8a9a' }}>修仙跑团 · 多人协作探索</p>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setMode('create')}
          style={{
            padding: '8px 24px',
            background: mode === 'create' ? '#0f3460' : '#16213e',
            color: '#e0d8c8', border: '1px solid #e2b04a',
            cursor: 'pointer'
          }}
        >
          创建房间
        </button>
        <button
          onClick={() => setMode('join')}
          style={{
            padding: '8px 24px',
            background: mode === 'join' ? '#0f3460' : '#16213e',
            color: '#e0d8c8', border: '1px solid #e2b04a',
            cursor: 'pointer'
          }}
        >
          加入房间
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '300px' }}>
        <label style={{ color: '#8a8a9a' }}>选择角色</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {CHARACTERS.map(c => (
            <button
              key={c}
              onClick={() => setName(c)}
              style={{
                padding: '8px 16px',
                background: name === c ? '#0f3460' : '#16213e',
                color: name === c ? '#e2b04a' : '#e0d8c8',
                border: name === c ? '2px solid #e2b04a' : '1px solid #555',
                cursor: 'pointer'
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {mode === 'join' && (
          <input
            type="text"
            placeholder="输入房间号"
            value={joinId}
            onChange={e => setJoinId(e.target.value)}
            style={{
              padding: '8px 12px', background: '#16213e', color: '#e0d8c8',
              border: '1px solid #555', outline: 'none'
            }}
          />
        )}

        <button
          onClick={() => mode === 'create' ? onCreate(name) : onJoin(name, joinId)}
          disabled={mode === 'join' && !joinId}
          style={{
            padding: '10px', marginTop: '8px',
            background: '#e2b04a', color: '#1a1a2e',
            border: 'none', fontWeight: 'bold', cursor: 'pointer',
            opacity: mode === 'join' && !joinId ? 0.5 : 1
          }}
        >
          {mode === 'create' ? '创建房间' : '加入房间'}
        </button>
      </div>
    </div>
  )
}
