---
read_when:
    - Chcesz wyczyścić stan lokalny, zachowując zainstalowane CLI
    - Chcesz przeprowadzić próbę usuwania bez wprowadzania zmian
summary: Dokumentacja CLI dla `openclaw reset` (resetowanie lokalnego stanu/konfiguracji)
title: Resetuj
x-i18n:
    generated_at: "2026-07-12T15:02:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Resetuje lokalną konfigurację i stan (pozostawia zainstalowany CLI).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## Opcje

- `--scope <scope>`: `config`, `config+creds+sessions` lub `full`
- `--yes`: pomija monity o potwierdzenie
- `--non-interactive`: wyłącza monity; wymaga `--scope` i `--yes`
- `--dry-run`: wyświetla działania bez usuwania plików

## Zakresy

| Zakres                  | Usuwa                                                                                                         | Najpierw zatrzymuje Gateway |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `config`                | tylko plik konfiguracji                                                                                       | nie                         |
| `config+creds+sessions` | plik konfiguracji, katalog OAuth/danych uwierzytelniających i katalogi sesji poszczególnych agentów           | tak                         |
| `full`                  | katalog stanu (w tym konfigurację/dane uwierzytelniające, jeśli są w nim zagnieżdżone), katalogi obszarów roboczych i poświadczenia obszarów roboczych | tak |

Zakresy `config+creds+sessions` i `full` zatrzymują działającą zarządzaną usługę Gateway przed usunięciem stanu.

## Uwagi

- Przed usunięciem stanu lokalnego uruchom najpierw `openclaw backup create`, aby utworzyć migawkę możliwą do przywrócenia.
- Bez `--scope` polecenie `openclaw reset` interaktywnie prosi o wybór zakresu do usunięcia.
- Opcja `--non-interactive` jest prawidłowa tylko wtedy, gdy ustawiono zarówno `--scope`, jak i `--yes`.
- Po zakończeniu zakresy `config+creds+sessions` i `full` wyświetlają komunikat `Next: openclaw onboard --install-daemon`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
