BEGIN;

-- ============================================================
-- FIX HOMEWORK REWARD RULES
--
-- Correct interpretation:
-- - each homework skip must be used for a DIFFERENT subject;
-- - History + Literature = allowed;
-- - History + History = not allowed;
-- - Math means mathematics taught in English.
-- ============================================================

UPDATE rewards
SET
    description_ru =
        'Можно два раза не выполнять домашнее задание, но каждый пропуск должен быть использован для разного предмета. Например: история и литература — можно; история и история — нельзя. Нельзя использовать для математики, русского языка, английского языка и Math (математики на английском языке).',

    description_en =
        'Two homework skips, and each skip must be used for a different subject. For example, History + Literature is allowed; History + History is not. The reward cannot be used for Mathematics, Russian, English, or Math taught in English.',

    description =
        'Два пропуска домашнего задания по разным предметам с ограничениями.'

WHERE reward_key = 'homework_skip_x2_restricted';


UPDATE rewards
SET
    description_ru =
        'Можно два раза не выполнять домашнее задание, но каждый пропуск должен быть использован для разного предмета. Например: история и литература — можно; история и история — нельзя. Нельзя использовать для математики, русского языка, английского языка и Math (математики на английском языке). Дополнительно ученик получает брендированный мерч RIS: блокнот, ручку, футболку, толстовку или другой доступный предмет.',

    description_en =
        'Two homework skips, and each skip must be used for a different subject. For example, History + Literature is allowed; History + History is not. The reward cannot be used for Mathematics, Russian, English, or Math taught in English. The student also receives available RIS-branded merchandise such as a notebook, pen, T-shirt, hoodie, or another item.',

    description =
        'Два пропуска домашнего задания по разным предметам с ограничениями + брендированный мерч RIS.'

WHERE reward_key = 'homework_skip_x2_merch';

COMMIT;


SELECT
    id,
    reward_key,
    title_ru,
    description_ru,
    description_en
FROM rewards
WHERE reward_key IN (
    'homework_skip_x2_restricted',
    'homework_skip_x2_merch'
)
ORDER BY id;
