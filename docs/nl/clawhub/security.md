---
read_when:
    - Inzicht in scan- en moderatieresultaten van ClawHub
    - Een skill of pakket melden
    - Herstellen van een aangehouden, verborgen of geblokkeerde vermelding
summary: Vertrouwens-, scan-, rapportage- en moderatiegedrag van ClawHub.
x-i18n:
    generated_at: "2026-05-13T04:18:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Beveiliging + Moderatie

ClawHub staat open voor publicatie, maar openbare vermeldingen doorlopen nog steeds controles voor vertrouwen,
scans, meldingen en moderatie. Het doel is praktisch: gebruikers helpen
inspecteren wat ze installeren, uitgevers een herstelpad bieden voor fout-positieven
en misbruikende pakketten uit openbare ontdekking houden.

Zie ook [Acceptabel gebruik](/nl/clawhub/acceptable-usage).

## Wat gebruikers kunnen inspecteren

Controleer vóór het installeren van een skill of Plugin de ClawHub-vermelding op:

- eigenaar en bronvermelding
- nieuwste versie en changelog
- vereiste omgevingsvariabelen of machtigingen
- compatibiliteitsmetadata voor Plugins
- scan- of moderatiestatus
- meldingen, reacties, sterren, downloads en installatiesignalen waar weergegeven

Installeer alleen content die je begrijpt en vertrouwt.

## Scanstatussen

ClawHub kan scan- of moderatieresultaten tonen op openbare pagina's en in diagnostiek
die zichtbaar is voor eigenaren.

Veelvoorkomende resultaten zijn:

- `clean`: er is geen blokkerend probleem gevonden.
- `suspicious`: de release vereist voorzichtigheid of beoordeling.
- `malicious`: de release wordt als onveilig beschouwd.
- `pending`: controles zijn nog niet voltooid.
- `held`, `quarantined`, `revoked` of `hidden`: de release is niet volledig
  beschikbaar op openbare installatieoppervlakken.

De exacte formulering kan per oppervlak verschillen, maar de praktische betekenis
is hetzelfde: als een release wordt vastgehouden of geblokkeerd, moeten gebruikers
deze niet installeren totdat de eigenaar het probleem oplost of moderatie deze
herstelt.

## Skills

Skill-scans bekijken de gepubliceerde skill-bundel, metadata, gedeclareerde
vereisten en verdachte instructies.

ClawHub let vooral op afwijkingen tussen wat een skill declareert en wat deze
lijkt te doen. Een skill die bijvoorbeeld verwijst naar een vereiste API-sleutel
moet die vereiste declareren in `SKILL.md`, zodat gebruikers dit vóór installatie
kunnen zien.

Scanbevindingen zijn gebaseerd op artefacten. Verwacht providergedrag, zoals gedeclareerde
API-referenties, localhost-OAuth-callbacks, opruiming bij scoped deïnstallatie, Basic Auth-
codering of door de gebruiker geselecteerde bestandsuploads naar de genoemde provider, wordt
anders behandeld dan verborgen doorsturen van referenties, brede toegang tot privébestanden,
niet-gerelateerde netwerkbestemmingen of verborgen browsermisbruik.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugin-releases bevatten pakketmetadata, bronvermelding, compatibiliteitsvelden
en informatie over artefactintegriteit.

OpenClaw controleert compatibiliteit voordat ClawHub-gehoste Plugins worden geïnstalleerd. Pakketrecords kunnen ook digest-metadata beschikbaar maken, zodat OpenClaw gedownloade
artefacten kan verifiëren. ClawScan neemt gedeclareerde pakketmetadata voor `openclaw.environment` env/config
mee bij het beoordelen van Plugin-releases, zodat gedeclareerde runtimevereisten
worden vergeleken met waargenomen gedrag.

## Meldingen

Ingelogde gebruikers kunnen Skills, pakketten en reacties melden.

Meldingen moeten specifiek en uitvoerbaar zijn. Misbruik van meldingen kan zelf leiden tot
accountmaatregelen.

Voorbeelden van meldingen:

- misleidende metadata
- niet-gedeclareerde vereisten voor referenties of machtigingen
- verdachte installatie-instructies
- scamreacties of impersonatie
- registraties te kwader trouw of misbruik van handelsmerken
- content die [Acceptabel gebruik](/nl/clawhub/acceptable-usage) schendt

## ClawScan-notities van uitgevers

Uitgevers kunnen een optionele ClawScan-notitie opgeven bij het publiceren van een skill of
Plugin. Deze notitie geeft ClawScan context voor gedrag dat anders ongebruikelijk kan lijken,
zoals netwerktoegang, native host-toegang of providerspecifieke
referenties.

## Moderatieblokkeringen

Wanneer de statische scanner een geüploade skill als kwaadaardig markeert, wordt de uitgever
automatisch onder een moderatieblokkering geplaatst (`requiresModerationAt` ingesteld op de
gebruiker). Dit verbergt alle Skills van de uitgever, zorgt ervoor dat toekomstige publicaties
verborgen beginnen en maakt een `user.moderation.auto`-auditlogvermelding aan.

Statische verdachte bevindingen worden bewaard als bestands-/regelbewijs voor moderators,
maar ze verbergen content niet en bepalen op zichzelf niet het openbare scan-oordeel.
Nieuwe uploads blijven in beoordelings-/wachtende status totdat de LLM-beoordeling is afgerond. Statische
scans blokkeren alleen direct bij kwaadaardige signatures. VirusTotal-enginehits
blijven zichtbaar beveiligingsbewijs, maar VirusTotal Code Insight/Palm-
oordelen zijn adviserend en verbergen Skills niet op zichzelf. ClawScan LLM-beoordelingen
bewaren doelgerichte notities als richtlijn. Middelzware beoordelingsbevindingen blijven zichtbaar op
het artefact, terwijl het verdachte filter is gereserveerd voor LLM-zorgen met hoge impact,
kwaadaardige bevindingen of bevestigde AV-engine-detecties.

Beheerders kunnen een fout-positieve blokkering opheffen:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dit wist `requiresModerationAt` en `requiresModerationReason`, herstelt
Skills die door de blokkering op gebruikersniveau verborgen waren en schrijft een `user.moderation.lift`-auditlogvermelding. Skills die om andere redenen verborgen zijn, of waarvan de eigen statische scan
kwaadaardig blijft, blijven verborgen.

## Bans en accountstatus

Accounts die het ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik
kan leiden tot accountbans, tokenintrekking, verborgen content of verwijderde
vermeldingen.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-authenticatie
begint te mislukken na accountmaatregelen, meld je dan aan bij de web-UI om de accountstatus te
bekijken. Als aanmelden of normale CLI-toegang is geblokkeerd, neem dan contact op met
security@openclaw.ai voor herstelbeoordeling.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs accuraat
- declareer vereiste omgevingsvariabelen en machtigingen
- voeg een ClawScan-notitie van de uitgever toe wanneer een release ongebruikelijk maar bedoeld gedrag heeft
- vermijd verhulde installatieopdrachten
- link waar mogelijk naar de bron
- gebruik dry-runs voordat je Plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over pakketgedrag
