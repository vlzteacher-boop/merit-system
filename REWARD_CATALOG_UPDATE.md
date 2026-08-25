# Updated RIS reward catalog

New live catalog:

1. 10 — День без галстука / No Tie Day
2. 25 — День без формы / No Uniform Day
3. 50 — Без очереди в столовой на неделю / Skip the Canteen Line for a Week
4. 75 — Домашнее задание ×2 / Homework Skip ×2
5. 150 — Домашнее задание ×2 + мерч RIS / Homework Skip ×2 + RIS Merch
6. 185 — Подарочный брендированный бокс RIS / RIS Branded Gift Box

Rules for 75:
- two homework skips;
- each skip must be used for a different subject;
- History + Literature = allowed;
- History + History = not allowed;
- not allowed: Mathematics, Russian, English, Math (mathematics taught in English).

Rules for 150:
- two homework skips;
- each skip must be used for a different subject;
- History + Literature = allowed;
- History + History = not allowed;
- not allowed: Mathematics, Russian, English, Math (mathematics taught in English);
- includes available RIS-branded merchandise (notebook, pen, T-shirt, hoodie, etc.).

For an existing database, run:

`migrations/005_update_reward_catalog.sql`

For a new clean database, migration 003 was also updated to install the same catalog.

Important:
These restrictions are currently shown as reward rules/descriptions.
There is not yet a redemption module that stores the two chosen subjects
and enforces the subject restrictions in the database.
