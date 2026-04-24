---
read_when:
    - Pakowanie OpenClaw.app
    - Debugowanie usługi launchd gateway na macOS
    - Instalowanie CLI gateway dla macOS
summary: Runtime Gateway na macOS (zewnętrzna usługa launchd)
title: Gateway na macOS
x-i18n:
    generated_at: "2026-04-24T09:20:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

OpenClaw.app nie dołącza już Node/Bun ani runtime Gateway. Aplikacja macOS
oczekuje **zewnętrznej** instalacji CLI `openclaw`, nie uruchamia Gateway jako
procesu potomnego i zarządza usługą launchd per użytkownik, aby utrzymać Gateway
w działaniu (albo dołącza do istniejącego lokalnego Gateway, jeśli taki już działa).

## Zainstaluj CLI (wymagane dla trybu lokalnego)

Node 24 jest domyślnym runtime na Mac. Node 22 LTS, obecnie `22.14+`, nadal działa dla zgodności. Następnie zainstaluj `openclaw` globalnie:

```bash
npm install -g openclaw@<version>
```

Przycisk **Install CLI** w aplikacji macOS uruchamia ten sam globalny przepływ instalacji, którego aplikacja
używa wewnętrznie: najpierw preferuje npm, potem pnpm, a następnie bun, jeśli jest to jedyny
wykryty menedżer pakietów. Node pozostaje zalecanym runtime Gateway.

## Launchd (Gateway jako LaunchAgent)

Etykieta:

- `ai.openclaw.gateway` (albo `ai.openclaw.<profile>`; starsze `com.openclaw.*` mogą pozostać)

Lokalizacja pliku plist (per użytkownik):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (albo `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Menedżer:

- Aplikacja macOS zarządza instalacją/aktualizacją LaunchAgent w trybie lokalnym.
- CLI także może go zainstalować: `openclaw gateway install`.

Zachowanie:

- „OpenClaw Active” włącza/wyłącza LaunchAgent.
- Zamknięcie aplikacji **nie** zatrzymuje gateway (launchd utrzymuje go przy życiu).
- Jeśli Gateway już działa na skonfigurowanym porcie, aplikacja dołącza do
  niego zamiast uruchamiać nowy.

Logowanie:

- stdout/err launchd: `/tmp/openclaw/openclaw-gateway.log`

## Zgodność wersji

Aplikacja macOS sprawdza wersję gateway względem własnej wersji. Jeśli są
niezgodne, zaktualizuj globalne CLI tak, aby odpowiadało wersji aplikacji.

## Smoke check

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

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Gateway runbook](/pl/gateway)
