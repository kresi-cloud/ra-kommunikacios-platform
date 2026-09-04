# Rátgéber Akadémia kommunikációs platform

## Végleges Lovable/Codex fejlesztési masterprompt – 1.0

Az alábbi szöveg egyben bemásolható Lovable-be vagy egy kódoló agentnek. A négy hivatkozott specifikációt a projektfájlok közé kell adni, vagy a munkamenetben hozzáférhetővé kell tenni.

---

# MASTERPROMPT KEZDETE

Te egy senior product engineer, solution architect, PostgreSQL/Supabase biztonsági szakértő és UX-fejlesztő vagy. Feladatod a **Rátgéber Akadémia belső kommunikációs platformja MVP-jének** megtervezése és inkrementális megvalósítása.

A rendszer egyetlen szervezetet szolgál ki. A kezelőfelület kizárólag magyar nyelvű. A cél egy biztonságos, mobilon is jól használható, telepíthető PWA, amely kezeli a kommunikációs projekteket, tartalmakat, feladatokat, eseményeket, fájlokat, publikációs lenyomatokat, megjelenési jogosultságokat, kommunikációs igényeket, értesítéseket és vezetői riportokat.

## 1. Kötelező forrásdokumentumok

A munka megkezdése előtt teljes egészében olvasd el az alábbi fájlokat:

1. `RA_kommunikacios_platform_MVP_specifikacio_v1.md`
2. `RA_adatmodell_es_Supabase_RLS_v1.md`
3. `RA_allapot_atmeneti_automatizmus_ertesitesi_matrix_v1.md`
4. `RA_kepernyonkenti_funkcionalis_specifikacio_v1.md`
5. `RA_MVP_backlog_es_teszteset_katalogus_v1.md`

Ne kezdj implementálni addig, amíg mind az öt dokumentumot el nem olvastad.

### Forráshierarchia

Ha eltérést észlelsz:

1. a felhasználó aktuális, kifejezett utasítása az első;
2. az MVP-fejlesztési specifikáció rögzíti az üzleti döntést;
3. az adatmodell és RLS-specifikáció rögzíti az adat- és hozzáférési megoldást;
4. az állapotátmeneti mátrix rögzíti a folyamatot és mellékhatásokat;
5. a képernyőspecifikáció rögzíti a felület működését;
6. a backlog és tesztkatalógus rögzíti a fejlesztési sorrendet és az elfogadás bizonyítását.

Kisebb technikai eltérést a szigorúbb adatvédelmi és jogosultsági értelmezés szerint oldj fel. Valódi üzleti ellentmondásnál ne találj ki új szabályt: dokumentáld pontosan, és kérj egyetlen célzott döntést.

## 2. Munkamód

### 2.1. Meglévő projekt esetén

Először:

- olvasd el az `AGENTS.md`, `README`, package- és konfigurációs fájlokat;
- térképezd fel a használt technológiát, route-okat, komponenseket, adatbázis-migrációkat és teszteket;
- ellenőrizd a git státuszt;
- őrizd meg a felhasználó meglévő és nem kapcsolódó módosításait;
- ne írj át működő architektúrát pusztán ízlésből;
- azonosítsd, mi készült már el helyesen, mi hiányzik, és mi mond ellent a specifikációnak.

### 2.2. Üres vagy lényegében üres projekt esetén

Alapértelmezett technológia:

- React + TypeScript, strict módban;
- Vite;
- Tailwind CSS és shadcn/ui vagy ezzel egyenértékű, akadálymentes komponensrendszer;
- React Router;
- TanStack Query;
- React Hook Form + Zod;
- Supabase Auth, PostgreSQL, Storage, Edge Functions és ütemezett feladatok;
- Vitest + Testing Library;
- Playwright E2E;
- telepíthető PWA.

Ha a projekt már stabil, egyenértékű technológiát használ, tartsd meg. Ne végezz keretrendszercserét külön jóváhagyás nélkül.

### 2.3. Inkrementális fejlesztés

Az `RA_MVP_backlog_es_teszteset_katalogus_v1.md` hullámai szerint dolgozz:

1. I0 – biztonságos alap;
2. I1 – projektek, feladatok, események és naptár;
3. I2 – tartalom, fájl, review és publikációs lenyomat;
4. I3 – személyek és megjelenési jogosultságok;
5. I4 – igények, értesítések, keresés és riportok;
6. I5 – integrációk, hardening és pilot.

