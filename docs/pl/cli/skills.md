---
read_when:
    - Chcesz zobaczyć, które Skills są dostępne i gotowe do uruchomienia
    - Chcesz wyszukiwać, instalować lub aktualizować Skills z ClawHub
    - Chcesz debugować brakujące pliki binarne/zmienne środowiskowe/konfigurację dla Skills
summary: Dokumentacja referencyjna CLI dla `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-02T20:43:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: d819cdc421151a0093423f57a9e974489e9cc02de644358bd5700ee75181192e
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Sprawdzaj lokalne Skills oraz instaluj/aktualizuj Skills z ClawHub.

Powiązane:

- System Skills: [Skills](/pl/tools/skills)
- Konfiguracja Skills: [Konfiguracja Skills](/pl/tools/skills-config)
- Instalacje z ClawHub: [ClawHub](/pl/tools/clawhub)

## Polecenia

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
```

`search`/`install`/`update` używają bezpośrednio ClawHub i instalują w katalogu `skills/` aktywnego obszaru roboczego. `list`/`info`/`check` nadal sprawdzają lokalne Skills widoczne dla bieżącego obszaru roboczego i konfiguracji. Polecenia oparte na obszarze roboczym określają docelowy obszar roboczy na podstawie `--agent <id>`, następnie bieżącego katalogu roboczego, gdy znajduje się on w skonfigurowanym obszarze roboczym agenta, a następnie domyślnego agenta.

To polecenie CLI `install` pobiera foldery Skills z ClawHub. Instalacje zależności Skills oparte na Gateway, uruchamiane z onboardingu lub ustawień Skills, używają zamiast tego osobnej ścieżki żądania `skills.install`.

Uwagi:

- `search [query...]` przyjmuje opcjonalne zapytanie; pomiń je, aby przeglądać domyślny kanał wyszukiwania ClawHub.
- `search --limit <n>` ogranicza liczbę zwracanych wyników.
- `install --force` nadpisuje istniejący folder Skills w obszarze roboczym dla tego samego sluga.
- `--agent <id>` wskazuje jeden skonfigurowany obszar roboczy agenta i zastępuje wnioskowanie na podstawie bieżącego katalogu roboczego.
- `update --all` aktualizuje tylko śledzone instalacje ClawHub w aktywnym obszarze roboczym.
- `check --agent <id>` sprawdza obszar roboczy wybranego agenta i raportuje, które gotowe Skills są faktycznie widoczne dla promptu tego agenta lub powierzchni poleceń.
- `list` jest domyślną akcją, gdy nie podano podpolecenia.
- `list`, `info` i `check` zapisują wyrenderowane dane wyjściowe na stdout. Z `--json` oznacza to, że ładunek czytelny maszynowo pozostaje na stdout dla potoków i skryptów.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Skills](/pl/tools/skills)
