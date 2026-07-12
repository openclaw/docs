---
read_when:
    - Chcesz sprawdzić wywnioskowane zobowiązania do dalszych działań
    - Chcesz odrzucić oczekujące zgłoszenia kontrolne
    - Sprawdzasz, co może dostarczyć heartbeat
summary: Dokumentacja CLI dla `openclaw commitments` (przeglądanie i odrzucanie sugerowanych działań następczych)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-12T14:59:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

Wyświetlaj wywnioskowane zobowiązania dotyczące dalszych działań i zarządzaj nimi.

Zobowiązania są opcjonalne (`commitments.enabled`) i stanowią krótkotrwałe wspomnienia o dalszych działaniach, tworzone na podstawie kontekstu rozmowy oraz dostarczane przez Heartbeat. Przewodnik koncepcyjny i konfigurację znajdziesz w sekcji [Wywnioskowane zobowiązania](/pl/concepts/commitments).

Bez podkomendy `openclaw commitments` wyświetla oczekujące zobowiązania.

## Użycie

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Opcje

- `--all`: wyświetla wszystkie statusy zamiast tylko oczekujących zobowiązań.
- `--agent <id>`: ogranicza wyniki do jednego identyfikatora agenta.
- `--status <status>`: filtruje według statusu. Wartości: `pending`, `sent`, `dismissed`, `snoozed` lub `expired`. Nieznane wartości powodują zakończenie z błędem.
- `--json`: generuje dane JSON do odczytu maszynowego.

Polecenie `dismiss` oznacza podane identyfikatory zobowiązań jako `dismissed`, aby Heartbeat ich nie dostarczał.

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

Odrzucanie jednego lub większej liczby zobowiązań:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Eksportowanie jako JSON:

```bash
openclaw commitments --all --json
```

## Dane wyjściowe

Tekstowe dane wyjściowe zawierają liczbę zobowiązań, ścieżkę magazynu, wszystkie aktywne filtry oraz po jednym wierszu dla każdego zobowiązania:

- identyfikator zobowiązania
- status
- rodzaj (`event_check_in`, `deadline_check`, `care_check_in` lub `open_loop`)
- najwcześniejszy termin realizacji
- zakres (agent/kanał/cel)
- sugerowany tekst kontaktu kontrolnego

Dane wyjściowe JSON zawierają liczbę zobowiązań, aktywne filtry statusu i agenta, ścieżkę magazynu zobowiązań oraz pełne zapisane rekordy.

## Powiązane

- [Wywnioskowane zobowiązania](/pl/concepts/commitments)
- [Omówienie pamięci](/pl/concepts/memory)
- [Heartbeat](/pl/gateway/heartbeat)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
