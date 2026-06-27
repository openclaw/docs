---
read_when:
    - Sie möchten Grok-Modelle in OpenClaw verwenden
    - Sie konfigurieren xAI-Authentifizierung oder Modell-IDs
summary: xAI Grok-Modelle in OpenClaw verwenden
title: xAI
x-i18n:
    generated_at: "2026-06-27T18:08:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw liefert ein gebündeltes `xai`-Provider-Plugin für Grok-Modelle aus. Für die meisten
Benutzer ist der empfohlene Weg Grok OAuth mit einem berechtigten SuperGrok- oder X Premium-
Abonnement. OpenClaw bleibt local-first: Gateway, Konfiguration, Routing und
Tools laufen auf Ihrem Computer, während Grok-Modellanfragen über xAI
authentifiziert und an die API von xAI gesendet werden.

OAuth erfordert keinen xAI-API-Schlüssel und erfordert nicht die Grok Build-
App. xAI kann auf dem Zustimmungsbildschirm dennoch Grok Build anzeigen, weil OpenClaw
den gemeinsamen OAuth-Client von xAI verwendet.

## Wählen Sie Ihren Einrichtungsweg

Verwenden Sie den Weg, der zu Ihrem OpenClaw-Installationsstatus passt:

<Steps>
  <Step title="Neue OpenClaw-Installation">
    Führen Sie das Onboarding mit Daemon-Installation aus, wenn Sie ein neues lokales
    Gateway einrichten, und wählen Sie dann im Modell-/Authentifizierungsschritt die xAI/Grok-OAuth-Option:

    ```bash
    openclaw onboard --install-daemon
    ```

    Wählen Sie auf einem VPS oder über SSH direkt xAI OAuth aus; OpenClaw verwendet die
    Gerätecode-Verifizierung und erfordert keinen localhost-Callback:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth erfordert keinen xAI-API-Schlüssel. OpenClaw erfordert nicht die Grok
    Build-App. xAI kann die Zustimmungs-App dennoch als Grok Build bezeichnen, weil
    OpenClaw den gemeinsamen OAuth-Client von xAI verwendet.

  </Step>
  <Step title="Bestehende OpenClaw-Installation">
    Wenn OpenClaw bereits konfiguriert ist, melden Sie sich nur bei xAI an. Führen Sie nicht das vollständige
    Onboarding erneut aus und installieren Sie den Daemon nicht erneut, nur um Grok zu verbinden:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Um Grok nach der Anmeldung als Standardmodell festzulegen, wenden Sie dies separat an:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Führen Sie das vollständige Onboarding nur erneut aus, wenn Sie Gateway,
    Daemon, Kanal, Arbeitsbereich oder andere Einrichtungsoptionen absichtlich ändern möchten.

  </Step>
  <Step title="API-Schlüssel-Weg">
    Die Einrichtung per API-Schlüssel funktioniert weiterhin für xAI-Console-Schlüssel und für Medienoberflächen, die
    eine schlüsselgestützte Provider-Konfiguration erfordern:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Modell auswählen">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw verwendet die xAI Responses API als gebündelten xAI-Transport. Dieselben
Anmeldedaten aus `openclaw models auth login --provider xai --method oauth` oder
`openclaw models auth login --provider xai --method api-key` können auch erstklassige
`web_search`, `x_search`, entfernte `code_execution` sowie xAI-Bild-/Videogenerierung betreiben.
Sprache und Transkription erfordern derzeit `XAI_API_KEY` oder Provider-Konfiguration.
Grok-gestützte `web_search` bevorzugt xAI OAuth und fällt auf `XAI_API_KEY` oder
Plugin-Websuche-Konfiguration zurück.
Wenn Sie einen xAI-Schlüssel unter `plugins.entries.xai.config.webSearch.apiKey` speichern,
verwendet der gebündelte xAI-Modell-Provider diesen Schlüssel ebenfalls als Fallback.
Setzen Sie `plugins.entries.xai.config.webSearch.baseUrl`, um Grok `web_search`
und standardmäßig `x_search` über einen Betreiber-xAI-Responses-Proxy zu routen.
`code_execution`-Tuning befindet sich unter `plugins.entries.xai.config.codeExecution`.
</Note>

