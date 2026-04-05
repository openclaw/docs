---
read_when:
    - Zmieniasz zachowanie wskaźników pisania lub wartości domyślne
summary: Kiedy OpenClaw pokazuje wskaźniki pisania i jak je dostroić
title: Wskaźniki pisania
x-i18n:
    generated_at: "2026-04-05T13:51:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28c8c395a135fc0745181aab66a93582177e6acd0b3496debcbb98159a4f11dc
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Wskaźniki pisania

Wskaźniki pisania są wysyłane do kanału czatu, gdy przebieg jest aktywny. Użyj
`agents.defaults.typingMode`, aby kontrolować **kiedy** pisanie się zaczyna, a `typingIntervalSeconds`,
aby kontrolować **jak często** jest odświeżane.

## Wartości domyślne

Gdy `agents.defaults.typingMode` jest **nieustawione**, OpenClaw zachowuje starsze zachowanie:

- **Czaty bezpośrednie**: pisanie zaczyna się natychmiast po rozpoczęciu pętli modelu.
- **Czaty grupowe ze wzmianką**: pisanie zaczyna się natychmiast.
- **Czaty grupowe bez wzmianki**: pisanie zaczyna się dopiero wtedy, gdy zaczyna się streaming tekstu wiadomości.
- **Przebiegi heartbeat**: pisanie jest wyłączone.

## Tryby

Ustaw `agents.defaults.typingMode` na jedną z wartości:

- `never` — brak wskaźnika pisania, kiedykolwiek.
- `instant` — rozpocznij pisanie **natychmiast po rozpoczęciu pętli modelu**, nawet jeśli przebieg
  później zwróci tylko cichy token odpowiedzi.
- `thinking` — rozpocznij pisanie przy **pierwszym delcie rozumowania** (wymaga
  `reasoningLevel: "stream"` dla tego przebiegu).
- `message` — rozpocznij pisanie przy **pierwszym niecichym delcie tekstu** (ignoruje
  cichy token `NO_REPLY`).

Kolejność „jak wcześnie się uruchamia”:
`never` → `message` → `thinking` → `instant`

## Konfiguracja

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Możesz nadpisać tryb lub częstotliwość dla każdej sesji:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Uwagi

- Tryb `message` nie pokaże pisania dla odpowiedzi zawierających wyłącznie cichy token, gdy cały
  ładunek jest dokładnie cichym tokenem (na przykład `NO_REPLY` / `no_reply`,
  dopasowywanym bez rozróżniania wielkości liter).
- `thinking` uruchamia się tylko wtedy, gdy przebieg streamuje rozumowanie (`reasoningLevel: "stream"`).
  Jeśli model nie emituje delt rozumowania, pisanie się nie rozpocznie.
- Heartbeat nigdy nie pokazuje pisania, niezależnie od trybu.
- `typingIntervalSeconds` kontroluje **częstotliwość odświeżania**, a nie moment rozpoczęcia.
  Wartość domyślna to 6 sekund.
