import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import path from 'path'
import { AIService } from './ai/AIService'
import { CardExecutor } from './cards/CardExecutor'
import { SocketHandler } from './network/SocketHandler'
import { GameSession } from './game/GameSession'

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

const aiService = new AIService()
const cardExecutor = new CardExecutor(aiService)
const socketHandler = new SocketHandler(io, cardExecutor)

app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.post('/api/sessions', (_req, res) => {
  const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const session = new GameSession(sessionId, aiService)
  socketHandler.registerSession(sessionId, session)
  console.log('房间:', sessionId)
  res.json({ sessionId })
})

app.use(express.static(path.join(__dirname, '../../client/dist')))
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '../../client/dist/index.html')))

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`运行在端口 ${PORT}`))
