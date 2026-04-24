---
read_when:
    - Łączenie Codex, Claude Code lub innego klienta MCP z kanałami opartymi na OpenClaw
    - Uruchamianie `openclaw mcp serve`
    - Zarządzanie zapisanymi przez OpenClaw definicjami serwerów MCP
summary: Udostępniaj konwersacje kanałowe OpenClaw przez MCP i zarządzaj zapisanymi definicjami serwerów MCP
title: MCP
x-i18n:
    generated_at: "2026-04-24T09:03:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9df42ebc547f07698f84888d8cd6125340d0f0e02974a965670844589e1fbf8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` ma dwa zadania:

- uruchamianie OpenClaw jako serwera MCP za pomocą `openclaw mcp serve`
- zarządzanie definicjami wychodzących serwerów MCP należących do OpenClaw za pomocą `list`, `show`,
  `set` i `unset`

Innymi słowy:

- `serve` oznacza, że OpenClaw działa jako serwer MCP
- `list` / `show` / `set` / `unset` oznacza, że OpenClaw działa jako rejestr
  po stronie klienta MCP dla innych serwerów MCP, z których jego środowiska uruchomieniowe mogą skorzystać później

Użyj [`openclaw acp`](/pl/cli/acp), gdy OpenClaw ma sam hostować sesję harness
kodowania i routować to środowisko przez ACP.

## OpenClaw jako serwer MCP

To jest ścieżka `openclaw mcp serve`.

## Kiedy używać `serve`

Użyj `openclaw mcp serve`, gdy:

- Codex, Claude Code lub inny klient MCP ma komunikować się bezpośrednio z
  konwersacjami kanałowymi opartymi na OpenClaw
- masz już lokalny lub zdalny OpenClaw Gateway z routowanymi sesjami
- chcesz jednego serwera MCP, który działa w różnych backendach kanałów OpenClaw,
  zamiast uruchamiać oddzielne mosty dla każdego kanału

Zamiast tego użyj [`openclaw acp`](/pl/cli/acp), gdy OpenClaw ma hostować środowisko
kodowania samodzielnie i utrzymywać sesję agenta wewnątrz OpenClaw.

## Jak to działa

`openclaw mcp serve` uruchamia serwer MCP przez stdio. Klient MCP jest właścicielem
tego procesu. Dopóki klient utrzymuje otwartą sesję stdio, most łączy się z
lokalnym lub zdalnym OpenClaw Gateway przez WebSocket i udostępnia routowane
konwersacje kanałowe przez MCP.

Cykl życia:

1. klient MCP uruchamia `openclaw mcp serve`
2. most łączy się z Gateway
3. routowane sesje stają się konwersacjami MCP i narzędziami transkryptu/historii
4. zdarzenia na żywo są kolejkowane w pamięci, gdy most jest połączony
5. jeśli tryb kanału Claude jest włączony, ta sama sesja może także odbierać
   powiadomienia push specyficzne dla Claude

Ważne zachowanie:

- stan kolejki na żywo zaczyna się w chwili połączenia mostu
- starsza historia transkryptu jest odczytywana za pomocą `messages_read`
- powiadomienia push Claude istnieją tylko wtedy, gdy sesja MCP jest aktywna
- gdy klient się rozłącza, most kończy działanie, a kolejka na żywo znika
- serwery stdio MCP uruchomione przez OpenClaw (dołączone lub skonfigurowane przez użytkownika) są zamykane
  jako drzewo procesów podczas wyłączania, więc podrzędne podprocesy uruchomione przez
  serwer nie przetrwają po zakończeniu procesu nadrzędnego klienta stdio
- usunięcie lub zresetowanie sesji powoduje zwolnienie klientów MCP tej sesji przez
  współdzieloną ścieżkę czyszczenia środowiska uruchomieniowego, więc nie pozostają żadne
  zalegające połączenia stdio powiązane z usuniętą sesją

## Wybór trybu klienta

Tego samego mostu można używać na dwa sposoby:

- Ogólni klienci MCP: tylko standardowe narzędzia MCP. Używaj `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` oraz
  narzędzi zatwierdzania.
- Claude Code: standardowe narzędzia MCP plus adapter kanału specyficzny dla Claude.
  Włącz `--claude-channel-mode on` lub pozostaw domyślne `auto`.

Obecnie `auto` zachowuje się tak samo jak `on`. Nie ma jeszcze wykrywania
możliwości klienta.

## Co udostępnia `serve`

