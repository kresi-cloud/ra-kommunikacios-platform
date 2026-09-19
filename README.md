# RA kommunikációs platform

Belső, magyar nyelvű kommunikációs munkaplatform React, TypeScript alapon. A háttérrendszer Supabase-ről egy önhosztolt SQLite + Hono + Drizzle + better-auth stackre áll át; részletek és az átállás állapota: [docs/architecture-migration.md](docs/architecture-migration.md). Az azonosítás és a projektmodul már az új háttérrendszeren fut, a feladat-, esemény- és értesítésmodul portolása folyamatban van, addig a Supabase-en fut tovább.

## Elkészült

- szigorú TypeScript-, lint-, unit- és build-ellenőrzés;
- **új háttérrendszer** (`server/`): SQLite + Drizzle + Hono + better-auth, saját jogosultsági réteg (`server/authz.ts`) a korábbi RLS/RPC-logika alkalmazáskódos megfelelőjeként; azonosítás és projektmodul már ezen fut, tesztelve (`server/*.test.ts`), és a felület (bejelentkezés, projektoldal) is átkötve rá;
- Google és e-mail/jelszó belépés az új háttérrendszeren, nyilvános regisztráció nélkül *(a feladat-, esemény- és értesítésmodul egyelőre még a Supabase-en fut, lásd fent)*;
- védett alkalmazásútvonalak, asztali és mobil navigáció, PWA-alap;
- profil-, szerep-, jogosultság-, delegáció- és audit-adatmodell;
- minden üzleti táblán bekapcsolt és kikényszerített RLS;
- a technikai admin kommunikációs tartalomhoz való normál hozzáférésének tiltása;
- privát storage bucketek közvetlen klienshozzáférés nélkül;
- projektlista és projektállapot-átmenetek;
- egyfelelős feladatmodell, kiosztás/elfogadás, blokkolás, review, határidő-előzmény és auditált RPC-k;
- önálló vagy projektes események, belső meghívás és naplózott részvételi válasz;
- feladatlétrehozás, lista/Kanban, feladatadatlap és a felelős engedélyezett állapotváltásai;
- indokolt feladathatáridő-módosítás és feladatátadás új felelősi elfogadással;
- atomi eseménylétrehozás, budapesti időzónás agenda, eseményadatlap, meghívás és részvételi válasz;
- esemény átütemezés ütközésjelzéssel, lényeges változásnál válasz-reset, valamint indokolt lemondás;
- szabályozott Kanban drag-and-drop, amely csak engedélyezett felelősi átmenetet indít;
- saját „Nem elérhető” idősávok és privacy-safe csapatfoglaltság;
- élő kezdőlapi mutatók;
- értesítési outbox: a feladat- és esemény-RPC-k ugyanabban a tranzakcióban, idempotens kulccsal írják az alkalmazáson belüli értesítést; 08:00–20:00 kézbesítési ablak Europe/Budapest szerint, olvasottság, számláló, e-mail/push beállítás a kötelező típusok védelmével;
- időzített automatizmusok: 24 és 2 órás határidő-emlékeztető, esedékesség, késedelem, eseménylezárás „Megtörtént” állapotba, 7 napos archiválás, 1 éves megőrzés, naplózott háttérfutás;
- Google busy-sync alap: kapcsolatállapot, privacy-safe foglaltság-szinkron RPC és felhasználói visszavonás;
- RLS-, böngésző- és alkalmazástesztek, GitHub Actions munkafolyamat.

## Helyi indítás

Követelmény: Node.js 22 vagy újabb.

```bash
npm ci
cp .env.example .env.local   # tölts ki legalább egy BETTER_AUTH_SECRET-et
npm run dev
```

A `npm run dev` a Vite dev szerverrel egy folyamatban indítja az új Hono API-szervert; a helyi SQLite-fájlt (`data/`) és a szükséges táblákat automatikusan létrehozza/migrálja. A még nem portolt feladat-, esemény- és értesítésfelületekhez az `.env.local`-ban a Supabase-adatok is szükségesek egyelőre (lásd `.env.example`). A service-role kulcsot és a `BETTER_AUTH_SECRET`-et tilos kliensoldali változóba tenni.

## Ellenőrzések

```bash
npm run check
npx playwright install chromium
npm run test:e2e
SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run test:db
```

A DB-teszthez előbb futó, migrált Supabase adatbázis kell. A CI ezt `supabase start` paranccsal készíti elő.

## Dokumentáció

Az implementációs és üzemeltetési dokumentáció a `docs/` mappában, a változatlan forrásspecifikációk a `docs/specifications/` mappában találhatók. Az új SQLite-alapú háttérrendszer fejlesztői pontosságú specifikációja: [`docs/specifications/RA_uj_hatterendszer_specifikacio_v1.md`](docs/specifications/RA_uj_hatterendszer_specifikacio_v1.md). A Cloudflare Pages + Supabase pilot lépéseit a `docs/pilot-deployment.md` rögzíti. Az eltérően nem jelölt nyitott üzleti konfigurációk értéke `[CONFIGURE_ME]`.
