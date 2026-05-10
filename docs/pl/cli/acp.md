---
read_when:
    - Konfigurowanie integracji IDE opartych na ACP
    - Debugowanie routingu sesji ACP do Gateway
summary: Uruchom most ACP dla integracji IDE
title: ACP
x-i18n:
    generated_at: "2026-05-10T19:27:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0614b40723ef8374c5bc26d92516ac5725ae2d8ef5e8f4db360b2259879fe320
    source_path: cli/acp.md
    workflow: 16
---

Uruchom most [Agent Client Protocol (ACP)](https://agentclientprotocol.com/), który komunikuje się z OpenClaw Gateway.

To polecenie używa ACP przez stdio dla IDE i przekazuje prompty do Gateway
przez WebSocket. Utrzymuje mapowanie sesji ACP na klucze sesji Gateway.

`openclaw acp` to most ACP oparty na Gateway, a nie pełne, natywne dla ACP
środowisko wykonawcze edytora. Koncentruje się na routingu sesji, dostarczaniu
promptów i podstawowych aktualizacjach strumieniowych.

Jeśli chcesz, aby zewnętrzny klient MCP komunikował się bezpośrednio z
konwersacjami kanałów OpenClaw zamiast hostować sesję harness ACP, użyj zamiast
tego [`openclaw mcp serve`](/pl/cli/mcp).

## Czym to nie jest

Ta strona jest często mylona z sesjami harness ACP.

`openclaw acp` oznacza:

- OpenClaw działa jako serwer ACP
- IDE lub klient ACP łączy się z OpenClaw
- OpenClaw przekazuje tę pracę do sesji Gateway

Różni się to od [agentów ACP](/pl/tools/acp-agents), gdzie OpenClaw uruchamia
zewnętrzny harness, taki jak Codex lub Claude Code, przez `acpx`.

Szybka zasada:

- edytor/klient chce komunikować się z OpenClaw przez ACP: użyj `openclaw acp`
- OpenClaw ma uruchamiać Codex/Claude/Gemini jako harness ACP: użyj `/acp spawn` i [agentów ACP](/pl/tools/acp-agents)

## Macierz zgodności

| Obszar ACP                                                            | Status           | Uwagi                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Zaimplementowano | Główny przepływ mostu przez stdio do czatu/wysyłania Gateway oraz anulowania.                                                                                                                                                                          |
| `listSessions`, polecenia slash                                       | Zaimplementowano | Lista sesji działa względem stanu sesji Gateway z ograniczoną paginacją kursora i filtrowaniem `cwd`, gdy wiersze sesji Gateway zawierają metadane przestrzeni roboczej; polecenia są ogłaszane przez `available_commands_update`.                    |
| `resumeSession`, `closeSession`                                       | Zaimplementowano | Wznowienie ponownie wiąże sesję ACP z istniejącą sesją Gateway bez odtwarzania historii. Zamknięcie anuluje aktywną pracę mostu, rozwiązuje oczekujące prompty jako anulowane i zwalnia stan sesji mostu.                                             |
| `loadSession`                                                         | Częściowo        | Ponownie wiąże sesję ACP z kluczem sesji Gateway i odtwarza historię rejestru zdarzeń ACP dla sesji utworzonych przez most. Starsze sesje lub sesje bez rejestru zdarzeń wracają do zapisanego tekstu użytkownika/asystenta.                         |
| Zawartość promptu (`text`, osadzony `resource`, obrazy)               | Częściowo        | Tekst/zasoby są spłaszczane do wejścia czatu; obrazy stają się załącznikami Gateway.                                                                                                                                                                  |
| Tryby sesji                                                           | Częściowo        | `session/set_mode` jest obsługiwane, a most udostępnia początkowe, oparte na Gateway kontrolki sesji dla poziomu myślenia, szczegółowości narzędzi, rozumowania, szczegółów użycia i działań podwyższonych. Szersze, natywne dla ACP powierzchnie trybu/konfiguracji nadal pozostają poza zakresem. |
| Informacje o sesji i aktualizacje użycia                              | Częściowo        | Most emituje powiadomienia `session_info_update` i best-effort `usage_update` z buforowanych migawek sesji Gateway. Użycie jest przybliżone i wysyłane tylko wtedy, gdy sumy tokenów Gateway są oznaczone jako świeże.                               |
| Strumieniowanie narzędzi                                              | Częściowo        | Zdarzenia `tool_call` / `tool_call_update` zawierają surowe I/O, zawartość tekstową i best-effort lokalizacje plików, gdy argumenty/wyniki narzędzi Gateway je ujawniają. Osadzone terminale i bogatsze wyjście natywne dla diffów nadal nie są udostępniane. |
| Zatwierdzenia exec                                                    | Częściowo        | Prompty zatwierdzeń exec Gateway podczas aktywnych tur promptu ACP są przekazywane do klienta ACP za pomocą `session/request_permission`.                                                                                                             |
| Serwery MCP na sesję (`mcpServers`)                                   | Nieobsługiwane   | Tryb mostu odrzuca żądania serwera MCP na sesję. Skonfiguruj MCP w Gateway OpenClaw lub agencie.                                                                                                                                                      |
| Metody systemu plików klienta (`fs/read_text_file`, `fs/write_text_file`) | Nieobsługiwane | Most nie wywołuje metod systemu plików klienta ACP.                                                                                                                                                                                                   |
| Metody terminala klienta (`terminal/*`)                               | Nieobsługiwane   | Most nie tworzy terminali klienta ACP ani nie strumieniuje identyfikatorów terminali przez wywołania narzędzi.                                                                                                                                        |
| Plany sesji / strumieniowanie myśli                                   | Nieobsługiwane   | Most obecnie emituje tekst wyjściowy i status narzędzi, a nie plany ACP ani aktualizacje myśli.                                                                                                                                                       |

## Znane ograniczenia

- `loadSession` może odtworzyć kompletną historię rejestru zdarzeń ACP tylko dla
  sesji utworzonych przez most. Starsze sesje lub sesje bez rejestru zdarzeń
  nadal używają awaryjnego transkryptu i nie rekonstruują historycznych wywołań
  narzędzi ani powiadomień systemowych.
- Jeśli wielu klientów ACP współdzieli ten sam klucz sesji Gateway, routing
  zdarzeń i anulowań jest best-effort, a nie ściśle izolowany per klient.
  Preferuj domyślne izolowane sesje `acp:<uuid>`, gdy potrzebujesz czystych,
  lokalnych dla edytora tur.
- Stany zatrzymania Gateway są tłumaczone na powody zatrzymania ACP, ale to
  mapowanie jest mniej ekspresyjne niż w pełni natywne dla ACP środowisko
  wykonawcze.
- Początkowe kontrolki sesji obecnie ujawniają skoncentrowany podzbiór
  ustawień Gateway: poziom myślenia, szczegółowość narzędzi, rozumowanie,
  szczegóły użycia i działania podwyższone. Wybór modelu i kontrolki hosta exec
  nie są jeszcze udostępniane jako opcje konfiguracji ACP.
- `session_info_update` i `usage_update` pochodzą z migawek sesji Gateway, a nie
  z księgowania środowiska wykonawczego natywnego dla ACP na żywo. Użycie jest
  przybliżone, nie zawiera danych o kosztach i jest emitowane tylko wtedy, gdy
  Gateway oznacza łączne dane tokenów jako świeże.
- Dane śledzenia narzędzi są best-effort. Most może ujawniać ścieżki plików,
  które pojawiają się w znanych argumentach/wynikach narzędzi, ale nie emituje
  jeszcze terminali ACP ani ustrukturyzowanych diffów plików.
- Przekaźnik zatwierdzeń exec jest ograniczony do aktywnej tury promptu ACP;
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

Użyj wbudowanego klienta ACP, aby sprawdzić poprawność mostu bez IDE.
Uruchamia most ACP i pozwala interaktywnie wpisywać prompty.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Model uprawnień (tryb debugowania klienta):

- Automatyczne zatwierdzanie jest oparte na liście dozwolonych i dotyczy tylko
  zaufanych identyfikatorów narzędzi rdzenia.
- Automatyczne zatwierdzanie `read` jest ograniczone do bieżącego katalogu
  roboczego (`--cwd`, gdy ustawione).
- ACP automatycznie zatwierdza tylko wąskie klasy tylko do odczytu: zakresowe
  wywołania `read` pod aktywnym cwd oraz narzędzia wyszukiwania tylko do
  odczytu (`search`, `web_search`, `memory_search`). Nieznane/nienależące do
  rdzenia narzędzia, odczyty poza zakresem, narzędzia zdolne do exec, narzędzia
  płaszczyzny sterowania, narzędzia mutujące i przepływy interaktywne zawsze
  wymagają jawnego zatwierdzenia promptu.
- Dostarczone przez serwer `toolCall.kind` jest traktowane jako niezaufane
  metadane (nie jako źródło autoryzacji).
- Ta polityka mostu ACP jest oddzielna od uprawnień harness ACPX. Jeśli
  uruchamiasz OpenClaw przez backend `acpx`,
  `plugins.entries.acpx.config.permissionMode=approve-all` jest awaryjnym
  przełącznikiem „yolo” dla tej sesji harness.

## Test dymny protokołu

Do debugowania na poziomie protokołu uruchom Gateway z izolowanym stanem i
steruj `openclaw acp` przez stdio za pomocą klienta JSON-RPC ACP. Obejmij
`initialize`, `session/new`, `session/list` z bezwzględnym `cwd`,
`session/resume`, `session/close`, powtórne zamknięcie i brakujące wznowienie.

Dowód powinien zawierać ogłoszone możliwości cyklu życia, wiersz sesji oparty
na Gateway, powiadomienia o aktualizacjach oraz dziennik Gateway `sessions.list`:

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
Ta ścieżka CLI może zażądać podniesienia zakresu operatora ze świeżym tokenem;
poprawność mostu ACP jest dowiedziona przez ramki stdio ACP oraz dziennik
Gateway `sessions.list`.

## Jak tego używać

Użyj ACP, gdy IDE (lub inny klient) mówi protokołem Agent Client Protocol i
chcesz, aby sterował sesją OpenClaw Gateway.

1. Upewnij się, że Gateway działa (lokalnie lub zdalnie).
2. Skonfiguruj cel Gateway (konfiguracja lub flagi).
3. Skieruj IDE na uruchamianie `openclaw acp` przez stdio.

Przykładowa konfiguracja (utrwalona):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Przykładowe bezpośrednie uruchomienie (bez zapisu konfiguracji):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Wybieranie agentów

ACP nie wybiera agentów bezpośrednio. Kieruje według klucza sesji Gateway.

Użyj kluczy sesji z zakresem agenta, aby wskazać konkretnego agenta:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Każda sesja ACP mapuje się na pojedynczy klucz sesji Gateway. Jeden agent może
mieć wiele sesji; ACP domyślnie używa izolowanej sesji `acp:<uuid>`, chyba że
nadpiszesz klucz lub etykietę.

`mcpServers` na sesję nie są obsługiwane w trybie mostu. Jeśli klient ACP
wyśle je podczas `newSession` lub `loadSession`, most zwróci jasny
błąd zamiast po cichu je ignorować.

Jeśli chcesz, aby sesje oparte na ACPX widziały narzędzia Plugin OpenClaw lub wybrane
narzędzia wbudowane, takie jak `cron`, włącz mosty ACPX MCP po stronie Gateway
zamiast próbować przekazywać `mcpServers` na sesję. Zobacz
[Agenci ACP](/pl/tools/acp-agents-setup#plugin-tools-mcp-bridge) oraz
[Most MCP narzędzi OpenClaw](/pl/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Użycie z `acpx` (Codex, Claude, inni klienci ACP)

Jeśli chcesz, aby agent programistyczny, taki jak Codex lub Claude Code, komunikował się z Twoim
botem OpenClaw przez ACP, użyj `acpx` z jego wbudowanym celem `openclaw`.

Typowy przepływ:

1. Uruchom Gateway i upewnij się, że most ACP może się z nim połączyć.
2. Skieruj `acpx openclaw` na `openclaw acp`.
3. Wskaż klucz sesji OpenClaw, którego ma używać agent programistyczny.

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

To najprostszy sposób, aby Codex, Claude Code lub inny klient obsługujący ACP
mógł pobierać informacje kontekstowe z agenta OpenClaw bez zeskrobywania terminala.

## Konfiguracja edytora Zed

Dodaj niestandardowego agenta ACP w `~/.config/zed/settings.json` (albo użyj interfejsu ustawień Zed):

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

W Zed otwórz panel agenta i wybierz „OpenClaw ACP”, aby rozpocząć wątek.

## Mapowanie sesji

Domyślnie sesje ACP otrzymują izolowany klucz sesji Gateway z prefiksem `acp:`.
Aby ponownie użyć znanej sesji, przekaż klucz lub etykietę sesji:

- `--session <key>`: użyj konkretnego klucza sesji Gateway.
- `--session-label <label>`: rozwiąż istniejącą sesję według etykiety.
- `--reset-session`: utwórz świeży identyfikator sesji dla tego klucza (ten sam klucz, nowy transkrypt).

Jeśli Twój klient ACP obsługuje metadane, możesz nadpisać ustawienia dla sesji:

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

- `--url <url>`: adres URL WebSocket Gateway (domyślnie gateway.remote.url, gdy skonfigurowano).
- `--token <token>`: token uwierzytelniania Gateway.
- `--token-file <path>`: odczytaj token uwierzytelniania Gateway z pliku.
- `--password <password>`: hasło uwierzytelniania Gateway.
- `--password-file <path>`: odczytaj hasło uwierzytelniania Gateway z pliku.
- `--session <key>`: domyślny klucz sesji.
- `--session-label <label>`: domyślna etykieta sesji do rozwiązania.
- `--require-existing`: zakończ niepowodzeniem, jeśli klucz/etykieta sesji nie istnieje.
- `--reset-session`: zresetuj klucz sesji przed pierwszym użyciem.
- `--no-prefix-cwd`: nie poprzedzaj promptów katalogiem roboczym.
- `--provenance <off|meta|meta+receipt>`: dołącz metadane pochodzenia ACP lub potwierdzenia.
- `--verbose, -v`: szczegółowe logowanie do stderr.

Uwaga dotycząca bezpieczeństwa:

- `--token` i `--password` mogą być widoczne w lokalnych listach procesów w niektórych systemach.
- Preferuj `--token-file`/`--password-file` lub zmienne środowiskowe (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Rozwiązywanie uwierzytelniania Gateway jest zgodne ze współdzielonym kontraktem używanym przez innych klientów Gateway:
  - tryb lokalny: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` tylko wtedy, gdy `gateway.auth.*` nie jest ustawione (skonfigurowane, ale nierozwiązane lokalne SecretRefs kończą się bezpieczną odmową)
  - tryb zdalny: `gateway.remote.*` z fallbackiem env/config zgodnie z regułami priorytetu zdalnego
  - `--url` jest bezpiecznym nadpisaniem i nie używa ponownie niejawnych poświadczeń z config/env; przekaż jawne `--token`/`--password` (lub warianty plikowe)
- Procesy potomne zaplecza uruchomieniowego ACP otrzymują `OPENCLAW_SHELL=acp`, czego można użyć do reguł powłoki/profilu specyficznych dla kontekstu.
- `openclaw acp client` ustawia `OPENCLAW_SHELL=acp-client` w uruchomionym procesie mostu.

### Opcje `acp client`

- `--cwd <dir>`: katalog roboczy dla sesji ACP.
- `--server <command>`: polecenie serwera ACP (domyślnie: `openclaw`).
- `--server-args <args...>`: dodatkowe argumenty przekazywane do serwera ACP.
- `--server-verbose`: włącz szczegółowe logowanie na serwerze ACP.
- `--verbose, -v`: szczegółowe logowanie klienta.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Agenci ACP](/pl/tools/acp-agents)
