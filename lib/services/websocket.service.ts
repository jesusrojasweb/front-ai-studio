import { io, Socket } from 'socket.io-client'
import { env } from '@/lib/config/env'
import { authStorage } from './auth-storage.service'

export interface JobDoneEvent {
  jobId: string
  type: 'CUT' | 'SAFETY'
  state: 'SUCCEEDED' | 'FAILED'
  payload?: Record<string, unknown>
  result?: Record<string, unknown>
  error?: string
  videoId?: string
  clipId?: string
}

export interface ClipUpdatedEvent {
  clipId: string
  fieldsChanged: string[]
  timestamp: string
}

export interface SafetyResultEvent {
  clipId: string
  verdict: string
  confidence: number
  timestamp: string
}

export interface PublishStateEvent {
  clipId: string
  platform: string
  state: string
  timestamp: string
}

export type WebSocketEvent =
  | 'job.done'
  | 'clip.updated'
  | 'safety.result'
  | 'publish.state'

class WebSocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map()

  connect(): void {
    if (this.socket?.connected) {
      return
    }

    const token = authStorage.getAccessToken()
    if (!token) {
      console.warn('No auth token available for WebSocket connection')
      return
    }

    try {
      this.socket = io(`${env.apiBaseUrl}/jobs`, {
        auth: {
          token
        },
        transports: ['websocket', 'polling']
      })

      this.socket.on('connect', () => {
        console.log('🔗 WebSocket connected')

        // Join user room for targeted events
        const userData = authStorage.getUserData()
        if (userData?.id) {
          this.socket?.emit('join_user', { userId: userData.id })
        }
      })

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason)
      })

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error)
      })

      // Set up event listeners for all events
      this.socket.on('job.done', (data: JobDoneEvent) => {
        this.emit('job.done', data)
      })

      this.socket.on('clip.updated', (data: ClipUpdatedEvent) => {
        this.emit('clip.updated', data)
      })

      this.socket.on('safety.result', (data: SafetyResultEvent) => {
        this.emit('safety.result', data)
      })

      this.socket.on('publish.state', (data: PublishStateEvent) => {
        this.emit('publish.state', data)
      })
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error)
    }
  }

  disconnect(): void {
    if (this.socket) {
      // Leave user room before disconnecting
      const userData = authStorage.getUserData()
      if (userData?.id) {
        this.socket.emit('leave_user', { userId: userData.id })
      }

      this.socket.disconnect()
      this.socket = null
    }

    // Clear all listeners
    this.listeners.clear()
  }

  on<T = unknown>(
    event: WebSocketEvent,
    callback: (data: T) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    const typedCallback = callback as (data: unknown) => void
    this.listeners.get(event)!.add(typedCallback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(typedCallback)
    }
  }

  private emit(event: WebSocketEvent, data: unknown): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(
            `Error in WebSocket event listener for ${event}:`,
            error
          )
        }
      })
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

// Create singleton instance
export const websocketService = new WebSocketService()

// Auto-connect when authentication is available
if (typeof window !== 'undefined') {
  // Check if user is authenticated and auto-connect
  if (authStorage.getAccessToken()) {
    websocketService.connect()
  }
}
