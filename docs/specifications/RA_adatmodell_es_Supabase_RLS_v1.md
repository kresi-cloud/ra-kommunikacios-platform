# Rátgéber Akadémia kommunikációs platform

## Részletes adatmodell és Supabase RLS-specifikáció – 1.0

**Kapcsolódó dokumentum:** RA kommunikációs platform – MVP fejlesztési specifikáció 1.0  
**Adatbázis:** PostgreSQL / Supabase  
**Hitelesítés:** Supabase Auth, Google OAuth vagy e-mail/jelszó  
**Rendszeridő:** UTC  
**Felhasználói időzóna:** Europe/Budapest  
**Hatókör:** egyetlen szervezet, Rátgéber Akadémia

---

## 1. Tervezési elvek

1. A kliens soha nem kap service-role kulcsot.
2. Minden üzleti táblán aktív a Row Level Security (RLS).
3. A felületen elrejtett menüpont nem jogosultságvédelem; minden olvasást és módosítást az adatbázis is ellenőriz.
4. A technikai admin alapértelmezetten nem olvashat kommunikációs tartalmat.
5. Az érzékeny és a technikai adatok külön táblákba kerülnek, hogy az RLS mellett oszlopszintű kiszivárgás se történhessen.
6. A publikációs lenyomat és az auditnapló append-only: meglévő rekord nem írható át és nem törölhető.
7. A legtöbb üzleti rekord fizikailag nem törlődik; `deleted_at`, `archived_at`, `revoked_at` vagy állapotmező jelzi az életciklust.
8. Minden időpont `timestamptz`, adatbázisban UTC. A felület Europe/Budapest szerint jelenít meg.
9. Minden elsődleges kulcs UUID, alapértelmezetten `gen_random_uuid()`.
10. Minden változtatható üzleti táblán szerepel `created_at`, `created_by`, `updated_at`, `updated_by`.
11. Az állapotátmeneteket szerveroldali függvény vagy trigger validálja.
12. Közvetlen kliensoldali írás csak egyszerű, alacsony kockázatú rekordoknál engedett. Jogosultság-, publikáció-, audit-, import- és visszavonási művelet RPC-n vagy Edge Functionön keresztül történik.

---

## 2. Adatbázissémák

### 2.1. `auth`

Supabase által kezelt séma. Az `auth.users` az azonosítás technikai forrása. Üzleti adat közvetlenül ne kerüljön ide.

### 2.2. `public`

A kliens számára az API-n keresztül elérhető, RLS-sel védett üzleti táblák, nézetek és biztonságos RPC-k.

### 2.3. `private`

Nem exponált séma:

- jogosultság-ellenőrző függvények;
- auditsegédek;
- érzékeny technikai adatok;
- token- és integrációmetaadatok;
- belső ütemezési állapot;
- security-definer függvények.

### 2.4. `storage`

Supabase Storage rendszer. A fájlbájtok bucketekben, az üzleti metaadatok a `public.files` és `public.file_versions` táblákban találhatók.

---

## 3. Közös mezők és adattípusok

### 3.1. Standard mezők

| Mező | Típus | Szabály |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `created_at` | `timestamptz` | kötelező, `now()` |
| `created_by` | `uuid` | FK `profiles.id`, szerver tölti |
| `updated_at` | `timestamptz` | kötelező, trigger frissíti |
| `updated_by` | `uuid` | FK `profiles.id`, szerver tölti |
| `archived_at` | `timestamptz null` | archiválás időpontja |
| `archived_by` | `uuid null` | archiváló személy |
| `deleted_at` | `timestamptz null` | lomtárba helyezés |
| `deleted_by` | `uuid null` | lomtárba helyező személy |

Nem minden táblának kell az összes mező. Append-only táblán nincs `updated_at` és `updated_by`.

### 3.2. Szövegkezelés

- rövid cím: legfeljebb 250 karakter;
- rövid leírás: legfeljebb 2 000 karakter;
- hosszú szöveg: `text`;
- külső URL: legfeljebb 2 048 karakter, protokoll-ellenőrzéssel;
- felhasználói HTML közvetlenül nem tárolható; rich-text esetén tisztított strukturált JSON vagy sanitizált HTML szükséges.

### 3.3. Sorszámok és verziók

- üzleti verzió: pozitív egész szám, rekordonként 1-től növekszik;
- emberi azonosító külön mezőben adható, például `RA-CONT-2026-000123`;
- az UUID marad a valódi technikai kulcs.

---

## 4. Enumok és kontrollált értékkészletek

PostgreSQL enum csak ritkán változó technikai állapothoz használható. Üzletileg bővíthető listák külön törzstáblák legyenek.

### 4.1. Javasolt enumok

```text
account_status:
  invited, activation_pending, active, suspended, inactive, expired, archived

scope_type:
  global, project, content, task, event

content_status:
  idea, planned, in_progress, under_review, ready_to_publish,
  published, blocked, closed, archived, withdrawn

task_status:
  draft, assigned, accepted, in_progress, clarification_requested,
  blocked, submitted_for_review, completed, withdrawn, archived

task_acceptance_status:
  pending, accepted, clarification_requested, obstacle_reported

priority_level:
  normal, critical

event_status:
  draft, scheduled, cancelled, occurred, postponed, archived

participant_status:
  invited, accepted, declined, tentative, awaiting_response,
  response_not_required

request_status:
  received, under_review, clarification_requested, accepted,
  rejected, withdrawn, implemented, archived

publication_status:
  active, corrected, externally_removed, withdrawn

url_omission_reason:
  no_persistent_url, restricted_access, technically_unavailable,
  add_later, other

permission_status:
  missing, valid, requires_review, restricted, expired, revoked

permission_scope:
  seasonal_general, individual

notification_priority:
  normal, critical

notification_read_status:
  unread, read

file_status:
  uploading, quarantined, scanning, available, infected,
  missing, trashed, archived

review_decision:
  pending, approved, changes_requested, rejected, superseded

support_priority:
  critical, high, normal, low

support_status:
  received, investigating, fixing, resolved, closed
```

### 4.2. Törzstáblában kezelendő értékek

- szerepkörök;
- kapcsolható többletjogok;
- csatornák;
- konkrét publikációs célfelületek;
- tartalomtípusok;
- eseménytípusok;
- csapatok;
- szezonok;
- címkék;
- megjelenési jogosultsági dokumentumtípusok;
- médiatípusok és felhasználási célok.

---

## 5. Identitás és jogosultság

### 5.1. `profiles`

Az `auth.users` üzleti párja.

| Mező | Típus | Kötelező | Megjegyzés |
|---|---|---:|---|
| `id` | `uuid` | igen | PK és FK `auth.users.id` |
| `display_name` | `text` | igen | megjelenített név |
| `email` | `citext` | igen | egyedi, hitelesített cím |
| `job_title` | `text` | nem | beosztás |
| `organizational_unit` | `text` | nem | szervezeti egység |
| `is_internal_member` | `boolean` | igen | külső/belső elválasztás |
| `account_status` | `account_status` | igen | életciklus |
| `external_expires_at` | `timestamptz` | nem | külső fiók lejárata |
| `locale` | `text` | igen | MVP-ben `hu-HU` |
| `timezone` | `text` | igen | `Europe/Budapest` |
| `last_active_at` | `timestamptz` | nem | aktivitási metaadat |
| standard auditmezők |  |  |  |

Kényszerek:

- `email` egyedi kis- és nagybetűtől függetlenül;
- az e-mail kanonikus forrása az `auth.users`; a `profiles.email` szerveroldali szinkronmező, közvetlen kliensmódosítása tiltott;
- külső tagnál `external_expires_at` kötelező;
- lejárt külső fiókot ütemezett folyamat `expired`, majd `archived` állapotba helyez.

### 5.2. `roles`

Előre definiált szerepkörök.

