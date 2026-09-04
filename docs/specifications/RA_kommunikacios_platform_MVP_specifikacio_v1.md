# Rátgéber Akadémia kommunikációs platform

## MVP fejlesztési specifikáció – 1.0

**Dokumentum állapota:** funkcionálisan lezárt MVP-specifikáció  
**Munkanyelv:** magyar  
**Időzóna:** Europe/Budapest  
**Rendszer rendeltetése:** a Rátgéber Akadémia kommunikációs projektjeinek, tartalmainak, feladatainak, eseményeinek, publikációinak, fájljainak, megjelenési jogosultságainak és vezetői riportjainak egységes belső kezelése.

---

## 1. Cél és hatókör

Az MVP egyetlen szervezetet, a Rátgéber Akadémiát szolgálja ki. Nem több-bérlős (multi-tenant) rendszer.

A rendszer elsődleges céljai:

1. a kommunikációs munka tervezhetővé és átláthatóvá tétele;
2. a projektekhez, tartalmakhoz és eseményekhez tartozó feladatok egyértelmű felelősségi kezelése;
3. a publikálás előkészítésének, végrehajtásának és belső dokumentálásának támogatása;
4. minden publikációról változtathatatlan belső lenyomat megőrzése;
5. a megjelenési jogosultságok gyors, szerepkörhöz igazított ellenőrizhetősége;
6. a kommunikációs vezető számára vezetői, publikációs és munkaterhelési riport biztosítása;
7. mobilon is használható, telepíthető PWA biztosítása.

### 1.1. Az MVP része

- meghívásos felhasználókezelés;
- Google-belépés vagy visszaigazolt e-mail/jelszó alapú belépés;
- kötelező MFA a kiemelt szerepköröknek;
- szerepkör- és hatóköralapú jogosultságkezelés;
- projektek, tartalmak, feladatok és szakmai események;
- kommunikációs igénybejelentés;
- naptár és korlátozott Google Calendar-integráció;
- alkalmazáson belüli, e-mailes és PWA-push értesítések;
- hibrid Supabase–NAS fájlkezelés;
- fájlverziók és előnézetek;
- publikációs rekordok és változtathatatlan publikációs lenyomatok;
- személyprofilok és megjelenési jogosultságok;
- riportok és exportok;
- auditnapló, adatvédelmi ügyrekord és hibabejelentés;
- CSV/XLSX-alapú adatimport.

### 1.2. Nem része az MVP-nek

- több szervezet kiszolgálása;
- teljesen egyedi szerepkör-szerkesztő;
- automatikus közösségimédia-publikálás;
- garantált közösségimédia-statisztika-import API-kapcsolat nélkül;
- valós idejű közös dokumentumszerkesztés;
- teljes offline szerkesztés;
- ismétlődő események;
- teljes automatikus NAS-szinkron;
- kép- és videó-OCR;
- munkaidő- vagy szabadságkeret-nyilvántartás;
- kiküldetési költségelszámolás;
- automatikus dolgozói rangsor vagy teljesítménypont;
- külön többnyelvű munkafolyamat;
- minősített elektronikus aláírás.

---

## 2. Alapfogalmak és rendszermodell

### 2.1. Projekt

A kommunikációs munka elsődleges szervezési egysége. Egy projektnek pontosan egy projektgazdája van. Tartalmazhat tartalmakat, feladatokat, eseményeket, fájlokat és résztvevőket.

Egy tartalomnak egy elsődleges projektje és több további kapcsolódó projektje lehet. A felelősségi és jogosultsági hatókört az elsődleges projekt határozza meg.

### 2.2. Tartalom

Egy kommunikációs alapanyag vagy üzenet központi munkarekordja. Egyetlen közös szerkesztési életciklusa van; az MVP nem kezel külön szerkesztési állapotú csatornaváltozatokat.

Egy tartalom több konkrét megjelenést eredményezhet. Minden konkrét oldalon, profilon, kiadványban vagy belső térben létrejövő megjelenés külön publikációs rekord.

### 2.3. Feladat

Egy végrehajtandó munkaegység, pontosan egy felelőssel. Több közreműködő munkáját több, egymáshoz kapcsolt feladattal kell modellezni. A kommunikációs projekt feladatai jellemzően tartalomhoz kapcsolódnak; önálló feladat is létrehozható.

### 2.4. Szakmai esemény

Önálló rendszerelem, amely tartalom nélkül is létrehozható. Később projekt, tartalom, feladat, résztvevő vagy fájl kapcsolható hozzá.

### 2.5. Publikáció

Egy tartalom egy konkrét célfelületen történt tényleges megjelenése. Egy Facebook-poszt két külön oldalon két publikációs rekordot jelent.

### 2.6. Publikációs lenyomat

A ténylegesen megjelent tartalom változtathatatlan belső dokumentációja: szöveg, média, bélyegkép, célfelület, időpont, publikáló, URL vagy az URL hiányának oka, valamint technikai azonosítók.

### 2.7. Megjelenési jogosultság

Személyhez kapcsolt, időben és felhasználási körben meghatározott jogosultsági rekord és – ha van – az azt igazoló dokumentum.

---

## 3. Szerepkörök és jogosultsági alapelvek

### 3.1. Szerepkörök

1. **Kommunikációs vezető**
2. **Technikai admin**
3. **Projektgazda**
4. **Szervezeti munkatárs**
5. **Publikáló** – külön kapcsolható többletjog szervezeti tagnak
6. **Adatvédelmi/jogi felelős**
7. **Névadó** – egyetlen személy: Rátgéber László
8. **Külső közreműködő**

Egy felhasználónak több szerepköre lehet. A jogosultságok összeadódhatnak, de a kifejezett restrikció mindig elsőbbséget élvez.

Az MVP előre definiált szerepköröket és néhány külön kapcsolható többletjogot használ. Teljes egyedi szerepkör-szerkesztő nem készül.

### 3.2. Fő jogosultsági mátrix

