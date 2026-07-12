---
read_when:
    - Text-to-Speech für Antworten aktivieren
    - Konfigurieren eines TTS-Providers, einer Fallback-Kette oder einer Persona
    - Verwendung von /tts-Befehlen oder -Direktiven
sidebarTitle: Text to speech (TTS)
summary: Text-to-Speech für ausgehende Antworten — Provider, Personas, Slash-Befehle und kanalspezifische Ausgabe
title: Sprachausgabe
x-i18n:
    generated_at: "2026-07-12T16:00:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 908679a0386da75577a2445dfcafecc746d124ffe04816c6f2d6eb74af232edd
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw wandelt ausgehende Antworten über **14 Sprach-Provider** in Audio um:
native Sprachnachrichten auf Feishu, Matrix, Telegram und WhatsApp; Audioanhänge
überall sonst; sowie PCM/Ulaw-Streams für Telefonie und Talk.

TTS ist die Sprachausgabehälfte des `stt-tts`-Modus von Talk (`talk.speak` ruft
denselben Synthesepfad auf). Provider-native `realtime`-Talk-Sitzungen
synthetisieren Sprache stattdessen innerhalb des Echtzeit-Providers;
`transcription`-Sitzungen synthetisieren niemals eine Sprachantwort des
Assistenten.

## Schnellstart

