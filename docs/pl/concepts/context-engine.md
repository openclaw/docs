---
read_when:
    - Chcesz zrozumieć, jak OpenClaw składa kontekst modelu
    - Przełączasz się między starszym silnikiem a silnikiem Plugin
    - Tworzysz Plugin silnika kontekstu
sidebarTitle: Context engine
summary: 'Silnik kontekstu: rozszerzalne składanie kontekstu, Compaction i cykl życia podagentów'
title: Silnik kontekstu
x-i18n:
    generated_at: "2026-04-30T09:47:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

**Silnik kontekstu** kontroluje, jak OpenClaw buduje kontekst modelu dla każdego uruchomienia: które wiadomości uwzględnić, jak streszczać starszą historię i jak zarządzać kontekstem na granicach podagentów.

OpenClaw zawiera wbudowany silnik `legacy` i używa go domyślnie — większość użytkowników nigdy nie musi tego zmieniać. Zainstaluj i wybierz silnik Plugin tylko wtedy, gdy potrzebujesz innego zachowania składania, Compaction lub przywoływania między sesjami.

## Szybki start

<Steps>
  <Step title="Sprawdź, który silnik jest aktywny">
    ```bash
    openclaw doctor
    # albo sprawdź konfigurację bezpośrednio:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Zainstaluj silnik Plugin">
    Pluginy silnika kontekstu instaluje się tak jak każdy inny Plugin OpenClaw.

    <Tabs>
      <Tab title="Z npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Z lokalnej ścieżki">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Włącz i wybierz silnik">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // musi pasować do zarejestrowanego identyfikatora silnika Plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Tutaj trafia konfiguracja specyficzna dla Plugin (zobacz dokumentację Plugin)
          },
        },
      },
    }
    ```

    Po instalacji i konfiguracji uruchom Gateway ponownie.

  </Step>
  <Step title="Przełącz z powrotem na legacy (opcjonalnie)">
    Ustaw `contextEngine` na `"legacy"` (albo całkowicie usuń ten klucz — `"legacy"` jest wartością domyślną).
  </Step>
</Steps>

## Jak to działa

Za każdym razem, gdy OpenClaw uruchamia prompt modelu, silnik kontekstu uczestniczy w czterech punktach cyklu życia:

<AccordionGroup>
  <Accordion title="1. Pobieranie">
    Wywoływane, gdy do sesji zostaje dodana nowa wiadomość. Silnik może zapisać lub zindeksować wiadomość we własnym magazynie danych.
  </Accordion>
  <Accordion title="2. Składanie">
    Wywoływane przed każdym uruchomieniem modelu. Silnik zwraca uporządkowany zestaw wiadomości (oraz opcjonalny `systemPromptAddition`), który mieści się w budżecie tokenów.
  </Accordion>
  <Accordion title="3. Compact">
    Wywoływane, gdy okno kontekstu jest pełne albo gdy użytkownik uruchomi `/compact`. Silnik streszcza starszą historię, aby zwolnić miejsce.
  </Accordion>
  <Accordion title="4. Po turze">
    Wywoływane po zakończeniu uruchomienia. Silnik może utrwalić stan, uruchomić Compaction w tle albo zaktualizować indeksy.
  </Accordion>
</AccordionGroup>

Dla dołączonego harnessu Codex bez ACP OpenClaw stosuje ten sam cykl życia, odwzorowując złożony kontekst na instrukcje deweloperskie Codex i prompt bieżącej tury. Codex nadal zarządza własną natywną historią wątku i natywnym mechanizmem Compaction.

### Cykl życia podagenta (opcjonalnie)

OpenClaw wywołuje dwa opcjonalne hooki cyklu życia podagenta:

<ParamField path="prepareSubagentSpawn" type="method">
  Przygotowuje współdzielony stan kontekstu przed rozpoczęciem uruchomienia dziecka. Hook otrzymuje klucze sesji rodzica/dziecka, `contextMode` (`isolated` albo `fork`), dostępne identyfikatory/pliki transkrypcji oraz opcjonalny TTL. Jeśli zwróci uchwyt wycofania, OpenClaw wywoła go, gdy uruchomienie podagenta nie powiedzie się po udanym przygotowaniu.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Czyści zasoby, gdy sesja podagenta zakończy się albo zostanie uprzątnięta.
</ParamField>

### Dodatek do promptu systemowego

Metoda `assemble` może zwrócić ciąg `systemPromptAddition`. OpenClaw dodaje go na początku promptu systemowego dla danego uruchomienia. Dzięki temu silniki mogą wstrzykiwać dynamiczne wskazówki przywoływania, instrukcje wyszukiwania lub podpowiedzi świadome kontekstu bez wymagania statycznych plików obszaru roboczego.

