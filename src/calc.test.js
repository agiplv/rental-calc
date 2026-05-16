import { describe, expect, it } from 'vitest'
import { calculateRentalPrices } from './calc'

describe('calculateRentalPrices', () => {
  it('returns a full pricing breakdown for valid room areas', () => {
    const result = calculateRentalPrices([48, 34, 14, 10], 250, 0.1, 0.15, 25000, 100)

    expect(result).not.toBeNull()
    expect(result.roomsTotalArea).toBe(106)
    expect(result.rows).toHaveLength(4)
    expect(result.totalFees).toBeCloseTo(250, 2)
    expect(result.totalTaxPaid).toBeCloseTo(result.totalIncomeBeforeTax * 0.1, 2)
    expect(result.isGoalAchieved).toBe(true)
  })

  it('returns null when the total room area is zero', () => {
    expect(calculateRentalPrices([0, 0], 250, 0.1, 0.15, 25000, 100)).toBeNull()
  })
})
