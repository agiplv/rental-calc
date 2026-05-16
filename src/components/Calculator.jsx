import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  AccordionContent,
  Block,
  BlockHeader,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Chip,
  List,
  ListInput,
  ListItem,
  Segmented,
  Tab,
  Tabs,
  Toolbar,
  Link,
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

function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`
}

function parseRooms(text) {
  if (!text) return []
  return text
    .split(/[\n,;]+/)
    .map(segment => segment.replace(/[^0-9.]/g, ''))
    .map(Number)
    .filter(area => !Number.isNaN(area) && area > 0)
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function validateInputs(monthlyFee, tax, profit, investment, minProfit) {
  if (toNumber(monthlyFee, DEFAULTS.monthlyFee) < 0) {
    return 'Monthly fees must be zero or higher.'
  }
  if (toNumber(tax, DEFAULTS.tax) < 0 || toNumber(tax, DEFAULTS.tax) >= 100) {
    return 'Tax must stay between 0% and 99.99%.'
  }
  if (toNumber(profit, DEFAULTS.profit) < 0) {
    return 'Annual profit must be zero or higher.'
  }
  if (toNumber(investment, DEFAULTS.investment) < 0) {
    return 'Investment must be zero or higher.'
  }
  if (toNumber(minProfit, DEFAULTS.minProfit) < 0) {
    return 'Minimum monthly profit must be zero or higher.'
  }
  return ''
}

export default function Calculator() {
  const [activeTab, setActiveTab] = useState('inputs')
  const [roomsText, setRoomsText] = useState(DEFAULTS.roomsText)
  const [newRoomText, setNewRoomText] = useState('')
  const [monthlyFee, setMonthlyFee] = useState(DEFAULTS.monthlyFee)
  const [tax, setTax] = useState(DEFAULTS.tax)
  const [profit, setProfit] = useState(DEFAULTS.profit)
  const [investment, setInvestment] = useState(DEFAULTS.investment)
  const [minProfit, setMinProfit] = useState(DEFAULTS.minProfit)
  const [result, setResult] = useState(null)
  const [roomsError, setRoomsError] = useState('')
  const [validationError, setValidationError] = useState('')
  const debounceRef = useRef(null)

  const parsedRooms = useMemo(() => parseRooms(roomsText), [roomsText])
  const roomsTotalArea = useMemo(
    () => parsedRooms.reduce((sum, area) => sum + area, 0),
    [parsedRooms]
  )
  const formStatusMessage = roomsError || validationError

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pea-rental-calc')
      if (!saved) return
      const data = JSON.parse(saved)
      setRoomsText((data.rooms || []).join(', '))
      setMonthlyFee(data.monthlyFee ?? DEFAULTS.monthlyFee)
      setTax((data.tax ?? DEFAULTS.tax / 100) * 100)
      setProfit((data.profit ?? DEFAULTS.profit / 100) * 100)
      setInvestment(data.investment ?? DEFAULTS.investment)
      setMinProfit(data.minProfit ?? DEFAULTS.minProfit)
    } catch {
      localStorage.removeItem('pea-rental-calc')
    }
  }, [])

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

    const calculation = calculateRentalPrices(roomsArray, mFee, t, p, inv, minP)
    if (!calculation || !Number.isFinite(calculation.totalMonthlyIncomeBeforeTax)) {
      setValidationError('Please review the inputs to keep calculations within valid ranges.')
      setResult(null)
      return
    }

    setResult(calculation)
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
      if (roomsText.trim().length > 0 && parsedRooms.length === 0) {
        setRoomsError('Enter valid room areas separated by commas, semicolons, or line breaks.')
        setValidationError('')
        setResult(null)
        return
      }

      const nextValidationError = validateInputs(monthlyFee, tax, profit, investment, minProfit)
      setRoomsError('')

      if (nextValidationError) {
        setValidationError(nextValidationError)
        setResult(null)
        return
      }

      setValidationError('')
      compute(
        parsedRooms,
        toNumber(monthlyFee, DEFAULTS.monthlyFee),
        toNumber(tax, DEFAULTS.tax) / 100,
        toNumber(profit, DEFAULTS.profit) / 100,
        toNumber(investment, DEFAULTS.investment),
        toNumber(minProfit, DEFAULTS.minProfit)
      )
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [roomsText, parsedRooms, monthlyFee, tax, profit, investment, minProfit])

  return (
    <>
      {/* Tabs are controlled by `activeTab`; toolbar below provides quick access */}

      <Tabs>
        <Tab id="tab-inputs" tabActive={activeTab === 'inputs'} className="page-content calc-shell">

          <BlockHeader medium>Rooms</BlockHeader>
          <Block strong inset className="calc-room-block">
            <div className="calc-room-input-row">
              <div className="calc-room-chips">
                {parsedRooms.map((area, index) => (
                  <Chip
                    key={`${area}-${index}`}
                    text={`${area} m²`}
                    deleteable
                    onDelete={() => {
                      const next = parsedRooms.filter((_, i) => i !== index)
                      setRoomsText(next.join(', '))
                    }}
                  />
                ))}
              </div>

              <input
                className="calc-room-add-input"
                aria-label="Add room size"
                placeholder="Add"
                value={newRoomText}
                onChange={e => setNewRoomText(e.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault()
                    const normalized = (newRoomText || '').replace(/[^0-9.]/g, '').trim()
                    const val = Number(normalized)
                    if (Number.isFinite(val) && val > 0) {
                      const next = parsedRooms.concat(val)
                      setRoomsText(next.join(', '))
                      setNewRoomText('')
                    }
                  }
                }}
              />
            </div>
            {roomsError && <div className="calc-helper-text text-color-red">{roomsError}</div>}
          </Block>

          <BlockHeader medium>Costs and taxes</BlockHeader>
          <List inset strong dividersIos>
            <ListInput
              clearButton
              inputmode="decimal"
              label="Monthly fees (€)"
              min="0"
              placeholder="250"
              step="0.01"
              type="number"
              value={monthlyFee}
              onInput={event => setMonthlyFee(event.target.value)}
            />
            <ListInput
              clearButton
              inputmode="decimal"
              label="Tax (%)"
              min="0"
              max="99.99"
              placeholder="10"
              step="0.01"
              type="number"
              value={tax}
              onInput={event => setTax(event.target.value)}
            />
          </List>

          <BlockHeader medium>Profit targets</BlockHeader>
          <List inset strong dividersIos>
            <ListInput
              clearButton
              inputmode="decimal"
              label="Annual profit (%)"
              min="0"
              placeholder="15"
              step="0.01"
              type="number"
              value={profit}
              onInput={event => setProfit(event.target.value)}
            />
            <ListInput
              clearButton
              inputmode="decimal"
              label="Investment (€)"
              min="0"
              placeholder="25000"
              step="0.01"
              type="number"
              value={investment}
              onInput={event => setInvestment(event.target.value)}
            />
            <ListInput
              clearButton
              inputmode="decimal"
              label="Minimum monthly profit (€)"
              min="0"
              placeholder="100"
              step="0.01"
              type="number"
              value={minProfit}
              onInput={event => setMinProfit(event.target.value)}
            />
          </List>

          {/* result preview removed — details available under Results tab */}
        </Tab>

        <Tab id="tab-results" tabActive={activeTab === 'results'} className="page-content calc-shell">
          {formStatusMessage && (
            <Card>
              <CardHeader className="text-color-red">Check your inputs</CardHeader>
              <CardContent>{formStatusMessage}</CardContent>
            </Card>
          )}

          {!formStatusMessage && !result && (
            <Card>
              <CardHeader>No pricing yet</CardHeader>
              <CardContent>Enter at least one valid room area to see your pricing breakdown.</CardContent>
            </Card>
          )}

          {result && (
            <>
              <Block strong inset>
                <div className="calc-kpi-grid">
                  <div className="calc-kpi">
                    <div className="calc-kpi-label">Net profit</div>
                    <div className="calc-kpi-value">{formatMoney(result.netProfit)}</div>
                  </div>
                  <div className="calc-kpi">
                    <div className="calc-kpi-label">Target profit</div>
                    <div className="calc-kpi-value">{formatMoney(result.monthlyTargetProfit)}</div>
                  </div>
                  <div className="calc-kpi">
                    <div className="calc-kpi-label">Rent price</div>
                    <div className="calc-kpi-value">{formatMoney(result.pricePerSqM, '€/m²')}</div>
                  </div>
                  <div className="calc-kpi">
                    <div className="calc-kpi-label">Total due</div>
                    <div className="calc-kpi-value">{formatMoney(result.totalMonthlyIncomeBeforeTax)}</div>
                  </div>f
                </div>
                {/* helper text moved into Monthly summary list below */}
              </Block>

              <BlockHeader medium>Monthly summary</BlockHeader>
              <List inset strong dividersIos>
                <ListItem
                  title="Status"
                  after={
                    result.isGoalAchieved
                      ? 'The current pricing reaches the requested monthly return.'
                      : 'Increase rent or lower costs to reach the requested monthly return.'
                  }
                />
                <ListItem title="Total area" after={formatArea(result.roomsTotalArea)} />
                <ListItem title="Estimated income before tax" after={formatMoney(result.totalMonthlyIncomeBeforeTax)} />
                <ListItem title="Monthly fees" after={formatMoney(result.totalFees)} />
                <ListItem title="Tax paid" after={formatMoney(result.totalTaxPaid)} />
                <ListItem title="Total rent" after={formatMoney(result.totalRent)} />
                <ListItem title="Fees per m²" after={formatMoney(result.monthlyFeePerSqM, '€/m²')} />
              </List>

              <BlockHeader medium>Per-room detail</BlockHeader>
              <List inset mediaList strong dividersIos>
                {result.rows.map(row => {
                  const areaShare = result.roomsTotalArea > 0 ? (row.area / result.roomsTotalArea) * 100 : 0

                  return (
                    <ListItem
                      accordionItem
                      key={row.index}
                      after={formatMoney(row.total)}
                      footer={`${formatMoney(row.total / row.area, '€/m²')} total`}
                      subtitle={`${formatArea(row.area)} · ${formatPercent(areaShare)} of total area`}
                      title={`Room ${row.index}`}
                    >
                      <AccordionContent>
                        <Block strong inset>
                          <div className="calc-room-detail">
                            <div className="calc-room-total">{formatMoney(row.total)}</div>
                            <div className="calc-detail-row">
                              <span className="calc-detail-label">Area</span>
                              <span>{formatArea(row.area)}</span>
                            </div>
                            <div className="calc-detail-row">
                              <span className="calc-detail-label">Rent portion</span>
                              <span>{formatMoney(row.rent)}</span>
                            </div>
                            <div className="calc-detail-row">
                              <span className="calc-detail-label">Fees portion</span>
                              <span>{formatMoney(row.fee)}</span>
                            </div>
                            <div className="calc-detail-row">
                              <span className="calc-detail-label">Share of total area</span>
                              <span>{formatPercent(areaShare)}</span>
                            </div>
                          </div>
                        </Block>
                      </AccordionContent>
                    </ListItem>
                  )
                })}
              </List>
            </>
          )}
        </Tab>
      </Tabs>

      <Toolbar bottom tabbar>
        <Link
          tabLink="#tab-inputs"
          tabLinkActive
          onClick={() => setActiveTab('inputs')}
        >
          <i className="icon f7-icons">square_list</i>
          <span className="toolbar-label">Inputs</span>
        </Link>
        <Link
          tabLink="#tab-results"
          onClick={() => setActiveTab('results')}
        >
          <i className="icon f7-icons">chart_bar</i>
          <span className="toolbar-label">Results</span>
        </Link>
        <Link onClick={() => null}>
          <i className="icon f7-icons">gear_alt_fill</i>
          <span className="toolbar-label">More</span>
        </Link>
      </Toolbar>
    </>
  )
}
