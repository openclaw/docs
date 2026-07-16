---
read_when:
    - Zmieniasz osadzone środowisko wykonawcze agenta lub rejestr uprzęży testowej
    - Rejestrujesz środowisko agenta z dołączonego lub zaufanego pluginu
    - Trzeba zrozumieć, w jaki sposób plugin Codex jest powiązany z dostawcami modeli
sidebarTitle: Agent Harness
summary: Eksperymentalny interfejs SDK dla pluginów zastępujących niskopoziomowy, wbudowany moduł wykonawczy agenta
title: Pluginy środowiska wykonawczego agenta
x-i18n:
    generated_at: "2026-07-16T19:00:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 862d53022e48b93c98e98162f76460433b76005cba3188342d0977b951044106
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**Środowisko wykonawcze agenta** to niskopoziomowy mechanizm wykonujący jedną przygotowaną turę agenta OpenClaw. Nie jest dostawcą modelu, kanałem ani rejestrem narzędzi. Model mentalny przeznaczony dla użytkownika opisano w sekcji [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes).

Z tej powierzchni należy korzystać wyłącznie w przypadku wbudowanych lub zaufanych natywnych pluginów. Kontrakt nadal jest eksperymentalny, ponieważ typy parametrów celowo odzwierciedlają bieżący osadzony mechanizm wykonawczy.

## Kiedy używać środowiska wykonawczego

Środowisko wykonawcze agenta należy zarejestrować, gdy rodzina modeli ma własne natywne środowisko uruchomieniowe sesji, a standardowy transport dostawcy OpenClaw jest niewłaściwą abstrakcją:

- natywny serwer agenta programistycznego, który zarządza wątkami i Compaction
- lokalny CLI lub demon, który musi strumieniować natywne zdarzenia planu, rozumowania i narzędzi
- środowisko uruchomieniowe modelu, które oprócz transkrypcji sesji OpenClaw wymaga własnego identyfikatora wznowienia

Nie należy rejestrować środowiska wykonawczego wyłącznie po to, aby dodać nowe API LLM. Dla standardowych API modeli opartych na HTTP lub WebSocket należy utworzyć [plugin dostawcy](/pl/plugins/sdk-provider-plugins).

## Za co nadal odpowiada rdzeń

Przed wybraniem środowiska wykonawczego OpenClaw ma już określone:

- dostawcę i model
- stan uwierzytelniania środowiska uruchomieniowego, chyba że środowisko wykonawcze deklaruje, że odpowiada za inicjalizację uwierzytelniania
- poziom rozumowania i budżet kontekstu
- plik transkrypcji/sesji OpenClaw
- obszar roboczy, piaskownicę i zasady dotyczące narzędzi
- wywołania zwrotne odpowiedzi kanału i wywołania zwrotne przesyłania strumieniowego
- zasady awaryjnego wyboru modelu i przełączania modelu na żywo

Środowisko wykonawcze uruchamia przygotowaną próbę; nie wybiera dostawców, nie zastępuje dostarczania przez kanał ani nie przełącza modeli bez powiadomienia.

### Inicjalizacja uwierzytelniania zarządzana przez środowisko wykonawcze

Domyślnie rdzeń rozpoznaje dane uwierzytelniające dostawcy przed wywołaniem środowiska wykonawczego. Zaufane środowisko wykonawcze, które może uwierzytelnić się za pomocą własnego natywnego środowiska uruchomieniowego, może ustawić `authBootstrap: "harness"` w swojej statycznej rejestracji `AgentHarness`. Rdzeń pomija wtedy ogólną inicjalizację danych uwierzytelniających dostawcy i błąd braku danych uwierzytelniających dla każdej próby przejętej przez to środowisko wykonawcze.

Rdzeń nadal przekazuje zgodny, jawnie wybrany lub uporządkowany profil uwierzytelniania OpenClaw i jego magazyn o ograniczonym zakresie, jeśli taki istnieje. Środowisko wykonawcze musi przed wysłaniem żądań do modelu rozpoznać ten profil lub swoje natywne dane uwierzytelniające, ograniczać sekrety do zakresu próby i zgłaszać umożliwiające podjęcie działań błędy uwierzytelniania. Nie należy ustawiać tej możliwości dla środowiska wykonawczego, które tylko czasami odpowiada za uwierzytelnianie.

### Zweryfikowane artefakty środowiska uruchomieniowego konfiguracji

