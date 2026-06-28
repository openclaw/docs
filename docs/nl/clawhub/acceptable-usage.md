---
read_when:
    - Uploads beoordelen op misbruik of beleidsschendingen
    - Moderatiedocumentatie of runbooks voor beoordelaars schrijven
    - Beslissen of een skill verborgen moet worden of een gebruiker verbannen
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet zal hosten.'
title: Aanvaardbaar gebruik
x-i18n:
    generated_at: "2026-06-28T05:07:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Acceptabel gebruik

ClawHub host Skills, plugins, pakketten en marketplace-metadata voor OpenClaw.
Gebruik deze pagina om te bepalen of content of publicatiegedrag op
ClawHub thuishoort.

Deze regels zijn van toepassing op wat een vermelding doet, wat deze gebruikers vraagt uit te voeren, hoe deze
zichzelf presenteert en hoe uitgevers ClawHub's oppervlakken voor ontdekking, installatie en
vertrouwen gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/nl/clawhub/moderation). Zie voor auteursrechtelijke of andere rechtenclaims
[Verzoeken over contentrechten](/nl/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw
gepubliceerd is.

| Categorie                                        | Toegestaan wanneer                                                                                                               |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Ontwikkelaarsproductiviteit                      | De vermelding helpt gebruikers software te bouwen, testen, migreren, debuggen, documenteren of beheren.                         |
| UI-, data- en automatiseringsworkflows           | De scope duidelijk is, vereiste inloggegevens expliciet zijn en risicovolle acties review-, dry-run-, preview- of bevestigingspaden bevatten. |
| Defensieve beveiliging, moderatie en misbruikreview | De tool is gepositioneerd voor geautoriseerde review, bewaart bewijs en houdt grenzen voor menselijke goedkeuring duidelijk.     |
| Persoonlijke of teamworkflows                    | De workflow gebruikt accounts op basis van toestemming, transparante setup en expliciete machtigingen.                          |
| Onderhouden catalogi                             | Elke vermelding is onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden.                                        |

Context is belangrijk. Hetzelfde onderwerp kan acceptabel zijn in een smalle defensieve of
op toestemming gebaseerde context en onacceptabel wanneer het wordt verpakt als een misbruikworkflow.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of rechteninbreuk is.

| Categorie                                                   | Niet toegestaan                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ongeautoriseerde toegang of beveiligingsomzeiling           | Auth-omzeiling, accountovername, rate-limit-misbruik, live call- of agentovername, herbruikbare sessiediefstal, of automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                                                           |
| Platformmisbruik en ban-ontwijking                          | Verborgen accounts na bans, accountopwarming of -farming, nepbetrokkenheid, multi-accountautomatisering, massaal posten, spambots, of automatisering die is gebouwd om detectie te vermijden.                                                                                                             |
| Fraude, scams en misleidende financiële workflows           | Valse certificaten of facturen, misleidende betalingsflows, scam-outreach, nep sociaal bewijs, workflows met synthetische identiteiten voor fraude, of tools voor uitgeven/incasseren zonder duidelijke menselijke goedkeuring.                                                                             |
| Privacy-invasieve verrijking of surveillance                | Contactscraping voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming, of gebruik van gelekte data of breach-dumps.                                                                                           |
| Impersonatie of identiteitsmanipulatie zonder toestemming   | Face swap, digitale tweelingen, gekloonde influencers, neppersona's of andere tooling die wordt gebruikt om zich voor te doen als iemand anders of te misleiden.                                                                                                                                             |
| Expliciete seksuele content of veiligheid-uitgeschakelde adultgeneratie | NSFW-afbeeldings-, video- of contentgeneratie; adult-contentwrappers rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                       |
| Verborgen, onveilige of misleidende uitvoeringsvereisten    | Verduisterde installatiecommando's, pipe-to-shell-installers zoals gedownloade content die met `sh` of `bash` wordt uitgevoerd zonder duidelijke reviewbaarheid, niet-gedeclareerde vereisten voor secrets of private keys, externe `npx @latest`-uitvoering zonder duidelijke reviewbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Auteursrechtinbreukmakend of rechten-schendend materiaal    | Iemands anders Skill, plugin, docs, merkassets of propriëtaire code opnieuw publiceren zonder toestemming; licentievoorwaarden schenden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                      |

## Niet-toegestaan marketplace-gedrag

ClawHub beoordeelt ook hoe uitgevers de marketplace gebruiken. Gebruik ClawHub niet om
ontdekking, statistieken, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht
te manipuleren.

Niet-toegestaan marketplace-gedrag omvat:

- in bulk grote aantallen minimale, duplicatieve, placeholder- of
  machinegegenereerde vermeldingen publiceren die geen echte gebruikerswaarde lijken te hebben
- zoek- of categorievlakken overspoelen met vrijwel identieke Skills of plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- installaties, downloads, sterren of andere betrokkenheidsstatistieken kunstmatig
  opblazen via automatisering, self-install-lussen, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- accounts aanmaken of roteren om moderatie, bans, uitgeverslimieten of
  marketplace-review te ontwijken
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of affiliatie met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem op te lossen

Publiceren in hoog volume is niet automatisch misbruik. Grote catalogi zijn acceptabel
wanneer de vermeldingen betekenisvol verschillen, nauwkeurig beschreven zijn, onderhouden worden
en door echte gebruikers worden gebruikt. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume gepaard gaat met magere, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als je denkt dat content op ClawHub inbreuk maakt op je auteursrecht of andere rechten, gebruik dan
[Verzoeken over contentrechten](/nl/clawhub/content-rights). Gebruik normale marketplace-meldingen niet
voor auteursrechtelijke of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Review en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersmeldingen en
staff-review gebruiken om onveilige content of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub te bepalen wat review nodig heeft.

We kunnen:

- schendende vermeldingen verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installaties voor onveilige releases blokkeren
- API-tokens intrekken
- gekoppelde content soft-deleten
- publicatietoegang beperken
- herhaaldelijke of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/nl/clawhub/moderation) voor meldingen, moderatieholds,
verborgen vermeldingen, bans en accountstatus.
