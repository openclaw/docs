---
read_when:
    - Suche nach einem Überblick über die Medienfähigkeiten von OpenClaw
    - Entscheiden, welchen Medien-Provider Sie konfigurieren sollen
    - Verstehen, wie asynchrone Mediengenerierung funktioniert
sidebarTitle: Media overview
summary: Bild-, Video-, Musik-, Sprach- und Media-Understanding-Fähigkeiten auf einen Blick
title: Medienüberblick
x-i18n:
    generated_at: "2026-04-26T11:40:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70be8062c01f57bf53ab08aad4f1561e3958adc94e478224821d722fd500e09f
    source_path: tools/media-overview.md
    workflow: 15
---

OpenClaw generiert Bilder, Videos und Musik, versteht eingehende Medien
(Bilder, Audio, Video) und gibt Antworten per Text-to-Speech hörbar aus. Alle
Medienfähigkeiten sind Tool-gesteuert: Der Agent entscheidet je nach
Konversation, wann er sie verwendet, und jedes Tool erscheint nur dann, wenn
mindestens ein unterstützender Provider konfiguriert ist.

## Fähigkeiten

<CardGroup cols={2}>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Erstellen und bearbeiten Sie Bilder aus Text-Prompts oder Referenzbildern über
    `image_generate`. Synchron — wird inline mit der Antwort abgeschlossen.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Text-zu-Video, Bild-zu-Video und Video-zu-Video über `video_generate`.
    Asynchron — läuft im Hintergrund und sendet das Ergebnis, wenn es bereit ist.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Generieren Sie Musik oder Audiospuren über `music_generate`. Asynchron bei gemeinsamen
    Providern; der ComfyUI-Workflow-Pfad läuft synchron.
  </Card>
  <Card title="Text-to-Speech" href="/de/tools/tts" icon="microphone">
    Wandeln Sie ausgehende Antworten mit dem Tool `tts` plus
    der Konfiguration `messages.tts` in gesprochene Audiodateien um. Synchron.
  </Card>
  <Card title="Media Understanding" href="/de/nodes/media-understanding" icon="eye">
    Fassen Sie eingehende Bilder, Audio und Video mit visionfähigen Modell-
    Providern und dedizierten Media-Understanding-Plugins zusammen.
  </Card>
  <Card title="Speech-to-Text" href="/de/nodes/audio" icon="ear-listen">
    Transkribieren Sie eingehende Sprachnachrichten über Batch-STT oder
    Streaming-STT-Provider für Voice Call.
  </Card>
</CardGroup>

## Matrix der Provider-Fähigkeiten

| Provider    | Bild | Video | Musik | TTS | STT | Realtime-Sprache | Media Understanding |
| ----------- | :--: | :---: | :---: | :-: | :-: | :--------------: | :-----------------: |
| Alibaba     |      |   ✓   |       |     |     |                  |                     |
| BytePlus    |      |   ✓   |       |     |     |                  |                     |
| ComfyUI     |  ✓   |   ✓   |   ✓   |     |     |                  |                     |
| Deepgram    |      |       |       |     |  ✓  |        ✓         |                     |
| ElevenLabs  |      |       |       |  ✓  |  ✓  |                  |                     |
| fal         |  ✓   |   ✓   |       |     |     |                  |                     |
| Google      |  ✓   |   ✓   |   ✓   |  ✓  |     |        ✓         |          ✓          |
| Gradium     |      |       |       |  ✓  |     |                  |                     |
| Local CLI   |      |       |       |  ✓  |     |                  |                     |
| Microsoft   |      |       |       |  ✓  |     |                  |                     |
| MiniMax     |  ✓   |   ✓   |   ✓   |  ✓  |     |                  |                     |
| Mistral     |      |       |       |     |  ✓  |                  |                     |
| OpenAI      |  ✓   |   ✓   |       |  ✓  |  ✓  |        ✓         |          ✓          |
| Qwen        |      |   ✓   |       |     |     |                  |                     |
| Runway      |      |   ✓   |       |     |     |                  |                     |
| SenseAudio  |      |       |       |     |  ✓  |                  |                     |
| Together    |      |   ✓   |       |     |     |                  |                     |
| Vydra       |  ✓   |   ✓   |       |  ✓  |     |                  |                     |
| xAI         |  ✓   |   ✓   |       |  ✓  |  ✓  |                  |          ✓          |
| Xiaomi MiMo |  ✓   |       |       |  ✓  |     |                  |          ✓          |

