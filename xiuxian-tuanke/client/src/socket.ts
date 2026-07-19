import { io } from 'socket.io-client'
const URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin
export const socket = io(URL, { autoConnect: false, transports: ['websocket', 'polling'] })
