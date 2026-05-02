---
read_when:
    - Tworzysz Plugin, który potrzebuje before_tool_call, before_agent_reply, haków wiadomości lub haków cyklu życia
    - Musisz blokować, przepisywać lub wymagać zatwierdzenia wywołań narzędzi z Plugin
    - Wybierasz między wewnętrznymi hookami a hookami Plugin
summary: 'Hooki Plugin: przechwytuj zdarzenia cyklu życia agenta, narzędzia, wiadomości, sesji i Gateway'
title: Hooki Plugin
x-i18n:
    generated_at: "2026-05-02T09:57:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4efb07c6211debb5a7915d63678b1695946a91600c54d31faa0edf7025fbabf0
    source_path: plugins/hooks.md
    workflow: 16
---

Hooki Plugin są punktami rozszerzeń działającymi w procesie dla pluginów OpenClaw. Używaj ich,
gdy plugin musi sprawdzać lub zmieniać przebiegi agentów, wywołania narzędzi, przepływ wiadomości,
cykl życia sesji, routowanie subagentów, instalacje albo uruchamianie Gateway.

Zamiast tego użyj [hooków wewnętrznych](/pl/automation/hooks), gdy potrzebujesz małego,
instalowanego przez operatora skryptu `HOOK.md` dla zdarzeń komend i Gateway, takich jak
`/new`, `/reset`, `/stop`, `agent:bootstrap` lub `gateway:startup`.

## Szybki start

Rejestruj typowane hooki pluginu za pomocą `api.on(...)` z punktu wejścia pluginu:

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

Procedury obsługi hooków działają sekwencyjnie w malejącej kolejności `priority`. Hooki
o tym samym priorytecie zachowują kolejność rejestracji.

`api.on(name, handler, opts?)` przyjmuje:

- `priority` — kolejność procedur obsługi (wyższa wartość działa pierwsza).
- `timeoutMs` — opcjonalny limit czasu dla danego hooka. Gdy jest ustawiony, runner hooków przerywa tę
  procedurę obsługi po upływie limitu i przechodzi do następnej, zamiast
  pozwalać, aby wolna konfiguracja lub praca odtwarzania pamięci zużywała skonfigurowany przez wywołującego limit czasu modelu.
  Pomiń go, aby użyć domyślnego limitu czasu obserwacji/decyzji, który
  runner hooków stosuje ogólnie.

Każdy hook otrzymuje `event.context.pluginConfig`, rozwiązaną konfigurację
pluginu, który zarejestrował daną procedurę obsługi. Użyj jej do decyzji hooków, które wymagają
bieżących opcji pluginu; OpenClaw wstrzykuje ją dla każdej procedury obsługi bez mutowania
współdzielonego obiektu zdarzenia widzianego przez inne pluginy.

## Katalog hooków

Hooki są pogrupowane według powierzchni, którą rozszerzają. Nazwy oznaczone **pogrubieniem** akceptują
wynik decyzji (blokadę, anulowanie, nadpisanie lub żądanie zatwierdzenia); wszystkie pozostałe są
wyłącznie obserwacyjne.

**Tura agenta**

- `before_model_resolve` — nadpisz dostawcę lub model przed załadowaniem wiadomości sesji
- `agent_turn_prepare` — skonsumuj zakolejkowane wstrzyknięcia tur pluginu i dodaj kontekst tej samej tury przed hookami promptu
- `before_prompt_build` — dodaj dynamiczny kontekst lub tekst promptu systemowego przed wywołaniem modelu
- `before_agent_start` — połączona faza wyłącznie dla zgodności; preferuj dwa powyższe hooki
- **`before_agent_reply`** — przerwij turę modelu syntetyczną odpowiedzią lub ciszą
- **`before_agent_finalize`** — sprawdź naturalną odpowiedź końcową i zażądaj jeszcze jednego przebiegu modelu
- `agent_end` — obserwuj końcowe wiadomości, stan powodzenia i czas trwania przebiegu
- `heartbeat_prompt_contribution` — dodaj kontekst wyłącznie dla Heartbeat dla pluginów monitorowania w tle i cyklu życia

