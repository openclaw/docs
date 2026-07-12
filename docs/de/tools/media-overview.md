---
read_when:
    - Sie suchen einen Überblick über die Medienfunktionen von OpenClaw
    - Entscheiden, welcher Medien-Provider konfiguriert werden soll
    - Funktionsweise der asynchronen Mediengenerierung verstehen
sidebarTitle: Media overview
summary: Bild-, Video-, Musik-, Sprach- und Medienverständnisfunktionen im Überblick
title: Medienübersicht
x-i18n:
    generated_at: "2026-07-12T15:58:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw generiert Bilder, Videos und Musik, versteht eingehende Medien
(Bilder, Audio, Video) und spricht Antworten mittels Text-to-Speech laut aus. Alle
Medienfunktionen werden durch Tools gesteuert: Der Agent entscheidet anhand
der Unterhaltung, wann sie verwendet werden, und jedes Tool wird nur angezeigt,
wenn mindestens ein unterstützender Provider konfiguriert ist.

Live-Sprache verwendet den Talk-Sitzungsvertrag anstelle des Medien-Tool-Pfads
für Einzelvorgänge. Talk bietet drei Modi: Provider-natives `realtime`, lokales oder
streamendes `stt-tts` und `transcription` für die reine Erfassung von Sprache ohne
Interaktion. Diese Modi nutzen gemeinsam mit Telefonie, Besprechungen,
Browser-Echtzeitkommunikation und nativen Push-to-Talk-Clients dieselben
Provider-Kataloge, Ereignis-Umschläge und Abbruchsemantiken.

## Funktionen

<CardGroup cols={2}>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Erstellen und bearbeiten Sie Bilder anhand von Texteingaben oder Referenzbildern
    über `image_generate`. In Chatsitzungen asynchron – wird im Hintergrund
    ausgeführt und veröffentlicht das Ergebnis, sobald es verfügbar ist.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Text-zu-Video, Bild-zu-Video und Video-zu-Video über `video_generate`.
    Asynchron – wird im Hintergrund ausgeführt und veröffentlicht das Ergebnis,
    sobald es verfügbar ist.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Generieren Sie Musik oder Audiospuren über `music_generate`. In
    Chatsitzungen asynchron im gemeinsamen Aufgabenlebenszyklus der Mediengenerierung.
  </Card>
  <Card title="Text-to-Speech" href="/de/tools/tts" icon="microphone">
    Wandeln Sie ausgehende Antworten über das Tool `tts` und die Konfiguration
    `messages.tts` in gesprochene Audiodaten um. Synchron.
  </Card>
  <Card title="Medienverständnis" href="/de/nodes/media-understanding" icon="eye">
    Fassen Sie eingehende Bilder, Audio- und Videodaten mithilfe visuell
    leistungsfähiger Modell-Provider und spezieller Plugins für Medienverständnis zusammen.
  </Card>
  <Card title="Speech-to-Text" href="/de/nodes/audio" icon="ear-listen">
    Transkribieren Sie eingehende Sprachnachrichten mittels Batch-STT oder
    streamender STT-Provider für Voice Call.
  </Card>
</CardGroup>

## Matrix der Provider-Funktionen

