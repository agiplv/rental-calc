import React from 'react'
import { Navbar, Page } from 'framework7-react'
import Calculator from '../components/Calculator'

export default function HomePage() {
  return (
    <Page noSwipeback pageContent={false}>
      <Navbar title="PEA Rental Calc" />
      <Calculator />
    </Page>
  )
}
