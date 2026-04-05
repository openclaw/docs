---
read_when:
    - Chcesz używać automatyzacji sterowanej zdarzeniami dla /new, /reset, /stop i zdarzeń cyklu życia agenta
    - Chcesz tworzyć, instalować lub debugować hooki
summary: 'Hooki: automatyzacja sterowana zdarzeniami dla poleceń i zdarzeń cyklu życia'
title: Hooki
x-i18n:
    generated_at: "2026-04-05T13:42:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eb75bb2b3b2ad229bf3da24fdb0fe021ed08f812fd1d13c69b3bd9df0218e5
    source_path: automation/hooks.md
    workflow: 15
---

# Hooki

Hooki to małe skrypty uruchamiane, gdy coś wydarzy się wewnątrz Gateway. Są automatycznie wykrywane z katalogów i można je sprawdzać za pomocą `openclaw hooks`.

W OpenClaw są dwa rodzaje hooków:

- **Hooki wewnętrzne** (ta strona): uruchamiane wewnątrz Gateway, gdy wystąpią zdarzenia agenta, takie jak `/new`, `/reset`, `/stop` lub zdarzenia cyklu życia.
- **Webhooki**: zewnętrzne punkty końcowe HTTP, które pozwalają innym systemom wywoływać działania w OpenClaw. Zobacz [Webhooki](/automation/cron-jobs#webhooks).

Hooki mogą też być dołączane do pluginów. `openclaw hooks list` pokazuje zarówno hooki samodzielne, jak i hooki zarządzane przez pluginy.

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

| Zdarzenie                | Kiedy jest wywoływane                           |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | wydanie polecenia `/new`                        |
| `command:reset`          | wydanie polecenia `/reset`                      |
| `command:stop`           | wydanie polecenia `/stop`                       |
| `command`                | dowolne zdarzenie polecenia (ogólny listener)   |
| `session:compact:before` | przed podsumowaniem historii przez kompaktowanie |
| `session:compact:after`  | po zakończeniu kompaktowania                    |
| `session:patch`          | gdy właściwości sesji są modyfikowane           |
| `agent:bootstrap`        | przed wstrzyknięciem plików bootstrap workspace |
| `gateway:startup`        | po uruchomieniu kanałów i załadowaniu hooków    |
| `message:received`       | wiadomość przychodząca z dowolnego kanału       |
| `message:transcribed`    | po zakończeniu transkrypcji audio               |
| `message:preprocessed`   | po zakończeniu przetwarzania mediów i linków    |
| `message:sent`           | dostarczenie wiadomości wychodzącej             |

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

# Mój hook

Tutaj znajduje się szczegółowa dokumentacja.
```

**Pola metadanych** (`metadata.openclaw`):

| Pole       | Opis                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji wyświetlane w CLI                              |
| `events`   | Tablica zdarzeń do nasłuchiwania                     |
| `export`   | Nazwany eksport do użycia (domyślnie `"default"`)    |
| `os`       | Wymagane platformy (np. `["darwin", "linux"]`)       |
| `requires` | Wymagane ścieżki `bins`, `anyBins`, `env` lub `config` |
| `always`   | Pomija sprawdzanie kwalifikowalności (boolean)       |
| `install`  | Metody instalacji                                    |

### Implementacja handlera

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] Wywołano nowe polecenie`);
  // Twoja logika tutaj

  // Opcjonalnie wyślij wiadomość do użytkownika
  event.messages.push("Hook został wykonany!");
};

export default handler;
```

Każde zdarzenie zawiera: `type`, `action`, `sessionKey`, `timestamp`, `messages` (dodaj przez push, aby wysłać do użytkownika) oraz `context` (dane specyficzne dla zdarzenia).

### Najważniejsze elementy kontekstu zdarzeń

**Zdarzenia poleceń** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Zdarzenia wiadomości** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dane specyficzne dla providera, w tym `senderId`, `senderName`, `guildId`).

**Zdarzenia wiadomości** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Zdarzenia wiadomości** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Zdarzenia wiadomości** (`message:preprocessed`): `context.bodyForAgent` (końcowa wzbogacona treść), `context.from`, `context.channelId`.

**Zdarzenia bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (mutowalna tablica), `context.agentId`.

**Zdarzenia patch sesji** (`session:patch`): `context.sessionEntry`, `context.patch` (tylko zmienione pola), `context.cfg`. Zdarzenia patch mogą wywoływać tylko klienci uprzywilejowani.

**Zdarzenia kompaktowania**: `session:compact:before` zawiera `messageCount`, `tokenCount`. `session:compact:after` dodatkowo zawiera `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Wykrywanie hooków

Hooki są wykrywane z tych katalogów, w kolejności rosnącego priorytetu nadpisywania:

1. **Hooki dołączone**: dostarczane z OpenClaw
2. **Hooki pluginów**: hooki dołączone wewnątrz zainstalowanych pluginów
3. **Hooki zarządzane**: `~/.openclaw/hooks/` (instalowane przez użytkownika, współdzielone między workspace). Dodatkowe katalogi z `hooks.internal.load.extraDirs` mają ten sam priorytet.
4. **Hooki workspace**: `<workspace>/hooks/` (per-agent, domyślnie wyłączone do czasu jawnego włączenia)

Hooki workspace mogą dodawać nowe nazwy hooków, ale nie mogą nadpisywać hooków dołączonych, zarządzanych ani dostarczanych przez pluginy o tej samej nazwie.

### Pakiety hooków

Pakiety hooków to pakiety npm, które eksportują hooki przez `openclaw.hooks` w `package.json`. Instalacja:

```bash
openclaw plugins install <path-or-spec>
```

Specyfikacje npm są ograniczone do rejestru (nazwa pakietu + opcjonalna dokładna wersja lub dist-tag). Specyfikacje Git/URL/file i zakresy semver są odrzucane.

## Hooki dołączone

| Hook                  | Zdarzenia                      | Co robi                                               |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Zapisuje kontekst sesji do `<workspace>/memory/`      |
| bootstrap-extra-files | `agent:bootstrap`              | Wstrzykuje dodatkowe pliki bootstrap z wzorców glob   |
| command-logger        | `command`                      | Rejestruje wszystkie polecenia do `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Uruchamia `BOOT.md`, gdy gateway się uruchamia        |

Włącz dowolny dołączony hook:

```bash
openclaw hooks enable <hook-name>
```

### Szczegóły session-memory

Wyodrębnia ostatnie 15 wiadomości użytkownika/asystenta, generuje opisowy slug nazwy pliku za pomocą LLM i zapisuje do `<workspace>/memory/YYYY-MM-DD-slug.md`. Wymaga skonfigurowanego `workspace.dir`.

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

Ścieżki są rozwiązywane względem workspace. Ładowane są tylko rozpoznawane nazwy bazowe plików bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

## Hooki pluginów

Pluginy mogą rejestrować hooki przez Plugin SDK, aby zapewnić głębszą integrację: przechwytywanie wywołań narzędzi, modyfikowanie promptów, kontrolowanie przepływu wiadomości i nie tylko. Plugin SDK udostępnia 28 hooków obejmujących rozpoznawanie modeli, cykl życia agenta, przepływ wiadomości, wykonywanie narzędzi, koordynację subagentów i cykl życia Gateway.

Pełne odniesienie do hooków pluginów, w tym `before_tool_call`, `before_agent_reply`, `before_install` i wszystkich pozostałych hooków pluginów, znajdziesz w [Architektura pluginów](/plugins/architecture#provider-runtime-hooks).

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

Zmienne środowiskowe per hook:

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
Starszy format konfiguracji tablicy `hooks.internal.handlers` jest nadal obsługiwany dla zachowania zgodności wstecznej, ale nowe hooki powinny używać systemu opartego na wykrywaniu.
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

- **Utrzymuj handlery szybkie.** Hooki działają podczas przetwarzania poleceń. Ciężkie zadania uruchamiaj w tle bez oczekiwania przez `void processInBackground(event)`.
- **Obsługuj błędy w sposób bezpieczny.** Opakuj ryzykowne operacje w try/catch; nie rzucaj wyjątków, aby inne handlery mogły działać dalej.
- **Filtruj zdarzenia wcześnie.** Natychmiast wróć, jeśli typ/akcja zdarzenia nie jest istotna.
- **Używaj konkretnych kluczy zdarzeń.** Preferuj `"events": ["command:new"]` zamiast `"events": ["command"]`, aby zmniejszyć narzut.

## Rozwiązywanie problemów

### Hook nie został wykryty

```bash
# Zweryfikuj strukturę katalogu
ls -la ~/.openclaw/hooks/my-hook/
# Powinno wyświetlić: HOOK.md, handler.ts

# Wyświetl wszystkie wykryte hooki
openclaw hooks list
```

### Hook nie jest kwalifikowalny

```bash
openclaw hooks info my-hook
```

Sprawdź brakujące pliki binarne (PATH), zmienne środowiskowe, wartości konfiguracji lub zgodność z systemem operacyjnym.

### Hook się nie wykonuje

1. Sprawdź, czy hook jest włączony: `openclaw hooks list`
2. Uruchom ponownie proces gateway, aby hooki zostały przeładowane.
3. Sprawdź logi gateway: `./scripts/clawlog.sh | grep hook`

## Powiązane

- [Dokumentacja CLI: hooks](/cli/hooks)
- [Webhooki](/automation/cron-jobs#webhooks)
- [Architektura pluginów](/plugins/architecture#provider-runtime-hooks) — pełne odniesienie do hooków pluginów
- [Konfiguracja](/gateway/configuration-reference#hooks)
