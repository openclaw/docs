---
read_when:
    - Zmieniasz osadzony runtime agenta lub rejestr harnessów
    - Rejestrujesz harness agenta z dołączonego lub zaufanego Pluginu
    - Musisz zrozumieć, jak Plugin Codex odnosi się do providerów modeli
sidebarTitle: Agent Harness
summary: Eksperymentalna powierzchnia SDK dla Pluginów, które zastępują niskopoziomowy osadzony executor agenta
title: Pluginy harnessu agenta
x-i18n:
    generated_at: "2026-04-24T09:23:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: af76c2a3ebe54c87920954b58126ee59538c0e6d3d1b4ba44890c1f5079fabc2
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**Harness agenta** to niskopoziomowy executor dla jednej przygotowanej tury agenta OpenClaw.
Nie jest providerem modelu, nie jest kanałem i nie jest rejestrem narzędzi.

Używaj tej powierzchni tylko dla dołączonych albo zaufanych natywnych Pluginów. Kontrakt
nadal jest eksperymentalny, ponieważ typy parametrów celowo odzwierciedlają bieżący
osadzony runner.

## Kiedy używać harnessu

Zarejestruj harness agenta, gdy rodzina modeli ma własny natywny runtime sesji
i normalny transport providera OpenClaw jest niewłaściwą abstrakcją.

Przykłady:

- natywny serwer agenta do kodowania, który zarządza wątkami i compaction
- lokalne CLI albo daemon, które musi streamować natywne zdarzenia planu/rozumowania/narzędzi
- runtime modelu, który oprócz transkryptu sesji OpenClaw potrzebuje własnego resume id

**Nie** rejestruj harnessu tylko po to, by dodać nowe API LLM. Dla zwykłych HTTP albo
WebSocket API modeli zbuduj [provider plugin](/pl/plugins/sdk-provider-plugins).

## Czym nadal zarządza rdzeń

Zanim harness zostanie wybrany, OpenClaw rozwiązał już:

- providera i model
- stan uwierzytelniania runtime
- poziom myślenia i budżet kontekstu
- plik transkryptu/sesji OpenClaw
- obszar roboczy, sandbox i politykę narzędzi
- callbacki odpowiedzi kanału i callbacki streamingu
- fallback modelu i politykę przełączania modeli na żywo

Ten podział jest celowy. Harness uruchamia przygotowaną próbę; nie wybiera
providerów, nie zastępuje dostarczania kanałowego i nie przełącza po cichu modeli.

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
    // Uruchom albo wznów swój natywny wątek.
    // Użyj params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent i innych przygotowanych pól próby.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Uruchamia wybrane modele przez natywny daemon agenta.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Polityka wyboru

OpenClaw wybiera harness po rozwiązaniu providera/modelu:

1. Wygrywa zarejestrowany identyfikator harness istniejącej sesji, aby zmiany config/env nie
   przełączały na gorąco tego transkryptu na inny runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza zarejestrowany harness o tym identyfikatorze dla
   sesji, które nie są jeszcze przypięte.
3. `OPENCLAW_AGENT_RUNTIME=pi` wymusza wbudowany harness PI.
4. `OPENCLAW_AGENT_RUNTIME=auto` pyta zarejestrowane harnessy, czy obsługują
   rozwiązany provider/model.
5. Jeśli żaden zarejestrowany harness nie pasuje, OpenClaw używa PI, chyba że fallback PI jest
   wyłączony.

Błędy harnessu Plugin są ujawniane jako błędy uruchomienia. W trybie `auto` fallback PI jest
używany tylko wtedy, gdy żaden zarejestrowany harness Plugin nie obsługuje rozwiązanego
providera/modelu. Gdy harness Plugin już przejął uruchomienie, OpenClaw nie
odtwarza tej samej tury przez PI, ponieważ może to zmienić semantykę auth/runtime
albo zduplikować skutki uboczne.

