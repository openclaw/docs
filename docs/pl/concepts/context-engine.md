---
read_when:
    - Chcesz zrozumieć, jak OpenClaw składa kontekst modelu
    - Przełączasz się między starszym silnikiem a silnikiem pluginu
    - Tworzysz plugin silnika kontekstu
summary: 'Silnik kontekstu: rozszerzalne składanie kontekstu, kompaktowanie i cykl życia subagentów'
title: Context Engine
x-i18n:
    generated_at: "2026-04-07T09:43:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8290ac73272eee275bce8e481ac7959b65386752caa68044d0c6f3e450acfb1
    source_path: concepts/context-engine.md
    workflow: 15
---

# Context Engine

**Silnik kontekstu** kontroluje sposób, w jaki OpenClaw buduje kontekst modelu dla każdego uruchomienia.
Decyduje, które wiadomości uwzględnić, jak podsumowywać starszą historię oraz
jak zarządzać kontekstem na granicach subagentów.

OpenClaw jest dostarczany z wbudowanym silnikiem `legacy`. Pluginy mogą rejestrować
alternatywne silniki, które zastępują aktywny cykl życia silnika kontekstu.

## Szybki start

Sprawdź, który silnik jest aktywny:

```bash
openclaw doctor
# or inspect config directly:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Instalowanie pluginu silnika kontekstu

Pluginy silnika kontekstu są instalowane tak jak każdy inny plugin OpenClaw. Najpierw
zainstaluj plugin, a następnie wybierz silnik w slocie:

```bash
# Install from npm
openclaw plugins install @martian-engineering/lossless-claw

