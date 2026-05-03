---
read_when:
    - Zmieniasz wbudowane środowisko uruchomieniowe agenta lub rejestr środowisk testowych
    - Rejestrujesz uprząż agenta z dołączonej lub zaufanej wtyczki
    - Musisz zrozumieć, jak wtyczka Codex odnosi się do dostawców modeli
sidebarTitle: Agent Harness
summary: Eksperymentalny interfejs SDK dla Pluginów, które zastępują niskopoziomowy wbudowany wykonawca agenta
title: Pluginy uprzęży agenta
x-i18n:
    generated_at: "2026-05-03T09:53:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed416bbb433fc502c60fd8c24d20cd0f862d45472ff2eb0e2484b256b58f1b35
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**Powłoka agenta** to niskopoziomowy wykonawca jednej przygotowanej tury agenta OpenClaw. Nie jest dostawcą modelu, kanałem ani rejestrem narzędzi. Model mentalny przeznaczony dla użytkownika opisano w [Środowiskach uruchomieniowych agentów](/pl/concepts/agent-runtimes).

Używaj tej powierzchni tylko dla dołączonych lub zaufanych natywnych pluginów. Kontrakt nadal jest eksperymentalny, ponieważ typy parametrów celowo odzwierciedlają bieżący wbudowany runner.

## Kiedy używać powłoki

Zarejestruj powłokę agenta, gdy rodzina modeli ma własne natywne środowisko uruchomieniowe sesji, a standardowy transport dostawcy OpenClaw jest niewłaściwą abstrakcją.

Przykłady:

- natywny serwer agenta kodującego, który zarządza wątkami i compaction
- lokalny CLI lub demon, który musi strumieniować natywne zdarzenia planu/rozumowania/narzędzi
- środowisko uruchomieniowe modelu, które oprócz transkryptu sesji OpenClaw potrzebuje własnego identyfikatora wznowienia

Nie rejestruj powłoki tylko po to, aby dodać nowe API LLM. Dla standardowych API modeli HTTP lub WebSocket zbuduj [plugin dostawcy](/pl/plugins/sdk-provider-plugins).

## Co nadal należy do core

Zanim powłoka zostanie wybrana, OpenClaw rozwiązał już:

- dostawcę i model
- stan uwierzytelnienia środowiska uruchomieniowego
- poziom myślenia i budżet kontekstu
- plik transkryptu/sesji OpenClaw
- przestrzeń roboczą, piaskownicę i politykę narzędzi
- callbacki odpowiedzi kanału i callbacki strumieniowania
- politykę fallbacku modelu i przełączania modelu na żywo

Ten podział jest celowy. Powłoka uruchamia przygotowaną próbę; nie wybiera dostawców, nie zastępuje dostarczania w kanale ani nie przełącza modeli po cichu.

Przygotowana próba zawiera też `params.runtimePlan`, należący do OpenClaw pakiet polityk dla decyzji środowiska uruchomieniowego, które muszą pozostać współdzielone między PI a natywnymi powłokami:

- `runtimePlan.tools.normalize(...)` i
  `runtimePlan.tools.logDiagnostics(...)` dla polityki schematu narzędzi świadomej dostawcy
- `runtimePlan.transcript.resolvePolicy(...)` dla sanityzacji transkryptu i polityki naprawy wywołań narzędzi
- `runtimePlan.delivery.isSilentPayload(...)` dla współdzielonego `NO_REPLY` i tłumienia dostarczania mediów
- `runtimePlan.outcome.classifyRunResult(...)` dla klasyfikacji fallbacku modelu
- `runtimePlan.observability` dla rozwiązanych metadanych dostawcy/modelu/powłoki

Powłoki mogą używać planu do decyzji, które muszą odpowiadać zachowaniu PI, ale nadal powinny traktować go jako należący do hosta stan próby. Nie mutuj go ani nie używaj do przełączania dostawców/modeli w trakcie tury.

