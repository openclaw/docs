---
read_when:
    - Aktualizowanie zachowania ponawiania prób lub ustawień domyślnych dostawcy
    - Debugowanie błędów wysyłania dostawcy lub limitów szybkości
summary: Zasady ponawiania wychodzących wywołań dostawcy
title: Zasady ponawiania prób
x-i18n:
    generated_at: "2026-07-12T15:07:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## Cele

- Ponawiaj każde żądanie HTTP, a nie cały wieloetapowy przepływ.
- Zachowuj kolejność, ponawiając tylko bieżący krok.
- Unikaj powielania operacji nieidempotentnych.

## Wartości domyślne

| Ustawienie                  | Wartość domyślna |
| --------------------------- | ---------------- |
| Liczba prób                 | 3                |
| Maksymalny limit opóźnienia | 30000 ms         |
| Losowe odchylenie           | 0.1 (10%)        |
| Minimalne opóźnienie Telegram | 400 ms          |
| Minimalne opóźnienie Discord  | 500 ms          |

## Działanie

### Dostawcy modeli

- OpenClaw pozwala pakietom SDK dostawców obsługiwać standardowe krótkie ponowienia.
- W przypadku pakietów SDK opartych na Stainless, takich jak Anthropic i OpenAI, odpowiedzi umożliwiające ponowienie (`408`, `409`, `429` i `5xx`) mogą zawierać `retry-after-ms` lub `retry-after`. Gdy czas oczekiwania przekracza 60 sekund, OpenClaw wstawia `x-should-retry: false`, aby pakiet SDK natychmiast zgłosił błąd, a mechanizm przełączania awaryjnego modelu mógł wybrać inny profil uwierzytelniania lub model zapasowy.
- Zmień limit za pomocą `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`. Ustaw wartość `0`, `false`, `off`, `none` lub `disabled`, aby pakiety SDK mogły wewnętrznie respektować długie okresy oczekiwania określone przez `Retry-After`.

### Discord

- Ponawia żądania po błędach limitu częstotliwości (HTTP 429), przekroczeniu limitu czasu żądania, odpowiedziach HTTP 5xx oraz przejściowych awariach transportu, takich jak błędy wyszukiwania DNS, resetowanie połączeń, zamykanie gniazd i błędy pobierania.
- Używa wartości Discord `retry_after`, gdy jest dostępna, a w przeciwnym razie — wykładniczego wydłużania czasu oczekiwania.

### Telegram

- Ponawia żądania po błędach przejściowych (429, przekroczenie limitu czasu, nawiązanie/resetowanie/zamknięcie połączenia, tymczasowa niedostępność).
- Używa wartości `retry_after`, gdy jest dostępna, a w przeciwnym razie — wykładniczego wydłużania czasu oczekiwania.
- Błędy analizy HTML/Markdown nie powodują ponowienia; przy pierwszej próbie następuje przejście na zwykły tekst.

## Konfiguracja

Ustaw zasady ponawiania dla każdego dostawcy w pliku `~/.openclaw/openclaw.json`:

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

- Ponowienia dotyczą poszczególnych żądań (wysłanie wiadomości, przesłanie multimediów, reakcja, ankieta, naklejka).
- W przepływach złożonych ukończone kroki nie są ponawiane.

## Powiązane

- [Przełączanie awaryjne modelu](/pl/concepts/model-failover)
- [Kolejka poleceń](/pl/concepts/queue)
