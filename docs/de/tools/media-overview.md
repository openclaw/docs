---
read_when:
    - Suchen Sie nach einem Überblick über die Medienfunktionen von OpenClaw
    - Entscheiden, welcher Medien-Provider konfiguriert werden soll
    - Verstehen, wie asynchrone Mediengenerierung funktioniert
sidebarTitle: Media overview
summary: Bild-, Video-, Musik-, Sprach- und Medienverständnis-Funktionen auf einen Blick
title: Medienübersicht
x-i18n:
    generated_at: "2026-06-27T18:19:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c04beb60abbd06d1503302be144e633b526ae55435f061fbb94f6fef85ca9d66
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw generiert Bilder, Videos und Musik, versteht eingehende Medien
(Bilder, Audio, Video) und spricht Antworten per Text-to-Speech laut aus. Alle
Medienfunktionen sind toolgesteuert: Der Agent entscheidet anhand der
Unterhaltung, wann er sie verwendet, und jedes Tool erscheint nur, wenn
mindestens ein unterstützender Provider konfiguriert ist.

Live-Sprache verwendet den Talk-Sitzungsvertrag statt des einmaligen
Medientool-Pfads. Talk hat drei Modi: provider-natives `realtime`, lokales oder
streamendes `stt-tts` und `transcription` für reine beobachtende Spracherfassung.
Diese Modi teilen sich Provider-Kataloge, Ereignis-Umschläge und
Abbruchsemantik mit Telefonie, Meetings, Browser-Echtzeit und nativen
Push-to-Talk-Clients.

## Fähigkeiten

<CardGroup cols={2}>
  <Card title="Image generation" href="/de/tools/image-generation" icon="image">
    Erstellen und bearbeiten Sie Bilder aus Text-Prompts oder Referenzbildern
    über `image_generate`. Asynchron in Chatsitzungen – läuft im Hintergrund
    und postet das Ergebnis, sobald es bereit ist.
  </Card>
  <Card title="Video generation" href="/de/tools/video-generation" icon="video">
    Text-zu-Video, Bild-zu-Video und Video-zu-Video über `video_generate`.
    Asynchron – läuft im Hintergrund und postet das Ergebnis, sobald es bereit ist.
  </Card>
  <Card title="Music generation" href="/de/tools/music-generation" icon="music">
    Generieren Sie Musik oder Audiospuren über `music_generate`. Asynchron in
    Chatsitzungen im gemeinsamen Aufgabenlebenszyklus für Mediengenerierung.
  </Card>
  <Card title="Text-to-speech" href="/de/tools/tts" icon="microphone">
    Wandeln Sie ausgehende Antworten über das `tts`-Tool plus
    `messages.tts`-Konfiguration in gesprochene Audiodaten um. Synchron.
  </Card>
  <Card title="Media understanding" href="/de/nodes/media-understanding" icon="eye">
    Fassen Sie eingehende Bilder, Audio und Video mit visionsfähigen
    Modell-Providern und dedizierten Medienverständnis-Plugins zusammen.
  </Card>
  <Card title="Speech-to-text" href="/de/nodes/audio" icon="ear-listen">
    Transkribieren Sie eingehende Sprachnachrichten über Batch-STT oder
    streamende STT-Provider für Voice Call.
  </Card>
</CardGroup>

## Provider-Fähigkeitsmatrix

| Provider          | Bild | Video | Musik | TTS | STT | Echtzeit-Sprache | Medienverständnis |
| ----------------- | :--: | :---: | :---: | :-: | :-: | :--------------: | :---------------: |
| Alibaba           |      |   ✓   |       |     |     |                  |                   |
| BytePlus          |      |   ✓   |       |     |     |                  |                   |
| ComfyUI           |  ✓   |   ✓   |   ✓   |     |     |                  |                   |
| DeepInfra         |  ✓   |   ✓   |       |  ✓  |  ✓  |                  |         ✓         |
| Deepgram          |      |       |       |     |  ✓  |        ✓         |                   |
| ElevenLabs        |      |       |       |  ✓  |  ✓  |                  |                   |
| fal               |  ✓   |   ✓   |   ✓   |     |     |                  |                   |
| Google            |  ✓   |   ✓   |   ✓   |  ✓  |     |        ✓         |         ✓         |
| Gradium           |      |       |       |  ✓  |     |                  |                   |
| Local CLI         |      |       |       |  ✓  |     |                  |                   |
| Microsoft         |      |       |       |  ✓  |     |                  |                   |
| Microsoft Foundry |  ✓   |       |       |     |     |                  |                   |
| MiniMax           |  ✓   |   ✓   |   ✓   |  ✓  |     |                  |                   |
| Mistral           |      |       |       |     |  ✓  |                  |                   |
| OpenAI            |  ✓   |   ✓   |       |  ✓  |  ✓  |        ✓         |         ✓         |
| OpenRouter        |  ✓   |   ✓   |   ✓   |  ✓  |  ✓  |                  |         ✓         |
| Qwen              |      |   ✓   |       |     |     |                  |                   |
| Runway            |      |   ✓   |       |     |     |                  |                   |
| SenseAudio        |      |       |       |     |  ✓  |                  |                   |
| Together          |      |   ✓   |       |     |     |                  |                   |
| Vydra             |  ✓   |   ✓   |       |  ✓  |     |                  |                   |
| xAI               |  ✓   |   ✓   |       |  ✓  |  ✓  |                  |         ✓         |
| Xiaomi MiMo       |  ✓   |       |       |  ✓  |     |                  |         ✓         |

