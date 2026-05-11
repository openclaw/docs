---
read_when:
    - Inzicht in ClawHub-scan- en moderatieresultaten
    - Een skill of pakket melden
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
summary: ClawHub-vertrouwen, scan, rapportage, bezwaar en moderatiegedrag.
x-i18n:
    generated_at: "2026-05-11T20:25:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf88073ce581f25c93b2fe0067ebd2bb1a481c8c927d65a06943a38d33e3425e
    source_path: clawhub/security.md
    workflow: 16
---

# Beveiliging + moderatie

ClawHub staat open voor publicatie, maar publieke vermeldingen gaan nog steeds door
vertrouwens-, scan-, rapportage- en moderatiecontroles. Het doel is praktisch:
gebruikers helpen inspecteren wat ze installeren, uitgevers een herstelpad geven
voor fout-positieven en misbruikpakketten buiten publieke ontdekking houden.

Zie ook [Aanvaardbaar gebruik](/nl/clawhub/acceptable-usage).

## Wat gebruikers kunnen inspecteren

Controleer vóór het installeren van een skill of Plugin de ClawHub-vermelding op:

- eigenaar en bronvermelding
- nieuwste versie en changelog
- vereiste omgevingsvariabelen of machtigingen
- compatibiliteitsmetadata voor Plugins
- scan- of moderatiestatus
- rapporten, opmerkingen, sterren, downloads en installatiesignalen waar getoond

Installeer alleen content die je begrijpt en vertrouwt.

## Scanstatussen

ClawHub kan scan- of moderatie-uitkomsten tonen op publieke pagina's en in
diagnoses die zichtbaar zijn voor eigenaren.

Veelvoorkomende uitkomsten zijn:

- `clean`: er is geen blokkerend probleem gevonden.
- `suspicious`: de release vereist voorzichtigheid of beoordeling.
- `malicious`: de release wordt als onveilig beschouwd.
- `pending`: controles zijn nog niet afgerond.
- `held`, `quarantined`, `revoked` of `hidden`: de release is niet volledig
  beschikbaar op publieke installatie-oppervlakken.

De exacte bewoording kan per oppervlak verschillen, maar de praktische betekenis
is hetzelfde: als een release wordt vastgehouden of geblokkeerd, moeten
gebruikers deze niet installeren totdat de eigenaar het probleem oplost of
moderatie de release herstelt.

## Skills

Skill-scans kijken naar de gepubliceerde skill-bundel, metadata, gedeclareerde
vereisten en verdachte instructies.

ClawHub besteedt speciale aandacht aan verschillen tussen wat een skill
declareert en wat deze lijkt te doen. Een skill die bijvoorbeeld verwijst naar
een vereiste API-sleutel moet die vereiste declareren in `SKILL.md`, zodat
gebruikers dit vóór installatie kunnen zien.

Scanbevindingen zijn gebaseerd op artefacten. Verwacht providergedrag, zoals
gedeclareerde API-inloggegevens, localhost OAuth-callbacks, opgeschoonde
de-installatie binnen scope, Basic Auth-codering of door de gebruiker
geselecteerde bestandsuploads naar de genoemde provider, wordt anders behandeld
dan verborgen doorgifte van inloggegevens, brede toegang tot privébestanden,
niet-gerelateerde netwerkbestemmingen of heimelijk browsermisbruik.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugin-releases bevatten pakketmetadata, bronvermelding, compatibiliteitsvelden
en informatie over artefactintegriteit.

OpenClaw controleert compatibiliteit voordat door ClawHub gehoste Plugins worden
geïnstalleerd. Pakketrecords kunnen ook digest-metadata beschikbaar maken, zodat
OpenClaw gedownloade artefacten kan verifiëren. ClawScan neemt gedeclareerde
pakketmetadata voor `openclaw.environment` env/config mee bij het beoordelen van
Plugin-releases, zodat gedeclareerde runtimevereisten worden vergeleken met
waargenomen gedrag.

## Rapporten

Ingelogde gebruikers kunnen Skills, pakketten en opmerkingen rapporteren.

Rapporten moeten specifiek en uitvoerbaar zijn. Misbruik van rapportage kan zelf
leiden tot accountmaatregelen.

Voorbeelden van rapporten:

- misleidende metadata
- niet-gedeclareerde vereisten voor inloggegevens of machtigingen
- verdachte installatie-instructies
- scamopmerkingen of impersonatie
- registraties te kwader trouw of misbruik van handelsmerken
- content die [Aanvaardbaar gebruik](/nl/clawhub/acceptable-usage) schendt

## Rapporten te kwader trouw of over handelsmerken

ClawHub gebruikt dezelfde rapportage- en stafmoderatiepijplijn voor registraties
te kwader trouw, impersonatie en handelsmerkgerelateerde geschillen. Deze
rapporten hebben genoeg context nodig zodat medewerkers de eiser, betwiste
vermelding en gevraagde actie kunnen identificeren.

Neem op:

- de canonieke URL van de ClawHub-skill of het ClawHub-pakket en de handle van
  de eigenaar
- het handelsmerk, project, bedrijf of product waar het om gaat
- publiek bewijs van eigendom of bevoegdheid van de eiser
- waarom de huidige eigenaar niet bevoegd is om onder die naam te publiceren
- de gevraagde actie, zoals verbergen in afwachting van beoordeling, eigendom
  overdragen, hernoemen of verwijderen

Plaats geen privégeheimen of gevoelige juridische documenten in publieke
rapporten. Open een GitHub-issue met niet-gevoelig bewijs en vraag maintainers
om een privé-overdrachtspad wanneer dat nodig is.

## Bezwaren en nieuwe scans

Eigenaren kunnen een nieuwe scan aanvragen wanneer ze denken dat een skill of
pakket ten onrechte is vastgehouden of gemarkeerd. Platformmoderators en admins
kunnen nieuwe scans aanvragen voor elke skill of elk pakket tijdens het
afhandelen van rapporten of supportverzoeken:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Voor gemodereerde content kunnen eigenaren mogelijk bezwaar indienen vanaf de
voor eigenaren zichtbare ClawHub-oppervlakken. Bezwaren moeten uitleggen wat er
is gewijzigd of waarom de markering onjuist is.

## Moderatieblokkades

Wanneer de statische scanner een geüploade skill als schadelijk markeert, wordt
de uitgever automatisch onder een moderatieblokkade geplaatst
(`requiresModerationAt` ingesteld op de gebruiker). Dit verbergt alle Skills van
de uitgever, zorgt ervoor dat toekomstige publicaties verborgen starten en maakt
een `user.moderation.auto`-auditlogvermelding aan.

Statische verdachte bevindingen worden bewaard als bestands-/regelbewijs voor
moderators, maar ze verbergen content niet en bepalen niet op zichzelf het
publieke scanoordeel. Nieuwe uploads blijven in beoordelings-/wachtstatus totdat
de LLM-beoordeling is afgerond. Statische scanning blokkeert alleen direct bij
schadelijke signatures. VirusTotal-enginehits blijven zichtbaar
beveiligingsbewijs, maar VirusTotal Code Insight/Palm-oordelen zijn adviserend
en verbergen Skills niet op zichzelf. ClawScan LLM-beoordelingen behouden
doelgerichte notities als begeleiding. Middelzware beoordelingsbevindingen
blijven zichtbaar op het artefact, terwijl het verdachte filter is gereserveerd
voor LLM-zorgen met grote impact, schadelijke bevindingen of bevestigde
AV-enginedetecties.

Admins kunnen een fout-positieve blokkade opheffen:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dit wist `requiresModerationAt` en `requiresModerationReason`, herstelt Skills
die door de blokkade op gebruikersniveau verborgen waren, en schrijft een
`user.moderation.lift`-auditlogvermelding. Skills die om andere redenen verborgen
zijn, of waarvan de eigen statische scan schadelijk blijft, blijven verborgen.

## Bans en accountstatus

Accounts die het ClawHub-beleid schenden, kunnen publicatietoegang verliezen.
Ernstig misbruik kan leiden tot accountbans, intrekking van tokens, verborgen
content of verwijderde vermeldingen.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens
gebruiken. Als CLI-authenticatie begint te mislukken na een accountmaatregel,
meld je dan aan bij de web-UI om de accountstatus te bekijken of neem contact op
met maintainers via het verwachte supportkanaal van het project.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs nauwkeurig
- declareer vereiste omgevingsvariabelen en machtigingen
- vermijd verhulde installatieopdrachten
- link waar mogelijk naar de bron
- gebruik dry runs voordat je Plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen naar pakketgedrag
