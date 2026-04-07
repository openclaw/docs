---
read_when:
    - Uruchamianie harnessów programistycznych przez ACP
    - Konfigurowanie sesji ACP powiązanych z konwersacją na kanałach wiadomości
    - Powiązanie konwersacji kanału wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP i połączeniem pluginu
    - Obsługa poleceń /acp z czatu
summary: Używaj sesji runtime ACP dla Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP i innych agentów harness
title: Agenci ACP
x-i18n:
    generated_at: "2026-04-07T09:52:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb651ab39b05e537398623ee06cb952a5a07730fc75d3f7e0de20dd3128e72c6
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agenci ACP

Sesje [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) pozwalają OpenClaw uruchamiać zewnętrzne harnessy programistyczne (na przykład Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI i inne obsługiwane harnessy ACPX) przez plugin backendu ACP.

Jeśli poprosisz OpenClaw zwykłym językiem, aby „uruchomił to w Codex” albo „uruchomił Claude Code w wątku”, OpenClaw powinien skierować to żądanie do runtime ACP (a nie do natywnego runtime sub-agenta). Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

Jeśli chcesz, aby Codex lub Claude Code łączyły się jako zewnętrzny klient MCP bezpośrednio
z istniejącymi konwersacjami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/cli/mcp) zamiast ACP.

## Którą stronę wybrać?

Są tu trzy sąsiednie powierzchnie, które łatwo pomylić:

| Chcesz...                                                                     | Użyj tego                              | Uwagi                                                                                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Uruchamiać Codex, Claude Code, Gemini CLI lub inny zewnętrzny harness _przez_ OpenClaw | Ta strona: agenci ACP                 | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki runtime |
| Udostępnić sesję OpenClaw Gateway _jako_ serwer ACP dla edytora lub klienta      | [`openclaw acp`](/cli/acp)            | Tryb mostu. IDE/klient mówi ACP do OpenClaw przez stdio/WebSocket                                               |
| Użyć lokalnego AI CLI jako zapasowego modelu tylko tekstowego                                 | [CLI Backends](/pl/gateway/cli-backends) | To nie ACP. Bez narzędzi OpenClaw, bez kontrolek ACP, bez runtime harness                                        |

## Czy to działa od razu po instalacji?

Zwykle tak.

- Świeże instalacje mają teraz domyślnie włączony dołączony plugin runtime `acpx`.
- Dołączony plugin `acpx` preferuje swój lokalny, przypięty plik binarny `acpx`.
- Przy starcie OpenClaw sonduje ten plik binarny i w razie potrzeby sam go naprawia.
- Zacznij od `/acp doctor`, jeśli chcesz wykonać szybkie sprawdzenie gotowości.

Co nadal może się zdarzyć przy pierwszym użyciu:

- Docelowy adapter harness może zostać pobrany na żądanie przez `npx` przy pierwszym użyciu tego harnessu.
- Uwierzytelnianie producenta nadal musi istnieć na hoście dla tego harnessu.
- Jeśli host nie ma dostępu do npm/sieci, pobrania adaptera przy pierwszym uruchomieniu mogą się nie udać, dopóki cache nie zostanie podgrzany lub adapter nie zostanie zainstalowany w inny sposób.

Przykłady:

- `/acp spawn codex`: OpenClaw powinien być gotowy do bootstrapu `acpx`, ale adapter ACP dla Codex może nadal wymagać pobrania przy pierwszym uruchomieniu.
- `/acp spawn claude`: podobnie w przypadku adaptera ACP dla Claude, plus uwierzytelnianie po stronie Claude na tym hoście.

## Szybki przepływ dla operatora

Użyj tego, jeśli chcesz praktycznego runbooka `/acp`:

1. Uruchom sesję:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Pracuj w powiązanej konwersacji lub wątku (albo wskaż jawnie ten klucz sesji).
3. Sprawdź stan runtime:
   - `/acp status`
4. Dostosuj opcje runtime w razie potrzeby:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Delikatnie skieruj aktywną sesję bez zastępowania kontekstu:
   - `/acp steer tighten logging and continue`
6. Zatrzymaj pracę:
   - `/acp cancel` (zatrzymaj bieżącą turę), albo
   - `/acp close` (zamknij sesję + usuń powiązania)

## Szybki start dla ludzi

