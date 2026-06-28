---
read_when:
    - Aktualizowanie zachowania ponawiania prób lub wartości domyślnych dostawcy
    - Debugowanie błędów wysyłania u dostawcy lub limitów częstotliwości
summary: Zasady ponawiania prób dla wychodzących wywołań do dostawcy
title: Zasady ponawiania prób
x-i18n:
    generated_at: "2026-05-02T09:48:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7720092499effdfa011fc0a0310adb2ecddca9e94f57f749794eab1c9ab4c922
    source_path: concepts/retry.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Cele

- Ponawiaj próby dla każdego żądania HTTP, a nie dla całego wieloetapowego przepływu.
- Zachowuj kolejność, ponawiając tylko bieżący krok.
- Unikaj powielania operacji nieidempotentnych.

## Wartości domyślne

- Próby: 3
- Maksymalny limit opóźnienia: 30000 ms
- Jitter: 0.1 (10 procent)
- Domyślne ustawienia dostawców:
  - Minimalne opóźnienie Telegram: 400 ms
  - Minimalne opóźnienie Discord: 500 ms

## Zachowanie

### Dostawcy modeli

- OpenClaw pozwala zestawom SDK dostawców obsługiwać zwykłe krótkie ponowienia.
- W przypadku zestawów SDK opartych na Stainless, takich jak Anthropic i OpenAI, odpowiedzi kwalifikujące się do ponowienia
  (`408`, `409`, `429` i `5xx`) mogą zawierać `retry-after-ms` lub
  `retry-after`. Gdy ten czas oczekiwania jest dłuższy niż 60 sekund, OpenClaw wstrzykuje
  `x-should-retry: false`, aby SDK natychmiast zwrócił błąd, a przełączanie awaryjne modelu
  mogło przejść na inny profil uwierzytelniania lub model zapasowy.
- Zastąp limit za pomocą `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Ustaw tę wartość na `0`, `false`, `off`, `none` lub `disabled`, aby SDK samodzielnie honorowały długie
  oczekiwania `Retry-After`.

### Discord

- Ponawia próby przy błędach limitu szybkości (HTTP 429), przekroczeniach czasu żądania, odpowiedziach HTTP 5xx
  oraz przejściowych awariach transportu, takich jak błędy wyszukiwania DNS, resetowanie połączeń,
  zamykanie gniazd i błędy fetch.
- Używa `retry_after` Discord, gdy jest dostępne; w przeciwnym razie używa wykładniczego wydłużania opóźnień.

### Telegram

- Ponawia próby przy błędach przejściowych (429, timeout, connect/reset/closed, temporarily unavailable).
- Używa `retry_after`, gdy jest dostępne; w przeciwnym razie używa wykładniczego wydłużania opóźnień.
- Błędy parsowania Markdown nie są ponawiane; następuje powrót do zwykłego tekstu.

## Konfiguracja

Ustaw zasady ponawiania dla każdego dostawcy w `~/.openclaw/openclaw.json`:

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

- Ponowienia dotyczą każdego żądania (wysłanie wiadomości, przesłanie multimediów, reakcja, ankieta, naklejka).
- Przepływy złożone nie ponawiają ukończonych kroków.

## Powiązane

- [Przełączanie awaryjne modelu](/pl/concepts/model-failover)
- [Kolejka poleceń](/pl/concepts/queue)
