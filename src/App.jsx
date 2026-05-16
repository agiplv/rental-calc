import React from 'react'
import { App as Framework7App, Page, View } from 'framework7-react'
import Calculator from './components/Calculator'

export default function App() {
  return (
    <Framework7App name="PEA Rental Calc" theme="ios">
      <View main url="/">
        <Page noSwipeback pageContent={false}>
          <Calculator />
        </Page>
      </View>
    </Framework7App>
  )
}
