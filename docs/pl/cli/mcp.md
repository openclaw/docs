---
read_when:
    - Łączenie Codex, Claude Code lub innego klienta MCP z kanałami opartymi na OpenClaw
    - Uruchamianie `openclaw mcp serve`
    - Zarządzanie zapisanymi przez OpenClaw definicjami serwerów MCP
sidebarTitle: MCP
summary: Udostępnij konwersacje kanałowe OpenClaw przez MCP i zarządzaj zapisanymi definicjami serwerów MCP
title: MCP
x-i18n:
    generated_at: "2026-04-26T11:26:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e003d974a7ae989f240d7608470ddcf2f37e20ca342cf4569c14677dc6fc1d8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` ma dwa zadania:

- uruchamiać OpenClaw jako serwer MCP za pomocą `openclaw mcp serve`
- zarządzać należącymi do OpenClaw definicjami wychodzących serwerów MCP za pomocą `list`, `show`, `set` i `unset`

Innymi słowy:

- `serve` oznacza, że OpenClaw działa jako serwer MCP
- `list` / `show` / `set` / `unset` oznacza, że OpenClaw działa jako rejestr po stronie klienta MCP dla innych serwerów MCP, z których jego runtime’y mogą później korzystać

Użyj [`openclaw acp`](/pl/cli/acp), gdy OpenClaw ma sam hostować sesję harnessu do kodowania i kierować ten runtime przez ACP.

## OpenClaw jako serwer MCP

To jest ścieżka `openclaw mcp serve`.

### Kiedy używać `serve`

Użyj `openclaw mcp serve`, gdy:

- Codex, Claude Code lub inny klient MCP ma rozmawiać bezpośrednio z konwersacjami kanałowymi opartymi na OpenClaw
- masz już lokalny lub zdalny Gateway OpenClaw z routowanymi sesjami
- chcesz mieć jeden serwer MCP, który działa na backendach kanałów OpenClaw, zamiast uruchamiać osobne mosty dla każdego kanału

Zamiast tego użyj [`openclaw acp`](/pl/cli/acp), gdy OpenClaw ma sam hostować runtime kodowania i utrzymywać sesję agenta wewnątrz OpenClaw.

### Jak to działa

`openclaw mcp serve` uruchamia serwer stdio MCP. Klient MCP jest właścicielem tego procesu. Dopóki klient utrzymuje otwartą sesję stdio, most łączy się z lokalnym lub zdalnym Gateway OpenClaw przez WebSocket i udostępnia routowane konwersacje kanałowe przez MCP.

<Steps>
  <Step title="Klient uruchamia most">
    Klient MCP uruchamia `openclaw mcp serve`.
  </Step>
  <Step title="Most łączy się z Gateway">
    Most łączy się z Gateway OpenClaw przez WebSocket.
  </Step>
  <Step title="Sesje stają się konwersacjami MCP">
    Routowane sesje stają się konwersacjami MCP oraz narzędziami transkryptu/historii.
  </Step>
  <Step title="Kolejka zdarzeń na żywo">
    Zdarzenia na żywo są kolejkowane w pamięci, gdy most jest połączony.
  </Step>
  <Step title="Opcjonalne powiadomienia push Claude">
    Jeśli włączony jest tryb kanału Claude, ta sama sesja może też odbierać powiadomienia push specyficzne dla Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Ważne zachowanie">
    - stan kolejki na żywo zaczyna się w momencie połączenia mostu
    - starsza historia transkryptu jest odczytywana przez `messages_read`
    - powiadomienia push Claude istnieją tylko wtedy, gdy sesja MCP jest aktywna
    - gdy klient się rozłączy, most kończy działanie, a kolejka na żywo znika
    - jednorazowe punkty wejścia agenta, takie jak `openclaw agent` i `openclaw infer model run`, wycofują wszelkie dołączone runtime’y MCP, które otwierają, gdy odpowiedź zostanie ukończona, dzięki czemu powtarzane uruchomienia skryptowe nie gromadzą potomnych procesów stdio MCP
    - serwery stdio MCP uruchamiane przez OpenClaw (dołączone lub skonfigurowane przez użytkownika) są zamykane jako drzewo procesów podczas wyłączania, więc podprocesy potomne uruchomione przez serwer nie przetrwają po wyjściu nadrzędnego klienta stdio
    - usunięcie lub zresetowanie sesji zwalnia klientów MCP tej sesji przez współdzieloną ścieżkę czyszczenia runtime’u, więc nie pozostają żadne wiszące połączenia stdio powiązane z usuniętą sesją

  </Accordion>
</AccordionGroup>

### Wybierz tryb klienta

Użyj tego samego mostu na dwa różne sposoby:

<Tabs>
  <Tab title="Ogólni klienci MCP">
    Tylko standardowe narzędzia MCP. Użyj `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` oraz narzędzi zatwierdzania.
  </Tab>
  <Tab title="Claude Code">
    Standardowe narzędzia MCP plus adapter kanału specyficzny dla Claude. Włącz `--claude-channel-mode on` lub pozostaw domyślne `auto`.
  </Tab>
</Tabs>

<Note>
Obecnie `auto` zachowuje się tak samo jak `on`. Nie ma jeszcze wykrywania możliwości klienta.
</Note>

### Co udostępnia `serve`

Most używa istniejących metadanych routingu sesji Gateway do udostępniania konwersacji opartych na kanałach. Konwersacja pojawia się wtedy, gdy OpenClaw ma już stan sesji ze znaną trasą, taką jak:

- `channel`
- metadane odbiorcy lub celu
- opcjonalne `accountId`
- opcjonalne `threadId`

Daje to klientom MCP jedno miejsce do:

- wyświetlania listy ostatnich routowanych konwersacji
- odczytywania ostatniej historii transkryptu
- oczekiwania na nowe zdarzenia przychodzące
- wysyłania odpowiedzi z powrotem tą samą trasą
- przeglądania żądań zatwierdzenia, które przychodzą, gdy most jest połączony

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
  <Tab title="Tryb szczegółowy / Claude wyłączony">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Narzędzia mostu

Bieżący most udostępnia te narzędzia MCP:

<AccordionGroup>
  <Accordion title="conversations_list">
    Wyświetla listę ostatnich konwersacji opartych na sesjach, które mają już metadane routingu w stanie sesji Gateway.

    Przydatne filtry:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Zwraca jedną konwersację według `session_key`.
  </Accordion>
  <Accordion title="messages_read">
    Odczytuje ostatnie wiadomości transkryptu dla jednej konwersacji opartej na sesji.
  </Accordion>
  <Accordion title="attachments_fetch">
    Wyodrębnia bloki treści wiadomości nietekstowych z jednej wiadomości transkryptu. To widok metadanych treści transkryptu, a nie samodzielny trwały magazyn blobów załączników.
  </Accordion>
  <Accordion title="events_poll">
    Odczytuje zakolejkowane zdarzenia na żywo od numerycznego kursora.
  </Accordion>
  <Accordion title="events_wait">
    Wykonuje długie odpytywanie do momentu nadejścia kolejnego pasującego zdarzenia z kolejki lub upłynięcia limitu czasu.

    Użyj tego, gdy ogólny klient MCP potrzebuje dostarczania w czasie zbliżonym do rzeczywistego bez protokołu push specyficznego dla Claude.

  </Accordion>
  <Accordion title="messages_send">
    Wysyła tekst z powrotem tą samą trasą, która została już zapisana w sesji.

    Bieżące zachowanie:

    - wymaga istniejącej trasy konwersacji
    - używa kanału sesji, odbiorcy, identyfikatora konta i identyfikatora wątku
    - wysyła tylko tekst

  </Accordion>
  <Accordion title="permissions_list_open">
    Wyświetla listę oczekujących żądań zatwierdzenia exec/plugin, które most zaobserwował od momentu połączenia z Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Rozstrzyga jedno oczekujące żądanie zatwierdzenia exec/plugin za pomocą:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Model zdarzeń

Most utrzymuje kolejkę zdarzeń w pamięci podczas połączenia.

Bieżące typy zdarzeń:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- kolejka działa tylko na żywo; zaczyna się w momencie uruchomienia mostu MCP
- `events_poll` i `events_wait` same z siebie nie odtwarzają starszej historii Gateway
- trwały backlog należy odczytywać przez `messages_read`

</Warning>

### Powiadomienia kanału Claude

Most może także udostępniać powiadomienia kanałowe specyficzne dla Claude. To odpowiednik adaptera kanału Claude Code w OpenClaw: standardowe narzędzia MCP pozostają dostępne, ale przychodzące wiadomości na żywo mogą też docierać jako powiadomienia MCP specyficzne dla Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: tylko standardowe narzędzia MCP.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: włącza powiadomienia kanałowe Claude.
  </Tab>
  <Tab title="auto (domyślnie)">
    `--claude-channel-mode auto`: obecne ustawienie domyślne; to samo zachowanie mostu co `on`.
  </Tab>
</Tabs>

Gdy włączony jest tryb kanału Claude, serwer ogłasza eksperymentalne możliwości Claude i może emitować:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Bieżące zachowanie mostu:

- przychodzące wiadomości transkryptu `user` są przekazywane jako `notifications/claude/channel`
- żądania uprawnień Claude odebrane przez MCP są śledzone w pamięci
- jeśli powiązana konwersacja wyśle później `yes abcde` lub `no abcde`, most konwertuje to na `notifications/claude/channel/permission`
- te powiadomienia działają tylko w aktywnej sesji; jeśli klient MCP się rozłączy, nie ma celu dla push

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