Lokalne środowisko wykonawcze, które może zapewnić inferencję podczas początkowej konfiguracji, musi poświadczyć implementację, która ukończyła test. Gdy `params.captureRuntimeArtifact` ma wartość true, należy zwrócić nieprzezroczysty `result.runtimeArtifact` ze stabilnym identyfikatorem i odciskiem zawartości. Należy zarejestrować pasującą możliwość `runtimeArtifact.validate(...)`, która ponownie sprawdza to powiązanie bez ładowania innego środowiska wykonawczego ani skanowania niepowiązanych pluginów.

Zweryfikowane kontynuacje OpenClaw przekazują również `params.expectedRuntimeArtifact`. Środowisko wykonawcze musi porównać go z dokładnie tym natywnym procesem, który pozyskało, i zakończyć się niepowodzeniem przed rozpoczęciem lub wznowieniem natywnego wątku, jeśli wartości się różnią. Zwykłe tury agenta pomijają oba pola, dzięki czemu obliczanie skrótu zawartości nie trafia na standardową ścieżkę krytyczną żądania. Zdalne środowiska wykonawcze lub środowiska oparte na WebSocket wymagają kontraktu poświadczenia serwera, zanim będą mogły uczestniczyć; sam ciąg wersji nie stanowi tożsamości artefaktu.

Przygotowana próba zawiera również `params.runtimePlan`, pakiet zasad zarządzany przez OpenClaw na potrzeby decyzji środowiska uruchomieniowego, które muszą pozostać wspólne dla OpenClaw i natywnych środowisk wykonawczych:

- `runtimePlan.tools.normalize(...)` i `runtimePlan.tools.logDiagnostics(...)` dla zależnych od dostawcy zasad schematu narzędzi
- `runtimePlan.transcript.resolvePolicy(...)` dla zasad oczyszczania transkrypcji i naprawiania wywołań narzędzi
- `runtimePlan.delivery.isSilentPayload(...)` dla współdzielonego `NO_REPLY` i wyłączania dostarczania multimediów
- `runtimePlan.outcome.classifyRunResult(...)` dla klasyfikacji awaryjnego wyboru modelu
- `runtimePlan.observability` dla określonych metadanych dostawcy/modelu/środowiska wykonawczego

Środowiska wykonawcze mogą używać planu do podejmowania decyzji, które muszą być zgodne z zachowaniem OpenClaw, ale powinny traktować go jako zarządzany przez hosta stan próby: nie należy go modyfikować ani używać do przełączania dostawców lub modeli w trakcie tury.

### Kontrakt transportu żądania

`supports(ctx)` otrzymuje określony transport modelu w `ctx.modelProvider`. Wybraną trasę opisują dwa fakty zarządzane przez dostawcę, które nie zawierają sekretów:

- `runtimePolicy.compatibleIds` zawiera identyfikatory środowisk uruchomieniowych, które dostawca deklaruje jako zgodne z daną trasą. Brak zasad oznacza, że dostawca nie zadeklarował zgodności na poziomie trasy; nie stanowi to pozwolenia na założenie obsługi.
- `requestTransportOverrides: "none"` oznacza, że nie trzeba odtwarzać żadnego jawnie zdefiniowanego nadpisania żądania dostawcy/modelu. `"present"` oznacza, że istnieją jawnie zdefiniowane nagłówki, transport uwierzytelniania, proxy, TLS, zachowanie usługi lokalnej lub sieci prywatnej albo parametry żądania. Fakt ten nie ujawnia tych wartości.

Gdy środowisko wykonawcze nie może odtworzyć przygotowanego transportu, należy zwrócić `{ supported: false, reason }`. Nie należy wnioskować o obsłudze przez odczytywanie surowej konfiguracji po dokonaniu wyboru. Jeśli przygotowanie uwierzytelniania tworzy wiele tras ponownych prób, jedno środowisko wykonawcze musi obsługiwać je wszystkie przed wysłaniem. Wybór niejawny używa OpenClaw, jeśli żaden plugin nie może obsłużyć pełnego zestawu; jawny lub utrwalony wybór pluginu kończy się bezpiecznym niepowodzeniem.

