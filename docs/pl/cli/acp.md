---
read_when:
    - Konfigurowanie integracji ze środowiskami IDE opartych na ACP
    - Debugowanie routingu sesji ACP do Gateway
summary: Uruchom most ACP dla integracji ze środowiskami IDE
title: ACP
x-i18n:
    generated_at: "2026-07-12T14:53:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

Uruchom most [Agent Client Protocol (ACP)](https://agentclientprotocol.com/), który komunikuje się z Gateway OpenClaw.

`openclaw acp` obsługuje ACP przez standardowe wejście i wyjście dla środowisk IDE oraz przekazuje monity do Gateway przez WebSocket, zachowując mapowanie sesji ACP na klucze sesji Gateway. Jest to most ACP oparty na Gateway, a nie kompletne środowisko wykonawcze edytora natywnie obsługujące ACP: koncentruje się na trasowaniu sesji, dostarczaniu monitów i strumieniowym przesyłaniu aktualizacji.

Jeśli chcesz, aby zewnętrzny klient MCP komunikował się bezpośrednio z konwersacjami w kanałach OpenClaw, zamiast hostować sesję środowiska ACP, użyj [`openclaw mcp serve`](/pl/cli/mcp).

## Czym to nie jest

`openclaw acp` oznacza, że OpenClaw działa jako serwer ACP: środowisko IDE lub klient ACP łączy się z OpenClaw, a OpenClaw przekazuje zadania do sesji Gateway.

Różni się to od [agentów ACP](/pl/tools/acp-agents), gdzie OpenClaw uruchamia zewnętrzne środowisko, takie jak Codex lub Claude Code, za pośrednictwem `acpx`.

Prosta zasada:

- edytor lub klient chce komunikować się z OpenClaw przez ACP: użyj `openclaw acp`
- OpenClaw ma uruchamiać Codex/Claude/Gemini jako środowisko ACP: użyj `/acp spawn` oraz [agentów ACP](/pl/tools/acp-agents)

## Macierz zgodności

| Obszar ACP                                                             | Stan           | Uwagi                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Zaimplementowano | Podstawowy przepływ mostu od standardowego wejścia i wyjścia do funkcji czatu/wysyłania oraz przerywania Gateway.                                                                                                                                         |
| `listSessions`, polecenia z ukośnikiem                                | Zaimplementowano | Lista sesji korzysta ze stanu sesji Gateway, z ograniczoną paginacją opartą na kursorze i filtrowaniem według `cwd`, gdy rekordy sesji Gateway zawierają metadane przestrzeni roboczej; polecenia są ogłaszane przez `available_commands_update`.              |
| Metadane pochodzenia sesji                                             | Zaimplementowano | Listy sesji i migawki informacji o sesjach zawierają w `_meta` pochodzenie nadrzędne i podrzędne OpenClaw, dzięki czemu klienci ACP mogą renderować grafy podagentów bez prywatnych kanałów bocznych Gateway.                                                |
| `resumeSession`, `closeSession`                                       | Zaimplementowano | Wznowienie ponownie wiąże sesję ACP z istniejącą sesją Gateway bez odtwarzania historii. Zamknięcie anuluje aktywne zadania mostu, kończy oczekujące monity jako anulowane i zwalnia stan sesji mostu.                                                       |
| `loadSession`                                                         | Częściowo       | Ponownie wiąże sesję ACP z kluczem sesji Gateway i odtwarza historię z dziennika zdarzeń ACP w przypadku sesji utworzonych przez most. Starsze sesje lub sesje bez dziennika używają awaryjnie zapisanego tekstu użytkownika i asystenta.                    |
| Treść monitu (`text`, osadzony `resource`, obrazy)                    | Częściowo       | Tekst i zasoby są spłaszczane do danych wejściowych czatu; obrazy stają się załącznikami Gateway.                                                                                                                                                         |
| Tryby sesji                                                            | Częściowo       | Obsługiwane jest `session/set_mode`; most udostępnia oparte na Gateway opcje sterowania sesją dotyczące poziomu namysłu, szczegółowości narzędzi, rozumowania, szczegółów użycia i działań z podwyższonymi uprawnieniami. Szersze natywne powierzchnie trybów i konfiguracji ACP pozostają poza zakresem. |
| Strumieniowe przesyłanie toku rozumowania                              | Zaimplementowano | Treść procesu myślowego modelu jest przesyłana strumieniowo jako aktualizacje sesji `agent_thought_chunk`. Natywne plany sesji ACP nie są emitowane.                                                                                                      |
| Informacje o sesji i aktualizacje użycia                               | Częściowo       | Most emituje powiadomienia `session_info_update` i, w miarę możliwości, `usage_update` na podstawie buforowanych migawek sesji Gateway. Dane o użyciu są przybliżone i wysyłane tylko wtedy, gdy łączne liczby tokenów Gateway są oznaczone jako aktualne.     |
| Strumieniowe przesyłanie danych narzędzi                               | Częściowo       | Zdarzenia `tool_call`/`tool_call_update` zawierają nieprzetworzone dane wejścia/wyjścia, treść tekstową oraz, w miarę możliwości, lokalizacje plików, gdy ujawniają je argumenty lub wyniki narzędzi Gateway. Osadzone terminale i bogatsze dane wyjściowe natywnie reprezentujące różnice nie są udostępniane. |
| Zatwierdzanie wykonywania poleceń                                      | Częściowo       | Monity Gateway o zatwierdzenie wykonania polecenia podczas aktywnych tur monitów ACP są przekazywane klientowi ACP za pomocą `session/request_permission`.                                                                                                 |
| Serwery MCP dla poszczególnych sesji (`mcpServers`)                    | Nieobsługiwane  | Tryb mostu odrzuca żądania serwerów MCP dla poszczególnych sesji. Zamiast tego skonfiguruj MCP w Gateway OpenClaw lub w agencie.                                                                                                                           |
| Metody systemu plików klienta (`fs/read_text_file`, `fs/write_text_file`) | Nieobsługiwane  | Most nie wywołuje metod systemu plików klienta ACP.                                                                                                                                                                                                      |
| Metody terminala klienta (`terminal/*`)                                | Nieobsługiwane  | Most nie tworzy terminali klienta ACP ani nie przesyła identyfikatorów terminali w wywołaniach narzędzi.                                                                                                                                                  |

## Znane ograniczenia

- `loadSession` odtwarza pełną historię dziennika zdarzeń ACP tylko dla sesji utworzonych przez most. Starsze sesje lub sesje bez dziennika korzystają z awaryjnego zapisu transkrypcji i nie odtwarzają historycznych wywołań narzędzi ani komunikatów systemowych.
- Jeśli wiele klientów ACP współdzieli ten sam klucz sesji Gateway, trasowanie zdarzeń i anulowań działa w miarę możliwości, zamiast zapewniać ścisłą izolację poszczególnych klientów. Gdy potrzebujesz czystych tur lokalnych dla edytora, preferuj domyślne izolowane sesje `acp-bridge:<uuid>`.
- Stany zatrzymania Gateway są przekształcane w przyczyny zatrzymania ACP, ale to mapowanie jest mniej szczegółowe niż w przypadku w pełni natywnego środowiska ACP.
- Opcje sterowania sesją udostępniają ograniczony podzbiór ustawień Gateway: poziom namysłu, szczegółowość narzędzi, rozumowanie, szczegóły użycia i działania z podwyższonymi uprawnieniami. Wybór modelu i sterowanie hostem wykonawczym nie są udostępniane jako opcje konfiguracji ACP.
- `session_info_update` i `usage_update` są wyprowadzane z migawek sesji Gateway, a nie z bieżących danych rozliczeniowych natywnego środowiska ACP. Dane o użyciu są przybliżone, nie zawierają informacji o kosztach i są emitowane tylko wtedy, gdy Gateway oznaczy łączne dane o tokenach jako aktualne.
- Dane towarzyszące działaniu narzędzi są udostępniane w miarę możliwości: most ujawnia ścieżki plików występujące w znanych argumentach lub wynikach narzędzi, ale nie emituje terminali ACP ani ustrukturyzowanych różnic w plikach.
- Przekazywanie zatwierdzeń wykonywania poleceń jest ograniczone do aktywnej tury monitu ACP; zatwierdzenia z innych sesji Gateway są ignorowane.

## Użycie

```bash
openclaw acp

# Zdalny Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Zdalny Gateway (token z pliku)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Dołączenie do istniejącego klucza sesji
openclaw acp --session agent:main:main

# Dołączenie według etykiety (musi już istnieć)
openclaw acp --session-label "support inbox"

# Zresetowanie klucza sesji przed pierwszym monitem
openclaw acp --session agent:main:main --reset-session
```

## Klient ACP (diagnostyka)

Użyj wbudowanego klienta ACP, aby przeprowadzić podstawową kontrolę mostu bez środowiska IDE. Uruchamia on most ACP i umożliwia interaktywne wpisywanie monitów.

```bash
openclaw acp client

# Skierowanie uruchomionego mostu do zdalnego Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Zastąpienie polecenia serwera (domyślnie: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Model uprawnień (tryb diagnostyczny klienta):

- Automatyczne zatwierdzanie opiera się na liście dozwolonych elementów i dotyczy wyłącznie zaufanych identyfikatorów podstawowych narzędzi.
- Automatyczne zatwierdzanie `read` jest ograniczone do bieżącego katalogu roboczego (`--cwd`, jeśli ustawiono).
- ACP automatycznie zatwierdza tylko wąskie klasy operacji wyłącznie do odczytu: ograniczone wywołania `read` w aktywnym katalogu roboczym oraz narzędzia wyszukiwania wyłącznie do odczytu (`search`, `web_search`, `memory_search`). Nieznane lub niepodstawowe narzędzia, odczyty spoza zakresu, narzędzia umożliwiające wykonywanie poleceń, narzędzia płaszczyzny sterowania, narzędzia modyfikujące oraz interaktywne przepływy zawsze wymagają jawnego zatwierdzenia monitu.
- Wartość `toolCall.kind` dostarczana przez serwer jest traktowana jako niezaufane metadane, a nie jako źródło autoryzacji.
- Ta polityka mostu ACP jest niezależna od uprawnień środowiska ACPX. Jeśli uruchamiasz OpenClaw za pośrednictwem mechanizmu `acpx`, ustawienie `plugins.entries.acpx.config.permissionMode=approve-all` jest awaryjnym przełącznikiem „zatwierdź wszystko” dla tej sesji środowiska.

## Test dymny protokołu

Aby diagnozować problemy na poziomie protokołu, uruchom Gateway z izolowanym stanem i steruj `openclaw acp` przez standardowe wejście i wyjście za pomocą klienta ACP JSON-RPC. Uwzględnij `initialize`, `session/new`, `session/list` z bezwzględną ścieżką `cwd`, `session/resume`, `session/close`, ponowne zamknięcie oraz wznowienie nieistniejącej sesji.

Dowód powinien obejmować ogłoszone możliwości cyklu życia, rekord sesji oparty na Gateway, powiadomienia o aktualizacjach oraz dziennik `sessions.list` Gateway:

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

Nie używaj `openclaw gateway call sessions.list` jako jedynego dowodu działania ACP. Ta ścieżka CLI może zażądać rozszerzenia zakresu operatora za pomocą nowego tokenu; poprawność mostu ACP potwierdzają ramki ACP przesyłane przez standardowe wejście i wyjście oraz dziennik `sessions.list` Gateway.

## Jak tego używać

Użyj ACP, gdy środowisko IDE lub inny klient obsługuje Agent Client Protocol i chcesz, aby sterował sesją Gateway OpenClaw.

1. Upewnij się, że Gateway działa lokalnie lub zdalnie.
2. Skonfiguruj docelowy Gateway za pomocą konfiguracji lub flag.
3. Skonfiguruj środowisko IDE tak, aby uruchamiało `openclaw acp` przez standardowe wejście i wyjście.

Przykładowa konfiguracja (utrwalona):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Przykładowe bezpośrednie uruchomienie (bez zapisywania konfiguracji):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferowane ze względu na bezpieczeństwo procesu lokalnego
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Wybieranie agentów

ACP nie wybiera agentów bezpośrednio. Trasuje dane na podstawie klucza sesji Gateway. Aby wskazać konkretnego agenta, użyj kluczy sesji powiązanych z agentem:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Każda sesja ACP jest mapowana na jeden klucz sesji Gateway. Jeden agent może mieć wiele sesji; ACP domyślnie używa izolowanej sesji `acp-bridge:<uuid>`, chyba że zastąpisz klucz lub etykietę.

`mcpServers` dla poszczególnych sesji nie są obsługiwane w trybie mostu. Jeśli klient ACP wyśle je podczas `newSession` lub `loadSession`, most zwróci jednoznaczny błąd, zamiast po cichu je ignorować.

Jeśli chcesz, aby sesje oparte na ACPX miały dostęp do narzędzi pluginów OpenClaw lub wybranych narzędzi wbudowanych, takich jak `cron`, włącz mosty ACPX MCP po stronie Gateway, zamiast próbować przekazywać `mcpServers` dla poszczególnych sesji. Zobacz [Agenci ACP](/pl/tools/acp-agents-setup#plugin-tools-mcp-bridge) oraz [Most MCP narzędzi OpenClaw](/pl/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Używanie z poziomu `acpx` (Codex, Claude i inni klienci ACP)

Jeśli chcesz, aby agent programistyczny, taki jak Codex lub Claude Code, komunikował się z Twoim botem OpenClaw przez ACP, użyj `acpx` z wbudowanym celem `openclaw`.

Typowy przebieg:

1. Uruchom Gateway i upewnij się, że most ACP może się z nim połączyć.
2. Skieruj `acpx openclaw` do `openclaw acp`.
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

Jeśli chcesz, aby `acpx openclaw` za każdym razem korzystał z określonego Gateway i klucza sesji, zastąp polecenie agenta `openclaw` w pliku `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

W przypadku lokalnego katalogu roboczego repozytorium OpenClaw użyj bezpośredniego punktu wejścia CLI zamiast programu uruchamiającego środowisko deweloperskie, aby strumień ACP pozostał czysty:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

To najprostszy sposób, aby Codex, Claude Code lub inny klient obsługujący ACP mógł pobierać informacje kontekstowe od agenta OpenClaw bez przechwytywania zawartości terminala.

## Konfiguracja edytora Zed

Dodaj niestandardowego agenta ACP w pliku `~/.config/zed/settings.json` (lub użyj interfejsu Settings w Zed):

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

Aby wskazać określony Gateway lub agenta:

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

Domyślnie sesje mostu ACP otrzymują izolowany klucz sesji Gateway z prefiksem `acp-bridge:`. Te sesje mostu korzystające ze zwykłego modelu są syntetyczne i jednorazowe: podlegają usuwaniu nieaktualnych wpisów i nie są traktowane jako chronione miejsca rozmów z użytkownikami. Aby ponownie użyć znanej sesji, przekaż klucz lub etykietę sesji:

- `--session <key>`: użyj określonego klucza sesji Gateway.
- `--session-label <label>`: znajdź istniejącą sesję według etykiety.
- `--reset-session`: wygeneruj nowy identyfikator sesji dla tego klucza (ten sam klucz, nowy zapis rozmowy).

Jeśli Twój klient ACP obsługuje metadane, możesz zastąpić ustawienia dla poszczególnych sesji:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Więcej informacji o kluczach sesji znajdziesz na stronie [/concepts/session](/pl/concepts/session).

## Opcje

- `--url <url>`: adres URL WebSocket Gateway (domyślnie `gateway.remote.url`, jeśli jest skonfigurowany).
- `--token <token>`: token uwierzytelniający Gateway.
- `--token-file <path>`: odczytaj token uwierzytelniający Gateway z pliku.
- `--password <password>`: hasło uwierzytelniające Gateway.
- `--password-file <path>`: odczytaj hasło uwierzytelniające Gateway z pliku.
- `--session <key>`: domyślny klucz sesji.
- `--session-label <label>`: domyślna etykieta sesji do wyszukania.
- `--require-existing`: zakończ niepowodzeniem, jeśli klucz lub etykieta sesji nie istnieją.
- `--reset-session`: zresetuj klucz sesji przed pierwszym użyciem.
- `--no-prefix-cwd`: nie poprzedzaj monitów katalogiem roboczym.
- `--provenance <off|meta|meta+receipt>`: dołącz metadane pochodzenia ACP lub potwierdzenia.
- `--verbose, -v`: szczegółowe rejestrowanie do stderr.

Uwaga dotycząca bezpieczeństwa:

- `--token` i `--password` mogą być widoczne na lokalnych listach procesów w niektórych systemach. Preferuj `--token-file`/`--password-file` lub zmienne środowiskowe (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Ustalanie danych uwierzytelniających Gateway odbywa się zgodnie ze wspólną umową używaną przez innych klientów Gateway:
  - tryb lokalny: zmienne środowiskowe (`OPENCLAW_GATEWAY_*`), następnie `gateway.auth.*`, z przejściem awaryjnym do `gateway.remote.*` tylko wtedy, gdy `gateway.auth.*` nie jest ustawione (skonfigurowany, ale nierozwiązany lokalny SecretRef powoduje bezpieczne niepowodzenie zamiast cichego przejścia awaryjnego)
  - tryb zdalny: `gateway.remote.*` z przejściem awaryjnym do zmiennych środowiskowych lub konfiguracji zgodnie z regułami pierwszeństwa trybu zdalnego
  - `--url` można bezpiecznie zastąpić i nie powoduje ponownego użycia niejawnych danych uwierzytelniających z konfiguracji ani zmiennych środowiskowych; przekaż jawne `--token`/`--password` (lub ich warianty plikowe)

### Opcje `acp client`

- `--cwd <dir>`: katalog roboczy sesji ACP.
- `--server <command>`: polecenie serwera ACP (domyślnie: `openclaw`).
- `--server-args <args...>`: dodatkowe argumenty przekazywane do serwera ACP.
- `--server-verbose`: włącz szczegółowe rejestrowanie na serwerze ACP.
- `--verbose, -v`: szczegółowe rejestrowanie klienta.
- `openclaw acp client` ustawia `OPENCLAW_SHELL=acp-client` w uruchomionym procesie mostu, co można wykorzystać w regułach powłoki lub profilu zależnych od kontekstu.

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
- [Agenci ACP](/pl/tools/acp-agents)