## Silnik legacy

Wbudowany silnik `legacy` zachowuje pierwotne działanie OpenClaw:

- **Pobieranie**: brak operacji (menedżer sesji bezpośrednio obsługuje trwałość wiadomości).
- **Składanie**: przekazanie bez zmian (istniejący potok sanitize → validate → limit w środowisku wykonawczym obsługuje składanie kontekstu).
- **Compact**: deleguje do wbudowanej Compaction streszczającej, która tworzy jedno streszczenie starszych wiadomości i pozostawia ostatnie wiadomości bez zmian.
- **Po turze**: brak operacji.

Silnik legacy nie rejestruje narzędzi ani nie udostępnia `systemPromptAddition`.

Gdy `plugins.slots.contextEngine` nie jest ustawione (albo jest ustawione na `"legacy"`), ten silnik jest używany automatycznie.

## Silniki Plugin

Plugin może zarejestrować silnik kontekstu za pomocą API Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
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

Fabryka `ctx` zawiera opcjonalne wartości `config`, `agentDir` i `workspaceDir`,
dzięki czemu Pluginy mogą zainicjować stan dla agenta lub obszaru roboczego przed
uruchomieniem pierwszego hooka cyklu życia.

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

| Element            | Rodzaj     | Cel                                                           |
| ------------------ | ---------- | ------------------------------------------------------------- |
| `info`             | Właściwość | Identyfikator silnika, nazwa, wersja i czy zarządza Compaction |
| `ingest(params)`   | Metoda     | Zapisuje pojedynczą wiadomość                                 |
| `assemble(params)` | Metoda     | Buduje kontekst dla uruchomienia modelu (zwraca `AssembleResult`) |
| `compact(params)`  | Metoda     | Streszcza/zmniejsza kontekst                                  |

`assemble` zwraca `AssembleResult` z:

<ParamField path="messages" type="Message[]" required>
  Uporządkowane wiadomości do wysłania do modelu.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Oszacowanie silnika dotyczące łącznej liczby tokenów w złożonym kontekście. OpenClaw używa tego do decyzji o progach Compaction i raportowania diagnostycznego.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Dodawane na początku promptu systemowego.
</ParamField>

`compact` zwraca `CompactResult`. Gdy Compaction rotuje aktywną
transkrypcję, `result.sessionId` i `result.sessionFile` identyfikują następczą
sesję, której musi użyć kolejna próba lub tura.

Elementy opcjonalne:

| Element                        | Rodzaj | Cel                                                                                                                  |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metoda | Inicjalizuje stan silnika dla sesji. Wywoływana raz, gdy silnik po raz pierwszy widzi sesję (np. import historii).   |
| `ingestBatch(params)`          | Metoda | Pobiera zakończoną turę jako partię. Wywoływana po zakończeniu uruchomienia, z wszystkimi wiadomościami z tej tury naraz. |
| `afterTurn(params)`            | Metoda | Prace cyklu życia po uruchomieniu (utrwalenie stanu, wywołanie Compaction w tle).                                    |
| `prepareSubagentSpawn(params)` | Metoda | Konfiguruje współdzielony stan dla sesji dziecka przed jej rozpoczęciem.                                             |
| `onSubagentEnded(params)`      | Metoda | Czyści zasoby po zakończeniu podagenta.                                                                              |
| `dispose()`                    | Metoda | Zwalnia zasoby. Wywoływana podczas zamykania Gateway albo przeładowania Plugin — nie dla każdej sesji.               |

### ownsCompaction

`ownsCompaction` kontroluje, czy wbudowana w Pi automatyczna Compaction w ramach próby pozostaje włączona dla uruchomienia:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Silnik zarządza zachowaniem Compaction. OpenClaw wyłącza wbudowaną w Pi automatyczną Compaction dla tego uruchomienia, a implementacja `compact()` w silniku odpowiada za `/compact`, odzyskiwanie po przepełnieniu z użyciem Compaction oraz każdą proaktywną Compaction, którą chce wykonać w `afterTurn()`. OpenClaw może nadal uruchomić zabezpieczenie przed przepełnieniem przed promptem; gdy przewidzi, że pełna transkrypcja się przepełni, ścieżka odzyskiwania wywołuje `compact()` aktywnego silnika przed przesłaniem kolejnego promptu.
  </Accordion>
  <Accordion title="ownsCompaction: false albo nieustawione">
    Wbudowana w Pi automatyczna Compaction może nadal działać podczas wykonywania promptu, ale metoda `compact()` aktywnego silnika nadal jest wywoływana dla `/compact` i odzyskiwania po przepełnieniu.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **nie** oznacza, że OpenClaw automatycznie wraca do ścieżki Compaction silnika legacy.
