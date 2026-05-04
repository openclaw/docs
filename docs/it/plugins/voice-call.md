---
read_when:
    - Vuoi effettuare una chiamata vocale in uscita da OpenClaw
    - Stai configurando o sviluppando il Plugin per le chiamate vocali
    - Hai bisogno di voce in tempo reale o di trascrizione in streaming per la telefonia
sidebarTitle: Voice call
summary: Effettua chiamate vocali in uscita e accetta chiamate vocali in entrata tramite Twilio, Telnyx o Plivo, con voce in tempo reale opzionale e trascrizione in streaming
title: Plugin per chiamate vocali
x-i18n:
    generated_at: "2026-05-04T07:07:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec2c22dcc9073572963744685a432328787bcedb14025e0326c20d9d842f857
    source_path: plugins/voice-call.md
    workflow: 16
---

Chiamate vocali per OpenClaw tramite un plugin. Supporta notifiche in uscita,
conversazioni multi-turno, voce in tempo reale full-duplex, trascrizione
in streaming e chiamate in entrata con criteri allowlist.

**Provider attuali:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + trasferimento XML + GetInput
speech), `mock` (sviluppo/nessuna rete).

<Note>
Il plugin Voice Call viene eseguito **dentro il processo Gateway**. Se usi un
Gateway remoto, installa e configura il plugin sulla macchina che esegue
il Gateway, poi riavvia il Gateway per caricarlo.
</Note>

## Avvio rapido

