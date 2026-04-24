---
read_when:
    - Vuoi effettuare una chiamata vocale in uscita da OpenClaw
    - Stai configurando o sviluppando il Plugin voice-call
summary: 'Plugin Voice Call: chiamate in uscita + in entrata tramite Twilio/Telnyx/Plivo (installazione del Plugin + configurazione + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-24T08:54:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cd57118133506c22604ab9592a823546a91795ab425de4b7a81edbbb8374e6d
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

Chiamate vocali per OpenClaw tramite un Plugin. Supporta notifiche in uscita e
conversazioni multi-turno con criteri per le chiamate in entrata.

Provider attuali:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + trasferimento XML + GetInput speech)
- `mock` (sviluppo/nessuna rete)

Modello mentale rapido:

- Installa il Plugin
- Riavvia il Gateway
- Configura sotto `plugins.entries.voice-call.config`
- Usa `openclaw voicecall ...` o lo strumento `voice_call`

## Dove viene eseguito (locale vs remoto)

Il Plugin Voice Call viene eseguito **all'interno del processo Gateway**.

Se usi un Gateway remoto, installa/configura il Plugin sulla **macchina che esegue il Gateway**, poi riavvia il Gateway per caricarlo.

## Installazione

### Opzione A: installa da npm (consigliato)

```bash
openclaw plugins install @openclaw/voice-call
```

Riavvia il Gateway in seguito.

### Opzione B: installa da una cartella locale (sviluppo, senza copia)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Riavvia il Gateway in seguito.

## Configurazione

Imposta la configurazione sotto `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // oppure "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // oppure TWILIO_FROM_NUMBER per Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Chiave pubblica del webhook Telnyx dal Telnyx Mission Control Portal
            // (stringa Base64; può anche essere impostata tramite TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Server webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Sicurezza del webhook (consigliata per tunnel/proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Esposizione pubblica (scegline una)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // facoltativo; usa il primo provider di trascrizione realtime registrato se non impostato
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // facoltativo se OPENAI_API_KEY è impostato
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

Note:

- Twilio/Telnyx richiedono un URL webhook **raggiungibile pubblicamente**.
- Plivo richiede un URL webhook **raggiungibile pubblicamente**.
- `mock` è un provider locale per sviluppo (nessuna chiamata di rete).
- Se configurazioni più vecchie usano ancora `provider: "log"`, `twilio.from` o chiavi OpenAI legacy `streaming.*`, esegui `openclaw doctor --fix` per riscriverle.
- Telnyx richiede `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) a meno che `skipSignatureVerification` non sia true.
- `skipSignatureVerification` è solo per test locali.
- Se usi il tier gratuito di ngrok, imposta `publicUrl` sull'URL ngrok esatto; la verifica della firma viene sempre applicata.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` consente webhook Twilio con firme non valide **solo** quando `tunnel.provider="ngrok"` e `serve.bind` è loopback (agente locale ngrok). Usalo solo per sviluppo locale.
- Gli URL ngrok del tier gratuito possono cambiare o aggiungere comportamento interstiziale; se `publicUrl` cambia, le firme Twilio falliranno. Per la produzione, preferisci un dominio stabile o Tailscale funnel.
- Valori predefiniti di sicurezza per lo streaming:
  - `streaming.preStartTimeoutMs` chiude i socket che non inviano mai un frame `start` valido.
- `streaming.maxPendingConnections` limita il numero totale di socket pre-start non autenticati.
- `streaming.maxPendingConnectionsPerIp` limita i socket pre-start non autenticati per IP sorgente.
- `streaming.maxConnections` limita il numero totale di socket aperti per media stream (in attesa + attivi).
- Il fallback runtime accetta ancora per ora quelle vecchie chiavi voice-call, ma il percorso di riscrittura è `openclaw doctor --fix` e lo shim di compatibilità è temporaneo.

## Trascrizione in streaming

`streaming` seleziona un provider di trascrizione realtime per l'audio live della chiamata.

Comportamento runtime attuale:

- `streaming.provider` è facoltativo. Se non impostato, Voice Call usa il primo
  provider di trascrizione realtime registrato.
- I provider inclusi di trascrizione realtime comprendono Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI
  (`xai`), registrati dai rispettivi Plugin provider.
- La configurazione raw di proprietà del provider si trova sotto `streaming.providers.<providerId>`.
- Se `streaming.provider` punta a un provider non registrato, oppure non è registrato alcun
  provider di trascrizione realtime, Voice Call registra un avviso nei log e
  salta lo streaming dei media invece di far fallire l'intero Plugin.

Valori predefiniti della trascrizione streaming OpenAI:

- Chiave API: `streaming.providers.openai.apiKey` o `OPENAI_API_KEY`
- modello: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Valori predefiniti della trascrizione streaming xAI:

- Chiave API: `streaming.providers.xai.apiKey` o `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Esempio:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // facoltativo se OPENAI_API_KEY è impostato
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Usa invece xAI:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // facoltativo se XAI_API_KEY è impostato
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Le chiavi legacy vengono ancora migrate automaticamente da `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Reaper delle chiamate stale

Usa `staleCallReaperSeconds` per terminare chiamate che non ricevono mai un webhook terminale
(ad esempio chiamate in modalità notify che non completano mai). Il valore predefinito è `0`
(disabilitato).

Intervalli consigliati:

- **Produzione:** `120`–`300` secondi per flussi in stile notify.
- Mantieni questo valore **più alto di `maxDurationSeconds`** in modo che le chiamate normali possano
  terminare. Un buon punto di partenza è `maxDurationSeconds + 30–60` secondi.

Esempio:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Sicurezza del webhook

