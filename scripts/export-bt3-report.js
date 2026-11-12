// Dependency-free review copy; print the generated HTML to PDF in a browser.
const fs = require('node:fs');
const path = require('node:path');
const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(s) {
  return escape(s).replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
function render(text) {
  let out = '', code = false, table = false;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('```')) { out += code ? '</code></pre>' : '<pre><code>'; code = !code; continue; }
    if (code) { out += escape(line) + '\n'; continue; }
    if (line.startsWith('|')) {
      if (/^\|[\s:|\-]+$/.test(line)) continue;
      const cells = line.split('|').slice(1, -1);
      if (!table) { out += '<table>'; table = true; }
      out += '<tr>' + cells.map(c => '<td>' + inline(c.trim()) + '</td>').join('') + '</tr>';
      continue;
    }
    if (table) { out += '</table>'; table = false; }
    const heading = /^(#{1,6}) (.*)/.exec(line);
    if (heading) out += `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;
    else if (line.trim()) out += '<p>' + inline(line) + '</p>';
  }
  return out + (table ? '</table>' : '');
}
const parts = [
  ['1. Test Plan', 'test-plan.md'], ['2. Test Report', 'test-report.md'],
  ['3. Bug Log', 'bug-log.md'], ['4. Deployment Guide', 'deployment-guide.md'],
  ['5. Security Checklist', 'checklist-bao-mat.md'], ['6. API Documentation', 'api-docs.md'],
  ['7. Evidence', 'bt3-trang-thai.md'], ['8. AI Disclosure', 'ai-disclosure.md'],
];
let html = '<!doctype html><html lang="vi"><meta charset="utf-8"><title>BT3 - Tran Van Le</title><style>@page{size:A4 landscape;margin:14mm}body{font:11px Arial,sans-serif;line-height:1.4;color:#17212b}section{break-before:page}h1{font-size:24px}h2{font-size:18px}h3{font-size:14px}table{border-collapse:collapse;width:100%;font-size:9px}td{border:1px solid #aaa;padding:5px;vertical-align:top;overflow-wrap:anywhere}tr:first-child{font-weight:bold;background:#eef2f7}tr,pre{break-inside:avoid}pre{white-space:pre-wrap;background:#f4f5f7;padding:8px}a{color:#1659a4}img{max-width:95%;max-height:145mm}.cover{padding:25mm}code{overflow-wrap:anywhere}</style><body><div class="cover"><h1>BÀI TẬP 3: KIỂM THỬ VÀ ĐÓNG GÓI PROTOTYPE</h1><p>Chuyên đề tốt nghiệp 1 — Track SE — Luồng L2</p><p>Trần Văn Lễ — MSSV 2374802010270</p><p>Lớp: cần sinh viên xác nhận — Ngày soạn: 12/11/2026</p><p>Repository: <a href="https://github.com/levan05/cdtn1-tranvanle-l2">levan05/cdtn1-tranvanle-l2</a></p><p>Tag yêu cầu: v1.0 — CHƯA PHÁT HÀNH</p><h2>BẢN RÀ SOÁT — CHƯA PHẢI BẢN NỘP CUỐI</h2><p>Đã kiểm thử và chụp minh chứng Docker. Còn bổ sung thông tin lớp và kiểm bản phát hành v1.0; xem mục 7.</p><ol>';
html += parts.map(([title]) => '<li>' + title + '</li>').join('') + '</ol></div>';
for (const [title, file] of parts) {
  html += '<section><h1>' + title + '</h1>' + render(fs.readFileSync(path.join('docs', file), 'utf8'));
  if (file === 'bt3-trang-thai.md') {
    html += '<h2>Ảnh kiểm thử và đóng gói Docker ngày 12/11/2026</h2>';
    const evidenceImages = [
      ['docker-health.png', 'App và PostgreSQL healthy; phản hồi healthcheck'],
      ['docker-unit-tests.png', '15/15 unit test PASS trong container'],
      ['docker-integration-tests.png', '12/12 integration test PASS với PostgreSQL'],
      ['TC-02-docker.png', 'TC-02: luồng tiếp nhận và các kiểm tra bổ sung'],
      ['TC-10-docker.png', 'TC-10: quyền xem phiếu theo trung tâm'],
      ['frontend-login.png', 'Giao diện hệ thống được phục vụ từ Docker'],
    ];
    for (const [imageFile, caption] of evidenceImages) {
      html += `<div style="break-before:page"><h3>${caption}</h3><img src="packaging-evidence/screenshots/${imageFile}" alt="${caption}"></div>`;
    }
    html += '<h2>Ảnh terminal thật của buổi 14 (không phải ảnh lượt BT3)</h2>';
    for (let i = 1; i <= 12; i++) {
      const id = `TC-${String(i).padStart(2, '0')}`;
      html += `<div style="break-before:page"><h3>${id}</h3><img src="screenshots/${id}.png" alt="${id}"></div>`;
    }
  }
  html += '</section>';
}
html += '</body></html>';
const target = 'docs/BT3_2374802010270_TranVanLe-review.html';
fs.writeFileSync(target, html);
console.log(target);
