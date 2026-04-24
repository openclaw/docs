---
read_when:
    - Dodawanie lub modyfikowanie przechwytywania kamerą na Node iOS/Android lub macOS
    - Rozszerzanie przepływów plików tymczasowych MEDIA dostępnych dla agenta
summary: 'Przechwytywanie kamerą (Node iOS/Android + aplikacja macOS) do użycia przez agenta: zdjęcia (jpg) i krótkie klipy wideo (mp4)'
title: Przechwytywanie kamerą
x-i18n:
    generated_at: "2026-04-24T09:18:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
    source_path: nodes/camera.md
    workflow: 15
---

OpenClaw obsługuje **przechwytywanie kamerą** dla przepływów pracy agenta:

- **Node iOS** (sparowany przez Gateway): przechwytywanie **zdjęcia** (`jpg`) lub **krótkiego klipu wideo** (`mp4`, opcjonalnie z audio) przez `node.invoke`.
- **Node Android** (sparowany przez Gateway): przechwytywanie **zdjęcia** (`jpg`) lub **krótkiego klipu wideo** (`mp4`, opcjonalnie z audio) przez `node.invoke`.
- **Aplikacja macOS** (Node przez Gateway): przechwytywanie **zdjęcia** (`jpg`) lub **krótkiego klipu wideo** (`mp4`, opcjonalnie z audio) przez `node.invoke`.

Cały dostęp do kamery jest chroniony przez **ustawienia kontrolowane przez użytkownika**.

## Node iOS

### Ustawienie użytkownika (domyślnie włączone)

- Zakładka Ustawienia iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Domyślnie: **włączone** (brakujący klucz jest traktowany jako włączony).
  - Gdy wyłączone: polecenia `camera.*` zwracają `CAMERA_DISABLED`.

### Polecenia (przez Gateway `node.invoke`)

- `camera.list`
  - Ładunek odpowiedzi:
    - `devices`: tablica `{ id, name, position, deviceType }`

- `camera.snap`
  - Parametry:
    - `facing`: `front|back` (domyślnie: `front`)
    - `maxWidth`: number (opcjonalne; domyślnie `1600` na Node iOS)
    - `quality`: `0..1` (opcjonalne; domyślnie `0.9`)
    - `format`: obecnie `jpg`
    - `delayMs`: number (opcjonalne; domyślnie `0`)
    - `deviceId`: string (opcjonalne; z `camera.list`)
  - Ładunek odpowiedzi:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Ochrona ładunku: zdjęcia są rekompresowane, aby utrzymać ładunek base64 poniżej 5 MB.

- `camera.clip`
  - Parametry:
    - `facing`: `front|back` (domyślnie: `front`)
    - `durationMs`: number (domyślnie `3000`, ograniczane do maksymalnie `60000`)
    - `includeAudio`: boolean (domyślnie `true`)
    - `format`: obecnie `mp4`
    - `deviceId`: string (opcjonalne; z `camera.list`)
  - Ładunek odpowiedzi:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Wymaganie pierwszego planu

Podobnie jak `canvas.*`, Node iOS pozwala na polecenia `camera.*` tylko na **pierwszym planie**. Wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`.

### Pomocnik CLI (pliki tymczasowe + MEDIA)

Najłatwiejszym sposobem uzyskania załączników jest użycie pomocnika CLI, który zapisuje zdekodowane media do pliku tymczasowego i wypisuje `MEDIA:<path>`.

Przykłady:

```bash
openclaw nodes camera snap --node <id>               # domyślnie: oba kierunki front + back (2 linie MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Uwagi:

- `nodes camera snap` domyślnie używa **obu** kierunków, aby dać agentowi oba widoki.
- Pliki wyjściowe są tymczasowe (w katalogu temp systemu operacyjnego), chyba że zbudujesz własny wrapper.

## Node Android

### Ustawienie użytkownika Android (domyślnie włączone)

- Arkusz ustawień Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - Domyślnie: **włączone** (brakujący klucz jest traktowany jako włączony).
  - Gdy wyłączone: polecenia `camera.*` zwracają `CAMERA_DISABLED`.

### Uprawnienia

- Android wymaga uprawnień runtime:
  - `CAMERA` dla `camera.snap` i `camera.clip`.
  - `RECORD_AUDIO` dla `camera.clip`, gdy `includeAudio=true`.

Jeśli brakuje uprawnień, aplikacja wyświetli prompt, gdy to możliwe; jeśli zostaną odrzucone, żądania `camera.*` kończą się błędem
`*_PERMISSION_REQUIRED`.

### Wymaganie pierwszego planu Android

Podobnie jak `canvas.*`, Node Android pozwala na polecenia `camera.*` tylko na **pierwszym planie**. Wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`.

### Polecenia Android (przez Gateway `node.invoke`)

- `camera.list`
  - Ładunek odpowiedzi:
    - `devices`: tablica `{ id, name, position, deviceType }`

### Ochrona ładunku

Zdjęcia są rekompresowane, aby utrzymać ładunek base64 poniżej 5 MB.

## Aplikacja macOS

### Ustawienie użytkownika (domyślnie wyłączone)

Aplikacja towarzysząca macOS udostępnia pole wyboru:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Domyślnie: **wyłączone**
  - Gdy wyłączone: żądania kamery zwracają “Camera disabled by user”.

### Pomocnik CLI (`node invoke`)

Użyj głównego CLI `openclaw`, aby wywoływać polecenia kamery na Node macOS.

Przykłady:

```bash
openclaw nodes camera list --node <id>            # wyświetla identyfikatory kamer
openclaw nodes camera snap --node <id>            # wypisuje MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # wypisuje MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # wypisuje MEDIA:<path> (starsza flaga)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Uwagi:

- `openclaw nodes camera snap` domyślnie używa `maxWidth=1600`, chyba że zostanie nadpisane.
- Na macOS `camera.snap` czeka `delayMs` (domyślnie 2000 ms) po rozgrzaniu/ustabilizowaniu ekspozycji przed przechwyceniem.
- Ładunki zdjęć są rekompresowane, aby utrzymać base64 poniżej 5 MB.

## Bezpieczeństwo + praktyczne limity

- Dostęp do kamery i mikrofonu wywołuje standardowe prompty uprawnień systemu operacyjnego (i wymaga usage strings w Info.plist).
- Klipy wideo są ograniczane (obecnie `<= 60s`), aby uniknąć zbyt dużych ładunków Node (narzut base64 + limity wiadomości).

## Wideo ekranu macOS (na poziomie OS)

W przypadku wideo _ekranu_ (nie kamery) użyj aplikacji towarzyszącej macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # wypisuje MEDIA:<path>
```

Uwagi:

- Wymaga uprawnienia macOS **Screen Recording** (TCC).

## Powiązane

- [Image and media support](/pl/nodes/images)
- [Media understanding](/pl/nodes/media-understanding)
- [Location command](/pl/nodes/location-command)
