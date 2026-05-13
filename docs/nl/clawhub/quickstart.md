---
read_when:
    - ClawHub voor het eerst gebruiken
    - Een Skill of Plugin installeren vanuit het register
    - Publiceren op ClawHub
summary: 'Ga aan de slag met ClawHub: zoek, installeer, werk bij en publiceer Skills of Plugins.'
x-i18n:
    generated_at: "2026-05-13T05:32:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Snelstart

ClawHub is een register voor OpenClaw-skills en -plugins.

Gebruik OpenClaw wanneer je dingen in OpenClaw installeert. Gebruik de `clawhub` CLI
wanneer je inlogt, publiceert, je eigen vermeldingen beheert of
registerspecifieke workflows gebruikt.

## Een skill vinden en installeren

Zoek vanuit OpenClaw:

```bash
openclaw skills search "calendar"
```

Installeer een skill:

```bash
openclaw skills install <skill-slug>
```

Werk geïnstalleerde skills bij:

```bash
openclaw skills update --all
```

OpenClaw registreert waar de skill vandaan kwam, zodat latere updates via
ClawHub kunnen blijven worden opgelost.

## Een plugin vinden en installeren

Zoek vanuit OpenClaw:

```bash
openclaw plugins search "calendar"
```

Installeer een door ClawHub gehoste plugin met een expliciete ClawHub-bron:

```bash
openclaw plugins install clawhub:<package>
```

Werk geïnstalleerde plugins bij:

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

## Een skill publiceren

Een skill is een map met een vereist `SKILL.md`-bestand en optionele
ondersteunende bestanden.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Controleer vóór publicatie de metadata in `SKILL.md`. Declareer vereiste
omgevingsvariabelen, tools en machtigingen, zodat gebruikers kunnen begrijpen wat de
skill nodig heeft voordat ze die installeren. Zie [Skill-indeling](/nl/clawhub/skill-format).

## Een plugin publiceren

Publiceer een plugin vanuit een lokale map, een GitHub-repo, een GitHub-ref of een
bestaand archief:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik eerst `--dry-run` om een voorbeeld te bekijken van de opgeloste pakketmetadata, compatibiliteitsvelden, bronvermelding en het uploadplan zonder te publiceren.

Code-plugins moeten OpenClaw-compatibiliteitsmetadata bevatten in `package.json`,
waaronder `openclaw.compat.pluginApi` en `openclaw.build.openclawVersion`.

## Skills synchroniseren die je onderhoudt

`sync` scant skill-mappen en publiceert nieuwe of gewijzigde skills die nog niet
zijn gesynchroniseerd.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Wanneer je bent ingelogd, kan `sync` ook een minimale installatiesnapshot versturen voor
geaggregeerde installatietellingen. Zie [Telemetrie](/nl/clawhub/telemetry) voor wat wordt gerapporteerd
en hoe je je kunt afmelden.

## Inspecteren vóór installatie

Gebruik vóór installatie de ClawHub-webpagina of CLI-detailopdrachten om
metadata, bronlinks, versies, changelogs en scanstatus te inspecteren:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Openbare vermeldingen tonen de nieuwste scanstatus. Releases die worden vastgehouden of geblokkeerd door
moderatie kunnen verborgen blijven in zoek- en installatieoppervlakken totdat dit is opgelost.
