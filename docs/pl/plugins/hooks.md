---
read_when:
    - Tworzysz Plugin, który wymaga before_tool_call, before_agent_reply, hooków wiadomości lub hooków cyklu życia
    - Musisz blokować, przepisywać lub wymagać zatwierdzenia wywołań narzędzi z Plugin
    - Decydujesz między hookami wewnętrznymi a hookami Plugin
summary: 'Hooki Plugin: przechwytuj zdarzenia cyklu życia agenta, narzędzia, wiadomości, sesji i Gateway'
title: Hooki Plugin
x-i18n:
    generated_at: "2026-05-04T18:23:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37c7273036463c87e478db5678822b676c89447caee65f2f3f47a45194d1e37b
    source_path: plugins/hooks.md
    workflow: 16
---

Hooki pluginów są działającymi w procesie punktami rozszerzeń dla pluginów OpenClaw. Używaj ich,
gdy plugin musi sprawdzać lub zmieniać uruchomienia agentów, wywołania narzędzi, przepływ wiadomości,
cykl życia sesji, routowanie subagentów, instalacje albo uruchamianie Gateway.

Zamiast tego użyj [hooków wewnętrznych](/pl/automation/hooks), gdy chcesz mieć mały
instalowany przez operatora skrypt `HOOK.md` dla zdarzeń poleceń i Gateway, takich jak
`/new`, `/reset`, `/stop`, `agent:bootstrap` albo `gateway:startup`.

## Szybki start

Zarejestruj typowane hooki pluginów za pomocą `api.on(...)` z punktu wejścia pluginu:

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

- `priority` — kolejność procedur obsługi (wyższa wartość działa wcześniej).
- `timeoutMs` — opcjonalny budżet na hook. Po ustawieniu runner hooków przerywa tę
  procedurę obsługi po upływie budżetu i przechodzi do następnej, zamiast
  pozwalać, aby powolna konfiguracja lub przywoływanie danych zużyły skonfigurowany przez wywołującego
  limit czasu modelu. Pomiń tę opcję, aby użyć domyślnego limitu czasu obserwacji/decyzji, który
  runner hooków stosuje ogólnie.

Operatorzy mogą też ustawiać budżety hooków bez poprawiania kodu pluginu:

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

`hooks.timeouts.<hookName>` zastępuje `hooks.timeoutMs`, które zastępuje wartość
`api.on(..., { timeoutMs })` zdefiniowaną przez autora pluginu. Każda skonfigurowana wartość musi
być dodatnią liczbą całkowitą nie większą niż 600000 milisekund. Preferuj nadpisania dla konkretnych hooków
w przypadku znanych wolnych hooków, aby jeden plugin nie dostawał dłuższego budżetu
wszędzie.

Każdy hook otrzymuje `event.context.pluginConfig`, rozwiązaną konfigurację dla
pluginu, który zarejestrował daną procedurę obsługi. Używaj jej przy decyzjach hooków, które wymagają
bieżących opcji pluginu; OpenClaw wstrzykuje ją dla każdej procedury obsługi bez mutowania
wspólnego obiektu zdarzenia widzianego przez inne pluginy.

## Katalog hooków

Hooki są pogrupowane według powierzchni, którą rozszerzają. Nazwy pogrubione akceptują
wynik decyzyjny (zablokowanie, anulowanie, nadpisanie lub wymaganie zatwierdzenia); wszystkie pozostałe są
wyłącznie obserwacyjne.

**Tura agenta**

- `before_model_resolve` — nadpisuje dostawcę lub model przed załadowaniem wiadomości sesji
- `agent_turn_prepare` — wykorzystuje zakolejkowane wstrzyknięcia tur pluginów i dodaje kontekst tej samej tury przed hookami promptu
- `before_prompt_build` — dodaje dynamiczny kontekst lub tekst promptu systemowego przed wywołaniem modelu
- `before_agent_start` — połączona faza tylko dla zgodności; preferuj dwa powyższe hooki
- **`before_agent_reply`** — skraca turę modelu za pomocą syntetycznej odpowiedzi albo ciszy
- **`before_agent_finalize`** — sprawdza naturalną odpowiedź końcową i żąda jeszcze jednego przebiegu modelu
- `agent_end` — obserwuje wiadomości końcowe, stan powodzenia i czas trwania uruchomienia
- `heartbeat_prompt_contribution` — dodaje kontekst tylko dla Heartbeat dla monitorów w tle i pluginów cyklu życia

