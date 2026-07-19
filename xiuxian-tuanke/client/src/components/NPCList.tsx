import { NPCState } from '../types'

interface Props {
  npcs: NPCState[]
  onSelect: (npc: NPCState) => void
  selectedId?: string
}

export default function NPCList({ npcs, onSelect, selectedId }: Props) {
  if (npcs.length === 0) return null

  return (
    <div style={{
      display: 'flex', gap: '10px', padding: '8px 12px',
      flexWrap: 'wrap', borderTop: '1px solid #1b2838'
    }}>
      {npcs.map(npc => (
        <button
          key={npc.id}
          onClick={() => onSelect(npc)}
          style={{
            padding: '6px 14px',
            background: selectedId === npc.id ? '#3a1a1a' : '#16213e',
            border: npc.faction === 'hostile'
              ? `1px solid ${selectedId === npc.id ? '#e74c3c' : '#8b0000'}`
              : `1px solid ${selectedId === npc.id ? '#27ae60' : '#1a4a2a'}`,
            borderRadius: '4px',
            color: selectedId === npc.id ? '#fff' : '#e0d8c8',
            cursor: 'pointer',
            opacity: npc.hp <= 0 ? 0.4 : 1
          }}
          disabled={npc.hp <= 0}
        >
          <div style={{ fontWeight: 'bold', fontSize: '0.9em' }}>
            {npc.faction === 'hostile' ? '⚔️ ' : ''}{npc.name}
          </div>
          <div style={{ fontSize: '0.75em', color: '#e74c3c' }}>
            HP {npc.hp}/{npc.maxHp}
          </div>
          {npc.status.length > 0 && (
            <div style={{ fontSize: '0.7em', color: '#e2b04a' }}>
              {npc.status.join(' · ')}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
