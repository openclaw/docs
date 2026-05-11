---
read_when:
    - Eerste keer ClawHub gebruiken
    - Een Skill of Plugin installeren vanuit het register
    - Publiceren op ClawHub
summary: 'Ga aan de slag met ClawHub: zoek, installeer, werk Skills of plugins bij en publiceer ze.'
x-i18n:
    generated_at: "2026-05-11T20:24:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Snelstart

ClawHub is een register voor OpenClaw Skills en Plugins.

Gebruik OpenClaw wanneer je dingen in OpenClaw installeert. Gebruik de `clawhub` CLI
wanneer je inlogt, publiceert, je eigen vermeldingen beheert of
registerspecifieke workflows gebruikt.

## Een Skill vinden en installeren

Zoek vanuit OpenClaw:

```bash
openclaw skills search "calendar"
```

Installeer een Skill:

```bash
openclaw skills install <skill-slug>
```

Werk geïnstalleerde Skills bij:

```bash
openclaw skills update --all
```

OpenClaw registreert waar de Skill vandaan kwam, zodat latere updates kunnen blijven
oplossen via ClawHub.

## Een Plugin vinden en installeren

Zoek vanuit OpenClaw:

```bash
openclaw plugins search "calendar"
```

Installeer een door ClawHub gehoste Plugin met een expliciete ClawHub-bron:

```bash
openclaw plugins install clawhub:<package>
```

Werk geïnstalleerde Plugins bij:

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

Headless omgevingen kunnen een API-token uit de ClawHub-web-UI gebruiken:

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

Controleer vóór het publiceren de metadata in `SKILL.md`. Declareer vereiste
omgevingsvariabelen, tools en machtigingen, zodat gebruikers kunnen begrijpen wat de
Skill nodig heeft voordat ze deze installeren. Zie [Skill-indeling](/nl/clawhub/skill-format).

## Een Plugin publiceren

Publiceer een Plugin vanuit een lokale map, een GitHub-repo, een GitHub-ref of een
bestaand archief:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik eerst `--dry-run` om een voorbeeld te bekijken van de opgeloste pakketmetadata,
compatibiliteitsvelden, bronvermelding en het uploadplan zonder te publiceren.

Code-Plugins moeten OpenClaw-compatibiliteitsmetadata bevatten in `package.json`,
waaronder `openclaw.compat.pluginApi` en `openclaw.build.openclawVersion`.

## Skills die je onderhoudt synchroniseren

`sync` scant Skill-mappen en publiceert nieuwe of gewijzigde Skills die nog niet
zijn gesynchroniseerd.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Wanneer je bent ingelogd, kan `sync` ook een minimale installatiesnapshot verzenden voor
geaggregeerde installatietellingen. Zie [Telemetrie](/nl/clawhub/telemetry) voor wat wordt gerapporteerd
en hoe je je kunt afmelden.

## Inspecteren vóór installatie

Gebruik vóór installatie de ClawHub-webpagina of CLI-detailopdrachten om
metadata, bronlinks, versies, changelogs en scanstatus te inspecteren:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Openbare vermeldingen tonen de meest recente scanstatus. Releases die door
moderatie zijn vastgehouden of geblokkeerd, kunnen verborgen zijn in zoek- en installatieoppervlakken totdat dit is opgelost.
