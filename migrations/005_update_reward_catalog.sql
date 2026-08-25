BEGIN;

-- ============================================================
-- UPDATED RIS REWARD CATALOG
--
-- Historic orders are safe because orders stores snapshot fields:
-- reward_title / reward_title_ru / reward_title_en / reward_cost.
-- This migration changes the live shop catalog only.
-- ============================================================

-- Free old keys before reusing IDs 1..6.
UPDATE rewards
SET reward_key = NULL
WHERE id BETWEEN 1 AND 6;


INSERT INTO rewards (
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
)
VALUES

(
    1,
    'no_tie',
    'День без галстука',
    'Один учебный день без галстука.',
    'День без галстука',
    'No Tie Day',
    'Один учебный день можно прийти в школу без галстука.',
    'One school day without wearing a tie.',
    10,
    true
),

(
    2,
    'no_uniform',
    'День без формы',
    'Один учебный день без школьной формы.',
    'День без формы',
    'No Uniform Day',
    'Один учебный день можно прийти в школу без школьной формы.',
    'One school day without wearing the school uniform.',
    25,
    true
),

(
    3,
    'canteen_priority_week',
    'Без очереди в столовой — неделя',
    'Возможность проходить в столовую без очереди в течение одной учебной недели.',
    'Без очереди в столовой — неделя',
    'Skip the Canteen Line for a Week',
    'В течение одной учебной недели ученик может проходить в школьную столовую без очереди.',
    'For one school week, the student may skip the canteen line.',
    50,
    true
),

(
    4,
    'homework_skip_x2_restricted',
    'Не выполнять домашнее задание ×2',
    'Два пропуска домашнего задания по разным предметам с ограничениями.',
    'Не выполнять домашнее задание ×2',
    'Homework Skip ×2',
    'Можно два раза не выполнять домашнее задание, но каждый пропуск должен быть использован для разного предмета. Например: история и литература — можно; история и история — нельзя. Нельзя использовать для математики, русского языка, английского языка и Math (математики на английском языке).',
    'Two homework skips, and each skip must be used for a different subject. For example, History + Literature is allowed; History + History is not. The reward cannot be used for Mathematics, Russian, English, or Math taught in English.',
    75,
    true
),

(
    5,
    'homework_skip_x2_merch',
    'Домашнее задание ×2 + мерч RIS',
    'Два пропуска домашнего задания по разным предметам с ограничениями + брендированный мерч RIS.',
    'Домашнее задание ×2 + мерч RIS',
    'Homework Skip ×2 + RIS Merch',
    'Можно два раза не выполнять домашнее задание, но каждый пропуск должен быть использован для разного предмета. Например: история и литература — можно; история и история — нельзя. Нельзя использовать для математики, русского языка, английского языка и Math (математики на английском языке). Дополнительно ученик получает брендированный мерч RIS: блокнот, ручку, футболку, толстовку или другой доступный предмет.',
    'Two homework skips, and each skip must be used for a different subject. For example, History + Literature is allowed; History + History is not. The reward cannot be used for Mathematics, Russian, English, or Math taught in English. The student also receives available RIS-branded merchandise such as a notebook, pen, T-shirt, hoodie, or another item.',
    150,
    true
),

(
    6,
    'ris_branded_gift_box',
    'Подарочный брендированный бокс RIS',
    'Подарочный брендированный бокс RIS.',
    'Подарочный брендированный бокс RIS',
    'RIS Branded Gift Box',
    'Подарочный брендированный бокс RIS.',
    'A branded RIS gift box.',
    185,
    true
)

ON CONFLICT (id) DO UPDATE
SET
    reward_key = EXCLUDED.reward_key,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    title_ru = EXCLUDED.title_ru,
    title_en = EXCLUDED.title_en,
    description_ru = EXCLUDED.description_ru,
    description_en = EXCLUDED.description_en,
    cost = EXCLUDED.cost,
    is_active = EXCLUDED.is_active;


-- Disable any other legacy rewards so they do not appear in the shop.
UPDATE rewards
SET is_active = false
WHERE id NOT IN (1, 2, 3, 4, 5, 6);


SELECT setval(
    'rewards_id_seq',
    GREATEST(
        (SELECT COALESCE(MAX(id), 1) FROM rewards),
        6
    ),
    true
);

COMMIT;


-- Verification
SELECT
    id,
    reward_key,
    title_ru,
    title_en,
    cost,
    is_active
FROM rewards
ORDER BY id;
