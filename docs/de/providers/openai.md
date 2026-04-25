---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden.
    - Sie möchten Codex-Subscription-Authentifizierung statt API keys verwenden.
    - Sie benötigen ein strengeres Ausführungsverhalten für GPT-5-Agenten.
summary: OpenAI über API keys oder Codex-Subscription in OpenClaw verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T13:55:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 576a453f42fff8d90837ebee3894443c37f177c611c134113944fbf0d11c2455
    source_path: providers/openai.md
    workflow: 15
---

OpenAI stellt Entwickler-APIs für GPT-Modelle bereit. OpenClaw unterstützt drei Routen der OpenAI-Familie. Das Modellpräfix wählt die Route aus:

- **API key** — direkter Zugriff auf die OpenAI Platform mit nutzungsbasierter Abrechnung (`openai/*`-Modelle)
- **Codex-Subscription über PI** — ChatGPT-/Codex-Anmeldung mit Subscription-Zugriff (`openai-codex/*`-Modelle)
- **Codex-App-Server-Harness** — native Codex-App-Server-Ausführung (`openai/*`-Modelle plus `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI unterstützt ausdrücklich die Nutzung von Subscription-OAuth in externen Tools und Workflows wie OpenClaw.

Provider, Modell, Laufzeit und Kanal sind getrennte Ebenen. Wenn diese Bezeichnungen
durcheinandergeraten, lesen Sie [Agent runtimes](/de/concepts/agent-runtimes), bevor
Sie die Konfiguration ändern.

## Schnellauswahl

| Ziel                                          | Verwenden Sie                                             | Hinweise                                                                     |
| --------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Direkte Abrechnung per API key                | `openai/gpt-5.4`                                          | Setzen Sie `OPENAI_API_KEY` oder führen Sie das Onboarding für OpenAI API key aus. |
| GPT-5.5 mit ChatGPT-/Codex-Subscription-Auth  | `openai-codex/gpt-5.5`                                    | Standard-PI-Route für Codex OAuth. Beste erste Wahl für Subscription-Setups. |
| GPT-5.5 mit nativem Codex-App-Server-Verhalten | `openai/gpt-5.5` plus `embeddedHarness.runtime: "codex"` | Verwendet das Codex-App-Server-Harness, nicht die öffentliche OpenAI-API-Route. |
| Bildgenerierung oder -bearbeitung             | `openai/gpt-image-2`                                      | Funktioniert entweder mit `OPENAI_API_KEY` oder OpenAI Codex OAuth.          |

<Note>
GPT-5.5 ist derzeit in OpenClaw über Subscription-/OAuth-Routen verfügbar:
`openai-codex/gpt-5.5` mit dem PI-Runner oder `openai/gpt-5.5` mit dem
Codex-App-Server-Harness. Direkter API-key-Zugriff für `openai/gpt-5.5` wird
unterstützt, sobald OpenAI GPT-5.5 für die öffentliche API freischaltet; bis dahin verwenden Sie ein
API-fähiges Modell wie `openai/gpt-5.4` für Setups mit `OPENAI_API_KEY`.
</Note>

<Note>
Das Aktivieren des OpenAI-Plugins oder die Auswahl eines `openai-codex/*`-Modells
aktiviert nicht das gebündelte Codex-App-Server-Plugin. OpenClaw aktiviert dieses Plugin nur,
wenn Sie explizit das native Codex-Harness mit
`embeddedHarness.runtime: "codex"` auswählen oder eine alte Modell-Ref `codex/*` verwenden.
</Note>

## OpenClaw-Abdeckung von Funktionen

| OpenAI-Fähigkeit         | OpenClaw-Oberfläche                                      | Status                                                  |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------- |
| Chat / Responses         | Modell-Provider `openai/<model>`                         | Ja                                                      |
| Codex-Subscription-Modelle | `openai-codex/<model>` mit `openai-codex` OAuth        | Ja                                                      |
| Codex-App-Server-Harness | `openai/<model>` mit `embeddedHarness.runtime: codex`    | Ja                                                      |
| Serverseitige Web-Suche  | Natives Tool für OpenAI Responses                        | Ja, wenn Web-Suche aktiviert und kein Provider festgelegt ist |
| Bilder                   | `image_generate`                                         | Ja                                                      |
| Videos                   | `video_generate`                                         | Ja                                                      |
| Text-to-Speech           | `messages.tts.provider: "openai"` / `tts`                | Ja                                                      |
| Batch-Speech-to-Text     | `tools.media.audio` / Medienverständnis                  | Ja                                                      |
| Streaming-Speech-to-Text | Voice Call `streaming.provider: "openai"`                | Ja                                                      |
| Realtime-Stimme          | Voice Call `realtime.provider: "openai"` / Control UI Talk | Ja                                                    |
| Embeddings               | Embedding-Provider für Memory                            | Ja                                                      |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungs-Schritten.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API key abrufen">
        Erstellen oder kopieren Sie einen API key aus dem [OpenAI Platform dashboard](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Oder den Key direkt übergeben:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Zusammenfassung der Route

    | Modell-Ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Direkte OpenAI-Platform-API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Direkte OpenAI-Platform-API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Künftige direkte API-Route, sobald OpenAI GPT-5.5 für die API freischaltet | `OPENAI_API_KEY` |

    <Note>
    `openai/*` ist die direkte Route der OpenAI-API per API key, sofern Sie nicht explizit
    das Codex-App-Server-Harness erzwingen. GPT-5.5 selbst ist derzeit nur über Subscription/OAuth
    verfügbar; verwenden Sie `openai-codex/*` für Codex OAuth über den Standard-PI-Runner oder
    `openai/gpt-5.5` mit `embeddedHarness.runtime: "codex"` für native
    Codex-App-Server-Ausführung.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw stellt **nicht** `openai/gpt-5.3-codex-spark` bereit. Live-Anfragen an die OpenAI-API lehnen dieses Modell ab, und der aktuelle Codex-Katalog stellt es ebenfalls nicht bereit.
    </Warning>

  </Tab>

  <Tab title="Codex-Subscription">
    **Am besten geeignet für:** die Nutzung Ihrer ChatGPT-/Codex-Subscription statt eines separaten API key. Codex Cloud erfordert eine ChatGPT-Anmeldung.

    <Steps>
      <Step title="Codex OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oder OAuth direkt ausführen:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Für Headless-Setups oder callback-unfreundliche Setups fügen Sie `--device-code` hinzu, um sich mit einem ChatGPT-Device-Code-Flow statt über den Localhost-Browser-Callback anzumelden:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Standardmodell festlegen">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Zusammenfassung der Route

    | Modell-Ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT-/Codex-OAuth über PI | Codex-Anmeldung |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex-App-Server-Harness | Codex-App-Server-Auth |

    <Note>
    Verwenden Sie weiterhin die Provider-ID `openai-codex` für Auth-/Profil-Befehle. Das
    Modellpräfix `openai-codex/*` ist außerdem die explizite PI-Route für Codex OAuth.
    Es wählt das gebündelte Codex-App-Server-Harness nicht aus und aktiviert es auch nicht automatisch.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Das Onboarding importiert kein OAuth-Material mehr aus `~/.codex`. Melden Sie sich mit Browser-OAuth (Standard) oder dem oben genannten Device-Code-Flow an — OpenClaw verwaltet die resultierenden Anmeldedaten in seinem eigenen Agent-Auth-Speicher.
    </Note>

    ### Statusanzeige

    Chat `/status` zeigt an, welche Modell-Laufzeit für die aktuelle Sitzung aktiv ist.
    Das Standard-PI-Harness erscheint als `Runtime: OpenClaw Pi Default`. Wenn das
    gebündelte Codex-App-Server-Harness ausgewählt ist, zeigt `/status`
    `Runtime: OpenAI Codex` an. Bestehende Sitzungen behalten ihre aufgezeichnete Harness-ID, verwenden Sie also
    `/new` oder `/reset` nach Änderung von `embeddedHarness`, wenn `/status`
    eine neue Auswahl von PI/Codex widerspiegeln soll.

    ### Kontextfenster-Limit

    OpenClaw behandelt Modellmetadaten und das Kontextlimit der Laufzeit als getrennte Werte.

    Für `openai-codex/gpt-5.5` über Codex OAuth:

    - Natives `contextWindow`: `1000000`
    - Standardmäßiges Laufzeitlimit `contextTokens`: `272000`

    Das kleinere Standardlimit hat in der Praxis bessere Eigenschaften bei Latenz und Qualität. Überschreiben Sie es mit `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Verwenden Sie `contextWindow`, um native Modellmetadaten zu deklarieren. Verwenden Sie `contextTokens`, um das Kontextbudget der Laufzeit zu begrenzen.
    </Note>

    ### Wiederherstellung des Katalogs

    OpenClaw verwendet Upstream-Codex-Katalogmetadaten für `gpt-5.5`, wenn diese
    vorhanden sind. Wenn die Live-Codex-Discovery die Zeile `openai-codex/gpt-5.5` auslässt, während
    das Konto authentifiziert ist, synthetisiert OpenClaw diese OAuth-Modellzeile, damit
    Cron-, Sub-Agent- und konfigurierte Läufe mit Standardmodell nicht mit
    `Unknown model` fehlschlagen.

  </Tab>
</Tabs>

## Bildgenerierung

Das gebündelte Plugin `openai` registriert Bildgenerierung über das Tool `image_generate`.
Es unterstützt sowohl OpenAI-Bildgenerierung per API key als auch Bild-
generierung per Codex OAuth über dieselbe Modell-Ref `openai/gpt-image-2`.

| Fähigkeit                | OpenAI API key                    | Codex OAuth                          |
| ------------------------ | --------------------------------- | ------------------------------------ |
| Modell-Ref               | `openai/gpt-image-2`              | `openai/gpt-image-2`                 |
| Auth                     | `OPENAI_API_KEY`                  | OpenAI Codex OAuth-Anmeldung         |
| Transport                | OpenAI Images API                 | Codex Responses Backend              |
| Maximale Bilder pro Anfrage | 4                              | 4                                    |
| Bearbeitungsmodus        | Aktiviert (bis zu 5 Referenzbilder) | Aktiviert (bis zu 5 Referenzbilder) |
| Größen-Overrides         | Unterstützt, einschließlich 2K-/4K-Größen | Unterstützt, einschließlich 2K-/4K-Größen |
| Seitenverhältnis / Auflösung | Nicht an die OpenAI Images API weitergeleitet | Wenn sicher, auf eine unterstützte Größe abgebildet |

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
Siehe [Image Generation](/de/tools/image-generation) für gemeinsame Tool-Parameter, Providerauswahl und Fallback-Verhalten.
</Note>

`gpt-image-2` ist der Standard sowohl für OpenAI-Text-zu-Bild-Generierung als auch für Bild-
bearbeitung. `gpt-image-1` bleibt als explizites Modell-Override nutzbar, aber neue
OpenAI-Bild-Workflows sollten `openai/gpt-image-2` verwenden.

Bei Installationen mit Codex OAuth behalten Sie dieselbe Ref `openai/gpt-image-2` bei. Wenn ein
OAuth-Profil `openai-codex` konfiguriert ist, löst OpenClaw dieses gespeicherte OAuth-
Access-Token auf und sendet Bildanfragen über das Codex-Responses-Backend. Es
versucht dabei nicht zuerst `OPENAI_API_KEY` und fällt für diese
Anfrage auch nicht stillschweigend auf einen API key zurück. Konfigurieren Sie `models.providers.openai`
explizit mit einem API key, einer benutzerdefinierten Base URL oder einem Azure-Endpunkt, wenn Sie stattdessen die direkte Route über die OpenAI Images API
verwenden möchten.
Wenn dieser benutzerdefinierte Bild-Endpunkt in einem vertrauenswürdigen LAN/einer privaten Adresse liegt, setzen Sie zusätzlich
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw blockiert
private/interne OpenAI-kompatible Bild-Endpunkte weiterhin, solange dieses Opt-in
nicht vorhanden ist.

Generieren:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Bearbeiten:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Videogenerierung

Das gebündelte Plugin `openai` registriert Videogenerierung über das Tool `video_generate`.

| Fähigkeit       | Wert                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| Standardmodell   | `openai/sora-2`                                                                   |
| Modi             | Text-zu-Video, Bild-zu-Video, Bearbeitung eines einzelnen Videos                  |
| Referenzeingaben | 1 Bild oder 1 Video                                                               |
| Größen-Overrides | Unterstützt                                                                       |
| Andere Overrides | `aspectRatio`, `resolution`, `audio`, `watermark` werden mit einer Tool-Warnung ignoriert |

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
Siehe [Video Generation](/de/tools/video-generation) für gemeinsame Tool-Parameter, Providerauswahl und Fallback-Verhalten.
</Note>

## GPT-5-Prompt-Beitrag

OpenClaw fügt einen gemeinsamen GPT-5-Prompt-Beitrag für Läufe der GPT-5-Familie über Provider hinweg hinzu. Er wird anhand der Modell-ID angewendet, sodass `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` und andere kompatible GPT-5-Refs dieselbe Überlagerung erhalten. Ältere GPT-4.x-Modelle erhalten sie nicht.

Das gebündelte native Codex-Harness verwendet dasselbe GPT-5-Verhalten und dieselbe Heartbeat-Überlagerung über Entwickleranweisungen des Codex-App-Servers, sodass Sitzungen `openai/gpt-5.x`, die über `embeddedHarness.runtime: "codex"` erzwungen werden, dieselbe Nachverfolgungs- und proaktive Heartbeat-Anleitung beibehalten, obwohl Codex den Rest des Harness-Prompts besitzt.

Der GPT-5-Beitrag fügt einen markierten Verhaltensvertrag für Persistenz der Persona, Ausführungssicherheit, Tool-Disziplin, Ausgabeform, Abschlussprüfungen und Verifikation hinzu. Kanalspezifisches Antwort- und Silent-Message-Verhalten verbleibt im gemeinsamen OpenClaw-System-Prompt und in der Outbound-Delivery-Richtlinie. Die GPT-5-Anleitung ist für passende Modelle immer aktiviert. Die Ebene für den freundlichen Interaktionsstil ist separat und konfigurierbar.

| Wert                   | Effekt                                          |
| ---------------------- | ----------------------------------------------- |
| `"friendly"` (Standard) | Die Ebene für den freundlichen Interaktionsstil aktivieren |
| `"on"`                 | Alias für `"friendly"`                          |
| `"off"`                | Nur die Ebene für den freundlichen Stil deaktivieren |

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
Werte werden zur Laufzeit ohne Beachtung von Groß-/Kleinschreibung behandelt, daher deaktivieren sowohl `"Off"` als auch `"off"` die Ebene für den freundlichen Stil.
</Tip>

<Note>
Das alte `plugins.entries.openai.config.personality` wird weiterhin als Kompatibilitäts-Fallback gelesen, wenn die gemeinsame Einstellung `agents.defaults.promptOverlays.gpt5.personality` nicht gesetzt ist.
</Note>

## Stimme und Sprache

<AccordionGroup>
  <Accordion title="Sprachsynthese (TTS)">
    Das gebündelte Plugin `openai` registriert Sprachsynthese für die Oberfläche `messages.tts`.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stimme | `messages.tts.providers.openai.voice` | `coral` |
    | Geschwindigkeit | `messages.tts.providers.openai.speed` | (nicht gesetzt) |
    | Anweisungen | `messages.tts.providers.openai.instructions` | (nicht gesetzt, nur `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` für Sprachnotizen, `mp3` für Dateien |
    | API key | `messages.tts.providers.openai.apiKey` | Greift auf `OPENAI_API_KEY` zurück |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Das gebündelte Plugin `openai` registriert Batch-Speech-to-Text über
    die Transkriptionsoberfläche von OpenClaw für Medienverständnis.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpunkt: OpenAI REST `/v1/audio/transcriptions`
    - Eingabepfad: Multipart-Upload einer Audiodatei
    - Unterstützt von OpenClaw überall dort, wo eingehende Audiotranskription
      `tools.media.audio` verwendet, einschließlich Discord-Sprachkanal-Segmenten und Audioanhängen in Kanälen

    Um OpenAI für die Transkription eingehender Audiodaten zu erzwingen:

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

    Sprach- und Prompt-Hinweise werden an OpenAI weitergeleitet, wenn sie von der
    gemeinsamen Audiomedien-Konfiguration oder einer Transkriptionsanfrage pro Aufruf bereitgestellt werden.

  </Accordion>

  <Accordion title="Realtime-Transkription">
    Das gebündelte Plugin `openai` registriert Realtime-Transkription für das Plugin Voice Call.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sprache | `...openai.language` | (nicht gesetzt) |
    | Prompt | `...openai.prompt` | (nicht gesetzt) |
    | Stilledauer | `...openai.silenceDurationMs` | `800` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Greift auf `OPENAI_API_KEY` zurück |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit G.711 u-law (`g711_ulaw` / `audio/pcmu`) Audio. Dieser Streaming-Provider ist für den Pfad der Realtime-Transkription von Voice Call gedacht; Discord Voice zeichnet derzeit stattdessen kurze Segmente auf und verwendet den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime-Stimme">
    Das gebündelte Plugin `openai` registriert Realtime-Stimme für das Plugin Voice Call.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Stimme | `...openai.voice` | `alloy` |
    | Temperatur | `...openai.temperature` | `0.8` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | Stilledauer | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Greift auf `OPENAI_API_KEY` zurück |

    <Note>
    Unterstützt Azure OpenAI über die Konfigurationsschlüssel `azureEndpoint` und `azureDeployment`. Unterstützt bidirektionales Tool Calling. Verwendet das Audioformat G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure-OpenAI-Endpunkte

Der gebündelte Provider `openai` kann für die Bild-
generierung auf eine Azure-OpenAI-Ressource zielen, indem die Base URL überschrieben wird. Auf dem Pfad für Bildgenerierung erkennt OpenClaw
Azure-Hostnamen unter `models.providers.openai.baseUrl` und schaltet
automatisch auf Azures Anfrageform um.

<Note>
Realtime-Stimme verwendet einen separaten Konfigurationspfad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
und wird nicht von `models.providers.openai.baseUrl` beeinflusst. Siehe das Accordion **Realtime-
Stimme** unter [Stimme und Sprache](#voice-and-speech) für die Azure-
Einstellungen.
</Note>

Verwenden Sie Azure OpenAI, wenn:

- Sie bereits eine Azure-OpenAI-Subscription, ein Kontingent oder eine Enterprise-Vereinbarung haben
- Sie regionale Datenresidenz oder Compliance-Kontrollen benötigen, die Azure bereitstellt
- Sie den Datenverkehr innerhalb einer bestehenden Azure-Tenancy halten möchten

### Konfiguration

Für Azure-Bildgenerierung über den gebündelten Provider `openai` richten Sie
`models.providers.openai.baseUrl` auf Ihre Azure-Ressource und setzen `apiKey` auf
den Azure-OpenAI-Key (nicht auf einen OpenAI-Platform-Key):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw erkennt diese Azure-Host-Suffixe für die Azure-Route der Bildgenerierung:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Für Anfragen zur Bildgenerierung an einem erkannten Azure-Host führt OpenClaw Folgendes aus:

- Sendet den Header `api-key` statt `Authorization: Bearer`
- Verwendet deployment-bezogene Pfade (`/openai/deployments/{deployment}/...`)
- Hängt `?api-version=...` an jede Anfrage an

Andere Base URLs (öffentliches OpenAI, OpenAI-kompatible Proxys) behalten die Standard-
Anfrageform für OpenAI-Bilder bei.

<Note>
Azure-Routing für den Pfad der Bildgenerierung des Providers `openai` erfordert
OpenClaw 2026.4.22 oder neuer. Frühere Versionen behandeln jede benutzerdefinierte
`openai.baseUrl` wie den öffentlichen OpenAI-Endpunkt und schlagen bei Azure-
Bild-Deployments fehl.
</Note>

### API-Version

Setzen Sie `AZURE_OPENAI_API_VERSION`, um eine bestimmte Azure-Preview- oder GA-Version
für den Azure-Pfad der Bildgenerierung festzulegen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Der Standard ist `2024-12-01-preview`, wenn die Variable nicht gesetzt ist.

### Modellnamen sind Deployment-Namen

Azure OpenAI bindet Modelle an Deployments. Für Anfragen zur Azure-Bildgenerierung,
die über den gebündelten Provider `openai` geroutet werden, muss das Feld `model` in OpenClaw der **Azure-Deployment-Name** sein, den Sie im Azure-Portal konfiguriert haben, nicht
die öffentliche OpenAI-Modell-ID.

Wenn Sie ein Deployment namens `gpt-image-2-prod` erstellen, das `gpt-image-2` bereitstellt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Dieselbe Regel für Deployment-Namen gilt für Aufrufe zur Bildgenerierung,
die über den gebündelten Provider `openai` geroutet werden.

### Regionale Verfügbarkeit

Azure-Bildgenerierung ist derzeit nur in einer Teilmenge von Regionen
verfügbar (zum Beispiel `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Prüfen Sie die aktuelle Regionenliste von Microsoft, bevor Sie ein
Deployment erstellen, und bestätigen Sie, dass das konkrete Modell in Ihrer Region angeboten wird.

### Parameterunterschiede

Azure OpenAI und öffentliches OpenAI akzeptieren nicht immer dieselben Bildparameter.
Azure kann Optionen ablehnen, die öffentliches OpenAI zulässt (zum Beispiel bestimmte
`background`-Werte bei `gpt-image-2`) oder sie nur bei bestimmten Modellversionen bereitstellen. Diese Unterschiede stammen von Azure und dem zugrunde liegenden Modell, nicht von
OpenClaw. Wenn eine Azure-Anfrage mit einem Validierungsfehler fehlschlägt, prüfen Sie im
Azure-Portal, welcher Parametersatz von Ihrem konkreten Deployment und Ihrer API-Version unterstützt wird.

<Note>
Azure OpenAI verwendet natives Transport- und Compat-Verhalten, erhält jedoch
nicht die versteckten Attribution-Header von OpenClaw — siehe das Accordion **Native vs OpenAI-compatible
routes** unter [Erweiterte Konfiguration](#advanced-configuration).

Für Chat- oder Responses-Datenverkehr auf Azure (jenseits der Bildgenerierung) verwenden Sie den
Onboarding-Ablauf oder eine dedizierte Azure-Provider-Konfiguration — `openai.baseUrl` allein
übernimmt nicht die Azure-API-/Auth-Form. Es gibt einen separaten
Provider `azure-openai-responses/*`; siehe
das Accordion zu serverseitiger Compaction unten.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw verwendet WebSocket-first mit SSE-Fallback (`"auto"`) sowohl für `openai/*` als auch `openai-codex/*`.

    Im Modus `"auto"` tut OpenClaw Folgendes:
    - Wiederholt einen frühen WebSocket-Fehler einmal, bevor auf SSE zurückgefallen wird
    - Markiert WebSocket nach einem Fehler für ungefähr 60 Sekunden als degradiert und verwendet während der Abkühlphase SSE
    - Hängt stabile Header für Sitzungs- und Turn-Identität für Wiederholungen und Reconnects an
    - Normalisiert Usage-Zähler (`input_tokens` / `prompt_tokens`) über Transportvarianten hinweg

    | Wert | Verhalten |
    |-------|----------|
    | `"auto"` (Standard) | Zuerst WebSocket, SSE als Fallback |
    | `"sse"` | Nur SSE erzwingen |
    | `"websocket"` | Nur WebSocket erzwingen |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
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
    OpenClaw aktiviert standardmäßig WebSocket-Warm-up für `openai/*` und `openai-codex/*`, um die Latenz beim ersten Turn zu verringern.

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
    OpenClaw stellt einen gemeinsamen Schnellmodus-Schalter für `openai/*` und `openai-codex/*` bereit:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, ordnet OpenClaw den Schnellmodus der Prioritätsverarbeitung von OpenAI zu (`service_tier = "priority"`). Bestehende `service_tier`-Werte bleiben erhalten, und der Schnellmodus schreibt `reasoning` oder `text.verbosity` nicht um.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Wenn Sie die Sitzungsüberschreibung in der Sitzungs-UI löschen, kehrt die Sitzung zum konfigurierten Standard zurück.
    </Note>

  </Accordion>

  <Accordion title="Prioritätsverarbeitung (service_tier)">
    Die API von OpenAI stellt Prioritätsverarbeitung über `service_tier` bereit. Legen Sie sie in OpenClaw pro Modell fest:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Unterstützte Werte: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` wird nur an native OpenAI-Endpunkte (`api.openai.com`) und native Codex-Endpunkte (`chatgpt.com/backend-api`) weitergeleitet. Wenn Sie einen der beiden Provider über einen Proxy routen, lässt OpenClaw `service_tier` unverändert.
    </Warning>

  </Accordion>

  <Accordion title="Serverseitige Compaction (Responses API)">
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`) aktiviert der Stream-Wrapper des OpenAI-Plugins für das PI-Harness serverseitige Compaction automatisch:

    - Erzwingt `store: true` (außer wenn Modell-Compat `supportsStore: false` setzt)
    - Injiziert `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Standard-`compact_threshold`: 70 % von `contextWindow` (oder `80000`, wenn nicht verfügbar)

    Dies gilt für den eingebauten PI-Harness-Pfad und für OpenAI-Provider-Hooks, die von eingebetteten Läufen verwendet werden. Das native Codex-App-Server-Harness verwaltet seinen eigenen Kontext über Codex und wird separat mit `agents.defaults.embeddedHarness.runtime` konfiguriert.

    <Tabs>
      <Tab title="Explizit aktivieren">
        Nützlich für kompatible Endpunkte wie Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
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
    `responsesServerCompaction` steuert nur die Injektion von `context_management`. Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, sofern Compat nicht `supportsStore: false` setzt.
    </Note>

  </Accordion>

  <Accordion title="Strikter agentischer GPT-Modus">
    Für Läufe der GPT-5-Familie auf `openai/*` kann OpenClaw einen strengeren eingebetteten Ausführungsvertrag verwenden:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Mit `strict-agentic` tut OpenClaw Folgendes:
    - Behandelt einen Turn nur mit Plan nicht mehr als erfolgreichen Fortschritt, wenn eine Tool-Aktion verfügbar ist
    - Wiederholt den Turn mit einer „jetzt handeln“-Steuerung
    - Aktiviert `update_plan` automatisch für umfangreichere Arbeit
    - Zeigt einen expliziten blockierten Zustand an, wenn das Modell weiter plant, ohne zu handeln

    <Note>
    Nur auf Läufe der GPT-5-Familie von OpenAI und Codex beschränkt. Andere Provider und ältere Modellfamilien behalten das Standardverhalten bei.
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle bei, die `none` als Aufwand bei OpenAI unterstützen
    - Lassen deaktiviertes Reasoning bei Modellen oder Proxys weg, die `reasoning.effort: "none"` ablehnen
    - Setzen Tool-Schemas standardmäßig auf Strict Mode
    - Hängen versteckte Attribution-Header nur an verifizierten nativen Hosts an
    - Behalten OpenAI-spezifische Request-Gestaltung bei (`service_tier`, `store`, Reasoning-Compat, Hinweise zum Prompt-Cache)

    **Proxy-/kompatible Routen:**
    - Verwenden lockereres Compat-Verhalten
    - Entfernen Completions-`store` aus nicht nativen Payloads von `openai-completions`
    - Akzeptieren erweitertes Pass-through-JSON `params.extra_body`/`params.extraBody` für OpenAI-kompatible Completions-Proxys
    - Erzwingen weder strikte Tool-Schemas noch native-only-Header

    Azure OpenAI verwendet natives Transport- und Compat-Verhalten, erhält aber nicht die versteckten Attribution-Header.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Fallback-Verhalten.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter für Bild-Tools und Providerauswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter für Video-Tools und Providerauswahl.
  </Card>
  <Card title="OAuth und Auth" href="/de/gateway/authentication" icon="key">
    Details zu Authentifizierung und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
