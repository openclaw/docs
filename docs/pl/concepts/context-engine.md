---
read_when:
    - Chcesz zrozumieć, jak OpenClaw tworzy kontekst modelu
    - Przełączasz się między starszym silnikiem a silnikiem Pluginu
    - Tworzysz plugin silnika kontekstu
sidebarTitle: Context engine
summary: 'Silnik kontekstu: modułowe składanie kontekstu, Compaction i cykl życia podagentów'
title: Silnik kontekstu
x-i18n:
    generated_at: "2026-07-16T18:13:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 05cb5eb01f002001354dc63b77cdb86f3e9f3bc51722bd943ac20c9e1566dc60
    source_path: concepts/context-engine.md
    workflow: 16
---

**Silnik kontekstu** kontroluje sposób, w jaki OpenClaw tworzy kontekst modelu dla każdego uruchomienia: które wiadomości uwzględnić, jak podsumować starszą historię i jak zarządzać kontekstem między granicami podagentów.

OpenClaw zawiera wbudowany silnik `legacy` i używa go domyślnie. Silnik Pluginu należy zainstalować i wybrać tylko wtedy, gdy potrzebny jest inny sposób składania, Compaction lub przywoływania informacji między sesjami.

## Szybki start

<Steps>
  <Step title="Sprawdzanie aktywnego silnika">
    ```bash
    openclaw doctor
    # lub sprawdź konfigurację bezpośrednio:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Instalowanie silnika Pluginu">
    Pluginy silnika kontekstu instaluje się tak samo jak każdy inny Plugin OpenClaw.

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
  <Step title="Włączanie i wybieranie silnika">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // musi odpowiadać identyfikatorowi silnika zarejestrowanemu przez Plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Tutaj znajduje się konfiguracja właściwa dla Pluginu (zobacz dokumentację Pluginu)
          },
        },
      },
    }
    ```

    Po zainstalowaniu i skonfigurowaniu należy ponownie uruchomić Gateway.

  </Step>
  <Step title="Powrót do starszego silnika (opcjonalnie)">
    Ustaw `contextEngine` na `"legacy"` (lub całkowicie usuń klucz — wartością domyślną jest `"legacy"`).
  </Step>
</Steps>

## Sposób działania

Za każdym razem, gdy OpenClaw uruchamia prompt modelu, silnik kontekstu uczestniczy w czterech punktach cyklu życia:

<AccordionGroup>
  <Accordion title="1. Pobieranie">
    Wywoływane po dodaniu nowej wiadomości do sesji. Silnik może zapisać lub zindeksować wiadomość we własnym magazynie danych.
  </Accordion>
  <Accordion title="2. Składanie">
    Wywoływane przed każdym uruchomieniem modelu. Silnik zwraca uporządkowany zestaw wiadomości (oraz opcjonalny element `systemPromptAddition`), które mieszczą się w budżecie tokenów.
  </Accordion>
  <Accordion title="3. Compaction">
    Wywoływane po zapełnieniu okna kontekstu lub uruchomieniu przez użytkownika polecenia `/compact`. Silnik podsumowuje starszą historię, aby zwolnić miejsce.
  </Accordion>
  <Accordion title="4. Po turze">
    Wywoływane po zakończeniu uruchomienia. Silnik może utrwalić stan, uruchomić Compaction w tle lub zaktualizować indeksy.
  </Accordion>
</AccordionGroup>

Silniki mogą także implementować opcjonalną metodę `maintain()` do obsługi transkrypcji (bezpiecznych zmian za pomocą `runtimeContext.rewriteTranscriptEntries()`) po inicjalizacji, pomyślnej turze lub Compaction. Ustaw `info.turnMaintenanceMode: "background"`, aby uruchamiać ją jako zadanie odroczone zamiast blokować odpowiedź.

W przypadku dołączonego zestawu narzędzi Codex bez ACP OpenClaw stosuje ten sam cykl życia, odwzorowując złożony kontekst na instrukcje deweloperskie Codex i prompt bieżącej tury. Codex nadal zarządza własną historią wątku i natywnym mechanizmem Compaction.

### Cykl życia podagenta (opcjonalnie)

OpenClaw wywołuje dwa opcjonalne punkty zaczepienia cyklu życia podagenta:

<ParamField path="prepareSubagentSpawn" type="method">
  Przygotowuje współdzielony stan kontekstu przed rozpoczęciem uruchomienia podrzędnego. Punkt zaczepienia otrzymuje klucze sesji nadrzędnej i podrzędnej, `contextMode` (`isolated` lub `fork`), dostępne identyfikatory/pliki transkrypcji oraz opcjonalny czas TTL. Jeśli zwróci uchwyt wycofania, OpenClaw wywoła go, gdy utworzenie podagenta zakończy się niepowodzeniem po pomyślnym przygotowaniu. Natywne utworzenia podagentów, które żądają `lightContext` i są rozwiązywane jako `contextMode="isolated"`, celowo pomijają ten punkt zaczepienia, aby proces podrzędny rozpoczynał od lekkiego kontekstu inicjalizacyjnego bez stanu sprzed utworzenia zarządzanego przez silnik kontekstu.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Wykonuje czyszczenie po zakończeniu lub usunięciu sesji podagenta.
</ParamField>

### Dodatek do promptu systemowego

Metoda `assemble` może zwrócić ciąg `systemPromptAddition`. OpenClaw dodaje go na początku promptu systemowego dla danego uruchomienia. Umożliwia to silnikom wstrzykiwanie dynamicznych wskazówek dotyczących przywoływania informacji, instrukcji ich wyszukiwania lub podpowiedzi zależnych od kontekstu bez wymagania statycznych plików obszaru roboczego.

## Starszy silnik

Wbudowany silnik `legacy` zachowuje pierwotne działanie OpenClaw:

- **Pobieranie**: brak operacji (menedżer sesji bezpośrednio obsługuje utrwalanie wiadomości).
- **Składanie**: przekazywanie bez zmian (istniejący potok oczyszczania → walidacji → ograniczania w środowisku uruchomieniowym obsługuje składanie kontekstu).
- **Compaction**: deleguje do wbudowanego mechanizmu podsumowującego Compaction, który tworzy pojedyncze podsumowanie starszych wiadomości i zachowuje ostatnie wiadomości bez zmian.
- **Po turze**: brak operacji.

Starszy silnik nie rejestruje narzędzi ani nie udostępnia elementu `systemPromptAddition`.

Gdy nie ustawiono `plugins.slots.contextEngine` (lub ustawiono go na `"legacy"`), ten silnik jest używany automatycznie.

## Silniki Pluginów

