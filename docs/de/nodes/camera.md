---
read_when:
    - Kameraerfassung auf iOS-/Android-Knoten oder macOS hinzufügen oder ändern
    - Agent-zugängliche MEDIA-Workflows für temporäre Dateien erweitern
summary: 'Kameraaufnahme (iOS-/Android-Knoten + macOS-App) zur Agent-Nutzung: Fotos (jpg) und kurze Videoclips (mp4)'
title: Kameraaufnahme
x-i18n:
    generated_at: "2026-06-27T17:39:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw unterstützt **Kameraaufnahme** für Agent-Workflows:

- **iOS Node** (über Gateway gekoppelt): Erfassen Sie ein **Foto** (`jpg`) oder einen **kurzen Videoclip** (`mp4`, mit optionalem Audio) über `node.invoke`.
- **Android Node** (über Gateway gekoppelt): Erfassen Sie ein **Foto** (`jpg`) oder einen **kurzen Videoclip** (`mp4`, mit optionalem Audio) über `node.invoke`.
- **macOS-App** (Node über Gateway): Erfassen Sie ein **Foto** (`jpg`) oder einen **kurzen Videoclip** (`mp4`, mit optionalem Audio) über `node.invoke`.

Jeder Kamerazugriff ist durch **benutzergesteuerte Einstellungen** geschützt.

## iOS Node

### Benutzereinstellung (standardmäßig ein)

- iOS-Einstellungen-Tab → **Kamera** → **Kamera erlauben** (`camera.enabled`)
  - Standard: **ein** (ein fehlender Schlüssel wird als aktiviert behandelt).
  - Wenn ausgeschaltet: `camera.*`-Befehle geben `CAMERA_DISABLED` zurück.

### Befehle (über Gateway `node.invoke`)

- `camera.list`
  - Antwort-Payload:
    - `devices`: Array aus `{ id, name, position, deviceType }`

- `camera.snap`
  - Parameter:
    - `facing`: `front|back` (Standard: `front`)
    - `maxWidth`: Zahl (optional; Standard `1600` auf der iOS Node)
    - `quality`: `0..1` (optional; Standard `0.9`)
    - `format`: derzeit `jpg`
    - `delayMs`: Zahl (optional; Standard `0`)
    - `deviceId`: Zeichenfolge (optional; aus `camera.list`)
  - Antwort-Payload:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Payload-Schutz: Fotos werden erneut komprimiert, damit der base64-Payload unter 5 MB bleibt.

- `camera.clip`
  - Parameter:
    - `facing`: `front|back` (Standard: `front`)
    - `durationMs`: Zahl (Standard `3000`, auf maximal `60000` begrenzt)
    - `includeAudio`: boolescher Wert (Standard `true`)
    - `format`: derzeit `mp4`
    - `deviceId`: Zeichenfolge (optional; aus `camera.list`)
  - Antwort-Payload:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Voraussetzung: Vordergrund

Wie `canvas.*` erlaubt die iOS Node `camera.*`-Befehle nur im **Vordergrund**. Aufrufe im Hintergrund geben `NODE_BACKGROUND_UNAVAILABLE` zurück.

### CLI-Helfer

Der einfachste Weg, Mediendateien zu erhalten, ist der CLI-Helfer, der dekodierte Medien in eine temporäre Datei schreibt und den gespeicherten Pfad ausgibt.

Beispiele:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Hinweise:

- `nodes camera snap` verwendet standardmäßig **beide** Ausrichtungen, damit der Agent beide Ansichten erhält.
- Ausgabedateien sind temporär (im temporären Verzeichnis des Betriebssystems), sofern Sie keinen eigenen Wrapper erstellen.

## Android Node

### Android-Benutzereinstellung (standardmäßig ein)

- Android-Einstellungsblatt → **Kamera** → **Kamera erlauben** (`camera.enabled`)
  - Standard: **ein** (ein fehlender Schlüssel wird als aktiviert behandelt).
  - Wenn ausgeschaltet: `camera.*`-Befehle geben `CAMERA_DISABLED` zurück.

### Berechtigungen

- Android erfordert Laufzeitberechtigungen:
  - `CAMERA` für sowohl `camera.snap` als auch `camera.clip`.
  - `RECORD_AUDIO` für `camera.clip`, wenn `includeAudio=true`.

Wenn Berechtigungen fehlen, fordert die App sie nach Möglichkeit an; wenn sie verweigert werden, schlagen `camera.*`-Anfragen mit einem
`*_PERMISSION_REQUIRED`-Fehler fehl.

### Android-Voraussetzung: Vordergrund

Wie `canvas.*` erlaubt die Android Node `camera.*`-Befehle nur im **Vordergrund**. Aufrufe im Hintergrund geben `NODE_BACKGROUND_UNAVAILABLE` zurück.

### Android-Befehle (über Gateway `node.invoke`)

- `camera.list`
  - Antwort-Payload:
    - `devices`: Array aus `{ id, name, position, deviceType }`

### Payload-Schutz

Fotos werden erneut komprimiert, damit der base64-Payload unter 5 MB bleibt.

## macOS-App

### Benutzereinstellung (standardmäßig aus)

Die macOS-Begleit-App stellt ein Kontrollkästchen bereit:

- **Einstellungen → Allgemein → Kamera erlauben** (`openclaw.cameraEnabled`)
  - Standard: **aus**
  - Wenn ausgeschaltet: Kameraanfragen geben „Kamera vom Benutzer deaktiviert“ zurück.

### CLI-Helfer (Node invoke)

Verwenden Sie die Haupt-CLI `openclaw`, um Kamerabefehle auf der macOS Node aufzurufen.

Beispiele:

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

Hinweise:

- `openclaw nodes camera snap` verwendet standardmäßig `maxWidth=1600`, sofern dies nicht überschrieben wird.
- Unter macOS wartet `camera.snap` nach dem Warm-up bzw. der Belichtungsstabilisierung `delayMs` (Standard 2000 ms), bevor die Aufnahme erfolgt.
- Foto-Payloads werden erneut komprimiert, damit base64 unter 5 MB bleibt.

## Sicherheit + praktische Grenzen

- Kamera- und Mikrofonzugriff lösen die üblichen Berechtigungsaufforderungen des Betriebssystems aus (und erfordern Nutzungsbeschreibungen in Info.plist).
- Videoclips sind begrenzt (derzeit `<= 60s`), um übergroße Node-Payloads zu vermeiden (base64-Overhead + Nachrichtenlimits).

## macOS-Bildschirmvideo (auf Betriebssystemebene)

Für _Bildschirm_-Videos (nicht Kamera) verwenden Sie die macOS-Begleit-App:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

Hinweise:

- Erfordert die macOS-Berechtigung **Bildschirmaufnahme** (TCC).

## Verwandte Themen

- [Bild- und Medienunterstützung](/de/nodes/images)
- [Medienverständnis](/de/nodes/media-understanding)
- [Standortbefehl](/de/nodes/location-command)
