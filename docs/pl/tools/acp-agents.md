---
read_when:
    - Uruchamiasz harnessy programistyczne przez ACP
    - Konfigurujesz sesje ACP powiązane z rozmową na kanałach wiadomości
    - Wiążesz rozmowę na kanale wiadomości z trwałą sesją ACP
    - Rozwiązujesz problemy z backendem ACP i okablowaniem pluginów
    - Obsługujesz polecenia /acp z czatu
summary: Używaj sesji runtime ACP dla Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP i innych agentów harness
title: Agenci ACP
x-i18n:
    generated_at: "2026-04-05T14:08:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47063abc8170129cd22808d9a4b23160d0f340f6dc789907589d349f68c12e3e
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agenci ACP

Sesje [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) pozwalają OpenClaw uruchamiać zewnętrzne harnessy programistyczne (na przykład Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI i inne obsługiwane harnessy ACPX) przez plugin backendu ACP.

Jeśli poprosisz OpenClaw prostym językiem, aby „uruchomił to w Codex” albo „uruchomił Claude Code w wątku”, OpenClaw powinien skierować to żądanie do runtime ACP (a nie do natywnego runtime sub-agent). Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

Jeśli chcesz, aby Codex lub Claude Code łączyły się bezpośrednio jako zewnętrzny klient MCP
z istniejącymi rozmowami na kanałach OpenClaw, użyj
[`openclaw mcp serve`](/cli/mcp) zamiast ACP.

## Której strony potrzebuję?

W pobliżu są trzy powierzchnie, które łatwo pomylić:

| Chcesz...                                                                              | Użyj tego                           | Uwagi                                                                                                                  |
| -------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Uruchamiać Codex, Claude Code, Gemini CLI lub inny zewnętrzny harness _przez_ OpenClaw | Ta strona: agenci ACP               | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki runtime      |
| Udostępnić sesję Gateway OpenClaw _jako_ serwer ACP dla edytora lub klienta            | [`openclaw acp`](/cli/acp)          | Tryb mostu. IDE/klient rozmawia z OpenClaw przez ACP po stdio/WebSocket                                               |
| Użyć lokalnego CLI AI jako tekstowego modelu zapasowego                                | [Backendy CLI](/gateway/cli-backends) | To nie jest ACP. Brak narzędzi OpenClaw, brak kontrolek ACP, brak runtime harness                                     |

## Czy to działa od razu po instalacji?

Zwykle tak.

- Świeże instalacje dostarczają bundled plugin runtime `acpx` domyślnie włączony.
- Bundled plugin `acpx` preferuje własną, przypiętą lokalnie binarkę `acpx`.
- Przy starcie OpenClaw sonduje tę binarkę i sam się naprawia, jeśli to konieczne.
- Zacznij od `/acp doctor`, jeśli chcesz szybko sprawdzić gotowość.

Co nadal może się zdarzyć przy pierwszym użyciu:

- Adapter docelowego harnessu może zostać pobrany na żądanie przez `npx` przy pierwszym użyciu tego harnessu.
- Uwierzytelnianie dostawcy nadal musi istnieć na hoście dla tego harnessu.
- Jeśli host nie ma dostępu do npm/sieci, pobieranie adaptera przy pierwszym uruchomieniu może się nie powieść, dopóki cache nie zostanie rozgrzany albo adapter nie zostanie zainstalowany inną drogą.

Przykłady:

- `/acp spawn codex`: OpenClaw powinien być gotowy do bootstrapowania `acpx`, ale adapter ACP Codex może nadal wymagać pobrania przy pierwszym uruchomieniu.
- `/acp spawn claude`: podobna sytuacja dla adaptera Claude ACP, plus uwierzytelnienie po stronie Claude na tym hoście.

## Szybki przepływ operatora

Użyj tego, jeśli chcesz praktycznego runbooka `/acp`:

1. Uruchom sesję:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Pracuj w powiązanej rozmowie lub wątku (albo jawnie kieruj do tego klucza sesji).
3. Sprawdź stan runtime:
   - `/acp status`
4. W razie potrzeby dostrój opcje runtime:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Szturchnij aktywną sesję bez zastępowania kontekstu:
   - `/acp steer tighten logging and continue`
6. Zatrzymaj pracę:
   - `/acp cancel` (zatrzymaj bieżącą turę), albo
   - `/acp close` (zamknij sesję + usuń powiązania)

