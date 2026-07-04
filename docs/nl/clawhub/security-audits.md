---
read_when:
    - Inzicht in de resultaten van ClawHub-beveiligingsaudits
    - Beslissen of je een skill of Plugin installeert
    - Uitleg van de auditstatus, het risiconiveau of de bevindingen van ClawHub
sidebarTitle: Security Audits
summary: ClawHub-beveiligingsauditresultaten begrijpen voordat je een skill of plugin installeert.
title: Beveiligingsaudits
x-i18n:
    generated_at: "2026-07-04T20:37:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Beveiligingsaudits

ClawHub-beveiligingsaudits helpen je bepalen of een skill of Plugin veilig genoeg is
om te installeren. Ze laten zien wat een release doet, welke bevoegdheid deze vraagt en
of iets extra aandacht verdient voordat deze toegang krijgt tot bestanden, accounts,
referenties, code of externe services.

Audits zijn sterke veiligheidssignalen, maar ze garanderen niet dat een release
risicovrij is. Gebruik altijd je eigen oordeel voordat je gevoelige toegang verleent.

Zie ook [Beveiliging](/clawhub/security), [Acceptabel gebruik](/clawhub/acceptable-usage)
en [Moderatie en accountveiligheid](/clawhub/moderation).

## Wat je moet controleren vóór installatie

Controleer vóór installatie:

- de algemene auditstatus
- het risiconiveau
- eventuele vermelde bevindingen
- vereiste referenties, machtigingen of omgevingsvariabelen
- eigenaar, bron, versie, changelog, downloads, sterren en andere vertrouwenssignalen

Installeer alleen inhoud die je begrijpt en vertrouwt.

## Auditstatus

Auditstatus vertelt je hoe je op het auditresultaat moet reageren:

| Status      | Betekenis                                                                 |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Er is geen zichtbaar probleem boven laag risico gevonden.                 |
| `Review`    | Lees de bevindingen vóór installatie. De release kan nog steeds legitiem zijn. |
| `Warn`      | Wees extra voorzichtig. ClawHub heeft een zorgpunt met grote impact of een waarschuwingssignaal gevonden. |
| `Malicious` | Niet installeren.                                                         |
| `Pending`   | Audits zijn nog niet afgerond.                                            |
| `Error`     | De audit kon niet worden voltooid.                                        |

Een `Pass` is geruststellend, maar vervangt je eigen oordeel niet. Dit is vooral
belangrijk voor tools die inhoud kunnen publiceren, gegevens kunnen bewerken, opdrachten kunnen uitvoeren, bestanden kunnen lezen of
toegang hebben tot productiesystemen.

## Risiconiveau

Risiconiveau beschrijft de blast radius: hoeveel macht de release lijkt te hebben als
je deze gebruikt zoals bedoeld.

| Risiconiveau | Betekenis                                                                    |
| ------------ | ----------------------------------------------------------------------------- |
| `Low`        | Er is weinig gevoelige bevoegdheid of gebruikersimpact gevonden.              |
| `Medium`     | De release heeft betekenisvolle bevoegdheid, zoals accounttoegang of gegevenswijzigingen. |
| `High`       | De release heeft bevoegdheid met grote impact, ernstige bevindingen of kwaadaardige signalen. |

Risiconiveau en auditstatus beantwoorden verschillende vragen:

- Risiconiveau vraagt: "Hoeveel macht is hier aanwezig?"
- Auditstatus vraagt: "Wat moet ik met dit resultaat doen?"

Een publicatie-skill kan bijvoorbeeld `Review` tonen met `Medium` risico. Dat betekent
niet dat deze kwaadaardig is. Het betekent dat de skill doelgericht lijkt te zijn, maar
kan handelen met betekenisvolle accountbevoegdheid.

## Bevindingen

Bevindingen leggen uit waarom een auditresultaat is getoond. Elke bevinding bevat meestal:

- wat het betekent
- waarom het is gemarkeerd
- de relevante skill- of Plugin-inhoud
- een aanbeveling

Bevindingen kunnen het label `Info`, `Low`, `Medium`, `High` of `Critical` hebben. Bevindingen met een hogere
ernst dragen sterker bij aan het risiconiveau en de auditstatus.

Bevindingen met lage betrouwbaarheid worden verborgen in de openbare audit-samenvatting, zodat de pagina
gericht blijft op nuttig bewijs.

## Wat ClawHub controleert

ClawHub audit ingediende release-artefacten, waaronder:

- Skills-instructies of Plugin-metadata
- gedeclareerde omgevingsvariabelen en machtigingen
- installatie-instructies en pakketmetadata
- opgenomen bestanden en bestandsmanifesten
- compatibiliteits- en capaciteitsmetadata

De hoofdvraag is samenhang: komen de naam, samenvatting, metadata, gevraagde
bevoegdheid en daadwerkelijke inhoud overeen met wat gebruikers redelijkerwijs zouden verwachten?

Krachtig gedrag is niet automatisch slecht. Veel nuttige tools hebben inloggegevens,
lokale commando's, provider-API's of pakketinstallaties nodig. De audit controleert of die
kracht verwacht, bekendgemaakt en proportioneel is.

Artefactpagina's linken naar de volledige audit op:

```text
/<owner>/skills/<slug>/security-audit
```

De auditpagina combineert:

1. SkillSpector
2. VirusTotal
3. Risicoanalyse

## VirusTotal

ClawHub gebruikt VirusTotal als malwaretelemetrie in de auditstack. VirusTotal is een
vertrouwde industriestandaard voor bestandsreputatie en malwarescans, en onze
samenwerking laat ClawHub bredere beveiligingsinformatie toevoegen aan de beoordeling van Skills en Plugins.

VirusTotal is vooral nuttig voor bekende schadelijke artefacten, treffers van engines en
reputatiesignalen die de agent-bewuste beoordeling van ClawHub aanvullen. Wanneer aantallen
vendor-engines beschikbaar zijn, vat de audit ze samen in gewone taal, zoals:

```text
62/62 vendors flagged this skill as clean.
```

of:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Wanneer ClawHub geen telemetrie over vendor-aantallen heeft om samen te vatten, zegt de audit:

```text
No VirusTotal findings
```

VirusTotal blijft telemetrie. Het vervangt niet ClawHubs eigen artefact-bewuste
risicoanalyse.

## Risicoanalyse

Risicoanalyse wordt intern aangedreven door ClawScan, ClawHubs eigen systeem voor
beveiligingsaudits. Het beoordeelt elke release als een agent-gericht artefact: instructies,
metadata, gedeclareerde machtigingen, bestanden, capaciteitssignalen, statische scansignalen,
SkillSpector-bevindingen, VirusTotal-telemetrie en door de uitgever geleverde context.
Statische scansignalen zijn interne context voor deze beoordeling; ze vormen geen
zelfstandige openbare auditsectie of installatieblokkerend oordeel.

Risicoanalyse gebruikt de
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
als lens voor risico's zoals promptinjectie, misbruik van tools, blootstelling van inloggegevens,
onveilige uitvoering, vergiftiging van geheugen of context en buitensporige handelingsvrijheid.

ClawScan behandelt een eng ogende capaciteit niet automatisch als schadelijk.
Het vraagt of de capaciteit is bekendgemaakt, aansluit bij het doel en wordt ondersteund door
de vermelde usecase van de release.
