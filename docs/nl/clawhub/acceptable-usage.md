---
read_when:
    - Uploads beoordelen op misbruik of beleidsschendingen
    - Moderatiedocumentatie of runbooks voor reviewers schrijven
    - Beslissen of een skill verborgen moet worden of een gebruiker geblokkeerd moet worden
sidebarTitle: Acceptable Usage
summary: 'Marktplaatsbeleid: wat ClawHub toestaat en wat het niet host.'
title: Acceptabel gebruik
x-i18n:
    generated_at: "2026-07-04T10:50:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar gebruik

ClawHub host Skills, plugins, pakketten en marketplace-metadata voor OpenClaw.
Gebruik deze pagina om te bepalen of content of publicatiegedrag thuishoort op
ClawHub.

Deze regels gelden voor wat een vermelding doet, wat deze gebruikers vraagt uit te voeren, hoe deze
zichzelf presenteert en hoe uitgevers de discovery-, installatie- en
vertrouwensoppervlakken van ClawHub gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/clawhub/moderation). Zie voor auteursrecht of andere rechtenclaims
[Verzoeken over contentrechten](/nl/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw gepubliceerd is.

| Categorie                                        | Toegestaan wanneer                                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                | De vermelding gebruikers helpt software te bouwen, testen, migreren, debuggen, documenteren of beheren.                           |
| UI-, data- en automatiseringsworkflows           | De scope duidelijk is, vereiste credentials expliciet zijn en risicovolle acties review-, dry-run-, preview- of bevestigingspaden bevatten. |
| Defensieve beveiliging, moderatie en misbruikreview | De tool is bedoeld voor geautoriseerde review, bewijs bewaart en grenzen voor menselijke goedkeuring duidelijk houdt.            |
| Persoonlijke of teamworkflows                    | De workflow accounts op basis van toestemming, transparante setup en expliciete machtigingen gebruikt.                            |
| Onderhouden catalogi                             | Elke vermelding onderscheidend, nuttig, accuraat beschreven en redelijk onderhouden is.                                            |

Context is belangrijk. Hetzelfde onderwerp kan aanvaardbaar zijn in een nauwe defensieve of
op toestemming gebaseerde setting en onaanvaardbaar wanneer het als misbruikworkflow wordt verpakt.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of rechteninbreuk is.

| Categorie                                                   | Niet toegestaan                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ongeautoriseerde toegang of beveiligingsomzeiling           | Auth-omzeiling, accountovername, misbruik van rate limits, live call- of agentovername, herbruikbare sessiediefstal of het automatisch goedkeuren van pairing-flows voor niet-goedgekeurde gebruikers.                                                                                                      |
| Platformmisbruik en omzeiling van bans                      | Stealth-accounts na bans, account-warming of -farming, nepengagement, automatisering met meerdere accounts, massaal posten, spambots of automatisering die is gebouwd om detectie te vermijden.                                                                                                             |
| Fraude, scams en misleidende financiële workflows           | Nepcertificaten of -facturen, misleidende betaalflows, scam-outreach, nep-sociaal bewijs, workflows met synthetische identiteit voor fraude of tools voor uitgaven/afschrijvingen zonder duidelijke menselijke goedkeuring.                                                                                 |
| Privacy-invasieve verrijking of surveillance                | Contacten scrapen voor spam, doxxing, stalking, leadextractie gekoppeld aan ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming of gebruik van gelekte data of breach-dumps.                                                                                              |
| Impersonatie of identiteitsmanipulatie zonder toestemming   | Face swap, digitale tweelingen, gekloonde influencers, neppersona's of andere tooling die wordt gebruikt om iemand na te doen of te misleiden.                                                                                                                                                              |
| Expliciete seksuele content of adult-generatie met uitgeschakelde veiligheidsfuncties | NSFW-afbeeldings-, video- of contentgeneratie; adult-content-wrappers rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                               |
| Verborgen, onveilige of misleidende uitvoeringsvereisten    | Verduisterde installatiecommando's, pipe-to-shell-installers zoals gedownloade content die met `sh` of `bash` wordt uitgevoerd zonder duidelijke reviewbaarheid, niet-vermelde vereisten voor secrets of private keys, remote `npx @latest`-uitvoering zonder duidelijke reviewbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Materiaal dat auteursrecht schendt of rechten schendt       | Het opnieuw publiceren van iemands anders skill, plugin, docs, brand assets of propriëtaire code zonder toestemming; het schenden van licentievoorwaarden; of het nadoen van de oorspronkelijke auteur of uitgever.                                                                                         |

## Niet-toegestaan marketplace-gedrag

ClawHub beoordeelt ook hoe uitgevers de marketplace gebruiken. Gebruik ClawHub niet om
discovery, statistieken, vertrouwenssignalen, moderatiesystemen of
gebruikersaandacht te manipuleren.

Niet-toegestaan marketplace-gedrag omvat:

- grote aantallen low-effort, duplicatieve, placeholder- of
  machinegegenereerde vermeldingen in bulk publiceren die geen echte gebruikerswaarde lijken te hebben
- zoek- of categorieoppervlakken overspoelen met bijna identieke Skills of plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvol onderscheid
- installs, downloads, sterren of andere engagementstatistieken kunstmatig verhogen
  via automatisering, self-install-loops, nepaccounts, gecoördineerde
  activiteit, betaald engagement of ander niet-organisch gedrag
- accounts aanmaken of roteren om moderatie, bans, uitgeverslimieten of
  marketplace-review te omzeilen
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of verbondenheid met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al verborgen, verwijderd of geblokkeerd is
  zonder het onderliggende probleem op te lossen

Publiceren op hoog volume is niet automatisch misbruik. Grote catalogi zijn aanvaardbaar
wanneer de vermeldingen betekenisvol verschillen, accuraat beschreven zijn, onderhouden worden
en door echte gebruikers worden gebruikt. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume gepaard gaat met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als je denkt dat content op ClawHub inbreuk maakt op je auteursrecht of andere rechten, gebruik dan
[Verzoeken over contentrechten](/nl/clawhub/content-rights). Gebruik normale marketplace-
rapporten niet voor auteursrecht- of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Review en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersrapporten en
staff review gebruiken om onveilige content of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub te bepalen wat review nodig heeft.

We kunnen:

- overtredende vermeldingen verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installs blokkeren voor onveilige releases
- API-tokens intrekken
- gekoppelde content soft-deleten
- publicatietoegang beperken
- recidivisten of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor rapporten, moderatieholds,
verborgen vermeldingen, bans en accountstatus.
