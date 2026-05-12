---
read_when:
    - Suche nach einem Überblick über die Medienfunktionen von OpenClaw
    - Entscheiden, welcher Medien-Provider konfiguriert werden soll
    - Verstehen, wie die asynchrone Mediengenerierung funktioniert
sidebarTitle: Media overview
summary: Funktionen für Bild, Video, Musik, Sprache und Medienverständnis auf einen Blick
title: Medienübersicht
x-i18n:
    generated_at: "2026-05-12T08:46:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7ca89d058467968ee140cb3318fe8a1fb96d09fe7c59982efce36eb9b714591
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw generiert Bilder, Videos und Musik, versteht eingehende Medien
(Bilder, Audio, Video) und spricht Antworten mit Text-to-Speech laut aus. Alle
Medienfunktionen sind tool-gesteuert: Der Agent entscheidet anhand der
Unterhaltung, wann sie verwendet werden, und jedes Tool erscheint nur, wenn
mindestens ein unterstützender Provider konfiguriert ist.

Live-Sprache verwendet den Talk-Sitzungsvertrag statt des One-Shot-Media-Tool-
Pfads. Talk hat drei Modi: Provider-natives `realtime`, lokales oder streamendes
`stt-tts` und `transcription` für reine Beobachtungs-Spracherfassung. Diese Modi
teilen Provider-Kataloge, Event-Umschläge und Abbruchsemantik mit Telefonie,
Meetings, Browser-Realtime und nativen Push-to-Talk-Clients.

## Funktionen

<CardGroup cols={2}>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Erstellen und bearbeiten Sie Bilder aus Text-Prompts oder Referenzbildern über
    `image_generate`. Synchron — wird inline mit der Antwort abgeschlossen.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Text-zu-Video, Bild-zu-Video und Video-zu-Video über `video_generate`.
    Asynchron — läuft im Hintergrund und veröffentlicht das Ergebnis, sobald es bereit ist.
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
    Fassen Sie eingehende Bilder, Audio und Video mit vision-fähigen Modell-
    Providern und dedizierten Medienverständnis-Plugins zusammen.
  </Card>
  <Card title="Speech-to-Text" href="/de/nodes/audio" icon="ear-listen">
    Transkribieren Sie eingehende Sprachnachrichten über Batch-STT oder Voice Call-
    Streaming-STT-Provider.
  </Card>
</CardGroup>

## Provider-Funktionsmatrix

| Provider    | Bild | Video | Musik | TTS | STT | Realtime-Sprache | Medienverständnis |
| ----------- | :--: | :---: | :---: | :-: | :-: | :---------------: | :---------------: |
| Alibaba     |      |   ✓   |       |     |     |                   |                   |
| BytePlus    |      |   ✓   |       |     |     |                   |                   |
| ComfyUI     |  ✓   |   ✓   |   ✓   |     |     |                   |                   |
| DeepInfra   |  ✓   |   ✓   |       |  ✓  |  ✓  |                   |         ✓         |
| Deepgram    |      |       |       |     |  ✓  |         ✓         |                   |
| ElevenLabs  |      |       |       |  ✓  |  ✓  |                   |                   |
| fal         |  ✓   |   ✓   |       |     |     |                   |                   |
| Google      |  ✓   |   ✓   |   ✓   |  ✓  |     |         ✓         |         ✓         |
| Gradium     |      |       |       |  ✓  |     |                   |                   |
| Local CLI   |      |       |       |  ✓  |     |                   |                   |
| Microsoft   |      |       |       |  ✓  |     |                   |                   |
| MiniMax     |  ✓   |   ✓   |   ✓   |  ✓  |     |                   |                   |
| Mistral     |      |       |       |     |  ✓  |                   |                   |
| OpenAI      |  ✓   |   ✓   |       |  ✓  |  ✓  |         ✓         |         ✓         |
| OpenRouter  |  ✓   |   ✓   |       |  ✓  |  ✓  |                   |         ✓         |
| Qwen        |      |   ✓   |       |     |     |                   |                   |
| Runway      |      |   ✓   |       |     |     |                   |                   |
| SenseAudio  |      |       |       |     |  ✓  |                   |                   |
| Together    |      |   ✓   |       |     |     |                   |                   |
| Vydra       |  ✓   |   ✓   |       |  ✓  |     |                   |                   |
| xAI         |  ✓   |   ✓   |       |  ✓  |  ✓  |                   |         ✓         |
| Xiaomi MiMo |  ✓   |       |       |  ✓  |     |                   |         ✓         |

<Note>
Medienverständnis verwendet jedes vision- oder audiofähige Modell, das
in Ihrer Provider-Konfiguration registriert ist. Die obige Matrix listet Provider mit dedizierter
Unterstützung für Medienverständnis auf; die meisten multimodalen LLM-Provider (Anthropic, Google,
OpenAI usw.) können eingehende Medien ebenfalls verstehen, wenn sie als aktives
Antwortmodell konfiguriert sind.
</Note>

