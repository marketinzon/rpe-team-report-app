const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const PAGE_SCALE = 1.5;
const MARGIN = 52;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COLORS = {
  ink: "#10231d",
  muted: "#64736d",
  line: "#dfe8e3",
  surface: "#f6f9f7",
  white: "#ffffff",
  primary: "#0b4b39",
  primarySoft: "#dff3eb",
  green: "#137e57",
  greenSoft: "#dcf8eb",
  yellow: "#9b6500",
  yellowSoft: "#fff1bf",
  red: "#b42318",
  redSoft: "#ffe3dc",
  blue: "#1d4f91"
};

export async function downloadDailyCoachPdf(report) {
  if (!report || !report.hasData) {
    const error = new Error("אין מספיק נתונים להפקת דוח עבור אתמול");
    error.code = "NO_DAILY_DATA";
    throw error;
  }

  if (document.fonts?.ready) await document.fonts.ready;
  const renderer = new DailyPdfRenderer(report);
  renderer.render();
  const blob = canvasesToPdf(renderer.pages);
  const fileName = `daily-coach-report-${report.dateIso}.pdf`;
  downloadBlob(blob, fileName);
  return { fileName, pageCount: renderer.pages.length, size: blob.size };
}

class DailyPdfRenderer {
  constructor(report) {
    this.report = report;
    this.pages = [];
    this.canvas = null;
    this.ctx = null;
    this.y = 0;
    this.sectionLabel = "";
  }

  render() {
    this.newPage("סיכום מנהלים");
    this.drawExecutiveSummary();
    this.drawAttentionTable();
    this.drawConclusions();

    if (this.report.gps.players.length) {
      this.newPage("סיכום GPS");
      this.drawGpsOverview();
      this.drawBarChart("GPS Load לפי שחקן", this.report.gps.players, "gpsLoad", "עומס", "");
      this.drawBarChart("HSR לפי שחקן", this.report.gps.players, "highSpeedRunning", "HSR", "מ׳");
      this.drawBarChart("Sprint Distance לפי שחקן", this.report.gps.players, "sprintDistance", "ספרינט", "מ׳");
      this.drawBarChart("Max Speed לפי שחקן", this.report.gps.players, "maxSpeed", "מהירות", "קמ״ש");
    }

    this.newPage("מוכנות ושינה");
    this.drawReadinessSummary();
    this.drawSleepSummary();

    this.newPage("RPE והתאוששות");
    this.drawRpeSummary();
    this.drawPainSummary();
    this.drawHydrationSummary();

    this.finishPages();
  }

  newPage(sectionLabel) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(PAGE_WIDTH * PAGE_SCALE);
    canvas.height = Math.round(PAGE_HEIGHT * PAGE_SCALE);
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.setTransform(PAGE_SCALE, 0, 0, PAGE_SCALE, 0, 0);
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    ctx.direction = "rtl";
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = COLORS.primary;
    ctx.fillRect(0, 0, PAGE_WIDTH, 108);
    drawRtlText(ctx, this.report.title, PAGE_WIDTH - MARGIN, 42, {
      font: font(24, 700),
      color: COLORS.white
    });
    drawRtlText(ctx, `${this.report.dateDisplay} · ${this.report.teamName}`, PAGE_WIDTH - MARGIN, 71, {
      font: font(13, 500),
      color: "rgba(255,255,255,0.82)"
    });
    drawRtlText(ctx, sectionLabel, PAGE_WIDTH - MARGIN, 94, {
      font: font(11, 500),
      color: "rgba(255,255,255,0.66)"
    });

