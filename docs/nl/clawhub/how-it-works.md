---
read_when:
    - Inzicht in vermeldingen, versies, installaties, publiceren en moderatie
summary: Hoe ClawHub-vermeldingen, versies, installaties, publicatie, scans en updates werken.
x-i18n:
    generated_at: "2026-05-13T04:17:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Hoe ClawHub werkt

ClawHub is de registerlaag voor OpenClaw Skills en plugins. Het geeft gebruikers een
plek om pakketten te ontdekken, geeft uitgevers een plek om versies uit te brengen, en
geeft OpenClaw genoeg metadata om die pakketten veilig te installeren en bij te werken.

## Registerrecords

Elke openbare vermelding is een registerrecord met:

- een eigenaar en slug of pakketnaam
- een of meer gepubliceerde versies
- metadata, samenvatting, bestanden en bronvermelding
- changelog- en taginformatie zoals `latest`
- signalen voor downloads, installaties, sterren en opmerkingen
- status van beveiligingsscan en moderatie

De vermeldingspagina is de canonieke plek waar gebruikers kunnen controleren wat een Skill of
plugin beweert te doen voordat ze deze installeren.

## Skills

Een Skill is een geversioneerde tekstbundel rond `SKILL.md`. Deze kan
ondersteunende bestanden, voorbeelden, sjablonen en scripts bevatten.

ClawHub leest de frontmatter van `SKILL.md` om de naam, beschrijving,
vereisten, omgevingsvariabelen en metadata van de Skill te begrijpen. Nauwkeurige
metadata is belangrijk omdat die gebruikers helpt beslissen of ze de Skill willen installeren en
geautomatiseerde scans helpt om verschillen tussen opgegeven en waargenomen gedrag te detecteren.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugins zijn verpakte OpenClaw-uitbreidingen. ClawHub bewaart pakketmetadata,
compatibiliteitsinformatie, bronlinks, artefacten en versiegegevens.

Wanneer OpenClaw een plugin vanuit ClawHub installeert, controleert het de opgegeven compatibiliteitsmetadata
voordat de installatie plaatsvindt. Pakketrecords kunnen API-compatibiliteit,
minimale Gateway-versie, hostdoelen, omgevingsvereisten en artefactdigests
bevatten.

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

Gebruik dry runs om de opgeloste payload vooraf te bekijken voordat je uploadt. Openbare pagina's
tonen vervolgens de gepubliceerde metadata, bestanden, bronvermelding en scanstatus.

## Installaties en updates

OpenClaw-installatieopdrachten gebruiken ClawHub als pakketbron:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw legt metadata van de installatiebron vast, zodat updates later hetzelfde
registerpakket kunnen ophalen. De ClawHub CLI ondersteunt ook directe installatie- en
updateworkflows voor Skills voor gebruikers die door het register beheerde Skill-mappen buiten een
volledige OpenClaw-werkruimte willen gebruiken.

## Beveiligingsstatus

ClawHub staat open voor publiceren, maar releases zijn nog steeds onderworpen aan uploadpoorten,
geautomatiseerde controles, gebruikersrapporten en moderatoracties.

Openbare pagina's tonen scansamenvattingen wanneer die beschikbaar zijn. Content die wordt vastgehouden, verborgen
of geblokkeerd kan verdwijnen uit openbare zoek- en installatiestromen, terwijl deze
zichtbaar blijft voor de eigenaar voor diagnostiek.

Zie [Beveiliging + moderatie](/nl/clawhub/security) en
[Acceptabel gebruik](/nl/clawhub/acceptable-usage).

## API-toegang

ClawHub biedt openbare lees-API's voor ontdekking, zoeken, pakketdetails en
downloads. Catalogi van derden mogen deze API's gebruiken wanneer ze teruglinken naar de
canonieke ClawHub-vermelding, snelheidslimieten respecteren en vermijden dat ze goedkeuring suggereren.

Zie [Openbare API](/nl/clawhub/api) en [HTTP API](/nl/clawhub/http-api).
