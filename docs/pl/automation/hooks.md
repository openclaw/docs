---
read_when:
    - Chcesz automatyzacji sterowanej zdarzeniami dla /new, /reset, /stop oraz zdarzeń cyklu życia agenta
    - Chcesz tworzyć, instalować lub debugować hooki
summary: 'Hooki: automatyzacja sterowana zdarzeniami dla poleceń i zdarzeń cyklu życia'
title: Hooki
x-i18n:
    generated_at: "2026-05-03T21:27:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

Hooki to małe skrypty uruchamiane, gdy coś dzieje się wewnątrz Gateway. Można je wykrywać z katalogów i sprawdzać za pomocą `openclaw hooks`. Gateway ładuje wewnętrzne hooki dopiero po włączeniu hooków albo skonfigurowaniu co najmniej jednego wpisu hooka, pakietu hooków, starszego handlera lub dodatkowego katalogu hooków.

W OpenClaw są dwa rodzaje hooków:

- **Hooki wewnętrzne** (ta strona): działają wewnątrz Gateway, gdy wyzwalane są zdarzenia agenta, takie jak `/new`, `/reset`, `/stop` lub zdarzenia cyklu życia.
- **Webhooki**: zewnętrzne punkty końcowe HTTP, które pozwalają innym systemom wyzwalać pracę w OpenClaw. Zobacz [Webhooki](/pl/automation/cron-jobs#webhooks).

Hooki mogą też być dołączane do plugins. `openclaw hooks list` pokazuje zarówno samodzielne hooki, jak i hooki zarządzane przez plugin.

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

| Zdarzenie                | Kiedy jest wyzwalane                                      |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Wydano polecenie `/new`                                    |
| `command:reset`          | Wydano polecenie `/reset`                                  |
| `command:stop`           | Wydano polecenie `/stop`                                   |
| `command`                | Dowolne zdarzenie polecenia (ogólny nasłuchujący)          |
| `session:compact:before` | Przed podsumowaniem historii przez Compaction              |
| `session:compact:after`  | Po zakończeniu Compaction                                  |
| `session:patch`          | Gdy właściwości sesji są modyfikowane                      |
| `agent:bootstrap`        | Przed wstrzyknięciem plików bootstrapu obszaru roboczego   |
| `gateway:startup`        | Po uruchomieniu kanałów i załadowaniu hooków               |
| `gateway:shutdown`       | Gdy rozpoczyna się zamykanie Gateway                       |
| `gateway:pre-restart`    | Przed oczekiwanym restartem Gateway                        |
| `message:received`       | Wiadomość przychodząca z dowolnego kanału                  |
| `message:transcribed`    | Po zakończeniu transkrypcji audio                          |
| `message:preprocessed`   | Po zakończeniu lub pominięciu wstępnego przetwarzania multimediów i linków |
| `message:sent`           | Wiadomość wychodząca dostarczona                           |

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

| Pole       | Opis                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji wyświetlane w CLI                              |
| `events`   | Tablica zdarzeń do nasłuchiwania                     |
| `export`   | Eksport nazwany do użycia (domyślnie `"default"`)    |
| `os`       | Wymagane platformy (np. `["darwin", "linux"]`)       |
| `requires` | Wymagane ścieżki `bins`, `anyBins`, `env` lub `config` |
| `always`   | Pominięcie kontroli kwalifikowalności (wartość logiczna) |
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

Każde zdarzenie zawiera: `type`, `action`, `sessionKey`, `timestamp`, `messages` (dodaj przez push, aby wysłać do użytkownika) oraz `context` (dane właściwe dla zdarzenia). Konteksty hooków plugin agenta i narzędzi mogą też zawierać `trace`, tylko do odczytu, zgodny z W3C diagnostyczny kontekst śledzenia, który plugins mogą przekazywać do ustrukturyzowanych logów na potrzeby korelacji OTEL.

### Najważniejsze informacje o kontekście zdarzeń

**Zdarzenia poleceń** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Zdarzenia wiadomości** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dane specyficzne dla dostawcy, w tym `senderId`, `senderName`, `guildId`). `context.content` preferuje niepustą treść polecenia dla wiadomości przypominających polecenia, a następnie wraca do surowej treści przychodzącej i ogólnej treści; nie zawiera wzbogaceń przeznaczonych wyłącznie dla agenta, takich jak historia wątku czy podsumowania linków.

