# Teszt- és éles környezet

## Környezeti térkép

| Környezet | Git-ág | Supabase | Adat | Telepítés |
|---|---|---|---|---|
| Helyi/CI | feature ág vagy PR | helyi Supabase | teszt-fixture | minden push és PR |
| TEST | `develop` | a jelenlegi pilotprojekt | kizárólag fiktív | automatikus |
| PROD | `main` | külön, új Supabase-projekt | valódi üzleti adat | kizárólag kézi indítással |

A jelenlegi `ubfjvslkvwbtvbtbfsee` projekt TEST környezet. Nem léptethető elő PROD környezetté, és az adatai nem másolhatók át az éles adatbázisba.

## GitHub Secrets és Environments

### TEST

GitHub Environment: `test`

- `SUPABASE_TEST_DB_URL`: a TEST Session Pooler URI-ja.
- Átmenetileg a meglévő repository-szintű `SUPABASE_DB_URL` is használható.

### PROD

GitHub Environment: `production`

- `SUPABASE_PROD_DB_URL`: az új PROD Session Pooler URI-ja.
- A production Environmenthez kötelező jóváhagyót kell rendelni, ha a GitHub-csomag ezt támogatja.
- A workflow ezen felül csak kézi indítással és a `DEPLOY_PRODUCTION` megerősítéssel fut.

A frontendbe csak a környezet saját `VITE_SUPABASE_URL` és `VITE_SUPABASE_ANON_KEY` értéke kerülhet. Service-role kulcsot tilos frontend- vagy Cloudflare-változóként tárolni.

## Release-folyamat

1. Feature ág létrehozása a `develop` ágból.
2. Pull request a `develop` ágba.
3. CI, adatbázistesztek és böngészőtesztek.
4. Merge után automatikus TEST adatbázis-migráció és teszt-frontend telepítés.
5. Felhasználói átvételi teszt.
6. Pull request `develop` ágból `main` ágba.
7. Merge és sikeres CI után kézi PROD adatbázis-telepítés.
8. Éles smoke teszt, majd a PROD frontend telepítése.

Az adatbázis-migrációk legyenek visszafelé kompatibilisek, hogy az adatbázis és a frontend telepítési ideje közötti rövid eltérés ne okozzon kiesést.

## Tesztadatok

- A `supabase/migrations` kizárólag közös séma- és biztonsági változásokat tartalmazhat.
- Új fiktív adatok külön teszt-seed fájlba kerülnek, és csak TEST környezetben futnak.
- PROD környezetben nincs pilotfelhasználó és nincs `DEMO-` rekord.
- PROD adat nem másolható TEST környezetbe; hibakereséshez szintetikus vagy visszafordíthatatlanul anonimizált adat használható.

A korábbi pilotaktiváló és demómigrációk az új PROD adatbázisban pilotfelhasználó hiányában nem töltenek be demóadatot.

## Cloudflare Pages

Javasolt két külön Pages projekt:

- TEST: `ra-kommunikacios-platform-test`, a `develop` ágból, TEST Supabase-változókkal.
- PROD: `ra-kommunikacios-platform`, a `main` ágból, PROD Supabase-változókkal.

A TEST URL-t Cloudflare Access mögé kell tenni. A két projekt környezeti változói nem lehetnek azonosak.

## Üzembe helyezési ellenőrzőlista

- [ ] Új, üres PROD Supabase-projekt létrejött EU-régióban.
- [ ] Nyilvános regisztráció PROD-ban kikapcsolva.
- [ ] TEST és PROD Auth redirect URL-ek elkülönítve.
- [ ] GitHub `test` és `production` Environments létrehozva.
- [ ] A három adatbázis-secret beállítva vagy átnevezve.
- [ ] Külön TEST Cloudflare Pages projekt létrehozva.
- [ ] TEST és PROD frontend-változók beállítva.
- [ ] TEST telepítés és átvételi teszt sikeres.
- [ ] Első PROD migráció kézzel jóváhagyva és lefutott.
- [ ] PROD smoke teszt sikeres.
