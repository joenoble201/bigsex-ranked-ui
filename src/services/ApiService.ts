import { AuthService } from './AuthService'

export class ApiService {
  private static readonly BASE = '/api'

  private static async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = AuthService.getToken()
    const res = await fetch(`${this.BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })

    if (res.status === 401) {
      AuthService.logout()
      window.location.reload()
      throw new Error('Unauthorized')
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? `HTTP ${res.status}`)
    }

    return res.json()
  }

  static get<T>(path: string): Promise<T> {
    return this.request<T>(path)
  }

  static post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) })
  }
}
