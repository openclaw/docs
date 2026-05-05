---
read_when:
    - Je wilt agent-hooks beheren
    - Je wilt de beschikbaarheid van hooks inspecteren of werkruimtehooks inschakelen
summary: CLI-referentie voor `openclaw hooks` (agent-haken)
title: Haakpunten
x-i18n:
    generated_at: "2026-05-05T08:25:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e860d4a20a09526e804fa1aff8c983a75396fcd1e6e24f742252fdf1812f6b7
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Beheer agent-hooks (gebeurtenisgestuurde automatiseringen voor opdrachten zoals `/new`, `/reset` en het opstarten van de Gateway).

`openclaw hooks` uitvoeren zonder subopdracht is gelijk aan `openclaw hooks list`.

Gerelateerd:

- Hooks: [Hooks](/nl/automation/hooks)
- Plugin-hooks: [Plugin-hooks](/nl/plugins/hooks)

## Alle hooks weergeven

```bash
openclaw hooks list
```

Geef alle gevonden hooks weer uit workspace-, beheerde, extra en meegeleverde mappen.
Bij het opstarten van de Gateway worden interne hook-handlers pas geladen wanneer ten minste één interne hook is geconfigureerd.

**Opties:**

- `--eligible`: Toon alleen in aanmerking komende hooks (vereisten voldaan)
- `--json`: Voer uit als JSON
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

Toont ontbrekende vereisten voor hooks die niet in aanmerking komen.

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

- `<name>`: Hook-naam of hook-sleutel (bijv. `session-memory`)

**Opties:**

- `--json`: Voer uit als JSON

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

- `--json`: Voer uit als JSON

**Voorbeelduitvoer:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Een Hook inschakelen

```bash
openclaw hooks enable <name>
```

Schakel een specifieke hook in door deze toe te voegen aan je configuratie (standaard `~/.openclaw/openclaw.json`).

**Opmerking:** Workspace-hooks zijn standaard uitgeschakeld totdat ze hier of in de configuratie worden ingeschakeld. Hooks die door plugins worden beheerd, tonen `plugin:<id>` in `openclaw hooks list` en kunnen hier niet worden in- of uitgeschakeld. Schakel in plaats daarvan de Plugin in of uit.

**Argumenten:**

- `<name>`: Hook-naam (bijv. `session-memory`)

**Voorbeeld:**

```bash
openclaw hooks enable session-memory
```

**Uitvoer:**

```
✓ Enabled hook: 💾 session-memory
```

**Wat het doet:**

- Controleert of de hook bestaat en in aanmerking komt
- Werkt `hooks.internal.entries.<name>.enabled = true` bij in je configuratie
- Slaat de configuratie op schijf op

Als de hook afkomstig is uit `<workspace>/hooks/`, is deze opt-in-stap vereist voordat
de Gateway deze laadt.

**Na het inschakelen:**

- Start de Gateway opnieuw zodat hooks opnieuw worden geladen (menubalk-app opnieuw starten op macOS, of je Gateway-proces opnieuw starten in dev).

## Een Hook uitschakelen

```bash
openclaw hooks disable <name>
```

Schakel een specifieke hook uit door je configuratie bij te werken.

**Argumenten:**

- `<name>`: Hook-naam (bijv. `command-logger`)

**Voorbeeld:**

```bash
openclaw hooks disable command-logger
```

**Uitvoer:**

```
⏸ Disabled hook: 📝 command-logger
```

**Na het uitschakelen:**

- Start de Gateway opnieuw zodat hooks opnieuw worden geladen

## Opmerkingen

- `openclaw hooks list --json`, `info --json` en `check --json` schrijven gestructureerde JSON rechtstreeks naar stdout.
- Door plugins beheerde hooks kunnen hier niet worden in- of uitgeschakeld; schakel in plaats daarvan de eigenaar-Plugin in of uit.

## Hook-pakketten installeren

```bash
openclaw plugins install <package>        # standaard npm
openclaw plugins install npm:<package>    # alleen npm
openclaw plugins install <package> --pin  # versie vastzetten
openclaw plugins install <path>           # lokaal pad
```

Installeer hook-pakketten via de uniforme Plugin-installer.

`openclaw hooks install` werkt nog steeds als compatibiliteitsalias, maar geeft een
deprecatiewaarschuwing weer en stuurt door naar `openclaw plugins install`.

