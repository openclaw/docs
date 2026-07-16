---
read_when:
    - Text-to-Speech für Antworten aktivieren
    - Konfigurieren eines TTS-Providers, einer Fallback-Kette oder einer Persona
    - Verwendung von /tts-Befehlen oder -Direktiven
sidebarTitle: Text to speech (TTS)
summary: Text-to-Speech für ausgehende Antworten — Provider, Personas, Slash-Befehle und kanalspezifische Ausgabe
title: Text-zu-Sprache
x-i18n:
    generated_at: "2026-07-16T13:43:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ba17f56927507a73b5b116f5f13bb7b612b4ba7669f5ad240d5c96a6620c611
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw wandelt ausgehende Antworten über **14 Sprach-Provider** in Audio um:
native Sprachnachrichten auf Feishu, Matrix, Telegram und WhatsApp; Audio-
Anhänge überall sonst sowie PCM/Ulaw-Streams für Telefonie und Talk.

TTS ist die Sprachausgabehälfte des `stt-tts`-Modus von Talk (`talk.speak`-Anrufe verwenden
denselben Synthesepfad). Provider-native `realtime`-Talk-Sitzungen synthetisieren
Sprache stattdessen innerhalb des Echtzeit-Providers; `transcription`-Sitzungen
synthetisieren niemals eine gesprochene Assistentenantwort.

## Schnellstart

