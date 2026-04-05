---
read_when:
    - Łączenie Codex, Claude Code lub innego klienta MCP z kanałami obsługiwanymi przez OpenClaw
    - Uruchamianie `openclaw mcp serve`
    - Zarządzanie definicjami serwerów MCP zapisanymi przez OpenClaw
summary: Udostępniaj rozmowy kanałów OpenClaw przez MCP i zarządzaj zapisanymi definicjami serwerów MCP
title: mcp
x-i18n:
    generated_at: "2026-04-05T13:49:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: b35de9e14f96666eeca2f93c06cb214e691152f911d45ee778efe9cf5bf96cc2
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` ma dwa zadania:

- uruchamiać OpenClaw jako serwer MCP za pomocą `openclaw mcp serve`
- zarządzać wychodzącymi definicjami serwerów MCP należącymi do OpenClaw za pomocą `list`, `show`,
  `set` i `unset`

Innymi słowy:

- `serve` oznacza, że OpenClaw działa jako serwer MCP
- `list` / `show` / `set` / `unset` oznacza, że OpenClaw działa jako rejestr po stronie klienta MCP
  dla innych serwerów MCP, z których jego środowiska uruchomieniowe mogą skorzystać później

Użyj [`openclaw acp`](/cli/acp), gdy OpenClaw ma sam hostować sesję
środowiska programistycznego i kierować to środowisko przez ACP.

## OpenClaw jako serwer MCP

To jest ścieżka `openclaw mcp serve`.

## Kiedy używać `serve`

Użyj `openclaw mcp serve`, gdy:

- Codex, Claude Code lub inny klient MCP ma komunikować się bezpośrednio z
  rozmowami kanałów obsługiwanych przez OpenClaw
- masz już lokalną lub zdalną bramę OpenClaw Gateway z kierowanymi sesjami
- chcesz mieć jeden serwer MCP, który działa w różnych backendach kanałów OpenClaw,
  zamiast uruchamiać osobne mosty dla każdego kanału

Zamiast tego użyj [`openclaw acp`](/cli/acp), gdy OpenClaw ma sam hostować
środowisko uruchomieniowe programowania i utrzymywać sesję agenta wewnątrz OpenClaw.

## Jak to działa

`openclaw mcp serve` uruchamia serwer stdio MCP. Klient MCP zarządza tym
procesem. Dopóki klient utrzymuje otwartą sesję stdio, most łączy się z
lokalną lub zdalną bramą OpenClaw Gateway przez WebSocket i udostępnia
kierowane rozmowy kanałów przez MCP.

Cykl życia:

1. klient MCP uruchamia `openclaw mcp serve`
2. most łączy się z Gateway
3. kierowane sesje stają się rozmowami MCP oraz narzędziami transkryptu/historii
4. zdarzenia na żywo są kolejkowane w pamięci, gdy most jest połączony
5. jeśli tryb kanału Claude jest włączony, ta sama sesja może również odbierać
   powiadomienia push specyficzne dla Claude

Ważne zachowanie:

- stan kolejki na żywo zaczyna się w momencie połączenia mostu
- starsza historia transkryptu jest odczytywana za pomocą `messages_read`
- powiadomienia push Claude istnieją tylko wtedy, gdy sesja MCP jest aktywna
- gdy klient się rozłączy, most kończy działanie, a kolejka na żywo znika

## Wybór trybu klienta

Tego samego mostu można używać na dwa różne sposoby:

- Ogólni klienci MCP: tylko standardowe narzędzia MCP. Używaj `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` oraz
  narzędzi zatwierdzania.
- Claude Code: standardowe narzędzia MCP plus adapter kanału specyficzny dla Claude.
  Włącz `--claude-channel-mode on` albo pozostaw domyślne `auto`.

Obecnie `auto` działa tak samo jak `on`. Wykrywanie możliwości klienta nie jest
jeszcze dostępne.

## Co udostępnia `serve`

Most używa istniejących metadanych tras sesji Gateway, aby udostępniać rozmowy
obsługiwane przez kanały. Rozmowa pojawia się, gdy OpenClaw ma już stan sesji
ze znaną trasą, taką jak:

- `channel`
- metadane odbiorcy lub celu
- opcjonalne `accountId`
- opcjonalne `threadId`

Dzięki temu klienci MCP mają jedno miejsce, w którym mogą:

- wyświetlać listę ostatnich kierowanych rozmów
- odczytywać ostatnią historię transkryptu
- czekać na nowe zdarzenia przychodzące
- wysyłać odpowiedź z powrotem tą samą trasą
- widzieć żądania zatwierdzenia, które przychodzą, gdy most jest połączony

## Użycie

```bash
# Lokalna Gateway
openclaw mcp serve

