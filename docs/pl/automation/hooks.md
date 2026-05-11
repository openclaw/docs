---
read_when:
    - Potrzebujesz automatyzacji sterowanej zdarzeniami dla /new, /reset, /stop oraz zdarzeń cyklu życia agenta
    - Chcesz zbudować, zainstalować lub debugować hooki
summary: 'Hooki: automatyzacja sterowana zdarzeniami dla poleceń i zdarzeń cyklu życia'
title: Hooki
x-i18n:
    generated_at: "2026-05-11T20:20:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02f44dd117d52040ea1205521c6ecd4eb410510175e2312e2584a15e6df27d96
    source_path: automation/hooks.md
    workflow: 16
---

Hooki to małe skrypty uruchamiane, gdy coś dzieje się wewnątrz Gateway. Można je wykrywać z katalogów i sprawdzać za pomocą `openclaw hooks`. Gateway ładuje hooki wewnętrzne dopiero po włączeniu hooków albo skonfigurowaniu co najmniej jednego wpisu hooka, pakietu hooków, starszego handlera lub dodatkowego katalogu hooków.

W OpenClaw istnieją dwa rodzaje hooków:

- **Hooki wewnętrzne** (ta strona): uruchamiane wewnątrz Gateway, gdy występują zdarzenia agenta, takie jak `/new`, `/reset`, `/stop` lub zdarzenia cyklu życia.
- **Webhooki**: zewnętrzne punkty końcowe HTTP, które pozwalają innym systemom wyzwalać pracę w OpenClaw. Zobacz [Webhooki](/pl/automation/cron-jobs#webhooks).

Hooki mogą być również dołączane do pluginów. `openclaw hooks list` pokazuje zarówno samodzielne hooki, jak i hooki zarządzane przez pluginy.

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
| `session:compact:before` | Przed podsumowaniem historii przez Compaction             |
| `session:compact:after`  | Po zakończeniu Compaction                                 |
| `session:patch`          | Gdy właściwości sesji zostaną zmodyfikowane               |
| `agent:bootstrap`        | Przed wstrzyknięciem plików bootstrap przestrzeni roboczej |
| `gateway:startup`        | Po uruchomieniu kanałów i załadowaniu hooków              |
| `gateway:shutdown`       | Gdy rozpoczyna się zamykanie Gateway                      |
| `gateway:pre-restart`    | Przed oczekiwanym restartem Gateway                       |
| `message:received`       | Wiadomość przychodząca z dowolnego kanału                 |
| `message:transcribed`    | Po zakończeniu transkrypcji audio                         |
| `message:preprocessed`   | Po zakończeniu lub pominięciu wstępnego przetwarzania mediów i linków |
| `message:sent`           | Wiadomość wychodząca dostarczona                          |

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
| `always`   | Pomijanie sprawdzania kwalifikowalności (wartość logiczna) |
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

Każde zdarzenie zawiera: `type`, `action`, `sessionKey`, `timestamp`, `messages` (dodaj element, aby wysłać wiadomość do użytkownika) oraz `context` (dane specyficzne dla zdarzenia). Konteksty hooków agenta i pluginów narzędzi mogą również zawierać `trace`, tylko do odczytu, zgodny z W3C kontekst śladu diagnostycznego, który pluginy mogą przekazywać do ustrukturyzowanych logów na potrzeby korelacji OTEL.

### Najważniejsze elementy kontekstu zdarzenia

**Zdarzenia poleceń** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Zdarzenia wiadomości** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dane specyficzne dla dostawcy, w tym `senderId`, `senderName`, `guildId`). `context.content` preferuje niepustą treść polecenia dla wiadomości przypominających polecenia, a następnie wraca do surowej treści przychodzącej i ogólnej treści; nie zawiera wzbogacenia przeznaczonego tylko dla agenta, takiego jak historia wątku czy podsumowania linków.

**Zdarzenia wiadomości** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Zdarzenia wiadomości** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Zdarzenia wiadomości** (`message:preprocessed`): `context.bodyForAgent` (ostateczna wzbogacona treść), `context.from`, `context.channelId`.

**Zdarzenia bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (mutowalna tablica), `context.agentId`.

