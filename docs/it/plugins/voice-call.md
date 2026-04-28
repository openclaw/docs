---
read_when:
    - Vuoi effettuare una chiamata vocale in uscita da OpenClaw
    - Stai configurando o sviluppando il Plugin per chiamate vocali
    - Ti serve voce realtime o trascrizione in streaming sulla telefonia
sidebarTitle: Voice call
summary: Effettua chiamate vocali in uscita e accetta chiamate in ingresso tramite Twilio, Telnyx o Plivo, con voce realtime e trascrizione in streaming facoltative
title: Plugin per chiamate vocali
x-i18n:
    generated_at: "2026-04-26T11:36:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b5e4b338b0c39c71accea7065af70fab695c8f34488ba0fbf7023f2f36f377
    source_path: plugins/voice-call.md
    workflow: 15
---

Chiamate vocali per OpenClaw tramite un Plugin. Supporta notifiche in uscita,
conversazioni multi-turno, voce realtime full-duplex, trascrizione
in streaming e chiamate in ingresso con policy basate su allowlist.

**Provider attuali:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + trasferimento XML + GetInput
speech), `mock` (sviluppo/nessuna rete).

<Note>
Il Plugin Voice Call viene eseguito **dentro il processo Gateway**. Se usi un
Gateway remoto, installa e configura il Plugin sulla macchina che esegue
il Gateway, poi riavvia il Gateway per caricarlo.
</Note>

## Avvio rapido

