import React from 'react'
import { App as Framework7App, Block, Navbar, Page, View } from 'framework7-react'
import Calculator from './components/Calculator'

export default function App() {
  return (
    <Framework7App name="PEA Rental Calc" theme="ios">
      <View main url="/">
        <Page className="app-page" noToolbar noSwipeback>
          <Navbar
            className="app-navbar"
            title="PEA Rental Calc"
            subtitle="Rental pricing planner"
          />
          <Block strong inset className="hero-card">
            <div className="hero-kicker">Framework7 iOS redesign</div>
            <h1>Plan room pricing with a cleaner mobile-first flow.</h1>
            <p>
              Enter the room areas, monthly costs, and profit target to see an instant
              room-by-room breakdown.
            </p>
          </Block>
          <Calculator />
        </Page>
      </View>
    </Framework7App>
  )
}
