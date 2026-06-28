---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Documentatie voor moderatie of reviewer-runbooks schrijven
    - Beslissen of een skill verborgen moet worden of een gebruiker geblokkeerd moet worden
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet host.'
title: Acceptabel gebruik
x-i18n:
    generated_at: "2026-06-28T08:00:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar gebruik

ClawHub host Skills, Plugins, pakketten en marktplaatsmetadata voor OpenClaw.
Gebruik deze pagina om te bepalen of content of publicatiegedrag thuishoort op
ClawHub.

Deze regels gelden voor wat een vermelding doet, wat deze gebruikers vraagt uit
te voeren, hoe deze zichzelf presenteert en hoe uitgevers de discovery-,
installatie- en vertrouwensoppervlakken van ClawHub gebruiken. Zie voor moderatiestanden
en accountstatus
[Moderatie en accountveiligheid](/nl/clawhub/moderation). Zie voor auteursrecht of andere
rechtenclaims [Verzoeken over contentrechten](/nl/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw
gepubliceerd is.

| Categorie                                        | Toegestaan wanneer                                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                | De vermelding gebruikers helpt software te bouwen, testen, migreren, debuggen, documenteren of beheren.                           |
| UI-, data- en automatiseringsworkflows           | De scope duidelijk is, vereiste inloggegevens expliciet zijn, en risicovolle acties beoordelings-, simulatie-, voorbeeldweergave- of bevestigingspaden bevatten. |
| Defensieve beveiliging, moderatie en misbruikbeoordeling | De tool is gekaderd voor geautoriseerde beoordeling, bewijs bewaart en grenzen voor menselijke goedkeuring duidelijk houdt.        |
| Persoonlijke of teamworkflows                    | De workflow accounts op basis van toestemming, transparante installatie en expliciete machtigingen gebruikt.                       |
| Onderhouden catalogi                             | Elke vermelding onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden is.                                          |

Context is belangrijk. Hetzelfde onderwerp kan acceptabel zijn in een smalle
defensieve of op toestemming gebaseerde setting en onacceptabel wanneer het als
misbruikworkflow is verpakt.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of inbreuk op rechten is.

| Categorie                                                   | Niet toegestaan                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of omzeiling van beveiliging       | Auth-omzeiling, accountovername, misbruik van snelheidslimieten, live call- of agentovername, herbruikbare sessiediefstal, of automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                                                   |
| Platformmisbruik en omzeiling van bans                      | Stealthaccounts na bans, accountopwarming of -farming, nepbetrokkenheid, automatisering met meerdere accounts, massaal posten, spambots, of automatisering die is gebouwd om detectie te vermijden.                                                                                                          |
| Fraude, scams en misleidende financiële workflows           | Valse certificaten of facturen, misleidende betalingsflows, scam-outreach, vals sociaal bewijs, workflows met synthetische identiteiten voor fraude, of tools voor uitgeven/incasseren zonder duidelijke menselijke goedkeuring.                                                                               |
| Privacy-schendende verrijking of surveillance               | Contacten scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming, of gebruik van gelekte data of breach-dumps.                                                                                             |
| Imitatie zonder toestemming of identiteitsmanipulatie       | Gezichtswissel, digitale tweelingen, gekloonde influencers, neppersona's of andere tooling die wordt gebruikt om te imiteren of te misleiden.                                                                                                                                                                 |
| Expliciete seksuele content of generatie voor volwassenen met uitgeschakelde veiligheidsfuncties | NSFW-afbeeldings-, video- of contentgeneratie; wrappers voor adult-content rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                    |
| Verborgen, onveilige of misleidende uitvoeringsvereisten    | Verduisterde installatiecommando's, pipe-to-shell-installers zoals gedownloade content die met `sh` of `bash` wordt uitgevoerd zonder duidelijke beoordeelbaarheid, niet-gedeclareerde vereisten voor geheimen of privésleutels, externe `npx @latest`-uitvoering zonder duidelijke beoordeelbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Materiaal dat auteursrecht schendt of rechten overtreedt    | Iemands anders Skill, Plugin, docs, merkassets of propriëtaire code opnieuw publiceren zonder toestemming; licentievoorwaarden schenden; of de oorspronkelijke auteur of uitgever imiteren.                                                                                                                   |

## Niet-toegestaan marktplaatsgedrag

ClawHub beoordeelt ook hoe uitgevers de marktplaats gebruiken. Gebruik ClawHub
niet om discovery, metrics, vertrouwenssignalen, moderatiesystemen of
gebruikersaandacht te manipuleren.

Niet-toegestaan marktplaatsgedrag omvat:

- in bulk grote aantallen vermeldingen publiceren die weinig moeite tonen,
  duplicatief zijn, placeholders zijn of door machines zijn gegenereerd en geen
  echte gebruikerswaarde lijken te hebben
- zoek- of categorieoppervlakken overspoelen met bijna identieke Skills of Plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud,
  duidelijkheid over de bron of betekenisvolle differentiatie
- installaties, downloads, sterren of andere betrokkenheidsmetrics kunstmatig
  verhogen via automatisering, self-install-loops, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- accounts maken of rouleren om moderatie, bans, uitgeverslimieten of
  marktplaatsbeoordeling te omzeilen
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of affiliatie met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al verborgen, verwijderd of geblokkeerd is
  zonder het onderliggende probleem op te lossen

Publiceren met hoog volume is niet automatisch misbruik. Grote catalogi zijn
acceptabel wanneer de vermeldingen betekenisvol verschillend, nauwkeurig
beschreven, onderhouden en door echte gebruikers gebruikt worden. Grote catalogi
worden een vertrouwens- en veiligheidsprobleem wanneer volume gepaard gaat met
dunne, duplicatieve, misleidende, niet-onderhouden of kunstmatig gepromote
vermeldingen.

## Contentrechten

Als je denkt dat content op ClawHub inbreuk maakt op je auteursrecht of andere
rechten, gebruik dan [Verzoeken over contentrechten](/nl/clawhub/content-rights). Gebruik
normale marktplaatsrapportages niet voor auteursrecht- of rechtenclaims, tenzij
de vermelding ook onveilig, schadelijk of misleidend is.

## Beoordeling en handhaving

ClawHub kan geautomatiseerde controles, statistische signalen van misbruik,
gebruikersrapportages en beoordeling door medewerkers gebruiken om onveilige
content of misbruikend publicatiegedrag te identificeren. Een signaal bewijst op
zichzelf geen misbruik; het helpt ClawHub te bepalen wat beoordeling nodig heeft.

We kunnen:

- vermeldingen die regels overtreden verbergen, vasthouden, verwijderen,
  zacht verwijderen of, waar ondersteund voor het resourcetype, hard verwijderen
- downloads of installaties blokkeren voor onveilige releases
- API-tokens intrekken
- gekoppelde content zacht verwijderen
- publicatietoegang beperken
- herhaalde of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/nl/clawhub/moderation) voor rapportages, moderatieholds,
verborgen vermeldingen, bans en accountstatus.