## Rejestrowanie środowiska wykonawczego

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Moje natywne środowisko wykonawcze agenta",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "efektywna trasa nie jest zgodna ze środowiskiem wykonawczym" };
  },

  async runAttempt(params) {
    // Uruchom lub wznów natywny wątek.
    // Użyj params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent oraz pozostałych pól przygotowanej próby.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Mój natywny agent",
  description: "Uruchamia wybrane modele za pośrednictwem natywnego demona agenta.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

`authBootstrap` celowo pominięto w tym ogólnym przykładzie. `authBootstrap: "harness"` należy dodać tylko wtedy, gdy środowisko wykonawcze spełnia powyższy kontrakt.

### Delegowane wykonywanie

Właściciel środowiska wykonawczego może ustawić `delegatedExecutionPluginIds` na identyfikatory zaufanych pluginów, które muszą wykonywać istniejącą sesję powiązaną z modelem, na przykład transport głosowy kontynuujący konwersację obsługiwaną przez Codex. Jest to statyczna zgoda właściciela, a nie lista dozwolonych elementów rdzenia. Zakres powinien pozostać wąski.

Delegaci otrzymują wyłącznie zgodę na pracę i osadzone wykonywanie. OpenClaw wymaga dokładnego zapisanego klucza sesji, ścieżki magazynu i identyfikatora sesji; `modelSelectionLocked:
true`; oraz zgodnych wartości `agentHarnessId` i `agentHarnessRuntimeOverride`. Wykonanie jest następnie ograniczone zakresem właściciela środowiska wykonawczego. Tworzenie, modyfikowanie, resetowanie, usuwanie i archiwizowanie sesji oraz modyfikowanie Gateway pozostają dostępne wyłącznie dla właściciela.

## Zasady wyboru

OpenClaw wybiera środowisko wykonawcze po określeniu dostawcy/modelu:

1. Pierwszeństwo mają zasady środowiska uruchomieniowego dotyczące modelu.
2. Następne są zasady środowiska uruchomieniowego dotyczące dostawcy.
3. `auto` pyta zarejestrowane środowiska wykonawcze, czy obsługują określoną efektywną trasę. Same prefiksy dostawcy/modelu nigdy nie wybierają środowiska wykonawczego.
4. Jeśli żadne zarejestrowane środowisko wykonawcze nie pasuje, OpenClaw używa osadzonego środowiska uruchomieniowego.

Błędy środowiska wykonawczego pluginu są zgłaszane jako błędy wykonania. W trybie `auto` osadzony mechanizm awaryjny ma zastosowanie tylko wtedy, gdy żadne zarejestrowane środowisko wykonawcze pluginu nie obsługuje określonego dostawcy/modelu. Gdy środowisko wykonawcze pluginu przejmie wykonanie, OpenClaw nie odtwarza tej samej tury w innym środowisku uruchomieniowym, ponieważ mogłoby to zmienić semantykę uwierzytelniania/środowiska uruchomieniowego lub powielić skutki uboczne.

Skonfigurowane zasady środowiska uruchomieniowego pozostają miarodajne w kwestii żądanego środowiska uruchomieniowego. Utrwalona sesja `agentHarnessId` zachowuje własność swojej natywnej transkrypcji, gdy przygotowanie trasy/uwierzytelniania nadal trwa. Żaden z tych mechanizmów nie sprawia, że niezgodna trasa staje się zgodna: gdy przygotowane fakty są dostępne, wybrane lub przypięte środowisko wykonawcze musi je obsługiwać, w przeciwnym razie wykonanie kończy się bezpiecznym niepowodzeniem. `/status` pokazuje efektywne środowisko uruchomieniowe wybrane na podstawie zasad, utrwalonej własności i obsługi trasy. Stan przygotowania jest jawny: brak `runtimePolicy` pozostaje niezadeklarowany, zamiast być wywnioskowanym z przypadkowo dostępnych pól transportu. Gdy uwierzytelnianie zarządzane przez środowisko wykonawcze pozostawia nierozstrzygniętych wiele tras fizycznych, przygotowany fakt obsługi stanowi część wspólną ich zgodnych identyfikatorów środowisk uruchomieniowych i zgłasza nadpisania żądań, jeśli występują u któregokolwiek kandydata. Dlatego jeden kandydat bez deklaracji sprawia, że zgodność natywna jest pusta; `preparedAuth.source: "harness"` jest właścicielem uwierzytelniania, a nie pozwoleniem na wnioskowanie o obsłudze trasy.

Jeśli wybrane środowisko wykonawcze jest zaskakujące, należy włączyć rejestrowanie debugowania `agents/harness` i sprawdzić ustrukturyzowany rekord `agent harness selected` bramy: zawiera identyfikator wybranego środowiska wykonawczego, powód wyboru, zasady środowiska uruchomieniowego/mechanizmu awaryjnego oraz, w trybie `auto`, wynik obsługi każdego kandydata pluginu.

Wbudowany plugin Codex rejestruje `codex` jako swój identyfikator środowiska wykonawczego. Rdzeń traktuje go jak zwykły identyfikator środowiska wykonawczego pluginu; aliasy specyficzne dla Codex należą do pluginu lub konfiguracji operatora, a nie do współdzielonego selektora środowiska uruchomieniowego.

## Parowanie dostawcy ze środowiskiem wykonawczym

Większość środowisk wykonawczych powinna również rejestrować dostawcę. Dostawca udostępnia pozostałej części OpenClaw odwołania do modeli, stan uwierzytelniania, metadane modelu oraz wybór `/model`. Następnie środowisko wykonawcze przejmuje tego dostawcę w `supports(...)`.

Wbudowany plugin Codex korzysta z tego wzorca:

- preferowane odwołania do modeli użytkownika: `openai/gpt-5.6-sol`
- odwołania zgodności: starsze odwołania `codex/gpt-*` pozostają akceptowane, ale nowe konfiguracje nie powinny używać ich jako standardowych odwołań dostawcy/modelu
- identyfikator środowiska wykonawczego: `codex`
- uwierzytelnianie: syntetyczna dostępność dostawcy, ponieważ środowisko wykonawcze Codex zarządza natywnym logowaniem/sesją Codex
- żądanie serwera aplikacji: OpenClaw wysyła sam identyfikator modelu do Codex i pozwala środowisku wykonawczemu komunikować się z natywnym protokołem serwera aplikacji

Plugin Codex jest rozwiązaniem addytywnym. Gdy zasady środowiska uruchomieniowego nie są ustawione lub mają wartość `auto`, OpenAI może wybrać Codex tylko wtedy, gdy zarządzany przez dostawcę kontrakt trasy deklaruje zgodność z `codex`: dokładna oficjalna trasa HTTPS Platform Responses lub ChatGPT Responses bez jawnie zdefiniowanego nadpisania żądania. Sam prefiks `openai/*` nigdy nie wybiera Codex. Niestandardowe punkty końcowe, adaptery Completions i jawnie zdefiniowane zachowanie żądań pozostają obsługiwane przez OpenClaw. Oficjalne punkty końcowe używające nieszyfrowanego HTTP są odrzucane. Starsze odwołania `codex/gpt-*` pozostają danymi wejściowymi zgodności. Zobacz [Niejawne środowisko uruchomieniowe agenta OpenAI](/pl/providers/openai#implicit-agent-runtime).

Konfigurację operatora, przykłady prefiksów modeli i konfiguracje przeznaczone wyłącznie dla Codex opisano w sekcji [Środowisko wykonawcze Codex](/pl/plugins/codex-harness).

Plugin Codex wymusza minimalną wersję serwera aplikacji udokumentowaną w sekcji [Środowisko wykonawcze Codex](/pl/plugins/codex-harness). Sprawdza uzgadnianie inicjalizacyjne oraz blokuje starsze serwery i serwery bez wersji, dzięki czemu OpenClaw działa wyłącznie z przetestowaną powierzchnią protokołu.

### Oprogramowanie pośredniczące wyników narzędzi

Wbudowane pluginy i jawnie włączone zainstalowane pluginy z pasującymi kontraktami manifestu mogą dołączać niezależne od środowiska uruchomieniowego oprogramowanie pośredniczące wyników narzędzi za pomocą `api.registerAgentToolResultMiddleware(...)`, gdy ich manifest deklaruje docelowe identyfikatory środowisk uruchomieniowych w `contracts.agentToolResultMiddleware`. Ta zaufana powierzchnia służy do asynchronicznych przekształceń wyników narzędzi, które muszą zostać wykonane, zanim OpenClaw lub Codex przekaże dane wyjściowe narzędzia z powrotem do modelu.

Starsze dołączone Pluginy mogą nadal używać
`api.registerCodexAppServerExtensionFactory(...)` dla oprogramowania pośredniczącego przeznaczonego wyłącznie dla
serwera aplikacji Codex, ale nowe transformacje wyników powinny korzystać z API niezależnego od środowiska uruchomieniowego. Punkt zaczepienia `api.registerEmbeddedExtensionFactory(...)`, przeznaczony
wyłącznie dla osadzonego modułu wykonawczego, został usunięty; transformacje wyników narzędzi osadzonych muszą korzystać z oprogramowania pośredniczącego niezależnego od środowiska uruchomieniowego.

### Klasyfikacja wyniku końcowego

Natywne mechanizmy testowe, które zarządzają własną projekcją protokołu, mogą używać
`classifyAgentHarnessTerminalOutcome(...)` z
`openclaw/plugin-sdk/agent-harness-runtime`, gdy ukończona tura nie wygenerowała
widocznego tekstu asystenta. Funkcja pomocnicza zwraca `empty`, `reasoning-only` lub
`planning-only`, aby zasady obsługi awaryjnej OpenClaw mogły zdecydować, czy ponowić próbę z
innym modelem. `planning-only` wymaga jawnego pola `planText`
mechanizmu testowego; OpenClaw nie wywnioskuje go z prozy asystenta. Funkcja pomocnicza
celowo nie klasyfikuje błędów monitu, trwających tur ani zamierzonych cichych
odpowiedzi, takich jak `NO_REPLY`.

### Efekty uboczne zakończenia agenta

Natywne mechanizmy testowe muszą wywołać `runAgentEndSideEffects(...)` z
`openclaw/plugin-sdk/agent-harness-runtime` po sfinalizowaniu próby. Funkcja ta
uruchamia przenośny punkt zaczepienia `agent_end` oraz przechwytywanie danych badawczych OpenClaw
bez opóźniania odpowiedzi interaktywnych. Użyj `awaitAgentEndSideEffects(...)` w przypadku
lokalnych, nieinteraktywnych uruchomień, w których próba nie może się zakończyć przed ukończeniem tych
efektów ubocznych. Obie funkcje pomocnicze przyjmują ten sam ładunek `{ event, ctx }` co
`runAgentHarnessAgentEndHook(...)`; ich błędy nie zmieniają wyniku ukończonej
próby.

### Dane wejściowe użytkownika i powierzchnie narzędzi

Natywne mechanizmy testowe udostępniające żądanie danych wejściowych użytkownika na poziomie środowiska uruchomieniowego powinny korzystać z
funkcji pomocniczych danych wejściowych użytkownika z `openclaw/plugin-sdk/agent-harness-runtime`, aby formatować
monit, dostarczać go przez blokującą ścieżkę odpowiedzi OpenClaw oraz normalizować
odpowiedzi wyboru lub w formie dowolnego tekstu z powrotem do natywnego formatu odpowiedzi środowiska uruchomieniowego. Funkcja
pomocnicza zapewnia spójną prezentację w kanale/TUI, podczas gdy każdy mechanizm testowy zachowuje
własne parsowanie protokołu i cykl życia oczekujących żądań.

Natywne mechanizmy testowe wymagające kompaktowego routingu narzędzi podobnego do PI powinny używać
`createAgentHarnessToolSurfaceRuntime(...)` z
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Funkcja ta zarządza
wyborem sterowania wyszukiwaniem narzędzi/trybem kodu, odchudzonymi ustawieniami domyślnymi modeli lokalnych,
filtrowaniem schematów zgodnym ze środowiskiem uruchomieniowym, ukrytym wykonywaniem katalogu, wypełnianiem
katalogów oraz czyszczeniem katalogu. Mechanizmy testowe nadal odpowiadają za konwersję narzędzi
specyficzną dla własnego SDK oraz natywne wywołanie zwrotne wykonania.

### Natywny tryb mechanizmu testowego Codex

Dołączony mechanizm testowy `codex` jest natywnym trybem Codex dla osadzonych tur agenta OpenClaw.
Najpierw włącz dołączony Plugin `codex` i dodaj `codex` do
`plugins.allow`, jeśli konfiguracja używa restrykcyjnej listy dozwolonych elementów. Natywne konfiguracje serwera aplikacji
powinny używać `openai/gpt-*`; tury agenta OpenAI wybierają mechanizm testowy Codex
tylko wtedy, gdy efektywna trasa deklaruje zgodność z Codex. Starsze odwołania do modeli Codex
należy naprawić za pomocą `openclaw doctor --fix`, a starsze odwołania do modeli `codex/*`
pozostają aliasami zgodności dla natywnego mechanizmu testowego.

Podczas działania tego trybu Codex zarządza natywnym identyfikatorem wątku, zachowaniem wznawiania,
Compaction oraz wykonywaniem przez serwer aplikacji. OpenClaw nadal zarządza kanałem czatu,
widoczną kopią transkrypcji, zasadami narzędzi, zatwierdzeniami, dostarczaniem multimediów oraz wyborem
sesji. Użyj dostawcy/modelu `agentRuntime.id: "codex"`, gdy trzeba
wykazać, że uruchomienie może zostać przejęte wyłącznie przez ścieżkę serwera aplikacji Codex. Jawne środowiska uruchomieniowe
Pluginów działają w trybie zamknięcia przy błędzie; błędy wyboru serwera aplikacji Codex i błędy środowiska uruchomieniowego
nie są ponawiane za pośrednictwem innego środowiska uruchomieniowego.

## Rygor środowiska uruchomieniowego

Domyślnie OpenClaw używa zasad środowiska uruchomieniowego dostawcy/modelu `auto`: zarejestrowane
mechanizmy testowe Pluginów mogą przejmować zgodne efektywne trasy, a osadzone
środowisko uruchomieniowe obsługuje turę, gdy żaden z nich nie pasuje. Sam prefiks dostawcy/modelu nigdy
nie wybiera mechanizmu testowego. Użyj jawnego środowiska uruchomieniowego Pluginu dla dostawcy/modelu, takiego jak
`agentRuntime.id: "codex"`, gdy brak wyboru mechanizmu testowego powinien powodować błąd zamiast
przekierowania przez osadzone środowisko uruchomieniowe. Jawny wybór nie zapewnia
zgodności niezgodnej trasy. Błędy wybranych mechanizmów testowych Pluginów zawsze powodują
błąd krytyczny. Nie blokuje to jawnego `agentRuntime.id: "openclaw"`
dostawcy/modelu.

Dla osadzonych uruchomień wyłącznie z Codex:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.6-sol"
    }
  }
}
```

Jeśli wymagane jest zaplecze CLI dla jednego modelu kanonicznego, umieść środowisko uruchomieniowe we wpisie tego
modelu:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Nadpisania dla poszczególnych agentów używają tego samego formatu opartego na modelu:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.6-sol",
        "models": {
          "openai/gpt-5.6-sol": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Starsze przykłady środowiska uruchomieniowego dla całego agenta, takie jak ten, są ignorowane:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Przy jawnym środowisku uruchomieniowym Pluginu sesja kończy się błędem na wczesnym etapie, gdy żądany
mechanizm testowy nie jest zarejestrowany, nie obsługuje rozpoznanego dostawcy/modelu lub
ulegnie awarii przed wygenerowaniem efektów ubocznych tury. Jest to zamierzone w przypadku wdrożeń
wyłącznie z Codex oraz testów na żywo, które muszą wykazać, że ścieżka serwera aplikacji Codex jest
rzeczywiście używana.

To ustawienie steruje wyłącznie osadzonym mechanizmem testowym agenta. Nie wyłącza
routingu modeli specyficznego dla dostawcy w przypadku obrazów, filmów, muzyki, TTS, PDF ani innych typów.

## Natywne sesje i kopia transkrypcji

Mechanizm testowy może przechowywać natywny identyfikator sesji, identyfikator wątku lub token wznawiania
po stronie demona. Powiązanie to należy jawnie skojarzyć z sesją OpenClaw oraz
nadal kopiować widoczne dla użytkownika dane wyjściowe asystenta/narzędzi do transkrypcji
OpenClaw.

Transkrypcja OpenClaw pozostaje warstwą zgodności dla:

- historii sesji widocznej w kanale
- wyszukiwania i indeksowania transkrypcji
- powrotu do wbudowanego mechanizmu testowego OpenClaw podczas późniejszej tury
- ogólnego działania `/new`, `/reset` oraz usuwania sesji

Jeśli mechanizm testowy przechowuje powiązanie w pliku pomocniczym, zaimplementuj `reset(...)`, aby OpenClaw
mógł je wyczyścić podczas resetowania nadrzędnej sesji OpenClaw.

## Wyniki narzędzi i multimediów

Rdzeń tworzy listę narzędzi OpenClaw i przekazuje ją do przygotowanej
próby. Gdy mechanizm testowy wykonuje dynamiczne wywołanie narzędzia, zwróć wynik narzędzia
za pośrednictwem formatu wyniku mechanizmu testowego zamiast samodzielnie wysyłać multimedia
do kanału.

Dzięki temu dane wyjściowe tekstu, obrazów, filmów, muzyki, TTS, zatwierdzeń i narzędzi komunikacyjnych
korzystają z tej samej ścieżki dostarczania co uruchomienia obsługiwane przez OpenClaw.

### Końcowe wyniki narzędzi

`AgentHarnessAttemptParams.observeToolTerminal` jest zarządzanym przez hosta akumulatorem
końcowych wyników. Mechanizm testowy wykonujący dynamiczne narzędzia OpenClaw lub narzędzia natywne
musi go wywołać, gdy każde narzędzie osiągnie jeden końcowy wynik, przed
sfinalizowaniem wyniku próby. Mechanizmy testowe, które nie wykonują narzędzi, nie muszą
go wywoływać.

Zgłaszaj fakty z granicy wykonania:

- Przekaż identyfikator wywołania protokołu, jeśli istnieje, kanoniczną nazwę narzędzia oraz
  argumenty, które rzeczywiście dotarły do narzędzia po przygotowaniu lub przekształceniach punktów zaczepienia.
- Ustaw `executionStarted: false`, gdy walidacja, zatwierdzenie lub inny mechanizm ochronny
  zatrzymał wywołanie przed rozpoczęciem implementacji narzędzia. Gdy wysłanie mogło
  już nastąpić, ostrożnie zgłoś `true`.
- Zgłoś `outcome: "success"` lub `outcome: "failure"`. Uwzględnij ustrukturyzowane
  pola błędu dostępne w środowisku uruchomieniowym zamiast wnioskować o błędzie z
  wyświetlanego tekstu.
- Używaj `nativeMutation` wyłącznie dla narzędzi natywnych, które nie korzystają z definicji narzędzia
  OpenClaw. Podaj tam fakty dotyczące modyfikacji i ponownego odtwarzania zarządzane przez protokół; nie
  kopiuj klasyfikatora modyfikacji OpenClaw do mechanizmu testowego.

Wywołanie zwrotne zwraca kanoniczne rozstrzygnięcie dla danego wywołania. Przenieś jego
`lastToolError` do `AgentHarnessAttemptResult` i użyj jego faktów dotyczących wykonania,
argumentów oraz efektów ubocznych w projekcji mechanizmu testowego zamiast wyprowadzać
równoległy stan. Host zachowuje nierozstrzygnięty błąd modyfikujący pomimo niepowiązanych
udanych narzędzi i usuwa go dopiero po pomyślnym wykonaniu pasującej czynności.

Wywołanie zwrotne pozostaje opcjonalne w celu zachowania zgodności źródłowej ze starszymi eksperymentalnymi
mechanizmami testowymi. Opcjonalność nie oznacza, że mechanizm testowy wykonujący narzędzia może je ignorować:
bez raportów końcowych OpenClaw nie może zachować prawdziwego stanu błędu narzędzia modyfikującego
w kolejnych wywołaniach narzędzi, w tym podczas cichego ukończenia Heartbeat.

## Obecne ograniczenia

- Publiczna ścieżka importu jest ogólna, ale niektóre aliasy typów prób/wyników
  nadal zawierają starsze nazwy w celu zachowania zgodności.
- Instalowanie mechanizmów testowych innych firm jest eksperymentalne. Preferuj Pluginy dostawców,
  dopóki natywne środowisko uruchomieniowe sesji nie będzie potrzebne.
- Przełączanie mechanizmów testowych między turami jest obsługiwane. Nie przełączaj mechanizmów testowych
  w trakcie tury po rozpoczęciu działania natywnych narzędzi, zatwierdzeń, tekstu asystenta lub wysyłania
  wiadomości.

## Powiązane materiały

- [Omówienie SDK](/pl/plugins/sdk-overview)
- [Funkcje pomocnicze środowiska uruchomieniowego](/pl/plugins/sdk-runtime)
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)
- [Mechanizm testowy Codex](/pl/plugins/codex-harness)
- [Dostawcy modeli](/pl/concepts/model-providers)
