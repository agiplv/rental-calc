import React, { useState, useEffect, useRef } from 'react'
import { Block, Button, Card, CardContent, List, ListInput, ListItem } from 'framework7-react'
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
  const [roomsText, setRoomsText] = useState(DEFAULTS.roomsText)
  const [monthlyFee, setMonthlyFee] = useState(DEFAULTS.monthlyFee)
  const [tax, setTax] = useState(DEFAULTS.tax)
  const [profit, setProfit] = useState(DEFAULTS.profit)
  const [investment, setInvestment] = useState(DEFAULTS.investment)
  const [minProfit, setMinProfit] = useState(DEFAULTS.minProfit)
  const [result, setResult] = useState(null)

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

  function onCalc(e) {
    if (e && e.preventDefault) e.preventDefault()
    const rooms = parseRooms(roomsText)
    compute(rooms)
  }

  // Live calculation: recalculate when inputs change (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const rooms = parseRooms(roomsText)
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
    <Block className="calculator-layout">
      <Card className="panel-card">
        <CardContent>
          <form onSubmit={onCalc}>
            <div className="section-heading">
              <div>
                <h2>Inputs</h2>
                <p>Update the assumptions to refresh the pricing instantly.</p>
              </div>
              <Button fill round type="submit">
                Recalculate
              </Button>
            </div>

            <List inset strong dividersIos className="input-list">
              <ListInput
                clearButton
                label="Room areas"
                placeholder="48, 34, 14, 10"
                type="textarea"
                value={roomsText}
                onInput={e => setRoomsText(e.target.value)}
              />
              <ListInput
                clearButton
                label="Monthly fees (€)"
                type="number"
                value={monthlyFee}
                onInput={e => setMonthlyFee(e.target.value)}
              />
              <ListInput
                clearButton
                label="Tax (%)"
                type="number"
                value={tax}
                onInput={e => setTax(e.target.value)}
              />
              <ListInput
                clearButton
                label="Annual profit (%)"
                type="number"
                value={profit}
                onInput={e => setProfit(e.target.value)}
              />
              <ListInput
                clearButton
                label="Investment (€)"
                type="number"
                value={investment}
                onInput={e => setInvestment(e.target.value)}
              />
              <ListInput
                clearButton
                label="Minimum monthly profit (€)"
                type="number"
                value={minProfit}
                onInput={e => setMinProfit(e.target.value)}
              />
            </List>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="panel-card">
          <CardContent>
            <div className="section-heading result-heading">
              <div>
                <h2>Results</h2>
                <p>Per-room pricing and overall profitability.</p>
              </div>
              <span
                className={`status-pill ${result.isGoalAchieved ? 'is-success' : 'is-warning'}`}
              >
                {result.isGoalAchieved ? 'Goal achieved' : 'Goal missed'}
              </span>
            </div>

            <List inset strong dividersIos className="summary-list">
              <ListItem title="Total area" after={formatArea(result.roomsTotalArea)} />
              <ListItem title="Target profit" after={formatMoney(result.monthlyTargetProfit)} />
              <ListItem title="Rent price" after={formatMoney(result.pricePerSqM, '€/m²')} />
              <ListItem
                title="Monthly fees"
                after={formatMoney(result.monthlyFeePerSqM, '€/m²')}
              />
              <ListItem title="Total rent" after={formatMoney(result.totalRent)} />
              <ListItem title="Total fees" after={formatMoney(result.totalFees)} />
              <ListItem title="Tax paid" after={formatMoney(result.totalTaxPaid)} />
              <ListItem title="Net profit" after={formatMoney(result.netProfit)} />
            </List>

            <div className="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Area</th>
                    <th>Rent</th>
                    <th>Fees</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map(row => (
                    <tr key={row.index}>
                      <td>{row.index}</td>
                      <td>{formatArea(row.area)}</td>
                      <td>{formatMoney(row.rent)}</td>
                      <td>{formatMoney(row.fee)}</td>
                      <td>{formatMoney(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </Block>
  )
}
