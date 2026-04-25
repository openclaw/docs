---
read_when:
    - Auf der Suche nach einem Überblick über Medienfunktionen
    - Entscheidung, welchen Medienanbieter Sie konfigurieren sollen
    - Verstehen, wie asynchrone Mediengenerierung funktioniert
summary: Einheitliche Landingpage für Mediengenerierung, -verständnis und Sprachfunktionen
title: Medienüberblick
x-i18n:
    generated_at: "2026-04-25T13:58:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c674df701b88c807842078b2e2e53821f1b2fc6037fd2e4d688caea147e769f1
    source_path: tools/media-overview.md
    workflow: 15
---

# Mediengenerierung und -verständnis

OpenClaw generiert Bilder, Videos und Musik, versteht eingehende Medien (Bilder, Audio, Video) und spricht Antworten mit Text-to-Speech laut aus. Alle Medienfunktionen sind toolgesteuert: Der Agent entscheidet anhand der Unterhaltung, wann sie verwendet werden, und jedes Tool erscheint nur, wenn mindestens ein unterstützender Anbieter konfiguriert ist.

## Funktionen auf einen Blick

| Funktion             | Tool             | Anbieter                                                                                    | Beschreibung                                             |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Bildgenerierung      | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                           | Erstellt oder bearbeitet Bilder aus Text-Prompts oder Referenzen |
| Videogenerierung     | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Erstellt Videos aus Text, Bildern oder bestehenden Videos |
| Musikgenerierung     | `music_generate` | ComfyUI, Google, MiniMax                                                                    | Erstellt Musik oder Audiotracks aus Text-Prompts         |
| Text-to-Speech (TTS) | `tts`            | ElevenLabs, Google, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI, Xiaomi MiMo | Wandelt ausgehende Antworten in gesprochene Audiodaten um |
| Medienverständnis    | (automatisch)    | Beliebige vision- oder audiofähige Modellanbieter sowie CLI-Fallbacks                       | Fasst eingehende Bilder, Audio und Videos zusammen       |

## Matrix der Anbieterfunktionen

Diese Tabelle zeigt, welche Anbieter welche Medienfunktionen plattformweit unterstützen.

| Anbieter    | Bild | Video | Musik | TTS | STT / Transkription | Realtime Voice | Medienverständnis |
| ----------- | ---- | ----- | ----- | --- | ------------------- | -------------- | ----------------- |
| Alibaba     |      | Ja    |       |     |                     |                |                   |
| BytePlus    |      | Ja    |       |     |                     |                |                   |
| ComfyUI     | Ja   | Ja    | Ja    |     |                     |                |                   |
| Deepgram    |      |       |       |     | Ja                  | Ja             |                   |
| ElevenLabs  |      |       |       | Ja  | Ja                  |                |                   |
| fal         | Ja   | Ja    |       |     |                     |                |                   |
| Google      | Ja   | Ja    | Ja    | Ja  |                     | Ja             | Ja                |
| Gradium     |      |       |       | Ja  |                     |                |                   |
| Local CLI   |      |       |       | Ja  |                     |                |                   |
| Microsoft   |      |       |       | Ja  |                     |                |                   |
| MiniMax     | Ja   | Ja    | Ja    | Ja  |                     |                |                   |
| Mistral     |      |       |       |     | Ja                  |                |                   |
| OpenAI      | Ja   | Ja    |       | Ja  | Ja                  | Ja             | Ja                |
| Qwen        |      | Ja    |       |     |                     |                |                   |
| Runway      |      | Ja    |       |     |                     |                |                   |
| SenseAudio  |      |       |       |     | Ja                  |                |                   |
| Together    |      | Ja    |       |     |                     |                |                   |
| Vydra       | Ja   | Ja    |       | Ja  |                     |                |                   |
| xAI         | Ja   | Ja    |       | Ja  | Ja                  |                | Ja                |
| Xiaomi MiMo | Ja   |       |       | Ja  |                     |                | Ja                |

<Note>
Das Medienverständnis verwendet jeden visionsfähigen oder audiofähigen Modellanbieter, der in Ihrer Anbieterkonfiguration registriert ist. Die obige Tabelle hebt Anbieter mit dedizierter Unterstützung für Medienverständnis hervor; die meisten LLM-Anbieter mit multimodalen Modellen (Anthropic, Google, OpenAI usw.) können bei entsprechender Konfiguration als aktives Antwortmodell ebenfalls eingehende Medien verstehen.
</Note>

## Wie asynchrone Generierung funktioniert

Video- und Musikgenerierung laufen als Hintergrundaufgaben, weil die Verarbeitung durch den Anbieter typischerweise 30 Sekunden bis mehrere Minuten dauert. Wenn der Agent `video_generate` oder `music_generate` aufruft, sendet OpenClaw die Anfrage an den Anbieter, gibt sofort eine Task-ID zurück und verfolgt den Job im Task Ledger. Der Agent beantwortet während der Ausführung des Jobs weiterhin andere Nachrichten. Wenn der Anbieter fertig ist, weckt OpenClaw den Agenten auf, damit er das fertige Medium wieder im ursprünglichen Kanal veröffentlichen kann. Bildgenerierung und TTS sind synchron und werden inline mit der Antwort abgeschlossen.

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio und xAI können alle eingehendes
Audio über den Batch-Pfad `tools.media.audio` transkribieren, wenn sie konfiguriert sind.
Deepgram, ElevenLabs, Mistral, OpenAI und xAI registrieren außerdem Voice Call-
Streaming-STT-Anbieter, sodass Live-Telefonaudio an den ausgewählten
Anbieter weitergeleitet werden kann, ohne auf eine abgeschlossene Aufnahme
warten zu müssen.

Google bildet OpenClaw-Oberflächen für Bild, Video, Musik, Batch-TTS, Backend-Realtime
Voice und Medienverständnis ab. OpenAI bildet OpenClaw-Oberflächen für Bild,
Video, Batch-TTS, Batch-STT, Voice Call-Streaming-STT, Backend-Realtime Voice
und Memory Embedding ab. xAI bildet derzeit OpenClaw-Oberflächen für Bild, Video,
Suche, Codeausführung, Batch-TTS, Batch-STT und Voice Call-Streaming-STT
ab. xAI Realtime Voice ist derzeit eine Upstream-Funktion, wird aber in
OpenClaw noch nicht registriert, bis der gemeinsame Realtime-Voice-Vertrag sie
abbilden kann.

## Schnelllinks

- [Image Generation](/de/tools/image-generation) -- Bilder generieren und bearbeiten
- [Video Generation](/de/tools/video-generation) -- Text-zu-Video, Bild-zu-Video und Video-zu-Video
- [Music Generation](/de/tools/music-generation) -- Musik und Audiotracks erstellen
- [Text-to-Speech](/de/tools/tts) -- Antworten in gesprochene Audiodaten umwandeln
- [Media Understanding](/de/nodes/media-understanding) -- eingehende Bilder, Audio und Videos verstehen

## Verwandt

- [Image generation](/de/tools/image-generation)
- [Video generation](/de/tools/video-generation)
- [Music generation](/de/tools/music-generation)
- [Text-to-speech](/de/tools/tts)
