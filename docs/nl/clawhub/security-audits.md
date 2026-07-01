---
read_when:
    - Inzicht in ClawHub-beveiligingsauditresultaten
    - Beslissen of je een skill of plugin installeert
    - Uitleg over ClawHub-auditstatus, risiconiveau of bevindingen
sidebarTitle: Security Audits
summary: Hoe u de beveiligingsauditresultaten van ClawHub begrijpt voordat u een skill of plugin installeert.
title: Beveiligingsaudits
x-i18n:
    generated_at: "2026-07-01T18:16:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Beveiligingsaudits

ClawHub-beveiligingsaudits helpen je bepalen of een skill of plugin veilig genoeg is
om te installeren. Ze tonen wat een release doet, welke bevoegdheden deze vraagt en
of iets extra aandacht verdient voordat deze toegang kan krijgen tot bestanden, accounts,
referenties, code of externe services.

Audits zijn sterke veiligheidssignalen, maar ze garanderen niet dat een release
risicovrij is. Gebruik altijd je eigen oordeel voordat je gevoelige toegang verleent.

Zie ook [Beveiliging](/clawhub/security), [Aanvaardbaar gebruik](/clawhub/acceptable-usage)
en [Moderatie en accountveiligheid](/clawhub/moderation).

## Wat je vóór installatie moet controleren

Controleer vóór installatie:

- de algemene auditstatus
- het risiconiveau
- alle vermelde bevindingen
- vereiste referenties, machtigingen of omgevingsvariabelen
- eigenaar, bron, versie, changelog, downloads, sterren en andere vertrouwenssignalen

Installeer alleen inhoud die je begrijpt en vertrouwt.

## Auditstatus

De auditstatus vertelt je hoe je op het auditresultaat moet reageren:

| Status      | Betekenis                                                                 |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Er is geen zichtbaar probleem boven laag risico gevonden.                 |
| `Review`    | Lees de bevindingen voordat je installeert. De release kan nog legitiem zijn. |
| `Warn`      | Wees extra voorzichtig. ClawHub heeft een zorgpunt met grote impact of waarschuwingssignaal gevonden. |
| `Malicious` | Niet installeren.                                                         |
| `Pending`   | Audits zijn nog niet voltooid.                                            |
| `Error`     | De audit kon niet worden voltooid.                                        |

Een `Pass` is geruststellend, maar vervangt je eigen oordeel niet. Dit is vooral
belangrijk voor tools die inhoud kunnen publiceren, gegevens kunnen bewerken, opdrachten
kunnen uitvoeren, bestanden kunnen lezen of toegang hebben tot productiesystemen.

## Risiconiveau

Risiconiveau beschrijft de blast radius: hoeveel macht de release lijkt te hebben als
je deze gebruikt zoals bedoeld.

| Risiconiveau | Betekenis                                                                  |
| ------------ | -------------------------------------------------------------------------- |
| `Low`        | Er is weinig gevoelige bevoegdheid of gebruikersimpact gevonden.           |
| `Medium`     | De release heeft betekenisvolle bevoegdheid, zoals accounttoegang of gegevenswijzigingen. |
| `High`       | De release heeft bevoegdheid met grote impact, ernstige bevindingen of kwaadaardige signalen. |

Risiconiveau en auditstatus beantwoorden verschillende vragen:

- Risiconiveau vraagt: "Hoeveel macht is hier aanwezig?"
- Auditstatus vraagt: "Wat moet ik met dit resultaat doen?"

Een publicatieskill kan bijvoorbeeld `Review` met `Medium` risico tonen. Dat betekent
niet dat deze kwaadaardig is. Het betekent dat de skill doelgericht lijkt, maar
kan handelen met betekenisvolle accountbevoegdheid.

## Bevindingen

Bevindingen leggen uit waarom een auditresultaat werd getoond. Elke bevinding bevat meestal:

- wat het betekent
- waarom het is gemarkeerd
- de relevante skill- of plugininhoud
- een aanbeveling

Bevindingen kunnen worden gelabeld als `Info`, `Low`, `Medium`, `High` of `Critical`. Bevindingen met hogere
ernst dragen sterker bij aan risiconiveau en auditstatus.

Bevindingen met lage betrouwbaarheid worden verborgen uit de openbare audittotalen, zodat de pagina
gericht blijft op nuttig bewijs.

## Wat ClawHub controleert

ClawHub auditt ingediende release-artifacts, waaronder:

- skillinstructies of pluginmetadata
- gedeclareerde omgevingsvariabelen en machtigingen
- installatie-instructies en pakketmetadata
- meegeleverde bestanden en bestandsmanifesten
- compatibiliteits- en capaciteitsmetadata

De hoofdvraag is samenhang: komen naam, samenvatting, metadata, gevraagde
bevoegdheid en daadwerkelijke inhoud overeen met wat gebruikers redelijkerwijs zouden verwachten?

Krachtig gedrag is niet automatisch slecht. Veel nuttige tools hebben referenties,
lokale opdrachten, provider-API's of pakketinstallaties nodig. De audit controleert of die
macht verwacht, bekendgemaakt en proportioneel is.

Artifactpagina's linken naar de volledige audit op:

```text
/<owner>/skills/<slug>/security-audit
```

De auditpagina combineert:

1. SkillSpector
2. VirusTotal
3. Risicoanalyse

## VirusTotal

ClawHub gebruikt VirusTotal als malwaretelemetrie in de auditstack. VirusTotal is een
vertrouwde industriestandaard voor bestandsreputatie en malwarescanning, en onze
samenwerking laat ClawHub bredere beveiligingsintelligentie toevoegen aan skill- en pluginbeoordeling.

VirusTotal is vooral nuttig voor bekende kwaadaardige artifacts, engine-hits en
reputatiesignalen die ClawHubs agentbewuste beoordeling aanvullen. Wanneer aantallen van leveranciersengines
beschikbaar zijn, vat de audit ze samen in gewone taal, zoals:

```text
62/62 vendors flagged this skill as clean.
```

of:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Wanneer ClawHub geen telemetrie met leveranciersaantallen heeft om samen te vatten, zegt de audit:

```text
No VirusTotal findings
```

VirusTotal blijft telemetrie. Het vervangt ClawHubs eigen artifactbewuste
risicoanalyse niet.

## Risicoanalyse

Risicoanalyse wordt intern aangedreven door ClawScan, ClawHubs eigen beveiligingsauditsysteem.
Het beoordeelt elke release als een artifact voor agents: instructies,
metadata, gedeclareerde machtigingen, bestanden, capaciteitssignalen, signalen uit statische scans,
SkillSpector-bevindingen, VirusTotal-telemetrie en context die door de uitgever is verstrekt.
Signalen uit statische scans zijn interne context voor deze beoordeling; ze zijn geen
zelfstandige openbare auditsectie of installatieblokkerend oordeel.

Risicoanalyse gebruikt de
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
als lens voor risico's zoals promptinjectie, toolmisbruik, blootstelling van referenties,
onveilige uitvoering, geheugen- of contextvergiftiging en overmatige handelingsvrijheid.

ClawScan behandelt een eng uitziende capaciteit niet automatisch als kwaadaardig.
Het vraagt of de capaciteit is bekendgemaakt, doelgericht is en wordt ondersteund door
de verklaarde usecase van de release.
