---
read_when:
    - Chcesz zarządzać hookami agentów
    - Chcesz sprawdzić dostępność hooków lub włączyć hooki workspace
summary: Dokumentacja CLI dla `openclaw hooks` (hooki agentów)
title: hooks
x-i18n:
    generated_at: "2026-04-05T13:48:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dc9144e9844e9c3cdef2514098eb170543746fcc55ca5a1cc746c12d80209e7
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Zarządzaj hookami agentów (automatyzacjami sterowanymi zdarzeniami dla poleceń takich jak `/new`, `/reset` i uruchamianie gateway).

Uruchomienie `openclaw hooks` bez podpolecenia jest równoważne `openclaw hooks list`.

Powiązane:

- Hooki: [Hooks](/pl/automation/hooks)
- Hooki pluginów: [Plugin hooks](/plugins/architecture#provider-runtime-hooks)

## Wyświetl wszystkie hooki

```bash
openclaw hooks list
```

Wyświetl wszystkie wykryte hooki z katalogów workspace, managed, extra i bundled.

**Opcje:**

- `--eligible`: pokaż tylko hooki kwalifikujące się do użycia (spełnione wymagania)
- `--json`: wyjście jako JSON
- `-v, --verbose`: pokaż szczegółowe informacje, w tym brakujące wymagania

**Przykładowe wyjście:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Przykład (verbose):**

```bash
openclaw hooks list --verbose
```

Pokazuje brakujące wymagania dla hooków, które nie kwalifikują się do użycia.

**Przykład (JSON):**

```bash
openclaw hooks list --json
```

Zwraca ustrukturyzowany JSON do użytku programistycznego.

## Pobierz informacje o hooku

```bash
openclaw hooks info <name>
```

Pokaż szczegółowe informacje o konkretnym hooku.

**Argumenty:**

- `<name>`: nazwa hooka lub klucz hooka (np. `session-memory`)

**Opcje:**

- `--json`: wyjście jako JSON

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

## Sprawdź kwalifikowalność hooków

```bash
openclaw hooks check
```

Pokaż podsumowanie statusu kwalifikowalności hooków (ile jest gotowych, a ile nie).

**Opcje:**

- `--json`: wyjście jako JSON

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

Włącz konkretny hook, dodając go do konfiguracji (domyślnie `~/.openclaw/openclaw.json`).

**Uwaga:** Hooki workspace są domyślnie wyłączone, dopóki nie zostaną tu lub w konfiguracji włączone. Hooki zarządzane przez pluginy pokazują `plugin:<id>` w `openclaw hooks list` i nie można ich tutaj włączać/wyłączać. Zamiast tego włącz/wyłącz plugin.

**Argumenty:**

- `<name>`: nazwa hooka (np. `session-memory`)

**Przykład:**

```bash
openclaw hooks enable session-memory
```

**Wyjście:**

```
✓ Enabled hook: 💾 session-memory
```

**Co to robi:**

- Sprawdza, czy hook istnieje i czy kwalifikuje się do użycia
- Aktualizuje `hooks.internal.entries.<name>.enabled = true` w konfiguracji
- Zapisuje konfigurację na dysku

Jeśli hook pochodzi z `<workspace>/hooks/`, ten krok opt-in jest wymagany, zanim
Gateway go załaduje.

**Po włączeniu:**

- Uruchom ponownie gateway, aby hooki zostały przeładowane (restart aplikacji menu bar na macOS albo restart procesu gateway w development).

## Wyłącz hook

```bash
openclaw hooks disable <name>
```

Wyłącz konkretny hook, aktualizując konfigurację.

**Argumenty:**

- `<name>`: nazwa hooka (np. `command-logger`)

**Przykład:**

```bash
openclaw hooks disable command-logger
```

**Wyjście:**

```
⏸ Disabled hook: 📝 command-logger
```

**Po wyłączeniu:**

- Uruchom ponownie gateway, aby hooki zostały przeładowane

## Uwagi

- `openclaw hooks list --json`, `info --json` i `check --json` zapisują ustrukturyzowany JSON bezpośrednio do stdout.
- Hooków zarządzanych przez pluginy nie można tutaj włączać ani wyłączać; zamiast tego włącz lub wyłącz plugin będący ich właścicielem.

## Instalowanie pakietów hooków

```bash
openclaw plugins install <package>        # najpierw ClawHub, potem npm
openclaw plugins install <package> --pin  # przypnij wersję
openclaw plugins install <path>           # ścieżka lokalna
```

Instaluj pakiety hooków przez zunifikowany instalator pluginów.

`openclaw hooks install` nadal działa jako alias zgodności, ale wyświetla
ostrzeżenie o wycofaniu i przekazuje wywołanie do `openclaw plugins install`.

Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** lub
**dist-tag**). Specyfikacje Git/URL/file i zakresy semver są odrzucane. Instalacje
zależności są uruchamiane z `--ignore-scripts` dla bezpieczeństwa.

