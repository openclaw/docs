---
read_when:
    - Uploads beoordelen op misbruik of beleidsschendingen
    - Moderatiedocumentatie of review-runbooks schrijven
    - Beslissen of een skill moet worden verborgen of een gebruiker moet worden verbannen
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet host.'
title: Aanvaardbaar gebruik
x-i18n:
    generated_at: "2026-07-04T20:37:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar gebruik

ClawHub host Skills, Plugins, pakketten en marktplaatsmetadata voor OpenClaw.
Gebruik deze pagina om te bepalen of content of publicatiegedrag thuishoort op
ClawHub.

Deze regels gelden voor wat een vermelding doet, wat deze gebruikers vraagt uit te voeren, hoe deze
zichzelf presenteert, en hoe uitgevers de ontdekkings-, installatie- en
vertrouwensoppervlakken van ClawHub gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/clawhub/moderation). Zie voor auteursrecht of andere rechtenclaims
[Verzoeken over contentrechten](/nl/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw gepubliceerd is.

| Categorie                                         | Toegestaan wanneer                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                           | De vermelding helpt gebruikers software te bouwen, testen, migreren, debuggen, documenteren of beheren.                                               |
| UI-, data- en automatiseringsworkflows               | De scope duidelijk is, vereiste referenties expliciet zijn, en risicovolle acties beoordelings-, dry-run-, preview- of bevestigingspaden bevatten. |
| Defensieve beveiliging, moderatie en misbruikbeoordeling | De tool is gepositioneerd voor geautoriseerde beoordeling, bewijs bewaart en grenzen voor menselijke goedkeuring duidelijk houdt.                          |
| Persoonlijke of teamworkflows                       | De workflow gebruikt accounts op basis van toestemming, transparante setup en expliciete machtigingen.                                            |
| Onderhouden catalogi                              | Elke vermelding onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden is.                                                |

Context is belangrijk. Hetzelfde onderwerp kan acceptabel zijn in een smalle defensieve of
op toestemming gebaseerde context en onacceptabel wanneer het als misbruikworkflow wordt verpakt.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of schending van rechten is.

| Categorie                                                    | Niet toegestaan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of beveiligingsomzeiling                      | Auth-omzeiling, accountovername, misbruik van rate limits, overname van live calls of agents, herbruikbare sessiediefstal, of automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                                                                                                   |
| Platformmisbruik en omzeiling van bans                              | Stealthaccounts na bans, accountwarming of -farming, nepbetrokkenheid, automatisering met meerdere accounts, massaal posten, spambots, of automatisering die is gebouwd om detectie te vermijden.                                                                                                                                          |
| Fraude, scams en misleidende financiële workflows             | Valse certificaten of facturen, misleidende betaalflows, scam-outreach, vals sociaal bewijs, workflows met synthetische identiteiten voor fraude, of tools voor uitgeven/incasseren zonder duidelijke menselijke goedkeuring.                                                                                                                    |
| Privacy-invasieve verrijking of surveillance                 | Contacten scrapen voor spam, doxxing, stalking, leadextractie gekoppeld aan ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming, of gebruik van gelekte data of breach-dumps.                                                                                                                  |
| Impersonatie of identiteitsmanipulatie zonder toestemming       | Face swap, digitale tweelingen, gekloonde influencers, neppersona's of andere tooling die wordt gebruikt om zich als iemand anders voor te doen of te misleiden.                                                                                                                                                                                                 |
| Expliciete seksuele content of adultgeneratie met uitgeschakelde veiligheid | NSFW-afbeeldings-, video- of contentgeneratie; adult-contentwrappers rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                                       |
| Verborgen, onveilige of misleidende uitvoeringsvereisten        | Verduisterde installatieopdrachten, pipe-to-shell-installers zoals gedownloade content die met `sh` of `bash` wordt uitgevoerd zonder duidelijke beoordeelbaarheid, niet-gedeclareerde vereisten voor geheimen of privésleutels, externe `npx @latest`-uitvoering zonder duidelijke beoordeelbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Materiaal dat auteursrecht schendt of rechten overtreedt           | Iemands anders Skill, Plugin, docs, merkassets of propriëtaire code opnieuw publiceren zonder toestemming; licentievoorwaarden schenden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                                            |

## Niet-toegestaan marktplaatsgedrag

ClawHub beoordeelt ook hoe uitgevers de marktplaats gebruiken. Gebruik ClawHub niet om
ontdekking, metrics, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht te
manipuleren.

Niet-toegestaan marktplaatsgedrag omvat:

- bulkpublicatie van grote aantallen laagwaardige, duplicatieve, placeholder- of
  machinaal gegenereerde vermeldingen die geen echte gebruikerswaarde lijken te hebben
- zoek- of categorieoppervlakken overspoelen met vrijwel identieke Skills of Plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- installaties, downloads, sterren of andere betrokkenheidsmetrics kunstmatig opblazen
  via automatisering, zelfinstallatielussen, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- accounts aanmaken of roteren om moderatie, bans, uitgeverslimieten of
  marktplaatsbeoordeling te omzeilen
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of verbondenheid met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al verborgen, verwijderd of geblokkeerd is
  zonder het onderliggende probleem op te lossen

Publiceren op hoog volume is niet automatisch misbruik. Grote catalogi zijn acceptabel
wanneer de vermeldingen betekenisvol verschillend, nauwkeurig beschreven, onderhouden
en gebruikt door echte gebruikers zijn. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume wordt gecombineerd met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als je denkt dat content op ClawHub inbreuk maakt op je auteursrecht of andere rechten, gebruik dan
[Verzoeken over contentrechten](/nl/clawhub/content-rights). Gebruik normale marktplaatsrapporten niet
voor auteursrecht- of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Beoordeling en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersrapporten en
beoordeling door medewerkers gebruiken om onveilige content of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub te bepalen wat beoordeling nodig heeft.

We kunnen:

- vermeldingen die regels overtreden verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installaties voor onveilige releases blokkeren
- API-tokens intrekken
- gekoppelde content soft-deleten
- publicatietoegang beperken
- recidivisten of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor rapporten, moderatieholds,
verborgen vermeldingen, bans en accountstatus.
