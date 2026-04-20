import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const root = createRoot(document.getElementById('root'))
root.render(<App />)

// Register service worker if available (public/service-worker.js)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/public/service-worker.js').catch(() => {});
  })
}
