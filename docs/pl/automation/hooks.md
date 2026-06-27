---
read_when:
    - Potrzebujesz automatyzacji sterowanej zdarzeniami dla /new, /reset, /stop oraz zdarzeń cyklu życia agenta
    - Chcesz tworzyć, instalować lub debugować hooki
summary: 'Hooki: automatyzacja sterowana zdarzeniami dla poleceń i zdarzeń cyklu życia'
title: Hooki
x-i18n:
    generated_at: "2026-06-27T17:09:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Hooki to małe skrypty uruchamiane, gdy coś dzieje się wewnątrz Gateway. Mogą być wykrywane z katalogów i sprawdzane za pomocą `openclaw hooks`. Gateway ładuje hooki wewnętrzne dopiero po włączeniu hooków albo skonfigurowaniu co najmniej jednego wpisu hooka, pakietu hooków, starszego handlera lub dodatkowego katalogu hooków.

W OpenClaw są dwa rodzaje hooków:

- **Hooki wewnętrzne** (ta strona): działają wewnątrz Gateway, gdy wyzwalane są zdarzenia agenta, takie jak `/new`, `/reset`, `/stop` lub zdarzenia cyklu życia.
- **Webhooks**: zewnętrzne punkty końcowe HTTP, które pozwalają innym systemom wyzwalać pracę w OpenClaw. Zobacz [Webhooks](/pl/automation/cron-jobs#webhooks).

Hooki mogą też być pakowane wewnątrz plugins. `openclaw hooks list` pokazuje zarówno samodzielne hooki, jak i hooki zarządzane przez pluginy.

## Wybierz właściwą powierzchnię

OpenClaw ma kilka powierzchni rozszerzeń, które wyglądają podobnie, ale rozwiązują różne problemy:

| Jeśli chcesz...                                                                                                           | Użyj...                                        | Dlaczego                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Zapisać migawkę przy `/new`, rejestrować `/reset`, wywołać zewnętrzne API po `message:sent` albo dodać ogólną automatyzację operatorską | Hooki wewnętrzne (`HOOK.md`, ta strona)       | Hooki oparte na plikach są przeznaczone do zarządzanych przez operatora efektów ubocznych i automatyzacji poleceń/cyklu życia |
| Przepisywać prompty, blokować narzędzia, anulować wiadomości wychodzące albo dodawać uporządkowane middleware/politykę    | Typowane hooki pluginów przez `api.on(...)`   | Typowane hooki mają jawne kontrakty, priorytety, reguły scalania oraz semantykę blokowania/anulowania      |
| Dodać eksport tylko telemetryczny lub obserwowalność                                                                       | Zdarzenia diagnostyczne                       | Obserwowalność to osobna magistrala zdarzeń, a nie powierzchnia hooków polityki                            |

Używaj hooków wewnętrznych, gdy chcesz automatyzacji zachowującej się jak mała zainstalowana integracja. Używaj typowanych hooków pluginów, gdy potrzebujesz kontroli cyklu życia runtime.

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
| ------------------------ | --------------------------------------------------------- |
| `command:new`            | Wydano polecenie `/new`                                   |
| `command:reset`          | Wydano polecenie `/reset`                                 |
| `command:stop`           | Wydano polecenie `/stop`                                  |
| `command`                | Dowolne zdarzenie polecenia (ogólny listener)             |
| `session:compact:before` | Przed tym, jak Compaction podsumuje historię              |
| `session:compact:after`  | Po zakończeniu Compaction                                 |
| `session:patch`          | Gdy właściwości sesji są modyfikowane                     |
| `agent:bootstrap`        | Przed wstrzyknięciem plików bootstrapowania przestrzeni roboczej |
| `gateway:startup`        | Po uruchomieniu kanałów i załadowaniu hooków              |
| `gateway:shutdown`       | Gdy rozpoczyna się zamykanie gateway                      |
| `gateway:pre-restart`    | Przed oczekiwanym restartem gateway                       |
| `message:received`       | Wiadomość przychodząca z dowolnego kanału                 |
| `message:transcribed`    | Po zakończeniu transkrypcji audio                         |
| `message:preprocessed`   | Po zakończeniu lub pominięciu wstępnego przetwarzania mediów i linków |
| `message:sent`           | Dostarczono wiadomość wychodzącą                          |

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
| `export`   | Nazwany eksport do użycia (domyślnie `"default"`)    |
| `os`       | Wymagane platformy (np. `["darwin", "linux"]`)       |
| `requires` | Wymagane ścieżki `bins`, `anyBins`, `env` lub `config` |
| `always`   | Pominięcie sprawdzeń kwalifikowalności (wartość boolowska) |
| `install`  | Metody instalacji                                    |

### Implementacja handlera

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

Każde zdarzenie zawiera: `type`, `action`, `sessionKey`, `timestamp`, `messages` (wpychaj tutaj odpowiedzi tylko na powierzchniach z możliwością odpowiedzi) oraz `context` (dane specyficzne dla zdarzenia). Konteksty hooków agenta i narzędzia pluginów mogą też zawierać `trace`, tylko do odczytu, zgodny z W3C kontekst śladu diagnostycznego, który pluginy mogą przekazywać do ustrukturyzowanych logów w celu korelacji OTEL.

`event.messages` jest automatycznie dostarczane tylko na powierzchniach z możliwością odpowiedzi, takich jak
`command:*` i `message:received`. Zdarzenia wyłącznie cyklu życia, takie jak
`agent:bootstrap`, `session:*`, `gateway:*` lub `message:sent`, nie mają
kanału odpowiedzi i ignorują dodane wiadomości.

### Najważniejsze informacje o kontekście zdarzeń

**Zdarzenia poleceń** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Zdarzenia wiadomości** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dane specyficzne dla dostawcy, w tym `senderId`, `senderName`, `guildId`). `context.content` preferuje niepustą treść polecenia dla wiadomości podobnych do poleceń, a następnie wraca do surowej treści przychodzącej i ogólnej treści; nie obejmuje wzbogacenia wyłącznie dla agenta, takiego jak historia wątku czy podsumowania linków.

