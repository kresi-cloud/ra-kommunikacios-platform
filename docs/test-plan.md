# Tesztterv

## Automata rétegek

| Réteg | Parancs | Fókusz |
|---|---|---|
| Lint és típus | `npm run lint`, `npm run typecheck` | statikus hibák, strict TypeScript |
| Unit/komponens | `npm test` | konfiguráció, időzóna, projektlogika, belépés, listaállapotok |
| Build/PWA | `npm run build` | kiadható csomag és service worker |
| Böngésző | `npm run test:e2e` | belépés, routing, reszponzív alap |
| Adatbázis | `npm run test:db` | anonim tiltás, projektszeparáció, technikai admin tiltása |

## Belépési feltétel

PR csak zöld `npm run check` után egyesíthető. RLS-t érintő módosításhoz kötelező negatív adatbázisteszt. Állapotgépet érintő módosításhoz kötelező legalább egy engedélyezett és egy tiltott átmenet tesztje.

## Ismert helyi korlát

A böngészőteszthez Playwright Chromium, a DB-teszthez Dockerrel futó Supabase vagy elérhető teszt-adatbázis szükséges. Ha ezek hiányoznak, az eredmény nem jelölhető futtatottnak; a GitHub Actions mindkettőt előkészíti.

