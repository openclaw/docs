---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of reviewer-runbooks schrijven
    - Beslissen of een skill verborgen moet worden of een gebruiker moet worden verbannen
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet host.'
title: Acceptabel gebruik
x-i18n:
    generated_at: "2026-07-01T13:08:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Acceptabel gebruik

ClawHub host Skills, plugins, pakketten en marktplaatsmetadata voor OpenClaw.
Gebruik deze pagina om te bepalen of content of publicatiegedrag thuishoort op
ClawHub.

Deze regels gelden voor wat een vermelding doet, wat die gebruikers vraagt uit te voeren, hoe die
zichzelf presenteert en hoe uitgevers de ontdekkings-, installatie- en
vertrouwensoppervlakken van ClawHub gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/clawhub/moderation). Zie voor auteursrechtelijke of andere rechtenclaims
[Verzoeken om contentrechten](/nl/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw
gepubliceerd is.

| Categorie                                         | Toegestaan wanneer                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                           | De vermelding helpt gebruikers software te bouwen, testen, migreren, debuggen, documenteren of beheren.                                               |
| UI-, data- en automatiseringsworkflows               | De scope is duidelijk, vereiste referenties zijn expliciet, en risicovolle acties bevatten paden voor beoordeling, dry-run, preview of bevestiging. |
| Defensieve beveiliging, moderatie en beoordeling van misbruik | De tool is gepositioneerd voor geautoriseerde beoordeling, bewaart bewijs en houdt grenzen voor menselijke goedkeuring duidelijk.                          |
| Persoonlijke of teamworkflows                       | De workflow gebruikt op toestemming gebaseerde accounts, transparante setup en expliciete machtigingen.                                            |
| Onderhouden catalogi                              | Elke vermelding is onderscheidend, nuttig, nauwkeurig beschreven en redelijkerwijs onderhouden.                                                |

Context is belangrijk. Hetzelfde onderwerp kan acceptabel zijn in een beperkte defensieve of
op toestemming gebaseerde context en onacceptabel wanneer het als misbruikworkflow wordt verpakt.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of inbreuk op rechten is.

| Categorie                                                    | Niet toegestaan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of beveiligingsomzeiling                      | Auth-omzeiling, accountovername, misbruik van rate limits, overname van live calls of agents, herbruikbare sessiediefstal, of het automatisch goedkeuren van pairing-flows voor niet-goedgekeurde gebruikers.                                                                                                                                                   |
| Platformmisbruik en omzeiling van bans                              | Stealth-accounts na bans, accountopwarming of -farming, nepbetrokkenheid, multi-accountautomatisering, massaal posten, spambots, of automatisering die is gebouwd om detectie te vermijden.                                                                                                                                          |
| Fraude, scams en misleidende financiële workflows             | Valse certificaten of facturen, misleidende betaalflows, scam-outreach, vals sociaal bewijs, workflows met synthetische identiteiten voor fraude, of tools voor uitgeven/incasseren zonder duidelijke menselijke goedkeuring.                                                                                                                    |
| Privacy-invasieve verrijking of surveillance                 | Contacten scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming, of gebruik van gelekte gegevens of breach-dumps.                                                                                                                  |
| Impersonatie of identiteitsmanipulatie zonder toestemming       | Face swap, digitale tweelingen, gekloonde influencers, nep-persona's of andere tooling die wordt gebruikt om iemand te imiteren of te misleiden.                                                                                                                                                                                                 |
| Expliciete seksuele content of adultgeneratie met uitgeschakelde veiligheidsmechanismen | NSFW-afbeeldings-, video- of contentgeneratie; wrappers voor adultcontent rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                                       |
| Verborgen, onveilige of misleidende uitvoeringsvereisten        | Verduisterde installatiecommando's, pipe-to-shell-installers zoals gedownloade content die met `sh` of `bash` wordt uitgevoerd zonder duidelijke beoordeelbaarheid, niet-gedeclareerde vereisten voor secrets of privésleutels, externe uitvoering van `npx @latest` zonder duidelijke beoordeelbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Materiaal dat auteursrechten schendt of rechten overtreedt           | Iemands anders Skill, plugin, docs, merkassets of propriëtaire code zonder toestemming opnieuw publiceren; licentievoorwaarden schenden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                                            |

## Niet-toegestaan marktplaatsgedrag

ClawHub beoordeelt ook hoe uitgevers de marktplaats gebruiken. Gebruik ClawHub niet om
ontdekking, metrics, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht
te manipuleren.

Niet-toegestaan marktplaatsgedrag omvat:

- het bulkgewijs publiceren van grote aantallen low-effort, duplicatieve, placeholder- of
  machinaal gegenereerde vermeldingen die geen echte gebruikerswaarde lijken te hebben
- zoek- of categorieoppervlakken overspoelen met vrijwel identieke Skills of plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- installaties, downloads, sterren of andere engagementmetrics kunstmatig opdrijven
  via automatisering, self-install-loops, nepaccounts, gecoördineerde
  activiteit, betaalde engagement of ander niet-organisch gedrag
- accounts aanmaken of rouleren om moderatie, bans, uitgeverslimieten of
  marktplaatsbeoordeling te omzeilen
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of affiliatie met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem op te lossen

Publiceren op grote schaal is niet automatisch misbruik. Grote catalogi zijn acceptabel
wanneer de vermeldingen betekenisvol verschillen, nauwkeurig beschreven, onderhouden
en door echte gebruikers gebruikt worden. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume wordt gecombineerd met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als je denkt dat content op ClawHub inbreuk maakt op je auteursrecht of andere rechten, gebruik dan
[Verzoeken om contentrechten](/nl/clawhub/content-rights). Gebruik normale marktplaatsmeldingen niet
voor auteursrechtelijke of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Beoordeling en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersmeldingen en
beoordeling door medewerkers gebruiken om onveilige content of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub te bepalen wat beoordeling nodig heeft.

We kunnen:

- overtredende vermeldingen verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installaties voor onveilige releases blokkeren
- API-tokens intrekken
- bijbehorende content soft-deleten
- publicatietoegang beperken
- recidivisten of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor meldingen, moderatieholds,
verborgen vermeldingen, bans en accountstatus.
