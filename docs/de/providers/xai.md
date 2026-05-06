---
read_when:
    - Sie möchten Grok-Modelle in OpenClaw verwenden
    - Sie konfigurieren die xAI-Authentifizierung oder Modell-IDs
summary: Verwenden Sie xAI Grok-Modelle in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-06T07:01:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0e682ba31829faeeb992818aa6a36ab4d18b79723009c5f37559c28160af499
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw liefert ein gebündeltes `xai`-Provider-Plugin für Grok-Modelle aus.

## Erste Schritte

<Steps>
  <Step title="Create an API key">
    Erstellen Sie einen API-Schlüssel in der [xAI-Konsole](https://console.x.ai/).
  </Step>
  <Step title="Set your API key">
    Legen Sie `XAI_API_KEY` fest, oder führen Sie aus:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Pick a model">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw verwendet die xAI Responses API als gebündelten xAI-Transport. Derselbe
`XAI_API_KEY` kann auch Grok-gestützte `web_search`, erstklassige `x_search`
und entfernte `code_execution` bereitstellen.
Wenn Sie einen xAI-Schlüssel unter `plugins.entries.xai.config.webSearch.apiKey` speichern,
verwendet der gebündelte xAI-Modell-Provider diesen Schlüssel ebenfalls als Fallback.
Legen Sie `plugins.entries.xai.config.webSearch.baseUrl` fest, um Grok-`web_search`
und standardmäßig `x_search` über einen xAI-Responses-Proxy des Operators zu routen.
Die Abstimmung von `code_execution` befindet sich unter `plugins.entries.xai.config.codeExecution`.
</Note>

## Integrierter Katalog

OpenClaw enthält diese xAI-Modellfamilien standardmäßig:

| Familie       | Modell-IDs                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Das Plugin löst außerdem neuere `grok-4*`- und `grok-code-fast*`-IDs weiter auf, wenn
sie derselben API-Form folgen.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` und die `grok-4.20-beta-*`-Varianten
sind die aktuellen bildfähigen Grok-Referenzen im gebündelten Katalog.
</Tip>

## OpenClaw-Funktionsabdeckung

Das gebündelte Plugin bildet die aktuelle öffentliche API-Oberfläche von xAI auf die gemeinsamen
Provider- und Tool-Verträge von OpenClaw ab. Funktionen, die nicht in den gemeinsamen Vertrag passen
(zum Beispiel Streaming-TTS und Echtzeit-Sprache), werden nicht bereitgestellt - siehe die Tabelle
unten.

| xAI-Fähigkeit              | OpenClaw-Oberfläche                       | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | `xai/<model>`-Modell-Provider             | Ja                                                                  |
| Serverseitige Websuche     | `web_search`-Provider `grok`              | Ja                                                                  |
| Serverseitige X-Suche      | `x_search`-Tool                           | Ja                                                                  |
| Serverseitige Codeausführung | `code_execution`-Tool                   | Ja                                                                  |
| Bilder                     | `image_generate`                          | Ja                                                                  |
| Videos                     | `video_generate`                          | Ja                                                                  |
| Batch-Text-zu-Sprache      | `messages.tts.provider: "xai"` / `tts`    | Ja                                                                  |
| Streaming-TTS              | -                                         | Nicht bereitgestellt; der TTS-Vertrag von OpenClaw gibt vollständige Audiopuffer zurück |
| Batch-Sprache-zu-Text      | `tools.media.audio` / Medienverständnis   | Ja                                                                  |
| Streaming-Sprache-zu-Text  | Voice Call `streaming.provider: "xai"`    | Ja                                                                  |
| Echtzeit-Sprache           | -                                         | Noch nicht bereitgestellt; anderer Sitzungs-/WebSocket-Vertrag      |
| Dateien / Batches          | Nur generische Modell-API-Kompatibilität  | Kein erstklassiges OpenClaw-Tool                                    |

<Note>
OpenClaw verwendet xAIs REST-APIs für Bild/Video/TTS/STT zur Mediengenerierung,
Sprache und Batch-Transkription, xAIs Streaming-STT-WebSocket für die Live-Transkription
von Sprachanrufen und die Responses API für Modell-, Such- und Codeausführungs-Tools.
Funktionen, die andere OpenClaw-Verträge benötigen, wie etwa
Echtzeit-Sprachsitzungen, werden hier als Upstream-Fähigkeiten dokumentiert und nicht
als verstecktes Plugin-Verhalten.
</Note>

### Fast-Mode-Zuordnungen

`/fast on` oder `agents.defaults.models["xai/<model>"].params.fastMode: true`
schreibt native xAI-Anfragen wie folgt um:

| Quellmodell   | Fast-Mode-Ziel     |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Legacy-Kompatibilitätsaliase

Legacy-Aliase werden weiterhin auf die kanonischen gebündelten IDs normalisiert:

| Legacy-Alias             | Kanonische ID                        |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funktionen

<AccordionGroup>
  <Accordion title="Web search">
    Der gebündelte `grok`-Websuche-Provider verwendet ebenfalls `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video generation">
    Das gebündelte `xai`-Plugin registriert Videogenerierung über das gemeinsame
    `video_generate`-Tool.

    - Standard-Videomodell: `xai/grok-imagine-video`
    - Modi: Text-zu-Video, Bild-zu-Video, Referenzbildgenerierung, entfernte
      Videobearbeitung und entfernte Videoerweiterung
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Auflösungen: `480P`, `720P`
    - Dauer: 1-15 Sekunden für Generierung/Bild-zu-Video, 1-10 Sekunden bei
      Verwendung von `reference_image`-Rollen, 2-10 Sekunden für Erweiterung
    - Referenzbildgenerierung: Setzen Sie `imageRoles` für jedes bereitgestellte Bild auf `reference_image`;
      xAI akzeptiert bis zu 7 solche Bilder

    <Warning>
    Lokale Videopuffer werden nicht akzeptiert. Verwenden Sie entfernte `http(s)`-URLs für
    Eingaben zur Videobearbeitung/-erweiterung. Bild-zu-Video akzeptiert lokale Bildpuffer, weil
    OpenClaw diese für xAI als Daten-URLs codieren kann.
    </Warning>

    Um xAI als Standard-Video-Provider zu verwenden:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter,
    Provider-Auswahl und Failover-Verhalten.
    </Note>

  </Accordion>

  <Accordion title="Image generation">
    Das gebündelte `xai`-Plugin registriert Bildgenerierung über das gemeinsame
    `image_generate`-Tool.

    - Standard-Bildmodell: `xai/grok-imagine-image`
    - Zusätzliches Modell: `xai/grok-imagine-image-pro`
    - Modi: Text-zu-Bild und Referenzbildbearbeitung
    - Referenzeingaben: ein `image` oder bis zu fünf `images`
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Auflösungen: `1K`, `2K`
    - Anzahl: bis zu 4 Bilder

    OpenClaw fordert bei xAI `b64_json`-Bildantworten an, damit generierte Medien
    gespeichert und über den normalen Pfad für Kanal-Anhänge zugestellt werden können. Lokale
    Referenzbilder werden in Daten-URLs konvertiert; entfernte `http(s)`-Referenzen werden
    durchgereicht.

    Um xAI als Standard-Bild-Provider zu verwenden:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI dokumentiert außerdem `quality`, `mask`, `user` und zusätzliche native Seitenverhältnisse
    wie `1:2`, `2:1`, `9:20` und `20:9`. OpenClaw leitet derzeit nur die
    gemeinsamen bildbezogenen Steuerungen über Provider hinweg weiter; nicht unterstützte, nur native Regler
    werden absichtlich nicht über `image_generate` bereitgestellt.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Das gebündelte `xai`-Plugin registriert Text-zu-Sprache über die gemeinsame `tts`-
    Provider-Oberfläche.

    - Stimmen: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Standardstimme: `eve`
    - Formate: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Sprache: BCP-47-Code oder `auto`
    - Geschwindigkeit: Provider-native Geschwindigkeitsüberschreibung
    - Das native Opus-Sprachnotizformat wird nicht unterstützt

    Um xAI als Standard-TTS-Provider zu verwenden:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw verwendet xAIs Batch-Endpunkt `/v1/tts`. xAI bietet außerdem Streaming-TTS
    über WebSocket an, aber der Sprach-Provider-Vertrag von OpenClaw erwartet derzeit
    einen vollständigen Audiopuffer vor der Antwortzustellung.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Das gebündelte `xai`-Plugin registriert Batch-Sprache-zu-Text über OpenClaws
    Transkriptionsoberfläche für Medienverständnis.

    - Standardmodell: `grok-stt`
    - Endpunkt: xAI REST `/v1/stt`
    - Eingabepfad: Multipart-Audiodatei-Upload
    - Unterstützt von OpenClaw überall dort, wo eingehende Audiotranskription
      `tools.media.audio` verwendet, einschließlich Discord-Sprachkanalsegmenten und
      Kanal-Audioanhängen

    Um xAI für eingehende Audiotranskription zu erzwingen:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    Die Sprache kann über die gemeinsame Audio-Medienkonfiguration oder pro Aufruf über die
    Transkriptionsanforderung bereitgestellt werden. Prompt-Hinweise werden von der gemeinsamen OpenClaw-
    Oberfläche akzeptiert, aber die xAI-REST-STT-Integration leitet nur Datei, Modell und
    Sprache weiter, weil diese sauber auf den aktuellen öffentlichen xAI-Endpunkt abbildbar sind.

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    Das gebündelte `xai`-Plugin registriert außerdem einen Echtzeit-Transkriptions-Provider
    für Live-Sprachanruf-Audio.

    - Endpunkt: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Standardcodierung: `mulaw`
    - Standardabtastrate: `8000`
    - Standard-Endpointing: `800ms`
    - Zwischen-Transkripte: standardmäßig aktiviert

    Der Twilio-Medienstream von Voice Call sendet G.711-µ-law-Audioframes, sodass der
    xAI-Provider diese Frames direkt ohne Transcodierung weiterleiten kann:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    Provider-eigene Konfiguration liegt unter
    `plugins.entries.voice-call.config.streaming.providers.xai`. Unterstützte
    Schlüssel sind `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` oder
    `alaw`), `interimResults`, `endpointingMs` und `language`.

    <Note>
    Dieser Streaming-Provider ist für den Echtzeit-Transkriptionspfad von Voice Call vorgesehen.
    Discord Voice zeichnet derzeit kurze Segmente auf und verwendet stattdessen den Batch-
    Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="x_search-Konfiguration">
    Das gebündelte xAI-Plugin stellt `x_search` als OpenClaw-Tool zum Durchsuchen
    von X-Inhalten (ehemals Twitter) über Grok bereit.

    Konfigurationspfad: `plugins.entries.xai.config.xSearch`

    | Schlüssel          | Typ     | Standardwert       | Beschreibung                              |
    | ------------------ | ------- | ------------------ | ----------------------------------------- |
    | `enabled`          | boolean | -                  | x_search aktivieren oder deaktivieren     |
    | `model`            | string  | `grok-4-1-fast`    | Für x_search-Anfragen verwendetes Modell  |
    | `baseUrl`          | string  | -                  | Überschreibung der Basis-URL für xAI Responses |
    | `inlineCitations`  | boolean | -                  | Inline-Zitationen in Ergebnissen einschließen |
    | `maxTurns`         | number  | -                  | Maximale Gesprächsrunden                  |
    | `timeoutSeconds`   | number  | -                  | Anfrage-Timeout in Sekunden               |
    | `cacheTtlMinutes`  | number  | -                  | Cache-Gültigkeitsdauer in Minuten         |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Konfiguration der Codeausführung">
    Das gebündelte xAI-Plugin stellt `code_execution` als OpenClaw-Tool für
    Remote-Codeausführung in der Sandbox-Umgebung von xAI bereit.

    Konfigurationspfad: `plugins.entries.xai.config.codeExecution`

    | Schlüssel         | Typ     | Standardwert       | Beschreibung                              |
    | ----------------- | ------- | ------------------ | ----------------------------------------- |
    | `enabled`         | boolean | `true` (wenn Schlüssel verfügbar) | Codeausführung aktivieren oder deaktivieren |
    | `model`           | string  | `grok-4-1-fast`    | Für Codeausführungsanfragen verwendetes Modell |
    | `maxTurns`        | number  | -                  | Maximale Gesprächsrunden                  |
    | `timeoutSeconds`  | number  | -                  | Anfrage-Timeout in Sekunden               |

    <Note>
    Dies ist Remote-Ausführung in der xAI-Sandbox, nicht lokales [`exec`](/de/tools/exec).
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bekannte Einschränkungen">
    - Die Authentifizierung erfolgt derzeit nur per API-Schlüssel. Es gibt in
      OpenClaw noch keinen xAI-OAuth- oder Device-Code-Flow.
    - `grok-4.20-multi-agent-experimental-beta-0304` wird auf dem
      normalen xAI-Provider-Pfad nicht unterstützt, weil es eine andere Upstream-API-
      Oberfläche erfordert als der standardmäßige OpenClaw-xAI-Transport.
    - xAI Realtime Voice ist noch nicht als OpenClaw-Provider registriert. Es
      benötigt einen anderen bidirektionalen Voice-Session-Vertrag als Batch-STT oder
      Streaming-Transkription.
    - xAI-Bild-`quality`, Bild-`mask` und zusätzliche nur nativ verfügbare Seitenverhältnisse werden
      erst offengelegt, wenn das gemeinsame Tool `image_generate` entsprechende
      providerübergreifende Steuerelemente hat.
  </Accordion>

  <Accordion title="Erweiterte Hinweise">
    - OpenClaw wendet xAI-spezifische Kompatibilitätskorrekturen für Tool-Schemas und Tool-Aufrufe
      automatisch auf dem gemeinsamen Runner-Pfad an.
    - Native xAI-Anfragen verwenden standardmäßig `tool_stream: true`. Setzen Sie
      `agents.defaults.models["xai/<model>"].params.tool_stream` auf `false`, um
      dies zu deaktivieren.
    - Der gebündelte xAI-Wrapper entfernt nicht unterstützte Strict-Tool-Schema-Flags und
      Reasoning-Payload-Schlüssel, bevor native xAI-Anfragen gesendet werden.
    - `web_search`, `x_search` und `code_execution` werden als OpenClaw-
      Tools bereitgestellt. OpenClaw aktiviert das jeweils benötigte spezifische integrierte xAI-Tool
      innerhalb jeder Tool-Anfrage, anstatt alle nativen Tools an jede Chat-Runde anzuhängen.
    - Grok `web_search` liest `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` liest `plugins.entries.xai.config.xSearch.baseUrl` und
      fällt dann auf die Basis-URL der Grok-Websuche zurück.
    - `x_search` und `code_execution` gehören dem gebündelten xAI-Plugin,
      statt fest in die Core-Modelllaufzeit codiert zu sein.
    - `code_execution` ist Remote-Ausführung in der xAI-Sandbox, nicht lokales
      [`exec`](/de/tools/exec).
  </Accordion>
</AccordionGroup>

## Live-Tests

Die xAI-Medienpfade werden durch Unit-Tests und optionale Live-Suites abgedeckt. Die Live-
Befehle laden Secrets aus Ihrer Login-Shell, einschließlich `~/.profile`, bevor
sie `XAI_API_KEY` prüfen.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Die Provider-spezifische Live-Datei synthetisiert normales TTS, telefoniefreundliches PCM-
TTS, transkribiert Audio über xAI-Batch-STT, streamt dasselbe PCM über xAI-
Realtime-STT, generiert Text-zu-Bild-Ausgabe und bearbeitet ein Referenzbild. Die
gemeinsame Bild-Live-Datei überprüft denselben xAI-Provider über den
OpenClaw-Pfad für Laufzeitauswahl, Fallback, Normalisierung und Medienanhänge.

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Videotool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Alle Provider" href="/de/providers/index" icon="grid-2">
    Die umfassendere Provider-Übersicht.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Korrekturen.
  </Card>
</CardGroup>
