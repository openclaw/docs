---
read_when:
    - Chcesz zrozumieć, jak OpenClaw składa kontekst modelu
    - Przełączasz się między starszym silnikiem a silnikiem wtyczki
    - Tworzysz wtyczkę silnika kontekstu
summary: 'Silnik kontekstu: rozszerzalne składanie kontekstu, kompaktowanie i cykl życia subagentów'
title: Silnik kontekstu
x-i18n:
    generated_at: "2026-04-05T13:50:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd8cbb0e953f58fd84637fc4ceefc65984312cf2896d338318bc8cf860e6d9
    source_path: concepts/context-engine.md
    workflow: 15
---

# Silnik kontekstu

**Silnik kontekstu** steruje tym, jak OpenClaw buduje kontekst modelu dla każdego uruchomienia.
Decyduje, które wiadomości uwzględnić, jak podsumowywać starszą historię oraz jak
zarządzać kontekstem na granicach subagentów.

OpenClaw jest dostarczany z wbudowanym silnikiem `legacy`. Wtyczki mogą rejestrować
alternatywne silniki, które zastępują aktywny cykl życia silnika kontekstu.

## Szybki start

Sprawdź, który silnik jest aktywny:

```bash
openclaw doctor
# lub sprawdź config bezpośrednio:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Instalowanie wtyczki silnika kontekstu

Wtyczki silnika kontekstu instaluje się tak samo jak każdą inną wtyczkę OpenClaw. Najpierw
zainstaluj, a potem wybierz silnik w slocie:

```bash
# Instalacja z npm
openclaw plugins install @martian-engineering/lossless-claw