<Note>
Media Understanding verwendet jedes visionfähige oder audiofähige Modell, das
in Ihrer Provider-Konfiguration registriert ist. Die obige Matrix listet Provider
mit dedizierter Unterstützung für Media Understanding auf; die meisten multimodalen LLM-Provider (Anthropic, Google,
OpenAI usw.) können eingehende Medien ebenfalls verstehen, wenn sie als aktives
Antwortmodell konfiguriert sind.
</Note>

## Asynchron vs. synchron

| Fähigkeit      | Modus        | Warum                                                              |
| -------------- | ------------ | ------------------------------------------------------------------ |
| Bild           | Synchron     | Provider-Antworten kommen in Sekunden zurück; Abschluss inline mit der Antwort. |
| Text-to-Speech | Synchron     | Provider-Antworten kommen in Sekunden zurück; wird an die Audioantwort angehängt. |
| Video          | Asynchron    | Die Verarbeitung beim Provider dauert 30 s bis mehrere Minuten.    |
| Musik (gemeinsam) | Asynchron | Dasselbe Verarbeitungsverhalten beim Provider wie bei Video.       |
| Musik (ComfyUI) | Synchron    | Der lokale Workflow läuft inline gegen den konfigurierten ComfyUI-Server. |

Bei asynchronen Tools sendet OpenClaw die Anfrage an den Provider, gibt sofort
eine Task-ID zurück und verfolgt den Auftrag im Task-Ledger. Der Agent
reagiert weiter auf andere Nachrichten, während der Auftrag läuft. Wenn der Provider fertig ist,
weckt OpenClaw den Agenten, damit er die fertigen Medien im
ursprünglichen Channel zurücksenden kann.

## Speech-to-Text und Voice Call

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio und xAI können alle eingehendes
Audio über den Batch-Pfad `tools.media.audio` transkribieren, wenn sie konfiguriert sind.
Channel-Plugins, die eine Sprachnotiz vorab für Mention-Gating oder Befehls-
Parsing prüfen, markieren den transkribierten Anhang im eingehenden Kontext, sodass der gemeinsame
Media-Understanding-Durchlauf dieses Transkript wiederverwendet, anstatt für dasselbe Audio einen zweiten
STT-Aufruf auszuführen.

Deepgram, ElevenLabs, Mistral, OpenAI und xAI registrieren auch Voice Call-
Streaming-STT-Provider, sodass Live-Telefonaudio an den ausgewählten
Anbieter weitergeleitet werden kann, ohne auf eine abgeschlossene Aufnahme zu warten.

## Provider-Zuordnungen (wie Anbieter auf Oberflächen aufgeteilt sind)

<AccordionGroup>
  <Accordion title="Google">
    Bild-, Video-, Musik-, Batch-TTS-, Backend-Realtime-Sprache- und
    Media-Understanding-Oberflächen.
  </Accordion>
  <Accordion title="OpenAI">
    Bild-, Video-, Batch-TTS-, Batch-STT-, Streaming-STT für Voice Call, Backend-
    Realtime-Sprache- und Memory-Embedding-Oberflächen.
  </Accordion>
  <Accordion title="xAI">
    Bild, Video, Suche, Code-Ausführung, Batch-TTS, Batch-STT und Streaming-STT
    für Voice Call. Realtime-Sprache von xAI ist eine Upstream-Fähigkeit, wird aber
    in OpenClaw noch nicht registriert, bis der gemeinsame Vertrag für Realtime-Sprache dies
    abbilden kann.
  </Accordion>
</AccordionGroup>

## Verwandt

- [Bildgenerierung](/de/tools/image-generation)
- [Videogenerierung](/de/tools/video-generation)
- [Musikgenerierung](/de/tools/music-generation)
- [Text-to-Speech](/de/tools/tts)
- [Media Understanding](/de/nodes/media-understanding)
- [Audio-Nodes](/de/nodes/audio)
