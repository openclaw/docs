---
read_when:
    - Text-to-Speech für Antworten aktivieren
    - Konfigurieren eines TTS-Providers, einer Fallback-Kette oder einer Persona
    - Verwenden von `/tts`-Befehlen oder Direktiven
sidebarTitle: Text to speech (TTS)
summary: Text-to-Speech für ausgehende Antworten — Provider, Personas, Slash-Befehle und Ausgabe pro Kanal
title: Text-to-Speech
x-i18n:
    generated_at: "2026-04-26T11:41:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a84fde8f7fd380667a39c448ac8158e0aab071b77be41b87431d10d8b4219
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw kann ausgehende Antworten bei **13 Speech-Providern** in Audio umwandeln
und native Sprachnachrichten auf Feishu, Matrix, Telegram und WhatsApp,
Audio-Anhänge überall sonst sowie PCM-/Ulaw-Streams für Telephony und Talk bereitstellen.

## Schnellstart

<Steps>
  <Step title="Einen Provider auswählen">
    OpenAI und ElevenLabs sind die zuverlässigsten gehosteten Optionen. Microsoft und
    Local CLI funktionieren ohne API-Schlüssel. Die vollständige Liste finden Sie in der [Provider-Matrix](#supported-providers).
  </Step>
  <Step title="Den API-Schlüssel setzen">
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
    `/tts status` zeigt den aktuellen Status an. `/tts audio Hello from OpenClaw`
    sendet eine einmalige Audio-Antwort.
  </Step>
</Steps>

<Note>
Automatisches TTS ist standardmäßig **deaktiviert**. Wenn `messages.tts.provider` nicht gesetzt ist,
wählt OpenClaw den ersten konfigurierten Provider in der automatischen Auswahlliste der Registry.
</Note>

## Unterstützte Provider

| Provider          | Auth                                                                                                             | Hinweise                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (auch `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)         | Native Ogg/Opus-Sprachnachrichtenausgabe und Telephony.                |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` oder `XI_API_KEY`                                                                           | Voice-Cloning, mehrsprachig, deterministisch über `seed`.              |
| **Google Gemini** | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                                                                           | Gemini-API-TTS; Persona-bewusst über `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Sprachnachrichten- und Telephony-Ausgabe.                              |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | Streaming-TTS-API. Native Opus-Sprachnachrichten und PCM-Telephony.    |
| **Local CLI**     | keine                                                                                                            | Führt einen konfigurierten lokalen TTS-Befehl aus.                     |
| **Microsoft**     | keine                                                                                                            | Öffentliches Edge Neural TTS über `node-edge-tts`. Best Effort, keine SLA. |
| **MiniMax**       | `MINIMAX_API_KEY` (oder Token-Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)   | T2A-v2-API. Standardmäßig `speech-2.8-hd`.                             |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Wird auch für automatische Zusammenfassungen verwendet; unterstützt Persona-`instructions`. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (kann `models.providers.openrouter.apiKey` wiederverwenden)                                | Standardmodell `hexgrad/kokoro-82m`.                                   |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` oder `BYTEPLUS_SEED_SPEECH_API_KEY` (Legacy-AppID/-Token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API.                                     |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Gemeinsamer Provider für Bilder, Video und Sprache.                    |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI-Batch-TTS. Native Opus-Sprachnachrichten werden **nicht** unterstützt. |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS über Xiaomi Chat Completions.                                 |

Wenn mehrere Provider konfiguriert sind, wird zuerst der ausgewählte verwendet und die
anderen dienen als Fallback-Optionen. Die automatische Zusammenfassung verwendet `summaryModel` (oder
`agents.defaults.model.primary`), daher muss dieser Provider ebenfalls authentifiziert sein,
wenn Sie Zusammenfassungen aktiviert lassen.

<Warning>
Der gebündelte **Microsoft**-Provider verwendet den Online-Neural-TTS-
Dienst von Microsoft Edge über `node-edge-tts`. Es handelt sich um einen öffentlichen Webdienst ohne veröffentlichte
SLA oder Kontingente — behandeln Sie ihn als Best Effort. Die Legacy-Provider-ID `edge` wird
zu `microsoft` normalisiert, und `openclaw doctor --fix` schreibt persistierte
Konfigurationen um; neue Konfigurationen sollten immer `microsoft` verwenden.
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
          voice: "en-US-JennyNeural",
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
          voiceId: "EXAVITQu4vr4xnSDxMaL",
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
          voiceName: "Kore",
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
          voiceId: "YTpq7expH9539ERJ",
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
          voiceId: "Sarah",
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
  <Tab title="Microsoft (ohne Schlüssel)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
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
          voiceId: "English_expressive_narrator",
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
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
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
          voice: "af_alloy",
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
          voice: "en_female_anna_mars_bigtts",
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
          voiceId: "eve",
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
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### Sprachüberschreibungen pro Agent

Verwenden Sie `agents.list[].tts`, wenn ein Agent mit einem anderen Provider,
einer anderen Stimme, einem anderen Modell, einer anderen Persona oder einem anderen automatischen TTS-Modus sprechen soll. Der
Agent-Block wird per Deep Merge über `messages.tts` gelegt, sodass Provider-Anmeldedaten in der globalen Provider-Konfiguration bleiben können:

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
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Um eine Persona pro Agent festzulegen, setzen Sie `agents.list[].tts.persona` zusammen mit der Provider-
Konfiguration — dies überschreibt die globale `messages.tts.persona` nur für diesen Agenten.

Prioritätsreihenfolge für automatische Antworten, `/tts audio`, `/tts status` und das
Agent-Tool `tts`:

1. `messages.tts`
2. aktives `agents.list[].tts`
3. Kanalüberschreibung, wenn der Kanal `channels.<channel>.tts` unterstützt
4. Kontoüberschreibung, wenn der Kanal `channels.<channel>.accounts.<id>.tts` übergibt
5. lokale `/tts`-Einstellungen für diesen Host
6. Inline-Direktiven `[[tts:...]]`, wenn [modellgesteuerte Überschreibungen](#model-driven-directives) aktiviert sind

Kanal- und Kontoüberschreibungen verwenden dieselbe Struktur wie `messages.tts` und
werden per Deep Merge über die vorherigen Ebenen gelegt, sodass gemeinsame Provider-Anmeldedaten in
`messages.tts` bleiben können, während ein Kanal oder Bot-Konto nur Stimme, Modell, Persona
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
              openai: { voice: "shimmer" },
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
über verschiedene Provider hinweg angewendet werden kann. Sie kann einen Provider bevorzugen, eine providerneutrale Prompt-
Absicht definieren und providerspezifische Bindungen für Stimmen, Modelle, Prompt-
Templates, Seeds und Stimmeinstellungen enthalten.

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
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
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
          description: "Trockener, warmer britischer Butler-Erzähler.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Ein brillanter britischer Butler. Trocken, geistreich, warm, charmant, emotional ausdrucksstark, niemals generisch.",
            scene: "Ein ruhiges Arbeitszimmer spät in der Nacht. Nah mikrofonierte Erzählung für einen vertrauenswürdigen Operator.",
            sampleContext: "Der Sprecher beantwortet eine private technische Anfrage mit prägnanter Sicherheit und trockener Wärme.",
            style: "Raffiniert, zurückhaltend, leicht amüsiert.",
            accent: "Britisches Englisch.",
            pacing: "Gemessen, mit kurzen dramatischen Pausen.",
            constraints: ["Konfigurationswerte nicht laut vorlesen.", "Die Persona nicht erklären."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
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

1. lokale Präferenz `/tts persona <id>`, falls gesetzt.
2. `messages.tts.persona`, falls gesetzt.
3. Keine Persona.

Die Providerauswahl erfolgt nach dem Prinzip „explizit zuerst“:

1. Direkte Überschreibungen (CLI, Gateway, Talk, erlaubte TTS-Direktiven).
2. Lokale Präferenz `/tts provider <id>`.
3. `provider` der aktiven Persona.
4. `messages.tts.provider`.
5. Automatische Auswahl der Registry.

Für jeden Provider-Versuch führt OpenClaw Konfigurationen in dieser Reihenfolge zusammen:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Vertrauenswürdige Anfrageüberschreibungen
4. Erlaubte modellausgegebene TTS-Direktivenüberschreibungen

### Wie Provider Persona-Prompts verwenden

Persona-Prompt-Felder (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) sind **providerneutral**. Jeder Provider entscheidet selbst, wie
er sie verwendet:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Kapselt Persona-Prompt-Felder in eine Gemini-TTS-Prompt-Struktur **nur dann**,
    wenn die effektive Google-Provider-Konfiguration `promptTemplate: "audio-profile-v1"`
    oder `personaPrompt` setzt. Die älteren Felder `audioProfile` und `speakerName` werden
    weiterhin als Google-spezifischer Prompt-Text vorangestellt. Inline-Audio-Tags wie
    `[whispers]` oder `[laughs]` innerhalb eines `[[tts:text]]`-Blocks bleiben
    im Gemini-Transkript erhalten; OpenClaw erzeugt diese Tags nicht.
  </Accordion>
  <Accordion title="OpenAI">
    Ordnet Persona-Prompt-Felder dem Anfragefeld `instructions` zu, **nur wenn**
    keine expliziten OpenAI-`instructions` konfiguriert sind. Explizite `instructions`
    haben immer Vorrang.
  </Accordion>
  <Accordion title="Andere Provider">
    Verwenden nur die providerspezifischen Persona-Bindungen unter
    `personas.<id>.providers.<provider>`. Persona-Prompt-Felder werden ignoriert,
    sofern der Provider keine eigene Persona-Prompt-Zuordnung implementiert.
  </Accordion>
</AccordionGroup>

### Fallback-Richtlinie

`fallbackPolicy` steuert das Verhalten, wenn eine Persona **keine Bindung** für den
versuchten Provider hat:

| Richtlinie         | Verhalten                                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona` | **Standard.** Providerneutrale Prompt-Felder bleiben verfügbar; der Provider kann sie verwenden oder ignorieren.                               |
| `provider-defaults` | Die Persona wird bei der Prompt-Erstellung für diesen Versuch ausgelassen; der Provider verwendet seine neutralen Standards, während der Fallback zu anderen Providern fortgesetzt wird. |
| `fail`             | Überspringt diesen Provider-Versuch mit `reasonCode: "not_configured"` und `personaBinding: "missing"`. Fallback-Provider werden weiterhin versucht. |

Die gesamte TTS-Anfrage schlägt nur dann fehl, wenn **jeder** versuchte Provider übersprungen wird
oder fehlschlägt.

## Modellgesteuerte Direktiven

Standardmäßig **kann** der Assistant `[[tts:...]]`-Direktiven ausgeben, um
Stimme, Modell oder Geschwindigkeit für eine einzelne Antwort zu überschreiben, plus einen optionalen
`[[tts:text]]...[[/tts:text]]`-Block für expressive Hinweise, die nur im
Audio erscheinen sollen:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Wenn `messages.tts.auto` auf `"tagged"` gesetzt ist, sind **Direktiven erforderlich**, um
Audio auszulösen. Bei Streaming-Blockauslieferung werden Direktiven aus dem sichtbaren Text entfernt, bevor der
Kanal sie sieht, selbst wenn sie über benachbarte Blöcke verteilt sind.

`provider=...` wird ignoriert, sofern nicht `modelOverrides.allowProvider: true` gesetzt ist. Wenn eine
Antwort `provider=...` deklariert, werden die übrigen Schlüssel in dieser Direktive
nur von diesem Provider geparst; nicht unterstützte Schlüssel werden entfernt und als TTS-
Direktivenwarnungen gemeldet.

**Verfügbare Direktivschlüssel:**

- `provider` (registrierte Provider-ID; erfordert `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax-Lautstärke, 0–10)
- `pitch` (MiniMax-Ganzzahltonhöhe, −12 bis 12; Nachkommwerte werden abgeschnitten)
- `emotion` (Volcengine-Emotions-Tag)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Modellüberschreibungen vollständig deaktivieren:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Provider-Wechsel erlauben und gleichzeitig andere Parameter konfigurierbar halten:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slash-Befehle

Ein einzelner Befehl `/tts`. Auf Discord registriert OpenClaw zusätzlich `/voice`, weil
`/tts` ein integrierter Discord-Befehl ist — Text-`/tts ...` funktioniert weiterhin.

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
Befehle erfordern einen autorisierten Absender (Allowlist-/Eigentümerregeln gelten) und entweder
muss `commands.text` oder die native Befehlsregistrierung aktiviert sein.
</Note>

Hinweise zum Verhalten:

- `/tts on` schreibt die lokale TTS-Präferenz auf `always`; `/tts off` schreibt sie auf `off`.
- `/tts chat on|off|default` schreibt eine sitzungsbezogene Auto-TTS-Überschreibung für den aktuellen Chat.
- `/tts persona <id>` schreibt die lokale Persona-Präferenz; `/tts persona off` löscht sie.
- `/tts latest` liest die neueste Assistant-Antwort aus dem aktuellen Sitzungsprotokoll und sendet sie einmal als Audio. Es speichert nur einen Hash dieser Antwort im Sitzungseintrag, um doppelte Sprachsendungen zu unterdrücken.
- `/tts audio` erzeugt eine einmalige Audio-Antwort (schaltet TTS **nicht** ein).
- `limit` und `summary` werden in **lokalen Präferenzen** gespeichert, nicht in der Hauptkonfiguration.
- `/tts status` enthält Fallback-Diagnosen für den letzten Versuch — `Fallback: <primary> -> <used>`, `Attempts: ...` und Details pro Versuch (`provider:outcome(reasonCode) latency`).
- `/status` zeigt den aktiven TTS-Modus sowie konfigurierten Provider, Modell, Stimme und bereinigte benutzerdefinierte Endpunktmetadaten an, wenn TTS aktiviert ist.

## Benutzerspezifische Präferenzen

Slash-Befehle schreiben lokale Überschreibungen nach `prefsPath`. Standardmäßig ist dies
`~/.openclaw/settings/tts.json`; überschreibbar über die Umgebungsvariable `OPENCLAW_TTS_PREFS`
oder `messages.tts.prefsPath`.

| Gespeichertes Feld | Wirkung                                      |
| ------------------ | -------------------------------------------- |
| `auto`             | Lokale Auto-TTS-Überschreibung (`always`, `off`, …) |
| `provider`         | Lokale Überschreibung des primären Providers |
| `persona`          | Lokale Persona-Überschreibung                |
| `maxLength`        | Schwellenwert für Zusammenfassungen (Standard `1500` Zeichen) |
| `summarize`        | Umschalter für Zusammenfassungen (Standard `true`) |

Diese überschreiben die effektive Konfiguration aus `messages.tts` plus dem aktiven
Block `agents.list[].tts` für diesen Host.

## Ausgabeformate (fest)

Die Auslieferung von TTS-Stimmen wird von den Kanalfähigkeiten bestimmt. Kanal-Plugins deklarieren,
ob sprachähnliches TTS Provider nach einem nativen `voice-note`-Ziel fragen soll oder
normale `audio-file`-Synthese beibehalten und nur kompatible Ausgabe für die
Sprachauslieferung markieren soll.

- **Kanäle mit Voice-Note-Unterstützung**: Voice-Note-Antworten bevorzugen Opus (`opus_48000_64` von ElevenLabs, `opus` von OpenAI).
  - 48 kHz / 64 kbps ist ein guter Kompromiss für Sprachnachrichten.
- **Feishu / WhatsApp**: Wenn eine Voice-Note-Antwort als MP3/WebM/WAV/M4A
  oder als eine andere wahrscheinliche Audiodatei erzeugt wird, transkodiert das
  Kanal-Plugin sie vor dem Senden der nativen Sprachnachricht mit `ffmpeg` in 48 kHz
  Ogg/Opus. WhatsApp sendet das Ergebnis über die Baileys-`audio`-Payload mit `ptt: true` und
  `audio/ogg; codecs=opus`. Falls die Konvertierung fehlschlägt, erhält Feishu die Originaldatei als Anhang;
  das Senden an WhatsApp schlägt fehl, anstatt eine inkompatible
  PTT-Payload zu posten.
- **BlueBubbles**: Behält die Provider-Synthese auf dem normalen Audio-File-Pfad; MP3-
  und CAF-Ausgaben werden für die Zustellung als iMessage-Voice-Memo markiert.
- **Andere Kanäle**: MP3 (`mp3_44100_128` von ElevenLabs, `mp3` von OpenAI).
  - 44,1 kHz / 128 kbps ist die Standardbalance für Sprachklarheit.
- **MiniMax**: MP3 (`speech-2.8-hd`-Modell, 32-kHz-Samplerate) für normale Audio-Anhänge. Für von Kanälen angekündigte Voice-Note-Ziele transkodiert OpenClaw die MiniMax-MP3 vor der Zustellung mit `ffmpeg` in 48-kHz-Opus, wenn der Kanal Transkodierung ankündigt.
- **Xiaomi MiMo**: Standardmäßig MP3 oder WAV, wenn konfiguriert. Für von Kanälen angekündigte Voice-Note-Ziele transkodiert OpenClaw die Xiaomi-Ausgabe vor der Zustellung mit `ffmpeg` in 48-kHz-Opus, wenn der Kanal Transkodierung ankündigt.
- **Local CLI**: Verwendet das konfigurierte `outputFormat`. Voice-Note-Ziele werden
  in Ogg/Opus konvertiert und Telephony-Ausgabe wird mit `ffmpeg` in rohes 16-kHz-Mono-PCM
  konvertiert.
- **Google Gemini**: Gemini-API-TTS gibt rohes 24-kHz-PCM zurück. OpenClaw verpackt es für Audio-Anhänge als WAV, transkodiert es für Voice-Note-Ziele in 48-kHz-Opus und gibt PCM direkt für Talk/Telephony zurück.
- **Gradium**: WAV für Audio-Anhänge, Opus für Voice-Note-Ziele und `ulaw_8000` bei 8 kHz für Telephony.
- **Inworld**: MP3 für normale Audio-Anhänge, natives `OGG_OPUS` für Voice-Note-Ziele und rohes `PCM` bei 22050 Hz für Talk/Telephony.
- **xAI**: Standardmäßig MP3; `responseFormat` kann `mp3`, `wav`, `pcm`, `mulaw` oder `alaw` sein. OpenClaw verwendet den Batch-REST-TTS-Endpunkt von xAI und gibt einen vollständigen Audio-Anhang zurück; der Streaming-TTS-WebSocket von xAI wird von diesem Provider-Pfad nicht verwendet. Das native Opus-Voice-Note-Format wird von diesem Pfad nicht unterstützt.
- **Microsoft**: Verwendet `microsoft.outputFormat` (Standard `audio-24khz-48kbitrate-mono-mp3`).
  - Der gebündelte Transport akzeptiert ein `outputFormat`, aber nicht alle Formate sind im Dienst verfügbar.
  - Werte für das Ausgabeformat folgen den Microsoft-Speech-Ausgabeformaten (einschließlich Ogg/WebM Opus).
  - Telegram `sendVoice` akzeptiert OGG/MP3/M4A; verwenden Sie OpenAI/ElevenLabs, wenn Sie
    garantierte Opus-Sprachnachrichten benötigen.
  - Wenn das konfigurierte Microsoft-Ausgabeformat fehlschlägt, versucht OpenClaw es erneut mit MP3.

Die Ausgabeformate von OpenAI/ElevenLabs sind pro Kanal festgelegt (siehe oben).

## Verhalten von Auto-TTS

Wenn `messages.tts.auto` aktiviert ist, führt OpenClaw Folgendes aus:

- Überspringt TTS, wenn die Antwort bereits Medien oder eine `MEDIA:`-Direktive enthält.
- Überspringt sehr kurze Antworten (unter 10 Zeichen).
- Fasst lange Antworten zusammen, wenn Zusammenfassungen aktiviert sind, unter Verwendung von
  `summaryModel` (oder `agents.defaults.model.primary`).
- Hängt das generierte Audio an die Antwort an.
- In `mode: "final"` sendet es für gestreamte finale Antworten weiterhin Audio-only-TTS,
  nachdem der Textstream abgeschlossen ist; die generierten Medien durchlaufen dieselbe
  Kanal-Mediennormalisierung wie normale Antwort-Anhänge.

Wenn die Antwort `maxLength` überschreitet und die Zusammenfassung deaktiviert ist (oder kein API-Schlüssel für das
Zusammenfassungsmodell vorhanden ist), wird Audio übersprungen und die normale Textantwort gesendet.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## Ausgabeformate nach Kanal

| Ziel                                  | Format                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Voice-Note-Antworten bevorzugen **Opus** (`opus_48000_64` von ElevenLabs, `opus` von OpenAI). 48 kHz / 64 kbps balanciert Klarheit und Größe. |
| Andere Kanäle                         | **MP3** (`mp3_44100_128` von ElevenLabs, `mp3` von OpenAI). 44,1 kHz / 128 kbps ist der Standard für Sprache.                         |
| Talk / Telephony                      | Provider-natives **PCM** (Inworld 22050 Hz, Google 24 kHz) oder `ulaw_8000` von Gradium für Telephony.                               |

Hinweise pro Provider:

- **Feishu / WhatsApp-Transkodierung:** Wenn eine Voice-Note-Antwort als MP3/WebM/WAV/M4A ankommt, transkodiert das Kanal-Plugin sie mit `ffmpeg` in 48-kHz-Ogg/Opus. WhatsApp sendet über Baileys mit `ptt: true` und `audio/ogg; codecs=opus`. Wenn die Konvertierung fehlschlägt: Feishu fällt auf das Anhängen der Originaldatei zurück; das Senden an WhatsApp schlägt fehl, anstatt eine inkompatible PTT-Payload zu posten.
- **MiniMax / Xiaomi MiMo:** Standardmäßig MP3 (32 kHz für MiniMax `speech-2.8-hd`); wird für Voice-Note-Ziele via `ffmpeg` in 48-kHz-Opus transkodiert.
- **Local CLI:** Verwendet das konfigurierte `outputFormat`. Voice-Note-Ziele werden in Ogg/Opus konvertiert und Telephony-Ausgabe in rohes 16-kHz-Mono-PCM.
- **Google Gemini:** Gibt rohes 24-kHz-PCM zurück. OpenClaw verpackt es für Anhänge als WAV, transkodiert es für Voice-Note-Ziele in 48-kHz-Opus und gibt PCM direkt für Talk/Telephony zurück.
- **Inworld:** MP3-Anhänge, natives `OGG_OPUS` für Voice-Notes, rohes `PCM` 22050 Hz für Talk/Telephony.
- **xAI:** Standardmäßig MP3; `responseFormat` kann `mp3|wav|pcm|mulaw|alaw` sein. Verwendet den Batch-REST-Endpunkt von xAI — Streaming-WebSocket-TTS wird **nicht** verwendet. Das native Opus-Voice-Note-Format wird **nicht** unterstützt.
- **Microsoft:** Verwendet `microsoft.outputFormat` (Standard `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` akzeptiert OGG/MP3/M4A; verwenden Sie OpenAI/ElevenLabs, wenn Sie garantierte Opus-Sprachnachrichten benötigen. Wenn das konfigurierte Microsoft-Format fehlschlägt, versucht OpenClaw es erneut mit MP3.

Die Ausgabeformate von OpenAI und ElevenLabs sind pro Kanal festgelegt, wie oben aufgeführt.

## Feldreferenz

<AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Auto-TTS-Modus. `inbound` sendet Audio nur nach einer eingehenden Sprachnachricht; `tagged` sendet Audio nur, wenn die Antwort `[[tts:...]]`-Direktiven oder einen `[[tts:text]]`-Block enthält.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Legacy-Umschalter. `openclaw doctor --fix` migriert dies zu `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` schließt Tool-/Block-Antworten zusätzlich zu finalen Antworten ein.
    </ParamField>
    <ParamField path="provider" type="string">
      Speech-Provider-ID. Wenn nicht gesetzt, verwendet OpenClaw den ersten konfigurierten Provider in der automatischen Auswahlliste der Registry. Legacy `provider: "edge"` wird von `openclaw doctor --fix` zu `"microsoft"` umgeschrieben.
    </ParamField>
    <ParamField path="persona" type="string">
      Aktive Persona-ID aus `personas`. Wird in Kleinbuchstaben normalisiert.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Stabile gesprochene Identität. Felder: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Siehe [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Günstiges Modell für automatische Zusammenfassungen; Standard ist `agents.defaults.model.primary`. Akzeptiert `provider/model` oder einen konfigurierten Modellalias.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Erlaubt dem Modell, TTS-Direktiven auszugeben. `enabled` ist standardmäßig `true`; `allowProvider` ist standardmäßig `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Provider-eigene Einstellungen, verschlüsselt nach Speech-Provider-ID. Legacy-Direktblöcke (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) werden von `openclaw doctor --fix` umgeschrieben; committen Sie nur `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Harte Obergrenze für TTS-Eingabezeichen. `/tts audio` schlägt fehl, wenn diese überschritten wird.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Anfrage-Timeout in Millisekunden.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Überschreibt den JSON-Pfad für lokale Präferenzen (Provider/Limit/Zusammenfassung). Standard `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` oder `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Azure-Speech-Region (z. B. `eastus`). Env: `AZURE_SPEECH_REGION` oder `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Optionale Überschreibung des Azure-Speech-Endpunkts (Alias `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">Azure-Voice-ShortName. Standard `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">SSML-Sprachcode. Standard `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure-`X-Microsoft-OutputFormat` für Standardaudio. Standard `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure-`X-Microsoft-OutputFormat` für Voice-Note-Ausgabe. Standard `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Fällt auf `ELEVENLABS_API_KEY` oder `XI_API_KEY` zurück.</ParamField>
    <ParamField path="model" type="string">Modell-ID (z. B. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">ElevenLabs-Voice-ID.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (jeweils `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normal).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Textnormalisierungsmodus.</ParamField>
    <ParamField path="languageCode" type="string">2-stelliger ISO-639-1-Code (z. B. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Ganzzahl `0..4294967295` für Best-Effort-Determinismus.</ParamField>
    <ParamField path="baseUrl" type="string">Überschreibt die Basis-URL der ElevenLabs-API.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Fällt auf `GEMINI_API_KEY` / `GOOGLE_API_KEY` zurück. Wenn nicht angegeben, kann TTS vor dem Env-Fallback `models.providers.google.apiKey` wiederverwenden.</ParamField>
    <ParamField path="model" type="string">Gemini-TTS-Modell. Standard `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Gemini-Name einer vorgefertigten Stimme. Standard `Kore`. Alias: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt für natürlichsprachigen Stil, der vor den gesprochenen Text gestellt wird.</ParamField>
    <ParamField path="speakerName" type="string">Optionales Sprecherlabel, das vor den gesprochenen Text gestellt wird, wenn Ihr Prompt einen benannten Sprecher verwendet.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Auf `audio-profile-v1` setzen, um aktive Persona-Prompt-Felder in eine deterministische Gemini-TTS-Prompt-Struktur zu kapseln.</ParamField>
    <ParamField path="personaPrompt" type="string">Google-spezifischer zusätzlicher Persona-Prompt-Text, der an die Director's Notes des Templates angehängt wird.</ParamField>
    <ParamField path="baseUrl" type="string">Es wird nur `https://generativelanguage.googleapis.com` akzeptiert.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standard `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Standard Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standard `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Standard `inworld-tts-1.5-max`. Außerdem: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Standard `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Sampling-Temperatur `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Lokale ausführbare Datei oder Befehlszeichenfolge für CLI-TTS.</ParamField>
    <ParamField path="args" type="string[]">Befehlsargumente. Unterstützt Platzhalter `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Erwartetes CLI-Ausgabeformat. Standard `mp3` für Audio-Anhänge.</ParamField>
    <ParamField path="timeoutMs" type="number">Befehls-Timeout in Millisekunden. Standard `120000`.</ParamField>
    <ParamField path="cwd" type="string">Optionales Arbeitsverzeichnis für den Befehl.</ParamField>
    <ParamField path="env" type="Record<string, string>">Optionale Umgebungsüberschreibungen für den Befehl.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (kein API-Schlüssel)">
    <ParamField path="enabled" type="boolean" default="true">Erlaubt die Nutzung von Microsoft Speech.</ParamField>
    <ParamField path="voice" type="string">Name der Microsoft-Neural-Stimme (z. B. `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Sprachcode (z. B. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft-Ausgabeformat. Standard `audio-24khz-48kbitrate-mono-mp3`. Nicht alle Formate werden vom gebündelten Edge-basierten Transport unterstützt.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Prozentzeichenfolgen (z. B. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Schreibt JSON-Untertitel neben die Audiodatei.</ParamField>
    <ParamField path="proxy" type="string">Proxy-URL für Microsoft-Speech-Anfragen.</ParamField>
    <ParamField path="timeoutMs" type="number">Überschreibung des Anfrage-Timeouts (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Legacy-Alias. Führen Sie `openclaw doctor --fix` aus, um persistierte Konfigurationen in `providers.microsoft` umzuschreiben.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Fällt auf `MINIMAX_API_KEY` zurück. Token-Plan-Authentifizierung über `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` oder `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standard `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Standard `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Standard `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Standard `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Standard `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Ganzzahl `-12..12`. Standard `0`. Nachkommastellen werden vor der Anfrage abgeschnitten.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Fällt auf `OPENAI_API_KEY` zurück.</ParamField>
    <ParamField path="model" type="string">OpenAI-TTS-Modell-ID (z. B. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Stimmenname (z. B. `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Explizites OpenAI-Feld `instructions`. Wenn gesetzt, werden Persona-Prompt-Felder **nicht** automatisch zugeordnet.</ParamField>
    <ParamField path="baseUrl" type="string">
      Überschreibt den OpenAI-TTS-Endpunkt. Auflösungsreihenfolge: Konfiguration → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Werte ungleich dem Standard werden als OpenAI-kompatible TTS-Endpunkte behandelt, daher werden benutzerdefinierte Modell- und Stimmennamen akzeptiert.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. Kann `models.providers.openrouter.apiKey` wiederverwenden.</ParamField>
    <ParamField path="baseUrl" type="string">Standard `https://openrouter.ai/api/v1`. Legacy-`https://openrouter.ai/v1` wird normalisiert.</ParamField>
    <ParamField path="model" type="string">Standard `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Standard `af_alloy`. Alias: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Standard `mp3`.</ParamField>
    <ParamField path="speed" type="number">Provider-native Geschwindigkeitsüberschreibung.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` oder `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Standard `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. Verwenden Sie `seed-tts-2.0`, wenn Ihr Projekt eine TTS-2.0-Berechtigung hat.</ParamField>
    <ParamField path="appKey" type="string">App-Key-Header. Standard `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Überschreibt den HTTP-Endpunkt für Seed-Speech-TTS. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Stimmtyp. Standard `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Provider-native Geschwindigkeitsrate.</ParamField>
    <ParamField path="emotion" type="string">Provider-native Emotionskennzeichnung.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Legacy-Felder der Volcengine Speech Console. Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (Standard `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standard `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Standard `eve`. Live-Stimmen: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">BCP-47-Sprachcode oder `auto`. Standard `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Standard `mp3`.</ParamField>
    <ParamField path="speed" type="number">Provider-native Geschwindigkeitsüberschreibung.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standard `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Standard `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. Unterstützt auch `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Standard `mimo_default`. Env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Standard `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Optionale Anweisung für natürlichsprachigen Stil, die als Benutzernachricht gesendet wird; sie wird nicht gesprochen.</ParamField>
  </Accordion>
</AccordionGroup>

## Agent-Tool

Das Tool `tts` wandelt Text in Sprache um und gibt einen Audio-Anhang für
die Antwortauslieferung zurück. Auf Feishu, Matrix, Telegram und WhatsApp wird das Audio
als Sprachnachricht statt als Dateianhang zugestellt. Feishu und
WhatsApp können auf diesem Pfad Nicht-Opus-TTS-Ausgabe transkodieren, wenn `ffmpeg`
verfügbar ist.

WhatsApp sendet Audio über Baileys als PTT-Sprachnotiz (`audio` mit
`ptt: true`) und sendet sichtbaren Text **getrennt** vom PTT-Audio, weil
Clients Untertitel bei Sprachnotizen nicht konsistent darstellen.

Das Tool akzeptiert optionale Felder `channel` und `timeoutMs`; `timeoutMs` ist ein
providerbezogenes Anfrage-Timeout pro Aufruf in Millisekunden.

## Gateway RPC

| Methode          | Zweck                                     |
| ---------------- | ----------------------------------------- |
| `tts.status`     | Aktuellen TTS-Status und letzten Versuch lesen. |
| `tts.enable`     | Lokale Auto-Präferenz auf `always` setzen. |
| `tts.disable`    | Lokale Auto-Präferenz auf `off` setzen.   |
| `tts.convert`    | Einmalig Text → Audio.                    |
| `tts.setProvider`| Lokale Provider-Präferenz setzen.         |
| `tts.setPersona` | Lokale Persona-Präferenz setzen.          |
| `tts.providers`  | Konfigurierte Provider und Status auflisten. |

## Service-Links

- [OpenAI-Leitfaden für Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech provider](/de/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/de/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/de/providers/volcengine#text-to-speech)
- [Xiaomi MiMo speech synthesis](/de/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI text to speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Verwandt

- [Medienübersicht](/de/tools/media-overview)
- [Musikgenerierung](/de/tools/music-generation)
- [Videogenerierung](/de/tools/video-generation)
- [Slash-Befehle](/de/tools/slash-commands)
- [Voice-call-Plugin](/de/plugins/voice-call)
