export function calculateRentalPrices(
  roomsArea,
  basementMonthlyFee = 250,
  tax = 0.10,
  profit = 0.15,
  investment = 25000,
  defaultMonthlyProfit = 100,
  sizeWeight = 0
) {
  const calculatedProfit = investment > 0 ? (investment * profit) / 12 : 0;
  const monthlyTargetProfit = Math.max(calculatedProfit, defaultMonthlyProfit);
  const roomsTotalArea = roomsArea.reduce((s, a) => s + a, 0);
  if (roomsTotalArea === 0) return null;
  const monthlyFeePerSqM = basementMonthlyFee / roomsTotalArea;
  // totalCollectedBeforeTax is the total amount collected from tenants (rent + fees)
  const totalMonthlyIncomeBeforeTax = (monthlyTargetProfit + basementMonthlyFee) / (1 - tax);
  // rent portion excludes the fixed monthly fees; allocate rent across area only
  const rentTotalBeforeTax = totalMonthlyIncomeBeforeTax - basementMonthlyFee;
  const pricePerSqM = rentTotalBeforeTax / roomsTotalArea;
  let totalRent = 0, totalFees = 0, totalIncomeBeforeTax = 0;
  // If sizeWeight > 0, allocate rent proportionally to area^-sizeWeight so smaller rooms get higher €/m²
  let rows
  if (!sizeWeight || Number(sizeWeight) === 0) {
    rows = roomsArea.map((area, index) => {
      const roomRent = pricePerSqM * area;
      const roomMonthlyFee = monthlyFeePerSqM * area;
      const roomTotal = roomRent + roomMonthlyFee;
      totalRent += roomRent;
      totalFees += roomMonthlyFee;
      totalIncomeBeforeTax += roomTotal;
      return {
        index: index + 1,
        area,
        rent: roomRent,
        fee: roomMonthlyFee,
        total: roomTotal
      }
    })
  } else {
    const weights = roomsArea.map(a => Math.pow(a, -Math.abs(sizeWeight)) )
    const sumWeights = weights.reduce((s, w) => s + w, 0)
    rows = roomsArea.map((area, index) => {
      const weight = weights[index]
      const roomRent = (sumWeights > 0 ? (rentTotalBeforeTax * (weight / sumWeights)) : 0)
      const roomMonthlyFee = monthlyFeePerSqM * area;
      const roomTotal = roomRent + roomMonthlyFee;
      totalRent += roomRent;
      totalFees += roomMonthlyFee;
      totalIncomeBeforeTax += roomTotal;
      return {
        index: index + 1,
        area,
        rent: roomRent,
        fee: roomMonthlyFee,
        total: roomTotal
      }
    })
  }
  const totalTaxPaid = totalIncomeBeforeTax * tax;
  const netProfit = totalIncomeBeforeTax - totalFees - totalTaxPaid;
  const isGoalAchieved = netProfit >= monthlyTargetProfit - 0.01;
  return {
    roomsTotalArea,
    monthlyTargetProfit,
    totalMonthlyIncomeBeforeTax,
    pricePerSqM,
    monthlyFeePerSqM,
    rows,
    totalRent,
    totalFees,
    totalIncomeBeforeTax,
    totalTaxPaid,
    netProfit,
    isGoalAchieved
  }
}