<Steps>
  <Step title="Installa il plugin">
    <Tabs>
      <Tab title="Da npm">
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

    Usa il pacchetto semplice per seguire il tag di rilascio ufficiale corrente. Fissa una
    versione esatta solo quando ti serve un'installazione riproducibile.

    Riavvia poi il Gateway in modo che il plugin venga caricato.

  </Step>
  <Step title="Configura provider e webhook">
    Imposta la configurazione sotto `plugins.entries.voice-call.config` (vedi
    [Configurazione](#configuration) più sotto per la struttura completa). Come minimo:
    `provider`, credenziali del provider, `fromNumber` e un URL webhook
    raggiungibile pubblicamente.
  </Step>
  <Step title="Verifica la configurazione">
    ```bash
    openclaw voicecall setup
    ```

    L'output predefinito è leggibile nei log di chat e nei terminali. Controlla
    l'abilitazione del plugin, le credenziali del provider, l'esposizione del webhook e che
    sia attiva una sola modalità audio (`streaming` o `realtime`). Usa
    `--json` per gli script.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Entrambi sono dry run per impostazione predefinita. Aggiungi `--yes` per effettuare davvero una breve
    chiamata di notifica in uscita:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Per Twilio, Telnyx e Plivo, la configurazione deve risolversi in un **URL webhook pubblico**.
Se `publicUrl`, l'URL del tunnel, l'URL Tailscale o il fallback di servizio
si risolve in loopback o spazio di rete privata, la configurazione fallisce invece di
avviare un provider che non può ricevere webhook dagli operatori.
</Warning>

## Configurazione

Se `enabled: true` ma al provider selezionato mancano credenziali,
l'avvio del Gateway registra un avviso di configurazione incompleta con le chiavi mancanti e
salta l'avvio del runtime. Comandi, chiamate RPC e strumenti agente continuano
a restituire l'esatta configurazione mancante del provider quando usati.

<Note>
Le credenziali voice-call accettano SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` e `plugins.entries.voice-call.config.tts.providers.*.apiKey` si risolvono tramite la superficie SecretRef standard; vedi [Superficie credenziali SecretRef](/it/reference/secretref-credential-surface).
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
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
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Esposizione del provider e note di sicurezza">
    - Twilio, Telnyx e Plivo richiedono tutti un URL webhook **raggiungibile pubblicamente**.
    - `mock` è un provider di sviluppo locale (nessuna chiamata di rete).
    - Telnyx richiede `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) a meno che `skipSignatureVerification` sia true.
    - `skipSignatureVerification` è solo per test locali.
    - Nel piano gratuito di ngrok, imposta `publicUrl` sull'URL ngrok esatto; la verifica della firma è sempre applicata.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` consente webhook Twilio con firme non valide **solo** quando `tunnel.provider="ngrok"` e `serve.bind` è loopback (agente locale ngrok). Solo sviluppo locale.
    - Gli URL del piano gratuito di Ngrok possono cambiare o aggiungere comportamento interstiziale; se `publicUrl` diverge, le firme Twilio falliscono. Produzione: preferisci un dominio stabile o un funnel Tailscale.

  </Accordion>
  <Accordion title="Limiti delle connessioni streaming">
    - `streaming.preStartTimeoutMs` chiude i socket che non inviano mai un frame `start` valido.
    - `streaming.maxPendingConnections` limita il totale dei socket pre-start non autenticati.
    - `streaming.maxPendingConnectionsPerIp` limita i socket pre-start non autenticati per IP sorgente.
    - `streaming.maxConnections` limita il totale dei socket media stream aperti (in attesa + attivi).

  </Accordion>
  <Accordion title="Migrazioni della configurazione legacy">
    Le configurazioni più vecchie che usano `provider: "log"`, `twilio.from` o chiavi OpenAI
    `streaming.*` legacy vengono riscritte da `openclaw doctor --fix`.
    Il fallback runtime accetta ancora per ora le vecchie chiavi voice-call, ma
    il percorso di riscrittura è `openclaw doctor --fix` e lo shim di compatibilità è
    temporaneo.

    Chiavi streaming migrate automaticamente:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Ambito sessione

Per impostazione predefinita, Voice Call usa `sessionScope: "per-phone"` così le chiamate ripetute dallo
stesso chiamante mantengono la memoria della conversazione. Imposta `sessionScope: "per-call"` quando
ogni chiamata dell'operatore deve iniziare con un contesto nuovo, per esempio reception,
prenotazioni, IVR o flussi bridge Google Meet in cui lo stesso numero di telefono può
rappresentare riunioni diverse.

## Conversazioni vocali in tempo reale

`realtime` seleziona un provider di voce in tempo reale full-duplex per l'audio
delle chiamate live. È separato da `streaming`, che inoltra solo l'audio ai
provider di trascrizione in tempo reale.

<Warning>
`realtime.enabled` non può essere combinato con `streaming.enabled`. Scegli una
modalità audio per chiamata.
</Warning>

Comportamento runtime attuale:

- `realtime.enabled` è supportato per Twilio Media Streams.
- `realtime.provider` è facoltativo. Se non impostato, Voice Call usa il primo provider di voce in tempo reale registrato.
- Provider di voce in tempo reale inclusi: Google Gemini Live (`google`) e OpenAI (`openai`), registrati dai rispettivi plugin provider.
- La configurazione raw di proprietà del provider risiede sotto `realtime.providers.<providerId>`.
- Voice Call espone per impostazione predefinita lo strumento realtime condiviso `openclaw_agent_consult`. Il modello realtime può chiamarlo quando il chiamante chiede ragionamento più approfondito, informazioni attuali o normali strumenti OpenClaw.
- `realtime.fastContext.enabled` è disattivato per impostazione predefinita. Quando è abilitato, Voice Call cerca prima nella memoria indicizzata/nel contesto di sessione la domanda di consultazione e restituisce quegli estratti al modello realtime entro `realtime.fastContext.timeoutMs` prima di ripiegare sull'agente di consultazione completo solo se `realtime.fastContext.fallbackToConsult` è true.
- Se `realtime.provider` punta a un provider non registrato, o non è registrato alcun provider di voce in tempo reale, Voice Call registra un avviso e salta i media realtime invece di far fallire l'intero plugin.
- Le chiavi di sessione della consultazione riutilizzano la sessione di chiamata memorizzata quando disponibile, poi ripiegano sul `sessionScope` configurato (`per-phone` per impostazione predefinita, o `per-call` per chiamate isolate).

### Criterio degli strumenti

`realtime.toolPolicy` controlla l'esecuzione della consultazione:

| Criterio         | Comportamento                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Espone lo strumento di consultazione e limita l'agente normale a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`. |
| `owner`          | Espone lo strumento di consultazione e lascia che l'agente normale usi il normale criterio degli strumenti agente.                       |
| `none`           | Non espone lo strumento di consultazione. Gli `realtime.tools` personalizzati vengono comunque passati al provider realtime.             |

### Esempi di provider realtime

<Tabs>
  <Tab title="Google Gemini Live">
    Valori predefiniti: chiave API da `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` o `GOOGLE_GENERATIVE_AI_API_KEY`; modello
    `gemini-2.5-flash-native-audio-preview-12-2025`; voce `Kore`.
    `sessionResumption` e `contextWindowCompression` sono attivi per impostazione predefinita per chiamate più lunghe
    e riconnettibili. Usa `silenceDurationMs`, `startSensitivity` e
    `endSensitivity` per regolare un'alternanza dei turni più rapida sull'audio telefonico.

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
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
                toolPolicy: "safe-read-only",
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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

Vedi [provider Google](/it/providers/google) e
[provider OpenAI](/it/providers/openai) per le opzioni di voce in tempo reale
specifiche del provider.

## Trascrizione in streaming

`streaming` seleziona un provider di trascrizione in tempo reale per l'audio delle chiamate dal vivo.

Comportamento runtime attuale:

- `streaming.provider` è facoltativo. Se non impostato, Voice Call usa il primo provider di trascrizione in tempo reale registrato.
- Provider di trascrizione in tempo reale inclusi: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI (`xai`), registrati dai rispettivi Plugin provider.
- La configurazione grezza di proprietà del provider risiede sotto `streaming.providers.<providerId>`.
- Dopo che Twilio invia un messaggio `start` di stream accettato, Voice Call registra immediatamente lo stream, mette in coda i media in ingresso tramite il provider di trascrizione mentre il provider si connette e avvia il saluto iniziale solo dopo che la trascrizione in tempo reale è pronta.
- Se `streaming.provider` punta a un provider non registrato, o non ne è registrato nessuno, Voice Call registra un avviso e salta lo streaming dei media invece di far fallire l'intero Plugin.

### Esempi di provider di streaming

<Tabs>
  <Tab title="OpenAI">
    Valori predefiniti: chiave API `streaming.providers.openai.apiKey` o
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

  </Tab>
  <Tab title="xAI">
    Valori predefiniti: chiave API `streaming.providers.xai.apiKey` o `XAI_API_KEY`;
    endpoint `wss://api.x.ai/v1/stt`; codifica `mulaw`; frequenza di campionamento `8000`;
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

  </Tab>
</Tabs>

## TTS per le chiamate

Voice Call usa la configurazione core `messages.tts` per lo streaming
vocale nelle chiamate. Puoi sovrascriverla nella configurazione del Plugin con la
**stessa forma**: viene unita in profondità con `messages.tts`.

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
**Il parlato Microsoft viene ignorato per le chiamate vocali.** L'audio telefonico richiede PCM;
il trasporto Microsoft attuale non espone output PCM telefonico.
</Warning>

Note sul comportamento:

- Le chiavi legacy `tts.<provider>` nella configurazione del Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) vengono riparate da `openclaw doctor --fix`; la configurazione salvata nel repository dovrebbe usare `tts.providers.<provider>`.
- Il TTS core viene usato quando lo streaming dei media Twilio è abilitato; altrimenti le chiamate ripiegano sulle voci native del provider.
- Se uno stream multimediale Twilio è già attivo, Voice Call non ripiega su TwiML `<Say>`. Se in quello stato il TTS telefonico non è disponibile, la richiesta di riproduzione fallisce invece di mescolare due percorsi di riproduzione.
- Quando il TTS telefonico ripiega su un provider secondario, Voice Call registra un avviso con la catena di provider (`from`, `to`, `attempts`) per il debug.
- Quando il barge-in Twilio o lo smontaggio dello stream svuota la coda TTS in sospeso, le richieste di riproduzione in coda vengono risolte invece di lasciare in attesa i chiamanti che aspettano il completamento della riproduzione.

