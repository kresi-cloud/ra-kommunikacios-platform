# Rátgéber Akadémia kommunikációs platform

## Állapotátmeneti, automatizmus- és értesítési mátrix – 1.0

**Kapcsolódó dokumentumok:**

- RA kommunikációs platform – MVP fejlesztési specifikáció 1.0
- RA részletes adatmodell és Supabase RLS-specifikáció 1.0

**Rendszeridő:** UTC  
**Felhasználói időzóna:** Europe/Budapest  
**Kommunikációs működési idő:** minden nap 08:00–20:00

---

## 1. A dokumentum célja

Ez a dokumentum fejlesztői pontossággal meghatározza:

1. az egyes üzleti objektumok engedélyezett állapotait;
2. az állapotok közötti megengedett átmeneteket;
3. az átmenetre jogosult szerepkört;
4. a kötelező előfeltételeket és adatokat;
5. az átmenet mellékhatásait;
6. az automatikus rendszerfolyamatokat;
7. az értesítések címzettjeit, csatornáit és időzítését;
8. a naplózási követelményeket.

Az itt nem engedélyezett állapotátmenet szerveroldalon tiltott, akkor is, ha a kliens hibásan felkínálná.

---

## 2. Általános végrehajtási szabályok

### 2.1. Atomi végrehajtás

Minden állapotátmenet egyetlen adatbázis-tranzakcióban hajtandó végre az alábbi sorrendben:

1. felhasználó és aktív munkamenet ellenőrzése;
2. szerepkör, hatókör, delegáció és MFA-követelmény ellenőrzése;
3. jelenlegi állapot zárolt beolvasása;
4. átmenet és előfeltételek validálása;
5. kötelező indoklás és további adatok validálása;
6. célállapot és kapcsolódó rekordok mentése;
7. auditbejegyzés létrehozása;
8. értesítési események várólistára helyezése;
9. tranzakció lezárása.

Ha bármely lépés hibás, az egész tranzakció visszagördül.

### 2.2. Kötelező auditadat

Minden átmenet rögzíti:

- objektumtípus és objektumazonosító;
- korábbi és új állapot;
- kezdeményező felhasználó vagy rendszerfolyamat;
- esemény időpontja;
- indoklás, ha szükséges;
- projektazonosító, ha értelmezhető;
- kapcsolódó kérés- vagy tranzakcióazonosító;
- az átmenetet lehetővé tevő szerepkör vagy delegáció.

### 2.3. Indoklási szabály

Indoklás mindig kötelező:

- határidő módosításakor;
- blokkoláskor és feloldáskor;
- visszavonáskor;
- elutasításkor;
- archivált rekord újranyitásakor;
- feladat átadásakor;
- tartalom érdemi módosításakor;
- publikáció helyesbítésekor vagy külső eltávolításakor;
- megjelenési jogosultság visszavonásakor;
- technikai admin tartalmi hozzáférésekor;
- kommunikációs vezető által végzett kényszerített szerkesztésizár-feloldáskor.

### 2.4. Értesítési prioritás

Két üzleti prioritás létezik:

- **normál**;
- **kritikus**.

Kritikus jelölést kommunikációs vezető vagy az adott projekt projektgazdája adhat, kötelező indoklással.

### 2.5. Időzítés

- kritikus értesítés azonnal kézbesítendő;
- normál értesítés 08:00–20:00 között azonnal vagy csoportosítva kézbesíthető;
- 20:00 után keletkezett normál értesítés következő nap 08:00 után küldendő;
- az alkalmazáson belüli rekord létrejöhet azonnal, a külső kézbesítés halasztható;
- napi összefoglaló 08:00-kor készül, ha van releváns tartalom.

---

## 3. Projektállapotok

### 3.1. Állapotok

| Kód | Magyar név | Jelentés |
|---|---|---|
| `draft` | Tervezet | Még nem aktív, szerkeszthető projekt |
| `active` | Aktív | A projektben munka folyik |
| `closed` | Lezárt | Tervezett munka befejeződött |
| `archived` | Archivált | Napi munkafelületről kivezetett projekt |

### 3.2. Átmeneti mátrix

| Forrás | Cél | Jogosult | Előfeltétel | Kötelező adat | Mellékhatás |
|---|---|---|---|---|---|
| új | Tervezet | komm. vezető; `create_project` jogú projektgazda | aktív belső fiók | cím, projektgazda | projektkód készül; létrehozó tag lesz |
| Tervezet | Aktív | komm. vezető; projektgazda | projektgazda aktív; legalább cím és cél/időszak | nincs | tagok értesíthetők; projekt megjelenik aktív listákon |
| Aktív | Lezárt | komm. vezető; projektgazda | nincs aktív kritikus blokk; nyitott feladatokra figyelmeztetés | lezárási megjegyzés opcionális | nyitott tételek listája rögzül; projekt írásvédetté válik az alapműveleteknél |
| Lezárt | Aktív | komm. vezető | indoklás | indok | újranyitási audit; projektgazda értesül |
| Lezárt | Archivált | komm. vezető | lezárás megtörtént | nincs | napi listákból kikerül; kereshető marad |
| Archivált | Aktív | komm. vezető | indoklás és aktív projektgazda | indok | teljes újranyitási audit; tagok értesítése normál |

Közvetlen Tervezet → Archivált átmenet csak érdemi aktivitás nélkül, törlési/lomtárfolyamként engedett.

---

## 4. Tartalomállapotok

### 4.1. Állapotok

| Kód | Magyar név | Jelentés |
|---|---|---|
| `idea` | Ötlet | Kezdeti tartalomötlet |
| `planned` | Tervezett | Ütemezett és gazdával rendelkező tartalom |
| `in_progress` | Folyamatban | Előállítás alatt |
| `under_review` | Felülvizsgálat alatt | Szakmai, vezetői, jogi vagy nyelvi ellenőrzés |
| `ready_to_publish` | Publikálásra előkészített | A kötelező ellenőrzések teljesültek |
| `published` | Publikált | Minden kötelező megjelenés és lenyomat elkészült |
| `blocked` | Blokkolt | Publikálás vagy továbbhaladás tiltott |
| `closed` | Lezárt | Utómunka és követés befejeződött |
| `archived` | Archivált | Aktív munkafelületről kivezetett |
| `withdrawn` | Visszavont | A tartalom nem kerül vagy már nem marad aktív használatban |

