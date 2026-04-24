---
read_when:
    - Konfigurowanie integracji IDE opartych na ACP
    - Debugowanie routingu sesji ACP do Gateway
summary: Uruchom most ACP dla integracji IDE
title: ACP
x-i18n:
    generated_at: "2026-04-24T09:01:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 15
---

Uruchom most [Agent Client Protocol (ACP)](https://agentclientprotocol.com/), który komunikuje się z OpenClaw Gateway.

To polecenie używa ACP przez stdio dla IDE i przekazuje prompty do Gateway
przez WebSocket. Utrzymuje mapowanie sesji ACP na klucze sesji Gateway.

`openclaw acp` to most ACP oparty na Gateway, a nie pełne natywne środowisko
edytora oparte na ACP. Skupia się na routingu sesji, dostarczaniu promptów i
podstawowych aktualizacjach strumieniowania.

Jeśli chcesz, aby zewnętrzny klient MCP komunikował się bezpośrednio z
konwersacjami kanałowymi OpenClaw zamiast hostować sesję harness ACP, użyj
zamiast tego [`openclaw mcp serve`](/pl/cli/mcp).

## Czym to nie jest

Ta strona jest często mylona z sesjami harness ACP.

`openclaw acp` oznacza:

- OpenClaw działa jako serwer ACP
- IDE lub klient ACP łączy się z OpenClaw
- OpenClaw przekazuje tę pracę do sesji Gateway

To różni się od [ACP Agents](/pl/tools/acp-agents), gdzie OpenClaw uruchamia
zewnętrzny harness, taki jak Codex lub Claude Code, przez `acpx`.

Krótka zasada:

- edytor/klient chce rozmawiać z OpenClaw przez ACP: użyj `openclaw acp`
- OpenClaw ma uruchamiać Codex/Claude/Gemini jako harness ACP: użyj `/acp spawn` i [ACP Agents](/pl/tools/acp-agents)

## Macierz zgodności

| Obszar ACP                                                            | Status      | Uwagi                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Zaimplementowane | Główny przepływ mostu przez stdio do Gateway chat/send + abort.                                                                                                                                                                                   |
| `listSessions`, polecenia slash                                       | Zaimplementowane | Lista sesji działa na stanie sesji Gateway; polecenia są reklamowane przez `available_commands_update`.                                                                                                                                          |
| `loadSession`                                                         | Częściowe   | Ponownie wiąże sesję ACP z kluczem sesji Gateway i odtwarza zapisaną historię tekstu użytkownika/asystenta. Historia narzędzi/systemu nie jest jeszcze odtwarzana.                                                                            |
| Zawartość promptu (`text`, osadzony `resource`, obrazy)               | Częściowe   | Tekst/zasoby są spłaszczane do danych wejściowych czatu; obrazy stają się załącznikami Gateway.                                                                                                                                                  |
| Tryby sesji                                                           | Częściowe   | `session/set_mode` jest obsługiwane, a most udostępnia początkowe kontrolki sesji oparte na Gateway dla poziomu myślenia, szczegółowości narzędzi, rozumowania, szczegółów użycia i działań podwyższonych uprawnień. Szersze natywne powierzchnie trybu/konfiguracji ACP nadal są poza zakresem. |
| Informacje o sesji i aktualizacje użycia                              | Częściowe   | Most emituje powiadomienia `session_info_update` i best-effort `usage_update` z buforowanych migawek sesji Gateway. Użycie jest przybliżone i wysyłane tylko wtedy, gdy sumy tokenów Gateway są oznaczone jako aktualne.                      |
| Strumieniowanie narzędzi                                              | Częściowe   | Zdarzenia `tool_call` / `tool_call_update` zawierają surowe I/O, zawartość tekstową i best-effort lokalizacje plików, gdy argumenty/wyniki narzędzi Gateway je ujawniają. Osadzone terminale i bogatsze natywne dane wyjściowe diff nadal nie są ujawniane. |
| Serwery MCP per session (`mcpServers`)                                | Nieobsługiwane | Tryb mostu odrzuca żądania serwerów MCP per session. Skonfiguruj MCP na Gateway lub agencie OpenClaw.                                                                                                                                           |
| Metody systemu plików klienta (`fs/read_text_file`, `fs/write_text_file`) | Nieobsługiwane | Most nie wywołuje metod systemu plików klienta ACP.                                                                                                                                                                                               |
| Metody terminala klienta (`terminal/*`)                               | Nieobsługiwane | Most nie tworzy terminali klienta ACP ani nie strumieniuje identyfikatorów terminali przez wywołania narzędzi.                                                                                                                                  |
| Plany sesji / strumieniowanie myśli                                   | Nieobsługiwane | Most obecnie emituje tekst wyjściowy i status narzędzi, a nie aktualizacje planu lub myśli ACP.                                                                                                                                                  |

## Znane ograniczenia

- `loadSession` odtwarza zapisaną historię tekstową użytkownika i asystenta, ale nie
  odtwarza historycznych wywołań narzędzi, komunikatów systemowych ani bogatszych
  natywnych typów zdarzeń ACP.
- Jeśli wielu klientów ACP współdzieli ten sam klucz sesji Gateway, routing
  zdarzeń i anulowania działa best-effort, a nie jest ściśle izolowany per
  klient. Preferuj domyślne izolowane sesje `acp:<uuid>`, gdy potrzebujesz
  czystych lokalnych tur edytora.
- Stany zatrzymania Gateway są tłumaczone na przyczyny zatrzymania ACP, ale to mapowanie
  jest mniej ekspresyjne niż w pełni natywne środowisko ACP.
- Początkowe kontrolki sesji obecnie udostępniają ukierunkowany podzbiór ustawień Gateway:
  poziom myślenia, szczegółowość narzędzi, rozumowanie, szczegóły użycia oraz
  działania podwyższonych uprawnień. Wybór modelu i sterowanie hostem wykonawczym
  nie są jeszcze udostępniane jako opcje konfiguracji ACP.
- `session_info_update` i `usage_update` są wyprowadzane z migawek sesji Gateway,
  a nie z natywnego rozliczania środowiska ACP na żywo. Użycie jest przybliżone,
  nie zawiera danych o kosztach i jest emitowane tylko wtedy, gdy Gateway oznaczy
  całkowite dane tokenów jako aktualne.
- Dane follow-along narzędzi działają best-effort. Most może ujawniać ścieżki plików,
  które pojawiają się w znanych argumentach/wynikach narzędzi, ale nie emituje jeszcze
  terminali ACP ani ustrukturyzowanych diffów plików.

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

Użyj wbudowanego klienta ACP, aby sprawdzić most bez IDE.
Uruchamia on most ACP i pozwala interaktywnie wpisywać prompty.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Model uprawnień (tryb debugowania klienta):

- Automatyczne zatwierdzanie opiera się na allowliście i dotyczy tylko zaufanych identyfikatorów podstawowych narzędzi.
- Automatyczne zatwierdzanie `read` jest ograniczone do bieżącego katalogu roboczego (`--cwd`, gdy jest ustawione).
- ACP automatycznie zatwierdza tylko wąskie klasy tylko-do-odczytu: ograniczone wywołania `read` w aktywnym cwd oraz narzędzia wyszukiwania tylko-do-odczytu (`search`, `web_search`, `memory_search`). Nieznane/niepodstawowe narzędzia, odczyty spoza zakresu, narzędzia zdolne do wykonywania poleceń, narzędzia płaszczyzny sterowania, narzędzia modyfikujące i przepływy interaktywne zawsze wymagają jawnego zatwierdzenia w prompcie.
- Dostarczone przez serwer `toolCall.kind` jest traktowane jako niezaufane metadane (nie jako źródło autoryzacji).
- Ta polityka mostu ACP jest oddzielna od uprawnień harness ACPX. Jeśli uruchamiasz OpenClaw przez backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` jest awaryjnym przełącznikiem „yolo” dla tej sesji harness.

## Jak tego używać

Użyj ACP, gdy IDE (lub inny klient) obsługuje Agent Client Protocol i chcesz,
aby sterowało sesją OpenClaw Gateway.

1. Upewnij się, że Gateway działa (lokalnie lub zdalnie).
2. Skonfiguruj cel Gateway (konfiguracja lub flagi).
3. Skieruj IDE tak, aby uruchamiało `openclaw acp` przez stdio.

Przykładowa konfiguracja (trwale zapisana):

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

ACP nie wybiera agentów bezpośrednio. Trasuje według klucza sesji Gateway.

Użyj kluczy sesji z zakresem agenta, aby wskazać konkretnego agenta:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Każda sesja ACP mapuje się na pojedynczy klucz sesji Gateway. Jeden agent może mieć
wiele sesji; ACP domyślnie używa izolowanej sesji `acp:<uuid>`, chyba że nadpiszesz
klucz lub etykietę.

`mcpServers` per session nie są obsługiwane w trybie mostu. Jeśli klient ACP
wyśle je podczas `newSession` lub `loadSession`, most zwróci jasny
błąd zamiast cicho je ignorować.

Jeśli chcesz, aby sesje oparte na ACPX widziały narzędzia Plugin OpenClaw lub wybrane
narzędzia wbudowane, takie jak `cron`, włącz mosty MCP ACPX po stronie Gateway
zamiast próbować przekazywać `mcpServers` per session. Zobacz
[ACP Agents](/pl/tools/acp-agents-setup#plugin-tools-mcp-bridge) i
[OpenClaw tools MCP bridge](/pl/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Użycie z `acpx` (Codex, Claude, inni klienci ACP)

Jeśli chcesz, aby agent kodujący, taki jak Codex lub Claude Code, komunikował się z Twoim
botem OpenClaw przez ACP, użyj `acpx` z wbudowanym celem `openclaw`.

Typowy przepływ:

1. Uruchom Gateway i upewnij się, że most ACP może się z nim połączyć.
2. Skieruj `acpx openclaw` na `openclaw acp`.
3. Wskaż klucz sesji OpenClaw, którego agent kodujący ma używać.

Przykłady:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Jeśli chcesz, aby `acpx openclaw` za każdym razem kierował ruch do określonego Gateway i klucza sesji,
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

W przypadku lokalnego checkoutu OpenClaw użyj bezpośredniego punktu wejścia CLI zamiast
uruchamiacza deweloperskiego, aby strumień ACP pozostał czysty. Na przykład:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

To najłatwiejszy sposób, aby pozwolić Codex, Claude Code lub innemu klientowi obsługującemu ACP
pobierać informacje kontekstowe z agenta OpenClaw bez skrobania terminala.

## Konfiguracja edytora Zed

Dodaj niestandardowego agenta ACP w `~/.config/zed/settings.json` (lub użyj interfejsu Settings w Zed):

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

W Zed otwórz panel Agent i wybierz „OpenClaw ACP”, aby rozpocząć wątek.

## Mapowanie sesji

Domyślnie sesje ACP otrzymują izolowany klucz sesji Gateway z prefiksem `acp:`.
Aby ponownie użyć znanej sesji, przekaż klucz sesji lub etykietę:

- `--session <key>`: użyj konkretnego klucza sesji Gateway.
- `--session-label <label>`: rozwiąż istniejącą sesję według etykiety.
- `--reset-session`: wygeneruj nowy identyfikator sesji dla tego klucza (ten sam klucz, nowy transkrypt).

Jeśli klient ACP obsługuje metadane, możesz nadpisać to per session:

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

- `--url <url>`: URL WebSocket Gateway (domyślnie `gateway.remote.url`, jeśli skonfigurowano).
- `--token <token>`: token uwierzytelniania Gateway.
- `--token-file <path>`: odczytaj token uwierzytelniania Gateway z pliku.
- `--password <password>`: hasło uwierzytelniania Gateway.
- `--password-file <path>`: odczytaj hasło uwierzytelniania Gateway z pliku.
- `--session <key>`: domyślny klucz sesji.
- `--session-label <label>`: domyślna etykieta sesji do rozwiązania.
- `--require-existing`: zakończ błędem, jeśli klucz/etykieta sesji nie istnieje.
- `--reset-session`: zresetuj klucz sesji przed pierwszym użyciem.
- `--no-prefix-cwd`: nie poprzedzaj promptów katalogiem roboczym.
- `--provenance <off|meta|meta+receipt>`: dołącz metadane pochodzenia ACP lub potwierdzenia.
- `--verbose, -v`: szczegółowe logowanie do stderr.

Uwaga dotycząca bezpieczeństwa:

- `--token` i `--password` mogą być widoczne w lokalnych listach procesów na niektórych systemach.
- Preferuj `--token-file`/`--password-file` lub zmienne środowiskowe (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Rozwiązywanie uwierzytelniania Gateway jest zgodne ze współdzielonym kontraktem używanym przez innych klientów Gateway:
  - tryb lokalny: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> awaryjny powrót do `gateway.remote.*` tylko wtedy, gdy `gateway.auth.*` nie jest ustawione (skonfigurowane, ale nierozwiązane lokalne SecretRefs kończą się bezpieczną odmową)
  - tryb zdalny: `gateway.remote.*` z awaryjnym powrotem env/config zgodnie z regułami pierwszeństwa trybu zdalnego
  - `--url` bezpiecznie nadpisuje ustawienia i nie używa ponownie niejawnych poświadczeń config/env; przekaż jawne `--token`/`--password` (lub warianty plikowe)
- Procesy podrzędne backendu środowiska uruchomieniowego ACP otrzymują `OPENCLAW_SHELL=acp`, co może być używane do reguł powłoki/profilu specyficznych dla kontekstu.
- `openclaw acp client` ustawia `OPENCLAW_SHELL=acp-client` w uruchomionym procesie mostu.

### Opcje `acp client`

- `--cwd <dir>`: katalog roboczy dla sesji ACP.
- `--server <command>`: polecenie serwera ACP (domyślnie: `openclaw`).
- `--server-args <args...>`: dodatkowe argumenty przekazywane do serwera ACP.
- `--server-verbose`: włącz szczegółowe logowanie na serwerze ACP.
- `--verbose, -v`: szczegółowe logowanie klienta.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [ACP agents](/pl/tools/acp-agents)
