---
read_when:
    - Zmiana zachowania lub ustawień domyślnych wskaźników pisania
summary: Kiedy OpenClaw pokazuje wskaźniki pisania i jak je dostroić
title: Wskaźniki pisania
x-i18n:
    generated_at: "2026-04-24T09:07:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f5c3bb79cf87f79db5336978b877f4a01025f59c9e822ab66198f00907123f
    source_path: concepts/typing-indicators.md
    workflow: 15
---

Wskaźniki pisania są wysyłane do kanału czatu, gdy uruchomienie jest aktywne. Użyj
`agents.defaults.typingMode`, aby określić **kiedy** pisanie się zaczyna, oraz `typingIntervalSeconds`,
aby określić **jak często** jest odświeżane.

## Ustawienia domyślne

Gdy `agents.defaults.typingMode` **nie jest ustawione**, OpenClaw zachowuje starsze działanie:

- **Czaty bezpośrednie**: pisanie zaczyna się natychmiast po rozpoczęciu pętli modelu.
- **Czaty grupowe ze wzmianką**: pisanie zaczyna się natychmiast.
- **Czaty grupowe bez wzmianki**: pisanie zaczyna się dopiero, gdy zaczyna być strumieniowany tekst wiadomości.
- **Uruchomienia Heartbeat**: pisanie zaczyna się przy rozpoczęciu uruchomienia Heartbeat, jeśli
  rozwiązany cel Heartbeat jest czatem obsługującym wskaźniki pisania i pisanie nie jest wyłączone.

## Tryby

Ustaw `agents.defaults.typingMode` na jedną z wartości:

- `never` — brak wskaźnika pisania, kiedykolwiek.
- `instant` — rozpocznij pisanie **natychmiast po rozpoczęciu pętli modelu**, nawet jeśli uruchomienie
  później zwróci tylko cichy token odpowiedzi.
- `thinking` — rozpocznij pisanie przy **pierwszym delcie rozumowania** (wymaga
  `reasoningLevel: "stream"` dla tego uruchomienia).
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

Możesz nadpisać tryb lub częstotliwość per session:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Uwagi

- Tryb `message` nie pokaże pisania dla odpowiedzi wyłącznie cichych, gdy cały
  ładunek to dokładnie cichy token (na przykład `NO_REPLY` / `no_reply`,
  dopasowywany bez rozróżniania wielkości liter).
- `thinking` uruchamia się tylko wtedy, gdy uruchomienie strumieniuje rozumowanie (`reasoningLevel: "stream"`).
  Jeśli model nie emituje delt rozumowania, pisanie się nie rozpocznie.
- Pisanie dla Heartbeat jest sygnałem aktywności dla rozwiązanego celu dostarczenia. Ono
  zaczyna się przy starcie uruchomienia Heartbeat zamiast podążać za czasem strumieniowania `message` lub `thinking`.
  Ustaw `typingMode: "never"`, aby je wyłączyć.
- Heartbeat nie pokazuje pisania, gdy `target: "none"`, gdy celu nie można
  rozwiązać, gdy dostarczanie czatu jest wyłączone dla Heartbeat lub gdy
  kanał nie obsługuje wskaźników pisania.
- `typingIntervalSeconds` steruje **częstotliwością odświeżania**, a nie momentem rozpoczęcia.
  Wartość domyślna to 6 sekund.

## Powiązane

- [Presence](/pl/concepts/presence)
- [Strumieniowanie i dzielenie na fragmenty](/pl/concepts/streaming)
