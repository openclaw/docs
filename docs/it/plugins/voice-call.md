---
read_when:
    - Vuoi effettuare una chiamata vocale in uscita da OpenClaw
    - Stai configurando o sviluppando il plugin voice-call
summary: 'Plugin Voice Call: chiamate in uscita + in ingresso tramite Twilio/Telnyx/Plivo (installazione plugin + configurazione + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-05T14:00:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6d10c9fde6ce1f51637af285edc0c710e9cb7702231c0a91b527b721eaddc1
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (plugin)

Chiamate vocali per OpenClaw tramite un plugin. Supporta notifiche in uscita e
conversazioni multi-turn con policy in ingresso.

Provider attuali:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + trasferimento XML + GetInput speech)
- `mock` (sviluppo/senza rete)

Modello mentale rapido:

- Installa il plugin
- Riavvia il Gateway
- Configura sotto `plugins.entries.voice-call.config`
- Usa `openclaw voicecall ...` o lo strumento `voice_call`

## Dove viene eseguito (locale vs remoto)

Il plugin Voice Call viene eseguito **all'interno del processo Gateway**.

Se usi un Gateway remoto, installa/configura il plugin sulla **macchina che esegue il Gateway**, quindi riavvia il Gateway per caricarlo.

## Installazione

### Opzione A: installazione da npm (consigliata)

```bash
openclaw plugins install @openclaw/voice-call
```

Riavvia poi il Gateway.

### Opzione B: installazione da una cartella locale (sviluppo, senza copia)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Riavvia poi il Gateway.

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
          fromNumber: "+15550001234",
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

          // Sicurezza webhook (consigliata per tunnel/proxy)
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
            provider: "openai", // facoltativo; primo provider di trascrizione realtime registrato se non impostato
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
- `mock` è un provider di sviluppo locale (nessuna chiamata di rete).
- Se configurazioni meno recenti usano ancora `provider: "log"`, `twilio.from` o chiavi OpenAI legacy `streaming.*`, esegui `openclaw doctor --fix` per riscriverle.
- Telnyx richiede `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) a meno che `skipSignatureVerification` non sia true.
- `skipSignatureVerification` è solo per test locali.
- Se usi il livello gratuito di ngrok, imposta `publicUrl` sull'URL ngrok esatto; la verifica della firma viene sempre applicata.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` consente i webhook Twilio con firme non valide **solo** quando `tunnel.provider="ngrok"` e `serve.bind` è loopback (agente locale ngrok). Usalo solo per sviluppo locale.
- Gli URL del livello gratuito di ngrok possono cambiare o aggiungere comportamenti interstiziali; se `publicUrl` deriva, le firme Twilio falliranno. Per la produzione, preferisci un dominio stabile o Tailscale funnel.
- Valori predefiniti di sicurezza dello streaming:
  - `streaming.preStartTimeoutMs` chiude i socket che non inviano mai un frame `start` valido.
- `streaming.maxPendingConnections` limita il totale dei socket pre-start non autenticati.
- `streaming.maxPendingConnectionsPerIp` limita i socket pre-start non autenticati per IP sorgente.
- `streaming.maxConnections` limita il totale dei socket media stream aperti (in attesa + attivi).
- Il fallback runtime accetta ancora temporaneamente quelle vecchie chiavi voice-call, ma il percorso di riscrittura è `openclaw doctor --fix` e lo shim di compatibilità è temporaneo.

## Trascrizione in streaming

`streaming` seleziona un provider di trascrizione realtime per l'audio delle chiamate live.

Comportamento runtime attuale:

- `streaming.provider` è facoltativo. Se non impostato, Voice Call usa il primo
  provider di trascrizione realtime registrato.
- Oggi il provider incluso è OpenAI, registrato dal plugin incluso `openai`.
- La configurazione grezza di proprietà del provider si trova in `streaming.providers.<providerId>`.
- Se `streaming.provider` punta a un provider non registrato, o non è registrato alcun provider
  di trascrizione realtime, Voice Call registra un avviso e
  salta lo streaming media invece di far fallire l'intero plugin.

Valori predefiniti per la trascrizione streaming OpenAI:

- API key: `streaming.providers.openai.apiKey` o `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

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

Le chiavi legacy vengono ancora migrate automaticamente da `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Reaper delle chiamate stale

Usa `staleCallReaperSeconds` per terminare le chiamate che non ricevono mai un webhook terminale
(ad esempio le chiamate in modalità notify che non si completano mai). Il valore predefinito è `0`
(disabilitato).

Intervalli consigliati:

- **Produzione:** `120`–`300` secondi per i flussi in stile notify.
- Mantieni questo valore **più alto di `maxDurationSeconds`** così le chiamate normali possono
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

## Sicurezza dei webhook

Quando un proxy o un tunnel si trova davanti al Gateway, il plugin ricostruisce l'URL
pubblico per la verifica della firma. Queste opzioni controllano quali header inoltrati sono attendibili.

`webhookSecurity.allowedHosts` mette in allowlist gli host dagli header di inoltro.

