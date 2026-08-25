const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const cormorantFontPath =
    path.join(
        __dirname,
        'fonts',
        'CormorantGaramond-SemiBold.ttf'
    );

const golosFontPath =
    path.join(
        __dirname,
        'fonts',
        'GolosText-Medium.ttf'
    );

const schoolLogoPath =
    path.join(
        __dirname,
        '..',
        'assets',
        'school-logo.png'
    );

const COLORS = {
    navy: '#081B36',
    navySoft: '#122C4B',
    cream: '#F7F0E5',
    creamDark: '#E9DECE',
    gold: '#B59A5B',
    goldSoft: '#D6C79F',
    ink: '#12213A',
    muted: '#6F685E',
    white: '#FFFFFF'
};

function getSerifFont() {
    return fs.existsSync(cormorantFontPath)
        ? cormorantFontPath
        : 'Times-Roman';
}

function getCodeFont() {
    return fs.existsSync(golosFontPath)
        ? golosFontPath
        : 'Helvetica';
}

function getRewardText(order) {
    return String(
        order.reward_ticket_text ||
        order.reward_title ||
        order.reward_name ||
        ''
    ).trim();
}

function formatOrderDate(order) {
    const direct =
        order.date ||
        order.used_date ||
        order.usage_date;

    if (direct) {
        return String(direct);
    }

    if (!order.created_at) {
        return '';
    }

    const date =
        new Date(order.created_at);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const day =
        String(date.getDate()).padStart(2, '0');

    const month =
        String(date.getMonth() + 1).padStart(2, '0');

    const year =
        date.getFullYear();

    return order.locale === 'en'
        ? `${month}/${day}/${year}`
        : `${day}.${month}.${year}`;
}

function fitSingleLine(
    doc,
    text,
    font,
    maxWidth,
    {
        maxFontSize,
        minFontSize,
        characterSpacing = 0,
        step = 0.25
    }
) {
    const value =
        String(text || '');

    let size =
        maxFontSize;

    while (size > minFontSize) {
        doc
            .font(font)
            .fontSize(size);

        const width =
            doc.widthOfString(
                value,
                { characterSpacing }
            );

        if (width <= maxWidth) {
            return size;
        }

        size -= step;
    }

    return minFontSize;
}

function fitMultiLine(
    doc,
    text,
    font,
    width,
    height,
    {
        maxFontSize,
        minFontSize,
        lineGap = 0,
        step = 0.25
    }
) {
    const value =
        String(text || '');

    let size =
        maxFontSize;

    while (size > minFontSize) {
        doc
            .font(font)
            .fontSize(size);

        const measured =
            doc.heightOfString(
                value,
                {
                    width,
                    lineGap,
                    align: 'left'
                }
            );

        if (measured <= height) {
            return size;
        }

        size -= step;
    }

    return minFontSize;
}

function drawDiamond(
    doc,
    x,
    y,
    size,
    color
) {
    doc
        .save()
        .fillColor(color)
        .polygon(
            [x, y - size],
            [x + size, y],
            [x, y + size],
            [x - size, y]
        )
        .fill()
        .restore();
}

function drawStar(
    doc,
    cx,
    cy,
    outerRadius,
    innerRadius,
    color
) {
    const points = [];

    for (let index = 0; index < 10; index++) {
        const radius =
            index % 2 === 0
                ? outerRadius
                : innerRadius;

        const angle =
            -Math.PI / 2 +
            index * Math.PI / 5;

        points.push([
            cx + Math.cos(angle) * radius,
            cy + Math.sin(angle) * radius
        ]);
    }

    doc
        .save()
        .fillColor(color)
        .polygon(...points)
        .fill()
        .restore();
}

