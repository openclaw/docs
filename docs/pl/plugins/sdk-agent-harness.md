---
read_when:
    - Zmieniasz osadzony runtime agenta lub rejestr harnessów
    - Rejestrujesz harness agenta z dołączonego lub zaufanego pluginu
    - Musisz zrozumieć, jak plugin Codex odnosi się do dostawców modeli
sidebarTitle: Agent Harness
summary: Eksperymentalna powierzchnia SDK dla pluginów, które zastępują niskopoziomowy osadzony executor agenta
title: Pluginy Harness agenta
x-i18n:
    generated_at: "2026-04-12T00:18:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62b88fd24ce8b600179db27e16e8d764a2cd7a14e5c5df76374c33121aa5e365
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Pluginy Agent Harness

**Agent harness** to niskopoziomowy executor jednego przygotowanego kroku agenta OpenClaw. Nie jest dostawcą modeli, nie jest kanałem i nie jest rejestrem narzędzi.

Używaj tej powierzchni tylko dla dołączonych lub zaufanych natywnych pluginów. Kontrakt jest nadal eksperymentalny, ponieważ typy parametrów celowo odzwierciedlają obecny osadzony runner.

## Kiedy używać harnessu

Zarejestruj agent harness, gdy rodzina modeli ma własny natywny runtime sesji, a standardowy transport dostawcy OpenClaw jest niewłaściwą abstrakcją.

Przykłady:

- natywny serwer coding-agent, który zarządza wątkami i kompaktowaniem
- lokalny CLI lub demon, który musi strumieniować natywne zdarzenia planu/rozumowania/narzędzi
- runtime modelu, który oprócz transkryptu sesji OpenClaw potrzebuje własnego identyfikatora wznowienia

**Nie** rejestruj harnessu tylko po to, aby dodać nowe API LLM. Dla zwykłych modeli API HTTP lub WebSocket zbuduj [plugin dostawcy](/pl/plugins/sdk-provider-plugins).

## Czym nadal zarządza core

Zanim harness zostanie wybrany, OpenClaw ma już rozstrzygnięte:

- dostawcę i model
- stan uwierzytelniania runtime
- poziom myślenia i budżet kontekstu
- plik transkryptu/sesji OpenClaw
- workspace, sandbox i politykę narzędzi
- callbacki odpowiedzi kanału i callbacki strumieniowania
- politykę fallbacku modelu i przełączania modeli na żywo

Ten podział jest celowy. Harness uruchamia przygotowaną próbę; nie wybiera dostawców, nie zastępuje dostarczania przez kanał i nie przełącza po cichu modeli.

## Zarejestruj harness

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

1. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza zarejestrowany harness o tym id.
2. `OPENCLAW_AGENT_RUNTIME=pi` wymusza wbudowany harness PI.
3. `OPENCLAW_AGENT_RUNTIME=auto` pyta zarejestrowane harnessy, czy obsługują rozstrzygniętego dostawcę/model.
4. Jeśli żaden zarejestrowany harness nie pasuje, OpenClaw używa PI, chyba że fallback do PI jest wyłączony.

Błędy wymuszonego plugin harnessu są zgłaszane jako błędy uruchomienia. W trybie `auto` OpenClaw może wrócić do PI, jeśli wybrany plugin harness zakończy się błędem, zanim krok wywoła skutki uboczne. Ustaw `OPENCLAW_AGENT_HARNESS_FALLBACK=none` lub `embeddedHarness.fallback: "none"`, aby taki fallback zamiast tego był twardym błędem.

Dołączony plugin Codex rejestruje `codex` jako swoje id harnessu. Core traktuje to jak zwykłe id plugin harnessu; aliasy specyficzne dla Codex powinny należeć do pluginu lub konfiguracji operatora, a nie do współdzielonego selektora runtime.

## Parowanie dostawcy i harnessu

Większość harnessów powinna także zarejestrować dostawcę. Dostawca udostępnia reszcie OpenClaw referencje modeli, status uwierzytelnienia, metadane modeli i wybór `/model`. Następnie harness zgłasza tego dostawcę w `supports(...)`.

Dołączony plugin Codex stosuje ten wzorzec:

- id dostawcy: `codex`
- referencje modeli użytkownika: `codex/gpt-5.4`, `codex/gpt-5.2` lub inny model zwracany przez serwer aplikacji Codex
- id harnessu: `codex`
- uwierzytelnianie: syntetyczna dostępność dostawcy, ponieważ harness Codex zarządza natywnym logowaniem/sesją Codex
- żądanie app-server: OpenClaw wysyła do Codex samo id modelu i pozwala harnessowi komunikować się z natywnym protokołem app-server

Plugin Codex jest dodatkiem. Zwykłe referencje `openai/gpt-*` pozostają referencjami dostawcy OpenAI i nadal używają standardowej ścieżki dostawcy OpenClaw. Wybierz `codex/gpt-*`, gdy chcesz uwierzytelniania zarządzanego przez Codex, wykrywania modeli Codex, natywnych wątków i wykonywania przez app-server Codex. `/model` może przełączać się między modelami Codex zwracanymi przez app-server Codex bez konieczności posiadania poświadczeń dostawcy OpenAI.

Informacje o konfiguracji operatora, przykłady prefiksów modeli i konfiguracje tylko dla Codex znajdziesz w [Codex Harness](/pl/plugins/codex-harness).

