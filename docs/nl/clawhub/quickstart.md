---
read_when:
    - Eerste keer ClawHub gebruiken
    - Een Skill of Plugin uit het register installeren
    - Publiceren naar ClawHub
summary: 'Ga aan de slag met ClawHub: zoek, installeer, werk Skills of plugins bij en publiceer ze.'
x-i18n:
    generated_at: "2026-06-28T20:42:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Snelstart

ClawHub is een register voor OpenClaw Skills en plugins.

Gebruik OpenClaw wanneer je dingen in OpenClaw installeert. Gebruik de `clawhub` CLI
wanneer je je aanmeldt, publiceert, je eigen vermeldingen beheert of
registerspecifieke workflows gebruikt.

## Een skill zoeken en installeren

Zoeken vanuit OpenClaw:

```bash
openclaw skills search "calendar"
```

Een skill installeren:

```bash
openclaw skills install @openclaw/demo
```

Geïnstalleerde Skills bijwerken:

```bash
openclaw skills update --all
```

OpenClaw registreert waar de skill vandaan kwam, zodat latere updates via
ClawHub kunnen blijven worden opgelost.

## Een plugin zoeken en installeren

Zoeken vanuit OpenClaw:

```bash
openclaw plugins search "calendar"
```

Een door ClawHub gehoste plugin installeren met een expliciete ClawHub-bron:

```bash
openclaw plugins install clawhub:<package>
```

Geïnstalleerde plugins bijwerken:

```bash
openclaw plugins update --all
```

Gebruik het voorvoegsel `clawhub:` wanneer je wilt dat OpenClaw het pakket via
ClawHub oplost in plaats van via npm of een andere bron.

## Aanmelden om te publiceren

De ClawHub CLI installeren:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Aanmelden met GitHub:

```bash
clawhub login
clawhub whoami
```

Headless omgevingen kunnen een API-token gebruiken vanuit de ClawHub-web-UI:

```bash
clawhub login --token clh_...
```

## Een skill publiceren

Een skill is een map met een vereist `SKILL.md`-bestand en optionele ondersteunende
bestanden.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

De opdracht slaat ongewijzigde inhoud over. Nieuwe Skills beginnen bij `1.0.0`; latere wijzigingen
publiceren automatisch de volgende patchversie. Gebruik `--dry-run` om een voorbeeld te bekijken of
`--version` om een expliciete versie te kiezen.

Controleer vóór het publiceren de metadata in `SKILL.md`. Declareer vereiste
omgevingsvariabelen, tools en machtigingen, zodat gebruikers kunnen begrijpen wat de
skill nodig heeft voordat ze deze installeren. Zie [Skill-indeling](/nl/clawhub/skill-format).

Voor repositories met meerdere Skills roept de herbruikbare GitHub-workflow
`skill publish` aan voor elke directe skill-map onder `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Een plugin publiceren

Publiceer een plugin vanuit een lokale map, een GitHub-repo, een GitHub-ref of een
bestaand archief:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik eerst `--dry-run` om een voorbeeld te bekijken van de opgeloste pakketmetadata, compatibiliteitsvelden, bronvermelding en het uploadplan zonder te publiceren.

Code-plugins moeten OpenClaw-compatibiliteitsmetadata in `package.json` bevatten,
waaronder `openclaw.compat.pluginApi` en `openclaw.build.openclawVersion`.

## Inspecteren vóór installatie

Gebruik vóór installatie de ClawHub-webpagina of CLI-detailopdrachten om
metadata, bronlinks, versies, changelogs en scanstatus te inspecteren:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Openbare vermeldingen tonen de nieuwste scanstatus. Releases die worden vastgehouden of geblokkeerd door
moderatie kunnen verborgen zijn voor zoek- en installatie-oppervlakken totdat dit is opgelost.
