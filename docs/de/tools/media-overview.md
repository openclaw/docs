---
read_when:
    - Sie suchen einen Überblick über die Medienfunktionen von OpenClaw
    - Entscheidung, welcher Medien-Provider konfiguriert werden soll
    - Funktionsweise der asynchronen Mediengenerierung verstehen
sidebarTitle: Media overview
summary: Bild-, Video-, Musik-, Sprach- und Medienverständnisfunktionen auf einen Blick
title: Medienübersicht
x-i18n:
    generated_at: "2026-07-24T05:23:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18eb79e6915c5dc8d705bf5cadfcdddecaf7d21a037f102696d4f2bcd41e5bea
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw erzeugt Bilder, Videos und Musik, versteht eingehende Medien
(Bilder, Audio, Video) und gibt Antworten mittels Text-to-Speech laut wieder. Alle
Medienfunktionen werden durch Tools gesteuert: Der Agent entscheidet anhand
der Unterhaltung, wann sie verwendet werden, und jedes Tool wird nur angezeigt,
wenn mindestens ein zugrunde liegender Provider konfiguriert ist.

Live-Sprache verwendet den Talk-Sitzungsvertrag anstelle des Pfads für
einmalig ausgeführte Medien-Tools. Talk verfügt über drei Modi: Provider-natives `realtime`,
lokales oder Streaming-`stt-tts` und `transcription` für die reine
Beobachtung der Spracherfassung. Diese Modi verwenden dieselben Provider-Kataloge,
Ereignisumschläge und Abbruchsemantiken wie Telefonie, Meetings, Browser-Echtzeit
und native Push-to-Talk-Clients.

## Funktionen

<CardGroup cols={2}>
  <Card title="Bilderzeugung" href="/de/tools/image-generation" icon="image">
    Erstellen und bearbeiten Sie Bilder anhand von Text-Prompts oder Referenzbildern über
    `image_generate`. In Chat-Sitzungen asynchron — wird im Hintergrund ausgeführt und
    veröffentlicht das Ergebnis, sobald es bereit ist.
  </Card>
  <Card title="Videoerzeugung" href="/de/tools/video-generation" icon="video">
    Text-zu-Video, Bild-zu-Video und Video-zu-Video über `video_generate`.
    Asynchron — wird im Hintergrund ausgeführt und veröffentlicht das Ergebnis, sobald es bereit ist.
  </Card>
  <Card title="Musikerzeugung" href="/de/tools/music-generation" icon="music">
    Erzeugen Sie Musik oder Audiospuren über `music_generate`. In Chat-
    Sitzungen asynchron im gemeinsamen Lebenszyklus für Medienerzeugungsaufgaben.
  </Card>
  <Card title="Text-to-Speech" href="/de/tools/tts" icon="microphone">
    Wandeln Sie ausgehende Antworten über das Tool `tts` und die
    Konfiguration `tts` in gesprochene Audiodaten um. Synchron.
  </Card>
  <Card title="Medienverständnis" href="/de/nodes/media-understanding" icon="eye">
    Fassen Sie eingehende Bilder, Audio- und Videodaten mithilfe bildverarbeitungsfähiger
    Modell-Provider und spezieller Plugins für Medienverständnis zusammen.
  </Card>
  <Card title="Speech-to-Text" href="/de/nodes/audio" icon="ear-listen">
    Transkribieren Sie eingehende Sprachnachrichten über Batch-STT- oder
    Streaming-STT-Provider für Voice Call.
  </Card>
</CardGroup>

## Provider-Funktionsmatrix

