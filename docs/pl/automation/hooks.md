---
read_when:
    - Chcesz automatyzacji sterowanej zdarzeniami dla /new, /reset, /stop i zdarzeń cyklu życia agenta
    - Chcesz tworzyć, instalować lub debugować hooki
summary: 'Hooki: automatyzacja sterowana zdarzeniami dla poleceń i zdarzeń cyklu życia'
title: Hooki
x-i18n:
    generated_at: "2026-05-02T20:41:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

Hooki to małe skrypty uruchamiane, gdy coś wydarzy się wewnątrz Gateway. Można je wykrywać z katalogów i sprawdzać za pomocą `openclaw hooks`. Gateway ładuje hooki wewnętrzne dopiero po włączeniu hooków albo skonfigurowaniu co najmniej jednego wpisu hooka, pakietu hooków, starszego handlera lub dodatkowego katalogu hooków.

W OpenClaw istnieją dwa rodzaje hooków:

- **Hooki wewnętrzne** (ta strona): działają wewnątrz Gateway, gdy uruchamiane są zdarzenia agenta, takie jak `/new`, `/reset`, `/stop` lub zdarzenia cyklu życia.
- **Webhooki**: zewnętrzne punkty końcowe HTTP, które pozwalają innym systemom wyzwalać pracę w OpenClaw. Zobacz [Webhooki](/pl/automation/cron-jobs#webhooks).

Hooki mogą być także pakowane wewnątrz pluginów. `openclaw hooks list` pokazuje zarówno samodzielne hooki, jak i hooki zarządzane przez pluginy.

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

| Zdarzenie                | Kiedy jest uruchamiane                                    |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Wydano polecenie `/new`                                    |
| `command:reset`          | Wydano polecenie `/reset`                                  |
| `command:stop`           | Wydano polecenie `/stop`                                   |
| `command`                | Dowolne zdarzenie polecenia (ogólny listener)              |
| `session:compact:before` | Przed podsumowaniem historii przez Compaction              |
| `session:compact:after`  | Po zakończeniu Compaction                                  |
| `session:patch`          | Gdy właściwości sesji zostaną zmodyfikowane                |
| `agent:bootstrap`        | Przed wstrzyknięciem plików bootstrapu obszaru roboczego   |
| `gateway:startup`        | Po uruchomieniu kanałów i załadowaniu hooków               |
| `gateway:shutdown`       | Gdy rozpoczyna się zamykanie Gateway                       |
| `gateway:pre-restart`    | Przed oczekiwanym ponownym uruchomieniem Gateway           |
| `message:received`       | Wiadomość przychodząca z dowolnego kanału                  |
| `message:transcribed`    | Po zakończeniu transkrypcji audio                          |
| `message:preprocessed`   | Po zakończeniu lub pominięciu przetwarzania mediów i linków |
| `message:sent`           | Dostarczono wiadomość wychodzącą                           |

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

| Pole       | Opis                                                   |
| ---------- | ------------------------------------------------------ |
| `emoji`    | Emoji wyświetlane w CLI                                |
| `events`   | Tablica zdarzeń do nasłuchiwania                       |
| `export`   | Nazwany eksport do użycia (domyślnie `"default"`)      |
| `os`       | Wymagane platformy (np. `["darwin", "linux"]`)         |
| `requires` | Wymagane ścieżki `bins`, `anyBins`, `env` lub `config` |
| `always`   | Pominięcie kontroli kwalifikowalności (wartość logiczna) |
| `install`  | Metody instalacji                                      |

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

Każde zdarzenie zawiera: `type`, `action`, `sessionKey`, `timestamp`, `messages` (dodaj, aby wysłać do użytkownika) oraz `context` (dane specyficzne dla zdarzenia). Konteksty hooków agenta i narzędzi pluginów mogą także zawierać `trace`, tylko do odczytu, zgodny z W3C kontekst śladu diagnostycznego, który pluginy mogą przekazywać do ustrukturyzowanych logów w celu korelacji OTEL.

### Najważniejsze elementy kontekstu zdarzeń

**Zdarzenia poleceń** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Zdarzenia wiadomości** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dane specyficzne dla dostawcy, w tym `senderId`, `senderName`, `guildId`). `context.content` preferuje niepustą treść polecenia dla wiadomości podobnych do poleceń, a następnie wraca do surowej treści przychodzącej i ogólnej treści; nie obejmuje wzbogaceń dostępnych tylko dla agenta, takich jak historia wątku lub podsumowania linków.

**Zdarzenia wiadomości** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Zdarzenia wiadomości** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Zdarzenia wiadomości** (`message:preprocessed`): `context.bodyForAgent` (finalna wzbogacona treść), `context.from`, `context.channelId`.

**Zdarzenia bootstrapu** (`agent:bootstrap`): `context.bootstrapFiles` (mutowalna tablica), `context.agentId`.

**Zdarzenia łatania sesji** (`session:patch`): `context.sessionEntry`, `context.patch` (tylko zmienione pola), `context.cfg`. Tylko uprzywilejowani klienci mogą wyzwalać zdarzenia patch.

**Zdarzenia Compaction**: `session:compact:before` zawiera `messageCount`, `tokenCount`. `session:compact:after` dodaje `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` obserwuje wydanie przez użytkownika `/stop`; jest to cykl życia anulowania/polecenia, a nie bramka finalizacji agenta. Pluginy, które muszą sprawdzić naturalną odpowiedź końcową i poprosić agenta o jeszcze jedno przejście, powinny zamiast tego użyć typowanego hooka pluginu `before_agent_finalize`. Zobacz [Hooki pluginów](/pl/plugins/hooks).

