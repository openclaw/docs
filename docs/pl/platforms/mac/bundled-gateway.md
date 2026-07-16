---
read_when:
    - Pakowanie OpenClaw.app
    - Debugowanie usługi launchd Gateway na macOS
    - Instalowanie CLI Gateway dla systemu macOS
summary: Środowisko uruchomieniowe Gateway w systemie macOS (zewnętrzna usługa launchd)
title: Gateway w systemie macOS
x-i18n:
    generated_at: "2026-07-16T18:47:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app nie zawiera środowiska Node ani środowiska uruchomieniowego Gateway. Aplikacja macOS
oczekuje **zewnętrznej** instalacji CLI `openclaw`, nie uruchamia Gateway jako
procesu podrzędnego i zarządza usługą launchd dla każdego użytkownika, aby Gateway
pozostawał uruchomiony (lub łączy się z już uruchomionym lokalnym Gateway).

## Automatyczna konfiguracja

Na nowym komputerze Mac podczas wdrażania wybierz **This Mac**. Przed kreatorem
Gateway aplikacja uruchamia podpisany, dołączony skrypt instalacyjny: instaluje
środowisko uruchomieniowe Node w przestrzeni użytkownika oraz odpowiedni CLI `openclaw` w `~/.openclaw`,
a następnie instaluje i uruchamia usługę launchd dla użytkownika. Ta ścieżka nie wymaga
Terminala, Homebrew ani dostępu administratora.

Aplikacja zawiera tylko skrypt instalacyjny, a nie pakiet Node ani Gateway;
konfiguracja wymaga połączenia z internetem w celu pobrania środowiska uruchomieniowego i odpowiedniego
pakietu OpenClaw.

## Ręczne odzyskiwanie

Do instalacji ręcznej zalecany jest Node 24.15+; działa również Node 22.22.3+. Zainstaluj
`openclaw` globalnie:

```bash
npm install -g openclaw@<version>
```

Po nieudanej konfiguracji automatycznej użyj opcji **Retry setup**. Jeśli nadal się nie powiedzie,
zainstaluj CLI ręcznie za pomocą powyższego polecenia, a następnie podczas wdrażania wybierz **Check again**.

## Launchd (Gateway jako LaunchAgent)

Etykieta: `ai.openclaw.gateway` (profil domyślny) lub `ai.openclaw.<profile>`
dla profilu nazwanego.

Lokalizacja plist (dla użytkownika): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(lub `ai.openclaw.<profile>.plist`).

W trybie lokalnym aplikacja macOS zarządza instalacją i aktualizacją LaunchAgent dla profilu domyślnego.
CLI również może zainstalować go bezpośrednio: `openclaw gateway install`
(profile nazwane wybiera się za pomocą zmiennej środowiskowej `OPENCLAW_PROFILE`).

Działanie:

- „OpenClaw Active” włącza lub wyłącza LaunchAgent.
- Zamknięcie aplikacji **nie** zatrzymuje Gateway (launchd utrzymuje go przy życiu).
- Jeśli Gateway jest już uruchomiony na skonfigurowanym porcie, aplikacja łączy się
  z nim zamiast uruchamiać nowy.

Rejestrowanie:

- Standardowe wyjście launchd: `~/Library/Logs/openclaw/gateway.log` (profile używają
  `gateway-<profile>.log`)
- Standardowe wyjście błędów launchd: wyciszone
- Jeśli host wpada w pętlę z powtarzającymi się komunikatami `EADDRINUSE` lub szybkimi restartami, sprawdź,
  czy nie ma zduplikowanych LaunchAgentów `ai.openclaw.gateway` / `ai.openclaw.node`, oraz obejście
  znacznika launchd opisane w sekcji
  [rozwiązywania problemów z Gateway](/pl/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents).

## Zgodność wersji

Aplikacja macOS porównuje wersję Gateway ze swoją wersją. Podczas wdrażania
zarządzana konfiguracja jest uruchamiana automatycznie, gdy istniejącego CLI brakuje lub
jest niezgodny. Użyj opcji **Retry setup**, aby powtórzyć instalację, albo **Check again**
po naprawieniu zewnętrznego CLI.

## Katalog stanu w systemie macOS

Stan OpenClaw należy przechowywać na lokalnym, niesynchronizowanym dysku. Unikaj iCloud Drive i innych
folderów synchronizowanych z chmurą; opóźnienia synchronizacji i blokady plików mogą wpływać na sesje,
dane uwierzytelniające i stan Gateway.

Ustaw `OPENCLAW_STATE_DIR` na lokalną ścieżkę tylko wtedy, gdy konieczne jest nadpisanie ustawienia.
`openclaw doctor` ostrzega przed typowymi ścieżkami stanu synchronizowanymi z chmurą i zaleca
powrót do lokalnej pamięci masowej. Zobacz
[zmienne środowiskowe](/pl/help/environment#path-related-env-vars) oraz
[Doctor](/pl/gateway/doctor).

## Debugowanie łączności aplikacji

Użyj debugowego CLI macOS z kopii roboczej kodu źródłowego, aby przetestować ten sam mechanizm
uzgadniania połączenia WebSocket z Gateway i logikę wykrywania, których używa aplikacja:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` obsługuje `--url`, `--token`, `--timeout`, `--probe` oraz `--json`
(a także nadpisania tożsamości klienta; uruchom z `--help`, aby wyświetlić pełną listę).
`discover` obsługuje `--timeout`, `--json` oraz `--include-local`. Porównaj
wyniki wykrywania z `openclaw gateway discover --json`, gdy trzeba
odróżnić problemy z wykrywaniem przez CLI od problemów z połączeniem po stronie aplikacji.

## Test dymny

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
- [podręcznik operacyjny Gateway](/pl/gateway)
