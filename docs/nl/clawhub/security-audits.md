---
read_when:
    - ClawHub-beveiligingsauditresultaten begrijpen
    - Beslissen of je een skill of Plugin installeert
    - ClawHub-auditstatus, risiconiveau of bevindingen uitleggen
sidebarTitle: Security Audits
summary: Hoe u ClawHub-beveiligingsauditresultaten begrijpt voordat u een skill of plugin installeert.
title: Beveiligingsaudits
x-i18n:
    generated_at: "2026-06-28T07:42:10Z"
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
of iets extra aandacht verdient voordat het toegang krijgt tot bestanden, accounts,
inloggegevens, code of externe services.

Audits zijn sterke veiligheidssignalen, maar ze garanderen niet dat een release
risicovrij is. Gebruik altijd je eigen oordeel voordat je gevoelige toegang verleent.

Zie ook [Beveiliging](/nl/clawhub/security), [Aanvaardbaar gebruik](/nl/clawhub/acceptable-usage)
en [Moderatie en accountveiligheid](/nl/clawhub/moderation).

## Wat te controleren vóór installatie

Controleer vóór installatie:

- de algemene auditstatus
- het risiconiveau
- alle vermelde bevindingen
- vereiste inloggegevens, machtigingen of omgevingsvariabelen
- eigenaar, bron, versie, changelog, downloads, sterren en andere vertrouwenssignalen

Installeer alleen inhoud die je begrijpt en vertrouwt.

## Auditstatus

De auditstatus vertelt je hoe je op het auditresultaat moet reageren:

| Status      | Betekenis                                                                 |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Er is geen zichtbaar probleem boven laag risico gevonden.                 |
| `Review`    | Lees de bevindingen vóór installatie. De release kan nog steeds legitiem zijn. |
| `Warn`      | Wees extra voorzichtig. ClawHub heeft een zorgpunt met grote impact of een waarschuwingssignaal gevonden. |
| `Malicious` | Niet installeren.                                                         |
| `Pending`   | Audits zijn nog niet afgerond.                                            |
| `Error`     | De audit kon niet worden voltooid.                                        |

Een `Pass` is geruststellend, maar vervangt je eigen oordeel niet. Dit is het
belangrijkst voor tools die inhoud kunnen publiceren, gegevens kunnen bewerken, opdrachten kunnen uitvoeren, bestanden kunnen lezen of
toegang hebben tot productiesystemen.

## Risiconiveau

Het risiconiveau beschrijft de blast radius: hoeveel macht de release lijkt te hebben als
je deze gebruikt zoals bedoeld.

| Risiconiveau | Betekenis                                                                  |
| ------------ | -------------------------------------------------------------------------- |
| `Low`        | Er is weinig gevoelige bevoegdheid of gebruikersimpact gevonden.           |
| `Medium`     | De release heeft betekenisvolle bevoegdheid, zoals accounttoegang of gegevenswijzigingen. |
| `High`       | De release heeft bevoegdheid met grote impact, ernstige bevindingen of kwaadaardige signalen. |

Risiconiveau en auditstatus beantwoorden verschillende vragen:

- Risiconiveau vraagt: "Hoeveel macht is hier aanwezig?"
- Auditstatus vraagt: "Wat moet ik met dit resultaat doen?"

Een publicatieskill kan bijvoorbeeld `Review` tonen met `Medium` risico. Dat betekent
niet dat deze kwaadaardig is. Het betekent dat de skill doelgericht lijkt, maar
met betekenisvolle accountbevoegdheid kan handelen.

## Bevindingen

Bevindingen leggen uit waarom een auditresultaat is getoond. Elke bevinding bevat meestal:

- wat het betekent
- waarom het is gemarkeerd
- de relevante skill- of Plugin-inhoud
- een aanbeveling

Bevindingen kunnen het label `Info`, `Low`, `Medium`, `High` of `Critical` hebben. Bevindingen met hogere
ernst dragen sterker bij aan het risiconiveau en de auditstatus.

Bevindingen met lage betrouwbaarheid worden verborgen in de openbare auditsamenvatting, zodat de pagina
gericht blijft op bruikbaar bewijs.

## Wat ClawHub controleert

ClawHub audit ingediende release-artefacten, waaronder:

- skill-instructies of Plugin-metadata
- gedeclareerde omgevingsvariabelen en machtigingen
- installatie-instructies en pakketmetadata
- opgenomen bestanden en bestandsmanifesten
- compatibiliteits- en capabilitymetadata

De hoofdvraag is coherentie: sluiten naam, samenvatting, metadata, gevraagde
bevoegdheid en daadwerkelijke inhoud aan bij wat gebruikers redelijkerwijs zouden verwachten?

Krachtig gedrag is niet automatisch slecht. Veel nuttige tools hebben inloggegevens,
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
vertrouwde industriestandaard voor bestandsreputatie en malwarescans, en onze
samenwerking laat ClawHub bredere beveiligingsinformatie toevoegen aan de beoordeling van skills en Plugins.

VirusTotal is vooral nuttig voor bekende kwaadaardige artefacten, engine-hits en
reputatiesignalen die de agentbewuste beoordeling van ClawHub aanvullen. Wanneer aantallen van
leveranciersengines beschikbaar zijn, vat de audit ze samen in gewone taal, zoals:

```text
62/62 leveranciers hebben deze skill als schoon gemarkeerd.
```

of:

```text
2/64 leveranciers hebben deze skill als kwaadaardig gemarkeerd, 1/64 heeft deze als verdacht gemarkeerd en 61/64 hebben deze als schoon gemarkeerd.
```

Wanneer ClawHub geen telemetrie met leveranciersaantallen heeft om samen te vatten, zegt de audit:

```text
Geen VirusTotal-bevindingen
```

VirusTotal blijft telemetrie. Het vervangt de eigen artefactbewuste
risicoanalyse van ClawHub niet.

## Risicoanalyse

Risicoanalyse wordt intern aangedreven door ClawScan, het eigen beveiligingsauditsysteem van ClawHub.
Het beoordeelt elke release als een agentgericht artefact: instructies,
metadata, gedeclareerde machtigingen, bestanden, capabilitysignalen, statische scansignalen,
SkillSpector-bevindingen, VirusTotal-telemetrie en context die door de uitgever is aangeleverd.
Statische scansignalen zijn interne context voor deze beoordeling; ze zijn geen
zelfstandige openbare auditsectie of installatieblokkerend oordeel.

Risicoanalyse gebruikt de
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
als lens voor risico's zoals promptinjectie, toolmisbruik, blootstelling van inloggegevens,
onveilige uitvoering, memory- of contextvergiftiging en buitensporige handelingsvrijheid.

ClawScan behandelt een capability die er bedreigend uitziet niet automatisch als kwaadaardig.
Het vraagt of de capability is bekendgemaakt, aansluit bij het doel en wordt ondersteund door
de beschreven use case van de release.
