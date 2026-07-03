---
read_when:
    - Uploads beoordelen op misbruik of beleidsschendingen
    - Documentatie voor moderatie of draaiboeken voor reviewers schrijven
    - Beslissen of een skill moet worden verborgen of een gebruiker moet worden verbannen
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet zal hosten.'
title: Aanvaardbaar gebruik
x-i18n:
    generated_at: "2026-07-03T23:36:20Z"
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
zichzelf presenteert en hoe uitgevers de vindbaarheids-, installatie- en
vertrouwensoppervlakken van ClawHub gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/clawhub/moderation). Zie voor auteursrecht of andere
rechtenclaims [Verzoeken over contentrechten](/nl/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw is
gepubliceerd.

| Categorie                                        | Toegestaan wanneer                                                                                                               |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                | De vermelding helpt gebruikers software te bouwen, testen, migreren, debuggen, documenteren of beheren.                           |
| UI-, data- en automatiseringsworkflows           | De scope duidelijk is, vereiste referenties expliciet zijn, en risicovolle acties review-, dry-run-, preview- of bevestigingspaden bevatten. |
| Defensieve beveiliging, moderatie en misbruikreview | De tool is gepositioneerd voor geautoriseerde review, bewaart bewijs en houdt grenzen voor menselijke goedkeuring duidelijk.       |
| Persoonlijke of teamworkflows                    | De workflow gebruikt accounts op basis van toestemming, transparante setup en expliciete machtigingen.                            |
| Onderhouden catalogi                             | Elke vermelding is onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden.                                          |

Context is belangrijk. Hetzelfde onderwerp kan aanvaardbaar zijn in een nauwe defensieve of
op toestemming gebaseerde setting en onaanvaardbaar wanneer het is verpakt als een misbruikworkflow.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of inbreuk op rechten is.

| Categorie                                                   | Niet toegestaan                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of omzeiling van beveiliging       | Auth-omzeiling, accountovername, misbruik van rate limits, overname van live calls of agents, herbruikbare sessiediefstal, of het automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                                              |
| Platformmisbruik en banontwijking                           | Stealth-accounts na bans, account warming of farming, nep-engagement, automatisering met meerdere accounts, massaal posten, spambots, of automatisering die is gebouwd om detectie te vermijden.                                                                                                            |
| Fraude, oplichting en misleidende financiële workflows      | Nepcertificaten of -facturen, misleidende betaalflows, scam-outreach, nep sociaal bewijs, workflows met synthetische identiteiten voor fraude, of tools voor uitgeven/incasseren zonder duidelijke menselijke goedkeuring.                                                                                  |
| Privacy-invasieve verrijking of surveillance                | Contacten scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming, of gebruik van gelekte data of breach-dumps.                                                                                           |
| Impersonatie of identiteitsmanipulatie zonder toestemming   | Face swap, digitale tweelingen, gekloonde influencers, nep-persona's of andere tooling die wordt gebruikt om zich voor te doen als iemand anders of te misleiden.                                                                                                                                             |
| Expliciete seksuele content of adultgeneratie met uitgeschakelde veiligheidsmaatregelen | NSFW-afbeeldings-, video- of contentgeneratie; wrappers voor adultcontent rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                    |
| Verborgen, onveilige of misleidende uitvoeringsvereisten    | Versluierde installatiecommando's, pipe-to-shell-installers zoals gedownloade content die met `sh` of `bash` wordt uitgevoerd zonder duidelijke reviewbaarheid, niet-vermelde vereisten voor secrets of private keys, externe `npx @latest`-uitvoering zonder duidelijke reviewbaarheid, of metadata die verbergen wat de vermelding echt nodig heeft om te draaien. |
| Materiaal dat auteursrecht schendt of rechten overtreedt    | Iemands anders Skill, plugin, docs, merkassets of proprietary code opnieuw publiceren zonder toestemming; licentievoorwaarden schenden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                         |

## Niet-toegestaan marketplace-gedrag

ClawHub beoordeelt ook hoe uitgevers de marketplace gebruiken. Gebruik ClawHub niet om
vindbaarheid, metrics, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht
te manipuleren.

Niet-toegestaan marketplace-gedrag omvat:

- het in bulk publiceren van grote aantallen low-effort, duplicatieve, placeholder- of
  machinegegenereerde vermeldingen die geen echte gebruikerswaarde lijken te hebben
- zoek- of categorieoppervlakken overspoelen met vrijwel identieke Skills of plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- installs, downloads, sterren of andere engagementmetrics kunstmatig opblazen
  via automatisering, self-install-loops, nepaccounts, gecoördineerde
  activiteit, betaald engagement of ander niet-organisch gedrag
- accounts aanmaken of roteren om moderatie, bans, uitgeverslimieten of
  marketplace-review te ontwijken
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of affiliatie met een ander project of andere uitgever
- herhaaldelijk content uploaden die al verborgen, verwijderd of geblokkeerd is
  zonder het onderliggende probleem op te lossen

Publiceren in hoog volume is niet automatisch misbruik. Grote catalogi zijn aanvaardbaar
wanneer de vermeldingen betekenisvol verschillen, nauwkeurig zijn beschreven, worden onderhouden
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

- vermeldingen die regels overtreden verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installs blokkeren voor onveilige releases
- API-tokens intrekken
- gekoppelde content soft-deleten
- publicatietoegang beperken
- herhaalde of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor rapporten, moderatieholds,
verborgen vermeldingen, bans en accountstatus.
