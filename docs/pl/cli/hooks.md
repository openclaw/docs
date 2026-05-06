---
read_when:
    - Chcesz zarządzać hookami agentów
    - Chcesz sprawdzić dostępność hooków lub włączyć hooki obszaru roboczego
summary: Dokumentacja referencyjna CLI dla `openclaw hooks` (hooki agentów)
title: Hooki
x-i18n:
    generated_at: "2026-05-06T17:53:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56dd1ef82458dde3280e2cdfb4f3835211726517416e90625d3272d128eb9e0e
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Zarządzaj hookami agentów (automatyzacjami sterowanymi zdarzeniami dla poleceń takich jak `/new`, `/reset` oraz uruchamianie gatewaya).

Uruchomienie `openclaw hooks` bez podpolecenia jest równoważne z `openclaw hooks list`.

Powiązane:

- Hooki: [Hooki](/pl/automation/hooks)
- Hooki Pluginów: [Hooki Pluginów](/pl/plugins/hooks)

## Wyświetl wszystkie hooki

```bash
openclaw hooks list
```

Wyświetla wszystkie wykryte hooki z katalogów workspace, zarządzanych, dodatkowych i dołączonych.
Uruchomienie Gateway nie ładuje wewnętrznych handlerów hooków, dopóki nie zostanie skonfigurowany co najmniej jeden wewnętrzny hook.

**Opcje:**

- `--eligible`: Pokaż tylko kwalifikujące się hooki (spełnione wymagania)
- `--json`: Wyjście jako JSON
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

Zwraca strukturalny JSON do użycia programowego.

## Pobierz informacje o hooku

```bash
openclaw hooks info <name>
```

Pokaż szczegółowe informacje o określonym hooku.

**Argumenty:**

- `<name>`: Nazwa hooka lub klucz hooka (np. `session-memory`)

**Opcje:**

- `--json`: Wyjście jako JSON

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

Pokaż podsumowanie statusu kwalifikowalności hooków (ile jest gotowych, a ile niegotowych).

**Opcje:**

- `--json`: Wyjście jako JSON

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

Włącz określony hook, dodając go do swojej konfiguracji (domyślnie `~/.openclaw/openclaw.json`).

**Uwaga:** Hooki workspace są domyślnie wyłączone, dopóki nie zostaną włączone tutaj albo w konfiguracji. Hooki zarządzane przez Pluginy pokazują `plugin:<id>` w `openclaw hooks list` i nie można ich tutaj włączać ani wyłączać. Zamiast tego włącz lub wyłącz Plugin.

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

- Sprawdza, czy hook istnieje i czy jest kwalifikowalny
- Aktualizuje `hooks.internal.entries.<name>.enabled = true` w Twojej konfiguracji
- Zapisuje konfigurację na dysku

Jeśli hook pochodzi z `<workspace>/hooks/`, ten krok akceptacji jest wymagany, zanim
Gateway go załaduje.

**Po włączeniu:**

- Uruchom ponownie gateway, aby hooki zostały przeładowane (restart aplikacji paska menu w macOS albo restart procesu gatewaya w trybie deweloperskim).

## Wyłącz hook

```bash
openclaw hooks disable <name>
```

Wyłącz określony hook, aktualizując swoją konfigurację.

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

- Uruchom ponownie gateway, aby hooki zostały przeładowane

## Uwagi

- `openclaw hooks list --json`, `info --json` oraz `check --json` zapisują strukturalny JSON bezpośrednio do stdout.
- Hooków zarządzanych przez Pluginy nie można tutaj włączać ani wyłączać; zamiast tego włącz lub wyłącz właścicielski Plugin.

## Zainstaluj pakiety hooków

```bash
openclaw plugins install <package>        # npm domyślnie
openclaw plugins install npm:<package>    # tylko npm
openclaw plugins install <package> --pin  # przypnij wersję
openclaw plugins install <path>           # ścieżka lokalna
```

Instaluj pakiety hooków przez ujednolicony instalator Pluginów.

`openclaw hooks install` nadal działa jako alias zgodności, ale wypisuje
ostrzeżenie o wycofaniu i przekazuje dalej do `openclaw plugins install`.

Specyfikacje npm są **tylko z rejestru** (nazwa pakietu + opcjonalna **dokładna wersja** lub
**dist-tag**). Specyfikacje Git/URL/plik i zakresy semver są odrzucane. Instalacje zależności
działają lokalnie dla projektu z `--ignore-scripts` ze względów bezpieczeństwa, nawet gdy Twoja
powłoka ma globalne ustawienia instalacji npm.

Gołe specyfikacje i `@latest` pozostają na stabilnej ścieżce. Jeśli npm rozwiąże którąkolwiek z nich
do wersji przedpremierowej, OpenClaw zatrzyma się i poprosi o jednoznaczną akceptację za pomocą
tagu przedpremierowego, takiego jak `@beta`/`@rc`, albo dokładnej wersji przedpremierowej.

**Co to robi:**

- Kopiuje pakiet hooków do `~/.openclaw/hooks/<id>`
- Włącza zainstalowane hooki w `hooks.internal.entries.*`
- Rejestruje instalację w `hooks.internal.installs`

**Opcje:**

- `-l, --link`: Połącz katalog lokalny zamiast go kopiować (dodaje go do `hooks.internal.load.extraDirs`)
- `--pin`: Zapisz instalacje npm jako dokładnie rozwiązane `name@version` w `hooks.internal.installs`

**Obsługiwane archiwa:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Przykłady:**

```bash
# Katalog lokalny
openclaw plugins install ./my-hook-pack

# Archiwum lokalne
openclaw plugins install ./my-hook-pack.zip

# Pakiet NPM
openclaw plugins install @openclaw/my-hook-pack

# Połącz katalog lokalny bez kopiowania
openclaw plugins install -l ./my-hook-pack
```

Połączone pakiety hooków są traktowane jako zarządzane hooki z katalogu
skonfigurowanego przez operatora, a nie jako hooki workspace.

## Aktualizuj pakiety hooków

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aktualizuj śledzone pakiety hooków oparte na npm przez ujednolicony aktualizator Pluginów.

`openclaw hooks update` nadal działa jako alias zgodności, ale wypisuje
ostrzeżenie o wycofaniu i przekazuje dalej do `openclaw plugins update`.

**Opcje:**

- `--all`: Aktualizuj wszystkie śledzone pakiety hooków
- `--dry-run`: Pokaż, co by się zmieniło, bez zapisywania

Gdy istnieje zapisany hash integralności i hash pobranego artefaktu się zmieni,
OpenClaw wypisuje ostrzeżenie i prosi o potwierdzenie przed kontynuowaniem. Użyj
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

Wstrzykuje dodatkowe pliki bootstrapu (na przykład lokalne dla monorepo `AGENTS.md` / `TOOLS.md`) podczas `agent:bootstrap`.

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
# Ostatnie polecenia
tail -n 20 ~/.openclaw/logs/commands.log

# Ładne formatowanie
cat ~/.openclaw/logs/commands.log | jq .

# Filtruj według akcji
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
