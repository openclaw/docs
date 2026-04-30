---
read_when:
    - Podłączanie Codex, Claude Code lub innego klienta MCP do kanałów obsługiwanych przez OpenClaw
    - Uruchamianie `openclaw mcp serve`
    - Zarządzanie definicjami serwerów MCP zapisanymi przez OpenClaw
sidebarTitle: MCP
summary: Udostępniaj konwersacje w kanałach OpenClaw przez MCP i zarządzaj zapisanymi definicjami serwerów MCP
title: MCP
x-i18n:
    generated_at: "2026-04-30T09:44:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: d66ec20b81ab3894c7202ee1c1c6666bd9cdeffc8d48a280b1f298bb358887ef
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` ma dwa zadania:

- uruchamiać OpenClaw jako serwer MCP za pomocą `openclaw mcp serve`
- zarządzać należącymi do OpenClaw definicjami wychodzących serwerów MCP za pomocą `list`, `show`, `set` i `unset`

Innymi słowy:

- `serve` to OpenClaw działający jako serwer MCP
- `list` / `show` / `set` / `unset` to OpenClaw działający jako rejestr po stronie klienta MCP dla innych serwerów MCP, z których jego środowiska uruchomieniowe mogą skorzystać później

Użyj [`openclaw acp`](/pl/cli/acp), gdy OpenClaw ma samodzielnie hostować sesję środowiska kodowania i kierować to środowisko uruchomieniowe przez ACP.

## OpenClaw jako serwer MCP

To jest ścieżka `openclaw mcp serve`.

### Kiedy używać `serve`

Użyj `openclaw mcp serve`, gdy:

- Codex, Claude Code lub inny klient MCP ma rozmawiać bezpośrednio z rozmowami kanałów obsługiwanych przez OpenClaw
- masz już lokalny lub zdalny OpenClaw Gateway z kierowanymi sesjami
- chcesz jeden serwer MCP, który działa w różnych backendach kanałów OpenClaw, zamiast uruchamiać osobne mosty dla każdego kanału

Użyj zamiast tego [`openclaw acp`](/pl/cli/acp), gdy OpenClaw ma hostować samo środowisko uruchomieniowe kodowania i utrzymywać sesję agenta wewnątrz OpenClaw.

### Jak to działa

`openclaw mcp serve` uruchamia serwer MCP stdio. Klient MCP jest właścicielem tego procesu. Dopóki klient utrzymuje otwartą sesję stdio, most łączy się z lokalnym lub zdalnym OpenClaw Gateway przez WebSocket i udostępnia kierowane rozmowy kanałów przez MCP.

<Steps>
  <Step title="Klient uruchamia most">
    Klient MCP uruchamia `openclaw mcp serve`.
  </Step>
  <Step title="Most łączy się z Gateway">
    Most łączy się z OpenClaw Gateway przez WebSocket.
  </Step>
  <Step title="Sesje stają się rozmowami MCP">
    Kierowane sesje stają się rozmowami MCP oraz narzędziami transkrypcji/historii.
  </Step>
  <Step title="Kolejka zdarzeń na żywo">
    Zdarzenia na żywo są kolejkowane w pamięci, gdy most jest połączony.
  </Step>
  <Step title="Opcjonalne powiadomienia push Claude">
    Jeśli tryb kanału Claude jest włączony, ta sama sesja może też otrzymywać powiadomienia push specyficzne dla Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Ważne zachowanie">
    - stan kolejki na żywo zaczyna się, gdy most się łączy
    - starsza historia transkrypcji jest odczytywana za pomocą `messages_read`
    - powiadomienia push Claude istnieją tylko wtedy, gdy sesja MCP jest aktywna
    - gdy klient się rozłącza, most kończy działanie, a kolejka na żywo znika
    - jednorazowe punkty wejścia agenta, takie jak `openclaw agent` i `openclaw infer model run`, wycofują wszystkie otwierane przez siebie dołączone środowiska uruchomieniowe MCP po zakończeniu odpowiedzi, więc powtarzane uruchomienia skryptowe nie kumulują procesów potomnych stdio MCP
    - serwery MCP stdio uruchamiane przez OpenClaw, dołączone lub skonfigurowane przez użytkownika, są zamykane jako drzewo procesów przy wyłączaniu, więc podprocesy potomne uruchomione przez serwer nie przetrwają po zakończeniu nadrzędnego klienta stdio
    - usunięcie lub zresetowanie sesji usuwa klientów MCP tej sesji przez współdzieloną ścieżkę czyszczenia środowiska uruchomieniowego, więc nie pozostają żadne zalegające połączenia stdio powiązane z usuniętą sesją

  </Accordion>
</AccordionGroup>

### Wybierz tryb klienta

Użyj tego samego mostu na dwa różne sposoby:

<Tabs>
  <Tab title="Ogólni klienci MCP">
    Tylko standardowe narzędzia MCP. Użyj `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` oraz narzędzi zatwierdzania.
  </Tab>
  <Tab title="Claude Code">
    Standardowe narzędzia MCP oraz adapter kanału specyficzny dla Claude. Włącz `--claude-channel-mode on` albo zostaw domyślne `auto`.
  </Tab>
</Tabs>

<Note>
Obecnie `auto` zachowuje się tak samo jak `on`. Nie ma jeszcze wykrywania możliwości klienta.
</Note>

### Co udostępnia `serve`

Most używa istniejących metadanych tras sesji Gateway do udostępniania rozmów obsługiwanych przez kanały. Rozmowa pojawia się, gdy OpenClaw ma już stan sesji ze znaną trasą, taką jak:

- `channel`
- metadane odbiorcy lub miejsca docelowego
- opcjonalne `accountId`
- opcjonalne `threadId`

Daje to klientom MCP jedno miejsce do:

- wyświetlania ostatnich kierowanych rozmów
- odczytywania ostatniej historii transkrypcji
- oczekiwania na nowe zdarzenia przychodzące
- wysyłania odpowiedzi z powrotem tą samą trasą
- wyświetlania żądań zatwierdzenia, które przychodzą, gdy most jest połączony

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
  <Tab title="Szczegółowe logi / Claude wyłączony">
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
    Wyświetla ostatnie rozmowy obsługiwane przez sesje, które mają już metadane trasy w stanie sesji Gateway.

    Przydatne filtry:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Zwraca jedną rozmowę według `session_key`.
  </Accordion>
  <Accordion title="messages_read">
    Odczytuje ostatnie wiadomości transkrypcji dla jednej rozmowy obsługiwanej przez sesję.
  </Accordion>
  <Accordion title="attachments_fetch">
    Wyodrębnia bloki treści wiadomości niebędące tekstem z jednej wiadomości transkrypcji. To widok metadanych na treść transkrypcji, a nie samodzielny trwały magazyn blobów załączników.
  </Accordion>
  <Accordion title="events_poll">
    Odczytuje kolejkowane zdarzenia na żywo od kursora numerycznego.
  </Accordion>
  <Accordion title="events_wait">
    Wykonuje długie odpytywanie, aż nadejdzie następne pasujące kolejkowane zdarzenie albo upłynie limit czasu.

    Użyj tego, gdy ogólny klient MCP potrzebuje dostarczania prawie w czasie rzeczywistym bez protokołu push specyficznego dla Claude.

  </Accordion>
  <Accordion title="messages_send">
    Wysyła tekst z powrotem przez tę samą trasę, która jest już zapisana w sesji.

    Obecne zachowanie:

    - wymaga istniejącej trasy rozmowy
    - używa kanału sesji, odbiorcy, identyfikatora konta i identyfikatora wątku
    - wysyła tylko tekst

  </Accordion>
  <Accordion title="permissions_list_open">
    Wyświetla oczekujące żądania zatwierdzenia exec/Plugin, które most zaobserwował od momentu połączenia z Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Rozwiązuje jedno oczekujące żądanie zatwierdzenia exec/Plugin za pomocą:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Model zdarzeń

Most utrzymuje w pamięci kolejkę zdarzeń, gdy jest połączony.

Obecne typy zdarzeń:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- kolejka jest tylko na żywo; zaczyna się, gdy most MCP startuje
- `events_poll` i `events_wait` same nie odtwarzają starszej historii Gateway
- trwały backlog należy odczytywać za pomocą `messages_read`

</Warning>

### Powiadomienia kanału Claude

Most może też udostępniać powiadomienia kanału specyficzne dla Claude. To odpowiednik adaptera kanału Claude Code w OpenClaw: standardowe narzędzia MCP pozostają dostępne, ale wiadomości przychodzące na żywo mogą też przychodzić jako powiadomienia MCP specyficzne dla Claude.

<Tabs>
  <Tab title="wyłączony">
    `--claude-channel-mode off`: tylko standardowe narzędzia MCP.
  </Tab>
  <Tab title="włączony">
    `--claude-channel-mode on`: włącza powiadomienia kanału Claude.
  </Tab>
  <Tab title="auto (domyślne)">
    `--claude-channel-mode auto`: obecna wartość domyślna; takie samo zachowanie mostu jak `on`.
  </Tab>
</Tabs>

Gdy tryb kanału Claude jest włączony, serwer ogłasza eksperymentalne możliwości Claude i może emitować:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Obecne zachowanie mostu:

- przychodzące wiadomości transkrypcji `user` są przekazywane jako `notifications/claude/channel`
- żądania uprawnień Claude otrzymane przez MCP są śledzone w pamięci
- jeśli połączona rozmowa później wyśle `yes abcde` lub `no abcde`, most konwertuje to na `notifications/claude/channel/permission`
- te powiadomienia dotyczą tylko sesji na żywo; jeśli klient MCP się rozłączy, nie ma celu push

Jest to celowo specyficzne dla klienta. Ogólni klienci MCP powinni polegać na standardowych narzędziach odpytywania.

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

W przypadku większości ogólnych klientów MCP zacznij od standardowego zestawu narzędzi i ignoruj tryb Claude. Włącz tryb Claude tylko dla klientów, którzy faktycznie rozumieją metody powiadomień specyficzne dla Claude.

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
  Szczegółowe logi na stderr.
</ParamField>

<Tip>
Gdy to możliwe, preferuj `--token-file` lub `--password-file` zamiast sekretów wprost w poleceniu.
</Tip>

### Bezpieczeństwo i granica zaufania

Most nie tworzy routingu. Udostępnia tylko rozmowy, które Gateway już potrafi kierować.

Oznacza to, że:

- listy dozwolonych nadawców, parowanie i zaufanie na poziomie kanału nadal należą do podstawowej konfiguracji kanału OpenClaw
- `messages_send` może odpowiadać tylko przez istniejącą zapisaną trasę
- stan zatwierdzeń jest na żywo/w pamięci tylko dla bieżącej sesji mostu
- uwierzytelnianie mostu powinno używać tych samych mechanizmów tokena lub hasła Gateway, którym ufasz dla dowolnego innego zdalnego klienta Gateway

Jeśli rozmowy brakuje w `conversations_list`, zwykle przyczyną nie jest konfiguracja MCP. To brakujące lub niekompletne metadane trasy w podstawowej sesji Gateway.

### Testowanie

OpenClaw dostarcza deterministyczny test smoke Docker dla tego mostu:

```bash
pnpm test:docker:mcp-channels
```

Ten test smoke:

- uruchamia wstępnie zasilony kontener Gateway
- uruchamia drugi kontener, który spawnuje `openclaw mcp serve`
- weryfikuje wykrywanie rozmów, odczyty transkrypcji, odczyty metadanych załączników, zachowanie kolejki zdarzeń na żywo i routing wysyłania wychodzącego
- waliduje powiadomienia kanału i uprawnień w stylu Claude przez rzeczywisty most stdio MCP

To najszybszy sposób, aby udowodnić, że most działa bez podłączania prawdziwego konta Telegram, Discord lub iMessage do przebiegu testowego.

Szerszy kontekst testowania znajdziesz w [Testowanie](/pl/help/testing).

### Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Nie zwrócono żadnych rozmów">
    Zwykle oznacza to, że sesja Gateway nie jest jeszcze routowalna. Potwierdź, że podstawowa sesja ma zapisany kanał/dostawcę, odbiorcę oraz opcjonalne metadane trasy konta/wątku.
  </Accordion>
  <Accordion title="events_poll lub events_wait pomija starsze wiadomości">
    Oczekiwane. Kolejka na żywo zaczyna się, gdy most się łączy. Odczytaj starszą historię transkrypcji za pomocą `messages_read`.
  </Accordion>
  <Accordion title="Powiadomienia Claude się nie pojawiają">
    Sprawdź wszystkie te elementy:

    - klient utrzymał otwartą sesję stdio MCP
    - `--claude-channel-mode` ma wartość `on` lub `auto`
    - klient faktycznie rozumie metody powiadomień specyficzne dla Claude
    - wiadomość przychodząca nastąpiła po połączeniu mostu

  </Accordion>
  <Accordion title="Brakuje zatwierdzeń">
    `permissions_list_open` pokazuje tylko żądania zatwierdzenia zaobserwowane, gdy most był połączony. Nie jest to API trwałej historii zatwierdzeń.
  </Accordion>
</AccordionGroup>

## OpenClaw jako rejestr klientów MCP

To jest ścieżka `openclaw mcp list`, `show`, `set` i `unset`.

Te polecenia nie udostępniają OpenClaw przez MCP. Zarządzają definicjami serwerów MCP należącymi do OpenClaw w sekcji `mcp.servers` konfiguracji OpenClaw.

Te zapisane definicje są przeznaczone dla środowisk uruchomieniowych, które OpenClaw uruchamia lub konfiguruje później, takich jak osadzony Pi i inne adaptery środowisk uruchomieniowych. OpenClaw przechowuje definicje centralnie, aby te środowiska nie musiały utrzymywać własnych zduplikowanych list serwerów MCP.

<AccordionGroup>
  <Accordion title="Ważne zachowanie">
    - te polecenia tylko odczytują lub zapisują konfigurację OpenClaw
    - nie łączą się z docelowym serwerem MCP
    - nie sprawdzają, czy polecenie, URL lub zdalny transport są teraz osiągalne
    - adaptery środowisk uruchomieniowych decydują w czasie wykonania, które kształty transportu faktycznie obsługują
    - osadzony Pi udostępnia skonfigurowane narzędzia MCP w zwykłych profilach narzędzi `coding` i `messaging`; `minimal` nadal je ukrywa, a `tools.deny: ["bundle-mcp"]` wyłącza je jawnie
    - powiązane z sesją pakietowane środowiska uruchomieniowe MCP są usuwane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10 minut; ustaw `0`, aby wyłączyć), a jednorazowe osadzone uruchomienia czyszczą je po zakończeniu uruchomienia

  </Accordion>
</AccordionGroup>

Adaptery środowisk uruchomieniowych mogą normalizować ten współdzielony rejestr do kształtu oczekiwanego przez ich klienta niższego poziomu. Na przykład osadzony Pi używa bezpośrednio wartości `transport` OpenClaw, podczas gdy Claude Code i Gemini otrzymują natywne dla CLI wartości `type`, takie jak `http`, `sse` lub `stdio`.

### Zapisane definicje serwerów MCP

OpenClaw przechowuje także w konfiguracji lekki rejestr serwerów MCP dla powierzchni, które chcą definicji MCP zarządzanych przez OpenClaw.

Polecenia:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Uwagi:

- `list` sortuje nazwy serwerów.
- `show` bez nazwy wypisuje pełny skonfigurowany obiekt serwerów MCP.
- `set` oczekuje jednej wartości obiektu JSON w wierszu poleceń.
- Użyj `transport: "streamable-http"` dla serwerów MCP Streamable HTTP. `openclaw mcp set` normalizuje także natywne dla CLI `type: "http"` do tego samego kanonicznego kształtu konfiguracji w celu zachowania zgodności.
- `unset` kończy się niepowodzeniem, jeśli wskazany serwer nie istnieje.

Przykłady:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

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
        "transport": "streamable-http"
      }
    }
  }
}
```

