---
read_when:
    - Chcesz automatyzacji opartej na zdarzeniach dla /new, /reset, /stop oraz zdarzeń cyklu życia agenta
    - Chcesz tworzyć, instalować lub debugować hooki
summary: 'Hooki: automatyzacja sterowana zdarzeniami dla poleceń i zdarzeń cyklu życia'
title: Hooki
x-i18n:
    generated_at: "2026-04-30T09:35:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6c567ab79fbff8228d174816e9fb4613f0544ea15a99b5917190a4066af0f57
    source_path: automation/hooks.md
    workflow: 16
---

Hooki to małe skrypty uruchamiane, gdy coś dzieje się wewnątrz Gateway. Można je wykrywać z katalogów i sprawdzać poleceniem `openclaw hooks`. Gateway ładuje hooki wewnętrzne dopiero po włączeniu hooków albo skonfigurowaniu co najmniej jednego wpisu hooka, pakietu hooków, starszego handlera lub dodatkowego katalogu hooków.

W OpenClaw są dwa rodzaje hooków:

- **Hooki wewnętrzne** (ta strona): działają wewnątrz Gateway po wystąpieniu zdarzeń agenta, takich jak `/new`, `/reset`, `/stop` albo zdarzenia cyklu życia.
- **Webhooki**: zewnętrzne punkty końcowe HTTP, które pozwalają innym systemom wyzwalać pracę w OpenClaw. Zobacz [Webhooki](/pl/automation/cron-jobs#webhooks).

Hooki mogą być również pakowane wewnątrz pluginów. `openclaw hooks list` pokazuje zarówno samodzielne hooki, jak i hooki zarządzane przez pluginy.

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

| Zdarzenie                | Kiedy jest wyzwalane                                           |
| ------------------------ | -------------------------------------------------------------- |
| `command:new`            | Wydano polecenie `/new`                                        |
| `command:reset`          | Wydano polecenie `/reset`                                      |
| `command:stop`           | Wydano polecenie `/stop`                                       |
| `command`                | Dowolne zdarzenie polecenia (ogólny listener)                  |
| `session:compact:before` | Przed podsumowaniem historii przez Compaction                  |
| `session:compact:after`  | Po zakończeniu Compaction                                      |
| `session:patch`          | Gdy właściwości sesji zostaną zmodyfikowane                    |
| `agent:bootstrap`        | Przed wstrzyknięciem plików bootstrap workspace                |
| `gateway:startup`        | Po uruchomieniu kanałów i załadowaniu hooków                   |
| `gateway:shutdown`       | Gdy rozpoczyna się wyłączanie gateway                          |
| `gateway:pre-restart`    | Przed oczekiwanym ponownym uruchomieniem gateway               |
| `message:received`       | Wiadomość przychodząca z dowolnego kanału                      |
| `message:transcribed`    | Po zakończeniu transkrypcji audio                              |
| `message:preprocessed`   | Po zakończeniu lub pominięciu wstępnego przetwarzania mediów i linków |
| `message:sent`           | Wiadomość wychodząca dostarczona                               |

## Pisanie hooków

### Struktura hooka

Każdy hook jest katalogiem zawierającym dwa pliki:

```
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

| Pole       | Opis                                                  |
| ---------- | ----------------------------------------------------- |
| `emoji`    | Emoji wyświetlane w CLI                               |
| `events`   | Tablica zdarzeń do nasłuchiwania                      |
| `export`   | Nazwany eksport do użycia (domyślnie `"default"`)     |
| `os`       | Wymagane platformy (np. `["darwin", "linux"]`)        |
| `requires` | Wymagane ścieżki `bins`, `anyBins`, `env` lub `config` |
| `always`   | Pominięcie kontroli kwalifikowalności (boolean)       |
| `install`  | Metody instalacji                                     |

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

Każde zdarzenie zawiera: `type`, `action`, `sessionKey`, `timestamp`, `messages` (dodaj przez push, aby wysłać do użytkownika) oraz `context` (dane specyficzne dla zdarzenia). Konteksty hooków agentów i pluginów narzędzi mogą też zawierać `trace`, tylko do odczytu kontekst śladu diagnostycznego zgodny z W3C, który pluginy mogą przekazywać do logów strukturalnych w celu korelacji OTEL.

### Najważniejsze informacje o kontekście zdarzeń

**Zdarzenia poleceń** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Zdarzenia wiadomości** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dane specyficzne dla dostawcy, w tym `senderId`, `senderName`, `guildId`).

**Zdarzenia wiadomości** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Zdarzenia wiadomości** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Zdarzenia wiadomości** (`message:preprocessed`): `context.bodyForAgent` (końcowa wzbogacona treść), `context.from`, `context.channelId`.

**Zdarzenia bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (mutowalna tablica), `context.agentId`.

**Zdarzenia łatania sesji** (`session:patch`): `context.sessionEntry`, `context.patch` (tylko zmienione pola), `context.cfg`. Tylko uprzywilejowani klienci mogą wyzwalać zdarzenia łatania.

**Zdarzenia Compaction**: `session:compact:before` zawiera `messageCount`, `tokenCount`. `session:compact:after` dodaje `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` obserwuje wydanie przez użytkownika `/stop`; jest to cykl życia anulowania/polecenia, a nie bramka finalizacji agenta. Pluginy, które muszą sprawdzić naturalną odpowiedź końcową i poprosić agenta o jeszcze jedno przejście, powinny zamiast tego użyć typowanego hooka pluginu `before_agent_finalize`. Zobacz [Hooki Plugin](/pl/plugins/hooks).

**Zdarzenia cyklu życia Gateway**: `gateway:shutdown` zawiera `reason` i `restartExpectedMs` oraz jest wyzwalane, gdy rozpoczyna się wyłączanie gateway. `gateway:pre-restart` zawiera ten sam kontekst, ale jest wyzwalane tylko wtedy, gdy wyłączenie jest częścią oczekiwanego restartu i podano skończoną wartość `restartExpectedMs`. Podczas wyłączania oczekiwanie na każdy hook cyklu życia jest najlepszym możliwym staraniem i ma ograniczony czas, więc wyłączanie jest kontynuowane, jeśli handler się zawiesi.

## Wykrywanie hooków

Hooki są wykrywane z tych katalogów, w kolejności rosnącego priorytetu nadpisywania:

1. **Wbudowane hooki**: dostarczane z OpenClaw
2. **Hooki pluginów**: hooki pakowane wewnątrz zainstalowanych pluginów
3. **Zarządzane hooki**: `~/.openclaw/hooks/` (zainstalowane przez użytkownika, współdzielone między workspace). Dodatkowe katalogi z `hooks.internal.load.extraDirs` mają ten sam priorytet.
4. **Hooki workspace**: `<workspace>/hooks/` (na agenta, domyślnie wyłączone do czasu jawnego włączenia)

Hooki workspace mogą dodawać nowe nazwy hooków, ale nie mogą nadpisywać hooków wbudowanych, zarządzanych ani dostarczanych przez pluginy o tej samej nazwie.

Gateway pomija wykrywanie hooków wewnętrznych przy uruchamianiu, dopóki hooki wewnętrzne nie zostaną skonfigurowane. Włącz wbudowany lub zarządzany hook poleceniem `openclaw hooks enable <name>`, zainstaluj pakiet hooków albo ustaw `hooks.internal.enabled=true`, aby wyrazić zgodę. Po włączeniu jednego nazwanego hooka Gateway ładuje tylko handler tego hooka; `hooks.internal.enabled=true`, dodatkowe katalogi hooków i starsze handlery włączają szerokie wykrywanie.

### Pakiety hooków

Pakiety hooków to pakiety npm, które eksportują hooki przez `openclaw.hooks` w `package.json`. Zainstaluj za pomocą:

```bash
openclaw plugins install <path-or-spec>
```

Specyfikacje npm są wyłącznie rejestrowe (nazwa pakietu + opcjonalna dokładna wersja lub dist-tag). Specyfikacje Git/URL/file oraz zakresy semver są odrzucane.

## Wbudowane hooki

| Hook                  | Zdarzenia                      | Co robi                                               |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Zapisuje kontekst sesji do `<workspace>/memory/`      |
| bootstrap-extra-files | `agent:bootstrap`              | Wstrzykuje dodatkowe pliki bootstrap z wzorców glob   |
| command-logger        | `command`                      | Zapisuje wszystkie polecenia do `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Uruchamia `BOOT.md`, gdy gateway startuje             |

Włącz dowolny wbudowany hook:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Szczegóły session-memory

Wyodrębnia ostatnie 15 wiadomości użytkownika/asystenta, generuje opisowy slug nazwy pliku przez LLM i zapisuje do `<workspace>/memory/YYYY-MM-DD-slug.md` przy użyciu lokalnej daty hosta. Wymaga skonfigurowania `workspace.dir`.

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

Ścieżki są rozwiązywane względem workspace. Ładowane są tylko rozpoznawane nazwy bazowe bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Szczegóły command-logger

Zapisuje każde polecenie ukośnikowe do `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Szczegóły boot-md

Uruchamia `BOOT.md` z aktywnego workspace, gdy gateway startuje.

## Hooki Plugin

Pluginy mogą rejestrować typowane hooki przez Plugin SDK w celu głębszej integracji: przechwytywania wywołań narzędzi, modyfikowania promptów, kontrolowania przepływu wiadomości i nie tylko. Używaj hooków pluginów, gdy potrzebujesz `before_tool_call`, `before_agent_reply`, `before_install` albo innych hooków cyklu życia działających wewnątrz procesu.

Pełną dokumentację hooków pluginów znajdziesz w [Hooki Plugin](/pl/plugins/hooks).

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
Starszy format konfiguracji w tablicy `hooks.internal.handlers` jest nadal obsługiwany dla zgodności wstecznej, ale nowe hooki powinny używać systemu opartego na wykrywaniu.
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

## Najlepsze praktyki

- **Utrzymuj handlery szybkie.** Hooki działają podczas przetwarzania poleceń. Ciężkie prace uruchamiaj w tle bez oczekiwania za pomocą `void processInBackground(event)`.
- **Obsługuj błędy z wyczuciem.** Owijaj ryzykowne operacje w try/catch; nie rzucaj błędów, aby inne handlery mogły działać.
- **Filtruj zdarzenia wcześnie.** Zwróć natychmiast, jeśli typ/akcja zdarzenia nie ma znaczenia.
- **Używaj konkretnych kluczy zdarzeń.** Preferuj `"events": ["command:new"]` zamiast `"events": ["command"]`, aby ograniczyć narzut.

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

Sprawdź brakujące pliki binarne (PATH), zmienne środowiskowe, wartości konfiguracji albo zgodność z systemem operacyjnym.

### Hook nie wykonuje się

1. Sprawdź, czy hook jest włączony: `openclaw hooks list`
2. Uruchom ponownie proces gateway, aby hooki zostały ponownie załadowane.
3. Sprawdź logi gateway: `./scripts/clawlog.sh | grep hook`

## Powiązane

- [Referencja CLI: hooki](/pl/cli/hooks)
- [Webhooki](/pl/automation/cron-jobs#webhooks)
- [Hooki Plugin](/pl/plugins/hooks) — hooki cyklu życia Plugin działające w procesie
- [Konfiguracja](/pl/gateway/configuration-reference#hooks)
