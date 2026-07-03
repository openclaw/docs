---
read_when:
    - ClawHub voor het eerst gebruiken
    - Een Skill of Plugin installeren vanuit het register
    - Publiceren naar ClawHub
summary: 'Aan de slag met ClawHub: zoek, installeer, werk Skills of plugins bij en publiceer ze.'
x-i18n:
    generated_at: "2026-07-03T02:50:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Snelstart

ClawHub is een registry voor OpenClaw-skills en plugins.

Gebruik OpenClaw wanneer je dingen in OpenClaw installeert. Gebruik de `clawhub` CLI
wanneer je inlogt, publiceert, je eigen vermeldingen beheert of
registry-specifieke workflows gebruikt.

## Een skill zoeken en installeren

Zoek vanuit OpenClaw:

```bash
openclaw skills search "calendar"
```

Installeer een skill:

```bash
openclaw skills install @openclaw/demo
```

Werk geïnstalleerde skills bij:

```bash
openclaw skills update --all
```

OpenClaw legt vast waar de skill vandaan kwam, zodat latere updates via
ClawHub kunnen blijven worden opgelost.

## Een plugin zoeken en installeren

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

Headless omgevingen kunnen een API-token uit de ClawHub-webinterface gebruiken:

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

De opdracht slaat ongewijzigde inhoud over. Nieuwe skills beginnen bij `1.0.0`; latere wijzigingen
publiceren automatisch de volgende patchversie. Gebruik `--dry-run` om een voorbeeld te bekijken of
`--version` om een expliciete versie te kiezen.

Controleer vóór het publiceren de metadata in `SKILL.md`. Declareer vereiste
omgevingsvariabelen, tools en machtigingen, zodat gebruikers kunnen begrijpen wat de
skill nodig heeft voordat ze die installeren. Zie [Skill-indeling](/nl/clawhub/skill-format).

Voor repositories met meerdere skills roept de herbruikbare GitHub-workflow
`skill publish` aan voor elke directe skillmap onder `skills/`:

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

Gebruik eerst `--dry-run` om een voorbeeld te bekijken van de opgeloste pakketmetadata, compatibiliteitsvelden,
brontoeschrijving en het uploadplan zonder te publiceren.

Codeplugins moeten OpenClaw-compatibiliteitsmetadata in `package.json` bevatten,
waaronder `openclaw.compat.pluginApi` en `openclaw.build.openclawVersion`.

## Inspecteren vóór installatie

Gebruik vóór installatie de ClawHub-webpagina of CLI-detailopdrachten om
metadata, bronlinks, versies, changelogs en scanstatus te inspecteren:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Openbare vermeldingen tonen de nieuwste scanstatus. Releases die door
moderatie worden vastgehouden of geblokkeerd, kunnen verborgen zijn in zoek- en installatieoppervlakken totdat dit is opgelost.
