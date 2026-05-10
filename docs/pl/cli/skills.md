---
read_when:
    - Chcesz zobaczyć, które Skills są dostępne i gotowe do uruchomienia
    - Chcesz wyszukiwać, instalować lub aktualizować Skills z ClawHub
    - Chcesz debugować brakujące pliki binarne/env/konfigurację dla Skills
summary: Dokumentacja referencyjna CLI dla `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:30:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90663068f51cd3aabe9cfcf60e319ce9f9016e338488797869162608132a9e87
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Sprawdzaj lokalne Skills oraz instaluj/aktualizuj Skills z ClawHub.

Powiązane:

- System Skills: [Skills](/pl/tools/skills)
- Konfiguracja Skills: [Konfiguracja Skills](/pl/tools/skills-config)
- Instalacje ClawHub: [ClawHub](/pl/clawhub/cli)

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

`search`/`install`/`update` używają bezpośrednio ClawHub i instalują w katalogu
`skills/` aktywnej przestrzeni roboczej. `list`/`info`/`check` nadal sprawdzają
lokalne Skills widoczne dla bieżącej przestrzeni roboczej i konfiguracji.
Polecenia oparte na przestrzeni roboczej ustalają docelową przestrzeń roboczą
na podstawie `--agent <id>`, następnie bieżącego katalogu roboczego, gdy znajduje
się on w skonfigurowanej przestrzeni roboczej agenta, a następnie domyślnego
agenta.

To polecenie CLI `install` pobiera foldery Skills z ClawHub. Instalacje
zależności Skills oparte na Gateway, wyzwalane z wdrażania lub ustawień Skills,
używają zamiast tego oddzielnej ścieżki żądania `skills.install`.

Uwagi:

- `search [query...]` akceptuje opcjonalne zapytanie; pomiń je, aby przeglądać
  domyślny kanał wyszukiwania ClawHub.
- `search --limit <n>` ogranicza liczbę zwracanych wyników.
- `install --force` nadpisuje istniejący folder Skills w przestrzeni roboczej
  dla tego samego sluga.
- `--agent <id>` wskazuje jedną skonfigurowaną przestrzeń roboczą agenta i
  zastępuje wnioskowanie na podstawie bieżącego katalogu roboczego.
- `update --all` aktualizuje tylko śledzone instalacje ClawHub w aktywnej
  przestrzeni roboczej.
- `check --agent <id>` sprawdza przestrzeń roboczą wybranego agenta i raportuje,
  które gotowe Skills są faktycznie widoczne w prompcie tego agenta lub na
  powierzchni poleceń.
- `list` jest domyślną akcją, gdy nie podano podpolecenia.
- `list`, `info` i `check` zapisują renderowane dane wyjściowe do stdout. Z
  `--json` oznacza to, że ładunek czytelny maszynowo pozostaje na stdout dla
  potoków i skryptów.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Skills](/pl/tools/skills)
