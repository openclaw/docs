---
read_when:
    - Suchen Sie nach einem Überblick über die Medienfunktionen von OpenClaw
    - Entscheiden, welcher Medien-Provider konfiguriert werden soll
    - Verstehen, wie asynchrone Mediengenerierung funktioniert
sidebarTitle: Media overview
summary: Bild-, Video-, Musik-, Sprach- und Medienverständnisfunktionen auf einen Blick
title: Medienübersicht
x-i18n:
    generated_at: "2026-05-06T07:07:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201d01244fc6a587b730ae3033de5990b2f01f63e6e40339c738c95040e085b3
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw generiert Bilder, Videos und Musik, versteht eingehende Medien
(Bilder, Audio, Video) und spricht Antworten per Text-to-Speech laut aus. Alle
Medienfunktionen sind toolgesteuert: Der Agent entscheidet anhand der
Konversation, wann er sie verwendet, und jedes Tool erscheint nur, wenn
mindestens ein unterstützender Provider konfiguriert ist.

Live-Sprache verwendet den Talk-Sitzungsvertrag statt des One-Shot-Pfads für
Medientools. Talk hat drei Modi: provider-natives `realtime`, lokales oder
streamendes `stt-tts` und `transcription` für reine Sprachaufzeichnung zur
Beobachtung. Diese Modi teilen Provider-Kataloge, Ereignisumschläge und
Abbruchsemantik mit Telefonie, Meetings, Browser-Realtime und nativen
Push-to-Talk-Clients.

## Funktionen

<CardGroup cols={2}>
  <Card title="Image generation" href="/de/tools/image-generation" icon="image">
    Erstellen und bearbeiten Sie Bilder aus Textprompts oder Referenzbildern
    über `image_generate`. Synchron — wird inline mit der Antwort abgeschlossen.
  </Card>
  <Card title="Video generation" href="/de/tools/video-generation" icon="video">
    Text-zu-Video, Bild-zu-Video und Video-zu-Video über `video_generate`.
    Asynchron — läuft im Hintergrund und veröffentlicht das Ergebnis, sobald es bereit ist.
  </Card>
  <Card title="Music generation" href="/de/tools/music-generation" icon="music">
    Generieren Sie Musik oder Audiospuren über `music_generate`. Asynchron bei
    gemeinsamen Providern; der ComfyUI-Workflowpfad läuft synchron.
  </Card>
  <Card title="Text-to-speech" href="/de/tools/tts" icon="microphone">
    Wandeln Sie ausgehende Antworten über das `tts`-Tool plus die
    `messages.tts`-Konfiguration in gesprochene Audiodaten um. Synchron.
  </Card>
  <Card title="Media understanding" href="/de/nodes/media-understanding" icon="eye">
    Fassen Sie eingehende Bilder, Audio und Video mit visionfähigen
    Modell-Providern und dedizierten Plugins für Medienverständnis zusammen.
  </Card>
  <Card title="Speech-to-text" href="/de/nodes/audio" icon="ear-listen">
    Transkribieren Sie eingehende Sprachnachrichten über Batch-STT oder
    Streaming-STT-Provider für Sprachanrufe.
  </Card>
</CardGroup>

## Provider-Funktionsmatrix

| Provider    | Bild | Video | Musik | TTS | STT | Realtime-Sprache | Medienverständnis |
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
Medienverständnis verwendet jedes visionfähige oder audiofähige Modell, das
in Ihrer Provider-Konfiguration registriert ist. Die obige Matrix listet
Provider mit dedizierter Unterstützung für Medienverständnis auf; die meisten
multimodalen LLM-Provider (Anthropic, Google, OpenAI usw.) können eingehende
Medien ebenfalls verstehen, wenn sie als aktives Antwortmodell konfiguriert sind.
</Note>

## Asynchron vs. synchron

| Funktion        | Modus        | Warum                                                                                                             |
| --------------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| Bild            | Synchron     | Provider-Antworten kommen innerhalb von Sekunden zurück; wird inline mit der Antwort abgeschlossen.                |
| Text-to-Speech  | Synchron     | Provider-Antworten kommen innerhalb von Sekunden zurück; wird an das Antwortaudio angehängt.                      |
| Video           | Asynchron    | Die Provider-Verarbeitung dauert 30 s bis mehrere Minuten; langsame Warteschlangen können bis zum konfigurierten Timeout laufen. |
| Musik (geteilt) | Asynchron    | Dieselbe Provider-Verarbeitungseigenschaft wie bei Video.                                                        |
| Musik (ComfyUI) | Synchron     | Der lokale Workflow läuft inline gegen den konfigurierten ComfyUI-Server.                                         |

