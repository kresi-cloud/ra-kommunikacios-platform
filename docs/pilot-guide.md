# Pilot útmutató

## Cél

A pilot az auth, a szerephatárok, a projektláthatóság, az első projektfolyamat és az alkalmazáson belüli értesítések valós működését ellenőrzi kis, kontrollált csoporttal.

## Előkészítés

- egy kommunikációs vezető, egy projektgazda, egy munkatárs és egy technikai admin tesztfiók;
- MFA a kötelezett szerepeknél;
- legalább két, eltérő tulajdonosú projekt;
- a háttérfeladatok ütemezése (pg_cron vagy külső ütemező) a runbook szerint;
- támogatási csatorna és adatvédelmi kapcsolattartó: `[CONFIGURE_ME]`.

## Elfogadási forgatókönyv

1. Meghívott felhasználó belép, nyilvános regisztráció nincs.
2. Projektgazda csak saját projektjét látja.
3. Kommunikációs vezető minden pilotprojektet lát.
4. Technikai admin projektadatot nem lát.
5. A projekt engedélyezett állapotváltása sikerül, tiltott váltása magyar hibát ad.
6. Kritikus blokk mellett lezárás nem lehetséges.
7. Mobil és asztali navigáció használható.
8. Feladat kiosztása után a felelős az Értesítések oldalon és a fejléc számlálóján látja az új feladatot; a kiosztó saját műveletéről nem kap értesítést.
9. Esemény időpontjának módosítása után a meghívott azonnali értesítést kap, és a válasza újra bekérésre kerül; 20:00 után keletkezett normál értesítésnél a felület a következő 08:00-as külső kézbesítést mutatja.
10. Az értesítési beállításokban a normál típus külső csatornája kikapcsolható, a kötelező típus nem.
11. Lejárt ütemezett esemény a következő háttérfutás után „Megtörtént” állapotba kerül.

A pilot alatt személyes vagy publikálandó éles tartalom csak külön jóváhagyással használható; az I2 előtti fájlfolyamat nem pilotképes. E-mail és push kézbesítés a pilotban még nem működik, az értesítés az alkalmazáson belül érhető el.
