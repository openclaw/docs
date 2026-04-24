---
read_when:
    - Uruchamianie harnessów do kodowania przez ACP
    - Konfigurowanie sesji ACP powiązanych z rozmową w kanałach wiadomości
    - Powiązanie rozmowy w kanale wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP i połączeniem Pluginów
    - Debugowanie dostarczania ukończeń ACP lub pętli agent-agent
    - Obsługa poleceń /acp z poziomu czatu
summary: Używaj sesji środowiska uruchomieniowego ACP dla Claude Code, Cursor, Gemini CLI, jawnego awaryjnego przełączania Codex ACP, OpenClaw ACP i innych agentów harness.
title: Agenci ACP
x-i18n:
    generated_at: "2026-04-24T09:34:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d59c5aa858e7888c9188ec9fc7dd5bcb9c8a5458f40d6458a5157ebc16332c2
    source_path: tools/acp-agents.md
    workflow: 15
---

Sesje [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) pozwalają OpenClaw uruchamiać zewnętrzne harnessy do kodowania (na przykład Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI i inne obsługiwane harnessy ACPX) przez backendowy Plugin ACP.

Jeśli poprosisz OpenClaw prostym językiem o powiązanie lub sterowanie Codex w bieżącej rozmowie, OpenClaw powinien użyć natywnego Pluginu serwera aplikacji Codex (`/codex bind`, `/codex threads`, `/codex resume`). Jeśli poprosisz o `/acp`, ACP, acpx lub podrzędną sesję tła Codex ACP, OpenClaw nadal może kierować Codex przez ACP. Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

Jeśli poprosisz OpenClaw prostym językiem o „uruchomienie Claude Code w wątku” lub użycie innego zewnętrznego harnessu, OpenClaw powinien skierować to żądanie do środowiska uruchomieniowego ACP (a nie do natywnego środowiska uruchomieniowego podagentów).

Jeśli chcesz, aby Codex lub Claude Code łączyły się jako zewnętrzny klient MCP bezpośrednio
z istniejącymi rozmowami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/pl/cli/mcp) zamiast ACP.

## Której strony potrzebuję?

Istnieją trzy pobliskie powierzchnie, które łatwo pomylić:

| Chcesz... | Użyj tego | Uwagi |
| --- | --- | --- |
| Powiązać lub sterować Codex w bieżącej rozmowie | `/codex bind`, `/codex threads` | Natywna ścieżka serwera aplikacji Codex; obejmuje powiązane odpowiedzi czatu, przekazywanie obrazów, model/fast/uprawnienia, zatrzymywanie i sterowanie. ACP jest jawną opcją awaryjną |
| Uruchomić Claude Code, Gemini CLI, jawny Codex ACP lub inny zewnętrzny harness _przez_ OpenClaw | Ta strona: Agenci ACP | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki środowiska uruchomieniowego |
| Udostępnić sesję OpenClaw Gateway _jako_ serwer ACP dla edytora lub klienta | [`openclaw acp`](/pl/cli/acp) | Tryb mostka. IDE/klient rozmawia z OpenClaw przez ACP przez stdio/WebSocket |
| Ponownie użyć lokalnego AI CLI jako tekstowego modelu awaryjnego | [Backendy CLI](/pl/gateway/cli-backends) | To nie jest ACP. Brak narzędzi OpenClaw, brak kontrolek ACP, brak środowiska uruchomieniowego harnessu |

## Czy to działa od razu po instalacji?

Zwykle tak. Świeże instalacje są dostarczane z włączonym domyślnie dołączonym Pluginem środowiska uruchomieniowego `acpx`, z przypiętym lokalnie do Pluginu plikiem binarnym `acpx`, który OpenClaw sprawdza i samonaprawia przy uruchomieniu. Uruchom `/acp doctor`, aby sprawdzić gotowość.

Pułapki przy pierwszym uruchomieniu:

