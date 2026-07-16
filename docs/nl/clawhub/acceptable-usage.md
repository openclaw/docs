---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moder ератiedocumentatie of draaiboeken voor reviewers schrijven
    - Beslissen of een skill moet worden verborgen of een gebruiker moet worden geblokkeerd
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet host.'
title: Aanvaardbaar gebruik
x-i18n:
    generated_at: "2026-07-16T15:27:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar gebruik

ClawHub host Skills, Plugins, pakketten en marketplace-metadata voor OpenClaw.
Gebruik deze pagina om te bepalen of content of publicatiegedrag thuishoort op
ClawHub.

Deze regels gelden voor wat een vermelding doet, wat gebruikers volgens de vermelding moeten uitvoeren, hoe de vermelding
zich presenteert en hoe uitgevers de functies voor vindbaarheid, installatie en
vertrouwen van ClawHub gebruiken. Zie voor moderatiestatussen en de accountstatus
[Moderatie en accountveiligheid](/clawhub/moderation). Zie voor auteursrechtelijke of andere rechtenclaims
[Verzoeken inzake contentrechten](/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig en begrijpelijk is en te goeder
trouw wordt gepubliceerd.

| Categorie                                         | Toegestaan wanneer                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit van ontwikkelaars                           | De vermelding helpt gebruikers software te bouwen, testen, migreren, debuggen, documenteren of beheren.                                               |
| Workflows voor UI, gegevens en automatisering               | De reikwijdte is duidelijk, vereiste inloggegevens worden expliciet vermeld en risicovolle acties bieden mogelijkheden voor beoordeling, proefuitvoering, voorbeeldweergave of bevestiging. |
| Defensieve beveiliging, moderatie en beoordeling van misbruik | De tool is bedoeld voor geautoriseerde beoordeling, behoudt bewijsmateriaal en houdt de grenzen voor menselijke goedkeuring duidelijk.                          |
| Persoonlijke workflows of teamworkflows                       | De workflow gebruikt accounts op basis van toestemming, transparante configuratie en expliciete machtigingen.                                            |
| Onderhouden catalogi                              | Elke vermelding is onderscheidend, nuttig, nauwkeurig beschreven en wordt redelijkerwijs onderhouden.                                                |

De context is belangrijk. Hetzelfde onderwerp kan aanvaardbaar zijn in een beperkte defensieve of
op toestemming gebaseerde omgeving en onaanvaardbaar wanneer het als workflow voor misbruik wordt aangeboden.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of schending van rechten is.

| Categorie                                                    | Niet toegestaan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of omzeiling van beveiliging                      | Omzeiling van authenticatie, overname van accounts, misbruik van frequentielimieten, overname van livegesprekken of agents, diefstal van herbruikbare sessies of het automatisch goedkeuren van koppelingsprocessen voor niet-goedgekeurde gebruikers.                                                                                                                                                   |
| Platformmisbruik en omzeiling van verbanningen                              | Verborgen accounts na verbanningen, het opwarmen of kweken van accounts, nepinteractie, automatisering met meerdere accounts, massaal publiceren, spambots of automatisering die is ontwikkeld om detectie te vermijden.                                                                                                                                          |
| Fraude, oplichting en misleidende financiële workflows             | Valse certificaten of facturen, misleidende betaalstromen, frauduleuze benadering, vals sociaal bewijs, workflows met synthetische identiteiten voor fraude of tools voor uitgaven/afschrijvingen zonder duidelijke menselijke goedkeuring.                                                                                                                    |
| Privacyinvasieve verrijking of surveillance                 | Contactgegevens scrapen voor spam, doxing, stalking, extractie van leads in combinatie met ongevraagde benadering, heimelijke monitoring, biometrische matching zonder toestemming of het gebruik van gelekte gegevens of dumps van datalekken.                                                                                                                  |
| Imitatie of identiteitsmanipulatie zonder toestemming       | Gezichtsverwisseling, digitale tweelingen, gekloonde influencers, neppersona's of andere tools die worden gebruikt om iemand te imiteren of te misleiden.                                                                                                                                                                                                 |
| Expliciet seksuele content of het genereren van content voor volwassenen waarbij veiligheidsmaatregelen zijn uitgeschakeld | Het genereren van NSFW-afbeeldingen, -video's of -content; wrappers voor content voor volwassenen rond API's van derden; of vermeldingen waarvan het hoofddoel expliciet seksuele content is.                                                                                                                                                       |
| Verborgen, onveilige of misleidende uitvoeringsvereisten        | Verhulde installatieopdrachten, pipe-to-shell-installatieprogramma's zoals gedownloade content die zonder duidelijke controleerbaarheid wordt uitgevoerd met `sh` of `bash`, niet-vermelde vereisten voor geheimen of privésleutels, externe uitvoering van `npx @latest` zonder duidelijke controleerbaarheid, of metadata die verbergt wat werkelijk nodig is om de vermelding uit te voeren. |
| Materiaal dat auteursrechten of andere rechten schendt           | Zonder toestemming de Skills, Plugin, documentatie, merkactiva of propriëtaire code van iemand anders opnieuw publiceren; licentievoorwaarden schenden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                                            |

## Niet-toegestaan marketplace-gedrag

ClawHub beoordeelt ook hoe uitgevers de marketplace gebruiken. Gebruik ClawHub niet om
vindbaarheid, statistieken, vertrouwenssignalen, moderatiesystemen of de aandacht van
gebruikers te manipuleren.

Niet-toegestaan marketplace-gedrag omvat:

- het in bulk publiceren van grote aantallen vermeldingen die weinig moeite vergen, duplicatief, tijdelijk of
  machinaal gegenereerd zijn en geen werkelijke waarde voor gebruikers lijken te hebben
- zoek- of categoriepagina's overspoelen met vrijwel identieke Skills of Plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, duidelijkheid over de bron
  of betekenisvol onderscheid
- installaties, downloads, sterren of andere interactiestatistieken kunstmatig
  verhogen via automatisering, lussen voor zelfinstallatie, nepaccounts, gecoördineerde
  activiteit, betaalde interactie of ander niet-organisch gedrag
- accounts aanmaken of rouleren om moderatie, verbanningen, uitgeverslimieten of
  marketplace-beoordeling te omzeilen
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingsstatus,
  installatievereisten of verbondenheid met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem op te lossen

Publicatie op grote schaal is niet automatisch misbruik. Grote catalogi zijn aanvaardbaar
wanneer de vermeldingen wezenlijk verschillen, nauwkeurig worden beschreven, worden onderhouden
en door echte gebruikers worden gebruikt. Grote catalogi worden een probleem voor vertrouwen en veiligheid wanneer
het volume gepaard gaat met oppervlakkige, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als je van mening bent dat content op ClawHub inbreuk maakt op jouw auteursrecht of andere rechten, gebruik dan
[Verzoeken inzake contentrechten](/clawhub/content-rights). Gebruik normale marketplace-
meldingen niet voor auteursrechtelijke of andere rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Beoordeling en handhaving

ClawHub kan geautomatiseerde controles, statistische signalen van misbruik, gebruikersmeldingen en
beoordeling door medewerkers gebruiken om onveilige content of misbruik bij het publiceren te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub te bepalen wat moet worden beoordeeld.

We kunnen:

- vermeldingen die de regels schenden verbergen, vasthouden, verwijderen, voorlopig verwijderen of, wanneer dit voor het resourcetype wordt ondersteund,
  definitief verwijderen
- downloads of installaties van onveilige releases blokkeren
- API-tokens intrekken
- bijbehorende content voorlopig verwijderen
- publicatietoegang beperken
- herhaaldelijke of ernstige overtreders verbannen

We garanderen niet dat bij duidelijk misbruik eerst een waarschuwing wordt gegeven. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor meldingen, moderatieblokkeringen,
verborgen vermeldingen, verbanningen en de accountstatus.
