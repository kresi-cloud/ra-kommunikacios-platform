# RA Kommunikációs Platform

A Rátgéber Akadémia belső kommunikációs platformjának biztonságközpontú MVP-je.

## Jelenlegi állapot

Az `I0 – Biztonságos alap` első végrehajtási köre készült el:

- React + TypeScript + Vite alkalmazáskeret;
- telepíthető PWA-konfiguráció;
- magyar hitelesítési felület;
- Supabase Auth kliens biztonságos, környezetfüggő konfigurációval;
- identitás-, szerep-, többletjog-, meghívás-, delegáció- és audit-adatmodell;
- egyszer használható, hash-elve tárolt meghívó- és bootstrap-tokenek;
- RLS-segédfüggvények és kezdeti pozitív/negatív adatbázistesztek;
- privát Storage-bucketek nyilvános hozzáférés nélkül.

A kezdőlapon látható napi kártyák bemutatóadatok; az I1 üzleti moduljai még nincsenek implementálva.

## Helyi indítás

Követelmény: Node.js 22 vagy újabb.

```bash
npm install
cp .env.example .env.local
npm run dev
```

A belépés csak konfigurált Supabase-fejlesztői környezettel működik. A hiányzó paramétereket a `.env.example` `[CONFIGURE_ME]` értékei jelzik. Service-role kulcsot tilos `VITE_` változóban megadni.

## Ellenőrzések

```bash
npm run check
npm run test:e2e
```

Adatbázisteszthez Supabase CLI és Docker-kompatibilis helyi futtatókörnyezet kell:

```bash
supabase start
npm run test:db
```

## Dokumentáció

- [Megvalósítási terv](docs/implementation-plan.md)
- [Architektúra](docs/architecture.md)
- [Jogosultságok és RLS](docs/permissions-and-rls.md)
- [Biztonság és adatvédelem](docs/security-and-privacy.md)
- [Tesztterv](docs/test-plan.md)
- [Üzemeltetési kézikönyv](docs/operations-runbook.md)

Az öt részletes forrásspecifikáció és a fejlesztési masterprompt változatlanul a repó gyökerében található.
