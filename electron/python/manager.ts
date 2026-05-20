import { ChildProcess, spawn } from 'child_process'
import { app } from 'electron'
import * as http from 'http'
import * as path from 'path'

const PORT = 18765

class PythonManager {
  private process: ChildProcess | null = null

  get port() {
    return PORT
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { cmd, args } = this.resolveCommand()

      this.process = spawn(cmd, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      })

      this.process.stderr?.on('data', (d: Buffer) =>
        console.error('[Python]', d.toString())
      )

      this.process.on('error', (err) => {
        console.error('[Python] Failed to start:', err)
        reject(err)
      })

      this.waitReady(resolve, reject)
    })
  }

  private resolveCommand(): { cmd: string; args: string[] } {
    if (app.isPackaged) {
      const exe = path.join(process.resourcesPath, 'python', 'pdf_backend.exe')
      return { cmd: exe, args: ['--port', String(PORT)] }
    }
    const script = path.join(app.getAppPath(), 'python', 'main.py')
    const cmd = process.platform === 'win32' ? 'python' : 'python3'
    return { cmd, args: [script, '--port', String(PORT)] }
  }

  private waitReady(resolve: () => void, reject: (e: Error) => void, attempts = 0) {
    if (attempts > 30) {
      reject(new Error('Python backend failed to start within 15s'))
      return
    }
    setTimeout(() => {
      http
        .get(`http://127.0.0.1:${PORT}/health`, (res) => {
          if (res.statusCode === 200) {
            resolve()
          } else {
            this.waitReady(resolve, reject, attempts + 1)
          }
        })
        .on('error', () => this.waitReady(resolve, reject, attempts + 1))
    }, 500)
  }

  stop() {
    if (this.process) {
      this.process.kill()
      this.process = null
    }
  }
}

export const pythonManager = new PythonManager()
