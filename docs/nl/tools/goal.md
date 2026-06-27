---
doc-schema-version: 1
read_when:
    - Je wilt dat OpenClaw één doelstelling zichtbaar houdt gedurende een lange sessie
    - Je moet een sessiedoel pauzeren, hervatten, blokkeren, voltooien of wissen
    - U wilt de tools get_goal, create_goal en update_goal begrijpen
    - Je wilt zien hoe doelen in de TUI verschijnen
summary: 'Sessiedoelen: duurzame doelstellingen per sessie, /goal-bedieningselementen, modeldoeltools, tokenbudgetten en TUI-status'
title: Doel
x-i18n:
    generated_at: "2026-06-27T18:27:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4313983dff7f37496f6c996303cace75f6863a71c8a9cd5367fdafbcc3f459c4
    source_path: tools/goal.md
    workflow: 16
---

# Doel

Een **doel** is één duurzame doelstelling die aan de huidige OpenClaw-sessie is gekoppeld.
Het geeft de agent en de operator een gedeeld doel voor langlopend werk,
zonder dat doel om te zetten in een achtergrondtaak, herinnering, Cron-taak of
doorlopende opdracht.

Doelen zijn sessiestatus. Ze bewegen mee met de sessiesleutel, overleven
procesherstarts, verschijnen in `/goal`, zijn via de goal-tools beschikbaar voor
het model, en verschijnen in de TUI-voettekst wanneer de actieve sessie er een heeft.

## Snel aan de slag

Stel een doel in:

```text
/goal start get CI green for PR 87469 and push the fix
```

Controleer het:

```text
/goal
```

Pauzeer het wanneer het werk bewust wacht:

```text
/goal pause waiting for CI
```

Hervat het:

```text
/goal resume
```

Markeer het als voltooid:

```text
/goal complete pushed and verified
```

Wis het:

```text
/goal clear
```

## Waar doelen voor zijn

Gebruik een doel wanneer een sessie een concreet resultaat heeft dat zichtbaar
moet blijven over veel beurten heen:

- Een PR-afronding: oplossen, verifiëren, autoreview uitvoeren, pushen, en de PR openen of bijwerken.
- Een debugrun: de bug reproduceren, het verantwoordelijke oppervlak identificeren, patchen en de
  oplossing bewijzen.
- Een documentatieronde: de relevante docs lezen, de nieuwe pagina schrijven, kruislings linken en
  verifiëren dat de docs-build slaagt.
- Een onderhoudstaak: de huidige status inspecteren, begrensde wijzigingen maken, de juiste
  controles uitvoeren en rapporteren wat is gewijzigd.

Een doel is geen taakwachtrij. Gebruik [Task Flow](/nl/automation/taskflow),
[taken](/nl/automation/tasks), [Cron-taken](/nl/automation/cron-jobs), of
[doorlopende opdrachten](/nl/automation/standing-orders) wanneer werk losgekoppeld
moet draaien, volgens een schema moet worden herhaald, moet uitwaaieren naar beheerd deelwerk,
of als beleid moet blijven bestaan.

## Opdrachtreferentie

