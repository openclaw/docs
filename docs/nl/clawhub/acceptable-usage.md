---
read_when:
    - Uploads beoordelen op misbruik of beleidsschendingen
    - Moderatiedocumentatie of beoordelaarsrunbooks schrijven
    - Beslissen of een skill verborgen moet worden of een gebruiker geblokkeerd moet worden
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet zal hosten.'
title: Aanvaardbaar gebruik
x-i18n:
    generated_at: "2026-07-05T07:18:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Acceptabel gebruik

ClawHub host skills, plugins, pakketten en marketplace-metadata voor OpenClaw.
Gebruik deze pagina om te bepalen of content of publicatiegedrag thuishoort op
ClawHub.

Deze regels zijn van toepassing op wat een vermelding doet, wat die gebruikers vraagt uit te voeren, hoe die
zichzelf presenteert en hoe uitgevers ClawHub's discovery-, installatie- en
vertrouwensoppervlakken gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/clawhub/moderation). Zie voor auteursrecht- of andere rechtenclaims
[Verzoeken over contentrechten](/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig en begrijpelijk is en te goeder trouw is
gepubliceerd.

| Categorie                                        | Toegestaan wanneer                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                | De vermelding gebruikers helpt software te bouwen, testen, migreren, debuggen, documenteren of beheren.                                               |
| Workflows voor UI, data en automatisering        | De scope duidelijk is, vereiste inloggegevens expliciet zijn en risicovolle acties beoordelings-, dry-run-, preview- of bevestigingspaden bevatten. |
| Defensieve beveiliging, moderatie en misbruikbeoordeling | De tool is gepositioneerd voor geautoriseerde beoordeling, bewijs bewaart en grenzen voor menselijke goedkeuring duidelijk houdt.                          |
| Persoonlijke of teamworkflows                    | De workflow accounts op basis van toestemming gebruikt, transparante setup heeft en expliciete machtigingen gebruikt.                                            |
| Onderhouden catalogi                             | Elke vermelding is onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden.                                                |

Context is belangrijk. Hetzelfde onderwerp kan acceptabel zijn in een beperkte defensieve of
op toestemming gebaseerde context en onacceptabel wanneer het is verpakt als een misbruikworkflow.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of rechteninbreuk is.

| Categorie                                                   | Niet toegestaan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of beveiligingsomzeiling           | Auth-omzeiling, accountovername, misbruik van rate limits, overname van live calls of agents, herbruikbare sessiediefstal of het automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                                                                                                   |
| Platformmisbruik en het omzeilen van bans                   | Stealthaccounts na bans, accountwarming of -farming, nepbetrokkenheid, multi-accountautomatisering, massaal posten, spambots of automatisering die is gebouwd om detectie te vermijden.                                                                                                                                          |
| Fraude, scams en misleidende financiële workflows           | Valse certificaten of facturen, misleidende betalingsflows, scamoutreach, vals sociaal bewijs, workflows met synthetische identiteiten voor fraude of tools voor uitgaven/kosten zonder duidelijke menselijke goedkeuring.                                                                                                                    |
| Privacy-invasieve verrijking of surveillance                | Contactscraping voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming of gebruik van gelekte data of breachdumps.                                                                                                                  |
| Imitatie zonder toestemming of identiteitsmanipulatie       | Face swap, digital twins, gekloonde influencers, neppersona's of andere tooling die wordt gebruikt om iemand te imiteren of te misleiden.                                                                                                                                                                                                 |
| Expliciete seksuele content of veiligheid-uitgeschakelde volwassenengeneratie | NSFW-afbeeldings-, video- of contentgeneratie; wrappers voor adult content rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                                       |
| Verborgen, onveilige of misleidende uitvoeringsvereisten    | Verduisterde installatiecommando's, pipe-to-shell-installers zoals gedownloade content die met `sh` of `bash` wordt uitgevoerd zonder duidelijke beoordeelbaarheid, niet-gedeclareerde vereisten voor secrets of privésleutels, externe uitvoering van `npx @latest` zonder duidelijke beoordeelbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Auteursrechtschendend of rechteninbreukmakend materiaal     | Het opnieuw publiceren van de skill, plugin, docs, brand assets of propriëtaire code van iemand anders zonder toestemming; schending van licentievoorwaarden; of imitatie van de oorspronkelijke auteur of uitgever.                                                                                                                            |

## Niet-toegestaan marketplace-gedrag

ClawHub beoordeelt ook hoe uitgevers de marketplace gebruiken. Gebruik ClawHub niet om
discovery, metrics, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht te
manipuleren.

Niet-toegestaan marketplace-gedrag omvat:

- het in bulk publiceren van grote aantallen low-effort, duplicatieve, placeholder- of
  machinegegenereerde vermeldingen die geen echte gebruikerswaarde lijken te hebben
- het overspoelen van zoek- of categorieoppervlakken met vrijwel identieke skills of plugins
- het publiceren van honderden vermeldingen met weinig of geen gebruik, onderhoud, duidelijke
  bron of betekenisvolle differentiatie
- het kunstmatig opdrijven van installaties, downloads, sterren of andere betrokkenheidsmetrics
  via automatisering, self-install loops, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- het aanmaken of rouleren van accounts om moderatie, bans, uitgeverslimieten of
  marketplace-beoordeling te omzeilen
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of affiliatie met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem op te lossen

Publiceren met hoog volume is niet automatisch misbruik. Grote catalogi zijn acceptabel
wanneer de vermeldingen betekenisvol verschillen, nauwkeurig beschreven zijn, onderhouden worden
en door echte gebruikers worden gebruikt. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume wordt gecombineerd met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als u denkt dat content op ClawHub inbreuk maakt op uw auteursrecht of andere rechten, gebruik dan
[Verzoeken over contentrechten](/clawhub/content-rights). Gebruik geen normale marketplace-
rapporten voor auteursrecht- of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Beoordeling en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersrapporten en
personeelsbeoordeling gebruiken om onveilige content of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub te bepalen wat beoordeling nodig heeft.

We kunnen:

- vermeldingen die regels schenden verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installaties blokkeren voor onveilige releases
- API-tokens intrekken
- gekoppelde content soft-deleten
- publicatietoegang beperken
- recidivisten of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor rapporten, moderatieholds,
verborgen vermeldingen, bans en accountstatus.
