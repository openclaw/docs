---
read_when:
    - Sie möchten Google-Gemini-Modelle mit OpenClaw verwenden.
    - Sie benötigen den Authentifizierungsablauf mit API-Schlüssel oder OAuth.
summary: Einrichtung von Google Gemini (API-Schlüssel + OAuth, Bildgenerierung, Medienverständnis, TTS, Websuche)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-19T01:11:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5e055b02cc51899e11836a882f1f981fedfa5c4dbe42261ac2f2eba5e4d707c
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Das Google-Plugin bietet Zugriff auf Gemini-Modelle über Google AI Studio sowie
Bildgenerierung, Medienverständnis (Bild/Audio/Video), Text-to-Speech und Websuche über
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- API: Google Gemini API
- Alternativer Provider: `google-gemini-cli` (OAuth)

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsanweisungen.

<Tabs>
  <Tab title="API-Schlüssel">
    **Am besten geeignet für:** standardmäßigen Gemini-API-Zugriff über Google AI Studio.

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
    **Am besten geeignet für:** die Wiederverwendung einer vorhandenen Gemini-CLI-Anmeldung über PKCE OAuth statt eines separaten API-Schlüssels.

    <Warning>
    Der Provider `google-gemini-cli` ist eine inoffizielle Integration. Einige Nutzer
    berichten bei der Verwendung von OAuth auf diese Weise von Kontoeinschränkungen. Die Nutzung erfolgt auf eigenes Risiko.
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
        gängiger Windows/npm-Layouts.
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
    Wenn OAuth-Anfragen der Gemini CLI nach der Anmeldung fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder
    `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host und versuchen Sie es erneut.
    </Note>

    <Note>
    Wenn die Anmeldung fehlschlägt, bevor der Browser-Ablauf startet, stellen Sie sicher, dass der lokale Befehl `gemini`
    installiert ist und sich auf `PATH` befindet.
    </Note>

    Der reine OAuth-Provider `google-gemini-cli` ist eine separate Oberfläche für Textinferenz.
    Bildgenerierung, Medienverständnis und Gemini Grounding bleiben beim
    Provider-ID `google`.

  </Tab>
</Tabs>

## Fähigkeiten

| Fähigkeit              | Unterstützt                  |
| ---------------------- | ---------------------------- |
| Chat-Completions       | Ja                           |
| Bildgenerierung        | Ja                           |
| Musikgenerierung       | Ja                           |
| Text-to-Speech         | Ja                           |
| Bildverständnis        | Ja                           |
| Audiotranskription     | Ja                           |
| Videoverständnis       | Ja                           |
| Websuche (Grounding)   | Ja                           |
| Thinking/Reasoning     | Ja (Gemini 2.5+ / Gemini 3+) |
| Gemma-4-Modelle        | Ja                           |

<Tip>
Gemini-3-Modelle verwenden `thinkingLevel` statt `thinkingBudget`. OpenClaw ordnet
Reasoning-Steuerungen für Gemini 3, Gemini 3.1 und den Alias `gemini-*-latest`
`thinkingLevel` zu, sodass Standardläufe und Läufe mit niedriger Latenz keine deaktivierten
`thinkingBudget`-Werte senden.

Gemma-4-Modelle (zum Beispiel `gemma-4-26b-a4b-it`) unterstützen den Thinking-Modus. OpenClaw
schreibt `thinkingBudget` für Gemma 4 in ein unterstütztes Google-`thinkingLevel` um.
Wenn Thinking auf `off` gesetzt wird, bleibt Thinking deaktiviert, statt auf
`MINIMAL` abgebildet zu werden.
</Tip>

## Bildgenerierung

Der gebündelte Provider für Bildgenerierung `google` verwendet standardmäßig
`google/gemini-3.1-flash-image-preview`.

- Unterstützt auch `google/gemini-3-pro-image-preview`
- Generierung: bis zu 4 Bilder pro Anfrage
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
Siehe [Image Generation](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Videogenerierung

Das gebündelte Plugin `google` registriert auch Videogenerierung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `google/veo-3.1-fast-generate-preview`
- Modi: Text-zu-Video, Bild-zu-Video und Referenzabläufe mit einem einzelnen Video
- Unterstützt `aspectRatio`, `resolution` und `audio`
- Aktuelle Dauerbegrenzung: **4 bis 8 Sekunden**

So verwenden Sie Google als Standard-Provider für Video:

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
- Unterstützt auch `google/lyria-3-pro-preview`
- Prompt-Steuerungen: `lyrics` und `instrumental`
- Ausgabeformat: standardmäßig `mp3`, zusätzlich `wav` bei `google/lyria-3-pro-preview`
- Referenzeingaben: bis zu 10 Bilder
- Sitzungsbasierte Läufe werden über den gemeinsamen Aufgaben-/Statusablauf entkoppelt, einschließlich `action: "status"`

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
Siehe [Music Generation](/de/tools/music-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Text-to-Speech

Der gebündelte Speech-Provider `google` verwendet den TTS-Pfad der Gemini API mit
`gemini-3.1-flash-tts-preview`.

- Standardstimme: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- Ausgabe: WAV für reguläre TTS-Anhänge, PCM für Talk/Telefonie
- Native Sprachnotiz-Ausgabe: auf diesem Gemini-API-Pfad nicht unterstützt, da die API PCM statt Opus zurückgibt

So verwenden Sie Google als Standard-Provider für TTS:

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

Die Gemini-API für TTS akzeptiert ausdrucksstarke Audio-Tags in eckigen Klammern im Text, wie etwa
`[whispers]` oder `[laughs]`. Damit Tags nicht in der sichtbaren Chat-Antwort erscheinen, aber
an TTS gesendet werden, platzieren Sie sie in einem Block `[[tts:text]]...[[/tts:text]]`:

```text
Hier ist der saubere Antworttext.

[[tts:text]][whispers] Hier ist die gesprochene Version.[[/tts:text]]
```

<Note>
Ein auf die Gemini API eingeschränkter API-Schlüssel aus der Google Cloud Console ist für diesen
Provider gültig. Dies ist nicht der separate Pfad der Cloud-Text-to-Speech-API.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Direkte Wiederverwendung des Gemini-Cache">
    Bei direkten Gemini-API-Läufen (`api: "google-generative-ai"`) übergibt OpenClaw
    einen konfigurierten `cachedContent`-Handle an Gemini-Anfragen.

    - Konfigurieren Sie pro Modell oder global Parameter mit entweder
      `cachedContent` oder dem Legacy-Wert `cached_content`
    - Wenn beide vorhanden sind, hat `cachedContent` Vorrang
    - Beispielwert: `cachedContents/prebuilt-context`
    - Die Gemini-Cache-Hit-Nutzung wird in OpenClaw als `cacheRead` normalisiert aus
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

    - Der Antworttext stammt aus dem CLI-JSON-Feld `response`.
    - Die Nutzungsdaten fallen auf `stats` zurück, wenn die CLI `usage` leer lässt.
    - `stats.cached` wird in OpenClaw als `cacheRead` normalisiert.
    - Wenn `stats.input` fehlt, leitet OpenClaw Eingabetoken aus
      `stats.input_tokens - stats.cached` ab.

  </Accordion>

  <Accordion title="Einrichtung von Umgebung und Daemon">
    Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `GEMINI_API_KEY`
    diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
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