function drawLaurelM(
    doc,
    cx,
    cy,
    scale,
    serifFont
) {
    doc
        .save()
        .strokeColor(COLORS.gold)
        .lineWidth(1);

    for (const side of [-1, 1]) {
        const baseX =
            cx + side * 19 * scale;

        doc
            .moveTo(baseX, cy + 20 * scale)
            .bezierCurveTo(
                cx + side * 35 * scale,
                cy + 8 * scale,
                cx + side * 35 * scale,
                cy - 16 * scale,
                cx + side * 20 * scale,
                cy - 26 * scale
            )
            .stroke();

        for (let i = 0; i < 5; i++) {
            const yy =
                cy + 13 * scale -
                i * 8 * scale;

            const xx =
                cx + side * (25 + i * 1.2) * scale;

            doc
                .ellipse(
                    xx,
                    yy,
                    4.3 * scale,
                    1.8 * scale
                )
                .fillColor(COLORS.gold)
                .fill();
        }
    }

    doc
        .font(serifFont)
        .fontSize(28 * scale)
        .fillColor(COLORS.ink)
        .text(
            'M',
            cx - 18 * scale,
            cy - 18 * scale,
            {
                width: 36 * scale,
                align: 'center',
                lineBreak: false
            }
        )
        .restore();
}

function drawLabel(
    doc,
    text,
    x,
    y,
    width,
    fontSize,
    serifFont
) {
    doc
        .font(serifFont)
        .fontSize(fontSize)
        .fillColor(COLORS.ink)
        .text(
            String(text || '').toUpperCase(),
            x,
            y,
            {
                width,
                lineBreak: false
            }
        );
}

function drawCode(
    doc,
    code,
    x,
    y,
    width,
    height,
    codeFont,
    {
        boxed = false,
        maxFontSize = 8.7,
        minFontSize = 5.3
    } = {}
) {
    const value =
        String(code || '').trim();

    if (!value) {
        return;
    }

    const innerPadding =
        boxed ? 6 : 0;

    const availableWidth =
        width - innerPadding * 2;

    const characterSpacing =
        -0.12;

    const size =
        fitSingleLine(
            doc,
            value,
            codeFont,
            availableWidth,
            {
                maxFontSize,
                minFontSize,
                characterSpacing
            }
        );

    if (boxed) {
        doc
            .save()
            .lineWidth(0.8)
            .strokeColor(COLORS.ink)
            .roundedRect(
                x,
                y,
                width,
                height,
                4
            )
            .stroke()
            .restore();
    }

    doc
        .font(codeFont)
        .fontSize(size);

    const measuredWidth =
        doc.widthOfString(
            value,
            { characterSpacing }
        );

    const textHeight =
        doc.currentLineHeight();

    const tx =
        x +
        Math.max(
            innerPadding,
            (width - measuredWidth) / 2
        );

    const ty =
        y +
        Math.max(
            0,
            (height - textHeight) / 2 - 0.5
        );

    doc
        .fillColor(COLORS.ink)
        .text(
            value,
            tx,
            ty,
            {
                width:
                    Math.max(
                        measuredWidth + 1,
                        availableWidth
                    ),
                height,
                lineBreak: false,
                characterSpacing
            }
        );
}

function drawTicketNotches(
    doc,
    x,
    y,
    w,
    h
) {
    const positions =
        [0.14, 0.34, 0.66, 0.86];

    for (const ratio of positions) {
        const yy =
            y + h * ratio;

        doc
            .fillColor(COLORS.white)
            .circle(
                x,
                yy,
                3.4
            )
            .fill();

        doc
            .fillColor(COLORS.white)
            .circle(
                x + w,
                yy,
                3.4
            )
            .fill();
    }
}

