const template = document.createElement('template');
template.innerHTML = `
  <div class="max-w-md mx-auto p-4 pb-8 rounded-xl shadow-lg bg-slate-900/90 backdrop-blur">
    <h1 class="text-2xl font-bold mb-4 text-center tracking-tight">PEA Rental Calc</h1>
    <form id="rental-form" class="space-y-4" autocomplete="on">
      <div>
        <label class="block mb-1" for="rooms">Площади помещений (через запятую, м²):</label>
        <input type="text" inputmode="decimal" pattern="[\d., ]+" name="rooms" id="rooms" class="w-full p-3 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:ring-2 focus:ring-blue-500 transition" required autocapitalize="off" autocomplete="on" autocorrect="off" spellcheck="false" placeholder="например: 48, 34, 14, 10" />
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <label class="block mb-1" for="monthlyFee">Коммунальные (€/мес):</label>
          <input type="number" name="monthlyFee" id="monthlyFee" class="w-full p-3 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:ring-2 focus:ring-blue-500 transition" value="250" required inputmode="decimal" autocomplete="on" />
        </div>
        <div class="flex-1">
          <label class="block mb-1" for="tax">Налог (%):</label>
          <input type="number" name="tax" id="tax" class="w-full p-3 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:ring-2 focus:ring-blue-500 transition" value="10" required inputmode="decimal" autocomplete="on" />
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <div class="flex-1 min-w-[120px]">
          <label class="block mb-1" for="profit">Годовая прибыль (%):</label>
          <input type="number" name="profit" id="profit" class="w-full p-3 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:ring-2 focus:ring-blue-500 transition" value="15" required inputmode="decimal" autocomplete="on" />
        </div>
        <div class="flex-1 min-w-[120px]">
          <label class="block mb-1" for="investment">Инвестиции (€):</label>
          <input type="number" name="investment" id="investment" class="w-full p-3 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:ring-2 focus:ring-blue-500 transition" value="25000" required inputmode="decimal" autocomplete="on" />
        </div>
        <div class="flex-1 min-w-[120px]">
          <label class="block mb-1" for="minProfit">Мин. прибыль (€/мес):</label>
          <input type="number" name="minProfit" id="minProfit" class="w-full p-3 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:ring-2 focus:ring-blue-500 transition" value="100" required inputmode="decimal" autocomplete="on" />
        </div>
      </div>
      <button type="submit" class="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold text-lg shadow transition active:scale-95">Рассчитать</button>
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
