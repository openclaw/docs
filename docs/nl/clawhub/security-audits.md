---
read_when:
    - Inzicht in de resultaten van de ClawHub-beveiligingsaudit
    - Beslissen of u een Skill of Plugin wilt installeren
    - Uitleg over de auditstatus, het risiconiveau of de bevindingen van ClawHub
sidebarTitle: Security Audits
summary: Hoe u de resultaten van de ClawHub-beveiligingsaudit kunt begrijpen voordat u een Skill of Plugin installeert.
title: Beveiligingsaudits
x-i18n:
    generated_at: "2026-07-12T08:42:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Beveiligingsaudits

ClawHub-beveiligingsaudits helpen je te bepalen of een skill of Plugin veilig genoeg is
om te installeren. Ze tonen wat een release doet, om welke bevoegdheden deze vraagt en
of iets extra aandacht vereist voordat deze toegang krijgt tot bestanden, accounts,
aanmeldgegevens, code of externe diensten.

Audits zijn sterke veiligheidssignalen, maar bieden geen garantie dat een release
risicovrij is. Gebruik altijd je eigen oordeel voordat je gevoelige toegang verleent.

Zie ook [Beveiliging](/clawhub/security), [Aanvaardbaar gebruik](/clawhub/acceptable-usage)
en [Moderatie en accountbeveiliging](/clawhub/moderation).

## Wat je vóór installatie moet controleren

Controleer vóór installatie:

- de algemene auditstatus
- het risiconiveau
- eventuele vermelde bevindingen
- vereiste aanmeldgegevens, machtigingen of omgevingsvariabelen
- eigenaar, bron, versie, wijzigingslogboek, downloads, sterren en andere vertrouwenssignalen

Installeer alleen inhoud die je begrijpt en vertrouwt.

## Auditstatus

De auditstatus geeft aan hoe je op het auditresultaat moet reageren:

| Status          | Betekenis                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------- |
| `Geslaagd`      | Er is geen zichtbaar probleem boven een laag risico gevonden.                             |
| `Controleren`   | Lees de bevindingen vóór installatie. De release kan nog steeds legitiem zijn.             |
| `Waarschuwing`  | Wees extra voorzichtig. ClawHub heeft een probleem met grote impact of een waarschuwingssignaal gevonden. |
| `Kwaadaardig`   | Niet installeren.                                                                         |
| `In behandeling` | De audits zijn nog niet voltooid.                                                         |
| `Fout`          | De audit kon niet worden voltooid.                                                         |

Een `Geslaagd` is geruststellend, maar vervangt je eigen oordeel niet. Dit is vooral
van belang voor hulpmiddelen die inhoud kunnen publiceren, gegevens kunnen bewerken,
opdrachten kunnen uitvoeren, bestanden kunnen lezen of toegang hebben tot
productiesystemen.

## Risiconiveau

Het risiconiveau beschrijft de impactomvang: hoeveel macht de release lijkt te hebben
wanneer je deze gebruikt zoals bedoeld.

| Risiconiveau | Betekenis                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------- |
| `Laag`       | Er zijn weinig gevoelige bevoegdheden of gevolgen voor gebruikers gevonden.                 |
| `Gemiddeld`  | De release heeft aanzienlijke bevoegdheden, zoals accounttoegang of gegevenswijzigingen.     |
| `Hoog`       | De release heeft bevoegdheden met grote impact, ernstige bevindingen of kwaadaardige signalen. |

Het risiconiveau en de auditstatus beantwoorden verschillende vragen:

- Het risiconiveau vraagt: "Hoeveel macht is hier aanwezig?"
- De auditstatus vraagt: "Wat moet ik met dit resultaat doen?"

Een publicatieskill kan bijvoorbeeld `Controleren` met een `Gemiddeld` risico tonen.
Dat betekent niet dat deze kwaadaardig is. Het betekent dat de skill lijkt aan te
sluiten bij het beoogde doel, maar met aanzienlijke accountbevoegdheden kan handelen.

## Bevindingen

Bevindingen leggen uit waarom een auditresultaat is getoond. Elke bevinding bevat
doorgaans:

- wat deze betekent
- waarom deze is gemarkeerd
- de relevante inhoud van de skill of Plugin
- een aanbeveling

Bevindingen kunnen het label `Informatie`, `Laag`, `Gemiddeld`, `Hoog` of `Kritiek`
hebben. Bevindingen met een hogere ernst dragen zwaarder bij aan het risiconiveau en
de auditstatus.

Bevindingen met een lage betrouwbaarheid worden verborgen in het openbare
auditoverzicht, zodat de pagina gericht blijft op bruikbaar bewijsmateriaal.

## Wat ClawHub controleert

ClawHub controleert ingediende releaseartefacten, waaronder:

- skillinstructies of Plugin-metagegevens
- opgegeven omgevingsvariabelen en machtigingen
- installatie-instructies en pakketmetagegevens
- opgenomen bestanden en bestandsmanifesten
- metagegevens over compatibiliteit en mogelijkheden

De hoofdvraag is samenhang: komen de naam, samenvatting, metagegevens, gevraagde
bevoegdheden en daadwerkelijke inhoud overeen met wat gebruikers redelijkerwijs
mogen verwachten?

Krachtige functionaliteit is niet automatisch slecht. Veel nuttige hulpmiddelen
hebben aanmeldgegevens, lokale opdrachten, provider-API's of pakketinstallaties nodig.
De audit controleert of die macht te verwachten, bekendgemaakt en evenredig is.

Artefactpagina's bevatten een koppeling naar de volledige audit op:

```text
/<owner>/skills/<slug>/security-audit
```

De auditpagina combineert:

1. SkillSpector
2. VirusTotal
3. Risicoanalyse

## VirusTotal

ClawHub gebruikt VirusTotal als malwaretelemetrie in de auditstack. VirusTotal is een
betrouwbare industriestandaard voor bestandsreputatie en het scannen op malware, en
dankzij onze samenwerking kan ClawHub bredere beveiligingsinformatie toevoegen aan
de beoordeling van skills en Plugins.

VirusTotal is met name nuttig voor bekende kwaadaardige artefacten, detecties door
scanengines en reputatiesignalen die de agentbewuste beoordeling van ClawHub
aanvullen. Wanneer aantallen van leveranciersengines beschikbaar zijn, vat de audit
deze in duidelijke taal samen, zoals:

```text
62/62 leveranciers hebben deze skill als schoon gemarkeerd.
```

of:

```text
2/64 leveranciers hebben deze skill als kwaadaardig gemarkeerd, 1/64 als verdacht en 61/64 als schoon.
```

Wanneer ClawHub geen telemetrie over leveranciersaantallen heeft om samen te vatten,
vermeldt de audit:

```text
Geen VirusTotal-bevindingen
```

VirusTotal blijft telemetrie. Het vervangt de eigen artefactbewuste risicoanalyse van
ClawHub niet.

## Risicoanalyse

De risicoanalyse wordt intern mogelijk gemaakt door ClawScan, het eigen
beveiligingsauditsysteem van ClawHub. Het beoordeelt elke release als een op agents
gericht artefact: instructies, metagegevens, opgegeven machtigingen, bestanden,
signalen over mogelijkheden, signalen uit statische scans, SkillSpector-bevindingen,
VirusTotal-telemetrie en door de uitgever verstrekte context. Signalen uit statische
scans vormen interne context voor deze beoordeling; ze zijn geen zelfstandig openbaar
auditonderdeel of oordeel dat installatie blokkeert.

De risicoanalyse gebruikt de
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
als referentiekader voor risico's zoals promptinjectie, misbruik van hulpmiddelen,
blootstelling van aanmeldgegevens, onveilige uitvoering, vergiftiging van geheugen of
context en buitensporige handelingsvrijheid.

ClawScan beschouwt een alarmerend ogende mogelijkheid niet automatisch als
kwaadaardig. Het controleert of de mogelijkheid bekendgemaakt is, aansluit bij het
beoogde doel en wordt ondersteund door het vermelde gebruiksdoel van de release.