# Or install from a local path (for development)
openclaw plugins install -l ./my-context-engine
```

Następnie włącz plugin i wybierz go jako aktywny silnik w swojej konfiguracji:

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

Aby przełączyć się z powrotem na wbudowany silnik, ustaw `contextEngine` na `"legacy"` (lub
całkowicie usuń ten klucz — `"legacy"` jest wartością domyślną).

## Jak to działa

Za każdym razem, gdy OpenClaw uruchamia prompt modelu, silnik kontekstu uczestniczy w
czterech punktach cyklu życia:

1. **Ingest** — wywoływany, gdy do sesji zostaje dodana nowa wiadomość. Silnik
   może przechowywać lub indeksować wiadomość we własnym magazynie danych.
2. **Assemble** — wywoływany przed każdym uruchomieniem modelu. Silnik zwraca uporządkowany
   zestaw wiadomości (oraz opcjonalne `systemPromptAddition`), które mieszczą się w
   budżecie tokenów.
3. **Compact** — wywoływany, gdy okno kontekstu jest pełne lub gdy użytkownik uruchomi
   `/compact`. Silnik podsumowuje starszą historię, aby zwolnić miejsce.
4. **After turn** — wywoływany po zakończeniu uruchomienia. Silnik może utrwalać stan,
   uruchamiać kompaktowanie w tle lub aktualizować indeksy.

### Cykl życia subagenta (opcjonalnie)

OpenClaw obecnie wywołuje jeden hook cyklu życia subagenta:

- **onSubagentEnded** — sprząta po zakończeniu sesji subagenta lub po jej usunięciu.

Hook `prepareSubagentSpawn` jest częścią interfejsu z myślą o przyszłym użyciu, ale
środowisko uruchomieniowe jeszcze go nie wywołuje.

### Dodatkowy prompt systemowy

Metoda `assemble` może zwrócić ciąg `systemPromptAddition`. OpenClaw
dodaje go na początku promptu systemowego dla danego uruchomienia. Pozwala to silnikom wstrzykiwać
dynamiczne wskazówki dotyczące odtwarzania pamięci, instrukcje wyszukiwania lub podpowiedzi
zależne od kontekstu bez konieczności używania statycznych plików workspace.

## Silnik legacy

Wbudowany silnik `legacy` zachowuje oryginalne działanie OpenClaw:

- **Ingest**: brak działania (menedżer sesji bezpośrednio obsługuje utrwalanie wiadomości).
- **Assemble**: przekazanie dalej bez zmian (istniejący potok sanitize → validate → limit
  w środowisku uruchomieniowym obsługuje składanie kontekstu).
- **Compact**: deleguje do wbudowanego kompaktowania przez podsumowanie, które tworzy
  jedno podsumowanie starszych wiadomości i pozostawia ostatnie wiadomości bez zmian.
- **After turn**: brak działania.

Silnik legacy nie rejestruje narzędzi ani nie udostępnia `systemPromptAddition`.

Gdy `plugins.slots.contextEngine` nie jest ustawione (lub jest ustawione na `"legacy"`), ten
silnik jest używany automatycznie.

## Silniki pluginów

Plugin może zarejestrować silnik kontekstu za pomocą API pluginów:

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

Wymagane elementy:

| Element            | Rodzaj   | Cel                                                      |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Właściwość | Identyfikator silnika, nazwa, wersja oraz informacja, czy obsługuje kompaktowanie |
| `ingest(params)`   | Metoda   | Przechowuje pojedynczą wiadomość                         |
| `assemble(params)` | Metoda   | Buduje kontekst dla uruchomienia modelu (zwraca `AssembleResult`) |
| `compact(params)`  | Metoda   | Podsumowuje/redukuje kontekst                            |

`assemble` zwraca `AssembleResult` z polami:

- `messages` — uporządkowane wiadomości do wysłania do modelu.
- `estimatedTokens` (wymagane, `number`) — oszacowanie silnika dotyczące łącznej
  liczby tokenów w złożonym kontekście. OpenClaw używa tego do podejmowania decyzji
  o progu kompaktowania oraz do raportowania diagnostycznego.
- `systemPromptAddition` (opcjonalne, `string`) — dodawane na początku promptu systemowego.

Elementy opcjonalne:

| Element                        | Rodzaj | Cel                                                                                                         |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metoda | Inicjalizuje stan silnika dla sesji. Wywoływane raz, gdy silnik po raz pierwszy zobaczy sesję (np. import historii). |
| `ingestBatch(params)`          | Metoda | Przetwarza zakończoną turę jako partię. Wywoływane po zakończeniu uruchomienia, ze wszystkimi wiadomościami z tej tury naraz. |
| `afterTurn(params)`            | Metoda | Prace po uruchomieniu (utrwalenie stanu, uruchomienie kompaktowania w tle).                                |
| `prepareSubagentSpawn(params)` | Metoda | Przygotowuje współdzielony stan dla sesji podrzędnej.                                                       |
| `onSubagentEnded(params)`      | Metoda | Sprząta po zakończeniu działania subagenta.                                                                 |
| `dispose()`                    | Metoda | Zwalnia zasoby. Wywoływane podczas zamykania gateway lub przeładowania pluginu — nie dla każdej sesji.     |

### ownsCompaction

`ownsCompaction` kontroluje, czy wbudowane automatyczne kompaktowanie Pi podczas próby pozostaje
włączone dla danego uruchomienia:

- `true` — silnik obsługuje zachowanie kompaktowania. OpenClaw wyłącza wbudowane
  automatyczne kompaktowanie Pi dla tego uruchomienia, a implementacja `compact()` danego silnika
  odpowiada za `/compact`, kompaktowanie przy odzyskiwaniu po przepełnieniu oraz wszelkie proaktywne
  kompaktowanie, które ma być wykonywane w `afterTurn()`.
- `false` lub brak ustawienia — wbudowane automatyczne kompaktowanie Pi nadal może działać podczas
  wykonywania promptu, ale metoda `compact()` aktywnego silnika nadal jest wywoływana dla
  `/compact` i odzyskiwania po przepełnieniu.

`ownsCompaction: false` **nie** oznacza, że OpenClaw automatycznie wraca do
ścieżki kompaktowania silnika legacy.

Oznacza to, że istnieją dwa prawidłowe wzorce pluginów:

- **Tryb przejmujący** — zaimplementuj własny algorytm kompaktowania i ustaw
  `ownsCompaction: true`.
- **Tryb delegujący** — ustaw `ownsCompaction: false` i spraw, aby `compact()` wywoływało
  `delegateCompactionToRuntime(...)` z `openclaw/plugin-sdk/core`, aby użyć
  wbudowanego zachowania kompaktowania OpenClaw.

Pusta implementacja `compact()` jest niebezpieczna dla aktywnego silnika nieprzejmującego, ponieważ
wyłącza normalną ścieżkę kompaktowania `/compact` i odzyskiwania po przepełnieniu dla tego
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
rozwiązywany dla danego uruchomienia lub operacji kompaktowania. Inne włączone
pluginy `kind: "context-engine"` nadal mogą się ładować i uruchamiać swój kod
rejestracyjny; `plugins.slots.contextEngine` wybiera tylko to, który zarejestrowany identyfikator silnika
OpenClaw rozwiązuje, gdy potrzebuje silnika kontekstu.

## Relacja do kompaktowania i pamięci

- **Kompaktowanie** to jedna z odpowiedzialności silnika kontekstu. Silnik legacy
  deleguje do wbudowanego podsumowywania OpenClaw. Silniki pluginów mogą implementować
  dowolną strategię kompaktowania (podsumowania DAG, wyszukiwanie wektorowe itd.).
- **Pluginy pamięci** (`plugins.slots.memory`) są oddzielne od silników kontekstu.
  Pluginy pamięci dostarczają wyszukiwanie/odtwarzanie; silniki kontekstu kontrolują to,
  co widzi model. Mogą współpracować — silnik kontekstu może używać danych
  pluginu pamięci podczas składania. Silniki pluginów, które chcą używać aktywnej
  ścieżki promptu pamięci, powinny preferować `buildMemorySystemPromptAddition(...)` z
  `openclaw/plugin-sdk/core`, które konwertuje aktywne sekcje promptu pamięci
  na gotowe do dodania na początku `systemPromptAddition`. Jeśli silnik potrzebuje kontroli
  na niższym poziomie, nadal może pobierać surowe linie z
  `openclaw/plugin-sdk/memory-host-core` za pomocą
  `buildActiveMemoryPromptSection(...)`.
- **Przycinanie sesji** (usuwanie starych wyników narzędzi z pamięci) nadal działa
  niezależnie od tego, który silnik kontekstu jest aktywny.

## Wskazówki

- Użyj `openclaw doctor`, aby sprawdzić, czy silnik ładuje się poprawnie.
- Jeśli przełączasz silniki, istniejące sesje zachowują swoją obecną historię.
  Nowy silnik przejmuje obsługę przyszłych uruchomień.
- Błędy silnika są rejestrowane w logach i widoczne w diagnostyce. Jeśli silnik pluginu
  nie zarejestruje się lub nie można rozwiązać wybranego identyfikatora silnika, OpenClaw
  nie przełącza się automatycznie z powrotem; uruchomienia będą kończyć się niepowodzeniem, dopóki nie naprawisz pluginu lub
  nie przełączysz `plugins.slots.contextEngine` z powrotem na `"legacy"`.
- Do celów programistycznych użyj `openclaw plugins install -l ./my-engine`, aby podłączyć
  lokalny katalog pluginu bez kopiowania.

Zobacz też: [Compaction](/pl/concepts/compaction), [Context](/pl/concepts/context),
[Plugins](/pl/tools/plugin), [Plugin manifest](/pl/plugins/manifest).

## Powiązane

- [Context](/pl/concepts/context) — jak budowany jest kontekst dla tur agenta
- [Plugin Architecture](/pl/plugins/architecture) — rejestrowanie pluginów silnika kontekstu
- [Compaction](/pl/concepts/compaction) — podsumowywanie długich rozmów
