---
read_when:
    - Tworzysz Plugin, który wymaga before_tool_call, before_agent_reply, hooków wiadomości lub hooków cyklu życia
    - Musisz blokować, przepisywać lub wymagać zatwierdzenia wywołań narzędzi z wtyczki
    - Decydujesz między wewnętrznymi hookami a hookami Plugin
summary: 'Hooki Plugin: przechwytuj zdarzenia cyklu życia agenta, narzędzia, wiadomości, sesji i Gateway'
title: Hooki Plugin
x-i18n:
    generated_at: "2026-05-11T20:35:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

Hooki pluginów to punkty rozszerzeń działające w procesie dla pluginów OpenClaw. Używaj ich,
gdy plugin musi sprawdzać lub zmieniać uruchomienia agentów, wywołania narzędzi, przepływ wiadomości,
cykl życia sesji, routing subagentów, instalacje albo uruchamianie Gateway.

Zamiast tego użyj [hooków wewnętrznych](/pl/automation/hooks), gdy potrzebujesz małego,
instalowanego przez operatora skryptu `HOOK.md` dla zdarzeń poleceń i Gateway, takich jak
`/new`, `/reset`, `/stop`, `agent:bootstrap` albo `gateway:startup`.

## Szybki start

Rejestruj typowane hooki pluginów za pomocą `api.on(...)` z punktu wejścia pluginu:

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

Handlery hooków działają sekwencyjnie w malejącej kolejności `priority`. Hooki o tym samym priorytecie
zachowują kolejność rejestracji.

`api.on(name, handler, opts?)` przyjmuje:

- `priority` - kolejność handlerów (wyższa wartość działa wcześniej).
- `timeoutMs` - opcjonalny budżet dla pojedynczego hooka. Gdy jest ustawiony, runner hooków przerywa ten
  handler po upływie budżetu i przechodzi do następnego, zamiast pozwalać, aby powolna konfiguracja lub praca
  odtwarzania kontekstu zużywała skonfigurowany dla wywołującego timeout modelu. Pomiń go, aby użyć domyślnego
  timeoutu obserwacji/decyzji, który runner hooków stosuje ogólnie.

Operatorzy mogą też ustawiać budżety hooków bez łatania kodu pluginu:

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

`hooks.timeouts.<hookName>` nadpisuje `hooks.timeoutMs`, które nadpisuje wartość
`api.on(..., { timeoutMs })` zdefiniowaną przez autora pluginu. Każda skonfigurowana wartość musi
być dodatnią liczbą całkowitą nie większą niż 600000 milisekund. Preferuj nadpisania dla konkretnych hooków
w przypadku znanych wolnych hooków, aby jeden plugin nie dostawał dłuższego budżetu wszędzie.

Każdy hook otrzymuje `event.context.pluginConfig`, rozwiązaną konfigurację dla
pluginu, który zarejestrował ten handler. Używaj jej do decyzji hooków wymagających
bieżących opcji pluginu; OpenClaw wstrzykuje ją per handler bez mutowania
współdzielonego obiektu zdarzenia widzianego przez inne pluginy.

## Katalog hooków

Hooki są pogrupowane według powierzchni, którą rozszerzają. Nazwy zapisane **pogrubieniem** akceptują
wynik decyzyjny (blokadę, anulowanie, nadpisanie albo wymaganie zatwierdzenia); wszystkie pozostałe
służą wyłącznie do obserwacji.

**Tura agenta**

