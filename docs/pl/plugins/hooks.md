---
read_when:
    - Tworzysz Plugin, który wymaga before_tool_call, before_agent_reply, hooków wiadomości lub hooków cyklu życia
    - Musisz blokować, przepisywać lub wymagać zatwierdzenia wywołań narzędzi z Pluginu
    - Wybierasz między wewnętrznymi hookami a hookami Plugin
summary: 'Hooki Pluginu: przechwytują zdarzenia cyklu życia agenta, narzędzia, wiadomości, sesji i Gateway'
title: Haki Plugin
x-i18n:
    generated_at: "2026-04-30T10:07:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

Hooki Plugin działają jako punkty rozszerzeń w procesie dla pluginów OpenClaw. Używaj ich,
gdy plugin musi sprawdzać lub zmieniać uruchomienia agentów, wywołania narzędzi, przepływ wiadomości,
cykl życia sesji, trasowanie subagentów, instalacje lub uruchamianie Gateway.

Zamiast tego użyj [wewnętrznych hooków](/pl/automation/hooks), gdy potrzebujesz małego
skryptu `HOOK.md` instalowanego przez operatora dla zdarzeń poleceń i Gateway, takich jak
`/new`, `/reset`, `/stop`, `agent:bootstrap` lub `gateway:startup`.

## Szybki start

Zarejestruj typowane hooki pluginu za pomocą `api.on(...)` z punktu wejścia pluginu:

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

Handlery hooków uruchamiają się sekwencyjnie według malejącego `priority`. Hooki o tym samym priorytecie
zachowują kolejność rejestracji.

`api.on(name, handler, opts?)` przyjmuje:

- `priority` — kolejność handlerów (wyższa wartość uruchamia się pierwsza).
- `timeoutMs` — opcjonalny budżet dla pojedynczego hooka. Gdy jest ustawiony, runner hooków przerywa ten
  handler po upływie budżetu i przechodzi do następnego, zamiast pozwalać, aby powolna konfiguracja lub praca recall
  zużyła skonfigurowany przez wywołującego limit czasu modelu.
  Pomiń go, aby użyć domyślnego limitu czasu obserwacji/decyzji, który runner hooków stosuje ogólnie.

Każdy hook otrzymuje `event.context.pluginConfig`, rozwiązaną konfigurację dla
pluginu, który zarejestrował ten handler. Używaj jej do decyzji hooków, które wymagają
bieżących opcji pluginu; OpenClaw wstrzykuje ją dla każdego handlera bez mutowania
współdzielonego obiektu zdarzenia widzianego przez inne pluginy.

## Katalog hooków

Hooki są pogrupowane według powierzchni, którą rozszerzają. Nazwy pogrubione akceptują
wynik decyzyjny (zablokowanie, anulowanie, nadpisanie lub wymaganie zatwierdzenia); wszystkie pozostałe służą
wyłącznie do obserwacji.

**Tura agenta**

- `before_model_resolve` — nadpisz dostawcę lub model przed wczytaniem wiadomości sesji
- `agent_turn_prepare` — wykorzystaj zakolejkowane wstrzyknięcia tury pluginu i dodaj kontekst tej samej tury przed hookami promptu
- `before_prompt_build` — dodaj dynamiczny kontekst lub tekst promptu systemowego przed wywołaniem modelu
- `before_agent_start` — faza łączona tylko dla zgodności; preferuj dwa powyższe hooki
- **`before_agent_reply`** — przerwij turę modelu syntetyczną odpowiedzią albo ciszą
- **`before_agent_finalize`** — sprawdź naturalną odpowiedź końcową i zażądaj jeszcze jednego przebiegu modelu
- `agent_end` — obserwuj końcowe wiadomości, stan powodzenia i czas trwania uruchomienia
- `heartbeat_prompt_contribution` — dodaj kontekst tylko dla Heartbeat dla pluginów monitorowania w tle i cyklu życia

**Obserwacja konwersacji**

- `model_call_started` / `model_call_ended` — obserwuj oczyszczone metadane wywołania dostawcy/modelu, czas, wynik i ograniczone hashe identyfikatorów żądań bez treści promptu ani odpowiedzi
- `llm_input` — obserwuj wejście dostawcy (prompt systemowy, prompt, historię)
- `llm_output` — obserwuj wyjście dostawcy

**Narzędzia**

- **`before_tool_call`** — przepisz parametry narzędzia, zablokuj wykonanie lub wymagaj zatwierdzenia
- `after_tool_call` — obserwuj wyniki narzędzi, błędy i czas trwania
- **`tool_result_persist`** — przepisz wiadomość asystenta utworzoną z wyniku narzędzia
- **`before_message_write`** — sprawdź lub zablokuj trwający zapis wiadomości (rzadkie)