**Zdarzenia cyklu życia Gateway**: `gateway:shutdown` zawiera `reason` i `restartExpectedMs` oraz jest uruchamiane, gdy rozpoczyna się zamykanie Gateway. `gateway:pre-restart` zawiera ten sam kontekst, ale jest uruchamiane tylko wtedy, gdy zamknięcie jest częścią oczekiwanego ponownego uruchomienia i podano skończoną wartość `restartExpectedMs`. Podczas zamykania oczekiwanie każdego hooka cyklu życia odbywa się na zasadzie najlepszych starań i jest ograniczone czasowo, aby zamykanie było kontynuowane, jeśli handler się zatrzyma.

## Wykrywanie hooków

Hooki są wykrywane z tych katalogów, w kolejności rosnącego pierwszeństwa nadpisywania:

1. **Hooki wbudowane**: dostarczane z OpenClaw
2. **Hooki pluginów**: hooki spakowane wewnątrz zainstalowanych pluginów
3. **Hooki zarządzane**: `~/.openclaw/hooks/` (zainstalowane przez użytkownika, współdzielone między obszarami roboczymi). Dodatkowe katalogi z `hooks.internal.load.extraDirs` mają ten sam priorytet.
4. **Hooki obszaru roboczego**: `<workspace>/hooks/` (na agenta, domyślnie wyłączone do czasu jawnego włączenia)

Hooki obszaru roboczego mogą dodawać nowe nazwy hooków, ale nie mogą nadpisywać hooków wbudowanych, zarządzanych ani dostarczanych przez pluginy o tej samej nazwie.

Gateway pomija wykrywanie hooków wewnętrznych podczas uruchamiania, dopóki hooki wewnętrzne nie zostaną skonfigurowane. Włącz hook wbudowany lub zarządzany za pomocą `openclaw hooks enable <name>`, zainstaluj pakiet hooków albo ustaw `hooks.internal.enabled=true`, aby wyrazić zgodę. Gdy włączysz jeden nazwany hook, Gateway ładuje tylko handler tego hooka; `hooks.internal.enabled=true`, dodatkowe katalogi hooków i starsze handlery włączają szerokie wykrywanie.

### Pakiety hooków

Pakiety hooków to pakiety npm, które eksportują hooki przez `openclaw.hooks` w `package.json`. Zainstaluj za pomocą:

```bash
openclaw plugins install <path-or-spec>
```

Specyfikacje Npm dotyczą wyłącznie rejestru (nazwa pakietu + opcjonalna dokładna wersja albo dist-tag). Specyfikacje Git/URL/file oraz zakresy semver są odrzucane.

## Wbudowane hooki

| Hook                  | Zdarzenia                      | Co robi                                               |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Zapisuje kontekst sesji do `<workspace>/memory/`      |
| bootstrap-extra-files | `agent:bootstrap`              | Wstrzykuje dodatkowe pliki bootstrap z wzorców glob   |
| command-logger        | `command`                      | Loguje wszystkie polecenia do `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Uruchamia `BOOT.md` przy starcie Gateway              |

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

Ścieżki są rozwiązywane względem workspace. Ładowane są tylko rozpoznawane nazwy bazowe bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Szczegóły command-logger

Loguje każde polecenie z ukośnikiem do `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Szczegóły boot-md

Uruchamia `BOOT.md` z aktywnego workspace przy starcie Gateway.

## Hooki Plugin

Pluginy mogą rejestrować typowane hooki przez Plugin SDK w celu głębszej integracji:
przechwytywania wywołań narzędzi, modyfikowania promptów, kontrolowania przepływu wiadomości i innych działań.
Używaj hooków Plugin, gdy potrzebujesz `before_tool_call`, `before_agent_reply`,
`before_install` albo innych hooków cyklu życia działających w procesie.

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
Starszy format konfiguracji tablicy `hooks.internal.handlers` jest nadal obsługiwany ze względu na zgodność wsteczną, ale nowe hooki powinny używać systemu opartego na wykrywaniu.
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

- **Dbaj o szybkość handlerów.** Hooki działają podczas przetwarzania poleceń. Ciężkie prace uruchamiaj w trybie fire-and-forget za pomocą `void processInBackground(event)`.
- **Obsługuj błędy łagodnie.** Owijaj ryzykowne operacje w try/catch; nie zgłaszaj wyjątków, aby inne handlery mogły się wykonać.
- **Filtruj zdarzenia wcześnie.** Zwróć wynik natychmiast, jeśli typ/akcja zdarzenia nie są istotne.
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

Sprawdź brakujące pliki binarne (PATH), zmienne środowiskowe, wartości konfiguracji albo zgodność z systemem operacyjnym.

### Hook się nie wykonuje

1. Sprawdź, czy hak jest włączony: `openclaw hooks list`
2. Uruchom ponownie proces Gateway, aby haki zostały ponownie wczytane.
3. Sprawdź logi Gateway: `./scripts/clawlog.sh | grep hook`

## Powiązane

- [Dokumentacja CLI: haki](/pl/cli/hooks)
- [Webhooki](/pl/automation/cron-jobs#webhooks)
- [Haki Plugin](/pl/plugins/hooks) — haki cyklu życia Plugin działające w procesie
- [Konfiguracja](/pl/gateway/configuration-reference#hooks)