## OAuth-Fehlerbehebung

- Verwenden Sie für SSH, Docker, VPS oder andere Remote-Setups
  `openclaw models auth login --provider xai --method oauth`; xAI OAuth verwendet
  Gerätecode-Verifizierung statt eines localhost-Callbacks.
- Wenn die Anmeldung erfolgreich ist, Grok aber nicht das Standardmodell ist, führen Sie
  `openclaw models set xai/grok-4.3` aus.
- Um gespeicherte xAI-Authentifizierungsprofile zu prüfen, führen Sie aus:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI entscheidet, welche Konten OAuth-API-Tokens erhalten können. Wenn ein Konto nicht
  berechtigt ist, versuchen Sie den API-Schlüssel-Weg oder prüfen Sie das Abonnement auf xAI-Seite.

<Tip>
Verwenden Sie `xai-oauth`, wenn Sie sich über SSH, Docker oder einen VPS anmelden. OpenClaw gibt eine
xAI-URL und einen kurzen Code aus; schließen Sie die Anmeldung in einem beliebigen lokalen Browser ab, während der Remote-
Prozess xAI nach dem abgeschlossenen Token-Austausch abfragt.
</Tip>

## Integrierter Katalog

OpenClaw enthält die aktuellen xAI-Chatmodelle standardmäßig, in Modell-Auswahllisten vom neuesten
zuerst sortiert:

| Familie       | Modell-IDs                                                               |
| ------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

Das Plugin löst ältere Grok 3-, Grok 4-, Grok 4 Fast-, Grok 4.1
Fast- und Grok Code-Slugs für bestehende Konfigurationen weiterhin weiter auf. Offizielle Grok Code Fast-Aliase
normalisieren zu `grok-build-0.1`; OpenClaw zeigt die anderen zurückgezogenen
Upstream-Slugs nicht mehr im auswählbaren Katalog an.

<Tip>
Verwenden Sie `grok-4.3` für allgemeinen Chat und `grok-build-0.1` für build-/coding-orientierte
Workloads, es sei denn, Sie benötigen ausdrücklich einen Grok 4.20-Beta-Alias.
</Tip>

## OpenClaw-Funktionsabdeckung

Das gebündelte Plugin bildet die aktuelle öffentliche API-Oberfläche von xAI auf die gemeinsamen
Provider- und Tool-Verträge von OpenClaw ab. Funktionen, die nicht zum gemeinsamen Vertrag passen
(zum Beispiel Streaming-TTS und Echtzeit-Sprache), werden nicht offengelegt - siehe die Tabelle
unten.

| xAI-Fähigkeit              | OpenClaw-Oberfläche                       | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | `xai/<model>` Modell-Provider             | Ja                                                                  |
| Serverseitige Websuche     | `web_search` Provider `grok`              | Ja                                                                  |
| Serverseitige X-Suche      | `x_search` Tool                           | Ja                                                                  |
| Serverseitige Codeausführung | `code_execution` Tool                   | Ja                                                                  |
| Bilder                     | `image_generate`                          | Ja                                                                  |
| Videos                     | `video_generate`                          | Ja                                                                  |
| Batch-Text-zu-Sprache      | `messages.tts.provider: "xai"` / `tts`    | Ja                                                                  |
| Streaming-TTS              | -                                         | Nicht offengelegt; der TTS-Vertrag von OpenClaw gibt vollständige Audiopuffer zurück |
| Batch-Sprache-zu-Text      | `tools.media.audio` / Medienverständnis   | Ja                                                                  |
| Streaming-Sprache-zu-Text  | Sprachanruf `streaming.provider: "xai"`   | Ja                                                                  |
| Echtzeit-Sprache           | -                                         | Noch nicht offengelegt; anderer Sitzungs-/WebSocket-Vertrag         |
| Dateien / Batches          | Nur generische Modell-API-Kompatibilität  | Kein erstklassiges OpenClaw-Tool                                    |

