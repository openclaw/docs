---
read_when:
    - Dodawanie lub modyfikowanie przechwytywania obrazu z kamery na węzłach iOS/Android lub macOS
    - Rozszerzanie przepływów pracy tymczasowych plików MEDIA dostępnych dla agenta
summary: 'Przechwytywanie obrazu z kamery (węzły iOS/Android + aplikacja macOS) do użytku przez agenta: zdjęcia (jpg) i krótkie klipy wideo (mp4)'
title: Przechwytywanie obrazu z kamery
x-i18n:
    generated_at: "2026-06-27T17:44:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw obsługuje **przechwytywanie z kamery** dla przepływów pracy agentów:

- **węzeł iOS** (sparowany przez Gateway): przechwyć **zdjęcie** (`jpg`) lub **krótki klip wideo** (`mp4`, opcjonalnie z dźwiękiem) przez `node.invoke`.
- **węzeł Android** (sparowany przez Gateway): przechwyć **zdjęcie** (`jpg`) lub **krótki klip wideo** (`mp4`, opcjonalnie z dźwiękiem) przez `node.invoke`.
- **aplikacja macOS** (węzeł przez Gateway): przechwyć **zdjęcie** (`jpg`) lub **krótki klip wideo** (`mp4`, opcjonalnie z dźwiękiem) przez `node.invoke`.

Cały dostęp do kamery jest ograniczony przez **ustawienia kontrolowane przez użytkownika**.

## węzeł iOS

### Ustawienie użytkownika (domyślnie włączone)

- Karta ustawień iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Domyślnie: **włączone** (brakujący klucz jest traktowany jako włączony).
  - Gdy wyłączone: polecenia `camera.*` zwracają `CAMERA_DISABLED`.

### Polecenia (przez Gateway `node.invoke`)

- `camera.list`
  - Ładunek odpowiedzi:
    - `devices`: tablica `{ id, name, position, deviceType }`

- `camera.snap`
  - Parametry:
    - `facing`: `front|back` (domyślnie: `front`)
    - `maxWidth`: liczba (opcjonalnie; domyślnie `1600` w węźle iOS)
    - `quality`: `0..1` (opcjonalnie; domyślnie `0.9`)
    - `format`: obecnie `jpg`
    - `delayMs`: liczba (opcjonalnie; domyślnie `0`)
    - `deviceId`: ciąg znaków (opcjonalnie; z `camera.list`)
  - Ładunek odpowiedzi:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Ograniczenie ładunku: zdjęcia są ponownie kompresowane, aby utrzymać ładunek base64 poniżej 5 MB.

- `camera.clip`
  - Parametry:
    - `facing`: `front|back` (domyślnie: `front`)
    - `durationMs`: liczba (domyślnie `3000`, ograniczana do maksymalnie `60000`)
    - `includeAudio`: wartość logiczna (domyślnie `true`)
    - `format`: obecnie `mp4`
    - `deviceId`: ciąg znaków (opcjonalnie; z `camera.list`)
  - Ładunek odpowiedzi:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Wymóg pierwszego planu

Podobnie jak `canvas.*`, węzeł iOS zezwala na polecenia `camera.*` tylko na **pierwszym planie**. Wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`.

### Pomocnik CLI

Najłatwiejszym sposobem uzyskania plików multimedialnych jest pomocnik CLI, który zapisuje zdekodowane media do pliku tymczasowego i wypisuje zapisaną ścieżkę.

Przykłady:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Uwagi:

- `nodes camera snap` domyślnie używa **obu** kierunków, aby dać agentowi oba widoki.
- Pliki wyjściowe są tymczasowe (w katalogu tymczasowym systemu operacyjnego), chyba że zbudujesz własny wrapper.

## węzeł Android

### Ustawienie użytkownika Android (domyślnie włączone)

- Arkusz ustawień Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - Domyślnie: **włączone** (brakujący klucz jest traktowany jako włączony).
  - Gdy wyłączone: polecenia `camera.*` zwracają `CAMERA_DISABLED`.

### Uprawnienia

- Android wymaga uprawnień w czasie działania:
  - `CAMERA` dla `camera.snap` i `camera.clip`.
  - `RECORD_AUDIO` dla `camera.clip`, gdy `includeAudio=true`.

Jeśli brakuje uprawnień, aplikacja wyświetli monit, gdy będzie to możliwe; jeśli zostaną odrzucone, żądania `camera.*` zakończą się błędem
`*_PERMISSION_REQUIRED`.

### Wymóg pierwszego planu Android

Podobnie jak `canvas.*`, węzeł Android zezwala na polecenia `camera.*` tylko na **pierwszym planie**. Wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`.

### Polecenia Android (przez Gateway `node.invoke`)

- `camera.list`
  - Ładunek odpowiedzi:
    - `devices`: tablica `{ id, name, position, deviceType }`

### Ograniczenie ładunku

Zdjęcia są ponownie kompresowane, aby utrzymać ładunek base64 poniżej 5 MB.

## aplikacja macOS

### Ustawienie użytkownika (domyślnie wyłączone)

Aplikacja towarzysząca macOS udostępnia pole wyboru:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Domyślnie: **wyłączone**
  - Gdy wyłączone: żądania kamery zwracają „Camera disabled by user”.

### Pomocnik CLI (wywołanie węzła)

Użyj głównego CLI `openclaw`, aby wywołać polecenia kamery w węźle macOS.

Przykłady:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints saved path
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints saved path
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints saved path (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Uwagi:

- `openclaw nodes camera snap` domyślnie używa `maxWidth=1600`, chyba że zostanie to nadpisane.
- W macOS `camera.snap` czeka przez `delayMs` (domyślnie 2000 ms) po rozgrzaniu/ustabilizowaniu ekspozycji przed przechwyceniem.
- Ładunki zdjęć są ponownie kompresowane, aby utrzymać base64 poniżej 5 MB.

## Bezpieczeństwo i praktyczne limity

- Dostęp do kamery i mikrofonu uruchamia zwykłe monity o uprawnienia systemu operacyjnego (i wymaga ciągów użycia w Info.plist).
- Klipy wideo są ograniczane (obecnie `<= 60s`), aby uniknąć zbyt dużych ładunków węzła (narzut base64 + limity wiadomości).

## Wideo ekranu macOS (na poziomie systemu operacyjnego)

Dla wideo _ekranu_ (nie kamery) użyj aplikacji towarzyszącej macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

Uwagi:

- Wymaga uprawnienia macOS **Screen Recording** (TCC).

## Powiązane

- [Obsługa obrazów i multimediów](/pl/nodes/images)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Polecenie lokalizacji](/pl/nodes/location-command)