| Mező | Típus | Megjegyzés |
|---|---|---|
| `code` | `text` | egyedi technikai kód |
| `name_hu` | `text` | magyar név |
| `is_system_role` | `boolean` | MVP-ben igaz |
| `requires_mfa` | `boolean` | kiemelt szerepkörök |
| `is_active` | `boolean` | kivezethetőség |

Kezdő rekordok:

- `communication_lead`
- `technical_admin`
- `project_owner`
- `staff_member`
- `privacy_legal_officer`
- `namesake`
- `external_contributor`

A `publisher` nem önálló alap-szerepkör, hanem többletjog.

### 5.3. `permissions`

Kapcsolható többletjogok.

Javasolt kódok:

- `create_project`
- `mark_ready_to_publish`
- `publish_content`
- `manage_person_profiles`
- `manage_permission_documents`
- `view_press_recipient_details`
- `import_standard_data`
- `import_sensitive_data`
- `view_project_workload`
- `access_sensitive_support_attachment`

### 5.4. `user_role_assignments`

| Mező | Típus | Megjegyzés |
|---|---|---|
| `user_id` | `uuid` | FK `profiles` |
| `role_id` | `uuid` | FK `roles` |
| `scope_type` | `scope_type` | global vagy projekthatókör |
| `scope_id` | `uuid null` | globálisnál null |
| `valid_from` | `timestamptz` | kezdő idő |
| `valid_until` | `timestamptz null` | lejárat |
| `appointed_by` | `uuid` | kommunikációs vezető |
| `initiated_by` | `uuid` | technikai admin |
| `revoked_at` | `timestamptz null` | visszavonás |
| `revoked_by` | `uuid null` | visszavonó |
| `reason` | `text` | kinevezés/visszavonás oka |

Egyediség: azonos felhasználó–szerepkör–hatókör aktív hozzárendelése ne duplikálódhasson.

Az aktív `namesake` szerepkörből globálisan pontosan egy lehet. Ezt részleges egyedi index és az `assign_role` RPC is ellenőrzi.

### 5.5. `user_permission_grants`

A kapcsolható többletjogok táblája. Mezői a szerepkör-hozzárendeléshez hasonlóan tartalmaznak hatókört, érvényességet, kinevezőt, kezdeményezőt és visszavonást.

### 5.6. `invitations`

| Mező | Típus | Megjegyzés |
|---|---|---|
| `email` | `citext` | meghívott cím |
| `token_hash` | `text` | nyers token nem tárolható |
| `expires_at` | `timestamptz` | lejárat |
| `status` | `text` | pending/accepted/expired/revoked |
| `initiated_by` | `uuid` | technikai admin |
| `approved_role_payload` | `jsonb` | kommunikációs vezető által jóváhagyott szerep/hatókör |
| `approved_by` | `uuid` | kommunikációs vezető |
| `accepted_user_id` | `uuid null` | létrejött profil |
| `accepted_at` | `timestamptz null` | felhasználás ideje |

### 5.7. `bootstrap_activations`

Az első technikai admin és kommunikációs vezető egyszer használható aktiválása. A nyers kód soha nem tárolható, csak erős hash. Sikeres aktiválás után `consumed_at` kötelező, újrahasználat blokkolt.

### 5.8. `delegations`

| Mező | Típus | Megjegyzés |
|---|---|---|
| `delegator_user_id` | `uuid` | helyettesített |
| `delegate_user_id` | `uuid` | helyettes |
| `scope_type` | `scope_type` | hatókör |
| `scope_id` | `uuid null` | konkrét projekt/tartalom |
| `permission_codes` | `text[]` | pontosan átadott jogok |
| `valid_from` | `timestamptz` | kezdés |
| `valid_until` | `timestamptz` | befejezés |
| `created_by` | `uuid` | létrehozó |
| `revoked_at` | `timestamptz null` | korai visszavonás |

Nem láncolható: delegált jog alapján újabb delegálás nem hozható létre.

---

## 6. Törzsadatok

### 6.1. `seasons`

`name`, `starts_on`, `ends_on`, `is_default`, `is_active`. Alapértelmezett szezon július 1.–június 30. Egyszerre legfeljebb egy alapértelmezett szezon lehet.

### 6.2. `teams`

`name`, `short_name`, `gender_category`, `age_group`, `season_id`, `is_active`, `parent_team_id`.

### 6.3. `channels`

Példák: web, Facebook, Instagram feed, Instagram Story, Reels, TikTok, YouTube, sajtó, belső kommunikáció, nyomtatott anyag.

Mezők: `code`, `name_hu`, `is_persistent_online`, `default_url_required`, `requires_thumbnail`, `is_active`.

### 6.4. `publication_targets`

Konkrét oldal, profil, webhely, belső tér vagy kiadvány.

Mezők: `channel_id`, `name`, `external_identifier`, `public_url`, `is_internal`, `is_active`, `access_notes`.

### 6.5. `content_types`, `event_types`, `tags`

Mindegyik kontrollált, kommunikációs vezető által kezelhető törzsadat. A címkejavaslat külön `tag_suggestions` rekord, amelyből jóváhagyás után jön létre címke.

---

## 7. Projektek

### 7.1. `projects`

| Mező | Típus | Kötelező |
|---|---|---:|
| `project_code` | `text` | igen |
| `title` | `text` | igen |
| `summary` | `text` | nem |
| `objective` | `text` | nem |
| `owner_user_id` | `uuid` | igen |
| `starts_on` | `date` | nem |
| `ends_on` | `date` | nem |
| `status` | `text` | igen |
| `season_id` | `uuid` | nem |
| `closed_at/by` |  | nem |
| `archived_at/by` |  | nem |
| standard auditmezők |  |  |

Kényszerek:

- `ends_on >= starts_on`;
- tulajdonos aktív belső felhasználó és projektgazda szerepkörű;
- archivált projekt közvetlenül nem módosítható;
- újranyitást csak kommunikációs vezető végezhet.

### 7.2. `project_members`

`project_id`, `user_id`, `membership_role`, `joined_at`, `left_at`, `added_by`.

Egy aktív projektben ugyanaz a személy egyszer szerepelhet. Külső tag hozzáférése nem lehet hosszabb a fiókja lejáratánál.

### 7.3. `project_tags`

Kapcsolótábla: `project_id`, `tag_id`, `added_by`, `created_at`.

---

## 8. Tartalmak és verziók

### 8.1. `contents`

| Mező | Típus | Kötelező | Megjegyzés |
|---|---|---:|---|
| `content_code` | `text` | igen | emberi azonosító |
| `title` | `text` | igen | munkacím |
| `summary` | `text` | nem | rövid összefoglaló |
| `content_type_id` | `uuid` | igen | törzsadat |
| `primary_project_id` | `uuid` | igen | elsődleges projekt |
| `owner_user_id` | `uuid` | igen | tartalomgazda |
| `status` | `content_status` | igen | életciklus |
| `priority` | `priority_level` | igen | normal/critical |
| `current_version_id` | `uuid null` | nem | aktív verzió |
| `required_review` | `boolean` | igen | szabály/vezető alapján |
| `planned_publish_at` | `timestamptz null` | nem | tervezett megjelenés |
| `blocked_at/by` |  | nem | aktív blokk gyors elérése |
| `closed_at/by` |  | nem | lezárás |
| `withdrawn_at/by` |  | nem | visszavonás |
| standard auditmezők |  |  |  |

### 8.2. `content_projects`

Másodlagos projektkapcsolatok: `content_id`, `project_id`, `relation_type`, `created_by`, `created_at`.

Az elsődleges projekt nem ismételhető itt.

### 8.3. `content_versions`

Append-only verziótábla.

