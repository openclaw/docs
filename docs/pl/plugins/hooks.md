---
read_when:
    - Budujesz Plugin, który potrzebuje `before_tool_call`, `before_agent_reply`, hooków wiadomości lub hooków cyklu życia
    - Musisz blokować, przepisywać lub wymagać zatwierdzenia wywołań narzędzi z Plugin
    - Decydujesz między wewnętrznymi hookami a hookami Plugin
summary: 'Haki Plugin: przechwytują zdarzenia cyklu życia agenta, narzędzia, wiadomości, sesji i Gateway'
title: Hooki Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3741b95bcccdff4e24b4c1f05de54649b48a6c0a2ca1dc4376475eb1823ae185
    source_path: plugins/hooks.md
    workflow: 16
---

Hooki pluginów są punktami rozszerzeń działającymi w procesie dla pluginów OpenClaw. Używaj ich,
gdy plugin musi sprawdzać lub zmieniać uruchomienia agentów, wywołania narzędzi, przepływ wiadomości,
cykl życia sesji, routowanie subagentów, instalacje lub uruchamianie Gateway.

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

Procedury obsługi hooków działają sekwencyjnie w malejącym porządku `priority`. Hooki o tym samym priorytecie
zachowują kolejność rejestracji.

`api.on(name, handler, opts?)` przyjmuje:

- `priority` - kolejność procedur obsługi (wyższa wartość działa jako pierwsza).
- `timeoutMs` - opcjonalny budżet dla pojedynczego hooka. Gdy jest ustawiony, runner hooków przerywa tę
  procedurę obsługi po upływie budżetu i przechodzi do następnej, zamiast
  pozwolić, aby powolna konfiguracja lub odtwarzanie kontekstu zużyły skonfigurowany przez wywołującego limit czasu modelu.
  Pomiń go, aby użyć domyślnego limitu czasu obserwacji/decyzji, który
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

`hooks.timeouts.<hookName>` nadpisuje `hooks.timeoutMs`, które nadpisuje
wartość `api.on(..., { timeoutMs })` zdefiniowaną przez autora pluginu. Każda skonfigurowana wartość musi
być dodatnią liczbą całkowitą nie większą niż 600000 milisekund. Preferuj nadpisania dla pojedynczych hooków
w przypadku znanych powolnych hooków, aby jeden plugin nie dostawał dłuższego budżetu
wszędzie.

Każdy hook otrzymuje `event.context.pluginConfig`, rozwiązaną konfigurację dla
pluginu, który zarejestrował tę procedurę obsługi. Używaj jej do decyzji hooków, które wymagają
aktualnych opcji pluginu; OpenClaw wstrzykuje ją dla każdej procedury obsługi bez mutowania
wspólnego obiektu zdarzenia widzianego przez inne pluginy.

## Katalog hooków

Hooki są pogrupowane według powierzchni, którą rozszerzają. Nazwy zapisane **pogrubieniem** przyjmują
wynik decyzji (blokada, anulowanie, nadpisanie lub wymaganie zatwierdzenia); wszystkie pozostałe są
wyłącznie obserwacyjne.

**Tura agenta**

- `before_model_resolve` - nadpisz dostawcę lub model przed załadowaniem wiadomości sesji
- `agent_turn_prepare` - użyj zakolejkowanych wstrzyknięć tur pluginów i dodaj kontekst tej samej tury przed hookami promptu
- `before_prompt_build` - dodaj dynamiczny kontekst lub tekst promptu systemowego przed wywołaniem modelu
- `before_agent_start` - połączona faza tylko dla zgodności; preferuj dwa powyższe hooki
- **`before_agent_run`** - sprawdź finalny prompt i wiadomości sesji przed przesłaniem do modelu oraz opcjonalnie zablokuj uruchomienie
- **`before_agent_reply`** - przerwij turę modelu syntetyczną odpowiedzią lub ciszą
- **`before_agent_finalize`** - sprawdź naturalną odpowiedź finalną i zażądaj jeszcze jednego przebiegu modelu
- `agent_end` - obserwuj finalne wiadomości, stan powodzenia i czas trwania uruchomienia
- `heartbeat_prompt_contribution` - dodaj kontekst wyłącznie dla Heartbeat dla pluginów monitorowania w tle i cyklu życia