## Rejestrowanie powłoki

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

OpenClaw wybiera powłokę po rozwiązaniu dostawcy/modelu:

1. Zapisany identyfikator powłoki istniejącej sesji ma pierwszeństwo, więc zmiany konfiguracji/środowiska nie przełączają na gorąco tego transkryptu do innego środowiska uruchomieniowego.
2. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza zarejestrowaną powłokę o tym identyfikatorze dla sesji, które nie są jeszcze przypięte.
3. `OPENCLAW_AGENT_RUNTIME=pi` wymusza wbudowaną powłokę PI.
4. `OPENCLAW_AGENT_RUNTIME=auto` pyta zarejestrowane powłoki, czy obsługują rozwiązany dostawca/model.
5. Jeśli żadna zarejestrowana powłoka nie pasuje, OpenClaw używa PI, chyba że fallback PI jest wyłączony.

Niepowodzenia powłok pluginów są zgłaszane jako niepowodzenia uruchomienia. W trybie `auto` fallback PI jest używany tylko wtedy, gdy żadna zarejestrowana powłoka pluginu nie obsługuje rozwiązanego dostawcy/modelu. Gdy powłoka pluginu przejmie uruchomienie, OpenClaw nie odtwarza tej samej tury przez PI, ponieważ może to zmienić semantykę uwierzytelniania/środowiska uruchomieniowego albo zduplikować skutki uboczne.

Wybrany identyfikator powłoki jest utrwalany z identyfikatorem sesji po uruchomieniu wbudowanym. Starsze sesje utworzone przed przypinaniem powłok są traktowane jako przypięte do PI, gdy mają historię transkryptu. Użyj nowej/zresetowanej sesji przy przełączaniu między PI a natywną powłoką pluginu. `/status` pokazuje niedomyślne identyfikatory powłok, takie jak `codex`, obok `Fast`; PI pozostaje ukryte, ponieważ jest domyślną ścieżką zgodności. Jeśli wybrana powłoka jest zaskakująca, włącz debugowanie `agents/harness` i sprawdź ustrukturyzowany rekord gatewaya `agent harness selected`. Zawiera wybrany identyfikator powłoki, powód wyboru, politykę środowiska uruchomieniowego/fallbacku oraz, w trybie `auto`, wynik obsługi każdego kandydata pluginu.

Dołączony plugin Codex rejestruje `codex` jako identyfikator powłoki. Core traktuje go jak zwykły identyfikator powłoki pluginu; aliasy specyficzne dla Codex należą do pluginu lub konfiguracji operatora, a nie do współdzielonego selektora środowiska uruchomieniowego.

## Parowanie dostawcy i powłoki

Większość powłok powinna też rejestrować dostawcę. Dostawca udostępnia reszcie OpenClaw referencje modeli, stan uwierzytelniania, metadane modeli i wybór `/model`. Powłoka następnie przejmuje tego dostawcę w `supports(...)`.

Dołączony plugin Codex stosuje ten wzorzec:

- preferowane referencje modeli użytkownika: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- referencje zgodności: starsze referencje `codex/gpt-*` pozostają akceptowane, ale nowe konfiguracje nie powinny używać ich jako standardowych referencji dostawcy/modelu
- identyfikator powłoki: `codex`
- uwierzytelnianie: syntetyczna dostępność dostawcy, ponieważ powłoka Codex zarządza natywnym logowaniem/sesją Codex
- żądanie app-servera: OpenClaw wysyła do Codex sam identyfikator modelu i pozwala powłoce komunikować się z natywnym protokołem app-servera

Plugin Codex jest addytywny. Zwykłe referencje `openai/gpt-*` nadal używają standardowej ścieżki dostawcy OpenClaw, chyba że wymusisz powłokę Codex przez `agentRuntime.id: "codex"`. Starsze referencje `codex/gpt-*` nadal wybierają dostawcę i powłokę Codex dla zgodności.

