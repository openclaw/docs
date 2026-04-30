---
read_when:
    - Medien-Pipeline oder Anhänge ändern
summary: Regeln für die Bild- und Medienverarbeitung beim Senden sowie für Gateway- und Agenten-Antworten
title: Unterstützung für Bilder und Medien
x-i18n:
    generated_at: "2026-04-30T07:02:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb07bc638a755be5597e78c07041a52cfc0297b00d70c5adbfe5f3ad8c1a372
    source_path: nodes/images.md
    workflow: 16
---

# Unterstützung für Bilder und Medien (2025-12-05)

Der WhatsApp-Kanal läuft über **Baileys Web**. Dieses Dokument beschreibt die aktuellen Regeln für die Medienverarbeitung beim Senden, im Gateway und bei Agent-Antworten.

## Ziele

- Medien mit optionalen Beschriftungen über `openclaw message send --media` senden.
- Automatische Antworten aus dem Web-Posteingang sollen Medien zusammen mit Text enthalten können.
- Limits pro Typ sinnvoll und vorhersehbar halten.

## CLI-Oberfläche

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` ist optional; die Beschriftung kann für reine Mediensendungen leer sein.
  - `--dry-run` gibt die aufgelöste Payload aus; `--json` gibt `{ channel, to, messageId, mediaUrl, caption }` aus.

## Verhalten des WhatsApp Web-Kanals

- Eingabe: lokaler Dateipfad **oder** HTTP(S)-URL.
- Ablauf: in einen Buffer laden, Medientyp erkennen und die richtige Payload erstellen:
  - **Bilder:** auf JPEG verkleinern und neu komprimieren (maximale Seite 2048 px), ausgerichtet auf `channels.whatsapp.mediaMaxMb` (Standard: 50 MB).
  - **Audio/Sprachnachrichten/Video:** unverändert bis 16 MB; Audio wird als Sprachnachricht gesendet (`ptt: true`).
  - **Dokumente:** alles andere, bis 100 MB, mit beibehaltenem Dateinamen, sofern verfügbar.
- GIF-artige Wiedergabe in WhatsApp: MP4 mit `gifPlayback: true` senden (CLI: `--gif-playback`), damit mobile Clients inline in einer Schleife abspielen.
- MIME-Erkennung bevorzugt Magic Bytes, dann Header, dann Dateiendung.
- Die Beschriftung stammt aus `--message` oder `reply.text`; eine leere Beschriftung ist erlaubt.
- Protokollierung: nicht ausführlich zeigt `↩️`/`✅`; ausführlich enthält Größe und Quellpfad/URL.

## Pipeline für automatische Antworten

- `getReplyFromConfig` gibt `{ text?, mediaUrl?, mediaUrls? }` zurück.
- Wenn Medien vorhanden sind, löst der Web-Sender lokale Pfade oder URLs mit derselben Pipeline wie `openclaw message send` auf.
- Mehrere Medieneinträge werden, falls angegeben, nacheinander gesendet.

## Eingehende Medien für Befehle (Pi)

- Wenn eingehende Web-Nachrichten Medien enthalten, lädt OpenClaw sie in eine temporäre Datei herunter und stellt Template-Variablen bereit:
  - `{{MediaUrl}}` Pseudo-URL für das eingehende Medium.
  - `{{MediaPath}}` lokaler temporärer Pfad, der vor dem Ausführen des Befehls geschrieben wird.
- Wenn eine Docker-Sandbox pro Sitzung aktiviert ist, werden eingehende Medien in den Sandbox-Arbeitsbereich kopiert und `MediaPath`/`MediaUrl` in einen relativen Pfad wie `media/inbound/<filename>` umgeschrieben.
- Medienverständnis (falls über `tools.media.*` oder gemeinsame `tools.media.models` konfiguriert) läuft vor dem Templating und kann `[Image]`-, `[Audio]`- und `[Video]`-Blöcke in `Body` einfügen.
  - Audio setzt `{{Transcript}}` und verwendet das Transkript für die Befehlsanalyse, damit Slash-Befehle weiterhin funktionieren.
  - Video- und Bildbeschreibungen behalten etwaigen Beschriftungstext für die Befehlsanalyse bei.
  - Wenn das aktive primäre Bildmodell bereits nativ Vision unterstützt, überspringt OpenClaw den `[Image]`-Zusammenfassungsblock und übergibt stattdessen das Originalbild an das Modell.
- Standardmäßig wird nur der erste passende Bild-/Audio-/Video-Anhang verarbeitet; setzen Sie `tools.media.<cap>.attachments`, um mehrere Anhänge zu verarbeiten.

## Limits und Fehler

**Limits für ausgehendes Senden (WhatsApp-Web-Senden)**

- Bilder: bis zu `channels.whatsapp.mediaMaxMb` (Standard: 50 MB) nach der Neukomprimierung.
- Audio/Sprachnachrichten/Video: Limit 16 MB; Dokumente: Limit 100 MB.
- Zu große oder nicht lesbare Medien → klarer Fehler in den Protokollen, und die Antwort wird übersprungen.

**Limits für Medienverständnis (Transkription/Beschreibung)**

- Bildstandard: 10 MB (`tools.media.image.maxBytes`).
- Audiostandard: 20 MB (`tools.media.audio.maxBytes`).
- Videostandard: 50 MB (`tools.media.video.maxBytes`).
- Zu große Medien überspringen das Verständnis, aber Antworten werden weiterhin mit dem ursprünglichen Body gesendet.

## Hinweise für Tests

- Sende- und Antwortabläufe für Bild-, Audio- und Dokumentfälle abdecken.
- Neukomprimierung für Bilder (Größenbegrenzung) und Sprachnachricht-Flag für Audio validieren.
- Sicherstellen, dass Antworten mit mehreren Medien als sequenzielle Sendungen aufgefächert werden.

## Verwandte Themen

- [Kameraaufnahme](/de/nodes/camera)
- [Medienverständnis](/de/nodes/media-understanding)
- [Audio und Sprachnachrichten](/de/nodes/audio)
