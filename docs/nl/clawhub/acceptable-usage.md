---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of reviewer-runbooks schrijven
    - Beslissen of een skill moet worden verborgen of een gebruiker moet worden geblokkeerd
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet zal hosten.'
title: Toegestaan gebruik
x-i18n:
    generated_at: "2026-07-03T02:51:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Acceptabel gebruik

ClawHub host skills, plugins, pakketten en marketplace-metadata voor OpenClaw.
Gebruik deze pagina om te bepalen of content of publicatiegedrag op
ClawHub thuishoort.

Deze regels zijn van toepassing op wat een vermelding doet, wat deze gebruikers vraagt uit te voeren, hoe deze
zichzelf presenteert, en hoe uitgevers ClawHub's oppervlakken voor ontdekking, installatie en
vertrouwen gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/clawhub/moderation). Zie voor auteursrecht of andere rechtenclaims
[Verzoeken over contentrechten](/nl/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw gepubliceerd is.

| Categorie                                        | Toegestaan wanneer                                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                | De vermelding gebruikers helpt software te bouwen, testen, migreren, debuggen, documenteren of beheren.                           |
| UI-, data- en automatiseringsworkflows           | De scope duidelijk is, vereiste referenties expliciet zijn, en risicovolle acties review-, dry-run-, preview- of bevestigingspaden bevatten. |
| Defensieve beveiliging, moderatie en misbruikreview | De tool is gepositioneerd voor geautoriseerde review, bewijsmateriaal bewaart en grenzen voor menselijke goedkeuring duidelijk houdt. |
| Persoonlijke of teamworkflows                    | De workflow accounts op basis van toestemming, transparante configuratie en expliciete machtigingen gebruikt.                     |
| Onderhouden catalogi                             | Elke vermelding onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden is.                                         |

Context is belangrijk. Hetzelfde onderwerp kan acceptabel zijn in een nauwe defensieve of
op toestemming gebaseerde context en onacceptabel wanneer het als misbruikworkflow wordt verpakt.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of inbreuk op rechten is.

| Categorie                                                   | Niet toegestaan                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of beveiligingsomzeiling           | Auth-omzeiling, accountovername, misbruik van rate limits, overname van live calls of agents, herbruikbare sessiediefstal, of automatisch goedkeuren van pairingflows voor niet-goedgekeurde gebruikers.                                                                                                      |
| Platformmisbruik en banontwijking                           | Stealth-accounts na bans, accountopwarming of -farming, nepbetrokkenheid, multi-accountautomatisering, massaal posten, spambots, of automatisering die is gebouwd om detectie te vermijden.                                                                                                                  |
| Fraude, oplichting en misleidende financiële workflows      | Valse certificaten of facturen, misleidende betaalflows, scam-outreach, nep-social proof, synthetic-identity-workflows voor fraude, of tools voor uitgeven/incasseren zonder duidelijke menselijke goedkeuring.                                                                                                |
| Privacy-invasieve verrijking of surveillance                | Contacten scrapen voor spam, doxxing, stalking, leadextractie gekoppeld aan ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming, of gebruik van gelekte data of breach-dumps.                                                                                               |
| Impersonatie of identiteitsmanipulatie zonder toestemming   | Face swap, digitale tweelingen, gekloonde influencers, nep-persona's, of andere tooling die wordt gebruikt om zich voor te doen als iemand anders of te misleiden.                                                                                                                                            |
| Expliciete seksuele content of generatie voor volwassenen met uitgeschakelde veiligheid | NSFW-afbeeldings-, video- of contentgeneratie; wrappers voor adult content rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                    |
| Verborgen, onveilige of misleidende uitvoeringsvereisten    | Verhulde installatiecommando's, pipe-to-shell-installers zoals gedownloade content die met `sh` of `bash` wordt uitgevoerd zonder duidelijke reviewbaarheid, niet-vermelde vereisten voor secrets of privésleutels, externe `npx @latest`-uitvoering zonder duidelijke reviewbaarheid, of metadata die verbergt wat de vermelding werkelijk nodig heeft om te draaien. |
| Materiaal dat auteursrecht schendt of rechten overtreedt    | Iemands skill, plugin, docs, merkmateriaal of propriëtaire code zonder toestemming opnieuw publiceren; licentievoorwaarden schenden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                             |

## Niet-toegestaan marketplace-gedrag

ClawHub beoordeelt ook hoe uitgevers de marketplace gebruiken. Gebruik ClawHub niet om
ontdekking, metrics, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht
te manipuleren.

Niet-toegestaan marketplace-gedrag omvat:

- in bulk grote aantallen low-effort, duplicatieve, placeholder- of
  machinaal gegenereerde vermeldingen publiceren die geen echte gebruikerswaarde lijken te hebben
- zoek- of categorieoppervlakken overspoelen met bijna identieke skills of plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- installs, downloads, sterren of andere betrokkenheidsmetrics kunstmatig opblazen
  via automatisering, self-install-loops, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- accounts aanmaken of roteren om moderatie, bans, uitgeverslimieten of
  marketplace-review te ontwijken
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of affiliatie met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem op te lossen

Publiceren op hoog volume is niet automatisch misbruik. Grote catalogi zijn acceptabel
wanneer de vermeldingen betekenisvol verschillen, nauwkeurig beschreven, onderhouden
en door echte gebruikers gebruikt worden. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume gepaard gaat met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als je denkt dat content op ClawHub inbreuk maakt op je auteursrecht of andere rechten, gebruik dan
[Verzoeken over contentrechten](/nl/clawhub/content-rights). Gebruik normale marketplace-rapporten
niet voor auteursrecht- of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Review en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersrapporten en
staffreview gebruiken om onveilige content of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub te bepalen wat review nodig heeft.

We kunnen:

- schendende vermeldingen verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installs blokkeren voor onveilige releases
- API-tokens intrekken
- bijbehorende content soft-deleten
- publicatietoegang beperken
- recidivisten of ernstige overtreders bannen

We garanderen geen waarschuwing-eerst-handhaving bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor rapporten, moderation holds,
verborgen vermeldingen, bans en accountstatus.
