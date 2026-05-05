---
read_when:
    - Potrzebujesz automatyzacji sterowanej zdarzeniami dla /new, /reset, /stop oraz zdarzeń cyklu życia agenta
    - Chcesz tworzyć, instalować lub debugować hooki
summary: 'Hooki: automatyzacja sterowana zdarzeniami dla poleceń i zdarzeń cyklu życia'
title: Hooki
x-i18n:
    generated_at: "2026-05-05T08:25:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321eb7a583d5e8c90d2c2026f6e1cf46cd207bef52213774b469a8d46b993967
    source_path: automation/hooks.md
    workflow: 16
---

Haki to małe skrypty uruchamiane, gdy coś dzieje się wewnątrz Gateway. Można je wykrywać z katalogów i sprawdzać za pomocą `openclaw hooks`. Gateway ładuje haki wewnętrzne dopiero po włączeniu haków albo skonfigurowaniu co najmniej jednego wpisu haka, pakietu haków, starszego handlera lub dodatkowego katalogu haków.

W OpenClaw są dwa rodzaje haków:

- **Haki wewnętrzne** (ta strona): działają wewnątrz Gateway, gdy występują zdarzenia agenta, takie jak `/new`, `/reset`, `/stop` albo zdarzenia cyklu życia.
- **Webhooki**: zewnętrzne endpointy HTTP, które pozwalają innym systemom uruchamiać pracę w OpenClaw. Zobacz [Webhooki](/pl/automation/cron-jobs#webhooks).

Haki mogą być również dołączane do pluginów. `openclaw hooks list` pokazuje zarówno samodzielne haki, jak i haki zarządzane przez pluginy.

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

| Zdarzenie                | Kiedy występuje                                           |
| ------------------------ | --------------------------------------------------------- |
| `command:new`            | Wydano polecenie `/new`                                   |
| `command:reset`          | Wydano polecenie `/reset`                                 |
| `command:stop`           | Wydano polecenie `/stop`                                  |
| `command`                | Dowolne zdarzenie polecenia (ogólny listener)             |
| `session:compact:before` | Przed podsumowaniem historii przez Compaction             |
| `session:compact:after`  | Po zakończeniu Compaction                                 |
| `session:patch`          | Gdy właściwości sesji są modyfikowane                     |
| `agent:bootstrap`        | Zanim pliki bootstrapu obszaru roboczego zostaną wstrzyknięte |
| `gateway:startup`        | Po uruchomieniu kanałów i załadowaniu haków               |
| `gateway:shutdown`       | Gdy rozpoczyna się zamykanie Gateway                      |
| `gateway:pre-restart`    | Przed oczekiwanym restartem Gateway                       |
| `message:received`       | Wiadomość przychodząca z dowolnego kanału                 |
| `message:transcribed`    | Po zakończeniu transkrypcji audio                         |
| `message:preprocessed`   | Po zakończeniu lub pominięciu wstępnego przetwarzania multimediów i linków |
| `message:sent`           | Dostarczono wiadomość wychodzącą                          |

## Pisanie haków

### Struktura haka

Każdy hak jest katalogiem zawierającym dwa pliki:

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
| `events`   | Tablica zdarzeń, których należy nasłuchiwać          |
| `export`   | Nazwany eksport do użycia (domyślnie `"default"`)    |
| `os`       | Wymagane platformy (np. `["darwin", "linux"]`)       |
| `requires` | Wymagane ścieżki `bins`, `anyBins`, `env` lub `config` |
| `always`   | Pomija kontrole kwalifikowalności (wartość boolowska) |
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

Każde zdarzenie zawiera: `type`, `action`, `sessionKey`, `timestamp`, `messages` (dodaj element, aby wysłać wiadomość użytkownikowi) oraz `context` (dane specyficzne dla zdarzenia). Konteksty haków pluginów agentów i narzędzi mogą również zawierać `trace`, tylko do odczytu, zgodny z W3C kontekst śladu diagnostycznego, który pluginy mogą przekazywać do ustrukturyzowanych logów na potrzeby korelacji OTEL.

### Najważniejsze elementy kontekstu zdarzeń

**Zdarzenia poleceń** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Zdarzenia wiadomości** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dane specyficzne dla dostawcy, w tym `senderId`, `senderName`, `guildId`). `context.content` preferuje niepustą treść polecenia dla wiadomości podobnych do poleceń, a następnie wraca do surowej treści przychodzącej i ogólnej treści; nie zawiera wzbogacenia dostępnego tylko dla agenta, takiego jak historia wątku lub podsumowania linków.

