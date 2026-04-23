---
read_when:
    - Abilitare il text-to-speech per le risposte
    - Configurare i provider TTS o i limiti
    - Usare i comandi /tts
summary: Text-to-speech (TTS) per le risposte in uscita
title: Text-to-Speech
x-i18n:
    generated_at: "2026-04-23T08:38:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: be8f5a8ce90c56bcce58723702d51154fea3f9fd27a69ace144e2b1e5bdd7049
    source_path: tools/tts.md
    workflow: 15
---

# Text-to-speech (TTS)

OpenClaw può convertire le risposte in uscita in audio usando ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI o xAI.
Funziona ovunque OpenClaw possa inviare audio.

## Servizi supportati

- **ElevenLabs** (provider primario o di fallback)
- **Google Gemini** (provider primario o di fallback; usa Gemini API TTS)
- **Microsoft** (provider primario o di fallback; l'implementazione bundled attuale usa `node-edge-tts`)
- **MiniMax** (provider primario o di fallback; usa l'API T2A v2)
- **OpenAI** (provider primario o di fallback; usato anche per i riepiloghi)
- **xAI** (provider primario o di fallback; usa l'API TTS di xAI)

### Note sulla sintesi vocale Microsoft

Il provider bundled per la sintesi vocale Microsoft usa attualmente il servizio
TTS neurale online di Microsoft Edge tramite la libreria `node-edge-tts`. È un servizio hostato (non
locale), usa endpoint Microsoft e non richiede una API key.
`node-edge-tts` espone opzioni di configurazione della voce e formati di output, ma
non tutte le opzioni sono supportate dal servizio. L'input legacy di configurazione e direttive
che usa `edge` continua a funzionare ed è normalizzato a `microsoft`.

Poiché questo percorso usa un servizio web pubblico senza SLA o quota pubblicati,
consideralo best-effort. Se hai bisogno di limiti garantiti e supporto, usa OpenAI
o ElevenLabs.

## Chiavi facoltative

Se vuoi usare OpenAI, ElevenLabs, Google Gemini, MiniMax o xAI:

- `ELEVENLABS_API_KEY` (oppure `XI_API_KEY`)
- `GEMINI_API_KEY` (oppure `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

La sintesi vocale Microsoft **non** richiede una API key.

Se sono configurati più provider, viene usato prima il provider selezionato e gli altri diventano opzioni di fallback.
L'auto-summary usa il `summaryModel` configurato (oppure `agents.defaults.model.primary`),
quindi anche quel provider deve essere autenticato se abiliti i riepiloghi.

## Link ai servizi

- [Guida OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Riferimento API OpenAI Audio](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticazione ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formati di output Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## È abilitato per impostazione predefinita?

No. L'auto‑TTS è **disattivato** per impostazione predefinita. Abilitalo nella configurazione con
`messages.tts.auto` oppure localmente con `/tts on`.

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

### Microsoft primario (senza API key)

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

Il TTS Google Gemini usa il percorso della API key Gemini. Una API key Google Cloud Console
limitata alla Gemini API è valida anche qui, ed è lo stesso tipo di chiave usato
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

Il TTS xAI usa lo stesso percorso `XAI_API_KEY` del provider bundled dei modelli Grok.
L'ordine di risoluzione è `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Le voci live correnti sono `ara`, `eve`, `leo`, `rex`, `sal` e `una`; `eve` è
la predefinita. `language` accetta un tag BCP-47 o `auto`.

### Disabilitare la sintesi vocale Microsoft

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

### Rispondere con audio solo dopo un messaggio vocale in ingresso

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Disabilitare l'auto-summary per risposte lunghe

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
- `mode`: `"final"` (predefinito) oppure `"all"` (include risposte tool/block).
- `provider`: ID provider speech come `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` oppure `"openai"` (il fallback è automatico).
- Se `provider` **non è impostato**, OpenClaw usa il primo provider speech configurato nell'ordine di auto-selezione del registro.
- Il legacy `provider: "edge"` continua a funzionare ed è normalizzato a `microsoft`.
- `summaryModel`: modello economico facoltativo per l'auto-summary; il predefinito è `agents.defaults.model.primary`.
  - Accetta `provider/model` o un alias modello configurato.
- `modelOverrides`: consente al modello di emettere direttive TTS (attivo per impostazione predefinita).
  - `allowProvider` ha come predefinito `false` (il cambio provider è opt-in).
- `providers.<id>`: impostazioni di proprietà del provider indicizzate per ID provider speech.
- I blocchi provider diretti legacy (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) vengono migrati automaticamente in `messages.tts.providers.<id>` al caricamento.
- `maxTextLength`: limite rigido per l'input TTS (caratteri). `/tts audio` fallisce se viene superato.
- `timeoutMs`: timeout della richiesta (ms).
- `prefsPath`: sovrascrive il percorso del JSON delle preferenze locali (provider/limite/summary).
- I valori `apiKey` usano come fallback le variabili env (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: sovrascrive l'URL base API ElevenLabs.
- `providers.openai.baseUrl`: sovrascrive l'endpoint TTS OpenAI.
  - Ordine di risoluzione: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - I valori non predefiniti vengono trattati come endpoint TTS compatibili con OpenAI, quindi nomi personalizzati di modello e voce sono accettati.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normale)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 a 2 lettere (es. `en`, `de`)
- `providers.elevenlabs.seed`: intero `0..4294967295` (determinismo best-effort)
- `providers.minimax.baseUrl`: sovrascrive l'URL base API MiniMax (predefinito `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: modello TTS (predefinito `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identificatore della voce (predefinito `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: velocità di riproduzione `0.5..2.0` (predefinito 1.0).
- `providers.minimax.vol`: volume `(0, 10]` (predefinito 1.0; deve essere maggiore di 0).
- `providers.minimax.pitch`: variazione di pitch `-12..12` (predefinito 0).
- `providers.google.model`: modello Gemini TTS (predefinito `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: nome della voce predefinita Gemini (predefinito `Kore`; è accettato anche `voice`).
- `providers.google.baseUrl`: sovrascrive l'URL base della Gemini API. È accettato solo `https://generativelanguage.googleapis.com`.
  - Se `messages.tts.providers.google.apiKey` è omesso, TTS può riutilizzare `models.providers.google.apiKey` prima del fallback env.
- `providers.xai.apiKey`: API key TTS xAI (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: sovrascrive l'URL base TTS xAI (predefinito `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: ID voce xAI (predefinito `eve`; voci live correnti: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: codice lingua BCP-47 oppure `auto` (predefinito `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` oppure `alaw` (predefinito `mp3`).
- `providers.xai.speed`: override della velocità nativa del provider.
- `providers.microsoft.enabled`: consente l'uso della sintesi vocale Microsoft (predefinito `true`; nessuna API key).
- `providers.microsoft.voice`: nome della voce neurale Microsoft (es. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: codice lingua (es. `en-US`).
- `providers.microsoft.outputFormat`: formato di output Microsoft (es. `audio-24khz-48kbitrate-mono-mp3`).
  - Vedi i formati di output Microsoft Speech per i valori validi; non tutti i formati sono supportati dal trasporto bundled basato su Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: stringhe percentuali (es. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: scrive sottotitoli JSON accanto al file audio.
- `providers.microsoft.proxy`: URL proxy per le richieste di sintesi vocale Microsoft.
- `providers.microsoft.timeoutMs`: override del timeout della richiesta (ms).
- `edge.*`: alias legacy delle stesse impostazioni Microsoft.

## Override guidati dal modello (attivi per impostazione predefinita)

Per impostazione predefinita, il modello **può** emettere direttive TTS per una singola risposta.
Quando `messages.tts.auto` è `tagged`, queste direttive sono necessarie per attivare l'audio.

Quando abilitato, il modello può emettere direttive `[[tts:...]]` per sovrascrivere la voce
per una singola risposta, più un blocco facoltativo `[[tts:text]]...[[/tts:text]]` per
fornire tag espressivi (risate, indicazioni di canto, ecc.) che devono comparire solo
nell'audio.

Le direttive `provider=...` vengono ignorate a meno che `modelOverrides.allowProvider: true`.

Esempio di payload di risposta:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Chiavi di direttiva disponibili (quando abilitate):

- `provider` (ID provider speech registrato, ad esempio `openai`, `elevenlabs`, `google`, `minimax` o `microsoft`; richiede `allowProvider: true`)
- `voice` (voce OpenAI), `voiceName` / `voice_name` / `google_voice` (voce Google), oppure `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (modello TTS OpenAI, model id ElevenLabs o modello MiniMax) oppure `google_model` (modello TTS Google)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (pitch MiniMax, da -12 a 12)
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

Allowlist facoltativa (abilita il cambio provider mantenendo configurabili le altre opzioni):

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

## Preferenze per-utente

I comandi slash scrivono override locali in `prefsPath` (predefinito:
`~/.openclaw/settings/tts.json`, sovrascrivibile con `OPENCLAW_TTS_PREFS` oppure
`messages.tts.prefsPath`).

Campi memorizzati:

- `enabled`
- `provider`
- `maxLength` (soglia di riepilogo; predefinito 1500 caratteri)
- `summarize` (predefinito `true`)

Questi sovrascrivono `messages.tts.*` per quell'host.

## Formati di output (fissi)

- **Feishu / Matrix / Telegram / WhatsApp**: messaggio vocale Opus (`opus_48000_64` da ElevenLabs, `opus` da OpenAI).
  - 48kHz / 64kbps è un buon compromesso per i messaggi vocali.
- **Altri canali**: MP3 (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI).
  - 44.1kHz / 128kbps è il bilanciamento predefinito per la chiarezza del parlato.
- **MiniMax**: MP3 (modello `speech-2.8-hd`, frequenza di campionamento 32kHz). Il formato nota vocale non è supportato nativamente; usa OpenAI o ElevenLabs per messaggi vocali Opus garantiti.
- **Google Gemini**: il TTS della Gemini API restituisce PCM raw a 24kHz. OpenClaw lo incapsula come WAV per gli allegati audio e restituisce PCM direttamente per Talk/telefonia. Il formato nativo nota vocale Opus non è supportato da questo percorso.
- **xAI**: MP3 per impostazione predefinita; `responseFormat` può essere `mp3`, `wav`, `pcm`, `mulaw` o `alaw`. OpenClaw usa l'endpoint batch REST TTS di xAI e restituisce un allegato audio completo; il WebSocket TTS in streaming di xAI non viene usato da questo percorso provider. Il formato nativo nota vocale Opus non è supportato da questo percorso.
- **Microsoft**: usa `microsoft.outputFormat` (predefinito `audio-24khz-48kbitrate-mono-mp3`).
  - Il trasporto bundled accetta un `outputFormat`, ma non tutti i formati sono disponibili dal servizio.
  - I valori di output format seguono i formati di output Microsoft Speech (inclusi Ogg/WebM Opus).
  - Telegram `sendVoice` accetta OGG/MP3/M4A; usa OpenAI/ElevenLabs se hai bisogno
    di messaggi vocali Opus garantiti.
  - Se il formato di output Microsoft configurato fallisce, OpenClaw ritenta con MP3.

I formati di output OpenAI/ElevenLabs sono fissi per canale (vedi sopra).

## Comportamento auto-TTS

Quando è abilitato, OpenClaw:

- salta il TTS se la risposta contiene già media o una direttiva `MEDIA:`.
- salta le risposte molto brevi (< 10 caratteri).
- riepiloga le risposte lunghe quando abilitato usando `agents.defaults.model.primary` (o `summaryModel`).
- allega l'audio generato alla risposta.

Se la risposta supera `maxLength` e il riepilogo è disattivato (oppure manca una API key per il
modello di riepilogo), l'audio
viene saltato e viene inviata la normale risposta testuale.

## Diagramma di flusso

```
Risposta -> TTS abilitato?
  no  -> invia testo
  sì  -> ha media / MEDIA: / è breve?
          sì  -> invia testo
          no  -> lunghezza > limite?
                   no  -> TTS -> allega audio
                   sì -> riepilogo abilitato?
                            no  -> invia testo
                            sì -> riepiloga (summaryModel o agents.defaults.model.primary)
                                      -> TTS -> allega audio
```

## Uso del comando slash

Esiste un solo comando: `/tts`.
Vedi [Comandi slash](/it/tools/slash-commands) per i dettagli di abilitazione.

Nota Discord: `/tts` è un comando Discord built-in, quindi OpenClaw registra
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

- I comandi richiedono un mittente autorizzato (le regole di allowlist/proprietario si applicano comunque).
- Devono essere abilitati `commands.text` oppure la registrazione dei comandi nativi.
- La configurazione `messages.tts.auto` accetta `off|always|inbound|tagged`.
- `/tts on` scrive la preferenza TTS locale su `always`; `/tts off` la scrive su `off`.
- Usa la configurazione quando vuoi valori predefiniti `inbound` o `tagged`.
- `limit` e `summary` vengono memorizzati nelle preferenze locali, non nella configurazione principale.
- `/tts audio` genera una risposta audio one-off (non attiva il TTS in modo permanente).
- `/tts status` include la visibilità del fallback per l'ultimo tentativo:
  - fallback riuscito: `Fallback: <primary> -> <used>` più `Attempts: ...`
  - fallimento: `Error: ...` più `Attempts: ...`
  - diagnostica dettagliata: `Attempt details: provider:outcome(reasonCode) latency`
- I fallimenti API di OpenAI ed ElevenLabs ora includono il dettaglio dell'errore provider analizzato e il request id (quando restituito dal provider), che viene esposto negli errori/log TTS.

## Strumento agente

Lo strumento `tts` converte testo in voce e restituisce un allegato audio per
la consegna della risposta. Quando il canale è Feishu, Matrix, Telegram o WhatsApp,
l'audio viene consegnato come messaggio vocale anziché come allegato file.

## Gateway RPC

Metodi Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
