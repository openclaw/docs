---
read_when:
    - Tworzysz plugin, który potrzebuje before_tool_call, before_agent_reply, haków wiadomości lub haków cyklu życia
    - Musisz blokować, przepisywać lub wymagać zatwierdzenia wywołań narzędzi z Pluginu
    - Decydujesz między wewnętrznymi punktami zaczepienia a punktami zaczepienia Plugin
summary: 'Hooki Plugin: przechwytują zdarzenia cyklu życia agenta, narzędzia, wiadomości, sesji i Gateway'
title: Hooki Pluginu
x-i18n:
    generated_at: "2026-05-10T19:45:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebdbb743441dfa9eba3d476171c1c8e9d9628d2669aeea0806ede19bafd61f62
    source_path: plugins/hooks.md
    workflow: 16
---

Hooki Plugin są punktami rozszerzeń działającymi w tym samym procesie dla pluginów OpenClaw. Używaj ich,
gdy plugin musi sprawdzać lub zmieniać uruchomienia agentów, wywołania narzędzi, przepływ wiadomości,
cykl życia sesji, routing podagentów, instalacje albo uruchamianie Gateway.

Zamiast tego użyj [wewnętrznych hooków](/pl/automation/hooks), gdy potrzebujesz małego
skryptu `HOOK.md` instalowanego przez operatora dla zdarzeń poleceń i Gateway, takich jak
`/new`, `/reset`, `/stop`, `agent:bootstrap` lub `gateway:startup`.

## Szybki start

Zarejestruj typowane hooki Plugin za pomocą `api.on(...)` z punktu wejścia pluginu:

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

Procedury obsługi hooków uruchamiają się sekwencyjnie, malejąco według `priority`. Hooki o tym samym priorytecie
zachowują kolejność rejestracji.

`api.on(name, handler, opts?)` akceptuje:

- `priority` - kolejność procedur obsługi (wyższa wartość uruchamia się pierwsza).
- `timeoutMs` - opcjonalny budżet dla pojedynczego hooka. Gdy jest ustawiony, runner hooków przerywa tę
  procedurę obsługi po upływie budżetu i przechodzi do następnej, zamiast
  pozwalać, by powolna konfiguracja lub odtwarzanie pamięci zużywały skonfigurowany przez wywołującego limit czasu modelu.
  Pomiń go, aby użyć domyślnego limitu czasu obserwacji/decyzji, który
  runner hooków stosuje ogólnie.

Operatorzy mogą też ustawiać budżety hooków bez modyfikowania kodu pluginu:

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

`hooks.timeouts.<hookName>` zastępuje `hooks.timeoutMs`, który zastępuje wartość
`api.on(..., { timeoutMs })` zdefiniowaną przez autora pluginu. Każda skonfigurowana wartość musi
być dodatnią liczbą całkowitą nie większą niż 600000 milisekund. Preferuj nadpisania dla konkretnych hooków
w przypadku znanych wolnych hooków, aby jeden plugin nie dostawał dłuższego budżetu
wszędzie.

Każdy hook otrzymuje `event.context.pluginConfig`, rozwiązaną konfigurację dla
pluginu, który zarejestrował tę procedurę obsługi. Używaj jej do decyzji hooków, które wymagają
bieżących opcji pluginu; OpenClaw wstrzykuje ją osobno dla każdej procedury obsługi bez mutowania
współdzielonego obiektu zdarzenia widzianego przez inne pluginy.

## Katalog hooków

Hooki są pogrupowane według powierzchni, które rozszerzają. Nazwy zapisane **pogrubieniem** akceptują
wynik decyzji (zablokowanie, anulowanie, nadpisanie albo wymaganie zatwierdzenia); wszystkie pozostałe służą
wyłącznie do obserwacji.

**Tura agenta**

