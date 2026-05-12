---
read_when:
    - ClawHub-scan- en moderatieresultaten begrijpen
    - Een skill of pakket melden
    - Herstellen van een tegengehouden, verborgen of geblokkeerde vermelding
summary: Vertrouwens-, scan-, rapportage- en moderatiegedrag van ClawHub.
x-i18n:
    generated_at: "2026-05-12T00:57:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Beveiliging + Moderatie

ClawHub staat open voor publicatie, maar openbare vermeldingen doorlopen nog steeds
controles voor vertrouwen, scans, rapportage en moderatie. Het doel is praktisch:
gebruikers helpen inspecteren wat ze installeren, uitgevers een herstelpad geven
bij fout-positieven en misbruikende pakketten buiten openbare ontdekking houden.

Zie ook [Acceptabel gebruik](/nl/clawhub/acceptable-usage).

## Wat gebruikers kunnen inspecteren

Controleer vóór het installeren van een skill of plugin de ClawHub-vermelding op:

- eigenaar en bronvermelding
- nieuwste versie en changelog
- vereiste omgevingsvariabelen of machtigingen
- compatibiliteitsmetadata voor plugins
- scan- of moderatiestatus
- rapporten, opmerkingen, sterren, downloads en installatiesignalen waar getoond

Installeer alleen inhoud die je begrijpt en vertrouwt.

## Scanstatussen

ClawHub kan scan- of moderatie-uitkomsten tonen op openbare pagina's en in
diagnostiek die zichtbaar is voor eigenaren.

Veelvoorkomende uitkomsten zijn:

- `clean`: er is geen blokkerend probleem gevonden.
- `suspicious`: de release vereist voorzichtigheid of beoordeling.
- `malicious`: de release wordt als onveilig beschouwd.
- `pending`: controles zijn nog niet afgerond.
- `held`, `quarantined`, `revoked` of `hidden`: de release is niet volledig
  beschikbaar op openbare installatieoppervlakken.

De exacte formulering kan per oppervlak verschillen, maar de praktische betekenis
is hetzelfde: als een release wordt vastgehouden of geblokkeerd, moeten gebruikers
deze niet installeren totdat de eigenaar het probleem oplost of moderatie de
release herstelt.

## Skills

Skill-scans kijken naar de gepubliceerde skill-bundel, metadata, gedeclareerde
vereisten en verdachte instructies.

ClawHub let vooral op verschillen tussen wat een skill declareert en wat die
lijkt te doen. Een skill die bijvoorbeeld naar een vereiste API-sleutel verwijst,
moet die vereiste declareren in `SKILL.md`, zodat gebruikers dit kunnen zien
vóór installatie.

Scanbevindingen zijn gebaseerd op artefacten. Verwacht providergedrag, zoals
gedeclareerde API-referenties, localhost-OAuth-callbacks, opgeschoonde verwijdering
binnen scope, Basic Auth-codering of door de gebruiker geselecteerde bestandsuploads
naar de vermelde provider, wordt anders behandeld dan verborgen doorsturen van
referenties, brede toegang tot privébestanden, niet-gerelateerde netwerkbestemmingen
of heimelijk browsermisbruik.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugin-releases bevatten pakketmetadata, bronvermelding, compatibiliteitsvelden
en informatie over artefactintegriteit.

OpenClaw controleert compatibiliteit voordat door ClawHub gehoste plugins worden
geïnstalleerd. Pakketrecords kunnen ook digest-metadata beschikbaar maken, zodat
OpenClaw gedownloade artefacten kan verifiëren. ClawScan neemt gedeclareerde
env/config-metadata van pakket `openclaw.environment` mee bij het beoordelen van
plugin-releases, zodat gedeclareerde runtimevereisten worden vergeleken met
waargenomen gedrag.

## Rapporten

Ingelogde gebruikers kunnen skills, pakketten en opmerkingen rapporteren.

Rapporten moeten specifiek en uitvoerbaar zijn. Misbruik van rapportage kan zelf
leiden tot accountmaatregelen.

Voorbeelden van rapporten:

- misleidende metadata
- niet-gedeclareerde vereisten voor referenties of machtigingen
- verdachte installatie-instructies
- scamopmerkingen of imitatie
- registraties te kwader trouw of misbruik van handelsmerken
- inhoud die [Acceptabel gebruik](/nl/clawhub/acceptable-usage) schendt

## ClawScan-notities van uitgevers

Uitgevers kunnen een optionele ClawScan-notitie opgeven bij het publiceren van
een skill of plugin. Deze notitie geeft ClawScan context voor gedrag dat anders
ongebruikelijk kan lijken, zoals netwerktoegang, toegang tot een native host of
provider-specifieke referenties.

## Moderatieblokkades

Wanneer de statische scanner een geüploade skill als kwaadaardig markeert, wordt
de uitgever automatisch onder een moderatieblokkade geplaatst (`requiresModerationAt`
ingesteld op de gebruiker). Dit verbergt alle skills van de uitgever, zorgt
ervoor dat toekomstige publicaties verborgen starten en maakt een
`user.moderation.auto`-auditlogvermelding aan.

Statische verdachte bevindingen worden bewaard als bestands-/regelbewijs voor
moderators, maar ze verbergen inhoud niet en bepalen op zichzelf niet het
openbare scanoordeel. Nieuwe uploads blijven in de beoordelings-/pendingstatus
totdat de LLM-beoordeling is afgerond. Statisch scannen blokkeert alleen direct
bij kwaadaardige signatures. Hits van VirusTotal-engines blijven zichtbaar
beveiligingsbewijs, maar VirusTotal Code Insight/Palm-oordelen zijn adviserend
en verbergen skills niet op zichzelf. ClawScan LLM-beoordelingen houden
doelgerichte notities aan als richtlijn. Middelzware beoordelingsbevindingen
blijven zichtbaar op het artefact, terwijl het verdachte filter is gereserveerd
voor LLM-zorgen met grote impact, kwaadaardige bevindingen of bevestigde
detecties door AV-engines.

Beheerders kunnen een fout-positieve blokkade opheffen:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dit wist `requiresModerationAt` en `requiresModerationReason`, herstelt skills
die door de blokkade op gebruikersniveau verborgen waren, en schrijft een
`user.moderation.lift`-auditlogvermelding. Skills die om andere redenen verborgen
zijn, of waarvan de eigen statische scan kwaadaardig blijft, blijven verborgen.

## Bans en accountstatus

Accounts die het ClawHub-beleid schenden, kunnen publicatietoegang verliezen.
Ernstig misbruik kan leiden tot accountbans, tokenintrekking, verborgen inhoud of
verwijderde vermeldingen.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub-API-tokens
gebruiken. Als CLI-authenticatie na een accountmaatregel begint te mislukken, meld
je dan aan bij de web-UI om de accountstatus te controleren. Als aanmelden of
normale CLI-toegang is geblokkeerd, neem dan contact op met
security@openclaw.ai voor herstelbeoordeling.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs nauwkeurig
- declareer vereiste omgevingsvariabelen en machtigingen
- voeg een ClawScan-notitie van de uitgever toe wanneer een release ongebruikelijk maar bedoeld gedrag heeft
- vermijd verhulde installatieopdrachten
- link waar mogelijk naar de bron
- gebruik dry runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over pakketgedrag