<Note>
OpenClaw verwendet die REST-APIs von xAI für Bild/Video/TTS/STT für Mediengenerierung,
Sprache und Batch-Transkription, den Streaming-STT-WebSocket von xAI für Live-
Sprachanruf-Transkription und die Responses API für Modell-, Such- und
Codeausführungs-Tools. Funktionen, die andere OpenClaw-Verträge benötigen, wie
Echtzeit-Sprachsitzungen, sind hier als Upstream-Fähigkeiten dokumentiert und nicht
als verborgenes Plugin-Verhalten.
</Note>

### Fast-Mode-Zuordnungen

`/fast on` oder `agents.defaults.models["xai/<model>"].params.fastMode: true`
schreibt native xAI-Anfragen wie folgt um:

| Quellmodell   | Fast-Mode-Ziel    |
| ------------- | ----------------- |
| `grok-3`      | `grok-3-fast`     |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`     |
| `grok-4-0709` | `grok-4-fast`     |

### Legacy-Kompatibilitätsaliase

Legacy-Aliase normalisieren weiterhin zu den kanonischen gebündelten IDs:

| Legacy-Alias              | Kanonische ID                         |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funktionen

<AccordionGroup>
  <Accordion title="Websuche">
    Der gebündelte `grok`-Websuche-Provider bevorzugt xAI OAuth und fällt dann
    auf `XAI_API_KEY` oder einen Plugin-Websuche-Schlüssel zurück:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Videogenerierung">
    Das gebündelte `xai`-Plugin registriert Videogenerierung über das gemeinsame
    `video_generate` Tool.

    - Standard-Videomodell: `xai/grok-imagine-video`
    - Modi: Text-zu-Video, Bild-zu-Video, Referenzbildgenerierung, Remote-
      Video-Bearbeitung und Remote-Video-Erweiterung
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Auflösungen: `480P`, `720P`
    - Dauer: 1-15 Sekunden für Generierung/Bild-zu-Video, 1-10 Sekunden bei
      Verwendung von `reference_image`-Rollen, 2-10 Sekunden für Erweiterung
    - Referenzbildgenerierung: Setzen Sie `imageRoles` für jedes bereitgestellte Bild auf `reference_image`;
      xAI akzeptiert bis zu 7 solcher Bilder
    - Standard-Operationstimeout: 600 Sekunden, sofern `video_generate.timeoutMs`
      oder `agents.defaults.videoGenerationModel.timeoutMs` nicht gesetzt ist

    <Warning>
    Lokale Videopuffer werden nicht akzeptiert. Verwenden Sie Remote-`http(s)`-URLs für
    Video-Bearbeitungs-/Erweiterungseingaben. Bild-zu-Video akzeptiert lokale Bildpuffer, weil
    OpenClaw diese als Daten-URLs für xAI codieren kann.
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
    `image_generate` Tool.

    - Standard-Bildmodell: `xai/grok-imagine-image`
    - Zusätzliches Modell: `xai/grok-imagine-image-quality`
    - Modi: Text-zu-Bild und Referenzbildbearbeitung
    - Referenzeingaben: ein `image` oder bis zu fünf `images`
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Auflösungen: `1K`, `2K`
    - Anzahl: bis zu 4 Bilder
    - Standard-Operationstimeout: 600 Sekunden, sofern `image_generate.timeoutMs`
      oder `agents.defaults.imageGenerationModel.timeoutMs` nicht gesetzt ist

    OpenClaw fordert bei xAI `b64_json`-Bildantworten an, damit generierte Medien
    über den normalen Kanal-Anhangspfad gespeichert und zugestellt werden können. Lokale
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
    wie `1:2`, `2:1`, `9:20` und `20:9`. OpenClaw leitet heute nur die
    gemeinsamen, Provider-übergreifenden Bildsteuerungen weiter; nicht unterstützte, nur native Optionen
    werden absichtlich nicht über `image_generate` bereitgestellt.
    </Note>

  </Accordion>

  <Accordion title="Text-zu-Sprache">
    Das gebündelte `xai`-Plugin registriert Text-zu-Sprache über die gemeinsame `tts`-
    Provider-Oberfläche.

    - Stimmen: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Standardstimme: `eve`
    - Formate: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Sprache: BCP-47-Code oder `auto`
    - Geschwindigkeit: Provider-native Geschwindigkeitsüberschreibung
    - Natives Opus-Sprachnotizformat wird nicht unterstützt

    So verwenden Sie xAI als Standard-TTS-Provider:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw verwendet den Batch-Endpunkt `/v1/tts` von xAI. xAI bietet auch Streaming-TTS
    über WebSocket an, aber der OpenClaw-Sprach-Provider-Vertrag erwartet derzeit
    einen vollständigen Audiopuffer vor der Antwortzustellung.
    </Note>

  </Accordion>

  <Accordion title="Sprache-zu-Text">
    Das gebündelte `xai`-Plugin registriert Batch-Sprache-zu-Text über OpenClaws
    Transkriptionsoberfläche für Medienverständnis.

    - Standardmodell: `grok-stt`
    - Endpunkt: xAI REST `/v1/stt`
    - Eingabepfad: Multipart-Audiodatei-Upload
    - Von OpenClaw überall dort unterstützt, wo eingehende Audiotranskription
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

    Die Sprache kann über die gemeinsame Audiomedien-Konfiguration oder pro Aufruf
    über die Transkriptionsanfrage übergeben werden. Prompt-Hinweise werden von der gemeinsamen OpenClaw-
    Oberfläche akzeptiert, aber die xAI-REST-STT-Integration leitet nur Datei, Modell und
    Sprache weiter, weil diese sauber dem aktuellen öffentlichen xAI-Endpunkt zugeordnet werden können.

  </Accordion>

  <Accordion title="Streaming-Sprache-zu-Text">
    Das gebündelte `xai`-Plugin registriert außerdem einen Echtzeit-Transkriptions-Provider
    für Live-Sprachanruf-Audio.

    - Endpunkt: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Standardcodierung: `mulaw`
    - Standard-Abtastrate: `8000`
    - Standard-Endpunkterkennung: `800ms`
    - Zwischentranskripte: standardmäßig aktiviert

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
    Dieser Streaming-Provider ist für den Echtzeit-Transkriptionspfad von Voice Call.
    Discord-Sprachkanäle zeichnen derzeit kurze Segmente auf und verwenden stattdessen den Batch-
    Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="x_search-Konfiguration">
    Das gebündelte xAI-Plugin stellt `x_search` als OpenClaw-Tool zum Durchsuchen
    von X-Inhalten (ehemals Twitter) über Grok bereit.

    Konfigurationspfad: `plugins.entries.xai.config.xSearch`

    | Schlüssel          | Typ     | Standard           | Beschreibung                         |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | x_search aktivieren oder deaktivieren |
    | `model`            | string  | `grok-4-1-fast`    | Für x_search-Anfragen verwendetes Modell |
    | `baseUrl`          | string  | -                  | Überschreibung der xAI-Responses-Basis-URL |
    | `inlineCitations`  | boolean | -                  | Inline-Zitationen in Ergebnisse einschließen |
    | `maxTurns`         | number  | -                  | Maximale Konversationsrunden         |
    | `timeoutSeconds`   | number  | -                  | Anfrage-Timeout in Sekunden          |
    | `cacheTtlMinutes`  | number  | -                  | Cache-Lebensdauer in Minuten         |

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

  <Accordion title="Codeausführungs-Konfiguration">
    Das gebündelte xAI-Plugin stellt `code_execution` als OpenClaw-Tool für
    Remote-Codeausführung in der Sandbox-Umgebung von xAI bereit.

    Konfigurationspfad: `plugins.entries.xai.config.codeExecution`

    | Schlüssel         | Typ     | Standard           | Beschreibung                          |
    | ----------------- | ------- | ------------------ | ------------------------------------- |
    | `enabled`         | boolean | `true` (wenn Schlüssel verfügbar) | Codeausführung aktivieren oder deaktivieren |
    | `model`           | string  | `grok-4-1-fast`    | Für Codeausführungsanfragen verwendetes Modell |
    | `maxTurns`        | number  | -                  | Maximale Konversationsrunden          |
    | `timeoutSeconds`  | number  | -                  | Anfrage-Timeout in Sekunden           |

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

  <Accordion title="Bekannte Grenzen">
    - xAI-Authentifizierung kann einen API-Schlüssel, eine Umgebungsvariable, einen Plugin-Konfigurations-Fallback
      oder OAuth mit einem berechtigten xAI-Konto verwenden. OAuth verwendet Gerätecode-Verifizierung
      ohne localhost-Callback. xAI entscheidet, welche Konten OAuth-
      API-Tokens erhalten können, und die Zustimmungsseite kann Grok Build anzeigen, obwohl OpenClaw
      die Grok Build-App nicht benötigt.
    - OpenClaw stellt die xAI-Multi-Agent-Modellfamilie derzeit nicht bereit. xAI
      stellt diese Modelle über die Responses API bereit, aber sie akzeptieren nicht die
      clientseitigen oder benutzerdefinierten Tools, die von OpenClaws gemeinsamem Agent-Loop verwendet werden. Siehe die
      [xAI-Multi-Agent-Einschränkungen](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - xAI Realtime Voice ist noch nicht als OpenClaw-Provider registriert. Es
      benötigt einen anderen bidirektionalen Sprachesitzungsvertrag als Batch-STT oder
      Streaming-Transkription.
    - xAI-Bild-`quality`, Bild-`mask` und zusätzliche nur native Seitenverhältnisse werden
      erst bereitgestellt, wenn das gemeinsame Tool `image_generate` entsprechende
      Provider-übergreifende Steuerungen hat.
  </Accordion>

  <Accordion title="Erweiterte Hinweise">
    - OpenClaw wendet xAI-spezifische Kompatibilitätskorrekturen für Tool-Schema und Tool-Aufrufe
      automatisch auf dem gemeinsamen Runner-Pfad an.
    - Native xAI-Anfragen verwenden standardmäßig `tool_stream: true`. Setzen Sie
      `agents.defaults.models["xai/<model>"].params.tool_stream` auf `false`, um
      dies zu deaktivieren.
    - Der gebündelte xAI-Wrapper entfernt nicht unterstützte Strict-Tool-Schema-Flags und
      Reasoning-*effort*-Payload-Schlüssel, bevor native xAI-Anfragen gesendet werden. Nur
      `grok-4.3` / `grok-4.3-*` geben konfigurierbaren Reasoning-Aufwand an; alle
      anderen reasoning-fähigen xAI-Modelle fordern weiterhin
      `include: ["reasoning.encrypted_content"]` an, damit vorheriges verschlüsseltes Reasoning
      in Folgerunden erneut abgespielt werden kann.
    - `web_search`, `x_search` und `code_execution` werden als OpenClaw-
      Tools bereitgestellt. OpenClaw aktiviert das spezifische integrierte xAI-Tool, das es innerhalb jeder Tool-
      Anfrage benötigt, statt alle nativen Tools an jede Chat-Runde anzuhängen.
    - Grok `web_search` liest `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` liest `plugins.entries.xai.config.xSearch.baseUrl` und
      fällt dann auf die Grok-Web-Search-Basis-URL zurück.
    - `x_search` und `code_execution` gehören dem gebündelten xAI-Plugin,
      statt fest in die Core-Modellruntime codiert zu sein.
    - `code_execution` ist Remote-Ausführung in der xAI-Sandbox, nicht lokales
      [`exec`](/de/tools/exec).
  </Accordion>
</AccordionGroup>

## Live-Tests

Die xAI-Medienpfade werden durch Unit-Tests und Opt-in-Live-Suiten abgedeckt. Exportieren Sie
`XAI_API_KEY` in die Prozessumgebung, bevor Sie Live-Probes ausführen.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Die Provider-spezifische Live-Datei synthetisiert normales TTS, telefoniefreundliches PCM-
TTS, transkribiert Audio über xAI-Batch-STT, streamt dasselbe PCM durch xAI-
Echtzeit-STT, generiert Text-zu-Bild-Ausgabe und bearbeitet ein Referenzbild. Die
gemeinsame Bild-Live-Datei verifiziert denselben xAI-Provider über OpenClaws
Runtime-Auswahl, Fallback, Normalisierung und Medienanhangspfad.

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
    Häufige Probleme und Korrekturen.
  </Card>
</CardGroup>
