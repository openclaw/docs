---
read_when:
    - Vuoi effettuare una chiamata vocale in uscita da OpenClaw
    - Stai configurando o sviluppando il plugin per le chiamate vocali
    - Ti servono voce in tempo reale o trascrizione in streaming sulla telefonia
sidebarTitle: Voice call
summary: Effettua chiamate vocali in uscita e accetta chiamate vocali in ingresso tramite Twilio, Telnyx o Plivo, con voce in tempo reale opzionale e trascrizione in streaming
title: Plugin per chiamate vocali
x-i18n:
    generated_at: "2026-05-10T19:48:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94e3942b8330ebf2014f1899267f69f8a135859cfa1002ae390244a4f89883d6
    source_path: plugins/voice-call.md
    workflow: 16
---

Chiamate vocali per OpenClaw tramite un Plugin. Supporta notifiche in uscita,
conversazioni multi-turno, voce realtime full-duplex, trascrizione in streaming
e chiamate in ingresso con policy di allowlist.

**Provider attuali:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (sviluppo/nessuna rete).

<Note>
Il Plugin Voice Call viene eseguito **all'interno del processo Gateway**. Se usi un
Gateway remoto, installa e configura il Plugin sulla macchina che esegue
il Gateway, quindi riavvia il Gateway per caricarlo.
</Note>

## Avvio rapido

