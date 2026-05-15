import React from 'react'
import { App as Framework7App, Navbar, Page, View } from 'framework7-react'
import Calculator from './components/Calculator'

export default function App() {
  return (
    <Framework7App name="PEA Rental Calc" theme="ios">
      <View main url="/">
        <Page className="app-page" noToolbar noSwipeback>
          <Navbar className="app-navbar" title="PEA Rental Calc" subtitle="Rental planner" />
          <Calculator />
        </Page>
      </View>
    </Framework7App>
  )
}
