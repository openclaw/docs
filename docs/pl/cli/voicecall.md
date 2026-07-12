---
read_when:
    - Używasz pluginu połączeń głosowych i chcesz korzystać z każdego punktu wejścia CLI
    - Potrzebujesz tabel flag i wartości domyślnych dla poleceń setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose oraz start
summary: Dokumentacja CLI dla `openclaw voicecall` (zestaw poleceń pluginu połączeń głosowych)
title: Połączenie głosowe
x-i18n:
    generated_at: "2026-07-12T14:56:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` jest poleceniem udostępnianym przez Plugin. Pojawia się tylko wtedy, gdy Plugin połączeń głosowych jest zainstalowany i włączony.

Gdy Gateway jest uruchomiony, polecenia operacyjne (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) są kierowane do środowiska wykonawczego połączeń głosowych tego Gateway. Jeśli żaden Gateway nie jest osiągalny, używane jest samodzielne środowisko wykonawcze CLI.

## Podpolecenia

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| Podpolecenie | Opis                                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| `setup`      | Wyświetla kontrole gotowości dostawcy i Webhooka.                               |
| `smoke`      | Uruchamia kontrole gotowości; wykonuje testowe połączenie tylko z opcją `--yes`. |
| `call`       | Inicjuje wychodzące połączenie głosowe.                                         |
| `start`      | Alias polecenia `call`, wymagający `--to` i z opcjonalnym `--message`.           |
| `continue`   | Odtwarza komunikat i czeka na następną odpowiedź.                               |
| `speak`      | Odtwarza komunikat bez oczekiwania na odpowiedź.                                |
| `dtmf`       | Wysyła cyfry DTMF do aktywnego połączenia.                                      |
| `end`        | Kończy aktywne połączenie.                                                       |
| `status`     | Sprawdza aktywne połączenia (lub jedno wskazane przez `--call-id`).              |
| `tail`       | Śledzi plik `calls.jsonl` (przydatne podczas testów dostawcy).                   |
| `latency`    | Podsumowuje metryki opóźnienia tur z pliku `calls.jsonl`.                        |
| `expose`     | Przełącza Tailscale Serve/Funnel dla punktu końcowego Webhooka.                  |

## Konfiguracja i test dymny

### `setup`

Domyślnie wyświetla kontrole gotowości w formacie czytelnym dla człowieka. W przypadku skryptów przekaż opcję `--json`.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Uruchamia te same kontrole gotowości. Wykonuje rzeczywiste połączenie telefoniczne tylko wtedy, gdy podano zarówno `--to`, jak i `--yes`.

| Flaga              | Wartość domyślna                  | Opis                                              |
| ------------------ | --------------------------------- | ------------------------------------------------- |
| `-t, --to <phone>` | (brak)                            | Numer telefonu do testowego połączenia na żywo.   |
| `--message <text>` | `OpenClaw voice call smoke test.` | Komunikat odtwarzany podczas połączenia testowego. |
| `--mode <mode>`    | `notify`                          | Tryb połączenia: `notify` lub `conversation`.      |
| `--yes`            | `false`                           | Faktycznie wykonuje wychodzące połączenie na żywo. |
| `--json`           | `false`                           | Wyświetla dane JSON przeznaczone do przetwarzania. |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # uruchomienie próbne
openclaw voicecall smoke --to "+15555550123" --yes  # połączenie powiadamiające na żywo
```

<Note>
W przypadku zewnętrznych dostawców (`plivo`, `telnyx`, `twilio`) polecenia `setup` i `smoke` wymagają publicznego adresu URL Webhooka skonfigurowanego za pomocą `publicUrl`, tunelu lub udostępnienia przez Tailscale. Zapasowy adres local loopback lub prywatny Tailscale Serve jest odrzucany, ponieważ operatorzy telekomunikacyjni nie mogą się z nim połączyć.
</Note>

## Cykl życia połączenia

### `call`

Inicjuje wychodzące połączenie głosowe.

| Flaga                  | Wymagana | Wartość domyślna | Opis                                                                                  |
| ---------------------- | -------- | ---------------- | ------------------------------------------------------------------------------------- |
| `-m, --message <text>` | tak      | (brak)           | Komunikat odtwarzany po nawiązaniu połączenia.                                         |
| `-t, --to <phone>`     | nie      | config `toNumber` | Numer telefonu w formacie E.164, z którym ma zostać nawiązane połączenie.              |
| `--mode <mode>`        | nie      | `conversation`   | Tryb połączenia: `notify` (rozłączenie po komunikacie) lub `conversation` (pozostaje otwarte). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Alias polecenia `call` z innym domyślnym zestawem flag.

| Flaga              | Wymagana | Wartość domyślna | Opis                                          |
| ------------------ | -------- | ---------------- | --------------------------------------------- |
| `--to <phone>`     | tak      | (brak)           | Numer telefonu, z którym ma zostać nawiązane połączenie. |
| `--message <text>` | nie      | (brak)           | Komunikat odtwarzany po nawiązaniu połączenia. |
| `--mode <mode>`    | nie      | `conversation`   | Tryb połączenia: `notify` lub `conversation`.  |

### `continue`

Odtwarza komunikat i czeka na odpowiedź.

| Flaga              | Wymagana | Opis                   |
| ------------------ | -------- | ---------------------- |
| `--call-id <id>`   | tak      | Identyfikator połączenia. |
| `--message <text>` | tak      | Komunikat do odtworzenia. |

### `speak`

Odtwarza komunikat bez oczekiwania na odpowiedź.

| Flaga              | Wymagana | Opis                      |
| ------------------ | -------- | ------------------------- |
| `--call-id <id>`   | tak      | Identyfikator połączenia.  |
| `--message <text>` | tak      | Komunikat do odtworzenia.  |

### `dtmf`

Wysyła cyfry DTMF do aktywnego połączenia.

| Flaga               | Wymagana | Opis                                                     |
| ------------------- | -------- | -------------------------------------------------------- |
| `--call-id <id>`    | tak      | Identyfikator połączenia.                                 |
| `--digits <digits>` | tak      | Cyfry DTMF (na przykład `ww123456#`, aby dodać oczekiwanie). |