**Obserwacja konwersacji**

- `model_call_started` / `model_call_ended` — obserwuj oczyszczone metadane wywołania dostawcy/modelu, czas, wynik i ograniczone hashe identyfikatorów żądań bez treści promptu lub odpowiedzi
- `llm_input` — obserwuj wejście dostawcy (prompt systemowy, prompt, historia)
- `llm_output` — obserwuj wyjście dostawcy

**Narzędzia**

- **`before_tool_call`** — przepisz parametry narzędzia, zablokuj wykonanie albo zażądaj zatwierdzenia
- `after_tool_call` — obserwuj wyniki narzędzia, błędy i czas trwania
- **`tool_result_persist`** — przepisz wiadomość asystenta utworzoną z wyniku narzędzia
- **`before_message_write`** — sprawdź lub zablokuj trwający zapis wiadomości (rzadkie)

**Wiadomości i dostarczanie**

- **`inbound_claim`** — przejmij wiadomość przychodzącą przed routowaniem agenta (syntetyczne odpowiedzi)
- `message_received` — obserwuj przychodzącą treść, nadawcę, wątek i metadane
- **`message_sending`** — przepisz treść wychodzącą albo anuluj dostarczenie
- `message_sent` — obserwuj powodzenie lub niepowodzenie dostarczenia wiadomości wychodzącej
- **`before_dispatch`** — sprawdź lub przepisz wychodzące wysłanie przed przekazaniem do kanału
- **`reply_dispatch`** — uczestnicz w końcowym potoku wysyłania odpowiedzi

**Sesje i Compaction**

- `session_start` / `session_end` — śledź granice cyklu życia sesji
- `before_compaction` / `after_compaction` — obserwuj lub adnotuj cykle Compaction
- `before_reset` — obserwuj zdarzenia resetowania sesji (`/reset`, resetowania programowe)

**Subagenci**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — koordynuj routowanie subagentów i dostarczanie ukończenia

**Cykl życia**

- `gateway_start` / `gateway_stop` — uruchom lub zatrzymaj usługi należące do pluginu razem z Gateway
- `cron_changed` — obserwuj zmiany cyklu życia cron zarządzanego przez Gateway (dodano, zaktualizowano, usunięto, uruchomiono, zakończono, zaplanowano)
- **`before_install`** — sprawdź skany instalacji umiejętności lub pluginu i opcjonalnie zablokuj

## Polityka wywołań narzędzi

`before_tool_call` otrzymuje:

