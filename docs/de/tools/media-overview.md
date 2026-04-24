---
read_when:
    - Suchen Sie nach einer Übersicht über Medienfunktionen
    - Entscheiden, welchen Medienanbieter Sie konfigurieren möchten
    - Verstehen, wie die asynchrone Mediengenerierung funktioniert
summary: Einheitliche Landingpage für Mediengenerierung, Verständnis und Sprachfunktionen
title: Medienübersicht
x-i18n:
    generated_at: "2026-04-24T09:51:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39848c6104ebd4feeb37b233b70f3312fa076b535c3b3780336729eb9fdfa4e6
    source_path: tools/media-overview.md
    workflow: 15
---

# Mediengenerierung und Medienverständnis

OpenClaw erzeugt Bilder, Videos und Musik, versteht eingehende Medien (Bilder, Audio, Video) und gibt Antworten per Text-to-Speech laut wieder. Alle Medienfunktionen sind toolgesteuert: Der Agent entscheidet anhand des Gesprächs, wann sie verwendet werden, und jedes Tool erscheint nur, wenn mindestens ein zugrunde liegender Anbieter konfiguriert ist.

## Funktionen auf einen Blick

| Funktion             | Tool             | Anbieter                                                                                    | Was es macht                                          |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Bildgenerierung      | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                           | Erstellt oder bearbeitet Bilder aus Text-Prompts oder Referenzen |
| Videogenerierung     | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Erstellt Videos aus Text, Bildern oder vorhandenen Videos |
| Musikgenerierung     | `music_generate` | ComfyUI, Google, MiniMax                                                                    | Erstellt Musik oder Audiospuren aus Text-Prompts      |
| Text-to-Speech (TTS) | `tts`            | ElevenLabs, Google, Microsoft, MiniMax, OpenAI, xAI                                         | Wandelt ausgehende Antworten in gesprochene Audiodaten um |
| Medienverständnis    | (automatisch)    | Jeder vision- oder audiofähige Modellanbieter sowie CLI-Fallbacks                           | Fasst eingehende Bilder, Audiodaten und Videos zusammen |

## Matrix der Anbieterfunktionen

Diese Tabelle zeigt, welche Anbieter welche Medienfunktionen auf der gesamten Plattform unterstützen.

| Anbieter   | Bild | Video | Musik | TTS | STT / Transkription | Echtzeitstimme | Medienverständnis |
| ---------- | ---- | ----- | ----- | --- | ------------------- | -------------- | ----------------- |
| Alibaba    |      | Ja    |       |     |                     |                |                   |
| BytePlus   |      | Ja    |       |     |                     |                |                   |
| ComfyUI    | Ja   | Ja    | Ja    |     |                     |                |                   |
| Deepgram   |      |       |       |     | Ja                  |                |                   |
| ElevenLabs |      |       |       | Ja  | Ja                  |                |                   |
| fal        | Ja   | Ja    |       |     |                     |                |                   |
| Google     | Ja   | Ja    | Ja    | Ja  |                     | Ja             | Ja                |
| Microsoft  |      |       |       | Ja  |                     |                |                   |
| MiniMax    | Ja   | Ja    | Ja    | Ja  |                     |                |                   |
| Mistral    |      |       |       |     | Ja                  |                |                   |
| OpenAI     | Ja   | Ja    |       | Ja  | Ja                  | Ja             | Ja                |
| Qwen       |      | Ja    |       |     |                     |                |                   |
| Runway     |      | Ja    |       |     |                     |                |                   |
| Together   |      | Ja    |       |     |                     |                |                   |
| Vydra      | Ja   | Ja    |       |     |                     |                |                   |
| xAI        | Ja   | Ja    |       | Ja  | Ja                  |                | Ja                |

<Note>
Medienverständnis verwendet jeden visionsfähigen oder audiofähigen Modellanbieter, der in Ihrer Anbieterkonfiguration registriert ist. Die obige Tabelle hebt Anbieter mit dedizierter Unterstützung für Medienverständnis hervor; die meisten LLM-Anbieter mit multimodalen Modellen (Anthropic, Google, OpenAI usw.) können bei entsprechender Konfiguration eingehende Medien ebenfalls verstehen, wenn sie als aktives Antwortmodell konfiguriert sind.
</Note>

## So funktioniert die asynchrone Generierung

Video- und Musikgenerierung laufen als Hintergrundaufgaben, da die Verarbeitung durch den Anbieter typischerweise 30 Sekunden bis mehrere Minuten dauert. Wenn der Agent `video_generate` oder `music_generate` aufruft, sendet OpenClaw die Anfrage an den Anbieter, gibt sofort eine Aufgaben-ID zurück und verfolgt den Job im Aufgabenprotokoll. Der Agent beantwortet weiter andere Nachrichten, während der Job läuft. Wenn der Anbieter fertig ist, aktiviert OpenClaw den Agenten, damit er die fertigen Medien wieder im ursprünglichen Kanal veröffentlichen kann. Bildgenerierung und TTS sind synchron und werden inline mit der Antwort abgeschlossen.

Deepgram, ElevenLabs, Mistral, OpenAI und xAI können bei entsprechender Konfiguration eingehendes
Audio über den Batch-Pfad `tools.media.audio` transkribieren. Deepgram,
ElevenLabs, Mistral, OpenAI und xAI registrieren außerdem Streaming-STT-Anbieter für Voice Call,
sodass Live-Telefon-Audio an den ausgewählten Anbieter weitergeleitet werden kann,
ohne auf eine abgeschlossene Aufzeichnung warten zu müssen.

Google ist in OpenClaw den Oberflächen für Bild, Video, Musik, Batch-TTS, Backend-Echtzeitstimme
und Medienverständnis zugeordnet. OpenAI ist in OpenClaw den Oberflächen für Bild,
Video, Batch-TTS, Batch-STT, Streaming-STT für Voice Call, Backend-Echtzeitstimme
und Memory-Embeddings zugeordnet. xAI ist derzeit in OpenClaw den Oberflächen für Bild, Video,
Suche, Code-Ausführung, Batch-TTS, Batch-STT und Streaming-STT für Voice Call
zugeordnet. xAI Realtime voice ist eine Upstream-Funktion, wird jedoch in OpenClaw
erst registriert, wenn der gemeinsame Vertrag für Echtzeitstimme sie darstellen
kann.

## Schnelllinks

- [Bildgenerierung](/de/tools/image-generation) -- Bilder generieren und bearbeiten
- [Videogenerierung](/de/tools/video-generation) -- Text-zu-Video, Bild-zu-Video und Video-zu-Video
- [Musikgenerierung](/de/tools/music-generation) -- Musik und Audiospuren erstellen
- [Text-to-Speech](/de/tools/tts) -- Antworten in gesprochene Audiodaten umwandeln
- [Medienverständnis](/de/nodes/media-understanding) -- eingehende Bilder, Audiodaten und Videos verstehen

## Verwandt

- [Bildgenerierung](/de/tools/image-generation)
- [Videogenerierung](/de/tools/video-generation)
- [Musikgenerierung](/de/tools/music-generation)
- [Text-to-Speech](/de/tools/tts)