Przykłady naturalnych próśb:

- „Powiąż ten kanał Discord z Codex.”
- „Uruchom tu trwałą sesję Codex w wątku i utrzymuj ją w skupieniu.”
- „Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik.”
- „Powiąż ten czat iMessage z Codex i utrzymuj kolejne wiadomości w tym samym workspace.”
- „Użyj Gemini CLI do tego zadania w wątku, a potem utrzymuj kolejne wiadomości w tym samym wątku.”

Co OpenClaw powinien zrobić:

1. Wybrać `runtime: "acp"`.
2. Rozwiązać żądany cel harnessu (`agentId`, na przykład `codex`).
3. Jeśli żądane jest powiązanie z bieżącą konwersacją i aktywny kanał je obsługuje, powiązać sesję ACP z tą konwersacją.
4. W przeciwnym razie, jeśli żądane jest powiązanie z wątkiem i bieżący kanał je obsługuje, powiązać sesję ACP z wątkiem.
5. Kierować kolejne powiązane wiadomości do tej samej sesji ACP, dopóki nie zostanie wyłączona, zamknięta lub nie wygaśnie.

## ACP a sub-agenci

Używaj ACP, gdy chcesz zewnętrznego runtime harness. Używaj sub-agentów, gdy chcesz natywnych dla OpenClaw uruchomień delegowanych.

| Obszar          | Sesja ACP                           | Uruchomienie sub-agenta             |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backendu ACP (na przykład acpx) | Natywny runtime sub-agenta OpenClaw  |
| Klucz sesji   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Główne polecenia | `/acp ...`                            | `/subagents ...`                   |
| Narzędzie uruchamiania    | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślny runtime) |