**Obserwacja konwersacji**

- `model_call_started` / `model_call_ended` — obserwuje oczyszczone metadane wywołania dostawcy/modelu, czas, wynik oraz ograniczone skróty identyfikatorów żądań bez treści promptu ani odpowiedzi
- `llm_input` — obserwuje wejście dostawcy (prompt systemowy, prompt, historię)
- `llm_output` — obserwuje wyjście dostawcy

**Narzędzia**

- **`before_tool_call`** — przepisuje parametry narzędzia, blokuje wykonanie albo wymaga zatwierdzenia
- `after_tool_call` — obserwuje wyniki narzędzi, błędy i czas trwania
- **`tool_result_persist`** — przepisuje wiadomość asystenta utworzoną z wyniku narzędzia
- **`before_message_write`** — sprawdza lub blokuje trwający zapis wiadomości (rzadkie)

**Wiadomości i dostarczanie**

- **`inbound_claim`** — przejmuje wiadomość przychodzącą przed routowaniem agenta (odpowiedzi syntetyczne)
- `message_received` — obserwuje treść przychodzącą, nadawcę, wątek i metadane
- **`message_sending`** — przepisuje treść wychodzącą albo anuluje dostarczenie
- `message_sent` — obserwuje powodzenie lub niepowodzenie dostarczenia wychodzącego
- **`before_dispatch`** — sprawdza lub przepisuje wychodzące wysłanie przed przekazaniem do kanału
- **`reply_dispatch`** — uczestniczy w końcowym potoku wysyłania odpowiedzi

**Sesje i Compaction**

- `session_start` / `session_end` — śledzi granice cyklu życia sesji
- `before_compaction` / `after_compaction` — obserwuje albo opisuje cykle Compaction
- `before_reset` — obserwuje zdarzenia resetowania sesji (`/reset`, resetowania programowe)

**Subagenci**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — koordynuje routowanie subagentów i dostarczanie ukończenia

**Cykl życia**

- `gateway_start` / `gateway_stop` — uruchamia lub zatrzymuje usługi należące do pluginu razem z Gateway
- `cron_changed` — obserwuje zmiany cyklu życia cron zarządzanego przez gateway (dodane, zaktualizowane, usunięte, uruchomione, zakończone, zaplanowane)
- **`before_install`** — sprawdza skany instalacji Skills lub pluginów i opcjonalnie blokuje

## Zasady wywołań narzędzi

`before_tool_call` otrzymuje:

