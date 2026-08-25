const pool = require('./db');
const bcrypt = require('bcrypt');

async function getUserByClassAndNumber(classId, journalNumber) {
    const res = await pool.query(
        `SELECT
            u.*,
            c.name AS class_name
         FROM users u
         JOIN classes c ON c.id = u.class_id
         WHERE u.class_id = $1
           AND u.journal_number = $2
           AND u.role = 'student'`,
        [classId, journalNumber]
    );

    return res.rows[0];
}

async function getUserByEmail(email) {
    const res = await pool.query(
        `SELECT *
         FROM users
         WHERE LOWER(email) = LOWER($1)`,
        [email]
    );

    return res.rows[0];
}

async function verifyPin(userId, pin) {
    const res = await pool.query(
        `SELECT pin_hash
         FROM users
         WHERE id = $1`,
        [userId]
    );

    if (!res.rows.length || !res.rows[0].pin_hash) {
        return false;
    }

    return bcrypt.compare(String(pin), res.rows[0].pin_hash);
}

async function updatePin(userId, newPin) {
    const hash = await bcrypt.hash(String(newPin), 10);

    await pool.query(
        `UPDATE users
         SET pin_hash = $1
         WHERE id = $2`,
        [hash, userId]
    );
}

async function getClasses() {
    const res = await pool.query(
        `SELECT id, name
         FROM classes
         ORDER BY
            CASE
                WHEN name ~ '^[0-9]+'
                    THEN (regexp_match(name, '^[0-9]+'))[1]::int
                ELSE 999
            END,
            name`
    );

    return res.rows;
}

async function getStudentsByClass(classId) {
    const res = await pool.query(
        `SELECT
            u.id,
            u.full_name,
            u.journal_number,
            u.class_id,
            c.name AS class_name
         FROM users u
         JOIN classes c ON c.id = u.class_id
         WHERE u.class_id = $1
           AND u.role = 'student'
         ORDER BY u.journal_number, u.full_name`,
        [classId]
    );

    return res.rows;
}

async function getAllStudentsWithClass() {
    const res = await pool.query(
        `SELECT
            u.id,
            u.full_name,
            u.journal_number,
            u.class_id,
            c.name AS class_name
         FROM users u
         JOIN classes c ON c.id = u.class_id
         WHERE u.role = 'student'
         ORDER BY c.name, u.journal_number, u.full_name`
    );

    return res.rows;
}

async function getCuratorClasses(curatorId) {
    const res = await pool.query(
        `SELECT
            c.id,
            c.name
         FROM curator_classes cc
         JOIN classes c ON c.id = cc.class_id
         WHERE cc.curator_id = $1
         ORDER BY
            CASE
                WHEN c.name ~ '^[0-9]+'
                    THEN (regexp_match(c.name, '^[0-9]+'))[1]::int
                ELSE 999
            END,
            c.name`,
        [curatorId]
    );

    return res.rows;
}

async function curatorHasClass(curatorId, classId) {
    const res = await pool.query(
        `SELECT 1
         FROM curator_classes
         WHERE curator_id = $1
           AND class_id = $2
         LIMIT 1`,
        [curatorId, classId]
    );

    return res.rows.length > 0;
}

module.exports = {
    getUserByClassAndNumber,
    getUserByEmail,
    verifyPin,
    updatePin,
    getClasses,
    getStudentsByClass,
    getAllStudentsWithClass,
    getCuratorClasses,
    curatorHasClass
};
