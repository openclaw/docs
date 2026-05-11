---
read_when:
    - Sie möchten Google Gemini-Modelle mit OpenClaw verwenden
    - Sie benötigen den API-Schlüssel oder den OAuth-Authentifizierungsablauf
summary: Einrichtung von Google Gemini (API-Schlüssel + OAuth, Bildgenerierung, Medienverständnis, TTS, Websuche)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-11T20:35:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740ff99392d352e8c0f479af6002c52195b0c40e3ef688289d27dec583174847
    source_path: providers/google.md
    workflow: 16
---

Das Google-Plugin bietet Zugriff auf Gemini-Modelle über Google AI Studio sowie
Bildgenerierung, Medienverständnis (Bild/Audio/Video), Text-to-Speech und Websuche über
Gemini Grounding.

- Provider: `google`
- Authentifizierung: `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- API: Google Gemini API
- Laufzeitoption: Provider/Modell `agentRuntime.id: "google-gemini-cli"`
  verwendet Gemini CLI OAuth wieder, während Modellreferenzen kanonisch als `google/*` bleiben.

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="API-Schlüssel">
    **Am besten für:** Standardzugriff auf die Gemini API über Google AI Studio.

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Oder übergeben Sie den Schlüssel direkt:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Standardmodell festlegen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Die Umgebungsvariablen `GEMINI_API_KEY` und `GOOGLE_API_KEY` werden beide akzeptiert. Verwenden Sie diejenige, die Sie bereits konfiguriert haben.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Am besten für:** Wiederverwendung einer bestehenden Gemini CLI-Anmeldung über PKCE OAuth statt eines separaten API-Schlüssels.

    <Warning>
    Der Provider `google-gemini-cli` ist eine inoffizielle Integration. Einige Benutzer
    berichten von Kontoeinschränkungen, wenn OAuth auf diese Weise verwendet wird. Die Nutzung erfolgt auf eigenes Risiko.
    </Warning>

    <Steps>
      <Step title="Gemini CLI installieren">
        Der lokale Befehl `gemini` muss auf `PATH` verfügbar sein.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw unterstützt sowohl Homebrew-Installationen als auch globale npm-Installationen, einschließlich
        gängiger Windows/npm-Layouts.
      </Step>
      <Step title="Über OAuth anmelden">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Standardmodell: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    Die Gemini API-Modell-ID von Gemini 3.1 Pro lautet `gemini-3.1-pro-preview`. OpenClaw akzeptiert den kürzeren Wert `google/gemini-3.1-pro` als praktischen Alias und normalisiert ihn vor Provider-Aufrufen.

    **Umgebungsvariablen:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Oder die `GEMINI_CLI_*`-Varianten.)

    <Note>
    Wenn Gemini CLI OAuth-Anfragen nach der Anmeldung fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder
    `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host und versuchen Sie es erneut.
    </Note>

    <Note>
    Wenn die Anmeldung fehlschlägt, bevor der Browser-Flow startet, stellen Sie sicher, dass der lokale Befehl `gemini`
    installiert und auf `PATH` verfügbar ist.
    </Note>

    `google-gemini-cli/*`-Modellreferenzen sind Legacy-Kompatibilitätsaliase. Neue
    Konfigurationen sollten `google/*`-Modellreferenzen plus die Runtime `google-gemini-cli`
    verwenden, wenn lokale Gemini CLI-Ausführung gewünscht ist.

  </Tab>
</Tabs>

## Fähigkeiten

| Fähigkeit              | Unterstützt                   |
| ---------------------- | ----------------------------- |
| Chat-Vervollständigungen | Ja                          |
| Bildgenerierung        | Ja                            |
| Musikgenerierung       | Ja                            |
| Text-to-Speech         | Ja                            |
| Echtzeit-Sprache       | Ja (Google Live API)          |
| Bildverständnis        | Ja                            |
| Audiotranskription     | Ja                            |
| Videoverständnis       | Ja                            |
| Websuche (Grounding)   | Ja                            |
| Denken/Reasoning       | Ja (Gemini 2.5+ / Gemini 3+)  |
| Gemma 4-Modelle        | Ja                            |

## Websuche

Der gebündelte `gemini`-Provider für Websuche verwendet Gemini Google Search Grounding.
Konfigurieren Sie einen dedizierten Suchschlüssel unter `plugins.entries.google.config.webSearch`,
oder lassen Sie ihn nach `GEMINI_API_KEY` `models.providers.google.apiKey` wiederverwenden:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

Die Priorität für Anmeldedaten ist zuerst dediziertes `webSearch.apiKey`, dann `GEMINI_API_KEY`,
dann `models.providers.google.apiKey`. `webSearch.baseUrl` ist optional und
existiert für Betreiber-Proxys oder kompatible Gemini API-Endpunkte; wenn es ausgelassen wird,
verwendet die Gemini-Websuche `models.providers.google.baseUrl` wieder. Siehe
[Gemini-Suche](/de/tools/gemini-search) für das Provider-spezifische Toolverhalten.

<Tip>
Gemini 3-Modelle verwenden `thinkingLevel` statt `thinkingBudget`. OpenClaw ordnet
Reasoning-Steuerungen für Gemini 3, Gemini 3.1 und `gemini-*-latest`-Aliase
`thinkingLevel` zu, damit Standardläufe und Läufe mit geringer Latenz keine deaktivierten
`thinkingBudget`-Werte senden.

`/think adaptive` behält Googles dynamische Denksemantik bei, statt ein festes
OpenClaw-Level zu wählen. Gemini 3 und Gemini 3.1 lassen ein festes `thinkingLevel` aus, damit
Google das Level wählen kann; Gemini 2.5 sendet Googles dynamischen Sentinel
`thinkingBudget: -1`.

Gemma 4-Modelle (zum Beispiel `gemma-4-26b-a4b-it`) unterstützen den Denkmodus. OpenClaw
schreibt `thinkingBudget` für Gemma 4 in ein unterstütztes Google-`thinkingLevel` um.
Wenn Denken auf `off` gesetzt wird, bleibt Denken deaktiviert, statt auf
`MINIMAL` abgebildet zu werden.
</Tip>

## Bildgenerierung

Der gebündelte `google`-Provider für Bildgenerierung verwendet standardmäßig
`google/gemini-3.1-flash-image-preview`.

- Unterstützt auch `google/gemini-3-pro-image-preview`
- Generieren: bis zu 4 Bilder pro Anfrage
- Bearbeitungsmodus: aktiviert, bis zu 5 Eingabebilder
- Geometriesteuerungen: `size`, `aspectRatio` und `resolution`

So verwenden Sie Google als Standard-Provider für Bilder:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Siehe [Bildgenerierung](/de/tools/image-generation) für gemeinsame Toolparameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Videogenerierung

Das gebündelte `google`-Plugin registriert außerdem Videogenerierung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `google/veo-3.1-fast-generate-preview`
- Modi: Text-zu-Video, Bild-zu-Video und Einzelvideo-Referenz-Flows
- Unterstützt `aspectRatio` (`16:9`, `9:16`) und `resolution` (`720P`, `1080P`); Audioausgabe wird von Veo derzeit nicht unterstützt
- Unterstützte Dauern: **4, 6 oder 8 Sekunden** (andere Werte werden auf den nächstgelegenen zulässigen Wert gesetzt)

So verwenden Sie Google als Standard-Provider für Videos:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Toolparameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Musikgenerierung

Das gebündelte `google`-Plugin registriert außerdem Musikgenerierung über das gemeinsame
Tool `music_generate`.

- Standard-Musikmodell: `google/lyria-3-clip-preview`
- Unterstützt auch `google/lyria-3-pro-preview`
- Prompt-Steuerungen: `lyrics` und `instrumental`
- Ausgabeformat: standardmäßig `mp3`, außerdem `wav` auf `google/lyria-3-pro-preview`
- Referenzeingaben: bis zu 10 Bilder
- Sitzungsbasierte Läufe werden über den gemeinsamen Aufgaben-/Status-Flow entkoppelt, einschließlich `action: "status"`

So verwenden Sie Google als Standard-Provider für Musik:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Siehe [Musikgenerierung](/de/tools/music-generation) für gemeinsame Toolparameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Text-to-Speech

Der gebündelte `google`-Sprach-Provider verwendet den Gemini API-TTS-Pfad mit
`gemini-3.1-flash-tts-preview`.

- Standardstimme: `Kore`
- Authentifizierung: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- Ausgabe: WAV für reguläre TTS-Anhänge, Opus für Sprachnotiz-Ziele, PCM für Talk/Telefonie
- Sprachnotiz-Ausgabe: Google PCM wird als WAV verpackt und mit `ffmpeg` in 48-kHz-Opus transkodiert

Googles Batch-Gemini-TTS-Pfad gibt generiertes Audio in der abgeschlossenen
`generateContent`-Antwort zurück. Verwenden Sie für gesprochene Unterhaltungen mit geringster Latenz den
Google-Echtzeit-Sprach-Provider, der auf der Gemini Live API basiert, statt Batch-
TTS.

So verwenden Sie Google als Standard-TTS-Provider:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS verwendet natürlichsprachliche Prompts zur Stilsteuerung. Setzen Sie
`audioProfile`, um dem gesprochenen Text einen wiederverwendbaren Stil-Prompt voranzustellen. Setzen Sie
`speakerName`, wenn Ihr Prompt-Text auf einen benannten Sprecher verweist.

Gemini API TTS akzeptiert außerdem ausdrucksstarke Audio-Tags in eckigen Klammern im Text,
wie `[whispers]` oder `[laughs]`. Um Tags aus der sichtbaren Chat-Antwort
herauszuhalten, sie aber an TTS zu senden, platzieren Sie sie in einem `[[tts:text]]...[[/tts:text]]`-
Block:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Ein auf die Gemini API beschränkter API-Schlüssel aus der Google Cloud Console ist für diesen
Provider gültig. Dies ist nicht der separate Cloud Text-to-Speech API-Pfad.
</Note>

## Echtzeit-Sprache

Das gebündelte `google`-Plugin registriert einen Echtzeit-Sprach-Provider, der auf der
Gemini Live API für Backend-Audio-Bridges wie Voice Call und Google Meet basiert.

| Einstellung                         | Konfigurationspfad                                                 | Standard                                                                              |
| ----------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modell                              | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Stimme                              | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatur                          | `...google.temperature`                                             | (nicht gesetzt)                                                                       |
| VAD-Startempfindlichkeit            | `...google.startSensitivity`                                        | (nicht gesetzt)                                                                       |
| VAD-Endempfindlichkeit              | `...google.endSensitivity`                                          | (nicht gesetzt)                                                                       |
| Stilledauer                         | `...google.silenceDurationMs`                                       | (nicht gesetzt)                                                                       |
| Aktivitätsbehandlung                | `...google.activityHandling`                                        | Google-Standard, `start-of-activity-interrupts`                                       |
| Turn-Abdeckung                      | `...google.turnCoverage`                                            | Google-Standard, `only-activity`                                                      |
| Automatische VAD deaktivieren       | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Sitzungsfortsetzung                 | `...google.sessionResumption`                                       | `true`                                                                                |
| Kontextkomprimierung                | `...google.contextWindowCompression`                                | `true`                                                                                |
| API-Schlüssel                       | `...google.apiKey`                                                  | Fällt auf `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY` zurück |

Beispiel für die Realtime-Konfiguration von Voice Call:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API verwendet bidirektionales Audio und Function Calling über einen WebSocket.
OpenClaw passt Audio aus Telefonie-/Meet-Bridges an Geminis PCM-Live-API-Stream an und
hält Tool-Aufrufe auf dem gemeinsamen Realtime-Voice-Vertrag. Lassen Sie `temperature`
nicht gesetzt, sofern Sie keine Sampling-Änderungen benötigen; OpenClaw lässt nicht positive Werte aus,
weil Google Live bei `temperature: 0` Transkripte ohne Audio zurückgeben kann.
Die Transkription der Gemini API ist ohne `languageCodes` aktiviert; das aktuelle Google
SDK lehnt Sprachcode-Hinweise auf diesem API-Pfad ab.
</Note>

<Note>
Control UI Talk unterstützt Google Live-Browsersitzungen mit eingeschränkten Einmal-
Tokens. Realtime-Voice-Provider, die nur im Backend laufen, können auch über den generischen
Gateway-Relay-Transport ausgeführt werden, der Provider-Anmeldedaten auf dem Gateway belässt.
</Note>

Für die Live-Verifikation durch Maintainer führen Sie
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` aus.
Der Smoke-Test deckt auch OpenAI-Backend-/WebRTC-Pfade ab; der Google-Abschnitt erstellt dieselbe
eingeschränkte Live-API-Token-Form, die von Control UI Talk verwendet wird, öffnet den Browser-
WebSocket-Endpunkt, sendet die anfängliche Setup-Nutzlast und wartet auf
`setupComplete`.

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Direkte Wiederverwendung des Gemini-Cache">
    Für direkte Gemini-API-Läufe (`api: "google-generative-ai"`) leitet OpenClaw
    ein konfiguriertes `cachedContent`-Handle an Gemini-Anfragen weiter.

    - Konfigurieren Sie Parameter pro Modell oder global entweder mit
      `cachedContent` oder dem alten `cached_content`
    - Wenn beide vorhanden sind, hat `cachedContent` Vorrang
    - Beispielwert: `cachedContents/prebuilt-context`
    - Die Gemini-Cache-Hit-Nutzung wird aus dem Upstream-`cachedContentTokenCount`
      in OpenClaw `cacheRead` normalisiert

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Nutzungshinweise für Gemini CLI JSON">
    Bei Verwendung des OAuth-Providers `google-gemini-cli` normalisiert OpenClaw
    die CLI-JSON-Ausgabe wie folgt:

    - Antworttext stammt aus dem CLI-JSON-Feld `response`.
    - Die Nutzung fällt auf `stats` zurück, wenn die CLI `usage` leer lässt.
    - `stats.cached` wird in OpenClaw `cacheRead` normalisiert.
    - Wenn `stats.input` fehlt, leitet OpenClaw Eingabe-Token aus
      `stats.input_tokens - stats.cached` ab.

  </Accordion>

  <Accordion title="Umgebungs- und Daemon-Einrichtung">
    Wenn der Gateway als Daemon ausgeführt wird (launchd/systemd), stellen Sie sicher, dass `GEMINI_API_KEY`
    für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Bild-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Video-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Gemeinsame Musik-Tool-Parameter und Provider-Auswahl.
  </Card>
</CardGroup>