### Transport Stdio

Uruchamia lokalny proces potomny i komunikuje się przez stdin/stdout.

| Pole                       | Opis                                          |
| -------------------------- | --------------------------------------------- |
| `command`                  | Plik wykonywalny do uruchomienia (wymagane)   |
| `args`                     | Tablica argumentów wiersza poleceń            |
| `env`                      | Dodatkowe zmienne środowiskowe                |
| `cwd` / `workingDirectory` | Katalog roboczy procesu                       |

<Warning>
**Filtr bezpieczeństwa env dla Stdio**

OpenClaw odrzuca klucze env uruchamiania interpretera, które mogą zmienić sposób startu serwera MCP stdio przed pierwszym RPC, nawet jeśli pojawiają się w bloku `env` serwera. Zablokowane klucze obejmują `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` i podobne zmienne sterujące środowiskiem uruchomieniowym. Uruchamianie odrzuca je błędem konfiguracji, aby nie mogły wstrzyknąć niejawnego preludium, podmienić interpretera ani włączyć debuggera wobec procesu stdio. Zwykłe zmienne env poświadczeń, proxy i specyficzne dla serwera (`GITHUB_TOKEN`, `HTTP_PROXY`, niestandardowe `*_API_KEY` itd.) pozostają bez zmian.

Jeśli Twój serwer MCP rzeczywiście potrzebuje jednej z zablokowanych zmiennych, ustaw ją w procesie hosta gateway zamiast pod `env` serwera stdio.
</Warning>