# Zdalna Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Zdalna Gateway z uwierzytelnianiem hasłem
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Włącz szczegółowe logi mostu
openclaw mcp serve --verbose

# Wyłącz powiadomienia push specyficzne dla Claude
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

Wyświetla ostatnie rozmowy obsługiwane przez sesje, które mają już metadane tras
w stanie sesji Gateway.

Przydatne filtry:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Zwraca jedną rozmowę według `session_key`.

### `messages_read`

Odczytuje ostatnie wiadomości transkryptu dla jednej rozmowy obsługiwanej przez sesję.

### `attachments_fetch`

Wyodrębnia nietekstowe bloki treści wiadomości z jednej wiadomości transkryptu. Jest to
widok metadanych treści transkryptu, a nie niezależny trwały magazyn blobów załączników.

### `events_poll`

Odczytuje zakolejkowane zdarzenia na żywo od wskazanego kursora numerycznego.

### `events_wait`

Wykonuje długie odpytywanie, aż nadejdzie następne pasujące zakolejkowane zdarzenie lub upłynie limit czasu.

Używaj tego, gdy ogólny klient MCP potrzebuje dostarczania zbliżonego do czasu
rzeczywistego bez protokołu push specyficznego dla Claude.

### `messages_send`

Wysyła tekst z powrotem tą samą trasą, która została już zapisana w sesji.

Obecne zachowanie:

- wymaga istniejącej trasy rozmowy
- używa kanału sesji, odbiorcy, identyfikatora konta i identyfikatora wątku sesji
- wysyła tylko tekst

### `permissions_list_open`

Wyświetla oczekujące żądania zatwierdzenia exec/plugin, które most zaobserwował od czasu
połączenia z Gateway.

### `permissions_respond`

Rozstrzyga jedno oczekujące żądanie zatwierdzenia exec/plugin za pomocą:

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

- kolejka działa tylko na żywo; zaczyna się w momencie uruchomienia mostu MCP
- `events_poll` i `events_wait` same z siebie nie odtwarzają starszej historii Gateway
- trwały backlog należy odczytywać za pomocą `messages_read`

## Powiadomienia kanału Claude

Most może również udostępniać powiadomienia kanału specyficzne dla Claude. Jest to
odpowiednik adaptera kanału Claude Code w OpenClaw: standardowe narzędzia MCP nadal są
dostępne, ale przychodzące wiadomości na żywo mogą również docierać jako
powiadomienia MCP specyficzne dla Claude.

Flagi:

- `--claude-channel-mode off`: tylko standardowe narzędzia MCP
- `--claude-channel-mode on`: włącza powiadomienia kanału Claude
- `--claude-channel-mode auto`: obecne ustawienie domyślne; takie samo zachowanie mostu jak przy `on`

Gdy tryb kanału Claude jest włączony, serwer ogłasza eksperymentalne
możliwości Claude i może emitować:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Obecne zachowanie mostu:

- przychodzące wiadomości transkryptu `user` są przekazywane jako
  `notifications/claude/channel`
- żądania uprawnień Claude otrzymane przez MCP są śledzone w pamięci
- jeśli powiązana rozmowa wyśle później `yes abcde` lub `no abcde`, most
  przekształca to w `notifications/claude/channel/permission`
