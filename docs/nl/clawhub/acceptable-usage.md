---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of beoordelaarsrunbooks schrijven
    - Bepalen of een skill moet worden verborgen of een gebruiker moet worden geband
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet zal hosten.'
title: Aanvaardbaar gebruik
x-i18n:
    generated_at: "2026-06-28T07:41:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Acceptabel gebruik

ClawHub host Skills, plugins, pakketten en marketplace-metadata voor OpenClaw.
Gebruik deze pagina om te bepalen of content of publicatiegedrag thuishoort op
ClawHub.

Deze regels gelden voor wat een vermelding doet, wat deze gebruikers vraagt uit te voeren, hoe deze
zichzelf presenteert en hoe uitgevers ClawHub's oppervlakken voor ontdekking, installatie en
vertrouwen gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/nl/clawhub/moderation). Zie voor auteursrecht of andere
rechtenclaims [Verzoeken over contentrechten](/nl/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig en begrijpelijk is, en te goeder trouw wordt
gepubliceerd.

| Categorie                                         | Toegestaan wanneer                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                           | De vermelding gebruikers helpt software te bouwen, testen, migreren, debuggen, documenteren of beheren.                                               |
| Workflows voor UI, data en automatisering               | De scope duidelijk is, vereiste referenties expliciet zijn, en risicovolle acties review-, dry-run-, preview- of bevestigingspaden bevatten. |
| Defensieve beveiliging, moderatie en misbruikreview | De tool is gepresenteerd voor geautoriseerde review, bewijsmateriaal bewaart en grenzen voor menselijke goedkeuring duidelijk houdt.                          |
| Persoonlijke of teamworkflows                       | De workflow toestemmingsgebaseerde accounts, transparante installatie en expliciete machtigingen gebruikt.                                            |
| Onderhouden catalogi                              | Elke vermelding onderscheidend, nuttig, accuraat beschreven en redelijk onderhouden is.                                                |

Context is belangrijk. Hetzelfde onderwerp kan acceptabel zijn in een beperkte defensieve of
toestemmingsgebaseerde setting en onacceptabel wanneer het is verpakt als misbruikworkflow.

## Verboden content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of rechteninbreuk is.

| Categorie                                                    | Niet toegestaan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of beveiligingsomzeiling                      | Auth-omzeiling, accountovername, misbruik van rate limits, livecall- of agentovername, herbruikbare sessiediefstal, of automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                                                                                                   |
| Platformmisbruik en omzeiling van bans                              | Stealthaccounts na bans, accountopwarming of -farming, nepbetrokkenheid, automatisering met meerdere accounts, massaal posten, spambotten, of automatisering die is gebouwd om detectie te vermijden.                                                                                                                                          |
| Fraude, scams en misleidende financiële workflows             | Valse certificaten of facturen, misleidende betaalflows, scam-outreach, vals sociaal bewijs, workflows met synthetische identiteiten voor fraude, of tools voor uitgaven/afschrijvingen zonder duidelijke menselijke goedkeuring.                                                                                                                    |
| Privacy-invasieve verrijking of surveillance                 | Contacten scrapen voor spam, doxxing, stalking, leadextractie gekoppeld aan ongevraagde outreach, heimelijke monitoring, niet-consensuele biometrische matching, of gebruik van gelekte data of breach-dumps.                                                                                                                  |
| Niet-consensuele imitatie of identiteitsmanipulatie       | Face swap, digitale tweelingen, gekloonde influencers, valse persona's, of andere tooling die wordt gebruikt om iemand na te doen of te misleiden.                                                                                                                                                                                                 |
| Expliciete seksuele content of generatie voor volwassenen met uitgeschakelde veiligheidsmaatregelen | Genereren van NSFW-afbeeldingen, -video's of -content; wrappers voor adult-content rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                                       |
| Verborgen, onveilige of misleidende uitvoeringsvereisten        | Versluierde installatiecommando's, pipe-to-shell-installers zoals gedownloade content die met `sh` of `bash` wordt uitgevoerd zonder duidelijke beoordeelbaarheid, niet-vermelde vereisten voor geheimen of privésleutels, externe uitvoering van `npx @latest` zonder duidelijke beoordeelbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Auteursrechtinbreukmakend of rechten-schendend materiaal           | Iemands anders skill, plugin, docs, merkmiddelen of propriëtaire code opnieuw publiceren zonder toestemming; licentievoorwaarden schenden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                                            |

## Verboden marketplace-gedrag

ClawHub beoordeelt ook hoe uitgevers de marketplace gebruiken. Gebruik ClawHub niet om
ontdekking, statistieken, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht te
manipuleren.

Verboden marketplace-gedrag omvat:

- het bulkpubliceren van grote aantallen laagwaardige, duplicatieve, placeholder- of
  machinaal gegenereerde vermeldingen die geen echte gebruikerswaarde lijken te hebben
- het overspoelen van zoek- of categorieoppervlakken met vrijwel identieke Skills of plugins
- het publiceren van honderden vermeldingen met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- het kunstmatig opdrijven van installaties, downloads, sterren of andere betrokkenheidsstatistieken
  via automatisering, zelfinstallatielussen, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- accounts maken of roteren om moderatie, bans, uitgeverslimieten of
  marketplace-review te omzeilen
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of affiliatie met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem op te lossen

Publiceren in hoog volume is niet automatisch misbruik. Grote catalogi zijn acceptabel
wanneer de vermeldingen betekenisvol verschillend, accuraat beschreven, onderhouden
en door echte gebruikers gebruikt worden. Grote catalogi worden een probleem voor vertrouwen en veiligheid wanneer
volume gepaard gaat met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als je denkt dat content op ClawHub inbreuk maakt op je auteursrecht of andere rechten, gebruik dan
[Verzoeken over contentrechten](/nl/clawhub/content-rights). Gebruik normale marketplace-
rapporten niet voor auteursrecht- of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Review en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersrapporten en
staffreview gebruiken om onveilige content of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub bepalen wat review nodig heeft.

We kunnen:

- inbreukmakende vermeldingen verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installaties blokkeren voor onveilige releases
- API-tokens intrekken
- gekoppelde content soft-deleten
- publicatietoegang beperken
- recidivisten of ernstige overtreders bannen

We garanderen geen handhaving met waarschuwing vooraf bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/nl/clawhub/moderation) voor rapporten, moderatievasthoudingen,
verborgen vermeldingen, bans en accountstatus.