function drawTicket(
    doc,
    order,
    x,
    y,
    w,
    h
) {
    const serifFont =
        getSerifFont();

    const codeFont =
        getCodeFont();

    const locale =
        order.locale === 'en'
            ? 'en'
            : 'ru';

    const labels =
        locale === 'en'
            ? {
                name: 'Name',
                reward: 'Reward',
                className: 'Class',
                date: 'Date',
                code: 'Ticket code',
                transfer: 'Ticket transfer to another person is prohibited.'
            }
            : {
                name: 'Имя и фамилия',
                reward: 'Покупка',
                className: 'Класс',
                date: 'Дата',
                code: 'Код билета',
                transfer: 'Передача билета другому лицу запрещена.'
            };

    const fullName =
        String(order.full_name || '').trim();

    const rewardText =
        getRewardText(order);

    const className =
        String(order.class_name || '').trim();

    const dateValue =
        formatOrderDate(order);

    const code =
        String(order.code || '').trim();

    const leftW =
        w * 0.15;

    const stubW =
        w * 0.20;

    const mainX =
        x + leftW;

    const stubX =
        x + w - stubW;

    const mainW =
        stubX - mainX;

    const pad =
        h * 0.055;

    // Shadow.
    doc
        .save()
        .fillColor('#D9D6D0')
        .opacity(0.35)
        .roundedRect(
            x + 2.5,
            y + 3,
            w,
            h,
            8
        )
        .fill()
        .restore();

    // Main ticket paper.
    doc
        .save()
        .fillColor(COLORS.cream)
        .strokeColor(COLORS.goldSoft)
        .lineWidth(0.8)
        .roundedRect(
            x,
            y,
            w,
            h,
            8
        )
        .fillAndStroke()
        .restore();

    // Left navy branding panel.
    doc
        .save()
        .fillColor(COLORS.navy)
        .roundedRect(
            x,
            y,
            leftW + 3,
            h,
            8
        )
        .fill()
        .restore();

    // Square off the right edge of navy panel.
    doc
        .fillColor(COLORS.navy)
        .rect(
            x + leftW - 5,
            y,
            8,
            h
        )
        .fill();

    // Gold border on navy panel.
    doc
        .save()
        .strokeColor(COLORS.gold)
        .lineWidth(1.1)
        .moveTo(
            x + leftW,
            y + 2
        )
        .lineTo(
            x + leftW,
            y + h - 2
        )
        .stroke()
        .restore();

    // Exact school logo - only once.
    if (fs.existsSync(schoolLogoPath)) {
        const logoSize =
            Math.min(
                leftW * 0.70,
                h * 0.30
            );

        doc.image(
            schoolLogoPath,
            x + (leftW - logoSize) / 2,
            y + h * 0.10,
            {
                width: logoSize,
                height: logoSize
            }
        );
    }

    doc
        .font(serifFont)
        .fillColor(COLORS.gold)
        .fontSize(h * 0.115)
        .text(
            'RIS',
            x + 4,
            y + h * 0.47,
            {
                width: leftW - 8,
                align: 'center',
                lineBreak: false
            }
        );

    doc
        .fontSize(h * 0.048)
        .text(
            'MERIT',
            x + 4,
            y + h * 0.61,
            {
                width: leftW - 8,
                align: 'center',
                lineBreak: false
            }
        );

    // Perforation before stub.
    doc
        .save()
        .dash(3, { space: 2 })
        .strokeColor(COLORS.ink)
        .lineWidth(0.7)
        .moveTo(
            stubX,
            y + 2
        )
        .lineTo(
            stubX,
            y + h - 2
        )
        .stroke()
        .undash()
        .restore();

    // Decorative top line (no "Билет на покупку" title).
    const topLineY =
        y + h * 0.245;

    doc
        .save()
        .strokeColor(COLORS.gold)
        .lineWidth(0.7)
        .moveTo(
            mainX + pad,
            topLineY
        )
        .lineTo(
            stubX - pad,
            topLineY
        )
        .stroke()
        .restore();

    drawDiamond(
        doc,
        mainX + mainW * 0.52,
        topLineY,
        3,
        COLORS.gold
    );

    const labelSize =
        h * 0.040;

    const valueSize =
        h * 0.087;

    const leftColX =
        mainX + pad;

    const rightColX =
        mainX + mainW * 0.70;

    const leftColW =
        mainW * 0.60;

    const rightColW =
        mainW * 0.24;

    // Name + class.
    const row1LabelY =
        y + h * 0.31;

    const row1ValueY =
        y + h * 0.405;

    drawLabel(
        doc,
        labels.name,
        leftColX,
        row1LabelY,
        leftColW,
        labelSize,
        serifFont
    );

    drawLabel(
        doc,
        labels.className,
        rightColX,
        row1LabelY,
        rightColW,
        labelSize,
        serifFont
    );

    const nameSize =
        fitSingleLine(
            doc,
            fullName,
            serifFont,
            leftColW,
            {
                maxFontSize: h * 0.078,
                minFontSize: h * 0.043
            }
        );

    doc
        .font(serifFont)
        .fontSize(nameSize)
        .fillColor(COLORS.ink)
        .text(
            fullName,
            leftColX,
            row1ValueY,
            {
                width: leftColW,
                lineBreak: false
            }
        );

    const classSize =
        fitSingleLine(
            doc,
            className,
            serifFont,
            rightColW,
            {
                maxFontSize: h * 0.074,
                minFontSize: h * 0.043
            }
        );

    doc
        .font(serifFont)
        .fontSize(classSize)
        .fillColor(COLORS.ink)
        .text(
            className,
            rightColX,
            row1ValueY,
            {
                width: rightColW,
                lineBreak: false
            }
        );

    // Reward + date.
    const row2LabelY =
        y + h * 0.545;

    const row2ValueY =
        y + h * 0.625;

    drawLabel(
        doc,
        labels.reward,
        leftColX,
        row2LabelY,
        leftColW,
        labelSize,
        serifFont
    );

    drawLabel(
        doc,
        labels.date,
        rightColX,
        row2LabelY,
        rightColW,
        labelSize,
        serifFont
    );

    const rewardBoxH =
        h * 0.15;

    const rewardSize =
        fitMultiLine(
            doc,
            rewardText.toUpperCase(),
            serifFont,
            leftColW,
            rewardBoxH,
            {
                maxFontSize: h * 0.068,
                minFontSize: h * 0.037,
                lineGap: 0
            }
        );

    doc
        .font(serifFont)
        .fontSize(rewardSize)
        .fillColor(COLORS.ink)
        .text(
            rewardText.toUpperCase(),
            leftColX,
            row2ValueY,
            {
                width: leftColW,
                height: rewardBoxH,
                lineGap: 0,
                align: 'left',
                ellipsis: true
            }
        );

    const dateSize =
        fitSingleLine(
            doc,
            dateValue,
            serifFont,
            rightColW,
            {
                maxFontSize: h * 0.064,
                minFontSize: h * 0.038
            }
        );

    doc
        .font(serifFont)
        .fontSize(dateSize)
        .fillColor(COLORS.ink)
        .text(
            dateValue,
            rightColX,
            row2ValueY,
            {
                width: rightColW,
                lineBreak: false
            }
        );

    // Bottom divider.
    const bottomLineY =
        y + h * 0.805;

    doc
        .save()
        .strokeColor(COLORS.gold)
        .lineWidth(0.65)
        .moveTo(
            mainX + pad,
            bottomLineY
        )
        .lineTo(
            stubX - pad,
            bottomLineY
        )
        .stroke()
        .restore();

    // Transfer note only; validity-by-date phrase intentionally removed.
    const starX =
        mainX + pad + 7;

    const noteY =
        y + h * 0.86;

    drawStar(
        doc,
        starX,
        noteY + h * 0.025,
        h * 0.027,
        h * 0.012,
        COLORS.gold
    );

    const noteWidth =
        mainW * 0.48;

    const noteHeight =
        h * 0.075;

    const noteFontSize =
        fitMultiLine(
            doc,
            labels.transfer,
            serifFont,
            noteWidth,
            noteHeight,
            {
                maxFontSize: h * 0.030,
                minFontSize: h * 0.021,
                lineGap: 0
            }
        );

    doc
        .font(serifFont)
        .fontSize(noteFontSize)
        .fillColor(COLORS.ink)
        .text(
            labels.transfer,
            starX + h * 0.055,
            noteY,
            {
                width: noteWidth,
                height: noteHeight,
                lineGap: 0,
                ellipsis: true
            }
        );

    // Main code block at bottom right.
    const mainCodeX =
        mainX + mainW * 0.64;

    const mainCodeW =
        mainW * 0.31;

    drawLabel(
        doc,
        labels.code,
        mainCodeX,
        y + h * 0.835,
        mainCodeW,
        h * 0.028,
        serifFont
    );

    drawCode(
        doc,
        code,
        mainCodeX,
        y + h * 0.885,
        mainCodeW,
        h * 0.065,
        codeFont,
        {
            boxed: true,
            maxFontSize: h * 0.045,
            minFontSize: h * 0.028
        }
    );

    // Right stub branding.
    doc
        .font(serifFont)
        .fillColor(COLORS.ink)
        .fontSize(h * 0.125)
        .text(
            'RIS',
            stubX + 4,
            y + h * 0.10,
            {
                width: stubW - 8,
                align: 'center',
                lineBreak: false
            }
        );

    doc
        .fontSize(h * 0.072)
        .text(
            'MERIT',
            stubX + 4,
            y + h * 0.235,
            {
                width: stubW - 8,
                align: 'center',
                lineBreak: false
            }
        );

    const stubLineY =
        y + h * 0.365;

    doc
        .save()
        .strokeColor(COLORS.ink)
        .lineWidth(0.65)
        .moveTo(
            stubX + stubW * 0.20,
            stubLineY
        )
        .lineTo(
            stubX + stubW * 0.80,
            stubLineY
        )
        .stroke()
        .restore();

    drawDiamond(
        doc,
        stubX + stubW * 0.50,
        stubLineY,
        2.7,
        COLORS.gold
    );

    drawLabel(
        doc,
        labels.code,
        stubX + stubW * 0.13,
        y + h * 0.46,
        stubW * 0.74,
        h * 0.035,
        serifFont
    );

    drawCode(
        doc,
        code,
        stubX + stubW * 0.09,
        y + h * 0.535,
        stubW * 0.82,
        h * 0.065,
        codeFont,
        {
            boxed: false,
            maxFontSize: h * 0.043,
            minFontSize: h * 0.026
        }
    );

    drawLaurelM(
        doc,
        stubX + stubW * 0.50,
        y + h * 0.79,
        h / 210,
        serifFont
    );

    drawTicketNotches(
        doc,
        x,
        y,
        w,
        h
    );
}