| Funkció | Komm. vezető | Tech. admin | Projektgazda | Munkatárs | Adatvéd./jogi | Névadó | Külső |
|---|---:|---:|---:|---:|---:|---:|---:|
| Minden projekt és tartalom megtekintése | Igen | Csak támogatási hozzáféréssel | Saját projekt | Kiosztás szerint | Jogosultsági ügyben | Korlátozott | Kiosztás szerint |
| Projekt létrehozása | Igen | Nem | Külön joggal | Nem | Nem | Nem | Nem |
| Projekt lezárása | Igen | Nem | Saját projekt | Nem | Nem | Nem | Nem |
| Projekt archiválása/újranyitása | Igen | Nem | Nem | Nem | Nem | Nem | Nem |
| Tartalom blokkolása | Igen | Nem | Saját hatókörben jelzés | Nem | Jogi okból jelzés | Nem | Nem |
| Publikálás | Igen | Nem | Csak publikálói joggal | Csak publikálói joggal | Nem | Nem | Nem |
| Megjelenési dokumentum megnyitása | Igen | Nem | Nem | Nem | Igen | Nem | Nem |
| Munkatársi részletes riport | Igen | Nem | Saját projekt | Nem | Nem | Nem | Nem |
| Összesített kommunikációs riport | Igen | Nem | Saját projekt | Nem | Szükség szerint | Igen, anonimizálva | Nem |
| Felhasználói fiók technikai kezelése | Nem | Igen | Nem | Nem | Nem | Nem | Nem |
| Szerepkör kinevezése | Igen | Kezdeményezi | Nem | Nem | Nem | Nem | Nem |

### 3.3. Kommunikációs vezető

- minden projektet, tartalmat, feladatot, eseményt és archív elemet lát;
- kommentelhet, blokkolhat, feloldhat, visszanyithat és beavatkozhat;
- kinevezi a felhasználói szerepköröket a technikai admin kezdeményezésére;
- teljes publikációs és munkatársi riportot lát;
- látja a javítási adatokat, de azok nem képeznek teljesítménypontot;
- értesítést kap a technikai admin minden tartalmi hozzáféréséről.

### 3.4. Technikai admin támogatási hozzáférése

A technikai admin alapértelmezetten nem lát kommunikációs tartalmat. Tartalom megnyitásakor minden alkalommal:

1. felugró tájékoztatást kap arról, hogy védett tartalomhoz fér hozzá;
2. kifejezetten meg kell erősítenie a megnyitást;
3. a megnyitás naplózódik;
4. a kommunikációs vezető azonnali értesítést kap.

### 3.5. Projektgazda

- jogosultsága projekthez kötött;
- saját projektjét önállóan szervezi;
- külön többletjoggal új projektet hozhat létre, amelynek automatikusan projektgazdája lesz;
- saját projektjében eseményt hozhat létre és résztvevőket hívhat;
- saját projektjét lezárhatja, de nem archiválhatja és nem nyithatja újra;
- csak saját projektcsapatának, kizárólag az adott projekthez tartozó riportját látja.

### 3.6. Névadói szerepkör

A névadói szerepkör egyetlen személyhez, Rátgéber Lászlóhoz tartozik.

Csak az alábbiakat látja:

- a kommunikációs vezető által fontosnak jelölt események;
- publikálásra előkészített tartalmak;
- publikált tartalmak;
- saját elfoglaltságok;
- saját korábbi kommentek;
- személyes bontás nélküli összesített kommunikációs riport.

Nem formális jóváhagyó. Kommentje kizárólag a kommunikációs vezetőhöz jut.

### 3.7. Külső közreműködő

- csak a számára megosztott feladatot, eseményt, projektadatot és fájlokat látja;
- feltölthet és kommentelhet a saját hatókörében;
- nem publikálhat;
- csak a projektben részt vevő személyeket említheti;
- fiókja előre meghatározott időpontban automatikusan lezárul és archiválódik.

### 3.8. Helyettesítés

Időben és hatókörben korlátozott helyettesítés beállítható. Nem aktiválódik automatikusan távollétkor, és nem ad továbbadható jogosultságot. A helyettes minden művelete saját nevén naplózódik.

---

## 4. Azonosítás és felhasználói életciklus

### 4.1. Regisztráció

- nincs nyilvános regisztráció;
- a technikai admin indítja a meghívást;
- a kommunikációs vezető adja meg a szerepkört és szervezeti hatókört;
- a meghívott Google-fiókkal vagy e-mail/jelszó párossal regisztrálhat;
- e-mailes regisztrációnál kötelező az e-mail-cím visszaigazolása;
- csak a meghívott e-mail-cím használható;
- a meghívó egyszer használható és lejár;
- a Google-belépés önmagában nem ad hozzáférést előzetes meghívás nélkül.

### 4.2. Első kiemelt fiókok

A fejlesztő külön, egyszer használható aktiválókódot ad az első technikai admin és kommunikációs vezető számára. Az első belépéskor a felhasználó:

1. megadja saját identitását és e-mail-címét;
2. saját jelszót állít be vagy Google-fiókot kapcsol;
3. visszaigazolja az e-mail-címét;
4. beállítja a kötelező MFA-t;
5. az aktiválókód érvénytelenné válik.

### 4.3. MFA

Kötelező:

- kommunikációs vezetőnek;
- technikai adminnak;
- projektgazdának;
- adatvédelmi/jogi felelősnek;
- névadónak.

Módszer: TOTP-alapú hitelesítő alkalmazás és egyszer használható helyreállító kódok. Az e-mail nem számít második faktornak.

Elveszett MFA visszaállítását a technikai admin kezdeményezi és a kommunikációs vezető hagyja jóvá. Saját MFA-ját egyikük sem állíthatja vissza egyedül.

### 4.4. Jelszó és munkamenet

- legalább 12 karakter;
- gyakori vagy kiszivárgott jelszó nem használható;
- nincs időszakos kötelező jelszócsere;
- normál felhasználó megbízható eszközön legfeljebb 30 napig maradhat bejelentkezve;
- kiemelt szerepkör munkamenete legfeljebb 12 órás;
- érzékeny dokumentum 30 perc inaktivitás után újbóli hitelesítést kér;
- a felhasználó saját eszközeit távolról kijelentkeztetheti;
- a technikai admin biztonsági okból bármely munkamenetet megszüntethet;
- öt sikertelen belépés után fokozatos várakozás, értesítés és naplózás következik.

### 4.5. Inaktiválás

A felhasználói fiók inaktiválható, de a korábbi feladatok, kommentek, publikációk és auditbejegyzések a személy nevével megmaradnak. Fizikai törlés nem történik.

---

## 5. Projekt-, tartalom- és feladatfolyamat

### 5.1. Tartalomállapotok