- `before_model_resolve` - nadpisz dostawcę lub model przed załadowaniem wiadomości sesji
- `agent_turn_prepare` - użyj zakolejkowanych wstrzyknięć tur pluginu i dodaj kontekst w tej samej turze przed hookami promptu
- `before_prompt_build` - dodaj dynamiczny kontekst lub tekst promptu systemowego przed wywołaniem modelu
- `before_agent_start` - łączona faza wyłącznie dla zgodności; preferuj dwa powyższe hooki
- **`before_agent_run`** - sprawdź finalny prompt i wiadomości sesji przed wysłaniem do modelu oraz opcjonalnie zablokuj uruchomienie
- **`before_agent_reply`** - przerwij turę modelu syntetyczną odpowiedzią albo ciszą
- **`before_agent_finalize`** - sprawdź naturalną finalną odpowiedź i poproś o jeszcze jedno przejście modelu
- `agent_end` - obserwuj finalne wiadomości, stan powodzenia i czas trwania uruchomienia
- `heartbeat_prompt_contribution` - dodaj kontekst tylko dla Heartbeat dla pluginów monitorowania w tle i cyklu życia

**Obserwacja konwersacji**

- `model_call_started` / `model_call_ended` - obserwuj oczyszczone metadane wywołań dostawcy/modelu, czasy, wynik oraz ograniczone hashe identyfikatorów żądań bez treści promptu lub odpowiedzi
- `llm_input` - obserwuj dane wejściowe dostawcy (prompt systemowy, prompt, historię)
- `llm_output` - obserwuj dane wyjściowe dostawcy

**Narzędzia**

- **`before_tool_call`** - przepisz parametry narzędzia, zablokuj wykonanie albo wymagaj zatwierdzenia
- `after_tool_call` - obserwuj wyniki narzędzia, błędy i czas trwania
- **`tool_result_persist`** - przepisz wiadomość asystenta utworzoną z wyniku narzędzia
- **`before_message_write`** - sprawdź lub zablokuj trwający zapis wiadomości (rzadkie)

**Wiadomości i dostarczanie**

- **`inbound_claim`** - przejmij wiadomość przychodzącą przed routingiem agenta (odpowiedzi syntetyczne)
- `message_received` - obserwuj treść przychodzącą, nadawcę, wątek i metadane
- **`message_sending`** - przepisz treść wychodzącą albo anuluj dostarczanie
- `message_sent` - obserwuj powodzenie lub niepowodzenie dostarczenia wychodzącego
- **`before_dispatch`** - sprawdź lub przepisz wychodzącą wysyłkę przed przekazaniem do kanału
- **`reply_dispatch`** - uczestnicz w finalnym potoku wysyłki odpowiedzi

**Sesje i Compaction**

- `session_start` / `session_end` - śledź granice cyklu życia sesji
- `before_compaction` / `after_compaction` - obserwuj lub adnotuj cykle Compaction
- `before_reset` - obserwuj zdarzenia resetowania sesji (`/reset`, resetowania programowe)

**Podagenci**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - koordynuj routing podagentów i dostarczanie ukończenia

**Cykl życia**

- `gateway_start` / `gateway_stop` - uruchamiaj lub zatrzymuj usługi należące do pluginu razem z Gateway
- `cron_changed` - obserwuj zmiany cyklu życia cron należącego do gateway (dodane, zaktualizowane, usunięte, rozpoczęte, zakończone, zaplanowane)
- **`before_install`** - sprawdzaj skanowania instalacji Skills lub pluginów i opcjonalnie blokuj

## Zasady wywołań narzędzi

`before_tool_call` otrzymuje:

- `event.toolName`
- `event.params`
- opcjonalne `event.derivedPaths`, zawierające możliwie najlepsze wskazówki ścieżek docelowych wyprowadzone przez hosta
  dla dobrze znanych kopert narzędzi, takich jak `apply_patch`; gdy są obecne,
  ścieżki te mogą być niekompletne lub mogą nadmiernie przybliżać to, czego narzędzie
  faktycznie dotknie (na przykład przy zniekształconych lub częściowych danych wejściowych)
