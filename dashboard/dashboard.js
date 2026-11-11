const palette = {
  teal: "#008c78",
  coral: "#e36a58",
  blue: "#4386bb",
  gold: "#d3a43e",
  green: "#71a88b",
  muted: "#9ba7a1",
};

const tenureOrder = ["0-12 Mos", "13-24 Mos", "25-48 Mos", "49-72 Mos"];
const contractOrder = ["Month-to-month", "One year", "Two year"];
const paymentOrder = [
  "Electronic check",
  "Mailed check",
  "Bank transfer (automatic)",
  "Credit card (automatic)",
];
const charts = {};
let customers = [];
let quarterlyEvents = [];

const percent = (value) => `${value.toFixed(1)}%`;
const money = (value) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(value);

function uniqueValues(field, order = []) {
  const found = [...new Set(customers.map((customer) => customer[field]).filter(Boolean))];
  return order.filter((value) => found.includes(value)).concat(found.filter((value) => !order.includes(value)).sort());
}

function populateFilter(id, field, label, order) {
  const select = document.getElementById(id);
  for (const value of uniqueValues(field, order)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value === "Month-to-month" ? "Month to month" : value;
    select.append(option);
  }
  select.setAttribute("aria-label", label);
  select.addEventListener("change", updateDashboard);
}

function selectedCustomers() {
  const contract = document.getElementById("contract-filter").value;
  const payment = document.getElementById("payment-filter").value;
  const tenure = document.getElementById("tenure-filter").value;
  return customers.filter((customer) =>
    (contract === "all" || customer.Contract === contract)
    && (payment === "all" || customer.PaymentMethod === payment)
    && (tenure === "all" || customer.TenureGroup === tenure));
}

function selectedQuarterlyEvents() {
  const contract = document.getElementById("contract-filter").value;
  const payment = document.getElementById("payment-filter").value;
  const tenure = document.getElementById("tenure-filter").value;
  return quarterlyEvents.filter((event) =>
    (contract === "all" || event.Contract === contract)
    && (payment === "all" || event.PaymentMethod === payment)
    && (tenure === "all" || event.TenureGroup === tenure));
}

function churnRate(records) {
  if (!records.length) return 0;
  return records.filter((customer) => customer.Churn === "Yes").length / records.length * 100;
}

function groupedRate(records, field, order) {
  return order.map((label) => {
    const group = records.filter((customer) => customer[field] === label);
    return { label, rate: churnRate(group), count: group.length };
  });
}

function quarterlyTrend(events) {
  const grouped = new Map();
  for (const event of events) {
    let quarter = grouped.get(event.QuarterLabel);
    if (!quarter) {
      quarter = { label: event.QuarterLabel, start: event.QuarterStart, active: 0, churned: 0 };
      grouped.set(event.QuarterLabel, quarter);
    }
    quarter.active += Number(event.ActiveAtStart);
    quarter.churned += Number(event.ChurnedThisQuarter);
  }
  return [...grouped.values()]
    .sort((left, right) => left.start.localeCompare(right.start))
    .map((quarter) => ({
      ...quarter,
      rate: quarter.active ? quarter.churned / quarter.active * 100 : 0,
    }));
}

function highestChurnSegment(records, field) {
  const values = [...new Set(records.map((customer) => customer[field]).filter(Boolean))];
  return values.map((value) => {
    const group = records.filter((customer) => customer[field] === value);
    return { value, count: group.length, rate: churnRate(group) };
  }).sort((left, right) => right.rate - left.rate || right.count - left.count)[0];
}

function renderRetentionActions(records) {
  const contract = highestChurnSegment(records, "Contract");
  const payment = highestChurnSegment(records, "PaymentMethod");
  const tenure = highestChurnSegment(records, "TenureGroup");
  const highRisk = records.filter((customer) => customer.Churn === "No" && customer.RiskScore >= 3);
  const actions = [
    contract && {
      title: `Contract: ${contract.value}`,
      detail: `Test a term or renewal offer with this cohort (${percent(contract.rate)} churn; ${contract.count.toLocaleString()} customers).`,
    },
    payment && {
      title: `Payment: ${payment.value}`,
      detail: `Test billing support or an automatic-payment migration (${percent(payment.rate)} churn; ${payment.count.toLocaleString()} customers).`,
    },
    tenure && {
      title: `Tenure: ${tenure.value}`,
      detail: `Pilot proactive service check-ins for this tenure group (${percent(tenure.rate)} churn; ${tenure.count.toLocaleString()} customers).`,
    },
    {
      title: "High-risk active customers",
      detail: `Test a targeted save offer for ${highRisk.length.toLocaleString()} active customers with risk score 3 or higher.`,
    },
  ].filter(Boolean);

  const list = document.getElementById("retention-actions");
  list.replaceChildren(...actions.map((action, index) => {
    const row = document.createElement("div");
    row.className = "action-item";
    const number = document.createElement("span");
    number.className = "action-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = action.title;
    const detail = document.createElement("p");
    detail.textContent = action.detail;
    content.append(title, detail);
    row.append(number, content);
    return row;
  }));
}

