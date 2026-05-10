---
read_when:
    - Eerste keer ClawHub gebruiken
    - Een Skill of Plugin installeren vanuit het register
    - Publiceren op ClawHub
summary: 'Ga aan de slag met ClawHub: vind, installeer, werk skills of plugins bij en publiceer ze.'
x-i18n:
    generated_at: "2026-05-10T19:26:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Snelstart

ClawHub is een register voor OpenClaw-Skills en plugins.

Gebruik OpenClaw wanneer je dingen in OpenClaw installeert. Gebruik de `clawhub` CLI
wanneer je inlogt, publiceert, je eigen vermeldingen beheert of
registerspecifieke workflows gebruikt.

## Een Skill zoeken en installeren

Zoek vanuit OpenClaw:

```bash
openclaw skills search "calendar"
```

Installeer een Skill:

```bash
openclaw skills install <skill-slug>
```

Werk geinstalleerde Skills bij:

```bash
openclaw skills update --all
```

OpenClaw registreert waar de Skill vandaan kwam, zodat latere updates kunnen blijven
worden opgelost via ClawHub.

## Een plugin zoeken en installeren

Zoek vanuit OpenClaw:

```bash
openclaw plugins search "calendar"
```

Installeer een door ClawHub gehoste plugin met een expliciete ClawHub-bron:

```bash
openclaw plugins install clawhub:<package>
```

Werk geinstalleerde plugins bij:

```bash
openclaw plugins update --all
```

Gebruik het voorvoegsel `clawhub:` wanneer je wilt dat OpenClaw het pakket via
ClawHub oplost in plaats van via npm of een andere bron.

## Inloggen om te publiceren

Installeer de ClawHub CLI:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Log in met GitHub:

```bash
clawhub login
clawhub whoami
```

Headless omgevingen kunnen een API-token uit de ClawHub-webinterface gebruiken:

```bash
clawhub login --token clh_...
```

## Een Skill publiceren

Een Skill is een map met een verplicht `SKILL.md`-bestand en optionele ondersteunende
bestanden.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Controleer voor het publiceren de metadata in `SKILL.md`. Declareer vereiste
omgevingsvariabelen, tools en machtigingen zodat gebruikers kunnen begrijpen wat de
Skill nodig heeft voordat ze die installeren. Zie [Skill-indeling](/nl/clawhub/skill-format).

## Een plugin publiceren

Publiceer een plugin vanuit een lokale map, een GitHub-repo, een GitHub-ref of een
bestaand archief:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik eerst `--dry-run` om een voorbeeld te bekijken van de opgeloste pakketmetadata, compatibiliteitsvelden,
brontoeschrijving en het uploadplan zonder te publiceren.

Codeplugins moeten OpenClaw-compatibiliteitsmetadata bevatten in `package.json`,
waaronder `openclaw.compat.pluginApi` en `openclaw.build.openclawVersion`.

## Skills die je onderhoudt synchroniseren

`sync` scant Skill-mappen en publiceert nieuwe of gewijzigde Skills die nog niet
gesynchroniseerd zijn.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Wanneer je bent ingelogd, kan `sync` ook een minimale installatie-snapshot verzenden voor
geaggregeerde installatietellingen. Zie [Telemetrie](/nl/clawhub/telemetry) voor wat wordt gerapporteerd
en hoe je je kunt afmelden.

## Inspecteren voor installatie

Gebruik voor installatie de ClawHub-webpagina of detailopdrachten van de CLI om
metadata, bronlinks, versies, changelogs en scanstatus te inspecteren:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Openbare vermeldingen tonen de nieuwste scanstatus. Releases die door moderatie worden vastgehouden of geblokkeerd,
kunnen verborgen zijn in zoek- en installatieoppervlakken totdat dit is opgelost.
