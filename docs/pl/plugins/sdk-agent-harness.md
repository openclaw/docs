---
read_when:
    - Zmieniasz wbudowane środowisko uruchomieniowe agenta lub rejestr harnessów
    - Rejestrujesz harness agenta z dołączonego lub zaufanego pluginu
    - Musisz zrozumieć, jak Plugin Codex jest powiązany z dostawcami modeli
sidebarTitle: Agent Harness
summary: Eksperymentalna powierzchnia SDK dla pluginów zastępujących niskopoziomowy osadzony executor agenta
title: Pluginy środowiska agentów
x-i18n:
    generated_at: "2026-06-27T18:05:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a368ae480c31c86c30786f91e5cf451c3489c681be8ee3955c1c2bd55e4b49e9
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**Harness agenta** to niskopoziomowy wykonawca jednej przygotowanej tury
agenta OpenClaw. Nie jest dostawcą modelu, kanałem ani rejestrem narzędzi.
Model pojęciowy przeznaczony dla użytkowników opisano w [Środowiskach uruchomieniowych agentów](/pl/concepts/agent-runtimes).

Używaj tej powierzchni tylko dla dołączonych lub zaufanych natywnych Pluginów.
Kontrakt wciąż jest eksperymentalny, ponieważ typy parametrów celowo
odzwierciedlają bieżący osadzony runner.

## Kiedy używać harnessu

Zarejestruj harness agenta, gdy rodzina modeli ma własne natywne środowisko
sesji, a zwykły transport dostawcy OpenClaw jest niewłaściwą abstrakcją.

Przykłady:

- natywny serwer agenta kodującego, który jest właścicielem wątków i Compaction
- lokalny CLI lub daemon, który musi strumieniować natywne zdarzenia planu, rozumowania i narzędzi
- środowisko uruchomieniowe modelu, które potrzebuje własnego identyfikatora wznowienia oprócz transkrypcji sesji OpenClaw

**Nie** rejestruj harnessu tylko po to, aby dodać nowe API LLM. Dla zwykłych API modeli HTTP lub WebSocket zbuduj [Plugin dostawcy](/pl/plugins/sdk-provider-plugins).

## Co nadal należy do rdzenia

Zanim harness zostanie wybrany, OpenClaw rozwiązał już:

- dostawcę i model
- stan uwierzytelniania środowiska uruchomieniowego
- poziom myślenia i budżet kontekstu
- plik transkrypcji/sesji OpenClaw
- obszar roboczy, sandbox i zasady narzędzi
- wywołania zwrotne odpowiedzi kanału i wywołania zwrotne strumieniowania
- zasady awaryjnego przełączania modelu i przełączania modeli na żywo

Ten podział jest celowy. Harness uruchamia przygotowaną próbę; nie wybiera
dostawców, nie zastępuje dostarczania kanałem ani nie przełącza po cichu modeli.

Przygotowana próba zawiera także `params.runtimePlan`, należący do OpenClaw
pakiet zasad dla decyzji środowiska uruchomieniowego, które muszą pozostać wspólne dla OpenClaw i natywnych
harnessów:

- `runtimePlan.tools.normalize(...)` i
  `runtimePlan.tools.logDiagnostics(...)` dla zasad schematu narzędzi świadomych dostawcy
- `runtimePlan.transcript.resolvePolicy(...)` dla sanityzacji transkrypcji i
  zasad naprawy wywołań narzędzi
- `runtimePlan.delivery.isSilentPayload(...)` dla współdzielonego `NO_REPLY` i tłumienia
  dostarczania mediów
- `runtimePlan.outcome.classifyRunResult(...)` dla klasyfikacji awaryjnego przełączania modelu
- `runtimePlan.observability` dla rozwiązanych metadanych dostawcy/modelu/harnessu

Harnessy mogą używać planu do decyzji, które muszą odpowiadać zachowaniu OpenClaw, ale
nadal powinny traktować go jako należący do hosta stan próby. Nie mutuj go ani nie używaj do
przełączania dostawców/modeli wewnątrz tury.

## Rejestrowanie harnessu

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Zasady wyboru

OpenClaw wybiera harness po rozwiązaniu dostawcy/modelu:

1. Wygrywa zasada środowiska uruchomieniowego przypisana do modelu.
2. Następna jest zasada środowiska uruchomieniowego przypisana do dostawcy.
3. `auto` pyta zarejestrowane harnessy, czy obsługują rozwiązany
   dostawca/model.
4. Jeśli żaden zarejestrowany harness nie pasuje, OpenClaw używa swojego osadzonego środowiska uruchomieniowego.

