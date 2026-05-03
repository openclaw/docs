---
read_when:
    - Tworzysz Plugin, który wymaga before_tool_call, before_agent_reply, hooków wiadomości lub hooków cyklu życia
    - Musisz blokować, przepisywać lub wymagać zatwierdzenia wywołań narzędzi z Plugin
    - Decydujesz między wewnętrznymi hookami a hookami Plugin
summary: 'Hooki Plugin: przechwytuj zdarzenia cyklu życia agenta, narzędzia, wiadomości, sesji i Gateway'
title: Hooki Plugin
x-i18n:
    generated_at: "2026-05-03T21:35:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c4ed060f1b89917e1f2f46d2da9448cd562edbcd6ce03bc9b1a83da3ed9a591
    source_path: plugins/hooks.md
    workflow: 16
---

Hooki Plugin są punktami rozszerzeń działającymi w procesie dla Plugin OpenClaw. Używaj ich,
gdy Plugin musi sprawdzać lub zmieniać uruchomienia agentów, wywołania narzędzi, przepływ wiadomości,
cykl życia sesji, trasowanie podagentów, instalacje albo uruchamianie Gateway.

Zamiast tego użyj [hooków wewnętrznych](/pl/automation/hooks), gdy potrzebujesz małego
skryptu `HOOK.md` zainstalowanego przez operatora dla zdarzeń poleceń i Gateway, takich jak
`/new`, `/reset`, `/stop`, `agent:bootstrap` lub `gateway:startup`.

## Szybki start

Zarejestruj typowane hooki Plugin za pomocą `api.on(...)` z punktu wejścia swojego Plugin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Procedury obsługi hooków działają sekwencyjnie w malejącej kolejności `priority`. Hooki o tym samym priorytecie
zachowują kolejność rejestracji.

`api.on(name, handler, opts?)` przyjmuje:

- `priority` — kolejność procedur obsługi (wyższa wartość uruchamia się wcześniej).
- `timeoutMs` — opcjonalny budżet dla pojedynczego hooka. Gdy jest ustawiony, runner hooków przerywa tę
  procedurę obsługi po upływie budżetu i przechodzi do następnej, zamiast
  pozwolić powolnej konfiguracji lub odtwarzaniu kontekstu zużyć skonfigurowany przez wywołującego
  limit czasu modelu. Pomiń go, aby użyć domyślnego limitu czasu obserwacji/decyzji, który
  runner hooków stosuje ogólnie.

