---
read_when:
    - Suchen Sie nach einer Übersicht über die Medienfunktionen von OpenClaw
    - Entscheiden, welcher Medien-Provider konfiguriert werden soll
    - Funktionsweise der asynchronen Mediengenerierung verstehen
sidebarTitle: Media overview
summary: Funktionen für Bild, Video, Musik, Sprache und Medienverständnis auf einen Blick
title: Medienübersicht
x-i18n:
    generated_at: "2026-05-05T06:19:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd02d4418fe294fda5f1437dd3a07c4aeb4de3b46a1b70bfe36914bc27123cc4
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw generiert Bilder, Videos und Musik, versteht eingehende Medien
(Bilder, Audio, Video) und spricht Antworten per Text-to-Speech laut aus. Alle
Medienfunktionen sind toolgesteuert: Der Agent entscheidet anhand der
Unterhaltung, wann sie verwendet werden, und jedes Tool erscheint nur, wenn
mindestens ein unterstützender Provider konfiguriert ist.

## Funktionen

<CardGroup cols={2}>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Erstellen und bearbeiten Sie Bilder aus Text-Prompts oder Referenzbildern über
    `image_generate`. Synchron — wird inline mit der Antwort abgeschlossen.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Text-zu-Video, Bild-zu-Video und Video-zu-Video über `video_generate`.
    Asynchron — läuft im Hintergrund und veröffentlicht das Ergebnis, wenn es bereit ist.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Generieren Sie Musik oder Audiospuren über `music_generate`. Asynchron bei gemeinsam genutzten
    Providern; der ComfyUI-Workflow-Pfad läuft synchron.
  </Card>
  <Card title="Text-to-Speech" href="/de/tools/tts" icon="microphone">
    Wandeln Sie ausgehende Antworten über das `tts`-Tool plus
    `messages.tts`-Konfiguration in gesprochene Audioausgabe um. Synchron.
  </Card>
  <Card title="Medienverständnis" href="/de/nodes/media-understanding" icon="eye">
    Fassen Sie eingehende Bilder, Audio- und Videoinhalte mithilfe bildfähiger Modell-
    Provider und dedizierter Medienverständnis-Plugins zusammen.
  </Card>
  <Card title="Speech-to-Text" href="/de/nodes/audio" icon="ear-listen">
    Transkribieren Sie eingehende Sprachnachrichten über Batch-STT oder Voice Call-
    Streaming-STT-Provider.
  </Card>
</CardGroup>

## Provider-Funktionsmatrix

| Provider    | Bild | Video | Musik | TTS | STT | Echtzeitstimme | Medienverständnis |
| ----------- | :--: | :---: | :---: | :-: | :-: | :------------: | :----------------: |
| Alibaba     |      |   ✓   |       |     |     |                |                    |
| BytePlus    |      |   ✓   |       |     |     |                |                    |
| ComfyUI     |  ✓   |   ✓   |   ✓   |     |     |                |                    |
| DeepInfra   |  ✓   |   ✓   |       |  ✓  |  ✓  |                |         ✓          |
| Deepgram    |      |       |       |     |  ✓  |       ✓        |                    |
| ElevenLabs  |      |       |       |  ✓  |  ✓  |                |                    |
| fal         |  ✓   |   ✓   |       |     |     |                |                    |
| Google      |  ✓   |   ✓   |   ✓   |  ✓  |     |       ✓        |         ✓          |
| Gradium     |      |       |       |  ✓  |     |                |                    |
| Local CLI   |      |       |       |  ✓  |     |                |                    |
| Microsoft   |      |       |       |  ✓  |     |                |                    |
| MiniMax     |  ✓   |   ✓   |   ✓   |  ✓  |     |                |                    |
| Mistral     |      |       |       |     |  ✓  |                |                    |
| OpenAI      |  ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |         ✓          |
| OpenRouter  |  ✓   |   ✓   |       |  ✓  |     |                |         ✓          |
| Qwen        |      |   ✓   |       |     |     |                |                    |
| Runway      |      |   ✓   |       |     |     |                |                    |
| SenseAudio  |      |       |       |     |  ✓  |                |                    |
| Together    |      |   ✓   |       |     |     |                |                    |
| Vydra       |  ✓   |   ✓   |       |  ✓  |     |                |                    |
| xAI         |  ✓   |   ✓   |       |  ✓  |  ✓  |                |         ✓          |
| Xiaomi MiMo |  ✓   |       |       |  ✓  |     |                |         ✓          |