<Steps>
  <Step title="Installa il Plugin">
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

    Usa il pacchetto semplice per seguire l'attuale tag di rilascio ufficiale. Blocca una
    versione esatta solo quando ti serve un'installazione riproducibile.

    Riavvia poi il Gateway affinché il Plugin venga caricato.

  </Step>
  <Step title="Configura provider e Webhook">
    Imposta la configurazione in `plugins.entries.voice-call.config` (vedi
    [Configurazione](#configuration) di seguito per la struttura completa). Come minimo:
    `provider`, credenziali del provider, `fromNumber` e un URL Webhook
    raggiungibile pubblicamente.
  </Step>
  <Step title="Verifica la configurazione">
    ```bash
    openclaw voicecall setup
    ```

    L'output predefinito è leggibile nei log della chat e nei terminali. Controlla
    l'abilitazione del Plugin, le credenziali del provider, l'esposizione del Webhook e che
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
si risolve in local loopback o spazio di rete privato, la configurazione fallisce invece di
avviare un provider che non può ricevere Webhook dell'operatore.
</Warning>

## Configurazione

Se `enabled: true` ma al provider selezionato mancano le credenziali,
l'avvio del Gateway registra un avviso di configurazione incompleta con le chiavi mancanti e
salta l'avvio del runtime. Comandi, chiamate RPC e strumenti dell'agente restituiscono comunque
l'esatta configurazione del provider mancante quando vengono usati.

<Note>
Le credenziali voice-call accettano SecretRef. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` e `plugins.entries.voice-call.config.tts.providers.*.apiKey` vengono risolte tramite la superficie SecretRef standard; vedi [superficie credenziali SecretRef](/it/reference/secretref-credential-surface).
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
  <Accordion title="Note su esposizione e sicurezza del provider">
    - Twilio, Telnyx e Plivo richiedono tutti un URL Webhook **raggiungibile pubblicamente**.
    - `mock` è un provider di sviluppo locale (nessuna chiamata di rete).
    - Telnyx richiede `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) a meno che `skipSignatureVerification` non sia true.
    - `skipSignatureVerification` è solo per test locali.
    - Nel piano gratuito di ngrok, imposta `publicUrl` sull'URL ngrok esatto; la verifica della firma è sempre applicata.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` consente Webhook Twilio con firme non valide **solo** quando `tunnel.provider="ngrok"` e `serve.bind` è local loopback (agente locale ngrok). Solo sviluppo locale.
    - Gli URL del piano gratuito di ngrok possono cambiare o aggiungere comportamenti interstiziali; se `publicUrl` cambia, le firme Twilio falliscono. Produzione: preferisci un dominio stabile o un funnel Tailscale.

  </Accordion>
  <Accordion title="Limiti delle connessioni streaming">
    - `streaming.preStartTimeoutMs` chiude i socket che non inviano mai un frame `start` valido.
    - `streaming.maxPendingConnections` limita il totale dei socket pre-start non autenticati.
    - `streaming.maxPendingConnectionsPerIp` limita i socket pre-start non autenticati per IP di origine.
    - `streaming.maxConnections` limita il totale dei socket media stream aperti (pending + active).

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
stesso chiamante mantengono la memoria della conversazione. Imposta `sessionScope: "per-call"` quando
ogni chiamata dell'operatore deve iniziare con un contesto nuovo, per esempio reception,
prenotazioni, IVR o flussi bridge di Google Meet in cui lo stesso numero di telefono può
rappresentare riunioni diverse.

## Conversazioni vocali realtime

`realtime` seleziona un provider vocale realtime full-duplex per l'audio
delle chiamate live. È separato da `streaming`, che inoltra soltanto l'audio ai
provider di trascrizione realtime.

<Warning>
`realtime.enabled` non può essere combinato con `streaming.enabled`. Scegli una
modalità audio per chiamata.
</Warning>

Comportamento runtime attuale:

- `realtime.enabled` è supportato per Twilio Media Streams.
- `realtime.provider` è opzionale. Se non impostato, Voice Call usa il primo provider vocale realtime registrato.
- Provider vocali realtime inclusi: Google Gemini Live (`google`) e OpenAI (`openai`), registrati dai rispettivi Plugin provider.
- La configurazione raw di proprietà del provider si trova in `realtime.providers.<providerId>`.
- Voice Call espone per impostazione predefinita lo strumento realtime condiviso `openclaw_agent_consult`. Il modello realtime può chiamarlo quando il chiamante chiede ragionamenti più approfonditi, informazioni attuali o normali strumenti OpenClaw.
- `realtime.consultPolicy` aggiunge facoltativamente indicazioni su quando il modello realtime deve chiamare `openclaw_agent_consult`.
- `realtime.agentContext.enabled` è disattivato per impostazione predefinita. Quando è abilitato, Voice Call inserisce nelle istruzioni del provider realtime, durante la configurazione della sessione, un'identità dell'agente limitata, un override del prompt di sistema e una capsula di file del workspace selezionati.
- `realtime.fastContext.enabled` è disattivato per impostazione predefinita. Quando è abilitato, Voice Call cerca prima nella memoria indicizzata/nel contesto della sessione per la domanda di consultazione e restituisce questi frammenti al modello realtime entro `realtime.fastContext.timeoutMs`, prima di ricorrere all'agente di consultazione completo solo se `realtime.fastContext.fallbackToConsult` è true.
- Se `realtime.provider` punta a un provider non registrato, o se non è registrato alcun provider vocale realtime, Voice Call registra un avviso e salta i media realtime invece di far fallire l'intero Plugin.
- Le chiavi di sessione della consultazione riusano la sessione di chiamata archiviata quando disponibile, poi ricadono sul `sessionScope` configurato (`per-phone` per impostazione predefinita, o `per-call` per chiamate isolate).

### Policy degli strumenti

`realtime.toolPolicy` controlla l'esecuzione della consultazione:

| Policy           | Comportamento                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Espone lo strumento di consultazione e limita l'agente regolare a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`. |
| `owner`          | Espone lo strumento di consultazione e consente all'agente regolare di usare la normale policy degli strumenti dell'agente.              |
| `none`           | Non espone lo strumento di consultazione. Gli `realtime.tools` personalizzati vengono comunque passati al provider realtime.             |

`realtime.consultPolicy` controlla solo le istruzioni del modello realtime:

| Policy        | Indicazioni                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `auto`        | Mantiene il prompt predefinito e lascia decidere al provider quando chiamare lo strumento di consultazione. |
| `substantive` | Risponde direttamente ai semplici raccordi conversazionali e consulta prima di fatti, memoria, strumenti o contesto. |
| `always`      | Consulta prima di ogni risposta sostanziale.                                                     |

### Contesto vocale dell'agente

Abilita `realtime.agentContext` quando il bridge vocale deve suonare come l'agente
OpenClaw configurato senza pagare un round trip completo di consultazione dell'agente nei
turni ordinari. La capsula di contesto viene aggiunta una volta quando viene creata la sessione
realtime, quindi non aggiunge latenza per turno. Le chiamate a
`openclaw_agent_consult` eseguono comunque l'agente OpenClaw completo e devono essere usate
per lavori con strumenti, informazioni attuali, ricerche in memoria o stato del workspace.

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
              includeSystemPrompt: true,
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
    `GEMINI_API_KEY` o `GOOGLE_GENERATIVE_AI_API_KEY`; modello
    `gemini-2.5-flash-native-audio-preview-12-2025`; voce `Kore`.
    `sessionResumption` e `contextWindowCompression` sono attivi per impostazione predefinita per chiamate più lunghe
    e riconnettibili. Usa `silenceDurationMs`, `startSensitivity` e
    `endSensitivity` per regolare turni di conversazione più rapidi sull'audio telefonico.

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

Consulta [provider Google](/it/providers/google) e
[provider OpenAI](/it/providers/openai) per le opzioni vocali in tempo reale
specifiche del provider.

## Trascrizione in streaming

`streaming` seleziona un provider di trascrizione in tempo reale per l'audio delle chiamate live.

Comportamento runtime attuale:

- `streaming.provider` è facoltativo. Se non è impostato, Voice Call usa il primo provider di trascrizione in tempo reale registrato.
- Provider di trascrizione in tempo reale inclusi: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI (`xai`), registrati dai rispettivi Plugin provider.
- La configurazione grezza gestita dal provider si trova in `streaming.providers.<providerId>`.
- Dopo che Twilio invia un messaggio `start` di stream accettato, Voice Call registra immediatamente lo stream, accoda i media in ingresso tramite il provider di trascrizione mentre il provider si connette e avvia il saluto iniziale solo dopo che la trascrizione in tempo reale è pronta.
- Se `streaming.provider` punta a un provider non registrato, o se nessun provider è registrato, Voice Call registra un avviso e salta lo streaming dei media invece di far fallire l'intero Plugin.

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
**La sintesi vocale Microsoft viene ignorata per le chiamate vocali.** L'audio telefonico richiede PCM;
il trasporto Microsoft attuale non espone output PCM telefonico.
</Warning>

Note sul comportamento:

- Le chiavi legacy `tts.<provider>` nella configurazione del Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) vengono riparate da `openclaw doctor --fix`; la configurazione committata deve usare `tts.providers.<provider>`.
- Il TTS core viene usato quando lo streaming media Twilio è abilitato; altrimenti le chiamate tornano alle voci native del provider.
- Se uno stream media Twilio è già attivo, Voice Call non ripiega su TwiML `<Say>`. Se il TTS telefonico non è disponibile in quello stato, la richiesta di riproduzione fallisce invece di mescolare due percorsi di riproduzione.
- Quando il TTS telefonico ripiega su un provider secondario, Voice Call registra un avviso con la catena di provider (`from`, `to`, `attempts`) per il debug.
- Quando il barge-in Twilio o lo smontaggio dello stream svuota la coda TTS in sospeso, le richieste di riproduzione accodate vengono risolte invece di lasciare in attesa i chiamanti che aspettano il completamento della riproduzione.

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

