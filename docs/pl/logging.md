---
read_when:
    - Potrzebujesz przyjaznego dla początkujących przeglądu logowania
    - Chcesz skonfigurować poziomy logów lub formaty
    - Rozwiązujesz problem i chcesz szybko znaleźć logi
summary: 'Przegląd logowania: logi plikowe, dane wyjściowe konsoli, śledzenie przez CLI i Control UI'
title: Logging Overview
x-i18n:
    generated_at: "2026-04-05T13:59:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a5e3800b7c5128602d05d5a35df4f88c373cfbe9397cca7e7154fff56a7f7ef
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw ma dwie główne powierzchnie logów:

- **Logi plikowe** (linie JSON) zapisywane przez Gateway.
- **Dane wyjściowe konsoli** wyświetlane w terminalach i w Gateway Debug UI.

Zakładka **Logs** w Control UI śledzi plik logu gateway. Ta strona wyjaśnia, gdzie
znajdują się logi, jak je odczytywać i jak konfigurować poziomy i formaty logów.

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

## Jak odczytywać logi

### CLI: śledzenie na żywo (zalecane)

Użyj CLI do śledzenia pliku logu gateway przez RPC:

```bash
openclaw logs --follow
```

Przydatne bieżące opcje:

- `--local-time`: renderuje znaczniki czasu w Twojej lokalnej strefie czasowej
- `--url <url>` / `--token <token>` / `--timeout <ms>`: standardowe flagi Gateway RPC
- `--expect-final`: flaga oczekiwania na końcową odpowiedź dla RPC opartych na agencie (akceptowana tutaj przez współdzieloną warstwę klienta)

Tryby danych wyjściowych:

- **Sesje TTY**: estetyczne, kolorowe, ustrukturyzowane wiersze logów.
- **Sesje non-TTY**: zwykły tekst.
- `--json`: JSON rozdzielany wierszami (jedno zdarzenie logu na wiersz).
- `--plain`: wymuś zwykły tekst w sesjach TTY.
- `--no-color`: wyłącz kolory ANSI.

Gdy przekażesz jawne `--url`, CLI nie stosuje automatycznie konfiguracji ani
poświadczeń środowiskowych; dołącz `--token` samodzielnie, jeśli docelowy Gateway
wymaga uwierzytelniania.

W trybie JSON CLI emituje obiekty oznaczone polem `type`:

- `meta`: metadane strumienia (plik, kursor, rozmiar)
- `log`: sparsowany wpis logu
- `notice`: wskazówki dotyczące obcięcia / rotacji
- `raw`: niesparsowany wiersz logu

Jeśli lokalny Gateway loopback poprosi o parowanie, `openclaw logs` automatycznie wraca do
skonfigurowanego lokalnego pliku logu. Jawne cele `--url` nie używają tego fallbacku.

Jeśli Gateway jest nieosiągalny, CLI wypisuje krótką wskazówkę, aby uruchomić:

```bash
openclaw doctor
```

### Control UI (web)

Zakładka **Logs** w Control UI śledzi ten sam plik za pomocą `logs.tail`.
Zobacz [/web/control-ui](/web/control-ui), aby dowiedzieć się, jak ją otworzyć.

### Logi tylko kanałów

Aby filtrować aktywność kanałów (WhatsApp/Telegram/itd.), użyj:

```bash
openclaw channels logs --channel whatsapp
```

## Formaty logów

### Logi plikowe (JSONL)

Każdy wiersz w pliku logu jest obiektem JSON. CLI i Control UI analizują te
wpisy, aby renderować ustrukturyzowane dane wyjściowe (czas, poziom, podsystem, komunikat).

### Dane wyjściowe konsoli

Logi konsoli są **świadome TTY** i sformatowane pod kątem czytelności:

- Prefiksy podsystemów (np. `gateway/channels/whatsapp`)
- Kolorowanie poziomów (info/warn/error)
- Opcjonalny tryb compact lub JSON

Formatowanie konsoli jest kontrolowane przez `logging.consoleStyle`.

### Logi WebSocket gateway

`openclaw gateway` ma także logowanie protokołu WebSocket dla ruchu RPC:

- tryb normalny: tylko interesujące wyniki (błędy, błędy parsowania, wolne wywołania)
- `--verbose`: cały ruch żądań/odpowiedzi
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

Możesz nadpisać oba przez zmienną środowiskową **`OPENCLAW_LOG_LEVEL`** (np. `OPENCLAW_LOG_LEVEL=debug`). Zmienna środowiskowa ma pierwszeństwo przed plikiem konfiguracyjnym, więc możesz podnieść poziom szczegółowości dla pojedynczego uruchomienia bez edytowania `openclaw.json`. Możesz też przekazać globalną opcję CLI **`--log-level <level>`** (na przykład `openclaw --log-level debug gateway run`), która nadpisuje zmienną środowiskową dla tego polecenia.

`--verbose` wpływa tylko na dane wyjściowe konsoli i szczegółowość logów WS; nie zmienia
poziomów logów plikowych.

### Style konsoli

`logging.consoleStyle`:

- `pretty`: przyjazny dla człowieka, kolorowy, ze znacznikami czasu.
- `compact`: bardziej zwarty format (najlepszy dla długich sesji).
- `json`: JSON w każdym wierszu (dla procesorów logów).

### Redagowanie

Podsumowania narzędzi mogą redagować wrażliwe tokeny, zanim trafią do konsoli:

- `logging.redactSensitive`: `off` | `tools` (domyślnie: `tools`)
- `logging.redactPatterns`: lista ciągów regex nadpisujących zestaw domyślny

Redagowanie wpływa tylko na **dane wyjściowe konsoli** i nie zmienia logów plikowych.

## Diagnostics + OpenTelemetry

Diagnostics to ustrukturyzowane, czytelne dla maszyn zdarzenia dla uruchomień modeli **oraz**
telemetrii przepływu wiadomości (webhooki, kolejkowanie, stan sesji). **Nie**
zastępują logów; istnieją po to, aby zasilać metryki, trace i inne eksportery.

Zdarzenia diagnostics są emitowane w procesie, ale eksportery dołączają się tylko wtedy, gdy
włączone są diagnostics i plugin eksportera.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: model danych + SDK dla trace, metryk i logów.
- **OTLP**: protokół sieciowy używany do eksportu danych OTel do kolektora/backendu.
- OpenClaw eksportuje dziś przez **OTLP/HTTP (protobuf)**.

### Eksportowane sygnały

- **Metryki**: liczniki + histogramy (użycie tokenów, przepływ wiadomości, kolejkowanie).
- **Trace**: spans dla użycia modeli + przetwarzania webhooków/wiadomości.
- **Logi**: eksportowane przez OTLP, gdy włączono `diagnostics.otel.logs`. Wolumen logów może być wysoki; pamiętaj o `logging.level` i filtrach eksportera.

### Katalog zdarzeń diagnostycznych

Użycie modeli:

- `model.usage`: tokeny, koszt, czas trwania, kontekst, dostawca/model/kanał, identyfikatory sesji.

Przepływ wiadomości:

- `webhook.received`: wejście webhooka per kanał.
- `webhook.processed`: obsłużony webhook + czas trwania.
- `webhook.error`: błędy handlera webhooka.
- `message.queued`: wiadomość dodana do kolejki do przetworzenia.
- `message.processed`: wynik + czas trwania + opcjonalny błąd.

Kolejka + sesja:

- `queue.lane.enqueue`: dodanie do kolejki pasa poleceń + głębokość.
- `queue.lane.dequeue`: zdjęcie z kolejki pasa poleceń + czas oczekiwania.
- `session.state`: przejście stanu sesji + przyczyna.
- `session.stuck`: ostrzeżenie o zablokowanej sesji + wiek.
- `run.attempt`: metadane ponowień/prób uruchomienia.
- `diagnostic.heartbeat`: agregowane liczniki (webhooki/kolejka/sesja).

### Włączanie diagnostics (bez eksportera)

Użyj tego, jeśli chcesz, aby zdarzenia diagnostics były dostępne dla pluginów lub własnych ujść:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flagi diagnostics (ukierunkowane logi)

