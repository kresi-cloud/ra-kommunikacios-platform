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

Feladatot a kommunikációs vezető, a projektgazda a saját projektjében, illetve önálló saját feladatként az aktív felhasználó hozhat létre. Feladatot a felelős, a projektgazda és a kommunikációs vezető a konkrét átmenet szabályai szerint módosíthat. A határidő- és felelősváltás célzott, tranzakciós RPC; indok, előzmény és audit nélkül nem írható. Eseményt ugyanez a kör kezelhet; a szerkesztési és lemondási műveleteket külön jogosultság-RPC alapján jeleníti meg a kliens, de a tényleges döntést minden esetben a szerver hozza meg. Meghívásra a résztvevő válaszolhat, a névadó helyett kizárólag a kommunikációs vezető járhat el.

A technikai admin feladatot, eseményt és résztvevői adatot sem olvashat. Az anonim szereptől minden érintett táblajog explicit vissza van vonva.

A saját manuális foglaltsági rekordot a felhasználó csak célzott RPC-vel hozhatja létre vagy vonhatja vissza. A tábla közvetlenül kizárólag a saját aktív rekordokat adja vissza; a csapatnézet biztonsági függvénye csak a felhasználó nevét és a foglalt időintervallumot szolgáltatja, indokot vagy külső naptári részletet nem.

## Kötelező teszthatárok

- anonim hozzáférés tiltott;
- idegen projekt nem szivároghat ki;
- technikai admin nem olvashat projektet;
- projektgazda csak megengedett átmenetet indíthat;
- kommunikációs vezető archiválhat és indoklással újranyithat.
- idegen projekt feladata és eseménye nem olvasható;
- közvetlen feladatírás tiltott, az elfogadás csak RPC-vel történhet;
- a résztvevői válasz és tényleges válaszadó megmarad.
- más felhasználó foglaltsági sora közvetlenül nem olvasható, a busy-only függvényből viszont az idősáv elérhető;
- közvetlen foglaltságírás tiltott.
- határidő-módosítás indok nélkül tiltott, indokkal append-only előzményt ír;
- feladatátadás új felelőst, új elfogadást és felelőselőzményt eredményez;
- idegen esemény módosítása tiltott, lényeges változás új választ kér, leírásváltozás megtartja a választ;
- meghívás utáni esemény nem törölhető, csak indoklással lemondható.
