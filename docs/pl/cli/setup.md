---
read_when:
    - Przeprowadzasz konfigurację pierwszego uruchomienia bez pełnego wdrażania w CLI
    - Chcesz ustawić domyślną ścieżkę obszaru roboczego
    - Potrzebujesz wszystkich flag oraz informacji, jak konfiguracja decyduje między trybem bazowym a trybem kreatora
summary: Dokumentacja referencyjna CLI dla `openclaw setup` (inicjalizuje konfigurację oraz przestrzeń roboczą, opcjonalnie uruchamia proces wprowadzania)
title: Konfiguracja
x-i18n:
    generated_at: "2026-05-10T19:30:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inicjalizuje bazową konfigurację i obszar roboczy agenta. Gdy obecna jest dowolna flaga onboardingu, uruchamia też kreator.

<Note>
`openclaw setup` służy do instalacji z modyfikowalną konfiguracją. W trybie Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw odmawia zapisów konfiguracji podczas setupu, ponieważ plik konfiguracji jest zarządzany przez Nix. Użyj oficjalnego [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) albo równoważnej konfiguracji źródłowej dla innego pakietu Nix.
</Note>

## Opcje

| Flaga                      | Opis                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Katalog obszaru roboczego agenta (domyślnie `~/.openclaw/workspace`; przechowywany jako `agents.defaults.workspace`). |
| `--wizard`                 | Uruchom interaktywny onboarding.                                                                            |
| `--non-interactive`        | Uruchom onboarding bez monitów.                                                                             |
| `--mode <mode>`            | Tryb onboardingu: `local` albo `remote`.                                                                    |
| `--import-from <provider>` | Dostawca migracji do uruchomienia podczas onboardingu.                                                      |
| `--import-source <path>`   | Źródłowy katalog domowy agenta dla `--import-from`.                                                         |
| `--import-secrets`         | Importuj obsługiwane sekrety podczas migracji w onboardingu.                                                |
| `--remote-url <url>`       | Adres URL WebSocket zdalnego Gateway.                                                                       |
| `--remote-token <token>`   | Token zdalnego Gateway (opcjonalny).                                                                        |

### Automatyczne wyzwalanie kreatora

`openclaw setup` uruchamia kreator, gdy którakolwiek z tych flag jest jawnie obecna, nawet bez `--wizard`:

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Przykłady

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Uwagi

- Zwykłe `openclaw setup` inicjalizuje konfigurację i obszar roboczy bez uruchamiania pełnego procesu onboardingu.
- Po zwykłym setupie uruchom `openclaw onboard`, aby przejść pełną ścieżkę z przewodnikiem, `openclaw configure`, aby wprowadzić ukierunkowane zmiany, albo `openclaw channels add`, aby dodać konta kanałów.
- Jeśli wykryto stan Hermes, interaktywny onboarding może automatycznie zaoferować migrację. Importowanie podczas onboardingu wymaga świeżego setupu; użyj [Migrate](/pl/cli/migrate), aby przygotować plany próbne, kopie zapasowe i tryb nadpisywania poza onboardingiem.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Onboarding (CLI)](/pl/start/wizard)
- [Pierwsze kroki](/pl/start/getting-started)
- [Omówienie instalacji](/pl/install)
