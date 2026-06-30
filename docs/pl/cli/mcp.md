---
read_when:
    - Łączenie Codex, Claude Code lub innego klienta MCP z kanałami obsługiwanymi przez OpenClaw
    - Uruchamianie `openclaw mcp serve`
    - Zarządzanie definicjami serwerów MCP zapisanymi przez OpenClaw
sidebarTitle: MCP
summary: Udostępniaj konwersacje w kanałach OpenClaw przez MCP i zarządzaj zapisanymi definicjami serwerów MCP
title: MCP
x-i18n:
    generated_at: "2026-06-30T22:38:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e979654cb17f5cb25b936039f9e4690ecfda41bc58ae073426a9e42978fa85dc
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` ma dwa zadania:

- uruchamiać OpenClaw jako serwer MCP za pomocą `openclaw mcp serve`
- zarządzać definicjami wychodzących serwerów MCP zarządzanych przez OpenClaw za pomocą `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` i `unset`

Innymi słowy:

- `serve` to OpenClaw działający jako serwer MCP
- pozostałe podpolecenia to OpenClaw działający jako rejestr po stronie klienta MCP dla serwerów MCP, z których jego środowiska uruchomieniowe mogą korzystać później

<Note>
  `list`, `show`, `set` i `unset` tylko odczytują i zapisują wpisy `mcp.servers` zarządzane przez OpenClaw w konfiguracji OpenClaw. Nie obejmują serwerów mcporter z `config/mcporter.json`; dla tego rejestru użyj `mcporter list`.
</Note>

Użyj [`openclaw acp`](/pl/cli/acp), gdy OpenClaw ma sam hostować sesję środowiska kodowania i kierować to środowisko uruchomieniowe przez ACP.

## Wybierz właściwą ścieżkę MCP

OpenClaw ma kilka powierzchni MCP. Wybierz tę, która pasuje do właściciela środowiska uruchomieniowego agenta i właściciela narzędzi.

| Cel                                                                 | Użyj                                                                 | Dlaczego                                                                                                       |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Pozwolić zewnętrznemu klientowi MCP odczytywać/wysyłać konwersacje kanałów OpenClaw | `openclaw mcp serve`                                                 | OpenClaw jest serwerem MCP i udostępnia konwersacje oparte na Gateway przez stdio.                              |
| Zapisać zewnętrzne serwery MCP dla uruchomień agentów zarządzanych przez OpenClaw | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw jest rejestrem po stronie klienta MCP i później rzutuje te serwery do kwalifikujących się środowisk uruchomieniowych. |
| Sprawdzić zapisany serwer bez uruchamiania tury agenta              | `openclaw mcp status`, `doctor`, `probe`                             | `status` i `doctor` sprawdzają konfigurację; `probe` otwiera aktywne połączenie MCP i wypisuje możliwości.     |
| Edytować konfigurację MCP z przeglądarki                            | Control UI `/mcp`                                                    | Strona pokazuje inwentarz, włączenie, podsumowania OAuth/filtrów, podpowiedzi poleceń i zakresowy edytor `mcp`. |
| Nadać serwerowi aplikacji Codex zakresowy natywny serwer MCP        | `mcp.servers.<name>.codex`                                           | Blok `codex` wpływa tylko na rzutowanie wątków serwera aplikacji Codex i jest usuwany przed przekazaniem natywnej konfiguracji. |
| Uruchamiać sesje środowiska hostowane przez ACP                     | [`openclaw acp`](/pl/cli/acp) i [Agenci ACP](/pl/tools/acp-agents-setup)  | Tryb mostu ACP nie akceptuje wstrzykiwania serwerów MCP dla poszczególnych sesji; skonfiguruj zamiast tego mosty gateway/plugin. |

<Tip>
Jeśli nie masz pewności, której ścieżki potrzebujesz, zacznij od `openclaw mcp status --verbose`. Pokazuje, co OpenClaw zapisał, bez uruchamiania żadnych serwerów MCP.
</Tip>

## OpenClaw jako serwer MCP

To jest ścieżka `openclaw mcp serve`.

### Kiedy używać `serve`

Użyj `openclaw mcp serve`, gdy:

- Codex, Claude Code lub inny klient MCP ma komunikować się bezpośrednio z konwersacjami kanałów opartymi na OpenClaw
- masz już lokalny lub zdalny OpenClaw Gateway z routowanymi sesjami
- chcesz jednego serwera MCP działającego z backendami kanałów OpenClaw zamiast uruchamiania osobnych mostów dla każdego kanału

Użyj zamiast tego [`openclaw acp`](/pl/cli/acp), gdy OpenClaw ma hostować samo środowisko uruchomieniowe kodowania i utrzymywać sesję agenta wewnątrz OpenClaw.

### Jak to działa

`openclaw mcp serve` uruchamia serwer MCP stdio. Klient MCP jest właścicielem tego procesu. Dopóki klient utrzymuje otwartą sesję stdio, most łączy się z lokalnym lub zdalnym OpenClaw Gateway przez WebSocket i udostępnia routowane konwersacje kanałów przez MCP.

<Steps>
  <Step title="Client spawns the bridge">
    Klient MCP uruchamia `openclaw mcp serve`.
  </Step>
  <Step title="Bridge connects to Gateway">
    Most łączy się z OpenClaw Gateway przez WebSocket.
  </Step>
  <Step title="Sessions become MCP conversations">
    Routowane sesje stają się konwersacjami MCP oraz narzędziami transkrypcji/historii.
  </Step>
  <Step title="Live events queue">
    Zdarzenia na żywo są kolejkowane w pamięci, gdy most jest połączony.
  </Step>
  <Step title="Optional Claude push">
    Jeśli tryb kanału Claude jest włączony, ta sama sesja może też otrzymywać powiadomienia push specyficzne dla Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - stan kolejki na żywo zaczyna się, gdy most się łączy
    - starsza historia transkrypcji jest odczytywana za pomocą `messages_read`
    - powiadomienia push Claude istnieją tylko wtedy, gdy sesja MCP jest aktywna
    - gdy klient się rozłącza, most kończy działanie, a kolejka na żywo znika
    - jednorazowe punkty wejścia agenta, takie jak `openclaw agent` i `openclaw infer model run`, zamykają wszystkie dołączone środowiska uruchomieniowe MCP, które otwierają po zakończeniu odpowiedzi, więc powtarzane uruchomienia skryptowe nie gromadzą procesów potomnych MCP stdio
    - serwery MCP stdio uruchamiane przez OpenClaw (dołączone lub skonfigurowane przez użytkownika) są zamykane jako drzewo procesów podczas wyłączania, więc podprocesy potomne uruchomione przez serwer nie pozostają po zakończeniu nadrzędnego klienta stdio
    - usunięcie lub zresetowanie sesji usuwa klientów MCP tej sesji przez współdzieloną ścieżkę czyszczenia środowiska uruchomieniowego, więc nie pozostają wiszące połączenia stdio powiązane z usuniętą sesją

  </Accordion>
</AccordionGroup>

### Wybierz tryb klienta

Użyj tego samego mostu na dwa różne sposoby:

<Tabs>
  <Tab title="Generic MCP clients">
    Tylko standardowe narzędzia MCP. Użyj `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` i narzędzi zatwierdzania.
  </Tab>
  <Tab title="Claude Code">
    Standardowe narzędzia MCP oraz adapter kanału specyficzny dla Claude. Włącz `--claude-channel-mode on` albo pozostaw domyślne `auto`.
  </Tab>
</Tabs>

<Note>
Obecnie `auto` zachowuje się tak samo jak `on`. Nie ma jeszcze wykrywania możliwości klienta.
</Note>

### Co udostępnia `serve`

Most używa istniejących metadanych tras sesji Gateway, aby udostępniać konwersacje oparte na kanałach. Konwersacja pojawia się, gdy OpenClaw ma już stan sesji ze znaną trasą, taką jak:

- `channel`
- metadane odbiorcy lub miejsca docelowego
- opcjonalne `accountId`
- opcjonalne `threadId`

Daje to klientom MCP jedno miejsce do:

- wyświetlania ostatnich routowanych konwersacji
- odczytywania najnowszej historii transkrypcji
- oczekiwania na nowe zdarzenia przychodzące
- wysyłania odpowiedzi z powrotem przez tę samą trasę
- oglądania żądań zatwierdzenia, które przychodzą, gdy most jest połączony

### Użycie

<Tabs>
  <Tab title="Local Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Remote Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Remote Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude off">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Narzędzia mostu

Obecny most udostępnia te narzędzia MCP:

<AccordionGroup>
  <Accordion title="conversations_list">
    Wypisuje ostatnie konwersacje oparte na sesjach, które mają już metadane tras w stanie sesji Gateway.

    Przydatne filtry:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Zwraca jedną konwersację według `session_key`, używając bezpośredniego wyszukiwania sesji Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Odczytuje najnowsze wiadomości transkrypcji dla jednej konwersacji opartej na sesji.
  </Accordion>
  <Accordion title="attachments_fetch">
    Wyodrębnia nietekstowe bloki treści wiadomości z jednej wiadomości transkrypcji. To widok metadanych treści transkrypcji, a nie samodzielny trwały magazyn obiektów załączników.
  </Accordion>
  <Accordion title="events_poll">
    Odczytuje zakolejkowane zdarzenia na żywo od kursora numerycznego.
  </Accordion>
  <Accordion title="events_wait">
    Wykonuje długie odpytywanie do momentu nadejścia następnego pasującego zakolejkowanego zdarzenia albo upływu limitu czasu.

    Użyj tego, gdy ogólny klient MCP potrzebuje dostarczania zbliżonego do czasu rzeczywistego bez protokołu push specyficznego dla Claude.

  </Accordion>
  <Accordion title="messages_send">
    Wysyła tekst z powrotem przez tę samą trasę, która jest już zapisana w sesji.

    Obecne zachowanie:

    - wymaga istniejącej trasy konwersacji
    - używa kanału sesji, odbiorcy, identyfikatora konta i identyfikatora wątku
    - wysyła tylko tekst

  </Accordion>
  <Accordion title="permissions_list_open">
    Wypisuje oczekujące żądania zatwierdzenia exec/plugin, które most zaobserwował od czasu połączenia z Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Rozstrzyga jedno oczekujące żądanie zatwierdzenia exec/plugin za pomocą:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Model zdarzeń

Most utrzymuje kolejkę zdarzeń w pamięci, gdy jest połączony.

Obecne typy zdarzeń:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- kolejka działa tylko na żywo; zaczyna się, gdy most MCP startuje
- `events_poll` i `events_wait` same nie odtwarzają starszej historii Gateway
- trwały zaległy bufor należy odczytywać za pomocą `messages_read`

</Warning>

### Powiadomienia kanału Claude

Most może też udostępniać powiadomienia kanału specyficzne dla Claude. To odpowiednik adaptera kanału Claude Code w OpenClaw: standardowe narzędzia MCP pozostają dostępne, ale przychodzące wiadomości na żywo mogą też docierać jako powiadomienia MCP specyficzne dla Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: tylko standardowe narzędzia MCP.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: włącza powiadomienia kanału Claude.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: obecna wartość domyślna; takie samo zachowanie mostu jak `on`.
  </Tab>
</Tabs>

Gdy tryb kanału Claude jest włączony, serwer ogłasza eksperymentalne możliwości Claude i może emitować:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Obecne zachowanie mostu:

- przychodzące wiadomości transkrypcji `user` są przekazywane jako `notifications/claude/channel`
- żądania uprawnień Claude otrzymane przez MCP są śledzone w pamięci
- jeśli właściciel polecenia w połączonej konwersacji wyśle później `yes abcde` lub `no abcde`, most konwertuje to na `notifications/claude/channel/permission`
- te powiadomienia działają tylko w sesji na żywo; jeśli klient MCP się rozłączy, nie ma celu push

To celowo jest specyficzne dla klienta. Ogólni klienci MCP powinni polegać na standardowych narzędziach odpytywania.

### Konfiguracja klienta MCP

Przykładowa konfiguracja klienta stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

W przypadku większości ogólnych klientów MCP zacznij od standardowej powierzchni narzędzi i ignoruj tryb Claude. Włącz tryb Claude tylko dla klientów, które faktycznie rozumieją metody powiadomień specyficzne dla Claude.

### Opcje

`openclaw mcp serve` obsługuje:

<ParamField path="--url" type="string">
  Adres URL WebSocket Gateway.
</ParamField>
<ParamField path="--token" type="string">
  Token Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Odczytaj token z pliku.
</ParamField>
<ParamField path="--password" type="string">
  Hasło Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Odczytaj hasło z pliku.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Tryb powiadomień Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Szczegółowe logi w stderr.
</ParamField>

<Tip>
Gdy to możliwe, preferuj `--token-file` lub `--password-file` zamiast sekretów podawanych bezpośrednio.
</Tip>

### Bezpieczeństwo i granica zaufania

Mostek nie wymyśla routingu. Udostępnia tylko rozmowy, które Gateway już potrafi routować.

Oznacza to, że:

- listy dozwolonych nadawców, parowanie i zaufanie na poziomie kanału nadal należą do bazowej konfiguracji kanału OpenClaw
- `messages_send` może odpowiadać tylko przez istniejącą zapisaną trasę
- stan zatwierdzeń jest żywy i przechowywany wyłącznie w pamięci dla bieżącej sesji mostka
- uwierzytelnianie mostka powinno używać tych samych mechanizmów tokenu lub hasła Gateway, którym zaufałbyś dla dowolnego innego zdalnego klienta Gateway

Jeśli rozmowy brakuje w `conversations_list`, zwykle przyczyną nie jest konfiguracja MCP. To brakujące lub niekompletne metadane trasy w bazowej sesji Gateway.

### Testowanie

OpenClaw dostarcza deterministyczny smoke test Docker dla tego mostka:

```bash
pnpm test:docker:mcp-channels
```

Ten smoke test:

- uruchamia kontener Gateway z danymi początkowymi
- uruchamia drugi kontener, który wywołuje `openclaw mcp serve`
- weryfikuje wykrywanie rozmów, odczyty transkrypcji, odczyty metadanych załączników, działanie kolejki zdarzeń na żywo i routing wysyłania wychodzącego
- waliduje powiadomienia kanałów i uprawnień w stylu Claude przez rzeczywisty mostek MCP stdio

To najszybszy sposób, aby potwierdzić, że mostek działa bez podłączania prawdziwego konta Telegram, Discord lub iMessage do uruchomienia testu.

Szerszy kontekst testowania znajdziesz w [Testowanie](/pl/help/testing).

### Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Nie zwrócono żadnych rozmów">
    Zwykle oznacza, że sesja Gateway nie jest jeszcze routowalna. Potwierdź, że bazowa sesja ma zapisane metadane kanału/dostawcy, odbiorcy oraz opcjonalnej trasy konta/wątku.
  </Accordion>
  <Accordion title="events_poll lub events_wait pomija starsze wiadomości">
    To oczekiwane. Kolejka na żywo startuje, gdy mostek się połączy. Starszą historię transkrypcji odczytaj za pomocą `messages_read`.
  </Accordion>
  <Accordion title="Powiadomienia Claude się nie pojawiają">
    Sprawdź wszystkie te rzeczy:

    - klient utrzymał otwartą sesję MCP stdio
    - `--claude-channel-mode` ma wartość `on` lub `auto`
    - klient rzeczywiście rozumie metody powiadomień specyficzne dla Claude
    - wiadomość przychodząca wystąpiła po połączeniu mostka

  </Accordion>
  <Accordion title="Brakuje zatwierdzeń">
    `permissions_list_open` pokazuje tylko żądania zatwierdzenia zaobserwowane, gdy mostek był połączony. To nie jest trwałe API historii zatwierdzeń.
  </Accordion>
</AccordionGroup>

## OpenClaw jako rejestr klienta MCP

To ścieżka `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` i `unset`.

Te polecenia nie udostępniają OpenClaw przez MCP. Zarządzają definicjami serwerów MCP zarządzanymi przez OpenClaw w `mcp.servers` w konfiguracji OpenClaw. Nie odczytują serwerów mcporter z `config/mcporter.json`.

Te zapisane definicje są przeznaczone dla środowisk uruchomieniowych, które OpenClaw uruchamia lub konfiguruje później, takich jak osadzony OpenClaw i inne adaptery środowiska uruchomieniowego. OpenClaw przechowuje definicje centralnie, aby te środowiska nie musiały utrzymywać własnych zduplikowanych list serwerów MCP.

<AccordionGroup>
  <Accordion title="Ważne zachowanie">
    - te polecenia tylko odczytują lub zapisują konfigurację OpenClaw
    - `status`, `list`, `show`, `doctor` bez `--probe`, `set`, `configure`, `tools`, `logout`, `reload` i `unset` nie łączą się z docelowym serwerem MCP
    - `login` wykonuje przepływ sieciowy MCP OAuth dla skonfigurowanego serwera HTTP i zapisuje wynikowe lokalne dane logowania
    - `status --verbose` wypisuje rozstrzygnięty transport, uwierzytelnianie, limit czasu, filtr i wskazówki dotyczące równoległych wywołań narzędzi bez łączenia się
    - `doctor` sprawdza zapisane definicje pod kątem problemów z lokalną konfiguracją, takich jak brakujące polecenia stdio, nieprawidłowe katalogi robocze, brakujące pliki TLS, wyłączone serwery, literalne poufne wartości nagłówków/env oraz niepełna autoryzacja OAuth
    - `doctor --probe` dodaje ten sam dowód połączenia na żywo co `probe` po przejściu kontroli statycznych
    - `probe` łączy się z wybranym serwerem lub wszystkimi skonfigurowanymi serwerami, wyświetla narzędzia oraz raportuje możliwości/diagnostykę
    - `add` buduje definicję z flag i sonduje ją przed zapisaniem, chyba że ustawiono `--no-probe` albo najpierw potrzebna jest autoryzacja OAuth
    - adaptery środowiska uruchomieniowego decydują w czasie wykonania, które kształty transportu faktycznie obsługują
    - `enabled: false` zachowuje serwer w zapisie, ale wyklucza go z wykrywania przez osadzone środowisko uruchomieniowe
    - `timeout` i `connectTimeout` ustawiają limity czasu żądania i połączenia dla serwera w sekundach
    - `supportsParallelToolCalls: true` oznacza serwery, które adaptery mogą wywoływać współbieżnie
    - serwery HTTP mogą używać statycznych nagłówków, logowania OAuth, kontroli weryfikacji TLS oraz ścieżek certyfikatu/klucza mTLS
    - osadzony OpenClaw udostępnia skonfigurowane narzędzia MCP w normalnych profilach narzędzi `coding` i `messaging`; `minimal` nadal je ukrywa, a `tools.deny: ["bundle-mcp"]` wyłącza je jawnie
    - `toolFilter.include` i `toolFilter.exclude` dla serwera filtrują wykryte narzędzia MCP, zanim staną się narzędziami OpenClaw
    - serwery, które reklamują zasoby lub prompty, udostępniają też narzędzia pomocnicze do listowania/odczytu zasobów oraz listowania/pobierania promptów; te wygenerowane nazwy narzędzi pomocniczych (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) używają tego samego filtra include/exclude
    - dynamiczne zmiany listy narzędzi MCP unieważniają buforowany katalog dla tej sesji; następne wykrycie/użycie odświeża dane z serwera
    - powtarzające się niepowodzenia żądań/protokołu narzędzi MCP na krótko wstrzymują ten serwer, aby jeden uszkodzony serwer nie zużył całej tury
    - zakresowane do sesji pakietowane środowiska uruchomieniowe MCP są sprzątane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10 minut; ustaw `0`, aby wyłączyć), a jednorazowe uruchomienia osadzone sprzątają je na końcu uruchomienia

  </Accordion>
</AccordionGroup>

Adaptery środowiska uruchomieniowego mogą normalizować ten współdzielony rejestr do kształtu oczekiwanego przez ich klienta podrzędnego. Na przykład osadzony OpenClaw zużywa wartości `transport` OpenClaw bezpośrednio, podczas gdy Claude Code i Gemini otrzymują natywne dla CLI wartości `type`, takie jak `http`, `sse` lub `stdio`.

Codex app-server honoruje także opcjonalny blok `codex` na każdym serwerze. To są metadane projekcji OpenClaw wyłącznie dla wątków Codex app-server; nie zmieniają sesji ACP, ogólnej konfiguracji uprzęży Codex ani innych adapterów środowiska uruchomieniowego. Użyj niepustego `codex.agents`, aby rzutować serwer tylko do określonych identyfikatorów agentów OpenClaw. Puste, blank lub nieprawidłowe listy agentów są odrzucane przez walidację konfiguracji i pomijane przez ścieżkę projekcji środowiska uruchomieniowego, zamiast stawać się globalne. Użyj `codex.defaultToolsApprovalMode` (`auto`, `prompt` lub `approve`), aby wyemitować natywne `default_tools_approval_mode` Codex dla zaufanego serwera. OpenClaw usuwa metadane `codex` przed przekazaniem natywnej konfiguracji `mcp_servers` do Codex.

### Zapisane definicje serwerów MCP

OpenClaw przechowuje też w konfiguracji lekki rejestr serwerów MCP dla powierzchni, które chcą definicji MCP zarządzanych przez OpenClaw.

Polecenia:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

Uwagi:

- `list` sortuje nazwy serwerów.
- `show` bez nazwy wypisuje pełny skonfigurowany obiekt serwera MCP.
- `status` klasyfikuje skonfigurowane transporty bez łączenia się. `--verbose` zawiera rozstrzygnięte szczegóły uruchomienia, limitów czasu, OAuth, filtra i wywołań równoległych.
- `doctor` wykonuje kontrole statyczne bez łączenia się. Dodaj `--probe`, gdy polecenie powinno też zweryfikować, że włączone serwery się łączą.
- `probe` łączy się i raportuje liczby narzędzi, obsługę zasobów/promptów, obsługę zmian listy oraz diagnostykę.
- `add` akceptuje flagi stdio, takie jak `--command`, `--arg`, `--env` i `--cwd`, albo flagi HTTP, takie jak `--url`, `--transport`, `--header`, `--auth oauth`, TLS, limit czasu i flagi wyboru narzędzi.
- `set` oczekuje jednej wartości obiektu JSON w wierszu poleceń.
- `configure` aktualizuje włączenie, filtry narzędzi, limity czasu, OAuth, TLS i wskazówki równoległych wywołań narzędzi bez zastępowania całej definicji serwera.
- `tools` aktualizuje filtry narzędzi dla serwera. Wpisy include/exclude to nazwy narzędzi MCP i proste globy `*`.
- `login` uruchamia przepływ OAuth dla serwerów HTTP skonfigurowanych z `auth: "oauth"`. Pierwsze uruchomienie wypisuje adres URL autoryzacji; uruchom ponownie z `--code` po zatwierdzeniu.
- `logout` czyści zapisane dane logowania OAuth dla wskazanego serwera bez usuwania zapisanej definicji serwera.
- `reload` usuwa zbuforowane wewnątrzprocesowe środowiska uruchomieniowe MCP. Procesy Gateway lub agenta w innym procesie nadal potrzebują własnej ścieżki przeładowania lub restartu.
- Użyj `transport: "streamable-http"` dla serwerów Streamable HTTP MCP. `openclaw mcp set` normalizuje też natywne dla CLI `type: "http"` do tego samego kanonicznego kształtu konfiguracji dla zgodności.
- `unset` kończy się niepowodzeniem, jeśli wskazany serwer nie istnieje.

Przykłady:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### Typowe przepisy serwerów

Te przykłady zapisują tylko definicje serwerów. Następnie uruchom `openclaw mcp doctor --probe`, aby potwierdzić, że serwer startuje i udostępnia narzędzia.

<Tabs>
  <Tab title="System plików">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Ogranicz serwery systemu plików do najmniejszego drzewa katalogów, które agent powinien odczytywać lub edytować.

  </Tab>
  <Tab title="Pamięć">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Użyj filtra narzędzi, jeśli serwer udostępnia narzędzia zapisu, które nie powinny być dostępne dla normalnych agentów.

  </Tab>
  <Tab title="Skrypt lokalny">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` sprawdza, czy `cwd` istnieje i czy polecenie rozwiązuje się ze skonfigurowanego środowiska.

  </Tab>
  <Tab title="Remote HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    Użyj OAuth, gdy serwer zdalny go obsługuje. Jeśli serwer wymaga statycznych nagłówków, unikaj commitowania dosłownych tokenów bearer.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Bezpośrednie serwery sterowania pulpitem dziedziczą uprawnienia procesu, który je uruchamia. Używaj wąskich filtrów narzędzi i monitów uprawnień na poziomie systemu operacyjnego.

  </Tab>
