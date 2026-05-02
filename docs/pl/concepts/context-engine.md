---
read_when:
    - Chcesz zrozumieć, jak OpenClaw składa kontekst modelu
    - Przełączasz się między starszym silnikiem a silnikiem pluginów
    - Tworzysz Plugin silnika kontekstu
sidebarTitle: Context engine
summary: 'Silnik kontekstu: modułowe składanie kontekstu, Compaction i cykl życia subagentów'
title: Silnik kontekstu
x-i18n:
    generated_at: "2026-05-02T09:47:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

**Silnik kontekstu** kontroluje, jak OpenClaw buduje kontekst modelu dla każdego uruchomienia: które wiadomości uwzględnić, jak podsumowywać starszą historię i jak zarządzać kontekstem na granicach subagentów.

OpenClaw jest dostarczany z wbudowanym silnikiem `legacy` i używa go domyślnie — większość użytkowników nigdy nie musi tego zmieniać. Zainstaluj i wybierz silnik Plugin tylko wtedy, gdy potrzebujesz innego składania, Compaction lub zachowania przywoływania między sesjami.

## Szybki start

<Steps>
  <Step title="Sprawdź, który silnik jest aktywny">
    ```bash
    openclaw doctor
    # lub sprawdź konfigurację bezpośrednio:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Zainstaluj silnik Plugin">
    Plugin silnika kontekstu instaluje się tak jak każdy inny Plugin OpenClaw.

    <Tabs>
      <Tab title="Z npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Ze ścieżki lokalnej">
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

    Po zainstalowaniu i skonfigurowaniu uruchom ponownie Gateway.

  </Step>
  <Step title="Przełącz z powrotem na legacy (opcjonalnie)">
    Ustaw `contextEngine` na `"legacy"` (albo całkowicie usuń klucz — `"legacy"` jest wartością domyślną).
  </Step>
</Steps>

## Jak to działa

Za każdym razem, gdy OpenClaw uruchamia prompt modelu, silnik kontekstu uczestniczy w czterech punktach cyklu życia:

<AccordionGroup>
  <Accordion title="1. Pobranie">
    Wywoływane, gdy do sesji zostanie dodana nowa wiadomość. Silnik może zapisać lub zaindeksować wiadomość we własnym magazynie danych.
  </Accordion>
  <Accordion title="2. Złożenie">
    Wywoływane przed każdym uruchomieniem modelu. Silnik zwraca uporządkowany zestaw wiadomości (oraz opcjonalny `systemPromptAddition`), który mieści się w budżecie tokenów.
  </Accordion>
  <Accordion title="3. Compact">
    Wywoływane, gdy okno kontekstu jest pełne albo gdy użytkownik uruchamia `/compact`. Silnik podsumowuje starszą historię, aby zwolnić miejsce.
  </Accordion>
  <Accordion title="4. Po turze">
    Wywoływane po zakończeniu uruchomienia. Silnik może utrwalić stan, uruchomić Compaction w tle albo zaktualizować indeksy.
  </Accordion>
</AccordionGroup>

Dla dołączonego harnessu Codex innego niż ACP OpenClaw stosuje ten sam cykl życia, rzutując złożony kontekst na instrukcje deweloperskie Codex i prompt bieżącej tury. Codex nadal posiada własną natywną historię wątku i natywny mechanizm kompaktowania.

### Cykl życia subagenta (opcjonalnie)

OpenClaw wywołuje dwa opcjonalne hooki cyklu życia subagenta:

<ParamField path="prepareSubagentSpawn" type="method">
  Przygotuj współdzielony stan kontekstu przed rozpoczęciem uruchomienia podrzędnego. Hook otrzymuje klucze sesji nadrzędnej/podrzędnej, `contextMode` (`isolated` albo `fork`), dostępne identyfikatory/pliki transkrypcji oraz opcjonalny TTL. Jeśli zwróci uchwyt wycofania, OpenClaw wywoła go, gdy utworzenie subagenta nie powiedzie się po udanym przygotowaniu.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Wyczyść zasoby, gdy sesja subagenta zostanie zakończona lub wymieciona.
</ParamField>

### Dodatek do promptu systemowego

Metoda `assemble` może zwrócić ciąg `systemPromptAddition`. OpenClaw poprzedza nim prompt systemowy dla danego uruchomienia. Pozwala to silnikom wstrzykiwać dynamiczne wskazówki przywoływania, instrukcje wyszukiwania lub podpowiedzi świadome kontekstu bez wymagania statycznych plików obszaru roboczego.

## Silnik legacy

Wbudowany silnik `legacy` zachowuje pierwotne zachowanie OpenClaw:

- **Pobranie**: brak działania (menedżer sesji bezpośrednio obsługuje utrwalanie wiadomości).
- **Złożenie**: przekazanie bez zmian (istniejący potok sanitize → validate → limit w środowisku wykonawczym obsługuje składanie kontekstu).
- **Compact**: deleguje do wbudowanego podsumowującego Compaction, które tworzy jedno podsumowanie starszych wiadomości i zachowuje ostatnie wiadomości bez zmian.
- **Po turze**: brak działania.

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
aby Plugin mógł zainicjować stan dla agenta lub obszaru roboczego przed
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

| Element            | Rodzaj     | Cel                                                         |
| ------------------ | ---------- | ----------------------------------------------------------- |
| `info`             | Właściwość | Identyfikator silnika, nazwa, wersja i czy posiada Compaction |
| `ingest(params)`   | Metoda     | Zapisanie pojedynczej wiadomości                            |
| `assemble(params)` | Metoda     | Zbudowanie kontekstu dla uruchomienia modelu (zwraca `AssembleResult`) |
| `compact(params)`  | Metoda     | Podsumowanie/zmniejszenie kontekstu                         |

`assemble` zwraca `AssembleResult` z:

<ParamField path="messages" type="Message[]" required>
  Uporządkowane wiadomości do wysłania do modelu.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Oszacowanie przez silnik łącznej liczby tokenów w złożonym kontekście. OpenClaw używa tego do decyzji o progach Compaction i raportowania diagnostycznego.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Dodawane przed promptem systemowym.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Kontroluje, którego oszacowania tokenów runner używa do wyprzedzających
  kontroli przepełnienia. Domyślnie `"assembled"`, co oznacza, że sprawdzane
  jest tylko oszacowanie złożonego promptu — właściwe dla silników, które zwracają
  okienkowany, samowystarczalny kontekst. Ustaw na `"preassembly_may_overflow"`
  tylko wtedy, gdy złożony widok może ukrywać ryzyko przepełnienia w bazowej
  transkrypcji; runner bierze wtedy maksimum z oszacowania złożonego oraz
  oszacowania historii sesji sprzed złożenia (bez okienkowania) przy podejmowaniu
  decyzji, czy wyprzedzająco wykonać Compaction. W obu przypadkach wiadomości,
  które zwracasz, nadal są tym, co widzi model — `promptAuthority` wpływa tylko
  na kontrolę wstępną.
</ParamField>

`compact` zwraca `CompactResult`. Gdy Compaction rotuje aktywną
transkrypcję, `result.sessionId` i `result.sessionFile` identyfikują następną
sesję, której musi użyć kolejna próba lub tura.

Opcjonalne elementy:

| Element                        | Rodzaj | Cel                                                                                                             |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metoda | Zainicjowanie stanu silnika dla sesji. Wywoływane raz, gdy silnik po raz pierwszy widzi sesję (np. import historii). |
| `ingestBatch(params)`          | Metoda | Pobranie zakończonej tury jako partii. Wywoływane po zakończeniu uruchomienia, ze wszystkimi wiadomościami z tej tury naraz. |
| `afterTurn(params)`            | Metoda | Praca cyklu życia po uruchomieniu (utrwalenie stanu, uruchomienie Compaction w tle).                           |
| `prepareSubagentSpawn(params)` | Metoda | Skonfigurowanie współdzielonego stanu dla sesji podrzędnej przed jej rozpoczęciem.                             |
| `onSubagentEnded(params)`      | Metoda | Czyszczenie po zakończeniu subagenta.                                                                           |
| `dispose()`                    | Metoda | Zwolnienie zasobów. Wywoływane podczas zamykania Gateway lub ponownego ładowania Plugin — nie dla każdej sesji. |

### ownsCompaction

`ownsCompaction` kontroluje, czy wbudowane w Pi automatyczne Compaction w ramach próby pozostaje włączone dla uruchomienia:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Silnik posiada zachowanie Compaction. OpenClaw wyłącza wbudowane automatyczne Compaction Pi dla tego uruchomienia, a implementacja `compact()` silnika odpowiada za `/compact`, Compaction odzyskiwania po przepełnieniu i dowolne proaktywne Compaction, które chce wykonać w `afterTurn()`. OpenClaw może nadal uruchomić zabezpieczenie przed przepełnieniem przed promptem; gdy przewidzi, że pełna transkrypcja się przepełni, ścieżka odzyskiwania wywołuje `compact()` aktywnego silnika przed przesłaniem kolejnego promptu.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Wbudowane automatyczne Compaction Pi może nadal działać podczas wykonywania promptu, ale metoda `compact()` aktywnego silnika nadal jest wywoływana dla `/compact` i odzyskiwania po przepełnieniu.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **nie** oznacza, że OpenClaw automatycznie wraca do ścieżki Compaction silnika legacy.
</Warning>

Oznacza to, że istnieją dwa prawidłowe wzorce Plugin:

<Tabs>
  <Tab title="Tryb posiadania">
    Zaimplementuj własny algorytm Compaction i ustaw `ownsCompaction: true`.
  </Tab>
  <Tab title="Tryb delegowania">
    Ustaw `ownsCompaction: false` i spraw, aby `compact()` wywoływało `delegateCompactionToRuntime(...)` z `openclaw/plugin-sdk/core`, aby użyć wbudowanego zachowania Compaction OpenClaw.
  </Tab>
</Tabs>

`compact()` bez działania jest niebezpieczne dla aktywnego silnika nieposiadającego, ponieważ wyłącza normalną ścieżkę Compaction `/compact` i odzyskiwania po przepełnieniu dla tego slotu silnika.

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
Slot jest wyłączny w czasie uruchomienia — dla danego uruchomienia lub operacji Compaction rozwiązywany jest tylko jeden zarejestrowany silnik kontekstu. Inne włączone Plugin z `kind: "context-engine"` nadal mogą się ładować i uruchamiać swój kod rejestracji; `plugins.slots.contextEngine` wybiera tylko, który zarejestrowany identyfikator silnika OpenClaw rozwiązuje, gdy potrzebuje silnika kontekstu.
</Note>

<Note>
**Odinstalowanie Plugin:** gdy odinstalujesz Plugin obecnie wybrany jako `plugins.slots.contextEngine`, OpenClaw resetuje slot z powrotem do wartości domyślnej (`legacy`). To samo zachowanie resetowania dotyczy `plugins.slots.memory`. Ręczna edycja konfiguracji nie jest wymagana.
</Note>

## Relacja z Compaction i pamięcią

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction to jedna z odpowiedzialności silnika kontekstu. Starszy silnik deleguje to do wbudowanego podsumowywania OpenClaw. Silniki Plugin mogą implementować dowolną strategię kompaktowania (podsumowania DAG, wyszukiwanie wektorowe itd.).
  </Accordion>
  <Accordion title="Pluginy pamięci">
    Pluginy pamięci (`plugins.slots.memory`) są oddzielne od silników kontekstu. Pluginy pamięci zapewniają wyszukiwanie/pobieranie; silniki kontekstu kontrolują, co widzi model. Mogą działać razem — silnik kontekstu może używać danych pluginu pamięci podczas składania. Silniki Plugin, które chcą korzystać ze ścieżki aktywnego promptu pamięci, powinny preferować `buildMemorySystemPromptAddition(...)` z `openclaw/plugin-sdk/core`, która konwertuje sekcje aktywnego promptu pamięci na gotowe do poprzedzenia `systemPromptAddition`. Jeśli silnik potrzebuje niższego poziomu kontroli, nadal może pobierać surowe wiersze z `openclaw/plugin-sdk/memory-host-core` przez `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Przycinanie sesji">
    Przycinanie starych wyników narzędzi w pamięci nadal działa niezależnie od tego, który silnik kontekstu jest aktywny.
  </Accordion>