- opcjonalne `event.runId`
- opcjonalne `event.toolCallId`
- pola kontekstu, takie jak `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ustawiane w uruchomieniach sterowanych przez Cron) oraz diagnostyczne `ctx.trace`

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
- `params` przepisuje parametry narzędzia dla wykonania.
- `requireApproval` wstrzymuje uruchomienie agenta i prosi użytkownika przez zatwierdzenia pluginu.
  Polecenie `/approve` może zatwierdzać zarówno zatwierdzenia exec, jak i pluginu.
- `block: true` z niższym priorytetem nadal może zablokować po tym, jak hook
  o wyższym priorytecie zażądał zatwierdzenia.
- `onResolution` otrzymuje rozstrzygniętą decyzję zatwierdzenia - `allow-once`,
  `allow-always`, `deny`, `timeout` albo `cancelled`.

Dołączone pluginy, które potrzebują zasad na poziomie hosta, mogą rejestrować zaufane zasady narzędzi
za pomocą `api.registerTrustedToolPolicy(...)`. Uruchamiają się one przed zwykłymi
hookami `before_tool_call` i przed decyzjami zewnętrznych pluginów. Używaj ich tylko
dla zaufanych przez hosta bramek, takich jak zasady obszaru roboczego, egzekwowanie budżetu albo
bezpieczeństwo zarezerwowanych przepływów pracy. Zewnętrzne pluginy powinny używać zwykłych hooków
`before_tool_call`.

### Utrwalanie wyników narzędzi

Wyniki narzędzi mogą zawierać strukturalne `details` do renderowania UI, diagnostyki,
routingu multimediów albo metadanych należących do pluginu. Traktuj `details` jako metadane czasu wykonywania,
nie jako treść promptu:

- OpenClaw usuwa `toolResult.details` przed ponownym odtworzeniem u dostawcy i danymi wejściowymi Compaction,
  aby metadane nie stały się kontekstem modelu.
- Utrwalone wpisy sesji zachowują tylko ograniczone `details`. Zbyt duże szczegóły są
  zastępowane zwięzłym podsumowaniem i `persistedDetailsTruncated: true`.
- `tool_result_persist` i `before_message_write` uruchamiają się przed finalnym
  limitem utrwalania. Hooki nadal powinny utrzymywać zwracane `details` małe i unikać
  umieszczania tekstu istotnego dla promptu wyłącznie w `details`; widoczne dla modelu wyjście narzędzia
  umieszczaj w `content`.

## Hooki promptu i modelu

Dla nowych pluginów używaj hooków specyficznych dla faz:

- `before_model_resolve`: otrzymuje tylko bieżący prompt i metadane załączników.
  Zwróć `providerOverride` albo `modelOverride`.
- `agent_turn_prepare`: otrzymuje bieżący prompt, przygotowane wiadomości sesji
  oraz wszelkie dokładnie jednokrotne zakolejkowane wstrzyknięcia opróżnione dla tej sesji. Zwróć
  `prependContext` albo `appendContext`.
- `before_prompt_build`: otrzymuje bieżący prompt i wiadomości sesji.
  Zwróć `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` albo `appendSystemContext`.
- `heartbeat_prompt_contribution`: uruchamia się tylko dla tur Heartbeat i zwraca
  `prependContext` albo `appendContext`. Jest przeznaczony dla monitorów w tle,
  które muszą podsumować bieżący stan bez zmieniania tur inicjowanych przez użytkownika.

`before_agent_start` pozostaje dla zgodności. Preferuj jawne hooki powyżej,
aby twój plugin nie zależał od starszej łączonej fazy.

`before_agent_run` uruchamia się po skonstruowaniu promptu i przed jakimikolwiek danymi wejściowymi modelu,
w tym lokalnym ładowaniem obrazów dla promptu oraz obserwacją `llm_input`. Otrzymuje
bieżące dane wejściowe użytkownika jako `prompt`, a także załadowaną historię sesji w `messages`
i aktywny prompt systemowy. Zwróć `{ outcome: "block", reason, message? }`,
aby zatrzymać uruchomienie, zanim model będzie mógł odczytać prompt. `reason` jest wewnętrzne;
`message` jest zastąpieniem widocznym dla użytkownika. Jedyne obsługiwane wyniki to
`pass` i `block`; nieobsługiwane kształty decyzji kończą się bezpiecznym niepowodzeniem.

Gdy uruchomienie zostaje zablokowane, OpenClaw zapisuje tylko tekst zastępczy w
`message.content` oraz niewrażliwe metadane blokady, takie jak identyfikator blokującego pluginu
i znacznik czasu. Oryginalny tekst użytkownika nie jest zachowywany w transkrypcie ani przyszłym
kontekście. Wewnętrzne powody blokady są traktowane jako wrażliwe i wykluczane z
transkryptu, historii, emisji, logów i ładunków diagnostycznych. Obserwowalność
powinna używać oczyszczonych pól, takich jak identyfikator blokującego, wynik, znacznik czasu albo bezpieczna
kategoria.

`before_agent_start` i `agent_end` zawierają `event.runId`, gdy OpenClaw potrafi
zidentyfikować aktywne uruchomienie. Ta sama wartość jest też dostępna w `ctx.runId`.
Uruchomienia sterowane przez Cron udostępniają także `ctx.jobId` (identyfikator źródłowego zadania cron), aby
hooki pluginów mogły ograniczać metryki, skutki uboczne lub stan do konkretnego zaplanowanego
zadania.

Dla uruchomień pochodzących z kanału `ctx.messageProvider` jest powierzchnią dostawcy, taką jak
`discord` lub `telegram`, podczas gdy `ctx.channelId` jest identyfikatorem docelowej konwersacji,
gdy OpenClaw potrafi wyprowadzić go z klucza sesji lub metadanych dostarczenia.

`agent_end` jest hookiem obserwacyjnym i uruchamia się fire-and-forget po turze. Runner
hooków stosuje 30-sekundowy limit czasu, aby zablokowany plugin lub endpoint osadzeń
nie pozostawił obietnicy hooka oczekującej bez końca. Limit czasu jest logowany, a
OpenClaw kontynuuje; nie anuluje pracy sieciowej należącej do pluginu, chyba że
plugin używa także własnego sygnału przerwania.

Używaj `model_call_started` i `model_call_ended` dla telemetrii wywołań dostawcy,
która nie powinna otrzymywać surowych promptów, historii, odpowiedzi, nagłówków, treści
żądań ani identyfikatorów żądań dostawcy. Te hooki zawierają stabilne metadane, takie jak
`runId`, `callId`, `provider`, `model`, opcjonalne `api`/`transport`, terminalne
`durationMs`/`outcome` oraz `upstreamRequestIdHash`, gdy OpenClaw potrafi wyprowadzić
ograniczony hash identyfikatora żądania dostawcy.

`before_agent_finalize` działa tylko wtedy, gdy harness ma zaakceptować naturalną
końcową odpowiedź asystenta. Nie jest to ścieżka anulowania `/stop` i nie
uruchamia się, gdy użytkownik przerywa turę. Zwróć `{ action: "revise", reason }`, aby poprosić
harness o jeszcze jedno przejście modelu przed finalizacją, `{ action:
"finalize", reason? }`, aby wymusić finalizację, albo pomiń wynik, aby kontynuować.
Natywne hooki `Stop` Codex są przekazywane do tego hooka jako decyzje OpenClaw
`before_agent_finalize`.

Przy zwracaniu `action: "revise"` pluginy mogą uwzględnić metadane `retry`, aby
dodatkowe przejście modelu było ograniczone i bezpieczne do odtworzenia:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` jest dołączane do powodu rewizji wysyłanego do harness.
`idempotencyKey` pozwala hostowi zliczać ponowienia dla tego samego żądania pluginu w ramach
równoważnych decyzji finalizacji, a `maxAttempts` ogranicza liczbę dodatkowych przejść,
które host dopuści przed kontynuowaniem z naturalną końcową odpowiedzią.