- `before_model_resolve` - nadpisz dostawcę lub model, zanim wiadomości sesji zostaną załadowane
- `agent_turn_prepare` - zużyj zakolejkowane wstrzyknięcia tur pluginu i dodaj kontekst tej samej tury przed hookami promptu
- `before_prompt_build` - dodaj dynamiczny kontekst lub tekst promptu systemowego przed wywołaniem modelu
- `before_agent_start` - połączona faza wyłącznie dla zgodności; preferuj dwa hooki powyżej
- **`before_agent_run`** - sprawdź finalny prompt i wiadomości sesji przed wysłaniem do modelu oraz opcjonalnie zablokuj uruchomienie
- **`before_agent_reply`** - przerwij turę modelu syntetyczną odpowiedzią albo ciszą
- **`before_agent_finalize`** - sprawdź naturalną odpowiedź finalną i zażądaj jeszcze jednego przebiegu modelu
- `agent_end` - obserwuj finalne wiadomości, stan powodzenia i czas trwania uruchomienia
- `heartbeat_prompt_contribution` - dodaj kontekst tylko dla Heartbeat na potrzeby pluginów monitorów w tle i cyklu życia

**Obserwacja rozmowy**

- `model_call_started` / `model_call_ended` - obserwuj oczyszczone metadane wywołania dostawcy/modelu, timing, wynik oraz ograniczone hashe identyfikatorów żądań bez treści promptu ani odpowiedzi
- `llm_input` - obserwuj wejście dostawcy (prompt systemowy, prompt, historia)
- `llm_output` - obserwuj wyjście dostawcy

**Narzędzia**

- **`before_tool_call`** - przepisz parametry narzędzia, zablokuj wykonanie albo wymagaj zatwierdzenia
- `after_tool_call` - obserwuj wyniki narzędzi, błędy i czas trwania
- **`tool_result_persist`** - przepisz wiadomość asystenta utworzoną z wyniku narzędzia
- **`before_message_write`** - sprawdź albo zablokuj trwający zapis wiadomości (rzadkie)

**Wiadomości i dostarczanie**

- **`inbound_claim`** - przejmij wiadomość przychodzącą przed routingiem agenta (syntetyczne odpowiedzi)
- `message_received` - obserwuj treść przychodzącą, nadawcę, wątek i metadane
- **`message_sending`** - przepisz treść wychodzącą albo anuluj dostarczenie
- `message_sent` - obserwuj powodzenie lub niepowodzenie dostarczenia wychodzącego
- **`before_dispatch`** - sprawdź albo przepisz wychodzącą dyspozycję przed przekazaniem do kanału
- **`reply_dispatch`** - uczestnicz w finalnym potoku dyspozycji odpowiedzi

**Sesje i Compaction**

- `session_start` / `session_end` - śledź granice cyklu życia sesji. `reason` zdarzenia to jedna z wartości: `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` albo `unknown`. Wartości `shutdown` i `restart` są emitowane z finalizatora zamykania gateway, gdy proces jest zatrzymywany lub restartowany, a sesje nadal są aktywne, dzięki czemu pluginy niżej w potoku (takie jak magazyny pamięci lub transkryptów) mogą domknąć osierocone wiersze, które inaczej pozostałyby w stanie otwartym między restartami. Finalizator jest ograniczony czasowo, więc powolny plugin nie może blokować SIGTERM/SIGINT.
- `before_compaction` / `after_compaction` - obserwuj albo adnotuj cykle Compaction
- `before_reset` - obserwuj zdarzenia resetowania sesji (`/reset`, resetowania programowe)

**Subagenty**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - koordynuj routing subagentów i dostarczanie zakończenia

**Cykl życia**

- `gateway_start` / `gateway_stop` - uruchamiaj albo zatrzymuj usługi należące do pluginu razem z Gateway
- `cron_changed` - obserwuj zmiany cyklu życia Cron należącego do gateway (dodane, zaktualizowane, usunięte, rozpoczęte, zakończone, zaplanowane)
- **`before_install`** - sprawdź skany instalacji Skills lub pluginów i opcjonalnie zablokuj

## Polityka wywołań narzędzi

`before_tool_call` otrzymuje:

- `event.toolName`
- `event.params`
- opcjonalne `event.derivedPaths`, zawierające ustalone best-effort po stronie hosta wskazówki ścieżek docelowych
  dla dobrze znanych kopert narzędzi, takich jak `apply_patch`; gdy są obecne,
  te ścieżki mogą być niekompletne albo mogą zawyżać zakres tego, czego narzędzie
  faktycznie dotknie (na przykład przy zniekształconych lub częściowych danych wejściowych)
