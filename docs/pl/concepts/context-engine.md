---
read_when:
    - Chcesz zrozumieć, jak OpenClaw składa kontekst modelu.
    - Przełączasz się między starszym silnikiem a silnikiem Pluginu.
    - Tworzysz Plugin silnika kontekstu.
summary: 'Silnik kontekstu: rozszerzalne składanie kontekstu, Compaction i cykl życia subagentów'
title: Silnik kontekstu
x-i18n:
    generated_at: "2026-04-24T09:05:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f4e5f01f945f7fe3056587f2aa60bec607dd0dd64b29e9ab2afe8e77b5d2f1e
    source_path: concepts/context-engine.md
    workflow: 15
---

**Silnik kontekstu** kontroluje, jak OpenClaw buduje kontekst modelu dla każdego uruchomienia:
które wiadomości uwzględnić, jak podsumowywać starszą historię oraz jak zarządzać
kontekstem między granicami subagentów.

OpenClaw zawiera wbudowany silnik `legacy` i używa go domyślnie — większość
użytkowników nigdy nie musi tego zmieniać. Instaluj i wybieraj silnik Pluginu tylko wtedy,
gdy chcesz innego składania, Compaction albo zachowania przypominania między sesjami.

## Szybki start

Sprawdź, który silnik jest aktywny:

```bash
openclaw doctor
# or inspect config directly:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Instalowanie Pluginu silnika kontekstu

Pluginy silnika kontekstu instaluje się tak samo jak każdy inny Plugin OpenClaw. Najpierw
zainstaluj, a potem wybierz silnik w slocie:

```bash
# Install from npm
openclaw plugins install @martian-engineering/lossless-claw

# Or install from a local path (for development)
openclaw plugins install -l ./my-context-engine
```

Następnie włącz Plugin i wybierz go jako aktywny silnik w konfiguracji:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // must match the plugin's registered engine id
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin-specific config goes here (see the plugin's docs)
      },
    },
  },
}
```

Po instalacji i konfiguracji uruchom ponownie gateway.

Aby wrócić do wbudowanego silnika, ustaw `contextEngine` na `"legacy"` (albo
całkowicie usuń ten klucz — `"legacy"` jest wartością domyślną).

## Jak to działa

Za każdym razem, gdy OpenClaw uruchamia prompt modelu, silnik kontekstu uczestniczy
w czterech punktach cyklu życia:

1. **Ingest** — wywoływany, gdy nowa wiadomość zostaje dodana do sesji. Silnik
   może zapisać lub zindeksować wiadomość we własnym magazynie danych.
2. **Assemble** — wywoływany przed każdym uruchomieniem modelu. Silnik zwraca uporządkowany
   zestaw wiadomości (i opcjonalny `systemPromptAddition`), które mieszczą się
   w budżecie tokenów.
3. **Compact** — wywoływany, gdy okno kontekstu jest pełne albo gdy użytkownik uruchomi
   `/compact`. Silnik podsumowuje starszą historię, aby zwolnić miejsce.
4. **After turn** — wywoływany po zakończeniu uruchomienia. Silnik może utrwalić stan,
   uruchomić Compaction w tle albo zaktualizować indeksy.

Dla dołączonej nie-ACP uprzęży Codex OpenClaw stosuje ten sam cykl życia przez
rzutowanie złożonego kontekstu na instrukcje deweloperskie Codex i prompt bieżącej
tury. Codex nadal zarządza swoją natywną historią wątków i natywnym kompaktorem.

### Cykl życia subagentów (opcjonalnie)

OpenClaw wywołuje dwa opcjonalne hooki cyklu życia subagentów:

- **prepareSubagentSpawn** — przygotowuje współdzielony stan kontekstu przed rozpoczęciem
  uruchomienia podrzędnego. Hook otrzymuje klucze sesji rodzica/potomka, `contextMode`
  (`isolated` albo `fork`), dostępne identyfikatory/pliki transkryptów oraz opcjonalny TTL.
  Jeśli zwróci uchwyt rollbacku, OpenClaw wywoła go, gdy utworzenie zakończy się błędem po
  pomyślnym przygotowaniu.
- **onSubagentEnded** — czyści zasoby po zakończeniu sesji subagenta albo po jej usunięciu.

