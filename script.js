const STORAGE_KEY = "travel-itinerary-planner-v1";

const defaultData = {
  title: "○○○旅行",
  days: [
    {
      date: "",
      title: "第 1 天",
      schedule: "",
      routeSegments: [
        {
          from: "",
          to: "",
          mode: "driving",
          result: "",
        },
      ],
      transportNotes: "",
      food: "",
      lodging: "",
      mapImage: null,
    },
  ],
  spots: [
    {
      name: "",
      location: "",
      duration: "",
      history: "",
    },
  ],
  notes: "",
};

let tripData = loadData();

const tripTitle = document.querySelector("#tripTitle");
const addDayBtn = document.querySelector("#addDayBtn");
const saveBtn = document.querySelector("#saveBtn");
const exportDraftBtn = document.querySelector("#exportDraftBtn");
const importDraftFile = document.querySelector("#importDraftFile");
const exportExcelBtn = document.querySelector("#exportExcelBtn");
const exportWordBtn = document.querySelector("#exportWordBtn");
const newTripBtn = document.querySelector("#newTripBtn");
const printBtn = document.querySelector("#printBtn");
const dayNav = document.querySelector("#dayNav");
const saveState = document.querySelector("#saveState");
const daysContainer = document.querySelector("#daysContainer");
const dayTemplate = document.querySelector("#dayTemplate");
const routeSegmentTemplate = document.querySelector("#routeSegmentTemplate");
const addSpotBtn = document.querySelector("#addSpotBtn");
const spotsContainer = document.querySelector("#spotsContainer");
const spotTemplate = document.querySelector("#spotTemplate");
const generalNotes = document.querySelector("#generalNotes");

render();

addDayBtn.addEventListener("click", () => {
  tripData.days.push({
    ...structuredClone(defaultData.days[0]),
    title: `第 ${tripData.days.length + 1} 天`,
  });
  render();
  markUnsaved();
});

addSpotBtn.addEventListener("click", () => {
  tripData.spots.push({ ...defaultData.spots[0] });
  render();
  markUnsaved();
});

saveBtn.addEventListener("click", () => {
  collectData();
  saveData();
});

exportDraftBtn.addEventListener("click", () => {
  collectData();
  downloadFile(
    `${safeFilename(tripData.title)}-草稿.json`,
    JSON.stringify(tripData, null, 2),
    "application/json"
  );
  saveState.textContent = "已匯出草稿檔";
});

importDraftFile.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    tripData = normalizeData(parsed);
    render();
    saveData();
  } catch {
    saveState.textContent = "匯入失敗：檔案不是可讀取的草稿 JSON";
  } finally {
    importDraftFile.value = "";
  }
});

exportExcelBtn.addEventListener("click", () => {
  collectData();
  const html = buildExcelHtml(tripData);
  downloadFile(
    `${safeFilename(tripData.title)}-完成行程.xls`,
    html,
    "application/vnd.ms-excel;charset=utf-8"
  );
  saveState.textContent = "已匯出 Excel 檔";
});

exportWordBtn.addEventListener("click", () => {
  collectData();
  const html = buildWordHtml(tripData);
  downloadFile(
    `${safeFilename(tripData.title)}-完成行程.doc`,
    html,
    "application/msword;charset=utf-8"
  );
  saveState.textContent = "已匯出 Word 檔";
});

newTripBtn.addEventListener("click", () => {
  const shouldReset = window.confirm("要啟程開始新的旅行規劃嗎？目前畫面內容會重設，建議先匯出草稿。");
  if (!shouldReset) return;

  tripData = structuredClone(defaultData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tripData));
  render();
  saveState.textContent = "已啟程，開始新的旅行規劃";
});

printBtn.addEventListener("click", () => {
  collectData();
  saveData();
  window.print();
});

document.addEventListener("input", (event) => {
  if (event.target.matches("input, textarea, select")) {
    collectData();
    updateDayNav();
    markUnsaved();
  }
});

document.addEventListener("change", async (event) => {
  if (!event.target.matches(".day-map-file")) return;
  const file = event.target.files?.[0];
  if (!file) return;

  const dayNode = event.target.closest(".day-panel");
  const image = await readImageFile(file);
  setDayMapPreview(dayNode, image);
  collectData();
  markUnsaved();
});

