-- Fix: confirm_quotation hardcoded sale type to 'CASH'. Now takes p_sale_type
-- so the person confirming can record it as CASH or CREDIT.
--
-- IMPORTANT: this changes the function's argument signature (adds p_sale_type).
-- Postgres treats confirm_quotation(uuid) and confirm_quotation(uuid, text) as
-- two DIFFERENT functions. If you don't drop the old one, both will exist and
-- any code still calling the 1-arg version will keep silently hardcoding CASH.
DROP FUNCTION IF EXISTS public.confirm_quotation(uuid);

CREATE OR REPLACE FUNCTION public.confirm_quotation(
  p_quotation_id uuid,
  p_sale_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_quotation   public.quotations%rowtype;
  v_item        public.quotation_items%rowtype;
  v_sale_id     uuid;
  v_day         int := extract(day from now());
  v_week        smallint;
  v_month       text := to_char(now(), 'YYYY-MM');
begin
  if p_sale_type not in ('CASH', 'CREDIT') then
    raise exception 'Invalid sale type: %. Must be CASH or CREDIT', p_sale_type;
  end if;

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
  values (now(), v_quotation.customer_name, v_quotation.grand_total, p_sale_type, v_week, v_month, v_quotation.id)
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
$function$;
