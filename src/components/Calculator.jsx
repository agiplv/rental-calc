import React, { useState, useEffect, useRef } from 'react'
import { Box, TextField, Button, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material'
import { calculateRentalPrices } from '../calc'

export default function Calculator() {
  const [roomsText, setRoomsText] = useState('48, 34, 14, 10')
  const [monthlyFee, setMonthlyFee] = useState(250)
  const [tax, setTax] = useState(10)
  const [profit, setProfit] = useState(15)
  const [investment, setInvestment] = useState(25000)
  const [minProfit, setMinProfit] = useState(100)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('pea-rental-calc')
    if (saved) {
      const data = JSON.parse(saved)
      setRoomsText((data.rooms || []).join(', '))
      setMonthlyFee(data.monthlyFee ?? 250)
      setTax((data.tax ?? 0.10) * 100)
      setProfit((data.profit ?? 0.15) * 100)
      setInvestment(data.investment ?? 25000)
      setMinProfit(data.minProfit ?? 100)
      if (data.rooms) {
        const res = calculateRentalPrices(data.rooms, data.monthlyFee, data.tax, data.profit, data.investment, data.minProfit)
        setResult(res)
      }
    }
  }, [])

  const debounceRef = useRef(null)

  function parseRooms(text) {
    if (!text) return []
    return text.split(',').map(s => s.replace(/[^0-9.]/g, '')).map(Number).filter(n => !isNaN(n) && n > 0)
  }

  function compute(roomsArray, mFee = Number(monthlyFee), t = tax / 100, p = profit / 100, inv = Number(investment), minP = Number(minProfit)) {
    if (!roomsArray || roomsArray.length === 0) {
      setResult(null)
      return
    }
    const res = calculateRentalPrices(roomsArray, mFee, t, p, inv, minP)
    if (res) setResult(res)
    localStorage.setItem('pea-rental-calc', JSON.stringify({ rooms: roomsArray, monthlyFee: mFee, tax: t, profit: p, investment: inv, minProfit: minP }))
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
      compute(rooms, Number(monthlyFee), tax / 100, profit / 100, Number(investment), Number(minProfit))
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [roomsText, monthlyFee, tax, profit, investment, minProfit])

  return (
    <Paper sx={{ p: 2 }} elevation={3} component="form" onSubmit={onCalc}>
      <Typography variant="h6" sx={{ mb: 2 }}>Rental calculator</Typography>
      <TextField fullWidth label="Rooms areas (m², comma separated)" value={roomsText} onChange={e => setRoomsText(e.target.value)} sx={{ mb: 2 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <TextField label="Monthly fees (€)" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} />
        <TextField label="Tax (%)" value={tax} onChange={e => setTax(e.target.value)} />
        <TextField label="Profit (%)" value={profit} onChange={e => setProfit(e.target.value)} />
        <TextField label="Investment (€)" value={investment} onChange={e => setInvestment(e.target.value)} />
        <TextField label="Min monthly profit (€)" value={minProfit} onChange={e => setMinProfit(e.target.value)} />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button type="submit" variant="contained">Calculate</Button>
      </Box>

      {result && (
        <Box sx={{ mt: 3 }}>
          <Typography>Общая площадь: <strong>{result.roomsTotalArea.toFixed(2)} м²</strong></Typography>
          <Typography>Цел. прибыль: <strong>{result.monthlyTargetProfit.toFixed(2)} €</strong></Typography>
          <Typography>Цена аренды: <strong>{result.pricePerSqM.toFixed(2)} €/м²/мес</strong></Typography>
          <Typography>Коммунальные: <strong>{result.monthlyFeePerSqM.toFixed(2)} €/м²/мес</strong></Typography>

          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Area</TableCell>
                <TableCell align="right">Rent €</TableCell>
                <TableCell align="right">Fee €</TableCell>
                <TableCell align="right">Total €</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.rows.map(r => (
                <TableRow key={r.index}>
                  <TableCell>{r.index}</TableCell>
                  <TableCell>{r.area}</TableCell>
                  <TableCell align="right">{r.rent.toFixed(2)}</TableCell>
                  <TableCell align="right">{r.fee.toFixed(2)}</TableCell>
                  <TableCell align="right"><strong>{r.total.toFixed(2)}</strong></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box sx={{ mt: 2 }}>
            <Typography>Итого аренда: <strong>{result.totalRent.toFixed(2)} €</strong></Typography>
            <Typography>Итого коммунальные: <strong>{result.totalFees.toFixed(2)} €</strong></Typography>
            <Typography>Налог: <strong>{result.totalTaxPaid.toFixed(2)} €</strong></Typography>
            <Typography variant="h6" sx={{ mt: 1, color: result.isGoalAchieved ? 'success.main' : 'error.main' }}>Чистая прибыль: {result.netProfit.toFixed(2)} €</Typography>
          </Box>
        </Box>
      )}
    </Paper>
  )
}
