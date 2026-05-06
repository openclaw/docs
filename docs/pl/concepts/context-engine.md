---
read_when:
    - Chcesz zrozumieć, jak OpenClaw składa kontekst modelu
    - Przełączasz się między starszym silnikiem a silnikiem Plugin
    - Tworzysz Plugin silnika kontekstu
sidebarTitle: Context engine
summary: 'Silnik kontekstu: wymienne składanie kontekstu, Compaction i cykl życia podagenta'
title: Silnik kontekstu
x-i18n:
    generated_at: "2026-05-06T09:07:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c33c94971751d92a2ce695db545a0c0abb7adcbe1820383b83f4201fa7e628d
    source_path: concepts/context-engine.md
    workflow: 16
---

**silnik kontekstu** kontroluje, jak OpenClaw buduje kontekst modelu dla każdego uruchomienia: które komunikaty uwzględnić, jak podsumowywać starszą historię oraz jak zarządzać kontekstem między granicami subagentów.

OpenClaw zawiera wbudowany silnik `legacy` i domyślnie go używa - większość użytkowników nigdy nie musi tego zmieniać. Zainstaluj i wybierz silnik Plugin tylko wtedy, gdy chcesz uzyskać inne zachowanie składania, Compaction lub przywoływania między sesjami.

## Szybki start

<Steps>
  <Step title="Check which engine is active">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Install a plugin engine">
    Pluginy silnika kontekstu instaluje się tak samo jak każdy inny Plugin OpenClaw.

    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="From a local path">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Enable and select the engine">
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

    Po instalacji i konfiguracji uruchom ponownie Gateway.

  </Step>
  <Step title="Switch back to legacy (optional)">
    Ustaw `contextEngine` na `"legacy"` (albo całkowicie usuń klucz - `"legacy"` jest wartością domyślną).
  </Step>
</Steps>

## Jak to działa

Za każdym razem, gdy OpenClaw uruchamia monit modelu, silnik kontekstu uczestniczy w czterech punktach cyklu życia:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Wywoływane, gdy do sesji dodawany jest nowy komunikat. Silnik może zapisać lub zindeksować komunikat we własnym magazynie danych.
  </Accordion>
  <Accordion title="2. Assemble">
    Wywoływane przed każdym uruchomieniem modelu. Silnik zwraca uporządkowany zestaw komunikatów (oraz opcjonalny `systemPromptAddition`), które mieszczą się w budżecie tokenów.
  </Accordion>
  <Accordion title="3. Compact">
    Wywoływane, gdy okno kontekstu jest pełne albo gdy użytkownik uruchamia `/compact`. Silnik podsumowuje starszą historię, aby zwolnić miejsce.
  </Accordion>
  <Accordion title="4. After turn">
    Wywoływane po zakończeniu uruchomienia. Silnik może utrwalić stan, uruchomić Compaction w tle lub zaktualizować indeksy.
  </Accordion>
</AccordionGroup>

Dla dołączonego harnessu Codex innego niż ACP OpenClaw stosuje ten sam cykl życia, projektując złożony kontekst do instrukcji deweloperskich Codex oraz monitu bieżącej tury. Codex nadal zarządza własną natywną historią wątku i natywnym kompaktorem.

### Cykl życia subagenta (opcjonalnie)

OpenClaw wywołuje dwa opcjonalne haki cyklu życia subagenta:

<ParamField path="prepareSubagentSpawn" type="method">
  Przygotowuje współdzielony stan kontekstu przed rozpoczęciem uruchomienia podrzędnego. Hak otrzymuje klucze sesji nadrzędnej/podrzędnej, `contextMode` (`isolated` lub `fork`), dostępne identyfikatory/pliki transkrypcji oraz opcjonalny TTL. Jeśli zwróci uchwyt wycofania, OpenClaw wywoła go, gdy utworzenie subagenta nie powiedzie się po pomyślnym przygotowaniu.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Czyści zasoby, gdy sesja subagenta zostanie zakończona lub usunięta.
</ParamField>

### Dodatek do monitu systemowego

Metoda `assemble` może zwrócić ciąg `systemPromptAddition`. OpenClaw poprzedza nim monit systemowy dla uruchomienia. Dzięki temu silniki mogą wstrzykiwać dynamiczne wskazówki przywoływania, instrukcje pobierania lub podpowiedzi zależne od kontekstu bez wymagania statycznych plików obszaru roboczego.

## Silnik legacy

Wbudowany silnik `legacy` zachowuje pierwotne zachowanie OpenClaw:

- **Pobieranie**: brak operacji (menedżer sesji bezpośrednio obsługuje utrwalanie komunikatów).
- **Składanie**: przekazanie bez zmian (istniejący potok sanitize → validate → limit w środowisku uruchomieniowym obsługuje składanie kontekstu).
- **Compaction**: deleguje do wbudowanej Compaction podsumowującej, która tworzy pojedyncze podsumowanie starszych komunikatów i zachowuje najnowsze komunikaty bez zmian.
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

Fabryka `ctx` zawiera opcjonalne wartości `config`, `agentDir` i `workspaceDir`, aby Pluginy mogły zainicjalizować stan dla agenta lub obszaru roboczego przed uruchomieniem pierwszego haka cyklu życia.

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

| Element            | Rodzaj     | Cel                                                        |
| ------------------ | ---------- | ---------------------------------------------------------- |
| `info`             | Właściwość | Identyfikator silnika, nazwa, wersja i czy posiada Compaction |
| `ingest(params)`   | Metoda     | Zapisuje pojedynczy komunikat                              |
| `assemble(params)` | Metoda     | Buduje kontekst dla uruchomienia modelu (zwraca `AssembleResult`) |
| `compact(params)`  | Metoda     | Podsumowuje/redukuje kontekst                              |

`assemble` zwraca `AssembleResult` z:

<ParamField path="messages" type="Message[]" required>
  Uporządkowane komunikaty do wysłania do modelu.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Szacunek silnika dotyczący łącznej liczby tokenów w złożonym kontekście. OpenClaw używa go do decyzji o progach Compaction i raportowania diagnostycznego.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Dodawane na początku monitu systemowego.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Kontroluje, którego szacunku tokenów runner używa do wyprzedzających kontroli przepełnienia. Domyślnie `"assembled"`, co oznacza, że sprawdzany jest tylko szacunek złożonego monitu - odpowiednie dla silników zwracających okienkowany, samowystarczalny kontekst. Ustaw `"preassembly_may_overflow"` tylko wtedy, gdy złożony widok może ukrywać ryzyko przepełnienia w bazowej transkrypcji; wtedy runner bierze maksimum z oszacowania złożonego oraz oszacowania historii sesji sprzed składania (bez okienkowania), gdy decyduje, czy wyprzedzająco wykonać Compaction. W obu przypadkach model nadal widzi komunikaty, które zwrócisz - `promptAuthority` wpływa tylko na kontrolę wstępną.
</ParamField>

`compact` zwraca `CompactResult`. Gdy Compaction rotuje aktywną transkrypcję, `result.sessionId` i `result.sessionFile` identyfikują następną sesję, której musi użyć kolejna próba lub tura.

Opcjonalne elementy:

| Element                        | Rodzaj | Cel                                                                                                             |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metoda | Inicjalizuje stan silnika dla sesji. Wywoływane raz, gdy silnik po raz pierwszy widzi sesję (np. import historii). |
| `ingestBatch(params)`          | Metoda | Pobiera ukończoną turę jako partię. Wywoływane po zakończeniu uruchomienia, ze wszystkimi komunikatami z tej tury naraz. |
| `afterTurn(params)`            | Metoda | Prace cyklu życia po uruchomieniu (utrwalenie stanu, uruchomienie Compaction w tle).                            |
| `prepareSubagentSpawn(params)` | Metoda | Konfiguruje współdzielony stan dla sesji podrzędnej przed jej rozpoczęciem.                                     |
| `onSubagentEnded(params)`      | Metoda | Czyści po zakończeniu subagenta.                                                                                |
| `dispose()`                    | Metoda | Zwalnia zasoby. Wywoływane podczas zamykania Gateway lub ponownego ładowania Plugin - nie dla każdej sesji.      |

### ownsCompaction

`ownsCompaction` kontroluje, czy wbudowana w Pi automatyczna Compaction w ramach próby pozostaje włączona dla uruchomienia:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Silnik posiada zachowanie Compaction. OpenClaw wyłącza wbudowaną automatyczną Compaction Pi dla tego uruchomienia, a implementacja `compact()` silnika odpowiada za `/compact`, Compaction odzyskiwania po przepełnieniu oraz wszelką proaktywną Compaction, którą chce wykonać w `afterTurn()`. OpenClaw może nadal uruchomić zabezpieczenie przed przepełnieniem przed monitem; gdy przewidzi, że pełna transkrypcja się przepełni, ścieżka odzyskiwania wywołuje `compact()` aktywnego silnika przed przesłaniem kolejnego monitu.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Wbudowana automatyczna Compaction Pi może nadal działać podczas wykonywania monitu, ale metoda `compact()` aktywnego silnika jest nadal wywoływana dla `/compact` i odzyskiwania po przepełnieniu.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **nie** oznacza, że OpenClaw automatycznie wraca do ścieżki Compaction silnika legacy.
</Warning>

