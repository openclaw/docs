---
read_when:
    - Inzicht in vermeldingen, versies, installaties, publicatie en moderatie
summary: Hoe ClawHub-vermeldingen, versies, installaties, publicaties, scans en updates werken.
x-i18n:
    generated_at: "2026-07-16T15:16:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Hoe ClawHub werkt

ClawHub is de registerlaag voor OpenClaw-skills en -plugins. Het biedt gebruikers
een plek om pakketten te ontdekken, uitgevers een plek om versies uit te brengen
en OpenClaw voldoende metadata om die pakketten veilig te installeren en bij te werken.

## Registerrecords

Elke openbare vermelding is een registerrecord met:

- een eigenaar en slug of pakketnaam
- een of meer gepubliceerde versies
- metadata, samenvatting, bestanden en bronvermelding
- changelog- en taginformatie, zoals `latest`
- signalen voor downloads, installaties en sterren
- status van beveiligingsscans en moderatie

De vermeldingspagina is de officiële plek waar gebruikers kunnen controleren wat
een skill of plugin beweert te doen voordat ze deze installeren.

## Skills

Een skill is een tekstbundel met versiebeheer die is opgebouwd rond `SKILL.md`.
Deze kan ondersteunende bestanden, voorbeelden, sjablonen en scripts bevatten.

ClawHub leest de frontmatter van `SKILL.md` om inzicht te krijgen in de naam,
beschrijving, vereisten, omgevingsvariabelen en metadata van de skill. Nauwkeurige
metadata is belangrijk, omdat deze gebruikers helpt beslissen of ze de skill willen
installeren en geautomatiseerde scans helpt afwijkingen tussen opgegeven en
waargenomen gedrag te detecteren.

Zie [Skill-indeling](/nl/clawhub/skill-format).

## Plugins

Plugins zijn verpakte OpenClaw-uitbreidingen. ClawHub bewaart pakketmetadata,
compatibiliteitsinformatie, bronlinks, artefacten en versierecords.

Wanneer OpenClaw een plugin vanuit ClawHub installeert, controleert het vóór de
installatie de opgegeven compatibiliteitsmetadata. Pakketrecords kunnen informatie
bevatten over API-compatibiliteit, de minimale Gateway-versie, doelhosts,
omgevingsvereisten en artefact-digests.

Gebruik een expliciete ClawHub-installatiebron als je wilt dat het register de
enige gezaghebbende bron is:

```bash
openclaw plugins install clawhub:<package>
```

## Publiceren

Bij publicatie wordt een nieuw onveranderlijk versierecord aangemaakt. Uitgevers
gebruiken de CLI `clawhub` voor geverifieerde registerworkflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik proefuitvoeringen om vóór het uploaden een voorbeeld van de samengestelde
payload te bekijken. Openbare pagina's tonen vervolgens de gepubliceerde metadata,
bestanden, bronvermelding en scanstatus.

## Installaties en updates

De installatieopdrachten van OpenClaw gebruiken ClawHub als pakketbron:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registreert metadata over de installatiebron, zodat updates later hetzelfde
registerpakket kunnen vinden. De ClawHub-CLI ondersteunt ook workflows om skills
rechtstreeks te installeren en bij te werken voor gebruikers die door het register
beheerde skillmappen buiten een volledige OpenClaw-werkruimte willen gebruiken.

## Beveiligingsstatus

Publiceren op ClawHub is vrij toegankelijk, maar releases zijn nog steeds onderworpen
aan uploadcontroles, geautomatiseerde controles, gebruikersmeldingen en maatregelen
van moderators.

Openbare pagina's tonen scansamenvattingen wanneer die beschikbaar zijn. Inhoud die
wordt vastgehouden, verborgen of geblokkeerd, kan uit openbare zoekresultaten en
installatieworkflows verdwijnen, terwijl deze voor diagnostische doeleinden zichtbaar
blijft voor de eigenaar.

Zie [Beveiliging](/clawhub/security), [Beveiligingsaudits](/clawhub/security-audits),
[Moderatie en accountveiligheid](/nl/clawhub/moderation) en
[Aanvaardbaar gebruik](/clawhub/acceptable-usage).

## API-toegang

ClawHub biedt openbare lees-API's voor ontdekking, zoekopdrachten, pakketdetails en
downloads. Catalogi van derden mogen deze API's gebruiken wanneer ze naar de officiële
ClawHub-vermelding verwijzen, snelheidslimieten respecteren en niet de indruk wekken
dat ze worden aanbevolen.

Zie [Openbare API](/clawhub/api) en [HTTP-API](/clawhub/http-api).
