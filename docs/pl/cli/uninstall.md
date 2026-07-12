---
read_when:
    - Chcesz usunąć usługę Gateway i/lub stan lokalny
    - Najpierw chcesz wykonać przebieg próbny
summary: Dokumentacja CLI dla `openclaw uninstall` (usunięcie usługi Gateway i danych lokalnych)
title: Odinstalowanie
x-i18n:
    generated_at: "2026-07-12T15:03:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Odinstalowuje usługę Gateway i/lub usuwa dane lokalne. Sam interfejs CLI nie
jest usuwany; należy odinstalować go osobno za pomocą npm/pnpm.

## Opcje

| Flaga               | Domyślnie | Opis                                                   |
| ------------------- | --------- | ------------------------------------------------------ |
| `--service`         | `false`   | Usuwa usługę Gateway.                                  |
| `--state`           | `false`   | Usuwa stan i konfigurację.                             |
| `--workspace`       | `false`   | Usuwa katalogi obszarów roboczych.                     |
| `--app`             | `false`   | Usuwa aplikację dla systemu macOS.                     |
| `--all`             | `false`   | Skrót dla `--service --state --workspace --app`.       |
| `--yes`             | `false`   | Pomija monity o potwierdzenie.                         |
| `--non-interactive` | `false`   | Wyłącza monity; wymaga opcji `--yes`.                  |
| `--dry-run`         | `false`   | Wyświetla planowane działania bez usuwania plików.     |

Jeśli nie podano flag określających zakres, interaktywna lista wielokrotnego wyboru
umożliwia wskazanie komponentów do usunięcia (domyślnie wstępnie wybrane są usługa, stan i obszar roboczy).

## Przykłady

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## Uwagi

- Przed usunięciem stanu lub obszarów roboczych należy najpierw uruchomić
  `openclaw backup create`, aby utworzyć migawkę umożliwiającą przywrócenie danych.
- Opcja `--state` zachowuje skonfigurowane katalogi obszarów roboczych, chyba że
  wybrano również opcję `--workspace`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Odinstalowywanie](/pl/install/uninstall)
