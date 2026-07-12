---
read_when:
    - Medien-Pipeline oder Anhänge ändern
summary: Regeln für die Verarbeitung von Bildern und Medien bei Send-, Gateway- und Agentenantworten
title: Bild- und Medienunterstützung
x-i18n:
    generated_at: "2026-07-12T15:36:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

Der WhatsApp-Kanal basiert auf Baileys Web. Diese Seite beschreibt die Regeln für die Medienverarbeitung beim Senden, im Gateway und bei Agentenantworten.

## Ziele

- Medien mit einer optionalen Beschriftung über `openclaw message send --media` senden.
- Automatische Antworten aus dem Web-Posteingang dürfen neben Text auch Medien enthalten.
- Sinnvolle und vorhersehbare Grenzwerte für jeden Medientyp beibehalten.

## CLI-Oberfläche

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — hängt Medien an (Bild/Audio/Video/Dokument); akzeptiert lokale Pfade oder URLs. Optional; bei Sendungen, die nur Medien enthalten, kann die Beschriftung leer sein.
- `--gif-playback` — behandelt Videomedien als GIF-Wiedergabe (nur WhatsApp).
- `--force-document` — sendet Medien als Dokument, um die Komprimierung durch den Kanal zu vermeiden (Telegram, WhatsApp); gilt für Bilder, GIFs und Videos.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — Zustellungs- und Thread-Optionen, die auch für Sendungen gelten, die nur Text enthalten.
- `--dry-run` — gibt die aufgelöste Nutzlast aus und überspringt das Senden.
- `--json` — gibt das Ergebnis als JSON aus: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload` enthält das kanalspezifische Sendeergebnis einschließlich etwaiger Medienreferenzen).

## Verhalten des WhatsApp-Web-Kanals

- Eingabe: lokaler Dateipfad **oder** HTTP(S)-URL.
- Ablauf: in einen Puffer laden, Medienart erkennen und anschließend die ausgehende Nutzlast entsprechend der Art erstellen:
  - **Bilder:** werden so optimiert, dass sie unter `channels.whatsapp.mediaMaxMb` (Standardwert 50MB) bleiben. Undurchsichtige Bilder werden erneut als JPEG komprimiert (die standardmäßige Abstufung der Seitenlängen beginnt bei 2048px und wird bei wiederholter Überschreitung der Größenbegrenzung reduziert); Bilder mit Transparenz bleiben PNG-Dateien. Wenn die Quelle bereits ein zulässiges JPEG/PNG/WebP innerhalb der Grenzwerte für Größe und Seitenlänge ist, bleiben die ursprünglichen Bytes unverändert erhalten, statt erneut komprimiert zu werden. Animierte GIFs werden niemals neu codiert, sondern nur auf ihre Größe geprüft.
  - **Audio/Sprache:** Sofern es sich nicht bereits um natives Sprachaudio (`.ogg`/`.opus` oder `audio/ogg`/`audio/opus`) handelt, wird ausgehendes Audio vor dem Senden als Sprachnachricht (`ptt: true`) über `ffmpeg` in Opus/OGG transcodiert (48kHz Mono, 64kbps, auf 20 Minuten begrenzt).
  - **Video:** unveränderte Weiterleitung bis 16MB.
  - **Dokumente:** alles andere bis 100MB; der Dateiname bleibt erhalten, sofern verfügbar.
- GIF-ähnliche Wiedergabe in WhatsApp: Senden Sie eine MP4-Datei mit `gifPlayback: true` (CLI: `--gif-playback`), damit mobile Clients sie in einer Endlosschleife direkt im Nachrichtenverlauf wiedergeben.
- Bei der MIME-Erkennung haben erkannte magische Bytes Vorrang, gefolgt von der Dateierweiterung und anschließend den Antwort-Headern; ein generisch erkannter Container (`application/octet-stream`, `zip`) überschreibt niemals eine spezifischere Zuordnung anhand der Dateierweiterung (beispielsweise XLSX gegenüber ZIP).
- Die Beschriftung stammt aus `--message` oder `reply.text`; eine leere Beschriftung ist zulässig.
- Protokollierung: Im nicht ausführlichen Modus werden `↩️`/`✅` angezeigt; der ausführliche Modus enthält Größe und Quellpfad/-URL.

<Note>
Die oben genannten Werte von 16MB für Audio/Video und 100MB für Dokumente sind die gemeinsamen Standardwerte je Medienart, wenn keine explizite Begrenzung in Bytes übergeben wird. WhatsApp-Sendungen legen über `channels.whatsapp.mediaMaxMb` (Standardwert 50MB) eine explizite Begrenzung fest, die für dieses Konto einheitlich für alle Medienarten gilt.
</Note>

## Pipeline für automatische Antworten

- `getReplyFromConfig` gibt eine Antwortnutzlast (oder ein Array von Nutzlasten) zurück, die neben anderen Feldern `text?`, `mediaUrl?` und `mediaUrls?` enthält.
- Wenn Medien vorhanden sind, löst die Web-Sendekomponente lokale Pfade oder URLs mit derselben Pipeline wie `openclaw message send` auf.
- Mehrere Medieneinträge werden, sofern vorhanden, nacheinander gesendet.

## Eingehende Medien für Befehle

- Wenn eingehende Webnachrichten Medien enthalten, lädt OpenClaw diese in eine temporäre Datei herunter und stellt Vorlagenvariablen bereit:
  - `{{MediaUrl}}` — Pseudo-URL für das eingehende Medium.
  - `{{MediaPath}}` — lokaler temporärer Pfad, der vor der Ausführung des Befehls geschrieben wird.
- Wenn eine sitzungsspezifische Docker-Sandbox aktiviert ist, werden eingehende Medien in den Arbeitsbereich der Sandbox kopiert und `MediaPath`/`MediaUrl` in einen Sandbox-relativen Pfad wie `media/inbound/<filename>` umgeschrieben.
- Die Medienanalyse (konfiguriert über `tools.media.*` oder die gemeinsamen `tools.media.models`) wird vor der Vorlagenverarbeitung ausgeführt und kann `[Image]`-, `[Audio]`- und `[Video]`-Blöcke in `Body` einfügen.
  - Bei Audio wird `{{Transcript}}` gesetzt und das Transkript für die Befehlsanalyse verwendet, sodass Slash-Befehle weiterhin funktionieren.
  - Bei Video- und Bildbeschreibungen bleibt vorhandener Beschriftungstext für die Befehlsanalyse erhalten.
  - Wenn das aktive primäre Modell bereits nativ Bilder unterstützt, überspringt OpenClaw den `[Image]`-Zusammenfassungsblock und übergibt stattdessen das Originalbild an das Modell.
- Standardmäßig wird nur der erste passende Bild-, Audio- oder Videoanhang verarbeitet; legen Sie `tools.media.<capability>.attachments` fest, um mehrere Anhänge zu verarbeiten.

## Grenzwerte und Fehler

**Grenzwerte für ausgehende Sendungen (WhatsApp-Webversand)**

- Bilder: nach der Optimierung bis zu `channels.whatsapp.mediaMaxMb` (Standardwert 50MB).
- Audio/Video: Begrenzung auf 16MB (gemeinsamer Standardwert; beim Senden über WhatsApp durch `mediaMaxMb` überschrieben).
- Dokumente: Begrenzung auf 100MB (gemeinsamer Standardwert; beim Senden über WhatsApp durch `mediaMaxMb` überschrieben).
- Zu große oder nicht lesbare Medien erzeugen einen eindeutigen Fehler in den Protokollen und die Antwort wird übersprungen.

**Grenzwerte für die Medienanalyse (Transkription/Beschreibung)**

- Standardwert für Bilder: 10MB (`tools.media.image.maxBytes`).
- Standardwert für Audio: 20MB (`tools.media.audio.maxBytes`).
- Standardwert für Video: 50MB (`tools.media.video.maxBytes`).
- Bei zu großen Medien wird die Analyse übersprungen, die Antwort wird jedoch weiterhin mit dem ursprünglichen Textkörper verarbeitet.

## Hinweise für Tests

- Sende- und Antwortabläufe für Bilder, Audio und Dokumente abdecken.
- Größengrenzen nach der Bildoptimierung und das Sprachnachrichten-Flag für Audio überprüfen.
- Sicherstellen, dass Antworten mit mehreren Medien in aufeinanderfolgende Sendungen aufgefächert werden.

## Verwandte Themen

- [Kameraaufnahme](/de/nodes/camera)
- [Medienanalyse](/de/nodes/media-understanding)
- [Audio und Sprachnachrichten](/de/nodes/audio)
