# Pilot telepítés

## Javasolt környezet

- frontend: Cloudflare Pages, GitHub-integrációval;
- backend: külön Supabase Cloud pilotprojekt;
- forrás: a privát `kresi-cloud/ra-kommunikacios-platform` repository `main` ága.

## Cloudflare Pages

| Beállítás | Érték |
|---|---|
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js | 22 vagy újabb |

A `public/_redirects` fájl gondoskodik arról, hogy a kliensoldali alkalmazásútvonalak közvetlen megnyitáskor is az alkalmazáshoz kerüljenek.

## Környezeti változók

| Változó | Tartalom |
|---|---|
| `VITE_SUPABASE_URL` | a pilot Supabase projekt URL-je |
| `VITE_SUPABASE_ANON_KEY` | a pilotprojekt publishable/anon kulcsa |

A Supabase service-role kulcsát tilos a Cloudflare Pages frontendváltozói közé tenni. Az anon kulcs nyilvános klienskulcs; a tényleges adatvédelmet az RLS és az auditált RPC-k biztosítják.

## Supabase

1. Új, külön pilotprojekt létrehozása EU-régióban.
2. A `supabase/migrations` fájlok futtatása növekvő fájlnév szerint.
3. Nyilvános regisztráció kikapcsolása.
4. Pilotfelhasználók meghívása és a szükséges profil-/szereprekordok létrehozása.
5. A Cloudflare Pages URL felvétele az Auth Site URL és Redirect URLs beállításokhoz.
6. Az adatbázis- és böngészőtesztek futtatása a pilotprojekt éles használata előtt.

## Élesítési határ

A pilot csak próbaadatokkal használható addig, amíg nincs elfogadott adatkezelési beállítás, mentési rend, incidenskezelés és kijelölt alkalmazásgazda. A pilotból termelési környezetbe történő áttérés külön Supabase projekttel javasolt.
