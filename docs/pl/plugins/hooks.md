---
read_when:
    - Tworzysz Plugin, który potrzebuje before_tool_call, before_agent_reply, hooków wiadomości lub hooków cyklu życia
    - Musisz blokować wywołania narzędzi z Pluginu, przepisywać je lub wymagać ich zatwierdzenia
    - Wybierasz między hookami wewnętrznymi a hookami Plugin
summary: 'Hooki Plugin: przechwytuj zdarzenia cyklu życia agenta, narzędzia, wiadomości, sesji i Gateway'
title: Hooki Plugin
x-i18n:
    generated_at: "2026-05-06T09:23:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a149e1b343ea2d3f55855c2d02f4a9519337f0450c8a1428d52cd77ab4046a
    source_path: plugins/hooks.md
    workflow: 16
---

Hooki Plugin są punktami rozszerzeń działającymi w procesie dla Pluginów OpenClaw. Używaj ich,
gdy Plugin musi sprawdzać lub zmieniać uruchomienia agentów, wywołania narzędzi, przepływ wiadomości,
cykl życia sesji, routowanie subagentów, instalacje albo start Gateway.

Zamiast tego użyj [hooków wewnętrznych](/pl/automation/hooks), gdy potrzebujesz małego
skryptu `HOOK.md` instalowanego przez operatora dla zdarzeń poleceń i Gateway, takich jak
`/new`, `/reset`, `/stop`, `agent:bootstrap` albo `gateway:startup`.

## Szybki start

Zarejestruj typowane hooki Plugin za pomocą `api.on(...)` z punktu wejścia Plugin:

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

Procedury obsługi hooków działają sekwencyjnie według malejącego `priority`. Hooki
o tym samym priorytecie zachowują kolejność rejestracji.

`api.on(name, handler, opts?)` akceptuje:

- `priority` - kolejność procedur obsługi (wyższa wartość uruchamia się pierwsza).
- `timeoutMs` - opcjonalny budżet dla pojedynczego hooka. Gdy jest ustawiony, runner hooków przerywa tę
  procedurę obsługi po upływie budżetu i przechodzi do następnej, zamiast
  pozwalać, aby wolna konfiguracja lub odtwarzanie pamięci zużyły skonfigurowany przez wywołującego
  limit czasu modelu. Pomiń go, aby użyć domyślnego limitu czasu obserwacji/decyzji, który
  runner hooków stosuje ogólnie.

Operatorzy mogą też ustawiać budżety hooków bez łatania kodu Plugin:

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
`api.on(..., { timeoutMs })` zdefiniowaną przez autora Plugin. Każda skonfigurowana wartość musi
być dodatnią liczbą całkowitą nie większą niż 600000 milisekund. Preferuj nadpisania
dla konkretnych hooków znanych jako wolne, aby jeden Plugin nie otrzymywał dłuższego budżetu
wszędzie.

Każdy hook otrzymuje `event.context.pluginConfig`, czyli rozwiązaną konfigurację dla
Plugin, który zarejestrował tę procedurę obsługi. Używaj jej do decyzji hooków wymagających
bieżących opcji Plugin; OpenClaw wstrzykuje ją dla każdej procedury obsługi bez mutowania
współdzielonego obiektu zdarzenia widzianego przez inne Pluginy.

## Katalog hooków

Hooki są pogrupowane według powierzchni, którą rozszerzają. Nazwy zapisane **pogrubieniem** akceptują
wynik decyzji (blokada, anulowanie, nadpisanie lub wymaganie zatwierdzenia); wszystkie pozostałe są
wyłącznie obserwacyjne.

**Tura agenta**

