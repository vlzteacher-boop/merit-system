-- 1) Разрешить роль teacher
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('student', 'curator', 'admin', 'teacher'));

-- 2) Поля для конкретной купленной награды
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS reward_key VARCHAR(80);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS reward_title VARCHAR(180);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS reward_cost INTEGER;

-- Старые заказы
UPDATE orders
SET
    reward_key = COALESCE(reward_key, 'no_uniform'),
    reward_title = COALESCE(reward_title, 'День без школьной формы'),
    reward_cost = COALESCE(reward_cost, 10)
WHERE reward_id = 1;
