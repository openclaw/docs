---
read_when:
    - ClawHub-beveiligingsauditresultaten begrijpen
    - Beslissen of je een skill of Plugin installeert
    - Uitleg van ClawHub-auditstatus, risiconiveau of bevindingen
sidebarTitle: Security Audits
summary: ClawHub-beveiligingsauditresultaten begrijpen voordat u een Skill of Plugin installeert.
title: Beveiligingsaudits
x-i18n:
    generated_at: "2026-07-03T23:36:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Beveiligingsaudits

Beveiligingsaudits van ClawHub helpen je bepalen of een vaardigheid of plugin veilig genoeg is om te installeren. Ze laten zien wat een release doet, welke bevoegdheden die vraagt, en of iets extra aandacht verdient voordat die toegang krijgt tot bestanden, accounts, inloggegevens, code of externe diensten.

Audits zijn sterke veiligheidssignalen, maar ze garanderen niet dat een release risicovrij is. Gebruik altijd je eigen oordeel voordat je gevoelige toegang verleent.

Zie ook [Beveiliging](/clawhub/security), [Acceptabel gebruik](/clawhub/acceptable-usage) en [Moderatie en accountveiligheid](/clawhub/moderation).

## Wat je moet controleren vóór installatie

Controleer vóór installatie:

- de algemene auditstatus
- het risiconiveau
- eventuele vermelde bevindingen
- vereiste inloggegevens, machtigingen of omgevingsvariabelen
- eigenaar, bron, versie, changelog, downloads, sterren en andere vertrouwenssignalen

Installeer alleen inhoud die je begrijpt en vertrouwt.

## Auditstatus

De auditstatus vertelt je hoe je op het auditresultaat moet reageren:

| Status      | Betekenis                                                                   |
| ----------- | --------------------------------------------------------------------------- |
| `Pass`      | Er is geen zichtbaar probleem boven laag risico gevonden.                   |
| `Review`    | Lees de bevindingen vóór installatie. De release kan nog steeds legitiem zijn. |
| `Warn`      | Wees extra voorzichtig. ClawHub heeft een zorgpunt met hoge impact of een waarschuwingssignaal gevonden. |
| `Malicious` | Niet installeren.                                                           |
| `Pending`   | Audits zijn nog niet voltooid.                                              |
| `Error`     | De audit kon niet worden voltooid.                                          |

Een `Pass` is geruststellend, maar vervangt je eigen oordeel niet. Dit is het belangrijkst voor tools die inhoud kunnen publiceren, gegevens kunnen bewerken, opdrachten kunnen uitvoeren, bestanden kunnen lezen of toegang hebben tot productiesystemen.

## Risiconiveau

Het risiconiveau beschrijft de blast radius: hoeveel macht de release lijkt te hebben als je die gebruikt zoals bedoeld.

| Risiconiveau | Betekenis                                                                       |
| ------------ | ------------------------------------------------------------------------------- |
| `Low`        | Er is weinig gevoelige bevoegdheid of impact op gebruikers gevonden.             |
| `Medium`     | De release heeft betekenisvolle bevoegdheden, zoals accounttoegang of gegevenswijzigingen. |
| `High`       | De release heeft bevoegdheden met hoge impact, ernstige bevindingen of kwaadaardige signalen. |

Risiconiveau en auditstatus beantwoorden verschillende vragen:

- Risiconiveau vraagt: "Hoeveel macht is hier aanwezig?"
- Auditstatus vraagt: "Wat moet ik met dit resultaat doen?"

Een publicatievaardigheid kan bijvoorbeeld `Review` tonen met `Medium` risico. Dat betekent niet dat die kwaadaardig is. Het betekent dat de vaardigheid doelgericht lijkt, maar kan handelen met betekenisvolle accountbevoegdheden.

## Bevindingen

Bevindingen leggen uit waarom een auditresultaat is getoond. Elke bevinding bevat meestal:

- wat het betekent
- waarom het is gemarkeerd
- de relevante inhoud van de vaardigheid of plugin
- een aanbeveling

Bevindingen kunnen worden gelabeld als `Info`, `Low`, `Medium`, `High` of `Critical`. Bevindingen met een hogere ernst dragen sterker bij aan het risiconiveau en de auditstatus.

Bevindingen met lage betrouwbaarheid worden verborgen uit de openbare auditsamenvatting, zodat de pagina gericht blijft op bruikbaar bewijs.

## Wat ClawHub controleert

ClawHub audit ingediende release-artefacten, waaronder:

- vaardigheidsinstructies of pluginmetadata
- gedeclareerde omgevingsvariabelen en machtigingen
- installatie-instructies en pakketmetadata
- opgenomen bestanden en bestandsmanifesten
- compatibiliteits- en capaciteitsmetadata

De hoofdvraag is samenhang: sluiten de naam, samenvatting, metadata, gevraagde bevoegdheden en daadwerkelijke inhoud aan op wat gebruikers redelijkerwijs zouden verwachten?

Krachtig gedrag is niet automatisch slecht. Veel nuttige tools hebben inloggegevens, lokale opdrachten, provider-API's of pakketinstallaties nodig. De audit controleert of die macht verwacht, bekendgemaakt en proportioneel is.

Artefactpagina's linken naar de volledige audit op:

```text
/<owner>/skills/<slug>/security-audit
```

De auditpagina combineert:

1. SkillSpector
2. VirusTotal
3. Risicoanalyse

## VirusTotal

ClawHub gebruikt VirusTotal als malwaretelemetrie in de auditstack. VirusTotal is een vertrouwde industriestandaard voor bestandsreputatie en malwarescans, en onze samenwerking laat ClawHub bredere beveiligingsinformatie toevoegen aan de beoordeling van vaardigheden en plugins.

VirusTotal is vooral nuttig voor bekende kwaadaardige artefacten, treffers van engines en reputatiesignalen die ClawHub's agentbewuste beoordeling aanvullen. Wanneer tellingen van leveranciersengines beschikbaar zijn, vat de audit ze samen in gewone taal, zoals:

```text
62/62 leveranciers hebben deze vaardigheid als schoon gemarkeerd.
```

of:

```text
2/64 leveranciers hebben deze vaardigheid als kwaadaardig gemarkeerd, 1/64 heeft die als verdacht gemarkeerd, en 61/64 hebben die als schoon gemarkeerd.
```

Wanneer ClawHub geen leverancierstelling-telemetrie heeft om samen te vatten, zegt de audit:

```text
Geen VirusTotal-bevindingen
```

VirusTotal blijft telemetrie. Het vervangt ClawHub's eigen artefactbewuste risicoanalyse niet.

## Risicoanalyse

Risicoanalyse wordt intern aangedreven door ClawScan, ClawHub's eigen beveiligingsauditsysteem. Het beoordeelt elke release als agentgericht artefact: instructies, metadata, gedeclareerde machtigingen, bestanden, capaciteitssignalen, statische scansignalen, SkillSpector-bevindingen, VirusTotal-telemetrie en context die door de uitgever is aangeleverd. Statische scansignalen zijn interne context voor deze beoordeling; ze zijn geen zelfstandige openbare auditsectie of installatieblokkerend oordeel.

Risicoanalyse gebruikt de [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) als lens voor risico's zoals promptinjectie, misbruik van tools, blootstelling van inloggegevens, onveilige uitvoering, vergiftiging van geheugen of context, en buitensporige handelingsvrijheid.

ClawScan behandelt een angstaanjagend ogende capaciteit niet automatisch als kwaadaardig. Het vraagt of de capaciteit is bekendgemaakt, doelgericht is en wordt ondersteund door de verklaarde usecase van de release.
