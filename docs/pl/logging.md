---
read_when:
    - Potrzebujesz przyjaznego dla początkujących przeglądu logowania.
    - Chcesz skonfigurować poziomy albo formaty logów.
    - Rozwiązujesz problemy i chcesz szybko znaleźć logi.
summary: 'Przegląd logowania: logi plikowe, wyjście konsoli, śledzenie w CLI i Control UI'
title: Przegląd logowania
x-i18n:
    generated_at: "2026-04-24T09:18:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b6f274600bcb9f5597c91aa6c30512871105a3e0de446773394abbe27276058
    source_path: logging.md
    workflow: 15
---

# Logowanie

OpenClaw ma dwie główne powierzchnie logów:

- **Logi plikowe** (wiersze JSON) zapisywane przez Gateway.
- **Wyjście konsoli** pokazywane w terminalach i w interfejsie Gateway Debug UI.

Zakładka **Logs** w Control UI śledzi log plikowy gateway. Ta strona wyjaśnia, gdzie
znajdują się logi, jak je czytać oraz jak konfigurować poziomy i formaty logów.

## Gdzie znajdują się logi

Domyślnie Gateway zapisuje rotowany plik logu w:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Data używa lokalnej strefy czasowej hosta gateway.

Możesz to nadpisać w `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Jak czytać logi

### CLI: śledzenie na żywo (zalecane)

Użyj CLI, aby śledzić plik logu gateway przez RPC:

```bash
openclaw logs --follow
```

Przydatne bieżące opcje:

- `--local-time`: renderuje znaczniki czasu w twojej lokalnej strefie czasowej
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standardowe flagi Gateway RPC
- `--expect-final`: flaga oczekiwania na końcową odpowiedź dla RPC wspieranego przez agenta (akceptowana tutaj przez współdzieloną warstwę klienta)

Tryby wyjścia:

- **Sesje TTY**: ładne, kolorowe, ustrukturyzowane linie logów.
- **Sesje non-TTY**: zwykły tekst.
- `--json`: JSON rozdzielany wierszami (jedno zdarzenie logu na wiersz).
- `--plain`: wymusza zwykły tekst w sesjach TTY.
- `--no-color`: wyłącza kolory ANSI.

Gdy podasz jawne `--url`, CLI nie stosuje automatycznie poświadczeń z configu ani
środowiska; samodzielnie dołącz `--token`, jeśli docelowy Gateway
wymaga auth.

W trybie JSON CLI emituje obiekty oznaczone `type`:

- `meta`: metadane strumienia (plik, kursor, rozmiar)
- `log`: sparsowany wpis logu
- `notice`: wskazówki dotyczące obcięcia / rotacji
- `raw`: niesparsowana linia logu

Jeśli lokalny loopback Gateway prosi o parowanie, `openclaw logs` automatycznie przechodzi
na fallback do skonfigurowanego lokalnego pliku logu. Jawne cele `--url` nie
używają tego fallbacku.

Jeśli Gateway jest nieosiągalny, CLI wypisuje krótką wskazówkę, aby uruchomić:

```bash
openclaw doctor
```

### Control UI (web)

Zakładka **Logs** w Control UI śledzi ten sam plik za pomocą `logs.tail`.
Zobacz [/web/control-ui](/pl/web/control-ui), aby dowiedzieć się, jak ją otworzyć.

### Logi tylko kanałów

Aby filtrować aktywność kanałów (WhatsApp/Telegram/itd.), użyj:

```bash
openclaw channels logs --channel whatsapp
```

## Formaty logów

### Logi plikowe (JSONL)

Każdy wiersz w pliku logu jest obiektem JSON. CLI i Control UI parsują te
wpisy, aby renderować ustrukturyzowane wyjście (czas, poziom, podsystem, komunikat).

### Wyjście konsoli

Logi konsoli są **świadome TTY** i formatowane dla czytelności:

- Prefiksy podsystemów (np. `gateway/channels/whatsapp`)
- Kolorowanie poziomów (info/warn/error)
- Opcjonalny tryb compact albo JSON

Formatowanie konsoli kontroluje `logging.consoleStyle`.

### Logi Gateway WebSocket

`openclaw gateway` ma także logowanie protokołu WebSocket dla ruchu RPC:

- tryb normalny: tylko interesujące wyniki (błędy, błędy parsowania, wolne wywołania)
- `--verbose`: cały ruch request/response
- `--ws-log auto|compact|full`: wybór stylu renderowania verbose
- `--compact`: alias dla `--ws-log compact`

Przykłady:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Konfigurowanie logowania

Cała konfiguracja logowania znajduje się pod `logging` w `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Poziomy logów

