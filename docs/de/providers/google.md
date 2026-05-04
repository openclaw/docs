---
read_when:
    - Sie möchten Google Gemini-Modelle mit OpenClaw verwenden
    - Sie benötigen den API-Schlüssel oder den OAuth-Authentifizierungsablauf
summary: Google Gemini einrichten (API-Schlüssel + OAuth, Bilderzeugung, Medienverständnis, TTS, Websuche)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-04T06:43:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e45627f5d5cd57e858c7590a90435b7fc0e9381509f3312a16fc9e9a4cbd908
    source_path: providers/google.md
    workflow: 16
---

Das Google-Plugin bietet Zugriff auf Gemini-Modelle über Google AI Studio sowie
Bilderzeugung, Medienverständnis (Bild/Audio/Video), Text-to-Speech und Websuche über
Gemini Grounding.

- Provider: `google`
- Authentifizierung: `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- API: Google Gemini API
- Runtime-Option: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  verwendet Gemini CLI OAuth wieder, während Modellreferenzen kanonisch als `google/*` beibehalten werden.

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode aus und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="API key">
    **Am besten geeignet für:** Standardzugriff auf die Gemini API über Google AI Studio.

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
    Die Umgebungsvariablen `GEMINI_API_KEY` und `GOOGLE_API_KEY` werden beide akzeptiert. Verwenden Sie diejenige, die Sie bereits konfiguriert haben.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Am besten geeignet für:** Wiederverwendung einer bestehenden Gemini CLI-Anmeldung über PKCE OAuth statt eines separaten API-Schlüssels.

    <Warning>
    Der Provider `google-gemini-cli` ist eine inoffizielle Integration. Einige Benutzer
    berichten von Kontobeschränkungen, wenn OAuth auf diese Weise verwendet wird. Nutzung auf eigenes Risiko.
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

    Die Modell-ID von Gemini 3.1 Pro in der Gemini API lautet `gemini-3.1-pro-preview`. OpenClaw akzeptiert den kürzeren Alias `google/gemini-3.1-pro` als Komfortalias und normalisiert ihn vor Provider-Aufrufen.

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

    `google-gemini-cli/*`-Modellreferenzen sind Legacy-Kompatibilitätsaliasse. Neue
    Konfigurationen sollten `google/*`-Modellreferenzen plus die Runtime `google-gemini-cli`
    verwenden, wenn sie eine lokale Gemini CLI-Ausführung wünschen.

  </Tab>
</Tabs>

## Funktionen

| Funktion               | Unterstützt                  |
| ---------------------- | ----------------------------- |
| Chat-Vervollständigungen | Ja                          |
| Bilderzeugung          | Ja                            |
| Musikerzeugung         | Ja                            |
| Text-to-Speech         | Ja                            |
| Echtzeit-Sprache       | Ja (Google Live API)          |
| Bildverständnis        | Ja                            |
| Audiotranskription     | Ja                            |
| Videoverständnis       | Ja                            |
| Websuche (Grounding)   | Ja                            |
| Thinking/Reasoning     | Ja (Gemini 2.5+ / Gemini 3+) |
| Gemma 4-Modelle        | Ja                            |

## Websuche

Der gebündelte `gemini`-Websuche-Provider verwendet Gemini Google Search Grounding.
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

Die Reihenfolge der Anmeldeinformationen ist zuerst der dedizierte `webSearch.apiKey`, dann `GEMINI_API_KEY`
und dann `models.providers.google.apiKey`. `webSearch.baseUrl` ist optional und
für Betreiber-Proxys oder kompatible Gemini API-Endpunkte vorgesehen; wenn es weggelassen wird,
verwendet die Gemini-Websuche `models.providers.google.baseUrl` wieder. Siehe
[Gemini-Suche](/de/tools/gemini-search) für das Provider-spezifische Tool-Verhalten.

<Tip>
Gemini 3-Modelle verwenden `thinkingLevel` statt `thinkingBudget`. OpenClaw ordnet
Reasoning-Steuerelemente für Gemini 3, Gemini 3.1 und `gemini-*-latest`-Aliasse
`thinkingLevel` zu, damit Standard-/Niedriglatenz-Läufe keine deaktivierten
`thinkingBudget`-Werte senden.

`/think adaptive` behält die dynamische Thinking-Semantik von Google bei, statt
eine feste OpenClaw-Stufe auszuwählen. Gemini 3 und Gemini 3.1 lassen ein festes `thinkingLevel` weg, damit
Google die Stufe wählen kann; Gemini 2.5 sendet Googles dynamischen Sentinel
`thinkingBudget: -1`.

Gemma 4-Modelle (zum Beispiel `gemma-4-26b-a4b-it`) unterstützen den Thinking-Modus. OpenClaw
schreibt `thinkingBudget` in ein unterstütztes Google-`thinkingLevel` für Gemma 4 um.
Wenn Thinking auf `off` gesetzt wird, bleibt Thinking deaktiviert, statt es auf
`MINIMAL` abzubilden.
</Tip>

## Bilderzeugung

Der gebündelte `google`-Provider für Bilderzeugung verwendet standardmäßig
`google/gemini-3.1-flash-image-preview`.

- Unterstützt auch `google/gemini-3-pro-image-preview`
- Erzeugen: bis zu 4 Bilder pro Anfrage
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
Siehe [Bilderzeugung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Videoerzeugung

Das gebündelte `google`-Plugin registriert außerdem Videoerzeugung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `google/veo-3.1-fast-generate-preview`
- Modi: Text-zu-Video, Bild-zu-Video und Einzelvideo-Referenzabläufe
- Unterstützt `aspectRatio`, `resolution` und `audio`
- Aktuelle Dauerbegrenzung: **4 bis 8 Sekunden**

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
Siehe [Videoerzeugung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Musikerzeugung

Das gebündelte `google`-Plugin registriert außerdem Musikerzeugung über das gemeinsame
Tool `music_generate`.

- Standard-Musikmodell: `google/lyria-3-clip-preview`
- Unterstützt auch `google/lyria-3-pro-preview`
- Prompt-Steuerungen: `lyrics` und `instrumental`
- Ausgabeformat: standardmäßig `mp3`, zusätzlich `wav` bei `google/lyria-3-pro-preview`
- Referenzeingaben: bis zu 10 Bilder
- Sitzungsbasierte Läufe koppeln sich über den gemeinsamen Task-/Statusablauf ab, einschließlich `action: "status"`

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
Siehe [Musikerzeugung](/de/tools/music-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Text-to-Speech

Der gebündelte `google`-Sprach-Provider verwendet den TTS-Pfad der Gemini API mit
`gemini-3.1-flash-tts-preview`.

- Standardstimme: `Kore`
- Authentifizierung: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- Ausgabe: WAV für reguläre TTS-Anhänge, Opus für Sprachnotiz-Ziele, PCM für Talk/Telefonie
- Sprachnotiz-Ausgabe: Google-PCM wird als WAV verpackt und mit `ffmpeg` in 48-kHz-Opus transkodiert

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

Gemini API TTS verwendet natürlichsprachliches Prompting zur Stilsteuerung. Setzen Sie
`audioProfile`, um dem gesprochenen Text einen wiederverwendbaren Stil-Prompt voranzustellen. Setzen Sie
`speakerName`, wenn Ihr Prompt-Text auf einen benannten Sprecher verweist.

Gemini API TTS akzeptiert außerdem ausdrucksstarke Audio-Tags in eckigen Klammern im Text,
wie `[whispers]` oder `[laughs]`. Um Tags aus der sichtbaren Chat-Antwort herauszuhalten
und sie trotzdem an TTS zu senden, setzen Sie sie in einen `[[tts:text]]...[[/tts:text]]`-
Block:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Ein auf die Gemini API beschränkter Google Cloud Console-API-Schlüssel ist für diesen
Provider gültig. Dies ist nicht der separate Cloud Text-to-Speech API-Pfad.
</Note>

## Echtzeit-Sprache

Das gebündelte `google`-Plugin registriert einen Echtzeit-Sprach-Provider, der durch die
Gemini Live API für Backend-Audio-Bridges wie Voice Call und Google Meet unterstützt wird.

| Einstellung                       | Konfigurationspfad                                                   | Standardwert                                                                                               |
| --------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Modell                            | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-2.5-flash-native-audio-preview-12-2025`                                                            |
| Stimme                            | `...google.voice`                                                    | `Kore`                                                                                                     |
| Temperatur                        | `...google.temperature`                                              | (nicht gesetzt)                                                                                           |
| VAD-Startempfindlichkeit          | `...google.startSensitivity`                                         | (nicht gesetzt)                                                                                           |
| VAD-Endempfindlichkeit            | `...google.endSensitivity`                                           | (nicht gesetzt)                                                                                           |
| Stilledauer                       | `...google.silenceDurationMs`                                        | (nicht gesetzt)                                                                                           |
| Aktivitätsbehandlung              | `...google.activityHandling`                                         | Google-Standard, `start-of-activity-interrupts`                                                           |
| Turn-Abdeckung                    | `...google.turnCoverage`                                             | Google-Standard, `only-activity`                                                                          |
| Automatische VAD deaktivieren     | `...google.automaticActivityDetectionDisabled`                       | `false`                                                                                                   |
| Sitzungswiederaufnahme            | `...google.sessionResumption`                                        | `true`                                                                                                    |
| Kontextkomprimierung              | `...google.contextWindowCompression`                                 | `true`                                                                                                    |
| API-Schlüssel                     | `...google.apiKey`                                                   | Fällt zurück auf `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                 |

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
Die Google Live API verwendet bidirektionales Audio und Function Calling über einen WebSocket.
OpenClaw passt Audio aus Telefonie-/Meet-Bridges an den PCM-Live-API-Stream von Gemini an und
hält Tool-Aufrufe im gemeinsamen Realtime-Voice-Vertrag. Lassen Sie `temperature`
ungesetzt, sofern Sie keine Änderungen am Sampling benötigen; OpenClaw lässt nicht positive Werte aus,
weil Google Live bei `temperature: 0` Transkripte ohne Audio zurückgeben kann.
Die Transkription der Gemini API wird ohne `languageCodes` aktiviert; das aktuelle Google
SDK lehnt Hinweise auf Sprachcodes auf diesem API-Pfad ab.
</Note>

<Note>
Control UI Talk unterstützt Google-Live-Browsersitzungen mit eingeschränkten Einmal-
Tokens. Nur-Backend-Realtime-Voice-Provider können auch über den generischen
Gateway-Relay-Transport laufen, wodurch Provider-Zugangsdaten auf dem Gateway bleiben.
</Note>

Für die Live-Verifizierung durch Maintainer führen Sie
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` aus.
Der Google-Zweig prägt dieselbe eingeschränkte Live-API-Token-Form, die Control
UI Talk verwendet, öffnet den Browser-WebSocket-Endpunkt, sendet die anfängliche Setup-Nutzlast
und wartet auf `setupComplete`.

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Direkte Wiederverwendung des Gemini-Cache">
    Für direkte Gemini-API-Läufe (`api: "google-generative-ai"`) übergibt OpenClaw
    ein konfiguriertes `cachedContent`-Handle an Gemini-Anfragen.

    - Konfigurieren Sie Parameter pro Modell oder global entweder mit
      `cachedContent` oder dem alten `cached_content`
    - Wenn beide vorhanden sind, gewinnt `cachedContent`
    - Beispielwert: `cachedContents/prebuilt-context`
    - Die Gemini-Nutzung bei Cache-Treffern wird aus dem upstream `cachedContentTokenCount`
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
    - Wenn `stats.input` fehlt, leitet OpenClaw Eingabe-Token aus
      `stats.input_tokens - stats.cached` ab.

  </Accordion>

  <Accordion title="Umgebung und Daemon-Einrichtung">
    Wenn der Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `GEMINI_API_KEY`
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
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Video-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Gemeinsame Musik-Tool-Parameter und Provider-Auswahl.
  </Card>
</CardGroup>
