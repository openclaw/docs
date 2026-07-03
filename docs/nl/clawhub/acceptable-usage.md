---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of draaiboeken voor beoordelaars schrijven
    - Beslissen of een skill verborgen moet worden of een gebruiker geblokkeerd moet worden
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet zal hosten.'
title: Acceptabel gebruik
x-i18n:
    generated_at: "2026-07-03T09:44:43Z"
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

Deze regels zijn van toepassing op wat een vermelding doet, wat deze gebruikers vraagt uit te voeren, hoe deze
zichzelf presenteert en hoe uitgevers ClawHub's oppervlakken voor ontdekking, installatie en
vertrouwen gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/clawhub/moderation). Zie voor auteursrechtclaims of andere rechtenclaims
[Verzoeken over contentrechten](/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw
gepubliceerd is.

| Categorie                                         | Toegestaan wanneer                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                           | De vermelding helpt gebruikers software te bouwen, testen, migreren, debuggen, documenteren of beheren.                                               |
| UI-, data- en automatiseringsworkflows               | De scope is duidelijk, vereiste inloggegevens zijn expliciet en risicovolle acties bevatten paden voor review, dry-run, preview of bevestiging. |
| Defensieve beveiliging, moderatie en misbruikreview | De tool is gepositioneerd voor geautoriseerde review, bewaart bewijs en houdt grenzen voor menselijke goedkeuring duidelijk.                          |
| Persoonlijke of teamworkflows                       | De workflow gebruikt accounts op basis van toestemming, transparante setup en expliciete machtigingen.                                            |
| Onderhouden catalogi                              | Elke vermelding is onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden.                                                |

Context doet ertoe. Hetzelfde onderwerp kan aanvaardbaar zijn in een nauwe defensieve of
op toestemming gebaseerde setting en onaanvaardbaar wanneer het is verpakt als een misbruikworkflow.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of inbreuk op rechten is.

| Categorie                                                    | Niet toegestaan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of beveiligingsomzeiling                      | Auth-omzeiling, accountovername, misbruik van rate limits, overname van live gesprekken of agents, herbruikbare sessiediefstal, of automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                                                                                                   |
| Platformmisbruik en omzeiling van bans                              | Stealth-accounts na bans, account-warming of -farming, nepbetrokkenheid, automatisering met meerdere accounts, massaal posten, spambotten, of automatisering die is gebouwd om detectie te vermijden.                                                                                                                                          |
| Fraude, scams en misleidende financiële workflows             | Valse certificaten of facturen, misleidende betaalflows, scam-outreach, vals sociaal bewijs, workflows voor synthetische identiteiten voor fraude, of tools voor uitgaven/incasso zonder duidelijke menselijke goedkeuring.                                                                                                                    |
| Privacy-invasieve verrijking of surveillance                 | Contacten scrapen voor spam, doxxing, stalking, leadextractie gekoppeld aan ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming, of gebruik van gelekte data of breach-dumps.                                                                                                                  |
| Impersonatie of identiteitsmanipulatie zonder toestemming       | Face swap, digitale tweelingen, gekloonde influencers, neppersona's, of andere tooling die wordt gebruikt om zich voor iemand anders uit te geven of te misleiden.                                                                                                                                                                                                 |
| Expliciete seksuele content of generatie van volwassenencontent met uitgeschakelde veiligheidsfuncties | Generatie van NSFW-afbeeldingen, -video's of -content; wrappers voor volwassenencontent rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                                       |
| Verborgen, onveilige of misleidende uitvoeringsvereisten        | Verduisterde installatiecommando's, pipe-to-shell-installers zoals gedownloade content die wordt uitgevoerd met `sh` of `bash` zonder duidelijke reviewbaarheid, niet-gedeclareerde vereisten voor secrets of private keys, externe `npx @latest`-uitvoering zonder duidelijke reviewbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Auteursrechtinbreukmakend of rechten schendend materiaal           | Iemands Skill, plugin, docs, merkassets of propriëtaire code opnieuw publiceren zonder toestemming; licentievoorwaarden schenden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                                            |

## Niet-toegestaan marketplace-gedrag

ClawHub beoordeelt ook hoe uitgevers de marketplace gebruiken. Gebruik ClawHub niet om
ontdekking, statistieken, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht
te manipuleren.

Niet-toegestaan marketplace-gedrag omvat:

- in bulk grote aantallen vermeldingen publiceren die weinig inspanning vereisen, duplicatief zijn, placeholders zijn of
  machinaal gegenereerd zijn en geen echte gebruikerswaarde lijken te hebben
- zoek- of categorieoppervlakken overspoelen met vrijwel identieke Skills of plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- installaties, downloads, sterren of andere betrokkenheidsstatistieken kunstmatig
  opdrijven via automatisering, zelfinstallatielussen, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- accounts aanmaken of roteren om moderatie, bans, uitgeverslimieten of
  marketplace-review te omzeilen
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of affiliatie met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al verborgen, verwijderd of geblokkeerd is
  zonder het onderliggende probleem op te lossen

Publiceren op hoog volume is niet automatisch misbruik. Grote catalogi zijn aanvaardbaar
wanneer de vermeldingen betekenisvol verschillen, nauwkeurig beschreven zijn, onderhouden worden
en door echte gebruikers worden gebruikt. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume gepaard gaat met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als je denkt dat content op ClawHub inbreuk maakt op je auteursrecht of andere rechten, gebruik dan
[Verzoeken over contentrechten](/clawhub/content-rights). Gebruik normale marketplace-
meldingen niet voor auteursrechtclaims of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Review en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersmeldingen en
staffreview gebruiken om onveilige content of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub bepalen wat review nodig heeft.

We kunnen:

- vermeldingen die de regels schenden verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installaties blokkeren voor onveilige releases
- API-tokens intrekken
- gekoppelde content soft-deleten
- publicatietoegang beperken
- recidivisten of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor meldingen, moderatieholds,
verborgen vermeldingen, bans en accountstatus.