## Asynchron vs. synchron

| Funktion        | Modus        | Warum                                                                                                      |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| Bild            | Synchron     | Provider-Antworten kommen innerhalb von Sekunden zurück; wird inline mit der Antwort abgeschlossen.         |
| Text-to-Speech  | Synchron     | Provider-Antworten kommen innerhalb von Sekunden zurück; wird an das Antwortaudio angehängt.                |
| Video           | Asynchron    | Provider-Verarbeitung dauert 30 s bis mehrere Minuten; langsame Warteschlangen können bis zum konfigurierten Timeout laufen. |
| Musik (geteilt) | Asynchron    | Gleiche Provider-Verarbeitungscharakteristik wie bei Video.                                                 |
| Musik (ComfyUI) | Synchron     | Lokaler Workflow läuft inline gegen den konfigurierten ComfyUI-Server.                                      |

Für asynchrone Tools sendet OpenClaw die Anfrage an den Provider, gibt sofort eine Task-
ID zurück und verfolgt den Job im Task-Ledger. Der Agent beantwortet weiter
andere Nachrichten, während der Job läuft. Wenn der Provider fertig ist,
weckt OpenClaw den Agent mit den generierten Medienpfaden, damit er den
Benutzer informieren und, wenn es die Richtlinie zur Quelldelivery erfordert, das Ergebnis über
das Nachrichtentool weiterleiten kann. Bei Gruppen-/Kanalrouten nur über das Nachrichtentool behandelt OpenClaw
fehlende Zustellnachweise des Nachrichtentools als fehlgeschlagenen Abschlussversuch und sendet
den generierten Medien-Fallback direkt an den ursprünglichen Kanal.

## Speech-to-Text und Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio und xAI können alle
eingehendes Audio über den Batch-Pfad `tools.media.audio` transkribieren, wenn sie konfiguriert sind.
Kanal-Plugins, die eine Sprachnotiz für Mention-Gating oder Befehls-
Parsing vorab prüfen, markieren den transkribierten Anhang im eingehenden Kontext, sodass der gemeinsame
Medienverständnis-Durchlauf dieses Transkript wiederverwendet, statt einen zweiten
STT-Aufruf für dieselbe Audiodatei zu machen.

Deepgram, ElevenLabs, Mistral, OpenAI und xAI registrieren außerdem Voice Call-
Streaming-STT-Provider, sodass Live-Telefon-Audio an den ausgewählten
Vendor weitergeleitet werden kann, ohne auf eine abgeschlossene Aufzeichnung zu warten.

Für Live-Unterhaltungen mit Benutzern bevorzugen Sie den [Talk-Modus](/de/nodes/talk). Batch-Audio-
Anhänge bleiben auf dem Medienpfad; Browser-Realtime, natives Push-to-Talk,
Telefonie und Meeting-Audio sollten Talk-Events und die sitzungsbezogenen
Kataloge verwenden, die vom Gateway zurückgegeben werden.

## Provider-Zuordnungen (wie Vendors auf Oberflächen aufgeteilt werden)

<AccordionGroup>
  <Accordion title="Google">
    Bild-, Video-, Musik-, Batch-TTS-, Backend-Realtime-Sprach- und
    Medienverständnis-Oberflächen.
  </Accordion>
  <Accordion title="OpenAI">
    Bild-, Video-, Batch-TTS-, Batch-STT-, Voice Call-Streaming-STT-, Backend-
    Realtime-Sprach- und Memory-Embedding-Oberflächen.
  </Accordion>
  <Accordion title="DeepInfra">
    Chat-/Modell-Routing, Bildgenerierung/-bearbeitung, Text-zu-Video, Batch-TTS,
    Batch-STT, Bild-Medienverständnis und Memory-Embedding-Oberflächen.
    DeepInfra-native Rerank-/Klassifikations-/Objekterkennungsmodelle werden nicht
    registriert, bis OpenClaw dedizierte Provider-Verträge für diese
    Kategorien hat.
  </Accordion>
  <Accordion title="xAI">
    Bild, Video, Suche, Codeausführung, Batch-TTS, Batch-STT und Voice
    Call-Streaming-STT. xAI Realtime-Sprache ist eine Upstream-Funktion, wird aber
    in OpenClaw nicht registriert, bis der gemeinsame Realtime-Sprachvertrag sie
    abbilden kann.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Bildgenerierung](/de/tools/image-generation)
- [Videogenerierung](/de/tools/video-generation)
- [Musikgenerierung](/de/tools/music-generation)
- [Text-to-Speech](/de/tools/tts)
- [Medienverständnis](/de/nodes/media-understanding)
- [Audioknoten](/de/nodes/audio)
- [Talk-Modus](/de/nodes/talk)
