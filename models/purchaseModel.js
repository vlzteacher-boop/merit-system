const pool = require('./db');
const crypto = require('crypto');

class PurchaseError extends Error {
    constructor(code, status = 400, meta = {}) {
        super(code);
        this.name = 'PurchaseError';
        this.code = code;
        this.status = status;
        this.meta = meta;
    }
}

function generateOrderCode() {
    return 'MR-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

async function purchaseReward(studentId, rewardKey, language = 'ru') {
    const locale = language === 'en' ? 'en' : 'ru';
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const rewardResult = await client.query(
            `SELECT
                id,
                reward_key,
                title,
                description,
                title_ru,
                title_en,
                description_ru,
                description_en,
                cost,
                is_active
             FROM rewards
             WHERE reward_key = $1
               AND is_active = true
             LIMIT 1
             FOR SHARE`,
            [rewardKey]
        );

        if (!rewardResult.rows.length) {
            throw new PurchaseError(
                'REWARD_NOT_FOUND',
                404
            );
        }

        const reward = rewardResult.rows[0];
        const localizedTitle =
            locale === 'en'
                ? (reward.title_en || reward.title_ru || reward.title)
                : (reward.title_ru || reward.title || reward.title_en);

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

        const currentBalance =
            Number(meritResult.rows[0].balance);

        if (currentBalance < reward.cost) {
            throw new PurchaseError(
                'INSUFFICIENT_MERITS',
                400,
                {
                    missing:
                        Number(reward.cost) -
                        currentBalance
                }
            );
        }

        const balanceResult = await client.query(
            `UPDATE merits
             SET
                balance = balance - $1,
                updated_at = NOW()
             WHERE user_id = $2
               AND balance >= $1
             RETURNING balance`,
            [
                reward.cost,
                studentId
            ]
        );

        if (!balanceResult.rows.length) {
            throw new PurchaseError(
                'INSUFFICIENT_MERITS',
                400,
                { missing: reward.cost }
            );
        }

        const newBalance =
            Number(balanceResult.rows[0].balance);

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
                locale === 'en'
                    ? `Purchase: ${localizedTitle}`
                    : `Покупка: ${localizedTitle}`
            ]
        );

        const code = generateOrderCode();

        const orderResult = await client.query(
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
                studentId,
                reward.id,
                reward.reward_key,
                localizedTitle,
                reward.title_ru || reward.title,
                reward.title_en || reward.title_ru || reward.title,
                reward.cost,
                locale,
                code
            ]
        );

        await client.query('COMMIT');

        return {
            order: orderResult.rows[0],
            reward: {
                ...reward,
                title: localizedTitle
            },
            newBalance
        };

    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error(
                'Purchase rollback error:',
                rollbackError
            );
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