</Tabs>

### Kształty wyjścia JSON

Używaj `--json` dla skryptów i pulpitów. Zestawy pól mogą z czasem rosnąć, więc konsumenci powinni ignorować nieznane klucze.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` kończy się kodem niezerowym, gdy dowolny włączony sprawdzany serwer ma błąd. Ostrzeżenia są zgłaszane, ale same w sobie nie powodują niepowodzenia polecenia.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe` otwiera aktywną sesję klienta MCP. Używaj go do potwierdzania osiągalności i możliwości, a nie do statycznych audytów konfiguracji.

  </Accordion>
</AccordionGroup>

Przykładowy kształt konfiguracji:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Transport stdio

Uruchamia lokalny proces potomny i komunikuje się przez stdin/stdout.

| Pole                       | Opis                                      |
| -------------------------- | ---------------------------------------- |
| `command`                  | Plik wykonywalny do uruchomienia (wymagane) |
| `args`                     | Tablica argumentów wiersza poleceń       |
| `env`                      | Dodatkowe zmienne środowiskowe           |
| `cwd` / `workingDirectory` | Katalog roboczy procesu                  |

<Warning>
**Filtr bezpieczeństwa stdio env**

OpenClaw odrzuca klucze env uruchamiania interpretera, które mogą zmienić sposób startu serwera MCP stdio przed pierwszym RPC, nawet jeśli pojawiają się w bloku `env` serwera. Zablokowane klucze obejmują `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` oraz podobne zmienne sterujące środowiskiem uruchomieniowym. Uruchomienie odrzuca je z błędem konfiguracji, aby nie mogły wstrzyknąć niejawnego preludium, podmienić interpretera, włączyć debugera ani przekierować wyjścia środowiska uruchomieniowego względem procesu stdio. Zwykłe zmienne env dla poświadczeń, proxy i konkretnych serwerów (`GITHUB_TOKEN`, `HTTP_PROXY`, niestandardowe `*_API_KEY` itd.) pozostają bez zmian.

