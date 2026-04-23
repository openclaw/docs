---
read_when:
    - Vuoi effettuare una chiamata vocale in uscita da OpenClaw
    - Stai configurando o sviluppando il plugin voice-call
summary: 'Plugin Voice Call: chiamate in uscita + in entrata tramite Twilio/Telnyx/Plivo (installazione del plugin + configurazione + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-23T08:34:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fbfe1aba459dd4fbe1b5c100430ff8cbe8987d7d34b875d115afcaee6e56412
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (plugin)

Chiamate vocali per OpenClaw tramite plugin. Supporta notifiche in uscita e
conversazioni multi-turno con policy per le chiamate in entrata.

Provider attuali:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + trasferimento XML + GetInput speech)
- `mock` (sviluppo/nessuna rete)

Modello mentale rapido:

- Installa il plugin
- Riavvia il Gateway
- Configura sotto `plugins.entries.voice-call.config`
- Usa `openclaw voicecall ...` o lo strumento `voice_call`

## Dove viene eseguito (locale vs remoto)

Il plugin Voice Call viene eseguito **all'interno del processo Gateway**.

Se usi un Gateway remoto, installa/configura il plugin sulla **macchina che esegue il Gateway**, quindi riavvia il Gateway per caricarlo.

## Installazione

### Opzione A: installa da npm (consigliato)

```bash
openclaw plugins install @openclaw/voice-call
```

Successivamente riavvia il Gateway.

### Opzione B: installa da una cartella locale (sviluppo, senza copia)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Successivamente riavvia il Gateway.

## Configurazione

Imposta la configurazione sotto `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Telnyx Mission Control Portal
            // (Base64 string; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; first registered realtime transcription provider when unset
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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

- Twilio/Telnyx richiedono un URL Webhook **raggiungibile pubblicamente**.
- Plivo richiede un URL Webhook **raggiungibile pubblicamente**.
- `mock` è un provider locale per sviluppo (nessuna chiamata di rete).
- Se configurazioni meno recenti usano ancora `provider: "log"`, `twilio.from` o chiavi OpenAI legacy `streaming.*`, esegui `openclaw doctor --fix` per riscriverle.
- Telnyx richiede `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) a meno che `skipSignatureVerification` non sia true.
- `skipSignatureVerification` è solo per test locali.
- Se usi il piano gratuito di ngrok, imposta `publicUrl` all'URL ngrok esatto; la verifica della firma viene sempre applicata.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` consente Webhook Twilio con firme non valide **solo** quando `tunnel.provider="ngrok"` e `serve.bind` è loopback (agente locale ngrok). Usalo solo per sviluppo locale.
- Gli URL del piano gratuito ngrok possono cambiare o aggiungere comportamento interstitial; se `publicUrl` deriva, le firme Twilio falliranno. Per la produzione, preferisci un dominio stabile o un funnel Tailscale.
- Valori predefiniti di sicurezza dello streaming:
  - `streaming.preStartTimeoutMs` chiude i socket che non inviano mai un frame `start` valido.
- `streaming.maxPendingConnections` limita il numero totale di socket pre-start non autenticati.
- `streaming.maxPendingConnectionsPerIp` limita i socket pre-start non autenticati per IP sorgente.
- `streaming.maxConnections` limita il totale dei socket aperti del flusso media (in attesa + attivi).
- Il fallback runtime accetta ancora per ora quelle vecchie chiavi voice-call, ma il percorso di riscrittura è `openclaw doctor --fix` e lo shim di compatibilità è temporaneo.

## Trascrizione streaming

`streaming` seleziona un provider di trascrizione realtime per l'audio live della chiamata.

Comportamento runtime attuale:

- `streaming.provider` è facoltativo. Se non impostato, Voice Call usa il primo
  provider di trascrizione realtime registrato.
- I provider di trascrizione realtime inclusi comprendono Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI
  (`xai`), registrati dai rispettivi plugin provider.
- La configurazione raw posseduta dal provider si trova sotto `streaming.providers.<providerId>`.
- Se `streaming.provider` punta a un provider non registrato, oppure se non è registrato alcun provider
  di trascrizione realtime, Voice Call registra un avviso e
  salta lo streaming media invece di far fallire l'intero plugin.

Valori predefiniti della trascrizione streaming OpenAI:

- Chiave API: `streaming.providers.openai.apiKey` oppure `OPENAI_API_KEY`
- modello: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Valori predefiniti della trascrizione streaming xAI:

- Chiave API: `streaming.providers.xai.apiKey` oppure `XAI_API_KEY`
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
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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
                apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
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

## Reaper delle chiamate obsolete

Usa `staleCallReaperSeconds` per terminare le chiamate che non ricevono mai un Webhook terminale
(ad esempio, chiamate in modalità notify che non si completano). Il valore predefinito è `0`
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

## Sicurezza dei Webhook

Quando un proxy o tunnel si trova davanti al Gateway, il plugin ricostruisce l'
URL pubblico per la verifica della firma. Queste opzioni controllano di quali header inoltrati ci si fida.

