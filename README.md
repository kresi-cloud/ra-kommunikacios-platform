# RA kommunikációs platform

Belső, magyar nyelvű kommunikációs munkaplatform React, TypeScript és Supabase alapon. A repository az I0 biztonsági alapot, az I1 projektmodulját, valamint a feladat- és eseménymodul első használható szeletét tartalmazza.

## Elkészült

- szigorú TypeScript-, lint-, unit- és build-ellenőrzés;
- Supabase Auth alapú belépés Google és e-mail/jelszó útvonalon, nyilvános regisztráció nélkül;
- védett alkalmazásútvonalak, asztali és mobil navigáció, PWA-alap;
- profil-, szerep-, jogosultság-, delegáció- és audit-adatmodell;
- minden üzleti táblán bekapcsolt és kikényszerített RLS;
- a technikai admin kommunikációs tartalomhoz való normál hozzáférésének tiltása;
- privát storage bucketek közvetlen klienshozzáférés nélkül;
- projektlista és projektállapot-átmenetek;
- egyfelelős feladatmodell, kiosztás/elfogadás, blokkolás, review, határidő-előzmény és auditált RPC-k;
- önálló vagy projektes események, belső meghívás és naplózott részvételi válasz;
- RLS-szűrt nyitott feladatlista, budapesti időzónás naptári agenda és élő kezdőlapi mutatók;
- RLS-, böngésző- és alkalmazástesztek, GitHub Actions munkafolyamat.

## Helyi indítás

Követelmény: Node.js 22 vagy újabb.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Az `.env.local` fájlban valódi Supabase projekt URL és anon kulcs szükséges. A service-role kulcsot tilos kliensoldali változóba tenni.

## Ellenőrzések

```bash
npm run check
npx playwright install chromium
npm run test:e2e
SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run test:db
```

A DB-teszthez előbb futó, migrált Supabase adatbázis kell. A CI ezt `supabase start` paranccsal készíti elő.

## Dokumentáció

Az implementációs és üzemeltetési dokumentáció a `docs/` mappában, a változatlan forrásspecifikációk a `docs/specifications/` mappában találhatók. Az eltérően nem jelölt nyitott üzleti konfigurációk értéke `[CONFIGURE_ME]`.