**Zdarzenia wiadomości** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Zdarzenia wiadomości** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Zdarzenia wiadomości** (`message:preprocessed`): `context.bodyForAgent` (końcowa wzbogacona treść), `context.from`, `context.channelId`.

**Zdarzenia bootstrapu** (`agent:bootstrap`): `context.bootstrapFiles` (modyfikowalna tablica), `context.agentId`.

**Zdarzenia łaty sesji** (`session:patch`): `context.sessionEntry`, `context.patch` (tylko zmienione pola), `context.cfg`. Tylko uprzywilejowani klienci mogą wyzwalać zdarzenia łaty.

**Zdarzenia Compaction**: `session:compact:before` zawiera `messageCount`, `tokenCount`. `session:compact:after` dodaje `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` obserwuje wydanie przez użytkownika `/stop`; jest to cykl życia anulowania/polecenia, a nie bramka finalizacji agenta. Plugins, które muszą sprawdzić naturalną odpowiedź końcową i poprosić agenta o jeszcze jedno przejście, powinny zamiast tego użyć typowanego hooka plugin `before_agent_finalize`. Zobacz [Hooki plugin](/pl/plugins/hooks).

**Zdarzenia cyklu życia Gateway**: `gateway:shutdown` zawiera `reason` i `restartExpectedMs` oraz jest wyzwalane, gdy rozpoczyna się zamykanie Gateway. `gateway:pre-restart` zawiera ten sam kontekst, ale jest wyzwalane tylko wtedy, gdy zamknięcie jest częścią oczekiwanego restartu i podano skończoną wartość `restartExpectedMs`. Podczas zamykania każde oczekiwanie na hook cyklu życia jest wykonywane w trybie najlepszych starań i ograniczone czasowo, aby zamykanie było kontynuowane, jeśli handler się zawiesi.

## Wykrywanie hooków

Hooki są wykrywane z tych katalogów, w kolejności rosnącego priorytetu nadpisania:

1. **Hooki wbudowane**: dostarczane z OpenClaw
2. **Hooki plugin**: hooki dołączone do zainstalowanych plugins
3. **Hooki zarządzane**: `~/.openclaw/hooks/` (zainstalowane przez użytkownika, współdzielone między obszarami roboczymi). Dodatkowe katalogi z `hooks.internal.load.extraDirs` mają ten sam priorytet.
4. **Hooki obszaru roboczego**: `<workspace>/hooks/` (dla pojedynczego agenta, domyślnie wyłączone do czasu jawnego włączenia)

Hooki obszaru roboczego mogą dodawać nowe nazwy hooków, ale nie mogą nadpisywać hooków wbudowanych, zarządzanych ani dostarczanych przez plugin o tej samej nazwie.

Gateway pomija wykrywanie wewnętrznych hooków podczas uruchamiania, dopóki wewnętrzne hooki nie zostaną skonfigurowane. Włącz wbudowany lub zarządzany hook poleceniem `openclaw hooks enable <name>`, zainstaluj pakiet hooków albo ustaw `hooks.internal.enabled=true`, aby wyrazić zgodę. Gdy włączysz jeden nazwany hook, Gateway ładuje tylko handler tego hooka; `hooks.internal.enabled=true`, dodatkowe katalogi hooków i starsze handlery włączają szerokie wykrywanie.

### Pakiety hooków

Pakiety hooków to pakiety npm, które eksportują hooki przez `openclaw.hooks` w `package.json`. Zainstaluj za pomocą:

```bash
openclaw plugins install <path-or-spec>
```

Specyfikacje npm są wyłącznie rejestrowe (nazwa pakietu + opcjonalna dokładna wersja lub dist-tag). Specyfikacje Git/URL/file i zakresy semver są odrzucane.