### Esempi di TTS

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
  <Tab title="Sovrascrivi con ElevenLabs (solo chiamate)">
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
  <Tab title="Sovrascrittura del modello OpenAI (unione profonda)">
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

Il criterio in ingresso predefinito è `disabled`. Per abilitare le chiamate in ingresso, imposta:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` è un filtro dell'ID chiamante a bassa garanzia. Il
Plugin normalizza il valore `From` fornito dal provider e lo confronta con
`allowFrom`. La verifica del Webhook autentica la consegna del provider e
l'integrità del payload, ma **non** prova la proprietà del numero chiamante
PSTN/VoIP. Considera `allowFrom` come filtro dell'ID chiamante, non come forte
identità del chiamante.
</Warning>

Le risposte automatiche usano il sistema agent. Regolale con `responseModel`,
`responseSystemPrompt` e `responseTimeoutMs`.

### Instradamento per numero

Usa `numbers` quando un Plugin Voice Call riceve chiamate per più numeri di telefono
e ogni numero deve comportarsi come una linea diversa. Per esempio, un
numero può usare un assistente personale informale mentre un altro usa una
persona business, un agent di risposta diverso e una voce TTS diversa.

Le route sono selezionate dal numero `To` composto fornito dal provider. Le chiavi devono essere
numeri E.164. Quando arriva una chiamata, Voice Call risolve la route corrispondente una sola volta,
memorizza la route abbinata nel record della chiamata e riutilizza quella configurazione effettiva
per il saluto, il percorso classico di risposta automatica, il percorso di consultazione in tempo reale e la
riproduzione TTS. Se nessuna route corrisponde, viene usata la configurazione globale di Voice Call.
Le chiamate in uscita non usano `numbers`; passa esplicitamente la destinazione in uscita, il messaggio e la
sessione quando avvii la chiamata.

Le sovrascritture di route attualmente supportano:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Il valore di route `tts` viene unito in profondità sopra la configurazione globale `tts` di Voice Call, quindi
di solito puoi sovrascrivere solo la voce del provider:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### Contratto dell'output parlato

Per le risposte automatiche, Voice Call aggiunge un contratto rigoroso di output parlato al
prompt di sistema:

```text
{"spoken":"..."}
```

Voice Call estrae il testo da pronunciare in modo difensivo:

- Ignora i payload contrassegnati come contenuto di ragionamento/errore.
- Analizza JSON diretto, JSON delimitato da fence o chiavi `"spoken"` inline.
- Ripiega su testo semplice e rimuove probabili paragrafi iniziali di pianificazione/meta.

Questo mantiene la riproduzione parlata concentrata sul testo rivolto al chiamante ed evita
di far trapelare testo di pianificazione nell'audio.

### Comportamento di avvio della conversazione

Per le chiamate `conversation` in uscita, la gestione del primo messaggio è legata allo stato di
riproduzione live:

- Lo svuotamento della coda per barge-in e la risposta automatica vengono soppressi solo mentre il saluto iniziale è in fase di parlato attivo.
- Se la riproduzione iniziale fallisce, la chiamata torna a `listening` e il messaggio iniziale resta in coda per un nuovo tentativo.
- La riproduzione iniziale per lo streaming Twilio parte alla connessione dello stream senza ritardi aggiuntivi.
- Il barge-in interrompe la riproduzione attiva e svuota le voci TTS Twilio in coda ma non ancora in riproduzione. Le voci svuotate vengono risolte come saltate, così la logica di risposta successiva può continuare senza attendere audio che non verrà mai riprodotto.
- Le conversazioni vocali in tempo reale usano il turno di apertura proprio dello stream in tempo reale. Voice Call **non** pubblica un aggiornamento TwiML legacy `<Say>` per quel messaggio iniziale, quindi le sessioni `<Connect><Stream>` in uscita restano collegate.

### Periodo di tolleranza per disconnessione dello stream Twilio

Quando uno stream multimediale Twilio si disconnette, Voice Call attende **2000 ms** prima
di terminare automaticamente la chiamata:

- Se lo stream si riconnette durante quell'intervallo, la terminazione automatica viene annullata.
- Se nessuno stream si registra di nuovo dopo il periodo di tolleranza, la chiamata viene terminata per evitare chiamate attive bloccate.

## Reaper delle chiamate obsolete

Usa `staleCallReaperSeconds` per terminare le chiamate che non ricevono mai un
Webhook terminale (per esempio, chiamate in modalità notifica che non si completano mai). Il valore predefinito
è `0` (disabilitato).

Intervalli consigliati:

- **Produzione:** `120`-`300` secondi per flussi in stile notifica.
- Mantieni questo valore **più alto di `maxDurationSeconds`** in modo che le chiamate normali possano terminare. Un buon punto di partenza è `maxDurationSeconds + 30-60` secondi.

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

Quando un proxy o un tunnel si trova davanti al Gateway, il Plugin
ricostruisce l'URL pubblico per la verifica della firma. Queste opzioni
controllano quali header inoltrati sono considerati attendibili:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Host allowlist dagli header di inoltro.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Considera attendibili gli header inoltrati senza una allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Considera attendibili gli header inoltrati solo quando l'IP remoto della richiesta corrisponde all'elenco.
</ParamField>

Protezioni aggiuntive:

- La **protezione dai replay** dei Webhook è abilitata per Twilio e Plivo. Le richieste Webhook valide riprodotte vengono confermate ma saltate per gli effetti collaterali.
- I turni di conversazione Twilio includono un token per turno nei callback `<Gather>`, quindi callback vocali obsoleti/riprodotti non possono soddisfare un turno di trascrizione in sospeso più recente.
- Le richieste Webhook non autenticate vengono rifiutate prima della lettura del corpo quando mancano gli header di firma richiesti dal provider.
- Il Webhook voice-call usa il profilo condiviso del corpo pre-autenticazione (64 KB / 5 secondi) più un limite per IP sulle richieste in corso prima della verifica della firma.

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

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

Quando il Gateway è già in esecuzione, i comandi operativi `voicecall` delegano
al runtime delle chiamate vocali di proprietà del Gateway, così la CLI non associa un secondo
server webhook. Se nessun Gateway è raggiungibile, i comandi ripiegano su un
runtime CLI autonomo.

`latency` legge `calls.jsonl` dal percorso di archiviazione predefinito per le chiamate vocali.
Usa `--file <path>` per puntare a un log diverso e `--last <n>` per limitare
l'analisi agli ultimi N record (predefinito 200). L'output include p50/p90/p99
per la latenza dei turni e i tempi di attesa dell'ascolto.

## Strumento dell'agente

Nome dello strumento: `voice_call`.

| Azione          | Argomenti                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Questo repository include un documento skill corrispondente in `skills/voice-call/SKILL.md`.

## RPC del Gateway

| Metodo              | Argomenti                                  |
| ------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` è valido solo con `mode: "conversation"`. Le chiamate in modalità notifica
devono usare `voicecall.dtmf` dopo che la chiamata esiste, se hanno bisogno di cifre
post-connessione.