    this.pages.push(canvas);
    this.canvas = canvas;
    this.ctx = ctx;
    this.y = 136;
    this.sectionLabel = sectionLabel;
  }

  ensureSpace(height, repeatedLabel = this.sectionLabel) {
    if (this.y + height <= PAGE_HEIGHT - 58) return;
    this.newPage(repeatedLabel);
  }

  sectionTitle(title, subtitle = "") {
    this.ensureSpace(subtitle ? 62 : 42);
    drawRtlText(this.ctx, title, PAGE_WIDTH - MARGIN, this.y, {
      font: font(18, 700),
      color: COLORS.ink
    });
    if (subtitle) {
      drawRtlText(this.ctx, subtitle, PAGE_WIDTH - MARGIN, this.y + 23, {
        font: font(11.5, 400),
        color: COLORS.muted
      });
      this.y += 48;
    } else {
      this.y += 30;
    }
  }

  drawExecutiveSummary() {
    this.sectionTitle("תמונת מצב יומית", "המדדים המרכזיים של נתוני אתמול");
    const items = [
      ["תאריך", this.report.dateDisplay],
      ["סוג פעילות", this.report.sessionLabel],
      ["שחקנים פעילים", String(this.report.activePlayerCount)],
      ["מוכנות ממוצעת", valueOrDash(this.report.executive.readinessAverage, "/100")],
      ["RPE ממוצע", valueOrDash(this.report.executive.rpeAverage, "/10")],
      ["GPS Load ממוצע", valueOrDash(this.report.executive.gpsLoadAverage, "")],
      ["שינה ממוצעת", valueOrDash(this.report.executive.sleepAverage, " שעות")],
      ["איבוד נוזלים ממוצע", valueOrDash(this.report.executive.hydrationAverage, "%")]
    ];
    this.drawKpiGrid(items);
  }

  drawKpiGrid(items) {
    const columns = 4;
    const gap = 10;
    const cardWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
    const cardHeight = 72;
    const rows = Math.ceil(items.length / columns);
    this.ensureSpace(rows * (cardHeight + gap));
    items.forEach(([label, value], index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = PAGE_WIDTH - MARGIN - cardWidth - column * (cardWidth + gap);
      const y = this.y + row * (cardHeight + gap);
      fillRoundedRect(this.ctx, x, y, cardWidth, cardHeight, 8, COLORS.surface);
      drawRtlText(this.ctx, label, x + cardWidth - 13, y + 24, {
        font: font(10.5, 500),
        color: COLORS.muted
      });
      drawRtlText(this.ctx, value, x + cardWidth - 13, y + 53, {
        font: font(17, 700),
        color: COLORS.ink
      });
    });
    this.y += rows * (cardHeight + gap) + 14;
  }

  drawAttentionTable() {
    this.sectionTitle("שחקנים הדורשים תשומת לב", `${this.report.attention.length} שחקנים ברשימת המעקב`);
    this.drawTable(
      [
        { label: "שחקן", key: "name", width: 105 },
        { label: "חומרה", key: "severityLabel", width: 72, toneKey: "tone" },
        { label: "סיבה", key: "reason", width: 250 },
        { label: "פעולה מומלצת", key: "action", width: 263 }
      ],
      this.report.attention,
      "אין שחקנים הדורשים תשומת לב מיוחדת."
    );
  }

  drawConclusions() {
    this.sectionTitle("מסקנות אוטומטיות", "סיכום מבוסס כללים לצוות המקצועי");
    this.drawBulletCard(this.report.conclusions);
  }

  drawGpsOverview() {
    this.sectionTitle("סיכום GPS", this.report.gps.sessionNames.join(" · ") || "פעילות GPS");
    this.drawKpiGrid([
      ["GPS Load ממוצע", valueOrDash(this.report.executive.gpsLoadAverage, "")],
      ["ציון עומס", this.report.gps.loadScore ? `${this.report.gps.loadScore}/5` : "אין נתון"],
      ["HSR ממוצע", valueOrDash(this.report.gps.hsrAverage, " מ׳")],
      ["Sprint Distance ממוצע", valueOrDash(this.report.gps.sprintAverage, " מ׳")]
    ]);
  }

  drawBarChart(title, items, key, metricLabel, unit) {
    const clean = items.filter((item) => Number.isFinite(Number(item[key])));
    if (!clean.length) return;
    const rowHeight = 25;
    const chartHeight = 78 + clean.length * rowHeight;
    this.ensureSpace(chartHeight, "סיכום GPS");
    const values = clean.map((item) => Number(item[key]) || 0);
    const average = values.reduce((total, value) => total + value, 0) / values.length;
    const maxValue = Math.max(...values, average, 1) * 1.08;
    const labelWidth = 118;
    const plotX = MARGIN + 82;
    const plotWidth = CONTENT_WIDTH - labelWidth - 88;
    const titleY = this.y;
    drawRtlText(this.ctx, title, PAGE_WIDTH - MARGIN, titleY, {
      font: font(16, 700),
      color: COLORS.ink
    });
    drawRtlText(this.ctx, `ממוצע קבוצה: ${formatPdfNumber(average)}${unit ? ` ${unit}` : ""}`, PAGE_WIDTH - MARGIN, titleY + 22, {
      font: font(11.5, 500),
      color: COLORS.primary
    });

    const plotTop = titleY + 45;
    const plotHeight = clean.length * rowHeight;
    const averageX = plotX + (average / maxValue) * plotWidth;
    this.ctx.save();
    this.ctx.strokeStyle = COLORS.blue;
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([5, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(averageX, plotTop - 5);
    this.ctx.lineTo(averageX, plotTop + plotHeight);
    this.ctx.stroke();
    this.ctx.restore();

    clean.forEach((item, index) => {
      const value = Number(item[key]) || 0;
      const y = plotTop + index * rowHeight;
      const ratio = average > 0 ? value / average : 1;
      const color = ratio > 1.05 ? COLORS.green : ratio < 0.95 ? COLORS.red : COLORS.yellow;
      const width = Math.max(2, (value / maxValue) * plotWidth);
      drawRtlText(this.ctx, item.playerName, PAGE_WIDTH - MARGIN, y + 16, {
        font: font(10.5, 500),
        color: COLORS.ink
      });
      fillRoundedRect(this.ctx, plotX, y + 5, width, 12, 4, color);
      drawLtrText(this.ctx, `${formatPdfNumber(value)}${unit ? ` ${unit}` : ""}`, plotX - 8, y + 16, {
        font: font(9.5, 500),
        color: COLORS.muted,
        align: "right"
      });
    });
    drawLtrText(this.ctx, "ממוצע", averageX, plotTop - 10, {
      font: font(9.5, 600),
      color: COLORS.blue,
      align: "center"
    });
    this.y = plotTop + plotHeight + 24;
  }

  drawReadinessSummary() {
    this.sectionTitle("סיכום מוכנות", `${this.report.readiness.submittedCount} מתוך ${this.report.activePlayerCount} דוחות הוגשו`);
    this.drawTable(
      [
        { label: "שחקן", key: "name", width: 170 },
        { label: "ציון מוכנות", key: "score", width: 130 },
        { label: "סטטוס", key: "status", width: 145, toneKey: "tone" },
        { label: "סיבות מרכזיות", key: "reasons", width: 245 }
      ],
      this.report.readiness.players,
      "לא הוגשו דוחות מוכנות."
    );
    this.drawNameList("דוחות מוכנות חסרים", this.report.readiness.missingNames);
    this.drawNameList("מוכנות נמוכה", this.report.readiness.lowNames);
  }

  drawSleepSummary() {
    this.sectionTitle("סיכום שינה", `ממוצע קבוצתי: ${valueOrDash(this.report.executive.sleepAverage, " שעות")}`);
    this.drawNameList("שחקנים מתחת ל-6 שעות", this.report.sleep.underSix.map((item) => `${item.name} - ${formatPdfNumber(item.hours)} שעות`));
    if (this.report.sleep.trend.length) {
      this.drawMiniTrend("מגמת שינה קבוצתית", this.report.sleep.trend, "value", "שעות");
    }
  }

  drawRpeSummary() {
    this.sectionTitle("סיכום RPE", `${this.report.rpe.submittedCount} מתוך ${this.report.activePlayerCount} דוחות הוגשו`);
    this.drawTable(
      [
        { label: "שחקן", key: "name", width: 180 },
        { label: "RPE", key: "rpe", width: 95 },
        { label: "סוג פעילות", key: "sessionType", width: 155 },
        { label: "עייפות", key: "fatigue", width: 100 },
        { label: "הערה", key: "note", width: 160 }
      ],
      this.report.rpe.players,
      "לא הוגשו דוחות RPE."
    );
    this.drawNameList("RPE גבוה", this.report.rpe.highNames);
    this.drawNameList("דוחות RPE חסרים", this.report.rpe.missingNames);
  }

  drawPainSummary() {
    this.sectionTitle("כאב / תשומת לב", "דיווחי כאב מאתמול ללא שפה אבחנתית");
    this.drawTable(
      [
        { label: "שחקן", key: "name", width: 150 },
        { label: "אזור", key: "area", width: 150 },
        { label: "צד", key: "side", width: 110 },
        { label: "עוצמה", key: "intensity", width: 105 },
        { label: "תאריך", key: "date", width: 175 }
      ],
      this.report.pain,
      "לא דווח כאב אתמול."
    );
  }

  drawHydrationSummary() {
    this.sectionTitle("סיכום הידרציה", `איבוד נוזלים ממוצע: ${valueOrDash(this.report.executive.hydrationAverage, "%")}`);
    this.drawTable(
      [
        { label: "שחקן", key: "name", width: 160 },
        { label: "איבוד נוזלים", key: "loss", width: 145 },
        { label: "סטטוס", key: "status", width: 175, toneKey: "tone" },
        { label: "פעילות", key: "sessionType", width: 210 }
      ],
      this.report.hydration.players,
      "אין נתוני משקל מלאים לחישוב הידרציה."
    );
    this.drawNameList("מעל 1%", this.report.hydration.aboveOneNames);
    this.drawNameList("מעל 2%", this.report.hydration.aboveTwoNames);
  }

  drawTable(columns, rows, emptyText) {
    if (!rows.length) {
      this.ensureSpace(58);
      fillRoundedRect(this.ctx, MARGIN, this.y, CONTENT_WIDTH, 48, 8, COLORS.surface);
      drawRtlText(this.ctx, emptyText, PAGE_WIDTH - MARGIN - 14, this.y + 30, {
        font: font(11.5, 500),
        color: COLORS.muted
      });
      this.y += 64;
      return;
    }

    const headerHeight = 34;
    const rowHeight = 44;
    const drawHeader = () => {
      fillRoundedRect(this.ctx, MARGIN, this.y, CONTENT_WIDTH, headerHeight, 7, COLORS.primary);
      let right = PAGE_WIDTH - MARGIN;
      columns.forEach((column) => {
        drawRtlText(this.ctx, column.label, right - 10, this.y + 22, {
          font: font(10.5, 600),
          color: COLORS.white
        });
        right -= column.width;
      });
      this.y += headerHeight;
    };

    this.ensureSpace(headerHeight + rowHeight);
    drawHeader();
    rows.forEach((row, index) => {
      if (this.y + rowHeight > PAGE_HEIGHT - 58) {
        this.newPage(this.sectionLabel);
        drawHeader();
      }
      this.ctx.fillStyle = index % 2 ? COLORS.white : COLORS.surface;
      this.ctx.fillRect(MARGIN, this.y, CONTENT_WIDTH, rowHeight);
      let right = PAGE_WIDTH - MARGIN;
      columns.forEach((column) => {
        const cellValue = String(row[column.key] ?? "-");
        const tone = column.toneKey ? row[column.toneKey] : "";
        if (tone) {
          const toneColors = getToneColors(tone);
          fillRoundedRect(this.ctx, right - column.width + 8, this.y + 10, column.width - 16, 24, 6, toneColors.background);
          drawRtlText(this.ctx, cellValue, right - 14, this.y + 27, {
            font: font(10, 600),
            color: toneColors.foreground,
            maxWidth: column.width - 28
          });
        } else {
          drawWrappedText(this.ctx, cellValue, right - 10, this.y + 17, column.width - 20, 15, {
            font: font(9.8, 500),
            color: COLORS.ink,
            maxLines: 2
          });
        }
        right -= column.width;
      });
      this.ctx.strokeStyle = COLORS.line;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(MARGIN, this.y + rowHeight);
      this.ctx.lineTo(PAGE_WIDTH - MARGIN, this.y + rowHeight);
      this.ctx.stroke();
      this.y += rowHeight;
    });
    this.y += 14;
  }

  drawNameList(title, names) {
    const values = names.filter(Boolean);
    this.ensureSpace(values.length ? 62 : 48);
    drawRtlText(this.ctx, title, PAGE_WIDTH - MARGIN, this.y, {
      font: font(13, 600),
      color: COLORS.ink
    });
    this.y += 20;
    const text = values.length ? values.join(" · ") : "אין";
    const used = drawWrappedText(this.ctx, text, PAGE_WIDTH - MARGIN, this.y, CONTENT_WIDTH, 18, {
      font: font(11, 400),
      color: values.length ? COLORS.muted : COLORS.green,
      maxLines: 4
    });
    this.y += used + 16;
  }

  drawBulletCard(items) {
    const lines = items.length ? items : ["לא נמצאו חריגות מרכזיות בנתוני אתמול."];
    const height = 24 + lines.length * 42;
    this.ensureSpace(height);
    fillRoundedRect(this.ctx, MARGIN, this.y, CONTENT_WIDTH, height, 9, COLORS.primarySoft);
    let lineY = this.y + 27;
    lines.forEach((item) => {
      this.ctx.fillStyle = COLORS.primary;
      this.ctx.beginPath();
      this.ctx.arc(PAGE_WIDTH - MARGIN - 13, lineY - 4, 3.5, 0, Math.PI * 2);
      this.ctx.fill();
      const used = drawWrappedText(this.ctx, item, PAGE_WIDTH - MARGIN - 28, lineY, CONTENT_WIDTH - 42, 17, {
        font: font(11.5, 500),
        color: COLORS.ink,
        maxLines: 2
      });
      lineY += Math.max(38, used + 10);
    });
    this.y += height + 14;
  }

  drawMiniTrend(title, points, key, unit) {
    const clean = points.filter((point) => Number.isFinite(Number(point[key])));
    if (!clean.length) return;
    this.ensureSpace(190);
    drawRtlText(this.ctx, title, PAGE_WIDTH - MARGIN, this.y, {
      font: font(13, 600),
      color: COLORS.ink
    });
    const chartTop = this.y + 26;
    const chartHeight = 120;
    const gap = 10;
    const barWidth = Math.min(54, (CONTENT_WIDTH - gap * (clean.length - 1)) / clean.length);
    const maxValue = Math.max(...clean.map((point) => Number(point[key]) || 0), 1) * 1.1;
    clean.forEach((point, index) => {
      const value = Number(point[key]) || 0;
      const x = MARGIN + index * (barWidth + gap);
      const barHeight = (value / maxValue) * 82;
      fillRoundedRect(this.ctx, x, chartTop + 88 - barHeight, barWidth, barHeight, 5, COLORS.blue);
      drawLtrText(this.ctx, formatPdfNumber(value), x + barWidth / 2, chartTop + 84 - barHeight, {
        font: font(9, 600),
        color: COLORS.ink,
        align: "center"
      });
      drawLtrText(this.ctx, point.label, x + barWidth / 2, chartTop + 108, {
        font: font(8.5, 500),
        color: COLORS.muted,
        align: "center"
      });
    });
    drawRtlText(this.ctx, unit, PAGE_WIDTH - MARGIN, chartTop + 14, {
      font: font(9, 400),
      color: COLORS.muted
    });
    this.y = chartTop + chartHeight + 16;
  }

  finishPages() {
    this.pages.forEach((canvas, index) => {
      const ctx = canvas.getContext("2d");
      ctx.setTransform(PAGE_SCALE, 0, 0, PAGE_SCALE, 0, 0);
      ctx.direction = "rtl";
      ctx.strokeStyle = COLORS.line;
      ctx.beginPath();
      ctx.moveTo(MARGIN, PAGE_HEIGHT - 40);
      ctx.lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 40);
      ctx.stroke();
      drawRtlText(ctx, "דוח RPE קבוצתי · לשימוש הצוות המקצועי", PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 20, {
        font: font(9, 400),
        color: COLORS.muted
      });
      drawLtrText(ctx, `${index + 1}/${this.pages.length}`, MARGIN, PAGE_HEIGHT - 20, {
        font: font(9, 500),
        color: COLORS.muted,
        align: "left"
      });
    });
  }
}

