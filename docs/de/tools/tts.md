---
read_when:
    - Text-to-Speech für Antworten aktivieren
    - Konfigurieren eines TTS-Providers, einer Fallback-Kette oder einer Persona
    - Verwenden von /tts-Befehlen oder -Direktiven
sidebarTitle: Text to speech (TTS)
summary: Text-to-Speech für ausgehende Antworten — Provider, Personas, Slash-Commands und kanalbezogene Ausgabe
title: Text-zu-Sprache
x-i18n:
    generated_at: "2026-06-27T18:22:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 94835daf766286e937c57828818a4ee0a20e6d5894b7d51d6f98fc7ebdaffe35
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw kann ausgehende Antworten über **14 Speech-Provider** in Audio umwandeln
und native Sprachnachrichten in Feishu, Matrix, Telegram und WhatsApp,
Audioanhänge überall sonst sowie PCM/Ulaw-Streams für Telefonie und Talk ausliefern.

TTS ist die Sprachausgabe-Hälfte von Talks `stt-tts`-Modus. Provider-native
`realtime`-Talk-Sitzungen synthetisieren Sprache innerhalb des Realtime-Providers,
statt diesen TTS-Pfad aufzurufen, während `transcription`-Sitzungen keine
Sprachantwort des Assistenten synthetisieren.

## Schnellstart

