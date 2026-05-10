---
read_when:
    - Sie möchten Google Gemini-Modelle mit OpenClaw verwenden
    - Sie benötigen den API-Schlüssel oder den OAuth-Authentifizierungsablauf
summary: Google Gemini einrichten (API-Schlüssel + OAuth, Bilderzeugung, Medienverständnis, TTS, Websuche)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-10T19:49:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd61383edad3192577d37c9a706470828d59edd5a187ef4f3c30985afaf46167
    source_path: providers/google.md
    workflow: 16
---

Das Google-Plugin bietet Zugriff auf Gemini-Modelle über Google AI Studio sowie
Bildgenerierung, Medienverständnis (Bild/Audio/Video), Text-to-Speech und Websuche über
Gemini Grounding.

- Provider: `google`
- Authentifizierung: `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- API: Google Gemini API
- Runtime-Option: Provider/Modell `agentRuntime.id: "google-gemini-cli"`
  verwendet Gemini CLI OAuth wieder, während Modellreferenzen kanonisch als `google/*` beibehalten werden.

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="API key">
    **Am besten für:** standardmäßigen Gemini-API-Zugriff über Google AI Studio.

    <Steps>
      <Step title="Run onboarding">
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
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Die Umgebungsvariablen `GEMINI_API_KEY` und `GOOGLE_API_KEY` werden beide akzeptiert. Verwenden Sie die, die Sie bereits konfiguriert haben.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Am besten für:** die Wiederverwendung einer vorhandenen Gemini CLI-Anmeldung über PKCE OAuth statt eines separaten API-Schlüssels.

    <Warning>
    Der Provider `google-gemini-cli` ist eine inoffizielle Integration. Einige Benutzer
    berichten von Kontoeinschränkungen bei der Verwendung von OAuth auf diese Weise. Nutzung auf eigenes Risiko.
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
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
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Standardmodell: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    Die Gemini API-Modell-ID von Gemini 3.1 Pro ist `gemini-3.1-pro-preview`. OpenClaw akzeptiert den kürzeren Wert `google/gemini-3.1-pro` als praktischen Alias und normalisiert ihn vor Provider-Aufrufen.

    **Umgebungsvariablen:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Oder die `GEMINI_CLI_*`-Varianten.)

    <Note>
    Wenn Gemini CLI OAuth-Anfragen nach der Anmeldung fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder
    `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host und versuchen Sie es erneut.
    </Note>

    <Note>
    Wenn die Anmeldung fehlschlägt, bevor der Browser-Ablauf startet, stellen Sie sicher, dass der lokale Befehl `gemini`
    installiert und auf `PATH` verfügbar ist.
    </Note>

    `google-gemini-cli/*`-Modellreferenzen sind Legacy-Kompatibilitätsaliase. Neue
    Konfigurationen sollten `google/*`-Modellreferenzen plus die Runtime `google-gemini-cli`
    verwenden, wenn sie lokale Gemini CLI-Ausführung wünschen.

  </Tab>
</Tabs>

## Funktionen

| Funktion               | Unterstützt                   |
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
| Denken/Reasoning       | Ja (Gemini 2.5+ / Gemini 3+) |
| Gemma 4-Modelle        | Ja                            |

## Websuche

Der gebündelte Websuche-Provider `gemini` verwendet Gemini Google Search Grounding.
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

Die Priorität der Zugangsdaten ist zuerst der dedizierte `webSearch.apiKey`, dann `GEMINI_API_KEY`,
dann `models.providers.google.apiKey`. `webSearch.baseUrl` ist optional und
für Operator-Proxys oder kompatible Gemini API-Endpunkte vorgesehen; wenn es ausgelassen wird,
verwendet die Gemini-Websuche `models.providers.google.baseUrl` wieder. Siehe
[Gemini-Suche](/de/tools/gemini-search) für das Provider-spezifische Tool-Verhalten.

<Tip>
Gemini 3-Modelle verwenden `thinkingLevel` statt `thinkingBudget`. OpenClaw ordnet
Reasoning-Steuerungen für Gemini 3, Gemini 3.1 und `gemini-*-latest`-Aliase
`thinkingLevel` zu, damit Standardläufe und Läufe mit niedriger Latenz keine deaktivierten
`thinkingBudget`-Werte senden.

`/think adaptive` behält Googles dynamische Denksemantik bei, statt
eine feste OpenClaw-Stufe zu wählen. Gemini 3 und Gemini 3.1 lassen ein festes `thinkingLevel` aus, damit
Google die Stufe wählen kann; Gemini 2.5 sendet Googles dynamischen Sentinel
`thinkingBudget: -1`.

Gemma 4-Modelle (zum Beispiel `gemma-4-26b-a4b-it`) unterstützen den Denkmodus. OpenClaw
schreibt `thinkingBudget` für Gemma 4 in ein unterstütztes Google-`thinkingLevel` um.
Wenn Denken auf `off` gesetzt wird, bleibt Denken deaktiviert, statt auf
`MINIMAL` abgebildet zu werden.
</Tip>

## Bildgenerierung

Der gebündelte Bildgenerierungs-Provider `google` verwendet standardmäßig
`google/gemini-3.1-flash-image-preview`.

- Unterstützt auch `google/gemini-3-pro-image-preview`
- Generieren: bis zu 4 Bilder pro Anfrage
- Bearbeitungsmodus: aktiviert, bis zu 5 Eingabebilder
- Geometriesteuerungen: `size`, `aspectRatio` und `resolution`

So verwenden Sie Google als Standard-Bild-Provider:

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
Siehe [Bildgenerierung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Videogenerierung

Das gebündelte `google`-Plugin registriert außerdem Videogenerierung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `google/veo-3.1-fast-generate-preview`
- Modi: Text-zu-Video, Bild-zu-Video und Einzelvideo-Referenzabläufe
- Unterstützt `aspectRatio`, `resolution` und `audio`
- Aktuelle Begrenzung der Dauer: **4 bis 8 Sekunden**

So verwenden Sie Google als Standard-Video-Provider:

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
Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Musikgenerierung

Das gebündelte `google`-Plugin registriert außerdem Musikgenerierung über das gemeinsame
Tool `music_generate`.

- Standard-Musikmodell: `google/lyria-3-clip-preview`
- Unterstützt auch `google/lyria-3-pro-preview`
- Prompt-Steuerungen: `lyrics` und `instrumental`
- Ausgabeformat: standardmäßig `mp3`, zusätzlich `wav` auf `google/lyria-3-pro-preview`
- Referenzeingaben: bis zu 10 Bilder
- Sitzungsbasierte Läufe werden über den gemeinsamen Task-/Statusablauf entkoppelt, einschließlich `action: "status"`

So verwenden Sie Google als Standard-Musik-Provider:

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
Siehe [Musikgenerierung](/de/tools/music-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Text-to-Speech

Der gebündelte Sprach-Provider `google` verwendet den Gemini API-TTS-Pfad mit
`gemini-3.1-flash-tts-preview`.

- Standardstimme: `Kore`
- Authentifizierung: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- Ausgabe: WAV für reguläre TTS-Anhänge, Opus für Sprachnotiz-Ziele, PCM für Talk/Telefonie
- Sprachnotiz-Ausgabe: Google-PCM wird als WAV verpackt und mit `ffmpeg` in 48-kHz-Opus transkodiert

Googles Batch-Gemini-TTS-Pfad gibt generiertes Audio in der abgeschlossenen
`generateContent`-Antwort zurück. Für gesprochene Konversationen mit geringster Latenz verwenden Sie den
Google-Echtzeit-Sprach-Provider, der auf der Gemini Live API basiert, statt Batch-TTS.

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

Gemini API TTS verwendet Prompts in natürlicher Sprache zur Stilsteuerung. Setzen Sie
`audioProfile`, um dem gesprochenen Text einen wiederverwendbaren Stil-Prompt voranzustellen. Setzen Sie
`speakerName`, wenn Ihr Prompt-Text auf einen benannten Sprecher verweist.

Gemini API TTS akzeptiert außerdem ausdrucksstarke Audio-Tags in eckigen Klammern im Text,
wie `[whispers]` oder `[laughs]`. Um Tags aus der sichtbaren Chat-Antwort herauszuhalten,
sie aber an TTS zu senden, platzieren Sie sie in einem `[[tts:text]]...[[/tts:text]]`-Block:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Ein auf die Gemini API beschränkter Google Cloud Console-API-Schlüssel ist für diesen
Provider gültig. Dies ist nicht der separate Cloud Text-to-Speech API-Pfad.
</Note>

## Echtzeit-Sprache

Das gebündelte `google`-Plugin registriert einen Echtzeit-Sprach-Provider, der auf der
Gemini Live API basiert, für Backend-Audio-Bridges wie Voice Call und Google Meet.

| Einstellung                 | Konfigurationspfad                                                  | Standard                                                                              |
| --------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modell                      | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Stimme                      | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatur                  | `...google.temperature`                                             | (nicht gesetzt)                                                                       |
| VAD-Startempfindlichkeit    | `...google.startSensitivity`                                        | (nicht gesetzt)                                                                       |
| VAD-Endempfindlichkeit      | `...google.endSensitivity`                                          | (nicht gesetzt)                                                                       |
| Stilledauer                 | `...google.silenceDurationMs`                                       | (nicht gesetzt)                                                                       |
| Aktivitätsbehandlung        | `...google.activityHandling`                                        | Google-Standard, `start-of-activity-interrupts`                                       |
| Turn-Abdeckung              | `...google.turnCoverage`                                            | Google-Standard, `only-activity`                                                      |
| Automatische VAD deaktivieren | `...google.automaticActivityDetectionDisabled`                    | `false`                                                                               |
| Sitzungsfortsetzung         | `...google.sessionResumption`                                       | `true`                                                                                |
| Kontextkomprimierung        | `...google.contextWindowCompression`                                | `true`                                                                                |
| API-Schlüssel               | `...google.apiKey`                                                  | Fällt zurück auf `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY` |

Beispiel für Voice Call-Echtzeitkonfiguration:

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
Google Live API verwendet bidirektionales Audio und Funktionsaufrufe über einen WebSocket.
OpenClaw passt Audio aus Telefonie-/Meet-Bridges an den PCM-Live-API-Stream von Gemini an und
behält Tool-Aufrufe auf dem gemeinsamen Echtzeit-Sprachvertrag. Lassen Sie `temperature`
nicht gesetzt, sofern Sie keine Sampling-Änderungen benötigen; OpenClaw lässt nicht positive Werte aus,
weil Google Live für `temperature: 0` Transkripte ohne Audio zurückgeben kann.
Die Gemini API-Transkription ist ohne `languageCodes` aktiviert; das aktuelle Google-
SDK lehnt Hinweise auf Sprachcodes in diesem API-Pfad ab.
</Note>

<Note>
Control UI Talk unterstützt Google Live-Browsersitzungen mit eingeschränkten Einmal-
Tokens. Reine Backend-Echtzeit-Sprach-Provider können auch über den generischen
Gateway-Relay-Transport laufen, der Provider-Anmeldedaten auf dem Gateway hält.
</Note>

Führen Sie für die Live-Verifizierung durch Maintainer
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` aus.
Der Smoke-Test deckt auch OpenAI-Backend-/WebRTC-Pfade ab; der Google-Abschnitt stellt dieselbe
eingeschränkte Live-API-Token-Form aus, die von Control UI Talk verwendet wird, öffnet den Browser-
WebSocket-Endpunkt, sendet die anfängliche Setup-Nutzlast und wartet auf
`setupComplete`.

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Direkte Wiederverwendung des Gemini-Caches">
    Für direkte Gemini API-Ausführungen (`api: "google-generative-ai"`) übergibt OpenClaw
    ein konfiguriertes `cachedContent`-Handle an Gemini-Anfragen.

    - Konfigurieren Sie pro Modell oder global Parameter entweder mit
      `cachedContent` oder dem Legacy-`cached_content`
    - Wenn beide vorhanden sind, gewinnt `cachedContent`
    - Beispielwert: `cachedContents/prebuilt-context`
    - Gemini-Cache-Treffer-Nutzung wird aus dem Upstream-`cachedContentTokenCount`
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

  <Accordion title="Hinweise zur JSON-Nutzung der Gemini CLI">
    Bei Verwendung des OAuth-Providers `google-gemini-cli` normalisiert OpenClaw
    die JSON-Ausgabe der CLI wie folgt:

    - Antworttext stammt aus dem CLI-JSON-Feld `response`.
    - Die Nutzung fällt auf `stats` zurück, wenn die CLI `usage` leer lässt.
    - `stats.cached` wird in OpenClaw `cacheRead` normalisiert.
    - Wenn `stats.input` fehlt, leitet OpenClaw Eingabe-Tokens aus
      `stats.input_tokens - stats.cached` ab.

  </Accordion>

  <Accordion title="Umgebungs- und Daemon-Einrichtung">
    Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `GEMINI_API_KEY`
    für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Bilderzeugung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Bild-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Videoerzeugung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Video-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Musikerzeugung" href="/de/tools/music-generation" icon="music">
    Gemeinsame Musik-Tool-Parameter und Provider-Auswahl.
  </Card>
</CardGroup>