**Zdarzenia wiadomości** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Zdarzenia wiadomości** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Zdarzenia wiadomości** (`message:preprocessed`): `context.bodyForAgent` (ostateczna wzbogacona treść), `context.from`, `context.channelId`.

**Zdarzenia bootstrapu** (`agent:bootstrap`): `context.bootstrapFiles` (mutowalna tablica), `context.agentId`.

**Zdarzenia poprawki sesji** (`session:patch`): `context.sessionEntry`, `context.patch` (tylko zmienione pola), `context.cfg`. Tylko uprzywilejowani klienci mogą wyzwalać zdarzenia poprawek.

**Zdarzenia Compaction**: `session:compact:before` zawiera `messageCount`, `tokenCount`. `session:compact:after` dodaje `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` obserwuje wydanie przez użytkownika `/stop`; jest to cykl życia anulowania/polecenia, a nie bramka finalizacji agenta. Pluginy, które muszą sprawdzić naturalną odpowiedź końcową i poprosić agenta o jeszcze jedno przejście, powinny zamiast tego użyć typowanego haka pluginu `before_agent_finalize`. Zobacz [Haki pluginów](/pl/plugins/hooks).

**Zdarzenia cyklu życia Gateway**: `gateway:shutdown` zawiera `reason` i `restartExpectedMs` oraz występuje, gdy rozpoczyna się zamykanie Gateway. `gateway:pre-restart` zawiera ten sam kontekst, ale występuje tylko wtedy, gdy zamknięcie jest częścią oczekiwanego restartu i podano skończoną wartość `restartExpectedMs`. Podczas zamykania oczekiwanie na każdy hak cyklu życia jest realizowane na zasadzie best-effort i ograniczone czasowo, aby zamykanie było kontynuowane, jeśli handler się zatrzyma.

## Wykrywanie haków

Haki są wykrywane z tych katalogów, w kolejności rosnącego priorytetu nadpisywania:

1. **Haki wbudowane**: dostarczane z OpenClaw
2. **Haki pluginów**: haki dołączone do zainstalowanych pluginów
3. **Haki zarządzane**: `~/.openclaw/hooks/` (zainstalowane przez użytkownika, współdzielone między obszarami roboczymi). Dodatkowe katalogi z `hooks.internal.load.extraDirs` mają ten sam priorytet.
4. **Haki obszaru roboczego**: `<workspace>/hooks/` (dla konkretnego agenta, domyślnie wyłączone do czasu jawnego włączenia)

Haki obszaru roboczego mogą dodawać nowe nazwy haków, ale nie mogą nadpisywać haków wbudowanych, zarządzanych ani dostarczonych przez plugin o tej samej nazwie.

Gateway pomija wykrywanie haków wewnętrznych przy uruchamianiu, dopóki haki wewnętrzne nie zostaną skonfigurowane. Włącz wbudowany lub zarządzany hak poleceniem `openclaw hooks enable <name>`, zainstaluj pakiet haków albo ustaw `hooks.internal.enabled=true`, aby się włączyć. Gdy włączysz jeden nazwany hak, Gateway ładuje tylko handler tego haka; `hooks.internal.enabled=true`, dodatkowe katalogi haków i starsze handlery włączają szerokie wykrywanie.

### Pakiety haków

Pakiety hooków to pakiety npm, które eksportują hooki przez `openclaw.hooks` w `package.json`. Zainstaluj za pomocą:

```bash
openclaw plugins install <path-or-spec>
```

Specyfikacje npm są obsługiwane tylko z rejestru (nazwa pakietu + opcjonalna dokładna wersja lub dist-tag). Specyfikacje Git/URL/file oraz zakresy semver są odrzucane.

