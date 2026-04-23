---
read_when:
    - Sie möchten Grok-Modelle in OpenClaw verwenden
    - Sie konfigurieren xAI-Authentifizierung oder Modell-IDs
summary: xAI-Grok-Modelle in OpenClaw verwenden
title: xAI
x-i18n:
    generated_at: "2026-04-23T06:34:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a9fd184bab6f7ab363487332752141212a89c7380f6f91a659c78bcc470c9b
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw liefert ein gebündeltes Provider-Plugin `xai` für Grok-Modelle mit.

## Erste Schritte

<Steps>
  <Step title="Einen API-Key erstellen">
    Erstellen Sie einen API-Key in der [xAI-Konsole](https://console.x.ai/).
  </Step>
  <Step title="Ihren API-Key setzen">
    Setzen Sie `XAI_API_KEY` oder führen Sie aus:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Ein Modell auswählen">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw verwendet die xAI Responses API als gebündelten xAI-Transport. Derselbe
`XAI_API_KEY` kann auch Grok-gestützte `web_search`, erstklassige `x_search` und entfernte `code_execution` versorgen.
Wenn Sie einen xAI-Schlüssel unter `plugins.entries.xai.config.webSearch.apiKey`
speichern, verwendet der gebündelte xAI-Modell-Provider diesen Schlüssel ebenfalls als Fallback.
Die Feinabstimmung von `code_execution` befindet sich unter `plugins.entries.xai.config.codeExecution`.
</Note>

## Gebündelter Modellkatalog

OpenClaw enthält diese xAI-Modellfamilien standardmäßig:

| Familie        | Modell-IDs                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Das Plugin löst außerdem neuere IDs `grok-4*` und `grok-code-fast*` vorwärts auf, wenn
sie derselben API-Form folgen.

<Tip>
`grok-4-fast`, `grok-4-1-fast` und die Varianten `grok-4.20-beta-*` sind die
aktuellen bildfähigen Grok-Referenzen im gebündelten Katalog.
</Tip>

## OpenClaw-Feature-Abdeckung

Das gebündelte Plugin bildet die aktuelle öffentliche API-Oberfläche von xAI auf die gemeinsamen
Provider- und Tool-Verträge von OpenClaw ab, wo das Verhalten sauber passt.

| xAI-Fähigkeit              | OpenClaw-Oberfläche                      | Status                                                              |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | Modell-Provider `xai/<model>`            | Ja                                                                  |
| Serverseitige Web-Suche    | `web_search`-Provider `grok`             | Ja                                                                  |
| Serverseitige X-Suche      | Tool `x_search`                          | Ja                                                                  |
| Serverseitige Codeausführung | Tool `code_execution`                  | Ja                                                                  |
| Bilder                     | `image_generate`                         | Ja                                                                  |
| Videos                     | `video_generate`                         | Ja                                                                  |
| Batch-Text-zu-Sprache      | `messages.tts.provider: "xai"` / `tts`   | Ja                                                                  |
| Streaming-TTS              | —                                        | Nicht verfügbar; der TTS-Vertrag von OpenClaw gibt vollständige Audiopuffer zurück |
| Batch-Sprache-zu-Text      | `tools.media.audio` / Medienverständnis  | Ja                                                                  |
| Streaming-Sprache-zu-Text  | Voice Call `streaming.provider: "xai"`   | Ja                                                                  |
| Echtzeitstimme             | —                                        | Noch nicht verfügbar; anderer Sitzungs-/WebSocket-Vertrag          |
| Dateien / Batches          | Nur generische Modell-API-Kompatibilität | Kein erstklassiges OpenClaw-Tool                                    |

<Note>
OpenClaw verwendet die REST-APIs von xAI für Bild/Video/TTS/STT für Mediengenerierung,
Sprache und Batch-Transkription, das Streaming-STT-WebSocket von xAI für Live-
Transkription bei Sprachanrufen und die Responses API für Modell-, Such- und
Tools zur Codeausführung. Features, die andere OpenClaw-Verträge benötigen, wie
Echtzeitstimmensitzungen, werden hier als Upstream-Fähigkeiten dokumentiert
statt als verborgenes Plugin-Verhalten.
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

### Veraltete Kompatibilitäts-Aliasse

Veraltete Aliasse werden weiterhin auf die kanonischen gebündelten IDs normalisiert:

| Veralteter Alias          | Kanonische ID                         |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funktionen

<AccordionGroup>
  <Accordion title="Web-Suche">
    Der gebündelte `grok`-Provider für Web-Suche verwendet ebenfalls `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Videogenerierung">
    Das gebündelte `xai`-Plugin registriert Videogenerierung über das gemeinsame
    Tool `video_generate`.

    - Standard-Videomodell: `xai/grok-imagine-video`
    - Modi: Text-zu-Video, Bild-zu-Video, entfernte Videobearbeitung und entfernte Video-
      Erweiterung
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Auflösungen: `480P`, `720P`
    - Dauer: 1–15 Sekunden für Generierung/Bild-zu-Video, 2–10 Sekunden für
      Erweiterung

    <Warning>
    Lokale Videopuffer werden nicht akzeptiert. Verwenden Sie entfernte `http(s)`-URLs für
    Eingaben zur Videobearbeitung/-erweiterung. Bild-zu-Video akzeptiert lokale Bildpuffer, weil
    OpenClaw diese für xAI als Data-URLs kodieren kann.
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

  <Accordion title="Bildgenerierung">
    Das gebündelte `xai`-Plugin registriert Bildgenerierung über das gemeinsame
    Tool `image_generate`.

    - Standard-Bildmodell: `xai/grok-imagine-image`
    - Zusätzliches Modell: `xai/grok-imagine-image-pro`
    - Modi: Text-zu-Bild und Bearbeitung mit Referenzbild
    - Referenzeingaben: ein `image` oder bis zu fünf `images`
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Auflösungen: `1K`, `2K`
    - Anzahl: bis zu 4 Bilder

    OpenClaw fordert bei xAI Bildantworten im Format `b64_json` an, damit generierte Medien
    über den normalen Pfad für Kanalanhänge gespeichert und zugestellt werden können. Lokale
    Referenzbilder werden in Data-URLs umgewandelt; entfernte Referenzen per `http(s)` werden
    durchgereicht.

    Um xAI als Standard-Provider für Bilder zu verwenden:

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
    xAI dokumentiert auch `quality`, `mask`, `user` und zusätzliche native Verhältnisse
    wie `1:2`, `2:1`, `9:20` und `20:9`. OpenClaw leitet derzeit nur die
    gemeinsamen providerübergreifenden Steuerungen für Bilder weiter; nicht unterstützte rein native Regler
    werden bewusst nicht über `image_generate` bereitgestellt.
    </Note>

  </Accordion>

  <Accordion title="Text-zu-Sprache">
    Das gebündelte `xai`-Plugin registriert Text-zu-Sprache über die gemeinsame `tts`-
    Provider-Oberfläche.

    - Stimmen: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Standardstimme: `eve`
    - Formate: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Sprache: BCP-47-Code oder `auto`
    - Geschwindigkeit: nativer Geschwindigkeits-Override des Providers
    - Das native Opus-Sprachnachrichtenformat wird nicht unterstützt

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
    OpenClaw verwendet den Batch-Endpunkt `/v1/tts` von xAI. xAI bietet auch Streaming-TTS
    über WebSocket an, aber der Vertrag für Sprach-Provider in OpenClaw erwartet derzeit
    einen vollständigen Audiopuffer vor der Zustellung der Antwort.
    </Note>

  </Accordion>

  <Accordion title="Sprache-zu-Text">
    Das gebündelte `xai`-Plugin registriert Batch-Sprache-zu-Text über die
    Transkriptionsoberfläche des Medienverständnisses von OpenClaw.

    - Standardmodell: `grok-stt`
    - Endpunkt: xAI-REST `/v1/stt`
    - Eingabepfad: Multipart-Upload einer Audiodatei
    - Unterstützt von OpenClaw überall dort, wo eingehende Audiotranskription
      `tools.media.audio` verwendet, einschließlich Discord-Sprachkanalsegmenten und
      Audioanhängen in Kanälen

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

    Die Sprache kann über die gemeinsame Audio-Medienkonfiguration oder pro Aufruf
    der Transkriptionsanfrage angegeben werden. Prompt-Hinweise werden von der gemeinsamen OpenClaw-
    Oberfläche akzeptiert, aber die xAI-REST-STT-Integration leitet nur Datei, Modell und
    Sprache weiter, weil diese sauber auf den aktuellen öffentlichen xAI-Endpunkt abgebildet werden.

  </Accordion>

  <Accordion title="Streaming-Sprache-zu-Text">
    Das gebündelte `xai`-Plugin registriert außerdem einen Provider für Echtzeit-Transkription
    für Live-Audio bei Sprachanrufen.

    - Endpunkt: xAI-WebSocket `wss://api.x.ai/v1/stt`
    - Standard-Kodierung: `mulaw`
    - Standard-Abtastrate: `8000`
    - Standard-Endpointing: `800ms`
    - Zwischenabschriften: standardmäßig aktiviert

    Der Twilio-Medienstream von Voice Call sendet G.711-µ-law-Audioframes, sodass der
    xAI-Provider diese Frames ohne Transkodierung direkt weiterleiten kann:

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
    Dieser Streaming-Provider ist für den Pfad der Echtzeit-Transkription von Voice Call.
    Discord-Voice zeichnet derzeit kurze Segmente auf und verwendet stattdessen den Batch-
    Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="x_search-Konfiguration">
    Das gebündelte xAI-Plugin stellt `x_search` als OpenClaw-Tool für die Suche in
    X-Inhalten (ehemals Twitter) über Grok bereit.

    Konfigurationspfad: `plugins.entries.xai.config.xSearch`

    | Schlüssel           | Typ     | Standard           | Beschreibung                          |
    | ------------------ | ------- | ------------------ | ------------------------------------- |
    | `enabled`          | boolean | —                  | `x_search` aktivieren oder deaktivieren |
    | `model`            | string  | `grok-4-1-fast`    | Für `x_search`-Anfragen verwendetes Modell |
    | `inlineCitations`  | boolean | —                  | Inline-Zitate in Ergebnisse aufnehmen |
    | `maxTurns`         | number  | —                  | Maximale Anzahl von Gesprächsdurchläufen |
    | `timeoutSeconds`   | number  | —                  | Anfrage-Timeout in Sekunden           |
    | `cacheTtlMinutes`  | number  | —                  | Cache-Time-to-Live in Minuten         |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
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
    entfernte Codeausführung in der Sandbox-Umgebung von xAI bereit.

    Konfigurationspfad: `plugins.entries.xai.config.codeExecution`

    | Schlüssel          | Typ     | Standard                 | Beschreibung                               |
    | ------------------ | ------- | ------------------------ | ------------------------------------------ |
    | `enabled`          | boolean | `true` (wenn Schlüssel verfügbar) | Codeausführung aktivieren oder deaktivieren |
    | `model`            | string  | `grok-4-1-fast`          | Für Codeausführungsanfragen verwendetes Modell |
    | `maxTurns`         | number  | —                        | Maximale Anzahl von Gesprächsdurchläufen   |
    | `timeoutSeconds`   | number  | —                        | Anfrage-Timeout in Sekunden                |

    <Note>
    Dies ist entfernte xAI-Sandbox-Ausführung, nicht lokales [`exec`](/de/tools/exec).
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
    - Auth erfolgt derzeit nur per API-Key. Es gibt in OpenClaw noch keinen xAI-OAuth- oder Device-Code-Flow.
    - `grok-4.20-multi-agent-experimental-beta-0304` wird auf dem normalen
      xAI-Provider-Pfad nicht unterstützt, weil es eine andere Upstream-API-
      Oberfläche als der Standard-xAI-Transport von OpenClaw erfordert.
    - xAI-Realtime-Voice ist noch nicht als OpenClaw-Provider registriert. Es
      benötigt einen anderen bidirektionalen Sprachsitzungsvertrag als Batch-STT oder
      Streaming-Transkription.
    - xAI-Bild-`quality`, Bild-`mask` und zusätzliche rein native Seitenverhältnisse werden
      nicht bereitgestellt, bis das gemeinsame Tool `image_generate` entsprechende
      providerübergreifende Steuerungen hat.
  </Accordion>

  <Accordion title="Erweiterte Hinweise">
    - OpenClaw wendet xAI-spezifische Korrekturen für Tool-Schema- und Tool-Call-Kompatibilität
      automatisch auf dem gemeinsamen Runner-Pfad an.
    - Native xAI-Anfragen verwenden standardmäßig `tool_stream: true`. Setzen Sie
      `agents.defaults.models["xai/<model>"].params.tool_stream` auf `false`, um
      dies zu deaktivieren.
    - Der gebündelte xAI-Wrapper entfernt nicht unterstützte strikte Tool-Schema-Flags und
      Reasoning-Payload-Schlüssel, bevor native xAI-Anfragen gesendet werden.
    - `web_search`, `x_search` und `code_execution` werden als OpenClaw-
      Tools bereitgestellt. OpenClaw aktiviert das jeweils benötigte spezifische integrierte xAI-Tool in jeder Tool-
      Anfrage, statt alle nativen Tools an jeden Chat-Durchlauf anzuhängen.
    - `x_search` und `code_execution` gehören dem gebündelten xAI-Plugin, statt
      fest im Core-Modell-Runtime hartcodiert zu sein.
    - `code_execution` ist entfernte xAI-Sandbox-Ausführung, nicht lokales
      [`exec`](/de/tools/exec).
  </Accordion>
</AccordionGroup>

## Live-Tests

Die xAI-Medienpfade sind durch Unit-Tests und Opt-in-Live-Suites abgedeckt. Die Live-
Befehle laden Secrets aus Ihrer Login-Shell, einschließlich `~/.profile`, bevor
`XAI_API_KEY` geprüft wird.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Die providerspezifische Live-Datei synthetisiert normales TTS, für Telefonie geeignetes PCM-
TTS, transkribiert Audio über xAI-Batch-STT, streamt dasselbe PCM über xAI-
Realtime-STT, erzeugt Text-zu-Bild-Ausgabe und bearbeitet ein Referenzbild. Die
gemeinsame Image-Live-Datei verifiziert denselben xAI-Provider über Auswahl,
Fallback, Normalisierung und Medienanhangspfad der OpenClaw-Laufzeit.

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Videotool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Alle Provider" href="/de/providers/index" icon="grid-2">
    Die umfassendere Provider-Übersicht.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Fehlerbehebungen.
  </Card>
</CardGroup>
