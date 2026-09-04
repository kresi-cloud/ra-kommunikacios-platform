# Tesztterv

## Automata rétegek

| Réteg | Parancs | Fókusz |
|---|---|---|
| Lint és típus | `npm run lint`, `npm run typecheck` | statikus hibák, strict TypeScript |
| Unit/komponens | `npm test` | konfiguráció, időzóna, projekt-/feladatlogika, szerkesztési validáció, szabályozott Kanban drag-and-drop, ütközés-megerősítés, belépés, listák, naptári csoportosítás, kezdőlapi mutatók |
| Build/PWA | `npm run build` | kiadható csomag és service worker |
| Böngésző | `npm run test:e2e` | belépés, routing, reszponzív alap |
| Adatbázis | `npm run test:db` | anonim tiltás, projekt-/feladat-/eseményszeparáció, technikai admin tiltása, feladatelfogadás, határidő- és felelőselőzmény, atomi eseménylétrehozás, eseménymódosítás/válasz-reset/lemondás, részvételi válasz, foglaltság privacy |

## Belépési feltétel

PR csak zöld `npm run check` után egyesíthető. RLS-t érintő módosításhoz kötelező negatív adatbázisteszt. Állapotgépet érintő módosításhoz kötelező legalább egy engedélyezett és egy tiltott átmenet tesztje.

## Ismert helyi korlát

A böngészőteszthez Playwright Chromium, a DB-teszthez Dockerrel futó Supabase vagy elérhető teszt-adatbázis szükséges. Ha ezek hiányoznak, az eredmény nem jelölhető futtatottnak; a GitHub Actions mindkettőt előkészíti.
