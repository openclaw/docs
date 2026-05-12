---
read_when:
    - ClawHub-scan- en moderatieresultaten begrijpen
    - Een skill of pakket melden
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
summary: Vertrouwens-, scan-, rapportage- en moderatiegedrag van ClawHub.
x-i18n:
    generated_at: "2026-05-12T08:44:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Beveiliging + Moderatie

ClawHub staat open voor publiceren, maar openbare vermeldingen gaan nog steeds door vertrouwens-, scan-, rapportage- en moderatiecontroles. Het doel is praktisch: gebruikers helpen te inspecteren wat ze installeren, uitgevers een herstelpad bieden voor fout-positieven, en misbruikende pakketten buiten openbare ontdekking houden.

Zie ook [Acceptabel gebruik](/nl/clawhub/acceptable-usage).

## Wat gebruikers kunnen inspecteren

Controleer vóór het installeren van een skill of plugin de ClawHub-vermelding op:

- eigenaar en bronvermelding
- nieuwste versie en changelog
- vereiste omgevingsvariabelen of machtigingen
- compatibiliteitsmetadata voor plugins
- scan- of moderatiestatus
- rapporten, opmerkingen, sterren, downloads en installatiesignalen waar weergegeven

Installeer alleen content die je begrijpt en vertrouwt.

## Scanstatussen

ClawHub kan scan- of moderatie-uitkomsten tonen op openbare pagina's en in diagnoses die zichtbaar zijn voor eigenaren.

Veelvoorkomende uitkomsten zijn:

- `clean`: er is geen blokkerend probleem gevonden.
- `suspicious`: de release vereist voorzichtigheid of beoordeling.
- `malicious`: de release wordt als onveilig beschouwd.
- `pending`: controles zijn nog niet afgerond.
- `held`, `quarantined`, `revoked` of `hidden`: de release is niet volledig beschikbaar op openbare installatie-oppervlakken.

De exacte bewoording kan per oppervlak verschillen, maar de praktische betekenis is hetzelfde: als een release wordt vastgehouden of geblokkeerd, moeten gebruikers deze niet installeren totdat de eigenaar het probleem oplost of moderatie de release herstelt.

## Skills

Skill-scans bekijken de gepubliceerde skill-bundel, metadata, opgegeven vereisten en verdachte instructies.

ClawHub let speciaal op verschillen tussen wat een skill opgeeft en wat deze lijkt te doen. Een skill die bijvoorbeeld verwijst naar een vereiste API-sleutel, moet die vereiste in `SKILL.md` opgeven zodat gebruikers dit vóór installatie kunnen zien.

Scanbevindingen zijn artefactgebaseerd. Verwacht providergedrag, zoals opgegeven API-referenties, localhost-OAuth-callbacks, opgeschoonde verwijdering binnen scope, Basic Auth-codering of door de gebruiker geselecteerde bestandsuploads naar de opgegeven provider, wordt anders behandeld dan verborgen doorsturen van referenties, brede toegang tot privébestanden, niet-gerelateerde netwerkbestemmingen of heimelijk browsermisbruik.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugin-releases bevatten pakketmetadata, bronvermelding, compatibiliteitsvelden en informatie over artefactintegriteit.

OpenClaw controleert compatibiliteit voordat door ClawHub gehoste plugins worden geïnstalleerd. Pakketrecords kunnen ook digest-metadata tonen zodat OpenClaw gedownloade artefacten kan verifiëren. ClawScan neemt opgegeven pakketmetadata voor `openclaw.environment` env/config mee bij het beoordelen van plugin-releases, zodat opgegeven runtimevereisten worden vergeleken met waargenomen gedrag.

## Rapporten

Ingelogde gebruikers kunnen skills, pakketten en opmerkingen rapporteren.

Rapporten moeten specifiek en uitvoerbaar zijn. Misbruik van rapportage kan zelf leiden tot accountmaatregelen.

Voorbeelden van rapporten:

- misleidende metadata
- niet-opgegeven vereisten voor referenties of machtigingen
- verdachte installatie-instructies
- scamreacties of imitatie
- registraties te kwader trouw of misbruik van handelsmerken
- content die [Acceptabel gebruik](/nl/clawhub/acceptable-usage) schendt

## ClawScan-notities voor uitgevers

Uitgevers kunnen een optionele ClawScan-notitie opgeven bij het publiceren van een skill of plugin. Deze notitie geeft ClawScan context voor gedrag dat anders ongebruikelijk kan lijken, zoals netwerktoegang, toegang tot de native host of providerspecifieke referenties.

## Moderatieblokkades

Wanneer de statische scanner een geüploade skill als kwaadaardig markeert, wordt de uitgever automatisch onder een moderatieblokkade geplaatst (`requiresModerationAt` ingesteld op de gebruiker). Dit verbergt alle skills van de uitgever, zorgt ervoor dat toekomstige publicaties verborgen starten, en maakt een auditlogvermelding `user.moderation.auto`.

Statische verdachte bevindingen worden bewaard als bestands-/regelbewijs voor moderators, maar ze verbergen content niet en bepalen niet zelfstandig het openbare scanverdict. Nieuwe uploads blijven in beoordelings-/wachtende status totdat de LLM-beoordeling is afgerond. Statische scanning blokkeert alleen onmiddellijk bij kwaadaardige signatures. VirusTotal-enginehits blijven zichtbaar beveiligingsbewijs, maar VirusTotal Code Insight/Palm-verdicts zijn adviserend en verbergen skills niet zelfstandig. ClawScan LLM-beoordelingen behouden doelgerichte notities als richtlijn. Bevindingen met gemiddelde beoordeling blijven zichtbaar op het artefact, terwijl het verdachte filter is gereserveerd voor LLM-zorgen met grote impact, kwaadaardige bevindingen of bevestigde AV-enginedetecties.

Beheerders kunnen een fout-positieve blokkade opheffen:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dit wist `requiresModerationAt` en `requiresModerationReason`, herstelt skills die door de blokkade op gebruikersniveau verborgen waren, en schrijft een auditlogvermelding `user.moderation.lift`. Skills die om andere redenen verborgen zijn, of waarvan de eigen statische scan kwaadaardig blijft, blijven verborgen.

## Bans en accountstatus

Accounts die het ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik kan leiden tot accountbans, tokenintrekking, verborgen content of verwijderde vermeldingen.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-authenticatie begint te mislukken na een accountmaatregel, log dan in op de web-UI om de accountstatus te bekijken. Als inloggen of normale CLI-toegang is geblokkeerd, neem dan contact op met security@openclaw.ai voor herstelbeoordeling.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs nauwkeurig
- geef vereiste omgevingsvariabelen en machtigingen op
- voeg een ClawScan-notitie voor uitgevers toe wanneer een release ongebruikelijk maar bedoeld gedrag heeft
- vermijd verhulde installatiecommando's
- link naar de bron waar mogelijk
- gebruik dry runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over pakketgedrag
