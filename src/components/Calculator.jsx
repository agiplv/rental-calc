import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  AccordionItem,
  AccordionContent,
  AccordionToggle,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Link,
  List,
  ListInput,
  ListItem,
  PageContent,
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
  sizeWeight: 0,
}
const CALC_TAB = '#tab-calc'
const RESULT_TAB = '#tab-result'

function formatMoney(value, suffix = '€') {
  return `${Number(value).toFixed(2)} ${suffix}`
}

function formatArea(value) {
  return `${Number(value).toFixed(2)} m²`
}

function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`
}

function formatRate(value) {
  if (!Number.isFinite(value)) return 'N/A'
  return formatMoney(value, '€/m²')
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

function parseNewRoomValue(value) {
  const normalized = (value || '').replace(/[^0-9.]/g, '').trim()
  const numeric = Number(normalized)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

function validateInputs(monthlyFee, tax, profit, investment, minProfit, sizeWeight) {
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
  if (toNumber(sizeWeight, DEFAULTS.sizeWeight) < 0 || toNumber(sizeWeight, DEFAULTS.sizeWeight) > 10) {
    return 'Size weighting must be between 0 and 10.'
  }
  return ''
}

export default function Calculator() {
  const [roomsText, setRoomsText] = useState(DEFAULTS.roomsText)
  const [newRoomText, setNewRoomText] = useState('')
  const [monthlyFee, setMonthlyFee] = useState(DEFAULTS.monthlyFee)
  const [tax, setTax] = useState(DEFAULTS.tax)
  const [profit, setProfit] = useState(DEFAULTS.profit)
  const [investment, setInvestment] = useState(DEFAULTS.investment)
  const [minProfit, setMinProfit] = useState(DEFAULTS.minProfit)
  const [sizeWeight, setSizeWeight] = useState(DEFAULTS.sizeWeight)
  const [result, setResult] = useState(null)
  const [roomsError, setRoomsError] = useState('')
  const [validationError, setValidationError] = useState('')
  const debounceRef = useRef(null)

  const parsedRooms = useMemo(() => parseRooms(roomsText), [roomsText])
  const roomsTotalArea = useMemo(
    () => parsedRooms.reduce((sum, area) => sum + area, 0),
    [parsedRooms]
  )
  const canAddRoom = useMemo(() => parseNewRoomValue(newRoomText) !== null, [newRoomText])
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
      setSizeWeight(data.sizeWeight ?? DEFAULTS.sizeWeight)
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
    minP = toNumber(minProfit, DEFAULTS.minProfit),
    sw = toNumber(sizeWeight, DEFAULTS.sizeWeight)
  ) {
    if (!roomsArray || roomsArray.length === 0) {
      setResult(null)
      return
    }

    const calculation = calculateRentalPrices(roomsArray, mFee, t, p, inv, minP, sw)
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
        sizeWeight: sw,
      })
    )
  }

  function addRoomFromInput() {
    const val = parseNewRoomValue(newRoomText)
    if (val === null) return
    const next = parsedRooms.concat(val)
    setRoomsText(next.join(', '))
    setNewRoomText('')
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

      const nextValidationError = validateInputs(monthlyFee, tax, profit, investment, minProfit, sizeWeight)
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
        toNumber(minProfit, DEFAULTS.minProfit),
        toNumber(sizeWeight, DEFAULTS.sizeWeight)
      )
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [roomsText, parsedRooms, monthlyFee, tax, profit, investment, minProfit, sizeWeight])

  return (
    <>
      <PageContent>
        <Tabs animated swipeable>
          <Tab id="tab-calc" tabActive>
            <List className="list-strong list-dividers inset-ios no-hairlines margin-top margin-horizontal margin-bottom">
                  <ListItem accordionItem title="Rooms">
                    <AccordionContent>
                      <List className="list-strong list-dividers inset-ios no-margin-top no-margin-bottom">
                        <ListInput
                          clearButton
                          inputmode="decimal"
                          label="New room area (m²)"
                          placeholder="e.g. 12.5"
                          type="number"
                          value={newRoomText}
                          onInput={event => setNewRoomText(event.target.value)}
                          inputProps={{
                            min: '0',
                            step: '0.01',
                            onKeyDown: event => {
                              if (event.key === 'Enter' || event.key === ',') {
                                event.preventDefault()
                                addRoomFromInput()
                              }
                            },
                          }}
                        />
                        <ListItem>
                          <Button
                            fill
                            large
                            className="width-100 display-flex justify-content-center align-items-center"
                            disabled={!canAddRoom}
                            onClick={addRoomFromInput}
                          >
                            <i className="icon f7-icons">plus_circle_fill</i>
                            <span>Add room</span>
                          </Button>
                        </ListItem>
                        <ListItem title="Total area">
                          <span slot="after" className="text-color-black">{formatArea(roomsTotalArea)}</span>
                        </ListItem>
                        <ListItem title="Rooms">
                          <div slot="after" className="display-flex align-items-center flex-shrink-1">
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
                        </ListItem>
                        {roomsError && (
                          <ListItem title={roomsError}>
                            <span slot="after" className="text-color-red">!</span>
                          </ListItem>
                        )}
                      </List>
                    </AccordionContent>
                  </ListItem>
                  <ListItem accordionItem title="Costs and taxes">
                    <AccordionContent>
                      <List className="list-strong list-dividers inset-ios no-margin-top no-margin-bottom">
                        <ListInput
                          clearButton
                          inputmode="decimal"
                          label="Monthly fees"
                          placeholder="250"
                          type="number"
                          value={monthlyFee}
                          onInput={event => setMonthlyFee(event.target.value)}
                          inputProps={{ min: '0', step: '0.01' }}
                        >
                          <span slot="after">€</span>
                        </ListInput>
                        <ListInput
                          clearButton
                          inputmode="decimal"
                          label="Tax"
                          placeholder="10"
                          type="number"
                          value={tax}
                          onInput={event => setTax(event.target.value)}
                          inputProps={{ min: '0', max: '99.99', step: '0.01' }}
                        >
                          <span slot="after">%</span>
                        </ListInput>
                      </List>
                    </AccordionContent>
                  </ListItem>
                  <ListItem accordionItem title="Profit targets">
                    <AccordionContent>
                      <List className="list-strong list-dividers inset-ios no-margin-top no-margin-bottom">
                        <ListInput
                          clearButton
                          inputmode="decimal"
                          label="Annual profit"
                          placeholder="15"
                          type="number"
                          value={profit}
                          onInput={event => setProfit(event.target.value)}
                          inputProps={{ min: '0', step: '0.01' }}
                        >
                          <span slot="after">%</span>
                        </ListInput>
                        <ListInput
                          clearButton
                          inputmode="decimal"
                          label="Investment"
                          placeholder="25000"
                          type="number"
                          value={investment}
                          onInput={event => setInvestment(event.target.value)}
                          inputProps={{ min: '0', step: '0.01' }}
                        >
                          <span slot="after">€</span>
                        </ListInput>
                        <ListInput
                          clearButton
                          inputmode="decimal"
                          label="Minimum monthly profit"
                          placeholder="100"
                          type="number"
                          value={minProfit}
                          onInput={event => setMinProfit(event.target.value)}
                          inputProps={{ min: '0', step: '0.01' }}
                        >
                          <span slot="after">€</span>
                        </ListInput>
                        <ListInput
                          clearButton
                          inputmode="decimal"
                          label="Size weighting"
                          placeholder="0"
                          type="number"
                          value={sizeWeight}
                          onInput={event => setSizeWeight(event.target.value)}
                          inputProps={{ min: '0', max: '10', step: '0.01' }}
                        >
                          <span slot="after">k</span>
                        </ListInput>
                      </List>
                    </AccordionContent>
                  </ListItem>
                </List>
          </Tab>

          <Tab id="tab-result">
            <div className="margin-top margin-horizontal margin-bottom">
              {formStatusMessage && (
                <List>
                  <ListItem title="Check your inputs">
                    <span slot="after" className="text-color-red">{formStatusMessage}</span>
                  </ListItem>
                </List>
              )}

              {!formStatusMessage && !result && (
                <List>
                  <ListItem
                    footer="Enter at least one valid room area to see your pricing breakdown."
                    title="No pricing yet"
                  />
                </List>
              )}

              {result && (
                <>
                  <List>
                    <ListItem
                      accordionItem
                      title="Summary"
                      after={formatMoney(result.totalMonthlyIncomeBeforeTax)}
                      subtitle={`${formatMoney(result.netProfit)} net profit`}
                      footer={`${formatMoney(result.pricePerSqM, '€/m²')} rent price`}
                    >
                      <AccordionContent>
                        <List>
                          <ListItem title="Total due" after={formatMoney(result.totalMonthlyIncomeBeforeTax)} />
                          <ListItem title="Net profit" after={formatMoney(result.netProfit)} />
                          <ListItem title="Target profit" after={formatMoney(result.monthlyTargetProfit)} />
                          <ListItem title="Rent price" after={formatMoney(result.pricePerSqM, '€/m²')} />
                          <ListItem title="Total area" after={formatArea(result.roomsTotalArea)} />
                          <ListItem title="Monthly fees" after={formatMoney(result.totalFees)} />
                          <ListItem title="Tax paid" after={formatMoney(result.totalTaxPaid)} />
                          <ListItem title="Fees per m²" after={formatMoney(result.monthlyFeePerSqM, '€/m²')} />
                        </List>
                      </AccordionContent>
                    </ListItem>
                  </List>

                  {result.rows.map(row => {
                    const areaShare = result.roomsTotalArea > 0 ? (row.area / result.roomsTotalArea) * 100 : 0
                    const totalRatePerSqM = row.area > 0 ? row.total / row.area : null

                    return (
                      <AccordionItem key={row.index}>
                        <Card className="no-margin-bottom margin-top-half">
                          <AccordionToggle>
                            <CardHeader className="display-flex justify-content-space-between align-items-flex-start">
                              <div className="min-width-0">
                                <div className="font-weight-semibold">{`Room ${row.index}`}</div>
                                <div className="text-color-gray text-small">
                                  {`${formatArea(row.area)} · ${formatPercent(areaShare)} of total area`}
                                </div>
                              </div>
                              <div className="display-flex align-items-center">
                                <span className="text-color-black font-weight-semibold margin-right-half">
                                  {formatMoney(row.total)}
                                </span>
                                <i className="icon f7-icons text-color-gray" aria-hidden="true">chevron_down</i>
                              </div>
                            </CardHeader>
                          </AccordionToggle>
                          <AccordionContent>
                            <CardContent className="padding-top-half">
                              <List>
                                <ListItem title="Area" after={formatArea(row.area)} />
                                <ListItem title="Rent portion" after={formatMoney(row.rent)} />
                                <ListItem title="Fees portion" after={formatMoney(row.fee)} />
                                <ListItem title="Rate" after={formatRate(totalRatePerSqM)} />
                                <ListItem title="Share of total area" after={formatPercent(areaShare)} />
                              </List>
                            </CardContent>
                          </AccordionContent>
                        </Card>
                      </AccordionItem>
                    )
                  })}
                </>
              )}
            </div>
          </Tab>
        </Tabs>
      </PageContent>

      <Toolbar tabbar labels bottom>
        <Link tabLink={CALC_TAB} tabLinkActive>
          <i className="icon f7-icons" aria-hidden="true">slider_horizontal_3</i>
          <span>Calc</span>
        </Link>
        <Link tabLink={RESULT_TAB}>
          <i className="icon f7-icons" aria-hidden="true">chart_bar_fill</i>
          <span>Result</span>
        </Link>
      </Toolbar>
    </>
  )
}
