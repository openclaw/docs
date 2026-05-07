---
read_when:
    - Zmieniasz wbudowane środowisko uruchomieniowe agenta lub rejestr harnessów
    - Rejestrujesz mechanizm agenta z dołączonego lub zaufanego Pluginu
    - Musisz zrozumieć, jak Plugin Codex odnosi się do dostawców modeli
sidebarTitle: Agent Harness
summary: Eksperymentalny interfejs SDK dla Pluginów, które zastępują niskopoziomowy wbudowany moduł wykonawczy agenta
title: Pluginy środowiska agenta
x-i18n:
    generated_at: "2026-05-07T13:22:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**Wykonawca agenta** to niskopoziomowy wykonawca jednej przygotowanej tury agenta OpenClaw. Nie jest dostawcą modelu, kanałem ani rejestrem narzędzi. Model mentalny przeznaczony dla użytkownika opisano w [Środowiskach uruchomieniowych agentów](/pl/concepts/agent-runtimes).

Używaj tej powierzchni tylko dla wbudowanych lub zaufanych natywnych Plugin. Kontrakt nadal jest eksperymentalny, ponieważ typy parametrów celowo odzwierciedlają obecny wbudowany runner.

## Kiedy używać wykonawcy

Zarejestruj wykonawcę agenta, gdy rodzina modeli ma własne natywne środowisko sesji, a standardowy transport dostawcy OpenClaw jest niewłaściwą abstrakcją.

Przykłady:

- natywny serwer agenta programistycznego, który zarządza wątkami i compaction
- lokalny CLI lub daemon, który musi strumieniować natywne zdarzenia planu/rozumowania/narzędzi
- środowisko modelu, które oprócz transkryptu sesji OpenClaw potrzebuje własnego identyfikatora wznowienia

Nie rejestruj wykonawcy tylko po to, aby dodać nowe API LLM. Dla zwykłych API modeli HTTP lub WebSocket zbuduj [Plugin dostawcy](/pl/plugins/sdk-provider-plugins).

## Co nadal należy do core

Zanim wykonawca zostanie wybrany, OpenClaw ma już rozwiązane:

- dostawcę i model
- stan uwierzytelnienia środowiska uruchomieniowego
- poziom myślenia i budżet kontekstu
- plik transkryptu/sesji OpenClaw
- obszar roboczy, sandbox i politykę narzędzi
- wywołania zwrotne odpowiedzi kanału i wywołania zwrotne strumieniowania
- politykę fallbacku modelu i przełączania modelu na żywo

Ten podział jest celowy. Wykonawca uruchamia przygotowaną próbę; nie wybiera dostawców, nie zastępuje dostarczania kanałowego ani po cichu nie przełącza modeli.

Przygotowana próba zawiera również `params.runtimePlan`, należący do OpenClaw pakiet polityk dla decyzji środowiska uruchomieniowego, które muszą pozostać wspólne dla PI i natywnych wykonawców:

- `runtimePlan.tools.normalize(...)` i
  `runtimePlan.tools.logDiagnostics(...)` dla polityki schematów narzędzi świadomej dostawcy
- `runtimePlan.transcript.resolvePolicy(...)` dla oczyszczania transkryptu i polityki naprawy wywołań narzędzi
- `runtimePlan.delivery.isSilentPayload(...)` dla współdzielonego `NO_REPLY` i tłumienia dostarczania mediów
- `runtimePlan.outcome.classifyRunResult(...)` dla klasyfikacji fallbacku modelu
- `runtimePlan.observability` dla rozwiązanych metadanych dostawcy/modelu/wykonawcy

Wykonawcy mogą używać planu do decyzji, które muszą odpowiadać zachowaniu PI, ale nadal powinni traktować go jako stan próby należący do hosta. Nie mutuj go ani nie używaj do przełączania dostawców/modeli wewnątrz tury.

## Rejestracja wykonawcy

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

OpenClaw wybiera wykonawcę po rozwiązaniu dostawcy/modelu:

1. Zapisany identyfikator wykonawcy istniejącej sesji ma pierwszeństwo, więc zmiany config/env nie przełączają na gorąco tego transkryptu do innego środowiska uruchomieniowego.
2. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza zarejestrowanego wykonawcę o tym identyfikatorze dla sesji, które nie są jeszcze przypięte.
3. `OPENCLAW_AGENT_RUNTIME=pi` wymusza wbudowanego wykonawcę PI.
4. `OPENCLAW_AGENT_RUNTIME=auto` pyta zarejestrowanych wykonawców, czy obsługują rozwiązany dostawca/model.
5. Jeśli żaden zarejestrowany wykonawca nie pasuje, OpenClaw używa PI, chyba że fallback PI jest wyłączony.

Awarie wykonawców Plugin są widoczne jako awarie uruchomienia. W trybie `auto` fallback PI jest używany tylko wtedy, gdy żaden zarejestrowany wykonawca Plugin nie obsługuje rozwiązanego dostawcy/modelu. Gdy wykonawca Plugin przejmie uruchomienie, OpenClaw nie odtwarza tej samej tury przez PI, ponieważ mogłoby to zmienić semantykę uwierzytelniania/środowiska uruchomieniowego albo zduplikować skutki uboczne.

Wybrany identyfikator wykonawcy jest utrwalany wraz z identyfikatorem sesji po wbudowanym uruchomieniu. Starsze sesje utworzone przed pinami wykonawców są traktowane jako przypięte do PI, gdy mają historię transkryptu. Użyj nowej/zresetowanej sesji przy zmianie między PI a natywnym wykonawcą Plugin. `/status` pokazuje niedomyślne identyfikatory wykonawców, takie jak `codex`, obok `Fast`; PI pozostaje ukryte, ponieważ jest domyślną ścieżką zgodności. Jeśli wybrany wykonawca jest zaskakujący, włącz logowanie debugowania `agents/harness` i sprawdź ustrukturyzowany rekord Gateway `agent harness selected`. Zawiera on wybrany identyfikator wykonawcy, powód wyboru, politykę środowiska uruchomieniowego/fallbacku oraz, w trybie `auto`, wynik obsługi każdego kandydata Plugin.

Wbudowany Plugin Codex rejestruje `codex` jako swój identyfikator wykonawcy. Core traktuje go jak zwykły identyfikator wykonawcy Plugin; aliasy specyficzne dla Codex należą do Plugin lub config operatora, a nie do współdzielonego selektora środowiska uruchomieniowego.

## Parowanie dostawcy i wykonawcy

Większość wykonawców powinna również rejestrować dostawcę. Dostawca sprawia, że referencje modeli, stan uwierzytelnienia, metadane modeli i wybór `/model` są widoczne dla reszty OpenClaw. Następnie wykonawca przejmuje tego dostawcę w `supports(...)`.

Wbudowany Plugin Codex stosuje ten wzorzec:

- preferowane referencje modelu użytkownika: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- referencje zgodności: starsze referencje `codex/gpt-*` pozostają akceptowane, ale nowe konfiguracje nie powinny używać ich jako zwykłych referencji dostawcy/modelu
- identyfikator wykonawcy: `codex`
- uwierzytelnianie: syntetyczna dostępność dostawcy, ponieważ wykonawca Codex zarządza natywnym logowaniem/sesją Codex
- żądanie app-server: OpenClaw wysyła do Codex sam identyfikator modelu i pozwala wykonawcy komunikować się z natywnym protokołem app-server

Plugin Codex jest addytywny. Zwykłe referencje `openai/gpt-*` nadal używają standardowej ścieżki dostawcy OpenClaw, chyba że wymusisz wykonawcę Codex przez `agentRuntime.id: "codex"`. Starsze referencje `codex/gpt-*` nadal wybierają dostawcę i wykonawcę Codex dla zgodności.

