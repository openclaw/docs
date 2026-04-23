---
read_when:
    - Text-to-Speech für Antworten aktivieren
    - TTS-Provider oder Begrenzungen konfigurieren
    - '`/tts`-Befehle verwenden'
summary: Text-to-Speech (TTS) für ausgehende Antworten
title: Text-to-Speech
x-i18n:
    generated_at: "2026-04-23T06:36:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: be8f5a8ce90c56bcce58723702d51154fea3f9fd27a69ace144e2b1e5bdd7049
    source_path: tools/tts.md
    workflow: 15
---

# Text-to-Speech (TTS)

OpenClaw kann ausgehende Antworten mit ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI oder xAI in Audio umwandeln.
Es funktioniert überall dort, wo OpenClaw Audio senden kann.

## Unterstützte Dienste

- **ElevenLabs** (primärer oder Fallback-Provider)
- **Google Gemini** (primärer oder Fallback-Provider; verwendet Gemini API TTS)
- **Microsoft** (primärer oder Fallback-Provider; die aktuelle gebündelte Implementierung verwendet `node-edge-tts`)
- **MiniMax** (primärer oder Fallback-Provider; verwendet die T2A-v2-API)
- **OpenAI** (primärer oder Fallback-Provider; wird auch für Zusammenfassungen verwendet)
- **xAI** (primärer oder Fallback-Provider; verwendet die xAI-TTS-API)

### Hinweise zu Microsoft Speech

Der gebündelte Microsoft-Sprach-Provider verwendet derzeit den Online-
Neural-TTS-Dienst von Microsoft Edge über die Bibliothek `node-edge-tts`. Es ist ein gehosteter Dienst (nicht
lokal), verwendet Microsoft-Endpunkte und erfordert keinen API-Schlüssel.
`node-edge-tts` stellt Konfigurationsoptionen für Sprache und Ausgabeformate bereit,
aber nicht alle Optionen werden vom Dienst unterstützt. Alte Konfigurationen und Directive-Eingaben
mit `edge` funktionieren weiterhin und werden auf `microsoft` normalisiert.

Da dieser Pfad ein öffentlicher Webdienst ohne veröffentlichte SLA oder Quote ist,
sollten Sie ihn als Best Effort behandeln. Wenn Sie garantierte Grenzen und Support benötigen, verwenden Sie OpenAI
oder ElevenLabs.

## Optionale Schlüssel

Wenn Sie OpenAI, ElevenLabs, Google Gemini, MiniMax oder xAI verwenden möchten:

- `ELEVENLABS_API_KEY` (oder `XI_API_KEY`)
- `GEMINI_API_KEY` (oder `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Microsoft Speech erfordert **keinen** API-Schlüssel.

Wenn mehrere Provider konfiguriert sind, wird zuerst der ausgewählte Provider verwendet und die anderen sind Fallback-Optionen.
Automatische Zusammenfassungen verwenden das konfigurierte `summaryModel` (oder `agents.defaults.model.primary`),
daher muss auch dieser Provider authentifiziert sein, wenn Sie Zusammenfassungen aktivieren.

## Dienstlinks

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Ist es standardmäßig aktiviert?

Nein. Auto‑TTS ist standardmäßig **ausgeschaltet**. Aktivieren Sie es in der Konfiguration mit
`messages.tts.auto` oder lokal mit `/tts on`.

Wenn `messages.tts.provider` nicht gesetzt ist, wählt OpenClaw den ersten konfigurierten
Sprach-Provider in der automatischen Auswahlreihenfolge der Registry aus.

## Konfiguration

Die TTS-Konfiguration befindet sich unter `messages.tts` in `openclaw.json`.
Das vollständige Schema finden Sie unter [Gateway configuration](/de/gateway/configuration).

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

### OpenAI primär mit ElevenLabs als Fallback

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

### Microsoft als primärer Provider (ohne API-Schlüssel)

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

Google-Gemini-TTS verwendet den API-Schlüsselpfad der Gemini-API. Ein API-Schlüssel aus der Google Cloud Console,
der auf die Gemini-API beschränkt ist, ist hier gültig und entspricht derselben Schlüsselart, die
vom gebündelten Google-Provider für Bildgenerierung verwendet wird. Die Auflösungsreihenfolge ist
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

xAI-TTS verwendet denselben Pfad `XAI_API_KEY` wie der gebündelte Grok-Modell-Provider.
Die Auflösungsreihenfolge ist `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Aktuelle Live-Stimmen sind `ara`, `eve`, `leo`, `rex`, `sal` und `una`; `eve` ist
der Standard. `language` akzeptiert ein BCP-47-Tag oder `auto`.

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
- `enabled`: alter Schalter (doctor migriert dies zu `auto`).
- `mode`: `"final"` (Standard) oder `"all"` (einschließlich Tool-/Block-Antworten).
- `provider`: ID des Sprach-Providers wie `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` oder `"openai"` (Fallback erfolgt automatisch).
- Wenn `provider` **nicht gesetzt** ist, verwendet OpenClaw den ersten konfigurierten Sprach-Provider in der automatischen Auswahlreihenfolge der Registry.
- Alt `provider: "edge"` funktioniert weiterhin und wird auf `microsoft` normalisiert.
- `summaryModel`: optionales günstiges Modell für automatische Zusammenfassung; Standard ist `agents.defaults.model.primary`.
  - Akzeptiert `provider/model` oder einen konfigurierten Modellalias.
- `modelOverrides`: erlaubt dem Modell, TTS-Direktiven auszugeben (standardmäßig aktiviert).
  - `allowProvider` ist standardmäßig `false` (Provider-Wechsel ist Opt-in).
- `providers.<id>`: provider-eigene Einstellungen, indiziert nach der ID des Sprach-Providers.
- Alte direkte Provider-Blöcke (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) werden beim Laden automatisch nach `messages.tts.providers.<id>` migriert.
- `maxTextLength`: harte Obergrenze für TTS-Eingabe (Zeichen). `/tts audio` schlägt fehl, wenn sie überschritten wird.
- `timeoutMs`: Anfrage-Timeout (ms).
- `prefsPath`: überschreibt den lokalen JSON-Pfad für Einstellungen (Provider/Limit/Zusammenfassung).
- `apiKey`-Werte greifen auf Env-Variablen zurück (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: Base-URL der ElevenLabs-API überschreiben.
- `providers.openai.baseUrl`: den OpenAI-TTS-Endpunkt überschreiben.
  - Auflösungsreihenfolge: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Werte ungleich Standard werden als OpenAI-kompatible TTS-Endpunkte behandelt, daher werden benutzerdefinierte Modell- und Stimmnamen akzeptiert.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-stelliger ISO-639-1-Code (z. B. `en`, `de`)
- `providers.elevenlabs.seed`: Ganzzahl `0..4294967295` (Best-Effort-Determinismus)
- `providers.minimax.baseUrl`: Base-URL der MiniMax-API überschreiben (Standard `https://api.minimax.io`, Env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS-Modell (Standard `speech-2.8-hd`, Env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: Stimmkennung (Standard `English_expressive_narrator`, Env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: Wiedergabegeschwindigkeit `0.5..2.0` (Standard 1.0).
- `providers.minimax.vol`: Lautstärke `(0, 10]` (Standard 1.0; muss größer als 0 sein).
- `providers.minimax.pitch`: Tonhöhenverschiebung `-12..12` (Standard 0).
- `providers.google.model`: Gemini-TTS-Modell (Standard `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: Name der vorgefertigten Gemini-Stimme (Standard `Kore`; `voice` wird ebenfalls akzeptiert).
- `providers.google.baseUrl`: die Base-URL der Gemini-API überschreiben. Es wird nur `https://generativelanguage.googleapis.com` akzeptiert.
  - Wenn `messages.tts.providers.google.apiKey` ausgelassen wird, kann TTS vor dem Env-Fallback `models.providers.google.apiKey` wiederverwenden.
- `providers.xai.apiKey`: API-Schlüssel für xAI-TTS (Env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: die Base-URL für xAI-TTS überschreiben (Standard `https://api.x.ai/v1`, Env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: xAI-Stimm-ID (Standard `eve`; aktuelle Live-Stimmen: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: BCP-47-Sprachcode oder `auto` (Standard `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` oder `alaw` (Standard `mp3`).
- `providers.xai.speed`: provider-native Überschreibung der Geschwindigkeit.
- `providers.microsoft.enabled`: Nutzung von Microsoft Speech erlauben (Standard `true`; kein API-Schlüssel).
- `providers.microsoft.voice`: Name der Microsoft-Neural-Stimme (z. B. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: Sprachcode (z. B. `en-US`).
- `providers.microsoft.outputFormat`: Microsoft-Ausgabeformat (z. B. `audio-24khz-48kbitrate-mono-mp3`).
  - Gültige Werte finden Sie unter Microsoft Speech output formats; nicht alle Formate werden vom gebündelten, Edge-basierten Transport unterstützt.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: Prozentzeichenfolgen (z. B. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: JSON-Untertitel zusammen mit der Audiodatei schreiben.
- `providers.microsoft.proxy`: Proxy-URL für Microsoft-Speech-Anfragen.
- `providers.microsoft.timeoutMs`: Überschreibung des Anfrage-Timeouts (ms).
- `edge.*`: alter Alias für dieselben Microsoft-Einstellungen.

## Modellgesteuerte Überschreibungen (standardmäßig aktiviert)

Standardmäßig **kann** das Modell TTS-Direktiven für eine einzelne Antwort ausgeben.
Wenn `messages.tts.auto` auf `tagged` steht, sind diese Direktiven erforderlich, um Audio auszulösen.

Wenn dies aktiviert ist, kann das Modell Direktiven `[[tts:...]]` ausgeben, um die Stimme
für eine einzelne Antwort zu überschreiben, sowie einen optionalen Block `[[tts:text]]...[[/tts:text]]`, um
ausdrucksstarke Tags (Lachen, Gesangshinweise usw.) bereitzustellen, die nur im
Audio erscheinen sollen.

Direktiven `provider=...` werden ignoriert, sofern nicht `modelOverrides.allowProvider: true` gesetzt ist.

Beispiel für eine Antwort-Payload:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Verfügbare Direktivschlüssel (wenn aktiviert):

- `provider` (ID des registrierten Sprach-Providers, zum Beispiel `openai`, `elevenlabs`, `google`, `minimax` oder `microsoft`; erfordert `allowProvider: true`)
- `voice` (OpenAI-Stimme), `voiceName` / `voice_name` / `google_voice` (Google-Stimme) oder `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (OpenAI-TTS-Modell, ElevenLabs-Modell-ID oder MiniMax-Modell) oder `google_model` (Google-TTS-Modell)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax-Lautstärke, 0-10)
- `pitch` (MiniMax-Tonhöhe, -12 bis 12)
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

Optionale Allowlist (Provider-Wechsel aktivieren, während andere Schalter konfigurierbar bleiben):

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

Slash-Befehle schreiben lokale Überschreibungen nach `prefsPath` (Standard:
`~/.openclaw/settings/tts.json`, überschreibbar mit `OPENCLAW_TTS_PREFS` oder
`messages.tts.prefsPath`).

Gespeicherte Felder:

- `enabled`
- `provider`
- `maxLength` (Schwellenwert für Zusammenfassung; Standard 1500 Zeichen)
- `summarize` (Standard `true`)

Diese überschreiben `messages.tts.*` auf diesem Host.

## Ausgabeformate (fest)

- **Feishu / Matrix / Telegram / WhatsApp**: Opus-Sprachnachricht (`opus_48000_64` von ElevenLabs, `opus` von OpenAI).
  - 48 kHz / 64 kbps ist ein guter Kompromiss für Sprachnachrichten.
- **Andere Channels**: MP3 (`mp3_44100_128` von ElevenLabs, `mp3` von OpenAI).
  - 44,1 kHz / 128 kbps ist der Standardkompromiss für Sprachklarheit.
- **MiniMax**: MP3 (Modell `speech-2.8-hd`, Samplerate 32 kHz). Das Format für Sprachnotizen wird nativ nicht unterstützt; verwenden Sie OpenAI oder ElevenLabs für garantierte Opus-Sprachnachrichten.
- **Google Gemini**: Gemini API TTS gibt rohes 24-kHz-PCM zurück. OpenClaw kapselt es als WAV für Audioanhänge und gibt PCM direkt für Talk/Telephonie zurück. Das native Opus-Format für Sprachnotizen wird auf diesem Pfad nicht unterstützt.
- **xAI**: standardmäßig MP3; `responseFormat` kann `mp3`, `wav`, `pcm`, `mulaw` oder `alaw` sein. OpenClaw verwendet den Batch-REST-TTS-Endpunkt von xAI und gibt einen vollständigen Audioanhang zurück; das TTS-WebSocket-Streaming von xAI wird von diesem Provider-Pfad nicht verwendet. Das native Opus-Format für Sprachnotizen wird auf diesem Pfad nicht unterstützt.
- **Microsoft**: verwendet `microsoft.outputFormat` (Standard `audio-24khz-48kbitrate-mono-mp3`).
  - Der gebündelte Transport akzeptiert ein `outputFormat`, aber nicht alle Formate sind über den Dienst verfügbar.
  - Werte für Ausgabeformate folgen den Microsoft-Speech-Ausgabeformaten (einschließlich Ogg/WebM Opus).
  - Telegram `sendVoice` akzeptiert OGG/MP3/M4A; verwenden Sie OpenAI/ElevenLabs, wenn Sie
    garantierte Opus-Sprachnachrichten benötigen.
  - Wenn das konfigurierte Microsoft-Ausgabeformat fehlschlägt, versucht OpenClaw es erneut mit MP3.

Die Ausgabeformate von OpenAI/ElevenLabs sind pro Channel festgelegt (siehe oben).

## Verhalten von Auto-TTS

Wenn es aktiviert ist, führt OpenClaw Folgendes aus:

- überspringt TTS, wenn die Antwort bereits Medien oder eine Direktive `MEDIA:` enthält.
- überspringt sehr kurze Antworten (< 10 Zeichen).
- fasst lange Antworten zusammen, wenn dies aktiviert ist, unter Verwendung von `agents.defaults.model.primary` (oder `summaryModel`).
- hängt das erzeugte Audio an die Antwort an.

Wenn die Antwort `maxLength` überschreitet und die Zusammenfassung aus ist (oder kein API-Schlüssel für das
Zusammenfassungsmodell vorhanden ist), wird Audio
übersprungen und die normale Textantwort gesendet.

## Ablaufdiagramm

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## Verwendung von Slash-Befehlen

Es gibt einen einzelnen Befehl: `/tts`.
Details zur Aktivierung finden Sie unter [Slash commands](/de/tools/slash-commands).

Hinweis zu Discord: `/tts` ist ein integrierter Discord-Befehl, daher registriert OpenClaw dort
`/voice` als nativen Befehl. Text `/tts ...` funktioniert weiterhin.

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
- `/tts on` schreibt die lokale TTS-Präferenz auf `always`; `/tts off` schreibt sie auf `off`.
- Verwenden Sie die Konfiguration, wenn Sie standardmäßig `inbound` oder `tagged` wünschen.
- `limit` und `summary` werden in lokalen Einstellungen gespeichert, nicht in der Hauptkonfiguration.
- `/tts audio` erzeugt eine einmalige Audioantwort (aktiviert TTS nicht dauerhaft).
- `/tts status` enthält Sichtbarkeit des Fallbacks für den letzten Versuch:
  - erfolgreicher Fallback: `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - Fehler: `Error: ...` plus `Attempts: ...`
  - detaillierte Diagnose: `Attempt details: provider:outcome(reasonCode) latency`
- Fehler der OpenAI- und ElevenLabs-API enthalten jetzt geparste Provider-Fehlerdetails und die Request-ID (wenn vom Provider zurückgegeben), was in TTS-Fehlern/Logs sichtbar wird.

## Agent-Tool

Das Tool `tts` wandelt Text in Sprache um und gibt einen Audioanhang für
die Zustellung der Antwort zurück. Wenn der Channel Feishu, Matrix, Telegram oder WhatsApp ist,
wird das Audio als Sprachnachricht statt als Dateianhang zugestellt.

## Gateway-RPC

Gateway-Methoden:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