<Steps>
  <Step title="Provider auswählen">
    OpenAI und ElevenLabs sind die zuverlässigsten gehosteten Optionen. Microsoft und
    Local CLI funktionieren ohne API-Schlüssel. Die vollständige Liste finden Sie in der
    [Provider-Matrix](#supported-providers).
  </Step>
  <Step title="API-Schlüssel setzen">
    Exportieren Sie die Umgebungsvariable für Ihren Provider (zum Beispiel `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft und Local CLI benötigen keinen Schlüssel.
  </Step>
  <Step title="In der Konfiguration aktivieren">
    Setzen Sie `messages.tts.auto: "always"` und `messages.tts.provider`:

    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "elevenlabs",
        },
      },
    }
    ```

  </Step>
  <Step title="Im Chat ausprobieren">
    `/tts status` zeigt den aktuellen Zustand. `/tts audio Hello from OpenClaw`
    sendet eine einmalige Audioantwort.
  </Step>
</Steps>

<Note>
Auto-TTS ist standardmäßig **ausgeschaltet**. Wenn `messages.tts.provider` nicht gesetzt ist,
wählt OpenClaw den ersten konfigurierten Provider in der Auto-Select-Reihenfolge der Registry.
Das integrierte Agent-Tool `tts` ist nur für explizite Absichten gedacht: Gewöhnlicher Chat bleibt
Text, es sei denn, der Benutzer fragt nach Audio, verwendet `/tts` oder aktiviert Auto-TTS/Direktiv-
Sprache.
</Note>

## Unterstützte Provider

| Provider          | Authentifizierung                                                                                                             | Hinweise                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (auch `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | Native Ogg/Opus-Sprachnotiz-Ausgabe und Telefonie.                                            |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI-kompatibles TTS. Standardmäßig `hexgrad/Kokoro-82M`.                                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` oder `XI_API_KEY`                                                                             | Voice Cloning, mehrsprachig, deterministisch über `seed`; gestreamt für Discord-Sprachwiedergabe. |
| **Google Gemini** | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                                                                             | Gemini-API-Batch-TTS; persona-bewusst über `promptTemplate: "audio-profile-v1"`.               |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Sprachnotiz- und Telefonieausgabe.                                                            |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | Streaming-TTS-API. Native Opus-Sprachnotiz und PCM-Telefonie.                                |
| **Local CLI**     | keine                                                                                                             | Führt einen konfigurierten lokalen TTS-Befehl aus.                                                        |
| **Microsoft**     | keine                                                                                                             | Öffentliches neuronales Edge-TTS über `node-edge-tts`. Best-Effort, kein SLA.                            |
| **MiniMax**       | `MINIMAX_API_KEY` (oder Token-Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | T2A-v2-API. Standardmäßig `speech-2.8-hd`.                                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Wird auch für automatische Zusammenfassungen verwendet; unterstützt Persona-`instructions`.                                |
| **OpenRouter**    | `OPENROUTER_API_KEY` (kann `models.providers.openrouter.apiKey` wiederverwenden)                                            | Standardmodell `hexgrad/kokoro-82m`.                                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` oder `BYTEPLUS_SEED_SPEECH_API_KEY` (alte AppID/Token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API.                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Gemeinsamer Bild-, Video- und Speech-Provider.                                                   |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI-Batch-TTS. Native Opus-Sprachnotizen werden **nicht** unterstützt.                                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo-TTS über Xiaomi Chat Completions.                                                   |

Wenn mehrere Provider konfiguriert sind, wird der ausgewählte zuerst verwendet und die
anderen dienen als Fallback-Optionen. Die automatische Zusammenfassung verwendet `summaryModel` (oder
`agents.defaults.model.primary`), daher muss dieser Provider ebenfalls authentifiziert sein,
wenn Sie Zusammenfassungen aktiviert lassen.

<Warning>
Der gebündelte **Microsoft**-Provider verwendet den Online-Dienst für neuronales TTS
von Microsoft Edge über `node-edge-tts`. Es handelt sich um einen öffentlichen Webdienst ohne veröffentlichtes
SLA oder Kontingent — behandeln Sie ihn als Best-Effort. Die alte Provider-ID `edge` wird
zu `microsoft` normalisiert, und `openclaw doctor --fix` schreibt persistierte
Konfiguration um; neue Konfigurationen sollten immer `microsoft` verwenden.
</Warning>

## Konfiguration

Die TTS-Konfiguration befindet sich unter `messages.tts` in `~/.openclaw/openclaw.json`. Wählen Sie ein
Preset und passen Sie den Provider-Block an:

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          speakerVoice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          speakerVoiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          speakerVoiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft (kein Schlüssel)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
          model: "speech-2.8-hd",
          speakerVoiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          speakerVoice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          speakerVoiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

Für Xiaomi `mimo-v2.5-tts-voicedesign` lassen Sie `speakerVoice` weg und setzen Sie `style` auf
den Voice-Design-Prompt. OpenClaw sendet diesen Prompt als TTS-`user`-Nachricht
und sendet für das Voicedesign-Modell kein `audio.voice`.

### Sprachüberschreibungen pro Agent

Verwenden Sie `agents.list[].tts`, wenn ein Agent mit einem anderen Provider,
einer anderen Stimme, einem anderen Modell, einer anderen Persona oder einem anderen Auto-TTS-Modus sprechen soll. Der Agent-Block wird per Deep Merge über
`messages.tts` gelegt, sodass Provider-Anmeldedaten in der globalen Provider-Konfiguration bleiben können:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Um eine Persona pro Agent festzulegen, setzen Sie `agents.list[].tts.persona` zusammen mit der Provider-Konfiguration — sie überschreibt die globale `messages.tts.persona` nur für diesen Agent.

Prioritätsreihenfolge für automatische Antworten, `/tts audio`, `/tts status` und das
Agent-Tool `tts`:

1. `messages.tts`
2. aktives `agents.list[].tts`
3. Kanal-Override, wenn der Kanal `channels.<channel>.tts` unterstützt
4. Konto-Override, wenn der Kanal `channels.<channel>.accounts.<id>.tts` übergibt
5. lokale `/tts`-Einstellungen für diesen Host
6. Inline-Direktiven `[[tts:...]]`, wenn [modellgesteuerte Overrides](#model-driven-directives) aktiviert sind

Kanal- und Konto-Overrides verwenden dieselbe Struktur wie `messages.tts` und
werden per Deep Merge über die früheren Ebenen gelegt, sodass gemeinsame Provider-Anmeldedaten in
`messages.tts` bleiben können, während ein Kanal oder Bot-Konto nur Sprecherstimme, Modell, Persona
oder Auto-Modus ändert:

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { speakerVoice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Personas

Eine **Persona** ist eine stabile gesprochene Identität, die deterministisch
über Provider hinweg angewendet werden kann. Sie kann einen Provider bevorzugen, eine Provider-neutrale Prompt-Absicht definieren und Provider-spezifische Bindungen für Stimmen, Modelle, Prompt-Vorlagen, Seeds und Stimmeinstellungen tragen.

### Minimale Persona

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

### Vollständige Persona (Provider-neutraler Prompt)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### Persona-Auflösung

Die aktive Persona wird deterministisch ausgewählt:

1. Lokale Einstellung `/tts persona <id>`, falls gesetzt.
2. `messages.tts.persona`, falls gesetzt.
3. Keine Persona.

Die Provider-Auswahl läuft nach dem Prinzip „explizit zuerst“:

1. Direkte Overrides (CLI, Gateway, Talk, zulässige TTS-Direktiven).
2. Lokale Einstellung `/tts provider <id>`.
3. `provider` der aktiven Persona.
4. `messages.tts.provider`.
5. Automatische Auswahl aus der Registry.

Für jeden Provider-Versuch führt OpenClaw Konfigurationen in dieser Reihenfolge zusammen:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Vertrauenswürdige Request-Overrides
4. Zulässige vom Modell ausgegebene TTS-Direktiven-Overrides

### Wie Provider Persona-Prompts verwenden

Persona-Prompt-Felder (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) sind **Provider-neutral**. Jeder Provider entscheidet selbst, wie
er sie verwendet:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Schließt Persona-Prompt-Felder in eine Gemini-TTS-Prompt-Struktur ein, **nur wenn**
    die effektive Google-Provider-Konfiguration `promptTemplate: "audio-profile-v1"`
    oder `personaPrompt` setzt. Die älteren Felder `audioProfile` und `speakerName` werden
    weiterhin als Google-spezifischer Prompt-Text vorangestellt. Inline-Audio-Tags wie
    `[whispers]` oder `[laughs]` innerhalb eines `[[tts:text]]`-Blocks bleiben
    im Gemini-Transkript erhalten; OpenClaw generiert diese Tags nicht.
  </Accordion>
  <Accordion title="OpenAI">
    Ordnet Persona-Prompt-Felder dem Request-Feld `instructions` zu, **nur wenn**
    keine expliziten OpenAI-`instructions` konfiguriert sind. Explizite `instructions`
    haben immer Vorrang.
  </Accordion>
  <Accordion title="Andere Provider">
    Verwenden nur die Provider-spezifischen Persona-Bindungen unter
    `personas.<id>.providers.<provider>`. Persona-Prompt-Felder werden ignoriert,
    sofern der Provider keine eigene Persona-Prompt-Zuordnung implementiert.
  </Accordion>
</AccordionGroup>

### Fallback-Richtlinie

`fallbackPolicy` steuert das Verhalten, wenn eine Persona **keine Bindung** für den
versuchten Provider hat:

| Richtlinie          | Verhalten                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Standard.** Provider-neutrale Prompt-Felder bleiben verfügbar; der Provider kann sie verwenden oder ignorieren.                                |
| `provider-defaults` | Die Persona wird für diesen Versuch bei der Prompt-Vorbereitung ausgelassen; der Provider verwendet seine neutralen Standardwerte, während der Fallback auf andere Provider fortgesetzt wird. |
| `fail`              | Überspringt diesen Provider-Versuch mit `reasonCode: "not_configured"` und `personaBinding: "missing"`. Fallback-Provider werden weiterhin versucht. |

Die gesamte TTS-Anfrage schlägt nur fehl, wenn **jeder** versuchte Provider übersprungen wird
oder fehlschlägt.

Die Provider-Auswahl für Talk-Sitzungen ist sitzungsbezogen. Ein Talk-Client sollte
Provider-IDs, Modell-IDs, Stimmen-IDs und Locales aus `talk.catalog` auswählen und
sie über die Talk-Sitzung oder Handoff-Anfrage übergeben. Das Öffnen einer Sprachsitzung sollte
`messages.tts` oder globale Talk-Provider-Standardwerte nicht verändern.

## Modellgesteuerte Direktiven

Standardmäßig **kann** der Assistent `[[tts:...]]`-Direktiven ausgeben, um
Stimme, Modell oder Geschwindigkeit für eine einzelne Antwort zu überschreiben, plus einen optionalen
`[[tts:text]]...[[/tts:text]]`-Block für ausdrucksstarke Hinweise, die nur im
Audio erscheinen sollen:

```text
Here you go.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Wenn `messages.tts.auto` auf `"tagged"` gesetzt ist, **sind Direktiven erforderlich**, um
Audio auszulösen. Die Streaming-Blockzustellung entfernt Direktiven aus sichtbarem Text, bevor der
Kanal sie sieht, auch wenn sie über benachbarte Blöcke verteilt sind.

`provider=...` wird ignoriert, sofern nicht `modelOverrides.allowProvider: true` gesetzt ist. Wenn eine
Antwort `provider=...` deklariert, werden die anderen Schlüssel in dieser Direktive
nur von diesem Provider geparst; nicht unterstützte Schlüssel werden entfernt und als TTS-Direktiven-Warnungen gemeldet.

**Verfügbare Direktiven-Schlüssel:**

- `provider` (registrierte Provider-ID; erfordert `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (Legacy-Aliasse: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax-Lautstärke, 0–10)
- `pitch` (MiniMax-Ganzzahltonhöhe, −12 bis 12; Dezimalwerte werden abgeschnitten)
- `emotion` (Volcengine-Emotionstag)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Modell-Overrides vollständig deaktivieren:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Provider-Wechsel erlauben, während andere Regler konfigurierbar bleiben:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slash-Befehle

Einzelner Befehl `/tts`. Auf Discord registriert OpenClaw außerdem `/voice`, weil
`/tts` ein integrierter Discord-Befehl ist — Text `/tts ...` funktioniert weiterhin.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
Befehle erfordern einen autorisierten Absender (Allowlist-/Owner-Regeln gelten) und entweder
`commands.text` oder native Befehlsregistrierung muss aktiviert sein.
</Note>

Verhaltenshinweise:

- `/tts on` schreibt die lokale TTS-Einstellung auf `always`; `/tts off` schreibt sie auf `off`.
- `/tts chat on|off|default` schreibt einen sitzungsbezogenen Auto-TTS-Override für den aktuellen Chat.
- `/tts persona <id>` schreibt die lokale Persona-Einstellung; `/tts persona off` löscht sie.
- `/tts latest` liest die neueste Assistentenantwort aus dem aktuellen Sitzungstranskript und sendet sie einmal als Audio. Es speichert nur einen Hash dieser Antwort im Sitzungseintrag, um doppelte Sprachausgaben zu unterdrücken.
- `/tts audio` erzeugt eine einmalige Audio-Antwort (schaltet TTS **nicht** ein).
- `limit` und `summary` werden in **lokalen Einstellungen** gespeichert, nicht in der Hauptkonfiguration.
- `/tts status` enthält Fallback-Diagnosen für den neuesten Versuch — `Fallback: <primary> -> <used>`, `Attempts: ...` und Details pro Versuch (`provider:outcome(reasonCode) latency`).
- `/status` zeigt den aktiven TTS-Modus sowie konfigurierten Provider, Modell, Stimme und bereinigte benutzerdefinierte Endpunkt-Metadaten, wenn TTS aktiviert ist.

## Benutzerspezifische Einstellungen

Slash-Befehle schreiben lokale Overrides nach `prefsPath`. Der Standard ist
`~/.openclaw/settings/tts.json`; überschreiben Sie ihn mit der Umgebungsvariable `OPENCLAW_TTS_PREFS`
oder `messages.tts.prefsPath`.

| Gespeichertes Feld | Wirkung                                      |
| ------------ | -------------------------------------------- |
| `auto`       | Lokaler Auto-TTS-Override (`always`, `off`, …) |
| `provider`   | Lokaler primärer Provider-Override           |
| `persona`    | Lokaler Persona-Override                     |
| `maxLength`  | Zusammenfassungsschwelle (Standard `1500` Zeichen) |
| `summarize`  | Zusammenfassungsumschalter (Standard `true`) |

Diese überschreiben die effektive Konfiguration aus `messages.tts` plus den aktiven
`agents.list[].tts`-Block für diesen Host.

## Ausgabeformate (fest)

Die TTS-Sprachausgabe wird durch Kanal-Fähigkeiten gesteuert. Kanal-Plugins geben an,
ob TTS im Sprachstil Provider nach einem nativen `voice-note`-Ziel fragen soll oder
normale `audio-file`-Synthese beibehalten und kompatible Ausgabe nur für die Sprachzustellung markieren soll.

- **Sprachnotiz-fähige Kanäle**: Sprachnotiz-Antworten bevorzugen Opus (`opus_48000_64` von ElevenLabs, `opus` von OpenAI).
  - 48 kHz / 64 kbps ist ein guter Kompromiss für Sprachnachrichten.
- **Feishu / WhatsApp**: Wenn eine Sprachnotiz-Antwort als MP3/WebM/WAV/M4A
  oder eine andere wahrscheinliche Audiodatei erzeugt wird, transkodiert das Kanal-Plugin sie
  vor dem Senden der nativen Sprachnachricht mit `ffmpeg` zu 48 kHz
  Ogg/Opus. WhatsApp sendet das Ergebnis über die Baileys-`audio`-Payload mit `ptt: true` und
  `audio/ogg; codecs=opus`. Wenn die Konvertierung fehlschlägt, erhält Feishu die ursprüngliche
  Datei als Anhang; der WhatsApp-Versand schlägt fehl, statt eine inkompatible
  PTT-Payload zu posten.
- **Andere Kanäle**: MP3 (`mp3_44100_128` von ElevenLabs, `mp3` von OpenAI).
  - 44,1 kHz / 128 kbps ist die Standardbalance für Sprachklarheit.
- **MiniMax**: MP3 (`speech-2.8-hd`-Modell, 32-kHz-Abtastrate) für normale Audioanhänge. Für vom Kanal angekündigte Sprachnotiz-Ziele transkodiert OpenClaw das MiniMax-MP3 vor der Auslieferung mit `ffmpeg` zu 48 kHz Opus, wenn der Kanal Transkodierung ankündigt.
- **Xiaomi MiMo**: Standardmäßig MP3 oder WAV, wenn konfiguriert. Für vom Kanal angekündigte Sprachnotiz-Ziele transkodiert OpenClaw Xiaomi-Ausgaben vor der Auslieferung mit `ffmpeg` zu 48 kHz Opus, wenn der Kanal Transkodierung ankündigt.
- **Lokale CLI**: Verwendet das konfigurierte `outputFormat`. Sprachnotiz-Ziele werden
  zu Ogg/Opus konvertiert, und Telefonieausgabe wird mit `ffmpeg` zu rohem 16-kHz-Mono-PCM
  konvertiert.
- **Google Gemini**: Gemini API TTS gibt rohes 24-kHz-PCM zurück. OpenClaw verpackt es für Audioanhänge als WAV, transkodiert es für Sprachnotiz-Ziele zu 48 kHz Opus und gibt PCM für Talk/Telefonie direkt zurück.
- **Gradium**: WAV für Audioanhänge, Opus für Sprachnotiz-Ziele und `ulaw_8000` bei 8 kHz für Telefonie.
- **Inworld**: MP3 für normale Audioanhänge, natives `OGG_OPUS` für Sprachnotiz-Ziele und rohes `PCM` bei 22050 Hz für Talk/Telefonie.
- **xAI**: Standardmäßig MP3; `responseFormat` kann `mp3`, `wav`, `pcm`, `mulaw` oder `alaw` sein. OpenClaw verwendet den Batch-REST-TTS-Endpunkt von xAI und gibt einen vollständigen Audioanhang zurück; der Streaming-TTS-WebSocket von xAI wird in diesem Provider-Pfad nicht verwendet. Das native Opus-Sprachnotizformat wird von diesem Pfad nicht unterstützt.
- **Microsoft**: Verwendet `microsoft.outputFormat` (Standard `audio-24khz-48kbitrate-mono-mp3`).
  - Der gebündelte Transport akzeptiert ein `outputFormat`, aber nicht alle Formate sind vom Dienst verfügbar.
  - Ausgabeformatwerte folgen den Microsoft Speech-Ausgabeformaten (einschließlich Ogg/WebM Opus).
  - Telegram `sendVoice` akzeptiert OGG/MP3/M4A; verwenden Sie OpenAI/ElevenLabs, wenn Sie
    garantierte Opus-Sprachnachrichten benötigen.
  - Wenn das konfigurierte Microsoft-Ausgabeformat fehlschlägt, versucht OpenClaw es erneut mit MP3.

OpenAI/ElevenLabs-Ausgabeformate sind pro Kanal festgelegt (siehe oben).

## Auto-TTS-Verhalten

Wenn `messages.tts.auto` aktiviert ist, führt OpenClaw Folgendes aus:

- Überspringt TTS, wenn die Antwort bereits strukturierte Medien enthält.
- Überspringt sehr kurze Antworten (unter 10 Zeichen).
- Fasst lange Antworten zusammen, wenn Zusammenfassungen aktiviert sind, unter Verwendung von
  `summaryModel` (oder `agents.defaults.model.primary`).
- Hängt das generierte Audio an die Antwort an.
- Sendet in `mode: "final"` weiterhin reines Audio-TTS für gestreamte finale Antworten,
  nachdem der Textstream abgeschlossen ist; die generierten Medien durchlaufen dieselbe
  Kanal-Mediennormalisierung wie normale Antwortanhänge.

Wenn die Antwort `maxLength` überschreitet und Zusammenfassung deaktiviert ist (oder kein API-Schlüssel für das
Zusammenfassungsmodell vorhanden ist), wird Audio übersprungen und die normale Textantwort gesendet.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## Ausgabeformate nach Kanal

| Ziel                                  | Format                                                                                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Sprachnotiz-Antworten bevorzugen **Opus** (`opus_48000_64` von ElevenLabs, `opus` von OpenAI). 48 kHz / 64 kbps balanciert Klarheit und Größe. |
| Andere Kanäle                         | **MP3** (`mp3_44100_128` von ElevenLabs, `mp3` von OpenAI). 44,1 kHz / 128 kbps als Standard für Sprache.                              |
| Talk / Telefonie                      | Provider-natives **PCM** (Inworld 22050 Hz, Google 24 kHz) oder `ulaw_8000` von Gradium für Telefonie.                                  |

Hinweise pro Provider:

- **Feishu / WhatsApp-Transkodierung:** Wenn eine Sprachnotiz-Antwort als MP3/WebM/WAV/M4A ankommt, transkodiert das Kanal-Plugin mit `ffmpeg` zu 48 kHz Ogg/Opus. WhatsApp sendet über Baileys mit `ptt: true` und `audio/ogg; codecs=opus`. Wenn die Konvertierung fehlschlägt: Feishu fällt auf das Anhängen der ursprünglichen Datei zurück; der WhatsApp-Versand schlägt fehl, statt eine inkompatible PTT-Payload zu posten.
- **MiniMax / Xiaomi MiMo:** Standardmäßig MP3 (32 kHz für MiniMax `speech-2.8-hd`); für Sprachnotiz-Ziele über `ffmpeg` zu 48 kHz Opus transkodiert.
- **Lokale CLI:** Verwendet das konfigurierte `outputFormat`. Sprachnotiz-Ziele werden zu Ogg/Opus und Telefonieausgabe zu rohem 16-kHz-Mono-PCM konvertiert.
- **Google Gemini:** Gibt rohes 24-kHz-PCM zurück. OpenClaw verpackt es für Anhänge als WAV, transkodiert es für Sprachnotiz-Ziele zu 48 kHz Opus und gibt PCM für Talk/Telefonie direkt zurück.
- **Inworld:** MP3-Anhänge, native `OGG_OPUS`-Sprachnotiz, rohes `PCM` mit 22050 Hz für Talk/Telefonie.
- **xAI:** Standardmäßig MP3; `responseFormat` kann `mp3|wav|pcm|mulaw|alaw` sein. Verwendet den Batch-REST-Endpunkt von xAI — Streaming-WebSocket-TTS wird **nicht** verwendet. Das native Opus-Sprachnotizformat wird **nicht** unterstützt.
- **Microsoft:** Verwendet `microsoft.outputFormat` (Standard `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` akzeptiert OGG/MP3/M4A; verwenden Sie OpenAI/ElevenLabs, wenn Sie garantierte Opus-Sprachnachrichten benötigen. Wenn das konfigurierte Microsoft-Format fehlschlägt, versucht OpenClaw es erneut mit MP3.

OpenAI- und ElevenLabs-Ausgabeformate sind wie oben aufgeführt pro Kanal festgelegt.

## Feldreferenz

<AccordionGroup>
  <Accordion title="Oberste Ebene messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Auto-TTS-Modus. `inbound` sendet Audio nur nach einer eingehenden Sprachnachricht; `tagged` sendet Audio nur, wenn die Antwort `[[tts:...]]`-Direktiven oder einen `[[tts:text]]`-Block enthält.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Veralteter Umschalter. `openclaw doctor --fix` migriert dies zu `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` schließt Tool-/Blockantworten zusätzlich zu finalen Antworten ein.
    </ParamField>
    <ParamField path="provider" type="string">
      Sprach-Provider-ID. Wenn nicht gesetzt, verwendet OpenClaw den ersten konfigurierten Provider in der Auto-Auswahlreihenfolge der Registry. Veraltetes `provider: "edge"` wird von `openclaw doctor --fix` zu `"microsoft"` umgeschrieben.
    </ParamField>
    <ParamField path="persona" type="string">
      Aktive Persona-ID aus `personas`. Wird in Kleinbuchstaben normalisiert.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Stabile gesprochene Identität. Felder: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Siehe [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Günstiges Modell für Auto-Zusammenfassung; standardmäßig `agents.defaults.model.primary`. Akzeptiert `provider/model` oder einen konfigurierten Modellalias.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Erlaubt dem Modell, TTS-Direktiven auszugeben. `enabled` ist standardmäßig `true`; `allowProvider` ist standardmäßig `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Provider-eigene Einstellungen, nach Sprach-Provider-ID indiziert. Veraltete direkte Blöcke (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) werden von `openclaw doctor --fix` umgeschrieben; committen Sie nur `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Harte Obergrenze für TTS-Eingabezeichen. `/tts audio` schlägt fehl, wenn sie überschritten wird.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Anfrage-Timeout in Millisekunden.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Überschreibt den lokalen JSON-Pfad für Einstellungen (Provider/Limit/Zusammenfassung). Standard `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` oder `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Azure Speech-Region (z. B. `eastus`). Env: `AZURE_SPEECH_REGION` oder `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Optionale Azure Speech-Endpunktüberschreibung (Alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">Azure-Stimmen-ShortName. Standard `en-US-JennyNeural`. Veralteter Alias: `voice`.</ParamField>
    <ParamField path="lang" type="string">SSML-Sprachcode. Standard `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` für Standardaudio. Standard `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` für Sprachnotiz-Ausgabe. Standard `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Fällt auf `ELEVENLABS_API_KEY` oder `XI_API_KEY` zurück.</ParamField>
    <ParamField path="model" type="string">Modell-ID (z. B. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs-Stimmen-ID. Veralteter Alias: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (jeweils `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normal).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Textnormalisierungsmodus.</ParamField>
    <ParamField path="languageCode" type="string">2-buchstabiger ISO 639-1-Code (z. B. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Ganzzahl `0..4294967295` für Best-Effort-Determinismus.</ParamField>
    <ParamField path="baseUrl" type="string">Überschreibt die Basis-URL der ElevenLabs API.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Fällt auf `GEMINI_API_KEY` / `GOOGLE_API_KEY` zurück. Wenn weggelassen, kann TTS `models.providers.google.apiKey` vor dem Env-Fallback wiederverwenden.</ParamField>
    <ParamField path="model" type="string">Gemini-TTS-Modell. Standard `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Vorgefertigter Gemini-Stimmenname. Standard `Kore`. Veraltete Aliasse: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Natürlichsprachiger Stil-Prompt, der dem gesprochenen Text vorangestellt wird.</ParamField>
    <ParamField path="speakerName" type="string">Optionale Sprecherbezeichnung, die dem gesprochenen Text vorangestellt wird, wenn Ihr Prompt einen benannten Sprecher verwendet.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Auf `audio-profile-v1` setzen, um aktive Persona-Prompt-Felder in eine deterministische Gemini-TTS-Prompt-Struktur einzubetten.</ParamField>
    <ParamField path="personaPrompt" type="string">Google-spezifischer zusätzlicher Persona-Prompt-Text, der an die Director's Notes der Vorlage angehängt wird.</ParamField>
    <ParamField path="baseUrl" type="string">Nur `https://generativelanguage.googleapis.com` wird akzeptiert.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Umgebung: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standard `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standard Emma (`YTpq7expH9539ERJ`). Legacy-Alias: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Primäres Inworld

    <ParamField path="apiKey" type="string">Umgebung: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standard `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Standard `inworld-tts-1.5-max`. Außerdem: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standard `Sarah`. Legacy-Alias: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Sampling-Temperatur `0..2`.</ParamField>

  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Lokale ausführbare Datei oder Befehlszeichenfolge für CLI-TTS.</ParamField>
    <ParamField path="args" type="string[]">Befehlsargumente. Unterstützt die Platzhalter `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Erwartetes CLI-Ausgabeformat. Standard `mp3` für Audioanhänge.</ParamField>
    <ParamField path="timeoutMs" type="number">Befehls-Timeout in Millisekunden. Standard `120000`.</ParamField>
    <ParamField path="cwd" type="string">Optionales Arbeitsverzeichnis für den Befehl.</ParamField>
    <ParamField path="env" type="Record<string, string>">Optionale Umgebungs-Overrides für den Befehl.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">Microsoft-Sprachnutzung zulassen.</ParamField>
    <ParamField path="speakerVoice" type="string">Name der neuronalen Microsoft-Stimme (z. B. `en-US-MichelleNeural`). Legacy-Alias: `voice`.</ParamField>
    <ParamField path="lang" type="string">Sprachcode (z. B. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft-Ausgabeformat. Standard `audio-24khz-48kbitrate-mono-mp3`. Nicht alle Formate werden vom gebündelten Edge-gestützten Transport unterstützt.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Prozentzeichenfolgen (z. B. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">JSON-Untertitel neben die Audiodatei schreiben.</ParamField>
    <ParamField path="proxy" type="string">Proxy-URL für Microsoft-Sprachanfragen.</ParamField>
    <ParamField path="timeoutMs" type="number">Request-Timeout-Override (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Legacy-Alias. Führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration in `providers.microsoft` umzuschreiben.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Fällt auf `MINIMAX_API_KEY` zurück. Token-Plan-Authentifizierung über `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` oder `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standard `https://api.minimax.io`. Umgebung: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Standard `speech-2.8-hd`. Umgebung: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standard `English_expressive_narrator`. Umgebung: `MINIMAX_TTS_VOICE_ID`. Legacy-Alias: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Standard `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Standard `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Ganzzahl `-12..12`. Standard `0`. Bruchwerte werden vor der Anfrage abgeschnitten.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Fällt auf `OPENAI_API_KEY` zurück.</ParamField>
    <ParamField path="model" type="string">OpenAI-TTS-Modell-ID (z. B. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="speakerVoice" type="string">Stimmenname (z. B. `alloy`, `cedar`). Legacy-Alias: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Explizites OpenAI-Feld `instructions`. Wenn gesetzt, werden Persona-Prompt-Felder **nicht** automatisch zugeordnet.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Zusätzliche JSON-Felder, die nach generierten OpenAI-TTS-Feldern in `/audio/speech`-Request-Bodys zusammengeführt werden. Verwenden Sie dies für OpenAI-kompatible Endpunkte wie Kokoro, die Provider-spezifische Schlüssel wie `lang` erfordern; unsichere Prototypschlüssel werden ignoriert.</ParamField>
    <ParamField path="baseUrl" type="string">
      Überschreibt den OpenAI-TTS-Endpunkt. Auflösungsreihenfolge: Konfiguration → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Nicht standardmäßige Werte werden als OpenAI-kompatible TTS-Endpunkte behandelt, daher werden benutzerdefinierte Modell- und Stimmennamen akzeptiert.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Umgebung: `OPENROUTER_API_KEY`. Kann `models.providers.openrouter.apiKey` wiederverwenden.</ParamField>
    <ParamField path="baseUrl" type="string">Standard `https://openrouter.ai/api/v1`. Legacy `https://openrouter.ai/v1` wird normalisiert.</ParamField>
    <ParamField path="model" type="string">Standard `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Standard `af_alloy`. Legacy-Aliasse: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Standard `mp3`.</ParamField>
    <ParamField path="speed" type="number">Provider-nativer Speed-Override.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Umgebung: `VOLCENGINE_TTS_API_KEY` oder `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Standard `seed-tts-1.0`. Umgebung: `VOLCENGINE_TTS_RESOURCE_ID`. Verwenden Sie `seed-tts-2.0`, wenn Ihr Projekt über eine TTS-2.0-Berechtigung verfügt.</ParamField>
    <ParamField path="appKey" type="string">App-Key-Header. Standard `aGjiRDfUWi`. Umgebung: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Überschreibt den Seed-Speech-TTS-HTTP-Endpunkt. Umgebung: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Stimmentyp. Standard `en_female_anna_mars_bigtts`. Umgebung: `VOLCENGINE_TTS_VOICE`. Legacy-Alias: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Provider-natives Geschwindigkeitsverhältnis.</ParamField>
    <ParamField path="emotion" type="string">Provider-natives Emotions-Tag.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Legacy-Felder der Volcengine Speech Console. Umgebung: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (Standard `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Umgebung: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standard `https://api.x.ai/v1`. Umgebung: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standard `eve`. Live-Stimmen: `ara`, `eve`, `leo`, `rex`, `sal`, `una`. Legacy-Alias: `voiceId`.</ParamField>
    <ParamField path="language" type="string">BCP-47-Sprachcode oder `auto`. Standard `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Standard `mp3`.</ParamField>
    <ParamField path="speed" type="number">Provider-nativer Speed-Override.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Umgebung: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standard `https://api.xiaomimimo.com/v1`. Umgebung: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Standard `mimo-v2.5-tts`. Umgebung: `XIAOMI_TTS_MODEL`. Unterstützt auch `mimo-v2-tts` und `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Standard `mimo_default` für Modelle mit voreingestellter Stimme. Umgebung: `XIAOMI_TTS_VOICE`. Legacy-Alias: `voice`. Wird für `mimo-v2.5-tts-voicedesign` nicht gesendet.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Standard `mp3`. Umgebung: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Optionale natürlichsprachliche Stilanweisung, die als Benutzernachricht gesendet wird; sie wird nicht gesprochen. Für `mimo-v2.5-tts-voicedesign` ist dies der Voice-Design-Prompt; OpenClaw stellt einen Standard bereit, wenn er ausgelassen wird.</ParamField>
  </Accordion>
</AccordionGroup>

## Agent-Tool

Das Tool `tts` wandelt Text in Sprache um und gibt einen Audioanhang für die
Antwortzustellung zurück. In Feishu, Matrix, Telegram und WhatsApp wird das Audio
als Sprachnachricht statt als Dateianhang zugestellt. Feishu und
WhatsApp können auf diesem Pfad Nicht-Opus-TTS-Ausgaben transkodieren, wenn `ffmpeg`
verfügbar ist.

WhatsApp sendet Audio über Baileys als PTT-Sprachnotiz (`audio` mit
`ptt: true`) und sendet sichtbaren Text **separat** von PTT-Audio, da
Clients Beschriftungen für Sprachnotizen nicht durchgängig rendern.

Das Tool akzeptiert optionale Felder `channel` und `timeoutMs`; `timeoutMs` ist ein
Provider-Request-Timeout pro Aufruf in Millisekunden. Werte pro Aufruf überschreiben
`messages.tts.timeoutMs`; konfigurierte TTS-Timeouts überschreiben jeden von Plugins verfassten
Provider-Standard.

## Gateway-RPC

| Methode           | Zweck                                      |
| ----------------- | ------------------------------------------ |
| `tts.status`      | Aktuellen TTS-Zustand und letzten Versuch lesen. |
| `tts.enable`      | Lokale Auto-Präferenz auf `always` setzen. |
| `tts.disable`     | Lokale Auto-Präferenz auf `off` setzen.    |
| `tts.convert`     | Einmalige Umwandlung von Text → Audio.     |
| `tts.setProvider` | Lokale Provider-Präferenz setzen.          |
| `tts.setPersona`  | Lokale Persona-Präferenz setzen.           |
| `tts.providers`   | Konfigurierte Provider und Status auflisten. |

## Service-Links

- [OpenAI-Leitfaden für Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API-Referenz](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST Text-to-Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech-Provider](/de/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs-Authentifizierung](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/de/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/de/providers/volcengine#text-to-speech)
- [Xiaomi MiMo-Sprachsynthese](/de/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech-Ausgabeformate](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text-to-Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Verwandte Themen

- [Medienübersicht](/de/tools/media-overview)
- [Musikgenerierung](/de/tools/music-generation)
- [Videogenerierung](/de/tools/video-generation)
- [Slash-Befehle](/de/tools/slash-commands)
- [Sprachanruf-Plugin](/de/plugins/voice-call)
