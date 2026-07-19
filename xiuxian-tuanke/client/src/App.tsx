import { useState, useEffect, useCallback } from 'react'
import { socket } from './socket'
import LoginScreen from './components/LoginScreen'
import LobbyScreen from './components/LobbyScreen'
import GameTable from './components/GameTable'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState<'login'|'lobby'|'game'>('login')
  const [sessionId, setSessionId] = useState('')
  const [selfInfo, setSelfInfo] = useState<any>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [npcs, setNPCs] = useState<any[]>([])
  const [log, setLog] = useState<any[]>([])
  const [handCards, setHandCards] = useState<string[]>([])
  const [currentTurn, setCurrentTurn] = useState('')
  const [turnOrder, setTurnOrder] = useState<string[]>([])
  const [currentNode, setCurrentNode] = useState<any>(null)
  const [gameOver, setGameOver] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [spiritStones, setSpiritStones] = useState(0)
  const [equipment, setEquipment] = useState<any>({})

  useEffect(() => {
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('PLAYER_JOINED', (data: any) => setPlayers((prev: any[]) => { if (prev.find((p: any) => p.id === data.player.id)) return prev; return [...prev, data.player] }))
    socket.on('SELF_INFO', (data: any) => {
      setHandCards(data.handCards)
      setSpiritStones(data.spiritStones)
      setEquipment(data.equipment || {})
      setSelfInfo((prev: any) => ({ ...prev, id: data.playerId, handCards: data.handCards, traitDescription: data.traitDescription }))
    })
    socket.on('GAME_STARTED', (state: any) => {
      setPlayers(state.players); setNPCs(state.activeNPCs || []); setCurrentTurn(state.currentTurn); setTurnOrder(state.turnOrder); setCurrentNode(state.currentNode); setScreen('game')
    })
    socket.on('NARRATIVE', (data: any) => setLog((prev: any[]) => [...prev, { ...data, timestamp: Date.now() }]))
    socket.on('PRIVATE_INFO', (data: any) => setLog((prev: any[]) => [...prev, { text: `[私] ${data.text}`, type: 'system', timestamp: Date.now() }]))
    socket.on('STATE_UPDATE', (data: any) => { setPlayers(data.players); setNPCs(data.npcs); if (data.currentNode) setCurrentNode(data.currentNode) })
    socket.on('HAND_UPDATE', (data: any) => { setHandCards(data.handCards); setSpiritStones(data.spiritStones); setEquipment(data.equipment || {}) })
    socket.on('TURN_CHANGE', (data: any) => { setCurrentTurn(data.currentTurn); setTurnOrder(data.turnOrder) })
    socket.on('GAME_OVER', (data: any) => setGameOver(data))
    socket.on('CHAT', (data: any) => setLog((prev: any[]) => [...prev, { text: `${data.playerName}: ${data.message}`, type: 'system', timestamp: Date.now() }]))
    socket.on('ERROR', (data: any) => setLog((prev: any[]) => [...prev, { text: `[错误] ${data.message}`, type: 'system', timestamp: Date.now() }]))
    return () => { socket.off('connect'); socket.off('disconnect'); socket.off('PLAYER_JOINED'); socket.off('SELF_INFO'); socket.off('GAME_STARTED'); socket.off('NARRATIVE'); socket.off('PRIVATE_INFO'); socket.off('STATE_UPDATE'); socket.off('HAND_UPDATE'); socket.off('TURN_CHANGE'); socket.off('GAME_OVER'); socket.off('CHAT'); socket.off('ERROR') }
  }, [])

  const handleCreate = useCallback(async (name: string) => {
    try {
      const res = await fetch('/api/sessions', { method: 'POST' })
      const { sessionId: sid } = await res.json()
      setSessionId(sid)
      socket.connect()
      socket.emit('JOIN_SESSION', { sessionId: sid, playerName: name })
      setSelfInfo({ id: '', name })
      setScreen('lobby')
    } catch { alert('创建房间失败') }
  }, [])

  const handleJoin = useCallback(async (name: string, sid: string) => {
    setSessionId(sid)
    socket.connect()
    socket.emit('JOIN_SESSION', { sessionId: sid, playerName: name })
    setSelfInfo({ id: '', name })
    setScreen('lobby')
  }, [])

  const handleStart = useCallback(() => socket.emit('START_GAME', { sessionId }), [sessionId])
  const handlePlay = useCallback((cardId: string, targetId: string, targetType: string, supplement?: string) => {
    socket.emit('PLAY_CARD', { sessionId, playerId: selfInfo?.id, cardId, targetId, targetType, supplement })
  }, [sessionId, selfInfo])

  if (screen === 'login') return <LoginScreen onCreate={handleCreate} onJoin={handleJoin} />
  if (screen === 'lobby') return <LobbyScreen sessionId={sessionId} players={players} onStart={handleStart} connected={connected} />
  return <GameTable selfInfo={selfInfo} players={players} npcs={npcs} log={log} handCards={handCards} currentTurn={currentTurn} turnOrder={turnOrder} currentNode={currentNode} gameOver={gameOver} onPlayCard={handlePlay} spiritStones={spiritStones} equipment={equipment} />
}
