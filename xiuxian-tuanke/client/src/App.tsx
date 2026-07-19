// client/src/App.tsx

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
    socket.on('connect', () => {
      console.log('Socket connected')
      setConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      setConnected(false)
    })

    socket.on('PLAYER_JOINED', (data: { player: PlayerState; playerCount: number }) => {
      console.log('PLAYER_JOINED:', data)
      setPlayers(prev => {
        if (prev.find(p => p.id === data.player.id)) return prev
        return [...prev, data.player]
      })
    })

    socket.on('SELF_INFO', (data: { playerId: string; handCards: string[]; stats: any; traitDescription: string }) => {
      console.log('SELF_INFO received:', data)
      setHandCards(data.handCards)
      setSelfInfo(prev => {
        console.log('Updating selfInfo, prev:', prev, 'playerId:', data.playerId)
        return {
          id: data.playerId,
          name: prev?.name || '',
          rootType: prev?.rootType || '金灵根',
          stats: data.stats || prev?.stats || { spirit: 14, body: 16, mind: 10 },
          hp: prev?.hp || 28,
          maxHp: prev?.maxHp || 28,
          mp: prev?.mp || 12,
          maxMp: prev?.maxMp || 12,
          trait: prev?.trait || '',
          traitDescription: data.traitDescription || '',
          handCards: data.handCards
        }
      })
    })

    socket.on('GAME_STARTED', (state: any) => {
      console.log('GAME_STARTED:', state)
      setPlayers(state.players)
      setNPCs(state.activeNPCs || state.npcs || [])
      setCurrentTurn(state.currentTurn)
      setTurnOrder(state.turnOrder)
      setCurrentNode(state.currentNode)
      setScreen('game')
    })

    socket.on('NARRATIVE', (data: { text: string; type: string; playerId?: string; cardId?: string; targetId?: string }) => {
      console.log('NARRATIVE:', data)
      setLog(prev => [...prev, {
        text: data.text,
        type: data.type as GameLogEntry['type'],
        playerId: data.playerId,
        cardId: data.cardId,
        timestamp: Date.now()
      }])
    })

    socket.on('PRIVATE_INFO', (data: { text: string; cardId: string }) => {
      console.log('PRIVATE_INFO:', data)
      setLog(prev => [...prev, {
        text: `🔒 ${data.text}`,
        type: 'system',
        timestamp: Date.now()
      }])
    })

    socket.on('STATE_UPDATE', (data: { changes: any[]; players: PlayerState[]; npcs: NPCState[]; currentNode?: any }) => {
      console.log('STATE_UPDATE:', data)
      setPlayers(data.players)
      setNPCs(data.npcs)
      if (data.currentNode) setCurrentNode(data.currentNode)
    })

    socket.on('HAND_UPDATE', (data: { handCards: string[] }) => {
      console.log('HAND_UPDATE:', data)
      setHandCards(data.handCards)
    })

    socket.on('TURN_CHANGE', (data: { currentTurn: string; turnOrder: string[] }) => {
      console.log('TURN_CHANGE:', data, 'my id:', selfInfo?.id)
      setCurrentTurn(data.currentTurn)
      setTurnOrder(data.turnOrder)
    })

    socket.on('GAME_OVER', (data: { victory: boolean; message: string }) => {
      console.log('GAME_OVER:', data)
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
      console.error('Server error:', data.message)
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
      console.log('Session created:', newSessionId)
      setSessionId(newSessionId)

      socket.connect()
      socket.emit('JOIN_SESSION', { sessionId: newSessionId, playerName })

      setSelfInfo({
        id: '',  // 等 SELF_INFO 事件回来更新
        name: playerName,
        rootType: '金灵根',
        stats: { spirit: 14, body: 16, mind: 10 },
        hp: 28, maxHp: 28,
        mp: 12, maxMp: 12,
        trait: '',
        traitDescription: '',
        handCards: []
      })
      setScreen('lobby')
    } catch (err) {
      console.error('Create session failed:', err)
      alert('创建房间失败')
    }
  }, [])

  const handleJoinSession = useCallback(async (playerName: string, joinSessionId: string) => {
    console.log('Joining session:', joinSessionId, 'as', playerName)
    setSessionId(joinSessionId)

    socket.connect()
    socket.emit('JOIN_SESSION', { sessionId: joinSessionId, playerName })

    setSelfInfo({
      id: '',
      name: playerName,
      rootType: '金灵根',
      stats: { spirit: 14, body: 16, mind: 10 },
      hp: 28, maxHp: 28,
      mp: 12, maxMp: 12,
      trait: '',
      traitDescription: '',
      handCards: []
    })
    setScreen('lobby')
  }, [])

  const handleStartGame = useCallback(() => {
    console.log('Starting game, sessionId:', sessionId)
    socket.emit('START_GAME', { sessionId })
  }, [sessionId])

  const handlePlayCard = useCallback((cardId: string, targetId: string, targetType: string, supplement?: string) => {
    console.log('Playing card:', {
      sessionId,
      playerId: selfInfo?.id,
      cardId,
      targetId,
      targetType,
      supplement
    })
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
