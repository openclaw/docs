---
read_when:
    - Zmieniasz wbudowane środowisko uruchomieniowe agenta lub rejestr harnessów
    - Rejestrujesz środowisko uruchomieniowe agenta z dołączonego lub zaufanego Plugin
    - Musisz zrozumieć, w jaki sposób Plugin Codex jest powiązany z dostawcami modeli
sidebarTitle: Agent Harness
summary: Eksperymentalny interfejs SDK dla pluginów zastępujących niskopoziomowy wbudowany mechanizm wykonawczy agenta
title: Pluginy uprzęży agenta
x-i18n:
    generated_at: "2026-05-02T09:59:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**Agent harness** to niskopoziomowy wykonawca dla jednej przygotowanej tury agenta OpenClaw. Nie jest dostawcą modelu, kanałem ani rejestrem narzędzi. Mentalny model widoczny dla użytkownika opisano w [środowiskach uruchomieniowych agentów](/pl/concepts/agent-runtimes).

Używaj tej powierzchni tylko dla wbudowanych lub zaufanych natywnych Plugin. Kontrakt jest nadal eksperymentalny, ponieważ typy parametrów celowo odzwierciedlają bieżący wbudowany runner.

## Kiedy używać harnessa

Zarejestruj agent harness, gdy rodzina modeli ma własne natywne środowisko uruchomieniowe sesji, a zwykły transport dostawcy OpenClaw jest niewłaściwą abstrakcją.

Przykłady:

- natywny serwer agenta programistycznego, który posiada wątki i compaction
- lokalny CLI lub demon, który musi strumieniować natywne zdarzenia planu/rozumowania/narzędzi
- środowisko uruchomieniowe modelu, które oprócz transkryptu sesji OpenClaw potrzebuje własnego identyfikatora wznowienia

Nie rejestruj harnessa tylko po to, aby dodać nowe API LLM. Dla zwykłych API modeli HTTP lub WebSocket zbuduj [Plugin dostawcy](/pl/plugins/sdk-provider-plugins).

## Co nadal należy do rdzenia

Zanim harness zostanie wybrany, OpenClaw ma już rozwiązane:

- dostawcę i model
- stan uwierzytelniania środowiska uruchomieniowego
- poziom myślenia i budżet kontekstu
- plik transkryptu/sesji OpenClaw
- workspace, sandbox i zasady narzędzi
- wywołania zwrotne odpowiedzi kanału i wywołania zwrotne strumieniowania
- zasady awaryjnego przełączania modelu i przełączania modelu na żywo

Ten podział jest celowy. Harness uruchamia przygotowaną próbę; nie wybiera dostawców, nie zastępuje dostarczania kanału ani nie przełącza modeli po cichu.

Przygotowana próba zawiera też `params.runtimePlan`, należący do OpenClaw pakiet zasad dla decyzji środowiska uruchomieniowego, które muszą pozostać współdzielone między PI i natywnymi harnessami:

- `runtimePlan.tools.normalize(...)` i
  `runtimePlan.tools.logDiagnostics(...)` dla zależnych od dostawcy zasad schematu narzędzi
- `runtimePlan.transcript.resolvePolicy(...)` dla sanityzacji transkryptu i zasad naprawy wywołań narzędzi
- `runtimePlan.delivery.isSilentPayload(...)` dla współdzielonego `NO_REPLY` i tłumienia dostarczania mediów
- `runtimePlan.outcome.classifyRunResult(...)` dla klasyfikacji awaryjnego przełączania modelu
- `runtimePlan.observability` dla rozwiązanych metadanych dostawcy/modelu/harnessa

Harnessy mogą używać planu do decyzji, które muszą odpowiadać zachowaniu PI, ale nadal powinny traktować go jako należący do hosta stan próby. Nie mutuj go ani nie używaj do przełączania dostawców/modeli wewnątrz tury.

## Rejestrowanie harnessa

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