<Note>
Diese Tabelle umfasst die speziellen Plugins für Medienerzeugung, TTS und STT. Viele
Chatmodell-Provider (Anthropic, Google, OpenAI und andere) verstehen außerdem
eingehende Medien über ihr Antwortmodell; die vollständige Provider-Liste finden Sie unter
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
**Echtzeit-Sprache** bezeichnet hier Provider-native bidirektionale Echtzeitkommunikation (Talk-
Modus `realtime`, z. B. Gemini Live oder die OpenAI Realtime API) — derzeit
registrieren sie nur Google und OpenAI. Deepgram, ElevenLabs, Mistral, OpenAI und xAI
registrieren separat Streaming-STT für Voice Call (einseitiges Audio-zu-Text); siehe
[Speech-to-Text und Voice Call](#speech-to-text-and-voice-call) weiter unten.
Echtzeit-Sprache von xAI ist eine Upstream-Funktion, wird jedoch erst in
OpenClaw registriert, wenn der gemeinsame Echtzeit-Sprachvertrag sie abbilden kann.
</Note>

## Asynchron und synchron

| Funktion       | Modus       | Grund                                                                                                             |
| -------------- | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| Bild           | Asynchron   | Die Provider-Verarbeitung kann länger als ein Chat-Durchlauf dauern; erzeugte Anhänge verwenden den gemeinsamen Abschlusspfad. |
| Text-to-Speech | Synchron    | Provider-Antworten werden innerhalb von Sekunden zurückgegeben und an die Antwort-Audiodaten angehängt.            |
| Video          | Asynchron   | Die Provider-Verarbeitung dauert 30 s bis mehrere Minuten; langsame Warteschlangen können bis zum konfigurierten Timeout laufen. |
| Musik          | Asynchron   | Weist dieselben Eigenschaften der Provider-Verarbeitung wie Video auf.                                             |

Bei asynchronen Tools sendet OpenClaw die Anfrage an den Provider, gibt sofort eine
Aufgaben-ID zurück und verfolgt den Auftrag im Aufgabenbuch. Der Agent antwortet
weiterhin auf andere Nachrichten, während der Auftrag ausgeführt wird. Sobald der Provider
fertig ist, aktiviert OpenClaw den Agent mit den Pfaden der erzeugten Medien, damit er den
Benutzer über den normalen sichtbaren Antwortmodus der Sitzung informieren kann: automatische
Zustellung der abschließenden Antwort, sofern konfiguriert, oder `message(action="send")`, wenn die
Sitzung das Nachrichten-Tool erfordert. Wenn die anfordernde Sitzung inaktiv ist oder ihre
aktive Aktivierung fehlschlägt und einige erzeugte Medien weiterhin in der Abschlussantwort
fehlen, sendet OpenClaw einen idempotenten direkten Fallback ausschließlich mit den fehlenden
Medien. Bereits durch die Abschlussantwort zugestellte Medien werden nicht erneut veröffentlicht.

## Speech-to-Text und Voice Call

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio und xAI können bei entsprechender Konfiguration eingehende Audiodaten über den
Batch-Pfad `tools.media.audio` transkribieren. Channel-Plugins, die eine
Sprachnachricht vorab auf Erwähnungsfilterung oder Befehlsanalyse prüfen, kennzeichnen den
transkribierten Anhang im eingehenden Kontext, sodass der gemeinsame Durchlauf für
Medienverständnis dieses Transkript wiederverwendet, anstatt für dieselben Audiodaten
einen zweiten STT-Aufruf auszuführen.

Deepgram, ElevenLabs, Mistral, OpenAI und xAI registrieren außerdem
Streaming-STT-Provider für Voice Call, sodass Live-Telefonaudio an den ausgewählten
Provider weitergeleitet werden kann, ohne auf eine abgeschlossene Aufnahme zu warten.

Verwenden Sie für Live-Unterhaltungen mit Benutzern vorzugsweise den [Talk-Modus](/de/nodes/talk).
Batch-Audioanhänge verbleiben im Medienpfad; Browser-Echtzeit, natives Push-to-Talk,
Telefonie und Meeting-Audio sollten Talk-Ereignisse sowie die vom Gateway
zurückgegebenen sitzungsbezogenen Kataloge verwenden.

## Provider-Zuordnungen (Aufteilung der Provider auf Oberflächen)

<AccordionGroup>
  <Accordion title="Google">
    Bild, Video, Musik, Batch-TTS, Batch-STT, Backend-Echtzeit-Sprache und
    Oberflächen für Medienverständnis.
  </Accordion>
  <Accordion title="OpenAI">
    Bild, Video, Batch-TTS, Batch-STT, Streaming-STT für Voice Call, Backend-
    Echtzeit-Sprache und Oberflächen für Memory-Einbettungen.
  </Accordion>
  <Accordion title="DeepInfra">
    Chat-/Modell-Routing, Bilderzeugung/-bearbeitung, Text-zu-Video, Batch-TTS,
    Batch-STT, Medienverständnis für Bilder und Oberflächen für Memory-Einbettungen.
    DeepInfra stellt außerdem Re-Ranking, Klassifizierung, Objekterkennung und
    weitere native Modelltypen bereit; OpenClaw besitzt für diese Kategorien
    noch keinen Provider-Vertrag, daher registriert dieses Plugin sie nicht.
  </Accordion>
  <Accordion title="xAI">
    Bild, Video, Suche, Codeausführung, Batch-TTS, Batch-STT und Streaming-STT
    für Voice Call. Echtzeit-Sprache von xAI ist eine Upstream-Funktion, wird
    jedoch erst in OpenClaw registriert, wenn der gemeinsame Echtzeit-Sprachvertrag
    sie abbilden kann.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Bilderzeugung](/de/tools/image-generation)
- [Videoerzeugung](/de/tools/video-generation)
- [Musikerzeugung](/de/tools/music-generation)
- [Text-to-Speech](/de/tools/tts)
- [Medienverständnis](/de/nodes/media-understanding)
- [Audio-Nodes](/de/nodes/audio)
- [Talk-Modus](/de/nodes/talk)