- `event.toolName`
- `event.params`
- opcjonalne `event.runId`
- opcjonalne `event.toolCallId`
- pola kontekstu, takie jak `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ustawiane w przebiegach sterowanych przez Cron) oraz diagnostyczne `ctx.trace`

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
- `requireApproval` wstrzymuje przebieg agenta i pyta użytkownika przez zatwierdzenia pluginów. Komenda `/approve` może zatwierdzać zarówno zatwierdzenia exec, jak i pluginów.
- `block: true` z niższym priorytetem nadal może zablokować po tym, jak hook o wyższym priorytecie
  zażądał zatwierdzenia.
- `onResolution` otrzymuje rozwiązaną decyzję zatwierdzenia — `allow-once`,
  `allow-always`, `deny`, `timeout` lub `cancelled`.

Wbudowane pluginy, które potrzebują polityki na poziomie hosta, mogą rejestrować zaufane polityki narzędzi
za pomocą `api.registerTrustedToolPolicy(...)`. Działają one przed zwykłymi
hookami `before_tool_call` i przed decyzjami pluginów zewnętrznych. Używaj ich tylko
dla bramek zaufanych przez hosta, takich jak polityka obszaru roboczego, egzekwowanie budżetu lub
bezpieczeństwo zastrzeżonych przepływów pracy. Pluginy zewnętrzne powinny używać zwykłych hooków `before_tool_call`.

### Utrwalanie wyników narzędzi

Wyniki narzędzi mogą zawierać strukturalne `details` do renderowania UI, diagnostyki,
routowania multimediów lub metadanych należących do pluginu. Traktuj `details` jako metadane wykonawcze,
a nie treść promptu:

- OpenClaw usuwa `toolResult.details` przed odtworzeniem dla dostawcy i wejściem Compaction,
  aby metadane nie stały się kontekstem modelu.
- Utrwalone wpisy sesji zachowują tylko ograniczone `details`. Nadmiernie duże szczegóły są
  zastępowane zwartym podsumowaniem i `persistedDetailsTruncated: true`.
- `tool_result_persist` i `before_message_write` działają przed końcowym
  limitem utrwalania. Hooki nadal powinny utrzymywać zwracane `details` małe i unikać
  umieszczania tekstu istotnego dla promptu wyłącznie w `details`; wyjście narzędzia widoczne dla modelu
  umieszczaj w `content`.

## Hooki promptów i modeli

Używaj hooków specyficznych dla fazy dla nowych pluginów:

- `before_model_resolve`: otrzymuje tylko bieżący prompt i metadane załączników.
  Zwróć `providerOverride` lub `modelOverride`.
- `agent_turn_prepare`: otrzymuje bieżący prompt, przygotowane wiadomości sesji
  oraz wszelkie dokładnie jednokrotne zakolejkowane wstrzyknięcia pobrane dla tej sesji. Zwróć
  `prependContext` lub `appendContext`.
- `before_prompt_build`: otrzymuje bieżący prompt i wiadomości sesji.
  Zwróć `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` lub `appendSystemContext`.
- `heartbeat_prompt_contribution`: działa tylko dla tur Heartbeat i zwraca
  `prependContext` lub `appendContext`. Jest przeznaczony dla monitorów w tle,
  które muszą podsumować bieżący stan bez zmieniania tur inicjowanych przez użytkownika.

`before_agent_start` pozostaje dla zgodności. Preferuj jawne hooki powyżej,
aby Twój plugin nie zależał od starszej połączonej fazy.

`before_agent_start` i `agent_end` zawierają `event.runId`, gdy OpenClaw może
zidentyfikować aktywny przebieg. Ta sama wartość jest również dostępna w `ctx.runId`.
Przebiegi sterowane przez Cron udostępniają także `ctx.jobId` (identyfikator źródłowego zadania cron), aby
hooki pluginów mogły ograniczać metryki, skutki uboczne lub stan do konkretnego zaplanowanego
zadania.

Dla przebiegów pochodzących z kanału `ctx.messageProvider` jest powierzchnią dostawcy, taką jak
`discord` lub `telegram`, natomiast `ctx.channelId` jest docelowym identyfikatorem konwersacji,
gdy OpenClaw może wyprowadzić go z klucza sesji lub metadanych dostarczania.

`agent_end` jest hookiem obserwacyjnym i działa w trybie fire-and-forget po turze. Runner
hooków stosuje limit czasu 30 sekund, aby zawieszony plugin lub endpoint osadzeń
nie mógł pozostawić obietnicy hooka oczekującej w nieskończoność. Limit czasu jest logowany, a
OpenClaw kontynuuje; nie anuluje pracy sieciowej należącej do pluginu, chyba że
plugin używa również własnego sygnału przerwania.

Używaj `model_call_started` i `model_call_ended` do telemetrii wywołań dostawcy,
która nie powinna otrzymywać surowych promptów, historii, odpowiedzi, nagłówków, treści żądań
ani identyfikatorów żądań dostawcy. Te hooki zawierają stabilne metadane, takie jak
`runId`, `callId`, `provider`, `model`, opcjonalne `api`/`transport`, końcowe
`durationMs`/`outcome` oraz `upstreamRequestIdHash`, gdy OpenClaw może wyprowadzić
ograniczony hash identyfikatora żądania dostawcy.

`before_agent_finalize` działa tylko wtedy, gdy harness ma zaakceptować naturalną
końcową odpowiedź asystenta. Nie jest to ścieżka anulowania `/stop` i nie
działa, gdy użytkownik przerywa turę. Zwróć `{ action: "revise", reason }`, aby poprosić
harness o jeszcze jeden przebieg modelu przed finalizacją, `{ action:
"finalize", reason? }`, aby wymusić finalizację, albo pomiń wynik, aby kontynuować.
Natywne hooki Codex `Stop` są przekazywane do tego hooka jako decyzje OpenClaw
`before_agent_finalize`.

Niewbudowane pluginy, które potrzebują `llm_input`, `llm_output`,
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

Hooki mutujące prompt i trwałe wstrzyknięcia następnej tury można wyłączyć dla każdego pluginu
za pomocą `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Rozszerzenia sesji i wstrzyknięcia następnej tury

