-- ============================================================
-- MERIT SHOP
-- Добавляем снимок купленной награды непосредственно в orders.
--
-- Безопасно выполнять повторно благодаря IF NOT EXISTS.
-- ============================================================

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS reward_key VARCHAR(80);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS reward_title VARCHAR(180);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS reward_cost INTEGER;


-- Старые заказы reward_id = 1 считаем "Днём без формы".
UPDATE orders
SET
    reward_key =
        COALESCE(
            reward_key,
            'no_uniform'
        ),

    reward_title =
        COALESCE(
            reward_title,
            'День без школьной формы'
        ),

    reward_cost =
        COALESCE(
            reward_cost,
            10
        )

WHERE reward_id = 1;


-- Не разрешаем отрицательную цену в новых строках.
-- Если constraint уже существует, блок просто ничего не делает.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname =
            'orders_reward_cost_nonnegative'
    ) THEN
        ALTER TABLE orders
        ADD CONSTRAINT
            orders_reward_cost_nonnegative
        CHECK (
            reward_cost IS NULL
            OR reward_cost >= 0
        );
    END IF;
END
$$;
