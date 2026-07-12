---
read_when:
    - Medien-Pipeline oder Anhänge ändern
summary: Regeln für die Verarbeitung von Bildern und Medien bei Sendevorgängen sowie Gateway- und Agentenantworten
title: Unterstützung für Bilder und Medien
x-i18n:
    generated_at: "2026-07-12T01:48:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

Der WhatsApp-Kanal basiert auf Baileys Web. Diese Seite beschreibt die Regeln zur Medienverarbeitung beim Senden, im Gateway und bei Agentenantworten.

## Ziele

- Medien mit einer optionalen Bildunterschrift über `openclaw message send --media` senden.
- Automatische Antworten aus dem Web-Posteingang dürfen Medien zusammen mit Text enthalten.
- Sinnvolle und vorhersehbare Grenzwerte je Medientyp beibehalten.

## CLI-Oberfläche

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — Medien anhängen (Bild/Audio/Video/Dokument); akzeptiert lokale Pfade oder URLs. Optional; bei Sendungen, die nur Medien enthalten, darf die Bildunterschrift leer sein.
- `--gif-playback` — Videomedien als GIF-Wiedergabe behandeln (nur WhatsApp).
- `--force-document` — Medien als Dokument senden, um die Komprimierung durch den Kanal zu vermeiden (Telegram, WhatsApp); gilt für Bilder, GIFs und Videos.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — Zustellungs- und Thread-Optionen, die auch für reine Textsendungen gelten.
- `--dry-run` — die aufgelöste Nutzlast ausgeben und das Senden überspringen.
- `--json` — das Ergebnis als JSON ausgeben: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload` enthält das kanalspezifische Sendeergebnis einschließlich etwaiger Medienreferenzen).

## Verhalten des WhatsApp-Web-Kanals

- Eingabe: lokaler Dateipfad **oder** HTTP(S)-URL.
- Ablauf: in einen Puffer laden, Medientyp erkennen und anschließend die ausgehende Nutzlast je nach Typ erstellen:
  - **Bilder:** werden so optimiert, dass sie unter `channels.whatsapp.mediaMaxMb` bleiben (Standardwert: 50 MB). Bilder ohne Transparenz werden erneut als JPEG komprimiert (die Standardstaffel für die Seitenlänge beginnt bei 2048 px und wird bei wiederholtem Überschreiten der Größenbegrenzung schrittweise reduziert); Bilder mit Transparenz bleiben im PNG-Format. Wenn die Quelle bereits ein geeignetes JPEG-, PNG- oder WebP-Bild innerhalb des Größen- und Seitenlängenbudgets ist, werden die ursprünglichen Bytes unverändert beibehalten, statt das Bild erneut zu komprimieren. Animierte GIFs werden niemals neu kodiert, sondern nur auf ihre Größe geprüft.
  - **Audio/Sprachnachrichten:** Sofern das Audio nicht bereits in einem nativen Sprachnachrichtenformat vorliegt (`.ogg`/`.opus` oder `audio/ogg`/`audio/opus`), wird ausgehendes Audio vor dem Senden über `ffmpeg` in Opus/OGG transkodiert (48 kHz, mono, 64 kbit/s, auf 20 Minuten begrenzt) und als Sprachnachricht (`ptt: true`) gesendet.
  - **Video:** unveränderte Weiterleitung bis zu 16 MB.
  - **Dokumente:** alle anderen Inhalte bis zu 100 MB; der Dateiname bleibt erhalten, sofern verfügbar.
- GIF-artige Wiedergabe in WhatsApp: Senden Sie eine MP4-Datei mit `gifPlayback: true` (CLI: `--gif-playback`), damit mobile Clients sie eingebettet in einer Schleife wiedergeben.
- Bei der MIME-Erkennung haben erkannte Magic Bytes Vorrang, gefolgt von der Dateiendung und anschließend den Antwort-Headern; ein generisch erkannter Container (`application/octet-stream`, `zip`) überschreibt niemals eine spezifischere Zuordnung anhand der Dateiendung (zum Beispiel XLSX statt ZIP).
- Die Bildunterschrift stammt aus `--message` oder `reply.text`; eine leere Bildunterschrift ist zulässig.
- Protokollierung: Ohne ausführliche Ausgabe werden `↩️`/`✅` angezeigt; die ausführliche Ausgabe enthält Größe und Quellpfad beziehungsweise Quell-URL.

<Note>
Die oben genannten Grenzwerte von 16 MB für Audio/Video und 100 MB für Dokumente sind die gemeinsamen Standardwerte je Medientyp, wenn keine explizite Bytegrenze übergeben wird. Beim Senden über WhatsApp wird ein expliziter Grenzwert aus `channels.whatsapp.mediaMaxMb` festgelegt (Standardwert: 50 MB), der für dieses Konto einheitlich für alle Medientypen gilt.
</Note>

## Pipeline für automatische Antworten

- `getReplyFromConfig` gibt eine Antwortnutzlast (oder ein Array von Nutzlasten) zurück, die neben anderen Feldern `text?`, `mediaUrl?` und `mediaUrls?` enthält.
- Wenn Medien vorhanden sind, löst der Web-Sender lokale Pfade oder URLs über dieselbe Pipeline wie `openclaw message send` auf.
- Mehrere Medieneinträge werden, sofern vorhanden, nacheinander gesendet.

## Eingehende Medien für Befehle

- Wenn eingehende Web-Nachrichten Medien enthalten, lädt OpenClaw diese in eine temporäre Datei herunter und stellt Vorlagenvariablen bereit:
  - `{{MediaUrl}}` — Pseudo-URL für das eingehende Medium.
  - `{{MediaPath}}` — lokaler temporärer Pfad, der vor der Ausführung des Befehls geschrieben wird.
- Wenn eine sitzungsbezogene Docker-Sandbox aktiviert ist, werden eingehende Medien in den Arbeitsbereich der Sandbox kopiert und `MediaPath`/`MediaUrl` in einen sandboxrelativen Pfad wie `media/inbound/<filename>` umgeschrieben.
- Die Medienanalyse (konfiguriert über `tools.media.*` oder das gemeinsame `tools.media.models`) wird vor der Vorlagenverarbeitung ausgeführt und kann `[Image]`-, `[Audio]`- und `[Video]`-Blöcke in `Body` einfügen.
  - Bei Audio wird `{{Transcript}}` gesetzt und das Transkript für die Befehlsanalyse verwendet, damit Slash-Befehle weiterhin funktionieren.
  - Video- und Bildbeschreibungen behalten vorhandenen Begleittext für die Befehlsanalyse bei.
  - Wenn das aktive primäre Modell bereits nativ Bilder verarbeiten kann, überspringt OpenClaw den `[Image]`-Zusammenfassungsblock und übergibt stattdessen das Originalbild an das Modell.
- Standardmäßig wird nur der erste passende Bild-, Audio- oder Videoanhang verarbeitet; legen Sie `tools.media.<capability>.attachments` fest, um mehrere Anhänge zu verarbeiten.

## Grenzwerte und Fehler

**Grenzwerte für ausgehende Sendungen (WhatsApp-Web-Versand)**

- Bilder: nach der Optimierung bis zu `channels.whatsapp.mediaMaxMb` (Standardwert: 50 MB).
- Audio/Video: Grenzwert von 16 MB (gemeinsamer Standardwert; beim Senden über WhatsApp durch `mediaMaxMb` überschrieben).
- Dokumente: Grenzwert von 100 MB (gemeinsamer Standardwert; beim Senden über WhatsApp durch `mediaMaxMb` überschrieben).
- Zu große oder nicht lesbare Medien führen zu einer eindeutigen Fehlermeldung in den Protokollen, und die Antwort wird übersprungen.

**Grenzwerte für die Medienanalyse (Transkription/Beschreibung)**

- Standardwert für Bilder: 10 MB (`tools.media.image.maxBytes`).
- Standardwert für Audio: 20 MB (`tools.media.audio.maxBytes`).
- Standardwert für Video: 50 MB (`tools.media.video.maxBytes`).
- Bei zu großen Medien wird die Analyse übersprungen, die Antwort wird jedoch weiterhin mit dem ursprünglichen Textkörper gesendet.

## Hinweise für Tests

- Sende- und Antwortabläufe für Bilder, Audio und Dokumente abdecken.
- Größengrenzen nach der Bildoptimierung und das Sprachnachrichten-Flag für Audio überprüfen.
- Sicherstellen, dass Antworten mit mehreren Medien als aufeinanderfolgende Sendungen aufgefächert werden.

## Verwandte Themen

- [Kameraaufnahme](/de/nodes/camera)
- [Medienanalyse](/de/nodes/media-understanding)
- [Audio und Sprachnachrichten](/de/nodes/audio)