Specyfikacje bez wersji i `@latest` pozostają na stabilnej ścieżce. Jeśli npm
rozwiąże którykolwiek z nich do wersji prerelease, OpenClaw zatrzyma się i poprosi
o jawne opt-in z użyciem tagu prerelease, takiego jak `@beta`/`@rc`, lub dokładnej wersji prerelease.

**Co to robi:**

- Kopiuje pakiet hooków do `~/.openclaw/hooks/<id>`
- Włącza zainstalowane hooki w `hooks.internal.entries.*`
- Rejestruje instalację w `hooks.internal.installs`

**Opcje:**

- `-l, --link`: podlinkuj lokalny katalog zamiast kopiować (dodaje go do `hooks.internal.load.extraDirs`)
- `--pin`: zapisuje instalacje npm jako dokładnie rozwiązaną wartość `name@version` w `hooks.internal.installs`

**Obsługiwane archiwa:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Przykłady:**

```bash
# Katalog lokalny
openclaw plugins install ./my-hook-pack

# Archiwum lokalne
openclaw plugins install ./my-hook-pack.zip

# Pakiet NPM
openclaw plugins install @openclaw/my-hook-pack

# Podlinkuj lokalny katalog bez kopiowania
openclaw plugins install -l ./my-hook-pack
```

Podlinkowane pakiety hooków są traktowane jako hooki managed z katalogu
skonfigurowanego przez operatora, a nie jako hooki workspace.

## Aktualizowanie pakietów hooków

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aktualizuj śledzone pakiety hooków oparte na npm przez zunifikowany aktualizator pluginów.

`openclaw hooks update` nadal działa jako alias zgodności, ale wyświetla
ostrzeżenie o wycofaniu i przekazuje wywołanie do `openclaw plugins update`.

**Opcje:**

- `--all`: zaktualizuj wszystkie śledzone pakiety hooków
- `--dry-run`: pokaż, co by się zmieniło, bez zapisu

Gdy istnieje zapisany hash integralności, a hash pobranego artefaktu się zmienia,
OpenClaw wyświetla ostrzeżenie i prosi o potwierdzenie przed kontynuacją. Użyj
globalnego `--yes`, aby pominąć prompty w CI/uruchomieniach nieinteraktywnych.

## Bundled hooks

### session-memory

Zapisuje kontekst sesji do pamięci, gdy wydasz `/new` lub `/reset`.

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

Rejestruje wszystkie zdarzenia poleceń do scentralizowanego pliku audytu.

**Włącz:**

```bash
openclaw hooks enable command-logger
```

**Wyjście:** `~/.openclaw/logs/commands.log`

**Wyświetl logi:**

```bash
# Ostatnie polecenia
tail -n 20 ~/.openclaw/logs/commands.log

# Sformatuj czytelnie
cat ~/.openclaw/logs/commands.log | jq .

# Filtruj według akcji
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Zobacz:** [dokumentacja command-logger](/pl/automation/hooks#command-logger)

### boot-md

Uruchamia `BOOT.md` przy starcie gateway (po uruchomieniu kanałów).

**Zdarzenia**: `gateway:startup`

**Włącz**:

```bash
openclaw hooks enable boot-md
```

**Zobacz:** [dokumentacja boot-md](/pl/automation/hooks#boot-md)