**Zdarzenia wiadomości** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Zdarzenia wiadomości** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Zdarzenia wiadomości** (`message:preprocessed`): `context.bodyForAgent` (ostateczna wzbogacona treść), `context.from`, `context.channelId`.

**Zdarzenia bootstrapowania** (`agent:bootstrap`): `context.bootstrapFiles` (mutowalna tablica), `context.agentId`.

**Zdarzenia łatki sesji** (`session:patch`): `context.sessionEntry`, `context.patch` (tylko zmienione pola), `context.cfg`. Tylko uprzywilejowani klienci mogą wyzwalać zdarzenia łatek.

**Zdarzenia Compaction**: `session:compact:before` zawiera `messageCount`, `tokenCount`. `session:compact:after` dodaje `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` obserwuje wydanie przez użytkownika `/stop`; jest to cykl życia anulowania/polecenia, a nie bramka finalizacji agenta. Pluginy, które muszą sprawdzić naturalną odpowiedź końcową i poprosić agenta o jeszcze jedno przejście, powinny zamiast tego użyć typowanego hooka pluginu `before_agent_finalize`. Zobacz [Hooki pluginów](/pl/plugins/hooks).

**Zdarzenia cyklu życia Gateway**: `gateway:shutdown` zawiera `reason` i `restartExpectedMs` oraz jest wyzwalane, gdy rozpoczyna się zamykanie gateway. `gateway:pre-restart` zawiera ten sam kontekst, ale jest wyzwalane tylko wtedy, gdy zamknięcie jest częścią oczekiwanego restartu i podano skończoną wartość `restartExpectedMs`. Podczas zamykania każde oczekiwanie hooka cyklu życia jest realizowane w trybie best-effort i ograniczone czasowo, więc zamykanie trwa dalej, jeśli handler się zawiesi. Domyślny budżet oczekiwania to 5 sekund dla `gateway:shutdown` i 10 sekund dla `gateway:pre-restart`.