- `logging.level`: poziom **logów plikowych** (JSONL).
- `logging.consoleLevel`: poziom szczegółowości **konsoli**.

Możesz nadpisać oba przez zmienną środowiskową **`OPENCLAW_LOG_LEVEL`** (np. `OPENCLAW_LOG_LEVEL=debug`). Zmienna env ma pierwszeństwo przed plikiem config, więc możesz zwiększyć szczegółowość dla pojedynczego uruchomienia bez edytowania `openclaw.json`. Możesz także przekazać globalną opcję CLI **`--log-level <level>`** (na przykład `openclaw --log-level debug gateway run`), która nadpisuje zmienną środowiskową dla tego polecenia.

`--verbose` wpływa tylko na wyjście konsoli i szczegółowość logów WS; nie zmienia
poziomów logów plikowych.

### Style konsoli

`logging.consoleStyle`:

- `pretty`: przyjazny dla człowieka, kolorowy, ze znacznikami czasu.
- `compact`: ciaśniejsze wyjście (najlepsze dla długich sesji).
- `json`: JSON na wiersz (dla procesorów logów).

### Redakcja

Podsumowania narzędzi mogą redagować wrażliwe tokeny, zanim trafią do konsoli:

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: lista ciągów regex nadpisujących domyślny zestaw

Redakcja wpływa **tylko na wyjście konsoli** i nie zmienia logów plikowych.

## Diagnostyka + OpenTelemetry

Diagnostyka to ustrukturyzowane, czytelne dla maszyn zdarzenia dla uruchomień modeli **oraz**
telemetrii przepływu wiadomości (webhooki, kolejkowanie, stan sesji). **Nie**
zastępują logów; istnieją po to, by zasilać metryki, ślady i inne eksportery.

Zdarzenia diagnostyczne są emitowane w procesie, ale eksportery są dołączane tylko wtedy, gdy
włączono diagnostykę + Plugin eksportera.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: model danych + SDK dla śladów, metryk i logów.
- **OTLP**: protokół transportowy używany do eksportowania danych OTel do kolektora/backendu.
- OpenClaw eksportuje dziś przez **OTLP/HTTP (protobuf)**.

### Eksportowane sygnały

- **Metryki**: liczniki + histogramy (użycie tokenów, przepływ wiadomości, kolejkowanie).
- **Ślady**: span-y dla użycia modeli + przetwarzania webhooków/wiadomości.
- **Logi**: eksportowane przez OTLP, gdy `diagnostics.otel.logs` jest włączone. Wolumen
  logów może być wysoki; pamiętaj o `logging.level` i filtrach eksportera.

### Katalog zdarzeń diagnostycznych

Użycie modeli:

- `model.usage`: tokeny, koszt, czas trwania, kontekst, dostawca/model/kanał, identyfikatory sesji.

Przepływ wiadomości:

- `webhook.received`: wejście webhooka per kanał.
- `webhook.processed`: obsłużony webhook + czas trwania.
- `webhook.error`: błędy handlera webhooka.
- `message.queued`: wiadomość umieszczona w kolejce do przetwarzania.
- `message.processed`: wynik + czas trwania + opcjonalny błąd.

Kolejka + sesja:

- `queue.lane.enqueue`: dodanie do kolejki lane poleceń + głębokość.
- `queue.lane.dequeue`: zdjęcie z kolejki lane poleceń + czas oczekiwania.
- `session.state`: przejście stanu sesji + powód.
- `session.stuck`: ostrzeżenie o zablokowanej sesji + wiek.
- `run.attempt`: metadane próby/ponowienia uruchomienia.
- `diagnostic.heartbeat`: agregowane liczniki (webhooki/kolejka/sesja).

### Włącz diagnostykę (bez eksportera)

Użyj tego, jeśli chcesz, aby zdarzenia diagnostyczne były dostępne dla Pluginów albo własnych sinków:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flagi diagnostyczne (ukierunkowane logi)

