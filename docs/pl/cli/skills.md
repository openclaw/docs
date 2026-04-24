---
read_when:
    - Chcesz zobaczyć, które Skills są dostępne i gotowe do uruchomienia
    - Chcesz wyszukiwać, instalować lub aktualizować Skills z ClawHub
    - Chcesz debugować brakujące pliki binarne/env/config dla Skills
summary: Dokumentacja CLI dla `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-04-24T09:04:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31cd7647a15cd5df6cf5a2311e63bb11cc3aabfe8beefda7be57dc76adc509ea
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Sprawdzaj lokalne Skills oraz instaluj/aktualizuj Skills z ClawHub.

Powiązane:

- System Skills: [Skills](/pl/tools/skills)
- Konfiguracja Skills: [Skills config](/pl/tools/skills-config)
- Instalacje ClawHub: [ClawHub](/pl/tools/clawhub)

## Polecenia

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search`/`install`/`update` używają bezpośrednio ClawHub i instalują do aktywnego
katalogu `skills/` obszaru roboczego. `list`/`info`/`check` nadal sprawdzają lokalne
Skills widoczne dla bieżącego obszaru roboczego i konfiguracji.

To polecenie CLI `install` pobiera foldery skill z ClawHub. Instalacje zależności
skill uruchamiane przez gateway z onboardingu lub ustawień Skills używają zamiast tego
oddzielnej ścieżki żądania `skills.install`.

Uwagi:

- `search [query...]` akceptuje opcjonalne zapytanie; pomiń je, aby przeglądać domyślny
  feed wyszukiwania ClawHub.
- `search --limit <n>` ogranicza liczbę zwracanych wyników.
- `install --force` nadpisuje istniejący folder skill obszaru roboczego dla tego samego
  slug.
- `update --all` aktualizuje tylko śledzone instalacje ClawHub w aktywnym obszarze roboczym.
- `list` jest domyślną akcją, gdy nie podano podpolecenia.
- `list`, `info` i `check` zapisują wyrenderowane dane wyjściowe na stdout. Przy
  `--json` oznacza to, że ładunek czytelny maszynowo pozostaje na stdout dla pipe’ów
  i skryptów.

## Powiązane

- [CLI reference](/pl/cli)
- [Skills](/pl/tools/skills)