1. Zapisany identyfikator harnessa istniejącej sesji ma pierwszeństwo, więc zmiany konfiguracji/środowiska nie przełączają tego transkryptu na gorąco do innego środowiska uruchomieniowego.
2. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza zarejestrowany harness o tym identyfikatorze dla sesji, które nie są jeszcze przypięte.
3. `OPENCLAW_AGENT_RUNTIME=pi` wymusza wbudowany harness PI.
4. `OPENCLAW_AGENT_RUNTIME=auto` pyta zarejestrowane harnessy, czy obsługują rozwiązany dostawca/model.
5. Jeśli żaden zarejestrowany harness nie pasuje, OpenClaw używa PI, chyba że awaryjne przejście do PI jest wyłączone.

Awarie harnessów Plugin są widoczne jako awarie uruchomienia. W trybie `auto` awaryjne przejście do PI jest używane tylko wtedy, gdy żaden zarejestrowany harness Plugin nie obsługuje rozwiązanego dostawcy/modelu. Gdy harness Plugin przejmie uruchomienie, OpenClaw nie odtwarza tej samej tury przez PI, ponieważ może to zmienić semantykę uwierzytelniania/środowiska uruchomieniowego albo zduplikować efekty uboczne.

Wybrany identyfikator harnessa jest utrwalany wraz z identyfikatorem sesji po wbudowanym uruchomieniu. Starsze sesje utworzone przed pinami harnessów są traktowane jako przypięte do PI, gdy mają już historię transkryptu. Użyj nowej/zresetowanej sesji przy zmianie między PI a natywnym harness’em Plugin. `/status` pokazuje niedomyślne identyfikatory harnessów, takie jak `codex`, obok `Fast`; PI pozostaje ukryte, ponieważ jest domyślną ścieżką zgodności. Jeśli wybrany harness jest zaskakujący, włącz logowanie debugowania `agents/harness` i sprawdź ustrukturyzowany rekord Gateway `agent harness selected`. Zawiera on wybrany identyfikator harnessa, powód wyboru, zasady środowiska uruchomieniowego/awaryjne oraz, w trybie `auto`, wynik obsługi każdego kandydata Plugin.

Wbudowany Plugin Codex rejestruje `codex` jako swój identyfikator harnessa. Rdzeń traktuje to jako zwykły identyfikator harnessa Plugin; aliasy specyficzne dla Codex należą do Plugin lub konfiguracji operatora, a nie do współdzielonego selektora środowiska uruchomieniowego.

## Parowanie dostawcy i harnessa

Większość harnessów powinna również rejestrować dostawcę. Dostawca udostępnia reszcie OpenClaw referencje modeli, stan uwierzytelniania, metadane modeli i wybór `/model`. Harness następnie przejmuje tego dostawcę w `supports(...)`.

Wbudowany Plugin Codex używa tego wzorca:

- preferowane referencje modelu użytkownika: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- referencje zgodności: starsze referencje `codex/gpt-*` pozostają akceptowane, ale nowe konfiguracje nie powinny używać ich jako zwykłych referencji dostawcy/modelu
- identyfikator harnessa: `codex`
- uwierzytelnianie: syntetyczna dostępność dostawcy, ponieważ harness Codex posiada natywne logowanie/sesję Codex
- żądanie app-servera: OpenClaw wysyła do Codex sam identyfikator modelu i pozwala harnessowi rozmawiać z natywnym protokołem app-servera

Plugin Codex jest addytywny. Zwykłe referencje `openai/gpt-*` nadal używają normalnej ścieżki dostawcy OpenClaw, chyba że wymusisz harness Codex za pomocą `agentRuntime.id: "codex"`. Starsze referencje `codex/gpt-*` nadal wybierają dostawcę i harness Codex dla zgodności.

Konfigurację operatora, przykłady prefiksów modeli i konfiguracje wyłącznie dla Codex opisano w [Codex Harness](/pl/plugins/codex-harness).

OpenClaw wymaga Codex app-server `0.125.0` lub nowszego. Plugin Codex sprawdza uzgadnianie inicjalizacji app-servera i blokuje starsze lub niewersjonowane serwery, aby OpenClaw działał tylko z powierzchnią protokołu, z którą został przetestowany. Minimum `0.125.0` obejmuje natywną obsługę ładunku hooków MCP, która trafiła do Codex `0.124.0`, jednocześnie przypinając OpenClaw do nowszej przetestowanej stabilnej linii.