<Note>
Medienverständnis verwendet jedes bildfähige oder audiofähige Modell, das
in Ihrer Provider-Konfiguration registriert ist. Die obige Matrix listet Provider mit dedizierter
Unterstützung für Medienverständnis auf; die meisten multimodalen LLM-Provider (Anthropic, Google,
OpenAI usw.) können eingehende Medien ebenfalls verstehen, wenn sie als aktives
Antwortmodell konfiguriert sind.
</Note>

## Asynchron vs. synchron

| Funktion        | Modus        | Warum                                                                                                  |
| --------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| Bild            | Synchron     | Provider-Antworten werden in Sekunden zurückgegeben; wird inline mit der Antwort abgeschlossen.         |
| Text-to-Speech  | Synchron     | Provider-Antworten werden in Sekunden zurückgegeben; an die Antwort-Audioausgabe angehängt.            |
| Video           | Asynchron    | Provider-Verarbeitung dauert 30 s bis mehrere Minuten; langsame Warteschlangen können bis zum konfigurierten Timeout laufen. |
| Musik (geteilt) | Asynchron    | Gleiche Provider-Verarbeitungscharakteristik wie Video.                                                |
| Musik (ComfyUI) | Synchron     | Lokaler Workflow läuft inline gegen den konfigurierten ComfyUI-Server.                                 |

Für asynchrone Tools sendet OpenClaw die Anfrage an den Provider, gibt sofort
eine Task-ID zurück und verfolgt den Job im Task-Ledger. Der Agent beantwortet
weiterhin andere Nachrichten, während der Job läuft. Wenn der Provider fertig ist,
weckt OpenClaw den Agent mit den generierten Medienpfaden, damit er den
Benutzer informieren und, wenn es die Richtlinie zur Quellzustellung erfordert, das Ergebnis über
das Nachrichtentool weiterleiten kann. Bei Gruppen-/Kanalrouten, die ausschließlich das Nachrichtentool verwenden, behandelt OpenClaw
fehlenden Zustellnachweis des Nachrichtentools als fehlgeschlagenen Abschlussversuch und sendet
den generierten Medien-Fallback direkt an den ursprünglichen Kanal.

## Speech-to-Text und Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio und xAI können alle
eingehende Audioinhalte über den Batch-Pfad `tools.media.audio` transkribieren, wenn sie konfiguriert sind.
Kanal-Plugins, die eine Sprachnotiz für Mention-Gating oder Befehlsanalyse
vorprüfen, markieren den transkribierten Anhang im eingehenden Kontext, sodass der gemeinsame
Medienverständnis-Durchlauf dieses Transkript wiederverwendet, statt für dieselbe Audiodatei einen zweiten
STT-Aufruf auszuführen.

Deepgram, ElevenLabs, Mistral, OpenAI und xAI registrieren außerdem Voice Call-
Streaming-STT-Provider, sodass Live-Telefonaudio an den ausgewählten
Vendor weitergeleitet werden kann, ohne auf eine abgeschlossene Aufnahme zu warten.

## Provider-Zuordnungen (wie Vendors Oberflächen aufteilen)

<AccordionGroup>
  <Accordion title="Google">
    Bild-, Video-, Musik-, Batch-TTS-, Backend-Echtzeitstimmen- und
    Medienverständnis-Oberflächen.
  </Accordion>
  <Accordion title="OpenAI">
    Bild-, Video-, Batch-TTS-, Batch-STT-, Voice Call-Streaming-STT-, Backend-
    Echtzeitstimmen- und Memory-Embedding-Oberflächen.
  </Accordion>
  <Accordion title="DeepInfra">
    Chat-/Modell-Routing, Bildgenerierung/-bearbeitung, Text-zu-Video, Batch-TTS,
    Batch-STT, Bildmedienverständnis und Memory-Embedding-Oberflächen.
    DeepInfra-native Modelle für Reranking/Klassifizierung/Objekterkennung werden nicht
    registriert, bis OpenClaw dedizierte Provider-Verträge für diese
    Kategorien hat.
  </Accordion>
  <Accordion title="xAI">
    Bild, Video, Suche, Codeausführung, Batch-TTS, Batch-STT und Voice
    Call-Streaming-STT. xAI Realtime Voice ist eine Upstream-Funktion, wird aber
    in OpenClaw erst registriert, wenn der gemeinsame Echtzeitstimmen-Vertrag sie
    abbilden kann.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Bildgenerierung](/de/tools/image-generation)
- [Videogenerierung](/de/tools/video-generation)
- [Musikgenerierung](/de/tools/music-generation)
- [Text-to-Speech](/de/tools/tts)
- [Medienverständnis](/de/nodes/media-understanding)
- [Audio-Nodes](/de/nodes/audio)
