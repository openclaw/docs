---
read_when:
    - Pakowanie OpenClaw.app
    - Debugowanie usługi launchd Gateway w macOS
    - Instalowanie CLI Gateway dla macOS
summary: Środowisko uruchomieniowe Gateway w macOS (zewnętrzna usługa launchd)
title: Gateway na macOS
x-i18n:
    generated_at: "2026-07-04T06:54:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app nie zawiera już w pakiecie Node/Bun ani środowiska uruchomieniowego Gateway. Aplikacja macOS
oczekuje **zewnętrznej** instalacji `openclaw` CLI, nie uruchamia Gateway jako
procesu potomnego i zarządza usługą launchd dla użytkownika, aby utrzymywać Gateway
w działaniu (albo dołącza do istniejącego lokalnego Gateway, jeśli już działa).

## Automatyczna konfiguracja

Na świeżym Macu wybierz **Ten Mac** podczas onboardingu. Aplikacja uruchamia swój podpisany,
dołączony instalator przed kreatorem Gateway, instaluje środowisko uruchomieniowe Node w przestrzeni użytkownika
i pasujące `openclaw` CLI w `~/.openclaw`, a następnie instaluje i uruchamia
usługę launchd dla użytkownika. Ta ścieżka nie wymaga Terminala, Homebrew ani
dostępu administratora.

Aplikacja zawiera w pakiecie skrypt instalatora, a nie ładunek Node ani Gateway. Konfiguracja
wymaga więc połączenia z internetem, aby pobrać środowisko uruchomieniowe i pasujący
pakiet OpenClaw.

## Ręczne odzyskiwanie

Node 24 jest zalecany do ręcznej instalacji. Node 22 LTS, obecnie `22.19+`,
również działa. Następnie zainstaluj `openclaw` globalnie:

```bash
npm install -g openclaw@<version>
```

Użyj **Ponów konfigurację** po nieudanej automatycznej konfiguracji. Jeśli to nadal się nie powiedzie, zainstaluj
CLI ręcznie za pomocą powyższego polecenia, a następnie wybierz **Sprawdź ponownie** w
onboardingu. Node pozostaje zalecanym środowiskiem uruchomieniowym Gateway.

## Launchd (Gateway jako LaunchAgent)

Etykieta:

- `ai.openclaw.gateway` (lub `ai.openclaw.<profile>`; starsze `com.openclaw.*` może pozostać)

Lokalizacja plist (dla użytkownika):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (lub `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Menedżer:

- Aplikacja macOS odpowiada za instalację/aktualizację LaunchAgent w trybie lokalnym.
- CLI też może go zainstalować: `openclaw gateway install`.

Zachowanie:

- „OpenClaw aktywny” włącza/wyłącza LaunchAgent.
- Zamknięcie aplikacji **nie** zatrzymuje gateway (launchd utrzymuje go przy życiu).
- Jeśli Gateway już działa na skonfigurowanym porcie, aplikacja dołącza do
  niego zamiast uruchamiać nowy.

Logowanie:

- stdout launchd: `~/Library/Logs/openclaw/gateway.log` (profile używają `gateway-<profile>.log`)
- stderr launchd: wyciszone

## Zgodność wersji

Aplikacja macOS sprawdza wersję Gateway względem własnej wersji. Onboarding
automatycznie uruchamia zarządzaną konfigurację, gdy istniejącego CLI brakuje albo jest
niezgodne. Użyj **Ponów konfigurację**, aby powtórzyć instalację, albo **Sprawdź ponownie**
po naprawieniu zewnętrznego CLI.

## Katalog stanu w macOS

Przechowuj stan OpenClaw na lokalnym, niesynchronizowanym dysku. Unikaj iCloud Drive i innych
folderów synchronizowanych z chmurą, ponieważ opóźnienia synchronizacji i blokady plików mogą wpływać na sesje,
dane uwierzytelniające i stan Gateway.

Ustaw `OPENCLAW_STATE_DIR` na ścieżkę lokalną tylko wtedy, gdy potrzebujesz nadpisania.
`openclaw doctor` ostrzega przed typowymi ścieżkami stanu synchronizowanymi z chmurą i zaleca
powrót do lokalnej pamięci. Zobacz
[zmienne środowiskowe](/pl/help/environment#path-related-env-vars) i
[Doctor](/pl/gateway/doctor).

## Debugowanie łączności aplikacji

Użyj debugowego CLI macOS z checkoutu źródeł, aby wykonać ten sam handshake WebSocket
Gateway i logikę wykrywania, których używa aplikacja:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` akceptuje `--url`, `--token`, `--timeout` i `--json`. `discover`
akceptuje `--timeout`, `--json` i `--include-local`. Porównaj wynik wykrywania
z `openclaw gateway discover --json`, gdy musisz oddzielić wykrywanie CLI
od problemów z połączeniem po stronie aplikacji.

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

- [aplikacja macOS](/pl/platforms/macos)
- [runbook Gateway](/pl/gateway)
