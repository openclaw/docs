---
read_when:
    - Sie möchten Grok-Modelle in OpenClaw verwenden
    - Sie konfigurieren xAI-Authentifizierung oder Modell-IDs
summary: Verwenden Sie xAI Grok-Modelle in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-02T06:44:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw wird mit einem gebündelten `xai`-Provider-Plugin für Grok-Modelle ausgeliefert.

## Erste Schritte

<Steps>
  <Step title="Create an API key">
    Erstellen Sie einen API-Schlüssel in der [xAI-Konsole](https://console.x.ai/).
  </Step>
  <Step title="Set your API key">
    Legen Sie `XAI_API_KEY` fest, oder führen Sie Folgendes aus:

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
`XAI_API_KEY` kann auch Grok-gestütztes `web_search`, erstklassiges `x_search`
und entfernte `code_execution` betreiben.
Wenn Sie einen xAI-Schlüssel unter `plugins.entries.xai.config.webSearch.apiKey` speichern,
verwendet der gebündelte xAI-Modell-Provider diesen Schlüssel ebenfalls als Fallback.
Setzen Sie `plugins.entries.xai.config.webSearch.baseUrl`, um Grok-`web_search`
und standardmäßig `x_search` über einen Betreiber-Proxy für xAI Responses zu leiten.
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

Das Plugin löst außerdem neuere IDs vom Typ `grok-4*` und `grok-code-fast*` weiter auf, wenn
sie derselben API-Struktur folgen.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` und die Varianten `grok-4.20-beta-*`
sind die aktuellen bildfähigen Grok-Referenzen im gebündelten Katalog.
</Tip>

## OpenClaw-Funktionsabdeckung

Das gebündelte Plugin ordnet die aktuelle öffentliche API-Oberfläche von xAI den gemeinsamen
Provider- und Tool-Verträgen von OpenClaw zu. Funktionen, die nicht in den gemeinsamen Vertrag passen
(zum Beispiel Streaming-TTS und Echtzeit-Sprache), werden nicht bereitgestellt — siehe die Tabelle
unten.

| xAI-Funktion               | OpenClaw-Oberfläche                       | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | `xai/<model>`-Modell-Provider             | Ja                                                                  |
| Serverseitige Websuche     | `web_search`-Provider `grok`              | Ja                                                                  |
| Serverseitige X-Suche      | `x_search`-Tool                           | Ja                                                                  |
| Serverseitige Codeausführung | `code_execution`-Tool                   | Ja                                                                  |
| Bilder                     | `image_generate`                          | Ja                                                                  |
| Videos                     | `video_generate`                          | Ja                                                                  |
| Batch-Text-to-Speech       | `messages.tts.provider: "xai"` / `tts`    | Ja                                                                  |
| Streaming-TTS              | —                                         | Nicht bereitgestellt; der TTS-Vertrag von OpenClaw gibt vollständige Audiopuffer zurück |
| Batch-Speech-to-Text       | `tools.media.audio` / Medienverständnis   | Ja                                                                  |
| Streaming-Speech-to-Text   | Voice Call `streaming.provider: "xai"`    | Ja                                                                  |
| Echtzeit-Sprache           | —                                         | Noch nicht bereitgestellt; anderer Sitzungs-/WebSocket-Vertrag      |
| Dateien / Batches          | Nur generische Modell-API-Kompatibilität  | Kein erstklassiges OpenClaw-Tool                                     |

<Note>
OpenClaw verwendet die REST-APIs von xAI für Bild/Video/TTS/STT für Mediengenerierung,
Sprache und Batch-Transkription, den Streaming-STT-WebSocket von xAI für Live-
Voice-Call-Transkription und die Responses API für Modell-, Such- und
Codeausführungs-Tools. Funktionen, die andere OpenClaw-Verträge benötigen, wie
Echtzeit-Sprachsitzungen, werden hier als Upstream-Funktionen dokumentiert und
nicht als verstecktes Plugin-Verhalten.
</Note>

### Zuordnungen für den Schnellmodus

`/fast on` oder `agents.defaults.models["xai/<model>"].params.fastMode: true`
schreibt native xAI-Anfragen wie folgt um:

| Quellmodell   | Ziel im Schnellmodus |
| ------------- | -------------------- |
| `grok-3`      | `grok-3-fast`        |
| `grok-3-mini` | `grok-3-mini-fast`   |
| `grok-4`      | `grok-4-fast`        |
| `grok-4-0709` | `grok-4-fast`        |

### Legacy-Kompatibilitätsaliase

Legacy-Aliase werden weiterhin auf die kanonischen gebündelten IDs normalisiert:

| Legacy-Alias             | Kanonische ID                         |
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
    - Referenzbildgenerierung: Setzen Sie `imageRoles` für jedes bereitgestellte
      Bild auf `reference_image`; xAI akzeptiert bis zu 7 solcher Bilder

    <Warning>
    Lokale Videopuffer werden nicht akzeptiert. Verwenden Sie entfernte `http(s)`-URLs für
    Eingaben zur Videobearbeitung/-erweiterung. Bild-zu-Video akzeptiert lokale Bildpuffer, weil
    OpenClaw diese für xAI als Daten-URLs codieren kann.
    </Warning>

    So verwenden Sie xAI als Standard-Video-Provider:

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

    OpenClaw fordert von xAI `b64_json`-Bildantworten an, damit generierte Medien über den
    normalen Kanal-Anhangspfad gespeichert und ausgeliefert werden können. Lokale
    Referenzbilder werden in Daten-URLs umgewandelt; entfernte `http(s)`-Referenzen werden
    unverändert weitergereicht.

    So verwenden Sie xAI als Standard-Bild-Provider:

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
    gemeinsamen Provider-übergreifenden Bildsteuerungen weiter; nicht unterstützte, rein native Regler
    werden absichtlich nicht über `image_generate` bereitgestellt.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Das gebündelte `xai`-Plugin registriert Text-to-Speech über die gemeinsame `tts`-
    Provider-Oberfläche.

    - Stimmen: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Standardstimme: `eve`
    - Formate: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Sprache: BCP-47-Code oder `auto`
    - Geschwindigkeit: provider-native Geschwindigkeitsüberschreibung
    - Natives Opus-Sprachnotizformat wird nicht unterstützt

    So verwenden Sie xAI als Standard-TTS-Provider:

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
    OpenClaw verwendet den Batch-Endpunkt `/v1/tts` von xAI. xAI bietet auch Streaming-TTS
    über WebSocket an, aber der OpenClaw-Sprach-Provider-Vertrag erwartet derzeit
    einen vollständigen Audiopuffer vor der Zustellung der Antwort.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Das gebündelte `xai`-Plugin registriert Batch-Speech-to-Text über die
    Transkriptionsoberfläche für Medienverständnis von OpenClaw.

    - Standardmodell: `grok-stt`
    - Endpunkt: xAI REST `/v1/stt`
    - Eingabepfad: Multipart-Audiodatei-Upload
    - Unterstützt durch OpenClaw überall dort, wo die Transkription eingehender Audiodaten
      `tools.media.audio` verwendet, einschließlich Discord-Sprachkanal-Segmenten und
      Kanal-Audioanhängen

    So erzwingen Sie xAI für eingehende Audiotranskription:

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

    Die Sprache kann über die gemeinsame Audiomedienkonfiguration oder pro Aufruf über die
    Transkriptionsanfrage bereitgestellt werden. Prompt-Hinweise werden von der gemeinsamen OpenClaw-
    Oberfläche akzeptiert, aber die xAI-REST-STT-Integration leitet nur Datei, Modell und
    Sprache weiter, weil diese sauber dem aktuellen öffentlichen xAI-Endpunkt entsprechen.

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    Das gebündelte `xai`-Plugin registriert außerdem einen Echtzeit-Transkriptions-Provider
    für Live-Voice-Call-Audio.

    - Endpunkt: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Standardcodierung: `mulaw`
    - Standard-Abtastrate: `8000`
    - Standard-Endpunkterkennung: `800ms`
    - Zwischen-Transkripte: standardmäßig aktiviert

    Der Twilio-Medienstream von Voice Call sendet G.711-µ-law-Audioframes, daher kann der
    xAI-Provider diese Frames ohne Transcodierung direkt weiterleiten:

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
    Dieser Streaming-Provider ist für den Echtzeit-Transkriptionspfad von Voice Call.
    Discord-Sprachfunktion zeichnet derzeit kurze Segmente auf und verwendet stattdessen
    den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="x_search-Konfiguration">
    Das gebündelte xAI-Plugin stellt `x_search` als OpenClaw-Tool zum Durchsuchen
    von X-Inhalten (ehemals Twitter) über Grok bereit.

    Konfigurationspfad: `plugins.entries.xai.config.xSearch`

    | Schlüssel          | Typ     | Standard           | Beschreibung                         |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | x_search aktivieren oder deaktivieren |
    | `model`            | string  | `grok-4-1-fast`    | Für x_search-Anfragen verwendetes Modell |
    | `baseUrl`          | string  | —                  | Überschreibung der xAI Responses-Basis-URL |
    | `inlineCitations`  | boolean | —                  | Inline-Zitationen in Ergebnisse einschließen |
    | `maxTurns`         | number  | —                  | Maximale Konversationsrunden         |
    | `timeoutSeconds`   | number  | —                  | Anfrage-Timeout in Sekunden          |
    | `cacheTtlMinutes`  | number  | —                  | Cache-Lebensdauer in Minuten         |

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

    | Schlüssel         | Typ     | Standard           | Beschreibung                         |
    | ----------------- | ------- | ------------------ | ------------------------------------ |
    | `enabled`         | boolean | `true` (falls Schlüssel verfügbar) | Codeausführung aktivieren oder deaktivieren |
    | `model`           | string  | `grok-4-1-fast`    | Für Codeausführungsanfragen verwendetes Modell |
    | `maxTurns`        | number  | —                  | Maximale Konversationsrunden         |
    | `timeoutSeconds`  | number  | —                  | Anfrage-Timeout in Sekunden          |

    <Note>
    Dies ist Remote-xAI-Sandbox-Ausführung, nicht lokales [`exec`](/de/tools/exec).
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
    - Authentifizierung erfolgt heute nur per API-Schlüssel. Es gibt in
      OpenClaw noch keinen xAI-OAuth- oder Device-Code-Ablauf.
    - `grok-4.20-multi-agent-experimental-beta-0304` wird im normalen
      xAI-Provider-Pfad nicht unterstützt, weil es eine andere Upstream-API-Oberfläche
      als der standardmäßige OpenClaw-xAI-Transport erfordert.
    - xAI Realtime Voice ist noch nicht als OpenClaw-Provider registriert. Es
      benötigt einen anderen bidirektionalen Voice-Session-Vertrag als Batch-STT oder
      Streaming-Transkription.
    - xAI-Bild-`quality`, Bild-`mask` und zusätzliche, nur nativ verfügbare Seitenverhältnisse werden
      erst offengelegt, wenn das gemeinsame `image_generate`-Tool entsprechende
      Provider-übergreifende Steuerelemente hat.
  </Accordion>

  <Accordion title="Erweiterte Hinweise">
    - OpenClaw wendet xAI-spezifische Kompatibilitätskorrekturen für Tool-Schemas und Tool-Calls
      automatisch im gemeinsamen Runner-Pfad an.
    - Native xAI-Anfragen verwenden standardmäßig `tool_stream: true`. Setzen Sie
      `agents.defaults.models["xai/<model>"].params.tool_stream` auf `false`, um
      es zu deaktivieren.
    - Der gebündelte xAI-Wrapper entfernt nicht unterstützte strikte Tool-Schema-Flags und
      Reasoning-Payload-Schlüssel, bevor native xAI-Anfragen gesendet werden.
    - `web_search`, `x_search` und `code_execution` werden als OpenClaw-Tools
      bereitgestellt. OpenClaw aktiviert das jeweilige benötigte xAI-Built-in innerhalb jeder Tool-Anfrage,
      statt alle nativen Tools an jeden Chat-Turn anzuhängen.
    - Grok `web_search` liest `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` liest `plugins.entries.xai.config.xSearch.baseUrl` und fällt dann
      auf die Grok-Web-Search-Basis-URL zurück.
    - `x_search` und `code_execution` gehören zum gebündelten xAI-Plugin und sind
      nicht fest in die Core-Modelllaufzeit codiert.
    - `code_execution` ist Remote-xAI-Sandbox-Ausführung, nicht lokales
      [`exec`](/de/tools/exec).
  </Accordion>
</AccordionGroup>

## Live-Tests

Die xAI-Medienpfade werden durch Unit-Tests und optionale Live-Suites abgedeckt. Die Live-
Befehle laden Secrets aus Ihrer Login-Shell, einschließlich `~/.profile`, bevor
`XAI_API_KEY` geprüft wird.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Die Provider-spezifische Live-Datei synthetisiert normales TTS, telefoniefreundliches PCM-
TTS, transkribiert Audio über xAI-Batch-STT, streamt dasselbe PCM durch xAI-
Realtime-STT, erzeugt Text-zu-Bild-Ausgabe und bearbeitet ein Referenzbild. Die
gemeinsame Bild-Live-Datei überprüft denselben xAI-Provider über OpenClaws
Laufzeitauswahl, Fallback, Normalisierung und Medienanhangspfad.

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Video-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Alle Provider" href="/de/providers/index" icon="grid-2">
    Die umfassendere Provider-Übersicht.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Lösungen.
  </Card>
</CardGroup>