- Adaptery docelowych harnessów (Codex, Claude itd.) mogą zostać pobrane na żądanie przez `npx` przy pierwszym użyciu.
- Uwierzytelnianie dostawcy nadal musi istnieć na hoście dla danego harnessu.
- Jeśli host nie ma npm ani dostępu do sieci, pobranie adapterów przy pierwszym uruchomieniu nie powiedzie się, dopóki cache nie zostanie wstępnie rozgrzany lub adapter nie zostanie zainstalowany w inny sposób.

## Instrukcja operatora

Szybki przepływ `/acp` z czatu:

1. **Uruchom** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` lub jawne `/acp spawn codex --bind here`
2. **Pracuj** w powiązanej rozmowie lub wątku (albo jawnie wskaż klucz sesji).
3. **Sprawdź stan** — `/acp status`
4. **Dostrój** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Steruj** bez zastępowania kontekstu — `/acp steer zaostrz logowanie i kontynuuj`
6. **Zatrzymaj** — `/acp cancel` (bieżąca tura) lub `/acp close` (sesja + powiązania)

Wyzwalacze w języku naturalnym, które powinny kierować do natywnego Pluginu Codex:

- „Powiąż ten kanał Discord z Codex.”
- „Podłącz ten czat do wątku Codex `<id>`.”
- „Pokaż wątki Codex, a potem powiąż ten.”

Natywne powiązanie rozmowy Codex to domyślna ścieżka sterowania czatem, ale jest ona celowo zachowawcza dla interaktywnych przepływów zatwierdzania/narzędzi Codex: dynamiczne narzędzia OpenClaw i monity o zatwierdzenie nie są jeszcze udostępniane przez tę ścieżkę powiązanego czatu, więc takie żądania są odrzucane z jasnym wyjaśnieniem. Użyj ścieżki harnessu Codex lub jawnej opcji awaryjnej ACP, gdy przepływ pracy zależy od dynamicznych narzędzi OpenClaw lub długotrwałych interaktywnych zatwierdzeń.

Wyzwalacze w języku naturalnym, które powinny kierować do środowiska uruchomieniowego ACP:

- „Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik.”
- „Użyj Gemini CLI do tego zadania w wątku, a potem zachowaj kolejne wiadomości w tym samym wątku.”
- „Uruchom Codex przez ACP w wątku w tle.”

OpenClaw wybiera `runtime: "acp"`, rozwiązuje `agentId` harnessu, wiąże z bieżącą rozmową lub wątkiem, jeśli jest to obsługiwane, i kieruje kolejne wiadomości do tej sesji aż do zamknięcia/wygaśnięcia. Codex podąża tą ścieżką tylko wtedy, gdy ACP jest jawnie wskazane lub żądane środowisko uruchomieniowe tła nadal wymaga ACP.

## ACP kontra podagenci

Używaj ACP, gdy chcesz zewnętrznego środowiska uruchomieniowego harnessu. Używaj natywnego serwera aplikacji Codex do powiązania/sterowania rozmową Codex. Używaj podagentów, gdy chcesz uruchomień delegowanych natywnie dla OpenClaw.

| Obszar | Sesja ACP | Uruchomienie podagenta |
| ------------- | ------------------------------------- | ---------------------------------- |
| Środowisko uruchomieniowe | Backendowy Plugin ACP (na przykład acpx) | Natywne środowisko uruchomieniowe podagentów OpenClaw |
| Klucz sesji | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| Główne polecenia | `/acp ...` | `/subagents ...` |
| Narzędzie uruchamiania | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślne środowisko uruchomieniowe) |

Zobacz także [Podagenci](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos jest następujący:

1. Płaszczyzna sterowania sesji OpenClaw ACP
2. dołączony Plugin środowiska uruchomieniowego `acpx`
3. adapter Claude ACP
4. mechanika środowiska uruchomieniowego/sesji po stronie Claude

Ważne rozróżnienie:

- ACP Claude to sesja harnessu z kontrolkami ACP, wznawianiem sesji, śledzeniem zadań w tle i opcjonalnym powiązaniem rozmowy/wątku.
- Backendy CLI to oddzielne tekstowe lokalne środowiska uruchomieniowe awaryjne. Zobacz [Backendy CLI](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada jest taka:

- chcesz `/acp spawn`, sesji możliwych do powiązania, kontrolek środowiska uruchomieniowego lub trwałej pracy harnessu: użyj ACP
- chcesz prostego lokalnego awaryjnego trybu tekstowego przez surowe CLI: użyj backendów CLI

## Powiązane sesje

### Powiązania z bieżącą rozmową

`/acp spawn <harness> --bind here` przypina bieżącą rozmowę do uruchomionej sesji ACP — bez podrzędnego wątku, na tej samej powierzchni czatu. OpenClaw nadal zarządza transportem, uwierzytelnianiem, bezpieczeństwem i dostarczaniem; kolejne wiadomości w tej rozmowie są kierowane do tej samej sesji; `/new` i `/reset` resetują sesję na miejscu; `/acp close` usuwa powiązanie.

Model mentalny:

- **powierzchnia czatu** — miejsce, w którym ludzie dalej rozmawiają (kanał Discord, temat Telegram, czat iMessage).
- **sesja ACP** — trwały stan środowiska uruchomieniowego Codex/Claude/Gemini, do którego kieruje OpenClaw.
- **podrzędny wątek/temat** — opcjonalna dodatkowa powierzchnia wiadomości tworzona tylko przez `--thread ...`.
- **workspace środowiska uruchomieniowego** — lokalizacja systemu plików (`cwd`, checkout repozytorium, workspace backendu), w której działa harness. Niezależna od powierzchni czatu.

Przykłady:

- `/codex bind` — zachowaj ten czat, uruchom lub podłącz natywny serwer aplikacji Codex, kieruj tu przyszłe wiadomości.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — dostrój powiązany natywny wątek Codex z czatu.
- `/codex stop` lub `/codex steer skup się najpierw na testach, które nie przechodzą` — steruj aktywną turą natywnego Codex.
- `/acp spawn codex --bind here` — jawna opcja awaryjna ACP dla Codex.
- `/acp spawn codex --thread auto` — OpenClaw może utworzyć podrzędny wątek/temat i tam powiązać sesję.
- `/acp spawn codex --bind here --cwd /workspace/repo` — to samo powiązanie czatu, Codex działa w `/workspace/repo`.

Uwagi:

- `--bind here` i `--thread ...` wzajemnie się wykluczają.
- `--bind here` działa tylko w kanałach, które deklarują powiązanie z bieżącą rozmową; w przeciwnym razie OpenClaw zwraca jasny komunikat o braku obsługi. Powiązania przetrwają restarty gateway.
- Na Discord `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć podrzędny wątek dla `--thread auto|here` — nie dla `--bind here`.
- Jeśli uruchamiasz do innego agenta ACP bez `--cwd`, OpenClaw domyślnie dziedziczy workspace **docelowego agenta**. Brak odziedziczonych ścieżek (`ENOENT`/`ENOTDIR`) powoduje przejście awaryjne do domyślnego ustawienia backendu; inne błędy dostępu (np. `EACCES`) są zgłaszane jako błędy uruchomienia.