<Note>
Medienverständnis verwendet jedes visionsfähige oder audiofähige Modell, das in
Ihrer Provider-Konfiguration registriert ist. Die obige Matrix listet Provider
mit dedizierter Unterstützung für Medienverständnis auf; die meisten
multimodalen LLM-Provider (Anthropic, Google, OpenAI usw.) können eingehende
Medien ebenfalls verstehen, wenn sie als aktives Antwortmodell konfiguriert sind.
</Note>

## Asynchron vs. synchron

| Fähigkeit      | Modus      | Warum                                                                                               |
| -------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| Bild           | Asynchron  | Die Provider-Verarbeitung kann länger dauern als eine Chat-Runde; generierte Anhänge verwenden den gemeinsamen Abschlusspfad. |
| Text-to-Speech | Synchron   | Provider-Antworten kehren in Sekunden zurück; sie werden an das Antwortaudio angehängt.             |
| Video          | Asynchron  | Die Provider-Verarbeitung dauert 30 s bis mehrere Minuten; langsame Warteschlangen können bis zum konfigurierten Timeout laufen. |
| Musik          | Asynchron  | Dieselbe Provider-Verarbeitungscharakteristik wie bei Video.                                        |

Bei asynchronen Tools übermittelt OpenClaw die Anfrage an den Provider, gibt
sofort eine Aufgaben-ID zurück und verfolgt den Job im Aufgaben-Ledger. Der
Agent antwortet weiter auf andere Nachrichten, während der Job läuft. Wenn der
Provider fertig ist, weckt OpenClaw den Agent mit den generierten Medienpfaden,
damit er den Benutzer über den normalen sichtbaren Antwortmodus der Sitzung
informieren kann: automatische Zustellung der finalen Antwort, wenn
konfiguriert, oder `message(action="send")`, wenn die Sitzung das Nachrichtentool
erfordert. Wenn die anfragende Sitzung inaktiv ist oder ihr aktives Wake
fehlschlägt und in der Abschlussantwort noch generierte Medien fehlen, sendet
OpenClaw einen idempotenten direkten Fallback nur mit den fehlenden Medien.
Medien, die bereits durch die Abschlussantwort zugestellt wurden, werden nicht
erneut gepostet.

## Speech-to-Text und Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio und xAI können alle
eingehendes Audio über den Batch-Pfad `tools.media.audio` transkribieren, wenn
sie konfiguriert sind. Channel-Plugins, die eine Sprachnotiz für Mention-Gating
oder Befehlsparsing vorab prüfen, markieren den transkribierten Anhang im
eingehenden Kontext, sodass der gemeinsame Medienverständnis-Durchlauf dieses
Transkript wiederverwendet, statt einen zweiten STT-Aufruf für dasselbe Audio
auszuführen.

Deepgram, ElevenLabs, Mistral, OpenAI und xAI registrieren außerdem streamende
STT-Provider für Voice Call, sodass Live-Telefonaudio an den ausgewählten
Vendor weitergeleitet werden kann, ohne auf eine abgeschlossene Aufnahme zu warten.

Für Live-Unterhaltungen mit Benutzern bevorzugen Sie den [Talk-Modus](/de/nodes/talk).
Batch-Audioanhänge bleiben auf dem Medienpfad; Browser-Echtzeit, natives
Push-to-Talk, Telefonie und Meeting-Audio sollten Talk-Ereignisse und die vom
Gateway zurückgegebenen sitzungsbezogenen Kataloge verwenden.

## Provider-Zuordnungen (wie Vendors Oberflächen aufteilen)

<AccordionGroup>
  <Accordion title="Google">
    Bild-, Video-, Musik-, Batch-TTS-, Backend-Echtzeitsprach- und
    Medienverständnis-Oberflächen.
  </Accordion>
  <Accordion title="OpenAI">
    Bild-, Video-, Batch-TTS-, Batch-STT-, Voice-Call-Streaming-STT-,
    Backend-Echtzeitsprach- und Memory-Embedding-Oberflächen.
  </Accordion>
  <Accordion title="DeepInfra">
    Chat-/Modell-Routing, Bildgenerierung/-bearbeitung, Text-zu-Video,
    Batch-TTS, Batch-STT, Bild-Medienverständnis und Memory-Embedding-Oberflächen.
    DeepInfra-native Re-Ranking-, Klassifizierungs- und Objekterkennungsmodelle
    werden erst registriert, wenn OpenClaw dedizierte Provider-Verträge für
    diese Kategorien hat.
  </Accordion>
  <Accordion title="xAI">
    Bild, Video, Suche, Codeausführung, Batch-TTS, Batch-STT und
    Voice-Call-Streaming-STT. xAI-Echtzeit-Sprache ist eine Upstream-Fähigkeit,
    wird aber in OpenClaw erst registriert, wenn der gemeinsame Vertrag für
    Echtzeit-Sprache sie abbilden kann.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Bildgenerierung](/de/tools/image-generation)
- [Videogenerierung](/de/tools/video-generation)
- [Musikgenerierung](/de/tools/music-generation)
- [Text-to-Speech](/de/tools/tts)
- [Medienverständnis](/de/nodes/media-understanding)
- [Audio-Nodes](/de/nodes/audio)
- [Talk-Modus](/de/nodes/talk)
