---
read_when:
    - Łączenie Codex, Claude Code lub innego klienta MCP z kanałami obsługiwanymi przez OpenClaw
    - Uruchamianie `openclaw mcp serve`
    - Zarządzanie definicjami serwerów MCP zapisanymi przez OpenClaw
sidebarTitle: MCP
summary: Udostępniaj konwersacje kanałów OpenClaw przez MCP i zarządzaj zapisanymi definicjami serwerów MCP
title: MCP
x-i18n:
    generated_at: "2026-06-27T17:21:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2bf7050a3a712f761e3008c978f14a7576c9c6fa69d139894acbdcc0f20894b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` ma dwa zadania:

- uruchamia OpenClaw jako serwer MCP za pomocą `openclaw mcp serve`
- zarządza definicjami wychodzących serwerów MCP zarządzanych przez OpenClaw za pomocą `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` i `unset`

Innymi słowy:

- `serve` to OpenClaw działający jako serwer MCP
- pozostałe podpolecenia to OpenClaw działający jako rejestr po stronie klienta MCP dla serwerów MCP, z których jego środowiska uruchomieniowe mogą skorzystać później

<Note>
  `list`, `show`, `set` i `unset` tylko odczytują i zapisują wpisy `mcp.servers` zarządzane przez OpenClaw w konfiguracji OpenClaw. Nie obejmują serwerów mcporter z `config/mcporter.json`; dla tego rejestru użyj `mcporter list`.
</Note>

Użyj [`openclaw acp`](/pl/cli/acp), gdy OpenClaw ma sam hostować sesję uprzęży kodowania i kierować to środowisko uruchomieniowe przez ACP.

## Wybierz właściwą ścieżkę MCP

OpenClaw ma kilka powierzchni MCP. Wybierz tę, która odpowiada temu, kto jest właścicielem środowiska uruchomieniowego agenta i kto jest właścicielem narzędzi.

