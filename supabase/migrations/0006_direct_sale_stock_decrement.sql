-- =====================================================================
-- Fix: direct sales (the "Add Sale" dialog, for returning customers who
-- bypass the quotation flow) never decremented stock. sale_items also
-- never stored which product a line item referred to, so there was no
-- way to even do it after the fact.
--
-- This mirrors confirm_quotation(): one atomic RPC that creates the
-- sale + its items and decrements stock together, instead of the
-- separate client-side inserts that were silently missing the stock
-- update entirely.
-- =====================================================================

alter table public.sale_items
  add column if not exists product_id uuid references public.products(id) on delete set null;

create index if not exists sale_items_product_id_idx on public.sale_items(product_id);

create function public.create_direct_sale(
  p_sale_date   date,
  p_customer_name text,
  p_grand_total numeric,
  p_type        text,
  p_week        smallint,
  p_month       text,
  p_items       jsonb  -- array of {product_id, description, quantity, unit_price, total}
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_sale_id uuid;
  v_item    jsonb;
begin
  if p_type not in ('CASH', 'CREDIT') then
    raise exception 'Invalid sale type: %. Must be CASH or CREDIT', p_type;
  end if;

  insert into public.sales (sale_date, customer_name, grand_total, type, week, month)
  values (p_sale_date, p_customer_name, p_grand_total, p_type, p_week, p_month)
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.sale_items (sale_id, product_id, description, quantity, unit_price, total)
    values (
      v_sale_id,
      nullif(v_item->>'product_id', '')::uuid,
      v_item->>'description',
      nullif(v_item->>'quantity', '')::numeric,
      (v_item->>'unit_price')::numeric,
      (v_item->>'total')::numeric
    );

    if (v_item->>'product_id') is not null and (v_item->>'product_id') != '' then
      update public.products
      set quantity_in_stock = greatest(0, quantity_in_stock - coalesce(nullif(v_item->>'quantity', '')::numeric, 0)::int),
          updated_at = now()
      where id = (v_item->>'product_id')::uuid;
    end if;
  end loop;

  return v_sale_id;
end;
$function$;

grant execute on function public.create_direct_sale(date, text, numeric, text, smallint, text, jsonb) to authenticated;
