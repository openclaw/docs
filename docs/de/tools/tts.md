---
read_when:
    - Text-to-Speech für Antworten aktivieren
    - TTS-Provider oder Limits konfigurieren
    - '`/tts`-Befehle verwenden'
summary: Text-to-Speech (TTS) für ausgehende Antworten
title: Text-to-Speech (TTS)
x-i18n:
    generated_at: "2026-04-25T18:23:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c56c42f201139a7277153a6a1409ef9a288264e0702d2940b74b08ece385718
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw kann ausgehende Antworten mit ElevenLabs, Google Gemini, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI oder Xiaomi MiMo in Audio umwandeln.
Es funktioniert überall dort, wo OpenClaw Audio senden kann.

## Unterstützte Dienste

- **ElevenLabs** (primärer oder Fallback-Provider)
- **Google Gemini** (primärer oder Fallback-Provider; verwendet Gemini API TTS)
- **Gradium** (primärer oder Fallback-Provider; unterstützt Sprachnotizen und Telefonausgabe)
- **Local CLI** (primärer oder Fallback-Provider; führt einen konfigurierten lokalen TTS-Befehl aus)
- **Microsoft** (primärer oder Fallback-Provider; die aktuelle gebündelte Implementierung verwendet `node-edge-tts`)
- **MiniMax** (primärer oder Fallback-Provider; verwendet die T2A-v2-API)
- **OpenAI** (primärer oder Fallback-Provider; wird auch für Zusammenfassungen verwendet)
- **Vydra** (primärer oder Fallback-Provider; gemeinsamer Provider für Bilder, Video und Sprache)
- **xAI** (primärer oder Fallback-Provider; verwendet die xAI-TTS-API)
- **Xiaomi MiMo** (primärer oder Fallback-Provider; verwendet MiMo TTS über Xiaomi-Chat-Completions)

### Hinweise zu Microsoft Speech

Der gebündelte Microsoft-Speech-Provider verwendet derzeit Microsoft Edges
online verfügbaren neuralen TTS-Dienst über die Bibliothek `node-edge-tts`. Es ist ein gehosteter Dienst (nicht lokal), verwendet Microsoft-Endpunkte und benötigt keinen API-Key.
`node-edge-tts` stellt Konfigurationsoptionen für Speech und Ausgabeformate bereit, aber
nicht alle Optionen werden vom Dienst unterstützt. Alte Konfigurations- und Direktive-Eingaben
mit `edge` funktionieren weiterhin und werden zu `microsoft` normalisiert.

Da dieser Pfad ein öffentlicher Webdienst ohne veröffentlichte SLA oder Quote ist,
sollten Sie ihn als Best-Effort behandeln. Wenn Sie garantierte Limits und Support benötigen, verwenden Sie OpenAI
oder ElevenLabs.

## Optionale Schlüssel

Wenn Sie OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra, xAI oder Xiaomi MiMo verwenden möchten:

- `ELEVENLABS_API_KEY` (oder `XI_API_KEY`)
- `GEMINI_API_KEY` (oder `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`; MiniMax TTS akzeptiert außerdem Token-Plan-Authentifizierung über
  `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` oder
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI und Microsoft Speech benötigen **keinen** API-Key.

Wenn mehrere Provider konfiguriert sind, wird zuerst der ausgewählte Provider verwendet, die anderen dienen als Fallback-Optionen.
Die automatische Zusammenfassung verwendet das konfigurierte `summaryModel` (oder `agents.defaults.model.primary`),
daher muss dieser Provider ebenfalls authentifiziert sein, wenn Sie Zusammenfassungen aktivieren.

## Dienstlinks

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/de/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Xiaomi MiMo speech synthesis](/de/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Ist es standardmäßig aktiviert?

Nein. Auto‑TTS ist standardmäßig **deaktiviert**. Aktivieren Sie es in der Konfiguration mit
`messages.tts.auto` oder lokal mit `/tts on`.

Wenn `messages.tts.provider` nicht gesetzt ist, wählt OpenClaw den ersten konfigurierten
Speech-Provider in der automatischen Auswahlreihenfolge des Registers.

## Konfiguration

Die TTS-Konfiguration befindet sich unter `messages.tts` in `openclaw.json`.
Das vollständige Schema finden Sie unter [Gateway-Konfiguration](/de/gateway/configuration).

### Minimale Konfiguration (aktivieren + Provider)

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

### OpenAI als primärer Provider mit ElevenLabs als Fallback

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft als primärer Provider (kein API-Key)

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
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax als primärer Provider

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
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

Die Auflösung der MiniMax-TTS-Authentifizierung erfolgt in der Reihenfolge `messages.tts.providers.minimax.apiKey`, dann
gespeicherte `minimax-portal`-OAuth-/Token-Profile, dann Token-Plan-Umgebungsschlüssel
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`), dann `MINIMAX_API_KEY`. Wenn kein explizites TTS-
`baseUrl` gesetzt ist, kann OpenClaw den konfigurierten `minimax-portal`-OAuth-
Host für Token-Plan-Speech wiederverwenden.

### Google Gemini als primärer Provider

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google-Gemini-TTS verwendet den API-Key-Pfad von Gemini. Ein Google-Cloud-Console-API-Key,
der auf die Gemini API beschränkt ist, ist hier gültig und entspricht dem Stil des Schlüssels,
der vom gebündelten Google-Provider für Bildgenerierung verwendet wird. Die Auflösungsreihenfolge ist
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI als primärer Provider

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS verwendet denselben `XAI_API_KEY`-Pfad wie der gebündelte Grok-Modell-Provider.
Die Auflösungsreihenfolge ist `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Aktuelle Live-Stimmen sind `ara`, `eve`, `leo`, `rex`, `sal` und `una`; `eve` ist
der Standard. `language` akzeptiert ein BCP-47-Tag oder `auto`.

### Xiaomi MiMo als primärer Provider

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Heller, natürlicher, konversationeller Ton.",
        },
      },
    },
  },
}
```

Xiaomi-MiMo-TTS verwendet denselben `XIAOMI_API_KEY`-Pfad wie der gebündelte Xiaomi-Modell-
Provider. Die Speech-Provider-ID ist `xiaomi`; `mimo` wird als Alias akzeptiert.
Der Zieltext wird als Assistant-Nachricht gesendet, passend zum TTS-
Vertrag von Xiaomi. Optionales `style` wird als Benutzeranweisung gesendet und nicht gesprochen.

### OpenRouter als primärer Provider

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

OpenRouter-TTS verwendet denselben `OPENROUTER_API_KEY`-Pfad wie der gebündelte
OpenRouter-Modell-Provider. Die Auflösungsreihenfolge ist
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`.

### Local CLI als primärer Provider

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

Local-CLI-TTS führt den konfigurierten Befehl auf dem Gateway-Host aus. Die Platzhalter `{{Text}}`,
`{{OutputPath}}`, `{{OutputDir}}` und `{{OutputBase}}` werden in `args`
erweitert; wenn kein Platzhalter `{{Text}}` vorhanden ist, schreibt OpenClaw den
gesprochenen Text nach stdin. `outputFormat` akzeptiert `mp3`, `opus` oder `wav`.
Ziele für Sprachnotizen werden in Ogg/Opus transkodiert, und Telefonausgabe wird
mit `ffmpeg` in rohes 16-kHz-Mono-PCM transkodiert. Der alte Provider-Alias
`cli` funktioniert weiterhin, aber neue Konfiguration sollte `tts-local-cli` verwenden.

### Gradium als primärer Provider

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

### Microsoft Speech deaktivieren

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Eigene Limits + Pfad für Präferenzen

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Nur nach einer eingehenden Sprachnachricht mit Audio antworten

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Automatische Zusammenfassung für lange Antworten deaktivieren

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Führen Sie dann aus:

```
/tts summary off
```

### Hinweise zu Feldern

- `auto`: Auto‑TTS-Modus (`off`, `always`, `inbound`, `tagged`).
  - `inbound` sendet Audio nur nach einer eingehenden Sprachnachricht.
  - `tagged` sendet Audio nur, wenn die Antwort `[[tts:key=value]]`-Direktiven oder einen `[[tts:text]]...[[/tts:text]]`-Block enthält.
- `enabled`: veralteter Schalter (doctor migriert dies zu `auto`).
- `mode`: `"final"` (Standard) oder `"all"` (einschließlich Tool-/Block-Antworten).
- `provider`: Speech-Provider-ID wie `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"` oder `"xiaomi"` (Fallback erfolgt automatisch).
- Wenn `provider` **nicht gesetzt** ist, verwendet OpenClaw den ersten konfigurierten Speech-Provider in der automatischen Auswahlreihenfolge des Registers.
- Veraltete Konfiguration `provider: "edge"` wird durch `openclaw doctor --fix` repariert und
  zu `provider: "microsoft"` umgeschrieben.
