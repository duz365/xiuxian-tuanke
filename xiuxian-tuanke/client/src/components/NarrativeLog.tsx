import { useEffect, useRef } from 'react'
import { GameLogEntry } from '../types'

interface Props {
  log: GameLogEntry[]
}

export default function NarrativeLog({ log }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '16px',
      lineHeight: '1.8', fontSize: '0.95em'
    }}>
      {log.map((entry, i) => (
        <div
          key={i}
          style={{
            marginBottom: '10px',
            padding: entry.type === 'dm' ? '8px 12px' : '4px 0',
            background: entry.type === 'dm' ? '#16213e' : 'transparent',
            borderRadius: '6px',
            borderLeft: entry.type === 'dm' ? '3px solid #e2b04a' :
                        entry.type === 'card' ? '3px solid #3498db' : 'none',
            color: entry.type === 'system' ? '#8a8a9a' : '#e0d8c8',
            fontStyle: entry.type === 'dm' ? 'normal' : undefined
          }}
        >
          {entry.text}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