| Mező | Típus | Megjegyzés |
|---|---|---|
| `content_id` | `uuid` | szülő |
| `version_number` | `integer` | tartalmon belül egyedi |
| `title` | `text` | adott verzió címe |
| `body_json` | `jsonb` | tisztított strukturált rich-text |
| `plain_text` | `text` | kereséshez és exporthoz előállított szöveg |
| `summary` | `text` | adott verzió összefoglalója |
| `change_type` | `text` | substantive/technical |
| `change_reason` | `text` | kötelező érdemi változásnál |
| `created_by/at` |  | verzió létrehozója |
| `supersedes_version_id` | `uuid null` | előző verzió |

Érdemi módosításkor az aktív jóváhagyások `superseded` állapotúvá válnak.

### 8.4. `content_required_publications`

Előre rögzíti a kötelező és opcionális célfelületeket.

`content_id`, `publication_target_id`, `is_required`, `planned_at`, `assigned_publisher_id`, `completed_publication_id`, `created_by/at`.

Az automatikus „Publikált” állapot ezt a táblát ellenőrzi.

### 8.5. `content_tags`

`content_id`, `tag_id`, `added_by`, `created_at`.

### 8.6. `reviews`

`content_id`, `content_version_id`, `review_type`, `reviewer_user_id`, `decision`, `comment`, `requested_at`, `decided_at`, `superseded_at`.

Egy adott kötelező review-típusból egyszerre egy aktív döntés lehet verziónként.

### 8.7. `blocks`

`entity_type`, `entity_id`, `reason`, `created_by`, `created_at`, `resolved_by`, `resolved_at`, `resolution_note`, `action_task_id`.

Aktív blokk: `resolved_at is null`. Tartalom aktív blokkja kizárja a publikálást.

---

## 9. Feladatok

### 9.1. `tasks`

| Mező | Típus | Kötelező |
|---|---|---:|
| `task_code` | `text` | igen |
| `title` | `text` | igen |
| `description` | `text` | nem |
| `responsible_user_id` | `uuid` | igen |
| `created_by` | `uuid` | igen |
| `project_id` | `uuid` | nem |
| `content_id` | `uuid` | nem |
| `event_id` | `uuid` | nem |
| `parent_task_id` | `uuid` | nem |
| `status` | `task_status` | igen |
| `acceptance_status` | `task_acceptance_status` | igen |
| `priority` | `priority_level` | igen |
| `due_at` | `timestamptz` | nem |
| `unscheduled` | `boolean` | igen |
| `requires_review` | `boolean` | igen |
| `reviewer_user_id` | `uuid` | nem |
| `completed_at/by` |  | nem |
| `withdrawn_at/by` |  | nem |
| standard auditmezők |  |  |

Kényszerek:

- pontosan egy felelős;
- legalább egy kapcsolódás ajánlott, de önálló feladat engedett;
- `unscheduled = false` esetén `due_at` kötelező;
- publikációhoz szükséges, folyamatban lévő feladatnál `due_at` kötelező;
- `requires_review = true` esetén `reviewer_user_id` kötelező;
- a felelős megváltoztatása hivatalos átadási eseményt hoz létre.

### 9.2. `task_assignments_history`

Append-only: `task_id`, `from_user_id`, `to_user_id`, `reason`, `changed_by`, `changed_at`.

### 9.3. `task_deadline_history`

Append-only: `task_id`, `old_due_at`, `new_due_at`, `reason`, `changed_by`, `changed_at`. Indoklás mindig kötelező.

### 9.4. `task_block_details`

`task_id`, `block_reason_code`, `details`, `waiting_for_user_id`, `waiting_for_external_party`, `started_at`, `resolved_at`, `resolved_by`.

### 9.5. `work_effort_entries`

`task_id`, `user_id`, `estimate_minutes`, `actual_minutes`, `note`, `recorded_at`. Stopperadat nincs. A mezők opcionálisak, de legalább az egyik időérték szükséges.

### 9.6. `task_relations`

`source_task_id`, `target_task_id`, `relation_type` (`depends_on`, `related`, `derived_from`). Önhivatkozás és közvetlen körkörösség tiltott.

---

## 10. Kommentek és aktivitás

### 10.1. `comments`

| Mező | Típus | Megjegyzés |
|---|---|---|
| `entity_type` | `text` | project/content/task/event/request |
| `entity_id` | `uuid` | célrekord |
| `author_user_id` | `uuid` | szerző |
| `body` | `text` | tisztított szöveg |
| `visibility` | `text` | project_scope/lead_only/restricted |
| `parent_comment_id` | `uuid null` | válasz |
| `edited_at` | `timestamptz null` | szerkesztés jelzése |
| `deleted_at` | `timestamptz null` | tartalom helyett törlésjelző |

Névadó által írt komment automatikusan `lead_only`, más jogosult nem olvashatja.

### 10.2. `mentions`

`comment_id`, `mentioned_user_id`, `created_at`, `notification_id`. A rendszer ellenőrzi, hogy a szerző és az említett személy hozzáfér ugyanahhoz a rekordhoz. Külső közreműködő csak projektkörön belül említhet.

### 10.3. `activity_events`

Felhasználóknak megjeleníthető üzleti eseményfolyam. Nem azonos az auditnaplóval. Mezők: `entity_type`, `entity_id`, `event_type`, `actor_user_id`, `summary`, `metadata`, `created_at`, `visibility`.

---

## 11. Esemény és naptár

### 11.1. `events`

`event_code`, `title`, `description`, `event_type_id`, `responsible_user_id`, `project_id`, `content_id`, `starts_at`, `ends_at`, `location_name`, `location_address`, `is_mandatory`, `response_due_at`, `status`, `outcome_code`, `importance_for_namesake`, `cancel_reason`, `postpone_reason`, standard auditmezők.

Kényszerek:

- egy felelős;
- `ends_at > starts_at`;
- ismétlődési szabály mező nincs;
- `outcome_code = did_not_occur` csak `status = cancelled` mellett használható;
- `importance_for_namesake` csak kommunikációs vezető által módosítható.

### 11.2. `event_participants`

`event_id`, `participant_type`, `user_id`, `person_id`, `external_name`, `external_email`, `status`, `response_required`, `responded_at`, `responded_by_user_id`, `invited_at/by`.

Pontosan egy résztvevőazonosító használható: felhasználó, személy vagy külső név/e-mail.

### 11.3. `event_change_log`

Append-only rekord az időpont, helyszín, kötelezőség, leírás és melléklet változásáról. `requires_reconfirmation` szerveroldalon számított.

### 11.4. `availability_blocks`

`user_id`, `starts_at`, `ends_at`, `visibility` (`busy_only`), `source` (`manual`, `google`), `external_event_hash`, `created_at`.

Google-forrásból cím, résztvevő és leírás nem tárolható.

### 11.5. `calendar_connections`

Publikus táblában csak: `user_id`, `provider`, `calendar_display_name`, `status`, `last_sync_at`, `sync_error_code`.

OAuth refresh token és titok kizárólag titkosított formában a `private.calendar_credentials` táblában vagy platform-secret store-ban lehet.

### 11.6. `travel_records`

`event_id`, `location`, `departure_at`, `arrival_at`, `travel_minutes`, `notes`. Résztvevők az esemény résztvevőiből vagy külön kapcsolótáblából származnak. Költségmező nincs.

---

## 12. Fájlok és NAS

### 12.1. `files`

Logikai fájlrekord.

`owner_user_id`, `display_name`, `original_name`, `category`, `current_version_id`, `status`, `is_sensitive`, `archived_at/by`, `trashed_at/by`, standard auditmezők.

### 12.2. `file_versions`

Append-only.

| Mező | Típus | Megjegyzés |
|---|---|---|
| `file_id` | `uuid` | logikai fájl |
| `version_number` | `integer` | fájlon belül egyedi |
| `storage_kind` | `text` | supabase/nas |
| `storage_bucket` | `text null` | Supabase bucket |
| `storage_path` | `text null` | privát objektumút |
| `nas_reference_id` | `uuid null` | NAS esetén |
| `stored_filename` | `text` | időbélyeges név |
| `original_filename` | `text` | eredeti név |
| `mime_type` | `text` | ellenőrzött MIME |
| `size_bytes` | `bigint` | méret |
| `sha256` | `text` | 64 hex karakter |
| `scan_status` | `file_status` | karantén/eredmény |
| `is_final` | `boolean` | aktív végleges verzió |
| `finalized_at/by` |  | véglegesítés |
| `created_at/by` |  | feltöltés |

