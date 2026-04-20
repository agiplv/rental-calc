const template = document.createElement('template');
template.innerHTML = `
  <div class="material-card">
    <div class="material-title">PEA Rental Calc</div>
    <form id="rental-form" autocomplete="on">
      <mwc-textfield
        label="Площади помещений (через запятую, м²)"
        name="rooms"
        id="rooms"
        type="text"
        required
        placeholder="например: 48, 34, 14, 10"
        outlined
        autocapitalize="off"
        autocomplete="on"
        autocorrect="off"
        spellcheck="false"
        pattern="[\d., ]+"
        inputmode="decimal"
      ></mwc-textfield>
      <mwc-textfield
        label="Коммунальные (€/мес)"
        name="monthlyFee"
        id="monthlyFee"
        type="number"
        required
        value="250"
        outlined
        inputmode="decimal"
        autocomplete="on"
      ></mwc-textfield>
      <mwc-textfield
        label="Налог (%)"
        name="tax"
        id="tax"
        type="number"
        required
        value="10"
        outlined
        inputmode="decimal"
        autocomplete="on"
      ></mwc-textfield>
      <mwc-textfield
        label="Годовая прибыль (%)"
        name="profit"
        id="profit"
        type="number"
        required
        value="15"
        outlined
        inputmode="decimal"
        autocomplete="on"
      ></mwc-textfield>
      <mwc-textfield
        label="Инвестиции (€)"
        name="investment"
        id="investment"
        type="number"
        required
        value="25000"
        outlined
        inputmode="decimal"
        autocomplete="on"
      ></mwc-textfield>
      <mwc-textfield
        label="Мин. прибыль (€/мес)"
        name="minProfit"
        id="minProfit"
        type="number"
        required
        value="100"
        outlined
        inputmode="decimal"
        autocomplete="on"
      ></mwc-textfield>
      <mwc-button raised label="Рассчитать" type="submit"></mwc-button>
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
      // Для MWC
      this.form.querySelectorAll('mwc-textfield').forEach(tf => {
        if (data[tf.name] !== undefined) tf.value = tf.name === 'rooms' ? data.rooms.join(', ') : data[tf.name];
      });
      this.renderResult(data);
    }
    this.form.addEventListener('submit', this.onSubmit.bind(this));
  }

  onSubmit(e) {
    e.preventDefault();
    // Для MWC
    const rooms = this.form.rooms.value ? this.form.rooms.value.split(',').map(s => parseFloat(s.trim())).filter(Boolean) : this.form.querySelector('[name=rooms]').value.split(',').map(s => parseFloat(s.trim())).filter(Boolean);
    const monthlyFee = parseFloat(this.form.monthlyFee?.value || this.form.querySelector('[name=monthlyFee]').value);
    const tax = parseFloat(this.form.tax?.value || this.form.querySelector('[name=tax]').value) / 100;
    const profit = parseFloat(this.form.profit?.value || this.form.querySelector('[name=profit]').value) / 100;
    const investment = parseFloat(this.form.investment?.value || this.form.querySelector('[name=investment]').value);
    const minProfit = parseFloat(this.form.minProfit?.value || this.form.querySelector('[name=minProfit]').value);
    const data = { rooms, monthlyFee, tax, profit, investment, minProfit };
    localStorage.setItem('pea-rental-calc', JSON.stringify(data));
    this.renderResult(data);
  }

  renderResult({ rooms, monthlyFee, tax, profit, investment, minProfit }) {
    if (!rooms.length || rooms.some(isNaN)) {
      this.result.innerHTML = '<div class="material-error">Введите корректные площади помещений.</div>';
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
      <table class="material-table">
        <thead>
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
        <div class="mt-2 font-bold ${isGoalAchieved ? 'material-success' : 'material-error'}">
          Цель: ${monthlyTargetProfit.toFixed(2)} € ${isGoalAchieved ? '→ ЦЕЛЬ ДОСТИГНУТА! 🎉' : '→ ЦЕЛЬ НЕ ДОСТИГНУТА! 😔'}
        </div>
      </div>
    `
  };
}

customElements.define('pea-app', PeaApp);