Wybrany identyfikator harness jest utrwalany razem z identyfikatorem sesji po osadzonym uruchomieniu.
Starsze sesje utworzone przed przypinaniem harnessów są traktowane jako przypięte do PI, gdy mają
historię transkryptu. Użyj nowej/zresetowanej sesji przy przełączaniu między PI a
natywnym harness Plugin. `/status` pokazuje niestandardowe identyfikatory harness, takie jak `codex`,
obok `Fast`; PI pozostaje ukryty, ponieważ jest domyślną ścieżką zgodności.
Jeśli wybrany harness jest zaskakujący, włącz logowanie debug `agents/harness` i
sprawdź ustrukturyzowany rekord gateway `agent harness selected`. Zawiera on
wybrany identyfikator harness, powód wyboru, politykę runtime/fallback oraz, w trybie
`auto`, wynik obsługi każdego kandydata Plugin.

Dołączony Plugin Codex rejestruje `codex` jako identyfikator swojego harnessu. Rdzeń traktuje to
jak zwykły identyfikator harness Plugin; aliasy specyficzne dla Codex należą do Pluginu
albo konfiguracji operatora, a nie do współdzielonego selektora runtime.

## Parowanie provider + harness

Większość harnessów powinna również rejestrować providera. Provider udostępnia reszcie
OpenClaw referencje modeli, status auth, metadane modeli i wybór `/model`.
Harness następnie przejmuje tego providera w `supports(...)`.

Dołączony Plugin Codex stosuje ten wzorzec:

- identyfikator providera: `codex`
- referencje modeli użytkownika: `openai/gpt-5.5` plus `embeddedHarness.runtime: "codex"`;
  starsze referencje `codex/gpt-*` pozostają akceptowane dla zgodności
- identyfikator harnessu: `codex`
- auth: syntetyczna dostępność providera, ponieważ harness Codex zarządza
  natywnym logowaniem/sesją Codex
- żądanie app-server: OpenClaw wysyła do Codex sam identyfikator modelu i pozwala
  harnessowi mówić natywnym protokołem app-server

Plugin Codex jest addytywny. Zwykłe referencje `openai/gpt-*` nadal używają
normalnej ścieżki providera OpenClaw, chyba że wymusisz harness Codex przez
`embeddedHarness.runtime: "codex"`. Starsze referencje `codex/gpt-*` nadal wybierają
providera i harness Codex dla zgodności.

Konfigurację operatora, przykłady prefiksów modeli i konfiguracje tylko dla Codex znajdziesz w
[Codex Harness](/pl/plugins/codex-harness).

OpenClaw wymaga Codex app-server `0.118.0` lub nowszego. Plugin Codex sprawdza
handshake inicjalizacyjny app-server i blokuje starsze albo niewersjonowane serwery, aby
OpenClaw działał tylko na powierzchni protokołu, z którą był testowany.

### Middleware wyniku narzędzia app-server Codex

