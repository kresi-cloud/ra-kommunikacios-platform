# Rátgéber Akadémia kommunikációs platform

## Új háttérrendszer (SQLite + Hono + Drizzle + better-auth) – 1.0

**Dokumentum állapota:** a jelenleg megvalósított állapot leírása (nem terv)
**Munkanyelv:** magyar
**Kapcsolódó dokumentumok:** `docs/architecture-migration.md` (indoklás, átállási napló), `docs/implementation-plan.md` (inkrementumok állapota)

---

## 1. Cél és hatókör

Ez a dokumentum a Supabase-ről egy önhosztolt, SQLite-alapú háttérrendszerre
történő átállás **eddig elkészült** részét írja le fejlesztői pontossággal:
mit tartalmaz az adatmodell, hogyan működik a jogosultságkezelés RLS
nélkül, milyen API-végpontok élnek, és milyen fejlesztői eszközök állnak
rendelkezésre. Nem tartalmazza a még hátralévő portolást (feladatok,
események, naptár, értesítések) – ezekhez lásd `docs/implementation-plan.md`
"Következő kis szállítási egység" szakaszát.

### 1.1. Előzmény

A repository Lovable-eredetű scaffoldja Supabase-t (Postgres + RLS + Auth +
Storage) használt; ez nem tudatos architektúraválasztás volt. A csapat
döntése alapján ezt egy önhosztolt, fájl-alapú SQLite adattár váltja fel,
elkerülve a külső szolgáltatásfüggést. Az átállás fokozatos, funkciónkénti
vertikális szeletekben halad, mert az azonosítás és a régi RLS
elválaszthatatlanul összefügg: amint az auth lekerül a Supabase-ről, a még
ott lévő táblák RLS-szabályai nem tudják azonosítani a felhasználót.

### 1.2. Eddig elkészült funkcionális szeletek

- Azonosítás, munkamenet, szerepek, jogosultságok, audit (a korábbi I0
  inkrementum megfelelője).
- Projektmodell: létrehozás, listázás, állapotátmenet (a korábbi I1/A
  megfelelője).
- Feladatmodell: létrehozás, teljes állapotgép, határidő-módosítás,
  átadás, jogosultság-lekérdezés (a korábbi I1/B1 megfelelője).
- Fejlesztői gyorsbelépés szerepkörönkénti demó-fiókokkal.

### 1.3. Még nem portolt

Események/naptár, értesítési outbox és a hozzájuk tartozó felületi
adatlekérés továbbra is a Supabase-en fut (lásd 8. fejezet).

---

## 2. Architektúra

### 2.1. Komponensek

| Réteg | Technológia | Elhelyezkedés |
|---|---|---|
| Adattár | SQLite fájl, `better-sqlite3` driver | `data/ra-kommunikacios-platform.sqlite` |
| ORM és migráció | Drizzle ORM, verziózott SQL-migrációk | `server/db/schema.ts`, `server/db/auth-schema.ts`, `server/db/migrations/` |
| API-szerver | Hono | `server/index.ts` |
| Fejlesztői futtatás | `@hono/vite-dev-server`, egy folyamatban a Vite-tal | `vite.config.ts` |
| Éles/önálló futtatás | `@hono/node-server`, statikus `dist/` kiszolgálással | `server/serve.ts` |
| Azonosítás | better-auth (Google OAuth + e-mail/jelszó) | `server/auth.ts` |
| Kliens (böngésző) | React 19, TypeScript, TanStack Query | `src/` |

### 2.2. Futási kép fejlesztésben

A `npm run dev` egyetlen Vite-folyamatban futtatja a frontendet és a Hono
API-t. A `@hono/vite-dev-server` plugin (lásd `vite.config.ts`) alapból
minden kérést a Hono felé továbbítana; ez a "/" gyökeret is 404-re váltaná,
ezért a plugin `exclude` beállítása explicit módon csak a `/api/*` alatti
kéréseket engedi a Hono felé, minden mást a Vite maga szolgál ki.

A szerver induláskor (`server/index.ts`):

