---
read_when:
    - Eerste keer ClawHub gebruiken
    - Een skill of Plugin uit het register installeren
    - Publiceren naar ClawHub
summary: 'Ga aan de slag met ClawHub: vind, installeer, werk bij en publiceer Skills of plugins.'
x-i18n:
    generated_at: "2026-07-04T06:39:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Snelstart

ClawHub is een register voor OpenClaw-Skills en -plugins.

Gebruik OpenClaw wanneer je dingen in OpenClaw installeert. Gebruik de `clawhub`-CLI
wanneer je je aanmeldt, publiceert, je eigen vermeldingen beheert of
registerspecifieke workflows gebruikt.

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

OpenClaw registreert waar de skill vandaan kwam, zodat latere updates via
ClawHub kunnen blijven worden resolved.

## Een Plugin zoeken en installeren

Zoek vanuit OpenClaw:

```bash
openclaw plugins search "calendar"
```

Installeer een door ClawHub gehoste Plugin met een expliciete ClawHub-bron:

```bash
openclaw plugins install clawhub:<package>
```

Werk geïnstalleerde plugins bij:

```bash
openclaw plugins update --all
```

Gebruik het prefix `clawhub:` wanneer je wilt dat OpenClaw het pakket via
ClawHub resolved in plaats van via npm of een andere bron.

## Aanmelden om te publiceren

Installeer de ClawHub-CLI:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Meld je aan met GitHub:

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
publiceren automatisch de volgende patchversie. Gebruik `--dry-run` om een preview te bekijken of
`--version` om een expliciete versie te kiezen.

Controleer vóór publicatie de metadata in `SKILL.md`. Declareer vereiste
omgevingsvariabelen, tools en machtigingen zodat gebruikers kunnen begrijpen wat de
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

## Een Plugin publiceren

Publiceer een Plugin vanuit een lokale map, een GitHub-repository, een GitHub-ref of een
bestaand archief:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik eerst `--dry-run` om een preview te bekijken van de resolved pakketmetadata, compatibiliteitsvelden,
brontoeschrijving en het uploadplan zonder te publiceren.

Codeplugins moeten OpenClaw-compatibiliteitsmetadata bevatten in `package.json`,
waaronder `openclaw.compat.pluginApi` en `openclaw.build.openclawVersion`.

## Inspecteren vóór installatie

Gebruik vóór installatie de ClawHub-webpagina of CLI-detailopdrachten om
metadata, bronlinks, versies, changelogs en scanstatus te inspecteren:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Openbare vermeldingen tonen de nieuwste scanstatus. Releases die door
moderatie worden vastgehouden of geblokkeerd, kunnen verborgen zijn voor zoek- en installatieoppervlakken totdat dit is opgelost.