Zobacz też [Sub-agents](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos jest następujący:

1. Płaszczyzna sterowania sesjami OpenClaw ACP
2. dołączony plugin runtime `acpx`
3. adapter Claude ACP
4. runtime/mechanika sesji po stronie Claude

Ważne rozróżnienie:

- ACP Claude to sesja harness z kontrolkami ACP, wznawianiem sesji, śledzeniem zadań w tle oraz opcjonalnym powiązaniem z konwersacją/wątkiem.
- Backendy CLI to oddzielne lokalne, tylko tekstowe runtime zapasowe. Zobacz [CLI Backends](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada jest taka:

- chcesz `/acp spawn`, sesji, które można powiązać, kontrolek runtime albo trwałej pracy harness: użyj ACP
- chcesz prostego lokalnego fallbacku tekstowego przez surowe CLI: użyj backendów CLI

## Sesje powiązane

### Powiązania z bieżącą konwersacją

Użyj `/acp spawn <harness> --bind here`, gdy chcesz, aby bieżąca konwersacja stała się trwałym workspace ACP bez tworzenia podrzędnego wątku.

Zachowanie:

- OpenClaw nadal obsługuje transport kanału, uwierzytelnianie, bezpieczeństwo i dostarczanie.
- Bieżąca konwersacja jest przypinana do uruchomionego klucza sesji ACP.
- Kolejne wiadomości w tej konwersacji są kierowane do tej samej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP na miejscu.
- `/acp close` zamyka sesję i usuwa powiązanie z bieżącą konwersacją.

Co to oznacza w praktyce:

- `--bind here` zachowuje tę samą powierzchnię czatu. Na Discord bieżący kanał pozostaje bieżącym kanałem.
- `--bind here` może nadal utworzyć nową sesję ACP, jeśli uruchamiasz świeżą pracę. Powiązanie dołącza tę sesję do bieżącej konwersacji.
- `--bind here` samo z siebie nie tworzy podrzędnego wątku Discord ani tematu Telegram.
- Runtime ACP może nadal mieć własny katalog roboczy (`cwd`) lub workspace zarządzany przez backend na dysku. Ten workspace runtime jest oddzielny od powierzchni czatu i nie oznacza nowego wątku wiadomości.
- Jeśli uruchamiasz do innego agenta ACP i nie podasz `--cwd`, OpenClaw domyślnie dziedziczy workspace **docelowego agenta**, a nie żądającego.
- Jeśli odziedziczona ścieżka workspace nie istnieje (`ENOENT`/`ENOTDIR`), OpenClaw wraca do domyślnego `cwd` backendu zamiast po cichu użyć niewłaściwego drzewa.
- Jeśli odziedziczony workspace istnieje, ale nie można uzyskać do niego dostępu (na przykład `EACCES`), uruchomienie zwraca rzeczywisty błąd dostępu zamiast porzucać `cwd`.

Model mentalny:

- powierzchnia czatu: gdzie ludzie dalej rozmawiają (`kanał Discord`, `temat Telegram`, `czat iMessage`)
- sesja ACP: trwały stan runtime Codex/Claude/Gemini, do którego kieruje OpenClaw
- podrzędny wątek/temat: opcjonalna dodatkowa powierzchnia wiadomości tworzona tylko przez `--thread ...`
- workspace runtime: lokalizacja w systemie plików, gdzie działa harness (`cwd`, checkout repozytorium, workspace backendu)

Przykłady:

- `/acp spawn codex --bind here`: zachowaj ten czat, uruchom lub dołącz sesję Codex ACP i kieruj tu do niej przyszłe wiadomości
- `/acp spawn codex --thread auto`: OpenClaw może utworzyć podrzędny wątek/temat i tam powiązać sesję ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: to samo powiązanie z czatem co wyżej, ale Codex działa w `/workspace/repo`

Obsługa powiązań z bieżącą konwersacją:

- Kanały czatu/wiadomości, które ogłaszają obsługę powiązań z bieżącą konwersacją, mogą używać `--bind here` przez współdzieloną ścieżkę powiązań konwersacji.
- Kanały z niestandardową semantyką wątków/tematów mogą nadal dostarczać kanoniczność specyficzną dla kanału za tym samym współdzielonym interfejsem.
- `--bind here` zawsze oznacza „powiąż bieżącą konwersację na miejscu”.
- Ogólne powiązania z bieżącą konwersacją używają współdzielonego magazynu powiązań OpenClaw i przetrwają zwykłe restarty gateway.

Uwagi:

- `--bind here` i `--thread ...` wzajemnie się wykluczają w `/acp spawn`.
- Na Discord `--bind here` wiąże bieżący kanał lub wątek na miejscu. `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć podrzędny wątek dla `--thread auto|here`.
- Jeśli aktywny kanał nie udostępnia powiązań ACP z bieżącą konwersacją, OpenClaw zwraca jasny komunikat o braku obsługi.
- `resume` i pytania o „nową sesję” dotyczą sesji ACP, a nie kanału. Możesz ponownie użyć albo zastąpić stan runtime bez zmiany bieżącej powierzchni czatu.

### Sesje powiązane z wątkiem

Gdy adapter kanału ma włączoną obsługę powiązań wątków, sesje ACP mogą być powiązane z wątkami:

- OpenClaw wiąże wątek z docelową sesją ACP.
- Kolejne wiadomości w tym wątku są kierowane do powiązanej sesji ACP.
- Dane wyjściowe ACP są dostarczane z powrotem do tego samego wątku.
- Wyłączenie skupienia/zamknięcie/archiwizacja/timeout bezczynności albo wygaśnięcie maksymalnego wieku usuwa powiązanie.

Obsługa powiązań wątków jest specyficzna dla adaptera. Jeśli aktywny adapter kanału nie obsługuje powiązań wątków, OpenClaw zwraca jasny komunikat unsupported/unavailable.

Wymagane flagi funkcji dla ACP powiązanego z wątkiem:

- `acp.enabled=true`
- `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać dispatch ACP)
- Włączona flaga uruchamiania wątków ACP adaptera kanału (specyficzna dla adaptera)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanały obsługujące wątki

- Dowolny adapter kanału, który udostępnia możliwość powiązań sesji/wątków.
- Obecne wbudowane wsparcie:
  - wątki/kanały Discord
  - tematy Telegram (tematy forum w grupach/supergrupach oraz tematy DM)
- Kanały pluginów mogą dodać obsługę przez ten sam interfejs powiązań.

## Ustawienia specyficzne dla kanału

W przypadku workflow nieefemerycznych skonfiguruj trwałe powiązania ACP w wpisach najwyższego poziomu `bindings[]`.

### Model powiązań

- `bindings[].type="acp"` oznacza trwałe powiązanie konwersacji ACP.
- `bindings[].match` identyfikuje docelową konwersację:
  - kanał lub wątek Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - temat forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - czat DM/grupowy BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Dla stabilnych powiązań grup preferuj `chat_id:*` lub `chat_identifier:*`.
  - czat DM/grupowy iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Dla stabilnych powiązań grup preferuj `chat_id:*`.
- `bindings[].agentId` to identyfikator właściciela agenta OpenClaw.
- Opcjonalne nadpisania ACP znajdują się w `bindings[].acp`:
  - `mode` (`persistent` lub `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Domyślne ustawienia runtime dla agenta

Użyj `agents.list[].runtime`, aby zdefiniować domyślne ustawienia ACP raz dla każdego agenta:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator harnessu, na przykład `codex` albo `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Kolejność pierwszeństwa nadpisań dla powiązanych sesji ACP:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. globalne wartości domyślne ACP (na przykład `acp.backend`)

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
- Tymczasowe powiązania runtime (na przykład utworzone przez przepływy focus wątków) nadal mają zastosowanie, jeśli istnieją.
- Przy uruchamianiu między agentami ACP bez jawnego `cwd` OpenClaw dziedziczy workspace docelowego agenta z konfiguracji agenta.
- Brakujące odziedziczone ścieżki workspace powodują fallback do domyślnego `cwd` backendu; rzeczywiste błędy dostępu do istniejących ścieżek są zwracane jako błędy uruchamiania.

## Uruchamianie sesji ACP (interfejsy)

### Z `sessions_spawn`

Użyj `runtime: "acp"`, aby uruchomić sesję ACP z tury agenta lub wywołania narzędzia.

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

- `runtime` domyślnie ma wartość `subagent`, więc dla sesji ACP ustaw jawnie `runtime: "acp"`.
- Jeśli `agentId` zostanie pominięte, OpenClaw używa `acp.defaultAgent`, gdy jest skonfigurowane.
- `mode: "session"` wymaga `thread: true`, aby zachować trwałą powiązaną konwersację.

Szczegóły interfejsu:

- `task` (wymagane): początkowy prompt wysyłany do sesji ACP.
- `runtime` (wymagane dla ACP): musi mieć wartość `"acp"`.
- `agentId` (opcjonalne): identyfikator docelowego harnessu ACP. Jeśli ustawione, fallback do `acp.defaultAgent`.
- `thread` (opcjonalne, domyślnie `false`): żądanie przepływu powiązania z wątkiem tam, gdzie jest obsługiwany.
- `mode` (opcjonalne): `run` (jednorazowe) albo `session` (trwałe).
  - domyślnie jest `run`
  - jeśli `thread: true` i `mode` pominięte, OpenClaw może domyślnie przejść do zachowania trwałego zależnie od ścieżki runtime
  - `mode: "session"` wymaga `thread: true`
- `cwd` (opcjonalne): żądany katalog roboczy runtime (walidowany przez backend/politykę runtime). Jeśli zostanie pominięte, uruchomienie ACP dziedziczy workspace docelowego agenta, jeśli jest skonfigurowane; brakujące odziedziczone ścieżki powodują fallback do domyślnych ustawień backendu, natomiast rzeczywiste błędy dostępu są zwracane.
- `label` (opcjonalne): etykieta widoczna dla operatora używana w tekście sesji/banneru.
- `resumeSessionId` (opcjonalne): wznów istniejącą sesję ACP zamiast tworzyć nową. Agent odtwarza historię konwersacji przez `session/load`. Wymaga `runtime: "acp"`.
- `streamTo` (opcjonalne): `"parent"` przesyła podsumowania postępu początkowego uruchomienia ACP z powrotem do sesji żądającej jako zdarzenia systemowe.
  - Gdy jest dostępne, zaakceptowane odpowiedzi zawierają `streamLogPath` wskazujące plik JSONL z zakresem sesji (`<sessionId>.acp-stream.jsonl`), który można śledzić, aby zobaczyć pełną historię przekazywania.

### Wznawianie istniejącej sesji

Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast rozpoczynać od nowa. Agent odtwarza historię konwersacji przez `session/load`, więc wznawia pracę z pełnym kontekstem wcześniejszych działań.

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
- Kontynuacja sesji programistycznej rozpoczętej interaktywnie w CLI, teraz bezobsługowo przez agenta
- Podjęcie pracy przerwanej przez restart gateway albo timeout bezczynności

Uwagi:

- `resumeSessionId` wymaga `runtime: "acp"` — zwraca błąd, jeśli zostanie użyte z runtime sub-agenta.
- `resumeSessionId` przywraca historię konwersacji upstream ACP; `thread` i `mode` nadal normalnie dotyczą nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
- Docelowy agent musi obsługiwać `session/load` (Codex i Claude Code obsługują).
- Jeśli identyfikator sesji nie zostanie znaleziony, uruchomienie kończy się jasnym błędem — bez cichego fallbacku do nowej sesji.

### Test smoke dla operatora

Użyj tego po wdrożeniu gateway, gdy chcesz szybko na żywo sprawdzić, czy uruchamianie ACP
rzeczywiście działa end-to-end, a nie tylko przechodzi testy jednostkowe.

Zalecana bramka:

1. Zweryfikuj wdrożoną wersję/commit gateway na docelowym hoście.
2. Potwierdź, że wdrożone źródło zawiera akceptację linii ACP w
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Otwórz tymczasową sesję mostu ACPX do aktywnego agenta (na przykład
   `razor(main)` na `jpclawhq`).
4. Poproś tego agenta o wywołanie `sessions_spawn` z:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - zadaniem: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Zweryfikuj, że agent raportuje:
   - `accepted=yes`
   - rzeczywisty `childSessionKey`
   - brak błędu walidatora
6. Wyczyść tymczasową sesję mostu ACPX.

Przykładowy prompt do aktywnego agenta:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Uwagi:

- Utrzymuj ten test smoke w `mode: "run"`, chyba że celowo testujesz
  trwałe sesje ACP powiązane z wątkiem.
- Nie wymagaj `streamTo: "parent"` dla podstawowej bramki. Ta ścieżka zależy od
  możliwości sesji żądającej i jest osobnym sprawdzeniem integracyjnym.
- Testowanie `mode: "session"` powiązanego z wątkiem traktuj jako drugi, bogatszy przebieg integracyjny
  z prawdziwego wątku Discord albo tematu Telegram.

## Zgodność z sandbox

Sesje ACP działają obecnie na runtime hosta, a nie wewnątrz sandbox OpenClaw.

Obecne ograniczenia:

- Jeśli sesja żądająca jest sandboxowana, uruchamianie ACP jest blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
  - Błąd: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.
  - Błąd: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Użyj `runtime: "subagent"`, gdy potrzebujesz wykonania wymuszonego przez sandbox.

### Z polecenia `/acp`

Użyj `/acp spawn`, gdy potrzebujesz jawnej kontroli operatora z czatu.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Kluczowe flagi:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Zobacz [Slash Commands](/pl/tools/slash-commands).

## Rozwiązywanie celu sesji

Większość działań `/acp` akceptuje opcjonalny cel sesji (`session-key`, `session-id` lub `session-label`).

Kolejność rozwiązywania:

1. Jawny argument celu (lub `--session` dla `/acp steer`)
   - najpierw próba jako key
   - potem jako identyfikator sesji w kształcie UUID
   - potem jako label
2. Bieżące powiązanie z wątkiem (jeśli ta konwersacja/wątek jest powiązana z sesją ACP)
3. Fallback do bieżącej sesji żądającej

Powiązania z bieżącą konwersacją i z wątkiem uczestniczą w kroku 2.

Jeśli nie uda się rozwiązać celu, OpenClaw zwraca jasny błąd (`Unable to resolve session target: ...`).

## Tryby powiązania przy uruchamianiu

`/acp spawn` obsługuje `--bind here|off`.

| Tryb   | Zachowanie                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | Powiąż bieżącą aktywną konwersację na miejscu; zakończ błędem, jeśli żadna nie jest aktywna. |
| `off`  | Nie twórz powiązania z bieżącą konwersacją.                          |

Uwagi:

- `--bind here` to najprostsza ścieżka operatora dla „zrób z tego kanału lub czatu zaplecze Codex”.
- `--bind here` nie tworzy podrzędnego wątku.
- `--bind here` jest dostępne tylko na kanałach, które udostępniają obsługę powiązań z bieżącą konwersacją.
- `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

## Tryby wątków przy uruchamianiu

`/acp spawn` obsługuje `--thread auto|here|off`.

| Tryb   | Zachowanie                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż podrzędny wątek, jeśli jest obsługiwany. |
| `here` | Wymagaj bieżącego aktywnego wątku; zakończ błędem, jeśli nie jesteś w wątku.                                                  |
| `off`  | Bez powiązania. Sesja uruchamia się bez powiązania.                                                                 |

Uwagi:

- Na powierzchniach bez obsługi powiązań wątków domyślne zachowanie jest w praktyce `off`.
- Uruchamianie powiązane z wątkiem wymaga obsługi w polityce kanału:
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

Niektóre kontrolki zależą od możliwości backendu. Jeśli backend nie obsługuje danej kontrolki, OpenClaw zwraca jasny błąd unsupported-control.

## Książka kucharska poleceń ACP

| Polecenie              | Co robi                                              | Przykład                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalnie powiązanie z bieżącą konwersacją lub wątkiem. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje turę w locie dla docelowej sesji.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję sterującą do działającej sesji.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i odwiązuje cele wątków.                  | `/acp close`                                                  |
| `/acp status`        | Pokazuje backend, tryb, stan, opcje runtime, możliwości. | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb runtime dla docelowej sesji.                      | `/acp set-mode plan`                                          |
| `/acp set`           | Ogólny zapis opcji konfiguracji runtime.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego runtime.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil polityki zatwierdzeń.                              | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia timeout runtime (sekundy).                            | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu runtime.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji runtime dla sesji.                  | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP z magazynu.                      | `/acp sessions`                                               |
| `/acp doctor`        | Stan backendu, możliwości, konkretne poprawki.           | `/acp doctor`                                                 |
| `/acp install`       | Wypisuje deterministyczne kroki instalacji i włączenia.             | `/acp install`                                                |

`/acp sessions` odczytuje magazyn dla bieżącej powiązanej sesji albo sesji żądającej. Polecenia akceptujące tokeny `session-key`, `session-id` albo `session-label` rozwiązują cele przez wykrywanie sesji gateway, w tym niestandardowe katalogi `session.store` dla poszczególnych agentów.

## Mapowanie opcji runtime

`/acp` ma polecenia wygodne i ogólny setter.

Operacje równoważne:

- `/acp model <id>` mapuje się na klucz konfiguracji runtime `model`.
- `/acp permissions <profile>` mapuje się na klucz konfiguracji runtime `approval_policy`.
- `/acp timeout <seconds>` mapuje się na klucz konfiguracji runtime `timeout`.
- `/acp cwd <path>` bezpośrednio aktualizuje nadpisanie `cwd` runtime.
- `/acp set <key> <value>` to ścieżka ogólna.
  - Szczególny przypadek: `key=cwd` używa ścieżki nadpisania `cwd`.
- `/acp reset-options` czyści wszystkie nadpisania runtime dla docelowej sesji.

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

Gdy OpenClaw używa backendu acpx, dla `agentId` preferuj te wartości, chyba że konfiguracja acpx definiuje niestandardowe aliasy agentów.
Jeśli lokalna instalacja Cursor nadal ujawnia ACP jako `agent acp`, nadpisz polecenie agenta `cursor` w konfiguracji acpx zamiast zmieniać wbudowaną wartość domyślną.

Bezpośrednie użycie CLI acpx może też kierować do dowolnych adapterów przez `--agent <command>`, ale ta surowa furtka ucieczki jest funkcją CLI acpx (a nie normalną ścieżką `agentId` OpenClaw).

## Wymagana konfiguracja

Podstawowa konfiguracja ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcjonalne. Wartość domyślna to true; ustaw false, aby wstrzymać dispatch ACP przy zachowaniu kontrolek /acp.
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

Konfiguracja powiązań wątków jest specyficzna dla adaptera kanału. Przykład dla Discord:

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

Zobacz [Configuration Reference](/pl/gateway/configuration-reference).

## Konfiguracja pluginu dla backendu acpx

Świeże instalacje mają domyślnie włączony dołączony plugin runtime `acpx`, więc ACP
zwykle działa bez ręcznej instalacji pluginu.

Zacznij od:

```text
/acp doctor
```

Jeśli wyłączyłeś `acpx`, zablokowałeś go przez `plugins.allow` / `plugins.deny` albo chcesz
przełączyć się na lokalny checkout deweloperski, użyj jawnej ścieżki pluginu:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalacja lokalnego workspace podczas developmentu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie zweryfikuj stan backendu:

```text
/acp doctor
```

### Konfiguracja polecenia i wersji acpx

Domyślnie dołączony plugin backendu acpx (`acpx`) używa lokalnego, przypiętego pliku binarnego pluginu:

1. Polecenie domyślnie wskazuje na lokalny dla pluginu `node_modules/.bin/acpx` wewnątrz pakietu pluginu ACPX.
2. Oczekiwana wersja domyślnie odpowiada przypięciu rozszerzenia.
3. Przy starcie backend ACP jest natychmiast rejestrowany jako not-ready.
4. Zadanie ensure w tle weryfikuje `acpx --version`.
5. Jeśli lokalny plik binarny pluginu nie istnieje lub wersja się nie zgadza, uruchamia:
   `npm install --omit=dev --no-save acpx@<pinned>` i ponownie weryfikuje.

Możesz nadpisać polecenie/wersję w konfiguracji pluginu:

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

- `command` akceptuje ścieżkę bezwzględną, ścieżkę względną lub nazwę polecenia (`acpx`).
- Ścieżki względne są rozwiązywane względem katalogu workspace OpenClaw.
- `expectedVersion: "any"` wyłącza ścisłe dopasowanie wersji.
- Gdy `command` wskazuje niestandardowy plik binarny/ścieżkę, automatyczna instalacja lokalna pluginu jest wyłączona.
- Uruchamianie OpenClaw pozostaje nieblokujące, gdy działa sprawdzanie stanu backendu w tle.

Zobacz [Plugins](/pl/tools/plugin).

### Automatyczna instalacja zależności

Gdy instalujesz OpenClaw globalnie przez `npm install -g openclaw`, zależności runtime `acpx`
(pliki binarne zależne od platformy) są instalowane automatycznie
przez hook postinstall. Jeśli automatyczna instalacja się nie powiedzie, gateway nadal uruchamia się
normalnie i raportuje brakującą zależność przez `openclaw acp doctor`.

### Most MCP dla narzędzi pluginów

Domyślnie sesje ACPX **nie** udostępniają harnessowi ACP narzędzi
zarejestrowanych przez pluginy OpenClaw.

Jeśli chcesz, aby agenci ACP, tacy jak Codex albo Claude Code, mogli wywoływać zainstalowane
narzędzia pluginów OpenClaw, takie jak memory recall/store, włącz dedykowany most:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Co to robi:

- Wstrzykuje w bootstrap sesji ACPX wbudowany serwer MCP o nazwie `openclaw-plugin-tools`.
- Udostępnia narzędzia pluginów już zarejestrowane przez zainstalowane i włączone pluginy OpenClaw.
- Utrzymuje tę funkcję jako jawną i domyślnie wyłączoną.

Uwagi dotyczące bezpieczeństwa i zaufania:

- To rozszerza powierzchnię narzędzi harnessu ACP.
- Agenci ACP otrzymują dostęp tylko do narzędzi pluginów już aktywnych w gateway.
- Traktuj to jako tę samą granicę zaufania co pozwolenie tym pluginom wykonywać się
  w samym OpenClaw.
- Przed włączeniem przejrzyj zainstalowane pluginy.

Niestandardowe `mcpServers` nadal działają jak wcześniej. Wbudowany most plugin-tools to
dodatkowa, opcjonalna wygoda, a nie zamiennik ogólnej konfiguracji serwera MCP.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TTY do zatwierdzania ani odrzucania promptów uprawnień zapisu plików i wykonywania poleceń powłoki. Plugin acpx dostarcza dwa klucze konfiguracji, które kontrolują obsługę uprawnień:

Te uprawnienia harnessów ACPX są oddzielne od zatwierdzeń exec OpenClaw i oddzielne od flag omijania po stronie producenta backendów CLI, takich jak Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` to awaryjny przełącznik na poziomie harnessu dla sesji ACP.

### `permissionMode`

Kontroluje, które operacje agent harnessu może wykonywać bez promptu.

| Wartość           | Zachowanie                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Automatycznie zatwierdza wszystkie zapisy plików i polecenia powłoki.          |
| `approve-reads` | Automatycznie zatwierdza tylko odczyty; zapisy i wykonanie wymagają promptów. |
| `deny-all`      | Odrzuca wszystkie prompty uprawnień.                              |

### `nonInteractivePermissions`

Kontroluje, co dzieje się, gdy prompt uprawnień miałby zostać pokazany, ale interaktywny TTY nie jest dostępny (co zawsze dotyczy sesji ACP).

| Wartość  | Zachowanie                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Przerywa sesję z `AcpRuntimeError`. **(domyślnie)**           |
| `deny` | Po cichu odrzuca uprawnienie i kontynuuje (łagodna degradacja). |

### Konfiguracja

Ustaw przez konfigurację pluginu:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Uruchom ponownie gateway po zmianie tych wartości.

> **Ważne:** OpenClaw obecnie domyślnie używa `permissionMode=approve-reads` i `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każdy zapis lub exec, który wywoła prompt uprawnień, może zakończyć się błędem `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jeśli musisz ograniczyć uprawnienia, ustaw `nonInteractivePermissions` na `deny`, aby sesje łagodnie degradowały się zamiast kończyć awarią.

## Rozwiązywanie problemów

| Objaw                                                                     | Prawdopodobna przyczyna                                                                    | Poprawka                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Brak pluginu backendu lub jest wyłączony.                                             | Zainstaluj i włącz plugin backendu, a następnie uruchom `/acp doctor`.                                                                                                        |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP jest globalnie wyłączone.                                                          | Ustaw `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch z normalnych wiadomości w wątku jest wyłączony.                                  | Ustaw `acp.dispatch.enabled=true`.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent nie znajduje się na allowliście.                                                         | Użyj dozwolonego `agentId` albo zaktualizuj `acp.allowedAgents`.                                                                                                              |
| `Unable to resolve session target: ...`                                     | Błędny token key/id/label.                                                         | Uruchom `/acp sessions`, skopiuj dokładny key/label, spróbuj ponownie.                                                                                                                 |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` użyte bez aktywnej konwersacji, którą można powiązać.                     | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj uruchomienia bez powiązania.                                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter nie ma możliwości powiązań ACP z bieżącą konwersacją.                      | Użyj `/acp spawn ... --thread ...` tam, gdzie jest obsługiwane, skonfiguruj wpisy najwyższego poziomu `bindings[]` albo przejdź na obsługiwany kanał.                                              |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` użyte poza kontekstem wątku.                                  | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Inny użytkownik jest właścicielem aktywnego celu powiązania.                                    | Powiąż ponownie jako właściciel albo użyj innej konwersacji lub wątku.                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | Adapter nie ma możliwości powiązań wątków.                                        | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału.                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP działa po stronie hosta; sesja żądająca jest sandboxowana.                       | Użyj `runtime="subagent"` z sesji sandboxowanych albo uruchom ACP z sesji bez sandboxa.                                                                  |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Zażądano `sandbox="require"` dla runtime ACP.                                  | Użyj `runtime="subagent"` dla wymaganego sandboxowania albo ACP z `sandbox="inherit"` z sesji bez sandboxa.                                               |
| Brak metadanych ACP dla powiązanej sesji                                      | Nieaktualne/usunięte metadane sesji ACP.                                             | Odtwórz przez `/acp spawn`, a następnie ponownie powiąż/skup wątek.                                                                                                             |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokuje zapis/exec w nieinteraktywnej sesji ACP.             | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i uruchom ponownie gateway. Zobacz [Konfiguracja uprawnień](#konfiguracja-uprawnień).                 |
| Sesja ACP kończy się bardzo wcześnie z niewielką ilością danych wyjściowych                                  | Prompty uprawnień są blokowane przez `permissionMode`/`nonInteractivePermissions`. | Sprawdź logi gateway pod kątem `AcpRuntimeError`. Dla pełnych uprawnień ustaw `permissionMode=approve-all`; dla łagodnej degradacji ustaw `nonInteractivePermissions=deny`. |
| Sesja ACP zawiesza się bez końca po zakończeniu pracy                       | Proces harness zakończył się, ale sesja ACP nie zgłosiła zakończenia.             | Monitoruj przez `ps aux \| grep acpx`; ręcznie zabij nieaktualne procesy.                                                                                                |
