import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/index.js'
import './styles/global.css'
import App from './App.jsx'

// Theme: read from localStorage, fall back to system preference
const storedTheme = localStorage.getItem('theme')
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const theme = storedTheme ?? (systemDark ? 'dark' : 'light')
document.documentElement.setAttribute('data-theme', theme)

// Keep in sync when OS preference changes (only if user hasn't overridden)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
