---
read_when:
    - Suchen Sie nach einer Übersicht über die Medienfunktionen von OpenClaw
    - Entscheiden, welcher Medien-Provider konfiguriert werden soll
    - Verstehen, wie asynchrone Mediengenerierung funktioniert
sidebarTitle: Media overview
summary: Funktionen für Bild, Video, Musik, Sprache und Medienverständnis auf einen Blick
title: Medienübersicht
x-i18n:
    generated_at: "2026-04-30T07:19:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9f40e4fb86832438ae99dd2dc42da93c41937541314d95486c97c210dfef508
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw generiert Bilder, Videos und Musik, versteht eingehende Medien
(Bilder, Audio, Video) und spricht Antworten per Text-to-Speech laut aus. Alle
Medienfunktionen sind toolgesteuert: Der Agent entscheidet anhand der
Konversation, wann sie verwendet werden, und jedes Tool erscheint nur, wenn
mindestens ein unterstützender Provider konfiguriert ist.

## Fähigkeiten

<CardGroup cols={2}>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Erstellen und bearbeiten Sie Bilder aus Text-Prompts oder Referenzbildern über
    `image_generate`. Synchron — wird inline mit der Antwort abgeschlossen.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Text-zu-Video, Bild-zu-Video und Video-zu-Video über `video_generate`.
    Asynchron — läuft im Hintergrund und sendet das Ergebnis, sobald es bereit ist.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Generieren Sie Musik oder Audiospuren über `music_generate`. Asynchron bei gemeinsam genutzten
    Providern; der ComfyUI-Workflow-Pfad läuft synchron.
  </Card>
  <Card title="Text-to-Speech" href="/de/tools/tts" icon="microphone">
    Wandeln Sie ausgehende Antworten über das Tool `tts` plus
    `messages.tts`-Konfiguration in gesprochene Audiodaten um. Synchron.
  </Card>
  <Card title="Medienverständnis" href="/de/nodes/media-understanding" icon="eye">
    Fassen Sie eingehende Bilder, Audio und Video mit vision-fähigen Modell-
    Providern und dedizierten Medienverständnis-Plugins zusammen.
  </Card>
  <Card title="Speech-to-Text" href="/de/nodes/audio" icon="ear-listen">
    Transkribieren Sie eingehende Sprachnachrichten über Batch-STT oder Voice Call-
    Streaming-STT-Provider.
  </Card>
</CardGroup>

## Provider-Fähigkeitsmatrix

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
| Lokale CLI  |      |       |       |  ✓  |     |                  |                   |
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
Medienverständnis verwendet jedes vision-fähige oder audiofähige Modell, das
in Ihrer Provider-Konfiguration registriert ist. Die Matrix oben listet Provider
mit dedizierter Medienverständnis-Unterstützung auf; die meisten multimodalen
LLM-Provider (Anthropic, Google, OpenAI usw.) können eingehende Medien ebenfalls
verstehen, wenn sie als aktives Antwortmodell konfiguriert sind.
</Note>

## Asynchron vs. synchron

| Fähigkeit       | Modus       | Warum                                                             |
| --------------- | ----------- | ----------------------------------------------------------------- |
| Bild            | Synchron    | Provider-Antworten werden in Sekunden zurückgegeben; Abschluss inline mit der Antwort. |
| Text-to-Speech  | Synchron    | Provider-Antworten werden in Sekunden zurückgegeben; an das Antwortaudio angehängt. |
| Video           | Asynchron   | Die Provider-Verarbeitung dauert 30 s bis mehrere Minuten.        |
| Musik (geteilt) | Asynchron   | Gleiche Provider-Verarbeitungseigenschaft wie bei Video.          |
| Musik (ComfyUI) | Synchron    | Lokaler Workflow läuft inline gegen den konfigurierten ComfyUI-Server. |

Für asynchrone Tools sendet OpenClaw die Anfrage an den Provider, gibt sofort
eine Aufgaben-ID zurück und verfolgt den Job im Aufgaben-Ledger. Der Agent
antwortet weiter auf andere Nachrichten, während der Job läuft. Wenn der
Provider fertig ist, weckt OpenClaw den Agent, damit er die fertigen Medien
zurück in den ursprünglichen Kanal posten kann.

## Speech-to-Text und Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio und xAI können alle
eingehendes Audio über den Batch-Pfad `tools.media.audio` transkribieren, wenn sie konfiguriert sind.
Kanal-Plugins, die eine Sprachnotiz für Mention-Gating oder Befehlsparsing
vorab prüfen, markieren den transkribierten Anhang im eingehenden Kontext, sodass der gemeinsame
Medienverständnis-Durchlauf dieses Transkript wiederverwendet, statt einen zweiten
STT-Aufruf für dasselbe Audio auszuführen.

Deepgram, ElevenLabs, Mistral, OpenAI und xAI registrieren außerdem Voice Call-
Streaming-STT-Provider, sodass Live-Telefonaudio an den ausgewählten
Vendor weitergeleitet werden kann, ohne auf eine abgeschlossene Aufnahme zu warten.

## Provider-Zuordnungen (wie Vendors Oberflächen aufteilen)

<AccordionGroup>
  <Accordion title="Google">
    Bild-, Video-, Musik-, Batch-TTS-, Backend-Echtzeit-Sprache- und
    Medienverständnis-Oberflächen.
  </Accordion>
  <Accordion title="OpenAI">
    Bild-, Video-, Batch-TTS-, Batch-STT-, Voice Call-Streaming-STT-, Backend-
    Echtzeit-Sprache- und Memory-Embedding-Oberflächen.
  </Accordion>
  <Accordion title="DeepInfra">
    Chat-/Modell-Routing, Bildgenerierung/-bearbeitung, Text-zu-Video, Batch-TTS,
    Batch-STT, Bild-Medienverständnis und Memory-Embedding-Oberflächen.
    DeepInfra-native Rerank-, Klassifizierungs- und Objekterkennungsmodelle werden nicht
    registriert, bis OpenClaw dedizierte Provider-Verträge für diese
    Kategorien hat.
  </Accordion>
  <Accordion title="xAI">
    Bild, Video, Suche, Codeausführung, Batch-TTS, Batch-STT und Voice
    Call-Streaming-STT. xAI Realtime Voice ist eine Upstream-Fähigkeit, wird aber
    in OpenClaw nicht registriert, bis der gemeinsame Echtzeit-Sprachvertrag sie
    abbilden kann.
  </Accordion>
</AccordionGroup>

## Verwandt

- [Bildgenerierung](/de/tools/image-generation)
- [Videogenerierung](/de/tools/video-generation)
- [Musikgenerierung](/de/tools/music-generation)
- [Text-to-Speech](/de/tools/tts)
- [Medienverständnis](/de/nodes/media-understanding)
- [Audioknoten](/de/nodes/audio)
