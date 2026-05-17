import React from 'react'
import { App as Framework7App, View } from 'framework7-react'
import HomePage from './pages/HomePage'

const f7params = {
  name: 'PEA Rental Calc',
  theme: 'ios',
  routes: [
    {
      path: '/',
      component: HomePage,
    },
  ],
}

export default function App() {
  return (
    <Framework7App {...f7params}>
      <View main url="/" />
    </Framework7App>
  )
}
