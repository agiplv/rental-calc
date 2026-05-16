import React, { useState, useEffect, useRef } from 'react'
import {
  AccordionContent,
  Block,
  BlockTitle,
  Link,
  List,
  ListInput,
  ListItem,
  Tab,
  Tabs,
  Toolbar,
} from 'framework7-react'
import { calculateRentalPrices } from '../calc'

const DEFAULTS = {
  roomsText: '48, 34, 14, 10',
  monthlyFee: 250,
  tax: 10,
  profit: 15,
  investment: 25000,
  minProfit: 100,
}

function formatMoney(value, suffix = '€') {
  return `${Number(value).toFixed(2)} ${suffix}`
}

function formatArea(value) {
  return `${Number(value).toFixed(2)} m²`
}

export default function Calculator() {
  const [activeTab, setActiveTab] = useState('inputs')
  const [roomsText, setRoomsText] = useState(DEFAULTS.roomsText)
  const [monthlyFee, setMonthlyFee] = useState(DEFAULTS.monthlyFee)
  const [tax, setTax] = useState(DEFAULTS.tax)
  const [profit, setProfit] = useState(DEFAULTS.profit)
  const [investment, setInvestment] = useState(DEFAULTS.investment)
  const [minProfit, setMinProfit] = useState(DEFAULTS.minProfit)
  const [result, setResult] = useState(null)
  const [roomsError, setRoomsError] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pea-rental-calc')
      if (!saved) return
      const data = JSON.parse(saved)
      setRoomsText((data.rooms || []).join(', '))
      setMonthlyFee(data.monthlyFee ?? DEFAULTS.monthlyFee)
      setTax((data.tax ?? 0.10) * 100)
      setProfit((data.profit ?? 0.15) * 100)
      setInvestment(data.investment ?? DEFAULTS.investment)
      setMinProfit(data.minProfit ?? DEFAULTS.minProfit)
      if (data.rooms) {
        const res = calculateRentalPrices(
          data.rooms,
          data.monthlyFee,
          data.tax,
          data.profit,
          data.investment,
          data.minProfit
        )
        setResult(res)
      }
    } catch {
      localStorage.removeItem('pea-rental-calc')
    }
  }, [])

  const debounceRef = useRef(null)

  function parseRooms(text) {
    if (!text) return []
    return text
      .split(/[\n,;]+/)
      .map(s => s.replace(/[^0-9.]/g, ''))
      .map(Number)
      .filter(n => !Number.isNaN(n) && n > 0)
  }

  function toNumber(value, fallback = 0) {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : fallback
  }

  function compute(
    roomsArray,
    mFee = toNumber(monthlyFee, DEFAULTS.monthlyFee),
    t = toNumber(tax, DEFAULTS.tax) / 100,
    p = toNumber(profit, DEFAULTS.profit) / 100,
    inv = toNumber(investment, DEFAULTS.investment),
    minP = toNumber(minProfit, DEFAULTS.minProfit)
  ) {
    if (!roomsArray || roomsArray.length === 0) {
      setResult(null)
      return
    }
    const res = calculateRentalPrices(roomsArray, mFee, t, p, inv, minP)
    if (res) setResult(res)
    localStorage.setItem(
      'pea-rental-calc',
      JSON.stringify({
        rooms: roomsArray,
        monthlyFee: mFee,
        tax: t,
        profit: p,
        investment: inv,
        minProfit: minP,
      })
    )
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const rooms = parseRooms(roomsText)
      if (roomsText.trim().length > 0 && rooms.length === 0) {
        setRoomsError('Enter valid room areas separated by commas, semicolons, or line breaks.')
        setResult(null)
        return
      }
      setRoomsError('')
      compute(
        rooms,
        toNumber(monthlyFee, DEFAULTS.monthlyFee),
        toNumber(tax, DEFAULTS.tax) / 100,
        toNumber(profit, DEFAULTS.profit) / 100,
        toNumber(investment, DEFAULTS.investment),
        toNumber(minProfit, DEFAULTS.minProfit)
      )
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [roomsText, monthlyFee, tax, profit, investment, minProfit])

  return (
    <>
      <Toolbar bottom tabbar>
        <Link
          tabLink="#tab-inputs"
          tabLinkActive={activeTab === 'inputs'}
          onClick={() => setActiveTab('inputs')}
          text="Calculator"
        />
        <Link
          tabLink="#tab-results"
          tabLinkActive={activeTab === 'results'}
          onClick={() => setActiveTab('results')}
          text="Results"
        />
      </Toolbar>

      <Tabs animated>
        <Tab id="tab-inputs" tabActive={activeTab === 'inputs'} className="page-content">
          <BlockTitle medium>Room setup</BlockTitle>
          <List inset strong dividersIos>
            <ListInput
              clearButton
              label="Room areas"
              placeholder="48, 34, 14, 10"
              type="textarea"
              resizable={false}
              inputProps={{ rows: 1 }}
              info="Use commas, semicolons, or line breaks."
              value={roomsText}
              onInput={e => setRoomsText(e.target.value)}
            />
          </List>

          <BlockTitle medium>Recurring costs</BlockTitle>
          <List inset strong dividersIos>
            <ListInput
              clearButton
              inputmode="decimal"
              min="0"
              step="0.01"
              label="Monthly fees (€)"
              placeholder="250"
              type="number"
              value={monthlyFee}
              onInput={e => setMonthlyFee(e.target.value)}
            />
            <ListInput
              clearButton
              inputmode="decimal"
              min="0"
              step="0.01"
              label="Tax (%)"
              placeholder="10"
              type="number"
              value={tax}
              onInput={e => setTax(e.target.value)}
            />
          </List>

          <BlockTitle medium>Profit goals</BlockTitle>
          <List inset strong dividersIos>
            <ListInput
              clearButton
              inputmode="decimal"
              min="0"
              step="0.01"
              label="Annual profit (%)"
              placeholder="15"
              type="number"
              value={profit}
              onInput={e => setProfit(e.target.value)}
            />
            <ListInput
              clearButton
              inputmode="decimal"
              min="0"
              step="0.01"
              label="Investment (€)"
              placeholder="25000"
              type="number"
              value={investment}
              onInput={e => setInvestment(e.target.value)}
            />
            <ListInput
              clearButton
              inputmode="decimal"
              min="0"
              step="0.01"
              label="Minimum monthly profit (€)"
              placeholder="100"
              type="number"
              value={minProfit}
              onInput={e => setMinProfit(e.target.value)}
            />
          </List>
        </Tab>

        <Tab id="tab-results" tabActive={activeTab === 'results'} className="page-content">
          {roomsError && (
            <Block strong inset role="alert" className="text-color-red">
              {roomsError}
            </Block>
          )}

          {!roomsError && !result && (
            <Block strong inset>Enter at least one room area to see pricing results.</Block>
          )}

          {result && (
            <>
              <List inset strong dividersIos>
                <ListItem
                  title="Status"
                  after={result.isGoalAchieved ? 'Goal achieved' : 'Goal not reached'}
                />
                <ListItem title="Total area" after={formatArea(result.roomsTotalArea)} />
                <ListItem title="Target profit" after={formatMoney(result.monthlyTargetProfit)} />
                <ListItem title="Rent price" after={formatMoney(result.pricePerSqM, '€/m²')} />
                <ListItem title="Monthly fees" after={formatMoney(result.monthlyFeePerSqM, '€/m²')} />
                <ListItem title="Total rent" after={formatMoney(result.totalRent)} />
                <ListItem title="Total fees" after={formatMoney(result.totalFees)} />
                <ListItem title="Tax paid" after={formatMoney(result.totalTaxPaid)} />
                <ListItem title="Net profit" after={formatMoney(result.netProfit)} />
              </List>

              <BlockTitle medium>Per-room pricing breakdown</BlockTitle>
              <List inset strong dividersIos>
                {result.rows.map(row => (
                  <ListItem
                    accordionItem
                    key={row.index}
                    title={`Room ${row.index}`}
                    after={formatMoney(row.total)}
                  >
                    <AccordionContent>
                      <Block inset strong>
                        <dl className="no-margin">
                          <dt>Area</dt>
                          <dd>{formatArea(row.area)}</dd>
                          <dt>Rent</dt>
                          <dd>{formatMoney(row.rent)}</dd>
                          <dt>Fees</dt>
                          <dd>{formatMoney(row.fee)}</dd>
                        </dl>
                      </Block>
                    </AccordionContent>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Tab>
      </Tabs>
    </>
  )
}
