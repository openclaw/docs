---
doc-schema-version: 1
read_when:
    - Je wilt dat OpenClaw gedurende een lange sessie één doel voor ogen houdt
    - Je moet een sessiedoel pauzeren, hervatten, blokkeren, voltooien of wissen
    - U wilt de tools get_goal, create_goal en update_goal begrijpen
    - Je wilt zien hoe doelen in de TUI worden weergegeven
summary: 'Sessiedoelen: duurzame doelstellingen per sessie, `/goal`-bediening, modeltools voor doelen, tokenbudgetten en TUI-status'
title: Doel
x-i18n:
    generated_at: "2026-07-12T09:29:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# Doel

Een **doel** is één duurzame doelstelling die aan de huidige OpenClaw-sessie is gekoppeld.
Het geeft de agent en de operator een gezamenlijk richtpunt voor langdurige werkzaamheden,
zonder dat richtpunt om te zetten in een achtergrondtaak, herinnering, Cron-taak of
vaste opdracht.

Doelen zijn sessiestatus: ze bewegen mee met de sessiesleutel, blijven behouden na het
herstarten van processen en verschijnen in `/goal`, de doeltools voor het model en de
voettekst van de TUI.

## Snel aan de slag

```text
/goal start get CI green for PR 87469 and push the fix
/goal
/goal edit get CI green for PR 87469, push the fix, and update docs
/goal pause waiting for CI
/goal resume
/goal complete pushed and verified
/goal clear
```

`start` is optioneel: `/goal get CI green for PR 87469` maakt ook een doel aan,
omdat alle tekst na `/goal` die geen bekend actiewoord is, als een nieuwe
doelstelling wordt behandeld.

## Waarvoor doelen dienen

Gebruik een doel wanneer een sessie een concreet resultaat heeft dat gedurende
vele beurten zichtbaar moet blijven:

- Een PR afronden: corrigeren, verifiëren, automatisch beoordelen, pushen en de PR openen of bijwerken.
- Een foutopsporingsronde: de fout reproduceren, het verantwoordelijke onderdeel identificeren, corrigeren en
  de oplossing aantonen.
- Een documentatieronde: de relevante documentatie lezen, de nieuwe pagina schrijven, kruisverwijzingen toevoegen en
  de documentatiebuild verifiëren.
- Een onderhoudstaak: de huidige status inspecteren, afgebakende wijzigingen aanbrengen, de
  juiste controles uitvoeren en rapporteren wat er is gewijzigd.

Een doel is geen takenwachtrij. Gebruik [TaskFlow](/nl/automation/taskflow),
[taken](/nl/automation/tasks), [Cron-taken](/nl/automation/cron-jobs) of
[vaste opdrachten](/nl/automation/standing-orders) wanneer werkzaamheden losgekoppeld moeten worden uitgevoerd,
volgens een planning moeten worden herhaald, moeten worden opgesplitst in beheerde subtaken of als beleid moeten blijven gelden.

## Opdrachtenoverzicht

`/goal` zonder argumenten toont de samenvatting van het huidige doel:

```text
Doel
Status: actief
Doelstelling: CI voor PR 87469 succesvol maken en de correctie pushen
Gebruikte tokens: 12k
Tokenbudget: 12k/50k

Opdrachten: /goal edit <doelstelling>, /goal pause, /goal complete, /goal clear
```

| Opdracht                                            | Effect                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| `/goal` of `/goal status`                           | Toon het huidige doel.                                                      |
| `/goal start <objective>`                           | Maak een nieuw doel voor de huidige sessie.                                 |
| `/goal set <objective>`, `/goal create <objective>` | Aliassen voor `start`.                                                      |
| `/goal <objective>`                                 | Maakt ook een nieuw doel aan (alle tekst die geen herkend actiewoord is).    |
| `/goal edit <objective>`                            | Herformuleer de huidige doelstelling; de status en tokenregistratie blijven behouden. |
| `/goal pause [note]`                                | Pauzeer een actief doel.                                                     |
| `/goal resume [note]`                               | Hervat een gepauzeerd, geblokkeerd, gebruiksbeperkt of budgetbeperkt doel.   |
| `/goal complete [note]`                             | Markeer het doel als bereikt.                                               |
| `/goal done [note]`                                 | Alias voor `complete`.                                                       |
| `/goal block [note]`                                | Markeer het doel als geblokkeerd.                                           |
| `/goal blocked [note]`                              | Alias voor `block`.                                                          |
| `/goal clear`                                       | Verwijder het doel uit de sessie.                                           |

