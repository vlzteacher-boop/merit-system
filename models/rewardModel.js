const pool = require('./db');

function localizedSelect(language) {
    const lang = language === 'en' ? 'en' : 'ru';

    return {
        titleColumn: lang === 'en' ? 'title_en' : 'title_ru',
        descriptionColumn:
            lang === 'en' ? 'description_en' : 'description_ru'
    };
}

async function getActiveRewards(language = 'ru') {
    const { titleColumn, descriptionColumn } = localizedSelect(language);

    const res = await pool.query(
        `SELECT
            id,
            reward_key,
            title_ru,
            title_en,
            description_ru,
            description_en,
            COALESCE(${titleColumn}, title_ru, title) AS title,
            COALESCE(${descriptionColumn}, description_ru, description) AS description,
            cost,
            is_active
         FROM rewards
         WHERE is_active = true
         ORDER BY cost, id`
    );

    return res.rows;
}

async function getRewardByKey(rewardKey, language = 'ru') {
    const { titleColumn, descriptionColumn } = localizedSelect(language);

    const res = await pool.query(
        `SELECT
            id,
            reward_key,
            title_ru,
            title_en,
            description_ru,
            description_en,
            COALESCE(${titleColumn}, title_ru, title) AS title,
            COALESCE(${descriptionColumn}, description_ru, description) AS description,
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

async function getRewardById(rewardId, language = 'ru') {
    const { titleColumn, descriptionColumn } = localizedSelect(language);

    const res = await pool.query(
        `SELECT
            id,
            reward_key,
            title_ru,
            title_en,
            description_ru,
            description_en,
            COALESCE(${titleColumn}, title_ru, title) AS title,
            COALESCE(${descriptionColumn}, description_ru, description) AS description,
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