Plugin może zarejestrować silnik kontekstu za pomocą interfejsu API Pluginu:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Zapisz wiadomość w magazynie danych
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // Zwróć wiadomości mieszczące się w budżecie
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Podsumuj starszy kontekst
      return { ok: true, compacted: true };
    },
  }));
}
```

Fabryka `ctx` zawiera opcjonalne wartości `config`, `agentDir` i `workspaceDir`, aby Pluginy mogły zainicjować stan dla poszczególnych agentów lub obszarów roboczych przed uruchomieniem pierwszego punktu zaczepienia cyklu życia.

Następnie należy włączyć go w konfiguracji:

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

| Element             | Rodzaj     | Przeznaczenie                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Właściwość | Identyfikator, nazwa i wersja silnika oraz informacja, czy zarządza on Compaction |
| `ingest(params)`   | Metoda   | Zapisywanie pojedynczej wiadomości                                   |
| `assemble(params)` | Metoda   | Tworzenie kontekstu dla uruchomienia modelu (zwraca `AssembleResult`) |
| `compact(params)`  | Metoda   | Podsumowywanie/ograniczanie kontekstu                                 |

`assemble` zwraca `AssembleResult` z następującymi elementami:

<ParamField path="messages" type="Message[]" required>
  Uporządkowane wiadomości wysyłane do modelu.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Oszacowanie łącznej liczby tokenów w złożonym kontekście dokonane przez silnik. OpenClaw używa go do podejmowania decyzji na podstawie progu Compaction oraz do raportowania diagnostycznego.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Dodawany na początku promptu systemowego.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Określa, którego oszacowania liczby tokenów środowisko uruchamiające używa do wyprzedzających kontroli przepełnienia. Wartość domyślna to `"assembled"`, co oznacza, że w przypadku silników, które nie zarządzają Compaction, sprawdzane jest tylko oszacowanie złożonego promptu. Silniki ustawiające `ownsCompaction: true` samodzielnie zarządzają dopuszczaniem promptów, dlatego OpenClaw domyślnie pomija ogólną kontrolę przed utworzeniem promptu. Ustaw `"preassembly_may_overflow"` tylko wtedy, gdy złożony widok może ukrywać ryzyko przepełnienia w bazowej transkrypcji; środowisko uruchamiające zachowuje wtedy aktywną ogólną kontrolę i przy podejmowaniu decyzji o wyprzedzającym Compaction używa większej wartości spośród oszacowania złożonego kontekstu i oszacowania historii sesji sprzed składania (bez zastosowania okna). Niezależnie od wybranego sposobu model nadal widzi zwrócone wiadomości — `promptAuthority` wpływa wyłącznie na kontrolę wstępną.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  Opcjonalny cykl życia odwzorowania dla hostów z trwałymi wątkami zaplecza (na przykład serwera aplikacji Codex). `mode: "thread_bootstrap"` ze stabilnym `epoch` nakazuje hostowi jednokrotnie wstrzyknąć złożony kontekst w każdej epoce i ponownie używać wątku zaplecza do momentu zmiany epoki zamiast ponownie odwzorowywać kontekst w każdej turze. W przypadku zwykłego odwzorowania dla każdej tury należy pominąć to pole.
</ParamField>

`compact` zwraca `CompactResult`. Gdy Compaction zmienia tożsamość aktywnej sesji, `result.sessionTarget` (typowany `ContextEngineSessionTarget` zawierający tożsamość sesji i zakres magazynu) identyfikuje sesję następczą, której musi użyć następna ponowiona próba lub tura; `result.sessionId` odzwierciedla identyfikator następcy.

Elementy opcjonalne:

| Element                         | Rodzaj   | Przeznaczenie                                                                                                                                      |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metoda | Inicjowanie stanu silnika dla sesji. Wywoływana jednokrotnie, gdy silnik po raz pierwszy napotka sesję (np. podczas importowania historii).                              |
| `maintain(params)`             | Metoda | Obsługa transkrypcji po inicjalizacji, pomyślnej turze lub Compaction. Do bezpiecznych zmian należy używać `runtimeContext.rewriteTranscriptEntries()`. |
| `ingestBatch(params)`          | Metoda | Pobieranie zakończonej tury jako partii. Wywoływana po zakończeniu uruchomienia ze wszystkimi wiadomościami z tej tury jednocześnie.                                  |
| `afterTurn(params)`            | Metoda | Zadania cyklu życia po uruchomieniu (utrwalanie stanu, uruchamianie Compaction w tle).                                                                      |
| `prepareSubagentSpawn(params)` | Metoda | Konfigurowanie współdzielonego stanu dla sesji podrzędnej przed jej rozpoczęciem.                                                                                    |
| `onSubagentEnded(params)`      | Metoda | Czyszczenie po zakończeniu podagenta.                                                                                                              |
| `dispose()`                    | Metoda | Zwalnianie zasobów. Wywoływana podczas zamykania Gateway lub ponownego ładowania Pluginu — nie dla każdej sesji.                                                        |

### Ustawienia środowiska uruchomieniowego

Punkty zaczepienia cyklu życia uruchamiane wewnątrz OpenClaw otrzymują opcjonalny obiekt `runtimeSettings`. Jest to wersjonowana, wewnętrzna i przeznaczona tylko do odczytu powierzchnia interfejsu API producenta/konsumenta: OpenClaw tworzy ją dla wybranego silnika kontekstu, a silnik kontekstu używa jej wewnątrz punktów zaczepienia cyklu życia. Nie jest ona bezpośrednio prezentowana użytkownikom ani nie tworzy osobnej powierzchni raportowania.

- `schemaVersion`: obecnie `1`
- `runtime`: host OpenClaw, tryb środowiska uruchomieniowego (`normal`, `fallback` lub
  `degraded`) oraz opcjonalne identyfikatory uprzęży testowej/środowiska uruchomieniowego
- `contextEngineSelection`: identyfikator wybranego silnika kontekstu i źródło wyboru
- `executionHost`: identyfikator i etykieta hosta dla powierzchni wywołującej hook
- `model`: żądany model, rozwiązany model, dostawca i opcjonalna rodzina modelu
- `limits`: budżet tokenów promptu i maksymalna liczba tokenów wyjściowych, jeśli są znane
- `diagnostics`: zamknięty mechanizm awaryjny i kody przyczyn obniżonego poziomu działania, jeśli są znane

Pola, które mogą być nieznane, są reprezentowane jako `null`; pola rozróżniające,
takie jak tryb środowiska uruchomieniowego i źródło wyboru, nie dopuszczają wartości null. Starsze silniki pozostają
zgodne: jeśli rygorystyczny starszy silnik odrzuci `runtimeSettings` jako nieznaną
właściwość, OpenClaw ponawia wywołanie cyklu życia bez niej, zamiast poddawać
silnik kwarantannie.

### Wymagania hosta

Silniki kontekstu mogą deklarować wymagania dotyczące możliwości hosta w `info.hostRequirements`.
OpenClaw sprawdza te wymagania przed rozpoczęciem operacji i bezpiecznie przerywa działanie
z opisowym błędem, gdy wybrane środowisko uruchomieniowe nie może ich spełnić.

W przypadku uruchomień agenta należy zadeklarować `assemble-before-prompt`, gdy silnik musi kontrolować
rzeczywisty prompt modelu za pośrednictwem `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Użyj natywnego środowiska uruchomieniowego Codex lub wbudowanego środowiska uruchomieniowego OpenClaw albo wybierz starszy silnik kontekstu.",
    },
  },
}
```

Natywne uruchomienia agentów Codex i wbudowane uruchomienia agentów OpenClaw spełniają `assemble-before-prompt`.
Ogólne backendy CLI go nie spełniają, dlatego silniki, które go wymagają, są odrzucane przed
uruchomieniem procesu CLI.

### Izolowanie awarii

OpenClaw izoluje wybrany silnik Pluginu od głównej ścieżki odpowiedzi. Jeśli
silnik inny niż starszy jest niedostępny, nie przejdzie walidacji kontraktu, zgłosi wyjątek podczas tworzenia
fabryki lub zgłosi wyjątek w metodzie cyklu życia, OpenClaw poddaje ten silnik
kwarantannie na czas bieżącego procesu Gateway i przełącza obsługę silnika kontekstu na
wbudowany silnik `legacy`. Błąd jest rejestrowany wraz z operacją zakończoną niepowodzeniem, aby
operator mógł naprawić, zaktualizować lub wyłączyć Plugin bez utraty
odpowiedzi agenta.

Błędy wymagań hosta są traktowane inaczej: gdy silnik deklaruje, że środowisko uruchomieniowe
nie ma wymaganej możliwości, OpenClaw bezpiecznie przerywa działanie przed rozpoczęciem uruchomienia. Chroni to
silniki, które uszkodziłyby stan, gdyby działały na nieobsługiwanym hoście.

### ownsCompaction

`ownsCompaction` określa, czy wbudowana automatyczna kompaktacja środowiska uruchomieniowego OpenClaw w ramach próby pozostaje włączona dla danego uruchomienia:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Silnik odpowiada za działanie kompaktacji. OpenClaw wyłącza dla tego uruchomienia wbudowaną automatyczną kompaktację środowiska uruchomieniowego OpenClaw i ogólne wstępne sprawdzanie przepełnienia przed promptem, a implementacja `compact()` silnika odpowiada za `/compact`, kompaktację odzyskiwania po przepełnieniu dostawcy oraz wszelką proaktywną kompaktację wykonywaną w `afterTurn()`. OpenClaw nadal uruchamia zabezpieczenie przed przepełnieniem przed promptem, gdy silnik zwróci `promptAuthority: "preassembly_may_overflow"` z `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false lub nie ustawiono">
    Wbudowana automatyczna kompaktacja środowiska uruchomieniowego OpenClaw może nadal działać podczas wykonywania promptu, ale metoda `compact()` aktywnego silnika jest nadal wywoływana na potrzeby `/compact` i odzyskiwania po przepełnieniu.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **nie** oznacza, że OpenClaw automatycznie przełącza się na ścieżkę kompaktacji starszego silnika.