- opcjonalne `event.runId`
- opcjonalne `event.toolCallId`
- pola kontekstu takie jak `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ustawiane w uruchomieniach wyzwalanych przez Cron) oraz diagnostyczne `ctx.trace`

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

Zasady:

- `block: true` jest terminalne i pomija handlery o niższym priorytecie.
- `block: false` jest traktowane jak brak decyzji.
- `params` przepisuje parametry narzędzia do wykonania.
- `requireApproval` wstrzymuje uruchomienie agenta i prosi użytkownika przez zatwierdzenia pluginów.
  Polecenie `/approve` może zatwierdzać zarówno zatwierdzenia exec, jak i pluginów.
- `block: true` o niższym priorytecie nadal może zablokować po tym, jak hook o wyższym priorytecie
  zażądał zatwierdzenia.
- `onResolution` otrzymuje rozstrzygniętą decyzję zatwierdzenia - `allow-once`,
  `allow-always`, `deny`, `timeout` albo `cancelled`.

Wbudowane pluginy, które potrzebują polityki na poziomie hosta, mogą rejestrować zaufane polityki narzędzi
za pomocą `api.registerTrustedToolPolicy(...)`. Działają one przed zwykłymi hookami
`before_tool_call` i przed decyzjami zewnętrznych pluginów. Używaj ich tylko
dla bramek zaufanych przez hosta, takich jak polityka workspace, egzekwowanie budżetu albo
bezpieczeństwo zastrzeżonych workflow. Zewnętrzne pluginy powinny używać zwykłych hooków `before_tool_call`.

### Utrwalanie wyników narzędzi

Wyniki narzędzi mogą zawierać strukturalne `details` na potrzeby renderowania UI, diagnostyki,
routingu mediów albo metadanych należących do pluginu. Traktuj `details` jako metadane runtime,
a nie treść promptu:

- OpenClaw usuwa `toolResult.details` przed ponownym odtworzeniem u dostawcy i wejściem Compaction,
  aby metadane nie stały się kontekstem modelu.
- Utrwalone wpisy sesji zachowują tylko ograniczone `details`. Zbyt duże details są
  zastępowane kompaktowym podsumowaniem i `persistedDetailsTruncated: true`.
- `tool_result_persist` i `before_message_write` działają przed finalnym limitem
  utrwalania. Hooki powinny mimo to utrzymywać zwracane `details` małe i unikać
  umieszczania tekstu istotnego dla promptu wyłącznie w `details`; widoczne dla modelu wyjście narzędzia
  umieszczaj w `content`.

## Hooki promptu i modelu

Dla nowych pluginów używaj hooków specyficznych dla faz:

- `before_model_resolve`: otrzymuje tylko bieżący prompt i metadane załączników.
  Zwróć `providerOverride` albo `modelOverride`.
- `agent_turn_prepare`: otrzymuje bieżący prompt, przygotowane wiadomości sesji
  oraz wszelkie dokładnie-jeden-raz zakolejkowane wstrzyknięcia opróżnione dla tej sesji. Zwróć
  `prependContext` albo `appendContext`.
- `before_prompt_build`: otrzymuje bieżący prompt i wiadomości sesji.
  Zwróć `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` albo `appendSystemContext`.
- `heartbeat_prompt_contribution`: działa tylko dla tur Heartbeat i zwraca
  `prependContext` albo `appendContext`. Jest przeznaczony dla monitorów w tle,
  które muszą podsumować bieżący stan bez zmieniania tur zainicjowanych przez użytkownika.

`before_agent_start` pozostaje dla zgodności. Preferuj jawne hooki powyżej,
aby plugin nie zależał od starszej połączonej fazy.

`before_agent_run` działa po zbudowaniu promptu i przed jakimkolwiek wejściem modelu,
w tym przed lokalnym dla promptu ładowaniem obrazów i obserwacją `llm_input`. Otrzymuje
bieżące wejście użytkownika jako `prompt`, a także załadowaną historię sesji w `messages`
i aktywny prompt systemowy. Zwróć `{ outcome: "block", reason, message? }`,
aby zatrzymać uruchomienie, zanim model będzie mógł odczytać prompt. `reason` jest wewnętrzne;
`message` to zastąpienie widoczne dla użytkownika. Jedynymi obsługiwanymi wynikami są
`pass` i `block`; nieobsługiwane kształty decyzji kończą się bezpiecznym niepowodzeniem.

Gdy uruchomienie jest zablokowane, OpenClaw zapisuje tylko tekst zastępczy w
`message.content` oraz niewrażliwe metadane blokady, takie jak identyfikator blokującego pluginu
i znacznik czasu. Oryginalny tekst użytkownika nie jest zachowywany w transkrypcie ani przyszłym
kontekście. Wewnętrzne powody blokady są traktowane jako wrażliwe i wykluczane z
ładunków transkryptu, historii, broadcastu, logów i diagnostyki. Obserwowalność
powinna używać oczyszczonych pól, takich jak identyfikator blokującego, wynik, znacznik czasu albo bezpieczna
kategoria.

`before_agent_start` i `agent_end` zawierają `event.runId`, gdy OpenClaw może
zidentyfikować aktywne uruchomienie. Ta sama wartość jest też dostępna w `ctx.runId`.
Uruchomienia wyzwalane przez Cron eksponują również `ctx.jobId` (identyfikator źródłowego zadania cron), aby
hooki pluginów mogły zawężać metryki, skutki uboczne albo stan do konkretnego zaplanowanego
zadania.

W przypadku uruchomień pochodzących z kanału `ctx.messageProvider` jest powierzchnią dostawcy, taką jak
`discord` albo `telegram`, natomiast `ctx.channelId` jest identyfikatorem docelowej rozmowy,
gdy OpenClaw może go wyprowadzić z klucza sesji albo metadanych dostarczenia.

`agent_end` jest hookiem obserwacyjnym i działa fire-and-forget po turze. Runner
hooków stosuje timeout 30 sekund, aby zawieszony plugin lub endpoint embeddingów
nie mógł pozostawić obietnicy hooka w stanie oczekiwania na zawsze. Timeout jest logowany, a
OpenClaw kontynuuje; nie anuluje pracy sieciowej należącej do pluginu, chyba że
plugin używa także własnego sygnału przerwania.

Używaj `model_call_started` i `model_call_ended` do telemetrii wywołań dostawcy,
która nie powinna otrzymywać surowych promptów, historii, odpowiedzi, nagłówków,
treści żądań ani identyfikatorów żądań dostawcy. Te hooki obejmują stabilne metadane, takie jak
`runId`, `callId`, `provider`, `model`, opcjonalne `api`/`transport`, końcowe
`durationMs`/`outcome` oraz `upstreamRequestIdHash`, gdy OpenClaw może wyprowadzić
ograniczony hash identyfikatora żądania dostawcy.

`before_agent_finalize` uruchamia się tylko wtedy, gdy harness ma zaakceptować naturalną
końcową odpowiedź asystenta. Nie jest to ścieżka anulowania `/stop` i nie uruchamia się,
gdy użytkownik przerywa turę. Zwróć `{ action: "revise", reason }`, aby poprosić
harness o jeszcze jedno przejście modelu przed finalizacją, `{ action:
"finalize", reason? }`, aby wymusić finalizację, albo pomiń wynik, aby kontynuować.
Natywne hooki `Stop` Codex są przekazywane do tego hooka jako decyzje OpenClaw
`before_agent_finalize`.

Przy zwracaniu `action: "revise"` pluginy mogą dołączyć metadane `retry`, aby
dodatkowe przejście modelu było ograniczone i bezpieczne do ponownego odtworzenia:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` jest dołączane do powodu rewizji wysyłanego do harness.
`idempotencyKey` pozwala hostowi zliczać ponowienia dla tego samego żądania pluginu w ramach
równoważnych decyzji finalizacji, a `maxAttempts` ogranicza liczbę dodatkowych przejść, na które
host pozwoli przed kontynuowaniem z naturalną końcową odpowiedzią.

