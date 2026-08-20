const pool = require('./db');


// ============================================================
// ВСЕ АКТИВНЫЕ НАГРАДЫ
// ============================================================

async function getActiveRewards() {
    const res = await pool.query(
        `SELECT
            id,
            reward_key,
            title,
            description,
            cost,
            is_active
         FROM rewards
         WHERE is_active = true
         ORDER BY id`
    );

    return res.rows;
}


// ============================================================
// НАГРАДА ПО КЛЮЧУ
// ============================================================

async function getRewardByKey(rewardKey) {
    const res = await pool.query(
        `SELECT
            id,
            reward_key,
            title,
            description,
            cost,
            is_active
         FROM rewards
         WHERE reward_key = $1
           AND is_active = true
         LIMIT 1`,
        [rewardKey]
    );

    return res.rows[0];
}


// ============================================================
// НАГРАДА ПО ID
// ============================================================

async function getRewardById(rewardId) {
    const res = await pool.query(
        `SELECT
            id,
            reward_key,
            title,
            description,
            cost,
            is_active
         FROM rewards
         WHERE id = $1
         LIMIT 1`,
        [rewardId]
    );

    return res.rows[0];
}


module.exports = {
    getActiveRewards,
    getRewardByKey,
    getRewardById
};
