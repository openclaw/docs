---
read_when:
    - Zmienianie zachowania lub ustawień domyślnych wskaźnika pisania
summary: Kiedy OpenClaw wyświetla wskaźniki pisania i jak je dostroić
title: Wskaźniki pisania
x-i18n:
    generated_at: "2026-06-27T17:30:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa76889d0f6262f1092abefee02aee8fe944651dc89d3a697ccc86e16558ed60
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Wskaźniki pisania są wysyłane do kanału czatu, gdy przebieg jest aktywny. Użyj
`agents.defaults.typingMode`, aby kontrolować, **kiedy** zaczyna się pisanie, oraz `typingIntervalSeconds`,
aby kontrolować, **jak często** jest odświeżane.

## Wartości domyślne

Gdy `agents.defaults.typingMode` jest **nieustawione**, OpenClaw zachowuje starsze działanie:

- **Czaty bezpośrednie**: pisanie zaczyna się natychmiast po rozpoczęciu pętli modelu.
- **Czaty grupowe ze wzmianką**: pisanie zaczyna się natychmiast.
- **Czaty grupowe bez wzmianki**: pisanie zaczyna się, gdy dopuszczony przebieg ma
  aktywność widoczną dla użytkownika, taką jak aktywność wykonywania harness lub tekst wiadomości.
- **Przebiegi Heartbeat**: pisanie zaczyna się, gdy rozpoczyna się przebieg Heartbeat, jeśli
  rozstrzygnięty cel Heartbeat jest czatem obsługującym pisanie i pisanie nie jest wyłączone.

## Tryby

Ustaw `agents.defaults.typingMode` na jedną z wartości:

- `never` - nigdy nie pokazuj wskaźnika pisania.
- `instant` - rozpocznij pisanie **gdy tylko zacznie się pętla modelu**, nawet jeśli przebieg
  później zwróci tylko token cichej odpowiedzi.
- `thinking` - rozpocznij pisanie przy **pierwszej delcie rozumowania** albo podczas aktywnego
  wykonywania harness po zaakceptowaniu tury.
- `message` - rozpocznij pisanie przy **pierwszej aktywności odpowiedzi widocznej dla użytkownika**, takiej jak
  aktywne wykonywanie harness albo delta tekstu, która nie jest cicha. Tokeny cichej odpowiedzi, takie jak
  `NO_REPLY`, nie liczą się jako aktywność tekstowa.

Kolejność według tego, „jak wcześnie się uruchamia”:
`never` → `message`/`thinking` → `instant`

## Konfiguracja

Ustaw wartość domyślną na poziomie agenta:

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

Nadpisz tryb lub rytm dla sesji:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Uwagi

- Tryb `message` nie uruchamia się od tokenów cichej odpowiedzi, ale aktywne wykonywanie
  nadal może pokazać pisanie, zanim będzie dostępny jakikolwiek tekst asystenta.
- `thinking` nadal reaguje na strumieniowane rozumowanie (`reasoningLevel: "stream"`),
  i może też rozpocząć się od aktywnego wykonywania, zanim nadejdą delty rozumowania.
- Pisanie Heartbeat jest sygnałem żywotności dla rozstrzygniętego celu dostarczenia. Rozpoczyna się
  na starcie przebiegu Heartbeat zamiast podążać za czasem strumienia `message` lub `thinking`.
  Ustaw `typingMode: "never"`, aby je wyłączyć.
- Heartbeat nie pokazuje pisania, gdy `target: "none"`, gdy nie można rozstrzygnąć celu,
  gdy dostarczanie czatu jest wyłączone dla Heartbeat albo gdy
  kanał nie obsługuje pisania.
- `typingIntervalSeconds` kontroluje **rytm odświeżania**, a nie czas rozpoczęcia.
  Wartość domyślna to 6 sekund.

## Powiązane

<CardGroup cols={2}>
  <Card title="Obecność" href="/pl/concepts/presence" icon="signal">
    Jak Gateway śledzi połączonych klientów i pokazuje ich w karcie Instancje w macOS.
  </Card>
  <Card title="Strumieniowanie i dzielenie na fragmenty" href="/pl/concepts/streaming" icon="bars-staggered">
    Zachowanie strumieniowania wychodzącego, granice fragmentów i dostarczanie specyficzne dla kanału.
  </Card>
</CardGroup>