<Steps>
  <Step title="Provider auswählen">
    OpenAI und ElevenLabs sind die zuverlässigsten gehosteten Optionen.
    Microsoft und die lokale CLI funktionieren ohne API-Schlüssel. Die
    vollständige Liste finden Sie in der [Provider-Matrix](#supported-providers).
  </Step>
  <Step title="API-Schlüssel festlegen">
    Exportieren Sie die Umgebungsvariable für Ihren Provider (zum Beispiel
    `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`). Microsoft und die lokale CLI
    benötigen keinen Schlüssel.
  </Step>
  <Step title="In der Konfiguration aktivieren">
    Legen Sie `messages.tts.auto: "always"` und `messages.tts.provider` fest:

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
    `/tts status` zeigt den aktuellen Status. `/tts audio Hello from OpenClaw`
    sendet eine einmalige Audioantwort.
  </Step>
</Steps>

<Note>
Auto-TTS ist standardmäßig **deaktiviert**. Wenn `messages.tts.provider` nicht
festgelegt ist, wählt OpenClaw den ersten konfigurierten Provider gemäß der
automatischen Auswahlreihenfolge der Registry aus. Das integrierte Agent-Tool
`tts` wird nur bei ausdrücklicher Absicht verwendet: Normale Chats bleiben
Text, sofern der Benutzer nicht um Audio bittet, `/tts` verwendet oder
Auto-TTS beziehungsweise Sprachausgabe per Direktive aktiviert.
</Note>

## Unterstützte Provider

| Provider          | Authentifizierung                                                                                                 | Hinweise                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (auch `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)           | Native Ogg/Opus-Ausgabe für Sprachnachrichten und Telefonie.                                              |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI-kompatibles TTS. Standardmäßig `hexgrad/Kokoro-82M`.                                               |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` oder `XI_API_KEY`                                                                           | Stimmenklonen, mehrsprachig, durch `seed` deterministisch; Streaming für die Sprachwiedergabe in Discord. |
| **Google Gemini** | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                                                                           | Batch-TTS der Gemini API; über `promptTemplate: "audio-profile-v1"` an die Persona angepasst.             |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Ausgabe für Sprachnachrichten und Telefonie.                                                              |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | Streaming-TTS-API. Native Opus-Sprachnachrichten und PCM-Telefonie.                                       |
| **Lokale CLI**    | keine                                                                                                            | Führt einen konfigurierten lokalen TTS-Befehl aus.                                                        |
| **Microsoft**     | keine                                                                                                            | Öffentliches neuronales Edge-TTS über `node-edge-tts`. Nach bestem Bemühen, ohne SLA.                     |
| **MiniMax**       | `MINIMAX_API_KEY` (oder Token-Tarif: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)    | T2A-v2-API. Standardmäßig `speech-2.8-hd`.                                                                |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Wird auch für automatische Zusammenfassungen verwendet; unterstützt Persona-`instructions`.              |
| **OpenRouter**    | `OPENROUTER_API_KEY` (kann `models.providers.openrouter.apiKey` wiederverwenden)                                  | Standardmodell `hexgrad/kokoro-82m`.                                                                      |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` oder `BYTEPLUS_SEED_SPEECH_API_KEY` (alte AppID/Token: `VOLCENGINE_TTS_APPID`/`_TOKEN`)  | BytePlus Seed Speech HTTP API.                                                                            |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Gemeinsamer Provider für Bilder, Videos und Sprache.                                                      |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI-Batch-TTS. Native Opus-Sprachnachrichten werden **nicht** unterstützt.                                |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo-TTS über Xiaomi-Chatvervollständigungen.                                                             |

Wenn mehrere Provider konfiguriert sind, wird zuerst der ausgewählte verwendet;
die anderen dienen als Ausweichoptionen. Die automatische Zusammenfassung
verwendet `summaryModel` (oder `agents.defaults.model.primary`), daher muss
dieser Provider ebenfalls authentifiziert sein, wenn Sie Zusammenfassungen
aktiviert lassen.

<Warning>
Der mitgelieferte **Microsoft**-Provider verwendet den neuronalen Online-TTS-
Dienst von Microsoft Edge über `node-edge-tts`. Es handelt sich um einen
öffentlichen Webdienst ohne veröffentlichte SLA oder Quote – betrachten Sie ihn
als Dienst nach bestem Bemühen. Die alte Provider-ID `edge` wird zu `microsoft`
normalisiert, und `openclaw doctor --fix` schreibt die gespeicherte
Konfiguration um; neue Konfigurationen sollten immer `microsoft` verwenden.
</Warning>

## Konfiguration

Die TTS-Konfiguration befindet sich unter `messages.tts` in
`~/.openclaw/openclaw.json`. Wählen Sie eine Voreinstellung aus und passen Sie
den Provider-Block an. Die unten gezeigten Felder
`speakerVoice`/`speakerVoiceId` sind kanonisch; die providerspezifischen
Feldnamen `voice`/`voiceId`/`voiceName` funktionieren weiterhin als alte
Aliasse.

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
          // Optionale natürlichsprachliche Stilvorgaben:
          // audioProfile: "Sprechen Sie in einem ruhigen Ton wie ein Podcast-Moderator.",
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
  <Tab title="Lokale CLI">
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

Lassen Sie für Xiaomi `mimo-v2.5-tts-voicedesign` das Feld `speakerVoice` weg
und setzen Sie `style` auf die Vorgabe für die Stimmgestaltung. OpenClaw sendet
diese Vorgabe als TTS-`user`-Nachricht und sendet für das Voicedesign-Modell
kein `audio.voice`.

### Stimmüberschreibungen pro Agent

Verwenden Sie `agents.list[].tts`, wenn ein Agent mit einem anderen Provider,
einer anderen Stimme, einem anderen Modell, einer anderen Persona oder einem anderen Auto-TTS-Modus sprechen soll. Der Agent-Block wird tief mit
`messages.tts` zusammengeführt, sodass die Provider-Zugangsdaten in der globalen Provider-Konfiguration verbleiben können:

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

Um eine Persona pro Agent festzulegen, setzen Sie `agents.list[].tts.persona` neben der Provider-
Konfiguration. Sie überschreibt `messages.tts.persona` global ausschließlich für diesen Agenten.

Prioritätsreihenfolge für automatische Antworten, `/tts audio`, `/tts status` und das
Agentenwerkzeug `tts`:

1. `messages.tts`
2. aktives `agents.list[].tts`
3. Kanalüberschreibung, wenn der Kanal `channels.<channel>.tts` unterstützt
4. Kontoüberschreibung, wenn der Kanal `channels.<channel>.accounts.<id>.tts` übergibt
5. lokale `/tts`-Einstellungen für diesen Host
6. Inline-Direktiven `[[tts:...]]`, wenn [Modellüberschreibungen](#model-driven-directives) aktiviert sind

Kanal- und Kontoüberschreibungen verwenden dieselbe Struktur wie `messages.tts` und
werden tief mit den vorherigen Ebenen zusammengeführt, sodass gemeinsam genutzte Provider-Zugangsdaten in
`messages.tts` verbleiben können, während ein Kanal oder Bot-Konto nur Sprecherstimme, Modell, Persona
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
Provider-übergreifend angewendet werden kann. Sie kann einen Provider bevorzugen, eine Provider-neutrale Prompt-
Absicht definieren und Provider-spezifische Bindungen für Stimmen, Modelle, Prompt-
Vorlagen, Seeds und Stimmeinstellungen enthalten.

### Minimale Persona

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Erzähler",
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
          description: "Trockener, warmherziger britischer Butler-Erzähler.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Ein brillanter britischer Butler. Trocken, geistreich, warmherzig, charmant, emotional ausdrucksstark und niemals beliebig.",
            scene: "Ein ruhiges Arbeitszimmer spät in der Nacht. Nahmikrofon-Erzählung für einen vertrauenswürdigen Bediener.",
            sampleContext: "Der Sprecher beantwortet eine private technische Anfrage mit prägnanter Sicherheit und trockenem Charme.",
            style: "Kultiviert, zurückhaltend, leicht amüsiert.",
            accent: "Britisches Englisch.",
            pacing: "Bedächtig, mit kurzen dramatischen Pausen.",
            constraints: ["Konfigurationswerte nicht laut vorlesen.", "Die Persona nicht erklären."],
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

Bei der Provider-Auswahl haben explizite Angaben Vorrang:

1. Direkte Überschreibungen (CLI, Gateway, Talk, zulässige TTS-Direktiven).
2. Lokale Einstellung `/tts provider <id>`.
3. `provider` der aktiven Persona.
4. `messages.tts.provider`.
5. Automatische Auswahl aus der Registry.

Für jeden Provider-Versuch führt OpenClaw die Konfigurationen in dieser Reihenfolge zusammen:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Vertrauenswürdige Anfrageüberschreibungen
4. Zulässige, vom Modell ausgegebene Überschreibungen durch TTS-Direktiven

### Verwendung von Persona-Prompts durch Provider

Persona-Prompt-Felder (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) sind **Provider-neutral**. Jeder Provider entscheidet selbst, wie
sie verwendet werden:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Umschließt Persona-Prompt-Felder **nur dann** mit einer Gemini-TTS-Prompt-Struktur,
    wenn die effektive Google-Provider-Konfiguration `promptTemplate: "audio-profile-v1"`
    oder `personaPrompt` festlegt. Die älteren Felder `audioProfile` und `speakerName` werden
    weiterhin als Google-spezifischer Prompt-Text vorangestellt. Inline-Audio-Tags wie
    `[whispers]` oder `[laughs]` innerhalb eines `[[tts:text]]`-Blocks bleiben
    im Gemini-Transkript erhalten; OpenClaw erzeugt diese Tags nicht.
  </Accordion>
  <Accordion title="OpenAI">
    Ordnet Persona-Prompt-Felder **nur dann** dem Anfragefeld `instructions` zu,
    wenn keine expliziten OpenAI-`instructions` konfiguriert sind. Explizite `instructions`
    haben immer Vorrang.
  </Accordion>
  <Accordion title="Andere Provider">
    Verwenden ausschließlich die Provider-spezifischen Persona-Bindungen unter
    `personas.<id>.providers.<provider>`. Persona-Prompt-Felder werden ignoriert,
    sofern der Provider keine eigene Zuordnung von Persona-Prompts implementiert.
  </Accordion>
</AccordionGroup>

### Fallback-Richtlinie

`fallbackPolicy` steuert das Verhalten, wenn eine Persona **keine Bindung** für den
versuchten Provider besitzt:

| Richtlinie          | Verhalten                                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **Standard.** Provider-neutrale Prompt-Felder bleiben verfügbar; der Provider kann sie verwenden oder ignorieren.                                               |
| `provider-defaults` | Die Persona wird bei der Prompt-Vorbereitung für diesen Versuch ausgelassen; der Provider verwendet seine neutralen Standardwerte, während der Fallback auf andere Provider fortgesetzt wird. |
| `fail`              | Überspringt diesen Provider-Versuch mit `reasonCode: "not_configured"` und `personaBinding: "missing"`. Fallback-Provider werden weiterhin versucht.             |

Die gesamte TTS-Anfrage schlägt nur fehl, wenn **jeder** versuchte Provider übersprungen
wird oder fehlschlägt.

Die Provider-Auswahl einer Talk-Sitzung gilt jeweils für die Sitzung. Ein Talk-Client sollte
Provider-IDs, Modell-IDs, Stimmen-IDs und Gebietsschemas aus `talk.catalog` auswählen und
sie über die Talk-Sitzungs- oder Übergabeanfrage übergeben. Das Öffnen einer Sprachsitzung sollte
weder `messages.tts` noch globale Standardwerte des Talk-Providers verändern.

## Modellgesteuerte Direktiven

Standardmäßig **kann** der Assistent `[[tts:...]]`-Direktiven ausgeben, um
Stimme, Modell oder Geschwindigkeit für eine einzelne Antwort zu überschreiben, sowie optional einen
`[[tts:text]]...[[/tts:text]]`-Block für Ausdruckshinweise, die nur im
Audio erscheinen sollen:

```text
Hier ist es.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](lacht) Lies das Lied noch einmal.[[/tts:text]]
```

Wenn `messages.tts.auto` auf `"tagged"` gesetzt ist, sind **Direktiven erforderlich**, um
Audio auszulösen. Bei der Streaming-Blockübermittlung werden Direktiven aus dem sichtbaren Text entfernt, bevor der
Kanal ihn erhält, selbst wenn sie auf benachbarte Blöcke verteilt sind.

`provider=...` wird ignoriert, sofern nicht `modelOverrides.allowProvider: true` gesetzt ist. Wenn eine
Antwort `provider=...` deklariert, werden die anderen Schlüssel in dieser Direktive
nur von diesem Provider ausgewertet; nicht unterstützte Schlüssel werden entfernt und als Warnungen zu TTS-
Direktiven gemeldet.

**Verfügbare Direktiven-Schlüssel:**

- `provider` (registrierte Provider-ID; erfordert `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (veraltete Aliasse: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax-Lautstärke, `(0, 10]`)
- `pitch` (ganzzahlige MiniMax-Tonhöhe, −12 bis 12; Nachkommastellen werden abgeschnitten)
- `emotion` (Volcengine-Emotions-Tag)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Modellüberschreibungen vollständig deaktivieren:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Provider-Wechsel zulassen und andere Einstellungen weiterhin konfigurierbar halten:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slash-Befehle

Ein einzelner Befehl: `/tts`. Auf Discord registriert OpenClaw außerdem `/voice`, da
`/tts` ein integrierter Discord-Befehl ist — der Textbefehl `/tts ...` funktioniert weiterhin.

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
Befehle erfordern einen autorisierten Absender (Zulassungsliste-/Eigentümerregeln gelten), und entweder
`commands.text` oder die native Befehlsregistrierung muss aktiviert sein.
</Note>

Hinweise zum Verhalten:

- `/tts on` schreibt die lokale TTS-Einstellung als `always`; `/tts off` schreibt sie als `off`.
- `/tts chat on|off|default` schreibt eine sitzungsbezogene Auto-TTS-Überschreibung für den aktuellen Chat.
- `/tts persona <id>` schreibt die lokale Persona-Einstellung; `/tts persona off` löscht sie.
- `/tts latest` liest die neueste Assistentenantwort aus dem Transkript der aktuellen Sitzung und sendet sie einmalig als Audio. Im Sitzungseintrag wird nur ein Hash dieser Antwort gespeichert, um doppelte Sprachausgaben zu unterdrücken.
- `/tts audio` erzeugt eine einmalige Audioantwort (aktiviert TTS **nicht**).
- `/tts limit <chars>` akzeptiert **100–4096** (4096 ist das Telegram-Maximum für Bildunterschriften/Nachrichten); Werte außerhalb dieses Bereichs werden abgelehnt.
- `limit` und `summary` werden in **lokalen Einstellungen** gespeichert, nicht in der Hauptkonfiguration.
- `/tts status` enthält Fallback-Diagnosen für den letzten Versuch — `Fallback: <primary> -> <used>`, `Attempts: ...` und Details pro Versuch (`provider:outcome(reasonCode) latency`).
- `/status` zeigt bei aktiviertem TTS den aktiven TTS-Modus sowie den konfigurierten Provider, das Modell, die Stimme und bereinigte Metadaten benutzerdefinierter Endpunkte.

## Benutzerspezifische Einstellungen

Slash-Befehle schreiben lokale Überschreibungen nach `prefsPath`. Der Standardwert ist
`~/.openclaw/settings/tts.json`; überschreiben Sie ihn mit der Umgebungsvariable `OPENCLAW_TTS_PREFS`
oder `messages.tts.prefsPath`.

| Gespeichertes Feld | Auswirkung                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `auto`             | Lokale Auto-TTS-Überschreibung (`always`, `off`, …)                                         |
| `provider`         | Lokale Überschreibung des primären Providers                                                |
| `persona`          | Lokale Persona-Überschreibung                                                               |
| `maxLength`        | Schwellenwert für Zusammenfassung/Kürzung (standardmäßig `1500` Zeichen, Bereich für `/tts limit`: 100–4096) |
| `summarize`        | Umschalter für Zusammenfassungen (standardmäßig `true`)                                     |

Diese überschreiben die effektive Konfiguration aus `messages.tts` und dem aktiven
Block `agents.list[].tts` für diesen Host.

## Ausgabeformate

Die TTS-Sprachausgabe richtet sich nach den Fähigkeiten des Kanals. Kanal-Plugins geben an,
ob bei sprachähnlicher TTS von Providern ein natives `voice-note`-Ziel angefordert oder
die normale `audio-file`-Synthese beibehalten werden soll und ob der Kanal
nicht native Ausgaben vor dem Senden transkodiert.

| Ziel                                  | Format                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Feishu / Matrix / Telegram / WhatsApp | Sprachnachrichten-Antworten bevorzugen **Opus** (`opus_48000_64` von ElevenLabs, `opus` von OpenAI). 48 kHz / 64 kbps bieten ein ausgewogenes Verhältnis von Klarheit und Größe. |
| Andere Kanäle                         | **MP3** (`mp3_44100_128` von ElevenLabs, `mp3` von OpenAI). 44.1 kHz / 128 kbps sind die standardmäßige Abstimmung für Sprache.                   |
| Talk / Telefonie                      | Provider-natives **PCM** (Inworld 22050 Hz, Google 24 kHz) oder `ulaw_8000` von Gradium für Telefonie.                                             |

Hinweise nach Provider:

- **Feishu-/WhatsApp-Transkodierung:** Wenn eine Sprachnachrichten-Antwort als MP3/WebM/WAV/M4A oder eine andere wahrscheinliche Audiodatei eingeht, transkodiert das Kanal-Plugin sie vor dem Senden der nativen Sprachnachricht mit `ffmpeg` (`libopus`, 64 kbps) in Ogg/Opus mit 48 kHz. WhatsApp sendet das Ergebnis über die Baileys-`audio`-Nutzlast mit `ptt: true` und `audio/ogg; codecs=opus`. Bei einem Transkodierungsfehler fängt Feishu den Fehler ab und sendet stattdessen die Originaldatei als normalen Anhang; WhatsApp hat keinen Fallback, daher schlägt der Sendevorgang selbst fehl, statt eine inkompatible PTT-Nutzlast zu veröffentlichen.
- **MiniMax:** MP3 (`speech-2.8-hd`-Modell, 32 kHz Abtastrate) für normale Audioanhänge; für vom Kanal angekündigte Sprachnachrichten-Ziele mit `ffmpeg` in Opus mit 48 kHz transkodiert.
- **Xiaomi MiMo:** Standardmäßig MP3 oder bei entsprechender Konfiguration WAV; für vom Kanal angekündigte Sprachnachrichten-Ziele mit `ffmpeg` in Opus mit 48 kHz transkodiert.
- **Lokale CLI:** Verwendet das konfigurierte `outputFormat`. Sprachnachrichten-Ziele werden in Ogg/Opus und Telefonieausgaben mit `ffmpeg` in rohes Mono-PCM mit 16 kHz konvertiert.
- **Google Gemini:** Gibt rohes PCM mit 24 kHz zurück. OpenClaw verpackt es für Audioanhänge als WAV, transkodiert es für Sprachnachrichten-Ziele in Opus mit 48 kHz und gibt für Talk/Telefonie direkt PCM zurück.
- **Gradium:** WAV für Audioanhänge, Opus für Sprachnachrichten-Ziele und `ulaw_8000` mit 8 kHz für Telefonie.
- **Inworld:** MP3 für normale Audioanhänge, natives `OGG_OPUS` für Sprachnachrichten-Ziele und rohes `PCM` mit 22050 Hz für Talk/Telefonie.
- **xAI:** Standardmäßig MP3; `responseFormat` kann `mp3`, `wav`, `pcm`, `mulaw` oder `alaw` sein. Verwendet den Batch-REST-TTS-Endpunkt von xAI und gibt einen vollständigen Audioanhang zurück; der Streaming-TTS-WebSocket von xAI wird in diesem Provider-Pfad nicht verwendet. Das native Opus-Sprachnachrichtenformat wird nicht unterstützt.
- **Microsoft:** Verwendet `microsoft.outputFormat` (Standard `audio-24khz-48kbitrate-mono-mp3`).
  - Der mitgelieferte Transport akzeptiert ein `outputFormat`, aber nicht alle Formate sind beim Dienst verfügbar.
  - Die Werte für das Ausgabeformat entsprechen den Microsoft-Speech-Ausgabeformaten (einschließlich Ogg/WebM Opus).
  - Telegram `sendVoice` akzeptiert OGG/MP3/M4A; verwenden Sie OpenAI/ElevenLabs, wenn Sie garantierte Opus-Sprachnachrichten benötigen.
  - Wenn das konfigurierte Microsoft-Ausgabeformat fehlschlägt, versucht OpenClaw es erneut mit MP3.
  - Wenn keine explizite Stimmüberschreibung festgelegt ist und die englische Standardstimme verwendet wird, wechselt OpenClaw automatisch zu einer chinesischen neuronalen Stimme (`zh-CN-XiaoxiaoNeural`, Gebietsschema `zh-CN`), wenn der Antworttext überwiegend aus CJK-Zeichen besteht.

Die Ausgabeformate von OpenAI und ElevenLabs sind wie oben aufgeführt je Kanal fest vorgegeben.

## Verhalten von Auto-TTS

Wenn `messages.tts.auto` aktiviert ist, führt OpenClaw Folgendes aus:

- Überspringt TTS, wenn die Antwort bereits strukturierte Medien enthält.
- Überspringt sehr kurze Antworten (unter 10 Zeichen).
- Fasst lange Antworten zusammen, wenn Zusammenfassungen aktiviert sind, und verwendet dabei
  `summaryModel` (oder `agents.defaults.model.primary`).
- Hängt die erzeugte Audiodatei an die Antwort an.
- Sendet im Modus `mode: "final"` weiterhin reines Audio-TTS für gestreamte abschließende Antworten,
  nachdem der Textstream abgeschlossen ist; die erzeugten Medien durchlaufen dieselbe
  Mediennormalisierung des Kanals wie normale Antwortanhänge.

Wenn die Antwort `maxLength` überschreitet, überspringt OpenClaw die Audioausgabe niemals vollständig:

- **Zusammenfassung aktiviert** (Standard) und ein Zusammenfassungsmodell ist verfügbar: Fasst den
  Text auf ungefähr `maxLength` Zeichen zusammen und synthetisiert anschließend die Zusammenfassung.
- **Zusammenfassung deaktiviert**, die Zusammenfassung schlägt fehl oder für das
  Zusammenfassungsmodell ist kein API-Schlüssel verfügbar: Kürzt den Text auf `maxLength` Zeichen und synthetisiert den
  gekürzten Text.

```text
Antwort -> TTS aktiviert?
  nein -> Text senden
  ja   -> enthält Medien / kurz?
          ja   -> Text senden
          nein -> Länge > Grenzwert?
                   nein -> TTS -> Audio anhängen
                   ja   -> Zusammenfassung aktiviert und verfügbar?
                            nein -> kürzen -> TTS -> Audio anhängen
                            ja   -> zusammenfassen -> TTS -> Audio anhängen
```

## Feldreferenz

<AccordionGroup>
  <Accordion title="Oberste Ebene messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Auto-TTS-Modus. `inbound` sendet Audio nur nach einer eingehenden Sprachnachricht; `tagged` sendet Audio nur, wenn die Antwort `[[tts:...]]`-Direktiven oder einen `[[tts:text]]`-Block enthält.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Veralteter Schalter. `openclaw doctor --fix` migriert diesen zu `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` umfasst zusätzlich zu abschließenden Antworten auch Tool-/Blockantworten.
    </ParamField>
    <ParamField path="provider" type="string">
      ID des Sprach-Providers. Wenn nicht festgelegt, verwendet OpenClaw den ersten konfigurierten Provider in der automatischen Auswahlreihenfolge der Registry. Das veraltete `provider: "edge"` wird durch `openclaw doctor --fix` in `"microsoft"` umgeschrieben.
    </ParamField>
    <ParamField path="persona" type="string">
      ID der aktiven Persona aus `personas`. Wird in Kleinbuchstaben normalisiert.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Stabile gesprochene Identität. Felder: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Siehe [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Kostengünstiges Modell für die automatische Zusammenfassung; standardmäßig `agents.defaults.model.primary`. Akzeptiert `provider/model` oder einen konfigurierten Modellalias.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Ermöglicht dem Modell, TTS-Direktiven auszugeben. `enabled` ist standardmäßig `true`; `allowProvider` ist standardmäßig `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Provider-eigene Einstellungen, verschlüsselt nach der ID des Sprach-Providers. Veraltete direkte Blöcke (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) werden durch `openclaw doctor --fix` umgeschrieben; committen Sie nur `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      Harte Obergrenze für TTS-Eingabezeichen. `/tts audio`, `tts.convert` und `tts.speak` schlagen bei Überschreitung fehl.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      Zeitüberschreitung der Anfrage in Millisekunden. Ein aufrufbezogenes `timeoutMs` (Agent-Tool, Gateway) hat Vorrang, wenn es festgelegt ist; andernfalls hat ein explizit konfiguriertes `messages.tts.timeoutMs` Vorrang vor allen vom Plugin festgelegten Provider-Standardwerten.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Überschreibt den lokalen JSON-Pfad für Einstellungen (Provider/Grenzwert/Zusammenfassung). Standard `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Umgebung: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` oder `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Azure-Speech-Region (z. B. `eastus`). Umgebung: `AZURE_SPEECH_REGION` oder `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Optionale Überschreibung des Azure-Speech-Endpunkts (Alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName der Azure-Stimme. Standard `en-US-JennyNeural`. Veralteter Alias: `voice`.</ParamField>
    <ParamField path="lang" type="string">SSML-Sprachcode. Standard `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure-`X-Microsoft-OutputFormat` für Standardaudio. Standard `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure-`X-Microsoft-OutputFormat` für Sprachnachrichtenausgaben. Standard `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Verwendet ersatzweise `ELEVENLABS_API_KEY` oder `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Modell-ID. Standard `eleven_multilingual_v2`. Veraltete IDs `eleven_turbo_v2_5`/`eleven_turbo_v2` werden auf das entsprechende `flash`-Modell normalisiert.</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs-Stimmen-ID. Standard `pMsXgVXv3BLzUgSXRplE`. Veralteter Alias: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (jeweils `0..1`, Standardwerte `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false`, Standard `true`), `speed` (`0.5..2.0`, Standard `1.0`).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Textnormalisierungsmodus.</ParamField>
    <ParamField path="languageCode" type="string">2-stelliger ISO 639-1-Code (z. B. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Ganzzahl `0..4294967295` für bestmöglichen Determinismus.</ParamField>
    <ParamField path="baseUrl" type="string">Überschreibt die Basis-URL der ElevenLabs-API.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Verwendet ersatzweise `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Wenn nicht angegeben, kann TTS vor dem Fallback auf die Umgebung `models.providers.google.apiKey` wiederverwenden.</ParamField>
    <ParamField path="model" type="string">Gemini-TTS-Modell. Standard `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Name einer vorgefertigten Gemini-Stimme. Standard `Kore`. Veraltete Aliase: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Stil-Prompt in natürlicher Sprache, der dem gesprochenen Text vorangestellt wird.</ParamField>
    <ParamField path="speakerName" type="string">Optionale Sprecherbezeichnung, die dem gesprochenen Text vorangestellt wird, wenn Ihr Prompt einen benannten Sprecher verwendet.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Auf `audio-profile-v1` setzen, um die Prompt-Felder der aktiven Persona in eine deterministische Gemini-TTS-Prompt-Struktur einzubetten.</ParamField>
    <ParamField path="personaPrompt" type="string">Zusätzlicher Google-spezifischer Persona-Prompt-Text, der an die Regieanweisungen der Vorlage angehängt wird.</ParamField>
    <ParamField path="baseUrl" type="string">Nur `https://generativelanguage.googleapis.com` wird akzeptiert.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Umgebung: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">HTTPS-URL der Gradium-API auf `api.gradium.ai`. Standard `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standard Emma (`YTpq7expH9539ERJ`). Veralteter Alias: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld primär

    <ParamField path="apiKey" type="string">Umgebungsvariable: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standardwert: `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Standardwert: `inworld-tts-1.5-max`. Ebenfalls verfügbar: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standardwert: `Sarah`. Veralteter Alias: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Sampling-Temperatur `0..2` (0 ausgeschlossen).</ParamField>

  </Accordion>

  <Accordion title="Lokale CLI (tts-local-cli)">
    <ParamField path="command" type="string">Lokale ausführbare Datei oder Befehlszeichenfolge für CLI-TTS.</ParamField>
    <ParamField path="args" type="string[]">Befehlsargumente. Unterstützt die Platzhalter `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Erwartetes CLI-Ausgabeformat. Standardwert für Audioanhänge: `mp3`.</ParamField>
    <ParamField path="timeoutMs" type="number">Zeitüberschreitung des Befehls in Millisekunden. Standardwert: `120000`.</ParamField>
    <ParamField path="cwd" type="string">Optionales Arbeitsverzeichnis des Befehls.</ParamField>
    <ParamField path="env" type="Record<string, string>">Optionale Umgebungsüberschreibungen für den Befehl.</ParamField>

    Die Standardausgabe des Befehls sowie generierte oder konvertierte Audiodaten sind auf 50 MiB begrenzt. Die diagnostische Standardfehlerausgabe ist auf 1 MiB begrenzt. OpenClaw beendet den Befehl und lässt die Synthese fehlschlagen, wenn eines der Limits überschritten wird.

  </Accordion>

  <Accordion title="Microsoft (kein API-Schlüssel)">
    <ParamField path="enabled" type="boolean" default="true">Nutzung der Microsoft-Sprachausgabe zulassen.</ParamField>
    <ParamField path="speakerVoice" type="string">Name der neuronalen Microsoft-Stimme (z. B. `en-US-MichelleNeural`). Veralteter Alias: `voice`. Wenn die englische Standardstimme verwendet wird und der Antworttext überwiegend aus CJK-Zeichen besteht, wechselt OpenClaw automatisch zu `zh-CN-XiaoxiaoNeural`.</ParamField>
    <ParamField path="lang" type="string">Sprachcode (z. B. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft-Ausgabeformat. Standardwert: `audio-24khz-48kbitrate-mono-mp3`. Der mitgelieferte Edge-basierte Transport unterstützt nicht alle Formate.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Prozentangaben als Zeichenfolgen (z. B. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">JSON-Untertitel neben die Audiodatei schreiben.</ParamField>
    <ParamField path="proxy" type="string">Proxy-URL für Microsoft-Sprachanfragen.</ParamField>
    <ParamField path="timeoutMs" type="number">Überschreibung der Anfragezeitüberschreitung (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Veralteter Alias. Führen Sie `openclaw doctor --fix` aus, um die gespeicherte Konfiguration in `providers.microsoft` umzuschreiben.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Greift ersatzweise auf `MINIMAX_API_KEY` zurück. Token-Plan-Authentifizierung über `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` oder `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standardwert: `https://api.minimax.io`. Umgebungsvariable: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Standardwert: `speech-2.8-hd`. Umgebungsvariable: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standardwert: `English_expressive_narrator`. Umgebungsvariable: `MINIMAX_TTS_VOICE_ID`. Veralteter Alias: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Standardwert: `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Standardwert: `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Ganzzahl `-12..12`. Standardwert: `0`. Nachkommastellen werden vor der Anfrage abgeschnitten.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Greift ersatzweise auf `OPENAI_API_KEY` zurück.</ParamField>
    <ParamField path="model" type="string">OpenAI-TTS-Modell-ID. Standardwert: `gpt-4o-mini-tts`.</ParamField>
    <ParamField path="speakerVoice" type="string">Stimmenname (z. B. `alloy`, `cedar`). Standardwert: `coral`. Veralteter Alias: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Explizites OpenAI-Feld `instructions`. Wenn es festgelegt ist, werden Persona-Prompt-Felder **nicht** automatisch zugeordnet.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Zusätzliche JSON-Felder, die nach den generierten OpenAI-TTS-Feldern in die Anfragetexte für `/audio/speech` eingefügt werden. Verwenden Sie dies für OpenAI-kompatible Endpunkte wie Kokoro, die Provider-spezifische Schlüssel wie `lang` erfordern; unsichere Prototypschlüssel werden ignoriert.</ParamField>
    <ParamField path="baseUrl" type="string">
      Überschreibt den OpenAI-TTS-Endpunkt. Auflösungsreihenfolge: Konfiguration → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Nicht standardmäßige Werte werden als OpenAI-kompatible TTS-Endpunkte behandelt, sodass benutzerdefinierte Modell- und Stimmennamen akzeptiert werden und die Bereichsprüfung `0.25..4.0` für `speed` entfällt.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Umgebungsvariable: `OPENROUTER_API_KEY`. Kann `models.providers.openrouter.apiKey` wiederverwenden.</ParamField>
    <ParamField path="baseUrl" type="string">Standardwert: `https://openrouter.ai/api/v1`. Das veraltete `https://openrouter.ai/v1` wird normalisiert.</ParamField>
    <ParamField path="model" type="string">Standardwert: `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Standardwert: `af_alloy`. Veraltete Aliasse: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Standardwert: `mp3`.</ParamField>
    <ParamField path="speed" type="number">Provider-native Überschreibung der Geschwindigkeit.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Umgebungsvariable: `VOLCENGINE_TTS_API_KEY` oder `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Standardwert: `seed-tts-1.0`. Umgebungsvariable: `VOLCENGINE_TTS_RESOURCE_ID`. Verwenden Sie `seed-tts-2.0`, wenn Ihr Projekt über eine TTS-2.0-Berechtigung verfügt.</ParamField>
    <ParamField path="appKey" type="string">App-Schlüssel-Header. Standardwert: `aGjiRDfUWi`. Umgebungsvariable: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Überschreibt den Seed-Speech-TTS-HTTP-Endpunkt. Umgebungsvariable: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Stimmentyp. Standardwert: `en_female_anna_mars_bigtts`. Umgebungsvariable: `VOLCENGINE_TTS_VOICE`. Veralteter Alias: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Provider-natives Geschwindigkeitsverhältnis, `0.2..3`.</ParamField>
    <ParamField path="emotion" type="string">Provider-natives Emotions-Tag.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Veraltete Felder der Volcengine Speech Console. Umgebungsvariablen: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (Standardwert: `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Umgebungsvariable: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standardwert: `https://api.x.ai/v1`. Umgebungsvariable: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standardwert: `eve`. Mit Authentifizierung ruft `openclaw infer tts voices --provider xai` den aktuellen integrierten Katalog ab; ohne Authentifizierung werden die Offline-Ersatzwerte `ara`, `eve`, `leo`, `rex` und `sal` aufgeführt. Benutzerdefinierte Stimmen-IDs des Kontos werden auch dann weitergeleitet, wenn sie nicht in der integrierten Liste enthalten sind. Veralteter Alias: `voiceId`.</ParamField>
    <ParamField path="language" type="string">BCP-47-Sprachcode oder `auto`. Standardwert: `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Standardwert: `mp3`.</ParamField>
    <ParamField path="speed" type="number">Provider-native Überschreibung der Geschwindigkeit, `0.7..1.5`.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Umgebungsvariable: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standardwert: `https://api.xiaomimimo.com/v1`. Umgebungsvariable: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Standardwert: `mimo-v2.5-tts`. Umgebungsvariable: `XIAOMI_TTS_MODEL`. Unterstützt außerdem `mimo-v2-tts` und `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Standardwert für Modelle mit voreingestellten Stimmen: `mimo_default`. Umgebungsvariable: `XIAOMI_TTS_VOICE`. Veralteter Alias: `voice`. Wird für `mimo-v2.5-tts-voicedesign` nicht gesendet.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Standardwert: `mp3`. Umgebungsvariable: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Optionale natürlichsprachliche Stilanweisung, die als Benutzernachricht gesendet, aber nicht gesprochen wird. Bei `mimo-v2.5-tts-voicedesign` ist dies der Prompt für das Stimmendesign; OpenClaw stellt einen Standardwert bereit, wenn die Angabe fehlt.</ParamField>
  </Accordion>
</AccordionGroup>

## Agenten-Tool

Das Tool `tts` wandelt Text in Sprache um und gibt einen Audioanhang für die
Antwortzustellung zurück. Bei Feishu, Matrix, Telegram und WhatsApp wird das
Audio als Sprachnachricht statt als Dateianhang zugestellt. Feishu und
WhatsApp können auf diesem Pfad TTS-Ausgaben, die nicht im Opus-Format vorliegen,
transkodieren, wenn `ffmpeg` verfügbar ist.

WhatsApp sendet Audio über Baileys als PTT-Sprachnachricht (`audio` mit
`ptt: true`) und sendet sichtbaren Text **separat** vom PTT-Audio, da
Clients Untertitel bei Sprachnachrichten nicht einheitlich darstellen.

Das Tool akzeptiert die optionalen Felder `channel` und `timeoutMs`; `timeoutMs` ist eine
Provider-Anfragezeitüberschreitung pro Aufruf in Millisekunden. Werte pro Aufruf überschreiben
`messages.tts.timeoutMs`; konfigurierte TTS-Zeitüberschreitungen überschreiben alle von Plugins festgelegten
Provider-Standardwerte.

## Gateway-RPC

| Methode           | Zweck                                                |
| ----------------- | ---------------------------------------------------- |
| `tts.status`      | Aktuellen TTS-Status und letzten Versuch auslesen.   |
| `tts.enable`      | Lokale automatische Einstellung auf `always` setzen. |
| `tts.disable`     | Lokale automatische Einstellung auf `off` setzen.    |
| `tts.convert`     | Einmalige Umwandlung von Text → Audio.                |
| `tts.setProvider` | Lokale Provider-Einstellung festlegen.                |
| `tts.personas`    | Konfigurierte Personas und die aktive auflisten.      |
| `tts.setPersona`  | Lokale Persona-Einstellung festlegen.                 |
| `tts.providers`   | Konfigurierte Provider und deren Status auflisten.    |

## Service-Links

- [OpenAI-Leitfaden zur Sprachsynthese](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI-Audio-API-Referenz](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST-Sprachsynthese](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure-Speech-Provider](/de/providers/azure-speech)
- [ElevenLabs-Sprachsynthese](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs-Authentifizierung](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/de/providers/gradium)
- [Inworld-TTS-API](https://docs.inworld.ai/tts/tts)
- [MiniMax-T2A-v2-API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine-TTS-HTTP-API](/de/providers/volcengine#text-to-speech)
- [Xiaomi-MiMo-Sprachsynthese](/de/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft-Speech-Ausgabeformate](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI-Sprachsynthese](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Verwandte Themen

- [Medienübersicht](/de/tools/media-overview)
- [Musikgenerierung](/de/tools/music-generation)
- [Videogenerierung](/de/tools/video-generation)
- [Slash-Befehle](/de/tools/slash-commands)
- [Plugin für Sprachanrufe](/de/plugins/voice-call)