- `summaryModel`: optionales günstiges Modell für automatische Zusammenfassung; standardmäßig `agents.defaults.model.primary`.
  - Akzeptiert `provider/model` oder einen konfigurierten Modell-Alias.
- `modelOverrides`: erlaubt dem Modell, TTS-Direktiven auszugeben (standardmäßig aktiviert).
  - `allowProvider` ist standardmäßig `false` (Provider-Wechsel ist Opt-in).
- `providers.<id>`: provider-eigene Einstellungen, nach Speech-Provider-ID verschlüsselt.
- Veraltete direkte Provider-Blöcke (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) werden durch `openclaw doctor --fix` repariert; festgeschriebene Konfiguration sollte `messages.tts.providers.<id>` verwenden.
- Veraltetes `messages.tts.providers.edge` wird ebenfalls durch `openclaw doctor --fix` repariert; festgeschriebene Konfiguration sollte `messages.tts.providers.microsoft` verwenden.
- `maxTextLength`: harte Obergrenze für TTS-Eingaben (Zeichen). `/tts audio` schlägt fehl, wenn sie überschritten wird.
- `timeoutMs`: Request-Timeout (ms).
- `prefsPath`: überschreibt den lokalen JSON-Pfad für Präferenzen (Provider/Limit/Zusammenfassung).
- `apiKey`-Werte greifen auf Env-Vars zurück (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`).
- `providers.elevenlabs.baseUrl`: überschreibt die Basis-URL der ElevenLabs-API.
- `providers.openai.baseUrl`: überschreibt den OpenAI-TTS-Endpunkt.
  - Auflösungsreihenfolge: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Nicht standardmäßige Werte werden als OpenAI-kompatible TTS-Endpunkte behandelt, daher werden benutzerdefinierte Modell- und Stimmnamen akzeptiert.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-stelliger ISO-639-1-Code (z. B. `en`, `de`)
- `providers.elevenlabs.seed`: Ganzzahl `0..4294967295` (Best-Effort-Determinismus)
- `providers.minimax.baseUrl`: überschreibt die MiniMax-API-Basis-URL (Standard `https://api.minimax.io`, Env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS-Modell (Standard `speech-2.8-hd`, Env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: Stimmenkennung (Standard `English_expressive_narrator`, Env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: Wiedergabegeschwindigkeit `0.5..2.0` (Standard 1.0).
- `providers.minimax.vol`: Lautstärke `(0, 10]` (Standard 1.0; muss größer als 0 sein).
- `providers.minimax.pitch`: ganzzahliger Pitch-Shift `-12..12` (Standard 0). Werte mit Nachkommastellen werden vor dem Aufruf von MiniMax T2A abgeschnitten, da die API keine nicht ganzzahligen Pitch-Werte akzeptiert.
- `providers.tts-local-cli.command`: lokales ausführbares Programm oder Befehlszeichenfolge für CLI-TTS.
- `providers.tts-local-cli.args`: Befehlsargumente; unterstützt die Platzhalter `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` und `{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat`: erwartetes CLI-Ausgabeformat (`mp3`, `opus` oder `wav`; Standard `mp3` für Audioanhänge).
- `providers.tts-local-cli.timeoutMs`: Befehlstimeout in Millisekunden (Standard `120000`).
- `providers.tts-local-cli.cwd`: optionales Arbeitsverzeichnis des Befehls.
- `providers.tts-local-cli.env`: optionale String-Umgebungsüberschreibungen für den Befehl.
- `providers.google.model`: Gemini-TTS-Modell (Standard `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: vordefinierter Gemini-Stimmenname (Standard `Kore`; `voice` wird ebenfalls akzeptiert).
- `providers.google.audioProfile`: Prompt im Stil natürlicher Sprache, der dem gesprochenen Text vorangestellt wird.
- `providers.google.speakerName`: optionales Sprecherlabel, das dem gesprochenen Text vorangestellt wird, wenn Ihr TTS-Prompt einen benannten Sprecher verwendet.
- `providers.google.baseUrl`: überschreibt die Gemini-API-Basis-URL. Es wird nur `https://generativelanguage.googleapis.com` akzeptiert.
  - Wenn `messages.tts.providers.google.apiKey` weggelassen wird, kann TTS vor dem Env-Fallback `models.providers.google.apiKey` wiederverwenden.
- `providers.gradium.baseUrl`: überschreibt die Gradium-API-Basis-URL (Standard `https://api.gradium.ai`).
- `providers.gradium.voiceId`: Gradium-Stimmenkennung (Standard Emma, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: xAI-TTS-API-Key (Env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: überschreibt die xAI-TTS-Basis-URL (Standard `https://api.x.ai/v1`, Env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: xAI-Stimmen-ID (Standard `eve`; aktuelle Live-Stimmen: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: BCP-47-Sprachcode oder `auto` (Standard `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` oder `alaw` (Standard `mp3`).
- `providers.xai.speed`: provider-native Überschreibung der Geschwindigkeit.
- `providers.xiaomi.apiKey`: Xiaomi-MiMo-API-Key (Env: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: überschreibt die Xiaomi-MiMo-API-Basis-URL (Standard `https://api.xiaomimimo.com/v1`, Env: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: TTS-Modell (Standard `mimo-v2.5-tts`, Env: `XIAOMI_TTS_MODEL`; `mimo-v2-tts` wird ebenfalls unterstützt).
- `providers.xiaomi.voice`: MiMo-Stimmen-ID (Standard `mimo_default`, Env: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` oder `wav` (Standard `mp3`, Env: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: optionale Stil-Anweisung in natürlicher Sprache, die als Benutzernachricht gesendet wird; sie wird nicht gesprochen.
- `providers.openrouter.apiKey`: OpenRouter-API-Key (Env: `OPENROUTER_API_KEY`; kann `models.providers.openrouter.apiKey` wiederverwenden).
- `providers.openrouter.baseUrl`: überschreibt die OpenRouter-TTS-Basis-URL (Standard `https://openrouter.ai/api/v1`; das alte `https://openrouter.ai/v1` wird normalisiert).
- `providers.openrouter.model`: OpenRouter-TTS-Modell-ID (Standard `hexgrad/kokoro-82m`; `modelId` wird ebenfalls akzeptiert).
- `providers.openrouter.voice`: provider-spezifische Stimmen-ID (Standard `af_alloy`; `voiceId` wird ebenfalls akzeptiert).
- `providers.openrouter.responseFormat`: `mp3` oder `pcm` (Standard `mp3`).
- `providers.openrouter.speed`: provider-native Überschreibung der Geschwindigkeit.
- `providers.microsoft.enabled`: erlaubt die Nutzung von Microsoft Speech (Standard `true`; kein API-Key).
- `providers.microsoft.voice`: Name der Microsoft-Neural-Stimme (z. B. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: Sprachcode (z. B. `en-US`).
- `providers.microsoft.outputFormat`: Microsoft-Ausgabeformat (z. B. `audio-24khz-48kbitrate-mono-mp3`).
  - Gültige Werte finden Sie unter Microsoft Speech output formats; nicht alle Formate werden vom gebündelten, Edge-gestützten Transport unterstützt.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: Prozentzeichenfolgen (z. B. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: schreibt JSON-Untertitel zusammen mit der Audiodatei.
- `providers.microsoft.proxy`: Proxy-URL für Microsoft-Speech-Requests.
- `providers.microsoft.timeoutMs`: überschreibt das Request-Timeout (ms).
- `edge.*`: veralteter Alias für dieselben Microsoft-Einstellungen. Führen Sie
  `openclaw doctor --fix` aus, um festgeschriebene Konfiguration in `providers.microsoft` umzuschreiben.

## Modellgesteuerte Überschreibungen (standardmäßig aktiviert)

Standardmäßig **kann** das Modell TTS-Direktiven für eine einzelne Antwort ausgeben.
Wenn `messages.tts.auto` auf `tagged` steht, sind diese Direktiven erforderlich, um Audio auszulösen.

Wenn aktiviert, kann das Modell `[[tts:...]]`-Direktiven ausgeben, um die Stimme
für eine einzelne Antwort zu überschreiben, plus optional einen `[[tts:text]]...[[/tts:text]]`-Block, um
ausdrucksstarke Tags (Lachen, Singhinweise usw.) bereitzustellen, die nur im
Audio erscheinen sollen.

Direktiven `provider=...` werden ignoriert, sofern nicht `modelOverrides.allowProvider: true` gesetzt ist.

Beispiel für eine Antwort-Payload:

```
Hier ist es.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](lacht) Lies das Lied noch einmal.[[/tts:text]]
```

Verfügbare Direktivschlüssel (wenn aktiviert):

- `provider` (registrierte Speech-Provider-ID, z. B. `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai` oder `xiaomi`; erfordert `allowProvider: true`)
- `voice` (OpenAI-, Gradium- oder Xiaomi-Stimme), `voiceName` / `voice_name` / `google_voice` (Google-Stimme) oder `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (OpenAI-TTS-Modell, ElevenLabs-Modell-ID, MiniMax-Modell oder Xiaomi-MiMo-TTS-Modell) oder `google_model` (Google-TTS-Modell)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax-Lautstärke, 0-10)
- `pitch` (ganzzahliger MiniMax-Pitch, -12 bis 12; Werte mit Nachkommastellen werden vor der MiniMax-Request abgeschnitten)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Alle modellgesteuerten Überschreibungen deaktivieren:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Optionale Allowlist (Provider-Wechsel aktivieren, während andere Regler konfigurierbar bleiben):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Präferenzen pro Benutzer

Slash-Befehle schreiben lokale Überschreibungen in `prefsPath` (Standard:
`~/.openclaw/settings/tts.json`, überschreibbar mit `OPENCLAW_TTS_PREFS` oder
`messages.tts.prefsPath`).

Gespeicherte Felder:

- `enabled`
- `provider`
- `maxLength` (Schwellenwert für Zusammenfassungen; Standard 1500 Zeichen)
- `summarize` (Standard `true`)

Diese überschreiben `messages.tts.*` für diesen Host.

## Ausgabeformate (festgelegt)

- **Feishu / Matrix / Telegram / WhatsApp**: Antworten als Sprachnotizen bevorzugen Opus (`opus_48000_64` von ElevenLabs, `opus` von OpenAI).
  - 48 kHz / 64 kbps ist ein guter Kompromiss für Sprachmitteilungen.
- **Feishu**: Wenn eine Sprachnotiz-Antwort als MP3/WAV/M4A oder in einem anderen
  wahrscheinlichen Audiodateiformat erzeugt wird, transkodiert das Feishu-Plugin sie vor dem Senden der nativen `audio`-Bubble mit `ffmpeg` in 48 kHz Ogg/Opus. Wenn die Konvertierung fehlschlägt, erhält Feishu
  die Originaldatei als Anhang.
- **Andere Kanäle**: MP3 (`mp3_44100_128` von ElevenLabs, `mp3` von OpenAI).
  - 44,1 kHz / 128 kbps ist die Standardbalance für Sprachverständlichkeit.
- **MiniMax**: MP3 (Modell `speech-2.8-hd`, 32-kHz-Samplerate) für normale Audioanhänge. Für Ziele mit Sprachnotizen wie Feishu und Telegram transkodiert OpenClaw das MiniMax-MP3 vor der Zustellung mit `ffmpeg` in 48-kHz-Opus.
- **Xiaomi MiMo**: Standardmäßig MP3 oder WAV, wenn konfiguriert. Für Ziele mit Sprachnotizen wie Feishu und Telegram transkodiert OpenClaw Xiaomi-Ausgabe vor der Zustellung mit `ffmpeg` in 48-kHz-Opus.
- **Local CLI**: verwendet das konfigurierte `outputFormat`. Ziele mit Sprachnotizen werden
  in Ogg/Opus konvertiert und Telefonausgabe wird mit `ffmpeg` in rohes 16-kHz-Mono-PCM
  umgewandelt.
- **Google Gemini**: Gemini API TTS gibt rohes 24-kHz-PCM zurück. OpenClaw verpackt es für Audioanhänge als WAV und gibt PCM für Talk/Telefonie direkt zurück. Das native Opus-Format für Sprachnotizen wird von diesem Pfad nicht unterstützt.
- **Gradium**: WAV für Audioanhänge, Opus für Ziele mit Sprachnotizen und `ulaw_8000` mit 8 kHz für Telefonie.
- **xAI**: Standardmäßig MP3; `responseFormat` kann `mp3`, `wav`, `pcm`, `mulaw` oder `alaw` sein. OpenClaw verwendet den Batch-REST-TTS-Endpunkt von xAI und gibt einen vollständigen Audioanhang zurück; xAIs Streaming-TTS-WebSocket wird von diesem Providerpfad nicht verwendet. Das native Opus-Format für Sprachnotizen wird von diesem Pfad nicht unterstützt.
- **Microsoft**: verwendet `microsoft.outputFormat` (Standard `audio-24khz-48kbitrate-mono-mp3`).
  - Der gebündelte Transport akzeptiert ein `outputFormat`, aber nicht alle Formate sind im Dienst verfügbar.
  - Die Werte für `outputFormat` folgen Microsoft Speech output formats (einschließlich Ogg/WebM Opus).
  - Telegram `sendVoice` akzeptiert OGG/MP3/M4A; verwenden Sie OpenAI/ElevenLabs, wenn Sie
    garantierte Opus-Sprachnachrichten benötigen.
  - Wenn das konfigurierte Microsoft-Ausgabeformat fehlschlägt, versucht OpenClaw es erneut mit MP3.

Die Ausgabeformate von OpenAI/ElevenLabs sind pro Kanal festgelegt (siehe oben).

## Verhalten von Auto-TTS

Wenn aktiviert, führt OpenClaw Folgendes aus:

- TTS überspringen, wenn die Antwort bereits Medien oder eine `MEDIA:`-Direktive enthält.
- sehr kurze Antworten überspringen (< 10 Zeichen).
- lange Antworten zusammenfassen, wenn aktiviert, unter Verwendung von `agents.defaults.model.primary` (oder `summaryModel`).
- das erzeugte Audio an die Antwort anhängen.

Wenn die Antwort `maxLength` überschreitet und die Zusammenfassung deaktiviert ist (oder kein API-Key für das
Zusammenfassungsmodell vorhanden ist), wird Audio
übersprungen und die normale Textantwort gesendet.

## Ablaufdiagramm

```
Antwort -> TTS aktiviert?
  nein -> Text senden
  ja   -> hat Medien / MEDIA: / kurz?
          ja   -> Text senden
          nein -> Länge > Limit?
                   nein -> TTS -> Audio anhängen
                   ja   -> Zusammenfassung aktiviert?
                            nein -> Text senden
                            ja   -> zusammenfassen (summaryModel oder agents.defaults.model.primary)
                                      -> TTS -> Audio anhängen
```

## Verwendung von Slash-Befehlen

Es gibt einen einzelnen Befehl: `/tts`.
Details zur Aktivierung finden Sie unter [Slash-Befehle](/de/tools/slash-commands).

Hinweis zu Discord: `/tts` ist dort ein integrierter Discord-Befehl, daher registriert OpenClaw
stattdessen `/voice` als nativen Befehl. Text `/tts ...` funktioniert weiterhin.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Hinweise:

- Befehle erfordern einen autorisierten Sender (Allowlist-/Owner-Regeln gelten weiterhin).
- `commands.text` oder die Registrierung nativer Befehle muss aktiviert sein.
- Die Konfiguration `messages.tts.auto` akzeptiert `off|always|inbound|tagged`.
- `/tts on` schreibt die lokale TTS-Präferenz auf `always`; `/tts off` schreibt sie auf `off`.
- Verwenden Sie die Konfiguration, wenn Sie standardmäßig `inbound` oder `tagged` möchten.
- `limit` und `summary` werden in lokalen Präferenzen gespeichert, nicht in der Hauptkonfiguration.
- `/tts audio` erzeugt eine einmalige Audioantwort (aktiviert TTS nicht).
- `/tts status` enthält die Sichtbarkeit des Fallbacks für den letzten Versuch:
  - erfolgreiches Fallback: `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - Fehler: `Error: ...` plus `Attempts: ...`
  - detaillierte Diagnose: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI- und ElevenLabs-API-Fehler enthalten jetzt geparste Provider-Fehlerdetails und Request-ID (wenn vom Provider zurückgegeben), was in TTS-Fehlern/Logs sichtbar gemacht wird.

## Agent-Tool

Das Tool `tts` konvertiert Text in Sprache und gibt einen Audioanhang für die
Antwortzustellung zurück. Wenn der Kanal Feishu, Matrix, Telegram oder WhatsApp ist,
wird das Audio als Sprachmitteilung statt als Dateianhang zugestellt.
Feishu kann auf diesem Pfad Ausgaben von TTS, die nicht Opus sind, transkodieren, wenn `ffmpeg`
verfügbar ist.
WhatsApp sendet sichtbaren Text getrennt von PTT-Sprachnotiz-Audio, weil Clients
Beschriftungen bei Sprachnotizen nicht konsistent rendern.
Es akzeptiert optionale Felder `channel` und `timeoutMs`; `timeoutMs` ist ein
providerbezogenes Request-Timeout pro Aufruf in Millisekunden.

## Gateway RPC

Gateway-Methoden:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Verwandte Inhalte

- [Medienübersicht](/de/tools/media-overview)
- [Musikerzeugung](/de/tools/music-generation)
- [Videoerzeugung](/de/tools/video-generation)
