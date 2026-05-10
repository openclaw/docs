---
read_when:
    - Inzicht in de scan- en moderatieresultaten van ClawHub
    - Een skill of pakket melden
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
summary: Vertrouwen, scans, rapportage, bezwaar en moderatiegedrag van ClawHub.
x-i18n:
    generated_at: "2026-05-10T19:27:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83d68ab910ad4812ae79e887d52ff1c5b8248542e1d27d54a81a18cbd821debf
    source_path: clawhub/security.md
    workflow: 16
---

# Beveiliging + moderatie

ClawHub staat open voor publicatie, maar openbare vermeldingen lopen nog steeds via
vertrouwens-, scan-, rapportage- en moderatiecontroles. Het doel is praktisch:
gebruikers helpen te inspecteren wat ze installeren, uitgevers een herstelpad
geven bij fout-positieven, en misbruikpakketten buiten openbare vindbaarheid
houden.

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

ClawHub kan scan- of moderatieresultaten tonen op openbare pagina's en in
diagnostiek die zichtbaar is voor de eigenaar.

Veelvoorkomende resultaten zijn:

- `clean`: er is geen blokkerend probleem gevonden.
- `suspicious`: de release vereist voorzichtigheid of beoordeling.
- `malicious`: de release wordt als onveilig beschouwd.
- `pending`: controles zijn nog niet afgerond.
- `held`, `quarantined`, `revoked` of `hidden`: de release is niet volledig
  beschikbaar op openbare installatieoppervlakken.

De exacte formulering kan per oppervlak verschillen, maar de praktische betekenis
is hetzelfde: als een release wordt vastgehouden of geblokkeerd, moeten
gebruikers deze niet installeren totdat de eigenaar het probleem oplost of
moderatie de release herstelt.

## Skills

Skill-scans bekijken de gepubliceerde skill-bundel, metadata, opgegeven
vereisten en verdachte instructies.

ClawHub let vooral op verschillen tussen wat een skill declareert en wat deze
lijkt te doen. Een skill die bijvoorbeeld verwijst naar een vereiste API-sleutel,
moet die vereiste declareren in `SKILL.md`, zodat gebruikers dit vóór installatie
kunnen zien.

Scanbevindingen zijn gebaseerd op artefacten. Verwacht providergedrag, zoals
gedeclareerde API-referenties, localhost-OAuth-callbacks, opgeschoonde
verwijdering binnen scope, Basic Auth-codering, of door de gebruiker geselecteerde
bestandsuploads naar de opgegeven provider, wordt anders behandeld dan verborgen
doorgifte van referenties, brede toegang tot privébestanden, niet-gerelateerde
netwerkbestemmingen of heimelijk misbruik van de browser.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugin-releases bevatten pakketmetadata, bronvermelding, compatibiliteitsvelden
en informatie over artefactintegriteit.

OpenClaw controleert compatibiliteit voordat ClawHub-gehoste plugins worden
geïnstalleerd. Pakketrecords kunnen ook digestmetadata beschikbaar maken, zodat
OpenClaw gedownloade artefacten kan verifiëren. ClawScan neemt gedeclareerde
pakketmetadata voor `openclaw.environment` env/config mee bij de beoordeling van
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

## Rapporten over kwade trouw of handelsmerken

ClawHub gebruikt dezelfde rapportage- en staff-moderatiepijplijn voor registraties
te kwader trouw, imitatie en handelsmerkgerelateerde geschillen. Deze rapporten
hebben genoeg context nodig zodat staff de eiser, betwiste vermelding en
gevraagde actie kan identificeren.

Vermeld:

- de canonieke ClawHub-URL van de skill of het pakket en de owner-handle
- het handelsmerk, project, bedrijf of product waar het om gaat
- openbaar bewijs van eigendom of bevoegdheid van de eiser
- waarom de huidige eigenaar niet bevoegd is om onder die naam te publiceren
- de gevraagde actie, zoals verbergen in afwachting van beoordeling, eigendom
  overdragen, hernoemen of verwijderen

Plaats geen privégeheimen of gevoelige juridische documenten in openbare
rapporten. Open een GitHub-issue met niet-gevoelig bewijs en vraag maintainers
om een privé-overdrachtspad wanneer dat nodig is.

## Bezwaar en herscans

Eigenaars kunnen een herscan aanvragen wanneer ze denken dat een skill of pakket
onterecht is vastgehouden of gemarkeerd. Platformmoderators en admins kunnen
herscans aanvragen voor elke skill of elk pakket tijdens het afhandelen van
rapporten of supportverzoeken:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Voor gemodereerde inhoud kunnen eigenaars mogelijk bezwaar indienen via de
ClawHub-oppervlakken die zichtbaar zijn voor eigenaars. Bezwaren moeten uitleggen
wat er is gewijzigd of waarom de markering onjuist is.

## Moderatieblokkades

Wanneer de statische scanner een geüploade skill als kwaadaardig markeert, wordt
de uitgever automatisch onder een moderatieblokkade geplaatst
(`requiresModerationAt` ingesteld op de gebruiker). Dit verbergt alle skills van
de uitgever, zorgt ervoor dat toekomstige publicaties verborgen beginnen, en
maakt een `user.moderation.auto` auditlogvermelding aan.

Statische verdachte bevindingen worden bewaard als bestands-/regelbewijs voor
moderators, maar ze verbergen op zichzelf geen inhoud en bepalen niet zelfstandig
het openbare scanoordeel. Nieuwe uploads blijven in beoordelings-/pending-status
totdat de VirusTotal- en LLM-beoordelingen zijn afgerond; statisch scannen
blokkeert alleen onmiddellijk bij kwaadaardige signatures. ClawScan
LLM-beoordelingen behouden doelgerichte notities als leidraad; ze geven alleen
een Review/suspicious-oordeel terug wanneer de gestructureerde beoordeling een
materiële zorg bevat.

Admins kunnen een fout-positieve blokkade opheffen:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dit wist `requiresModerationAt` en `requiresModerationReason`, herstelt skills
die door de blokkade op gebruikersniveau waren verborgen, en schrijft een
`user.moderation.lift` auditlogvermelding. Skills die om andere redenen verborgen
zijn, of waarvan de eigen statische scan kwaadaardig blijft, blijven verborgen.

## Bans en accountstatus

Accounts die ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig
misbruik kan leiden tot accountbans, intrekking van tokens, verborgen inhoud of
verwijderde vermeldingen.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens
gebruiken. Als CLI-authenticatie na een accountmaatregel begint te mislukken,
meld je dan aan bij de web-UI om de accountstatus te bekijken of neem contact op
met maintainers via het verwachte supportkanaal van het project.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs nauwkeurig
- declareer vereiste omgevingsvariabelen en machtigingen
- vermijd verhulde installatiecommando's
- link naar de bron waar mogelijk
- gebruik dry runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over pakketgedrag