Er kan slechts één doel tegelijk in een sessie bestaan. Het starten van een
tweede doel mislukt met `Goal error: goal already exists` totdat het huidige doel
is gewist.

`/goal start` accepteert geen vlag voor het tokenbudget; een budget kan alleen worden ingesteld
via de modeltool `create_goal`.

## Statussen

- `active`: de sessie streeft het doel na.
- `paused`: de operator heeft het doel gepauzeerd; `/goal resume` maakt het weer
  actief.
- `blocked`: de agent of operator heeft een echte blokkade gemeld; `/goal resume`
  maakt het weer actief wanneer nieuwe informatie of een nieuwe status beschikbaar is.
- `budget_limited`: het geconfigureerde tokenbudget is bereikt; `/goal resume`
  hervat het nastreven van dezelfde doelstelling met een nieuw budgetvenster.
- `usage_limited`: gereserveerd voor een toekomstige stopstatus wegens een gebruikslimiet; `/goal
resume` hervat het nastreven van het doel op dezelfde manier.
- `complete`: het doel is bereikt. Voltooide doelen zijn definitief; gebruik `/goal
clear` voordat u een ander doel start.

`/new` en `/reset` wissen het huidige sessiedoel, omdat ze bewust met een
nieuwe sessiecontext beginnen.

## Tokenbudgetten

Doelen kunnen een optioneel positief tokenbudget hebben, ingesteld via de
parameter `token_budget` van de tool `create_goal`. Het budget wordt gemeten vanaf het
actuele aantal tokens van de sessie op het moment dat het doel wordt aangemaakt. Als de sessie bij
aanvang van het doel alleen een verouderde of onbekende tokenmomentopname heeft, wacht OpenClaw op de
volgende actuele momentopname en gebruikt die als uitgangspunt, zodat tokens die zijn verbruikt voordat het
doel bestond niet eraan worden toegerekend.

Wanneer het gebruik het budget bereikt, krijgt het doel de status `budget_limited`. Hierdoor wordt
het doel niet verwijderd en de doelstelling niet gewist; het geeft de operator en de
agent aan dat het doel niet langer actief wordt nagestreefd totdat het wordt hervat of
gewist. Bij hervatten begint een nieuw budgetvenster vanaf het huidige actuele
aantal tokens.

Tokenbudgetten zijn een vangrail voor sessiedoelen, geen factureringslimiet. Providerquota,
kostenrapportage en gedrag van het contextvenster blijven de normale
gebruiks- en modelinstellingen van OpenClaw volgen.

## Modeltools

OpenClaw stelt drie doeltools beschikbaar aan agentharnassen:

| Tool          | Doel                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `get_goal`    | Lees het huidige sessiedoel: status, doelstelling, tokengebruik en tokenbudget.                                             |
| `create_goal` | Maak alleen een doel aan wanneer de gebruiker of systeeminstructies daar expliciet om vragen. Mislukt als de sessie al een doel heeft. |
| `update_goal` | Markeer het doel als `complete` of `blocked`.                                                                               |

Het model kan een doel niet stilzwijgend pauzeren, hervatten, wissen of vervangen. Dit blijven
bedieningselementen voor de operator en sessie via `/goal` en resetopdrachten, zodat de agent
kan melden dat het doel is bereikt of dat er een echte blokkade is zonder ongemerkt het
richtpunt te verplaatsen.

`update_goal` mag een doel alleen als `complete` markeren wanneer de doelstelling
daadwerkelijk is bereikt. Het mag een doel alleen als `blocked` markeren nadat dezelfde
blokkerende omstandigheid gedurende ten minste drie opeenvolgende doelbeurten terugkeert, niet bij
gewone moeilijkheden of ontbrekende afwerking.

## Doelcontext bij elke beurt

