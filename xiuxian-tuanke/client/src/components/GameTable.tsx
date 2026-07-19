import { useState, useMemo, useRef, useEffect } from 'react'

const CARD_DEFS: any[] = [
  { id: 'sword-fly', name: '御剑术', type: 'skill', allowedTargets: ['enemy', 'npc'], consumable: false },
  { id: 'qi-slash', name: '剑气斩', type: 'skill', allowedTargets: ['enemy'], consumable: false },
  { id: 'water-dragon', name: '水龙吟', type: 'skill', allowedTargets: ['enemy', 'npc'], consumable: false },
  { id: 'mountain-fist', name: '崩山拳', type: 'skill', allowedTargets: ['enemy'], consumable: false },
  { id: 'ice-curse', name: '寒冰咒', type: 'skill', allowedTargets: ['enemy', 'npc'], consumable: false },
  { id: 'healing-light', name: '治愈灵光', type: 'skill', allowedTargets: ['self', 'ally'], consumable: false },
  { id: 'flame-blast', name: '烈焰掌', type: 'skill', allowedTargets: ['enemy', 'npc'], consumable: false },
  { id: 'purple-sword', name: '紫电剑', type: 'equipment', allowedTargets: ['self'], consumable: false },
  { id: 'iron-vest', name: '玄铁护甲', type: 'equipment', allowedTargets: ['self'], consumable: false },
  { id: 'spirit-jade', name: '灵玉坠', type: 'equipment', allowedTargets: ['self'], consumable: false },
  { id: 'flame-gloves', name: '烈焰拳套', type: 'equipment', allowedTargets: ['self'], consumable: false },
  { id: 'cloud-boots', name: '踏云靴', type: 'equipment', allowedTargets: ['self'], consumable: false },
  { id: 'full-strike', name: '全力一击', type: 'action', allowedTargets: ['enemy', 'npc'], consumable: false },
  { id: 'defend-stance', name: '防御姿态', type: 'action', allowedTargets: ['self'], consumable: false },
  { id: 'search-area', name: '仔细搜索', type: 'action', allowedTargets: ['area'], consumable: false },
  { id: 'meditate', name: '打坐冥想', type: 'action', allowedTargets: ['self'], consumable: false },
  { id: 'spirit-eye', name: '灵目术', type: 'action', allowedTargets: ['area', 'obstacle', 'npc'], consumable: false },
  { id: 'spirit-pill', name: '聚灵丹', type: 'item', allowedTargets: ['self', 'ally'], consumable: true },
  { id: 'hp-pill', name: '回春丹', type: 'item', allowedTargets: ['self', 'ally'], consumable: true },
  { id: 'spirit-herb', name: '灵草', type: 'item', allowedTargets: [], consumable: false },
  { id: 'break-talisman', name: '破阵符', type: 'item', allowedTargets: ['obstacle', 'area'], consumable: true },
  { id: 'enlightenment-tea', name: '悟道茶', type: 'item', allowedTargets: ['self'], consumable: true }
]

const TYPE_LABEL: Record<string, string> = { skill: '技能', equipment: '装备', action: '行动', item: '物品' }

