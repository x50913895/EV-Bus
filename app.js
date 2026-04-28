const REGIONS = {
  美洲: ["美國", "加拿大", "巴西", "智利", "墨西哥"],
  歐洲: ["德國", "法國", "英國", "荷蘭", "挪威"],
  亞洲: ["中國", "日本", "韓國", "印度", "新加坡"],
  非洲: ["南非", "埃及", "摩洛哥", "肯亞", "奈及利亞"],
  大洋洲: ["澳洲", "紐西蘭", "斐濟", "巴布亞紐幾內亞", "薩摩亞"]
};

const state = {
  currentDate: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)),
  activeRegion: "美洲",
  liveTick: 0
};

const monthLabel = document.querySelector("#month-label");
const regionTabs = document.querySelector("#region-tabs");
const countryTable = document.querySelector("#country-table");
const topFive = document.querySelector("#top-five");
const lastUpdated = document.querySelector("#last-updated");

document.querySelector("#prev-month").addEventListener("click", () => {
  state.currentDate.setUTCMonth(state.currentDate.getUTCMonth() - 1);
  render();
});

document.querySelector("#next-month").addEventListener("click", () => {
  state.currentDate.setUTCMonth(state.currentDate.getUTCMonth() + 1);
  render();
});

function seededValue(country, year, month) {
  const key = `${country}-${year}-${month}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const base = Math.abs(hash % 1200) + 50;
  const liveBump = (state.liveTick + country.charCodeAt(0) + month) % 15;
  return base + liveBump;
}

function getMonthlyValue(country, date) {
  return seededValue(country, date.getUTCFullYear(), date.getUTCMonth() + 1);
}

function getDelta(country, date) {
  const current = getMonthlyValue(country, date);
  const prev = seededValue(country, date.getUTCFullYear(), date.getUTCMonth());
  return current - prev;
}

function deltaClass(delta) {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function renderTabs() {
  regionTabs.innerHTML = "";
  Object.keys(REGIONS).forEach((region) => {
    const button = document.createElement("button");
    button.className = `tab ${state.activeRegion === region ? "active" : ""}`;
    button.textContent = region;
    button.addEventListener("click", () => {
      state.activeRegion = region;
      render();
    });
    regionTabs.appendChild(button);
  });
}

function renderRegionTable() {
  countryTable.innerHTML = "";

  const rows = REGIONS[state.activeRegion]
    .map((country) => ({
      country,
      value: getMonthlyValue(country, state.currentDate),
      delta: getDelta(country, state.currentDate)
    }))
    .sort((a, b) => b.value - a.value);

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.country}</td>
      <td>${row.value.toLocaleString()}</td>
      <td><span class="delta ${deltaClass(row.delta)}">${row.delta > 0 ? "+" : ""}${row.delta}</span></td>
    `;
    countryTable.appendChild(tr);
  });
}

function renderTopFive() {
  const allCountries = Object.values(REGIONS).flat();
  const data = allCountries
    .map((country) => {
      const current = getMonthlyValue(country, state.currentDate);
      const prevDate = new Date(state.currentDate);
      prevDate.setUTCMonth(prevDate.getUTCMonth() - 1);
      const previous = getMonthlyValue(country, prevDate);
      return {
        country,
        current,
        change: current - previous
      };
    })
    .sort((a, b) => b.current - a.current)
    .slice(0, 5);

  topFive.innerHTML = "";
  data.forEach((item, idx) => {
    const li = document.createElement("li");
    const trend = item.change > 0 ? "▲" : item.change < 0 ? "▼" : "■";
    li.innerHTML = `
      <strong>#${idx + 1} ${item.country}：${item.current.toLocaleString()} 輛</strong>
      <small>${trend} 與上月相比 ${item.change > 0 ? "+" : ""}${item.change} 輛</small>
    `;
    topFive.appendChild(li);
  });
}

function renderMeta() {
  const y = state.currentDate.getUTCFullYear();
  const m = String(state.currentDate.getUTCMonth() + 1).padStart(2, "0");
  monthLabel.textContent = `${y} 年 ${m} 月`;
  lastUpdated.textContent = `最後更新（UTC）：${new Date().toLocaleString("zh-TW", { hour12: false, timeZone: "UTC" })}`;
}

function render() {
  renderMeta();
  renderTabs();
  renderRegionTable();
  renderTopFive();
}

render();
setInterval(() => {
  state.liveTick += 1;
  render();
}, 30000);
