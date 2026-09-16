# Implementációs terv

## Állapot

| Inkrementum | Tartalom | Állapot |
|---|---|---|
| I0 | Auth, profil, RBAC/ABAC alap, RLS, audit, privát storage, PWA és CI | Implementálva; CI-vel ellenőrizve |
| I1/A | Projektmodell, hozzáférés, projektlista, projektállapotok | Implementálva |
| I1/B1 | Feladat- és eseménymodell, RLS/RPC, lista, agenda, kezdőlapi mutatók | Implementálva; CI-vel ellenőrizve |
| I1/B2a | Létrehozás, adatlapok, Kanban, résztvevők és elfoglaltság | Implementálva; CI-vel ellenőrizve |
| I1/B2b | Határidő-/felelősszerkesztés, esemény átütemezés/lemondás, Kanban drag-and-drop | Implementálva; CI-vel ellenőrizve |
| I1/B3 | Értesítési outbox, tranzakciós értesítési események, időzített eseménylezárás, határidős automatizmusok, Google busy-sync alap | Implementálva; CI-ellenőrzés a PR-ban |
| I1/B4 | Külső kézbesítő (e-mail, push) az outboxból, napi összefoglaló, válaszhiány-figyelmeztetés, Google OAuth-kapcsolat | Következő |
| I2 | Fájlok, verziók, review és jóváhagyás | Tervezett |
| I3+ | Tartalom, publikáció, személyek/jogok, sajtó, riportok | Tervezett |

## I1/B3 tartalma

- `notifications`, `notification_deliveries`, `notification_preferences`, `calendar_connections`, `job_runs` táblák RLS alatt;
- a feladat- és esemény-RPC-k változatlan aláírással, ugyanabban a tranzakcióban írják az értesítési eseményt (A16, 5. és 6. fejezet);
- idempotens `job_key`, kezdeményező kihagyása, inaktív címzett kihagyása, 08:00–20:00 kézbesítési ablak Europe/Budapest szerint, csoportkulcs a normál eseményekhez;
- alkalmazáson belüli értesítési lista, olvasottság, számláló, felhasználói e-mail/push beállítás a kötelező típusok védelmével;
- ütemezett automatizmusok: 24/2 órás emlékeztető, esedékesség, késedelem (A10–A13), eseménylezárás `occurred` állapotba (A15), 7 napos archiválás (A20), 1 éves megőrzés (A21), naplózott `job_runs`;
- Google busy-sync alap: kapcsolatállapot, privacy-safe foglaltság-szinkron RPC, felhasználói visszavonás.

Nyitott döntés: a késedelmes (`task.overdue`) értesítés a határidő után 24 órával készül; a specifikáció csak „elmúlt” határidőt ír, az érték `[CONFIGURE_ME]` jellegű üzleti paraméter.

## Következő kis szállítási egység

1. Outbox-feldolgozó szerveroldali végpont e-mail csatornára, újrapróbálással és `notification_deliveries` naplóval (TC-NOT-011).
2. Napi 08:00 összefoglaló (A19) és kötelező válaszidő lejáratának figyelmeztetése (A17).
3. Google OAuth-kapcsolat létrehozása Edge Functionnel és ütemezett busy-sync a meglévő `private.sync_google_busy_blocks` RPC-re.

Minden egység csak releváns automata teszttel és frissített dokumentációval tekinthető késznek.