Elke gebruikers-/chatbeurt met een actief doel bevat deze contextregel met gebruikersrol:

```text
Actief doel: <doelstelling> — werk eraan verder of werk de status bij (get_goal/update_goal).
```

OpenClaw houdt de regel compact door lange doelstellingen af te kappen. Gepauzeerde,
geblokkeerde, budgetbeperkte, gebruiksbeperkte en voltooide doelen worden niet ingevoegd,
zodat een stop door de operator van kracht blijft totdat het doel wordt hervat.

## Bedieningsinterface

De webgebaseerde bedieningsinterface toont het doel als een compacte capsule boven het invoerveld voor de chat:
een statuspictogram, het statuslabel (bijvoorbeeld `Doel wordt nagestreefd`), de afgekorte
doelstelling en een live timer voor de verstreken tijd.

De capsule bevat bedieningselementen:

- **Potlood** vult het invoerveld vooraf met `/goal edit <objective>`, zodat de
  doelstelling kan worden geherformuleerd en verzonden.
- **Pauzeren / hervatten** schakelt op basis van de huidige status tussen `/goal pause` en `/goal resume`.
- **Prullenbak** verzendt `/goal clear`.
- **Chevron** vouwt de capsule uit om de volledige doelstelling, de nieuwste statusnotitie,
  het tokengebruik en de verstreken tijd weer te geven.

De actieknoppen zijn verborgen zolang het invoerveld niet kan verzenden (bijvoorbeeld
wanneer de verbinding met de Gateway is verbroken); de chevron voor uitvouwen blijft werken.

## TUI

De voettekst van de TUI houdt het doel van de actieve sessie zichtbaar naast de velden voor de agent,
sessie en het model, vóór de indicatoren voor tokens en modus.

Voorbeelden van voetteksten:

- `Doel wordt nagestreefd (12k/50k)` voor een actief doel met een tokenbudget.
- `Doel gepauzeerd (/goal resume)` voor een gepauzeerd doel.
- `Doel geblokkeerd (/goal resume)` voor een geblokkeerd doel.
- `Doel heeft gebruikslimieten bereikt (/goal resume)` voor een gebruiksbeperkt doel.
- `Doel niet bereikt (50k/50k)` voor een budgetbeperkt doel.
- `Doel bereikt (42k)` voor een voltooid doel.

De voettekst is bewust compact. Gebruik `/goal` voor de volledige doelstelling,
notitie, het tokenbudget en de beschikbare opdrachten.

## Kanaalgedrag

`/goal` werkt in OpenClaw-sessies die opdrachten ondersteunen, waaronder de TUI en
chatinterfaces die tekstopdrachten toestaan. De doelstatus is gekoppeld aan de
sessiesleutel, niet aan het transport, zodat twee interfaces die een sessiesleutel delen hetzelfde
doel zien.

De doelstatus is geen afleveringsinstructie: deze dwingt geen antwoorden via een
kanaal af, wijzigt het wachtrijgedrag niet, keurt geen tools goed en plant geen werkzaamheden.

## Problemen oplossen

| Bericht                                | Betekenis                                                                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | De sessie heeft al een doel. Gebruik `/goal` om het te bekijken, `/goal complete` als het klaar is of `/goal clear` voordat u een andere doelstelling start. |
| `Goal error: goal not found`           | De sessie heeft nog geen doel. Start er een met `/goal start <objective>`.                                                                    |
| `Goal error: goal is already complete` | Het doel is definitief. Wis het voordat u een andere doelstelling start of hervat.                                                            |

Als het tokengebruik `0` weergeeft of verouderd lijkt, heeft de actieve sessie mogelijk nog geen
actuele tokenmomentopname. Het gebruik wordt vernieuwd wanneer OpenClaw sessiegebruik
en uit het transcript afgeleide totalen registreert.

## Gerelateerd

- [Slash-opdrachten](/nl/tools/slash-commands)
- [TUI](/nl/web/tui)
- [Sessietool](/nl/concepts/session-tool)
- [Compaction](/nl/concepts/compaction)
- [TaskFlow](/nl/automation/taskflow)
- [Vaste opdrachten](/nl/automation/standing-orders)
