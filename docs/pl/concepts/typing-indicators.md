---
read_when:
    - Zmiana zachowania lub ustawień domyślnych wskaźnika pisania
summary: Kiedy OpenClaw pokazuje wskaźniki pisania i jak je dostosować
title: Wskaźniki pisania
x-i18n:
    generated_at: "2026-04-22T09:51:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e7e8ca448b6706b6f53fcb6a582be6d4a84715c82dfde3d53abe4268af3ae0d
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Wskaźniki pisania

Wskaźniki pisania są wysyłane do kanału czatu, gdy uruchomienie jest aktywne. Użyj
`agents.defaults.typingMode`, aby kontrolować, **kiedy** pisanie się rozpoczyna, oraz `typingIntervalSeconds`,
aby kontrolować, **jak często** jest odświeżane.

## Ustawienia domyślne

Gdy `agents.defaults.typingMode` jest **nieustawione**, OpenClaw zachowuje dotychczasowe działanie:

- **Czaty bezpośrednie**: pisanie zaczyna się natychmiast po rozpoczęciu pętli modelu.
- **Czaty grupowe ze wzmianką**: pisanie zaczyna się natychmiast.
- **Czaty grupowe bez wzmianki**: pisanie zaczyna się dopiero wtedy, gdy zaczyna być strumieniowany tekst wiadomości.
- **Uruchomienia Heartbeat**: pisanie zaczyna się w momencie rozpoczęcia uruchomienia Heartbeat, jeśli
  rozpoznany cel Heartbeat to czat obsługujący wskaźniki pisania i pisanie nie jest wyłączone.

## Tryby

Ustaw `agents.defaults.typingMode` na jedną z wartości:

- `never` — brak wskaźnika pisania, kiedykolwiek.
- `instant` — rozpocznij pisanie **natychmiast po rozpoczęciu pętli modelu**, nawet jeśli uruchomienie
  później zwróci tylko token cichej odpowiedzi.
- `thinking` — rozpocznij pisanie przy **pierwszym delcie rozumowania** (wymaga
  `reasoningLevel: "stream"` dla uruchomienia).
- `message` — rozpocznij pisanie przy **pierwszym niecichym delcie tekstowym** (ignoruje
  cichy token `NO_REPLY`).

Kolejność od „jak wcześnie się uruchamia”:
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

Możesz zastąpić tryb lub częstotliwość dla poszczególnych sesji:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Uwagi

- Tryb `message` nie pokaże wskaźnika pisania dla odpowiedzi zawierających wyłącznie treść cichą, gdy cały
  ładunek jest dokładnie cichym tokenem (na przykład `NO_REPLY` / `no_reply`,
  dopasowywanym bez rozróżniania wielkości liter).
- `thinking` uruchamia się tylko wtedy, gdy uruchomienie strumieniuje rozumowanie (`reasoningLevel: "stream"`).
  Jeśli model nie emituje delt rozumowania, pisanie się nie rozpocznie.
- Pisanie Heartbeat jest sygnałem żywotności dla rozpoznanego celu dostarczenia. Zaczyna się
  na początku uruchomienia Heartbeat zamiast podążać za czasem strumieniowania `message` lub `thinking`. Ustaw `typingMode: "never"`, aby je wyłączyć.
- Heartbeat nie pokazuje wskaźnika pisania, gdy `target: "none"`, gdy celu nie można rozpoznać, gdy dostarczanie czatu jest wyłączone dla Heartbeat albo gdy
  kanał nie obsługuje wskaźników pisania.
- `typingIntervalSeconds` kontroluje **częstotliwość odświeżania**, a nie moment rozpoczęcia.
  Wartość domyślna to 6 sekund.
