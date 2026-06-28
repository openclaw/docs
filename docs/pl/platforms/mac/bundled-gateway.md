---
read_when:
    - Pakietowanie OpenClaw.app
    - Debugowanie usługi launchd Gateway na macOS
    - Instalowanie CLI Gateway dla macOS
summary: Środowisko uruchomieniowe Gateway w macOS (zewnętrzna usługa launchd)
title: Gateway na macOS
x-i18n:
    generated_at: "2026-06-28T00:12:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app nie dołącza już Node/Bun ani środowiska uruchomieniowego Gateway. Aplikacja macOS
oczekuje **zewnętrznej** instalacji CLI `openclaw`, nie uruchamia Gateway jako
procesu podrzędnego i zarządza usługą launchd dla użytkownika, aby utrzymywać Gateway
w działaniu (albo dołącza do istniejącego lokalnego Gateway, jeśli już działa).

## Zainstaluj CLI (wymagane dla trybu lokalnego)

Node 24 jest domyślnym środowiskiem uruchomieniowym na Macu. Node 22 LTS, obecnie `22.19+`, nadal działa ze względu na zgodność. Następnie zainstaluj `openclaw` globalnie:

```bash
npm install -g openclaw@<version>
```

Przycisk **Zainstaluj CLI** w aplikacji macOS uruchamia ten sam globalny przepływ instalacji, którego aplikacja
używa wewnętrznie: najpierw preferuje npm, potem pnpm, a następnie bun, jeśli jest to jedyny
wykryty menedżer pakietów. Node pozostaje zalecanym środowiskiem uruchomieniowym Gateway.

## Launchd (Gateway jako LaunchAgent)

Etykieta:

- `ai.openclaw.gateway` (lub `ai.openclaw.<profile>`; starsze `com.openclaw.*` może pozostać)

Lokalizacja plist (dla użytkownika):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (lub `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Menedżer:

- Aplikacja macOS odpowiada za instalację/aktualizację LaunchAgent w trybie lokalnym.
- CLI również może ją zainstalować: `openclaw gateway install`.

Zachowanie:

- „OpenClaw aktywny” włącza/wyłącza LaunchAgent.
- Zamknięcie aplikacji **nie** zatrzymuje Gateway (launchd utrzymuje go przy życiu).
- Jeśli Gateway już działa na skonfigurowanym porcie, aplikacja dołącza do
  niego zamiast uruchamiać nowy.

Rejestrowanie:

- stdout launchd: `~/Library/Logs/openclaw/gateway.log` (profile używają `gateway-<profile>.log`)
- stderr launchd: wyciszony

## Zgodność wersji

Aplikacja macOS sprawdza wersję Gateway względem własnej wersji. Jeśli są
niezgodne, zaktualizuj globalne CLI, aby odpowiadało wersji aplikacji.

## Katalog stanu w macOS

Przechowuj stan OpenClaw na lokalnym, niesynchronizowanym dysku. Unikaj iCloud Drive oraz innych
folderów synchronizowanych z chmurą, ponieważ opóźnienia synchronizacji i blokady plików mogą wpływać na sesje,
poświadczenia oraz stan Gateway.

Ustaw `OPENCLAW_STATE_DIR` na ścieżkę lokalną tylko wtedy, gdy potrzebujesz nadpisania.
`openclaw doctor` ostrzega o typowych ścieżkach stanu synchronizowanych z chmurą i zaleca
powrót do pamięci lokalnej. Zobacz
[zmienne środowiskowe](/pl/help/environment#path-related-env-vars) i
[Doctor](/pl/gateway/doctor).

## Debugowanie łączności aplikacji

Użyj debugowego CLI macOS z checkoutu źródłowego, aby wykonać tę samą logikę uzgadniania
WebSocket Gateway i wykrywania, której używa aplikacja:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` przyjmuje `--url`, `--token`, `--timeout` i `--json`. `discover`
przyjmuje `--timeout`, `--json` i `--include-local`. Porównaj wynik wykrywania
z `openclaw gateway discover --json`, gdy trzeba oddzielić wykrywanie przez CLI
od problemów z połączeniem po stronie aplikacji.

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

- [aplikacja macOS](/pl/platforms/macos)
- [runbook Gateway](/pl/gateway)
