---
read_when:
    - Sie möchten Grok-Modelle in OpenClaw verwenden
    - Sie konfigurieren die xAI-Authentifizierung oder Modell-IDs
summary: xAI-Grok-Modelle in OpenClaw verwenden
title: xAI
x-i18n:
    generated_at: "2026-07-24T04:39:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71ae7b049649b08b6508b8331714fec3464628814629256ad23b584f0f8ca8b7
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw enthält ein gebündeltes `xai`-Provider-Plugin für Grok-Modelle. Der
empfohlene Weg ist Grok OAuth mit einem berechtigten SuperGrok- oder X-Premium-
Abonnement. Gateway, Konfiguration, Routing und Tools bleiben lokal; nur Grok-
Anfragen werden an die API von xAI gesendet.

OAuth erfordert weder einen xAI-API-Schlüssel noch die Grok-Build-App. xAI kann auf
dem Zustimmungsbildschirm dennoch Grok Build anzeigen, da OpenClaw den gemeinsamen
OAuth-Client von xAI verwendet.

## Einrichtung

<Steps>
  <Step title="Neuinstallation">
    Führen Sie das Onboarding mit Daemon-Installation aus und wählen Sie dann im
    Modell-/Authentifizierungsschritt xAI/Grok OAuth aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Wählen Sie auf einem VPS oder über SSH direkt xAI OAuth aus; dabei wird die
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

    Führen Sie das vollständige Onboarding nur erneut aus, wenn Sie Gateway,
    Daemon, Kanal, Arbeitsbereich oder andere Einrichtungsoptionen bewusst ändern möchten.

  </Step>
  <Step title="API-Schlüssel-Verfahren">
    Die Einrichtung per API-Schlüssel funktioniert weiterhin für Schlüssel aus
    der xAI Console sowie für Medienoberflächen, die eine schlüsselbasierte
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
`--method api-key` unterstützen außerdem `web_search` (Provider-ID `grok`), `x_search`,
`code_execution`, Sprachausgabe/Transkription sowie die xAI-Bild-/Videogenerierung. Wenn Sie
einen xAI-Schlüssel unter `plugins.entries.xai.config.webSearch.apiKey` speichern, verwendet der
gebündelte xAI-Modell-Provider ihn ebenfalls als Fallback.
</Note>

## OAuth-Fehlerbehebung

- Verwenden Sie für SSH, Docker, VPS oder andere Remote-Einrichtungen
  `openclaw models auth login --provider xai --method oauth`; dies verwendet
  die Gerätecode-Verifizierung und keinen localhost-Callback.
- Wenn die Anmeldung erfolgreich ist, Grok jedoch nicht das Standardmodell ist, führen Sie
  `openclaw models set xai/grok-4.3` aus.
- Prüfen Sie die gespeicherten xAI-Authentifizierungsprofile:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI entscheidet, welche Konten OAuth-API-Token erhalten können. Wenn ein Konto
  nicht berechtigt ist, verwenden Sie das API-Schlüssel-Verfahren oder prüfen Sie das Abonnement bei xAI.

<Tip>
Verwenden Sie `xai-oauth`, wenn Sie sich über SSH, Docker oder einen VPS anmelden. OpenClaw gibt eine
URL und einen kurzen Code aus; schließen Sie die Anmeldung in einem beliebigen lokalen Browser ab, während der Remote-
Prozess xAI nach dem abgeschlossenen Token-Austausch abfragt.
</Tip>

## Integrierter Katalog