- `event.toolName`
- `event.params`
- opcjonalne `event.runId`
- opcjonalne `event.toolCallId`
- pola kontekstu, takie jak `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ustawiane przy uruchomieniach wywoływanych przez cron) oraz diagnostyczne `ctx.trace`

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

- `block: true` jest terminalne i pomija procedury obsługi o niższym priorytecie.
- `block: false` jest traktowane jako brak decyzji.
- `params` przepisuje parametry narzędzia do wykonania.
- `requireApproval` wstrzymuje uruchomienie agenta i pyta użytkownika przez zatwierdzenia pluginów. Polecenie `/approve` może zatwierdzać zarówno zatwierdzenia exec, jak i pluginów.
- `block: true` o niższym priorytecie nadal może zablokować po tym, jak hook o wyższym priorytecie
  zażądał zatwierdzenia.
- `onResolution` otrzymuje rozwiązaną decyzję zatwierdzenia — `allow-once`,
  `allow-always`, `deny`, `timeout` albo `cancelled`.

Dołączone pluginy, które potrzebują zasad na poziomie hosta, mogą rejestrować zaufane zasady narzędzi
za pomocą `api.registerTrustedToolPolicy(...)`. Działają one przed zwykłymi hookami
`before_tool_call` i przed decyzjami zewnętrznych pluginów. Używaj ich tylko
dla bramek zaufanych przez hosta, takich jak zasady workspace, egzekwowanie budżetu albo
bezpieczeństwo zastrzeżonych workflow. Zewnętrzne pluginy powinny używać normalnych hooków `before_tool_call`.

### Utrwalanie wyników narzędzi

Wyniki narzędzi mogą zawierać ustrukturyzowane `details` do renderowania UI, diagnostyki,
routowania mediów albo metadanych należących do pluginu. Traktuj `details` jako metadane runtime,
a nie treść promptu:

- OpenClaw usuwa `toolResult.details` przed odtwarzaniem u dostawcy i wejściem Compaction,
  aby metadane nie stały się kontekstem modelu.
- Utrwalone wpisy sesji zachowują tylko ograniczone `details`. Nadmiernie duże szczegóły są
  zastępowane zwartym podsumowaniem i `persistedDetailsTruncated: true`.
- `tool_result_persist` i `before_message_write` działają przed końcowym
  limitem utrwalania. Hooki nadal powinny utrzymywać zwracane `details` jako małe i unikać
  umieszczania tekstu istotnego dla promptu wyłącznie w `details`; widoczne dla modelu wyjście narzędzia
  umieszczaj w `content`.

## Hooki promptu i modelu

Dla nowych pluginów używaj hooków specyficznych dla faz:

- `before_model_resolve`: otrzymuje tylko bieżący prompt i metadane załączników.
  Zwróć `providerOverride` albo `modelOverride`.
- `agent_turn_prepare`: otrzymuje bieżący prompt, przygotowane wiadomości sesji
  oraz wszystkie zakolejkowane wstrzyknięcia dokładnie raz opróżnione dla tej sesji. Zwróć
  `prependContext` albo `appendContext`.
- `before_prompt_build`: otrzymuje bieżący prompt i wiadomości sesji.
  Zwróć `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` albo `appendSystemContext`.
- `heartbeat_prompt_contribution`: działa tylko dla tur Heartbeat i zwraca
  `prependContext` albo `appendContext`. Jest przeznaczony dla monitorów w tle,
  które muszą podsumować bieżący stan bez zmieniania tur zainicjowanych przez użytkownika.

`before_agent_start` pozostaje dla zgodności. Preferuj powyższe jawne hooki,
aby twój plugin nie zależał od starszej połączonej fazy.

`before_agent_start` i `agent_end` zawierają `event.runId`, gdy OpenClaw może
zidentyfikować aktywne uruchomienie. Ta sama wartość jest też dostępna w `ctx.runId`.
Uruchomienia wywoływane przez cron ujawniają również `ctx.jobId` (identyfikator źródłowego zadania cron), aby
hooki pluginów mogły zawężać metryki, skutki uboczne lub stan do konkretnego zaplanowanego
zadania.

Dla uruchomień pochodzących z kanału `ctx.messageProvider` jest powierzchnią dostawcy, taką
jak `discord` albo `telegram`, natomiast `ctx.channelId` jest identyfikatorem docelowej konwersacji,
gdy OpenClaw może go wyprowadzić z klucza sesji lub metadanych dostarczenia.

`agent_end` jest hookiem obserwacyjnym i działa w trybie fire-and-forget po turze. Runner
hooków stosuje 30-sekundowy limit czasu, aby zablokowany plugin lub endpoint embeddingów
nie pozostawił obietnicy hooka oczekującej bez końca. Limit czasu jest logowany, a
OpenClaw kontynuuje; nie anuluje pracy sieciowej należącej do pluginu, chyba że
plugin używa też własnego sygnału przerwania.

Używaj `model_call_started` i `model_call_ended` do telemetrii wywołań dostawcy,
która nie powinna otrzymywać surowych promptów, historii, odpowiedzi, nagłówków, treści żądań
ani identyfikatorów żądań dostawcy. Te hooki zawierają stabilne metadane, takie jak
`runId`, `callId`, `provider`, `model`, opcjonalne `api`/`transport`, końcowe
`durationMs`/`outcome` oraz `upstreamRequestIdHash`, gdy OpenClaw może wyprowadzić
ograniczony skrót identyfikatora żądania dostawcy.

`before_agent_finalize` działa tylko wtedy, gdy harness ma zaakceptować naturalną
końcową odpowiedź asystenta. Nie jest to ścieżka anulowania `/stop` i nie
działa, gdy użytkownik przerywa turę. Zwróć `{ action: "revise", reason }`, aby poprosić
harness o jeszcze jeden przebieg modelu przed finalizacją, `{ action:
"finalize", reason? }`, aby wymusić finalizację, albo pomiń wynik, aby kontynuować.
Natywne hooki Codex `Stop` są przekazywane do tego hooka jako decyzje OpenClaw
`before_agent_finalize`.

Zwracając `action: "revise"`, pluginy mogą dołączyć metadane `retry`, aby
dodatkowy przebieg modelu był ograniczony i bezpieczny przy odtwarzaniu:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` jest dołączane do powodu rewizji wysyłanego do harnessa.
`idempotencyKey` pozwala hostowi zliczać ponowienia dla tego samego żądania pluginu wśród
równoważnych decyzji finalizacji, a `maxAttempts` ogranicza, ile dodatkowych przebiegów
host dopuści przed kontynuowaniem z naturalną odpowiedzią końcową.