Użyj `gateway:pre-restart` do krótkich powiadomień o restarcie, gdy kanały są nadal dostępne:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

Między zdarzeniem `gateway:shutdown` (lub `gateway:pre-restart`) a resztą sekwencji zamykania gateway wyzwala też typowany hook pluginu `session_end` dla każdej sesji, która nadal była aktywna, gdy proces się zatrzymał. `reason` zdarzenia ma wartość `shutdown` przy zwykłym zatrzymaniu SIGTERM/SIGINT oraz `restart`, gdy zamknięcie zaplanowano jako część oczekiwanego restartu. To opróżnianie jest ograniczone czasowo, więc powolny handler `session_end` nie może zablokować wyjścia procesu, a sesje, które zostały już sfinalizowane przez zastąpienie / reset / usunięcie / Compaction, są pomijane, aby uniknąć podwójnego wyzwolenia.

## Wykrywanie hooków

Hooki są wykrywane z tych katalogów, w kolejności rosnącego pierwszeństwa nadpisywania:

1. **Hooki wbudowane**: dostarczane z OpenClaw
2. **Hooki pluginów**: hooki pakowane wewnątrz zainstalowanych pluginów
3. **Hooki zarządzane**: `~/.openclaw/hooks/` (zainstalowane przez użytkownika, współdzielone między przestrzeniami roboczymi). Dodatkowe katalogi z `hooks.internal.load.extraDirs` mają ten sam poziom pierwszeństwa.
4. **Hooki przestrzeni roboczej**: `<workspace>/hooks/` (dla agenta, domyślnie wyłączone do czasu jawnego włączenia)

Hooki przestrzeni roboczej mogą dodawać nowe nazwy hooków, ale nie mogą nadpisywać hooków wbudowanych, zarządzanych ani dostarczanych przez pluginy o tej samej nazwie.

Gateway pomija wykrywanie hooków wewnętrznych podczas uruchamiania, dopóki hooki wewnętrzne nie zostaną skonfigurowane. Włącz wbudowany lub zarządzany hook poleceniem `openclaw hooks enable <name>`, zainstaluj pakiet hooków albo ustaw `hooks.internal.enabled=true`, aby wyrazić zgodę. Gdy włączysz jeden nazwany hook, Gateway ładuje tylko handler tego hooka; `hooks.internal.enabled=true`, dodatkowe katalogi hooków i starsze handlery wyrażają zgodę na szerokie wykrywanie.

### Pakiety hooków

Pakiety hooków to pakiety npm, które eksportują hooki przez `openclaw.hooks` w `package.json`. Instalacja:

```bash
openclaw plugins install <path-or-spec>
```

Specyfikacje npm pochodzą wyłącznie z rejestru (nazwa pakietu + opcjonalna dokładna wersja lub dist-tag). Specyfikacje Git/URL/plikowe i zakresy semver są odrzucane.

## Hooki wbudowane

| Hook                  | Zdarzenia                                         | Co robi                                                        |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Zapisuje kontekst sesji w `<workspace>/memory/`                |
| bootstrap-extra-files | `agent:bootstrap`                                 | Wstrzykuje dodatkowe pliki rozruchowe z wzorców glob           |
| command-logger        | `command`                                         | Rejestruje wszystkie polecenia w `~/.openclaw/logs/commands.log` |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Wysyła widoczne powiadomienia na czacie, gdy kompaktowanie sesji zaczyna się/kończy |
| boot-md               | `gateway:startup`                                 | Uruchamia `BOOT.md` przy starcie Gateway                       |

Włącz dowolny dołączony hook:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### szczegóły session-memory