### Middleware wyników narzędzi

Wbudowane Plugin mogą dołączać neutralne względem środowiska uruchomieniowego middleware wyników narzędzi przez `api.registerAgentToolResultMiddleware(...)`, gdy ich manifest deklaruje docelowe identyfikatory środowisk uruchomieniowych w `contracts.agentToolResultMiddleware`. Ta zaufana powierzchnia służy do asynchronicznych transformacji wyników narzędzi, które muszą działać, zanim PI lub Codex przekaże wynik narzędzia z powrotem do modelu.

Starsze wbudowane Plugin nadal mogą używać `api.registerCodexAppServerExtensionFactory(...)` dla middleware wyłącznie dla Codex app-servera, ale nowe transformacje wyników powinny używać API neutralnego względem środowiska uruchomieniowego. Hook wyłącznie dla Pi `api.registerEmbeddedExtensionFactory(...)` został usunięty; transformacje wyników narzędzi Pi muszą używać neutralnego względem środowiska uruchomieniowego middleware.

### Klasyfikacja wyniku końcowego

Natywne harnessy, które posiadają własną projekcję protokołu, mogą używać `classifyAgentHarnessTerminalOutcome(...)` z `openclaw/plugin-sdk/agent-harness-runtime`, gdy ukończona tura nie wytworzyła widocznego tekstu asystenta. Helper zwraca `empty`, `reasoning-only` lub `planning-only`, aby zasady awaryjnego przełączania OpenClaw mogły zdecydować, czy ponowić próbę na innym modelu. Celowo pozostawia niesklasyfikowane błędy promptów, trwające tury i celowe ciche odpowiedzi, takie jak `NO_REPLY`.

### Natywny tryb harnessa Codex

Wbudowany harness `codex` jest natywnym trybem Codex dla wbudowanych tur agenta OpenClaw. Najpierw włącz wbudowany Plugin `codex` i uwzględnij `codex` w `plugins.allow`, jeśli konfiguracja używa restrykcyjnej listy dozwolonych. Natywne konfiguracje app-servera powinny używać `openai/gpt-*` z `agentRuntime.id: "codex"`. Użyj `openai-codex/*` dla OAuth Codex przez PI. Starsze referencje modeli `codex/*` pozostają aliasami zgodności dla natywnego harnessa.

Gdy ten tryb działa, Codex posiada natywny identyfikator wątku, zachowanie wznowienia, compaction i wykonanie app-servera. OpenClaw nadal posiada kanał czatu, widoczne lustro transkryptu, zasady narzędzi, zatwierdzenia, dostarczanie mediów i wybór sesji. Użyj `agentRuntime.id: "codex"` bez nadpisania `fallback`, gdy musisz udowodnić, że tylko ścieżka Codex app-servera może przejąć uruchomienie. Jawne środowiska uruchomieniowe Plugin już domyślnie zamykają się awaryjnie. Ustaw `fallback: "pi"` tylko wtedy, gdy celowo chcesz, aby PI obsłużyło brak wyboru harnessa. Awarie Codex app-servera już kończą się bezpośrednio błędem, zamiast ponawiać przez PI.

## Wyłączanie awaryjnego przejścia do PI

Domyślnie OpenClaw uruchamia wbudowanych agentów z `agents.defaults.agentRuntime` ustawionym na `{ id: "auto", fallback: "pi" }`. W trybie `auto` zarejestrowane harnessy Plugin mogą przejąć parę dostawca/model. Jeśli żaden nie pasuje, OpenClaw przechodzi awaryjnie do PI.

