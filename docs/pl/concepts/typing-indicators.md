---
read_when:
    - Zmiana zachowania lub wartości domyślnych wskaźnika pisania
summary: Kiedy OpenClaw pokazuje wskaźniki pisania i jak je dostosować
title: Wskaźniki pisania
x-i18n:
    generated_at: "2026-05-06T09:10:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59ee89a2f382b185e520fea178cf1860cbc4cfb8257c3b0ae7552fa4b1c79ef3
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Wskaźniki pisania są wysyłane do kanału czatu, gdy uruchomienie jest aktywne. Użyj
`agents.defaults.typingMode`, aby kontrolować, **kiedy** rozpoczyna się pisanie, oraz `typingIntervalSeconds`,
aby kontrolować, **jak często** jest odświeżane.

## Domyślne ustawienia

Gdy `agents.defaults.typingMode` jest **nieustawione**, OpenClaw zachowuje starsze działanie:

- **Czaty bezpośrednie**: pisanie rozpoczyna się natychmiast po rozpoczęciu pętli modelu.
- **Czaty grupowe ze wzmianką**: pisanie rozpoczyna się natychmiast.
- **Czaty grupowe bez wzmianki**: pisanie rozpoczyna się dopiero, gdy tekst wiadomości zaczyna być strumieniowany.
- **Uruchomienia Heartbeat**: pisanie rozpoczyna się, gdy zaczyna się uruchomienie Heartbeat, jeśli
  rozpoznany cel Heartbeat jest czatem obsługującym pisanie, a pisanie nie jest wyłączone.

## Tryby

Ustaw `agents.defaults.typingMode` na jedną z wartości:

- `never` - nigdy nie pokazuj wskaźnika pisania.
- `instant` - rozpocznij pisanie **gdy tylko rozpocznie się pętla modelu**, nawet jeśli uruchomienie
  później zwróci tylko cichy token odpowiedzi.
- `thinking` - rozpocznij pisanie przy **pierwszej delcie rozumowania** (wymaga
  `reasoningLevel: "stream"` dla uruchomienia).
- `message` - rozpocznij pisanie przy **pierwszej niecichej delcie tekstu** (ignoruje
  cichy token `NO_REPLY`).

Kolejność według tego, „jak wcześnie się uruchamia”:
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

Możesz nadpisać tryb lub rytm dla każdej sesji:

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
- Pisanie Heartbeat jest sygnałem żywotności dla rozpoznanego celu dostarczania. Rozpoczyna się
  na starcie uruchomienia Heartbeat zamiast zgodnie z czasem strumienia `message` lub `thinking`.
  Ustaw `typingMode: "never"`, aby je wyłączyć.
- Heartbeat nie pokazuje pisania, gdy `target: "none"`, gdy nie można
  rozpoznać celu, gdy dostarczanie czatu jest wyłączone dla Heartbeat albo gdy
  kanał nie obsługuje pisania.
- `typingIntervalSeconds` kontroluje **rytm odświeżania**, a nie czas rozpoczęcia.
  Wartość domyślna to 6 sekund.

## Powiązane

<CardGroup cols={2}>
  <Card title="Presence" href="/pl/concepts/presence" icon="signal">
    Jak Gateway śledzi połączone klienty i pokazuje je na karcie Instancje w macOS.
  </Card>
  <Card title="Streaming and chunking" href="/pl/concepts/streaming" icon="bars-staggered">
    Zachowanie strumieniowania wychodzącego, granice fragmentów i dostarczanie specyficzne dla kanału.
  </Card>
</CardGroup>