Most używa istniejących metadanych trasy sesji Gateway do udostępniania
konwersacji opartych na kanałach. Konwersacja pojawia się, gdy OpenClaw ma już
stan sesji ze znaną trasą, taką jak:

- `channel`
- metadane odbiorcy lub miejsca docelowego
- opcjonalne `accountId`
- opcjonalne `threadId`

Dzięki temu klienci MCP mają jedno miejsce do:

- listowania ostatnich routowanych konwersacji
- odczytu ostatniej historii transkryptu
- oczekiwania na nowe zdarzenia przychodzące
- wysyłania odpowiedzi z powrotem przez tę samą trasę
- przeglądania żądań zatwierdzenia, które napłynęły podczas połączenia mostu

## Użycie

```bash
# Local Gateway
openclaw mcp serve

# Remote Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Remote Gateway with password auth
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Enable verbose bridge logs
openclaw mcp serve --verbose

# Disable Claude-specific push notifications
openclaw mcp serve --claude-channel-mode off
```

## Narzędzia mostu

Obecnie most udostępnia następujące narzędzia MCP:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Wyświetla ostatnie konwersacje oparte na sesjach, które mają już metadane trasy
w stanie sesji Gateway.

Przydatne filtry:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Zwraca jedną konwersację według `session_key`.

### `messages_read`

Odczytuje ostatnie wiadomości transkryptu dla jednej konwersacji opartej na sesji.

### `attachments_fetch`

Wyodrębnia bloki nietekstowej zawartości wiadomości z jednego komunikatu transkryptu. Jest to
widok metadanych zawartości transkryptu, a nie samodzielny trwały magazyn blobów załączników.

### `events_poll`

Odczytuje zakolejkowane zdarzenia na żywo od podanego kursora numerycznego.

### `events_wait`

Długo odpyta, aż nadejdzie kolejne pasujące zakolejkowane zdarzenie lub upłynie limit czasu.

Użyj tego, gdy ogólny klient MCP potrzebuje dostarczania zbliżonego do czasu rzeczywistego bez
protokołu push specyficznego dla Claude.

### `messages_send`

Wysyła tekst z powrotem przez tę samą trasę już zapisaną w sesji.

Obecne zachowanie:

- wymaga istniejącej trasy konwersacji
- używa kanału sesji, odbiorcy, identyfikatora konta i identyfikatora wątku
- wysyła tylko tekst

### `permissions_list_open`

Wyświetla oczekujące żądania zatwierdzenia exec/Plugin, które most zaobserwował od momentu
połączenia z Gateway.

### `permissions_respond`

Rozwiązuje jedno oczekujące żądanie zatwierdzenia exec/Plugin przy użyciu:

- `allow-once`
- `allow-always`
- `deny`

## Model zdarzeń

Most utrzymuje kolejkę zdarzeń w pamięci, gdy jest połączony.

Obecne typy zdarzeń:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Ważne ograniczenia:

- kolejka dotyczy tylko sesji na żywo; zaczyna działać, gdy most MCP zostanie uruchomiony
- `events_poll` i `events_wait` same z siebie nie odtwarzają starszej historii Gateway
- trwały backlog należy odczytywać za pomocą `messages_read`

## Powiadomienia kanału Claude

Most może także udostępniać powiadomienia kanału specyficzne dla Claude. To
odpowiednik adaptera kanału Claude Code w OpenClaw: standardowe narzędzia MCP
pozostają dostępne, ale wiadomości przychodzące na żywo mogą także przychodzić jako
powiadomienia MCP specyficzne dla Claude.

Flagi:

- `--claude-channel-mode off`: tylko standardowe narzędzia MCP
- `--claude-channel-mode on`: włącza powiadomienia kanału Claude
- `--claude-channel-mode auto`: obecna wartość domyślna; takie samo zachowanie mostu jak `on`

Gdy tryb kanału Claude jest włączony, serwer ogłasza eksperymentalne możliwości Claude
i może emitować:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Obecne zachowanie mostu:

- przychodzące wiadomości transkryptu `user` są przekazywane jako
  `notifications/claude/channel`
- żądania uprawnień Claude odebrane przez MCP są śledzone w pamięci
- jeśli powiązana konwersacja później wyśle `yes abcde` lub `no abcde`, most
  konwertuje to na `notifications/claude/channel/permission`
- te powiadomienia dotyczą tylko aktywnej sesji; jeśli klient MCP się rozłączy,
  nie ma celu push