Oznacza to, że istnieją dwa poprawne wzorce Plugin:

<Tabs>
  <Tab title="Owning mode">
    Zaimplementuj własny algorytm Compaction i ustaw `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegating mode">
    Ustaw `ownsCompaction: false` i spraw, aby `compact()` wywoływało `delegateCompactionToRuntime(...)` z `openclaw/plugin-sdk/core`, aby użyć wbudowanego zachowania Compaction OpenClaw.
  </Tab>
</Tabs>

Puste `compact()` jest niebezpieczne dla aktywnego silnika nieposiadającego Compaction, ponieważ wyłącza normalną ścieżkę Compaction `/compact` i odzyskiwania po przepełnieniu dla tego slotu silnika.

## Odniesienie do konfiguracji

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
Slot jest wyłączny w czasie uruchomienia - tylko jeden zarejestrowany silnik kontekstu jest rozwiązywany dla danego uruchomienia lub operacji Compaction. Inne włączone Pluginy `kind: "context-engine"` nadal mogą się ładować i uruchamiać swój kod rejestracji; `plugins.slots.contextEngine` wybiera tylko, który zarejestrowany identyfikator silnika OpenClaw rozwiązuje, gdy potrzebuje silnika kontekstu.
</Note>

<Note>
**Odinstalowanie Plugin:** gdy odinstalujesz Plugin obecnie wybrany jako `plugins.slots.contextEngine`, OpenClaw resetuje slot z powrotem do wartości domyślnej (`legacy`). To samo zachowanie resetowania dotyczy `plugins.slots.memory`. Ręczna edycja konfiguracji nie jest wymagana.
</Note>

## Relacja z Compaction i pamięcią

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction to jedna z odpowiedzialności silnika kontekstu. Starszy silnik deleguje to do wbudowanego podsumowywania OpenClaw. Silniki Plugin mogą implementować dowolną strategię kompaktowania (podsumowania DAG, pobieranie wektorowe itd.).
  </Accordion>
  <Accordion title="Pluginy pamięci">
    Pluginy pamięci (`plugins.slots.memory`) są oddzielone od silników kontekstu. Pluginy pamięci zapewniają wyszukiwanie/pobieranie; silniki kontekstu kontrolują, co widzi model. Mogą działać razem - silnik kontekstu może używać danych pluginu pamięci podczas składania. Silniki Plugin, które chcą używać ścieżki promptu aktywnej pamięci, powinny preferować `buildMemorySystemPromptAddition(...)` z `openclaw/plugin-sdk/core`, która konwertuje sekcje promptu aktywnej pamięci na gotowy do poprzedzenia `systemPromptAddition`. Jeśli silnik potrzebuje kontroli niższego poziomu, nadal może pobrać surowe wiersze z `openclaw/plugin-sdk/memory-host-core` za pomocą `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Przycinanie sesji">
    Przycinanie starych wyników narzędzi w pamięci nadal działa niezależnie od tego, który silnik kontekstu jest aktywny.
  </Accordion>
</AccordionGroup>

## Wskazówki

- Użyj `openclaw doctor`, aby zweryfikować, że silnik ładuje się poprawnie.
- Jeśli przełączasz silniki, istniejące sesje kontynuują pracę z bieżącą historią. Nowy silnik przejmuje obsługę przyszłych uruchomień.
- Błędy silnika są rejestrowane i pokazywane w diagnostyce. Jeśli silnik Plugin nie zarejestruje się albo nie da się rozwiązać identyfikatora wybranego silnika, OpenClaw nie przełączy się automatycznie na rozwiązanie zapasowe; uruchomienia będą kończyć się niepowodzeniem, dopóki nie naprawisz pluginu albo nie przełączysz `plugins.slots.contextEngine` z powrotem na `"legacy"`.
- Podczas developmentu użyj `openclaw plugins install -l ./my-engine`, aby połączyć lokalny katalog pluginu bez kopiowania.

## Powiązane

- [Compaction](/pl/concepts/compaction) - podsumowywanie długich rozmów
- [Kontekst](/pl/concepts/context) - jak kontekst jest budowany dla tur agenta
- [Architektura Plugin](/pl/plugins/architecture) - rejestrowanie pluginów silnika kontekstu
- [Manifest Plugin](/pl/plugins/manifest) - pola manifestu pluginu
- [Pluginy](/pl/tools/plugin) - omówienie pluginów
