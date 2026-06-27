---
read_when:
    - Tworzysz plugin, który potrzebuje `before_tool_call`, `before_agent_reply`, hooków wiadomości lub hooków cyklu życia
    - Musisz blokować, przepisywać lub wymagać zatwierdzenia wywołań narzędzi pochodzących z Plugin
    - Wybierasz między wewnętrznymi hookami a hookami Plugin
summary: 'Haki Plugin: przechwytuj zdarzenia cyklu życia agenta, narzędzia, wiadomości, sesji i Gateway'
title: Hooki Plugin
x-i18n:
    generated_at: "2026-06-27T17:53:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

Hooki pluginów to punkty rozszerzeń działające w procesie dla pluginów OpenClaw. Używaj ich,
gdy plugin musi inspekcjonować lub zmieniać uruchomienia agentów, wywołania narzędzi, przepływ wiadomości,
cykl życia sesji, routowanie podagentów, instalacje albo uruchamianie Gateway.

Użyj zamiast tego [hooków wewnętrznych](/pl/automation/hooks), gdy potrzebujesz małego
skryptu `HOOK.md` instalowanego przez operatora dla zdarzeń poleceń i Gateway, takich jak
`/new`, `/reset`, `/stop`, `agent:bootstrap` albo `gateway:startup`.

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

Procedury obsługi hooków działają sekwencyjnie w malejącym `priority`. Hooki o tym samym priorytecie
zachowują kolejność rejestracji.

`api.on(name, handler, opts?)` przyjmuje:

- `priority` - kolejność procedur obsługi (wyższa wartość działa pierwsza).
- `timeoutMs` - opcjonalny budżet dla pojedynczego hooka. Gdy jest ustawiony, runner hooków przerywa tę
  procedurę obsługi po upływie budżetu i kontynuuje następną, zamiast
  pozwalać, aby powolna konfiguracja lub odtwarzanie informacji zużyły skonfigurowany dla wywołującego
  limit czasu modelu. Pomiń go, aby użyć domyślnego limitu czasu obserwacji/decyzji, który
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

`hooks.timeouts.<hookName>` nadpisuje `hooks.timeoutMs`, które nadpisuje
wartość `api.on(..., { timeoutMs })` zdefiniowaną przez autora pluginu. Każda skonfigurowana wartość musi
być dodatnią liczbą całkowitą nie większą niż 600000 milisekund. Preferuj nadpisania dla pojedynczych hooków
w przypadku znanych powolnych hooków, aby jeden plugin nie otrzymywał dłuższego budżetu
wszędzie.

Każdy hook otrzymuje `event.context.pluginConfig`, rozwiązaną konfigurację dla
pluginu, który zarejestrował tę procedurę obsługi. Używaj jej do decyzji hooków, które wymagają
bieżących opcji pluginu; OpenClaw wstrzykuje ją dla każdej procedury obsługi bez mutowania
współdzielonego obiektu zdarzenia widzianego przez inne pluginy.

## Katalog hooków

Hooki są pogrupowane według powierzchni, którą rozszerzają. Nazwy zapisane **pogrubieniem** przyjmują
wynik decyzji (zablokowanie, anulowanie, nadpisanie albo wymaganie zatwierdzenia); wszystkie pozostałe są
tylko obserwacyjne.

**Tura agenta**

- `before_model_resolve` - nadpisuje dostawcę lub model przed załadowaniem wiadomości sesji
- `agent_turn_prepare` - pobiera zakolejkowane wstrzyknięcia tur pluginów i dodaje kontekst tej samej tury przed hookami promptu
- `before_prompt_build` - dodaje dynamiczny kontekst lub tekst promptu systemowego przed wywołaniem modelu
- `before_agent_start` - połączona faza tylko dla zgodności; preferuj dwa hooki powyżej
- **`before_agent_run`** - inspekcjonuje ostateczny prompt i wiadomości sesji przed przesłaniem do modelu oraz opcjonalnie blokuje uruchomienie
- **`before_agent_reply`** - przerywa turę modelu syntetyczną odpowiedzią lub ciszą
- **`before_agent_finalize`** - inspekcjonuje naturalną odpowiedź końcową i żąda jeszcze jednego przebiegu modelu
- `agent_end` - obserwuje wiadomości końcowe, stan powodzenia i czas trwania uruchomienia
- `heartbeat_prompt_contribution` - dodaje kontekst tylko dla Heartbeat na potrzeby pluginów monitora w tle i cyklu życia