### 4.2. Normál előrehaladás

| Forrás | Cél | Jogosult | Előfeltétel | Mellékhatás |
|---|---|---|---|---|
| új | Ötlet | komm. vezető; projektgazda; jogosult munkatárs | elsődleges projekt és tartalomgazda | tartalomkód, 1. verzió |
| Ötlet | Tervezett | tartalomgazda; projektgazda; komm. vezető | tartalomtípus, felelős, alapütemezés | kapcsolódó résztvevők értesítése napi összefoglalóban |
| Tervezett | Folyamatban | tartalomgazda; projektgazda; komm. vezető | szükséges feladatok létrehozva; publikációhoz szükséges feladatoknak határidő | felelősök azonnali értesítése |
| Folyamatban | Felülvizsgálat alatt | tartalomgazda; projektgazda; komm. vezető | aktív verzió; kötelező ellenőrzések meghatározva | review-rekordok; felülvizsgálók értesítése |
| Felülvizsgálat alatt | Folyamatban | felülvizsgáló; projektgazda; komm. vezető | változtatási igény | review `changes_requested`; felelős értesítése |
| Felülvizsgálat alatt | Publikálásra előkészített | komm. vezető; erre feljogosított projektgazda | minden kötelező review jóváhagyott; nincs blokk; jogállapot megfelelő; kötelező célfelületek rögzítve; végleges média kijelölve | publikálók értesítése; névadó számára láthatóvá válik |
| Publikálásra előkészített | Publikált | kizárólag rendszer | minden kötelező publikációhoz érvényes lenyomat; nincs aktív blokk | publikálási idő rögzítése; érintettek napi összefoglalója |
| Publikált | Lezárt | projektgazda; komm. vezető | nincs nyitott kötelező utófeladat | lezárási idő; csak korlátozott módosítás |
| Lezárt | Archivált | komm. vezető | lezárt állapot | aktív listákból kikerül |

### 4.3. Visszalépés és érdemi módosítás

| Forrás | Cél | Jogosult | Feltétel | Mellékhatás |
|---|---|---|---|---|
| Publikálásra előkészített | Folyamatban | komm. vezető; engedélyezett projektgazda | érdemi módosítás | új tartalomverzió; jóváhagyások `superseded`; publikálási jogosultság visszavonva |
| Publikálásra előkészített | Felülvizsgálat alatt | komm. vezető; projektgazda | új ellenőrzési igény | új review-kör; publikálók értesítése a visszalépésről |
| Publikált | Folyamatban | komm. vezető | csak új, javított kiadás előkészítéséhez | eredeti publikáció megmarad; új verzió készül |
| Lezárt | Folyamatban | komm. vezető | kötelező indok | újranyitás; projektgazda és felelős értesül |
| Archivált | Folyamatban | komm. vezető | kötelező indok | archiválás feloldása; új aktív verzió szükség szerint |

Technikai javítás önmagában nem változtat állapotot és nem érvényteleníti a jóváhagyást, de új verziót és auditbejegyzést hozhat létre.

### 4.4. Blokkolás

A `blocked` felhasználói állapot mögött külön aktív blokkrekord áll. A blokk megőrzi a blokkolás előtti állapotot.

| Művelet | Jogosult | Előfeltétel | Kötelező adat | Mellékhatás |
|---|---|---|---|---|
| blokkolás | komm. vezető | tartalom nem archivált/visszavont | indok; szükség esetén intézkedési felelős | minden függő publikáció tiltása; címzettek azonnali értesítése |
| jogi blokk jelzése | adatvédelmi/jogi felelős | jogi vagy jogosultsági probléma | indok | rendszer blokkot hoz létre; komm. vezető azonnal értesül |
| feloldás | komm. vezető | intézkedés megtörtént vagy vezetői döntés | feloldási indok; visszaálló állapot | korábbi állapot visszaáll; határidők felülvizsgálata; értesítés |

### 4.5. Visszavonás

| Forrás | Cél | Jogosult | Előfeltétel | Kötelező adat | Mellékhatás |
|---|---|---|---|---|---|
| bármely nem archivált | Visszavont | komm. vezető | indokolt üzleti/jogi döntés | indok | jövőbeni publikációk blokkolása; feladatok lezárási listája; értesítés |
| Publikált | Visszavont | komm. vezető | korábbi publikációk intézkedési felülvizsgálata | indok | publikáció nem törlődik; intézkedési rekordok készülnek |

Visszavont tartalom normál úton nem aktiválható újra; új felhasználáshoz másolat vagy új tartalomrekord szükséges.

---

## 5. Feladatállapotok

### 5.1. Normál átmenetek

| Forrás | Cél | Jogosult | Előfeltétel | Kötelező adat | Értesítés/mellékhatás |
|---|---|---|---|---|---|
| új | Tervezet | jogosult projekt-/tartalomszereplő | egy felelős kijelölhető | cím | nincs külső értesítés |
| Tervezet | Kiosztva | létrehozó; projektgazda; komm. vezető | aktív felelős; kritikusnál indok | felelős, prioritás | felelős azonnal értesül |
| Kiosztva | Elfogadva | felelős | nincs | „Elfogadom” | kiosztó és projektgazda normál értesítése |
| Kiosztva | Pontosításra vár | felelős | nincs | kérdés | kiosztó azonnal értesül |
| Kiosztva | Blokkolt | felelős | akadály jelzése | ok és lehetőség szerint függőség | projektgazda azonnal értesül |
| Elfogadva | Folyamatban | felelős | publikációs feladatnál határidő | nincs | kezdési idő rögzül |
| Folyamatban | Pontosításra vár | felelős | döntés vagy adat szükséges | kérdés, címzett | címzett azonnal értesül |
| Folyamatban | Blokkolt | felelős; projektgazda; komm. vezető | valós akadály | blokk oka és felelőse | késedelmi riasztás szünetel |
| Folyamatban | Felülvizsgálatra átadva | felelős | `requires_review`; eredmény csatolva | átadási megjegyzés opcionális | felülvizsgáló azonnal értesül |
| Folyamatban | Befejezett | felelős | review nem szükséges; eredmény csatolva | nincs | teljesítési idő rögzül |
| Felülvizsgálatra átadva | Befejezett | kijelölt felülvizsgáló; projektgazda | eredmény elfogadott | döntés | felelős értesül |
| Felülvizsgálatra átadva | Folyamatban | kijelölt felülvizsgáló; projektgazda | javítás szükséges | visszaadási indok | felelős azonnal értesül |