Konfigurację operatora, przykłady prefiksów modeli i konfiguracje tylko dla Codex opisano w [Wykonawca Codex](/pl/plugins/codex-harness).

OpenClaw wymaga Codex app-server `0.125.0` lub nowszego. Plugin Codex sprawdza uzgadnianie initialize app-server i blokuje starsze lub niewersjonowane serwery, aby OpenClaw działał tylko względem powierzchni protokołu, z którą został przetestowany. Minimum `0.125.0` obejmuje obsługę natywnego payloadu haka MCP, która trafiła do Codex `0.124.0`, jednocześnie przypinając OpenClaw do nowszej przetestowanej stabilnej linii.

### Middleware wyników narzędzi

Wbudowane Plugin mogą dołączać neutralne względem środowiska uruchomieniowego middleware wyników narzędzi przez `api.registerAgentToolResultMiddleware(...)`, gdy ich manifest deklaruje docelowe identyfikatory środowisk uruchomieniowych w `contracts.agentToolResultMiddleware`. Ta zaufana powierzchnia jest przeznaczona dla asynchronicznych transformacji wyników narzędzi, które muszą zostać uruchomione, zanim PI lub Codex przekaże wyjście narzędzia z powrotem do modelu.

Starsze wbudowane Plugin nadal mogą używać `api.registerCodexAppServerExtensionFactory(...)` dla middleware tylko dla Codex app-server, ale nowe transformacje wyników powinny używać API neutralnego względem środowiska uruchomieniowego. Hak tylko dla Pi `api.registerEmbeddedExtensionFactory(...)` został usunięty; transformacje wyników narzędzi Pi muszą używać middleware neutralnego względem środowiska uruchomieniowego.

### Klasyfikacja wyniku terminalnego

Natywni wykonawcy, którzy zarządzają własną projekcją protokołu, mogą używać `classifyAgentHarnessTerminalOutcome(...)` z `openclaw/plugin-sdk/agent-harness-runtime`, gdy ukończona tura nie wygenerowała widocznego tekstu asystenta. Pomocnik zwraca `empty`, `reasoning-only` albo `planning-only`, aby polityka fallbacku OpenClaw mogła zdecydować, czy ponowić próbę na innym modelu. Celowo pozostawia niesklasyfikowane błędy promptu, tury w toku oraz celowe ciche odpowiedzi, takie jak `NO_REPLY`.

### Natywny tryb wykonawcy Codex

Wbudowany wykonawca `codex` jest natywnym trybem Codex dla wbudowanych tur agentów OpenClaw. Najpierw włącz wbudowany Plugin `codex` i dodaj `codex` do `plugins.allow`, jeśli Twoja konfiguracja używa restrykcyjnej allowlist. Natywne konfiguracje app-server powinny używać `openai/gpt-*`; tury agentów OpenAI domyślnie wybierają wykonawcę Codex. Starsze trasy `openai-codex/*` powinny zostać naprawione za pomocą `openclaw doctor --fix`, a starsze referencje modeli `codex/*` pozostają aliasami zgodności dla natywnego wykonawcy.

Gdy ten tryb działa, Codex zarządza natywnym identyfikatorem wątku, zachowaniem wznowienia, compaction i wykonywaniem app-server. OpenClaw nadal zarządza kanałem czatu, widocznym lustrem transkryptu, polityką narzędzi, zatwierdzeniami, dostarczaniem mediów i wyborem sesji. Użyj `agentRuntime.id: "codex"`, gdy musisz udowodnić, że tylko ścieżka Codex app-server może przejąć uruchomienie. Jawne środowiska uruchomieniowe Plugin zamykają się niepowodzeniem; awarie wyboru Codex app-server i awarie środowiska uruchomieniowego nie są ponawiane przez PI.

## Rygor środowiska uruchomieniowego

