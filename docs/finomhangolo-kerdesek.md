# Rátgéber Akadémia kommunikációs platform – finomhangoló kérdések

A `pte-aok-digitalis-szolgaltatasi-portal` projekt döntésnapló-mintáját
követve: a meglévő MVP-specifikáció (`docs/specifications/`) és a
megvalósított kód alapján összegyűjtött, még nyitott vagy csak részben
rögzített üzleti kérdések, körökbe rendezve. A cél, hogy a megrendelő
(kommunikációs vezető) körönként végigmenjen rajtuk, és a válaszokból –
az ÁOK-mintához hasonlóan – döntésnapló készüljön: kérdés → döntés →
következmény a megvalósításra.

**Állapot:** nyitott kérdések, még nincs válasz egyikre sem.
**Készült:** 2026-09-19.

---

## 1. kör – Projekt és szervezeti alapelvek

1. Egy projektnek pontosan egy gazdája lehet – mi történik, ha a gazda
   tartósan (pl. betegség, kilépés) nem elérhető? Kell-e ideiglenes
   projektgazda-átadás, vagy ez csak a kommunikációs vezető kézi
   beavatkozásával oldható meg?
2. A projekt „Lezárt” állapotba csak nyitott kritikus blokk nélkül
   kerülhet – ki dönti el, hogy egy blokk „kritikus”-e, és felülbírálhatja-e
   a kommunikációs vezető egyoldalúan a projektgazda blokk-jelzését?
3. A szezon (season) entitás csak kezdő/záró dátumot és nevet tárol –
   szükséges-e automatikus szezonváltás (pl. új szezon nyitása
   automatikusan zárja az előzőt), vagy ez mindig kézi adminisztrátori
   lépés?
4. Egy projekthez tetszőleges számú tag rendelhető – van-e felső korlát a
   tagok számára, és ki távolíthat el tagot (csak a gazda, vagy a
   kommunikációs vezető is)?
5. A projektcímke (tag) katalógus központi – ki hozhat létre új címkét:
   bármely munkatárs, vagy csak a kommunikációs vezető?
6. A projekt „Archivált” állapotból való visszaállítása indoklást igényel –
   van-e felső korlát arra, hányszor nyitható újra ugyanaz a projekt?
7. Több, egymással versengő projekt esetén (azonos határidő, azonos
   erőforrás) a platform nem kezel prioritást projektek között, csak
   feladatszinten – szükség van-e projektszintű prioritásjelzésre is?
8. A projekt „aktív kritikus blokk” definíciója jelenleg szabad szöveg –
   szükséges-e előre definiált blokk-ok katalógusa (pl. „jogi akadály”,
   „költségvetési akadály”), vagy marad szabad szöveges indoklás?
9. Egy tartalomnak egy elsődleges és több kapcsolódó projektje lehet – ha
   az elsődleges projekt lezárul, a tartalom automatikusan átkerül egy
   kapcsolódó projekt alá, vagy „gazdátlan” marad?
10. A projekt objective/summary mezők hossza korlátozott (2000 karakter) –
    szükséges-e strukturáltabb cél-meghatározás (pl. mérhető KPI-mezők),
    vagy elég a szabad szöveg?

## 2. kör – Tartalom és szerkesztési életciklus

11. Egy tartalomnak egyetlen közös szerkesztési életciklusa van, csatorna-
    változatok nélkül – mi történik, ha egy Facebook-posztot és egy
    sajtóközleményt lényegesen eltérő szöveggel kell megjelentetni
    ugyanabból a tartalomból? Két külön tartalom, vagy egy tartalom
    csatornánkénti szövegváltozattal?
12. Hány korábbi verziót tárol a rendszer egy tartalomhoz – van-e felső
    korlát, vagy a teljes szerkesztési előzmény korlátlanul megmarad?
13. A tartalom review-státusza „superseded” lehet új verzió mentésekor –
    a korábbi, felülírt review-döntés (pl. „elutasítva” indoklással)
    látható marad-e a felületen, vagy csak az auditban?
14. Ki jelölheti egy tartalmat „publikálásra kész”-nek: kizárólag a
    tartalomgazda, vagy a projektgazda is, ha eltér a tartalomgazdától?
15. A szerkesztési zárolás (edit_locks) 15 perc inaktivitás után lejár –
    ez az időtartam állítható legyen adminisztrátori szinten, vagy fix
    üzleti szabály marad?
