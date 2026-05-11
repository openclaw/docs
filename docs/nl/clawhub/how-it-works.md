---
read_when:
    - Inzicht in vermeldingen, versies, installaties, publiceren en moderatie
summary: Hoe ClawHub-vermeldingen, versies, installaties, publiceren, scans en updates werken.
x-i18n:
    generated_at: "2026-05-11T20:23:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Hoe ClawHub werkt

ClawHub is de registrylaag voor OpenClaw Skills en plugins. Het geeft gebruikers een
plek om pakketten te ontdekken, geeft uitgevers een plek om versies uit te brengen, en
geeft OpenClaw genoeg metadata om die pakketten veilig te installeren en bij te werken.

## Registryrecords

Elke openbare vermelding is een registryrecord met:

- een eigenaar en slug of pakketnaam
- een of meer gepubliceerde versies
- metadata, samenvatting, bestanden en bronvermelding
- changelog- en taginformatie zoals `latest`
- signalen voor downloads, installaties, sterren en reacties
- beveiligingsscan- en moderatiestatus

De vermeldingspagina is de canonieke plek waar gebruikers kunnen controleren wat een Skill of
plugin beweert te doen voordat ze deze installeren.

## Skills

Een Skill is een geversioneerde tekstbundel rond `SKILL.md`. Deze kan
ondersteunende bestanden, voorbeelden, sjablonen en scripts bevatten.

ClawHub leest de frontmatter van `SKILL.md` om de naam,
beschrijving, vereisten, omgevingsvariabelen en metadata van de Skill te begrijpen. Nauwkeurige
metadata is belangrijk omdat die gebruikers helpt beslissen of ze de Skill willen installeren en
geautomatiseerde scans helpt verschillen te detecteren tussen verklaard en waargenomen gedrag.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugins zijn verpakte OpenClaw-uitbreidingen. ClawHub slaat pakketmetadata,
compatibiliteitsinformatie, bronlinks, artifacts en versierecords op.

Wanneer OpenClaw een plugin vanuit ClawHub installeert, controleert het de opgegeven compatibiliteitsmetadata
voor installatie. Pakketrecords kunnen API-compatibiliteit,
minimale Gateway-versie, hostdoelen, omgevingsvereisten en artifactdigests bevatten.

Gebruik een expliciete ClawHub-installatiebron wanneer je wilt dat de registry de
bron van waarheid is:

```bash
openclaw plugins install clawhub:<package>
```

## Publiceren

Publiceren maakt een nieuw onveranderlijk versierecord aan. Uitgevers gebruiken de `clawhub`
CLI voor geauthenticeerde registryworkflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik proefruns om de opgeloste payload vóór het uploaden te bekijken. Openbare pagina's tonen vervolgens
de gepubliceerde metadata, bestanden, bronvermelding en scanstatus.

## Installaties en updates

OpenClaw-installatieopdrachten gebruiken ClawHub als pakketbron:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw legt metadata over de installatiebron vast, zodat updates later hetzelfde
registrypakket kunnen vinden. De ClawHub CLI ondersteunt ook directe workflows voor het installeren en
bijwerken van Skills voor gebruikers die door de registry beheerde Skill-mappen buiten een
volledige OpenClaw-werkruimte willen.

## Beveiligingsstatus

ClawHub staat open voor publicatie, maar releases blijven onderworpen aan uploadpoorten,
geautomatiseerde controles, gebruikersmeldingen en moderatoracties.

Openbare pagina's tonen scansamenvattingen wanneer die beschikbaar zijn. Content die wordt vastgehouden, verborgen
of geblokkeerd, kan verdwijnen uit openbare zoek- en installatiestromen, terwijl deze
zichtbaar blijft voor de eigenaar voor diagnose of beroep.

Zie [Beveiliging + moderatie](/nl/clawhub/security) en
[Acceptabel gebruik](/nl/clawhub/acceptable-usage).

## API-toegang

ClawHub biedt openbare lees-API's voor ontdekking, zoeken, pakketdetails en
downloads. Catalogi van derden mogen deze API's gebruiken wanneer ze teruglinken naar de
canonieke ClawHub-vermelding, snelheidslimieten respecteren en geen goedkeuring suggereren.

Zie [Openbare API](/nl/clawhub/api) en [HTTP API](/nl/clawhub/http-api).