- `before_model_resolve` - nadpisz dostawcę lub model przed wczytaniem wiadomości sesji
- `agent_turn_prepare` - zużyj zakolejkowane wstrzyknięcia tur Plugin i dodaj kontekst tej samej tury przed hookami promptu
- `before_prompt_build` - dodaj dynamiczny kontekst lub tekst promptu systemowego przed wywołaniem modelu
- `before_agent_start` - połączona faza wyłącznie dla zgodności; preferuj dwa hooki powyżej
- **`before_agent_reply`** - przerwij turę modelu syntetyczną odpowiedzią albo ciszą
- **`before_agent_finalize`** - sprawdź naturalną odpowiedź końcową i poproś o jeszcze jedno przejście modelu
- `agent_end` - obserwuj wiadomości końcowe, stan powodzenia i czas trwania uruchomienia
- `heartbeat_prompt_contribution` - dodaj kontekst wyłącznie Heartbeat dla monitorów tła i Pluginów cyklu życia

**Obserwacja konwersacji**

- `model_call_started` / `model_call_ended` - obserwuj oczyszczone metadane wywołania dostawcy/modelu, czas, wynik i ograniczone hashe identyfikatora żądania bez treści promptu ani odpowiedzi
- `llm_input` - obserwuj wejście dostawcy (prompt systemowy, prompt, historia)
- `llm_output` - obserwuj wyjście dostawcy

**Narzędzia**

- **`before_tool_call`** - przepisz parametry narzędzia, zablokuj wykonanie albo wymagaj zatwierdzenia
- `after_tool_call` - obserwuj wyniki narzędzia, błędy i czas trwania
- **`tool_result_persist`** - przepisz wiadomość asystenta utworzoną z wyniku narzędzia
- **`before_message_write`** - sprawdź lub zablokuj trwający zapis wiadomości (rzadkie)

**Wiadomości i dostarczanie**

- **`inbound_claim`** - przejmij wiadomość przychodzącą przed routowaniem agenta (odpowiedzi syntetyczne)
- `message_received` - obserwuj treść przychodzącą, nadawcę, wątek i metadane
- **`message_sending`** - przepisz treść wychodzącą albo anuluj dostarczenie
- `message_sent` - obserwuj powodzenie lub niepowodzenie dostarczenia wychodzącego
- **`before_dispatch`** - sprawdź lub przepisz wychodzące wysłanie przed przekazaniem do kanału
- **`reply_dispatch`** - uczestnicz w końcowym potoku wysyłania odpowiedzi

**Sesje i Compaction**

- `session_start` / `session_end` - śledź granice cyklu życia sesji
- `before_compaction` / `after_compaction` - obserwuj lub adnotuj cykle Compaction
- `before_reset` - obserwuj zdarzenia resetowania sesji (`/reset`, resetowania programowe)

**Subagenci**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - koordynuj routowanie subagentów i dostarczanie ukończenia

**Cykl życia**

- `gateway_start` / `gateway_stop` - uruchamiaj lub zatrzymuj usługi należące do Plugin razem z Gateway
- `cron_changed` - obserwuj zmiany cyklu życia Cron należącego do Gateway (dodano, zaktualizowano, usunięto, uruchomiono, zakończono, zaplanowano)
- **`before_install`** - sprawdzaj skany instalacji Skills lub Plugin i opcjonalnie blokuj

## Polityka wywołań narzędzi

`before_tool_call` otrzymuje:

