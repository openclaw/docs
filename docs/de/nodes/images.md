---
read_when:
    - Medien-Pipeline oder Anhänge ändern
summary: Regeln für den Umgang mit Bildern und Medien bei Sendungen, Gateway- und Agent-Antworten
title: Bild- und Medienunterstützung
x-i18n:
    generated_at: "2026-06-27T17:40:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeee181cae2798b7d0f5dbe0331c6b09612755b4d796d98baaeaf6989955def5
    source_path: nodes/images.md
    workflow: 16
---

Der WhatsApp-Kanal läuft über **Baileys Web**. Dieses Dokument beschreibt die aktuellen Regeln zur Medienverarbeitung für Senden, Gateway und Agentenantworten.

## Ziele

- Medien mit optionalen Beschriftungen über `openclaw message send --media` senden.
- Automatische Antworten aus dem Web-Posteingang dürfen Medien zusammen mit Text enthalten.
- Grenzwerte pro Typ sinnvoll und vorhersehbar halten.

## CLI-Oberfläche

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` ist optional; die Beschriftung kann bei reinen Mediensendungen leer sein.
  - `--dry-run` gibt die aufgelöste Nutzlast aus; `--json` gibt `{ channel, to, messageId, mediaUrl, caption }` aus.

## Verhalten des WhatsApp-Web-Kanals

- Eingabe: lokaler Dateipfad **oder** HTTP(S)-URL.
- Ablauf: in einen Buffer laden, Medientyp erkennen und die korrekte Nutzlast erstellen:
  - **Bilder:** auf JPEG skalieren und neu komprimieren (maximale Seite 2048px), ausgerichtet auf `channels.whatsapp.mediaMaxMb` (Standard: 50 MB).
  - **Audio/Sprache/Video:** Durchleitung bis 16 MB; Audio wird als Sprachnachricht gesendet (`ptt: true`).
  - **Dokumente:** alles andere, bis 100 MB, mit beibehaltenem Dateinamen, sofern verfügbar.
- WhatsApp-Wiedergabe im GIF-Stil: ein MP4 mit `gifPlayback: true` senden (CLI: `--gif-playback`), damit mobile Clients es inline in Schleife abspielen.
- Die MIME-Erkennung bevorzugt Magic Bytes, dann Header, dann die Dateiendung.
- Die Beschriftung stammt aus `--message` oder `reply.text`; eine leere Beschriftung ist zulässig.
- Protokollierung: Nicht ausführlich zeigt `↩️`/`✅`; ausführlich enthält Größe und Quellpfad/URL.

## Pipeline für automatische Antworten

- `getReplyFromConfig` gibt `{ text?, mediaUrl?, mediaUrls? }` zurück.
- Wenn Medien vorhanden sind, löst der Web-Sender lokale Pfade oder URLs mit derselben Pipeline wie `openclaw message send` auf.
- Mehrere Medieneinträge werden, falls angegeben, nacheinander gesendet.

## Eingehende Medien für Befehle

- Wenn eingehende Web-Nachrichten Medien enthalten, lädt OpenClaw sie in eine temporäre Datei herunter und stellt Template-Variablen bereit:
  - `{{MediaUrl}}` Pseudo-URL für das eingehende Medium.
  - `{{MediaPath}}` lokaler temporärer Pfad, der vor dem Ausführen des Befehls geschrieben wird.
- Wenn eine Docker-Sandbox pro Sitzung aktiviert ist, werden eingehende Medien in den Sandbox-Arbeitsbereich kopiert und `MediaPath`/`MediaUrl` in einen relativen Pfad wie `media/inbound/<filename>` umgeschrieben.
- Medienverständnis (falls über `tools.media.*` oder das gemeinsame `tools.media.models` konfiguriert) läuft vor dem Templating und kann `[Image]`-, `[Audio]`- und `[Video]`-Blöcke in `Body` einfügen.
  - Audio setzt `{{Transcript}}` und verwendet das Transkript für die Befehlsauswertung, damit Slash-Befehle weiterhin funktionieren.
  - Video- und Bildbeschreibungen behalten jeglichen Beschriftungstext für die Befehlsauswertung bei.
  - Wenn das aktive primäre Bildmodell Vision bereits nativ unterstützt, überspringt OpenClaw den `[Image]`-Zusammenfassungsblock und übergibt stattdessen das Originalbild an das Modell.
- Standardmäßig wird nur der erste passende Bild-/Audio-/Video-Anhang verarbeitet; setzen Sie `tools.media.<cap>.attachments`, um mehrere Anhänge zu verarbeiten.

## Grenzwerte und Fehler

**Obergrenzen für ausgehendes Senden (WhatsApp-Web-Senden)**

- Bilder: bis zu `channels.whatsapp.mediaMaxMb` (Standard: 50 MB) nach der Neukomprimierung.
- Audio/Sprache/Video: Obergrenze 16 MB; Dokumente: Obergrenze 100 MB.
- Zu große oder nicht lesbare Medien → klarer Fehler in den Logs, und die Antwort wird übersprungen.

**Obergrenzen für Medienverständnis (Transkription/Beschreibung)**

- Bildstandard: 10 MB (`tools.media.image.maxBytes`).
- Audiostandard: 20 MB (`tools.media.audio.maxBytes`).
- Videostandard: 50 MB (`tools.media.video.maxBytes`).
- Bei zu großen Medien wird das Verständnis übersprungen, aber Antworten werden weiterhin mit dem ursprünglichen Body verarbeitet.

## Hinweise für Tests

- Sende- und Antwortabläufe für Bild-, Audio- und Dokumentfälle abdecken.
- Neukomprimierung für Bilder (Größenbegrenzung) und Sprachnachricht-Flag für Audio validieren.
- Sicherstellen, dass Antworten mit mehreren Medien als sequenzielle Sendungen aufgefächert werden.

## Verwandt

- [Kameraaufnahme](/de/nodes/camera)
- [Medienverständnis](/de/nodes/media-understanding)
- [Audio und Sprachnachrichten](/de/nodes/audio)