1. lefuttatja a migrációkat (`runMigrations()`);
2. ha `NODE_ENV !== 'production'`, létrehozza a fejlesztői demó-fiókokat
   (`ensureDevPersonas()`, lásd 7. fejezet);
3. felregisztrálja a better-auth kezelőt (`/api/auth/*`);
4. felregisztrálja az üzleti route-okat (jelenleg: projektek).

### 2.3. Futási kép élesben

A `server/serve.ts` egy önálló Node-folyamatot indít (`@hono/node-server`),
amely a `dist/` mappából szolgálja ki a statikus frontendet, és ugyanazt a
Hono app-ot (`server/index.ts`) használja az API-hoz. **Nyitott kérdés:**
a korábbi terv Cloudflare Pages statikus hosztingra épült; egy állandóan
futó Node-folyamat más hosztingmodellt igényel (pl. Fly.io, Railway, VPS,
vagy Cloudflare Workers + D1). Ez `[CONFIGURE_ME]`.

---

## 3. Adatmodell

### 3.1. Azonosítási táblák (`server/db/auth-schema.ts`, better-auth generálja)

A séma a `npm run auth:generate` paranccsal generálódik a `server/auth.ts`
konfigurációból; kézzel nem szerkesztendő.

- **`user`**: `id`, `name`, `email` (egyedi), `emailVerified`, `image`,
  `createdAt`, `updatedAt`, valamint kiegészítő mezők: `display_name`
  (kötelező), `job_title`, `organizational_unit`, `is_internal_member`
  (alapértelmezett `true`), `account_status` (alapértelmezett
  `activation_pending`), `external_expires_at`. Nincs külön
  `auth.users`/`public.profiles` séma-elválasztás, mint a Supabase-nél.
- **`session`**: `id`, `expiresAt`, `token` (egyedi), `ipAddress`,
  `userAgent`, `userId` (idegen kulcs, `onDelete: cascade`).
- **`account`**: `id`, `accountId`, `providerId` (`"credential"`
  e-mail/jelszónál), `userId`, `password` (hash), OAuth-tokenmezők.
- **`verification`**: token-alapú folyamatokhoz (e-mail megerősítés stb.).

### 3.2. Üzleti táblák (`server/db/schema.ts`)

A Supabase-migrációk mechanikus, de gondos SQLite-fordítása. Típusleképezés:
`uuid → text` (alkalmazáskódban generált `crypto.randomUUID()`),
`timestamptz → text` (ISO 8601 string, `new Date().toISOString()`),
`boolean → integer` (Drizzle `{mode: 'boolean'}`), `enum → text` (Drizzle
`{enum: [...]}` típusszinten kikényszerítve).

