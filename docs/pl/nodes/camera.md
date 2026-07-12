---
read_when:
    - Dodawanie lub modyfikowanie przechwytywania obrazu z kamery w węzłach iOS/Android lub w systemie macOS
    - Rozszerzanie przepływów pracy z plikami tymczasowymi MEDIA dostępnymi dla agenta
summary: 'Przechwytywanie obrazu z kamery (węzły iOS/Android oraz aplikacja macOS) na potrzeby agenta: zdjęcia (jpg) i krótkie klipy wideo (mp4)'
title: Przechwytywanie obrazu z kamery
x-i18n:
    generated_at: "2026-07-12T15:15:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw obsługuje przechwytywanie obrazu z kamery na potrzeby przepływów pracy agentów na sparowanych węzłach **iOS**, **Android** i **macOS**: wykonywanie zdjęcia (`jpg`) lub nagrywanie krótkiego klipu wideo (`mp4`, opcjonalnie z dźwiękiem) za pomocą `node.invoke` w Gateway.

Dostęp do kamery na każdej platformie zależy od ustawienia kontrolowanego przez użytkownika.

## Węzeł iOS

### Ustawienie użytkownika w iOS

- Karta iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - Domyślnie: **włączone** (brak klucza jest traktowany jako włączenie).
  - Gdy wyłączone: polecenia `camera.*` zwracają `CAMERA_DISABLED`.

### Polecenia iOS (przez `node.invoke` w Gateway)

- `camera.list`
  - Dane odpowiedzi: `devices` — tablica elementów `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parametry:
    - `facing`: `front|back` (domyślnie: `front`)
    - `maxWidth`: liczba (opcjonalnie; domyślnie `1600`)
    - `quality`: `0..1` (opcjonalnie; domyślnie `0.9`, ograniczane do `[0.05, 1.0]`)
    - `format`: obecnie `jpg`
    - `delayMs`: liczba (opcjonalnie; domyślnie `0`, wewnętrznie ograniczana do `10000`)
    - `deviceId`: ciąg znaków (opcjonalnie; z `camera.list`)
  - Dane odpowiedzi: `format: "jpg"`, `base64`, `width`, `height`.
  - Ograniczenie danych: zdjęcia są ponownie kompresowane, aby dane zakodowane w base64 miały mniej niż 5 MB.

- `camera.clip`
  - Parametry:
    - `facing`: `front|back` (domyślnie: `front`)
    - `durationMs`: liczba (domyślnie `3000`, ograniczana do `[250, 60000]`)
    - `includeAudio`: wartość logiczna (domyślnie `true`)
    - `format`: obecnie `mp4`
    - `deviceId`: ciąg znaków (opcjonalnie; z `camera.list`)
  - Dane odpowiedzi: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Wymóg działania iOS na pierwszym planie

Podobnie jak w przypadku `canvas.*`, węzeł iOS zezwala na polecenia `camera.*` tylko na **pierwszym planie**. Wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`.

### Narzędzie pomocnicze CLI

Najłatwiej uzyskać pliki multimedialne za pomocą narzędzia pomocniczego CLI, które zapisuje zdekodowane multimedia w pliku tymczasowym i wyświetla ścieżkę zapisu.