**Obserwacja konwersacji**

- `model_call_started` / `model_call_ended` - obserwuj oczyszczone metadane wywołań dostawcy/modelu, czas, wynik i ograniczone hashe identyfikatorów żądań bez treści promptu ani odpowiedzi
- `llm_input` - obserwuj dane wejściowe dostawcy (prompt systemowy, prompt, historię)
- `llm_output` - obserwuj dane wyjściowe dostawcy

**Narzędzia**

- **`before_tool_call`** - przepisz parametry narzędzia, zablokuj wykonanie lub wymagaj zatwierdzenia
- `after_tool_call` - obserwuj wyniki narzędzia, błędy i czas trwania
- **`tool_result_persist`** - przepisz wiadomość asystenta utworzoną z wyniku narzędzia
- **`before_message_write`** - sprawdź lub zablokuj trwający zapis wiadomości (rzadkie)

**Wiadomości i dostarczanie**

- **`inbound_claim`** - przejmij wiadomość przychodzącą przed routowaniem agenta (odpowiedzi syntetyczne)
- `message_received` - obserwuj treść przychodzącą, nadawcę, wątek i metadane
- **`message_sending`** - przepisz treść wychodzącą lub anuluj dostarczenie
- `message_sent` - obserwuj powodzenie lub niepowodzenie dostarczenia wychodzącego
- **`before_dispatch`** - sprawdź lub przepisz dispatch wychodzący przed przekazaniem kanałowi
- **`reply_dispatch`** - uczestnicz w finalnym potoku dispatchu odpowiedzi

**Sesje i Compaction**

- `session_start` / `session_end` - śledź granice cyklu życia sesji
- `before_compaction` / `after_compaction` - obserwuj lub adnotuj cykle Compaction
- `before_reset` - obserwuj zdarzenia resetowania sesji (`/reset`, resety programowe)

**Subagenci**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - koordynuj routowanie subagentów i dostarczanie ukończenia

**Cykl życia**

- `gateway_start` / `gateway_stop` - uruchom lub zatrzymaj usługi należące do pluginu wraz z Gateway
- `cron_changed` - obserwuj zmiany cyklu życia Cron należącego do Gateway (dodano, zaktualizowano, usunięto, uruchomiono, zakończono, zaplanowano)
- **`before_install`** - sprawdź skany instalacji Skills lub pluginów i opcjonalnie zablokuj

## Zasady wywołań narzędzi

`before_tool_call` otrzymuje:

- `event.toolName`
- `event.params`
- opcjonalne `event.runId`
- opcjonalne `event.toolCallId`
- pola kontekstu, takie jak `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ustawiane przy uruchomieniach sterowanych przez Cron) oraz diagnostyczne `ctx.trace`

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

- `block: true` jest końcowe i pomija procedury obsługi o niższym priorytecie.
- `block: false` jest traktowane jak brak decyzji.
- `params` przepisuje parametry narzędzia do wykonania.
- `requireApproval` wstrzymuje uruchomienie agenta i prosi użytkownika przez zatwierdzenia pluginu.
  Polecenie `/approve` może zatwierdzać zarówno zatwierdzenia exec, jak i pluginu.
- `block: true` o niższym priorytecie nadal może zablokować po tym, jak hook o wyższym priorytecie
  zażądał zatwierdzenia.
- `onResolution` otrzymuje rozwiązaną decyzję zatwierdzenia - `allow-once`,
  `allow-always`, `deny`, `timeout` lub `cancelled`.

Dołączone pluginy, które potrzebują zasad na poziomie hosta, mogą rejestrować zaufane zasady narzędzi
za pomocą `api.registerTrustedToolPolicy(...)`. Działają one przed zwykłymi
hookami `before_tool_call` i przed decyzjami zewnętrznych pluginów. Używaj ich tylko
dla bramek zaufanych przez hosta, takich jak zasady obszaru roboczego, egzekwowanie budżetu lub
bezpieczeństwo zarezerwowanego workflow. Zewnętrzne pluginy powinny używać zwykłych hooków `before_tool_call`.

### Utrwalanie wyników narzędzi

Wyniki narzędzi mogą zawierać strukturalne `details` do renderowania UI, diagnostyki,
routowania mediów lub metadanych należących do pluginu. Traktuj `details` jako metadane czasu działania,
nie jako treść promptu:

- OpenClaw usuwa `toolResult.details` przed odtworzeniem dla dostawcy i wejściem Compaction,
  aby metadane nie stały się kontekstem modelu.
- Utrwalone wpisy sesji zachowują tylko ograniczone `details`. Zbyt duże szczegóły są
  zastępowane zwartym podsumowaniem i `persistedDetailsTruncated: true`.
- `tool_result_persist` i `before_message_write` działają przed finalnym
  limitem utrwalania. Hooki mimo to powinny utrzymywać zwracane `details` małe i unikać
  umieszczania tekstu istotnego dla promptu wyłącznie w `details`; dane wyjściowe narzędzia widoczne dla modelu
  umieszczaj w `content`.

## Hooki promptu i modelu

Dla nowych pluginów używaj hooków specyficznych dla faz:

- `before_model_resolve`: otrzymuje tylko bieżący prompt i metadane załączników.
  Zwróć `providerOverride` lub `modelOverride`.
- `agent_turn_prepare`: otrzymuje bieżący prompt, przygotowane wiadomości sesji
  oraz wszystkie jednorazowe zakolejkowane wstrzyknięcia opróżnione dla tej sesji. Zwróć
  `prependContext` lub `appendContext`.
- `before_prompt_build`: otrzymuje bieżący prompt i wiadomości sesji.
  Zwróć `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` lub `appendSystemContext`.
- `heartbeat_prompt_contribution`: działa tylko dla tur Heartbeat i zwraca
  `prependContext` lub `appendContext`. Jest przeznaczony dla monitorów w tle,
  które muszą podsumowywać bieżący stan bez zmieniania tur zainicjowanych przez użytkownika.

`before_agent_start` pozostaje dla zgodności. Preferuj jawne hooki powyżej,
aby twój plugin nie zależał od starszej połączonej fazy.

`before_agent_run` działa po skonstruowaniu promptu i przed dowolnymi danymi wejściowymi modelu,
w tym lokalnym ładowaniem obrazów promptu i obserwacją `llm_input`. Otrzymuje
bieżące dane wejściowe użytkownika jako `prompt`, a także załadowaną historię sesji w `messages`
i aktywny prompt systemowy. Zwróć `{ outcome: "block", reason, message? }`,
aby zatrzymać uruchomienie, zanim model będzie mógł odczytać prompt. `reason` jest wewnętrzne;
`message` jest zamiennikiem widocznym dla użytkownika. Jedynymi obsługiwanymi wynikami są
`pass` i `block`; nieobsługiwane kształty decyzji kończą się bezpiecznym zablokowaniem.

Gdy uruchomienie zostanie zablokowane, OpenClaw przechowuje tylko tekst zastępczy w
`message.content` oraz niewrażliwe metadane blokady, takie jak identyfikator blokującego pluginu
i znacznik czasu. Oryginalny tekst użytkownika nie jest zachowywany w transkrypcie ani przyszłym
kontekście. Wewnętrzne powody blokady są traktowane jako wrażliwe i wykluczane z
ładunków transkryptu, historii, broadcastu, logu i diagnostyki. Obserwowalność
powinna używać oczyszczonych pól, takich jak identyfikator blokującego, wynik, znacznik czasu lub bezpieczna
kategoria.

`before_agent_start` i `agent_end` zawierają `event.runId`, gdy OpenClaw może
zidentyfikować aktywne uruchomienie. Ta sama wartość jest też dostępna w `ctx.runId`.
Uruchomienia sterowane przez Cron udostępniają też `ctx.jobId` (identyfikator źródłowego zadania Cron), aby
hooki pluginów mogły ograniczać metryki, skutki uboczne lub stan do konkretnego zaplanowanego
zadania.

Dla uruchomień pochodzących z kanału `ctx.messageProvider` jest powierzchnią dostawcy, taką
jak `discord` lub `telegram`, natomiast `ctx.channelId` jest identyfikatorem docelowym konwersacji,
gdy OpenClaw może go wyprowadzić z klucza sesji lub metadanych dostarczenia.

`agent_end` jest hookiem obserwacyjnym i działa w trybie fire-and-forget po turze. Runner
hooków stosuje limit czasu 30 sekund, aby zablokowany plugin lub endpoint osadzania
nie mógł pozostawić obietnicy hooka w stanie oczekiwania na zawsze. Limit czasu jest logowany, a
OpenClaw kontynuuje; nie anuluje pracy sieciowej należącej do pluginu, chyba że
plugin używa również własnego sygnału przerwania.

Używaj `model_call_started` i `model_call_ended` do telemetrii wywołań dostawcy,
która nie powinna otrzymywać surowych promptów, historii, odpowiedzi, nagłówków, treści żądań
ani identyfikatorów żądań dostawcy. Te hooki zawierają stabilne metadane, takie jak
`runId`, `callId`, `provider`, `model`, opcjonalne `api`/`transport`, końcowe
`durationMs`/`outcome` oraz `upstreamRequestIdHash`, gdy OpenClaw może wyprowadzić
ograniczony hash identyfikatora żądania dostawcy.

`before_agent_finalize` działa tylko wtedy, gdy harness ma zaakceptować naturalną
finalną odpowiedź asystenta. Nie jest to ścieżka anulowania `/stop` i nie
działa, gdy użytkownik przerywa turę. Zwróć `{ action: "revise", reason }`, aby poprosić
harness o jeszcze jeden przebieg modelu przed finalizacją, `{ action:
"finalize", reason? }`, aby wymusić finalizację, albo pomiń wynik, aby kontynuować.
Natywne hooki `Stop` Codex są przekazywane do tego hooka jako decyzje OpenClaw
`before_agent_finalize`.

Zwracając `action: "revise"`, pluginy mogą dołączyć metadane `retry`, aby
dodatkowy przebieg modelu był ograniczony i bezpieczny do odtworzenia:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` jest dołączane do powodu rewizji wysyłanego do mechanizmu testowego.
`idempotencyKey` pozwala hostowi liczyć ponowienia dla tego samego żądania pluginu w ramach
równoważnych decyzji finalizacji, a `maxAttempts` ogranicza liczbę dodatkowych przebiegów, na które
host pozwoli przed kontynuowaniem naturalnej końcowej odpowiedzi.