1. Ötlet
2. Tervezett
3. Folyamatban
4. Felülvizsgálat alatt
5. Publikálásra előkészített
6. Publikált
7. Blokkolt
8. Lezárt
9. Archivált
10. Visszavont

A „Felülvizsgálat alatt” állapot vezetői, szakmai, nyelvi, jogi vagy megjelenési jogosultsági ellenőrzést egyaránt jelenthet.

Nincs „Részben publikált” állapot. Ha a kötelező megjelenések egy része már elkészült, a tartalom „Publikálásra előkészített” marad, és például „2/4 kötelező megjelenés teljesült” jelzés látható.

### 5.2. Automatikus publikált állapot

A tartalom automatikusan „Publikált” állapotba kerül, ha:

- minden előre kötelezőnek jelölt publikáció elkészült;
- mindegyikhez létrejött a minimális publikációs lenyomat;
- nincs aktív blokkolás;
- a szükséges megjelenési jogosultsági ellenőrzés rendben van.

Az opcionális csatornák elmaradása nem akadályozza ezt.

### 5.3. Felülvizsgálat és módosítás

- általános vezetői jóváhagyás nem minden tartalomnál kötelező;
- a kommunikációs vezető tartalomtípus, projekt vagy kockázat szerint előírhatja;
- érdemi szöveg-, média- vagy publikációscél-változás érvényteleníti a korábbi jóváhagyást;
- helyesírási vagy technikai javítás nem érvényteleníti, de naplózódik;
- a módosító választja ki a változás típusát, a kommunikációs vezető felülbírálhatja;
- publikálásra előkészített tartalom módosítása új verziót hoz létre.

### 5.4. Blokkolás

- a kommunikációs vezető azonnal blokkolhat;
- a blokkolás leállít minden még nem végrehajtott publikációt;
- indoklás kötelező;
- intézkedési feladat csak akkor kötelező, ha tényleges teendő szükséges;
- blokk feloldásáig az érintett megjelenés nem jelölhető teljesítettnek.

### 5.5. Feladatállapotok

Javasolt technikai állapotkészlet:

1. Tervezet
2. Kiosztva – visszaigazolásra vár
3. Elfogadva
4. Folyamatban
5. Pontosításra vár
6. Blokkolt
7. Felülvizsgálatra átadva
8. Befejezett
9. Visszavont
10. Archivált

A felelős a kiosztásra az alábbi válaszok egyikét adja:

- Elfogadom
- Pontosítást kérek
- Akadályt jelzek

A feladat az elfogadásig nem számít a felelős saját késésének.

### 5.6. Határidők és prioritás

- feladat lehet határidő nélküli „Nincs még ütemezve” állapotban;
- publikációhoz szükséges feladat határidő nélkül nem léphet „Folyamatban” állapotba;
- minden határidő-módosításhoz kötelező indoklás;
- az eredeti és valamennyi korábbi határidő megmarad;
- két prioritás van: normál és kritikus;
- kritikus jelölést kommunikációs vezető vagy az adott projekt projektgazdája adhat, indoklással.

### 5.7. Feladat lezárása

A riportban csak a „Befejezett” feladat számít elvégzettnek. A felelős befejezettnek jelölheti; kötelező felülvizsgálat esetén a kijelölt felülvizsgáló vagy projektgazda zárja le véglegesen.

A kommunikációs vezető indoklással visszanyithatja. Ez önmagában nem minősül hibának vagy teljesítményromlásnak.

### 5.8. Törlés, archiválás, másolás

- érdemi aktivitás nélküli tervezet törölhető;
- más elem csak visszavonható vagy archiválható;
- törölt munkapéldány 30 napig visszaállítható;
- tartalmat projektgazda vagy kommunikációs vezető archiválhat;
- projektet csak kommunikációs vezető archiválhat és nyithat újra;
- tartalom másolható, de a másolat új azonosítót kap;
- a másolat nem örököl publikációs lenyomatot, jóváhagyást vagy személyes megjelenési jogosultsági állapotot.

---

## 6. Események és naptár

### 6.1. Eseménytípusok

- mérkőzés;
- edzés vagy szakmai program;
- interjú;
- forgatás vagy fotózás;
- sajtóesemény;
- rendezvény;
- értekezlet;
- kiküldetés;
- konferencia;
- tudományos esemény;
- egyéb.

Az MVP nem kezel ismétlődő eseményeket.

### 6.2. Eseményfelelősség és részvétel

- minden eseménynek pontosan egy szervezési felelőse van;
- több belső felhasználó, külső közreműködő, sportoló és egyéb meghívott kapcsolható hozzá;
- részvételi állapotok: meghívva, elfogadta, elutasította, talán, válaszra vár, visszaigazolást nem igényel;
- valamennyi részvételi válasz és változás naplózódik;
- kötelező meghívásnak válaszadási határideje lehet;
- válaszhiánynál a résztvevő és a felelős értesítést kap.

### 6.3. Láthatóság

- kommunikációs vezető: időpont, típus, megjegyzés;
- projektgazda: foglalt/szabad, valamint saját projektjének eseménye;
- más munkatárs: csak foglalt/szabad;
- névadó: saját eseményei, meghívásai és a fontosnak jelölt események;
- külső közreműködő: csak rá tartozó időpont, helyszín, instrukció, kapcsolattartó, feladat és megosztott fájl.

Magánjellegű elfoglaltság „Nem elérhető” formában, részletek nélkül rögzíthető.

### 6.4. Google Calendar

- a platform eseménye bekerülhet a felhasználó kiválasztott Google-naptárába;
- a Google Calendar felől csak foglaltsági idősáv kerül vissza;
- cím, leírás és résztvevők nem másolódnak be;
- szervezeti vagy magán Google-fiók egyaránt kapcsolható;
- a kapcsolat megszakadásakor figyelmeztetés jelenik meg;
- a platform saját eseményei megmaradnak;
- a rendszer jelzi, ha az ütközésvizsgálat hiányos.

### 6.5. Ütközés és eseménymódosítás

- az ütközés figyelmeztet, de nem blokkol;
- kötelező részvételnél az ütközés melletti meghívás indoklást igényel;
- időpont, helyszín vagy kötelező részvétel módosításakor új visszaigazolás szükséges;
- leírás vagy melléklet módosításakor csak értesítés megy;
- meghívás előtt az esemény törölhető;
- meghívás után csak indoklással lemondható;
- a befejezési idő után automatikusan „Megtörtént”, de „Elmaradt” vagy „Átütemezett” állapotra módosítható.

