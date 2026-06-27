---
read_when:
    - Chcesz zrozumieć, jak OpenClaw składa kontekst modelu
    - Przełączasz się między starszym silnikiem a silnikiem Plugin
    - Tworzysz Plugin silnika kontekstu
sidebarTitle: Context engine
summary: 'Silnik kontekstu: modułowe składanie kontekstu, Compaction i cykl życia podagentów'
title: Silnik kontekstu
x-i18n:
    generated_at: "2026-06-27T17:25:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

**Silnik kontekstu** kontroluje sposób, w jaki OpenClaw buduje kontekst modelu dla każdego uruchomienia: które wiadomości uwzględnić, jak podsumowywać starszą historię i jak zarządzać kontekstem ponad granicami subagentów.

OpenClaw zawiera wbudowany silnik `legacy` i domyślnie go używa - większość użytkowników nigdy nie musi tego zmieniać. Zainstaluj i wybierz silnik pluginu tylko wtedy, gdy potrzebujesz innego składania, Compaction lub zachowania przywoływania między sesjami.

## Szybki start

<Steps>
  <Step title="Sprawdź, który silnik jest aktywny">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Zainstaluj silnik pluginu">
    Pluginy silnika kontekstu instaluje się tak jak każdy inny plugin OpenClaw.

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
  <Step title="Przełącz z powrotem na legacy (opcjonalnie)">
    Ustaw `contextEngine` na `"legacy"` (albo całkowicie usuń klucz - `"legacy"` jest wartością domyślną).
  </Step>
</Steps>

## Jak to działa

Za każdym razem, gdy OpenClaw uruchamia prompt modelu, silnik kontekstu uczestniczy w czterech punktach cyklu życia:

<AccordionGroup>
  <Accordion title="1. Przyjęcie">
    Wywoływane, gdy do sesji dodawana jest nowa wiadomość. Silnik może zapisać lub zindeksować wiadomość we własnym magazynie danych.
  </Accordion>
  <Accordion title="2. Składanie">
    Wywoływane przed każdym uruchomieniem modelu. Silnik zwraca uporządkowany zestaw wiadomości (oraz opcjonalny `systemPromptAddition`), które mieszczą się w budżecie tokenów.
  </Accordion>
  <Accordion title="3. Compaction">
    Wywoływane, gdy okno kontekstu jest pełne albo gdy użytkownik uruchamia `/compact`. Silnik podsumowuje starszą historię, aby zwolnić miejsce.
  </Accordion>
  <Accordion title="4. Po turze">
    Wywoływane po zakończeniu uruchomienia. Silnik może utrwalić stan, wyzwolić Compaction w tle lub zaktualizować indeksy.
  </Accordion>
</AccordionGroup>

Dla dołączonego harnessu Codex innego niż ACP OpenClaw stosuje ten sam cykl życia, rzutując złożony kontekst na instrukcje deweloperskie Codex i prompt bieżącej tury. Codex nadal jest właścicielem swojej natywnej historii wątku i natywnego kompaktora.

### Cykl życia subagenta (opcjonalnie)

OpenClaw wywołuje dwa opcjonalne haki cyklu życia subagenta:

<ParamField path="prepareSubagentSpawn" type="method">
  Przygotowuje współdzielony stan kontekstu przed rozpoczęciem uruchomienia potomnego. Hak otrzymuje klucze sesji rodzica/dziecka, `contextMode` (`isolated` lub `fork`), dostępne identyfikatory/pliki transkrypcji oraz opcjonalny TTL. Jeśli zwróci uchwyt wycofania, OpenClaw wywoła go, gdy uruchomienie potomne nie powiedzie się po udanym przygotowaniu. Natywne uruchomienia subagentów, które żądają `lightContext` i rozwiążą się do `contextMode="isolated"`, celowo pomijają ten hak, aby dziecko zaczęło od lekkiego kontekstu startowego bez stanu sprzed uruchomienia zarządzanego przez silnik kontekstu.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Czyści zasoby po zakończeniu lub wymieceniu sesji subagenta.
</ParamField>

### Dodatek do promptu systemowego

Metoda `assemble` może zwrócić ciąg `systemPromptAddition`. OpenClaw poprzedza nim prompt systemowy dla uruchomienia. Pozwala to silnikom wstrzykiwać dynamiczne wskazówki przywoływania, instrukcje pobierania lub wskazówki świadome kontekstu bez wymagania statycznych plików workspace.

