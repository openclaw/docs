---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Documentatie over moderatie of draaiboeken voor reviewers schrijven
    - Bepalen of een skill moet worden verborgen of een gebruiker moet worden verbannen
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en niet zal hosten.'
title: Aanvaardbaar gebruik
x-i18n:
    generated_at: "2026-07-12T08:39:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar gebruik

ClawHub host Skills, Plugins, pakketten en marketplace-metadata voor OpenClaw.
Gebruik deze pagina om te bepalen of inhoud of publicatiegedrag thuishoort op
ClawHub.

Deze regels zijn van toepassing op wat een vermelding doet, wat gebruikers
ervoor moeten uitvoeren, hoe de vermelding zichzelf presenteert en hoe
uitgevers de ontdekkings-, installatie- en vertrouwensfuncties van ClawHub
gebruiken. Zie [Moderatie en accountveiligheid](/clawhub/moderation) voor
moderatiestatussen en de accountstatus. Zie
[Verzoeken inzake inhoudsrechten](/clawhub/content-rights) voor claims over
auteursrechten of andere rechten.

## Toegestane inhoud

ClawHub verwelkomt inhoud die nuttig en begrijpelijk is en te goeder trouw wordt
gepubliceerd.

| Categorie                                        | Toegestaan wanneer                                                                                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit van ontwikkelaars                 | De vermelding gebruikers helpt software te bouwen, testen, migreren, debuggen, documenteren of beheren.                                                   |
| UI-, gegevens- en automatiseringsworkflows       | De reikwijdte duidelijk is, vereiste referenties expliciet zijn vermeld en risicovolle acties mogelijkheden voor beoordeling, proefuitvoering, voorbeeldweergave of bevestiging bevatten. |
| Defensieve beveiliging, moderatie en misbruikbeoordeling | De tool is bedoeld voor geautoriseerde beoordeling, bewijsmateriaal behoudt en de grenzen voor menselijke goedkeuring duidelijk houdt.                     |
| Persoonlijke of teamworkflows                    | De workflow accounts met toestemming, een transparante configuratie en expliciete machtigingen gebruikt.                                                  |
| Onderhouden catalogi                             | Elke vermelding onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden is.                                                                 |

De context is belangrijk. Hetzelfde onderwerp kan aanvaardbaar zijn in een
beperkte defensieve context of een context op basis van toestemming, maar
onaanvaardbaar wanneer het als misbruikworkflow wordt aangeboden.

## Niet-toegestane inhoud

ClawHub host geen inhoud waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of schending van rechten is.

| Categorie                                                    | Niet toegestaan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of omzeiling van beveiliging       | Omzeiling van authenticatie, overname van accounts, misbruik van frequentielimieten, overname van actieve gesprekken of agents, herbruikbare sessiediefstal of het automatisch goedkeuren van koppelingsprocessen voor niet-goedgekeurde gebruikers.                                                               |
| Platformmisbruik en omzeiling van blokkeringen              | Verborgen accounts na blokkeringen, het opwarmen of farmen van accounts, nepinteractie, automatisering met meerdere accounts, massale publicatie, spambots of automatisering die is ontworpen om detectie te vermijden.                                                                                              |
| Fraude, oplichting en misleidende financiële workflows      | Valse certificaten of facturen, misleidende betalingsprocessen, frauduleuze benadering, vals sociaal bewijs, workflows met synthetische identiteiten voor fraude of tools voor uitgaven of kostenberekening zonder duidelijke menselijke goedkeuring.                                                               |
| Privacy-invasieve gegevensverrijking of surveillance        | Contactgegevens verzamelen voor spam, doxing, stalking, leadextractie in combinatie met ongevraagde benadering, heimelijke monitoring, biometrische matching zonder toestemming of het gebruik van gelekte gegevens of dumps van datalekken.                                                                       |
| Imitatie of identiteitsmanipulatie zonder toestemming       | Gezichtsverwisseling, digitale tweelingen, gekloonde influencers, neppersona's of andere tools die worden gebruikt om zich als iemand anders voor te doen of anderen te misleiden.                                                                                                                                |
| Expliciete seksuele inhoud of generatie voor volwassenen met uitgeschakelde veiligheidsmaatregelen | Generatie van NSFW-afbeeldingen, -video's of -inhoud; wrappers voor inhoud voor volwassenen rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele inhoud is.                                                                                                                        |
| Verborgen, onveilige of misleidende uitvoeringsvereisten    | Verdoezelde installatieopdrachten, pipe-to-shell-installatieprogramma's zoals gedownloade inhoud die zonder duidelijke controleerbaarheid met `sh` of `bash` wordt uitgevoerd, niet-aangegeven vereisten voor geheimen of privésleutels, externe uitvoering van `npx @latest` zonder duidelijke controleerbaarheid of metadata die verbergt wat werkelijk nodig is om de vermelding uit te voeren. |
| Materiaal dat auteursrechten of andere rechten schendt      | Het zonder toestemming opnieuw publiceren van andermans skill, Plugin, documentatie, merkassets of bedrijfseigen code; het schenden van licentievoorwaarden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                           |

