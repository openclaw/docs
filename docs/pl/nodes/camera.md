---
read_when:
    - Dodawanie lub modyfikowanie przechwytywania obrazu z kamery w węzłach iOS/Android albo na macOS
    - Rozszerzanie dostępnych dla agenta przepływów pracy plików tymczasowych MEDIA
summary: 'Przechwytywanie obrazu z kamery (węzły iOS/Android + aplikacja macOS) do użytku przez agenta: zdjęcia (jpg) i krótkie klipy wideo (mp4)'
title: Przechwytywanie obrazu z kamery
x-i18n:
    generated_at: "2026-05-06T09:20:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 226b9f44e8d56b9b366d679c6c2f974c714afc4cb962afddba89d17dcdfc09eb
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw obsługuje **przechwytywanie obrazu z kamery** w przepływach pracy agentów:

- **Node iOS** (sparowany przez Gateway): przechwyć **zdjęcie** (`jpg`) lub **krótki klip wideo** (`mp4`, z opcjonalnym dźwiękiem) przez `node.invoke`.
- **Node Android** (sparowany przez Gateway): przechwyć **zdjęcie** (`jpg`) lub **krótki klip wideo** (`mp4`, z opcjonalnym dźwiękiem) przez `node.invoke`.
- **Aplikacja macOS** (Node przez Gateway): przechwyć **zdjęcie** (`jpg`) lub **krótki klip wideo** (`mp4`, z opcjonalnym dźwiękiem) przez `node.invoke`.

Cały dostęp do kamery jest chroniony przez **ustawienia kontrolowane przez użytkownika**.

## Node iOS

### Ustawienie użytkownika (domyślnie włączone)

- Karta Ustawienia iOS → **Kamera** → **Zezwalaj na kamerę** (`camera.enabled`)
  - Domyślnie: **włączone** (brakujący klucz jest traktowany jako włączony).
  - Gdy wyłączone: polecenia `camera.*` zwracają `CAMERA_DISABLED`.

### Polecenia (przez Gateway `node.invoke`)

- `camera.list`
  - Ładunek odpowiedzi:
    - `devices`: tablica `{ id, name, position, deviceType }`

- `camera.snap`
  - Parametry:
    - `facing`: `front|back` (domyślnie: `front`)
    - `maxWidth`: liczba (opcjonalnie; domyślnie `1600` w Node iOS)
    - `quality`: `0..1` (opcjonalnie; domyślnie `0.9`)
    - `format`: obecnie `jpg`
    - `delayMs`: liczba (opcjonalnie; domyślnie `0`)
    - `deviceId`: string (opcjonalnie; z `camera.list`)
  - Ładunek odpowiedzi:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Ochrona ładunku: zdjęcia są ponownie kompresowane, aby utrzymać ładunek base64 poniżej 5 MB.

- `camera.clip`
  - Parametry:
    - `facing`: `front|back` (domyślnie: `front`)
    - `durationMs`: liczba (domyślnie `3000`, ograniczona do maksymalnie `60000`)
    - `includeAudio`: boolean (domyślnie `true`)
    - `format`: obecnie `mp4`
    - `deviceId`: string (opcjonalnie; z `camera.list`)
  - Ładunek odpowiedzi:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Wymóg pracy na pierwszym planie

Podobnie jak `canvas.*`, Node iOS zezwala na polecenia `camera.*` tylko na **pierwszym planie**. Wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`.

### Pomocnik CLI (pliki tymczasowe + MEDIA)

Najprostszy sposób uzyskania załączników to użycie pomocnika CLI, który zapisuje zdekodowane multimedia do pliku tymczasowego i wypisuje `MEDIA:<path>`.

Przykłady:

```bash
openclaw nodes camera snap --node <id>               # domyślnie: przód + tył (2 wiersze MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Uwagi:

- `nodes camera snap` domyślnie używa **obu** kierunków, aby dać agentowi oba widoki.
- Pliki wyjściowe są tymczasowe (w katalogu tymczasowym systemu operacyjnego), chyba że zbudujesz własny wrapper.

## Node Android

### Ustawienie użytkownika Androida (domyślnie włączone)

- Arkusz Ustawienia Androida → **Kamera** → **Zezwalaj na kamerę** (`camera.enabled`)
  - Domyślnie: **włączone** (brakujący klucz jest traktowany jako włączony).
  - Gdy wyłączone: polecenia `camera.*` zwracają `CAMERA_DISABLED`.

### Uprawnienia

- Android wymaga uprawnień czasu wykonywania:
  - `CAMERA` dla `camera.snap` i `camera.clip`.
  - `RECORD_AUDIO` dla `camera.clip`, gdy `includeAudio=true`.

Jeśli brakuje uprawnień, aplikacja wyświetli monit, gdy będzie to możliwe; jeśli zostaną odrzucone, żądania `camera.*` zakończą się błędem
`*_PERMISSION_REQUIRED`.

### Wymóg pracy na pierwszym planie w Androidzie

Podobnie jak `canvas.*`, Node Android zezwala na polecenia `camera.*` tylko na **pierwszym planie**. Wywołania w tle zwracają `NODE_BACKGROUND_UNAVAILABLE`.

### Polecenia Androida (przez Gateway `node.invoke`)

- `camera.list`
  - Ładunek odpowiedzi:
    - `devices`: tablica `{ id, name, position, deviceType }`

### Ochrona ładunku

Zdjęcia są ponownie kompresowane, aby utrzymać ładunek base64 poniżej 5 MB.

## Aplikacja macOS

### Ustawienie użytkownika (domyślnie wyłączone)

Aplikacja towarzysząca macOS udostępnia pole wyboru:

- **Ustawienia → Ogólne → Zezwalaj na kamerę** (`openclaw.cameraEnabled`)
  - Domyślnie: **wyłączone**
  - Gdy wyłączone: żądania kamery zwracają „Kamera wyłączona przez użytkownika”.

### Pomocnik CLI (wywołanie Node)

Użyj głównego CLI `openclaw`, aby wywołać polecenia kamery w Node macOS.

Przykłady:

```bash
openclaw nodes camera list --node <id>            # wyświetl identyfikatory kamer
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
- W macOS `camera.snap` czeka `delayMs` (domyślnie 2000 ms) po rozgrzaniu i ustabilizowaniu ekspozycji przed przechwyceniem.
- Ładunki zdjęć są ponownie kompresowane, aby utrzymać base64 poniżej 5 MB.

## Bezpieczeństwo i praktyczne limity

- Dostęp do kamery i mikrofonu wywołuje zwykłe monity o uprawnienia systemu operacyjnego (i wymaga ciągów opisu użycia w Info.plist).
- Klipy wideo są ograniczone (obecnie `<= 60s`), aby uniknąć zbyt dużych ładunków Node (narzut base64 + limity wiadomości).

## Wideo ekranu macOS (poziom systemu operacyjnego)

Do wideo _ekranu_ (nie z kamery) użyj aplikacji towarzyszącej macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # wypisuje MEDIA:<path>
```

Uwagi:

- Wymaga uprawnienia macOS **Nagrywanie ekranu** (TCC).

## Powiązane

- [Obsługa obrazów i multimediów](/pl/nodes/images)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Polecenie lokalizacji](/pl/nodes/location-command)
