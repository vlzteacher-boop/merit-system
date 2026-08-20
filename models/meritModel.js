const pool = require('./db');

async function getBalance(userId) {
    const res = await pool.query('SELECT balance FROM merits WHERE user_id = $1', [userId]);
    if (res.rows.length === 0) {
        await pool.query('INSERT INTO merits (user_id, balance) VALUES ($1, 0)', [userId]);
        return 0;
    }
    return res.rows[0].balance;
}

async function addMerits(userId, amount, reason, curatorId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Проверяем, есть ли запись, если нет — вставляем
        const check = await client.query('SELECT id FROM merits WHERE user_id = $1', [userId]);
        if (check.rows.length === 0) {
            await client.query('INSERT INTO merits (user_id, balance) VALUES ($1, 0)', [userId]);
        }
        const update = await client.query(
            `UPDATE merits SET balance = balance + $1, updated_at = NOW() 
             WHERE user_id = $2 RETURNING balance`,
            [amount, userId]
        );
        await client.query(
            `INSERT INTO merit_transactions (user_id, amount, reason, curator_id) 
             VALUES ($1, $2, $3, $4)`,
            [userId, amount, reason, curatorId]
        );
        await client.query('COMMIT');
        return update.rows[0].balance;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

async function spendMerits(userId, amount, reason) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Проверяем, есть ли запись, если нет — вставляем
        const check = await client.query('SELECT id FROM merits WHERE user_id = $1', [userId]);
        if (check.rows.length === 0) {
            await client.query('INSERT INTO merits (user_id, balance) VALUES ($1, 0)', [userId]);
        }
        const res = await client.query(
            `UPDATE merits SET balance = balance - $1, updated_at = NOW() 
             WHERE user_id = $2 AND balance >= $1 RETURNING balance`,
            [amount, userId]
        );
        if (res.rows.length === 0) {
            throw new Error('Insufficient merits or user not found');
        }
        await client.query(
            `INSERT INTO merit_transactions (user_id, amount, reason) 
             VALUES ($1, $2, $3)`,
            [userId, -amount, reason]
        );
        await client.query('COMMIT');
        return res.rows[0].balance;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

module.exports = {
    getBalance,
    addMerits,
    spendMerits,
};