## Niet-toegestaan marketplace-gedrag

ClawHub beoordeelt ook hoe uitgevers de marketplace gebruiken. Gebruik ClawHub
niet om vindbaarheid, statistieken, vertrouwenssignalen, moderatiesystemen of de
aandacht van gebruikers te manipuleren.

Niet-toegestaan marketplace-gedrag omvat:

- het in bulk publiceren van grote aantallen oppervlakkige, dubbele, tijdelijke
  of door machines gegenereerde vermeldingen die geen echte waarde voor
  gebruikers lijken te hebben
- het overspoelen van zoek- of categoriepagina's met vrijwel identieke Skills of
  Plugins
- het publiceren van honderden vermeldingen met weinig of geen gebruik,
  onderhoud, duidelijkheid over de bron of betekenisvol onderscheid
- het kunstmatig verhogen van installaties, downloads, sterren of andere
  interactiestatistieken door middel van automatisering, zelfinstallatielussen,
  nepaccounts, gecoördineerde activiteiten, betaalde interactie of ander
  niet-organisch gedrag
- het aanmaken of afwisselen van accounts om moderatie, blokkeringen,
  uitgeverslimieten of marketplace-beoordeling te omzeilen
- gebruikers misleiden over eigendom, bron, mogelijkheden,
  beveiligingsniveau, installatievereisten of verbondenheid met een ander
  project of een andere uitgever
- herhaaldelijk inhoud uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem op te lossen

Publicatie op grote schaal is niet automatisch misbruik. Grote catalogi zijn
aanvaardbaar wanneer de vermeldingen betekenisvol van elkaar verschillen,
nauwkeurig zijn beschreven, worden onderhouden en door echte gebruikers worden
gebruikt. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
een groot volume gepaard gaat met oppervlakkige, dubbele, misleidende, niet
onderhouden of kunstmatig gepromote vermeldingen.

## Inhoudsrechten

Als u van mening bent dat inhoud op ClawHub inbreuk maakt op uw auteursrecht of
andere rechten, gebruik dan
[Verzoeken inzake inhoudsrechten](/clawhub/content-rights). Gebruik normale
marketplace-meldingen niet voor auteursrechtclaims of claims inzake andere
rechten, tenzij de vermelding ook onveilig, schadelijk of misleidend is.

## Beoordeling en handhaving

ClawHub kan geautomatiseerde controles, statistische signalen van misbruik,
gebruikersmeldingen en beoordeling door medewerkers gebruiken om onveilige
inhoud of misbruik bij publicatie te identificeren. Een signaal bewijst op
zichzelf geen misbruik; het helpt ClawHub te bepalen wat moet worden beoordeeld.

We kunnen:

- vermeldingen die de regels overtreden verbergen, vasthouden, verwijderen,
  zacht verwijderen of, indien dit voor het type bron wordt ondersteund,
  definitief verwijderen
- downloads of installaties van onveilige releases blokkeren
- API-tokens intrekken
- bijbehorende inhoud zacht verwijderen
- publicatietoegang beperken
- accounts van herhaalde of ernstige overtreders blokkeren

We garanderen niet dat bij duidelijk misbruik eerst een waarschuwing wordt
gegeven. Zie [Moderatie en accountveiligheid](/clawhub/moderation) voor
meldingen, moderatieblokkeringen, verborgen vermeldingen, blokkeringen en
accountstatus.
