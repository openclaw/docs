---
read_when:
    - Sie möchten Grok-Modelle in OpenClaw verwenden
    - Sie konfigurieren die xAI-Authentifizierung oder Modell-IDs
summary: xAI-Grok-Modelle in OpenClaw verwenden
title: xAI
x-i18n:
    generated_at: "2026-07-12T02:06:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eba797fbb2f4f2a47c8e07daabe93ef4f6e5a8077d3c739b0f6b9c99283995e1
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw enthält ein gebündeltes `xai`-Provider-Plugin für Grok-Modelle. Der
empfohlene Weg ist Grok OAuth mit einem berechtigten SuperGrok- oder X-Premium-
Abonnement. Gateway, Konfiguration, Routing und Tools bleiben lokal; nur Grok-
Anfragen werden an die API von xAI gesendet.

OAuth erfordert weder einen xAI-API-Schlüssel noch die Grok-Build-App. xAI zeigt
auf dem Zustimmungsbildschirm möglicherweise dennoch Grok Build an, da OpenClaw
den gemeinsam genutzten OAuth-Client von xAI verwendet.

## Einrichtung

<Steps>
  <Step title="Neuinstallation">
    Führen Sie das Onboarding mit Installation des Daemons aus und wählen Sie
    anschließend im Schritt für Modell und Authentifizierung xAI/Grok OAuth aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Wählen Sie auf einem VPS oder über SSH direkt xAI OAuth aus; dabei wird eine
    Gerätecode-Verifizierung verwendet und kein localhost-Callback benötigt:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Bestehende Installation">
    Melden Sie sich nur bei xAI an; führen Sie nicht das vollständige Onboarding
    erneut aus, nur um Grok zu verbinden:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Legen Sie Grok separat als Standardmodell fest:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Führen Sie das vollständige Onboarding nur erneut aus, wenn Sie bewusst
    Einstellungen für Gateway, Daemon, Kanal, Arbeitsbereich oder andere
    Einrichtungsoptionen ändern möchten.

  </Step>
  <Step title="API-Schlüssel-Verfahren">
    Die Einrichtung per API-Schlüssel funktioniert weiterhin für Schlüssel aus
    der xAI Console und für Medienoberflächen, die eine schlüsselbasierte
    Provider-Konfiguration benötigen:

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
`--method api-key` ermöglichen außerdem `web_search` (Provider-ID `grok`),
`x_search`, `code_execution`, Sprachsynthese/Transkription sowie die Bild- und
Videogenerierung von xAI. Wenn Sie einen xAI-Schlüssel unter
`plugins.entries.xai.config.webSearch.apiKey` speichern, verwendet der
gebündelte xAI-Modell-Provider ihn ebenfalls als Rückfalloption.
</Note>

## OAuth-Fehlerbehebung

- Verwenden Sie für SSH, Docker, VPS oder andere entfernte Einrichtungen
  `openclaw models auth login --provider xai --method oauth`; dabei wird eine
  Gerätecode-Verifizierung und kein localhost-Callback verwendet.
- Wenn die Anmeldung erfolgreich ist, Grok aber nicht das Standardmodell ist,
  führen Sie `openclaw models set xai/grok-4.3` aus.
- Prüfen Sie die gespeicherten xAI-Authentifizierungsprofile:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI entscheidet, welche Konten OAuth-API-Token erhalten können. Wenn ein Konto
  nicht berechtigt ist, verwenden Sie das API-Schlüssel-Verfahren oder prüfen
  Sie das Abonnement bei xAI.

<Tip>
Verwenden Sie `xai-oauth`, wenn Sie sich über SSH, Docker oder einen VPS
anmelden. OpenClaw gibt eine URL und einen kurzen Code aus; schließen Sie die
Anmeldung in einem beliebigen lokalen Browser ab, während der entfernte Prozess
xAI nach dem abgeschlossenen Token-Austausch abfragt.
</Tip>

## Integrierter Katalog

