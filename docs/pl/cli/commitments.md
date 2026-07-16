---
read_when:
    - Chcesz sprawdzić wywnioskowane zobowiązania do dalszych działań
    - Chcesz odrzucić oczekujące zgłoszenia kontrolne
    - Sprawdzasz, co Heartbeat może dostarczyć
summary: Dokumentacja CLI dla `openclaw commitments` (sprawdzanie i odrzucanie wywnioskowanych działań następczych)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T18:10:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

Wyświetlaj zobowiązania do dalszych działań wywnioskowane z kontekstu i zarządzaj nimi.

Zobowiązania są opcjonalne (`commitments.enabled`) i stanowią krótkotrwałe wspomnienia o dalszych działaniach
utworzone na podstawie kontekstu rozmowy oraz dostarczane przez Heartbeat. Zobacz
[Wywnioskowane zobowiązania](/pl/concepts/commitments), aby zapoznać się z przewodnikiem koncepcyjnym i konfiguracją.

Bez podpolecenia `openclaw commitments` wyświetla oczekujące zobowiązania.

## Użycie

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Opcje

- `--all`: pokazuje wszystkie statusy zamiast tylko oczekujących zobowiązań.
- `--agent <id>`: filtruje według jednego identyfikatora agenta.
- `--status <status>`: filtruje według statusu. Wartości: `pending`, `sent`,
  `dismissed`, `snoozed` lub `expired`. Nieznane wartości powodują zakończenie z błędem.
- `--json`: generuje dane wyjściowe JSON przeznaczone do odczytu maszynowego.

`dismiss` oznacza podane identyfikatory zobowiązań jako `dismissed`, dzięki czemu Heartbeat
ich nie dostarczy.

## Przykłady

Wyświetlanie oczekujących zobowiązań:

```bash
openclaw commitments
```

Wyświetlanie wszystkich zapisanych zobowiązań:

```bash
openclaw commitments --all
```

Filtrowanie według jednego agenta:

```bash
openclaw commitments --agent main
```

Wyszukiwanie odroczonych zobowiązań:

```bash
openclaw commitments --status snoozed
```

Odrzucanie jednego lub kilku zobowiązań:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Eksportowanie jako JSON:

```bash
openclaw commitments --all --json
```

## Dane wyjściowe

Tekstowe dane wyjściowe zawierają liczbę zobowiązań, ścieżkę do współdzielonej bazy danych SQLite, wszystkie aktywne filtry
oraz po jednym wierszu dla każdego zobowiązania:

- identyfikator zobowiązania
- status
- rodzaj (`event_check_in`, `deadline_check`, `care_check_in` lub `open_loop`)
- najwcześniejszy termin
- zakres (agent/kanał/cel)
- sugerowana treść wiadomości kontrolnej

Dane wyjściowe JSON zawierają liczbę, aktywne filtry statusu i agenta,
ścieżkę do współdzielonej bazy danych SQLite oraz pełne zapisane rekordy.

## Powiązane

- [Wywnioskowane zobowiązania](/pl/concepts/commitments)
- [Omówienie pamięci](/pl/concepts/memory)
- [Heartbeat](/pl/gateway/heartbeat)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
