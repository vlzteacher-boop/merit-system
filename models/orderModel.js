const pool = require('./db');
const crypto = require('crypto');

function generateOrderCode() {
    return 'MR-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

async function createOrder(
    userId,
    rewardId,
    reward = {},
    locale = 'ru'
) {
    const code = generateOrderCode();
    const orderLocale =
        locale === 'en' ? 'en' : 'ru';

    const titleRu =
        reward.titleRu ||
        reward.title_ru ||
        reward.title ||
        null;

    const titleEn =
        reward.titleEn ||
        reward.title_en ||
        titleRu;

    const localizedTitle =
        orderLocale === 'en'
            ? titleEn
            : titleRu;

    const res = await pool.query(
        `INSERT INTO orders (
            user_id,
            reward_id,
            reward_key,
            reward_title,
            reward_title_ru,
            reward_title_en,
            reward_cost,
            locale,
            code,
            status
         )
         VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, 'pending_print'
         )
         RETURNING *`,
        [
            userId,
            rewardId,
            reward.key || reward.reward_key || null,
            localizedTitle,
            titleRu,
            titleEn,
            reward.cost ?? null,
            orderLocale,
            code
        ]
    );

    return res.rows[0];
}

async function getPendingOrdersByClass(classId) {
    const res = await pool.query(
        `SELECT
            o.*,
            u.full_name,
            u.journal_number,
            c.name AS class_name,

            CASE
                WHEN o.locale = 'en'
                    THEN COALESCE(
                        o.reward_title_en,
                        r.title_en,
                        o.reward_title,
                        r.title
                    )
                ELSE COALESCE(
                    o.reward_title_ru,
                    r.title_ru,
                    o.reward_title,
                    r.title
                )
            END AS reward_ticket_text,

            CASE
                WHEN o.locale = 'en'
                    THEN COALESCE(
                        o.reward_title_en,
                        r.title_en,
                        o.reward_title,
                        r.title
                    )
                ELSE COALESCE(
                    o.reward_title_ru,
                    r.title_ru,
                    o.reward_title,
                    r.title
                )
            END AS reward_name

         FROM orders o
         JOIN users u ON o.user_id = u.id
         LEFT JOIN classes c ON c.id = u.class_id
         LEFT JOIN rewards r ON r.id = o.reward_id
         WHERE u.class_id = $1
           AND o.status = 'pending_print'
         ORDER BY o.created_at`,
        [classId]
    );

    return res.rows;
}


async function getOpenOrdersByClass(classId) {
    const res = await pool.query(
        `SELECT
            o.*,
            u.full_name,
            u.journal_number,
            c.name AS class_name,

            CASE
                WHEN o.locale = 'en'
                    THEN COALESCE(
                        o.reward_title_en,
                        r.title_en,
                        o.reward_title,
                        r.title
                    )
                ELSE COALESCE(
                    o.reward_title_ru,
                    r.title_ru,
                    o.reward_title,
                    r.title
                )
            END AS reward_ticket_text

         FROM orders o
         JOIN users u ON o.user_id = u.id
         LEFT JOIN classes c ON c.id = u.class_id
         LEFT JOIN rewards r ON r.id = o.reward_id
         WHERE u.class_id = $1
           AND o.status IN ('pending_print', 'printed')
         ORDER BY o.created_at`,
        [classId]
    );

    return res.rows;
}

async function getOrdersByUser(userId, language = 'ru') {
    const locale =
        language === 'en' ? 'en' : 'ru';

    const res = await pool.query(
        `SELECT
            o.*,
            CASE
                WHEN $2::text = 'en'
                    THEN COALESCE(
                        o.reward_title_en,
                        r.title_en,
                        o.reward_title,
                        r.title
                    )
                ELSE COALESCE(
                    o.reward_title_ru,
                    r.title_ru,
                    o.reward_title,
                    r.title
                )
            END AS display_reward_title
         FROM orders o
         LEFT JOIN rewards r ON r.id = o.reward_id
         WHERE o.user_id = $1
         ORDER BY o.created_at DESC`,
        [userId, locale]
    );

    return res.rows;
}

async function getOrderById(orderId) {
    const res = await pool.query(
        `SELECT *
         FROM orders
         WHERE id = $1`,
        [orderId]
    );

    return res.rows[0];
}

async function getOrderForClass(orderId, classId) {
    const res = await pool.query(
        `SELECT o.*
         FROM orders o
         JOIN users u ON u.id = o.user_id
         WHERE o.id = $1
           AND u.class_id = $2
         LIMIT 1`,
        [orderId, classId]
    );

    return res.rows[0];
}

async function getOrderByCode(code) {
    const res = await pool.query(
        `SELECT *
         FROM orders
         WHERE code = $1`,
        [code]
    );

    return res.rows[0];
}

async function updateOrderStatus(orderId, status) {
    const allowed =
        ['pending_print', 'printed', 'issued', 'used', 'void'];

    if (!allowed.includes(status)) {
        throw new Error('Invalid order status');
    }

    const res = await pool.query(
        `UPDATE orders
         SET
            status = $1::varchar,
            printed_at =
                CASE
                    WHEN $1::varchar = 'printed'
                    THEN NOW()
                    ELSE printed_at
                END,
            issued_at =
                CASE
                    WHEN $1::varchar = 'issued'
                    THEN NOW()
                    ELSE issued_at
                END,
            used_at =
                CASE
                    WHEN $1::varchar = 'used'
                    THEN NOW()
                    ELSE used_at
                END
         WHERE id = $2
         RETURNING *`,
        [status, orderId]
    );

    return res.rows[0];
}

async function voidOrder(orderId) {
    await updateOrderStatus(orderId, 'void');
}

module.exports = {
    createOrder,
    getPendingOrdersByClass,
    getOpenOrdersByClass,
    getOrdersByUser,
    getOrderById,
    getOrderForClass,
    getOrderByCode,
    updateOrderStatus,
    voidOrder
};
