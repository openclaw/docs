---
read_when:
    - Konfigurowanie integracji IDE opartych na ACP
    - Debugowanie routingu sesji ACP do Gateway
summary: Uruchamianie mostu ACP dla integracji z IDE
title: ACP
x-i18n:
    generated_at: "2026-05-06T09:04:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91de534078b4d49b2776d7a85264d2ba8d7bdd7a3cd715ce615b4b4b26c6528
    source_path: cli/acp.md
    workflow: 16
---

Uruchom most [Protokołu klienta agenta (ACP)](https://agentclientprotocol.com/), który komunikuje się z OpenClaw Gateway.

To polecenie komunikuje się przez ACP przez stdio dla IDE i przekazuje prompty do Gateway
przez WebSocket. Utrzymuje mapowanie sesji ACP na klucze sesji Gateway.

`openclaw acp` to most ACP oparty na Gateway, a nie pełne, natywne dla ACP
środowisko wykonawcze edytora. Koncentruje się na trasowaniu sesji, dostarczaniu
promptów i podstawowych aktualizacjach strumieniowych.

Jeśli chcesz, aby zewnętrzny klient MCP komunikował się bezpośrednio z
konwersacjami kanałów OpenClaw zamiast hostować sesję uprzęży ACP, użyj zamiast tego
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

- edytor/klient chce rozmawiać przez ACP z OpenClaw: użyj `openclaw acp`
- OpenClaw ma uruchamiać Codex/Claude/Gemini jako uprząż ACP: użyj `/acp spawn` i [Agentów ACP](/pl/tools/acp-agents)

## Macierz zgodności

| Obszar ACP                                                            | Status      | Uwagi                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Wdrożone    | Główny przepływ mostu przez stdio do chat/send + abort w Gateway.                                                                                                                                                                                |
| `listSessions`, polecenia ukośnikowe                                  | Wdrożone    | Lista sesji działa względem stanu sesji Gateway; polecenia są ogłaszane przez `available_commands_update`.                                                                                                                                       |
| `loadSession`                                                         | Częściowe   | Ponownie wiąże sesję ACP z kluczem sesji Gateway i odtwarza zapisaną historię tekstową użytkownika/asystenta. Historia narzędzi/systemowa nie jest jeszcze rekonstruowana.                                                                       |
| Treść promptu (`text`, osadzony `resource`, obrazy)                   | Częściowe   | Tekst/zasoby są spłaszczane do wejścia czatu; obrazy stają się załącznikami Gateway.                                                                                                                                                             |
| Tryby sesji                                                           | Częściowe   | `session/set_mode` jest obsługiwane, a most udostępnia początkowe kontrolki sesji oparte na Gateway dla poziomu myślenia, szczegółowości narzędzi, rozumowania, szczegółów użycia i działań podwyższonych. Szersze, natywne dla ACP powierzchnie trybów/konfiguracji nadal są poza zakresem. |
| Informacje o sesji i aktualizacje użycia                              | Częściowe   | Most emituje powiadomienia `session_info_update` i najlepsze możliwe `usage_update` z buforowanych migawek sesji Gateway. Użycie jest przybliżone i wysyłane tylko wtedy, gdy łączne tokeny Gateway są oznaczone jako świeże.                  |
| Strumieniowanie narzędzi                                              | Częściowe   | Zdarzenia `tool_call` / `tool_call_update` zawierają surowe I/O, treść tekstową i najlepsze możliwe lokalizacje plików, gdy argumenty/wyniki narzędzi Gateway je ujawniają. Osadzone terminale i bogatsze dane wyjściowe natywne dla diffów nadal nie są udostępniane. |
| Serwery MCP na sesję (`mcpServers`)                                   | Nieobsługiwane | Tryb mostu odrzuca żądania serwerów MCP na sesję. Skonfiguruj MCP na gateway OpenClaw lub agencie.                                                                                                                                               |
| Metody systemu plików klienta (`fs/read_text_file`, `fs/write_text_file`) | Nieobsługiwane | Most nie wywołuje metod systemu plików klienta ACP.                                                                                                                                                                                              |
| Metody terminala klienta (`terminal/*`)                               | Nieobsługiwane | Most nie tworzy terminali klienta ACP ani nie strumieniuje identyfikatorów terminali przez wywołania narzędzi.                                                                                                                                   |
| Plany sesji / strumieniowanie myśli                                   | Nieobsługiwane | Most obecnie emituje tekst wyjściowy i status narzędzi, a nie aktualizacje planu ani myśli ACP.                                                                                                                                                  |

## Znane ograniczenia

- `loadSession` odtwarza zapisaną historię tekstową użytkownika i asystenta, ale nie
  rekonstruuje historycznych wywołań narzędzi, powiadomień systemowych ani bogatszych,
  natywnych dla ACP typów zdarzeń.
- Jeśli wielu klientów ACP współdzieli ten sam klucz sesji Gateway, trasowanie zdarzeń
  i anulowań działa w trybie najlepszych starań, a nie w ścisłej izolacji na klienta.
  Preferuj domyślne, izolowane sesje `acp:<uuid>`, gdy potrzebujesz czystych,
  lokalnych dla edytora tur.
- Stany zatrzymania Gateway są tłumaczone na powody zatrzymania ACP, ale to mapowanie
  jest mniej ekspresyjne niż w pełni natywne dla ACP środowisko wykonawcze.
- Początkowe kontrolki sesji obecnie udostępniają skupiony podzbiór pokręteł Gateway:
  poziom myślenia, szczegółowość narzędzi, rozumowanie, szczegóły użycia i działania
  podwyższone. Wybór modelu i kontrolki hosta exec nie są jeszcze udostępnione jako
  opcje konfiguracji ACP.
- `session_info_update` i `usage_update` są wyprowadzane z migawek sesji Gateway,
  a nie z księgowania środowiska wykonawczego natywnego dla ACP na żywo. Użycie jest
  przybliżone, nie zawiera danych o kosztach i jest emitowane tylko wtedy, gdy Gateway
  oznacza łączne dane tokenów jako świeże.
- Dane podążania za narzędziem są najlepszym możliwym przybliżeniem. Most może
  ujawniać ścieżki plików pojawiające się w znanych argumentach/wynikach narzędzi,
  ale nie emituje jeszcze terminali ACP ani strukturalnych diffów plików.

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

Użyj wbudowanego klienta ACP, aby sprawdzić sensowność mostu bez IDE.
Uruchamia on most ACP i pozwala interaktywnie wpisywać prompty.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Model uprawnień (tryb debugowania klienta):

- Automatyczne zatwierdzanie jest oparte na liście dozwolonych i dotyczy tylko zaufanych identyfikatorów narzędzi rdzenia.
- Automatyczne zatwierdzanie `read` jest ograniczone do bieżącego katalogu roboczego (`--cwd`, gdy ustawione).
- ACP automatycznie zatwierdza tylko wąskie klasy tylko do odczytu: ograniczone wywołania `read` w aktywnym cwd oraz narzędzia wyszukiwania tylko do odczytu (`search`, `web_search`, `memory_search`). Nieznane narzędzia/spoza rdzenia, odczyty poza zakresem, narzędzia zdolne do exec, narzędzia płaszczyzny sterowania, narzędzia modyfikujące i przepływy interaktywne zawsze wymagają jawnej zgody w prompcie.
- Dostarczone przez serwer `toolCall.kind` jest traktowane jako niezaufane metadane (nie jako źródło autoryzacji).
- Ta polityka mostu ACP jest oddzielna od uprawnień uprzęży ACPX. Jeśli uruchamiasz OpenClaw przez backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` jest przełącznikiem awaryjnym „yolo” dla tej sesji uprzęży.

## Jak tego używać

Użyj ACP, gdy IDE (lub inny klient) komunikuje się przez Agent Client Protocol i chcesz,
aby sterowało sesją OpenClaw Gateway.

1. Upewnij się, że Gateway działa (lokalnie lub zdalnie).
2. Skonfiguruj cel Gateway (konfiguracja lub flagi).
3. Skieruj swoje IDE, aby uruchamiało `openclaw acp` przez stdio.

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

ACP nie wybiera agentów bezpośrednio. Trasuje według klucza sesji Gateway.

Użyj kluczy sesji z zakresem agenta, aby skierować ruch do konkretnego agenta:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Każda sesja ACP mapuje się na jeden klucz sesji Gateway. Jeden agent może mieć wiele
sesji; ACP domyślnie używa izolowanej sesji `acp:<uuid>`, chyba że nadpiszesz
klucz lub etykietę.

`mcpServers` na sesję nie są obsługiwane w trybie mostu. Jeśli klient ACP
wyśle je podczas `newSession` lub `loadSession`, most zwróci jasny błąd
zamiast po cichu je ignorować.

Jeśli chcesz, aby sesje oparte na ACPX widziały narzędzia Plugin OpenClaw lub wybrane
wbudowane narzędzia, takie jak `cron`, włącz mosty MCP ACPX po stronie gateway
zamiast próbować przekazywać `mcpServers` na sesję. Zobacz
[Agentów ACP](/pl/tools/acp-agents-setup#plugin-tools-mcp-bridge) i
[most MCP narzędzi OpenClaw](/pl/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Użycie z `acpx` (Codex, Claude, inni klienci ACP)

Jeśli chcesz, aby agent kodujący, taki jak Codex lub Claude Code, rozmawiał z twoim
botem OpenClaw przez ACP, użyj `acpx` z jego wbudowanym celem `openclaw`.

Typowy przepływ:

1. Uruchom Gateway i upewnij się, że most ACP może go osiągnąć.
2. Skieruj `acpx openclaw` na `openclaw acp`.
3. Wybierz klucz sesji OpenClaw, którego ma używać agent kodujący.

Przykłady:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Jeśli chcesz, aby `acpx openclaw` za każdym razem celował w konkretny Gateway
i klucz sesji, nadpisz polecenie agenta `openclaw` w `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Dla lokalnego checkoutu repo OpenClaw użyj bezpośredniego punktu wejścia CLI zamiast
uruchamiacza dev, aby strumień ACP pozostał czysty. Na przykład:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

To najprostszy sposób, aby pozwolić Codex, Claude Code lub innemu klientowi
świadomemu ACP pobierać informacje kontekstowe z agenta OpenClaw bez scrapowania terminala.

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

W Zed otwórz panel Agent i wybierz „OpenClaw ACP”, aby rozpocząć wątek.

## Mapowanie sesji

Domyślnie sesje ACP otrzymują izolowany klucz sesji Gateway z prefiksem `acp:`.
Aby ponownie użyć znanej sesji, przekaż klucz sesji lub etykietę:

- `--session <key>`: użyj konkretnego klucza sesji Gateway.
- `--session-label <label>`: rozwiąż istniejącą sesję według etykiety.
- `--reset-session`: utwórz świeży identyfikator sesji dla tego klucza (ten sam klucz, nowy transkrypt).

Jeśli klient ACP obsługuje metadane, możesz nadpisać ustawienia dla danej sesji:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Dowiedz się więcej o kluczach sesji na stronie [/concepts/session](/pl/concepts/session).

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
- `--provenance <off|meta|meta+receipt>`: dołącz metadane lub potwierdzenia pochodzenia ACP.
- `--verbose, -v`: szczegółowe logowanie do stderr.

Uwaga dotycząca bezpieczeństwa:

- `--token` i `--password` mogą być widoczne w lokalnych listach procesów na niektórych systemach.
- Preferuj `--token-file`/`--password-file` lub zmienne środowiskowe (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Rozwiązywanie uwierzytelniania Gateway odbywa się zgodnie ze współdzielonym kontraktem używanym przez innych klientów Gateway:
  - tryb lokalny: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> awaryjnie `gateway.remote.*` tylko wtedy, gdy `gateway.auth.*` nie jest ustawione (skonfigurowane, ale nierozwiązane lokalne SecretRefs kończą się zamknięciem)
  - tryb zdalny: `gateway.remote.*` z awaryjnym env/config według zdalnych reguł pierwszeństwa
  - `--url` jest bezpiecznym nadpisaniem i nie używa ponownie niejawnych poświadczeń config/env; przekaż jawne `--token`/`--password` (lub warianty plikowe)
- Procesy potomne zaplecza wykonawczego ACP otrzymują `OPENCLAW_SHELL=acp`, którego można użyć do reguł shell/profile specyficznych dla kontekstu.
- `openclaw acp client` ustawia `OPENCLAW_SHELL=acp-client` w uruchomionym procesie pomostowym.

### Opcje `acp client`

- `--cwd <dir>`: katalog roboczy sesji ACP.
- `--server <command>`: polecenie serwera ACP (domyślnie: `openclaw`).
- `--server-args <args...>`: dodatkowe argumenty przekazywane do serwera ACP.
- `--server-verbose`: włącz szczegółowe logowanie na serwerze ACP.
- `--verbose, -v`: szczegółowe logowanie klienta.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Agenci ACP](/pl/tools/acp-agents)