### Sesje powiązane z wątkiem

Gdy dla adaptera kanału są włączone powiązania wątków, sesje ACP mogą być wiązane z wątkami:

- OpenClaw wiąże wątek z docelową sesją ACP.
- Kolejne wiadomości w tym wątku są kierowane do powiązanej sesji ACP.
- Wyjście ACP jest dostarczane z powrotem do tego samego wątku.
- Utrata fokusu/zamknięcie/archiwizacja/timeout bezczynności lub wygaśnięcie maksymalnego wieku usuwa powiązanie.

Obsługa powiązań wątków zależy od adaptera. Jeśli aktywny adapter kanału nie obsługuje powiązań wątków, OpenClaw zwraca jasny komunikat o braku obsługi/niedostępności.

Wymagane flagi funkcji dla ACP powiązanego z wątkiem:

- `acp.enabled=true`
- `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać dispatch ACP)
- Włączona flaga tworzenia wątków ACP dla adaptera kanału (zależna od adaptera)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Kanały obsługujące wątki

- Dowolny adapter kanału, który udostępnia możliwość powiązania sesji/wątku.
- Bieżąca wbudowana obsługa:
  - wątki/kanały Discord
  - tematy Telegrama (tematy forum w grupach/supergrupach oraz tematy wiadomości prywatnych)
- Kanały Pluginów mogą dodać obsługę przez ten sam interfejs powiązań.

## Ustawienia specyficzne dla kanału

Dla przepływów nieefemerycznych skonfiguruj trwałe powiązania ACP w wpisach najwyższego poziomu `bindings[]`.

### Model powiązań

- `bindings[].type="acp"` oznacza trwałe powiązanie rozmowy ACP.
- `bindings[].match` identyfikuje docelową rozmowę:
  - kanał lub wątek Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - temat forum Telegrama: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - czat prywatny/grupowy BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferuj `chat_id:*` lub `chat_identifier:*` dla stabilnych powiązań grupowych.
  - czat prywatny/grupowy iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferuj `chat_id:*` dla stabilnych powiązań grupowych.
- `bindings[].agentId` to identyfikator właściciela agenta OpenClaw.
- Opcjonalne nadpisania ACP znajdują się w `bindings[].acp`:
  - `mode` (`persistent` lub `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Domyślne ustawienia środowiska uruchomieniowego dla agenta

