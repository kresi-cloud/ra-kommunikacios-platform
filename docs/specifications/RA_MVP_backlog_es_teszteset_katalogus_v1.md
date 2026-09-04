# Rátgéber Akadémia kommunikációs platform

## Prioritizált MVP-backlog és teszteset-katalógus – 1.0

**Kapcsolódó specifikációk:**

- MVP fejlesztési specifikáció 1.0
- Részletes adatmodell és Supabase RLS-specifikáció 1.0
- Állapotátmeneti, automatizmus- és értesítési mátrix 1.0
- Képernyőnkénti funkcionális specifikáció és navigációs terv 1.0

---

## 1. Használati mód

Ez a dokumentum két célt szolgál:

1. végrehajtható sorrendbe rendezi az MVP fejlesztési munkáját;
2. meghatározza azokat a teszteket, amelyekkel az MVP elfogadhatósága bizonyítható.

A backlog nem naptári ígéret. Az elemek sorrendjét a technikai függőség, a biztonsági kockázat és az üzleti érték határozza meg. A tényleges időbecsléshez a fejlesztőcsapat összetétele és kapacitása szükséges.

---

## 2. Prioritási rendszer

| Prioritás | Jelentés | Kiadási szabály |
|---|---|---|
| P0 | Alapvető biztonsági vagy fő üzleti funkció | Nélküle pilot sem indulhat |
| P1 | Az elfogadott MVP szükséges része | Korlátozott pilot indulhat átmeneti megoldással, éles kiadás nem |
| P2 | Későbbi fejlesztés vagy kényelmi bővítés | Nem része az MVP-kiadásnak |

### 2.1. Méretjelölés

| Méret | Jelentés |
|---|---|
| S | egy szűk, kevés komponenst érintő történet |
| M | több réteget vagy képernyőt érintő történet |
| L | összetett, több történetre bontandó epic-szintű munka |

Az L elemeket fejlesztés előtt kisebb technikai feladatokra kell bontani.

---

## 3. Szállítási inkrementumok

| Inkrementum | Cél | Fő eredmény |
|---|---|---|
| I0 – Biztonságos alap | környezet, adatbázis, auth, RLS, CI/CD | beléphető, tesztelt alapváz |
| I1 – Napi munkaszervezés | projektek, feladatok, események, naptár | működő belső koordináció |
| I2 – Tartalom és publikáció | tartalom, verzió, review, fájl, lenyomat | végigvihető publikációs folyamat |
| I3 – Személyek és jogok | személyprofil, nyilatkozat, ellenőrzés, visszavonás | jogszerű megjelenési kontroll |
| I4 – Igények, értesítések és riportok | igénybejelentés, push/e-mail, vezetői riport | vezetői és szervezeti használhatóság |
| I5 – Integráció, hardening és pilot | Calendar, NAS, import, backup, teljesítmény, pilot | élesítésre alkalmas MVP |

Minden inkrementum önállóan demonstrálható és automatizált regressziós tesztekkel zárandó.

---

## 4. Epicjegyzék és függőségek

| Epic | Név | Prioritás | Függőség | Inkrementum |
|---|---|---|---|---|
| E00 | Projektalapok és környezetek | P0 | nincs | I0 |
| E01 | Hitelesítés és fiókéletciklus | P0 | E00 | I0 |
| E02 | Szerepkörök, RLS és audit | P0 | E00–E01 | I0 |
| E03 | Alkalmazáskeret, navigáció, arculat | P0 | E01–E02 | I0–I1 |
| E04 | Projektek és törzsadatok | P0 | E02–E03 | I1 |
| E05 | Feladatkezelés | P0 | E04 | I1 |
| E06 | Események, naptár és elfoglaltság | P0 | E04–E05 | I1 |
| E07 | Tartalom és verziókezelés | P0 | E04–E05 | I2 |
| E08 | Fájlok, Storage és NAS-metaadat | P0 | E02, E07 | I2 |
| E09 | Felülvizsgálat, blokk és komment | P0 | E07–E08 | I2 |
| E10 | Publikáció és változtathatatlan lenyomat | P0 | E07–E09 | I2 |
| E11 | Személyek és megjelenési jogosultság | P0 | E02, E07–E08 | I3 |
| E12 | Kommunikációs igények | P1 | E04–E08 | I4 |
| E13 | Értesítések és háttérfolyamatok | P0 | E01–E12 | I1–I4 |
| E14 | Keresés, riport és export | P1 | E04–E13 | I4 |
| E15 | Adminisztráció, import és támogatás | P1 | E01–E14 | I4–I5 |
| E16 | Integrációk | P1 | E06, E08, E13 | I5 |
| E17 | Biztonsági és üzemeltetési hardening | P0 | valamennyi | I0–I5 |
| E18 | Pilot és élesítési átadás | P0 | E00–E17 | I5 |

---

## 5. Definition of Ready

Egy user story akkor fejleszthető:

- üzleti célja és szerepköre egyértelmű;
- kapcsolódó képernyő és adatobjektum azonosított;
- előfeltétel és elfogadási kritérium rendelkezésre áll;
- RLS-hatás és auditkövetelmény tisztázott;
- külső integráció esetén tesztkörnyezet vagy mock rendelkezésre áll;
- nincs feloldatlan, az eredményt érdemben megváltoztató döntés;
- függő P0 történetek legalább fejlesztés alatt állnak.

---

## 6. Általános Definition of Done

Minden történetnél kötelező:

1. kódreview;
2. adatbázis-migráció verziózva, ha szükséges;
3. RLS bekapcsolva és negatív teszttel igazolva;
4. auditálás, ha a művelet auditköteles;
5. egység-, integrációs és legalább egy végponttól végpontig tartó teszt;
6. asztali és mobil alapellenőrzés;
7. akadálymentességi alapellenőrzés;
8. magyar felületi szöveg és értelmes hibaüzenet;
9. nincs naplóba került jelszó, token vagy szükségtelen személyes adat;
10. dokumentáció és kapcsolódó teszteset frissítve;
11. tesztkörnyezetben elfogadva;
12. nincs nyitott kritikus vagy magas súlyosságú regresszió.

---

## 7. Prioritizált user story backlog

### E00 – Projektalapok és környezetek

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-0001 | P0 | M | Fejlesztőként elkülönített dev, test és prod környezetet akarok. | külön Supabase-projekt/adatbázis/tárhely; titkok nem közösek |
| US-0002 | P0 | M | Üzemeltetőként verziózott adatbázis-migrációt akarok. | tiszta adatbázisra reprodukálható; visszaállási terv |
| US-0003 | P0 | M | Fejlesztőként automatizált ellenőrzési folyamatot akarok. | lint, típusellenőrzés, unit/integration test, build |
| US-0004 | P0 | S | Üzemeltetőként környezetenkénti konfigurációt akarok. | secret store; kliensben nincs service-role vagy titok |
| US-0005 | P0 | S | Felhasználóként magyar és Europe/Budapest szerinti felületet akarok. | UTC-tárolás; helyes nyári/téli időszámítás |

### E01 – Hitelesítés és fiókéletciklus

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-0101 | P0 | M | Tech adminként meghívást akarok kezdeményezni. | e-mail, lejárat, egyszer használható token; szerepjavaslat nem válik aktívvá jóváhagyás nélkül |
| US-0102 | P0 | M | Kommunikációs vezetőként jóvá akarom hagyni a szerepet és hatókört. | kinevező és kezdeményező külön naplózva |
| US-0103 | P0 | M | Meghívottként Google-fiókkal akarok belépni. | csak meghívott e-mail; előzetes meghívás nélkül nincs hozzáférés |
| US-0104 | P0 | M | Meghívottként e-mail/jelszóval akarok regisztrálni. | e-mail-visszaigazolás; 12 karakteres és kompromittáltjelszó-ellenőrzés |
| US-0105 | P0 | M | Kiemelt szerepkörként TOTP MFA-t akarok használni. | aktiválás MFA nélkül nem fejezhető be; helyreállító kódok |
| US-0106 | P0 | M | Első adminisztrátorként egyszer használható bootstrap kóddal akarok aktiválni. | nyers kód nem tárolódik; egyszer használható |
| US-0107 | P0 | S | Felhasználóként jelszót akarok visszaállítani. | semleges válasz; token lejár; régi munkamenetek megszüntethetők |
| US-0108 | P0 | M | Tech adminként fiókot akarok felfüggeszteni/inaktiválni. | aktív munkamenetek megszűnnek; történeti adatok megmaradnak |
| US-0109 | P0 | M | Külső közreműködőként lejáró fiókot kapok. | lejárat után hozzáférés megszűnik és profil archiválódik |
| US-0110 | P1 | S | Felhasználóként saját eszközeimet és munkameneteimet akarom kezelni. | egyenként visszavonható; saját aktuális munkamenet egyértelmű |