Für asynchrone Tools übermittelt OpenClaw die Anfrage an den Provider, gibt
sofort eine Aufgaben-ID zurück und verfolgt den Job im Aufgabenbuch. Der Agent
beantwortet weiter andere Nachrichten, während der Job läuft. Wenn der
Provider fertig ist, weckt OpenClaw den Agenten mit den Pfaden der generierten
Medien, damit er den Benutzer informieren und, wenn es die Richtlinie für die
Zustellung an der Quelle erfordert, das Ergebnis über das Nachrichten-Tool
weiterleiten kann. Für Gruppen-/Kanalrouten, die nur das Nachrichten-Tool
zulassen, behandelt OpenClaw fehlende Zustellnachweise des Nachrichten-Tools
als fehlgeschlagenen Abschlussversuch und sendet den generierten
Medien-Fallback direkt an den ursprünglichen Kanal.

## Speech-to-Text und Sprachanruf

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio und xAI können
eingehende Audiodaten alle über den Batch-Pfad `tools.media.audio`
transkribieren, wenn sie konfiguriert sind. Kanal-Plugins, die eine
Sprachnotiz für Mention-Gating oder Befehlsparsing vorprüfen, markieren den
transkribierten Anhang im eingehenden Kontext, sodass der gemeinsame
Medienverständnis-Durchlauf dieses Transkript wiederverwendet, statt für
dieselben Audiodaten einen zweiten STT-Aufruf auszuführen.

Deepgram, ElevenLabs, Mistral, OpenAI und xAI registrieren außerdem
Streaming-STT-Provider für Sprachanrufe, sodass Live-Telefonaudio an den
ausgewählten Vendor weitergeleitet werden kann, ohne auf eine abgeschlossene
Aufnahme zu warten.

Für Live-Benutzerkonversationen verwenden Sie bevorzugt den
[Talk-Modus](/de/nodes/talk). Batch-Audioanhänge bleiben auf dem Medienpfad;
Browser-Realtime, natives Push-to-Talk, Telefonie und Meeting-Audio sollten
Talk-Ereignisse und die sitzungsbezogenen Kataloge verwenden, die vom Gateway
zurückgegeben werden.

## Provider-Zuordnungen (wie Vendors über Oberflächen verteilt sind)

<AccordionGroup>
  <Accordion title="Google">
    Oberflächen für Bild, Video, Musik, Batch-TTS, Backend-Realtime-Sprache und
    Medienverständnis.
  </Accordion>
  <Accordion title="OpenAI">
    Oberflächen für Bild, Video, Batch-TTS, Batch-STT, Voice-Call-Streaming-STT,
    Backend-Realtime-Sprache und Memory-Embeddings.
  </Accordion>
  <Accordion title="DeepInfra">
    Oberflächen für Chat-/Modell-Routing, Bilderzeugung/-bearbeitung,
    Text-zu-Video, Batch-TTS, Batch-STT, Bild-Medienverständnis und
    Memory-Embeddings. DeepInfra-native Modelle für
    Reranking/Klassifikation/Objekterkennung werden erst registriert, wenn
    OpenClaw dedizierte Provider-Verträge für diese Kategorien hat.
  </Accordion>
  <Accordion title="xAI">
    Bild, Video, Suche, Codeausführung, Batch-TTS, Batch-STT und
    Voice-Call-Streaming-STT. xAI-Realtime-Sprache ist eine Upstream-Funktion,
    wird in OpenClaw aber erst registriert, wenn der gemeinsame Vertrag für
    Realtime-Sprache sie abbilden kann.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Bilderzeugung](/de/tools/image-generation)
- [Videogenerierung](/de/tools/video-generation)
- [Musikgenerierung](/de/tools/music-generation)
- [Text-to-Speech](/de/tools/tts)
- [Medienverständnis](/de/nodes/media-understanding)
- [Audioknoten](/de/nodes/audio)
- [Talk-Modus](/de/nodes/talk)
