import axios from 'axios'
import { pythonManager } from './manager'

const client = axios.create({ timeout: 300_000 })

function baseURL() {
  return `http://127.0.0.1:${pythonManager.port}`
}

export const pythonBridge = {
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const res = await client.post<T>(`${baseURL()}${endpoint}`, data)
    return res.data
  },
}
