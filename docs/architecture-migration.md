# Adattár-migráció: Supabase → SQLite

## Döntés és indoklás

A projekt Lovable-eredetű scaffoldja Supabase-t (Postgres + RLS + Auth +
Storage) használt, de ez sosem volt tudatos architektúraválasztás – csak a
kiindulási sablon öröksége. A csapat úgy döntött, hogy a Supabase-t egy
önhosztolt, fájl-alapú SQLite adattárra cseréli, elkerülve a vendorlockot és
a külső szolgáltatásfüggést.

**Új stack:**

- **Adattár:** SQLite fájl (`data/ra-kommunikacios-platform.sqlite`),
  `better-sqlite3` driverrel.
- **ORM:** Drizzle ORM (`server/db/schema.ts`), verziózott SQL-migrációkkal
  (`server/db/migrations/`, `npm run db:generate`).
- **API-szerver:** Hono, fejlesztésben a Vite dev szerverrel egy folyamatban
  (`@hono/vite-dev-server`), élesben önálló Node-folyamatként
  (`server/serve.ts`, `@hono/node-server`).
- **Auth:** better-auth (Google OAuth + e-mail/jelszó, munkamenet-sütik),
  a profiladatok a `user` tábla kiegészítő mezőiként élnek – nincs külön
  `auth.users`/`public.profiles` séma-elválasztás, mint Supabase-nél.

## A biztonsági modell alapvető változása

Ez nem csupán kliens-lecsere. A korábbi rendszer **minden**
hozzáférés-vezérlését Postgres RLS-policyk és `security definer` RPC-k
adták (lásd a régi `docs/permissions-and-rls.md`-t és a
`supabase/migrations/` alatti fájlokat). SQLite-nak nincs sor szintű
biztonsági mechanizmusa, ezért ugyanez a logika most **alkalmazáskódban**,
a `server/authz.ts` rétegben fut:

| Korábbi Postgres-elem | Új megfelelő |
|---|---|
| `private.is_active_user()` | `authz.isActiveUser(db, userId)` |
| `private.has_role()` / `has_permission()` | `authz.hasRole()` / `hasPermission()` |
| `private.is_communication_lead()` stb. | `authz.isCommunicationLead()` stb. |
| RLS `using` záradék egy táblán | Route explicit `canAccessProject()`-hívása olvasás/írás előtt |
| `security definer` RPC (pl. `create_project`) | `server/services/*.ts` szolgáltatásfüggvény |
| `private.write_audit()` | `server/audit.ts` `writeAudit()` |

Minden route-nak **explicit módon** kell hívnia a megfelelő
`server/authz.ts` ellenőrzést, mielőtt adatot olvas vagy ír – ezt semmilyen
adatbázis-szintű háló nem pótolja. Ez a legnagyobb kockázati pont: egy
elfelejtett ellenőrzés itt nem RLS-hibaként, hanem csendes adatszivárgásként
jelentkezne. Minden új route-hoz kötelező a pozitív és negatív jogosultsági
teszt (lásd `server/authz.test.ts`, `server/services/projects.test.ts`
mintaként).

## Átállási állapot (fokozatos, nem big-bang)

Egyetlen lépésben nem váltható a teljes rendszer, mert az azonosítás
(ki a bejelentkezett felhasználó) és az RLS elválaszthatatlanul összefügg:
amint az auth Supabase-ről lekerül, a Supabase `auth.uid()`-ra épülő RLS
policyk többé nem tudják azonosítani a felhasználót, tehát a még nem
portolt Supabase-táblák elérhetetlenné válnának. Ezért a portolás
funkciónként, teljes vertikális szeletekben halad:

| Terület | Állapot |
|---|---|
| Azonosítás, szerepek, jogosultságok, audit (I0 megfelelője) | **Kész az új háttérrendszeren**: `server/auth.ts`, `server/authz.ts`, `server/db/schema.ts` |
| Projektek (I1/A megfelelője) | **Kész az új háttérrendszeren**: `server/services/projects.ts`, `server/routes/projects.ts` |
| Feladatok, események, naptár (I1/B1–B2) | **Még a Supabase-en fut**, portolás folyamatban |
| Értesítések, háttérfeladatok (I1/B3) | **Még a Supabase-en fut**, portolás folyamatban |
| Frontend (`src/`) | **Még nincs átkötve** az új háttérrendszerre; a bejelentkezés és a projektoldal átkötése a következő lépés |

A `src/` alatti felület egyelőre változatlanul a Supabase-kliensen keresztül
működik – ez a réteg csak a portolás előrehaladtával kerül át fokozatosan
a `server/`-en keresztüli hívásokra. A `supabase/migrations/` és a
`docs/permissions-and-rls.md` régi tartalma referenciaként marad addig, amíg
minden funkció át nem kerül; ezután archiválható vagy törölhető.

## Fejlesztői munkafolyamat az új háttérrendszerhez

```bash
cp .env.example .env.local   # tölts ki legalább egy BETTER_AUTH_SECRET-et
npm run auth:generate        # better-auth séma frissítése auth.ts változás után
npm run db:generate          # SQL-migráció generálása sémaváltozás után
npm run dev                  # Vite + Hono egy folyamatban (server/index.ts)
```

A `npm run db:migrate` parancs (vagy a szerver induláskor automatikusan)
alkalmazza a migrációkat a helyi SQLite-fájlra. A `data/*.sqlite*` fájlok
nincsenek verziókezelve.

## Nyitott kérdések a további portoláshoz

1. **Élesítés hosztolása:** a korábbi terv Cloudflare Pages statikus
   hosztingra épült; egy állandóan futó Node-folyamat (Hono szerver) ehhez
   képest más hosztingmodellt igényel (pl. Fly.io, Railway, VPS, vagy
   Cloudflare Workers + D1, ha mégis a Cloudflare-ökoszisztémában maradunk).
   Ez `[CONFIGURE_ME]`.
2. **SQLite egyidejűség:** a `better-sqlite3` szinkron és egyetlen
   Node-folyamaton belül fut; többpéldányos (több szerverfolyamat)
   üzemeltetéshez megosztott fájlrendszer vagy más adattár (pl. Turso/libSQL)
   szükséges. Egyetlen szerverfolyamat esetén (WAL móddal) ez nem korlátozás.
3. **Fájltárolás:** a Supabase privát Storage-ot még nem váltottuk ki;
   az I2 fájlmodulja előtt ezt is meg kell tervezni (pl. helyi lemez vagy
   S3-kompatibilis tároló).