### Transport SSE / HTTP

Łączy się ze zdalnym serwerem MCP przez HTTP Server-Sent Events.

| Pole                  | Opis                                                           |
| --------------------- | -------------------------------------------------------------- |
| `url`                 | URL HTTP lub HTTPS zdalnego serwera (wymagane)                 |
| `headers`             | Opcjonalna mapa nagłówków HTTP klucz-wartość (na przykład tokeny uwierzytelniania) |
| `connectionTimeoutMs` | Limit czasu połączenia dla serwera w ms (opcjonalne)           |

Przykład:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Wrażliwe wartości w `url` (userinfo) i `headers` są redagowane w logach i danych wyjściowych statusu.

### Transport Streamable HTTP

`streamable-http` to dodatkowa opcja transportu obok `sse` i `stdio`. Używa strumieniowania HTTP do dwukierunkowej komunikacji ze zdalnymi serwerami MCP.

| Pole                  | Opis                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| `url`                 | URL HTTP lub HTTPS zdalnego serwera (wymagane)                                       |
| `transport`           | Ustaw na `"streamable-http"`, aby wybrać ten transport; gdy pominięte, OpenClaw używa `sse` |
| `headers`             | Opcjonalna mapa nagłówków HTTP klucz-wartość (na przykład tokeny uwierzytelniania)   |
| `connectionTimeoutMs` | Limit czasu połączenia dla serwera w ms (opcjonalne)                                 |