| Cel                                                                | Użyj                                                                  | Dlaczego                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Pozwolić zewnętrznemu klientowi MCP odczytywać/wysyłać konwersacje kanałów OpenClaw | `openclaw mcp serve`                                                 | OpenClaw jest serwerem MCP i udostępnia konwersacje oparte na Gateway przez stdio.                                 |
| Zapisać zewnętrzne serwery MCP dla uruchomień agentów zarządzanych przez OpenClaw        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw jest rejestrem po stronie klienta MCP i później projektuje te serwery do kwalifikujących się środowisk uruchomieniowych.               |
| Sprawdzić zapisany serwer bez uruchamiania tury agenta                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` i `doctor` sprawdzają konfigurację; `probe` otwiera aktywne połączenie MCP i wyświetla możliwości.               |
| Edytować konfigurację MCP z przeglądarki                                      | Control UI `/mcp`                                                    | Strona pokazuje inwentarz, włączenie, podsumowania OAuth/filtrów, podpowiedzi poleceń i zakresowy edytor `mcp`.         |
| Dać serwerowi aplikacji Codex zakresowy natywny serwer MCP                    | `mcp.servers.<name>.codex`                                           | Blok `codex` wpływa tylko na projekcję wątku serwera aplikacji Codex i jest usuwany przed przekazaniem natywnej konfiguracji. |
| Uruchamiać sesje uprzęży hostowane przez ACP                                     | [`openclaw acp`](/pl/cli/acp) i [Agenci ACP](/pl/tools/acp-agents-setup) | Tryb mostu ACP nie akceptuje wstrzykiwania serwera MCP dla pojedynczej sesji; zamiast tego skonfiguruj mosty gateway/plugin.     |

<Tip>
Jeśli nie masz pewności, której ścieżki potrzebujesz, zacznij od `openclaw mcp status --verbose`. Pokazuje, co OpenClaw zapisał, bez uruchamiania jakichkolwiek serwerów MCP.
</Tip>

## OpenClaw jako serwer MCP

To jest ścieżka `openclaw mcp serve`.

### Kiedy używać `serve`

Użyj `openclaw mcp serve`, gdy:

- Codex, Claude Code lub inny klient MCP powinien komunikować się bezpośrednio z konwersacjami kanałów opartymi na OpenClaw
- masz już lokalny lub zdalny OpenClaw Gateway z routowanymi sesjami
- chcesz mieć jeden serwer MCP działający z backendami kanałów OpenClaw zamiast uruchamiania osobnych mostów dla każdego kanału

Użyj zamiast tego [`openclaw acp`](/pl/cli/acp), gdy OpenClaw ma sam hostować środowisko uruchomieniowe kodowania i utrzymywać sesję agenta wewnątrz OpenClaw.

### Jak to działa

`openclaw mcp serve` uruchamia serwer MCP stdio. Klient MCP jest właścicielem tego procesu. Gdy klient utrzymuje otwartą sesję stdio, most łączy się z lokalnym lub zdalnym OpenClaw Gateway przez WebSocket i udostępnia routowane konwersacje kanałów przez MCP.

<Steps>
  <Step title="Klient uruchamia most">
    Klient MCP uruchamia `openclaw mcp serve`.
  </Step>
  <Step title="Most łączy się z Gateway">
    Most łączy się z OpenClaw Gateway przez WebSocket.
  </Step>
  <Step title="Sesje stają się konwersacjami MCP">
    Routowane sesje stają się konwersacjami MCP oraz narzędziami transkrypcji/historii.
  </Step>
  <Step title="Kolejka zdarzeń na żywo">
    Zdarzenia na żywo są kolejkowane w pamięci, gdy most jest połączony.
  </Step>
  <Step title="Opcjonalne powiadomienia push Claude">
    Jeśli tryb kanału Claude jest włączony, ta sama sesja może również odbierać powiadomienia push specyficzne dla Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Ważne zachowanie">
    - stan kolejki na żywo zaczyna się, gdy most się połączy
    - starsza historia transkrypcji jest odczytywana za pomocą `messages_read`
    - powiadomienia push Claude istnieją tylko wtedy, gdy sesja MCP jest aktywna
    - gdy klient się rozłącza, most kończy działanie, a kolejka na żywo znika
    - jednorazowe punkty wejścia agenta, takie jak `openclaw agent` i `openclaw infer model run`, wycofują wszystkie dołączone środowiska uruchomieniowe MCP, które otwierają, gdy odpowiedź zostanie ukończona, więc powtarzane uruchomienia skryptowe nie gromadzą procesów podrzędnych MCP stdio
    - serwery MCP stdio uruchamiane przez OpenClaw (dołączone lub skonfigurowane przez użytkownika) są zamykane jako drzewo procesów przy wyłączaniu, więc podprocesy podrzędne uruchomione przez serwer nie przetrwają po zakończeniu nadrzędnego klienta stdio
    - usunięcie lub zresetowanie sesji usuwa klientów MCP tej sesji przez współdzieloną ścieżkę czyszczenia środowiska uruchomieniowego, więc nie pozostają utrzymujące się połączenia stdio powiązane z usuniętą sesją

  </Accordion>
</AccordionGroup>

### Wybierz tryb klienta

Użyj tego samego mostu na dwa różne sposoby:

<Tabs>
  <Tab title="Ogólni klienci MCP">
    Tylko standardowe narzędzia MCP. Użyj `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` i narzędzi zatwierdzania.
  </Tab>
  <Tab title="Claude Code">
    Standardowe narzędzia MCP oraz adapter kanału specyficzny dla Claude. Włącz `--claude-channel-mode on` albo pozostaw domyślne `auto`.
  </Tab>
</Tabs>

<Note>
Dziś `auto` zachowuje się tak samo jak `on`. Nie ma jeszcze wykrywania możliwości klienta.
</Note>

### Co udostępnia `serve`

Most używa istniejących metadanych tras sesji Gateway, aby udostępniać konwersacje oparte na kanałach. Konwersacja pojawia się, gdy OpenClaw ma już stan sesji ze znaną trasą, taką jak:

- `channel`
- metadane odbiorcy lub miejsca docelowego
- opcjonalne `accountId`
- opcjonalne `threadId`

Daje to klientom MCP jedno miejsce do:

- wyświetlania ostatnich routowanych konwersacji
- odczytywania ostatniej historii transkrypcji
- oczekiwania na nowe zdarzenia przychodzące
- wysyłania odpowiedzi z powrotem tą samą trasą
- widzenia żądań zatwierdzenia, które przychodzą, gdy most jest połączony

### Użycie

<Tabs>
  <Tab title="Lokalny Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Zdalny Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Zdalny Gateway (hasło)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Szczegółowo / Claude wyłączony">
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
    Wyświetla ostatnie konwersacje oparte na sesjach, które mają już metadane tras w stanie sesji Gateway.

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
    Odczytuje ostatnie wiadomości transkrypcji dla jednej konwersacji opartej na sesji.
  </Accordion>
  <Accordion title="attachments_fetch">
    Wyodrębnia nietekstowe bloki treści wiadomości z jednej wiadomości transkrypcji. To widok metadanych treści transkrypcji, a nie samodzielny trwały magazyn obiektów załączników.
  </Accordion>
  <Accordion title="events_poll">
    Odczytuje kolejkowane zdarzenia na żywo od kursora liczbowego.
  </Accordion>
  <Accordion title="events_wait">
    Wykonuje długie odpytywanie, aż nadejdzie następne pasujące kolejkowane zdarzenie albo upłynie limit czasu.

    Użyj tego, gdy ogólny klient MCP potrzebuje dostarczania prawie w czasie rzeczywistym bez protokołu push specyficznego dla Claude.

  </Accordion>
  <Accordion title="messages_send">
    Wysyła tekst z powrotem tą samą trasą, która jest już zapisana w sesji.

    Obecne zachowanie:

    - wymaga istniejącej trasy konwersacji
    - używa kanału, odbiorcy, identyfikatora konta i identyfikatora wątku z sesji
    - wysyła tylko tekst

  </Accordion>
  <Accordion title="permissions_list_open">
    Wyświetla oczekujące żądania zatwierdzenia exec/plugin, które most zaobserwował od momentu połączenia z Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Rozwiązuje jedno oczekujące żądanie zatwierdzenia exec/plugin za pomocą:

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
- kolejka działa tylko na żywo; zaczyna się, gdy startuje most MCP
- `events_poll` i `events_wait` same nie odtwarzają starszej historii Gateway
- trwałe zaległości należy odczytywać za pomocą `messages_read`

</Warning>

### Powiadomienia kanału Claude

Most może również udostępniać powiadomienia kanału specyficzne dla Claude. To odpowiednik adaptera kanału Claude Code w OpenClaw: standardowe narzędzia MCP pozostają dostępne, ale przychodzące wiadomości na żywo mogą również docierać jako powiadomienia MCP specyficzne dla Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: tylko standardowe narzędzia MCP.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: włącz powiadomienia kanału Claude.
  </Tab>
  <Tab title="auto (domyślnie)">
    `--claude-channel-mode auto`: obecna wartość domyślna; takie samo zachowanie mostu jak `on`.
  </Tab>
</Tabs>

Gdy tryb kanału Claude jest włączony, serwer ogłasza eksperymentalne możliwości Claude i może emitować:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Obecne zachowanie mostu:

- przychodzące wiadomości transkrypcji `user` są przekazywane jako `notifications/claude/channel`
- żądania uprawnień Claude otrzymane przez MCP są śledzone w pamięci
- jeśli połączona konwersacja później wyśle `yes abcde` lub `no abcde`, most konwertuje to na `notifications/claude/channel/permission`
- te powiadomienia działają tylko w sesji na żywo; jeśli klient MCP się rozłączy, nie ma celu push

To jest celowo specyficzne dla klienta. Ogólni klienci MCP powinni polegać na standardowych narzędziach odpytywania.

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

W przypadku większości ogólnych klientów MCP zacznij od standardowej powierzchni narzędzi i zignoruj tryb Claude. Włącz tryb Claude tylko dla klientów, którzy faktycznie rozumieją metody powiadomień specyficzne dla Claude.

### Opcje

`openclaw mcp serve` obsługuje:

<ParamField path="--url" type="string">
  URL WebSocket Gateway.
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

Most nie wymyśla routingu. Udostępnia tylko konwersacje, które Gateway już potrafi routować.

Oznacza to, że:

- listy dozwolonych nadawców, parowanie i zaufanie na poziomie kanału nadal należą do bazowej konfiguracji kanału OpenClaw
- `messages_send` może odpowiadać tylko przez istniejącą zapisaną trasę
- stan zatwierdzeń jest tylko bieżący/w pamięci i dotyczy aktualnej sesji mostu
- uwierzytelnianie mostu powinno używać tych samych mechanizmów tokenu lub hasła Gateway, którym ufasz dla każdego innego zdalnego klienta Gateway

Jeśli konwersacji brakuje w `conversations_list`, zwykłą przyczyną nie jest konfiguracja MCP. To brakujące lub niepełne metadane trasy w bazowej sesji Gateway.

### Testowanie

OpenClaw dostarcza deterministyczny test dymny Docker dla tego mostu:

```bash
pnpm test:docker:mcp-channels
```

Ten test dymny:

- uruchamia kontener Gateway z zasianymi danymi
- uruchamia drugi kontener, który startuje `openclaw mcp serve`
- weryfikuje wykrywanie konwersacji, odczyty transkrypcji, odczyty metadanych załączników, zachowanie kolejki zdarzeń na żywo oraz routing wysyłki wychodzącej
- sprawdza powiadomienia kanałów i uprawnień w stylu Claude przez rzeczywisty most stdio MCP

To najszybszy sposób, aby udowodnić, że most działa bez podłączania prawdziwego konta Telegram, Discord ani iMessage do przebiegu testowego.

Szerszy kontekst testowania znajdziesz w [Testowanie](/pl/help/testing).

### Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Nie zwrócono żadnych konwersacji">
    Zwykle oznacza to, że sesja Gateway nie jest jeszcze routowalna. Potwierdź, że bazowa sesja ma zapisane metadane trasy kanału/providera, odbiorcy oraz opcjonalnego konta/wątku.
  </Accordion>
  <Accordion title="events_poll lub events_wait pomija starsze wiadomości">
    Oczekiwane. Kolejka na żywo zaczyna działać, gdy most się połączy. Starszą historię transkrypcji odczytaj za pomocą `messages_read`.
  </Accordion>
  <Accordion title="Powiadomienia Claude nie pojawiają się">
    Sprawdź wszystkie te elementy:

    - klient utrzymał sesję stdio MCP otwartą
    - `--claude-channel-mode` ma wartość `on` lub `auto`
    - klient faktycznie rozumie metody powiadomień specyficzne dla Claude
    - wiadomość przychodząca wystąpiła po połączeniu mostu

  </Accordion>
  <Accordion title="Brakuje zatwierdzeń">
    `permissions_list_open` pokazuje tylko żądania zatwierdzenia zaobserwowane, gdy most był połączony. Nie jest to trwałe API historii zatwierdzeń.
  </Accordion>
</AccordionGroup>

## OpenClaw jako rejestr klienta MCP

To ścieżka `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` i `unset`.

Te polecenia nie udostępniają OpenClaw przez MCP. Zarządzają definicjami serwerów MCP zarządzanymi przez OpenClaw w `mcp.servers` w konfiguracji OpenClaw. Nie odczytują serwerów mcporter z `config/mcporter.json`.

Te zapisane definicje są przeznaczone dla środowisk wykonawczych, które OpenClaw uruchamia lub konfiguruje później, takich jak osadzony OpenClaw i inne adaptery środowiska wykonawczego. OpenClaw przechowuje definicje centralnie, aby te środowiska wykonawcze nie musiały utrzymywać własnych zduplikowanych list serwerów MCP.

<AccordionGroup>
  <Accordion title="Ważne zachowanie">
    - te polecenia tylko odczytują lub zapisują konfigurację OpenClaw
    - `status`, `list`, `show`, `doctor` bez `--probe`, `set`, `configure`, `tools`, `logout`, `reload` i `unset` nie łączą się z docelowym serwerem MCP
    - `login` wykonuje sieciowy przepływ MCP OAuth dla skonfigurowanego serwera HTTP i zapisuje wynikowe poświadczenia lokalne
    - `status --verbose` wypisuje rozpoznany transport, uwierzytelnianie, limit czasu, filtr i wskazówki dotyczące równoległych wywołań narzędzi bez łączenia
    - `doctor` sprawdza zapisane definicje pod kątem lokalnych problemów konfiguracji, takich jak brakujące polecenia stdio, nieprawidłowe katalogi robocze, brakujące pliki TLS, wyłączone serwery, dosłowne wrażliwe wartości nagłówków/env oraz niepełna autoryzacja OAuth
    - `doctor --probe` dodaje taki sam dowód połączenia na żywo jak `probe` po przejściu kontroli statycznych
    - `probe` łączy się z wybranym serwerem lub wszystkimi skonfigurowanymi serwerami, wyświetla narzędzia i raportuje możliwości/diagnostykę
    - `add` buduje definicję z flag i sonduje ją przed zapisaniem, chyba że ustawiono `--no-probe` albo najpierw potrzebna jest autoryzacja OAuth
    - adaptery środowiska wykonawczego decydują w czasie wykonywania, które kształty transportu faktycznie obsługują
    - `enabled: false` pozostawia serwer zapisany, ale wyklucza go z wykrywania osadzonego środowiska wykonawczego
    - `timeout` i `connectTimeout` ustawiają limity czasu żądań i połączeń dla serwera w sekundach
    - `supportsParallelToolCalls: true` oznacza serwery, które adaptery mogą wywoływać współbieżnie
    - serwery HTTP mogą używać statycznych nagłówków, logowania OAuth, kontroli weryfikacji TLS oraz ścieżek certyfikatu/klucza mTLS
    - osadzony OpenClaw udostępnia skonfigurowane narzędzia MCP w normalnych profilach narzędzi `coding` i `messaging`; `minimal` nadal je ukrywa, a `tools.deny: ["bundle-mcp"]` wyłącza je jawnie
    - `toolFilter.include` i `toolFilter.exclude` dla serwera filtrują wykryte narzędzia MCP, zanim staną się narzędziami OpenClaw
    - serwery reklamujące zasoby lub prompty udostępniają także narzędzia pomocnicze do wyświetlania/odczytu zasobów oraz wyświetlania/pobierania promptów; te wygenerowane nazwy narzędzi pomocniczych (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) używają tego samego filtra include/exclude
    - dynamiczne zmiany listy narzędzi MCP unieważniają buforowany katalog dla tej sesji; następne wykrycie/użycie odświeża dane z serwera
    - powtarzające się błędy żądań/protokołu narzędzi MCP na krótko wstrzymują ten serwer, aby jeden uszkodzony serwer nie zużył całej tury
    - sesyjne pakietowe środowiska wykonawcze MCP są sprzątane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10 minut; ustaw `0`, aby wyłączyć), a jednorazowe osadzone uruchomienia czyszczą je na końcu przebiegu

  </Accordion>
</AccordionGroup>

Adaptery środowiska wykonawczego mogą normalizować ten współdzielony rejestr do kształtu oczekiwanego przez ich klienta downstream. Na przykład osadzony OpenClaw bezpośrednio używa wartości `transport` OpenClaw, podczas gdy Claude Code i Gemini otrzymują natywne dla CLI wartości `type`, takie jak `http`, `sse` lub `stdio`.

Codex app-server honoruje także opcjonalny blok `codex` na każdym serwerze. Są to metadane projekcji OpenClaw tylko dla wątków Codex app-server; nie zmieniają sesji ACP, ogólnej konfiguracji uprzęży Codex ani innych adapterów środowiska wykonawczego.
Użyj niepustego `codex.agents`, aby rzutować serwer tylko do konkretnych identyfikatorów agentów OpenClaw. Puste, białe lub nieprawidłowe listy agentów są odrzucane przez walidację konfiguracji i pomijane przez ścieżkę projekcji środowiska wykonawczego zamiast stawać się globalne. Użyj `codex.defaultToolsApprovalMode` (`auto`, `prompt` lub `approve`), aby emitować natywne dla Codex `default_tools_approval_mode` dla zaufanego serwera.
OpenClaw usuwa metadane `codex` przed przekazaniem natywnej konfiguracji `mcp_servers` do Codex.

### Zapisane definicje serwerów MCP

OpenClaw przechowuje również w konfiguracji lekki rejestr serwerów MCP dla powierzchni, które chcą definicji MCP zarządzanych przez OpenClaw.

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
- `status` klasyfikuje skonfigurowane transporty bez łączenia. `--verbose` obejmuje rozpoznane szczegóły uruchomienia, limitów czasu, OAuth, filtrów i wywołań równoległych.
- `doctor` wykonuje kontrole statyczne bez łączenia. Dodaj `--probe`, gdy polecenie ma także zweryfikować, że włączone serwery się łączą.
- `probe` łączy się i raportuje liczby narzędzi, obsługę zasobów/promptów, obsługę zmian listy oraz diagnostykę.
- `add` akceptuje flagi stdio, takie jak `--command`, `--arg`, `--env` i `--cwd`, albo flagi HTTP, takie jak `--url`, `--transport`, `--header`, `--auth oauth`, TLS, limit czasu i flagi wyboru narzędzi.
- `set` oczekuje jednej wartości obiektu JSON w wierszu poleceń.
- `configure` aktualizuje włączenie, filtry narzędzi, limity czasu, OAuth, TLS i wskazówki dotyczące równoległych wywołań narzędzi bez zastępowania całej definicji serwera.
- `tools` aktualizuje filtry narzędzi dla serwera. Wpisy include/exclude to nazwy narzędzi MCP i proste globs `*`.
- `login` uruchamia przepływ OAuth dla serwerów HTTP skonfigurowanych z `auth: "oauth"`. Pierwsze uruchomienie wypisuje URL autoryzacji; uruchom ponownie z `--code` po zatwierdzeniu.
- `logout` czyści zapisane poświadczenia OAuth dla nazwanego serwera bez usuwania zapisanej definicji serwera.
- `reload` zwalnia buforowane wewnątrzprocesowe środowiska wykonawcze MCP. Procesy Gateway lub agentów w innym procesie nadal potrzebują własnej ścieżki ponownego wczytania albo restartu.
- Użyj `transport: "streamable-http"` dla serwerów Streamable HTTP MCP. `openclaw mcp set` normalizuje również natywne dla CLI `type: "http"` do tego samego kanonicznego kształtu konfiguracji dla kompatybilności.
- `unset` kończy się niepowodzeniem, jeśli nazwany serwer nie istnieje.

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

### Typowe receptury serwerów

Te przykłady tylko zapisują definicje serwerów. Następnie uruchom `openclaw mcp doctor --probe`, aby udowodnić, że serwer startuje i udostępnia narzędzia.

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

    Ogranicz serwery systemu plików do najmniejszego drzewa katalogów, które agent powinien czytać lub edytować.

  </Tab>
  <Tab title="Pamięć">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Użyj filtra narzędzi, jeśli serwer udostępnia narzędzia zapisu, które nie powinny być dostępne dla zwykłych agentów.

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

    `doctor` sprawdza, czy `cwd` istnieje i czy polecenie jest rozpoznawane w skonfigurowanym środowisku.

  </Tab>
  <Tab title="Zdalny HTTP">
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

    Bezpośrednie serwery sterowania pulpitem dziedziczą uprawnienia uruchamianego procesu. Używaj wąskich filtrów narzędzi i monitów uprawnień na poziomie systemu operacyjnego.

  </Tab>
</Tabs>

### Kształty danych wyjściowych JSON

Używaj `--json` w skryptach i pulpitach. Zestawy pól mogą z czasem rosnąć, więc konsumenci powinni ignorować nieznane klucze.

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

    `doctor --json` kończy się kodem niezerowym, gdy dowolny włączony sprawdzany serwer ma błąd. Ostrzeżenia są zgłaszane, ale same nie powodują niepowodzenia polecenia.

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

### Transport Stdio

Uruchamia lokalny proces podrzędny i komunikuje się przez stdin/stdout.

| Pole                       | Opis                                      |
| -------------------------- | ---------------------------------------- |
| `command`                  | Plik wykonywalny do uruchomienia (wymagane) |
| `args`                     | Tablica argumentów wiersza poleceń       |
| `env`                      | Dodatkowe zmienne środowiskowe           |
| `cwd` / `workingDirectory` | Katalog roboczy procesu                  |

<Warning>
**Filtr bezpieczeństwa środowiska Stdio**

OpenClaw odrzuca klucze środowiska uruchamiania interpretera, które mogą zmienić sposób startu serwera MCP stdio przed pierwszym RPC, nawet jeśli pojawiają się w bloku `env` serwera. Zablokowane klucze obejmują `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` oraz podobne zmienne sterujące środowiskiem uruchomieniowym. Uruchamianie odrzuca je z błędem konfiguracji, aby nie mogły wstrzyknąć niejawnego preludium, podmienić interpretera, włączyć debuggera ani przekierować danych wyjściowych runtime przeciwko procesowi stdio. Zwykłe zmienne środowiskowe poświadczeń, proxy i specyficzne dla serwera (`GITHUB_TOKEN`, `HTTP_PROXY`, niestandardowe `*_API_KEY` itd.) nie są naruszone.

Jeśli Twój serwer MCP naprawdę potrzebuje jednej z zablokowanych zmiennych, ustaw ją w procesie hosta gateway zamiast w `env` serwera stdio.
</Warning>

### Transport SSE / HTTP

Łączy się ze zdalnym serwerem MCP przez HTTP Server-Sent Events.

| Pole                           | Opis                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| `url`                          | Adres URL HTTP lub HTTPS zdalnego serwera (wymagane)            |
| `headers`                      | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokenów uwierzytelniania) |
| `connectionTimeoutMs`          | Limit czasu połączenia dla serwera w ms (opcjonalnie)           |
| `connectTimeout`               | Limit czasu połączenia dla serwera w sekundach (opcjonalnie)    |
| `timeout` / `requestTimeoutMs` | Limit czasu żądania MCP dla serwera w sekundach lub ms          |
| `auth: "oauth"`                | Użyj magazynu tokenów OAuth MCP i `openclaw mcp login`          |
| `sslVerify`                    | Ustaw false tylko dla jawnie zaufanych prywatnych punktów końcowych HTTPS |
| `clientCert` / `clientKey`     | Ścieżki certyfikatu klienta mTLS i klucza                       |
| `supportsParallelToolCalls`    | Wskazówka, że równoczesne wywołania są bezpieczne dla tego serwera |

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

Wrażliwe wartości w `url` (userinfo) i `headers` są redagowane w logach i danych wyjściowych statusu. `openclaw mcp doctor` ostrzega, gdy wyglądające na wrażliwe wpisy `headers` lub `env` zawierają dosłowne wartości, aby operatorzy mogli przenieść te wartości poza commitowaną konfigurację.

### Przepływ pracy OAuth

OAuth jest przeznaczony dla serwerów MCP HTTP, które reklamują przepływ OAuth MCP. Statyczne nagłówki `Authorization` są ignorowane dla serwera, gdy włączone jest `auth: "oauth"`.

<Steps>
  <Step title="Zapisz serwer">
    Dodaj lub zaktualizuj serwer z `auth: "oauth"` i dowolnymi opcjonalnymi metadanymi OAuth.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Rozpocznij logowanie">
    Uruchom logowanie, aby utworzyć żądanie autoryzacji.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw wypisuje adres URL autoryzacji i zapisuje tymczasowy stan weryfikatora OAuth w katalogu stanu OpenClaw.

  </Step>
  <Step title="Zakończ kodem">
    Po zatwierdzeniu w przeglądarce przekaż zwrócony kod z powrotem do OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Sprawdź autoryzację">
    Użyj statusu lub doctor, aby potwierdzić obecność tokenów.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Wyczyść poświadczenia">
    Wylogowanie usuwa zapisane poświadczenia OAuth, ale zachowuje zapisaną definicję serwera.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Jeśli dostawca rotuje tokeny albo stan autoryzacji utknie, uruchom `openclaw mcp logout <name>`, a następnie powtórz `login`. `logout` może wyczyścić poświadczenia zapisanego serwera HTTP nawet po usunięciu `auth: "oauth"` z konfiguracji, o ile nazwa serwera i adres URL nadal identyfikują wpis magazynu poświadczeń.

### Transport Streamable HTTP

`streamable-http` to dodatkowa opcja transportu obok `sse` i `stdio`. Używa strumieniowania HTTP do dwukierunkowej komunikacji ze zdalnymi serwerami MCP.

| Pole                           | Opis                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `url`                          | Adres URL HTTP lub HTTPS zdalnego serwera (wymagane)                                |
| `transport`                    | Ustaw na `"streamable-http"`, aby wybrać ten transport; gdy pominięte, OpenClaw używa `sse` |
| `headers`                      | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokenów uwierzytelniania) |
| `connectionTimeoutMs`          | Limit czasu połączenia dla serwera w ms (opcjonalnie)                               |
| `connectTimeout`               | Limit czasu połączenia dla serwera w sekundach (opcjonalnie)                        |
| `timeout` / `requestTimeoutMs` | Limit czasu żądania MCP dla serwera w sekundach lub ms                              |
| `auth: "oauth"`                | Użyj magazynu tokenów OAuth MCP i `openclaw mcp login`                              |
| `sslVerify`                    | Ustaw false tylko dla jawnie zaufanych prywatnych punktów końcowych HTTPS           |
| `clientCert` / `clientKey`     | Ścieżki certyfikatu klienta mTLS i klucza                                           |
| `supportsParallelToolCalls`    | Wskazówka, że równoczesne wywołania są bezpieczne dla tego serwera                  |

Konfiguracja OpenClaw używa `transport: "streamable-http"` jako kanonicznej pisowni. Wartości MCP natywne dla CLI `type: "http"` są akceptowane podczas zapisywania przez `openclaw mcp set` i naprawiane przez `openclaw doctor --fix` w istniejącej konfiguracji, ale `transport` jest tym, co osadzony OpenClaw konsumuje bezpośrednio.

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
Polecenia rejestru nie uruchamiają mostu kanału. Tylko `probe` i `doctor --probe` otwierają aktywną sesję klienta MCP, aby potwierdzić, że serwer docelowy jest osiągalny.
</Note>

## Control UI

Przeglądarkowy Control UI zawiera dedykowaną stronę ustawień MCP pod `/mcp`. Pokazuje liczniki skonfigurowanych serwerów, podsumowania włączenia/OAuth/filtrów, wiersze transportu dla poszczególnych serwerów, kontrolki włączania/wyłączania, typowe polecenia CLI oraz edytor o ograniczonym zakresie dla sekcji konfiguracji `mcp`.

Używaj tej strony do edycji operatorskich i szybkiej inwentaryzacji. Użyj `openclaw mcp doctor --probe` lub `openclaw mcp probe`, gdy potrzebujesz aktywnego potwierdzenia serwera.

Przepływ pracy operatora:

1. Otwórz Control UI i wybierz **MCP**.
2. Przejrzyj karty podsumowania dla łącznej liczby serwerów, serwerów włączonych, OAuth i odfiltrowanych.
3. Użyj każdego wiersza serwera, aby sprawdzić transport, uwierzytelnianie, filtr, limit czasu i podpowiedzi poleceń.
4. Przełącz włączenie, gdy chcesz zachować definicję, ale wykluczyć ją z wykrywania w czasie działania.
5. Edytuj zakresową sekcję konfiguracji `mcp`, aby wprowadzić zmiany strukturalne, takie jak nowe serwery, nagłówki, TLS, metadane OAuth lub filtry narzędzi.
6. Wybierz **Zapisz**, aby tylko utrwalić konfigurację, albo **Zapisz i opublikuj**, aby zastosować ją przez ścieżkę konfiguracji Gateway.
7. Uruchom `openclaw mcp doctor --probe`, gdy potrzebujesz dowodu na żywo, że edytowany serwer uruchamia się i wyświetla narzędzia.

Uwagi:

- fragmenty poleceń ujmują nazwy serwerów w cudzysłowy, aby nietypowe nazwy nadal dało się skopiować do powłoki
- wyświetlane wartości przypominające adresy URL są redagowane przed renderowaniem, gdy zawierają osadzone dane uwierzytelniające
- strona sama nie uruchamia transportów MCP
- aktywne środowiska uruchomieniowe mogą wymagać `openclaw mcp reload`, opublikowania konfiguracji Gateway albo ponownego uruchomienia procesu, zależnie od tego, który proces jest właścicielem klientów MCP

## Bieżące ograniczenia

Ta strona dokumentuje most w postaci dostarczanej obecnie.

Bieżące ograniczenia:

- wykrywanie rozmów zależy od istniejących metadanych tras sesji Gateway
- brak ogólnego protokołu push poza adapterem specyficznym dla Claude
- nie ma jeszcze narzędzi do edycji wiadomości ani reakcji
- transport HTTP/SSE/streamable-http łączy się z jednym zdalnym serwerem; nie ma jeszcze multipleksowanego serwera nadrzędnego
- `permissions_list_open` obejmuje tylko zatwierdzenia zaobserwowane, gdy most jest połączony

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Pluginy](/pl/cli/plugins)
