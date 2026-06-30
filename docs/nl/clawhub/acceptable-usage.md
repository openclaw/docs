---
read_when:
    - Uploads beoordelen op misbruik of beleidsovertredingen
    - Documentatie over moderatie of runbooks voor reviewers schrijven
    - Bepalen of een Skill moet worden verborgen of een gebruiker moet worden verbannen
sidebarTitle: Acceptable Usage
summary: 'Marketplace-beleid: wat ClawHub toestaat en wat het niet host.'
title: Acceptabel gebruik
x-i18n:
    generated_at: "2026-06-30T22:23:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar gebruik

ClawHub host skills, plugins, pakketten en marketplace-metadata voor OpenClaw.
Gebruik deze pagina om te bepalen of content of publicatiegedrag thuishoort op
ClawHub.

Deze regels zijn van toepassing op wat een vermelding doet, wat die gebruikers vraagt uit te voeren, hoe die
zichzelf presenteert en hoe uitgevers de discovery-, installatie- en
vertrouwensoppervlakken van ClawHub gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/clawhub/moderation). Zie voor auteursrecht- of andere rechtenclaims
[Verzoeken over contentrechten](/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw is
gepubliceerd.

| Categorie                                         | Toegestaan wanneer                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                           | De vermelding gebruikers helpt software te bouwen, testen, migreren, debuggen, documenteren of beheren.                                               |
| UI-, data- en automatiseringsworkflows               | De scope duidelijk is, vereiste credentials expliciet zijn en risicovolle acties beoordelings-, dry-run-, preview- of bevestigingspaden bevatten. |
| Defensieve beveiliging, moderatie en misbruikbeoordeling | De tool is gepositioneerd voor geautoriseerde beoordeling, bewijs bewaart en grenzen voor menselijke goedkeuring duidelijk houdt.                          |
| Persoonlijke of teamworkflows                       | De workflow accounts op basis van toestemming, transparante setup en expliciete machtigingen gebruikt.                                            |
| Onderhouden catalogi                              | Elke vermelding onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden is.                                                |

Context is belangrijk. Hetzelfde onderwerp kan aanvaardbaar zijn in een nauwe defensieve of
op toestemming gebaseerde context en onaanvaardbaar wanneer het als misbruikworkflow wordt verpakt.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of schending van rechten is.

| Categorie                                                    | Niet toegestaan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of omzeiling van beveiliging                      | Auth-omzeiling, accountovername, misbruik van rate limits, overname van live calls of agents, herbruikbare sessiediefstal of het automatisch goedkeuren van pairingflows voor niet-goedgekeurde gebruikers.                                                                                                                                                   |
| Platformmisbruik en omzeiling van bans                              | Stealthaccounts na bans, accountwarming of -farming, nepbetrokkenheid, automatisering met meerdere accounts, massaal posten, spambots of automatisering die is gebouwd om detectie te vermijden.                                                                                                                                          |
| Fraude, scams en misleidende financiële workflows             | Valse certificaten of facturen, misleidende betaalflows, scam-outreach, vals sociaal bewijs, workflows met synthetische identiteiten voor fraude of tools voor uitgaven/afschrijvingen zonder duidelijke menselijke goedkeuring.                                                                                                                    |
| Privacy-invasieve verrijking of surveillance                 | Contacten scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, niet-consensuele biometrische matching of gebruik van gelekte data of breach dumps.                                                                                                                  |
| Niet-consensuele impersonatie of identiteitsmanipulatie       | Faceswap, digitale tweelingen, gekloonde influencers, neppersona's of andere tooling die wordt gebruikt om zich als iemand anders voor te doen of te misleiden.                                                                                                                                                                                                 |
| Expliciete seksuele content of safety-disabled adult generation | NSFW-afbeeldings-, video- of contentgeneratie; wrappers voor adult content rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                                       |
| Verborgen, onveilige of misleidende uitvoeringsvereisten        | Verdoezelde installatiecommando's, pipe-to-shell-installers zoals gedownloade content die met `sh` of `bash` wordt uitgevoerd zonder duidelijke beoordeelbaarheid, niet-aangegeven vereisten voor secrets of privésleutels, externe uitvoering van `npx @latest` zonder duidelijke beoordeelbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Auteursrechtschendend of rechten schendend materiaal           | Het opnieuw publiceren van iemands skill, plugin, docs, merkassets of propriëtaire code zonder toestemming; het schenden van licentievoorwaarden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                                            |

## Niet-toegestaan marketplace-gedrag

ClawHub beoordeelt ook hoe uitgevers de marketplace gebruiken. Gebruik ClawHub niet om
discovery, metrics, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht
te manipuleren.

Niet-toegestaan marketplace-gedrag omvat:

- bulkpublicatie van grote aantallen low-effort, duplicatieve, placeholder- of
  machinaal gegenereerde vermeldingen die geen echte gebruikerswaarde lijken te hebben
- het overspoelen van zoek- of categorieoppervlakken met vrijwel identieke skills of plugins
- het publiceren van honderden vermeldingen met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- het kunstmatig opdrijven van installaties, downloads, sterren of andere engagement-
  metrics via automatisering, zelfinstallatielussen, nepaccounts, gecoördineerde
  activiteit, betaalde engagement of ander niet-organisch gedrag
- accounts aanmaken of rouleren om moderatie, bans, uitgeverslimieten of
  marketplace-review te omzeilen
- gebruikers misleiden over eigendom, bron, capabilities, security posture,
  installatievereisten of affiliatie met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem op te lossen

Publiceren op hoog volume is niet automatisch misbruik. Grote catalogi zijn aanvaardbaar
wanneer de vermeldingen betekenisvol verschillen, nauwkeurig zijn beschreven, worden onderhouden
en door echte gebruikers worden gebruikt. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume gepaard gaat met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als je denkt dat content op ClawHub inbreuk maakt op je auteursrecht of andere rechten, gebruik dan
[Verzoeken over contentrechten](/clawhub/content-rights). Gebruik normale marketplace-
rapporten niet voor auteursrecht- of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadwillend of misleidend is.

## Beoordeling en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersrapporten en
beoordeling door medewerkers gebruiken om onveilige content of misbruikmakend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub te bepalen wat beoordeeld moet worden.

We kunnen:

- vermeldingen die de regels schenden verbergen, vasthouden, verwijderen, soft-deleten of, waar dit voor het resourcetype wordt ondersteund,
  hard-deleten
- downloads of installaties voor onveilige releases blokkeren
- API-tokens intrekken
- bijbehorende content soft-deleten
- publicatietoegang beperken
- recidivisten of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor rapporten, moderatieholds,
verborgen vermeldingen, bans en accountstatus.