Kényszerek:

- pontosan egy tárolási hely: Supabase vagy NAS;
- `(file_id, version_number)` egyedi;
- fájlonként legfeljebb egy aktív `is_final = true` részleges egyedi indexszel;
- elérhető státusz csak sikeres vírusellenőrzés után;
- 250 MB felett `storage_kind = nas`.

### 12.3. `file_links`

Polimorf kapcsolat helyett ellenőrzött kapcsolótábla: `file_id`, `entity_type`, `entity_id`, `link_role`, `created_by/at`.

Írás kizárólag RPC-n keresztül, amely ellenőrzi a célrekord létét és jogosultságát.

### 12.4. `file_previews`

`file_version_id`, `preview_type`, `storage_bucket`, `storage_path`, `width`, `height`, `duration_seconds`, `created_at`, `is_user_selected`.

### 12.5. `malware_scan_results`

Append-only: `file_version_id`, `scanner`, `signature_version`, `result`, `details`, `scanned_at`.

### 12.6. `nas_references`

`network_path`, `filename`, `size_bytes`, `file_modified_at`, `availability_status`, `last_checked_at`, `last_error`, `version_label`.

NAS-jelszó vagy hozzáférési token nem kerül ebbe a táblába.

### 12.7. `nas_availability_checks`

Append-only: `nas_reference_id`, `checked_at`, `is_available`, `observed_size_bytes`, `error_code`, `duration_ms`.

---

## 13. Publikációk

### 13.1. `publications`

Az üzleti publikáció fejrekordja.

`content_id`, `required_publication_id`, `publication_target_id`, `published_by_user_id`, `published_at`, `status`, `current_snapshot_id`, `externally_removed_at/by`, `removal_reason`, `created_at/by`.

Csak aktív belső felhasználó hozhatja létre, ha rendelkezik `publish_content` joggal.

### 13.2. `publication_snapshots`

Változtathatatlan publikációs lenyomat.

| Mező | Típus | Kötelező |
|---|---|---:|
| `publication_id` | `uuid` | igen |
| `snapshot_version` | `integer` | igen |
| `published_text` | `text` | igen |
| `description` | `text` | nem |
| `url` | `text` | feltételes |
| `url_omission_reason` | enum | feltételes |
| `url_omission_note` | `text` | egyébnél kötelező |
| `publication_target_name_snapshot` | `text` | igen |
| `channel_name_snapshot` | `text` | igen |
| `published_at_snapshot` | `timestamptz` | igen |
| `publisher_name_snapshot` | `text` | igen |
| `content_version_id` | `uuid` | igen |
| `thumbnail_file_version_id` | `uuid` | igen |
| `technical_fingerprint` | `jsonb` | igen |
| `correction_reason` | `text` | 2. verziótól kötelező |
| `created_by/at` |  | igen |

Tartós online csatornán URL vagy kihagyási ok kötelező. `add_later` esetén szerveroldal automatikusan URL-pótlási feladatot készít 24 órás határidővel.

### 13.3. `publication_assets`

`snapshot_id`, `file_version_id`, `asset_role` (`primary`, `thumbnail`, `screenshot`, `attachment`, `contact_sheet`), `sort_order`.

Story platformon hozzáadott elem esetén `screenshot` szerepű fájl kötelező.

### 13.4. `publication_metrics`

Append-only mérési pontok: `publication_id`, `measured_at`, `reach`, `views`, `reactions`, `comments_count`, `shares`, `watch_time_seconds`, `source` (`manual`, `public_fetch`), `recorded_by`.

Negatív érték nem engedett. Korábbi mérés nem íródik felül.

### 13.5. `press_dispatch_details`

`publication_id`, `subject`, `sender_name`, `recipient_group_name`, `recipient_count`, `sent_at`. A pontos címzettek külön érzékeny táblában vannak.

### 13.6. `press_dispatch_recipients`

Érzékeny rekord: `publication_id`, `recipient_name`, `recipient_email`, `organization`. Csak kommunikációs vezető és `view_press_recipient_details` joggal rendelkező belső felhasználó olvashatja.

### 13.7. `internal_dispatch_details`

`publication_id`, `subject`, `full_body`, `sender_name`, `audience_group_name`, `recipient_count`, `sent_at`.

### 13.8. `print_publication_details`

`publication_id`, `publication_type`, `print_run`, `distribution_starts_at`, `distribution_location`.

---

## 14. Személyek és megjelenési jogosultságok

### 14.1. `persons`

Minimális, általánosan használható személytörzs.

`display_name`, `person_type` (`athlete`, `coach`, `staff`, `guest`, `other`), `birth_year`, `is_minor`, `active_status`, standard auditmezők.

### 14.2. `person_private_details`

Érzékeny, szűk hozzáférésű adatok: teljes születési dátum, elérhetőség, belső megjegyzés. Csak kommunikációs vezető, adatvédelmi/jogi felelős és kifejezetten feljogosított profilkezelő férhet hozzá.

### 14.3. `person_team_memberships`

`person_id`, `team_id`, `starts_on`, `ends_on`, `membership_role`, `created_by/at`.

### 14.4. `legal_representatives`

`full_name`, `email`, `phone_optional`, standard auditmezők. Igazolványszám és igazolványmásolat nincs.

### 14.5. `person_representatives`

`person_id`, `representative_id`, `relationship_label`, `valid_from`, `valid_until`, `is_primary`.

### 14.6. `appearance_permissions`

| Mező | Típus | Megjegyzés |
|---|---|---|
| `person_id` | `uuid` | érintett |
| `permission_scope` | enum | seasonal_general/individual |
| `season_id` | `uuid null` | szezonálisnál kötelező |
| `status` | enum | számított/vezérelt állapot |
| `valid_from` | `date` | kezdés |
| `valid_until` | `date` | lejárat |
| `restriction_summary` | `text` | projektgazda számára rövid |
| `requires_individual_review` | `boolean` | különleges használat |
| `verified_by/at` |  | ellenőrzés |
| `revoked_at/by` |  | visszavonás |

Az engedélyezett médiatípusok, csatornák és felhasználási célok kapcsolótáblákban tárolandók:

- `appearance_permission_media_types(permission_id, media_type_code)`;
- `appearance_permission_channels(permission_id, channel_id)`;
- `appearance_permission_purposes(permission_id, purpose_code)`.

Így az értékek idegen kulccsal ellenőrizhetők és hatékonyan lekérdezhetők.

### 14.7. `permission_documents`

`appearance_permission_id`, `file_version_id`, `document_type_id`, `template_version`, `immutable_pdf_sha256`, `signed_or_submitted_at`, `created_by/at`.

Dokumentum csak a dedikált privát bucketben lehet.

### 14.8. `permission_requests`

`person_id`, `representative_id`, `token_hash`, `expires_at`, `status`, `sent_to_email`, `sent_at`, `submitted_at`, `result_permission_id`, `document_template_version`, `created_by`.

Link hét napig érvényes, egyszer használható. Új kiküldés a korábbit visszavonja.

### 14.9. `permission_revocations`

Append-only: `appearance_permission_id`, `received_at`, `effective_at`, `reason`, `recorded_by`, `source_document_file_id`, `created_at`.

Trigger:

1. jogosultság státusza `revoked`;
2. érintett előkészített tartalmak blokkolása;
3. korábbi publikációkhoz intézkedési rekordok;
4. kommunikációs vezető és projektgazdák értesítése.

### 14.10. `content_persons`

