---
read_when:
    - Chcesz zrozumieć, jak OpenClaw składa kontekst modelu
    - Przełączasz się między starszym silnikiem a silnikiem Plugin
    - Tworzysz Plugin silnika kontekstu
sidebarTitle: Context engine
summary: 'Silnik kontekstu: wtykowe składanie kontekstu, Compaction i cykl życia podagentów'
title: Silnik kontekstu
x-i18n:
    generated_at: "2026-06-30T14:31:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

**Silnik kontekstu** kontroluje sposób, w jaki OpenClaw buduje kontekst modelu dla każdego uruchomienia: które wiadomości uwzględnić, jak podsumowywać starszą historię i jak zarządzać kontekstem na granicach subagentów.

OpenClaw zawiera wbudowany silnik `legacy` i używa go domyślnie - większość użytkowników nigdy nie musi tego zmieniać. Zainstaluj i wybierz silnik Plugin tylko wtedy, gdy potrzebujesz innego składania, Compaction lub zachowania przywoływania między sesjami.

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
    Pluginy silnika kontekstu instaluje się tak jak każdy inny Plugin OpenClaw.

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

    Po instalacji i konfiguracji uruchom ponownie gateway.

  </Step>
  <Step title="Switch back to legacy (optional)">
    Ustaw `contextEngine` na `"legacy"` (albo całkowicie usuń klucz - `"legacy"` jest wartością domyślną).
  </Step>
</Steps>

## Jak to działa

Za każdym razem, gdy OpenClaw uruchamia prompt modelu, silnik kontekstu bierze udział w czterech punktach cyklu życia:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Wywoływane, gdy do sesji dodawana jest nowa wiadomość. Silnik może przechować lub zindeksować wiadomość we własnym magazynie danych.
  </Accordion>
  <Accordion title="2. Assemble">
    Wywoływane przed każdym uruchomieniem modelu. Silnik zwraca uporządkowany zestaw wiadomości (oraz opcjonalne `systemPromptAddition`), które mieszczą się w budżecie tokenów.
  </Accordion>
  <Accordion title="3. Compact">
    Wywoływane, gdy okno kontekstu jest pełne albo gdy użytkownik uruchamia `/compact`. Silnik podsumowuje starszą historię, aby zwolnić miejsce.
  </Accordion>
  <Accordion title="4. After turn">
    Wywoływane po zakończeniu uruchomienia. Silnik może utrwalić stan, uruchomić Compaction w tle albo zaktualizować indeksy.
  </Accordion>
</AccordionGroup>

Dla dołączonego harnessu Codex bez ACP OpenClaw stosuje ten sam cykl życia, odwzorowując złożony kontekst na instrukcje deweloperskie Codex i prompt bieżącej tury. Codex nadal posiada własną natywną historię wątku i natywny compactor.

### Cykl życia subagenta (opcjonalnie)

OpenClaw wywołuje dwa opcjonalne hooki cyklu życia subagenta:

<ParamField path="prepareSubagentSpawn" type="method">
  Przygotowuje współdzielony stan kontekstu przed rozpoczęciem uruchomienia podrzędnego. Hook otrzymuje klucze sesji nadrzędnej/podrzędnej, `contextMode` (`isolated` albo `fork`), dostępne identyfikatory/pliki transkryptów oraz opcjonalny TTL. Jeśli zwróci uchwyt wycofania, OpenClaw wywoła go, gdy uruchomienie subagenta nie powiedzie się po udanym przygotowaniu. Natywne uruchomienia subagentów, które żądają `lightContext` i rozwiązywane są do `contextMode="isolated"`, celowo pomijają ten hook, aby element podrzędny startował z lekkiego kontekstu bootstrap bez zarządzanego przez silnik kontekstu stanu sprzed uruchomienia.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Czyści zasoby po zakończeniu lub wymieceniu sesji subagenta.
</ParamField>

### Dodatek do promptu systemowego

Metoda `assemble` może zwrócić ciąg `systemPromptAddition`. OpenClaw dokleja go na początku promptu systemowego dla uruchomienia. Pozwala to silnikom wstrzykiwać dynamiczne wskazówki przywoływania, instrukcje pobierania lub podpowiedzi zależne od kontekstu bez wymagania statycznych plików workspace.

## Silnik legacy

Wbudowany silnik `legacy` zachowuje oryginalne zachowanie OpenClaw:

- **Ingest**: brak operacji (menedżer sesji bezpośrednio obsługuje utrwalanie wiadomości).
- **Assemble**: przekazanie bez zmian (istniejący pipeline oczyszczania → walidacji → limitowania w runtime obsługuje składanie kontekstu).
- **Compact**: deleguje do wbudowanej podsumowującej Compaction, która tworzy pojedyncze podsumowanie starszych wiadomości i pozostawia najnowsze wiadomości bez zmian.
- **After turn**: brak operacji.

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
dzięki czemu Pluginy mogą inicjalizować stan per agent lub per workspace przed
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

| Element            | Rodzaj   | Cel                                                      |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Właściwość | Identyfikator silnika, nazwa, wersja oraz informacja, czy zarządza Compaction |
| `ingest(params)`   | Metoda   | Przechowuje pojedynczą wiadomość                         |
| `assemble(params)` | Metoda   | Buduje kontekst dla uruchomienia modelu (zwraca `AssembleResult`) |
| `compact(params)`  | Metoda   | Podsumowuje/redukuje kontekst                            |

`assemble` zwraca `AssembleResult` z:

<ParamField path="messages" type="Message[]" required>
  Uporządkowane wiadomości do wysłania do modelu.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Oszacowanie silnika dotyczące łącznej liczby tokenów w złożonym kontekście. OpenClaw używa tego do decyzji o progach Compaction i raportowania diagnostycznego.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Doklejane na początku promptu systemowego.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Kontroluje, którego oszacowania tokenów runner używa do wyprzedzających
  kontroli przepełnienia. Domyślnie jest to `"assembled"`, co oznacza, że dla
  silników, które nie zarządzają Compaction, sprawdzane jest tylko oszacowanie
  złożonego promptu. Silniki ustawiające `ownsCompaction: true` samodzielnie
  zarządzają dopuszczaniem własnych promptów, więc OpenClaw domyślnie pomija
  ogólną kontrolę przed promptem. Ustaw `"preassembly_may_overflow"` tylko
  wtedy, gdy złożony widok może ukrywać ryzyko przepełnienia w bazowym
  transkrypcie; runner utrzymuje wtedy ogólną kontrolę aktywną i bierze maksimum
  z oszacowania złożonego oraz oszacowania historii sesji sprzed składania
  (bez okna), decydując, czy wyprzedzająco wykonać Compaction. W każdym
  przypadku wiadomości, które zwracasz, nadal są tym, co widzi model -
  `promptAuthority` wpływa tylko na kontrolę wstępną.
</ParamField>

`compact` zwraca `CompactResult`. Gdy Compaction rotuje aktywny
transkrypt, `result.sessionId` i `result.sessionFile` identyfikują następczą
sesję, której musi użyć następna próba lub tura.

Opcjonalne elementy:

| Element                        | Rodzaj | Cel                                                                                                             |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metoda | Inicjalizuje stan silnika dla sesji. Wywoływane raz, gdy silnik po raz pierwszy widzi sesję (np. import historii). |
| `ingestBatch(params)`          | Metoda | Pobiera zakończoną turę jako partię. Wywoływane po zakończeniu uruchomienia, ze wszystkimi wiadomościami z tej tury naraz. |
| `afterTurn(params)`            | Metoda | Praca cyklu życia po uruchomieniu (utrwalenie stanu, uruchomienie Compaction w tle).                            |
| `prepareSubagentSpawn(params)` | Metoda | Konfiguruje współdzielony stan dla sesji podrzędnej przed jej rozpoczęciem.                                     |
| `onSubagentEnded(params)`      | Metoda | Czyści zasoby po zakończeniu subagenta.                                                                         |
| `dispose()`                    | Metoda | Zwalnia zasoby. Wywoływane podczas zamykania gateway lub przeładowania Plugin - nie per sesja.                  |

### Ustawienia runtime

Hooki cyklu życia uruchamiane wewnątrz OpenClaw otrzymują opcjonalny
obiekt `runtimeSettings`. Jest to wersjonowana, wewnętrzna, tylko do odczytu
powierzchnia API producenta/konsumenta: OpenClaw wytwarza ją dla wybranego
silnika kontekstu, a silnik kontekstu zużywa ją wewnątrz hooków cyklu życia.
Nie jest renderowana bezpośrednio użytkownikom i nie tworzy dedykowanej
powierzchni raportowania.

