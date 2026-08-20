const pool = require('./db');
const crypto = require('crypto');

class PurchaseError extends Error {
    constructor(message, status = 400, code = 'PURCHASE_ERROR') {
        super(message);
        this.name = 'PurchaseError';
        this.status = status;
        this.code = code;
    }
}

function generateOrderCode() {
    return 'MR-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

async function purchaseReward(studentId, rewardKey) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const rewardResult = await client.query(
            `SELECT id, reward_key, title, description, cost, is_active
             FROM rewards
             WHERE reward_key = $1
               AND is_active = true
             LIMIT 1
             FOR SHARE`,
            [rewardKey]
        );

        if (!rewardResult.rows.length) {
            throw new PurchaseError(
                'Награда не найдена или отключена',
                404,
                'REWARD_NOT_FOUND'
            );
        }

        const reward = rewardResult.rows[0];

        // Не даём двум покупкам одного ученика выполняться одновременно.
        await client.query(
            'SELECT pg_advisory_xact_lock($1::bigint)',
            [studentId]
        );

        let meritResult = await client.query(
            `SELECT id, balance
             FROM merits
             WHERE user_id = $1
             FOR UPDATE`,
            [studentId]
        );

        if (!meritResult.rows.length) {
            meritResult = await client.query(
                `INSERT INTO merits (user_id, balance)
                 VALUES ($1, 0)
                 RETURNING id, balance`,
                [studentId]
            );
        }

        const currentBalance = Number(meritResult.rows[0].balance);

        if (currentBalance < reward.cost) {
            throw new PurchaseError(
                `Не хватает ${reward.cost - currentBalance} мерит.`,
                400,
                'INSUFFICIENT_MERITS'
            );
        }

        const balanceResult = await client.query(
            `UPDATE merits
             SET balance = balance - $1,
                 updated_at = NOW()
             WHERE user_id = $2
               AND balance >= $1
             RETURNING balance`,
            [reward.cost, studentId]
        );

        if (!balanceResult.rows.length) {
            throw new PurchaseError(
                'Недостаточно меритов',
                400,
                'INSUFFICIENT_MERITS'
            );
        }

        const newBalance = Number(balanceResult.rows[0].balance);

        await client.query(
            `INSERT INTO merit_transactions (
                user_id,
                amount,
                reason
             )
             VALUES ($1, $2, $3)`,
            [
                studentId,
                -reward.cost,
                `Покупка: ${reward.title}`
            ]
        );

        const code = generateOrderCode();

        const orderResult = await client.query(
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
                studentId,
                reward.id,
                reward.reward_key,
                reward.title,
                reward.cost,
                code
            ]
        );

        await client.query('COMMIT');

        return {
            order: orderResult.rows[0],
            reward,
            newBalance
        };

    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Purchase rollback error:', rollbackError);
        }
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    purchaseReward,
    PurchaseError
};