## Silnik legacy

Wbudowany silnik `legacy` zachowuje oryginalne zachowanie OpenClaw:

- **Przyjęcie**: brak operacji (menedżer sesji obsługuje utrwalanie wiadomości bezpośrednio).
- **Składanie**: przekazanie bez zmian (istniejący potok sanitize → validate → limit w runtime obsługuje składanie kontekstu).
- **Compaction**: deleguje do wbudowanego podsumowującego Compaction, które tworzy pojedyncze podsumowanie starszych wiadomości i zachowuje ostatnie wiadomości bez zmian.
- **Po turze**: brak operacji.

Silnik legacy nie rejestruje narzędzi ani nie udostępnia `systemPromptAddition`.

Gdy `plugins.slots.contextEngine` nie jest ustawione (albo jest ustawione na `"legacy"`), ten silnik jest używany automatycznie.

## Silniki pluginów

Plugin może zarejestrować silnik kontekstu za pomocą API pluginu:

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
aby pluginy mogły zainicjować stan dla agenta lub workspace przed uruchomieniem
pierwszego haka cyklu życia.

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
| `info`             | Właściwość | Identyfikator silnika, nazwa, wersja i to, czy posiada Compaction |
| `ingest(params)`   | Metoda     | Zapisz pojedynczą wiadomość                                   |
| `assemble(params)` | Metoda     | Zbuduj kontekst dla uruchomienia modelu (zwraca `AssembleResult`) |
| `compact(params)`  | Metoda     | Podsumuj/zmniejsz kontekst                                    |

`assemble` zwraca `AssembleResult` z:

<ParamField path="messages" type="Message[]" required>
  Uporządkowane wiadomości do wysłania do modelu.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Oszacowanie silnika dotyczące łącznej liczby tokenów w złożonym kontekście. OpenClaw używa tego do decyzji o progach Compaction i raportowania diagnostycznego.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Dodawane przed promptem systemowym.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Kontroluje, którego oszacowania tokenów runner używa do prewencyjnych
  kontroli przepełnienia. Domyślna wartość to `"assembled"`, co oznacza, że
  sprawdzane jest tylko oszacowanie złożonego promptu - właściwe dla silników,
  które zwracają okienkowany, samodzielny kontekst. Ustaw
  `"preassembly_may_overflow"` tylko wtedy, gdy złożony widok może ukrywać
  ryzyko przepełnienia w bazowej transkrypcji; runner bierze wtedy maksimum
  z oszacowania złożonego oraz oszacowania historii sesji sprzed składania
  (bez okienkowania), gdy decyduje, czy prewencyjnie wykonać Compaction.
  Tak czy inaczej, zwrócone wiadomości nadal są tym, co widzi model -
  `promptAuthority` wpływa tylko na kontrolę wstępną.
</ParamField>

`compact` zwraca `CompactResult`. Gdy Compaction rotuje aktywną
transkrypcję, `result.sessionId` i `result.sessionFile` identyfikują następczą
sesję, której musi użyć następna ponowna próba lub tura.

Elementy opcjonalne:

| Element                        | Rodzaj | Cel                                                                                                             |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metoda | Zainicjuj stan silnika dla sesji. Wywoływane raz, gdy silnik po raz pierwszy widzi sesję (np. import historii). |
| `ingestBatch(params)`          | Metoda | Przyjmij zakończoną turę jako partię. Wywoływane po zakończeniu uruchomienia, ze wszystkimi wiadomościami z tej tury naraz. |
| `afterTurn(params)`            | Metoda | Praca cyklu życia po uruchomieniu (utrwalenie stanu, wyzwolenie Compaction w tle).                              |
| `prepareSubagentSpawn(params)` | Metoda | Skonfiguruj współdzielony stan dla sesji potomnej przed jej rozpoczęciem.                                       |
| `onSubagentEnded(params)`      | Metoda | Posprzątaj po zakończeniu subagenta.                                                                            |
| `dispose()`                    | Metoda | Zwolnij zasoby. Wywoływane podczas zamykania Gateway lub przeładowania pluginu - nie dla każdej sesji.          |

### Ustawienia runtime