Wyodrębnia ostatnie 15 wiadomości użytkownika/asystenta i zapisuje je w `<workspace>/memory/YYYY-MM-DD-HHMM.md`, używając lokalnej daty hosta. Przechwytywanie pamięci działa w tle, więc potwierdzenia `/new` i `/reset` nie są opóźniane przez odczyty transkryptu ani opcjonalne generowanie slugów. Ustaw `hooks.internal.entries.session-memory.llmSlug: true`, aby generować opisowe slugi nazw plików za pomocą skonfigurowanego modelu. Wymaga skonfigurowania `workspace.dir`.

<a id="bootstrap-extra-files"></a>

### konfiguracja bootstrap-extra-files

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

Ścieżki są rozwiązywane względem obszaru roboczego. Ładowane są tylko rozpoznawane nazwy bazowe plików rozruchowych (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### szczegóły command-logger

Rejestruje każde polecenie ukośnikowe w `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### szczegóły compaction-notifier

Wysyła krótkie komunikaty statusu do bieżącej rozmowy, gdy OpenClaw zaczyna i kończy kompaktowanie transkryptu sesji. Dzięki temu długie tury są mniej mylące na powierzchniach czatu, ponieważ użytkownik widzi, że asystent podsumowuje kontekst i będzie kontynuować po kompaktowaniu.

<a id="boot-md"></a>

### szczegóły boot-md

Uruchamia `BOOT.md` z aktywnego obszaru roboczego przy starcie Gateway.

## Hooki Plugin

Pluginy mogą rejestrować typowane hooki przez Plugin SDK w celu głębszej integracji:
przechwytywania wywołań narzędzi, modyfikowania promptów, kontrolowania przepływu wiadomości i nie tylko.
Użyj hooków Plugin, gdy potrzebujesz `before_tool_call`, `before_agent_reply`,
`before_install` lub innych hooków cyklu życia w procesie.

Wewnętrzne hooki zarządzane przez Plugin są inne: uczestniczą w opisanym na tej stronie
ogólnym systemie zdarzeń poleceń/cyklu życia i pojawiają się w `openclaw hooks list` jako
`plugin:<id>`. Używaj ich do efektów ubocznych i zgodności z pakietami hooków, a nie
do uporządkowanego middleware ani bramek zasad.

Pełną dokumentację hooków Plugin znajdziesz w [Hooki Plugin](/pl/plugins/hooks).

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
Starszy format konfiguracji tablicy `hooks.internal.handlers` jest nadal obsługiwany dla zgodności wstecznej, ale nowe hooki powinny używać systemu opartego na odkrywaniu.
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

- **Utrzymuj szybkie handlery.** Hooki działają podczas przetwarzania poleceń. Uruchamiaj ciężkie zadania w trybie „fire-and-forget” za pomocą `void processInBackground(event)`.
- **Obsługuj błędy łagodnie.** Opakuj ryzykowne operacje w try/catch; nie zgłaszaj wyjątków, aby inne handlery mogły działać.
- **Filtruj zdarzenia wcześnie.** Zwróć natychmiast, jeśli typ/akcja zdarzenia nie ma znaczenia.
- **Używaj konkretnych kluczy zdarzeń.** Preferuj `"events": ["command:new"]` zamiast `"events": ["command"]`, aby zmniejszyć narzut.

## Rozwiązywanie problemów

### Hook nie został odkryty

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

Sprawdź brakujące pliki binarne (PATH), zmienne środowiskowe, wartości konfiguracji lub zgodność z systemem operacyjnym.

### Hook nie jest wykonywany

1. Sprawdź, czy hook jest włączony: `openclaw hooks list`
2. Uruchom ponownie proces Gateway, aby hooki zostały przeładowane.
3. Sprawdź logi Gateway: `./scripts/clawlog.sh | grep hook`

## Powiązane

- [Dokumentacja CLI: hooki](/pl/cli/hooks)
- [Webhooki](/pl/automation/cron-jobs#webhooks)
- [Hooki Plugin](/pl/plugins/hooks) — hooki cyklu życia Plugin w procesie
- [Konfiguracja](/pl/gateway/configuration-reference#hooks)