**Obserwacja konwersacji**

- `model_call_started` / `model_call_ended` - obserwuje oczyszczone metadane wywołania dostawcy/modelu, czasy, wynik i ograniczone hashe identyfikatorów żądań bez treści promptu ani odpowiedzi
- `llm_input` - obserwuje dane wejściowe dostawcy (prompt systemowy, prompt, historię)
- `llm_output` - obserwuje dane wyjściowe dostawcy, użycie i rozwiązany `contextTokenBudget`, gdy jest dostępny

**Narzędzia**

- **`before_tool_call`** - przepisuje parametry narzędzia, blokuje wykonanie albo wymaga zatwierdzenia
- `after_tool_call` - obserwuje wyniki narzędzi, błędy i czas trwania
- `resolve_exec_env` - dodaje zmienne środowiskowe należące do pluginu do `exec`
- **`tool_result_persist`** - przepisuje wiadomość asystenta utworzoną z wyniku narzędzia
- **`before_message_write`** - inspekcjonuje lub blokuje trwający zapis wiadomości (rzadkie)

**Wiadomości i dostarczanie**

- **`inbound_claim`** - przejmuje wiadomość przychodzącą przed routowaniem agenta (syntetyczne odpowiedzi)
- `message_received` — obserwuje treść przychodzącą, nadawcę, wątek i metadane
- **`message_sending`** — przepisuje treść wychodzącą albo anuluje dostarczenie
- **`reply_payload_sending`** — mutuje albo anuluje znormalizowane payloady odpowiedzi przed dostarczeniem
- `message_sent` — obserwuje powodzenie lub niepowodzenie dostarczenia wychodzącego
- **`before_dispatch`** - inspekcjonuje lub przepisuje wychodzącą dyspozycję przed przekazaniem do kanału
- **`reply_dispatch`** - uczestniczy w końcowym potoku dyspozycji odpowiedzi

**Sesje i Compaction**

- `session_start` / `session_end` - śledzi granice cyklu życia sesji. `reason` zdarzenia to jedna z wartości: `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` albo `unknown`. Wartości `shutdown` i `restart` są emitowane przez finalizator zamykania gateway, gdy proces zostaje zatrzymany lub uruchomiony ponownie, a sesje nadal są aktywne, dzięki czemu pluginy podrzędne (takie jak magazyny pamięci lub transkryptów) mogą sfinalizować widmowe wiersze, które w przeciwnym razie pozostałyby w stanie otwartym między restartami. Finalizator jest ograniczony czasowo, więc powolny plugin nie może blokować SIGTERM/SIGINT.
- `before_compaction` / `after_compaction` - obserwuje lub adnotuje cykle Compaction
- `before_reset` - obserwuje zdarzenia resetowania sesji (`/reset`, resetowania programowe)

**Podagenci**

