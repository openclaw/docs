---
read_when:
    - Dodawanie lub modyfikowanie przechwytywania obrazu z kamery na platformach Node
    - Rozszerzanie przepływów pracy z plikami tymczasowymi MEDIA dostępnymi dla agenta
summary: Przechwytywanie obrazu z kamery w węzłach iOS, Android, macOS i Linux na potrzeby zdjęć i krótkich klipów wideo
title: Przechwytywanie obrazu z kamery
x-i18n:
    generated_at: "2026-07-16T18:45:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8fff8302863b63209222d87b350238dd2f01e18d06ce1783036b3cefaca14020
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw obsługuje przechwytywanie obrazu z kamery na potrzeby przepływów pracy agentów na sparowanych węzłach **iOS**, **Android**, **macOS** i **Linux**: wykonywanie zdjęcia (`jpg`) lub nagrywanie krótkiego klipu wideo (`mp4`, opcjonalnie z dźwiękiem) za pośrednictwem Gateway `node.invoke`.

Każda platforma umożliwia dostęp do kamery wyłącznie po włączeniu ustawienia kontrolowanego przez użytkownika.

## Węzeł iOS

### Ustawienie użytkownika w systemie iOS

- Karta iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - Domyślnie: **włączone** (brak klucza jest traktowany jako włączenie).
  - Po wyłączeniu: polecenia `camera.*` zwracają `CAMERA_DISABLED`.

### Polecenia iOS (za pośrednictwem Gateway `node.invoke`)

- `camera.list`
  - Dane odpowiedzi: `devices` — tablica elementów `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parametry:
    - `facing`: `front|back` (domyślnie: `front`)
    - `maxWidth`: liczba (opcjonalnie; domyślnie `1600`)
    - `quality`: `0..1` (opcjonalnie; domyślnie `0.9`, ograniczone do `[0.05, 1.0]`)
    - `format`: obecnie `jpg`
    - `delayMs`: liczba (opcjonalnie; domyślnie `0`, wewnętrznie ograniczona do `10000`)
    - `deviceId`: ciąg znaków (opcjonalnie; z `camera.list`)
  - Dane odpowiedzi: `format: "jpg"`, `base64`, `width`, `height`.
  - Limit danych: zdjęcia są ponownie kompresowane, aby zakodowane w base64 dane nie przekraczały 5MB.

- `camera.clip`
  - Parametry:
    - `facing`: `front|back` (domyślnie: `front`)
    - `durationMs`: liczba (domyślnie `3000`, ograniczona do `[250, 60000]`)
    - `includeAudio`: wartość logiczna (domyślnie `true`)
    - `format`: obecnie `mp4`
    - `deviceId`: ciąg znaków (opcjonalnie; z `camera.list`)
  - Dane odpowiedzi: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Wymóg działania systemu iOS na pierwszym planie

Podobnie jak `canvas.*`, węzeł iOS zezwala na polecenia `camera.*` wyłącznie na **pierwszym planie**. Wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`.

### Pomocnicze polecenie CLI

Najłatwiejszym sposobem uzyskania plików multimedialnych jest użycie pomocniczego polecenia CLI, które zapisuje zdekodowane multimedia w pliku tymczasowym i wyświetla ścieżkę zapisu.

```bash
openclaw nodes camera snap --node <id>                 # domyślnie: przedni i tylny aparat (2 wiersze MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` ma domyślnie wartość `--facing both`, dzięki czemu przechwytuje obraz zarówno z przedniego, jak i tylnego aparatu, aby udostępnić agentowi oba widoki; należy przekazać `--device-id` z jednym jawnie określonym kierunkiem (`both` jest odrzucane, gdy ustawiono `--device-id`). Pliki wyjściowe są tymczasowe (znajdują się w katalogu tymczasowym systemu operacyjnego), chyba że zostanie utworzona własna otoczka.

## Węzeł Android

### Ustawienie użytkownika w systemie Android

- Arkusz Android Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - **W nowych instalacjach ustawienie jest domyślnie wyłączone.** W istniejących instalacjach sprzed wprowadzenia tego ustawienia jest ono migrowane do stanu **włączonego**, aby aktualizacje nie powodowały niezauważalnej utraty działającego wcześniej dostępu do kamery.
  - Po wyłączeniu: polecenia `camera.*` zwracają `CAMERA_DISABLED: enable Camera in Settings`.

### Uprawnienia

- `CAMERA` jest wymagane zarówno dla `camera.snap`, jak i `camera.clip`; brak uprawnienia lub jego odmowa powoduje zwrócenie `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` jest wymagane dla `camera.clip`, gdy `includeAudio` ma wartość `true`; brak uprawnienia lub jego odmowa powoduje zwrócenie `MIC_PERMISSION_REQUIRED`.

Aplikacja prosi o uprawnienia w czasie działania, gdy jest to możliwe.

### Wymóg działania systemu Android na pierwszym planie

Podobnie jak `canvas.*`, węzeł Android zezwala na polecenia `camera.*` wyłącznie na **pierwszym planie**. Wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Polecenia Android (za pośrednictwem Gateway `node.invoke`)