- `event.toolName`
- `event.params`
- opcjonalne `event.runId`
- opcjonalne `event.toolCallId`
- pola kontekstu, takie jak `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ustawiane przy uruchomieniach napędzanych przez Cron) oraz diagnostyczne `ctx.trace`

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
- `requireApproval` wstrzymuje uruchomienie agenta i pyta użytkownika przez zatwierdzenia Plugin.
  Polecenie `/approve` może zatwierdzać zarówno zatwierdzenia exec, jak i Plugin.
- `block: true` o niższym priorytecie nadal może zablokować po tym, jak hook o wyższym priorytecie
  zażądał zatwierdzenia.
- `onResolution` otrzymuje rozwiązaną decyzję zatwierdzenia - `allow-once`,
  `allow-always`, `deny`, `timeout` albo `cancelled`.

Wbudowane Pluginy, które wymagają polityki na poziomie hosta, mogą rejestrować zaufane polityki narzędzi
za pomocą `api.registerTrustedToolPolicy(...)`. Działają one przed zwykłymi
hookami `before_tool_call` i przed decyzjami zewnętrznych Plugin. Używaj ich tylko
dla zaufanych przez hosta bramek, takich jak polityka przestrzeni roboczej, egzekwowanie budżetu albo
bezpieczeństwo zastrzeżonego przepływu pracy. Zewnętrzne Pluginy powinny używać zwykłych
hooków `before_tool_call`.

### Utrwalanie wyników narzędzi

Wyniki narzędzi mogą zawierać ustrukturyzowane `details` do renderowania UI, diagnostyki,
routowania multimediów albo metadanych należących do Plugin. Traktuj `details` jako metadane czasu wykonania,
a nie treść promptu:

- OpenClaw usuwa `toolResult.details` przed odtwarzaniem u dostawcy i wejściem Compaction,
  aby metadane nie stały się kontekstem modelu.
- Utrwalone wpisy sesji zachowują tylko ograniczone `details`. Zbyt duże szczegóły są
  zastępowane zwartym podsumowaniem i `persistedDetailsTruncated: true`.
- `tool_result_persist` i `before_message_write` działają przed końcowym
  limitem utrwalania. Hooki powinny mimo to utrzymywać zwracane `details` małe i unikać
  umieszczania tekstu istotnego dla promptu wyłącznie w `details`; widoczne dla modelu wyjście narzędzia
  umieszczaj w `content`.

## Hooki promptu i modelu

Dla nowych Plugin używaj hooków właściwych dla fazy:

- `before_model_resolve`: otrzymuje tylko bieżący prompt i metadane załączników.
  Zwróć `providerOverride` albo `modelOverride`.
- `agent_turn_prepare`: otrzymuje bieżący prompt, przygotowane wiadomości sesji
  i wszystkie jednorazowe zakolejkowane wstrzyknięcia opróżnione dla tej sesji. Zwróć
  `prependContext` albo `appendContext`.
- `before_prompt_build`: otrzymuje bieżący prompt i wiadomości sesji.
  Zwróć `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` albo `appendSystemContext`.
- `heartbeat_prompt_contribution`: działa tylko dla tur Heartbeat i zwraca
  `prependContext` albo `appendContext`. Jest przeznaczony dla monitorów tła,
  które muszą podsumować bieżący stan bez zmieniania tur inicjowanych przez użytkownika.

`before_agent_start` pozostaje dla zgodności. Preferuj jawne hooki powyżej,
aby Twój Plugin nie zależał od starszej połączonej fazy.

`before_agent_start` i `agent_end` zawierają `event.runId`, gdy OpenClaw może
zidentyfikować aktywne uruchomienie. Ta sama wartość jest też dostępna w `ctx.runId`.
Uruchomienia napędzane przez Cron udostępniają również `ctx.jobId` (identyfikator źródłowego zadania Cron), aby
hooki Plugin mogły ograniczać metryki, skutki uboczne lub stan do konkretnego zaplanowanego
zadania.

Dla uruchomień pochodzących z kanału `ctx.messageProvider` jest powierzchnią dostawcy, taką jak
`discord` albo `telegram`, natomiast `ctx.channelId` jest identyfikatorem docelowej konwersacji,
gdy OpenClaw może go wyprowadzić z klucza sesji albo metadanych dostarczania.

`agent_end` jest hookiem obserwacyjnym i działa w trybie fire-and-forget po turze. Runner
hooków stosuje limit czasu 30 sekund, aby zablokowany Plugin albo endpoint osadzania
nie pozostawiły obietnicy hooka oczekującej w nieskończoność. Limit czasu jest logowany, a
OpenClaw kontynuuje; nie anuluje on pracy sieciowej należącej do Plugin, chyba że
Plugin używa też własnego sygnału przerwania.

Używaj `model_call_started` i `model_call_ended` do telemetrii wywołań dostawcy,
która nie powinna otrzymywać surowych promptów, historii, odpowiedzi, nagłówków, treści żądań
ani identyfikatorów żądań dostawcy. Hooki te zawierają stabilne metadane, takie jak
`runId`, `callId`, `provider`, `model`, opcjonalne `api`/`transport`, końcowe
`durationMs`/`outcome` oraz `upstreamRequestIdHash`, gdy OpenClaw może wyprowadzić
ograniczony hash identyfikatora żądania dostawcy.

`before_agent_finalize` działa tylko wtedy, gdy harness ma zaakceptować naturalną
końcową odpowiedź asystenta. Nie jest to ścieżka anulowania `/stop` i nie
działa, gdy użytkownik przerywa turę. Zwróć `{ action: "revise", reason }`, aby poprosić
harness o jeszcze jedno przejście modelu przed finalizacją, `{ action:
"finalize", reason? }`, aby wymusić finalizację, albo pomiń wynik, aby kontynuować.
Natywne hooki Codex `Stop` są przekazywane do tego hooka jako decyzje OpenClaw
`before_agent_finalize`.

Przy zwracaniu `action: "revise"` Pluginy mogą zawierać metadane `retry`, aby uczynić
dodatkowe przejście modelu ograniczonym i bezpiecznym do odtwarzania:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` jest dołączane do powodu rewizji wysyłanego do harnessa.
`idempotencyKey` pozwala hostowi liczyć ponowne próby dla tego samego żądania Plugin w kolejnych
równoważnych decyzjach finalizacji, a `maxAttempts` ogranicza liczbę dodatkowych przejść,
na które host pozwoli przed kontynuowaniem z naturalną odpowiedzią końcową.