### 5.2. Blokk feloldása

Blokkolt feladat feloldásakor a projektgazda vagy kommunikációs vezető:

1. rögzíti a feloldási indokot;
2. kiválasztja a visszaálló állapotot: Elfogadva vagy Folyamatban;
3. új határidőt ad, vagy kifejezetten megerősíti a régit;
4. a rendszer újraindítja a határidős értesítéseket.

### 5.3. Határidő-módosítás

Nem önálló állapotátmenet, de mindig tranzakciós művelet:

- bármely határidő-módosításhoz indok kell;
- a régi határidő append-only előzménybe kerül;
- a felelős, projektgazda és kritikus feladatnál a kommunikációs vezető értesül;
- korábbra hozott határidő esetén a 24 órás vagy 2 órás értesítés azonnal is létrejöhet, ha a küszöb már bekövetkezett;
- visszamenőleges határidő csak kommunikációs vezető által, külön figyelmeztetéssel adható.

### 5.4. Feladatátadás

- jogosult: aktuális felelős kezdeményezheti, projektgazda vagy kommunikációs vezető véglegesíti; projektgazda/vezető közvetlenül is átadhatja;
- indoklás kötelező;
- új felelősnek vissza kell igazolnia;
- állapot „Kiosztva – visszaigazolásra vár” lesz;
- korábbi felelős és határidő-előzmény megmarad;
- riportban csak a hivatalosan felelőssé tett személy számít végrehajtónak.

### 5.5. Visszanyitás, visszavonás, archiválás

| Forrás | Cél | Jogosult | Kötelező adat | Mellékhatás |
|---|---|---|---|---|
| Befejezett | Folyamatban | komm. vezető | indok | nem automatikus hibamutató; felelős értesül |
| bármely nyitott | Visszavont | létrehozó/projektgazda/komm. vezető hatókör szerint | indok | felelős azonnal értesül |
| Befejezett vagy Visszavont | Archivált | projektgazda/komm. vezető | nincs | aktív listából kikerül |

---

## 6. Eseményállapotok

### 6.1. Átmenetek

| Forrás | Cél | Jogosult | Előfeltétel | Kötelező adat | Mellékhatás |
|---|---|---|---|---|---|
| új | Tervezet | komm. vezető; projektgazda; jogosult munkatárs | egy felelős | cím, típus, felelős | eseményazonosító |
| Tervezet | Ütemezett | felelős; projektgazda; komm. vezető | kezdés, befejezés, helyszín/online adat | időpont | meghívások kiküldhetők; ütközésvizsgálat |
| Ütemezett | Ütemezett (adatmódosítás) | felelős; projektgazda; komm. vezető | változtatás | mezőtől függő indok | lényeges változásnál új visszaigazolás; ez nem önálló technikai állapot |
| Ütemezett | Lemondott | felelős; projektgazda; komm. vezető | meghívás után csak lemondás | indok | résztvevők azonnal értesülnek |
| Ütemezett | Megtörtént | rendszer | `ends_at` elmúlt | nincs | felelős utólag módosíthatja kimenetre |
| Megtörtént | Elmaradt | felelős; projektgazda; komm. vezető | téves automatikus kimenet vagy esemény elmaradt | indok | résztvevők és feladatok felülvizsgálata |
| Megtörtént | Átütemezett | felelős; projektgazda; komm. vezető | új időpont szükséges | indok, új időpont | új visszaigazolás |
| Lemondott/Elmaradt/Megtörtént | Archivált | projektgazda; komm. vezető | esemény utókezelése lezárt | nincs | aktív naptárból kikerül |

Az adatmodellben az „Elmaradt” kimenet `cancelled` állapot és `outcome_code = did_not_occur`, az „Átütemezett” pedig `postponed`. Az „Ütemezett (adatmódosítás)” ugyanazon `scheduled` állapot verziózott módosítása, nem új enumérték.

### 6.2. Lényeges eseménymódosítás

Új visszaigazolást igényel:

- kezdési vagy befejezési idő;
- helyszín;
- kötelező részvétel státusza.

Csak értesítést igényel:

- leírás;
- instrukció;
- melléklet;
- kapcsolattartói kiegészítés.

### 6.3. Részvételi állapot

| Forrás | Cél | Jogosult | Naplózás | Értesítés |
|---|---|---|---|---|
| Meghívva/válaszra vár | Elfogadta | résztvevő; névadó helyett komm. vezető is | igen | felelős normál |
| Meghívva/válaszra vár | Elutasította | résztvevő; névadó helyett komm. vezető is | igen | felelős azonnal kötelező eseménynél |
| Meghívva/válaszra vár | Talán | résztvevő | igen | felelős normál |
| bármely válasz | más válasz | résztvevő; jogosult képviselő | igen, előző értékkel | felelős normál |

Mindig látható, hogy a választ maga a résztvevő vagy a kommunikációs vezető adta.

---

## 7. Kommunikációs igény állapotai

