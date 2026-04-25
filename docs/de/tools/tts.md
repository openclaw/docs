---
read_when:
    - Aktivieren von Text-to-Speech für Antworten
    - Konfigurieren von TTS-Anbietern oder Begrenzungen
    - Verwendung von `/tts`-Befehlen
summary: Text-to-Speech (TTS) für ausgehende Antworten
title: Text-to-Speech
x-i18n:
    generated_at: "2026-04-25T13:59:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0038157f631a308c8ff7f0eef9db2b2d686cd417c525ac37b9d21097c34d9b6a
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw kann ausgehende Antworten mit ElevenLabs, Google Gemini, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI oder Xiaomi MiMo in Audio umwandeln.
Es funktioniert überall dort, wo OpenClaw Audio senden kann.

## Unterstützte Dienste

- **ElevenLabs** (primärer oder Fallback-Anbieter)
- **Google Gemini** (primärer oder Fallback-Anbieter; verwendet Gemini API TTS)
- **Gradium** (primärer oder Fallback-Anbieter; unterstützt Sprachnachrichten- und Telefonie-Ausgabe)
- **Local CLI** (primärer oder Fallback-Anbieter; führt einen konfigurierten lokalen TTS-Befehl aus)
- **Microsoft** (primärer oder Fallback-Anbieter; die aktuelle mitgelieferte Implementierung verwendet `node-edge-tts`)
- **MiniMax** (primärer oder Fallback-Anbieter; verwendet die T2A-v2-API)
- **OpenAI** (primärer oder Fallback-Anbieter; wird auch für Zusammenfassungen verwendet)
- **Vydra** (primärer oder Fallback-Anbieter; gemeinsamer Anbieter für Bilder, Videos und Sprache)
- **xAI** (primärer oder Fallback-Anbieter; verwendet die xAI-TTS-API)
- **Xiaomi MiMo** (primärer oder Fallback-Anbieter; verwendet MiMo TTS über Xiaomi-Chat-Completions)

### Hinweise zu Microsoft Speech

Der mitgelieferte Microsoft-Speech-Anbieter verwendet derzeit den Online-
neuralen TTS-Dienst von Microsoft Edge über die Bibliothek `node-edge-tts`. Es ist ein gehosteter Dienst (nicht
lokal), verwendet Microsoft-Endpunkte und erfordert keinen API-Key.
`node-edge-tts` stellt Sprachkonfigurationsoptionen und Ausgabeformate bereit, aber
nicht alle Optionen werden vom Dienst unterstützt. Veraltete Konfigurationen und Direktiven-Eingaben
mit `edge` funktionieren weiterhin und werden auf `microsoft` normalisiert.

Da dieser Pfad ein öffentlicher Webdienst ohne veröffentlichte SLA oder Kontingentierung ist,
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

Wenn mehrere Anbieter konfiguriert sind, wird zuerst der ausgewählte Anbieter verwendet, und die anderen dienen als Fallback-Optionen.
Die automatische Zusammenfassung verwendet das konfigurierte `summaryModel` (oder `agents.defaults.model.primary`),
daher muss auch dieser Anbieter authentifiziert sein, wenn Sie Zusammenfassungen aktivieren.

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
Sprachanbieter in der automatischen Auswahlreihenfolge des Registry.

## Konfiguration

Die TTS-Konfiguration befindet sich unter `messages.tts` in `openclaw.json`.
Das vollständige Schema finden Sie unter [Gateway configuration](/de/gateway/configuration).

### Minimale Konfiguration (aktivieren + Anbieter)

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

### OpenAI als primärer Anbieter mit ElevenLabs als Fallback

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

### Microsoft als primärer Anbieter (kein API-Key)

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

### MiniMax als primärer Anbieter

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