Pluginy przepływów pracy mogą utrwalać mały, zgodny z JSON stan sesji za pomocą
`api.registerSessionExtension(...)` i aktualizować go przez metodę Gateway
`sessions.pluginPatch`. Wiersze sesji projektują zarejestrowany stan rozszerzenia
przez `pluginExtensions`, pozwalając Control UI i innym klientom renderować
status należący do pluginu bez poznawania wewnętrznych szczegółów pluginu.

Użyj `api.enqueueNextTurnInjection(...)`, gdy plugin potrzebuje trwałego kontekstu, który
dotrze do następnej tury modelu dokładnie raz. OpenClaw opróżnia zakolejkowane wstrzyknięcia przed
hookami promptu, odrzuca wygasłe wstrzyknięcia i deduplikuje według `idempotencyKey`
dla każdego pluginu. To właściwy punkt rozszerzeń dla wznowień zatwierdzeń, podsumowań polityk,
delt monitorów w tle i kontynuacji komend, które powinny być widoczne dla
modelu w następnej turze, ale nie powinny stać się stałym tekstem promptu systemowego.

Semantyka czyszczenia jest częścią kontraktu. Czyszczenie rozszerzeń sesji i
callbacki czyszczenia cyklu życia środowiska wykonawczego otrzymują `reset`, `delete`, `disable` lub
`restart`. Host usuwa trwały stan rozszerzenia sesji należący do danego pluginu
oraz oczekujące wstrzyknięcia następnej tury dla reset/delete/disable; restart zachowuje
trwały stan sesji, podczas gdy callbacki czyszczenia pozwalają pluginom zwolnić zadania harmonogramu,
kontekst przebiegu i inne zasoby poza pasmem dla starej generacji środowiska wykonawczego.

## Hooki wiadomości

Używaj hooków wiadomości do routowania na poziomie kanału i polityki dostarczania:

- `message_received`: obserwuj treść przychodzącą, nadawcę, `threadId`, `messageId`,
  `senderId`, opcjonalną korelację uruchomienia/sesji oraz metadane.
- `message_sending`: przepisz `content` albo zwróć `{ cancel: true }`.
- `message_sent`: obserwuj ostateczny sukces lub niepowodzenie.

W przypadku odpowiedzi TTS wyłącznie audio `content` może zawierać ukryty transkrypt mowy
nawet wtedy, gdy ładunek kanału nie ma widocznego tekstu/podpisu. Przepisanie tego
`content` aktualizuje tylko transkrypt widoczny dla hooka; nie jest on renderowany jako
podpis multimediów.