export default function GameTable({ selfInfo, players, npcs, log, handCards, currentTurn, turnOrder, currentNode, gameOver, onPlayCard, spiritStones, equipment }: any) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [supplement, setSupplement] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const isMyTurn = selfInfo?.id === currentTurn

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [log])

  const cardInfo = useMemo(() => selectedCard ? CARD_DEFS.find(c => c.id === selectedCard) : null, [selectedCard])

  const targets = useMemo(() => {
    if (!cardInfo || !selfInfo) return []
    const t: any[] = []
    if (cardInfo.allowedTargets.includes('self')) t.push({ id: selfInfo.id, label: `自己 (${selfInfo.name})`, type: 'self' })
    if (cardInfo.allowedTargets.includes('ally')) players.filter((p: any) => p.id !== selfInfo.id && p.hp > 0).forEach((p: any) => t.push({ id: p.id, label: `${p.name} [HP:${p.hp}]`, type: 'ally' }))
    if (cardInfo.allowedTargets.includes('enemy') || cardInfo.allowedTargets.includes('npc')) npcs.filter((n: any) => n.hp > 0).forEach((n: any) => t.push({ id: n.id, label: `${n.name} [HP:${n.hp}]`, type: n.faction === 'hostile' ? 'enemy' : 'npc' }))
    if (cardInfo.allowedTargets.includes('area')) t.push({ id: 'current', label: `当前场景: ${currentNode?.name || '???'}`, type: 'area' })
    if (cardInfo.allowedTargets.includes('obstacle')) { t.push({ id: 'bridge', label: '铁索桥', type: 'obstacle' }); t.push({ id: 'gate', label: '石门禁制', type: 'obstacle' }) }
    return t
  }, [cardInfo, selfInfo, players, npcs, currentNode])

  const handleCardClick = (id: string) => { if (!isMyTurn) return; setSelectedCard(prev => prev === id ? null : id) }
  const handleTarget = (t: any) => { if (!selectedCard) return; onPlayCard(selectedCard, t.id, t.type, supplement || undefined); setSelectedCard(null); setSupplement('') }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
      {/* 顶部状态 */}
      <div style={{ padding: '4px 12px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555' }}>
        <span>[{currentNode?.name || '???'}]</span>
        <span style={{ color: '#666' }}>灵石: {spiritStones} | 武器: {equipment?.weapon ? CARD_DEFS.find((c: any) => c.id === equipment.weapon)?.name || '?' : '无'} | 护甲: {equipment?.armor ? CARD_DEFS.find((c: any) => c.id === equipment.armor)?.name || '?' : '无'}</span>
        <span>{turnOrder.map((id: string) => { const p = players.find((pp: any) => pp.id === id); return p ? (id === currentTurn ? `[>${p.name}]` : p.name) : '?' }).join(' → ')}</span>
      </div>

      {/* 玩家行 */}
      <div style={{ display: 'flex', gap: '1px', padding: '2px 12px', borderBottom: '1px solid #1a1a1a', fontSize: '12px' }}>
        {players.map((p: any) => (
          <div key={p.id} style={{ padding: '4px 10px', background: p.id === currentTurn ? '#111' : '#0a0a0a', border: p.id === currentTurn ? '1px solid #444' : '1px solid #1a1a1a', opacity: p.hp <= 0 ? 0.5 : 1, minWidth: '110px' }}>
            <div style={{ color: p.id === currentTurn ? '#bbb' : '#777' }}>{p.id === currentTurn ? '> ' : '  '}{p.name}{p.id === selfInfo?.id ? ' [你]' : ''}{p.hp <= 0 ? ' [阵亡]' : ''}</div>
            <div style={{ color: '#555' }}>HP:{p.hp}/{p.maxHp} MP:{p.mp}/{p.maxMp} 盾:{p.shield||0}</div>
          </div>
        ))}
      </div>

      {/* 叙事区 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', lineHeight: 1.7, fontSize: '13px' }}>
        {log.map((entry: any, i: number) => (
          <div key={i} style={{ marginBottom: '4px', color: entry.type === 'dm' ? '#888' : entry.type === 'card' ? '#777' : entry.type === 'loot' ? '#999' : '#555', borderLeft: entry.type === 'dm' ? '2px solid #2a2a2a' : entry.type === 'card' ? '2px solid #1a1a1a' : 'none', paddingLeft: entry.type === 'dm' || entry.type === 'card' ? '8px' : '0' }}>
            {entry.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* NPC行 */}
      {npcs.length > 0 && (
        <div style={{ padding: '6px 12px', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '12px' }}>
          <span style={{ color: '#555' }}>敌人:</span>
          {npcs.map((n: any) => (
            <button key={n.id} onClick={() => { if (cardInfo && isMyTurn) handleTarget({ id: n.id, label: n.name, type: n.faction === 'hostile' ? 'enemy' : 'npc' }) }} disabled={n.hp <= 0} style={{ padding: '3px 8px', background: '#0a0a0a', border: '1px solid #1a1a1a', color: n.hp <= 0 ? '#333' : '#888', fontSize: '11px', opacity: n.hp <= 0 ? 0.5 : 1 }}>
              {n.name} [{n.hp}/{n.maxHp}]
            </button>
          ))}
        </div>
      )}

      {/* 补充输入 */}
      {selectedCard && isMyTurn && (
        <div style={{ padding: '4px 12px', display: 'flex', gap: '6px' }}>
          <input placeholder="补充描述(可选,限20字)" value={supplement} onChange={e => setSupplement(e.target.value.slice(0, 20))} style={{ flex: 1, fontSize: '12px' }} />
          <button onClick={() => { setSelectedCard(null); setSupplement('') }} style={{ fontSize: '11px', color: '#555' }}>取消</button>
        </div>
      )}

      {/* 目标选择 */}
      {selectedCard && cardInfo && isMyTurn && targets.length > 0 && (
        <div style={{ padding: '6px 12px', borderTop: '1px solid #1a1a1a', fontSize: '12px' }}>
          <div style={{ color: '#666', marginBottom: '4px' }}>对谁使用 [{cardInfo.name}]？</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {targets.map((t: any) => (
              <button key={t.id} onClick={() => handleTarget(t)} style={{ padding: '4px 10px', background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#888', fontSize: '11px' }}>{t.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* 手牌区 */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #1a1a1a', background: '#080808' }}>
        <div style={{ color: '#555', fontSize: '11px', marginBottom: '4px' }}>{isMyTurn ? '> 你的回合 — 选择卡牌：' : '  等待回合...'}</div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {handCards.map((cid: string) => {
            const info = CARD_DEFS.find(c => c.id === cid)
            const sel = selectedCard === cid
            return (
              <button key={cid} onClick={() => handleCardClick(cid)} disabled={!isMyTurn} style={{ padding: '6px 10px', background: sel ? '#1a1a1a' : '#0a0a0a', border: sel ? '1px solid #555' : '1px solid #1a1a1a', color: sel ? '#bbb' : '#888', fontSize: '12px', textAlign: 'left', minWidth: '80px', opacity: isMyTurn ? 1 : 0.5 }}>
                <div>{info?.name || cid}</div>
                {info && <div style={{ fontSize: '10px', color: '#555' }}>[{TYPE_LABEL[info.type] || info.type}]{info.consumable ? ' [消耗]' : ''}</div>}
              </button>
            )
          })}
          {handCards.length === 0 && <span style={{ color: '#333', fontSize: '12px' }}>— 无手牌 —</span>}
        </div>
      </div>

      {/* 游戏结束 */}
      {gameOver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#0a0a0a', border: '1px solid #333', padding: '36px 44px', textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ color: '#999', fontSize: '18px', marginBottom: '14px', letterSpacing: '3px' }}>{gameOver.victory ? '[ 冒 险 成 功 ]' : '[ 全 员 阵 亡 ]'}</div>
            <div style={{ color: '#777', lineHeight: 1.7 }}>{gameOver.message}</div>
            <button onClick={() => window.location.reload()} style={{ marginTop: '22px', padding: '8px 24px', border: '1px solid #555', color: '#999', letterSpacing: '2px' }}>再来一局</button>
          </div>
        </div>
      )}
    </div>
  )
}