## Szybki start dla ludzi

Przykłady naturalnych próśb:

- „Powiąż ten kanał Discord z Codex.”
- „Uruchom trwałą sesję Codex w wątku tutaj i utrzymuj jej skupienie.”
- „Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik.”
- „Powiąż ten czat iMessage z Codex i utrzymuj kolejne wiadomości w tym samym workspace.”
- „Użyj Gemini CLI do tego zadania w wątku, a potem utrzymuj dalsze wiadomości w tym samym wątku.”

Co OpenClaw powinien zrobić:

1. Wybrać `runtime: "acp"`.
2. Rozwiązać żądany cel harnessu (`agentId`, na przykład `codex`).
3. Jeśli żądane jest powiązanie z bieżącą rozmową i aktywny kanał to obsługuje, powiązać sesję ACP z tą rozmową.
4. W przeciwnym razie, jeśli żądane jest powiązanie z wątkiem i bieżący kanał to obsługuje, powiązać sesję ACP z wątkiem.
5. Kierować dalsze powiązane wiadomości do tej samej sesji ACP aż do rozogniskowania / zamknięcia / wygaśnięcia.

## ACP kontra sub-agenci

Używaj ACP, gdy chcesz zewnętrznego runtime harnessu. Używaj sub-agentów, gdy chcesz delegowanych przebiegów natywnych dla OpenClaw.

| Obszar          | Sesja ACP                             | Przebieg sub-agent                  |
| --------------- | ------------------------------------- | ----------------------------------- |
| Runtime         | Plugin backendu ACP (np. acpx)        | Natywny runtime sub-agent OpenClaw  |
| Klucz sesji     | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Główne polecenia | `/acp ...`                           | `/subagents ...`                    |
| Narzędzie uruchamiania | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślny runtime) |