La policy in ingresso è `disabled` per impostazione predefinita. Per abilitare le chiamate in ingresso, imposta:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` è un controllo dell'ID chiamante a bassa garanzia. Il
Plugin normalizza il valore `From` fornito dal provider e lo confronta con
`allowFrom`. La verifica del Webhook autentica la consegna del provider e
l'integrità del payload, ma **non** dimostra la proprietà del numero chiamante
PSTN/VoIP. Considera `allowFrom` come filtro dell'ID chiamante, non come identità
forte del chiamante.
</Warning>

Le risposte automatiche usano il sistema agente. Regola con `responseModel`,
`responseSystemPrompt` e `responseTimeoutMs`.

### Instradamento per numero

Usa `numbers` quando un Plugin Voice Call riceve chiamate per più numeri di telefono
e ogni numero deve comportarsi come una linea diversa. Per esempio, un
numero può usare un assistente personale informale mentre un altro usa una persona
aziendale, un agente di risposta diverso e una voce TTS diversa.

Le route vengono selezionate dal numero `To` composto fornito dal provider. Le chiavi devono essere
numeri E.164. Quando arriva una chiamata, Voice Call risolve la route corrispondente una sola volta,
salva la route abbinata nel record della chiamata e riusa quella configurazione effettiva
per il saluto, il percorso classico di risposta automatica, il percorso di consultazione in tempo reale e la riproduzione
TTS. Se nessuna route corrisponde, viene usata la configurazione globale di Voice Call.
Le chiamate in uscita non usano `numbers`; passa esplicitamente il destinatario in uscita, il messaggio e
la sessione quando avvii la chiamata.

Le sovrascritture delle route attualmente supportano:

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

Per le risposte automatiche, Voice Call aggiunge un contratto rigoroso dell'output parlato al
prompt di sistema:

```text
{"spoken":"..."}
```

Voice Call estrae il testo parlato in modo difensivo:

- Ignora i payload contrassegnati come contenuti di ragionamento/errore.
- Analizza JSON diretto, JSON recintato o chiavi `"spoken"` inline.
- Ripiega sul testo semplice e rimuove probabili paragrafi introduttivi di pianificazione/meta.

Questo mantiene la riproduzione parlata concentrata sul testo rivolto al chiamante ed evita
di far trapelare testo di pianificazione nell'audio.

### Comportamento di avvio della conversazione

Per le chiamate `conversation` in uscita, la gestione del primo messaggio è legata allo stato di
riproduzione live:

- Lo svuotamento della coda per barge-in e la risposta automatica vengono soppressi solo mentre il saluto iniziale sta parlando attivamente.
- Se la riproduzione iniziale fallisce, la chiamata torna a `listening` e il messaggio iniziale resta in coda per un nuovo tentativo.
- La riproduzione iniziale per lo streaming Twilio parte alla connessione dello stream senza ritardi aggiuntivi.
- Il barge-in interrompe la riproduzione attiva e svuota le voci TTS Twilio accodate ma non ancora in riproduzione. Le voci svuotate vengono risolte come saltate, così la logica di risposta successiva può continuare senza attendere audio che non verrà mai riprodotto.
- Le conversazioni vocali in tempo reale usano il turno di apertura proprio dello stream in tempo reale. Voice Call **non** pubblica un aggiornamento TwiML legacy `<Say>` per quel messaggio iniziale, quindi le sessioni `<Connect><Stream>` in uscita restano collegate.

### Finestra di tolleranza per la disconnessione dello stream Twilio

Quando uno stream media Twilio si disconnette, Voice Call attende **2000 ms** prima di
terminare automaticamente la chiamata:

- Se lo stream si riconnette durante quella finestra, la terminazione automatica viene annullata.
- Se nessuno stream si registra di nuovo dopo il periodo di tolleranza, la chiamata viene terminata per evitare chiamate attive bloccate.

## Reaper delle chiamate stale

Usa `staleCallReaperSeconds` per terminare le chiamate che non ricevono mai un
Webhook terminale (per esempio, chiamate in modalità notifica che non vengono mai completate). Il valore predefinito
è `0` (disabilitato).

Intervalli consigliati:

- **Produzione:** `120`–`300` secondi per flussi in stile notifica.
- Mantieni questo valore **più alto di `maxDurationSeconds`** in modo che le chiamate normali possano terminare. Un buon punto di partenza è `maxDurationSeconds + 30–60` secondi.

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
  Consenti gli host dagli header di inoltro.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Considera attendibili gli header inoltrati senza un elenco di consentiti.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Considera attendibili gli header inoltrati solo quando l'IP remoto della richiesta corrisponde all'elenco.
</ParamField>

Protezioni aggiuntive:

- La **protezione dalla riproduzione** dei Webhook è abilitata per Twilio e Plivo. Le richieste Webhook valide riprodotte ricevono conferma ma vengono ignorate per gli effetti collaterali.
- I turni di conversazione Twilio includono un token per turno nei callback `<Gather>`, quindi i callback vocali obsoleti/riprodotti non possono soddisfare un turno di trascrizione in sospeso più recente.
- Le richieste Webhook non autenticate vengono rifiutate prima della lettura del body quando mancano gli header di firma richiesti dal provider.
- Il Webhook voice-call usa il profilo body pre-autenticazione condiviso (64 KB / 5 secondi) più un limite per IP sulle richieste in corso prima della verifica della firma.

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
al runtime voice-call di proprietà del Gateway, così la CLI non apre un secondo
server Webhook. Se non è raggiungibile alcun Gateway, i comandi ripiegano su un
runtime CLI autonomo.

`latency` legge `calls.jsonl` dal percorso di archiviazione voice-call predefinito.
Usa `--file <path>` per indicare un log diverso e `--last <n>` per limitare
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

| Metodo               | Argomenti                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` è valido solo con `mode: "conversation"`. Le chiamate in modalità notifica
devono usare `voicecall.dtmf` dopo l'esistenza della chiamata se necessitano di
cifre post-connessione.