Auswählbare IDs in der Modellauswahl. Das Plugin löst für bestehende
Konfigurationen weiterhin ältere IDs von Grok 3, Grok 4, Grok 4 Fast, Grok 4.1
Fast und Grok Code auf; siehe
[Legacy-Kompatibilität und veränderliche Aliasse](#legacy-compatibility-and-moving-aliases).

| Familie        | Modell-IDs                                                   |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (Aliasse: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (Aliasse: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Verwenden Sie `grok-4.5` für allgemeine Chats, Programmierung und agentenbasierte
Aufgaben, sofern es verfügbar ist. Grok 4.3 bleibt die regionssichere
Standardeinstellung; `grok-build-0.1` und beide datierten Grok-4.20-Varianten
bleiben auswählbar.
</Tip>

## Funktionsumfang

Das gebündelte Plugin bildet unterstützte xAI-APIs auf die gemeinsamen Provider-
und Tool-Verträge von OpenClaw ab. Funktionen, die nicht zum gemeinsamen Vertrag
passen, sind nachfolgend oder unter den bekannten Einschränkungen aufgeführt.

| xAI-Funktion                     | OpenClaw-Oberfläche                      | Status                                                               |
| -------------------------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| Chat / Responses                 | `xai/<model>`-Modell-Provider            | Ja                                                                   |
| Serverseitige Websuche           | `web_search`-Provider `grok`             | Ja                                                                   |
| Serverseitige X-Suche            | Tool `x_search`                          | Ja                                                                   |
| Serverseitige Codeausführung     | Tool `code_execution`                    | Ja                                                                   |
| Bilder                           | `image_generate`                         | Ja                                                                   |
| Videos                           | `video_generate`                         | Klassischer vollständiger Ablauf; Video 1.5 Bild-zu-Video            |
| Stapelweise Text-zu-Sprache      | `messages.tts.provider: "xai"` / `tts`   | Ja                                                                   |
| TTS-Streaming                    | -                                        | Vom xAI-Provider noch nicht implementiert                            |
| Stapelweise Sprache-zu-Text      | Medienverständnis `tools.media.audio`    | Ja                                                                   |
| Sprache-zu-Text-Streaming        | Voice Call `streaming.provider: "xai"`   | Ja                                                                   |
| Echtzeitsprachkommunikation      | -                                        | Noch nicht verfügbar; benötigt einen anderen Sitzungs-/WebSocket-Vertrag |
| Dateien / Stapelverarbeitung     | Nur generische Modell-API-Kompatibilität | Kein eigenständiges OpenClaw-Tool                                    |

<Note>
OpenClaw verwendet die REST-APIs von xAI für Bilder, Videos, TTS und STT zur
Mediengenerierung und stapelweisen Transkription, den STT-Streaming-WebSocket
von xAI für die Live-Transkription von Sprachanrufen sowie die Responses API
für Chat-, Such- und Codeausführungs-Tools.
</Note>

### Legacy-Kompatibilität des Schnellmodus

`/fast on` oder `agents.defaults.models["xai/<model>"].params.fastMode: true`
schreibt ältere xAI-Konfigurationen weiterhin wie folgt um. Diese Ziel-IDs
werden nur aus Kompatibilitätsgründen beibehalten; verwenden Sie für neue
Konfigurationen aktuell auswählbare Modelle.

| Quellmodell   | Ziel des Schnellmodus |
| ------------- | --------------------- |
| `grok-3`      | `grok-3-fast`         |
| `grok-3-mini` | `grok-3-mini-fast`    |
| `grok-4`      | `grok-4-fast`         |
| `grok-4-0709` | `grok-4-fast`         |

### Legacy-Kompatibilität und veränderliche Aliasse

Ältere Aliasse werden wie folgt normalisiert:

| Legacy-Alias                                                  | Normalisierte ID  |
| ------------------------------------------------------------- | ----------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1`  |

Die datierten 0309-IDs sind die auswählbaren Katalogeinträge. OpenClaw sendet
alle anderen aktuellen Grok-4.20-Aliasse unverändert, sodass xAI die Kontrolle
über die Semantik stabiler, neuester, Beta-, experimenteller und datierter
Aliasse behält. Der globale Alias `grok-latest` wird ebenfalls unverändert
beibehalten.

xAI hat die folgenden exakten IDs eingestellt. OpenClaw behält sie als
ausgeblendete Kompatibilitätszeilen für ausgelieferte Konfigurationen bei, mit
den Einschränkungen und Preisen ihrer aktuellen Weiterleitungsziele:

| Eingestellte IDs                                                     | Aktuelles Verhalten                  |
| -------------------------------------------------------------------- | ------------------------------------ |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 mit `low`-Schlussfolgerung   |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 mit deaktivierter Schlussfolgerung |
| `grok-code-fast-1`                                                   | Grok Build 0.1                       |
| `grok-imagine-image-pro`                                             | Grok Imagine Image Quality           |

`openclaw doctor --fix` aktualisiert gespeicherte Standardwerte für
serverseitige xAI-Tools und den eingestellten Slug für Qualitätsbilder, entfernt
veraltete generierte Katalogzeilen und korrigiert veraltete Kontextmetadaten in
aktiven 4.20-Zeilen. Aktive 4.20-Aliasse mit `beta-latest` werden dabei nicht an
eine datierte Momentaufnahme gebunden.

## Funktionen

<Warning>
  `x_search` und `code_execution` werden auf den Servern von xAI ausgeführt.
  xAI berechnet 5 US-Dollar pro 1.000 Tool-Aufrufe zuzüglich der Eingabe- und
  Ausgabetoken des Modells. Wenn die Einstellung `enabled` des jeweiligen Tools
  fehlt, stellt OpenClaw es nur für ein aktives xAI-Modell bereit. Ein bekannter
  Modell-Provider, der nicht zu xAI gehört, erfordert ausdrücklich
  `enabled: true` für jedes Tool; bei einem fehlenden oder nicht auflösbaren
  Provider bleibt das Tool sicherheitshalber deaktiviert. Eine xAI-
  Authentifizierung ist immer erforderlich, und `enabled: false` deaktiviert
  das Tool für jeden Provider.
</Warning>

<AccordionGroup>
  <Accordion title="Websuche">
    Der gebündelte Websuch-Provider `grok` bevorzugt xAI OAuth und greift
    anschließend auf `XAI_API_KEY` oder einen Websuchschlüssel des Plugins
    zurück:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Videogenerierung">
    Das gebündelte `xai`-Plugin registriert die Videogenerierung über das
    gemeinsame Tool `video_generate`.

    - Standardmodell: `xai/grok-imagine-video`
    - Zusätzliches Modell: `xai/grok-imagine-video-1.5`
    - Klassische Modi: Text-zu-Video, Bild-zu-Video, Generierung anhand von
      Referenzbildern, Bearbeitung entfernter Videos und Erweiterung entfernter
      Videos
    - Video-1.5-Modus: nur Bild-zu-Video mit genau einem Bild als erstem Frame
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      bei Auslassung übernehmen der klassische und der Video-1.5-Bild-zu-Video-
      Modus das Seitenverhältnis des Quellbilds
    - Auflösungen: klassisch `480P`/`720P`; Video 1.5 unterstützt außerdem
      `1080P`; alle Generierungsmodi verwenden standardmäßig `480P`
    - Dauer: 1–15 Sekunden für Generierung/Bild-zu-Video, 1–10 Sekunden bei
      Verwendung klassischer `reference_image`-Rollen, 2–10 Sekunden für die
      klassische Erweiterung
    - Generierung anhand von Referenzbildern: Setzen Sie `imageRoles` für jedes
      bereitgestellte Bild auf `reference_image`; xAI akzeptiert bis zu 7
      solcher Bilder
    - Videobearbeitung und -erweiterung übernehmen Seitenverhältnis und
      Auflösung des Eingabevideos; diese Vorgänge akzeptieren keine
      Geometrieüberschreibungen
    - Standard-Zeitüberschreitung für Vorgänge: 600 Sekunden, sofern
      `video_generate.timeoutMs` oder
      `agents.defaults.videoGenerationModel.timeoutMs` nicht festgelegt ist

    <Warning>
    Lokale Videopuffer werden nicht akzeptiert. Verwenden Sie entfernte
    `http(s)`-URLs als Eingaben für die Videobearbeitung oder -erweiterung.
    Bild-zu-Video akzeptiert lokale Bildpuffer, da OpenClaw diese für xAI als
    Daten-URLs codiert.
    </Warning>

    Video 1.5 erkennt außerdem die xAI-Bezeichner
    `grok-imagine-video-1.5-preview` und
    `grok-imagine-video-1.5-2026-05-30`. OpenClaw leitet den ausgewählten
    Bezeichner unverändert weiter, wendet jedoch dieselbe Validierung an, die
    ausschließlich Bilder zulässt.

    So verwenden Sie xAI als Standard-Provider für Videos:

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
    Unter [Videogenerierung](/de/tools/video-generation) finden Sie Informationen
    zu gemeinsamen Tool-Parametern, zur Provider-Auswahl und zum
    Failover-Verhalten.
    </Note>

  </Accordion>

  <Accordion title="Bildgenerierung">
    Das gebündelte `xai`-Plugin registriert die Bildgenerierung über das
    gemeinsame Tool `image_generate`.

    - Standard-Bildmodell: `xai/grok-imagine-image`
    - Zusätzliches Modell: `xai/grok-imagine-image-quality`
    - Modi: Text-zu-Bild und Bearbeitung eines Referenzbilds
    - Referenzeingaben: ein `image` oder bis zu drei `images`
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Auflösungen: `1K`, `2K`
    - Anzahl: bis zu 4 Bilder
    - Standardmäßiges Zeitlimit für Vorgänge: 600 Sekunden, sofern
      `image_generate.timeoutMs` oder
      `agents.defaults.imageGenerationModel.timeoutMs` nicht festgelegt ist

    OpenClaw fordert von xAI Bildantworten im Format `b64_json` an, damit
    generierte Medien über den normalen Pfad für Kanalanhänge gespeichert und
    zugestellt werden können. Lokale Referenzbilder werden in Daten-URLs
    konvertiert; entfernte `http(s)`-Referenzen werden unverändert
    weitergeleitet.

    So verwenden Sie xAI als Standard-Provider für Bilder:

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
    xAI dokumentiert außerdem `quality`, `mask`, `user` und ein
    `auto`-Seitenverhältnis. OpenClaw leitet derzeit nur die gemeinsamen,
    Provider-übergreifenden Bildsteuerungen weiter; diese ausschließlich
    nativen Optionen werden nicht über `image_generate` bereitgestellt.
    </Note>

  </Accordion>

  <Accordion title="Text-zu-Sprache">
    Das gebündelte `xai`-Plugin registriert Text-zu-Sprache über die gemeinsame
    `tts`-Provider-Schnittstelle.

    - Stimmen: authentifizierter Live-Katalog von xAI; auflisten mit
      `openclaw infer tts voices --provider xai`
    - Offline-Ausweichstimmen: `ara`, `eve`, `leo`, `rex`, `sal`
    - Standardstimme: `eve`
    - Benutzerdefinierte Stimmen-IDs des Kontos werden auch dann weitergeleitet,
      wenn sie in der Antwort des integrierten Katalogs fehlen
    - Formate: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Sprache: BCP-47-Code oder `auto`
    - Geschwindigkeit: Provider-native Überschreibung der Geschwindigkeit
    - Das native Opus-Format für Sprachnachrichten wird nicht unterstützt

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
    OpenClaw verwendet den Batch-Endpunkt `/v1/tts` und den authentifizierten
    Katalog `/v1/tts/voices` von xAI. xAI bietet außerdem Streaming-TTS über
    WebSocket an, der gebündelte xAI-Provider implementiert diesen
    Streaming-Hook jedoch noch nicht.
    </Note>

  </Accordion>

  <Accordion title="Sprache-zu-Text">
    Das gebündelte `xai`-Plugin registriert Batch-Sprache-zu-Text über die
    Transkriptionsschnittstelle der Medienerkennung von OpenClaw.

    - Endpunkt: xAI-REST `/v1/stt`
    - Eingabepfad: Hochladen einer Audiodatei als Multipart
    - Modellauswahl: xAI wählt das Transkriptionsmodell intern aus; der
      Endpunkt verfügt über keine Modellauswahl
    - Wird überall dort verwendet, wo die Transkription eingehender Audiodaten
      `tools.media.audio` liest, einschließlich Segmenten aus
      Discord-Sprachkanälen und Audioanhängen in Kanälen

    So erzwingen Sie xAI für die Transkription eingehender Audiodaten:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    Die Sprache kann über die gemeinsame Audiomedienkonfiguration oder pro
    Transkriptionsanfrage angegeben werden. Die gemeinsame
    OpenClaw-Schnittstelle akzeptiert Prompt-Hinweise, die
    xAI-REST-STT-Integration leitet jedoch nur Datei und Sprache weiter, da
    diese dem aktuellen öffentlichen xAI-Endpunkt entsprechen.

  </Accordion>

  <Accordion title="Streaming-Sprache-zu-Text">
    Das gebündelte `xai`-Plugin registriert außerdem einen
    Echtzeit-Transkriptions-Provider für Audiodaten aus laufenden
    Sprachanrufen.

    - Endpunkt: xAI-WebSocket `wss://api.x.ai/v1/stt`
    - Standardkodierung: `mulaw`
    - Standard-Abtastrate: `8000`
    - Standardmäßige Endpunkterkennung: `800ms`
    - Vorläufige Transkripte: standardmäßig aktiviert

    Der Twilio-Medienstream von Voice Call sendet G.711-mu-law-Audioframes,
    daher leitet der xAI-Provider diese Frames ohne Transkodierung direkt
    weiter:

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

    Die Provider-eigene Konfiguration befindet sich unter
    `plugins.entries.voice-call.config.streaming.providers.xai`. Unterstützte
    Schlüssel sind `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`,
    `mulaw` oder `alaw`), `interimResults`, `endpointingMs` und `language`.

    <Note>
    Dieser Streaming-Provider ist für den Echtzeit-Transkriptionspfad von
    Voice Call vorgesehen. Discord zeichnet kurze Segmente auf und verwendet
    stattdessen den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="x_search-Konfiguration">
    Das gebündelte xAI-Plugin stellt `x_search` als OpenClaw-Werkzeug zur Suche
    nach Inhalten auf X (ehemals Twitter) über Grok bereit.

    Konfigurationspfad: `plugins.entries.xai.config.xSearch`

    | Schlüssel         | Typ     | Standard                  | Beschreibung                                             |
    | ----------------- | ------- | ------------------------- | -------------------------------------------------------- |
    | `enabled`         | boolean | Automatisch für xAI-Modelle | Deaktivieren oder für einen bekannten Nicht-xAI-Provider aktivieren |
    | `model`           | string  | `grok-4.3`                | Für x_search-Anfragen verwendetes Modell                 |
    | `baseUrl`         | string  | -                          | Überschreibung der Basis-URL für xAI Responses           |
    | `inlineCitations` | boolean | -                          | Inline-Quellenangaben in Ergebnisse aufnehmen            |
    | `maxTurns`        | number  | -                          | Maximale Anzahl an Konversationsrunden                   |
    | `timeoutSeconds`  | number  | `30`                       | Zeitlimit für Anfragen in Sekunden                       |
    | `cacheTtlMinutes` | number  | `15`                       | Cache-Gültigkeitsdauer in Minuten                        |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
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
    Das gebündelte xAI-Plugin stellt `code_execution` als OpenClaw-Werkzeug für
    die entfernte Codeausführung in der Sandbox-Umgebung von xAI bereit.

    Konfigurationspfad: `plugins.entries.xai.config.codeExecution`

    | Schlüssel        | Typ     | Standard                  | Beschreibung                                             |
    | ---------------- | ------- | ------------------------- | -------------------------------------------------------- |
    | `enabled`        | boolean | Automatisch für xAI-Modelle | Deaktivieren oder für einen bekannten Nicht-xAI-Provider aktivieren |
    | `model`          | string  | `grok-4.3`                | Für Codeausführungsanfragen verwendetes Modell           |
    | `maxTurns`       | number  | -                          | Maximale Anzahl an Konversationsrunden                   |
    | `timeoutSeconds` | number  | `30`                       | Zeitlimit für Anfragen in Sekunden                       |

    <Note>
    Dies ist eine entfernte Ausführung in der xAI-Sandbox, nicht das lokale
    [`exec`](/de/tools/exec).
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bekannte Einschränkungen">
    - Die xAI-Authentifizierung kann einen API-Schlüssel, eine Umgebungsvariable,
      eine Ausweichkonfiguration des Plugins oder OAuth mit einem berechtigten
      xAI-Konto verwenden. OAuth verwendet die Gerätecode-Verifizierung ohne
      localhost-Callback. xAI entscheidet, welche Konten OAuth-API-Token
      erhalten können, und auf der Einwilligungsseite kann Grok Build angezeigt
      werden, obwohl OpenClaw die Grok-Build-App nicht benötigt.
    - OpenClaw stellt die Multi-Agent-Modellfamilie von xAI derzeit nicht
      bereit. xAI stellt diese Modelle über die Responses API bereit, sie
      akzeptieren jedoch nicht die clientseitigen oder benutzerdefinierten
      Werkzeuge, die von der gemeinsamen Agentenschleife von OpenClaw verwendet
      werden. Weitere Informationen finden Sie unter
      [Einschränkungen der xAI-Multi-Agenten](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - xAI Realtime Voice ist noch nicht als OpenClaw-Provider registriert. Dafür
      ist ein anderer Vertrag für bidirektionale Sprachsitzungen erforderlich
      als für Batch-STT oder Streaming-Transkription.
    - `quality` und `mask` für xAI-Bilder sowie das native
      `auto`-Seitenverhältnis werden erst bereitgestellt, wenn das gemeinsame
      Werkzeug `image_generate` entsprechende Provider-übergreifende
      Steuerungen besitzt.
  </Accordion>

  <Accordion title="Erweiterte Hinweise">
    - OpenClaw wendet xAI-spezifische Kompatibilitätskorrekturen für
      Werkzeugschemata und Werkzeugaufrufe automatisch im gemeinsamen
      Runner-Pfad an.
    - Native xAI-Anfragen verwenden standardmäßig `tool_stream: true`. Setzen
      Sie `agents.defaults.models["xai/<model>"].params.tool_stream` auf
      `false`, um dies zu deaktivieren.
    - Der gebündelte xAI-Wrapper entfernt nicht unterstützte
      Anzahlbegrenzungen für `contains` aus Schemas und nicht unterstützte
      Nutzlastschlüssel für den *Aufwand* des Schlussfolgerns, bevor native
      xAI-Anfragen gesendet werden. Grok 4.5 unterstützt niedrigen, mittleren
      und hohen Aufwand (Standard: hoch). Grok 4.3 unterstützt keinen,
      niedrigen, mittleren und hohen Aufwand (Standard: niedrig). Andere
      schlussfolgerungsfähige xAI-Modelle stellen keine konfigurierbare
      Aufwandssteuerung bereit, fordern aber weiterhin
      `include: ["reasoning.encrypted_content"]` an, damit zuvor verschlüsselte
      Schlussfolgerungen in nachfolgenden Runden erneut verwendet werden
      können.
    - `web_search`, `x_search` und `code_execution` werden als
      OpenClaw-Werkzeuge bereitgestellt. OpenClaw fügt der Anfrage jedes
      Werkzeugs nur die jeweils benötigte integrierte xAI-Funktion hinzu,
      anstatt jedem Chat-Durchlauf alle nativen Werkzeuge hinzuzufügen.
    - Grok `web_search` liest
      `plugins.entries.xai.config.webSearch.baseUrl`. `x_search` liest
      `plugins.entries.xai.config.xSearch.baseUrl` und greift anschließend auf
      die Basis-URL der Grok-Websuche zurück.
    - `x_search` und `code_execution` gehören zum gebündelten xAI-Plugin,
      anstatt fest in der Kernlaufzeit des Modells codiert zu sein.
    - `code_execution` ist eine entfernte Ausführung in der xAI-Sandbox, nicht
      das lokale [`exec`](/de/tools/exec).
  </Accordion>
</AccordionGroup>

## Live-Tests

Die xAI-Medienpfade werden durch Unit-Tests und optional aktivierbare
Live-Testreihen abgedeckt. Exportieren Sie `XAI_API_KEY` in die
Prozessumgebung, bevor Sie Live-Prüfungen ausführen.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Die providerspezifische Live-Datei synthetisiert normales TTS sowie für Telefonie geeignetes PCM-TTS, transkribiert Audio über xAI-Batch-STT, streamt dasselbe PCM über xAI-Echtzeit-STT, erzeugt Text-zu-Bild-Ausgaben und bearbeitet ein Referenzbild.
Die gemeinsam genutzte Live-Datei für Bilder überprüft denselben xAI-Provider über die Laufzeitauswahl, den Fallback, die Normalisierung und den Medienanhangspfad von OpenClaw. Der optionale Video-1.5-Fall übermittelt ein generiertes Bild als ersten Frame in 1080P und überprüft den Download des fertiggestellten Videos.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Videotools und Provider-Auswahl.
  </Card>
  <Card title="Alle Provider" href="/de/providers/index" icon="grid-2">
    Die umfassendere Provider-Übersicht.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Lösungen.
  </Card>
</CardGroup>
