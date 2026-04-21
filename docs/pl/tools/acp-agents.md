---
read_when:
    - Uruchamianie harnessów kodowania przez ACP
    - Konfigurowanie sesji ACP powiązanych z rozmową na kanałach wiadomości
    - Powiązanie rozmowy w kanale wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP i okablowaniem Plugin
    - Obsługa poleceń `/acp` z poziomu czatu
summary: Używaj sesji runtime ACP dla Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP i innych agentów harnessu
title: ACP Agenty
x-i18n:
    generated_at: "2026-04-21T10:01:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e458ff21d63e52ed0eed4ed65ba2c45aecae20563a3ef10bf4b64e948284b51a
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP Agenty

Sesje [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) pozwalają OpenClaw uruchamiać zewnętrzne harnessy kodowania (na przykład Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI i inne obsługiwane harnessy ACPX) przez Plugin backendu ACP.

Jeśli poprosisz OpenClaw prostym językiem o „uruchom to w Codex” albo „uruchom Claude Code w wątku”, OpenClaw powinien skierować to żądanie do runtime ACP (a nie do natywnego runtime subagenta). Każde utworzenie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

Jeśli chcesz, aby Codex albo Claude Code łączyły się bezpośrednio jako zewnętrzny klient MCP
do istniejących rozmów kanałów OpenClaw, użyj
[`openclaw mcp serve`](/cli/mcp) zamiast ACP.

## Której strony potrzebuję?

Istnieją trzy pobliskie powierzchnie, które łatwo pomylić:

| Chcesz...                                                                          | Użyj tego                              | Uwagi                                                                                                              |
| ---------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Uruchamiać Codex, Claude Code, Gemini CLI lub inny zewnętrzny harness _przez_ OpenClaw | Ta strona: ACP Agenty                  | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki runtime |
| Udostępnić sesję OpenClaw Gateway _jako_ serwer ACP dla edytora lub klienta        | [`openclaw acp`](/cli/acp)             | Tryb mostu. IDE/klient mówi ACP do OpenClaw przez stdio/WebSocket                                                 |
| Ponownie użyć lokalnego AI CLI jako tekstowego modelu fallback                     | [Backendy CLI](/pl/gateway/cli-backends)  | To nie jest ACP. Bez narzędzi OpenClaw, bez kontrolek ACP, bez runtime harnessu                                   |

## Czy to działa od razu po instalacji?

Zwykle tak.

- Świeże instalacje dostarczają teraz wbudowany Plugin runtime `acpx`, włączony domyślnie.
- Wbudowany Plugin `acpx` preferuje swoje lokalne, przypięte binarium `acpx`.
- Przy uruchomieniu OpenClaw sonduje to binarium i samodzielnie je naprawia, jeśli to potrzebne.
- Zacznij od `/acp doctor`, jeśli chcesz szybko sprawdzić gotowość.

Co nadal może się zdarzyć przy pierwszym użyciu:

- Adapter docelowego harnessu może zostać pobrany na żądanie przez `npx` przy pierwszym użyciu tego harnessu.
- Auth dostawcy nadal musi istnieć na hoście dla tego harnessu.
- Jeśli host nie ma dostępu do npm/sieci, pobrania adaptera przy pierwszym uruchomieniu mogą się nie udać, dopóki cache nie zostanie rozgrzany albo adapter nie zostanie zainstalowany w inny sposób.

Przykłady:

- `/acp spawn codex`: OpenClaw powinien być gotowy do bootstrapu `acpx`, ale adapter ACP Codex może nadal wymagać pobrania przy pierwszym uruchomieniu.
- `/acp spawn claude`: to samo dotyczy adaptera Claude ACP, plus auth po stronie Claude na tym hoście.

## Szybki przepływ operatora

Użyj tego, jeśli chcesz praktyczny runbook `/acp`:

1. Utwórz sesję:
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
   - `/acp cancel` (zatrzymaj bieżący turn), albo
   - `/acp close` (zamknij sesję + usuń powiązania)

## Szybki start dla ludzi

Przykłady naturalnych próśb:

- „Powiąż ten kanał Discord z Codex.”
- „Uruchom trwałą sesję Codex w wątku tutaj i utrzymuj ją w skupieniu.”
- „Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik.”
- „Powiąż ten czat iMessage z Codex i utrzymuj follow-upy w tym samym obszarze roboczym.”
- „Użyj Gemini CLI do tego zadania w wątku, a potem utrzymuj follow-upy w tym samym wątku.”

