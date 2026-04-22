---
read_when:
    - Zmieniasz osadzony runtime agenta lub rejestr harnessów.
    - Rejestrujesz harness agenta z bundled pluginu lub zaufanego pluginu.
    - Musisz zrozumieć, jak plugin Codex wiąże się z dostawcami modeli.
sidebarTitle: Agent Harness
summary: Eksperymentalna powierzchnia SDK dla pluginów, które zastępują niskopoziomowy osadzony executor agenta
title: Pluginy Harness agenta
x-i18n:
    generated_at: "2026-04-22T09:52:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 728fef59ae3cce29a3348842820f1f71a2eac98ae6b276179bce6c85d16613df
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Pluginy Harness agenta

**Harness agenta** to niskopoziomowy executor dla jednej przygotowanej tury
agenta OpenClaw. Nie jest dostawcą modeli, nie jest kanałem i nie jest rejestrem narzędzi.

Używaj tej powierzchni tylko dla bundled pluginów lub zaufanych pluginów natywnych. Ten kontrakt
nadal jest eksperymentalny, ponieważ typy parametrów celowo odzwierciedlają obecny
osadzony runner.

## Kiedy używać harnessu

Zarejestruj harness agenta, gdy rodzina modeli ma własny natywny runtime sesji
i zwykły transport dostawcy OpenClaw jest niewłaściwą abstrakcją.

Przykłady:

- natywny serwer coding-agent, który zarządza wątkami i Compaction
- lokalny CLI lub demon, który musi strumieniować natywne zdarzenia planu/rozumowania/narzędzi
- runtime modelu, który potrzebuje własnego id wznowienia oprócz transkryptu sesji
  OpenClaw

**Nie** rejestruj harnessu tylko po to, aby dodać nowe API LLM. Dla zwykłych API modeli przez HTTP lub
WebSocket zbuduj [plugin dostawcy](/pl/plugins/sdk-provider-plugins).

## Czym nadal zarządza core

Zanim harness zostanie wybrany, OpenClaw już rozwiązał:

- dostawcę i model
- stan uwierzytelnienia runtime
- poziom rozumowania i budżet kontekstu
- plik transkryptu/sesji OpenClaw
- workspace, sandbox i politykę narzędzi
- callbacki odpowiedzi kanału i callbacki streamingu
- politykę fallbacku modelu i przełączania modelu na żywo

Ten podział jest celowy. Harness uruchamia przygotowaną próbę; nie wybiera
dostawców, nie zastępuje dostarczania przez kanał i nie przełącza modeli po cichu.

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

## Zasady wyboru

OpenClaw wybiera harness po rozstrzygnięciu dostawcy/modelu:

1. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza zarejestrowany harness o tym id.
2. `OPENCLAW_AGENT_RUNTIME=pi` wymusza wbudowany harness PI.
3. `OPENCLAW_AGENT_RUNTIME=auto` pyta zarejestrowane harnessy, czy obsługują
   rozstrzygniętego dostawcę/model.
4. Jeśli żaden zarejestrowany harness nie pasuje, OpenClaw używa PI, chyba że fallback PI jest wyłączony.

Błędy harnessu pluginu są zgłaszane jako błędy uruchomienia. W trybie `auto`
fallback do PI jest używany tylko wtedy, gdy żaden zarejestrowany harness pluginu nie obsługuje rozstrzygniętego
dostawcy/modelu. Gdy harness pluginu już przejmie uruchomienie, OpenClaw nie odtwarza
tej samej tury przez PI, ponieważ może to zmienić semantykę auth/runtime
lub zduplikować skutki uboczne.

Bundled plugin Codex rejestruje `codex` jako id swojego harnessu. Core traktuje to
jak zwykłe id harnessu pluginu; aliasy specyficzne dla Codex należą do pluginu
lub konfiguracji operatora, a nie do współdzielonego selektora runtime.

## Parowanie dostawcy i harnessu

Większość harnessów powinna również rejestrować dostawcę. Dostawca udostępnia
odwołania do modeli, stan auth, metadane modeli oraz wybór `/model` reszcie
OpenClaw. Harness następnie przejmuje tego dostawcę w `supports(...)`.

Bundled plugin Codex stosuje ten wzorzec:

- id dostawcy: `codex`
- odwołania modeli użytkownika: `codex/gpt-5.4`, `codex/gpt-5.2` lub inny model zwrócony
  przez serwer aplikacji Codex
- id harnessu: `codex`
- auth: syntetyczna dostępność dostawcy, ponieważ harness Codex zarządza
  natywnym logowaniem/sesją Codex
- żądanie do serwera aplikacji: OpenClaw wysyła do Codex samo id modelu i pozwala
  harnessowi komunikować się z natywnym protokołem serwera aplikacji

Plugin Codex jest dodatkiem. Zwykłe odwołania `openai/gpt-*` pozostają odwołaniami
dostawcy OpenAI i nadal używają standardowej ścieżki dostawcy OpenClaw. Wybierz `codex/gpt-*`,
gdy chcesz auth zarządzane przez Codex, wykrywanie modeli Codex, natywne wątki oraz
wykonywanie przez serwer aplikacji Codex. `/model` może przełączać się między modelami Codex
zwróconymi przez serwer aplikacji Codex bez potrzeby posiadania poświadczeń dostawcy OpenAI.

Informacje o konfiguracji operatora, przykładach prefiksów modeli i konfiguracjach tylko dla Codex
znajdziesz w [Codex Harness](/pl/plugins/codex-harness).

OpenClaw wymaga serwera aplikacji Codex `0.118.0` lub nowszego. Plugin Codex sprawdza
handshake inicjalizacji serwera aplikacji i blokuje starsze lub niewersjonowane serwery, aby
OpenClaw działał tylko z powierzchnią protokołu, z którą został przetestowany.

