# Tesztterv

## Automata rétegek

| Réteg | Parancs | Fókusz |
|---|---|---|
| Lint és típus | `npm run lint`, `npm run typecheck` | statikus hibák, strict TypeScript |
| Unit/komponens | `npm test` | konfiguráció, időzóna, projekt-/feladatlogika, szerkesztési validáció, szabályozott Kanban drag-and-drop, ütközés-megerősítés, belépés, listák, naptári csoportosítás, kezdőlapi mutatók, értesítési kézbesítési ablak (DST-vel), értesítési lista és beállítások |
| Build/PWA | `npm run build` | kiadható csomag és service worker |
| Böngésző | `npm run test:e2e` | belépés, routing, reszponzív alap |
| Adatbázis | `npm run test:db` | anonim tiltás, projekt-/feladat-/eseményszeparáció, technikai admin tiltása, feladatelfogadás, határidő- és felelőselőzmény, atomi eseménylétrehozás, eseménymódosítás/válasz-reset/lemondás, részvételi válasz, foglaltság privacy, tranzakciós értesítések, értesítés-RLS, olvasottság, kötelező beállítás védelme, kézbesítési ablak, emlékeztető-idempotencia, eseménylezárás, archiválás, Google busy-sync |

## Belépési feltétel

PR csak zöld `npm run check` után egyesíthető. RLS-t érintő módosításhoz kötelező negatív adatbázisteszt. Állapotgépet érintő módosításhoz kötelező legalább egy engedélyezett és egy tiltott átmenet tesztje. Értesítést vagy háttérfeladatot érintő módosításhoz kötelező az idempotencia tesztje (ugyanaz a futás kétszer nem ad új rekordot).

## Lefedett elfogadási tesztek (I1/B3)

TC-NOT-001, TC-NOT-002, TC-NOT-003, TC-NOT-006, TC-NOT-007, TC-NOT-008, TC-NOT-009, TC-NOT-010, TC-NOT-013, TC-INT-004, TC-INT-006, valamint a 20.3 „Befejezési idő után automatikusan Megtörtént” és a 20.5 kézbesítési tételei.

## Ismert helyi korlát

A böngészőteszthez Playwright Chromium, a DB-teszthez Dockerrel futó Supabase vagy elérhető teszt-adatbázis szükséges. Ha ezek hiányoznak, az eredmény nem jelölhető futtatottnak; a GitHub Actions mindkettőt előkészíti.
