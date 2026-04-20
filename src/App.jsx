import React from 'react'
import { CssBaseline, Container, AppBar, Toolbar, Typography, Box } from '@mui/material'
import Calculator from './components/Calculator'

export default function App() {
  return (
    <>
      <CssBaseline />
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PEA Rental Calc
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ py: 2 }}>
        <Container maxWidth="sm">
          <Calculator />
        </Container>
      </Box>
    </>
  )
}
