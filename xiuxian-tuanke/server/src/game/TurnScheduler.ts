import { Player } from '../types'

export class TurnScheduler {
  playerOrder: string[]
  currentIndex: number

  constructor(playerIds: string[]) {
    this.playerOrder = [...playerIds]
    this.currentIndex = 0
  }

  get currentPlayerId(): string {
    return this.playerOrder[this.currentIndex]
  }

  advance(): string {
    this.currentIndex = (this.currentIndex + 1) % this.playerOrder.length
    return this.currentPlayerId
  }

  addPlayer(playerId: string): void {
    if (!this.playerOrder.includes(playerId)) {
      this.playerOrder.push(playerId)
    }
  }

  removePlayer(playerId: string): void {
    const idx = this.playerOrder.indexOf(playerId)
    if (idx === -1) return
    this.playerOrder.splice(idx, 1)
    if (this.currentIndex >= this.playerOrder.length) {
      this.currentIndex = 0
    }
  }

  getOrder(): string[] {
    return [...this.playerOrder]
  }
}
