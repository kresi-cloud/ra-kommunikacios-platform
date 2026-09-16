# Pilot-ágensek

Ez a csomag nem teszt a szó CI-értelmében: valódi Supabase Auth fiókokkal, a
valódi RPC-ken és RLS-en keresztül használja a rendszert, ahogy egy
kommunikációs vezető, egy projektgazda és egy munkatárs tenné egy átlagos
napon. Célja élő adat és élő értesítés termelése a TEST környezetben, mielőtt
valódi emberek kezdik használni a pilotot.

A szkript **nem** helyettesíti a valódi pilotot. Csak azt találja meg, amit
előre megírtunk bele; a felhasználói élményt, a hiányzó funkciókat és a
félreérthető szövegeket csak valódi emberek visszajelzése mutatja meg.

## Mit csinál egy futás

1. A kommunikációs vezető projektet nyit, és feladatot oszt a projektgazdának.
2. A projektgazda elfogadja a feladatot (a vezető erről értesítést kap).
3. A projektgazda eseményt ütemez, és meghívja a munkatársat.
4. A munkatárs elolvassa az értesítéseit, visszaigazolja a részvételt, majd
   mindent olvasottá jelöl.
5. A vezető ellenőrzi a saját legutóbbi értesítéseit.
6. Ha van negyedik (technikai admin) fiók, egy negatív RLS-ellenőrzés is fut:
   a technikai admin nem láthat projekt- vagy feladatadatot.

Minden lépés magyar nyelvű sort ír a konzolra (✅/❌), a végén összegzést ad,
és a folyamat hibás kilépési kóddal áll le, ha bármelyik lépés hibázott.

## Előfeltétel: fiókok létrehozása a TEST Supabase projektben

Nyilvános regisztráció nincs, ezért a fiókokat kézzel kell létrehozni:

1. Supabase Dashboard → a TEST projekt → **Authentication → Users → Add user**.
2. Hozz létre három (opcionálisan négy) fiktív fiókot, **Auto Confirm User**
   bekapcsolva, e-mail/jelszó típussal. Csak `@example.test` vagy hasonló,
   egyértelműen fiktív domain használható – a repository publikus.
3. Futtasd a [seed-profiles.sql](seed-profiles.sql) szkriptet a fenti
   fiókok e-mail címeivel (lásd a fájl tetején a pontos parancsot). Ez hozza
   létre a `profiles` és `user_role_assignments` rekordokat a megfelelő
   szerepekkel (Kommunikációs vezető, Projektgazda, Munkatárs, opcionálisan
   Technikai admin).

## Helyi futtatás

```bash
cp scripts/pilot-agents/.env.pilot-agents.example scripts/pilot-agents/.env.pilot-agents
# töltsd ki a TEST Supabase URL-t, anon kulcsot és a három fiók adatait
node --env-file=scripts/pilot-agents/.env.pilot-agents scripts/pilot-agents/run.mjs
```

## Kézi indítás GitHub Actionből

A [pilot-agents.yml](../../.github/workflows/pilot-agents.yml) munkafolyamat
`workflow_dispatch`-csel indítható az Actions fülön. A TEST környezet
(`test` GitHub Environment) alábbi secretjeit használja:

- `PILOT_SUPABASE_URL`, `PILOT_SUPABASE_ANON_KEY`
- `PILOT_LEAD_EMAIL` / `PILOT_LEAD_PASSWORD`
- `PILOT_OWNER_EMAIL` / `PILOT_OWNER_PASSWORD`
- `PILOT_STAFF_EMAIL` / `PILOT_STAFF_PASSWORD`
- `PILOT_ADMIN_EMAIL` / `PILOT_ADMIN_PASSWORD` (opcionális)

## Korlátok

- Csak azt ellenőrzi, amit a forgatókönyv előre megír; nem fedezi fel a
  használhatósági hibákat.
- Minden futás új projektet, feladatot és eseményt hoz létre (a cím
  időbélyeget kap), ezért ismételt futtatás nem torlódik ugyanarra a
  rekordra, de a TEST adatbázisban lassan gyűlik a próbaadat. Időnként érdemes
  a TEST projektet visszaállítani vagy takarítani.
- Az e-mail és push kézbesítés még nincs bekötve (I1/B4), ezért a szkript
  csak az alkalmazáson belüli értesítéseket ellenőrzi.