function render() {
  tripTitle.value = tripData.title;
  generalNotes.value = tripData.notes;

  daysContainer.innerHTML = "";
  tripData.days.forEach((day, index) => {
    const node = dayTemplate.content.firstElementChild.cloneNode(true);
    node.id = `day-${index + 1}`;
    node.dataset.index = index;
    node.querySelector(".day-date").value = day.date;
    node.querySelector(".day-title").value = day.title;
    node.querySelector(".day-schedule").value = day.schedule;
    node.querySelector(".transport-notes").value = day.transportNotes;
    node.querySelector(".day-food").value = day.food;
    node.querySelector(".day-lodging").value = day.lodging;
    setDayMapPreview(node, day.mapImage);
    renderRouteSegments(node, day.routeSegments);

    node.querySelector(".remove-day").addEventListener("click", () => {
      if (tripData.days.length === 1) {
        saveState.textContent = "至少保留一天行程";
        return;
      }
      collectData();
      tripData.days.splice(index, 1);
      render();
      markUnsaved();
    });

    node.querySelector(".add-route-segment").addEventListener("click", () => {
      const segmentsContainer = node.querySelector(".route-segments");
      const previousTo = [...segmentsContainer.querySelectorAll(".route-to")].at(-1)?.value.trim() || "";
      const segmentNode = createRouteSegmentNode(
        { from: previousTo, to: "", mode: "driving", result: "" },
        segmentsContainer.children.length
      );
      segmentsContainer.appendChild(segmentNode);
      collectData();
      markUnsaved();
    });

    node.querySelector(".remove-day-map").addEventListener("click", () => {
      setDayMapPreview(node, null);
      node.querySelector(".day-map-file").value = "";
      collectData();
      markUnsaved();
    });

    daysContainer.appendChild(node);
  });

  spotsContainer.innerHTML = "";
  tripData.spots.forEach((spot, index) => {
    const node = spotTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.index = index;
    node.querySelector(".spot-name").value = spot.name;
    node.querySelector(".spot-location").value = spot.location;
    node.querySelector(".spot-duration").value = spot.duration;
    node.querySelector(".spot-history").value = spot.history;
    node.querySelector(".remove-spot").addEventListener("click", () => {
      collectData();
      tripData.spots.splice(index, 1);
      render();
      markUnsaved();
    });
    spotsContainer.appendChild(node);
  });

  updateDayNav();
}

function setDayMapPreview(dayNode, image) {
  const preview = dayNode.querySelector(".day-map-preview");
  const empty = dayNode.querySelector(".day-map-empty");
  dayNode.dataset.mapName = image?.name || "";
  dayNode.dataset.mapDataUrl = image?.dataUrl || "";

  if (image?.dataUrl) {
    preview.src = image.dataUrl;
    preview.hidden = false;
    empty.textContent = image.name ? `已上傳：${image.name}` : "已上傳地圖";
  } else {
    preview.removeAttribute("src");
    preview.hidden = true;
    empty.textContent = "尚未上傳地圖";
  }
}

function renderRouteSegments(dayNode, routeSegments) {
  const segmentsContainer = dayNode.querySelector(".route-segments");
  segmentsContainer.innerHTML = "";
  const segments = routeSegments?.length ? routeSegments : structuredClone(defaultData.days[0].routeSegments);
  segments.forEach((segment, index) => {
    segmentsContainer.appendChild(createRouteSegmentNode(segment, index));
  });
}

function createRouteSegmentNode(segment, index) {
  const node = routeSegmentTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector("h4").textContent = `路段 ${index + 1}`;
  node.querySelector(".route-from").value = segment.from || "";
  node.querySelector(".route-to").value = segment.to || "";
  node.querySelector(".route-mode").value = segment.mode || "driving";
  node.querySelector(".route-result").value = segment.result || "";

  node.querySelector(".calculate-route").addEventListener("click", () => {
    calculateRoute(node);
  });

  node.querySelector(".remove-route-segment").addEventListener("click", () => {
    const container = node.closest(".route-segments");
    if (container.children.length === 1) {
      saveState.textContent = "至少保留一段交通";
      return;
    }
    node.remove();
    refreshRouteSegmentTitles(container);
    collectData();
    markUnsaved();
  });

  return node;
}

function refreshRouteSegmentTitles(container) {
  [...container.querySelectorAll(".route-segment h4")].forEach((title, index) => {
    title.textContent = `路段 ${index + 1}`;
  });
}

