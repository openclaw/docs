---
read_when:
    - Uruchamianie harnessów programistycznych przez ACP
    - Konfigurowanie sesji ACP powiązanych z konwersacją na kanałach wiadomości
    - Powiązanie konwersacji kanału wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP i połączeniami Pluginów
    - Debugowanie dostarczania zakończeń ACP lub pętli agent-agent
    - Obsługa poleceń `/acp` z czatu
summary: Używaj sesji runtime ACP dla Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP i innych agentów harnessu
title: Agenci ACP
x-i18n:
    generated_at: "2026-04-22T04:28:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71ae74200cb7581a68c4593fd7e510378267daaf7acbcd7667cde56335ebadea
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agenci ACP

Sesje [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) pozwalają OpenClaw uruchamiać zewnętrzne harnessy programistyczne (na przykład Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI i inne obsługiwane harnessy ACPX) przez Plugin backendu ACP.

Jeśli poprosisz OpenClaw zwykłym językiem o „uruchomienie tego w Codex” albo „start Claude Code w wątku”, OpenClaw powinien skierować takie żądanie do runtime ACP (a nie do natywnego runtime sub-agentów). Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

Jeśli chcesz, aby Codex lub Claude Code łączyły się jako zewnętrzny klient MCP bezpośrednio
z istniejącymi konwersacjami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/cli/mcp) zamiast ACP.

## Którą stronę wybrać?

Istnieją trzy pobliskie powierzchnie, które łatwo pomylić:

| Chcesz...                                                                          | Użyj                                  | Uwagi                                                                                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Uruchamiać Codex, Claude Code, Gemini CLI lub inny zewnętrzny harness _przez_ OpenClaw | Ta strona: Agenci ACP                 | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki runtime |
| Wystawić sesję Gateway OpenClaw _jako_ serwer ACP dla edytora lub klienta          | [`openclaw acp`](/cli/acp)            | Tryb mostu. IDE/klient komunikuje się ACP z OpenClaw przez stdio/WebSocket                                       |
| Używać lokalnego CLI AI jako tekstowego modelu fallback                            | [Backendy CLI](/pl/gateway/cli-backends) | To nie ACP. Brak narzędzi OpenClaw, brak kontrolek ACP, brak runtime harnessu                                    |

## Czy to działa od razu po instalacji?

Zwykle tak.

- Świeże instalacje są teraz dostarczane z włączonym domyślnie dołączonym Pluginem runtime `acpx`.
- Dołączony Plugin `acpx` preferuje własną przypiętą binarkę `acpx` lokalną dla Pluginu.
- Przy uruchomieniu OpenClaw testuje tę binarkę i samodzielnie ją naprawia w razie potrzeby.
- Zacznij od `/acp doctor`, jeśli chcesz szybko sprawdzić gotowość.

Co nadal może się zdarzyć przy pierwszym użyciu:

- Adapter docelowego harnessu może zostać pobrany na żądanie przez `npx` przy pierwszym użyciu tego harnessu.
- Uwierzytelnianie dostawcy nadal musi istnieć na hoście dla tego harnessu.
- Jeśli host nie ma dostępu do npm/sieci, pobranie adaptera przy pierwszym uruchomieniu może się nie udać, dopóki cache nie zostanie rozgrzany albo adapter nie zostanie zainstalowany w inny sposób.

Przykłady:

- `/acp spawn codex`: OpenClaw powinien być gotowy do bootstrapowania `acpx`, ale adapter ACP Codex może nadal wymagać pobrania przy pierwszym uruchomieniu.
- `/acp spawn claude`: podobnie dla adaptera ACP Claude, plus uwierzytelnianie po stronie Claude na tym hoście.

## Szybki przepływ pracy operatora

Użyj tego, gdy chcesz praktycznego runbooka `/acp`:

1. Uruchom sesję:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Pracuj w powiązanej konwersacji lub wątku (albo jawnie wskaż ten klucz sesji).
3. Sprawdź stan runtime:
   - `/acp status`
4. Dostosuj opcje runtime według potrzeb:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Delikatnie skoryguj aktywną sesję bez zastępowania kontekstu:
   - `/acp steer tighten logging and continue`
6. Zatrzymaj pracę:
   - `/acp cancel` (zatrzymaj bieżącą turę), albo
   - `/acp close` (zamknij sesję + usuń powiązania)

## Szybki start dla ludzi

Przykłady próśb w naturalnym języku:

- „Powiąż ten kanał Discord z Codex.”
- „Uruchom trwałą sesję Codex w wątku tutaj i utrzymuj koncentrację.”
- „Uruchom to jako jednorazową sesję ACP Claude Code i podsumuj wynik.”
- „Powiąż ten czat iMessage z Codex i utrzymuj dalsze wiadomości w tym samym obszarze roboczym.”
- „Użyj Gemini CLI do tego zadania w wątku, a potem utrzymuj dalsze wiadomości w tym samym wątku.”

Co OpenClaw powinien zrobić:

1. Wybrać `runtime: "acp"`.
2. Rozstrzygnąć żądany cel harnessu (`agentId`, na przykład `codex`).
3. Jeśli żądane jest powiązanie z bieżącą konwersacją i aktywny kanał to obsługuje, powiązać sesję ACP z tą konwersacją.
4. W przeciwnym razie, jeśli żądane jest powiązanie z wątkiem i bieżący kanał to obsługuje, powiązać sesję ACP z wątkiem.
5. Kierować dalsze powiązane wiadomości do tej samej sesji ACP do momentu rozproszenia/zamknięcia/wygaśnięcia.

## ACP a sub-agenci

Używaj ACP, gdy chcesz zewnętrznego runtime harnessu. Używaj sub-agentów, gdy chcesz natywnych delegowanych uruchomień OpenClaw.

| Obszar         | Sesja ACP                             | Uruchomienie sub-agenta            |
| -------------- | ------------------------------------- | ---------------------------------- |
| Runtime        | Plugin backendu ACP (na przykład acpx) | Natywny runtime sub-agentów OpenClaw |
| Klucz sesji    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Główne polecenia | `/acp ...`                          | `/subagents ...`                   |
| Narzędzie uruchamiania | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślny runtime) |

Zobacz też [Sub-agenci](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos wygląda tak:

1. Płaszczyzna sterowania sesji ACP OpenClaw
2. dołączony Plugin runtime `acpx`
3. Adapter ACP Claude
4. Runtime/maszyneria sesji po stronie Claude

Ważne rozróżnienie:

- ACP Claude to sesja harnessu z kontrolkami ACP, wznawianiem sesji, śledzeniem zadań w tle i opcjonalnym powiązaniem z konwersacją/wątkiem.
- Backendy CLI to oddzielne lokalne runtime tekstowe fallback. Zobacz [Backendy CLI](/pl/gateway/cli-backends).

Dla operatorów praktyczna reguła jest taka:

- chcesz `/acp spawn`, sesji możliwych do powiązania, kontrolek runtime lub trwałej pracy harnessu: użyj ACP
- chcesz prostego lokalnego fallbacku tekstowego przez surowe CLI: użyj backendów CLI

## Powiązane sesje

### Powiązania z bieżącą konwersacją

Użyj `/acp spawn <harness> --bind here`, gdy chcesz, aby bieżąca konwersacja stała się trwałym obszarem roboczym ACP bez tworzenia podrzędnego wątku.

Zachowanie:

- OpenClaw nadal zarządza transportem kanału, uwierzytelnianiem, bezpieczeństwem i dostarczaniem.
- Bieżąca konwersacja jest przypinana do uruchomionego klucza sesji ACP.
- Dalsze wiadomości w tej konwersacji są kierowane do tej samej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP na miejscu.
- `/acp close` zamyka sesję i usuwa powiązanie z bieżącą konwersacją.

Co to oznacza w praktyce:

- `--bind here` zachowuje tę samą powierzchnię czatu. Na Discord bieżący kanał pozostaje bieżącym kanałem.
- `--bind here` nadal może utworzyć nową sesję ACP, jeśli uruchamiasz świeżą pracę. Powiązanie dołącza tę sesję do bieżącej konwersacji.
- `--bind here` samo w sobie nie tworzy podrzędnego wątku Discord ani tematu Telegram.
- Runtime ACP nadal może mieć własny katalog roboczy (`cwd`) albo obszar roboczy na dysku zarządzany przez backend. Ten obszar roboczy runtime jest oddzielny od powierzchni czatu i nie oznacza nowego wątku wiadomości.
- Jeśli uruchamiasz do innego agenta ACP i nie podasz `--cwd`, OpenClaw dziedziczy domyślnie obszar roboczy **agenta docelowego**, a nie żądającego.
- Jeśli ta dziedziczona ścieżka obszaru roboczego nie istnieje (`ENOENT`/`ENOTDIR`), OpenClaw przechodzi awaryjnie do domyślnego `cwd` backendu zamiast po cichu używać niewłaściwego drzewa.
- Jeśli dziedziczony obszar roboczy istnieje, ale nie ma do niego dostępu (na przykład `EACCES`), uruchomienie zwraca rzeczywisty błąd dostępu zamiast porzucać `cwd`.

Model mentalny:

- powierzchnia czatu: miejsce, gdzie ludzie dalej rozmawiają (`kanał Discord`, `temat Telegram`, `czat iMessage`)
- sesja ACP: trwały stan runtime Codex/Claude/Gemini, do którego kieruje OpenClaw
- podrzędny wątek/temat: opcjonalna dodatkowa powierzchnia wiadomości tworzona wyłącznie przez `--thread ...`
- obszar roboczy runtime: lokalizacja systemu plików, w której działa harness (`cwd`, checkout repozytorium, obszar roboczy backendu)

Przykłady:

- `/acp spawn codex --bind here`: zachowaj ten czat, uruchom lub dołącz sesję ACP Codex i kieruj tu do niej przyszłe wiadomości
- `/acp spawn codex --thread auto`: OpenClaw może utworzyć podrzędny wątek/temat i tam powiązać sesję ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: to samo powiązanie czatu co wyżej, ale Codex działa w `/workspace/repo`

Obsługa powiązań z bieżącą konwersacją:

- Kanały czatu/wiadomości, które deklarują obsługę powiązań ACP z bieżącą konwersacją, mogą używać `--bind here` przez współdzieloną ścieżkę powiązań konwersacji.
- Kanały z niestandardową semantyką wątków/tematów nadal mogą dostarczać kanonicjalizację specyficzną dla kanału za tym samym współdzielonym interfejsem.
- `--bind here` zawsze oznacza „powiąż bieżącą konwersację na miejscu”.
- Ogólne powiązania z bieżącą konwersacją używają współdzielonego magazynu powiązań OpenClaw i przetrwają zwykłe restarty gateway.

Uwagi:

- `--bind here` i `--thread ...` wzajemnie się wykluczają w `/acp spawn`.
- Na Discord `--bind here` wiąże bieżący kanał lub wątek na miejscu. `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć podrzędny wątek dla `--thread auto|here`.
- Jeśli aktywny kanał nie udostępnia bieżących powiązań ACP konwersacji, OpenClaw zwraca jasny komunikat o braku obsługi.
- `resume` i pytania typu „new session” dotyczą sesji ACP, a nie kanału. Możesz użyć ponownie albo zastąpić stan runtime bez zmiany bieżącej powierzchni czatu.

### Sesje powiązane z wątkiem

Gdy dla adaptera kanału włączona jest obsługa powiązań z wątkami, sesje ACP mogą być powiązane z wątkami:

- OpenClaw wiąże wątek z docelową sesją ACP.
- Dalsze wiadomości w tym wątku są kierowane do powiązanej sesji ACP.
- Wyjście ACP jest dostarczane z powrotem do tego samego wątku.
- Rozproszenie/zamknięcie/zarchiwizowanie/timeout bezczynności albo wygaśnięcie maksymalnego wieku usuwa powiązanie.

Obsługa powiązań z wątkami zależy od adaptera. Jeśli aktywny adapter kanału nie obsługuje powiązań z wątkami, OpenClaw zwraca jasny komunikat o braku obsługi/niedostępności.

Wymagane flagi funkcji dla ACP powiązanego z wątkiem:

- `acp.enabled=true`
- `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać dispatch ACP)
- Włączona flaga uruchamiania wątku ACP dla adaptera kanału (specyficzna dla adaptera)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanały obsługujące wątki