Haki cyklu życia uruchamiane wewnątrz OpenClaw otrzymują opcjonalny
obiekt `runtimeSettings`. Jest to wersjonowana, wewnętrzna, tylko do odczytu
powierzchnia API producenta/konsumenta: OpenClaw produkuje ją dla wybranego
silnika kontekstu, a silnik kontekstu zużywa ją wewnątrz haków cyklu życia.
Nie jest renderowana bezpośrednio użytkownikom i nie tworzy dedykowanej
powierzchni raportowania.

- `schemaVersion`: obecnie `1`
- `runtime`: host OpenClaw, tryb runtime (`normal`, `fallback` lub
  `degraded`) oraz opcjonalne identyfikatory harnessu/runtime
- `contextEngineSelection`: identyfikator wybranego silnika kontekstu i źródło wyboru
- `executionHost`: identyfikator i etykieta hosta dla powierzchni wywołującej hak
- `model`: żądany model, rozwiązany model, dostawca i opcjonalna rodzina modelu
- `limits`: budżet tokenów promptu i maksymalna liczba tokenów wyjściowych, gdy znane
- `diagnostics`: zamknięte kody powodów fallback i degraded, gdy znane

Pola, które mogą być nieznane, są reprezentowane jako `null`; pola dyskryminujące,
takie jak tryb runtime i źródło wyboru, pozostają nienullowalne. Starsze silniki
pozostają zgodne: jeśli ścisły silnik legacy odrzuci `runtimeSettings` jako
nieznaną właściwość, OpenClaw ponowi wywołanie cyklu życia bez niej zamiast
kwarantannować silnik.

### Wymagania hosta

Silniki kontekstu mogą deklarować wymagania dotyczące możliwości hosta w `info.hostRequirements`.
OpenClaw sprawdza te wymagania przed rozpoczęciem operacji i zamyka się
z opisowym błędem, gdy wybrany runtime nie może ich spełnić.

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

Natywne uruchomienia agentów Codex i osadzonego OpenClaw spełniają `assemble-before-prompt`.
Ogólne backendy CLI nie spełniają go, więc silniki, które go wymagają, są odrzucane przed
startem procesu CLI.

### Izolacja awarii

OpenClaw izoluje wybrany silnik pluginu od głównej ścieżki odpowiedzi. Jeśli
brakuje silnika innego niż legacy, nie przechodzi walidacji kontraktu, zgłasza
wyjątek podczas tworzenia fabryki albo zgłasza wyjątek z metody cyklu życia,
OpenClaw kwarantannuje ten silnik dla bieżącego procesu Gateway i obniża pracę
silnika kontekstu do wbudowanego silnika `legacy`. Błąd jest logowany wraz
z nieudaną operacją, aby operator mógł naprawić, zaktualizować lub wyłączyć
plugin bez powodowania zamilknięcia agenta.

Niepowodzenia wymagań hosta są inne: gdy silnik deklaruje, że runtime
nie ma wymaganej capability, OpenClaw kończy bezpiecznie niepowodzeniem przed rozpoczęciem uruchomienia. To
chroni silniki, które uszkodziłyby stan, gdyby działały w nieobsługiwanym hoście.

### ownsCompaction

`ownsCompaction` kontroluje, czy wbudowana w runtime OpenClaw automatyczna kompakcja w obrębie próby pozostaje włączona dla uruchomienia:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Silnik odpowiada za zachowanie kompakcji. OpenClaw wyłącza wbudowaną automatyczną kompakcję runtime OpenClaw dla tego uruchomienia, a implementacja `compact()` silnika odpowiada za `/compact`, kompakcję odzyskiwania po przepełnieniu oraz każdą proaktywną kompakcję, którą chce wykonać w `afterTurn()`. OpenClaw nadal może uruchomić zabezpieczenie przed przepełnieniem przed promptem; gdy przewidzi, że pełny transkrypt się przepełni, ścieżka odzyskiwania wywołuje `compact()` aktywnego silnika przed wysłaniem kolejnego promptu.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Wbudowana automatyczna kompakcja runtime OpenClaw nadal może działać podczas wykonywania promptu, ale metoda `compact()` aktywnego silnika nadal jest wywoływana dla `/compact` i odzyskiwania po przepełnieniu.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **nie** oznacza, że OpenClaw automatycznie wraca do ścieżki kompakcji starszego silnika.
</Warning>

