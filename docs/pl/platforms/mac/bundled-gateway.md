---
read_when:
    - Pakietujesz OpenClaw.app
    - Debugujesz usługę launchd gateway na macOS
    - Instalujesz CLI gateway dla macOS
summary: Runtime Gateway na macOS (zewnętrzna usługa launchd)
title: Gateway na macOS
x-i18n:
    generated_at: "2026-04-05T13:59:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e41528b35d69c13608cb9a34b39a7f02e1134204d1b496cbdd191798f39607
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

# Gateway na macOS (zewnętrzny launchd)

OpenClaw.app nie bundluje już Node/Bun ani runtime Gateway. Aplikacja macOS
oczekuje **zewnętrznej** instalacji CLI `openclaw`, nie uruchamia Gateway jako
procesu potomnego i zarządza usługą launchd per użytkownik, aby utrzymywać Gateway
w działaniu (lub dołącza do istniejącej lokalnej Gateway, jeśli taki już działa).

## Zainstaluj CLI (wymagane dla trybu lokalnego)

Node 24 jest domyślnym runtime na Macu. Node 22 LTS, obecnie `22.14+`, nadal działa ze względu na zgodność. Następnie zainstaluj globalnie `openclaw`:

```bash
npm install -g openclaw@<version>
```

Przycisk **Install CLI** w aplikacji macOS uruchamia ten sam globalny przepływ instalacji, którego
aplikacja używa wewnętrznie: najpierw preferuje npm, potem pnpm, a następnie bun, jeśli jest to jedyny
wykryty menedżer pakietów. Node pozostaje zalecanym runtime Gateway.

## Launchd (Gateway jako LaunchAgent)

Etykieta:

- `ai.openclaw.gateway` (lub `ai.openclaw.<profile>`; starsze `com.openclaw.*` mogą pozostać)

Lokalizacja plist (per użytkownik):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (lub `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Menedżer:

- Aplikacja macOS zarządza instalacją/aktualizacją LaunchAgent w trybie Local.
- CLI również może go zainstalować: `openclaw gateway install`.

Zachowanie:

- „OpenClaw Active” włącza/wyłącza LaunchAgent.
- Zamknięcie aplikacji **nie** zatrzymuje gateway (launchd utrzymuje ją przy życiu).
- Jeśli Gateway działa już na skonfigurowanym porcie, aplikacja dołącza do
  niej zamiast uruchamiać nową.

Logowanie:

- stdout/err launchd: `/tmp/openclaw/openclaw-gateway.log`

## Zgodność wersji

Aplikacja macOS sprawdza wersję gateway względem własnej wersji. Jeśli są
niezgodne, zaktualizuj globalne CLI, aby pasowało do wersji aplikacji.

## Kontrola smoke

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Następnie:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
