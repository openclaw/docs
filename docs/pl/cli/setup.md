---
read_when:
    - Przeprowadzasz konfigurację początkową za pomocą kreatora wdrażania w CLI
    - Chcesz ustawić domyślną ścieżkę obszaru roboczego
    - Potrzebujesz flagi konfiguracji wyłącznie bazowej dla skryptów
summary: Dokumentacja CLI dla `openclaw setup` (alias procesu wdrażania, z podstawową konfiguracją dostępną za pomocą flagi)
title: Konfiguracja
x-i18n:
    generated_at: "2026-07-12T14:56:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Polecenie `openclaw setup` uruchamia ten sam prowadzony proces wstępnej konfiguracji co `openclaw onboard`:
najpierw weryfikuje i zapisuje konfigurację inferencji, a następnie uruchamia Crestodian w celu skonfigurowania
obszaru roboczego, Gateway, kanałów, Skills oraz stanu systemu. Użyj `--baseline`, gdy
chcesz jedynie zainicjować foldery konfiguracji i obszaru roboczego bez kreatora.

W trybie prowadzonym `--workspace <dir>` określa obszar roboczy proponowany narzędziu Crestodian;
zostaje on zapisany dopiero po zatwierdzeniu tej propozycji. Konfiguracja bazowa, klasyczna i
nieinteraktywna zapisują podany obszar roboczy w ramach swoich standardowych procesów.

Polecenie `setup` przyjmuje te same flagi wstępnej konfiguracji co `openclaw onboard`, w tym
uwierzytelniania (`--auth-choice`, `--token`, flagi kluczy dostawców), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), resetowania (`--reset`, `--reset-scope`), przebiegu
(`--flow quickstart|advanced|manual|import`) oraz pomijania
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Pełny opis flag i
przykłady użycia nieinteraktywnego zawierają strony [Wstępna konfiguracja](/pl/cli/onboard) oraz
[Automatyzacja CLI](/pl/start/wizard-cli-automation). `openclaw onboard --modern` jest aliasem zgodności
dla asystenta Crestodian z bramką inferencji i nie ma odpowiednika w poleceniu `setup`.

<Note>
Polecenie `openclaw setup` służy do instalacji z modyfikowalną konfiguracją. W trybie Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw odmawia zapisywania zmian konfiguracji, ponieważ plikiem konfiguracyjnym zarządza Nix. Skorzystaj z oficjalnej instrukcji [Szybki start z nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) lub równoważnej konfiguracji źródłowej dla innego pakietu Nix.
</Note>

## Opcje

| Flaga                      | Opis                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Propozycja obszaru roboczego w trybie prowadzonym; zapisywana bezpośrednio przez konfigurację bazową, klasyczną i nieinteraktywną. |
| `--baseline`               | Tworzy bazowe foldery konfiguracji, obszaru roboczego i sesji bez wstępnej konfiguracji.                         |
| `--wizard`                 | Akceptowana ze względu na zgodność; polecenie setup domyślnie uruchamia wstępną konfigurację.                    |
| `--non-interactive`        | Uruchamia wstępną konfigurację bez monitów.                                                                      |
| `--accept-risk`            | Potwierdza ryzyko związane z dostępem agenta do całego systemu; wymagane z `--non-interactive`.                  |
| `--mode <mode>`            | Tryb wstępnej konfiguracji: `local` lub `remote`.                                                                |
| `--flow <flow>`            | Przebieg wstępnej konfiguracji: `quickstart`, `advanced`, `manual` lub `import`.                                 |
| `--reset`                  | Resetuje konfigurację, dane uwierzytelniające i sesje przed wstępną konfiguracją (obszar roboczy tylko z `--reset-scope full`). |
| `--reset-scope <scope>`    | Zakres resetowania: `config`, `config+creds+sessions` lub `full`.                                                |
| `--import-from <provider>` | Dostawca migracji uruchamianej podczas wstępnej konfiguracji.                                                    |
| `--import-source <path>`   | Katalog domowy agenta źródłowego dla `--import-from`.                                                            |
| `--import-secrets`         | Importuje obsługiwane sekrety podczas migracji w ramach wstępnej konfiguracji.                                  |
| `--remote-url <url>`       | Adres URL WebSocket zdalnego Gateway.                                                                            |
| `--remote-token <token>`   | Token zdalnego Gateway (opcjonalny).                                                                              |
| `--json`                   | Wyświetla podsumowanie w formacie JSON.                                                                           |

Opcje `--classic` i `--non-interactive` wzajemnie się wykluczają: tryb klasyczny otwiera
kreator z monitami, natomiast konfiguracja nieinteraktywna korzysta ze ścieżki automatyzacji.

### Tryb bazowy

Polecenie `openclaw setup --baseline` zachowuje starsze działanie ograniczone do konfiguracji bazowej:
tworzy katalogi konfiguracji, obszaru roboczego i sesji, a następnie kończy działanie bez
uruchamiania wstępnej konfiguracji.

## Przykłady

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Uwagi

- Po konfiguracji bazowej uruchom `openclaw setup` lub `openclaw onboard`, aby przejść pełny prowadzony proces, `openclaw configure`, aby wprowadzić wybrane zmiany, albo `openclaw channels add`, aby dodać konta kanałów.
- W przypadku wykrycia stanu Hermes interaktywna wstępna konfiguracja może automatycznie zaproponować migrację. Import w ramach wstępnej konfiguracji wymaga świeżej konfiguracji; użyj polecenia [Migracja](/pl/cli/migrate), aby poza wstępną konfiguracją tworzyć plany przebiegu próbnego i kopie zapasowe oraz korzystać z trybu nadpisywania.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wstępna konfiguracja](/pl/cli/onboard)
- [Wstępna konfiguracja (CLI)](/pl/start/wizard)
- [Pierwsze kroki](/pl/start/getting-started)
- [Omówienie instalacji](/pl/install)