- te powiadomienia działają tylko w sesji na żywo; jeśli klient MCP się rozłączy,
  nie ma celu dla powiadomień push

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

W przypadku większości ogólnych klientów MCP zacznij od standardowego zestawu
narzędzi i ignoruj tryb Claude. Włącz tryb Claude tylko dla klientów, które
rzeczywiście rozumieją metody powiadomień specyficzne dla Claude.

## Opcje

`openclaw mcp serve` obsługuje:

- `--url <url>`: adres URL WebSocket bramy Gateway
- `--token <token>`: token Gateway
- `--token-file <path>`: odczyt tokenu z pliku
- `--password <password>`: hasło Gateway
- `--password-file <path>`: odczyt hasła z pliku
- `--claude-channel-mode <auto|on|off>`: tryb powiadomień Claude
- `-v`, `--verbose`: szczegółowe logi na stderr

Jeśli to możliwe, preferuj `--token-file` lub `--password-file` zamiast wpisywania
tajnych danych bezpośrednio w wierszu poleceń.

## Bezpieczeństwo i granica zaufania

Most nie tworzy tras samodzielnie. Udostępnia tylko rozmowy, które Gateway już
umie kierować.

Oznacza to, że:

- listy dozwolonych nadawców, parowanie i zaufanie na poziomie kanału nadal należą do
  bazowej konfiguracji kanałów OpenClaw
- `messages_send` może odpowiadać tylko przez istniejącą zapisaną trasę
- stan zatwierdzeń działa tylko na żywo/w pamięci dla bieżącej sesji mostu
- uwierzytelnianie mostu powinno używać tych samych mechanizmów tokenu lub hasła Gateway,
  którym zaufałbyś dla każdego innego zdalnego klienta Gateway

Jeśli rozmowy brakuje w `conversations_list`, zwykle przyczyną nie jest
konfiguracja MCP. Brakuje metadanych tras w bazowej sesji Gateway albo są one niepełne.

## Testowanie

OpenClaw dostarcza deterministyczny test smoke Docker dla tego mostu:

```bash
pnpm test:docker:mcp-channels
```

Ten test smoke:

- uruchamia kontener Gateway z przygotowanymi danymi
- uruchamia drugi kontener, który startuje `openclaw mcp serve`
- weryfikuje wykrywanie rozmów, odczyty transkryptu, odczyty metadanych załączników,
  zachowanie kolejki zdarzeń na żywo oraz trasowanie wysyłki wychodzącej
- sprawdza powiadomienia kanału i uprawnień w stylu Claude przez rzeczywisty
  most stdio MCP

To najszybszy sposób, aby potwierdzić, że most działa, bez podpinania do testu
prawdziwego konta Telegram, Discord lub iMessage.

Szerszy kontekst testowania znajdziesz w [Testing](/help/testing).

## Rozwiązywanie problemów

### Nie zwrócono żadnych rozmów

Zwykle oznacza to, że sesja Gateway nie jest jeszcze możliwa do kierowania. Potwierdź, że
bazowa sesja ma zapisane metadane trasy kanału/dostawcy, odbiorcy oraz opcjonalnie
konta/wątku.

### `events_poll` lub `events_wait` pomija starsze wiadomości

To oczekiwane. Kolejka na żywo zaczyna się w momencie połączenia mostu. Starszą historię
transkryptu odczytuj za pomocą `messages_read`.

### Powiadomienia Claude się nie pojawiają

Sprawdź wszystkie poniższe warunki:

- klient utrzymał otwartą sesję stdio MCP
- `--claude-channel-mode` ma wartość `on` lub `auto`
- klient rzeczywiście rozumie metody powiadomień specyficzne dla Claude
- wiadomość przychodząca pojawiła się po połączeniu mostu

### Brakuje zatwierdzeń

