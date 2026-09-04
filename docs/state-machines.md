# Állapotgépek

## Projekt

| Forrás | Cél | Feltétel |
|---|---|---|
| `draft` | `active` | Projektgazda vagy kommunikációs vezető |
| `active` | `closed` | Nincs feloldatlan kritikus blokk |
| `closed` | `archived` | Csak kommunikációs vezető |
| `closed` vagy `archived` | `active` | Csak kommunikációs vezető, kötelező indoklással |

Az azonos állapotra váltás és minden más átmenet tiltott. A váltás tranzakcióban zárolja a projektet, frissíti a lezárási/archiválási metaadatokat és auditbejegyzést készít.

A feladat-, esemény-, tartalom- és review-állapotgépek a forrásspecifikációkban rögzítettek, implementációjuk a következő inkrementumok része.