Konfigurację operatora, przykłady prefiksów modeli i konfiguracje wyłącznie dla Codex opisuje [Powłoka Codex](/pl/plugins/codex-harness).

OpenClaw wymaga app-servera Codex `0.125.0` lub nowszego. Plugin Codex sprawdza handshake inicjalizacji app-servera i blokuje starsze lub niewersjonowane serwery, aby OpenClaw działał tylko na powierzchni protokołu, z którą został przetestowany. Minimum `0.125.0` obejmuje obsługę natywnego payloadu hooka MCP, która trafiła do Codex `0.124.0`, jednocześnie przypinając OpenClaw do nowszej przetestowanej stabilnej linii.

### Middleware wyników narzędzi

Dołączone pluginy mogą podłączać neutralne względem środowiska uruchomieniowego middleware wyników narzędzi przez `api.registerAgentToolResultMiddleware(...)`, gdy ich manifest deklaruje docelowe identyfikatory środowisk uruchomieniowych w `contracts.agentToolResultMiddleware`. Ta zaufana powierzchnia służy do asynchronicznych transformacji wyników narzędzi, które muszą zostać wykonane, zanim PI lub Codex przekaże wynik narzędzia z powrotem do modelu.

Starsze dołączone pluginy nadal mogą używać `api.registerCodexAppServerExtensionFactory(...)` dla middleware wyłącznie dla app-servera Codex, ale nowe transformacje wyników powinny używać API neutralnego względem środowiska uruchomieniowego. Hook tylko dla Pi `api.registerEmbeddedExtensionFactory(...)` został usunięty; transformacje wyników narzędzi Pi muszą używać neutralnego względem środowiska uruchomieniowego middleware.

### Klasyfikacja wyniku terminalnego

Natywne powłoki, które zarządzają własną projekcją protokołu, mogą używać `classifyAgentHarnessTerminalOutcome(...)` z `openclaw/plugin-sdk/agent-harness-runtime`, gdy ukończona tura nie wygenerowała widocznego tekstu asystenta. Helper zwraca `empty`, `reasoning-only` albo `planning-only`, aby polityka fallbacku OpenClaw mogła zdecydować, czy ponowić próbę na innym modelu. Celowo pozostawia niesklasyfikowane błędy promptu, tury w toku i zamierzone ciche odpowiedzi, takie jak `NO_REPLY`.

### Natywny tryb powłoki Codex

Dołączona powłoka `codex` jest natywnym trybem Codex dla wbudowanych tur agentów OpenClaw. Najpierw włącz dołączony plugin `codex`, a jeśli konfiguracja używa restrykcyjnej listy dozwolonych, uwzględnij `codex` w `plugins.allow`. Konfiguracje natywnego app-servera powinny używać `openai/gpt-*` z `agentRuntime.id: "codex"`. Używaj `openai-codex/*` dla OAuth Codex przez PI. Starsze referencje modeli `codex/*` pozostają aliasami zgodności dla natywnej powłoki.

Gdy ten tryb działa, Codex zarządza natywnym identyfikatorem wątku, zachowaniem wznowienia, compaction i wykonaniem app-servera. OpenClaw nadal zarządza kanałem czatu, widocznym lustrem transkryptu, polityką narzędzi, zatwierdzeniami, dostarczaniem mediów i wyborem sesji. Użyj `agentRuntime.id: "codex"`, gdy musisz udowodnić, że uruchomienie może przejąć wyłącznie ścieżka app-servera Codex. Jawne środowiska uruchomieniowe pluginów kończą się zamkniętym niepowodzeniem; niepowodzenia wyboru app-servera Codex i niepowodzenia środowiska uruchomieniowego nie są ponawiane przez PI.

## Rygor środowiska uruchomieniowego

