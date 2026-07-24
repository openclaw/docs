---
read_when:
    - Medien-Pipeline oder Anhänge ändern
summary: Regeln für die Bild- und Medienverarbeitung bei Sendevorgängen, Gateway- und Agentenantworten
title: Bild- und Medienunterstützung
x-i18n:
    generated_at: "2026-07-24T04:29:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aae23eb4afb408b168d169703c931303fbc2de17909166e73b23ef194aa22617
    source_path: nodes/images.md
    workflow: 16
---

Der WhatsApp-Kanal basiert auf Baileys Web. Diese Seite behandelt die Regeln zur Medienverarbeitung beim Senden sowie für Gateway- und Agentenantworten.

## Ziele

- Medien mit einer optionalen Beschriftung über `openclaw message send --media` senden.
- Automatische Antworten aus dem Web-Posteingang dürfen Medien zusammen mit Text enthalten.
- Sinnvolle und vorhersehbare Grenzwerte je Medientyp beibehalten.

## CLI-Oberfläche

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — Medien anhängen (Bild/Audio/Video/Dokument); akzeptiert lokale Pfade oder URLs. Optional; bei Sendungen, die nur Medien enthalten, kann die Beschriftung leer sein.
- `--gif-playback` — Videomedien als GIF wiedergeben (nur WhatsApp).
- `--force-document` — Medien als Dokument senden, um die Komprimierung durch den Kanal zu vermeiden (Telegram, WhatsApp); gilt für Bilder, GIFs und Videos.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — Zustellungs- und Threading-Optionen, die auch für reine Textsendungen gelten.
- `--dry-run` — die aufgelöste Nutzlast ausgeben und den Versand überspringen.
- `--json` — das Ergebnis als JSON ausgeben: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload` enthält das kanalspezifische Sendeergebnis einschließlich etwaiger Medienreferenzen).

## Verhalten des WhatsApp-Web-Kanals

- Eingabe: lokaler Dateipfad **oder** HTTP(S)-URL.
- Ablauf: in einen Puffer laden, den Medientyp erkennen und anschließend die ausgehende Nutzlast je nach Typ erstellen:
  - **Bilder:** werden so optimiert, dass sie unter `channels.whatsapp.mediaMaxMb` bleiben (Standard: 50MB). Undurchsichtige Bilder werden erneut als JPEG komprimiert (die standardmäßige Abstufung der Seitenlänge beginnt bei 2048px und wird bei wiederholter Überschreitung der Größe reduziert); Bilder mit Transparenz bleiben im PNG-Format. Wenn die Quelle bereits ein zulässiges JPEG/PNG/WebP innerhalb der Grenzwerte für Größe und Seitenlänge ist, bleiben die Originalbytes unverändert erhalten, statt erneut komprimiert zu werden. Animierte GIFs werden niemals neu codiert, sondern nur auf ihre Größe geprüft.
  - **Audio/Sprachnachrichten:** Sofern ausgehendes Audio nicht bereits in einem nativen Sprachnachrichtenformat vorliegt (`.ogg`/`.opus` oder `audio/ogg`/`audio/opus`), wird es vor dem Versand als Sprachnachricht (`ptt: true`) über `ffmpeg` in Opus/OGG transcodiert (48kHz Mono, 64kbps, auf 20 Minuten begrenzt).
  - **Video:** unveränderte Weiterleitung bis zu 16MB.
  - **Dokumente:** alles andere bis zu 100MB; der Dateiname bleibt erhalten, sofern verfügbar.
- GIF-ähnliche Wiedergabe in WhatsApp: Ein MP4 mit `gifPlayback: true` senden (CLI: `--gif-playback`), damit mobile Clients es eingebettet in einer Schleife wiedergeben.
- Bei der MIME-Erkennung haben erkannte Magic Bytes Vorrang, gefolgt von der Dateierweiterung und anschließend den Antwort-Headern; ein generisch erkannter Container (`application/octet-stream`, `zip`) überschreibt niemals eine spezifischere Zuordnung anhand der Erweiterung (beispielsweise XLSX gegenüber ZIP).
- Die Beschriftung stammt aus `--message` oder `reply.text`; eine leere Beschriftung ist zulässig.
- Protokollierung: Ohne ausführliche Ausgabe werden `↩️`/`✅` angezeigt; die ausführliche Ausgabe enthält Größe und Quellpfad/-URL.

<Note>
Die oben genannten Werte von 16MB für Audio/Video und 100MB für Dokumente sind die gemeinsamen Standardgrenzwerte je Medientyp, wenn keine explizite Byte-Obergrenze übergeben wird. Für WhatsApp-Sendungen wird eine explizite Obergrenze aus `channels.whatsapp.mediaMaxMb` festgelegt (Standard: 50MB), die für dieses Konto einheitlich für alle Medientypen gilt.
</Note>

## Pipeline für automatische Antworten

- `getReplyFromConfig` gibt eine Antwortnutzlast (oder ein Array von Nutzlasten) zurück, die neben weiteren Feldern `text?`, `mediaUrl?` und `mediaUrls?` enthält.
- Wenn Medien vorhanden sind, löst der Web-Sender lokale Pfade oder URLs mit derselben Pipeline wie `openclaw message send` auf.
- Mehrere Medieneinträge werden, sofern vorhanden, nacheinander gesendet.

## Eingehende Medien für Befehle

- Wenn eingehende Webnachrichten Medien enthalten, lädt OpenClaw sie in eine temporäre Datei herunter und stellt Vorlagenvariablen bereit:
  - `{{MediaUrl}}` — Pseudo-URL für das eingehende Medium.
  - `{{MediaPath}}` — lokaler temporärer Pfad, der vor der Ausführung des Befehls geschrieben wird.
- Wenn eine sitzungsspezifische Docker-Sandbox aktiviert ist, werden eingehende Medien in den Arbeitsbereich der Sandbox kopiert und `MediaPath`/`MediaUrl` in einen sandboxrelativen Pfad wie `media/inbound/<filename>` umgeschrieben.
- Die Medienanalyse (konfiguriert über `tools.media.*` oder das gemeinsame `tools.media.models`) wird vor der Vorlagenverarbeitung ausgeführt und kann Blöcke vom Typ `[Image]`, `[Audio]` und `[Video]` in `Body` einfügen.
  - Bei Audio wird `{{Transcript}}` gesetzt und das Transkript für die Befehlsanalyse verwendet, sodass Slash-Befehle weiterhin funktionieren.
  - Video- und Bildbeschreibungen bewahren etwaigen Beschriftungstext für die Befehlsanalyse.
  - Wenn das aktive primäre Modell bereits nativ visuelle Eingaben unterstützt, überspringt OpenClaw den Zusammenfassungsblock `[Image]` und übergibt stattdessen das Originalbild an das Modell.
- Standardmäßig wird nur der erste passende Bild-, Audio- oder Videoanhang verarbeitet; verwenden Sie `tools.media.<capability>.attachments`, um mehrere Anhänge auszuwählen.

## Grenzwerte und Fehler

**Obergrenzen für ausgehende Sendungen (WhatsApp-Webversand)**

- Bilder: nach der Optimierung bis zu `channels.whatsapp.mediaMaxMb` (Standard: 50MB).
- Audio/Video: Obergrenze von 16MB (gemeinsamer Standard; beim Versand über WhatsApp durch `mediaMaxMb` überschrieben).
- Dokumente: Obergrenze von 100MB (gemeinsamer Standard; beim Versand über WhatsApp durch `mediaMaxMb` überschrieben).
- Zu große oder nicht lesbare Medien erzeugen einen eindeutigen Fehler in den Protokollen und die Antwort wird übersprungen.

**Grenzwerte der Medienanalyse (Transkription/Beschreibung)**

- Standard für Bilder: 10MB (mit `tools.media.image.maxBytes` oder je
  `tools.media.models[]`-Eintrag mit `maxBytes` überschreibbar).
- Standard für Audio: 20MB (mit `tools.media.audio.maxBytes` oder je Eintrag überschreibbar).
- Standard für Video: 50MB (mit `tools.media.video.maxBytes` oder je Eintrag überschreibbar).
- Bei zu großen Medien wird die Analyse übersprungen, die Antwort wird jedoch weiterhin mit dem ursprünglichen Nachrichtentext verarbeitet.

## Hinweise für Tests

- Sende- und Antwortabläufe für Bilder, Audio und Dokumente abdecken.
- Größengrenzen nach der Bildoptimierung sowie das Sprachnachrichten-Flag für Audio überprüfen.
- Sicherstellen, dass Antworten mit mehreren Medien in einzelne aufeinanderfolgende Sendungen aufgefächert werden.

## Verwandte Themen

- [Kameraaufnahme](/de/nodes/camera)
- [Medienanalyse](/de/nodes/media-understanding)
- [Audio und Sprachnachrichten](/de/nodes/audio)
