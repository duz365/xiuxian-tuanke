import { Server, Socket } from 'socket.io'
import { GameSession } from '../game/GameSession'
import { CardExecutor } from '../cards/CardExecutor'
import { CardAction } from '../types'

export class SocketHandler {
  private io: Server
  private sessions: Map<string, GameSession> = new Map()
  private executor: CardExecutor
  private playerSessionMap: Map<string, string> = new Map() // socketId -> sessionId
  private playerIdMap: Map<string, string> = new Map() // socketId -> playerId

  constructor(io: Server, executor: CardExecutor) {
    this.io = io
    this.executor = executor
    this.setupHandlers()
  }

  registerSession(sessionId: string, session: GameSession): void {
    this.sessions.set(sessionId, session)
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`新连接: ${socket.id}`)

      // 加入房间
      socket.on('JOIN_SESSION', (data: { sessionId: string; playerName: string }) => {
        try {
          const session = this.sessions.get(data.sessionId)
          if (!session) {
            socket.emit('ERROR', { message: '房间不存在' })
            return
          }

          const player = session.addPlayer(data.playerName)
          socket.join(`session:${data.sessionId}`)
          socket.join(`session:${data.sessionId}:player:${player.id}`)

          this.playerSessionMap.set(socket.id, data.sessionId)
          this.playerIdMap.set(socket.id, player.id)
          socket.data.playerId = player.id
          socket.data.playerName = player.name
          socket.data.sessionId = data.sessionId

          // 通知房间所有人
          this.io.to(`session:${data.sessionId}`).emit('PLAYER_JOINED', {
            player: {
              id: player.id,
              name: player.name,
              rootType: player.rootType,
              hp: player.hp,
              maxHp: player.maxHp,
              mp: player.mp,
              maxMp: player.maxMp,
              trait: player.trait
            },
            playerCount: session.players.size
          })

          // 发给新加入的玩家他自己的完整信息（含手牌）
          socket.emit('SELF_INFO', {
            playerId: player.id,
            handCards: player.handCards,
            stats: player.stats,
            traitDescription: player.traitDescription
          })

          console.log(`${data.playerName} 加入了房间 ${data.sessionId}`)
        } catch (err) {
          socket.emit('ERROR', { message: (err as Error).message })
        }
      })

      // 开始游戏
      socket.on('START_GAME', (data: { sessionId: string }) => {
        try {
          const session = this.sessions.get(data.sessionId)
          if (!session) throw new Error('房间不存在')

          session.startGame()
          const state = session.toJSON()
          this.io.to(`session:${data.sessionId}`).emit('GAME_STARTED', state)

          // 发送初始DM叙事
          session.generateDMNarrative().then(narrative => {
            if (narrative) {
              this.io.to(`session:${data.sessionId}`).emit('NARRATIVE', {
                text: narrative,
                type: 'dm'
              })
            }
          })
        } catch (err) {
          socket.emit('ERROR', { message: (err as Error).message })
        }
      })

      // 打出卡牌
      socket.on('PLAY_CARD', async (action: CardAction & { sessionId: string }) => {
        try {
          const session = this.sessions.get(action.sessionId)
          if (!session) throw new Error('房间不存在')

          const result = await this.executor.execute(session, action)

          // 公共叙事
          this.io.to(`session:${action.sessionId}`).emit('NARRATIVE', {
            text: result.publicNarrative,
            type: 'card',
            playerId: action.playerId,
            cardId: action.cardId,
            targetId: action.targetId
          })

          // 私密信息
          result.privateMessages.forEach((message, playerId) => {
            this.io.to(`session:${action.sessionId}:player:${playerId}`).emit('PRIVATE_INFO', {
              text: message,
              cardId: action.cardId
            })
          })

          // 状态更新
          if (result.stateChanges.length > 0) {
            // 移除死亡的NPC
            result.stateChanges.forEach(change => {
              if (change.type === 'npc_remove') {
                session.npcs.delete(change.targetId)
              }
            })

            this.io.to(`session:${action.sessionId}`).emit('STATE_UPDATE', {
              changes: result.stateChanges,
              players: session.getPlayers(),
              npcs: session.getActiveNPCs()
            })
          }

          // 更新打出卡牌的玩家的手牌
          const player = session.getPlayer(action.playerId)
          if (player) {
            // 找到该玩家的socket并单独发送手牌更新
            const playerSocketId = this.findSocketByPlayerId(action.playerId)
            if (playerSocketId) {
              this.io.to(playerSocketId).emit('HAND_UPDATE', {
                handCards: player.handCards
              })
            }
          }

          // 检查游戏是否结束
          if (session.isGameOver()) {
            const allDead = Array.from(session.players.values()).every(p => p.hp <= 0)
            this.io.to(`session:${action.sessionId}`).emit('GAME_OVER', {
              victory: !allDead,
              message: allDead ? '全员阵亡，冒险失败...' : '恭喜！你们成功获得了筑基丹与紫电剑！'
            })
            return
          }

          // 推进回合
          session.advanceTurn()
          this.io.to(`session:${action.sessionId}`).emit('TURN_CHANGE', {
            currentTurn: session.currentTurn,
            turnOrder: session.scheduler?.getOrder() || []
          })

          // 新回合DM叙事
          const dmNarrative = await session.generateDMNarrative()
          if (dmNarrative) {
            this.io.to(`session:${action.sessionId}`).emit('NARRATIVE', {
              text: dmNarrative,
              type: 'dm'
            })
          }
        } catch (err) {
          socket.emit('ERROR', { message: (err as Error).message })
        }
      })

      // 移动到新场景
      socket.on('MOVE_TO_NODE', (data: { sessionId: string; nodeId: string }) => {
        const session = this.sessions.get(data.sessionId)
        if (!session) return

        session.moveToNode(data.nodeId)
        this.io.to(`session:${data.sessionId}`).emit('STATE_UPDATE', {
          changes: [],
          players: session.getPlayers(),
          npcs: session.getActiveNPCs(),
          currentNode: session.getCurrentNode()
        })
      })

      // 聊天消息
      socket.on('CHAT', (data: { sessionId: string; message: string }) => {
        const playerId = this.playerIdMap.get(socket.id)
        const session = this.sessions.get(data.sessionId)
        if (!playerId || !session) return

        const player = session.getPlayer(playerId)
        this.io.to(`session:${data.sessionId}`).emit('CHAT', {
          playerId,
          playerName: player?.name || '未知',
          message: data.message
        })
      })

      // 断开连接
      socket.on('disconnect', () => {
        console.log(`断开连接: ${socket.id}`)
        const sessionId = this.playerSessionMap.get(socket.id)
        if (sessionId) {
          this.io.to(`session:${sessionId}`).emit('PLAYER_DISCONNECTED', {
            playerId: this.playerIdMap.get(socket.id)
          })
        }
        this.playerSessionMap.delete(socket.id)
        this.playerIdMap.delete(socket.id)
      })
    })
  }

  private findSocketByPlayerId(playerId: string): string | undefined {
    for (const [socketId, pid] of this.playerIdMap.entries()) {
      if (pid === playerId) return socketId
    }
    return undefined
  }
}
