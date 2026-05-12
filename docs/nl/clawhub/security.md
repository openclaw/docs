---
read_when:
    - ClawHub-scan- en moderatieresultaten begrijpen
    - Een vaardigheid of pakket melden
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
summary: Gedrag voor vertrouwen, scans, rapportage en moderatie van ClawHub.
x-i18n:
    generated_at: "2026-05-12T04:10:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Beveiliging + moderatie

ClawHub staat open voor publicatie, maar openbare vermeldingen gaan nog steeds door vertrouwens-, scan-, rapportage- en moderatiecontroles. Het doel is praktisch: gebruikers helpen inspecteren wat ze installeren, uitgevers een herstelpad bieden voor fout-positieven en schadelijke pakketten buiten openbare ontdekking houden.

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

## Scantoestanden

ClawHub kan scan- of moderatieresultaten tonen op openbare pagina's en in diagnostiek die zichtbaar is voor eigenaren.

Veelvoorkomende resultaten zijn:

- `clean`: er is geen blokkerend probleem gevonden.
- `suspicious`: de release vereist voorzichtigheid of beoordeling.
- `malicious`: de release wordt als onveilig beschouwd.
- `pending`: controles zijn nog niet voltooid.
- `held`, `quarantined`, `revoked` of `hidden`: de release is niet volledig beschikbaar op openbare installatie-oppervlakken.

De exacte formulering kan per oppervlak verschillen, maar de praktische betekenis is hetzelfde: als een release wordt vastgehouden of geblokkeerd, moeten gebruikers deze niet installeren totdat de eigenaar het probleem oplost of moderatie deze herstelt.

## Skills

Skill-scans bekijken de gepubliceerde skill-bundel, metadata, opgegeven vereisten en verdachte instructies.

ClawHub let in het bijzonder op verschillen tussen wat een skill declareert en wat deze lijkt te doen. Een skill die bijvoorbeeld verwijst naar een vereiste API-sleutel, moet die vereiste declareren in `SKILL.md`, zodat gebruikers dit vóór installatie kunnen zien.

Scanbevindingen zijn gebaseerd op artefacten. Verwacht providergedrag, zoals gedeclareerde API-referenties, localhost-OAuth-callbacks, opgeschoonde scoped verwijdering, Basic Auth-codering of door de gebruiker geselecteerde bestandsuploads naar de vermelde provider, wordt anders behandeld dan verborgen doorsturen van referenties, brede toegang tot privébestanden, ongerelateerde netwerkbestemmingen of heimelijk browsermisbruik.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugin-releases bevatten pakketmetadata, bronvermelding, compatibiliteitsvelden en informatie over artefactintegriteit.

OpenClaw controleert compatibiliteit voordat door ClawHub gehoste plugins worden geïnstalleerd. Pakketrecords kunnen ook digest-metadata tonen, zodat OpenClaw gedownloade artefacten kan verifiëren. ClawScan neemt gedeclareerde pakketmetadata voor `openclaw.environment` env/config mee bij het beoordelen van plugin-releases, zodat gedeclareerde runtimevereisten worden vergeleken met waargenomen gedrag.

## Rapporten

Ingelogde gebruikers kunnen skills, pakketten en opmerkingen rapporteren.

Rapporten moeten specifiek en uitvoerbaar zijn. Misbruik van rapportage kan zelf leiden tot accountmaatregelen.

Voorbeelden van rapporten:

- misleidende metadata
- niet-gedeclareerde vereisten voor referenties of machtigingen
- verdachte installatie-instructies
- scamopmerkingen of imitatie
- registraties te kwader trouw of misbruik van handelsmerken
- inhoud die [Acceptabel gebruik](/nl/clawhub/acceptable-usage) schendt

## ClawScan-opmerkingen voor uitgevers

Uitgevers kunnen een optionele ClawScan-opmerking opgeven bij het publiceren van een skill of plugin. Deze opmerking geeft ClawScan context voor gedrag dat anders ongebruikelijk kan lijken, zoals netwerktoegang, toegang tot native hosts of providerspecifieke referenties.

## Moderatieholds

Wanneer de statische scanner een geüploade skill als kwaadaardig markeert, wordt de uitgever automatisch onder een moderatiehold geplaatst (`requiresModerationAt` ingesteld op de gebruiker). Hierdoor worden alle skills van de uitgever verborgen, starten toekomstige publicaties verborgen en wordt een `user.moderation.auto`-auditlogvermelding aangemaakt.

Statische verdachte bevindingen worden bewaard als bestands-/regelbewijs voor moderators, maar ze verbergen zelf geen inhoud en bepalen niet zelfstandig het openbare scanverdict. Nieuwe uploads blijven in de review-/pending-status totdat de LLM-review is afgerond. Statische scanning blokkeert alleen direct bij kwaadaardige signatures. VirusTotal-enginehits blijven zichtbaar beveiligingsbewijs, maar VirusTotal Code Insight/Palm-verdicts zijn adviserend en verbergen skills niet zelfstandig. ClawScan LLM-reviews behouden doelgerichte opmerkingen als richtlijn. Medium reviewbevindingen blijven zichtbaar op het artefact, terwijl het verdachte filter is gereserveerd voor LLM-zorgen met hoge impact, kwaadaardige bevindingen of bevestigde AV-engine-detecties.

Beheerders kunnen een fout-positieve hold opheffen:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dit wist `requiresModerationAt` en `requiresModerationReason`, herstelt skills die door de hold op gebruikersniveau zijn verborgen, en schrijft een `user.moderation.lift`-auditlogvermelding. Skills die om andere redenen zijn verborgen, of waarvan de eigen statische scan kwaadaardig blijft, blijven verborgen.

## Bans en accountstatus

Accounts die het ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik kan leiden tot accountbans, tokenintrekking, verborgen inhoud of verwijderde vermeldingen.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-authenticatie begint te falen na een accountmaatregel, meld je dan aan bij de web-UI om de accountstatus te bekijken. Als aanmelden of normale CLI-toegang is geblokkeerd, neem dan contact op met security@openclaw.ai voor herstelbeoordeling.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en gebruikersvertrouwen te vergroten:

- houd namen, samenvattingen, tags en changelogs accuraat
- declareer vereiste omgevingsvariabelen en machtigingen
- voeg een ClawScan-opmerking voor uitgevers toe wanneer een release ongebruikelijk maar bedoeld gedrag heeft
- vermijd verhulde installatieopdrachten
- link waar mogelijk naar de bron
- gebruik dry runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over pakketgedrag
