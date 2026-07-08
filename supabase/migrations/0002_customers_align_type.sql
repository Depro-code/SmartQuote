-- Align public.customers with the app's actual Customer type
-- (id, name, phone, createdAt, updatedAt only). The initial schema
-- (0001) added email/company/address/notes speculatively; the TS type
-- never had them, so they were dead columns. Removing them here.
alter table public.customers
  drop column if exists email,
  drop column if exists company,
  drop column if exists address,
  drop column if exists notes;