W trybie `auto` ustaw `fallback: "none"`, gdy brak wyboru harnessa Plugin ma kończyć się błędem zamiast użycia PI. Jawne środowiska uruchomieniowe Plugin, takie jak `agentRuntime.id: "codex"`, już domyślnie zamykają się awaryjnie, chyba że `fallback: "pi"` jest ustawione w tym samym zakresie konfiguracji lub nadpisania środowiska. Awarie wybranego harnessa Plugin zawsze kończą się twardym błędem. Nie blokuje to jawnego `agentRuntime.id: "pi"` ani `OPENCLAW_AGENT_RUNTIME=pi`.

Dla wbudowanych uruchomień wyłącznie Codex:

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

Jeśli chcesz, aby dowolny zarejestrowany harness Plugin przejmował pasujące modele, ale nigdy nie chcesz, aby OpenClaw po cichu przechodził awaryjnie do PI, pozostaw `runtime: "auto"` i wyłącz fallback:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Nadpisania per-agent używają tego samego kształtu:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` nadal nadpisuje skonfigurowane środowisko uruchomieniowe. Użyj `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby wyłączyć awaryjne przejście do PI ze środowiska.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Po wyłączeniu fallbacku sesja kończy się wcześnie błędem, gdy żądany harness nie jest zarejestrowany, nie obsługuje rozwiązanego dostawcy/modelu albo zawiedzie przed wytworzeniem efektów ubocznych tury. Jest to celowe dla wdrożeń wyłącznie Codex i dla testów live, które muszą udowodnić, że ścieżka Codex app-servera jest faktycznie używana.

To ustawienie kontroluje tylko wbudowany agent harness. Nie wyłącza routingu modeli specyficznego dla dostawcy dla obrazów, wideo, muzyki, TTS, PDF ani innych typów.

## Natywne sesje i lustro transkryptu

Harness może przechowywać natywny identyfikator sesji, identyfikator wątku lub token wznowienia po stronie demona. Utrzymuj to powiązanie jawnie skojarzone z sesją OpenClaw i nadal odzwierciedlaj widoczne dla użytkownika wyniki asystenta/narzędzi w transkrypcie OpenClaw.

Transkrypt OpenClaw pozostaje warstwą zgodności dla:

- widocznej w kanale historii sesji
- wyszukiwania i indeksowania transkryptów
- przełączania z powrotem na wbudowany harness PI w późniejszej turze
- ogólnego zachowania `/new`, `/reset` i usuwania sesji

Jeśli harness przechowuje boczne powiązanie, zaimplementuj `reset(...)`, aby OpenClaw mógł je wyczyścić, gdy należąca do niego sesja OpenClaw zostanie zresetowana.

## Wyniki narzędzi i mediów

Rdzeń tworzy listę narzędzi OpenClaw i przekazuje ją do przygotowanej próby.
Gdy środowisko uruchomieniowe wykonuje dynamiczne wywołanie narzędzia, zwróć wynik narzędzia z powrotem przez
kształt wyniku środowiska uruchomieniowego zamiast samodzielnie wysyłać multimedia kanału.

Dzięki temu tekst, obraz, wideo, muzyka, TTS, zatwierdzenia i wyjścia narzędzi komunikacyjnych
pozostają na tej samej ścieżce dostarczania co uruchomienia wspierane przez PI.

## Bieżące ograniczenia

- Publiczna ścieżka importu jest ogólna, ale niektóre aliasy typów prób/wyników nadal
  zawierają nazwy `Pi` ze względu na zgodność.
- Instalacja środowisk uruchomieniowych innych firm jest eksperymentalna. Preferuj pluginy dostawców,
  dopóki nie potrzebujesz natywnego środowiska sesji.
- Przełączanie środowisk uruchomieniowych jest obsługiwane między turami. Nie przełączaj środowisk uruchomieniowych
  w środku tury po rozpoczęciu natywnych narzędzi, zatwierdzeń, tekstu asystenta lub wysyłania
  wiadomości.

## Powiązane

- [Omówienie SDK](/pl/plugins/sdk-overview)
- [Pomocnicy środowiska uruchomieniowego](/pl/plugins/sdk-runtime)
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)
- [Środowisko uruchomieniowe Codex](/pl/plugins/codex-harness)
- [Dostawcy modeli](/pl/concepts/model-providers)