Domyślnie OpenClaw uruchamia wbudowanych agentów za pomocą OpenClaw Pi. W trybie `auto` zarejestrowani wykonawcy Plugin mogą przejąć parę dostawca/model, a PI obsługuje turę, gdy nic nie pasuje. Użyj jawnego środowiska uruchomieniowego Plugin, takiego jak `agentRuntime.id: "codex"`, gdy brak wyboru wykonawcy powinien zakończyć się niepowodzeniem zamiast trasowania przez PI. Awarie wybranych wykonawców Plugin zawsze kończą się twardym błędem. Nie blokuje to jawnego `agentRuntime.id: "pi"` ani `OPENCLAW_AGENT_RUNTIME=pi`.

Dla wbudowanych uruchomień tylko Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Jeśli chcesz, aby dowolny zarejestrowany wykonawca Plugin przejmował pasujące modele, a w przeciwnym razie używane było PI, ustaw `id: "auto"`:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
      }
    }
  }
}
```

Nadpisania dla poszczególnych agentów używają tego samego kształtu:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` nadal nadpisuje skonfigurowane środowisko uruchomieniowe.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Przy jawnym środowisku uruchomieniowym Plugin sesja kończy się wcześnie niepowodzeniem, gdy żądany wykonawca nie jest zarejestrowany, nie obsługuje rozwiązanego dostawcy/modelu albo zawiedzie przed wytworzeniem skutków ubocznych tury. Jest to celowe dla wdrożeń tylko Codex oraz dla testów na żywo, które muszą udowodnić, że ścieżka Codex app-server jest faktycznie używana.

To ustawienie kontroluje tylko wbudowanego wykonawcę agenta. Nie wyłącza routingu modeli specyficznego dla dostawcy dla obrazów, wideo, muzyki, TTS, PDF ani innych typów.

## Sesje natywne i lustro transkryptu

Wykonawca może przechowywać natywny identyfikator sesji, identyfikator wątku albo token wznowienia po stronie daemona. Utrzymuj to powiązanie jawnie skojarzone z sesją OpenClaw i nadal kopiuj widoczne dla użytkownika wyjście asystenta/narzędzia do transkryptu OpenClaw.

Transkrypt OpenClaw pozostaje warstwą zgodności dla:

- historii sesji widocznej w kanale
- wyszukiwania i indeksowania transkryptu
- przełączenia z powrotem na wbudowanego wykonawcę PI w późniejszej turze
- ogólnego zachowania `/new`, `/reset` i usuwania sesji

Jeśli Twój wykonawca przechowuje powiązanie sidecar, zaimplementuj `reset(...)`, aby OpenClaw mógł je wyczyścić, gdy właścicielska sesja OpenClaw zostanie zresetowana.

## Wyniki narzędzi i mediów

Core konstruuje listę narzędzi OpenClaw i przekazuje ją do przygotowanej próby. Gdy wykonawca wykonuje dynamiczne wywołanie narzędzia, zwróć wynik narzędzia przez kształt wyniku wykonawcy zamiast samodzielnie wysyłać media kanałowe.

Dzięki temu wyjścia tekstu, obrazu, wideo, muzyki, TTS, zatwierdzeń i narzędzi wiadomości pozostają na tej samej ścieżce dostarczania co uruchomienia oparte na PI.

## Obecne ograniczenia

- Publiczna ścieżka importu jest ogólna, ale niektóre aliasy typów prób/wyników nadal
  zawierają nazwy `Pi` dla zgodności.
- Instalacja harnessów firm trzecich jest eksperymentalna. Preferuj pluginy dostawców,
  dopóki nie potrzebujesz natywnego runtime sesji.
- Przełączanie harnessów jest obsługiwane między turami. Nie przełączaj harnessów w
  środku tury po rozpoczęciu używania natywnych narzędzi, zgód, tekstu asystenta lub
  wysyłania wiadomości.

## Powiązane

- [Przegląd SDK](/pl/plugins/sdk-overview)
- [Pomocniki Runtime](/pl/plugins/sdk-runtime)
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)
- [Harness Codex](/pl/plugins/codex-harness)
- [Dostawcy modeli](/pl/concepts/model-providers)