Awarie harnessów Pluginów są widoczne jako awarie uruchomienia. W trybie `auto` osadzona ścieżka awaryjna jest
używana tylko wtedy, gdy żaden zarejestrowany harness Pluginu nie obsługuje rozwiązanego
dostawcy/modelu. Gdy harness Pluginu przejmie uruchomienie, OpenClaw nie
odtwarza tej samej tury przez inne środowisko uruchomieniowe, ponieważ może to zmienić
semantykę uwierzytelniania/środowiska uruchomieniowego lub zduplikować skutki uboczne.

Przypięcia środowiska uruchomieniowego dla całej sesji i całego agenta są ignorowane przez wybór. Obejmuje to
nieaktualne wartości sesji `agentHarnessId`, `agents.defaults.agentRuntime`,
`agents.list[].agentRuntime` i `OPENCLAW_AGENT_RUNTIME`. `/status` pokazuje
efektywne środowisko uruchomieniowe wybrane z trasy dostawcy/modelu.
Jeśli wybrany harness jest zaskakujący, włącz logowanie debugowania `agents/harness` i
sprawdź ustrukturyzowany rekord Gateway `agent harness selected`. Zawiera on
identyfikator wybranego harnessu, powód wyboru, zasadę środowiska uruchomieniowego/awaryjną oraz, w
trybie `auto`, wynik obsługi każdego kandydata Pluginu.

Dołączony Plugin Codex rejestruje `codex` jako identyfikator swojego harnessu. Rdzeń traktuje go
jak zwykły identyfikator harnessu Pluginu; aliasy specyficzne dla Codex należą do Pluginu
lub konfiguracji operatora, a nie do współdzielonego selektora środowiska uruchomieniowego.

## Parowanie dostawcy i harnessu

Większość harnessów powinna również rejestrować dostawcę. Dostawca udostępnia reszcie
OpenClaw referencje modeli, stan uwierzytelniania, metadane modeli i wybór `/model`.
Następnie harness przejmuje tego dostawcę w `supports(...)`.

Dołączony Plugin Codex stosuje ten wzorzec:

- preferowane referencje modelu użytkownika: `openai/gpt-5.5`
- referencje zgodności: starsze referencje `codex/gpt-*` pozostają akceptowane, ale nowe
  konfiguracje nie powinny używać ich jako zwykłych referencji dostawcy/modelu
- identyfikator harnessu: `codex`
- uwierzytelnianie: syntetyczna dostępność dostawcy, ponieważ harness Codex jest właścicielem
  natywnego logowania/sesji Codex
- żądanie app-server: OpenClaw wysyła do Codex sam identyfikator modelu i pozwala
  harnessowi komunikować się z natywnym protokołem app-server

Plugin Codex jest addytywny. Zwykłe referencje agentów `openai/gpt-*` u oficjalnego
dostawcy OpenAI domyślnie wybierają harness Codex. Starsze referencje `codex/gpt-*`
nadal wybierają dostawcę i harness Codex ze względu na zgodność.

Konfigurację operatora, przykłady prefiksów modeli i konfiguracje wyłącznie dla Codex opisano w
[Harnessie Codex](/pl/plugins/codex-harness).

OpenClaw wymaga app-server Codex `0.125.0` lub nowszego. Plugin Codex sprawdza
uzgadnianie inicjalizacji app-server i blokuje starsze lub niewersjonowane serwery, aby
OpenClaw działał tylko względem powierzchni protokołu, z którą został przetestowany. Minimalna wersja
`0.125.0` obejmuje obsługę natywnego payloadu hooka MCP, która trafiła do
Codex `0.124.0`, jednocześnie przypinając OpenClaw do nowszej przetestowanej stabilnej linii.

### Warstwa pośrednia wyników narzędzi

Dołączone Pluginy i jawnie włączone zainstalowane Pluginy z pasującymi kontraktami manifestu
mogą dołączać neutralną względem środowiska uruchomieniowego warstwę pośrednią wyników narzędzi przez
`api.registerAgentToolResultMiddleware(...)`, gdy ich manifest deklaruje
docelowe identyfikatory środowisk uruchomieniowych w `contracts.agentToolResultMiddleware`. Ta zaufana
powierzchnia jest przeznaczona dla asynchronicznych transformacji wyników narzędzi, które muszą działać, zanim OpenClaw lub Codex
przekaże wynik narzędzia z powrotem do modelu.

