---
read_when:
    - Medienpipeline oder Anhänge ändern
summary: Regeln für die Bild- und Medienverarbeitung für send, Gateway und Agent-Antworten
title: Bild- und Medienunterstützung
x-i18n:
    generated_at: "2026-05-06T17:58:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 069140a3ad3bade166d4576ead604b4675006a01e546672872379ce83291471c
    source_path: nodes/images.md
    workflow: 16
---

Der WhatsApp-Kanal läuft über **Baileys Web**. Dieses Dokument beschreibt die aktuellen Regeln zur Medienverarbeitung für Senden, Gateway und Agent-Antworten.

## Ziele

- Medien mit optionalen Beschriftungen über `openclaw message send --media` senden.
- Automatische Antworten aus dem Web-Posteingang können neben Text auch Medien enthalten.
- Limits pro Typ sinnvoll und vorhersehbar halten.

## CLI-Oberfläche

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` ist optional; die Beschriftung kann für reine Medien-Sendungen leer sein.
  - `--dry-run` gibt die aufgelöste Payload aus; `--json` gibt `{ channel, to, messageId, mediaUrl, caption }` aus.

## Verhalten des WhatsApp Web-Kanals

- Eingabe: lokaler Dateipfad **oder** HTTP(S)-URL.
- Ablauf: in einen Buffer laden, Medientyp erkennen und die korrekte Payload erstellen:
  - **Bilder:** auf JPEG verkleinern und neu komprimieren (maximale Kantenlänge 2048 px) mit Zielwert `channels.whatsapp.mediaMaxMb` (Standard: 50 MB).
  - **Audio/Sprache/Video:** unverändert bis 16 MB; Audio wird als Sprachnachricht gesendet (`ptt: true`).
  - **Dokumente:** alles andere, bis 100 MB, mit beibehaltenem Dateinamen, wenn verfügbar.
- WhatsApp-Wiedergabe im GIF-Stil: MP4 mit `gifPlayback: true` senden (CLI: `--gif-playback`), damit mobile Clients es inline in Schleife abspielen.
- Die MIME-Erkennung bevorzugt Magic Bytes, dann Header, dann Dateiendung.
- Die Beschriftung stammt aus `--message` oder `reply.text`; eine leere Beschriftung ist erlaubt.
- Logging: nicht-ausführlich zeigt `↩️`/`✅`; ausführlich enthält Größe und Quellpfad/URL.

## Pipeline für automatische Antworten

- `getReplyFromConfig` gibt `{ text?, mediaUrl?, mediaUrls? }` zurück.
- Wenn Medien vorhanden sind, löst der Web-Sender lokale Pfade oder URLs über dieselbe Pipeline wie `openclaw message send` auf.
- Mehrere Medieneinträge werden, falls angegeben, nacheinander gesendet.

## Eingehende Medien an Befehle (Pi)

- Wenn eingehende Web-Nachrichten Medien enthalten, lädt OpenClaw diese in eine temporäre Datei herunter und stellt Template-Variablen bereit:
  - `{{MediaUrl}}` Pseudo-URL für das eingehende Medium.
  - `{{MediaPath}}` lokaler temporärer Pfad, der vor dem Ausführen des Befehls geschrieben wird.
- Wenn eine Docker-Sandbox pro Sitzung aktiviert ist, werden eingehende Medien in den Sandbox-Arbeitsbereich kopiert und `MediaPath`/`MediaUrl` werden in einen relativen Pfad wie `media/inbound/<filename>` umgeschrieben.
- Medienverständnis (falls über `tools.media.*` oder gemeinsame `tools.media.models` konfiguriert) läuft vor dem Templating und kann `[Image]`-, `[Audio]`- und `[Video]`-Blöcke in `Body` einfügen.
  - Audio setzt `{{Transcript}}` und verwendet das Transkript für die Befehlsanalyse, damit Slash-Befehle weiterhin funktionieren.
  - Video- und Bildbeschreibungen behalten Beschriftungstext für die Befehlsanalyse bei.
  - Wenn das aktive primäre Bildmodell bereits native Vision-Unterstützung bietet, überspringt OpenClaw den `[Image]`-Zusammenfassungsblock und übergibt stattdessen das ursprüngliche Bild an das Modell.
- Standardmäßig wird nur der erste passende Bild-/Audio-/Video-Anhang verarbeitet; setzen Sie `tools.media.<cap>.attachments`, um mehrere Anhänge zu verarbeiten.

## Limits und Fehler

**Limits für ausgehende Sendungen (WhatsApp Web-Sendung)**

- Bilder: bis zu `channels.whatsapp.mediaMaxMb` (Standard: 50 MB) nach der Neukomprimierung.
- Audio/Sprache/Video: Limit von 16 MB; Dokumente: Limit von 100 MB.
- Zu große oder nicht lesbare Medien → klare Fehlermeldung in Logs und die Antwort wird übersprungen.

**Limits für Medienverständnis (Transkription/Beschreibung)**

- Bildstandard: 10 MB (`tools.media.image.maxBytes`).
- Audiostandard: 20 MB (`tools.media.audio.maxBytes`).
- Videostandard: 50 MB (`tools.media.video.maxBytes`).
- Zu große Medien überspringen das Medienverständnis, aber Antworten werden weiterhin mit dem ursprünglichen Body gesendet.

## Hinweise für Tests

- Sende- und Antwortabläufe für Bild-/Audio-/Dokumentfälle abdecken.
- Neukomprimierung für Bilder (Größenlimit) und Sprachnachrichten-Flag für Audio validieren.
- Sicherstellen, dass Antworten mit mehreren Medien als sequenzielle Sendungen aufgefächert werden.

## Verwandt

- [Kameraaufnahme](/de/nodes/camera)
- [Medienverständnis](/de/nodes/media-understanding)
- [Audio und Sprachnachrichten](/de/nodes/audio)