Konteksty hooków wiadomości udostępniają stabilne pola korelacji, gdy są dostępne:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` oraz `ctx.callDepth`. Preferuj
te pola pierwszej klasy przed odczytem starszych metadanych.

Preferuj typowane pola `threadId` i `replyToId` przed użyciem metadanych
specyficznych dla kanału.

Reguły decyzyjne:

- `message_sending` z `cancel: true` jest terminalne.
- `message_sending` z `cancel: false` jest traktowane jako brak decyzji.
- Przepisane `content` przechodzi dalej do hooków o niższym priorytecie, chyba że późniejszy hook
  anuluje dostarczenie.

## Hooki instalacji

`before_install` uruchamia się po wbudowanym skanowaniu instalacji Skills i pluginów.
Zwróć dodatkowe ustalenia albo `{ block: true, blockReason }`, aby zatrzymać
instalację.

`block: true` jest terminalne. `block: false` jest traktowane jako brak decyzji.

## Cykl życia Gateway

Użyj `gateway_start` dla usług pluginów, które potrzebują stanu należącego do Gateway. 
Kontekst udostępnia `ctx.config`, `ctx.workspaceDir` oraz `ctx.getCron?.()` do
inspekcji i aktualizacji cron. Użyj `gateway_stop`, aby wyczyścić długotrwałe
zasoby.

Nie polegaj na wewnętrznym hooku `gateway:startup` dla usług uruchomieniowych
należących do pluginów.

`cron_changed` uruchamia się dla zdarzeń cyklu życia cron należących do gatewaya z typowanym
ładunkiem zdarzenia obejmującym powody `added`, `updated`, `removed`, `started`, `finished`
oraz `scheduled`. Zdarzenie przenosi migawkę `PluginHookGatewayCronJob`
(w tym `state.nextRunAtMs`, `state.lastRunStatus` oraz
`state.lastError`, gdy są obecne) oraz `PluginHookGatewayCronDeliveryStatus`
o wartości `not-requested` | `delivered` | `not-delivered` | `unknown`. Zdarzenia usunięcia
nadal przenoszą migawkę usuniętego zadania, aby zewnętrzne harmonogramy mogły
uzgodnić stan. Używaj `ctx.getCron?.()` i `ctx.config` z kontekstu uruchomieniowego
podczas synchronizowania zewnętrznych harmonogramów wybudzania i utrzymuj OpenClaw jako
źródło prawdy dla sprawdzania terminów i wykonywania.

## Nadchodzące wycofania

Kilka powierzchni powiązanych z hookami jest przestarzałych, ale nadal obsługiwanych. Przeprowadź migrację
przed następnym wydaniem głównym:

- **Jawnotekstowe koperty kanałów** w handlerach `inbound_claim` i `message_received`.
  Odczytuj `BodyForAgent` oraz strukturalne bloki kontekstu użytkownika
  zamiast parsować płaski tekst koperty. Zobacz
  [Jawnotekstowe koperty kanałów → BodyForAgent](/pl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** pozostaje dostępne dla zgodności. Nowe pluginy powinny używać
  `before_model_resolve` i `before_prompt_build` zamiast połączonej
  fazy.
- **`onResolution` w `before_tool_call`** używa teraz typowanej
  unii `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) zamiast dowolnego `string`.

Pełną listę — rejestrację możliwości pamięci, profil rozumowania dostawcy,
zewnętrznych dostawców uwierzytelniania, typy wykrywania dostawców, akcesory środowiska uruchomieniowego zadań
oraz zmianę nazwy `command-auth` → `command-status` — znajdziesz w
[Migracja Plugin SDK → Aktywne wycofania](/pl/plugins/sdk-migration#active-deprecations).

## Powiązane

- [Migracja Plugin SDK](/pl/plugins/sdk-migration) — aktywne wycofania i harmonogram usunięcia
- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
- [Punkty wejścia pluginów](/pl/plugins/sdk-entrypoints)
- [Hooki wewnętrzne](/pl/automation/hooks)
- [Wewnętrzna architektura pluginów](/pl/plugins/architecture-internals)
