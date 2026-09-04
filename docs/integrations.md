# Integrációk

## Aktív technikai integráció

- Supabase Auth és PostgreSQL: a környezeti változók megadása után működik.
- Google OAuth: a Supabase dashboardban engedélyezendő; redirect URL: `[CONFIGURE_ME]`.

## Későbbi integrációk

E-mail/szolgáltatói értesítés, naptárexport, kommunikációs csatornák, vírusellenőrzés és külső publikációs kapcsolatok csak outbox/idempotens szerveroldali folyamaton keresztül kerülhetnek be. Szolgáltatói titok nem kerülhet a kliensbe vagy a naplóba.

Nyitott értékek: feladó domain, szolgáltatók, callback URL-ek, webhook titkok és csatornaazonosítók `[CONFIGURE_ME]`.