Auswählbare IDs in Modellauswahllisten. Das Plugin löst weiterhin ältere IDs für Grok 3,
Grok 4, Grok 4 Fast, Grok 4.1 Fast und Grok Code für bestehende Konfigurationen auf;
siehe [Legacy-Kompatibilität und veränderliche Aliasse](#legacy-compatibility-and-moving-aliases).

| Familie        | Modell-IDs                                                   |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (Aliasse: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (Aliasse: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Verwenden Sie `grok-4.5` für allgemeine Chats, Programmierung und agentische Aufgaben, sofern verfügbar.
Grok 4.3 bleibt die regionssichere Standardeinstellung; `grok-build-0.1` und beide
datierten Grok-4.20-Varianten bleiben auswählbar.
</Tip>

Die Kontext- und Tokenkosten-Metadaten des Katalogs orientieren sich an den aktuellen
[Modellseiten](https://docs.x.ai/developers/models) und der
[Preisseite](https://docs.x.ai/developers/pricing) von xAI. xAI berechnet höhere Preise,
wenn eine Anfrage den dokumentierten Schwellenwert für lange Kontexte überschreitet; die pauschalen
Kostenfelder im OpenClaw-Katalog erfassen die Preise für kurze Kontexte. Grok Build, die separate
CLI für Coding-Agenten von xAI, ist unter [x.ai/cli](https://x.ai/cli) verfügbar und verwendet derzeit
Grok 4.5.

## Funktionsumfang

Das gebündelte Plugin bildet unterstützte xAI-APIs auf die gemeinsamen Provider- und
Tool-Verträge von OpenClaw ab. Funktionen, die nicht in den gemeinsamen Vertrag passen, sind
nachfolgend oder unter den bekannten Einschränkungen aufgeführt.

| xAI-Funktion                 | OpenClaw-Oberfläche                     | Status                                               |
| ---------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Chat / Responses             | `xai/<model>`-Modell-Provider           | Ja                                                   |
| Serverseitige Websuche       | `web_search`-Provider `grok`           | Ja                                                   |
| Serverseitige X-Suche        | `x_search`-Tool                        | Ja                                                   |
| Serverseitige Codeausführung | `code_execution`-Tool                  | Ja                                                   |
| Bilder                       | `image_generate`                        | Ja                                                   |
| Videos                       | `video_generate`                        | Ja                                                   |
| Batch-Text-zu-Sprache        | `tts.provider: "xai"` / `tts`           | Ja                                                   |
| Streaming-TTS                | `textToSpeechStream`                    | Ja, über `wss://api.x.ai/v1/tts` (keine Echtzeit-Sprache) |
| Batch-Sprache-zu-Text        | `tools.media.audio`-Medienverständnis | Ja                                                   |
| Streaming-Sprache-zu-Text    | Voice Call `streaming.provider: "xai"`  | Ja                                                   |
| Echtzeit-Sprache             | Talk `talk.realtime.provider: "xai"`    | Ja; Gateway-Relay für native Talk-Nodes              |
| Dateien / Batches            | Nur generische Modell-API-Kompatibilität | Kein erstklassiges OpenClaw-Tool                     |

<Note>
OpenClaw verwendet die REST-APIs von xAI für Bilder/Videos/TTS/STT zur Mediengenerierung und
Batch-Transkription, den Streaming-STT-WebSocket von xAI für die Live-Transkription von
Sprachanrufen, den Grok-Voice-Agent-WebSocket von xAI für Talk-Echtzeitsitzungen
und die Responses API für Chat-, Such- und Codeausführungs-Tools.
</Note>

### Legacy-Kompatibilität des Schnellmodus

`/fast on` oder `agents.defaults.models["xai/<model>"].params.fastMode: true`
schreibt ältere xAI-Konfigurationen weiterhin wie folgt um. Diese Ziel-IDs werden
nur zur Kompatibilität beibehalten; verwenden Sie für neue
Konfigurationen aktuell auswählbare Modelle.

| Quellmodell   | Ziel im Schnellmodus |
| ------------- | -------------------- |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Legacy-Kompatibilität und veränderliche Aliasse

Ältere Aliasse werden wie folgt normalisiert:

| Legacy-Alias                                                  | Normalisierte ID |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

Die datierten 0309-IDs sind die auswählbaren Katalogeinträge. OpenClaw sendet alle anderen
aktuellen Grok-4.20-Aliasse unverändert, damit xAI die Kontrolle über die Semantik stabiler,
neuester, Beta-, experimenteller und datierter Aliasse behält. Der globale Alias `grok-latest` wird
ebenfalls unverändert beibehalten.

xAI hat die folgenden exakten IDs eingestellt. OpenClaw behält sie als ausgeblendete
Kompatibilitätszeilen für ausgelieferte Konfigurationen bei, mit den Einschränkungen und Preisen
ihrer aktuellen Weiterleitungsziele:

| Eingestellte IDs                                                      | Aktuelles Verhalten                    |
| --------------------------------------------------------------------- | -------------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 mit `low`-Reasoning     |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 mit deaktiviertem Reasoning   |
| `grok-code-fast-1`                                                   | Grok Build 0.1                         |
| `grok-imagine-image-pro`                                             | Grok Imagine Image Quality             |

`openclaw doctor --fix` aktualisiert gespeicherte xAI-Standardeinstellungen für Server-Tools und den
eingestellten Qualitäts-Slug für Bilder, entfernt veraltete generierte Katalogzeilen und repariert
veraltete Kontextmetadaten in aktiven 4.20-Zeilen. Aktive 4.20-
Aliasse vom Typ `beta-latest` werden dabei nicht auf einen datierten Snapshot festgelegt.

## Funktionen

<Warning>
  `x_search` und `code_execution` werden auf den Servern von xAI ausgeführt. xAI berechnet $5 pro 1.000
  Tool-Aufrufe zuzüglich der Ein- und Ausgabe-Token des Modells. Wenn die Einstellung
  `enabled` des jeweiligen Tools nicht angegeben ist, stellt OpenClaw es nur für ein aktives xAI-Modell bereit.
  Ein bekannter Nicht-xAI-Modell-Provider erfordert einen expliziten `enabled: true`-Wert pro Tool;
  ein fehlender oder nicht auflösbarer Provider führt zu einem geschlossenen Fehlerzustand. Eine xAI-Authentifizierung ist immer erforderlich,
  und `enabled: false` deaktiviert das Tool für jeden Provider.
</Warning>

<AccordionGroup>
  <Accordion title="Websuche">
    Der gebündelte Websuch-Provider `grok` bevorzugt xAI OAuth und greift dann
    auf `XAI_API_KEY` oder einen Websuchschlüssel eines Plugins zurück:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Videogenerierung">
    Das gebündelte Plugin `xai` registriert die Videogenerierung über das gemeinsame
    Tool `video_generate`.

    - Standardmodell: `xai/grok-imagine-video`
    - Zusätzliches Modell: `xai/grok-imagine-video-1.5`
    - Klassische Modi: Text-zu-Video, Bild-zu-Video, Referenzbildgenerierung,
      Remote-Videobearbeitung und Remote-Videoverlängerung
    - Video-1.5-Modus: nur Bild-zu-Video, mit genau einem Bild für den ersten Frame
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      beim klassischen und Video-1.5-Bild-zu-Video-Modus wird bei fehlender Angabe das Seitenverhältnis des Quellbilds
      übernommen
    - Auflösungen: klassisch `480P`/`720P`; Video 1.5 unterstützt außerdem `1080P`; für alle
      Generierungsmodi ist `480P` der Standardwert
    - Dauer: 1–15 Sekunden für Generierung/Bild-zu-Video, 1–10 Sekunden bei
      Verwendung klassischer `reference_image`-Rollen, 2–10 Sekunden für die klassische Verlängerung
    - Referenzbildgenerierung: Setzen Sie `imageRoles` für
      jedes bereitgestellte Bild auf `reference_image`; xAI akzeptiert bis zu 7 solcher Bilder
    - Videobearbeitung/-verlängerung übernimmt Seitenverhältnis und Auflösung des Eingabevideos;
      diese Vorgänge akzeptieren keine Geometrieüberschreibungen
    - Standard-Zeitüberschreitung für Vorgänge: 600 Sekunden, sofern nicht `video_generate.timeoutMs`
      oder `agents.defaults.mediaModels.video.timeoutMs` festgelegt ist

    <Warning>
    Lokale Videopuffer werden nicht akzeptiert. Verwenden Sie Remote-URLs des Typs `http(s)` für Eingaben zur
    Videobearbeitung/-verlängerung. Bild-zu-Video akzeptiert lokale Bildpuffer, da
    OpenClaw diese für xAI als Daten-URLs codiert.
    </Warning>

    Video 1.5 erkennt außerdem die xAI-Bezeichner `grok-imagine-video-1.5-preview` und
    `grok-imagine-video-1.5-2026-05-30`. OpenClaw leitet den
    ausgewählten Bezeichner unverändert weiter, wendet jedoch dieselbe Validierung ausschließlich für Bilder an.

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
    Informationen zu gemeinsamen Tool-Parametern, zur Provider-Auswahl und zum
    Failover-Verhalten finden Sie unter [Videogenerierung](/de/tools/video-generation).
    </Note>

  </Accordion>

  <Accordion title="Bildgenerierung">
    Das mitgelieferte Plugin `xai` registriert die Bildgenerierung über das gemeinsame
    Tool `image_generate`.

    - Standardbildmodell: `xai/grok-imagine-image`
    - Zusätzliches Modell: `xai/grok-imagine-image-quality`
    - Modi: Text-zu-Bild und Bearbeitung eines Referenzbilds
    - Referenzeingaben: eine `image` oder bis zu drei `images`
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Auflösungen: `1K`, `2K`
    - Anzahl: bis zu 4 Bilder
    - Standardmäßiges Zeitlimit für Vorgänge: 600 Sekunden, sofern nicht `image_generate.timeoutMs`
      oder `agents.defaults.mediaModels.image.timeoutMs` festgelegt ist

    OpenClaw fordert von xAI Bildantworten vom Typ `b64_json` an, damit generierte Medien
    gespeichert und über den normalen Pfad für Kanalanhänge zugestellt werden können. Lokale
    Referenzbilder werden in Daten-URLs umgewandelt; entfernte `http(s)`-Referenzen
    werden unverändert weitergeleitet.

    So verwenden Sie xAI als standardmäßigen Bild-Provider:

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
    xAI dokumentiert außerdem `quality`, `mask`, `user` und ein Seitenverhältnis von `auto`.
    OpenClaw leitet derzeit nur die gemeinsamen, Provider-übergreifenden Bildsteuerungen weiter;
    diese ausschließlich nativen Optionen werden nicht über `image_generate` bereitgestellt.
    </Note>

  </Accordion>

  <Accordion title="Text-zu-Sprache">
    Das mitgelieferte Plugin `xai` registriert Text-zu-Sprache über die gemeinsame
    Provider-Schnittstelle `tts`.

    - Stimmen: authentifizierter Live-Katalog von xAI; mit
      `openclaw infer tts voices --provider xai` auflisten
    - Offline-Ausweichstimmen: `ara`, `eve`, `leo`, `rex`, `sal`
    - Standardstimme: `eve`
    - Benutzerdefinierte Stimmen-IDs des Kontos werden auch dann weitergeleitet, wenn sie in der
      Antwort des integrierten Katalogs fehlen
    - Formate: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Sprache: BCP-47-Code oder `auto`
    - Geschwindigkeit: Provider-native Überschreibung der Geschwindigkeit
    - Das native Opus-Sprachnachrichtenformat wird nicht unterstützt

    So verwenden Sie xAI als standardmäßigen TTS-Provider:

    ```json5
    {
      tts: {
        provider: "xai",
        providers: {
          xai: {
            voiceId: "eve",
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw verwendet den Batch-Endpunkt `/v1/tts` von xAI für die gepufferte Synthese,
    die authentifizierte Katalogerkennung über `/v1/tts/voices` und das native
    `wss://api.x.ai/v1/tts` für die Streaming-Synthese. Streaming ist auf den
    nativen Host `api.x.ai` beschränkt, daher werden benutzerdefinierte `baseUrl`-Werte auf diesem
    Pfad abgelehnt. Dabei werden die vorhandenen Steuerungen für Sprache, Stimme, Codec und Geschwindigkeit verwendet; für
    Abtastrate und Bitrate gelten die xAI-Standardwerte. Die Audiodateisynthese berücksichtigt alle
    konfigurierten Codecs. Für Sprachnachrichtenziele wird beim Streaming und beim gepufferten
    Fallback MP3 verwendet, da die Roh-Codecs von xAI keine Codec-/Ratenmetadaten enthalten. Der
    Stream sendet `text.delta` und anschließend
    `text.done`, empfängt `audio.delta`, `audio.done` oder `error` und wendet ein
    Inaktivitäts-`timeoutMs` an, das bei jedem Audio-Chunk aktualisiert wird. Dies ist von
    Echtzeit-Sprachsitzungen getrennt. Weitere Informationen finden Sie im Vertrag der [Streaming-TTS-API](https://docs.x.ai/developers/rest-api-reference/inference/voice) von xAI.
    </Note>

  </Accordion>

  <Accordion title="Sprache-zu-Text">
    Das mitgelieferte Plugin `xai` registriert die Batch-Sprache-zu-Text-Verarbeitung über die
    Transkriptionsschnittstelle der Medienanalyse von OpenClaw.

    - Endpunkt: xAI REST `/v1/stt`
    - Eingabepfad: Multipart-Upload einer Audiodatei
    - Modellauswahl: xAI wählt das Transkriptionsmodell intern aus; der
      Endpunkt besitzt keine Modellauswahl
    - Wird überall dort verwendet, wo die Transkription eingehender Audiodaten `tools.media.audio` liest,
      einschließlich Discord-Sprachkanalsegmenten und Kanal-Audioanhängen

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
    Transkriptionsanfrage angegeben werden. Prompt-Hinweise werden von der gemeinsamen OpenClaw-
    Schnittstelle akzeptiert, die xAI-REST-STT-Integration leitet jedoch nur Datei und Sprache weiter,
    da nur diese dem aktuellen öffentlichen xAI-Endpunkt zugeordnet werden können.

  </Accordion>

  <Accordion title="Streaming-Sprache-zu-Text">
    Das mitgelieferte Plugin `xai` registriert außerdem einen Provider für Echtzeittranskription
    von Live-Sprachanruf-Audio.

    - Endpunkt: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Standardkodierung: `mulaw`
    - Standardabtastrate: `8000`
    - Standard-Endpunkterkennung: `800ms`
    - Zwischentranskripte: standardmäßig aktiviert

    Der Twilio-Medienstream von Voice Call sendet G.711-mu-law-Audioframes, daher leitet der
    xAI-Provider diese Frames ohne Transkodierung direkt weiter:

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
    Schlüssel sind `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` oder
    `alaw`), `interimResults`, `endpointingMs` und `language`.

    <Note>
    Dieser Streaming-Provider ist für den Echtzeittranskriptionspfad von Voice Call vorgesehen.
    Discord zeichnet kurze Segmente auf und verwendet stattdessen den Batch-
    Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Echtzeit-Sprache (Talk)">
    Das mitgelieferte Plugin `xai` registriert Echtzeitsitzungen des Grok Voice Agent für den
    Talk-Modus über den gemeinsamen Vertrag `registerRealtimeVoiceProvider`.

    - Endpunkt: `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - Standardmodell: `grok-voice-latest`
    - Standardstimme: `eve`
    - Transport: `gateway-relay` (Relay-Pfade für iOS, Android und die Control UI)
    - Audio: PCM16 24 kHz oder G.711 µ-law 8 kHz
    - Dazwischenreden: Die xAI-Server-VAD unterbricht die Antwort; OpenClaw löscht die Wiedergabewarteschlange
      und kürzt den noch nicht wiedergegebenen Provider-Verlauf

    Konfigurieren Sie Talk auf dem Gateway:

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // Nur aktivieren, wenn die sitzungsseitige Wiedergabe durch den Provider akzeptabel ist.
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    Die Provider-eigene Konfiguration wird außerdem aus
    `plugins.entries.voice-call.config.realtime.providers.xai` aufgelöst, wenn Voice Call
    oder gemeinsame Echtzeitselektoren dieselbe Provider-Zuordnung wiederverwenden. Unterstützte Schlüssel sind
    `apiKey`, `baseUrl`, `model`, `voice`, `vadThreshold`, `silenceDurationMs`,
    `prefixPaddingMs`, `reasoningEffort` und `sessionResumption`.
    `reasoningEffort` akzeptiert ausschließlich `high` oder `none`, entsprechend der xAI Voice Agent API.

    Die Server-VAD von xAI erstellt immer Antworten und verarbeitet Audiounterbrechungen.
    Verwenden Sie `consultRouting: "provider-direct"`; erzwungenes Transkript-Routing und das Deaktivieren
    der Eingabeaudiounterbrechung werden vom xAI-Voice-Agent-Protokoll nicht unterstützt.

    <Note>
    Echtzeit-Sprache kann über xAI OAuth oder `XAI_API_KEY` authentifiziert werden. Browser-eigenes
    WebRTC ist noch nicht Teil dieser Provider-Schnittstelle; verwenden Sie gateway-relay Talk auf
    nativen Nodes oder den Relay-Pfad der Control UI.
    </Note>

    <Note>
    `sessionResumption` ist standardmäßig auf `false` gesetzt. Bei `true` fordert OpenClaw
    xAI auf, ausreichend Sitzungsstatus aufzubewahren, um dieselbe Unterhaltung nach einer
    erneuten Verbindung fortzusetzen, und stellt die Verbindung anschließend mit der zurückgegebenen Unterhaltungs-ID wieder her. Lassen Sie die Option
    deaktiviert, wenn die Provider-seitige Wiedergabe/Aufbewahrung nicht akzeptabel ist; unterbrochene
    Sockets schlagen dann geschlossen fehl, statt unbemerkt eine neue Unterhaltung zu beginnen.
    </Note>

  </Accordion>

  <Accordion title="x_search-Konfiguration">
    Das mitgelieferte xAI-Plugin stellt `x_search` als OpenClaw-Tool zum
    Durchsuchen von Inhalten auf X (ehemals Twitter) über Grok bereit.

    Konfigurationspfad: `plugins.entries.xai.config.xSearch`

    | Schlüssel         | Typ     | Standardwert              | Beschreibung                                     |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | boolean | Automatisch für xAI-Modelle | Deaktivieren oder für einen bekannten Nicht-xAI-Provider aktivieren |
    | `model`           | string  | `grok-4.3`                | Für x_search-Anfragen verwendetes Modell         |
    | `baseUrl`         | string  | -                         | Überschreibung der xAI-Responses-Basis-URL       |
    | `inlineCitations` | boolean | -                         | Inline-Zitate in Ergebnisse aufnehmen            |
    | `maxTurns`        | number  | -                         | Maximale Anzahl an Unterhaltungsschritten        |
    | `timeoutSeconds`  | number  | `30`                      | Anfragezeitlimit in Sekunden                     |
    | `cacheTtlMinutes` | number  | `15`                      | Cache-Gültigkeitsdauer in Minuten                |

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
    Das mitgelieferte xAI-Plugin stellt `code_execution` als OpenClaw-Tool für die
    entfernte Codeausführung in der Sandbox-Umgebung von xAI bereit.

    Konfigurationspfad: `plugins.entries.xai.config.codeExecution`

    | Schlüssel         | Typ     | Standard                 | Beschreibung                                      |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------- |
    | `enabled`        | boolean | Automatisch für xAI-Modelle | Deaktivieren oder für einen bekannten Nicht-xAI-Provider aktivieren |
    | `model`          | string  | `grok-4.3`               | Für Codeausführungsanfragen verwendetes Modell    |
    | `maxTurns`       | number  | -                        | Maximale Anzahl an Konversationsrunden            |
    | `timeoutSeconds` | number  | `30`                     | Anfragezeitlimit in Sekunden                      |

    <Note>
    Dies ist eine entfernte xAI-Sandbox-Ausführung, keine lokale [`exec`](/de/tools/exec).
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
    - Die xAI-Authentifizierung kann einen API-Schlüssel, eine Umgebungsvariable, einen
      Fallback auf die Plugin-Konfiguration oder OAuth mit einem berechtigten
      xAI-Konto verwenden. OAuth verwendet eine Gerätecode-Verifizierung ohne
      localhost-Callback. xAI entscheidet, welche Konten OAuth-API-Token erhalten
      können, und auf der Zustimmungsseite kann Grok Build angezeigt werden,
      obwohl OpenClaw die Grok-Build-App nicht benötigt.
    - OpenClaw stellt die Multi-Agent-Modellfamilie von xAI derzeit nicht bereit.
      xAI stellt diese Modelle über die Responses API bereit, sie akzeptieren
      jedoch nicht die clientseitigen oder benutzerdefinierten Tools, die von
      OpenClaws gemeinsam genutzter Agentenschleife verwendet werden. Siehe
      [Einschränkungen der xAI-Multi-Agent-Funktion](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Die xAI-Echtzeitsprachfunktion stellt derzeit nur den Gateway-Relay-
      Kommunikationstransport bereit. Vom Browser verwaltete Provider-WebSocket-
      Sitzungen sind noch nicht in die Control UI integriert.
    - xAI-Bild-`quality`, Bild-`mask` und zusätzliche ausschließlich
      native Seitenverhältnisse werden erst bereitgestellt, wenn das gemeinsam
      genutzte `image_generate`-Tool entsprechende providerübergreifende
      Steuerelemente besitzt.
  </Accordion>

  <Accordion title="Hinweise für Fortgeschrittene">
    - OpenClaw wendet xAI-spezifische Kompatibilitätskorrekturen für Tool-Schemas
      und Tool-Aufrufe automatisch auf dem gemeinsam genutzten Runner-Pfad an.
    - Native xAI-Anfragen verwenden standardmäßig `tool_stream: true`. Setzen Sie
      `agents.defaults.models["xai/<model>"].params.tool_stream` auf `false`,
      um dies zu deaktivieren.
    - Der mitgelieferte xAI-Wrapper entfernt nicht unterstützte Schema-Grenzen für
      die Anzahl enthaltener Elemente und nicht unterstützte Nutzlastschlüssel
      für den Reasoning-*Aufwand*, bevor native xAI-Anfragen gesendet werden.
      Grok 4.5 unterstützt niedrigen, mittleren und hohen Aufwand (Standard:
      hoch). Grok 4.3 unterstützt keinen, niedrigen, mittleren und hohen Aufwand
      (Standard: niedrig). Andere Reasoning-fähige xAI-Modelle bieten keine
      konfigurierbare Aufwandssteuerung, fordern jedoch weiterhin
      `include: ["reasoning.encrypted_content"]` an, damit zuvor verschlüsseltes
      Reasoning in nachfolgenden Runden erneut verwendet werden kann.
    - `web_search`, `x_search` und `code_execution` werden als OpenClaw-
      Tools bereitgestellt. OpenClaw fügt der Anfrage jedes Tools nur die
      spezifische integrierte xAI-Funktion hinzu, die das Tool benötigt, anstatt
      jedem Chat-Durchlauf alle nativen Tools hinzuzufügen.
    - Grok `web_search` liest `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` liest `plugins.entries.xai.config.xSearch.baseUrl` und
      greift anschließend auf die Basis-URL der Grok-Websuche zurück.
    - `x_search` und `code_execution` werden vom mitgelieferten xAI-Plugin
      verwaltet, statt fest in die zentrale Modell-Laufzeit integriert zu sein.
    - `code_execution` ist eine entfernte xAI-Sandbox-Ausführung, keine lokale
      [`exec`](/de/tools/exec).
  </Accordion>
</AccordionGroup>

## Live-Tests

Die xAI-Medienpfade werden durch Unit-Tests und optional aktivierbare Live-
Testsuiten abgedeckt. Exportieren Sie vor dem Ausführen von Live-Prüfungen
`XAI_API_KEY` in die Prozessumgebung.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Die providerspezifische Live-Datei synthetisiert normales TTS und
telefoniefreundliches PCM-TTS, transkribiert Audio über xAI-Batch-STT, streamt
dasselbe PCM über xAI-Echtzeit-STT, generiert Text-zu-Bild-Ausgaben und
bearbeitet ein Referenzbild. Die gemeinsam genutzte Bild-Live-Datei überprüft
denselben xAI-Provider über OpenClaws Laufzeitauswahl-, Fallback-,
Normalisierungs- und Medienanhangspfad. Der optional aktivierbare Fall für
Video 1.5 übermittelt ein generiertes Einzelbild als erstes Frame mit 1080P
und überprüft den Download des fertiggestellten Videos.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsam genutzte Parameter des Video-Tools und Providerauswahl.
  </Card>
  <Card title="Alle Provider" href="/de/providers/index" icon="grid-2">
    Die umfassendere Providerübersicht.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Lösungen.
  </Card>
</CardGroup>