</Warning>

Oznacza to, że istnieją dwa prawidłowe wzorce Pluginów:

<Tabs>
  <Tab title="Tryb właściciela">
    Zaimplementuj własny algorytm kompaktacji i ustaw `ownsCompaction: true`.
  </Tab>
  <Tab title="Tryb delegowania">
    Ustaw `ownsCompaction: false` i skonfiguruj `compact()` tak, aby wywoływał `delegateCompactionToRuntime(...)` z `openclaw/plugin-sdk/core` w celu użycia wbudowanego mechanizmu kompaktacji OpenClaw.
  </Tab>
</Tabs>

Niewykonujący żadnych działań `compact()` jest niebezpieczny dla aktywnego silnika niebędącego właścicielem, ponieważ wyłącza normalną ścieżkę kompaktacji `/compact` i odzyskiwania po przepełnieniu dla tego gniazda silnika.

## Dokumentacja konfiguracji

```json5
{
  plugins: {
    slots: {
      // Wybierz aktywny silnik kontekstu. Domyślnie: "legacy".
      // Ustaw identyfikator Pluginu, aby użyć silnika Pluginu.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Gniazdo jest wyłączne w czasie działania — dla danego uruchomienia lub operacji kompaktacji rozwiązywany jest tylko jeden zarejestrowany silnik kontekstu. Inne włączone Pluginy `kind: "context-engine"` mogą nadal się ładować i wykonywać swój kod rejestracyjny; `plugins.slots.contextEngine` wybiera tylko identyfikator zarejestrowanego silnika, który OpenClaw rozwiązuje, gdy potrzebuje silnika kontekstu.
</Note>

<Note>
**Odinstalowanie Pluginu:** po odinstalowaniu Pluginu aktualnie wybranego jako `plugins.slots.contextEngine` OpenClaw przywraca gniazdo do wartości domyślnej (`legacy`). To samo zachowanie przywracania dotyczy `plugins.slots.memory`. Ręczna edycja konfiguracji nie jest wymagana.
</Note>

## Związek z kompaktacją i pamięcią

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction jest jednym z obowiązków silnika kontekstu. Starszy silnik deleguje zadanie do wbudowanego mechanizmu podsumowywania OpenClaw. Silniki Pluginów mogą implementować dowolną strategię kompaktacji (podsumowania DAG, wyszukiwanie wektorowe itp.).
  </Accordion>
  <Accordion title="Pluginy pamięci">
    Pluginy pamięci (`plugins.slots.memory`) są niezależne od silników kontekstu. Pluginy pamięci zapewniają wyszukiwanie/pobieranie; silniki kontekstu kontrolują to, co widzi model. Mogą współpracować — silnik kontekstu może używać danych Pluginu pamięci podczas składania. Silniki Pluginów, które chcą używać aktywnej ścieżki promptu pamięci, powinny preferować `buildMemorySystemPromptAddition(...)` z `openclaw/plugin-sdk/core`, który przekształca aktywne sekcje promptu pamięci w gotowy do dołączenia na początku `systemPromptAddition`. Jeśli silnik potrzebuje kontroli niższego poziomu, nadal może pobierać nieprzetworzone wiersze z `openclaw/plugin-sdk/memory-host-core` za pośrednictwem `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Przycinanie sesji">
    Przycinanie starych wyników narzędzi w pamięci nadal działa niezależnie od tego, który silnik kontekstu jest aktywny.
  </Accordion>