Die Authentifizierungsauflösung für MiniMax TTS erfolgt über `messages.tts.providers.minimax.apiKey`, dann über
gespeicherte OAuth-/Token-Profile für `minimax-portal`, dann über Token-Plan-Umgebungsvariablen
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`), dann über `MINIMAX_API_KEY`. Wenn kein explizites TTS-
`baseUrl` gesetzt ist, kann OpenClaw den konfigurierten OAuth-
Host von `minimax-portal` für Token-Plan-Sprache wiederverwenden.

### Google Gemini als primärer Anbieter

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

Google Gemini TTS verwendet den Gemini-API-Key-Pfad. Ein API-Key aus der Google Cloud Console,
der auf die Gemini API beschränkt ist, ist hier gültig, und es ist derselbe Typ Schlüssel, der
vom mitgelieferten Google-Anbieter für Bildgenerierung verwendet wird. Die Auflösungsreihenfolge lautet
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI als primärer Anbieter

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

xAI TTS verwendet denselben `XAI_API_KEY`-Pfad wie der mitgelieferte Grok-Modellanbieter.
Die Auflösungsreihenfolge lautet `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Aktuelle Live-Stimmen sind `ara`, `eve`, `leo`, `rex`, `sal` und `una`; `eve` ist
der Standard. `language` akzeptiert ein BCP-47-Tag oder `auto`.

### Xiaomi MiMo als primärer Anbieter

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
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS verwendet denselben `XIAOMI_API_KEY`-Pfad wie der mitgelieferte Xiaomi-Modell-
anbieter. Die Speech-Provider-ID ist `xiaomi`; `mimo` wird als Alias akzeptiert.
Der Zieltext wird als Assistenten-Nachricht gesendet, entsprechend Xiaomis TTS-
Vertrag. Optionales `style` wird als Benutzeranweisung gesendet und nicht gesprochen.

### OpenRouter als primärer Anbieter

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