- `schemaVersion`: obecnie `1`
- `runtime`: host OpenClaw, tryb runtime (`normal`, `fallback` albo
  `degraded`) oraz opcjonalne identyfikatory harnessu/runtime
- `contextEngineSelection`: identyfikator wybranego silnika kontekstu i źródło wyboru
- `executionHost`: identyfikator hosta i etykieta powierzchni wywołującej hook
- `model`: żądany model, rozwiązany model, dostawca i opcjonalna rodzina modelu
- `limits`: budżet tokenów promptu i maksymalna liczba tokenów wyjściowych, gdy znane
- `diagnostics`: zamknięte kody powodów fallback i degradacji, gdy znane

Pola, które mogą być nieznane, są reprezentowane jako `null`; pola dyskryminujące,
takie jak tryb runtime i źródło wyboru, pozostają nie-nullowalne. Starsze silniki
pozostają zgodne: jeśli ścisły silnik legacy odrzuci `runtimeSettings` jako
nieznaną właściwość, OpenClaw ponowi wywołanie cyklu życia bez niego, zamiast
kwarantannować silnik.

### Wymagania hosta

Silniki kontekstu mogą deklarować wymagania dotyczące możliwości hosta w `info.hostRequirements`.
OpenClaw sprawdza te wymagania przed rozpoczęciem operacji i zamyka ją błędem
z opisem, gdy wybrany runtime nie może ich spełnić.

Dla uruchomień agentów zadeklaruj `assemble-before-prompt`, gdy silnik musi kontrolować
rzeczywisty prompt modelu przez `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

Natywne uruchomienia agentów Codex i osadzone uruchomienia agentów OpenClaw spełniają `assemble-before-prompt`.
Ogólne backendy CLI nie spełniają tego wymagania, więc silniki, które go wymagają,
są odrzucane przed uruchomieniem procesu CLI.

### Izolacja awarii

OpenClaw izoluje wybrany silnik pluginu od głównej ścieżki odpowiedzi. Jeśli
silnika innego niż starszy brakuje, nie przechodzi walidacji kontraktu, zgłasza wyjątek podczas tworzenia fabryki
albo zgłasza wyjątek z metody cyklu życia, OpenClaw poddaje ten silnik kwarantannie
dla bieżącego procesu Gateway i degraduje pracę silnika kontekstu do
wbudowanego silnika `legacy`. Błąd jest logowany wraz z nieudaną operacją, aby
operator mógł naprawić, zaktualizować lub wyłączyć plugin bez wyciszenia
agenta.

Niepowodzenia wymagań hosta są inne: gdy silnik deklaruje, że środowisko uruchomieniowe
nie ma wymaganej funkcji, OpenClaw kończy działanie w trybie zamkniętym przed rozpoczęciem przebiegu. Chroni to
silniki, które uszkodziłyby stan, gdyby działały na nieobsługiwanym hoście.

### ownsCompaction

`ownsCompaction` kontroluje, czy wbudowana w środowisko uruchomieniowe OpenClaw automatyczna kompakcja w ramach próby pozostaje włączona dla przebiegu:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Silnik odpowiada za zachowanie kompakcji. OpenClaw wyłącza wbudowaną w środowisko uruchomieniowe OpenClaw automatyczną kompakcję i ogólny wstępny sprawdzian przepełnienia przed promptem dla tego przebiegu, a implementacja `compact()` silnika odpowiada za `/compact`, kompakcję odzyskiwania po przepełnieniu dostawcy oraz każdą proaktywną kompakcję, którą chce wykonać w `afterTurn()`. OpenClaw nadal uruchamia zabezpieczenie przed przepełnieniem przed promptem, gdy silnik zwraca `promptAuthority: "preassembly_may_overflow"` z `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false lub nieustawione">
    Wbudowana w środowisko uruchomieniowe OpenClaw automatyczna kompakcja może nadal działać podczas wykonywania promptu, ale metoda `compact()` aktywnego silnika nadal jest wywoływana dla `/compact` i odzyskiwania po przepełnieniu.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **nie** oznacza, że OpenClaw automatycznie wraca do ścieżki kompakcji silnika legacy.
</Warning>

Oznacza to, że istnieją dwa prawidłowe wzorce pluginów:

<Tabs>
  <Tab title="Tryb przejmowania odpowiedzialności">
    Zaimplementuj własny algorytm kompakcji i ustaw `ownsCompaction: true`.
  </Tab>
  <Tab title="Tryb delegowania">
    Ustaw `ownsCompaction: false` i spraw, aby `compact()` wywoływało `delegateCompactionToRuntime(...)` z `openclaw/plugin-sdk/core`, aby użyć wbudowanego zachowania kompakcji OpenClaw.
  </Tab>
</Tabs>

Puste `compact()` jest niebezpieczne dla aktywnego silnika, który nie przejmuje odpowiedzialności, ponieważ wyłącza normalną ścieżkę kompakcji `/compact` i odzyskiwania po przepełnieniu dla tego slotu silnika.

## Odniesienie konfiguracji

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
Slot jest wyłączny w czasie działania - dla danego przebiegu lub operacji kompakcji rozwiązywany jest tylko jeden zarejestrowany silnik kontekstu. Inne włączone pluginy `kind: "context-engine"` nadal mogą się ładować i uruchamiać swój kod rejestracji; `plugins.slots.contextEngine` wybiera tylko, który identyfikator zarejestrowanego silnika OpenClaw rozwiązuje, gdy potrzebuje silnika kontekstu.
</Note>

<Note>
**Odinstalowanie pluginu:** gdy odinstalujesz plugin aktualnie wybrany jako `plugins.slots.contextEngine`, OpenClaw resetuje slot z powrotem do wartości domyślnej (`legacy`). To samo zachowanie resetowania dotyczy `plugins.slots.memory`. Ręczna edycja konfiguracji nie jest wymagana.
</Note>

## Relacja do kompakcji i pamięci

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction jest jedną z odpowiedzialności silnika kontekstu. Silnik legacy deleguje do wbudowanego podsumowywania OpenClaw. Silniki pluginów mogą implementować dowolną strategię kompakcji (podsumowania DAG, wyszukiwanie wektorowe itd.).
  </Accordion>
  <Accordion title="Pluginy pamięci">
    Pluginy pamięci (`plugins.slots.memory`) są oddzielone od silników kontekstu. Pluginy pamięci zapewniają wyszukiwanie/odzyskiwanie; silniki kontekstu kontrolują, co widzi model. Mogą działać razem - silnik kontekstu może używać danych pluginu pamięci podczas składania. Silniki pluginów, które chcą korzystać z aktywnej ścieżki promptu pamięci, powinny preferować `buildMemorySystemPromptAddition(...)` z `openclaw/plugin-sdk/core`, które konwertuje aktywne sekcje promptu pamięci na gotowe do poprzedzenia `systemPromptAddition`. Jeśli silnik potrzebuje niższego poziomu kontroli, nadal może pobierać surowe wiersze z `openclaw/plugin-sdk/memory-host-core` przez `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Przycinanie sesji">
    Przycinanie starych wyników narzędzi w pamięci nadal działa niezależnie od tego, który silnik kontekstu jest aktywny.
  </Accordion>
</AccordionGroup>

## Wskazówki

- Użyj `openclaw doctor`, aby sprawdzić, czy silnik ładuje się poprawnie.
- Jeśli przełączasz silniki, istniejące sesje kontynuują pracę ze swoją bieżącą historią. Nowy silnik przejmuje przyszłe przebiegi.
- Błędy silnika są logowane, a wybrany silnik pluginu jest poddawany kwarantannie dla bieżącego procesu Gateway. OpenClaw wraca do `legacy` dla tur użytkownika, aby odpowiedzi mogły być kontynuowane, ale nadal należy naprawić, zaktualizować, wyłączyć lub odinstalować uszkodzony plugin.
- Podczas programowania użyj `openclaw plugins install -l ./my-engine`, aby połączyć lokalny katalog pluginu bez kopiowania.

## Powiązane

- [Compaction](/pl/concepts/compaction) - podsumowywanie długich rozmów
- [Kontekst](/pl/concepts/context) - jak kontekst jest budowany dla tur agenta
- [Architektura pluginów](/pl/plugins/architecture) - rejestrowanie pluginów silnika kontekstu
- [Manifest pluginu](/pl/plugins/manifest) - pola manifestu pluginu
- [Pluginy](/pl/tools/plugin) - przegląd pluginów