- `camera.list`
  - Dane odpowiedzi: `devices` — tablica elementów `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parametry: `facing` (`front|back`, domyślnie `front`), `quality` (domyślnie `0.95`, ograniczone do `[0.1, 1.0]`), `maxWidth` (domyślnie `1600`), `deviceId` (opcjonalnie; nieznany identyfikator powoduje błąd `INVALID_REQUEST`).
  - Dane odpowiedzi: `format: "jpg"`, `base64`, `width`, `height`.
  - Limit danych: ponowna kompresja utrzymuje dane base64 poniżej 5MB (taki sam limit jak w systemie iOS).

- `camera.clip`
  - Parametry: `facing` (domyślnie `front`), `durationMs` (domyślnie `3000`, ograniczone do `[200, 60000]`), `includeAudio` (domyślnie `true`), `deviceId` (opcjonalnie).
  - Dane odpowiedzi: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Limit danych: nieprzetworzony plik MP4 jest ograniczony do 18MB przed zakodowaniem w base64; zbyt duże klipy powodują błąd `PAYLOAD_TOO_LARGE` (należy zmniejszyć `durationMs` i spróbować ponownie).

## Aplikacja macOS

### Ustawienie użytkownika w systemie macOS

Aplikacja towarzysząca dla systemu macOS udostępnia pole wyboru:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Domyślnie: **wyłączone**.
  - Po wyłączeniu: żądania dostępu do kamery zwracają `CAMERA_DISABLED: enable Camera in Settings`.

### Pomocnicze polecenie CLI (wywołanie węzła)

Do wywoływania poleceń kamery w węźle macOS należy użyć głównego CLI `openclaw`.

```bash
openclaw nodes camera list --node <id>                     # wyświetla identyfikatory kamer
openclaw nodes camera snap --node <id>                     # wyświetla ścieżkę zapisu
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # wyświetla ścieżkę zapisu
openclaw nodes camera clip --node <id> --duration-ms 3000   # wyświetla ścieżkę zapisu (starsza flaga)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` ma domyślnie wartość `maxWidth=1600`, o ile nie zostanie nadpisane.
- `camera.snap` czeka `delayMs` (domyślnie 2000ms, ograniczone do `[0, 10000]`) po rozgrzaniu i ustabilizowaniu ekspozycji przed przechwyceniem obrazu.
- Dane zdjęć są ponownie kompresowane, aby dane base64 nie przekraczały 5MB.

## Host węzła Linux

Dołączony Plugin węzła Linux dodaje przechwytywanie obrazu z kamery do usługi CLI `openclaw node`. Działa na hoście bez interfejsu graficznego i nie wymaga aplikacji komputerowej dla systemu Linux.

Dostęp do kamery jest domyślnie wyłączony. Należy go włączyć we wpisie Pluginu, a następnie ponownie uruchomić usługę węzła, aby jej ogłoszenie Gateway zostało przebudowane:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          camera: { enabled: true },
        },
      },
    },
  },
}
```

Wymagania:

- FFmpeg z obsługą wejścia V4L2, `libx264` i AAC
- urządzenie `/dev/video*` dostępne do odczytu dla użytkownika usługi węzła; w popularnych dystrybucjach należy dodać tego użytkownika do grupy `video`
- w przypadku klipów z domyślnym ustawieniem `includeAudio: true`: działający serwer PulseAudio lub warstwa zgodności PipeWire z PulseAudio z domyślnym źródłem

Linux zwraca z `camera.list` możliwe do odczytu ścieżki urządzeń V4L2 obsługujących przechwytywanie; FFmpeg sprawdza każdego kandydata `/dev/video*` i pomija węzły bez metadanych lub wyłącznie wyjściowe. Urządzenie `position` ma wartość `unknown`, dlatego żądania kierunku bez `deviceId` tworzą jedno zdjęcie lub klip z pozycji `unknown`, zamiast deklarować użycie przedniej albo tylnej kamery. Gdy host ma wiele kamer, należy użyć `deviceId`. `camera.snap` używa wstępnego rozgrzewania wejścia FFmpeg przez `delayMs` i zachowuje proporcje obrazu, ograniczając jego szerokość. `camera.clip` nagrywa dźwięk z mikrofonu jako ścieżkę audio pliku MP4; OpenClaw celowo nie udostępnia osobnego polecenia mikrofonu.

Plugin używa `libx264` do kodowania wideo MP4 i nie zmienia kodeków bez powiadomienia. Kompilacja FFmpeg bez wymaganego wejścia lub koderów zwraca `CAMERA_UNAVAILABLE`. Zdjęcia i klipy, które przekroczyłyby limit 25MB danych base64, powodują błąd `PAYLOAD_TOO_LARGE`.

`camera.snap` i `camera.clip` pozostają niebezpiecznymi poleceniami. Należy dodać je do `gateway.nodes.allowCommands` tylko wtedy, gdy przechwytywanie ma zostać uzbrojone; samo włączenie Pluginu nie omija zasad Gateway.

## Bezpieczeństwo i ograniczenia praktyczne

- Dostęp do kamery i mikrofonu wywołuje standardowe monity o uprawnienia systemu operacyjnego (i wymaga ciągów opisujących użycie w `Info.plist`).
- Klipy wideo są ograniczone do 60s, aby uniknąć zbyt dużych danych węzła (narzut base64 oraz limity wiadomości).

## Nagrywanie ekranu w systemie macOS (na poziomie systemu operacyjnego)

Do nagrywania _ekranu_ (nie obrazu z kamery) należy użyć aplikacji towarzyszącej dla systemu macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # wyświetla ścieżkę zapisu
```

Wymaga uprawnienia systemu macOS **Screen Recording** (TCC).

## Powiązane materiały

- [Obsługa obrazów i multimediów](/pl/nodes/images)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Polecenie lokalizacji](/pl/nodes/location-command)
