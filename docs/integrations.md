# Integrációk

## Aktív technikai integráció

- Supabase Auth és PostgreSQL: a környezeti változók megadása után működik.
- Google OAuth (belépés): a Supabase dashboardban engedélyezendő; redirect URL: `[CONFIGURE_ME]`.

## Értesítési outbox

Minden értesítés először alkalmazáson belüli rekordként jön létre a `notifications` táblában, csatornánként `notification_deliveries` sorral. Az alkalmazáson belüli csatorna azonnal kézbesített; az e-mail és push sor `queued` állapotban várja a külső kézbesítőt, amely még nem kapcsolódik. A kézbesítő szerződése:

- csak `deliver_after <= now()` értesítést küld;
- a `body_safe` szövegen kívül más tartalmat nem visz ki;
- sikeres küldésnél `delivered`, `delivered_at`, `provider_message_id`; hibánál `failed`, `error_code`, `attempt_count` növelése, majd exponenciális újrapróbálás;
- külső hiba az üzleti tranzakciót nem érinti.

## Google Calendar busy-sync alap

A `calendar_connections` tábla a kapcsolat állapotát (`connected`, `error`, `revoked`), az utolsó szinkron idejét és a hibakódot tárolja. A szinkronizáló szerveroldali folyamat a `private.sync_google_busy_blocks` függvénynek csak kezdést, véget és biztonságos hash-t ad át; cím, résztvevő és leírás nem tárolható. A hiányzó hash-ek aktív foglaltsága visszavonódik. A felhasználó a naptár oldalon a kapcsolatot visszavonhatja, ekkor a Google-forrású foglaltság is visszavonásra kerül. Az OAuth refresh token kizárólag szerveroldali titoktárban lehet; Edge Function és ütemezés: `[CONFIGURE_ME]`.

## Későbbi integrációk

E-mail/szolgáltatói értesítés, naptárexport, kommunikációs csatornák, vírusellenőrzés és külső publikációs kapcsolatok csak outbox/idempotens szerveroldali folyamaton keresztül kerülhetnek be. Szolgáltatói titok nem kerülhet a kliensbe vagy a naplóba.

Nyitott értékek: feladó domain, szolgáltatók, callback URL-ek, webhook titkok és csatornaazonosítók `[CONFIGURE_ME]`.
