---
read_when:
    - Chcesz zobaczyć, które Skills są dostępne i gotowe do uruchomienia
    - Chcesz wyszukiwać, instalować lub aktualizować Skills z ClawHub
    - Chcesz debugować brakujące binaria/env/config dla Skills
summary: Dokumentacja CLI dla `openclaw skills` (search/install/update/list/info/check)
title: skills
x-i18n:
    generated_at: "2026-04-05T13:49:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11af59b1b6bff19cc043acd8d67bdd4303201d3f75f23c948b83bf14882c7bb1
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Sprawdzaj lokalne Skills oraz instaluj/aktualizuj Skills z ClawHub.

Powiązane:

- System Skills: [Skills](/tools/skills)
- Konfiguracja Skills: [Skills config](/tools/skills-config)
- Instalacje ClawHub: [ClawHub](/tools/clawhub)

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
katalogu `skills/` w workspace. `list`/`info`/`check` nadal sprawdzają lokalne
Skills widoczne dla bieżącego workspace i konfiguracji.

To polecenie CLI `install` pobiera foldery Skills z ClawHub. Instalacje zależności Skills
obsługiwane przez gateway, wyzwalane z onboardingu lub ustawień Skills, używają zamiast tego
osobnej ścieżki żądania `skills.install`.

Uwagi:

- `search [query...]` akceptuje opcjonalne zapytanie; pomiń je, aby przeglądać domyślny
  feed wyszukiwania ClawHub.
- `search --limit <n>` ogranicza liczbę zwracanych wyników.
- `install --force` nadpisuje istniejący folder Skills w workspace dla tego samego
  sluga.
- `update --all` aktualizuje tylko śledzone instalacje ClawHub w aktywnym workspace.
- `list` jest domyślną akcją, gdy nie podano żadnego podpolecenia.
- `list`, `info` i `check` zapisują swoje wyrenderowane wyjście na stdout. Z
  `--json` oznacza to, że ładunek czytelny maszynowo pozostaje na stdout dla potoków
  i skryptów.
