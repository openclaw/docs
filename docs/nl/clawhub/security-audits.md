---
read_when:
    - ClawHub-beveiligingsauditresultaten begrijpen
    - Beslissen of u een skill of Plugin installeert
    - ClawHub-auditstatus, risiconiveau of bevindingen uitleggen
sidebarTitle: Security Audits
summary: Hoe je ClawHub-beveiligingsauditresultaten begrijpt voordat je een skill of plugin installeert.
title: Beveiligingsaudits
x-i18n:
    generated_at: "2026-06-28T05:07:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Beveiligingsaudits

ClawHub-beveiligingsaudits helpen je bepalen of een skill of plugin veilig genoeg is
om te installeren. Ze laten zien wat een release doet, welke bevoegdheid die vraagt en
of iets extra aandacht verdient voordat die toegang krijgt tot bestanden, accounts,
referenties, code of externe diensten.

Audits zijn sterke veiligheidssignalen, maar ze garanderen niet dat een release
risicovrij is. Gebruik altijd je eigen oordeel voordat je gevoelige toegang verleent.

Zie ook [Beveiliging](/nl/clawhub/security), [Acceptabel gebruik](/nl/clawhub/acceptable-usage),
en [Moderatie en accountveiligheid](/nl/clawhub/moderation).

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
| `Pass`      | Er is geen zichtbaar probleem boven laag risico gevonden.                  |
| `Review`    | Lees de bevindingen vóór installatie. De release kan nog steeds legitiem zijn. |
| `Warn`      | Wees extra voorzichtig. ClawHub heeft een zorgpunt met grote impact of een waarschuwingssignaal gevonden. |
| `Malicious` | Niet installeren.                                                         |
| `Pending`   | Audits zijn nog niet afgerond.                                            |
| `Error`     | De audit kon niet worden voltooid.                                        |

Een `Pass` is geruststellend, maar vervangt je eigen oordeel niet. Dit is het
belangrijkst voor tools die inhoud kunnen publiceren, gegevens kunnen bewerken, opdrachten kunnen uitvoeren, bestanden kunnen lezen of
toegang kunnen krijgen tot productiesystemen.

## Risiconiveau

Risiconiveau beschrijft de blast radius: hoeveel macht de release lijkt te hebben als
je die gebruikt zoals bedoeld.

| Risiconiveau | Betekenis                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Er is weinig gevoelige bevoegdheid of gebruikersimpact gevonden.             |
| `Medium`   | De release heeft betekenisvolle bevoegdheid, zoals accounttoegang of gegevenswijzigingen. |
| `High`     | De release heeft bevoegdheid met grote impact, ernstige bevindingen of kwaadaardige signalen. |

Risiconiveau en auditstatus beantwoorden verschillende vragen:

- Risiconiveau vraagt: "Hoeveel macht is hier aanwezig?"
- Auditstatus vraagt: "Wat moet ik met dit resultaat doen?"

Een publicatieskill kan bijvoorbeeld `Review` tonen met `Medium` risico. Dat betekent
niet dat die kwaadaardig is. Het betekent dat de skill doelgericht lijkt, maar kan
handelen met betekenisvolle accountbevoegdheid.

## Bevindingen

Bevindingen leggen uit waarom een auditresultaat is getoond. Elke bevinding bevat meestal:

- wat het betekent
- waarom het is gemarkeerd
- de relevante skill- of plugininhoud
- een aanbeveling

Bevindingen kunnen worden gelabeld als `Info`, `Low`, `Medium`, `High` of `Critical`. Bevindingen met een hogere
ernst dragen sterker bij aan het risiconiveau en de auditstatus.

Bevindingen met lage betrouwbaarheid worden verborgen uit de publieke auditsamenvatting zodat de pagina
gericht blijft op bruikbaar bewijs.

## Wat ClawHub controleert

ClawHub auditeert ingediende release-artefacten, waaronder:

- skill-instructies of pluginmetadata
- gedeclareerde omgevingsvariabelen en machtigingen
- installatie-instructies en pakketmetadata
- meegeleverde bestanden en bestandsmanifesten
- compatibiliteits- en capabilitymetadata

De hoofdvraag is samenhang: komen de naam, samenvatting, metadata, gevraagde
bevoegdheid en daadwerkelijke inhoud overeen met wat gebruikers redelijkerwijs zouden verwachten?

Krachtig gedrag is niet automatisch slecht. Veel nuttige tools hebben referenties,
lokale opdrachten, provider-API's of pakketinstallaties nodig. De audit controleert of die
macht verwacht, openbaar gemaakt en proportioneel is.

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
samenwerking laat ClawHub bredere beveiligingsinformatie toevoegen aan skill- en pluginbeoordeling.

VirusTotal is vooral nuttig voor bekende kwaadaardige artefacten, engine-hits en
reputatiesignalen die ClawHub's agentbewuste beoordeling aanvullen. Wanneer tellingen van
leveranciersengines beschikbaar zijn, vat de audit die samen in gewone taal, zoals:

```text
62/62 leveranciers markeerden deze skill als schoon.
```

of:

```text
2/64 leveranciers markeerden deze skill als kwaadaardig, 1/64 markeerde deze als verdacht en 61/64 markeerden deze als schoon.
```

Wanneer ClawHub geen leverancierstellingtelemetrie heeft om samen te vatten, zegt de audit:

```text
Geen VirusTotal-bevindingen
```

VirusTotal blijft telemetrie. Het vervangt ClawHub's eigen artefactbewuste
risicoanalyse niet.

## Risicoanalyse

Risicoanalyse wordt intern aangedreven door ClawScan, ClawHub's eigen beveiligingsaudit-
systeem. Het beoordeelt elke release als een agentgericht artefact: instructies,
metadata, gedeclareerde machtigingen, bestanden, capabilitysignalen, statische scansignalen,
SkillSpector-bevindingen, VirusTotal-telemetrie en door de uitgever aangeleverde context.
Statische scansignalen zijn interne context voor deze beoordeling; ze vormen geen
zelfstandige publieke auditsectie of installatieblokkerend oordeel.

Risicoanalyse gebruikt de
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
als lens voor risico's zoals promptinjectie, toolmisbruik, blootstelling van referenties,
onveilige uitvoering, vergiftiging van geheugen of context en buitensporige handelingsvrijheid.

ClawScan behandelt een capability die er eng uitziet niet automatisch als kwaadaardig.
Het vraagt of de capability openbaar gemaakt, doelgericht en ondersteund is door
de vermelde usecase van de release.
