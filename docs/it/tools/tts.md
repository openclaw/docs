---
read_when:
    - Abilitare il text-to-speech per le risposte
    - Configurare provider o limiti TTS
    - Usare i comandi /tts
summary: Text-to-speech (TTS) per le risposte in uscita
title: Text-to-speech
x-i18n:
    generated_at: "2026-04-25T18:23:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c56c42f201139a7277153a6a1409ef9a288264e0702d2940b74b08ece385718
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw può convertire le risposte in uscita in audio usando ElevenLabs, Google Gemini, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI o Xiaomi MiMo.
Funziona ovunque OpenClaw possa inviare audio.

## Servizi supportati

- **ElevenLabs** (provider primario o di fallback)
- **Google Gemini** (provider primario o di fallback; usa Gemini API TTS)
- **Gradium** (provider primario o di fallback; supporta output voice-note e telefonia)
- **Local CLI** (provider primario o di fallback; esegue un comando TTS locale configurato)
- **Microsoft** (provider primario o di fallback; l'implementazione bundled attuale usa `node-edge-tts`)
- **MiniMax** (provider primario o di fallback; usa l'API T2A v2)
- **OpenAI** (provider primario o di fallback; usato anche per i riepiloghi)
- **Vydra** (provider primario o di fallback; provider condiviso per immagini, video e parlato)
- **xAI** (provider primario o di fallback; usa l'API TTS di xAI)
- **Xiaomi MiMo** (provider primario o di fallback; usa MiMo TTS tramite chat completions Xiaomi)

### Note su Microsoft speech

Il provider speech Microsoft bundled usa attualmente il servizio TTS neurale
online di Microsoft Edge tramite la libreria `node-edge-tts`. È un servizio ospitato (non
locale), usa endpoint Microsoft e non richiede una chiave API.
`node-edge-tts` espone opzioni di configurazione speech e formati di output, ma
non tutte le opzioni sono supportate dal servizio. La configurazione legacy e l'input directive
che usa `edge` continuano a funzionare e vengono normalizzati a `microsoft`.

Poiché questo percorso è un servizio web pubblico senza SLA o quota pubblicati,
consideralo best-effort. Se hai bisogno di limiti garantiti e supporto, usa OpenAI
o ElevenLabs.

## Chiavi facoltative

Se vuoi OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra, xAI o Xiaomi MiMo:

- `ELEVENLABS_API_KEY` (oppure `XI_API_KEY`)
- `GEMINI_API_KEY` (oppure `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`; MiniMax TTS accetta anche l'autenticazione Token Plan tramite
  `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, o
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI e Microsoft speech **non** richiedono una chiave API.

Se sono configurati più provider, viene usato prima il provider selezionato e gli altri diventano opzioni di fallback.
Il riepilogo automatico usa `summaryModel` configurato (oppure `agents.defaults.model.primary`),
quindi anche quel provider deve essere autenticato se abiliti i riepiloghi.

## Link ai servizi

- [Guida OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Riferimento OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticazione ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/it/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Sintesi vocale Xiaomi MiMo](/it/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formati di output Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## È abilitato per impostazione predefinita?

No. L'auto‑TTS è **disattivato** per impostazione predefinita. Abilitalo nella configurazione con
`messages.tts.auto` o localmente con `/tts on`.

Quando `messages.tts.provider` non è impostato, OpenClaw sceglie il primo
provider speech configurato nell'ordine di selezione automatica del registro.

## Configurazione

La configurazione TTS si trova in `messages.tts` in `openclaw.json`.
Lo schema completo è in [Configurazione del Gateway](/it/gateway/configuration).

### Configurazione minima (abilitazione + provider)

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

### OpenAI primario con fallback ElevenLabs

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

### Microsoft primario (senza chiave API)

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

### MiniMax primario

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

La risoluzione dell'autenticazione MiniMax TTS è `messages.tts.providers.minimax.apiKey`, poi
i profili OAuth/token `minimax-portal` memorizzati, poi le chiavi env Token Plan
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`), poi `MINIMAX_API_KEY`. Quando non è impostato alcun
`baseUrl` TTS esplicito, OpenClaw può riusare l'host OAuth `minimax-portal`
configurato per il parlato Token Plan.

### Google Gemini primario

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

Google Gemini TTS usa il percorso della chiave API Gemini. Una chiave API Google Cloud Console
limitata alla Gemini API è valida qui, ed è lo stesso tipo di chiave usato
dal provider bundled di generazione immagini Google. L'ordine di risoluzione è
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI primario

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

xAI TTS usa lo stesso percorso `XAI_API_KEY` del provider di modelli Grok bundled.
L'ordine di risoluzione è `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Le voci live correnti sono `ara`, `eve`, `leo`, `rex`, `sal` e `una`; `eve` è
quella predefinita. `language` accetta un tag BCP-47 o `auto`.

### Xiaomi MiMo primario

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

Xiaomi MiMo TTS usa lo stesso percorso `XIAOMI_API_KEY` del provider di modelli Xiaomi bundled.
L'id del provider speech è `xiaomi`; `mimo` è accettato come alias.
Il testo di destinazione viene inviato come messaggio assistant, in linea con il contratto TTS
di Xiaomi. `style` facoltativo viene inviato come istruzione utente e non viene pronunciato.

### OpenRouter primario

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

OpenRouter TTS usa lo stesso percorso `OPENROUTER_API_KEY` del provider di modelli
OpenRouter bundled. L'ordine di risoluzione è
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`.

### Local CLI primario

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

Local CLI TTS esegue il comando configurato sull'host gateway. I placeholder `{{Text}}`,
`{{OutputPath}}`, `{{OutputDir}}` e `{{OutputBase}}` vengono
espansi in `args`; se non è presente alcun placeholder `{{Text}}`, OpenClaw scrive il
testo parlato su stdin. `outputFormat` accetta `mp3`, `opus` o `wav`.
Le destinazioni voice-note vengono transcodificate in Ogg/Opus e l'output telefonico viene
transcodificato in PCM raw mono a 16 kHz con `ffmpeg`. L'alias legacy del provider
`cli` continua a funzionare, ma la nuova configurazione dovrebbe usare `tts-local-cli`.

### Gradium primario

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

### Disabilitare Microsoft speech

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

### Limiti personalizzati + percorso prefs

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

### Rispondere solo con audio dopo un messaggio vocale in ingresso

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Disabilitare il riepilogo automatico per le risposte lunghe

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Poi esegui:

```
/tts summary off
```

### Note sui campi

- `auto`: modalità auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` invia audio solo dopo un messaggio vocale in ingresso.
  - `tagged` invia audio solo quando la risposta include direttive `[[tts:key=value]]` o un blocco `[[tts:text]]...[[/tts:text]]`.
- `enabled`: interruttore legacy (doctor lo migra in `auto`).
- `mode`: `"final"` (predefinito) o `"all"` (include risposte di tool/blocco).
- `provider`: id del provider speech come `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"` o `"xiaomi"` (il fallback è automatico).
- Se `provider` **non** è impostato, OpenClaw usa il primo provider speech configurato nell'ordine di auto-selezione del registro.
- La configurazione legacy `provider: "edge"` viene corretta da `openclaw doctor --fix` e
  riscritta in `provider: "microsoft"`.
- `summaryModel`: modello economico facoltativo per il riepilogo automatico; per impostazione predefinita usa `agents.defaults.model.primary`.
  - Accetta `provider/model` o un alias modello configurato.
- `modelOverrides`: consente al modello di emettere direttive TTS (attivo per impostazione predefinita).
  - `allowProvider` ha come valore predefinito `false` (il cambio provider è opt-in).
- `providers.<id>`: impostazioni gestite dal provider con chiave sull'id del provider speech.
- I blocchi provider diretti legacy (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) vengono corretti da `openclaw doctor --fix`; la configurazione salvata dovrebbe usare `messages.tts.providers.<id>`.
- Anche il legacy `messages.tts.providers.edge` viene corretto da `openclaw doctor --fix`; la configurazione salvata dovrebbe usare `messages.tts.providers.microsoft`.
- `maxTextLength`: limite rigido per l'input TTS (caratteri). `/tts audio` fallisce se viene superato.
- `timeoutMs`: timeout della richiesta (ms).
- `prefsPath`: sovrascrive il percorso del JSON delle preferenze locali (provider/limite/riepilogo).
- I valori `apiKey` usano come fallback le variabili env (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`).
- `providers.elevenlabs.baseUrl`: sovrascrive l'URL base dell'API ElevenLabs.
- `providers.openai.baseUrl`: sovrascrive l'endpoint TTS OpenAI.
  - Ordine di risoluzione: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - I valori non predefiniti vengono trattati come endpoint TTS compatibili con OpenAI, quindi sono accettati nomi personalizzati di modello e voce.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normale)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 a 2 lettere (per esempio `en`, `de`)
- `providers.elevenlabs.seed`: intero `0..4294967295` (determinismo best-effort)
- `providers.minimax.baseUrl`: sovrascrive l'URL base dell'API MiniMax (predefinito `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: modello TTS (predefinito `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identificatore voce (predefinito `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: velocità di riproduzione `0.5..2.0` (predefinita 1.0).
- `providers.minimax.vol`: volume `(0, 10]` (predefinito 1.0; deve essere maggiore di 0).
- `providers.minimax.pitch`: spostamento di intonazione intero `-12..12` (predefinito 0). I valori frazionari vengono troncati prima della chiamata a MiniMax T2A perché l'API rifiuta valori di intonazione non interi.
- `providers.tts-local-cli.command`: eseguibile locale o stringa di comando per CLI TTS.
- `providers.tts-local-cli.args`: argomenti del comando; supporta i placeholder `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` e `{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat`: formato di output atteso della CLI (`mp3`, `opus` o `wav`; predefinito `mp3` per gli allegati audio).
- `providers.tts-local-cli.timeoutMs`: timeout del comando in millisecondi (predefinito `120000`).
- `providers.tts-local-cli.cwd`: directory di lavoro facoltativa del comando.
- `providers.tts-local-cli.env`: sovrascritture facoltative dell'ambiente stringa per il comando.
- `providers.google.model`: modello Gemini TTS (predefinito `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: nome della voce predefinita Gemini (predefinito `Kore`; è accettato anche `voice`).
- `providers.google.audioProfile`: prompt di stile in linguaggio naturale anteposto prima del testo pronunciato.
- `providers.google.speakerName`: etichetta facoltativa del parlante anteposta prima del testo pronunciato quando il tuo prompt TTS usa un parlante nominato.
- `providers.google.baseUrl`: sovrascrive l'URL base dell'API Gemini. È accettato solo `https://generativelanguage.googleapis.com`.
  - Se `messages.tts.providers.google.apiKey` è omesso, TTS può riusare `models.providers.google.apiKey` prima del fallback env.
- `providers.gradium.baseUrl`: sovrascrive l'URL base dell'API Gradium (predefinito `https://api.gradium.ai`).
- `providers.gradium.voiceId`: identificatore voce Gradium (predefinito Emma, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: chiave API xAI TTS (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: sovrascrive l'URL base xAI TTS (predefinito `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: id voce xAI (predefinito `eve`; voci live correnti: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: codice lingua BCP-47 o `auto` (predefinito `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` o `alaw` (predefinito `mp3`).
- `providers.xai.speed`: sovrascrittura della velocità nativa del provider.
- `providers.xiaomi.apiKey`: chiave API Xiaomi MiMo (env: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: sovrascrive l'URL base dell'API Xiaomi MiMo (predefinito `https://api.xiaomimimo.com/v1`, env: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: modello TTS (predefinito `mimo-v2.5-tts`, env: `XIAOMI_TTS_MODEL`; è supportato anche `mimo-v2-tts`).
- `providers.xiaomi.voice`: id voce MiMo (predefinito `mimo_default`, env: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` o `wav` (predefinito `mp3`, env: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: istruzione di stile facoltativa in linguaggio naturale inviata come messaggio utente; non viene pronunciata.
- `providers.openrouter.apiKey`: chiave API OpenRouter (env: `OPENROUTER_API_KEY`; può riusare `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl`: sovrascrive l'URL base OpenRouter TTS (predefinito `https://openrouter.ai/api/v1`; il legacy `https://openrouter.ai/v1` viene normalizzato).
- `providers.openrouter.model`: id del modello OpenRouter TTS (predefinito `hexgrad/kokoro-82m`; è accettato anche `modelId`).
- `providers.openrouter.voice`: id voce specifico del provider (predefinito `af_alloy`; è accettato anche `voiceId`).
- `providers.openrouter.responseFormat`: `mp3` o `pcm` (predefinito `mp3`).
- `providers.openrouter.speed`: sovrascrittura della velocità nativa del provider.
- `providers.microsoft.enabled`: consente l'uso di Microsoft speech (predefinito `true`; nessuna chiave API).
- `providers.microsoft.voice`: nome della voce neurale Microsoft (per esempio `en-US-MichelleNeural`).
- `providers.microsoft.lang`: codice lingua (per esempio `en-US`).
- `providers.microsoft.outputFormat`: formato di output Microsoft (per esempio `audio-24khz-48kbitrate-mono-mp3`).
  - Vedi i formati di output Microsoft Speech per i valori validi; non tutti i formati sono supportati dal trasporto bundled basato su Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: stringhe percentuali (per esempio `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: scrive sottotitoli JSON accanto al file audio.
- `providers.microsoft.proxy`: URL proxy per le richieste Microsoft speech.
- `providers.microsoft.timeoutMs`: sovrascrittura del timeout della richiesta (ms).
- `edge.*`: alias legacy per le stesse impostazioni Microsoft. Esegui
  `openclaw doctor --fix` per riscrivere la configurazione salvata in `providers.microsoft`.

## Sovrascritture guidate dal modello (attive per impostazione predefinita)

Per impostazione predefinita, il modello **può** emettere direttive TTS per una singola risposta.
Quando `messages.tts.auto` è `tagged`, queste direttive sono necessarie per attivare l'audio.

Quando abilitato, il modello può emettere direttive `[[tts:...]]` per sovrascrivere la voce
per una singola risposta, più un blocco facoltativo `[[tts:text]]...[[/tts:text]]` per
fornire tag espressivi (risate, indicazioni di canto, ecc.) che dovrebbero comparire solo nell'
audio.

Le direttive `provider=...` vengono ignorate a meno che `modelOverrides.allowProvider: true`.

Esempio di payload di risposta:

```
Ecco qui.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](ride) Leggi di nuovo la canzone.[[/tts:text]]
```

Chiavi di direttiva disponibili (quando abilitate):

- `provider` (id del provider speech registrato, per esempio `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai` o `xiaomi`; richiede `allowProvider: true`)
- `voice` (voce OpenAI, Gradium o Xiaomi), `voiceName` / `voice_name` / `google_voice` (voce Google), oppure `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (modello OpenAI TTS, id modello ElevenLabs, modello MiniMax o modello Xiaomi MiMo TTS) oppure `google_model` (modello Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (intonazione intera MiniMax, da -12 a 12; i valori frazionari vengono troncati prima della richiesta MiniMax)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Disabilita tutte le sovrascritture del modello:

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

Allowlist facoltativa (abilita il cambio provider mantenendo configurabili gli altri parametri):

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

## Preferenze per utente

I comandi slash scrivono sovrascritture locali in `prefsPath` (predefinito:
`~/.openclaw/settings/tts.json`, sovrascrivibile con `OPENCLAW_TTS_PREFS` o
`messages.tts.prefsPath`).

Campi memorizzati:

- `enabled`
- `provider`
- `maxLength` (soglia di riepilogo; predefinita 1500 caratteri)
- `summarize` (predefinito `true`)

Questi sovrascrivono `messages.tts.*` per quell'host.

## Formati di output (fissi)

- **Feishu / Matrix / Telegram / WhatsApp**: le risposte voice-note preferiscono Opus (`opus_48000_64` da ElevenLabs, `opus` da OpenAI).
  - 48 kHz / 64 kbps è un buon compromesso per i messaggi vocali.
- **Feishu**: quando una risposta voice-note viene prodotta come MP3/WAV/M4A o un altro
  probabile file audio, il Plugin Feishu la transcodifica in Ogg/Opus 48 kHz con
  `ffmpeg` prima di inviare il balloon `audio` nativo. Se la conversione fallisce, Feishu
  riceve il file originale come allegato.
- **Altri canali**: MP3 (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI).
  - 44,1 kHz / 128 kbps è il bilanciamento predefinito per la chiarezza del parlato.
- **MiniMax**: MP3 (modello `speech-2.8-hd`, sample rate 32 kHz) per i normali allegati audio. Per destinazioni voice-note come Feishu e Telegram, OpenClaw transcodifica l'MP3 MiniMax in Opus 48 kHz con `ffmpeg` prima della consegna.
- **Xiaomi MiMo**: MP3 per impostazione predefinita, oppure WAV quando configurato. Per destinazioni voice-note come Feishu e Telegram, OpenClaw transcodifica l'output Xiaomi in Opus 48 kHz con `ffmpeg` prima della consegna.
- **Local CLI**: usa `outputFormat` configurato. Le destinazioni voice-note vengono
  convertite in Ogg/Opus e l'output telefonico viene convertito in PCM raw mono 16 kHz
  con `ffmpeg`.
- **Google Gemini**: Gemini API TTS restituisce PCM raw 24 kHz. OpenClaw lo incapsula come WAV per gli allegati audio e restituisce PCM direttamente per Talk/telefonia. Il formato voice-note Opus nativo non è supportato da questo percorso.
- **Gradium**: WAV per gli allegati audio, Opus per le destinazioni voice-note e `ulaw_8000` a 8 kHz per la telefonia.
- **xAI**: MP3 per impostazione predefinita; `responseFormat` può essere `mp3`, `wav`, `pcm`, `mulaw` o `alaw`. OpenClaw usa l'endpoint batch REST TTS di xAI e restituisce un allegato audio completo; il WebSocket TTS in streaming di xAI non è usato da questo percorso provider. Il formato voice-note Opus nativo non è supportato da questo percorso.
- **Microsoft**: usa `microsoft.outputFormat` (predefinito `audio-24khz-48kbitrate-mono-mp3`).
  - Il trasporto bundled accetta un `outputFormat`, ma non tutti i formati sono disponibili dal servizio.
  - I valori di formato output seguono i formati di output Microsoft Speech (inclusi Ogg/WebM Opus).
  - `sendVoice` di Telegram accetta OGG/MP3/M4A; usa OpenAI/ElevenLabs se hai bisogno di
    messaggi vocali Opus garantiti.
  - Se il formato output Microsoft configurato fallisce, OpenClaw ritenta con MP3.

I formati output OpenAI/ElevenLabs sono fissi per canale (vedi sopra).

## Comportamento auto-TTS

Quando è abilitato, OpenClaw:

- salta TTS se la risposta contiene già media o una direttiva `MEDIA:`.
- salta le risposte molto brevi (< 10 caratteri).
- riassume le risposte lunghe quando abilitato usando `agents.defaults.model.primary` (oppure `summaryModel`).
- allega l'audio generato alla risposta.

Se la risposta supera `maxLength` e il riepilogo è disattivato (oppure non c'è alcuna chiave API per il
modello di riepilogo), l'audio
viene saltato e viene inviata la normale risposta di testo.

## Diagramma di flusso

```
Risposta -> TTS abilitato?
  no  -> invia testo
  yes -> ha media / MEDIA: / è breve?
          yes -> invia testo
          no  -> lunghezza > limite?
                   no  -> TTS -> allega audio
                   yes -> riepilogo abilitato?
                            no  -> invia testo
                            yes -> riassumi (summaryModel o agents.defaults.model.primary)
                                      -> TTS -> allega audio
```

## Uso del comando slash

Esiste un solo comando: `/tts`.
Vedi [Comandi slash](/it/tools/slash-commands) per i dettagli di abilitazione.

Nota Discord: `/tts` è un comando integrato di Discord, quindi OpenClaw registra
`/voice` come comando nativo lì. Il testo `/tts ...` continua comunque a funzionare.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Note:

- I comandi richiedono un mittente autorizzato (continuano ad applicarsi le regole di allowlist/proprietario).
- `commands.text` o la registrazione del comando nativo devono essere abilitati.
- La configurazione `messages.tts.auto` accetta `off|always|inbound|tagged`.
- `/tts on` scrive la preferenza TTS locale su `always`; `/tts off` la scrive su `off`.
- Usa la configurazione quando vuoi i valori predefiniti `inbound` o `tagged`.
- `limit` e `summary` vengono memorizzati nelle preferenze locali, non nella configurazione principale.
- `/tts audio` genera una risposta audio one-off (non attiva TTS).
- `/tts status` include la visibilità del fallback per l'ultimo tentativo:
  - fallback riuscito: `Fallback: <primary> -> <used>` più `Attempts: ...`
  - errore: `Error: ...` più `Attempts: ...`
  - diagnostica dettagliata: `Attempt details: provider:outcome(reasonCode) latency`
- I fallimenti API OpenAI ed ElevenLabs ora includono il dettaglio dell'errore provider analizzato e il request id (quando restituito dal provider), che viene mostrato negli errori/log TTS.

## Tool agente

Il tool `tts` converte il testo in parlato e restituisce un allegato audio per
la consegna della risposta. Quando il canale è Feishu, Matrix, Telegram o WhatsApp,
l'audio viene consegnato come messaggio vocale anziché come allegato file.
Feishu può transcodificare l'output TTS non Opus su questo percorso quando `ffmpeg` è
disponibile.
WhatsApp invia il testo visibile separatamente dall'audio PTT voice-note perché i client
non mostrano in modo coerente le didascalie sui voice note.
Accetta campi facoltativi `channel` e `timeoutMs`; `timeoutMs` è un
timeout della richiesta provider per chiamata in millisecondi.

## RPC Gateway

Metodi Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Correlati

- [Panoramica media](/it/tools/media-overview)
- [Generazione musicale](/it/tools/music-generation)
- [Generazione video](/it/tools/video-generation)
