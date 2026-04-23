---
read_when:
    - Sie suchen nach einer Übersicht über Medienfähigkeiten.
    - Entscheiden, welcher Medien-Provider konfiguriert werden soll
    - Verstehen, wie asynchrone Mediengenerierung funktioniert
summary: Einheitliche Landingpage für Mediengenerierung, Medienverständnis und Sprachfähigkeiten
title: Medienübersicht
x-i18n:
    generated_at: "2026-04-23T06:36:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 999ed1c58a6d80c4bd6deef6e2dbf55b253c0dee3eb974ed212ca2fa91ec445e
    source_path: tools/media-overview.md
    workflow: 15
---

# Mediengenerierung und Medienverständnis

OpenClaw erzeugt Bilder, Videos und Musik, versteht eingehende Medien (Bilder, Audio, Video) und spricht Antworten mit Text-to-Speech laut aus. Alle Medienfähigkeiten sind toolgesteuert: Der Agent entscheidet anhand der Unterhaltung, wann er sie verwendet, und jedes Tool erscheint nur dann, wenn mindestens ein unterstützender Provider konfiguriert ist.

## Fähigkeiten auf einen Blick

| Fähigkeit            | Tool             | Provider                                                                                     | Was es tut                                              |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Bildgenerierung      | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Erstellt oder bearbeitet Bilder aus Text-Prompts oder Referenzen |
| Videogenerierung     | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Erstellt Videos aus Text, Bildern oder vorhandenen Videos |
| Musikgenerierung     | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Erstellt Musik oder Audiospuren aus Text-Prompts        |
| Text-to-Speech (TTS) | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                  | Wandelt ausgehende Antworten in gesprochene Audiodaten um |
| Medienverständnis    | (automatisch)    | Jeder modellbasierte Provider mit Vision- oder Audio-Fähigkeit sowie CLI-Fallbacks          | Fasst eingehende Bilder, Audiodaten und Videos zusammen |

## Matrix der Provider-Fähigkeiten

Diese Tabelle zeigt, welche Provider welche Medienfähigkeiten auf der gesamten Plattform unterstützen.

| Provider   | Bild | Video | Musik | TTS | STT / Transkription | Medienverständnis |
| ---------- | ---- | ----- | ----- | --- | ------------------- | ----------------- |
| Alibaba    |      | Ja    |       |     |                     |                   |
| BytePlus   |      | Ja    |       |     |                     |                   |
| ComfyUI    | Ja   | Ja    | Ja    |     |                     |                   |
| Deepgram   |      |       |       |     | Ja                  |                   |
| ElevenLabs |      |       |       | Ja  | Ja                  |                   |
| fal        | Ja   | Ja    |       |     |                     |                   |
| Google     | Ja   | Ja    | Ja    |     |                     | Ja                |
| Microsoft  |      |       |       | Ja  |                     |                   |
| MiniMax    | Ja   | Ja    | Ja    | Ja  |                     |                   |
| Mistral    |      |       |       |     | Ja                  |                   |
| OpenAI     | Ja   | Ja    |       | Ja  | Ja                  | Ja                |
| Qwen       |      | Ja    |       |     |                     |                   |
| Runway     |      | Ja    |       |     |                     |                   |
| Together   |      | Ja    |       |     |                     |                   |
| Vydra      | Ja   | Ja    |       |     |                     |                   |
| xAI        | Ja   | Ja    |       | Ja  | Ja                  | Ja                |

<Note>
Medienverständnis verwendet jedes registrierte Modell mit Vision- oder Audio-Fähigkeit in Ihrer Provider-Konfiguration. Die obige Tabelle hebt Provider mit dedizierter Unterstützung für Medienverständnis hervor; die meisten LLM-Provider mit multimodalen Modellen (Anthropic, Google, OpenAI usw.) können auch eingehende Medien verstehen, wenn sie als aktives Antwortmodell konfiguriert sind.
</Note>

## Wie asynchrone Generierung funktioniert

Video- und Musikgenerierung laufen als Hintergrundaufgaben, weil die Verarbeitung durch Provider typischerweise 30 Sekunden bis mehrere Minuten dauert. Wenn der Agent `video_generate` oder `music_generate` aufruft, übermittelt OpenClaw die Anfrage an den Provider, gibt sofort eine Aufgaben-ID zurück und verfolgt den Job im Aufgabenverzeichnis. Der Agent antwortet weiter auf andere Nachrichten, während der Job läuft. Wenn der Provider fertig ist, weckt OpenClaw den Agenten, damit er die fertigen Medien wieder im ursprünglichen Channel posten kann. Bildgenerierung und TTS sind synchron und werden inline mit der Antwort abgeschlossen.

Deepgram, ElevenLabs, Mistral, OpenAI und xAI können alle eingehende
Audiodaten über den Batch-Pfad `tools.media.audio` transkribieren, wenn sie konfiguriert sind. Deepgram,
ElevenLabs, Mistral, OpenAI und xAI registrieren außerdem STT-Provider für Voice Call Streaming, sodass Live-Telefonaudio an den ausgewählten Anbieter weitergeleitet werden kann,
ohne auf eine abgeschlossene Aufnahme zu warten.

OpenAI wird auf die Oberflächen für Bild, Video, Batch-TTS, Batch-STT, STT-Streaming
für Voice Call, Echtzeit-Sprache und Memory-Embeddings von OpenClaw abgebildet. xAI wird derzeit
auf die Oberflächen für Bild, Video, Suche, Code-Ausführung, Batch-TTS, Batch-STT
und STT-Streaming für Voice Call von OpenClaw abgebildet. xAI Realtime voice ist eine Upstream-
Fähigkeit, wird aber in OpenClaw erst registriert, wenn der gemeinsame Vertrag für
Echtzeit-Sprache sie abbilden kann.

## Schnelllinks

- [Bildgenerierung](/de/tools/image-generation) -- Bilder erzeugen und bearbeiten
- [Videogenerierung](/de/tools/video-generation) -- Text-zu-Video, Bild-zu-Video und Video-zu-Video
- [Musikgenerierung](/de/tools/music-generation) -- Musik und Audiospuren erstellen
- [Text-to-Speech](/de/tools/tts) -- Antworten in gesprochene Audiodaten umwandeln
- [Medienverständnis](/de/nodes/media-understanding) -- eingehende Bilder, Audiodaten und Videos verstehen