- `subagent_spawned` / `subagent_ended` - obserwuje uruchomienie i zakończenie podagenta.
- `subagent_delivery_target` - hook zgodności dla dostarczania zakończenia, gdy żadne podstawowe powiązanie sesji nie może wyznaczyć trasy.
- `subagent_spawning` - przestarzały hook zgodności. Rdzeń przygotowuje teraz powiązania podagentów `thread: true` przez adaptery powiązań sesji kanałów przed emisją `subagent_spawned`.
- `subagent_spawned` zawiera `resolvedModel` i `resolvedProvider`, gdy OpenClaw rozwiązał natywny model sesji potomnej przed uruchomieniem.
- `subagent_ended` przenosi `targetSessionKey` (tożsamość — odpowiada `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` albo `"acp"`), `reason`, opcjonalne `outcome` (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` albo `"deleted"`), opcjonalne `error`, `runId`, `endedAt`, `accountId` i `sendFarewell`. **Nie** zawiera `agentId` ani `childSessionKey`; użyj `targetSessionKey`, aby skorelować je z odpowiadającym zdarzeniem `subagent_spawned`.

**Cykl życia**

- `gateway_start` / `gateway_stop` - uruchamia lub zatrzymuje usługi należące do pluginu razem z Gateway
- `deactivate` - przestarzały alias zgodności dla `gateway_stop`; używaj `gateway_stop` w nowych pluginach
- `cron_changed` - obserwuje zmiany cyklu życia Cron należącego do gateway (dodane, zaktualizowane, usunięte, rozpoczęte, zakończone, zaplanowane)
- **`before_install`** - inspekcjonuje przygotowany materiał instalacyjny Skills lub pluginu z załadowanego
  runtime pluginu

## Debugowanie hooków runtime

Używaj `before_model_resolve`, gdy plugin musi przełączyć dostawcę lub model
dla tury agenta. Działa przed rozwiązaniem modelu; `llm_output` działa dopiero po tym, jak
próba modelu utworzy dane wyjściowe asystenta.

Aby udowodnić efektywny model sesji, sprawdź rejestracje runtime, a następnie
użyj `openclaw sessions` albo powierzchni sesji/statusu Gateway. Podczas debugowania
payloadów dostawcy uruchom Gateway z `--raw-stream` i
`--raw-stream-path <path>`; te flagi zapisują surowe zdarzenia strumienia modelu do pliku jsonl.

## Polityka wywołań narzędzi

`before_tool_call` otrzymuje:

- `event.toolName`
- `event.params`
- opcjonalne `event.toolKind` i `event.toolInputKind`, rozstrzygające po stronie hosta
  dyskryminatory dla narzędzi, które celowo współdzielą nazwy; na przykład zewnętrzne
  wywołania `exec` trybu kodu używają `toolKind: "code_mode_exec"` i
  zawierają `toolInputKind: "javascript" | "typescript"`, gdy język wejściowy
  jest znany
- opcjonalne `event.derivedPaths`, zawierające oparte na najlepszym staraniu wskazówki ścieżek docelowych
  wyprowadzone przez hosta dla dobrze znanych kopert narzędzi, takich jak `apply_patch`; gdy są obecne,
  te ścieżki mogą być niekompletne albo mogą nadmiernie przybliżać to, czego narzędzie
  faktycznie dotknie (na przykład przy zniekształconych lub częściowych danych wejściowych)
- opcjonalne `event.runId`
- opcjonalne `event.toolCallId`
- pola kontekstu, takie jak `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (ustawiane przy uruchomieniach sterowanych przez Cron), `ctx.toolKind`,
  `ctx.toolInputKind` i diagnostyczne `ctx.trace`

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
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Zachowanie strażników hooków dla typowanych hooków cyklu życia:

- `block: true` jest końcowe i pomija procedury obsługi o niższym priorytecie.
- `block: false` jest traktowane jak brak decyzji.
- `params` przepisuje parametry narzędzia do wykonania.
- `requireApproval` wstrzymuje uruchomienie agenta i pyta użytkownika przez zatwierdzenia pluginu.
  Polecenie `/approve` może zatwierdzać zarówno zatwierdzenia exec, jak i zatwierdzenia pluginów.
  W natywnych relayach `PreToolUse` trybu raportowania serwera aplikacji Codex jest to odroczone
  do pasującego żądania zatwierdzenia serwera aplikacji; zobacz [runtime uprzęży Codex](/pl/plugins/codex-harness-runtime#hook-boundaries).
- `block: true` z niższego priorytetu nadal może zablokować po tym, jak hook o wyższym priorytecie
  zażądał zatwierdzenia.
- `onResolution` otrzymuje rozwiązaną decyzję zatwierdzenia - `allow-once`,
  `allow-always`, `deny`, `timeout` albo `cancelled`.

Zobacz [Żądania uprawnień pluginów](/pl/plugins/plugin-permission-requests), aby poznać
routowanie zatwierdzeń, zachowanie decyzji i momenty, w których należy używać `requireApproval` zamiast
opcjonalnych narzędzi albo zatwierdzeń exec.

Pluginy, które potrzebują polityki na poziomie hosta, mogą rejestrować zaufane polityki narzędzi za pomocą
`api.registerTrustedToolPolicy(...)`. Działają one przed zwykłymi hookami
`before_tool_call` i przed normalnymi decyzjami hooków. Wbudowane zaufane
polityki działają jako pierwsze; zaufane polityki zainstalowanych pluginów działają później w kolejności ładowania pluginów;
zwykłe hooki `before_tool_call` działają po nich. Wbudowane pluginy zachowują
istniejącą ścieżkę zaufanych polityk. Zainstalowane pluginy muszą być jawnie włączone
i deklarować każdy identyfikator polityki w `contracts.trustedToolPolicies`; niezadeklarowane identyfikatory
są odrzucane przed rejestracją. Identyfikatory polityk są ograniczone do rejestrującego
pluginu, więc różne pluginy mogą ponownie używać tego samego lokalnego identyfikatora. Używaj tej warstwy tylko
do bram zaufanych przez hosta, takich jak polityka obszaru roboczego, egzekwowanie budżetu albo
bezpieczeństwo zastrzeżonych workflow.

### Hook środowiska exec

`resolve_exec_env` pozwala pluginom dodawać zmienne środowiskowe do wywołań narzędzia
`exec` po zbudowaniu bazowego środowiska exec i przed uruchomieniem
polecenia. Otrzymuje:

- `event.sessionKey`
- `event.toolName`, obecnie zawsze `"exec"`
- `event.host`, jedna z wartości `"gateway"`, `"sandbox"` albo `"node"`
- pola kontekstu, takie jak `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` i `ctx.channelId`

Zwróć `Record<string, string>`, aby scalić go ze środowiskiem exec. Procedury obsługi
działają w kolejności priorytetów, a późniejsze wyniki hooków nadpisują wcześniejsze wyniki hooków dla
tego samego klucza.

Dane wyjściowe hooka są filtrowane przez zasady kluczy środowiska wykonawczego hosta przed
scaleniem. Nieprawidłowe klucze, `PATH` oraz niebezpieczne klucze nadpisujące hosta, takie jak
`LD_*`, `DYLD_*`, `NODE_OPTIONS`, zmienne proxy i zmienne nadpisujące TLS
są odrzucane. Przefiltrowane środowisko Pluginu jest uwzględniane w metadanych zatwierdzeń/audytu Gateway
i przekazywane do żądań wykonania node-host.

### Trwałość wyników narzędzi

Wyniki narzędzi mogą zawierać strukturalne `details` na potrzeby renderowania UI, diagnostyki,
routingu mediów lub metadanych należących do Pluginu. Traktuj `details` jako metadane środowiska uruchomieniowego,
a nie treść promptu:

- OpenClaw usuwa `toolResult.details` przed ponownym odtworzeniem u providera i danymi wejściowymi Compaction,
  aby metadane nie stały się kontekstem modelu.
- Utrwalone wpisy sesji zachowują tylko ograniczone `details`. Zbyt duże details są
  zastępowane zwartym podsumowaniem i `persistedDetailsTruncated: true`.
- `tool_result_persist` i `before_message_write` działają przed końcowym
  limitem trwałości. Hooki nadal powinny utrzymywać zwracane `details` małe i unikać
  umieszczania tekstu istotnego dla promptu wyłącznie w `details`; dane wyjściowe narzędzia widoczne dla modelu
  umieszczaj w `content`.

## Hooki promptu i modelu

Dla nowych Pluginów używaj hooków specyficznych dla faz:

- `before_model_resolve`: otrzymuje tylko bieżący prompt i metadane załączników.
  Zwraca `providerOverride` lub `modelOverride`.
- `agent_turn_prepare`: otrzymuje bieżący prompt, przygotowane wiadomości sesji
  oraz wszelkie dokładnie-jednorazowe kolejkowane wstrzyknięcia opróżnione dla tej sesji. Zwraca
  `prependContext` lub `appendContext`.
- `before_prompt_build`: otrzymuje bieżący prompt i wiadomości sesji.
  Zwraca `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` lub `appendSystemContext`.
- `heartbeat_prompt_contribution`: działa tylko dla tur Heartbeat i zwraca
  `prependContext` lub `appendContext`. Jest przeznaczony dla monitorów w tle,
  które muszą podsumować bieżący stan bez zmieniania tur zainicjowanych przez użytkownika.

`before_agent_start` pozostaje ze względu na zgodność. Preferuj powyższe jawne hooki,
aby Twój Plugin nie zależał od starszej połączonej fazy.

`before_agent_run` działa po zbudowaniu promptu i przed dowolnymi danymi wejściowymi modelu,
w tym lokalnym dla promptu ładowaniem obrazów i obserwacją `llm_input`. Otrzymuje
bieżące dane wejściowe użytkownika jako `prompt`, a także załadowaną historię sesji w `messages`
i aktywny prompt systemowy. Zwróć `{ outcome: "block", reason, message? }`,
aby zatrzymać uruchomienie, zanim model będzie mógł odczytać prompt. `reason` jest wewnętrzne;
`message` jest zamiennikiem widocznym dla użytkownika. Jedynymi obsługiwanymi wynikami są
`pass` i `block`; nieobsługiwane kształty decyzji kończą się bezpiecznym zamknięciem.

Gdy uruchomienie zostanie zablokowane, OpenClaw przechowuje tylko tekst zastępczy w
`message.content` oraz niewrażliwe metadane blokady, takie jak identyfikator blokującego Pluginu
i znacznik czasu. Oryginalny tekst użytkownika nie jest zachowywany w transkrypcie ani przyszłym
kontekście. Wewnętrzne powody blokady są traktowane jako wrażliwe i wykluczane z
transkryptu, historii, transmisji, dziennika i ładunków diagnostycznych. Obserwowalność
powinna używać oczyszczonych pól, takich jak identyfikator blokującego, wynik, znacznik czasu lub bezpieczna
kategoria.

`before_agent_start` i `agent_end` zawierają `event.runId`, gdy OpenClaw może
zidentyfikować aktywne uruchomienie. Ta sama wartość jest również dostępna w `ctx.runId`.
Uruchomienia sterowane przez Cron udostępniają także `ctx.jobId` (identyfikator źródłowego zadania Cron), aby
hooki Pluginu mogły ograniczać metryki, efekty uboczne lub stan do konkretnego zaplanowanego
zadania.

Dla uruchomień pochodzących z kanału `ctx.channel` i `ctx.messageProvider` identyfikują
powierzchnię providera, taką jak `discord` lub `telegram`, a `ctx.channelId` jest
identyfikatorem docelowej konwersacji, gdy OpenClaw może go wyprowadzić z klucza sesji
lub metadanych dostarczenia.

Gdy tożsamość nadawcy jest dostępna, konteksty hooków agenta zawierają również:

- `ctx.senderId` — ID nadawcy w zakresie kanału (np. Feishu `open_id`, ID użytkownika Discord).
  Wypełniane, gdy uruchomienie pochodzi z wiadomości użytkownika ze znanymi
  metadanymi nadawcy.
- `ctx.chatId` — natywny dla transportu identyfikator konwersacji (np. Feishu
  `chat_id`, Telegram `chat_id`). Wypełniane, gdy kanał źródłowy
  zapewnia natywne ID konwersacji.
- `ctx.channelContext.sender.id` — to samo ID nadawcy co `ctx.senderId`, w
  obiekcie należącym do kanału, który Pluginy mogą rozszerzać o pola specyficzne dla kanału.
- `ctx.channelContext.chat.id` — to samo ID konwersacji co `ctx.chatId`, w
  obiekcie należącym do kanału, który Pluginy mogą rozszerzać o pola specyficzne dla kanału.

Core definiuje tylko zagnieżdżone pola `id`. Pluginy kanałów, które przekazują bogatsze
metadane nadawcy lub czatu przez helper wejściowy, mogą rozszerzać
`PluginHookChannelSenderContext` lub `PluginHookChannelChatContext` z
`openclaw/plugin-sdk/channel-inbound`:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Pluginy kanałów przekazują te pola przez helper inbound SDK:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Te pola są opcjonalne i nieobecne dla uruchomień pochodzących z systemu (Heartbeat,
Cron, exec-event).

`ctx.senderExternalId` pozostaje przestarzałym polem zgodności źródłowej dla
starszych Pluginów. Core go nie wypełnia; nowe tożsamości nadawców specyficzne dla kanału
powinny znajdować się pod `ctx.channelContext.sender` przez rozszerzanie modułu.

`agent_end` jest hookiem obserwacyjnym. Ścieżki Gateway i trwałego harnessu uruchamiają go
w trybie fire-and-forget po turze, natomiast krótkotrwałe jednorazowe ścieżki CLI czekają na
obietnicę hooka przed czyszczeniem procesu, aby zaufane Pluginy mogły opróżnić terminalową
obserwowalność lub przechwycić stan. Runner hooków stosuje limit czasu 30 sekund, aby
zawieszony Plugin lub osadzony endpoint nie mógł pozostawić obietnicy hooka oczekującej
bez końca. Limit czasu jest logowany, a OpenClaw kontynuuje; nie anuluje
pracy sieciowej należącej do Pluginu, chyba że Plugin używa również własnego sygnału przerwania.

Używaj `model_call_started` i `model_call_ended` do telemetrii wywołań providera,
która nie powinna otrzymywać surowych promptów, historii, odpowiedzi, nagłówków, treści żądań
ani identyfikatorów żądań providera. Te hooki zawierają stabilne metadane, takie jak
`runId`, `callId`, `provider`, `model`, opcjonalne `api`/`transport`, końcowe
`durationMs`/`outcome` oraz `upstreamRequestIdHash`, gdy OpenClaw może wyprowadzić
ograniczony hash identyfikatora żądania providera. Gdy środowisko uruchomieniowe rozwiąże metadane
okna kontekstu, zdarzenie i kontekst hooka zawierają także `contextTokenBudget`,
efektywny budżet tokenów po limitach modelu/konfiguracji/agenta, a także
`contextWindowSource` i `contextWindowReferenceTokens`, gdy zastosowano niższy limit.

`before_agent_finalize` działa tylko wtedy, gdy harness ma zaakceptować naturalną
końcową odpowiedź asystenta. Nie jest to ścieżka anulowania `/stop` i nie
działa, gdy użytkownik przerywa turę. Zwróć `{ action: "revise", reason }`, aby poprosić
harness o jeszcze jedno przejście modelu przed finalizacją, `{ action:
"finalize", reason? }`, aby wymusić finalizację, albo pomiń wynik, aby kontynuować.
Natywne hooki `Stop` Codex są przekazywane do tego hooka jako decyzje OpenClaw
`before_agent_finalize`.

Zwracając `action: "revise"`, Pluginy mogą dołączyć metadane `retry`, aby
dodatkowe przejście modelu było ograniczone i bezpieczne przy ponownym odtwarzaniu:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` jest dołączane do powodu rewizji wysyłanego do harnessu.
`idempotencyKey` pozwala hostowi zliczać ponowienia dla tego samego żądania Pluginu w ramach
równoważnych decyzji finalizacji, a `maxAttempts` ogranicza liczbę dodatkowych przejść, które
host dopuści przed kontynuowaniem z naturalną końcową odpowiedzią.

Niebundlowane Pluginy, które potrzebują surowych hooków konwersacji (`before_model_resolve`,
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

Hooki modyfikujące prompt i trwałe wstrzyknięcia na następną turę można wyłączyć dla danego Pluginu
za pomocą `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Rozszerzenia sesji i wstrzyknięcia na następną turę

Pluginy workflow mogą utrwalać mały, zgodny z JSON stan sesji za pomocą
`api.registerSessionExtension(...)` i aktualizować go przez metodę Gateway
`sessions.pluginPatch`. Wiersze sesji projektują zarejestrowany stan rozszerzeń
przez `pluginExtensions`, pozwalając Control UI i innym klientom renderować
status należący do Pluginu bez poznawania jego wewnętrznych szczegółów.

Używaj `api.enqueueNextTurnInjection(...)`, gdy Plugin potrzebuje trwałego kontekstu,
który ma dotrzeć do następnej tury modelu dokładnie raz. OpenClaw opróżnia kolejkowane wstrzyknięcia przed
hookami promptu, odrzuca wygasłe wstrzyknięcia i deduplikuje według `idempotencyKey`
dla każdego Pluginu. To właściwa granica dla wznowień zatwierdzeń, podsumowań zasad,
delt monitorów w tle i kontynuacji poleceń, które powinny być widoczne dla
modelu w następnej turze, ale nie powinny stawać się trwałym tekstem promptu systemowego.

Semantyka czyszczenia jest częścią kontraktu. Callbacki czyszczenia rozszerzeń sesji i
cyklu życia środowiska uruchomieniowego otrzymują `reset`, `delete`, `disable` lub
`restart`. Host usuwa trwały stan rozszerzenia sesji należący do danego Pluginu
oraz oczekujące wstrzyknięcia na następną turę dla reset/delete/disable; restart zachowuje
trwały stan sesji, a callbacki czyszczenia pozwalają Pluginom zwolnić zadania harmonogramu,
kontekst uruchomienia i inne zasoby poza pasmem dla starej generacji środowiska uruchomieniowego.

## Hooki wiadomości

Używaj hooków wiadomości do routingu na poziomie kanału i zasad dostarczania:

- `message_received`: obserwuje treść przychodzącą, nadawcę, `threadId`, `messageId`,
  `senderId`, opcjonalną korelację uruchomienia/sesji oraz metadane.
- `message_sending`: przepisuje `content` albo zwraca `{ cancel: true }`.
- `reply_payload_sending`: przepisuje znormalizowane obiekty `ReplyPayload` (w tym
  `presentation`, `delivery`, odwołania do mediów i tekst) albo zwraca `{ cancel: true }`.
- `message_sent`: obserwuje końcowy sukces lub niepowodzenie.

Dla odpowiedzi TTS wyłącznie audio `content` może zawierać ukryty wypowiadany transkrypt,
nawet gdy ładunek kanału nie ma widocznego tekstu/podpisu. Przepisanie tego
`content` aktualizuje tylko transkrypt widoczny dla hooka; nie jest renderowane jako
podpis mediów.

Zdarzenia `reply_payload_sending` mogą zawierać `usageState`, najlepszy dostępny bieżący
snapshot modelu/użycia/kontekstu dla danej tury. Trwałe dostarczenie, odzyskane ponowne odtworzenie i
odpowiedzi bez dokładnej korelacji uruchomienia pomijają go.

Konteksty hooków wiadomości udostępniają stabilne pola korelacji, gdy są dostępne:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` i `ctx.callDepth`. Konteksty inbound
oraz `before_dispatch` udostępniają także metadane odpowiedzi, gdy kanał ma
dane cytowanej wiadomości przefiltrowane pod kątem widoczności: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` i `replyToIsQuote`. Preferuj te pola pierwszej klasy
przed odczytem starszych metadanych.

Preferuj typowane pola `threadId` i `replyToId` przed użyciem metadanych specyficznych dla kanału.

Reguły decyzji:

- `message_sending` z `cancel: true` jest terminalne.
- `message_sending` z `cancel: false` jest traktowane jako brak decyzji.
- Przepisane `content` przechodzi dalej do hooków o niższym priorytecie, chyba że późniejszy hook
  anuluje dostarczenie.
- `reply_payload_sending` działa po normalizacji payloadu i przed dostarczeniem przez kanał,
  w tym dla odpowiedzi kierowanych z powrotem do kanału źródłowego. Procedury obsługi
  uruchamiają się sekwencyjnie, a każda procedura obsługi widzi najnowszy payload utworzony przez
  procedury obsługi o wyższym priorytecie.
- Payloady `reply_payload_sending` nie ujawniają znaczników zaufania środowiska uruchomieniowego, takich jak
  `trustedLocalMedia`; pluginy mogą edytować kształt payloadu, ale nie mogą przyznać zaufania do lokalnych
  multimediów.
- `message_sending` może zwrócić `cancelReason` i ograniczone `metadata` wraz z
  anulowaniem. Nowe API cyklu życia wiadomości ujawniają to jako wstrzymany wynik dostarczenia
  z powodem `cancelled_by_message_sending_hook`; starsze bezpośrednie
  dostarczanie nadal zwraca pustą tablicę wyników dla zgodności.
- `message_sent` służy wyłącznie do obserwacji. Awarie procedur obsługi są rejestrowane i nie
  zmieniają wyniku dostarczenia.

## Hooki instalacji

Użyj `security.installPolicy` do decyzji zezwalania/blokowania należących do operatora. Ta
polityka działa z konfiguracji OpenClaw, obejmuje ścieżki instalacji i aktualizacji w CLI oraz blokuje
domyślnie, gdy jest włączona, ale niedostępna.

`before_install` to hook cyklu życia środowiska uruchomieniowego pluginu. Działa po
`security.installPolicy` tylko w procesie OpenClaw, w którym hooki pluginów zostały już
załadowane, na przykład w przepływach instalacji opartych na Gateway. Przydaje się do
obserwacji, ostrzeżeń i kontroli zgodności należących do pluginu, ale nie jest
podstawową granicą bezpieczeństwa przedsiębiorstwa ani hosta dla instalacji. Pole `builtinScan`
pozostaje w payloadzie zdarzenia dla zgodności, ale OpenClaw nie uruchamia już
wbudowanego blokowania niebezpiecznego kodu w czasie instalacji, więc jest to pusty wynik `ok`.
Zwróć dodatkowe ustalenia albo `{ block: true, blockReason }`, aby zatrzymać
instalację w tym procesie.

`block: true` jest terminalne. `block: false` jest traktowane jako brak decyzji.
Awarie procedur obsługi blokują instalację w trybie domyślnej blokady przy błędzie.

## Cykl życia Gateway

Użyj `gateway_start` dla usług pluginów, które potrzebują stanu należącego do Gateway. Kontekst
udostępnia `ctx.config`, `ctx.workspaceDir` oraz `ctx.getCron?.()` do
sprawdzania i aktualizowania cron. Użyj `gateway_stop`, aby wyczyścić długo działające
zasoby.

Nie polegaj na wewnętrznym hooku `gateway:startup` dla usług środowiska uruchomieniowego
należących do pluginu.

`cron_changed` uruchamia się dla zdarzeń cyklu życia cron należących do gateway, z typowanym
payloadem zdarzenia obejmującym powody `added`, `updated`, `removed`, `started`, `finished`
i `scheduled`. Zdarzenie niesie snapshot `PluginHookGatewayCronJob`
(w tym `state.nextRunAtMs`, `state.lastRunStatus` oraz
`state.lastError`, gdy jest obecne) oraz `PluginHookGatewayCronDeliveryStatus`
o wartości `not-requested` | `delivered` | `not-delivered` | `unknown`. Zdarzenia usunięcia
nadal niosą snapshot usuniętego zadania, aby zewnętrzne harmonogramy mogły
uzgodnić stan. Używaj `ctx.getCron?.()` i `ctx.config` z kontekstu środowiska
uruchomieniowego podczas synchronizowania zewnętrznych harmonogramów wybudzania i utrzymuj OpenClaw jako
źródło prawdy dla kontroli terminów i wykonywania.

## Nadchodzące wycofania

Kilka powierzchni powiązanych z hookami jest przestarzałych, ale nadal obsługiwanych. Przeprowadź migrację
przed następnym wydaniem głównym:

- **Koperty kanałów w tekście jawnym** w procedurach obsługi `inbound_claim` i `message_received`.
  Odczytuj `BodyForAgent` oraz ustrukturyzowane bloki kontekstu użytkownika
  zamiast parsować płaski tekst koperty. Zobacz
  [Koperty kanałów w tekście jawnym → BodyForAgent](/pl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** pozostaje dla zgodności. Nowe pluginy powinny używać
  `before_model_resolve` i `before_prompt_build` zamiast połączonej
  fazy.
- **`subagent_spawning`** pozostaje dla zgodności ze starszymi pluginami, ale
  nowe pluginy nie powinny zwracać z niego routingu wątku. Core przygotowuje
  wiązania subagentów `thread: true` przez adaptery wiązania sesji kanału
  przed uruchomieniem `subagent_spawned`.
- **`deactivate`** pozostaje jako przestarzały alias zgodności do czyszczenia do
  po 2026-08-16. Nowe pluginy powinny używać `gateway_stop`.
- **`onResolution` w `before_tool_call`** używa teraz typowanej
  unii `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) zamiast swobodnego `string`.

Pełną listę - rejestrację możliwości pamięci, profil myślenia providera,
zewnętrznych providerów uwierzytelniania, typy wykrywania providerów, akcesory środowiska uruchomieniowego
zadań oraz zmianę nazwy `command-auth` → `command-status` - znajdziesz w
[Migracja Plugin SDK → Aktywne wycofania](/pl/plugins/sdk-migration#active-deprecations).

## Powiązane

- [Migracja Plugin SDK](/pl/plugins/sdk-migration) - aktywne wycofania i harmonogram usunięcia
- [Budowanie pluginów](/pl/plugins/building-plugins)
- [Omówienie Plugin SDK](/pl/plugins/sdk-overview)
- [Punkty wejścia pluginu](/pl/plugins/sdk-entrypoints)
- [Wewnętrzne hooki](/pl/automation/hooks)
- [Wewnętrzna architektura pluginów](/pl/plugins/architecture-internals)
