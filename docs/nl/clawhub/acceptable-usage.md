---
read_when:
    - Uploads beoordelen op misbruik of beleidsschendingen
    - Moderatiedocumentatie of reviewer-runbooks schrijven
    - Beslissen of een skill verborgen moet worden of een gebruiker geblokkeerd moet worden
sidebarTitle: Acceptable Usage
summary: 'Marketplacebeleid: wat ClawHub toestaat en wat het niet zal hosten.'
title: Acceptabel gebruik
x-i18n:
    generated_at: "2026-06-27T17:14:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Aanvaardbaar Gebruik

ClawHub host Skills, Plugins, pakketten en marktplaatsmetadata voor OpenClaw.
Gebruik deze pagina om te bepalen of content of publicatiegedrag thuishoort op
ClawHub.

Deze regels zijn van toepassing op wat een vermelding doet, wat die gebruikers vraagt uit te voeren, hoe die
zichzelf presenteert en hoe uitgevers de discovery-, installatie- en
vertrouwensoppervlakken van ClawHub gebruiken. Zie voor moderatiestatussen en accountstatus
[Moderatie en Accountveiligheid](/nl/clawhub/moderation). Zie voor auteursrechtelijke of andere rechtenclaims
[Verzoeken voor Contentrechten](/nl/clawhub/content-rights).

## Toegestane content

ClawHub verwelkomt content die nuttig en begrijpelijk is en te goeder trouw is
gepubliceerd.

| Categorie                                         | Toegestaan wanneer                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productiviteit voor ontwikkelaars                           | De vermelding helpt gebruikers software te bouwen, testen, migreren, debuggen, documenteren of beheren.                                               |
| Workflows voor UI, data en automatisering               | De scope is duidelijk, vereiste referenties zijn expliciet en risicovolle acties bevatten paden voor beoordeling, dry-run, preview of bevestiging. |
| Defensieve beveiliging, moderatie en misbruikbeoordeling | De tool is gepositioneerd voor geautoriseerde beoordeling, bewaart bewijs en houdt grenzen voor menselijke goedkeuring duidelijk.                          |
| Persoonlijke of teamworkflows                       | De workflow gebruikt op toestemming gebaseerde accounts, transparante installatie en expliciete machtigingen.                                            |
| Onderhouden catalogi                              | Elke vermelding is onderscheidend, nuttig, nauwkeurig beschreven en redelijk onderhouden.                                                |

Context is belangrijk. Hetzelfde onderwerp kan aanvaardbaar zijn in een beperkte defensieve of
op toestemming gebaseerde setting en onaanvaardbaar wanneer het is verpakt als een workflow voor misbruik.

## Niet-toegestane content

ClawHub host geen content waarvan het hoofddoel misbruik, misleiding, onveilige
uitvoering of schending van rechten is.

| Categorie                                                    | Niet toegestaan                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongeautoriseerde toegang of beveiligingsomzeiling                      | Auth-omzeiling, accountovername, misbruik van rate limits, overname van live calls of agents, herbruikbare sessiediefstal of automatisch goedkeuren van koppelingsflows voor niet-goedgekeurde gebruikers.                                                                                                                                                   |
| Platformmisbruik en omzeiling van bans                              | Stealth-accounts na bans, account-warming of -farming, nepbetrokkenheid, multi-accountautomatisering, massaal posten, spambots of automatisering die is gebouwd om detectie te vermijden.                                                                                                                                          |
| Fraude, oplichting en misleidende financiële workflows             | Valse certificaten of facturen, misleidende betaalflows, scam-outreach, nep-social proof, synthetische-identiteitsworkflows voor fraude of tools voor uitgeven/incasseren zonder duidelijke menselijke goedkeuring.                                                                                                                    |
| Privacy-invasieve verrijking of surveillance                 | Contacten scrapen voor spam, doxxing, stalking, leadextractie gecombineerd met ongevraagde outreach, heimelijke monitoring, biometrische matching zonder toestemming of gebruik van gelekte data of breach dumps.                                                                                                                  |
| Impersonatie zonder toestemming of identiteitsmanipulatie       | Face swap, digitale tweelingen, gekloonde influencers, neppersona's of andere tooling die wordt gebruikt om iemand te imiteren of te misleiden.                                                                                                                                                                                                 |
| Expliciete seksuele content of adult-generatie met uitgeschakelde veiligheid | Genereren van NSFW-afbeeldingen, -video's of -content; adult-contentwrappers rond API's van derden; of vermeldingen waarvan het primaire doel expliciete seksuele content is.                                                                                                                                                       |
| Verborgen, onveilige of misleidende uitvoeringsvereisten        | Versluierde installatieopdrachten, pipe-to-shell-installers zoals gedownloade content die wordt uitgevoerd met `sh` of `bash` zonder duidelijke beoordeelbaarheid, niet-gemelde vereisten voor secrets of private keys, externe `npx @latest`-uitvoering zonder duidelijke beoordeelbaarheid, of metadata die verbergt wat de vermelding echt nodig heeft om te draaien. |
| Auteursrechtinbreukmakend of rechten-schendend materiaal           | Iemands anders Skills, Plugin, docs, merkassets of propriëtaire code opnieuw publiceren zonder toestemming; licentievoorwaarden schenden; of je voordoen als de oorspronkelijke auteur of uitgever.                                                                                                                            |