### E02 – Szerepkörök, RLS és audit

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-0201 | P0 | L | Rendszerként minden üzleti táblán RLS-t akarok. | `anon` nem olvas; szerepköri pozitív és negatív tesztek |
| US-0202 | P0 | M | Kommunikációs vezetőként szerepkört és többletjogot akarok kinevezni. | tech admin kezdeményezése; idő- és hatókör; audit |
| US-0203 | P0 | M | Jogosultként időben korlátozott helyettest akarok kijelölni. | nem láncolható; minden művelet a helyettes nevén |
| US-0204 | P0 | M | Kommunikációs vezetőként minden üzleti rekordot látni és beavatkozni akarok. | archivált rekord is látható; indokolt vezetői felülbírálás |
| US-0205 | P0 | L | Tech adminként csak naplózott, megerősített támogatási hozzáférést akarok. | minden megnyitás előtti popup; egyszeri ötperces engedély; azonnali vezetői értesítés |
| US-0206 | P0 | M | Rendszerként változtathatatlan auditnaplót akarok. | UPDATE/DELETE tiltott; öt év megőrzés |
| US-0207 | P0 | S | Rendszerként egyetlen aktív névadói szerepet engedek. | második aktív kinevezés szerveroldalon sikertelen |

### E03 – Alkalmazáskeret, navigáció, arculat

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-0301 | P0 | M | Felhasználóként szerepkörhöz igazított főmenüt akarok. | tiltott menüpont és route sem érhető el |
| US-0302 | P0 | M | Mobilfelhasználóként legfeljebb öt elemes alsó navigációt akarok. | szerepkörfüggő; „Továbbiak” menü |
| US-0303 | P0 | M | Felhasználóként akadémiai arculatú, akadálymentes felületet akarok. | WCAG 2.1 AA alapkövetelmények; kontraszt és fókusz |
| US-0304 | P1 | S | Új felhasználóként rövid szerepköri bemutatót akarok. | átugorható és újraindítható |
| US-0305 | P1 | S | Felhasználóként gyors létrehozási menüt akarok. | csak jogosult műveletek jelennek meg |

### E04 – Projektek és törzsadatok

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-0401 | P0 | M | Jogosultként projektet akarok létrehozni egy projektgazdával. | egy tulajdonos; projektkód; külön jog szükséges projektgazdánál |
| US-0402 | P0 | M | Projektgazdaként saját projektemet akarom szervezni. | csak saját projekt; tagok, tartalmak, feladatok, események |
| US-0403 | P0 | S | Projektgazdaként projektet akarok lezárni. | aktív kritikus blokk esetén tiltott; más nyitott tételekre figyelmeztet; archiválás nincs |
| US-0404 | P0 | S | Kommunikációs vezetőként projektet akarok archiválni/újranyitni. | újranyitás indokkal; audit |
| US-0405 | P1 | M | Kommunikációs vezetőként törzsadatokat akarok kezelni. | használt érték csak inaktiválható |
| US-0406 | P1 | S | Projektgazdaként új címkét akarok javasolni. | jóváhagyásig nem használható új központi címkeként |

### E05 – Feladatkezelés

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-0501 | P0 | M | Jogosultként egyfelelős feladatot akarok létrehozni. | pontosan egy felelős; önálló vagy kapcsolt feladat |
| US-0502 | P0 | M | Felelősként elfogadni, pontosítást kérni vagy akadályt jelezni akarok. | elfogadásig nem saját késés |
| US-0503 | P0 | M | Felelősként végig akarom vinni a feladatállapotokat. | csak engedélyezett átmenetek; review kezelése |
| US-0504 | P0 | M | Jogosultként blokkolni és feloldani akarok. | ok/felelős; határidő megerősítése feloldáskor |
| US-0505 | P0 | M | Jogosultként határidőt akarok módosítani. | indok mindig; teljes előzmény; értesítés |
| US-0506 | P0 | M | Jogosultként feladatot akarok átadni. | indok; új felelős visszaigazolása; történet megmarad |
| US-0507 | P0 | S | Kommunikációs vezetőként feladatot akarok visszanyitni. | indok; nem automatikus hibapont |
| US-0508 | P1 | S | Felhasználóként opcionális ráfordítást akarok rögzíteni. | becsült/tényleges perc vagy óra; stopper nincs |
| US-0509 | P1 | M | Felhasználóként lista- és Kanban-nézetet akarok. | drag-and-drop csak szabályos átmenettel |

### E06 – Események, naptár és elfoglaltság

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-0601 | P0 | M | Jogosultként önálló szakmai eseményt akarok létrehozni. | tartalom nélkül is; egy felelős |
| US-0602 | P0 | M | Szervezőként többféle résztvevőt akarok meghívni. | belső, külső, sportoló, egyéb; válasznapló |
| US-0603 | P0 | M | Résztvevőként válaszolni akarok a meghívásra. | elfogad/elutasít/talán; válaszadó látszik |
| US-0604 | P0 | M | Szervezőként módosítani vagy lemondani akarok. | lényeges változás új választ kér; meghívás után nincs törlés |
| US-0605 | P0 | M | Felhasználóként naptárban akarom látni a releváns eseményeket és foglaltságot. | másoknál csak foglalt/szabad |
| US-0606 | P0 | S | Felhasználóként magánjellegű „Nem elérhető” idősávot akarok. | részlet másnak nem látható |
| US-0607 | P0 | S | Rendszerként eseményt a vége után Megtörténtnek jelölök. | elmaradt/átütemezett kimenet utólag rögzíthető |
| US-0608 | P1 | M | Eseményből kommunikációs feladatokat akarok létrehozni. | kiválasztható teendőtípusok; nincs kötelező automatikus feladat |
| US-0609 | P1 | S | Kiküldetéshez utazási adatot akarok rögzíteni. | költségadat nélkül |

### E07 – Tartalom és verziókezelés

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-0701 | P0 | M | Jogosultként projektalapú tartalmat akarok létrehozni. | elsődleges projekt és tartalomgazda |
| US-0702 | P0 | L | Szerkesztőként tartalomverziókat akarok kezelni. | nincs felülírás; érdemi/technikai módosítás |
| US-0703 | P0 | M | Tartalomgazdaként kötelező és opcionális célfelületeket akarok kijelölni. | célonként egy konkrét publikációs követelmény |
| US-0704 | P0 | M | Felhasználóként tartalomállapotot akarok szabályosan váltani. | nincs részben publikált állapot; státusz-RPC |
| US-0705 | P0 | M | Szerkesztőként automatikus mentést és zárolást akarok. | 15 perc inaktivitás; nincs csendes felülírás |
| US-0706 | P1 | S | Jogosultként tartalmat akarok másolni. | új ID; nincs örökölt jóváhagyás, lenyomat vagy személyes jogállapot |

