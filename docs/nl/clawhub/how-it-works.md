---
read_when:
    - Inzicht in vermeldingen, versies, installaties, publicatie en moderatie
summary: Hoe ClawHub-vermeldingen, versies, installaties, publiceren, scans en updates werken.
x-i18n:
    generated_at: "2026-05-12T00:56:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Hoe ClawHub werkt

ClawHub is de registerlaag voor OpenClaw-skills en plugins. Het geeft gebruikers een
plek om pakketten te ontdekken, geeft uitgevers een plek om versies uit te brengen, en
geeft OpenClaw genoeg metadata om die pakketten veilig te installeren en bij te werken.

## Registerrecords

Elke openbare vermelding is een registerrecord met:

- een eigenaar en slug of pakketnaam
- een of meer gepubliceerde versies
- metadata, samenvatting, bestanden en bronvermelding
- changelog- en taginformatie zoals `latest`
- download-, installatie-, ster- en reactiesignalen
- beveiligingsscan- en moderatiestatus

De vermeldingspagina is de canonieke plek waar gebruikers kunnen bekijken wat een skill of
plugin beweert te doen voordat ze die installeren.

## Skills

Een skill is een geversioneerde tekstbundel rond `SKILL.md`. Deze kan
ondersteunende bestanden, voorbeelden, sjablonen en scripts bevatten.

ClawHub leest de frontmatter van `SKILL.md` om de skillnaam,
beschrijving, vereisten, omgevingsvariabelen en metadata te begrijpen. Nauwkeurige
metadata is belangrijk omdat die gebruikers helpt beslissen of ze de skill willen installeren en
geautomatiseerde scans helpt mismatches tussen verklaard en waargenomen gedrag te detecteren.

Zie [Skillindeling](/nl/clawhub/skill-format).

## Plugins

Plugins zijn verpakte OpenClaw-uitbreidingen. ClawHub slaat pakketmetadata,
compatibiliteitsinformatie, bronlinks, artefacten en versierecords op.

Wanneer OpenClaw een plugin vanuit ClawHub installeert, controleert het de geadverteerde compatibiliteitsmetadata
voordat het installeert. Pakketrecords kunnen API-compatibiliteit,
minimale gatewayversie, hostdoelen, omgevingsvereisten en artefactdigests bevatten.

Gebruik een expliciete ClawHub-installatiebron wanneer je wilt dat het register de
source of truth is:

```bash
openclaw plugins install clawhub:<package>
```

## Publiceren

Publiceren maakt een nieuw onveranderlijk versierecord. Uitgevers gebruiken de `clawhub`
CLI voor geauthenticeerde registerworkflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik dry runs om de opgeloste payload te bekijken voordat je uploadt. Openbare pagina’s tonen daarna
de gepubliceerde metadata, bestanden, bronvermelding en scanstatus.

## Installaties en updates

OpenClaw-installatiecommando’s gebruiken ClawHub als pakketbron:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw registreert metadata over de installatiebron zodat updates later hetzelfde
registerpakket kunnen oplossen. De ClawHub CLI ondersteunt ook directe installatie- en
updateworkflows voor skills voor gebruikers die door het register beheerde skillmappen buiten een
volledige OpenClaw-werkruimte willen.

## Beveiligingsstatus

ClawHub staat open voor publicatie, maar releases blijven onderworpen aan uploadgates,
geautomatiseerde controles, gebruikersrapportages en moderatieacties.

Openbare pagina’s tonen scansamenvattingen wanneer die beschikbaar zijn. Content die wordt vastgehouden, verborgen
of geblokkeerd, kan verdwijnen uit openbare zoek- en installatiestromen terwijl die
voor diagnostiek zichtbaar blijft voor de eigenaar.

Zie [Beveiliging + moderatie](/nl/clawhub/security) en
[Acceptabel gebruik](/nl/clawhub/acceptable-usage).

## API-toegang

ClawHub biedt openbare read API’s voor ontdekking, zoeken, pakketdetails en
downloads. Catalogi van derden mogen deze API’s gebruiken wanneer ze teruglinken naar de
canonieke ClawHub-vermelding, snelheidslimieten respecteren en vermijden dat ze goedkeuring impliceren.

Zie [Openbare API](/nl/clawhub/api) en [HTTP API](/nl/clawhub/http-api).