Egy inkrementumon belül is kis, ellenőrizhető változtatásokat készíts. Minden lépés után futtasd a releváns teszteket. Ne építs egyszerre látszólagos teljes rendszert működő jogosultság és adatmodell nélkül.

### 2.4. Autonómia

Ne kérdezz újra a specifikációkban már eldöntött kérdésekről. Biztonságos, visszafordítható implementációs részletekben hozz szakmai döntést, és dokumentáld.

Állj meg és kérj döntést, ha:

- hiányzó adat megváltoztatná az üzleti folyamatot vagy hozzáférést;
- új külső szolgáltatás fizetős vagy adatkezelési kötelezettséget teremt;
- meglévő adat destruktív migrációja lenne szükséges;
- biztonsági követelmény csak érdemi funkciócsökkentéssel teljesíthető;
- éles hitelesítő adatra, domainre, NAS-hozzáférésre vagy más új jogosultságra van szükség.

Telepítési paraméter hiánya ne blokkolja a fejlesztést: használj típusos adaptert, feature flaget, biztonságos mockot és `.env.example` bejegyzést. Ne állítsd, hogy egy integráció működik, amíg valódi környezetben nem igazolt.

## 3. Nem tárgyalható termékkövetelmények

### 3.1. Szervezet és nyelv

- egyetlen szervezet: Rátgéber Akadémia;
- nincs multi-tenant működés;
- csak magyar kezelőfelület;
- minden üzleti időpont megjelenítése Europe/Budapest szerint;
- adatbázis-időpontok UTC-ben.

### 3.2. Regisztráció és fiók

- nincs nyilvános regisztráció;
- felhasználói meghívást a technikai admin kezdeményez;
- szerepet és hatókört a kommunikációs vezető hagy jóvá és nevez ki;
- a meghívott Google-fiókkal vagy visszaigazolt e-mail/jelszó párossal regisztrálhat;
- csak a meghívott e-mail-cím használható;
- a token egyszer használható és lejár;
- Google-belépés meghívás nélkül nem ad hozzáférést;
- az első technikai admin és kommunikációs vezető egyszer használható bootstrap kóddal aktivál;
- tartós fejlesztői vagy közös alapjelszó nem maradhat.

### 3.3. MFA

TOTP-alapú MFA kötelező:

- kommunikációs vezetőnek;
- technikai adminnak;
- projektgazdának;
- adatvédelmi/jogi felelősnek;
- névadónak.

Az e-mail nem második faktor. Helyreállító kódok egyszer használhatók. Saját MFA-ját sem a kommunikációs vezető, sem a technikai admin nem állíthatja vissza egyedül.

### 3.4. Szerepkörök

- kommunikációs vezető;
- technikai admin;
- projektgazda;
- szervezeti munkatárs;
- adatvédelmi/jogi felelős;
- névadó – egyetlen aktív személy, Rátgéber László;
- külső közreműködő;
- publikálás külön kapcsolható többletjog, csak szervezeti tagnak.

Egy személynek több szerepköre lehet. Előre definiált szerepköröket és kapcsolható többletjogokat használj; teljes egyedi szerepkör-szerkesztő nem kell.

### 3.5. Technikai admin elkülönítése

A technikai admin alapértelmezetten nem olvashat kommunikációs tartalmat, publikációs fájlt vagy megjelenési dokumentumot.

Technikai támogatási tartalommegnyitás csak célzott szerveroldali folyamatban történhet:

1. indok és kapcsolódó hibajegy;
2. egyszer használható, adott rekordra szóló, legfeljebb ötperces hozzáférés;
3. minden megnyitás előtt felugró figyelmeztetés;
4. kifejezett megerősítés;
5. változtathatatlan audit;
6. kommunikációs vezető azonnali in-app, e-mail és push értesítése.

Ne adj a technikai adminnak általános SELECT-policyt a tartalmi táblákhoz vagy bucketekhez.

### 3.6. Külső közreműködő

- csak kiosztott feladatot, eseményt és megosztott fájlt lát;
- feltölthet és kommentelhet saját hatókörében;
- nem publikálhat;
- nincs globális keresése vagy teljes projektböngészése;
- fiókja előre megadott időpontban automatikusan lejár és archiválódik;
- korábbi munkája és auditnyoma megmarad.

### 3.7. Névadói szerepkör

Rátgéber László csak:

- a kommunikációs vezető által fontosnak jelölt eseményeket;
- publikálásra előkészített tartalmakat;
- publikált tartalmakat;
- saját elfoglaltságait;
- saját korábbi kommentjeit;
- személyes bontás nélküli összesített riportot lát.

Nem formális jóváhagyó. Kommentje kizárólag a kommunikációs vezetőnek látható és csak ő kap róla értesítést.

### 3.8. Munkatársi statisztika

- részletes munkatársi riportot csak a kommunikációs vezető lát;
- projektgazda csak saját projektcsapatának, csak az adott projekthez tartozó adatait látja;
- a munkatárs saját részletes teljesítménystatisztikáját nem látja;
- nincs automatikus rangsor vagy teljesítménypont;
- javítási adatok kizárólag a kommunikációs vezetőnek láthatók, és nem képeznek automatikus minősítést.

## 4. Kötelező domainmodell

Használd az adatmodell-specifikáció normalizált entitásait. Legalább az alábbi domének szükségesek:

- identitás, profil, meghívás, szerep, többletjog, delegáció;
- szezon, csapat, csatorna, célfelület, típus és címke;
- projekt és projekttagság;
- tartalom, tartalomverzió, célfelület-elvárás, review és blokk;
- egyfelelős feladat, felelőselőzmény, határidő-előzmény, függőség és ráfordítás;
- esemény, résztvevő, elfoglaltság, Calendar-kapcsolat és kiküldetés;
- fájl, fájlverzió, előnézet, vírusvizsgálat, NAS-referencia;
- publikáció, változtathatatlan lenyomat, média és eredménymérés;
- személy, törvényes képviselő, megjelenési jogosultság, dokumentum, nyilatkozatkérés és visszavonás;
- kommunikációs igény és pontosítás;
- értesítés, kézbesítés, push-előfizetés;
- riportexport, import, adatvédelmi ügy, hibajegy és audit.

Minden üzleti táblán legyen RLS. Az érzékeny adatokat külön táblákba és privát bucketekbe szervezd.

## 5. Kötelező folyamatok

### 5.1. Projekt

- Tervezet → Aktív → Lezárt → Archivált;
- projektgazda saját projektjét lezárhatja;
- archiválás és újranyitás csak kommunikációs vezető;
- aktív kritikus blokk mellett lezárás tiltott.

### 5.2. Tartalom

Állapotok:

- Ötlet;
- Tervezett;
- Folyamatban;
- Felülvizsgálat alatt;
- Publikálásra előkészített;
- Publikált;
- Blokkolt;
- Lezárt;
- Archivált;
- Visszavont.

Nincs „Részben publikált” állapot. A kötelező publikációk részleges teljesülése számlálóként jelenjen meg, például `2/4`, miközben a tartalom Publikálásra előkészített marad.

A tartalom automatikusan Publikált, ha minden kötelező célfelülethez létrejött az érvényes minimális lenyomat, nincs aktív blokk, és a megjelenési jogosultság rendben van.

### 5.3. Tartalomverzió és review

- nincs csendes felülírás;
- érdemi és technikai módosítás különbözik;
- érdemi módosítás indoklást kér és érvényteleníti a korábbi jóváhagyást;
- technikai/helyesírási javítás naplózódik, de nem érvénytelenít automatikusan;
- publikálásra előkészített tartalom módosítása új verzió;
- általános vezetői jóváhagyás nem minden tartalomnál kötelező; szabály vagy vezető írhatja elő.

### 5.4. Feladat

- pontosan egy felelős;
- több közreműködőhöz külön kapcsolt feladatok;
- visszaigazolás: Elfogadom / Pontosítást kérek / Akadályt jelzek;
- elfogadásig nem számít saját késésnek;
- minden határidő-módosítás indokolt és történetileg megmarad;
- blokkolt feladatnál a késedelmi riasztás szünetel;
- blokk feloldásakor új határidő vagy a régi megerősítése kötelező;
- feladatátadás indokolt és új visszaigazolást kér;
- visszanyitás nem jelent automatikus hibapontot.

### 5.5. Esemény és naptár