Konfiguracja OpenClaw używa `transport: "streamable-http"` jako kanonicznej pisowni. Natywne dla CLI wartości MCP `type: "http"` są akceptowane przy zapisywaniu przez `openclaw mcp set` i naprawiane przez `openclaw doctor --fix` w istniejącej konfiguracji, ale `transport` jest tym, czego osadzony Pi używa bezpośrednio.

Przykład:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Te polecenia zarządzają tylko zapisaną konfiguracją. Nie uruchamiają mostu kanału, nie otwierają aktywnej sesji klienta MCP ani nie dowodzą, że docelowy serwer jest osiągalny.
</Note>

## Obecne ograniczenia

Ta strona dokumentuje most w postaci dostarczanej obecnie.

Obecne ograniczenia:

- wykrywanie konwersacji zależy od istniejących metadanych tras sesji Gateway
- brak ogólnego protokołu push poza adapterem specyficznym dla Claude
- nie ma jeszcze narzędzi do edycji wiadomości ani reakcji
- transport HTTP/SSE/streamable-http łączy się z jednym zdalnym serwerem; nie ma jeszcze multipleksowanego upstreamu
- `permissions_list_open` obejmuje tylko zatwierdzenia zaobserwowane, gdy most jest połączony

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Plugins](/pl/cli/plugins)