Operatorzy mogą też ustawiać budżety hooków bez modyfikowania kodu Plugin:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` nadpisuje `hooks.timeoutMs`, które nadpisuje
wartość `api.on(..., { timeoutMs })` zdefiniowaną przez autora Plugin. Każda skonfigurowana wartość musi
być dodatnią liczbą całkowitą nie większą niż 600000 milisekund. Preferuj nadpisania dla konkretnych hooków
dla znanych wolnych hooków, aby jeden Plugin nie otrzymywał dłuższego budżetu
wszędzie.

Każdy hook otrzymuje `event.context.pluginConfig`, rozwiązaną konfigurację dla
Plugin, który zarejestrował tę procedurę obsługi. Używaj jej do decyzji hooków, które wymagają
bieżących opcji Plugin; OpenClaw wstrzykuje ją dla każdej procedury obsługi bez mutowania
współdzielonego obiektu zdarzenia widzianego przez inne Plugin.

## Katalog hooków

Hooki są pogrupowane według powierzchni, którą rozszerzają. Nazwy zapisane **pogrubieniem** akceptują
wynik decyzji (blokada, anulowanie, nadpisanie lub wymaganie zatwierdzenia); wszystkie pozostałe służą
wyłącznie do obserwacji.

**Tura agenta**

- `before_model_resolve` — nadpisz dostawcę lub model przed załadowaniem wiadomości sesji
- `agent_turn_prepare` — zużyj zakolejkowane wstrzyknięcia tur Plugin i dodaj kontekst tej samej tury przed hookami promptu
- `before_prompt_build` — dodaj dynamiczny kontekst lub tekst promptu systemowego przed wywołaniem modelu
- `before_agent_start` — wyłącznie faza zgodności łączonej; preferuj dwa powyższe hooki
- **`before_agent_reply`** — skróć turę modelu syntetyczną odpowiedzią albo ciszą
- **`before_agent_finalize`** — sprawdź naturalną odpowiedź końcową i zażądaj jeszcze jednego przebiegu modelu
- `agent_end` — obserwuj wiadomości końcowe, stan powodzenia i czas trwania uruchomienia
- `heartbeat_prompt_contribution` — dodaj kontekst wyłącznie dla Heartbeat dla monitorów w tle i Plugin cyklu życia

**Obserwacja konwersacji**

- `model_call_started` / `model_call_ended` — obserwuj oczyszczone metadane wywołania dostawcy/modelu, czas, wynik i ograniczone hashe identyfikatorów żądań bez treści promptu ani odpowiedzi
- `llm_input` — obserwuj wejście dostawcy (prompt systemowy, prompt, historia)
- `llm_output` — obserwuj wyjście dostawcy

**Narzędzia**

- **`before_tool_call`** — przepisz parametry narzędzia, zablokuj wykonanie albo wymagaj zatwierdzenia
- `after_tool_call` — obserwuj wyniki narzędzia, błędy i czas trwania
- **`tool_result_persist`** — przepisz wiadomość asystenta utworzoną z wyniku narzędzia
- **`before_message_write`** — sprawdź lub zablokuj trwający zapis wiadomości (rzadkie)

**Wiadomości i dostarczanie**

- **`inbound_claim`** — przejmij wiadomość przychodzącą przed trasowaniem agenta (odpowiedzi syntetyczne)
- `message_received` — obserwuj treść przychodzącą, nadawcę, wątek i metadane
- **`message_sending`** — przepisz treść wychodzącą albo anuluj dostarczenie
- `message_sent` — obserwuj powodzenie lub niepowodzenie dostarczenia wychodzącego
- **`before_dispatch`** — sprawdź lub przepisz wysyłkę wychodzącą przed przekazaniem do kanału
- **`reply_dispatch`** — uczestnicz w końcowym potoku wysyłki odpowiedzi

**Sesje i Compaction**

- `session_start` / `session_end` — śledź granice cyklu życia sesji
- `before_compaction` / `after_compaction` — obserwuj lub adnotuj cykle Compaction
- `before_reset` — obserwuj zdarzenia resetowania sesji (`/reset`, resetowania programowe)

**Podagenci**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — koordynuj trasowanie podagentów i dostarczanie ukończenia

**Cykl życia**

- `gateway_start` / `gateway_stop` — uruchamiaj lub zatrzymuj usługi należące do Plugin razem z Gateway
- `cron_changed` — obserwuj zmiany cyklu życia Cron należące do gateway (dodano, zaktualizowano, usunięto, uruchomiono, zakończono, zaplanowano)
- **`before_install`** — sprawdź skany instalacji Skills lub Plugin i opcjonalnie zablokuj

## Polityka wywołań narzędzi

`before_tool_call` otrzymuje:

- `event.toolName`
- `event.params`
- opcjonalne `event.runId`
- opcjonalne `event.toolCallId`
- pola kontekstu, takie jak `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ustawiane w uruchomieniach sterowanych przez cron) oraz diagnostyczne `ctx.trace`

Może zwrócić:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Reguły:

- `block: true` jest terminalne i pomija procedury obsługi o niższym priorytecie.
- `block: false` jest traktowane jako brak decyzji.
- `params` przepisuje parametry narzędzia do wykonania.
- `requireApproval` wstrzymuje uruchomienie agenta i pyta użytkownika przez zatwierdzenia Plugin.
  Polecenie `/approve` może zatwierdzać zarówno zatwierdzenia exec, jak i Plugin.
- `block: true` o niższym priorytecie nadal może zablokować działanie po tym, jak hook o wyższym priorytecie
  zażądał zatwierdzenia.
- `onResolution` otrzymuje rozstrzygniętą decyzję zatwierdzenia — `allow-once`,
  `allow-always`, `deny`, `timeout` lub `cancelled`.

