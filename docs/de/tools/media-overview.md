---
read_when:
    - Suchen Sie nach einem Überblick über die Medienfunktionen von OpenClaw
    - Entscheiden, welcher Medien-Provider konfiguriert werden soll
    - Verstehen, wie asynchrone Mediengenerierung funktioniert
sidebarTitle: Media overview
summary: Funktionen für Bild, Video, Musik, Sprache und Medienverständnis auf einen Blick
title: Medienübersicht
x-i18n:
    generated_at: "2026-05-05T01:50:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd6b93fd79897001d24f3ba5a5c8cb9bd17281116fad17262a6389214db7059
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw generiert Bilder, Videos und Musik, versteht eingehende Medien
(Bilder, Audio, Video) und spricht Antworten per Text-to-Speech laut aus. Alle
Medienfunktionen sind toolgesteuert: Der Agent entscheidet anhand der
Unterhaltung, wann sie verwendet werden, und jedes Tool erscheint nur, wenn
mindestens ein zugrunde liegender Provider konfiguriert ist.

## Funktionen

<CardGroup cols={2}>
  <Card title="Image generation" href="/de/tools/image-generation" icon="image">
    Erstellen und bearbeiten Sie Bilder aus Text-Prompts oder Referenzbildern über
    `image_generate`. Synchron — wird inline mit der Antwort abgeschlossen.
  </Card>
  <Card title="Video generation" href="/de/tools/video-generation" icon="video">
    Text-zu-Video, Bild-zu-Video und Video-zu-Video über `video_generate`.
    Asynchron — läuft im Hintergrund und postet das Ergebnis, sobald es bereit ist.
  </Card>
  <Card title="Music generation" href="/de/tools/music-generation" icon="music">
    Generieren Sie Musik oder Audiospuren über `music_generate`. Asynchron bei gemeinsam
    genutzten Providern; der ComfyUI-Workflow-Pfad läuft synchron.
  </Card>
  <Card title="Text-to-speech" href="/de/tools/tts" icon="microphone">
    Konvertieren Sie ausgehende Antworten über das `tts`-Tool plus
    `messages.tts`-Konfiguration in gesprochene Audiodaten. Synchron.
  </Card>
  <Card title="Media understanding" href="/de/nodes/media-understanding" icon="eye">
    Fassen Sie eingehende Bilder, Audio und Video mit bildfähigen Modell-Providern
    und dedizierten Medienverständnis-Plugins zusammen.
  </Card>
  <Card title="Speech-to-text" href="/de/nodes/audio" icon="ear-listen">
    Transkribieren Sie eingehende Sprachnachrichten über Batch-STT oder Streaming-STT-Provider
    für Sprachanrufe.
  </Card>
</CardGroup>

## Provider-Funktionsmatrix

| Provider    | Bild | Video | Musik | TTS | STT | Echtzeit-Sprache | Medienverständnis |
| ----------- | :--: | :---: | :---: | :-: | :-: | :--------------: | :---------------: |
| Alibaba     |      |   ✓   |       |     |     |                  |                   |
| BytePlus    |      |   ✓   |       |     |     |                  |                   |
| ComfyUI     |  ✓   |   ✓   |   ✓   |     |     |                  |                   |
| DeepInfra   |  ✓   |   ✓   |       |  ✓  |  ✓  |                  |         ✓         |
| Deepgram    |      |       |       |     |  ✓  |        ✓         |                   |
| ElevenLabs  |      |       |       |  ✓  |  ✓  |                  |                   |
| fal         |  ✓   |   ✓   |       |     |     |                  |                   |
| Google      |  ✓   |   ✓   |   ✓   |  ✓  |     |        ✓         |         ✓         |
| Gradium     |      |       |       |  ✓  |     |                  |                   |
| Local CLI   |      |       |       |  ✓  |     |                  |                   |
| Microsoft   |      |       |       |  ✓  |     |                  |                   |
| MiniMax     |  ✓   |   ✓   |   ✓   |  ✓  |     |                  |                   |
| Mistral     |      |       |       |     |  ✓  |                  |                   |
| OpenAI      |  ✓   |   ✓   |       |  ✓  |  ✓  |        ✓         |         ✓         |
| OpenRouter  |  ✓   |   ✓   |       |  ✓  |     |                  |         ✓         |
| Qwen        |      |   ✓   |       |     |     |                  |                   |
| Runway      |      |   ✓   |       |     |     |                  |                   |
| SenseAudio  |      |       |       |     |  ✓  |                  |                   |
| Together    |      |   ✓   |       |     |     |                  |                   |
| Vydra       |  ✓   |   ✓   |       |  ✓  |     |                  |                   |
| xAI         |  ✓   |   ✓   |       |  ✓  |  ✓  |                  |         ✓         |
| Xiaomi MiMo |  ✓   |       |       |  ✓  |     |                  |         ✓         |