Użyj `agents.list[].runtime`, aby raz zdefiniować domyślne ustawienia ACP dla agenta:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator harnessu, na przykład `codex` lub `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Priorytet nadpisywania dla powiązanych sesji ACP:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. globalne domyślne ustawienia ACP (na przykład `acp.backend`)

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
- W powiązanych rozmowach `/new` i `/reset` resetują ten sam klucz sesji ACP na miejscu.
- Tymczasowe powiązania środowiska uruchomieniowego (na przykład utworzone przez przepływy fokusu wątku) nadal mają zastosowanie tam, gdzie występują.
- Dla uruchomień ACP między agentami bez jawnego `cwd` OpenClaw dziedziczy workspace docelowego agenta z konfiguracji agenta.
- Brakujące odziedziczone ścieżki workspace powodują przejście awaryjne do domyślnego `cwd` backendu; błędy dostępu dotyczące istniejących ścieżek są zgłaszane jako błędy uruchomienia.

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

- Domyślną wartością `runtime` jest `subagent`, więc dla sesji ACP ustaw jawnie `runtime: "acp"`.
- Jeśli `agentId` zostanie pominięte, OpenClaw używa `acp.defaultAgent`, jeśli jest skonfigurowane.
- `mode: "session"` wymaga `thread: true`, aby utrzymać trwałą powiązaną rozmowę.

Szczegóły interfejsu:

- `task` (wymagane): początkowy prompt wysyłany do sesji ACP.
- `runtime` (wymagane dla ACP): musi mieć wartość `"acp"`.
- `agentId` (opcjonalne): identyfikator docelowego harnessu ACP. Przechodzi awaryjnie do `acp.defaultAgent`, jeśli jest ustawione.
- `thread` (opcjonalne, domyślnie `false`): żądanie przepływu powiązania wątku tam, gdzie jest obsługiwane.
- `mode` (opcjonalne): `run` (jednorazowe) lub `session` (trwałe).
  - wartością domyślną jest `run`
  - jeśli `thread: true`, a `mode` pominięto, OpenClaw może domyślnie przyjąć zachowanie trwałe zależnie od ścieżki środowiska uruchomieniowego
  - `mode: "session"` wymaga `thread: true`
- `cwd` (opcjonalne): żądany katalog roboczy środowiska uruchomieniowego (walidowany przez politykę backendu/środowiska uruchomieniowego). Jeśli zostanie pominięty, uruchomienie ACP dziedziczy workspace docelowego agenta, jeśli jest skonfigurowane; brakujące odziedziczone ścieżki powodują przejście do wartości domyślnych backendu, natomiast rzeczywiste błędy dostępu są zwracane.
- `label` (opcjonalne): etykieta dla operatora używana w tekście sesji/banera.
- `resumeSessionId` (opcjonalne): wznawia istniejącą sesję ACP zamiast tworzyć nową. Agent odtwarza historię rozmowy przez `session/load`. Wymaga `runtime: "acp"`.
- `streamTo` (opcjonalne): `"parent"` strumieniuje podsumowania postępu początkowego uruchomienia ACP z powrotem do sesji żądającej jako zdarzenia systemowe.
  - Gdy jest dostępne, zaakceptowane odpowiedzi zawierają `streamLogPath` wskazujące na log JSONL w zakresie sesji (`<sessionId>.acp-stream.jsonl`), który możesz śledzić, aby zobaczyć pełną historię przekazywania.
- `model` (opcjonalne): jawne nadpisanie modelu dla podrzędnej sesji ACP. Respektowane dla `runtime: "acp"`, więc sesja podrzędna używa żądanego modelu zamiast po cichu przechodzić awaryjnie do domyślnego modelu docelowego agenta.

## Model dostarczania

Sesje ACP mogą być albo interaktywnymi workspace’ami, albo pracą w tle należącą do rodzica. Ścieżka dostarczania zależy od tego kształtu.

### Interaktywne sesje ACP

Sesje interaktywne służą do dalszej rozmowy na widocznej powierzchni czatu:

- `/acp spawn ... --bind here` wiąże bieżącą rozmowę z sesją ACP.
- `/acp spawn ... --thread ...` wiąże wątek/temat kanału z sesją ACP.
- Trwałe skonfigurowane `bindings[].type="acp"` kierują pasujące rozmowy do tej samej sesji ACP.

Kolejne wiadomości w powiązanej rozmowie są kierowane bezpośrednio do sesji ACP, a wyjście ACP jest dostarczane z powrotem do tego samego kanału/wątku/tematu.

### Jednorazowe sesje ACP należące do rodzica

Jednorazowe sesje ACP uruchomione przez innego agenta są podrzędnymi zadaniami w tle, podobnie jak podagenci:

- Rodzic zleca pracę przez `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Sesja podrzędna działa we własnej sesji harnessu ACP.
- Zakończenie jest raportowane z powrotem przez wewnętrzną ścieżkę ogłaszania ukończenia zadania.
- Rodzic przepisuje wynik podrzędny zwykłym głosem asystenta, gdy przydaje się odpowiedź skierowana do użytkownika.

