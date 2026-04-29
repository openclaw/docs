---
read_when:
    - Je wilt agenthooks beheren
    - Je wilt de beschikbaarheid van hooks controleren of workspace-hooks inschakelen
summary: CLI-referentie voor `openclaw hooks` (agenthaken)
title: Haakpunten
x-i18n:
    generated_at: "2026-04-29T22:32:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Beheer agenthooks (gebeurtenisgestuurde automatiseringen voor commando's zoals `/new`, `/reset` en het starten van de Gateway).

Het uitvoeren van `openclaw hooks` zonder subcommando is gelijk aan `openclaw hooks list`.

Gerelateerd:

- Hooks: [Hooks](/nl/automation/hooks)
- Plugin-hooks: [Plugin-hooks](/nl/plugins/hooks)

## Alle hooks weergeven

```bash
openclaw hooks list
```

Geef alle ontdekte hooks weer uit workspace-, beheerde, extra en gebundelde directory's.
Het starten van de Gateway laadt geen interne hook-handlers totdat ten minste één interne hook is geconfigureerd.

**Opties:**

- `--eligible`: Toon alleen geschikte hooks (vereisten voldaan)
- `--json`: Uitvoer als JSON
- `-v, --verbose`: Toon gedetailleerde informatie, inclusief ontbrekende vereisten

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

Toont ontbrekende vereisten voor niet-geschikte hooks.

**Voorbeeld (JSON):**

```bash
openclaw hooks list --json
```

Retourneert gestructureerde JSON voor programmatisch gebruik.

## Hook-informatie ophalen

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

Toon een samenvatting van de geschiktheidsstatus van hooks (hoeveel gereed zijn versus niet gereed).

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

Als de hook afkomstig is uit `<workspace>/hooks/`, is deze opt-in-stap vereist voordat
de Gateway deze laadt.

**Na inschakelen:**

- Start de Gateway opnieuw zodat hooks opnieuw worden geladen (herstart van de menubalk-app op macOS, of herstart je Gateway-proces in dev).

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

## Hook-pakketten installeren

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Installeer hook-pakketten via de uniforme plugin-installer.

`openclaw hooks install` werkt nog steeds als compatibiliteitsalias, maar drukt een
afschrijvingswaarschuwing af en stuurt door naar `openclaw plugins install`.

Npm-specificaties zijn **alleen register** (pakketnaam + optionele **exacte versie** of
**dist-tag**). Git-/URL-/bestandsspecificaties en semver-bereiken worden geweigerd. Dependency-installaties draaien project-lokaal met `--ignore-scripts` voor veiligheid, zelfs wanneer je
shell globale npm-installatie-instellingen heeft.

Kale specificaties en `@latest` blijven op het stabiele spoor. Als npm een van
die naar een prerelease oplost, stopt OpenClaw en vraagt je expliciet in te stemmen met een
prerelease-tag zoals `@beta`/`@rc` of een exacte prereleaseversie.

**Wat dit doet:**

- Kopieert het hook-pakket naar `~/.openclaw/hooks/<id>`
- Schakelt de geïnstalleerde hooks in binnen `hooks.internal.entries.*`
- Registreert de installatie onder `hooks.internal.installs`

**Opties:**

- `-l, --link`: Koppel een lokale directory in plaats van te kopiëren (voegt deze toe aan `hooks.internal.load.extraDirs`)
- `--pin`: Registreer npm-installaties als exact opgeloste `name@version` in `hooks.internal.installs`

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

Gekoppelde hook-pakketten worden behandeld als beheerde hooks uit een door de operator geconfigureerde
directory, niet als workspace-hooks.

## Hook-pakketten bijwerken

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Werk gevolgde npm-gebaseerde hook-pakketten bij via de uniforme plugin-updater.

`openclaw hooks update` werkt nog steeds als compatibiliteitsalias, maar drukt een
afschrijvingswaarschuwing af en stuurt door naar `openclaw plugins update`.

**Opties:**

- `--all`: Werk alle gevolgde hook-pakketten bij
- `--dry-run`: Toon wat zou veranderen zonder te schrijven

Wanneer een opgeslagen integriteitshash bestaat en de hash van het opgehaalde artifact verandert,
drukt OpenClaw een waarschuwing af en vraagt om bevestiging voordat wordt doorgegaan. Gebruik
globaal `--yes` om prompts te omzeilen in CI-/niet-interactieve runs.

## Gebundelde hooks

### session-memory

Slaat sessiecontext op in het geheugen wanneer je `/new` of `/reset` uitvoert.

**Inschakelen:**

```bash
openclaw hooks enable session-memory
```

**Uitvoer:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Zie:** [session-memory-documentatie](/nl/automation/hooks#session-memory)

### bootstrap-extra-files

Injecteert aanvullende bootstrap-bestanden (bijvoorbeeld monorepo-lokale `AGENTS.md` / `TOOLS.md`) tijdens `agent:bootstrap`.

**Inschakelen:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Zie:** [bootstrap-extra-files-documentatie](/nl/automation/hooks#bootstrap-extra-files)

### command-logger

Logt alle commandogebeurtenissen naar een gecentraliseerd auditbestand.

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