Starsze dołączone Pluginy nadal mogą używać
`api.registerCodexAppServerExtensionFactory(...)` dla warstwy pośredniej wyłącznie app-server Codex,
ale nowe transformacje wyników powinny używać API neutralnego względem środowiska uruchomieniowego.
Hook wyłącznie osadzonego runnera `api.registerEmbeddedExtensionFactory(...)` został usunięty;
osadzone transformacje wyników narzędzi muszą używać neutralnej względem środowiska uruchomieniowego warstwy pośredniej.

### Klasyfikacja końcowego wyniku

Natywne harnessy, które są właścicielami własnej projekcji protokołu, mogą używać
`classifyAgentHarnessTerminalOutcome(...)` z
`openclaw/plugin-sdk/agent-harness-runtime`, gdy ukończona tura nie wytworzyła
widocznego tekstu asystenta. Helper zwraca `empty`, `reasoning-only` albo
`planning-only`, aby zasada awaryjna OpenClaw mogła zdecydować, czy ponowić próbę z
innym modelem. `planning-only` wymaga jawnego pola `planText` harnessu;
OpenClaw nie wnioskuje go z prozy asystenta. Helper celowo pozostawia
błędy promptu, trwające tury i celowe ciche odpowiedzi takie jak
`NO_REPLY` bez klasyfikacji.

### Skutki uboczne końca agenta

Natywne harnessy muszą wywołać `runAgentEndSideEffects(...)` z
`openclaw/plugin-sdk/agent-harness-runtime` po sfinalizowaniu próby. Funkcja
wysyła przenośny hook `agent_end` i przechwytywanie badań OpenClaw bez
opóźniania interaktywnych odpowiedzi. Użyj `awaitAgentEndSideEffects(...)` dla lokalnych,
nieinteraktywnych uruchomień, w których próba nie może zostać rozwiązana przed zakończeniem tych skutków ubocznych.
Oba helpery akceptują ten sam payload `{ event, ctx }` co
`runAgentHarnessAgentEndHook(...)`; ich awarie nie zmieniają wyniku ukończonej
próby.

### Dane wejściowe użytkownika i powierzchnie narzędzi

Natywne harnessy, które udostępniają żądanie danych wejściowych użytkownika na poziomie środowiska uruchomieniowego, powinny używać
helperów danych wejściowych użytkownika z `openclaw/plugin-sdk/agent-harness-runtime`, aby sformatować
prompt, dostarczyć go przez blokującą ścieżkę odpowiedzi OpenClaw i znormalizować
odpowiedzi wyboru/swobodne z powrotem do natywnego kształtu odpowiedzi środowiska uruchomieniowego. Helper
utrzymuje spójną prezentację kanału/TUI, podczas gdy każdy harness zachowuje własne
parsowanie protokołu i cykl życia oczekującego żądania.

Natywne harnessy, które potrzebują kompaktowego routingu narzędzi podobnego do PI, powinny używać
`createAgentHarnessToolSurfaceRuntime(...)` z
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Jest on właścicielem
wyboru kontroli wyszukiwania narzędzi/trybu kodu, oszczędnych domyślnych ustawień modeli lokalnych,
filtrowania schematów zgodnych ze środowiskiem uruchomieniowym, wykonywania ukrytego katalogu, hydratacji
katalogów i czyszczenia katalogu. Harnessy nadal są właścicielami swojej specyficznej dla SDK
konwersji narzędzi i natywnego wywołania zwrotnego wykonania.

### Natywny tryb harnessu Codex

Dołączony harness `codex` jest natywnym trybem Codex dla osadzonych tur agentów
OpenClaw. Najpierw włącz dołączony Plugin `codex`, a jeśli Twoja konfiguracja używa restrykcyjnej listy dozwolonych, uwzględnij `codex` w
`plugins.allow`. Konfiguracje natywnego app-server powinny używać `openai/gpt-*`; tury agentów OpenAI
domyślnie wybierają harness Codex. Starsze trasy referencji modeli Codex powinny zostać naprawione za pomocą
`openclaw doctor --fix`, a starsze referencje modeli `codex/*` pozostają aliasami zgodności
dla natywnego harnessu.

Gdy ten tryb działa, Codex jest właścicielem natywnego identyfikatora wątku, zachowania wznowienia,
Compaction i wykonywania app-server. OpenClaw nadal jest właścicielem kanału czatu,
widocznego lustra transkrypcji, zasad narzędzi, zatwierdzeń, dostarczania mediów i wyboru
sesji. Użyj `agentRuntime.id: "codex"` dostawcy/modelu, gdy musisz udowodnić,
że tylko ścieżka app-server Codex może przejąć uruchomienie. Jawne środowiska uruchomieniowe Pluginów
zamykają się awaryjnie; awarie wyboru app-server Codex i awarie środowiska uruchomieniowego nie są
ponawiane przez inne środowisko uruchomieniowe.