Używaj flag, aby włączać dodatkowe, ukierunkowane logi debug bez podnoszenia `logging.level`.
Flagi są nieczułe na wielkość liter i obsługują wildcardy (np. `telegram.*` lub `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Nadpisanie env (jednorazowo):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Uwagi:

- Logi flag trafiają do standardowego pliku logu (tego samego co `logging.file`).
- Dane wyjściowe są nadal redagowane zgodnie z `logging.redactSensitive`.
- Pełny przewodnik: [/diagnostics/flags](/diagnostics/flags).

### Eksport do OpenTelemetry

Diagnostics można eksportować przez plugin `diagnostics-otel` (OTLP/HTTP). To
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

- Możesz też włączyć plugin poleceniem `openclaw plugins enable diagnostics-otel`.
- `protocol` obecnie obsługuje tylko `http/protobuf`. `grpc` jest ignorowane.
- Metryki obejmują użycie tokenów, koszt, rozmiar kontekstu, czas trwania uruchomienia i liczniki/histogramy przepływu wiadomości (webhooki, kolejkowanie, stan sesji, głębokość/czas oczekiwania kolejki).
- Trace/metryki można przełączać przez `traces` / `metrics` (domyślnie: włączone). Trace obejmują spans użycia modeli oraz spans przetwarzania webhooków/wiadomości, gdy są włączone.
- Ustaw `headers`, gdy Twój kolektor wymaga uwierzytelniania.
- Obsługiwane zmienne środowiskowe: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Eksportowane metryki (nazwy + typy)

Użycie modeli:

- `openclaw.tokens` (licznik, atrybuty: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (licznik, atrybuty: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, atrybuty: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, atrybuty: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Przepływ wiadomości:

- `openclaw.webhook.received` (licznik, atrybuty: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (licznik, atrybuty: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, atrybuty: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (licznik, atrybuty: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (licznik, atrybuty: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, atrybuty: `openclaw.channel`,
  `openclaw.outcome`)

Kolejki + sesje:

- `openclaw.queue.lane.enqueue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (licznik, atrybuty: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, atrybuty: `openclaw.lane` lub
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, atrybuty: `openclaw.lane`)
- `openclaw.session.state` (licznik, atrybuty: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (licznik, atrybuty: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, atrybuty: `openclaw.state`)
- `openclaw.run.attempt` (licznik, atrybuty: `openclaw.attempt`)

### Eksportowane spans (nazwy + kluczowe atrybuty)

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

### Sampling + opróżnianie

- Próbkowanie trace: `diagnostics.otel.sampleRate` (0.0–1.0, tylko spans główne).
- Interwał eksportu metryk: `diagnostics.otel.flushIntervalMs` (minimum 1000ms).

### Uwagi dotyczące protokołu

- Endpointy OTLP/HTTP można ustawić przez `diagnostics.otel.endpoint` lub
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Jeśli endpoint zawiera już `/v1/traces` lub `/v1/metrics`, jest używany bez zmian.
- Jeśli endpoint zawiera już `/v1/logs`, jest używany bez zmian dla logów.
- `diagnostics.otel.logs` włącza eksport logów OTLP dla danych wyjściowych głównego loggera.

### Zachowanie eksportu logów

- Logi OTLP używają tych samych ustrukturyzowanych rekordów zapisywanych do `logging.file`.
- Szanują `logging.level` (poziom logów plikowych). Redagowanie konsoli **nie** ma zastosowania do logów OTLP.
- Instalacje o wysokim wolumenie powinny preferować próbkowanie/filtrowanie w kolektorze OTLP.

## Wskazówki dotyczące rozwiązywania problemów

- **Gateway nieosiągalny?** Najpierw uruchom `openclaw doctor`.
- **Puste logi?** Sprawdź, czy Gateway działa i zapisuje do ścieżki pliku
  z `logging.file`.
- **Potrzebujesz więcej szczegółów?** Ustaw `logging.level` na `debug` lub `trace` i spróbuj ponownie.

## Powiązane

- [Gateway Logging Internals](/gateway/logging) — style logów WS, prefiksy podsystemów i przechwytywanie konsoli
- [Diagnostics](/gateway/configuration-reference#diagnostics) — eksport OpenTelemetry i konfiguracja cache trace
