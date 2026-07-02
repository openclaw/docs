---
read_when:
    - Uploads controleren op misbruik of beleidsschendingen
    - Moderatiedocumentatie of draaiboeken voor beoordelaars schrijven
    - Beslissen of een skill verborgen moet worden of een gebruiker geblokkeerd
sidebarTitle: Acceptable Usage
summary: 'Marketplace-beleid: wat ClawHub toestaat en wat het niet host.'
title: Aanvaardbaar gebruik
x-i18n:
    generated_at: "2026-07-02T08:28:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar gebruik

ClawHub host Skills, Plugins, pakketten en marktplaatsmetadata voor OpenClaw.
Gebruik deze pagina om te bepalen of inhoud of publicatiegedrag op
ClawHub thuishoort.

Deze regels gelden voor wat een vermelding doet, wat deze gebruikers vraagt uit te voeren, hoe deze
zichzelf presenteert en hoe uitgevers de ontdekkings-, installatie- en
vertrouwensoppervlakken van ClawHub gebruiken. Voor moderatiestatussen en accountstatus, zie
[Moderatie en accountveiligheid](/clawhub/moderation). Voor auteursrechtelijke of andere rechtenclaims,
zie [Verzoeken over inhoudsrechten](/nl/clawhub/content-rights).

## Toegestane inhoud

ClawHub verwelkomt inhoud die nuttig, begrijpelijk en te goeder trouw gepubliceerd is.

| Categorie                                         | Toegestaan wanneer                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                           | De vermelding gebruikers helpt software te bouwen, testen, migreren, debuggen, documenteren of beheren.                                               |
| UI-, data- en automatiseringsworkflows               | De scope duidelijk is, vereiste referenties expliciet zijn en risicovolle acties beoordelings-, dry-run-, preview- of bevestigingspaden bevatten. |
| Defensieve beveiliging, moderatie en misbruikbeoordeling | De tool is gepositioneerd voor geautoriseerde beoordeling, bewijs bewaart en grenzen voor menselijke goedkeuring duidelijk houdt.                          |
| Persoonlijke of teamworkflows                       | De workflow op toestemming gebaseerde accounts, transparante configuratie en expliciete machtigingen gebruikt.                                            |
| Onderhouden catalogi                              | Elke vermelding onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden is.                                                |

Context is belangrijk. Hetzelfde onderwerp kan acceptabel zijn in een nauw defensieve of
op toestemming gebaseerde setting en onacceptabel wanneer het als misbruikworkflow is verpakt.

## Niet-toegestane inhoud

ClawHub host geen inhoud waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of rechteninbreuk is.

| Categorie                                                    | Niet toegestaan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of beveiligingsomzeiling                      | Auth-omzeiling, accountovername, misbruik van snelheidslimieten, live call- of agentovername, herbruikbare sessiediefstal of automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                                                                                                   |
| Platformmisbruik en ban-ontduiking                              | Stealth-accounts na bans, accountwarming of -farming, nepbetrokkenheid, automatisering met meerdere accounts, massaal posten, spambots of automatisering die is gebouwd om detectie te vermijden.                                                                                                                                          |
| Fraude, scams en misleidende financiële workflows             | Valse certificaten of facturen, misleidende betalingsflows, scam-outreach, nep sociaal bewijs, workflows met synthetische identiteiten voor fraude, of tools voor uitgeven/innen zonder duidelijke menselijke goedkeuring.                                                                                                                    |
| Privacy-invasieve verrijking of surveillance                 | Contacten scrapen voor spam, doxxing, stalking, leadextractie gekoppeld aan ongevraagde outreach, heimelijke monitoring, niet-consensuele biometrische matching, of gebruik van gelekte data of breach dumps.                                                                                                                  |
| Niet-consensuele imitatie of identiteitsmanipulatie       | Face swap, digitale tweelingen, gekloonde influencers, neppersona's of andere tooling die wordt gebruikt om iemand na te doen of te misleiden.                                                                                                                                                                                                 |
| Expliciete seksuele inhoud of adult generation met uitgeschakelde veiligheidsmaatregelen | NSFW-afbeeldings-, video- of inhoudsgeneratie; wrappers voor volwassen inhoud rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele inhoud is.                                                                                                                                                       |
| Verborgen, onveilige of misleidende uitvoeringsvereisten        | Versluierde installatiecommando's, pipe-to-shell-installers zoals gedownloade inhoud die met `sh` of `bash` wordt uitgevoerd zonder duidelijke beoordeelbaarheid, niet-gemelde vereisten voor geheimen of privésleutels, externe uitvoering van `npx @latest` zonder duidelijke beoordeelbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Auteursrechtschendend of rechteninbreukmakend materiaal           | Iemands anders Skill, Plugin, docs, merkassets of propriëtaire code opnieuw publiceren zonder toestemming; licentievoorwaarden schenden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                                            |

## Niet-toegestaan marktplaatsgedrag

ClawHub beoordeelt ook hoe uitgevers de marktplaats gebruiken. Gebruik ClawHub niet om
ontdekking, metrics, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht
te manipuleren.

Niet-toegestaan marktplaatsgedrag omvat:

- massaal grote aantallen low-effort, duplicatieve, placeholder- of
  machinaal gegenereerde vermeldingen publiceren die geen echte gebruikerswaarde lijken te hebben
- zoek- of categorieoppervlakken overspoelen met vrijwel identieke Skills of Plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, duidelijkheid over de bron
  of betekenisvol onderscheid
- installaties, downloads, sterren of andere betrokkenheidsmetrics kunstmatig opblazen
  via automatisering, self-install loops, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- accounts aanmaken of roteren om moderatie, bans, uitgeverslimieten of
  marktplaatsbeoordeling te ontduiken
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of verbondenheid met een ander project of een andere uitgever
- herhaaldelijk inhoud uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem op te lossen

Publiceren in hoog volume is niet automatisch misbruik. Grote catalogi zijn acceptabel
wanneer de vermeldingen betekenisvol verschillen, nauwkeurig beschreven, onderhouden
en door echte gebruikers gebruikt worden. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume gepaard gaat met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Inhoudsrechten

Als u denkt dat inhoud op ClawHub inbreuk maakt op uw auteursrecht of andere rechten, gebruik dan
[Verzoeken over inhoudsrechten](/nl/clawhub/content-rights). Gebruik normale marktplaatsrapporten niet
voor auteursrechtelijke of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Beoordeling en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersrapporten en
personeelsbeoordeling gebruiken om onveilige inhoud of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub bepalen wat beoordeling nodig heeft.

We kunnen:

- vermeldingen die regels schenden verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installaties voor onveilige releases blokkeren
- API-tokens intrekken
- gekoppelde inhoud soft-deleten
- publicatietoegang beperken
- recidivisten of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor rapporten, moderatieblokkades,
verborgen vermeldingen, bans en accountstatus.