**Zdarzenia łaty sesji** (`session:patch`): `context.sessionEntry`, `context.patch` (tylko zmienione pola), `context.cfg`. Tylko uprzywilejowani klienci mogą wyzwalać zdarzenia łaty.

**Zdarzenia Compaction**: `session:compact:before` zawiera `messageCount`, `tokenCount`. `session:compact:after` dodaje `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` obserwuje wydanie przez użytkownika polecenia `/stop`; dotyczy to cyklu życia anulowania/polecenia, a nie bramki finalizacji agenta. Pluginy, które muszą sprawdzić naturalną odpowiedź końcową i poprosić agenta o jeszcze jedno przejście, powinny zamiast tego użyć typowanego hooka pluginu `before_agent_finalize`. Zobacz [Hooki pluginów](/pl/plugins/hooks).

**Zdarzenia cyklu życia Gateway**: `gateway:shutdown` zawiera `reason` i `restartExpectedMs` oraz jest wyzwalane, gdy rozpoczyna się zamykanie Gateway. `gateway:pre-restart` zawiera ten sam kontekst, ale jest wyzwalane tylko wtedy, gdy zamknięcie jest częścią oczekiwanego restartu i podano skończoną wartość `restartExpectedMs`. Podczas zamykania oczekiwanie na każdy hook cyklu życia odbywa się na zasadzie najlepszego starania i jest ograniczone czasowo, aby zamykanie było kontynuowane, jeśli handler się zawiesi.

Między zdarzeniem `gateway:shutdown` (lub `gateway:pre-restart`) a pozostałą częścią sekwencji zamykania Gateway wyzwala również typowany hook pluginu `session_end` dla każdej sesji, która była nadal aktywna, gdy proces został zatrzymany. Wartość `reason` zdarzenia to `shutdown` dla zwykłego zatrzymania SIGTERM/SIGINT oraz `restart`, gdy zamknięcie zostało zaplanowane jako część oczekiwanego restartu. Ten drenaż jest ograniczony czasowo, aby powolny handler `session_end` nie mógł blokować zakończenia procesu, a sesje, które zostały już sfinalizowane przez replace / reset / delete / Compaction, są pomijane, aby uniknąć podwójnego wyzwolenia.

## Wykrywanie hooków

Hooki są wykrywane z tych katalogów, w kolejności rosnącego priorytetu nadpisania:

1. **Hooki wbudowane**: dostarczane z OpenClaw
2. **Hooki pluginów**: hooki dołączone do zainstalowanych pluginów
3. **Hooki zarządzane**: `~/.openclaw/hooks/` (zainstalowane przez użytkownika, współdzielone między przestrzeniami roboczymi). Dodatkowe katalogi z `hooks.internal.load.extraDirs` mają ten sam priorytet.
4. **Hooki przestrzeni roboczej**: `<workspace>/hooks/` (dla konkretnego agenta, domyślnie wyłączone do czasu jawnego włączenia)

Hooki przestrzeni roboczej mogą dodawać nowe nazwy hooków, ale nie mogą nadpisywać hooków wbudowanych, zarządzanych ani dostarczonych przez pluginy o tej samej nazwie.

Gateway pomija wykrywanie hooków wewnętrznych podczas uruchamiania, dopóki hooki wewnętrzne nie zostaną skonfigurowane. Włącz wbudowany lub zarządzany hook za pomocą `openclaw hooks enable <name>`, zainstaluj pakiet hooków albo ustaw `hooks.internal.enabled=true`, aby się na to zdecydować. Po włączeniu jednego nazwanego hooka Gateway ładuje tylko handler tego hooka; `hooks.internal.enabled=true`, dodatkowe katalogi hooków i starsze handlery włączają szerokie wykrywanie.

### Pakiety hooków

Pakiety hooków to pakiety npm, które eksportują hooki przez `openclaw.hooks` w `package.json`. Zainstaluj za pomocą:

```bash
openclaw plugins install <path-or-spec>
```

Specyfikacje npm są wyłącznie rejestrowe (nazwa pakietu + opcjonalna dokładna wersja lub dist-tag). Specyfikacje Git/URL/file oraz zakresy semver są odrzucane.

