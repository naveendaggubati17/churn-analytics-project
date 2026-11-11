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

function baseChartOptions({ horizontal = false } = {}) {
  const rateAxis = {
    beginAtZero: true,
    max: 100,
    grid: { color: "#edf0ed" },
    border: { display: false },
    ticks: { color: "#83908a", font: { family: "DM Sans", size: 9 }, callback: (value) => `${value}%`, maxTicksLimit: 5 },
  };
  const categoryAxis = {
    grid: { display: false },
    border: { display: false },
    ticks: { color: "#75817b", font: { family: "DM Sans", size: 9 } },
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
        titleFont: { family: "DM Sans", size: 11 },
        bodyFont: { family: "DM Sans", size: 11 },
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
  Chart.defaults.font.family = "DM Sans";
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
}

async function startDashboard() {
  try {
    const response = await fetch("./dashboard_data.json");
    if (!response.ok) throw new Error("Dashboard data request failed");
    const data = await response.json();
    if (!Array.isArray(data.customers) || typeof Chart === "undefined") throw new Error("Dashboard data or chart library is unavailable");
    customers = data.customers;
    populateFilter("contract-filter", "Contract", "Filter by contract", contractOrder);
    populateFilter("payment-filter", "PaymentMethod", "Filter by payment method", paymentOrder);
    populateFilter("tenure-filter", "TenureGroup", "Filter by tenure", tenureOrder);
    initializeCharts();
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