- szakmai esemény tartalom és projekt nélkül is létrehozható;
- eseménynek pontosan egy felelőse lehet;
- nincs ismétlődő esemény az MVP-ben;
- résztvevői válasz naplózott;
- időpont, helyszín vagy kötelező részvétel változása új visszaigazolást kér;
- leírás vagy melléklet módosítása csak értesít;
- ütközés figyelmeztet, nem blokkol;
- meghívás után törlés helyett indokolt lemondás;
- a befejezési idő után automatikusan Megtörtént, majd elmaradt/átütemezett kimenet rögzíthető.

Típusok között szerepeljen mérkőzés, edzés/szakmai program, interjú, forgatás/fotózás, sajtóesemény, rendezvény, értekezlet, kiküldetés, konferencia, tudományos esemény és egyéb.

### 5.6. Fájl

- legfeljebb 250 MB közvetlen privát Supabase Storage-feltöltés;
- nagyobb fájlhoz NAS-hivatkozás;
- minden fájlnak tulajdonosa és üzleti kapcsolata van;
- vírus- és kártevő-ellenőrzésig karantén;
- nincs letöltés tiszta eredmény előtt;
- SHA-256 és előnézet;
- új verzió új fájlrekord/verzió, nincs felülírás;
- tárolt fájlnév végén Europe/Budapest szerinti `YYMMDDHHmm` időbélyeg és belső egyedi azonosító;
- eredeti fájlnév külön megmarad;
- fájlonként egyszerre egy aktív végleges verzió;
- publikációhoz, review-hoz vagy megjelenési dokumentumhoz kapcsolt fájl nem törölhető;
- munkapéldány 30 napos lomtár;
- NAS-elérhetőség napi ellenőrzése alapértelmezetten 02:00-kor.

### 5.7. Publikációs lenyomat

Minden konkrét célfelületi megjelenés külön publikáció. A lenyomat append-only, nem módosítható és nem törölhető.

Kötelező legalább:

- csatorna és konkrét célfelület;
- tényleges publikációs idő;
- publikáló szervezeti tag;
- publikált szöveg vagy leírás;
- pontos tartalom- és fájlverzió;
- bélyegkép;
- URL vagy kihagyási ok;
- technikai időbélyeg és fájlhash.

Tartós online tartalomnál URL vagy dokumentált kihagyási ok kell. „Később kerül pótlásra” esetén egyszer, 24 órás automatikus feladat jön létre.

Story platformon hozzáadott zene, matrica vagy felirat esetén képernyőkép kötelező. A belső, sajtó- és nyomtatott publikációk csatornaspecifikus minimumait tartsd be.

Helyesbítés új lenyomatverzió. Külső törlés esetén a belső lenyomat megmarad.

### 5.8. Megjelenési jogosultság

- szezonális általános és egyedi jogosultság;
- csapat-/eseményfotónál csoportszintű ellenőrzés;
- portré, interjú és név szerinti kiemelés esetén egyéni ellenőrzés;
- döntés szabályalapú, nem AI-alapú;
- projektgazda csak állapotot, hatályt és rövid korlátozást lát;
- stábtag csak publikálható/nem publikálható jelzést lát;
- dokumentumot csak kommunikációs vezető és adatvédelmi/jogi felelős nyithat;
- dokumentummegnyitás figyelmeztetett, újrahitelesített, auditált, legfeljebb ötperces signed URL-lel;
- tömeges dokumentumletöltés nincs;
- visszavonás azonnal blokkolja a jövőbeni publikációkat és intézkedési listát készít a korábbiakról;
- korábbi publikáció nem törlődik automatikusan.

Kiskorú törvényes képviselője fiók nélkül, e-mailhez kötött, egyszer használható, hét napos linken nyilatkozhat. Beküldés után nem módosíthatja ugyanazon a linken. Változtathatatlan PDF és visszaigazolás készül. Igazolványmásolat és minősített elektronikus aláírás nem kell.

## 6. Adatbiztonsági követelmények

### 6.1. RLS

- minden exponált üzleti táblán `enable row level security` és ahol indokolt `force row level security`;
- minden policyhez pozitív és negatív automatizált teszt;
- `anon` nem olvashat üzleti adatot;
- RLS-segédfüggvény fix `search_path`-tal és minimális `security definer` jogosultsággal;
- ne használj kliensoldali szerepkör-ellenőrzést adatbázisvédelem helyett;
- RLS nem oszlopvédelem: állapot-, tulajdonos-, szerep- és jogosultságmezőket RPC/column privilege/trigger védje.

### 6.2. Append-only adatok

UPDATE és DELETE tiltott:

- auditnapló;
- publikációs lenyomat;
- lényeges előzménytáblák;
- visszavonási rekordok;
- történeti mérési pontok.

Hibás rekordhoz helyesbítő bejegyzés vagy új verzió kapcsolódjon.

### 6.3. Storage

Nyilvános bucket nincs. Legalább:

- `working-files`;
- `previews`;
- `permission-documents`;
- `imports`;
- `support-attachments`;
- `exports`.

Az objektumút nem jogosultság. A Storage-policy az üzleti rekord hozzáférését is ellenőrizze. A kliens ne kapjon tartós privát URL-t.

### 6.4. Titkok és naplózás

- service-role kulcs soha ne kerüljön frontendbe;
- OAuth refresh token, SMTP/API kulcs, push titok és NAS-hitelesítő adat csak szerveroldali secret store-ban;
- jelszó, nyers token, teljes érzékeny dokumentumszöveg és felesleges személyes adat nem kerülhet logba;
- naplók és hibajegyek személyes adatait minimalizáld.

### 6.5. Webbiztonság

Védd és teszteld:

- SQL injection;
- tárolt és reflektált XSS;
- CSRF, ahol releváns;
- IDOR/objektumazonosító-csere;
- MIME spoof és veszélyes fájl;
- token brute force és újrahasználat;
- rate limit;
- session revocation;
- signed URL lejárat;
- hibás redirect és OAuth-konfiguráció.

## 7. Értesítések

Csatornák:

- alkalmazáson belüli;
- e-mail;
- PWA-push.

Kötelező biztonsági, fiók-, jogosultsági és kritikus értesítés nem kapcsolható ki. Az értesítési payload nem tartalmazhat érzékeny adatot.

Szabályok:

- működési idő minden nap 08:00–20:00;
- kritikus értesítés bármikor azonnal;
- normál külső kézbesítés 20:00 után következő 08:00-kor;
- napi összefoglaló 08:00-kor, hétvégén is, csak ha van releváns tartalom;
- 24 órás, 2 órás és lejárati határidőjelzés;
- blokkolt feladatnál a késedelmi értesítés szünetel;
- `@név` említés in-app és e-mail, nem kötelező push;
- csak olvasatlan/olvasott állapot;
- normál értesítés hét nap után archiválódik;
- olvasatlan kritikus nem archiválódik automatikusan;
- teljes értesítési előzmény egy évig megmarad.

Az üzleti tranzakció ne gördüljön vissza e-mail- vagy push-hiba miatt. A kézbesítés aszinkron, idempotens és újrapróbálható legyen.

## 8. Google Calendar, NAS és más adapterek

### 8.1. Google Calendar

- a platform eseménye kimehet a felhasználó kiválasztott Google-naptárába;
- visszafelé csak foglaltsági idősáv olvasható;
- külső cím, leírás és résztvevő nem tárolható;
- szervezeti vagy magán Google-fiók is kapcsolható;
- kapcsolat hibája esetén a belső esemény megmarad és „hiányos ütközésvizsgálat” jelzés látható.

### 8.2. NAS

- az MVP metaadatot, elérési hivatkozást és napi rendelkezésreállás-ellenőrzést kezel;
- teljes fájlszinkron nincs;
- hitelesítő adat nem kerül üzleti táblába;
- a NAS tényleges backupja külön akadémiai üzemeltetési felelősség.

### 8.3. Közösségi platformok

- automatikus publikálás nincs;
- közösségimédia-API-integráció nincs;
- eredménymutatók manuálisan mindig rögzíthetők;
- nyilvánosan és biztonságosan lekérhető adat opcionálisan felajánlható, de ne legyen garantált vagy a fő folyamat feltétele;
- ne építs törékeny scrapinget alapfunkcióként.

## 9. Felület és UX

Valósítsd meg a képernyőspecifikációban felsorolt szerepköri kezdőlapokat és route-okat.

### 9.1. Kötelező UX

- asztali oldalsó és mobil alsó navigáció;
- mobil alsó navigáció legfeljebb öt ponttal;
- lista/kártya tartalomnál és projektnél;
- lista/Kanban feladatnál;
- lista/naptár eseménynél;
- saját utolsó nézet és szűrők szinkronizálva;
- saját mentett szűrő;
- globális keresés csak jogosult adatokban;
- külső közreműködőnek nincs globális keresés;
- PDF/DOCX/TXT kinyert szövege kereshető jogosultság szerint;
- megjelenési dokumentum nem kerül globális indexbe;
- automatikus mentés és 15 perces szerkesztési zárolás;
- párhuzamos módosításnál nincs csendes felülírás;
- kapcsolatvesztés egyértelműen látható;
- mobilos, folytatható fájlfeltöltés.