W przypadku większości ogólnych klientów MCP zacznij od standardowej powierzchni narzędzi i ignoruj tryb Claude. Włącz tryb Claude tylko dla klientów, które rzeczywiście rozumieją metody powiadomień specyficzne dla Claude.

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
Gdy to możliwe, preferuj `--token-file` lub `--password-file` zamiast wpisywania sekretów inline.
</Tip>

### Bezpieczeństwo i granica zaufania

Most nie wymyśla routingu. Udostępnia tylko konwersacje, które Gateway już potrafi routować.

To oznacza, że:

- allowlisty nadawców, pairing i zaufanie na poziomie kanału nadal należą do bazowej konfiguracji kanału OpenClaw
- `messages_send` może odpowiadać tylko przez istniejącą zapisaną trasę
- stan zatwierdzeń jest aktywny i przechowywany tylko w pamięci dla bieżącej sesji mostu
- uwierzytelnianie mostu powinno używać tych samych mechanizmów tokenu lub hasła Gateway, którym ufałbyś w przypadku dowolnego innego zdalnego klienta Gateway

Jeśli konwersacja nie pojawia się w `conversations_list`, zwykłą przyczyną nie jest konfiguracja MCP. Przyczyną są brakujące lub niepełne metadane routingu w bazowej sesji Gateway.

### Testowanie

OpenClaw dostarcza deterministyczny smoke Docker dla tego mostu:

```bash
pnpm test:docker:mcp-channels
```

Ten smoke:

- uruchamia kontener Gateway z zasianymi danymi
- uruchamia drugi kontener, który uruchamia `openclaw mcp serve`
- weryfikuje wykrywanie konwersacji, odczyty transkryptu, odczyty metadanych załączników, zachowanie kolejki zdarzeń na żywo i routing wysyłek wychodzących
- waliduje powiadomienia w stylu Claude dla kanału i uprawnień przez rzeczywisty most stdio MCP

To najszybszy sposób na udowodnienie, że most działa, bez podłączania do testu prawdziwego konta Telegram, Discord lub iMessage.

Szerszy kontekst testowania znajdziesz w [Testing](/pl/help/testing).

### Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Nie zwrócono żadnych konwersacji">
    Zwykle oznacza to, że sesja Gateway nie jest jeszcze routowalna. Potwierdź, że bazowa sesja ma zapisane metadane trasy kanału/dostawcy, odbiorcy oraz opcjonalne metadane konta/wątku.
  </Accordion>
  <Accordion title="events_poll lub events_wait pomija starsze wiadomości">
    To oczekiwane. Kolejka na żywo zaczyna się w momencie połączenia mostu. Odczytaj starszą historię transkryptu przez `messages_read`.
  </Accordion>
  <Accordion title="Powiadomienia Claude się nie pojawiają">
    Sprawdź wszystkie poniższe elementy:

    - klient utrzymywał otwartą sesję stdio MCP
    - `--claude-channel-mode` ma wartość `on` lub `auto`
    - klient rzeczywiście rozumie metody powiadomień specyficzne dla Claude
    - wiadomość przychodząca pojawiła się po połączeniu mostu

  </Accordion>
  <Accordion title="Brak zatwierdzeń">
    `permissions_list_open` pokazuje tylko żądania zatwierdzenia zaobserwowane podczas połączenia mostu. To nie jest trwałe API historii zatwierdzeń.
  </Accordion>
</AccordionGroup>

## OpenClaw jako rejestr klienta MCP

To jest ścieżka `openclaw mcp list`, `show`, `set` i `unset`.

Te polecenia nie udostępniają OpenClaw przez MCP. Zarządzają należącymi do OpenClaw definicjami serwerów MCP w `mcp.servers` w konfiguracji OpenClaw.

Te zapisane definicje są przeznaczone dla runtime’ów, które OpenClaw uruchamia lub konfiguruje później, takich jak osadzone Pi i inne adaptery runtime. OpenClaw przechowuje definicje centralnie, aby te runtime’y nie musiały utrzymywać własnych zduplikowanych list serwerów MCP.

<AccordionGroup>
  <Accordion title="Ważne zachowanie">
    - te polecenia tylko odczytują lub zapisują konfigurację OpenClaw
    - nie łączą się z docelowym serwerem MCP
    - nie sprawdzają, czy polecenie, URL lub zdalny transport są w tej chwili osiągalne
    - adaptery runtime decydują podczas wykonywania, które kształty transportu faktycznie obsługują
    - osadzone Pi udostępnia skonfigurowane narzędzia MCP w normalnych profilach narzędzi `coding` i `messaging`; `minimal` nadal je ukrywa, a `tools.deny: ["bundle-mcp"]` wyłącza je jawnie
    - dołączone runtime’y MCP o zakresie sesji są zbierane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10 minut; ustaw `0`, aby wyłączyć), a jednorazowe osadzone uruchomienia czyszczą je po zakończeniu działania

  </Accordion>
