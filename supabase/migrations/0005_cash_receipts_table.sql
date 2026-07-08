-- =====================================================================
-- Cash receipts move from browser localStorage into Supabase.
-- Mirrors the quotations/quotation_items pattern: auto-numbered via
-- trigger, but the trigger skips generation if a number is supplied
-- manually (same mechanism as generate_quote_number()).
-- =====================================================================

create table public.cash_receipts (
  id              uuid primary key default gen_random_uuid(),
  receipt_number  text unique,               -- auto-filled by trigger below if left null
  sale_id         uuid references public.sales(id) on delete set null,
  quotation_id    uuid references public.quotations(id) on delete set null,
  customer_name   text not null,
  issue_date      date not null default current_date,
  sub_total       numeric(14,2) not null default 0,
  tax_rate        numeric(5,2),
  tax_amount      numeric(14,2),
  grand_total     numeric(14,2) not null default 0,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Non-unique lookup indexes: a receipt is looked up by its source
-- (sale or quotation) BEFORE creating a new one, to stop the
-- create-a-new-one-every-visit bug. Not a unique constraint, so a
-- second/corrected receipt for the same source is still possible if
-- ever genuinely needed — the app enforces "reuse if it exists" at
-- the application layer, not the database layer.
create index cash_receipts_sale_id_idx on public.cash_receipts(sale_id);
create index cash_receipts_quotation_id_idx on public.cash_receipts(quotation_id);

create table public.cash_receipt_items (
  id                uuid primary key default gen_random_uuid(),
  cash_receipt_id   uuid not null references public.cash_receipts(id) on delete cascade,
  description       text not null,
  quantity          numeric(12,2),
  unit_price        numeric(14,2) not null,
  total             numeric(14,2) not null,
  sort_order        integer not null default 0
);

create index cash_receipt_items_cash_receipt_id_idx on public.cash_receipt_items(cash_receipt_id);

-- Auto-generate receipt numbers like CR-2026-0001 when not supplied,
-- same mechanism as generate_quote_number() — manual entry wins if given.
create function public.generate_receipt_number()
returns trigger
language plpgsql
as $$
declare
  yr   text := to_char(now(), 'YYYY');
  next_n int;
begin
  if new.receipt_number is not null then
    return new;
  end if;

  select count(*) + 1 into next_n
  from public.cash_receipts
  where receipt_number like 'CR-' || yr || '-%';

  new.receipt_number := 'CR-' || yr || '-' || lpad(next_n::text, 4, '0');
  return new;
end;
$$;

create trigger trg_generate_receipt_number
before insert on public.cash_receipts
for each row execute function public.generate_receipt_number();

create trigger trg_cash_receipts_updated_at before update on public.cash_receipts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS + GRANTS
-- Learned the hard way twice now: RLS policy alone is not enough,
-- and the bulk-grant loop over pg_tables only covers tables that
-- existed WHEN IT RAN. New tables need their own explicit grants,
-- in the same migration that creates them, every time.
-- ---------------------------------------------------------------------
alter table public.cash_receipts enable row level security;
alter table public.cash_receipt_items enable row level security;

grant select, insert, update, delete on public.cash_receipts to authenticated;
grant select on public.cash_receipts to anon;
grant select, insert, update, delete on public.cash_receipt_items to authenticated;
grant select on public.cash_receipt_items to anon;

create policy "cash_receipts_authenticated_all" on public.cash_receipts
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "cash_receipt_items_authenticated_all" on public.cash_receipt_items
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