### E08 – Fájlok, Storage és NAS

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-0801 | P0 | L | Felhasználóként legfeljebb 250 MB-os fájlt akarok privát tárhelyre tölteni. | engedélyezett MIME; tulajdonos/kapcsolat; resumable mobilfeltöltés |
| US-0802 | P0 | M | Rendszerként vírusvizsgálatot és karantént akarok. | vizsgálatig nincs letöltés; fertőzés izolált |
| US-0803 | P0 | M | Rendszerként előnézetet és SHA-256-ot akarok készíteni. | képi/videó/PDF előnézet; hash megmarad |
| US-0804 | P0 | M | Felhasználóként új fájlverziót akarok feltölteni. | időbélyeges tárolt név; eredeti név; nincs felülírás |
| US-0805 | P0 | M | Jogosultként végleges verziót akarok kijelölni. | egyszerre egy aktív végleges; régi publikáció nem változik |
| US-0806 | P0 | M | Felhasználóként nagy fájlhoz NAS-hivatkozást akarok rögzíteni. | hitelesítő adat nem tárolódik üzleti táblában |
| US-0807 | P0 | M | Rendszerként naponta ellenőrizni akarom a NAS-fájlt. | 02:00; csak állapotváltozásnál riasztás |
| US-0808 | P0 | S | Jogosultként munkapéldányt lomtárba akarok tenni/visszaállítani. | védett kapcsolat blokkol; 30 nap |

### E09 – Felülvizsgálat, blokk és komment

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-0901 | P0 | M | Tartalomgazdaként felülvizsgálatot akarok kérni. | típus, verzió, felülvizsgáló; értesítés |
| US-0902 | P0 | M | Felülvizsgálóként jóváhagyni vagy visszaadni akarok. | döntés naplózódik; változtatási indok |
| US-0903 | P0 | M | Kommunikációs vezetőként tartalmat akarok blokkolni/feloldani. | azonnali publikációtiltás; indok; visszaálló állapot |
| US-0904 | P0 | M | Felhasználóként kommentelni és említeni akarok. | hozzáférési kör ellenőrzése; említés in-app + e-mail |
| US-0905 | P0 | M | Névadóként kizárólag a kommunikációs vezetőnek akarok kommentelni. | `lead_only`; más szerepkör nem olvassa |

### E10 – Publikáció és lenyomat

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-1001 | P0 | L | Belső publikálóként konkrét célfelületre publikációt akarok rögzíteni. | jog, blokk, személyjog, fájl és kötelező mező újraellenőrzött |
| US-1002 | P0 | M | Rendszerként változtathatatlan lenyomatot akarok létrehozni. | UPDATE/DELETE tiltott; pontos tartalom- és fájlverzió |
| US-1003 | P0 | M | Publikálóként URL-hiányt akarok szabályosan kezelni. | indok kötelező; „később” 24 órás feladat |
| US-1004 | P0 | M | Publikálóként csatornaspecifikus nyomot akarok rögzíteni. | Story, belső, sajtó, nyomtatott minimumok |
| US-1005 | P0 | M | Jogosultként publikációt dokumentáltan helyesbíteni akarok. | új lenyomatverzió; ok; régi megmarad |
| US-1006 | P0 | S | Jogosultként külső eltávolítást akarok jelölni. | idő/ok/intézkedő; belső lenyomat marad |
| US-1007 | P1 | S | Jogosultként eredményadatot akarok rögzíteni. | append-only mérési pont; manuális garantált |
| US-1008 | P0 | M | Rendszerként minden kötelező publikáció után automatikusan Publikált állapotot akarok. | opcionális cél nem akadály; egyszeri/idempotens |

### E11 – Személyek és megjelenési jogosultság

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-1101 | P0 | M | Jogosultként személyprofilt akarok létrehozni duplikációs figyelmeztetéssel. | név/születési év/csapat; nincs automatikus összevonás |
| US-1102 | P0 | M | Jogosultként szezonális és egyedi megjelenési jogot akarok kezelni. | média/csatorna/cél/hatály/korlátozás |
| US-1103 | P0 | M | Projektgazdaként csak egyszerű státuszt és korlátozást akarok látni. | dokumentum és képviselőadat nincs |
| US-1104 | P0 | M | Törvényes képviselőként fiók nélkül akarok nyilatkozni. | e-mailhez kötött 7 napos egyszeri link; beküldés után nem módosítható |
| US-1105 | P0 | M | Rendszerként változtathatatlan PDF-bizonylatot akarok készíteni. | sablonverzió, választások, időpont, hash, visszaigazolás |
| US-1106 | P0 | L | Rendszerként tartalomhoz szabályalapú jogosultság-ellenőrzést akarok. | csoport és egyéni szerepeltetés; AI nem dönt |
| US-1107 | P0 | L | Adatvédelmi felelősként visszavonást akarok kezelni. | jövőbeni blokk; korábbi publikációk intézkedési listája |
| US-1108 | P0 | M | Jogosultként érzékeny dokumentumot akarok megnyitni. | figyelmeztetés, re-auth, 5 perces link, audit |
| US-1109 | P1 | M | Adatvédelmi felelősként érintetti ügyet akarok kezelni. | határidő, intézkedések, lezárás; nincs automatikus törlés |

### E12 – Kommunikációs igények

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-1201 | P1 | M | Belső felhasználóként kommunikációs igényt akarok beadni. | kötelező mezők; csatorna csak javaslat |
| US-1202 | P1 | M | Meghívott külsőként egyszer használható űrlapon akarok igényt beadni. | nincs nyilvános űrlap; e-mailhez kötött token |
| US-1203 | P1 | M | Befogadóként pontosítást akarok kérni határidővel. | válaszfolyam és értesítés |
| US-1204 | P1 | M | Befogadóként elfogadni vagy indokkal elutasítani akarok. | audit; igénylő értesül |
| US-1205 | P1 | M | Befogadóként igényből megvalósítási rekordot akarok létrehozni. | projekt/tartalom/esemény/feladat; visszahivatkozás |

### E13 – Értesítések és háttérfolyamatok

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-1301 | P0 | L | Felhasználóként alkalmazáson belüli értesítést akarok. | olvasatlan/olvasott; célrekord-link |
| US-1302 | P0 | L | Felhasználóként e-mail- és PWA-push értesítést akarok. | eszközönként; érzékeny adat nélkül |
| US-1303 | P0 | M | Rendszerként 08:00–20:00 közötti kézbesítési szabályt akarok. | kritikus kivétel; DST teszt |
| US-1304 | P0 | M | Felhasználóként napi 08:00 összefoglalót akarok. | hétvégén is csak releváns tartalommal; üres nincs |
| US-1305 | P0 | M | Felelősként 24 és 2 órás, valamint lejárati értesítést akarok. | rövid feladatnál elmúlt küszöb nem duplikál |
| US-1306 | P0 | M | Rendszerként blokkolás alatt szüneteltetem a késedelmi riasztást. | feloldáskor újraindul |
| US-1307 | P0 | M | Rendszerként hét nap után archiválom a normál értesítést. | olvasatlan kritikus nem archiválódik; megőrzés 1 év |
| US-1308 | P1 | S | Felhasználóként normál értesítési preferenciát akarok. | kötelező típus nem kapcsolható ki |

### E14 – Keresés, riport és export

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-1401 | P1 | L | Felhasználóként jogosultságszűrt globális keresést akarok. | tiltott rekord és snippet sem látható; külsőnek nincs globális keresés |
| US-1402 | P1 | M | Felhasználóként saját mentett szűrőket akarok. | eszközök között megmarad; nem megosztott |
| US-1403 | P1 | L | Kommunikációs vezetőként publikációs riportot akarok. | időszak/csatorna/projekt stb.; tételes visszafúrás |
| US-1404 | P1 | L | Kommunikációs vezetőként terhelési és teljesítési riportot akarok. | külön panelek; nincs rangsor; javítás csak neki |
| US-1405 | P1 | M | Projektgazdaként saját projektcsapat-riportot akarok. | más projekt adata nem szivárog |
| US-1406 | P1 | M | Névadóként anonimizált összesített riportot akarok. | nincs név, javítás, komment vagy egyéni teljesítés |
| US-1407 | P1 | L | Jogosultként XLSX/CSV/PDF exportot akarok. | szűrők, időpont, exportáló; naplózott és privát letöltés |