| Tábla | Cél | Főbb mezők |
|---|---|---|
| `roles` | Szerepkör-katalógus | `id`, `code` (enum: `communication_lead`, `technical_admin`, `project_owner`, `staff_member`, `privacy_legal_officer`, `namesake`, `external_contributor`), `nameHu`, `requiresMfa`, `isActive` |
| `permissions` | Egyedi jogosultság-katalógus | `id`, `code`, `nameHu`, `isActive` |
| `userRoleAssignments` | Szerepkiosztás, időbeli és scope-os érvényességgel | `userId`, `roleId`, `scopeType` (`global`/`project`/`content`/`task`/`event`), `scopeId`, `validFrom`, `validUntil`, `appointedBy`, `initiatedBy`, `revokedAt`, `reason` |
| `userPermissionGrants` | Egyedi jogosultság-kiosztás | ugyanaz a mintázat, mint fent, `permissionId`-vel |
| `auditLog` | Append-only auditnapló | `occurredAt`, `actorUserId`, `actorType` (`user`/`system`/`service`), `action`, `entityType`, `entityId`, `projectId`, `oldValues`/`newValues` (JSON), `reason` |
| `seasons` | Szezonkatalógus | `title`, `startsOn`, `endsOn` |
| `projects` | Projekt | `projectCode` (egyedi, `RA-PROJ-ÉÉÉÉ-XXXXXXXXXX` alakban generált), `title`, `summary`, `objective`, `ownerUserId`, `startsOn`, `endsOn`, `seasonId`, `status` (enum: `draft`/`active`/`closed`/`archived`), `closedAt`/`closedBy`, `archivedAt`/`archivedBy`, `deletedAt`/`deletedBy` (soft delete) |
| `projectMembers` | Projekttagság | `projectId`, `userId`, `membershipRole` (`owner`/`member`), `addedBy`, `addedAt`, `leftAt` |
| `projectCriticalBlocks` | Aktív kritikus blokkok (lezárást gátolják) | `projectId`, `description`, `raisedBy`, `raisedAt`, `resolvedAt`, `resolvedBy` |
| `tasks` | Feladat | `taskCode` (egyedi, `RA-TASK-ÉÉÉÉ-XXXXXXXX`), `title`, `responsibleUserId`, `projectId`, `status` (enum, 10 érték: `draft`…`archived`), `acceptanceStatus` (enum, 5 érték), `priority` (`normal`/`critical`), `dueAt`, `unscheduled`, `requiresReview`, `reviewerUserId`, `startedAt`, `completedAt`/`completedBy`, `withdrawnAt`/`withdrawnBy`. A `contentId` és `eventId` egyelőre idegen kulcs nélküli sima mező, mert a hozzájuk tartozó tábla (I2, illetve I1/B2) még nem portolt – ugyanígy jelezte ezt az eredeti Postgres-migráció is a `content_id`-nál. |
| `taskAssignmentsHistory` | Felelősváltás append-only előzménye | `taskId`, `fromUserId`, `toUserId`, `reason`, `changedBy`, `changedAt` |
| `taskDeadlineHistory` | Határidő-módosítás append-only előzménye | `taskId`, `oldDueAt`, `newDueAt`, `reason`, `changedBy`, `changedAt` |
| `taskBlockDetails` | Aktív/lezárt blokk-részletek | `taskId`, `blockReasonCode`, `details`, `startedAt`, `resolvedAt`/`resolvedBy`/`resolutionNote` |

Egyedi kényszerek: egy felhasználónak egy adott szerepre/scope-ra csak egy
aktív (nem visszavont) kiosztása lehet (`user_role_assignments_active_unique`);
egy felhasználó egy projektben csak egy aktív tagsággal rendelkezhet
(`project_members_active_unique`); egy feladatnak csak egy aktív
(le nem zárt) blokkja lehet (`task_active_block_unique`).

---

## 4. Jogosultsági modell (`server/authz.ts`)

SQLite-nak nincs sor szintű biztonsági mechanizmusa (RLS). Ami a korábbi
rendszerben Postgres `security definer` függvényként és RLS-policyként élt,
az itt **alkalmazáskódban**, explicit függvényhívásokként fut. Ez a
legnagyobb kockázati pont az átállásban: egy elfelejtett hívás itt nem
adatbázis-szintű hibaként, hanem csendes adatszivárgásként jelentkezne.

| Korábbi Postgres-elem | Új függvény | Viselkedés |
|---|---|---|
| `private.is_active_user()` | `isActiveUser(db, userId)` | `account_status = 'active'` és (belső tag vagy `external_expires_at` a jövőben) |
| `private.has_role()` | `hasRole(db, userId, roleCode, scope?)` | Aktív, nem visszavont, időben érvényes; `global` scope bármely kérésre igaz, egyébként scope-egyezés kell |
| `private.has_permission()` | `hasPermission(db, userId, code, scope?)` | Ugyanaz a mintázat, `user_permission_grants`-re |
| `private.is_communication_lead()` / `is_technical_admin()` | `isCommunicationLead()` / `isTechnicalAdmin()` | `hasRole()` a megfelelő kóddal |
| `private.is_project_owner()` | `isProjectOwner(db, userId, projectId)` | Pusztán `projects.ownerUserId` egyezik-e; NEM követeli meg a `project_owner` szerepet is – azt a `transition_project`/`transition_task` az eredetihez híven, saját belső ellenőrzésként, inline adja hozzá szükség esetén |
| `private.is_project_member()` | `isProjectMember(db, userId, projectId)` | Aktív (`leftAt is null`) `project_members` sor |
| `private.can_access_project()` | `canAccessProject(db, userId, projectId)` | Technikai admin sosem; kommunikációs vezető mindig; egyébként gazda vagy tag |
| `private.can_access_task()` | `canAccessTask(db, userId, taskId)` | Technikai admin sosem; kommunikációs vezető vagy a feladat felelőse mindig; egyébként a feladat projektjéhez való hozzáférés dönt |

