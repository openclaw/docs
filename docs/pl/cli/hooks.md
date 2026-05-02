---
read_when:
    - Chcesz zarządzać hookami agentów
    - Chcesz sprawdzić dostępność hooków lub włączyć hooki obszaru roboczego
summary: Dokumentacja referencyjna CLI dla `openclaw hooks` (hooki agentów)
title: Hooki
x-i18n:
    generated_at: "2026-05-02T20:41:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b02c176b4a310adba3fa1fde3758f6c8a19d454aeec58e919458b3f1a66c87d
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Zarządzaj hookami agenta (automatyzacjami sterowanymi zdarzeniami dla poleceń takich jak `/new`, `/reset` oraz uruchamiania Gateway).

Uruchomienie `openclaw hooks` bez podpolecenia jest równoważne z `openclaw hooks list`.

Powiązane:

- Hooki: [Hooki](/pl/automation/hooks)
- Hooki Plugin: [Hooki Plugin](/pl/plugins/hooks)

## Wyświetl wszystkie hooki

```bash
openclaw hooks list
```

Wyświetla wszystkie wykryte hooki z katalogów workspace, zarządzanych, dodatkowych i dołączonych.
Uruchamianie Gateway nie ładuje wewnętrznych handlerów hooków, dopóki nie zostanie skonfigurowany co najmniej jeden wewnętrzny hook.

**Opcje:**

- `--eligible`: Pokaż tylko kwalifikujące się hooki (wymagania spełnione)
- `--json`: Wypisz jako JSON
- `-v, --verbose`: Pokaż szczegółowe informacje, w tym brakujące wymagania

**Przykładowe wyjście:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Przykład (szczegółowo):**

```bash
openclaw hooks list --verbose
```

Pokazuje brakujące wymagania dla niekwalifikujących się hooków.

**Przykład (JSON):**

```bash
openclaw hooks list --json
```

Zwraca strukturalny JSON do użycia programistycznego.

## Pobierz informacje o hooku

```bash
openclaw hooks info <name>
```

Pokaż szczegółowe informacje o konkretnym hooku.

**Argumenty:**

- `<name>`: Nazwa hooka lub klucz hooka (np. `session-memory`)

**Opcje:**

- `--json`: Wypisz jako JSON

**Przykład:**

```bash
openclaw hooks info session-memory
```

**Wyjście:**

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

## Sprawdź kwalifikowanie hooków

```bash
openclaw hooks check
```

Pokaż podsumowanie statusu kwalifikowania hooków (ile jest gotowych, a ile nie).

**Opcje:**

- `--json`: Wypisz jako JSON

**Przykładowe wyjście:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Włącz hook

```bash
openclaw hooks enable <name>
```

Włącz konkretny hook, dodając go do swojej konfiguracji (domyślnie `~/.openclaw/openclaw.json`).

**Uwaga:** Hooki workspace są domyślnie wyłączone, dopóki nie zostaną włączone tutaj albo w konfiguracji. Hooki zarządzane przez pluginy pokazują `plugin:<id>` w `openclaw hooks list` i nie można ich tutaj włączać ani wyłączać. Zamiast tego włącz lub wyłącz plugin.

**Argumenty:**

- `<name>`: Nazwa hooka (np. `session-memory`)

**Przykład:**

```bash
openclaw hooks enable session-memory
```

**Wyjście:**

```
✓ Enabled hook: 💾 session-memory
```

**Co robi:**

- Sprawdza, czy hook istnieje i jest kwalifikujący się
- Aktualizuje `hooks.internal.entries.<name>.enabled = true` w Twojej konfiguracji
- Zapisuje konfigurację na dysku

Jeśli hook pochodzi z `<workspace>/hooks/`, ten krok zgody jest wymagany, zanim
Gateway go załaduje.

**Po włączeniu:**

- Zrestartuj gateway, aby hooki zostały ponownie załadowane (restart aplikacji z paska menu na macOS albo restart procesu gateway w trybie deweloperskim).

## Wyłącz hook

```bash
openclaw hooks disable <name>
```

Wyłącz konkretny hook, aktualizując swoją konfigurację.

**Argumenty:**

- `<name>`: Nazwa hooka (np. `command-logger`)

**Przykład:**

```bash
openclaw hooks disable command-logger
```

**Wyjście:**

```
⏸ Disabled hook: 📝 command-logger
```

**Po wyłączeniu:**