```bash
openclaw nodes camera snap --node <id>                 # domyślnie: przednia i tylna (2 wiersze MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Polecenie `nodes camera snap` domyślnie używa `--facing both`, przechwytując obraz zarówno z przedniej, jak i tylnej kamery, aby udostępnić agentowi oba widoki; opcję `--device-id` należy przekazać z jedną jawnie określoną stroną kamery (`both` jest odrzucane, gdy ustawiono `--device-id`). Pliki wyjściowe są tymczasowe (w katalogu tymczasowym systemu operacyjnego), chyba że utworzysz własny skrypt opakowujący.

## Węzeł Android

### Ustawienie użytkownika w Androidzie

- Panel Android Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - **W nowych instalacjach jest domyślnie wyłączone.** Istniejące instalacje sprzed wprowadzenia tego ustawienia są migrowane do stanu **włączonego**, aby aktualizacja nie powodowała niezauważalnej utraty wcześniej działającego dostępu do kamery.
  - Gdy wyłączone: polecenia `camera.*` zwracają `CAMERA_DISABLED: enable Camera in Settings`.

### Uprawnienia

- Uprawnienie `CAMERA` jest wymagane zarówno dla `camera.snap`, jak i `camera.clip`; brak uprawnienia lub odmowa jego przyznania powoduje zwrócenie `CAMERA_PERMISSION_REQUIRED`.
- Uprawnienie `RECORD_AUDIO` jest wymagane dla `camera.clip`, gdy `includeAudio` ma wartość `true`; brak uprawnienia lub odmowa jego przyznania powoduje zwrócenie `MIC_PERMISSION_REQUIRED`.

Gdy jest to możliwe, aplikacja prosi o uprawnienia w czasie działania.

### Wymóg działania Androida na pierwszym planie

Podobnie jak w przypadku `canvas.*`, węzeł Android zezwala na polecenia `camera.*` tylko na **pierwszym planie**. Wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Polecenia Androida (przez `node.invoke` w Gateway)

- `camera.list`
  - Dane odpowiedzi: `devices` — tablica elementów `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parametry: `facing` (`front|back`, domyślnie `front`), `quality` (domyślnie `0.95`, ograniczane do `[0.1, 1.0]`), `maxWidth` (domyślnie `1600`), `deviceId` (opcjonalnie; nieznany identyfikator powoduje błąd `INVALID_REQUEST`).
  - Dane odpowiedzi: `format: "jpg"`, `base64`, `width`, `height`.
  - Ograniczenie danych: ponowna kompresja pozwala utrzymać rozmiar base64 poniżej 5 MB (ten sam limit co w iOS).

- `camera.clip`
  - Parametry: `facing` (domyślnie `front`), `durationMs` (domyślnie `3000`, ograniczane do `[200, 60000]`), `includeAudio` (domyślnie `true`), `deviceId` (opcjonalnie).
  - Dane odpowiedzi: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Ograniczenie danych: nieprzetworzony plik MP4 jest ograniczony do 18 MB przed zakodowaniem w base64; zbyt duże klipy powodują błąd `PAYLOAD_TOO_LARGE` (zmniejsz `durationMs` i spróbuj ponownie).

## Aplikacja macOS

### Ustawienie użytkownika w macOS

Aplikacja towarzysząca dla macOS udostępnia pole wyboru:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Domyślnie: **wyłączone**.
  - Gdy wyłączone: żądania kamery zwracają `CAMERA_DISABLED: enable Camera in Settings`.

### Narzędzie pomocnicze CLI (wywołanie węzła)

Użyj głównego interfejsu CLI `openclaw`, aby wywoływać polecenia kamery w węźle macOS.

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

- `openclaw nodes camera snap` domyślnie używa `maxWidth=1600`, chyba że wartość zostanie nadpisana.
- Polecenie `camera.snap` po rozgrzaniu kamery i ustabilizowaniu ekspozycji czeka przez `delayMs` (domyślnie 2000 ms, ograniczane do `[0, 10000]`), zanim wykona zdjęcie.
- Dane zdjęć są ponownie kompresowane, aby rozmiar base64 pozostał poniżej 5 MB.

## Bezpieczeństwo i ograniczenia praktyczne

- Dostęp do kamery i mikrofonu wywołuje standardowe monity systemu operacyjnego o uprawnienia (i wymaga ciągów opisujących użycie w `Info.plist`).
- Klipy wideo są ograniczone do 60 s, aby uniknąć zbyt dużych danych węzła (narzut base64 oraz limity wiadomości).

## Nagrywanie ekranu w macOS (na poziomie systemu operacyjnego)

Do nagrywania _ekranu_ (nie obrazu z kamery) użyj aplikacji towarzyszącej dla macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # wyświetla ścieżkę zapisu
```

Wymaga uprawnienia macOS **Screen Recording** (TCC).

## Powiązane

- [Obsługa obrazów i multimediów](/pl/nodes/images)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Polecenie lokalizacji](/pl/nodes/location-command)
