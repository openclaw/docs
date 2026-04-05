---
read_when:
    - Konfigurowanie integracji IDE opartych na ACP
    - Debugowanie routowania sesji ACP do Gateway
summary: Uruchamianie mostka ACP dla integracji z IDE
title: acp
x-i18n:
    generated_at: "2026-04-05T13:48:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2461b181e4a97dd84580581e9436ca1947a224decce8044132dbcf7fb2b7502c
    source_path: cli/acp.md
    workflow: 15
---

# acp

Uruchom mostek [Agent Client Protocol (ACP)](https://agentclientprotocol.com/), który komunikuje się z OpenClaw Gateway.

To polecenie używa ACP przez stdio dla IDE i przekazuje prompty do Gateway
przez WebSocket. Utrzymuje mapowanie sesji ACP na klucze sesji Gateway.

`openclaw acp` to oparty na Gateway mostek ACP, a nie pełne środowisko
edytora natywnie obsługujące ACP. Skupia się na routowaniu sesji, dostarczaniu
promptów i podstawowych aktualizacjach streamingu.

Jeśli chcesz, aby zewnętrzny klient MCP komunikował się bezpośrednio z
konwersacjami kanałów OpenClaw zamiast hostować sesję harness ACP, użyj
[`openclaw mcp serve`](/cli/mcp).

## Czym to nie jest

Ta strona jest często mylona z sesjami harness ACP.

`openclaw acp` oznacza:

- OpenClaw działa jako serwer ACP
- IDE lub klient ACP łączy się z OpenClaw
- OpenClaw przekazuje tę pracę do sesji Gateway

To różni się od [ACP Agents](/tools/acp-agents), gdzie OpenClaw uruchamia
zewnętrzny harness, taki jak Codex lub Claude Code, przez `acpx`.

Szybka zasada:

- edytor/klient chce rozmawiać z OpenClaw przez ACP: użyj `openclaw acp`
- OpenClaw ma uruchomić Codex/Claude/Gemini jako harness ACP: użyj `/acp spawn` i [ACP Agents](/tools/acp-agents)

## Macierz zgodności

| Obszar ACP                                                            | Stan        | Uwagi                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Zaimplementowane | Główny przepływ mostka przez stdio do Gateway chat/send + abort.                                                                                                                                                                                |
| `listSessions`, slash commands                                        | Zaimplementowane | Lista sesji działa na stanie sesji Gateway; polecenia są ogłaszane przez `available_commands_update`.                                                                                                                                          |
| `loadSession`                                                         | Częściowe   | Ponownie wiąże sesję ACP z kluczem sesji Gateway i odtwarza zapisaną historię tekstową użytkownika/asystenta. Historia narzędzi/systemu nie jest jeszcze odtwarzana.                                                                          |
| Zawartość promptu (`text`, osadzony `resource`, obrazy)               | Częściowe   | Tekst/zasoby są spłaszczane do wejścia czatu; obrazy stają się załącznikami Gateway.                                                                                                                                                           |
| Tryby sesji                                                           | Częściowe   | `session/set_mode` jest obsługiwane, a mostek udostępnia początkowe kontrolki sesji oparte na Gateway dla poziomu myślenia, szczegółowości narzędzi, rozumowania, szczegółowości użycia i działań podwyższonych. Szersze, natywne dla ACP powierzchnie trybu/konfiguracji nadal są poza zakresem. |
| Informacje o sesji i aktualizacje użycia                              | Częściowe   | Mostek emituje powiadomienia `session_info_update` i best-effort `usage_update` z cachowanych snapshotów sesji Gateway. Użycie jest przybliżone i wysyłane tylko wtedy, gdy suma tokenów w Gateway jest oznaczona jako świeża.                |
| Streaming narzędzi                                                    | Częściowe   | Zdarzenia `tool_call` / `tool_call_update` zawierają surowe I/O, treść tekstową i best-effort lokalizacje plików, gdy argumenty/wyniki narzędzi Gateway je ujawniają. Osadzone terminale i bogatsze dane wyjściowe natywne dla diff nadal nie są ujawniane. |
| Serwery MCP per sesja (`mcpServers`)                                  | Nieobsługiwane | Tryb mostka odrzuca żądania serwerów MCP per sesja. Zamiast tego skonfiguruj MCP w OpenClaw gateway lub agencie.                                                                                                                               |
| Metody systemu plików klienta (`fs/read_text_file`, `fs/write_text_file`) | Nieobsługiwane | Mostek nie wywołuje metod systemu plików klienta ACP.                                                                                                                                                                                           |
| Metody terminala klienta (`terminal/*`)                               | Nieobsługiwane | Mostek nie tworzy terminali klienta ACP ani nie streamuje identyfikatorów terminali przez wywołania narzędzi.                                                                                                                                |
| Plany sesji / streaming myśli                                         | Nieobsługiwane | Mostek obecnie emituje tekst wyjściowy i stan narzędzi, a nie aktualizacje planu lub myśli ACP.                                                                                                                                                |

## Znane ograniczenia

- `loadSession` odtwarza zapisaną historię tekstową użytkownika i asystenta, ale nie
  rekonstruuje historycznych wywołań narzędzi, komunikatów systemowych ani bogatszych
  typów zdarzeń natywnych dla ACP.
- Jeśli wielu klientów ACP współdzieli ten sam klucz sesji Gateway, routowanie
  zdarzeń i anulowań działa na zasadzie best-effort zamiast ścisłej izolacji
  per klient. Gdy potrzebujesz czystych tur lokalnych dla edytora, preferuj
  domyślne izolowane sesje `acp:<uuid>`.
- Stany zatrzymania Gateway są tłumaczone na powody zatrzymania ACP, ale to mapowanie
  jest mniej ekspresywne niż w pełni natywne środowisko ACP.
- Początkowe kontrolki sesji obecnie udostępniają ograniczony podzbiór ustawień Gateway:
  poziom myślenia, szczegółowość narzędzi, rozumowanie, szczegółowość użycia i działania
  podwyższone. Wybór modelu i kontrolki exec-host nie są jeszcze udostępniane jako opcje
  konfiguracji ACP.
- `session_info_update` i `usage_update` są wyprowadzane ze snapshotów sesji Gateway,
  a nie z rozliczeń czasu działania natywnych dla ACP. Użycie jest przybliżone,
  nie zawiera danych kosztowych i jest emitowane tylko wtedy, gdy Gateway oznaczy
  łączne dane tokenów jako świeże.
- Dane follow-along dla narzędzi działają na zasadzie best-effort. Mostek może
  ujawniać ścieżki plików, które pojawiają się w znanych argumentach/wynikach narzędzi,
  ale nie emituje jeszcze terminali ACP ani strukturalnych diffów plików.

## Użycie

```bash
openclaw acp

# Zdalny Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Zdalny Gateway (token z pliku)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Dołącz do istniejącego klucza sesji
openclaw acp --session agent:main:main

# Dołącz według etykiety (musi już istnieć)
openclaw acp --session-label "support inbox"

# Zresetuj klucz sesji przed pierwszym promptem
openclaw acp --session agent:main:main --reset-session
```

## Klient ACP (debugowanie)

Użyj wbudowanego klienta ACP, aby sprawdzić poprawność działania mostka bez IDE.
Uruchamia on mostek ACP i pozwala interaktywnie wpisywać prompty.

```bash
openclaw acp client

# Skieruj uruchomiony mostek do zdalnego Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Nadpisz polecenie serwera (domyślnie: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Model uprawnień (tryb debugowania klienta):

- Autozatwierdzanie jest oparte na allowliście i dotyczy tylko zaufanych identyfikatorów podstawowych narzędzi.
- Autozatwierdzanie `read` jest ograniczone do bieżącego katalogu roboczego (`--cwd`, gdy ustawiono).
- ACP autozatwierdza tylko wąskie klasy odczytu: wywołania `read` w zakresie aktywnego cwd oraz narzędzia wyszukiwania tylko do odczytu (`search`, `web_search`, `memory_search`). Nieznane/niepodstawowe narzędzia, odczyty spoza zakresu, narzędzia zdolne do exec, narzędzia płaszczyzny sterowania, narzędzia modyfikujące i interaktywne przepływy zawsze wymagają jawnego zatwierdzenia w prompt.
- Dostarczone przez serwer `toolCall.kind` jest traktowane jako niezaufane metadane (nie jako źródło autoryzacji).
- Ta polityka mostka ACP jest oddzielna od uprawnień harness ACPX. Jeśli uruchamiasz OpenClaw przez backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` jest awaryjnym przełącznikiem „yolo” dla tej sesji harness.

## Jak tego używać

Używaj ACP, gdy IDE (lub inny klient) obsługuje Agent Client Protocol i chcesz,
aby sterowało sesją OpenClaw Gateway.

1. Upewnij się, że Gateway działa (lokalnie lub zdalnie).
2. Skonfiguruj docelowy Gateway (konfiguracja lub flagi).
3. Skonfiguruj IDE tak, aby uruchamiało `openclaw acp` przez stdio.

Przykładowa konfiguracja (trwała):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Przykładowe bezpośrednie uruchomienie (bez zapisu konfiguracji):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# zalecane dla bezpieczeństwa procesów lokalnych
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Wybieranie agentów

ACP nie wybiera agentów bezpośrednio. Routuje na podstawie klucza sesji Gateway.

Użyj kluczy sesji o zakresie agenta, aby wskazać konkretnego agenta:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Każda sesja ACP mapuje się na pojedynczy klucz sesji Gateway. Jeden agent może mieć wiele
sesji; ACP domyślnie używa izolowanej sesji `acp:<uuid>`, chyba że nadpiszesz
klucz lub etykietę.

Serwery `mcpServers` per sesja nie są obsługiwane w trybie mostka. Jeśli klient ACP
wyśle je podczas `newSession` lub `loadSession`, mostek zwróci jasny
błąd zamiast cicho je ignorować.

Jeśli chcesz, aby sesje oparte na ACPX widziały narzędzia pluginów OpenClaw, włącz
mostek pluginów ACPX po stronie gateway zamiast próbować przekazywać per sesja
`mcpServers`. Zobacz [ACP Agents](/tools/acp-agents#plugin-tools-mcp-bridge).

## Użycie z `acpx` (Codex, Claude, inni klienci ACP)

Jeśli chcesz, aby agent programistyczny, taki jak Codex lub Claude Code, komunikował się z Twoim
botem OpenClaw przez ACP, użyj `acpx` z jego wbudowanym targetem `openclaw`.

Typowy przepływ:

1. Uruchom Gateway i upewnij się, że mostek ACP może się z nim połączyć.
2. Skieruj `acpx openclaw` na `openclaw acp`.
3. Wskaż klucz sesji OpenClaw, którego agent programistyczny ma używać.

Przykłady:

```bash
# Jednorazowe żądanie do domyślnej sesji OpenClaw ACP
acpx openclaw exec "Summarize the active OpenClaw session state."

# Trwała nazwana sesja dla kolejnych tur
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Jeśli chcesz, aby `acpx openclaw` zawsze kierował do konkretnego Gateway i klucza sesji,
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

Dla lokalnego checkouta OpenClaw repo użyj bezpośredniego entrypointu CLI zamiast
runnera developerskiego, aby strumień ACP pozostał czysty. Na przykład:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

To najprostszy sposób, aby Codex, Claude Code lub inny klient obsługujący ACP
mógł pobierać informacje kontekstowe z agenta OpenClaw bez parsowania terminala.

## Konfiguracja edytora Zed

Dodaj niestandardowego agenta ACP w `~/.config/zed/settings.json` (lub użyj UI ustawień Zed):

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

Aby kierować do konkretnego Gateway lub agenta:

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
- `--session-label <label>`: rozwiąż istniejącą sesję na podstawie etykiety.
- `--reset-session`: wygeneruj świeży identyfikator sesji dla tego klucza (ten sam klucz, nowy transkrypt).

Jeśli Twój klient ACP obsługuje metadane, możesz nadpisać to per sesja:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Dowiedz się więcej o kluczach sesji w [/concepts/session](/concepts/session).

## Opcje

- `--url <url>`: URL Gateway WebSocket (domyślnie `gateway.remote.url`, jeśli skonfigurowano).
- `--token <token>`: token uwierzytelniania Gateway.
- `--token-file <path>`: odczytaj token uwierzytelniania Gateway z pliku.
- `--password <password>`: hasło uwierzytelniania Gateway.
- `--password-file <path>`: odczytaj hasło uwierzytelniania Gateway z pliku.
- `--session <key>`: domyślny klucz sesji.
- `--session-label <label>`: domyślna etykieta sesji do rozwiązania.
- `--require-existing`: zakończ błędem, jeśli klucz/etykieta sesji nie istnieje.
- `--reset-session`: zresetuj klucz sesji przed pierwszym użyciem.
- `--no-prefix-cwd`: nie dodawaj prefiksu katalogu roboczego do promptów.
- `--provenance <off|meta|meta+receipt>`: dołącz metadane pochodzenia ACP lub potwierdzenia.
- `--verbose, -v`: szczegółowe logowanie do stderr.

Uwaga dotycząca bezpieczeństwa:

- `--token` i `--password` mogą być widoczne w lokalnych listach procesów w niektórych systemach.
- Preferuj `--token-file`/`--password-file` lub zmienne środowiskowe (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Rozwiązywanie uwierzytelniania Gateway odbywa się według współdzielonego kontraktu używanego przez innych klientów Gateway:
  - tryb lokalny: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> zapasowo `gateway.remote.*` tylko wtedy, gdy `gateway.auth.*` nie jest ustawione (skonfigurowane, ale nierozwiązane lokalne SecretRef kończą się bezpieczną odmową)
  - tryb zdalny: `gateway.remote.*` z zapasowym env/config według reguł pierwszeństwa zdalnego
  - `--url` można bezpiecznie nadpisywać i nie używa ponownie domyślnych poświadczeń z config/env; przekaż jawne `--token`/`--password` (lub warianty plikowe)
- Procesy potomne backendu środowiska uruchomieniowego ACP otrzymują `OPENCLAW_SHELL=acp`, co można wykorzystać do reguł shell/profile zależnych od kontekstu.
- `openclaw acp client` ustawia `OPENCLAW_SHELL=acp-client` dla uruchomionego procesu mostka.

### Opcje `acp client`

- `--cwd <dir>`: katalog roboczy dla sesji ACP.
- `--server <command>`: polecenie serwera ACP (domyślnie: `openclaw`).
- `--server-args <args...>`: dodatkowe argumenty przekazywane do serwera ACP.
- `--server-verbose`: włącz szczegółowe logowanie na serwerze ACP.
- `--verbose, -v`: szczegółowe logowanie klienta.
