-- ============================================================
-- MERIT EARNING STATISTICS
--
-- Источником статистики служит merit_transactions.
-- Положительные amount = заработанные мериты.
-- Отрицательные amount = траты и НЕ уменьшают earned totals.
-- ============================================================

ALTER TABLE merit_transactions
ADD COLUMN IF NOT EXISTS created_at
    TIMESTAMP WITHOUT TIME ZONE
    DEFAULT NOW();

CREATE INDEX IF NOT EXISTS
    merit_transactions_user_created_at_idx
ON merit_transactions (
    user_id,
    created_at
);

CREATE INDEX IF NOT EXISTS
    merit_transactions_positive_user_created_at_idx
ON merit_transactions (
    user_id,
    created_at
)
WHERE amount > 0;
