import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WorkPage } from './pages/WorkPage.tsx'

const workMatch = window.location.pathname.match(/^\/work\/([^/]+)/)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {workMatch ? <WorkPage taskId={workMatch[1]} /> : <App />}
  </StrictMode>,
)