Nie traktuj tej ścieżki jak czatu peer-to-peer między rodzicem a dzieckiem. Sesja podrzędna ma już kanał ukończenia z powrotem do rodzica.

### `sessions_send` i dostarczanie A2A

`sessions_send` może kierować wiadomość do innej sesji po jej uruchomieniu. Dla zwykłych sesji równorzędnych OpenClaw używa ścieżki dalszej komunikacji agent-agent (A2A) po wstrzyknięciu wiadomości:

- czeka na odpowiedź docelowej sesji
- opcjonalnie pozwala nadawcy i odbiorcy wymienić ograniczoną liczbę kolejnych tur
- prosi odbiorcę o wygenerowanie komunikatu announce
- dostarcza ten announce do widocznego kanału lub wątku

Ta ścieżka A2A jest opcją awaryjną dla wysyłek między sesjami równorzędnymi, gdy nadawca potrzebuje widocznej odpowiedzi następczej. Pozostaje włączona, gdy niepowiązana sesja może zobaczyć i wysłać wiadomość do celu ACP, na przykład przy szerokich ustawieniach `tools.sessions.visibility`.

OpenClaw pomija dalszą ścieżkę A2A tylko wtedy, gdy żądający jest rodzicem własnej jednorazowej podrzędnej sesji ACP należącej do rodzica. W takim przypadku uruchomienie A2A ponad mechanizmem ukończenia zadania może obudzić rodzica wynikiem dziecka, przesłać odpowiedź rodzica z powrotem do dziecka i utworzyć pętlę echa rodzic/dziecko. Wynik `sessions_send` raportuje `delivery.status="skipped"` dla tego przypadku należącego dziecka, ponieważ za wynik odpowiada już ścieżka ukończenia.