### E15 – Adminisztráció, import és támogatás

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-1501 | P1 | L | Jogosultként CSV/XLSX-importot akarok előnézettel. | mezőleképezés, hiba, duplikáció, részleges siker |
| US-1502 | P1 | M | Jogosultként ZIP/NAS fájlimportot akarok. | előzetes ellenőrző nézet; nincs automatikus mappafeldolgozás |
| US-1503 | P1 | M | Felhasználóként hibajegyet akarok beadni. | screenshot; technikai metaadat; érzékenységi figyelmeztetés |
| US-1504 | P1 | M | Tech adminként hibajegyfolyamatot akarok kezelni. | prioritás, állapot, megoldás; bejelentő látja |
| US-1505 | P1 | M | Szerepkör szerint auditnaplót akarok megtekinteni. | kommunikációs/technikai/adatvédelmi elkülönítés |

### E16 – Integrációk

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-1601 | P1 | L | Felhasználóként egy Google-naptárt akarok kapcsolni. | szervezeti/magán fiók; OAuth token védett |
| US-1602 | P1 | L | Felhasználóként platformeseményt akarok Google Calendarba küldeni. | módosítás és lemondás szinkronizálható |
| US-1603 | P1 | L | Rendszerként Google-ból csak foglaltsági idősávot akarok beolvasni. | cím, leírás, résztvevő nem tárolódik |
| US-1604 | P1 | M | Rendszerként integrációs hibát akarok láthatóvá tenni. | belső adat megmarad; hiányos ütközésvizsgálat jelzése |
| US-1605 | P1 | M | Rendszerként e-mailt és PWA-pusht akarok megbízhatóan kézbesíteni. | retry, delivery log, kritikus hibajelzés |

### E17 – Hardening és üzemeltetés

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-1701 | P0 | L | Üzemeltetőként napi mentést és órás helyreállítási pontot akarok. | 30 nap; más logikai tárhely |
| US-1702 | P0 | M | Üzemeltetőként dokumentált visszaállítási próbát akarok. | adatbázis és fájl; negyedéves eljárás |
| US-1703 | P0 | L | Biztonsági felelősként támadási felületet akarok tesztelni. | auth, RLS, signed URL, injection, XSS, CSRF, rate limit |
| US-1704 | P0 | M | Üzemeltetőként monitorozást és riasztást akarok. | auth, DB, Storage, job, NAS, e-mail/push, hiba arány |
| US-1705 | P0 | M | Felhasználóként elfogadható teljesítményt akarok. | normál műveletek 95%-a ≤3 s; 30 egyidejű felhasználó |
| US-1706 | P0 | M | Adatvédelmi felelősként adatminimalizált naplózást akarok. | nincs jelszó/token/teljes érzékeny tartalom |
| US-1707 | P0 | M | Üzemeltetőként hibás kiadást adatvesztés nélkül akarok visszaállítani. | előző stabil verzió; migráció-kompatibilitás |

### E18 – Pilot és élesítés

| ID | P | Méret | User story | Elfogadási mag |
|---|---:|---:|---|---|
| US-1801 | P0 | M | Termékgazdaként 2–4 hetes pilotot akarok. | kijelölt szerepkörök; valós esetek; visszajelzési napló |
| US-1802 | P0 | M | Pilotcsapatként három teljes folyamatot akarunk végrehajtani. | egyszerű poszt; eseménykommunikáció; kiskorút érintő tartalom |
| US-1803 | P0 | M | Kommunikációs vezetőként írásos üzleti elfogadást akarok adni. | kiadási kapuk teljesülnek |
| US-1804 | P0 | M | Tech adminként technikai átadást akarok. | runbook, backup, riasztás, rollback, hozzáférések |
| US-1805 | P0 | S | Rendszerként tesztadatot akarok naplózottan eltávolítani. | csak ellenőrzött valós pilotadat marad |

---

## 8. MVP-ből kizárt P2-backlog

| ID | Későbbi elem | Indok |
|---|---|---|
| P2-01 | automatikus közösségimédia-publikálás | platform API és jóváhagyási függőség |
| P2-02 | garantált automatikus platformstatisztika | API-kapcsolat nélkül nem megbízható |
| P2-03 | teljes NAS-szinkron | NAS-típus és infrastruktúra függvénye |
| P2-04 | ismétlődő események | komplex kivétel- és szinkronlogika |
| P2-05 | valós idejű közös szerkesztés | jelentős kollaborációs infrastruktúra |
| P2-06 | teljes offline szerkesztés | konfliktus- és adatvédelmi kockázat |
| P2-07 | kép- és videó-OCR | nem szükséges a fő folyamathoz |
| P2-08 | többnyelvű workflow | az MVP kizárólag magyar |
| P2-09 | egyedi szerepkör-szerkesztő | előre definiált szerepek elegendők |
| P2-10 | automatikus vezetői riportküldés | kézi lekérés/export elegendő |
| P2-11 | minősített elektronikus aláírás | MVP-jogi folyamat nem igényli |
| P2-12 | HR-munkaidő és szabadságkeret | nem kommunikációs platformfunkció |
| P2-13 | kiküldetési költségelszámolás | nem MVP-hatókör |

---

## 9. Tesztstratégia

### 9.1. Tesztszintek

- **Unit:** jogosultsági segédfüggvények, állapotvalidálás, időzítés, adattranszformáció.
- **Adatbázis-integráció:** RLS, kényszerek, triggerek, RPC-k, tranzakciók.
- **API/Edge Function:** tokenfolyamat, signed URL, integráció, értesítés.
- **Komponens:** űrlap, állapotjelvény, modal, táblázat, fájlfeltöltés.
- **E2E:** teljes üzleti folyamatok valós szerepkörváltással.
- **Biztonsági:** hozzáférés, adat-kiszivárgás, token, injection, XSS, rate limit.
- **Nem funkcionális:** teljesítmény, akadálymentesség, böngésző, mobil, helyreállítás.
- **UAT/pilot:** valós szervezeti forgatókönyvek.

### 9.2. Automatizálási elv

P0-teszt automatizálandó, ha technikailag stabilan automatizálható. Kézi ellenőrzés csak vizuális, szervezeti vagy külső infrastruktúrához kötött esetnél elfogadható. A kézi tesztnek is dokumentált eredménye és bizonyítéka kell legyen.

### 9.3. Tesztadat-personák

| Kód | Persona |
|---|---|
| U-LEAD | kommunikációs vezető, aktív MFA |
| U-TECH | technikai admin, aktív MFA |
| U-OWNER-A | A projekt projektgazdája, aktív MFA |
| U-OWNER-B | B projekt projektgazdája |
| U-STAFF-A | A projekt munkatársa |
| U-STAFF-B | B projekt munkatársa |
| U-PUBLISH | belső munkatárs publikálói többletjoggal |
| U-PRIV | adatvédelmi/jogi felelős |
| U-NAME | Rátgéber László névadói fiókja |
| U-EXT-A | A projekthez rendelt külső, érvényes fiók |
| U-EXT-X | lejárt külső fiók |
| U-NONE | aktív, de az adott projekthez nem tartozó felhasználó |
| P-MINOR-OK | kiskorú, érvényes szezonális joggal |
| P-MINOR-NO | kiskorú, hiányzó joggal |
| P-REVOKED | visszavont jogosultságú személy |

Tesztprojektek: PROJECT-A és PROJECT-B. A projektek adatai szándékosan különüljenek el a kiszivárgástesztekhez.

---

## 10. Funkcionális teszteset-katalógus

### 10.1. Hitelesítés és fiók