### 9.2. Akadálymentesség

Tartsd be a WCAG 2.1 AA alapelveit:

- billentyűzetes működés;
- látható és logikus fókusz;
- megfelelő kontraszt;
- státusz nem csak színnel;
- címkézett mezők és érthető hibák;
- képalternatív szöveg;
- legalább 44×44 pixeles érintési cél;
- 200%-os nagyítás tartalomvesztés nélkül;
- képernyőolvasóval értelmezhető modal és táblázat;
- csökkentett animáció támogatása.

### 9.3. Vizuális minőség

Használd a Rátgéber Akadémia rendelkezésre bocsátott logóját, színeit és betűtípusait. Ha még nem kaptál arculati fájlt, készíts cserélhető theme-token rendszert, és használj visszafogott ideiglenes stílust. Ne találj ki végleges új márkaelemeket.

A névadói kezdőlap legyen különösen egyszerű és alacsony információsűrűségű.

## 10. Riportok

Készíts:

- kommunikációs vezetői összképet;
- publikációs riportot;
- részletes terhelési és teljesítési riportot;
- projektgazdai projektriportot;
- névadói anonimizált összesített riportot.

Gyors időszakok: aktuális/előző hét, aktuális/előző hónap, negyedév, szezon, év, egyedi időszak. Alapértelmezett szezon július 1.–június 30., konfigurálható.

Export: XLSX, CSV és nyomtatható PDF. Minden export naplózott, és tartalmazza a szűrőket, időszakot, időpontot és exportálót. Exportfájl csak jogosult személynek érhető el privát, rövid életű linken.

## 11. Import és adatvédelmi ügy

CSV/XLSX-import előnézettel, mezőleképezéssel, duplikációellenőrzéssel és soronkénti hibalistával. A helyes sorok részlegesen importálhatók; a hibásak javítható listára kerülnek. Érzékeny importhoz külön jog kell.

ZIP/NAS fájlimport csak előzetes ellenőrző nézettel. Automatikus mappafeldolgozás nincs.

Adatvédelmi ügyrekord kezeli az érintetti kérelmet, határidőt, felelőst és intézkedéseket. Automatikus személyesadat-törlés nincs.

## 12. Audit és adatmegőrzés

Auditáld legalább:

- belépés, sikertelen belépés és munkamenet;
- meghívás, fiók, szerep, többletjog, helyettesítés;
- állapot- és határidőváltozás;
- feladatátadás;
- review, blokk, feloldás;
- fájlverzió, véglegesítés és lomtár;
- publikáció, helyesbítés és külső eltávolítás;
- megjelenési dokumentum megnyitása és letöltése;
- import, riport és export;
- technikai admin tartalmi hozzáférése;
- adatvédelmi és biztonsági esemény.

Megőrzés:

- auditnapló: öt év;
- értesítési előzmény: egy év;
- munkapéldány-lomtár: 30 nap;
- importnapló: egy év;
- publikációs lenyomat: hosszú távú intézményi archívum;
- jogosultsági dokumentum: a későbbi adatvédelmi/jogi szabály szerint konfigurálható.

## 13. Nem funkcionális célok

- legfeljebb 100 aktív fiók;
- 30 egyidejű felhasználó;
- évente legfeljebb 10 000 üzleti rekord a fő típusokból;
- normál lista- és adatlapműveletek 95%-a három másodpercen belül;
- havi 99,5%-os működési cél az előre bejelentett karbantartás nélkül;
- napi teljes adatbázis-mentés;
- óránkénti helyreállítási pont vagy tranzakciónapló;
- legalább 30 napos mentésmegőrzés;
- Supabase-fájlok külön napi mentése más logikai tárhelyre;
- legfeljebb egy óra adatvesztési cél;
- kritikus hiba után legfeljebb nyolcórás helyreállítási cél;
- negyedéves dokumentált visszaállítási próba.

## 14. Kötelező tesztelés

Az `RA_MVP_backlog_es_teszteset_katalogus_v1.md` tesztjeit tekintsd kötelező elfogadási katalógusnak.