</AccordionGroup>

## Wskazówki

- Użyj `openclaw doctor`, aby sprawdzić, czy Twój silnik ładuje się poprawnie.
- Jeśli przełączasz silniki, istniejące sesje kontynuują działanie z bieżącą historią. Nowy silnik przejmie obsługę przyszłych uruchomień.
- Błędy silnika są rejestrowane i widoczne w diagnostyce. Jeśli silnik Plugin nie zarejestruje się albo nie da się rozpoznać identyfikatora wybranego silnika, OpenClaw nie przełącza się automatycznie na rozwiązanie zapasowe; uruchomienia będą kończyć się niepowodzeniem, dopóki nie naprawisz pluginu albo nie przełączysz `plugins.slots.contextEngine` z powrotem na `"legacy"`.
- Do pracy deweloperskiej użyj `openclaw plugins install -l ./my-engine`, aby połączyć lokalny katalog pluginu bez kopiowania.

## Powiązane

- [Compaction](/pl/concepts/compaction) — podsumowywanie długich konwersacji
- [Kontekst](/pl/concepts/context) — jak kontekst jest budowany dla tur agenta
- [Architektura Plugin](/pl/plugins/architecture) — rejestrowanie pluginów silnika kontekstu
- [Manifest Plugin](/pl/plugins/manifest) — pola manifestu pluginu
- [Pluginy](/pl/tools/plugin) — omówienie pluginów
