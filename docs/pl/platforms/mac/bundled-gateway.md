---
read_when:
    - Pakowanie OpenClaw.app
    - Debugowanie usługi launchd dla Gateway w systemie macOS
    - Instalowanie CLI Gateway dla macOS
summary: Środowisko uruchomieniowe Gateway w systemie macOS (zewnętrzna usługa launchd)
title: Gateway na macOS
x-i18n:
    generated_at: "2026-05-06T09:21:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app nie zawiera już w pakiecie Node/Bun ani środowiska uruchomieniowego Gateway. Aplikacja na macOS oczekuje **zewnętrznej** instalacji CLI `openclaw`, nie uruchamia Gateway jako procesu potomnego i zarządza usługą launchd dla użytkownika, aby utrzymywać działanie Gateway (albo podłącza się do istniejącego lokalnego Gateway, jeśli taki już działa).

## Zainstaluj CLI (wymagane dla trybu lokalnego)

Node 24 jest domyślnym środowiskiem uruchomieniowym na Macu. Node 22 LTS, obecnie `22.14+`, nadal działa w celu zachowania kompatybilności. Następnie zainstaluj globalnie `openclaw`:

```bash
npm install -g openclaw@<version>
```

Przycisk **Zainstaluj CLI** w aplikacji na macOS uruchamia ten sam globalny przepływ instalacji, którego aplikacja używa wewnętrznie: najpierw preferuje npm, potem pnpm, a następnie bun, jeśli jest to jedyny wykryty menedżer pakietów. Node pozostaje zalecanym środowiskiem uruchomieniowym Gateway.

## Launchd (Gateway jako LaunchAgent)

Etykieta:

- `ai.openclaw.gateway` (lub `ai.openclaw.<profile>`; starsze `com.openclaw.*` mogą pozostać)

Lokalizacja pliku plist (dla użytkownika):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (lub `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Menedżer:

- Aplikacja na macOS odpowiada za instalację/aktualizację LaunchAgent w trybie lokalnym.
- CLI także może go zainstalować: `openclaw gateway install`.

Zachowanie:

- „OpenClaw Active” włącza/wyłącza LaunchAgent.
- Zamknięcie aplikacji **nie** zatrzymuje Gateway (launchd utrzymuje go przy życiu).
- Jeśli Gateway już działa na skonfigurowanym porcie, aplikacja podłącza się do niego zamiast uruchamiać nowy.

Logowanie:

- stdout/err launchd: `/tmp/openclaw/openclaw-gateway.log`

## Zgodność wersji

Aplikacja na macOS sprawdza wersję Gateway względem swojej własnej wersji. Jeśli są niezgodne, zaktualizuj globalny CLI, aby odpowiadał wersji aplikacji.

## Test smoke

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

- [Aplikacja na macOS](/pl/platforms/macos)
- [Runbook Gateway](/pl/gateway)
