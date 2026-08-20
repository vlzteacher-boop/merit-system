const pool = require('./db');
const crypto = require('crypto');

function generateOrderCode() {
    return 'MR-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function createOrder(userId, rewardId, reward = {}) {
    const code = generateOrderCode();

    const res = await pool.query(
        `INSERT INTO orders (
            user_id,
            reward_id,
            reward_key,
            reward_title,
            reward_cost,
            code,
            status
         )
         VALUES ($1, $2, $3, $4, $5, $6, 'pending_print')
         RETURNING *`,
        [
            userId,
            rewardId,
            reward.key || null,
            reward.title || null,
            reward.cost ?? null,
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
            o.reward_title AS reason,
            o.reward_title AS reward_name,
            o.reward_title AS reward_ticket_text
         FROM orders o
         JOIN users u ON o.user_id = u.id
         LEFT JOIN classes c ON c.id = u.class_id
         WHERE u.class_id = $1
           AND o.status = 'pending_print'
         ORDER BY o.created_at`,
        [classId]
    );

    return res.rows;
}

async function getOrdersByUser(userId) {
    const res = await pool.query(
        `SELECT *
         FROM orders
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
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
    const res = await pool.query(
        `UPDATE orders
         SET
            status = $1::varchar,
            printed_at = CASE WHEN $1::varchar = 'printed' THEN NOW() ELSE printed_at END,
            issued_at  = CASE WHEN $1::varchar = 'issued'  THEN NOW() ELSE issued_at  END,
            used_at    = CASE WHEN $1::varchar = 'used'    THEN NOW() ELSE used_at    END
         WHERE id = $2
         RETURNING *`,
        [status, orderId]
    );
    return res.rows[0];
}

async function voidOrder(orderId) {
    await pool.query(
        `UPDATE orders
         SET status = 'void'
         WHERE id = $1`,
        [orderId]
    );
}

module.exports = {
    createOrder,
    getPendingOrdersByClass,
    getOrdersByUser,
    getOrderById,
    getOrderByCode,
    updateOrderStatus,
    voidOrder
};