Hibaosztályok: `ForbiddenError` (403), `ValidationError` (422),
`NotFoundError` (404) – a route-réteg ezekből képez HTTP-választ
(`server/routes/projects.ts`, `server/routes/tasks.ts` `errorResponse()`).

**Tesztlefedettség:** `server/authz.test.ts` (11 teszt: aktív/inaktív fiók,
global vs. projekt-scope szerep, visszavont szerep, technikai admin
tiltása, feladathoz való hozzáférés saját/idegen/admin esetben) valós,
memóriabeli SQLite ellen.

---

## 5. Szolgáltatás- és route-réteg

### 5.1. `server/services/projects.ts`

- **`createProject(db, actingUserId, input)`**: technikai admin tiltva;
  kommunikációs vezető vagy `create_project` jogosultság szükséges; cím
  1–250 karakter; a gazdának aktív, belső felhasználónak kell lennie;
  automatikusan generált projektkód; `project_members` sor is létrejön a
  gazdára; audit: `project.created`.
- **`transitionProject(db, actingUserId, projectId, targetStatus, reason)`**:
  engedélyezett átmenetek szó szerint az eredeti Postgres-logikát követik:
  `draft → active` szabadon; `active → closed` csak nyitott kritikus blokk
  nélkül; `closed → archived` csak vezetőnek; `closed`/`archived → active`
  csak vezetőnek, kötelező indoklással. Minden más átmenet elutasítva.
  Audit: `project.transitioned`.

**Tesztlefedettség:** `server/services/projects.test.ts` (10 teszt): minden
fenti szabály pozitív és negatív esete.

### 5.2. `server/routes/projects.ts` – API-szerződés

| Végpont | Módszer | Bemenet (JSON) | Válasz | Hiba |
|---|---|---|---|---|
| `/api/projects` | GET | – | `{ projects: Project[] }` (a hívó számára látható, nem törölt projektek, `updatedAt` szerint csökkenő sorrendben, max. 100) | 403, ha nincs bejelentkezve |
| `/api/projects` | POST | `{ title, ownerUserId, summary?, objective?, startsOn?, endsOn?, seasonId? }` (zod-validált) | `{ project: Project }`, 201 | 403/422/500 |
| `/api/projects/:id/transition` | POST | `{ targetStatus, reason? }` (zod-validált enum) | `{ project: Project }` | 403/404/422/500 |

A `GET /api/projects` a látható projekteket úgy állítja elő, hogy
lekérdezi az összes nem törölt projektet, majd soronként meghívja a
`canAccessProject()` ellenőrzést – ez a legegyszerűbb, de nem a
leghatékonyabb megoldás sok projekt esetén; nagyobb adatmennyiségnél
érdemes lehet SQL-szintű szűrésre váltani.

### 5.3. `server/services/tasks.ts`

- **`createTask(db, actingUserId, input)`**: technikai admin tiltva;
  projekt nélküli feladatot csak vezető vagy saját magának hozhat létre a
  felelős; projektes feladathoz vezető vagy a projekt gazdája (`isProjectOwner`)
  szükséges; cím 1–250 karakter; a felelősnek aktív, kijelölhető
  felhasználónak kell lennie; kritikus prioritáshoz indoklás, felülvizsgálat
  igényéhez felülvizsgáló kötelező; `task_assignments_history` sor is
  létrejön; audit: `task.created`.
