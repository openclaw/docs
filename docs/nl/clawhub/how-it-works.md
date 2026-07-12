---
read_when:
    - Inzicht in vermeldingen, versies, installaties, publicatie en moderatie
summary: Hoe ClawHub-vermeldingen, versies, installaties, publicaties, scans en updates werken.
x-i18n:
    generated_at: "2026-07-12T08:39:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Hoe ClawHub werkt

ClawHub is de registerlaag voor Skills en Plugins van OpenClaw. Het biedt gebruikers een plek om pakketten te ontdekken, uitgevers een plek om versies uit te brengen en OpenClaw voldoende metadata om die pakketten veilig te installeren en bij te werken.

## Registervermeldingen

Elke openbare vermelding is een registervermelding met:

- een eigenaar en slug of pakketnaam
- een of meer gepubliceerde versies
- metadata, samenvatting, bestanden en bronvermelding
- changelog- en taginformatie, zoals `latest`
- signalen voor downloads, installaties en sterren
- status van beveiligingsscans en moderatie

De vermeldingspagina is de gezaghebbende plek waar gebruikers vóór installatie kunnen controleren wat een Skill of Plugin beweert te doen.

## Skills

Een Skill is een tekstbundel met versiebeheer waarin `SKILL.md` centraal staat. Deze kan ondersteunende bestanden, voorbeelden, sjablonen en scripts bevatten.

ClawHub leest de frontmatter van `SKILL.md` om inzicht te krijgen in de naam, beschrijving, vereisten, omgevingsvariabelen en metadata van de Skill. Nauwkeurige metadata zijn belangrijk, omdat gebruikers daarmee kunnen bepalen of ze de Skill willen installeren en geautomatiseerde scans hiermee afwijkingen tussen opgegeven en waargenomen gedrag kunnen detecteren.

Zie [Skill-indeling](/clawhub/skill-format).

## Plugins

Plugins zijn verpakte uitbreidingen voor OpenClaw. ClawHub bewaart pakketmetadata, compatibiliteitsinformatie, bronlinks, artefacten en versiegegevens.

Wanneer OpenClaw een Plugin vanuit ClawHub installeert, controleert het vóór de installatie de opgegeven compatibiliteitsmetadata. Pakketvermeldingen kunnen API-compatibiliteit, een minimale Gateway-versie, doelhosts, omgevingsvereisten en artefactdigests bevatten.

Gebruik een expliciete ClawHub-installatiebron wanneer het register als gezaghebbende bron moet dienen:

```bash
openclaw plugins install clawhub:<package>
```

## Publiceren

Bij publicatie wordt een nieuwe onveranderlijke versie aangemaakt. Uitgevers gebruiken de `clawhub`-CLI voor geauthenticeerde registerworkflows:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik proefuitvoeringen om vóór het uploaden een voorbeeld van de resulterende payload te bekijken. Op de openbare pagina's worden vervolgens de gepubliceerde metadata, bestanden, bronvermelding en scanstatus getoond.

## Installaties en updates

De installatieopdrachten van OpenClaw gebruiken ClawHub als pakketbron:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registreert metadata over de installatiebron, zodat updates later hetzelfde registerpakket kunnen vinden. De ClawHub-CLI ondersteunt ook rechtstreekse workflows voor het installeren en bijwerken van Skills voor gebruikers die door het register beheerde Skill-mappen buiten een volledige OpenClaw-werkruimte willen gebruiken.

## Beveiligingsstatus

ClawHub staat open voor publicaties, maar releases blijven onderworpen aan uploadcontroles, geautomatiseerde controles, gebruikersmeldingen en maatregelen van moderators.

Openbare pagina's tonen scansamenvattingen wanneer die beschikbaar zijn. Inhoud die wordt vastgehouden, verborgen of geblokkeerd, kan uit openbare zoek- en installatieworkflows verdwijnen, terwijl deze voor diagnostiek zichtbaar blijft voor de eigenaar.

Zie [Beveiliging](/nl/clawhub/security), [Beveiligingsaudits](/clawhub/security-audits), [Moderatie en accountveiligheid](/nl/clawhub/moderation) en [Aanvaardbaar gebruik](/clawhub/acceptable-usage).

## API-toegang

ClawHub biedt openbare lees-API's voor ontdekking, zoeken, pakketdetails en downloads. Catalogi van derden mogen deze API's gebruiken wanneer ze naar de gezaghebbende ClawHub-vermelding verwijzen, snelheidslimieten respecteren en niet de indruk wekken dat ze worden aanbevolen.

Zie [Openbare API](/clawhub/api) en [HTTP-API](/clawhub/http-api).
