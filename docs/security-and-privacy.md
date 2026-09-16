# Biztonság és adatvédelem

## Beépített kontrollok

- nincs nyilvános regisztráció;
- minden üzleti tábla RLS alatt áll;
- a technikai admin tartalmi hozzáférése tiltott;
- szerep- és jogosultság-adatok közvetlen kliensírása tiltott;
- az auditnapló append-only a kliens számára;
- minden storage bucket privát, klienspolicy nélkül;
- a frontend csak Supabase anon kulcsot használ;
- értesítés csak szerveroldali kódból keletkezik, a `body_safe` szöveg érzékeny személyes adatot nem tartalmazhat, mert külső csatornán is megjelenhet;
- a kritikus, biztonsági, fiók- és jogosultsági értesítés külső csatornája nem kapcsolható ki;
- a konfiguráció hiányát az alkalmazás biztonságosan jelzi.

## Üzembe állítás előtt

- MFA kikényszerítése a specifikáció szerinti szerepekre;
- OAuth redirectek és engedélyezett domainek szűkítése;
- CSP, HSTS és további HTTP fejlécek beállítása a tárhelyen;
- PITR/backup, naplómegőrzés és visszaállítási próba igazolása;
- storage karantén- és signed URL folyamat implementálása I2-ben;
- adatmegőrzési idők és adatvédelmi kapcsolattartó: `[CONFIGURE_ME]`.

Éles adatot fejlesztői vagy preview környezetbe másolni tilos.

