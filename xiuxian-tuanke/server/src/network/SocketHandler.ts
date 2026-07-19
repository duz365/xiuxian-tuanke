import { Server, Socket } from 'socket.io'
import { GameSession } from '../game/GameSession'
import { CardExecutor } from '../cards/CardExecutor'
import { ShopSystem } from '../game/ShopSystem'
import { cardRegistry } from '../cards/CardRegistry'
import { CardAction } from '../types'

export class SocketHandler {
  private io: Server
  private sessions: Map<string, GameSession> = new Map()
  private executor: CardExecutor
  private playerSessionMap: Map<string, string> = new Map()
  private playerIdMap: Map<string, string> = new Map()

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

      socket.on('JOIN_SESSION', (data: { sessionId: string; playerName: string }) => {
        try {
          const session = this.sessions.get(data.sessionId)
          if (!session) { socket.emit('ERROR', { message: '房间不存在' }); return }

          const player = session.addPlayer(data.playerName)
          socket.join(`session:${data.sessionId}`)
          socket.join(`session:${data.sessionId}:player:${player.id}`)

          this.playerSessionMap.set(socket.id, data.sessionId)
          this.playerIdMap.set(socket.id, player.id)
          socket.data.playerId = player.id
          socket.data.playerName = player.name
          socket.data.sessionId = data.sessionId

          this.io.to(`session:${data.sessionId}`).emit('PLAYER_JOINED', {
            player: {
              id: player.id,
              name: player.name,
              rootType: player.rootType,
              hp: player.hp, maxHp: player.maxHp,
              mp: player.mp, maxMp: player.maxMp,
              shield: player.shield,
              trait: player.trait,
              spiritStones: player.spiritStones,
              equipment: player.equipment
            },
            playerCount: session.players.size
          })

          socket.emit('SELF_INFO', {
            playerId: player.id,
            handCards: player.handCards,
            stats: player.stats,
            traitDescription: player.traitDescription,
            spiritStones: player.spiritStones,
            equipment: player.equipment,
            inventory: player.inventory
          })

          console.log(`${data.playerName} 加入了房间 ${data.sessionId}`)
        } catch (err) {
          socket.emit('ERROR', { message: (err as Error).message })
        }
      })

      socket.on('START_GAME', (data: { sessionId: string }) => {
        try {
          const session = this.sessions.get(data.sessionId)
          if (!session) throw new Error('房间不存在')
          session.startGame()

          this.io.to(`session:${data.sessionId}`).emit('GAME_STARTED', {
            players: session.getPlayers(),
            activeNPCs: session.getActiveNPCs(),
            currentTurn: session.currentTurn,
            turnOrder: session.scheduler?.getOrder() || [],
            currentNode: session.getCurrentNode()
          })

          session.generateDMNarrative().then(narrative => {
            if (narrative) {
              this.io.to(`session:${data.sessionId}`).emit('NARRATIVE', { text: narrative, type: 'dm' })
            }
          })
        } catch (err) {
          socket.emit('ERROR', { message: (err as Error).message })
        }
      })

