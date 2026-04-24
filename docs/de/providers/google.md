---
read_when:
    - Sie möchten Google-Gemini-Modelle mit OpenClaw verwenden.
    - Sie benötigen den Auth-Flow mit API-Key oder OAuth.
summary: Google-Gemini-Einrichtung (API-Key + OAuth, Bildgenerierung, Medienverständnis, TTS, Websuche)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T09:00:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e66c9dd637e26976659d04b9b7e2452e6881945dab6011970f9e1c5e4a9a685
    source_path: providers/google.md
    workflow: 15
---

Das Google-Plugin bietet Zugriff auf Gemini-Modelle über Google AI Studio sowie
Bildgenerierung, Medienverständnis (Bild/Audio/Video), Text-to-Speech und Websuche über
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- API: Google Gemini API
- Alternativer Provider: `google-gemini-cli` (OAuth)

## Erste Schritte

Wählen Sie Ihre bevorzugte Auth-Methode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="API-Key">
    **Am besten geeignet für:** standardmäßigen Gemini-API-Zugriff über Google AI Studio.

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Oder den Key direkt übergeben:

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
      <Step title="Prüfen, ob das Modell verfügbar ist">
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
    **Am besten geeignet für:** die Wiederverwendung einer bestehenden Gemini-CLI-Anmeldung per PKCE-OAuth statt eines separaten API-Keys.

    <Warning>
    Der Provider `google-gemini-cli` ist eine inoffizielle Integration. Einige Nutzer
    berichten bei dieser OAuth-Nutzung über Kontoeinschränkungen. Verwendung auf eigenes Risiko.
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
        gängiger Windows-/npm-Layouts.
      </Step>
      <Step title="Per OAuth anmelden">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Standardmodell: `google-gemini-cli/gemini-3-flash-preview`
    - Alias: `gemini-cli`

    **Umgebungsvariablen:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Oder die Varianten `GEMINI_CLI_*`.)

    <Note>
    Falls Gemini-CLI-OAuth-Anfragen nach der Anmeldung fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder
    `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host und versuchen Sie es erneut.
    </Note>

    <Note>
    Falls die Anmeldung fehlschlägt, bevor der Browser-Flow startet, stellen Sie sicher, dass der lokale Befehl `gemini`
    installiert und auf `PATH` ist.
    </Note>

    Der nur auf OAuth basierende Provider `google-gemini-cli` ist eine separate Oberfläche
    für Textinferenz. Bildgenerierung, Medienverständnis und Gemini Grounding verbleiben auf
    der Provider-ID `google`.

  </Tab>
</Tabs>

## Funktionen

| Funktion               | Unterstützt                    |
| ---------------------- | ------------------------------ |
| Chat-Completions       | Ja                             |
| Bildgenerierung        | Ja                             |
| Musikgenerierung       | Ja                             |
| Text-to-Speech         | Ja                             |
| Realtime-Sprache       | Ja (Google Live API)           |
| Bildverständnis        | Ja                             |
| Audiotranskription     | Ja                             |
| Videoverständnis       | Ja                             |
| Websuche (Grounding)   | Ja                             |
| Thinking/Reasoning     | Ja (Gemini 2.5+ / Gemini 3+)   |
| Gemma-4-Modelle        | Ja                             |

<Tip>
Gemini-3-Modelle verwenden `thinkingLevel` statt `thinkingBudget`. OpenClaw bildet
Reasoning-Steuerungen für Gemini 3, Gemini 3.1 und den Alias `gemini-*-latest`
auf `thinkingLevel` ab, damit Standard-/Low-Latency-Läufe keine deaktivierten
`thinkingBudget`-Werte senden.

Gemma-4-Modelle (zum Beispiel `gemma-4-26b-a4b-it`) unterstützen den Thinking-Modus. OpenClaw
schreibt `thinkingBudget` für Gemma 4 in ein unterstütztes Google-`thinkingLevel` um.
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

So verwenden Sie Google als Standardprovider für Bilder:

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

Das gebündelte `google`-Plugin registriert außerdem Videogenerierung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `google/veo-3.1-fast-generate-preview`
- Modi: Text-zu-Video, Bild-zu-Video und Flows mit einzelner Videoreferenz
- Unterstützt `aspectRatio`, `resolution` und `audio`
- Aktuelle Begrenzung der Dauer: **4 bis 8 Sekunden**

So verwenden Sie Google als Standardprovider für Videos:

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

Das gebündelte `google`-Plugin registriert außerdem Musikgenerierung über das gemeinsame
Tool `music_generate`.

- Standard-Musikmodell: `google/lyria-3-clip-preview`
- Unterstützt auch `google/lyria-3-pro-preview`
- Prompt-Steuerungen: `lyrics` und `instrumental`
- Ausgabeformat: standardmäßig `mp3`, zusätzlich `wav` auf `google/lyria-3-pro-preview`
- Referenzeingaben: bis zu 10 Bilder
- Session-gestützte Läufe werden über den gemeinsamen Task-/Status-Flow entkoppelt, einschließlich `action: "status"`

So verwenden Sie Google als Standardprovider für Musik:

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

Der gebündelte Sprachprovider `google` verwendet den TTS-Pfad der Gemini API mit
`gemini-3.1-flash-tts-preview`.

- Standardstimme: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- Ausgabe: WAV für reguläre TTS-Anhänge, PCM für Talk/Telefonie
- Native Voice-Note-Ausgabe: auf diesem Gemini-API-Pfad nicht unterstützt, da die API PCM statt Opus zurückgibt

So verwenden Sie Google als Standardprovider für TTS:

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
        },
      },
    },
  },
}
```

