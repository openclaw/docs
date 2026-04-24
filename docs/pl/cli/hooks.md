---
read_when:
    - Chcesz zarządzać hookami agenta
    - Chcesz sprawdzić dostępność hooków lub włączyć hooki przestrzeni roboczej
summary: Odwołanie CLI dla `openclaw hooks` (hooki agenta)
title: Hooki
x-i18n:
    generated_at: "2026-04-24T09:02:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84f209e90a5679b889112fc03e22ea94f486ded9db25b5238c0366283695a5b9
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Zarządzaj hookami agenta (automatyzacjami sterowanymi zdarzeniami dla poleceń takich jak `/new`, `/reset` i uruchamianie Gateway).

Uruchomienie `openclaw hooks` bez podpolecenia jest równoważne `openclaw hooks list`.

Powiązane:

- Hooki: [Hooks](/pl/automation/hooks)
- Hooki Pluginów: [Plugin hooks](/pl/plugins/architecture-internals#provider-runtime-hooks)

## Wyświetlanie wszystkich hooków

```bash
openclaw hooks list
```

Wyświetla wszystkie wykryte hooki z katalogów workspace, managed, extra i bundled.
Uruchamianie Gateway nie ładuje wewnętrznych obsług hooków, dopóki nie zostanie skonfigurowany co najmniej jeden hook wewnętrzny.

**Opcje:**

- `--eligible`: Pokaż tylko kwalifikujące się hooki (wymagania spełnione)
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

**Przykład (verbose):**

```bash
openclaw hooks list --verbose
```

Pokazuje brakujące wymagania dla niekwalifikujących się hooków.

**Przykład (JSON):**

```bash
openclaw hooks list --json
```

Zwraca ustrukturyzowany JSON do użycia programistycznego.

## Pobieranie informacji o hooku

```bash
openclaw hooks info <name>
```

Pokazuje szczegółowe informacje o konkretnym hooku.

**Argumenty:**

- `<name>`: nazwa hooka lub klucz hooka (np. `session-memory`)

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

## Sprawdzanie kwalifikowalności hooków

```bash
openclaw hooks check
```

Pokazuje podsumowanie stanu kwalifikowalności hooków (ile jest gotowych, a ile nie).

**Opcje:**

- `--json`: Wyjście jako JSON

**Przykładowe wyjście:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Włączanie hooka

```bash
openclaw hooks enable <name>
```

Włącza określony hook przez dodanie go do konfiguracji (domyślnie `~/.openclaw/openclaw.json`).

**Uwaga:** Hooki workspace są domyślnie wyłączone, dopóki nie zostaną tutaj lub w konfiguracji włączone. Hooki zarządzane przez Pluginy pokazują `plugin:<id>` w `openclaw hooks list` i nie można ich tutaj włączać/wyłączać. Zamiast tego włącz/wyłącz Plugin.

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

- Sprawdza, czy hook istnieje i czy się kwalifikuje
- Aktualizuje `hooks.internal.entries.<name>.enabled = true` w konfiguracji
- Zapisuje konfigurację na dysku

Jeśli hook pochodzi z `<workspace>/hooks/`, ten krok świadomego włączenia jest wymagany, zanim
Gateway go załaduje.

**Po włączeniu:**

- Uruchom ponownie Gateway, aby przeładować hooki (na macOS zrestartuj aplikację paska menu albo zrestartuj proces Gateway w trybie deweloperskim).

## Wyłączanie hooka

```bash
openclaw hooks disable <name>
```

Wyłącza określony hook przez aktualizację konfiguracji.

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

- Uruchom ponownie Gateway, aby przeładować hooki

## Uwagi

- `openclaw hooks list --json`, `info --json` i `check --json` zapisują ustrukturyzowany JSON bezpośrednio na stdout.
- Hooków zarządzanych przez Pluginy nie można tutaj włączać ani wyłączać; zamiast tego włącz lub wyłącz Plugin będący właścicielem.

## Instalowanie pakietów hooków

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # przypnij wersję
openclaw plugins install <path>           # ścieżka lokalna
```

Instaluj pakiety hooków przez ujednolicony instalator Pluginów.

`openclaw hooks install` nadal działa jako alias zgodności, ale wyświetla
ostrzeżenie o wycofaniu i przekierowuje do `openclaw plugins install`.

Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalnie **dokładna wersja** lub
**dist-tag**). Specyfikacje Git/URL/pliku i zakresy semver są odrzucane. Instalacje
zależności są uruchamiane z `--ignore-scripts` dla bezpieczeństwa.

Specyfikacje bez dodatków i `@latest` pozostają na ścieżce stable. Jeśli npm rozwiąże
którekolwiek z nich do wersji prerelease, OpenClaw zatrzyma się i poprosi o jawną zgodę przez
tag prerelease, taki jak `@beta`/`@rc`, lub dokładną wersję prerelease.

**Co to robi:**

- Kopiuje pakiet hooków do `~/.openclaw/hooks/<id>`
- Włącza zainstalowane hooki w `hooks.internal.entries.*`
- Rejestruje instalację w `hooks.internal.installs`

**Opcje:**

- `-l, --link`: Podlinkuj lokalny katalog zamiast kopiować (dodaje go do `hooks.internal.load.extraDirs`)
- `--pin`: Rejestruje instalacje npm jako dokładnie rozstrzygnięte `name@version` w `hooks.internal.installs`

**Obsługiwane archiwa:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Przykłady:**

```bash
# Katalog lokalny
openclaw plugins install ./my-hook-pack

# Lokalne archiwum
openclaw plugins install ./my-hook-pack.zip

# Pakiet NPM
openclaw plugins install @openclaw/my-hook-pack

# Podlinkuj katalog lokalny bez kopiowania
openclaw plugins install -l ./my-hook-pack
```

Podlinkowane pakiety hooków są traktowane jako hooki zarządzane z katalogu
skonfigurowanego przez operatora, a nie jako hooki workspace.

## Aktualizowanie pakietów hooków

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aktualizuj śledzone pakiety hooków oparte na npm przez ujednolicony aktualizator Pluginów.

`openclaw hooks update` nadal działa jako alias zgodności, ale wyświetla
ostrzeżenie o wycofaniu i przekierowuje do `openclaw plugins update`.

**Opcje:**

- `--all`: Aktualizuje wszystkie śledzone pakiety hooków
- `--dry-run`: Pokazuje, co by się zmieniło, bez zapisywania

Gdy istnieje zapisany hash integralności i hash pobranego artefaktu się zmienia,
OpenClaw wyświetla ostrzeżenie i prosi o potwierdzenie przed kontynuowaniem. Użyj
globalnego `--yes`, aby pominąć monity w uruchomieniach CI/nieinteraktywnych.

## Hooki dołączone

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

Loguje wszystkie zdarzenia poleceń do scentralizowanego pliku audytu.

**Włącz:**

```bash
openclaw hooks enable command-logger
```

**Wyjście:** `~/.openclaw/logs/commands.log`

**Wyświetlanie logów:**

```bash
# Ostatnie polecenia
tail -n 20 ~/.openclaw/logs/commands.log

# Ładne formatowanie
cat ~/.openclaw/logs/commands.log | jq .

# Filtrowanie według akcji
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Zobacz:** [dokumentacja command-logger](/pl/automation/hooks#command-logger)

### boot-md

Uruchamia `BOOT.md` przy starcie Gateway (po uruchomieniu kanałów).

**Zdarzenia**: `gateway:startup`

**Włącz**:

```bash
openclaw hooks enable boot-md
```

**Zobacz:** [dokumentacja boot-md](/pl/automation/hooks#boot-md)

## Powiązane

- [Odwołanie CLI](/pl/cli)
- [Hooki automatyzacji](/pl/automation/hooks)
