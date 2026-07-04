---
read_when:
    - Inzicht in vermeldingen, versies, installaties, publiceren en moderatie
summary: Hoe ClawHub-vermeldingen, versies, installaties, publicatie, scans en updates werken.
x-i18n:
    generated_at: "2026-07-04T03:54:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Hoe ClawHub Werkt

ClawHub is de registrylaag voor OpenClaw Skills en plugins. Het geeft gebruikers een
plek om pakketten te ontdekken, geeft uitgevers een plek om versies uit te brengen, en
geeft OpenClaw voldoende metadata om die pakketten veilig te installeren en bij te werken.

## Registryrecords

Elke openbare vermelding is een registryrecord met:

- een eigenaar en slug of pakketnaam
- een of meer gepubliceerde versies
- metadata, samenvatting, bestanden en bronvermelding
- changelog- en taginformatie zoals `latest`
- download-, installatie- en stersignalen
- beveiligingsscan- en moderatiestatus

De vermeldingspagina is de canonieke plek waar gebruikers kunnen controleren wat een Skill of
plugin zegt te doen voordat ze die installeren.

## Skills

Een Skill is een geversioneerde tekstbundel rond `SKILL.md`. Deze kan
ondersteunende bestanden, voorbeelden, templates en scripts bevatten.

ClawHub leest de frontmatter van `SKILL.md` om de naam,
beschrijving, vereisten, omgevingsvariabelen en metadata van de Skill te begrijpen. Nauwkeurige
metadata is belangrijk omdat die gebruikers helpt te beslissen of ze de Skill willen installeren en
geautomatiseerde scans helpt verschillen te detecteren tussen verklaard en waargenomen gedrag.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugins zijn verpakte OpenClaw-extensies. ClawHub bewaart pakketmetadata,
compatibiliteitsinformatie, bronlinks, artefacten en versiegegevens.

Wanneer OpenClaw een Plugin vanuit ClawHub installeert, controleert het de geadverteerde compatibiliteitsmetadata
voordat het installeert. Pakketrecords kunnen API-compatibiliteit,
minimale gatewayversie, hostdoelen, omgevingsvereisten en artefactdigests bevatten.

Gebruik een expliciete ClawHub-installatiebron wanneer je wilt dat de registry de
bron van waarheid is:

```bash
openclaw plugins install clawhub:<package>
```

## Publiceren

Publiceren maakt een nieuw onveranderlijk versiegegeven aan. Uitgevers gebruiken de `clawhub`
CLI voor geauthenticeerde registryworkflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik dry-runs om de opgeloste payload te bekijken voordat je uploadt. Openbare pagina's tonen daarna
de gepubliceerde metadata, bestanden, bronvermelding en scanstatus.

## Installaties en updates

OpenClaw-installatiecommando's gebruiken ClawHub als pakketbron:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registreert metadata over de installatiebron zodat updates later hetzelfde
registrypakket kunnen oplossen. De ClawHub CLI ondersteunt ook rechtstreekse workflows voor installatie en
updates van Skills voor gebruikers die door de registry beheerde Skill-mappen willen buiten een
volledige OpenClaw-werkruimte.

## Beveiligingsstatus

ClawHub staat open voor publiceren, maar releases blijven onderworpen aan uploadpoorten,
geautomatiseerde controles, gebruikersmeldingen en moderatoracties.

Openbare pagina's tonen scansamenvattingen wanneer die beschikbaar zijn. Content die wordt vastgehouden, verborgen
of geblokkeerd, kan verdwijnen uit openbare zoek- en installatiestromen terwijl die
zichtbaar blijft voor de eigenaar voor diagnostiek.

Zie [Beveiliging](/clawhub/security), [Beveiligingsaudits](/clawhub/security-audits),
[Moderatie en accountveiligheid](/nl/clawhub/moderation) en
[Acceptabel gebruik](/clawhub/acceptable-usage).

## API-toegang

ClawHub biedt openbare lees-API's voor ontdekking, zoeken, pakketdetails en
downloads. Catalogi van derden mogen deze API's gebruiken wanneer ze teruglinken naar de
canonieke ClawHub-vermelding, tarieflimieten respecteren en niet de indruk wekken dat er een aanbeveling is.

Zie [Openbare API](/nl/clawhub/api) en [HTTP API](/clawhub/http-api).