## Risoluzione dei problemi

### La configurazione non riesce a esporre il Webhook

Esegui la configurazione dallo stesso ambiente che esegue il Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Per `twilio`, `telnyx` e `plivo`, `webhook-exposure` deve essere verde. Un
`publicUrl` configurato non riesce comunque quando punta a uno spazio di rete
locale o privato, perché l'operatore non può richiamare quegli indirizzi. Non usare
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` o `fd00::/8` come `publicUrl`.

Le chiamate in uscita Twilio in modalità notifica inviano il loro TwiML `<Say>` iniziale direttamente nella
richiesta di creazione della chiamata, quindi il primo messaggio parlato non dipende dal recupero
del TwiML Webhook da parte di Twilio. Un Webhook pubblico è comunque richiesto per callback di stato,
chiamate di conversazione, DTMF pre-connessione, stream in tempo reale e controllo chiamata
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

Dopo aver modificato la configurazione, riavvia o ricarica il Gateway, quindi esegui:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` è un'esecuzione di prova a secco a meno che tu non passi `--yes`.

### Le credenziali del provider non funzionano

Controlla il provider selezionato e i campi credenziale richiesti:

- Twilio: `twilio.accountSid`, `twilio.authToken` e `fromNumber`, oppure
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` e
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` e `fromNumber`.

