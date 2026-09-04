begin;

-- A Supabase helyi stack az extensions sémában tartja a pgcrypto függvényeit,
-- míg egy általános PostgreSQL-telepítésben azok a public sémába is kerülhetnek.
-- A korábbi, security definer kódok egységes és szűk célpontot kapnak.
do $$
begin
  if to_regprocedure('public.gen_random_bytes(integer)') is null then
    execute $function$
      create function public.gen_random_bytes(byte_count integer)
      returns bytea
      language sql volatile strict security invoker set search_path = ''
      as 'select extensions.gen_random_bytes(byte_count)'
    $function$;
  end if;
end;
$$;

revoke all on function public.gen_random_bytes(integer) from public, anon, authenticated;

commit;