- **`transitionTask(db, actingUserId, taskId, targetStatus, reason, newDueAt, confirmExistingDue)`**:
  a teljes, tíz állapotos állapotgép (lásd `docs/state-machines.md` "Feladat"
  szakasza) szó szerint az eredeti Postgres-logikát követi: ki jogosult az
  egyes átmenetekre, mikor kötelező az indoklás, mikor kell blokk-részletet
  vagy határidő-előzményt írni. Audit: `task.transitioned`.
- **`changeTaskDeadline(db, actingUserId, taskId, targetDueAt, reason)`**:
  lezárt/visszavont/archivált feladatnál tiltva; indoklás kötelező;
  visszamenőleges határidőt csak a vezető adhat; append-only előzményt ír.
- **`reassignTask(db, actingUserId, taskId, newResponsibleUserId, reason)`**:
  lezárt, visszavont, archivált vagy blokkolt feladat nem adható át; az új
  felelősnek aktív, kijelölhető, nem technikai admin felhasználónak kell
  lennie; az átadás a feladatot `assigned`/`pending` állapotba állítja
  vissza, és felelősváltás-előzményt ír.
- **`getTaskCapabilities(db, actingUserId, taskId)`**: `{ canChangeDeadline, canReassign }`
  – a felület ezzel dönti el, mely műveleti felületeket jelenítse meg.

**Tesztlefedettség:** `server/services/tasks.test.ts` (21 teszt): minden
fenti szabály pozitív és negatív esete, beleértve a projekthez kötött
feladatok jogosultsági eseteit is.

### 5.4. `server/routes/tasks.ts` – API-szerződés

| Végpont | Módszer | Bemenet (JSON) | Válasz | Hiba |
|---|---|---|---|---|
| `/api/tasks` | GET | Query: `onlyOpen` (alapértelmezett `true`) | `{ tasks: Task[] }` (a hívó számára látható feladatok, határidő szerint növekvő sorrendben, max. 200) | 403 |
| `/api/tasks/:id` | GET | – | `{ task: Task }` | 403/404 |
| `/api/tasks/:id/capabilities` | GET | – | `{ canChangeDeadline, canReassign }` | 403/404 |
| `/api/tasks` | POST | `{ title, responsibleUserId, projectId?, description?, dueAt?, priority?, requiresReview?, reviewerUserId?, assignImmediately?, criticalReason? }` | `{ task: Task }`, 201 | 403/422/500 |
| `/api/tasks/:id/transition` | POST | `{ targetStatus, reason?, newDueAt?, confirmExistingDue? }` | `{ task: Task }` | 403/404/422/500 |
| `/api/tasks/:id/deadline` | POST | `{ dueAt, reason }` | `{ task: Task }` | 403/404/422/500 |
| `/api/tasks/:id/reassign` | POST | `{ responsibleUserId, reason }` | `{ task: Task }` | 403/404/422/500 |

A `GET /api/tasks` ugyanazt a "lekérdezés, majd soronkénti jogosultság-
ellenőrzés" mintát követi, mint a projekteknél (lásd 5.2), ugyanazzal a
teljesítménybeli korláttal nagy adatmennyiségnél.

### 5.5. Egyéb végpontok (`server/index.ts`)

- `GET/POST /api/auth/*`: a better-auth kezelője (bejelentkezés,
  kijelentkezés, munkamenet-lekérdezés, OAuth-callback stb.).
- `GET /api/me`: `{ user: User | null }` – a hívó saját munkamenet-adata.

---

## 6. Azonosítás (`server/auth.ts`)

- **Módok:** Google OAuth (`socialProviders.google`, csak ha
  `GOOGLE_CLIENT_ID` be van állítva) és e-mail/jelszó
  (`emailAndPassword.enabled`, minimum jelszóhossz 12 karakter).
- **Nyilvános regisztráció tiltva:** `emailAndPassword.disableSignUp: true`
  – ez a korábbi "meghívásos felhasználókezelés" elv folytatása. Az első
  fiók létrehozásához lásd 7. fejezet.
