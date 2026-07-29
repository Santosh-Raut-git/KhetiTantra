-- Recreate crop_profits view to include crop_name and season.
-- These fields were missing from the original view, causing the TypeScript
-- interface to receive undefined for those columns.
-- Using CREATE OR REPLACE so existing grants/dependencies are preserved.

CREATE OR REPLACE VIEW public.crop_profits AS
SELECT
  c.id          AS crop_id,
  c.user_id,
  c.crop_name,
  c.season,
  COALESCE(SUM(CASE WHEN t.type = 'income'  THEN t.amount ELSE 0        END), 0) AS total_income,
  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0        END), 0) AS total_expense,
  COALESCE(SUM(CASE WHEN t.type = 'income'  THEN t.amount ELSE -t.amount END), 0) AS net_profit
FROM public.crops c
LEFT JOIN public.transactions t ON c.id = t.crop_id
GROUP BY c.id, c.user_id, c.crop_name, c.season;
