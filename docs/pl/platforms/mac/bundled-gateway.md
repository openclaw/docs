---
read_when:
    - Pakowanie OpenClaw.app
    - Debugowanie usługi launchd Gateway w macOS
    - Instalacja CLI Gateway dla macOS
summary: Środowisko uruchomieniowe Gateway w systemie macOS (zewnętrzna usługa launchd)
title: Gateway na macOS
x-i18n:
    generated_at: "2026-05-07T13:21:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf129918c46f8f54026e9db04e8ad5a033148899d3029fe1a362bb14c7f25f8
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app nie zawiera już w pakiecie Node/Bun ani środowiska uruchomieniowego Gateway. Aplikacja macOS
oczekuje **zewnętrznej** instalacji CLI `openclaw`, nie uruchamia Gateway jako
procesu potomnego i zarządza usługą launchd dla użytkownika, aby utrzymywać Gateway
w działaniu (lub podłącza się do istniejącego lokalnego Gateway, jeśli już działa).

## Zainstaluj CLI (wymagane w trybie lokalnym)

Node 24 jest domyślnym środowiskiem uruchomieniowym na Macu. Node 22 LTS, obecnie `22.16+`, nadal działa w celu zachowania zgodności. Następnie zainstaluj `openclaw` globalnie:

```bash
npm install -g openclaw@<version>
```

Przycisk **Zainstaluj CLI** w aplikacji macOS uruchamia ten sam globalny przepływ instalacji, którego aplikacja
używa wewnętrznie: najpierw preferuje npm, potem pnpm, a następnie bun, jeśli jest to jedyny
wykryty menedżer pakietów. Node pozostaje zalecanym środowiskiem uruchomieniowym Gateway.

## Launchd (Gateway jako LaunchAgent)

Etykieta:

- `ai.openclaw.gateway` (lub `ai.openclaw.<profile>`; starsze `com.openclaw.*` mogą pozostać)

Lokalizacja plist (dla użytkownika):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (lub `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Menedżer:

- Aplikacja macOS zarządza instalacją/aktualizacją LaunchAgent w trybie lokalnym.
- CLI może go również zainstalować: `openclaw gateway install`.

Zachowanie:

- „OpenClaw aktywny” włącza/wyłącza LaunchAgent.
- Zamknięcie aplikacji **nie** zatrzymuje gateway (launchd utrzymuje go przy życiu).
- Jeśli Gateway już działa na skonfigurowanym porcie, aplikacja podłącza się do
  niego zamiast uruchamiać nowy.

Logowanie:

- stdout/err launchd: `/tmp/openclaw/openclaw-gateway.log`

## Zgodność wersji

Aplikacja macOS sprawdza wersję gateway względem własnej wersji. Jeśli są
niezgodne, zaktualizuj globalny CLI, aby pasował do wersji aplikacji.

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

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Runbook Gateway](/pl/gateway)
