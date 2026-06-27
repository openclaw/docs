---
read_when:
    - Przeprowadzasz pierwszą konfigurację bez pełnego onboardingu CLI
    - Chcesz ustawić domyślną ścieżkę obszaru roboczego
    - Potrzebujesz wszystkich flag oraz informacji, jak konfiguracja decyduje między trybem bazowym a trybem kreatora
summary: Dokumentacja CLI dla `openclaw setup` (inicjalizacja konfiguracji oraz obszaru roboczego, opcjonalne uruchomienie onboardingu)
title: Konfiguracja
x-i18n:
    generated_at: "2026-06-27T17:23:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inicjuje bazową konfigurację i obszar roboczy agenta. Gdy obecna jest dowolna flaga onboardingu, uruchamia także kreator.

<Note>
`openclaw setup` służy do instalacji z modyfikowalną konfiguracją. W trybie Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw odmawia zapisów konfiguracji, ponieważ plik konfiguracji jest zarządzany przez Nix. Użyj oficjalnego [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) albo równoważnej konfiguracji źródłowej dla innego pakietu Nix.
</Note>

## Opcje

| Flaga                      | Opis                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `--workspace <dir>`        | Katalog obszaru roboczego agenta (domyślnie `~/.openclaw/workspace`; zapisywany jako `agents.defaults.workspace`). |
| `--wizard`                 | Uruchom interaktywny onboarding.                                                                                   |
| `--non-interactive`        | Uruchom onboarding bez monitów.                                                                                    |
| `--accept-risk`            | Potwierdź ryzyko dostępu agenta do całego systemu; wymagane z `--non-interactive`.                                 |
| `--mode <mode>`            | Tryb onboardingu: `local` lub `remote`.                                                                            |
| `--import-from <provider>` | Dostawca migracji do uruchomienia podczas onboardingu.                                                             |
| `--import-source <path>`   | Źródłowy katalog domowy agenta dla `--import-from`.                                                                |
| `--import-secrets`         | Importuj obsługiwane sekrety podczas migracji w onboardingu.                                                       |
| `--remote-url <url>`       | Adres URL WebSocket zdalnego Gateway.                                                                              |
| `--remote-token <token>`   | Token zdalnego Gateway (opcjonalny).                                                                               |

### Automatyczne uruchamianie kreatora

`openclaw setup` uruchamia kreator, gdy którakolwiek z tych flag jest jawnie obecna, nawet bez `--wizard`:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Przykłady

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Uwagi

- Samo `openclaw setup` inicjuje konfigurację i obszar roboczy bez uruchamiania pełnego przepływu onboardingu.
- Po zwykłym setupie uruchom `openclaw onboard`, aby przejść przez pełną prowadzoną ścieżkę, `openclaw configure` dla ukierunkowanych zmian albo `openclaw channels add`, aby dodać konta kanałów.
- Jeśli wykryto stan Hermes, interaktywny onboarding może automatycznie zaoferować migrację. Onboarding importu wymaga świeżego setupu; użyj [Migracja](/pl/cli/migrate) dla planów próbnego uruchomienia, kopii zapasowych i trybu nadpisywania poza onboardingiem.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Onboarding (CLI)](/pl/start/wizard)
- [Pierwsze kroki](/pl/start/getting-started)
- [Omówienie instalacji](/pl/install)
