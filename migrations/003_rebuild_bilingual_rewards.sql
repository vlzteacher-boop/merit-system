BEGIN;

-- ============================================================
-- 1. ROLES
-- ============================================================

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (
    role IN (
        'student',
        'curator',
        'teacher',
        'admin'
    )
);


-- ============================================================
-- 2. COLUMNS NEEDED FOR BILINGUAL REWARDS / ORDER SNAPSHOTS
-- ============================================================

ALTER TABLE rewards
    ADD COLUMN IF NOT EXISTS reward_key VARCHAR(80);

ALTER TABLE rewards
    ADD COLUMN IF NOT EXISTS title_ru VARCHAR(255);

ALTER TABLE rewards
    ADD COLUMN IF NOT EXISTS title_en VARCHAR(255);

ALTER TABLE rewards
    ADD COLUMN IF NOT EXISTS description_ru TEXT;

ALTER TABLE rewards
    ADD COLUMN IF NOT EXISTS description_en TEXT;


ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS reward_key VARCHAR(80);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS reward_title VARCHAR(255);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS reward_title_ru VARCHAR(255);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS reward_title_en VARCHAR(255);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS reward_cost INTEGER;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS locale VARCHAR(2);


-- ============================================================
-- 3. PRESERVE HISTORIC ORDER MEANING BEFORE REPLACING CATALOG
-- ============================================================
--
-- This is intentionally done BEFORE IDs 1..6 are redefined.
-- Old projects often used reward_id=1 for "No Uniform Day".
-- We snapshot the old title/cost first so historic orders do not
-- suddenly become "No Tie Day".
-- ============================================================

UPDATE orders o
SET
    reward_key =
        COALESCE(
            o.reward_key,
            r.reward_key
        ),

    reward_title =
        COALESCE(
            o.reward_title,
            r.title
        ),

    reward_cost =
        COALESCE(
            o.reward_cost,
            r.cost
        ),

    locale =
        COALESCE(
            NULLIF(o.locale, ''),
            'ru'
        )

FROM rewards r
WHERE r.id = o.reward_id;


UPDATE orders
SET
    reward_title_ru =
        COALESCE(
            reward_title_ru,
            reward_title
        ),

    reward_title_en =
        COALESCE(
            reward_title_en,
            reward_title
        ),

    locale =
        CASE
            WHEN locale IN ('ru', 'en')
                THEN locale
            ELSE 'ru'
        END;


-- ============================================================
-- 4. INSTALL THE NEW SIX-REWARD CATALOG
-- ============================================================

-- Free old keys so previous catalog versions cannot conflict with
-- the new stable keys.
UPDATE rewards
SET reward_key = NULL;


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


-- Do not delete old reward rows: historic orders can still have an FK
-- to them. They simply disappear from the active shop.
UPDATE rewards
SET is_active = false
WHERE id > 6;


CREATE UNIQUE INDEX IF NOT EXISTS
    rewards_reward_key_uidx
ON rewards (reward_key)
WHERE reward_key IS NOT NULL;


SELECT setval(
    'rewards_id_seq',
    GREATEST(
        (
            SELECT
                COALESCE(
                    MAX(id),
                    1
                )
            FROM rewards
        ),
        1
    )
);


-- ============================================================
-- 5. CURATOR -> MULTIPLE CLASSES
-- ============================================================

CREATE TABLE IF NOT EXISTS curator_classes (
    curator_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),

    CONSTRAINT curator_classes_pkey
        PRIMARY KEY (
            curator_id,
            class_id
        ),

    CONSTRAINT curator_classes_curator_id_fkey
        FOREIGN KEY (curator_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT curator_classes_class_id_fkey
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON DELETE CASCADE
);


INSERT INTO curator_classes (
    curator_id,
    class_id
)
SELECT
    id,
    class_id
FROM users
WHERE role = 'curator'
  AND class_id IS NOT NULL
ON CONFLICT DO NOTHING;


COMMIT;


-- ============================================================
-- CHECKS
-- ============================================================

SELECT
    id,
    reward_key,
    title_ru,
    title_en,
    cost,
    is_active
FROM rewards
ORDER BY id;


SELECT
    curator_id,
    class_id
FROM curator_classes
ORDER BY curator_id, class_id;
