---
read_when:
    - Chcesz zarządzać hookami agentów
    - Chcesz sprawdzić dostępność hooków lub włączyć hooki w obszarze roboczym
summary: Referencja CLI dla `openclaw hooks` (hooki agentów)
title: Hooki
x-i18n:
    generated_at: "2026-05-05T08:25:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e860d4a20a09526e804fa1aff8c983a75396fcd1e6e24f742252fdf1812f6b7
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Zarządzaj hookami agentów (automatyzacjami sterowanymi zdarzeniami dla poleceń takich jak `/new`, `/reset` oraz uruchamiania Gateway).

Uruchomienie `openclaw hooks` bez podpolecenia jest równoważne z `openclaw hooks list`.

Powiązane:

- Hooki: [Hooki](/pl/automation/hooks)
- Hooki Plugin: [Hooki Plugin](/pl/plugins/hooks)

## Wyświetl wszystkie hooki

```bash
openclaw hooks list
```

Wyświetl wszystkie wykryte hooki z katalogów obszaru roboczego, zarządzanych, dodatkowych i dołączonych.
Uruchamianie Gateway nie ładuje wewnętrznych handlerów hooków, dopóki nie zostanie skonfigurowany co najmniej jeden wewnętrzny hook.

**Opcje:**

- `--eligible`: Pokaż tylko kwalifikujące się hooki (spełnione wymagania)
- `--json`: Wyprowadź jako JSON
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

**Przykład (szczegółowy):**

```bash
openclaw hooks list --verbose
```

Pokazuje brakujące wymagania dla niekwalifikujących się hooków.

**Przykład (JSON):**

```bash
openclaw hooks list --json
```

Zwraca ustrukturyzowany JSON do użycia programowego.

## Pobierz informacje o hooku

```bash
openclaw hooks info <name>
```

Pokaż szczegółowe informacje o konkretnym hooku.

**Argumenty:**

- `<name>`: Nazwa hooka lub klucz hooka (np. `session-memory`)

**Opcje:**

- `--json`: Wyprowadź jako JSON

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

Pokaż podsumowanie stanu kwalifikowalności hooków (ile jest gotowych, a ile niegotowych).

**Opcje:**

- `--json`: Wyprowadź jako JSON

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

**Uwaga:** Hooki obszaru roboczego są domyślnie wyłączone, dopóki nie zostaną włączone tutaj lub w konfiguracji. Hooki zarządzane przez pluginy pokazują `plugin:<id>` w `openclaw hooks list` i nie można ich tutaj włączać ani wyłączać. Zamiast tego włącz lub wyłącz plugin.

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

**Co to robi:**

- Sprawdza, czy hook istnieje i kwalifikuje się
- Aktualizuje `hooks.internal.entries.<name>.enabled = true` w twojej konfiguracji
- Zapisuje konfigurację na dysku

Jeśli hook pochodzi z `<workspace>/hooks/`, ten krok wyrażenia zgody jest wymagany, zanim
Gateway go załaduje.

**Po włączeniu:**

- Uruchom ponownie gateway, aby hooki zostały załadowane ponownie (restart aplikacji paska menu w macOS albo restart procesu gateway w trybie deweloperskim).

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

- Uruchom ponownie gateway, aby hooki zostały załadowane ponownie

## Uwagi

- `openclaw hooks list --json`, `info --json` oraz `check --json` zapisują ustrukturyzowany JSON bezpośrednio do stdout.
- Hooków zarządzanych przez pluginy nie można tutaj włączać ani wyłączać; zamiast tego włącz lub wyłącz plugin będący ich właścicielem.

## Instalowanie pakietów hooków

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Instaluj pakiety hooków przez zunifikowany instalator pluginów.

`openclaw hooks install` nadal działa jako alias zgodności, ale wyświetla
ostrzeżenie o wycofaniu i przekazuje do `openclaw plugins install`.

Specyfikacje npm są **wyłącznie rejestrowe** (nazwa pakietu + opcjonalnie **dokładna wersja** lub
**dist-tag**). Specyfikacje Git/URL/plików oraz zakresy semver są odrzucane. Instalacje zależności
działają lokalnie dla projektu z `--ignore-scripts` ze względów bezpieczeństwa, nawet jeśli twoja
powłoka ma globalne ustawienia instalacji npm.

Gołe specyfikacje i `@latest` pozostają na stabilnej ścieżce. Jeśli npm rozwiąże którąkolwiek z nich
do wydania wstępnego, OpenClaw zatrzyma się i poprosi o wyraźną zgodę z użyciem
tagu wydania wstępnego, takiego jak `@beta`/`@rc`, albo dokładnej wersji wydania wstępnego.

**Co to robi:**

- Kopiuje pakiet hooków do `~/.openclaw/hooks/<id>`
- Włącza zainstalowane hooki w `hooks.internal.entries.*`
- Rejestruje instalację w `hooks.internal.installs`

**Opcje:**

- `-l, --link`: Podlinkuj katalog lokalny zamiast go kopiować (dodaje go do `hooks.internal.load.extraDirs`)
- `--pin`: Rejestruj instalacje npm jako dokładnie rozwiązaną wartość `name@version` w `hooks.internal.installs`

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

Podlinkowane pakiety hooków są traktowane jako zarządzane hooki z katalogu
skonfigurowanego przez operatora, a nie jako hooki obszaru roboczego.

## Aktualizowanie pakietów hooków

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aktualizuj śledzone pakiety hooków oparte na npm przez zunifikowany aktualizator pluginów.

`openclaw hooks update` nadal działa jako alias zgodności, ale wyświetla
ostrzeżenie o wycofaniu i przekazuje do `openclaw plugins update`.

**Opcje:**

- `--all`: Aktualizuj wszystkie śledzone pakiety hooków
- `--dry-run`: Pokaż, co by się zmieniło, bez zapisywania

Gdy istnieje zapisany hash integralności, a hash pobranego artefaktu się zmieni,
OpenClaw wyświetla ostrzeżenie i prosi o potwierdzenie przed kontynuowaniem. Użyj
globalnego `--yes`, aby pominąć monity w CI/uruchomieniach nieinteraktywnych.

## Dołączone hooki

### session-memory

Zapisuje kontekst sesji do pamięci, gdy wydasz `/new` lub `/reset`.

**Włącz:**

```bash
openclaw hooks enable session-memory
```

**Wyjście:** domyślnie `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md`. Ustaw `hooks.internal.entries.session-memory.llmSlug: true`, aby używać slugów nazw plików generowanych przez model.

**Zobacz:** [dokumentacja session-memory](/pl/automation/hooks#session-memory)

### bootstrap-extra-files

Wstrzykuje dodatkowe pliki startowe (na przykład lokalne dla monorepo `AGENTS.md` / `TOOLS.md`) podczas `agent:bootstrap`.

**Włącz:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Zobacz:** [dokumentacja bootstrap-extra-files](/pl/automation/hooks#bootstrap-extra-files)

### command-logger

Rejestruje wszystkie zdarzenia poleceń w scentralizowanym pliku audytu.

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