Wbudowane Plugin, które potrzebują polityki na poziomie hosta, mogą rejestrować zaufane polityki narzędzi
za pomocą `api.registerTrustedToolPolicy(...)`. Uruchamiają się one przed zwykłymi
hookami `before_tool_call` i przed decyzjami zewnętrznych Plugin. Używaj ich tylko
dla zaufanych przez hosta bramek, takich jak polityka obszaru roboczego, egzekwowanie budżetu lub
bezpieczeństwo zarezerwowanych przepływów pracy. Zewnętrzne Plugin powinny używać zwykłych
hooków `before_tool_call`.

### Utrwalanie wyników narzędzi

Wyniki narzędzi mogą zawierać ustrukturyzowane `details` do renderowania UI, diagnostyki,
trasowania multimediów lub metadanych należących do Plugin. Traktuj `details` jako metadane wykonawcze,
a nie treść promptu:

- OpenClaw usuwa `toolResult.details` przed odtwarzaniem u dostawcy i wejściem Compaction,
  aby metadane nie stały się kontekstem modelu.
- Utrwalone wpisy sesji zachowują tylko ograniczone `details`. Zbyt duże szczegóły są
  zastępowane zwartym podsumowaniem i `persistedDetailsTruncated: true`.
- `tool_result_persist` i `before_message_write` uruchamiają się przed końcowym
  limitem utrwalania. Hooki nadal powinny utrzymywać zwracane `details` jako małe i unikać
  umieszczania tekstu istotnego dla promptu wyłącznie w `details`; dane wyjściowe narzędzia widoczne dla modelu
  umieszczaj w `content`.

## Hooki promptu i modelu

Dla nowych Plugin używaj hooków specyficznych dla faz:

- `before_model_resolve`: otrzymuje tylko bieżący prompt i metadane załączników.
  Zwróć `providerOverride` lub `modelOverride`.
- `agent_turn_prepare`: otrzymuje bieżący prompt, przygotowane wiadomości sesji
  oraz wszelkie zakolejkowane wstrzyknięcia dokładnie-jeden-raz opróżnione dla tej sesji. Zwróć
  `prependContext` lub `appendContext`.
- `before_prompt_build`: otrzymuje bieżący prompt i wiadomości sesji.
  Zwróć `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` lub `appendSystemContext`.
- `heartbeat_prompt_contribution`: działa tylko dla tur Heartbeat i zwraca
  `prependContext` lub `appendContext`. Jest przeznaczony dla monitorów w tle,
  które muszą podsumować bieżący stan bez zmieniania tur inicjowanych przez użytkownika.

`before_agent_start` pozostaje dla zgodności. Preferuj jawne hooki powyżej,
aby Twój Plugin nie zależał od starszej fazy łączonej.

`before_agent_start` i `agent_end` zawierają `event.runId`, gdy OpenClaw może
zidentyfikować aktywne uruchomienie. Ta sama wartość jest też dostępna w `ctx.runId`.
Uruchomienia sterowane przez Cron ujawniają także `ctx.jobId` (identyfikator źródłowego zadania cron), aby
hooki Plugin mogły zawężać metryki, efekty uboczne lub stan do konkretnego zaplanowanego
zadania.

W przypadku uruchomień pochodzących z kanału `ctx.messageProvider` jest powierzchnią dostawcy, taką
jak `discord` lub `telegram`, natomiast `ctx.channelId` jest docelowym identyfikatorem konwersacji,
gdy OpenClaw może wyprowadzić go z klucza sesji lub metadanych dostarczenia.

`agent_end` jest hookiem obserwacyjnym i działa fire-and-forget po turze. Runner
hooków stosuje 30-sekundowy limit czasu, aby zablokowany Plugin lub endpoint embeddingów
nie mógł pozostawić obietnicy hooka w stanie oczekiwania bez końca. Limit czasu jest logowany, a
OpenClaw kontynuuje; nie anuluje pracy sieciowej należącej do Plugin, chyba że
Plugin używa także własnego sygnału przerwania.