| Forrás | Cél | Jogosult | Előfeltétel | Kötelező adat | Mellékhatás |
|---|---|---|---|---|---|
| új | Beérkezett | belső igénylő; tokenes külső | kötelező mezők | űrlapadatok | komm. vezető értesül |
| Beérkezett | Áttekintés alatt | komm. vezető; delegált projektgazda | hatókör kijelölve | nincs | felelős rögzül |
| Áttekintés alatt | Pontosításra vár | befogadó | hiányos adat | kérdés, válaszadási határidő | igénylő azonnal értesül |
| Pontosításra vár | Áttekintés alatt | igénylő/befogadó | válasz beérkezett | válasz | befogadó értesül |
| Áttekintés alatt | Elfogadott | komm. vezető; saját projektben projektgazda | megvalósítási forma kiválasztva | döntés | projekt/tartalom/esemény/feladat készülhet |
| Áttekintés alatt | Elutasított | komm. vezető; saját projektben projektgazda | döntés | indok | igénylő azonnal értesül |
| Beérkezett/Pontosításra vár | Visszavont | igénylő; komm. vezető | még nem megvalósított | indok opcionális az igénylőnek | befogadó értesül |
| Elfogadott | Megvalósítva | rendszer vagy befogadó | kapcsolt célrekord teljesült | nincs | igénylő értesül |
| Elutasított/Visszavont/Megvalósítva | Archivált | komm. vezető | végállapot | nincs | aktív listából kikerül |

---

## 8. Publikáció és lenyomat

### 8.1. Publikációs állapotok

| Állapot | Létrejötte | Módosíthatóság |
|---|---|---|
| Aktív | első érvényes lenyomat létrehozásakor | fejrekord korlátozottan; lenyomat nem |
| Helyesbített | új helyesbítő lenyomat készül | korábbi verziók változtathatatlanok |
| Külső felületről eltávolítva | eltávolítás dokumentálásakor | belső lenyomat megmarad |
| Visszavont | belső döntés alapján | lenyomat megmarad; új változat csak új folyamatban |

### 8.2. Létrehozás

Publikáció csak akkor hozható létre, ha:

- a publikáló aktív szervezeti tag;
- rendelkezik `publish_content` többletjoggal;
- hozzáfér az érintett tartalomhoz és célfelülethez;
- a tartalom `ready_to_publish` állapotú;
- nincs aktív blokk;
- minden szükséges megjelenési jogosultság megfelelő;
- a kötelező fájlverzió elérhető és vírusellenőrzött;
- a csatornaspecifikus lenyomatmezők teljesek.

Mellékhatások:

1. publikációs fejrekord;
2. változtathatatlan 1. lenyomat;
3. média- és bélyegkép-kapcsolatok;
4. kötelező célfelület teljesített jelölése;
5. `add_later` esetén URL-pótlási feladat;
6. tartalom publikációs előrehaladásának újraszámítása;
7. szükség esetén automatikus `published` tartalomállapot;
8. audit és értesítés.

### 8.3. Helyesbítés

| Művelet | Jogosult | Kötelező adat | Mellékhatás |
|---|---|---|---|
| lenyomat helyesbítése | eredeti publikáló hatókörében; komm. vezető | helyesbítés oka | új verzió; régi aktívan megőrződik; vezetői javítási riport |
| URL pótlása | publikáló; komm. vezető | URL | új lenyomatverzió vagy kiegészítő append-only bejegyzés; feladat befejezése |
| külső eltávolítás | publikáló; projektgazda; komm. vezető | időpont és ok | állapotváltás; intézkedési audit |
| visszavonás | komm. vezető | indok | állapotváltás; korábbi lenyomat marad |

### 8.4. Automatikus teljesülésszámítás

```text
teljesült kötelező célok / összes kötelező cél
```

- opcionális cél nem számít a nevezőbe;
- törölt vagy érvénytelen lenyomat nem számítható teljesítettnek;
- helyesbített publikáció továbbra is teljesített;
- külső eltávolítás nem állítja automatikusan vissza a tartalom állapotát, de vezetői figyelmeztetést eredményez.

---

## 9. Fájlállapotok

| Forrás | Cél | Kezdeményező | Előfeltétel | Mellékhatás |
|---|---|---|---|---|
| új | Feltöltés alatt | jogosult felhasználó | célrekord és fájlmetaadat | feltöltési munkamenet |
| Feltöltés alatt | Karanténban | rendszer | bájtok beérkeztek | letöltés tiltott; vizsgálati feladat |
| Karanténban | Vizsgálat alatt | vírusellenőrző | feldolgozás indul | nincs felhasználói hozzáférés |
| Vizsgálat alatt | Elérhető | rendszer | tiszta eredmény; hash elkészült | előnézet-generálás; feltöltő értesítése szükség szerint |
| Vizsgálat alatt | Fertőzött | rendszer | találat | végleges izolálás; tech admin és feltöltő értesül; biztonsági audit |
| Elérhető | Hiányzik | napi NAS-ellenőrzés | NAS-fájl nem érhető el | gazda és projektgazda értesül; előkészített tartalomnál komm. vezető is |
| Hiányzik | Elérhető | napi ellenőrzés vagy kézi validálás | fájl újra elérhető | korábbi címzettek helyreállási értesítést kapnak |
| Elérhető | Lomtárban | gazda; projektgazda; komm. vezető | nincs védett kapcsolat | 30 napos visszaállítási idő |
| Lomtárban | Elérhető | gazda; projektgazda; komm. vezető | 30 napon belül | helyreállítási audit |
| Lomtárban | végleg törölt | rendszer | 30 nap eltelt; nincs védett kapcsolat | bájt törlése; metaadat-tombstone |
| Elérhető | Archivált | komm. vezető; projektgazda hatókör szerint | védett vagy lezárt állomány | kereshető marad, aktív listából kikerül |

Publikációs lenyomathoz, jóváhagyáshoz vagy megjelenési jogosultsághoz kapcsolt fájl nem tehető lomtárba.

### 9.1. Fájlverzió véglegesítése

- jogosult: feladatfelelős vagy projektgazda; kommunikációs vezető felülbírálhat;
- csak elérhető és tiszta fájl véglegesíthető;
- az előző végleges verzió történetileg megmarad, de elveszíti az aktív végleges jelölést;
- publikáció már létrejött lenyomata továbbra is az eredeti pontos verzióra mutat.

---

## 10. Megjelenési jogosultság állapotai

### 10.1. Állapotok és számítás

