---
read_when:
    - Inzicht in vermeldingen, versies, installaties, publiceren en moderatie
summary: Hoe ClawHub-vermeldingen, versies, installaties, publicatie, scans en updates werken.
x-i18n:
    generated_at: "2026-05-12T08:43:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Hoe ClawHub werkt

ClawHub is de registerlaag voor OpenClaw skills en plugins. Het geeft gebruikers een
plek om pakketten te ontdekken, uitgevers een plek om versies uit te brengen, en
geeft OpenClaw voldoende metadata om die pakketten veilig te installeren en bij te werken.

## Registerrecords

Elke openbare vermelding is een registerrecord met:

- een eigenaar en slug of pakketnaam
- een of meer gepubliceerde versies
- metadata, samenvatting, bestanden en bronvermelding
- changelog- en taginformatie zoals `latest`
- signalen voor downloads, installaties, sterren en opmerkingen
- status van beveiligingsscan en moderatie

De vermeldingspagina is de canonieke plek waar gebruikers kunnen bekijken wat een skill of
plugin beweert te doen voordat ze die installeren.

## Skills

Een skill is een geversioneerde tekstbundel rond `SKILL.md`. Deze kan
ondersteunende bestanden, voorbeelden, sjablonen en scripts bevatten.

ClawHub leest de frontmatter van `SKILL.md` om de skillnaam,
beschrijving, vereisten, omgevingsvariabelen en metadata te begrijpen. Nauwkeurige
metadata is belangrijk omdat gebruikers hierdoor kunnen beslissen of ze de skill willen installeren en
geautomatiseerde scans mismatches kunnen detecteren tussen gedeclareerd en waargenomen gedrag.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugins zijn verpakte OpenClaw-uitbreidingen. ClawHub slaat pakketmetadata,
compatibiliteitsinformatie, bronlinks, artefacten en versierecords op.

Wanneer OpenClaw een plugin vanuit ClawHub installeert, controleert het de geadverteerde compatibiliteitsmetadata
voordat het installeert. Pakketrecords kunnen API-compatibiliteit,
minimale Gateway-versie, hostdoelen, omgevingsvereisten en artefactdigests
bevatten.

Gebruik een expliciete ClawHub-installatiebron wanneer je wilt dat het register de
gezaghebbende bron is:

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

Gebruik dry runs om de opgeloste payload voorafgaand aan upload te bekijken. Openbare pagina's tonen daarna
de gepubliceerde metadata, bestanden, bronvermelding en scanstatus.

## Installaties en updates

OpenClaw-installatieopdrachten gebruiken ClawHub als pakketbron:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw registreert metadata van de installatiebron zodat updates later hetzelfde
registerpakket kunnen oplossen. De ClawHub CLI ondersteunt ook directe skill-installatie- en
updateworkflows voor gebruikers die door het register beheerde skillmappen willen buiten een
volledige OpenClaw-werkruimte.

## Beveiligingsstatus

ClawHub staat open voor publicatie, maar releases zijn nog steeds onderworpen aan uploadpoorten,
geautomatiseerde controles, gebruikersmeldingen en moderatoracties.

Openbare pagina's tonen scansamenvattingen wanneer beschikbaar. Inhoud die wordt vastgehouden, verborgen
of geblokkeerd kan verdwijnen uit openbare zoek- en installatieflows, terwijl deze
voor diagnostiek zichtbaar blijft voor de eigenaar.

Zie [Beveiliging + moderatie](/nl/clawhub/security) en
[Acceptabel gebruik](/nl/clawhub/acceptable-usage).

## API-toegang

ClawHub biedt openbare lees-API's voor ontdekking, zoeken, pakketdetails en
downloads. Catalogi van derden mogen deze API's gebruiken wanneer ze teruglinken naar de
canonieke ClawHub-vermelding, snelheidslimieten respecteren en geen goedkeuring impliceren.

Zie [Openbare API](/nl/clawhub/api) en [HTTP-API](/nl/clawhub/http-api).