- **Munkamenet-azonosító generálás:** `advanced.database.generateId`
  `crypto.randomUUID()`-t használ, konzisztensen az üzleti táblák
  elsődleges kulcsaival.
- **CSRF/origin-ellenőrzés:** a better-auth elutasítja azokat a kéréseket,
  amelyek `Origin` fejléce nincs a `trustedOrigins` listában. Mivel a helyi
  Vite dev szerver portja gépenként eltérhet (lásd `vite.config.ts`
  `PORT`/`autoPort` kezelését), `BETTER_AUTH_URL` hiányában a
  `trustedOrigins` egy `http://localhost:*` mintát tartalmaz – ez kizárólag
  localhost-originokra illeszkedik. Élesben mindig konkrét
  `BETTER_AUTH_URL`-t kell megadni.

---

## 7. Fejlesztői eszközök

### 7.1. Bootstrap: az első valódi fiók

```bash
npm run auth:bootstrap-admin -- --email=... --password=... --name="..."
```

A `server/scripts/bootstrap-admin.ts` pontosan a better-auth saját
`/sign-up/email` végpontjának lépéseit követi (user + credential account
létrehozása, jelszó-hashelés a `better-auth/crypto` `hashPassword`
függvényével), és rögtön Kommunikációs vezető szerepet ad a fióknak.

### 7.2. Fejlesztői gyorsbelépés

A `shared/dev-personas.ts` négy fix demó-fiókot ír le, egyet-egyet a
Kommunikációs vezető, Projektgazda, Munkatárs és Technikai admin
szerepkörre (`lead@dev.local`, `owner@dev.local`, `staff@dev.local`,
`admin@dev.local`, közös `fejleszto1234` jelszóval).

- **`server/dev-seed.ts`** (`ensureDevPersonas()`): idempotensen létrehozza
  ezeket a fiókokat és a hozzájuk tartozó szerepeket; a szerver induláskor
  hívja, **kizárólag ha `NODE_ENV !== 'production'`**.
- **`src/pages/LoginPage.tsx`**: "Fejlesztői gyorsbelépés" panel, kizárólag
  `import.meta.env.DEV` alatt jelenik meg – egy kattintással bejelentkezik
  a kiválasztott szerepkörű fiókkal, ugyanazon a `signIn.email` híváson
  keresztül, mint a valódi bejelentkezés (nem külön, "hátsó ajtós" út).

**Ellenőrzött garancia:** a `npm run build` utáni `dist/` kimenetben nulla
találat van a demó-jelszóra és a panel szövegére – a fejlesztői kód és a
jelszavak Vite holt kód-eltávolítással kikerülnek az éles buildből.

### 7.3. Séma- és migrációkezelés

```bash
npm run auth:generate   # better-auth séma frissítése server/auth.ts változás után
npm run db:generate     # SQL-migráció generálása a teljes sémából (auth-schema.ts + schema.ts)
npm run db:migrate      # migrációk kézi alkalmazása (a szerver induláskor is lefuttatja)
```

---

## 8. Frontend átkötési állapot

| Terület | Állapot | Érintett fájlok |
|---|---|---|
| Bejelentkezés | **Átkötve** | `src/lib/auth-client.ts`, `src/auth/AuthProvider.tsx`, `src/pages/LoginPage.tsx` |
| Projektoldal | **Átkötve** (lista + létrehozás) | `src/api/projects.ts`, `src/domain/projects.ts`, `src/pages/ProjectsPage.tsx` |
| Feladatoldalak | **Átkötve** (lista, adatlap, létrehozás, állapotátmenet, határidő, átadás, kezdőlapi mutató) | `src/api/tasks.ts`, `src/domain/tasks.ts`, `src/pages/TasksPage.tsx`, `src/pages/TaskDetailPage.tsx`, `src/pages/DashboardPage.tsx` |
| Naptár projekt-legördülője | **Átkötve** csak a projektlistázás | `src/pages/CalendarPage.tsx` (`listProjects()` hívás) |
| Események, naptár (adat), értesítések | **Nincs átkötve** | továbbra is `src/lib/supabase.ts` kliens |