Używaj `model_call_started` i `model_call_ended` do telemetrii wywołań dostawcy,
która nie powinna otrzymywać surowych promptów, historii, odpowiedzi, nagłówków, treści żądań
ani identyfikatorów żądań dostawcy. Te hooki zawierają stabilne metadane, takie jak
`runId`, `callId`, `provider`, `model`, opcjonalne `api`/`transport`, terminalne
`durationMs`/`outcome` oraz `upstreamRequestIdHash`, gdy OpenClaw może wyprowadzić
ograniczony hash identyfikatora żądania dostawcy.

`before_agent_finalize` działa tylko wtedy, gdy harness ma zaakceptować naturalną
końcową odpowiedź asystenta. Nie jest to ścieżka anulowania `/stop` i nie
uruchamia się, gdy użytkownik przerywa turę. Zwróć `{ action: "revise", reason }`, aby poprosić
harness o jeszcze jeden przebieg modelu przed finalizacją, `{ action:
"finalize", reason? }`, aby wymusić finalizację, albo pomiń wynik, aby kontynuować.
Natywne hooki `Stop` Codex są przekazywane do tego hooka jako decyzje OpenClaw
`before_agent_finalize`.

Niewbudowane Plugin, które potrzebują `llm_input`, `llm_output`,
`before_agent_finalize` lub `agent_end`, muszą ustawić:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Hooki mutujące prompty i trwałe wstrzyknięcia następnej tury można wyłączyć dla każdego Plugin
za pomocą `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Rozszerzenia sesji i wstrzyknięcia następnej tury

Plugin przepływów pracy mogą utrwalać mały stan sesji zgodny z JSON za pomocą
`api.registerSessionExtension(...)` i aktualizować go przez metodę Gateway
`sessions.pluginPatch`. Wiersze sesji projektują zarejestrowany stan rozszerzenia
przez `pluginExtensions`, umożliwiając Control UI i innym klientom renderowanie
statusu należącego do Plugin bez poznawania wewnętrznych szczegółów Plugin.

Użyj `api.enqueueNextTurnInjection(...)`, gdy Plugin potrzebuje trwałego kontekstu, który ma
dotrzeć do następnej tury modelu dokładnie raz. OpenClaw opróżnia zakolejkowane wstrzyknięcia przed
hakami promptu, odrzuca wygasłe wstrzyknięcia i deduplikuje je według `idempotencyKey`
dla każdego Pluginu. To właściwy punkt integracji dla wznawiania zatwierdzeń, podsumowań zasad,
delt monitorów w tle i kontynuacji poleceń, które powinny być widoczne dla
modelu w następnej turze, ale nie powinny stać się trwałym tekstem promptu systemowego.

Semantyka czyszczenia jest częścią kontraktu. Czyszczenie rozszerzenia sesji i
wywołania zwrotne czyszczenia cyklu życia środowiska uruchomieniowego otrzymują `reset`, `delete`, `disable` lub
`restart`. Host usuwa trwały stan rozszerzenia sesji należący do danego Pluginu
oraz oczekujące wstrzyknięcia następnej tury dla reset/delete/disable; restart zachowuje
trwały stan sesji, a wywołania zwrotne czyszczenia pozwalają Pluginom zwolnić zadania
harmonogramu, kontekst uruchomieniowy i inne zasoby poza pasmem dla starej generacji
środowiska uruchomieniowego.

## Haki wiadomości

Używaj haków wiadomości do routingu na poziomie kanału i zasad dostarczania:

- `message_received`: obserwuj treści przychodzące, nadawcę, `threadId`, `messageId`,
  `senderId`, opcjonalną korelację uruchomienia/sesji oraz metadane.
- `message_sending`: przepisz `content` albo zwróć `{ cancel: true }`.
- `message_sent`: obserwuj końcowe powodzenie lub niepowodzenie.

W przypadku odpowiedzi TTS tylko audio `content` może zawierać ukrytą wypowiedzianą transkrypcję
nawet wtedy, gdy ładunek kanału nie ma widocznego tekstu/podpisu. Przepisanie tego
`content` aktualizuje tylko transkrypcję widoczną dla haka; nie jest ona renderowana jako
podpis multimediów.

Konteksty haków wiadomości ujawniają stabilne pola korelacji, gdy są dostępne:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` i `ctx.callDepth`. Preferuj
te pola pierwszej klasy przed odczytem starszych metadanych.