### Dodatek do promptu systemowego

Metoda `assemble` może zwrócić ciąg `systemPromptAddition`. OpenClaw
dodaje go na początku promptu systemowego dla uruchomienia. Dzięki temu silniki mogą wstrzykiwać
dynamiczne wskazówki przypominania, instrukcje pobierania albo podpowiedzi zależne od kontekstu
bez wymagania statycznych plików workspace.

## Silnik legacy

Wbudowany silnik `legacy` zachowuje oryginalne działanie OpenClaw:

- **Ingest**: no-op (menedżer sesji bezpośrednio obsługuje utrwalanie wiadomości).
- **Assemble**: pass-through (istniejący pipeline sanitize → validate → limit
  w runtime obsługuje składanie kontekstu).
- **Compact**: deleguje do wbudowanego podsumowującego Compaction, który tworzy
  jedno podsumowanie starszych wiadomości i zachowuje nienaruszone wiadomości recent.
- **After turn**: no-op.

Silnik legacy nie rejestruje narzędzi ani nie udostępnia `systemPromptAddition`.

Gdy `plugins.slots.contextEngine` nie jest ustawione (albo jest ustawione na `"legacy"`), ten
silnik jest używany automatycznie.

## Silniki Pluginów

Plugin może zarejestrować silnik kontekstu przez API Pluginów:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Następnie włącz go w konfiguracji:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### Interfejs ContextEngine

Wymagane składowe:

| Składowa          | Rodzaj     | Cel                                                        |
| ----------------- | ---------- | ---------------------------------------------------------- |
| `info`            | Właściwość | Identyfikator silnika, nazwa, wersja i informacja, czy zarządza Compaction |
| `ingest(params)`  | Metoda     | Zapisuje pojedynczą wiadomość                              |
| `assemble(params)`| Metoda     | Buduje kontekst dla uruchomienia modelu (zwraca `AssembleResult`) |
| `compact(params)` | Metoda     | Podsumowuje/redukuje kontekst                              |

`assemble` zwraca `AssembleResult` zawierający:

- `messages` — uporządkowane wiadomości do wysłania do modelu.
- `estimatedTokens` (wymagane, `number`) — oszacowanie silnika dotyczące łącznej
  liczby tokenów w złożonym kontekście. OpenClaw używa tego do decyzji o progach Compaction
  i raportowania diagnostycznego.
- `systemPromptAddition` (opcjonalne, `string`) — dodawane na początek promptu systemowego.

Opcjonalne składowe:

| Składowa                     | Rodzaj | Cel                                                                                                              |
| ---------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`          | Metoda | Inicjalizuje stan silnika dla sesji. Wywoływana raz, gdy silnik po raz pierwszy widzi sesję (np. import historii). |
| `ingestBatch(params)`        | Metoda | Zapisuje ukończoną turę jako batch. Wywoływana po zakończeniu uruchomienia, ze wszystkimi wiadomościami z tej tury naraz. |
| `afterTurn(params)`          | Metoda | Praca po uruchomieniu (utrwalanie stanu, uruchamianie Compaction w tle).                                        |
| `prepareSubagentSpawn(params)` | Metoda | Konfiguruje współdzielony stan dla sesji potomnej przed jej startem.                                           |
| `onSubagentEnded(params)`    | Metoda | Czyści zasoby po zakończeniu subagenta.                                                                          |
| `dispose()`                  | Metoda | Zwolnienie zasobów. Wywoływana podczas zamykania gateway albo przeładowania Pluginu — nie per sesja.           |

### ownsCompaction

`ownsCompaction` kontroluje, czy wbudowany automatyczny in-attempt auto-compaction Pi
pozostaje włączony dla uruchomienia:

- `true` — silnik zarządza zachowaniem Compaction. OpenClaw wyłącza wbudowany automatyczny
  auto-compaction Pi dla tego uruchomienia, a implementacja `compact()` silnika jest
  odpowiedzialna za `/compact`, overflow recovery compaction oraz każdy proaktywny
  Compaction, który chce wykonywać w `afterTurn()`.
- `false` albo brak ustawienia — wbudowany auto-compaction Pi może nadal działać podczas
  wykonywania promptu, ale metoda `compact()` aktywnego silnika nadal jest wywoływana dla
  `/compact` i overflow recovery.

`ownsCompaction: false` **nie** oznacza, że OpenClaw automatycznie wraca do
ścieżki Compaction silnika legacy.

To oznacza, że istnieją dwa poprawne wzorce dla Pluginów:

- **Tryb zarządzający** — zaimplementuj własny algorytm Compaction i ustaw
  `ownsCompaction: true`.
- **Tryb delegujący** — ustaw `ownsCompaction: false` i spraw, by `compact()` wywoływało
  `delegateCompactionToRuntime(...)` z `openclaw/plugin-sdk/core`, aby użyć
  wbudowanego zachowania Compaction OpenClaw.

No-op `compact()` jest niebezpieczne dla aktywnego niezarządzającego silnika, ponieważ
wyłącza normalną ścieżkę `/compact` i overflow recovery compaction dla tego
slotu silnika.

## Dokumentacja konfiguracji

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

Slot jest wyłączny w czasie działania — tylko jeden zarejestrowany silnik kontekstu jest
rozwiązywany dla danego uruchomienia albo operacji Compaction. Inne włączone
Pluginy `kind: "context-engine"` nadal mogą się ładować i uruchamiać swój kod
rejestracji; `plugins.slots.contextEngine` wybiera tylko to, który zarejestrowany identyfikator silnika
OpenClaw rozwiązuje, gdy potrzebuje silnika kontekstu.

## Relacja do Compaction i pamięci

- **Compaction** to jedna z odpowiedzialności silnika kontekstu. Silnik legacy
  deleguje do wbudowanego podsumowywania OpenClaw. Silniki Pluginów mogą implementować
  dowolną strategię Compaction (podsumowania DAG, pobieranie wektorowe itd.).
- **Pluginy pamięci** (`plugins.slots.memory`) są oddzielone od silników kontekstu.
  Pluginy pamięci dostarczają wyszukiwanie/pobieranie; silniki kontekstu kontrolują, co
  model widzi. Mogą działać razem — silnik kontekstu może używać danych z Pluginu
  pamięci podczas składania. Silniki Pluginów, które chcą używać aktywnej ścieżki
  promptu pamięci, powinny preferować `buildMemorySystemPromptAddition(...)` z
  `openclaw/plugin-sdk/core`, które przekształca sekcje promptu aktywnej pamięci
  w gotowy do dodania na początek `systemPromptAddition`. Jeśli silnik potrzebuje kontroli
  niższego poziomu, nadal może pobierać surowe linie z
  `openclaw/plugin-sdk/memory-host-core` przez
  `buildActiveMemoryPromptSection(...)`.
- **Przycinanie sesji** (usuwanie starych wyników narzędzi z pamięci) nadal działa
  niezależnie od tego, który silnik kontekstu jest aktywny.

## Wskazówki

- Użyj `openclaw doctor`, aby sprawdzić, czy silnik ładuje się poprawnie.
- Przy przełączaniu silników istniejące sesje kontynuują pracę z bieżącą historią.
  Nowy silnik przejmuje obsługę przyszłych uruchomień.
- Błędy silnika są logowane i widoczne w diagnostyce. Jeśli silnik Pluginu
  nie zarejestruje się albo nie da się rozwiązać wybranego identyfikatora silnika, OpenClaw
  nie wykonuje automatycznego fallbacku; uruchomienia kończą się błędem, dopóki nie naprawisz Pluginu albo
  nie przełączysz `plugins.slots.contextEngine` z powrotem na `"legacy"`.
- W czasie rozwoju użyj `openclaw plugins install -l ./my-engine`, aby podlinkować
  lokalny katalog Pluginu bez kopiowania.

Zobacz także: [Compaction](/pl/concepts/compaction), [Kontekst](/pl/concepts/context),
[Pluginy](/pl/tools/plugin), [Manifest Pluginu](/pl/plugins/manifest).

## Powiązane

- [Kontekst](/pl/concepts/context) — jak budowany jest kontekst dla tur agenta
- [Architektura Pluginów](/pl/plugins/architecture) — rejestrowanie Pluginów silnika kontekstu
- [Compaction](/pl/concepts/compaction) — podsumowywanie długich rozmów
