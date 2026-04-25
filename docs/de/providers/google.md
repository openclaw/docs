---
read_when:
    - Sie möchten Google-Gemini-Modelle mit OpenClaw verwenden
    - Sie benötigen den Authentifizierungsablauf mit API-Schlüssel oder OAuth
summary: Google-Gemini-Einrichtung (API-Schlüssel + OAuth, Bildgenerierung, Medienverständnis, TTS, Websuche)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-25T13:54:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: de0d6563d1c7a25fe26aa7ce255b1d3ed80e950b7761039e6d0a76f23a14e6f3
    source_path: providers/google.md
    workflow: 15
---

Das Google-Plugin bietet Zugriff auf Gemini-Modelle über Google AI Studio sowie
Bildgenerierung, Medienverständnis (Bild/Audio/Video), Text-to-Speech und Websuche über
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- API: Google Gemini API
- Laufzeitoption: `agents.defaults.embeddedHarness.runtime: "google-gemini-cli"`
  verwendet Gemini-CLI-OAuth wieder, während Modell-Refs kanonisch als `google/*` beibehalten werden.

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="API-Schlüssel">
    **Am besten geeignet für:** Standardzugriff auf die Gemini API über Google AI Studio.

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
      <Step title="Ein Standardmodell festlegen">
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
      <Step title="Verifizieren, dass das Modell verfügbar ist">
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
    **Am besten geeignet für:** Wiederverwendung einer bestehenden Gemini-CLI-Anmeldung über PKCE-OAuth statt eines separaten API-Schlüssels.

    <Warning>
    Der Provider `google-gemini-cli` ist eine inoffizielle Integration. Einige Benutzer
    berichten von Kontoeinschränkungen bei dieser OAuth-Nutzung. Verwendung auf eigenes Risiko.
    </Warning>

    <Steps>
      <Step title="Die Gemini CLI installieren">
        Der lokale Befehl `gemini` muss im `PATH` verfügbar sein.

        ```bash
        # Homebrew
        brew install gemini-cli

        # oder npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw unterstützt sowohl Homebrew-Installationen als auch globale npm-Installationen, einschließlich
        gängiger Windows-/npm-Layouts.
      </Step>
      <Step title="Per OAuth anmelden">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verifizieren, dass das Modell verfügbar ist">
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
    installiert ist und sich im `PATH` befindet.
    </Note>

    Modell-Refs `google-gemini-cli/*` sind veraltete Kompatibilitätsaliase. Neue
    Konfigurationen sollten `google/*`-Modell-Refs plus die Laufzeit `google-gemini-cli`
    verwenden, wenn sie lokale Gemini-CLI-Ausführung möchten.

  </Tab>
</Tabs>

## Fähigkeiten

| Fähigkeit              | Unterstützt                    |
| ---------------------- | ------------------------------ |
| Chat-Completions       | Ja                             |
| Bildgenerierung        | Ja                             |
| Musikgenerierung       | Ja                             |
| Text-to-Speech         | Ja                             |
| Realtime-Voice         | Ja (Google Live API)           |
| Bildverständnis        | Ja                             |
| Audiotranskription     | Ja                             |
| Videoverständnis       | Ja                             |
| Websuche (Grounding)   | Ja                             |
| Thinking/Reasoning     | Ja (Gemini 2.5+ / Gemini 3+)   |
| Gemma-4-Modelle        | Ja                             |

<Tip>
Gemini-3-Modelle verwenden `thinkingLevel` statt `thinkingBudget`. OpenClaw ordnet
Reasoning-Steuerungen für Gemini 3, Gemini 3.1 und `gemini-*-latest`-Aliase
auf `thinkingLevel` ab, sodass Läufe mit Standard-/niedriger Latenz keine deaktivierten
`thinkingBudget`-Werte senden.

`/think adaptive` behält Googles dynamische Thinking-Semantik bei, statt eine
feste OpenClaw-Stufe auszuwählen. Gemini 3 und Gemini 3.1 lassen ein festes `thinkingLevel` weg, damit
Google die Stufe wählen kann; Gemini 2.5 sendet Googles dynamischen Sentinel
`thinkingBudget: -1`.

Gemma-4-Modelle (zum Beispiel `gemma-4-26b-a4b-it`) unterstützen den Thinking-Modus. OpenClaw
schreibt `thinkingBudget` für Gemma 4 in ein unterstütztes Google-`thinkingLevel` um.
Wenn Thinking auf `off` gesetzt wird, bleibt Thinking deaktiviert, statt auf
`MINIMAL` abgebildet zu werden.
</Tip>

## Bildgenerierung

Der gebündelte Provider für Bildgenerierung `google` verwendet standardmäßig
`google/gemini-3.1-flash-image-preview`.

- Unterstützt außerdem `google/gemini-3-pro-image-preview`
- Generieren: bis zu 4 Bilder pro Anfrage
- Editiermodus: aktiviert, bis zu 5 Eingabebilder
- Geometriesteuerungen: `size`, `aspectRatio` und `resolution`

Um Google als Standardprovider für Bilder zu verwenden:

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
Siehe [Image Generation](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Videogenerierung

Das gebündelte Plugin `google` registriert auch Videogenerierung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `google/veo-3.1-fast-generate-preview`
- Modi: Text-zu-Video, Bild-zu-Video und Abläufe mit Einzelvideo-Referenz
- Unterstützt `aspectRatio`, `resolution` und `audio`
- Aktuelle Begrenzung für Dauer: **4 bis 8 Sekunden**

Um Google als Standardprovider für Video zu verwenden:

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
Siehe [Video Generation](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Musikgenerierung

Das gebündelte Plugin `google` registriert auch Musikgenerierung über das gemeinsame
Tool `music_generate`.

- Standard-Musikmodell: `google/lyria-3-clip-preview`
- Unterstützt außerdem `google/lyria-3-pro-preview`
- Prompt-Steuerungen: `lyrics` und `instrumental`
- Ausgabeformat: standardmäßig `mp3`, zusätzlich `wav` bei `google/lyria-3-pro-preview`
- Referenzeingaben: bis zu 10 Bilder
- Sitzungsgebundene Läufe werden über den gemeinsamen Task-/Status-Ablauf entkoppelt, einschließlich `action: "status"`

Um Google als Standardprovider für Musik zu verwenden:

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
Siehe [Music Generation](/de/tools/music-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Text-to-Speech

Der gebündelte Speech-Provider `google` verwendet den Gemini-API-TTS-Pfad mit
`gemini-3.1-flash-tts-preview`.

- Standardstimme: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- Ausgabe: WAV für normale TTS-Anhänge, PCM für Talk/Telefonie
- Native Ausgabe als Sprachnotiz: auf diesem Gemini-API-Pfad nicht unterstützt, weil die API PCM statt Opus zurückgibt

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

Gemini-API-TTS verwendet natürlichsprachige Prompts zur Stilsteuerung. Setzen Sie
`audioProfile`, um vor den gesprochenen Text einen wiederverwendbaren Stil-Prompt zu setzen. Setzen Sie
`speakerName`, wenn Ihr Prompt-Text sich auf einen benannten Sprecher bezieht.

Gemini-API-TTS akzeptiert im Text auch expressive Audio-Tags in eckigen Klammern,
wie `[whispers]` oder `[laughs]`. Damit die Tags nicht in der sichtbaren Chat-Antwort erscheinen,
aber an TTS gesendet werden, legen Sie sie in einen Block `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Ein auf die Gemini API beschränkter API-Schlüssel aus der Google Cloud Console ist für diesen
Provider gültig. Das ist nicht der separate Cloud-Text-to-Speech-API-Pfad.
</Note>

## Realtime-Voice

Das gebündelte Plugin `google` registriert einen Realtime-Voice-Provider auf Basis der
Gemini Live API für Backend-Audio-Bridges wie Voice Call und Google Meet.

| Einstellung            | Konfigurationspfad                                                   | Standard                                                                              |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modell                 | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Stimme                 | `...google.voice`                                                    | `Kore`                                                                                |
| Temperatur             | `...google.temperature`                                              | (nicht gesetzt)                                                                       |
| VAD-Startempfindlichkeit | `...google.startSensitivity`                                      | (nicht gesetzt)                                                                       |
| VAD-Endempfindlichkeit | `...google.endSensitivity`                                           | (nicht gesetzt)                                                                       |
| Stille-Dauer           | `...google.silenceDurationMs`                                        | (nicht gesetzt)                                                                       |
| API-Schlüssel          | `...google.apiKey`                                                   | Greift auf `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY` zurück |

Beispielkonfiguration für Voice Call Realtime:

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
Google Live API verwendet bidirektionales Audio und Function Calling über einen WebSocket.
OpenClaw passt Telefonie-/Meet-Bridge-Audio an Geminis PCM-Live-API-Stream an und
behält Tool-Aufrufe im gemeinsamen Realtime-Voice-Vertrag. Lassen Sie `temperature`
ungesetzt, sofern Sie keine Änderungen am Sampling benötigen; OpenClaw lässt nicht positive Werte weg,
weil Google Live bei `temperature: 0` Transkripte ohne Audio zurückgeben kann.
Gemini-API-Transkription wird ohne `languageCodes` aktiviert; das aktuelle Google-
SDK lehnt Sprachcode-Hinweise auf diesem API-Pfad ab.
</Note>

<Note>
Browser-Sitzungen mit Talk in der Control UI erfordern weiterhin einen Realtime-Voice-Provider mit
einer Browser-WebRTC-Sitzungsimplementierung. Heute ist das OpenAI Realtime; der
Google-Provider ist für Backend-Realtime-Bridges gedacht.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Direkte Wiederverwendung des Gemini-Caches">
    Für direkte Gemini-API-Läufe (`api: "google-generative-ai"`) reicht OpenClaw
    einen konfigurierten Handle `cachedContent` an Gemini-Anfragen durch.

    - Konfigurieren Sie pro Modell oder global Parameter mit entweder
      `cachedContent` oder dem Legacy-Feld `cached_content`
    - Wenn beide vorhanden sind, hat `cachedContent` Vorrang
    - Beispielwert: `cachedContents/prebuilt-context`
    - Die Nutzung von Gemini-Cache-Treffern wird in OpenClaw als `cacheRead` aus
      dem Upstream-Wert `cachedContentTokenCount` normalisiert

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

  <Accordion title="Hinweise zur JSON-Nutzung mit Gemini CLI">
    Wenn der OAuth-Provider `google-gemini-cli` verwendet wird, normalisiert OpenClaw
    die JSON-Ausgabe der CLI wie folgt:

    - Antworttext kommt aus dem Feld `response` im CLI-JSON.
    - Nutzung greift auf `stats` zurück, wenn die CLI `usage` leer lässt.
    - `stats.cached` wird in OpenClaw zu `cacheRead` normalisiert.
    - Wenn `stats.input` fehlt, leitet OpenClaw Eingabetokens aus
      `stats.input_tokens - stats.cached` ab.

  </Accordion>

  <Accordion title="Umgebung und Daemon-Einrichtung">
    Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `GEMINI_API_KEY`
    diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
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
