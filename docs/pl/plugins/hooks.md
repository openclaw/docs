---
read_when:
    - Tworzysz plugin, który wymaga haków before_tool_call, before_agent_reply, haków wiadomości lub haków cyklu życia
    - Trzeba blokować, przepisywać lub wymagać zatwierdzenia wywołań narzędzi z pluginu
    - Wybór między hookami wewnętrznymi a hookami pluginów
    - Rzutujesz wybudzenia Cron OpenClaw na zewnętrzny harmonogram hosta
summary: 'Hooki Pluginu: przechwytywanie zdarzeń cyklu życia agenta, narzędzia, wiadomości, sesji i Gatewaya'
title: Hooki Pluginów
x-i18n:
    generated_at: "2026-07-16T18:48:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4e94220bca59b710b7b46c87bb889942c88b0d44f723e7133f271d34d9c929
    source_path: plugins/hooks.md
    workflow: 16
---

Punkty zaczepienia Pluginów to działające w procesie punkty rozszerzeń dla Pluginów OpenClaw: umożliwiają inspekcję lub
zmianę przebiegów agentów, wywołań narzędzi, przepływu wiadomości, cyklu życia sesji, routingu
podagentów, instalacji lub uruchamiania Gateway.

Zamiast tego użyj [wewnętrznych punktów zaczepienia](/pl/automation/hooks) dla niewielkiego skryptu
`HOOK.md` zainstalowanego przez operatora, który reaguje na zdarzenia poleceń i Gateway, takie jak `/new`,
`/reset`, `/stop`, `agent:bootstrap` lub `gateway:startup`.

## Szybki start

