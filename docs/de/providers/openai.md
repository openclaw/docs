---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten Codex-Abonnement-Authentifizierung anstelle von API-Schlüsseln verwenden
    - Sie benötigen ein strengeres Ausführungsverhalten des GPT-5-Agenten
summary: OpenAI in OpenClaw über API-Schlüssel oder ein Codex-Abonnement verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T18:21:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f099227b8c8be3a4e919ea286fcede1e4e47be60c7593eb63b4cbbe85aa8389
    source_path: providers/openai.md
    workflow: 15
---

OpenAI stellt Entwickler-APIs für GPT-Modelle bereit. OpenClaw unterstützt drei Routen der OpenAI-Familie. Das Modellpräfix wählt die Route aus:

- **API-Schlüssel** — direkter Zugriff auf die OpenAI Platform mit nutzungsbasierter Abrechnung (`openai/*`-Modelle)
- **Codex-Abonnement über PI** — ChatGPT-/Codex-Anmeldung mit Abonnementzugriff (`openai-codex/*`-Modelle)
- **Codex-App-Server-Harness** — native Ausführung über den Codex-App-Server (`openai/*`-Modelle plus `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI unterstützt die Verwendung von Abonnement-OAuth in externen Tools und Workflows wie OpenClaw ausdrücklich.

Provider, Modell, Laufzeit und Kanal sind separate Ebenen. Wenn diese Bezeichnungen
durcheinandergeraten, lesen Sie vor dem Ändern der Konfiguration
[Agent runtimes](/de/concepts/agent-runtimes).

## Schnellauswahl

| Ziel                                          | Verwenden                                                 | Hinweise                                                                    |
| --------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Direkte Abrechnung per API-Schlüssel          | `openai/gpt-5.5`                                          | Setzen Sie `OPENAI_API_KEY` oder führen Sie das OpenAI-API-Schlüssel-Onboarding aus. |
| GPT-5.5 mit ChatGPT-/Codex-Abonnement-Authentifizierung | `openai-codex/gpt-5.5`                        | Standard-PI-Route für Codex OAuth. Beste erste Wahl für Setups mit Abonnement. |
| GPT-5.5 mit nativem Codex-App-Server-Verhalten | `openai/gpt-5.5` plus `embeddedHarness.runtime: "codex"` | Erzwingt das Codex-App-Server-Harness für diese Modellreferenz.             |
| Bilderzeugung oder -bearbeitung               | `openai/gpt-image-2`                                      | Funktioniert entweder mit `OPENAI_API_KEY` oder mit OpenAI Codex OAuth.     |

<Note>
GPT-5.5 ist sowohl über direkten API-Schlüssel-Zugriff auf die OpenAI Platform als auch
über Abonnement-/OAuth-Routen verfügbar. Verwenden Sie `openai/gpt-5.5` für direkten Verkehr
über `OPENAI_API_KEY`, `openai-codex/gpt-5.5` für Codex OAuth über PI oder
`openai/gpt-5.5` mit `embeddedHarness.runtime: "codex"` für das native Codex-
App-Server-Harness.
</Note>

<Note>
Das Aktivieren des OpenAI-Plugins oder die Auswahl eines `openai-codex/*`-Modells
aktiviert nicht das gebündelte Codex-App-Server-Plugin. OpenClaw aktiviert dieses Plugin nur dann,
wenn Sie das native Codex-Harness explizit mit
`embeddedHarness.runtime: "codex"` auswählen oder eine veraltete `codex/*`-Modellreferenz verwenden.
</Note>

## Funktionsabdeckung in OpenClaw

| OpenAI-Funktion            | Oberfläche in OpenClaw                                   | Status                                                 |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses           | `openai/<model>`-Modellprovider                          | Ja                                                     |
| Codex-Abonnement-Modelle   | `openai-codex/<model>` mit `openai-codex` OAuth          | Ja                                                     |
| Codex-App-Server-Harness   | `openai/<model>` mit `embeddedHarness.runtime: codex`    | Ja                                                     |
| Serverseitige Websuche     | natives OpenAI-Responses-Tool                            | Ja, wenn Websuche aktiviert ist und kein Provider festgelegt wurde |
| Bilder                     | `image_generate`                                         | Ja                                                     |
| Videos                     | `video_generate`                                         | Ja                                                     |
| Text-to-Speech             | `messages.tts.provider: "openai"` / `tts`                | Ja                                                     |
| Batch-Speech-to-Text       | `tools.media.audio` / Medienverständnis                  | Ja                                                     |
| Streaming-Speech-to-Text   | Sprachanruf `streaming.provider: "openai"`               | Ja                                                     |
| Echtzeitstimme             | Sprachanruf `realtime.provider: "openai"` / Control UI Talk | Ja                                                  |
| Embeddings                 | Memory-Embedding-Provider                                | Ja                                                     |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="API-Schlüssel (OpenAI Platform)">
    **Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel aus dem [OpenAI Platform dashboard](https://platform.openai.com/api-keys).
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
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Routenübersicht

    | Modellreferenz | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.5` | direkte OpenAI-Platform-API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | direkte OpenAI-Platform-API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` ist die direkte OpenAI-API-Schlüssel-Route, sofern Sie nicht ausdrücklich
    das Codex-App-Server-Harness erzwingen. Verwenden Sie `openai-codex/*` für Codex OAuth über
    den standardmäßigen Pi-Runner oder `openai/gpt-5.5` mit
    `embeddedHarness.runtime: "codex"` für native Codex-App-Server-Ausführung.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw stellt **nicht** `openai/gpt-5.3-codex-spark` bereit. Live-Anfragen an die OpenAI-API lehnen dieses Modell ab, und auch der aktuelle Codex-Katalog stellt es nicht bereit.
    </Warning>

  </Tab>

  <Tab title="Codex-Abonnement">
    **Am besten geeignet für:** die Nutzung Ihres ChatGPT-/Codex-Abonnements anstelle eines separaten API-Schlüssels. Codex Cloud erfordert eine ChatGPT-Anmeldung.

    <Steps>
      <Step title="Codex OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oder OAuth direkt ausführen:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Für Headless- oder callback-unfreundliche Setups fügen Sie `--device-code` hinzu, um sich mit einem ChatGPT-Device-Code-Flow anstelle des Browser-Callbacks auf localhost anzumelden:

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

    ### Routenübersicht

    | Modellreferenz | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT-/Codex-OAuth über PI | Codex-Anmeldung |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex-App-Server-Harness | Codex-App-Server-Authentifizierung |

    <Note>
    Verwenden Sie weiterhin die Provider-ID `openai-codex` für Auth-/Profilbefehle. Das
    Modellpräfix `openai-codex/*` ist auch die explizite PI-Route für Codex OAuth.
    Es wählt das gebündelte Codex-App-Server-Harness nicht aus und aktiviert es nicht automatisch.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Beim Onboarding wird OAuth-Material nicht mehr aus `~/.codex` importiert. Melden Sie sich mit Browser-OAuth (Standard) oder dem oben genannten Device-Code-Flow an — OpenClaw verwaltet die resultierenden Anmeldedaten im eigenen Agent-Auth-Store.
    </Note>

    ### Statusanzeige

    Der Chat-Befehl `/status` zeigt an, welche Modelllaufzeit für die aktuelle Sitzung aktiv ist.
    Das standardmäßige Pi-Harness erscheint als `Runtime: OpenClaw Pi Default`. Wenn das
    gebündelte Codex-App-Server-Harness ausgewählt ist, zeigt `/status`
    `Runtime: OpenAI Codex`. Bestehende Sitzungen behalten ihre aufgezeichnete Harness-ID bei. Verwenden Sie also
    `/new` oder `/reset` nach dem Ändern von `embeddedHarness`, wenn `/status`
    eine neue Auswahl für Pi/Codex widerspiegeln soll.

    ### Obergrenze für das Kontextfenster

    OpenClaw behandelt Modellmetadaten und die Laufzeitobergrenze für den Kontext als getrennte Werte.

    Für `openai-codex/gpt-5.5` über Codex OAuth:

    - natives `contextWindow`: `1000000`
    - Standardobergrenze der Laufzeit für `contextTokens`: `272000`

    Die kleinere Standardobergrenze hat in der Praxis bessere Latenz- und Qualitätsmerkmale. Überschreiben Sie sie mit `contextTokens`:

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
    Verwenden Sie `contextWindow`, um native Modellmetadaten zu deklarieren. Verwenden Sie `contextTokens`, um das Laufzeitbudget für den Kontext zu begrenzen.
    </Note>

    ### Katalogwiederherstellung

    OpenClaw verwendet Upstream-Codex-Katalogmetadaten für `gpt-5.5`, wenn sie
    vorhanden sind. Wenn die Live-Codex-Erkennung die Zeile `openai-codex/gpt-5.5` auslässt, obwohl
    das Konto authentifiziert ist, erzeugt OpenClaw diese OAuth-Modellzeile synthetisch, sodass
    Cron-, Subagenten- und konfigurierte Standardmodell-Läufe nicht mit
    `Unknown model` fehlschlagen.

  </Tab>
</Tabs>

## Bilderzeugung

Das gebündelte `openai`-Plugin registriert die Bilderzeugung über das Tool `image_generate`.
Es unterstützt sowohl OpenAI-Bilderzeugung mit API-Schlüssel als auch Bilderzeugung
mit Codex OAuth über dieselbe Modellreferenz `openai/gpt-image-2`.

| Funktion                  | OpenAI-API-Schlüssel                | Codex OAuth                          |
| ------------------------- | ----------------------------------- | ------------------------------------ |
| Modellreferenz            | `openai/gpt-image-2`                | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                    | OpenAI Codex OAuth-Anmeldung         |
| Transport                 | OpenAI Images API                   | Codex-Responses-Backend              |
| Maximale Bilder pro Anfrage | 4                                 | 4                                    |
| Bearbeitungsmodus         | Aktiviert (bis zu 5 Referenzbilder) | Aktiviert (bis zu 5 Referenzbilder)  |
| Größenüberschreibungen    | Unterstützt, einschließlich 2K-/4K-Größen | Unterstützt, einschließlich 2K-/4K-Größen |
| Seitenverhältnis / Auflösung | Nicht an die OpenAI Images API weitergeleitet | Wird, wenn sicher, auf eine unterstützte Größe abgebildet |

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
Siehe [Image Generation](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

`gpt-image-2` ist der Standard sowohl für OpenAI-Text-zu-Bild-Erzeugung als auch für Bildbearbeitung. `gpt-image-1` bleibt als explizite Modellüberschreibung verwendbar, aber neue
OpenAI-Bild-Workflows sollten `openai/gpt-image-2` verwenden.

Bei Installationen mit Codex OAuth behalten Sie dieselbe Referenz `openai/gpt-image-2` bei. Wenn ein
OAuth-Profil für `openai-codex` konfiguriert ist, löst OpenClaw das gespeicherte OAuth-
Zugriffstoken auf und sendet Bildanfragen über das Codex-Responses-Backend. Es
versucht dabei nicht zuerst `OPENAI_API_KEY` und fällt für diese
Anfrage auch nicht stillschweigend auf einen API-Schlüssel zurück. Konfigurieren Sie `models.providers.openai`
explizit mit einem API-Schlüssel, einer benutzerdefinierten Base-URL oder einem Azure-Endpunkt, wenn Sie stattdessen die direkte Route über die OpenAI Images API
verwenden möchten.
Wenn sich dieser benutzerdefinierte Bildendpunkt in einem vertrauenswürdigen LAN/unter einer privaten Adresse befindet, setzen Sie zusätzlich
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw hält
private/interne OpenAI-kompatible Bildendpunkte blockiert, solange diese Opt-in-Einstellung nicht
vorhanden ist.

Erzeugen:

```
/tool image_generate model=openai/gpt-image-2 prompt="Ein hochwertiges Launch-Poster für OpenClaw auf macOS" size=3840x2160 count=1
```

Bearbeiten:

```
/tool image_generate model=openai/gpt-image-2 prompt="Behalte die Form des Objekts bei und ändere das Material zu transluzentem Glas" image=/path/to/reference.png size=1024x1536
```

## Videoerzeugung

Das gebündelte `openai`-Plugin registriert Videoerzeugung über das Tool `video_generate`.

| Funktion         | Wert                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| Standardmodell   | `openai/sora-2`                                                                   |
| Modi             | Text-zu-Video, Bild-zu-Video, Bearbeitung eines einzelnen Videos                  |
| Referenzeingaben | 1 Bild oder 1 Video                                                               |
| Größenüberschreibungen | Unterstützt                                                                 |
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
Siehe [Video Generation](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## GPT-5-Prompt-Beitrag

OpenClaw fügt für Läufe der GPT-5-Familie providerübergreifend einen gemeinsamen GPT-5-Prompt-Beitrag hinzu. Er wird nach Modell-ID angewendet, sodass `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` und andere kompatible GPT-5-Referenzen dieselbe Überlagerung erhalten. Ältere GPT-4.x-Modelle tun dies nicht.

Das gebündelte native Codex-Harness verwendet dasselbe GPT-5-Verhalten und dieselbe Heartbeat-Überlagerung über die Entwickleranweisungen des Codex-App-Servers, sodass `openai/gpt-5.x`-Sitzungen, die über `embeddedHarness.runtime: "codex"` erzwungen werden, dieselbe Follow-through- und proaktive Heartbeat-Steuerung beibehalten, auch wenn Codex den Rest des Harness-Prompts verwaltet.

Der GPT-5-Beitrag fügt einen markierten Verhaltensvertrag für Persona-Beständigkeit, Ausführungssicherheit, Tool-Disziplin, Ausgabeform, Abschlussprüfungen und Verifikation hinzu. Kanalspezifisches Antwort- und Silent-Message-Verhalten bleibt im gemeinsamen OpenClaw-Systemprompt und in der Richtlinie für ausgehende Zustellung. Die GPT-5-Steuerung ist für passende Modelle immer aktiviert. Die Ebene für den freundlichen Interaktionsstil ist getrennt und konfigurierbar.

| Wert                   | Effekt                                           |
| ---------------------- | ------------------------------------------------ |
| `"friendly"` (Standard) | Die Ebene für den freundlichen Interaktionsstil aktivieren |
| `"on"`                 | Alias für `"friendly"`                           |
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
Werte sind zur Laufzeit nicht case-sensitiv, daher deaktivieren sowohl `"Off"` als auch `"off"` die Ebene für den freundlichen Stil.
</Tip>

<Note>
Das veraltete `plugins.entries.openai.config.personality` wird weiterhin als Kompatibilitäts-Fallback gelesen, wenn die gemeinsame Einstellung `agents.defaults.promptOverlays.gpt5.personality` nicht gesetzt ist.
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
    Setzen Sie `OPENAI_TTS_BASE_URL`, um die TTS-Base-URL zu überschreiben, ohne den API-Endpunkt für Chat zu beeinflussen.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-Text">
    Das gebündelte `openai`-Plugin registriert Batch-Speech-to-Text über
    die OpenClaw-Oberfläche für die Transkription im Medienverständnis.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpunkt: OpenAI REST `/v1/audio/transcriptions`
    - Eingabepfad: Multipart-Upload einer Audiodatei
    - Unterstützt in OpenClaw überall dort, wo die Transkription eingehender Audiodaten
      `tools.media.audio` verwendet, einschließlich Discord-Sprachkanalsegmenten und Kanal-
      Audioanhängen

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
    gemeinsamen Audio-Medienkonfiguration oder einer Transkriptionsanfrage pro Aufruf bereitgestellt werden.

  </Accordion>

  <Accordion title="Echtzeittranskription">
    Das gebündelte `openai`-Plugin registriert Echtzeittranskription für das Voice-Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sprache | `...openai.language` | (nicht gesetzt) |
    | Prompt | `...openai.prompt` | (nicht gesetzt) |
    | Dauer der Stille | `...openai.silenceDurationMs` | `800` |
    | VAD-Schwelle | `...openai.vadThreshold` | `0.5` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit G.711 u-law (`g711_ulaw` / `audio/pcmu`) Audio. Dieser Streaming-Provider ist für den Pfad der Echtzeittranskription von Voice Call gedacht; Discord Voice zeichnet derzeit stattdessen kurze Segmente auf und verwendet den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Echtzeitstimme">
    Das gebündelte `openai`-Plugin registriert Echtzeitstimme für das Voice-Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Stimme | `...openai.voice` | `alloy` |
    | Temperatur | `...openai.temperature` | `0.8` |
    | VAD-Schwelle | `...openai.vadThreshold` | `0.5` |
    | Dauer der Stille | `...openai.silenceDurationMs` | `500` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Unterstützt Azure OpenAI über die Konfigurationsschlüssel `azureEndpoint` und `azureDeployment`. Unterstützt bidirektionale Tool-Aufrufe. Verwendet das Audioformat G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure-OpenAI-Endpunkte

Der gebündelte `openai`-Provider kann für die Bilderzeugung eine Azure-OpenAI-Ressource ansprechen,
indem die Base-URL überschrieben wird. Auf dem Pfad der Bilderzeugung erkennt OpenClaw
Azure-Hostnamen unter `models.providers.openai.baseUrl` und wechselt automatisch zur
Azure-Anfrageform.

<Note>
Echtzeitstimme verwendet einen separaten Konfigurationspfad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
und wird nicht von `models.providers.openai.baseUrl` beeinflusst. Siehe das Akkordeon **Echtzeitstimme**
unter [Stimme und Sprache](#voice-and-speech) für die Azure-
Einstellungen.
</Note>

Verwenden Sie Azure OpenAI, wenn:

- Sie bereits ein Azure-OpenAI-Abonnement, Kontingent oder Enterprise Agreement haben
- Sie regionale Datenresidenz oder Compliance-Kontrollen benötigen, die Azure bereitstellt
- Sie den Datenverkehr innerhalb eines bestehenden Azure-Tenants halten möchten

### Konfiguration

Für Azure-Bilderzeugung über den gebündelten `openai`-Provider richten Sie
`models.providers.openai.baseUrl` auf Ihre Azure-Ressource und setzen `apiKey` auf
den Azure-OpenAI-Schlüssel (nicht auf einen OpenAI-Platform-Schlüssel):

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

OpenClaw erkennt diese Azure-Host-Suffixe für die Azure-Route der Bilderzeugung:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Für Anfragen zur Bilderzeugung an einem erkannten Azure-Host führt OpenClaw Folgendes aus:

- Sendet den Header `api-key` anstelle von `Authorization: Bearer`
- Verwendet deploymentbezogene Pfade (`/openai/deployments/{deployment}/...`)
- Hängt `?api-version=...` an jede Anfrage an

Andere Base-URLs (öffentliches OpenAI, OpenAI-kompatible Proxys) behalten die Standard-
Anfrageform für OpenAI-Bilder bei.

<Note>
Azure-Routing für den Pfad der Bilderzeugung des `openai`-Providers erfordert
OpenClaw 2026.4.22 oder neuer. Frühere Versionen behandeln jede benutzerdefinierte
`openai.baseUrl` wie den öffentlichen OpenAI-Endpunkt und schlagen bei Azure-
Bild-Deployments fehl.
</Note>

### API-Version

Setzen Sie `AZURE_OPENAI_API_VERSION`, um eine bestimmte Azure-Preview- oder GA-Version
für den Azure-Pfad der Bilderzeugung festzulegen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Der Standard ist `2024-12-01-preview`, wenn die Variable nicht gesetzt ist.

### Modellnamen sind Deployment-Namen

Azure OpenAI bindet Modelle an Deployments. Für Azure-Anfragen zur Bilderzeugung,
die über den gebündelten `openai`-Provider geroutet werden, muss das Feld `model` in OpenClaw
der **Azure-Deployment-Name** sein, den Sie im Azure-Portal konfiguriert haben, nicht
die öffentliche OpenAI-Modell-ID.

Wenn Sie ein Deployment mit dem Namen `gpt-image-2-prod` erstellen, das `gpt-image-2` bedient:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Ein sauberes Poster" size=1024x1024 count=1
```

Dieselbe Regel für Deployment-Namen gilt auch für Aufrufe der Bilderzeugung, die über
den gebündelten `openai`-Provider geroutet werden.

### Regionale Verfügbarkeit

Die Azure-Bilderzeugung ist derzeit nur in einer Teilmenge von Regionen
verfügbar (zum Beispiel `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Prüfen Sie die aktuelle Regionenliste von Microsoft, bevor Sie ein
Deployment erstellen, und bestätigen Sie, dass das spezifische Modell in Ihrer Region angeboten wird.

### Parameterunterschiede

Azure OpenAI und öffentliches OpenAI akzeptieren nicht immer dieselben Bildparameter.
Azure kann Optionen ablehnen, die öffentliches OpenAI zulässt (zum Beispiel bestimmte
`background`-Werte bei `gpt-image-2`) oder sie nur für bestimmte
Modellversionen bereitstellen. Diese Unterschiede kommen von Azure und dem zugrunde liegenden Modell, nicht von
OpenClaw. Wenn eine Azure-Anfrage mit einem Validierungsfehler fehlschlägt, prüfen Sie im
Azure-Portal den Parametersatz, der von Ihrem konkreten Deployment und Ihrer API-Version
unterstützt wird.

<Note>
Azure OpenAI verwendet natives Transport- und Compat-Verhalten, erhält jedoch nicht
die verborgenen Attributions-Header von OpenClaw — siehe das Akkordeon **Nativ vs. OpenAI-kompatible
Routen** unter [Erweiterte Konfiguration](#advanced-configuration).

Für Chat- oder Responses-Datenverkehr auf Azure (über die Bilderzeugung hinaus) verwenden Sie den
Onboarding-Ablauf oder eine dedizierte Azure-Provider-Konfiguration — `openai.baseUrl` allein
übernimmt nicht die Azure-API-/Auth-Form. Es gibt einen separaten
Provider `azure-openai-responses/*`; siehe
das unten stehende Akkordeon zu serverseitiger Compaction.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs. SSE)">
    OpenClaw verwendet für `openai/*` und `openai-codex/*` vorrangig WebSocket mit SSE-Fallback (`"auto"`).

    Im Modus `"auto"` führt OpenClaw Folgendes aus:
    - Wiederholt einen frühen WebSocket-Fehler einmal, bevor auf SSE zurückgefallen wird
    - Markiert WebSocket nach einem Fehler für etwa 60 Sekunden als degradiert und verwendet während der Abkühlphase SSE
    - Hängt stabile Header für Sitzungs- und Zugidentität für Wiederholungen und Wiederverbindungen an
    - Normalisiert Nutzungszähler (`input_tokens` / `prompt_tokens`) über Transportvarianten hinweg

    | Wert | Verhalten |
    |-------|----------|
    | `"auto"` (Standard) | zuerst WebSocket, SSE-Fallback |
    | `"sse"` | nur SSE erzwingen |
    | `"websocket"` | nur WebSocket erzwingen |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
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
    OpenClaw aktiviert standardmäßig WebSocket-Warm-up für `openai/*` und `openai-codex/*`, um die Latenz des ersten Zugs zu verringern.

    ```json5
    // Warm-up deaktivieren
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fast-Modus">
    OpenClaw stellt einen gemeinsamen Fast-Modus-Schalter für `openai/*` und `openai-codex/*` bereit:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, ordnet OpenClaw den Fast-Modus der OpenAI-Prioritätsverarbeitung zu (`service_tier = "priority"`). Vorhandene Werte für `service_tier` bleiben erhalten, und der Fast-Modus schreibt `reasoning` oder `text.verbosity` nicht um.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Wenn Sie die Sitzungsüberschreibung in der Sessions-UI löschen, kehrt die Sitzung zum konfigurierten Standard zurück.
    </Note>

  </Accordion>

  <Accordion title="Prioritätsverarbeitung (service_tier)">
    Die OpenAI-API stellt Prioritätsverarbeitung über `service_tier` bereit. Legen Sie sie in OpenClaw pro Modell fest:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
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
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`) aktiviert der Pi-Harness-Stream-Wrapper des OpenAI-Plugins serverseitige Compaction automatisch:

    - Erzwingt `store: true` (es sei denn, die Modell-Compat setzt `supportsStore: false`)
    - Injiziert `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Standardwert für `compact_threshold`: 70 % von `contextWindow` (oder `80000`, wenn nicht verfügbar)

    Dies gilt für den integrierten Pi-Harness-Pfad und für OpenAI-Provider-Hooks, die von eingebetteten Läufen verwendet werden. Das native Codex-App-Server-Harness verwaltet seinen Kontext selbst über Codex und wird separat mit `agents.defaults.embeddedHarness.runtime` konfiguriert.

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
                "openai/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
    `responsesServerCompaction` steuert nur die Injektion von `context_management`. Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, es sei denn, die Compat setzt `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Strict-Agentic-GPT-Modus">
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

    Mit `strict-agentic` gilt in OpenClaw:
    - Ein Zug nur mit Plan wird nicht mehr als erfolgreicher Fortschritt behandelt, wenn eine Tool-Aktion verfügbar ist
    - Der Zug wird mit einer Jetzt-handeln-Steuerung erneut versucht
    - `update_plan` wird für umfangreichere Arbeit automatisch aktiviert
    - Ein expliziter Blockiert-Zustand wird angezeigt, wenn das Modell weiter plant, ohne zu handeln

    <Note>
    Gilt nur für OpenAI- und Codex-Läufe der GPT-5-Familie. Andere Provider und ältere Modellfamilien behalten das Standardverhalten bei.
    </Note>

  </Accordion>

  <Accordion title="Nativ vs. OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle bei, die das OpenAI-`none`-Effort unterstützen
    - Lassen deaktiviertes Reasoning für Modelle oder Proxys weg, die `reasoning.effort: "none"` ablehnen
    - Setzen Tool-Schemas standardmäßig auf den Strict-Modus
    - Hängen verborgene Attributions-Header nur an verifizierte native Hosts an
    - Behalten OpenAI-spezifische Request-Formung bei (`service_tier`, `store`, Reasoning-Compat, Prompt-Cache-Hinweise)

    **Proxy-/kompatible Routen:**
    - Verwenden lockereres Compat-Verhalten
    - Entfernen Completions-`store` aus nicht nativen `openai-completions`-Payloads
    - Akzeptieren erweitertes Pass-through-JSON über `params.extra_body`/`params.extraBody` für OpenAI-kompatible Completions-Proxys
    - Erzwingen keine strikten Tool-Schemas oder nur für native Routen gedachte Header

    Azure OpenAI verwendet natives Transport- und Compat-Verhalten, erhält aber nicht die verborgenen Attributions-Header.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Bilderzeugung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bild-Tools und Providerauswahl.
  </Card>
  <Card title="Videoerzeugung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Providerauswahl.
  </Card>
  <Card title="OAuth und Auth" href="/de/gateway/authentication" icon="key">
    Details zu Authentifizierung und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
