---
read_when:
    - Listings, versies, installaties, publiceren en moderatie begrijpen
summary: Hoe ClawHub-vermeldingen, versies, installaties, publicatie, scans en updates werken.
x-i18n:
    generated_at: "2026-07-03T23:36:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Hoe ClawHub werkt

ClawHub is de registrylaag voor OpenClaw Skills en plugins. Het geeft gebruikers een
plek om pakketten te ontdekken, uitgevers een plek om versies uit te brengen, en
geeft OpenClaw genoeg metadata om die pakketten veilig te installeren en bij te werken.

## Registryrecords

Elke openbare vermelding is een registryrecord met:

- een eigenaar en slug of pakketnaam
- een of meer gepubliceerde versies
- metadata, samenvatting, bestanden en bronvermelding
- changelog- en taginformatie zoals `latest`
- download-, installatie- en stersignalen
- beveiligingsscan- en moderatiestatus

De vermeldingspagina is de canonieke plek voor gebruikers om te controleren wat een skill of
plugin beweert te doen voordat ze die installeren.

## Skills

Een skill is een geversioneerde tekstbundel rond `SKILL.md`. Deze kan
ondersteunende bestanden, voorbeelden, sjablonen en scripts bevatten.

ClawHub leest de frontmatter van `SKILL.md` om de skillnaam,
beschrijving, vereisten, omgevingsvariabelen en metadata te begrijpen. Nauwkeurige
metadata is belangrijk omdat die gebruikers helpt beslissen of ze de skill willen installeren en
geautomatiseerde scans helpt afwijkingen te detecteren tussen verklaard en waargenomen gedrag.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugins zijn verpakte OpenClaw-uitbreidingen. ClawHub bewaart pakketmetadata,
compatibiliteitsinformatie, bronlinks, artifacts en versierecords.

Wanneer OpenClaw een plugin vanuit ClawHub installeert, controleert het de geadverteerde compatibiliteitsmetadata
vóór installatie. Pakketrecords kunnen API-compatibiliteit,
minimale gatewayversie, hostdoelen, omgevingsvereisten en artifactdigests bevatten.

Gebruik een expliciete ClawHub-installatiebron wanneer je wilt dat de registry de
bron van waarheid is:

```bash
openclaw plugins install clawhub:<package>
```

## Publiceren

Publiceren maakt een nieuw onveranderlijk versierecord. Uitgevers gebruiken de `clawhub`
CLI voor geauthenticeerde registryworkflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik dry-runs om de opgeloste payload vóór uploaden te bekijken. Openbare pagina's tonen daarna
de gepubliceerde metadata, bestanden, bronvermelding en scanstatus.

## Installaties en updates

OpenClaw-installatieopdrachten gebruiken ClawHub als pakketbron:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw legt metadata over de installatiebron vast, zodat updates later hetzelfde
registrypakket kunnen vinden. De ClawHub CLI ondersteunt ook directe installatie- en
updateworkflows voor skills voor gebruikers die registrybeheerde skillmappen buiten een
volledige OpenClaw-werkruimte willen.

## Beveiligingsstatus

ClawHub staat open voor publiceren, maar releases blijven onderworpen aan uploadpoorten,
geautomatiseerde controles, gebruikersrapporten en moderatoracties.

Openbare pagina's tonen scansamenvattingen wanneer die beschikbaar zijn. Content die wordt vastgehouden, verborgen
of geblokkeerd kan verdwijnen uit openbare zoek- en installatiestromen, terwijl die
zichtbaar blijft voor de eigenaar voor diagnostiek.

Zie [Beveiliging](/clawhub/security), [Beveiligingsaudits](/clawhub/security-audits),
[Moderatie en accountveiligheid](/nl/clawhub/moderation), en
[Acceptabel gebruik](/clawhub/acceptable-usage).

## API-toegang

ClawHub biedt openbare lees-API's voor ontdekking, zoeken, pakketdetails en
downloads. Catalogi van derden mogen deze API's gebruiken wanneer ze teruglinken naar de
canonieke ClawHub-vermelding, snelheidslimieten respecteren en geen goedkeuring suggereren.

Zie [Openbare API](/nl/clawhub/api) en [HTTP-API](/clawhub/http-api).