| ID | P | Szenárió | Elvárt eredmény |
|---|---:|---|---|
| TC-AUTH-001 | P0 | Meghívás nélküli Google-belépés | nincs aktív profil vagy üzleti hozzáférés |
| TC-AUTH-002 | P0 | Meghívott e-mail Google-belépéssel | megfelelő meghívó elfogadva, profil aktiválható |
| TC-AUTH-003 | P0 | Google-fiók e-mailje eltér a meghívástól | hozzáférés elutasítva |
| TC-AUTH-004 | P0 | E-mail/jelszó regisztráció visszaigazolás nélkül | üzleti belépés tiltott |
| TC-AUTH-005 | P0 | 11 karakteres jelszó | elutasítva, magyar hibaüzenet |
| TC-AUTH-006 | P0 | ismert kompromittált jelszó | elutasítva |
| TC-AUTH-007 | P0 | lejárt meghívó | nem használható; új meghívó kérhető |
| TC-AUTH-008 | P0 | ugyanazon meghívó második felhasználása | elutasítva, auditálva |
| TC-AUTH-009 | P0 | kiemelt szerepkör MFA nélkül | aktiválás/belépés nem fejezhető be |
| TC-AUTH-010 | P0 | helyes TOTP | belépés sikeres |
| TC-AUTH-011 | P0 | helyreállító kód kétszeri használata | első sikeres, második sikertelen |
| TC-AUTH-012 | P0 | öt sikertelen belépés | fokozatos késleltetés, értesítés és audit |
| TC-AUTH-013 | P0 | felfüggesztett fiók aktív munkamenete | munkamenet megszűnik, hozzáférés tiltott |
| TC-AUTH-014 | P0 | lejárt külső fiók | sem UI, sem API, sem Storage-hozzáférés |
| TC-AUTH-015 | P0 | bootstrap kód második használata | elutasítva |
| TC-AUTH-016 | P1 | saját munkamenet távoli megszüntetése | célmunkamenet következő kérésnél érvénytelen |

### 10.2. Szerepkör és RLS

| ID | P | Szenárió | Elvárt eredmény |
|---|---:|---|---|
| TC-RLS-001 | P0 | anonim SELECT üzleti táblán | nulla adat vagy jogosultsági hiba |
| TC-RLS-002 | P0 | U-STAFF-A olvassa PROJECT-B-t | tiltott |
| TC-RLS-003 | P0 | U-OWNER-A módosítja PROJECT-B-t | tiltott |
| TC-RLS-004 | P0 | U-OWNER-A olvassa saját projektcsapatát | engedett |
| TC-RLS-005 | P0 | U-EXT-A globális keresést vagy projektlistát kér | nincs hozzáférés |
| TC-RLS-006 | P0 | U-EXT-A saját kiosztott feladatot olvas | engedett |
| TC-RLS-007 | P0 | U-NAME ötlet állapotú tartalmat kér | tiltott |
| TC-RLS-008 | P0 | U-NAME előkészített tartalmat kér | engedett, szűrt mezőkkel |
| TC-RLS-009 | P0 | U-TECH közvetlenül tartalmat kér | tiltott |
| TC-RLS-010 | P0 | U-TECH támogatási folyamat nélkül fájlt kér | tiltott |
| TC-RLS-011 | P0 | második aktív névadói szerep | szerveroldali hiba |
| TC-RLS-012 | P0 | lejárt delegáció használata | tiltott |
| TC-RLS-013 | P0 | helyettes továbbdelegálja a kapott jogot | tiltott |
| TC-RLS-014 | P0 | szerepkör kinevezése tech kezdeményezés és vezetői jóváhagyás nélkül | tiltott |
| TC-RLS-015 | P0 | auditnapló UPDATE/DELETE | tiltott minden alkalmazásszerepnek |

### 10.3. Projekt és feladat

| ID | P | Szenárió | Elvárt eredmény |
|---|---:|---|---|
| TC-TASK-001 | P0 | feladat létrehozása felelős nélkül | elutasítva |
| TC-TASK-002 | P0 | feladat két felelőssel | modell/API elutasítja |
| TC-TASK-003 | P0 | felelős „Elfogadom” választ ad | állapot Elfogadva; audit és értesítés |
| TC-TASK-004 | P0 | felelős pontosítást kér | Pontosításra vár; címzett értesül |
| TC-TASK-005 | P0 | kiosztott, el nem fogadott feladat határideje lejár | nem számít saját késésnek |
| TC-TASK-006 | P0 | határidő módosítása indok nélkül | elutasítva |
| TC-TASK-007 | P0 | határidő módosítása indokkal | új határidő, append-only előzmény, értesítés |
| TC-TASK-008 | P0 | blokk ok/felelős nélkül | elutasítva |
| TC-TASK-009 | P0 | blokkolt feladat határideje lejár | nincs késedelmi riasztás és saját késés |
| TC-TASK-010 | P0 | blokk feloldása határidődöntés nélkül | elutasítva |
| TC-TASK-011 | P0 | feladatátadás | új felelős, Kiosztva, új visszaigazolás, előzmény |
| TC-TASK-012 | P0 | review-köteles feladat felelős általi közvetlen befejezése | végleges lezárás tiltott |
| TC-TASK-013 | P0 | kommunikációs vezető visszanyit befejezett feladatot | indok kötelező; teljesítménypont nincs |
| TC-PROJ-001 | P0 | projektgazda saját projektet lezár aktív kritikus blokk nélkül | engedett; más nyitott feladatokra figyelmeztet |
| TC-PROJ-001B | P0 | projektgazda aktív kritikus blokkal zárna projektet | tiltott a blokk feloldásáig |
| TC-PROJ-002 | P0 | projektgazda saját projektet archivál | tiltott |
| TC-PROJ-003 | P0 | kommunikációs vezető archivál/újranyit | engedett; újranyitás indokkal |

### 10.4. Esemény és naptár

| ID | P | Szenárió | Elvárt eredmény |
|---|---:|---|---|
| TC-EVT-001 | P0 | esemény tartalom és projekt nélkül | engedett, ha szakmai önálló esemény és van felelős |
| TC-EVT-002 | P0 | befejezés korábbi a kezdésnél | elutasítva |
| TC-EVT-003 | P0 | meghívott elfogad/elutasít/talán | válasz és válaszadó naplózva |
| TC-EVT-004 | P0 | kommunikációs vezető a névadó helyett válaszol | engedett; válaszadó látható |
| TC-EVT-005 | P0 | időpont módosítása | válaszok újra bekérve; azonnali értesítés |
| TC-EVT-006 | P0 | leírás módosítása | válaszok megmaradnak; normál értesítés |
| TC-EVT-007 | P0 | meghívás utáni törlés | tiltott; csak lemondás |
| TC-EVT-008 | P0 | naptári ütközés | figyelmeztetés, mentés engedett |
| TC-EVT-009 | P0 | kötelező esemény ütközéssel indok nélkül | indoklás bekérése |
| TC-EVT-010 | P0 | más felhasználó privát elfoglaltsága | csak Foglalt és időtartam látható |
| TC-EVT-011 | P0 | esemény vége elmúlik | egyszer, automatikusan Megtörtént |
| TC-EVT-012 | P0 | nem fontos esemény névadói lekérdezése | nem látható |

### 10.5. Tartalom, review és komment

| ID | P | Szenárió | Elvárt eredmény |
|---|---:|---|---|
| TC-CONT-001 | P0 | tartalom elsődleges projekt nélkül | elutasítva |
| TC-CONT-002 | P0 | Ötlet → Publikált közvetlenül | tiltott |
| TC-CONT-003 | P0 | kötelező review hiányában előkészítetté tétel | tiltott |
| TC-CONT-004 | P0 | érdemi változás jóváhagyás után | új verzió; review superseded; visszalépés |
| TC-CONT-005 | P0 | technikai javítás | új verzió/audit; review érvényes marad |
| TC-CONT-006 | P0 | aktív blokk mellett előkészítés/publikáció | tiltott |
| TC-CONT-007 | P0 | minden kötelező célból egy hiányzik | állapot előkészített; számláló N-1/N |
| TC-CONT-008 | P0 | opcionális cél hiányzik, kötelezők teljesek | automatikusan Publikált |
| TC-CONT-009 | P0 | visszavont tartalom újraaktiválása | tiltott; új rekord/másolat szükséges |
| TC-CONT-010 | P0 | tartalommásolás | nincs örökölt lenyomat, review vagy személyjogállapot |
| TC-COMM-001 | P0 | U-NAME kommentet ír | csak U-LEAD olvassa; U-LEAD in-app/e-mail/push |
| TC-COMM-002 | P0 | U-EXT-A PROJECT-B tagot említ | tiltott |
| TC-COMM-003 | P0 | jogosult `@név` említés | címzett in-app és e-mail értesítést kap |

