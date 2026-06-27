---
read_when:
    - Konfigurowanie integracji IDE opartych na ACP
    - Debugowanie routingu sesji ACP do Gateway
summary: Uruchom most ACP dla integracji IDE
title: ACP
x-i18n:
    generated_at: "2026-06-27T17:18:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

Uruchamia most [Agent Client Protocol (ACP)](https://agentclientprotocol.com/), który komunikuje się z OpenClaw Gateway.

To polecenie obsługuje ACP przez stdio dla IDE i przekazuje prompty do Gateway
przez WebSocket. Utrzymuje mapowanie sesji ACP na klucze sesji Gateway.

`openclaw acp` to most ACP wspierany przez Gateway, a nie pełne środowisko
uruchomieniowe edytora natywnie obsługujące ACP. Koncentruje się na routingu
sesji, dostarczaniu promptów i podstawowych aktualizacjach strumieniowych.

Jeśli chcesz, aby zewnętrzny klient MCP komunikował się bezpośrednio z
konwersacjami kanałów OpenClaw zamiast hostować sesję harnessa ACP, użyj zamiast
tego [`openclaw mcp serve`](/pl/cli/mcp).

## Czym to nie jest

Ta strona jest często mylona z sesjami harnessa ACP.

`openclaw acp` oznacza:

- OpenClaw działa jako serwer ACP
- IDE lub klient ACP łączy się z OpenClaw
- OpenClaw przekazuje tę pracę do sesji Gateway

To różni się od [Agentów ACP](/pl/tools/acp-agents), gdzie OpenClaw uruchamia
zewnętrzny harness, taki jak Codex lub Claude Code, przez `acpx`.

Szybka reguła:

- edytor/klient chce komunikować się z OpenClaw przez ACP: użyj `openclaw acp`
- OpenClaw ma uruchomić Codex/Claude/Gemini jako harness ACP: użyj `/acp spawn` i [Agentów ACP](/pl/tools/acp-agents)

## Macierz zgodności

| Obszar ACP                                                            | Status           | Uwagi                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Zaimplementowane | Główny przepływ mostu przez stdio do czatu/wysyłki Gateway oraz anulowania.                                                                                                                                                                             |
| `listSessions`, polecenia slash                                       | Zaimplementowane | Lista sesji działa na stanie sesji Gateway z ograniczoną paginacją kursorem i filtrowaniem `cwd`, gdy wiersze sesji Gateway zawierają metadane obszaru roboczego; polecenia są ogłaszane przez `available_commands_update`.                             |
| Metadane pochodzenia sesji                                            | Zaimplementowane | Listy sesji i migawki informacji o sesji zawierają pochodzenie nadrzędne i podrzędne OpenClaw w `_meta`, aby klienci ACP mogli renderować grafy podagentów bez prywatnych kanałów bocznych Gateway.                                                     |
| `resumeSession`, `closeSession`                                       | Zaimplementowane | Wznowienie ponownie wiąże sesję ACP z istniejącą sesją Gateway bez odtwarzania historii. Zamknięcie anuluje aktywną pracę mostu, rozwiązuje oczekujące prompty jako anulowane i zwalnia stan sesji mostu.                                              |
| `loadSession`                                                         | Częściowe        | Ponownie wiąże sesję ACP z kluczem sesji Gateway i odtwarza historię księgi zdarzeń ACP dla sesji utworzonych przez most. Starsze sesje lub sesje bez księgi wracają do zapisanego tekstu użytkownika/asystenta.                                        |
| Treść promptu (`text`, osadzony `resource`, obrazy)                   | Częściowe        | Tekst/zasoby są spłaszczane do wejścia czatu; obrazy stają się załącznikami Gateway.                                                                                                                                                                   |
| Tryby sesji                                                           | Częściowe        | `session/set_mode` jest obsługiwane, a most udostępnia początkowe kontrolki sesji wspierane przez Gateway dla poziomu myślenia, szczegółowości narzędzi, rozumowania, szczegółów użycia i działań podwyższonych. Szersze natywne powierzchnie trybu/konfiguracji ACP pozostają poza zakresem. |
| Informacje o sesji i aktualizacje użycia                              | Częściowe        | Most emituje powiadomienia `session_info_update` i najlepszym staraniem `usage_update` z buforowanych migawek sesji Gateway. Użycie jest przybliżone i wysyłane tylko wtedy, gdy sumy tokenów Gateway są oznaczone jako świeże.                         |
| Strumieniowanie narzędzi                                              | Częściowe        | Zdarzenia `tool_call` / `tool_call_update` zawierają surowe wejście/wyjście, treść tekstową i najlepszym staraniem lokalizacje plików, gdy argumenty/wyniki narzędzi Gateway je ujawniają. Osadzone terminale i bogatsze wyjście natywne dla diffów nadal nie są udostępniane. |
| Zatwierdzenia exec                                                    | Częściowe        | Prompty zatwierdzeń exec Gateway podczas aktywnych tur promptu ACP są przekazywane do klienta ACP za pomocą `session/request_permission`.                                                                                                               |
| Serwery MCP na sesję (`mcpServers`)                                   | Nieobsługiwane   | Tryb mostu odrzuca żądania serwera MCP na sesję. Zamiast tego skonfiguruj MCP na gatewayu lub agencie OpenClaw.                                                                                                                                         |
| Metody systemu plików klienta (`fs/read_text_file`, `fs/write_text_file`) | Nieobsługiwane   | Most nie wywołuje metod systemu plików klienta ACP.                                                                                                                                                                                                    |
| Metody terminala klienta (`terminal/*`)                               | Nieobsługiwane   | Most nie tworzy terminali klienta ACP ani nie strumieniuje identyfikatorów terminali przez wywołania narzędzi.                                                                                                                                          |
| Plany sesji / strumieniowanie myśli                                   | Nieobsługiwane   | Most obecnie emituje tekst wyjściowy i status narzędzi, a nie aktualizacje planu lub myśli ACP.                                                                                                                                                        |

## Znane ograniczenia

- `loadSession` może odtworzyć pełną historię księgi zdarzeń ACP tylko dla
  sesji utworzonych przez most. Starsze sesje lub sesje bez księgi nadal
  używają awaryjnego transkryptu i nie rekonstruują historycznych wywołań
  narzędzi ani komunikatów systemowych.
- Jeśli wielu klientów ACP współdzieli ten sam klucz sesji Gateway, routing
  zdarzeń i anulowań odbywa się najlepszym staraniem, a nie w ścisłej izolacji
  dla każdego klienta. Gdy potrzebujesz czystych tur lokalnych dla edytora,
  preferuj domyślne izolowane sesje `acp-bridge:<uuid>`.
- Stany zatrzymania Gateway są tłumaczone na powody zatrzymania ACP, ale to
  mapowanie jest mniej ekspresyjne niż w pełni natywne środowisko uruchomieniowe ACP.
- Początkowe kontrolki sesji obecnie udostępniają skupiony podzbiór ustawień
  Gateway: poziom myślenia, szczegółowość narzędzi, rozumowanie, szczegóły
  użycia i działania podwyższone. Wybór modelu i kontrolki hosta exec nie są
  jeszcze udostępniane jako opcje konfiguracji ACP.
- `session_info_update` i `usage_update` są wyprowadzane z migawek sesji Gateway,
  a nie z rozliczeń natywnego środowiska uruchomieniowego ACP na żywo. Użycie
  jest przybliżone, nie zawiera danych o koszcie i jest emitowane tylko wtedy,
  gdy Gateway oznaczy łączne dane tokenów jako świeże.
- Dane śledzenia narzędzi są dostarczane najlepszym staraniem. Most może
  udostępniać ścieżki plików, które pojawiają się w znanych argumentach/wynikach
  narzędzi, ale jeszcze nie emituje terminali ACP ani strukturalnych diffów plików.
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

Użyj wbudowanego klienta ACP, aby sprawdzić poprawność mostu bez IDE.
Uruchamia most ACP i pozwala wpisywać prompty interaktywnie.

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
- ACP automatycznie zatwierdza tylko wąskie klasy tylko do odczytu: zakresowe wywołania `read` pod aktywnym cwd oraz narzędzia wyszukiwania tylko do odczytu (`search`, `web_search`, `memory_search`). Nieznane narzędzia lub narzędzia spoza core, odczyty poza zakresem, narzędzia zdolne do exec, narzędzia control-plane, narzędzia modyfikujące i przepływy interaktywne zawsze wymagają jawnego zatwierdzenia promptu.
- Dostarczone przez serwer `toolCall.kind` jest traktowane jako niezaufane metadane (nie jako źródło autoryzacji).
- Ta polityka mostu ACP jest oddzielna od uprawnień harnessa ACPX. Jeśli uruchamiasz OpenClaw przez backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` jest awaryjnym przełącznikiem „yolo” dla tej sesji harnessa.

## Test dymny protokołu

Do debugowania na poziomie protokołu uruchom Gateway z izolowanym stanem i steruj
`openclaw acp` przez stdio za pomocą klienta ACP JSON-RPC. Obejmij `initialize`,
`session/new`, `session/list` z bezwzględnym `cwd`, `session/resume`,
`session/close`, podwójne zamknięcie i brakujące wznowienie.

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
Ta ścieżka CLI może zażądać podwyższenia zakresu operatora fresh-token;
poprawność mostu ACP potwierdzają ramki stdio ACP wraz z logiem Gateway
`sessions.list`.

## Jak tego używać

Użyj ACP, gdy IDE (lub inny klient) obsługuje Agent Client Protocol i chcesz,
aby sterował sesją OpenClaw Gateway.

1. Upewnij się, że Gateway działa (lokalnie lub zdalnie).
2. Skonfiguruj cel Gateway (konfiguracją lub flagami).
3. Skieruj IDE, aby uruchamiało `openclaw acp` przez stdio.

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

ACP nie wybiera agentów bezpośrednio. Kieruje ruch według klucza sesji Gateway.

Użyj kluczy sesji z zakresem agenta, aby wskazać konkretnego agenta:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Każda sesja ACP mapuje się na pojedynczy klucz sesji Gateway. Jeden agent może mieć wiele
sesji; ACP domyślnie używa izolowanej sesji `acp-bridge:<uuid>`, chyba że nadpiszesz
klucz lub etykietę.

`mcpServers` dla poszczególnych sesji nie są obsługiwane w trybie mostka. Jeśli klient ACP
wyśle je podczas `newSession` lub `loadSession`, mostek zwróci jasny
błąd zamiast po cichu je ignorować.

Jeśli chcesz, aby sesje oparte na ACPX widziały narzędzia Plugin OpenClaw lub wybrane
wbudowane narzędzia, takie jak `cron`, włącz mostki ACPX MCP po stronie Gateway zamiast
próbować przekazywać `mcpServers` dla poszczególnych sesji. Zobacz
[Agenty ACP](/pl/tools/acp-agents-setup#plugin-tools-mcp-bridge) oraz
[Mostek MCP narzędzi OpenClaw](/pl/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Użycie z `acpx` (Codex, Claude, inni klienci ACP)

Jeśli chcesz, aby agent programistyczny, taki jak Codex lub Claude Code, komunikował się z Twoim
botem OpenClaw przez ACP, użyj `acpx` z jego wbudowanym celem `openclaw`.

Typowy przepływ:

1. Uruchom Gateway i upewnij się, że mostek ACP może się z nim połączyć.
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

W przypadku lokalnego checkoutu OpenClaw w repozytorium użyj bezpośredniego punktu wejścia CLI zamiast
uruchamiacza deweloperskiego, aby strumień ACP pozostał czysty. Na przykład:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

To najprostszy sposób, aby Codex, Claude Code lub inny klient obsługujący ACP
mógł pobierać informacje kontekstowe z agenta OpenClaw bez scrapowania terminala.

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

W Zed otwórz panel Agent i wybierz „OpenClaw ACP”, aby rozpocząć wątek.

## Mapowanie sesji

Domyślnie sesje mostka ACP otrzymują izolowany klucz sesji Gateway z
prefiksem `acp-bridge:`. Te sesje mostka normalnego modelu są syntetyczne i
podlegają przycinaniu nieaktualnych wpisów oraz limitom liczby wpisów. Aby ponownie użyć znanej sesji,
przekaż klucz sesji lub etykietę:

- `--session <key>`: użyj konkretnego klucza sesji Gateway.
- `--session-label <label>`: rozwiąż istniejącą sesję według etykiety.
- `--reset-session`: utwórz świeży identyfikator sesji dla tego klucza (ten sam klucz, nowy transkrypt).

Jeśli Twój klient ACP obsługuje metadane, możesz nadpisać ustawienia dla danej sesji:

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

- `--url <url>`: adres URL WebSocket Gateway (domyślnie `gateway.remote.url`, gdy jest skonfigurowany).
- `--token <token>`: token uwierzytelniania Gateway.
- `--token-file <path>`: odczytaj token uwierzytelniania Gateway z pliku.
- `--password <password>`: hasło uwierzytelniania Gateway.
- `--password-file <path>`: odczytaj hasło uwierzytelniania Gateway z pliku.
- `--session <key>`: domyślny klucz sesji.
- `--session-label <label>`: domyślna etykieta sesji do rozwiązania.
- `--require-existing`: zakończ błędem, jeśli klucz/etykieta sesji nie istnieje.
- `--reset-session`: zresetuj klucz sesji przed pierwszym użyciem.
- `--no-prefix-cwd`: nie dodawaj katalogu roboczego jako prefiksu promptów.
- `--provenance <off|meta|meta+receipt>`: uwzględnij metadane pochodzenia ACP lub potwierdzenia.
- `--verbose, -v`: szczegółowe logowanie do stderr.

Uwaga dotycząca bezpieczeństwa:

- `--token` i `--password` mogą być widoczne w lokalnych listach procesów w niektórych systemach.
- Preferuj `--token-file`/`--password-file` lub zmienne środowiskowe (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Rozwiązywanie uwierzytelniania Gateway jest zgodne ze współdzielonym kontraktem używanym przez innych klientów Gateway:
  - tryb lokalny: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> awaryjnie `gateway.remote.*` tylko wtedy, gdy `gateway.auth.*` nie jest ustawione (skonfigurowane, ale nierozwiązane lokalne SecretRefs kończą się niepowodzeniem w trybie fail closed)
  - tryb zdalny: `gateway.remote.*` z awaryjnym env/config zgodnie z regułami pierwszeństwa zdalnego
  - `--url` jest bezpiecznym nadpisaniem i nie używa ponownie niejawnych danych uwierzytelniających z config/env; przekaż jawne `--token`/`--password` (lub warianty plikowe)
- Procesy potomne backendu wykonawczego ACP otrzymują `OPENCLAW_SHELL=acp`, którego można użyć do reguł powłoki/profilu specyficznych dla kontekstu.
- `openclaw acp client` ustawia `OPENCLAW_SHELL=acp-client` w uruchomionym procesie mostka.

### Opcje `acp client`

- `--cwd <dir>`: katalog roboczy sesji ACP.
- `--server <command>`: polecenie serwera ACP (domyślnie: `openclaw`).
- `--server-args <args...>`: dodatkowe argumenty przekazywane do serwera ACP.
- `--server-verbose`: włącz szczegółowe logowanie na serwerze ACP.
- `--verbose, -v`: szczegółowe logowanie klienta.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Agenty ACP](/pl/tools/acp-agents)