### Wznawianie istniejącej sesji

Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast zaczynać od nowa. Agent odtwarza historię rozmowy przez `session/load`, dzięki czemu wznawia pracę z pełnym kontekstem tego, co było wcześniej.

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
- Kontynuowanie sesji kodowania rozpoczętej interaktywnie w CLI, teraz bezobsługowo przez agenta
- Wznowienie pracy przerwanej przez restart gateway lub timeout bezczynności

Uwagi:

- `resumeSessionId` wymaga `runtime: "acp"` — zwraca błąd, jeśli zostanie użyte ze środowiskiem uruchomieniowym podagenta.
- `resumeSessionId` przywraca historię rozmowy upstream ACP; `thread` i `mode` nadal działają normalnie dla nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
- Docelowy agent musi obsługiwać `session/load` (Codex i Claude Code obsługują).
- Jeśli nie znaleziono identyfikatora sesji, uruchomienie kończy się jasnym błędem — bez cichego przejścia awaryjnego do nowej sesji.

<Accordion title="Test smoke po wdrożeniu">

Po wdrożeniu gateway uruchom prawdziwy test end-to-end zamiast ufać testom jednostkowym:

1. Zweryfikuj wdrożoną wersję gateway i commit na docelowym hoście.
2. Otwórz tymczasową sesję mostka ACPX do aktywnego agenta.
3. Poproś tego agenta, aby wywołał `sessions_spawn` z `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` oraz zadaniem `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Zweryfikuj `accepted=yes`, prawdziwe `childSessionKey` i brak błędu walidatora.
5. Posprzątaj tymczasową sesję mostka.

Utrzymuj bramkę na `mode: "run"` i pomiń `streamTo: "parent"` — ścieżki `mode: "session"` powiązane z wątkiem i przekazywanie strumienia to osobne, bogatsze przebiegi integracyjne.

</Accordion>

## Zgodność z sandboxem

Sesje ACP obecnie działają w środowisku uruchomieniowym hosta, a nie wewnątrz sandboxu OpenClaw.

Bieżące ograniczenia:

- Jeśli sesja żądająca jest sandboxowana, uruchamianie ACP jest blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
  - Błąd: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.
  - Błąd: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Użyj `runtime: "subagent"`, gdy potrzebujesz wykonywania wymuszanego przez sandbox.

### Z polecenia `/acp`

Używaj `/acp spawn`, gdy z czatu potrzebna jest jawna kontrola operatora.

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

Zobacz [Polecenia Slash](/pl/tools/slash-commands).

## Rozwiązywanie celu sesji

Większość akcji `/acp` akceptuje opcjonalny cel sesji (`session-key`, `session-id` lub `session-label`).

Kolejność rozwiązywania:

1. Jawny argument celu (lub `--session` dla `/acp steer`)
   - najpierw próba jako klucz
   - następnie jako identyfikator sesji w formacie UUID
   - potem jako etykieta
2. Bieżące powiązanie wątku (jeśli ta rozmowa/wątek jest powiązana z sesją ACP)
3. Awaryjne przejście do bieżącej sesji żądającej

Powiązania z bieżącą rozmową i powiązania wątków uczestniczą w kroku 2.

Jeśli nie uda się rozwiązać żadnego celu, OpenClaw zwraca jasny błąd (`Unable to resolve session target: ...`).

## Tryby powiązania przy uruchamianiu

`/acp spawn` obsługuje `--bind here|off`.

| Tryb | Zachowanie |
| ------ | ---------------------------------------------------------------------- |
| `here` | Powiąż bieżącą aktywną rozmowę na miejscu; błąd, jeśli żadna nie jest aktywna. |
| `off` | Nie twórz powiązania z bieżącą rozmową. |

Uwagi:

- `--bind here` to najprostsza ścieżka operatora dla „niech ten kanał lub czat będzie wspierany przez Codex”.
- `--bind here` nie tworzy podrzędnego wątku.
- `--bind here` jest dostępne tylko w kanałach, które udostępniają obsługę powiązania z bieżącą rozmową.
- `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