Zarejestruj typowane punkty zaczepienia za pomocą `api.on(...)` w punkcie wejścia Pluginu:

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
            title: "Uruchom wyszukiwanie w internecie",
            description: `Zezwól na zapytanie wyszukiwania: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Procedury obsługi, które mogą zwracać decyzje lub modyfikacje, są wykonywane sekwencyjnie w
malejącej kolejności `priority`; procedury o tym samym priorytecie zachowują kolejność rejestracji.
Procedury służące wyłącznie do obserwacji działają równolegle, a wysyłanie obserwacji
bez oczekiwania na wynik może nakładać się na późniejsze zdarzenia. Nie używaj priorytetu do porządkowania
efektów ubocznych obserwacji.

`api.on(name, handler, opts?)` przyjmuje:

| Opcja      | Efekt                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Kolejność; wyższa wartość jest wykonywana jako pierwsza.                                                                                                                                                                      |
| `timeoutMs` | Limit czasu oczekiwania dla danego punktu zaczepienia. Po jego upływie OpenClaw przestaje oczekiwać na tę procedurę obsługi i przechodzi dalej. Nie anuluje procedury ani jej efektów ubocznych. Pominięcie powoduje użycie domyślnego limitu czasu wykonawcy dla danego punktu zaczepienia. |

Operatorzy mogą ustawiać limity czasu punktów zaczepienia bez modyfikowania kodu Pluginu:

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

`hooks.timeouts.<hookName>` zastępuje `hooks.timeoutMs`, które zastępuje
wartość `api.on(..., { timeoutMs })` określoną przez autora Pluginu. Każda wartość musi być
dodatnią liczbą całkowitą nie większą niż 600000 ms. Dla punktów zaczepienia, o których wiadomo, że działają wolno,
preferuj indywidualne wartości, aby jeden Plugin nie otrzymywał wszędzie dłuższego limitu.

Obietnica procedury obsługi, której limit czasu upłynął, nadal działa, ponieważ wywołania zwrotne punktów zaczepienia nie
otrzymują sygnału anulowania. Mechanizm wysyłania punktu zaczepienia może zwolnić przydzielony dostęp do Gateway,
gdy praca tego Pluginu nadal trwa. Pluginy zarządzające
długotrwałą pracą muszą zapewniać własny cykl życia anulowania i zamykania.

Modyfikujące wychodzące punkty zaczepienia `message_sending` i `reply_payload_sending` używają
domyślnego limitu 15 sekund na procedurę obsługi. Jeśli limit jednej z nich upłynie, OpenClaw rejestruje błąd Pluginu
i kontynuuje z najnowszym ładunkiem, aby serializowany kanał dostarczania mógł
zakończyć pracę. Dla Pluginów, które celowo wykonują wolniejszą pracę
przed dostarczeniem, ustaw większy limit dla danego punktu zaczepienia.

Pluginy kanałów używające `createReplyDispatcher` mogą analogicznie zadeklarować większy
dodatni limit dla etapu za pomocą `beforeDeliverOptions: { timeoutMs }` albo podczas
dołączania pracy za pomocą `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`.
Bez limitu zadeklarowanego przez właściciela te wywołania zwrotne używają tego samego domyślnego limitu
15 sekund, aby zawieszone wywołanie nie mogło blokować serializowanego kanału dostarczania.

Każdy punkt zaczepienia otrzymuje `event.context.pluginConfig`, czyli rozwiązaną konfigurację
Pluginu, który zarejestrował daną procedurę obsługi. OpenClaw wstrzykuje ją osobno dla każdej procedury bez
modyfikowania współdzielonego obiektu zdarzenia widocznego dla innych Pluginów.

## Katalog punktów zaczepienia

Punkty zaczepienia są pogrupowane według rozszerzanej powierzchni. Nazwy zapisane **pogrubieniem** przyjmują wynik
decyzji (zablokowanie, anulowanie, zastąpienie lub wymaganie zatwierdzenia); pozostałe służą
wyłącznie do obserwacji.

**Tura agenta**

| Punkt zaczepienia                            | Przeznaczenie                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Zastąpienie dostawcy lub modelu przed wczytaniem wiadomości sesji                                  |
| `agent_turn_prepare`            | Pobranie zakolejkowanych wstrzyknięć tury Pluginu i dodanie kontekstu tej samej tury przed punktami zaczepienia promptu      |
| `before_prompt_build`           | Dodanie dynamicznego kontekstu lub tekstu promptu systemowego przed wywołaniem modelu                          |
| `before_agent_start`            | Połączona faza wyłącznie na potrzeby zgodności; preferowane są dwa powyższe punkty zaczepienia                            |
| **`before_agent_run`**          | Inspekcja końcowego promptu i wiadomości sesji przed przesłaniem do modelu; może zablokować przebieg |
| **`before_agent_reply`**        | Pominięcie tury modelu przez zwrócenie syntetycznej odpowiedzi lub ciszy                           |
| **`before_agent_finalize`**     | Inspekcja naturalnej odpowiedzi końcowej i zażądanie jeszcze jednego przebiegu modelu                         |
| `agent_end`                     | Obserwowanie wiadomości końcowych, stanu powodzenia i czasu trwania przebiegu                                  |
| `heartbeat_prompt_contribution` | Dodanie kontekstu wyłącznie dla Heartbeat na potrzeby Pluginów monitorowania w tle i cyklu życia                  |

**Obserwacja konwersacji**

| Punkt zaczepienia                                      | Przeznaczenie                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | Oczyszczone metadane wywołania dostawcy/modelu: czas, wynik, skróty identyfikatorów żądań o ograniczonej długości. Bez treści promptu ani odpowiedzi. |
| `llm_input`                               | Dane wejściowe dostawcy: prompt systemowy, prompt, historia                                                                     |
| `llm_output`                              | Dane wyjściowe dostawcy, użycie oraz rozwiązane `contextTokenBudget`, gdy jest dostępne                                       |

**Narzędzia**

| Punkt zaczepienia                       | Przeznaczenie                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | Przepisanie parametrów narzędzia, zablokowanie wykonania lub wymaganie zatwierdzenia |
| `after_tool_call`          | Obserwowanie wyników narzędzia, błędów i czasu trwania                |
| `resolve_exec_env`         | Dodanie zmiennych środowiskowych należących do Pluginu do `exec`   |
| **`tool_result_persist`**  | Przepisanie wiadomości asystenta utworzonej na podstawie wyniku narzędzia |
| **`before_message_write`** | Inspekcja lub zablokowanie trwającego zapisu wiadomości (rzadkie)      |

**Wiadomości i dostarczanie**

| Punkt zaczepienia                            | Przeznaczenie                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | Przejęcie wiadomości przychodzącej przed routingiem agenta (odpowiedzi syntetyczne) |
| **`channel_pairing_requested`** | Obserwowanie nowo utworzonych żądań parowania wiadomości bezpośrednich                         |
| `message_received`              | Obserwowanie treści przychodzącej, nadawcy, wątku i metadanych             |
| **`message_sending`**           | Przepisanie treści wychodzącej lub anulowanie dostarczenia                       |
| **`reply_payload_sending`**     | Modyfikacja lub anulowanie znormalizowanych ładunków odpowiedzi przed dostarczeniem        |
| `message_sent`                  | Obserwowanie powodzenia lub niepowodzenia dostarczenia wychodzącego                      |
| **`before_dispatch`**           | Inspekcja lub przepisanie wychodzącej wysyłki przed przekazaniem kanałowi    |
| **`reply_dispatch`**            | Udział w końcowym potoku wysyłania odpowiedzi                  |

**Sesje i Compaction**

| Punkt zaczepienia                                     | Przeznaczenie                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | Śledzenie granic cyklu życia sesji. `reason` jest jednym z `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart` lub `unknown`. `shutdown`/`restart` są wyzwalane przez finalizator zamykania Gateway, gdy proces zatrzymuje się lub uruchamia ponownie przy aktywnych sesjach, dzięki czemu Pluginy (pamięć, magazyny transkrypcji) mogą finalizować osierocone wiersze zamiast pozostawiać je otwarte między ponownymi uruchomieniami. Finalizator ma ograniczony czas działania, aby wolny Plugin nie mógł blokować SIGTERM/SIGINT. |
| `before_compaction` / `after_compaction` | Obserwowanie lub opisywanie cykli Compaction                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | Obserwowanie zdarzeń resetowania sesji (`/reset`, resetowania programowe)                                                                                                                                                                                                                                                                                                                                                                                                     |

**Podagenci**

- `subagent_spawned` / `subagent_ended` — obserwowanie uruchomienia i zakończenia subagenta.
- `subagent_delivery_target` — mechanizm zgodności do dostarczania informacji o zakończeniu, gdy żadne powiązanie sesji rdzenia nie może wyznaczyć trasy.
- `subagent_spawning` — przestarzały mechanizm zgodności. Rdzeń przygotowuje teraz powiązania subagentów `thread: true` za pośrednictwem adapterów powiązań sesji kanału przed wywołaniem `subagent_spawned`.
- `subagent_spawned` zawiera `resolvedModel` i `resolvedProvider`, gdy OpenClaw rozpozna natywny model sesji podrzędnej przed uruchomieniem.
- `subagent_ended` zawiera `targetSessionKey` (tożsamość — odpowiada `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` lub `"acp"`), `reason`, opcjonalne `outcome` (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"` lub `"deleted"`), opcjonalne `error`, `runId`, `endedAt`, `accountId` i `sendFarewell`. **Nie** zawiera `agentId` ani `childSessionKey`; do skorelowania z odpowiadającym zdarzeniem `subagent_spawned` należy użyć `targetSessionKey`.

**Cykl życia**