### 6.6. Eseményből létrehozható kommunikációs teendők

A létrehozó opcionálisan kérhet:

- előzetes kommunikációt;
- helyszíni fotót vagy videót;
- beszámolót;
- publikálást;
- kommunikációs feladat nélküli eseményt.

### 6.7. Kiküldetés

Rögzíthető: helyszín, indulás, érkezés, utazási idő, résztvevők, kapcsolódó projekt vagy esemény és opcionális megjegyzés. Költségelszámolás nincs.

---

## 7. Értesítések

### 7.1. Csatornák

- alkalmazáson belüli;
- e-mail;
- telepített PWA esetén push.

A normál e-mail és push kikapcsolható. Biztonsági, fiók-, jogosultsági és kritikus értesítések nem kapcsolhatók ki.

### 7.2. Azonnali értesítések

- új, visszavont vagy átadott feladat;
- blokkolás és feloldás;
- névadói komment;
- kötelező eseménymeghívás vagy lényeges módosítás;
- megjelenési jogosultsági probléma;
- publikációs hiba;
- kiemelt tartalom jóváhagyása vagy visszaküldése;
- biztonsági esemény;
- technikai admin tartalmi hozzáférése.

`@név` említéskor alkalmazáson belüli értesítés és e-mail is megy.

### 7.3. Napi összefoglaló

08:00-kor, Europe/Budapest szerint készül, hétvégén is, ha van releváns esemény. Üres összefoglaló nem készül.

Tartalma lehet:

- nem sürgős kommentek;
- új megosztások;
- opcionális eseménymeghívások;
- közelgő normál határidők;
- kisebb projektváltozások;
- elkészült publikációk.

### 7.4. Működési idő

A rendszer kommunikációs működési ideje minden nap 08:00–20:00. Ezen kívül csak kritikus értesítés megy azonnal; minden más következő nap 08:00 után.

### 7.5. Határidős értesítések

- 24 órával előtte;
- 2 órával előtte;
- a határidő pillanatában;
- késedelembe kerüléskor.

Blokkolt feladatnál a késedelmi értesítések szünetelnek, ha az ok és felelős rögzítve van. Feloldáskor új határidőt kell megadni vagy a régit megerősíteni.

Késedelemkor:

- a felelős azonnal értesül;
- a projektgazda a határidő lejártakor értesül;
- a kommunikációs vezető kritikus feladatnál azonnal, máskor összefoglalóban értesül.

### 7.6. Állapot és megőrzés

Az értesítés olvasatlan vagy olvasott lehet. A normál értesítés hét naptári nap után archívumba kerül. El nem intézett kritikus értesítés nem archiválódik automatikusan. Az előzményeket egy évig kell megőrizni.

---

## 8. Fájlkezelés

### 8.1. Tárolási modell

**Supabase privát tárhely:** bélyegképek, előnézetek, dokumentumok, megjelenési nyilatkozatok, kisebb publikációs fájlok és importfájlok.

**NAS:** nagy felbontású nyers videók, fotóarchívum, vágási projektfájlok, mesterszalagok és nagy végleges videók.

A közvetlen Supabase-feltöltési limit 250 MB fájlonként. Nagyobb fájlhoz NAS-hivatkozás készül.

### 8.2. Engedélyezett formátumok

- kép: JPG, PNG, WebP, HEIC;
- videó: MP4, MOV;
- hang: MP3, WAV, M4A;
- dokumentum: PDF, DOCX, XLSX, PPTX, TXT, CSV;
- csomag: ZIP.

Végrehajtható állomány nem tölthető fel.

### 8.3. Feltöltés és ellenőrzés

- minden fájlnak tulajdonosa és legalább egy kapcsolódó rekordja van;
- külső közreműködő csak saját hatókörébe tölthet fel;
- vírus- és kártevő-ellenőrzés kötelező;
- ellenőrzésig a fájl karanténban marad;
- mobilos feltöltésnél folyamatjelző és megszakított feltöltés folytatása szükséges.

### 8.4. Előnézetek

- képből bélyegkép;
- videóból képkocka és rövid technikai előnézet;
- PDF-ből elsőoldali bélyegkép;
- Office-dokumentumnál fájlikon és metaadat.

A videóbélyegképet a felhasználó kicserélheti.

### 8.5. Verziózás

- felülírás nincs;
- új verzió feltöltése új fájlverziót hoz létre;
- a tárolt fájlnév végére Europe/Budapest szerinti `YYMMDDHHmm` időbélyeg kerül;
- az eredeti fájlnév külön metaadatként megmarad;
- technikai ütközés esetén belső egyedi azonosító biztosítja az egyediséget;
- publikált vagy jóváhagyott fájlverzió nem írható felül;
- egyszerre egy aktív végleges verzió van;
- korábbi végleges verziók megmaradnak;
- végleges verziót felelős vagy projektgazda jelölhet, a kommunikációs vezető felülbírálhatja;
- minden fájlhoz SHA-256 ellenőrző összeg készül.

### 8.6. Törlés és NAS-ellenőrzés

- nem használt munkapéldány 30 napos lomtárba tehető;
- publikációs, jóváhagyási vagy jogosultsági rekordhoz kapcsolt fájl csak archiválható;
- a NAS-fájlok elérhetősége naponta, alapértelmezetten 02:00-kor ellenőrzendő;
- hiány esetén a fájl gazdája és projektgazda értesül;
- publikálásra előkészített tartalomnál a kommunikációs vezető is értesül.

---

## 9. Publikációs lenyomat

### 9.1. Kötelező alapadatok

- csatorna;
- konkrét oldal, profil, kiadvány vagy belső tér;
- tényleges publikációs idő;
- publikáló szervezeti tag;
- publikált szöveg vagy rövid leírás;
- kapcsolódó tartalom;
- publikált fájlverzió vagy azonosító;
- jellegzetes bélyegkép;
- URL vagy hiányának indoka;
- technikai időbélyeg;
- fájl-ellenőrző összeg.

Publikációt csak publikálói többletjoggal rendelkező szervezeti tag rögzíthet. Külső közreműködő nem publikálhat.

### 9.2. URL-szabály