| Állapot | Feltétel |
|---|---|
| Hiányzik | nincs alkalmazható érvényes rekord |
| Rendben | érvényes, ellenőrzött és az adott használatot lefedi |
| Ellenőrizendő | dokumentum van, de hatály vagy alkalmazhatóság nem egyértelmű |
| Korlátozott | részben engedélyezett, rövid korlátozás kötelező |
| Lejárt | `valid_until` elmúlt |
| Visszavont | visszavonási rekord hatályba lépett |

### 10.2. Átmenetek

| Forrás | Cél | Jogosult/rendszer | Előfeltétel | Mellékhatás |
|---|---|---|---|---|
| Hiányzik | Ellenőrizendő | komm. vezető; adatvédelmi/jogi | dokumentum vagy elektronikus nyilatkozat beérkezett | ellenőrző kijelölése |
| Ellenőrizendő | Rendben | komm. vezető; adatvédelmi/jogi | hatály és dokumentum ellenőrzött | érintett tartalmak újraértékelése |
| Ellenőrizendő | Korlátozott | komm. vezető; adatvédelmi/jogi | részleges engedély | rövid korlátozás; tartalmak újraértékelése |
| Rendben/Korlátozott | Lejárt | rendszer | `valid_until` elmúlt | jövőbeni tartalmak figyelmeztetése/blokkolása |
| bármely aktív | Visszavont | komm. vezető; adatvédelmi/jogi | visszavonás beérkezett | azonnali jövőbeni blokk; intézkedési lista; értesítések |
| Lejárt | Ellenőrizendő | új nyilatkozat érkezése | új dokumentum | új rekord/verzió ellenőrzése |

Visszavont jogosultság nem állítható vissza; új jogosultsági rekord szükséges.

### 10.3. Elektronikus nyilatkozatkérés

| Állapot | Következő állapot | Esemény |
|---|---|---|
| Létrehozva | Kiküldve | egyszer használható link e-mailben elküldve |
| Kiküldve | Beküldve | képviselő kitölti és véglegesíti |
| Kiküldve | Lejárt | hét nap eltelt |
| Kiküldve | Visszavont | új link készül vagy ügyintéző visszavonja |
| Beküldve | Feldolgozva | változtathatatlan PDF és jogosultsági rekord létrejött |

Új link automatikusan visszavonja az előző aktív linket.

---

## 11. Felhasználói fiók és meghívó

### 11.1. Meghívó

| Forrás | Cél | Jogosult/rendszer | Feltétel | Mellékhatás |
|---|---|---|---|---|
| új | Függőben | tech admin kezdeményez + komm. vezető szerepkört jóváhagy | e-mail és szerep/hatókör | egyszer használható meghívó |
| Függőben | Elfogadva | meghívott | megfelelő e-mail; érvényes token | Auth-user, profil, jóváhagyott szerepek |
| Függőben | Lejárt | rendszer | lejárati idő eltelt | token érvénytelen |
| Függőben | Visszavont | tech admin; komm. vezető | még nem használt | token érvénytelen; audit |

### 11.2. Fiók

| Forrás | Cél | Jogosult/rendszer | Kötelező adat/mellékhatás |
|---|---|---|---|
| Meghívott | Aktiválásra vár | rendszer | identitás és e-mail ellenőrzése |
| Aktiválásra vár | Aktív | rendszer | e-mail visszaigazolva; kötelező MFA beállítva, ha szükséges |
| Aktív | Felfüggesztett | tech admin | biztonsági/technikai indok; munkamenetek megszüntetése |
| Felfüggesztett | Aktív | tech admin | feloldási indok; biztonsági ellenőrzés |
| Aktív | Inaktív | tech admin | szervezeti jogviszony vége; munkamenetek megszüntetése |
| Aktív | Lejárt | rendszer | külső fiók lejárata |
| Lejárt/Inaktív | Archivált | rendszer vagy tech admin | történeti adatok megmaradnak |

Szerepkör-változást a kommunikációs vezető hagy jóvá a technikai admin kezdeményezésére. Közvetlenül nem az account status része.

---

## 12. Adatvédelmi ügy állapotai

| Forrás | Cél | Jogosult | Kötelező adat | Mellékhatás |
|---|---|---|---|---|
| új | Beérkezett | komm. vezető; adatvédelmi/jogi | kérelemtípus, érintett, beérkezés | határidő számítása; felelős értesül |
| Beérkezett | Vizsgálat alatt | felelős | ügy átvétele | audit |
| Vizsgálat alatt | Intézkedés alatt | felelős | intézkedési terv | kapcsolt feladatok létrejöhetnek |
| Intézkedés alatt | Lezárt | komm. vezető; adatvédelmi/jogi | intézkedések és lezárási összegzés | lezárási audit; kérelmező értesítése külső folyamat szerint |
| bármely nyitott | Felfüggesztett | adatvédelmi/jogi | jogszerű ok | indok és új felülvizsgálati időpont |

Automatikus személyesadat-törlés nem történik.

---

## 13. Hibajegy állapotai

| Forrás | Cél | Jogosult | Feltétel | Értesítés |
|---|---|---|---|---|
| új | Beérkezett | bármely aktív felhasználó | cím, leírás | tech admin; kritikusnál komm. vezető is |
| Beérkezett | Vizsgálat alatt | tech admin | ügy átvétele | bejelentő normál |
| Vizsgálat alatt | Javítás alatt | tech admin/fejlesztői folyamat | hiba igazolt | bejelentő normál |
| Vizsgálat alatt | Megoldva | tech admin | beavatkozás nem szükséges vagy megoldás | megoldási leírás; bejelentő azonnal |
| Javítás alatt | Megoldva | tech admin | javítás telepítve/ellenőrizve | megoldási leírás; bejelentő azonnal |
| Megoldva | Lezárt | bejelentő vagy tech admin | ellenőrzés/határidő | lezárási audit |
| Megoldva | Vizsgálat alatt | bejelentő; tech admin | probléma fennáll | indok; tech admin azonnal |

Biztonsági vagy személyesadat-incidens külön incidensfolyamatot és azonnali címzetti kört indít.

---

## 14. Automatizmusmátrix

