# Implementációs terv

## Állapot

| Inkrementum | Tartalom | Állapot |
|---|---|---|
| I0 | Auth, profil, RBAC/ABAC alap, RLS, audit, privát storage, PWA és CI | Implementálva; a DB-integrációs futás CI-ben ellenőrzendő |
| I1/A | Projektmodell, hozzáférés, projektlista, projektállapotok | Implementálva |
| I1/B | Feladatok, események, naptár, értesítési alap | Következő |
| I2 | Fájlok, verziók, review és jóváhagyás | Tervezett |
| I3+ | Tartalom, publikáció, személyek/jogok, sajtó, riportok | Tervezett |

## Következő kis szállítási egység

1. Feladat- és eseménytáblák, RLS és audit.
2. Projekt részletező és feladatlista.
3. Budapest-időzónás naptárnézet.
4. Állapotátmenet- és RLS-tesztek.
5. Értesítési outbox alap, külső szolgáltató nélkül.

Minden egység csak releváns automata teszttel és frissített dokumentációval tekinthető késznek.