Jeśli Twój serwer MCP rzeczywiście potrzebuje jednej z zablokowanych zmiennych, ustaw ją w procesie hosta Gateway zamiast w `env` serwera stdio.
</Warning>

### Transport SSE / HTTP

Łączy się ze zdalnym serwerem MCP przez HTTP Server-Sent Events.

| Pole                           | Opis                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| `url`                          | URL HTTP lub HTTPS zdalnego serwera (wymagane)                  |
| `headers`                      | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokenów auth) |
| `connectionTimeoutMs`          | Limit czasu połączenia dla serwera w ms (opcjonalne)            |
| `connectTimeout`               | Limit czasu połączenia dla serwera w sekundach (opcjonalne)     |
| `timeout` / `requestTimeoutMs` | Limit czasu żądania MCP dla serwera w sekundach lub ms          |
| `auth: "oauth"`                | Użyj magazynu tokenów OAuth MCP i `openclaw mcp login`          |
| `sslVerify`                    | Ustaw false tylko dla jawnie zaufanych prywatnych punktów końcowych HTTPS |
| `clientCert` / `clientKey`     | Ścieżki certyfikatu klienta mTLS i klucza                       |
| `supportsParallelToolCalls`    | Wskazówka, że współbieżne wywołania są bezpieczne dla tego serwera |