| ID | Esemény/ütemezés | Feltétel | Rendszerművelet | Értesítés | Idempotenciakulcs |
|---|---|---|---|---|---|
| A01 | tartalom mentése | érdemi változás | új verzió; review-k superseded | review-felelősök | content+version |
| A02 | lenyomat létrejön | kötelező cél | cél teljesített | projektgazda napi összefoglaló | publication id |
| A03 | lenyomat létrejön | minden kötelező cél teljes | tartalom → Publikált | felelősök normál | content+published |
| A04 | URL oka `add_later` | publikáció mentve | 24 órás URL-pótlási feladat | kijelölt publikáló azonnal | publication+url-task |
| A05 | jogosultság visszavonva | hatályos visszavonás | jövőbeni tartalmak blokkolása; korábbi publikációk intézkedési listája | komm. vezető és projektgazdák azonnal | permission+revocation |
| A06 | jogosultság lejár | `valid_until` elmúlt | státusz Lejárt; kapcsolt tartalmak újraértékelése | felelősök normál/kritikus kockázatnál azonnal | permission+expiry |
| A07 | külső fiók lejár | `external_expires_at <= now()` | munkamenetek megszüntetése; Lejárt, majd Archivált | fiókgazda és tech admin | user+expiry |
| A08 | meghívó lejár | token fel nem használt | Lejárt; token tiltása | kezdeményező napi összefoglaló | invitation+expiry |
| A09 | nyilatkozati link lejár | 7 nap eltelt | Lejárt; token tiltása | ügyintéző normál | request+expiry |
| A10 | feladat határideje közeleg | 24 óra | emlékeztető | felelős | task+24h |
| A11 | feladat határideje közeleg | 2 óra | emlékeztető | felelős | task+2h |
| A12 | határidő elérkezik | nem befejezett és nem blokkolt | esedékességi értesítés | felelős + projektgazda | task+due |
| A13 | határidő elmúlt | nem befejezett és nem blokkolt | késedelmes jelző | felelős; projektgazda; kritikusnál komm. vezető | task+overdue |
| A14 | blokk feloldva | határidő lejárt vagy közel | új határidő/megerősítés kikényszerítése | felelős | task+unblock |
| A15 | esemény vége elmúlt | státusz Ütemezett | Megtörtént | felelős napi összefoglaló | event+occurred |
| A16 | esemény lényeges módosítása | meghívott résztvevők vannak | válaszok vissza „válaszra vár”; új meghívás | minden érintett azonnal | event+change version |
| A17 | kötelező válaszidő lejár | nincs válasz | figyelmeztetés | résztvevő és felelős | participant+response-due |
| A18 | normál értesítés keletkezik 20:00 után | nem kritikus | külső kézbesítés `deliver_after` következő 08:00 | címzett | notification id |
| A19 | napi 08:00 | van releváns normál esemény | csoportos összefoglaló | felhasználó e-mail/push beállítás szerint | user+date+digest |
| A20 | értesítés 7 napos | normál | archiválás | nincs | notification+archive |
| A21 | értesítés megőrzése lejár | 1 év és nem auditforrás | végleges törlés vagy anonimizálás | nincs | notification+retention |
| A22 | naponta 02:00 | NAS-referencia aktív | elérhetőségi vizsgálat | csak állapotváltozásnál | nas+date |
| A23 | NAS elérhetetlenné válik | korábban elérhető | fájl Hiányzik | gazda, projektgazda, előkészített tartalomnál komm. vezető | nas+missing episode |
| A24 | NAS helyreáll | korábban hiányzott | fájl Elérhető | korábbi címzettek | nas+recovery episode |
| A25 | fájl feltöltve | bájtok teljesek | karantén és vírusvizsgálat | nincs | file-version+scan |
| A26 | vírusvizsgálat tiszta | hash elkészült | Elérhető; előnézet generálása | feltöltő szükség szerint | file-version+clean |
| A27 | vírusvizsgálat fertőzött | találat | Fertőzött; izolálás | tech admin és feltöltő azonnal | file-version+infected |
| A28 | szerkesztési lock inaktív | 15 perc heartbeat nélkül | zárolás feloldása | következő szerkesztő felületi jelzés | lock+expiry |
| A29 | technikai admin hozzáférést kér | indok megadva | 5 perces egyszeri kérés | még nincs tartalomátadás | access request id |
| A30 | tech admin megerősíti megnyitást | kérés érvényes | korlátozott tartalom válasz; audit | komm. vezető azonnal | access request+open |
| A31 | hónapforduló | előző havi hozzáférési esemény van | vezetői hozzáférési összefoglaló | komm. vezető | month+access-report |
| A32 | import előnézet jóváhagyva | validáció kész | helyes sorok importja, hibásak listája | importáló | import+execution |
| A33 | Google kapcsolat hibás | sync hiba | hiányos ütközésvizsgálati jelző | felhasználó | connection+error episode |
| A34 | Google kapcsolat helyreáll | korábban hibás | jelző megszüntetése; újraszinkron | felhasználó normál | connection+recovery |
| A35 | törölt munkapéldány 30 napos | nincs védett kapcsolat | fizikai fájltörlés; tombstone | gazda napi összefoglaló opcionális | file+purge |

---

## 15. Értesítési esemény–címzett mátrix

### 15.1. Feladatok

| Esemény | Címzett | Alkalmazáson belül | E-mail | Push | Prioritás |
|---|---|---:|---:|---:|---|
| új feladat | felelős | igen | igen | igen, ha engedélyezett | normál/kritikus |
| feladat átadása | régi és új felelős; projektgazda | igen | igen | új felelősnek igen | normál/kritikus |
| pontosításkérés | címzett | igen | igen | igen | normál |
| akadály/blokk | projektgazda; kritikusnál komm. vezető | igen | igen | igen | normál/kritikus |
| blokk feloldása | felelős | igen | igen | igen | normál |
| határidő módosítása | felelős; projektgazda; kritikusnál komm. vezető | igen | igen | igen | normál/kritikus |
| 24/2 órás emlékeztető | felelős | igen | felhasználói beállítás szerint | beállítás szerint | normál |
| határidő lejárta | felelős; projektgazda | igen | igen | igen | normál/kritikus |
| felülvizsgálatra átadás | felülvizsgáló | igen | igen | igen | normál |
| javításra visszaadás | felelős | igen | igen | igen | normál |
| befejezés | projektgazda, napi összefoglaló | igen | összefoglaló | nem | normál |

