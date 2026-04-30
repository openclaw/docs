---
read_when:
    - Chcesz sprawdzić wywnioskowane zobowiązania dotyczące dalszych działań
    - Chcesz odrzucić oczekujące zgłoszenia
    - Sprawdzasz, co Heartbeat może dostarczyć
summary: Dokumentacja referencyjna CLI dla `openclaw commitments` (sprawdzanie i odrzucanie wywnioskowanych działań następczych)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-30T09:42:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

Wyświetlaj i zarządzaj wnioskowanymi zobowiązaniami do dalszych działań.

Zobowiązania to opcjonalne, krótkotrwałe wpisy pamięci dotyczące dalszych działań, tworzone z
kontekstu rozmowy. Zobacz [Wnioskowane zobowiązania](/pl/concepts/commitments), aby zapoznać się z
przewodnikiem koncepcyjnym.

Bez podpolecenia `openclaw commitments` wyświetla oczekujące zobowiązania.

## Użycie

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Opcje

- `--all`: pokaż wszystkie statusy zamiast tylko oczekujących zobowiązań.
- `--agent <id>`: filtruj do jednego identyfikatora agenta.
- `--status <status>`: filtruj według statusu. Wartości: `pending`, `sent`,
  `dismissed`, `snoozed` lub `expired`.
- `--json`: wyprowadź JSON czytelny maszynowo.

## Przykłady

Wyświetl oczekujące zobowiązania:

```bash
openclaw commitments
```

Wyświetl każde zapisane zobowiązanie:

```bash
openclaw commitments --all
```

Filtruj do jednego agenta:

```bash
openclaw commitments --agent main
```

Znajdź odłożone zobowiązania:

```bash
openclaw commitments --status snoozed
```

Odrzuć jedno lub więcej zobowiązań:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Eksportuj jako JSON:

```bash
openclaw commitments --all --json
```

## Dane wyjściowe

Dane tekstowe obejmują:

- identyfikator zobowiązania
- status
- typ
- najwcześniejszy termin wykonania
- zakres
- sugerowany tekst kontaktu kontrolnego

Dane JSON zawierają także ścieżkę magazynu zobowiązań oraz pełne zapisane rekordy.

## Powiązane

- [Wnioskowane zobowiązania](/pl/concepts/commitments)
- [Przegląd pamięci](/pl/concepts/memory)
- [Heartbeat](/pl/gateway/heartbeat)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
