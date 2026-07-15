import type { Quotation } from "@/api/quotations";

// ─── helpers ───────────────────────────────────────────────────────────────────
function fmt(n?: number) {
    return `₭${(n || 0).toLocaleString()}`;
}

function fmtDate(d?: string) {
    if (!d) return "—";
    const date = new Date(d);
    const dd   = String(date.getDate()).padStart(2, "0");
    const mm   = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}
  

// ─── render to new window ──────────────────────────────────────────────────────
export function printQuotation(q: Quotation) {
    const logo = q.tenantSnapshot?.logo;
    const isLogoSvg = logo?.trim().toLowerCase().startsWith("<svg");

    const logoHtml = logo
        ? isLogoSvg
            ? `<div class="logo-img">${logo}</div>`
            : `<img src="${logo}" alt="logo" class="logo-img" />`
        : "";

    const itemsHtml = q.items
        .map(
            (item, i) => `
        <tr>
            <td class="num">${i + 1}</td>
            <td>
                <div class="item-name">${item.name}</div>
                ${item.description ? `<div class="item-desc">${item.description}</div>` : ""}
            </td>
            <td class="num">${item.quantity.toLocaleString()}</td>
            <td class="num">${item.unit || "—"}</td>
            <td class="money">${fmt(item.unitPrice)}</td>
            <td class="money">${item.discountAmount > 0 ? fmt(item.discountAmount) : "—"}</td>
            <td class="money bold">${fmt(item.subtotal)}</td>
        </tr>`
        )
        .join("");

    const html = `<!DOCTYPE html>
<html lang="lo">
<head>
<meta charset="UTF-8" />
<title>ໃບສະເໜີລາຄາ ${q.quoteNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Noto Sans Lao', Arial, sans-serif;
    font-size: 13px;
    color: #1e293b;
    background: #fff;
    padding: 0;
  }

  @page { size: A4; margin: 0; }

  .page {
    width: 210mm;
    margin: 0 auto;
    padding: 18mm 18mm 14mm;
    background: #fff;
    position: relative;
  }

  /* ── header ─────────────────────────────────── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28px;
    gap: 24px;
  }

  .logo-wrap { min-width: 90px; }
  .logo-img  { height: 64px; width: auto; max-width: 160px; display: block; }
  .logo-img svg { height: 64px; width: auto; }

  .shop-info { flex: 1; text-align: left; }
  .shop-name { font-size: 17px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
  .shop-detail { font-size: 11px; color: #64748b; line-height: 1.7; }

  .quote-meta { text-align: right; min-width: 180px; }
  .quote-title { font-size: 22px; font-weight: 700; color: #4f46e5; letter-spacing: 0.5px; margin-bottom: 8px; }
  .quote-number { font-size: 13px; font-weight: 600; color: #1e293b; }
  .quote-detail { font-size: 11px; color: #64748b; margin-top: 3px; line-height: 1.6; }
  .status-badge {
    display: inline-block;
    margin-top: 6px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    background: #e0e7ff;
    color: #4338ca;
  }

  /* ── divider ─────────────────────────────────── */
  .divider { border: none; border-top: 2px solid #4f46e5; margin: 0 0 20px; }
  .divider-light { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }

  /* ── bill-to ─────────────────────────────────── */
  .bill-section {
    display: flex;
    gap: 32px;
    margin-bottom: 24px;
  }
  .bill-to { flex: 1; }
  .section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 6px;
  }
  .bill-customer-name { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
  .bill-customer-detail { font-size: 11px; color: #64748b; line-height: 1.7; }

  /* ── items table ─────────────────────────────── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 0; }

  thead tr { background: #4f46e5; }
  thead th {
    padding: 9px 10px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #fff;
    text-align: left;
  }
  thead th.num   { text-align: center; }
  thead th.money { text-align: right; }

  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:hover { background: #f1f5f9; }
  tbody td { padding: 8px 10px; font-size: 12px; color: #1e293b; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  tbody td.num   { text-align: center; color: #64748b; }
  tbody td.money { text-align: right; font-variant-numeric: tabular-nums; }
  tbody td.bold  { font-weight: 700; }

  .item-name { font-weight: 600; font-size: 12px; }
  .item-desc { font-size: 10px; color: #94a3b8; margin-top: 2px; }

  /* ── totals ─────────────────────────────────── */
  .totals-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
  .totals-table { width: 260px; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
  .totals-row .label { color: #64748b; }
  .totals-row .value { font-variant-numeric: tabular-nums; }
  .totals-grand { border-top: 2px solid #4f46e5; padding-top: 8px; margin-top: 4px; }
  .totals-grand .label { font-size: 14px; font-weight: 700; color: #1e293b; }
  .totals-grand .value { font-size: 16px; font-weight: 700; color: #4f46e5; }

  /* ── note / terms ─────────────────────────────── */
  .note-section { margin-top: 24px; }
  .note-box { font-size: 11px; color: #475569; line-height: 1.7; white-space: pre-wrap; }

  /* ── signature ─────────────────────────────── */
  .sig-section {
    display: flex;
    justify-content: space-between;
    margin-top: 40px;
    gap: 24px;
  }
  .sig-box { flex: 1; text-align: center; }
  .sig-line { border-top: 1px solid #cbd5e1; margin-top: 48px; padding-top: 6px; }
  .sig-label { font-size: 11px; color: #64748b; }

  /* ── footer ─────────────────────────────────── */
  .footer {
    margin-top: 32px;
    border-top: 1px solid #e2e8f0;
    padding-top: 10px;
    text-align: center;
    font-size: 10px;
    color: #94a3b8;
  }

  /* ── print ─────────────────────────────────── */
  @media print {
    body { padding: 0; }
    .page { margin: 0; padding: 14mm 14mm 12mm; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="logo-wrap">
      ${logoHtml}
    </div>

    <div class="shop-info">
      <div class="shop-name">${q.tenantSnapshot?.shopName || "ຮ້ານຄ້າ"}</div>
      <div class="shop-detail">
        ${q.tenantSnapshot?.address ? `📍 ${q.tenantSnapshot.address}<br/>` : ""}
        ${q.tenantSnapshot?.phone ? `📞 ${q.tenantSnapshot.phone}<br/>` : ""}
        ${q.tenantSnapshot?.bankName ? `🏦 ${q.tenantSnapshot.bankName} · ${q.tenantSnapshot.bankAccount || ""}` : ""}
      </div>
    </div>

    <div class="quote-meta">
      <div class="quote-title">ໃບສະເໜີລາຄາ</div>
      <div class="quote-number">${q.quoteNumber}</div>
      <div class="quote-detail">
        ວັນທີ: ${fmtDate(q.createdAt)}<br/>
        ${q.validUntil ? `ໃຊ້ໄດ້ຮອດ: ${fmtDate(q.validUntil)}` : ""}
      </div>
    </div>
  </div>

  <hr class="divider" />

  <!-- BILL TO -->
  <div class="bill-section">
    <div class="bill-to">
      <div class="section-label">ສະເໜີລາຄາຫາ</div>
      <div class="bill-customer-name">${q.customer.name}</div>
      <div class="bill-customer-detail">
        ${q.customer.company ? `${q.customer.company}<br/>` : ""}
        ${q.customer.phone ? `📞 ${q.customer.phone}<br/>` : ""}
        ${q.customer.address ? `📍 ${q.customer.address}` : ""}
        ${q.customer.email ? `<br/>✉ ${q.customer.email}` : ""}
      </div>
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <table>
    <thead>
      <tr>
        <th class="num" style="width:36px">#</th>
        <th>ລາຍການ</th>
        <th class="num" style="width:60px">ຈຳນວນ</th>
        <th class="num" style="width:50px">ຫົວໜ່ວຍ</th>
        <th class="money" style="width:100px">ລາຄາ/ຊິ້ນ</th>
        <th class="money" style="width:80px">ສ່ວນຫຼຸດ</th>
        <th class="money" style="width:110px">ລວມ</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml || `<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:24px">ບໍ່ມີລາຍການ</td></tr>`}
    </tbody>
  </table>

  <!-- TOTALS -->
  <div class="totals-wrap">
    <div class="totals-table">
      <div class="totals-row">
        <span class="label">ລາຄາລວມ</span>
        <span class="value">${fmt(q.subtotal)}</span>
      </div>
      ${q.discountAmount > 0 ? `
      <div class="totals-row">
        <span class="label">ສ່ວນຫຼຸດ</span>
        <span class="value" style="color:#dc2626">- ${fmt(q.discountAmount)}</span>
      </div>` : ""}
      ${q.taxRate > 0 ? `
      <div class="totals-row">
        <span class="label">ພາສີ (${q.taxRate}%)</span>
        <span class="value">${fmt(q.taxAmount)}</span>
      </div>` : ""}
      <div class="totals-row totals-grand">
        <span class="label">ລວມທັງໝົດ</span>
        <span class="value">${fmt(q.total)}</span>
      </div>
    </div>
  </div>

  <!-- NOTE & TERMS -->
  ${q.note ? `
  <div class="note-section">
    <div class="section-label">ໝາຍເຫດ</div>
    <div class="note-box">${q.note}</div>
  </div>` : ""}

  ${q.terms ? `
  <div class="note-section" style="margin-top:12px">
    <div class="section-label">ເງື່ອນໄຂ & ຂໍ້ຕົກລົງ</div>
    <div class="note-box">${q.terms}</div>
  </div>` : ""}

  <!-- SIGNATURES -->
  <div class="sig-section">
    <div class="sig-box">
      <div class="sig-line">
        <div class="sig-label">ຜູ້ສະເໜີລາຄາ</div>
      </div>
    </div>
    <div class="sig-box">
      <div class="sig-line">
        <div class="sig-label">ຜູ້ຮັບໃບສະເໜີລາຄາ</div>
      </div>
    </div>
    <div class="sig-box">
      <div class="sig-line">
        <div class="sig-label">ອະນຸມັດ</div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    ${q.tenantSnapshot?.shopName || ""} · ເອກະສານນີ້ຜ່ານລະບົບ SKV POS · ${q.quoteNumber}
  </div>

</div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
        win.print();
    }, 600);
}
