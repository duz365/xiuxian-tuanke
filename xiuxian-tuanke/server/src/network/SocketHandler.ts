import { Server, Socket } from 'socket.io'
import { GameSession } from '../game/GameSession'
import { CardExecutor } from '../cards/CardExecutor'
import { ShopSystem } from '../game/ShopSystem'
import { cards } from '../cards/CardRegistry'

export class SocketHandler {
  private io: Server
  private sessions = new Map<string, GameSession>()
  private executor: CardExecutor
  private socketSession = new Map<string, string>()
  private socketPlayer = new Map<string, string>()

  constructor(io: Server, executor: CardExecutor) {
    this.io = io
    this.executor = executor
    this.setup()
  }

  registerSession(id: string, session: GameSession) { this.sessions.set(id, session) }

  private setup() {
    this.io.on('connection', (socket: Socket) => {
      console.log('连接:', socket.id)

      socket.on('JOIN_SESSION', (data: { sessionId: string; playerName: string }) => {
        try {
          const session = this.sessions.get(data.sessionId)
          if (!session) { socket.emit('ERROR', { message: '房间不存在' }); return }
          const player = session.addPlayer(data.playerName)
          socket.join(`s:${data.sessionId}`)
          socket.join(`s:${data.sessionId}:p:${player.id}`)
          this.socketSession.set(socket.id, data.sessionId)
          this.socketPlayer.set(socket.id, player.id)
          socket.data.playerId = player.id
          socket.data.playerName = player.name
          socket.data.sessionId = data.sessionId

          this.io.to(`s:${data.sessionId}`).emit('PLAYER_JOINED', {
            player: { id: player.id, name: player.name, rootType: player.rootType, hp: player.hp, maxHp: player.maxHp, mp: player.mp, maxMp: player.maxMp, shield: player.shield, trait: player.trait, spiritStones: player.spiritStones, equipment: player.equipment },
            playerCount: session.players.size
          })

          socket.emit('SELF_INFO', {
            playerId: player.id, handCards: player.handCards, stats: player.stats,
            traitDescription: player.traitDescription, spiritStones: player.spiritStones,
            equipment: player.equipment, inventory: player.inventory
          })
        } catch (err: any) {
          socket.emit('ERROR', { message: err.message })
        }
      })

      socket.on('START_GAME', async (data: { sessionId: string }) => {
        try {
          const session = this.sessions.get(data.sessionId)
          if (!session) throw new Error('房间不存在')
          session.startGame()
          this.io.to(`s:${data.sessionId}`).emit('GAME_STARTED', {
            players: session.getPlayers(), activeNPCs: session.getActiveNPCs(),
            currentTurn: session.currentTurn, turnOrder: session.scheduler?.getOrder() || [],
            currentNode: session.getCurrentNode()
          })
          const dm = await session.generateDMNarrative()
          if (dm) this.io.to(`s:${data.sessionId}`).emit('NARRATIVE', { text: dm, type: 'dm' })
        } catch (err: any) {
          socket.emit('ERROR', { message: err.message })
        }
      })

      socket.on('PLAY_CARD', async (action: any) => {
        try {
          const session = this.sessions.get(action.sessionId)
          if (!session) throw new Error('房间不存在')

          const result = await this.executor.execute(session, action.playerId, action.cardId, action.targetId, action.targetType, action.supplement)

          this.io.to(`s:${action.sessionId}`).emit('NARRATIVE', { text: result.narrative, type: 'card', playerId: action.playerId, cardId: action.cardId })

          if (result.hiddenInfo) {
            socket.emit('PRIVATE_INFO', { text: result.hiddenInfo })
          }

          if (result.loot?.length > 0) {
            const names = result.loot.map((id: string) => cards[id]?.name || id).join('、')
            this.io.to(`s:${action.sessionId}`).emit('NARRATIVE', { text: `获得了: ${names}`, type: 'loot' })
          }

          this.io.to(`s:${action.sessionId}`).emit('STATE_UPDATE', { players: session.getPlayers(), npcs: session.getActiveNPCs(), currentNode: session.getCurrentNode() })

          const player = session.getPlayer(action.playerId)
          if (player) {
            const ps = this.findSocket(action.playerId)
            if (ps) {
              this.io.to(ps).emit('HAND_UPDATE', { handCards: player.handCards, spiritStones: player.spiritStones, equipment: player.equipment })
            }
          }

          if (session.isGameOver()) {
            const allDead = Array.from(session.players.values()).every(p => p.hp <= 0)
            this.io.to(`s:${action.sessionId}`).emit('GAME_OVER', { victory: !allDead, message: allDead ? '全员阵亡...' : '恭喜！获得筑基丹与紫电剑！' })
            return
          }

          session.advanceTurn()
          this.io.to(`s:${action.sessionId}`).emit('TURN_CHANGE', { currentTurn: session.currentTurn, turnOrder: session.scheduler?.getOrder() || [] })

          const dm = await session.generateDMNarrative()
          if (dm) this.io.to(`s:${action.sessionId}`).emit('NARRATIVE', { text: dm, type: 'dm' })
        } catch (err: any) {
          socket.emit('ERROR', { message: err.message })
        }
      })

      socket.on('OPEN_SHOP', (data: { sessionId: string }) => {
        const session = this.sessions.get(data.sessionId)
        if (!session) return
        const items = ShopSystem.getItems(session.currentNodeId)
        socket.emit('SHOP_ITEMS', { items: items.map(c => ({ id: c.id, name: c.name, type: c.type, rarity: c.rarity, description: c.description, price: c.buyPrice })), spiritStones: session.getPlayer(socket.data.playerId)?.spiritStones || 0 })
      })

      socket.on('BUY_CARD', (data: { sessionId: string; cardId: string }) => {
        const session = this.sessions.get(data.sessionId)
        if (!session) return
        const result = ShopSystem.buy(session, socket.data.playerId, data.cardId)
        socket.emit('SHOP_RESULT', result)
        if (result.success) {
          const p = session.getPlayer(socket.data.playerId)
          if (p) {
            socket.emit('HAND_UPDATE', { handCards: p.handCards, spiritStones: p.spiritStones })
            this.io.to(`s:${data.sessionId}`).emit('STATE_UPDATE', { players: session.getPlayers(), npcs: session.getActiveNPCs() })
          }
        }
      })

      socket.on('SELL_CARD', (data: { sessionId: string; cardId: string }) => {
        const session = this.sessions.get(data.sessionId)
        if (!session) return
        const result = ShopSystem.sell(session, socket.data.playerId, data.cardId)
        socket.emit('SHOP_RESULT', result)
        if (result.success) {
          const p = session.getPlayer(socket.data.playerId)
          if (p) socket.emit('HAND_UPDATE', { handCards: p.handCards, spiritStones: p.spiritStones })
        }
      })

      socket.on('VIEW_INVENTORY', (data: { sessionId: string }) => {
        const session = this.sessions.get(data.sessionId)
        if (!session) return
        const p = session.getPlayer(socket.data.playerId)
        if (!p) return
        socket.emit('INVENTORY', {
          items: p.inventory.map((id: string) => cards[id]).filter(Boolean).map((c: any) => ({ id: c.id, name: c.name, type: c.type, description: c.description, sellPrice: c.sellPrice })),
          spiritStones: p.spiritStones, equipment: p.equipment
        })
      })

      socket.on('CHAT', (data: { sessionId: string; message: string }) => {
        const pid = this.socketPlayer.get(socket.id)
        const session = this.sessions.get(data.sessionId)
        if (!pid || !session) return
        const p = session.getPlayer(pid)
        this.io.to(`s:${data.sessionId}`).emit('CHAT', { playerId: pid, playerName: p?.name || '?', message: data.message })
      })

      socket.on('disconnect', () => {
        const sid = this.socketSession.get(socket.id)
        if (sid) this.io.to(`s:${sid}`).emit('PLAYER_DISCONNECTED', { playerId: this.socketPlayer.get(socket.id) })
        this.socketSession.delete(socket.id)
        this.socketPlayer.delete(socket.id)
      })
    })
  }

  private findSocket(playerId: string): string | undefined {
    for (const [sid, pid] of this.socketPlayer.entries()) { if (pid === playerId) return sid }
    return undefined
  }
}
