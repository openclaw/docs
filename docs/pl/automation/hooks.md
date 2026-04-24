---
read_when:
    - Chcesz automatyzacji opartej na zdarzeniach dla `/new`, `/reset`, `/stop` oraz zdarzeń cyklu życia agenta.
    - Chcesz tworzyć, instalować lub debugować hooki.
summary: 'Hooki: automatyzacja oparta na zdarzeniach dla poleceń i zdarzeń cyklu życia'
title: Hooki
x-i18n:
    generated_at: "2026-04-24T08:57:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6246f25272208d9a9ff2f186bcd3a463c78ea24b833f0259174d0f7f0cbea6
    source_path: automation/hooks.md
    workflow: 15
---

Hooki to małe skrypty uruchamiane, gdy coś dzieje się wewnątrz Gateway. Mogą być wykrywane z katalogów i sprawdzane za pomocą `openclaw hooks`. Gateway ładuje wewnętrzne hooki dopiero po włączeniu hooków albo skonfigurowaniu co najmniej jednego wpisu hooka, pakietu hooków, starszego handlera lub dodatkowego katalogu hooków.

W OpenClaw istnieją dwa rodzaje hooków:

- **Wewnętrzne hooki** (ta strona): działają wewnątrz Gateway, gdy uruchamiane są zdarzenia agenta, takie jak `/new`, `/reset`, `/stop` lub zdarzenia cyklu życia.
- **Webhooki**: zewnętrzne punkty końcowe HTTP, które pozwalają innym systemom wywoływać pracę w OpenClaw. Zobacz [Webhooki](/pl/automation/cron-jobs#webhooks).

Hooki mogą być także dołączane do Pluginów. `openclaw hooks list` pokazuje zarówno samodzielne hooki, jak i hooki zarządzane przez Pluginy.

## Szybki start

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Typy zdarzeń

| Zdarzenie               | Kiedy jest wywoływane                          |
| ----------------------- | ---------------------------------------------- |
| `command:new`           | Wydano polecenie `/new`                        |
| `command:reset`         | Wydano polecenie `/reset`                      |
| `command:stop`          | Wydano polecenie `/stop`                       |
| `command`               | Dowolne zdarzenie polecenia (ogólny listener)  |
| `session:compact:before`| Przed podsumowaniem historii przez Compaction  |
| `session:compact:after` | Po zakończeniu Compaction                      |
| `session:patch`         | Gdy właściwości sesji są modyfikowane          |
| `agent:bootstrap`       | Przed wstrzyknięciem plików bootstrap workspace |
| `gateway:startup`       | Po uruchomieniu kanałów i załadowaniu hooków   |
| `message:received`      | Wiadomość przychodząca z dowolnego kanału      |
| `message:transcribed`   | Po zakończeniu transkrypcji audio              |
| `message:preprocessed`  | Po zakończeniu analizy wszystkich mediów i linków |
| `message:sent`          | Wiadomość wychodząca dostarczona               |

## Pisanie hooków

### Struktura hooka

Każdy hook to katalog zawierający dwa pliki:

```text
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### Format HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Pola metadanych** (`metadata.openclaw`):

| Pole       | Opis                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji wyświetlane w CLI                              |
| `events`   | Tablica zdarzeń do nasłuchiwania                     |
| `export`   | Nazwany export do użycia (domyślnie `"default"`)     |
| `os`       | Wymagane platformy (np. `["darwin", "linux"]`)       |
| `requires` | Wymagane `bins`, `anyBins`, `env` lub ścieżki `config` |
| `always`   | Pomija sprawdzanie kwalifikowalności (boolean)       |
| `install`  | Metody instalacji                                    |

### Implementacja handlera

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Każde zdarzenie zawiera: `type`, `action`, `sessionKey`, `timestamp`, `messages` (dodaj przez push, aby wysłać do użytkownika) oraz `context` (dane specyficzne dla zdarzenia). Konteksty hooków Pluginów agenta i narzędzi mogą również zawierać `trace`, kontekst śledzenia diagnostycznego tylko do odczytu zgodny z W3C, który Pluginy mogą przekazywać do ustrukturyzowanych logów w celu korelacji OTEL.

### Najważniejsze elementy kontekstu zdarzeń

**Zdarzenia poleceń** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Zdarzenia wiadomości** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dane specyficzne dla dostawcy, w tym `senderId`, `senderName`, `guildId`).

**Zdarzenia wiadomości** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Zdarzenia wiadomości** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Zdarzenia wiadomości** (`message:preprocessed`): `context.bodyForAgent` (ostateczna wzbogacona treść), `context.from`, `context.channelId`.

**Zdarzenia bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (modyfikowalna tablica), `context.agentId`.

**Zdarzenia patch sesji** (`session:patch`): `context.sessionEntry`, `context.patch` (tylko zmienione pola), `context.cfg`. Tylko uprzywilejowani klienci mogą wywoływać zdarzenia patch.

**Zdarzenia Compaction**: `session:compact:before` zawiera `messageCount`, `tokenCount`. `session:compact:after` dodatkowo zawiera `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Wykrywanie hooków

Hooki są wykrywane z tych katalogów, w kolejności rosnącego priorytetu nadpisywania:

1. **Hooki dołączone**: dostarczane z OpenClaw
2. **Hooki Pluginów**: hooki dołączone do zainstalowanych Pluginów
3. **Hooki zarządzane**: `~/.openclaw/hooks/` (instalowane przez użytkownika, współdzielone między workspace'ami). Dodatkowe katalogi z `hooks.internal.load.extraDirs` mają ten sam priorytet.
4. **Hooki workspace**: `<workspace>/hooks/` (na agenta, domyślnie wyłączone, dopóki nie zostaną jawnie włączone)

Hooki workspace mogą dodawać nowe nazwy hooków, ale nie mogą nadpisywać hooków dołączonych, zarządzanych ani dostarczonych przez Pluginy o tej samej nazwie.

Gateway pomija wykrywanie wewnętrznych hooków przy starcie, dopóki wewnętrzne hooki nie zostaną skonfigurowane. Włącz dołączony lub zarządzany hook za pomocą `openclaw hooks enable <name>`, zainstaluj pakiet hooków albo ustaw `hooks.internal.enabled=true`, aby wyrazić zgodę. Gdy włączysz jeden nazwany hook, Gateway ładuje tylko handler tego hooka; `hooks.internal.enabled=true`, dodatkowe katalogi hooków i starsze handlery włączają szerokie wykrywanie.

### Pakiety hooków

Pakiety hooków to pakiety npm, które eksportują hooki przez `openclaw.hooks` w `package.json`. Instalacja:

```bash
openclaw plugins install <path-or-spec>
```

Specyfikacje npm są ograniczone wyłącznie do rejestru (nazwa pakietu + opcjonalnie dokładna wersja lub dist-tag). Specyfikacje Git/URL/file i zakresy semver są odrzucane.

## Dołączone hooki

| Hook                  | Zdarzenia                      | Co robi                                               |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Zapisuje kontekst sesji do `<workspace>/memory/`      |
| bootstrap-extra-files | `agent:bootstrap`              | Wstrzykuje dodatkowe pliki bootstrap z wzorców glob   |
| command-logger        | `command`                      | Loguje wszystkie polecenia do `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Uruchamia `BOOT.md`, gdy startuje gateway             |

Włącz dowolny dołączony hook:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Szczegóły session-memory

Wyodrębnia ostatnie 15 wiadomości użytkownika/asystenta, generuje opisowy slug nazwy pliku za pomocą LLM i zapisuje do `<workspace>/memory/YYYY-MM-DD-slug.md`. Wymaga skonfigurowania `workspace.dir`.

<a id="bootstrap-extra-files"></a>

### Konfiguracja bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Ścieżki są rozwiązywane względem workspace. Ładowane są tylko rozpoznawane bazowe nazwy plików bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Szczegóły command-logger

Loguje każde polecenie slash do `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Szczegóły boot-md

Uruchamia `BOOT.md` z aktywnego workspace, gdy startuje Gateway.

## Hooki Pluginów

Pluginy mogą rejestrować hooki przez Plugin SDK, aby zapewnić głębszą integrację: przechwytywanie wywołań narzędzi, modyfikowanie promptów, kontrolowanie przepływu wiadomości i nie tylko. Plugin SDK udostępnia 28 hooków obejmujących rozwiązywanie modeli, cykl życia agenta, przepływ wiadomości, wykonywanie narzędzi, koordynację subagentów i cykl życia Gateway.

Pełne odniesienie do hooków Pluginów, w tym `before_tool_call`, `before_agent_reply`, `before_install` oraz wszystkich pozostałych hooków Pluginów, znajdziesz w [Architekturze Pluginów](/pl/plugins/architecture-internals#provider-runtime-hooks).

## Konfiguracja

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Zmienne środowiskowe dla poszczególnych hooków:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Dodatkowe katalogi hooków:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
Starszy format konfiguracji tablicy `hooks.internal.handlers` jest nadal obsługiwany dla zachowania kompatybilności wstecznej, ale nowe hooki powinny korzystać z systemu opartego na wykrywaniu.
</Note>

## Dokumentacja CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Dobre praktyki

- **Dbaj o szybkość handlerów.** Hooki działają podczas przetwarzania poleceń. Uruchamiaj ciężkie zadania w tle metodą fire-and-forget za pomocą `void processInBackground(event)`.
- **Obsługuj błędy w sposób bezpieczny.** Obejmuj ryzykowne operacje blokami try/catch; nie rzucaj wyjątków, aby inne handlery mogły działać dalej.
- **Filtruj zdarzenia wcześnie.** Zwracaj od razu, jeśli typ/akcja zdarzenia nie jest istotny.
- **Używaj konkretnych kluczy zdarzeń.** Preferuj `"events": ["command:new"]` zamiast `"events": ["command"]`, aby zmniejszyć narzut.

## Rozwiązywanie problemów

### Hook nie został wykryty

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook nie kwalifikuje się

```bash
openclaw hooks info my-hook
```

Sprawdź brakujące pliki wykonywalne (PATH), zmienne środowiskowe, wartości konfiguracji lub zgodność z systemem operacyjnym.

### Hook nie jest wykonywany

1. Sprawdź, czy hook jest włączony: `openclaw hooks list`
2. Uruchom ponownie proces gateway, aby hooki zostały przeładowane.
3. Sprawdź logi gateway: `./scripts/clawlog.sh | grep hook`

## Powiązane

- [Dokumentacja CLI: hooks](/pl/cli/hooks)
- [Webhooki](/pl/automation/cron-jobs#webhooks)
- [Architektura Pluginów](/pl/plugins/architecture-internals#provider-runtime-hooks) — pełne odniesienie do hooków Pluginów
- [Konfiguracja](/pl/gateway/configuration-reference#hooks)
