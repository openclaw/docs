---
read_when:
    - Zmieniasz osadzone środowisko uruchomieniowe agenta lub rejestr środowiska sterującego
    - Rejestrujesz harness agenta z dołączonego lub zaufanego Plugin
    - Musisz zrozumieć, jak Plugin Codex jest powiązany z dostawcami modeli
sidebarTitle: Agent Harness
summary: Eksperymentalny interfejs SDK dla Pluginów, które zastępują niskopoziomowy wbudowany mechanizm wykonawczy agenta
title: Pluginy środowiska uruchomieniowego agentów
x-i18n:
    generated_at: "2026-05-10T19:47:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**agent harness** to niskopoziomowy wykonawca jednej przygotowanej tury agenta OpenClaw. Nie jest dostawcą modelu, kanałem ani rejestrem narzędzi. Model pojęciowy widoczny dla użytkownika opisano w [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes).

Używaj tej powierzchni tylko dla wbudowanych lub zaufanych natywnych pluginów. Kontrakt wciąż jest eksperymentalny, ponieważ typy parametrów celowo odzwierciedlają bieżący osadzony runner.

## Kiedy używać harnessu

Zarejestruj agent harness, gdy rodzina modeli ma własne natywne środowisko uruchomieniowe sesji, a standardowy transport dostawcy OpenClaw jest niewłaściwą abstrakcją.

Przykłady:

- natywny serwer agenta kodującego, który zarządza wątkami i compaction
- lokalny CLI lub demon, który musi strumieniować natywne zdarzenia planu, rozumowania i narzędzi
- środowisko uruchomieniowe modelu, które potrzebuje własnego identyfikatora wznowienia oprócz transkryptu sesji OpenClaw

**Nie** rejestruj harnessu tylko po to, aby dodać nowe API LLM. Dla zwykłych API modeli HTTP lub WebSocket zbuduj [plugin dostawcy](/pl/plugins/sdk-provider-plugins).

## Za co nadal odpowiada core

Zanim harness zostanie wybrany, OpenClaw rozwiązał już:

- dostawcę i model
- stan uwierzytelniania środowiska uruchomieniowego
- poziom myślenia i budżet kontekstu
- plik transkryptu/sesji OpenClaw
- obszar roboczy, sandbox i politykę narzędzi
- wywołania zwrotne odpowiedzi kanału i wywołania zwrotne strumieniowania
- politykę awaryjnego wyboru modelu i przełączania modeli na żywo

Ten podział jest celowy. Harness uruchamia przygotowaną próbę; nie wybiera dostawców, nie zastępuje dostarczania kanału ani nie przełącza modeli po cichu.

Przygotowana próba zawiera też `params.runtimePlan`, należący do OpenClaw pakiet polityk dla decyzji środowiska uruchomieniowego, które muszą pozostać wspólne dla PI i natywnych harnessów:

- `runtimePlan.tools.normalize(...)` i
  `runtimePlan.tools.logDiagnostics(...)` dla polityki schematu narzędzi świadomej dostawcy
- `runtimePlan.transcript.resolvePolicy(...)` dla sanitizacji transkryptu i polityki naprawy wywołań narzędzi
- `runtimePlan.delivery.isSilentPayload(...)` dla wspólnego `NO_REPLY` i tłumienia dostarczania mediów
- `runtimePlan.outcome.classifyRunResult(...)` dla klasyfikacji awaryjnego wyboru modelu
- `runtimePlan.observability` dla rozstrzygniętych metadanych dostawcy/modelu/harnessu

Harnessy mogą używać planu dla decyzji, które muszą odpowiadać zachowaniu PI, ale nadal powinny traktować go jako należący do hosta stan próby. Nie mutuj go ani nie używaj do przełączania dostawców/modeli w obrębie tury.

## Rejestracja harnessu

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

## Polityka wyboru

OpenClaw wybiera harness po rozstrzygnięciu dostawcy/modelu:

1. Wygrywa polityka środowiska uruchomieniowego przypisana do modelu.
2. Następna jest polityka środowiska uruchomieniowego przypisana do dostawcy.
3. `auto` pyta zarejestrowane harnessy, czy obsługują rozstrzygniętego dostawcę/model.
4. Jeśli żaden zarejestrowany harness nie pasuje, OpenClaw używa PI, chyba że awaryjne użycie PI jest wyłączone.

Awarie harnessów pluginów są ujawniane jako awarie uruchomienia. W trybie `auto` awaryjne użycie PI następuje tylko wtedy, gdy żaden zarejestrowany harness pluginu nie obsługuje rozstrzygniętego dostawcy/modelu. Gdy harness pluginu przejmie uruchomienie, OpenClaw nie odtwarza tej samej tury przez PI, ponieważ mogłoby to zmienić semantykę uwierzytelniania/środowiska uruchomieniowego lub zdublować efekty uboczne.