Le credenziali devono esistere sull'host del Gateway. La modifica di un profilo shell locale
non influisce su un Gateway già in esecuzione finché non viene riavviato o finché non ricarica il suo
ambiente.

### Le chiamate partono ma i Webhook del provider non arrivano

Conferma che la console del provider punti all'URL Webhook pubblico esatto:

```text
https://voice.example.com/voice/webhook
```

Quindi ispeziona lo stato del runtime:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Cause comuni:

- `publicUrl` punta a un percorso diverso da `serve.path`.
- L'URL del tunnel è cambiato dopo l'avvio del Gateway.
- Un proxy inoltra la richiesta ma rimuove o riscrive gli header host/proto.
- Il firewall o il DNS instrada il nome host pubblico in un punto diverso dal Gateway.
- Il Gateway è stato riavviato senza il Plugin Voice Call abilitato.

Quando un proxy inverso o un tunnel si trova davanti al Gateway, imposta
`webhookSecurity.allowedHosts` sul nome host pubblico, oppure usa
`webhookSecurity.trustedProxyIPs` per un indirizzo proxy noto. Usa
`webhookSecurity.trustForwardingHeaders` solo quando il confine del proxy è sotto
il tuo controllo.

### La verifica della firma non riesce

Le firme del provider vengono controllate rispetto all'URL pubblico che OpenClaw ricostruisce
dalla richiesta in arrivo. Se le firme non riescono:

- Conferma che l'URL Webhook del provider corrisponda esattamente a `publicUrl`, inclusi
  schema, host e percorso.
- Per gli URL ngrok del piano gratuito, aggiorna `publicUrl` quando il nome host del tunnel cambia.
- Assicurati che il proxy preservi gli header host e proto originali, oppure configura
  `webhookSecurity.allowedHosts`.
- Non abilitare `skipSignatureVerification` al di fuori dei test locali.

### Le partecipazioni Google Meet Twilio non riescono

Google Meet usa questo plugin per le partecipazioni con chiamata Twilio. Verifica prima Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Quindi verifica esplicitamente il trasporto Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Se Voice Call è verde ma il partecipante Meet non entra mai, controlla il
numero di chiamata di Meet, il PIN e `--dtmf-sequence`. La chiamata telefonica può essere sana mentre
la riunione rifiuta o ignora una sequenza DTMF errata.

Google Meet avvia il segmento telefonico Twilio tramite `voicecall.start` con una
sequenza DTMF pre-connessione. Le sequenze derivate dal PIN includono
`voiceCall.dtmfDelayMs` del plugin Google Meet come cifre di attesa Twilio iniziali. Il valore predefinito è 12 secondi
perché i prompt di accesso telefonico a Meet possono arrivare in ritardo. Voice Call quindi reindirizza di nuovo alla
gestione in tempo reale prima che venga richiesto il saluto introduttivo.

Usa `openclaw logs --follow` per la traccia della fase live. Una partecipazione Twilio Meet sana
registra questo ordine:

- Google Meet delega la partecipazione Twilio a Voice Call.
- Voice Call archivia il TwiML DTMF pre-connessione.
- Il TwiML iniziale di Twilio viene consumato e servito prima della gestione in tempo reale.
- Voice Call serve il TwiML in tempo reale per la chiamata Twilio.
- Google Meet richiede il parlato introduttivo con `voicecall.speak` dopo il ritardo post-DTMF.

`openclaw voicecall tail` mostra comunque i record di chiamata persistiti; è utile per
lo stato delle chiamate e le trascrizioni, ma non ogni transizione Webhook/in tempo reale appare
lì.

### La chiamata in tempo reale non ha parlato

Conferma che sia abilitata una sola modalità audio. `realtime.enabled` e
`streaming.enabled` non possono essere entrambi true.

Per le chiamate Twilio in tempo reale, verifica anche:

- Un plugin provider in tempo reale è caricato e registrato.
- `realtime.provider` non è impostato o nomina un provider registrato.
- La chiave API del provider è disponibile al processo Gateway.
- `openclaw logs --follow` mostra il TwiML in tempo reale servito, il bridge in tempo reale
  avviato e il saluto iniziale accodato.

## Correlati

- [Modalità Talk](/it/nodes/talk)
- [Text-to-speech](/it/tools/tts)
- [Voice wake](/it/nodes/voicewake)
