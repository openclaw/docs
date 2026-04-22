---
read_when:
    - Du möchtest OpenAI-Modelle in OpenClaw verwenden
    - Du möchtest Codex-Subscription-Auth statt API-Schlüsseln verwenden
    - Du brauchst strengeres Ausführungsverhalten für GPT-5-Agenten
summary: OpenAI über API-Schlüssel oder Codex-Subscription in OpenClaw verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-04-22T04:27:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692615b77885c0387d339d47c02ff056ba95d3608aa681882893a46d2a0f723f
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI stellt Entwickler-APIs für GPT-Modelle bereit. OpenClaw unterstützt zwei Auth-Routen:

- **API-Schlüssel** — direkter OpenAI-Platform-Zugriff mit nutzungsbasierter Abrechnung (`openai/*`-Modelle)
- **Codex-Subscription** — ChatGPT-/Codex-Anmeldung mit Subscription-Zugriff (`openai-codex/*`-Modelle)

OpenAI unterstützt die Nutzung von Subscription-OAuth in externen Tools und Workflows wie OpenClaw ausdrücklich.

## Erste Schritte

Wähle deine bevorzugte Auth-Methode und folge den Einrichtungsschritten.

<Tabs>
  <Tab title="API-Schlüssel (OpenAI Platform)">
    **Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstelle oder kopiere einen API-Schlüssel aus dem [OpenAI-Platform-Dashboard](https://platform.openai.com/api-keys).
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
      <Step title="Verifizieren, dass das Modell verfügbar ist">
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
    ChatGPT-/Codex-Anmeldung wird über `openai-codex/*` geroutet, nicht über `openai/*`.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw stellt `openai/gpt-5.3-codex-spark` auf dem direkten API-Pfad **nicht** bereit. Live-OpenAI-API-Anfragen lehnen dieses Modell ab. Spark ist nur für Codex verfügbar.
    </Warning>

  </Tab>

  <Tab title="Codex-Subscription">
    **Am besten geeignet für:** die Nutzung deiner ChatGPT-/Codex-Subscription statt eines separaten API-Schlüssels. Codex-Cloud erfordert eine ChatGPT-Anmeldung.

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
      <Step title="Standardmodell setzen">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Verifizieren, dass das Modell verfügbar ist">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Routenübersicht

    | Modell-Ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT-/Codex-OAuth | Codex-Anmeldung |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT-/Codex-OAuth | Codex-Anmeldung (abhängig von Berechtigung) |

    <Note>
    Diese Route ist bewusst von `openai/gpt-5.4` getrennt. Verwende `openai/*` mit einem API-Schlüssel für direkten Platform-Zugriff und `openai-codex/*` für Codex-Subscription-Zugriff.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Wenn das Onboarding eine bestehende Codex-CLI-Anmeldung wiederverwendet, bleiben diese Credentials von der Codex CLI verwaltet. Beim Ablauf liest OpenClaw zuerst die externe Codex-Quelle erneut ein und schreibt die aktualisierten Credentials zurück in den Codex-Speicher.
    </Tip>

    ### Kontextfenster-Limit

    OpenClaw behandelt Modell-Metadaten und das Laufzeit-Kontextlimit als getrennte Werte.

    Für `openai-codex/gpt-5.4`:

    - Natives `contextWindow`: `1050000`
    - Standard-Laufzeitlimit für `contextTokens`: `272000`

    Das kleinere Standardlimit hat in der Praxis bessere Latenz- und Qualitätseigenschaften. Überschreibe es mit `contextTokens`:

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
    Verwende `contextWindow`, um native Modell-Metadaten zu deklarieren. Verwende `contextTokens`, um das Laufzeitbudget für Kontext zu begrenzen.
    </Note>

  </Tab>
</Tabs>

## Bildgenerierung

Das gebündelte `openai` Plugin registriert Bildgenerierung über das Tool `image_generate`.

| Fähigkeit                | Wert                               |
| ------------------------ | ---------------------------------- |
| Standardmodell           | `openai/gpt-image-2`               |
| Maximale Bilder pro Anfrage | 4                               |
| Bearbeitungsmodus        | Aktiviert (bis zu 5 Referenzbilder) |
| Größenüberschreibungen   | Unterstützt, einschließlich 2K-/4K-Größen |
| Seitenverhältnis / Auflösung | Nicht an die OpenAI Images API weitergeleitet |

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
Siehe [Bildgenerierung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

`gpt-image-2` ist der Standard sowohl für OpenAI-Text-zu-Bild-Generierung als auch für Bildbearbeitung. `gpt-image-1` bleibt als explizite Modellüberschreibung nutzbar, aber neue
OpenAI-Bild-Workflows sollten `openai/gpt-image-2` verwenden.

Generieren:

```
/tool image_generate model=openai/gpt-image-2 prompt="Ein hochwertiges Launch-Poster für OpenClaw auf macOS" size=3840x2160 count=1
```

Bearbeiten:

```
/tool image_generate model=openai/gpt-image-2 prompt="Die Form des Objekts beibehalten, das Material in transluzentes Glas ändern" image=/path/to/reference.png size=1024x1536
```

## Videogenerierung

Das gebündelte `openai` Plugin registriert Videogenerierung über das Tool `video_generate`.

| Fähigkeit       | Wert                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| Standardmodell    | `openai/sora-2`                                                                   |
| Modi            | Text-zu-Video, Bild-zu-Video, Einzelvideo-Bearbeitung                             |
| Referenzeingaben | 1 Bild oder 1 Video                                                               |
| Größenüberschreibungen   | Unterstützt                                                                         |
| Andere Überschreibungen  | `aspectRatio`, `resolution`, `audio`, `watermark` werden mit einer Tool-Warnung ignoriert |

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
Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## GPT-5-Prompt-Beitrag

OpenClaw fügt einen OpenAI-spezifischen GPT-5-Prompt-Beitrag für GPT-5-Familienläufe von `openai/*` und `openai-codex/*` hinzu. Er lebt im gebündelten OpenAI-Plugin, gilt für Modell-IDs wie `gpt-5`, `gpt-5.2`, `gpt-5.4` und `gpt-5.4-mini` und gilt nicht für ältere GPT-4.x-Modelle.

Der GPT-5-Beitrag fügt einen getaggten Verhaltensvertrag für Persona-Persistenz, Ausführungssicherheit, Tool-Disziplin, Ausgabestruktur, Abschlussprüfungen und Verifikation hinzu. Kanalspezifisches Antwort- und Silent-Message-Verhalten bleibt im gemeinsamen OpenClaw-System-Prompt und in der Richtlinie für ausgehende Zustellung. Die GPT-5-Anleitung ist für passende Modelle immer aktiviert. Die Ebene für den freundlichen Interaktionsstil ist getrennt und konfigurierbar.

| Wert                   | Effekt                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (Standard) | Die Ebene für den freundlichen Interaktionsstil aktivieren |
| `"on"`                 | Alias für `"friendly"`                      |
| `"off"`                | Nur die Ebene für den freundlichen Stil deaktivieren       |

<Tabs>
  <Tab title="Konfiguration">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Werte sind zur Laufzeit nicht case-sensitiv, daher deaktivieren sowohl `"Off"` als auch `"off"` die Ebene für den freundlichen Stil.
</Tip>

## Stimme und Sprache

<AccordionGroup>
  <Accordion title="Sprachsynthese (TTS)">
    Das gebündelte `openai` Plugin registriert Sprachsynthese für die Oberfläche `messages.tts`.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stimme | `messages.tts.providers.openai.voice` | `coral` |
    | Geschwindigkeit | `messages.tts.providers.openai.speed` | (nicht gesetzt) |
    | Anweisungen | `messages.tts.providers.openai.instructions` | (nicht gesetzt, nur `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` für Sprachnotizen, `mp3` für Dateien |
    | API-Schlüssel | `messages.tts.providers.openai.apiKey` | Fallback auf `OPENAI_API_KEY` |
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
    Setze `OPENAI_TTS_BASE_URL`, um die TTS-Base-URL zu überschreiben, ohne den Chat-API-Endpunkt zu beeinflussen.
    </Note>

  </Accordion>

  <Accordion title="Echtzeit-Transkription">
    Das gebündelte `openai` Plugin registriert Echtzeit-Transkription für das Voice Call Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Dauer der Stille | `...openai.silenceDurationMs` | `800` |
    | VAD-Schwelle | `...openai.vadThreshold` | `0.5` |
    | API-Schlüssel | `...openai.apiKey` | Fallback auf `OPENAI_API_KEY` |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit G.711-u-law-Audio.
    </Note>

  </Accordion>

  <Accordion title="Echtzeit-Stimme">
    Das gebündelte `openai` Plugin registriert Echtzeit-Stimme für das Voice Call Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Stimme | `...openai.voice` | `alloy` |
    | Temperatur | `...openai.temperature` | `0.8` |
    | VAD-Schwelle | `...openai.vadThreshold` | `0.5` |
    | Dauer der Stille | `...openai.silenceDurationMs` | `500` |
    | API-Schlüssel | `...openai.apiKey` | Fallback auf `OPENAI_API_KEY` |

    <Note>
    Unterstützt Azure OpenAI über die Konfigurationsschlüssel `azureEndpoint` und `azureDeployment`. Unterstützt bidirektionales Tool-Calling. Verwendet das Audioformat G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw verwendet für `openai/*` und `openai-codex/*` zuerst WebSocket mit SSE-Fallback (`"auto"`).

    Im Modus `"auto"` führt OpenClaw Folgendes aus:
    - Wiederholt einen frühen WebSocket-Fehler einmal, bevor auf SSE zurückgefallen wird
    - Markiert WebSocket nach einem Fehler für ~60 Sekunden als degradiert und verwendet während der Abkühlphase SSE
    - Hängt stabile Header für Sitzungs- und Turn-Identität für Retries und Reconnects an
    - Normalisiert Nutzungszähler (`input_tokens` / `prompt_tokens`) über Transportvarianten hinweg

    | Wert | Verhalten |
    |-------|----------|
    | `"auto"` (Standard) | Zuerst WebSocket, SSE-Fallback |
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
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket-Warm-up">
    OpenClaw aktiviert standardmäßig WebSocket-Warm-up für `openai/*`, um die Latenz beim ersten Turn zu reduzieren.

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

  <Accordion title="Fast Mode">
    OpenClaw stellt einen gemeinsamen Fast-Mode-Schalter für `openai/*` und `openai-codex/*` bereit:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, bildet OpenClaw den Fast Mode auf OpenAI-Prioritätsverarbeitung ab (`service_tier = "priority"`). Bestehende `service_tier`-Werte bleiben erhalten, und der Fast Mode überschreibt weder `reasoning` noch `text.verbosity`.

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
    Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Wenn die Sitzungsüberschreibung in der Sitzungen-UI gelöscht wird, kehrt die Sitzung zum konfigurierten Standard zurück.
    </Note>

  </Accordion>

  <Accordion title="Prioritätsverarbeitung (service_tier)">
    OpenAIs API stellt Prioritätsverarbeitung über `service_tier` bereit. Setze dies pro Modell in OpenClaw:

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
    `serviceTier` wird nur an native OpenAI-Endpunkte (`api.openai.com`) und native Codex-Endpunkte (`chatgpt.com/backend-api`) weitergeleitet. Wenn du einen der beiden Provider über einen Proxy routest, lässt OpenClaw `service_tier` unverändert.
    </Warning>

  </Accordion>

  <Accordion title="Serverseitige Compaction (Responses API)">
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`) aktiviert OpenClaw automatisch serverseitige Compaction:

    - Erzwingt `store: true` (außer wenn Modell-Kompatibilität `supportsStore: false` setzt)
    - Injiziert `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Standard-`compact_threshold`: 70 % von `contextWindow` (oder `80000`, wenn nicht verfügbar)

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
    `responsesServerCompaction` steuert nur die Injektion von `context_management`. Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, sofern die Kompatibilität nicht `supportsStore: false` setzt.
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic-GPT-Modus">
    Für Läufe der GPT-5-Familie auf `openai/*` und `openai-codex/*` kann OpenClaw einen strengeren eingebetteten Ausführungsvertrag verwenden:

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
    - Ein Turn nur mit Plan wird nicht mehr als erfolgreicher Fortschritt behandelt, wenn eine Tool-Aktion verfügbar ist
    - Der Turn wird mit einem „jetzt handeln“-Steer erneut versucht
    - `update_plan` wird für substanzielle Arbeit automatisch aktiviert
    - Ein expliziter Blockiert-Zustand wird angezeigt, wenn das Modell weiter plant, ohne zu handeln

    <Note>
    Gilt nur für Läufe der GPT-5-Familie mit OpenAI und Codex. Andere Provider und ältere Modellfamilien behalten das Standardverhalten.
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle bei, die OpenAIs `none`-Effort unterstützen
    - Lassen deaktiviertes Reasoning bei Modellen oder Proxys weg, die `reasoning.effort: "none"` ablehnen
    - Setzen Tool-Schemas standardmäßig auf Strict Mode
    - Hängen versteckte Attribution-Header nur an verifizierte native Hosts an
    - Behalten OpenAI-spezifische Request-Formung bei (`service_tier`, `store`, Reasoning-Kompatibilität, Prompt-Cache-Hinweise)

    **Proxy-/kompatible Routen:**
    - Verwenden lockereres Kompatibilitätsverhalten
    - Erzwingen keine Strict-Tool-Schemas oder native-only Header

    Azure OpenAI verwendet natives Transport- und Kompatibilitätsverhalten, erhält aber keine versteckten Attribution-Header.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bild-Tools und Provider-Auswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="OAuth und Auth" href="/de/gateway/authentication" icon="key">
    Auth-Details und Regeln zur Wiederverwendung von Credentials.
  </Card>
</CardGroup>