`/goal` zonder argumenten drukt de huidige doelsamenvatting af:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal pause, /goal complete, /goal clear
```

Opdrachten:

- `/goal` of `/goal status` toont het huidige doel.
- `/goal start <objective>` maakt een nieuw doel voor de huidige sessie.
- `/goal set <objective>` en `/goal create <objective>` zijn aliassen voor
  `start`.
- `/goal pause [note]` pauzeert een actief doel.
- `/goal resume [note]` hervat een gepauzeerd, geblokkeerd, gebruiksbeperkt of
  budgetbeperkt doel.
- `/goal complete [note]` markeert het doel als bereikt.
- `/goal done [note]` is een alias voor `complete`.
- `/goal block [note]` markeert het doel als geblokkeerd.
- `/goal blocked [note]` is een alias voor `block`.
- `/goal clear` verwijdert het doel uit de sessie.

Er kan maar één doel tegelijk in een sessie bestaan. Het starten van een tweede doel mislukt
totdat het huidige doel is gewist.

## Statussen

Doelen gebruiken een kleine set statussen:

- `active`: de sessie werkt aan het doel.
- `paused`: de operator heeft het doel gepauzeerd; `/goal resume` maakt het weer actief.
- `blocked`: de agent of operator heeft een echte blokkade gemeld; `/goal resume`
  maakt het weer actief wanneer nieuwe informatie of status beschikbaar is.
- `budget_limited`: het geconfigureerde tokenbudget is bereikt; `/goal resume`
  hervat het nastreven vanuit dezelfde doelstelling.
- `usage_limited`: gereserveerd voor stopstatussen door gebruikslimieten; `/goal resume`
  hervat het nastreven wanneer dat is toegestaan.
- `complete`: het doel is bereikt. Voltooide doelen zijn eindstatussen; gebruik
  `/goal clear` voordat je een ander doel start.

`/new` en `/reset` wissen het huidige sessiedoel omdat ze bewust
met een nieuwe sessiecontext beginnen.

## Tokenbudgetten

Doelen kunnen een optioneel positief tokenbudget hebben. Het budget wordt met het
doel opgeslagen en gemeten vanaf de verse tokentelling van de sessie op het moment van aanmaken. Als de
huidige sessie alleen verouderd of onbekend tokengebruik heeft wanneer het doel start,
wacht OpenClaw op de volgende verse sessietokensnapshot en gebruikt die als
basislijn, zodat tokens die vóór het bestaan van het doel zijn besteed niet aan het doel worden toegerekend.

Wanneer het tokengebruik het budget bereikt, verandert het doel naar `budget_limited`. Dit
verwijdert het doel niet en wist de doelstelling niet. Het vertelt de operator en de
agent dat het doel niet langer actief wordt nagestreefd totdat het wordt hervat of
gewist.

Tokenbudgetten zijn een vangrail voor sessiedoelen, geen factureringslimiet. Providerquota,
kostenrapportage en contextvenstergedrag gebruiken nog steeds de normale OpenClaw-
gebruiks- en modelinstellingen.

## Modeltools

OpenClaw stelt drie kern-goal-tools beschikbaar aan agent-harnassen:

- `get_goal`: lees het huidige sessiedoel, inclusief status, doelstelling, tokengebruik
  en tokenbudget.
- `create_goal`: maak alleen een doel wanneer de gebruiker, het systeem of de developer-
  instructies daar expliciet om vragen. Dit mislukt als de sessie al een
  doel heeft.
- `update_goal`: markeer het doel als `complete` of `blocked`.

Het model kan een doel niet stilzwijgend pauzeren, hervatten, wissen of vervangen. Dat zijn
operator-/sessie-instellingen via `/goal` en resetopdrachten. Dit voorkomt dat de
agent ongemerkt het doel verplaatst, terwijl er een helder pad blijft voor de
agent om een behaald resultaat of een echte blokkade te melden.

De tool `update_goal` moet een doel alleen als `complete` markeren wanneer de doelstelling
daadwerkelijk is bereikt. Deze moet een doel alleen als `blocked` markeren wanneer dezelfde blokkerende
voorwaarde zich heeft herhaald en de agent geen betekenisvolle voortgang kan boeken zonder
nieuwe gebruikersinvoer of een wijziging in externe status.

## TUI

De TUI houdt het doel van de actieve sessie zichtbaar in de voettekst naast de
agent, sessie, model, runbesturing en tokentellingen.

Voorbeelden van voetteksten:

- `Pursuing goal (12k/50k)` voor een actief doel met een tokenbudget.
- `Goal paused (/goal resume)` voor een gepauzeerd doel.
- `Goal blocked (/goal resume)` voor een geblokkeerd doel.
- `Goal hit usage limits (/goal resume)` voor een gebruiksbeperkt doel.
- `Goal unmet (50k/50k)` voor een budgetbeperkt doel.
- `Goal achieved (42k)` voor een voltooid doel.

De voettekst is bewust compact. Gebruik `/goal` voor de volledige doelstelling, notitie,
tokenbudget en beschikbare opdrachten.

## Kanaalgedrag

De opdracht `/goal` werkt in OpenClaw-sessies met opdrachtmogelijkheden, inclusief de
TUI en chatoppervlakken die tekstopdrachten toestaan. Doelstatus is gekoppeld aan de
sessiesleutel, niet aan het transport. Als twee oppervlakken dezelfde sessie gebruiken, zien ze
hetzelfde doel.

Doelstatus is geen afleveringsrichtlijn. Het dwingt geen antwoorden af via een
kanaal, verandert wachtrijgedrag niet, keurt geen tools goed en plant geen werk in.

## Probleemoplossing

`Goal error: goal already exists` betekent dat de sessie al een doel heeft. Gebruik
`/goal` om het te inspecteren, `/goal complete` als het klaar is, of `/goal clear` voordat je
een andere doelstelling start.

`Goal error: goal not found` betekent dat de sessie nog geen doel heeft. Start er een met
`/goal start <objective>`.

`Goal error: goal is already complete` betekent dat het doel een eindstatus heeft. Wis het
voordat je een andere doelstelling start of hervat.

Als tokengebruik eruitziet als `0` of verouderd is, heeft de actieve sessie mogelijk nog geen verse
tokensnapshot. Gebruik wordt vernieuwd terwijl OpenClaw sessiegebruik en
uit transcript afgeleide totalen vastlegt.

## Gerelateerd

- [Slash-opdrachten](/nl/tools/slash-commands)
- [TUI](/nl/web/tui)
- [Sessietool](/nl/concepts/session-tool)
- [Compaction](/nl/concepts/compaction)
- [Task Flow](/nl/automation/taskflow)
- [Doorlopende opdrachten](/nl/automation/standing-orders)