## Rygor środowiska uruchomieniowego

Domyślnie OpenClaw używa zasady środowiska uruchomieniowego dostawcy/modelu `auto`: zarejestrowane
harnessy Pluginów mogą przejąć parę dostawca/model, a osadzone środowisko uruchomieniowe
obsługuje turę, gdy żaden nie pasuje. Referencje agentów OpenAI u oficjalnego dostawcy OpenAI domyślnie wybierają Codex.
Użyj jawnego środowiska uruchomieniowego Pluginu dostawcy/modelu, takiego jak
`agentRuntime.id: "codex"`, gdy brak wyboru harnessu powinien zakończyć się awarią zamiast
routingu przez osadzone środowisko uruchomieniowe. Awarie wybranych harnessów Pluginów zawsze
kończą się twardą awarią. Nie blokuje to jawnego `agentRuntime.id: "openclaw"` dostawcy/modelu.

Dla osadzonych uruchomień wyłącznie Codex:

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
      "model": "openai/gpt-5.5"
    }
  }
}
```

Jeśli chcesz backend CLI dla jednego kanonicznego modelu, umieść środowisko uruchomieniowe w tym
wpisie modelu:

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

Nadpisania dla poszczególnych agentów używają tego samego kształtu przypisanego do modelu:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Starsze przykłady środowiska uruchomieniowego całego agenta, takie jak ten, są ignorowane:

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

Przy jawnym środowisku uruchomieniowym Plugin sesja kończy się błędem wcześnie, gdy żądany
harness nie jest zarejestrowany, nie obsługuje rozwiązanego dostawcy/modelu albo
kończy się błędem przed wytworzeniem efektów ubocznych tury. Jest to celowe w przypadku wdrożeń
wyłącznie z Codex oraz testów live, które muszą dowieść, że ścieżka serwera aplikacji Codex jest
rzeczywiście używana.

To ustawienie kontroluje tylko osadzony harness agenta. Nie wyłącza
routingu modeli specyficznego dla dostawcy dla obrazów, wideo, muzyki, TTS, PDF ani innych typów.

## Sesje natywne i lustrzana kopia transkrypcji

Harness może przechowywać natywny identyfikator sesji, identyfikator wątku lub token wznowienia po stronie demona.
Utrzymuj to powiązanie jawnie skojarzone z sesją OpenClaw i nadal
odzwierciedlaj widoczne dla użytkownika dane wyjściowe asystenta/narzędzi w transkrypcji OpenClaw.

Transkrypcja OpenClaw pozostaje warstwą zgodności dla:

- historii sesji widocznej w kanale
- wyszukiwania i indeksowania transkrypcji
- przełączenia z powrotem na wbudowany harness OpenClaw w późniejszej turze
- ogólnego zachowania `/new`, `/reset` i usuwania sesji

Jeśli Twój harness przechowuje powiązanie pomocnicze, zaimplementuj `reset(...)`, aby OpenClaw mógł
wyczyścić je po zresetowaniu właścicielskiej sesji OpenClaw.

## Wyniki narzędzi i mediów

Rdzeń tworzy listę narzędzi OpenClaw i przekazuje ją do przygotowanej próby.
Gdy harness wykonuje dynamiczne wywołanie narzędzia, zwróć wynik narzędzia przez
kształt wyniku harnessu zamiast samodzielnie wysyłać media do kanału.

Dzięki temu dane wyjściowe tekstu, obrazu, wideo, muzyki, TTS, zatwierdzeń i narzędzi komunikacyjnych
pozostają na tej samej ścieżce dostarczania co uruchomienia obsługiwane przez OpenClaw.

## Obecne ograniczenia

- Publiczna ścieżka importu jest generyczna, ale niektóre aliasy typów prób/wyników nadal
  zachowują starsze nazwy ze względu na zgodność.
- Instalacja harnessów firm trzecich jest eksperymentalna. Preferuj Pluginy dostawców,
  dopóki nie potrzebujesz natywnego środowiska uruchomieniowego sesji.
- Przełączanie harnessów jest obsługiwane między turami. Nie przełączaj harnessów w
  środku tury po rozpoczęciu działania natywnych narzędzi, zatwierdzeń, tekstu asystenta lub wysyłania
  wiadomości.

## Powiązane

- [Omówienie SDK](/pl/plugins/sdk-overview)
- [Pomocniki środowiska uruchomieniowego](/pl/plugins/sdk-runtime)
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)
- [Harness Codex](/pl/plugins/codex-harness)
- [Dostawcy modeli](/pl/concepts/model-providers)
