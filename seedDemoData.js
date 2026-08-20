/**
 * DEMO SEED
 *
 * Добавляет демонстрационные классы и учеников.
 *
 * Запуск из корня проекта:
 *
 *   node seedDemoData.js
 *
 * PIN всех созданных учеников:
 *
 *   1234
 *
 * Скрипт НЕ удаляет существующих пользователей.
 */

require('dotenv').config();

const bcrypt = require('bcrypt');
const pool = require('./models/db');

const DEMO_PIN = '1234';

const demoClasses = [
    {
        name: '5А',
        students: [
            'Александр Козлов',
            'София Морозова',
            'Максим Лебедев',
            'Анна Волкова',
            'Дмитрий Соколов',
            'Полина Орлова',
            'Илья Егоров',
            'Мария Новикова'
        ]
    },
    {
        name: '5Б',
        students: [
            'Артём Павлов',
            'Ева Воробьёва',
            'Михаил Фёдоров',
            'Виктория Белова',
            'Кирилл Семёнов',
            'Дарья Алексеева',
            'Никита Романов',
            'Алиса Макарова'
        ]
    },
    {
        name: '6А',
        students: [
            'Матвей Захаров',
            'Ксения Крылова',
            'Роман Данилов',
            'Варвара Андреева',
            'Тимофей Комаров',
            'Елизавета Никитина',
            'Глеб Тарасов',
            'Арина Фролова'
        ]
    },
    {
        name: '6Б',
        students: [
            'Степан Жуков',
            'Милана Кузнецова',
            'Фёдор Баранов',
            'Вероника Гусева',
            'Денис Власов',
            'Ульяна Куликова',
            'Ярослав Фомин',
            'Валерия Титова'
        ]
    },
    {
        name: '7А',
        students: [
            'Егор Михайлов',
            'Анастасия Попова',
            'Лев Киселёв',
            'Александра Медведева',
            'Иван Осипов',
            'Диана Соловьёва',
            'Арсений Громов',
            'Екатерина Филиппова'
        ]
    },
    {
        name: '7Б',
        students: [
            'Марк Давыдов',
            'Таисия Миронова',
            'Семён Калинин',
            'Василиса Наумова',
            'Павел Королёв',
            'Ольга Маслова',
            'Константин Кудрявцев',
            'Маргарита Ильина'
        ]
    },
    {
        name: '8А',
        students: [
            'Андрей Белов',
            'Кристина Сафонова',
            'Владислав Чернов',
            'Надежда Гаврилова',
            'Богдан Ершов',
            'Светлана Щербакова',
            'Руслан Борисов',
            'Злата Ларионова'
        ]
    },
    {
        name: '8Б',
        students: [
            'Георгий Антонов',
            'Алина Демидова',
            'Сергей Матвеев',
            'Любовь Тихонова',
            'Вадим Котов',
            'Юлия Зайцева',
            'Олег Быков',
            'Нина Панова'
        ]
    }
];


async function getOrCreateClass(client, className) {
    const existing = await client.query(
        'SELECT id FROM classes WHERE name = $1 LIMIT 1',
        [className]
    );

    if (existing.rows.length > 0) {
        return existing.rows[0].id;
    }

    const inserted = await client.query(
        `INSERT INTO classes (name)
         VALUES ($1)
         RETURNING id`,
        [className]
    );

    return inserted.rows[0].id;
}


async function studentExists(
    client,
    classId,
    journalNumber
) {
    const result = await client.query(
        `SELECT id
         FROM users
         WHERE class_id = $1
           AND journal_number = $2
           AND role = 'student'
         LIMIT 1`,
        [classId, journalNumber]
    );

    return result.rows.length > 0;
}


async function seed() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const pinHash =
            await bcrypt.hash(
                DEMO_PIN,
                10
            );

        let classesCreated = 0;
        let studentsCreated = 0;
        let studentsSkipped = 0;

        for (const classItem of demoClasses) {

            const before = await client.query(
                'SELECT id FROM classes WHERE name = $1 LIMIT 1',
                [classItem.name]
            );

            const classId =
                await getOrCreateClass(
                    client,
                    classItem.name
                );

            if (before.rows.length === 0) {
                classesCreated++;
            }

            for (
                let index = 0;
                index < classItem.students.length;
                index++
            ) {
                const journalNumber =
                    index + 1;

                if (
                    await studentExists(
                        client,
                        classId,
                        journalNumber
                    )
                ) {
                    studentsSkipped++;
                    continue;
                }

                await client.query(
                    `INSERT INTO users (
                        full_name,
                        email,
                        class_id,
                        journal_number,
                        pin_hash,
                        password_hash,
                        role
                     )
                     VALUES (
                        $1,
                        NULL,
                        $2,
                        $3,
                        $4,
                        NULL,
                        'student'
                     )`,
                    [
                        classItem.students[index],
                        classId,
                        journalNumber,
                        pinHash
                    ]
                );

                studentsCreated++;
            }
        }

        await client.query('COMMIT');

        console.log('=====================================');
        console.log('DEMO DATA READY');
        console.log('=====================================');
        console.log('Создано классов:', classesCreated);
        console.log('Создано учеников:', studentsCreated);
        console.log('Пропущено существующих:', studentsSkipped);
        console.log('PIN учеников:', DEMO_PIN);
        console.log('=====================================');

    } catch (error) {
        await client.query('ROLLBACK');

        console.error(
            'Ошибка заполнения базы:',
            error
        );

        process.exitCode = 1;

    } finally {
        client.release();
        await pool.end();
    }
}


seed();