### 10.6. Fájl és NAS

| ID | P | Szenárió | Elvárt eredmény |
|---|---:|---|---|
| TC-FILE-001 | P0 | engedélyezett 249 MB fájl feltöltése | karantén → scan → elérhető |
| TC-FILE-002 | P0 | 251 MB közvetlen Storage-feltöltés | elutasítva; NAS használata ajánlott |
| TC-FILE-003 | P0 | végrehajtható fájl feltöltése | elutasítva |
| TC-FILE-004 | P0 | MIME nem egyezik a kiterjesztéssel | karantén/elutasítás, audit |
| TC-FILE-005 | P0 | karanténfájl letöltése | tiltott |
| TC-FILE-006 | P0 | tiszta scan | SHA-256 és előnézet készül |
| TC-FILE-007 | P0 | fertőzött scan | izolálás; értesítés; nincs letöltés |
| TC-FILE-008 | P0 | azonos nevű új verzió | időbélyeges új név, külön verzió |
| TC-FILE-009 | P0 | két végleges verzió egyidejű kijelölése | adatbázis-kényszer megakadályozza |
| TC-FILE-010 | P0 | publikációhoz kötött fájl lomtárba tétele | tiltott |
| TC-FILE-011 | P0 | szabad munkapéldány lomtár és 30 napon belüli restore | sikeres, auditált |
| TC-FILE-012 | P0 | NAS-fájl eltűnik | Hiányzik; megfelelő címzettek értesülnek |
| TC-FILE-013 | P0 | NAS-fájl újra elérhető | Elérhető; helyreállási értesítés |
| TC-FILE-014 | P0 | külső más projekt fájlját kéri | tiltott Storage és metaadat szinten is |

### 10.7. Publikáció

| ID | P | Szenárió | Elvárt eredmény |
|---|---:|---|---|
| TC-PUB-001 | P0 | külső közreműködő publikációt rögzít | tiltott |
| TC-PUB-002 | P0 | belső, publikálói jog nélküli felhasználó | tiltott |
| TC-PUB-003 | P0 | jogosult publikáló teljes adatokkal | publikáció és lenyomat atomi létrehozása |
| TC-PUB-004 | P0 | tartós online publikáció URL és ok nélkül | elutasítva |
| TC-PUB-005 | P0 | `add_later` URL-ok | pontosan egy 24 órás feladat |
| TC-PUB-006 | P0 | Story platformmatricával, screenshot nélkül | elutasítva |
| TC-PUB-007 | P0 | belső kommunikáció teljes szöveg nélkül | elutasítva |
| TC-PUB-008 | P0 | lenyomat UPDATE/DELETE | tiltott |
| TC-PUB-009 | P0 | helyesbítés | új snapshot-verzió; régi változatlan |
| TC-PUB-010 | P0 | külső törlés jelzése | belső lenyomat megmarad |
| TC-PUB-011 | P0 | utolsó kötelező publikáció elkészül | tartalom egyszer automatikusan Publikált |
| TC-PUB-012 | P1 | manuális eredménymérés | új mérési pont, korábbi nem íródik felül |

### 10.8. Megjelenési jogosultság és adatvédelem

| ID | P | Szenárió | Elvárt eredmény |
|---|---:|---|---|
| TC-PERM-001 | P0 | projektgazda személy státuszát kéri | státusz, hatály, rövid korlátozás látható |
| TC-PERM-002 | P0 | projektgazda dokumentumot kér | tiltott |
| TC-PERM-003 | P0 | stábtag jogosultsági részletet kér | csak egyszerű publikálható/nem publikálható jelzés |
| TC-PERM-004 | P0 | jogosult dokumentumot nyit | figyelmeztetés, re-auth, audit, ≤5 perces URL |
| TC-PERM-005 | P0 | dokumentum-URL lejárat után | hozzáférés tiltott |
| TC-PERM-006 | P0 | tömeges dokumentumletöltés | nincs elérhető művelet/API |
| TC-PERM-007 | P0 | új személy duplikációgyanúval | figyelmeztetés; kézi döntés; nincs auto-merge |
| TC-PERM-008 | P0 | kiskorú nyilatkozatkérés képviselő nélkül | elutasítva |
| TC-PERM-009 | P0 | nyilatkozati link hét nap után | lejárt |
| TC-PERM-010 | P0 | nyilatkozati link második beküldése | elutasítva |
| TC-PERM-011 | P0 | beküldött nyilatkozat | változtathatatlan PDF és hash; visszaigazolás |
| TC-PERM-012 | P0 | csoportfotó vegyes jogosultsággal | figyelmeztetés/korlátozás a szabály szerint |
| TC-PERM-013 | P0 | portré általános csoportjoggal | egyéni ellenőrzés szükséges |
| TC-PERM-014 | P0 | jog visszavonása | jövőbeni blokk; korábbi publikációk intézkedési listája |
| TC-PERM-015 | P0 | visszavont jog visszaállítása | tiltott; új jogrekord szükséges |
| TC-PRIV-001 | P1 | törlési kérelem rögzítése | ügyrekord, felelős, határidő; nincs automatikus törlés |

### 10.9. Igények

| ID | P | Szenárió | Elvárt eredmény |
|---|---:|---|---|
| TC-REQ-001 | P1 | belső teljes igény | Beérkezett; vezető értesül |
| TC-REQ-002 | P1 | teljesen nyilvános URL-ről igény | nincs hozzáférés |
| TC-REQ-003 | P1 | külső meghívott tokennel | űrlap elérhető, egyszer használható |
| TC-REQ-004 | P1 | hiányos kötelező mező | nem küldhető be |
| TC-REQ-005 | P1 | pontosításkérés | Pontosításra vár; határidő és értesítés |
| TC-REQ-006 | P1 | elutasítás indok nélkül | tiltott |
| TC-REQ-007 | P1 | elfogadás és tartalommá alakítás | kapcsolt tartalom; eredeti igény megmarad |

### 10.10. Értesítés

| ID | P | Szenárió | Elvárt eredmény |
|---|---:|---|---|
| TC-NOT-001 | P0 | normál esemény 19:30-kor | azonnali külső kézbesítés megengedett |
| TC-NOT-002 | P0 | normál esemény 20:01-kor | in-app létrejön; e-mail/push következő 08:00 után |
| TC-NOT-003 | P0 | kritikus esemény 02:00-kor | azonnali minden kötelező csatornán |
| TC-NOT-004 | P0 | nincs napi összefoglaló-tartalom | nem küld üres levelet/pusht |
| TC-NOT-005 | P0 | hétvégi releváns esemény | 08:00 összefoglaló elkészül |
| TC-NOT-006 | P0 | feladat 10 órával határidő előtt jön létre | 24 órás nem, 2 órás igen |
| TC-NOT-007 | P0 | határidő módosítása 90 percre | esedékes küszöb egyszer, duplikáció nélkül kezelve |
| TC-NOT-008 | P0 | normál értesítés 7 napos | archiválódik |
| TC-NOT-009 | P0 | kritikus olvasatlan értesítés 7 napos | nem archiválódik |
| TC-NOT-010 | P0 | kötelező értesítés kikapcsolása | szerveroldalon tiltott |
| TC-NOT-011 | P0 | e-mail provider átmeneti hiba | üzleti művelet megmarad; retry és delivery log |
| TC-NOT-012 | P0 | push payload érzékeny rekordhoz | csak biztonságos általános szöveg |
| TC-NOT-013 | P0 | nyári/téli időszámítás váltás | 08:00 helyi idő szerint pontos |

### 10.11. Riport, keresés és export