`AuthProvider`-ben a `session.user.{id,email}` alak szándékosan megegyezik
a korábbi Supabase `Session` minimális részhalmazával, hogy a még nem
portolt oldalak ne törjenek el. **Fontos mellékhatás:** mivel az
azonosítás lekerült a Supabase-ről, az esemény-/naptár-/értesítésoldalak
mostantól RLS-hibát kapnak (nincs Supabase-munkamenet), és az általános
hibabannereket mutatják (pl. "A naptár betöltése nem sikerült.") – ez a
portolásukig várt, dokumentált állapot, nem tényleges hiba.

A `ProjectsPage` létrehozó űrlapján a gazda kijelölése, a `TasksPage`
felelős-választója és a `TaskDetailPage` átadási felülete egyelőre önmagára
korlátozott vagy üres (a bejelentkezett felhasználó), mert a
felhasználólistázó végpont (`list_assignable_users`/`list_active_users`
megfelelője) még nincs portolva.

---

## 9. Ismert korlátok és nyitott kérdések

1. **Élesítés hosztolása:** állandóan futó Node-folyamat szükséges;
   Cloudflare Pages statikus hosztingja önmagában nem elég. `[CONFIGURE_ME]`.
2. **SQLite egyidejűség:** `better-sqlite3` szinkron, egyetlen
   Node-folyamaton belül; többpéldányos üzemeltetéshez megosztott
   fájlrendszer vagy más adattár (pl. Turso/libSQL) kellene.
3. **Fájltárolás:** a Supabase privát Storage-ot még nem váltottuk ki; az
   I2 fájlmodulja előtt ezt meg kell tervezni.
4. **`GET /api/projects` és `GET /api/tasks` teljesítménye:** soronkénti
   jogosultság-ellenőrzés, nem SQL-szintű szűrés – sok rekordnál
   újragondolandó.
5. **Felhasználólistázó végpont hiánya:** a `list_assignable_users` és
   `list_active_users` megfelelője még nincs portolva, ezért a projekt-,
   feladat-létrehozó és -átadó űrlapok felelős-választója egyelőre a
   bejelentkezett felhasználóra korlátozott vagy üres.
6. **E2E-tesztek háttérszervere:** a Playwright `webServer` konfigurációja
   (`playwright.config.ts`) `vite preview`-t indít, ami **statikus fájlokat**
   szolgál ki, a Hono API-t nem futtatja. A jelenlegi e2e-tesztek (bejelentkező
   képernyő megjelenése, mobil elrendezés) ettől függetlenül lefutnak, de
   bármilyen jövőbeli, valódi bejelentkezést igénylő e2e-teszthez a
   `webServer.command`-ot `server/serve.ts`-re (vagy build + `node server/serve.js`-re)
   kell majd átállítani.
7. **Kötelező MFA:** a `roles.requiresMfa` mező adatként létezik (pl.
   Kommunikációs vezetőnél `true`), de technikailag még nincs
   kikényszerítve sem a bejelentkezésnél, sem az authz-rétegben – ez a
   korábbi Supabase-rendszerben is csak üzleti követelmény volt, nem
   implementált kényszer.

---

## 10. Kész definíció (ehhez a szeletig)

Az itt leírt szelet (azonosítás + projekt- + feladatmodul) akkor tekinthető
késznek, ha:

1. minden route explicit `server/authz.ts` ellenőrzést hív olvasás/írás előtt;
2. minden üzleti szabályhoz van pozitív és negatív automata teszt;
3. `npm run check` (lint, típusellenőrzés, teszt, build) zöld;
4. a fejlesztői kód és titok (demó-jelszó) bizonyítottan nem kerül éles
   buildbe;
5. a dokumentáció (ez a fájl, `architecture-migration.md`,
   `implementation-plan.md`) tükrözi a tényleges állapotot.

Mind az öt feltétel teljesül ennek a dokumentumnak a létrehozásakor.