Co OpenClaw powinien zrobić:

1. Wybrać `runtime: "acp"`.
2. Rozwiązać żądany cel harnessu (`agentId`, na przykład `codex`).
3. Jeśli żądane jest powiązanie z bieżącą rozmową i aktywny kanał to obsługuje, powiązać sesję ACP z tą rozmową.
4. W przeciwnym razie, jeśli żądane jest powiązanie z wątkiem i bieżący kanał to obsługuje, powiązać sesję ACP z wątkiem.
5. Kierować follow-upy powiązane z tą samą sesją ACP, dopóki nie zostanie odfokusowana/zamknięta/wygaśnięta.

## ACP kontra subagenty

Używaj ACP, gdy chcesz zewnętrznego runtime harnessu. Używaj subagentów, gdy chcesz delegowanych uruchomień natywnych dla OpenClaw.

| Obszar        | Sesja ACP                              | Uruchomienie subagenta              |
| ------------- | -------------------------------------- | ----------------------------------- |
| Runtime       | Plugin backendu ACP (na przykład acpx) | Natywny runtime subagenta OpenClaw  |
| Klucz sesji   | `agent:<agentId>:acp:<uuid>`           | `agent:<agentId>:subagent:<uuid>`   |
| Główne polecenia | `/acp ...`                          | `/subagents ...`                    |
| Narzędzie spawn | `sessions_spawn` z `runtime:"acp"`   | `sessions_spawn` (domyślny runtime) |