## Dołączone hooki

| Hook                  | Zdarzenia                                         | Co robi                                                        |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Zapisuje kontekst sesji w `<workspace>/memory/`                |
| bootstrap-extra-files | `agent:bootstrap`                                 | Wstrzykuje dodatkowe pliki bootstrapu z wzorców glob           |
| command-logger        | `command`                                         | Rejestruje wszystkie polecenia w `~/.openclaw/logs/commands.log` |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Wysyła widoczne powiadomienia czatu, gdy kompaktowanie sesji zaczyna się/kończy |
| boot-md               | `gateway:startup`                                 | Uruchamia `BOOT.md`, gdy Gateway się uruchamia                 |

Włącz dowolny dołączony hook:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Szczegóły session-memory

Wyodrębnia ostatnie 15 wiadomości użytkownika/asystenta i zapisuje je w `<workspace>/memory/YYYY-MM-DD-HHMM.md` przy użyciu lokalnej daty hosta. Przechwytywanie pamięci działa w tle, więc potwierdzenia `/new` i `/reset` nie są opóźniane przez odczyty transkrypcji ani opcjonalne generowanie sluga. Ustaw `hooks.internal.entries.session-memory.llmSlug: true`, aby generować opisowe slugi nazw plików za pomocą skonfigurowanego modelu. Wymaga skonfigurowania `workspace.dir`.

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

Ścieżki są rozwiązywane względem workspace. Wczytywane są tylko rozpoznawane bazowe nazwy plików bootstrapu (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Szczegóły command-logger

Rejestruje każde polecenie ukośnikowe w `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Szczegóły compaction-notifier

Wysyła krótkie komunikaty statusu do bieżącej rozmowy, gdy OpenClaw rozpoczyna i kończy kompaktowanie transkrypcji sesji. Dzięki temu długie tury są mniej mylące w interfejsach czatu, ponieważ użytkownik widzi, że asystent podsumowuje kontekst i będzie kontynuować po Compaction.

<a id="boot-md"></a>

### Szczegóły boot-md

Uruchamia `BOOT.md` z aktywnego workspace, gdy Gateway się uruchamia.

## Hooki Plugin

Pluginy mogą rejestrować typowane hooki przez Plugin SDK w celu głębszej integracji:
przechwytywania wywołań narzędzi, modyfikowania promptów, kontrolowania przepływu wiadomości i nie tylko.
Używaj hooków Plugin, gdy potrzebujesz `before_tool_call`, `before_agent_reply`,
`before_install` lub innych hooków cyklu życia w procesie.

Pełną dokumentację hooków Plugin znajdziesz w sekcji [Hooki Plugin](/pl/plugins/hooks).

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

- **Dbaj o szybkość handlerów.** Hooki działają podczas przetwarzania poleceń. Ciężkie zadania uruchamiaj bez oczekiwania na wynik za pomocą `void processInBackground(event)`.
- **Obsługuj błędy z wdziękiem.** Owijaj ryzykowne operacje w try/catch; nie zgłaszaj wyjątków, aby inne handlery mogły się wykonać.
- **Filtruj zdarzenia wcześnie.** Zwracaj od razu, jeśli typ/akcja zdarzenia nie jest istotna.
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

### Hook nie kwalifikuje się do uruchomienia

```bash
openclaw hooks info my-hook
```

Sprawdź brakujące pliki binarne (PATH), zmienne środowiskowe, wartości konfiguracji lub zgodność z systemem operacyjnym.

### Hook się nie wykonuje

1. Sprawdź, czy hook jest włączony: `openclaw hooks list`
2. Uruchom ponownie proces Gateway, aby hooki zostały ponownie wczytane.
3. Sprawdź logi Gateway: `./scripts/clawlog.sh | grep hook`

## Powiązane

- [Dokumentacja CLI: hooki](/pl/cli/hooks)
- [Webhooks](/pl/automation/cron-jobs#webhooks)
- [Hooki Plugin](/pl/plugins/hooks) — hooki cyklu życia Plugin działające w procesie
- [Konfiguracja](/pl/gateway/configuration-reference#hooks)