## Risoluzione dei problemi

### La configurazione fallisce l'esposizione del webhook

Esegui la configurazione dallo stesso ambiente che esegue il Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Per `twilio`, `telnyx` e `plivo`, `webhook-exposure` deve essere verde. Un
`publicUrl` configurato fallisce comunque quando punta a uno spazio di rete locale o privato,
perché l'operatore non può richiamare tali indirizzi. Non usare
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` o `fd00::/8` come `publicUrl`.

Le chiamate in uscita Twilio in modalità notifica inviano il loro `<Say>` TwiML iniziale direttamente nella
richiesta di creazione della chiamata, quindi il primo messaggio parlato non dipende dal recupero
del TwiML webhook da parte di Twilio. Un webhook pubblico è comunque richiesto per callback di stato,
chiamate conversazionali, DTMF pre-connessione, stream in tempo reale e controllo della chiamata
post-connessione.

Usa un percorso di esposizione pubblico:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Dopo aver modificato la configurazione, riavvia o ricarica il Gateway, poi esegui:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` è un dry run a meno che tu non passi `--yes`.

### Le credenziali del provider non funzionano

Controlla il provider selezionato e i campi credenziali richiesti:

- Twilio: `twilio.accountSid`, `twilio.authToken` e `fromNumber`, oppure
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` e
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` e `fromNumber`.

