import { useState } from 'react'
import { SplashScreen } from './components/SplashScreen'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { GamesPage } from './pages/GamesPage'
import { AuthService } from './services/AuthService'

type Phase = 'splash' | 'login' | 'app' | 'games'

function App() {
  const [phase, setPhase] = useState<Phase>('splash')

  function afterSplash() {
    setPhase(AuthService.isAuthenticated() ? 'app' : 'login')
  }

  if (phase === 'splash') return <SplashScreen onEnter={afterSplash} />
  if (phase === 'login')  return <LoginPage onLogin={() => setPhase('app')} />
  if (phase === 'games')  return <GamesPage onBack={() => setPhase('app')} />
  return <DashboardPage onLogout={() => setPhase('login')} onGames={() => setPhase('games')} />
}

export default App