### 15.2. Tartalom és publikáció

| Esemény | Címzett | In-app | E-mail | Push | Megjegyzés |
|---|---|---:|---:|---:|---|
| felülvizsgálat kérése | felülvizsgáló | igen | igen | igen | azonnali |
| változtatási igény | tartalomgazda | igen | igen | igen | azonnali |
| előkészített állapot | kijelölt publikálók; névadói felületen látható | igen | igen publikálóknak | beállítás szerint | névadónak nem kötelező push |
| tartalom blokkolása | tartalomgazda, projektgazda, publikálók | igen | igen | igen | azonnali |
| blokk feloldása | ugyanaz | igen | igen | igen | azonnali |
| publikáció létrejött | projektgazda/vezető összefoglaló | igen | összefoglaló | nem | normál |
| URL-pótlási feladat | kijelölt publikáló | igen | igen | igen | új feladatként |
| publikációs hiba | publikáló, projektgazda, komm. vezető | igen | igen | igen | kritikus lehet |
| külső eltávolítás | projektgazda, komm. vezető | igen | igen | igen | azonnali |
| névadói komment | kizárólag komm. vezető | igen | igen | igen | más nem értesül |

### 15.3. Események

| Esemény | Címzett | In-app | E-mail | Push | Időzítés |
|---|---|---:|---:|---:|---|
| kötelező meghívás | résztvevő | igen | igen | igen | azonnali |
| opcionális meghívás | résztvevő | igen | összefoglaló vagy beállítás | beállítás | normál |
| lényeges változás | minden meghívott | igen | igen | igen | azonnali |
| kisebb változás | minden meghívott | igen | összefoglaló | nem | normál |
| lemondás | minden meghívott | igen | igen | igen | azonnali |
| válaszhiány | résztvevő és felelős | igen | igen | igen | határidőkor |
| kötelező esemény elutasítása | felelős | igen | igen | igen | azonnali |

### 15.4. Jogosultság és adatvédelem

| Esemény | Címzett | Csatorna | Prioritás |
|---|---|---|---|
| megjelenési jogosultság hiányzik/korlátozott | projektgazda és tartalomgazda; szükség szerint komm. vezető | in-app + e-mail; kritikusnál push | normál/kritikus |
| jogosultság lejár | érintett aktív tartalmak felelősei | in-app + e-mail | normál |
| jogosultság visszavonása | komm. vezető és érintett projektgazdák | mindhárom | kritikus |
| nyilatkozat beérkezett | komm. vezető és adatvédelmi/jogi felelős | in-app + e-mail | normál |
| nyilatkozati link lejárt | ügyintéző | in-app + összefoglaló | normál |
| adatvédelmi ügy határideje közeleg | felelős és adatvédelmi/jogi | in-app + e-mail + push beállítás szerint | normál/kritikus |

Az e-mail és push nem tartalmazhat dokumentumtartalmat, részletes korlátozást vagy érzékeny személyes adatot.

### 15.5. Biztonság és adminisztráció

| Esemény | Címzett | In-app | E-mail | Push | Kikapcsolható? |
|---|---|---:|---:|---:|---:|
| szerepkör/jog változása | érintett, komm. vezető, tech admin | igen | igen | igen | nem |
| új eszköz/bejelentkezés gyanús mintával | érintett és tech admin | igen | igen | igen | nem |
| öt sikertelen belépés | érintett és tech admin | igen | igen | kritikusnál | nem |
| fiók felfüggesztése | érintett és komm. vezető | igen | igen | igen | nem |
| tech admin tartalommegnyitása | komm. vezető | igen | igen | igen | nem |
| érzékeny dokumentum megnyitása | audit; havi összefoglaló | nem feltétlen | havi riport | nem | nem releváns |
| fertőzött fájl | feltöltő, tech admin; incidensnél komm. vezető | igen | igen | igen | nem |
| biztonsági incidens | tech admin, komm. vezető; személyes adatnál adatvédelmi/jogi | igen | igen | igen | nem |

### 15.6. Központi rendszerüzenet

- kommunikációs vezető küldhet szerepkörnek, projektcsapatnak vagy minden aktív szervezeti felhasználónak;
- technikai admin csak technikai vagy biztonsági tárgyú rendszerüzenetet küldhet;
- címzetti kör és küldő naplózódik;
- kritikus rendszerüzenet nem kapcsolható ki.

---

## 16. Értesítések csoportosítása

### 16.1. Csoportkulcs

Nem kritikus események az alábbi kulccsal vonhatók össze:

```text
recipient_user_id + entity_type + entity_id + event_family + delivery_window
```

Példa: egy tartalomhoz 20 percen belül érkező három nem sürgős komment egy értesítési csoportként jelenik meg.

### 16.2. Nem csoportosítható események

- kritikus értesítés;
- feladat első kiosztása;
- határidő vagy kötelező esemény lejárata;
- blokkolás;
- jogosultság visszavonása;
- biztonsági incidens;
- technikai admin tartalommegnyitása;
- névadói komment.

### 16.3. Olvasottság

Csak olvasatlan és olvasott állapot van. Nincs „elintézett” vagy „később emlékeztessen” állapot.

- lista megnyitása önmagában nem feltétlen jelöl olvasottnak;
- értesítés vagy célrekord tudatos megnyitása jelölheti olvasottnak;
- kritikus értesítésnél a megnyitás időpontja külön delivery-adatként megmarad.

---

## 17. Késés korrekt számítása

Egy feladat csak akkor számítható a felelősnél késedelmesnek, ha:

1. ő az aktuális kijelölt felelős;
2. elfogadta a feladatot;
3. a határidő lejárt;
4. a feladat nem befejezett;
5. nincs aktív, szabályosan rögzített blokk;
6. a határidőt nem váltotta fel későbbi, érvényes határidő.