16. A kommunikációs vezető indoklással feloldhatja mások zárolását – kap-e
    értesítést az, akinek a zárolását feloldották, mielőtt elveszítené a
    nem mentett szerkesztését?
17. Egy tartalomhoz több feladat is tartozhat (pl. írás, fotó, jóváhagyás) –
    ezek egymástól függetlenül haladnak, vagy van-e sorrendi függőség
    (pl. a jóváhagyási feladat csak az írási feladat lezárása után
    nyitható)?
18. A tartalom „visszavonása” (withdrawn) után újranyitható-e, vagy ez
    végleges állapot, és csak új tartalom hozható létre helyette?
19. Van-e kötelező szómennyiség- vagy hosszkorlát a tartalom típusonként
    (pl. sajtóközlemény vs. közösségimédia-poszt), amit a rendszer
    validál, vagy ez teljesen szabad?
20. A tartalom-előzmény (ki mikor mit módosított) meddig őrzendő meg –
    van-e eltérő megőrzési idő a tartalomhoz és a hozzá tartozó audithoz
    képest?

## 3. kör – Feladatok és felelősség

21. A feladat kritikus prioritásához indoklás kell – van-e felső korlát
    arra, hány kritikus feladat lehet egyszerre nyitva egy felelősnél,
    mielőtt a rendszer figyelmeztet a túlterhelésre?
22. A feladatátadás új felelősi elfogadást igényel – mi történik, ha az
    új felelős elutasítja az átadást (pontosítást kér vagy visszautasítja)?
    Van-e ilyen út, vagy az átadás mindig végleges a kezdeményező oldaláról?
23. A blokkolt feladat feloldásakor új határidő vagy a régi megerősítése
    szükséges – ki jogosult megerősíteni a régi határidőt, ha az már
    lejárt: csak a kommunikációs vezető, vagy a projektgazda is?
24. A feladat „Visszavont” állapota indoklást igényel – a visszavont
    feladathoz tartozó, már elkészült munka (pl. csatolt fájl) mi lesz:
    törlődik, vagy megmarad archívumként?
25. Egy feladatnak legfeljebb egy felelőse lehet – hogyan kezeli a
    rendszer azt az esetet, amikor a munkát ténylegesen ketten végzik
    (pl. társszerzőség)? Két külön, egymáshoz kapcsolt feladat az egyetlen
    út, vagy szükséges „közreműködő” mező is?
26. A review-köteles feladatnál a felülvizsgáló egy konkrét személy –
    mi történik, ha a kijelölt felülvizsgáló hosszabb távollét miatt nem
    elérhető? Automatikus másodfelügyelő, vagy kézi átjelölés szükséges?
27. A feladat határideje munkanapban vagy naptári napban értendő a
    figyelmeztetések (24/2 órás) szempontjából, és hogyan viselkedik ez
    hétvégén/munkaszüneti napon létrehozott, rövid határidejű feladatnál?
28. A „publikációs feladat” határidő nélkül nem indítható – mi történik,
    ha a hozzá tartozó tartalom publikálási dátuma menet közben módosul?
    A feladat határideje automatikusan követi, vagy kézi frissítést igényel?
29. Van-e sablon (előre definiált feladatlista) egy adott tartalomtípushoz
    vagy eseménytípushoz, amit a rendszer automatikusan felkínál
    létrehozáskor, vagy minden feladatot kézzel kell felvenni?
30. A feladat „Archivált” állapotba kerülés után kereshető marad-e teljes
    szöveggel, vagy csak azonosító/cím alapján?

## 4. kör – Események és naptár

31. A kötelező részvételű esemény elutasítása azonnali értesítést vált ki
    a felelősnek – van-e ezen felül eszkaláció a kommunikációs vezető felé,
    ha a Névadó utasítja el a kötelező eseményt?
32. Az esemény időpontütközése csak figyelmeztet, nem tiltja a mentést –
    van-e olyan eseménytípus (pl. sajtóesemény a Névadóval), ahol az
    ütközés kemény tiltás legyen felülbírálási lehetőség nélkül?
33. Az esemény „Megtörtént” állapotba automatikusan kerül a végidőpont
    elteltével – mi van, ha az esemény ténylegesen elmaradt, de senki nem
    módosítja utólag az „Elmaradt” kimenetre? Van-e ezt ellenőrző
    emlékeztető?
