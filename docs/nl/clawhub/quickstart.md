---
read_when:
    - ClawHub voor het eerst gebruiken
    - Een skill of plugin uit het register installeren
    - Publiceren op ClawHub
summary: 'Ga aan de slag met ClawHub: zoek, installeer, werk Skills of Plugins bij en publiceer ze.'
x-i18n:
    generated_at: "2026-07-12T08:40:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Snelstart

ClawHub is een register voor OpenClaw Skills en Plugins.

Gebruik OpenClaw wanneer u onderdelen in OpenClaw installeert. Gebruik de `clawhub`-CLI
wanneer u zich aanmeldt, publiceert, uw eigen vermeldingen beheert of
registerspecifieke werkstromen gebruikt.

## Een Skill zoeken en installeren

Zoek vanuit OpenClaw:

```bash
openclaw skills search "calendar"
```

Installeer een Skill:

```bash
openclaw skills install @openclaw/demo
```

Werk geïnstalleerde Skills bij:

```bash
openclaw skills update --all
```

OpenClaw registreert waar de Skill vandaan kwam, zodat latere updates deze
via ClawHub kunnen blijven vinden.

## Een Plugin zoeken en installeren

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

Gebruik het voorvoegsel `clawhub:` wanneer u wilt dat OpenClaw het pakket via
ClawHub vindt in plaats van via npm of een andere bron.

## Aanmelden om te publiceren

Installeer de ClawHub-CLI:

```bash
npm i -g clawhub
# of
pnpm add -g clawhub
```

Meld u aan met GitHub:

```bash
clawhub login
clawhub whoami
```

Omgevingen zonder grafische interface kunnen een API-token uit de ClawHub-webinterface gebruiken:

```bash
clawhub login --token clh_...
```

## Een Skill publiceren

Een Skill is een map met een verplicht bestand `SKILL.md` en optionele
ondersteunende bestanden.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

De opdracht slaat ongewijzigde inhoud over. Nieuwe Skills beginnen bij `1.0.0`;
bij latere wijzigingen wordt automatisch de volgende patchversie gepubliceerd.
Gebruik `--dry-run` voor een voorbeeldweergave of `--version` om expliciet een versie te kiezen.

Controleer vóór publicatie de metagegevens in `SKILL.md`. Declareer vereiste
omgevingsvariabelen, hulpmiddelen en machtigingen, zodat gebruikers vóór de
installatie kunnen begrijpen wat de Skill nodig heeft. Zie [Skill-indeling](/nl/clawhub/skill-format).

Voor opslagplaatsen met meerdere Skills roept de herbruikbare GitHub-werkstroom
`skill publish` aan voor elke directe Skill-map onder `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Een Plugin publiceren

Publiceer een Plugin vanuit een lokale map, een GitHub-opslagplaats, een
GitHub-referentie of een bestaand archief:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Gebruik eerst `--dry-run` om vóór publicatie een voorbeeld te bekijken van de
vastgestelde pakketmetagegevens, compatibiliteitsvelden, bronvermelding en het uploadplan.

Code-Plugins moeten OpenClaw-compatibiliteitsmetagegevens bevatten in `package.json`,
waaronder `openclaw.compat.pluginApi` en `openclaw.build.openclawVersion`.

## Inspecteren vóór installatie

Gebruik vóór de installatie de ClawHub-webpagina of de detailopdrachten van de CLI
om metagegevens, bronlinks, versies, wijzigingslogboeken en de scanstatus te inspecteren:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Openbare vermeldingen tonen de meest recente scanstatus. Releases die door
moderatie zijn tegengehouden of geblokkeerd, kunnen voor zoek- en installatie-
interfaces verborgen blijven totdat het probleem is opgelost.