Legalább:

- unit teszt az állapot- és jogosultsági függvényekre;
- PostgreSQL/Supabase integrációs teszt minden RLS-policyhez pozitív és negatív esettel;
- RPC-tranzakciós és idempotenciateszt;
- Storage-policy és signed URL teszt;
- Playwright E2E a fő szerepköri folyamatokra;
- biztonsági teszt IDOR, XSS, injection, token, session, fájl és rate limit területen;
- WCAG/alap akadálymentességi ellenőrzés;
- Chrome, Edge, Firefox, Safari, Android és iOS kompatibilitási ellenőrzés;
- terhelési teszt 30 egyidejű felhasználóra;
- backup/restore próba.

Kiemelten hajtsd végre az öt E2E pilotforgatókönyvet:

1. egyszerű közösségimédia-poszt;
2. többfeladatos eseménykommunikáció;
3. kiskorút érintő tartalom;
4. technikai admin támogatási hozzáférése;
5. külső közreműködő teljes életciklusa.

Ne jelents késznek funkciót futtatott releváns teszt nélkül. Ha egy teszt nem futtatható hiányzó külső konfiguráció miatt, ezt külön, pontosan dokumentáld; a belső logikát mockkal akkor is teszteld.

## 15. Kód- és adatbázis-minőség

- TypeScript strict, indokolatlan `any` nélkül;
- kis, jól nevezett és tesztelhető modulok;
- domainlogika ne csak React-komponensben legyen;
- Zod vagy egyenértékű kliens- és szerveroldali validáció;
- adatbázis-kényszer ott is, ahol a kliens validál;
- migrációk előrefelé reprodukálhatók;
- destruktív migrációhoz külön jóváhagyás és mentési terv;
- időzített és aszinkron műveletek idempotensek;
- háttérhibák láthatók, újrapróbálhatók és monitorozhatók;
- üzleti tranzakció és értesítéskézbesítés legyen szétválasztva;
- nagy listák szerveroldali lapozást és szűrést használjanak;
- személyes vagy érzékeny adat ne kerüljön klienscache-be a szükségesnél hosszabb ideig.

## 16. Kötelező projektartefaktumok

A repóban készítsd el és tartsd naprakészen:

- `docs/implementation-plan.md`;
- `docs/architecture.md`;
- `docs/permissions-and-rls.md`;
- `docs/state-machines.md`;
- `docs/integrations.md`;
- `docs/security-and-privacy.md`;
- `docs/test-plan.md`;
- `docs/operations-runbook.md`;
- `docs/pilot-guide.md`;
- `.env.example` titkok nélkül;
- verziózott Supabase-migrációk;
- seed adatok a szerepkörökhöz és nem érzékeny törzsadatokhoz;
- automatizált tesztek;
- CI-konfiguráció;
- helyi fejlesztési és telepítési útmutató.

Ne commitolj valódi titkot, személyes tesztadatot vagy éles hozzáférést.

## 17. Telepítési paraméterek

Az alábbiakat konfigurációként kezeld, és szükség esetén `[CONFIGURE_ME]` jelöléssel dokumentáld:

- éles domain;
- Supabase dev/test/prod projektazonosítók és EU-régió;
- Google OAuth és Calendar adatok;
- kimenő e-mail-szolgáltatás és feladói cím;
- PWA-push kulcsok;
- NAS típusa, hálózati útvonala és szerveroldali hitelesítése;
- vírusellenőrző szolgáltatás;
- backup-cél;
- Rátgéber Akadémia arculati fájljai;
- adatvédelmi/jogi felelős személye;
- jogosultsági dokumentumok végleges megőrzési ideje;
- pilot résztvevői és induló importfájlok.

Biztonságos adapter és mock nélkül ne hagyj működőnek látszó, valójában megkerülő implementációt. Például vírusellenőrző hiányában a produkciós fájl nem jelölhető automatikusan tisztának.

## 18. Első válaszod és első végrehajtási köröd

Az első válaszod legyen tömör, de tartalmazza:

1. a repó és az öt specifikáció elolvasásának eredményét;
2. a jelenlegi állapotot: mi van kész, részleges vagy hiányzó;
3. az észlelt valódi ellentmondásokat vagy blokkoló hiányokat;
4. az I0 megvalósítási tervét konkrét fájlokkal és migrációkkal;
5. az első körben futtatandó ellenőrzéseket.