34. Az „Átütemezett” esemény új időpontot kap – megmarad-e a régi
    időponthoz tartozó összes korábbi válasz és résztvevő-lista, vagy
    mindenki újra válaszol?
35. A privacy-safe csapatfoglaltság csak nevet és foglalt időt mutat – ez
    a szabály minden szerepkörre egyformán vonatkozik, vagy a
    kommunikációs vezető lásson részletesebb (pl. esemény típusa) adatot?
36. A Google Calendar-szinkronból csak a foglaltság kerül át, cím és
    leírás nélkül – mi történik, ha a felhasználó ugyanarra az időpontra
    kézzel is rögzít foglaltságot? Duplikáció-e, vagy összevonja a
    rendszer?
37. Az esemény résztvevői lehetnek külső (nem rendszerfelhasználó) személyek
    is – ők hogyan válaszolnak a meghívásra: külön, bejelentkezés nélküli
    linkkel, vagy csak a rendszeren belüli felhasználó rögzítheti helyettük
    a választ?
38. Van-e ismétlődő esemény (pl. heti sajtótájékoztató) az MVP-ben, vagy
    minden előfordulást külön kell létrehozni – ha az utóbbi, mennyire
    fájdalmas ez sok visszatérő eseménynél, és megéri-e egy „sablonból
    létrehozás” gyorsgomb?
39. A sajtóesemény típusú esemény résztvevői közt szerepelhetnek külső
    sajtó-kapcsolattartók – az ő elérhetőségük hol tárolódik: a rendszer
    saját kapcsolattartó-katalógusában, vagy minden alkalommal kézzel
    kell beírni?
40. Az esemény lemondása után a résztvevők azonnali értesítést kapnak –
    szükséges-e ezen felül a lemondás okának kategorizálása (pl. időjárás,
    betegség, szervezési ok) statisztikai célból?

## 5. kör – Publikáció és lenyomat

41. Egy tartalom publikálása minden kötelező célfelületen teljesülve
    váltja a tartalmat „Publikált” állapotba – mi történik, ha egy
    kötelező célfelület véglegesen elérhetetlenné válik (pl. megszűnik
    egy közösségimédia-fiók)? Ki törölheti a kötelezettséget?
42. A publikációs URL hiányában 24 órás pótlási feladat jön létre – mi
    történik, ha 24 óra után sincs pótolva? Van-e második eszkaláció,
    vagy a feladat egyszerűen lejárt marad?
43. A publikációs lenyomat változtathatatlan – ha egy publikációt utólag
    helyesbíteni kell (elgépelés, téves adat), a helyesbítés hány
    alkalommal végezhető el, és látszik-e a helyesbítések teljes
    története valakinek a felületén?
44. Egy Facebook-poszt két oldalon két külön publikációs rekordot jelent –
    ha az egyik oldalon törlik a posztot, a másik publikáció státusza
    ettől függetlenül „Aktív” marad – ki ellenőrzi rendszeresen, hogy egy
    „Aktív” publikáció ténylegesen még elérhető-e (`externally_removed`
    állapot)?
45. A publikáció célfelülete szabad szöveg vagy előre definiált katalógus
    (pl. Facebook, Instagram, weboldal, nyomtatott sajtó)? Ha katalógus,
    ki bővítheti új célfelülettel?
46. Van-e különbség a belső (intranet, hírlevél) és külső (nyilvános
    közösségi média) publikáció kezelésében a jóváhagyási szigor
    szempontjából?
47. A publikációs lenyomatban tárolt bélyegkép mérete/formátuma
    korlátozott-e, és ki fér hozzá a lenyomat teljes (nem nyilvános)
    tartalmához utólag – csak a kommunikációs vezető, vagy bárki, akinek
    hozzáférése volt az eredeti projekthez?
48. A publikáció „meghiúsult” vagy „elmaradt” esete nem szerepel expliciten
    a specifikációban – ha egy tervezett publikáció végül soha nem
    valósul meg, ez hogyan zárul le adminisztratívan (a hozzá tartozó
    feladat visszavonásán túl)?
49. Szükséges-e a publikációkhoz utólagos teljesítménymérés (elérés,
    interakció) rögzítése az MVP-ben, vagy ez később, külön riportmodulban
    kerül be?
