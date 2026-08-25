# MERIT System — rebuilt RU/EN version

This archive is rebuilt from the uploaded current project, rather than from the earlier patch archives.

## What is included

- Student login with classes loaded dynamically from PostgreSQL.
- Student dashboard optimized for tablet use.
- Six new individual-level rewards.
- Full RU / EN interface for students, teachers, and curators.
- The selected language is stored in the session.
- Reward names/descriptions are stored in PostgreSQL in both languages.
- Printed ticket reward text follows the language used when the student purchased the reward.
- Atomic purchase transaction: balance deduction, merit transaction, and order creation commit together or roll back together.
- Teacher can award merits but has no ticket-printing route.
- Curator can have multiple assigned classes through `curator_classes`.
- Curator can only award/print/issue tickets for assigned classes.
- PDF generator uses Cormorant Garamond for reward titles and Golos Text for the other fields.
- Long reward titles are automatically reduced in size and vertically centered.
- Purchase button keeps the word Buy/Купить while loading and shows a small spinner.
- Purchase confirmation is large and visible.

## New rewards

| Merits | RU | EN |
|---:|---|---|
| 10 | Без галстука | No Tie Day |
| 25 | День без школьной формы | No Uniform Day |
| 50 | Без очереди в столовой — неделя | Skip the Canteen Line for a Week |
| 75 | Домашнее задание ×2 — один предмет | Homework Skip ×2 — One Subject |
| 150 | Домашнее задание ×3 + подарочная карта | Homework Skip ×3 + Gift Card |
| 185 | Подарочный бокс + карта + признание | Gift Box + Gift Card + Recognition |

For the 75-merit reward, both homework skips are for the same subject. The subject is chosen at first use.

## Install / update an existing database

Back up the database first.

Run only this new migration for this rebuild:

```text
migrations/003_rebuild_bilingual_rewards.sql
```

It:
- allows the `teacher` role;
- adds RU/EN reward fields;
- installs the six new reward definitions;
- leaves old reward rows in place but inactive so historic foreign keys are not broken;
- adds bilingual snapshot fields to `orders`;
- adds `orders.locale`;
- creates `curator_classes`;
- copies each curator's existing `users.class_id` into `curator_classes`.

Then restart:

```bash
npm install
npm run dev
```

## Assign several classes to a curator

First find IDs:

```sql
SELECT id, full_name, email
FROM users
WHERE role = 'curator';

SELECT id, name
FROM classes
ORDER BY name;
```

Then assign classes:

```sql
INSERT INTO curator_classes (curator_id, class_id)
VALUES
    (2, 1),
    (2, 2),
    (2, 5)
ON CONFLICT DO NOTHING;
```

## Create a teacher

The role must be `teacher`. Passwords are bcrypt hashes.

```bash
node -e "const bcrypt=require('bcrypt'); bcrypt.hash('YOUR_PASSWORD',10).then(console.log)"
```

Then insert/update the user in PostgreSQL.

## Files that should not be pushed to GitHub

Keep `.env` out of Git. The existing `.gitignore` should exclude it and `node_modules/`.

Production should always set:

```text
SESSION_SECRET=long-random-secret
NODE_ENV=production
```

## Important scope note

The reward “Homework Skip ×2 — One Subject” is represented correctly in the catalog and on the printed coupon, but the project still treats a coupon as one order/ticket. It does not yet contain a separate redemption ledger for “first use / second use” or the chosen subject. That is a separate workflow if you want the system itself, rather than staff, to track partial use.


## Current reward catalog

| Merits | Русский | English |
|---:|---|---|
| 10 | День без галстука | No Tie Day |
| 25 | День без формы | No Uniform Day |
| 50 | Без очереди в столовой — неделя | Skip the Canteen Line for a Week |
| 75 | Не выполнять домашнее задание ×2 | Homework Skip ×2 |
| 150 | Домашнее задание ×2 + мерч RIS | Homework Skip ×2 + RIS Merch |
| 185 | Подарочный брендированный бокс RIS | RIS Branded Gift Box |

### Homework rules

**75 merits:** two homework skips. The two uses must be for different subjects.  
Not allowed: Mathematics, Russian, English, English Mathematics.

**150 merits:** two homework skips. The two uses must be for different subjects.  
Not allowed: Mathematics, Russian, English, MEF.  
Also includes available RIS merchandise such as a notebook, pen, T-shirt, hoodie, etc.

> At the moment these rules are displayed in the reward description. The project
> does not yet have a redemption workflow that records the chosen subjects and
> programmatically blocks an invalid subject selection.
