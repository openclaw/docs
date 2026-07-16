---
read_when:
    - Chcesz porozmawiać z OpenClaw, aby przeprowadzić konfigurację lub naprawę
    - Przeprowadzasz pierwszą konfigurację za pomocą kreatora wdrażania.
    - Chcesz ustawić domyślną ścieżkę przestrzeni roboczej
    - Potrzebna jest flaga konfiguracji wyłącznie bazowej dla skryptów
summary: Dokumentacja CLI dla `openclaw setup` (czat z agentem systemowym z rezerwowym procesem wdrażania)
title: Konfiguracja
x-i18n:
    generated_at: "2026-07-16T18:30:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` jest punktem wejścia agenta systemowego. W skonfigurowanym systemie samo
`openclaw setup` otwiera interaktywny czat OpenClaw. W nowym systemie
uruchamia zamiast tego onboarding z przewodnikiem. Użyj `-m`/`--message` dla pojedynczego żądania lub
`--baseline`, aby zainicjować foldery konfiguracji/przestrzeni roboczej bez kreatora.

Kolejność routingu:

1. Każda opcja onboardingu (`--wizard`, `--baseline`, przestrzeń robocza, reset,
   tryb nieinteraktywny, przepływ, tryb, Gateway, demon, pominięcie, import, tryb zdalny lub opcje
   uwierzytelniania) uruchamia onboarding dokładnie tak samo jak `openclaw onboard`.
2. `-m`/`--message` lub `--yes` uruchamia agenta systemowego.
3. Bez opcji routingu skonfigurowany system interaktywny otwiera OpenClaw. Nowy
   system uruchamia onboarding. W skonfigurowanym systemie `--json` wyświetla
   przegląd systemu nawet bez TTY; opcja onboardingu zachowuje
   podsumowanie JSON onboardingu.

W trybie z przewodnikiem `--workspace <dir>` jest przestrzenią roboczą proponowaną OpenClaw;
zostaje zapisana dopiero po zatwierdzeniu tej propozycji. Konfiguracja bazowa, klasyczna i
nieinteraktywna zapisuje podaną przestrzeń roboczą w ramach swojego standardowego przepływu.

Wykrywanie wnioskowania z przewodnikiem działa na hoście Gateway w systemie macOS lub Linux. CLI
i aplikacja macOS wywołują ten sam detektor należący do Gateway, który sprawdza skonfigurowane
modele, obsługiwane logowania CLI, zmienne środowiskowe kluczy API oraz już
zainstalowane modele Ollama lub LM Studio. Modele lokalne nigdy nie są pobierane podczas tego
automatycznego przebiegu; wybrany kandydat musi odpowiedzieć na rzeczywiste żądanie uzupełnienia, zanim jego
konfiguracja dostawcy i modelu zostanie zapisana.

`setup` akceptuje te same flagi onboardingu co `openclaw onboard`, w tym
uwierzytelniania (`--auth-choice`, `--token`, flagi kluczy dostawcy), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), resetowania (`--reset`, `--reset-scope`), przepływu
(`--flow quickstart|advanced|manual|import`) i pomijania
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Pełną dokumentację flag i
przykłady trybu nieinteraktywnego zawierają strony [Onboarding](/pl/cli/onboard) oraz
[Automatyzacja CLI](/pl/start/wizard-cli-automation). `openclaw onboard --modern` pozostaje wpisem
zgodności dla tego samego asystenta OpenClaw z kontrolą dostępności wnioskowania.

<Note>
`openclaw setup` służy do instalacji z modyfikowalną konfiguracją. W trybie Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw odmawia zapisu konfiguracji, ponieważ plik konfiguracyjny jest zarządzany przez Nix. Użyj oficjalnego [szybkiego startu nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) lub równoważnej konfiguracji źródłowej dla innego pakietu Nix.
</Note>

## Opcje

| Flaga                       | Opis                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Uruchom jedno żądanie OpenClaw.                                                                             |
| `--yes`                    | Zatwierdź trwałe zapisy konfiguracji dla jednego żądania `--message`.                                         |
| `--workspace <dir>`        | Propozycja przestrzeni roboczej w trybie z przewodnikiem; zapisywana bezpośrednio przez konfigurację bazową, klasyczną i nieinteraktywną. |
| `--baseline`               | Utwórz foldery konfiguracji bazowej, przestrzeni roboczej i sesji bez onboardingu.                                  |
| `--wizard`                 | Wymuś interaktywny onboarding.                                                                         |
| `--non-interactive`        | Uruchom onboarding bez monitów.                                                                       |
| `--accept-risk`            | Potwierdź ryzyko dostępu agenta do całego systemu; wymagane z `--non-interactive`.                         |
| `--mode <mode>`            | Tryb onboardingu: `local` lub `remote`.                                                                 |
| `--flow <flow>`            | Przepływ onboardingu: `quickstart`, `advanced`, `manual` lub `import`.                                        |
| `--reset`                  | Zresetuj konfigurację, dane uwierzytelniające i sesje przed onboardingiem (przestrzeń roboczą tylko z `--reset-scope full`).   |
| `--reset-scope <scope>`    | Zakres resetowania: `config`, `config+creds+sessions` lub `full`.                                            |
| `--import-from <provider>` | Dostawca migracji uruchamiany podczas onboardingu.                                                          |
| `--import-source <path>`   | Katalog domowy agenta źródłowego dla `--import-from`.                                                                |
| `--import-secrets`         | Importuj obsługiwane sekrety podczas migracji onboardingu.                                                 |
| `--remote-url <url>`       | Adres URL WebSocket zdalnego Gateway.                                                                         |
| `--remote-token <token>`   | Token zdalnego Gateway (opcjonalny).                                                                      |
| `--json`                   | Skonfigurowany system: przegląd OpenClaw. Trasa onboardingu: podsumowanie onboardingu.                           |

`--classic` i `--non-interactive` wzajemnie się wykluczają: tryb klasyczny otwiera
kreator z monitami, natomiast konfiguracja nieinteraktywna korzysta ze ścieżki automatyzacji.

### Tryb bazowy

`openclaw setup --baseline` zachowuje starsze działanie ograniczone do konfiguracji bazowej:
tworzy katalogi konfiguracji, przestrzeni roboczej i sesji, a następnie kończy działanie bez
uruchamiania onboardingu.

## Przykłady

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Uwagi

- Po konfiguracji bazowej uruchom `openclaw onboard`, aby przejść pełną ścieżkę z przewodnikiem, `openclaw configure`, aby wprowadzić konkretne zmiany, lub `openclaw channels add`, aby dodać konta kanałów.
- Jeśli zostanie wykryty stan Hermes, interaktywny onboarding może automatycznie zaproponować migrację. Onboarding z importem wymaga nowej konfiguracji; użyj strony [Migracja](/pl/cli/migrate), aby uzyskać plany przebiegu próbnego, kopie zapasowe i tryb nadpisywania poza onboardingiem.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Onboarding](/pl/cli/onboard)
- [Onboarding (CLI)](/pl/start/wizard)
- [Pierwsze kroki](/pl/start/getting-started)
- [Przegląd instalacji](/pl/install)