Niewbudowane Pluginy, które potrzebują `llm_input`, `llm_output`,
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

Hooki mutujące prompt i trwałe wstrzyknięcia następnej tury można wyłączyć dla każdego Plugin
za pomocą `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Rozszerzenia sesji i wstrzyknięcia następnej tury

Pluginy przepływu pracy mogą utrwalać niewielki stan sesji zgodny z JSON za pomocą
`api.registerSessionExtension(...)` i aktualizować go przez metodę Gateway
`sessions.pluginPatch`. Wiersze sesji prezentują zarejestrowany stan rozszerzenia
przez `pluginExtensions`, umożliwiając Control UI i innym klientom renderowanie
statusu należącego do pluginu bez poznawania jego szczegółów wewnętrznych.

Użyj `api.enqueueNextTurnInjection(...)`, gdy plugin potrzebuje trwałego kontekstu,
który ma dotrzeć do następnej tury modelu dokładnie raz. OpenClaw opróżnia
zakolejkowane wstrzyknięcia przed hakami promptu, odrzuca wygasłe wstrzyknięcia
i deduplikuje według `idempotencyKey` dla każdego pluginu. To właściwy punkt
rozszerzenia dla wznawiania zatwierdzeń, podsumowań zasad, delt monitorów w tle
i kontynuacji poleceń, które powinny być widoczne dla modelu w następnej turze,
ale nie powinny stać się trwałym tekstem promptu systemowego.

Semantyka czyszczenia jest częścią kontraktu. Funkcje zwrotne czyszczenia
rozszerzeń sesji i czyszczenia cyklu życia środowiska wykonawczego otrzymują
`reset`, `delete`, `disable` albo `restart`. Host usuwa trwały stan rozszerzenia
sesji należący do pluginu oraz oczekujące wstrzyknięcia następnej tury dla
reset/delete/disable; restart zachowuje trwały stan sesji, a funkcje zwrotne
czyszczenia pozwalają pluginom zwolnić zadania harmonogramu, kontekst uruchomienia
i inne zasoby poza pasmem dla starej generacji środowiska wykonawczego.

## Haki wiadomości

Używaj haków wiadomości do routingu na poziomie kanału i zasad dostarczania:

- `message_received`: obserwuje treść przychodzącą, nadawcę, `threadId`, `messageId`,
  `senderId`, opcjonalną korelację uruchomienia/sesji oraz metadane.
- `message_sending`: przepisuje `content` albo zwraca `{ cancel: true }`.
- `message_sent`: obserwuje końcowy sukces lub niepowodzenie.

W przypadku odpowiedzi TTS tylko audio `content` może zawierać ukryty transkrypt
mówiony nawet wtedy, gdy ładunek kanału nie ma widocznego tekstu/podpisu.
Przepisanie tego `content` aktualizuje tylko transkrypt widoczny dla haka; nie jest
on renderowany jako podpis multimediów.

Konteksty haków wiadomości udostępniają stabilne pola korelacji, gdy są dostępne:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` i `ctx.callDepth`. Preferuj
te pola pierwszej klasy przed odczytem starszych metadanych.