<Note>
Diese Tabelle umfasst die speziellen Plugins für Mediengenerierung, TTS und STT. Viele
Chatmodell-Provider (Anthropic, Google, OpenAI und andere) verstehen über ihr
Antwortmodell ebenfalls eingehende Medien; die vollständige Provider-Liste finden Sie unter
[Medienverständnis](/de/nodes/media-understanding#provider-support-matrix).
</Note>

| Provider          | Bild | Video | Musik | TTS | STT | Echtzeit-Sprache | Medienverständnis |
| ----------------- | :--: | :---: | :---: | :-: | :-: | :---------------: | :----------------: |
| Alibaba           |      |   ✓   |       |     |     |                   |                    |
| Azure Speech      |      |       |       |  ✓  |     |                   |                    |
| BytePlus          |      |   ✓   |       |     |     |                   |                    |
| ComfyUI           |  ✓   |   ✓   |   ✓   |     |     |                   |                    |
| Deepgram          |      |       |       |     |  ✓  |                   |                    |
| DeepInfra         |  ✓   |   ✓   |       |  ✓  |  ✓  |                   |         ✓          |
| ElevenLabs        |      |       |       |  ✓  |  ✓  |                   |                    |
| fal               |  ✓   |   ✓   |   ✓   |     |     |                   |                    |
| Google            |  ✓   |   ✓   |   ✓   |  ✓  |  ✓  |         ✓         |         ✓          |
| Gradium           |      |       |       |  ✓  |     |                   |                    |
| Inworld           |      |       |       |  ✓  |     |                   |                    |
| LiteLLM           |  ✓   |       |       |     |     |                   |                    |
| Lokale CLI        |      |       |       |  ✓  |     |                   |                    |
| Microsoft         |      |       |       |  ✓  |     |                   |                    |
| Microsoft Foundry |  ✓   |       |       |     |     |                   |                    |
| MiniMax           |  ✓   |   ✓   |   ✓   |  ✓  |     |                   |                    |
| Mistral           |      |       |       |     |  ✓  |                   |                    |
| OpenAI            |  ✓   |   ✓   |       |  ✓  |  ✓  |         ✓         |         ✓          |
| OpenRouter        |  ✓   |   ✓   |   ✓   |  ✓  |  ✓  |                   |         ✓          |
| PixVerse          |      |   ✓   |       |     |     |                   |                    |
| Qwen              |      |   ✓   |       |     |     |                   |         ✓          |
| Runway            |      |   ✓   |       |     |     |                   |                    |
| SenseAudio        |      |       |       |     |  ✓  |                   |                    |
| Together          |      |   ✓   |       |     |     |                   |                    |
| Volcengine        |      |       |       |  ✓  |     |                   |                    |
| Vydra             |  ✓   |   ✓   |       |  ✓  |     |                   |                    |
| xAI               |  ✓   |   ✓   |       |  ✓  |  ✓  |                   |         ✓          |
| Xiaomi MiMo       |      |       |       |  ✓  |     |                   |                    |

<Note>
**Echtzeit-Sprache** bezeichnet hier Provider-native bidirektionale Echtzeitkommunikation (Talk-Modus
`realtime`, z. B. Gemini Live oder die OpenAI Realtime API) – derzeit wird sie nur von Google
und OpenAI registriert. Deepgram, ElevenLabs, Mistral, OpenAI und xAI
registrieren separat streamendes STT für Voice Call (einseitige Umwandlung von Audio in Text); siehe
[Speech-to-Text und Voice Call](#speech-to-text-and-voice-call) weiter unten.
Echtzeit-Sprache von xAI ist eine vorgelagerte Funktion, wird jedoch erst in
OpenClaw registriert, wenn sie durch den gemeinsamen Echtzeit-Sprachvertrag abgebildet werden kann.
</Note>

## Asynchron und synchron

| Funktion       | Modus       | Grund                                                                                                |
| -------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| Bild           | Asynchron   | Die Verarbeitung durch den Provider kann länger als ein Chatdurchlauf dauern; generierte Anhänge verwenden den gemeinsamen Abschlusspfad. |
| Text-to-Speech | Synchron    | Antworten des Providers treffen innerhalb von Sekunden ein und werden an die Antwortaudiodaten angehängt. |
| Video          | Asynchron   | Die Verarbeitung durch den Provider dauert 30 s bis mehrere Minuten; langsame Warteschlangen können bis zum konfigurierten Zeitlimit ausgeführt werden. |
| Musik          | Asynchron   | Weist dieselben Eigenschaften der Provider-Verarbeitung wie Video auf.                               |

Bei asynchronen Tools sendet OpenClaw die Anfrage an den Provider, gibt sofort
eine Aufgaben-ID zurück und verfolgt den Auftrag im Aufgabenverzeichnis. Der Agent
beantwortet weiterhin andere Nachrichten, während der Auftrag ausgeführt wird. Sobald der
Provider fertig ist, aktiviert OpenClaw den Agenten mit den Pfaden der generierten Medien,
damit dieser den Benutzer über den normalen sichtbaren Antwortmodus der Sitzung informieren kann:
automatische Zustellung der endgültigen Antwort, wenn diese konfiguriert ist, oder
`message(action="send")`, wenn die Sitzung das Nachrichten-Tool erfordert. Wenn die
anfragende Sitzung inaktiv ist oder ihre aktive Aktivierung fehlschlägt und in der
Abschlussantwort noch generierte Medien fehlen, sendet OpenClaw eine idempotente direkte
Fallback-Nachricht, die nur die fehlenden Medien enthält. Medien, die bereits durch die
Abschlussantwort zugestellt wurden, werden nicht erneut veröffentlicht.

## Speech-to-Text und Voice Call

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio und xAI können alle eingehende Audiodaten über den Batch-Pfad
`tools.media.audio` transkribieren, wenn sie konfiguriert sind. Channel-Plugins, die eine
Sprachnachricht vorab auf Erwähnungsfilterung oder Befehlsanalyse prüfen, markieren den
transkribierten Anhang im eingehenden Kontext, sodass der gemeinsame Durchlauf für das
Medienverständnis dieses Transkript wiederverwendet, statt einen zweiten STT-Aufruf für
dieselben Audiodaten vorzunehmen.

Deepgram, ElevenLabs, Mistral, OpenAI und xAI registrieren außerdem streamende
STT-Provider für Voice Call, sodass Live-Telefonaudio an den ausgewählten Provider
weitergeleitet werden kann, ohne auf eine abgeschlossene Aufnahme zu warten.

Verwenden Sie für Live-Unterhaltungen mit Benutzern vorzugsweise den
[Talk-Modus](/de/nodes/talk). Batch-Audioanhänge verbleiben auf dem Medienpfad;
Browser-Echtzeitkommunikation, natives Push-to-Talk, Telefonie und Besprechungsaudio
sollten Talk-Ereignisse und die vom Gateway zurückgegebenen sitzungsspezifischen
Kataloge verwenden.

## Provider-Zuordnungen (Aufteilung der Anbieter auf die Oberflächen)

<AccordionGroup>
  <Accordion title="Google">
    Oberflächen für Bilder, Videos, Musik, Batch-TTS, Batch-STT,
    Backend-Echtzeit-Sprache und Medienverständnis.
  </Accordion>
  <Accordion title="OpenAI">
    Oberflächen für Bilder, Videos, Batch-TTS, Batch-STT, streamendes STT für
    Voice Call, Backend-Echtzeit-Sprache und Speicher-Embeddings.
  </Accordion>
  <Accordion title="DeepInfra">
    Oberflächen für Chat-/Modell-Routing, Bildgenerierung/-bearbeitung,
    Text-zu-Video, Batch-TTS, Batch-STT, Medienverständnis für Bilder und
    Speicher-Embeddings. DeepInfra stellt außerdem Re-Ranking, Klassifizierung,
    Objekterkennung und andere native Modelltypen bereit; OpenClaw verfügt für
    diese Kategorien noch über keinen Provider-Vertrag, daher registriert dieses
    Plugin sie nicht.
  </Accordion>
  <Accordion title="xAI">
    Bilder, Videos, Suche, Codeausführung, Batch-TTS, Batch-STT und
    streamendes STT für Voice Call. Echtzeit-Sprache von xAI ist eine
    vorgelagerte Funktion, wird jedoch erst in OpenClaw registriert, wenn sie
    durch den gemeinsamen Echtzeit-Sprachvertrag abgebildet werden kann.
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
