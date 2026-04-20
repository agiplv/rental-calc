/**
 * Функция для расчета арендной платы и коммунальных платежей
 * на основе целевой прибыли, инвестиций и площади помещений.
 *
 * @param {number[]} roomsArea - Массив площадей (м²) каждого помещения.
 * @param {number} basementMonthlyFee - Общие ежемесячные расходы на содержание подвала/здания (€).
 * @param {number} tax - Процент налога (например, 0.10 для 10%).
 * @param {number} profit - Процент годовой прибыли от инвестиций (например, 0.15 для 15%).
 * @param {number} investment - Сумма инвестиций (€).
 * @param {number} defaultMonthlyProfit - Минимальная целевая месячная прибыль (€).
 */
function calculateRentalPrices(
    roomsArea,
    basementMonthlyFee = 250,
    tax = 0.10,
    profit = 0.15,
    investment = 25000,
    defaultMonthlyProfit = 100
) {
    // --- Документация: Расчет целевой прибыли ---
    // Расчет месячной прибыли, требуемой для достижения годового процента от инвестиций.
    const calculatedProfit = investment > 0 ? (investment * profit) / 12 : 0;

    // Используем максимум между рассчитанной и минимальной целевой прибылью.
    const monthlyTargetProfit = Math.max(calculatedProfit, defaultMonthlyProfit);

    // --- Документация: Расчет общей площади и расходов ---
    // Общая площадь всех комнат.
    const roomsTotalArea = roomsArea.reduce((sum, area) => sum + area, 0);

    if (roomsTotalArea === 0) {
        console.error("Ошибка: Общая площадь помещений равна нулю.");
        return;
    }

    // Коммунальные на м²
    const monthlyFeePerSqM = basementMonthlyFee / roomsTotalArea;

    // --- Документация: Расчет дохода до налога ---
    // Общая сумма, которую необходимо получить, чтобы покрыть:
    // 1. Целевую прибыль (monthlyTargetProfit)
    // 2. Расходы на подвал (basementMonthlyFee)
    // Эта сумма берется ДО вычета налога (1 - tax).
    const totalMonthlyIncomeBeforeTax = (monthlyTargetProfit + basementMonthlyFee) / (1 - tax);

    // Цена за квадратный метр (аренда без коммунальных)
    const pricePerSqM = totalMonthlyIncomeBeforeTax / roomsTotalArea;

    // --- Документация: Вывод общих показателей ---
    console.log("====================================================");
    console.log("             ОБЩИЕ ПОКАЗАТЕЛИ АРЕНДЫ                ");
    console.log("====================================================");
    console.log(`Общая площадь помещений: ${roomsTotalArea.toFixed(2)} м²`);
    console.log(`Целевая месячная прибыль: ${monthlyTargetProfit.toFixed(2)} € (Рассчитана из ${investment} € * ${profit * 100}% годовых, но не менее ${defaultMonthlyProfit} €)`);
    console.log(`Необходимый общий доход (до налога): ${totalMonthlyIncomeBeforeTax.toFixed(2)} €`);
    console.log("----------------------------------------------------");
    console.log(`Цена за аренду: ${pricePerSqM.toFixed(2)} €/м²/мес`);
    console.log(`Цена за коммунальные: ${monthlyFeePerSqM.toFixed(2)} €/м²/мес`);
    console.log("----------------------------------------------------");

    // --- Документация: Расчет и детализация по каждому помещению ---
    let totalRent = 0;
    let totalFees = 0;
    let totalIncomeBeforeTax = 0;

    console.log("\n====================================================");
    console.log("            ДЕТАЛИЗАЦИЯ ПО ПОМЕЩЕНИЯМ               ");
    console.log("====================================================");
    console.log("№ | Площадь м² | Аренда € | Коммун. € | Итого к оплате €");
    console.log("--|------------|----------|-----------|-------------------");

    roomsArea.forEach((area, index) => {
        const roomRent = pricePerSqM * area;              // Аренда без коммунальных
        const roomMonthlyFee = monthlyFeePerSqM * area;   // Коммунальные платежи
        const roomTotal = roomRent + roomMonthlyFee;      // Полная сумма к оплате
        
        totalRent += roomRent;
        totalFees += roomMonthlyFee;
        totalIncomeBeforeTax += roomTotal;
        
        // Вывод с форматированием для лучшей читаемости
        console.log(
            `${String(index + 1).padEnd(2)}|` +
            `${String(area).padStart(11)} |` +
            `${roomRent.toFixed(2).padStart(8)} |` +
            `${roomMonthlyFee.toFixed(2).padStart(9)} |` +
            `${roomTotal.toFixed(2).padStart(17)}`
        );
    });

    // --- Документация: Финальная проверка и итоги ---
    const totalTaxPaid = totalIncomeBeforeTax * tax;
    const netProfit = totalIncomeBeforeTax - totalFees - totalTaxPaid; // Итоговая прибыль после расходов и налогов

    console.log("----------------------------------------------------");
    console.log(`Итого аренда всех помещений: ${totalRent.toFixed(2)} €`);
    console.log(`Итого коммунальные (покрытие расходов): ${totalFees.toFixed(2)} €`);
    console.log(`Итого к оплате арендаторами: ${totalIncomeBeforeTax.toFixed(2)} €`);
    console.log(`Итого налог (${tax * 100}%): ${totalTaxPaid.toFixed(2)} €`);
    console.log("----------------------------------------------------");
    console.log(`ЧИСТАЯ ПРИБЫЛЬ (Доход - Коммунальные - Налог): ${netProfit.toFixed(2)} €`);
    
    // Проверка достижения цели
    const isGoalAchieved = netProfit >= monthlyTargetProfit - 0.01; // С учетом погрешности округления
    console.log(`\n**Цель: Месячная прибыль ${monthlyTargetProfit.toFixed(2)} € ${isGoalAchieved ? '→ ЦЕЛЬ ДОСТИГНУТА! 🎉' : '→ ЦЕЛЬ НЕ ДОСТИГНУТА! 😔'}**`);
    console.log("====================================================");
}

// ------------------------------------------------------------------
// ИСПОЛЬЗОВАНИЕ КОДА:
// ------------------------------------------------------------------

// Исходные данные
const rooms = [
48,
34,
14,
10
];
const monthlyFee = 250;
const annualTax = 0.10;
const annualProfitRate = 0.15;
const totalInvestment = 25000;
const minMonthlyProfit = 100;

// Вызов функции с вашими данными
calculateRentalPrices(
    rooms, 
    monthlyFee, 
    annualTax, 
    annualProfitRate, 
    totalInvestment, 
    minMonthlyProfit
);

// Пример использования с другими данными (например, без инвестиций)
/*
console.log("\n\n----------------------------------------------------");
console.log("             ПРИМЕР 2: БЕЗ ИНВЕСТИЦИЙ                ");
console.log("----------------------------------------------------");
calculateRentalPrices(
    [48, 35], // Новые площади
    150,      // Новые коммунальные
    0.10,
    0.15,
    0,        // Инвестиции: 0
    100
);
*/
