---
read_when:
    - Sie möchten Google-Gemini-Modelle mit OpenClaw verwenden.
    - Sie benötigen den Authentifizierungsablauf mit API-Schlüssel oder OAuth.
summary: Google-Gemini-Einrichtung (API-Schlüssel + OAuth, Bildgenerierung, Medienverständnis, TTS, Websuche)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-26T11:37:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 312c7a5bc433831d98d1d47c42c5cac6a4cd8d4948ddbf16f1ae11aaec7a0339
    source_path: providers/google.md
    workflow: 15
---

Das Google-Plugin bietet Zugriff auf Gemini-Modelle über Google AI Studio sowie
Bildgenerierung, Medienverständnis (Bild/Audio/Video), Text-to-Speech und Websuche über
Gemini Grounding.

- Provider: `google`
- Authentifizierung: `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- API: Google Gemini API
- Laufzeitoption: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  verwendet Gemini-CLI-OAuth wieder, während Modellreferenzen als `google/*` kanonisch bleiben.

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="API-Schlüssel">
    **Am besten geeignet für:** Standardzugriff auf die Gemini-API über Google AI Studio.

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Oder den Schlüssel direkt übergeben:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Ein Standardmodell setzen">
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
    **Am besten geeignet für:** Wiederverwendung einer bestehenden Gemini-CLI-Anmeldung per PKCE OAuth statt eines separaten API-Schlüssels.

    <Warning>
    Der Provider `google-gemini-cli` ist eine inoffizielle Integration. Einige Benutzer
    berichten über Kontobeschränkungen bei der Nutzung von OAuth auf diese Weise. Nutzung auf eigenes Risiko.
    </Warning>

    <Steps>
      <Step title="Die Gemini CLI installieren">
        Der lokale Befehl `gemini` muss auf `PATH` verfügbar sein.

        ```bash
        # Homebrew
        brew install gemini-cli

        # oder npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw unterstützt sowohl Homebrew-Installationen als auch globale npm-Installationen, einschließlich
        gängiger Layouts unter Windows/npm.
      </Step>
      <Step title="Per OAuth anmelden">
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
    - Laufzeit: `google-gemini-cli`
    - Alias: `gemini-cli`

    **Umgebungsvariablen:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Oder die Varianten `GEMINI_CLI_*`.)

    <Note>
    Wenn Anfragen mit Gemini-CLI-OAuth nach der Anmeldung fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder
    `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host und versuchen Sie es erneut.
    </Note>

    <Note>
    Wenn die Anmeldung fehlschlägt, bevor der Browser-Ablauf startet, stellen Sie sicher, dass der lokale Befehl `gemini`
    installiert und auf `PATH` liegt.
    </Note>

    Modellreferenzen `google-gemini-cli/*` sind Legacy-Kompatibilitäts-Aliasse. Neue
    Konfigurationen sollten Modellreferenzen `google/*` plus die Laufzeit `google-gemini-cli`
    verwenden, wenn sie lokale Ausführung über die Gemini CLI möchten.

  </Tab>
</Tabs>

## Fähigkeiten

| Fähigkeit              | Unterstützt                   |
| ---------------------- | ----------------------------- |
| Chat-Completions       | Ja                            |
| Bildgenerierung        | Ja                            |
| Musikgenerierung       | Ja                            |
| Text-to-Speech         | Ja                            |
| Realtime-Voice         | Ja (Google Live API)          |
| Bildverständnis        | Ja                            |
| Audio-Transkription    | Ja                            |
| Videoverständnis       | Ja                            |
| Websuche (Grounding)   | Ja                            |
| Thinking/Reasoning     | Ja (Gemini 2.5+ / Gemini 3+)  |
| Gemma-4-Modelle        | Ja                            |

<Tip>
Gemini-3-Modelle verwenden `thinkingLevel` statt `thinkingBudget`. OpenClaw bildet
Gemini 3, Gemini 3.1 und Reasoning-Steuerungen für den Alias `gemini-*-latest` auf
`thinkingLevel` ab, damit Standard-/Low-Latency-Läufe keine deaktivierten
Werte für `thinkingBudget` senden.

`/think adaptive` behält Googles dynamische Thinking-Semantik bei, statt einen
festen OpenClaw-Level zu wählen. Gemini 3 und Gemini 3.1 lassen einen festen `thinkingLevel` weg, damit
Google den Level wählen kann; Gemini 2.5 sendet Googles dynamischen Sentinel
`thinkingBudget: -1`.

Gemma-4-Modelle (zum Beispiel `gemma-4-26b-a4b-it`) unterstützen den Thinking-Modus. OpenClaw
schreibt `thinkingBudget` auf ein unterstütztes Google-`thinkingLevel` für Gemma 4 um.
Wenn Thinking auf `off` gesetzt wird, bleibt Thinking deaktiviert, statt auf
`MINIMAL` abgebildet zu werden.
</Tip>

## Bildgenerierung

Der gebündelte Provider `google` für Bildgenerierung verwendet standardmäßig
`google/gemini-3.1-flash-image-preview`.

- Unterstützt auch `google/gemini-3-pro-image-preview`
- Generieren: bis zu 4 Bilder pro Anfrage
- Edit-Modus: aktiviert, bis zu 5 Eingabebilder
- Geometriesteuerungen: `size`, `aspectRatio` und `resolution`

Um Google als Standard-Provider für Bilder zu verwenden:

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
Siehe [Bildgenerierung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

## Videogenerierung

Das gebündelte Plugin `google` registriert auch Videogenerierung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `google/veo-3.1-fast-generate-preview`
- Modi: Text-zu-Video, Bild-zu-Video und Flows mit einzelner Video-Referenz
- Unterstützt `aspectRatio`, `resolution` und `audio`
- Aktuelle Begrenzung der Dauer: **4 bis 8 Sekunden**

Um Google als Standard-Provider für Video zu verwenden:

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
Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

## Musikgenerierung

Das gebündelte Plugin `google` registriert auch Musikgenerierung über das gemeinsame
Tool `music_generate`.

- Standard-Musikmodell: `google/lyria-3-clip-preview`
- Unterstützt auch `google/lyria-3-pro-preview`
- Prompt-Steuerungen: `lyrics` und `instrumental`
- Ausgabeformat: standardmäßig `mp3`, plus `wav` bei `google/lyria-3-pro-preview`
- Referenzeingaben: bis zu 10 Bilder
- Sitzungsgebundene Läufe werden über den gemeinsamen Aufgaben-/Status-Fluss abgekoppelt, einschließlich `action: "status"`

Um Google als Standard-Provider für Musik zu verwenden:

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
Siehe [Musikgenerierung](/de/tools/music-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

## Text-to-Speech

Der gebündelte Speech-Provider `google` verwendet den Gemini-API-TTS-Pfad mit
`gemini-3.1-flash-tts-preview`.

- Standardstimme: `Kore`
- Authentifizierung: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- Ausgabe: WAV für normale TTS-Anhänge, Opus für Ziele mit Sprachnotizen, PCM für Talk/Telephony
- Ausgabe für Sprachnotizen: Google PCM wird als WAV verpackt und mit `ffmpeg` in 48-kHz-Opus transkodiert

Um Google als Standard-TTS-Provider zu verwenden:

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

Gemini-API-TTS verwendet natürlichsprachliche Prompting-Steuerung für den Stil. Setzen Sie
`audioProfile`, um vor den gesprochenen Text einen wiederverwendbaren Stil-Prompt voranzustellen. Setzen Sie
`speakerName`, wenn Ihr Prompt-Text sich auf einen benannten Sprecher bezieht.

Gemini-API-TTS akzeptiert auch expressive Audio-Tags in eckigen Klammern im Text,
wie `[whispers]` oder `[laughs]`. Um Tags aus der sichtbaren Chat-Antwort herauszuhalten,
sie aber an TTS zu senden, legen Sie sie in einen Block `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Ein API-Schlüssel aus der Google Cloud Console, der auf die Gemini API beschränkt ist, ist für diesen
Provider gültig. Dies ist nicht der separate Pfad der Cloud-Text-to-Speech-API.
</Note>

## Realtime-Voice

Das gebündelte Plugin `google` registriert einen Realtime-Voice-Provider auf Basis der
Gemini Live API für Backend-Audio-Bridges wie Voice Call und Google Meet.

| Einstellung            | Konfigurationspfad                                                    | Standard                                                                              |
| ---------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modell                 | `plugins.entries.voice-call.config.realtime.providers.google.model`   | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Stimme                 | `...google.voice`                                                     | `Kore`                                                                                |
| Temperatur             | `...google.temperature`                                               | (nicht gesetzt)                                                                       |
| VAD-Startsensitivität  | `...google.startSensitivity`                                          | (nicht gesetzt)                                                                       |
| VAD-Endsensitivität    | `...google.endSensitivity`                                            | (nicht gesetzt)                                                                       |
| Stilledauer            | `...google.silenceDurationMs`                                         | (nicht gesetzt)                                                                       |
| API-Schlüssel          | `...google.apiKey`                                                    | Fällt auf `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY` zurück |

Beispiel für eine Realtime-Konfiguration von Voice Call:

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
Die Google Live API verwendet bidirektionales Audio und Function Calling über ein WebSocket.
OpenClaw passt Audio aus Telephony-/Meet-Bridges an den PCM-Live-API-Stream von Gemini an und
belässt Tool-Aufrufe beim gemeinsamen Vertrag für Realtime-Voice. Lassen Sie `temperature`
ungesetzt, sofern Sie keine Änderungen am Sampling benötigen; OpenClaw lässt nicht positive Werte
weg, weil Google Live bei `temperature: 0` Transkripte ohne Audio zurückgeben kann.
Transkription über die Gemini API ist ohne `languageCodes` aktiviert; das aktuelle Google-
SDK lehnt Hinweise auf Sprachcodes auf diesem API-Pfad ab.
</Note>

<Note>
Browser-Sitzungen der Control UI im Talk-Modus erfordern weiterhin einen Realtime-Voice-Provider mit einer
WebRTC-Sitzungsimplementierung für den Browser. Heute ist dieser Pfad OpenAI Realtime; der
Google-Provider ist für Backend-Realtime-Bridges gedacht.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Direkte Wiederverwendung des Gemini-Caches">
    Für direkte Gemini-API-Läufe (`api: "google-generative-ai"`) leitet OpenClaw
    einen konfigurierten Handle `cachedContent` an Gemini-Anfragen weiter.

    - Konfigurieren Sie modellbezogene oder globale Parameter mit entweder
      `cachedContent` oder Legacy-`cached_content`
    - Wenn beide vorhanden sind, gewinnt `cachedContent`
    - Beispielwert: `cachedContents/prebuilt-context`
    - Die Nutzung bei Gemini-Cache-Treffern wird in OpenClaw auf `cacheRead` normalisiert aus
      dem Upstream-Wert `cachedContentTokenCount`

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

    - Antworttext stammt aus dem JSON-Feld `response` der CLI.
    - Die Nutzung fällt auf `stats` zurück, wenn die CLI `usage` leer lässt.
    - `stats.cached` wird in OpenClaw auf `cacheRead` normalisiert.
    - Wenn `stats.input` fehlt, leitet OpenClaw Eingabetokens aus
      `stats.input_tokens - stats.cached` ab.

  </Accordion>

  <Accordion title="Umgebungs- und Daemon-Einrichtung">
    Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `GEMINI_API_KEY`
    diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bild-Tools und Providerauswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Providerauswahl.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Gemeinsame Parameter des Musik-Tools und Providerauswahl.
  </Card>
</CardGroup>