Przykład:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Wartości wrażliwe w `url` (userinfo) i `headers` są redagowane w logach i wyjściu statusu. `openclaw mcp doctor` ostrzega, gdy wyglądające na wrażliwe wpisy `headers` lub `env` zawierają dosłowne wartości, aby operatorzy mogli przenieść te wartości poza commitowaną konfigurację.

### Przepływ pracy OAuth

OAuth jest przeznaczony dla serwerów MCP HTTP, które ogłaszają przepływ OAuth MCP. Statyczne nagłówki `Authorization` są ignorowane dla serwera, gdy włączone jest `auth: "oauth"`.

<Steps>
  <Step title="Save the server">
    Dodaj lub zaktualizuj serwer z `auth: "oauth"` oraz opcjonalnymi metadanymi OAuth.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    Uruchom logowanie, aby utworzyć żądanie autoryzacji.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw wypisuje URL autoryzacji i zapisuje tymczasowy stan weryfikatora OAuth w katalogu stanu OpenClaw.

  </Step>
  <Step title="Finish with the code">
    Po zatwierdzeniu w przeglądarce przekaż zwrócony kod z powrotem do OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    Użyj statusu lub doctor, aby potwierdzić obecność tokenów.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    Logout usuwa zapisane poświadczenia OAuth, ale zachowuje zapisaną definicję serwera.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Jeśli dostawca rotuje tokeny lub stan autoryzacji się zablokuje, uruchom `openclaw mcp logout <name>`, a następnie powtórz `login`. `logout` może wyczyścić poświadczenia dla zapisanego serwera HTTP nawet po usunięciu `auth: "oauth"` z konfiguracji, o ile nazwa serwera i URL nadal identyfikują wpis magazynu poświadczeń.