      socket.on('PLAY_CARD', async (action: CardAction & { sessionId: string }) => {
        try {
          const session = this.sessions.get(action.sessionId)
          if (!session) throw new Error('房间不存在')

          const result = await this.executor.execute(
            session,
            action.playerId,
            action.cardId,
            action.targetId,
            action.targetType,
            action.supplement
          )

          this.io.to(`session:${action.sessionId}`).emit('NARRATIVE', {
            text: result.narrative,
            type: 'card',
            playerId: action.playerId,
            cardId: action.cardId
          })

          if (result.hiddenInfo) {
            socket.emit('PRIVATE_INFO', { text: result.hiddenInfo })
          }

          if (result.lootDropped && result.lootDropped.length > 0) {
            const names = result.lootDropped.map(id => cardRegistry[id]?.name || id).join('、')
            this.io.to(`session:${action.sessionId}`).emit('NARRATIVE', {
              text: `获得了: ${names}`,
              type: 'loot'
            })
          }

          if (result.cardGained && result.cardGained.length > 0) {
            const names = result.cardGained.map(id => cardRegistry[id]?.name || id).join('、')
            this.io.to(`session:${action.sessionId}`).emit('NARRATIVE', {
              text: `发现了: ${names}`,
              type: 'loot'
            })
          }

          this.io.to(`session:${action.sessionId}`).emit('STATE_UPDATE', {
            players: session.getPlayers(),
            npcs: session.getActiveNPCs(),
            currentNode: session.getCurrentNode()
          })

          const player = session.getPlayer(action.playerId)
          const playerSocket = this.findSocketByPlayerId(action.playerId)
          if (playerSocket && player) {
            this.io.to(playerSocket).emit('HAND_UPDATE', { handCards: player.handCards })
            this.io.to(playerSocket).emit('STONES_UPDATE', { spiritStones: player.spiritStones })
          }

          if (session.isGameOver()) {
            const allDead = Array.from(session.players.values()).every(p => p.hp <= 0)
            this.io.to(`session:${action.sessionId}`).emit('GAME_OVER', {
              victory: !allDead,
              message: allDead ? '全员阵亡，冒险失败...' : '恭喜！你们成功获得了筑基丹与紫电剑！'
            })
            return
          }

          session.advanceTurn()
          this.io.to(`session:${action.sessionId}`).emit('TURN_CHANGE', {
            currentTurn: session.currentTurn,
            turnOrder: session.scheduler?.getOrder() || []
          })

          const dmNarrative = await session.generateDMNarrative()
          if (dmNarrative) {
            this.io.to(`session:${action.sessionId}`).emit('NARRATIVE', { text: dmNarrative, type: 'dm' })
          }
        } catch (err) {
          socket.emit('ERROR', { message: (err as Error).message })
        }
      })

      socket.on('OPEN_SHOP', (data: { sessionId: string }) => {
        const session = this.sessions.get(data.sessionId)
        if (!session) return
        const items = ShopSystem.getShopItems(session.currentNodeId)
        socket.emit('SHOP_ITEMS', {
          items: items.map(c => ({
            id: c.id, name: c.name, type: c.type,
            rarity: c.rarity, description: c.description, price: c.buyPrice || 0
          })),
          playerStones: session.getPlayer(socket.data.playerId)?.spiritStones || 0
        })
      })

      socket.on('BUY_CARD', (data: { sessionId: string; cardId: string }) => {
        const session = this.sessions.get(data.sessionId)
        if (!session) return
        const result = ShopSystem.buy(session, socket.data.playerId, data.cardId)
        socket.emit('SHOP_RESULT', result)
        if (result.success) {
          const player = session.getPlayer(socket.data.playerId)
          if (player) {
            socket.emit('HAND_UPDATE', { handCards: player.handCards })
            socket.emit('STONES_UPDATE', { spiritStones: player.spiritStones })
            this.io.to(`session:${data.sessionId}`).emit('STATE_UPDATE', {
              players: session.getPlayers(),
              npcs: session.getActiveNPCs()
            })
          }
        }
      })

      socket.on('SELL_CARD', (data: { sessionId: string; cardId: string }) => {
        const session = this.sessions.get(data.sessionId)
        if (!session) return
        const result = ShopSystem.sell(session, socket.data.playerId, data.cardId)
        socket.emit('SHOP_RESULT', result)
        if (result.success) {
          const player = session.getPlayer(socket.data.playerId)
          if (player) {
            socket.emit('HAND_UPDATE', { handCards: player.handCards })
            socket.emit('STONES_UPDATE', { spiritStones: player.spiritStones })
          }
        }
      })

      socket.on('VIEW_INVENTORY', (data: { sessionId: string }) => {
        const session = this.sessions.get(data.sessionId)
        if (!session) return
        const player = session.getPlayer(socket.data.playerId)
        if (!player) return
        const inventoryCards = player.inventory
          .map((id: string) => cardRegistry[id])
          .filter(Boolean)
          .map(c => ({ id: c.id, name: c.name, type: c.type, description: c.description, sellPrice: c.sellPrice || 0 }))
        socket.emit('INVENTORY', {
          items: inventoryCards,
          spiritStones: player.spiritStones,
          equipment: player.equipment
        })
      })

      socket.on('CHAT', (data: { sessionId: string; message: string }) => {
        const playerId = this.playerIdMap.get(socket.id)
        const session = this.sessions.get(data.sessionId)
        if (!playerId || !session) return
        const player = session.getPlayer(playerId)
        this.io.to(`session:${data.sessionId}`).emit('CHAT', {
          playerId, playerName: player?.name || '未知', message: data.message
        })
      })

      socket.on('disconnect', () => {
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
