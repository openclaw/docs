---
read_when:
    - Uploads beoordelen op misbruik of beleidsschendingen
    - Documentatie over moderatie of draaiboeken voor reviewers schrijven
    - Bepalen of een skill verborgen moet worden of een gebruiker verbannen moet worden
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet zal hosten.'
title: Acceptabel gebruik
x-i18n:
    generated_at: "2026-07-03T15:34:09Z"
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

Deze regels gelden voor wat een vermelding doet, wat die gebruikers vraagt uit te voeren, hoe die
zichzelf presenteert en hoe publishers de discovery-, installatie- en
vertrouwensoppervlakken van ClawHub gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/nl/clawhub/moderation). Zie voor auteursrechtelijke of andere rechtenclaims
[Verzoeken over contentrechten](/nl/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw gepubliceerd is.

| Categorie                                        | Toegestaan wanneer                                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                | De vermelding helpt gebruikers software te bouwen, testen, migreren, debuggen, documenteren of beheren.                          |
| UI-, data- en automatiseringsworkflows           | De scope duidelijk is, vereiste referenties expliciet zijn en risicovolle acties review-, dry-run-, preview- of bevestigingspaden bevatten. |
| Defensieve beveiliging, moderatie en misbruikreview | De tool is gepositioneerd voor geautoriseerde review, bewaart bewijs en houdt grenzen voor menselijke goedkeuring duidelijk.      |
| Persoonlijke of teamworkflows                    | De workflow gebruikt accounts op basis van toestemming, transparante setup en expliciete machtigingen.                           |
| Onderhouden catalogi                             | Elke vermelding is onderscheidend, nuttig, accuraat beschreven en redelijk onderhouden.                                           |

Context is belangrijk. Hetzelfde onderwerp kan aanvaardbaar zijn in een smalle defensieve of
op toestemming gebaseerde setting en onaanvaardbaar wanneer het als misbruikworkflow wordt verpakt.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of inbreuk op rechten is.

| Categorie                                                   | Niet toegestaan                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of beveiligingsomzeiling           | Auth-omzeiling, accountovername, misbruik van rate limits, overname van live calls of agents, herbruikbare sessiediefstal of het automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                                                |
| Platformmisbruik en banontwijking                          | Stealth-accounts na bans, accountwarming of -farming, nepbetrokkenheid, automatisering met meerdere accounts, massaal posten, spambots of automatisering gebouwd om detectie te vermijden.                                                                                                                    |
| Fraude, oplichting en misleidende financiële workflows      | Valse certificaten of facturen, misleidende betalingsflows, scam-outreach, vals sociaal bewijs, workflows met synthetische identiteiten voor fraude of tools voor uitgaven/kosten zonder duidelijke menselijke goedkeuring.                                                                                   |
| Privacy-invasieve verrijking of surveillance                | Contacten scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming of gebruik van gelekte data of breach-dumps.                                                                                              |
| Impersonatie of identiteitsmanipulatie zonder toestemming   | Face swap, digitale tweelingen, gekloonde influencers, neppersona’s of andere tooling die wordt gebruikt om iemand na te doen of te misleiden.                                                                                                                                                                  |
| Expliciete seksuele content of adult-generatie zonder veiligheidsbeperkingen | NSFW-afbeeldings-, video- of contentgeneratie; adult-contentwrappers rond API’s van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                          |
| Verborgen, onveilige of misleidende uitvoeringsvereisten    | Verhulde installatiecommando’s, pipe-to-shell-installers zoals gedownloade content uitgevoerd met `sh` of `bash` zonder duidelijke reviewbaarheid, niet-gemelde vereisten voor secrets of private keys, externe `npx @latest`-uitvoering zonder duidelijke reviewbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Materiaal dat auteursrechten schendt of rechten overtreedt  | Iemands Skill, plugin, docs, merkassets of propriëtaire code zonder toestemming opnieuw publiceren; licentievoorwaarden schenden; of zich voordoen als de oorspronkelijke auteur of publisher.                                                                                                                 |

## Niet-toegestaan marketplace-gedrag

ClawHub beoordeelt ook hoe publishers de marketplace gebruiken. Gebruik ClawHub niet om
discovery, metrics, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht
te manipuleren.

Niet-toegestaan marketplace-gedrag omvat:

- grote aantallen low-effort, duplicatieve, placeholder- of
  machinegegenereerde vermeldingen in bulk publiceren die geen echte gebruikerswaarde lijken te hebben
- zoek- of categorieoppervlakken overspoelen met bijna identieke Skills of plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- installaties, downloads, sterren of andere betrokkenheidsmetrics kunstmatig opblazen
  via automatisering, self-install loops, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- accounts aanmaken of roteren om moderatie, bans, publisher-limieten of
  marketplace-review te ontwijken
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of affiliatie met een ander project of andere publisher
- herhaaldelijk content uploaden die al verborgen, verwijderd of geblokkeerd is
  zonder het onderliggende probleem op te lossen

Publiceren met hoog volume is niet automatisch misbruik. Grote catalogi zijn aanvaardbaar
wanneer de vermeldingen betekenisvol verschillend, accuraat beschreven, onderhouden
en gebruikt door echte gebruikers zijn. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume samengaat met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als je denkt dat content op ClawHub inbreuk maakt op je auteursrecht of andere rechten, gebruik dan
[Verzoeken over contentrechten](/nl/clawhub/content-rights). Gebruik normale marketplace-
meldingen niet voor auteursrechtelijke of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Review en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersmeldingen en
staffreview gebruiken om onveilige content of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub bepalen wat review nodig heeft.

We kunnen:

- vermeldingen die regels overtreden verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installaties blokkeren voor onveilige releases
- API-tokens intrekken
- gekoppelde content soft-deleten
- publicatietoegang beperken
- herhaalde of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/nl/clawhub/moderation) voor meldingen, moderatieholds,
verborgen vermeldingen, bans en accountstatus.
