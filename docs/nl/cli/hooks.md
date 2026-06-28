---
read_when:
    - Je wilt agenthooks beheren
    - Je wilt de beschikbaarheid van hooks controleren of werkruimtehooks inschakelen
summary: CLI-referentie voor `openclaw hooks` (agenthooks)
title: Haken
x-i18n:
    generated_at: "2026-05-06T17:53:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56dd1ef82458dde3280e2cdfb4f3835211726517416e90625d3272d128eb9e0e
    source_path: cli/hooks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw hooks`

Beheer agenthooks (eventgestuurde automatiseringen voor opdrachten zoals `/new`, `/reset` en het starten van de Gateway).

Het uitvoeren van `openclaw hooks` zonder subopdracht is gelijk aan `openclaw hooks list`.

Gerelateerd:

- Hooks: [Hooks](/nl/automation/hooks)
- Plugin-hooks: [Plugin-hooks](/nl/plugins/hooks)

## Alle hooks weergeven

```bash
openclaw hooks list
```

Geef alle gevonden hooks weer uit workspace-, beheerde, extra en gebundelde mappen.
Bij het starten van de Gateway worden interne hookhandlers pas geladen zodra er ten minste één interne hook is geconfigureerd.

**Opties:**

- `--eligible`: Alleen geschikte hooks tonen (vereisten voldaan)
- `--json`: Uitvoer als JSON
- `-v, --verbose`: Gedetailleerde informatie tonen, inclusief ontbrekende vereisten

**Voorbeelduitvoer:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Voorbeeld (uitgebreid):**

```bash
openclaw hooks list --verbose
```

Toont ontbrekende vereisten voor ongeschikte hooks.

**Voorbeeld (JSON):**

```bash
openclaw hooks list --json
```

Geeft gestructureerde JSON terug voor programmatisch gebruik.

## Hookinformatie ophalen

```bash
openclaw hooks info <name>
```

Toon gedetailleerde informatie over een specifieke hook.

**Argumenten:**

- `<name>`: Hooknaam of hooksleutel (bijv. `session-memory`)

**Opties:**

- `--json`: Uitvoer als JSON

**Voorbeeld:**

```bash
openclaw hooks info session-memory
```

**Uitvoer:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Geschiktheid van hooks controleren

```bash
openclaw hooks check
```

Toon een samenvatting van de geschiktheidsstatus van hooks (hoeveel er klaar zijn tegenover niet klaar).

**Opties:**

- `--json`: Uitvoer als JSON

**Voorbeelduitvoer:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Een hook inschakelen

```bash
openclaw hooks enable <name>
```

Schakel een specifieke hook in door deze toe te voegen aan je configuratie (standaard `~/.openclaw/openclaw.json`).

**Opmerking:** Workspace-hooks zijn standaard uitgeschakeld totdat ze hier of in de configuratie worden ingeschakeld. Hooks die door plugins worden beheerd tonen `plugin:<id>` in `openclaw hooks list` en kunnen hier niet worden in- of uitgeschakeld. Schakel in plaats daarvan de plugin in of uit.

**Argumenten:**

- `<name>`: Hooknaam (bijv. `session-memory`)

**Voorbeeld:**

```bash
openclaw hooks enable session-memory
```

**Uitvoer:**

```
✓ Enabled hook: 💾 session-memory
```

**Wat dit doet:**

- Controleert of de hook bestaat en geschikt is
- Werkt `hooks.internal.entries.<name>.enabled = true` bij in je configuratie
- Slaat de configuratie op schijf op

Als de hook afkomstig is uit `<workspace>/hooks/`, is deze opt-instap vereist voordat
de Gateway deze laadt.

**Na inschakelen:**

- Start de Gateway opnieuw zodat hooks opnieuw worden geladen (herstart de menubalk-app op macOS, of start je Gateway-proces opnieuw in dev).

## Een hook uitschakelen

```bash
openclaw hooks disable <name>
```

Schakel een specifieke hook uit door je configuratie bij te werken.

**Argumenten:**

- `<name>`: Hooknaam (bijv. `command-logger`)

**Voorbeeld:**

```bash
openclaw hooks disable command-logger
```

**Uitvoer:**

```
⏸ Disabled hook: 📝 command-logger
```

**Na uitschakelen:**

- Start de Gateway opnieuw zodat hooks opnieuw worden geladen

## Opmerkingen

- `openclaw hooks list --json`, `info --json` en `check --json` schrijven gestructureerde JSON rechtstreeks naar stdout.
- Door plugins beheerde hooks kunnen hier niet worden in- of uitgeschakeld; schakel in plaats daarvan de eigenaar-plugin in of uit.

## Hookpakketten installeren

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Installeer hookpakketten via het uniforme installatieprogramma voor plugins.

`openclaw hooks install` werkt nog steeds als compatibiliteitsalias, maar drukt een
verouderingswaarschuwing af en stuurt door naar `openclaw plugins install`.

Npm-specificaties zijn **alleen registry** (pakketnaam + optionele **exacte versie** of
**dist-tag**). Git-/URL-/bestandsspecificaties en semver-bereiken worden geweigerd. Dependency-
installaties worden projectlokaal uitgevoerd met `--ignore-scripts` voor veiligheid, zelfs wanneer je
shell globale npm-installatie-instellingen heeft.

Kale specificaties en `@latest` blijven op het stabiele spoor. Als npm een van
deze naar een prerelease herleidt, stopt OpenClaw en vraagt het je expliciet in te stemmen met een
prerelease-tag zoals `@beta`/`@rc` of een exacte prereleaseversie.

**Wat dit doet:**

- Kopieert het hookpakket naar `~/.openclaw/hooks/<id>`
- Schakelt de geïnstalleerde hooks in `hooks.internal.entries.*` in
- Registreert de installatie onder `hooks.internal.installs`

**Opties:**

- `-l, --link`: Link een lokale map in plaats van te kopiëren (voegt deze toe aan `hooks.internal.load.extraDirs`)
- `--pin`: Registreer npm-installaties als exact herleid `name@version` in `hooks.internal.installs`

**Ondersteunde archieven:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Voorbeelden:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

Gelinkte hookpakketten worden behandeld als beheerde hooks uit een door de operator geconfigureerde
map, niet als workspace-hooks.

## Hookpakketten bijwerken

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Werk bijgehouden npm-gebaseerde hookpakketten bij via de uniforme updater voor plugins.

`openclaw hooks update` werkt nog steeds als compatibiliteitsalias, maar drukt een
verouderingswaarschuwing af en stuurt door naar `openclaw plugins update`.

**Opties:**

- `--all`: Alle bijgehouden hookpakketten bijwerken
- `--dry-run`: Tonen wat zou veranderen zonder te schrijven

Wanneer een opgeslagen integriteitshash bestaat en de hash van het opgehaalde artefact verandert,
drukt OpenClaw een waarschuwing af en vraagt om bevestiging voordat het doorgaat. Gebruik
globaal `--yes` om prompts over te slaan in CI-/niet-interactieve uitvoeringen.

## Gebundelde hooks

### session-memory

Slaat sessiecontext op in geheugen wanneer je `/new` of `/reset` uitvoert.

**Inschakelen:**

```bash
openclaw hooks enable session-memory
```

**Uitvoer:** standaard `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md`. Stel `hooks.internal.entries.session-memory.llmSlug: true` in voor door modellen gegenereerde bestandsnaamslugs.

**Zie:** [session-memory-documentatie](/nl/automation/hooks#session-memory)

### bootstrap-extra-files

Injecteert aanvullende bootstrap-bestanden (bijvoorbeeld monorepo-lokale `AGENTS.md` / `TOOLS.md`) tijdens `agent:bootstrap`.

**Inschakelen:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Zie:** [bootstrap-extra-files-documentatie](/nl/automation/hooks#bootstrap-extra-files)

### command-logger

Logt alle opdrachtgebeurtenissen naar een gecentraliseerd auditbestand.

**Inschakelen:**

```bash
openclaw hooks enable command-logger
```

**Uitvoer:** `~/.openclaw/logs/commands.log`

**Logs bekijken:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Zie:** [command-logger-documentatie](/nl/automation/hooks#command-logger)

### boot-md

Voert `BOOT.md` uit wanneer de Gateway start (nadat kanalen zijn gestart).

**Gebeurtenissen**: `gateway:startup`

**Inschakelen**:

```bash
openclaw hooks enable boot-md
```

**Zie:** [boot-md-documentatie](/nl/automation/hooks#boot-md)

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Automatiseringshooks](/nl/automation/hooks)