Le credenziali devono esistere sull'host del Gateway. Modificare un profilo shell locale
non influisce su un Gateway già in esecuzione finché non riavvia o ricarica il suo
ambiente.

### Le chiamate partono ma i webhook del provider non arrivano

Conferma che la console del provider punti all'esatto URL pubblico del webhook:

```text
https://voice.example.com/voice/webhook
```

Poi ispeziona lo stato del runtime:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Cause comuni:

- `publicUrl` punta a un percorso diverso da `serve.path`.
- L'URL del tunnel è cambiato dopo l'avvio del Gateway.
- Un proxy inoltra la richiesta ma rimuove o riscrive le intestazioni host/proto.
- Firewall o DNS indirizzano l'hostname pubblico a una destinazione diversa dal Gateway.
- Il Gateway è stato riavviato senza il plugin Voice Call abilitato.

Quando un reverse proxy o tunnel si trova davanti al Gateway, imposta
`webhookSecurity.allowedHosts` sull'hostname pubblico, oppure usa
`webhookSecurity.trustedProxyIPs` per un indirizzo proxy noto. Usa
`webhookSecurity.trustForwardingHeaders` solo quando il confine del proxy è sotto
il tuo controllo.

### La verifica della firma non riesce

Le firme del provider vengono controllate rispetto all'URL pubblico che OpenClaw ricostruisce
dalla richiesta in ingresso. Se le firme non riescono:

- Conferma che l'URL webhook del provider corrisponda esattamente a `publicUrl`, inclusi
  schema, host e percorso.
- Per gli URL ngrok del livello gratuito, aggiorna `publicUrl` quando l'hostname del tunnel cambia.
- Assicurati che il proxy preservi le intestazioni host e proto originali, oppure configura
  `webhookSecurity.allowedHosts`.
- Non abilitare `skipSignatureVerification` fuori dai test locali.

### Le partecipazioni a Google Meet tramite Twilio non riescono

Google Meet usa questo plugin per le partecipazioni tramite chiamata Twilio. Verifica prima Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Poi verifica esplicitamente il trasporto Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Se Voice Call è verde ma il partecipante Meet non entra mai, controlla il numero di accesso telefonico Meet,
il PIN e `--dtmf-sequence`. La chiamata telefonica può essere sana mentre
la riunione rifiuta o ignora una sequenza DTMF errata.

Google Meet passa la sequenza DTMF Meet e il testo introduttivo a `voicecall.start`.
Per le chiamate Twilio, Voice Call serve prima il TwiML DTMF, reindirizza di nuovo al
webhook, poi apre lo stream multimediale in tempo reale così l'introduzione salvata viene generata
dopo che il partecipante telefonico è entrato nella riunione.

Usa `openclaw logs --follow` per la traccia live della fase. Una partecipazione Twilio Meet
sana registra questo ordine:

- Google Meet delega la partecipazione Twilio a Voice Call.
- Voice Call archivia il TwiML DTMF pre-connessione.
- Il TwiML iniziale di Twilio viene consumato e servito prima della gestione in tempo reale.
- Voice Call serve il TwiML in tempo reale per la chiamata Twilio.
- Il bridge in tempo reale parte con il saluto iniziale in coda.

`openclaw voicecall tail` mostra ancora i record di chiamata persistiti; è utile per
lo stato della chiamata e le trascrizioni, ma non tutte le transizioni webhook/in tempo reale appaiono
lì.

### La chiamata in tempo reale non ha parlato

Conferma che sia abilitata una sola modalità audio. `realtime.enabled` e
`streaming.enabled` non possono essere entrambi true.

Per le chiamate Twilio in tempo reale, verifica anche:

- Un plugin provider in tempo reale è caricato e registrato.
- `realtime.provider` non è impostato o nomina un provider registrato.
- La chiave API del provider è disponibile per il processo Gateway.
- `openclaw logs --follow` mostra il TwiML in tempo reale servito, il bridge in tempo reale
  avviato e il saluto iniziale in coda.

## Correlati

- [Modalità conversazione](/it/nodes/talk)
- [Sintesi vocale](/it/tools/tts)
- [Attivazione vocale](/it/nodes/voicewake)