Pluginy niedostarczane w pakiecie, które potrzebują surowych hooków konwersacji (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end` lub `before_agent_run`), muszą ustawić:

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

Hooki modyfikujące prompt i trwałe wstrzyknięcia na następną turę można wyłączyć dla każdego pluginu
za pomocą `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Rozszerzenia sesji i wstrzyknięcia na następną turę

Pluginy przepływu pracy mogą utrwalać niewielki stan sesji zgodny z JSON za pomocą
`api.registerSessionExtension(...)` i aktualizować go przez metodę Gateway
`sessions.pluginPatch`. Wiersze sesji udostępniają zarejestrowany stan rozszerzenia
przez `pluginExtensions`, pozwalając Control UI i innym klientom renderować
status należący do pluginu bez poznawania wewnętrznych szczegółów pluginu.

Użyj `api.enqueueNextTurnInjection(...)`, gdy plugin potrzebuje trwałego kontekstu, który
ma trafić do następnej tury modelu dokładnie raz. OpenClaw opróżnia zakolejkowane wstrzyknięcia przed
hookami promptu, odrzuca wygasłe wstrzyknięcia i deduplikuje według `idempotencyKey`
dla każdego pluginu. To właściwy punkt integracji dla wznowień po zatwierdzeniu, podsumowań zasad,
delt monitorów działających w tle i kontynuacji poleceń, które powinny być widoczne dla
modelu w następnej turze, ale nie powinny stać się trwałym tekstem promptu systemowego.

Semantyka czyszczenia jest częścią kontraktu. Czyszczenie rozszerzeń sesji i
callbacki czyszczenia cyklu życia runtime otrzymują `reset`, `delete`, `disable` albo
`restart`. Host usuwa trwały stan rozszerzenia sesji należący do danego pluginu
oraz oczekujące wstrzyknięcia na następną turę dla reset/delete/disable; restart zachowuje
trwały stan sesji, a callbacki czyszczenia pozwalają pluginom zwolnić zadania harmonogramu,
kontekst uruchomienia i inne zasoby poza głównym kanałem dla starej generacji runtime.

## Hooki wiadomości

Używaj hooków wiadomości do routingu na poziomie kanału i zasad dostarczania:

- `message_received`: obserwuje treść przychodzącą, nadawcę, `threadId`, `messageId`,
  `senderId`, opcjonalną korelację uruchomienia/sesji oraz metadane.
- `message_sending`: przepisuje `content` albo zwraca `{ cancel: true }`.
- `message_sent`: obserwuje końcowy sukces albo niepowodzenie.

W przypadku odpowiedzi TTS tylko audio `content` może zawierać ukryty mówiony transkrypt
nawet wtedy, gdy payload kanału nie ma widocznego tekstu/podpisu. Przepisanie tego
`content` aktualizuje tylko transkrypt widoczny dla hooka; nie jest renderowane jako
podpis multimediów.

Konteksty hooków wiadomości udostępniają stabilne pola korelacji, gdy są dostępne:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` i `ctx.callDepth`. Preferuj
te pola pierwszej klasy przed odczytywaniem starszych metadanych.

Preferuj typowane pola `threadId` i `replyToId` przed użyciem metadanych
specyficznych dla kanału.

Reguły decyzji:

- `message_sending` z `cancel: true` jest terminalne.
- `message_sending` z `cancel: false` jest traktowane jako brak decyzji.
- Przepisane `content` przechodzi dalej do hooków o niższym priorytecie, chyba że późniejszy hook
  anuluje dostarczenie.
- `message_sending` może zwrócić `cancelReason` i ograniczone `metadata` wraz z
  anulowaniem. Nowe API cyklu życia wiadomości eksponują to jako pominięty wynik dostarczenia
  z powodem `cancelled_by_message_sending_hook`; starsze bezpośrednie
  dostarczanie nadal zwraca pustą tablicę wyników dla zgodności.
- `message_sent` służy tylko do obserwacji. Niepowodzenia handlerów są logowane i nie
  zmieniają wyniku dostarczenia.

## Hooki instalacji

`before_install` uruchamia się po wbudowanym skanowaniu instalacji Skills i pluginów.
Zwróć dodatkowe znaleziska albo `{ block: true, blockReason }`, aby zatrzymać
instalację.

`block: true` jest terminalne. `block: false` jest traktowane jako brak decyzji.

## Cykl życia Gateway

Używaj `gateway_start` dla usług pluginów, które potrzebują stanu należącego do Gateway.
Kontekst udostępnia `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` do
inspekcji i aktualizacji cron. Używaj `gateway_stop`, aby czyścić długo działające
zasoby.

Nie polegaj na wewnętrznym hooku `gateway:startup` dla usług runtime należących do pluginu.

`cron_changed` uruchamia się dla zdarzeń cyklu życia cron należących do Gateway z typowanym
payloadem zdarzenia obejmującym powody `added`, `updated`, `removed`, `started`, `finished`
i `scheduled`. Zdarzenie przenosi migawkę `PluginHookGatewayCronJob`
(w tym `state.nextRunAtMs`, `state.lastRunStatus` oraz
`state.lastError`, gdy występuje) plus `PluginHookGatewayCronDeliveryStatus`
o wartości `not-requested` | `delivered` | `not-delivered` | `unknown`. Usunięte
zdarzenia nadal przenoszą migawkę usuniętego zadania, aby zewnętrzne harmonogramy mogły
uzgodnić stan. Używaj `ctx.getCron?.()` i `ctx.config` z kontekstu runtime
podczas synchronizacji zewnętrznych harmonogramów wybudzeń i zachowaj OpenClaw jako
źródło prawdy dla sprawdzania terminów i wykonania.

## Nadchodzące wycofania

Kilka powierzchni sąsiadujących z hookami jest przestarzałych, ale nadal obsługiwanych. Przeprowadź migrację
przed następnym wydaniem głównym:

- **Koperty kanałów w postaci zwykłego tekstu** w handlerach `inbound_claim` i `message_received`.
  Czytaj `BodyForAgent` oraz uporządkowane bloki kontekstu użytkownika
  zamiast parsować płaski tekst koperty. Zobacz
  [Koperty kanałów w postaci zwykłego tekstu → BodyForAgent](/pl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** pozostaje dla zgodności. Nowe pluginy powinny używać
  `before_model_resolve` i `before_prompt_build` zamiast połączonej
  fazy.
- **`onResolution` w `before_tool_call`** używa teraz typowanej
  unii `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) zamiast swobodnego `string`.

Pełną listę - rejestrację możliwości pamięci, profil myślenia providera,
zewnętrznych providerów uwierzytelniania, typy odkrywania providerów, akcesory runtime zadań
oraz zmianę nazwy `command-auth` → `command-status` - znajdziesz w
[Migracja Plugin SDK → Aktywne wycofania](/pl/plugins/sdk-migration#active-deprecations).

## Powiązane

- [Migracja Plugin SDK](/pl/plugins/sdk-migration) - aktywne wycofania i harmonogram usuwania
- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
- [Punkty wejścia pluginu](/pl/plugins/sdk-entrypoints)
- [Hooki wewnętrzne](/pl/automation/hooks)
- [Wewnętrzna architektura pluginów](/pl/plugins/architecture-internals)