function updateExecutiveTrend(records) {
  const trend = quarterlyTrend(selectedQuarterlyEvents());
  const chart = charts.quarterly;
  chart.data.labels = trend.map((quarter) => quarter.label);
  chart.data.datasets[0].data = trend.map((quarter) => quarter.rate);
  chart.options.scales.y.suggestedMax = Math.max(8, Math.ceil(Math.max(...trend.map((quarter) => quarter.rate), 0) / 2) * 2);
  chart.update();

  const first = trend[0];
  const latest = trend.at(-1);
  const previous = trend.at(-2);
  document.getElementById("trend-summary").textContent = first && latest
    ? `${percent(first.rate)} in ${first.label} to ${percent(latest.rate)} in ${latest.label}${previous ? ` · ${latest.rate - previous.rate >= 0 ? "+" : ""}${(latest.rate - previous.rate).toFixed(2)} pp QoQ` : ""}`
    : "No quarterly data for this selection.";
  renderRetentionActions(records);
}

function baseChartOptions({ horizontal = false } = {}) {
  const rateAxis = {
    beginAtZero: true,
    max: 100,
    grid: { color: "#edf0ed" },
    border: { display: false },
    ticks: { color: "#83908a", font: { family: "Trebuchet MS", size: 9 }, callback: (value) => `${value}%`, maxTicksLimit: 5 },
  };
  const categoryAxis = {
    grid: { display: false },
    border: { display: false },
    ticks: { color: "#75817b", font: { family: "Trebuchet MS", size: 9 } },
  };
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? "y" : "x",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#20332d",
        padding: 10,
        titleFont: { family: "Trebuchet MS", size: 11 },
        bodyFont: { family: "Trebuchet MS", size: 11 },
        callbacks: { label: (context) => ` ${context.parsed[horizontal ? "x" : "y"].toFixed(1)}% churn` },
      },
    },
    scales: horizontal
      ? { x: rateAxis, y: categoryAxis }
      : { x: categoryAxis, y: rateAxis },
  };
}

function setBarChart(id, labels, values, color, options = {}) {
  const chart = charts[id];
  chart.data.labels = labels;
  chart.data.datasets[0].data = values;
  chart.data.datasets[0].backgroundColor = color;
  chart.update();
}

function setKpis(records) {
  const churned = records.filter((customer) => customer.Churn === "Yes");
  const total = records.length;
  const monthlyAtRisk = churned.reduce((sum, customer) => sum + Number(customer.MonthlyCharges || 0), 0);
  const avgTenure = total ? records.reduce((sum, customer) => sum + Number(customer.tenure || 0), 0) / total : 0;
  document.getElementById("kpi-churn").textContent = percent(churnRate(records));
  document.getElementById("kpi-churned").textContent = new Intl.NumberFormat("en-US").format(churned.length);
  document.getElementById("kpi-churned-share").textContent = total ? percent(churned.length / total * 100) : "0.0%";
  document.getElementById("kpi-revenue").textContent = money(monthlyAtRisk);
  document.getElementById("kpi-tenure").textContent = `${avgTenure.toFixed(1)} mo`;
}