## Hooki wbudowane

| Hook                  | Zdarzenia                                        | Co robi                                                        |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Zapisuje kontekst sesji w `<workspace>/memory/`                |
| bootstrap-extra-files | `agent:bootstrap`                                 | Wstrzykuje dodatkowe pliki bootstrapu z wzorców glob           |
| command-logger        | `command`                                         | Loguje wszystkie polecenia do `~/.openclaw/logs/commands.log`  |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Wysyła widoczne powiadomienia na czacie, gdy Compaction sesji zaczyna się/kończy |
| boot-md               | `gateway:startup`                                 | Uruchamia `BOOT.md` podczas startu Gateway                     |

Włącz dowolny wbudowany hook:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Szczegóły session-memory

Wyodrębnia ostatnie 15 wiadomości użytkownika/asystenta, generuje opisowy slug nazwy pliku za pomocą LLM i zapisuje do `<workspace>/memory/YYYY-MM-DD-slug.md`, używając lokalnej daty hosta. Wymaga skonfigurowania `workspace.dir`.

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

Ścieżki są rozwiązywane względem obszaru roboczego. Ładowane są tylko rozpoznawane nazwy bazowe bootstrapu (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Szczegóły command-logger

Loguje każde polecenie z ukośnikiem do `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Szczegóły compaction-notifier

Wysyła krótkie komunikaty statusu do bieżącej rozmowy, gdy OpenClaw zaczyna i kończy kompaktowanie transkrypcji sesji. Dzięki temu długie tury są mniej mylące w interfejsach czatu, ponieważ użytkownik widzi, że asystent podsumowuje kontekst i będzie kontynuował po Compaction.

<a id="boot-md"></a>

### Szczegóły boot-md

Uruchamia `BOOT.md` z aktywnego obszaru roboczego podczas startu Gateway.

## Hooki plugin

Plugins mogą rejestrować typowane hooki przez Plugin SDK w celu głębszej integracji:
przechwytywania wywołań narzędzi, modyfikowania promptów, kontrolowania przepływu wiadomości i nie tylko.
Używaj hooków plugin, gdy potrzebujesz `before_tool_call`, `before_agent_reply`, `before_install` lub innych hooków cyklu życia w procesie.

Pełną dokumentację hooków plugin znajdziesz w [Hooki plugin](/pl/plugins/hooks).

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
Starszy format konfiguracji tablicy `hooks.internal.handlers` jest nadal obsługiwany dla zgodności wstecznej, ale nowe hooki powinny używać systemu opartego na wykrywaniu.
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

- **Utrzymuj szybkie działanie handlerów.** Hooki działają podczas przetwarzania poleceń. Ciężkie operacje uruchamiaj w tle bez oczekiwania na wynik za pomocą `void processInBackground(event)`.
- **Obsługuj błędy łagodnie.** Owiń ryzykowne operacje w try/catch; nie rzucaj błędów, aby inne handlery mogły działać.
- **Filtruj zdarzenia wcześnie.** Zwróć natychmiast, jeśli typ/akcja zdarzenia nie są istotne.
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

### Hook nie jest kwalifikowalny

```bash
openclaw hooks info my-hook
```

Sprawdź brakujące pliki binarne (PATH), zmienne środowiskowe, wartości konfiguracji lub zgodność z systemem operacyjnym.

### Hook się nie wykonuje

1. Sprawdź, czy hook jest włączony: `openclaw hooks list`
2. Uruchom ponownie proces gateway, aby hooki zostały ponownie załadowane.
3. Sprawdź logi gateway: `./scripts/clawlog.sh | grep hook`

## Powiązane

- [Dokumentacja CLI: hooki](/pl/cli/hooks)
- [Webhooki](/pl/automation/cron-jobs#webhooks)
- [Hooki Plugin](/pl/plugins/hooks) — hooki cyklu życia pluginu działające w procesie
- [Konfiguracja](/pl/gateway/configuration-reference#hooks)