Zobacz też [Sub-agenci](/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos wygląda następująco:

1. Control plane sesji ACP OpenClaw
2. Bundled plugin runtime `acpx`
3. Adapter Claude ACP
4. Runtime / mechanika sesji po stronie Claude

Ważne rozróżnienie:

- Claude przez ACP to nie to samo co bezpośredni runtime zapasowy `claude-cli/...`.
- Claude przez ACP to sesja harnessu z kontrolkami ACP, wznawianiem sesji, śledzeniem zadań w tle i opcjonalnym powiązaniem z rozmową/wątkiem.
- `claude-cli/...` to tekstowy lokalny backend CLI. Zobacz [Backendy CLI](/gateway/cli-backends).

Dla operatorów praktyczna zasada jest taka:

- chcesz `/acp spawn`, sesje możliwe do powiązania, kontrolki runtime albo trwałą pracę harnessu: użyj ACP
- chcesz prostego lokalnego fallbacku tekstowego przez surowe CLI: użyj backendów CLI

## Sesje powiązane

### Powiązania z bieżącą rozmową

Użyj `/acp spawn <harness> --bind here`, gdy chcesz, aby bieżąca rozmowa stała się trwałym workspace ACP bez tworzenia podrzędnego wątku.

Zachowanie:

- OpenClaw nadal zarządza transportem kanału, auth, bezpieczeństwem i dostarczaniem.
- Bieżąca rozmowa jest przypinana do uruchomionego klucza sesji ACP.
- Dalsze wiadomości w tej rozmowie są kierowane do tej samej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP in-place.
- `/acp close` zamyka sesję i usuwa powiązanie bieżącej rozmowy.

Co to oznacza w praktyce:

- `--bind here` zachowuje tę samą powierzchnię czatu. Na Discord bieżący kanał pozostaje bieżącym kanałem.
- `--bind here` może nadal utworzyć nową sesję ACP, jeśli uruchamiasz świeżą pracę. Powiązanie dołącza tę sesję do bieżącej rozmowy.
- `--bind here` samo z siebie nie tworzy podrzędnego wątku Discord ani tematu Telegram.
- Runtime ACP może nadal mieć własny katalog roboczy (`cwd`) albo workspace zarządzany przez backend na dysku. Ten workspace runtime jest oddzielny od powierzchni czatu i nie oznacza nowego wątku wiadomości.
- Jeśli uruchamiasz do innego agenta ACP i nie podasz `--cwd`, OpenClaw domyślnie dziedziczy workspace **docelowego agenta**, a nie workspace osoby wywołującej.
- Jeśli ta odziedziczona ścieżka workspace nie istnieje (`ENOENT`/`ENOTDIR`), OpenClaw wraca do domyślnego `cwd` backendu zamiast po cichu użyć niewłaściwego drzewa.
- Jeśli odziedziczony workspace istnieje, ale nie można uzyskać do niego dostępu (na przykład `EACCES`), uruchomienie zwraca rzeczywisty błąd dostępu zamiast pomijać `cwd`.

Model mentalny:

- powierzchnia czatu: miejsce, gdzie ludzie dalej rozmawiają (`kanał Discord`, `temat Telegram`, `czat iMessage`)
- sesja ACP: trwały stan runtime Codex/Claude/Gemini, do którego OpenClaw kieruje ruch
- podrzędny wątek/temat: opcjonalna dodatkowa powierzchnia wiadomości tworzona tylko przez `--thread ...`
- workspace runtime: lokalizacja systemu plików, w której działa harness (`cwd`, checkout repo, workspace backendu)

Przykłady:

- `/acp spawn codex --bind here`: zachowaj ten czat, uruchom lub podłącz sesję Codex ACP i kieruj do niej przyszłe wiadomości stąd
- `/acp spawn codex --thread auto`: OpenClaw może utworzyć podrzędny wątek/temat i powiązać tam sesję ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: to samo powiązanie czatu co wyżej, ale Codex działa w `/workspace/repo`

Obsługa powiązań z bieżącą rozmową:

- Kanały czatu/wiadomości, które reklamują obsługę powiązań ACP z bieżącą rozmową, mogą używać `--bind here` przez współdzieloną ścieżkę powiązania rozmowy.
- Kanały z własną semantyką wątków/tematów mogą nadal dostarczać specyficzną dla kanału kanonikalizację za tą samą współdzieloną warstwą.
- `--bind here` zawsze oznacza „powiąż bieżącą rozmowę in-place”.
- Ogólne powiązania z bieżącą rozmową używają współdzielonego magazynu powiązań OpenClaw i przetrwają zwykłe restarty gateway.

Uwagi:

- `--bind here` i `--thread ...` wzajemnie się wykluczają w `/acp spawn`.
- Na Discord `--bind here` wiąże bieżący kanał lub wątek in-place. `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć podrzędny wątek dla `--thread auto|here`.
- Jeśli aktywny kanał nie udostępnia powiązań ACP z bieżącą rozmową, OpenClaw zwraca jasny komunikat o braku obsługi.
- `resume` i pytania o „nową sesję” dotyczą sesji ACP, a nie kanału. Możesz ponownie użyć albo zastąpić stan runtime bez zmiany bieżącej powierzchni czatu.

### Sesje powiązane z wątkiem

Gdy powiązania wątków są włączone dla adaptera kanału, sesje ACP mogą być wiązane z wątkami:

- OpenClaw wiąże wątek z docelową sesją ACP.
- Dalsze wiadomości w tym wątku są kierowane do powiązanej sesji ACP.
- Wyjście ACP jest dostarczane z powrotem do tego samego wątku.
- Rozogniskowanie / zamknięcie / archiwizacja / timeout bezczynności lub wygaśnięcie maksymalnego wieku usuwa powiązanie.

Obsługa powiązań z wątkiem jest zależna od adaptera. Jeśli aktywny adapter kanału nie obsługuje powiązań z wątkiem, OpenClaw zwraca jasny komunikat unsupported/unavailable.

Wymagane flagi funkcji dla ACP powiązanego z wątkiem:

- `acp.enabled=true`
- `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać dispatch ACP)
- Włączona flaga uruchamiania wątków ACP specyficzna dla adaptera kanału
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanały obsługujące wątki

- Dowolny adapter kanału, który udostępnia możliwość wiązania sesji/wątków.
- Obecnie wbudowana obsługa:
  - Wątki/kanały Discord
  - Tematy Telegram (forum topics w grupach/supergrupach i tematy DM)
- Kanały pluginów mogą dodawać obsługę przez ten sam interfejs wiązania.

## Ustawienia specyficzne dla kanału