Zobacz też [Subagenty](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

W przypadku Claude Code przez ACP stos jest następujący:

1. Control plane sesji ACP OpenClaw
2. wbudowany Plugin runtime `acpx`
3. adapter Claude ACP
4. mechanika runtime/sesji po stronie Claude

Ważne rozróżnienie:

- ACP Claude to sesja harnessu z kontrolkami ACP, wznawianiem sesji, śledzeniem zadań w tle i opcjonalnym powiązaniem z rozmową/wątkiem.
- Backendy CLI to oddzielne lokalne runtime fallback tylko tekstowe. Zobacz [Backendy CLI](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada jest taka:

- chcesz `/acp spawn`, sesje możliwe do powiązania, kontrolki runtime albo trwałą pracę harnessu: użyj ACP
- chcesz prosty lokalny fallback tekstowy przez surowe CLI: użyj backendów CLI

## Sesje powiązane

### Powiązania z bieżącą rozmową

Użyj `/acp spawn <harness> --bind here`, gdy chcesz, aby bieżąca rozmowa stała się trwałym obszarem roboczym ACP bez tworzenia podrzędnego wątku.

Zachowanie:

- OpenClaw nadal pozostaje właścicielem transportu kanału, auth, bezpieczeństwa i dostarczania.
- Bieżąca rozmowa jest przypinana do utworzonego klucza sesji ACP.
- Follow-upy w tej rozmowie są kierowane do tej samej sesji ACP.
- `/new` i `/reset` resetują tę samą powiązaną sesję ACP w miejscu.
- `/acp close` zamyka sesję i usuwa powiązanie bieżącej rozmowy.

Co to oznacza w praktyce:

- `--bind here` zachowuje tę samą powierzchnię czatu. Na Discord bieżący kanał pozostaje bieżącym kanałem.
- `--bind here` nadal może utworzyć nową sesję ACP, jeśli tworzysz świeżą pracę. Powiązanie dołącza tę sesję do bieżącej rozmowy.
- `--bind here` samo z siebie nie tworzy podrzędnego wątku Discord ani tematu Telegram.
- Runtime ACP nadal może mieć własny katalog roboczy (`cwd`) albo obszar roboczy zarządzany przez backend na dysku. Ten obszar roboczy runtime jest oddzielony od powierzchni czatu i nie implikuje nowego wątku wiadomości.
- Jeśli tworzysz sesję dla innego ACP agent i nie podasz `--cwd`, OpenClaw domyślnie dziedziczy obszar roboczy **docelowego agenta**, a nie żądającego.
- Jeśli ta odziedziczona ścieżka obszaru roboczego nie istnieje (`ENOENT`/`ENOTDIR`), OpenClaw przechodzi awaryjnie do domyślnego `cwd` backendu zamiast po cichu ponownie użyć niewłaściwego drzewa.
- Jeśli odziedziczony obszar roboczy istnieje, ale nie ma do niego dostępu (na przykład `EACCES`), utworzenie sesji zwraca rzeczywisty błąd dostępu zamiast porzucać `cwd`.

Model mentalny:

- powierzchnia czatu: gdzie ludzie dalej rozmawiają (`kanał Discord`, `temat Telegram`, `czat iMessage`)
- sesja ACP: trwały stan runtime Codex/Claude/Gemini, do którego kieruje OpenClaw
- podrzędny wątek/temat: opcjonalna dodatkowa powierzchnia wiadomości tworzona tylko przez `--thread ...`
- obszar roboczy runtime: lokalizacja systemu plików, w której działa harness (`cwd`, checkout repo, obszar roboczy backendu)

Przykłady:

- `/acp spawn codex --bind here`: zachowaj ten czat, utwórz lub dołącz sesję Codex ACP i kieruj do niej przyszłe wiadomości stąd
- `/acp spawn codex --thread auto`: OpenClaw może utworzyć podrzędny wątek/temat i tam powiązać sesję ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: takie samo powiązanie czatu jak wyżej, ale Codex działa w `/workspace/repo`

Obsługa powiązania z bieżącą rozmową:

- Kanały czatu/wiadomości, które reklamują obsługę powiązania z bieżącą rozmową, mogą używać `--bind here` przez współdzieloną ścieżkę powiązania rozmowy.
- Kanały z niestandardową semantyką wątków/tematów nadal mogą udostępniać kanonicjalizację specyficzną dla kanału za tą samą współdzieloną warstwą.
- `--bind here` zawsze oznacza „powiąż bieżącą rozmowę w miejscu”.
- Generyczne powiązania z bieżącą rozmową używają współdzielonego magazynu powiązań OpenClaw i przetrwają zwykłe restarty gateway.

Uwagi:

- `--bind here` i `--thread ...` wzajemnie się wykluczają w `/acp spawn`.
- Na Discord `--bind here` wiąże bieżący kanał lub wątek w miejscu. `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć podrzędny wątek dla `--thread auto|here`.
- Jeśli aktywny kanał nie udostępnia powiązań ACP z bieżącą rozmową, OpenClaw zwraca jasny komunikat o braku obsługi.
- `resume` i pytania o „new session” dotyczą sesji ACP, a nie kanału. Możesz ponownie użyć albo zastąpić stan runtime bez zmiany bieżącej powierzchni czatu.

### Sesje powiązane z wątkiem

Gdy powiązania wątków są włączone dla adaptera kanału, sesje ACP mogą być wiązane z wątkami:

- OpenClaw wiąże wątek z docelową sesją ACP.
- Follow-upy w tym wątku są kierowane do powiązanej sesji ACP.
- Wynik ACP jest dostarczany z powrotem do tego samego wątku.
- Odfokusowanie/zamknięcie/archiwizacja/przekroczenie limitu bezczynności lub maksymalnego wieku usuwa powiązanie.

Obsługa powiązań wątków zależy od adaptera. Jeśli aktywny adapter kanału nie obsługuje powiązań wątków, OpenClaw zwraca jasny komunikat unsupported/unavailable.

Wymagane flagi funkcji dla ACP powiązanego z wątkiem:

- `acp.enabled=true`
- `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać dispatch ACP)
- Włączona flaga tworzenia wątków ACP adaptera kanału (zależna od adaptera)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanały obsługujące wątki

- Każdy adapter kanału, który udostępnia możliwość powiązania sesji/wątku.
- Obecne wbudowane wsparcie:
  - wątki/kanały Discord
  - tematy Telegram (tematy forum w grupach/supergrupach oraz tematy DM)
- Kanały Plugin mogą dodać wsparcie przez ten sam interfejs powiązań.

## Ustawienia specyficzne dla kanału

Dla przepływów nieefemerycznych skonfiguruj trwałe powiązania ACP w wpisach najwyższego poziomu `bindings[]`.

### Model powiązań

- `bindings[].type="acp"` oznacza trwałe powiązanie rozmowy ACP.
- `bindings[].match` identyfikuje docelową rozmowę:
  - Kanał lub wątek Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Temat forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - DM/czat grupowy BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferuj `chat_id:*` lub `chat_identifier:*` dla stabilnych powiązań grup.
  - DM/czat grupowy iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferuj `chat_id:*` dla stabilnych powiązań grup.
- `bindings[].agentId` to id agenta OpenClaw będącego właścicielem.
- Opcjonalne nadpisania ACP znajdują się w `bindings[].acp`:
  - `mode` (`persistent` lub `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Domyślne ustawienia runtime per agent

Użyj `agents.list[].runtime`, aby raz zdefiniować domyślne ustawienia ACP per agent:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harnessu, na przykład `codex` lub `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Priorytet nadpisywania dla powiązanych sesji ACP:

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

- OpenClaw zapewnia istnienie skonfigurowanej sesji ACP przed użyciem.
- Wiadomości w tym kanale lub temacie są kierowane do skonfigurowanej sesji ACP.
- W powiązanych rozmowach `/new` i `/reset` resetują ten sam klucz sesji ACP w miejscu.
- Tymczasowe powiązania runtime (na przykład utworzone przez przepływy focusu wątku) nadal mają zastosowanie tam, gdzie istnieją.
- Przy tworzeniu ACP między agentami bez jawnego `cwd` OpenClaw dziedziczy obszar roboczy docelowego agenta z konfiguracji agenta.
- Brakujące odziedziczone ścieżki obszaru roboczego wracają awaryjnie do domyślnego `cwd` backendu; błędy dostępu do istniejących ścieżek są zgłaszane jako błędy tworzenia sesji.

## Uruchamianie sesji ACP (interfejsy)

### Z `sessions_spawn`

Użyj `runtime: "acp"`, aby uruchomić sesję ACP z turnu agenta lub wywołania narzędzia.

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

- `runtime` domyślnie ma wartość `subagent`, więc dla sesji ACP jawnie ustaw `runtime: "acp"`.
- Jeśli `agentId` zostanie pominięte, OpenClaw użyje `acp.defaultAgent`, gdy jest skonfigurowane.
- `mode: "session"` wymaga `thread: true`, aby zachować trwałą powiązaną rozmowę.

Szczegóły interfejsu:

- `task` (wymagane): początkowy prompt wysyłany do sesji ACP.
- `runtime` (wymagane dla ACP): musi mieć wartość `"acp"`.
- `agentId` (opcjonalne): id docelowego harnessu ACP. Wraca awaryjnie do `acp.defaultAgent`, jeśli jest ustawione.
- `thread` (opcjonalne, domyślnie `false`): żądanie przepływu powiązania z wątkiem tam, gdzie jest obsługiwane.
- `mode` (opcjonalne): `run` (jednorazowe) lub `session` (trwałe).
  - wartością domyślną jest `run`
  - jeśli `thread: true`, a tryb pominięto, OpenClaw może domyślnie przejść do zachowania trwałego zależnie od ścieżki runtime
  - `mode: "session"` wymaga `thread: true`
- `cwd` (opcjonalne): żądany katalog roboczy runtime (walidowany przez politykę backendu/runtime). Jeśli zostanie pominięty, tworzenie ACP dziedziczy obszar roboczy docelowego agenta, gdy jest skonfigurowany; brakujące odziedziczone ścieżki wracają awaryjnie do domyślnych ustawień backendu, natomiast rzeczywiste błędy dostępu są zwracane.
- `label` (opcjonalne): etykieta widoczna dla operatora używana w tekście sesji/banneru.
- `resumeSessionId` (opcjonalne): wznowienie istniejącej sesji ACP zamiast tworzenia nowej. Agent odtwarza historię rozmowy przez `session/load`. Wymaga `runtime: "acp"`.
- `streamTo` (opcjonalne): `"parent"` strumieniuje podsumowania postępu początkowego uruchomienia ACP z powrotem do sesji żądającej jako zdarzenia systemowe.
  - Gdy jest dostępne, zaakceptowane odpowiedzi zawierają `streamLogPath` wskazujące na ograniczony do sesji log JSONL (`<sessionId>.acp-stream.jsonl`), który można śledzić, aby zobaczyć pełną historię przekazywania.

### Wznowienie istniejącej sesji

Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast zaczynać od nowa. Agent odtwarza historię rozmowy przez `session/load`, więc podejmuje pracę z pełnym kontekstem tego, co było wcześniej.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Typowe przypadki użycia:

- Przekazanie sesji Codex z laptopa na telefon — powiedz agentowi, aby podjął pracę tam, gdzie skończyłeś
- Kontynuowanie sesji kodowania rozpoczętej interaktywnie w CLI, teraz bezgłowo przez agenta
- Podjęcie pracy przerwanej przez restart gateway lub timeout bezczynności

Uwagi:

- `resumeSessionId` wymaga `runtime: "acp"` — zwraca błąd, jeśli zostanie użyte z runtime subagenta.
- `resumeSessionId` przywraca historię rozmowy nadrzędnego ACP; `thread` i `mode` nadal normalnie odnoszą się do nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
- Docelowy agent musi obsługiwać `session/load` (Codex i Claude Code obsługują).
- Jeśli nie znaleziono id sesji, tworzenie sesji kończy się jasnym błędem — bez cichego fallbacku do nowej sesji.

### Smoke test operatora

Użyj tego po wdrożeniu gateway, gdy chcesz szybko sprawdzić na żywo, czy tworzenie ACP
rzeczywiście działa end-to-end, a nie tylko przechodzi testy jednostkowe.

Zalecana bramka:

1. Zweryfikuj wdrożoną wersję/commit gateway na docelowym hoście.
2. Potwierdź, że wdrożone źródło zawiera akceptację linii rodowej ACP w
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Otwórz tymczasową sesję mostu ACPX do działającego live agent (na przykład
   `razor(main)` na `jpclawhq`).
4. Poproś tego agenta o wywołanie `sessions_spawn` z:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - zadanie: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Zweryfikuj, że agent raportuje:
   - `accepted=yes`
   - prawdziwe `childSessionKey`
   - brak błędu walidatora
6. Posprzątaj tymczasową sesję mostu ACPX.

Przykładowy prompt do live agent:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Uwagi:

- Dla tego smoke testu trzymaj się `mode: "run"`, chyba że celowo testujesz
  trwałe sesje ACP powiązane z wątkiem.
- Nie wymagaj `streamTo: "parent"` dla podstawowej bramki. Ta ścieżka zależy od
  możliwości żądającego/sesji i stanowi osobną kontrolę integracyjną.
- Testowanie `mode: "session"` powiązanego z wątkiem traktuj jako drugi, bogatszy
  przebieg integracyjny z rzeczywistego wątku Discord lub tematu Telegram.

## Zgodność z sandbox

Sesje ACP działają obecnie na runtime hosta, a nie wewnątrz sandbox OpenClaw.

Bieżące ograniczenia:

- Jeśli sesja żądająca jest sandboxowana, tworzenie ACP jest blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
  - Błąd: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.
  - Błąd: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Użyj `runtime: "subagent"`, gdy potrzebujesz wykonania wymuszanego przez sandbox.

### Z polecenia `/acp`

Użyj `/acp spawn`, aby w razie potrzeby mieć jawne sterowanie operatora z poziomu czatu.

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

Większość akcji `/acp` akceptuje opcjonalny cel sesji (`session-key`, `session-id` albo `session-label`).

Kolejność rozwiązywania:

1. Jawny argument celu (albo `--session` dla `/acp steer`)
   - najpierw próba jako klucz
   - potem jako id sesji w kształcie UUID
   - następnie jako etykieta
2. Bieżące powiązanie wątku (jeśli ta rozmowa/ten wątek jest powiązany z sesją ACP)
3. Fallback do bieżącej sesji żądającej

Powiązania z bieżącą rozmową i z wątkiem uczestniczą w kroku 2.

Jeśli nie uda się rozwiązać żadnego celu, OpenClaw zwraca jasny błąd (`Unable to resolve session target: ...`).

## Tryby powiązań przy tworzeniu sesji

`/acp spawn` obsługuje `--bind here|off`.

| Tryb   | Zachowanie                                                            |
| ------ | --------------------------------------------------------------------- |
| `here` | Powiąż bieżącą aktywną rozmowę w miejscu; zakończ błędem, jeśli żadna nie jest aktywna. |
| `off`  | Nie twórz powiązania z bieżącą rozmową.                               |

Uwagi:

- `--bind here` to najprostsza ścieżka operatora dla „zrób z tego kanału lub czatu backend Codex”.
- `--bind here` nie tworzy podrzędnego wątku.
- `--bind here` jest dostępne tylko na kanałach, które udostępniają obsługę powiązania z bieżącą rozmową.
- `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

## Tryby wątku przy tworzeniu sesji

`/acp spawn` obsługuje `--thread auto|here|off`.

| Tryb   | Zachowanie                                                                                          |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż podrzędny wątek tam, gdzie jest obsługiwany. |
| `here` | Wymagaj bieżącego aktywnego wątku; zakończ błędem, jeśli nie jesteś w wątku.                        |
| `off`  | Bez powiązania. Sesja uruchamia się jako niepowiązana.                                              |

Uwagi:

- Na powierzchniach bez powiązań wątków zachowanie domyślne jest w praktyce `off`.
- Tworzenie sesji powiązanej z wątkiem wymaga wsparcia polityki kanału:
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

`/acp status` pokazuje efektywne opcje runtime oraz, gdy są dostępne, zarówno identyfikatory sesji na poziomie runtime, jak i backendu.

Niektóre kontrolki zależą od możliwości backendu. Jeśli backend nie obsługuje danej kontrolki, OpenClaw zwraca jasny błąd unsupported-control.

## Książka kucharska poleceń ACP

| Polecenie            | Co robi                                                         | Przykład                                                      |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalne bieżące powiązanie lub powiązanie z wątkiem. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje turn w toku dla docelowej sesji.                        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję sterującą do uruchomionej sesji.              | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i odwiązuje cele wątków.                           | `/acp close`                                                  |
| `/acp status`        | Pokazuje backend, tryb, stan, opcje runtime i możliwości.       | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb runtime dla docelowej sesji.                       | `/acp set-mode plan`                                          |
| `/acp set`           | Generyczny zapis opcji konfiguracji runtime.                    | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego runtime.                  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil polityki zatwierdzeń.                            | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia timeout runtime (sekundy).                              | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu runtime.                              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji runtime sesji.                           | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP z magazynu.                        | `/acp sessions`                                               |
| `/acp doctor`        | Kondycja backendu, możliwości, możliwe działania naprawcze.     | `/acp doctor`                                                 |
| `/acp install`       | Wypisuje deterministyczne kroki instalacji i włączania.         | `/acp install`                                                |

`/acp sessions` odczytuje magazyn dla bieżącej sesji powiązanej albo sesji żądającej. Polecenia, które akceptują tokeny `session-key`, `session-id` lub `session-label`, rozwiązują cele przez odkrywanie sesji gateway, w tym niestandardowe katalogi główne `session.store` per agent.

## Mapowanie opcji runtime

`/acp` ma polecenia wygodne i generyczny setter.

Operacje równoważne:

- `/acp model <id>` mapuje się na klucz konfiguracji runtime `model`.
- `/acp permissions <profile>` mapuje się na klucz konfiguracji runtime `approval_policy`.
- `/acp timeout <seconds>` mapuje się na klucz konfiguracji runtime `timeout`.
- `/acp cwd <path>` bezpośrednio aktualizuje nadpisanie cwd runtime.
- `/acp set <key> <value>` to ścieżka generyczna.
  - Przypadek specjalny: `key=cwd` używa ścieżki nadpisania cwd.
- `/acp reset-options` czyści wszystkie nadpisania runtime dla docelowej sesji.

## Obsługa harnessów acpx (obecnie)

Aktualne wbudowane aliasy harnessów acpx:

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
Jeśli twoja lokalna instalacja Cursor nadal udostępnia ACP jako `agent acp`, nadpisz polecenie agenta `cursor` w konfiguracji acpx zamiast zmieniać wbudowaną wartość domyślną.

Bezpośrednie użycie CLI acpx może też kierować do dowolnych adapterów przez `--agent <command>`, ale to surowe wyjście awaryjne jest funkcją CLI acpx (a nie zwykłą ścieżką `agentId` OpenClaw).

## Wymagana konfiguracja

Bazowa konfiguracja ACP w core:

```json5
{
  acp: {
    enabled: true,
    // Opcjonalne. Domyślnie true; ustaw false, aby wstrzymać dispatch ACP, zachowując kontrolki /acp.
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

Jeśli tworzenie ACP powiązanego z wątkiem nie działa, najpierw sprawdź flagę funkcji adaptera:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Powiązania z bieżącą rozmową nie wymagają tworzenia podrzędnego wątku. Wymagają aktywnego kontekstu rozmowy i adaptera kanału, który udostępnia powiązania rozmowy ACP.

Zobacz [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference).

## Konfiguracja Plugin dla backendu acpx

Świeże instalacje dostarczają wbudowany Plugin runtime `acpx`, włączony domyślnie, więc ACP
zwykle działa bez ręcznego kroku instalacji Plugin.

Zacznij od:

```text
/acp doctor
```

Jeśli wyłączyłeś `acpx`, zablokowałeś go przez `plugins.allow` / `plugins.deny` albo chcesz
przełączyć się na lokalny checkout developerski, użyj jawnej ścieżki Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokalna instalacja workspace podczas developmentu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie zweryfikuj kondycję backendu:

```text
/acp doctor
```

### Konfiguracja polecenia i wersji acpx

Domyślnie wbudowany Plugin backendu acpx (`acpx`) używa lokalnego przypiętego binarium Plugin:

1. Polecenie domyślnie wskazuje lokalne dla Plugin `node_modules/.bin/acpx` wewnątrz pakietu Plugin ACPX.
2. Oczekiwana wersja domyślnie odpowiada przypięciu extension.
3. Przy uruchomieniu ACP backend jest natychmiast rejestrowany jako not-ready.
4. Zadanie ensure w tle weryfikuje `acpx --version`.
5. Jeśli lokalne dla Plugin binarium nie istnieje albo nie pasuje, uruchamia:
   `npm install --omit=dev --no-save acpx@<pinned>` i ponownie weryfikuje.

Możesz nadpisać polecenie/wersję w konfiguracji Plugin:

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
- Ścieżki względne są rozwiązywane względem katalogu workspace OpenClaw.
- `expectedVersion: "any"` wyłącza ścisłe dopasowanie wersji.
- Gdy `command` wskazuje niestandardowe binarium/ścieżkę, automatyczna instalacja lokalna dla Plugin jest wyłączana.
- Uruchomienie OpenClaw pozostaje nieblokujące podczas działania kontroli kondycji backendu.

Zobacz [Plugin](/pl/tools/plugin).

### Automatyczna instalacja zależności

Gdy instalujesz OpenClaw globalnie przez `npm install -g openclaw`, zależności runtime acpx
(binaria zależne od platformy) są instalowane automatycznie
przez hook postinstall. Jeśli instalacja automatyczna się nie powiedzie, gateway nadal uruchamia się
normalnie i raportuje brakującą zależność przez `openclaw acp doctor`.

### Most MCP narzędzi Plugin

Domyślnie sesje ACPX **nie** udostępniają harnessowi ACP narzędzi zarejestrowanych przez Plugin OpenClaw.

Jeśli chcesz, aby ACP agenty, takie jak Codex czy Claude Code, mogły wywoływać zainstalowane
narzędzia Plugin OpenClaw, takie jak memory recall/store, włącz dedykowany most:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-plugin-tools` do
  bootstrapu sesji ACPX.
- Udostępnia narzędzia Plugin już zarejestrowane przez zainstalowane i włączone Plugin OpenClaw.
- Utrzymuje tę funkcję jako jawną i domyślnie wyłączoną.

Uwagi dotyczące bezpieczeństwa i zaufania:

- To rozszerza powierzchnię narzędzi harnessu ACP.
- ACP agenty uzyskują dostęp tylko do narzędzi Plugin już aktywnych w gateway.
- Traktuj to jako tę samą granicę zaufania, co pozwolenie tym Plugin wykonywać się
  w samym OpenClaw.
- Przed włączeniem przejrzyj zainstalowane Plugin.

Niestandardowe `mcpServers` nadal działają jak wcześniej. Wbudowany most plugin-tools to
dodatkowa opcja wygody opt-in, a nie zamiennik generycznej konfiguracji serwera MCP.

### Konfiguracja timeoutu runtime

Wbudowany Plugin `acpx` domyślnie ustawia timeout osadzonych turnów runtime na 120 sekund.
Dzięki temu wolniejsze harnessy, takie jak Gemini CLI, mają wystarczająco dużo czasu na ukończenie
uruchamiania i inicjalizacji ACP. Nadpisz to, jeśli twój host potrzebuje innego
limitu runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Po zmianie tej wartości zrestartuj gateway.

### Konfiguracja agenta dla sondy kondycji

Wbudowany Plugin `acpx` sonduje jednego harness agent podczas ustalania, czy
backend osadzonego runtime jest gotowy. Domyślnie jest to `codex`. Jeśli twoje wdrożenie
używa innego domyślnego ACP agent, ustaw agent sondy na to samo id:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Po zmianie tej wartości zrestartuj gateway.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TTY do zatwierdzania lub odrzucania promptów uprawnień zapisu plików i wykonywania poleceń powłoki. Plugin acpx udostępnia dwa klucze konfiguracji sterujące obsługą uprawnień:

Te uprawnienia harnessu ACPX są oddzielone od zatwierdzeń exec OpenClaw i od flag obejścia dostawcy backendu CLI, takich jak Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` to przełącznik break-glass na poziomie harnessu dla sesji ACP.

### `permissionMode`

Kontroluje, które operacje harness agent może wykonywać bez promptu.

| Wartość         | Zachowanie                                                       |
| --------------- | ---------------------------------------------------------------- |
| `approve-all`   | Automatycznie zatwierdza wszystkie zapisy plików i polecenia powłoki. |
| `approve-reads` | Automatycznie zatwierdza tylko odczyty; zapisy i exec wymagają promptów. |
| `deny-all`      | Odrzuca wszystkie prompty uprawnień.                             |

### `nonInteractivePermissions`

Kontroluje, co dzieje się, gdy prompt uprawnienia zostałby pokazany, ale nie ma dostępnego interaktywnego TTY (co zawsze ma miejsce w przypadku sesji ACP).

| Wartość | Zachowanie                                                        |
| ------- | ----------------------------------------------------------------- |
| `fail`  | Przerywa sesję z `AcpRuntimeError`. **(domyślnie)**               |
| `deny`  | Po cichu odrzuca uprawnienie i kontynuuje (łagodna degradacja).   |

### Konfiguracja

Ustaw przez konfigurację Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Po zmianie tych wartości zrestartuj gateway.

> **Ważne:** OpenClaw obecnie domyślnie używa `permissionMode=approve-reads` i `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każdy zapis lub exec, który wywoła prompt uprawnienia, może zakończyć się błędem `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jeśli musisz ograniczyć uprawnienia, ustaw `nonInteractivePermissions` na `deny`, aby sesje degradowały się łagodnie zamiast kończyć awarią.

## Rozwiązywanie problemów

| Objaw                                                                       | Prawdopodobna przyczyna                                                          | Naprawa                                                                                                                                                            |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Brak Plugin backendu albo jest wyłączony.                                        | Zainstaluj i włącz Plugin backendu, a następnie uruchom `/acp doctor`.                                                                                            |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP jest globalnie wyłączone.                                                    | Ustaw `acp.enabled=true`.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch z normalnych wiadomości w wątku jest wyłączony.                         | Ustaw `acp.dispatch.enabled=true`.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent nie znajduje się na allowliście.                                           | Użyj dozwolonego `agentId` albo zaktualizuj `acp.allowedAgents`.                                                                                                   |
| `Unable to resolve session target: ...`                                     | Nieprawidłowy token key/id/label.                                                | Uruchom `/acp sessions`, skopiuj dokładny key/label i spróbuj ponownie.                                                                                           |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` użyto bez aktywnej rozmowy, którą można powiązać.                  | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj tworzenia sesji bez powiązania.                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter nie ma możliwości powiązania ACP z bieżącą rozmową.                      | Użyj `/acp spawn ... --thread ...` tam, gdzie to obsługiwane, skonfiguruj wpisy najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału.           |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` użyto poza kontekstem wątku.                                     | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                       |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Inny użytkownik jest właścicielem aktywnego celu powiązania.                     | Powiąż ponownie jako właściciel albo użyj innej rozmowy lub wątku.                                                                                                 |
| `Thread bindings are unavailable for <channel>.`                            | Adapter nie ma możliwości powiązania z wątkiem.                                  | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału.                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP działa po stronie hosta; sesja żądająca jest sandboxowana.           | Użyj `runtime="subagent"` z sandboxowanych sesji albo uruchom tworzenie ACP z sesji niesandboxowanej.                                                            |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Zażądano `sandbox="require"` dla runtime ACP.                                    | Użyj `runtime="subagent"` dla wymaganego sandboxingu albo użyj ACP z `sandbox="inherit"` z sesji niesandboxowanej.                                               |
| Missing ACP metadata for bound session                                      | Nieaktualne/usunięte metadane sesji ACP.                                         | Utwórz ją ponownie przez `/acp spawn`, a następnie ponownie powiąż/ustaw fokus na wątku.                                                                          |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokuje zapisy/exec w nieinteraktywnej sesji ACP.               | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i zrestartuj gateway. Zobacz [Konfiguracja uprawnień](#permission-configuration).            |
| Sesja ACP kończy się bardzo wcześnie z niewielką ilością danych wyjściowych | Prompty uprawnień są blokowane przez `permissionMode`/`nonInteractivePermissions`. | Sprawdź logi gateway pod kątem `AcpRuntimeError`. Dla pełnych uprawnień ustaw `permissionMode=approve-all`; dla łagodnej degradacji ustaw `nonInteractivePermissions=deny`. |
| Sesja ACP zawiesza się bez końca po zakończeniu pracy                       | Proces harnessu zakończył się, ale sesja ACP nie zgłosiła zakończenia.           | Monitoruj przez `ps aux \| grep acpx`; ręcznie zabij nieaktualne procesy.                                                                                          |
