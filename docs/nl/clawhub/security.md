---
read_when:
    - Inzicht in ClawHub-scan- en moderatieresultaten
    - Een skill of pakket melden
    - Herstellen van een aangehouden, verborgen of geblokkeerde vermelding
summary: ClawHub-gedrag voor vertrouwen, scans, rapportage en moderatie.
x-i18n:
    generated_at: "2026-05-12T15:43:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Beveiliging + moderatie

ClawHub staat open voor publicatie, maar openbare vermeldingen doorlopen nog steeds
vertrouwens-, scan-, rapportage- en moderatiecontroles. Het doel is praktisch: gebruikers helpen
inspecteren wat ze installeren, uitgevers een herstelpad bieden voor fout-positieven,
en misbruikmakende pakketten buiten openbare ontdekking houden.

Zie ook [Acceptabel gebruik](/nl/clawhub/acceptable-usage).

## Wat gebruikers kunnen inspecteren

Controleer vóór het installeren van een Skill of plugin de ClawHub-vermelding op:

- eigenaar en bronvermelding
- nieuwste versie en changelog
- vereiste omgevingsvariabelen of machtigingen
- compatibiliteitsmetadata voor plugins
- scan- of moderatiestatus
- rapporten, reacties, sterren, downloads en installatiesignalen waar getoond

Installeer alleen inhoud die je begrijpt en vertrouwt.

## Scanstatussen

ClawHub kan scan- of moderatieresultaten tonen op openbare pagina's en in
diagnostiek die zichtbaar is voor eigenaren.

Veelvoorkomende resultaten zijn:

- `clean`: er is geen blokkerend probleem gevonden.
- `suspicious`: de release vereist voorzichtigheid of beoordeling.
- `malicious`: de release wordt als onveilig beschouwd.
- `pending`: controles zijn nog niet voltooid.
- `held`, `quarantined`, `revoked` of `hidden`: de release is niet volledig
  beschikbaar op openbare installatieoppervlakken.

De exacte bewoording kan per oppervlak verschillen, maar de praktische betekenis
is hetzelfde: als een release wordt vastgehouden of geblokkeerd, moeten gebruikers
deze niet installeren totdat de eigenaar het probleem oplost of moderatie deze herstelt.

## Skills

Skill-scans bekijken de gepubliceerde Skill-bundel, metadata, gedeclareerde
vereisten en verdachte instructies.

ClawHub let vooral op verschillen tussen wat een Skill declareert en wat deze
lijkt te doen. Een Skill die bijvoorbeeld verwijst naar een vereiste API-sleutel,
moet die vereiste declareren in `SKILL.md`, zodat gebruikers dit vóór installatie
kunnen zien.

Scanbevindingen zijn gebaseerd op artefacten. Verwacht providergedrag, zoals gedeclareerde
API-referenties, localhost-OAuth-callbacks, opgeschoonde verwijdering binnen scope, Basic Auth-
codering of door de gebruiker geselecteerde bestandsuploads naar de vermelde provider, wordt
anders behandeld dan verborgen doorsturen van referenties, brede toegang tot privébestanden,
ongerelateerde netwerkbestemmingen of heimelijk browsermisbruik.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugin-releases bevatten pakketmetadata, bronvermelding, compatibiliteitsvelden
en informatie over artefactintegriteit.

OpenClaw controleert compatibiliteit voordat het door ClawHub gehoste plugins installeert.
Pakketrecords kunnen ook digestmetadata blootstellen, zodat OpenClaw gedownloade
artefacten kan verifiëren. ClawScan neemt gedeclareerde package-`openclaw.environment` env/config-
metadata mee bij het beoordelen van plugin-releases, zodat gedeclareerde runtimevereisten
worden vergeleken met waargenomen gedrag.

## Rapporten

Ingelogde gebruikers kunnen Skills, pakketten en reacties rapporteren.

Rapporten moeten specifiek en uitvoerbaar zijn. Misbruik van rapportage kan zelf
leiden tot accountmaatregelen.

Voorbeelden van rapporten:

- misleidende metadata
- niet-gedeclareerde vereisten voor referenties of machtigingen
- verdachte installatie-instructies
- oplichtingsreacties of impersonatie
- registraties te kwader trouw of misbruik van handelsmerken
- inhoud die [Acceptabel gebruik](/nl/clawhub/acceptable-usage) schendt

## ClawScan-opmerkingen voor uitgevers

Uitgevers kunnen een optionele ClawScan-opmerking toevoegen bij het publiceren van een Skill of
plugin. Deze opmerking geeft ClawScan context voor gedrag dat anders ongebruikelijk
kan lijken, zoals netwerktoegang, toegang tot een native host of provider-specifieke
referenties.

## Moderatieblokkades

Wanneer de statische scanner een geüploade Skill als kwaadaardig markeert, wordt de uitgever
automatisch onder een moderatieblokkade geplaatst (`requiresModerationAt` ingesteld op de
gebruiker). Dit verbergt alle Skills van de uitgever, zorgt ervoor dat toekomstige publicaties
verborgen starten, en maakt een auditlogvermelding `user.moderation.auto` aan.

Statische verdachte bevindingen worden bewaard als bestands-/regelbewijs voor moderators,
maar ze verbergen inhoud niet en bepalen niet zelfstandig het openbare scanoordeel.
Nieuwe uploads blijven in de status beoordeling/in afwachting totdat de LLM-beoordeling is afgerond.
Statisch scannen blokkeert alleen direct bij kwaadaardige signatures. Hits van VirusTotal-engines
blijven zichtbaar beveiligingsbewijs, maar VirusTotal Code Insight/Palm-
oordelen zijn adviserend en verbergen Skills niet zelfstandig. ClawScan LLM-beoordelingen
behouden doelgerichte opmerkingen als richtlijn. Gemiddelde beoordelingsbevindingen blijven zichtbaar op
het artefact, terwijl het verdachte filter is gereserveerd voor LLM-zorgen met hoge impact,
kwaadaardige bevindingen of bevestigde detecties door AV-engines.

Beheerders kunnen een fout-positieve blokkade opheffen:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dit wist `requiresModerationAt` en `requiresModerationReason`, herstelt
Skills die door de blokkade op gebruikersniveau waren verborgen, en schrijft een auditlogvermelding
`user.moderation.lift`. Skills die om andere redenen verborgen zijn, of waarvan de eigen statische
scan kwaadaardig blijft, blijven verborgen.

## Bans en accountstatus

Accounts die het ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik
kan leiden tot accountbans, intrekking van tokens, verborgen inhoud of verwijderde
vermeldingen.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-auth
begint te mislukken na accountmaatregelen, meld je dan aan bij de web-UI om de
accountstatus te bekijken. Als aanmelden of normale CLI-toegang is geblokkeerd, neem dan contact op met
security@openclaw.ai voor herstelbeoordeling.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en het vertrouwen van gebruikers te verbeteren:

- houd namen, samenvattingen, tags en changelogs accuraat
- declareer vereiste omgevingsvariabelen en machtigingen
- voeg een ClawScan-opmerking voor uitgevers toe wanneer een release ongebruikelijk maar bedoeld gedrag heeft
- vermijd verhulde installatiecommando's
- link waar mogelijk naar de bron
- gebruik dry runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over pakketgedrag