function drawRtlText(ctx, text, x, y, options = {}) {
  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.font = options.font || font(12, 500);
  ctx.fillStyle = options.color || COLORS.ink;
  if (options.maxWidth) ctx.fillText(String(text), x, y, options.maxWidth);
  else ctx.fillText(String(text), x, y);
  ctx.restore();
}

function drawLtrText(ctx, text, x, y, options = {}) {
  ctx.save();
  ctx.direction = "ltr";
  ctx.textAlign = options.align || "left";
  ctx.font = options.font || font(12, 500);
  ctx.fillStyle = options.color || COLORS.ink;
  ctx.fillText(String(text), x, y);
  ctx.restore();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, options = {}) {
  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.font = options.font || font(11, 500);
  ctx.fillStyle = options.color || COLORS.ink;
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });
  if (current) lines.push(current);
  const maxLines = options.maxLines || lines.length || 1;
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    let last = `${visible[visible.length - 1]}…`;
    while (last.length > 1 && ctx.measureText(last).width > maxWidth) last = `${last.slice(0, -2)}…`;
    visible[visible.length - 1] = last;
  }
  visible.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  ctx.restore();
  return Math.max(lineHeight, visible.length * lineHeight);
}

function fillRoundedRect(ctx, x, y, width, height, radius, fill) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function getToneColors(tone) {
  if (tone === "red") return { foreground: COLORS.red, background: COLORS.redSoft };
  if (tone === "yellow") return { foreground: COLORS.yellow, background: COLORS.yellowSoft };
  if (tone === "green") return { foreground: COLORS.green, background: COLORS.greenSoft };
  return { foreground: COLORS.muted, background: COLORS.surface };
}

