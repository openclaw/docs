---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of reviewer-runbooks schrijven
    - Beslissen of een skill verborgen moet worden of een gebruiker geblokkeerd moet worden
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet host.'
title: Aanvaardbaar gebruik
x-i18n:
    generated_at: "2026-07-04T15:24:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar Gebruik

ClawHub host Skills, plugins, pakketten en marktplaatsmetadata voor OpenClaw.
Gebruik deze pagina om te bepalen of content of publicatiegedrag thuishoort op
ClawHub.

Deze regels gelden voor wat een vermelding doet, wat die gebruikers vraagt uit te voeren, hoe die
zichzelf presenteert en hoe uitgevers ClawHub's oppervlakken voor ontdekking, installatie en
vertrouwen gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en Accountveiligheid](/clawhub/moderation). Zie voor auteursrechtclaims of andere rechtenclaims
[Contentrechtenverzoeken](/nl/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw
gepubliceerd is.

| Categorie                                        | Toegestaan wanneer                                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Ontwikkelaarsproductiviteit                      | De vermelding gebruikers helpt software te bouwen, testen, migreren, debuggen, documenteren of beheren.                           |
| UI-, data- en automatiseringsworkflows           | De scope duidelijk is, vereiste inloggegevens expliciet zijn en risicovolle acties review-, dry-run-, preview- of bevestigingspaden bevatten. |
| Defensieve beveiliging, moderatie en misbruikreview | De tool is gepositioneerd voor geautoriseerde review, bewijs bewaart en grenzen voor menselijke goedkeuring duidelijk houdt.       |
| Persoonlijke of teamworkflows                    | De workflow op toestemming gebaseerde accounts, transparante setup en expliciete machtigingen gebruikt.                            |
| Onderhouden catalogi                             | Elke vermelding onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden is.                                           |

Context is belangrijk. Hetzelfde onderwerp kan aanvaardbaar zijn in een nauwe defensieve of
op toestemming gebaseerde setting en onaanvaardbaar wanneer het is verpakt als een misbruikworkflow.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of schending van rechten is.

| Categorie                                                   | Niet toegestaan                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of omzeiling van beveiliging       | Auth-omzeiling, accountovername, misbruik van rate limits, overname van live calls of agents, herbruikbare sessiediefstal of pairingflows automatisch goedkeuren voor niet-goedgekeurde gebruikers.                                                                                                           |
| Platformmisbruik en omzeiling van bans                      | Stealthaccounts na bans, accounts opwarmen of farmen, nepbetrokkenheid, automatisering met meerdere accounts, massaal posten, spambots of automatisering die is gebouwd om detectie te vermijden.                                                                                                             |
| Fraude, scams en misleidende financiële workflows           | Valse certificaten of facturen, misleidende betalingsflows, scam-outreach, vals sociaal bewijs, workflows met synthetische identiteiten voor fraude of tools voor uitgeven/incasseren zonder duidelijke menselijke goedkeuring.                                                                                |
| Privacy-invasieve verrijking of surveillance                | Contacten scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming of gebruik van gelekte data of breachdumps.                                                                                               |
| Impersonatie of identiteitsmanipulatie zonder toestemming   | Face swap, digitale tweelingen, gekloonde influencers, neppersona's of andere tooling die wordt gebruikt om zich voor te doen als iemand anders of te misleiden.                                                                                                                                              |
| Expliciete seksuele content of adult-generatie zonder veiligheidsmaatregelen | NSFW-afbeeldings-, video- of contentgeneratie; wrappers voor adult content rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                    |
| Verborgen, onveilige of misleidende uitvoeringsvereisten    | Verduisterde installatieopdrachten, pipe-to-shell-installers zoals gedownloade content die met `sh` of `bash` wordt uitgevoerd zonder duidelijke reviewbaarheid, niet-aangegeven vereisten voor secrets of privésleutels, externe uitvoering van `npx @latest` zonder duidelijke reviewbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Materiaal dat auteursrecht schendt of rechten overtreedt    | Iemands anders skill, plugin, docs, merkassets of propriëtaire code opnieuw publiceren zonder toestemming; licentievoorwaarden schenden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                           |

## Niet-toegestaan marktplaatsgedrag

ClawHub beoordeelt ook hoe uitgevers de marktplaats gebruiken. Gebruik ClawHub niet om
ontdekking, statistieken, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht
te manipuleren.

Niet-toegestaan marktplaatsgedrag omvat:

- in bulk grote aantallen low-effort, duplicatieve, placeholder- of
  machinaal gegenereerde vermeldingen publiceren die geen echte gebruikerswaarde lijken te hebben
- zoek- of categorieoppervlakken overspoelen met bijna identieke Skills of plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- installaties, downloads, sterren of andere betrokkenheidsstatistieken kunstmatig
  opblazen via automatisering, zelfinstallatielussen, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- accounts aanmaken of roteren om moderatie, bans, uitgeverslimieten of
  marktplaatsreview te omzeilen
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of verbondenheid met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem op te lossen

Publiceren met hoog volume is niet automatisch misbruik. Grote catalogi zijn aanvaardbaar
wanneer de vermeldingen betekenisvol verschillend, nauwkeurig beschreven, onderhouden
en door echte gebruikers gebruikt zijn. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume gepaard gaat met magere, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als je denkt dat content op ClawHub je auteursrecht of andere rechten schendt, gebruik dan
[Contentrechtenverzoeken](/nl/clawhub/content-rights). Gebruik normale marktplaatsrapporten niet
voor auteursrechtclaims of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Review en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersrapporten en
review door medewerkers gebruiken om onveilige content of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub te bepalen wat review nodig heeft.

We kunnen:

- vermeldingen die de regels schenden verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installaties voor onveilige releases blokkeren
- API-tokens intrekken
- bijbehorende content soft-deleten
- publicatietoegang beperken
- terugkerende of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing voor duidelijk misbruik. Zie
[Moderatie en Accountveiligheid](/clawhub/moderation) voor rapporten, moderatieholds,
verborgen vermeldingen, bans en accountstatus.
