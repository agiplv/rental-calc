const template = document.createElement('template');
template.innerHTML = `
  <div class="max-w-2xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4 text-center">PEA Rental Calc</h1>
    <form id="rental-form" class="space-y-4">
      <div>
        <label class="block mb-1">Площади помещений (через запятую, м²):</label>
        <input type="text" name="rooms" class="w-full p-2 rounded bg-slate-800 text-slate-100" required />
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <label class="block mb-1">Коммунальные (€/мес):</label>
          <input type="number" name="monthlyFee" class="w-full p-2 rounded bg-slate-800 text-slate-100" value="250" required />
        </div>
        <div class="flex-1">
          <label class="block mb-1">Налог (%):</label>
          <input type="number" name="tax" class="w-full p-2 rounded bg-slate-800 text-slate-100" value="10" required />
        </div>
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <label class="block mb-1">Годовая прибыль (%):</label>
          <input type="number" name="profit" class="w-full p-2 rounded bg-slate-800 text-slate-100" value="15" required />
        </div>
        <div class="flex-1">
          <label class="block mb-1">Инвестиции (€):</label>
          <input type="number" name="investment" class="w-full p-2 rounded bg-slate-800 text-slate-100" value="25000" required />
        </div>
        <div class="flex-1">
          <label class="block mb-1">Мин. прибыль (€/мес):</label>
          <input type="number" name="minProfit" class="w-full p-2 rounded bg-slate-800 text-slate-100" value="100" required />
        </div>
      </div>
      <button type="submit" class="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold">Рассчитать</button>
    </form>
    <div id="result" class="mt-6"></div>
  </div>
`;

class PeaApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.form = this.shadowRoot.querySelector('#rental-form');
    this.result = this.shadowRoot.querySelector('#result');
  }

  connectedCallback() {
    // Загрузка из localStorage
    const saved = localStorage.getItem('pea-rental-calc');
    if (saved) {
      const data = JSON.parse(saved);
      this.form.rooms.value = data.rooms.join(', ');
      this.form.monthlyFee.value = data.monthlyFee;
      this.form.tax.value = data.tax * 100;
      this.form.profit.value = data.profit * 100;
      this.form.investment.value = data.investment;
      this.form.minProfit.value = data.minProfit;
      this.renderResult(data);
    }
    this.form.addEventListener('submit', this.onSubmit.bind(this));
  }

  onSubmit(e) {
    e.preventDefault();
    const rooms = this.form.rooms.value.split(',').map(s => parseFloat(s.trim())).filter(Boolean);
    const monthlyFee = parseFloat(this.form.monthlyFee.value);
    const tax = parseFloat(this.form.tax.value) / 100;
    const profit = parseFloat(this.form.profit.value) / 100;
    const investment = parseFloat(this.form.investment.value);
    const minProfit = parseFloat(this.form.minProfit.value);
    const data = { rooms, monthlyFee, tax, profit, investment, minProfit };
    localStorage.setItem('pea-rental-calc', JSON.stringify(data));
    this.renderResult(data);
  }

  renderResult({ rooms, monthlyFee, tax, profit, investment, minProfit }) {
    if (!rooms.length || rooms.some(isNaN)) {
      this.result.innerHTML = '<div class="text-red-400">Введите корректные площади помещений.</div>';
      return;
    }
    const res = calculateRentalPrices(rooms, monthlyFee, tax, profit, investment, minProfit);
    this.result.innerHTML = res.html;
  }
}

// Логика калькулятора (адаптирована для вывода в html)
function calculateRentalPrices(
  roomsArea,
  basementMonthlyFee = 250,
  tax = 0.10,
  profit = 0.15,
  investment = 25000,
  defaultMonthlyProfit = 100
) {
  const calculatedProfit = investment > 0 ? (investment * profit) / 12 : 0;
  const monthlyTargetProfit = Math.max(calculatedProfit, defaultMonthlyProfit);
  const roomsTotalArea = roomsArea.reduce((sum, area) => sum + area, 0);
  if (roomsTotalArea === 0) {
    return { html: '<div class="text-red-400">Ошибка: Общая площадь помещений равна нулю.</div>' };
  }
  const monthlyFeePerSqM = basementMonthlyFee / roomsTotalArea;
  const totalMonthlyIncomeBeforeTax = (monthlyTargetProfit + basementMonthlyFee) / (1 - tax);
  const pricePerSqM = totalMonthlyIncomeBeforeTax / roomsTotalArea;
  let totalRent = 0, totalFees = 0, totalIncomeBeforeTax = 0;
  let rows = '';
  roomsArea.forEach((area, index) => {
    const roomRent = pricePerSqM * area;
    const roomMonthlyFee = monthlyFeePerSqM * area;
    const roomTotal = roomRent + roomMonthlyFee;
    totalRent += roomRent;
    totalFees += roomMonthlyFee;
    totalIncomeBeforeTax += roomTotal;
    rows += `<tr>
      <td class="text-center">${index + 1}</td>
      <td class="text-center">${area}</td>
      <td class="text-right">${roomRent.toFixed(2)}</td>
      <td class="text-right">${roomMonthlyFee.toFixed(2)}</td>
      <td class="text-right font-semibold">${roomTotal.toFixed(2)}</td>
    </tr>`;
  });
  const totalTaxPaid = totalIncomeBeforeTax * tax;
  const netProfit = totalIncomeBeforeTax - totalFees - totalTaxPaid;
  const isGoalAchieved = netProfit >= monthlyTargetProfit - 0.01;
  return {
    html: `
      <div class="mb-4">
        <div>Общая площадь: <b>${roomsTotalArea.toFixed(2)} м²</b></div>
        <div>Целевая прибыль: <b>${monthlyTargetProfit.toFixed(2)} €</b></div>
        <div>Доход до налога: <b>${totalMonthlyIncomeBeforeTax.toFixed(2)} €</b></div>
        <div>Цена аренды: <b>${pricePerSqM.toFixed(2)} €/м²/мес</b></div>
        <div>Коммунальные: <b>${monthlyFeePerSqM.toFixed(2)} €/м²/мес</b></div>
      </div>
      <table class="w-full text-sm bg-slate-800 rounded overflow-hidden">
        <thead class="bg-slate-700">
          <tr>
            <th>№</th><th>Площадь</th><th>Аренда</th><th>Коммун.</th><th>Итого</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="mt-4">
        <div>Итого аренда: <b>${totalRent.toFixed(2)} €</b></div>
        <div>Итого коммунальные: <b>${totalFees.toFixed(2)} €</b></div>
        <div>Итого к оплате: <b>${totalIncomeBeforeTax.toFixed(2)} €</b></div>
        <div>Налог (${(tax * 100).toFixed(1)}%): <b>${totalTaxPaid.toFixed(2)} €</b></div>
        <div class="text-lg mt-2">Чистая прибыль: <b>${netProfit.toFixed(2)} €</b></div>
        <div class="mt-2 font-bold ${isGoalAchieved ? 'text-green-400' : 'text-red-400'}">
          Цель: ${monthlyTargetProfit.toFixed(2)} € ${isGoalAchieved ? '→ ЦЕЛЬ ДОСТИГНУТА! 🎉' : '→ ЦЕЛЬ НЕ ДОСТИГНУТА! 😔'}
        </div>
      </div>
    `
  };
}

customElements.define('pea-app', PeaApp);
