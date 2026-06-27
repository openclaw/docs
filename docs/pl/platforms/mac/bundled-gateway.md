---
read_when:
    - Pakowanie OpenClaw.app
    - Debugowanie usługi launchd dla Gateway w systemie macOS
    - Instalowanie CLI Gateway dla macOS
summary: Środowisko uruchomieniowe Gateway w macOS (zewnętrzna usługa launchd)
title: Gateway na macOS
x-i18n:
    generated_at: "2026-06-27T17:47:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app nie zawiera już w pakiecie Node/Bun ani środowiska uruchomieniowego Gateway. Aplikacja macOS
oczekuje **zewnętrznej** instalacji CLI `openclaw`, nie uruchamia Gateway jako
procesu podrzędnego i zarządza usługą launchd dla każdego użytkownika, aby utrzymywać Gateway
w działaniu (albo podłącza się do istniejącego lokalnego Gateway, jeśli już działa).

## Zainstaluj CLI (wymagane dla trybu lokalnego)

Node 24 jest domyślnym środowiskiem uruchomieniowym na Macu. Node 22 LTS, obecnie `22.19+`, nadal działa ze względu na zgodność. Następnie zainstaluj `openclaw` globalnie:

```bash
npm install -g openclaw@<version>
```

Przycisk **Install CLI** w aplikacji macOS uruchamia ten sam globalny przepływ instalacji, którego aplikacja
używa wewnętrznie: najpierw preferuje npm, potem pnpm, a następnie bun, jeśli jest to jedyny
wykryty menedżer pakietów. Node pozostaje zalecanym środowiskiem uruchomieniowym Gateway.

## Launchd (Gateway jako LaunchAgent)

Etykieta:

- `ai.openclaw.gateway` (lub `ai.openclaw.<profile>`; starsze `com.openclaw.*` mogą pozostać)

Lokalizacja plist (dla użytkownika):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (lub `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Menedżer:

- Aplikacja macOS odpowiada za instalację/aktualizację LaunchAgent w trybie lokalnym.
- CLI również może go zainstalować: `openclaw gateway install`.

Zachowanie:

- „OpenClaw Active” włącza/wyłącza LaunchAgent.
- Zamknięcie aplikacji **nie** zatrzymuje gateway (launchd utrzymuje go przy życiu).
- Jeśli Gateway już działa na skonfigurowanym porcie, aplikacja podłącza się do
  niego zamiast uruchamiać nowy.

Logowanie:

- stdout launchd: `~/Library/Logs/openclaw/gateway.log` (profile używają `gateway-<profile>.log`)
- stderr launchd: wyciszony

## Zgodność wersji

Aplikacja macOS sprawdza wersję gateway względem własnej wersji. Jeśli są
niezgodne, zaktualizuj globalne CLI, aby odpowiadało wersji aplikacji.

## Test kontrolny

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

- [aplikacja macOS](/pl/platforms/macos)
- [runbook Gateway](/pl/gateway)
