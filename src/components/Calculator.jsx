import React, { useState, useEffect, useRef } from 'react'
import { Block, Card, CardContent, List, ListInput, ListItem } from 'framework7-react'
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
    <Block className="calculator-layout">
      <Card className="panel-card">
        <CardContent>
          <div className="section-heading">
            <div>
              <h2>Inputs</h2>
              <p>Values update results automatically as you type.</p>
            </div>
          </div>

          <div className="form-group">
            <h3>Room setup</h3>
            <List inset strong dividersIos className="input-list">
              <ListInput
                clearButton
                label="Room areas"
                placeholder="48, 34, 14, 10"
                type="textarea"
                info="Use commas, semicolons, or line breaks."
                value={roomsText}
                onInput={e => setRoomsText(e.target.value)}
              />
            </List>
          </div>

          <div className="form-group">
            <h3>Recurring costs</h3>
            <List inset strong dividersIos className="input-list">
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
          </div>

          <div className="form-group">
            <h3>Profit goals</h3>
            <List inset strong dividersIos className="input-list">
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
          </div>
        </CardContent>
      </Card>

      <Card className="panel-card">
        <CardContent>
          <div className="section-heading result-heading">
            <div>
              <h2>Results</h2>
              <p>Per-room pricing and overall profitability.</p>
            </div>
            {result && (
              <span className={`status-pill ${result.isGoalAchieved ? 'is-success' : 'is-warning'}`}>
                {result.isGoalAchieved ? 'Goal achieved' : 'Goal not reached'}
              </span>
            )}
          </div>

          {roomsError && (
            <div className="state-card state-error" role="alert">
              {roomsError}
            </div>
          )}

          {!roomsError && !result && (
            <div className="state-card">
              Enter at least one room area to see pricing results.
            </div>
          )}

          {result && (
            <>
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

              <div className="room-results">
                {result.rows.map(row => (
                  <div className="room-result-item" key={row.index}>
                    <h3>Room {row.index}</h3>
                    <dl>
                      <div>
                        <dt>Area</dt>
                        <dd>{formatArea(row.area)}</dd>
                      </div>
                      <div>
                        <dt>Rent</dt>
                        <dd>{formatMoney(row.rent)}</dd>
                      </div>
                      <div>
                        <dt>Fees</dt>
                        <dd>{formatMoney(row.fee)}</dd>
                      </div>
                      <div>
                        <dt>Total</dt>
                        <dd>{formatMoney(row.total)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </Block>
  )
}