<Steps>
  <Step title="Provider auswählen">
    OpenAI und ElevenLabs sind die zuverlässigsten gehosteten Optionen. Microsoft und
    die lokale CLI funktionieren ohne API-Schlüssel. Die vollständige Liste finden Sie in der [Provider-Matrix](#supported-providers).
  </Step>
  <Step title="API-Schlüssel festlegen">
    Exportieren Sie die Umgebungsvariable für Ihren Provider (zum Beispiel `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft und die lokale CLI benötigen keinen Schlüssel.
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
    `/tts status` zeigt den aktuellen Status an. `/tts audio Hello from OpenClaw`
    sendet eine einmalige Audioantwort.
  </Step>
</Steps>

<Note>
Auto-TTS ist standardmäßig **deaktiviert**. Wenn `messages.tts.provider` nicht festgelegt ist,
wählt OpenClaw den ersten konfigurierten Provider gemäß der automatischen Auswahlreihenfolge der Registry aus.
Das integrierte Agent-Tool `tts` reagiert nur auf ausdrückliche Absicht: Gewöhnlicher Chat bleibt
Text, sofern der Benutzer nicht um Audio bittet, `/tts` verwendet oder Auto-TTS bzw. die
Sprachausgabe per Direktive aktiviert.
</Note>

## Unterstützte Provider

| Provider          | Authentifizierung                                                                                               | Hinweise                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (auch `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | Native Sprachnachrichtenausgabe in Ogg/Opus und Telefonie.                                  |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI-kompatibles TTS. Standardmäßig `hexgrad/Kokoro-82M`.                                   |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` oder `XI_API_KEY`                                                                      | Stimmklonen, mehrsprachig, deterministisch über `seed`; für die Sprachwiedergabe in Discord gestreamt. |
| **Google Gemini** | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                                                                      | Batch-TTS der Gemini API; über `promptTemplate: "audio-profile-v1"` an die Persona angepasst.                 |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                              | Sprachnachrichten- und Telefonieausgabe.                                                     |
| **Inworld**       | `INWORLD_API_KEY`                                                                                              | Streaming-TTS-API. Native Opus-Sprachnachrichten und PCM-Telefonie.                         |
| **Lokale CLI**    | keine                                                                                                           | Führt einen konfigurierten lokalen TTS-Befehl aus.                                           |
| **Microsoft**     | keine                                                                                                           | Öffentliches neuronales Edge-TTS über `node-edge-tts`. Ohne Gewähr, kein SLA.            |
| **MiniMax**       | `MINIMAX_API_KEY` (oder Token-Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)                 | T2A-v2-API. Standardmäßig `speech-2.8-hd`.                                                |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                              | Wird auch für automatische Zusammenfassungen verwendet; unterstützt Persona `instructions`. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (kann `models.providers.openrouter.apiKey` wiederverwenden)                                                    | Standardmodell `hexgrad/kokoro-82m`.                                                          |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` oder `BYTEPLUS_SEED_SPEECH_API_KEY` (veraltete AppID/Token: `VOLCENGINE_TTS_APPID`/`_TOKEN`)        | BytePlus Seed Speech HTTP API.                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                              | Gemeinsamer Provider für Bilder, Videos und Sprache.                                         |
| **xAI**           | `XAI_API_KEY`                                                                                              | xAI-Batch-TTS. Native Opus-Sprachnachrichten werden **nicht** unterstützt.                   |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                              | MiMo-TTS über Xiaomi-Chatvervollständigungen.                                                |

Wenn mehrere Provider konfiguriert sind, wird der ausgewählte zuerst verwendet und die
anderen dienen als Fallback-Optionen. Die automatische Zusammenfassung verwendet `summaryModel` (oder
`agents.defaults.model.primary`); daher muss dieser Provider ebenfalls authentifiziert sein,
wenn Zusammenfassungen aktiviert bleiben.

<Warning>
Der gebündelte **Microsoft**-Provider verwendet den neuronalen Online-TTS-Dienst
von Microsoft Edge über `node-edge-tts`. Es handelt sich um einen öffentlichen Webdienst ohne veröffentlichtes
SLA oder Kontingent – behandeln Sie ihn als Dienst ohne Gewähr. Die veraltete Provider-ID `edge` wird
zu `microsoft` normalisiert und `openclaw doctor --fix` schreibt persistierte
Konfigurationen um; neue Konfigurationen sollten stets `microsoft` verwenden.
</Warning>

## Konfiguration

Die TTS-Konfiguration befindet sich unter `messages.tts` in `~/.openclaw/openclaw.json`. Wählen Sie eine
Voreinstellung und passen Sie den Provider-Block an. Die unten gezeigten Felder `speakerVoice`/`speakerVoiceId`
sind kanonisch; die providerspezifischen Feldnamen `voice`/`voiceId`/
`voiceName` funktionieren weiterhin als veraltete Aliasse.

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

Lassen Sie für Xiaomi `mimo-v2.5-tts-voicedesign` den Wert `speakerVoice` weg und legen Sie `style` auf
die Vorgabe für die Stimmgestaltung fest. OpenClaw sendet diese Vorgabe als TTS-Nachricht `user`
und sendet für das Voicedesign-Modell kein `audio.voice`.

### Sprachüberschreibungen pro Agent

Verwenden Sie `agents.list[].tts`, wenn ein Agent mit einem anderen Provider,
einer anderen Stimme, einem anderen Modell, einer anderen Persona oder einem anderen Auto-TTS-Modus sprechen soll. Der Agent-Block wird tief mit
`messages.tts` zusammengeführt, sodass die Provider-Anmeldedaten in der globalen Provider-Konfiguration verbleiben können:

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

Um eine Persona für einen Agenten festzulegen, setzen Sie `agents.list[].tts.persona` zusammen mit der Provider-
Konfiguration — dies überschreibt das globale `messages.tts.persona` nur für diesen Agenten.

Prioritätsreihenfolge für automatische Antworten, `/tts audio`, `/tts status` und das
Agentenwerkzeug `tts`:

1. `messages.tts`
2. aktives `agents.list[].tts`
3. Kanalüberschreibung, wenn der Kanal `channels.<channel>.tts` unterstützt
4. Kontoüberschreibung, wenn der Kanal `channels.<channel>.accounts.<id>.tts` übergibt
5. lokale `/tts`-Einstellungen für diesen Host
6. eingebettete `[[tts:...]]`-Direktiven, wenn [Modellüberschreibungen](#model-driven-directives) aktiviert sind

Kanal- und Kontoüberschreibungen verwenden dieselbe Struktur wie `messages.tts` und
werden tief mit den vorherigen Ebenen zusammengeführt, sodass gemeinsam genutzte Provider-Anmeldedaten in
`messages.tts` verbleiben können, während ein Kanal oder Bot-Konto nur die Sprecherstimme, das Modell, die Persona
oder den automatischen Modus ändert:

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
über mehrere Provider hinweg angewendet werden kann. Sie kann einen Provider bevorzugen, eine providerneutrale Prompt-
Absicht definieren und providerspezifische Bindungen für Stimmen, Modelle, Prompt-
Vorlagen, Seeds und Spracheinstellungen enthalten.

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

### Vollständige Persona (providerneutraler Prompt)

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
            profile: "Ein brillanter britischer Butler. Trocken, geistreich, warmherzig, charmant, emotional ausdrucksstark, niemals beliebig.",
            scene: "Ein ruhiges Arbeitszimmer spät in der Nacht. Nahmikrofonierte Erzählung für einen vertrauenswürdigen Operator.",
            sampleContext: "Der Sprecher beantwortet eine private technische Anfrage mit prägnanter Souveränität und trockener Wärme.",
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

1. lokale `/tts persona <id>`-Einstellung, falls gesetzt.
2. `messages.tts.persona`, falls gesetzt.
3. Keine Persona.

Die Provider-Auswahl erfolgt mit Vorrang für explizite Angaben:

1. Direkte Überschreibungen (CLI, Gateway, Talk, zulässige TTS-Direktiven).
2. Lokale `/tts provider <id>`-Einstellung.
3. `provider` der aktiven Persona.
4. `messages.tts.provider`.
5. Automatische Auswahl aus der Registry.

Bei jedem Provider-Versuch führt OpenClaw die Konfigurationen in dieser Reihenfolge zusammen:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Vertrauenswürdige Anfrageüberschreibungen
4. Zulässige, vom Modell ausgegebene Überschreibungen durch TTS-Direktiven

### Verwendung von Persona-Prompts durch Provider

Persona-Prompt-Felder (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) sind **providerneutral**. Jeder Provider entscheidet selbst, wie
sie verwendet werden:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Schließt Persona-Prompt-Felder in eine Gemini-TTS-Prompt-Struktur ein, jedoch **nur wenn**
    die effektive Google-Provider-Konfiguration `promptTemplate: "audio-profile-v1"`
    oder `personaPrompt` setzt. Die älteren Felder `audioProfile` und `speakerName` werden
    weiterhin als Google-spezifischer Prompt-Text vorangestellt. Eingebettete Audio-Tags wie
    `[whispers]` oder `[laughs]` innerhalb eines `[[tts:text]]`-Blocks bleiben
    im Gemini-Transkript erhalten; OpenClaw erzeugt diese Tags nicht.
  </Accordion>
  <Accordion title="OpenAI">
    Ordnet Persona-Prompt-Felder dem Anfragefeld `instructions` zu, jedoch **nur wenn**
    kein explizites OpenAI-`instructions` konfiguriert ist. Ein explizites `instructions`
    hat stets Vorrang.
  </Accordion>
  <Accordion title="Andere Provider">
    Verwenden nur die providerspezifischen Persona-Bindungen unter
    `personas.<id>.providers.<provider>`. Persona-Prompt-Felder werden ignoriert,
    sofern der Provider keine eigene Zuordnung von Persona-Prompts implementiert.
  </Accordion>
</AccordionGroup>

### Fallback-Richtlinie

`fallbackPolicy` steuert das Verhalten, wenn eine Persona **keine Bindung** für den
versuchten Provider besitzt:

| Richtlinie           | Verhalten                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Standard.** Providerneutrale Prompt-Felder bleiben verfügbar; der Provider kann sie verwenden oder ignorieren.                                            |
| `provider-defaults` | Die Persona wird bei diesem Versuch aus der Prompt-Vorbereitung ausgeschlossen; der Provider verwendet seine neutralen Standardeinstellungen, während der Fallback auf andere Provider fortgesetzt wird. |
| `fail`              | Diesen Provider-Versuch mit `reasonCode: "not_configured"` und `personaBinding: "missing"` überspringen. Fallback-Provider werden weiterhin versucht.              |

Die gesamte TTS-Anfrage schlägt nur fehl, wenn **jeder** versuchte Provider übersprungen wird
oder fehlschlägt.

Die Provider-Auswahl für Talk-Sitzungen gilt jeweils für eine Sitzung. Ein Talk-Client sollte
Provider-IDs, Modell-IDs, Sprach-IDs und Gebietsschemas aus `talk.catalog` auswählen und
sie über die Talk-Sitzung oder Übergabeanfrage übergeben. Das Öffnen einer Sprachsitzung sollte
weder `messages.tts` noch die globalen Talk-Provider-Standardeinstellungen verändern.

## Modellgesteuerte Direktiven

Standardmäßig **kann** der Assistent `[[tts:...]]`-Direktiven ausgeben, um
Stimme, Modell oder Geschwindigkeit für eine einzelne Antwort zu überschreiben, sowie optional einen
`[[tts:text]]...[[/tts:text]]`-Block für ausdrucksstarke Hinweise, die nur im
Audio erscheinen sollen:

```text
Hier bitte.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](lacht) Lies das Lied noch einmal vor.[[/tts:text]]
```

Wenn `messages.tts.auto` auf `"tagged"` gesetzt ist, sind **Direktiven erforderlich**, um
Audio auszulösen. Bei der gestreamten Blockauslieferung werden Direktiven aus dem sichtbaren Text entfernt, bevor der
Kanal sie erhält, selbst wenn sie auf benachbarte Blöcke aufgeteilt sind.

`provider=...` wird ignoriert, sofern nicht `modelOverrides.allowProvider: true`. Wenn eine
Antwort `provider=...` deklariert, werden die anderen Schlüssel in dieser Direktive
nur von diesem Provider ausgewertet; nicht unterstützte Schlüssel werden entfernt und als Warnungen zu TTS-
Direktiven gemeldet.

**Verfügbare Direktiven-Schlüssel:**

- `provider` (registrierte Provider-ID; erfordert `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (Legacy-Aliase: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
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

**Provider-Wechsel zulassen, während andere Parameter konfigurierbar bleiben:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slash-Befehle

Einzelner Befehl `/tts`. Auf Discord registriert OpenClaw außerdem `/voice`, weil
`/tts` ein integrierter Discord-Befehl ist — der Text `/tts ...` funktioniert weiterhin.

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
Befehle erfordern einen autorisierten Absender (Zulassungslisten-/Eigentümerregeln gelten), und entweder
`commands.text` oder die native Befehlsregistrierung muss aktiviert sein.
</Note>

Hinweise zum Verhalten:

- `/tts on` schreibt die lokale TTS-Einstellung nach `always`; `/tts off` schreibt sie nach `off`.
- `/tts chat on|off|default` schreibt eine sitzungsbezogene Auto-TTS-Überschreibung für den aktuellen Chat.
- `/tts persona <id>` schreibt die lokale Persona-Einstellung; `/tts persona off` löscht sie.
- `/tts latest` liest die neueste Assistentenantwort aus dem Transkript der aktuellen Sitzung und sendet sie einmalig als Audio. Im Sitzungseintrag wird nur ein Hash dieser Antwort gespeichert, um doppelte Sprachausgaben zu unterdrücken.
- `/tts audio` erzeugt eine einmalige Audioantwort (schaltet TTS **nicht** ein).
- `/tts limit <chars>` akzeptiert **100–4096** (4096 ist das Telegram-Maximum für Bildunterschriften/Nachrichten); Werte außerhalb dieses Bereichs werden abgelehnt.
- `limit` und `summary` werden in **lokalen Einstellungen** gespeichert, nicht in der Hauptkonfiguration.
- `/tts status` enthält Fallback-Diagnosedaten für den letzten Versuch — `Fallback: <primary> -> <used>`, `Attempts: ...` und Details zu jedem Versuch (`provider:outcome(reasonCode) latency`).
- `/status` zeigt den aktiven TTS-Modus sowie den konfigurierten Provider, das Modell, die Stimme und bereinigte Metadaten des benutzerdefinierten Endpunkts an, wenn TTS aktiviert ist.

## Benutzerspezifische Einstellungen

Slash-Befehle schreiben lokale Überschreibungen nach `prefsPath`. Der Standardwert ist
`~/.openclaw/settings/tts.json`; überschreiben Sie ihn mit der Umgebungsvariablen `OPENCLAW_TTS_PREFS`
oder `messages.tts.prefsPath`.

| Gespeichertes Feld | Wirkung                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| `auto`       | Lokale Auto-TTS-Überschreibung (`always`, `off`, …)                                     |
| `provider`   | Lokale Überschreibung des primären Providers                                                  |
| `persona`    | Lokale Persona-Überschreibung                                                           |
| `maxLength`  | Schwellenwert für Zusammenfassung/Kürzung (standardmäßig `1500` Zeichen, `/tts limit` Bereich 100–4096) |
| `summarize`  | Schalter für Zusammenfassungen (standardmäßig `true`)                                                  |

Diese überschreiben die wirksame Konfiguration aus `messages.tts` sowie den aktiven
`agents.list[].tts`-Block für diesen Host.

## Ausgabeformate

Die TTS-Sprachausgabe richtet sich nach den Kanalfunktionen. Kanal-Plugins geben an,
ob TTS im Sprachstil bei Providern ein natives `voice-note`-Zielformat anfordern oder
die normale `audio-file`-Synthese beibehalten soll und ob der Kanal
nicht native Ausgaben vor dem Senden transkodiert.

| Ziel                                  | Format                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Sprachnachrichten bevorzugen **Opus** (`opus_48000_64` von ElevenLabs, `opus` von OpenAI). 48 kHz / 64 kbps bietet ein ausgewogenes Verhältnis zwischen Klarheit und Größe. |
| Andere Kanäle                         | **MP3** (`mp3_44100_128` von ElevenLabs, `mp3` von OpenAI). 44,1 kHz / 128 kbps ist die standardmäßige Balance für Sprache.                  |
| Talk / Telefonie                      | Provider-natives **PCM** (Inworld 22050 Hz, Google 24 kHz) oder `ulaw_8000` von Gradium für Telefonie.                                 |

Hinweise zu den einzelnen Providern:

- **Transkodierung für Feishu / WhatsApp:** Wenn eine Sprachnachricht als MP3/WebM/WAV/M4A oder eine andere wahrscheinliche Audiodatei vorliegt, transkodiert das Kanal-Plugin sie vor dem Senden der nativen Sprachnachricht mit `ffmpeg` (`libopus`, 64 kbps) in Ogg/Opus mit 48 kHz. WhatsApp sendet das Ergebnis über die Baileys-Nutzlast `audio` mit `ptt: true` und `audio/ogg; codecs=opus`. Bei einem Transkodierungsfehler fängt Feishu den Fehler ab und sendet stattdessen die Originaldatei als einfachen Anhang. WhatsApp bietet keinen Fallback, daher schlägt der Sendevorgang selbst fehl, anstatt eine inkompatible PTT-Nutzlast zu veröffentlichen.
- **MiniMax:** MP3 (`speech-2.8-hd`-Modell, Abtastrate 32 kHz) für normale Audioanhänge; für vom Kanal angekündigte Sprachnachrichtenziele wird mit `ffmpeg` in Opus mit 48 kHz transkodiert.
- **Xiaomi MiMo:** Standardmäßig MP3 oder bei entsprechender Konfiguration WAV; für vom Kanal angekündigte Sprachnachrichtenziele wird mit `ffmpeg` in Opus mit 48 kHz transkodiert.
- **Lokale CLI:** Verwendet das konfigurierte `outputFormat`. Sprachnachrichtenziele werden in Ogg/Opus und Telefonieausgaben mit `ffmpeg` in unkomprimiertes Mono-PCM mit 16 kHz konvertiert.
- **Google Gemini:** Gibt unkomprimiertes PCM mit 24 kHz zurück. OpenClaw verpackt es für Audioanhänge als WAV, transkodiert es für Sprachnachrichtenziele in Opus mit 48 kHz und gibt PCM für Talk/Telefonie direkt zurück.
- **Gradium:** WAV für Audioanhänge, Opus für Sprachnachrichtenziele und `ulaw_8000` mit 8 kHz für Telefonie.
- **Inworld:** MP3 für normale Audioanhänge, natives `OGG_OPUS` für Sprachnachrichtenziele und unkomprimiertes `PCM` mit 22050 Hz für Talk/Telefonie.
- **xAI:** Standardmäßig MP3; die Audiodateisynthese kann `mp3`, `wav`, `pcm`, `mulaw` oder `alaw` sowohl für gepufferte als auch für Streaming-Ausgaben verwenden. Sprachnachrichtenziele verwenden MP3 für Streaming und als gepufferten Fallback, da die Ausgaben `pcm`, `mulaw` und `alaw` von xAI unkomprimierte Audiodaten ohne Header sind. Die gepufferte Synthese verwendet den Batch-REST-Endpunkt `/v1/tts` von xAI; `textToSpeechStream` verwendet natives `wss://api.x.ai/v1/tts`. Dies ist nicht der Echtzeit-Sprachvertrag. Das native Opus-Sprachnachrichtenformat wird nicht unterstützt.
- **Microsoft:** Verwendet `microsoft.outputFormat` (standardmäßig `audio-24khz-48kbitrate-mono-mp3`).
  - Der gebündelte Transport akzeptiert ein `outputFormat`, aber nicht alle Formate sind über den Dienst verfügbar.
  - Die Werte für das Ausgabeformat entsprechen den Microsoft-Speech-Ausgabeformaten (einschließlich Ogg/WebM Opus).
  - Telegram `sendVoice` akzeptiert OGG/MP3/M4A; verwenden Sie OpenAI/ElevenLabs, wenn Sie garantierte Opus-Sprachnachrichten benötigen.
  - Wenn das konfigurierte Microsoft-Ausgabeformat fehlschlägt, versucht OpenClaw es erneut mit MP3.
  - Wenn keine explizite Stimmenüberschreibung festgelegt ist und die englische Standardstimme verwendet wird, wechselt OpenClaw automatisch zu einer chinesischen neuronalen Stimme (`zh-CN-XiaoxiaoNeural`, Gebietsschema `zh-CN`), wenn der Antworttext überwiegend aus CJK-Zeichen besteht.

Die Ausgabeformate von OpenAI und ElevenLabs sind wie oben aufgeführt je Kanal festgelegt.

## Verhalten von Auto-TTS

Wenn `messages.tts.auto` aktiviert ist, führt OpenClaw Folgendes aus:

- Überspringt TTS, wenn die Antwort bereits strukturierte Medien enthält.
- Überspringt sehr kurze Antworten (unter 10 Zeichen).
- Fasst lange Antworten zusammen, wenn Zusammenfassungen aktiviert sind, und verwendet dabei
  `summaryModel` (oder `agents.defaults.model.primary`).
- Hängt das erzeugte Audio an die Antwort an.
- Sendet in `mode: "final"` für gestreamte endgültige Antworten weiterhin ausschließlich TTS-Audio,
  nachdem der Textstream abgeschlossen ist; die erzeugten Medien durchlaufen dieselbe
  Mediennormalisierung des Kanals wie normale Antwortanhänge.

Wenn die Antwort `maxLength` überschreitet, lässt OpenClaw das Audio niemals vollständig aus:

- **Zusammenfassung aktiviert** (Standard) und ein Zusammenfassungsmodell ist verfügbar: Fasst den
  Text auf ungefähr `maxLength` Zeichen zusammen und synthetisiert anschließend die Zusammenfassung.
- **Zusammenfassung deaktiviert**, die Zusammenfassung schlägt fehl oder für das
  Zusammenfassungsmodell ist kein API-Schlüssel verfügbar: Kürzt den Text auf `maxLength` Zeichen und synthetisiert den
  gekürzten Text.

```text
Antwort -> TTS aktiviert?
  nein -> Text senden
  ja   -> Medien vorhanden / kurz?
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
      Automatischer TTS-Modus. `inbound` sendet Audio nur nach einer eingehenden Sprachnachricht; `tagged` sendet Audio nur, wenn die Antwort `[[tts:...]]`-Direktiven oder einen `[[tts:text]]`-Block enthält.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Veralteter Schalter. `openclaw doctor --fix` migriert ihn zu `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` schließt zusätzlich zu endgültigen Antworten auch Werkzeug-/Blockantworten ein.
    </ParamField>
    <ParamField path="provider" type="string">
      ID des Sprach-Providers. Wenn nicht festgelegt, verwendet OpenClaw den ersten konfigurierten Provider in der automatischen Auswahlreihenfolge der Registry. Das veraltete `provider: "edge"` wird von `openclaw doctor --fix` in `"microsoft"` umgeschrieben.
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
      Ermöglicht dem Modell, TTS-Direktiven auszugeben. `enabled` verwendet standardmäßig `true`; `allowProvider` verwendet standardmäßig `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Einstellungen im Besitz des Providers, nach der ID des Sprach-Providers verschlüsselt. Veraltete direkte Blöcke (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) werden von `openclaw doctor --fix` umgeschrieben; speichern Sie ausschließlich `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      Feste Obergrenze für die Anzahl der TTS-Eingabezeichen. `/tts audio`, `tts.convert` und `tts.speak` schlagen bei einer Überschreitung fehl.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      Zeitüberschreitung der Anfrage in Millisekunden. Ein aufrufbezogenes `timeoutMs` (Agentenwerkzeug, Gateway) hat Vorrang, wenn es festgelegt ist; andernfalls hat ein explizit konfiguriertes `messages.tts.timeoutMs` Vorrang vor allen vom Plugin festgelegten Provider-Standardwerten.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Überschreibt den lokalen Pfad zur JSON-Datei mit Einstellungen (Provider/Grenzwert/Zusammenfassung). Standardmäßig `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Umgebung: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` oder `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Azure-Speech-Region (z. B. `eastus`). Umgebung: `AZURE_SPEECH_REGION` oder `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Optionale Überschreibung des Azure-Speech-Endpunkts (Alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName der Azure-Stimme. Standardmäßig `en-US-JennyNeural`. Veralteter Alias: `voice`.</ParamField>
    <ParamField path="lang" type="string">SSML-Sprachcode. Standardmäßig `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` für Standardaudio. Standardmäßig `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` für die Ausgabe von Sprachnachrichten. Standardmäßig `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Greift ersatzweise auf `ELEVENLABS_API_KEY` oder `XI_API_KEY` zurück.</ParamField>
    <ParamField path="model" type="string">Modell-ID. Standardmäßig `eleven_multilingual_v2`. Veraltete IDs `eleven_turbo_v2_5`/`eleven_turbo_v2` werden auf das entsprechende `flash`-Modell normalisiert.</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs-Stimmen-ID. Standardmäßig `pMsXgVXv3BLzUgSXRplE`. Veralteter Alias: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (jeweils `0..1`, Standardwerte `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false`, Standardwert `true`), `speed` (`0.5..2.0`, Standardwert `1.0`).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Modus der Textnormalisierung.</ParamField>
    <ParamField path="languageCode" type="string">Zweistelliger Code nach ISO 639-1 (z. B. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Ganzzahl `0..4294967295` für bestmögliche Deterministik.</ParamField>
    <ParamField path="baseUrl" type="string">Überschreibt die Basis-URL der ElevenLabs-API.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Greift ersatzweise auf `GEMINI_API_KEY` / `GOOGLE_API_KEY` zurück. Falls nicht angegeben, kann TTS vor dem Rückgriff auf Umgebungsvariablen `models.providers.google.apiKey` wiederverwenden.</ParamField>
    <ParamField path="model" type="string">Gemini-TTS-Modell. Standardwert: `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Name der vordefinierten Gemini-Stimme. Standardwert: `Kore`. Veraltete Aliasse: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Stilvorgabe in natürlicher Sprache, die dem gesprochenen Text vorangestellt wird.</ParamField>
    <ParamField path="speakerName" type="string">Optionale Sprecherbezeichnung, die dem gesprochenen Text vorangestellt wird, wenn Ihre Vorgabe einen benannten Sprecher verwendet.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Auf `audio-profile-v1` setzen, um die aktiven Persona-Vorgabefelder in eine deterministische Gemini-TTS-Vorgabestruktur einzubetten.</ParamField>
    <ParamField path="personaPrompt" type="string">Zusätzlicher Google-spezifischer Persona-Vorgabetext, der an die Regieanweisungen der Vorlage angehängt wird.</ParamField>
    <ParamField path="baseUrl" type="string">Nur `https://generativelanguage.googleapis.com` wird akzeptiert.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Umgebungsvariable: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">HTTPS-URL der Gradium-API unter `api.gradium.ai`. Standardwert: `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standardwert: Emma (`YTpq7expH9539ERJ`). Veralteter Alias: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Primäres Inworld

    <ParamField path="apiKey" type="string">Umgebungsvariable: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standardwert: `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Standardwert: `inworld-tts-1.5-max`. Außerdem: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standardwert: `Sarah`. Veralteter Alias: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Sampling-Temperatur `0..2` (0 ausgeschlossen).</ParamField>

  </Accordion>

  <Accordion title="Lokale CLI (tts-local-cli)">
    <ParamField path="command" type="string">Lokale ausführbare Datei oder Befehlszeichenfolge für CLI-TTS.</ParamField>
    <ParamField path="args" type="string[]">Befehlsargumente. Unterstützt die Platzhalter `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Erwartetes CLI-Ausgabeformat. Standardwert für Audioanhänge: `mp3`.</ParamField>
    <ParamField path="timeoutMs" type="number">Zeitlimit des Befehls in Millisekunden. Standardwert: `120000`.</ParamField>
    <ParamField path="cwd" type="string">Optionales Arbeitsverzeichnis des Befehls.</ParamField>
    <ParamField path="env" type="Record<string, string>">Optionale Überschreibungen der Umgebungsvariablen für den Befehl.</ParamField>

    Die Standardausgabe des Befehls sowie erzeugte oder konvertierte Audiodaten sind auf 50 MiB begrenzt. Die diagnostische Standardfehlerausgabe ist auf 1 MiB begrenzt. OpenClaw beendet den Befehl und bricht die Synthese ab, wenn einer der Grenzwerte überschritten wird.

  </Accordion>

  <Accordion title="Microsoft (kein API-Schlüssel)">
    <ParamField path="enabled" type="boolean" default="true">Die Verwendung der Microsoft-Sprachausgabe zulassen.</ParamField>
    <ParamField path="speakerVoice" type="string">Name der neuronalen Microsoft-Stimme (z. B. `en-US-MichelleNeural`). Veralteter Alias: `voice`. Wenn die englische Standardstimme aktiv ist und der Antworttext überwiegend aus CJK-Zeichen besteht, wechselt OpenClaw automatisch zu `zh-CN-XiaoxiaoNeural`.</ParamField>
    <ParamField path="lang" type="string">Sprachcode (z. B. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft-Ausgabeformat. Standardwert: `audio-24khz-48kbitrate-mono-mp3`. Der mitgelieferte Edge-basierte Transport unterstützt nicht alle Formate.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Prozentangaben als Zeichenfolgen (z. B. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">JSON-Untertitel neben der Audiodatei speichern.</ParamField>
    <ParamField path="proxy" type="string">Proxy-URL für Anfragen an die Microsoft-Sprachausgabe.</ParamField>
    <ParamField path="timeoutMs" type="number">Überschreibung des Anfragezeitlimits (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Veralteter Alias. Führen Sie `openclaw doctor --fix` aus, um die persistierte Konfiguration in `providers.microsoft` umzuschreiben.</ParamField>
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
    <ParamField path="instructions" type="string">Explizites OpenAI-Feld `instructions`. Wenn es gesetzt ist, werden Persona-Vorgabefelder **nicht** automatisch zugeordnet.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Zusätzliche JSON-Felder, die nach den generierten OpenAI-TTS-Feldern in die Anfragetexte von `/audio/speech` eingefügt werden. Verwenden Sie dies für OpenAI-kompatible Endpunkte wie Kokoro, die Provider-spezifische Schlüssel wie `lang` erfordern; unsichere Prototypschlüssel werden ignoriert.</ParamField>
    <ParamField path="baseUrl" type="string">
      Überschreibt den OpenAI-TTS-Endpunkt. Auflösungsreihenfolge: Konfiguration → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Nicht standardmäßige Werte werden als OpenAI-kompatible TTS-Endpunkte behandelt; daher werden benutzerdefinierte Modell- und Stimmennamen akzeptiert und für `speed` entfällt die Bereichsprüfung `0.25..4.0`.
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
    <ParamField path="baseUrl" type="string">Überschreibt den HTTP-Endpunkt von Seed Speech TTS. Umgebungsvariable: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Stimmtyp. Standardwert: `en_female_anna_mars_bigtts`. Umgebungsvariable: `VOLCENGINE_TTS_VOICE`. Veralteter Alias: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Provider-natives Geschwindigkeitsverhältnis, `0.2..3`.</ParamField>
    <ParamField path="emotion" type="string">Provider-natives Emotions-Tag.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Veraltete Felder der Volcengine Speech Console. Umgebungsvariablen: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (Standardwert: `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Umgebungsvariable: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standardwert: `https://api.x.ai/v1`. Umgebungsvariable: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standardwert: `eve`. Mit Authentifizierung ruft `openclaw infer tts voices --provider xai` den aktuellen integrierten Katalog ab; ohne Authentifizierung werden die Offline-Rückfalloptionen `ara`, `eve`, `leo`, `rex` und `sal` aufgeführt. Benutzerdefinierte Stimmen-IDs des Kontos werden auch dann weitergeleitet, wenn sie nicht in der integrierten Liste enthalten sind. Veralteter Alias: `voiceId`.</ParamField>
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
    <ParamField path="style" type="string">Optionale Stilanweisung in natürlicher Sprache, die als Benutzernachricht gesendet und nicht gesprochen wird. Für `mimo-v2.5-tts-voicedesign` ist dies die Vorgabe für das Stimmendesign; OpenClaw stellt einen Standardwert bereit, wenn sie nicht angegeben wird.</ParamField>
  </Accordion>
</AccordionGroup>

## Agentenwerkzeug

Das Werkzeug `tts` wandelt Text in Sprache um und gibt einen Audioanhang für die
Antwortzustellung zurück. Bei Feishu, Matrix, Telegram und WhatsApp wird das Audio
als Sprachnachricht statt als Dateianhang zugestellt. Feishu und
WhatsApp können TTS-Ausgaben, die nicht im Opus-Format vorliegen, auf diesem Pfad transkodieren, wenn `ffmpeg`
verfügbar ist.

WhatsApp sendet Audio über Baileys als PTT-Sprachnachricht (`audio` mit
`ptt: true`) und sendet sichtbaren Text **separat** vom PTT-Audio, da
Clients Untertitel bei Sprachnachrichten nicht zuverlässig darstellen.

Das Werkzeug akzeptiert die optionalen Felder `channel` und `timeoutMs`; `timeoutMs` ist ein
Provider-Anfragezeitlimit pro Aufruf in Millisekunden. Werte pro Aufruf überschreiben
`messages.tts.timeoutMs`; konfigurierte TTS-Zeitlimits überschreiben alle von Plugins definierten
Provider-Standardwerte.

## Gateway-RPC

| Methode            | Zweck                                      |
| ----------------- | -------------------------------------------- |
| `tts.status`      | Aktuellen TTS-Status und letzten Versuch abrufen.     |
| `tts.enable`      | Lokale automatische Einstellung auf `always` setzen.       |
| `tts.disable`     | Lokale automatische Einstellung auf `off` setzen.          |
| `tts.convert`     | Einmalige Umwandlung von Text → Audio.                        |
| `tts.setProvider` | Lokale Provider-Einstellung festlegen.               |
| `tts.personas`    | Konfigurierte Personas und die aktive Persona auflisten. |
| `tts.setPersona`  | Lokale Persona-Einstellung festlegen.                |
| `tts.providers`   | Konfigurierte Provider und deren Status auflisten.        |

## Dienstlinks

- [OpenAI-Leitfaden zur Text-zu-Sprache-Umwandlung](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI-Audio-API-Referenz](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST-Text-zu-Sprache](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure-Speech-Provider](/de/providers/azure-speech)
- [ElevenLabs Text-zu-Sprache](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs-Authentifizierung](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/de/providers/gradium)
- [Inworld-TTS-API](https://docs.inworld.ai/tts/tts)
- [MiniMax-T2A-v2-API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine-TTS-HTTP-API](/de/providers/volcengine#text-to-speech)
- [Xiaomi-MiMo-Sprachsynthese](/de/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft-Speech-Ausgabeformate](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI-Text-zu-Sprache](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Verwandte Themen

- [Medienübersicht](/de/tools/media-overview)
- [Musikgenerierung](/de/tools/music-generation)
- [Videogenerierung](/de/tools/video-generation)
- [Slash-Befehle](/de/tools/slash-commands)
- [Sprachanruf-Plugin](/de/plugins/voice-call)
