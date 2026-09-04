# Architektúra

## Futási kép

- Kliens: React 19, TypeScript strict, Vite, React Router, TanStack Query.
- Backend: Supabase Auth, PostgreSQL, RLS és később Edge Functions.
- Fájlok: privát Supabase Storage; publikus bucket nincs.
- Idő: tárolás UTC-ben, megjelenítés `Europe/Budapest` szerint.
- PWA: manifest és service worker; érzékeny üzleti adat offline gyorsítótárba nem kerülhet.

## Határvonalak

A böngésző csak anon kulcsot kap. Az adat-hozzáférés végső döntése az adatbázis RLS-é. Emelt jogosultságú művelet csak szűk, auditált RPC-n vagy szerveroldali végponton keresztül történhet. A service-role kulcsnak nincs helye a frontendben.

## Kódstruktúra

- `src/domain`: tiszta üzleti típusok és állapotlogika.
- `src/api`: Supabase lekérdezések, magyar felhasználói hibaüzenettel.
- `src/auth`: munkamenet és védett útvonalak.
- `src/components`, `src/pages`: felület.
- `supabase/migrations`: verziózott adatmodell, policyk és RPC-k.
- `tests`, `e2e`: unit/komponens-, RLS- és böngészőtesztek.

Az I1 lekérdezései közvetlenül a RLS-szűrt táblákat olvassák. Állapot-, határidő-, felelős-, részvételi és foglaltsági módosítás csak célzott `security definer` RPC-n keresztül történhet; a kliens közvetlen írási táblajogot nem kap. Az esemény létrehozása és ütemezése egyetlen tranzakciós RPC, ezért részleges, ütemezetlen rekord nem marad hiba esetén.