Tartós online tartalomnál az URL alapértelmezetten kötelező, de indoklással kihagyható:

- nincs tartós URL;
- zárt vagy korlátozott hozzáférésű tartalom;
- technikailag nem elérhető;
- később kerül pótlásra;
- egyéb.

„Később kerül pótlásra” választásnál 24 órás automatikus feladat készül. Határidejét a kommunikációs vezető indoklással módosíthatja.

### 9.3. Csatornaspecifikus minimumok

**Story:** legalább egy álló bélyegkép vagy kontaktlap, publikált szöveg, végleges médiafájl pontos verziója, profil, időpont és URL, ha van. Platformon hozzáadott zene, matrica vagy felirat esetén képernyőkép kötelező.

**Belső kommunikáció:** tárgy, teljes kiküldött szöveg, feladó, címzetti csoport neve és létszáma, csatorna, küldési idő, mellékletek. Személyes címek csak külön jogosultsággal láthatók.

**Sajtókiküldés:** végleges anyag, sajtólista, kiküldési időpont és kapcsolódó metaadatok. A pontos címzettlista csak kommunikációs vezetőnek és külön feljogosított szervezeti tagnak látható.

**Nyomtatott kiadvány:** végleges PDF vagy jó minőségű fotó, példányszám, kiadványtípus, megjelenési vagy terjesztési idő és hely.

### 9.4. Változtathatatlanság

A publikációs lenyomat nem írható át. Javítás új verzióként, indoklással, időbélyeggel és módosító személlyel készül. Külső platformról törölt tartalom „Külső felületről eltávolítva” állapotba kerül; a belső lenyomat megmarad.

### 9.5. Eredményadatok

Opcionálisan rögzíthető:

- elérés;
- megtekintés;
- reakció;
- hozzászólás;
- megosztás;
- videómegtekintési idő;
- mérés időpontja.

Manuális rögzítés minden esetben rendelkezésre áll. Nyilvánosan lekérhető adat felajánlható, de nem garantált. Közösségimédia-API-integráció nincs az MVP-ben.

---

## 10. Megjelenési jogosultságok

### 10.1. Jogosultsági rekord

Tartalmazza:

- érintett személy;
- kiskorú/nagykorú státusz;
- törvényes képviselő;
- dokumentum vagy jogosultság típusa;
- engedélyezett médiatípusok;
- engedélyezett csatornák;
- felhasználási cél;
- kezdő és lejárati idő;
- dokumentum és sablonverzió;
- rögzítő és ellenőrző;
- korlátozások;
- visszavonási állapot.

### 10.2. Jogosultsági szintek

- általános, szezonális jogosultság;
- különleges tartalomhoz egyedi jogosultság.

Egyedi ellenőrzést igényelhet például érzékeny személyes történet, egészségi adat, hosszabb portréfilm, fizetett kampány, külső partner marketinganyaga vagy a szokásos akadémiai kommunikáción túlmutató felhasználás.

A szabályellenőrzés szabályalapú, nem AI-döntés.

### 10.3. Csoport- és egyéni ellenőrzés

- csapat- és eseményfotónál csoportszintű ellenőrzés;
- portré, interjú és név szerinti kiemelés esetén egyéni ellenőrzés;
- figyelmeztetés hiányzó vagy korlátozott jogosultság esetén;
- a projektgazda csak állapotot, hatályt és rövid korlátozást lát;
- a stábtag csak publikálható/nem publikálható jelzést lát.

### 10.4. Visszavonás

- jövőbeni publikáció automatikusan blokkolódik;
- előkészített tartalmak listázódnak;
- korábbi publikációkról intézkedési lista készül;
- kommunikációs vezető és érintett projektgazdák értesülnek;
- korábbi tartalom nem törlődik automatikusan;
- minden intézkedés auditálódik.

### 10.5. Dokumentumvédelem

- külön privát tárhely;
- nyilvános URL nincs;
- legfeljebb 5 perces aláírt hozzáférési link;
- minden megnyitás és letöltés naplózódik;
- globális keresőben nem jelenik meg;
- általános exportba nem kerül;
- tömeges letöltés nincs;
- megnyitáskor külön adatvédelmi figyelmeztetés jelenik meg.

### 10.6. Elektronikus nyilatkozat

- törvényes képviselő teljes RA-fiók nélkül, egyszer használható linken tölti ki;
- a link 7 napig érvényes;
- új link kiadásakor a régi érvénytelen;
- beküldés után ugyanazon a linken nem módosítható;
- módosításhoz új, naplózott folyamat vagy visszavonás szükséges;
- változtathatatlan PDF, dokumentumverzió, választások, név, e-mail, időpont, technikai azonosítók és visszaigazoló e-mail készül;
- szükségtelen igazolványmásolatot nem gyűjtünk.

### 10.7. Személyprofil

Sportoló profilját kommunikációs vezető, adatvédelmi/jogi felelős vagy külön feljogosított szervezeti tag hozhatja létre. Duplikációellenőrzés név, születési év és csapat alapján figyelmeztet, de nem egyesít automatikusan.

Kiskorú profil létrehozható törvényes képviselő nélkül „Hiányos” állapotban, de elektronikus nyilatkozatkéréshez legalább egy képviselő szükséges.

### 10.8. Adatvédelmi ügyrekord

Kezeli a hozzáférési, másolatkérési, helyesbítési, törlési és egyéb érintetti kérelmeket. Tartalmazza a típust, érintettet, beérkezést, határidőt, felelőst, intézkedéseket és lezárást. Automatikus törlés nem történik.

---

## 11. Kommunikációs igénybejelentés

### 11.1. Benyújtás

- belső felhasználó belépés után;
- meghívott külső személy egyszer használható űrlaplinkkel;
- teljesen nyilvános űrlap nincs.

### 11.2. Kötelező mezők

- igénylő;
- cél és rövid leírás;
- kívánt eredmény;
- kapcsolódó esemény vagy dátum;
- kívánt megjelenési idő;
- célcsoport;
- érintett csapat vagy személy;
- rendelkezésre álló anyagok;
- kapcsolattartó.

Az igénylő csatornát javasolhat, de a végleges csatornáról a kommunikációs vezető vagy projektgazda dönt.

### 11.3. Állapotok

1. Beérkezett
2. Áttekintés alatt
3. Pontosításra vár
4. Elfogadott
5. Elutasított
6. Visszavont
7. Megvalósítva
8. Archivált