Preferuj typowane pola `threadId` i `replyToId` przed używaniem metadanych
specyficznych dla kanału.

Reguły decyzyjne:

- `message_sending` z `cancel: true` jest końcowe.
- `message_sending` z `cancel: false` jest traktowane jako brak decyzji.
- Przepisane `content` przechodzi dalej do haków o niższym priorytecie, chyba że późniejszy hak
  anuluje dostarczenie.

## Haki instalacji

`before_install` działa po wbudowanym skanowaniu instalacji Skills i Pluginów.
Zwróć dodatkowe ustalenia albo `{ block: true, blockReason }`, aby zatrzymać
instalację.

`block: true` jest końcowe. `block: false` jest traktowane jako brak decyzji.

## Cykl życia Gateway

Użyj `gateway_start` dla usług Pluginów, które potrzebują stanu należącego do Gateway. Kontekst
udostępnia `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` do inspekcji
i aktualizacji Cron. Użyj `gateway_stop`, aby wyczyścić długo działające
zasoby.

Nie polegaj na wewnętrznym haku `gateway:startup` dla usług środowiska uruchomieniowego
należących do Pluginu.

`cron_changed` uruchamia się dla zdarzeń cyklu życia Cron należących do gateway z typowanym
ładunkiem zdarzenia obejmującym powody `added`, `updated`, `removed`, `started`, `finished`
i `scheduled`. Zdarzenie niesie migawkę `PluginHookGatewayCronJob`
(w tym `state.nextRunAtMs`, `state.lastRunStatus` i
`state.lastError`, gdy występuje) oraz `PluginHookGatewayCronDeliveryStatus`
o wartości `not-requested` | `delivered` | `not-delivered` | `unknown`. Usunięte
zdarzenia nadal niosą migawkę usuniętego zadania, aby zewnętrzne harmonogramy mogły
uzgodnić stan. Używaj `ctx.getCron?.()` i `ctx.config` z kontekstu środowiska
uruchomieniowego podczas synchronizacji zewnętrznych harmonogramów wybudzania i utrzymuj OpenClaw jako
źródło prawdy dla sprawdzania terminów oraz wykonywania.

## Nadchodzące wycofania

Kilka powierzchni powiązanych z hakami jest wycofanych, ale nadal obsługiwanych. Zmigruj
przed następnym głównym wydaniem:

- **Koperty kanałów w postaci zwykłego tekstu** w handlerach `inbound_claim` i `message_received`.
  Odczytuj `BodyForAgent` oraz strukturalne bloki kontekstu użytkownika
  zamiast parsować płaski tekst koperty. Zobacz
  [Koperty kanałów w postaci zwykłego tekstu → BodyForAgent](/pl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** pozostaje dla zgodności. Nowe Pluginy powinny używać
  `before_model_resolve` i `before_prompt_build` zamiast połączonej
  fazy.
- **`onResolution` w `before_tool_call`** używa teraz typowanej unii
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) zamiast swobodnego `string`.

Pełna lista — rejestracja funkcji pamięci, profil myślenia dostawcy,
zewnętrzni dostawcy uwierzytelniania, typy wykrywania dostawców, akcesory środowiska
uruchomieniowego zadań oraz zmiana nazwy `command-auth` → `command-status` — znajduje się w
[Migracja Plugin SDK → Aktywne wycofania](/pl/plugins/sdk-migration#active-deprecations).

## Powiązane

- [Migracja Plugin SDK](/pl/plugins/sdk-migration) — aktywne wycofania i harmonogram usuwania
- [Budowanie Pluginów](/pl/plugins/building-plugins)
- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
- [Punkty wejścia Pluginów](/pl/plugins/sdk-entrypoints)
- [Wewnętrzne haki](/pl/automation/hooks)
- [Wewnętrzna architektura Pluginów](/pl/plugins/architecture-internals)