Przypięcia środowiska uruchomieniowego dla całej sesji i całego agenta są ignorowane przez wybór. Obejmuje to nieaktualne wartości sesji `agentHarnessId`, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime` i `OPENCLAW_AGENT_RUNTIME`. `/status` pokazuje efektywne środowisko uruchomieniowe wybrane z trasy dostawcy/modelu.
Jeśli wybrany harness jest zaskakujący, włącz logowanie debugowania `agents/harness` i sprawdź strukturalny rekord Gateway `agent harness selected`. Zawiera on identyfikator wybranego harnessu, powód wyboru, politykę środowiska uruchomieniowego/awaryjnego wyboru oraz, w trybie `auto`, wynik obsługi każdego kandydata pluginu.

Wbudowany plugin Codex rejestruje `codex` jako identyfikator harnessu. Core traktuje go jako zwykły identyfikator harnessu pluginu; aliasy specyficzne dla Codex należą do pluginu lub konfiguracji operatora, a nie do współdzielonego selektora środowiska uruchomieniowego.

## Parowanie dostawcy i harnessu

Większość harnessów powinna też rejestrować dostawcę. Dostawca udostępnia reszcie OpenClaw referencje modeli, stan uwierzytelniania, metadane modeli i wybór `/model`. Harness następnie zgłasza tego dostawcę w `supports(...)`.

Wbudowany plugin Codex stosuje ten wzorzec:

- preferowane referencje modelu użytkownika: `openai/gpt-5.5`
- referencje zgodności: starsze referencje `codex/gpt-*` pozostają akceptowane, ale nowe konfiguracje nie powinny używać ich jako zwykłych referencji dostawcy/modelu
- identyfikator harnessu: `codex`
- uwierzytelnianie: syntetyczna dostępność dostawcy, ponieważ harness Codex zarządza natywnym logowaniem/sesją Codex
- żądanie app-server: OpenClaw wysyła do Codex sam identyfikator modelu i pozwala harnessowi komunikować się z natywnym protokołem app-server

Plugin Codex jest addytywny. Zwykłe referencje agenta `openai/gpt-*` u oficjalnego dostawcy OpenAI domyślnie wybierają harness Codex. Starsze referencje `codex/gpt-*` nadal wybierają dostawcę i harness Codex ze względu na zgodność.

Konfigurację operatora, przykłady prefiksów modeli i konfiguracje tylko dla Codex opisuje [Codex Harness](/pl/plugins/codex-harness).

OpenClaw wymaga Codex app-server `0.125.0` lub nowszego. Plugin Codex sprawdza uzgadnianie inicjalizacji app-server i blokuje starsze lub niewersjonowane serwery, aby OpenClaw działał tylko z powierzchnią protokołu, z którą był testowany. Minimalna wersja `0.125.0` obejmuje obsługę natywnego payloadu haka MCP, która pojawiła się w Codex `0.124.0`, jednocześnie przypinając OpenClaw do nowszej, przetestowanej stabilnej linii.

### Middleware wyników narzędzi

Wbudowane pluginy mogą dołączać neutralne względem środowiska uruchomieniowego middleware wyników narzędzi przez `api.registerAgentToolResultMiddleware(...)`, gdy ich manifest deklaruje docelowe identyfikatory środowisk uruchomieniowych w `contracts.agentToolResultMiddleware`. Ta zaufana powierzchnia służy do asynchronicznych transformacji wyników narzędzi, które muszą wykonać się, zanim PI lub Codex przekaże dane wyjściowe narzędzia z powrotem do modelu.

Starsze wbudowane pluginy nadal mogą używać `api.registerCodexAppServerExtensionFactory(...)` dla middleware wyłącznie dla Codex app-server, ale nowe transformacje wyników powinny używać neutralnego względem środowiska uruchomieniowego API. Hak tylko dla Pi `api.registerEmbeddedExtensionFactory(...)` został usunięty; transformacje wyników narzędzi Pi muszą używać neutralnego względem środowiska uruchomieniowego middleware.

### Klasyfikacja wyniku terminalowego

Natywne harnessy, które zarządzają własną projekcją protokołu, mogą używać `classifyAgentHarnessTerminalOutcome(...)` z `openclaw/plugin-sdk/agent-harness-runtime`, gdy ukończona tura nie wygenerowała widocznego tekstu asystenta. Helper zwraca `empty`, `reasoning-only` lub `planning-only`, aby polityka awaryjnego wyboru OpenClaw mogła zdecydować, czy ponowić próbę na innym modelu. Celowo nie klasyfikuje błędów promptu, tur w toku ani zamierzonych cichych odpowiedzi, takich jak `NO_REPLY`.

### Natywny tryb harnessu Codex

Wbudowany harness `codex` jest natywnym trybem Codex dla osadzonych tur agenta OpenClaw. Najpierw włącz wbudowany plugin `codex` i uwzględnij `codex` w `plugins.allow`, jeśli konfiguracja używa restrykcyjnej listy dozwolonych. Konfiguracje natywnego app-server powinny używać `openai/gpt-*`; tury agenta OpenAI domyślnie wybierają harness Codex. Starsze trasy `openai-codex/*` należy naprawić za pomocą `openclaw doctor --fix`, a starsze referencje modeli `codex/*` pozostają aliasami zgodności dla natywnego harnessu.

Gdy ten tryb działa, Codex zarządza natywnym identyfikatorem wątku, zachowaniem wznowienia, compaction i wykonaniem app-server. OpenClaw nadal zarządza kanałem czatu, widocznym lustrem transkryptu, polityką narzędzi, zatwierdzeniami, dostarczaniem mediów i wyborem sesji. Użyj `agentRuntime.id: "codex"` dla dostawcy/modelu, gdy musisz udowodnić, że tylko ścieżka Codex app-server może przejąć uruchomienie. Jawne środowiska uruchomieniowe pluginów kończą się zamkniętą awarią; awarie wyboru Codex app-server i awarie środowiska uruchomieniowego nie są ponawiane przez PI.

## Rygor środowiska uruchomieniowego

Domyślnie OpenClaw używa polityki środowiska uruchomieniowego dostawcy/modelu `auto`: zarejestrowane harnessy pluginów mogą przejąć parę dostawca/model, a PI obsługuje turę, gdy żaden nie pasuje. Referencje agenta OpenAI u oficjalnego dostawcy OpenAI domyślnie używają Codex. Użyj jawnego środowiska uruchomieniowego pluginu dla dostawcy/modelu, takiego jak `agentRuntime.id: "codex"`, gdy brak wyboru harnessu powinien powodować awarię zamiast routingu przez PI. Awarie wybranych harnessów pluginów zawsze kończą się twardą awarią. Nie blokuje to jawnego `agentRuntime.id: "pi"` dla dostawcy/modelu.

Dla osadzonych uruchomień tylko Codex:

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

Jeśli chcesz backend CLI dla jednego kanonicznego modelu, umieść środowisko uruchomieniowe w tej pozycji modelu:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Nadpisania per agent używają tego samego kształtu przypisanego do modelu:

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

Przy jawnym środowisku uruchomieniowym pluginu sesja kończy się wcześnie, gdy żądany harness nie jest zarejestrowany, nie obsługuje rozstrzygniętego dostawcy/modelu lub zawiedzie przed wytworzeniem efektów ubocznych tury. Jest to celowe dla wdrożeń tylko Codex i dla testów na żywo, które muszą udowodnić, że ścieżka Codex app-server jest rzeczywiście używana.

To ustawienie kontroluje tylko osadzony agent harness. Nie wyłącza routingu modeli specyficznego dla dostawcy dla obrazów, wideo, muzyki, TTS, PDF ani innych typów.

## Natywne sesje i lustro transkryptu

Harness może przechowywać natywny identyfikator sesji, identyfikator wątku lub token wznowienia po stronie demona. Utrzymuj to powiązanie jawnie skojarzone z sesją OpenClaw i nadal odzwierciedlaj widoczne dla użytkownika dane wyjściowe asystenta/narzędzi w transkrypcie OpenClaw.

Transkrypt OpenClaw pozostaje warstwą zgodności dla:

- widocznej w kanale historii sesji
- wyszukiwania i indeksowania transkryptu
- przełączenia z powrotem na wbudowany harness PI w późniejszej turze
- generycznego zachowania `/new`, `/reset` i usuwania sesji

Jeśli harness przechowuje boczne powiązanie, zaimplementuj `reset(...)`, aby OpenClaw mógł je wyczyścić przy resetowaniu należącej do niego sesji OpenClaw.

## Wyniki narzędzi i mediów

Core konstruuje listę narzędzi OpenClaw i przekazuje ją do przygotowanej próby. Gdy harness wykonuje dynamiczne wywołanie narzędzia, zwróć wynik narzędzia przez kształt wyniku harnessu zamiast samodzielnie wysyłać media kanału.

Dzięki temu dane wyjściowe tekstu, obrazów, wideo, muzyki, TTS, zatwierdzeń i narzędzi wiadomości pozostają na tej samej ścieżce dostarczania co uruchomienia wspierane przez PI.

## Obecne ograniczenia

- Publiczna ścieżka importu jest generyczna, ale niektóre aliasy typów prób/wyników nadal zawierają nazwy `Pi` ze względu na zgodność.
- Instalacja harnessów firm trzecich jest eksperymentalna. Preferuj pluginy dostawców, dopóki nie potrzebujesz natywnego środowiska uruchomieniowego sesji.
- Przełączanie harnessów jest obsługiwane między turami. Nie przełączaj harnessów w środku tury po rozpoczęciu natywnych narzędzi, zatwierdzeń, tekstu asystenta lub wysyłania wiadomości.

## Powiązane

- [Omówienie SDK](/pl/plugins/sdk-overview)
- [Pomocniki środowiska uruchomieniowego](/pl/plugins/sdk-runtime)
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)
- [Środowisko Codex](/pl/plugins/codex-harness)
- [Dostawcy modeli](/pl/concepts/model-providers)