`permissions_list_open` pokazuje tylko żądania zatwierdzenia zaobserwowane, gdy most
był połączony. To nie jest trwałe API historii zatwierdzeń.

## OpenClaw jako rejestr klienta MCP

To jest ścieżka `openclaw mcp list`, `show`, `set` i `unset`.

Te polecenia nie udostępniają OpenClaw przez MCP. Zarządzają definicjami serwerów MCP
należącymi do OpenClaw w `mcp.servers` w konfiguracji OpenClaw.

Te zapisane definicje są przeznaczone dla środowisk uruchomieniowych, które OpenClaw uruchamia
lub konfiguruje później, takich jak osadzony Pi i inne adaptery środowiska uruchomieniowego. OpenClaw przechowuje te
definicje centralnie, aby te środowiska nie musiały utrzymywać własnych zduplikowanych
list serwerów MCP.

Ważne zachowanie:

- te polecenia tylko odczytują lub zapisują konfigurację OpenClaw
- nie łączą się z docelowym serwerem MCP
- nie sprawdzają, czy polecenie, URL lub transport zdalny są
  obecnie osiągalne
- adaptery środowiska uruchomieniowego w czasie wykonania decydują, które kształty transportu faktycznie obsługują

## Zapisane definicje serwerów MCP

OpenClaw przechowuje również lekki rejestr serwerów MCP w konfiguracji dla powierzchni,
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
- `unset` kończy się błędem, jeśli serwer o podanej nazwie nie istnieje.

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

| Pole                       | Opis                               |
| -------------------------- | ---------------------------------- |
| `command`                  | Plik wykonywalny do uruchomienia (wymagane) |
| `args`                     | Tablica argumentów wiersza poleceń |
| `env`                      | Dodatkowe zmienne środowiskowe     |
| `cwd` / `workingDirectory` | Katalog roboczy procesu            |

### Transport SSE / HTTP

Łączy się ze zdalnym serwerem MCP przez HTTP Server-Sent Events.

| Pole                 | Opis                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | Adres URL HTTP lub HTTPS zdalnego serwera (wymagane)            |
| `headers`             | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokeny uwierzytelniające) |
| `connectionTimeoutMs` | Limit czasu połączenia dla serwera w ms (opcjonalne)            |

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

Wrażliwe wartości w `url` (userinfo) i `headers` są ukrywane w logach oraz
wynikach statusu.

### Transport Streamable HTTP

`streamable-http` to dodatkowa opcja transportu obok `sse` i `stdio`. Używa przesyłania strumieniowego HTTP do dwukierunkowej komunikacji ze zdalnymi serwerami MCP.

| Pole                 | Opis                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| `url`                 | Adres URL HTTP lub HTTPS zdalnego serwera (wymagane)                                 |
| `transport`           | Ustaw na `"streamable-http"`, aby wybrać ten transport; gdy zostanie pominięte, OpenClaw używa `sse` |
| `headers`             | Opcjonalna mapa klucz-wartość nagłówków HTTP (na przykład tokeny uwierzytelniające)  |
| `connectionTimeoutMs` | Limit czasu połączenia dla serwera w ms (opcjonalne)                                 |

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

Te polecenia zarządzają wyłącznie zapisaną konfiguracją. Nie uruchamiają mostu kanału,
nie otwierają aktywnej sesji klienta MCP ani nie potwierdzają, że docelowy serwer jest osiągalny.

## Obecne ograniczenia

Ta strona dokumentuje most w obecnej dostarczanej postaci.

Obecne ograniczenia:

- wykrywanie rozmów zależy od istniejących metadanych tras sesji Gateway
- brak ogólnego protokołu push poza adapterem specyficznym dla Claude
- brak narzędzi do edycji wiadomości lub reakcji
- transport HTTP/SSE/streamable-http łączy się z jednym zdalnym serwerem; brak jeszcze multipleksowanego upstreamu
- `permissions_list_open` obejmuje tylko zatwierdzenia zaobserwowane, gdy most jest
  połączony
