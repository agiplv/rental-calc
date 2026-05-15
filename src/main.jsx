import React from 'react'
import { createRoot } from 'react-dom/client'
import Framework7 from 'framework7/lite-bundle'
import Framework7React from 'framework7-react'
import 'framework7/css/bundle'
import App from './App'
import './styles.css'

Framework7.use(Framework7React)

const root = createRoot(document.getElementById('root'))
root.render(<App />)

// Register service worker if available (use relative path for GitHub Pages)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  })
}