Npm-specificaties zijn **alleen registry** (pakketnaam + optionele **exacte versie** of
**dist-tag**). Git-/URL-/bestandsspecificaties en semver-bereiken worden geweigerd. Dependency-
installaties worden projectlokaal uitgevoerd met `--ignore-scripts` voor veiligheid, zelfs wanneer je
shell globale npm-installatie-instellingen heeft.

Kale specificaties en `@latest` blijven op het stabiele spoor. Als npm een van
die naar een prerelease oplost, stopt OpenClaw en vraagt je expliciet in te stemmen met een
prerelease-tag zoals `@beta`/`@rc` of een exacte prereleaseversie.

**Wat het doet:**

- Kopieert het hook-pakket naar `~/.openclaw/hooks/<id>`
- Schakelt de geïnstalleerde hooks in `hooks.internal.entries.*` in
- Registreert de installatie onder `hooks.internal.installs`

**Opties:**

- `-l, --link`: Link een lokale map in plaats van te kopiëren (voegt deze toe aan `hooks.internal.load.extraDirs`)
- `--pin`: Registreer npm-installaties als exact opgeloste `name@version` in `hooks.internal.installs`

**Ondersteunde archieven:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Voorbeelden:**

```bash
# Lokale map
openclaw plugins install ./my-hook-pack

# Lokaal archief
openclaw plugins install ./my-hook-pack.zip

# NPM-pakket
openclaw plugins install @openclaw/my-hook-pack

# Link een lokale map zonder te kopiëren
openclaw plugins install -l ./my-hook-pack
```

Gelinkte hook-pakketten worden behandeld als beheerde hooks uit een door de operator geconfigureerde
map, niet als workspace-hooks.

## Hook-pakketten bijwerken

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Werk gevolgde op npm gebaseerde hook-pakketten bij via de uniforme Plugin-updater.

`openclaw hooks update` werkt nog steeds als compatibiliteitsalias, maar geeft een
deprecatiewaarschuwing weer en stuurt door naar `openclaw plugins update`.

**Opties:**

- `--all`: Werk alle gevolgde hook-pakketten bij
- `--dry-run`: Toon wat zou veranderen zonder te schrijven

Wanneer een opgeslagen integriteitshash bestaat en de hash van het opgehaalde artefact verandert,
geeft OpenClaw een waarschuwing weer en vraagt om bevestiging voordat het doorgaat. Gebruik
globaal `--yes` om prompts in CI-/niet-interactieve runs over te slaan.

## Meegeleverde hooks

### session-memory

Slaat sessiecontext op in het geheugen wanneer je `/new` of `/reset` uitvoert.

**Inschakelen:**

```bash
openclaw hooks enable session-memory
```

**Uitvoer:** standaard `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md`. Stel `hooks.internal.entries.session-memory.llmSlug: true` in voor door het model gegenereerde bestandsnaam-slugs.

**Zie:** [documentatie voor session-memory](/nl/automation/hooks#session-memory)

### bootstrap-extra-files

Injecteert aanvullende bootstrap-bestanden (bijvoorbeeld monorepo-lokale `AGENTS.md` / `TOOLS.md`) tijdens `agent:bootstrap`.

**Inschakelen:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Zie:** [documentatie voor bootstrap-extra-files](/nl/automation/hooks#bootstrap-extra-files)

### command-logger

Logt alle opdrachtgebeurtenissen naar een gecentraliseerd auditbestand.

**Inschakelen:**

```bash
openclaw hooks enable command-logger
```

**Uitvoer:** `~/.openclaw/logs/commands.log`

**Logs bekijken:**

```bash
# Recente opdrachten
tail -n 20 ~/.openclaw/logs/commands.log

# Netjes afdrukken
cat ~/.openclaw/logs/commands.log | jq .

# Filteren op actie
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Zie:** [documentatie voor command-logger](/nl/automation/hooks#command-logger)

### boot-md

Voert `BOOT.md` uit wanneer de Gateway start (nadat kanalen starten).

**Gebeurtenissen**: `gateway:startup`

**Inschakelen**:

```bash
openclaw hooks enable boot-md
```

**Zie:** [documentatie voor boot-md](/nl/automation/hooks#boot-md)

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Automation-hooks](/nl/automation/hooks)
