---
read_when:
    - Vuoi effettuare una chiamata vocale in uscita da OpenClaw
    - Stai configurando o sviluppando il Plugin per chiamate vocali
    - Hai bisogno di voce in tempo reale o di trascrizione in streaming per la telefonia
sidebarTitle: Voice call
summary: Effettua chiamate vocali in uscita e accetta quelle in entrata tramite Twilio, Telnyx o Plivo, con funzionalità opzionali di voce in tempo reale e trascrizione in streaming
title: Plugin per chiamate vocali
x-i18n:
    generated_at: "2026-05-02T08:31:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc27646aca94c88d50d42838e166ac81eba3373154797cbb564e9c2eab0533fa
    source_path: plugins/voice-call.md
    workflow: 16
---

Chiamate vocali per OpenClaw tramite un plugin. Supporta notifiche in uscita,
conversazioni multi-turn, voce realtime full-duplex, trascrizione in streaming
e chiamate in ingresso con criteri di allowlist.

**Provider attuali:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (sviluppo/nessuna rete).

<Note>
Il plugin Voice Call viene eseguito **all'interno del processo Gateway**. Se usi un
Gateway remoto, installa e configura il plugin sulla macchina che esegue
il Gateway, quindi riavvia il Gateway per caricarlo.
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

    Se npm segnala il pacchetto di proprietà di OpenClaw come deprecato, quella versione del pacchetto
    proviene da una serie di pacchetti esterni precedente; usa una build OpenClaw
    pacchettizzata attuale o il percorso della cartella locale finché non viene pubblicato un pacchetto npm più recente.

    Riavvia poi il Gateway in modo che il plugin venga caricato.

  </Step>
  <Step title="Configura provider e webhook">
    Imposta la configurazione in `plugins.entries.voice-call.config` (vedi
    [Configurazione](#configuration) sotto per la struttura completa). Come minimo:
    `provider`, le credenziali del provider, `fromNumber` e un URL webhook
    raggiungibile pubblicamente.
  </Step>
  <Step title="Verifica la configurazione">
    ```bash
    openclaw voicecall setup
    ```

    L'output predefinito è leggibile nei log chat e nei terminali. Controlla
    l'abilitazione del plugin, le credenziali del provider, l'esposizione del webhook
    e che sia attiva una sola modalità audio (`streaming` o `realtime`). Usa
    `--json` per gli script.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Entrambi sono simulazioni per impostazione predefinita. Aggiungi `--yes` per effettuare davvero una breve
    chiamata di notifica in uscita:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Per Twilio, Telnyx e Plivo, la configurazione deve risolversi in un **URL webhook pubblico**.
Se `publicUrl`, l'URL del tunnel, l'URL Tailscale o il fallback di servizio
si risolvono in loopback o in spazio di rete privata, la configurazione fallisce invece di
avviare un provider che non può ricevere webhook dagli operatori.
</Warning>

## Configurazione

Se `enabled: true` ma al provider selezionato mancano le credenziali,
l'avvio del Gateway registra un avviso di configurazione incompleta con le chiavi mancanti e
salta l'avvio del runtime. Comandi, chiamate RPC e strumenti agent restituiscono comunque
l'esatta configurazione mancante del provider quando vengono usati.

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
  <Accordion title="Note su esposizione e sicurezza dei provider">
    - Twilio, Telnyx e Plivo richiedono tutti un URL webhook **raggiungibile pubblicamente**.
    - `mock` è un provider di sviluppo locale (nessuna chiamata di rete).
    - Telnyx richiede `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) a meno che `skipSignatureVerification` sia true.
    - `skipSignatureVerification` è solo per test locali.
    - Nel piano gratuito di ngrok, imposta `publicUrl` sull'URL ngrok esatto; la verifica della firma viene sempre applicata.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` consente webhook Twilio con firme non valide **solo** quando `tunnel.provider="ngrok"` e `serve.bind` è loopback (agent locale ngrok). Solo sviluppo locale.
    - Gli URL del piano gratuito ngrok possono cambiare o aggiungere comportamento interstiziale; se `publicUrl` cambia, le firme Twilio falliscono. Produzione: preferisci un dominio stabile o un funnel Tailscale.

  </Accordion>
  <Accordion title="Limiti delle connessioni streaming">
    - `streaming.preStartTimeoutMs` chiude socket che non inviano mai un frame `start` valido.
    - `streaming.maxPendingConnections` limita il totale dei socket pre-start non autenticati.
    - `streaming.maxPendingConnectionsPerIp` limita i socket pre-start non autenticati per IP sorgente.
    - `streaming.maxConnections` limita il totale dei socket media stream aperti (in sospeso + attivi).

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

## Ambito della sessione

Per impostazione predefinita, Voice Call usa `sessionScope: "per-phone"` così le chiamate ripetute dallo
stesso chiamante conservano la memoria della conversazione. Imposta `sessionScope: "per-call"` quando
ogni chiamata dell'operatore deve iniziare con un contesto nuovo, ad esempio per flussi di reception,
prenotazione, IVR o bridge Google Meet in cui lo stesso numero di telefono può
rappresentare riunioni diverse.

## Conversazioni vocali realtime

`realtime` seleziona un provider voce realtime full-duplex per l'audio
delle chiamate live. È separato da `streaming`, che inoltra solo l'audio ai
provider di trascrizione realtime.

<Warning>
`realtime.enabled` non può essere combinato con `streaming.enabled`. Scegli una sola
modalità audio per chiamata.
</Warning>

Comportamento runtime attuale:

- `realtime.enabled` è supportato per Twilio Media Streams.
- `realtime.provider` è opzionale. Se non impostato, Voice Call usa il primo provider voce realtime registrato.
- Provider voce realtime inclusi: Google Gemini Live (`google`) e OpenAI (`openai`), registrati dai rispettivi plugin provider.
- La configurazione raw di proprietà del provider si trova in `realtime.providers.<providerId>`.
- Voice Call espone per impostazione predefinita lo strumento realtime condiviso `openclaw_agent_consult`. Il modello realtime può chiamarlo quando il chiamante chiede ragionamento più approfondito, informazioni attuali o normali strumenti OpenClaw.
- `realtime.fastContext.enabled` è disattivato per impostazione predefinita. Quando è abilitato, Voice Call cerca prima nella memoria indicizzata/nel contesto di sessione la domanda di consultazione e restituisce quegli estratti al modello realtime entro `realtime.fastContext.timeoutMs`, prima di ricorrere all'agent di consultazione completo solo se `realtime.fastContext.fallbackToConsult` è true.
- Se `realtime.provider` punta a un provider non registrato, o se non è registrato alcun provider voce realtime, Voice Call registra un avviso e salta i media realtime invece di far fallire l'intero plugin.
- Le chiavi di sessione di consultazione riutilizzano la sessione di chiamata memorizzata quando disponibile, poi ripiegano sul `sessionScope` configurato (`per-phone` per impostazione predefinita, o `per-call` per chiamate isolate).

### Criterio degli strumenti

`realtime.toolPolicy` controlla l'esecuzione della consultazione:

| Criterio         | Comportamento                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Espone lo strumento di consultazione e limita l'agent regolare a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`. |
| `owner`          | Espone lo strumento di consultazione e lascia che l'agent regolare usi il normale criterio degli strumenti agent.                         |
| `none`           | Non espone lo strumento di consultazione. Gli `realtime.tools` personalizzati vengono comunque passati al provider realtime.              |

### Esempi di provider realtime

<Tabs>
  <Tab title="Google Gemini Live">
    Predefiniti: chiave API da `realtime.providers.google.apiKey`,
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
[provider OpenAI](/it/providers/openai) per le opzioni voce realtime specifiche
del provider.

## Trascrizione streaming

`streaming` seleziona un provider di trascrizione realtime per l'audio delle chiamate live.

Comportamento runtime attuale:

- `streaming.provider` è facoltativo. Se non impostato, Chiamata vocale usa il primo provider di trascrizione in tempo reale registrato.
- Provider di trascrizione in tempo reale inclusi: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI (`xai`), registrati dai rispettivi provider plugins.
- La configurazione grezza di proprietà del provider si trova in `streaming.providers.<providerId>`.
- Dopo che Twilio invia un messaggio `start` di stream accettato, Chiamata vocale registra subito lo stream, accoda i media in ingresso tramite il provider di trascrizione mentre il provider si connette e avvia il saluto iniziale solo quando la trascrizione in tempo reale è pronta.
- Se `streaming.provider` punta a un provider non registrato, o nessuno è registrato, Chiamata vocale registra un avviso e salta lo streaming dei media invece di far fallire l'intero plugin.

### Esempi di provider di streaming

<Tabs>
  <Tab title="OpenAI">
    Predefiniti: chiave API `streaming.providers.openai.apiKey` oppure
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
    Predefiniti: chiave API `streaming.providers.xai.apiKey` oppure `XAI_API_KEY`;
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

Chiamata vocale usa la configurazione core `messages.tts` per lo streaming
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
- Il TTS core viene usato quando lo streaming dei media Twilio è abilitato; altrimenti le chiamate ripiegano sulle voci native del provider.
- Se uno stream multimediale Twilio è già attivo, Chiamata vocale non ripiega su TwiML `<Say>`. Se il TTS telefonico non è disponibile in quello stato, la richiesta di riproduzione fallisce invece di mescolare due percorsi di riproduzione.
- Quando il TTS telefonico ripiega su un provider secondario, Chiamata vocale registra un avviso con la catena dei provider (`from`, `to`, `attempts`) per il debug.
- Quando il barge-in Twilio o lo smontaggio dello stream svuota la coda TTS in sospeso, le richieste di riproduzione accodate si risolvono invece di lasciare i chiamanti in attesa del completamento della riproduzione.

### Esempi TTS

<Tabs>
  <Tab title="Core TTS only">
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
  <Tab title="Override to ElevenLabs (calls only)">
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
  <Tab title="OpenAI model override (deep-merge)">
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
`inboundPolicy: "allowlist"` è un controllo dell'ID chiamante a bassa garanzia. Il
plugin normalizza il valore `From` fornito dal provider e lo confronta con
`allowFrom`. La verifica del Webhook autentica la consegna del provider e
l'integrità del payload, ma **non** prova la proprietà del numero chiamante
PSTN/VoIP. Tratta `allowFrom` come filtro dell'ID chiamante, non come identità
forte del chiamante.
</Warning>

Le risposte automatiche usano il sistema agente. Regolale con `responseModel`,
`responseSystemPrompt` e `responseTimeoutMs`.

### Contratto di output parlato

Per le risposte automatiche, Chiamata vocale aggiunge al prompt di sistema un contratto rigoroso
di output parlato:

```text
{"spoken":"..."}
```

Chiamata vocale estrae il testo del parlato in modo difensivo:

- Ignora i payload contrassegnati come contenuto di ragionamento/errore.
- Analizza JSON diretto, JSON in blocchi delimitati o chiavi `"spoken"` inline.
- Ripiega su testo semplice e rimuove probabili paragrafi introduttivi di pianificazione/meta.

Questo mantiene la riproduzione parlata concentrata sul testo rivolto al chiamante ed evita
di far trapelare testo di pianificazione nell'audio.

### Comportamento di avvio della conversazione

Per le chiamate `conversation` in uscita, la gestione del primo messaggio è legata allo stato
di riproduzione live:

- Lo svuotamento della coda per barge-in e la risposta automatica vengono soppressi solo mentre il saluto iniziale è effettivamente in riproduzione.
- Se la riproduzione iniziale fallisce, la chiamata torna a `listening` e il messaggio iniziale resta in coda per un nuovo tentativo.
- La riproduzione iniziale per lo streaming Twilio parte alla connessione dello stream senza ritardi aggiuntivi.
- Il barge-in interrompe la riproduzione attiva e svuota le voci TTS Twilio accodate ma non ancora in riproduzione. Le voci svuotate si risolvono come saltate, così la logica della risposta successiva può continuare senza attendere audio che non verrà mai riprodotto.
- Le conversazioni vocali in tempo reale usano il turno di apertura dello stream in tempo reale. Chiamata vocale **non** pubblica un aggiornamento TwiML legacy `<Say>` per quel messaggio iniziale, quindi le sessioni `<Connect><Stream>` in uscita restano collegate.

### Periodo di tolleranza per disconnessione dello stream Twilio

Quando uno stream multimediale Twilio si disconnette, Chiamata vocale attende **2000 ms** prima
di terminare automaticamente la chiamata:

- Se lo stream si riconnette durante quella finestra, la chiusura automatica viene annullata.
- Se nessuno stream si registra di nuovo dopo il periodo di tolleranza, la chiamata viene terminata per prevenire chiamate attive bloccate.

## Reaper delle chiamate obsolete

Usa `staleCallReaperSeconds` per terminare chiamate che non ricevono mai un
webhook terminale (ad esempio, chiamate in modalità notifica che non si completano mai). Il valore predefinito
è `0` (disabilitato).

Intervalli consigliati:

- **Produzione:** `120`-`300` secondi per flussi in stile notifica.
- Mantieni questo valore **più alto di `maxDurationSeconds`** così le chiamate normali possono terminare. Un buon punto di partenza è `maxDurationSeconds + 30-60` secondi.

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
controllano quali header inoltrati sono attendibili:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Elenco consentito degli host dagli header di inoltro.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Considera attendibili gli header inoltrati senza un elenco consentito.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Considera attendibili gli header inoltrati solo quando l'IP remoto della richiesta corrisponde all'elenco.
</ParamField>

Protezioni aggiuntive:

- La **protezione dal replay** dei Webhook è abilitata per Twilio e Plivo. Le richieste Webhook valide riprodotte vengono confermate ma saltate per gli effetti collaterali.
- I turni di conversazione Twilio includono un token per turno nei callback `<Gather>`, quindi i callback vocali obsoleti/riprodotti non possono soddisfare un turno di trascrizione in sospeso più recente.
- Le richieste Webhook non autenticate vengono rifiutate prima della lettura del corpo quando mancano gli header di firma richiesti dal provider.
- Il webhook voice-call usa il profilo del corpo pre-auth condiviso (64 KB / 5 secondi) più un limite per IP alle richieste in corso prima della verifica della firma.

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
al runtime voice-call di proprietà del Gateway, così la CLI non associa un secondo
server Webhook. Se nessun Gateway è raggiungibile, i comandi ripiegano su un
runtime CLI autonomo.

`latency` legge `calls.jsonl` dal percorso di archiviazione voice-call predefinito.
Usa `--file <path>` per puntare a un log diverso e `--last <n>` per limitare
l'analisi agli ultimi N record (predefinito 200). L'output include p50/p90/p99
per latenza del turno e tempi di attesa-ascolto.

## Strumento agente

Nome dello strumento: `voice_call`.

| Azione          | Argomenti                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Questo repo include un documento skill corrispondente in `skills/voice-call/SKILL.md`.

## RPC Gateway

| Metodo               | Argomenti                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` è valido solo con `mode: "conversation"`. Le chiamate in modalità notifica
dovrebbero usare `voicecall.dtmf` dopo che la chiamata esiste, se hanno bisogno di
cifre post-connessione.

## Risoluzione dei problemi

### La configurazione non riesce a esporre il webhook

Esegui la configurazione dallo stesso ambiente che esegue il Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Per `twilio`, `telnyx` e `plivo`, `webhook-exposure` deve essere verde. Un
`publicUrl` configurato fallisce comunque quando punta a uno spazio di rete
locale o privato, perché il carrier non può richiamare quegli indirizzi. Non
usare `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` o `fd00::/8` come `publicUrl`.

Le chiamate in uscita Twilio in modalità notify inviano il loro `<Say>` TwiML
iniziale direttamente nella richiesta create-call, quindi il primo messaggio
parlato non dipende dal recupero del TwiML del Webhook da parte di Twilio. Un
Webhook pubblico è comunque richiesto per i callback di stato, le chiamate di
conversazione, il DTMF pre-connessione, gli stream realtime e il controllo della
chiamata post-connessione.

Usa un solo percorso di esposizione pubblica:

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

Dopo aver modificato la configurazione, riavvia o ricarica il Gateway, poi
esegui:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` è una simulazione a secco, a meno che tu non passi `--yes`.

### Le credenziali del provider falliscono

Controlla il provider selezionato e i campi credenziali richiesti:

- Twilio: `twilio.accountSid`, `twilio.authToken` e `fromNumber`, oppure
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` e
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` e `fromNumber`.

Le credenziali devono esistere sull'host del Gateway. La modifica di un profilo
shell locale non influisce su un Gateway già in esecuzione finché non viene
riavviato o finché il suo ambiente non viene ricaricato.

### Le chiamate si avviano ma i Webhook del provider non arrivano

Conferma che la console del provider punti all'URL esatto del Webhook pubblico:

```text
https://voice.example.com/voice/webhook
```

Poi ispeziona lo stato runtime:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Cause comuni:

- `publicUrl` punta a un percorso diverso da `serve.path`.
- L'URL del tunnel è cambiato dopo l'avvio del Gateway.
- Un proxy inoltra la richiesta ma rimuove o riscrive gli header host/proto.
- Il firewall o il DNS instrada l'hostname pubblico in una posizione diversa dal Gateway.
- Il Gateway è stato riavviato senza il Plugin Voice Call abilitato.

Quando un reverse proxy o un tunnel si trova davanti al Gateway, imposta
`webhookSecurity.allowedHosts` sull'hostname pubblico, oppure usa
`webhookSecurity.trustedProxyIPs` per un indirizzo proxy noto. Usa
`webhookSecurity.trustForwardingHeaders` solo quando il confine del proxy è sotto
il tuo controllo.

### La verifica della firma fallisce

Le firme dei provider vengono controllate rispetto all'URL pubblico che OpenClaw
ricostruisce dalla richiesta in ingresso. Se le firme falliscono:

- Conferma che l'URL del Webhook del provider corrisponda esattamente a
  `publicUrl`, inclusi schema, host e percorso.
- Per gli URL ngrok del livello gratuito, aggiorna `publicUrl` quando l'hostname
  del tunnel cambia.
- Assicurati che il proxy preservi gli header host e proto originali, oppure
  configura `webhookSecurity.allowedHosts`.
- Non abilitare `skipSignatureVerification` al di fuori dei test locali.

### I join Google Meet Twilio falliscono

Google Meet usa questo Plugin per i join dial-in Twilio. Prima verifica Voice
Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Poi verifica esplicitamente il trasporto Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Se Voice Call è verde ma il partecipante Meet non entra mai, controlla il numero
dial-in di Meet, il PIN e `--dtmf-sequence`. La telefonata può essere sana mentre
la riunione rifiuta o ignora una sequenza DTMF errata.

Google Meet passa la sequenza DTMF di Meet e il testo introduttivo a
`voicecall.start`. Per le chiamate Twilio, Voice Call serve prima il TwiML DTMF,
reindirizza di nuovo al Webhook, quindi apre lo stream media realtime in modo
che l'introduzione salvata venga generata dopo che il partecipante telefonico è
entrato nella riunione.

Usa `openclaw logs --follow` per la traccia live della fase. Un join Twilio Meet
sano registra questo ordine:

- Google Meet delega il join Twilio a Voice Call.
- Voice Call memorizza il TwiML DTMF pre-connessione.
- Il TwiML iniziale di Twilio viene consumato e servito prima della gestione realtime.
- Voice Call serve il TwiML realtime per la chiamata Twilio.
- Il bridge realtime si avvia con il saluto iniziale in coda.

`openclaw voicecall tail` mostra comunque i record di chiamata persistiti; è utile
per lo stato della chiamata e le trascrizioni, ma non tutte le transizioni
Webhook/realtime appaiono lì.

### La chiamata realtime non ha parlato

Conferma che sia abilitata una sola modalità audio. `realtime.enabled` e
`streaming.enabled` non possono essere entrambi true.

Per le chiamate Twilio realtime, verifica anche:

- Un Plugin provider realtime è caricato e registrato.
- `realtime.provider` non è impostato oppure nomina un provider registrato.
- La chiave API del provider è disponibile per il processo Gateway.
- `openclaw logs --follow` mostra il TwiML realtime servito, il bridge realtime
  avviato e il saluto iniziale in coda.

## Correlati

- [Modalità conversazione](/it/nodes/talk)
- [Sintesi vocale](/it/tools/tts)
- [Risveglio vocale](/it/nodes/voicewake)
