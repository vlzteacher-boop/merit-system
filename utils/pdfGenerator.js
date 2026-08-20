const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const fontPath = path.join(__dirname, 'fonts', 'DejaVuSans.ttf');
const templatePath = path.join(__dirname, 'assets', 'merit-ticket.png');

function getNameFontSize(name) {
  const len = String(name || '').length;
  if (len <= 22) return 12;
  if (len <= 30) return 11;
  if (len <= 38) return 10;
  return 9;
}

function getRewardFontSize(text) {
  const len = String(text || '').length;
  if (len <= 20) return 17;
  if (len <= 32) return 15;
  if (len <= 48) return 13;
  if (len <= 70) return 11;
  return 10;
}

function getRewardText(order) {
  return String(
    order.reward_ticket_text ||
    order.reward_title ||
    order.reward_name ||
    order.reward_description ||
    ''
  );
}

function drawText(doc, text, rect, options = {}) {
  if (!text) return;

  doc
    .font(fontPath)
    .fontSize(options.fontSize || 9)
    .fillColor(options.color || '#222222')
    .text(String(text), rect.x, rect.y, {
      width: rect.width,
      height: rect.height,
      align: options.align || 'center',
      valign: options.valign || 'center',
      lineGap: options.lineGap || 1,
      ellipsis: true
    });
}

function generateTickets(orders) {
  return new Promise((resolve, reject) => {
    try {
      if (!Array.isArray(orders)) {
        throw new Error('generateTickets: orders должен быть массивом');
      }
      if (!fs.existsSync(fontPath)) {
        throw new Error(`Не найден шрифт: ${fontPath}`);
      }
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Не найден шаблон: ${templatePath}`);
      }

      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 0,
        autoFirstPage: false
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = 841.89;
      const pageHeight = 595.28;

      // Этот шаблон уже содержит 4 билета (2x2).
      // Координаты ниже заданы НОРМАЛИЗОВАННО (0..1), поэтому код не
      // зависит от точного разрешения PNG.
      const ticketFields = [
        // 1. верхний левый
        {
          name:   { x: 0.166, y: 0.200, w: 0.286, h: 0.052 },
          reward: { x: 0.066, y: 0.286, w: 0.376, h: 0.088 },
          className: { x: 0.054, y: 0.398, w: 0.092, h: 0.035 },
          date:      { x: 0.166, y: 0.398, w: 0.100, h: 0.035 },
          code:      { x: 0.250, y: 0.456, w: 0.095, h: 0.028 }
        },
        // 2. верхний правый
        {
          name:   { x: 0.666, y: 0.200, w: 0.286, h: 0.052 },
          reward: { x: 0.552, y: 0.286, w: 0.376, h: 0.088 },
          className: { x: 0.530, y: 0.398, w: 0.092, h: 0.035 },
          date:      { x: 0.642, y: 0.398, w: 0.100, h: 0.035 },
          code:      { x: 0.728, y: 0.456, w: 0.095, h: 0.028 }
        },
        // 3. нижний левый
        {
          name:   { x: 0.166, y: 0.676, w: 0.286, h: 0.052 },
          reward: { x: 0.066, y: 0.762, w: 0.376, h: 0.088 },
          className: { x: 0.054, y: 0.874, w: 0.092, h: 0.035 },
          date:      { x: 0.166, y: 0.874, w: 0.100, h: 0.035 },
          code:      { x: 0.250, y: 0.932, w: 0.095, h: 0.028 }
        },
        // 4. нижний правый
        {
          name:   { x: 0.666, y: 0.676, w: 0.286, h: 0.052 },
          reward: { x: 0.552, y: 0.762, w: 0.376, h: 0.088 },
          className: { x: 0.530, y: 0.874, w: 0.092, h: 0.035 },
          date:      { x: 0.642, y: 0.874, w: 0.100, h: 0.035 },
          code:      { x: 0.728, y: 0.932, w: 0.095, h: 0.028 }
        }
      ];

      const toPdfRect = f => ({
        x: f.x * pageWidth,
        y: f.y * pageHeight,
        width: f.w * pageWidth,
        height: f.h * pageHeight
      });

      const pageCount = Math.ceil(orders.length / 4);

      for (let page = 0; page < pageCount; page++) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 0 });

        doc.image(templatePath, 0, 0, {
          width: pageWidth,
          height: pageHeight
        });

        for (let ticketIndex = 0; ticketIndex < 4; ticketIndex++) {
          const order = orders[page * 4 + ticketIndex];
          if (!order) continue;

          const fields = ticketFields[ticketIndex];
          const fullName = String(order.full_name || '');
          const rewardText = getRewardText(order);
          const className = String(order.class_name || '');
          const dateValue = order.date || order.used_date || order.usage_date || '';
          const code = String(order.code || '');

          drawText(doc, fullName, toPdfRect(fields.name), {
            fontSize: getNameFontSize(fullName),
            color: '#222222'
          });

          // ГЛАВНОЕ ИЗМЕНЕНИЕ:
          // в центральную часть печатается не причина начисления мерита,
          // а конкретная награда, которую ученик купил.
          drawText(doc, rewardText, toPdfRect(fields.reward), {
            fontSize: getRewardFontSize(rewardText),
            color: '#171717',
            lineGap: 2
          });

          drawText(doc, className, toPdfRect(fields.className), {
            fontSize: 8
          });

          drawText(doc, dateValue ? String(dateValue) : '', toPdfRect(fields.date), {
            fontSize: 8
          });

          drawText(doc, code, toPdfRect(fields.code), {
            fontSize: 7.5
          });
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateTickets };
