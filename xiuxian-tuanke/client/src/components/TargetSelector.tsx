import { TargetOption } from '../types'

interface Props {
  targets: TargetOption[]
  onSelect: (target: TargetOption) => void
  onCancel: () => void
  cardName: string
}

export default function TargetSelector({ targets, onSelect, onCancel, cardName }: Props) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100
    }}>
      <div style={{
        background: '#16213e', borderRadius: '12px',
        padding: '24px', minWidth: '300px',
        border: '1px solid #e2b04a'
      }}>
        <h3 style={{ color: '#e2b04a', marginBottom: '4px' }}>
          选择目标
        </h3>
        <p style={{ color: '#8a8a9a', marginBottom: '16px', fontSize: '0.9em' }}>
          对谁使用【{cardName}】？
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {targets.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              style={{
                padding: '10px 16px',
                background: '#1a1a2e',
                border: '1px solid #555',
                borderRadius: '6px',
                color: '#e0d8c8',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {t.label}
              <span style={{ color: '#8a8a9a', fontSize: '0.8em', marginLeft: '8px' }}>
                ({t.type})
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          style={{
            marginTop: '16px', padding: '8px 16px',
            background: 'transparent', border: '1px solid #555',
            borderRadius: '4px', color: '#8a8a9a', cursor: 'pointer',
            width: '100%'
          }}
        >
          取消
        </button>
      </div>
    </div>
  )
}