<Note>
Medienverständnis verwendet jedes bildfähige oder audiofähige Modell, das
in Ihrer Provider-Konfiguration registriert ist. Die obige Matrix listet Provider mit dedizierter
Unterstützung für Medienverständnis auf; die meisten multimodalen LLM-Provider (Anthropic, Google,
OpenAI usw.) können eingehende Medien ebenfalls verstehen, wenn sie als aktives
Antwortmodell konfiguriert sind.
</Note>

## Asynchron im Vergleich zu synchron

| Funktion        | Modus        | Warum                                                             |
| --------------- | ------------ | ----------------------------------------------------------------- |
| Bild            | Synchron     | Provider-Antworten kommen in Sekunden zurück; wird inline mit der Antwort abgeschlossen. |
| Text-to-Speech  | Synchron     | Provider-Antworten kommen in Sekunden zurück; an die Antwort-Audiodatei angehängt. |
| Video           | Asynchron    | Die Provider-Verarbeitung dauert 30 s bis mehrere Minuten.        |
| Musik (geteilt) | Asynchron    | Dieselbe Provider-Verarbeitungseigenschaft wie bei Video.         |
| Musik (ComfyUI) | Synchron     | Lokaler Workflow läuft inline gegen den konfigurierten ComfyUI-Server. |

Für asynchrone Tools übermittelt OpenClaw die Anfrage an den Provider, gibt sofort
eine Task-ID zurück und verfolgt den Job im Task-Ledger. Der Agent fährt fort,
auf andere Nachrichten zu antworten, während der Job läuft. Wenn der Provider fertig ist,
weckt OpenClaw den Agent mit den generierten Medienpfaden, damit er es dem
Benutzer mitteilen und, wenn es die Richtlinie für die Zustellung über die Quelle erfordert, das Ergebnis über
das Nachrichtentool weiterleiten kann.

## Speech-to-Text und Sprachanruf

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio und xAI können alle
eingehende Audiodaten über den Batch-Pfad `tools.media.audio` transkribieren, wenn sie konfiguriert sind.
Channel-Plugins, die eine Sprachnotiz für Mention-Gating oder Befehls-Parsing
vorab prüfen, markieren den transkribierten Anhang im eingehenden Kontext, sodass der gemeinsame
Medienverständnis-Durchlauf dieses Transkript wiederverwendet, anstatt einen zweiten
STT-Aufruf für dieselben Audiodaten auszuführen.

Deepgram, ElevenLabs, Mistral, OpenAI und xAI registrieren außerdem
Streaming-STT-Provider für Sprachanrufe, sodass Live-Telefonaudio an den ausgewählten
Vendor weitergeleitet werden kann, ohne auf eine abgeschlossene Aufzeichnung zu warten.

## Provider-Zuordnungen (wie Vendors auf Oberflächen verteilt sind)

<AccordionGroup>
  <Accordion title="Google">
    Oberflächen für Bild, Video, Musik, Batch-TTS, Backend-Echtzeit-Sprache und
    Medienverständnis.
  </Accordion>
  <Accordion title="OpenAI">
    Oberflächen für Bild, Video, Batch-TTS, Batch-STT, Streaming-STT für Sprachanrufe, Backend-
    Echtzeit-Sprache und Memory-Embedding.
  </Accordion>
  <Accordion title="DeepInfra">
    Oberflächen für Chat-/Modell-Routing, Bildgenerierung/-bearbeitung, Text-zu-Video, Batch-TTS,
    Batch-STT, Bild-Medienverständnis und Memory-Embedding.
    DeepInfra-native Modelle für Reranking/Klassifikation/Objekterkennung werden nicht
    registriert, bis OpenClaw dedizierte Provider-Verträge für diese
    Kategorien hat.
  </Accordion>
  <Accordion title="xAI">
    Bild, Video, Suche, Codeausführung, Batch-TTS, Batch-STT und Streaming-STT für Sprachanrufe.
    xAI Realtime Voice ist eine Upstream-Funktion, wird in OpenClaw aber
    erst registriert, wenn der gemeinsame Vertrag für Echtzeit-Sprache sie
    darstellen kann.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Bildgenerierung](/de/tools/image-generation)
- [Videogenerierung](/de/tools/video-generation)
- [Musikgenerierung](/de/tools/music-generation)
- [Text-to-Speech](/de/tools/tts)
- [Medienverständnis](/de/nodes/media-understanding)
- [Audio-Knoten](/de/nodes/audio)