### `end`

Kończy aktywne połączenie.

| Flaga            | Wymagana | Opis                      |
| ---------------- | -------- | ------------------------- |
| `--call-id <id>` | tak      | Identyfikator połączenia.  |

### `status`

Sprawdza aktywne połączenia.

| Flaga            | Wartość domyślna | Opis                                        |
| ---------------- | ---------------- | ------------------------------------------- |
| `--call-id <id>` | (brak)           | Ogranicza dane wyjściowe do jednego połączenia. |
| `--json`         | `false`          | Wyświetla dane JSON przeznaczone do przetwarzania. |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Dzienniki i metryki

### `tail`

Śledzi dziennik JSONL połączeń głosowych. Po uruchomieniu wyświetla ostatnie `--since` wierszy, a następnie strumieniowo wyświetla nowe wiersze w miarę ich zapisywania.

| Flaga           | Wartość domyślna              | Opis                                       |
| --------------- | ----------------------------- | ------------------------------------------ |
| `--file <path>` | ustalana z magazynu Pluginu   | Ścieżka do pliku `calls.jsonl`.            |
| `--since <n>`   | `25`                          | Liczba wierszy wyświetlanych przed rozpoczęciem śledzenia. |
| `--poll <ms>`   | `250` (minimum 50)            | Interwał odpytywania w milisekundach.       |

### `latency`

Podsumowuje metryki opóźnienia tur i oczekiwania na nasłuchiwanie z pliku `calls.jsonl`. Dane wyjściowe mają format JSON i zawierają podsumowania `recordsScanned`, `turnLatency` oraz `listenWait`.

| Flaga           | Wartość domyślna            | Opis                                        |
| --------------- | --------------------------- | ------------------------------------------- |
| `--file <path>` | ustalana z magazynu Pluginu | Ścieżka do pliku `calls.jsonl`.             |
| `--last <n>`    | `200` (minimum 1)           | Liczba ostatnich rekordów do przeanalizowania. |

## Udostępnianie Webhooków

### `expose`

Włącza, wyłącza lub zmienia konfigurację Tailscale Serve/Funnel dla Webhooka głosowego.

| Flaga                 | Wartość domyślna                          | Opis                                                     |
| --------------------- | ----------------------------------------- | -------------------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`, `serve` (tailnet) lub `funnel` (publiczny).       |
| `--path <path>`       | config `tailscale.path` lub `--serve-path` | Ścieżka Tailscale do udostępnienia.                       |
| `--port <port>`       | config `serve.port` lub `3334`             | Lokalny port Webhooka.                                    |
| `--serve-path <path>` | config `serve.path` lub `/voice/webhook`   | Lokalna ścieżka Webhooka.                                 |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Udostępniaj punkt końcowy Webhooka tylko w zaufanych sieciach. Gdy jest to możliwe, wybieraj Tailscale Serve zamiast Funnel.
</Warning>

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
- [Plugin połączeń głosowych](/pl/plugins/voice-call)
