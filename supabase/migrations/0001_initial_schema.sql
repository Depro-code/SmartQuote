-- =====================================================================
-- SmartQuote — Supabase schema (INITIAL)
-- This is the first schema ever applied to the project. Captured here
-- from memory/dashboard history — there was no migration file until now.
-- Superseded in part by later files in this folder (see 0002, 0003).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- PROFILES  (1:1 with auth.users, adds phone/role on top of Supabase Auth)
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  phone       text not null unique,          -- E.164 format, e.g. +237679689100
  full_name   text,
  role        text not null default 'staff' check (role in ('admin', 'staff')),
  created_at  timestamptz not null default now()
);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create function public.get_email_by_phone(p_phone text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.phone = p_phone
  limit 1;
$$;

grant execute on function public.get_email_by_phone(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- SETTINGS  (singleton row — company profile / invoice header)
-- ---------------------------------------------------------------------
create table public.settings (
  id                   smallint primary key default 1 check (id = 1),
  app_name             text not null default 'SmartQuote Inventory',
  company_name         text not null,
  invoice_title        text,
  header_line1         text,
  header_line2         text,
  header_line3         text,
  address              text not null,
  phone                text not null,
  email                text not null,
  website              text,
  registration_number  text,
  tax_id               text,
  logo_url             text,
  currency             text not null default 'XAF',
  footer_note          text,
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------
create table public.products (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  sku                text unique,
  category           text,
  brand              text,
  unit               text,
  unit_price         numeric(14,2) not null default 0,
  quantity_in_stock  integer not null default 0,
  reorder_level      integer,
  description        text,
  image_url          text,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index products_category_idx on public.products(category);
create index products_is_active_idx on public.products(is_active);

-- ---------------------------------------------------------------------
-- CUSTOMERS
-- NOTE: email/company/address/notes added here are removed in migration
-- 0002 to match the app's actual Customer type. Kept as originally run
-- for an accurate history — do not "clean this up" retroactively.
-- ---------------------------------------------------------------------
create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  email       text,
  company     text,
  address     text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index customers_phone_idx on public.customers(phone);

-- ---------------------------------------------------------------------
-- QUOTATIONS + QUOTATION_ITEMS
-- ---------------------------------------------------------------------
create table public.quotations (
  id             uuid primary key default gen_random_uuid(),
  quote_number   text unique,
  customer_id    uuid references public.customers(id) on delete set null,
  customer_name  text not null,
  customer_phone text,
  customer_email text,
  status         text not null default 'DRAFT' check (status in ('DRAFT','SENT','CONFIRMED','CANCELLED')),
  issue_date     date not null default current_date,
  valid_until    date,
  sub_total      numeric(14,2) not null default 0,
  discount       numeric(14,2),
  tax_rate       numeric(5,2),
  tax_amount     numeric(14,2),
  grand_total    numeric(14,2) not null default 0,
  notes          text,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index quotations_status_idx on public.quotations(status);
create index quotations_customer_id_idx on public.quotations(customer_id);

create table public.quotation_items (
  id                    uuid primary key default gen_random_uuid(),
  quotation_id          uuid not null references public.quotations(id) on delete cascade,
  product_id            uuid references public.products(id) on delete set null,
  name_snapshot         text not null,
  unit_price_snapshot   numeric(14,2) not null,
  unit_snapshot         text,
  quantity              numeric(12,2) not null,
  line_total            numeric(14,2) not null,
  sort_order            integer not null default 0
);

create index quotation_items_quotation_id_idx on public.quotation_items(quotation_id);

create function public.generate_quote_number()
returns trigger
language plpgsql
as $$
declare
  yr   text := to_char(now(), 'YYYY');
  next_n int;
begin
  if new.quote_number is not null then
    return new;
  end if;

  select count(*) + 1 into next_n
  from public.quotations
  where quote_number like 'SQ-' || yr || '-%';

  new.quote_number := 'SQ-' || yr || '-' || lpad(next_n::text, 4, '0');
  return new;
end;
$$;

create trigger trg_generate_quote_number
before insert on public.quotations
for each row execute function public.generate_quote_number();

-- ---------------------------------------------------------------------
-- SALES + SALE_ITEMS  (created when a quotation is confirmed)
-- ---------------------------------------------------------------------
create table public.sales (
  id             uuid primary key default gen_random_uuid(),
  sale_date      timestamptz not null default now(),
  customer_name  text not null,
  grand_total    numeric(14,2) not null,
  type           text not null check (type in ('CASH','CREDIT')),
  week           smallint not null check (week between 1 and 4),
  month          text not null,
  quotation_id   uuid references public.quotations(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index sales_month_idx on public.sales(month);
create index sales_quotation_id_idx on public.sales(quotation_id);

create table public.sale_items (
  id           uuid primary key default gen_random_uuid(),
  sale_id      uuid not null references public.sales(id) on delete cascade,
  description  text not null,
  quantity     numeric(12,2),
  unit_price   numeric(14,2) not null,
  total        numeric(14,2) not null
);

create index sale_items_sale_id_idx on public.sale_items(sale_id);

-- ---------------------------------------------------------------------
-- EXPENSES + PETIT CASH TOP-UPS
-- ---------------------------------------------------------------------
create table public.expenses (
  id            uuid primary key default gen_random_uuid(),
  expense_date  date not null default current_date,
  details       text not null,
  amount        numeric(14,2) not null,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index expenses_date_idx on public.expenses(expense_date);

create table public.petit_cash_topups (
  id          uuid primary key default gen_random_uuid(),
  topup_date  date not null default current_date,
  amount      numeric(14,2) not null,
  note        text,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

create view public.petit_cash_balance as
select
  (select coalesce(sum(amount), 0) from public.petit_cash_topups) as total_topups,
  (select coalesce(sum(amount), 0) from public.expenses) as total_expenses,
  (select coalesce(sum(amount), 0) from public.petit_cash_topups)
    - (select coalesce(sum(amount), 0) from public.expenses) as balance;

-- ---------------------------------------------------------------------
-- confirm_quotation() — ORIGINAL VERSION. Hardcoded 'CASH', took only
-- p_quotation_id. Superseded by migration 0003 which adds p_sale_type.
-- Kept here as-run for accurate history — do not edit this file.
-- ---------------------------------------------------------------------
create function public.confirm_quotation(p_quotation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quotation   public.quotations%rowtype;
  v_item        public.quotation_items%rowtype;
  v_sale_id     uuid;
  v_day         int := extract(day from now());
  v_week        smallint;
  v_month       text := to_char(now(), 'YYYY-MM');
begin
  select * into v_quotation from public.quotations where id = p_quotation_id for update;

  if not found then
    raise exception 'Quotation % not found', p_quotation_id;
  end if;

  if v_quotation.status = 'CONFIRMED' then
    raise exception 'Quotation % is already confirmed', p_quotation_id;
  end if;

  v_week := case
    when v_day <= 7 then 1
    when v_day <= 15 then 2
    when v_day <= 22 then 3
    else 4
  end;

  insert into public.sales (sale_date, customer_name, grand_total, type, week, month, quotation_id)
  values (now(), v_quotation.customer_name, v_quotation.grand_total, 'CASH', v_week, v_month, v_quotation.id)
  returning id into v_sale_id;

  for v_item in select * from public.quotation_items where quotation_id = v_quotation.id loop
    update public.products
    set quantity_in_stock = greatest(0, quantity_in_stock - v_item.quantity),
        updated_at = now()
    where id = v_item.product_id;

    insert into public.sale_items (sale_id, description, quantity, unit_price, total)
    values (v_sale_id, v_item.name_snapshot, v_item.quantity, v_item.unit_price_snapshot, v_item.line_total);
  end loop;

  update public.quotations
  set status = 'CONFIRMED', updated_at = now()
  where id = v_quotation.id;

  return v_sale_id;
end;
$$;

grant execute on function public.confirm_quotation(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- updated_at auto-touch trigger (reused across tables)
-- ---------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger trg_customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger trg_quotations_updated_at before update on public.quotations
  for each row execute function public.set_updated_at();
create trigger trg_sales_updated_at before update on public.sales
  for each row execute function public.set_updated_at();
create trigger trg_expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();
create trigger trg_settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.expenses enable row level security;
alter table public.petit_cash_topups enable row level security;

create policy "profiles_select_all" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_manage" on public.profiles
  for insert with check (public.is_admin());
create policy "profiles_admin_delete" on public.profiles
  for delete using (public.is_admin());

create policy "settings_select_all" on public.settings
  for select using (auth.role() = 'authenticated');
create policy "settings_admin_write" on public.settings
  for insert with check (public.is_admin());
create policy "settings_admin_update" on public.settings
  for update using (public.is_admin());

do $$
declare
  t text;
begin
  foreach t in array array[
    'products', 'customers', 'quotations', 'quotation_items',
    'sales', 'sale_items', 'expenses', 'petit_cash_topups'
  ]
  loop
    execute format(
      'create policy "%1$s_authenticated_all" on public.%1$s
         for all using (auth.role() = ''authenticated'')
         with check (auth.role() = ''authenticated'');',
      t
    );
  end loop;
end $$;

-- =====================================================================
-- Seed the singleton settings row
-- =====================================================================
insert into public.settings (
  id, app_name, company_name, invoice_title,
  header_line1, header_line2, header_line3,
  address, phone, email, currency
) values (
  1, 'SmartQuote Inventory', 'AMEN-CAM LTD', 'Proforma invoice no',
  'AMAZING MEDICAL EQUIPMENT NETWORK-CAM LIMITED',
  'Dealer in medical equipment, materials, contracts, import and general commerce',
  'Tax Payer''s No. M052014422532X CNPS No. 370-0131792-000-R',
  'P.O Box 5210, Nkwen, Bamenda', '+237 679689100', 'amencam77@gmail.com', 'XAF'
)
on conflict (id) do nothing;