| Mechanizm                             | Przeznaczenie                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Uruchamianie lub zatrzymywanie wraz z Gateway usług należących do pluginu                                                 |
| `deactivate`                     | Przestarzały alias zgodności dla `gateway_stop`; w nowych pluginach należy używać `gateway_stop`                 |
| `cron_reconciled`                | Uzgadnianie z pełnym stanem Cron Gateway po uruchomieniu lub ponownym wczytaniu                            |
| `cron_changed`                   | Obserwowanie zmian cyklu życia Cron zarządzanego przez Gateway (dodano, zaktualizowano, usunięto, uruchomiono, zakończono, zaplanowano) |
| **`before_install`**             | Sprawdzanie przygotowanych materiałów instalacyjnych Skills lub pluginu z wczytanego środowiska uruchomieniowego pluginu                         |

### Żądania parowania kanału

Należy użyć `channel_pairing_requested`, gdy plugin musi powiadomić operatora lub
zapisać rekord audytu po utworzeniu oczekującego żądania parowania przez
niesparowanego nadawcę wiadomości prywatnej. Mechanizm jest wywoływany po utworzeniu żądania;
powolne lub zawodzące procedury obsługi mechanizmu nie opóźniają dostarczenia
odpowiedzi dotyczącej parowania w kanale.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `Nowe żądanie parowania ${event.channel} od ${event.senderId}: ${event.code}`,
  });
});
```

Mechanizm służy wyłącznie do obserwacji. Nie zatwierdza, nie odrzuca, nie pomija ani nie modyfikuje
odpowiedzi dotyczącej parowania. Ładunek zawiera kanał, opcjonalne `accountId`,
`senderId` o zakresie kanału, `code` parowania oraz metadane kanału. Kod
parowania należy traktować jako aktywne, jednorazowe poświadczenie zatwierdzające i dostarczać go wyłącznie do
zaufanego miejsca docelowego operatora. `metadata` należy traktować jako niezaufany tekst tożsamości
podany przez nadawcę. Mechanizm nie zawiera treści ani multimediów wiadomości przychodzącej.

## Mechanizmy debugowania środowiska uruchomieniowego

Należy użyć `before_model_resolve`, aby przełączyć dostawcę lub model dla tury agenta —
działa on przed rozpoznaniem modelu. `llm_output` działa dopiero po wygenerowaniu
odpowiedzi asystenta przez próbę użycia modelu.

Aby potwierdzić model obowiązujący w sesji, należy sprawdzić rejestracje środowiska uruchomieniowego, a następnie
użyć `openclaw sessions` lub powierzchni sesji/statusu Gateway. Aby debugować
ładunki dostawcy, należy uruchomić Gateway z `--raw-stream` i
`--raw-stream-path <path>`, aby zapisywać nieprzetworzone zdarzenia strumienia modelu w pliku jsonl.

## Zasady wywoływania narzędzi

`before_tool_call` otrzymuje:

- `event.toolName`
- `event.params`
- opcjonalne `event.toolKind` i `event.toolInputKind`, autorytatywne po stronie hosta
  rozróżniacze narzędzi, które celowo mają te same nazwy; na przykład zewnętrzne
  wywołania `exec` w trybie kodu używają `toolKind: "code_mode_exec"` i zawierają
  `toolInputKind: "javascript" | "typescript"`, gdy język wejściowy jest
  znany
- opcjonalne `event.derivedPaths`, ustalane przez hosta w miarę możliwości wskazówki dotyczące ścieżek docelowych
  dla znanych kopert narzędzi, takich jak `apply_patch`; ścieżki te mogą być
  niepełne lub nadmiernie przybliżać faktyczny zakres działania narzędzia (na
  przykład w przypadku nieprawidłowych lub częściowych danych wejściowych)
- opcjonalne `event.runId`
- opcjonalne `event.toolCallId`
- pola kontekstu, takie jak `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind` oraz diagnostyczne `ctx.trace`

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
    /** @deprecated Nierozstrzygnięte zatwierdzenia zawsze skutkują odmową. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Działanie zabezpieczeń dla typowanych mechanizmów cyklu życia:

- `block: true` jest końcowe i pomija procedury obsługi o niższym priorytecie.
- `block: false` jest traktowane jako brak decyzji.
- `params` modyfikuje parametry narzędzia używane podczas wykonania.
- `requireApproval` wstrzymuje działanie agenta i prosi użytkownika o decyzję za pośrednictwem
  zatwierdzeń pluginu. `/approve` może zatwierdzać zarówno operacje exec, jak i zatwierdzenia pluginu. W natywnych
  przekaźnikach `PreToolUse` trybu raportowania serwera aplikacji Codex mechanizm ten przekazuje obsługę do
  odpowiadającego żądania zatwierdzenia serwera aplikacji; zobacz
  [środowisko uruchomieniowe uprzęży Codex](/pl/plugins/codex-harness-runtime#hook-boundaries).
- `block: true` o niższym priorytecie nadal może zablokować operację po zażądaniu zatwierdzenia przez mechanizm
  o wyższym priorytecie.
- `onResolution` otrzymuje rozstrzygniętą decyzję: `allow-once`, `allow-always`,
  `deny`, `timeout` lub `cancelled`.

Informacje o kierowaniu zatwierdzeń, działaniu decyzji oraz przypadkach użycia `requireApproval`
zamiast opcjonalnych narzędzi lub zatwierdzeń exec znajdują się w sekcji
[Żądania uprawnień pluginu](/pl/plugins/plugin-permission-requests).

Pluginy wymagające zasad na poziomie hosta mogą rejestrować zaufane zasady narzędzi za pomocą
`api.registerTrustedToolPolicy(...)`. Są one wykonywane przed zwykłymi
mechanizmami `before_tool_call` i przed normalnymi decyzjami mechanizmów. Wbudowane zaufane
zasady są wykonywane jako pierwsze; zaufane zasady zainstalowanych pluginów są wykonywane następnie, zgodnie z kolejnością
wczytywania pluginów; zwykłe mechanizmy `before_tool_call` są wykonywane po nich. Wbudowane pluginy zachowują
istniejącą ścieżkę zaufanych zasad. Zainstalowane pluginy muszą być jawnie włączone
i deklarować każdy identyfikator zasady w `contracts.trustedToolPolicies`; niezadeklarowane identyfikatory
są odrzucane przed rejestracją. Identyfikatory zasad mają zakres pluginu, który je rejestruje,
dzięki czemu różne pluginy mogą używać tego samego identyfikatora lokalnego. Tego poziomu należy używać wyłącznie
do zaufanych przez hosta zabezpieczeń, takich jak zasady obszaru roboczego, egzekwowanie budżetu lub
bezpieczeństwo zastrzeżonych przepływów pracy.

### Mechanizm środowiska exec

`resolve_exec_env` umożliwia pluginom dodawanie zmiennych środowiskowych do wywołań narzędzia
`exec` przed uruchomieniem polecenia. Otrzymuje:

- `event.sessionKey`
- `event.toolName`, obecnie zawsze `"exec"`
- `event.host`, jedno z `"gateway"`, `"sandbox"` lub `"node"`
- pola kontekstu, takie jak `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider` i `ctx.channelId`

Należy zwrócić `Record<string, string>`, aby scalić je ze środowiskiem exec. Procedury obsługi
są wykonywane według priorytetu; późniejsze wyniki zastępują wcześniejsze wyniki dla tego samego
klucza.

Przed scaleniem dane wyjściowe mechanizmu są filtrowane zgodnie z zasadami hosta dotyczącymi kluczy środowiska exec.
`PATH` jest zawsze usuwane (zależą od niego rozpoznawanie poleceń i kontrole
bezpiecznych plików binarnych). Nieprawidłowe klucze i niebezpieczne klucze zastępujące ustawienia hosta, takie jak `LD_*`,
`DYLD_*`, `NODE_OPTIONS`, zmienne serwera proxy (`HTTP_PROXY`, `HTTPS_PROXY`,
`ALL_PROXY`, `NO_PROXY`) oraz zmienne zastępujące ustawienia TLS (`NODE_TLS_REJECT_UNAUTHORIZED`,
`SSL_CERT_FILE` i podobne) są usuwane. Przefiltrowane środowisko pluginu jest uwzględniane
w metadanych zatwierdzeń/audytu Gateway i przekazywane do żądań wykonania na hoście Node.

### Utrwalanie wyników narzędzi

Wyniki narzędzi mogą zawierać ustrukturyzowane `details` służące do renderowania interfejsu użytkownika, diagnostyki,
kierowania multimediów lub metadanych należących do pluginu. `details` należy traktować jako metadane środowiska uruchomieniowego,
a nie treść promptu:

- OpenClaw usuwa `toolResult.details` przed ponownym odtworzeniem u dostawcy i danymi wejściowymi
  Compaction, aby metadane nie stały się kontekstem modelu.
- Utrwalone wpisy sesji zachowują tylko `details` o ograniczonym rozmiarze. Nadmiernie duże szczegóły są
  zastępowane zwięzłym podsumowaniem i `persistedDetailsTruncated: true`.
- `tool_result_persist` i `before_message_write` są wykonywane przed zastosowaniem końcowego
  limitu utrwalania. Zwracane `details` powinno być małe; nie należy umieszczać
  tekstu istotnego dla promptu wyłącznie w `details`. Dane wyjściowe narzędzia widoczne dla modelu należy umieszczać w
  `content`.

## Mechanizmy promptów i modeli

W nowych pluginach należy używać mechanizmów właściwych dla poszczególnych faz:

- `before_model_resolve`: otrzymuje tylko bieżący prompt i metadane
  załączników. Należy zwrócić `providerOverride` lub `modelOverride`.
- `agent_turn_prepare`: otrzymuje bieżący prompt, przygotowane wiadomości
  sesji oraz wszelkie jednokrotnie kolejkowane wstrzyknięcia pobrane dla tej sesji.
  Należy zwrócić `prependContext` lub `appendContext`.
- `before_prompt_build`: otrzymuje bieżący prompt i wiadomości sesji.
  Należy zwrócić `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext` lub `appendSystemContext`.
- `heartbeat_prompt_contribution`: jest wykonywany wyłącznie dla tur Heartbeat i zwraca
  `prependContext` lub `appendContext`. Jest przeznaczony dla monitorów działających w tle, które
  muszą podsumowywać bieżący stan bez modyfikowania tur zainicjowanych przez użytkownika.

`before_agent_start` pozostaje dostępny dla zachowania zgodności. Zaleca się używanie jawnych mechanizmów
opisanych powyżej, aby plugin nie zależał od starszej, połączonej fazy.

`before_agent_run` jest wykonywany po utworzeniu promptu i przed wszelkimi danymi wejściowymi modelu,
w tym wczytywaniem obrazów lokalnych dla promptu i obserwacją `llm_input`. Otrzymuje
bieżące dane wejściowe użytkownika jako `prompt`, wczytaną historię sesji w `messages`
oraz aktywny prompt systemowy. Należy zwrócić `{ outcome: "block", reason, message? }`,
aby zatrzymać działanie, zanim model odczyta prompt. `reason` jest wewnętrzne;
`message` jest jego zamiennikiem widocznym dla użytkownika. Obsługiwane są wyłącznie wyniki `pass` i `block`;
nieobsługiwane struktury decyzji skutkują bezpieczną odmową.

Gdy działanie zostanie zablokowane, OpenClaw zapisuje wyłącznie tekst zastępczy w
`message.content` oraz niewrażliwe metadane blokady, takie jak identyfikator blokującego
pluginu i znacznik czasu. Oryginalny tekst użytkownika nie jest zachowywany w transkrypcji
ani w przyszłym kontekście. Wewnętrzne przyczyny blokady są traktowane jako poufne i
wykluczane z transkrypcji, historii, emisji, dzienników oraz ładunków diagnostycznych.
Do obserwowalności należy używać oczyszczonych pól, takich jak identyfikator blokującego, wynik,
znacznik czasu lub bezpieczna kategoria.

`before_agent_start` i `agent_end` zawierają `event.runId`, gdy OpenClaw może
zidentyfikować aktywne działanie; ta sama wartość znajduje się również w `ctx.runId`. Działania inicjowane przez
Cron udostępniają również `ctx.jobId` (identyfikator źródłowego zadania Cron) w kontekście tury
agenta, dzięki czemu mechanizmy mogą ograniczać metryki, efekty uboczne lub stan do konkretnego
zaplanowanego zadania. `ctx.jobId` nie jest częścią kontekstu narzędzia `before_tool_call`.

W przypadku uruchomień pochodzących z kanału `ctx.channel` i `ctx.messageProvider` identyfikują
powierzchnię dostawcy, taką jak `discord` lub `telegram`, natomiast `ctx.channelId` jest
identyfikatorem docelowej konwersacji, gdy OpenClaw może go wyprowadzić z
klucza sesji lub metadanych dostarczania.

Gdy tożsamość nadawcy jest dostępna, konteksty hooków agenta obejmują również:

- `ctx.senderId` — identyfikator nadawcy w zakresie kanału (np. Feishu `open_id`, identyfikator
  użytkownika Discord). Ustawiany, gdy uruchomienie pochodzi z wiadomości użytkownika ze znanymi
  metadanymi nadawcy.
- `ctx.chatId` — natywny dla transportu identyfikator konwersacji (np. Feishu
  `chat_id`, Telegram `chat_id`). Ustawiany, gdy kanał źródłowy
  udostępnia natywny identyfikator konwersacji.
- `ctx.channelContext.sender.id` — ten sam identyfikator nadawcy co `ctx.senderId`, umieszczony
  w obiekcie należącym do kanału, który pluginy mogą rozszerzać o pola specyficzne dla kanału.
- `ctx.channelContext.chat.id` — ten sam identyfikator konwersacji co `ctx.chatId`,
  umieszczony w obiekcie należącym do kanału, który pluginy mogą rozszerzać o pola
  specyficzne dla kanału.

Rdzeń definiuje wyłącznie zagnieżdżone pola `id`. Pluginy kanałów, które przekazują bogatsze
metadane nadawcy lub czatu przez pomocniczą funkcję ruchu przychodzącego, mogą rozszerzać
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

Pluginy kanałów przekazują te pola przez pomocniczą funkcję SDK ruchu przychodzącego:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Te pola są opcjonalne i nie występują w uruchomieniach pochodzących z systemu (heartbeat,
cron, zdarzenie exec).

`ctx.senderExternalId` pozostaje przestarzałym polem zgodności źródłowej dla
starszych pluginów. Rdzeń go nie ustawia; nowe tożsamości nadawców
specyficzne dla kanału powinny znajdować się w `ctx.channelContext.sender` dzięki
rozszerzaniu modułu.

`agent_end` jest hookiem obserwacyjnym. Ścieżki Gateway i trwałego środowiska uruchomieniowego wykonują
go po turze bez oczekiwania na wynik, natomiast krótkotrwałe, jednorazowe ścieżki CLI czekają
na obietnicę hooka przed wyczyszczeniem procesu, aby zaufane pluginy mogły opróżnić
końcowe dane obserwowalności lub przechwycić stan. Mechanizm uruchamiania hooków stosuje limit czasu 30 sekund,
aby zablokowany plugin lub punkt końcowy osadzania nie pozostawił obietnicy hooka
na zawsze w stanie oczekiwania. Przekroczenie limitu czasu jest rejestrowane, a OpenClaw kontynuuje działanie; nie
anuluje pracy sieciowej należącej do pluginu, chyba że plugin używa również własnego sygnału
przerwania.

Używaj `model_call_started` i `model_call_ended` do telemetrii wywołań dostawcy,
która nie powinna otrzymywać nieprzetworzonych promptów, historii, odpowiedzi, nagłówków, treści
żądań ani identyfikatorów żądań dostawcy. Te hooki obejmują stabilne metadane, takie jak
`runId`, `callId`, `provider`, `model`, opcjonalne `api`/`transport`, końcowe
`durationMs`/`outcome` oraz `upstreamRequestIdHash`, gdy OpenClaw może wyprowadzić
ograniczony skrót identyfikatora żądania dostawcy. Gdy środowisko wykonawcze rozpoznało
metadane okna kontekstu, zdarzenie i kontekst hooka obejmują również
`contextTokenBudget`, efektywny budżet tokenów po zastosowaniu limitów modelu, konfiguracji i agenta,
a także `contextWindowSource` i `contextWindowReferenceTokens`, gdy zastosowano
niższy limit.

`before_agent_finalize` uruchamia się tylko wtedy, gdy środowisko uruchomieniowe ma zaakceptować naturalną
końcową odpowiedź asystenta. Nie jest to ścieżka anulowania `/stop` i nie
uruchamia się, gdy użytkownik przerwie turę. Zwróć `{ action: "revise", reason }`, aby zażądać
od środowiska uruchomieniowego jeszcze jednego przebiegu modelu przed finalizacją, `{ action:
"finalize", reason? }`, aby wymusić finalizację, lub pomiń wynik, aby kontynuować.
Procedury obsługi mają domyślny budżet 15s; po przekroczeniu limitu czasu OpenClaw rejestruje błąd i
kontynuuje z pierwotną końcową odpowiedzią.
Natywne hooki Codex `Stop` są przekazywane do tego hooka jako decyzje OpenClaw
`before_agent_finalize`.

Zwracając `action: "revise"`, pluginy mogą dołączyć metadane `retry`, aby
dodatkowy przebieg modelu był ograniczony i bezpieczny przy ponownym odtworzeniu:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` jest dołączane do powodu korekty wysyłanego do środowiska uruchomieniowego.
`idempotencyKey` pozwala hostowi zliczać ponowienia tego samego żądania pluginu
w równoważnych decyzjach finalizacyjnych, a `maxAttempts` ogranicza liczbę dodatkowych
przebiegów, na które host zezwoli przed kontynuowaniem z naturalną końcową odpowiedzią.

