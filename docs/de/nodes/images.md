---
read_when:
    - Medien-Pipeline oder Anhänge ändern
summary: Regeln für die Bild- und Medienverarbeitung beim Senden, im Gateway und in Agent-Antworten
title: Unterstützung für Bilder und Medien
x-i18n:
    generated_at: "2026-05-06T06:54:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a38224fdf42f32fe206ad8cf3fcc3b06a078b1978d447adeb671fdb3ff4e4b32
    source_path: nodes/images.md
    workflow: 16
---

# Bild- und Medienunterstützung (2025-12-05)

Der WhatsApp-Kanal läuft über **Baileys Web**. Dieses Dokument beschreibt die aktuellen Regeln für den Umgang mit Medien beim Senden, im Gateway und in Agent-Antworten.

## Ziele

- Medien mit optionalen Bildunterschriften über `openclaw message send --media` senden.
- Auto-Antworten aus dem Web-Posteingang dürfen neben Text auch Medien enthalten.
- Grenzwerte pro Typ sinnvoll und vorhersehbar halten.

## CLI-Oberfläche

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` ist optional; die Bildunterschrift kann für reine Mediensendungen leer sein.
  - `--dry-run` gibt die aufgelöste Payload aus; `--json` gibt `{ channel, to, messageId, mediaUrl, caption }` aus.

## Verhalten des WhatsApp Web-Kanals

- Eingabe: lokaler Dateipfad **oder** HTTP(S)-URL.
- Ablauf: in einen Buffer laden, Medientyp erkennen und die passende Payload erstellen:
  - **Bilder:** Größe ändern und neu als JPEG komprimieren (maximale Seitenlänge 2048 px), ausgerichtet auf `channels.whatsapp.mediaMaxMb` (Standard: 50 MB).
  - **Audio/Sprachnachrichten/Video:** unverändert bis zu 16 MB weitergeben; Audio wird als Sprachnachricht gesendet (`ptt: true`).
  - **Dokumente:** alles andere, bis zu 100 MB, mit beibehaltenem Dateinamen, sofern verfügbar.
- GIF-artige WhatsApp-Wiedergabe: Senden Sie ein MP4 mit `gifPlayback: true` (CLI: `--gif-playback`), damit mobile Clients es inline in Schleife abspielen.
- MIME-Erkennung bevorzugt Magic Bytes, danach Header und dann die Dateiendung.
- Die Bildunterschrift stammt aus `--message` oder `reply.text`; eine leere Bildunterschrift ist erlaubt.
- Protokollierung: nicht ausführlich zeigt `↩️`/`✅`; ausführlich enthält Größe und Quellpfad/URL.

## Auto-Antwort-Pipeline

- `getReplyFromConfig` gibt `{ text?, mediaUrl?, mediaUrls? }` zurück.
- Wenn Medien vorhanden sind, löst der Web-Sender lokale Pfade oder URLs mit derselben Pipeline wie `openclaw message send` auf.
- Mehrere Medieneinträge werden, sofern angegeben, nacheinander gesendet.

## Eingehende Medien an Befehle (Pi)

- Wenn eingehende Web-Nachrichten Medien enthalten, lädt OpenClaw sie in eine temporäre Datei herunter und stellt Templating-Variablen bereit:
  - `{{MediaUrl}}` Pseudo-URL für das eingehende Medium.
  - `{{MediaPath}}` lokaler temporärer Pfad, der vor dem Ausführen des Befehls geschrieben wird.
- Wenn eine Docker-Sandbox pro Sitzung aktiviert ist, werden eingehende Medien in den Sandbox-Arbeitsbereich kopiert und `MediaPath`/`MediaUrl` in einen relativen Pfad wie `media/inbound/<filename>` umgeschrieben.
- Medienverständnis (falls über `tools.media.*` oder gemeinsame `tools.media.models` konfiguriert) wird vor dem Templating ausgeführt und kann `[Image]`-, `[Audio]`- und `[Video]`-Blöcke in `Body` einfügen.
  - Audio setzt `{{Transcript}}` und verwendet das Transkript für die Befehlsanalyse, damit Slash-Befehle weiterhin funktionieren.
  - Video- und Bildbeschreibungen behalten vorhandenen Bildunterschriftstext für die Befehlsanalyse bei.
  - Wenn das aktive primäre Bildmodell Vision bereits nativ unterstützt, überspringt OpenClaw den `[Image]`-Zusammenfassungsblock und übergibt stattdessen das Originalbild an das Modell.
- Standardmäßig wird nur der erste passende Bild-/Audio-/Videoanhang verarbeitet; setzen Sie `tools.media.<cap>.attachments`, um mehrere Anhänge zu verarbeiten.

## Grenzwerte und Fehler

**Obergrenzen für ausgehendes Senden (WhatsApp Web-Senden)**

- Bilder: bis zu `channels.whatsapp.mediaMaxMb` (Standard: 50 MB) nach der Neukomprimierung.
- Audio/Sprachnachricht/Video: Obergrenze 16 MB; Dokumente: Obergrenze 100 MB.
- Zu große oder nicht lesbare Medien → klarer Fehler in den Protokollen, und die Antwort wird übersprungen.

**Obergrenzen für Medienverständnis (Transkription/Beschreibung)**

- Bildstandard: 10 MB (`tools.media.image.maxBytes`).
- Audiostandard: 20 MB (`tools.media.audio.maxBytes`).
- Videostandard: 50 MB (`tools.media.video.maxBytes`).
- Bei zu großen Medien wird das Verständnis übersprungen, aber Antworten werden weiterhin mit dem ursprünglichen Body gesendet.

## Hinweise für Tests

- Decken Sie Sende- und Antwortflüsse für Bild-, Audio- und Dokumentfälle ab.
- Validieren Sie die Neukomprimierung für Bilder (Größenbegrenzung) und das Sprachnachricht-Flag für Audio.
- Stellen Sie sicher, dass Antworten mit mehreren Medien als sequenzielle Sendungen aufgefächert werden.

## Verwandte Themen

- [Kameraaufnahme](/de/nodes/camera)
- [Medienverständnis](/de/nodes/media-understanding)
- [Audio und Sprachnachrichten](/de/nodes/audio)