OpenClaw wymaga app-server Codex w wersji `0.118.0` lub nowszej. Plugin Codex sprawdza handshake inicjalizacji app-server i blokuje starsze lub niewersjonowane serwery, aby OpenClaw działał tylko z powierzchnią protokołu, z którą był testowany.

### Tryb natywnego harnessu Codex

Dołączony harness `codex` to natywny tryb Codex dla osadzonych kroków agenta OpenClaw. Najpierw włącz dołączony plugin `codex` i uwzględnij `codex` w `plugins.allow`, jeśli twoja konfiguracja używa restrykcyjnej allowlisty. Różni się od `openai-codex/*`:

- `openai-codex/*` używa OAuth ChatGPT/Codex przez standardową ścieżkę dostawcy OpenClaw.
- `codex/*` używa dołączonego dostawcy Codex i kieruje krok przez app-server Codex.

Gdy ten tryb działa, Codex zarządza natywnym id wątku, zachowaniem wznowienia, kompaktowaniem i wykonywaniem przez app-server. OpenClaw nadal zarządza kanałem czatu, widocznym mirrorowaniem transkryptu, polityką narzędzi, zatwierdzeniami, dostarczaniem mediów i wyborem sesji. Użyj `embeddedHarness.runtime: "codex"` z `embeddedHarness.fallback: "none"`, gdy musisz potwierdzić, że używana jest ścieżka app-server Codex, a fallback do PI nie ukrywa uszkodzonego natywnego harnessu.

## Wyłącz fallback do PI

Domyślnie OpenClaw uruchamia osadzonych agentów z `agents.defaults.embeddedHarness` ustawionym na `{ runtime: "auto", fallback: "pi" }`. W trybie `auto` zarejestrowane plugin harnessy mogą zgłaszać obsługę pary dostawca/model. Jeśli żaden nie pasuje albo jeśli automatycznie wybrany plugin harness zakończy się błędem przed wygenerowaniem wyjścia, OpenClaw wraca do PI.

Ustaw `fallback: "none"`, gdy musisz potwierdzić, że plugin harness jest jedynym używanym runtime. Wyłącza to automatyczny fallback do PI; nie blokuje jawnego `runtime: "pi"` ani `OPENCLAW_AGENT_RUNTIME=pi`.

Dla osadzonych uruchomień tylko z Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Jeśli chcesz, aby dowolny zarejestrowany plugin harness zgłaszał pasujące modele, ale nigdy nie chcesz, aby OpenClaw po cichu wracał do PI, pozostaw `runtime: "auto"` i wyłącz fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
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
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` nadal nadpisuje skonfigurowany runtime. Użyj `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby wyłączyć fallback do PI z poziomu środowiska.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Przy wyłączonym fallbacku sesja kończy się wcześnie błędem, gdy żądany harness nie jest zarejestrowany, nie obsługuje rozstrzygniętego dostawcy/modelu albo kończy się błędem przed wywołaniem skutków ubocznych kroku. Jest to zamierzone dla wdrożeń tylko z Codex oraz dla testów live, które muszą potwierdzić, że ścieżka app-server Codex jest rzeczywiście używana.

To ustawienie kontroluje tylko osadzony agent harness. Nie wyłącza routingu modeli specyficznego dla dostawcy dla obrazów, wideo, muzyki, TTS, PDF ani innych funkcji.

## Natywne sesje i mirror transkryptu

Harness może przechowywać natywne id sesji, id wątku albo token wznowienia po stronie demona. Zachowuj to powiązanie jawnie skojarzone z sesją OpenClaw i nadal mirroruj widoczne dla użytkownika wyjście asystenta/narzędzi do transkryptu OpenClaw.

Transkrypt OpenClaw pozostaje warstwą kompatybilności dla:

- historii sesji widocznej w kanale
- wyszukiwania i indeksowania transkryptu
- przełączenia z powrotem na wbudowany harness PI w późniejszym kroku
- ogólnego zachowania `/new`, `/reset` i usuwania sesji

Jeśli twój harness przechowuje powiązanie sidecar, zaimplementuj `reset(...)`, aby OpenClaw mógł je wyczyścić, gdy powiązana sesja OpenClaw zostanie zresetowana.

## Wyniki narzędzi i mediów

Core konstruuje listę narzędzi OpenClaw i przekazuje ją do przygotowanej próby. Gdy harness wykonuje dynamiczne wywołanie narzędzia, zwróć wynik narzędzia przez kształt wyniku harnessu zamiast samodzielnie wysyłać media kanału.

Dzięki temu wyjścia tekstowe, obrazy, wideo, muzyka, TTS, zatwierdzenia i wyjścia narzędzi do komunikacji pozostają na tej samej ścieżce dostarczania co uruchomienia oparte na PI.

## Obecne ograniczenia

- Publiczna ścieżka importu jest ogólna, ale niektóre aliasy typów prób/wyników nadal zawierają nazwy `Pi` ze względu na kompatybilność.
- Instalacja harnessów firm trzecich jest eksperymentalna. Preferuj pluginy dostawców, dopóki nie potrzebujesz natywnego runtime sesji.
- Przełączanie harnessów między krokami jest obsługiwane. Nie przełączaj harnessów w środku kroku po rozpoczęciu natywnych narzędzi, zatwierdzeń, tekstu asystenta lub wysyłania wiadomości.

## Powiązane

- [Przegląd SDK](/pl/plugins/sdk-overview)
- [Pomocniki runtime](/pl/plugins/sdk-runtime)
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)
- [Codex Harness](/pl/plugins/codex-harness)
- [Dostawcy modeli](/pl/concepts/model-providers)
