---
read_when:
    - Chcesz wyczyścić stan lokalny, zachowując zainstalowane CLI
    - Chcesz wykonać próbę na sucho tego, co zostałoby usunięte
summary: Odwołanie CLI dla `openclaw reset` (resetowanie stanu/konfiguracji lokalnej)
title: Resetowanie
x-i18n:
    generated_at: "2026-04-24T09:04:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

Resetuje lokalny stan/konfigurację (pozostawia zainstalowane CLI).

Opcje:

- `--scope <scope>`: `config`, `config+creds+sessions` lub `full`
- `--yes`: pomija monity o potwierdzenie
- `--non-interactive`: wyłącza monity; wymaga `--scope` i `--yes`
- `--dry-run`: wypisuje działania bez usuwania plików

Przykłady:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Uwagi:

- Najpierw uruchom `openclaw backup create`, jeśli chcesz mieć możliwą do przywrócenia migawkę przed usunięciem stanu lokalnego.
- Jeśli pominiesz `--scope`, `openclaw reset` użyje interaktywnego monitu do wyboru, co usunąć.
- `--non-interactive` jest prawidłowe tylko wtedy, gdy ustawiono zarówno `--scope`, jak i `--yes`.

## Powiązane

- [Odwołanie CLI](/pl/cli)
