---
read_when:
    - Aktualizowanie zachowania lub wartości domyślnych ponawiania providera
    - Debugowanie błędów wysyłania providera lub limitów szybkości
summary: Zasady ponawiania dla wychodzących wywołań providera
title: Zasady ponawiania
x-i18n:
    generated_at: "2026-04-24T09:07:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38811a6dabb0b60b71167ee4fcc09fb042f941b4bbb1cf8b0f5a91c3c93b2e75
    source_path: concepts/retry.md
    workflow: 15
---

## Cele

- Ponawiaj dla każdego żądania HTTP, a nie dla wieloetapowego workflow.
- Zachowuj kolejność, ponawiając tylko bieżący krok.
- Unikaj duplikowania operacji nieidempotentnych.

## Wartości domyślne

- Próby: 3
- Maksymalny limit opóźnienia: 30000 ms
- Jitter: 0.1 (10 procent)
- Wartości domyślne providerów:
  - Telegram minimalne opóźnienie: 400 ms
  - Discord minimalne opóźnienie: 500 ms

## Zachowanie

### Providerzy modeli

- OpenClaw pozwala, aby SDK providerów obsługiwały zwykłe krótkie ponowienia.
- Dla SDK opartych na Stainless, takich jak Anthropic i OpenAI, odpowiedzi podlegające ponowieniu
  (`408`, `409`, `429` i `5xx`) mogą zawierać `retry-after-ms` lub
  `retry-after`. Gdy ten czas oczekiwania jest dłuższy niż 60 sekund, OpenClaw wstrzykuje
  `x-should-retry: false`, aby SDK natychmiast zwróciło błąd i model
  failover mógł przełączyć się na inny profil uwierzytelniania lub model zapasowy.
- Nadpisz limit przez `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Ustaw go na `0`, `false`, `off`, `none` lub `disabled`, aby pozwolić SDK
  wewnętrznie honorować długie opóźnienia `Retry-After`.

### Discord

- Ponawia tylko przy błędach limitu szybkości (HTTP 429).
- Używa Discord `retry_after`, gdy jest dostępne, w przeciwnym razie wykładniczego backoff.

### Telegram

- Ponawia przy błędach przejściowych (429, timeout, connect/reset/closed, tymczasowo niedostępne).
- Używa `retry_after`, gdy jest dostępne, w przeciwnym razie wykładniczego backoff.
- Błędy parsowania Markdown nie są ponawiane; wracają do zwykłego tekstu.

## Konfiguracja

Ustaw zasady ponawiania per provider w `~/.openclaw/openclaw.json`:

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

- Ponowienia są stosowane dla każdego żądania osobno (wysłanie wiadomości, przesłanie multimediów, reakcja, ankieta, naklejka).
- Złożone workflow nie ponawiają ukończonych kroków.

## Powiązane

- [Model failover](/pl/concepts/model-failover)
- [Kolejka poleceń](/pl/concepts/queue)