Pluginy spoza pakietu, które potrzebują hooków surowej konwersacji (`before_model_resolve`,
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

Hooki modyfikujące prompty i trwałe wstrzyknięcia do następnej tury można wyłączyć dla danego pluginu
za pomocą `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Rozszerzenia sesji i wstrzyknięcia do następnej tury

Pluginy przepływów pracy mogą utrwalać mały, zgodny z JSON stan sesji za pomocą
`api.registerSessionExtension(...)` i aktualizować go przez metodę Gateway
`sessions.pluginPatch`. Wiersze sesji eksponują zarejestrowany stan rozszerzeń
przez `pluginExtensions`, umożliwiając Control UI i innym klientom renderowanie
statusu należącego do pluginu bez poznawania jego szczegółów wewnętrznych.

Używaj `api.enqueueNextTurnInjection(...)`, gdy plugin potrzebuje trwałego kontekstu,
który ma dotrzeć dokładnie raz do następnej tury modelu. OpenClaw opróżnia zakolejkowane wstrzyknięcia przed
hookami promptów, odrzuca wygasłe wstrzyknięcia i deduplikuje według `idempotencyKey`
dla każdego pluginu. To właściwy punkt rozszerzenia dla wznowień zatwierdzeń, podsumowań polityk,
delt monitorów w tle i kontynuacji poleceń, które powinny być widoczne dla
modelu w następnej turze, ale nie powinny stać się trwałym tekstem promptu systemowego.

Semantyka czyszczenia jest częścią kontraktu. Wywołania zwrotne czyszczenia rozszerzeń sesji i
czyszczenia cyklu życia runtime otrzymują `reset`, `delete`, `disable` lub
`restart`. Host usuwa trwały stan rozszerzenia sesji należący do danego pluginu
oraz oczekujące wstrzyknięcia do następnej tury dla reset/delete/disable; restart zachowuje
trwały stan sesji, a wywołania zwrotne czyszczenia pozwalają pluginom zwolnić zadania
harmonogramu, kontekst uruchomienia i inne zasoby poza pasmem dla starej generacji
runtime.

## Hooki wiadomości

Używaj hooków wiadomości do routingu na poziomie kanału i polityki dostarczania:

- `message_received`: obserwuj treść przychodzącą, nadawcę, `threadId`, `messageId`,
  `senderId`, opcjonalną korelację uruchomienia/sesji oraz metadane.
- `message_sending`: przepisz `content` albo zwróć `{ cancel: true }`.
- `message_sent`: obserwuj końcowy sukces lub niepowodzenie.

W przypadku odpowiedzi TTS tylko z dźwiękiem `content` może zawierać ukryty mówiony transkrypt
nawet wtedy, gdy ładunek kanału nie ma widocznego tekstu/podpisu. Przepisanie tego
`content` aktualizuje tylko transkrypt widoczny dla hooka; nie jest renderowane jako
podpis multimediów.

Konteksty hooków wiadomości eksponują stabilne pola korelacji, gdy są dostępne:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` oraz `ctx.callDepth`. Preferuj
te pola pierwszej klasy przed odczytywaniem starszych metadanych.

Preferuj typowane pola `threadId` i `replyToId` przed używaniem metadanych specyficznych
dla kanału.

Reguły decyzji:

- `message_sending` z `cancel: true` jest terminalne.
- `message_sending` z `cancel: false` jest traktowane jako brak decyzji.
- Przepisane `content` przechodzi dalej do hooków o niższym priorytecie, chyba że późniejszy hook
  anuluje dostarczenie.
- `message_sending` może zwrócić `cancelReason` oraz ograniczone `metadata` wraz z
  anulowaniem. Nowe API cyklu życia wiadomości eksponują to jako wyciszony wynik dostarczenia
  z powodem `cancelled_by_message_sending_hook`; starsze bezpośrednie
  dostarczanie nadal zwraca pustą tablicę wyników dla kompatybilności.
- `message_sent` służy wyłącznie do obserwacji. Błędy handlerów są logowane i nie
  zmieniają wyniku dostarczenia.

## Hooki instalacji

`before_install` uruchamia się po wbudowanym skanowaniu instalacji Skills i pluginów.
Zwróć dodatkowe ustalenia albo `{ block: true, blockReason }`, aby zatrzymać
instalację.

`block: true` jest terminalne. `block: false` jest traktowane jako brak decyzji.

## Cykl życia Gateway

Używaj `gateway_start` dla usług pluginów, które potrzebują stanu należącego do Gateway.
Kontekst eksponuje `ctx.config`, `ctx.workspaceDir` oraz `ctx.getCron?.()` do
inspekcji i aktualizacji Cron. Używaj `gateway_stop` do czyszczenia długo działających
zasobów.

Nie polegaj na wewnętrznym hooku `gateway:startup` dla usług runtime należących do pluginu.

`cron_changed` wyzwala się dla zdarzeń cyklu życia cron należących do Gateway z typowanym
ładunkiem zdarzenia obejmującym powody `added`, `updated`, `removed`, `started`, `finished`
oraz `scheduled`. Zdarzenie niesie migawkę `PluginHookGatewayCronJob`
(w tym `state.nextRunAtMs`, `state.lastRunStatus` i `state.lastError`, gdy są obecne)
oraz `PluginHookGatewayCronDeliveryStatus`
`not-requested` | `delivered` | `not-delivered` | `unknown`. Zdarzenia usunięcia
nadal niosą migawkę usuniętego zadania, aby zewnętrzne harmonogramy mogły
uzgodnić stan. Używaj `ctx.getCron?.()` i `ctx.config` z kontekstu runtime
podczas synchronizowania zewnętrznych harmonogramów wybudzeń i utrzymuj OpenClaw jako
źródło prawdy dla sprawdzania terminów i wykonania.

## Nadchodzące wycofania

Kilka powierzchni powiązanych z hookami jest przestarzałych, ale nadal obsługiwanych. Zmigruj
przed następnym wydaniem głównym:

- **Koperty kanałów w tekście jawnym** w handlerach `inbound_claim` i `message_received`.
  Czytaj `BodyForAgent` oraz ustrukturyzowane bloki kontekstu użytkownika
  zamiast parsować płaski tekst koperty. Zobacz
  [Koperty kanałów w tekście jawnym → BodyForAgent](/pl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** pozostaje dla kompatybilności. Nowe pluginy powinny używać
  `before_model_resolve` i `before_prompt_build` zamiast połączonej
  fazy.
- **`onResolution` w `before_tool_call`** używa teraz typowanej
  unii `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) zamiast swobodnego `string`.

Pełna lista - rejestracja możliwości pamięci, profil myślenia dostawcy,
zewnętrzni dostawcy uwierzytelniania, typy odkrywania dostawców, akcesory runtime zadań
oraz zmiana nazwy `command-auth` → `command-status` - znajduje się w
[Migracja Plugin SDK → Aktywne wycofania](/pl/plugins/sdk-migration#active-deprecations).

## Powiązane

- [Migracja Plugin SDK](/pl/plugins/sdk-migration) - aktywne wycofania i harmonogram usunięcia
- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
- [Punkty wejścia pluginów](/pl/plugins/sdk-entrypoints)
- [Hooki wewnętrzne](/pl/automation/hooks)
- [Wewnętrzne szczegóły architektury pluginów](/pl/plugins/architecture-internals)
