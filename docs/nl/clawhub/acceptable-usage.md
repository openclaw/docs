---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of reviewer-runbooks schrijven
    - Beslissen of een skill moet worden verborgen of een gebruiker moet worden verbannen
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet zal hosten.'
title: Aanvaardbaar gebruik
x-i18n:
    generated_at: "2026-07-04T03:54:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar Gebruik

ClawHub host Skills, plugins, pakketten en marktplaatsmetadata voor OpenClaw.
Gebruik deze pagina om te bepalen of inhoud of publicatiegedrag thuishoort op
ClawHub.

Deze regels gelden voor wat een vermelding doet, wat die gebruikers vraagt uit te voeren, hoe die
zichzelf presenteert en hoe uitgevers ClawHubs oppervlakken voor ontdekking, installatie en
vertrouwen gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/clawhub/moderation). Zie voor auteursrecht- of andere rechtenclaims
[Verzoeken over inhoudsrechten](/nl/clawhub/content-rights).

## Toegestane inhoud

ClawHub verwelkomt inhoud die nuttig en begrijpelijk is en te goeder trouw wordt
gepubliceerd.

| Categorie                                        | Toegestaan wanneer                                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                | De vermelding helpt gebruikers software te bouwen, testen, migreren, debuggen, documenteren of beheren.                          |
| UI-, data- en automatiseringsworkflows           | De scope is duidelijk, vereiste inloggegevens zijn expliciet en risicovolle acties bevatten paden voor beoordeling, testuitvoering, voorbeeldweergave of bevestiging. |
| Defensieve beveiliging, moderatie en misbruikbeoordeling | De tool wordt gepresenteerd voor geautoriseerde beoordeling, bewaart bewijsmateriaal en houdt grenzen voor menselijke goedkeuring duidelijk. |
| Persoonlijke of teamworkflows                    | De workflow gebruikt accounts op basis van toestemming, transparante installatie en expliciete machtigingen.                     |
| Onderhouden catalogi                             | Elke vermelding is onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden.                                         |

Context is belangrijk. Hetzelfde onderwerp kan aanvaardbaar zijn in een nauwe defensieve of
op toestemming gebaseerde context en onaanvaardbaar wanneer het wordt verpakt als een misbruikworkflow.

## Niet-toegestane inhoud

ClawHub host geen inhoud waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of schending van rechten is.

| Categorie                                                   | Niet toegestaan                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of omzeiling van beveiliging       | Omzeiling van authenticatie, accountovername, misbruik van snelheidslimieten, overname van live-aanroepen of agents, herbruikbare sessiediefstal, of het automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                       |
| Platformmisbruik en omzeiling van bans                      | Verborgen accounts na bans, accounts opwarmen of fokken, nepbetrokkenheid, automatisering met meerdere accounts, massaal posten, spambots of automatisering die is gebouwd om detectie te vermijden.                                                                                                         |
| Fraude, scams en misleidende financiële workflows           | Nepcertificaten of facturen, misleidende betaalflows, scam-outreach, nep sociaal bewijs, workflows met synthetische identiteiten voor fraude, of tools voor uitgaven/incasso zonder duidelijke menselijke goedkeuring.                                                                                        |
| Privacy-schendende verrijking of surveillance               | Contacten scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming, of gebruik van gelekte data of datadumps van datalekken.                                                                               |
| Imitatie zonder toestemming of identiteitsmanipulatie       | Face swap, digitale tweelingen, gekloonde influencers, neppersona's of andere tooling die wordt gebruikt om iemand te imiteren of te misleiden.                                                                                                                                                               |
| Expliciete seksuele inhoud of volwassenengeneratie met uitgeschakelde beveiliging | NSFW-afbeeldings-, video- of inhoudsgeneratie; wrappers voor volwasseninhoud rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele inhoud is.                                                                                                                                  |
| Verborgen, onveilige of misleidende uitvoeringsvereisten    | Verhulde installatiecommando's, pipe-to-shell-installaties zoals gedownloade inhoud die met `sh` of `bash` wordt uitgevoerd zonder duidelijke beoordeelbaarheid, niet-gemelde vereisten voor secrets of private keys, externe `npx @latest`-uitvoering zonder duidelijke beoordeelbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Auteursrechtschendend of rechten-schendend materiaal        | Het opnieuw publiceren van iemand anders' Skill, plugin, docs, merkmateriaal of propriëtaire code zonder toestemming; het schenden van licentievoorwaarden; of het imiteren van de oorspronkelijke auteur of uitgever.                                                                                       |

## Niet-toegestaan marktplaatsgedrag

ClawHub beoordeelt ook hoe uitgevers de marktplaats gebruiken. Gebruik ClawHub niet om
ontdekking, statistieken, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht
te manipuleren.

Niet-toegestaan marktplaatsgedrag omvat:

- het in bulk publiceren van grote aantallen weinig-inspannende, duplicatieve, tijdelijke of
  machinaal gegenereerde vermeldingen die geen echte gebruikerswaarde lijken te hebben
- het overspoelen van zoek- of categorieoppervlakken met vrijwel identieke Skills of plugins
- het publiceren van honderden vermeldingen met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- het kunstmatig opdrijven van installaties, downloads, sterren of andere betrokkenheidsstatistieken
  via automatisering, zelfinstallatielussen, nepaccounts, gecoördineerde activiteit,
  betaalde betrokkenheid of ander niet-organisch gedrag
- het aanmaken of rouleren van accounts om moderatie, bans, uitgeverslimieten of
  marktplaatsbeoordeling te omzeilen
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of verbondenheid met een ander project of een andere uitgever
- herhaaldelijk inhoud uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem op te lossen

Publiceren met hoog volume is niet automatisch misbruik. Grote catalogi zijn aanvaardbaar
wanneer de vermeldingen betekenisvol verschillend, nauwkeurig beschreven, onderhouden
en door echte gebruikers gebruikt worden. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume wordt gecombineerd met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Inhoudsrechten

Als je denkt dat inhoud op ClawHub inbreuk maakt op je auteursrecht of andere rechten, gebruik dan
[Verzoeken over inhoudsrechten](/nl/clawhub/content-rights). Gebruik normale marktplaatsrapporten niet
voor auteursrecht- of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Beoordeling en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersrapporten en
personeelsbeoordeling gebruiken om onveilige inhoud of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub bepalen wat beoordeling nodig heeft.

We kunnen:

- schendende vermeldingen verbergen, vasthouden, verwijderen, soft-delete uitvoeren of, waar ondersteund voor het resourcetype,
  hard-delete uitvoeren
- downloads of installaties blokkeren voor onveilige releases
- API-tokens intrekken
- soft-delete uitvoeren op gekoppelde inhoud
- publicatietoegang beperken
- recidivisten of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor rapporten, moderatiewachtrijen,
verborgen vermeldingen, bans en accountstatus.