Oznacza to, że istnieją dwa prawidłowe wzorce pluginów:

<Tabs>
  <Tab title="Owning mode">
    Zaimplementuj własny algorytm kompakcji i ustaw `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegating mode">
    Ustaw `ownsCompaction: false` i spraw, aby `compact()` wywoływało `delegateCompactionToRuntime(...)` z `openclaw/plugin-sdk/core`, aby użyć wbudowanego zachowania kompakcji OpenClaw.
  </Tab>
</Tabs>

Puste `compact()` jest niebezpieczne dla aktywnego silnika, który nie przejmuje odpowiedzialności, ponieważ wyłącza normalną ścieżkę kompakcji `/compact` i odzyskiwania po przepełnieniu dla tego slotu silnika.

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
Slot jest wyłączny w czasie uruchomienia - dla danego uruchomienia lub operacji kompakcji rozwiązywany jest tylko jeden zarejestrowany silnik kontekstu. Inne włączone pluginy `kind: "context-engine"` nadal mogą się ładować i uruchamiać swój kod rejestracji; `plugins.slots.contextEngine` wybiera tylko, który identyfikator zarejestrowanego silnika OpenClaw rozwiązuje, gdy potrzebuje silnika kontekstu.
</Note>

<Note>
**Odinstalowanie pluginu:** gdy odinstalujesz plugin aktualnie wybrany jako `plugins.slots.contextEngine`, OpenClaw resetuje slot z powrotem do wartości domyślnej (`legacy`). To samo zachowanie resetowania dotyczy `plugins.slots.memory`. Ręczna edycja konfiguracji nie jest wymagana.
</Note>

## Relacja z kompakcją i pamięcią

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction jest jedną z odpowiedzialności silnika kontekstu. Starszy silnik deleguje do wbudowanego podsumowywania OpenClaw. Silniki pluginów mogą implementować dowolną strategię kompakcji (podsumowania DAG, pobieranie wektorowe itd.).
  </Accordion>
  <Accordion title="Memory plugins">
    Pluginy pamięci (`plugins.slots.memory`) są oddzielne od silników kontekstu. Pluginy pamięci zapewniają wyszukiwanie/pobieranie; silniki kontekstu kontrolują to, co widzi model. Mogą współpracować - silnik kontekstu może używać danych pluginu pamięci podczas składania. Silniki pluginów, które chcą używać aktywnej ścieżki promptu pamięci, powinny preferować `buildMemorySystemPromptAddition(...)` z `openclaw/plugin-sdk/core`, które konwertuje aktywne sekcje promptu pamięci na gotowe do dołączenia na początku `systemPromptAddition`. Jeśli silnik potrzebuje kontroli niższego poziomu, nadal może pobierać surowe wiersze z `openclaw/plugin-sdk/memory-host-core` przez `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Session pruning">
    Przycinanie starych wyników narzędzi w pamięci nadal działa niezależnie od tego, który silnik kontekstu jest aktywny.
  </Accordion>
</AccordionGroup>

## Wskazówki

- Użyj `openclaw doctor`, aby sprawdzić, czy silnik ładuje się poprawnie.
- Jeśli przełączasz silniki, istniejące sesje kontynuują pracę z bieżącą historią. Nowy silnik przejmuje obsługę przyszłych uruchomień.
- Błędy silnika są rejestrowane, a wybrany silnik pluginu jest poddawany kwarantannie dla bieżącego procesu Gateway. OpenClaw wraca do `legacy` dla tur użytkownika, aby odpowiedzi mogły być kontynuowane, ale nadal należy naprawić, zaktualizować, wyłączyć lub odinstalować uszkodzony plugin.
- Podczas programowania użyj `openclaw plugins install -l ./my-engine`, aby podlinkować lokalny katalog pluginu bez kopiowania.

## Powiązane

- [Compaction](/pl/concepts/compaction) - podsumowywanie długich konwersacji
- [Kontekst](/pl/concepts/context) - jak kontekst jest budowany dla tur agenta
- [Architektura pluginów](/pl/plugins/architecture) - rejestrowanie pluginów silnika kontekstu
- [Manifest pluginu](/pl/plugins/manifest) - pola manifestu pluginu
- [Pluginy](/pl/tools/plugin) - omówienie pluginów