# Lub instalacja z lokalnej ścieżki (do programowania)
openclaw plugins install -l ./my-context-engine
```

Następnie włącz wtyczkę i wybierz ją jako aktywny silnik w swoim config:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // musi odpowiadać zarejestrowanemu id silnika wtyczki
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Tutaj trafia config specyficzny dla wtyczki (zobacz dokumentację wtyczki)
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

1. **Ingest** — wywoływane, gdy nowa wiadomość jest dodawana do sesji. Silnik
   może zapisać lub zindeksować wiadomość we własnym magazynie danych.
2. **Assemble** — wywoływane przed każdym uruchomieniem modelu. Silnik zwraca uporządkowany
   zestaw wiadomości (oraz opcjonalne `systemPromptAddition`), które mieszczą się
   w budżecie tokenów.
3. **Compact** — wywoływane, gdy okno kontekstu jest pełne albo gdy użytkownik uruchamia
   `/compact`. Silnik podsumowuje starszą historię, aby zwolnić miejsce.
4. **After turn** — wywoływane po zakończeniu uruchomienia. Silnik może utrwalić stan,
   uruchomić kompaktowanie w tle albo zaktualizować indeksy.

### Cykl życia subagenta (opcjonalnie)

OpenClaw obecnie wywołuje jeden hook cyklu życia subagenta:

- **onSubagentEnded** — sprzątanie po zakończeniu sesji subagenta albo po jej usunięciu.

Hook `prepareSubagentSpawn` jest częścią interfejsu z myślą o przyszłym użyciu, ale
środowisko uruchomieniowe jeszcze go nie wywołuje.

### Dodatek do promptu systemowego

Metoda `assemble` może zwrócić ciąg `systemPromptAddition`. OpenClaw
dodaje go na początku promptu systemowego dla danego uruchomienia. Umożliwia to silnikom wstrzykiwanie
dynamicznych wskazówek dotyczących przypominania, instrukcji pobierania lub podpowiedzi
zależnych od kontekstu bez konieczności używania statycznych plików workspace.

## Silnik legacy

Wbudowany silnik `legacy` zachowuje oryginalne działanie OpenClaw:

- **Ingest**: no-op (menedżer sesji obsługuje utrwalanie wiadomości bezpośrednio).
- **Assemble**: pass-through (istniejący pipeline sanitize → validate → limit
  w środowisku uruchomieniowym obsługuje składanie kontekstu).
- **Compact**: deleguje do wbudowanego kompaktowania przez podsumowanie, które tworzy
  jedno podsumowanie starszych wiadomości i pozostawia nienaruszone ostatnie wiadomości.
- **After turn**: no-op.

Silnik legacy nie rejestruje narzędzi ani nie udostępnia `systemPromptAddition`.

Gdy `plugins.slots.contextEngine` nie jest ustawione (albo jest ustawione na `"legacy"`), ten
silnik jest używany automatycznie.

## Silniki wtyczek

Wtyczka może zarejestrować silnik kontekstu przy użyciu API wtyczek:

```ts
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

    async assemble({ sessionId, messages, tokenBudget }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: "Use lcm_grep to search history...",
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Następnie włącz ją w config:

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

| Składowa           | Rodzaj   | Cel                                                      |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Właściwość | Identyfikator silnika, nazwa, wersja i informacja, czy zarządza kompaktowaniem |
| `ingest(params)`   | Metoda   | Zapis pojedynczej wiadomości                             |
| `assemble(params)` | Metoda   | Budowanie kontekstu dla uruchomienia modelu (zwraca `AssembleResult`) |
| `compact(params)`  | Metoda   | Podsumowanie/redukcja kontekstu                          |

`assemble` zwraca `AssembleResult` zawierający:

- `messages` — uporządkowane wiadomości do wysłania do modelu.
- `estimatedTokens` (wymagane, `number`) — szacowana przez silnik łączna liczba
  tokenów w złożonym kontekście. OpenClaw używa tego do podejmowania decyzji
  o progu kompaktowania i do raportowania diagnostycznego.
- `systemPromptAddition` (opcjonalne, `string`) — dodawane na początku promptu systemowego.

Opcjonalne składowe:

| Składowa                     | Rodzaj | Cel                                                                                                             |
| ---------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`          | Metoda | Inicjalizacja stanu silnika dla sesji. Wywoływane raz, gdy silnik po raz pierwszy widzi sesję (np. import historii). |
| `ingestBatch(params)`        | Metoda | Przetworzenie zakończonego turnu jako partii. Wywoływane po zakończeniu uruchomienia, ze wszystkimi wiadomościami z tego turnu naraz. |
| `afterTurn(params)`          | Metoda | Prace cyklu życia po uruchomieniu (utrwalanie stanu, uruchamianie kompaktowania w tle).                        |
| `prepareSubagentSpawn(params)` | Metoda | Przygotowanie współdzielonego stanu dla sesji potomnej.                                                         |
| `onSubagentEnded(params)`    | Metoda | Sprzątanie po zakończeniu działania subagenta.                                                                  |
| `dispose()`                  | Metoda | Zwalnianie zasobów. Wywoływane przy zamykaniu gateway lub przeładowaniu wtyczki — nie per sesja.               |

### ownsCompaction

`ownsCompaction` kontroluje, czy wbudowane automatyczne kompaktowanie Pi w trakcie próby pozostaje
włączone dla uruchomienia:

- `true` — silnik zarządza zachowaniem kompaktowania. OpenClaw wyłącza wbudowane w Pi
  automatyczne kompaktowanie dla tego uruchomienia, a implementacja `compact()` w silniku
  odpowiada za `/compact`, kompaktowanie przy odzyskiwaniu po przepełnieniu oraz każde proaktywne
  kompaktowanie, które chce wykonać w `afterTurn()`.
- `false` lub nieustawione — wbudowane automatyczne kompaktowanie Pi może nadal działać podczas
  wykonywania promptu, ale metoda `compact()` aktywnego silnika nadal jest wywoływana dla
  `/compact` i odzyskiwania po przepełnieniu.

`ownsCompaction: false` **nie** oznacza, że OpenClaw automatycznie wraca do
ścieżki kompaktowania silnika legacy.

Oznacza to, że istnieją dwa prawidłowe wzorce dla wtyczek:

- **Tryb przejęcia** — zaimplementuj własny algorytm kompaktowania i ustaw
  `ownsCompaction: true`.
- **Tryb delegowania** — ustaw `ownsCompaction: false` i spraw, aby `compact()` wywoływało
  `delegateCompactionToRuntime(...)` z `openclaw/plugin-sdk/core`, aby użyć
  wbudowanego zachowania kompaktowania OpenClaw.

No-op `compact()` jest niebezpieczne dla aktywnego silnika nieprzejmującego kompaktowania, ponieważ
wyłącza normalną ścieżkę `/compact` i kompaktowania przy odzyskiwaniu po przepełnieniu dla
tego slotu silnika.

## Dokumentacja config

```json5
{
  plugins: {
    slots: {
      // Wybierz aktywny silnik kontekstu. Domyślnie: "legacy".
      // Ustaw identyfikator wtyczki, aby używać silnika wtyczki.
      contextEngine: "legacy",
    },
  },
}
```

Slot jest wyłączny w czasie działania — dla danego uruchomienia lub operacji kompaktowania
rozwiązywany jest tylko jeden zarejestrowany silnik kontekstu. Inne włączone
wtyczki `kind: "context-engine"` nadal mogą się ładować i uruchamiać swój kod
rejestracyjny; `plugins.slots.contextEngine` wybiera tylko to, który zarejestrowany identyfikator silnika
OpenClaw rozwiązuje, gdy potrzebuje silnika kontekstu.

## Relacja z kompaktowaniem i pamięcią

- **Kompaktowanie** jest jedną z odpowiedzialności silnika kontekstu. Silnik legacy
  deleguje do wbudowanego podsumowywania OpenClaw. Silniki wtyczek mogą implementować
  dowolną strategię kompaktowania (podsumowania DAG, pobieranie wektorowe itd.).
- **Wtyczki pamięci** (`plugins.slots.memory`) są oddzielone od silników kontekstu.
  Wtyczki pamięci zapewniają wyszukiwanie/pobieranie; silniki kontekstu sterują tym, co
  model widzi. Mogą działać razem — silnik kontekstu może używać danych z
  wtyczki pamięci podczas składania.
- **Przycinanie sesji** (obcinanie starych wyników narzędzi w pamięci) nadal działa
  niezależnie od tego, który silnik kontekstu jest aktywny.

## Wskazówki

- Użyj `openclaw doctor`, aby sprawdzić, czy Twój silnik ładuje się poprawnie.
- Jeśli przełączasz silniki, istniejące sesje nadal działają z obecną historią.
  Nowy silnik przejmuje obsługę przyszłych uruchomień.
- Błędy silnika są rejestrowane i pokazywane w diagnostyce. Jeśli silnik wtyczki
  nie zarejestruje się albo nie można rozwiązać wybranego identyfikatora silnika, OpenClaw
  nie przełącza się automatycznie na tryb zapasowy; uruchomienia kończą się błędem, dopóki nie naprawisz wtyczki albo
  nie przełączysz `plugins.slots.contextEngine` z powrotem na `"legacy"`.
- Do programowania używaj `openclaw plugins install -l ./my-engine`, aby podlinkować
  lokalny katalog wtyczki bez kopiowania.

Zobacz także: [Compaction](/concepts/compaction), [Context](/concepts/context),
[Plugins](/tools/plugin), [Plugin manifest](/plugins/manifest).

## Powiązane

- [Context](/concepts/context) — jak budowany jest kontekst dla turnów agenta
- [Plugin Architecture](/plugins/architecture) — rejestrowanie wtyczek silnika kontekstu
- [Compaction](/concepts/compaction) — podsumowywanie długich rozmów