Gemini-API-TTS akzeptiert ausdrucksstarke Audio-Tags in eckigen Klammern im Text, etwa
`[whispers]` oder `[laughs]`. Um Tags aus der sichtbaren Chat-Antwort herauszuhalten und
sie dennoch an TTS zu senden, platzieren Sie sie in einem Block `[[tts:text]]...[[/tts:text]]`:

```text
Hier ist der saubere Antworttext.

[[tts:text]][whispers] Hier ist die gesprochene Version.[[/tts:text]]
```

<Note>
Ein in der Google Cloud Console auf die Gemini API beschränkter API-Key ist für diesen
Provider gültig. Dies ist nicht der separate Pfad der Cloud Text-to-Speech API.
</Note>

## Realtime-Sprache

Das gebündelte `google`-Plugin registriert einen Realtime-Sprachprovider, der auf der
Gemini Live API basiert, für Backend-Audiobridges wie Voice Call und Google Meet.

| Einstellung            | Konfigurationspfad                                                    | Standard                                                                              |
| ---------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modell                 | `plugins.entries.voice-call.config.realtime.providers.google.model`   | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Stimme                 | `...google.voice`                                                     | `Kore`                                                                                |
| Temperature            | `...google.temperature`                                               | (nicht gesetzt)                                                                       |
| VAD-Startempfindlichkeit | `...google.startSensitivity`                                        | (nicht gesetzt)                                                                       |
| VAD-Endempfindlichkeit | `...google.endSensitivity`                                            | (nicht gesetzt)                                                                       |
| Stilledauer            | `...google.silenceDurationMs`                                         | (nicht gesetzt)                                                                       |
| API-Key                | `...google.apiKey`                                                    | Fällt zurück auf `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY` |

Beispielkonfiguration für Realtime in Voice Call:

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
Die Google Live API verwendet bidirektionales Audio und Function Calling über einen WebSocket.
OpenClaw passt Audio von Telefonie-/Meet-Bridges an Geminis PCM-Live-API-Stream an und
behält Tool-Aufrufe auf dem gemeinsamen Vertrag für Realtime-Sprache. Lassen Sie `temperature`
ungesetzt, sofern Sie keine Änderungen beim Sampling benötigen; OpenClaw lässt nicht positive Werte weg,
weil Google Live für `temperature: 0` Transkripte ohne Audio zurückgeben kann.
Die Transkription der Gemini API ist ohne `languageCodes` aktiviert; das aktuelle Google-
SDK lehnt Sprachcode-Hinweise auf diesem API-Pfad ab.
</Note>

<Note>
Talk-Browsersitzungen in der Control UI erfordern weiterhin einen Realtime-Sprachprovider mit einer
Browser-WebRTC-Sitzungsimplementierung. Heute ist das OpenAI Realtime; der
Google-Provider ist für Backend-Realtime-Bridges gedacht.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Direkte Wiederverwendung des Gemini-Cache">
    Für direkte Gemini-API-Läufe (`api: "google-generative-ai"`) übergibt OpenClaw
    ein konfiguriertes `cachedContent`-Handle an Gemini-Anfragen.

    - Konfigurieren Sie modellbezogene oder globale Parameter entweder mit
      `cachedContent` oder dem Legacy-Wert `cached_content`
    - Wenn beide vorhanden sind, hat `cachedContent` Vorrang
    - Beispielwert: `cachedContents/prebuilt-context`
    - Die Gemini-Cache-Treffernutzung wird in OpenClaw als `cacheRead` aus
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

  <Accordion title="Hinweise zur JSON-Nutzung der Gemini CLI">
    Bei Verwendung des OAuth-Providers `google-gemini-cli` normalisiert OpenClaw
    die JSON-Ausgabe der CLI wie folgt:

    - Der Antworttext stammt aus dem JSON-Feld `response` der CLI.
    - Die Nutzungsdaten fallen auf `stats` zurück, wenn die CLI `usage` leer lässt.
    - `stats.cached` wird in OpenClaw zu `cacheRead` normalisiert.
    - Wenn `stats.input` fehlt, leitet OpenClaw die Eingabetokens aus
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
    Auswahl von Providern, Modell-Referenzen und Failover-Verhalten.
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
