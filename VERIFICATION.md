# Verification notes

The rebuilt project was checked as a coherent codebase rather than as a set of patches.

## Checks completed

- `node --check` passed for every `.js` file in the rebuilt project.
- All EJS files have balanced EJS opening/closing tags.
- No route imports the old `config/rewards.js`; PostgreSQL is now the reward source of truth.
- Student login loads classes from `classes`.
- Student rewards load from active rows in `rewards`.
- `/api/buy` uses one PostgreSQL transaction via `purchaseModel.js`.
- The transaction includes:
  - reward lookup;
  - per-student advisory lock;
  - balance lock/check;
  - balance deduction;
  - `merit_transactions` insert;
  - `orders` insert;
  - commit/rollback.
- Teacher routes contain merit awarding only; no PDF-print route is mounted under `/teacher`.
- Curator routes validate assigned classes through `curator_classes`.
- Curator dashboard keeps both `pending_print` and `printed` orders visible.
- Only `pending_print` orders are sent to PDF printing.
- Only `printed` orders can be issued.
- Reward snapshots preserve RU/EN titles in `orders`.
- PDF reward title follows the locale saved when the reward was purchased.
- PDF generator uses Cormorant Garamond for reward titles and Golos Text for other fields.
- Long reward names are fitted to the central field.

## Not executable in this environment

A live PostgreSQL database was not available, so the migration and SQL queries could not be executed against your actual database here. Run `migrations/003_rebuild_bilingual_rewards.sql` on a backup/staging copy first.

## Known functional boundary

The 75-merit reward is correctly described as two homework skips for the same subject, but the current service does not yet keep a separate redemption ledger containing:
- chosen subject;
- first use;
- second use.

At present that condition is represented by the reward/coupon wording and is enforced operationally by staff.