Dla workflowów nieefemerycznych skonfiguruj trwałe powiązania ACP w najwyższego poziomu wpisach `bindings[]`.

### Model powiązań

- `bindings[].type="acp"` oznacza trwałe powiązanie rozmowy ACP.
- `bindings[].match` identyfikuje docelową rozmowę:
  - Kanał lub wątek Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Temat forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Czat DM/grupowy BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferuj `chat_id:*` albo `chat_identifier:*` dla stabilnych powiązań grupowych.
  - Czat DM/grupowy iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferuj `chat_id:*` dla stabilnych powiązań grupowych.
- `bindings[].agentId` to identyfikator właściciela agenta OpenClaw.
- Opcjonalne nadpisania ACP znajdują się pod `bindings[].acp`:
  - `mode` (`persistent` albo `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Domyślne ustawienia runtime per agent

Użyj `agents.list[].runtime`, aby raz zdefiniować domyślne ustawienia ACP per agent:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator harnessu, na przykład `codex` albo `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Pierwszeństwo nadpisywania dla sesji ACP powiązanych:

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
- W powiązanych rozmowach `/new` i `/reset` resetują ten sam klucz sesji ACP in-place.
- Tymczasowe powiązania runtime (na przykład tworzone przez przepływy fokusowania wątku) nadal obowiązują, gdy są obecne.
- Dla uruchomień ACP między agentami bez jawnego `cwd` OpenClaw dziedziczy workspace docelowego agenta z konfiguracji agenta.
- Brakujące odziedziczone ścieżki workspace wracają do domyślnego `cwd` backendu; niebrakujące błędy dostępu są zwracane jako błędy uruchomienia.

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

- `runtime` domyślnie ma wartość `subagent`, więc ustaw `runtime: "acp"` jawnie dla sesji ACP.
- Jeśli pominięto `agentId`, OpenClaw używa `acp.defaultAgent`, gdy jest skonfigurowane.
- `mode: "session"` wymaga `thread: true`, aby zachować trwałą powiązaną rozmowę.

Szczegóły interfejsu:

- `task` (wymagane): początkowy prompt wysyłany do sesji ACP.
- `runtime` (wymagane dla ACP): musi mieć wartość `"acp"`.
- `agentId` (opcjonalne): identyfikator docelowego harnessu ACP. Wraca do `acp.defaultAgent`, jeśli ustawiono.
- `thread` (opcjonalne, domyślnie `false`): żądanie przepływu powiązania z wątkiem tam, gdzie jest obsługiwane.
- `mode` (opcjonalne): `run` (jednorazowe) albo `session` (trwałe).
  - domyślnie `run`
  - jeśli `thread: true`, a mode pominięto, OpenClaw może domyślnie użyć zachowania trwałego zależnie od ścieżki runtime
  - `mode: "session"` wymaga `thread: true`
- `cwd` (opcjonalne): żądany katalog roboczy runtime (walidowany przez politykę backendu/runtime). Jeśli pominięto, uruchomienie ACP dziedziczy workspace docelowego agenta, gdy jest skonfigurowane; brakujące odziedziczone ścieżki wracają do wartości domyślnych backendu, a rzeczywiste błędy dostępu są zwracane.
- `label` (opcjonalne): etykieta widoczna dla operatora, używana w tekście sesji/baneru.
- `resumeSessionId` (opcjonalne): wznowienie istniejącej sesji ACP zamiast tworzenia nowej. Agent odtwarza historię rozmowy przez `session/load`. Wymaga `runtime: "acp"`.
- `streamTo` (opcjonalne): `"parent"` przesyła podsumowania postępu początkowego przebiegu ACP z powrotem do sesji żądającej jako zdarzenia systemowe.
  - Gdy dostępne, akceptowane odpowiedzi zawierają `streamLogPath` wskazujące plik JSONL o zakresie sesji (`<sessionId>.acp-stream.jsonl`), który można śledzić dla pełnej historii przekazywania.

### Wznawianie istniejącej sesji

Użyj `resumeSessionId`, aby kontynuować wcześniejszą sesję ACP zamiast zaczynać od zera. Agent odtwarza historię rozmowy przez `session/load`, więc wznawia pracę z pełnym kontekstem tego, co było wcześniej.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Typowe zastosowania:

- Przekazanie sesji Codex z laptopa na telefon — powiedz agentowi, żeby podjął pracę tam, gdzie skończyłeś
- Kontynuowanie sesji programistycznej rozpoczętej interaktywnie w CLI, teraz w trybie headless przez agenta
- Podjęcie pracy przerwanej przez restart gateway albo timeout bezczynności

Uwagi:

- `resumeSessionId` wymaga `runtime: "acp"` — zwraca błąd, jeśli zostanie użyte z runtime sub-agent.
- `resumeSessionId` przywraca historię rozmowy upstream ACP; `thread` i `mode` nadal działają normalnie dla nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
- Docelowy agent musi obsługiwać `session/load` (Codex i Claude Code to obsługują).
- Jeśli nie znaleziono identyfikatora sesji, uruchomienie kończy się czytelnym błędem — bez cichego fallbacku do nowej sesji.

### Smoke test operatora

Użyj tego po wdrożeniu gateway, gdy chcesz szybko sprawdzić na żywo, że uruchamianie ACP
rzeczywiście działa end-to-end, a nie tylko przechodzi testy jednostkowe.

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
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Zweryfikuj, że agent raportuje:
   - `accepted=yes`
   - rzeczywiste `childSessionKey`
   - brak błędu walidatora
6. Posprzątaj tymczasową sesję mostu ACPX.

Przykładowy prompt do aktywnego agenta:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Uwagi:

- Zachowaj ten smoke test przy `mode: "run"`, chyba że celowo testujesz
  trwałe sesje ACP powiązane z wątkiem.
- Nie wymagaj `streamTo: "parent"` dla podstawowej bramki. Ta ścieżka zależy od
  możliwości sesji osoby żądającej i jest osobnym testem integracyjnym.
- Traktuj testy `mode: "session"` powiązane z wątkiem jako drugi, bogatszy przebieg integracyjny
  z prawdziwego wątku Discord albo tematu Telegram.

## Zgodność z sandboxem

Sesje ACP obecnie działają w runtime hosta, a nie wewnątrz sandboxa OpenClaw.

Obecne ograniczenia:

- Jeśli sesja żądająca jest sandboxowana, uruchomienia ACP są blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
  - Błąd: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.
  - Błąd: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Użyj `runtime: "subagent"`, gdy potrzebujesz wykonania wymuszanego przez sandbox.

### Z polecenia `/acp`

Użyj `/acp spawn`, aby w razie potrzeby jawnie sterować z poziomu operatora z czatu.

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

Zobacz [Polecenia slash](/tools/slash-commands).

## Rozwiązywanie celu sesji

Większość akcji `/acp` akceptuje opcjonalny cel sesji (`session-key`, `session-id` albo `session-label`).

Kolejność rozwiązywania:

1. Jawny argument celu (albo `--session` dla `/acp steer`)
   - najpierw próba jako key
   - potem jako session id w kształcie UUID
   - potem jako label
2. Bieżące powiązanie z wątkiem (jeśli ta rozmowa / ten wątek są powiązane z sesją ACP)
3. Fallback do bieżącej sesji żądającej

Powiązania z bieżącą rozmową i z wątkiem uczestniczą w kroku 2.

Jeśli nic nie uda się rozwiązać, OpenClaw zwraca czytelny błąd (`Unable to resolve session target: ...`).

## Tryby powiązań przy uruchamianiu

`/acp spawn` obsługuje `--bind here|off`.

| Tryb   | Zachowanie                                                            |
| ------ | --------------------------------------------------------------------- |
| `here` | Powiąż bieżącą aktywną rozmowę in-place; zakończ błędem, jeśli nie ma aktywnej. |
| `off`  | Nie twórz powiązania z bieżącą rozmową.                               |

Uwagi:

- `--bind here` to najprostsza ścieżka operatora dla „niech ten kanał albo czat będzie oparty na Codex”.
- `--bind here` nie tworzy podrzędnego wątku.
- `--bind here` jest dostępne tylko na kanałach udostępniających obsługę powiązań z bieżącą rozmową.
- `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

## Tryby wątków przy uruchamianiu

`/acp spawn` obsługuje `--thread auto|here|off`.

| Tryb   | Zachowanie                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------------- |
| `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż podrzędny wątek, jeśli jest obsługiwany. |
| `here` | Wymagaj bieżącego aktywnego wątku; zakończ błędem, jeśli nie jesteś w wątku.                             |
| `off`  | Brak powiązania. Sesja startuje bez powiązania.                                                          |

Uwagi:

- Na powierzchniach bez obsługi powiązań z wątkiem domyślne zachowanie jest w praktyce `off`.
- Uruchamianie powiązane z wątkiem wymaga obsługi przez politykę kanału:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Użyj `--bind here`, gdy chcesz przypiąć bieżącą rozmowę bez tworzenia podrzędnego wątku.

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

`/acp status` pokazuje efektywne opcje runtime oraz, gdy są dostępne, identyfikatory sesji na poziomie runtime i backendu.

Niektóre kontrolki zależą od możliwości backendu. Jeśli backend nie obsługuje danej kontrolki, OpenClaw zwraca czytelny błąd unsupported-control.

## Książka kucharska poleceń ACP

| Polecenie            | Co robi                                                  | Przykład                                                      |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalne powiązanie z bieżącą rozmową lub wątkiem. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje turę in-flight dla docelowej sesji.              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję steer do działającej sesji.            | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i odwiązuje cele wątków.                    | `/acp close`                                                  |
| `/acp status`        | Pokazuje backend, tryb, stan, opcje runtime, możliwości. | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb runtime dla docelowej sesji.                | `/acp set-mode plan`                                          |
| `/acp set`           | Ogólny zapis opcji konfiguracji runtime.                 | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego runtime.           | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil polityki zatwierdzeń.                     | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia timeout runtime (sekundy).                       | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu runtime.                       | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji runtime sesji.                    | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP ze store.                   | `/acp sessions`                                               |
| `/acp doctor`        | Zdrowie backendu, możliwości, konkretne poprawki.        | `/acp doctor`                                                 |
| `/acp install`       | Wypisuje deterministyczne kroki instalacji i włączenia.  | `/acp install`                                                |

`/acp sessions` odczytuje store dla bieżącej powiązanej sesji albo sesji żądającej. Polecenia, które akceptują tokeny `session-key`, `session-id` albo `session-label`, rozwiązują cele przez wykrywanie sesji gateway, w tym własne katalogi `session.store` per agent.

## Mapowanie opcji runtime

`/acp` ma polecenia wygodne i ogólny setter.

Równoważne operacje:

- `/acp model <id>` mapuje na klucz konfiguracji runtime `model`.
- `/acp permissions <profile>` mapuje na klucz konfiguracji runtime `approval_policy`.
- `/acp timeout <seconds>` mapuje na klucz konfiguracji runtime `timeout`.
- `/acp cwd <path>` bezpośrednio aktualizuje nadpisanie cwd runtime.
- `/acp set <key> <value>` to ścieżka ogólna.
  - Szczególny przypadek: `key=cwd` używa ścieżki nadpisania cwd.
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

Gdy OpenClaw używa backendu acpx, preferuj te wartości dla `agentId`, chyba że Twoja konfiguracja acpx definiuje własne aliasy agentów.
Jeśli lokalna instalacja Cursor nadal udostępnia ACP jako `agent acp`, nadpisz polecenie agenta `cursor` w swojej konfiguracji acpx zamiast zmieniać wbudowaną wartość domyślną.

Bezpośrednie użycie CLI acpx może też kierować do dowolnych adapterów przez `--agent <command>`, ale ta surowa furtka jest funkcją CLI acpx (a nie normalną ścieżką `agentId` w OpenClaw).

## Wymagana konfiguracja

Bazowa konfiguracja ACP core:

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

Powiązania z bieżącą rozmową nie wymagają tworzenia podrzędnego wątku. Wymagają aktywnego kontekstu rozmowy i adaptera kanału udostępniającego powiązania rozmów ACP.

Zobacz [Dokumentację konfiguracji](/gateway/configuration-reference).

## Konfiguracja pluginu dla backendu acpx

Świeże instalacje dostarczają bundled plugin runtime `acpx` domyślnie włączony, więc ACP
zwykle działa bez ręcznego kroku instalacji pluginu.

Zacznij od:

```text
/acp doctor
```

Jeśli wyłączyłeś `acpx`, zablokowałeś go przez `plugins.allow` / `plugins.deny` albo chcesz
przełączyć się na lokalny checkout developerski, użyj jawnej ścieżki pluginu:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalacja z lokalnego workspace podczas developmentu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie zweryfikuj zdrowie backendu:

```text
/acp doctor
```

### Konfiguracja polecenia i wersji acpx

Domyślnie bundled plugin backendu acpx (`acpx`) używa przypiętej lokalnej binarki pluginu:

1. Polecenie domyślnie wskazuje plugin-local `node_modules/.bin/acpx` wewnątrz pakietu pluginu ACPX.
2. Oczekiwana wersja domyślnie odpowiada przypięciu rozszerzenia.
3. Startup rejestruje backend ACP natychmiast jako not-ready.
4. Zadanie ensure w tle weryfikuje `acpx --version`.
5. Jeśli lokalna binarka pluginu brakuje albo wersja się nie zgadza, uruchamia:
   `npm install --omit=dev --no-save acpx@<pinned>` i ponownie weryfikuje.

Możesz nadpisać polecenie / wersję w konfiguracji pluginu:

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

- `command` akceptuje ścieżkę bezwzględną, względną albo nazwę polecenia (`acpx`).
- Ścieżki względne są rozwiązywane względem katalogu workspace OpenClaw.
- `expectedVersion: "any"` wyłącza ścisłe dopasowanie wersji.
- Gdy `command` wskazuje własną binarkę / ścieżkę, automatyczna instalacja lokalna pluginu jest wyłączona.
- Startup OpenClaw pozostaje nieblokujący, gdy działa kontrola zdrowia backendu.

Zobacz [Plugins](/tools/plugin).

### Automatyczna instalacja zależności

Gdy instalujesz OpenClaw globalnie przez `npm install -g openclaw`, zależności runtime acpx
(binarki specyficzne dla platformy) są instalowane automatycznie
przez hook postinstall. Jeśli instalacja automatyczna się nie powiedzie, gateway nadal uruchamia się
normalnie i raportuje brakującą zależność przez `openclaw acp doctor`.

### Most MCP dla narzędzi pluginów

Domyślnie sesje ACPX **nie** udostępniają zarejestrowanych w pluginach narzędzi OpenClaw do
harnessu ACP.

Jeśli chcesz, aby agenci ACP tacy jak Codex albo Claude Code mogli wywoływać zainstalowane
narzędzia pluginów OpenClaw, takie jak memory recall/store, włącz dedykowany most:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-plugin-tools` do bootstrapu sesji ACPX.
- Udostępnia narzędzia pluginów już zarejestrowane przez zainstalowane i włączone pluginy OpenClaw.
- Utrzymuje tę funkcję jako jawną i domyślnie wyłączoną.

Uwagi dotyczące bezpieczeństwa i zaufania:

- To rozszerza powierzchnię narzędzi harnessu ACP.
- Agenci ACP otrzymują dostęp tylko do narzędzi pluginów już aktywnych w gateway.
- Traktuj to jako tę samą granicę zaufania, co pozwolenie tym pluginom na wykonywanie kodu
  w samym OpenClaw.
- Przed włączeniem sprawdź zainstalowane pluginy.

Własne `mcpServers` nadal działają jak wcześniej. Wbudowany most plugin-tools to
dodatkowa wygoda typu opt-in, a nie zamiennik ogólnej konfiguracji serwera MCP.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TTY do zatwierdzania albo odrzucania promptów uprawnień zapisu plików i wykonania shella. Plugin acpx udostępnia dwa klucze konfiguracyjne kontrolujące sposób obsługi uprawnień:

Te uprawnienia harnessu ACPX są oddzielone od zatwierdzeń exec OpenClaw i od flag obejścia dostawcy w backendach CLI, takich jak Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` to przełącznik awaryjny na poziomie harnessu dla sesji ACP.

### `permissionMode`

Steruje tym, które operacje agent harnessu może wykonywać bez promptu.

| Wartość         | Zachowanie                                                   |
| --------------- | ------------------------------------------------------------ |
| `approve-all`   | Automatycznie zatwierdza wszystkie zapisy plików i polecenia shell. |
| `approve-reads` | Automatycznie zatwierdza tylko odczyty; zapis i exec wymagają promptów. |
| `deny-all`      | Odrzuca wszystkie prompty uprawnień.                         |

### `nonInteractivePermissions`

Steruje tym, co się dzieje, gdy prompt uprawnień miałby zostać pokazany, ale nie ma dostępnego interaktywnego TTY (co zawsze ma miejsce dla sesji ACP).

| Wartość | Zachowanie                                                          |
| ------- | ------------------------------------------------------------------- |
| `fail`  | Przerywa sesję z `AcpRuntimeError`. **(domyślnie)**                 |
| `deny`  | Po cichu odrzuca uprawnienie i kontynuuje (łagodne pogorszenie działania). |

### Konfiguracja

Ustaw przez konfigurację pluginu:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Po zmianie tych wartości uruchom ponownie gateway.

> **Ważne:** OpenClaw obecnie domyślnie używa `permissionMode=approve-reads` i `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każdy zapis albo exec wywołujący prompt uprawnień może zakończyć się błędem `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jeśli chcesz ograniczyć uprawnienia, ustaw `nonInteractivePermissions` na `deny`, aby sesje degradowały się łagodnie zamiast się wywracać.

## Rozwiązywanie problemów

| Objaw                                                                      | Prawdopodobna przyczyna                                                           | Poprawka                                                                                                                                                            |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                    | Brakuje pluginu backendu albo jest wyłączony.                                     | Zainstaluj i włącz plugin backendu, a następnie uruchom `/acp doctor`.                                                                                             |
| `ACP is disabled by policy (acp.enabled=false)`                            | ACP jest globalnie wyłączone.                                                     | Ustaw `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`          | Dispatch z normalnych wiadomości wątku jest wyłączony.                            | Ustaw `acp.dispatch.enabled=true`.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                | Agent nie znajduje się na allowliście.                                            | Użyj dozwolonego `agentId` albo zaktualizuj `acp.allowedAgents`.                                                                                                   |
| `Unable to resolve session target: ...`                                    | Nieprawidłowy token key/id/label.                                                 | Uruchom `/acp sessions`, skopiuj dokładny key/label i spróbuj ponownie.                                                                                            |
| `--bind here requires running /acp spawn inside an active ... conversation`| `--bind here` użyto bez aktywnej rozmowy możliwej do powiązania.                  | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj uruchomienia bez powiązania.                                                                      |
| `Conversation bindings are unavailable for <channel>.`                     | Adapter nie ma możliwości powiązań ACP z bieżącą rozmową.                         | Użyj `/acp spawn ... --thread ...`, jeśli jest obsługiwane, skonfiguruj najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału.                   |
| `--thread here requires running /acp spawn inside an active ... thread`    | `--thread here` użyto poza kontekstem wątku.                                      | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                       |
| `Only <user-id> can rebind this channel/conversation/thread.`              | Inny użytkownik jest właścicielem aktywnego celu powiązania.                      | Przepnij jako właściciel albo użyj innej rozmowy lub wątku.                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                           | Adapter nie ma możliwości powiązań z wątkiem.                                     | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału.                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                         | Runtime ACP działa po stronie hosta; sesja żądająca jest sandboxowana.            | Użyj `runtime="subagent"` z sandboxowanych sesji albo uruchom ACP z sesji niesandboxowanej.                                                                        |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`    | Zażądano `sandbox="require"` dla runtime ACP.                                     | Użyj `runtime="subagent"` dla wymaganego sandboxingu albo ACP z `sandbox="inherit"` z sesji niesandboxowanej.                                                     |
| Missing ACP metadata for bound session                                     | Przestarzałe/usunięte metadane sesji ACP.                                         | Utwórz ponownie przez `/acp spawn`, a następnie ponownie powiąż / ustaw fokus na wątku.                                                                           |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`   | `permissionMode` blokuje zapis/exec w nieinteraktywnej sesji ACP.                 | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i uruchom ponownie gateway. Zobacz [Konfigurację uprawnień](#permission-configuration).       |
| ACP session fails early with little output                                 | Prompty uprawnień są blokowane przez `permissionMode`/`nonInteractivePermissions`. | Sprawdź logi gateway pod kątem `AcpRuntimeError`. Dla pełnych uprawnień ustaw `permissionMode=approve-all`; dla łagodnej degradacji ustaw `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                      | Proces harnessu zakończył się, ale sesja ACP nie zgłosiła zakończenia.            | Monitoruj przez `ps aux \| grep acpx`; ręcznie zabij zaległe procesy.                                                                                              |