Elutasításkor kötelező az indoklás. Hiánypótlás válaszadási határidővel kérhető.

Elfogadott igényből tartalom, projekt, szakmai esemény vagy önálló feladat készíthető. Az eredeti igény kapcsolata megmarad.

---

## 12. Riportok

### 12.1. Publikációs riport

Fő mutatók:

- elkészült tartalmak;
- publikációk;
- előkészített, késő és visszavont anyagok;
- hiányos publikációs lenyomatok;
- elkészítési idő;
- több célfelületes megjelenések;
- csatornák és tartalomtípusok megoszlása;
- opcionális eredményadatok.

Szűrők: aktuális és előző hét/hónap, negyedév, szezon, év, egyedi időszak, csatorna, tartalomtípus, projekt, csapat, nem, téma, állapot, felelős és publikáló.

A szezon alapértelmezetten július 1.–június 30., de módosítható.

### 12.2. Munkatársi riport

Külön kezeli a terhelést és teljesítést.

Terhelés:

- kiosztott feladatok;
- aktív projektek;
- esti és hétvégi események;
- kiküldetések;
- utazási idő;
- opcionális becsült és tényleges ráfordítás.

Teljesítés:

- befejezett feladatok;
- határidőre teljesítés;
- publikált tartalmakhoz való hozzájárulás;
- nyitott és blokkolt feladatok.

Nincs automatikus rangsor vagy összesített teljesítménypont. A javítások csak a kommunikációs vezetőnek láthatók, és nem minősülnek automatikus teljesítménymutatónak.

A munkatárs saját részletes statisztikáját nem látja.

### 12.3. Ráfordítás

Opcionálisan rögzíthető becsült és tényleges idő, percben vagy órában. Stopperes időmérés nincs. Az esti és hétvégi munka automatikusan, az időpont alapján jelenik meg terhelési adatként.

### 12.4. Export

- XLSX;
- CSV;
- nyomtatható PDF.

Minden export tartalmazza az időszakot, aktív szűrőket, lekérés idejét, exportálót és összesítéseket. Minden export naplózódik.

Jogosultság:

- munkatársi részletes export: csak kommunikációs vezető;
- projektgazda: saját projektjének adatai;
- névadó: személynevek, javítások és belső megjegyzések nélküli összesített riport.

Automatikusan kiküldött vezetői riport nincs az MVP-ben.

---

## 13. Keresés és címkék

### 13.1. Globális keresés

Csak a felhasználó által elérhető adatokban keres:

- projekt- és tartalomcím;
- leírás és publikált szöveg;
- feladat;
- esemény;
- fájlnév és metaadat;
- személynév;
- címke;
- publikációs URL;
- PDF-, DOCX- és TXT-fájl kinyert szövege.

Megjelenési nyilatkozat nem jelenik meg a globális keresőben. Kép- és videó-OCR nincs.

### 13.2. Címkék

Központi címkekészletet a kommunikációs vezető kezel. A projektgazda új címkét javasolhat, de szabadon gépelt címke nem jön létre automatikusan.

---

## 14. Felület és képernyők

### 14.1. Főmenü

- Kezdőlap
- Feladatok
- Naptár
- Projektek
- Tartalmak
- Események
- Fájlok
- Igények
- Személyek és jogosultságok
- Riportok
- Adminisztráció

Csak a jogosult menüpontok láthatók.

### 14.2. Szerepköri kezdőoldalak

**Munkatárs:** saját feladatok, mai események, értesítések, közelgő határidők, pontosításra váró tételek.

**Projektgazda:** saját projektek, késő és blokkolt feladatok, közelgő publikációk, eseményválaszok, jogosultsági problémák, csapatterhelés.

**Kommunikációs vezető:** napi helyzetkép, előkészített tartalmak, kritikus és blokkolt tételek, késések, események, névadói kommentek, jogosultsági problémák, technikaiadmin-hozzáférések, stábterhelés.

**Névadó:** fontos események, előkészített és publikált tartalmak, saját elfoglaltságok és kommentek.

**Külső:** kizárólag saját feladatok és események.

### 14.3. Fő adatlapok

**Tartalom:** Áttekintés; Szöveg és média; Feladatok; Események; Megjelenések; Jogosultságok; Kommentek; Előzmények.

**Projekt:** Összefoglaló; projektgazda; időszak; tagok; tartalmak; feladatok; események; fájlok; aktivitás; projektstatisztika.

### 14.4. Nézetek

- tartalom és projekt: lista/kártya;
- feladat: lista/Kanban;
- esemény: lista/naptár;
- saját utolsó nézet és szűrők eszközök között szinkronizálódnak;
- saját mentett szűrők létrehozhatók;
- megosztott szűrők nincsenek.

### 14.5. Mobil és PWA

- napi műveletek teljes értékűek mobilon;
- összetett adminisztráció és részletes riport egyszerűsíthető;
- módosításhoz internet szükséges;
- utoljára megnyitott alapadatok korlátozottan megjelenhetnek offline;
- mobilkamera és fájlválasztó használható;
- push eszközönként engedélyezhető és visszavonható;
- push nem tartalmazhat érzékeny személyes adatot;
- érintésre a megfelelő rekordra navigál.

### 14.6. Szerkesztés

- automatikus mentés és látható mentési állapot;
- kapcsolatvesztés jelzése;
- nincs valós idejű közös szerkesztés;
- aktivitás mellett szerkesztési zárolás;
- 15 perc inaktivitás után automatikus feloldás;
- kommunikációs vezető kézzel feloldhatja.

### 14.7. Használhatóság

- Rátgéber Akadémia arculatához illeszkedő megjelenés;
- WCAG 2.1 AA alapelvek;
- billentyűzetes kezelés;
- megfelelő kontraszt és látható fókusz;
- mezőcímkék és alternatív képszövegek;
- rövid, szerepkörhöz igazított első belépési bemutató;
- képernyőnkénti súgó;
- csak magyar kezelőfelület.

Támogatott: Chrome, Edge, Firefox és Safari aktuális, valamint eggyel korábbi főverzió; Android és iOS aktuális verziói.

---

## 15. Audit, adatmegőrzés és biztonság

### 15.1. Auditált események