</AccordionGroup>

## Wskazówki

- Użyj `openclaw doctor`, aby sprawdzić, czy silnik ładuje się prawidłowo.
- Po przełączeniu silników istniejące sesje zachowują swoją bieżącą historię. Nowy silnik przejmuje obsługę przyszłych uruchomień.
- Błędy silnika są rejestrowane, a wybrany silnik Pluginu zostaje poddany kwarantannie na czas bieżącego procesu Gateway. OpenClaw przełącza się na `legacy` podczas tur użytkownika, aby odpowiedzi mogły być kontynuowane, ale nadal należy naprawić, zaktualizować, wyłączyć lub odinstalować wadliwy Plugin.
- Do programowania użyj `openclaw plugins install -l ./my-engine`, aby połączyć lokalny katalog Pluginu bez kopiowania.

## Powiązane

- [Compaction](/pl/concepts/compaction) — podsumowywanie długich rozmów
- [Kontekst](/pl/concepts/context) — sposób budowania kontekstu dla tur agenta
- [Architektura Pluginów](/pl/plugins/architecture) — rejestrowanie Pluginów silnika kontekstu
- [Manifest Pluginu](/pl/plugins/manifest) — pola manifestu Pluginu
- [Pluginy](/pl/tools/plugin) — przegląd Pluginów