Késési okok:

- saját késés;
- alanyra vár;
- másik munkatársra vár;
- vezetői döntésre vár;
- médiafájlra vár;
- technikai probléma;
- külső esemény változása;
- egyéb.

Blokkolás alatt a késési óra riportcélból szünetel. A blokk hossza külön terhelési és folyamatelemzési adat.

---

## 18. Szerkesztési zárolás

| Esemény | Szabály |
|---|---|
| szerkesztés indítása | sikeres lock szükséges |
| másik felhasználó lockja | rekord olvasható; szerkesztés tiltott; zároló neve és ideje látható |
| heartbeat | aktív szerkesztés alatt időszakosan frissül |
| 15 perc inaktivitás | automatikus feloldás |
| kommunikációs vezető feloldja | kötelező indok; zároló értesül |
| párhuzamos mentési kísérlet | optimistic-lock hiba; felhasználó különbségjelzést kap |

Automatikus mentés csak érvényes zárolással írhat. Kapcsolatvesztéskor a felület helyi, nem végleges piszkozatot tarthat, de visszakapcsolódáskor ütközésvizsgálat szükséges.

---

## 19. Hibák és visszavonások kezelése

### 19.1. Háttérfolyamat hibája

- a feladat ugyanazzal az idempotenciakulccsal biztonságosan újrapróbálható;
- exponenciális újrapróbálás javasolt;
- három sikertelen próbálkozás után technikai hibajegy készül;
- kritikus üzleti következménynél tech admin és kommunikációs vezető azonnal értesül;
- részben végrehajtott üzleti tranzakció nem maradhat.

### 19.2. Értesítéskézbesítési hiba

- az alkalmazáson belüli értesítés marad az elsődleges rekord;
- e-mail/push hiba nem gördíti vissza az üzleti műveletet;
- kézbesítési hiba naplózódik és újrapróbálható;
- kritikus értesítés tartós kézbesítési hibájáról tech admin értesül.

### 19.3. Külső integráció hibája

Google Calendar- vagy NAS-hiba nem töröl belső adatot. A rendszer látható „szinkron nem teljes” vagy „fájl nem elérhető” jelzést mutat.

---

## 20. Állapotátmeneti elfogadási tesztek

### 20.1. Tartalom

- [ ] Ötlet nem tehető közvetlenül Publikálttá.
- [ ] Felülvizsgálat nélkül nem tehető előkészítetté, ha review kötelező.
- [ ] Aktív blokk mellett nem készíthető publikáció.
- [ ] Érdemi módosítás érvényteleníti a korábbi review-kat.
- [ ] Technikai javítás nem érvényteleníti automatikusan a review-t.
- [ ] Minden kötelező lenyomat után automatikusan Publikált lesz.
- [ ] Opcionális cél hiánya nem akadályozza a Publikált állapotot.
- [ ] Visszavont tartalom nem aktiválható újra normál átmenettel.

### 20.2. Feladat

- [ ] Egy feladatnak mindig pontosan egy felelőse van.
- [ ] Visszaigazolás előtt nem számít saját késésnek.
- [ ] Határidő indok nélkül nem módosítható.
- [ ] Blokkolt feladatnál szünetel a késedelmi riasztás.
- [ ] Feloldáskor határidődöntés kötelező.
- [ ] Feladatátadás új visszaigazolást kér.
- [ ] Visszanyitás nem növel automatikus hibapontot.

### 20.3. Esemény

- [ ] Időpont/helyszín/kötelezőség változása új választ kér.
- [ ] Leírásmódosítás csak értesít.
- [ ] Ütközés figyelmeztet, de nem blokkol.
- [ ] Meghívás után az esemény nem törölhető, csak lemondható.
- [ ] Befejezési idő után automatikusan Megtörtént.
- [ ] Nem fontos eseményt a névadó nem lát.

### 20.4. Publikáció és jogosultság

- [ ] Külső közreműködő nem publikálhat.
- [ ] Publikáció lenyomata nem módosítható vagy törölhető.
- [ ] Helyesbítés új verziót hoz létre.
- [ ] `add_later` 24 órás feladatot hoz létre egyszer.
- [ ] Story platformelemeknél képernyőkép kötelező.
- [ ] Jogosultság visszavonása blokkolja a jövőbeni publikációt.
- [ ] Korábbi publikáció visszavonáskor sem törlődik automatikusan.

### 20.5. Értesítés és biztonság

- [ ] Normál külső értesítés 20:00 után 08:00-ig vár.
- [ ] Kritikus értesítés azonnal kimegy.
- [ ] Kötelező értesítést a felhasználó nem kapcsolhat ki.
- [ ] Névadói komment csak kommunikációs vezetőhöz jut.
- [ ] `@név` említés in-app és e-mail értesítést készít.
- [ ] Tech admin tartalommegnyitása előtt figyelmeztetés jelenik meg.
- [ ] A megnyitás után a kommunikációs vezető azonnal értesül.
- [ ] Kritikus olvasatlan értesítés hét nap után sem archiválódik.

---

## 21. Kész definíció

Az állapot- és értesítési réteg akkor tekinthető elkészültnek, ha:

1. minden üzleti állapotváltozás célzott szerveroldali műveleten keresztül történik;
2. az itt nem szereplő átmenetek sikertelenek;
3. a tranzakciók auditbejegyzést és szükséges értesítési eseményt hoznak létre;
4. az értesítés külső kézbesítési hibája nem rontja el az üzleti tranzakciót;
5. az automatizmusok idempotensek;
6. a kritikus és normál időzítési szabályok Europe/Budapest szerint működnek;
7. a kötelező címzetti és adatvédelmi szűrések negatív tesztekkel igazoltak;
8. valamennyi 20. fejezetbeli elfogadási teszt sikeres;
9. a háttérfolyamatok hibája látható, újrapróbálható és auditált;
10. a felületi állapotnevek és a technikai kódok megfeleltetése egységes.

E dokumentum alapján az RPC-k, adatbázis-triggerek, háttérfeladatok és értesítési szolgáltatások implementációja további üzleti döntés nélkül megkezdhető.
