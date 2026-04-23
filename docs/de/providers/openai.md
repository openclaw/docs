---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten Authentifizierung per Codex-Abonnement statt per API-Schlüssel verwenden
    - Sie benötigen strengeres Agent-Ausführungsverhalten für GPT-5
summary: OpenAI über API-Schlüssel oder Codex-Abonnement in OpenClaw verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T06:34:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775a937680731ff09181dd58d2be1ca1a751c9193ac299ba6657266490a6a9b7
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI bietet Entwickler-APIs für GPT-Modelle. OpenClaw unterstützt zwei Authentifizierungswege:

  - **API-Schlüssel** — direkter Zugriff auf die OpenAI-Platform mit nutzungsbasierter Abrechnung (`openai/*`-Modelle)
  - **Codex-Abonnement** — ChatGPT-/Codex-Anmeldung mit abonnementbasiertem Zugriff (`openai-codex/*`-Modelle)

  OpenAI unterstützt ausdrücklich die Nutzung von Subscription-OAuth in externen Tools und Workflows wie OpenClaw.

  ## OpenClaw-Funktionsabdeckung

  | OpenAI-Capability         | OpenClaw-Oberfläche                        | Status                                                 |
  | ------------------------- | ------------------------------------------ | ------------------------------------------------------ |
  | Chat / Responses          | `openai/<model>`-Modell-Provider           | Ja                                                     |
  | Codex-Abonnement-Modelle  | `openai-codex/<model>`-Modell-Provider     | Ja                                                     |
  | Serverseitige Websuche    | Natives OpenAI-Responses-Tool              | Ja, wenn Websuche aktiviert ist und kein Provider angeheftet ist |
  | Bilder                    | `image_generate`                           | Ja                                                     |
  | Videos                    | `video_generate`                           | Ja                                                     |
  | Text-to-Speech            | `messages.tts.provider: "openai"` / `tts`  | Ja                                                     |
  | Batch-Speech-to-Text      | `tools.media.audio` / Medienverständnis    | Ja                                                     |
  | Streaming-Speech-to-Text  | Voice Call `streaming.provider: "openai"`  | Ja                                                     |
  | Echtzeitstimme            | Voice Call `realtime.provider: "openai"`   | Ja                                                     |
  | Embeddings                | Speicher-Embedding-Provider                | Ja                                                     |

  ## Erste Schritte

  Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Setup-Schritten.

  <Tabs>
  <Tab title="API-Schlüssel (OpenAI Platform)">
    **Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel aus dem [OpenAI-Platform-Dashboard](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Oder den Schlüssel direkt übergeben:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Überprüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Routenübersicht

    | Modell-Ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Direkte OpenAI-Platform-API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Direkte OpenAI-Platform-API | `OPENAI_API_KEY` |

    <Note>
    Die ChatGPT-/Codex-Anmeldung wird über `openai-codex/*` geroutet, nicht über `openai/*`.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw stellt `openai/gpt-5.3-codex-spark` **nicht** auf dem direkten API-Pfad bereit. Live-Anfragen an die OpenAI-API lehnen dieses Modell ab. Spark ist nur für Codex.
    </Warning>

  </Tab>

  <Tab title="Codex-Abonnement">
    **Am besten geeignet für:** die Verwendung Ihres ChatGPT-/Codex-Abonnements statt eines separaten API-Schlüssels. Codex Cloud erfordert eine ChatGPT-Anmeldung.

    <Steps>
      <Step title="Codex-OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oder OAuth direkt ausführen:

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="Standardmodell festlegen">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Überprüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Routenübersicht

    | Modell-Ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT-/Codex-OAuth | Codex-Anmeldung |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT-/Codex-OAuth | Codex-Anmeldung (abhängig von Berechtigungen) |

    <Note>
    Diese Route ist absichtlich von `openai/gpt-5.4` getrennt. Verwenden Sie `openai/*` mit einem API-Schlüssel für direkten Platform-Zugriff und `openai-codex/*` für Zugriff über das Codex-Abonnement.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Wenn das Onboarding eine bestehende Codex-CLI-Anmeldung wiederverwendet, bleiben diese Anmeldedaten durch die Codex-CLI verwaltet. Bei Ablauf liest OpenClaw zuerst erneut aus der externen Codex-Quelle und schreibt die aktualisierten Anmeldedaten zurück in den Codex-Speicher.
    </Tip>

    ### Kontextfenster-Limit

    OpenClaw behandelt Modellmetadaten und das Laufzeitlimit für den Kontext als getrennte Werte.

    Für `openai-codex/gpt-5.4`:

    - Natives `contextWindow`: `1050000`
    - Standard-Laufzeitlimit `contextTokens`: `272000`

    Das kleinere Standardlimit hat in der Praxis bessere Latenz- und Qualitätsmerkmale. Überschreiben Sie es mit `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Verwenden Sie `contextWindow`, um native Modellmetadaten zu deklarieren. Verwenden Sie `contextTokens`, um das Laufzeitbudget für den Kontext zu begrenzen.
    </Note>

  </Tab>
</Tabs>

## Bildgenerierung

Das gebündelte `openai`-Plugin registriert die Bildgenerierung über das Tool `image_generate`.

| Capability                | Wert                               |
| ------------------------- | ---------------------------------- |
| Standardmodell            | `openai/gpt-image-2`               |
| Max. Bilder pro Anfrage   | 4                                  |
| Bearbeitungsmodus         | Aktiviert (bis zu 5 Referenzbilder) |
| Größenüberschreibungen    | Unterstützt, einschließlich 2K-/4K-Größen |
| Seitenverhältnis / Auflösung | Nicht an die OpenAI-Images-API weitergegeben |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Siehe [Bildgenerierung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

`gpt-image-2` ist das Standardmodell sowohl für OpenAI-Text-zu-Bild-Generierung als auch für Bildbearbeitung. `gpt-image-1` bleibt als explizite Modellüberschreibung verwendbar, aber neue OpenAI-Bild-Workflows sollten `openai/gpt-image-2` verwenden.

Erzeugen:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Bearbeiten:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Videogenerierung

Das gebündelte `openai`-Plugin registriert die Videogenerierung über das Tool `video_generate`.

| Capability       | Wert                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| Standardmodell   | `openai/sora-2`                                                                   |
| Modi             | Text-zu-Video, Bild-zu-Video, Bearbeitung eines einzelnen Videos                  |
| Referenzeingaben | 1 Bild oder 1 Video                                                               |
| Größenüberschreibungen | Unterstützt                                                                  |
| Andere Überschreibungen | `aspectRatio`, `resolution`, `audio`, `watermark` werden mit einer Tool-Warnung ignoriert |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

## GPT-5-Prompt-Beitrag

OpenClaw fügt für GPT-5-Family-Läufe providerübergreifend einen gemeinsamen GPT-5-Prompt-Beitrag hinzu. Er wird anhand der Modell-ID angewendet, daher erhalten `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` und andere kompatible GPT-5-Refs dasselbe Overlay. Ältere GPT-4.x-Modelle tun dies nicht.

Der gebündelte native Codex-Harness-Provider (`codex/*`) verwendet dasselbe GPT-5-Verhalten und dasselbe Heartbeat-Overlay über Entwickleranweisungen des Codex-App-Servers, sodass `codex/gpt-5.x`-Sitzungen dieselben Leitlinien für Durchgängigkeit und proaktive Heartbeats beibehalten, obwohl Codex den Rest des Harness-Prompts besitzt.

Der GPT-5-Beitrag fügt einen getaggten Verhaltensvertrag für Persona-Persistenz, Ausführungssicherheit, Tool-Disziplin, Ausgabeform, Abschlussprüfungen und Verifikation hinzu. Kanalspezifisches Antwort- und Verhalten für stille Nachrichten bleibt im gemeinsamen OpenClaw-Systemprompt und in der Richtlinie für ausgehende Zustellung. Die GPT-5-Leitlinien sind für passende Modelle immer aktiviert. Die Ebene für den freundlichen Interaktionsstil ist getrennt und konfigurierbar.

| Wert                   | Wirkung                                         |
| ---------------------- | ----------------------------------------------- |
| `"friendly"` (Standard) | Aktiviert die Ebene für den freundlichen Interaktionsstil |
| `"on"`                 | Alias für `"friendly"`                          |
| `"off"`                | Deaktiviert nur die Ebene des freundlichen Stils |

<Tabs>
  <Tab title="Konfiguration">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Werte werden zur Laufzeit ohne Beachtung der Groß-/Kleinschreibung behandelt, daher deaktivieren sowohl `"Off"` als auch `"off"` die Ebene des freundlichen Stils.
</Tip>

<Note>
Das Legacy-Setting `plugins.entries.openai.config.personality` wird weiterhin als Kompatibilitäts-Fallback gelesen, wenn die gemeinsame Einstellung `agents.defaults.promptOverlays.gpt5.personality` nicht gesetzt ist.
</Note>

## Stimme und Sprache

<AccordionGroup>
  <Accordion title="Sprachsynthese (TTS)">
    Das gebündelte `openai`-Plugin registriert Sprachsynthese für die Oberfläche `messages.tts`.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stimme | `messages.tts.providers.openai.voice` | `coral` |
    | Geschwindigkeit | `messages.tts.providers.openai.speed` | (nicht gesetzt) |
    | Anweisungen | `messages.tts.providers.openai.instructions` | (nicht gesetzt, nur `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` für Sprachnotizen, `mp3` für Dateien |
    | API-Schlüssel | `messages.tts.providers.openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |
    | Base-URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Verfügbare Modelle: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Verfügbare Stimmen: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Setzen Sie `OPENAI_TTS_BASE_URL`, um die TTS-Base-URL zu überschreiben, ohne den Endpunkt der Chat-API zu beeinflussen.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-Text">
    Das gebündelte `openai`-Plugin registriert Batch-Speech-to-Text über
    die Transkriptionsoberfläche des Medienverständnisses von OpenClaw.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpunkt: OpenAI-REST `/v1/audio/transcriptions`
    - Eingabepfad: Multipart-Upload einer Audiodatei
    - Wird von OpenClaw überall unterstützt, wo eingehende Audiotranskription `tools.media.audio` verwendet, einschließlich Discord-Sprachkanalsegmenten und Audioanhängen in Kanälen

    Um OpenAI für eingehende Audiotranskription zu erzwingen:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Sprach- und Prompt-Hinweise werden an OpenAI weitergegeben, wenn sie von der gemeinsamen Audio-Medienkonfiguration oder durch eine Transkriptionsanfrage pro Aufruf bereitgestellt werden.

  </Accordion>

  <Accordion title="Echtzeittranskription">
    Das gebündelte `openai`-Plugin registriert Echtzeittranskription für das Voice Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sprache | `...openai.language` | (nicht gesetzt) |
    | Prompt | `...openai.prompt` | (nicht gesetzt) |
    | Stilledauer | `...openai.silenceDurationMs` | `800` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit G.711 u-law-Audio (`g711_ulaw` / `audio/pcmu`). Dieser Streaming-Provider ist für den Pfad der Echtzeittranskription von Voice Call gedacht; Discord-Voice zeichnet derzeit kurze Segmente auf und verwendet stattdessen den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Echtzeitstimme">
    Das gebündelte `openai`-Plugin registriert Echtzeitstimme für das Voice Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Stimme | `...openai.voice` | `alloy` |
    | Temperatur | `...openai.temperature` | `0.8` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | Stilledauer | `...openai.silenceDurationMs` | `500` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Unterstützt Azure OpenAI über die Konfigurationsschlüssel `azureEndpoint` und `azureDeployment`. Unterstützt bidirektionales Tool Calling. Verwendet das Audioformat G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs. SSE)">
    OpenClaw verwendet WebSocket-first mit SSE-Fallback (`"auto"`) sowohl für `openai/*` als auch für `openai-codex/*`.

    Im Modus `"auto"` führt OpenClaw Folgendes aus:
    - Wiederholt einen frühen WebSocket-Fehler einmal, bevor auf SSE zurückgefallen wird
    - Markiert WebSocket nach einem Fehler für etwa 60 Sekunden als degradiert und verwendet während des Cooldowns SSE
    - Hängt stabile Header für Sitzungs- und Turn-Identität für Wiederholungen und Reconnects an
    - Normalisiert Nutzungszähler (`input_tokens` / `prompt_tokens`) über Transportvarianten hinweg

    | Wert | Verhalten |
    |-------|----------|
    | `"auto"` (Standard) | Zuerst WebSocket, dann SSE-Fallback |
    | `"sse"` | Nur SSE erzwingen |
    | `"websocket"` | Nur WebSocket erzwingen |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Zugehörige OpenAI-Dokumentation:
    - [Realtime API mit WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming-API-Antworten (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket-Warm-up">
    OpenClaw aktiviert standardmäßig WebSocket-Warm-up für `openai/*`, um die Latenz des ersten Turns zu reduzieren.

    ```json5
    // Warm-up deaktivieren
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Schnellmodus">
    OpenClaw stellt einen gemeinsamen Schnellmodus-Schalter sowohl für `openai/*` als auch für `openai-codex/*` bereit:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, ordnet OpenClaw den Schnellmodus der priorisierten Verarbeitung von OpenAI zu (`service_tier = "priority"`). Bestehende Werte für `service_tier` bleiben erhalten, und der Schnellmodus überschreibt weder `reasoning` noch `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Das Löschen der Sitzungsüberschreibung in der Sessions-UI setzt die Sitzung auf den konfigurierten Standard zurück.
    </Note>

  </Accordion>

  <Accordion title="Priorisierte Verarbeitung (service_tier)">
    Die API von OpenAI stellt priorisierte Verarbeitung über `service_tier` bereit. Setzen Sie sie in OpenClaw pro Modell:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Unterstützte Werte: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` wird nur an native OpenAI-Endpunkte (`api.openai.com`) und native Codex-Endpunkte (`chatgpt.com/backend-api`) weitergegeben. Wenn Sie einen der beiden Provider über einen Proxy routen, lässt OpenClaw `service_tier` unverändert.
    </Warning>

  </Accordion>

  <Accordion title="Serverseitige Compaction (Responses API)">
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`) aktiviert OpenClaw automatisch serverseitige Compaction:

    - Erzwingt `store: true` (es sei denn, die Modellkompatibilität setzt `supportsStore: false`)
    - Injiziert `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Standardwert für `compact_threshold`: 70 % von `contextWindow` (oder `80000`, wenn nicht verfügbar)

    <Tabs>
      <Tab title="Explizit aktivieren">
        Nützlich für kompatible Endpunkte wie Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Benutzerdefinierter Schwellenwert">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Deaktivieren">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` steuert nur die Injektion von `context_management`. Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, es sei denn, die Kompatibilität setzt `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Strenger agentischer GPT-Modus">
    Für GPT-5-Family-Läufe auf `openai/*` und `openai-codex/*` kann OpenClaw einen strengeren eingebetteten Ausführungsvertrag verwenden:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Mit `strict-agentic` gilt in OpenClaw:
    - Ein Turn nur mit Plan wird nicht länger als erfolgreicher Fortschritt behandelt, wenn eine Tool-Aktion verfügbar ist
    - Der Turn wird mit einer „act-now“-Steuerung wiederholt
    - `update_plan` wird für umfangreiche Arbeit automatisch aktiviert
    - Ein expliziter blockierter Zustand wird angezeigt, wenn das Modell weiter plant, ohne zu handeln

    <Note>
    Nur auf OpenAI- und Codex-GPT-5-Family-Läufe beschränkt. Andere Provider und ältere Modellfamilien behalten das Standardverhalten.
    </Note>

  </Accordion>

  <Accordion title="Native vs. OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle bei, die das OpenAI-`none`-Effort unterstützen
    - Lassen deaktiviertes Reasoning bei Modellen oder Proxys weg, die `reasoning.effort: "none"` ablehnen
    - Stellen Tool-Schemas standardmäßig auf den Strict-Modus
    - Hängen versteckte Attribution-Header nur an verifizierten nativen Hosts an
    - Behalten OpenAI-spezifische Request-Gestaltung (`service_tier`, `store`, Reasoning-Kompatibilität, Prompt-Cache-Hinweise) bei

    **Proxy-/kompatible Routen:**
    - Verwenden lockereres Kompatibilitätsverhalten
    - Erzwingen keine strikten Tool-Schemas oder nur native Header

    Azure OpenAI verwendet natives Transport- und Kompatibilitätsverhalten, erhält aber nicht die versteckten Attribution-Header.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Bild-Tool-Parameter und Providerauswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Video-Tool-Parameter und Providerauswahl.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
