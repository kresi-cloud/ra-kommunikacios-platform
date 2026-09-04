# Üzemeltetési runbook

## Telepítés

1. Supabase projekt létrehozása, migrációk alkalmazása.
2. Auth provider, engedélyezett domainek és redirectek beállítása.
3. `VITE_SUPABASE_URL` és `VITE_SUPABASE_ANON_KEY` felvétele a tárhely titokkezelőjében.
4. `npm ci && npm run check`, majd build telepítése.
5. Smoke teszt aktív belső, projektgazda és technikai admin fiókkal.

## Incidens

- Jogosultsági szivárgás gyanújánál a kiadás és az érintett fiók felfüggesztendő.
- Az auditnapló, auth események és request ID alapján kell hatókört mérni.
- Titok gyanúja esetén kulcsrotáció szükséges; érzékeny értéket hibajegybe másolni tilos.
- Adatvesztésnél előbb írásstop, majd dokumentált visszaállítási eljárás.

## Rendszeres feladatok

- függőségi és sérülékenységi ellenőrzés;
- lejárt külső fiókok és delegációk ellenőrzése;
- negyedéves visszaállítási próba;
- RLS-regresszió futtatása minden sémaváltozásnál.

Üzemeltetési tulajdonos, riasztási csatorna, RTO és RPO: `[CONFIGURE_ME]`.

