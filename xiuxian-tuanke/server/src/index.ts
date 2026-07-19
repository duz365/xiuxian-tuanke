import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import path from 'path'
import { AIService } from './ai/AIService'
import { CardExecutor } from './cards/CardExecutor'
import { SocketHandler } from './network/SocketHandler'
import { GameSession } from './game/GameSession'
import { cardRegistry } from './cards/CardRegistry'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const aiService = new AIService()
const cardExecutor = new CardExecutor(aiService)
const socketHandler = new SocketHandler(io, cardExecutor)

app.use(express.json())

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// 创建房间
app.post('/api/sessions', (_req, res) => {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const session = new GameSession(sessionId, aiService)
  socketHandler.registerSession(sessionId, session)
  console.log(`房间创建: ${sessionId}`)
  res.json({ sessionId })
})

// 获取卡牌列表
app.get('/api/cards', (_req, res) => {
  const cards = Object.values(cardRegistry).map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    allowedTargets: c.allowedTargets,
    consumable: c.consumable || false
  }))
  res.json(cards)
})

// 托管前端静态文件
const clientDistPath = path.join(__dirname, '../../client/dist')
app.use(express.static(clientDistPath))

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'))
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
  console.log(`AI模型: ${process.env.AI_MODEL || 'Qwen/Qwen2.5-7B-Instruct'}`)
  console.log(`硅基流动API已${process.env.SILICONFLOW_API_KEY ? '✓' : '✗ 未配置'}`)
})