`content_id`, `person_id`, `appearance_type` (`group`, `close_up`, `named`, `interview`, `voice_only`, `other`), `permission_check_status`, `checked_at`, `check_details`, `override_by`, `override_reason`.

Az ellenőrzés szabályalapú. AI nem adhat végleges jogosultsági döntést.

### 14.11. `privacy_cases`

`case_code`, `request_type`, `person_id`, `requester_name`, `received_at`, `due_at`, `responsible_user_id`, `status`, `actions_summary`, `closed_at/by`, standard auditmezők.

---

## 15. Kommunikációs igények

### 15.1. `communication_requests`

`request_code`, `requester_user_id`, `external_requester_name`, `external_requester_email`, `purpose`, `description`, `desired_outcome`, `related_event_date`, `desired_publication_at`, `target_audience`, `team_id`, `person_id`, `contact_name`, `contact_email`, `suggested_channels`, `status`, `decision_reason`, `response_due_at`, `converted_entity_type`, `converted_entity_id`, standard auditmezők.

Külső beadásnál egyszer használható token és meghívott e-mail szükséges. Teljesen nyilvános űrlap nincs.

### 15.2. `request_clarifications`

`request_id`, `question`, `requested_by`, `requested_at`, `response_due_at`, `response`, `responded_at`, `responded_by`.

### 15.3. `request_attachments`

Kapcsolat a fájlrendszerhez; csak a kérelemhez hozzáférők olvashatják.

---

## 16. Értesítések

### 16.1. `notifications`

`recipient_user_id`, `event_type`, `title`, `body_safe`, `priority`, `entity_type`, `entity_id`, `read_status`, `read_at`, `deliver_after`, `archived_at`, `retention_until`, `group_key`, `created_at`.

`body_safe` nem tartalmazhat érzékeny személyes adatot, mert pushban vagy e-mailben is megjelenhet.

### 16.2. `notification_deliveries`

`notification_id`, `channel` (`in_app`, `email`, `push`), `status`, `attempted_at`, `delivered_at`, `opened_at`, `provider_message_id`, `error_code`.

Kézbesítési és megnyitási napló kötelező kritikus értesítésnél és kötelező eseménymeghívásnál.

### 16.3. `notification_preferences`

`user_id`, `event_type`, `email_enabled`, `push_enabled`. Kötelező biztonsági, fiók-, jogosultsági és kritikus eseményeknél a kikapcsolás szerveroldalon tiltott.

### 16.4. `push_subscriptions`

`user_id`, `endpoint_ciphertext`, `p256dh_ciphertext`, `auth_ciphertext`, `device_label`, `created_at`, `revoked_at`, `last_success_at`.

### 16.5. Ütemezési szabályok

- normál értesítés csak 08:00–20:00 között kézbesíthető;
- kritikus azonnal;
- napi összefoglaló 08:00-kor, csak ha van tartalom;
- 24 órás és 2 órás emlékeztető csak akkor készül, ha a feladat létrehozásakor az adott időpont még a jövőben van;
- normál értesítés hét nap után archiválódik;
- kritikus olvasatlan értesítés nem archiválható automatikusan;
- minden értesítési előzmény egy évig megmarad.

---

## 17. Riport és export

### 17.1. `report_exports`

`report_type`, `requested_by`, `requested_at`, `filters_json`, `format`, `row_count`, `result_file_id`, `completed_at`, `status`, `error_code`, `retention_until`.

### 17.2. Riportnézetek

Javasolt materializált vagy normál nézetek:

- `v_publication_summary`
- `v_content_publication_progress`
- `v_project_delivery_summary`
- `v_staff_workload`
- `v_staff_completion`
- `v_deadline_performance`
- `v_permission_issues`
- `v_namesake_communication_summary`

A nézetek ne kerüljék meg az RLS-t. `security_invoker = true` használata vagy biztonságos RPC szükséges.

### 17.3. Munkatársi riport korlátozása

- részletes, személyenkénti nézet: csak kommunikációs vezető;
- projektgazda: kizárólag saját projektjének tagjai és kizárólag az adott projekt munkái;
- névadó: aggregált, személynév, javítás, belső komment és egyéni teljesítés nélkül;
- munkatárs: saját részletes teljesítményriportot nem olvashat.

### 17.4. Javítási adatok

A `publication_snapshots`, `content_versions`, visszanyitások és javítási okok alapján külön vezetői nézet készül. Ez semmilyen automatikus pontszámba nem számíthat bele.

---

## 18. Import és támogatás

### 18.1. `imports`

`import_type`, `source_file_id`, `requested_by`, `approved_by`, `status`, `mapping_json`, `preview_summary`, `started_at`, `completed_at`, `success_count`, `error_count`.

### 18.2. `import_rows`

`import_id`, `row_number`, `source_data`, `normalized_data`, `validation_status`, `errors`, `result_entity_type`, `result_entity_id`.

Személyes vagy jogosultsági importhoz külön érzékeny importjog szükséges.

### 18.3. `support_tickets`

`ticket_code`, `reporter_user_id`, `title`, `description`, `priority`, `status`, `environment_snapshot`, `contains_sensitive_data`, `assigned_to`, `resolved_at`, `resolution`, standard auditmezők.

### 18.4. `support_ticket_attachments`

Érzékenységi jelzővel kapcsolódik a fájlokhoz. Érzékeny mellékletet csak technikai admin és szükség esetén kommunikációs vezető olvashat.

---

## 19. Auditnapló

### 19.1. `audit_log`

Particionált, append-only tábla.

| Mező | Típus | Megjegyzés |
|---|---|---|
| `id` | `uuid` | PK |
| `occurred_at` | `timestamptz` | esemény ideje |
| `actor_user_id` | `uuid null` | rendszerfolyamatnál null |
| `actor_type` | `text` | user/system/service |
| `action` | `text` | kontrollált eseménykód |
| `entity_type` | `text` | cél típusa |
| `entity_id` | `uuid null` | cél azonosítója |
| `project_id` | `uuid null` | gyors hatókörszűrés |
| `old_values` | `jsonb null` | érzékeny mezők maszkolva |
| `new_values` | `jsonb null` | érzékeny mezők maszkolva |
| `reason` | `text null` | indoklás |
| `request_id` | `uuid/text` | korreláció |
| `ip_hash` | `text null` | nyers IP helyett vagy jogilag jóváhagyott forma |
| `user_agent_summary` | `text null` | minimalizált technikai adat |
| `metadata` | `jsonb` | további nem érzékeny adat |

Megőrzés: öt év. Havi vagy éves partíció javasolt. UPDATE és DELETE minden alkalmazásszerepkör számára tiltott.

### 19.2. Auditált műveletek

Legalább:

- hitelesítési esemény;
- meghívás és aktiválás;
- szerep, jog és helyettesítés;
- állapot- és határidőváltozás;
- feladatátadás;
- review, blokkolás és feloldás;
- fájlverzió, véglegesítés, lomtár;
- publikáció és helyesbítés;
- megjelenési dokumentum hozzáférése;
- import és export;
- technikai admin tartalmi hozzáférése;
- adatvédelmi ügyintézés;
- biztonsági adminisztráció.

---

## 20. RLS-segédfüggvények

Minden security-definer függvény:

- fix `search_path`-ot használjon;
- csak a szükséges oszlopot adja vissza;
- ne legyen végrehajtható `anon` számára, kivéve a kifejezetten tokenes publikus folyamatot;
- ne okozzon rekurzív RLS-hívást;
- kapjon automatizált tesztet.

### 20.1. Alapfüggvények

