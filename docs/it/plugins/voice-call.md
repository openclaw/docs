---
read_when:
    - Vuoi effettuare una chiamata vocale in uscita da OpenClaw
    - Stai configurando o sviluppando il Plugin per le chiamate vocali
    - Hai bisogno di voce in tempo reale o di trascrizione in streaming per la telefonia
sidebarTitle: Voice call
summary: Effettua chiamate vocali in uscita e accetta chiamate vocali in entrata tramite Twilio, Telnyx o Plivo, con voce in tempo reale opzionale e trascrizione in streaming
title: Plugin per chiamate vocali
x-i18n:
    generated_at: "2026-04-30T09:06:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

Chiamate vocali per OpenClaw tramite un plugin. Supporta notifiche in uscita,
conversazioni multi-turno, voce realtime full-duplex, trascrizione in
streaming e chiamate in ingresso con criteri di allowlist.

**Provider attuali:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + trasferimento XML + GetInput
speech), `mock` (sviluppo/nessuna rete).

<Note>
Il plugin Voice Call viene eseguito **dentro il processo Gateway**. Se usi un
Gateway remoto, installa e configura il plugin sulla macchina che esegue
il Gateway, quindi riavvia il Gateway per caricarlo.
</Note>

## Avvio rapido

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Se npm segnala il pacchetto di proprietà di OpenClaw come deprecato, quella versione del pacchetto
    proviene da una serie di pacchetti esterni più vecchia; usa una build OpenClaw
    pacchettizzata corrente o il percorso della cartella locale finché non viene pubblicato un pacchetto npm più recente.

    Riavvia poi il Gateway in modo che il plugin venga caricato.

  </Step>
  <Step title="Configure provider and webhook">
    Imposta la configurazione sotto `plugins.entries.voice-call.config` (vedi
    [Configurazione](#configuration) sotto per la struttura completa). Come minimo:
    `provider`, le credenziali del provider, `fromNumber` e un URL Webhook
    raggiungibile pubblicamente.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    L'output predefinito è leggibile nei log delle chat e nei terminali. Controlla
    l'abilitazione del plugin, le credenziali del provider, l'esposizione del Webhook e che
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
Per Twilio, Telnyx e Plivo, la configurazione deve risolversi in un **URL Webhook pubblico**.
Se `publicUrl`, l'URL del tunnel, l'URL Tailscale o il fallback di servizio
si risolvono in loopback o spazio di rete privato, la configurazione non riesce invece di
avviare un provider che non può ricevere Webhook dai carrier.
</Warning>

## Configurazione

Se `enabled: true` ma al provider selezionato mancano le credenziali,
l'avvio del Gateway registra un avviso di configurazione incompleta con le chiavi mancanti e
salta l'avvio del runtime. Comandi, chiamate RPC e strumenti dell'agente continuano
a restituire l'esatta configurazione del provider mancante quando vengono usati.

<Note>
Le credenziali voice-call accettano SecretRef. `plugins.entries.voice-call.config.twilio.authToken` e `plugins.entries.voice-call.config.tts.providers.*.apiKey` vengono risolte tramite la superficie SecretRef standard; vedi [superficie credenziali SecretRef](/it/reference/secretref-credential-surface).
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
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx e Plivo richiedono tutti un URL Webhook **raggiungibile pubblicamente**.
    - `mock` è un provider di sviluppo locale (nessuna chiamata di rete).
    - Telnyx richiede `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) a meno che `skipSignatureVerification` sia true.
    - `skipSignatureVerification` è solo per i test locali.
    - Nel livello gratuito di ngrok, imposta `publicUrl` sull'URL ngrok esatto; la verifica della firma viene sempre applicata.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` consente Webhook Twilio con firme non valide **solo** quando `tunnel.provider="ngrok"` e `serve.bind` è loopback (agente locale ngrok). Solo sviluppo locale.
    - Gli URL del livello gratuito di Ngrok possono cambiare o aggiungere comportamenti interstiziali; se `publicUrl` cambia, le firme Twilio falliscono. Produzione: preferisci un dominio stabile o un funnel Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` chiude i socket che non inviano mai un frame `start` valido.
    - `streaming.maxPendingConnections` limita il totale dei socket pre-start non autenticati.
    - `streaming.maxPendingConnectionsPerIp` limita i socket pre-start non autenticati per IP di origine.
    - `streaming.maxConnections` limita il totale dei socket di media stream aperti (in sospeso + attivi).

  </Accordion>
  <Accordion title="Legacy config migrations">
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

## Conversazioni vocali realtime

`realtime` seleziona un provider vocale realtime full-duplex per l'audio delle chiamate
live. È separato da `streaming`, che inoltra solo l'audio ai
provider di trascrizione realtime.

<Warning>
`realtime.enabled` non può essere combinato con `streaming.enabled`. Scegli una
modalità audio per chiamata.
</Warning>

Comportamento runtime attuale:

- `realtime.enabled` è supportato per Twilio Media Streams.
- `realtime.provider` è facoltativo. Se non è impostato, Voice Call usa il primo provider vocale realtime registrato.
- Provider vocali realtime inclusi: Google Gemini Live (`google`) e OpenAI (`openai`), registrati dai rispettivi plugin provider.
- La configurazione raw di proprietà del provider si trova sotto `realtime.providers.<providerId>`.
- Voice Call espone per impostazione predefinita lo strumento realtime condiviso `openclaw_agent_consult`. Il modello realtime può chiamarlo quando il chiamante chiede ragionamento più approfondito, informazioni aggiornate o normali strumenti OpenClaw.
- Se `realtime.provider` punta a un provider non registrato, o se non è registrato alcun provider vocale realtime, Voice Call registra un avviso e salta i media realtime invece di far fallire l'intero plugin.
- Le chiavi di sessione di consult riutilizzano la sessione vocale esistente quando disponibile, poi ripiegano sul numero di telefono del chiamante/destinatario in modo che le chiamate consult successive mantengano il contesto durante la chiamata.

### Criterio degli strumenti

`realtime.toolPolicy` controlla l'esecuzione consult:

| Criterio         | Comportamento                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Espone lo strumento consult e limita l'agente regolare a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`. |
| `owner`          | Espone lo strumento consult e lascia che l'agente regolare usi il normale criterio degli strumenti dell'agente.                         |
| `none`           | Non espone lo strumento consult. Gli strumenti `realtime.tools` personalizzati vengono comunque passati al provider realtime.           |

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
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
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

Vedi [provider Google](/it/providers/google) e
[provider OpenAI](/it/providers/openai) per le opzioni vocali realtime
specifiche del provider.

## Trascrizione streaming

`streaming` seleziona un provider di trascrizione realtime per l'audio delle chiamate live.

Comportamento runtime attuale:

- `streaming.provider` è facoltativo. Se non è impostato, Voice Call usa il primo provider di trascrizione realtime registrato.
- Provider di trascrizione realtime inclusi: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI (`xai`), registrati dai rispettivi plugin provider.
- La configurazione raw di proprietà del provider si trova sotto `streaming.providers.<providerId>`.
- Se `streaming.provider` punta a un provider non registrato, o se non ne è registrato nessuno, Voice Call registra un avviso e salta lo streaming dei media invece di far fallire l'intero plugin.

### Esempi di provider streaming

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

Voice Call usa la configurazione principale `messages.tts` per lo streaming
del parlato nelle chiamate. Puoi sovrascriverla nella configurazione del plugin con la
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
**Microsoft speech viene ignorato per le chiamate vocali.** L'audio telefonico richiede PCM;
il trasporto Microsoft attuale non espone output PCM telefonico.
</Warning>

Note sul comportamento:

- Le chiavi legacy `tts.<provider>` nella configurazione del plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) vengono riparate da `openclaw doctor --fix`; la configurazione salvata dovrebbe usare `tts.providers.<provider>`.
- Il TTS principale viene usato quando lo streaming multimediale Twilio è abilitato; altrimenti le chiamate ripiegano sulle voci native del provider.
- Se uno stream multimediale Twilio è già attivo, Voice Call non ripiega su TwiML `<Say>`. Se in quello stato il TTS telefonico non è disponibile, la richiesta di riproduzione non riesce invece di mescolare due percorsi di riproduzione.
- Quando il TTS telefonico ripiega su un provider secondario, Voice Call registra un avviso con la catena dei provider (`from`, `to`, `attempts`) per il debug.
- Quando il barge-in di Twilio o lo smontaggio dello stream svuota la coda TTS in sospeso, le richieste di riproduzione in coda vengono risolte invece di lasciare in attesa i chiamanti che aspettano il completamento della riproduzione.

### Esempi TTS

<Tabs>
  <Tab title="Solo TTS principale">
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
  <Tab title="Sovrascrittura modello OpenAI (deep-merge)">
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

La policy in ingresso ha come valore predefinito `disabled`. Per abilitare le chiamate in ingresso, imposta:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` è un filtro dell'ID chiamante a bassa garanzia. Il
plugin normalizza il valore `From` fornito dal provider e lo confronta con
`allowFrom`. La verifica del Webhook autentica la consegna del provider e
l'integrità del payload, ma **non** prova la proprietà del numero chiamante
PSTN/VoIP. Tratta `allowFrom` come filtro dell'ID chiamante, non come identità
forte del chiamante.
</Warning>

Le risposte automatiche usano il sistema degli agenti. Regolale con `responseModel`,
`responseSystemPrompt` e `responseTimeoutMs`.

### Contratto dell'output parlato

Per le risposte automatiche, Voice Call aggiunge un contratto rigoroso dell'output parlato al
prompt di sistema:

```text
{"spoken":"..."}
```

Voice Call estrae il testo da pronunciare in modo difensivo:

- Ignora i payload contrassegnati come contenuto di reasoning/errore.
- Analizza JSON diretto, JSON in fence o chiavi `"spoken"` inline.
- Ripiega su testo semplice e rimuove paragrafi iniziali probabilmente di pianificazione/meta.

Questo mantiene la riproduzione parlata focalizzata sul testo destinato al chiamante ed evita
di far trapelare testo di pianificazione nell'audio.

### Comportamento di avvio della conversazione

Per le chiamate `conversation` in uscita, la gestione del primo messaggio è legata allo stato di
riproduzione live:

- Lo svuotamento della coda per barge-in e la risposta automatica vengono soppressi solo mentre il saluto iniziale è in riproduzione attiva.
- Se la riproduzione iniziale non riesce, la chiamata torna a `listening` e il messaggio iniziale rimane in coda per un nuovo tentativo.
- La riproduzione iniziale per lo streaming Twilio parte alla connessione dello stream senza ritardo aggiuntivo.
- Il barge-in interrompe la riproduzione attiva e svuota le voci TTS Twilio in coda ma non ancora in riproduzione. Le voci svuotate vengono risolte come saltate, quindi la logica della risposta successiva può continuare senza attendere audio che non verrà mai riprodotto.
- Le conversazioni vocali realtime usano il turno di apertura proprio dello stream realtime. Voice Call **non** pubblica un aggiornamento TwiML legacy `<Say>` per quel messaggio iniziale, quindi le sessioni `<Connect><Stream>` in uscita restano collegate.

### Periodo di tolleranza per la disconnessione dello stream Twilio

Quando uno stream multimediale Twilio si disconnette, Voice Call attende **2000 ms** prima di
terminare automaticamente la chiamata:

- Se lo stream si riconnette durante quella finestra, la terminazione automatica viene annullata.
- Se nessuno stream si registra di nuovo dopo il periodo di tolleranza, la chiamata viene terminata per evitare chiamate attive bloccate.

## Reaper delle chiamate obsolete

Usa `staleCallReaperSeconds` per terminare le chiamate che non ricevono mai un Webhook
terminale (per esempio, chiamate in modalità notifica che non vengono mai completate). Il valore predefinito
è `0` (disabilitato).

Intervalli consigliati:

- **Produzione:** `120`-`300` secondi per flussi di tipo notifica.
- Mantieni questo valore **maggiore di `maxDurationSeconds`** così le chiamate normali possono terminare. Un buon punto di partenza è `maxDurationSeconds + 30-60` secondi.

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

## Sicurezza Webhook

Quando un proxy o un tunnel si trova davanti al Gateway, il plugin
ricostruisce l'URL pubblico per la verifica della firma. Queste opzioni
controllano quali header inoltrati sono considerati attendibili:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Host consentiti dagli header di inoltro.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Considera attendibili gli header inoltrati senza una allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Considera attendibili gli header inoltrati solo quando l'IP remoto della richiesta corrisponde alla lista.
</ParamField>

Protezione aggiuntive:

- La **protezione da replay** dei Webhook è abilitata per Twilio e Plivo. Le richieste Webhook valide riprodotte vengono confermate ma saltate per gli effetti collaterali.
- I turni di conversazione Twilio includono un token per turno nei callback `<Gather>`, quindi callback vocali obsoleti/riprodotti non possono soddisfare un turno di trascrizione in sospeso più recente.
- Le richieste Webhook non autenticate vengono rifiutate prima della lettura del body quando mancano gli header di firma richiesti dal provider.
- Il Webhook voice-call usa il profilo condiviso del body pre-auth (64 KB / 5 secondi) più un limite per IP sulle richieste in corso prima della verifica della firma.

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

`latency` legge `calls.jsonl` dal percorso di archiviazione voice-call predefinito.
Usa `--file <path>` per puntare a un log diverso e `--last <n>` per limitare
l'analisi agli ultimi N record (predefinito 200). L'output include p50/p90/p99
per la latenza dei turni e i tempi di attesa in ascolto.

## Strumento agente

Nome strumento: `voice_call`.

| Azione          | Argomenti                 |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Questo repo include una documentazione skill corrispondente in `skills/voice-call/SKILL.md`.

## RPC Gateway

| Metodo               | Argomenti                 |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Correlati

- [Modalità Talk](/it/nodes/talk)
- [Text-to-speech](/it/tools/tts)
- [Voice wake](/it/nodes/voicewake)
