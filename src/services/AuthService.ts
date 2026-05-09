export class AuthService {
  private static readonly COOKIE_KEY  = 'bsr_token'
  private static readonly SESSION_KEY = 'bsr_token'

  static async login(
    username: string,
    password: string,
    remember: boolean,
  ): Promise<{ memberId: string; username: string }> {
    const credentials = btoa(`${username}:${password}`)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}` },
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Invalid credentials')
    }

    const { token, memberId, username: uname } = await res.json()
    this.storeToken(token, remember)
    return { memberId, username: uname }
  }

  static storeToken(token: string, persist: boolean): void {
    if (persist) {
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()
      document.cookie = `${this.COOKIE_KEY}=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Strict`
    } else {
      sessionStorage.setItem(this.SESSION_KEY, token)
    }
  }

  static getToken(): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${this.COOKIE_KEY}=([^;]*)`))
    if (match) return decodeURIComponent(match[1])
    return sessionStorage.getItem(this.SESSION_KEY)
  }

  static isAuthenticated(): boolean {
    return this.getToken() !== null
  }

  static logout(): void {
    document.cookie = `${this.COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    sessionStorage.removeItem(this.SESSION_KEY)
  }
}
