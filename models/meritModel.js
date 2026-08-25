const pool = require('./db');

async function getBalance(userId) {
    const res = await pool.query(
        `SELECT balance
         FROM merits
         WHERE user_id = $1`,
        [userId]
    );

    if (res.rows.length) {
        return Number(res.rows[0].balance);
    }

    try {
        const inserted = await pool.query(
            `INSERT INTO merits (
                user_id,
                balance
             )
             VALUES ($1, 0)
             RETURNING balance`,
            [userId]
        );

        return Number(inserted.rows[0].balance);

    } catch (error) {
        // На случай параллельного создания строки другим запросом.
        if (error.code === '23505') {
            const retry = await pool.query(
                `SELECT balance
                 FROM merits
                 WHERE user_id = $1`,
                [userId]
            );

            return retry.rows.length
                ? Number(retry.rows[0].balance)
                : 0;
        }

        throw error;
    }
}

async function addMerits(
    userId,
    amount,
    reason,
    awardedByUserId
) {
    const client =
        await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(
            'SELECT pg_advisory_xact_lock($1::bigint)',
            [userId]
        );

        let merit =
            await client.query(
                `SELECT id
                 FROM merits
                 WHERE user_id = $1
                 FOR UPDATE`,
                [userId]
            );

        if (!merit.rows.length) {
            await client.query(
                `INSERT INTO merits (
                    user_id,
                    balance
                 )
                 VALUES ($1, 0)`,
                [userId]
            );
        }

        const update =
            await client.query(
                `UPDATE merits
                 SET
                    balance = balance + $1,
                    updated_at = NOW()
                 WHERE user_id = $2
                 RETURNING balance`,
                [
                    amount,
                    userId
                ]
            );

        await client.query(
            `INSERT INTO merit_transactions (
                user_id,
                amount,
                reason,
                curator_id
             )
             VALUES ($1, $2, $3, $4)`,
            [
                userId,
                amount,
                reason,
                awardedByUserId
            ]
        );

        await client.query('COMMIT');

        return Number(
            update.rows[0].balance
        );

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;

    } finally {
        client.release();
    }
}

/*
 * Оставлено для совместимости с возможными старыми вызовами.
 * Покупка наград через /api/buy эту функцию НЕ использует:
 * там списание + transaction + order выполняются атомарно
 * в purchaseModel.js.
 */
async function spendMerits(
    userId,
    amount,
    reason
) {
    const client =
        await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(
            'SELECT pg_advisory_xact_lock($1::bigint)',
            [userId]
        );

        const update =
            await client.query(
                `UPDATE merits
                 SET
                    balance = balance - $1,
                    updated_at = NOW()
                 WHERE user_id = $2
                   AND balance >= $1
                 RETURNING balance`,
                [
                    amount,
                    userId
                ]
            );

        if (!update.rows.length) {
            throw new Error(
                'Insufficient merits or user not found'
            );
        }

        await client.query(
            `INSERT INTO merit_transactions (
                user_id,
                amount,
                reason
             )
             VALUES ($1, $2, $3)`,
            [
                userId,
                -amount,
                reason
            ]
        );

        await client.query('COMMIT');

        return Number(
            update.rows[0].balance
        );

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;

    } finally {
        client.release();
    }
}


// ============================================================
// СТАТИСТИКА ЗАРАБОТАННЫХ МЕРИТОВ ПО КЛАССУ
//
// ВАЖНО:
// - учитываются только положительные merit_transactions.amount;
// - покупки имеют отрицательный amount и не уменьшают earned_*;
// - поэтому earned_* показывает именно сколько ученик ЗАРАБОТАЛ,
//   независимо от того, сколько он уже потратил.
// ============================================================

async function getEarningStatsByClass(
    classId,
    {
        quarters,
        academicYearStart,
        academicYearEnd
    }
) {
    const [q1, q2, q3, q4] =
        quarters;

    const res = await pool.query(
        `SELECT
            u.id AS user_id,

            COALESCE(
                SUM(mt.amount)
                FILTER (WHERE mt.amount > 0),
                0
            )::integer AS earned_all_time,

            COALESCE(
                SUM(mt.amount)
                FILTER (
                    WHERE mt.amount > 0
                      AND mt.created_at >= $2
                      AND mt.created_at < $3
                ),
                0
            )::integer AS earned_q1,

            COALESCE(
                SUM(mt.amount)
                FILTER (
                    WHERE mt.amount > 0
                      AND mt.created_at >= $4
                      AND mt.created_at < $5
                ),
                0
            )::integer AS earned_q2,

            COALESCE(
                SUM(mt.amount)
                FILTER (
                    WHERE mt.amount > 0
                      AND mt.created_at >= $6
                      AND mt.created_at < $7
                ),
                0
            )::integer AS earned_q3,

            COALESCE(
                SUM(mt.amount)
                FILTER (
                    WHERE mt.amount > 0
                      AND mt.created_at >= $8
                      AND mt.created_at < $9
                ),
                0
            )::integer AS earned_q4,

            COALESCE(
                SUM(mt.amount)
                FILTER (
                    WHERE mt.amount > 0
                      AND mt.created_at >= $10
                      AND mt.created_at < $11
                ),
                0
            )::integer AS earned_academic_year

         FROM users u

         LEFT JOIN merit_transactions mt
           ON mt.user_id = u.id

         WHERE u.class_id = $1
           AND u.role = 'student'

         GROUP BY u.id`,
        [
            classId,

            q1.start,
            q1.end,

            q2.start,
            q2.end,

            q3.start,
            q3.end,

            q4.start,
            q4.end,

            academicYearStart,
            academicYearEnd
        ]
    );

    const statsByUserId =
        new Map();

    for (const row of res.rows) {

        statsByUserId.set(
            Number(row.user_id),
            {
                earnedQ1:
                    Number(row.earned_q1),

                earnedQ2:
                    Number(row.earned_q2),

                earnedQ3:
                    Number(row.earned_q3),

                earnedQ4:
                    Number(row.earned_q4),

                earnedAcademicYear:
                    Number(row.earned_academic_year),

                earnedAllTime:
                    Number(row.earned_all_time)
            }
        );

    }

    return statsByUserId;
}


module.exports = {
    getBalance,
    addMerits,
    spendMerits,
    getEarningStatsByClass
};