50. Ha egy tartalmat több nyelven is publikálnak, ez egy tartalom több
    publikációs lenyomattal, vagy külön-külön tartalom nyelvenként?

## 6. kör – Megjelenési jogosultság és adatvédelem

51. A megjelenési jogosultság időben és felhasználási körben korlátozott –
    lejárat előtt mennyi idővel kap emlékeztetőt az érintett és/vagy a
    kommunikációs vezető?
52. A kiskorú sportolók megjelenési jogosultságához szülői/gondviselői
    hozzájárulás szükséges – ez a rendszerben külön, granuláris
    jelölőnégyzetekkel (pl. külön a közösségi médiára, külön a sajtóra)
    valósul meg, vagy egyetlen összevont „hozzájárulok” mezővel?
53. A jogosultság visszavonása után a már megjelent (korábbi) publikációk
    listája „intézkedési listára” kerül – ki felelős azért, hogy ezekből
    ténylegesen eltávolítsák a tartalmat, és mennyi idő áll rendelkezésre?
54. Az elektronikus nyilatkozatkérés linkje 7 nap után lejár – az érintett
    kaphat-e meghosszabbítást, vagy ilyenkor mindig új linket kell
    generálni?
55. A Névadó (Rátgéber László) esetében ki adhat helyette megjelenési
    jogosultság-nyilatkozatot, ha ő maga nem elérhető – csak a
    kommunikációs vezető, vagy van kijelölt állandó meghatalmazott is?
56. Az adatvédelmi ügyrekordhoz (privacy_case) van-e kötelező zárási
    határidő (pl. GDPR 30 napos válaszadási kötelezettség mintájára), és
    ki figyeli ennek betartását?
57. A külső közreműködő fiókjának lejárta után mi történik az általa
    korábban feltöltött, még fel nem használt fájlokkal és a hozzá kötött
    megjelenési jogosultság-dokumentumokkal?
58. A sajtócímzettek (külső médiakapcsolatok) adatai kizárólag a
    „Sajtócímzettek részletei” jogosultsággal rendelkezők számára
    láthatók – ez a jogosultság projektenként eltérően is adható, vagy
    csak globálisan?
59. Van-e a rendszerben automatikus jelzés arra, ha egy tartalomhoz olyan
    személy kapcsolódik, akinek nincs érvényes megjelenési jogosultsága
    (a specifikáció szerint ez blokkolja a publikálást) – ez a jelzés a
    tartalom létrehozásakor vagy csak a publikálás megkísérlésekor
    jelenik meg?
60. A biometrikus azonosításra is alkalmas fotók/videók kezelésénél
    szükséges-e külön jelölés vagy fokozott védelem a rendszerben az
    egyéb képanyaghoz képest?

## 7. kör – Értesítések és automatizmusok

61. A kritikus értesítés nem kapcsolható ki – van-e olyan eset (pl.
    szabadság, betegszabadság), amikor a felhasználó ideiglenesen mégis
    szüneteltetheti a kritikus push-értesítéseket anélkül, hogy a
    delegációt be kellene állítania?
62. A napi 08:00-as összefoglaló csak akkor készül, ha van releváns
    tartalom – ki dönti el pontosan, mi számít „relevánsnak” egy adott
    felhasználó szempontjából, ha több projektben is érintett?
63. Az értesítések csoportosítása (group_key) 20 perces ablakban vonja
    össze a nem sürgős eseményeket – ez az időablak testre szabható-e
    felhasználónként, vagy fix rendszerparaméter?
64. A technikai admin tartalommegnyitása előtt figyelmeztetés jelenik meg,
    és a kommunikációs vezető azonnal értesül – van-e olyan eset, amikor
    a technikai admin sürgősségi (pl. adatvesztés-helyreállítás) hozzáférést
    igényel, mielőtt bárki jóváhagyná?
65. A háttérfolyamat harmadik sikertelen próbálkozása után technikai
    hibajegy készül – ki kapja meg ezt a hibajegyet elsőként, és van-e
    SLA a technikai csapat válaszidejére?
66. A NAS-elérhetőség napi ellenőrzése (02:00-kor) csak állapotváltozásnál
    értesít – ha a NAS napokig elérhetetlen, kap-e a rendszer valamiféle
    „még mindig lent van” emlékeztetőt, vagy csak az első és az utolsó
    állapotváltozásnál értesít?