</Warning>

Oznacza to, że istnieją dwa prawidłowe wzorce Plugin:

<Tabs>
  <Tab title="Tryb zarządzania">
    Zaimplementuj własny algorytm Compaction i ustaw `ownsCompaction: true`.
  </Tab>
  <Tab title="Tryb delegowania">
    Ustaw `ownsCompaction: false` i spraw, aby `compact()` wywoływało `delegateCompactionToRuntime(...)` z `openclaw/plugin-sdk/core`, aby użyć wbudowanego zachowania Compaction OpenClaw.
  </Tab>
</Tabs>

Brak operacji w `compact()` jest niebezpieczny dla aktywnego silnika, który nie zarządza Compaction, ponieważ wyłącza normalną ścieżkę Compaction dla `/compact` i odzyskiwania po przepełnieniu w tym slocie silnika.

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

<Note>
Slot jest wyłączny w czasie uruchomienia — dla danego uruchomienia albo operacji Compaction rozwiązywany jest tylko jeden zarejestrowany silnik kontekstu. Inne włączone Pluginy `kind: "context-engine"` nadal mogą się ładować i uruchamiać swój kod rejestracji; `plugins.slots.contextEngine` wybiera tylko, który zarejestrowany identyfikator silnika OpenClaw rozwiązuje, gdy potrzebuje silnika kontekstu.
</Note>

<Note>
**Odinstalowanie Plugin:** gdy odinstalujesz Plugin aktualnie wybrany jako `plugins.slots.contextEngine`, OpenClaw resetuje slot z powrotem do wartości domyślnej (`legacy`). To samo zachowanie resetowania dotyczy `plugins.slots.memory`. Ręczna edycja konfiguracji nie jest wymagana.
</Note>

## Relacja z Compaction i pamięcią

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction to jedna z odpowiedzialności silnika kontekstu. Starszy silnik deleguje ją do wbudowanego podsumowywania OpenClaw. Silniki Plugin mogą implementować dowolną strategię compaction (podsumowania DAG, pobieranie wektorowe itp.).
  </Accordion>
  <Accordion title="Pluginy pamięci">
    Pluginy pamięci (`plugins.slots.memory`) są oddzielne od silników kontekstu. Pluginy pamięci zapewniają wyszukiwanie/pobieranie; silniki kontekstu kontrolują to, co widzi model. Mogą działać razem — silnik kontekstu może używać danych Plugin pamięci podczas składania. Silniki Plugin, które chcą korzystać ze ścieżki promptu aktywnej pamięci, powinny preferować `buildMemorySystemPromptAddition(...)` z `openclaw/plugin-sdk/core`, która konwertuje sekcje promptu aktywnej pamięci na gotowy do poprzedzenia `systemPromptAddition`. Jeśli silnik potrzebuje niższego poziomu kontroli, nadal może pobierać surowe wiersze z `openclaw/plugin-sdk/memory-host-core` za pomocą `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Przycinanie sesji">
    Przycinanie starych wyników narzędzi w pamięci nadal działa niezależnie od tego, który silnik kontekstu jest aktywny.
  </Accordion>
</AccordionGroup>

## Wskazówki

- Użyj `openclaw doctor`, aby sprawdzić, czy silnik ładuje się poprawnie.
- Po przełączeniu silników istniejące sesje kontynuują pracę z bieżącą historią. Nowy silnik przejmuje obsługę przyszłych uruchomień.
- Błędy silnika są rejestrowane i pokazywane w diagnostyce. Jeśli silnik Plugin nie zarejestruje się albo nie da się rozwiązać identyfikatora wybranego silnika, OpenClaw nie przełącza się automatycznie na rozwiązanie awaryjne; uruchomienia będą kończyć się niepowodzeniem, dopóki nie naprawisz Plugin albo nie przełączysz `plugins.slots.contextEngine` z powrotem na `"legacy"`.
- Podczas developmentu użyj `openclaw plugins install -l ./my-engine`, aby połączyć lokalny katalog Plugin bez kopiowania.

## Powiązane

- [Compaction](/pl/concepts/compaction) — podsumowywanie długich rozmów
- [Kontekst](/pl/concepts/context) — jak kontekst jest budowany dla tur agenta
- [Architektura Plugin](/pl/plugins/architecture) — rejestrowanie Plugin silnika kontekstu
- [Manifest Plugin](/pl/plugins/manifest) — pola manifestu Plugin
- [Pluginy](/pl/tools/plugin) — omówienie Plugin