function collectData() {
  tripData.title = tripTitle.value.trim() || "○○○旅行";
  tripData.notes = generalNotes.value;

  tripData.days = [...document.querySelectorAll(".day-panel")].map((node) => ({
    date: node.querySelector(".day-date").value,
    title: node.querySelector(".day-title").value.trim(),
    schedule: node.querySelector(".day-schedule").value,
    routeSegments: [...node.querySelectorAll(".route-segment")].map((segmentNode) => ({
      from: segmentNode.querySelector(".route-from").value.trim(),
      to: segmentNode.querySelector(".route-to").value.trim(),
      mode: segmentNode.querySelector(".route-mode").value,
      result: segmentNode.querySelector(".route-result").value.trim(),
    })),
    transportNotes: node.querySelector(".transport-notes").value,
    food: node.querySelector(".day-food").value,
    lodging: node.querySelector(".day-lodging").value,
    mapImage: node.dataset.mapDataUrl
      ? {
          name: node.dataset.mapName || "map-image",
          dataUrl: node.dataset.mapDataUrl,
        }
      : null,
  }));

  tripData.spots = [...document.querySelectorAll(".spot-panel")].map((node) => ({
    name: node.querySelector(".spot-name").value.trim(),
    location: node.querySelector(".spot-location").value.trim(),
    duration: node.querySelector(".spot-duration").value.trim(),
    history: node.querySelector(".spot-history").value,
  }));
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tripData));
  const now = new Date();
  saveState.textContent = `已儲存 ${now.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve({
        name: file.name,
        dataUrl: reader.result,
      });
    });
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function buildExcelHtml(data) {
  const rows = [
    ["壹、行程規劃", "", "", "", "", "", ""],
    ["日期", "日期標籤", "當日行程", "交通路段", "交通備註", "飲食", "當日住宿", "地圖圖檔"],
    ...data.days.map((day) => [
      day.date,
      day.title,
      day.schedule,
      formatRouteSegments(day.routeSegments),
      day.transportNotes,
      day.food,
      day.lodging,
      day.mapImage?.name || "",
    ]),
    [],
    ["貳、主要景點的人文歷史介紹", "", "", ""],
    ["景點名稱", "地點或地圖連結", "建議停留時間", "人文歷史介紹"],
    ...data.spots.map((spot) => [spot.name, spot.location, spot.duration, spot.history]),
    [],
    ["參、備註", data.notes],
  ];

  const tableRows = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${formatCell(cell)}</td>`).join("")}</tr>`)
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: "Microsoft JhengHei", Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    td { border: 1px solid #8fa58c; padding: 8px; vertical-align: top; white-space: pre-wrap; }
    tr:first-child td { background: #dcebd3; font-weight: bold; font-size: 18px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(data.title)}</h1>
  <table>${tableRows}</table>
</body>
</html>`;
}

