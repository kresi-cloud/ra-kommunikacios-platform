# Jogosultságok és RLS

## Alapelv

Minden üzleti tábla RLS-kényszer alatt áll. A kliensoldali láthatóság nem biztonsági kontroll. Az aktív felhasználói státusz, a tagság, a szerep és a scope együtt ad hozzáférést.

## Jelenlegi szerepek

| Szerep | Projekt-hozzáférés |
|---|---|
| Kommunikációs vezető | Minden nem törölt projekt |
| Projektgazda | Saját projekt, illetve explicit projekt-scope |
| Projekt tagja | Az a projekt, amelyben aktív tag |
| Technikai admin | Nincs normál kommunikációs tartalom-hozzáférés |
| Névadó és további szerepek | A későbbi modulokhoz előkészítve |

Projektet kommunikációs vezető vagy `create_project` engedéllyel rendelkező aktív felhasználó hozhat létre, de technikai admin nem. Közvetlen kliensoldali insert/update/delete nincs; a létrehozás és állapotváltás auditált RPC.

Feladatot a kommunikációs vezető, a projektgazda a saját projektjében, illetve önálló saját feladatként az aktív felhasználó hozhat létre. Feladatot a felelős, a projektgazda és a kommunikációs vezető a konkrét átmenet szabályai szerint módosíthat. Eseményt ugyanez a kör kezelhet; meghívásra a résztvevő válaszolhat, a névadó helyett kizárólag a kommunikációs vezető járhat el.

A technikai admin feladatot, eseményt és résztvevői adatot sem olvashat. Az anonim szereptől minden érintett táblajog explicit vissza van vonva.

## Kötelező teszthatárok

- anonim hozzáférés tiltott;
- idegen projekt nem szivároghat ki;
- technikai admin nem olvashat projektet;
- projektgazda csak megengedett átmenetet indíthat;
- kommunikációs vezető archiválhat és indoklással újranyithat.
- idegen projekt feladata és eseménye nem olvasható;
- közvetlen feladatírás tiltott, az elfogadás csak RPC-vel történhet;
- a résztvevői válasz és tényleges válaszadó megmarad.