### Transport Streamable HTTP

`streamable-http` to dodatkowa opcja transportu obok `sse` i `stdio`. Używa strumieniowania HTTP do dwukierunkowej komunikacji ze zdalnymi serwerami MCP.

| Pole                           | Opis                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `url`                          | URL HTTP lub HTTPS zdalnego serwera (wymagane)                                  |
| `transport`                    | Ustaw na `"streamable-http"`, aby wybrać ten transport; gdy pominięte, OpenClaw używa `sse` |
| `headers`                      | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokenów auth)         |
| `connectionTimeoutMs`          | Limit czasu połączenia dla serwera w ms (opcjonalne)                            |
| `connectTimeout`               | Limit czasu połączenia dla serwera w sekundach (opcjonalne)                     |
| `timeout` / `requestTimeoutMs` | Limit czasu żądania MCP dla serwera w sekundach lub ms                          |
| `auth: "oauth"`                | Użyj magazynu tokenów OAuth MCP i `openclaw mcp login`                          |
| `sslVerify`                    | Ustaw false tylko dla jawnie zaufanych prywatnych punktów końcowych HTTPS       |
| `clientCert` / `clientKey`     | Ścieżki certyfikatu klienta mTLS i klucza                                       |
| `supportsParallelToolCalls`    | Wskazówka, że współbieżne wywołania są bezpieczne dla tego serwera              |