67. A meghívó token lejárata után a kezdeményező napi összefoglalóban
    értesül – szükséges-e ennél sürgősebb (azonnali) jelzés, ha egy
    kiemelt szerepkörre (pl. új projektgazda) szóló meghívó jár le
    felhasználatlanul?
68. Van-e felhasználói szintű „ne zavarj” időszak (pl. szabadság alatt),
    ami minden normál értesítést felfüggeszt, a delegációtól függetlenül?
69. A késedelmes feladatnál a kommunikációs vezető csak kritikus
    prioritásnál értesül azonnal – normál prioritású, de sokadszor
    csúszó feladatnál van-e valamilyen „ismétlődő késés” eszkalációs
    szabály?
70. Az automatizmusok idempotenciakulcsa (job_key) hogyan viselkedik
    időzóna-váltáskor (téli/nyári időszámítás) a határidő-számításoknál –
    van-e erre külön elfogadási teszt a jelenlegi terven túl?

## 8. kör – Fájlok, verziók, tárolás

71. A hibrid Supabase–NAS fájlkezelésnél melyik fájltípusok/méretek
    tárolódnak a Supabase-en és melyek a NAS-on – van-e fix méretküszöb,
    ami eldönti?
72. A fertőzött fájl izolálása után ki dönthet a végleges törlésről: csak
    a technikai admin, vagy a feltöltő is kérheti a törlést indoklással?
73. A törölt munkapéldány 30 nap után fizikailag törlődik – ez az
    időtartam minden fájltípusra egyforma, vagy vannak kategóriák (pl.
    jogi dokumentum), amelyeknél hosszabb a megőrzés?
74. Egy fájlnak hány verziója tárolható – van-e felső korlát, vagy csak a
    tárhely szab határt?
75. A fájl végleges verziójának megjelölése (mark_file_version_final)
    után módosítható-e még az adott verzió, vagy attól kezdve csak új
    verzió indítható?
76. A privát storage bucketekhez signed URL szükséges – ez az URL mennyi
    ideig érvényes, és mi történik, ha valaki megosztja a linket
    illetéktelennel (van-e ez elleni technikai védelem az idő- és
    IP-korláton túl)?
77. A NAS-referenciájú fájl elérhetetlensége esetén a rendszer „Hiányzik”
    állapotot mutat – ez az állapot automatikusan visszaáll-e, amint a
    NAS újra elérhető, vagy kézi megerősítést igényel?
78. Van-e a rendszerben duplikátum-ellenőrzés feltöltéskor (ugyanaz a
    fájl véletlen kétszer kerül fel), vagy ez a felhasználó felelőssége?
79. A fájlelőnézet-generálás mely fájltípusokra terjed ki (kép, videó,
    PDF, Office-dokumentum) – videónál kell-e mozgóképes előnézet, vagy
    elég egy állókép?
80. Az import (CSV/XLSX) hibás sorainak listája megjelenik az
    importálónak – a hibás sorok javítva újra feltölthetők-e ugyanabba a
    munkamenetbe, vagy mindig új importot kell indítani?

## 9. kör – Szerepek, jogosultság, adminisztráció, delegáció

81. A `delegations` tábla (helyettesítés) létezik az adatmodellben, de a
    hozzá tartozó RPC-k (létrehozás, visszavonás) még nem valósultak meg
    egyik háttérrendszerben sem – a helyettesítés lánc formában is
    engedélyezett (A delegál B-nek, B delegál C-nek), vagy csak egy
    szintű lehet?
82. Van-e maximális időtartama egy delegációnak, vagy tetszőlegesen hosszú
    időszakra beállítható?
83. A technikai admin nem férhet hozzá kommunikációs tartalomhoz – de a
    saját fiókját (jelszó, MFA) ki kezelheti, ha ő maga nem jogosult a
    profiladatok teljes köréhez hozzáférni?
84. Az egyedi jogosultság-kiosztás (`user_permission_grants`) és a
    szerepkör-alapú jogosultság ütközése esetén melyik élvez elsőbbséget,
    ha ellentmondanak egymásnak?
85. A kötelező MFA (`roles.requiresMfa`) jelenleg csak adatmezőként
    létezik, technikailag sehol nincs kikényszerítve – ha ez élesedik,
    van-e átmeneti türelmi idő azoknak a felhasználóknak, akik még nem
    állították be az MFA-t?