</AccordionGroup>

Adaptery runtime mogą normalizować ten współdzielony rejestr do postaci oczekiwanej przez ich klienta downstream. Na przykład osadzone Pi używa bezpośrednio wartości `transport` OpenClaw, podczas gdy Claude Code i Gemini otrzymują natywne dla CLI wartości `type`, takie jak `http`, `sse` lub `stdio`.

### Zapisane definicje serwerów MCP

OpenClaw przechowuje także lekki rejestr serwerów MCP w konfiguracji dla powierzchni, które chcą definicji MCP zarządzanych przez OpenClaw.

Polecenia:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Uwagi:

- `list` sortuje nazwy serwerów.
- `show` bez nazwy wypisuje cały skonfigurowany obiekt serwerów MCP.
- `set` oczekuje jednej wartości obiektu JSON w wierszu poleceń.
- `unset` kończy się błędem, jeśli wskazany serwer nie istnieje.

Przykłady:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
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
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Transport stdio

Uruchamia lokalny proces potomny i komunikuje się przez stdin/stdout.

| Field                      | Opis                              |
| -------------------------- | --------------------------------- |
| `command`                  | Plik wykonywalny do uruchomienia (wymagany) |
| `args`                     | Tablica argumentów wiersza poleceń |
| `env`                      | Dodatkowe zmienne środowiskowe    |
| `cwd` / `workingDirectory` | Katalog roboczy procesu           |

<Warning>
**Filtr bezpieczeństwa env dla stdio**

OpenClaw odrzuca klucze env uruchamiania interpretera, które mogą zmienić sposób uruchamiania serwera stdio MCP przed pierwszym RPC, nawet jeśli pojawiają się w bloku `env` serwera. Zablokowane klucze obejmują `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` i podobne zmienne sterujące runtime’em. Uruchomienie odrzuca je z błędem konfiguracji, aby nie mogły wstrzyknąć niejawnego preludium, podmienić interpretera ani włączyć debuggera względem procesu stdio. Zwykłe poświadczenia, proxy i zmienne env specyficzne dla serwera (`GITHUB_TOKEN`, `HTTP_PROXY`, niestandardowe `*_API_KEY` itd.) pozostają bez zmian.

Jeśli Twój serwer MCP rzeczywiście potrzebuje jednej z zablokowanych zmiennych, ustaw ją w procesie hosta Gateway zamiast w `env` serwera stdio.
</Warning>

### Transport SSE / HTTP

Łączy się ze zdalnym serwerem MCP przez HTTP Server-Sent Events.

| Field                 | Opis                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | URL HTTP lub HTTPS zdalnego serwera (wymagany)                   |
| `headers`             | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokeny uwierzytelniania) |
| `connectionTimeoutMs` | Limit czasu połączenia per serwer w ms (opcjonalny)              |

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

Wrażliwe wartości w `url` (userinfo) i `headers` są maskowane w logach i danych wyjściowych statusu.

### Transport streamable HTTP

`streamable-http` to dodatkowa opcja transportu obok `sse` i `stdio`. Używa strumieniowania HTTP do dwukierunkowej komunikacji ze zdalnymi serwerami MCP.

| Field                 | Opis                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| `url`                 | URL HTTP lub HTTPS zdalnego serwera (wymagany)                                       |
| `transport`           | Ustaw na `"streamable-http"`, aby wybrać ten transport; jeśli pominięto, OpenClaw używa `sse` |
| `headers`             | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokeny uwierzytelniania)  |
| `connectionTimeoutMs` | Limit czasu połączenia per serwer w ms (opcjonalny)                                  |

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
Te polecenia zarządzają tylko zapisaną konfiguracją. Nie uruchamiają mostu kanałowego, nie otwierają aktywnej sesji klienta MCP ani nie dowodzą, że docelowy serwer jest osiągalny.
</Note>

## Bieżące ograniczenia

Ta strona dokumentuje most w postaci dostarczanej obecnie.

Bieżące ograniczenia:

- wykrywanie konwersacji zależy od istniejących metadanych routingu sesji Gateway
- brak ogólnego protokołu push poza adapterem specyficznym dla Claude
- brak narzędzi do edycji wiadomości lub reakcji
- transport HTTP/SSE/streamable-http łączy się z pojedynczym zdalnym serwerem; brak jeszcze upstreamu multipleksowanego
- `permissions_list_open` obejmuje tylko zatwierdzenia zaobserwowane podczas połączenia mostu

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Pluginy](/pl/cli/plugins)
