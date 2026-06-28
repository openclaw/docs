---
read_when:
    - Inzicht in vermeldingen, versies, installaties, publiceren en moderatie
summary: Hoe ClawHub-vermeldingen, versies, installaties, publiceren, scans en updates werken.
x-i18n:
    generated_at: "2026-06-28T05:06:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Hoe ClawHub werkt

ClawHub is de registerlaag voor OpenClaw Skills en plugins. Het geeft gebruikers een
plek om pakketten te ontdekken, uitgevers een plek om versies uit te brengen, en
OpenClaw genoeg metadata om die pakketten veilig te installeren en bij te werken.

## Registerrecords

Elke openbare vermelding is een registerrecord met:

- een eigenaar en slug of pakketnaam
- een of meer gepubliceerde versies
- metadata, samenvatting, bestanden en bronvermelding
- changelog- en taginformatie zoals `latest`
- download-, installatie- en sterrensignalen
- beveiligingsscan- en moderatiestatus

De vermeldingspagina is de canonieke plek waar gebruikers kunnen controleren wat een Skill of
plugin beweert te doen voordat ze die installeren.

## Skills

Een Skill is een geversioneerde tekstbundel rond `SKILL.md`. Deze kan
ondersteunende bestanden, voorbeelden, sjablonen en scripts bevatten.

ClawHub leest de frontmatter van `SKILL.md` om de naam, beschrijving,
vereisten, omgevingsvariabelen en metadata van de Skill te begrijpen. Nauwkeurige
metadata is belangrijk omdat die gebruikers helpt beslissen of ze de Skill willen installeren en
geautomatiseerde scans helpt verschillen te detecteren tussen verklaard en waargenomen gedrag.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugins zijn verpakte OpenClaw-extensies. ClawHub bewaart pakketmetadata,
compatibiliteitsinformatie, bronlinks, artefacten en versierecords.

Wanneer OpenClaw een plugin vanuit ClawHub installeert, controleert het de geadverteerde compatibiliteitsmetadata
voordat het installeert. Pakketrecords kunnen API-compatibiliteit,
minimale Gateway-versie, hostdoelen, omgevingsvereisten en artefact-digests
bevatten.

Gebruik een expliciete ClawHub-installatiebron wanneer je wilt dat het register de
bron van waarheid is:

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

Gebruik dry-runs om de opgeloste payload vóór upload te bekijken. Openbare pagina's tonen daarna
de gepubliceerde metadata, bestanden, bronvermelding en scanstatus.

## Installaties en updates

OpenClaw-installatieopdrachten gebruiken ClawHub als pakketbron:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registreert metadata over de installatiebron, zodat updates later hetzelfde
registerpakket kunnen oplossen. De ClawHub CLI ondersteunt ook directe installatie- en
updateworkflows voor Skills voor gebruikers die door het register beheerde Skill-mappen buiten een
volledige OpenClaw-werkruimte willen.

## Beveiligingsstatus

ClawHub staat open voor publiceren, maar releases blijven onderworpen aan uploadpoorten,
geautomatiseerde controles, gebruikersmeldingen en moderatoractie.

Openbare pagina's tonen scansamenvattingen wanneer die beschikbaar zijn. Content die wordt vastgehouden, verborgen
of geblokkeerd, kan uit openbare zoek- en installatiestromen verdwijnen terwijl deze
zichtbaar blijft voor de eigenaar voor diagnostiek.

Zie [Beveiliging](/nl/clawhub/security), [Beveiligingsaudits](/nl/clawhub/security-audits),
[Moderatie en accountveiligheid](/nl/clawhub/moderation) en
[Aanvaardbaar gebruik](/nl/clawhub/acceptable-usage).

## API-toegang

ClawHub biedt openbare lees-API's voor ontdekking, zoeken, pakketdetails en
downloads. Catalogi van derden mogen deze API's gebruiken wanneer ze teruglinken naar de
canonieke ClawHub-vermelding, snelheidslimieten respecteren en vermijden dat ze goedkeuring suggereren.

Zie [Openbare API](/nl/clawhub/api) en [HTTP-API](/nl/clawhub/http-api).