Konfiguracja OpenClaw używa `transport: "streamable-http"` jako kanonicznej pisowni. Natywne dla CLI wartości MCP `type: "http"` są akceptowane przy zapisie przez `openclaw mcp set` i naprawiane przez `openclaw doctor --fix` w istniejącej konfiguracji, ale `transport` jest tym, co osadzony OpenClaw zużywa bezpośrednio.

Przykład:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Polecenia rejestru nie uruchamiają mostka kanału. Tylko `probe` i `doctor --probe` otwierają aktywną sesję klienta MCP, aby potwierdzić, że serwer docelowy jest osiągalny.
</Note>

## Control UI

Przeglądarkowy Control UI zawiera dedykowaną stronę ustawień MCP pod adresem `/mcp`. Pokazuje liczbę skonfigurowanych serwerów, podsumowania włączenia/OAuth/filtrów, wiersze transportu dla poszczególnych serwerów, kontrolki włączania/wyłączania, typowe polecenia CLI oraz edytor zakresowy dla sekcji konfiguracji `mcp`.

Używaj tej strony do edycji operatorskich i szybkiej inwentaryzacji. Użyj `openclaw mcp doctor --probe` lub `openclaw mcp probe`, gdy potrzebujesz aktywnego potwierdzenia serwera.

Przepływ pracy operatora:

1. Otwórz Control UI i wybierz **MCP**.
2. Przejrzyj karty podsumowania dla łącznej liczby serwerów, serwerów włączonych, OAuth i odfiltrowanych.
3. Użyj każdego wiersza serwera, aby sprawdzić transport, uwierzytelnianie, filtr, limit czasu i podpowiedzi poleceń.
4. Przełącz włączenie, gdy chcesz zachować definicję, ale wykluczyć ją z wykrywania w czasie działania.
5. Edytuj sekcję konfiguracji `mcp` o określonym zakresie dla zmian strukturalnych, takich jak nowe serwery, nagłówki, TLS, metadane OAuth lub filtry narzędzi.
6. Wybierz **Zapisz**, aby tylko utrwalić konfigurację, albo **Zapisz i opublikuj**, aby zastosować ją przez ścieżkę konfiguracji Gateway.
7. Uruchom `openclaw mcp doctor --probe`, gdy potrzebujesz dowodu na żywo, że edytowany serwer uruchamia się i wyświetla narzędzia.

Uwagi:

- fragmenty poleceń ujmują nazwy serwerów w cudzysłowy, aby nietypowe nazwy nadal można było skopiować do powłoki
- wyświetlane wartości podobne do URL-i są redagowane przed renderowaniem, gdy zawierają osadzone dane uwierzytelniające
- strona sama nie uruchamia transportów MCP
- aktywne środowiska uruchomieniowe mogą wymagać `openclaw mcp reload`, opublikowania konfiguracji Gateway lub restartu procesu, zależnie od tego, który proces jest właścicielem klientów MCP

## Bieżące ograniczenia

Ta strona dokumentuje most w postaci dostarczanej obecnie.

Bieżące ograniczenia:

- wykrywanie konwersacji zależy od istniejących metadanych tras sesji Gateway
- brak ogólnego protokołu push poza adapterem specyficznym dla Claude
- nie ma jeszcze narzędzi do edycji wiadomości ani reakcji
- transport HTTP/SSE/streamable-http łączy się z jednym serwerem zdalnym; nie ma jeszcze multipleksowanego upstreamu
- `permissions_list_open` obejmuje tylko zatwierdzenia zaobserwowane, gdy most jest połączony

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Pluginy](/pl/cli/plugins)
