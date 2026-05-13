---
read_when:
    - Inzicht in vermeldingen, versies, installaties, publicatie en moderatie
summary: Hoe ClawHub-vermeldingen, versies, installaties, publiceren, scans en updates werken.
x-i18n:
    generated_at: "2026-05-13T05:32:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Hoe ClawHub werkt

ClawHub is de registerlaag voor OpenClaw Skills en plugins. Het geeft gebruikers een
plek om pakketten te ontdekken, geeft uitgevers een plek om versies uit te brengen en
geeft OpenClaw genoeg metadata om die pakketten veilig te installeren en bij te werken.

## Registerrecords

Elke openbare vermelding is een registerrecord met:

- een eigenaar en slug of pakketnaam
- een of meer gepubliceerde versies
- metadata, samenvatting, bestanden en bronvermelding
- changelog- en taginformatie zoals `latest`
- download-, installatie-, ster- en reactiesignalen
- beveiligingsscan- en moderatiestatus

De vermeldingspagina is de canonieke plek waar gebruikers kunnen controleren wat een skill of
plugin beweert te doen voordat ze deze installeren.

## Skills

Een skill is een geversioneerde tekstbundel rond `SKILL.md`. Deze kan
ondersteunende bestanden, voorbeelden, sjablonen en scripts bevatten.

ClawHub leest de frontmatter van `SKILL.md` om de naam,
beschrijving, vereisten, omgevingsvariabelen en metadata van de skill te begrijpen. Nauwkeurige
metadata is belangrijk omdat dit gebruikers helpt bepalen of ze de skill moeten installeren en
geautomatiseerde scans helpt verschillen te detecteren tussen gedeclareerd en waargenomen gedrag.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugins zijn verpakte OpenClaw-extensies. ClawHub bewaart pakketmetadata,
compatibiliteitsinformatie, bronlinks, artefacten en versierecords.

Wanneer OpenClaw een plugin vanuit ClawHub installeert, controleert het de geadverteerde compatibiliteitsmetadata
vóór installatie. Pakketrecords kunnen API-compatibiliteit,
minimale gatewayversie, hostdoelen, omgevingsvereisten en artefact-digests bevatten.

Gebruik een expliciete ClawHub-installatiebron wanneer je wilt dat het register de
bron van waarheid is:

```bash
openclaw plugins install clawhub:<package>
```

## Publiceren

Publiceren maakt een nieuw onveranderlijk versierecord aan. Uitgevers gebruiken de `clawhub`
CLI voor geauthenticeerde registerworkflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik dry runs om de opgeloste payload te bekijken voordat je uploadt. Openbare pagina's tonen daarna
de gepubliceerde metadata, bestanden, bronvermelding en scanstatus.

## Installaties en updates

Installatieopdrachten van OpenClaw gebruiken ClawHub als pakketbron:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw registreert metadata over de installatiebron zodat updates later hetzelfde
registerpakket kunnen oplossen. De ClawHub CLI ondersteunt ook directe workflows voor het installeren en
bijwerken van skills voor gebruikers die door het register beheerde skillmappen willen buiten een
volledige OpenClaw-werkruimte.

## Beveiligingsstatus

ClawHub staat open voor publicatie, maar releases zijn nog steeds onderworpen aan uploadpoorten,
geautomatiseerde controles, gebruikersrapporten en moderatoracties.

Openbare pagina's tonen scansamenvattingen wanneer die beschikbaar zijn. Content die wordt vastgehouden, verborgen
of geblokkeerd, kan verdwijnen uit openbare zoek- en installatiestromen terwijl deze
zichtbaar blijft voor de eigenaar voor diagnostiek.

Zie [Beveiliging + moderatie](/nl/clawhub/security) en
[Acceptabel gebruik](/nl/clawhub/acceptable-usage).

## API-toegang

ClawHub biedt openbare lees-API's voor ontdekking, zoeken, pakketdetails en
downloads. Catalogi van derden mogen deze API's gebruiken wanneer ze teruglinken naar de
canonieke ClawHub-vermelding, snelheidslimieten respecteren en vermijden goedkeuring te suggereren.

Zie [Openbare API](/nl/clawhub/api) en [HTTP API](/nl/clawhub/http-api).
