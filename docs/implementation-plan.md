# Implementációs terv

## Állapot

| Inkrementum | Tartalom | Állapot |
|---|---|---|
| I0 | Auth, profil, RBAC/ABAC alap, RLS, audit, privát storage, PWA és CI | Implementálva; CI-vel ellenőrizve |
| I1/A | Projektmodell, hozzáférés, projektlista, projektállapotok | Implementálva |
| I1/B1 | Feladat- és eseménymodell, RLS/RPC, lista, agenda, kezdőlapi mutatók | Implementálva; CI-vel ellenőrizve |
| I1/B2 | Létrehozó/szerkesztő felületek, Kanban, résztvevők és elfoglaltság | Következő |
| I1/B3 | Értesítési outbox, időzített eseménylezárás, Google busy-sync alap | Következő |
| I2 | Fájlok, verziók, review és jóváhagyás | Tervezett |
| I3+ | Tartalom, publikáció, személyek/jogok, sajtó, riportok | Tervezett |

## Következő kis szállítási egység

1. Feladat- és eseménylétrehozó űrlapok jogosultságalapú műveletekkel.
2. Feladatadatlap és engedélyezett állapotváltó műveletek.
3. Eseményadatlap, résztvevőkezelés és válaszgombok.
4. Saját „Nem elérhető” idősáv és busy-only nézet.
5. Értesítési outbox alap, külső szolgáltató nélkül.

Minden egység csak releváns automata teszttel és frissített dokumentációval tekinthető késznek.
