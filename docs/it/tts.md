---
read_when:
    - Abilitazione del text-to-speech per le risposte
    - Configurazione dei provider o dei limiti TTS
    - Uso dei comandi /tts
summary: Text-to-speech (TTS) per le risposte in uscita
title: Text-to-Speech (percorso legacy)
x-i18n:
    generated_at: "2026-04-05T14:08:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca61773996299a582ab88e5a5db12d8f22ce8a28292ce97cc5dd5fdc2d3b83
    source_path: tts.md
    workflow: 15
---

# Text-to-speech (TTS)

OpenClaw può convertire le risposte in uscita in audio usando ElevenLabs, Microsoft, MiniMax o OpenAI.
Funziona ovunque OpenClaw possa inviare audio.

## Servizi supportati

- **ElevenLabs** (provider primario o di fallback)
- **Microsoft** (provider primario o di fallback; l'implementazione inclusa attuale usa `node-edge-tts`)
- **MiniMax** (provider primario o di fallback; usa l'API T2A v2)
- **OpenAI** (provider primario o di fallback; usato anche per i riepiloghi)

### Note su Microsoft speech

Il provider speech Microsoft incluso usa attualmente il servizio TTS neurale
online di Microsoft Edge tramite la libreria `node-edge-tts`. È un servizio ospitato (non
locale), usa endpoint Microsoft e non richiede una chiave API.
`node-edge-tts` espone opzioni di configurazione speech e formati di output, ma
non tutte le opzioni sono supportate dal servizio. La configurazione legacy e l'input di direttive
che usa `edge` continua a funzionare ed è normalizzato a `microsoft`.

Poiché questo percorso usa un servizio web pubblico senza SLA o quota pubblicati,
trattalo come best-effort. Se hai bisogno di limiti garantiti e supporto, usa OpenAI
o ElevenLabs.

## Chiavi opzionali

Se vuoi usare OpenAI, ElevenLabs o MiniMax:

- `ELEVENLABS_API_KEY` (oppure `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

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

## È abilitato per impostazione predefinita?

No. L'auto‑TTS è **disattivato** per impostazione predefinita. Abilitalo nella configurazione con
`messages.tts.auto` oppure per sessione con `/tts always` (alias: `/tts on`).

Quando `messages.tts.provider` non è impostato, OpenClaw sceglie il primo
provider speech configurato nell'ordine di selezione automatica del registry.

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

### OpenAI come primario con ElevenLabs come fallback

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

### Microsoft come primario (senza chiave API)

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

### MiniMax come primario

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

### Disabilitare il riepilogo automatico per risposte lunghe

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Quindi esegui:

```
/tts summary off
```

### Note sui campi

- `auto`: modalità auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` invia audio solo dopo un messaggio vocale in ingresso.
  - `tagged` invia audio solo quando la risposta include tag `[[tts]]`.
- `enabled`: interruttore legacy (doctor lo migra a `auto`).
- `mode`: `"final"` (predefinito) oppure `"all"` (include risposte di strumenti/blocchi).
- `provider`: ID provider speech come `"elevenlabs"`, `"microsoft"`, `"minimax"` o `"openai"` (il fallback è automatico).
- Se `provider` **non è impostato**, OpenClaw usa il primo provider speech configurato nell'ordine di selezione automatica del registry.
- Il legacy `provider: "edge"` continua a funzionare ed è normalizzato a `microsoft`.
- `summaryModel`: modello economico facoltativo per il riepilogo automatico; il valore predefinito è `agents.defaults.model.primary`.
  - Accetta `provider/model` oppure un alias di modello configurato.
- `modelOverrides`: consente al modello di emettere direttive TTS (attivo per impostazione predefinita).
  - `allowProvider` ha valore predefinito `false` (il cambio provider richiede adesione esplicita).
- `providers.<id>`: impostazioni di proprietà del provider indicate dall'ID provider speech.
- I blocchi provider diretti legacy (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) vengono migrati automaticamente a `messages.tts.providers.<id>` al caricamento.
- `maxTextLength`: limite rigido per l'input TTS (caratteri). `/tts audio` fallisce se viene superato.
- `timeoutMs`: timeout richiesta (ms).
- `prefsPath`: sovrascrive il percorso JSON locale delle preferenze (provider/limite/riepilogo).
- I valori `apiKey` usano come fallback variabili env (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: sovrascrive l'URL base API di ElevenLabs.
- `providers.openai.baseUrl`: sovrascrive l'endpoint TTS OpenAI.
  - Ordine di risoluzione: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - I valori non predefiniti vengono trattati come endpoint TTS compatibili con OpenAI, quindi sono accettati nomi personalizzati di modelli e voci.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normale)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 a 2 lettere (ad es. `en`, `de`)
- `providers.elevenlabs.seed`: intero `0..4294967295` (determinismo best-effort)
- `providers.minimax.baseUrl`: sovrascrive l'URL base API MiniMax (predefinito `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: modello TTS (predefinito `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identificatore voce (predefinito `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: velocità di riproduzione `0.5..2.0` (predefinito 1.0).
- `providers.minimax.vol`: volume `(0, 10]` (predefinito 1.0; deve essere maggiore di 0).
- `providers.minimax.pitch`: variazione di tonalità `-12..12` (predefinito 0).
- `providers.microsoft.enabled`: consente l'uso di Microsoft speech (predefinito `true`; nessuna chiave API).
- `providers.microsoft.voice`: nome della voce neurale Microsoft (ad es. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: codice lingua (ad es. `en-US`).
- `providers.microsoft.outputFormat`: formato di output Microsoft (ad es. `audio-24khz-48kbitrate-mono-mp3`).
  - Vedi i formati di output Microsoft Speech per i valori validi; non tutti i formati sono supportati dal trasporto incluso basato su Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: stringhe percentuali (ad es. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: scrive sottotitoli JSON accanto al file audio.
- `providers.microsoft.proxy`: URL proxy per le richieste Microsoft speech.
- `providers.microsoft.timeoutMs`: override del timeout richiesta (ms).
- `edge.*`: alias legacy per le stesse impostazioni Microsoft.

## Override guidati dal modello (attivi per impostazione predefinita)

Per impostazione predefinita, il modello **può** emettere direttive TTS per una singola risposta.
Quando `messages.tts.auto` è `tagged`, queste direttive sono necessarie per attivare l'audio.

Quando è abilitato, il modello può emettere direttive `[[tts:...]]` per sovrascrivere la voce
per una singola risposta, più un blocco facoltativo `[[tts:text]]...[[/tts:text]]` per
fornire tag espressivi (risate, indicazioni di canto, ecc.) che devono apparire solo
nell'audio.

Le direttive `provider=...` vengono ignorate a meno che `modelOverrides.allowProvider: true`.

Esempio di payload di risposta:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Chiavi direttiva disponibili (quando abilitate):

- `provider` (ID provider speech registrato, ad esempio `openai`, `elevenlabs`, `minimax` o `microsoft`; richiede `allowProvider: true`)
- `voice` (voce OpenAI) oppure `voiceId` (ElevenLabs / MiniMax)
- `model` (modello TTS OpenAI, ID modello ElevenLabs o modello MiniMax)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (tonalità MiniMax, da -12 a 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Disabilitare tutti gli override del modello:

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

## Preferenze per utente

I comandi slash scrivono override locali in `prefsPath` (predefinito:
`~/.openclaw/settings/tts.json`, sovrascrivibile con `OPENCLAW_TTS_PREFS` oppure
`messages.tts.prefsPath`).

Campi archiviati:

- `enabled`
- `provider`
- `maxLength` (soglia per il riepilogo; predefinito 1500 caratteri)
- `summarize` (predefinito `true`)

Questi sovrascrivono `messages.tts.*` per quell'host.

## Formati di output (fissi)

- **Feishu / Matrix / Telegram / WhatsApp**: messaggio vocale Opus (`opus_48000_64` da ElevenLabs, `opus` da OpenAI).
  - 48kHz / 64kbps è un buon compromesso per i messaggi vocali.
- **Altri canali**: MP3 (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI).
  - 44,1kHz / 128kbps è il bilanciamento predefinito per la chiarezza del parlato.
- **MiniMax**: MP3 (modello `speech-2.8-hd`, frequenza di campionamento 32kHz). Il formato nota vocale non è supportato in modo nativo; usa OpenAI o ElevenLabs per messaggi vocali Opus garantiti.
- **Microsoft**: usa `microsoft.outputFormat` (predefinito `audio-24khz-48kbitrate-mono-mp3`).
  - Il trasporto incluso accetta un `outputFormat`, ma non tutti i formati sono disponibili dal servizio.
  - I valori del formato di output seguono i formati di output Microsoft Speech (inclusi Ogg/WebM Opus).
  - Telegram `sendVoice` accetta OGG/MP3/M4A; usa OpenAI/ElevenLabs se hai bisogno di
    messaggi vocali Opus garantiti.
  - Se il formato di output Microsoft configurato fallisce, OpenClaw riprova con MP3.

I formati di output OpenAI/ElevenLabs sono fissi per canale (vedi sopra).

## Comportamento auto-TTS

Quando è abilitato, OpenClaw:

- salta il TTS se la risposta contiene già media o una direttiva `MEDIA:`.
- salta risposte molto brevi (< 10 caratteri).
- riepiloga le risposte lunghe quando abilitato usando `agents.defaults.model.primary` (oppure `summaryModel`).
- allega l'audio generato alla risposta.

Se la risposta supera `maxLength` e il riepilogo è disattivato (o non c'è alcuna chiave API per il
modello di riepilogo), l'audio
viene saltato e viene inviata la normale risposta testuale.

## Diagramma del flusso

```
Risposta -> TTS abilitato?
  no  -> invia testo
  sì  -> contiene media / MEDIA: / è breve?
          sì  -> invia testo
          no  -> lunghezza > limite?
                   no  -> TTS -> allega audio
                   sì  -> riepilogo abilitato?
                            no  -> invia testo
                            sì -> riepiloga (summaryModel o agents.defaults.model.primary)
                                      -> TTS -> allega audio
```

## Uso dei comandi slash

Esiste un solo comando: `/tts`.
Vedi [Comandi slash](/tools/slash-commands) per i dettagli di abilitazione.

Nota su Discord: `/tts` è un comando integrato di Discord, quindi OpenClaw registra
`/voice` come comando nativo lì. Il testo `/tts ...` continua a funzionare.

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Note:

- I comandi richiedono un mittente autorizzato (continuano ad applicarsi le regole allowlist/owner).
- `commands.text` oppure la registrazione dei comandi nativi devono essere abilitati.
- `off|always|inbound|tagged` sono interruttori per sessione (`/tts on` è un alias di `/tts always`).
- `limit` e `summary` vengono archiviati nelle preferenze locali, non nella configurazione principale.
- `/tts audio` genera una risposta audio una tantum (non attiva il TTS).
- `/tts status` include visibilità del fallback per l'ultimo tentativo:
  - fallback riuscito: `Fallback: <primary> -> <used>` più `Attempts: ...`
  - errore: `Error: ...` più `Attempts: ...`
  - diagnostica dettagliata: `Attempt details: provider:outcome(reasonCode) latency`
- Gli errori API OpenAI ed ElevenLabs ora includono il dettaglio dell'errore del provider analizzato e l'ID richiesta (quando restituito dal provider), che viene esposto negli errori/log TTS.

## Strumento agente

Lo strumento `tts` converte testo in speech e restituisce un allegato audio per
la consegna della risposta. Quando il canale è Feishu, Matrix, Telegram o WhatsApp,
l'audio viene consegnato come messaggio vocale anziché come allegato file.

## RPC Gateway

Metodi Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