- Każdy adapter kanału, który udostępnia możliwość powiązania sesji/wątku.
- Obecna wbudowana obsługa:
  - wątki/kanały Discord
  - tematy Telegram (tematy forum w grupach/supergrupach oraz tematy DM)
- Kanały Pluginów mogą dodać obsługę przez ten sam interfejs powiązań.

## Ustawienia specyficzne dla kanału

Dla przepływów nieefemerycznych skonfiguruj trwałe powiązania ACP we wpisach najwyższego poziomu `bindings[]`.

### Model powiązań

- `bindings[].type="acp"` oznacza trwałe powiązanie konwersacji ACP.
- `bindings[].match` identyfikuje docelową konwersację:
  - kanał lub wątek Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - temat forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - czat DM/grupowy BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Dla stabilnych powiązań grupowych preferuj `chat_id:*` albo `chat_identifier:*`.
  - czat DM/grupowy iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Dla stabilnych powiązań grupowych preferuj `chat_id:*`.
- `bindings[].agentId` to identyfikator właściciela agenta OpenClaw.
- Opcjonalne nadpisania ACP znajdują się pod `bindings[].acp`:
  - `mode` (`persistent` albo `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Domyślne ustawienia runtime per agent

Użyj `agents.list[].runtime`, aby zdefiniować domyślne ustawienia ACP raz dla każdego agenta:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator harnessu, na przykład `codex` albo `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Kolejność pierwszeństwa nadpisań dla powiązanych sesji ACP:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. globalne ustawienia domyślne ACP (na przykład `acp.backend`)

Przykład:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Zachowanie:

- OpenClaw upewnia się, że skonfigurowana sesja ACP istnieje przed użyciem.
- Wiadomości w tym kanale lub temacie są kierowane do skonfigurowanej sesji ACP.
- W powiązanych konwersacjach `/new` i `/reset` resetują ten sam klucz sesji ACP na miejscu.
- Tymczasowe powiązania runtime (na przykład utworzone przez przepływy fokusowania wątku) nadal mają zastosowanie, jeśli istnieją.
- Przy uruchamianiu między agentami ACP bez jawnego `cwd` OpenClaw dziedziczy obszar roboczy docelowego agenta z konfiguracji agenta.
- Brakujące dziedziczone ścieżki obszaru roboczego przechodzą awaryjnie do domyślnego `cwd` backendu; rzeczywiste błędy dostępu do istniejących ścieżek są zgłaszane jako błędy uruchomienia.

## Uruchamianie sesji ACP (interfejsy)

### Z `sessions_spawn`

Użyj `runtime: "acp"`, aby uruchomić sesję ACP z tury agenta albo wywołania narzędzia.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Uwagi:

- `runtime` ma domyślnie wartość `subagent`, więc dla sesji ACP ustaw jawnie `runtime: "acp"`.
- Jeśli pominięto `agentId`, OpenClaw używa `acp.defaultAgent`, jeśli jest skonfigurowany.
- `mode: "session"` wymaga `thread: true`, aby utrzymać trwałą powiązaną konwersację.

Szczegóły interfejsu:

- `task` (wymagane): początkowy prompt wysyłany do sesji ACP.
- `runtime` (wymagane dla ACP): musi mieć wartość `"acp"`.
- `agentId` (opcjonalne): identyfikator docelowego harnessu ACP. Przechodzi awaryjnie do `acp.defaultAgent`, jeśli ustawiono.
- `thread` (opcjonalne, domyślnie `false`): żądanie przepływu powiązania z wątkiem tam, gdzie jest obsługiwane.
- `mode` (opcjonalne): `run` (jednorazowe) albo `session` (trwałe).
  - domyślnie jest `run`
  - jeśli `thread: true` i pominięto `mode`, OpenClaw może domyślnie przyjąć zachowanie trwałe zależnie od ścieżki runtime
  - `mode: "session"` wymaga `thread: true`
- `cwd` (opcjonalne): żądany katalog roboczy runtime (walidowany przez politykę backendu/runtime). Jeśli pominięty, uruchomienie ACP dziedziczy obszar roboczy docelowego agenta, jeśli został skonfigurowany; brakujące dziedziczone ścieżki przechodzą awaryjnie do ustawień domyślnych backendu, a rzeczywiste błędy dostępu są zwracane.
- `label` (opcjonalne): etykieta widoczna dla operatora używana w tekście sesji/banera.
- `resumeSessionId` (opcjonalne): wznowienie istniejącej sesji ACP zamiast tworzenia nowej. Agent odtwarza historię konwersacji przez `session/load`. Wymaga `runtime: "acp"`.
- `streamTo` (opcjonalne): `"parent"` strumieniuje podsumowania postępu początkowego uruchomienia ACP z powrotem do sesji żądającej jako zdarzenia systemowe.
  - Gdy dostępne, zaakceptowane odpowiedzi zawierają `streamLogPath` wskazujące na plik JSONL logu o zakresie sesji (`<sessionId>.acp-stream.jsonl`), który można śledzić w celu uzyskania pełnej historii przekaźnika.

## Model dostarczania

Sesje ACP mogą być albo interaktywnymi obszarami roboczymi, albo zadaniami w tle należącymi do rodzica. Ścieżka dostarczania zależy od tego kształtu.

### Interaktywne sesje ACP

Sesje interaktywne służą do dalszej rozmowy na widocznej powierzchni czatu:

- `/acp spawn ... --bind here` wiąże bieżącą konwersację z sesją ACP.
- `/acp spawn ... --thread ...` wiąże wątek/temat kanału z sesją ACP.
- Trwałe skonfigurowane `bindings[].type="acp"` kierują pasujące konwersacje do tej samej sesji ACP.

Dalsze wiadomości w powiązanej konwersacji są kierowane bezpośrednio do sesji ACP, a wyjście ACP wraca do tego samego kanału/wątku/tematu.

### Jednorazowe sesje ACP należące do rodzica

Jednorazowe sesje ACP uruchomione przez innego agenta działają jako dzieci w tle, podobnie do sub-agentów:

- Rodzic zleca pracę przez `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Dziecko działa we własnej sesji harnessu ACP.
- Zakończenie raportuje z powrotem przez wewnętrzną ścieżkę ogłaszania ukończenia zadania.
- Rodzic przepisuje wynik dziecka zwykłym głosem asystenta, gdy przydatna jest odpowiedź widoczna dla użytkownika.

Nie traktuj tej ścieżki jako czatu peer-to-peer między rodzicem a dzieckiem. Dziecko ma już własny kanał zwrotny zakończenia do rodzica.

### `sessions_send` i dostarczanie A2A

`sessions_send` może po uruchomieniu wskazywać inną sesję. Dla zwykłych sesji peer OpenClaw używa ścieżki agent-agent (A2A) po wstrzyknięciu wiadomości:

- czeka na odpowiedź sesji docelowej
- opcjonalnie pozwala żądającemu i celowi wymienić ograniczoną liczbę dalszych tur
- prosi cel o wygenerowanie wiadomości ogłoszeniowej
- dostarcza to ogłoszenie do widocznego kanału albo wątku

Ta ścieżka A2A jest fallbackiem dla wysyłek peer, gdy nadawca potrzebuje widocznego działania następczego. Pozostaje włączona, gdy niepowiązana sesja może widzieć i wysyłać wiadomości do celu ACP, na przykład przy szerokich ustawieniach `tools.sessions.visibility`.

OpenClaw pomija działanie następcze A2A tylko wtedy, gdy żądający jest rodzicem własnego jednorazowego dziecka ACP należącego do rodzica. W takim przypadku uruchomienie A2A ponad mechanizmem ukończenia zadania może obudzić rodzica wynikiem dziecka, przekazać odpowiedź rodzica z powrotem do dziecka i utworzyć pętlę echo rodzic/dziecko. Wynik `sessions_send` zgłasza `delivery.status="skipped"` dla takiego przypadku dziecka należącego do właściciela, ponieważ ścieżka ukończenia już odpowiada za wynik.

### Wznawianie istniejącej sesji

Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast rozpoczynać od nowa. Agent odtwarza historię konwersacji przez `session/load`, dzięki czemu kontynuuje z pełnym kontekstem tego, co było wcześniej.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Typowe przypadki użycia:

- Przekazanie sesji Codex z laptopa na telefon — powiedz agentowi, aby podjął pracę tam, gdzie została przerwana
- Kontynuowanie sesji programistycznej rozpoczętej interaktywnie w CLI, teraz bezgłowo przez agenta
- Podjęcie pracy przerwanej przez restart gateway albo timeout bezczynności

Uwagi:

- `resumeSessionId` wymaga `runtime: "acp"` — zwraca błąd, jeśli zostanie użyte z runtime sub-agenta.
- `resumeSessionId` przywraca historię konwersacji upstream ACP; `thread` i `mode` nadal mają normalne zastosowanie do nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
- Agent docelowy musi obsługiwać `session/load` (Codex i Claude Code to obsługują).
- Jeśli identyfikator sesji nie zostanie znaleziony, uruchomienie kończy się jasnym błędem — bez cichego fallbacku do nowej sesji.

### Szybki test operatora

Użyj tego po wdrożeniu gateway, gdy chcesz szybko na żywo sprawdzić, czy uruchamianie ACP
naprawdę działa end-to-end, a nie tylko przechodzi testy jednostkowe.

Zalecana bramka:

1. Zweryfikuj wdrożoną wersję/commit gateway na hoście docelowym.
2. Potwierdź, że wdrożone źródło zawiera akceptację linii ACP w
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Otwórz tymczasową sesję mostu ACPX do aktywnego agenta (na przykład
   `razor(main)` na `jpclawhq`).
4. Poproś tego agenta o wywołanie `sessions_spawn` z:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - zadanie: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Zweryfikuj, że agent zgłasza:
   - `accepted=yes`
   - prawdziwe `childSessionKey`
   - brak błędu walidatora
6. Posprzątaj tymczasową sesję mostu ACPX.

Przykładowy prompt do aktywnego agenta:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Uwagi:

- Utrzymuj ten szybki test w `mode: "run"`, chyba że celowo testujesz
  trwałe sesje ACP powiązane z wątkiem.
- Nie wymagaj `streamTo: "parent"` dla podstawowej bramki. Ta ścieżka zależy od
  możliwości żądającego/sesji i jest osobnym testem integracyjnym.
- Traktuj testowanie `mode: "session"` powiązanego z wątkiem jako drugi, bogatszy przebieg integracyjny
  z prawdziwego wątku Discord albo tematu Telegram.

## Zgodność z sandboxem

Sesje ACP obecnie działają na runtime hosta, a nie wewnątrz sandboxa OpenClaw.

Obecne ograniczenia:

- Jeśli sesja żądająca jest objęta sandboxem, uruchomienia ACP są blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
  - Błąd: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.
  - Błąd: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Użyj `runtime: "subagent"`, gdy potrzebujesz wykonania wymuszanego przez sandbox.

### Z polecenia `/acp`

Użyj `/acp spawn` dla jawnej kontroli operatora z czatu, gdy jest potrzebna.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Najważniejsze flagi:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Zobacz [Polecenia ukośnikowe](/pl/tools/slash-commands).

## Rozstrzyganie celu sesji

Większość działań `/acp` akceptuje opcjonalny cel sesji (`session-key`, `session-id` albo `session-label`).

Kolejność rozstrzygania:

1. Jawny argument celu (albo `--session` dla `/acp steer`)
   - najpierw próbuje klucza
   - potem identyfikatora sesji w kształcie UUID
   - potem etykiety
2. Bieżące powiązanie wątku (jeśli ta konwersacja/wątek jest powiązany z sesją ACP)
3. Fallback do bieżącej sesji żądającej

Powiązania z bieżącą konwersacją i powiązania z wątkiem uczestniczą w kroku 2.

Jeśli nie da się rozstrzygnąć żadnego celu, OpenClaw zwraca jasny błąd (`Unable to resolve session target: ...`).

## Tryby powiązań przy uruchamianiu

`/acp spawn` obsługuje `--bind here|off`.

| Tryb   | Zachowanie                                                             |
| ------ | ---------------------------------------------------------------------- |
| `here` | Powiąż bieżącą aktywną konwersację na miejscu; zakończ niepowodzeniem, jeśli żadna nie jest aktywna. |
| `off`  | Nie twórz powiązania z bieżącą konwersacją.                            |

Uwagi:

- `--bind here` to najprostsza ścieżka operatorska dla „niech ten kanał albo czat będzie wspierany przez Codex”.
- `--bind here` nie tworzy podrzędnego wątku.
- `--bind here` jest dostępne tylko na kanałach, które udostępniają obsługę powiązań z bieżącą konwersacją.
- `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

## Tryby wątków przy uruchamianiu

`/acp spawn` obsługuje `--thread auto|here|off`.

| Tryb   | Zachowanie                                                                                          |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż podrzędny wątek, jeśli jest obsługiwany. |
| `here` | Wymagaj bieżącego aktywnego wątku; zakończ niepowodzeniem, jeśli nie jesteś w wątku.               |
| `off`  | Brak powiązania. Sesja uruchamia się bez powiązania.                                                |

Uwagi:

- Na powierzchniach bez obsługi powiązań z wątkami domyślne zachowanie jest w praktyce równoznaczne z `off`.
- Uruchomienie powiązane z wątkiem wymaga obsługi w polityce kanału:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Użyj `--bind here`, gdy chcesz przypiąć bieżącą konwersację bez tworzenia podrzędnego wątku.

## Kontrolki ACP

Dostępna rodzina poleceń:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` pokazuje efektywne opcje runtime oraz, gdy są dostępne, zarówno identyfikatory sesji na poziomie runtime, jak i backendu.

Niektóre kontrolki zależą od możliwości backendu. Jeśli backend nie obsługuje danej kontrolki, OpenClaw zwraca jasny błąd o nieobsługiwanej kontrolce.

## Książka kucharska poleceń ACP

| Polecenie            | Co robi                                                  | Przykład                                                      |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalne bieżące powiązanie albo powiązanie z wątkiem. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje turę w locie dla sesji docelowej.                | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję sterującą do uruchomionej sesji.       | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i odpina cele wątków.                       | `/acp close`                                                  |
| `/acp status`        | Pokazuje backend, tryb, stan, opcje runtime, możliwości. | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb runtime dla sesji docelowej.                | `/acp set-mode plan`                                          |
| `/acp set`           | Ogólny zapis opcji konfiguracji runtime.                 | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego runtime.           | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil polityki zatwierdzania.                   | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia timeout runtime (sekundy).                       | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu runtime.                       | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji runtime sesji.                    | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP z magazynu.                 | `/acp sessions`                                               |
| `/acp doctor`        | Kondycja backendu, możliwości, możliwe działania naprawcze. | `/acp doctor`                                              |
| `/acp install`       | Wypisuje deterministyczne kroki instalacji i włączania.  | `/acp install`                                                |

`/acp sessions` odczytuje magazyn dla bieżącej powiązanej sesji albo sesji żądającej. Polecenia akceptujące tokeny `session-key`, `session-id` albo `session-label` rozstrzygają cele przez wykrywanie sesji gateway, w tym niestandardowe katalogi `session.store` per agent.

## Mapowanie opcji runtime

`/acp` ma polecenia wygodne i ogólny setter.

Równoważne operacje:

- `/acp model <id>` mapuje do klucza konfiguracji runtime `model`.
- `/acp permissions <profile>` mapuje do klucza konfiguracji runtime `approval_policy`.
- `/acp timeout <seconds>` mapuje do klucza konfiguracji runtime `timeout`.
- `/acp cwd <path>` aktualizuje bezpośrednio nadpisanie `cwd` runtime.
- `/acp set <key> <value>` to ścieżka ogólna.
  - Przypadek specjalny: `key=cwd` używa ścieżki nadpisania `cwd`.
- `/acp reset-options` czyści wszystkie nadpisania runtime dla sesji docelowej.

## Obsługa harnessów acpx (obecnie)

Obecne wbudowane aliasy harnessów acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Gdy OpenClaw używa backendu acpx, preferuj te wartości dla `agentId`, chyba że konfiguracja acpx definiuje niestandardowe aliasy agentów.
Jeśli Twoja lokalna instalacja Cursor nadal wystawia ACP jako `agent acp`, nadpisz polecenie agenta `cursor` w konfiguracji acpx zamiast zmieniać wbudowane ustawienie domyślne.

Bezpośrednie użycie CLI acpx może też kierować do dowolnych adapterów przez `--agent <command>`, ale ta surowa furtka jest funkcją CLI acpx (a nie zwykłą ścieżką `agentId` OpenClaw).

## Wymagana konfiguracja

Bazowa konfiguracja ACP w core:

```json5
{
  acp: {
    enabled: true,
    // Opcjonalne. Domyślnie true; ustaw false, aby wstrzymać dispatch ACP przy zachowaniu kontrolek /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Konfiguracja powiązań z wątkami jest specyficzna dla adaptera kanału. Przykład dla Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Jeśli uruchamianie ACP powiązane z wątkiem nie działa, najpierw sprawdź flagę funkcji adaptera:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Powiązania z bieżącą konwersacją nie wymagają tworzenia podrzędnego wątku. Wymagają aktywnego kontekstu konwersacji i adaptera kanału, który udostępnia powiązania konwersacji ACP.

Zobacz [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

## Konfiguracja Pluginu dla backendu acpx

Świeże instalacje są dostarczane z włączonym domyślnie dołączonym Pluginem runtime `acpx`, więc ACP
zwykle działa bez ręcznego kroku instalacji Pluginu.

Zacznij od:

```text
/acp doctor
```

Jeśli wyłączyłeś `acpx`, zablokowałeś go przez `plugins.allow` / `plugins.deny` albo chcesz
przełączyć się na lokalny checkout developerski, użyj jawnej ścieżki Pluginu:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalacja z lokalnego obszaru roboczego podczas developmentu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie zweryfikuj kondycję backendu:

```text
/acp doctor
```

### Konfiguracja polecenia i wersji acpx

Domyślnie dołączony Plugin backendu acpx (`acpx`) używa lokalnej dla Pluginu przypiętej binarki:

1. Polecenie domyślnie wskazuje lokalne dla Pluginu `node_modules/.bin/acpx` wewnątrz pakietu Pluginu ACPX.
2. Oczekiwana wersja domyślnie odpowiada przypięciu rozszerzenia.
3. Przy uruchomieniu OpenClaw natychmiast rejestruje backend ACP jako not-ready.
4. Zadanie ensure w tle weryfikuje `acpx --version`.
5. Jeśli lokalna dla Pluginu binarka brakuje albo ma niezgodną wersję, uruchamia:
   `npm install --omit=dev --no-save acpx@<pinned>` i ponownie weryfikuje.

Możesz nadpisać polecenie/wersję w konfiguracji Pluginu:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Uwagi:

- `command` akceptuje ścieżkę bezwzględną, ścieżkę względną albo nazwę polecenia (`acpx`).
- Ścieżki względne są rozstrzygane względem katalogu obszaru roboczego OpenClaw.
- `expectedVersion: "any"` wyłącza ścisłe dopasowanie wersji.
- Gdy `command` wskazuje niestandardową binarkę/ścieżkę, automatyczna instalacja lokalna dla Pluginu jest wyłączana.
- Uruchamianie OpenClaw pozostaje nieblokujące, podczas gdy działa sprawdzanie kondycji backendu.

Zobacz [Plugins](/pl/tools/plugin).

### Automatyczna instalacja zależności

Gdy instalujesz OpenClaw globalnie przez `npm install -g openclaw`, zależności runtime acpx
(binarki specyficzne dla platformy) są instalowane automatycznie
przez hook postinstall. Jeśli automatyczna instalacja się nie powiedzie, gateway nadal uruchamia się
normalnie i zgłasza brakującą zależność przez `openclaw acp doctor`.

### Most MCP narzędzi Pluginów

Domyślnie sesje ACPX **nie** wystawiają narzędzi zarejestrowanych przez Plugins OpenClaw
do harnessu ACP.

Jeśli chcesz, aby agenci ACP, tacy jak Codex albo Claude Code, mogli wywoływać zainstalowane
narzędzia Pluginów OpenClaw, takie jak memory recall/store, włącz dedykowany most:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-plugin-tools` do bootstrapu
  sesji ACPX.
- Wystawia narzędzia Pluginów już zarejestrowane przez zainstalowane i włączone Plugins OpenClaw.
- Utrzymuje tę funkcję jako jawną i domyślnie wyłączoną.

Uwagi dotyczące bezpieczeństwa i zaufania:

- To rozszerza powierzchnię narzędzi harnessu ACP.
- Agenci ACP uzyskują dostęp tylko do narzędzi Pluginów już aktywnych w gateway.
- Traktuj to jako tę samą granicę zaufania, co pozwolenie tym Pluginom na wykonywanie się
  w samym OpenClaw.
- Przejrzyj zainstalowane Plugins przed włączeniem.

Niestandardowe `mcpServers` nadal działają jak wcześniej. Wbudowany most narzędzi Pluginów jest
dodatkową wygodą opt-in, a nie zamiennikiem ogólnej konfiguracji serwera MCP.

### Konfiguracja timeoutu runtime

Dołączony Plugin `acpx` domyślnie ustawia timeout wbudowanych tur runtime na 120 sekund.
Daje to wolniejszym harnessom, takim jak Gemini CLI, wystarczająco dużo czasu na ukończenie
startup i inicjalizacji ACP. Nadpisz tę wartość, jeśli Twój host potrzebuje innego
limitu runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Po zmianie tej wartości uruchom ponownie gateway.

### Konfiguracja agenta testu kondycji

Dołączony Plugin `acpx` testuje jednego agenta harnessu przy ustalaniu, czy
wbudowany backend runtime jest gotowy. Domyślnie jest to `codex`. Jeśli Twoje wdrożenie
używa innego domyślnego agenta ACP, ustaw agenta testowego na ten sam identyfikator:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Po zmianie tej wartości uruchom ponownie gateway.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TTY do zatwierdzania ani odrzucania promptów uprawnień do zapisu plików i wykonywania powłoki. Plugin acpx udostępnia dwa klucze konfiguracji sterujące obsługą uprawnień:

Te uprawnienia harnessu ACPX są oddzielne od zatwierdzeń exec OpenClaw i oddzielne od flag obejścia po stronie dostawcy backendów CLI, takich jak Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` to harnessowa awaryjna opcja break-glass dla sesji ACP.

### `permissionMode`

Steruje tym, jakie operacje agent harnessu może wykonywać bez promptu.

| Wartość         | Zachowanie                                                    |
| --------------- | ------------------------------------------------------------- |
| `approve-all`   | Automatycznie zatwierdza wszystkie zapisy plików i polecenia powłoki. |
| `approve-reads` | Automatycznie zatwierdza tylko odczyty; zapis i exec wymagają promptów. |
| `deny-all`      | Odrzuca wszystkie prompty uprawnień.                          |

### `nonInteractivePermissions`

Steruje tym, co dzieje się, gdy powinien zostać pokazany prompt uprawnień, ale nie ma dostępnego interaktywnego TTY (co w przypadku sesji ACP ma miejsce zawsze).

| Wartość | Zachowanie                                                        |
| ------- | ----------------------------------------------------------------- |
| `fail`  | Przerywa sesję z `AcpRuntimeError`. **(domyślnie)**               |
| `deny`  | Cicho odrzuca uprawnienie i kontynuuje (łagodne pogorszenie działania). |

### Konfiguracja

Ustawiane przez konfigurację Pluginu:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Po zmianie tych wartości uruchom ponownie gateway.

> **Ważne:** OpenClaw obecnie domyślnie używa `permissionMode=approve-reads` oraz `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każdy zapis albo exec, który wywołuje prompt uprawnień, może zakończyć się błędem `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jeśli chcesz ograniczyć uprawnienia, ustaw `nonInteractivePermissions` na `deny`, aby sesje pogarszały działanie łagodnie zamiast kończyć się awarią.

## Rozwiązywanie problemów

| Objaw                                                                       | Prawdopodobna przyczyna                                                           | Naprawa                                                                                                                                                           |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Brak Pluginu backendu albo jest wyłączony.                                        | Zainstaluj i włącz Plugin backendu, a następnie uruchom `/acp doctor`.                                                                                           |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP jest globalnie wyłączone.                                                     | Ustaw `acp.enabled=true`.                                                                                                                                         |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch z normalnych wiadomości w wątku jest wyłączony.                          | Ustaw `acp.dispatch.enabled=true`.                                                                                                                                |
| `ACP agent "<id>" is not allowed by policy`                                 | Agenta nie ma na allowliście.                                                     | Użyj dozwolonego `agentId` albo zaktualizuj `acp.allowedAgents`.                                                                                                 |
| `Unable to resolve session target: ...`                                     | Nieprawidłowy token klucza/identyfikatora/etykiety.                               | Uruchom `/acp sessions`, skopiuj dokładny klucz/etykietę i spróbuj ponownie.                                                                                    |
| `--bind here requires running /acp spawn inside an active ... conversation` | Użyto `--bind here` bez aktywnej konwersacji, którą można powiązać.               | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj uruchomienia bez powiązania.                                                                    |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter nie ma możliwości powiązań ACP z bieżącą konwersacją.                     | Użyj `/acp spawn ... --thread ...`, jeśli jest obsługiwane, skonfiguruj wpisy najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału.           |
| `--thread here requires running /acp spawn inside an active ... thread`     | Użyto `--thread here` poza kontekstem wątku.                                      | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                     |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Inny użytkownik jest właścicielem aktywnego celu powiązania.                      | Powiąż ponownie jako właściciel albo użyj innej konwersacji lub wątku.                                                                                           |
| `Thread bindings are unavailable for <channel>.`                            | Adapter nie ma możliwości powiązań z wątkami.                                     | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału.                                                                                               |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP działa po stronie hosta; sesja żądająca jest objęta sandboxem.        | Użyj `runtime="subagent"` z sesji objętych sandboxem albo uruchom ACP z sesji nieobjętej sandboxem.                                                            |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Zażądano `sandbox="require"` dla runtime ACP.                                     | Użyj `runtime="subagent"` dla wymaganego sandboxingu albo użyj ACP z `sandbox="inherit"` z sesji nieobjętej sandboxem.                                         |
| Missing ACP metadata for bound session                                      | Nieaktualne/usunięte metadane sesji ACP.                                          | Utwórz ponownie przez `/acp spawn`, a następnie ponownie powiąż/skup wątek.                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokuje zapis/exec w nieinteraktywnej sesji ACP.                 | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i uruchom ponownie gateway. Zobacz [Konfiguracja uprawnień](#permission-configuration).    |
| Sesja ACP kończy się bardzo wcześnie i daje niewiele wyjścia                | Prompty uprawnień są blokowane przez `permissionMode`/`nonInteractivePermissions`. | Sprawdź logi gateway pod kątem `AcpRuntimeError`. Dla pełnych uprawnień ustaw `permissionMode=approve-all`; dla łagodnego pogorszenia działania ustaw `nonInteractivePermissions=deny`. |
| Sesja ACP zawiesza się bez końca po zakończeniu pracy                        | Proces harnessu zakończył się, ale sesja ACP nie zgłosiła ukończenia.             | Monitoruj przez `ps aux \| grep acpx`; ręcznie zabij nieaktualne procesy.                                                                                        |
