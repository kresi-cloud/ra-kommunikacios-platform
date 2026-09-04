# Állapotgépek

## Projekt

| Forrás | Cél | Feltétel |
|---|---|---|
| `draft` | `active` | Projektgazda vagy kommunikációs vezető |
| `active` | `closed` | Nincs feloldatlan kritikus blokk |
| `closed` | `archived` | Csak kommunikációs vezető |
| `closed` vagy `archived` | `active` | Csak kommunikációs vezető, kötelező indoklással |

Az azonos állapotra váltás és minden más átmenet tiltott. A váltás tranzakcióban zárolja a projektet, frissíti a lezárási/archiválási metaadatokat és auditbejegyzést készít.

## Feladat

Az implementált fő út: `draft → assigned → accepted → in_progress → completed`, review-köteles feladatnál `in_progress → in_review → completed`. A felelős kiosztáskor elfogadhat, pontosítást kérhet vagy akadályt jelezhet. Blokkolás és feloldás indokolt; feloldáskor új határidő vagy a régi explicit megerősítése szükséges. Határidő-változás kötelező indokkal append-only előzményt és auditot ír. Átadáskor a korábbi felelős megmarad az előzményben, a feladat `assigned` állapotba és `pending` elfogadásra kerül. A Kanban csak a felelős számára és kizárólag a szerveroldalon is engedélyezett átmeneteket kínálja.

## Esemény

Az eseményfolyam a `draft → scheduled` ütemezést, a belső résztvevő meghívását, az `accepted` / `declined` / `maybe` választ, az ütemezett esemény szerkesztését és indokolt lemondását valósítja meg. Időpont, helyszín/online elérés vagy kötelező részvétel változása az összes válaszköteles résztvevőt `pending` állapotba állítja, míg a csak leírást érintő módosítás megtartja a válaszokat. Az időpontütközés figyelmeztet, de megerősítéssel menthető. Az automatikus `occurred` állapot és archiválás az I1/B3 része.

A tartalom- és review-állapotgépek a forrásspecifikációk szerint az I2-ben készülnek el.