**Wiadomości i dostarczanie**

- **`inbound_claim`** — przejmij wiadomość przychodzącą przed trasowaniem agenta (syntetyczne odpowiedzi)
- `message_received` — obserwuj treść przychodzącą, nadawcę, wątek i metadane
- **`message_sending`** — przepisz treść wychodzącą lub anuluj dostarczanie
- `message_sent` — obserwuj powodzenie albo niepowodzenie dostarczania wychodzącego
- **`before_dispatch`** — sprawdź lub przepisz wysyłkę wychodzącą przed przekazaniem do kanału
- **`reply_dispatch`** — weź udział w końcowym potoku wysyłki odpowiedzi

**Sesje i Compaction**

- `session_start` / `session_end` — śledź granice cyklu życia sesji
- `before_compaction` / `after_compaction` — obserwuj lub adnotuj cykle Compaction
- `before_reset` — obserwuj zdarzenia resetowania sesji (`/reset`, resetowania programowe)

**Subagenci**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — koordynuj trasowanie subagentów i dostarczanie zakończenia

**Cykl życia**

- `gateway_start` / `gateway_stop` — uruchamiaj lub zatrzymuj usługi należące do pluginu wraz z Gateway
- `cron_changed` — obserwuj zmiany cyklu życia Cron należące do Gateway (dodane, zaktualizowane, usunięte, rozpoczęte, zakończone, zaplanowane)
- **`before_install`** — sprawdź skany instalacji umiejętności lub pluginu i opcjonalnie zablokuj

## Polityka wywołań narzędzi

`before_tool_call` otrzymuje:

- `event.toolName`
- `event.params`
- opcjonalne `event.runId`
- opcjonalne `event.toolCallId`
- pola kontekstu, takie jak `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ustawione przy uruchomieniach sterowanych przez Cron) oraz diagnostyczne `ctx.trace`

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

- `block: true` jest końcowe i pomija handlery o niższym priorytecie.
- `block: false` jest traktowane jak brak decyzji.
- `params` przepisuje parametry narzędzia do wykonania.
- `requireApproval` wstrzymuje uruchomienie agenta i pyta użytkownika przez zatwierdzenia pluginów. Polecenie `/approve` może zatwierdzać zarówno zatwierdzenia exec, jak i pluginów.
- `block: true` z niższym priorytetem nadal może zablokować po tym, jak hook o wyższym priorytecie
  zażądał zatwierdzenia.
- `onResolution` otrzymuje rozstrzygniętą decyzję zatwierdzenia — `allow-once`,
  `allow-always`, `deny`, `timeout` lub `cancelled`.

Wbudowane pluginy, które potrzebują polityki na poziomie hosta, mogą rejestrować zaufane polityki narzędzi
za pomocą `api.registerTrustedToolPolicy(...)`. Uruchamiają się one przed zwykłymi
hookami `before_tool_call` i przed decyzjami zewnętrznych pluginów. Używaj ich tylko
dla zaufanych przez hosta bramek, takich jak polityka przestrzeni roboczej, egzekwowanie budżetu lub
bezpieczeństwo zarezerwowanych przepływów pracy. Zewnętrzne pluginy powinny używać normalnych hooków `before_tool_call`.

### Utrwalanie wyniku narzędzia

Wyniki narzędzi mogą zawierać strukturalne `details` do renderowania UI, diagnostyki,
trasowania mediów lub metadanych należących do pluginu. Traktuj `details` jako metadane uruchomieniowe,
nie jako treść promptu:

- OpenClaw usuwa `toolResult.details` przed odtworzeniem u dostawcy i wejściem Compaction,
  aby metadane nie stały się kontekstem modelu.
- Utrwalone wpisy sesji zachowują tylko ograniczone `details`. Nadmiernie duże details są
  zastępowane kompaktowym podsumowaniem i `persistedDetailsTruncated: true`.
- `tool_result_persist` i `before_message_write` uruchamiają się przed końcowym limitem
  utrwalania. Hooki nadal powinny utrzymywać zwracane `details` małe i unikać
  umieszczania tekstu istotnego dla promptu tylko w `details`; wyjście narzędzia widoczne dla modelu
  umieszczaj w `content`.

## Hooki promptu i modelu

Dla nowych pluginów używaj hooków specyficznych dla faz:

- `before_model_resolve`: otrzymuje tylko bieżący prompt i metadane załączników.
  Zwróć `providerOverride` lub `modelOverride`.
- `agent_turn_prepare`: otrzymuje bieżący prompt, przygotowane wiadomości sesji
  oraz wszelkie zakolejkowane wstrzyknięcia dokładnie raz, opróżnione dla tej sesji. Zwróć
  `prependContext` lub `appendContext`.
- `before_prompt_build`: otrzymuje bieżący prompt i wiadomości sesji.
  Zwróć `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` lub `appendSystemContext`.
- `heartbeat_prompt_contribution`: uruchamia się tylko dla tur Heartbeat i zwraca
  `prependContext` lub `appendContext`. Jest przeznaczony dla monitorów w tle,
  które muszą podsumować bieżący stan bez zmieniania tur inicjowanych przez użytkownika.

`before_agent_start` pozostaje dla zgodności. Preferuj jawne hooki powyżej,
aby twój plugin nie zależał od starszej fazy łączonej.

`before_agent_start` i `agent_end` zawierają `event.runId`, gdy OpenClaw może
zidentyfikować aktywne uruchomienie. Ta sama wartość jest również dostępna w `ctx.runId`.
Uruchomienia sterowane przez Cron ujawniają także `ctx.jobId` (identyfikator źródłowego zadania Cron), aby
hooki pluginów mogły zakresować metryki, efekty uboczne lub stan do konkretnego zaplanowanego
zadania.

`agent_end` jest hookiem obserwacyjnym i uruchamia się fire-and-forget po turze. Runner
hooków stosuje 30-sekundowy limit czasu, aby zawieszony plugin lub endpoint osadzeń
nie mógł pozostawić obietnicy hooka oczekującej bez końca. Limit czasu jest logowany, a
OpenClaw kontynuuje; nie anuluje pracy sieciowej należącej do pluginu, chyba że
plugin używa także własnego sygnału przerwania.

Używaj `model_call_started` i `model_call_ended` do telemetrii wywołań dostawcy,
która nie powinna otrzymywać surowych promptów, historii, odpowiedzi, nagłówków, treści żądań
ani identyfikatorów żądań dostawcy. Te hooki zawierają stabilne metadane, takie jak
`runId`, `callId`, `provider`, `model`, opcjonalne `api`/`transport`, końcowe
`durationMs`/`outcome` oraz `upstreamRequestIdHash`, gdy OpenClaw może wyprowadzić
ograniczony hash identyfikatora żądania dostawcy.

`before_agent_finalize` uruchamia się tylko wtedy, gdy harness ma zaakceptować naturalną
końcową odpowiedź asystenta. Nie jest to ścieżka anulowania `/stop` i nie
uruchamia się, gdy użytkownik przerywa turę. Zwróć `{ action: "revise", reason }`, aby poprosić
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

Hooki mutujące prompt i trwałe wstrzyknięcia następnej tury można wyłączyć dla pluginu
za pomocą `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Rozszerzenia sesji i wstrzyknięcia następnej tury

