# Implementációs terv

## Állapot

| Inkrementum | Tartalom | Állapot |
|---|---|---|
| I0 | Auth, profil, RBAC/ABAC alap, RLS, audit, privát storage, PWA és CI | Implementálva; CI-vel ellenőrizve |
| I1/A | Projektmodell, hozzáférés, projektlista, projektállapotok | Implementálva |
| I1/B1 | Feladat- és eseménymodell, RLS/RPC, lista, agenda, kezdőlapi mutatók | Implementálva; CI-vel ellenőrizve |
| I1/B2a | Létrehozás, adatlapok, Kanban, résztvevők és elfoglaltság | Implementálva; CI-vel ellenőrizve |
| I1/B2b | Határidő-/felelősszerkesztés, esemény átütemezés/lemondás, Kanban drag-and-drop | Implementálva; CI-vel ellenőrizve |
| I1/B3 | Értesítési outbox, időzített eseménylezárás, Google busy-sync alap | Következő |
| I2 | Fájlok, verziók, review és jóváhagyás | Tervezett |
| I3+ | Tartalom, publikáció, személyek/jogok, sajtó, riportok | Tervezett |

## Következő kis szállítási egység

1. Értesítési outbox alap, külső szolgáltató nélkül.
2. Határidő- és eseményváltozások tranzakciós értesítési eseményei.
3. Időzített eseménylezárás és Google busy-sync alap.

Minden egység csak releváns automata teszttel és frissített dokumentációval tekinthető késznek.
