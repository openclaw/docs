---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of draaiboeken voor reviewers schrijven
    - Beslissen of een skill moet worden verborgen of een gebruiker moet worden verbannen
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet zal hosten.'
title: Aanvaardbaar gebruik
x-i18n:
    generated_at: "2026-07-01T15:27:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Acceptabel gebruik

ClawHub host Skills, Plugins, pakketten en marketplace-metadata voor OpenClaw.
Gebruik deze pagina om te bepalen of content of publicatiegedrag thuishoort op
ClawHub.

Deze regels zijn van toepassing op wat een vermelding doet, wat deze gebruikers vraagt uit te voeren, hoe deze
zichzelf presenteert en hoe uitgevers de discovery-, installatie- en
vertrouwensoppervlakken van ClawHub gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/clawhub/moderation). Zie voor auteursrecht of andere rechtenclaims
[Verzoeken over contentrechten](/nl/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw gepubliceerd is.

| Categorie                                         | Toegestaan wanneer                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                           | De vermelding gebruikers helpt software te bouwen, testen, migreren, debuggen, documenteren of beheren.                                               |
| UI-, data- en automatiseringsworkflows               | De scope duidelijk is, vereiste inloggegevens expliciet zijn en risicovolle acties review-, dry-run-, preview- of bevestigingspaden bevatten. |
| Defensieve beveiliging, moderatie en misbruikreview | De tool wordt gepositioneerd voor geautoriseerde review, bewijs bewaart en menselijke goedkeuringsgrenzen duidelijk houdt.                          |
| Persoonlijke of teamworkflows                       | De workflow accounts op basis van toestemming gebruikt, transparante setup heeft en expliciete machtigingen gebruikt.                                            |
| Onderhouden catalogi                              | Elke vermelding onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden is.                                                |

Context is belangrijk. Hetzelfde onderwerp kan acceptabel zijn in een smalle defensieve of
op toestemming gebaseerde setting en onacceptabel wanneer het wordt verpakt als een misbruikworkflow.

## Verboden content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of inbreuk op rechten is.

| Categorie                                                    | Niet toegestaan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of beveiligingsomzeiling                      | Auth-omzeiling, accountovername, misbruik van rate limits, overname van live calls of agents, herbruikbare sessiediefstal of automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                                                                                                   |
| Platformmisbruik en banontwijking                              | Stealth-accounts na bans, accountopwarming of -farming, nepbetrokkenheid, multi-accountautomatisering, massaal posten, spambotten of automatisering gebouwd om detectie te vermijden.                                                                                                                                          |
| Fraude, scams en misleidende financiële workflows             | Valse certificaten of facturen, misleidende betaalflows, scam-outreach, vals sociaal bewijs, workflows voor synthetische identiteiten voor fraude, of tools voor uitgaven/kosten zonder duidelijke menselijke goedkeuring.                                                                                                                    |
| Privacy-invasieve verrijking of surveillance                 | Contactscraping voor spam, doxxing, stalking, leadextractie gekoppeld aan ongevraagde outreach, heimelijke monitoring, niet-consensuele biometrische matching, of gebruik van gelekte data of breach dumps.                                                                                                                  |
| Niet-consensuele imitatie of identiteitsmanipulatie       | Face swap, digitale tweelingen, gekloonde influencers, neppersona's of andere tooling die wordt gebruikt om iemand na te doen of te misleiden.                                                                                                                                                                                                 |
| Expliciete seksuele content of veiligheid-uitgeschakelde adult-generatie | Genereren van NSFW-afbeeldingen, video of content; adult-content-wrappers rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                                       |
| Verborgen, onveilige of misleidende uitvoeringsvereisten        | Verhulde installatiecommando's, pipe-to-shell-installers zoals gedownloade content die met `sh` of `bash` wordt uitgevoerd zonder duidelijke reviewbaarheid, niet-gedeclareerde vereisten voor secrets of privésleutels, externe `npx @latest`-uitvoering zonder duidelijke reviewbaarheid, of metadata die verhult wat de vermelding echt nodig heeft om te draaien. |
| Auteursrechtschendend of rechten-schendend materiaal           | Iemands anders skill, Plugin, docs, merkassets of propriëtaire code zonder toestemming opnieuw publiceren; licentievoorwaarden schenden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                                            |

## Verboden marketplace-gedrag

ClawHub beoordeelt ook hoe uitgevers de marketplace gebruiken. Gebruik ClawHub niet om
discovery, statistieken, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht
te manipuleren.

Verboden marketplace-gedrag omvat:

- bulkpublicatie van grote aantallen low-effort, duplicatieve, placeholder- of
  machinegegenereerde vermeldingen die geen echte gebruikerswaarde lijken te hebben
- zoek- of categorieoppervlakken overspoelen met vrijwel identieke Skills of Plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- installaties, downloads, sterren of andere betrokkenheidsstatistieken kunstmatig
  opblazen via automatisering, self-install-loops, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- accounts aanmaken of roteren om moderatie, bans, uitgeverslimieten of
  marketplace-review te ontlopen
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of affiliatie met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al verborgen, verwijderd of geblokkeerd is
  zonder het onderliggende probleem op te lossen

Publiceren met hoog volume is niet automatisch misbruik. Grote catalogi zijn acceptabel
wanneer de vermeldingen betekenisvol verschillen, nauwkeurig beschreven zijn, onderhouden worden
en door echte gebruikers worden gebruikt. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume gepaard gaat met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als je denkt dat content op ClawHub inbreuk maakt op je auteursrecht of andere rechten, gebruik dan
[Verzoeken over contentrechten](/nl/clawhub/content-rights). Gebruik normale marketplace-
rapportages niet voor auteursrecht- of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Review en handhaving

ClawHub kan geautomatiseerde controles, statistische signalen van misbruik, gebruikersrapporten en
personeelsreview gebruiken om onveilige content of misbruikmakend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub te bepalen wat review nodig heeft.

We kunnen:

- overtredende vermeldingen verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installaties blokkeren voor onveilige releases
- API-tokens intrekken
- bijbehorende content soft-deleten
- publicatietoegang beperken
- herhaalde of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor rapporten, moderatie-holds,
verborgen vermeldingen, bans en accountstatus.