- Zrestartuj gateway, aby hooki zostały ponownie załadowane

## Uwagi

- `openclaw hooks list --json`, `info --json` i `check --json` zapisują strukturalny JSON bezpośrednio do stdout.
- Hooków zarządzanych przez pluginy nie można tutaj włączać ani wyłączać; zamiast tego włącz lub wyłącz plugin, który je posiada.

## Zainstaluj pakiety hooków

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Instaluj pakiety hooków przez ujednolicony instalator pluginów.

`openclaw hooks install` nadal działa jako alias zgodności, ale wypisuje
ostrzeżenie o wycofaniu i przekazuje do `openclaw plugins install`.

Specyfikacje npm są **tylko z rejestru** (nazwa pakietu + opcjonalna **dokładna wersja** lub
**dist-tag**). Specyfikacje Git/URL/file oraz zakresy semver są odrzucane. Instalacje zależności
uruchamiają się lokalnie w projekcie z `--ignore-scripts` dla bezpieczeństwa, nawet gdy Twoja
powłoka ma globalne ustawienia instalacji npm.

Gołe specyfikacje i `@latest` pozostają na stabilnej ścieżce. Jeśli npm rozwiąże którąkolwiek z nich
do wersji przedpremierowej, OpenClaw zatrzymuje się i prosi o jawną zgodę przez tag
przedpremierowy, taki jak `@beta`/`@rc`, albo dokładną wersję przedpremierową.

**Co robi:**

- Kopiuje pakiet hooków do `~/.openclaw/hooks/<id>`
- Włącza zainstalowane hooki w `hooks.internal.entries.*`
- Zapisuje instalację w `hooks.internal.installs`

**Opcje:**

- `-l, --link`: Połącz katalog lokalny zamiast go kopiować (dodaje go do `hooks.internal.load.extraDirs`)
- `--pin`: Zapisz instalacje npm jako dokładnie rozwiązane `name@version` w `hooks.internal.installs`

**Obsługiwane archiwa:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Przykłady:**

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

Połączone pakiety hooków są traktowane jako zarządzane hooki z katalogu
skonfigurowanego przez operatora, a nie jako hooki workspace.

## Aktualizuj pakiety hooków

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aktualizuj śledzone pakiety hooków oparte na npm przez ujednolicony aktualizator pluginów.

`openclaw hooks update` nadal działa jako alias zgodności, ale wypisuje
ostrzeżenie o wycofaniu i przekazuje do `openclaw plugins update`.

**Opcje:**

- `--all`: Aktualizuj wszystkie śledzone pakiety hooków
- `--dry-run`: Pokaż, co by się zmieniło, bez zapisywania

Gdy istnieje zapisany hash integralności, a hash pobranego artefaktu się zmienia,
OpenClaw wypisuje ostrzeżenie i prosi o potwierdzenie przed kontynuowaniem. Użyj
globalnego `--yes`, aby pominąć monity w CI/uruchomieniach nieinteraktywnych.

## Dołączone hooki

### session-memory

Zapisuje kontekst sesji w pamięci, gdy wydasz `/new` lub `/reset`.

**Włącz:**

```bash
openclaw hooks enable session-memory
```

**Wyjście:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Zobacz:** [dokumentacja session-memory](/pl/automation/hooks#session-memory)

### bootstrap-extra-files

Wstrzykuje dodatkowe pliki bootstrap (na przykład lokalne dla monorepo `AGENTS.md` / `TOOLS.md`) podczas `agent:bootstrap`.

**Włącz:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Zobacz:** [dokumentacja bootstrap-extra-files](/pl/automation/hooks#bootstrap-extra-files)

### command-logger

Loguje wszystkie zdarzenia poleceń do scentralizowanego pliku audytu.

**Włącz:**

```bash
openclaw hooks enable command-logger
```

**Wyjście:** `~/.openclaw/logs/commands.log`

**Wyświetl logi:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Zobacz:** [dokumentacja command-logger](/pl/automation/hooks#command-logger)

### boot-md

Uruchamia `BOOT.md`, gdy gateway startuje (po uruchomieniu kanałów).

**Zdarzenia**: `gateway:startup`

**Włącz**:

```bash
openclaw hooks enable boot-md
```

**Zobacz:** [dokumentacja boot-md](/pl/automation/hooks#boot-md)

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Hooki automatyzacji](/pl/automation/hooks)