Pluginy spoza pakietu, które potrzebują surowych hooków konwersacji (`before_model_resolve`,
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

Hooki modyfikujące prompt oraz trwałe wstrzyknięcia na następną turę można wyłączyć dla każdego pluginu
za pomocą `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Rozszerzenia sesji i wstrzyknięcia na następną turę

Pluginy przepływu pracy mogą utrwalać niewielki stan sesji zgodny z JSON za pomocą
`api.registerSessionExtension(...)` i aktualizować go przez metodę Gateway
`sessions.pluginPatch`. Wiersze sesji udostępniają zarejestrowany stan rozszerzenia
przez `pluginExtensions`, pozwalając Control UI i innym klientom renderować
status należący do pluginu bez poznawania jego wewnętrznej implementacji.

Użyj `api.enqueueNextTurnInjection(...)`, gdy plugin potrzebuje trwałego kontekstu,
który ma dotrzeć do następnej tury modelu dokładnie raz. OpenClaw opróżnia kolejkę wstrzyknięć przed
hookami promptu, odrzuca wygasłe wstrzyknięcia i deduplikuje je według `idempotencyKey`
dla każdego pluginu. To właściwy punkt rozszerzenia dla wznowień po zatwierdzeniu, podsumowań polityk,
delt monitorów działających w tle i kontynuacji poleceń, które powinny być widoczne dla
modelu w następnej turze, ale nie powinny stać się stałym tekstem promptu systemowego.

Semantyka czyszczenia jest częścią kontraktu. Czyszczenie rozszerzeń sesji i
wywołania zwrotne czyszczenia cyklu życia środowiska uruchomieniowego otrzymują `reset`, `delete`, `disable` lub
`restart`. Host usuwa trwały stan rozszerzenia sesji należący do danego pluginu
oraz oczekujące wstrzyknięcia na następną turę dla reset/delete/disable; restart zachowuje
trwały stan sesji, a wywołania zwrotne czyszczenia pozwalają pluginom zwolnić zadania
harmonogramu, kontekst uruchomieniowy i inne zasoby poza głównym kanałem dla starej generacji
środowiska uruchomieniowego.

## Hooki wiadomości

Używaj hooków wiadomości do routingu na poziomie kanału i polityki dostarczania:

- `message_received`: obserwuje treść przychodzącą, nadawcę, `threadId`, `messageId`,
  `senderId`, opcjonalną korelację uruchomienia/sesji oraz metadane.
- `message_sending`: przepisuje `content` lub zwraca `{ cancel: true }`.
- `message_sent`: obserwuje ostateczny sukces albo niepowodzenie.

W przypadku odpowiedzi TTS zawierających tylko dźwięk `content` może zawierać ukryty zapis wypowiedzi
nawet wtedy, gdy ładunek kanału nie ma widocznego tekstu/podpisu. Przepisanie tego
`content` aktualizuje tylko zapis widoczny dla hooka; nie jest on renderowany jako
podpis multimediów.

Konteksty hooków wiadomości udostępniają stabilne pola korelacji, gdy są dostępne:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` i `ctx.callDepth`. Preferuj
te pola pierwszej klasy przed odczytywaniem starszych metadanych.

Preferuj typowane pola `threadId` i `replyToId` przed użyciem metadanych specyficznych dla kanału.

Reguły decyzji:

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

Używaj `gateway_start` dla usług pluginu, które potrzebują stanu należącego do Gateway. Kontekst
udostępnia `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` do inspekcji
i aktualizacji cron. Używaj `gateway_stop` do czyszczenia długo działających
zasobów.

Nie polegaj na wewnętrznym hooku `gateway:startup` dla usług środowiska uruchomieniowego
należących do pluginu.

`cron_changed` uruchamia się dla zdarzeń cyklu życia cron należących do gateway z typowanym
ładunkiem zdarzenia obejmującym powody `added`, `updated`, `removed`, `started`, `finished`
i `scheduled`. Zdarzenie przenosi migawkę `PluginHookGatewayCronJob`
(w tym `state.nextRunAtMs`, `state.lastRunStatus` i
`state.lastError`, gdy występują) oraz `PluginHookGatewayCronDeliveryStatus`
o wartości `not-requested` | `delivered` | `not-delivered` | `unknown`. Zdarzenia usunięcia
nadal przenoszą migawkę usuniętego zadania, aby zewnętrzne harmonogramy mogły
uzgodnić stan. Podczas synchronizowania zewnętrznych harmonogramów wybudzania używaj
`ctx.getCron?.()` i `ctx.config` z kontekstu środowiska uruchomieniowego, a OpenClaw zachowaj jako
źródło prawdy dla sprawdzania terminów i wykonywania.

## Nadchodzące wycofania

Kilka powierzchni powiązanych z hookami jest przestarzałych, ale nadal obsługiwanych. Przeprowadź migrację
przed następnym głównym wydaniem:

- **Zwykłotekstowe koperty kanału** w handlerach `inbound_claim` i `message_received`.
  Odczytuj `BodyForAgent` i ustrukturyzowane bloki kontekstu użytkownika
  zamiast parsować płaski tekst koperty. Zobacz
  [Zwykłotekstowe koperty kanału → BodyForAgent](/pl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** pozostaje dla kompatybilności. Nowe pluginy powinny używać
  `before_model_resolve` i `before_prompt_build` zamiast połączonej
  fazy.
- **`onResolution` w `before_tool_call`** używa teraz typowanej
  unii `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) zamiast dowolnego `string`.

Pełną listę - rejestrację możliwości pamięci, profil myślenia dostawcy,
zewnętrznych dostawców uwierzytelniania, typy wykrywania dostawców, akcesory środowiska uruchomieniowego zadań
oraz zmianę nazwy `command-auth` → `command-status` - znajdziesz w
[Migracja Plugin SDK → Aktywne wycofania](/pl/plugins/sdk-migration#active-deprecations).

## Powiązane

- [Migracja Plugin SDK](/pl/plugins/sdk-migration) - aktywne wycofania i harmonogram usunięcia
- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Omówienie Plugin SDK](/pl/plugins/sdk-overview)
- [Punkty wejścia pluginu](/pl/plugins/sdk-entrypoints)
- [Hooki wewnętrzne](/pl/automation/hooks)
- [Wewnętrzna architektura pluginów](/pl/plugins/architecture-internals)