Pluginy niedołączone, które potrzebują `llm_input`, `llm_output`,
`before_agent_finalize` albo `agent_end`, muszą ustawić:

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

Hooki mutujące prompt i trwałe wstrzyknięcia następnej tury można wyłączyć dla pluginu
za pomocą `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Rozszerzenia sesji i wstrzyknięcia następnej tury

Pluginy przepływu pracy mogą utrwalać niewielki, zgodny z JSON stan sesji za pomocą
`api.registerSessionExtension(...)` i aktualizować go przez metodę Gateway
`sessions.pluginPatch`. Wiersze sesji udostępniają zarejestrowany stan rozszerzenia
przez `pluginExtensions`, dzięki czemu Control UI i inni klienci mogą renderować
status należący do pluginu bez poznawania jego szczegółów wewnętrznych.

Użyj `api.enqueueNextTurnInjection(...)`, gdy plugin potrzebuje trwałego kontekstu,
który ma dotrzeć do następnej tury modelu dokładnie raz. OpenClaw opróżnia
zakolejkowane wstrzyknięcia przed hookami promptu, odrzuca wygasłe wstrzyknięcia
i deduplikuje je według `idempotencyKey` dla każdego pluginu. To właściwy punkt
integracji dla wznowień zatwierdzeń, podsumowań polityk, delt monitorów w tle
oraz kontynuacji poleceń, które powinny być widoczne dla modelu w następnej
turze, ale nie powinny stać się stałym tekstem promptu systemowego.

Semantyka czyszczenia jest częścią kontraktu. Wywołania zwrotne czyszczenia
rozszerzeń sesji i cyklu życia środowiska uruchomieniowego otrzymują `reset`,
`delete`, `disable` albo `restart`. Host usuwa trwały stan rozszerzenia sesji
należący do pluginu oraz oczekujące wstrzyknięcia następnej tury dla reset/delete/disable; restart zachowuje trwały stan sesji, a wywołania zwrotne czyszczenia pozwalają pluginom zwolnić zadania harmonogramu, kontekst uruchomienia i inne zasoby poza pasmem dla starej generacji środowiska uruchomieniowego.

## Hooki wiadomości

Używaj hooków wiadomości do routingu na poziomie kanału i zasad dostarczania:

- `message_received`: obserwuje treść przychodzącą, nadawcę, `threadId`, `messageId`,
  `senderId`, opcjonalną korelację uruchomienia/sesji oraz metadane.
- `message_sending`: przepisuje `content` albo zwraca `{ cancel: true }`.
- `message_sent`: obserwuje końcowy sukces lub niepowodzenie.

W przypadku odpowiedzi TTS tylko audio `content` może zawierać ukryty transkrypt
mówiony nawet wtedy, gdy ładunek kanału nie ma widocznego tekstu/podpisu.
Przepisanie tego `content` aktualizuje tylko transkrypt widoczny dla hooka; nie
jest renderowane jako podpis multimediów.

Konteksty hooków wiadomości udostępniają stabilne pola korelacji, gdy są
dostępne: `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` oraz `ctx.callDepth`. Preferuj
te pola pierwszej klasy przed odczytywaniem starszych metadanych.

Preferuj typowane pola `threadId` i `replyToId` przed użyciem metadanych
specyficznych dla kanału.

Reguły decyzji:

- `message_sending` z `cancel: true` jest terminalne.
- `message_sending` z `cancel: false` jest traktowane jak brak decyzji.
- Przepisany `content` przechodzi dalej do hooków o niższym priorytecie, chyba że późniejszy hook anuluje dostarczenie.

## Hooki instalacji

`before_install` uruchamia się po wbudowanym skanowaniu instalacji Skills i pluginów.
Zwróć dodatkowe ustalenia albo `{ block: true, blockReason }`, aby zatrzymać
instalację.

`block: true` jest terminalne. `block: false` jest traktowane jak brak decyzji.

## Cykl życia Gateway

Używaj `gateway_start` dla usług pluginów, które potrzebują stanu należącego do Gateway.
Kontekst udostępnia `ctx.config`, `ctx.workspaceDir` oraz `ctx.getCron?.()` do
inspekcji i aktualizacji crona. Używaj `gateway_stop`, aby posprzątać zasoby
działające długo.

Nie polegaj na wewnętrznym hooku `gateway:startup` dla usług środowiska
uruchomieniowego należących do pluginu.

`cron_changed` uruchamia się dla zdarzeń cyklu życia crona należącego do gateway z typowanym
ładunkiem zdarzenia obejmującym powody `added`, `updated`, `removed`, `started`, `finished`
oraz `scheduled`. Zdarzenie przenosi migawkę `PluginHookGatewayCronJob`
(w tym `state.nextRunAtMs`, `state.lastRunStatus` i `state.lastError`, gdy są obecne)
oraz `PluginHookGatewayCronDeliveryStatus` o wartości `not-requested` | `delivered` | `not-delivered` | `unknown`. Zdarzenia usunięcia nadal przenoszą migawkę usuniętego zadania, aby zewnętrzne harmonogramy mogły uzgodnić stan. Używaj `ctx.getCron?.()` i `ctx.config` z kontekstu środowiska uruchomieniowego podczas synchronizowania zewnętrznych harmonogramów wybudzania i traktuj OpenClaw jako źródło prawdy dla sprawdzania terminów oraz wykonywania.

## Nadchodzące wycofania

Kilka powierzchni sąsiadujących z hookami jest przestarzałych, ale nadal
obsługiwanych. Przeprowadź migrację przed następnym wydaniem głównym:

- **Jawnotekstowe koperty kanałów** w handlerach `inbound_claim` i `message_received`.
  Odczytuj `BodyForAgent` oraz ustrukturyzowane bloki kontekstu użytkownika
  zamiast parsować płaski tekst koperty. Zobacz
  [Jawnotekstowe koperty kanałów → BodyForAgent](/pl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** pozostaje dla zgodności. Nowe pluginy powinny używać
  `before_model_resolve` i `before_prompt_build` zamiast połączonej fazy.
- **`onResolution` w `before_tool_call`** używa teraz typowanej unii
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) zamiast swobodnego `string`.

Pełną listę — rejestrację możliwości pamięci, profil myślenia dostawcy,
zewnętrznych dostawców uwierzytelniania, typy odkrywania dostawców, akcesory
środowiska uruchomieniowego zadań oraz zmianę nazwy `command-auth` → `command-status` — zobacz w
[Migracja Plugin SDK → Aktywne wycofania](/pl/plugins/sdk-migration#active-deprecations).

## Powiązane

- [Migracja Plugin SDK](/pl/plugins/sdk-migration) — aktywne wycofania i harmonogram usunięcia
- [Budowanie pluginów](/pl/plugins/building-plugins)
- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
- [Punkty wejścia pluginu](/pl/plugins/sdk-entrypoints)
- [Hooki wewnętrzne](/pl/automation/hooks)
- [Wewnętrzna architektura pluginów](/pl/plugins/architecture-internals)
