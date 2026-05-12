---
read_when:
    - ClawHub-scan- en moderatieresultaten begrijpen
    - Een skill of pakket rapporteren
    - Herstellen van een vastgehouden, verborgen of geblokkeerde vermelding
summary: Vertrouwens-, scan-, rapportage- en moderatiegedrag van ClawHub.
x-i18n:
    generated_at: "2026-05-12T23:29:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Beveiliging + Moderatie

ClawHub staat open voor publicatie, maar openbare vermeldingen gaan nog steeds door vertrouwens-, scan-, rapportage- en moderatiecontroles. Het doel is praktisch: gebruikers helpen inspecteren wat ze installeren, uitgevers een herstelpad geven voor fout-positieven, en misbruikende pakketten buiten openbare ontdekking houden.

Zie ook [Aanvaardbaar gebruik](/nl/clawhub/acceptable-usage).

## Wat gebruikers kunnen inspecteren

Controleer vóór het installeren van een skill of plugin de ClawHub-vermelding op:

- eigenaar en bronvermelding
- nieuwste versie en changelog
- vereiste omgevingsvariabelen of machtigingen
- compatibiliteitsmetadata voor plugins
- scan- of moderatiestatus
- meldingen, reacties, sterren, downloads en installatiesignalen waar weergegeven

Installeer alleen inhoud die je begrijpt en vertrouwt.

## Scanstatussen

ClawHub kan scan- of moderatieresultaten tonen op openbare pagina's en in diagnostiek die zichtbaar is voor eigenaars.

Veelvoorkomende resultaten zijn:

- `clean`: er is geen blokkerend probleem gevonden.
- `suspicious`: de release vereist voorzichtigheid of beoordeling.
- `malicious`: de release wordt als onveilig beschouwd.
- `pending`: controles zijn nog niet voltooid.
- `held`, `quarantined`, `revoked` of `hidden`: de release is niet volledig beschikbaar op openbare installatieoppervlakken.

De exacte formulering kan per oppervlak verschillen, maar de praktische betekenis is hetzelfde: als een release wordt vastgehouden of geblokkeerd, moeten gebruikers deze niet installeren totdat de eigenaar het probleem oplost of moderatie deze herstelt.

## Skills

Skill-scans bekijken de gepubliceerde skill-bundel, metadata, opgegeven vereisten en verdachte instructies.

ClawHub besteedt speciale aandacht aan verschillen tussen wat een skill opgeeft en wat deze lijkt te doen. Een skill die bijvoorbeeld verwijst naar een vereiste API-sleutel, moet die vereiste opgeven in `SKILL.md` zodat gebruikers dit vóór installatie kunnen zien.

Scanbevindingen zijn gebaseerd op artefacten. Verwacht providergedrag, zoals opgegeven API-inloggegevens, localhost-OAuth-callbacks, opruiming bij verwijderen binnen de scope, Basic Auth-codering, of door de gebruiker geselecteerde bestandsuploads naar de opgegeven provider, wordt anders behandeld dan verborgen doorsturen van inloggegevens, brede toegang tot privébestanden, niet-gerelateerde netwerkbestemmingen of heimelijk browsermisbruik.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugin-releases bevatten pakketmetadata, bronvermelding, compatibiliteitsvelden en informatie over artefactintegriteit.

OpenClaw controleert compatibiliteit voordat door ClawHub gehoste plugins worden geïnstalleerd. Pakketrecords kunnen ook digest-metadata beschikbaar maken zodat OpenClaw gedownloade artefacten kan verifiëren. ClawScan neemt opgegeven pakketmetadata voor `openclaw.environment` env/config mee bij het beoordelen van plugin-releases, zodat opgegeven runtimevereisten worden vergeleken met waargenomen gedrag.

## Meldingen

Ingelogde gebruikers kunnen skills, pakketten en reacties melden.

Meldingen moeten specifiek en uitvoerbaar zijn. Misbruik van rapportage kan zelf leiden tot accountmaatregelen.

Voorbeelden van meldingen:

- misleidende metadata
- niet-opgegeven vereisten voor inloggegevens of machtigingen
- verdachte installatie-instructies
- scamreacties of impersonatie
- registraties te kwader trouw of misbruik van handelsmerken
- inhoud die [Aanvaardbaar gebruik](/nl/clawhub/acceptable-usage) schendt

## ClawScan-notities voor uitgevers

Uitgevers kunnen een optionele ClawScan-notitie toevoegen bij het publiceren van een skill of plugin. Deze notitie geeft ClawScan context voor gedrag dat anders ongebruikelijk kan lijken, zoals netwerktoegang, toegang tot native hosts of providerspecifieke inloggegevens.

## Moderatieblokkades

Wanneer de statische scanner een geüploade skill als kwaadaardig markeert, wordt de uitgever automatisch onder een moderatieblokkade geplaatst (`requiresModerationAt` ingesteld op de gebruiker). Hierdoor worden alle skills van de uitgever verborgen, starten toekomstige publicaties verborgen, en wordt een auditlogvermelding `user.moderation.auto` gemaakt.

Statische verdachte bevindingen worden bewaard als bestands-/regelbewijs voor moderators, maar verbergen inhoud niet en bepalen op zichzelf niet het openbare scanoordeel. Nieuwe uploads blijven in de beoordelings-/pending-status totdat de LLM-beoordeling is afgerond. Statisch scannen blokkeert alleen onmiddellijk bij kwaadaardige signatures. VirusTotal-enginehits blijven zichtbaar beveiligingsbewijs, maar VirusTotal Code Insight/Palm-oordelen zijn adviserend en verbergen skills niet op zichzelf. ClawScan LLM-beoordelingen behouden doelgerichte notities als richtlijn. Middelzware beoordelingsbevindingen blijven zichtbaar op het artefact, terwijl het verdachte filter is gereserveerd voor LLM-zorgen met grote impact, kwaadaardige bevindingen of bevestigde AV-enginedetecties.

Beheerders kunnen een fout-positieve blokkade opheffen:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Dit wist `requiresModerationAt` en `requiresModerationReason`, herstelt skills die door de blokkade op gebruikersniveau verborgen waren, en schrijft een auditlogvermelding `user.moderation.lift`. Skills die om andere redenen verborgen zijn, of waarvan de eigen statische scan kwaadaardig blijft, blijven verborgen.

## Bans en accountstatus

Accounts die het ClawHub-beleid schenden, kunnen publicatietoegang verliezen. Ernstig misbruik kan leiden tot accountbans, intrekking van tokens, verborgen inhoud of verwijderde vermeldingen.

Verwijderde, gebande of uitgeschakelde accounts kunnen geen ClawHub API-tokens gebruiken. Als CLI-authenticatie na accountmaatregelen begint te mislukken, meld je dan aan bij de web-UI om de accountstatus te bekijken. Als aanmelden of normale CLI-toegang is geblokkeerd, neem dan contact op met security@openclaw.ai voor herstelbeoordeling.

## Richtlijnen voor uitgevers

Om fout-positieven te verminderen en gebruikersvertrouwen te verbeteren:

- houd namen, samenvattingen, tags en changelogs nauwkeurig
- geef vereiste omgevingsvariabelen en machtigingen op
- voeg een ClawScan-notitie voor uitgevers toe wanneer een release ongebruikelijk maar bedoeld gedrag heeft
- vermijd verhulde installatiecommando's
- link naar de bron wanneer mogelijk
- gebruik dry-runs voordat je plugins publiceert
- reageer duidelijk als gebruikers of moderators vragen stellen over pakketgedrag
