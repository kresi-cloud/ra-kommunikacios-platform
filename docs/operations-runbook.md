# Üzemeltetési runbook

## Telepítés

1. Supabase projekt létrehozása, migrációk alkalmazása.
2. Auth provider, engedélyezett domainek és redirectek beállítása.
3. `VITE_SUPABASE_URL` és `VITE_SUPABASE_ANON_KEY` felvétele a tárhely titokkezelőjében.
4. `npm ci && npm run check`, majd build telepítése.
5. Smoke teszt aktív belső, projektgazda és technikai admin fiókkal.
6. Háttérfeladatok ütemezésének ellenőrzése (lásd lent).

## Háttérfeladatok

A `private.run_notification_jobs()` függvény egy futásban végzi el az eseménylezárást, a határidős értesítéseket, a 7 napos archiválást és az 1 éves megőrzési törlést; minden feladat külön sort ír a `job_runs` táblába, a hiba nem gördíti vissza a többi feladatot.

- Ha a `pg_cron` bővítmény engedélyezett a Supabase projektben (Database → Extensions), a migráció automatikusan 15 percenkénti `ra-notification-jobs` ütemezést készít. Ellenőrzés: `select * from cron.job;`
- Ha a bővítmény a migráció után lett engedélyezve, egyszer futtatandó: `select cron.schedule('ra-notification-jobs', '*/15 * * * *', 'select private.run_notification_jobs();');`
- Ha nincs pg_cron, külső ütemező (Supabase Edge Function cron vagy GitHub Actions) hívja a függvényt service-role kapcsolattal; a kulcs kizárólag szerveroldalon tárolható.
- Kézi futtatás vagy pótlás: `select * from private.run_notification_jobs();`
- Állapot: `select job_name, status, affected_rows, error_message, started_at from public.job_runs order by started_at desc limit 40;`
- Riasztás: három egymást követő `failed` sor ugyanarra a feladatra technikai hibajegyet igényel.

Az e-mail és push csatorna kézbesítője még nem kapcsolódik; a várakozó sorok: `select channel, count(*) from public.notification_deliveries where status = 'queued' group by channel;`. A későbbi kézbesítő csak `deliver_after <= now()` értesítést küldhet, és a `notification_deliveries` sorát frissíti (`delivered`, `failed`, `error_code`, `attempt_count`).

Google busy-sync: a szinkronizáló szerveroldali folyamat a `private.sync_google_busy_blocks(user_id, busy_slots, calendar_name)` függvényt hívja, hiba esetén a `private.record_google_sync_error(user_id, error_code)` függvényt. OAuth-titok a kliensbe vagy a naplóba nem kerülhet.

## Incidens

- Jogosultsági szivárgás gyanújánál a kiadás és az érintett fiók felfüggesztendő.
- Az auditnapló, auth események és request ID alapján kell hatókört mérni.
- Titok gyanúja esetén kulcsrotáció szükséges; érzékeny értéket hibajegybe másolni tilos.
- Adatvesztésnél előbb írásstop, majd dokumentált visszaállítási eljárás.
- Duplikált értesítés gyanújánál a `notifications.job_key` alapján kell ellenőrizni; a kulcs egyedi, ezért a duplikáció csak eltérő kulccsal jöhet létre.

## Rendszeres feladatok

- függőségi és sérülékenységi ellenőrzés;
- lejárt külső fiókok és delegációk ellenőrzése;
- negyedéves visszaállítási próba;
- RLS-regresszió futtatása minden sémaváltozásnál;
- heti ellenőrzés: `job_runs` hibák és a várakozó külső kézbesítési sorok száma.

Üzemeltetési tulajdonos, riasztási csatorna, RTO és RPO: `[CONFIGURE_ME]`.