- be- és kijelentkezés, sikertelen belépés;
- felhasználó-, szerepkör- és jogosultságváltozás;
- helyettesítés;
- projekt-, tartalom- és feladatállapot-változás;
- határidőmódosítás és feladatátadás;
- jóváhagyás, visszaküldés és blokkolás;
- publikáció, javítás és visszavonás;
- fájlverzió, véglegesítés és törlés;
- megjelenési dokumentum megnyitása és módosítása;
- riportmegtekintés és export;
- technikai admin tartalmi hozzáférése.

Az auditnapló nem módosítható és nem törölhető. Hibás bejegyzéshez csak helyesbítő esemény kapcsolható.

### 15.2. Auditláthatóság

- kommunikációs vezető: teljes üzleti és hozzáférési napló;
- technikai admin: technikai és biztonsági napló;
- adatvédelmi/jogi felelős: személyes adatokkal és jogosultsági dokumentumokkal kapcsolatos napló;
- más szerepkör: nincs hozzáférés.

A kommunikációs vezető havi hozzáférési összefoglalót kap a technikaiadmin-megnyitásokról, jogosultságváltozásokról, érzékeny dokumentumokról, tömeges exportokról és rendellenes belépésekről.

### 15.3. Megőrzési idők

| Adattípus | Megőrzés |
|---|---|
| Publikációs lenyomat | Hosszú távú intézményi archívum |
| Projekt és tartalom | Lezárás után archívumban |
| Auditnapló | 5 év |
| Értesítési előzmény | 1 év |
| Sikertelen belépési napló | Legalább 1 év, auditpolitika szerint |
| Törölt munkapéldány | 30 nap |
| Importnapló | 1 év |
| Jogosultsági dokumentum | Adatvédelmi/jogi felülvizsgálat szerint |

### 15.4. Technikai biztonság

- kizárólag HTTPS;
- adatbázis és felhőtárhely EU-régióban;
- privát fájlok legfeljebb 10 perces aláírt linkkel;
- jogosultsági dokumentumok legfeljebb 5 perces linkkel;
- adatbázis-szintű sorbiztonság szükséges;
- kliensoldali elrejtés önmagában nem számít jogosultságvédelemnek;
- környezetenként elkülönített titkok és hitelesítő adatok.

---

## 16. Import

CSV/XLSX-fájlból importálhatók:

- felhasználók;
- sportolók és törvényes képviselők;
- csapatok;
- projektek;
- megjelenési jogosultságok alapadatai.

ZIP-csomagból vagy kijelölt NAS-mappából fájlimport végezhető előzetes ellenőrző nézettel.

Importálás előtt kötelező:

- mezőleképezés;
- előnézet;
- duplikáció- és hibaellenőrzés;
- felhasználói megerősítés.

A helyes sorok importálhatók, a hibásak javítható listára kerülnek. Az import és eredménye naplózódik.

Az MVP indulásához csak az aktív projektek, az aktuális szezon és a rendszeresen használt törzsadatok migrációja kötelező.

---

## 17. Környezetek, mentés és helyreállítás

### 17.1. Környezetek

- fejlesztői;
- teszt;
- éles.

Mindegyik külön adatbázist és tárhelyet használ. Éles személyes adat nem másolható tesztkörnyezetbe; csak mesterséges vagy anonimizált adat használható.

### 17.2. Mentés

- napi teljes adatbázis-mentés;
- óránkénti helyreállítási pont vagy tranzakciónapló;
- legalább 30 napos mentésmegőrzés;
- Supabase-fájlok külön napi mentése más logikai tárhelyre;
- a NAS tényleges mentése az akadémiai üzemeltetés feladata;
- negyedéves, dokumentált visszaállítási próba.

### 17.3. Helyreállítási cél

- legfeljebb 1 óra adatvesztés;
- kritikus hibánál legfeljebb 8 órás helyreállítási cél.

### 17.4. Kiadás

Élesítéshez a technikai admin technikai és a kommunikációs vezető üzleti jóváhagyása egyaránt szükséges. Hibás kiadásnál adatvesztés nélküli visszaállás szükséges az előző stabil verzióra.

Teljes üzleti teszt nélkül csak sürgős biztonsági vagy működésképtelenséget megszüntető javítás adható ki, utólagos dokumentálással és kommunikációsvezetői értesítéssel.

---

## 18. Hibakezelés

Beépített hibabejelentő szükséges leírással, képernyőképpel és automatikusan csatolható technikai környezetadattal.

Érzékeny tartalom külön figyelmeztetés mellett csatolható; az ilyen jegyet csak technikai admin és szükség esetén kommunikációs vezető látja.

Prioritások:

- kritikus;
- magas;
- normál;
- alacsony.

Állapotok:

- Beérkezett
- Vizsgálat alatt
- Javítás alatt
- Megoldva
- Lezárt

Biztonsági esemény azonnal a technikai adminhoz és kommunikációs vezetőhöz, személyes adat érintettségekor az adatvédelmi/jogi felelőshöz is eljut.

---

## 19. Nem funkcionális követelmények

### 19.1. Kapacitás

- legfeljebb 100 aktív fiók;
- legfeljebb 30 egyidejű felhasználó;
- évente legfeljebb 10 000 tartalom-, feladat- és eseményjellegű rekord;
- nagy médiafájlok többsége NAS-on.

### 19.2. Teljesítmény

A szokásos lista- és adatlapműveletek 95%-a normál internetkapcsolaton három másodpercen belül töltődjön be.

### 19.3. Rendelkezésre állás

Havi 99,5% működési cél, az előre bejelentett karbantartás nélkül.

### 19.4. Adatintegritás

- minden érzékeny módosítás szerveroldali jogosultság-ellenőrzést igényel;
- minden állapotátmenet csak engedélyezett előző állapotból történhet;
- publikációs és auditrekord nem írható felül;
- kapcsolt rekord fizikai törlése idegenkulcs- vagy alkalmazásszinten blokkolandó;
- valamennyi dátum adatbázisban UTC-ben, megjelenítéskor Europe/Budapest szerint kezelendő.

---

## 20. Pilot és elfogadás

### 20.1. Pilot

2–4 hetes, szűk körű, valós működési pilot szükséges.

Résztvevők:

- kommunikációs vezető;
- technikai admin;
- egy projektgazda;
- 2–3 munkatárs;
- Rátgéber László;
- egy külső közreműködő;
- adatvédelmi/jogi felelős.