Dołączone Pluginy mogą również dołączać middleware `tool_result` specyficzne dla app-server Codex przez `api.registerCodexAppServerExtensionFactory(...)`, gdy ich
manifest deklaruje `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
To warstwa dla zaufanych Pluginów służąca do asynchronicznych transformacji wyników narzędzi, które muszą
uruchamiać się wewnątrz natywnego harnessu Codex, zanim wynik narzędzia zostanie
odwzorowany z powrotem do transkryptu OpenClaw.

### Tryb natywnego harnessu Codex

Dołączony harness `codex` to natywny tryb Codex dla osadzonych tur
agenta OpenClaw. Najpierw włącz dołączony Plugin `codex` i uwzględnij `codex` w
`plugins.allow`, jeśli konfiguracja używa restrykcyjnej listy dozwolonych. Natywne konfiguracje app-server powinny używać `openai/gpt-*` z `embeddedHarness.runtime: "codex"`.
Dla Codex OAuth przez PI używaj zamiast tego `openai-codex/*`. Starsze referencje modeli `codex/*`
pozostają aliasami zgodności dla natywnego harnessu.

Gdy ten tryb działa, Codex zarządza natywnym identyfikatorem wątku, zachowaniem resume,
compaction i wykonaniem app-server. OpenClaw nadal zarządza kanałem czatu,
widocznym mirrorem transkryptu, polityką narzędzi, zatwierdzeniami, dostarczaniem mediów i wyborem sesji. Użyj `embeddedHarness.runtime: "codex"` z
`embeddedHarness.fallback: "none"`, gdy musisz udowodnić, że tylko ścieżka Codex
app-server może przejąć uruchomienie. Ta konfiguracja jest tylko strażnikiem wyboru:
błędy app-server Codex i tak już kończą się bezpośrednio błędem zamiast ponownej próby przez PI.

## Wyłączanie fallbacku PI

Domyślnie OpenClaw uruchamia osadzonych agentów z `agents.defaults.embeddedHarness`
ustawionym na `{ runtime: "auto", fallback: "pi" }`. W trybie `auto` zarejestrowane harnessy Plugin
mogą przejąć parę provider/model. Jeśli żaden nie pasuje, OpenClaw wraca do PI.

Ustaw `fallback: "none"`, gdy chcesz, aby brak wyboru harnessu Plugin kończył się błędem
zamiast użycia PI. Błędy wybranego harnessu Plugin i tak już kończą się twardym błędem. To
nie blokuje jawnego `runtime: "pi"` ani `OPENCLAW_AGENT_RUNTIME=pi`.

Dla osadzonych uruchomień tylko-Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Jeśli chcesz, aby każdy zarejestrowany harness Plugin mógł przejmować pasujące modele, ale nigdy
nie chcesz, by OpenClaw po cichu wracał do PI, pozostaw `runtime: "auto"` i wyłącz
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
        "model": "openai/gpt-5.5",
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

Przy wyłączonym fallback sesja kończy się wcześnie błędem, gdy żądany harness nie jest
zarejestrowany, nie obsługuje rozwiązanego providera/modelu albo kończy się błędem przed
wytworzeniem skutków ubocznych tury. To jest zamierzone dla wdrożeń tylko-Codex i
dla testów live, które muszą dowieść, że ścieżka app-server Codex jest rzeczywiście używana.

To ustawienie kontroluje tylko osadzony harness agenta. Nie wyłącza
routingu modeli specyficznych dla obrazów, wideo, muzyki, TTS, PDF ani innych providerów.

## Natywne sesje i mirror transkryptu

Harness może utrzymywać natywny identyfikator sesji, identyfikator wątku albo token wznowienia po stronie daemona.
Trzymaj to powiązanie jawnie skojarzone z sesją OpenClaw i utrzymuj
mirror widocznych dla użytkownika wyjść asystenta/narzędzi w transkrypcie OpenClaw.

Transkrypt OpenClaw pozostaje warstwą zgodności dla:

- historii sesji widocznej w kanałach
- wyszukiwania i indeksowania transkryptu
- przełączania z powrotem do wbudowanego harnessu PI w późniejszej turze
- generycznego zachowania `/new`, `/reset` i usuwania sesji

Jeśli harness przechowuje powiązanie sidecar, zaimplementuj `reset(...)`, aby OpenClaw mógł
je wyczyścić, gdy właścicielska sesja OpenClaw zostanie zresetowana.

## Wyniki narzędzi i mediów

Rdzeń konstruuje listę narzędzi OpenClaw i przekazuje ją do przygotowanej próby.
Gdy harness wykonuje dynamiczne wywołanie narzędzia, zwróć wynik narzędzia z powrotem przez
kształt wyniku harnessu zamiast samodzielnie wysyłać media kanałowe.

To utrzymuje wyniki tekstu, obrazów, wideo, muzyki, TTS, zatwierdzeń i narzędzi wiadomości
na tej samej ścieżce dostarczania, co uruchomienia wspierane przez PI.

## Bieżące ograniczenia

- Publiczna ścieżka importu jest generyczna, ale niektóre aliasy typów prób/wyników nadal
  noszą nazwy `Pi` dla zgodności.
- Instalacja harnessów zewnętrznych jest eksperymentalna. Preferuj Pluginy providerów,
  dopóki nie potrzebujesz natywnego runtime sesji.
- Przełączanie harnessów jest obsługiwane między turami. Nie przełączaj harnessów w
  środku tury po rozpoczęciu natywnych narzędzi, zatwierdzeń, tekstu asystenta albo
  wysyłek wiadomości.

## Powiązane

- [SDK Overview](/pl/plugins/sdk-overview)
- [Runtime Helpers](/pl/plugins/sdk-runtime)
- [Provider Plugins](/pl/plugins/sdk-provider-plugins)
- [Codex Harness](/pl/plugins/codex-harness)
- [Model Providers](/pl/concepts/model-providers)
