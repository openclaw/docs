---
read_when:
    - Inzicht in vermeldingen, versies, installaties, publiceren en moderatie
summary: Hoe ClawHub-vermeldingen, versies, installaties, publicatie, scans en updates werken.
x-i18n:
    generated_at: "2026-05-10T19:25:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Hoe ClawHub werkt

ClawHub is de registerlaag voor OpenClaw-skills en -plugins. Het geeft gebruikers een
plek om pakketten te ontdekken, geeft uitgevers een plek om versies uit te brengen, en
geeft OpenClaw voldoende metadata om die pakketten veilig te installeren en bij te werken.

## Registerrecords

Elke openbare vermelding is een registerrecord met:

- een eigenaar en slug of pakketnaam
- een of meer gepubliceerde versies
- metadata, samenvatting, bestanden en bronvermelding
- changelog- en taginformatie zoals `latest`
- download-, installatie-, ster- en reactiesignalen
- beveiligingsscan- en moderatiestatus

De vermeldingspagina is de canonieke plek waar gebruikers kunnen controleren wat een skill of
plugin beweert te doen voordat ze die installeren.

## Skills

Een skill is een versiegebonden tekstbundel rond `SKILL.md`. Die kan
ondersteunende bestanden, voorbeelden, sjablonen en scripts bevatten.

ClawHub leest de frontmatter van `SKILL.md` om de skillnaam,
beschrijving, vereisten, omgevingsvariabelen en metadata te begrijpen. Nauwkeurige
metadata is belangrijk omdat die gebruikers helpt te bepalen of ze de skill willen installeren en
geautomatiseerde scans helpt verschillen tussen gedeclareerd en waargenomen gedrag te detecteren.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugins zijn verpakte OpenClaw-uitbreidingen. ClawHub bewaart pakketmetadata,
compatibiliteitsinformatie, bronlinks, artefacten en versiegegevens.

Wanneer OpenClaw een plugin vanuit ClawHub installeert, controleert het de opgegeven compatibiliteitsmetadata
voordat het installeert. Pakketrecords kunnen API-compatibiliteit,
minimale gatewayversie, hostdoelen, omgevingsvereisten en artefactdigests bevatten.

Gebruik een expliciete ClawHub-installatiebron wanneer je wilt dat het register de
bron van waarheid is:

```bash
openclaw plugins install clawhub:<package>
```

## Publiceren

Publiceren maakt een nieuw onveranderlijk versie-record aan. Uitgevers gebruiken de `clawhub`
CLI voor geauthenticeerde registerworkflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik dry-runs om de opgeloste payload vooraf te bekijken voordat je uploadt. Openbare pagina's tonen daarna
de gepubliceerde metadata, bestanden, bronvermelding en scanstatus.

## Installaties en updates

OpenClaw-installatieopdrachten gebruiken ClawHub als pakketbron:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw registreert installatiebronmetadata zodat updates later hetzelfde
registerpakket kunnen oplossen. De ClawHub CLI ondersteunt ook rechtstreekse skill-installatie- en
updateworkflows voor gebruikers die door het register beheerde skillmappen willen buiten een
volledige OpenClaw-werkruimte.

## Beveiligingsstatus

ClawHub staat open voor publicatie, maar releases blijven onderworpen aan uploadpoorten,
geautomatiseerde controles, gebruikersmeldingen en moderatieacties.

Openbare pagina's tonen scansamenvattingen wanneer die beschikbaar zijn. Inhoud die wordt vastgehouden, verborgen
of geblokkeerd, kan uit openbare zoek- en installatiestromen verdwijnen terwijl die
voor de eigenaar zichtbaar blijft voor diagnose of bezwaar.

Zie [Beveiliging en moderatie](/nl/clawhub/security) en
[Acceptabel gebruik](/nl/clawhub/acceptable-usage).

## API-toegang

ClawHub biedt openbare lees-API's voor ontdekking, zoeken, pakketdetails en
downloads. Catalogi van derden mogen deze API's gebruiken wanneer ze teruglinken naar de
canonieke ClawHub-vermelding, snelheidslimieten respecteren en vermijden dat ze goedkeuring suggereren.

Zie [Openbare API](/nl/clawhub/api) en [HTTP API](/nl/clawhub/http-api).
