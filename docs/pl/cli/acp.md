---
read_when:
    - Konfigurowanie integracji IDE opartych na ACP
    - Debugowanie routingu sesji ACP do Gateway
summary: Uruchom most ACP do integracji z IDE
title: ACP
x-i18n:
    generated_at: "2026-05-11T20:25:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c94877b97cf6fb8deb6f16ec3f7225dfe931b78b25ad966d4350bdb20e25d9a
    source_path: cli/acp.md
    workflow: 16
---

Uruchamia mostek [Agent Client Protocol (ACP)](https://agentclientprotocol.com/), który komunikuje się z OpenClaw Gateway.

To polecenie mówi ACP przez stdio dla IDE i przekazuje prompty do Gateway
przez WebSocket. Utrzymuje mapowanie sesji ACP na klucze sesji Gateway.

`openclaw acp` to mostek ACP wspierany przez Gateway, a nie pełne środowisko
edytora natywne dla ACP. Skupia się na routingu sesji, dostarczaniu promptów i
podstawowych aktualizacjach strumieniowych.

Jeśli chcesz, aby zewnętrzny klient MCP rozmawiał bezpośrednio z konwersacjami
kanału OpenClaw zamiast hostować sesję uprzęży ACP, użyj zamiast tego
[`openclaw mcp serve`](/pl/cli/mcp).

## Czym to nie jest

Ta strona jest często mylona z sesjami uprzęży ACP.

`openclaw acp` oznacza:

- OpenClaw działa jako serwer ACP
- IDE lub klient ACP łączy się z OpenClaw
- OpenClaw przekazuje tę pracę do sesji Gateway

Różni się to od [Agentów ACP](/pl/tools/acp-agents), gdzie OpenClaw uruchamia
zewnętrzną uprząż, taką jak Codex lub Claude Code, przez `acpx`.

Szybka zasada:

- edytor/klient chce rozmawiać z OpenClaw przez ACP: użyj `openclaw acp`
- OpenClaw ma uruchomić Codex/Claude/Gemini jako uprząż ACP: użyj `/acp spawn` i [Agentów ACP](/pl/tools/acp-agents)

## Macierz zgodności

| Obszar ACP                                                            | Status              | Uwagi                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Zaimplementowane    | Główny przepływ mostka przez stdio do czatu/wysyłania Gateway + przerwanie.                                                                                                                                                                     |
| `listSessions`, polecenia ukośnikowe                                  | Zaimplementowane    | Lista sesji działa względem stanu sesji Gateway z ograniczoną paginacją kursora i filtrowaniem `cwd`, gdy wiersze sesji Gateway zawierają metadane przestrzeni roboczej; polecenia są ogłaszane przez `available_commands_update`.              |
| Metadane pochodzenia sesji                                            | Zaimplementowane    | Listy sesji i migawki informacji o sesji zawierają pochodzenie nadrzędne i podrzędne OpenClaw w `_meta`, dzięki czemu klienci ACP mogą renderować grafy podagentów bez prywatnych kanałów bocznych Gateway.                                    |
| `resumeSession`, `closeSession`                                       | Zaimplementowane    | Resume ponownie wiąże sesję ACP z istniejącą sesją Gateway bez odtwarzania historii. Close anuluje aktywną pracę mostka, rozwiązuje oczekujące prompty jako anulowane i zwalnia stan sesji mostka.                                             |
| `loadSession`                                                         | Częściowe           | Ponownie wiąże sesję ACP z kluczem sesji Gateway i odtwarza historię rejestru zdarzeń ACP dla sesji utworzonych przez mostek. Starsze sesje lub sesje bez rejestru wracają do zapisanego tekstu użytkownika/asystenta.                         |
| Treść promptu (`text`, osadzony `resource`, obrazy)                   | Częściowe           | Tekst/zasoby są spłaszczane do wejścia czatu; obrazy stają się załącznikami Gateway.                                                                                                                                                            |
| Tryby sesji                                                           | Częściowe           | `session/set_mode` jest obsługiwane, a mostek udostępnia początkowe kontrolki sesji wspierane przez Gateway dla poziomu myślenia, szczegółowości narzędzi, rozumowania, szczegółów użycia i działań z podwyższonymi uprawnieniami. Szersze natywne dla ACP powierzchnie trybów/konfiguracji pozostają poza zakresem. |
| Informacje o sesji i aktualizacje użycia                              | Częściowe           | Mostek emituje powiadomienia `session_info_update` i best-effort `usage_update` z buforowanych migawek sesji Gateway. Użycie jest przybliżone i wysyłane tylko wtedy, gdy sumy tokenów Gateway są oznaczone jako świeże.                       |
| Strumieniowanie narzędzi                                              | Częściowe           | Zdarzenia `tool_call` / `tool_call_update` zawierają surowe I/O, treść tekstową i best-effort lokalizacje plików, gdy argumenty/wyniki narzędzi Gateway je ujawniają. Osadzone terminale i bogatsze wyjście natywne dla diff nadal nie są ujawniane. |
| Zatwierdzenia exec                                                    | Częściowe           | Prompty zatwierdzeń exec Gateway podczas aktywnych tur promptów ACP są przekazywane do klienta ACP przez `session/request_permission`.                                                                                                          |
| Serwery MCP dla poszczególnych sesji (`mcpServers`)                   | Nieobsługiwane      | Tryb mostka odrzuca żądania serwera MCP dla poszczególnych sesji. Skonfiguruj MCP zamiast tego na Gateway lub agencie OpenClaw.                                                                                                                 |
| Metody systemu plików klienta (`fs/read_text_file`, `fs/write_text_file`) | Nieobsługiwane      | Mostek nie wywołuje metod systemu plików klienta ACP.                                                                                                                                                                                           |
| Metody terminala klienta (`terminal/*`)                               | Nieobsługiwane      | Mostek nie tworzy terminali klienta ACP ani nie strumieniuje identyfikatorów terminali przez wywołania narzędzi.                                                                                                                                |
| Plany sesji / strumieniowanie myśli                                   | Nieobsługiwane      | Mostek obecnie emituje tekst wyjściowy i status narzędzi, a nie aktualizacje planów ani myśli ACP.                                                                                                                                              |

## Znane ograniczenia

- `loadSession` może odtworzyć pełną historię rejestru zdarzeń ACP tylko dla
  sesji utworzonych przez mostek. Starsze sesje lub sesje bez rejestru nadal
  używają awaryjnie transkrypcji i nie rekonstruują historycznych wywołań
  narzędzi ani powiadomień systemowych.
- Jeśli wielu klientów ACP współdzieli ten sam klucz sesji Gateway, routing
  zdarzeń i anulowania jest best-effort, a nie ściśle izolowany dla każdego
  klienta. Preferuj domyślne izolowane sesje `acp:<uuid>`, gdy potrzebujesz
  czystych, lokalnych dla edytora tur.
- Stany zatrzymania Gateway są tłumaczone na powody zatrzymania ACP, ale to
  mapowanie jest mniej ekspresyjne niż w pełni natywne dla ACP środowisko
  uruchomieniowe.
- Początkowe kontrolki sesji obecnie udostępniają skoncentrowany podzbiór
  pokręteł Gateway: poziom myślenia, szczegółowość narzędzi, rozumowanie,
  szczegóły użycia i działania z podwyższonymi uprawnieniami. Wybór modelu i
  kontrolki hosta exec nie są jeszcze udostępniane jako opcje konfiguracji ACP.
- `session_info_update` i `usage_update` pochodzą z migawek sesji Gateway, a
  nie z księgowości środowiska uruchomieniowego natywnej dla ACP na żywo.
  Użycie jest przybliżone, nie zawiera danych kosztowych i jest emitowane tylko
  wtedy, gdy Gateway oznacza dane łącznej liczby tokenów jako świeże.
- Dane podążania za narzędziem są best-effort. Mostek może ujawniać ścieżki
  plików, które pojawiają się w znanych argumentach/wynikach narzędzi, ale nie
  emituje jeszcze terminali ACP ani ustrukturyzowanych diffów plików.
- Przekazywanie zatwierdzeń exec jest ograniczone do aktywnej tury promptu ACP;
  zatwierdzenia z innych sesji Gateway są ignorowane.

## Użycie

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## Klient ACP (debugowanie)

Użyj wbudowanego klienta ACP, aby szybko sprawdzić mostek bez IDE.
Uruchamia mostek ACP i pozwala wpisywać prompty interaktywnie.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Model uprawnień (tryb debugowania klienta):

- Automatyczne zatwierdzanie jest oparte na liście dozwolonych i dotyczy tylko zaufanych identyfikatorów narzędzi core.
- Automatyczne zatwierdzanie `read` jest ograniczone do bieżącego katalogu roboczego (`--cwd`, gdy ustawione).
- ACP automatycznie zatwierdza tylko wąskie klasy tylko do odczytu: ograniczone wywołania `read` pod aktywnym cwd oraz narzędzia wyszukiwania tylko do odczytu (`search`, `web_search`, `memory_search`). Nieznane/nienależące do core narzędzia, odczyty poza zakresem, narzędzia zdolne do exec, narzędzia płaszczyzny sterowania, narzędzia modyfikujące i przepływy interaktywne zawsze wymagają jawnego zatwierdzenia promptu.
- Dostarczone przez serwer `toolCall.kind` jest traktowane jako niezaufane metadane (nie jako źródło autoryzacji).
- Ta polityka mostka ACP jest osobna od uprawnień uprzęży ACPX. Jeśli uruchamiasz OpenClaw przez backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` jest przełącznikiem awaryjnym „yolo” dla tej sesji uprzęży.

## Test smoke protokołu

Do debugowania na poziomie protokołu uruchom Gateway z izolowanym stanem i steruj
`openclaw acp` przez stdio klientem ACP JSON-RPC. Uwzględnij `initialize`,
`session/new`, `session/list` z bezwzględnym `cwd`, `session/resume`,
`session/close`, zduplikowane zamknięcie i brakujące wznowienie.

Dowód powinien zawierać ogłoszone możliwości cyklu życia, wiersz sesji wspierany
przez Gateway, powiadomienia o aktualizacjach oraz log Gateway `sessions.list`:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

Unikaj używania `openclaw gateway call sessions.list` jako jedynego dowodu ACP.
Ta ścieżka CLI może zażądać podniesienia zakresu operatora dla świeżego tokenu;
poprawność mostka ACP jest dowodzona przez ramki stdio ACP oraz log Gateway
`sessions.list`.

## Jak tego używać

Użyj ACP, gdy IDE (lub inny klient) mówi Agent Client Protocol i chcesz, aby
sterował sesją OpenClaw Gateway.

1. Upewnij się, że Gateway działa (lokalnie lub zdalnie).
2. Skonfiguruj cel Gateway (konfiguracja lub flagi).
3. Wskaż IDE, aby uruchamiało `openclaw acp` przez stdio.

Przykładowa konfiguracja (utrwalona):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Przykład bezpośredniego uruchomienia (bez zapisu konfiguracji):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Wybieranie agentów

ACP nie wybiera agentów bezpośrednio. Routinguje według klucza sesji Gateway.

Użyj kluczy sesji z zakresem agenta, aby wskazać konkretnego agenta:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Każda sesja ACP mapuje się na pojedynczy klucz sesji Gateway. Jeden agent może mieć wiele
sesji; ACP domyślnie używa izolowanej sesji `acp:<uuid>`, chyba że nadpiszesz
klucz lub etykietę.

Sesyjne `mcpServers` nie są obsługiwane w trybie mostu. Jeśli klient ACP
wyśle je podczas `newSession` lub `loadSession`, most zwróci jasny
błąd zamiast po cichu je ignorować.

Jeśli chcesz, aby sesje oparte na ACPX widziały narzędzia Plugin OpenClaw lub wybrane
wbudowane narzędzia, takie jak `cron`, włącz mosty ACPX MCP po stronie Gateway zamiast
próbować przekazywać sesyjne `mcpServers`. Zobacz
[Agenci ACP](/pl/tools/acp-agents-setup#plugin-tools-mcp-bridge) oraz
[most MCP narzędzi OpenClaw](/pl/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Użycie z `acpx` (Codex, Claude, inni klienci ACP)

Jeśli chcesz, aby agent programistyczny, taki jak Codex lub Claude Code, komunikował się z Twoim
botem OpenClaw przez ACP, użyj `acpx` z jego wbudowanym celem `openclaw`.

Typowy przepływ:

1. Uruchom Gateway i upewnij się, że most ACP może się z nim połączyć.
2. Skieruj `acpx openclaw` na `openclaw acp`.
3. Wskaż klucz sesji OpenClaw, którego agent programistyczny ma używać.

Przykłady:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Jeśli chcesz, aby `acpx openclaw` za każdym razem wskazywał konkretny Gateway i klucz sesji,
nadpisz polecenie agenta `openclaw` w `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Dla lokalnego checkoutu OpenClaw w repozytorium użyj bezpośredniego punktu wejścia CLI zamiast
uruchamiacza deweloperskiego, aby strumień ACP pozostał czysty. Na przykład:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

To najprostszy sposób, aby umożliwić Codex, Claude Code lub innemu klientowi obsługującemu ACP
pobieranie informacji kontekstowych od agenta OpenClaw bez scrapowania terminala.

## Konfiguracja edytora Zed

Dodaj niestandardowego agenta ACP w `~/.config/zed/settings.json` (lub użyj interfejsu ustawień Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Aby wskazać konkretny Gateway lub agenta:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

W Zed otwórz panel Agent i wybierz "OpenClaw ACP", aby rozpocząć wątek.

## Mapowanie sesji

Domyślnie sesje ACP otrzymują izolowany klucz sesji Gateway z prefiksem `acp:`.
Aby ponownie użyć znanej sesji, przekaż klucz sesji lub etykietę:

- `--session <key>`: użyj konkretnego klucza sesji Gateway.
- `--session-label <label>`: rozwiąż istniejącą sesję według etykiety.
- `--reset-session`: utwórz świeży identyfikator sesji dla tego klucza (ten sam klucz, nowy transkrypt).

Jeśli Twój klient ACP obsługuje metadane, możesz nadpisać je dla każdej sesji:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Dowiedz się więcej o kluczach sesji na [/concepts/session](/pl/concepts/session).

## Opcje

- `--url <url>`: URL WebSocket Gateway (domyślnie gateway.remote.url, gdy jest skonfigurowany).
- `--token <token>`: token uwierzytelniania Gateway.
- `--token-file <path>`: odczytaj token uwierzytelniania Gateway z pliku.
- `--password <password>`: hasło uwierzytelniania Gateway.
- `--password-file <path>`: odczytaj hasło uwierzytelniania Gateway z pliku.
- `--session <key>`: domyślny klucz sesji.
- `--session-label <label>`: domyślna etykieta sesji do rozwiązania.
- `--require-existing`: zakończ błędem, jeśli klucz/etykieta sesji nie istnieje.
- `--reset-session`: zresetuj klucz sesji przed pierwszym użyciem.
- `--no-prefix-cwd`: nie poprzedzaj promptów katalogiem roboczym.
- `--provenance <off|meta|meta+receipt>`: uwzględnij metadane pochodzenia ACP lub potwierdzenia.
- `--verbose, -v`: szczegółowe logowanie do stderr.

Uwaga dotycząca bezpieczeństwa:

- `--token` i `--password` mogą być widoczne w lokalnych listach procesów w niektórych systemach.
- Preferuj `--token-file`/`--password-file` lub zmienne środowiskowe (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Rozwiązywanie uwierzytelniania Gateway jest zgodne ze wspólnym kontraktem używanym przez innych klientów Gateway:
  - tryb lokalny: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` tylko wtedy, gdy `gateway.auth.*` nie jest ustawione (skonfigurowane, ale nierozwiązane lokalne SecretRefs kończą się zamknięciem)
  - tryb zdalny: `gateway.remote.*` z fallbackiem env/konfiguracji zgodnie z regułami priorytetu zdalnego
  - `--url` jest bezpieczne do nadpisywania i nie używa ponownie niejawnych danych uwierzytelniających z konfiguracji/env; przekaż jawne `--token`/`--password` (lub warianty plikowe)
- Procesy potomne backendu wykonawczego ACP otrzymują `OPENCLAW_SHELL=acp`, którego można używać do reguł powłoki/profilu specyficznych dla kontekstu.
- `openclaw acp client` ustawia `OPENCLAW_SHELL=acp-client` w uruchamianym procesie mostu.

### Opcje `acp client`

- `--cwd <dir>`: katalog roboczy sesji ACP.
- `--server <command>`: polecenie serwera ACP (domyślnie: `openclaw`).
- `--server-args <args...>`: dodatkowe argumenty przekazywane do serwera ACP.
- `--server-verbose`: włącz szczegółowe logowanie na serwerze ACP.
- `--verbose, -v`: szczegółowe logowanie klienta.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Agenci ACP](/pl/tools/acp-agents)