function updateDashboard() {
  const records = selectedCustomers();
  setKpis(records);
  updateExecutiveTrend(records);

  const tenure = groupedRate(records, "TenureGroup", tenureOrder);
  setBarChart("tenure", tenure.map((item) => item.label), tenure.map((item) => item.rate), palette.teal);

  const contracts = groupedRate(records, "Contract", contractOrder);
  setBarChart("contract", contracts.map((item) => item.label === "Month-to-month" ? "Month to month" : item.label), contracts.map((item) => item.rate), palette.coral);

  const payments = groupedRate(records, "PaymentMethod", paymentOrder);
  setBarChart("payment", payments.map((item) => item.label), payments.map((item) => item.rate), palette.blue);

  const churned = records.filter((customer) => customer.Churn === "Yes").length;
  const retained = records.length - churned;
  charts.mix.data.datasets[0].data = [retained, churned];
  charts.mix.update();
  document.getElementById("mix-legend").innerHTML = [
    { label: "Retained", value: retained, color: palette.teal },
    { label: "Churned", value: churned, color: palette.coral },
  ].map((item) => `<div class="legend-row"><span class="legend-swatch" style="background:${item.color}"></span>${item.label}<strong>${item.value.toLocaleString()}</strong></div>`).join("");
}

function initializeCharts() {
  Chart.defaults.font.family = "Trebuchet MS";
  Chart.defaults.color = "#75817b";
  charts.tenure = new Chart(document.getElementById("tenure-chart"), {
    type: "bar",
    data: { labels: [], datasets: [{ data: [], backgroundColor: palette.teal, borderRadius: 4, maxBarThickness: 45 }] },
    options: baseChartOptions(),
  });
  charts.contract = new Chart(document.getElementById("contract-chart"), {
    type: "bar",
    data: { labels: [], datasets: [{ data: [], backgroundColor: palette.coral, borderRadius: 4, maxBarThickness: 36 }] },
    options: baseChartOptions(),
  });
  charts.payment = new Chart(document.getElementById("payment-chart"), {
    type: "bar",
    data: { labels: [], datasets: [{ data: [], backgroundColor: palette.blue, borderRadius: 4, maxBarThickness: 24 }] },
    options: baseChartOptions({ horizontal: true }),
  });
  charts.mix = new Chart(document.getElementById("mix-chart"), {
    type: "doughnut",
    data: { labels: ["Retained", "Churned"], datasets: [{ data: [0, 0], backgroundColor: [palette.teal, palette.coral], borderWidth: 0, hoverOffset: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: "72%", plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => ` ${context.label}: ${context.raw.toLocaleString()} customers` } } } },
  });
  const trendOptions = baseChartOptions();
  trendOptions.scales.y.max = undefined;
  trendOptions.scales.y.suggestedMax = 8;
  trendOptions.scales.y.ticks.stepSize = 2;
  charts.quarterly = new Chart(document.getElementById("quarterly-chart"), {
    type: "line",
    data: { labels: [], datasets: [{ data: [], borderColor: palette.teal, backgroundColor: "rgb(0 140 120 / 12%)", borderWidth: 3, pointBackgroundColor: palette.teal, pointRadius: 4, pointHoverRadius: 6, tension: 0.3, fill: true }] },
    options: trendOptions,
  });
}

async function startDashboard() {
  try {
    const data = window.CHURN_DASHBOARD_DATA;
    if (!Array.isArray(data?.customers) || !Array.isArray(data?.quarterly) || typeof Chart === "undefined") throw new Error("Dashboard data or chart library is unavailable");
    customers = data.customers;
    quarterlyEvents = data.quarterly;
    const recordCount = new Intl.NumberFormat("en-US").format(customers.length);
    document.getElementById("record-count-sidebar").textContent = `${recordCount} customers`;
    document.getElementById("record-count-header").textContent = `${recordCount} records`;
    populateFilter("contract-filter", "Contract", "Filter by contract", contractOrder);
    populateFilter("payment-filter", "PaymentMethod", "Filter by payment method", paymentOrder);
    populateFilter("tenure-filter", "TenureGroup", "Filter by tenure", tenureOrder);
    initializeCharts();
    document.querySelectorAll(".nav-item[data-target]").forEach((button) => {
      button.addEventListener("click", () => {
        document.getElementById(button.dataset.target).scrollIntoView({ behavior: "smooth" });
      });
    });
    document.getElementById("reset-filters").addEventListener("click", () => {
      document.querySelectorAll(".filters select").forEach((select) => { select.value = "all"; });
      updateDashboard();
    });
    document.getElementById("dashboard-content").hidden = false;
    updateDashboard();
  } catch (error) {
    document.getElementById("load-error").hidden = false;
    console.error(error);
  }
}

window.addEventListener("DOMContentLoaded", startDashboard);