`webhookSecurity.trustForwardingHeaders` considera attendibili gli header inoltrati senza allowlist.

`webhookSecurity.trustedProxyIPs` considera attendibili gli header inoltrati solo quando l'IP remoto
della richiesta corrisponde all'elenco.

La protezione replay dei webhook è abilitata per Twilio e Plivo. Le richieste webhook valide ma ripetute
vengono confermate ma saltate per quanto riguarda gli effetti collaterali.

I turni di conversazione Twilio includono un token per turno nelle callback `<Gather>`, così
callback vocali stale/ripetute non possono soddisfare un turno di trascrizione più recente in attesa.

Le richieste webhook non autenticate vengono rifiutate prima della lettura del body quando
mancano gli header di firma richiesti dal provider.

Il webhook voice-call usa il profilo body pre-auth condiviso (64 KB / 5 secondi)
più un limite in-flight per IP prima della verifica della firma.

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

Voice Call usa la configurazione core `messages.tts` per
lo speech in streaming nelle chiamate. Puoi sovrascriverla nella configurazione del plugin con la
**stessa struttura** — viene unita in profondità con `messages.tts`.

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

- Le chiavi legacy `tts.<provider>` nella configurazione del plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) vengono migrate automaticamente a `tts.providers.<provider>` al caricamento. Preferisci la struttura `providers` nella configurazione salvata.
- **Microsoft speech viene ignorato per le chiamate vocali** (l'audio di telefonia richiede PCM; il trasporto Microsoft attuale non espone output PCM per telefonia).
- Il TTS core viene usato quando è abilitato lo streaming media Twilio; altrimenti le chiamate ricorrono alle voci native del provider.
- Se è già attivo uno stream media Twilio, Voice Call non usa come fallback TwiML `<Say>`. Se in quello stato il TTS di telefonia non è disponibile, la richiesta di riproduzione fallisce invece di mescolare due percorsi di riproduzione.
- Quando il TTS di telefonia ricorre a un provider secondario, Voice Call registra un avviso con la catena dei provider (`from`, `to`, `attempts`) per il debug.

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

Sovrascrivi solo per le chiamate con ElevenLabs (mantieni altrove il predefinito core):

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

## Chiamate in ingresso

La policy in ingresso usa `disabled` come predefinito. Per abilitare le chiamate in ingresso, imposta:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` è un filtro a bassa affidabilità basato sul caller ID. Il plugin
normalizza il valore `From` fornito dal provider e lo confronta con `allowFrom`.
La verifica del webhook autentica la consegna del provider e l'integrità del payload, ma
non prova la proprietà del numero chiamante PSTN/VoIP. Considera `allowFrom` come
filtro del caller ID, non come forte identità del chiamante.

Le risposte automatiche usano il sistema dell'agente. Puoi regolarle con:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contratto dell'output parlato

Per le risposte automatiche, Voice Call aggiunge un rigoroso contratto di output parlato al prompt di sistema:

- `{"spoken":"..."}`

Voice Call poi estrae in modo difensivo il testo da pronunciare:

- Ignora i payload contrassegnati come contenuto di reasoning/errore.
- Analizza JSON diretto, JSON delimitato o chiavi `"spoken"` inline.
- Ripiega sul testo semplice e rimuove i paragrafi iniziali probabilmente di pianificazione/meta.

Questo mantiene la riproduzione parlata focalizzata sul testo rivolto al chiamante ed evita che il testo di pianificazione finisca nell'audio.

### Comportamento di avvio della conversazione

Per le chiamate in uscita `conversation`, la gestione del primo messaggio è legata allo stato della riproduzione live:

- La cancellazione della coda per il barge-in e la risposta automatica vengono soppresse solo mentre il saluto iniziale viene pronunciato attivamente.
- Se la riproduzione iniziale fallisce, la chiamata torna a `listening` e il messaggio iniziale rimane in coda per un nuovo tentativo.
- La riproduzione iniziale per lo streaming Twilio inizia alla connessione dello stream senza ritardi aggiuntivi.

### Grace di disconnessione dello stream Twilio

Quando uno stream media Twilio si disconnette, Voice Call attende `2000ms` prima di terminare automaticamente la chiamata:

- Se lo stream si riconnette durante quella finestra, la terminazione automatica viene annullata.
- Se dopo il periodo di grace non viene nuovamente registrato alcuno stream, la chiamata viene terminata per evitare chiamate attive bloccate.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias di call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # riepiloga la latenza dei turni dai log
openclaw voicecall expose --mode funnel
```

`latency` legge `calls.jsonl` dal percorso di archiviazione predefinito di voice-call. Usa
`--file <path>` per puntare a un log diverso e `--last <n>` per limitare l'analisi
agli ultimi N record (predefinito 200). L'output include p50/p90/p99 per la
latenza dei turni e i tempi di attesa in ascolto.

## Strumento dell'agente

Nome dello strumento: `voice_call`

Azioni:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Questo repository include una skill doc corrispondente in `skills/voice-call/SKILL.md`.

## RPC Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
