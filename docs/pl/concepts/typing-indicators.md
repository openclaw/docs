---
read_when:
    - Zmiana zachowania lub ustawień domyślnych wskaźnika pisania
summary: Kiedy OpenClaw wyświetla wskaźniki pisania i jak je dostosować
title: Wskaźniki pisania
x-i18n:
    generated_at: "2026-05-10T19:34:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e26b4008f165527098ffcbf9c39ee7179149063842cc5c6aacb5b7c606eedc26
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Wskaźniki pisania są wysyłane do kanału czatu, gdy uruchomienie jest aktywne. Użyj
`agents.defaults.typingMode`, aby kontrolować, **kiedy** zaczyna się pisanie, oraz `typingIntervalSeconds`,
aby kontrolować, **jak często** jest odświeżane.

## Domyślne ustawienia

Gdy `agents.defaults.typingMode` jest **nieustawione**, OpenClaw zachowuje starsze działanie:

- **Czaty bezpośrednie**: pisanie zaczyna się natychmiast po rozpoczęciu pętli modelu.
- **Czaty grupowe ze wzmianką**: pisanie zaczyna się natychmiast.
- **Czaty grupowe bez wzmianki**: pisanie zaczyna się dopiero wtedy, gdy tekst wiadomości zaczyna być strumieniowany.
- **Uruchomienia Heartbeat**: pisanie zaczyna się po rozpoczęciu uruchomienia Heartbeat, jeśli
  rozpoznany cel Heartbeat jest czatem obsługującym pisanie, a pisanie nie jest wyłączone.

## Tryby

Ustaw `agents.defaults.typingMode` na jedną z wartości:

- `never` - brak wskaźnika pisania, kiedykolwiek.
- `instant` - rozpocznij pisanie **gdy tylko zacznie się pętla modelu**, nawet jeśli uruchomienie
  później zwróci tylko token cichej odpowiedzi.
- `thinking` - rozpocznij pisanie przy **pierwszej delcie rozumowania** (wymaga
  `reasoningLevel: "stream"` dla uruchomienia).
- `message` - rozpocznij pisanie przy **pierwszej niecichej delcie tekstu** (ignoruje
  cichy token `NO_REPLY`).

Kolejność „jak wcześnie się uruchamia”:
`never` → `message` → `thinking` → `instant`

## Konfiguracja

Ustaw domyślne ustawienie na poziomie agenta:

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

Nadpisz tryb lub tempo dla sesji:

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
  ładunek jest dokładnym cichym tokenem (na przykład `NO_REPLY` / `no_reply`,
  dopasowywanym bez rozróżniania wielkości liter).
- `thinking` uruchamia się tylko wtedy, gdy uruchomienie strumieniuje rozumowanie (`reasoningLevel: "stream"`).
  Jeśli model nie emituje delt rozumowania, pisanie się nie rozpocznie.
- Pisanie Heartbeat jest sygnałem żywotności dla rozpoznanego celu dostarczania. Zaczyna się
  przy starcie uruchomienia Heartbeat zamiast podążać za czasem strumienia `message` lub `thinking`.
  Ustaw `typingMode: "never"`, aby je wyłączyć.
- Heartbeat nie pokazuje pisania, gdy `target: "none"`, gdy nie można
  rozpoznać celu, gdy dostarczanie czatu jest wyłączone dla Heartbeat, lub gdy
  kanał nie obsługuje pisania.
- `typingIntervalSeconds` kontroluje **tempo odświeżania**, a nie czas rozpoczęcia.
  Domyślna wartość to 6 sekund.

## Powiązane

<CardGroup cols={2}>
  <Card title="Obecność" href="/pl/concepts/presence" icon="signal">
    Jak Gateway śledzi połączonych klientów i pokazuje ich na karcie Instances w macOS.
  </Card>
  <Card title="Strumieniowanie i dzielenie na fragmenty" href="/pl/concepts/streaming" icon="bars-staggered">
    Zachowanie strumieniowania wychodzącego, granice fragmentów i dostarczanie specyficzne dla kanału.
  </Card>
</CardGroup>
