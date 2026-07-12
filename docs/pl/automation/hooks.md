---
read_when:
    - Chcesz automatyzacji sterowanej zdarzeniami dla /new, /reset, /stop oraz zdarzeń cyklu życia agenta
    - Chcesz tworzyć, instalować lub debugować hooki
summary: 'Hooki: automatyzacja sterowana zdarzeniami dla poleceń i zdarzeń cyklu życia'
title: Hooki
x-i18n:
    generated_at: "2026-07-12T14:51:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Hooki to małe skrypty uruchamiane wewnątrz Gateway po wystąpieniu zdarzeń agenta: poleceń takich jak `/new`, `/reset`, `/stop`, Compaction sesji, zdarzeń cyklu życia Gateway oraz przepływu wiadomości. Są wykrywane w katalogach i zarządzane za pomocą `openclaw hooks`. Gateway ładuje wewnętrzne hooki dopiero po ich włączeniu lub skonfigurowaniu co najmniej jednego wpisu hooka, pakietu hooków, starszego mechanizmu obsługi albo dodatkowego katalogu hooków.

W OpenClaw istnieją dwa rodzaje hooków:

- **Wewnętrzne hooki** (ta strona): działają wewnątrz Gateway po wystąpieniu zdarzeń agenta.
- **Webhooki**: zewnętrzne punkty końcowe HTTP, które umożliwiają innym systemom uruchamianie zadań w OpenClaw. Zobacz [Webhooki](/pl/automation/cron-jobs#webhooks).

Hooki mogą być również dołączane do pluginów. `openclaw hooks list` wyświetla zarówno samodzielne hooki, jak i hooki zarządzane przez pluginy (wyświetlane jako `plugin:<id>`).

## Wybór odpowiedniego mechanizmu rozszerzeń

OpenClaw udostępnia kilka podobnych mechanizmów rozszerzeń, które rozwiązują różne problemy:

| Jeśli chcesz...                                                                                                                              | Użyj...                                          | Dlaczego                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Zapisać migawkę przy `/new`, zarejestrować `/reset`, wywołać zewnętrzne API po `message:sent` lub dodać ogólną automatyzację operatorską        | Wewnętrznych hooków (`HOOK.md`, ta strona)       | Hooki oparte na plikach służą do zarządzanych przez operatora efektów ubocznych oraz automatyzacji poleceń i cyklu życia |
| Przepisywać prompty, blokować narzędzia, anulować wiadomości wychodzące lub dodawać uporządkowane oprogramowanie pośredniczące albo zasady      | Typowanych hooków pluginów przez `api.on(...)`   | Typowane hooki mają jawne kontrakty, priorytety, reguły scalania oraz semantykę blokowania i anulowania                 |
| Dodać eksport wyłącznie telemetryczny lub obserwowalność                                                                                      | Zdarzeń diagnostycznych                          | Obserwowalność korzysta z osobnej magistrali zdarzeń i nie jest mechanizmem hooków zasad                               |

Używaj wewnętrznych hooków, gdy potrzebujesz automatyzacji działającej jak mała zainstalowana integracja. Używaj typowanych hooków pluginów, gdy potrzebujesz kontroli nad cyklem życia środowiska uruchomieniowego.

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

Hooki subskrybują określony klucz z tej tabeli albo samą nazwę rodziny
(`command`, `session`, `agent`, `gateway`, `message`), aby otrzymywać wszystkie akcje
z tej rodziny. Rdzeń OpenClaw nie emituje żadnych innych zdarzeń, więc każda inna nazwa jest niemal
zawsze literówką, przez którą hook pozostaje bezczynny bez żadnego komunikatu (może go uruchomić tylko plugin emitujący
niestandardowe zdarzenie). Mechanizm ładowania hooków rejestruje ostrzeżenie dla takich nazw
(na przykład `command:nwe`), a `openclaw hooks info <name>` je oznacza, dzięki czemu
można zdiagnozować hook, który nigdy się nie uruchamia.

| Zdarzenie                | Kiedy jest wyzwalane                                         |
| ------------------------ | ------------------------------------------------------------ |
| `command:new`            | Wydano polecenie `/new`                                      |
| `command:reset`          | Wydano polecenie `/reset`                                    |
| `command:stop`           | Wydano polecenie `/stop`                                     |
| `command`                | Dowolne zdarzenie polecenia (ogólny odbiornik)                |
| `session:compact:before` | Zanim Compaction podsumuje historię                           |
| `session:compact:after`  | Po zakończeniu Compaction                                    |
| `session:patch`          | Po zmodyfikowaniu właściwości sesji                           |
| `agent:bootstrap`        | Przed wstrzyknięciem plików inicjalizacyjnych obszaru roboczego |
| `gateway:startup`        | Po uruchomieniu kanałów i załadowaniu hooków                  |
| `gateway:shutdown`       | Gdy rozpoczyna się zamykanie Gateway                          |
| `gateway:pre-restart`    | Przed oczekiwanym ponownym uruchomieniem Gateway              |
| `message:received`       | Wiadomość przychodząca z dowolnego kanału                     |
| `message:transcribed`    | Po zakończeniu transkrypcji dźwięku                           |
| `message:preprocessed`   | Po zakończeniu lub pominięciu wstępnego przetwarzania multimediów i odnośników |
| `message:sent`           | Podjęto próbę wysłania wiadomości wychodzącej (wynik znajduje się w `context.success`) |

## Pisanie hooków

### Struktura hooka

Każdy hook jest katalogiem zawierającym dwa pliki:

```text
my-hook/
├── HOOK.md          # Metadane i dokumentacja
└── handler.ts       # Implementacja mechanizmu obsługi
```

Plik mechanizmu obsługi może mieć nazwę `handler.ts`, `handler.js`, `index.ts` lub `index.js`.

### Format HOOK.md

```markdown
---
name: my-hook
description: "Krótki opis działania tego hooka"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Mój hook

Tutaj znajduje się szczegółowa dokumentacja.
```

**Pola metadanych** (`metadata.openclaw`):

| Pole       | Opis                                                   |
| ---------- | ------------------------------------------------------ |
| `emoji`    | Emoji wyświetlane w CLI                                |
| `events`   | Tablica nasłuchiwanych zdarzeń                         |
| `export`   | Nazwany eksport do użycia (domyślnie `"default"`)      |
| `os`       | Wymagane platformy (np. `["darwin", "linux"]`)         |
| `requires` | Wymagane ścieżki `bins`, `anyBins`, `env` lub `config` |
| `always`   | Pominięcie kontroli kwalifikowalności (wartość logiczna) |
| `hookKey`  | Zastąpienie klucza konfiguracji (domyślnie nazwa hooka) |
| `homepage` | Adres URL dokumentacji wyświetlany przez `openclaw hooks info` |
| `install`  | Metody instalacji                                      |

### Implementacja mechanizmu obsługi

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

Każde zdarzenie zawiera: `type`, `action`, `sessionKey`, `timestamp`, `messages` oraz `context` (dane właściwe dla danego zdarzenia). Konteksty typowanych hooków pluginów dla hooków agenta i narzędzi mogą również zawierać `trace` — przeznaczony tylko do odczytu, zgodny z W3C kontekst śledzenia diagnostycznego, który pluginy mogą przekazywać do ustrukturyzowanych dzienników w celu korelacji OTEL.

Ciągi znaków dodane do `event.messages` są dostarczane z powrotem do czatu tylko dla
`command:new` i `command:reset` (kierowane jako odpowiedź do rozmowy źródłowej)
oraz dla `session:compact:before` / `session:compact:after`
(wysyłane jako powiadomienia o stanie Compaction). Wszystkie pozostałe zdarzenia, w tym
`command:stop`, `message:*`, `agent:bootstrap`, `session:patch` i
`gateway:*`, ignorują dodane wiadomości.

### Najważniejsze elementy kontekstu zdarzeń

**Zdarzenia poleceń** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.senderId`, `context.workspaceDir`, `context.cfg`.

**Zdarzenia poleceń** (`command:stop`): `context.sessionEntry`, `context.sessionId`, `context.commandSource`, `context.senderId`.

**Zdarzenia wiadomości** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dane właściwe dla dostawcy, w tym `senderId`, `senderName`, `guildId`). `context.content` w przypadku wiadomości przypominających polecenia preferuje niepustą treść polecenia, a następnie używa nieprzetworzonej treści wiadomości przychodzącej lub treści ogólnej; nie zawiera wzbogaceń przeznaczonych wyłącznie dla agenta, takich jak historia wątku lub podsumowania odnośników.

**Zdarzenia wiadomości** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId` oraz `context.error`, gdy wysyłanie się nie powiodło.

**Zdarzenia wiadomości** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Zdarzenia wiadomości** (`message:preprocessed`): `context.bodyForAgent` (ostateczna wzbogacona treść), `context.from`, `context.channelId`.

**Zdarzenia inicjalizacji** (`agent:bootstrap`): `context.bootstrapFiles` (modyfikowalna tablica), `context.agentId`.

**Zdarzenia aktualizacji sesji** (`session:patch`): `context.sessionEntry`, `context.patch` (tylko zmienione pola), `context.cfg`. Zdarzenia aktualizacji mogą wyzwalać tylko klienci uprzywilejowani; kontekst jest kopią, dlatego mechanizmy obsługi nie mogą modyfikować aktywnego wpisu sesji.

**Zdarzenia Compaction**: `session:compact:before` zawiera `messageCount`, `tokenCount`. `session:compact:after` dodaje `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` obserwuje wydanie przez użytkownika polecenia `/stop`; dotyczy anulowania i cyklu życia
polecenia, a nie bramki finalizacji agenta. Pluginy, które muszą sprawdzić
naturalną odpowiedź końcową i poprosić agenta o jeszcze jeden przebieg, powinny zamiast tego używać typowanego
hooka pluginu `before_agent_finalize`. Zobacz [Hooki pluginów](/pl/plugins/hooks).

**Zdarzenia cyklu życia Gateway**: `gateway:shutdown` zawiera `reason` i `restartExpectedMs` oraz jest wyzwalane, gdy rozpoczyna się zamykanie Gateway. `gateway:pre-restart` zawiera ten sam kontekst, ale jest wyzwalane tylko wtedy, gdy zamykanie stanowi część oczekiwanego ponownego uruchomienia i podano skończoną wartość `restartExpectedMs`. Podczas zamykania oczekiwanie na każdy hook cyklu życia odbywa się w miarę możliwości i ma ograniczony czas, dzięki czemu zamykanie jest kontynuowane, jeśli mechanizm obsługi przestanie odpowiadać. Domyślny limit oczekiwania wynosi 5 sekund dla `gateway:shutdown` i 10 sekund dla `gateway:pre-restart`.

Użyj `gateway:pre-restart` do wysyłania krótkich powiadomień o ponownym uruchomieniu, gdy kanały są nadal dostępne:

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

Pomiędzy zdarzeniem `gateway:shutdown` (lub `gateway:pre-restart`) a pozostałą częścią sekwencji zamykania Gateway wyzwala również typowany hook pluginu `session_end` dla każdej sesji, która pozostawała aktywna w chwili zatrzymania procesu. Wartość `reason` tego zdarzenia to `shutdown` w przypadku zwykłego zatrzymania sygnałem SIGTERM/SIGINT oraz `restart`, gdy zamknięcie zaplanowano jako część oczekiwanego ponownego uruchomienia. To opróżnianie ma ograniczony czas, dzięki czemu powolny mechanizm obsługi `session_end` nie może zablokować zakończenia procesu, a sesje, które zostały już sfinalizowane przez zastąpienie, zresetowanie, usunięcie lub Compaction, są pomijane, aby uniknąć podwójnego wyzwolenia.

## Wykrywanie hooków

Hooki są wykrywane z czterech źródeł:

1. **Dołączone hooki**: dostarczane z OpenClaw
2. **Hooki pluginów**: dołączone do zainstalowanych pluginów; mogą zastępować dołączone hooki o tej samej nazwie
3. **Zarządzane hooki**: `~/.openclaw/hooks/` (instalowane przez użytkownika i współdzielone między obszarami roboczymi); mogą zastępować dołączone hooki i hooki pluginów. Dodatkowe katalogi z `hooks.internal.load.extraDirs` mają ten sam priorytet.
4. **Hooki obszaru roboczego**: `<workspace>/hooks/` (dla poszczególnych agentów, domyślnie wyłączone do czasu jawnego włączenia)

Hooki obszaru roboczego mogą dodawać nowe nazwy hooków, ale nie mogą zastępować dołączonych, zarządzanych ani udostępnianych przez pluginy hooków o tej samej nazwie.

Gateway pomija wykrywanie wewnętrznych hooków podczas uruchamiania, dopóki nie zostaną one skonfigurowane. Włącz dołączony lub zarządzany hook za pomocą `openclaw hooks enable <name>`, zainstaluj pakiet hooków albo ustaw `hooks.internal.enabled=true`, aby wyrazić zgodę. Po włączeniu jednego nazwanego hooka Gateway ładuje tylko jego mechanizm obsługi; `hooks.internal.enabled=true`, dodatkowe katalogi hooków i starsze mechanizmy obsługi włączają szerokie wykrywanie.

### Pakiety hooków

Pakiety hooków to pakiety npm, które eksportują hooki za pomocą `openclaw.hooks` w pliku `package.json`. Zainstaluj je za pomocą:

```bash
openclaw plugins install <path-or-spec>
```

Specyfikacje npm mogą wskazywać wyłącznie rejestr (nazwa pakietu oraz opcjonalnie dokładna wersja lub dist-tag). Specyfikacje Git/URL/plik oraz zakresy semver są odrzucane. Starsze polecenia `openclaw hooks install` i `openclaw hooks update` są przestarzałymi aliasami poleceń `openclaw plugins install` / `openclaw plugins update`.

## Dołączone hooki

| Hook                  | Zdarzenia                                         | Działanie                                                       |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Zapisuje kontekst sesji w `<workspace>/memory/`                  |
| bootstrap-extra-files | `agent:bootstrap`                                 | Wstrzykuje dodatkowe pliki rozruchowe zgodne ze wzorcami glob   |
| command-logger        | `command`                                         | Rejestruje wszystkie polecenia w `~/.openclaw/logs/commands.log` |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Wysyła widoczne powiadomienia na czacie o rozpoczęciu/zakończeniu Compaction sesji |
| boot-md               | `gateway:startup`                                 | Uruchamia `BOOT.md` podczas uruchamiania Gateway                 |

Włącz dowolny dołączony hook:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Szczegóły session-memory

Wyodrębnia ostatnie wiadomości użytkownika i asystenta (domyślnie 15, wartość konfigurowalna za pomocą `hooks.internal.entries.session-memory.messages`) i zapisuje je w `<workspace>/memory/YYYY-MM-DD-HHMM.md`, używając lokalnej daty hosta. Przechwytywanie pamięci odbywa się w tle, dzięki czemu odczyty transkrypcji ani opcjonalne generowanie uproszczonej nazwy nie opóźniają potwierdzeń `/new` i `/reset`. Ustaw `hooks.internal.entries.session-memory.llmSlug: true`, aby generować opisowe uproszczone nazwy plików, a opcjonalnie ustaw `hooks.internal.entries.session-memory.model` na skonfigurowany alias, taki jak `sonnet`, sam identyfikator modelu u domyślnego dostawcy agenta lub odwołanie `provider/model`. Jeśli pominięto `model`, generowanie uproszczonej nazwy używa domyślnego modelu agenta, a gdy jest on niedostępny, stosuje uproszczone nazwy ze znacznikiem czasu. Wymaga skonfigurowania `workspace.dir`.

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

`patterns` i `files` są akceptowane jako aliasy `paths`. Ścieżki są rozwiązywane względem obszaru roboczego i muszą pozostawać w jego obrębie. Ładowane są wyłącznie rozpoznawane nazwy bazowe plików rozruchowych (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Szczegóły command-logger

Rejestruje każde polecenie z ukośnikiem jako wiersz JSON (znacznik czasu, działanie, klucz sesji, identyfikator nadawcy, źródło) w `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Szczegóły compaction-notifier

Wysyła krótkie komunikaty o stanie do bieżącej rozmowy, gdy OpenClaw rozpoczyna i kończy Compaction transkrypcji sesji. Dzięki temu długie tury są mniej dezorientujące w interfejsach czatu, ponieważ użytkownik widzi, że asystent podsumowuje kontekst i będzie kontynuował po zakończeniu Compaction.

<a id="boot-md"></a>

### Szczegóły boot-md

Uruchamia `BOOT.md` podczas uruchamiania Gateway dla każdego skonfigurowanego zakresu agenta, jeśli plik istnieje w rozwiązanym obszarze roboczym tego agenta.

## Hooki Pluginów

Pluginy mogą rejestrować typowane hooki za pośrednictwem Plugin SDK w celu głębszej integracji:
przechwytywania wywołań narzędzi, modyfikowania promptów, sterowania przepływem wiadomości i nie tylko.
Używaj hooków Pluginów, gdy potrzebujesz `before_tool_call`, `before_agent_reply`,
`before_install` lub innych hooków cyklu życia działających wewnątrz procesu.

Wewnętrzne hooki zarządzane przez Pluginy działają inaczej: uczestniczą w opisanym na tej stronie
ogólnym systemie zdarzeń poleceń i cyklu życia oraz pojawiają się w `openclaw hooks list` jako
`plugin:<id>`. Używaj ich do efektów ubocznych i zapewniania zgodności z pakietami hooków, a nie
jako uporządkowanego oprogramowania pośredniczącego ani bram zasad.

Pełną dokumentację hooków Pluginów zawiera strona [Hooki Pluginów](/pl/plugins/hooks).

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

Wartości środowiskowe poszczególnych hooków spełniają warunki kwalifikacji `requires.env` danego hooka (wraz ze środowiskiem procesu), a procedury obsługi mogą je odczytać z wpisu konfiguracji hooka:

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
Starszy format konfiguracji tablicy `hooks.internal.handlers` jest nadal obsługiwany w celu zachowania zgodności wstecznej, ale nowe hooki powinny korzystać z systemu opartego na wykrywaniu.
</Note>

## Dokumentacja CLI

```bash
# Wyświetl wszystkie hooki (dodaj --eligible, --verbose lub --json)
openclaw hooks list

# Wyświetl szczegółowe informacje o hooku
openclaw hooks info <hook-name>

# Wyświetl podsumowanie kwalifikacji
openclaw hooks check

# Włącz/wyłącz
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Dobre praktyki

- **Dbaj o szybkość procedur obsługi.** Hooki działają podczas przetwarzania poleceń. Uruchamiaj ciężkie zadania w tle bez oczekiwania na ich wynik za pomocą `void processInBackground(event)`.
- **Poprawnie obsługuj błędy.** Otaczaj ryzykowne operacje blokiem try/catch; nie zgłaszaj wyjątków, aby inne procedury obsługi mogły działać.
- **Filtruj zdarzenia wcześnie.** Natychmiast zakończ działanie, jeśli typ lub działanie zdarzenia nie jest istotne.
- **Używaj szczegółowych kluczy zdarzeń.** Preferuj `"events": ["command:new"]` zamiast `"events": ["command"]`, aby zmniejszyć narzut.

## Rozwiązywanie problemów

### Hook nie został wykryty

```bash
# Sprawdź strukturę katalogu
ls -la ~/.openclaw/hooks/my-hook/
# Powinny być widoczne: HOOK.md, handler.ts

# Wyświetl wszystkie wykryte hooki
openclaw hooks list
```

### Hook nie spełnia warunków

```bash
openclaw hooks info my-hook
```

Sprawdź brakujące pliki wykonywalne (PATH), zmienne środowiskowe, wartości konfiguracji lub zgodność z systemem operacyjnym.

### Hook nie jest wykonywany

1. Sprawdź, czy hook jest włączony: `openclaw hooks list`
2. Uruchom ponownie proces Gateway, aby ponownie załadować hooki.
3. Sprawdź dzienniki Gateway: `openclaw logs --follow | grep -i hook`

## Powiązane materiały

- [Dokumentacja CLI: hooki](/pl/cli/hooks)
- [Webhooki](/pl/automation/cron-jobs#webhooks)
- [Hooki Pluginów](/pl/plugins/hooks) — hooki cyklu życia Pluginów działające wewnątrz procesu
- [Konfiguracja](/pl/gateway/configuration-reference#hooks)