`webhookSecurity.allowedHosts` inserisce in allowlist gli host dagli header di inoltro.

`webhookSecurity.trustForwardingHeaders` considera affidabili gli header inoltrati senza allowlist.

`webhookSecurity.trustedProxyIPs` considera affidabili gli header inoltrati solo quando l'
IP remoto della richiesta corrisponde all'elenco.

La protezione dal replay dei Webhook è abilitata per Twilio e Plivo. Le richieste Webhook valide ma ripetute
vengono confermate ma saltate per quanto riguarda gli effetti collaterali.

I turni di conversazione Twilio includono un token per turno nelle callback `<Gather>`, quindi
callback vocali obsolete/ripetute non possono soddisfare un turno di trascrizione più recente in attesa.

Le richieste Webhook non autenticate vengono rifiutate prima della lettura del body quando mancano gli
header di firma richiesti dal provider.

Il Webhook voice-call usa il profilo condiviso del body pre-auth (64 KB / 5 secondi)
più un limite per-IP delle richieste in-flight prima della verifica della firma.

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
voce in streaming nelle chiamate. Puoi sovrascriverla nella configurazione del plugin con la
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

- Le chiavi legacy `tts.<provider>` dentro la configurazione del plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) vengono migrate automaticamente a `tts.providers.<provider>` al caricamento. Preferisci la forma `providers` nella configurazione salvata.
- **Microsoft speech viene ignorato per le chiamate vocali** (l'audio di telefonia richiede PCM; l'attuale trasporto Microsoft non espone output PCM per telefonia).
- Il TTS core viene usato quando lo streaming media Twilio è abilitato; altrimenti le chiamate ricadono sulle voci native del provider.
- Se un media stream Twilio è già attivo, Voice Call non ricade su TwiML `<Say>`. Se il TTS di telefonia non è disponibile in quello stato, la richiesta di riproduzione fallisce invece di mescolare due percorsi di riproduzione.
- Quando il TTS di telefonia ricade su un provider secondario, Voice Call registra un avviso con la catena di provider (`from`, `to`, `attempts`) per il debug.

### Altri esempi

Usa solo il TTS core (nessuna sovrascrittura):

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

Sovrascrivi con ElevenLabs solo per le chiamate (mantieni altrove il predefinito core):

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

La policy in entrata è predefinita su `disabled`. Per abilitare le chiamate in entrata, imposta:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` è un filtro a bassa affidabilità basato su caller ID. Il plugin
normalizza il valore `From` fornito dal provider e lo confronta con `allowFrom`.
La verifica del Webhook autentica la consegna del provider e l'integrità del payload, ma
non prova il possesso del numero chiamante PSTN/VoIP. Tratta `allowFrom` come
filtro del caller ID, non come identità forte del chiamante.

Le risposte automatiche usano il sistema dell'agente. Regolalo con:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contratto dell'output parlato

Per le risposte automatiche, Voice Call aggiunge al prompt di sistema un contratto rigoroso per l'output parlato:

- `{"spoken":"..."}`

Voice Call poi estrae il testo parlato in modo difensivo:

- Ignora payload contrassegnati come contenuto di ragionamento/errore.
- Analizza JSON diretto, JSON delimitato da fence o chiavi `"spoken"` inline.
- Ricade su testo semplice e rimuove i paragrafi iniziali probabilmente di pianificazione/meta.

Questo mantiene la riproduzione parlata concentrata sul testo rivolto al chiamante ed evita che testo di pianificazione finisca nell'audio.

### Comportamento di avvio della conversazione

Per le chiamate in uscita `conversation`, la gestione del primo messaggio è legata allo stato di riproduzione live:

- Lo svuotamento della coda per barge-in e la risposta automatica vengono soppressi solo mentre il saluto iniziale è attivamente in riproduzione.
- Se la riproduzione iniziale fallisce, la chiamata torna a `listening` e il messaggio iniziale resta in coda per un nuovo tentativo.
- La riproduzione iniziale per lo streaming Twilio parte alla connessione dello stream senza ritardi aggiuntivi.

### Grace del disconnect dello stream Twilio

Quando uno stream media Twilio si disconnette, Voice Call attende `2000ms` prima di terminare automaticamente la chiamata:

- Se lo stream si ricollega entro quella finestra, la terminazione automatica viene annullata.
- Se nessuno stream viene registrato di nuovo dopo il periodo di grace, la chiamata viene terminata per evitare chiamate attive bloccate.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` legge `calls.jsonl` dal percorso di storage predefinito di voice-call. Usa
`--file <path>` per puntare a un log diverso e `--last <n>` per limitare l'analisi
agli ultimi N record (predefinito 200). L'output include p50/p90/p99 per la
latenza del turno e i tempi di attesa di ascolto.

## Strumento agente

Nome dello strumento: `voice_call`

Azioni:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Questo repository include un documento Skills corrispondente in `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