## Niet-toegestaan marktplaatsgedrag

ClawHub beoordeelt ook hoe uitgevers de marktplaats gebruiken. Gebruik ClawHub niet om
discovery, statistieken, vertrouwenssignalen, moderatiesystemen of aandacht van gebruikers
te manipuleren.

Niet-toegestaan marktplaatsgedrag omvat:

- in bulk grote aantallen minimale, duplicatieve, placeholder- of
  machinaal gegenereerde vermeldingen publiceren die geen echte gebruikerswaarde lijken te hebben
- zoek- of categorieoppervlakken overspoelen met vrijwel identieke Skills of Plugins
- honderden vermeldingen publiceren met weinig of geen gebruik, onderhoud, duidelijkheid over de bron
  of betekenisvol onderscheid
- installaties, downloads, sterren of andere betrokkenheidsstatistieken kunstmatig
  opblazen via automatisering, self-install-loops, nepaccounts, gecoördineerde
  activiteit, betaalde betrokkenheid of ander niet-organisch gedrag
- accounts aanmaken of rouleren om moderatie, bans, uitgeverslimieten of
  marktplaatsbeoordeling te omzeilen
- gebruikers misleiden over eigendom, bron, mogelijkheden, beveiligingshouding,
  installatievereisten of affiliatie met een ander project of een andere uitgever
- herhaaldelijk content uploaden die al is verborgen, verwijderd of geblokkeerd
  zonder het onderliggende probleem op te lossen

Publiceren in hoog volume is niet automatisch misbruik. Grote catalogi zijn aanvaardbaar
wanneer de vermeldingen betekenisvol van elkaar verschillen, nauwkeurig zijn beschreven, worden onderhouden
en door echte gebruikers worden gebruikt. Grote catalogi worden een probleem voor vertrouwen en veiligheid wanneer
volume gepaard gaat met dunne, duplicatieve, misleidende, niet-onderhouden of
kunstmatig gepromote vermeldingen.

## Contentrechten

Als je denkt dat content op ClawHub inbreuk maakt op je auteursrecht of andere rechten, gebruik dan
[Verzoeken voor Contentrechten](/nl/clawhub/content-rights). Gebruik normale marktplaatsmeldingen niet
voor auteursrechtelijke of rechtenclaims, tenzij de vermelding ook onveilig,
kwaadaardig of misleidend is.

## Beoordeling en handhaving

ClawHub kan geautomatiseerde controles, statistische misbruiksignalen, gebruikersmeldingen en
beoordeling door medewerkers gebruiken om onveilige content of misbruikend publicatiegedrag te identificeren. Een signaal
bewijst op zichzelf geen misbruik; het helpt ClawHub bepalen wat beoordeling nodig heeft.

We kunnen:

- vermeldingen die regels schenden verbergen, vasthouden, verwijderen, soft-deleten of, waar ondersteund voor het resourcetype,
  hard-deleten
- downloads of installaties blokkeren voor onveilige releases
- API-tokens intrekken
- gekoppelde content soft-deleten
- publicatietoegang beperken
- herhaalde of ernstige overtreders bannen

We garanderen geen handhaving met eerst een waarschuwing bij duidelijk misbruik. Zie
[Moderatie en Accountveiligheid](/nl/clawhub/moderation) voor meldingen, moderatieholds,
verborgen vermeldingen, bans en accountstatus.
