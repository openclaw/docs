---
read_when:
    - Abilitazione del text-to-speech per le risposte
    - Configurazione dei provider TTS o dei limiti
    - Uso dei comandi /tts
summary: Text-to-speech (TTS) per le risposte in uscita
title: Text-to-speech
x-i18n:
    generated_at: "2026-04-24T09:08:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935fec2325a08da6f4ecd8ba5a9b889cd265025c5c7ee43bc4e0da36c1003d8f
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw può convertire le risposte in uscita in audio usando ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI o xAI.
Funziona ovunque OpenClaw possa inviare audio.

## Servizi supportati

- **ElevenLabs** (provider primario o di fallback)
- **Google Gemini** (provider primario o di fallback; usa Gemini API TTS)
- **Microsoft** (provider primario o di fallback; l'implementazione bundle corrente usa `node-edge-tts`)
- **MiniMax** (provider primario o di fallback; usa l'API T2A v2)
- **OpenAI** (provider primario o di fallback; usato anche per i riepiloghi)
- **xAI** (provider primario o di fallback; usa l'API TTS di xAI)

### Note su Microsoft speech

Il provider speech Microsoft bundle usa attualmente il servizio
TTS neurale online di Microsoft Edge tramite la libreria `node-edge-tts`. È un servizio ospitato (non
locale), usa endpoint Microsoft e non richiede una chiave API.
`node-edge-tts` espone opzioni di configurazione della voce e formati di output, ma
non tutte le opzioni sono supportate dal servizio. La configurazione legacy e l'input direttiva
che usa `edge` continuano a funzionare e vengono normalizzati a `microsoft`.

Poiché questo percorso è un servizio web pubblico senza SLA o quota pubblicati,
trattalo come best-effort. Se hai bisogno di limiti garantiti e supporto, usa OpenAI
o ElevenLabs.

## Chiavi facoltative

Se vuoi OpenAI, ElevenLabs, Google Gemini, MiniMax o xAI:

- `ELEVENLABS_API_KEY` (o `XI_API_KEY`)
- `GEMINI_API_KEY` (o `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Microsoft speech **non** richiede una chiave API.

Se sono configurati più provider, viene usato prima il provider selezionato e gli altri fungono da opzioni di fallback.
Il riepilogo automatico usa il `summaryModel` configurato (oppure `agents.defaults.model.primary`),
quindi anche quel provider deve essere autenticato se abiliti i riepiloghi.

## Link ai servizi

- [Guida OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Riferimento OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticazione ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formati di output Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## È abilitato per impostazione predefinita?

No. Auto‑TTS è **disattivato** per impostazione predefinita. Abilitalo nella configurazione con
`messages.tts.auto` o localmente con `/tts on`.

Quando `messages.tts.provider` non è impostato, OpenClaw sceglie il primo
provider speech configurato nell'ordine di auto-selezione del registro.

## Configurazione

La configurazione TTS si trova sotto `messages.tts` in `openclaw.json`.
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

### Microsoft primario (nessuna chiave API)

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

Google Gemini TTS usa il percorso della chiave API Gemini. Una chiave API di Google Cloud Console
limitata alla Gemini API è valida qui, ed è lo stesso tipo di chiave usato
dal provider bundle di generazione immagini Google. L'ordine di risoluzione è
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

xAI TTS usa lo stesso percorso `XAI_API_KEY` del provider bundle di modelli Grok.
L'ordine di risoluzione è `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Le voci live attuali sono `ara`, `eve`, `leo`, `rex`, `sal` e `una`; `eve` è
il valore predefinito. `language` accetta un tag BCP-47 o `auto`.

### Disabilita Microsoft speech

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

### Rispondi con audio solo dopo un messaggio vocale in ingresso

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Disabilita il riepilogo automatico per le risposte lunghe

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
- `enabled`: toggle legacy (doctor migra questo a `auto`).
- `mode`: `"final"` (predefinito) o `"all"` (include risposte di strumenti/blocchi).
- `provider`: id del provider speech come `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` o `"openai"` (il fallback è automatico).
- Se `provider` **non è impostato**, OpenClaw usa il primo provider speech configurato nell'ordine di auto-selezione del registro.
- Il legacy `provider: "edge"` continua a funzionare e viene normalizzato a `microsoft`.
- `summaryModel`: modello economico facoltativo per il riepilogo automatico; usa come predefinito `agents.defaults.model.primary`.
  - Accetta `provider/model` o un alias di modello configurato.
- `modelOverrides`: consente al modello di emettere direttive TTS (attivo per impostazione predefinita).
  - `allowProvider` usa come predefinito `false` (il cambio di provider è opt-in).
- `providers.<id>`: impostazioni gestite dal provider, indicizzate per id del provider speech.
- I blocchi legacy diretti del provider (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) vengono migrati automaticamente a `messages.tts.providers.<id>` al caricamento.
- `maxTextLength`: limite rigido per l'input TTS (caratteri). `/tts audio` fallisce se viene superato.
- `timeoutMs`: timeout della richiesta (ms).
- `prefsPath`: override del percorso JSON locale delle preferenze (provider/limite/riepilogo).
- I valori `apiKey` usano come fallback le variabili env (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: override della base URL API di ElevenLabs.
- `providers.openai.baseUrl`: override dell'endpoint OpenAI TTS.
  - Ordine di risoluzione: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - I valori non predefiniti vengono trattati come endpoint TTS compatibili con OpenAI, quindi sono accettati nomi personalizzati di modello e voce.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normale)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 a 2 lettere (ad esempio `en`, `de`)
- `providers.elevenlabs.seed`: intero `0..4294967295` (determinismo best-effort)
- `providers.minimax.baseUrl`: override della base URL API MiniMax (predefinita `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: modello TTS (predefinito `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identificatore della voce (predefinito `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: velocità di riproduzione `0.5..2.0` (predefinita 1.0).
- `providers.minimax.vol`: volume `(0, 10]` (predefinito 1.0; deve essere maggiore di 0).
- `providers.minimax.pitch`: variazione di intonazione `-12..12` (predefinita 0).
- `providers.google.model`: modello Gemini TTS (predefinito `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: nome della voce predefinita Gemini (predefinito `Kore`; è accettato anche `voice`).
- `providers.google.baseUrl`: override della base URL API Gemini. È accettato solo `https://generativelanguage.googleapis.com`.
  - Se `messages.tts.providers.google.apiKey` viene omesso, TTS può riusare `models.providers.google.apiKey` prima del fallback env.
- `providers.xai.apiKey`: chiave API xAI TTS (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: override della base URL xAI TTS (predefinita `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: id voce xAI (predefinito `eve`; voci live attuali: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: codice lingua BCP-47 o `auto` (predefinito `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` o `alaw` (predefinito `mp3`).
- `providers.xai.speed`: override nativo del provider per la velocità.
- `providers.microsoft.enabled`: consente l'uso di Microsoft speech (predefinito `true`; nessuna chiave API).
- `providers.microsoft.voice`: nome della voce neurale Microsoft (ad esempio `en-US-MichelleNeural`).
- `providers.microsoft.lang`: codice lingua (ad esempio `en-US`).
- `providers.microsoft.outputFormat`: formato di output Microsoft (ad esempio `audio-24khz-48kbitrate-mono-mp3`).
  - Vedi i formati di output Microsoft Speech per i valori validi; non tutti i formati sono supportati dal trasporto bundle basato su Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: stringhe percentuali (ad esempio `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: scrive sottotitoli JSON accanto al file audio.
- `providers.microsoft.proxy`: URL proxy per le richieste Microsoft speech.
- `providers.microsoft.timeoutMs`: override del timeout della richiesta (ms).
- `edge.*`: alias legacy per le stesse impostazioni Microsoft.

## Override guidati dal modello (attivi per impostazione predefinita)

Per impostazione predefinita, il modello **può** emettere direttive TTS per una singola risposta.
Quando `messages.tts.auto` è `tagged`, queste direttive sono necessarie per attivare l'audio.

Quando è abilitato, il modello può emettere direttive `[[tts:...]]` per sovrascrivere la voce
per una singola risposta, più un blocco facoltativo `[[tts:text]]...[[/tts:text]]` per
fornire tag espressivi (risate, indicazioni di canto, ecc.) che devono comparire solo
nell'audio.

Le direttive `provider=...` vengono ignorate a meno che `modelOverrides.allowProvider: true` non sia impostato.

Esempio di payload di risposta:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Chiavi direttiva disponibili (quando abilitate):

- `provider` (id provider speech registrato, ad esempio `openai`, `elevenlabs`, `google`, `minimax` o `microsoft`; richiede `allowProvider: true`)
- `voice` (voce OpenAI), `voiceName` / `voice_name` / `google_voice` (voce Google), oppure `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (modello OpenAI TTS, model id ElevenLabs o modello MiniMax) oppure `google_model` (modello Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (intonazione MiniMax, da -12 a 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Disabilita tutti gli override del modello:

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

I comandi slash scrivono override locali in `prefsPath` (predefinito:
`~/.openclaw/settings/tts.json`, sovrascrivibile con `OPENCLAW_TTS_PREFS` oppure
`messages.tts.prefsPath`).

Campi archiviati:

- `enabled`
- `provider`
- `maxLength` (soglia di riepilogo; predefinito 1500 caratteri)
- `summarize` (predefinito `true`)

Questi sovrascrivono `messages.tts.*` per quell'host.

## Formati di output (fissi)

- **Feishu / Matrix / Telegram / WhatsApp**: messaggio vocale Opus (`opus_48000_64` da ElevenLabs, `opus` da OpenAI).
  - 48kHz / 64kbps è un buon compromesso per i messaggi vocali.
- **Altri canali**: MP3 (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI).
  - 44.1kHz / 128kbps è il bilanciamento predefinito per la chiarezza della voce.
- **MiniMax**: MP3 (modello `speech-2.8-hd`, sample rate 32kHz). Il formato voice-note non è supportato nativamente; usa OpenAI o ElevenLabs per messaggi vocali Opus garantiti.
- **Google Gemini**: Gemini API TTS restituisce PCM raw a 24kHz. OpenClaw lo incapsula come WAV per gli allegati audio e restituisce PCM direttamente per Talk/telefonia. Il formato voice-note Opus nativo non è supportato da questo percorso.
- **xAI**: MP3 per impostazione predefinita; `responseFormat` può essere `mp3`, `wav`, `pcm`, `mulaw` o `alaw`. OpenClaw usa l'endpoint TTS REST batch di xAI e restituisce un allegato audio completo; il WebSocket TTS streaming di xAI non viene usato da questo percorso provider. Il formato voice-note Opus nativo non è supportato da questo percorso.
- **Microsoft**: usa `microsoft.outputFormat` (predefinito `audio-24khz-48kbitrate-mono-mp3`).
  - Il trasporto bundle accetta un `outputFormat`, ma non tutti i formati sono disponibili dal servizio.
  - I valori di output format seguono i formati di output Microsoft Speech (inclusi Ogg/WebM Opus).
  - Telegram `sendVoice` accetta OGG/MP3/M4A; usa OpenAI/ElevenLabs se hai bisogno di
    messaggi vocali Opus garantiti.
  - Se il formato di output Microsoft configurato fallisce, OpenClaw ritenta con MP3.

I formati di output OpenAI/ElevenLabs sono fissi per canale (vedi sopra).

## Comportamento Auto-TTS

Quando è abilitato, OpenClaw:

- salta TTS se la risposta contiene già media o una direttiva `MEDIA:`.
- salta le risposte molto brevi (< 10 caratteri).
- riepiloga le risposte lunghe quando abilitato usando `agents.defaults.model.primary` (o `summaryModel`).
- allega l'audio generato alla risposta.

Se la risposta supera `maxLength` e il riepilogo è disattivato (oppure non esiste una chiave API per il
modello di riepilogo), l'audio
viene saltato e viene inviata la normale risposta testuale.

## Diagramma di flusso

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

## Uso del comando slash

Esiste un solo comando: `/tts`.
Vedi [Slash commands](/it/tools/slash-commands) per i dettagli di abilitazione.

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

- I comandi richiedono un mittente autorizzato (continuano ad applicarsi le regole allowlist/owner).
- `commands.text` o la registrazione del comando nativo devono essere abilitati.
- La configurazione `messages.tts.auto` accetta `off|always|inbound|tagged`.
- `/tts on` scrive la preferenza TTS locale su `always`; `/tts off` la scrive su `off`.
- Usa la configurazione quando vuoi i valori predefiniti `inbound` o `tagged`.
- `limit` e `summary` vengono archiviati nelle preferenze locali, non nella configurazione principale.
- `/tts audio` genera una risposta audio una tantum (non attiva TTS).
- `/tts status` include la visibilità del fallback per l'ultimo tentativo:
  - fallback riuscito: `Fallback: <primary> -> <used>` più `Attempts: ...`
  - errore: `Error: ...` più `Attempts: ...`
  - diagnostica dettagliata: `Attempt details: provider:outcome(reasonCode) latency`
- Gli errori API OpenAI ed ElevenLabs ora includono il dettaglio dell'errore del provider analizzato e il request id (quando restituito dal provider), che viene mostrato negli errori/log TTS.

## Strumento dell'agente

Lo strumento `tts` converte il testo in voce e restituisce un allegato audio per
la consegna della risposta. Quando il canale è Feishu, Matrix, Telegram o WhatsApp,
l'audio viene consegnato come messaggio vocale anziché come allegato file.
Accetta campi facoltativi `channel` e `timeoutMs`; `timeoutMs` è un
timeout per richiesta provider per chiamata, in millisecondi.

## RPC del Gateway

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
