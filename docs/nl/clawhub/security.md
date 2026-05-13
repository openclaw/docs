---
read_when:
    - ClawHub-scan- en moderatieresultaten begrijpen
    - Een skill of pakket melden
    - Herstellen van een aangehouden, verborgen of geblokkeerde vermelding
summary: Vertrouwens-, scan-, rapportage- en moderatiegedrag van ClawHub.
x-i18n:
    generated_at: "2026-05-13T05:33:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Beveiliging + Moderatie

ClawHub staat open voor publicatie, maar openbare vermeldingen doorlopen nog steeds vertrouwens-, scan-, rapportage- en moderatiecontroles. Het doel is praktisch: gebruikers helpen inspecteren wat ze installeren, uitgevers een herstelpad bieden voor fout-positieven, en misbruikende pakketten buiten openbare vindbaarheid houden.

Zie ook [Acceptabel gebruik](/nl/clawhub/acceptable-usage).

## Wat gebruikers kunnen inspecteren

Controleer voor het installeren van een skill of plugin de ClawHub-vermelding op:

- eigenaar en bronvermelding
- nieuwste versie en changelog
- vereiste omgevingsvariabelen of machtigingen
- compatibiliteitsmetadata voor plugins
- scan- of moderatiestatus
- meldingen, opmerkingen, sterren, downloads en installatiesignalen waar weergegeven

Installeer alleen inhoud die u begrijpt en vertrouwt.

## Scanstatussen

ClawHub kan scan- of moderatieresultaten tonen op openbare pagina's en in diagnoses die zichtbaar zijn voor eigenaars.

Veelvoorkomende resultaten zijn:

- `clean`: er is geen blokkerend probleem gevonden.
- `suspicious`: de release vereist voorzichtigheid of beoordeling.
- `malicious`: de release wordt als onveilig beschouwd.
- `pending`: controles zijn nog niet afgerond.
- `held`, `quarantined`, `revoked` of `hidden`: de release is niet volledig beschikbaar op openbare installatiesurfaces.

De exacte formulering kan per surface verschillen, maar de praktische betekenis is hetzelfde: als een release wordt vastgehouden of geblokkeerd, moeten gebruikers deze niet installeren totdat de eigenaar het probleem oplost of moderatie de release herstelt.

## Skills

Skill-scans bekijken de gepubliceerde skill-bundel, metadata, gedeclareerde vereisten en verdachte instructies.

ClawHub let speciaal op verschillen tussen wat een skill declareert en wat deze lijkt te doen. Een skill die bijvoorbeeld verwijst naar een vereiste API-sleutel, moet die vereiste declareren in `SKILL.md`, zodat gebruikers deze kunnen zien voordat ze installeren.

Scanbevindingen zijn gebaseerd op artefacten. Verwacht providergedrag, zoals gedeclareerde API-referenties, localhost-OAuth-callbacks, scoped opruiming bij verwijderen, Basic Auth-codering of door de gebruiker geselecteerde bestandsuploads naar de genoemde provider, wordt anders behandeld dan verborgen doorsturen van referenties, brede toegang tot privébestanden, niet-gerelateerde netwerkbestemmingen of heimelijk browsermisbruik.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugin-releases bevatten pakketmetadata, bronvermelding, compatibiliteitsvelden en informatie over artefactintegriteit.

OpenClaw controleert compatibiliteit voordat door ClawHub gehoste plugins worden geïnstalleerd. Pakketrecords kunnen ook digestmetadata beschikbaar stellen, zodat OpenClaw gedownloade artefacten kan verifiëren. ClawScan neemt gedeclareerde pakketmetadata voor `openclaw.environment` env/config mee bij het beoordelen van plugin-releases, zodat gedeclareerde runtimevereisten worden vergeleken met waargenomen gedrag.

## Meldingen

Ingelogde gebruikers kunnen skills, pakketten en opmerkingen melden.

Meldingen moeten specifiek en uitvoerbaar zijn. Misbruik van rapportage kan zelf leiden tot accountmaatregelen.

Voorbeelden van meldingen:

- misleidende metadata
- niet-gedeclareerde referentie- of machtigingsvereisten
- verdachte installatie-instructies
- scamopmerkingen of imitatie
- registraties te kwader trouw of misbruik van handelsmerken
- inhoud die [Acceptabel gebruik](/nl/clawhub/acceptable-usage) schendt

## ClawScan-notities van uitgevers

Uitgevers kunnen een optionele ClawScan-notitie opgeven bij het publiceren van een skill of plugin. Deze notitie geeft ClawScan context voor gedrag dat anders ongebruikelijk kan lijken, zoals netwerktoegang, toegang tot native hosts of providerspecifieke referenties.

## Moderatieblokkades

Wanneer de statische scanner een geüploade skill als kwaadaardig markeert, wordt de uitgever automatisch onder een moderatieblokkade geplaatst (`requiresModerationAt` ingesteld op de gebruiker). Dit verbergt alle skills van de uitgever, zorgt ervoor dat toekomstige publicaties verborgen beginnen, en maakt een `user.moderation.auto`-auditlogvermelding aan.

Statische verdachte bevindingen worden bewaard als bestands-/regelbewijs voor moderators, maar ze verbergen inhoud niet en bepalen op zichzelf niet het openbare scanoordeel. Nieuwe uploads blijven in de beoordelings-/wachtstatus totdat de LLM-beoordeling is afgerond. Statisch scannen blokkeert alleen onmiddellijk bij kwaadaardige signatures. VirusTotal-enginehits blijven zichtbaar beveiligingsbewijs, maar VirusTotal Code Insight/Palm-oordelen zijn adviserend en verbergen skills niet op zichzelf. ClawScan LLM-beoordelingen behouden doelgerichte notities als begeleiding. Middelzware beoordelingsbevindingen blijven zichtbaar op het artefact, terwijl het verdachte filter is gereserveerd voor LLM-zorgen met grote impact, kwaadaardige bevindingen of bevestigde AV-enginedetecties.

Beheerders kunnen een fout-positieve blokkade opheffen:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dit wist `requiresModerationAt` en `requiresModerationReason`, herstelt skills die door de blokkade op gebruikersniveau zijn verborgen, en schrijft een `user.moderation.lift`-auditlogvermelding. Skills die om andere redenen zijn verborgen, of waarvan de eigen statische scan kwaadaardig blijft, blijven verborgen.

## Bans en accountstatus

Accounts die het ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik kan leiden tot accountbans, tokenintrekking, verborgen inhoud of verwijderde vermeldingen.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-authenticatie begint te falen na een accountmaatregel, log dan in bij de web-UI om de accountstatus te bekijken. Als inloggen of normale CLI-toegang is geblokkeerd, neem dan contact op met security@openclaw.ai voor herstelbeoordeling.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs nauwkeurig
- declareer vereiste omgevingsvariabelen en machtigingen
- voeg een ClawScan-notitie van de uitgever toe wanneer een release ongebruikelijk maar bedoeld gedrag heeft
- vermijd verhulde installatieopdrachten
- link naar de bron waar mogelijk
- gebruik dry runs voordat u plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over pakketgedrag