Domyślnie OpenClaw uruchamia wbudowanych agentów z OpenClaw Pi. W trybie `auto` zarejestrowane powłoki pluginów mogą przejąć parę dostawca/model, a PI obsługuje turę, gdy żadna nie pasuje. Użyj jawnego środowiska uruchomieniowego pluginu, takiego jak `agentRuntime.id: "codex"`, gdy brak wyboru powłoki powinien kończyć się niepowodzeniem zamiast trasowania przez PI. Niepowodzenia wybranych powłok pluginów zawsze kończą się twardym błędem. Nie blokuje to jawnego `agentRuntime.id: "pi"` ani `OPENCLAW_AGENT_RUNTIME=pi`.

Dla wbudowanych uruchomień wyłącznie z Codex:

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

Jeśli chcesz, aby dowolna zarejestrowana powłoka pluginu przejmowała pasujące modele, a w pozostałych przypadkach używać PI, ustaw `id: "auto"`:

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

Nadpisania per agent używają tego samego kształtu:

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

Przy jawnym środowisku uruchomieniowym pluginu sesja kończy się wcześnie niepowodzeniem, gdy żądana powłoka nie jest zarejestrowana, nie obsługuje rozwiązanego dostawcy/modelu lub zawodzi przed wygenerowaniem skutków ubocznych tury. Jest to celowe dla wdrożeń wyłącznie z Codex oraz testów na żywo, które muszą udowodnić, że ścieżka app-servera Codex rzeczywiście jest używana.

To ustawienie kontroluje tylko wbudowaną powłokę agenta. Nie wyłącza trasowania modeli specyficznego dla dostawcy dla obrazów, wideo, muzyki, TTS, PDF ani innych typów.

## Natywne sesje i lustro transkryptu

Powłoka może utrzymywać natywny identyfikator sesji, identyfikator wątku lub token wznowienia po stronie demona. Utrzymuj to powiązanie jawnie skojarzone z sesją OpenClaw i nadal odzwierciedlaj widoczne dla użytkownika wyjście asystenta/narzędzi w transkrypcie OpenClaw.

Transkrypt OpenClaw pozostaje warstwą zgodności dla:

- widocznej w kanale historii sesji
- wyszukiwania i indeksowania transkryptu
- przełączenia z powrotem na wbudowaną powłokę PI w późniejszej turze
- ogólnego zachowania `/new`, `/reset` i usuwania sesji

Jeśli twoja powłoka przechowuje powiązanie sidecar, zaimplementuj `reset(...)`, aby OpenClaw mógł je wyczyścić po zresetowaniu właścicielskiej sesji OpenClaw.

## Wyniki narzędzi i mediów

Core konstruuje listę narzędzi OpenClaw i przekazuje ją do przygotowanej próby. Gdy powłoka wykonuje dynamiczne wywołanie narzędzia, zwróć wynik narzędzia przez kształt wyniku powłoki zamiast samodzielnie wysyłać media kanału.

Dzięki temu tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i wyjścia narzędzi wiadomości pozostają na tej samej ścieżce dostarczania co uruchomienia oparte na PI.

## Bieżące ograniczenia

- Publiczna ścieżka importu jest ogólna, ale niektóre aliasy typów prób/wyników nadal
  zawierają nazwy `Pi` ze względu na zgodność.
- Instalacja środowisk firm trzecich jest eksperymentalna. Preferuj Pluginy dostawców,
  dopóki nie potrzebujesz natywnego środowiska uruchomieniowego sesji.
- Przełączanie środowisk jest obsługiwane między turami. Nie przełączaj środowisk w
  środku tury po rozpoczęciu działania natywnych narzędzi, zatwierdzeń, tekstu
  asystenta lub wysyłania wiadomości.

## Powiązane

- [Przegląd SDK](/pl/plugins/sdk-overview)
- [Pomocniki środowiska uruchomieniowego](/pl/plugins/sdk-runtime)
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)
- [Środowisko Codex](/pl/plugins/codex-harness)
- [Dostawcy modeli](/pl/concepts/model-providers)