function buildWordHtml(data) {
  const daySections = data.days
    .map(
      (day, index) => `
      <h3>第 ${index + 1} 天 ${escapeHtml(day.date || "")} ${escapeHtml(day.title || "")}</h3>
      <p><strong>一、日期：</strong>${escapeHtml(day.date || "")}</p>
      <p><strong>二、當日行程：</strong><br>${formatParagraph(day.schedule)}</p>
      <p><strong>三、交通：</strong><br>
        ${formatParagraph(formatRouteSegments(day.routeSegments))}<br>
        ${formatParagraph(day.transportNotes)}
      </p>
      <p><strong>四、飲食：</strong><br>${formatParagraph(day.food)}</p>
      <p><strong>五、當日住宿：</strong><br>${formatParagraph(day.lodging)}</p>
      <p><strong>六、地圖：</strong><br>${formatDayMapForWord(day.mapImage)}</p>`
    )
    .join("");

  const spotSections = data.spots
    .map(
      (spot) => `
      <h3>${escapeHtml(spot.name || "未命名景點")}</h3>
      <p><strong>地點或地圖連結：</strong>${escapeHtml(spot.location || "")}</p>
      <p><strong>建議停留時間：</strong>${escapeHtml(spot.duration || "")}</p>
      <p><strong>人文歷史介紹：</strong><br>${formatParagraph(spot.history)}</p>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { color: #24332a; font-family: "Microsoft JhengHei", Arial, sans-serif; line-height: 1.6; }
    h1 { color: #2f6542; border-bottom: 3px solid #75a868; padding-bottom: 10px; }
    h2 { color: #2f6542; margin-top: 28px; }
    h3 { color: #3f7f55; }
    p { margin: 8px 0 14px; }
    a { color: #176b6b; }
  </style>
</head>
<body>
  <h1>${escapeHtml(data.title)}</h1>
  <h2>壹、行程規劃</h2>
  ${daySections || "<p>尚未填寫行程。</p>"}
  <h2>貳、主要景點的人文歷史介紹</h2>
  ${spotSections || "<p>尚未填寫景點介紹。</p>"}
  <h2>參、備註</h2>
  <p>${formatParagraph(data.notes)}</p>
</body>
</html>`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob(["\ufeff", content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function joinLines(values) {
  return values.filter(Boolean).join("\n");
}

function formatRouteSegments(routeSegments) {
  const segments = routeSegments?.length ? routeSegments : [];
  return segments
    .map((segment, index) => {
      const routeText = `${index + 1}. ${segment.from || "未填出發地"} → ${segment.to || "未填停留地"}`;
      const detailText = `${getRouteModeLabel(segment.mode)}${segment.result ? `｜${segment.result}` : ""}`;
      return `${routeText}\n   ${detailText}`;
    })
    .join("\n");
}

function formatCell(value) {
  return escapeHtml(value || "").replace(/\n/g, "<br>");
}

function formatParagraph(value) {
  const safe = escapeHtml(value || "");
  return safe ? safe.replace(/\n/g, "<br>") : "";
}

function formatDayMapForWord(image) {
  if (!image?.dataUrl) return "尚未上傳地圖";
  const name = image.name ? `<p>${escapeHtml(image.name)}</p>` : "";
  return `${name}<img src="${image.dataUrl}" alt="當日行程地圖" style="max-width: 100%; height: auto;" />`;
}

function linkOrText(value) {
  if (!value) return "";
  const safe = escapeHtml(value);
  if (/^https?:\/\//i.test(value)) return `<a href="${safe}">${safe}</a>`;
  return safe;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultData);

  try {
    return normalizeData(JSON.parse(raw));
  } catch {
    return structuredClone(defaultData);
  }
}

function normalizeData(data) {
  return {
    title: data.title || defaultData.title,
    days:
      Array.isArray(data.days) && data.days.length
        ? data.days.map(normalizeDay)
        : structuredClone(defaultData.days),
    spots: Array.isArray(data.spots) ? data.spots : defaultData.spots,
    notes: data.notes || "",
  };
}

function normalizeDay(day) {
  const legacySegment =
    day.routeFrom || day.routeTo || day.routeResult
      ? [
          {
            from: day.routeFrom || "",
            to: day.routeTo || "",
            mode: day.routeMode || "driving",
            result: day.routeResult || "",
          },
        ]
      : null;

  return {
    date: day.date || "",
    title: day.title || "",
    schedule: day.schedule || "",
    routeSegments:
      Array.isArray(day.routeSegments) && day.routeSegments.length
        ? day.routeSegments.map(normalizeRouteSegment)
        : legacySegment || structuredClone(defaultData.days[0].routeSegments),
    transportNotes: day.transportNotes || "",
    food: day.food || "",
    lodging: day.lodging || "",
    mapImage: normalizeMapImage(day.mapImage),
  };
}

function normalizeMapImage(image) {
  if (!image?.dataUrl) return null;
  return {
    name: image.name || "map-image",
    dataUrl: image.dataUrl,
  };
}

function normalizeRouteSegment(segment) {
  return {
    from: segment.from || "",
    to: segment.to || "",
    mode: segment.mode || "driving",
    result: segment.result || "",
  };
}

function updateDayNav() {
  dayNav.innerHTML = "";
  tripData.days.forEach((day, index) => {
    const link = document.createElement("a");
    link.href = `#day-${index + 1}`;
    const dateText = day.date ? `${day.date} ` : "";
    link.textContent = `${dateText}${day.title || `第 ${index + 1} 天`}`;
    dayNav.appendChild(link);
  });
}

function calculateRoute(segmentNode) {
  const fromInput = segmentNode.querySelector(".route-from");
  const toInput = segmentNode.querySelector(".route-to");
  const modeInput = segmentNode.querySelector(".route-mode");
  const resultInput = segmentNode.querySelector(".route-result");
  const status = segmentNode.querySelector(".route-status");
  const from = fromInput.value.trim();
  const to = toInput.value.trim();

  if (!from || !to) {
    status.textContent = "請先輸入出發地與目的地。";
    return;
  }

  const googleMapsUrl = buildGoogleMapsDirectionsUrl(from, to, modeInput.value);
  const opened = window.open(googleMapsUrl, "_blank", "noreferrer");
  resultInput.value ||= `以 Google Maps ${getRouteModeLabel(modeInput.value)}估算為準`;
  status.textContent = opened
    ? "已開啟 Google Maps，請將頁面顯示的時間填入預估時間。"
    : "瀏覽器封鎖了新分頁，請允許彈出視窗後再試。";
  collectData();
  markUnsaved();
}

function markUnsaved() {
  saveState.textContent = "有未儲存變更";
}

function getRouteModeLabel(mode) {
  const labels = {
    driving: "開車",
    walking: "步行",
    metro: "地鐵",
    train: "火車",
    bus: "巴士",
    mrt: "捷運",
  };
  return labels[mode] || "交通";
}

function buildGoogleMapsDirectionsUrl(from, to, mode) {
  const params = new URLSearchParams({
    api: "1",
    origin: from,
    destination: to,
    travelmode: getGoogleTravelMode(mode),
  });
  const transitMode = getGoogleTransitMode(mode);
  if (transitMode) params.set("transit_mode", transitMode);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function getGoogleTravelMode(mode) {
  if (mode === "walking") return "walking";
  if (mode === "driving") return "driving";
  return "transit";
}

function getGoogleTransitMode(mode) {
  const modes = {
    metro: "subway",
    mrt: "subway",
    train: "train",
    bus: "bus",
  };
  return modes[mode] || "";
}

function safeFilename(name) {
  return (name || "travel-itinerary")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}
