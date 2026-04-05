---
read_when:
    - Aktualizujesz zachowanie lub ustawienia domyślne ponawiania providera
    - Debugujesz błędy wysyłania providera lub limity szybkości
summary: Polityka ponawiania dla wychodzących wywołań providerów
title: Polityka ponawiania
x-i18n:
    generated_at: "2026-04-05T13:50:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55bb261ff567f46ce447be9c0ee0c5b5e6d2776287d7662762656c14108dd607
    source_path: concepts/retry.md
    workflow: 15
---

# Polityka ponawiania

## Cele

- Ponawiaj dla każdego żądania HTTP, a nie dla całego przepływu wieloetapowego.
- Zachowuj kolejność, ponawiając tylko bieżący krok.
- Unikaj duplikowania operacji nieidempotentnych.

## Ustawienia domyślne

- Liczba prób: 3
- Maksymalne ograniczenie opóźnienia: 30000 ms
- Jitter: 0.1 (10 procent)
- Ustawienia domyślne providerów:
  - Minimalne opóźnienie Telegram: 400 ms
  - Minimalne opóźnienie Discord: 500 ms

## Zachowanie

### Discord

- Ponawia tylko przy błędach limitu szybkości (HTTP 429).
- Używa Discord `retry_after`, gdy jest dostępne, w przeciwnym razie wykładniczego backoff.

### Telegram

- Ponawia przy błędach przejściowych (429, timeout, connect/reset/closed, tymczasowo niedostępne).
- Używa `retry_after`, gdy jest dostępne, w przeciwnym razie wykładniczego backoff.
- Błędy parsowania Markdown nie są ponawiane; wracają do zwykłego tekstu.

## Konfiguracja

Ustaw politykę ponawiania per provider w `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Uwagi

- Ponowienia są stosowane dla każdego żądania (wysyłka wiadomości, upload multimediów, reakcja, ankieta, naklejka).
- Złożone przepływy nie ponawiają już ukończonych kroków.