Użyj flag, aby włączyć dodatkowe, ukierunkowane logi debugowania bez podnoszenia `logging.level`.
Flagi nie rozróżniają wielkości liter i obsługują wildcardy (np. `telegram.*` albo `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Nadpisanie env (jednorazowe):

```text
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Uwagi:

- Logi flag trafiają do standardowego pliku logu (tego samego co `logging.file`).
- Wyjście nadal jest redagowane zgodnie z `logging.redactSensitive`.
- Pełny przewodnik: [/diagnostics/flags](/pl/diagnostics/flags).

### Eksport do OpenTelemetry

Diagnostyka może być eksportowana przez Plugin `diagnostics-otel` (OTLP/HTTP). To
działa z dowolnym kolektorem/backendem OpenTelemetry, który akceptuje OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

Uwagi:

- Możesz też włączyć Plugin przez `openclaw plugins enable diagnostics-otel`.
- `protocol` obecnie obsługuje tylko `http/protobuf`. `grpc` jest ignorowane.
- Metryki obejmują użycie tokenów, koszt, rozmiar kontekstu, czas trwania uruchomienia oraz
  liczniki/histogramy przepływu wiadomości (webhooki, kolejkowanie, stan sesji, głębokość/czas oczekiwania kolejki).
- Ślady/metryki można przełączać przez `traces` / `metrics` (domyślnie: włączone). Ślady
  obejmują span-y użycia modeli oraz span-y przetwarzania webhooków/wiadomości, gdy są włączone.
- Ustaw `headers`, gdy twój kolektor wymaga auth.
- Obsługiwane zmienne środowiskowe: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Eksportowane metryki (nazwy + typy)

Użycie modeli:

- `openclaw.tokens` (counter, atrybuty: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, atrybuty: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, atrybuty: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, atrybuty: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Przepływ wiadomości:

- `openclaw.webhook.received` (counter, atrybuty: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, atrybuty: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, atrybuty: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, atrybuty: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, atrybuty: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, atrybuty: `openclaw.channel`,
  `openclaw.outcome`)

Kolejki + sesje:

- `openclaw.queue.lane.enqueue` (counter, atrybuty: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, atrybuty: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, atrybuty: `openclaw.lane` albo
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, atrybuty: `openclaw.lane`)
- `openclaw.session.state` (counter, atrybuty: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, atrybuty: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, atrybuty: `openclaw.state`)
- `openclaw.run.attempt` (counter, atrybuty: `openclaw.attempt`)

### Eksportowane span-y (nazwy + kluczowe atrybuty)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### Sampling + flush

- Próbkowanie śladów: `diagnostics.otel.sampleRate` (0.0–1.0, tylko root span-y).
- Interwał eksportu metryk: `diagnostics.otel.flushIntervalMs` (min. 1000ms).

### Uwagi dotyczące protokołu

- Endpointy OTLP/HTTP można ustawić przez `diagnostics.otel.endpoint` albo
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Jeśli endpoint zawiera już `/v1/traces` albo `/v1/metrics`, jest używany bez zmian.
- Jeśli endpoint zawiera już `/v1/logs`, jest używany bez zmian dla logów.
- `diagnostics.otel.logs` włącza eksport logów OTLP dla głównego wyjścia loggera.

### Zachowanie eksportu logów

- Logi OTLP używają tych samych ustrukturyzowanych rekordów, które są zapisywane do `logging.file`.
- Respektują `logging.level` (poziom logów plikowych). Redakcja konsoli **nie** ma zastosowania
  do logów OTLP.
- Instalacje o dużym wolumenie powinny preferować próbkowanie/filtrowanie po stronie kolektora OTLP.

## Wskazówki dotyczące rozwiązywania problemów

- **Gateway nieosiągalny?** Najpierw uruchom `openclaw doctor`.
- **Logi puste?** Sprawdź, czy Gateway działa i zapisuje do ścieżki pliku
  ustawionej w `logging.file`.
- **Potrzebujesz więcej szczegółów?** Ustaw `logging.level` na `debug` albo `trace` i spróbuj ponownie.

## Powiązane

- [Wewnętrzne mechanizmy logowania Gateway](/pl/gateway/logging) — style logów WS, prefiksy podsystemów i przechwytywanie konsoli
- [Diagnostyka](/pl/gateway/configuration-reference#diagnostics) — eksport OpenTelemetry i konfiguracja śladów cache
