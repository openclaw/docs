---
read_when:
    - Vuoi effettuare una chiamata vocale in uscita da OpenClaw
    - Stai configurando o sviluppando il plugin per le chiamate vocali
    - Hai bisogno della voce in tempo reale o della trascrizione in streaming per la telefonia
sidebarTitle: Voice call
summary: Effettua chiamate vocali in uscita e accetta chiamate in entrata tramite Twilio, Telnyx o Plivo, con funzionalità vocali in tempo reale e trascrizione in streaming opzionali
title: Plugin per chiamate vocali
x-i18n:
    generated_at: "2026-07-12T07:22:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Chiamate vocali per OpenClaw tramite un plugin: notifiche in uscita, conversazioni
a più turni, voce in tempo reale full-duplex, trascrizione in streaming e
chiamate in entrata con criteri basati su elenchi di autorizzazione.

**Provider:** `mock` (sviluppo, nessuna rete), `plivo` (Voice API + trasferimento XML +
riconoscimento vocale GetInput), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams).

<Note>
Il plugin Voice Call viene eseguito **all'interno del processo Gateway**. Se utilizzi un
Gateway remoto, installa e configura il plugin sulla macchina che esegue il
Gateway, quindi riavvia il Gateway per caricarlo.
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

    Usa il pacchetto senza versione per seguire il tag della versione corrente. Fissa una
    versione esatta solo quando è necessaria un'installazione riproducibile. In seguito,
    riavvia il Gateway affinché il plugin venga caricato.

  </Step>
  <Step title="Configure provider and webhook">
    Imposta la configurazione in `plugins.entries.voice-call.config` (vedi
    [Configurazione](#configuration) di seguito). Sono richiesti almeno: `provider`, le
    credenziali del provider, `fromNumber` e un URL Webhook accessibile pubblicamente.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Verifica l'abilitazione del plugin, le credenziali del provider, l'esposizione del Webhook e
    che sia attiva una sola modalità audio (`streaming` o `realtime`).

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Per impostazione predefinita, entrambi eseguono una simulazione. Aggiungi `--yes` per effettuare una breve
    chiamata di notifica in uscita:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Per Twilio, Telnyx e Plivo, la configurazione deve produrre un **URL Webhook pubblico**.
Se `publicUrl`, l'URL del tunnel, l'URL Tailscale o l'alternativa di servizio
produce un indirizzo local loopback o uno spazio di rete privato, la configurazione non riesce invece di
avviare un provider che non può ricevere i Webhook dell'operatore.
</Warning>

## Configurazione

Se `enabled: true` ma al provider selezionato mancano le credenziali, all'avvio il Gateway
registra un avviso di configurazione incompleta con le chiavi mancanti e non
avvia il runtime. I comandi, le chiamate RPC e gli strumenti dell'agente restituiscono comunque
l'esatta configurazione mancante quando vengono utilizzati.

<Note>
Le credenziali delle chiamate vocali accettano SecretRef. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` e `plugins.entries.voice-call.config.tts.providers.*.apiKey` vengono risolti tramite l'interfaccia SecretRef standard; consulta [Interfaccia delle credenziali SecretRef](/it/reference/secretref-credential-surface).
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
                  openai: { speakerVoice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
            // region: "ie1", // optional: us1 | ie1 | au1; defaults to us1
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
          realtime: { enabled: false /* see Realtime voice conversations */ },
        },
      },
    },
  },
}
```

### Riferimento della configurazione

Chiavi di primo livello in `plugins.entries.voice-call.config` non mostrate in precedenza:

| Chiave                          | Valore predefinito | Note                                                                                                      |
| ------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| `enabled`                       | `false`            | Interruttore generale di attivazione/disattivazione.                                                      |
| `inboundPolicy`                 | `"disabled"`       | `disabled` \| `allowlist` \| `pairing` \| `open`. Vedi [Chiamate in entrata](#inbound-calls).             |
| `allowFrom`                     | `[]`               | Elenco di autorizzazione E.164 per `inboundPolicy: "allowlist"`.                                          |
| `maxDurationSeconds`            | `300`              | Limite massimo rigido della durata di ogni chiamata, applicato indipendentemente dallo stato di risposta. |
| `staleCallReaperSeconds`        | `120`              | Vedi [Pulizia delle chiamate obsolete](#stale-call-reaper). `0` la disabilita.                            |
| `silenceTimeoutMs`              | `800`              | Rilevamento del silenzio di fine parlato per il flusso classico (non in tempo reale).                      |
| `transcriptTimeoutMs`           | `180000`           | Attesa massima della trascrizione del chiamante prima di rinunciare a un turno.                            |
| `ringTimeoutMs`                 | `30000`            | Timeout dello squillo per le chiamate in uscita.                                                          |
| `maxConcurrentCalls`            | `1`                | Le chiamate in uscita oltre questo limite vengono rifiutate.                                              |
| `outbound.notifyHangupDelaySec` | `3`                | Secondi di attesa dopo il TTS prima della chiusura automatica in modalità di notifica.                     |
| `skipSignatureVerification`     | `false`            | Solo per test locali; non abilitarlo mai in produzione.                                                   |
| `store`                         | non impostato      | Sostituisce il percorso predefinito del registro chiamate `~/.openclaw/voice-calls`.                       |
| `agentId`                       | `"main"`           | Agente utilizzato per la generazione delle risposte e l'archiviazione delle sessioni.                      |
| `responseModel`                 | non impostato      | Sostituisce il modello predefinito per le risposte classiche (non in tempo reale).                         |
| `responseSystemPrompt`          | generato           | Prompt di sistema personalizzato per le risposte classiche.                                               |
| `responseTimeoutMs`             | `30000`            | Timeout per la generazione delle risposte classiche (ms).                                                 |

Twilio utilizza per impostazione predefinita il proprio endpoint REST US1. Per elaborare le chiamate in una
regione non statunitense supportata, imposta `twilio.region` su `ie1` o `au1` e utilizza le credenziali di
quella regione. Consulta la
[guida di Twilio all'API REST nelle regioni non statunitensi](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx e Plivo richiedono tutti un URL Webhook **accessibile pubblicamente**.
    - `mock` è un provider per lo sviluppo locale (nessuna chiamata di rete).
    - Telnyx richiede `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`), a meno che `skipSignatureVerification` non sia true.
    - `skipSignatureVerification` è destinato esclusivamente ai test locali.
    - Nel piano gratuito di ngrok, imposta `publicUrl` sull'URL ngrok esatto; la verifica della firma viene sempre applicata.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` consente Webhook Twilio con firme non valide **solo** quando `tunnel.provider="ngrok"` e `serve.bind` è local loopback (agente locale ngrok). Solo per lo sviluppo locale.
    - Gli URL del piano gratuito di ngrok possono cambiare o aggiungere schermate intermedie; se `publicUrl` cambia, le firme Twilio non sono valide. In produzione, preferisci un dominio stabile o un funnel Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` (valore predefinito `5000`) chiude i socket che non inviano mai un frame `start` valido.
    - `streaming.maxPendingConnections` (valore predefinito `32`) limita il numero totale di socket non autenticati in attesa dell'avvio.
    - `streaming.maxPendingConnectionsPerIp` (valore predefinito `4`) limita i socket non autenticati in attesa dell'avvio per ciascun IP di origine.
    - `streaming.maxConnections` (valore predefinito `128`) limita tutti i socket aperti dei flussi multimediali (in attesa + attivi).

  </Accordion>
  <Accordion title="Legacy config migrations">
    L'analisi della configurazione normalizza automaticamente queste chiavi precedenti e registra un
    avviso che indica il percorso sostitutivo; il livello di compatibilità verrà rimosso in una versione
    futura (`2026.6.0`), quindi esegui `openclaw doctor --fix` per riscrivere la configurazione salvata
    nella forma canonica:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` viene rimosso (il contesto in tempo reale ora utilizza il prompt dell'agente generato)

  </Accordion>
</AccordionGroup>

## Ambito della sessione

Per impostazione predefinita, Voice Call utilizza `sessionScope: "per-phone"`, così le chiamate ripetute dello
stesso chiamante conservano la memoria della conversazione. Imposta `sessionScope: "per-call"` quando
ogni chiamata dell'operatore deve iniziare con un contesto nuovo, ad esempio per reception,
prenotazioni, IVR o flussi bridge di Google Meet in cui lo stesso numero di telefono può
rappresentare riunioni diverse.

Voice Call archivia le chiavi di sessione generate nello spazio dei nomi dell'agente configurato
(`agent:<agentId>:voice:*`). Le chiavi di integrazione esplicite non elaborate vengono risolte nello
stesso spazio dei nomi: una chiave canonica `agent:<configuredAgentId>:*` mantiene tale
proprietario e rispetta gli alias `session.mainKey`/dell'ambito globale del core; un input
`agent:*` esterno o non valido viene delimitato come chiave opaca sotto l'agente
configurato; `global` e `unknown` rimangono sentinelle globali.

## Conversazioni vocali in tempo reale

`realtime` seleziona un provider vocale in tempo reale full-duplex per l'audio delle chiamate dal vivo.
È separato da `streaming`, che inoltra l'audio soltanto ai provider di
trascrizione in tempo reale.

<Warning>
`realtime.enabled` non può essere combinato con `streaming.enabled`. Scegli una sola
modalità audio per chiamata.
</Warning>

Comportamento attuale del runtime:

- `realtime.enabled` è supportato per Twilio e Telnyx.
- `realtime.provider` è facoltativo. Se non è impostato, Voice Call usa il primo provider vocale in tempo reale registrato.
- Provider vocali in tempo reale inclusi: Google Gemini Live (`google`) e OpenAI (`openai`), registrati dai rispettivi Plugin del provider.
- La configurazione non elaborata gestita dal provider si trova in `realtime.providers.<providerId>`.
- Per impostazione predefinita, Voice Call espone lo strumento in tempo reale condiviso `openclaw_agent_consult`. Il modello in tempo reale può chiamarlo quando l'interlocutore richiede un ragionamento più approfondito, informazioni aggiornate o i normali strumenti di OpenClaw.
- `realtime.consultPolicy` aggiunge facoltativamente indicazioni sui casi in cui il modello in tempo reale dovrebbe chiamare `openclaw_agent_consult`.
- `realtime.agentContext.enabled` è disattivato per impostazione predefinita. Quando è abilitato, Voice Call inserisce nelle istruzioni del provider in tempo reale, durante la configurazione della sessione, un'identità delimitata dell'agente e una selezione delimitata di file dell'area di lavoro.
- `realtime.fastContext.enabled` è disattivato per impostazione predefinita. Quando è abilitato, Voice Call cerca innanzitutto la domanda della consultazione nel contesto indicizzato della memoria e della sessione e restituisce questi estratti al modello in tempo reale entro `realtime.fastContext.timeoutMs`; ricorre all'agente di consultazione completo solo se `realtime.fastContext.fallbackToConsult` è `true`.
- Se `realtime.provider` fa riferimento a un provider non registrato, oppure non è registrato alcun provider vocale in tempo reale, Voice Call registra un avviso e ignora i contenuti multimediali in tempo reale anziché causare il malfunzionamento dell'intero Plugin.
- `inboundPolicy` non deve essere `"disabled"` quando `realtime.enabled` è `true`; `validateProviderConfig` rifiuta questa combinazione.
- Quando disponibile, le chiavi della sessione di consultazione riutilizzano la sessione di chiamata archiviata; in caso contrario, usano il valore `sessionScope` configurato (`per-phone` per impostazione predefinita oppure `per-call` per chiamate isolate).

### Criteri degli strumenti

`realtime.toolPolicy` controlla l'esecuzione della consultazione:

| Criterio         | Comportamento                                                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Espone lo strumento di consultazione e limita l'agente normale a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`.                                                    |
| `owner`          | Espone lo strumento di consultazione e consente all'agente normale di utilizzare i normali criteri degli strumenti dell'agente.                                                                  |
| `none`           | Non espone lo strumento di consultazione. Gli strumenti `realtime.tools` personalizzati vengono comunque trasmessi al provider in tempo reale.                                                    |

`realtime.consultPolicy` controlla esclusivamente le istruzioni del modello in tempo reale:

| Criterio      | Indicazioni                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `auto`        | Mantiene il prompt predefinito e lascia che il provider decida quando chiamare lo strumento di consultazione.                      |
| `substantive` | Risponde direttamente ai semplici scambi conversazionali e consulta prima di usare fatti, memoria, strumenti o contesto.           |
| `always`      | Effettua una consultazione prima di ogni risposta sostanziale.                                                                     |

### Contesto vocale dell'agente

Abilita `realtime.agentContext` quando il ponte vocale deve esprimersi come
l'agente OpenClaw configurato senza sostenere un ciclo completo di consultazione
dell'agente nelle interazioni ordinarie. La capsula di contesto viene aggiunta
una sola volta alla creazione della sessione in tempo reale, quindi non introduce
latenza per ogni interazione. Le chiamate a `openclaw_agent_consult` eseguono
comunque l'agente OpenClaw completo e devono essere utilizzate per operazioni
con strumenti, informazioni aggiornate, ricerche nella memoria o stato
dell'area di lavoro.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### Esempi di provider in tempo reale

<Tabs>
  <Tab title="Google Gemini Live">
    Valori predefiniti: chiave API da `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` o `GOOGLE_API_KEY`; modello
    `gemini-3.1-flash-live-preview`; voce `Kore`. `sessionResumption` e
    `contextWindowCompression` sono abilitati per impostazione predefinita
    per chiamate più lunghe e riconnettibili. Usa `silenceDurationMs`,
    `startSensitivity` ed `endSensitivity` per regolare un'alternanza dei
    turni più rapida sull'audio telefonico.

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
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-3.1-flash-live-preview",
                    speakerVoice: "Kore",
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

Consulta [Provider Google](/it/providers/google) e
[provider OpenAI](/it/providers/openai) per le opzioni vocali in tempo reale
specifiche del provider.

## Trascrizione in streaming

`streaming` seleziona un provider di trascrizione in tempo reale per l'audio
delle chiamate dal vivo.

Comportamento attuale in fase di esecuzione:

- `streaming.provider` è facoltativo. Se non è impostato, Voice Call usa il primo provider di trascrizione in tempo reale registrato.
- Provider di trascrizione in tempo reale inclusi: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI (`xai`), registrati dai rispettivi Plugin del provider.
- La configurazione non elaborata gestita dal provider si trova in `streaming.providers.<providerId>`.
- Dopo che Twilio invia un messaggio `start` di streaming accettato, Voice Call registra immediatamente lo streaming, accoda i contenuti multimediali in ingresso tramite il provider di trascrizione mentre questo stabilisce la connessione e avvia il saluto iniziale solo quando la trascrizione in tempo reale è pronta.
- Se `streaming.provider` fa riferimento a un provider non registrato, oppure non ne è registrato alcuno, Voice Call registra un avviso e ignora lo streaming multimediale anziché causare il malfunzionamento dell'intero Plugin.

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
    Valori predefiniti: chiave API `streaming.providers.xai.apiKey` o
    `XAI_API_KEY` (se nessuna delle due è impostata, usa un profilo di
    autenticazione OAuth xAI); endpoint `wss://api.x.ai/v1/stt`; codifica
    `mulaw`; frequenza di campionamento `8000`; `endpointingMs: 800`;
    `interimResults: true`.

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

Voice Call usa la configurazione principale `messages.tts` per la sintesi
vocale in streaming durante le chiamate. Puoi sovrascriverla nella
configurazione del Plugin utilizzando la **stessa struttura**: viene unita
ricorsivamente a `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**La sintesi vocale Microsoft viene ignorata per le chiamate vocali.** La
sintesi telefonica richiede un provider che implementi un output destinato
alla telefonia; il provider di sintesi vocale Microsoft non lo implementa,
quindi viene ignorato per le chiamate e vengono invece provati gli altri
provider nella catena di ripiego.
</Warning>

Note sul comportamento:

- Le chiavi legacy `tts.<provider>` nella configurazione del Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) vengono corrette da `openclaw doctor --fix`; la configurazione salvata deve usare `tts.providers.<provider>`.
- Il TTS principale viene usato quando lo streaming multimediale di Twilio è abilitato; altrimenti, le chiamate ricorrono alle voci native del provider.
- Se uno streaming multimediale Twilio è già attivo, Voice Call non ricorre a `<Say>` di TwiML. Se il TTS telefonico non è disponibile in tale stato, la richiesta di riproduzione non riesce anziché combinare due percorsi di riproduzione.
- Quando il TTS telefonico ricorre a un provider secondario, Voice Call registra un avviso contenente la catena dei provider (`from`, `to`, `attempts`) per agevolare il debug.
- Quando l'interruzione dell'interlocutore o la chiusura dello streaming Twilio svuota la coda TTS in sospeso, le richieste di riproduzione accodate vengono completate anziché lasciare in attesa chi aspetta il completamento della riproduzione.

### Esempi di TTS

<Tabs>
  <Tab title="Core TTS only">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
                speakerVoice: "marin",
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

Per impostazione predefinita, il criterio per le chiamate in ingresso è
`disabled`. Per abilitare le chiamate in ingresso, imposta:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` è un controllo dell'ID chiamante con garanzie limitate. Il plugin
normalizza il valore `From` fornito dal provider e lo confronta con `allowFrom`.
La verifica del Webhook autentica la consegna del provider e l'integrità del payload,
ma **non** dimostra la titolarità del numero chiamante PSTN/VoIP. Considera
`allowFrom` un filtro dell'ID chiamante, non una verifica forte dell'identità del chiamante.
</Warning>

Le risposte automatiche usano il sistema dell'agente. Configurale con `responseModel`,
`responseSystemPrompt` e `responseTimeoutMs`.

### Instradamento per numero

Usa `numbers` quando un singolo plugin Voice Call riceve chiamate per più numeri di
telefono e ciascun numero deve comportarsi come una linea diversa. Ad esempio,
un numero può usare un assistente personale informale, mentre un altro usa un'identità
aziendale, un agente di risposta diverso e una voce TTS diversa.

Le route vengono selezionate in base al numero `To` chiamato fornito dal provider. Le chiavi devono
essere numeri E.164. Quando arriva una chiamata, Voice Call risolve una sola volta la
route corrispondente, la memorizza nel record della chiamata e riutilizza tale
configurazione effettiva per il saluto, il percorso classico di risposta automatica, il percorso
di consultazione in tempo reale e la riproduzione TTS. Se nessuna route corrisponde, viene usata
la configurazione globale di Voice Call. Le chiamate in uscita non usano `numbers`; specifica
esplicitamente destinazione, messaggio e sessione in uscita quando avvii la chiamata.

Le sostituzioni specifiche della route attualmente supportano:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Il valore `tts` della route viene unito ricorsivamente alla configurazione globale `tts` di Voice Call, quindi
in genere puoi sostituire solo la voce del provider:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### Contratto dell'output vocale

Per le risposte automatiche, Voice Call aggiunge al prompt di sistema un rigido contratto
per l'output vocale che richiede una risposta JSON `{"spoken":"..."}`. Voice Call
estrae in modo difensivo il testo da pronunciare:

- Ignora i payload contrassegnati come contenuto di ragionamento o di errore.
- Analizza JSON diretto, JSON delimitato o chiavi `"spoken"` incorporate.
- In alternativa usa testo normale e rimuove i probabili paragrafi introduttivi di pianificazione o metacontenuto.

Ciò mantiene la riproduzione vocale concentrata sul testo destinato al chiamante ed evita di diffondere
nell'audio il testo di pianificazione.

### Comportamento all'avvio della conversazione

Per le chiamate `conversation` in uscita, la gestione del primo messaggio è legata allo stato
di riproduzione in tempo reale:

- La pulizia della coda in caso di interruzione vocale e la risposta automatica vengono soppresse solo mentre il saluto iniziale viene effettivamente pronunciato.
- Se la riproduzione iniziale non riesce, la chiamata torna allo stato `listening` e il messaggio iniziale rimane in coda per un nuovo tentativo.
- La riproduzione iniziale per lo streaming Twilio inizia alla connessione del flusso senza ulteriori ritardi.
- L'interruzione vocale interrompe la riproduzione attiva e rimuove le voci TTS Twilio in coda ma non ancora in riproduzione. Le voci rimosse vengono risolte come ignorate, consentendo alla logica delle risposte successive di proseguire senza attendere un audio che non verrà mai riprodotto.
- Le conversazioni vocali in tempo reale usano il turno iniziale del flusso in tempo reale. Voice Call **non** invia un aggiornamento TwiML `<Say>` legacy per quel messaggio iniziale, quindi le sessioni `<Connect><Stream>` in uscita rimangono collegate.

### Periodo di tolleranza per la disconnessione del flusso Twilio

Quando un flusso multimediale Twilio si disconnette, Voice Call attende **2000 ms** prima di
terminare automaticamente la chiamata:

- Se il flusso si riconnette durante tale intervallo, la terminazione automatica viene annullata.
- Se dopo il periodo di tolleranza non viene registrato nuovamente alcun flusso, la chiamata viene terminata per evitare chiamate attive bloccate.

## Eliminazione delle chiamate obsolete

Usa `staleCallReaperSeconds` (valore predefinito **120**) per terminare le chiamate che non ricevono mai
risposta e non raggiungono mai uno stato di conversazione attiva, ad esempio le chiamate in modalità
di notifica per le quali il provider non invia mai un Webhook terminale. Impostalo su `0` per
disabilitarlo.

Il processo di eliminazione viene eseguito ogni 30 secondi e termina solo le chiamate prive di
timestamp `answeredAt` e che non si trovano già in uno stato terminale o attivo
(`speaking`/`listening`), quindi le conversazioni a cui è stata data risposta non vengono mai eliminate
da questo timer; `maxDurationSeconds` (valore predefinito 300) è il limite separato che
termina le chiamate con risposta che durano troppo a lungo.

Per i flussi in stile notifica in cui gli operatori possono impiegare molto tempo a inviare i Webhook
di squillo/risposta, aumenta `staleCallReaperSeconds` oltre il valore predefinito affinché le chiamate
lente ma normali non vengano eliminate prematuramente; `120`-`300` secondi è un intervallo ragionevole
per la produzione.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Sicurezza dei Webhook

Quando davanti al Gateway è presente un proxy o un tunnel, il plugin ricostruisce
l'URL pubblico per la verifica della firma. Queste opzioni stabiliscono quali
intestazioni inoltrate sono considerate attendibili:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Host consentiti provenienti dalle intestazioni di inoltro.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Considera attendibili le intestazioni inoltrate senza un elenco consentito.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Considera attendibili le intestazioni inoltrate solo quando l'IP remoto della richiesta corrisponde all'elenco.
</ParamField>

Protezioni aggiuntive:

- La **protezione dalla ripetizione** dei Webhook è abilitata per Twilio, Telnyx e Plivo. Le richieste Webhook valide ripetute vengono confermate, ma i relativi effetti collaterali vengono ignorati.
- I turni di conversazione Twilio includono un token specifico per turno nei callback `<Gather>`, quindi i callback vocali obsoleti o ripetuti non possono soddisfare un turno di trascrizione in sospeso più recente.
- Le richieste Webhook non autenticate vengono rifiutate prima della lettura del corpo quando mancano le intestazioni di firma richieste dal provider.
- Il Webhook voice-call usa il profilo condiviso di lettura del corpo precedente all'autenticazione (corpo massimo di 64 KB, timeout di lettura di 5 secondi) e un limite per chiave delle richieste in corso (8 richieste simultanee per chiave per impostazione predefinita) prima della verifica della firma.

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

Quando il Gateway è già in esecuzione, i comandi operativi `voicecall`
vengono delegati al runtime voice-call gestito dal Gateway, così la CLI non associa un
secondo server Webhook. Se non è possibile raggiungere alcun Gateway, i comandi passano
a un runtime CLI autonomo.

`latency` legge `calls.jsonl` dal percorso di archiviazione predefinito di voice-call. Usa
`--file <path>` per specificare un log diverso e `--last <n>` per limitare
l'analisi agli ultimi N record (valore predefinito 200). L'output include minimo/massimo/media,
p50 e p95 per la latenza dei turni e i tempi di attesa dell'ascolto.

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

Il plugin voice-call include una Skills corrispondente per l'agente.

## RPC del Gateway

| Metodo                      | Argomenti                                                        | Note                                                                                           |
| --------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Usa come alternativa la configurazione `toNumber` quando `to` viene omesso.                    |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Equivale a `initiate`, ma accetta anche `dtmfSequence` prima della connessione.                 |
| `voicecall.continue`        | `callId`, `message`                                              | Blocca fino alla risoluzione del turno; restituisce la trascrizione.                            |
| `voicecall.continue.start`  | `callId`, `message`                                              | Variante asincrona: restituisce immediatamente un `operationId`.                               |
| `voicecall.continue.result` | `operationId`                                                    | Interroga un'operazione `voicecall.continue.start` in sospeso per ottenerne il risultato.       |
| `voicecall.speak`           | `callId`, `message`                                              | Parla senza attendere; usa il bridge in tempo reale quando `realtime.enabled`.                  |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                                                |
| `voicecall.end`             | `callId`                                                         |                                                                                                |
| `voicecall.status`          | `callId?`                                                        | Ometti `callId` per elencare tutte le chiamate attive.                                          |

`dtmfSequence` è valido solo con `mode: "conversation"`; le chiamate in modalità notifica
devono usare `voicecall.dtmf` dopo la creazione della chiamata se necessitano di cifre
successive alla connessione.

## Risoluzione dei problemi

### La configurazione dell'esposizione del Webhook non riesce

Esegui la configurazione dallo stesso ambiente in cui viene eseguito il Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Per `twilio`, `telnyx` e `plivo`, `webhook-exposure` deve essere verde. Anche un
`publicUrl` configurato non supera il controllo quando punta a uno spazio di rete locale o privato,
perché l'operatore non può richiamare tali indirizzi.
Non usare `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` o altri intervalli NAT
di livello operatore come `publicUrl`.

Le chiamate in uscita Twilio in modalità notifica inviano il TwiML `<Say>` iniziale direttamente
nella richiesta di creazione della chiamata, quindi il primo messaggio vocale non dipende dal
recupero del TwiML del Webhook da parte di Twilio. Un Webhook pubblico è comunque necessario per i callback
di stato, le chiamate di conversazione, il DTMF precedente alla connessione, i flussi in tempo reale e
il controllo della chiamata dopo la connessione.

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

Dopo aver modificato la configurazione, riavvia o ricarica il Gateway, quindi esegui:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` è un'esecuzione di prova, a meno che non specifichi `--yes`.

### Le credenziali del provider non sono valide

Controlla il provider selezionato e i campi delle credenziali obbligatori:

- Twilio: `twilio.accountSid`, `twilio.authToken` e `fromNumber`, oppure
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` e
  `fromNumber`, oppure `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` e
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken` e `fromNumber`, oppure
  `PLIVO_AUTH_ID` e `PLIVO_AUTH_TOKEN`.

Le credenziali devono essere presenti sull'host del Gateway. La modifica di un profilo della shell locale
non influisce su un Gateway già in esecuzione finché non viene riavviato o non ricarica il proprio
ambiente.

### Le chiamate si avviano, ma i webhook del provider non arrivano

Verifica che la console del provider punti all'URL pubblico esatto del webhook:

```text
https://voice.example.com/voice/webhook
```

Quindi controlla lo stato di runtime:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Cause comuni:

- `publicUrl` punta a un percorso diverso da `serve.path`.
- L'URL del tunnel è cambiato dopo l'avvio del Gateway.
- Un proxy inoltra la richiesta, ma rimuove o riscrive le intestazioni host/protocollo.
- Il firewall o il DNS instrada il nome host pubblico verso una destinazione diversa dal Gateway.
- Il Gateway è stato riavviato senza il plugin Voice Call abilitato.

Quando un reverse proxy o un tunnel si trova davanti al Gateway, imposta
`webhookSecurity.allowedHosts` sul nome host pubblico oppure utilizza
`webhookSecurity.trustedProxyIPs` per un indirizzo proxy noto. Utilizza
`webhookSecurity.trustForwardingHeaders` solo quando il confine del proxy è
sotto il tuo controllo.

### La verifica della firma non riesce

Le firme del provider vengono verificate rispetto all'URL pubblico che OpenClaw ricostruisce
dalla richiesta in arrivo. Se la verifica delle firme non riesce:

- Verifica che l'URL del webhook del provider corrisponda esattamente a `publicUrl`, inclusi schema, host e percorso.
- Per gli URL del piano gratuito di ngrok, aggiorna `publicUrl` quando cambia il nome host del tunnel.
- Assicurati che il proxy conservi le intestazioni host e protocollo originali oppure configura `webhookSecurity.allowedHosts`.
- Non abilitare `skipSignatureVerification` al di fuori dei test locali.

### Le partecipazioni a Google Meet tramite Twilio non riescono

Google Meet utilizza questo plugin per partecipare tramite chiamata telefonica Twilio. Verifica innanzitutto Voice
Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Quindi verifica esplicitamente il trasporto di Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Se Voice Call funziona correttamente, ma il partecipante non accede mai a Meet, controlla il numero
di accesso telefonico di Meet, il PIN e `--dtmf-sequence`. La chiamata telefonica può funzionare
correttamente anche se la riunione rifiuta o ignora una sequenza DTMF errata.

Google Meet avvia la tratta telefonica Twilio tramite `voicecall.start` con una
sequenza DTMF precedente alla connessione. Le sequenze derivate dal PIN includono
`voiceCall.dtmfDelayMs` del plugin Google Meet (valore predefinito: **12000 ms**) come cifre
di attesa Twilio iniziali, poiché i messaggi vocali per l'accesso telefonico a Meet possono arrivare in ritardo. Voice Call quindi
reindirizza nuovamente alla gestione in tempo reale prima che venga richiesto il saluto introduttivo.

Utilizza `openclaw logs --follow` per la traccia in tempo reale delle fasi. Una corretta partecipazione
a Meet tramite Twilio registra questo ordine:

- Google Meet delega a Voice Call la partecipazione tramite Twilio.
- Voice Call memorizza il TwiML DTMF precedente alla connessione.
- Il TwiML iniziale di Twilio viene elaborato e fornito prima della gestione in tempo reale.
- Voice Call fornisce il TwiML in tempo reale per la chiamata Twilio.
- Google Meet richiede il messaggio vocale introduttivo con `voicecall.speak` dopo il ritardo successivo al DTMF.

`openclaw voicecall tail` mostra comunque i record persistenti delle chiamate; è utile per
lo stato delle chiamate e le trascrizioni, ma non tutte le transizioni dei webhook o in tempo reale
vengono visualizzate in questo comando.

### La chiamata in tempo reale non ha audio vocale

Verifica che sia abilitata una sola modalità audio: `realtime.enabled` e
`streaming.enabled` non possono essere entrambi impostati su true.

Per le chiamate Twilio/Telnyx in tempo reale, verifica inoltre che:

- Sia caricato e registrato un plugin per un provider in tempo reale.
- `realtime.provider` non sia impostato oppure indichi un provider registrato.
- La chiave API del provider sia disponibile per il processo del Gateway.
- `openclaw logs --follow` mostri che il TwiML in tempo reale è stato fornito, che il bridge in tempo reale è stato avviato e che il saluto iniziale è stato accodato.

## Contenuti correlati

- [Modalità conversazione](/it/nodes/talk)
- [Sintesi vocale](/it/tools/tts)
- [Attivazione vocale](/it/nodes/voicewake)