86. Az „Adatvédelmi/jogi felelős” szerepkör és a „Kommunikációs vezető”
    szerepkör hatásköre hol válik el élesen egy adatvédelmi incidens
    esetén – ki az elsődleges döntéshozó?
87. Egy felhasználónak több szerepköre is lehet egyszerre – van-e olyan
    szerepkör-kombináció, amit a rendszernek kifejezetten tiltania kell
    (pl. ugyanaz a személy nem lehet egyszerre Technikai admin és
    Projektgazda)?
88. A meghívásos felhasználó-regisztrációnál ki hagyhatja jóvá az
    approved_role_payload tartalmát – csak a meghívást kezdeményező, vagy
    egy második jóváhagyó is szükséges kiemelt szerepkörnél?
89. Az „Külső közreműködő” szerepkör `external_expires_at` mezője kötelező –
    van-e automatikus meghosszabbítási kérelem-folyamat lejárat előtt, vagy
    mindig új meghívást kell kiállítani?
90. A vezetői hozzáférési összefoglaló (havi, a technikai admin
    támogatási megnyitásairól) kizárólag a kommunikációs vezetőnek készül –
    szükséges-e ennek másolatot kapnia az adatvédelmi/jogi felelősnek is?

## 10. kör – Riportok, export, biztonság, támogatás

91. A riport-exportok (`report_exports`) meddig tárolódnak, mielőtt a
    `retention_until` alapján törlődnek – ez a felhasználó által
    állítható, vagy fix rendszerparaméter?
92. A vezetői riport projektenkénti szűrése mely szerepköröknek elérhető –
    csak a kommunikációs vezetőnek teljes körűen, vagy a projektgazda is
    lekérheti a saját projektjére szűkítve?
93. A publikációs riportok tartalmazzák-e a külső (harmadik fél)
    statisztikákat (pl. közösségimédia-elérés), vagy kizárólag a
    rendszeren belüli adatokra (létrehozás, jóváhagyás, publikálás
    időpontja) szorítkoznak az MVP-ben?
94. Az öt sikertelen bejelentkezési kísérlet után fokozatos késleltetés és
    értesítés lép életbe – ezután a fiók automatikusan zárolódik, vagy
    csak lassítja a rendszer a további próbálkozásokat?
95. A hibajegyek (support) kritikus prioritásához van-e célzott
    válaszidő (SLA), amit a rendszer figyel és jelez, ha túllépik?
96. Az érzékeny hibajegy-melléklethez való hozzáférés külön jogosultsághoz
    kötött – ki adhatja meg ezt a jogosultságot eseti alapon, ha a
    hibajegy sürgős, de az igénylőnek még nincs ilyen jogosultsága?
97. A negyedéves visszaállítási próba (disaster recovery teszt) eredményét
    ki dokumentálja, és hol – a rendszeren belüli auditban, vagy csak
    külső üzemeltetési dokumentumban?
98. Biztonsági incidens esetén a runbook szerint a kiadás és az érintett
    fiók felfüggesztendő – ki jogosult ezt a döntést meghozni valós
    időben, ha a kommunikációs vezető éppen nem elérhető?
99. A kulcsrotáció szükségessége esetén (titokgyanú) van-e automatikus
    riasztás a technikai admin felé, vagy ez mindig emberi felismerésen
    (pl. gyanús naplóbejegyzés észlelésén) múlik?
100. Az auditnapló (`audit_log`) megőrzési ideje nincs explicit módon
     rögzítve a specifikációban – meddig kell megőrizni jogi/megfelelőségi
     okból, és ezután anonimizálható, vagy véglegesen törlendő?

---

## Következő lépés

Az ÁOK-mintát követve javasolt körönként (10 kérdés/kör) végigmenni a
listán a kommunikációs vezetővel, és minden megválaszolt kérdéshez
rögzíteni: a döntést, valamint a megvalósításra gyakorolt következményt –
ugyanúgy, ahogy a `pte-aok-digitalis-szolgaltatasi-portal` projekt
`docs/folyamat-dontesek.md` fájlja teszi. A RA platformnál ez a napló
`docs/finomhangolo-dontesek.md` néven jönne létre, amint az első válaszok
megérkeznek.
