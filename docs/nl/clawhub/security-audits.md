---
read_when:
    - Inzicht in de resultaten van de ClawHub-beveiligingsaudit
    - Beslissen of je een skill of Plugin installeert
    - Uitleg over de auditstatus, het risiconiveau of de bevindingen van ClawHub
sidebarTitle: Security Audits
summary: Hoe je de resultaten van een ClawHub-beveiligingsaudit begrijpt voordat je een skill of Plugin installeert.
title: Beveiligingsaudits
x-i18n:
    generated_at: "2026-07-16T15:32:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Beveiligingsaudits

ClawHub-beveiligingsaudits helpen je te bepalen of een skill of Plugin veilig genoeg is
om te installeren. Ze laten zien wat een release doet, welke bevoegdheden deze vraagt en
of iets extra aandacht verdient voordat de release toegang krijgt tot bestanden, accounts,
inloggegevens, code of externe diensten.

Audits zijn sterke veiligheidssignalen, maar garanderen niet dat een release
risicovrij is. Gebruik altijd je eigen oordeel voordat je gevoelige toegang verleent.

Zie ook [Beveiliging](/clawhub/security), [Aanvaardbaar gebruik](/nl/clawhub/acceptable-usage)
en [Moderatie en accountbeveiliging](/clawhub/moderation).

## Wat je moet controleren vóór installatie

Controleer vóór installatie:

- de algemene auditstatus
- het risiconiveau
- eventuele vermelde bevindingen
- vereiste inloggegevens, machtigingen of omgevingsvariabelen
- eigenaar, bron, versie, changelog, downloads, sterren en andere vertrouwenssignalen

Installeer alleen inhoud die je begrijpt en vertrouwt.

## Auditstatus

De auditstatus geeft aan hoe je op het auditresultaat moet reageren:

| Status      | Betekenis                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Er is geen zichtbaar probleem boven een laag risico gevonden.                                |
| `Review`    | Lees de bevindingen vóór installatie. De release kan nog steeds legitiem zijn. |
| `Warn`      | Wees extra voorzichtig. ClawHub heeft een probleem met grote impact of een waarschuwingssignaal gevonden. |
| `Malicious` | Niet installeren.                                                           |
| `Pending`   | De audits zijn nog niet voltooid.                                             |
| `Error`     | De audit kon niet worden voltooid.                                         |

Een `Pass` is geruststellend, maar vervangt je eigen oordeel niet. Dit is
vooral belangrijk voor tools die inhoud kunnen publiceren, gegevens kunnen bewerken,
opdrachten kunnen uitvoeren, bestanden kunnen lezen of toegang hebben tot productiesystemen.

## Risiconiveau

Het risiconiveau beschrijft de potentiële impact: hoeveel macht de release lijkt te hebben als
je deze gebruikt zoals bedoeld.

| Risiconiveau | Betekenis                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Er is weinig gevoelige bevoegdheid of impact op gebruikers gevonden.                          |
| `Medium`   | De release heeft aanzienlijke bevoegdheden, zoals accounttoegang of gegevenswijzigingen. |
| `High`     | De release heeft bevoegdheden met grote impact, ernstige bevindingen of kwaadaardige signalen. |

Het risiconiveau en de auditstatus beantwoorden verschillende vragen:

- Het risiconiveau vraagt: "Hoeveel macht is hier aanwezig?"
- De auditstatus vraagt: "Wat moet ik met dit resultaat doen?"

Een publicatieskill kan bijvoorbeeld `Review` met een `Medium` risico tonen. Dat
betekent niet dat deze kwaadaardig is. Het betekent dat de skill bij het beoogde doel lijkt te passen, maar
met aanzienlijke accountbevoegdheden kan handelen.

## Bevindingen

Bevindingen leggen uit waarom een auditresultaat is weergegeven. Elke bevinding bevat meestal:

- wat deze betekent
- waarom deze is gemarkeerd
- de relevante inhoud van de skill of Plugin
- een aanbeveling

Bevindingen kunnen worden aangeduid als `Info`, `Low`, `Medium`, `High` of `Critical`. Bevindingen met een
hogere ernst dragen sterker bij aan het risiconiveau en de auditstatus.

Bevindingen met een lage betrouwbaarheid worden verborgen in het openbare auditoverzicht, zodat de pagina
gericht blijft op bruikbaar bewijsmateriaal.

## Wat ClawHub controleert

ClawHub controleert ingediende releaseartefacten, waaronder:

- skillinstructies of Pluginmetagegevens
- opgegeven omgevingsvariabelen en machtigingen
- installatie-instructies en pakketmetagegevens
- opgenomen bestanden en bestandsmanifesten
- compatibiliteits- en capaciteitsmetagegevens

De hoofdvraag is samenhang: komen de naam, samenvatting, metagegevens, gevraagde
bevoegdheden en daadwerkelijke inhoud overeen met wat gebruikers redelijkerwijs mogen verwachten?

Krachtig gedrag is niet automatisch slecht. Veel nuttige tools hebben inloggegevens,
lokale opdrachten, provider-API's of pakketinstallaties nodig. De audit controleert of die
macht te verwachten, bekendgemaakt en evenredig is.

Artefactpagina's verwijzen naar de volledige audit op:

```text
/<owner>/skills/<slug>/security-audit
```

De auditpagina combineert:

1. SkillSpector
2. VirusTotal
3. Risicoanalyse

## VirusTotal

ClawHub gebruikt VirusTotal als malwaretelemetrie in de auditstack. VirusTotal is een
vertrouwde industriestandaard voor bestandsreputatie en malwarescans, en dankzij onze
samenwerking kan ClawHub bredere beveiligingsinformatie toevoegen aan de beoordeling van
skills en Plugins.

VirusTotal is vooral nuttig voor bekende kwaadaardige artefacten, detecties door scanengines en
reputatiesignalen die de agentbewuste beoordeling van ClawHub aanvullen. Wanneer aantallen van
leveranciersengines beschikbaar zijn, vat de audit deze in duidelijke taal samen, zoals:

```text
62/62 leveranciers hebben deze skill als schoon aangemerkt.
```

of:

```text
2/64 leveranciers hebben deze skill als kwaadaardig aangemerkt, 1/64 als verdacht en 61/64 als schoon.
```

Wanneer ClawHub geen telemetrie met leveranciersaantallen heeft om samen te vatten, vermeldt de audit:

```text
Geen VirusTotal-bevindingen
```

VirusTotal blijft telemetrie. Het vervangt de eigen artefactbewuste
risicoanalyse van ClawHub niet.

## Risicoanalyse

De risicoanalyse wordt intern aangedreven door ClawScan, het eigen beveiligingsauditsysteem
van ClawHub. Het beoordeelt elke release als een op agents gericht artefact: instructies,
metagegevens, opgegeven machtigingen, bestanden, capaciteitssignalen, signalen van statische scans,
SkillSpector-bevindingen, VirusTotal-telemetrie en door de uitgever verstrekte context.
Signalen van statische scans vormen interne context voor deze beoordeling; ze zijn geen
zelfstandig openbaar auditonderdeel of installatieblokkerend oordeel.

De risicoanalyse gebruikt de
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
als kader voor risico's zoals promptinjectie, misbruik van tools, blootstelling van inloggegevens,
onveilige uitvoering, vergiftiging van geheugen of context en buitensporige handelingsvrijheid.

ClawScan beschouwt een angstaanjagend ogende capaciteit niet automatisch als kwaadaardig.
Het vraagt of de capaciteit is bekendgemaakt, bij het doel past en wordt ondersteund door
het vermelde gebruiksdoel van de release.