## Wbudowane hooki

| Hook                  | Zdarzenia                                         | Co robi                                                        |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Zapisuje kontekst sesji w `<workspace>/memory/`                |
| bootstrap-extra-files | `agent:bootstrap`                                 | Wstrzykuje dodatkowe pliki bootstrap z wzorców glob            |
| command-logger        | `command`                                         | Loguje wszystkie polecenia do `~/.openclaw/logs/commands.log`  |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Wysyła widoczne powiadomienia czatu, gdy Compaction sesji zaczyna się/kończy |
| boot-md               | `gateway:startup`                                 | Uruchamia `BOOT.md` po starcie Gateway                         |

Włącz dowolny wbudowany hook:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Szczegóły session-memory

Wyodrębnia ostatnie 15 wiadomości użytkownika/asystenta i zapisuje je do `<workspace>/memory/YYYY-MM-DD-HHMM.md`, używając lokalnej daty hosta. Przechwytywanie pamięci działa w tle, więc potwierdzenia `/new` i `/reset` nie są opóźniane przez odczyty transkryptu ani opcjonalne generowanie sluga. Ustaw `hooks.internal.entries.session-memory.llmSlug: true`, aby generować opisowe slugi nazw plików z użyciem skonfigurowanego modelu. Wymaga skonfigurowania `workspace.dir`.

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

Ścieżki są rozwiązywane względem przestrzeni roboczej. Ładowane są tylko rozpoznane nazwy bazowe bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Szczegóły command-logger

Loguje każde polecenie ukośnikowe do `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Szczegóły compaction-notifier

Wysyła krótkie komunikaty statusu do bieżącej rozmowy, gdy OpenClaw zaczyna i kończy kompaktowanie transkryptu sesji. Dzięki temu długie tury są mniej mylące na powierzchniach czatu, ponieważ użytkownik widzi, że asystent podsumowuje kontekst i będzie kontynuował po Compaction.

<a id="boot-md"></a>

### Szczegóły boot-md

Uruchamia `BOOT.md` z aktywnej przestrzeni roboczej po starcie Gateway.

## Hooki pluginów

Pluginy mogą rejestrować typowane hooki przez Plugin SDK, aby uzyskać głębszą integrację:
przechwytywanie wywołań narzędzi, modyfikowanie promptów, kontrolowanie przepływu wiadomości i więcej.
Używaj hooków pluginów, gdy potrzebujesz `before_tool_call`, `before_agent_reply`,
`before_install` lub innych hooków cyklu życia działających w procesie.

Pełną dokumentację hooków pluginów znajdziesz w [Hooki pluginów](/pl/plugins/hooks).

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

## Referencja CLI

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

- **Dbaj, aby handlery były szybkie.** Hooki działają podczas przetwarzania poleceń. Ciężkie zadania uruchamiaj w trybie fire-and-forget za pomocą `void processInBackground(event)`.
- **Obsługuj błędy z wyczuciem.** Owijaj ryzykowne operacje w try/catch; nie zgłaszaj wyjątku, aby inne handlery mogły zostać uruchomione.
- **Filtruj zdarzenia wcześnie.** Zwróć wynik natychmiast, jeśli typ/akcja zdarzenia nie jest istotna.
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

### Hook nie kwalifikuje się do użycia

```bash
openclaw hooks info my-hook
```

Sprawdź brakujące pliki wykonywalne (PATH), zmienne środowiskowe, wartości konfiguracji lub zgodność z systemem operacyjnym.

### Hook nie jest wykonywany

1. Sprawdź, czy hook jest włączony: `openclaw hooks list`
2. Uruchom ponownie proces Gateway, aby hooki zostały ponownie wczytane.
3. Sprawdź logi Gateway: `./scripts/clawlog.sh | grep hook`

## Powiązane

- [Referencja CLI: hooks](/pl/cli/hooks)
- [Webhooki](/pl/automation/cron-jobs#webhooks)
- [Hooki Plugin](/pl/plugins/hooks) — hooki cyklu życia pluginu działające w ramach procesu
- [Konfiguracja](/pl/gateway/configuration-reference#hooks)