Pluginy przepływu pracy mogą utrwalać mały stan sesji zgodny z JSON za pomocą
`api.registerSessionExtension(...)` i aktualizować go przez metodę Gateway
`sessions.pluginPatch`. Wiersze sesji projektują zarejestrowany stan rozszerzeń przez
`pluginExtensions`, pozwalając Control UI i innym klientom renderować
status należący do pluginu bez poznawania wewnętrznych szczegółów pluginu.

Używaj `api.enqueueNextTurnInjection(...)`, gdy plugin potrzebuje trwałego kontekstu,
który ma dotrzeć do następnej tury modelu dokładnie raz. OpenClaw opróżnia zakolejkowane wstrzyknięcia przed
hookami promptu, odrzuca wygasłe wstrzyknięcia i deduplikuje według `idempotencyKey`
dla każdego pluginu. To właściwy punkt rozszerzeń dla wznowień po zatwierdzeniach, podsumowań polityk,
delt monitorów w tle i kontynuacji poleceń, które powinny być widoczne dla
modelu w następnej turze, ale nie powinny stać się trwałym tekstem promptu systemowego.

Semantyka czyszczenia jest częścią kontraktu. Callbacki czyszczenia rozszerzeń sesji i
cyklu życia runtime otrzymują `reset`, `delete`, `disable` lub
`restart`. Host usuwa trwały stan rozszerzenia sesji należący do pluginu
oraz oczekujące wstrzyknięcia następnej tury dla reset/delete/disable; restart zachowuje
trwały stan sesji, podczas gdy callbacki czyszczenia pozwalają pluginom zwolnić zadania schedulera,
kontekst uruchomienia i inne zasoby poza pasmem dla starej generacji runtime.

## Hooki wiadomości

Używaj hooków wiadomości do trasowania i polityki dostarczania na poziomie kanału:

- `message_received`: obserwuj treść przychodzącą, nadawcę, `threadId`, `messageId`,
  `senderId`, opcjonalną korelację uruchomienia/sesji oraz metadane.
- `message_sending`: przepisz `content` albo zwróć `{ cancel: true }`.
- `message_sent`: obserwuj końcowe powodzenie albo niepowodzenie.

W przypadku odpowiedzi TTS zawierających wyłącznie dźwięk `content` może zawierać ukrytą transkrypcję mówioną,
nawet gdy payload kanału nie ma widocznego tekstu/podpisu. Przepisanie tego
`content` aktualizuje tylko transkrypcję widoczną dla hooka; nie jest ona renderowana jako
podpis multimediów.

Konteksty hooków wiadomości udostępniają stabilne pola korelacji, gdy są dostępne:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` i `ctx.callDepth`. Preferuj
te pola pierwszej klasy przed odczytywaniem starszych metadanych.

Preferuj typowane pola `threadId` i `replyToId` przed użyciem metadanych
specyficznych dla kanału.

Reguły decyzyjne:

- `message_sending` z `cancel: true` jest terminalne.
- `message_sending` z `cancel: false` jest traktowane jako brak decyzji.
- Przepisane `content` nadal przechodzi do hooków o niższym priorytecie, chyba że późniejszy hook
  anuluje dostarczenie.

## Hooki instalacji

`before_install` uruchamia się po wbudowanym skanowaniu instalacji Skills i pluginów.
Zwróć dodatkowe ustalenia albo `{ block: true, blockReason }`, aby zatrzymać
instalację.

`block: true` jest terminalne. `block: false` jest traktowane jako brak decyzji.

## Cykl życia Gateway

Używaj `gateway_start` dla usług pluginów, które potrzebują stanu należącego do Gateway. Kontekst
udostępnia `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` do inspekcji
oraz aktualizacji Cron. Używaj `gateway_stop`, aby czyścić długo działające
zasoby.

Nie polegaj na wewnętrznym hooku `gateway:startup` dla usług runtime
należących do pluginu.

`cron_changed` uruchamia się dla zdarzeń cyklu życia Cron należących do Gateway z typowanym
payloadem zdarzenia obejmującym powody `added`, `updated`, `removed`, `started`, `finished`
i `scheduled`. Zdarzenie przenosi snapshot `PluginHookGatewayCronJob`
(w tym `state.nextRunAtMs`, `state.lastRunStatus` i
`state.lastError`, gdy występują) oraz `PluginHookGatewayCronDeliveryStatus`
o wartości `not-requested` | `delivered` | `not-delivered` | `unknown`. Usunięte
zdarzenia nadal przenoszą snapshot usuniętego zadania, aby zewnętrzne schedulery mogły
uzgodnić stan. Używaj `ctx.getCron?.()` i `ctx.config` z kontekstu runtime
podczas synchronizacji zewnętrznych schedulerów wybudzeń i zachowaj OpenClaw jako
źródło prawdy dla sprawdzania terminów i wykonywania.

## Nadchodzące wycofania

Kilka powierzchni powiązanych z hookami jest przestarzałych, ale nadal obsługiwanych. Zmigruj je
przed następnym wydaniem głównym:

- **Zwykłotekstowe koperty kanałów** w handlerach `inbound_claim` i `message_received`.
  Odczytuj `BodyForAgent` oraz ustrukturyzowane bloki kontekstu użytkownika
  zamiast parsować płaski tekst koperty. Zobacz
  [Zwykłotekstowe koperty kanałów → BodyForAgent](/pl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** pozostaje dla zgodności. Nowe pluginy powinny używać
  `before_model_resolve` i `before_prompt_build` zamiast połączonej
  fazy.
- **`onResolution` w `before_tool_call`** używa teraz typowanej
  unii `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) zamiast swobodnego `string`.

Pełną listę — rejestrację funkcjonalności pamięci, profil myślenia providera,
zewnętrznych providerów uwierzytelniania, typy wykrywania providerów, akcesory runtime zadań
oraz zmianę nazwy `command-auth` → `command-status` — znajdziesz w
[Migracja Plugin SDK → Aktywne wycofania](/pl/plugins/sdk-migration#active-deprecations).

## Powiązane

- [Migracja Plugin SDK](/pl/plugins/sdk-migration) — aktywne wycofania i harmonogram usunięć
- [Budowanie pluginów](/pl/plugins/building-plugins)
- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
- [Punkty wejścia pluginów](/pl/plugins/sdk-entrypoints)
- [Wewnętrzne hooki](/pl/automation/hooks)
- [Wewnętrzne szczegóły architektury pluginów](/pl/plugins/architecture-internals)
