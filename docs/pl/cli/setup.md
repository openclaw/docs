---
read_when:
    - Przeprowadzasz konfigurację przy pierwszym uruchomieniu za pomocą kreatora onboardingu CLI
    - Chcesz ustawić domyślną ścieżkę obszaru roboczego
    - Potrzebujesz flagi konfiguracji tylko bazowej dla skryptów
summary: Dokumentacja CLI dla `openclaw setup` (alias onboardingu, z podstawową konfiguracją dostępną przez flagę)
title: Konfiguracja
x-i18n:
    generated_at: "2026-06-30T22:38:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Uruchamia pełny proces wdrażania w CLI. `openclaw setup` jest aliasem `openclaw onboard`; użyj `--baseline`, gdy chcesz tylko zainicjować foldery konfiguracji/przestrzeni roboczej bez kreatora.

<Note>
`openclaw setup` jest przeznaczone do instalacji z modyfikowalną konfiguracją. W trybie Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw odmawia zapisów konfiguracji, ponieważ plik konfiguracji jest zarządzany przez Nix. Użyj oficjalnego [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) albo równoważnej konfiguracji źródłowej dla innego pakietu Nix.
</Note>

## Opcje

| Flaga                      | Opis                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Katalog przestrzeni roboczej agenta (domyślnie `~/.openclaw/workspace`; zapisany jako `agents.defaults.workspace`). |
| `--baseline`               | Tworzy podstawowe foldery konfiguracji/przestrzeni roboczej/sesji bez wdrażania.                              |
| `--wizard`                 | Akceptowane dla zgodności; setup domyślnie uruchamia wdrażanie.                                                |
| `--non-interactive`        | Uruchamia wdrażanie bez monitów.                                                                              |
| `--accept-risk`            | Potwierdza ryzyko dostępu agenta do całego systemu; wymagane z `--non-interactive`.                           |
| `--mode <mode>`            | Tryb wdrażania: `local` lub `remote`.                                                                         |
| `--import-from <provider>` | Dostawca migracji uruchamiany podczas wdrażania.                                                              |
| `--import-source <path>`   | Katalog domowy agenta źródłowego dla `--import-from`.                                                         |
| `--import-secrets`         | Importuje obsługiwane sekrety podczas migracji wdrażania.                                                     |
| `--remote-url <url>`       | Zdalny adres URL WebSocket Gateway.                                                                           |
| `--remote-token <token>`   | Token zdalnego Gateway (opcjonalny).                                                                          |

### Tryb podstawowy

`openclaw setup --baseline` zachowuje starsze zachowanie obejmujące tylko konfigurację podstawową: tworzy katalogi konfiguracji, przestrzeni roboczej i sesji, a następnie kończy działanie bez uruchamiania wdrażania.

## Przykłady

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Uwagi

- Zwykłe `openclaw setup` uruchamia ten sam prowadzony proces co `openclaw onboard`.
- Po podstawowej konfiguracji uruchom `openclaw setup` lub `openclaw onboard`, aby przejść pełny prowadzony proces, `openclaw configure` do ukierunkowanych zmian albo `openclaw channels add`, aby dodać konta kanałów.
- Jeśli zostanie wykryty stan Hermes, interaktywne wdrażanie może automatycznie zaoferować migrację. Wdrażanie z importem wymaga świeżej konfiguracji; użyj [Migracja](/pl/cli/migrate), aby poza wdrażaniem przygotować plany próbne, kopie zapasowe i tryb nadpisywania.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wdrażanie (CLI)](/pl/start/wizard)
- [Pierwsze kroki](/pl/start/getting-started)
- [Omówienie instalacji](/pl/install)