### Natywny tryb harnessu Codex

Bundled harness `codex` to natywny tryb Codex dla osadzonych tur agenta
OpenClaw. Najpierw włącz bundled plugin `codex` i uwzględnij `codex` w
`plugins.allow`, jeśli Twoja konfiguracja używa restrykcyjnej allowlist. Różni się on
od `openai-codex/*`:

- `openai-codex/*` używa OAuth ChatGPT/Codex przez zwykłą ścieżkę dostawcy OpenClaw.
- `codex/*` używa bundled dostawcy Codex i kieruje turę przez serwer aplikacji Codex.

Gdy ten tryb działa, Codex zarządza natywnym id wątku, zachowaniem wznawiania,
Compaction i wykonywaniem przez serwer aplikacji. OpenClaw nadal zarządza kanałem czatu,
widocznym mirroringiem transkryptu, polityką narzędzi, zatwierdzeniami, dostarczaniem mediów
i wyborem sesji. Użyj `embeddedHarness.runtime: "codex"` razem z
`embeddedHarness.fallback: "none"`, gdy musisz wykazać, że tylko ścieżka
serwera aplikacji Codex może przejąć uruchomienie. Ta konfiguracja jest tylko guardem wyboru:
błędy serwera aplikacji Codex i tak kończą się bezpośrednim niepowodzeniem zamiast ponownej próby przez PI.

## Wyłączanie fallbacku PI

Domyślnie OpenClaw uruchamia osadzonych agentów z `agents.defaults.embeddedHarness`
ustawionym na `{ runtime: "auto", fallback: "pi" }`. W trybie `auto` zarejestrowane harnessy pluginów
mogą przejąć parę dostawca/model. Jeśli żaden nie pasuje, OpenClaw przechodzi awaryjnie do PI.

Ustaw `fallback: "none"`, gdy chcesz, aby brak wyboru harnessu pluginu kończył się błędem
zamiast użyciem PI. Błędy wybranego harnessu pluginu i tak kończą się twardym błędem. To
nie blokuje jawnego `runtime: "pi"` ani `OPENCLAW_AGENT_RUNTIME=pi`.

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

Jeśli chcesz, aby dowolny zarejestrowany harness pluginu przejmował pasujące modele, ale nigdy
nie chcesz, aby OpenClaw po cichu przechodził awaryjnie do PI, pozostaw `runtime: "auto"` i wyłącz
fallback:

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

Nadpisania per agent używają tego samego kształtu:

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

`OPENCLAW_AGENT_RUNTIME` nadal nadpisuje skonfigurowany runtime. Użyj
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby wyłączyć fallback PI z poziomu
środowiska.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Przy wyłączonym fallbacku sesja kończy się wcześnie błędem, gdy żądany harness nie jest
zarejestrowany, nie obsługuje rozstrzygniętego dostawcy/modelu lub kończy się błędem przed
wytworzeniem skutków ubocznych tury. Jest to celowe dla wdrożeń tylko z Codex oraz
dla testów live, które muszą wykazać, że ścieżka serwera aplikacji Codex jest rzeczywiście używana.

To ustawienie kontroluje tylko osadzony harness agenta. Nie wyłącza routingu modeli
specyficznego dla dostawcy dla obrazów, wideo, muzyki, TTS, PDF ani innych funkcji.

## Natywne sesje i mirror transkryptu

Harness może przechowywać natywne id sesji, id wątku lub token wznowienia po stronie demona.
Utrzymuj to powiązanie jawnie skojarzone z sesją OpenClaw i nadal
mirroruj widoczne dla użytkownika wyjście asystenta/narzędzi do transkryptu OpenClaw.

Transkrypt OpenClaw pozostaje warstwą zgodności dla:

- historii sesji widocznej w kanałach
- wyszukiwania i indeksowania transkryptów
- przełączania z powrotem na wbudowany harness PI w późniejszej turze
- ogólnego zachowania `/new`, `/reset` i usuwania sesji

Jeśli Twój harness przechowuje powiązanie sidecar, zaimplementuj `reset(...)`, aby OpenClaw mógł
je wyczyścić po zresetowaniu nadrzędnej sesji OpenClaw.

## Wyniki narzędzi i mediów

Core konstruuje listę narzędzi OpenClaw i przekazuje ją do przygotowanej próby.
Gdy harness wykonuje dynamiczne wywołanie narzędzia, zwróć wynik narzędzia z powrotem przez
kształt wyniku harnessu zamiast samodzielnie wysyłać media przez kanał.

Dzięki temu wyjścia tekstowe, obrazy, wideo, muzyka, TTS, zatwierdzenia i narzędzia wiadomości
pozostają na tej samej ścieżce dostarczania co uruchomienia oparte na PI.

## Obecne ograniczenia

- Publiczna ścieżka importu jest ogólna, ale niektóre aliasy typów prób/wyników nadal
  zawierają nazwy `Pi` ze względu na zgodność.
- Instalacja harnessów firm trzecich jest eksperymentalna. Preferuj pluginy dostawców,
  dopóki nie potrzebujesz natywnego runtime sesji.
- Przełączanie harnessów między turami jest obsługiwane. Nie przełączaj harnessów w trakcie
  tury po rozpoczęciu natywnych narzędzi, zatwierdzeń, tekstu asystenta lub
  wysyłania wiadomości.

## Powiązane

- [Przegląd SDK](/pl/plugins/sdk-overview)
- [Runtime Helpers](/pl/plugins/sdk-runtime)
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)
- [Codex Harness](/pl/plugins/codex-harness)
- [Dostawcy modeli](/pl/concepts/model-providers)