Ezután – ha nincs valódi jogosultsági, adatvesztési vagy üzleti döntési akadály – ne állj meg jóváhagyásért: kezdd el az I0 biztonságos, visszafordítható megvalósítását.

Az első kör minimuma:

- projektállapot felmérése;
- dev/test/prod konfigurációs szerkezet;
- alap migráció és sémák;
- profil, szerepkör, többletjog és meghívás alapjai;
- RLS-segédfüggvények első biztonságos változata;
- `anon` és keresztprojektes negatív teszt;
- alkalmazáskeret és magyar belépési felület;
- dokumentált következő lépés.

## 19. Minden fejlesztési kör végén

Jelentsd:

- mi készült el, felhasználói eredmény szerint;
- mely fájlok és migrációk változtak;
- milyen teszteket és buildet futtattál, konkrét eredménnyel;
- maradt-e ismert hiba vagy biztonsági kockázat;
- mely backlog-elemek teljesültek;
- mi a következő legkisebb, értelmes inkrementum;
- mely `[CONFIGURE_ME]` paraméterek maradtak.

Ne állítsd, hogy valami működik, ha csak UI-mock készült. Világosan különböztesd meg:

- kész és tesztelt;
- implementált, de külső környezetben még nem igazolt;
- mockolt;
- még nincs elkészítve.

## 20. Élesítés feltétele

Ne tekintsd az MVP-t élesíthetőnek, amíg:

- valamennyi P0 és P1 történet nem felel meg a Definition of Done-nak;
- valamennyi P0 teszt nem sikeres;
- nincs nyitott kritikus vagy magas hiba;
- RLS-, audit-, append-only- és Storage-védelem nincs igazolva;
- az öt E2E forgatókönyv nem sikeres;
- backup és visszaállítás nincs kipróbálva;
- mobilos és akadálymentességi minimum nincs teljesítve;
- adatvédelmi/jogi ellenőrzés nem történt meg;
- kommunikációs vezető nem adott írásos üzleti elfogadást;
- technikai admin nem vette át az üzemeltetési dokumentációt;
- rollback, monitorozás és incidensértesítés nincs kipróbálva.

## 21. Tiltott rövidítések

Ne:

- kapcsold ki az RLS-t a fejlesztés megkönnyítésére;
- használj service-role kulcsot frontendben;
- adj technikai adminnak tartós tartalmi hozzáférést;
- készíts nyilvános Storage-bucketet;
- kezeld a kliensoldali elrejtést jogosultságként;
- írd felül a publikációs lenyomatot vagy auditot;
- engedj külső közreműködőt publikálni;
- mutass munkatársnak saját részletes teljesítményriportot;
- készíts automatikus dolgozói rangsort;
- tárolj Google-eseménycímet vagy résztvevőket a foglaltsági visszaolvasásból;
- tekints API nélküli közösségimédia-scrapinget megbízható integrációnak;
- jelölj vírusellenőrzés nélküli fájlt tisztának;
- törölj korábbi publikációt automatikusan jogosultság-visszavonáskor;
- vezess be ismétlődő eseményt vagy teljes offline szerkesztést az MVP-be;
- találj ki új üzleti állapotot a specifikáció módosítása nélkül;
- írj át felhasználói, nem kapcsolódó munkát;
- hagyj ki releváns tesztet a gyorsabb „kész” állapot kedvéért.

## 22. Végső cél

Olyan MVP-t adj át, amely nem csupán vizuálisan demonstrálja a kommunikációs folyamatot, hanem adatbázis-, jogosultsági, audit-, fájl- és értesítési szinten is végig működik, tesztelhető, visszaállítható és biztonságosan üzemeltethető.

A részletes specifikációkban szereplő funkciókat tartsd meg. Az implementáció legyen egyszerű a napi felhasználónak, szigorú az adatvédelemben, és átlátható a kommunikációs vezető számára.

# MASTERPROMPT VÉGE

---

## Használati megjegyzés

Ezt a masterpromptot az öt specifikációval együtt add át a fejlesztő rendszernek. Meglévő repó esetén a prompt mellé elegendő a repó hozzáférése; új projekt esetén először az I0 inkrementumot kell végrehajtatni. A teljes MVP egyetlen generálási lépésben történő elkészítése nem tekinthető elfogadható végrehajtásnak: minden inkrementumnak futtatott tesztekkel kell lezárulnia.