### 20.2. Kötelező pilotforgatókönyvek

1. egyszerű közösségimédia-poszt;
2. többfeladatos esemény vagy mérkőzéskommunikáció;
3. kiskorú sportolót érintő, jogosultságellenőrzést igénylő tartalom.

### 20.3. Élesítés minimumfeltétele

- nincs nyitott kritikus hiba;
- a fő munkafolyamatok elejétől végéig végrehajthatók;
- jogosultsági és tiltási tesztek sikeresek;
- mentés és visszaállítás kipróbált;
- mobilos alapműveletek működnek;
- auditnapló és export helyes;
- a kommunikációs vezető írásban elfogadta;
- adatvédelmi/jogi ellenőrzés megtörtént;
- tesztadatok naplózott módon törölve;
- csak ellenőrzött valós pilotadat marad az éles rendszerben.

### 20.4. Felelősség

- üzleti termékgazda: kommunikációs vezető;
- technikai üzemeltetés: technikai admin;
- funkcionális prioritásról a technikai admin önállóan nem dönt.

---

## 21. Magas szintű adatmodell

### 21.1. Identitás és jogosultság

- `users`
- `profiles`
- `roles`
- `user_roles`
- `permission_grants`
- `invitations`
- `delegations`
- `user_sessions`
- `mfa_recovery_events`

### 21.2. Szervezeti törzsadat

- `teams`
- `seasons`
- `channels`
- `publication_targets`
- `tags`
- `content_types`
- `event_types`

### 21.3. Munkafolyamat

- `projects`
- `project_members`
- `contents`
- `content_projects`
- `content_versions`
- `tasks`
- `task_relations`
- `reviews`
- `blocks`
- `comments`
- `mentions`
- `activity_events`

### 21.4. Esemény és naptár

- `events`
- `event_participants`
- `availability_blocks`
- `calendar_connections`
- `calendar_sync_events`
- `travel_records`

### 21.5. Fájlok

- `files`
- `file_versions`
- `file_links`
- `file_previews`
- `malware_scan_results`
- `nas_references`
- `nas_availability_checks`

### 21.6. Publikáció

- `publications`
- `publication_versions`
- `publication_assets`
- `publication_metrics`
- `publication_corrections`
- `publication_removal_actions`

### 21.7. Személyek és jogosultságok

- `persons`
- `person_team_memberships`
- `legal_representatives`
- `person_representatives`
- `appearance_permissions`
- `permission_documents`
- `permission_requests`
- `permission_revocations`
- `privacy_cases`

### 21.8. Igények, értesítés és riport

- `communication_requests`
- `notifications`
- `notification_deliveries`
- `report_exports`
- `work_effort_entries`
- `audit_log`
- `imports`
- `import_rows`
- `support_tickets`

### 21.9. Alapkapcsolatok

- egy projektnek egy projektgazdája és több tagja lehet;
- egy tartalomnak egy elsődleges és több másodlagos projektje lehet;
- egy tartalomnak több verziója, feladata, eseménye, fájlja és publikációja lehet;
- egy feladatnak pontosan egy felelőse lehet;
- egy publikáció pontosan egy tartalomhoz és egy konkrét célfelülethez tartozik;
- egy publikáció több verziót és eredménymérést tartalmazhat;
- egy személynek több időszakos vagy egyedi megjelenési jogosultsága lehet;
- egy fájl több rekordhoz is kapcsolható, de mindig van tulajdonosa;
- az auditnapló minden rekordot stabil azonosítóval hivatkozik.

---

## 22. Kötelező automatizmusok

1. lejáró külső fiók automatikus lezárása és archiválása;
2. tartalom automatikus „Publikált” állapota a kötelező lenyomatok elkészültekor;
3. URL-pótlási feladat létrehozása 24 órás határidővel;
4. határidős értesítések;
5. késés és blokkolás szabályos kezelése;
6. esemény befejezése utáni automatikus „Megtörtént” állapot;
7. hét nap utáni értesítésarchiválás;
8. napi 08:00 összefoglaló;
9. napi, munkaidőn kívüli NAS-elérhetőségi ellenőrzés;
10. fájl-előnézet és SHA-256 készítése;
11. vírusellenőrzés és karantén;
12. publikációs lenyomat zárolása;
13. visszavont megjelenési jogosultság miatti jövőbeni publikációblokkolás;
14. havi vezetői hozzáférési összefoglaló;
15. automatikus mentés és szerkesztési zárolás feloldása 15 perc után.

---

## 23. Telepítéskor megadandó paraméterek

Ezek nem nyitott termékdöntések, hanem környezeti konfigurációk:

- éles domain;
- Supabase-projekt és EU-régió;
- NAS típusa, hálózati útvonala, hitelesítése és mentési felelőse;
- kimenő levelezési szolgáltatás és feladói cím;
- Google OAuth- és Calendar-hitelesítő adatok;
- PWA-push kulcsok;
- Rátgéber Akadémia logó, színek, betűtípusok és további arculati elemek;
- első aktiválókódok átadási módja;
- adatvédelmi/jogi felelős személye;
- induló importfájlok;
- pilot résztvevői;
- karbantartási és incidensértesítési kapcsolattartók.

---

## 24. Következő fejlesztési dokumentumok

E specifikáció alapján elkészítendő:

1. részletes relációs adatbázis-séma és mezőjegyzék;
2. Supabase RLS-jogosultsági szabályrendszer;
3. részletes állapotátmeneti táblák;
4. API- és szerveroldali műveletjegyzék;
5. képernyőnkénti funkcionális leírás és drótváz;
6. értesítési esemény–címzett mátrix;
7. teszteset- és elfogadásikritérium-katalógus;
8. fejlesztési ütemezés és MVP backlog;
9. Lovable/Codex fejlesztési masterprompt.

---

## 25. Lezárási nyilatkozat

A termékfunkciókra, szerepkörökre, fő jogosultságokra, munkafolyamatokra, fájl- és publikációkezelésre, megjelenési jogosultságokra, riportokra, biztonságra, üzemeltetésre és pilotelfogadásra vonatkozó MVP-döntések rendelkezésre állnak.

Az MVP döntési specifikációja lezárt. A fejlesztés előkészítése további üzleti döntés nélkül megkezdhető; a 23. pontban felsorolt telepítési paramétereket legkésőbb az érintett integráció beállításakor kell megadni.