## Tryby wątku przy uruchamianiu

`/acp spawn` obsługuje `--thread auto|here|off`.

| Tryb | Zachowanie |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż podrzędny wątek, jeśli jest to obsługiwane. |
| `here` | Wymagaj bieżącego aktywnego wątku; błąd, jeśli nie jesteś w wątku. |
| `off` | Brak powiązania. Sesja uruchamia się niepowiązana. |

Uwagi:

- Na powierzchniach bez obsługi powiązań wątków zachowanie domyślne jest w praktyce równe `off`.
- Uruchamianie z powiązaniem wątku wymaga obsługi przez politykę kanału:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Użyj `--bind here`, jeśli chcesz przypiąć bieżącą rozmowę bez tworzenia podrzędnego wątku.

## Kontrolki ACP

| Polecenie | Co robi | Przykład |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn` | Tworzy sesję ACP; opcjonalnie bieżące powiązanie lub powiązanie wątku. | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | Anuluje trwającą turę dla docelowej sesji. | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | Wysyła instrukcję sterującą do uruchomionej sesji. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | Zamyka sesję i odpina cele wątków. | `/acp close` |
| `/acp status` | Pokazuje backend, tryb, stan, opcje środowiska uruchomieniowego i możliwości. | `/acp status` |
| `/acp set-mode` | Ustawia tryb środowiska uruchomieniowego dla docelowej sesji. | `/acp set-mode plan` |
| `/acp set` | Ogólny zapis opcji konfiguracji środowiska uruchomieniowego. | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | Ustawia nadpisanie katalogu roboczego środowiska uruchomieniowego. | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | Ustawia profil polityki zatwierdzania. | `/acp permissions strict` |
| `/acp timeout` | Ustawia limit czasu środowiska uruchomieniowego (sekundy). | `/acp timeout 120` |
| `/acp model` | Ustawia nadpisanie modelu środowiska uruchomieniowego. | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | Usuwa nadpisania opcji środowiska uruchomieniowego sesji. | `/acp reset-options` |
| `/acp sessions` | Wyświetla ostatnie sesje ACP ze store. | `/acp sessions` |
| `/acp doctor` | Stan backendu, możliwości, możliwe do wykonania poprawki. | `/acp doctor` |
| `/acp install` | Wyświetla deterministyczne kroki instalacji i włączania. | `/acp install` |

`/acp status` pokazuje efektywne opcje środowiska uruchomieniowego oraz identyfikatory sesji na poziomie środowiska uruchomieniowego i backendu. Błędy nieobsługiwanych kontrolek są jasno zgłaszane, gdy backend nie ma danej możliwości. `/acp sessions` odczytuje store dla bieżącej powiązanej sesji lub sesji żądającej; tokeny celu (`session-key`, `session-id` lub `session-label`) są rozwiązywane przez wykrywanie sesji gateway, w tym niestandardowe korzenie `session.store` dla poszczególnych agentów.

## Mapowanie opcji środowiska uruchomieniowego

`/acp` ma wygodne polecenia i ogólny setter.

Operacje równoważne:

- `/acp model <id>` mapuje się na klucz konfiguracji środowiska uruchomieniowego `model`.
- `/acp permissions <profile>` mapuje się na klucz konfiguracji środowiska uruchomieniowego `approval_policy`.
- `/acp timeout <seconds>` mapuje się na klucz konfiguracji środowiska uruchomieniowego `timeout`.
- `/acp cwd <path>` bezpośrednio aktualizuje nadpisanie `cwd` środowiska uruchomieniowego.
- `/acp set <key> <value>` to ścieżka ogólna.
  - Szczególny przypadek: `key=cwd` używa ścieżki nadpisania `cwd`.
- `/acp reset-options` czyści wszystkie nadpisania środowiska uruchomieniowego dla docelowej sesji.

## Harness acpx, konfiguracja Pluginu i uprawnienia

W przypadku konfiguracji harnessu acpx (aliasy Claude Code / Codex / Gemini CLI),
mostków MCP plugin-tools i OpenClaw-tools oraz trybów uprawnień ACP, zobacz
[Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup).

## Rozwiązywanie problemów

| Objaw | Prawdopodobna przyczyna | Poprawka |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured` | Brak backendowego Pluginu lub jest wyłączony. | Zainstaluj i włącz backendowy Plugin, a następnie uruchom `/acp doctor`. |
| `ACP is disabled by policy (acp.enabled=false)` | ACP jest globalnie wyłączone. | Ustaw `acp.enabled=true`. |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | Wyłączono dispatch ze zwykłych wiadomości w wątkach. | Ustaw `acp.dispatch.enabled=true`. |
| `ACP agent "<id>" is not allowed by policy` | Agenta nie ma na allowliście. | Użyj dozwolonego `agentId` lub zaktualizuj `acp.allowedAgents`. |
| `Unable to resolve session target: ...` | Nieprawidłowy token klucza/id/etykiety. | Uruchom `/acp sessions`, skopiuj dokładny klucz/etykietę i spróbuj ponownie. |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` użyto bez aktywnej rozmowy, którą można powiązać. | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj uruchomienia bez powiązania. |
| `Conversation bindings are unavailable for <channel>.` | Adapter nie ma możliwości powiązania ACP z bieżącą rozmową. | Użyj `/acp spawn ... --thread ...`, jeśli jest obsługiwane, skonfiguruj najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału. |
| `--thread here requires running /acp spawn inside an active ... thread` | `--thread here` użyto poza kontekstem wątku. | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`. |
| `Only <user-id> can rebind this channel/conversation/thread.` | Inny użytkownik jest właścicielem aktywnego celu powiązania. | Powiąż ponownie jako właściciel albo użyj innej rozmowy lub wątku. |
| `Thread bindings are unavailable for <channel>.` | Adapter nie ma możliwości powiązania wątków. | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału. |
| `Sandboxed sessions cannot spawn ACP sessions ...` | Środowisko uruchomieniowe ACP działa po stronie hosta; sesja żądająca jest sandboxowana. | Użyj `runtime="subagent"` z sesji sandboxowanych albo uruchom ACP z sesji niesandboxowanej. |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | Zażądano `sandbox="require"` dla środowiska uruchomieniowego ACP. | Użyj `runtime="subagent"` dla wymaganego sandboxowania albo użyj ACP z `sandbox="inherit"` z sesji niesandboxowanej. |
| Brak metadanych ACP dla powiązanej sesji | Nieaktualne/usunięte metadane sesji ACP. | Utwórz ją ponownie przez `/acp spawn`, a następnie ponownie powiąż/skup wątek. |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` blokuje zapis/exec w nieinteraktywnej sesji ACP. | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i zrestartuj gateway. Zobacz [Konfiguracja uprawnień](/pl/tools/acp-agents-setup#permission-configuration). |
| Sesja ACP kończy się bardzo wcześnie z niewielką ilością wyjścia | Monity o uprawnienia są blokowane przez `permissionMode`/`nonInteractivePermissions`. | Sprawdź logi gateway pod kątem `AcpRuntimeError`. Aby uzyskać pełne uprawnienia, ustaw `permissionMode=approve-all`; dla łagodnej degradacji ustaw `nonInteractivePermissions=deny`. |
| Sesja ACP zawiesza się bez końca po zakończeniu pracy | Proces harnessu zakończył się, ale sesja ACP nie zgłosiła ukończenia. | Monitoruj przez `ps aux \| grep acpx`; ręcznie zakończ przestarzałe procesy. |

## Powiązane

- [Podagenci](/pl/tools/subagents)
- [Narzędzia sandboxu wieloagentowego](/pl/tools/multi-agent-sandbox-tools)
- [Wysyłanie do agenta](/pl/tools/agent-send)
