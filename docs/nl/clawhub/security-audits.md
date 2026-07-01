---
read_when:
    - ClawHub-beveiligingsauditresultaten begrijpen
    - Beslissen of je een skill of Plugin installeert
    - ClawHub-auditstatus, risiconiveau of bevindingen uitleggen
sidebarTitle: Security Audits
summary: Hoe u de beveiligingsauditresultaten van ClawHub interpreteert voordat u een vaardigheid of Plugin installeert.
title: Beveiligingsaudits
x-i18n:
    generated_at: "2026-07-01T08:14:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Beveiligingsaudits

Beveiligingsaudits van ClawHub helpen je bepalen of een skill of plugin veilig genoeg is
om te installeren. Ze tonen wat een release doet, om welke bevoegdheden deze vraagt, en
of iets extra aandacht verdient voordat het toegang krijgt tot bestanden, accounts,
referenties, code of externe diensten.

Audits zijn sterke veiligheidssignalen, maar ze garanderen niet dat een release
risicovrij is. Gebruik altijd je eigen oordeel voordat je gevoelige toegang verleent.

Zie ook [Beveiliging](/clawhub/security), [Acceptabel gebruik](/nl/clawhub/acceptable-usage),
en [Moderatie en accountveiligheid](/clawhub/moderation).

## Wat je moet controleren voordat je installeert

Controleer voor installatie:

- de algemene auditstatus
- het risiconiveau
- eventuele vermelde bevindingen
- vereiste referenties, machtigingen of omgevingsvariabelen
- eigenaar, bron, versie, changelog, downloads, sterren en andere vertrouwenssignalen

Installeer alleen content die je begrijpt en vertrouwt.

## Auditstatus

Auditstatus vertelt je hoe je op het auditresultaat moet reageren:

| Status      | Betekenis                                                                   |
| ----------- | --------------------------------------------------------------------------- |
| `Pass`      | Er is geen zichtbaar probleem boven laag risico gevonden.                   |
| `Review`    | Lees de bevindingen voordat je installeert. De release kan nog steeds legitiem zijn. |
| `Warn`      | Wees extra voorzichtig. ClawHub heeft een zorgpunt met hoge impact of waarschuwingssignaal gevonden. |
| `Malicious` | Niet installeren.                                                           |
| `Pending`   | Audits zijn nog niet voltooid.                                              |
| `Error`     | De audit kon niet worden voltooid.                                          |

Een `Pass` is geruststellend, maar vervangt je eigen oordeel niet. Dit is het
belangrijkst voor tools die content kunnen publiceren, data kunnen bewerken, opdrachten kunnen uitvoeren, bestanden kunnen lezen of
toegang hebben tot productiesystemen.

## Risiconiveau

Risiconiveau beschrijft de blast radius: hoeveel macht de release lijkt te hebben als
je deze gebruikt zoals bedoeld.

| Risiconiveau | Betekenis                                                                       |
| ------------ | ------------------------------------------------------------------------------- |
| `Low`        | Er is weinig gevoelige bevoegdheid of gebruikersimpact gevonden.                |
| `Medium`     | De release heeft betekenisvolle bevoegdheden, zoals accounttoegang of datawijzigingen. |
| `High`       | De release heeft bevoegdheden met hoge impact, ernstige bevindingen of kwaadaardige signalen. |

Risiconiveau en auditstatus beantwoorden verschillende vragen:

- Risiconiveau vraagt: "Hoeveel macht is hier aanwezig?"
- Auditstatus vraagt: "Wat moet ik met dit resultaat doen?"

Een publicatieskill kan bijvoorbeeld `Review` tonen met `Medium` risico. Dat betekent
niet dat deze kwaadaardig is. Het betekent dat de skill op het doel lijkt afgestemd, maar
met betekenisvolle accountbevoegdheid kan handelen.

## Bevindingen

Bevindingen leggen uit waarom een auditresultaat is getoond. Elke bevinding bevat meestal:

- wat het betekent
- waarom het is gemarkeerd
- de relevante skill- of plugincontent
- een aanbeveling

Bevindingen kunnen het label `Info`, `Low`, `Medium`, `High` of `Critical` krijgen. Bevindingen met een hogere
ernst dragen sterker bij aan het risiconiveau en de auditstatus.

Bevindingen met lage betrouwbaarheid worden verborgen uit de openbare auditsamenvatting, zodat de pagina
gericht blijft op nuttig bewijs.

## Wat ClawHub controleert

ClawHub auditeert ingediende release-artefacten, waaronder:

- skillinstructies of pluginmetadata
- gedeclareerde omgevingsvariabelen en machtigingen
- installatie-instructies en pakketmetadata
- opgenomen bestanden en bestandsmanifesten
- compatibiliteits- en capaciteitsmetadata

De hoofdvraag is samenhang: komen de naam, samenvatting, metadata, gevraagde
bevoegdheden en daadwerkelijke content overeen met wat gebruikers redelijkerwijs zouden verwachten?

Krachtig gedrag is niet automatisch slecht. Veel nuttige tools hebben referenties,
lokale opdrachten, provider-API's of pakketinstallaties nodig. De audit controleert of die
macht verwacht, bekendgemaakt en proportioneel is.

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
vertrouwde industriestandaard voor bestandsreputatie en malwarescanning, en onze
samenwerking laat ClawHub bredere beveiligingsinformatie toevoegen aan de beoordeling van skills en plugins.

VirusTotal is vooral nuttig voor bekende kwaadaardige artefacten, engine-hits en
reputatiesignalen die de agentbewuste beoordeling van ClawHub aanvullen. Wanneer tellingen van
leveranciersengines beschikbaar zijn, vat de audit ze samen in duidelijke taal, zoals:

```text
62/62 vendors flagged this skill as clean.
```

of:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Wanneer ClawHub geen leverancierstelling-telemetrie heeft om samen te vatten, zegt de audit:

```text
No VirusTotal findings
```

VirusTotal blijft telemetrie. Het vervangt de eigen artefactbewuste
risicoanalyse van ClawHub niet.

## Risicoanalyse

Risicoanalyse wordt intern aangedreven door ClawScan, het eigen beveiligingsauditsysteem
van ClawHub. Het beoordeelt elke release als een agentgericht artefact: instructies,
metadata, gedeclareerde machtigingen, bestanden, capaciteitssignalen, statische scansignalen,
SkillSpector-bevindingen, VirusTotal-telemetrie en context die door de uitgever is verstrekt.
Statische scansignalen zijn interne context voor deze beoordeling; ze zijn geen
zelfstandige openbare auditsectie of installatieblokkerend oordeel.

Risicoanalyse gebruikt de
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
als lens voor risico's zoals promptinjectie, misbruik van tools, blootstelling van referenties,
onveilige uitvoering, vergiftiging van geheugen of context, en overmatige handelingsvrijheid.

ClawScan behandelt een eng ogende capaciteit niet als automatisch kwaadaardig.
Het vraagt of de capaciteit is bekendgemaakt, op het doel is afgestemd en wordt ondersteund door
de vermelde usecase van de release.