| ID | P | Szenárió | Elvárt eredmény |
|---|---:|---|---|
| TC-REP-001 | P1 | kommunikációs vezető részletes munkatársi riport | teljes jogosult adat, javítás külön |
| TC-REP-002 | P1 | munkatárs saját részletes riportot kér | tiltott |
| TC-REP-003 | P1 | projektgazda más projekt teljesítési adatát kéri | tiltott |
| TC-REP-004 | P1 | névadói riport | nincs név, egyéni adat, javítás vagy komment |
| TC-REP-005 | P1 | export | időszak, szűrők, időpont, exportáló szerepel; audit |
| TC-REP-006 | P1 | más felhasználó export-URL-je | tiltott |
| TC-REP-007 | P1 | javításszám riportban | csak vezető látja; nincs pontszám |
| TC-SRCH-001 | P1 | U-STAFF-A PROJECT-B kifejezésre keres | B projekt nem jelenik meg sem snippetként |
| TC-SRCH-002 | P1 | megjelenési dokumentum szövegére globális keresés | nincs találat |
| TC-SRCH-003 | P1 | PDF/DOCX/TXT jogosult szövegkeresés | releváns találat |
| TC-SRCH-004 | P1 | külső közreműködő globális keresőroute-ja | tiltott |

---

## 11. Biztonsági tesztkatalógus

| ID | P | Vizsgálat | Elvárt eredmény |
|---|---:|---|---|
| TC-SEC-001 | P0 | service-role kulcs keresése frontend bundle-ben | nincs jelen |
| TC-SEC-002 | P0 | objektumazonosító cseréje más projekt rekordjára | RLS blokkol |
| TC-SEC-003 | P0 | tiltott mező közvetlen UPDATE-je | oszlopjog/trigger/RPC blokkol |
| TC-SEC-004 | P0 | publikációs snapshot közvetlen DB-módosítása | tiltott |
| TC-SEC-005 | P0 | auditbejegyzés módosítása/törlése | tiltott |
| TC-SEC-006 | P0 | signed URL megosztása lejárat után | használhatatlan |
| TC-SEC-007 | P0 | jogosultsági dokumentum signed URL-je más felhasználói kontextusban | rövid lejárat és szerveroldali előellenőrzés; tartós hozzáférés nincs |
| TC-SEC-008 | P0 | invitation/permission token brute force | rate limit, erős token, naplózás |
| TC-SEC-009 | P0 | SQL injection minden kereső/űrlapmezőn | nincs végrehajtható injekció |
| TC-SEC-010 | P0 | tárolt XSS tartalomban/kommentben/fájlnévben | kimenet tisztított/kódolt |
| TC-SEC-011 | P0 | CSRF állapotmódosító kérés | token/session védelem; támadás sikertelen |
| TC-SEC-012 | P0 | MIME spoof és polyglot fájl | tartalomvizsgálat; karantén/elutasítás |
| TC-SEC-013 | P0 | fertőzött ZIP | nem csomagolódik ki kontroll nélkül; izolálás |
| TC-SEC-014 | P0 | OAuth token olvasása kliensből/adatbázis API-ból | nem hozzáférhető |
| TC-SEC-015 | P0 | technikai admin támogatási engedély újrahasználata | egyszeri használat után tiltott |
| TC-SEC-016 | P0 | támogatási engedély öt perc után | lejárt |
| TC-SEC-017 | P0 | naplók vizsgálata | nincs jelszó, nyers token, teljes dokumentumszöveg |
| TC-SEC-018 | P0 | felfüggesztés meglévő WebSocket/session mellett | hozzáférés rövid időn belül megszűnik |
| TC-SEC-019 | P0 | tömeges lekérdezés rate limit nélkül | megfelelő korlát/monitoring |
| TC-SEC-020 | P0 | backup-hozzáférési jogosultság | csak kijelölt üzemeltető; auditált |

---

## 12. Integrációs és háttérfolyamat-tesztek

| ID | P | Szenárió | Elvárt eredmény |
|---|---:|---|---|
| TC-INT-001 | P1 | platformesemény Google Calendarba | egyszer jön létre, külső ID tárolva |
| TC-INT-002 | P1 | esemény időpontja módosul | ugyanaz a Google-esemény frissül |
| TC-INT-003 | P1 | esemény lemondódik | külső esemény megfelelően frissül/törlődik, audit |
| TC-INT-004 | P1 | Google beolvasás | csak start/end/busy és biztonságos hash tárolódik |
| TC-INT-005 | P1 | OAuth visszavonás | belső esemény megmarad; hiányos sync figyelmeztetés |
| TC-INT-006 | P0 | háttérjob kétszer fut ugyanazzal a kulccsal | nincs dupla értesítés/feladat/állapotváltás |
| TC-INT-007 | P0 | háttérjob harmadszor hibázik | technikai hibajegy/riasztás |
| TC-INT-008 | P0 | NAS-ellenőrzés hálózati timeout | állapot és hiba rögzül; nincs adatvesztés |
| TC-INT-009 | P0 | e-mail siker, push hiba | delivery állapotok külön rögzülnek |
| TC-INT-010 | P1 | import 90 helyes, 10 hibás sorral | 90 importálható; 10 javítható hibalista |
| TC-INT-011 | P1 | import ugyanazzal a forrással ismételve | duplikáció felismerve, nincs csendes kettőzés |

---

## 13. Akadálymentességi és kompatibilitási tesztek

| ID | P | Vizsgálat | Elvárt eredmény |
|---|---:|---|---|
| TC-A11Y-001 | P0 | teljes elsődleges flow billentyűzettel | egér nélkül végigvihető |
| TC-A11Y-002 | P0 | fókusz modalban | fókusz bent marad; bezáráskor visszatér |
| TC-A11Y-003 | P0 | kontraszt | WCAG AA megfelelés |
| TC-A11Y-004 | P0 | státusz szín nélkül | ikonból és szövegből érthető |
| TC-A11Y-005 | P0 | 200% nagyítás | nincs tartalom-/funkcióvesztés |
| TC-A11Y-006 | P0 | képernyőolvasó űrlaphibával | mező, hiba és összegzés bejelentve |
| TC-A11Y-007 | P1 | csökkentett animáció | rendszerpreferencia tiszteletben tartva |
| TC-COMP-001 | P0 | aktuális és előző Chrome/Edge/Firefox/Safari | fő folyamatok működnek |
| TC-COMP-002 | P0 | aktuális Android | napi folyamatok és PWA működik |
| TC-COMP-003 | P0 | aktuális iOS/Safari | napi folyamatok; támogatott push-viselkedés dokumentált |
| TC-COMP-004 | P0 | mobil fájlfeltöltés megszakad | folytatható vagy biztonságosan újraindítható |
| TC-COMP-005 | P0 | offline módosítási kísérlet | nem küldhető be; világos jelzés; adat nem vész el csendben |

---

## 14. Teljesítmény- és megbízhatósági tesztek

| ID | P | Terhelés | Elfogadási feltétel |
|---|---:|---|---|
| TC-PERF-001 | P0 | 30 egyidejű aktív felhasználó normál listákkal | hibaarány elfogadható; 95. percentilis ≤3 s |
| TC-PERF-002 | P0 | 10 000 éves üzleti rekord szimulációja | fő listák és keresés használható |
| TC-PERF-003 | P0 | 250 MB fájlfeltöltés normál hálózaton | progress, folytatás, UI nem fagy |
| TC-PERF-004 | P1 | nagy riport exportja | háttérben készül; UI használható; kész értesítés |
| TC-PERF-005 | P0 | napi értesítési batch | nincs duplikáció és torlódás |
| TC-PERF-006 | P0 | NAS timeout | felhasználói kérést nem blokkol tartósan |
| TC-REL-001 | P0 | adatbázis mentés visszaállítása | legfeljebb 1 óra adatvesztési cél igazolható |
| TC-REL-002 | P0 | alkalmazásverzió rollback | adatvesztés nélkül előző stabil verzió |
| TC-REL-003 | P0 | Storage-mentésből mintafájl restore | hash egyezik |
| TC-REL-004 | P0 | e-mail/push szolgáltatás kiesése | üzleti művelet megmarad; retry/riasztás |

---

## 15. E2E pilotforgatókönyvek

### E2E-01 – Egyszerű közösségimédia-poszt

