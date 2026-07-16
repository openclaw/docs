---
read_when:
    - Zmiana zachowania lub ustawień domyślnych wskaźnika pisania
summary: Kiedy OpenClaw wyświetla wskaźniki pisania i jak je dostosować
title: Wskaźniki pisania
x-i18n:
    generated_at: "2026-07-16T18:35:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 55e5ec38f47e0612b25b5561790e9b8a17ea4e215c4038bb89af83f861089e03
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Wskaźniki pisania są wysyłane do kanału czatu, gdy przebieg jest aktywny. Użyj `agents.defaults.typingMode`, aby określić, **kiedy** rozpoczyna się pisanie, oraz `typingIntervalSeconds`, aby określić, **jak często** wskaźnik jest odświeżany (częstotliwość podtrzymania aktywności, domyślnie 6 sekund).

## Wartości domyślne

Gdy `agents.defaults.typingMode` **nie jest ustawione**:

- **Czaty bezpośrednie**: pisanie rozpoczyna się natychmiast po uruchomieniu pętli modelu.
- **Czaty grupowe ze wzmianką**: pisanie rozpoczyna się natychmiast.
- **Czaty grupowe bez wzmianki**: pisanie rozpoczyna się, gdy dopuszczony przebieg wykazuje aktywność widoczną dla użytkownika, na przykład aktywność wykonywania środowiska uruchomieniowego lub tekst wiadomości.
- **Przebiegi Heartbeat**: pisanie rozpoczyna się wraz z przebiegiem Heartbeat, jeśli ustalonym celem Heartbeat jest czat obsługujący wskaźnik pisania i wskaźnik ten nie jest wyłączony.

## Tryby

Ustaw `agents.defaults.typingMode` na jedną z następujących wartości:

- `never` — wskaźnik pisania nigdy nie jest wyświetlany.
- `instant` — rozpocznij pisanie **natychmiast po uruchomieniu pętli modelu**, nawet jeśli przebieg zwróci później wyłącznie token cichej odpowiedzi.
- `thinking` — rozpocznij pisanie przy **pierwszym przyroście rozumowania** lub podczas aktywnego wykonywania środowiska uruchomieniowego po zaakceptowaniu tury.
- `message` — rozpocznij pisanie przy **pierwszej aktywności odpowiedzi widocznej dla użytkownika**, takiej jak aktywne wykonywanie środowiska uruchomieniowego lub przyrost tekstu, który nie jest cichy. Tokeny cichej odpowiedzi, takie jak `NO_REPLY`, nie są uznawane za aktywność tekstową.

Kolejność według tego, „jak wcześnie się uruchamia”: `never` -> `message`/`thinking` -> `instant`.

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

Zastąp tryb lub częstotliwość dla poszczególnych sesji:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Uwagi

- Tryb `message` nie uruchamia się wskutek tokenów cichej odpowiedzi, ale aktywne wykonywanie może nadal wyświetlać wskaźnik pisania, zanim dostępny będzie jakikolwiek tekst asystenta.
- `thinking` nadal reaguje na strumieniowane rozumowanie (`reasoningLevel: "stream"`) i może także uruchomić się wskutek aktywnego wykonywania, zanim pojawią się przyrosty rozumowania.
- Wskaźnik pisania Heartbeat jest sygnałem aktywności dla ustalonego celu dostarczania. Uruchamia się na początku przebiegu Heartbeat, zamiast podążać za czasem strumienia `message` lub `thinking`. Ustaw `typingMode: "never"`, aby go wyłączyć.
- Przebiegi Heartbeat nie wyświetlają wskaźnika pisania, gdy celem Heartbeat jest `"none"`, gdy nie można ustalić celu, gdy dostarczanie na czat jest wyłączone dla Heartbeat lub gdy kanał nie obsługuje wskaźnika pisania.
- `typingIntervalSeconds` określa **częstotliwość odświeżania**, a nie czas rozpoczęcia. Wartość domyślna: 6 sekund.

## Powiązane

<CardGroup cols={2}>
  <Card title="Obecność" href="/pl/concepts/presence" icon="signal">
    Sposób, w jaki Gateway śledzi połączonych klientów na stronie urządzeń interfejsu Control UI i karcie instancji systemu macOS.
  </Card>
  <Card title="Przesyłanie strumieniowe i dzielenie na fragmenty" href="/pl/concepts/streaming" icon="bars-staggered">
    Zachowanie wychodzącego przesyłania strumieniowego, granice fragmentów i dostarczanie właściwe dla kanału.
  </Card>
</CardGroup>
