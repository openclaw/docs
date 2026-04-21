---
read_when:
    - Chcesz automatyzacji sterowanej zdarzeniami dla `/new`, `/reset`, `/stop` oraz zdarzeń cyklu życia agenta
    - Chcesz tworzyć, instalować lub debugować hooki
summary: 'Hooki: automatyzacja sterowana zdarzeniami dla poleceń i zdarzeń cyklu życia'
title: Hooki
x-i18n:
    generated_at: "2026-04-21T09:51:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5269c3ca3a45d23d79232e041c0980ecaab93fd6f0f1e39e0b2a76cb4c8b5c8b
    source_path: automation/hooks.md
    workflow: 15
---

# Hooki

Hooki to małe skrypty uruchamiane, gdy coś dzieje się wewnątrz Gateway. Mogą być wykrywane z katalogów i sprawdzane za pomocą `openclaw hooks`. Gateway ładuje hooki wewnętrzne dopiero po włączeniu hooków lub skonfigurowaniu co najmniej jednego wpisu hooka, pakietu hooków, starszego handlera albo dodatkowego katalogu hooków.

W OpenClaw są dwa rodzaje hooków:

- **Hooki wewnętrzne** (ta strona): działają wewnątrz Gateway, gdy uruchamiane są zdarzenia agenta, takie jak `/new`, `/reset`, `/stop` lub zdarzenia cyklu życia.
- **Webhooks**: zewnętrzne punkty końcowe HTTP, które pozwalają innym systemom wywoływać działania w OpenClaw. Zobacz [Webhooks](/pl/automation/cron-jobs#webhooks).

Hooki mogą być też dołączane do pluginów. `openclaw hooks list` pokazuje zarówno samodzielne hooki, jak i hooki zarządzane przez pluginy.

## Szybki start

```bash
# Wyświetl dostępne hooki
openclaw hooks list

# Włącz hook
openclaw hooks enable session-memory

# Sprawdź stan hooków
openclaw hooks check

# Pobierz szczegółowe informacje
openclaw hooks info session-memory
```

## Typy zdarzeń

| Zdarzenie                | Kiedy jest wywoływane                          |
| ------------------------ | ---------------------------------------------- |
| `command:new`            | Wydano polecenie `/new`                        |
| `command:reset`          | Wydano polecenie `/reset`                      |
| `command:stop`           | Wydano polecenie `/stop`                       |
| `command`                | Dowolne zdarzenie polecenia (ogólny listener)  |
| `session:compact:before` | Przed podsumowaniem historii przez Compaction  |
| `session:compact:after`  | Po zakończeniu Compaction                      |
| `session:patch`          | Gdy właściwości sesji są modyfikowane          |
| `agent:bootstrap`        | Przed wstrzyknięciem plików bootstrap workspace |
| `gateway:startup`        | Po uruchomieniu kanałów i załadowaniu hooków   |
| `message:received`       | Wiadomość przychodząca z dowolnego kanału      |
| `message:transcribed`    | Po zakończeniu transkrypcji audio              |
| `message:preprocessed`   | Po zakończeniu przetwarzania mediów i linków   |
| `message:sent`           | Dostarczono wiadomość wychodzącą               |

## Pisanie hooków

### Struktura hooka

Każdy hook to katalog zawierający dwa pliki:

```
my-hook/
├── HOOK.md          # Metadane + dokumentacja
└── handler.ts       # Implementacja handlera
```

### Format HOOK.md

```markdown
---
name: my-hook
description: "Krótki opis tego, co robi ten hook"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Tutaj znajduje się szczegółowa dokumentacja.
```

**Pola metadanych** (`metadata.openclaw`):

| Pole       | Opis                                                      |
| ---------- | --------------------------------------------------------- |
| `emoji`    | Emoji wyświetlane w CLI                                   |
| `events`   | Tablica zdarzeń do nasłuchiwania                          |
| `export`   | Nazwany eksport do użycia (domyślnie `"default"`)         |
| `os`       | Wymagane platformy (np. `["darwin", "linux"]`)            |
| `requires` | Wymagane `bins`, `anyBins`, `env` lub ścieżki `config`    |
| `always`   | Pomija sprawdzenia kwalifikowalności (boolean)            |
| `install`  | Metody instalacji                                         |

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

Każde zdarzenie zawiera: `type`, `action`, `sessionKey`, `timestamp`, `messages` (dodaj przez `push`, aby wysłać użytkownikowi), oraz `context` (dane specyficzne dla zdarzenia).

### Najważniejsze elementy kontekstu zdarzeń

**Zdarzenia poleceń** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Zdarzenia wiadomości** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dane specyficzne dla providera, w tym `senderId`, `senderName`, `guildId`).

**Zdarzenia wiadomości** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Zdarzenia wiadomości** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Zdarzenia wiadomości** (`message:preprocessed`): `context.bodyForAgent` (końcowa wzbogacona treść), `context.from`, `context.channelId`.

**Zdarzenia bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (modyfikowalna tablica), `context.agentId`.

**Zdarzenia poprawek sesji** (`session:patch`): `context.sessionEntry`, `context.patch` (tylko zmienione pola), `context.cfg`. Tylko klienci uprzywilejowani mogą wywoływać zdarzenia poprawek.

