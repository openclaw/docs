---
read_when:
    - Sie möchten Google-Gemini-Modelle mit OpenClaw verwenden
    - Sie benötigen den API-Schlüssel oder den OAuth-Authentifizierungsablauf
summary: Google-Gemini-Einrichtung (API-Schlüssel + OAuth, Bilderzeugung, Medienverständnis, TTS, Websuche)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-12T15:47:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

Das Google-Plugin ermöglicht den Zugriff auf Gemini-Modelle über Google AI Studio sowie Bildgenerierung, Medienverständnis (Bild/Audio/Video), Text-to-Speech und Websuche über Gemini Grounding.

- Provider: `google`
- Authentifizierung: `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- API: Google Gemini API
- Laufzeitoption: `agentRuntime.id: "google-gemini-cli"` verwendet Gemini-CLI-OAuth erneut, während die Modellreferenzen weiterhin kanonisch als `google/*` geführt werden.

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und führen Sie die Einrichtungsschritte aus.

<Tabs>
  <Tab title="API-Schlüssel">
    **Am besten geeignet für:** standardmäßigen Gemini-API-Zugriff über Google AI Studio.

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
      <Step title="Verfügbarkeit des Modells überprüfen">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Sowohl `GEMINI_API_KEY` als auch `GOOGLE_API_KEY` werden akzeptiert. Verwenden Sie die bereits von Ihnen konfigurierte Variable.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Am besten geeignet für:** die Wiederverwendung einer vorhandenen Gemini-CLI-Anmeldung über PKCE-OAuth anstelle eines separaten API-Schlüssels.

    <Warning>
    Der Provider `google-gemini-cli` ist eine inoffizielle Integration. Einige Benutzer
    berichten von Kontoeinschränkungen bei dieser Verwendung von OAuth. Die Nutzung erfolgt auf eigenes Risiko.
    </Warning>

    <Steps>
      <Step title="Gemini CLI installieren">
        Der lokale Befehl `gemini` muss über `PATH` verfügbar sein.

        ```bash
        # Homebrew
        brew install gemini-cli

        # oder npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw unterstützt sowohl Homebrew-Installationen als auch globale npm-Installationen, einschließlich
        gängiger Windows-/npm-Verzeichnisstrukturen.
      </Step>
      <Step title="Über OAuth anmelden">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verfügbarkeit des Modells überprüfen">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Standardmodell: `google/gemini-3.1-pro-preview`
    - Laufzeit: `google-gemini-cli`
    - Alias: `gemini-cli`

    Die Gemini-API-Modell-ID von Gemini 3.1 Pro lautet `gemini-3.1-pro-preview`. OpenClaw akzeptiert der Einfachheit halber die kürzere Form `google/gemini-3.1-pro` als Alias und normalisiert sie vor Provider-Aufrufen.

    **Umgebungsvariablen:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Wenn Gemini-CLI-OAuth-Anfragen nach der Anmeldung fehlschlagen, legen Sie `GOOGLE_CLOUD_PROJECT` oder
    `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host fest und versuchen Sie es erneut.
    </Note>

    <Note>
    Wenn die Anmeldung vor dem Start des Browser-Ablaufs fehlschlägt, stellen Sie sicher, dass der lokale Befehl `gemini`
    installiert und über `PATH` verfügbar ist.
    </Note>

    `google-gemini-cli/*`-Modellreferenzen sind ältere Kompatibilitätsaliasse. Neue
    Konfigurationen sollten `google/*`-Modellreferenzen zusammen mit der Laufzeit `google-gemini-cli`
    verwenden, wenn die lokale Ausführung über die Gemini CLI gewünscht ist.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` wurde am 2026-03-09 eingestellt; verwenden Sie stattdessen `google/gemini-3.1-pro-preview`. Wenn Sie die Einrichtung des Gemini-API-Schlüssels erneut ausführen (`openclaw onboard --auth-choice gemini-api-key` oder `openclaw models auth login --provider google`), wird ein veraltetes konfiguriertes Standardmodell durch das aktuelle Modell ersetzt.
</Note>

## Funktionen

| Funktion               | Unterstützt                    |
| ---------------------- | ------------------------------ |
| Chat-Vervollständigungen | Ja                           |
| Bildgenerierung        | Ja                             |
| Musikgenerierung       | Ja                             |
| Text-to-Speech         | Ja                             |
| Echtzeitsprachübertragung | Ja (Google Live API)        |
| Bildverständnis        | Ja                             |
| Audiotranskription     | Ja                             |
| Videoverständnis       | Ja                             |
| Websuche (Grounding)   | Ja                             |
| Denken/Schlussfolgern  | Ja (Gemini 2.5+ / Gemini 3+)   |
| Gemma-4-Modelle        | Ja                             |

## Websuche

Der gebündelte Websuch-Provider `gemini` verwendet Gemini Google Search Grounding.
Konfigurieren Sie einen dedizierten Suchschlüssel unter `plugins.entries.google.config.webSearch`,
oder lassen Sie nach `GEMINI_API_KEY` den Wert aus `models.providers.google.apiKey` wiederverwenden:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional, wenn GEMINI_API_KEY oder models.providers.google.apiKey festgelegt ist
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // greift ersatzweise auf models.providers.google.baseUrl zurück
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

Bei den Anmeldedaten gilt folgende Priorität: zuerst der dedizierte Wert `webSearch.apiKey`, dann `GEMINI_API_KEY`
und anschließend `models.providers.google.apiKey`. `webSearch.baseUrl` ist optional und
für Betreiber-Proxys oder kompatible Gemini-API-Endpunkte vorgesehen; wenn der Wert nicht angegeben wird,
verwendet die Gemini-Websuche `models.providers.google.baseUrl` erneut. Weitere Informationen zum providerspezifischen Werkzeugverhalten finden Sie unter
[Gemini-Suche](/de/tools/gemini-search).

<Tip>
Gemini-3-Modelle verwenden `thinkingLevel` statt `thinkingBudget`. OpenClaw ordnet
die Steuerelemente für das Schlussfolgern von Gemini 3, Gemini 3.1 und `gemini-*-latest`-Aliasen
`thinkingLevel` zu, damit standardmäßige bzw. latenzarme Ausführungen keine deaktivierten
`thinkingBudget`-Werte senden.

`/think adaptive` behält die dynamische Denksemantik von Google bei, anstatt
eine feste OpenClaw-Stufe auszuwählen. Gemini 3 und Gemini 3.1 lassen ein festes `thinkingLevel` weg, sodass
Google die Stufe auswählen kann; Gemini 2.5 sendet Googles dynamischen Sentinelwert
`thinkingBudget: -1`.

Gemma-4-Modelle (beispielsweise `gemma-4-26b-a4b-it`) unterstützen den Denkmodus. OpenClaw
ersetzt `thinkingBudget` für Gemma 4 durch ein unterstütztes Google-`thinkingLevel`.
Wenn Denken auf `off` gesetzt wird, bleibt es deaktiviert, statt auf
`MINIMAL` abgebildet zu werden.

Gemini 2.5 Pro funktioniert nur im Denkmodus und lehnt ein explizites
`thinkingBudget: 0` ab; OpenClaw entfernt diesen Wert bei Anfragen an Gemini 2.5 Pro,
anstatt ihn zu senden.
</Tip>

## Bildgenerierung

Der gebündelte Bildgenerierungs-Provider `google` verwendet standardmäßig
`google/gemini-3.1-flash-image-preview`.

- Unterstützt außerdem `google/gemini-3-pro-image-preview`
- Generierung: bis zu 4 Bilder pro Anfrage
- Bearbeitungsmodus: aktiviert, bis zu 5 Eingabebilder
- Geometriesteuerung: `size`, `aspectRatio` und `resolution`

So verwenden Sie Google als standardmäßigen Bild-Provider:

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
Weitere Informationen zu gemeinsamen Werkzeugparametern, zur Provider-Auswahl und zum Failover-Verhalten finden Sie unter [Bildgenerierung](/de/tools/image-generation).
</Note>

## Videogenerierung

Das gebündelte `google`-Plugin registriert außerdem die Videogenerierung über das gemeinsame
Werkzeug `video_generate`.

- Standardvideomodell: `google/veo-3.1-fast-generate-preview`
- Modi: Text-zu-Video, Bild-zu-Video und Abläufe mit einer einzelnen Videoreferenz
- Unterstützt `aspectRatio` (`16:9`, `9:16`) und `resolution` (`720P`, `1080P`); die Audioausgabe wird derzeit von Veo nicht unterstützt
- Unterstützte Dauern: **4, 6 oder 8 Sekunden** (andere Werte werden auf den nächstgelegenen zulässigen Wert gesetzt)

So verwenden Sie Google als standardmäßigen Video-Provider:

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
Weitere Informationen zu gemeinsamen Werkzeugparametern, zur Provider-Auswahl und zum Failover-Verhalten finden Sie unter [Videogenerierung](/de/tools/video-generation).
</Note>

## Musikgenerierung

Das gebündelte `google`-Plugin registriert außerdem die Musikgenerierung über das gemeinsame
Werkzeug `music_generate`.

- Standardmusikmodell: `google/lyria-3-clip-preview`
- Unterstützt außerdem `google/lyria-3-pro-preview`
- Prompt-Steuerung: `lyrics` und `instrumental`
- Ausgabeformat: standardmäßig `mp3`, zusätzlich `wav` bei `google/lyria-3-pro-preview`
- Referenzeingaben: bis zu 10 Bilder
- Sitzungsgestützte Ausführungen werden über den gemeinsamen Task-/Status-Ablauf abgekoppelt, einschließlich `action: "status"`

So verwenden Sie Google als standardmäßigen Musik-Provider:

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
Weitere Informationen zu gemeinsamen Werkzeugparametern, zur Provider-Auswahl und zum Failover-Verhalten finden Sie unter [Musikgenerierung](/de/tools/music-generation).
</Note>

## Text-to-Speech

Der gebündelte Sprach-Provider `google` verwendet den TTS-Pfad der Gemini API mit
`gemini-3.1-flash-tts-preview`.

- Standardstimme: `Kore`
- Authentifizierung: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- Ausgabe: WAV für reguläre TTS-Anhänge, Opus für Sprachnotiz-Ziele, PCM für Talk/Telefonie
- Sprachnotiz-Ausgabe: Google-PCM wird als WAV verpackt und mit `ffmpeg` in Opus mit 48 kHz transkodiert

Der Batch-Gemini-TTS-Pfad von Google gibt das generierte Audio in der abgeschlossenen
`generateContent`-Antwort zurück. Verwenden Sie für gesprochene Unterhaltungen mit niedrigster Latenz den
Echtzeitsprach-Provider von Google auf Basis der Gemini Live API anstelle von Batch-
TTS.

So verwenden Sie Google als standardmäßigen TTS-Provider:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Sprechen Sie professionell und in einem ruhigen Ton.",
        },
      },
    },
  },
}
```

Gemini-API-TTS verwendet natürlichsprachliche Prompts zur Stilsteuerung. Legen Sie
`audioProfile` fest, um dem gesprochenen Text einen wiederverwendbaren Stil-Prompt voranzustellen. Legen Sie
`speakerName` fest, wenn Ihr Prompt-Text auf einen benannten Sprecher verweist.

Gemini-API-TTS akzeptiert außerdem ausdrucksstarke Audio-Tags in eckigen Klammern im Text,
beispielsweise `[whispers]` oder `[laughs]`. Um die Tags aus der sichtbaren Chat-Antwort
herauszuhalten, sie aber an TTS zu senden, platzieren Sie sie in einem `[[tts:text]]...[[/tts:text]]`-
Block:

```text
Hier ist der unveränderte Antworttext.

[[tts:text]][whispers] Hier ist die gesprochene Version.[[/tts:text]]
```

<Note>
Ein auf die Gemini API beschränkter API-Schlüssel aus der Google Cloud Console ist für diesen
Provider gültig. Dies ist nicht der separate API-Pfad von Cloud Text-to-Speech.
</Note>

## Echtzeitsprachübertragung

Das gebündelte `google`-Plugin registriert einen Echtzeitsprach-Provider auf Basis der
Gemini Live API für Backend-Audiobrücken wie Voice Call und Google Meet.

| Einstellung                    | Konfigurationspfad                                                   | Standardwert                                                                          |
| ------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modell                         | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-3.1-flash-live-preview`                                                       |
| Stimme                         | `...google.voice`                                                    | `Kore`                                                                                |
| Temperatur                     | `...google.temperature`                                              | (nicht festgelegt)                                                                    |
| VAD-Empfindlichkeit beim Start | `...google.startSensitivity`                                         | (nicht festgelegt)                                                                    |
| VAD-Empfindlichkeit beim Ende  | `...google.endSensitivity`                                           | (nicht festgelegt)                                                                    |
| Stilledauer                    | `...google.silenceDurationMs`                                        | (nicht festgelegt)                                                                    |
| Aktivitätsverarbeitung         | `...google.activityHandling`                                         | Google-Standardwert, `start-of-activity-interrupts`                                   |
| Abdeckung des Gesprächsbeitrags | `...google.turnCoverage`                                            | Google-Standardwert, `audio-activity-and-all-video`                                   |
| Automatische VAD deaktivieren  | `...google.automaticActivityDetectionDisabled`                       | `false`                                                                               |
| Sitzungsfortsetzung            | `...google.sessionResumption`                                        | `true`                                                                                |
| Kontextkomprimierung           | `...google.contextWindowCompression`                                 | `true`                                                                                |
| API-Schlüssel                  | `...google.apiKey`                                                   | Fällt auf `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY` zurück |

Beispiel für eine Echtzeitkonfiguration für Sprachanrufe:

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
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
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
Die Google Live API verwendet bidirektionales Audio und Funktionsaufrufe über einen WebSocket.
OpenClaw passt das Audio der Telefonie-/Meet-Bridge an den PCM-Live-API-Stream von Gemini an und
belässt Tool-Aufrufe im gemeinsamen Vertrag für Echtzeitsprachkommunikation. Lassen Sie `temperature`
nicht festgelegt, sofern Sie keine Änderungen am Sampling benötigen; OpenClaw lässt nicht positive Werte
weg, da Google Live bei `temperature: 0` Transkripte ohne Audio zurückgeben kann.
Die Transkription der Gemini API wird ohne `languageCodes` aktiviert; das aktuelle Google
SDK lehnt Hinweise auf Sprachcodes in diesem API-Pfad ab.
</Note>

<Note>
Gemini 3.1 Live akzeptiert Konversationstext über Echtzeiteingaben und verwendet
sequenzielle Funktionsaufrufe. OpenClaw lässt für dieses Modell die älteren Felder
`NON_BLOCKING`, die Planung von Funktionsantworten und Felder für affektive Dialoge weg. Bevorzugen Sie
`thinkingLevel`; konfigurierte positive `thinkingBudget`-Werte werden der
nächstgelegenen unterstützten Stufe zugeordnet, während `-1` den Google-Standardwert beibehält. Siehe den
[Vergleich der Funktionen von Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
Control UI Talk unterstützt Google-Live-Browsersitzungen mit eingeschränkten Einmal-
Tokens. Reine Backend-Provider für Echtzeitsprachkommunikation können auch über den generischen
Gateway-Relay-Transport ausgeführt werden, der die Provider-Zugangsdaten auf dem Gateway belässt.
</Note>

Führen Sie zur Live-Verifizierung durch Maintainer
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` aus.
Der Smoke-Test deckt außerdem die Backend-/WebRTC-Pfade von OpenAI ab; der Google-Teil stellt dieselbe
Form eines eingeschränkten Live-API-Tokens aus, die von Control UI Talk verwendet wird, öffnet den
WebSocket-Endpunkt des Browsers, sendet die anfängliche Einrichtungsnutzlast und wartet auf
`setupComplete`.

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Direkte Wiederverwendung des Gemini-Caches">
    Bei direkten Ausführungen der Gemini API (`api: "google-generative-ai"`) übergibt OpenClaw
    ein konfiguriertes `cachedContent`-Handle an Gemini-Anfragen.

    - Konfigurieren Sie Parameter pro Modell oder global entweder mit
      `cachedContent` oder dem veralteten `cached_content`.
    - Parameter aus einem spezifischeren Gültigkeitsbereich (Modellebene vor globaler Ebene) haben stets Vorrang.
      Wenn innerhalb desselben Gültigkeitsbereichs beide Schlüssel festgelegt sind, hat `cached_content` Vorrang.
      Verwenden Sie nur einen Schlüssel pro Gültigkeitsbereich, um Überraschungen zu vermeiden.
    - Beispielwert: `cachedContents/prebuilt-context`
    - Die Nutzung bei Gemini-Cache-Treffern wird aus dem vorgelagerten
      `cachedContentTokenCount` in OpenClaw als `cacheRead` normalisiert.

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

  <Accordion title="Hinweise zur Verwendung der Gemini CLI">
    Bei Verwendung des OAuth-Providers `google-gemini-cli` verwendet OpenClaw standardmäßig die
    `stream-json`-Ausgabe der Gemini CLI und normalisiert die Nutzung anhand der abschließenden
    `stats`-Nutzlast. Veraltete Überschreibungen mit `--output-format json` verwenden weiterhin den
    JSON-Parser.

    - Gestreamter Antworttext stammt aus `message`-Ereignissen des Assistenten.
    - Bei der veralteten JSON-Ausgabe stammt der Antworttext aus dem Feld `response` im CLI-JSON.
    - Die Nutzung fällt auf `stats` zurück, wenn die CLI `usage` leer lässt.
    - `stats.cached` wird in OpenClaw als `cacheRead` normalisiert.
    - Wenn `stats.input` fehlt, leitet OpenClaw die Eingabe-Tokens aus
      `stats.input_tokens - stats.cached` ab.

  </Accordion>

  <Accordion title="Umgebungs- und Daemon-Einrichtung">
    Wenn der Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass
    `GEMINI_API_KEY` für diesen Prozess verfügbar ist (beispielsweise in `~/.openclaw/.env` oder über
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Bilderzeugung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bild-Tools und Provider-Auswahl.
  </Card>
  <Card title="Videoerzeugung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="Musikerzeugung" href="/de/tools/music-generation" icon="music">
    Gemeinsame Parameter des Musik-Tools und Provider-Auswahl.
  </Card>
</CardGroup>