<Steps>
  <Step title="Installa il Plugin">
    <Tabs>
      <Tab title="Da npm (consigliato)">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Da una cartella locale (sviluppo)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Riavvia il Gateway dopo l'installazione in modo che il Plugin venga caricato.

  </Step>
  <Step title="Configura provider e Webhook">
    Imposta la configurazione sotto `plugins.entries.voice-call.config` (vedi
    [Configurazione](#configuration) qui sotto per la forma completa). Al minimo:
    `provider`, credenziali del provider, `fromNumber` e un URL Webhook
    pubblicamente raggiungibile.
  </Step>
  <Step title="Verifica la configurazione">
    ```bash
    openclaw voicecall setup
    ```

    L'output predefinito è leggibile nei log della chat e nei terminali. Controlla
    abilitazione del Plugin, credenziali del provider, esposizione del Webhook e che
    sia attiva una sola modalità audio (`streaming` o `realtime`). Usa
    `--json` per gli script.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Entrambi sono dry run per impostazione predefinita. Aggiungi `--yes` per effettuare davvero
    una breve chiamata di notifica in uscita:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Per Twilio, Telnyx e Plivo, la configurazione deve risolversi in un **URL Webhook pubblico**.
Se `publicUrl`, l'URL del tunnel, l'URL Tailscale o il fallback serve
si risolvono in loopback o spazio di rete privata, il setup fallisce invece di
avviare un provider che non può ricevere Webhook del carrier.
</Warning>

## Configurazione

Se `enabled: true` ma il provider selezionato non ha credenziali,
i log di avvio del Gateway mostrano un avviso di setup incompleto con le chiavi mancanti e
saltano l'avvio del runtime. Comandi, chiamate RPC e strumenti dell'agente continuano comunque
a restituire l'esatta configurazione mancante del provider quando vengono usati.

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
            // Chiave pubblica Webhook Telnyx dal Mission Control Portal
            // (Base64; può anche essere impostata via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Server Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Sicurezza Webhook (consigliata per tunnel/proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Esposizione pubblica (scegline una)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* vedi Trascrizione in streaming */ },
          realtime: { enabled: false /* vedi Voce realtime */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Note su esposizione e sicurezza del provider">
    - Twilio, Telnyx e Plivo richiedono tutti un URL Webhook **pubblicamente raggiungibile**.
    - `mock` è un provider locale per sviluppo (nessuna chiamata di rete).
    - Telnyx richiede `telnyx.publicKey` (oppure `TELNYX_PUBLIC_KEY`) a meno che `skipSignatureVerification` non sia true.
    - `skipSignatureVerification` serve solo per test locali.
    - Sul piano gratuito di ngrok, imposta `publicUrl` sull'URL ngrok esatto; la verifica della firma viene sempre applicata.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` consente Webhook Twilio con firme non valide **solo** quando `tunnel.provider="ngrok"` e `serve.bind` è loopback (agente locale ngrok). Solo sviluppo locale.
    - Gli URL del piano gratuito ngrok possono cambiare o aggiungere comportamento interstitial; se `publicUrl` deriva, le firme Twilio falliscono. Produzione: preferisci un dominio stabile o un funnel Tailscale.

  </Accordion>
  <Accordion title="Limiti di connessione dello streaming">
    - `streaming.preStartTimeoutMs` chiude i socket che non inviano mai un frame `start` valido.
    - `streaming.maxPendingConnections` limita il totale dei socket pre-start non autenticati.
    - `streaming.maxPendingConnectionsPerIp` limita i socket pre-start non autenticati per IP sorgente.
    - `streaming.maxConnections` limita il totale dei socket aperti del media stream (in attesa + attivi).

  </Accordion>
  <Accordion title="Migrazioni della configurazione legacy">
    Le configurazioni più vecchie che usano `provider: "log"`, `twilio.from` o le chiavi OpenAI legacy
    `streaming.*` vengono riscritte da `openclaw doctor --fix`.
    Il fallback runtime continua per ora ad accettare le vecchie chiavi voice-call, ma
    il percorso di riscrittura è `openclaw doctor --fix` e lo shim di compatibilità è
    temporaneo.

    Chiavi di streaming migrate automaticamente:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Conversazioni vocali realtime

`realtime` seleziona un provider di voce realtime full-duplex per l'audio
live della chiamata. È separato da `streaming`, che inoltra solo l'audio ai
provider di trascrizione realtime.

<Warning>
`realtime.enabled` non può essere combinato con `streaming.enabled`. Scegli una
sola modalità audio per chiamata.
</Warning>

Comportamento runtime attuale:

- `realtime.enabled` è supportato per Twilio Media Streams.
- `realtime.provider` è facoltativo. Se non impostato, Voice Call usa il primo provider di voce realtime registrato.
- Provider di voce realtime inclusi nel bundle: Google Gemini Live (`google`) e OpenAI (`openai`), registrati dai rispettivi Plugin provider.
- La configurazione raw posseduta dal provider vive sotto `realtime.providers.<providerId>`.
- Voice Call espone per impostazione predefinita lo strumento realtime condiviso `openclaw_agent_consult`. Il modello realtime può chiamarlo quando il chiamante richiede ragionamento più profondo, informazioni correnti o normali strumenti OpenClaw.
- Se `realtime.provider` punta a un provider non registrato, oppure non è registrato alcun provider di voce realtime, Voice Call registra un avviso e salta i media realtime invece di far fallire l'intero Plugin.
- Le chiavi di sessione consult riusano la sessione vocale esistente quando disponibile, poi ricadono sul numero di telefono chiamante/chiamato così che le chiamate consult successive mantengano il contesto durante la chiamata.

### Tool policy

`realtime.toolPolicy` controlla l'esecuzione consult:

| Policy           | Comportamento                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Espone lo strumento consult e limita l'agente normale a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`. |
| `owner`          | Espone lo strumento consult e lascia che l'agente normale usi la normale tool policy dell'agente.                                       |
| `none`           | Non espone lo strumento consult. Gli `realtime.tools` personalizzati vengono comunque passati al provider realtime.                      |

### Esempi di provider realtime

<Tabs>
  <Tab title="Google Gemini Live">
    Valori predefiniti: chiave API da `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` o `GOOGLE_GENERATIVE_AI_API_KEY`; modello
    `gemini-2.5-flash-native-audio-preview-12-2025`; voce `Kore`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "Parla brevemente. Chiama openclaw_agent_consult prima di usare strumenti più avanzati.",
                toolPolicy: "safe-read-only",
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Vedi [Provider Google](/it/providers/google) e
[Provider OpenAI](/it/providers/openai) per le opzioni specifiche del provider relative alla voce realtime.

## Trascrizione in streaming

`streaming` seleziona un provider di trascrizione realtime per l'audio live della chiamata.

Comportamento runtime attuale:

- `streaming.provider` è facoltativo. Se non impostato, Voice Call usa il primo provider di trascrizione realtime registrato.
- Provider di trascrizione realtime inclusi nel bundle: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI (`xai`), registrati dai rispettivi Plugin provider.
- La configurazione raw posseduta dal provider vive sotto `streaming.providers.<providerId>`.
- Se `streaming.provider` punta a un provider non registrato, oppure non ne è registrato nessuno, Voice Call registra un avviso e salta lo streaming dei media invece di far fallire il Plugin.

### Esempi di provider streaming

<Tabs>
  <Tab title="OpenAI">
    Valori predefiniti: chiave API `streaming.providers.openai.apiKey` oppure
    `OPENAI_API_KEY`; modello `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`.

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

  </Tab>
  <Tab title="xAI">
    Valori predefiniti: chiave API `streaming.providers.xai.apiKey` oppure `XAI_API_KEY`;
    endpoint `wss://api.x.ai/v1/stt`; encoding `mulaw`; sample rate `8000`;
    `endpointingMs: 800`; `interimResults: true`.

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

  </Tab>
</Tabs>

## TTS per le chiamate

Voice Call usa la configurazione core `messages.tts` per lo streaming
della voce nelle chiamate. Puoi sovrascriverla sotto la configurazione del Plugin con la
**stessa forma** — viene unita in profondità con `messages.tts`.

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

<Warning>
**Lo speech Microsoft viene ignorato per le chiamate vocali.** L'audio di telefonia richiede PCM;
l'attuale trasporto Microsoft non espone output PCM per la telefonia.
</Warning>

Note sul comportamento:

- Le chiavi legacy `tts.<provider>` all'interno della configurazione del Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) vengono riparate da `openclaw doctor --fix`; la configurazione salvata dovrebbe usare `tts.providers.<provider>`.
- Il TTS core viene usato quando lo streaming media di Twilio è abilitato; altrimenti le chiamate ricadono sulle voci native del provider.
- Se uno stream media Twilio è già attivo, Voice Call non ricade su TwiML `<Say>`. Se il TTS di telefonia non è disponibile in quello stato, la richiesta di riproduzione fallisce invece di mescolare due percorsi di riproduzione.
- Quando il TTS di telefonia ricade su un provider secondario, Voice Call registra un avviso con la catena dei provider (`from`, `to`, `attempts`) per il debug.
- Quando l'interruzione Twilio o la chiusura dello stream svuotano la coda TTS in sospeso, le richieste di riproduzione accodate vengono concluse invece di lasciare i chiamanti in attesa del completamento della riproduzione.

### Esempi TTS

<Tabs>
  <Tab title="Solo TTS core">
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
  </Tab>
  <Tab title="Override a ElevenLabs (solo chiamate)">
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
  </Tab>
  <Tab title="Override del modello OpenAI (deep-merge)">
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
  </Tab>
</Tabs>

## Chiamate in ingresso

La policy in ingresso ha come predefinito `disabled`. Per abilitare le chiamate in ingresso, imposta:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Ciao! Come posso aiutarti?",
}
```

<Warning>
`inboundPolicy: "allowlist"` è un filtro a bassa affidabilità basato sull'ID chiamante. Il
Plugin normalizza il valore `From` fornito dal provider e lo confronta con
`allowFrom`. La verifica del Webhook autentica la consegna del provider e
l'integrità del payload, ma **non** prova la titolarità del numero chiamante PSTN/VoIP.
Tratta `allowFrom` come filtro dell'ID chiamante, non come forte identità del chiamante.
</Warning>

Le risposte automatiche usano il sistema dell'agente. Regolale con `responseModel`,
`responseSystemPrompt` e `responseTimeoutMs`.

### Contratto di output parlato

Per le risposte automatiche, Voice Call aggiunge un rigido contratto di output parlato al
system prompt:

```text
{"spoken":"..."}
```

Voice Call estrae il testo parlato in modo difensivo:

- Ignora i payload contrassegnati come contenuto di reasoning/errore.
- Analizza JSON diretto, JSON recintato o chiavi `"spoken"` inline.
- Ricade su testo semplice e rimuove i paragrafi iniziali che sembrano pianificazione/meta.

Questo mantiene la riproduzione parlata focalizzata sul testo rivolto al chiamante ed evita
di far trapelare testo di pianificazione nell'audio.

### Comportamento di avvio della conversazione

Per le chiamate `conversation` in uscita, la gestione del primo messaggio è legata allo stato
di riproduzione live:

- Lo svuotamento della coda per barge-in e la risposta automatica vengono soppressi solo mentre il messaggio iniziale viene effettivamente pronunciato.
- Se la riproduzione iniziale fallisce, la chiamata torna a `listening` e il messaggio iniziale resta in coda per un nuovo tentativo.
- La riproduzione iniziale per Twilio streaming inizia alla connessione dello stream senza ritardi aggiuntivi.
- Il barge-in interrompe la riproduzione attiva e svuota le voci TTS Twilio accodate ma non ancora in riproduzione. Le voci rimosse vengono risolte come saltate, così la logica di risposta successiva può continuare senza attendere audio che non verrà mai riprodotto.
- Le conversazioni vocali realtime usano il turno di apertura del proprio stream realtime. Voice Call **non** pubblica un aggiornamento TwiML `<Say>` legacy per quel messaggio iniziale, così le sessioni in uscita `<Connect><Stream>` restano collegate.

### Grace per la disconnessione dello stream Twilio

Quando uno stream media Twilio si disconnette, Voice Call attende **2000 ms** prima di
terminare automaticamente la chiamata:

- Se lo stream si ricollega durante quella finestra, la chiusura automatica viene annullata.
- Se nessuno stream si registra di nuovo dopo il periodo di grace, la chiamata viene terminata per evitare chiamate attive bloccate.

## Reaper delle chiamate stale

Usa `staleCallReaperSeconds` per terminare chiamate che non ricevono mai un
Webhook terminale (ad esempio chiamate in modalità notify che non si completano). Il valore predefinito
è `0` (disabilitato).

Intervalli consigliati:

- **Produzione:** `120`–`300` secondi per flussi in stile notify.
- Mantieni questo valore **maggiore di `maxDurationSeconds`** così che le chiamate normali possano terminare. Un buon punto di partenza è `maxDurationSeconds + 30–60` secondi.

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

Quando un proxy o tunnel si trova davanti al Gateway, il Plugin
ricostruisce l'URL pubblico per la verifica della firma. Queste opzioni
controllano di quali header inoltrati fidarsi:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Allowlist di host dagli header inoltrati.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Fidati degli header inoltrati senza una allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Fidati degli header inoltrati solo quando l'IP remoto della richiesta corrisponde all'elenco.
</ParamField>

Protezioni aggiuntive:

- La **protezione dal replay** dei Webhook è abilitata per Twilio e Plivo. Le richieste Webhook valide ma ripetute vengono confermate ma saltate per gli effetti collaterali.
- I turni di conversazione Twilio includono un token per turno nei callback `<Gather>`, così callback vocali stale/ripetute non possono soddisfare un turno di transcript più recente in sospeso.
- Le richieste Webhook non autenticate vengono rifiutate prima della lettura del body quando mancano gli header di firma richiesti dal provider.
- Il Webhook voice-call usa il profilo condiviso del body pre-auth (64 KB / 5 secondi) più un limite per-IP sulle richieste in-flight prima della verifica della firma.

Esempio con host pubblico stabile:

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
openclaw voicecall latency                      # riepiloga la latenza dei turni dai log
openclaw voicecall expose --mode funnel
```

`latency` legge `calls.jsonl` dal percorso di archiviazione predefinito di voice-call.
Usa `--file <path>` per puntare a un log diverso e `--last <n>` per limitare
l'analisi agli ultimi N record (predefinito 200). L'output include p50/p90/p99
per la latenza del turno e i tempi di attesa in ascolto.

## Strumento dell'agente

Nome dello strumento: `voice_call`.

| Azione          | Argomenti                |
| --------------- | ------------------------ |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Questo repository include una Skill corrispondente in `skills/voice-call/SKILL.md`.

## Gateway RPC

| Metodo               | Argomenti                |
| -------------------- | ------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Correlati

- [Modalità talk](/it/nodes/talk)
- [Text-to-speech](/it/tools/tts)
- [Attivazione vocale](/it/nodes/voicewake)