```sql
private.current_user_id() returns uuid
private.is_active_user(user_id uuid default auth.uid()) returns boolean
private.is_internal_user(user_id uuid default auth.uid()) returns boolean
private.has_role(role_code text, scope_type text default 'global', scope_id uuid default null) returns boolean
private.has_permission(permission_code text, scope_type text default 'global', scope_id uuid default null) returns boolean
private.is_communication_lead() returns boolean
private.is_technical_admin() returns boolean
private.is_privacy_officer() returns boolean
private.is_namesake() returns boolean
private.is_project_owner(project_id uuid) returns boolean
private.is_project_member(project_id uuid) returns boolean
private.can_access_project(project_id uuid) returns boolean
private.can_access_content(content_id uuid) returns boolean
private.can_access_task(task_id uuid) returns boolean
private.can_access_event(event_id uuid) returns boolean
private.can_manage_person_profiles() returns boolean
private.can_view_permission_document(permission_id uuid) returns boolean
private.can_publish_content(content_id uuid) returns boolean
private.delegated_permission_exists(permission_code text, scope_type text, scope_id uuid) returns boolean
```

### 20.2. Hatókör-számítás

`can_access_content` igaz, ha legalább egy feltétel teljesül:

1. kommunikációs vezető;
2. a felhasználó az elsődleges projekt projektgazdája vagy tagja;
3. a felhasználó felelőse a tartalomhoz kapcsolt feladatnak;
4. a tartalmat kifejezetten megosztották vele;
5. aktív, megfelelő hatókörű helyettesítéssel rendelkezik;
6. névadó, és a tartalom `ready_to_publish` vagy `published` állapotú;
7. adatvédelmi/jogi felelős, és a tartalomhoz jogosultsági ügy kapcsolódik.

A technikai admin önmagában nem teljesíti ezt a feltételt.

### 20.3. Névadói adatszűrés

A névadó külön biztonságos nézeteken vagy RPC-ken keresztül kap adatot. Ezek kizárják:

- belső kommenteket;
- névadói komment más címzettjeit;
- munkatársi teljesítményadatokat;
- megjelenési dokumentumokat;
- auditnaplót;
- nem fontos eseményeket;
- a publikálásra előkészítés előtti tartalmakat.

---

## 21. RLS-szabálymátrix

Jelölések: **S** = SELECT, **I** = INSERT, **U** = UPDATE, **D** = közvetlen DELETE. A legtöbb D tiltott, helyette RPC-alapú archiválás/lomtár használatos.

### 21.1. Identitás

| Tábla | Komm. vezető | Tech admin | Projektgazda/munkatárs | Adatvédelmi | Névadó | Külső |
|---|---|---|---|---|---|---|
| `profiles` | S | S/I/U technikai mezők | saját S/U + projektben alapnév S | szükséges S | saját S/U | saját S/U + projektalapadat S |
| `user_role_assignments` | S/I/U RPC | S, kezdeményezés RPC | saját S | szükség szerint S | saját S | saját S |
| `user_permission_grants` | S/I/U RPC | S, kezdeményezés RPC | saját S | szükség szerint S | saját S | saját S |
| `invitations` | S/jóváhagyás | S/I/U technikai | nincs | nincs | nincs | saját tokenfolyamat |
| `delegations` | teljes | technikai S | érintett S, jogosult I/U RPC | saját S | saját S | nincs |

### 21.2. Projektek és munka

| Tábla | Komm. vezető | Projektgazda | Munkatárs | Névadó | Külső | Tech admin |
|---|---|---|---|---|---|---|
| `projects` | S/I/U | saját S/U, I külön joggal | tagság szerint S | nincs/közvetett | megosztott S | nincs |
| `project_members` | teljes | saját projekt S/I/U | saját tagság S | nincs | saját tagság S | nincs |
| `contents` | S/I/U | saját projekt S/I/U | hozzáférés szerint S/U | korlátozott S | kiosztás szerint S | nincs |
| `content_versions` | S/I | saját hatókör S/I | hozzáférés szerint S/I | engedett verzió S | kiosztás szerint S/I | nincs |
| `tasks` | S/I/U | saját projekt S/I/U | saját/kiosztott S/U | nincs | saját S/U | nincs |
| `comments` | S/I/U | hatókör szerint | hatókör szerint | saját + engedett S/I | hatókör szerint | nincs |
| `reviews` | teljes | saját hatókör | kijelölt review | nincs | kijelölés szerint | nincs |
| `blocks` | teljes RPC | saját hatókör S/jelzés | S | nincs | S, ha saját feladat | nincs |

Közvetlen DELETE mindenhol tiltott.

### 21.3. Esemény

| Tábla | Komm. vezető | Projektgazda | Munkatárs | Névadó | Külső |
|---|---|---|---|---|---|
| `events` | teljes | saját projekt teljes | meghívott S, felelős U | fontos/saját S, saját elfoglaltság I/U | meghívott S |
| `event_participants` | teljes | saját projekt teljes | saját válasz U | saját válasz U | saját válasz U |
| `availability_blocks` | megfelelő S | busy-only S | saját teljes | saját teljes | saját teljes |
| `calendar_connections` | állapot S | saját teljes | saját teljes | saját teljes | opcionálisan saját |

Más személy elfoglaltságából csak foglalt/szabad információ adható ki biztonságos nézeten keresztül.

### 21.4. Publikáció és fájl

| Tábla | Komm. vezető | Publikáló belső | Projektgazda | Munkatárs | Névadó | Külső | Tech admin |
|---|---|---|---|---|---|---|---|
| `publications` | S/I/U RPC | hatókör szerint S/I RPC | saját projekt S | hozzáférés szerint S | engedett S | nincs | nincs |
| `publication_snapshots` | S/I RPC | hatókör szerint S/I RPC | saját projekt S | hozzáférés szerint S | engedett S | nincs | nincs |
| `publication_metrics` | teljes | saját publikáció I/S | saját projekt S/I | jogosultság szerint S | aggregált | nincs | nincs |
| `files` | teljes | hatókör szerint | saját projekt | kapcsolt rekord szerint | engedett előnézet | kiosztás szerint | nincs |
| `file_versions` | teljes | hatókör szerint I/S | saját projekt | kapcsolt rekord szerint I/S | engedett S | kiosztás szerint I/S | nincs |

Technikai admin fájlbájt-hozzáférése csak külön támogatási RPC-n keresztül, megerősítéssel és naplózással történhet.

### 21.5. Személyes és jogosultsági adatok

| Tábla | Komm. vezető | Adatvédelmi/jogi | Feljogosított profilkezelő | Projektgazda | Munkatárs | Névadó/Tech/Külső |
|---|---|---|---|---|---|---|
| `persons` | teljes | teljes | I/S/U | projektben alap S | feladathoz alap S | nincs vagy közvetett |
| `person_private_details` | teljes | teljes | külön jog szerint | nincs | nincs | nincs |
| `legal_representatives` | teljes | teljes | külön jog szerint | nincs | nincs | nincs |
| `appearance_permissions` | teljes | teljes | státuszkezelés jog szerint | rövid státusz nézet | zöld/piros nézet | nincs |
| `permission_documents` | teljes | teljes | nincs | nincs | nincs | nincs |
| `privacy_cases` | teljes | teljes | nincs | nincs | nincs | nincs |

Projektgazda és munkatárs nem közvetlenül az `appearance_permissions` táblát olvassa, hanem maszkolt biztonságos nézetet.

### 21.6. Riport és audit

| Adat | Komm. vezető | Projektgazda | Munkatárs | Névadó | Tech admin | Adatvédelmi |
|---|---|---|---|---|---|---|
| publikációs részletes riport | teljes | saját projekt | nincs | aggregált | nincs | szükség szerint |
| munkatársi részletes riport | teljes | saját projektcsapat | nincs | nincs | nincs | nincs |
| javítási riport | teljes | nincs | nincs | nincs | nincs | nincs |
| üzleti audit | teljes | nincs | nincs | nincs | nincs | adatvédelmi rész |
| technikai/biztonsági audit | hozzáférési összkép | teljes technikai | saját esemény opcionális | nincs | teljes | személyesadat-rész |
| exportnapló | teljes | saját export | nincs | saját export | technikai | adatvédelmi export |

---

## 22. Kiemelt RLS-policy minták