Quando un proxy o un tunnel si trova davanti al Gateway, il Plugin ricostruisce l'URL
pubblico per la verifica della firma. Queste opzioni controllano di quali header inoltrati fidarsi.

`webhookSecurity.allowedHosts` definisce una allowlist di host dagli header di inoltro.

`webhookSecurity.trustForwardingHeaders` si fida degli header inoltrati senza una allowlist.

`webhookSecurity.trustedProxyIPs` si fida degli header inoltrati solo quando l'IP
remoto della richiesta corrisponde all'elenco.

La protezione da replay del webhook è abilitata per Twilio e Plivo. Le richieste webhook
valide ma ripetute vengono riconosciute ma saltate per quanto riguarda gli effetti collaterali.

I turni di conversazione Twilio includono un token per turno nei callback `<Gather>`, quindi
callback vocali stale/ripetuti non possono soddisfare un turno di trascrizione più recente in attesa.

Le richieste webhook non autenticate vengono rifiutate prima della lettura del body quando mancano gli header di firma richiesti dal provider.

Il webhook voice-call usa il profilo body condiviso pre-auth (64 KB / 5 secondi)
più un limite per-IP di richieste in-flight prima della verifica della firma.

Esempio con un host pubblico stabile:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS per le chiamate

Voice Call usa la configurazione core `messages.tts` per la
sintesi vocale in streaming nelle chiamate. Puoi sovrascriverla nella configurazione del Plugin con la
**stessa forma** — viene unita in deep-merge con `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Note:

- Le chiavi legacy `tts.<provider>` dentro la configurazione del Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) vengono migrate automaticamente in `tts.providers.<provider>` al caricamento. Preferisci la forma `providers` nella configurazione versionata.
- **Microsoft speech viene ignorato per le chiamate vocali** (l'audio di telefonia richiede PCM; l'attuale trasporto Microsoft non espone output PCM per telefonia).
- Il TTS core viene usato quando lo streaming media Twilio è abilitato; altrimenti le chiamate usano il fallback alle voci native del provider.
- Se uno stream media Twilio è già attivo, Voice Call non usa il fallback a TwiML `<Say>`. Se il TTS di telefonia non è disponibile in quello stato, la richiesta di riproduzione fallisce invece di mescolare due percorsi di riproduzione.
- Quando il TTS di telefonia usa il fallback a un provider secondario, Voice Call registra un avviso con la catena dei provider (`from`, `to`, `attempts`) per il debug.

### Altri esempi

Usa solo il TTS core (nessun override):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Override a ElevenLabs solo per le chiamate (mantieni il core predefinito altrove):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Sovrascrivi solo il modello OpenAI per le chiamate (esempio di deep-merge):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Chiamate in entrata

Il criterio predefinito per le chiamate in entrata è `disabled`. Per abilitare le chiamate in entrata, imposta:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` è un filtro del caller ID a bassa affidabilità. Il Plugin
normalizza il valore `From` fornito dal provider e lo confronta con `allowFrom`.
La verifica del webhook autentica il recapito del provider e l'integrità del payload, ma
non dimostra la proprietà del numero chiamante PSTN/VoIP. Tratta `allowFrom` come
filtro del caller ID, non come forte identità del chiamante.

Le risposte automatiche usano il sistema dell'agente. Regolale con:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contratto dell'output parlato

Per le risposte automatiche, Voice Call aggiunge un contratto rigoroso di output parlato al prompt di sistema:

- `{"spoken":"..."}`

Voice Call poi estrae il testo da pronunciare in modo difensivo:

- Ignora i payload contrassegnati come contenuto di reasoning/errore.
- Esegue il parsing di JSON diretto, JSON fenced o chiavi `"spoken"` inline.
- Usa il fallback al testo semplice e rimuove probabili paragrafi iniziali di pianificazione/meta.

Questo mantiene la riproduzione vocale focalizzata sul testo rivolto al chiamante ed evita che il testo di pianificazione trapeli nell'audio.

### Comportamento di avvio della conversazione

Per le chiamate in uscita `conversation`, la gestione del primo messaggio è legata allo stato della riproduzione live:

- Lo svuotamento della coda per barge-in e la risposta automatica vengono soppressi solo mentre il saluto iniziale è attivamente in riproduzione.
- Se la riproduzione iniziale fallisce, la chiamata torna in stato `listening` e il messaggio iniziale resta in coda per un nuovo tentativo.
- La riproduzione iniziale per lo streaming Twilio inizia alla connessione dello stream senza ritardi aggiuntivi.

### Grace per la disconnessione dello stream Twilio

Quando uno stream media Twilio si disconnette, Voice Call attende `2000ms` prima di terminare automaticamente la chiamata:

- Se lo stream si riconnette durante quella finestra, la terminazione automatica viene annullata.
- Se nessuno stream viene registrato di nuovo dopo il periodo di grace, la chiamata viene terminata per evitare chiamate attive bloccate.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias di call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # riepiloga la latenza dei turni dai log
openclaw voicecall expose --mode funnel
```

`latency` legge `calls.jsonl` dal percorso di archiviazione predefinito di voice-call. Usa
`--file <path>` per indicare un log diverso e `--last <n>` per limitare l'analisi
agli ultimi N record (predefinito 200). L'output include p50/p90/p99 per la
latenza dei turni e i tempi di attesa in ascolto.

## Strumento dell'agente

Nome dello strumento: `voice_call`

Azioni:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Questo repo include una skill doc corrispondente in `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Correlati

- [Text-to-speech](/it/tools/tts)
- [Modalità Talk](/it/nodes/talk)
- [Attivazione vocale](/it/nodes/voicewake)