function generateTickets(orders) {
    return new Promise(
        (resolve, reject) => {

            try {
                if (!Array.isArray(orders)) {
                    throw new Error(
                        'generateTickets: orders должен быть массивом'
                    );
                }

                const doc =
                    new PDFDocument({
                        size: 'A4',
                        layout: 'portrait',
                        margin: 0,
                        autoFirstPage: false
                    });

                const buffers = [];

                doc.on(
                    'data',
                    chunk =>
                        buffers.push(chunk)
                );

                doc.on(
                    'end',
                    () =>
                        resolve(
                            Buffer.concat(buffers)
                        )
                );

                doc.on(
                    'error',
                    reject
                );

                const pageWidth =
                    595.28;

                const pageHeight =
                    841.89;

                /*
                 * Новый премиальный билет имеет широкую пропорцию
                 * около 2:1, как в утверждённом макете.
                 * Поэтому печатаем по 2 билета на A4 portrait.
                 * Так текст остаётся крупным и ничего не сжимается.
                 */
                const marginX =
                    24;

                const gapY =
                    28;

                const ticketWidth =
                    pageWidth -
                    marginX * 2;

                const ticketHeight =
                    ticketWidth / 2;

                const gridHeight =
                    ticketHeight * 2 +
                    gapY;

                const marginY =
                    (
                        pageHeight -
                        gridHeight
                    ) / 2;

                const slots = [
                    {
                        x: marginX,
                        y: marginY
                    },
                    {
                        x: marginX,
                        y:
                            marginY +
                            ticketHeight +
                            gapY
                    }
                ];

                const pageCount =
                    Math.ceil(
                        orders.length / 2
                    );

                for (
                    let pageIndex = 0;
                    pageIndex < pageCount;
                    pageIndex++
                ) {
                    doc.addPage({
                        size: 'A4',
                        layout: 'portrait',
                        margin: 0
                    });

                    for (
                        let slotIndex = 0;
                        slotIndex < 2;
                        slotIndex++
                    ) {
                        const order =
                            orders[
                                pageIndex * 2 +
                                slotIndex
                            ];

                        if (!order) {
                            continue;
                        }

                        const slot =
                            slots[slotIndex];

                        drawTicket(
                            doc,
                            order,
                            slot.x,
                            slot.y,
                            ticketWidth,
                            ticketHeight
                        );
                    }
                }

                doc.end();

            } catch (error) {
                reject(error);
            }
        }
    );
}

module.exports = {
    generateTickets
};