Az alábbiak szemléltető minták; migráció előtt tényleges séma- és függvénynevekkel tesztelendők.

### 22.1. Projektek olvasása

```sql
create policy projects_select
on public.projects
for select
to authenticated
using (
  private.is_active_user()
  and private.can_access_project(id)
);
```

### 22.2. Tartalmak olvasása

```sql
create policy contents_select
on public.contents
for select
to authenticated
using (
  private.is_active_user()
  and private.can_access_content(id)
);
```

### 22.3. Tartalom módosítása

```sql
create policy contents_update
on public.contents
for update
to authenticated
using (
  private.is_communication_lead()
  or private.is_project_owner(primary_project_id)
  or owner_user_id = auth.uid()
  or private.delegated_permission_exists('edit_content', 'content', id)
)
with check (
  private.is_active_user()
  and not private.is_technical_admin()
);
```

Az állapot- és tulajdonosváltozásokat nem ez a közvetlen policy, hanem célzott RPC-k végzik.

Az RLS nem oszlopszintű védelem. Ezért a kliensszerepkör közvetlen UPDATE-jogát vissza kell vonni az olyan mezőkről, mint `status`, `owner_user_id`, `primary_project_id`, `blocked_at`, `closed_at` és `withdrawn_at`. Ezek kizárólag a megfelelő RPC-ken keresztül módosíthatók. Ugyanez az elv alkalmazandó minden állapot-, tulajdonos-, szerepkör- és jogosultságmezőre.

### 22.4. Saját feladat olvasása

```sql
create policy tasks_select
on public.tasks
for select
to authenticated
using (
  private.is_communication_lead()
  or responsible_user_id = auth.uid()
  or private.is_project_owner(project_id)
  or private.is_project_member(project_id)
  or private.delegated_permission_exists('view_task', 'task', id)
);
```

### 22.5. Névadói komment

Névadói komment közvetlen INSERT-policy helyett `public.add_namesake_comment(content_id, body)` RPC-n keresztül jön létre. Az RPC:

1. ellenőrzi a névadói szerepkört;
2. ellenőrzi, hogy a tartalom előkészített vagy publikált;
3. `lead_only` láthatósággal ment;
4. kizárólag a kommunikációs vezetőnek készít értesítést;
5. auditbejegyzést hoz létre.

### 22.6. Publikáció létrehozása

Közvetlen INSERT tiltott. A `create_publication_snapshot(...)` RPC egy tranzakcióban:

1. ellenőrzi a belső tagságot és `publish_content` jogot;
2. ellenőrzi a tartalom- és projekthatókört;
3. ellenőrzi az aktív blokk hiányát;
4. ellenőrzi a megjelenési jogosultságot;
5. ellenőrzi a kötelező mezőket és URL-szabályt;
6. létrehozza a publikációt és lenyomatot;
7. csatolja a pontos fájlverziókat;
8. szükség esetén URL-pótlási feladatot készít;
9. újraszámolja a tartalom publikációs állapotát;
10. auditál és értesít.

### 22.7. Technikaiadmin-tartalommegnyitás

A technikai admin közvetlenül nem kap SELECT-policyt. A támogatási hozzáférés kétlépéses:

1. `request_support_content_access(entity_type, entity_id, reason)` létrehoz egy rövid életű, egyszer használható engedélyrekordot és visszaadja a kötelező figyelmeztetés szövegét;
2. a felhasználói megerősítés után `open_support_content(access_request_id)` korlátozott adatot ad vissza, auditál, és azonnal értesíti a kommunikációs vezetőt.

Az engedély például öt perc után lejár, és csak az adott rekord egyszeri megnyitására használható.

### 22.8. Megjelenési dokumentum

Közvetlen Storage URL nem adható. A `create_permission_document_download(permission_document_id)` RPC vagy Edge Function:

1. ellenőrzi a kommunikációsvezetői vagy adatvédelmi/jogi szerepkört;
2. újbóli hitelesítést kérhet;
3. auditálja a megnyitást vagy letöltést;
4. legfeljebb ötperces aláírt URL-t készít.

---

## 23. Storage-bucketek és policyk

### 23.1. Bucketek

| Bucket | Nyilvános? | Tartalom |
|---|---:|---|
| `working-files` | nem | normál munkafájlok 250 MB-ig |
| `previews` | nem | bélyegképek és előnézetek |
| `permission-documents` | nem | megjelenési dokumentumok |
| `imports` | nem | importforrások és hibalisták |
| `support-attachments` | nem | hibajegy-mellékletek |
| `exports` | nem | időkorlátos riportexportok |

Nyilvános bucket nincs.

### 23.2. Objektumút-konvenció

```text
working-files/{logical_file_id}/{version_number}/{timestamped_filename}
previews/{file_version_id}/{preview_type}.{ext}
permission-documents/{person_id}/{permission_id}/{immutable_filename}.pdf
imports/{import_id}/{source_filename}
support-attachments/{ticket_id}/{file_version_id}/{filename}
exports/{requesting_user_id}/{export_id}/{filename}
```

Az útvonal önmagában nem jogosultság. Letöltéskor az üzleti rekord jogosultságát is ellenőrizni kell.

### 23.3. Storage-hozzáférés

- közvetlen anonim hozzáférés tiltott;
- feltöltés csak előre létrehozott `files`/`file_versions` rekordhoz;
- karanténban lévő fájlt csak vírusellenőrző szolgáltatás olvashat;
- jogosultsági dokumentumhoz csak rövid életű szerveroldali link;
- exportlink csak az exportot kérő jogosult személynek vagy kommunikációs vezetőnek;
- technikai admin normál kliensmunkamenettel nem olvashat fájlbájtot.

---

## 24. Triggerek és ütemezett feladatok

### 24.1. Triggerek

- `set_updated_audit_fields`
- `validate_content_status_transition`
- `validate_task_status_transition`
- `validate_event_status_transition`
- `invalidate_reviews_on_substantive_change`
- `prevent_immutable_update_delete`
- `enforce_single_final_file_version`
- `create_file_sha256_job`
- `recalculate_content_publication_status`
- `handle_permission_revocation`
- `audit_sensitive_change`

### 24.2. Ütemezett feladatok

| Gyakoriság | Feladat |
|---|---|
| folyamatos/percenként | esedékes értesítések kézbesítése |
| naponta 08:00 | napi összefoglaló Europe/Budapest szerint |
| naponta 02:00 | NAS-elérhetőség ellenőrzése |
| óránként | lejárt meghívók és külső fiókok kezelése |
| óránként | határidős értesítések előállítása |
| naponta | hét napos normál értesítések archiválása |
| naponta | megőrzési szabályok szerinti törlési/archiválási jelöltek |
| havonta | vezetői hozzáférési összefoglaló |
| negyedévente | visszaállítási próba adminisztratív emlékeztetője |

---

## 25. Indexelési stratégia

### 25.1. Kötelező indexek

- minden FK-oszlop;
- aktív állapot és határidő összetett indexe;
- `contents(primary_project_id, status, planned_publish_at)`;
- `tasks(responsible_user_id, status, due_at)`;
- `tasks(project_id, status, due_at)`;
- `events(starts_at, ends_at, status)`;
- `event_participants(user_id, event_id)`;
- `notifications(recipient_user_id, read_status, archived_at, deliver_after)`;
- `publications(content_id, published_at)`;
- `appearance_permissions(person_id, status, valid_until)`;
- `content_persons(content_id, permission_check_status)`;
- `file_versions(file_id, version_number desc)`;
- `audit_log(occurred_at, actor_user_id)` és `(entity_type, entity_id, occurred_at)`;
- aktív projekttagság és aktív szerepkör részleges indexe.

### 25.2. Keresési indexek

Magyar nyelvű teljes szöveges kereséshez `tsvector` mezők és GIN-indexek:

- tartalom cím, összefoglaló, törzsszöveg;
- projekt cím és összefoglaló;
- feladat cím és leírás;
- esemény cím és leírás;
- publikált szöveg;
- kinyert PDF/DOCX/TXT szöveg.

Érzékeny dokumentum teljes szövege nem kerül a globális keresési indexbe.

### 25.3. Trigram index

`pg_trgm` használható címek, fájlnevek, személynevek és URL-ek toleráns keresésére.

---

## 26. Integritási és versenyhelyzeti szabályok

1. Tartalomverzió számozása tranzakcióban, rekordzárral történjen.
2. Publikációs lenyomat létrehozása és a tartalom állapotának újraszámítása egy tranzakció legyen.
3. Feladatátadás a felelős módosításával és előzményrekorddal egy tranzakcióban történjen.
4. Fájl végleges verziójának cseréje részleges egyedi indexszel védett.
5. Meghívó és nyilatkozati token egyszer használható; felhasználása atomi művelet.
6. Szerkesztési zárolás külön `edit_locks` táblában, lejárati idővel és optimistic locking verzióval működjön.
7. Az automatikus mentés `row_version` vagy `updated_at` alapján jelezze az ütközést.
8. Idempotens háttérfeladatokhoz `job_key` egyedi kulcs szükséges, hogy ugyanaz az értesítés vagy feldolgozás ne fusson kétszer.

### 26.1. `edit_locks`

`entity_type`, `entity_id`, `locked_by`, `acquired_at`, `heartbeat_at`, `expires_at`, egyedi `(entity_type, entity_id)`. Tizenöt perc inaktivitás után lejár. Kommunikációs vezető indoklással feloldhatja.

---

## 27. Kötelező RPC-k és szerveroldali műveletek

### 27.1. Identitás

- `bootstrap_activate_account`
- `create_invitation`
- `approve_invitation_roles`
- `accept_invitation`
- `assign_role`
- `grant_permission`
- `revoke_role_or_permission`
- `create_delegation`
- `revoke_delegation`
- `reset_mfa_request`
- `reset_mfa_approve`

### 27.2. Munkafolyamat

- `transition_project`
- `transition_content`
- `create_content_version`
- `request_content_review`
- `decide_content_review`
- `block_entity`
- `resolve_block`
- `assign_task`
- `accept_or_question_task`
- `change_task_deadline`
- `transfer_task`
- `complete_task`
- `reopen_task`

### 27.3. Esemény

- `create_event`
- `invite_event_participants`
- `respond_to_event_invitation`
- `update_material_event_details`
- `cancel_event`
- `mark_event_outcome`

### 27.4. Fájl és publikáció

- `initialize_file_upload`
- `complete_file_upload`
- `mark_file_version_final`
- `trash_file`
- `restore_file`
- `create_publication_snapshot`
- `correct_publication_snapshot`
- `mark_publication_externally_removed`
- `record_publication_metrics`

### 27.5. Jogosultság és adatvédelem

- `create_person_profile`
- `request_permission_statement`
- `submit_permission_statement_by_token`
- `verify_appearance_permission`
- `revoke_appearance_permission`
- `evaluate_content_permissions`
- `create_privacy_case`
- `close_privacy_case`

### 27.6. Támogatás és export

- `request_support_content_access`
- `open_support_content`
- `create_report_export`
- `create_permission_document_download`
- `preview_import`
- `execute_import`

---

## 28. RLS-tesztek kötelező katalógusa

Minden policyhez pozitív és negatív teszt kell. Legalább:

1. munkatárs nem lát idegen projektet;
2. projektgazda csak saját projektjét látja és módosítja;
3. külső közreműködő csak kiosztott rekordot és fájlt lát;
4. lejárt külső fiók semmit nem olvas;
5. névadó csak előkészített/publikált tartalmat lát;
6. névadói kommentet csak kommunikációs vezető olvas;
7. technikai admin közvetlenül nem olvas tartalmat;
8. támogatási megnyitás megerősítést, auditot és értesítést hoz létre;
9. munkatárs nem lát saját részletes teljesítményriportot;
10. projektgazda riportja nem tartalmaz más projektből származó adatot;
11. névadói riport nem tartalmaz személynevet vagy javítási adatot;
12. csak belső publikáló hozhat létre publikációt;
13. aktív blokk mellett publikáció nem készülhet;
14. hiányzó megjelenési jogosultság blokkolja az érintett publikációt;
15. projektgazda dokumentum helyett csak státuszt lát;
16. megjelenési dokumentumhoz illetéktelen nem kap signed URL-t;
17. publikációs lenyomat UPDATE/DELETE sikertelen;
18. auditnapló UPDATE/DELETE sikertelen;
19. meghívó és nyilatkozati token nem használható kétszer;
20. delegált jog a lejárat után azonnal megszűnik;
21. helyettes nem delegálhat tovább;
22. kritikus értesítés nem kapcsolható ki;
23. Google foglaltságból nem olvasható ki cím vagy leírás;
24. karanténfájl nem tölthető le;
25. más felhasználó exportfájlja nem tölthető le.

---

## 29. Migrációs sorrend

1. extensionök: `pgcrypto`, `citext`, `pg_trgm`;
2. sémák és enumok;
3. profil- és jogosultsági táblák;
4. törzsadatok;
5. projekt, tartalom, feladat;
6. esemény és naptár;
7. fájl és storage-metaadat;
8. személyek és megjelenési jogosultságok;
9. publikáció;
10. kommunikációs igények;
11. értesítés, import, support;
12. audit és partíciók;
13. segédfüggvények;
14. RLS-policyk;
15. tranzakciós RPC-k;
16. triggerek és ütemezett munkák;
17. nézetek és riportok;
18. seed szerepkörök, jogosultságok és törzsadatok;
19. Storage-bucketek és policyk;
20. automatizált RLS- és integritástesztek.

---

## 30. Fejlesztés előtti technikai ellenőrzőlista

- [ ] Supabase EU-régió kiválasztva
- [ ] fejlesztői, teszt- és éles projekt elkülönítve
- [ ] auth redirect URL-ek meghatározva
- [ ] Google OAuth-kliens létrehozva
- [ ] kimenő levelezés konfigurálva
- [ ] titokkezelési eljárás rögzítve
- [ ] első aktiválókódok biztonságos átadása megtervezve
- [ ] NAS-kapcsolati modell és hálózati útvonal tisztázva
- [ ] vírusellenőrző komponens kiválasztva
- [ ] backup és point-in-time recovery képesség ellenőrizve
- [ ] adatvédelmi dokumentumok megőrzési ideje jóváhagyva
- [ ] Rátgéber Akadémia arculati eszközei átadva
- [ ] induló importmezők és mintafájlok egyeztetve

---

## 31. Kész definíció

Az adatmodell és RLS-réteg akkor tekinthető implementáltnak, ha:

1. valamennyi felsorolt MVP-entitás migrációból létrejön;
2. minden exponált táblán aktív és kényszerített az RLS;
3. anonim szerepkör üzleti adatot nem olvas;
4. a 28. fejezet valamennyi jogosultsági tesztje sikeres;
5. append-only táblák módosítása és törlése blokkolt;
6. a publikálás, visszavonás, szerepköradás és támogatási megnyitás kizárólag tranzakciós szerveroldali műveleten keresztül történik;
7. Storage-hozzáférés ugyanazt az üzleti hatókört érvényesíti, mint az adatbázis;
8. az auditnapló valamennyi kötelező műveletnél bejegyzést kap;
9. a technikai admin normál úton nem képes kommunikációs tartalmat vagy jogosultsági dokumentumot olvasni;
10. a névadói és projektgazdai adatszűrés negatív tesztekkel igazolt;
11. a személyes és tesztadatok környezeti elkülönítése igazolt;
12. a mentési és visszaállítási próba dokumentáltan sikeres.

E pontok teljesülése után a frontend és a szerveroldali üzleti folyamatok biztonságos alapra építhetők.
