---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of reviewer-runbooks schrijven
    - Beslissen of een skill verborgen moet worden of een gebruiker geblokkeerd moet worden
sidebarTitle: Acceptable Usage
summary: 'Marktplaatsbeleid: wat ClawHub toestaat en wat het niet zal hosten.'
title: Aanvaardbaar gebruik
x-i18n:
    generated_at: "2026-07-01T08:12:57Z"
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

Deze regels gelden voor wat een listing doet, wat deze gebruikers vraagt uit te voeren, hoe deze
zichzelf presenteert en hoe uitgevers ClawHub's discovery-, installatie- en
vertrouwensoppervlakken gebruiken. Voor moderatiestatussen en accountstatus, zie
[Moderatie en accountveiligheid](/clawhub/moderation). Voor auteursrecht- of andere rechtenclaims,
zie [Aanvragen voor contentrechten](/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw is
gepubliceerd.

| Categorie                                         | Toegestaan wanneer                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                           | De listing helpt gebruikers software te bouwen, testen, migreren, debuggen, documenteren of beheren.                                               |
| UI-, data- en automatiseringsworkflows               | De scope is duidelijk, vereiste referenties zijn expliciet, en risicovolle acties bevatten review-, dry-run-, preview- of bevestigingspaden. |
| Defensieve beveiliging, moderatie en beoordeling van misbruik | De tool is gepositioneerd voor geautoriseerde beoordeling, bewaart bewijs en houdt grenzen voor menselijke goedkeuring duidelijk.                          |
| Persoonlijke of teamworkflows                       | De workflow gebruikt accounts op basis van toestemming, transparante configuratie en expliciete machtigingen.                                            |
| Onderhouden catalogi                              | Elke listing is onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden.                                                |

Context is belangrijk. Hetzelfde onderwerp kan aanvaardbaar zijn in een beperkte defensieve of
op toestemming gebaseerde setting en onaanvaardbaar wanneer het als misbruikworkflow wordt verpakt.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of inbreuk op rechten is.

| Categorie                                                    | Niet toegestaan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of beveiligingsomzeiling                      | Auth-omzeiling, accountovername, misbruik van rate limits, overname van live calls of agents, herbruikbare sessiediefstal, of het automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                                                                                                   |
| Platformmisbruik en omzeiling van bans                              | Stealth-accounts na bans, accountopwarming of -farming, nepbetrokkenheid, automatisering met meerdere accounts, massaal posten, spambots of automatisering gebouwd om detectie te vermijden.                                                                                                                                          |
| Fraude, oplichting en misleidende financiële workflows             | Valse certificaten of facturen, misleidende betalingsflows, scam-outreach, nep-social proof, workflows met synthetische identiteiten voor fraude, of uitgaven-/incassotools zonder duidelijke menselijke goedkeuring.                                                                                                                    |
| Privacy-invasieve verrijking of surveillance                 | Contacten scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming, of gebruik van gelekte data of breach-dumps.                                                                                                                  |
| Impersonatie of identiteitsmanipulatie zonder toestemming       | Face swap, digitale tweelingen, gekloonde influencers, neppersona's of andere tooling die wordt gebruikt om zich als iemand anders voor te doen of te misleiden.                                                                                                                                                                                                 |
| Expliciete seksuele content of generatie van volwassen content met uitgeschakelde veiligheid | NSFW-generatie van afbeeldingen, video's of content; wrappers voor volwassen content rond API's van derden; of listings waarvan het primaire doel expliciete seksuele content is.                                                                                                                                                       |
| Verborgen, onveilige of misleidende uitvoeringsvereisten        | Verduisterde installatieopdrachten, pipe-to-shell-installers zoals gedownloade content die met `sh` of `bash` wordt uitgevoerd zonder duidelijke reviewbaarheid, niet-aangegeven vereisten voor geheimen of privésleutels, externe `npx @latest`-uitvoering zonder duidelijke reviewbaarheid, of metadata die verbergt wat de listing werkelijk nodig heeft om te draaien. |
| Materiaal dat auteursrechten schendt of rechten overtreedt           | Het opnieuw publiceren van iemands anders skill, plugin, docs, merkassets of propriëtaire code zonder toestemming; het schenden van licentievoorwaarden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                                            |

## Niet-toegestaan marketplace-gedrag

ClawHub beoordeelt ook hoe uitgevers de marketplace gebruiken. Gebruik ClawHub niet om
discovery, statistieken, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht
te manipuleren.

Niet-toegestaan marketplace-gedrag omvat:

- het in bulk publiceren van grote aantallen low-effort, duplicatieve, tijdelijke of
  machinegegenereerde listings die geen echte gebruikerswaarde lijken te hebben
- het overspoelen van zoek- of categorieoppervlakken met vrijwel identieke skills of plugins
- het publiceren van honderden listings met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- het kunstmatig opdrijven van installaties, downloads, sterren of andere
  betrokkenheidsstatistieken via automatisering, self-install-loops, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- accounts aanmaken of roteren om moderatie, bans, uitgeverslimieten of
  marketplace-review te omzeilen
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of verbondenheid met een ander project of andere uitgever
- herhaaldelijk content uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem op te lossen

Publiceren met hoog volume is niet automatisch misbruik. Grote catalogi zijn aanvaardbaar
wanneer de listings betekenisvol verschillen, nauwkeurig beschreven zijn, onderhouden worden
en door echte gebruikers worden gebruikt. Grote catalogi worden een probleem voor vertrouwen en veiligheid wanneer
volume samengaat met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote listings.

## Contentrechten

Als je denkt dat content op ClawHub inbreuk maakt op je auteursrecht of andere rechten, gebruik
[Aanvragen voor contentrechten](/clawhub/content-rights). Gebruik normale marketplace-
meldingen niet voor auteursrecht- of rechtenclaims tenzij de listing ook onveilig,
kwaadaardig of misleidend is.

## Review en handhaving

ClawHub kan geautomatiseerde controles, statistische signalen van misbruik, gebruikersmeldingen en
personeelsreview gebruiken om onveilige content of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub te bepalen wat review nodig heeft.

We kunnen:

- listings die regels overtreden verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installaties voor onveilige releases blokkeren
- API-tokens intrekken
- gekoppelde content soft-deleten
- publicatietoegang beperken
- recidivisten of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor meldingen, moderatieblokkeringen,
verborgen listings, bans en accountstatus.