Pluginy spoza pakietu, które wymagają hooków nieprzetworzonej konwersacji (`before_model_resolve`,
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

Hooki modyfikujące prompt i trwałe wstrzyknięcia do następnej tury można wyłączyć osobno dla każdego
pluginu za pomocą `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Rozszerzenia sesji i wstrzyknięcia do następnej tury

Pluginy przepływów pracy mogą utrwalać niewielki stan sesji zgodny z JSON za pomocą
`api.session.state.registerSessionExtension(...)` i aktualizować go poprzez
metodę Gateway `sessions.pluginPatch`. Wiersze sesji odwzorowują zarejestrowany
stan rozszerzenia przez `pluginExtensions`, umożliwiając interfejsowi Control UI i innym
klientom renderowanie stanu należącego do pluginu bez poznawania jego wewnętrznej implementacji.
`api.registerSessionExtension(...)` nadal działa, ale jest przestarzałe na rzecz
przestrzeni nazw `api.session.state`.

Używaj `api.session.workflow.enqueueNextTurnInjection(...)`, gdy plugin wymaga
trwałego kontekstu, który ma dotrzeć do następnej tury modelu dokładnie raz (element najwyższego poziomu
`api.enqueueNextTurnInjection(...)` jest przestarzałym aliasem o takim samym
działaniu). OpenClaw opróżnia kolejkę wstrzyknięć przed hookami promptu, usuwa
wygasłe wstrzyknięcia i deduplikuje je według `idempotencyKey` dla każdego pluginu. Jest to
właściwy punkt integracji dla wznowień zatwierdzania, podsumowań zasad, zmian z monitorów
działających w tle i kontynuacji poleceń, które powinny być widoczne dla modelu w
następnej turze, ale nie powinny stawać się trwałym tekstem promptu systemowego.

Semantyka czyszczenia stanowi część kontraktu. Procedury czyszczenia rozszerzeń sesji i
wywołania zwrotne czyszczenia cyklu życia środowiska wykonawczego otrzymują `reset`, `delete`, `disable` lub
`restart`. Host usuwa trwały stan rozszerzenia sesji należący do pluginu
oraz oczekujące wstrzyknięcia do następnej tury przy resetowaniu, usuwaniu lub wyłączaniu; ponowne uruchomienie
zachowuje trwały stan sesji, a wywołania zwrotne czyszczenia pozwalają pluginom zwolnić
zadania harmonogramu, kontekst uruchomienia i inne zasoby pozapasmowe starej
generacji środowiska wykonawczego.

## Hooki wiadomości

Używaj hooków wiadomości do routingu na poziomie kanału i zasad dostarczania:

- `message_received`: obserwuje przychodzącą treść, nadawcę, `threadId`,
  `messageId`, `senderId`, opcjonalną korelację uruchomienia lub sesji oraz metadane.
- `message_sending`: przepisuje `content` lub zwraca `{ cancel: true }`.
- `reply_payload_sending`: przepisuje znormalizowane obiekty `ReplyPayload`
  (w tym `presentation`, `delivery`, odwołania do multimediów i tekst) lub zwraca
  `{ cancel: true }`.
- `message_sent`: obserwuje końcowe powodzenie lub niepowodzenie.

W przypadku odpowiedzi TTS zawierających wyłącznie dźwięk `content` może zawierać ukrytą transkrypcję
wypowiedzi nawet wtedy, gdy ładunek kanału nie ma widocznego tekstu ani podpisu.
Przepisanie tego `content` aktualizuje wyłącznie transkrypcję widoczną dla hooka; nie jest ona
renderowana jako podpis multimediów.

Zdarzenia `reply_payload_sending` mogą zawierać `usageState`, aktualną migawkę modelu, użycia i kontekstu
dla danej tury, udostępnianą na zasadzie najlepszej staranności. Trwałe dostarczanie, odzyskane ponowne odtworzenie oraz
odpowiedzi bez dokładnej korelacji uruchomienia pomijają ją.

Konteksty hooków wiadomości udostępniają stabilne pola korelacji, gdy są dostępne:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` i `ctx.callDepth`. Konteksty ruchu przychodzącego
oraz `before_dispatch` udostępniają również metadane odpowiedzi, gdy kanał
ma dane cytowanej wiadomości przefiltrowane pod kątem widoczności: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender` i `replyToIsQuote`. Preferuj te
pierwszorzędne pola przed odczytywaniem starszych metadanych.

Preferuj typowane pola `threadId` i `replyToId` przed użyciem metadanych
specyficznych dla kanału.

Reguły decyzyjne:

- `message_sending` z `cancel: true` jest końcowe.
- `message_sending` z `cancel: false` jest traktowane jako brak decyzji.
- Przepisane `content` jest przekazywane do hooków o niższym priorytecie, chyba że późniejszy hook
  anuluje dostarczanie.
- `reply_payload_sending` uruchamia się po normalizacji ładunku, a przed dostarczeniem do kanału,
  w tym dla odpowiedzi kierowanych z powrotem do kanału źródłowego.
  Procedury obsługi są uruchamiane sekwencyjnie, a każda z nich otrzymuje najnowszy ładunek utworzony
  przez procedury o wyższym priorytecie.
- Ładunki `reply_payload_sending` nie ujawniają znaczników zaufania środowiska wykonawczego, takich jak
  `trustedLocalMedia`; pluginy mogą edytować kształt ładunku, ale nie mogą przyznać lokalnego
  zaufania multimediom.
- `message_sending` może zwrócić `cancelReason` i ograniczone `metadata` wraz z
  anulowaniem. Nowe interfejsy API cyklu życia wiadomości udostępniają to jako wynik
  wstrzymanego dostarczenia z powodem `cancelled_by_message_sending_hook`; starsze
  bezpośrednie dostarczanie nadal zwraca pustą tablicę wyników ze względu na zgodność.
- `message_sent` służy wyłącznie do obserwacji. Błędy procedur obsługi są rejestrowane i nie
  zmieniają wyniku dostarczania.

## Hooki instalacji

Używaj `security.installPolicy` do należących do operatora decyzji o zezwoleniu lub zablokowaniu. Ta
zasada jest uruchamiana na podstawie konfiguracji OpenClaw, obejmuje ścieżki instalacji i aktualizacji CLI oraz
w razie włączenia, ale niedostępności, blokuje operację.

`before_install` jest hookiem cyklu życia środowiska wykonawczego pluginu. Uruchamia się po
`security.installPolicy` tylko w procesie OpenClaw, w którym hooki pluginów zostały już
załadowane, na przykład w przepływach instalacji obsługiwanych przez Gateway. Jest przydatny do
obserwacji, ostrzeżeń i kontroli zgodności należących do pluginu, ale nie jest
główną granicą zabezpieczeń przedsiębiorstwa ani hosta dla instalacji. Pole
`builtinScan` pozostaje w ładunku zdarzenia ze względu na zgodność, ale
OpenClaw nie wykonuje już wbudowanego blokowania niebezpiecznego kodu podczas instalacji, więc
jest to pusty wynik `ok`. Zwróć dodatkowe ustalenia lub
`{ block: true, blockReason }`, aby zatrzymać instalację w tym procesie.

`block: true` jest końcowe. `block: false` jest traktowane jako brak decyzji. Błędy procedur
obsługi blokują instalację zgodnie z zasadą bezpiecznego zamknięcia.

## Cykl życia Gateway

Używaj `gateway_start` do uruchamiania ogólnych usług pluginów, a `gateway_stop` do
czyszczenia długotrwałych zasobów. Harmonogram cron może nadal być ładowany, gdy
uruchamia się `gateway_start`, dlatego nie należy używać go jako sygnału bazowego dla zewnętrznego
odwzorowania cron.

Nie należy polegać na wewnętrznym hooku `gateway:startup` w przypadku usług środowiska wykonawczego
należących do pluginu.

`cron_reconciled` jest wyzwalany po uzgodnieniu trwałego stanu przez harmonogram cron Gateway i jego
obserwatory zakończenia. Jest wyzwalany zarówno podczas początkowego
uruchamiania, jak i wymiany harmonogramu podczas przeładowania konfiguracji. Zdarzenie zgłasza
`reason` (`startup` lub `reload`) oraz efektywny stan `enabled`. Wyłączony
cron nadal emituje zdarzenie z `enabled: false`, umożliwiając zewnętrznemu odwzorowaniu
usunięcie nieaktualnych wybudzeń. Używaj `ctx.getCron?.()` dla dokładnie tej instancji harmonogramu, która
ukończyła uzgadnianie; późniejsze przeładowanie nie zmienia celu tego wywołania zwrotnego.
`ctx.abortSignal` należy do tej samej migawki harmonogramu. Gateway przerywa go,
gdy tylko zostanie uzbrojony nowszy harmonogram lub rozpocznie się zamykanie. Przekazuj go do każdego
trwałego efektu ubocznego i nie akceptuj migawki po jego przerwaniu.
Jest to sygnał cyklu życia harmonogramu, a nie sygnał aktywacji pluginu:
przeładowanie na gorąco dotyczące wyłącznie pluginu nie odtwarza go ponownie. Nowo włączony odbiorca otrzymuje
pierwszy stan bazowy przy następnej wymianie harmonogramu lub uruchomieniu Gateway.

Podobnie jak w przypadku innych hooków obserwacyjnych, wywołania zwrotne `gateway_start` i `cron_reconciled`
mogą się nakładać. Jeśli obie procedury obsługi współdzielą inicjalizację pluginu, należy skoordynować je
za pomocą lokalnej dla pluginu obietnicy gotowości zamiast polegać na kolejności wywołań zwrotnych.

`cron_changed` jest wyzwalane dla zdarzeń cyklu życia Cron należących do Gateway, z typowanym
ładunkiem zdarzenia obejmującym przyczyny `added`, `updated`, `removed`, `started`, `finished`
oraz `scheduled`. Zdarzenie zawiera migawkę `PluginHookGatewayCronJob`
(w tym `state.nextRunAtMs`, `state.lastRunStatus` i
`state.lastError`, jeśli występują) oraz `PluginHookGatewayCronDeliveryStatus`
o wartości `not-requested` | `delivered` | `not-delivered` | `unknown`. Zdarzenia usunięcia
następują po zatwierdzeniu: są wyzwalane dopiero po pomyślnym trwałym usunięciu i nadal zawierają
migawkę usuniętego zadania, aby zewnętrzne harmonogramy mogły uzgodnić stan.

Zdarzenie `scheduled` następuje po zatwierdzeniu: jest wyzwalane dopiero wtedy, gdy pomyślny trwały
zapis zmieni efektywną wartość `nextRunAtMs` istniejącego zadania, z wyłączeniem jawnego zdarzenia
cyklu życia `added`, `updated` lub `removed` tego zadania. Wartość najwyższego poziomu
`event.nextRunAtMs` oznacza zatwierdzony następny moment wybudzenia; jeśli jej nie ma, zadanie
nie ma kolejnego wybudzenia. Zdarzenia te należy traktować jako wskazówki do uzgadniania, a nie jako uporządkowany dziennik
zmian. Należy używać ich jako możliwych do łączenia wskazówek, aby ponownie odczytać harmonogram ostatnio przechwycony przez
`cron_reconciled`; nie należy przyjmować harmonogramu z kontekstu `cron_changed`.
OpenClaw powinien pozostać źródłem prawdy dla sprawdzania terminów i wykonywania.

### Bezpieczna zewnętrzna projekcja Cron

Należy rzutować pełną migawkę wybudzeń zamiast przekazywać zmiany zdarzeń Cron. Operacja
`replaceAll` zewnętrznego adaptera musi być atomowa i idempotentna oraz
może zakończyć się dopiero po trwałym przyjęciu migawki przez hosta. Musi również
uwzględniać przekazany sygnał przerwania: jeśli sygnał zostanie przerwany przed trwałym
przyjęciem, adapter nie może przyjąć tej migawki.

Ten wzorzec utrzymuje jednego aktywnego workera najnowszego stanu. Tylko `cron_reconciled`
przyjmuje instancję harmonogramu; `cron_changed` jedynie prosi tego workera o ponowne odczytanie
instancji autorytatywnej, dzięki czemu spóźniona wskazówka nie może przywrócić starszego harmonogramu.
Nowsza rewizja przerywa aktywną próbę hosta, zanim będzie ona mogła przyjąć nieaktualną
migawkę.

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`zewnętrzna projekcja cron nie powiodła się; ponawianie za ${retryMs} ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("uzgadnianie cron nie udostępniło harmonogramu");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

Gdy `cron_reconciled` zgłasza `enabled: false`, ta sama ścieżka wywołuje
`replaceAll([])` i usuwa nieaktualne zewnętrzne wybudzenia. Ponawianie z wycofywaniem w tym przykładzie
ma zasięg procesu i traktuje błędy adaptera środowiska uruchomieniowego jako przejściowe; konfigurację,
której błędów nie można rozwiązać przez ponawianie, należy zweryfikować przed rejestracją. OpenClaw nie zapewnia
skrzynki nadawczej dla efektów hooków Pluginu. Jeśli proces zakończy się przed trwałym przyjęciem,
następny start Gateway wyemituje nową autorytatywną migawkę `cron_reconciled`.
`gateway_stop` przerywa trwającą pracę hosta, czeka na zakończenie pracy workera, a następnie
zamyka adapter.

## Nadchodzące wycofania

Kilka powierzchni powiązanych z hookami jest przestarzałych, ale nadal obsługiwanych. Migrację należy przeprowadzić
przed następnym wydaniem głównym:

- **Kanałowe koperty w postaci zwykłego tekstu** w procedurach obsługi `inbound_claim` i `message_received`.
  Zamiast analizować płaski tekst koperty, należy odczytywać `BodyForAgent` i ustrukturyzowane bloki kontekstu
  użytkownika. Zobacz
  [Kanałowe koperty w postaci zwykłego tekstu → BodyForAgent](/pl/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** pozostaje ze względu na zgodność. Nowe pluginy powinny używać
  `before_model_resolve` i `before_prompt_build` zamiast połączonej
  fazy.
- **`subagent_spawning`** pozostaje ze względu na zgodność ze starszymi pluginami, ale
  nowe pluginy nie powinny zwracać z niego trasowania wątków. Rdzeń przygotowuje
  powiązania podagentów `thread: true` za pomocą adapterów powiązań sesji kanału,
  zanim zostanie wyzwolone `subagent_spawned`.
- **`deactivate`** pozostaje przestarzałym aliasem zgodności na potrzeby czyszczenia do okresu
  po 2026-08-16. Nowe pluginy powinny używać `gateway_stop`.
- **`onResolution` w `before_tool_call`** używa teraz typowanej
  unii `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) zamiast dowolnej wartości `string`.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** pozostają
  aliasami zgodności najwyższego poziomu. Nowe pluginy powinny używać
  `api.session.state.registerSessionExtension(...)` i
  `api.session.workflow.enqueueNextTurnInjection(...)`.

Pełna lista — rejestracja możliwości pamięci, profil rozumowania dostawcy,
zewnętrzni dostawcy uwierzytelniania, typy wykrywania dostawców, akcesory środowiska
uruchomieniowego zadań oraz zmiana nazwy `command-auth` → `command-status` — znajduje się w sekcji
[Migracja zestawu SDK Pluginu → Aktywne wycofania](/pl/plugins/sdk-migration#active-deprecations).

## Powiązane materiały

- [Migracja zestawu SDK Pluginu](/pl/plugins/sdk-migration) — aktywne wycofania i harmonogram usuwania
- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Omówienie zestawu SDK Pluginu](/pl/plugins/sdk-overview)
- [Punkty wejścia Pluginu](/pl/plugins/sdk-entrypoints)
- [Wewnętrzne hooki](/pl/automation/hooks)
- [Wewnętrzna architektura pluginów](/pl/plugins/architecture-internals)
