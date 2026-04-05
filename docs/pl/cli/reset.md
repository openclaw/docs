---
read_when:
    - Chcesz wyczyścić lokalny stan, zachowując zainstalowane CLI
    - Chcesz wykonać dry-run tego, co zostałoby usunięte
summary: Dokumentacja CLI dla `openclaw reset` (reset lokalnego stanu/config)
title: reset
x-i18n:
    generated_at: "2026-04-05T13:49:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad464700f948bebe741ec309f25150714f0b280834084d4f531327418a42c79b
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

Resetuje lokalny config/stan (pozostawia zainstalowane CLI).

Opcje:

- `--scope <scope>`: `config`, `config+creds+sessions` lub `full`
- `--yes`: pomija prośby o potwierdzenie
- `--non-interactive`: wyłącza podpowiedzi; wymaga `--scope` i `--yes`
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

- Najpierw uruchom `openclaw backup create`, jeśli chcesz mieć możliwą do przywrócenia migawkę przed usunięciem lokalnego stanu.
- Jeśli pominiesz `--scope`, `openclaw reset` użyje interaktywnej podpowiedzi do wyboru elementów do usunięcia.
- `--non-interactive` jest prawidłowe tylko wtedy, gdy ustawiono jednocześnie `--scope` i `--yes`.
