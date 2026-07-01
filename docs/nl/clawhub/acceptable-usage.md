---
read_when:
    - Uploads beoordelen op misbruik of beleidsschendingen
    - Documentatie over moderatie of reviewer-runbooks schrijven
    - Beslissen of een skill moet worden verborgen of een gebruiker moet worden verbannen
sidebarTitle: Acceptable Usage
summary: 'Marktplaatsbeleid: wat ClawHub toestaat en wat het niet zal hosten.'
title: Acceptabel gebruik
x-i18n:
    generated_at: "2026-07-01T18:16:14Z"
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

Deze regels gelden voor wat een vermelding doet, wat zij gebruikers vraagt uit te voeren, hoe zij
zichzelf presenteert en hoe uitgevers de vindbaarheids-, installatie- en
vertrouwensoppervlakken van ClawHub gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en accountveiligheid](/clawhub/moderation). Zie voor auteursrecht of andere
rechtenclaims [Verzoeken over contentrechten](/nl/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig, begrijpelijk en te goeder trouw
gepubliceerd is.

| Categorie                                         | Toegestaan wanneer                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                           | De vermelding helpt gebruikers software te bouwen, testen, migreren, debuggen, documenteren of beheren.                                               |
| UI-, data- en automatiseringsworkflows               | De scope is duidelijk, vereiste referenties zijn expliciet en risicovolle acties bevatten paden voor review, dry-run, preview of bevestiging. |
| Defensieve beveiliging, moderatie en misbruikreview | De tool is gepositioneerd voor geautoriseerde review, bewaart bewijsmateriaal en houdt grenzen voor menselijke goedkeuring duidelijk.                          |
| Persoonlijke of teamworkflows                       | De workflow gebruikt accounts op basis van toestemming, transparante installatie en expliciete machtigingen.                                            |
| Onderhouden catalogi                              | Elke vermelding is onderscheidend, nuttig, accuraat beschreven en redelijk onderhouden.                                                |

Context is belangrijk. Hetzelfde onderwerp kan acceptabel zijn in een smalle defensieve of
op toestemming gebaseerde context en onacceptabel wanneer het wordt verpakt als een misbruikworkflow.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of inbreuk op rechten is.

| Categorie                                                    | Niet toegestaan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of beveiligingsomzeiling                      | Auth-omzeiling, accountovername, misbruik van rate limits, overname van live calls of agents, herbruikbare sessiediefstal, of het automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                                                                                                   |
| Platformmisbruik en omzeiling van bans                              | Stealth-accounts na bans, account warming of farming, nepbetrokkenheid, automatisering met meerdere accounts, massaal posten, spambots of automatisering die is gebouwd om detectie te vermijden.                                                                                                                                          |
| Fraude, scams en misleidende financiële workflows             | Valse certificaten of facturen, misleidende betalingsflows, scam-outreach, valse social proof, workflows met synthetische identiteiten voor fraude, of tools voor uitgeven/incasseren zonder duidelijke menselijke goedkeuring.                                                                                                                    |
| Privacy-invasieve verrijking of surveillance                 | Contacten scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming, of gebruik van gelekte data of breach dumps.                                                                                                                  |
| Impersonatie of identiteitsmanipulatie zonder toestemming       | Face swap, digitale tweelingen, gekloonde influencers, neppersona's of andere tooling die wordt gebruikt om zich voor te doen als iemand anders of te misleiden.                                                                                                                                                                                                 |
| Expliciete seksuele content of adult-generatie met uitgeschakelde veiligheidsmaatregelen | NSFW-afbeeldings-, video- of contentgeneratie; wrappers voor adult-content rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                                       |
| Verborgen, onveilige of misleidende uitvoeringsvereisten        | Verdoezelde installatiecommando's, pipe-to-shell-installers zoals gedownloade content die wordt uitgevoerd met `sh` of `bash` zonder duidelijke reviewbaarheid, niet-gedeclareerde vereisten voor secrets of privésleutels, externe uitvoering van `npx @latest` zonder duidelijke reviewbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Auteursrechtinbreukmakend of rechten-schendend materiaal           | Iemands anders skill, plugin, docs, merkassets of propriëtaire code opnieuw publiceren zonder toestemming; licentievoorwaarden schenden; of zich voordoen als de oorspronkelijke auteur of uitgever.                                                                                                                            |

## Niet-toegestaan marketplace-gedrag

ClawHub beoordeelt ook hoe uitgevers de marketplace gebruiken. Gebruik ClawHub niet om
vindbaarheid, metrics, vertrouwenssignalen, moderatiesystemen of gebruikersaandacht
te manipuleren.

Niet-toegestaan marketplace-gedrag omvat:

- het in bulk publiceren van grote aantallen weinig-inspannende, duplicatieve, placeholder- of
  machinegegenereerde vermeldingen die geen echte gebruikerswaarde lijken te hebben
- zoek- of categorieoppervlakken overspoelen met bijna-identieke Skills of plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, bronduidelijkheid
  of betekenisvolle differentiatie
- installaties, downloads, sterren of andere betrokkenheidsmetrics kunstmatig
  opdrijven via automatisering, self-install-loops, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- accounts aanmaken of roteren om moderatie, bans, uitgeverslimieten of
  marketplace-review te omzeilen
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of affiliatie met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem te verhelpen

Publiceren op hoog volume is niet automatisch misbruik. Grote catalogi zijn acceptabel
wanneer de vermeldingen betekenisvol verschillend zijn, accuraat beschreven, onderhouden
en gebruikt door echte gebruikers. Grote catalogi worden een vertrouwens- en veiligheidsprobleem wanneer
volume wordt gecombineerd met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als je denkt dat content op ClawHub inbreuk maakt op je auteursrecht of andere rechten, gebruik dan
[Verzoeken over contentrechten](/nl/clawhub/content-rights). Gebruik normale marketplace-
rapporten niet voor auteursrecht- of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Review en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersrapporten en
staff-review gebruiken om onveilige content of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub te bepalen wat review nodig heeft.

We kunnen:

- schendende vermeldingen verbergen, vasthouden, verwijderen, soft-delete uitvoeren of, waar ondersteund voor het resourcetype,
  hard-delete uitvoeren
- downloads of installaties blokkeren voor onveilige releases
- API-tokens intrekken
- soft-delete uitvoeren op gekoppelde content
- publicatietoegang beperken
- herhaaldelijke of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en accountveiligheid](/clawhub/moderation) voor rapporten, moderatieholds,
verborgen vermeldingen, bans en accountstatus.
