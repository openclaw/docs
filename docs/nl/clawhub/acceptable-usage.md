---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Documentatie voor moderatie of runbooks voor reviewers schrijven
    - Beslissen of een skill moet worden verborgen of een gebruiker moet worden geblokkeerd
sidebarTitle: Acceptable Usage
summary: 'Marktplaatsbeleid: wat ClawHub toestaat en wat het niet host.'
title: Aanvaardbaar gebruik
x-i18n:
    generated_at: "2026-07-02T17:40:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar gebruik

ClawHub host Skills, plugins, pakketten en marktplaatsmetadata voor OpenClaw.
Gebruik deze pagina om te bepalen of content of publicatiegedrag thuishoort op
ClawHub.

Deze regels zijn van toepassing op wat een vermelding doet, wat die gebruikers vraagt uit te voeren, hoe die
zichzelf presenteert en hoe uitgevers ClawHub's oppervlakken voor ontdekking, installatie en
vertrouwen gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/clawhub/moderation). Zie voor auteursrecht- of andere rechtenclaims
[Verzoeken over contentrechten](/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw gepubliceerd is.

| Categorie                                         | Toegestaan wanneer                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                           | De vermelding gebruikers helpt software te bouwen, testen, migreren, debuggen, documenteren of beheren.                                               |
| UI-, data- en automatiseringsworkflows               | De scope duidelijk is, vereiste referenties expliciet zijn en risicovolle acties paden voor beoordeling, dry-run, preview of bevestiging bevatten. |
| Defensieve beveiliging, moderatie en misbruikbeoordeling | De tool wordt gepresenteerd voor geautoriseerde beoordeling, bewijs bewaart en grenzen voor menselijke goedkeuring duidelijk houdt.                          |
| Persoonlijke of teamworkflows                       | De workflow accounts op basis van toestemming, transparante installatie en expliciete machtigingen gebruikt.                                            |
| Onderhouden catalogi                              | Elke vermelding onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden is.                                                |

Context is belangrijk. Hetzelfde onderwerp kan aanvaardbaar zijn in een beperkte defensieve of
op toestemming gebaseerde context en onaanvaardbaar wanneer het als misbruikworkflow is verpakt.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of inbreuk op rechten is.

| Categorie                                                    | Niet toegestaan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of beveiligingsomzeiling                      | Auth-omzeiling, accountovername, misbruik van snelheidslimieten, overname van live calls of agenten, herbruikbare sessiediefstal of het automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                                                                                                   |
| Platformmisbruik en ban-ontwijking                              | Stealthaccounts na bans, accountopwarming of -farming, nepbetrokkenheid, automatisering met meerdere accounts, massaal posten, spambots of automatisering die is gebouwd om detectie te vermijden.                                                                                                                                          |
| Fraude, scams en misleidende financiële workflows             | Nepcertificaten of -facturen, misleidende betalingsflows, scam-outreach, nep sociaal bewijs, workflows met synthetische identiteiten voor fraude of tools voor uitgaven/incasso zonder duidelijke menselijke goedkeuring.                                                                                                                    |
| Privacy-invasieve verrijking of surveillance                 | Contacten scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming, of gebruik van gelekte gegevens of breach-dumps.                                                                                                                  |
| Imitatie of identiteitsmanipulatie zonder toestemming       | Face swap, digitale tweelingen, gekloonde influencers, neppersona's of andere tooling die wordt gebruikt om iemand te imiteren of te misleiden.                                                                                                                                                                                                 |
| Expliciete seksuele content of adult-generatie met uitgeschakelde veiligheidsmaatregelen | NSFW-afbeeldings-, video- of contentgeneratie; wrappers voor adult-content rond API's van derden; of vermeldingen waarvan expliciete seksuele content het primaire doel is.                                                                                                                                                       |
| Verborgen, onveilige of misleidende uitvoeringsvereisten        | Verduisterde installatiecommando's, pipe-to-shell-installers zoals gedownloade content uitgevoerd met `sh` of `bash` zonder duidelijke beoordeelbaarheid, niet-gemelde vereisten voor secrets of privésleutels, externe uitvoering van `npx @latest` zonder duidelijke beoordeelbaarheid, of metadata die verhult wat de vermelding echt nodig heeft om te draaien. |
| Auteursrechtinbreukmakend of rechten-schendend materiaal           | Iemands anders skill, Plugin, docs, merkassets of propriëtaire code opnieuw publiceren zonder toestemming; licentievoorwaarden schenden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                                            |

## Niet-toegestaan marktplaatsgedrag

ClawHub beoordeelt ook hoe uitgevers de marktplaats gebruiken. Gebruik ClawHub niet om
ontdekking, statistieken, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht te
manipuleren.

Niet-toegestaan marktplaatsgedrag omvat:

- massaal grote aantallen weinig-inspannende, duplicerende, placeholder- of
  machinaal gegenereerde vermeldingen publiceren die geen echte gebruikerswaarde lijken te hebben
- zoek- of categorieoppervlakken overspoelen met vrijwel identieke Skills of plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- installaties, downloads, sterren of andere betrokkenheidsstatistieken kunstmatig
  opdrijven via automatisering, zelfinstallatielussen, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- accounts aanmaken of rouleren om moderatie, bans, uitgeverslimieten of
  marktplaatsbeoordeling te ontwijken
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of verbondenheid met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem op te lossen

Publiceren met hoog volume is niet automatisch misbruik. Grote catalogi zijn aanvaardbaar
wanneer de vermeldingen betekenisvol verschillend, nauwkeurig beschreven, onderhouden
en gebruikt door echte gebruikers zijn. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume wordt gecombineerd met dunne, duplicerende, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als u denkt dat content op ClawHub inbreuk maakt op uw auteursrecht of andere rechten, gebruik dan
[Verzoeken over contentrechten](/clawhub/content-rights). Gebruik normale marktplaatsmeldingen niet
voor auteursrecht- of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadwillend of misleidend is.

## Beoordeling en handhaving

ClawHub kan geautomatiseerde controles, statistische signalen van misbruik, gebruikersmeldingen en
beoordeling door medewerkers gebruiken om onveilige content of misbruik van publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub te bepalen wat beoordeling nodig heeft.

We kunnen:

- overtredende vermeldingen verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installaties voor onveilige releases blokkeren
- API-tokens intrekken
- gekoppelde content soft-deleten
- publicatietoegang beperken
- recidivisten of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor meldingen, moderatieblokkeringen,
verborgen vermeldingen, bans en accountstatus.
