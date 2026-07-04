---
read_when:
    - Vermeldingen, versies, installaties, publicatie en moderatie begrijpen
summary: Hoe ClawHub-vermeldingen, versies, installaties, publicatie, scans en updates werken.
x-i18n:
    generated_at: "2026-07-04T20:37:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Hoe ClawHub werkt

ClawHub is de registerlaag voor OpenClaw Skills en Plugins. Het geeft gebruikers
een plek om pakketten te ontdekken, geeft uitgevers een plek om versies uit te
brengen, en geeft OpenClaw genoeg metadata om die pakketten veilig te installeren
en bij te werken.

## Registerrecords

Elke openbare vermelding is een registerrecord met:

- een eigenaar en slug of pakketnaam
- een of meer gepubliceerde versies
- metadata, samenvatting, bestanden en bronvermelding
- changelog- en taginformatie zoals `latest`
- download-, installatie- en sterrensignalen
- beveiligingsscan- en moderatiestatus

De vermeldingspagina is de canonieke plek waar gebruikers kunnen controleren wat
een Skill of Plugin beweert te doen voordat ze die installeren.

## Skills

Een Skill is een geversioneerde tekstbundel rond `SKILL.md`. Deze kan
ondersteunende bestanden, voorbeelden, sjablonen en scripts bevatten.

ClawHub leest de frontmatter van `SKILL.md` om de Skill-naam, beschrijving,
vereisten, omgevingsvariabelen en metadata te begrijpen. Nauwkeurige metadata is
belangrijk omdat die gebruikers helpt beslissen of ze de Skill willen installeren
en automatische scans helpt om afwijkingen tussen verklaard en waargenomen gedrag
te detecteren.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugins zijn verpakte OpenClaw-uitbreidingen. ClawHub bewaart pakketmetadata,
compatibiliteitsinformatie, bronlinks, artefacten en versierecords.

Wanneer OpenClaw een Plugin vanuit ClawHub installeert, controleert het de
geadverteerde compatibiliteitsmetadata vóór installatie. Pakketrecords kunnen
API-compatibiliteit, minimale Gateway-versie, hostdoelen, omgevingsvereisten en
artefact-digests bevatten.

Gebruik een expliciete ClawHub-installatiebron wanneer het register de bron van
waarheid moet zijn:

```bash
openclaw plugins install clawhub:<package>
```

## Publiceren

Publiceren maakt een nieuw onveranderlijk versierecord aan. Uitgevers gebruiken
de `clawhub` CLI voor geauthenticeerde registerworkflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik proefuitvoeringen om de opgeloste payload vóór upload te bekijken.
Openbare pagina's tonen daarna de gepubliceerde metadata, bestanden,
bronvermelding en scanstatus.

## Installaties en updates

OpenClaw-installatieopdrachten gebruiken ClawHub als pakketbron:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registreert installatiebronmetadata zodat updates later hetzelfde
registerpakket kunnen oplossen. De ClawHub CLI ondersteunt ook rechtstreekse
workflows voor het installeren en bijwerken van Skills voor gebruikers die door
het register beheerde Skill-mappen buiten een volledige OpenClaw-werkruimte
willen.

## Beveiligingsstatus

ClawHub staat open voor publicatie, maar releases blijven onderworpen aan
uploadpoorten, automatische controles, gebruikersmeldingen en moderatoractie.

Openbare pagina's tonen scansamenvattingen wanneer beschikbaar. Content die
wordt vastgehouden, verborgen of geblokkeerd, kan verdwijnen uit openbare zoek-
en installatieworkflows, terwijl die zichtbaar blijft voor de eigenaar voor
diagnostiek.

Zie [Beveiliging](/clawhub/security), [Beveiligingsaudits](/clawhub/security-audits),
[Moderatie en accountveiligheid](/nl/clawhub/moderation) en
[Acceptabel gebruik](/clawhub/acceptable-usage).

## API-toegang

ClawHub biedt openbare lees-API's voor ontdekking, zoeken, pakketdetails en
downloads. Catalogi van derden mogen deze API's gebruiken wanneer ze teruglinken
naar de canonieke ClawHub-vermelding, ratelimieten respecteren en vermijden dat
ze goedkeuring suggereren.

Zie [Openbare API](/nl/clawhub/api) en [HTTP API](/clawhub/http-api).
