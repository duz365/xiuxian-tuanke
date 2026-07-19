import { useState, useEffect, useCallback } from 'react'
import { socket } from './socket'
import LoginScreen from './components/LoginScreen'
import LobbyScreen from './components/LobbyScreen'
import GameTable from './components/GameTable'
import { PlayerState, SelfInfo, NPCState, GameLogEntry, CardInfo, ScriptNodeInfo } from './types'
import './App.css'

type Screen = 'login' | 'lobby' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [sessionId, setSessionId] = useState<string>('')
  const [selfInfo, setSelfInfo] = useState<SelfInfo | null>(null)
  const [players, setPlayers] = useState<PlayerState[]>([])
  const [npcs, setNPCs] = useState<NPCState[]>([])
  const [log, setLog] = useState<GameLogEntry[]>([])
  const [handCards, setHandCards] = useState<string[]>([])
  const [currentTurn, setCurrentTurn] = useState<string>('')
  const [turnOrder, setTurnOrder] = useState<string[]>([])
  const [currentNode, setCurrentNode] = useState<ScriptNodeInfo | null>(null)
  const [gameOver, setGameOver] = useState<{ victory: boolean; message: string } | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('PLAYER_JOINED', (data: { player: PlayerState; playerCount: number }) => {
      setPlayers(prev => {
        if (prev.find(p => p.id === data.player.id)) return prev
        return [...prev, data.player]
      })
    })

    socket.on('SELF_INFO', (data: { playerId: string; handCards: string[]; stats: any; traitDescription: string }) => {
      setHandCards(data.handCards)
      setSelfInfo(prev => prev ? { ...prev, handCards: data.handCards, traitDescription: data.traitDescription } : null)
    })

    socket.on('GAME_STARTED', (state: any) => {
      setPlayers(state.players)
      setNPCs(state.activeNPCs || state.npcs || [])
      setCurrentTurn(state.currentTurn)
      setTurnOrder(state.turnOrder)
      setCurrentNode(state.currentNode)
      setScreen('game')
    })

    socket.on('NARRATIVE', (data: { text: string; type: string; playerId?: string; cardId?: string; targetId?: string }) => {
      setLog(prev => [...prev, {
        text: data.text,
        type: data.type as GameLogEntry['type'],
        playerId: data.playerId,
        cardId: data.cardId,
        timestamp: Date.now()
      }])
    })

    socket.on('PRIVATE_INFO', (data: { text: string; cardId: string }) => {
      setLog(prev => [...prev, {
        text: `🔒 ${data.text}`,
        type: 'system',
        timestamp: Date.now()
      }])
    })

    socket.on('STATE_UPDATE', (data: { changes: any[]; players: PlayerState[]; npcs: NPCState[]; currentNode?: any }) => {
      setPlayers(data.players)
      setNPCs(data.npcs)
      if (data.currentNode) setCurrentNode(data.currentNode)
    })

    socket.on('HAND_UPDATE', (data: { handCards: string[] }) => {
      setHandCards(data.handCards)
    })

    socket.on('TURN_CHANGE', (data: { currentTurn: string; turnOrder: string[] }) => {
      setCurrentTurn(data.currentTurn)
      setTurnOrder(data.turnOrder)
    })

    socket.on('GAME_OVER', (data: { victory: boolean; message: string }) => {
      setGameOver(data)
    })

    socket.on('CHAT', (data: { playerId: string; playerName: string; message: string }) => {
      setLog(prev => [...prev, {
        text: `${data.playerName}: ${data.message}`,
        type: 'system',
        playerId: data.playerId,
        timestamp: Date.now()
      }])
    })

    socket.on('ERROR', (data: { message: string }) => {
      alert(`错误: ${data.message}`)
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('PLAYER_JOINED')
      socket.off('SELF_INFO')
      socket.off('GAME_STARTED')
      socket.off('NARRATIVE')
      socket.off('PRIVATE_INFO')
      socket.off('STATE_UPDATE')
      socket.off('HAND_UPDATE')
      socket.off('TURN_CHANGE')
      socket.off('GAME_OVER')
      socket.off('CHAT')
      socket.off('ERROR')
    }
  }, [])

  const handleCreateSession = useCallback(async (playerName: string) => {
    try {
      const res = await fetch('/api/sessions', { method: 'POST' })
      const { sessionId: newSessionId } = await res.json()
      setSessionId(newSessionId)
      socket.connect()
      socket.emit('JOIN_SESSION', { sessionId: newSessionId, playerName })
      setSelfInfo(prev => prev ? prev : {
        id: '', name: playerName, rootType: '金灵根',
        stats: { spirit: 14, body: 16, mind: 10 },
        hp: 28, maxHp: 28, mp: 12, maxMp: 12,
        trait: '', traitDescription: '',
        handCards: []
      })
      setScreen('lobby')
    } catch (err) {
      alert('创建房间失败')
    }
  }, [])

  const handleJoinSession = useCallback(async (playerName: string, joinSessionId: string) => {
    setSessionId(joinSessionId)
    socket.connect()
    socket.emit('JOIN_SESSION', { sessionId: joinSessionId, playerName })
    setSelfInfo({
      id: '', name: playerName, rootType: '金灵根',
      stats: { spirit: 14, body: 16, mind: 10 },
      hp: 28, maxHp: 28, mp: 12, maxMp: 12,
      trait: '', traitDescription: '',
      handCards: []
    })
    setScreen('lobby')
  }, [])

  const handleStartGame = useCallback(() => {
    socket.emit('START_GAME', { sessionId })
  }, [sessionId])

  const handlePlayCard = useCallback((cardId: string, targetId: string, targetType: string, supplement?: string) => {
    socket.emit('PLAY_CARD', {
      sessionId,
      playerId: selfInfo?.id,
      cardId,
      targetId,
      targetType,
      supplement
    })
  }, [sessionId, selfInfo])

  if (screen === 'login') {
    return <LoginScreen onCreate={handleCreateSession} onJoin={handleJoinSession} />
  }

  if (screen === 'lobby') {
    return (
      <LobbyScreen
        sessionId={sessionId}
        players={players}
        onStart={handleStartGame}
        connected={connected}
      />
    )
  }

  return (
    <GameTable
      sessionId={sessionId}
      selfInfo={selfInfo}
      players={players}
      npcs={npcs}
      log={log}
      handCards={handCards}
      currentTurn={currentTurn}
      turnOrder={turnOrder}
      currentNode={currentNode}
      gameOver={gameOver}
      onPlayCard={handlePlayCard}
    />
  )
}