Preferuj typowane pola `threadId` i `replyToId` przed użyciem metadanych
specyficznych dla kanału.

Reguły decyzyjne:

- `message_sending` z `cancel: true` jest końcowe.
- `message_sending` z `cancel: false` jest traktowane jako brak decyzji.
- Przepisane `content` przechodzi dalej do haków o niższym priorytecie, chyba że
  późniejszy hak anuluje dostarczenie.

## Haki instalacji

`before_install` działa po wbudowanym skanowaniu instalacji Skills i pluginów.
Zwróć dodatkowe ustalenia albo `{ block: true, blockReason }`, aby zatrzymać
instalację.

`block: true` jest końcowe. `block: false` jest traktowane jako brak decyzji.

## Cykl życia Gateway

Używaj `gateway_start` dla usług pluginów, które potrzebują stanu należącego do
Gateway. Kontekst udostępnia `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()`
do inspekcji oraz aktualizacji cron. Używaj `gateway_stop`, aby wyczyścić
długotrwałe zasoby.

Nie polegaj na wewnętrznym haku `gateway:startup` dla usług środowiska
wykonawczego należących do pluginu.

`cron_changed` jest wywoływane dla zdarzeń cyklu życia cron należących do Gateway
z typowanym ładunkiem zdarzenia obejmującym powody `added`, `updated`, `removed`,
`started`, `finished` i `scheduled`. Zdarzenie przenosi migawkę
`PluginHookGatewayCronJob` (w tym `state.nextRunAtMs`, `state.lastRunStatus` i
`state.lastError`, gdy są obecne) oraz `PluginHookGatewayCronDeliveryStatus`
o wartości `not-requested` | `delivered` | `not-delivered` | `unknown`. Zdarzenia
usunięcia nadal przenoszą migawkę usuniętego zadania, aby zewnętrzne harmonogramy
mogły uzgodnić stan. Używaj `ctx.getCron?.()` i `ctx.config` z kontekstu
środowiska wykonawczego podczas synchronizowania zewnętrznych harmonogramów
wybudzania i pozostaw OpenClaw jako źródło prawdy dla sprawdzania terminów oraz
wykonywania.

## Nadchodzące wycofania

Kilka powierzchni sąsiadujących z hakami jest wycofanych, ale nadal obsługiwanych.
Zmigruj przed następnym wydaniem głównym:

- **Koperty kanałów w tekście jawnym** w handlerach `inbound_claim` i
  `message_received`. Odczytuj `BodyForAgent` oraz strukturalne bloki kontekstu
  użytkownika zamiast parsować płaski tekst koperty. Zobacz
  [Koperty kanałów w tekście jawnym → BodyForAgent](/pl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** pozostaje dla zgodności. Nowe pluginy powinny używać
  `before_model_resolve` i `before_prompt_build` zamiast połączonej fazy.
- **`onResolution` w `before_tool_call`** używa teraz typowanej unii
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) zamiast swobodnego `string`.

Pełną listę - rejestrację możliwości pamięci, profil myślenia providera,
zewnętrznych providerów uwierzytelniania, typy wykrywania providerów, akcesory
środowiska wykonawczego zadań oraz zmianę nazwy `command-auth` → `command-status` -
znajdziesz w
[Migracja Plugin SDK → Aktywne wycofania](/pl/plugins/sdk-migration#active-deprecations).

## Powiązane

- [Migracja Plugin SDK](/pl/plugins/sdk-migration) - aktywne wycofania i harmonogram usunięcia
- [Budowanie pluginów](/pl/plugins/building-plugins)
- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
- [Punkty wejścia pluginów](/pl/plugins/sdk-entrypoints)
- [Wewnętrzne haki](/pl/automation/hooks)
- [Wewnętrzne szczegóły architektury pluginów](/pl/plugins/architecture-internals)
