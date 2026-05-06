---
read_when:
    - Hinzufügen oder Ändern der Kameraaufnahme auf iOS-/Android-Nodes oder macOS
    - Erweiterung agentenzugänglicher MEDIA-Workflows für temporäre Dateien
summary: 'Kameraaufnahme (iOS-/Android-Knoten + macOS-App) zur Verwendung durch Agenten: Fotos (jpg) und kurze Videoclips (mp4)'
title: Kameraaufnahme
x-i18n:
    generated_at: "2026-05-06T06:54:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 226b9f44e8d56b9b366d679c6c2f974c714afc4cb962afddba89d17dcdfc09eb
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw unterstützt **Kameraaufnahmen** für Agent-Workflows:

- **iOS-Node** (gekoppelt über Gateway): Erfassen Sie ein **Foto** (`jpg`) oder einen **kurzen Videoclip** (`mp4`, mit optionalem Audio) über `node.invoke`.
- **Android-Node** (gekoppelt über Gateway): Erfassen Sie ein **Foto** (`jpg`) oder einen **kurzen Videoclip** (`mp4`, mit optionalem Audio) über `node.invoke`.
- **macOS-App** (Node über Gateway): Erfassen Sie ein **Foto** (`jpg`) oder einen **kurzen Videoclip** (`mp4`, mit optionalem Audio) über `node.invoke`.

Jeder Kamerazugriff ist durch **benutzergesteuerte Einstellungen** geschützt.

## iOS-Node

### Benutzereinstellung (standardmäßig aktiviert)

- iOS-Tab „Einstellungen“ → **Kamera** → **Kamera erlauben** (`camera.enabled`)
  - Standard: **aktiviert** (ein fehlender Schlüssel wird als aktiviert behandelt).
  - Wenn deaktiviert: `camera.*`-Befehle geben `CAMERA_DISABLED` zurück.

### Befehle (über Gateway `node.invoke`)

- `camera.list`
  - Antwort-Payload:
    - `devices`: Array von `{ id, name, position, deviceType }`

- `camera.snap`
  - Parameter:
    - `facing`: `front|back` (Standard: `front`)
    - `maxWidth`: Zahl (optional; Standard `1600` auf dem iOS-Node)
    - `quality`: `0..1` (optional; Standard `0.9`)
    - `format`: derzeit `jpg`
    - `delayMs`: Zahl (optional; Standard `0`)
    - `deviceId`: Zeichenfolge (optional; aus `camera.list`)
  - Antwort-Payload:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Payload-Schutz: Fotos werden neu komprimiert, damit der base64-Payload unter 5 MB bleibt.

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

### Anforderung an den Vordergrund

Wie `canvas.*` erlaubt der iOS-Node `camera.*`-Befehle nur im **Vordergrund**. Aufrufe im Hintergrund geben `NODE_BACKGROUND_UNAVAILABLE` zurück.

### CLI-Helfer (temporäre Dateien + MEDIA)

Der einfachste Weg, Anhänge zu erhalten, ist der CLI-Helfer. Er schreibt dekodierte Medien in eine temporäre Datei und gibt `MEDIA:<path>` aus.

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

## Android-Node

### Android-Benutzereinstellung (standardmäßig aktiviert)

- Android-Einstellungsbereich → **Kamera** → **Kamera erlauben** (`camera.enabled`)
  - Standard: **aktiviert** (ein fehlender Schlüssel wird als aktiviert behandelt).
  - Wenn deaktiviert: `camera.*`-Befehle geben `CAMERA_DISABLED` zurück.

### Berechtigungen

- Android erfordert Laufzeitberechtigungen:
  - `CAMERA` für sowohl `camera.snap` als auch `camera.clip`.
  - `RECORD_AUDIO` für `camera.clip`, wenn `includeAudio=true`.

Wenn Berechtigungen fehlen, fordert die App sie nach Möglichkeit an; bei Ablehnung schlagen `camera.*`-Anfragen mit einem
`*_PERMISSION_REQUIRED`-Fehler fehl.

### Android-Anforderung an den Vordergrund

Wie `canvas.*` erlaubt der Android-Node `camera.*`-Befehle nur im **Vordergrund**. Aufrufe im Hintergrund geben `NODE_BACKGROUND_UNAVAILABLE` zurück.

### Android-Befehle (über Gateway `node.invoke`)

- `camera.list`
  - Antwort-Payload:
    - `devices`: Array von `{ id, name, position, deviceType }`

### Payload-Schutz

Fotos werden neu komprimiert, damit der base64-Payload unter 5 MB bleibt.

## macOS-App

### Benutzereinstellung (standardmäßig deaktiviert)

Die macOS-Begleit-App stellt ein Kontrollkästchen bereit:

- **Einstellungen → Allgemein → Kamera erlauben** (`openclaw.cameraEnabled`)
  - Standard: **deaktiviert**
  - Wenn deaktiviert: Kameraanfragen geben „Kamera vom Benutzer deaktiviert“ zurück.

### CLI-Helfer (Node-Aufruf)

Verwenden Sie die Haupt-CLI `openclaw`, um Kamerabefehle auf dem macOS-Node aufzurufen.

Beispiele:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Hinweise:

- `openclaw nodes camera snap` verwendet standardmäßig `maxWidth=1600`, sofern nicht überschrieben.
- Unter macOS wartet `camera.snap` nach dem Aufwärmen/Einpendeln der Belichtung `delayMs` (standardmäßig 2000 ms), bevor die Aufnahme erfolgt.
- Foto-Payloads werden neu komprimiert, damit base64 unter 5 MB bleibt.

## Sicherheit + praktische Grenzen

- Kamera- und Mikrofonzugriff lösen die üblichen Berechtigungsaufforderungen des Betriebssystems aus (und erfordern Verwendungsbeschreibungen in Info.plist).
- Videoclips sind begrenzt (derzeit `<= 60s`), um übergroße Node-Payloads zu vermeiden (base64-Overhead + Nachrichtenlimits).

## macOS-Bildschirmvideo (auf Betriebssystemebene)

Für _Bildschirm_-Video (nicht Kamera) verwenden Sie die macOS-Begleit-App:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

Hinweise:

- Erfordert die macOS-Berechtigung **Bildschirmaufnahme** (TCC).

## Verwandte Themen

- [Bild- und Medienunterstützung](/de/nodes/images)
- [Medienverständnis](/de/nodes/media-understanding)
- [Standortbefehl](/de/nodes/location-command)