1. projektgazda tartalmat hoz létre;
2. feladatot oszt ki;
3. munkatárs elfogadja és elkészíti;
4. fájlt tölt fel, vírusvizsgálat és előnézet elkészül;
5. tartalom felülvizsgálatra, majd előkészített állapotba kerül;
6. publikáló Facebook-célfelületre rögzíti a megjelenést és URL-t;
7. lenyomat létrejön;
8. tartalom automatikusan Publikált;
9. riportban megjelenik.

### E2E-02 – Többfeladatos eseménykommunikáció

1. önálló szakmai esemény készül;
2. résztvevők meghívást kapnak és válaszolnak;
3. előzetes, fotós és beszámolófeladat készül külön felelősökkel;
4. ütközés csak figyelmeztet;
5. időpontmódosítás új visszaigazolást kér;
6. esemény lezajlik és automatikusan Megtörtént;
7. tartalom több kötelező célfelülettel készül;
8. részleges teljesülésnél előkészített marad N/M számlálóval;
9. utolsó lenyomat után Publikált;
10. projekt- és terhelési riport helyesen frissül.

### E2E-03 – Kiskorút érintő tartalom

1. kiskorú profil létrejön hiányos jogállapottal;
2. képviselőhöz nyilatkozatkérés megy;
3. egyszer használható linken kitölti;
4. változtathatatlan PDF és jogosultsági rekord készül;
5. adatvédelmi/jogi felelős ellenőrzi;
6. portrétartalomnál egyéni ellenőrzés fut;
7. publikáció csak megfelelő állapotban engedett;
8. jogosultság visszavonását rögzítik;
9. jövőbeni tartalom blokkolódik;
10. korábbi publikációkról intézkedési lista készül, törlés nélkül.

### E2E-04 – Technikai támogatási hozzáférés

1. tech admin hibajegyet kap;
2. közvetlen tartalomlekérés sikertelen;
3. hozzáférést kér indoklással;
4. minden megnyitás előtt popup jelenik meg;
5. megerősítés után egyszer megnyitja;
6. auditbejegyzés készül;
7. kommunikációs vezető azonnal in-app, e-mail és push értesítést kap;
8. ugyanaz az engedély másodszor vagy öt perc után nem használható.

### E2E-05 – Külső közreműködő életciklusa

1. tech admin meghívást kezdeményez, vezető jóváhagyja a külső szerepet és lejáratot;
2. külső aktiválja a fiókot;
3. csak saját feladatot, eseményt és fájlt lát;
4. feltölt és kommentel;
5. publikációs műveletet nem ér el;
6. lejáratkor minden hozzáférése megszűnik;
7. korábbi munkája névvel megmarad.

---

## 16. Kiadási kapuk

### Gate 0 – Architektúra

- környezetek elkülönítve;
- migráció és CI működik;
- titkok biztonságosan kezelve;
- alap-RLS és audit működik.

### Gate 1 – Belső alpha

- hitelesítés, szerepkör, projekt, feladat és esemény fő folyamata működik;
- nincs P0 jogosultsági hiba;
- alap mobilnézet működik.

### Gate 2 – Funkcionális beta

- tartalom, fájl, review, publikációs lenyomat és megjelenési jogosultság végigvihető;
- E2E-01 és E2E-03 sikeres;
- append-only és Storage-tesztek sikeresek.

### Gate 3 – Pilotra kész

- összes P0 és szükséges P1 story elkészült;
- teljes értesítési és riportfolyamat működik;
- E2E-01–05 sikeres;
- biztonsági és akadálymentességi kritikus teszt sikeres;
- backup restore igazolt;
- nincs nyitott kritikus vagy magas hiba.

### Gate 4 – Élesítés

- 2–4 hetes pilot lezárult;
- tesztadatok eltávolítva;
- adatvédelmi/jogi ellenőrzés megtörtént;
- kommunikációs vezető írásban elfogadta;
- technikai admin átadási dokumentációja kész;
- rollback és incidensfolyamat kipróbált;
- havi 99,5%-os működési cél monitorozható.

---

## 17. Hibakategóriák és kiadási döntés

| Súlyosság | Példa | Pilot/élesítés |
|---|---|---|
| Kritikus | jogosulatlan adat, adatvesztés, belépés teljes kiesése | blokkolja |
| Magas | fő üzleti folyamat nem végezhető el, nincs elfogadható kerülőút | blokkolja |
| Normál | részfunkció hibás, dokumentált kerülőút van | termékgazdai döntéssel halasztható |
| Alacsony | vizuális vagy kényelmi hiba | nem blokkol, backlogba kerül |

Biztonsági vagy adatvédelmi hiba súlyossága nem csökkenthető pusztán azért, mert ritkán reprodukálható.

---

## 18. Lefedettségi mátrix

| Terület | Backlog | Fő tesztcsoport |
|---|---|---|
| belépés és fiók | E01 | TC-AUTH |
| szerepkör és hozzáférés | E02 | TC-RLS, TC-SEC |
| projekt és feladat | E04–E05 | TC-PROJ, TC-TASK |
| esemény és naptár | E06 | TC-EVT, TC-INT |
| tartalom és review | E07, E09 | TC-CONT, TC-COMM |
| fájl és NAS | E08 | TC-FILE, TC-INT |
| publikáció | E10 | TC-PUB |
| személy és jogosultság | E11 | TC-PERM, TC-PRIV |
| kommunikációs igény | E12 | TC-REQ |
| értesítés | E13 | TC-NOT |
| riport és keresés | E14 | TC-REP, TC-SRCH |
| admin/import/support | E15 | TC-INT és funkcionális UAT |
| integrációk | E16 | TC-INT |
| hardening | E17 | TC-SEC, TC-A11Y, TC-COMP, TC-PERF, TC-REL |
| pilot | E18 | E2E-01–05 |

---

## 19. Végrehajtási sorrend

### Hullám 1 – Biztonságos keret

E00 → E01 → E02 → E03 alapjai.

Kilépési feltétel: szerepköri belépés, RLS-negatív teszt, audit, elkülönített környezet.

### Hullám 2 – Napi koordináció

E04 → E05 → E06 → E13 alapjai.

Kilépési feltétel: projekt, egyfelelős feladat, esemény, naptár és alapértesítés végigvihető.

### Hullám 3 – Kommunikációs magfolyamat

E07 → E08 → E09 → E10.

Kilépési feltétel: tartalomötlettől változtathatatlan publikációs lenyomatig működő flow.

### Hullám 4 – Jogi kontroll és vezetői működés

E11 → E12 → E14 → E15.

Kilépési feltétel: kiskorú jogosultság, igény, riport, export és adminfolyamat működik.

### Hullám 5 – Integráció és élesítés

E16 → E17 → E18.

Kilépési feltétel: Google Calendar, NAS-ellenőrzés, backup/restore, hardening és pilot sikeres.

---

## 20. Kész definíció

Az MVP csak akkor tekinthető elkészültnek, ha:

1. valamennyi P0 és P1 történet teljesíti a Definition of Done feltételeit;
2. valamennyi P0-teszt sikeres;
3. P1-teszt csak dokumentált, termékgazda által elfogadott nem kritikus eltéréssel maradhat nyitva;
4. az öt E2E-pilotforgatókönyv sikeres;
5. nincs nyitott kritikus vagy magas hiba;
6. RLS-, audit-, append-only- és Storage-védelmi tesztek sikeresek;
7. a mentés és helyreállítás dokumentáltan kipróbált;
8. mobil- és akadálymentességi minimum teljesül;
9. az adatvédelmi/jogi felelős elvégezte a szükséges ellenőrzést;
10. a kommunikációs vezető írásban elfogadta a működést;
11. a technikai admin átvette az üzemeltetési dokumentációt;
12. a rollback, monitorozás és incidensértesítés működik.

E dokumentum alapján a fejlesztőcsapat feladatkezelő rendszerbe emelheti a backlogot, a QA pedig létrehozhatja az automatizált és kézi tesztcsomagokat további termékdöntés nélkül.