OpenRouter TTS verwendet denselben `OPENROUTER_API_KEY`-Pfad wie der mitgelieferte
OpenRouter-Modellanbieter. Die Auflösungsreihenfolge lautet
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`.

### Local CLI als primärer Anbieter

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

Local CLI TTS führt den konfigurierten Befehl auf dem Gateway-Host aus. Die Platzhalter
`{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` und `{{OutputBase}}` werden
in `args` erweitert; wenn kein Platzhalter `{{Text}}` vorhanden ist, schreibt OpenClaw den
zu sprechenden Text nach stdin. `outputFormat` akzeptiert `mp3`, `opus` oder `wav`.
Ziele für Sprachnachrichten werden nach Ogg/Opus transkodiert und Telefonie-Ausgabe wird mit `ffmpeg` nach rohem 16-kHz-Mono-PCM transkodiert. Der veraltete Anbieter-Alias
`cli` funktioniert weiterhin, aber neue Konfigurationen sollten `tts-local-cli` verwenden.

### Gradium als primärer Anbieter

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

### Benutzerdefinierte Limits + Pfad für Einstellungen

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

Dann ausführen:

```
/tts summary off
```

### Hinweise zu Feldern

- `auto`: Auto‑TTS-Modus (`off`, `always`, `inbound`, `tagged`).
  - `inbound` sendet Audio nur nach einer eingehenden Sprachnachricht.
  - `tagged` sendet Audio nur, wenn die Antwort Direktiven `[[tts:key=value]]` oder einen Block `[[tts:text]]...[[/tts:text]]` enthält.
- `enabled`: veralteter Schalter (doctor migriert dies zu `auto`).
- `mode`: `"final"` (Standard) oder `"all"` (einschließlich Tool-/Block-Antworten).
- `provider`: Speech-Provider-ID wie `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"` oder `"xiaomi"` (Fallback erfolgt automatisch).
- Wenn `provider` **nicht gesetzt** ist, verwendet OpenClaw den ersten konfigurierten Speech-Provider in der automatischen Auswahlreihenfolge des Registry.
- Veraltete Konfiguration `provider: "edge"` wird von `openclaw doctor --fix` repariert und
  zu `provider: "microsoft"` umgeschrieben.
- `summaryModel`: optionales günstiges Modell für die automatische Zusammenfassung; Standard ist `agents.defaults.model.primary`.
  - Akzeptiert `provider/model` oder einen konfigurierten Modell-Alias.
- `modelOverrides`: erlaubt dem Modell, TTS-Direktiven auszugeben (standardmäßig aktiviert).
  - `allowProvider` ist standardmäßig `false` (Provider-Wechsel ist Opt-in).
- `providers.<id>`: anbieterbezogene Einstellungen, verschlüsselt nach Speech-Provider-ID.
- Veraltete direkte Provider-Blöcke (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) werden von `openclaw doctor --fix` repariert; eingecheckte Konfiguration sollte `messages.tts.providers.<id>` verwenden.
- Das veraltete `messages.tts.providers.edge` wird ebenfalls von `openclaw doctor --fix` repariert; eingecheckte Konfiguration sollte `messages.tts.providers.microsoft` verwenden.
- `maxTextLength`: harte Obergrenze für TTS-Eingaben (Zeichen). `/tts audio` schlägt fehl, wenn sie überschritten wird.
- `timeoutMs`: Anfrage-Timeout (ms).
- `prefsPath`: überschreibt den lokalen JSON-Pfad für Einstellungen (Provider/Limit/Zusammenfassung).
- `apiKey`-Werte greifen auf Umgebungsvariablen zurück (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`).
- `providers.elevenlabs.baseUrl`: überschreibt die Basis-URL der ElevenLabs-API.
- `providers.openai.baseUrl`: überschreibt den OpenAI-TTS-Endpunkt.
  - Auflösungsreihenfolge: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Nicht standardmäßige Werte werden als OpenAI-kompatible TTS-Endpunkte behandelt, daher werden benutzerdefinierte Modell- und Stimmmnamen akzeptiert.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-stelliger ISO-639-1-Code (z. B. `en`, `de`)
- `providers.elevenlabs.seed`: Ganzzahl `0..4294967295` (Best-Effort-Determinismus)
- `providers.minimax.baseUrl`: überschreibt die MiniMax-API-Basis-URL (Standard `https://api.minimax.io`, Umgebungsvariable: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS-Modell (Standard `speech-2.8-hd`, Umgebungsvariable: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: Stimmenbezeichner (Standard `English_expressive_narrator`, Umgebungsvariable: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: Wiedergabegeschwindigkeit `0.5..2.0` (Standard 1.0).
- `providers.minimax.vol`: Lautstärke `(0, 10]` (Standard 1.0; muss größer als 0 sein).
- `providers.minimax.pitch`: ganzzahlige Tonhöhenverschiebung `-12..12` (Standard 0). Werte mit Nachkommastellen werden vor dem Aufruf von MiniMax T2A abgeschnitten, da die API keine nicht-ganzzahligen Tonhöhenwerte akzeptiert.
- `providers.tts-local-cli.command`: lokale ausführbare Datei oder Befehlszeichenfolge für CLI-TTS.
- `providers.tts-local-cli.args`: Befehlsargumente; unterstützt die Platzhalter `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` und `{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat`: erwartetes CLI-Ausgabeformat (`mp3`, `opus` oder `wav`; Standard `mp3` für Audioanhänge).
- `providers.tts-local-cli.timeoutMs`: Befehls-Timeout in Millisekunden (Standard `120000`).
- `providers.tts-local-cli.cwd`: optionales Arbeitsverzeichnis des Befehls.
- `providers.tts-local-cli.env`: optionale String-Umgebungsüberschreibungen für den Befehl.
- `providers.google.model`: Gemini-TTS-Modell (Standard `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: vordefinierter Gemini-Stimmenname (Standard `Kore`; `voice` wird ebenfalls akzeptiert).
- `providers.google.audioProfile`: natürlichsprachiger Stil-Prompt, der vor den gesprochenen Text gesetzt wird.
- `providers.google.speakerName`: optionales Sprecher-Label, das vor den gesprochenen Text gesetzt wird, wenn Ihr TTS-Prompt einen benannten Sprecher verwendet.
- `providers.google.baseUrl`: überschreibt die Basis-URL der Gemini-API. Es wird nur `https://generativelanguage.googleapis.com` akzeptiert.
  - Wenn `messages.tts.providers.google.apiKey` weggelassen wird, kann TTS vor dem Fallback auf Umgebungsvariablen `models.providers.google.apiKey` wiederverwenden.
- `providers.gradium.baseUrl`: überschreibt die Gradium-API-Basis-URL (Standard `https://api.gradium.ai`).
- `providers.gradium.voiceId`: Gradium-Stimmenbezeichner (Standard Emma, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: xAI-TTS-API-Key (Umgebungsvariable: `XAI_API_KEY`).
- `providers.xai.baseUrl`: überschreibt die xAI-TTS-Basis-URL (Standard `https://api.x.ai/v1`, Umgebungsvariable: `XAI_BASE_URL`).
- `providers.xai.voiceId`: xAI-Stimmen-ID (Standard `eve`; aktuelle Live-Stimmen: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: BCP-47-Sprachcode oder `auto` (Standard `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` oder `alaw` (Standard `mp3`).
- `providers.xai.speed`: anbieterinterne Überschreibung der Geschwindigkeit.
- `providers.xiaomi.apiKey`: Xiaomi-MiMo-API-Key (Umgebungsvariable: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: überschreibt die Basis-URL der Xiaomi-MiMo-API (Standard `https://api.xiaomimimo.com/v1`, Umgebungsvariable: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: TTS-Modell (Standard `mimo-v2.5-tts`, Umgebungsvariable: `XIAOMI_TTS_MODEL`; `mimo-v2-tts` wird ebenfalls unterstützt).
- `providers.xiaomi.voice`: MiMo-Stimmen-ID (Standard `mimo_default`, Umgebungsvariable: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` oder `wav` (Standard `mp3`, Umgebungsvariable: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: optionale natürlichsprachige Stilanweisung, die als Benutzernachricht gesendet wird; sie wird nicht gesprochen.
- `providers.openrouter.apiKey`: OpenRouter-API-Key (Umgebungsvariable: `OPENROUTER_API_KEY`; kann `models.providers.openrouter.apiKey` wiederverwenden).
- `providers.openrouter.baseUrl`: überschreibt die OpenRouter-TTS-Basis-URL (Standard `https://openrouter.ai/api/v1`; das veraltete `https://openrouter.ai/v1` wird normalisiert).
- `providers.openrouter.model`: OpenRouter-TTS-Modell-ID (Standard `hexgrad/kokoro-82m`; `modelId` wird ebenfalls akzeptiert).
- `providers.openrouter.voice`: anbieterabhängige Stimmen-ID (Standard `af_alloy`; `voiceId` wird ebenfalls akzeptiert).
- `providers.openrouter.responseFormat`: `mp3` oder `pcm` (Standard `mp3`).
- `providers.openrouter.speed`: anbieterinterne Überschreibung der Geschwindigkeit.
- `providers.microsoft.enabled`: erlaubt die Verwendung von Microsoft Speech (Standard `true`; kein API-Key).
- `providers.microsoft.voice`: Name der Microsoft-Neural-Stimme (z. B. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: Sprachcode (z. B. `en-US`).
- `providers.microsoft.outputFormat`: Microsoft-Ausgabeformat (z. B. `audio-24khz-48kbitrate-mono-mp3`).
  - Gültige Werte finden Sie unter Microsoft-Speech-Ausgabeformate; nicht alle Formate werden vom mitgelieferten, Edge-basierten Transport unterstützt.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: Prozent-Strings (z. B. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: schreibt JSON-Untertitel neben die Audiodatei.
- `providers.microsoft.proxy`: Proxy-URL für Microsoft-Speech-Anfragen.
- `providers.microsoft.timeoutMs`: Überschreibung des Anfrage-Timeouts (ms).
- `edge.*`: veralteter Alias für dieselben Microsoft-Einstellungen. Führen Sie
  `openclaw doctor --fix` aus, um die gespeicherte Konfiguration zu `providers.microsoft` umzuschreiben.

## Modellgesteuerte Überschreibungen (standardmäßig aktiviert)

Standardmäßig **kann** das Modell TTS-Direktiven für eine einzelne Antwort ausgeben.
Wenn `messages.tts.auto` auf `tagged` gesetzt ist, sind diese Direktiven erforderlich, um Audio auszulösen.

Wenn aktiviert, kann das Modell `[[tts:...]]`-Direktiven ausgeben, um die Stimme
für eine einzelne Antwort zu überschreiben, plus optional einen Block `[[tts:text]]...[[/tts:text]]`, um
ausdrucksstarke Tags (Lachen, Gesangshinweise usw.) bereitzustellen, die nur im
Audio erscheinen sollen.

Direktiven `provider=...` werden ignoriert, sofern nicht `modelOverrides.allowProvider: true` gesetzt ist.

Beispiel für eine Antwort-Payload:

```
Hier bitte.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](lacht) Lies das Lied noch einmal.[[/tts:text]]
```

Verfügbare Direktivschlüssel (wenn aktiviert):

- `provider` (registrierte Speech-Provider-ID, zum Beispiel `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai` oder `xiaomi`; erfordert `allowProvider: true`)
- `voice` (OpenAI-, Gradium- oder Xiaomi-Stimme), `voiceName` / `voice_name` / `google_voice` (Google-Stimme) oder `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (OpenAI-TTS-Modell, ElevenLabs-Modell-ID, MiniMax-Modell oder Xiaomi-MiMo-TTS-Modell) oder `google_model` (Google-TTS-Modell)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax-Lautstärke, 0-10)
- `pitch` (MiniMax-ganzzahlige Tonhöhe, -12 bis 12; Werte mit Nachkommastellen werden vor der MiniMax-Anfrage abgeschnitten)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Alle Modell-Überschreibungen deaktivieren:

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

Optionale Allowlist (Provider-Wechsel aktivieren, während andere Regler weiterhin konfigurierbar bleiben):

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

## Einstellungen pro Benutzer

Slash-Befehle schreiben lokale Überschreibungen nach `prefsPath` (Standard:
`~/.openclaw/settings/tts.json`, überschreibbar mit `OPENCLAW_TTS_PREFS` oder
`messages.tts.prefsPath`).

Gespeicherte Felder:

- `enabled`
- `provider`
- `maxLength` (Schwellenwert für Zusammenfassungen; Standard 1500 Zeichen)
- `summarize` (Standard `true`)

Diese überschreiben `messages.tts.*` für diesen Host.

## Ausgabeformate (fest)

- **Feishu / Matrix / Telegram / WhatsApp**: Antworten als Sprachnachricht bevorzugen Opus (`opus_48000_64` von ElevenLabs, `opus` von OpenAI).
  - 48 kHz / 64 kbit/s ist ein guter Kompromiss für Sprachnachrichten.
- **Feishu**: Wenn eine Antwort als Sprachnachricht als MP3/WAV/M4A oder als andere
  wahrscheinliche Audiodatei erzeugt wird, transkodiert das Feishu-Plugin sie vor dem Senden der nativen `audio`-Bubble mit `ffmpeg` zu 48-kHz-Ogg/Opus. Wenn die Konvertierung fehlschlägt, erhält Feishu
  die Originaldatei als Anhang.
- **Andere Kanäle**: MP3 (`mp3_44100_128` von ElevenLabs, `mp3` von OpenAI).
  - 44,1 kHz / 128 kbit/s ist die Standardbalance für Sprachklarheit.
- **MiniMax**: MP3 (Modell `speech-2.8-hd`, 32-kHz-Samplerate) für normale Audioanhänge. Für Ziele mit Sprachnachrichten wie Feishu und Telegram transkodiert OpenClaw das MiniMax-MP3 vor der Auslieferung mit `ffmpeg` zu 48-kHz-Opus.
- **Xiaomi MiMo**: Standardmäßig MP3 oder WAV, wenn konfiguriert. Für Ziele mit Sprachnachrichten wie Feishu und Telegram transkodiert OpenClaw Xiaomi-Ausgaben vor der Auslieferung mit `ffmpeg` zu 48-kHz-Opus.
- **Local CLI**: verwendet das konfigurierte `outputFormat`. Ziele für Sprachnachrichten werden
  zu Ogg/Opus konvertiert und Telefonie-Ausgabe wird mit `ffmpeg` zu rohem 16-kHz-Mono-PCM
  konvertiert.
- **Google Gemini**: Gemini API TTS gibt rohes 24-kHz-PCM zurück. OpenClaw verpackt es für Audioanhänge als WAV und gibt PCM direkt für Talk/Telefonie zurück. Das native Opus-Format für Sprachnachrichten wird auf diesem Pfad nicht unterstützt.
- **Gradium**: WAV für Audioanhänge, Opus für Ziele mit Sprachnachrichten und `ulaw_8000` bei 8 kHz für Telefonie.
- **xAI**: Standardmäßig MP3; `responseFormat` kann `mp3`, `wav`, `pcm`, `mulaw` oder `alaw` sein. OpenClaw verwendet den Batch-REST-TTS-Endpunkt von xAI und gibt einen vollständigen Audioanhang zurück; der Streaming-TTS-WebSocket von xAI wird auf diesem Provider-Pfad nicht verwendet. Das native Opus-Format für Sprachnachrichten wird auf diesem Pfad nicht unterstützt.
- **Microsoft**: verwendet `microsoft.outputFormat` (Standard `audio-24khz-48kbitrate-mono-mp3`).
  - Der mitgelieferte Transport akzeptiert ein `outputFormat`, aber nicht alle Formate sind vom Dienst verfügbar.
  - Werte für das Ausgabeformat folgen den Microsoft-Speech-Ausgabeformaten (einschließlich Ogg/WebM Opus).
  - Telegram `sendVoice` akzeptiert OGG/MP3/M4A; verwenden Sie OpenAI/ElevenLabs, wenn Sie
    garantierte Opus-Sprachnachrichten benötigen.
  - Wenn das konfigurierte Microsoft-Ausgabeformat fehlschlägt, versucht OpenClaw es erneut mit MP3.

Die Ausgabeformate von OpenAI/ElevenLabs sind pro Kanal festgelegt (siehe oben).

## Verhalten von Auto-TTS

Wenn aktiviert, macht OpenClaw Folgendes:

- überspringt TTS, wenn die Antwort bereits Medien oder eine Direktive `MEDIA:` enthält.
- überspringt sehr kurze Antworten (< 10 Zeichen).
- fasst lange Antworten zusammen, wenn aktiviert, unter Verwendung von `agents.defaults.model.primary` (oder `summaryModel`).
- hängt das erzeugte Audio an die Antwort an.

Wenn die Antwort `maxLength` überschreitet und die Zusammenfassung deaktiviert ist (oder kein API-Key für das
Zusammenfassungsmodell vorhanden ist), wird Audio
übersprungen und die normale Textantwort gesendet.

## Ablaufdiagramm

```
Antwort -> TTS aktiviert?
  nein -> Text senden
  ja   -> Medien / MEDIA: / kurz vorhanden?
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
Details zur Aktivierung finden Sie unter [Slash commands](/de/tools/slash-commands).

Hinweis zu Discord: `/tts` ist ein integrierter Discord-Befehl, daher registriert OpenClaw dort
`/voice` als nativen Befehl. Textbasiertes `/tts ...` funktioniert weiterhin.

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

- Befehle erfordern einen autorisierten Absender (Allowlist-/Owner-Regeln gelten weiterhin).
- `commands.text` oder die Registrierung nativer Befehle muss aktiviert sein.
- Die Konfiguration `messages.tts.auto` akzeptiert `off|always|inbound|tagged`.
- `/tts on` schreibt die lokale TTS-Einstellung auf `always`; `/tts off` schreibt sie auf `off`.
- Verwenden Sie die Konfiguration, wenn Sie `inbound` oder `tagged` als Standard möchten.
- `limit` und `summary` werden in lokalen Einstellungen gespeichert, nicht in der Hauptkonfiguration.
- `/tts audio` erzeugt eine einmalige Audioantwort (aktiviert TTS nicht dauerhaft).
- `/tts status` enthält Sichtbarkeit des Fallbacks für den letzten Versuch:
  - erfolgreiches Fallback: `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - Fehler: `Error: ...` plus `Attempts: ...`
  - detaillierte Diagnose: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI- und ElevenLabs-API-Fehler enthalten jetzt geparste Anbieter-Fehlerdetails und die Anfrage-ID (wenn vom Anbieter zurückgegeben), die in TTS-Fehlern/Logs sichtbar gemacht werden.

## Agenten-Tool

Das Tool `tts` wandelt Text in Sprache um und gibt einen Audioanhang für die
Antwortzustellung zurück. Wenn der Kanal Feishu, Matrix, Telegram oder WhatsApp ist,
wird das Audio als Sprachnachricht statt als Dateianhang zugestellt.
Feishu kann auf diesem Pfad nicht-Opus-TTS-Ausgaben transkodieren, wenn `ffmpeg`
verfügbar ist.
Es akzeptiert optionale Felder `channel` und `timeoutMs`; `timeoutMs` ist ein
anbieterbezogenes Anfrage-Timeout pro Aufruf in Millisekunden.

## Gateway RPC

Gateway-Methoden:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Verwandt

- [Media overview](/de/tools/media-overview)
- [Music generation](/de/tools/music-generation)
- [Video generation](/de/tools/video-generation)