**Zdarzenia Compaction**: `session:compact:before` zawiera `messageCount`, `tokenCount`. `session:compact:after` dodatkowo zawiera `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Wykrywanie hooków

Hooki są wykrywane z następujących katalogów, w kolejności rosnącego priorytetu nadpisywania:

1. **Hooki wbudowane**: dostarczane z OpenClaw
2. **Hooki pluginów**: hooki dołączone do zainstalowanych pluginów
3. **Hooki zarządzane**: `~/.openclaw/hooks/` (instalowane przez użytkownika, współdzielone między workspace). Dodatkowe katalogi z `hooks.internal.load.extraDirs` mają ten sam priorytet.
4. **Hooki workspace**: `<workspace>/hooks/` (na agenta, domyślnie wyłączone do czasu jawnego włączenia)

Hooki workspace mogą dodawać nowe nazwy hooków, ale nie mogą nadpisywać hooków wbudowanych, zarządzanych ani dostarczanych przez pluginy o tej samej nazwie.

Gateway pomija wykrywanie hooków wewnętrznych podczas uruchamiania, dopóki hooki wewnętrzne nie zostaną skonfigurowane. Włącz hook wbudowany lub zarządzany za pomocą `openclaw hooks enable <name>`, zainstaluj pakiet hooków albo ustaw `hooks.internal.enabled=true`, aby włączyć tę funkcję. Po włączeniu jednego nazwanego hooka Gateway ładuje tylko handler tego hooka; `hooks.internal.enabled=true`, dodatkowe katalogi hooków oraz starsze handlery włączają szerokie wykrywanie.

### Pakiety hooków

Pakiety hooków to pakiety npm, które eksportują hooki przez `openclaw.hooks` w `package.json`. Instalacja:

```bash
openclaw plugins install <path-or-spec>
```

Specyfikacje npm są ograniczone do rejestru (nazwa pakietu + opcjonalnie dokładna wersja lub dist-tag). Specyfikacje Git/URL/file oraz zakresy semver są odrzucane.

## Hooki wbudowane

| Hook                  | Zdarzenia                      | Co robi                                                |
| --------------------- | ------------------------------ | ------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset` | Zapisuje kontekst sesji do `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`              | Wstrzykuje dodatkowe pliki bootstrap z wzorców glob    |
| command-logger        | `command`                      | Rejestruje wszystkie polecenia w `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Uruchamia `BOOT.md` przy starcie gateway               |

Włącz dowolny hook wbudowany:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Szczegóły session-memory

Wyodrębnia ostatnie 15 wiadomości użytkownika/asystenta, generuje opisowy slug nazwy pliku przez LLM i zapisuje do `<workspace>/memory/YYYY-MM-DD-slug.md`. Wymaga skonfigurowanego `workspace.dir`.

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

Rejestruje każde polecenie slash do `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Szczegóły boot-md

Uruchamia `BOOT.md` z aktywnego workspace przy starcie gateway.

## Hooki pluginów

Pluginy mogą rejestrować hooki przez Plugin SDK, aby uzyskać głębszą integrację: przechwytywanie wywołań narzędzi, modyfikowanie promptów, sterowanie przepływem wiadomości i nie tylko. Plugin SDK udostępnia 28 hooków obejmujących rozwiązywanie modeli, cykl życia agenta, przepływ wiadomości, wykonywanie narzędzi, koordynację subagentów i cykl życia gateway.

Pełne odniesienie do hooków pluginów, w tym `before_tool_call`, `before_agent_reply`, `before_install` i wszystkich pozostałych hooków pluginów, znajdziesz w [Architekturze pluginów](/pl/plugins/architecture#provider-runtime-hooks).

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
Starszy format konfiguracji tablicy `hooks.internal.handlers` jest nadal obsługiwany dla zachowania kompatybilności wstecznej, ale nowe hooki powinny używać systemu opartego na wykrywaniu.
</Note>

## Dokumentacja CLI

```bash
# Wyświetl wszystkie hooki (dodaj --eligible, --verbose lub --json)
openclaw hooks list

# Pokaż szczegółowe informacje o hooku
openclaw hooks info <hook-name>

# Pokaż podsumowanie kwalifikowalności
openclaw hooks check

# Włącz/wyłącz
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Dobre praktyki

- **Utrzymuj szybkie działanie handlerów.** Hooki są uruchamiane podczas przetwarzania poleceń. Cięższe zadania uruchamiaj w tle bez oczekiwania przez `void processInBackground(event)`.
- **Obsługuj błędy bezpiecznie.** Otaczaj ryzykowne operacje blokami try/catch; nie zgłaszaj wyjątków, aby inne handlery mogły się uruchomić.
- **Filtruj zdarzenia wcześnie.** Natychmiast zwracaj wynik, jeśli typ/akcja zdarzenia nie są istotne.
- **Używaj konkretnych kluczy zdarzeń.** Preferuj `"events": ["command:new"]` zamiast `"events": ["command"]`, aby zmniejszyć narzut.

## Rozwiązywanie problemów

### Hook nie został wykryty

```bash
# Zweryfikuj strukturę katalogu
ls -la ~/.openclaw/hooks/my-hook/
# Powinno pokazać: HOOK.md, handler.ts

# Wyświetl wszystkie wykryte hooki
openclaw hooks list
```

### Hook nie jest kwalifikowalny

```bash
openclaw hooks info my-hook
```

Sprawdź brakujące pliki binarne (PATH), zmienne środowiskowe, wartości konfiguracyjne lub zgodność z systemem operacyjnym.

### Hook nie jest wykonywany

1. Sprawdź, czy hook jest włączony: `openclaw hooks list`
2. Uruchom ponownie proces gateway, aby hooki zostały przeładowane.
3. Sprawdź logi gateway: `./scripts/clawlog.sh | grep hook`

## Powiązane

- [Dokumentacja CLI: hooks](/cli/hooks)
- [Webhooks](/pl/automation/cron-jobs#webhooks)
- [Architektura pluginów](/pl/plugins/architecture#provider-runtime-hooks) — pełne odniesienie do hooków pluginów
- [Konfiguracja](/pl/gateway/configuration-reference#hooks)
