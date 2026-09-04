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

Az implementált fő út: `draft → assigned → accepted → in_progress → completed`, review-köteles feladatnál `in_progress → in_review → completed`. A felelős kiosztáskor elfogadhat, pontosítást kérhet vagy akadályt jelezhet. Blokkolás és feloldás indokolt; feloldáskor új határidő vagy a régi explicit megerősítése szükséges. Határidő-változás append-only előzményt és auditot ír. A kommunikációs vezető indoklással nyithat vissza befejezett feladatot.

## Esemény

Az első szelet a `draft → scheduled` ütemezést, a belső résztvevő meghívását és az `accepted` / `declined` / `maybe` választ valósítja meg. Minden válasznál megmarad, hogy ténylegesen ki válaszolt. A lemondás, átütemezés, automatikus `occurred` állapot és archiválás a következő I1/B szelet része.

A tartalom- és review-állapotgépek a forrásspecifikációk szerint az I2-ben készülnek el.