function font(size, weight) {
  return `${weight} ${size}px Heebo, Arial, "Noto Sans Hebrew", sans-serif`;
}

function valueOrDash(value, suffix) {
  return Number.isFinite(Number(value)) ? `${formatPdfNumber(value)}${suffix}` : "אין נתון";
}

function formatPdfNumber(value) {
  return new Intl.NumberFormat("he-IL", { maximumFractionDigits: 1 }).format(Number(value) || 0);
}

function canvasesToPdf(canvases) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const objectCount = 2 + canvases.length * 3;
  const objects = new Array(objectCount + 1);
  const kids = [];

  canvases.forEach((canvas, index) => {
    const pageObject = 3 + index * 3;
    const imageObject = pageObject + 1;
    const contentObject = pageObject + 2;
    const imageBytes = dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.88));
    const content = `q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im0 Do Q`;
    kids.push(`${pageObject} 0 R`);
    objects[pageObject] = asciiBytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>`);
    objects[imageObject] = concatBytes([
      asciiBytes(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`),
      imageBytes,
      asciiBytes("\nendstream")
    ]);
    objects[contentObject] = asciiBytes(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  objects[1] = asciiBytes("<< /Type /Catalog /Pages 2 0 R >>");
  objects[2] = asciiBytes(`<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${canvases.length} >>`);

  const chunks = [asciiBytes("%PDF-1.4\n%RPEPDF\n")];
  const offsets = new Array(objectCount + 1).fill(0);
  let offset = chunks[0].length;
  for (let index = 1; index <= objectCount; index += 1) {
    const prefix = asciiBytes(`${index} 0 obj\n`);
    const suffix = asciiBytes("\nendobj\n");
    offsets[index] = offset;
    chunks.push(prefix, objects[index], suffix);
    offset += prefix.length + objects[index].length + suffix.length;
  }

  const xrefOffset = offset;
  const xref = ["xref", `0 ${objectCount + 1}`, "0000000000 65535 f "];
  for (let index = 1; index <= objectCount; index += 1) {
    xref.push(`${String(offsets[index]).padStart(10, "0")} 00000 n `);
  }
  xref.push("trailer", `<< /Size ${objectCount + 1} /Root 1 0 R >>`, "startxref", String(xrefOffset), "%%EOF");
  chunks.push(asciiBytes(`${xref.join("\n")}\n`));
  return new Blob(chunks, { type: "application/pdf" });
}

function asciiBytes(value) {
  return new TextEncoder().encode(value);
}

function dataUrlToBytes(dataUrl) {
  const binary = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function concatBytes(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });
  return output;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
