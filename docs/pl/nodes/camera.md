---
read_when:
    - Dodajesz lub modyfikujesz przechwytywanie kamerą w węzłach iOS/Android lub na macOS
    - Rozszerzasz przepływy plików tymczasowych MEDIA dostępnych dla agenta
summary: 'Przechwytywanie kamerą (węzły iOS/Android + aplikacja macOS) do użytku przez agenta: zdjęcia (jpg) i krótkie klipy wideo (mp4)'
title: Przechwytywanie kamerą
x-i18n:
    generated_at: "2026-04-05T13:58:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30b1beaac9602ff29733f72b953065f271928743c8fff03191a007e8b965c88d
    source_path: nodes/camera.md
    workflow: 15
---

# Przechwytywanie kamerą (agent)

OpenClaw obsługuje **przechwytywanie kamerą** dla przepływów pracy agenta:

- **Węzeł iOS** (sparowany przez Gateway): wykonanie **zdjęcia** (`jpg`) lub **krótkiego klipu wideo** (`mp4`, z opcjonalnym dźwiękiem) przez `node.invoke`.
- **Węzeł Android** (sparowany przez Gateway): wykonanie **zdjęcia** (`jpg`) lub **krótkiego klipu wideo** (`mp4`, z opcjonalnym dźwiękiem) przez `node.invoke`.
- **Aplikacja macOS** (węzeł przez Gateway): wykonanie **zdjęcia** (`jpg`) lub **krótkiego klipu wideo** (`mp4`, z opcjonalnym dźwiękiem) przez `node.invoke`.

Cały dostęp do kamery jest chroniony przez **ustawienia kontrolowane przez użytkownika**.

## Węzeł iOS

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
    - `maxWidth`: liczba (opcjonalne; domyślnie `1600` w węźle iOS)
    - `quality`: `0..1` (opcjonalne; domyślnie `0.9`)
    - `format`: obecnie `jpg`
    - `delayMs`: liczba (opcjonalne; domyślnie `0`)
    - `deviceId`: string (opcjonalne; z `camera.list`)
  - Ładunek odpowiedzi:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Ograniczenie ładunku: zdjęcia są ponownie kompresowane, aby utrzymać ładunek base64 poniżej 5 MB.

- `camera.clip`
  - Parametry:
    - `facing`: `front|back` (domyślnie: `front`)
    - `durationMs`: liczba (domyślnie `3000`, ograniczane do maksymalnie `60000`)
    - `includeAudio`: boolean (domyślnie `true`)
    - `format`: obecnie `mp4`
    - `deviceId`: string (opcjonalne; z `camera.list`)
  - Ładunek odpowiedzi:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Wymóg działania na pierwszym planie

Podobnie jak `canvas.*`, węzeł iOS pozwala na polecenia `camera.*` tylko na **pierwszym planie**. Wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`.

### Pomocnik CLI (pliki tymczasowe + MEDIA)

Najłatwiejszym sposobem uzyskania załączników jest pomocnik CLI, który zapisuje zdekodowane multimedia do pliku tymczasowego i wypisuje `MEDIA:<path>`.

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

## Węzeł Android

### Ustawienie użytkownika Android (domyślnie włączone)

- Arkusz ustawień Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - Domyślnie: **włączone** (brakujący klucz jest traktowany jako włączony).
  - Gdy wyłączone: polecenia `camera.*` zwracają `CAMERA_DISABLED`.

### Uprawnienia

- Android wymaga uprawnień runtime:
  - `CAMERA` dla `camera.snap` i `camera.clip`.
  - `RECORD_AUDIO` dla `camera.clip`, gdy `includeAudio=true`.

Jeśli brakuje uprawnień, aplikacja wyświetli monit, gdy to możliwe; jeśli zostaną odrzucone, żądania `camera.*` kończą się błędem
`*_PERMISSION_REQUIRED`.

### Wymóg działania Android na pierwszym planie

Podobnie jak `canvas.*`, węzeł Android pozwala na polecenia `camera.*` tylko na **pierwszym planie**. Wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`.

### Polecenia Android (przez Gateway `node.invoke`)

- `camera.list`
  - Ładunek odpowiedzi:
    - `devices`: tablica `{ id, name, position, deviceType }`

### Ograniczenie ładunku

Zdjęcia są ponownie kompresowane, aby utrzymać ładunek base64 poniżej 5 MB.

## Aplikacja macOS

### Ustawienie użytkownika (domyślnie wyłączone)

Aplikacja towarzysząca macOS udostępnia pole wyboru:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Domyślnie: **wyłączone**
  - Gdy wyłączone: żądania kamery zwracają „Camera disabled by user”.

### Pomocnik CLI (node invoke)

Użyj głównego CLI `openclaw`, aby wywoływać polecenia kamery w węźle macOS.

Przykłady:

```bash
openclaw nodes camera list --node <id>            # wypisz identyfikatory kamer
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
- Na macOS `camera.snap` czeka `delayMs` (domyślnie 2000ms) po rozgrzaniu/ustabilizowaniu ekspozycji przed wykonaniem zdjęcia.
- Ładunki zdjęć są ponownie kompresowane, aby utrzymać base64 poniżej 5 MB.

## Bezpieczeństwo + praktyczne ograniczenia

- Dostęp do kamery i mikrofonu wywołuje standardowe monity o uprawnienia systemu operacyjnego (i wymaga wpisów usage strings w Info.plist).
- Klipy wideo są ograniczone (obecnie `<= 60s`), aby uniknąć zbyt dużych ładunków węzła (narzut base64 + limity wiadomości).

## Wideo ekranu macOS (na poziomie systemu operacyjnego)

W przypadku wideo _ekranu_ (nie kamery) użyj aplikacji towarzyszącej macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # wypisuje MEDIA:<path>
```

Uwagi:

- Wymaga uprawnienia macOS **Screen Recording** (TCC).