To jest celowo specyficzne dla klienta. Ogólni klienci MCP powinni polegać na
standardowych narzędziach odpytywania.

## Konfiguracja klienta MCP

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

W przypadku większości ogólnych klientów MCP zacznij od standardowej powierzchni narzędzi i ignoruj
tryb Claude. Włącz tryb Claude tylko dla klientów, którzy faktycznie rozumieją
metody powiadomień specyficzne dla Claude.

## Opcje

`openclaw mcp serve` obsługuje:

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--token-file <path>`: odczytaj token z pliku
- `--password <password>`: hasło Gateway
- `--password-file <path>`: odczytaj hasło z pliku
- `--claude-channel-mode <auto|on|off>`: tryb powiadomień Claude
- `-v`, `--verbose`: szczegółowe logi na stderr

Jeśli to możliwe, preferuj `--token-file` lub `--password-file` zamiast sekretów inline.

## Bezpieczeństwo i granica zaufania

Most nie wymyśla routingu. Udostępnia tylko konwersacje, które Gateway
już potrafi routować.

Oznacza to, że:

- allowlisty nadawców, Pairing i zaufanie na poziomie kanału nadal należą do
  bazowej konfiguracji kanału OpenClaw
- `messages_send` może odpowiadać tylko przez istniejącą zapisaną trasę
- stan zatwierdzeń jest aktywny i przechowywany tylko w pamięci dla bieżącej sesji mostu
- uwierzytelnianie mostu powinno używać tych samych mechanizmów tokenu lub hasła Gateway, którym
  zaufałbyś dla każdego innego zdalnego klienta Gateway

Jeśli konwersacji brakuje w `conversations_list`, zwykłą przyczyną nie jest
konfiguracja MCP. Chodzi o brakujące lub niepełne metadane trasy w bazowej
sesji Gateway.

## Testowanie

OpenClaw dostarcza deterministyczny smoke Docker dla tego mostu:

```bash
pnpm test:docker:mcp-channels
```

Ten smoke:

- uruchamia seedowany kontener Gateway
- uruchamia drugi kontener, który uruchamia `openclaw mcp serve`
- weryfikuje wykrywanie konwersacji, odczyt transkryptów, odczyt metadanych załączników,
  zachowanie kolejki zdarzeń na żywo i routing wysyłki wychodzącej
- waliduje powiadomienia kanału i uprawnień w stylu Claude przez rzeczywisty
  most stdio MCP

To najszybszy sposób, aby udowodnić, że most działa bez podłączania do testu
prawdziwego konta Telegram, Discord lub iMessage.

Szerszy kontekst testowania znajdziesz w [Testing](/pl/help/testing).

## Rozwiązywanie problemów

### Brak zwróconych konwersacji

Zwykle oznacza to, że sesja Gateway nie ma jeszcze trasy. Potwierdź, że
bazowa sesja ma zapisane metadane trasy kanału/providera, odbiorcy oraz opcjonalnego
konta/wątku.

### `events_poll` lub `events_wait` pomija starsze wiadomości

To oczekiwane. Kolejka na żywo zaczyna działać, gdy most się połączy. Odczytuj starszą
historię transkryptu za pomocą `messages_read`.

### Powiadomienia Claude się nie pojawiają

Sprawdź wszystkie poniższe elementy:

- klient utrzymuje otwartą sesję stdio MCP
- `--claude-channel-mode` ma wartość `on` lub `auto`
- klient faktycznie rozumie metody powiadomień specyficzne dla Claude
- wiadomość przychodząca pojawiła się po połączeniu mostu

### Brakuje zatwierdzeń

`permissions_list_open` pokazuje tylko żądania zatwierdzenia zaobserwowane w czasie,
gdy most był połączony. Nie jest to trwałe API historii zatwierdzeń.

## OpenClaw jako rejestr klienta MCP

To jest ścieżka `openclaw mcp list`, `show`, `set` i `unset`.

Te polecenia nie udostępniają OpenClaw przez MCP. Zarządzają definicjami serwerów MCP należącymi do OpenClaw
w `mcp.servers` w konfiguracji OpenClaw.

Te zapisane definicje są przeznaczone dla środowisk uruchomieniowych, które OpenClaw uruchamia lub konfiguruje
później, takich jak osadzony Pi i inne adaptery środowiska uruchomieniowego. OpenClaw przechowuje definicje centralnie,
dzięki czemu te środowiska nie muszą utrzymywać własnych zduplikowanych
list serwerów MCP.

Ważne zachowanie:

- te polecenia tylko odczytują lub zapisują konfigurację OpenClaw
- nie łączą się z docelowym serwerem MCP
- nie weryfikują, czy polecenie, URL lub transport zdalny jest
  aktualnie osiągalny
- adaptery środowiska uruchomieniowego decydują, jakie kształty transportu faktycznie obsługują
  w czasie wykonania
- osadzony Pi udostępnia skonfigurowane narzędzia MCP w zwykłych profilach narzędzi `coding` i `messaging`;
  `minimal` nadal je ukrywa, a `tools.deny: ["bundle-mcp"]` wyłącza je jawnie

## Zapisane definicje serwerów MCP

OpenClaw przechowuje także lekki rejestr serwerów MCP w konfiguracji dla powierzchni,
które chcą definicji MCP zarządzanych przez OpenClaw.

Polecenia:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Uwagi:

- `list` sortuje nazwy serwerów.
- `show` bez nazwy wypisuje pełny skonfigurowany obiekt serwerów MCP.
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

Uruchamia lokalny proces podrzędny i komunikuje się przez stdin/stdout.

| Pole                       | Opis                              |
| -------------------------- | --------------------------------- |
| `command`                  | Plik wykonywalny do uruchomienia (wymagany) |
| `args`                     | Tablica argumentów wiersza poleceń |
| `env`                      | Dodatkowe zmienne środowiskowe    |
| `cwd` / `workingDirectory` | Katalog roboczy procesu           |

#### Filtr bezpieczeństwa env dla stdio

OpenClaw odrzuca klucze env uruchamiania interpretera, które mogą zmienić sposób uruchamiania serwera stdio MCP przed pierwszym RPC, nawet jeśli pojawiają się w bloku `env` serwera. Zablokowane klucze obejmują `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` oraz podobne zmienne sterujące środowiskiem uruchomieniowym. Uruchomienie jest odrzucane z błędem konfiguracji, aby nie mogły wstrzyknąć niejawnego preludium, podmienić interpretera ani włączyć debuggera dla procesu stdio. Zwykłe poświadczenia, proxy i zmienne env specyficzne dla serwera (`GITHUB_TOKEN`, `HTTP_PROXY`, niestandardowe `*_API_KEY` itp.) pozostają bez zmian.

Jeśli Twój serwer MCP rzeczywiście wymaga jednej z zablokowanych zmiennych, ustaw ją w procesie hosta Gateway, a nie w `env` serwera stdio.

### Transport SSE / HTTP

Łączy się ze zdalnym serwerem MCP przez HTTP Server-Sent Events.

| Pole                  | Opis                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | URL HTTP lub HTTPS zdalnego serwera (wymagany)                   |
| `headers`             | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokenów auth) |
| `connectionTimeoutMs` | Limit czasu połączenia per server w ms (opcjonalnie)             |

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

Wrażliwe wartości w `url` (userinfo) i `headers` są maskowane w logach i
danych wyjściowych statusu.

### Transport Streamable HTTP

`streamable-http` to dodatkowa opcja transportu obok `sse` i `stdio`. Używa strumieniowania HTTP do dwukierunkowej komunikacji ze zdalnymi serwerami MCP.

| Pole                  | Opis                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP lub HTTPS zdalnego serwera (wymagany)                                               |
| `transport`           | Ustaw `"streamable-http"`, aby wybrać ten transport; jeśli pominięte, OpenClaw używa `sse` |
| `headers`             | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokenów auth)                      |
| `connectionTimeoutMs` | Limit czasu połączenia per server w ms (opcjonalnie)                                         |

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

Te polecenia zarządzają tylko zapisaną konfiguracją. Nie uruchamiają mostu kanałowego,
nie otwierają aktywnej sesji klienta MCP ani nie potwierdzają, że docelowy serwer jest osiągalny.

## Obecne ograniczenia

Ta strona dokumentuje most w postaci dostarczanej obecnie.

Obecne ograniczenia:

- wykrywanie konwersacji zależy od istniejących metadanych trasy sesji Gateway
- brak ogólnego protokołu push poza adapterem specyficznym dla Claude
- brak narzędzi do edycji wiadomości lub reakcji
- transport HTTP/SSE/streamable-http łączy się z pojedynczym zdalnym serwerem; brak jeszcze multipleksowanego upstream
- `permissions_list_open` obejmuje tylko zatwierdzenia zaobserwowane, gdy most był
  połączony

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Plugins](/pl/cli/plugins)
