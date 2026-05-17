import React, { useState } from 'react'
import { App as Framework7App, Icon, Link, Navbar, NavRight, Page, View } from 'framework7-react'
import Calculator from './components/Calculator'

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('pea-dark-mode') === 'true'
    } catch {
      return false
    }
  })

  function toggleDarkMode() {
    setDarkMode(prev => {
      const next = !prev
      try {
        localStorage.setItem('pea-dark-mode', String(next))
      } catch {}
      return next
    })
  }

  return (
    <Framework7App name="PEA Rental Calc" theme="ios" dark={darkMode}>
      <View main url="/">
        <Page noSwipeback pageContent={false}>
          <Navbar title="PEA Rental Calc">
            <NavRight>
              <Link iconOnly onClick={toggleDarkMode}>
                <Icon f7={darkMode ? 'sun_max_fill' : 'moon_fill'} />
              </Link>
            </NavRight>
          </Navbar>
          <Calculator />
        </Page>
      </View>
    </Framework7App>
  )
}
