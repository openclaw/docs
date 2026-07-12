---
read_when:
    - Integrazione di strumenti che richiedono OpenAI Chat Completions
summary: Esponi un endpoint HTTP `/v1/chat/completions` compatibile con OpenAI dal Gateway
title: Completamenti chat di OpenAI
x-i18n:
    generated_at: "2026-07-12T07:03:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Il Gateway può esporre una piccola superficie Chat Completions compatibile con OpenAI. È **disabilitata per impostazione predefinita**.

Una volta abilitata, espone tutti questi endpoint sulla stessa porta del Gateway (multiplexing WS + HTTP):

| Metodo | Percorso               |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

Le richieste vengono eseguite come una normale esecuzione dell'agente del Gateway (lo stesso percorso di codice di `openclaw agent`), quindi instradamento, autorizzazioni e configurazione corrispondono a quelli del Gateway.

## Abilitazione dell'endpoint

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

Imposta `enabled: false` (oppure omettilo) per disabilitarlo.

## Confine di sicurezza (importante)

Considera questo endpoint come **accesso completo da operatore** all'istanza del Gateway:

- Un token o una password del Gateway validi per questo endpoint equivalgono a una credenziale di proprietario/operatore, non a un ambito ristretto per singolo utente.
- Le richieste passano attraverso lo stesso percorso dell'agente del piano di controllo usato dalle azioni degli operatori attendibili, quindi, se i criteri dell'agente di destinazione consentono strumenti sensibili, questo endpoint può utilizzarli.
- Mantienilo accessibile solo tramite local loopback, tailnet o ingresso privato. Non esporlo a Internet pubblico.

Matrice di autenticazione:

| Percorso di autenticazione                                                                            | Comportamento                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`                               | Dimostra il possesso del segreto condiviso del Gateway. Ignora qualsiasi intestazione `x-openclaw-scopes` e ripristina l'insieme completo degli ambiti predefiniti dell'operatore: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Considera i turni di chat come turni inviati dal proprietario. |
| HTTP attendibile con identità (autenticazione trusted-proxy oppure `gateway.auth.mode="none"` su ingresso privato) | Rispetta `x-openclaw-scopes` quando presente; in sua assenza, usa l'insieme predefinito degli ambiti dell'operatore. Perde la semantica di proprietario solo quando il chiamante restringe esplicitamente gli ambiti e omette `operator.admin`. Richiede `operator.admin` per controlli a livello di proprietario come `x-openclaw-model`.                                                        |

Consulta [Ambiti dell'operatore](/it/gateway/operator-scopes), [Sicurezza](/it/gateway/security) e [Accesso remoto](/it/gateway/remote).

## Autenticazione

Utilizza la configurazione di autenticazione del Gateway (consulta [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth) per i dettagli relativi a questa modalità):

| Modalità                            | Come autenticarsi                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. Impostato tramite `gateway.auth.token` o `OPENCLAW_GATEWAY_TOKEN`.                                                                                                     |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. Impostata tramite `gateway.auth.password` o `OPENCLAW_GATEWAY_PASSWORD`.                                                                                            |
| `gateway.auth.mode="trusted-proxy"` | Instrada attraverso il proxy configurato con riconoscimento dell'identità, che inserisce le intestazioni di identità richieste. I proxy local loopback sullo stesso host richiedono esplicitamente `gateway.auth.trustedProxy.allowLoopback = true`. |
| `gateway.auth.mode="none"`          | Non è richiesta alcuna intestazione di autenticazione (solo ingresso privato).                                                                                                                         |

Note:

- I chiamanti sullo stesso host che aggirano il proxy di un Gateway `trusted-proxy` possono utilizzare direttamente come ripiego `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Qualsiasi indicazione nelle intestazioni `Forwarded`, `X-Forwarded-*` o `X-Real-IP` mantiene invece la richiesta sul percorso trusted-proxy.
- Se `gateway.auth.rateLimit` è configurato e troppi tentativi di autenticazione non riescono, l'endpoint restituisce `429` con un'intestazione `Retry-After`.

## Quando utilizzare questo endpoint

- Preferiscilo all'aggiunta di un nuovo canale integrato quando l'integrazione è semplicemente un'altra superficie operatore/client per lo stesso Gateway.
- Per i client mobili nativi che si connettono direttamente a un Gateway remoto, preferisci [WebChat](/it/web/webchat) o il [Protocollo del Gateway](/it/gateway/protocol) con il flusso di avvio per dispositivo associato/token del dispositivo, in modo che il dispositivo non necessiti di un token o di una password HTTP condivisi.
- Crea invece un Plugin di canale quando integri una rete di messaggistica esterna con utenti, stanze, consegna tramite Webhook o trasporto in uscita propri. Consulta [Creazione di Plugin](/it/plugins/building-plugins).

## Contratto del modello incentrato sull'agente

OpenClaw considera il campo OpenAI `model` come una **destinazione agente**, non come un ID non elaborato del modello del provider.

| Valore di `model`                           | Instrada verso                                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw`                                  | Agente predefinito configurato                                                                                                              |
| `openclaw/default`                          | Agente predefinito configurato (alias stabile; può essere inserito nel codice in modo sicuro anche se l'ID reale dell'agente predefinito cambia tra gli ambienti) |
| `openclaw/<agentId>` o `openclaw:<agentId>` | Agente specifico                                                                                                                            |
| `agent:<agentId>`                           | Agente specifico (alias di compatibilità)                                                                                                   |

Intestazioni facoltative della richiesta:

| Intestazione                                    | Effetto                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Sostituisce il modello di backend per l'agente selezionato. I chiamanti bearer con segreto condiviso possono utilizzarla direttamente; i chiamanti con identità (trusted-proxy oppure ingresso privato senza autenticazione con `x-openclaw-scopes`) necessitano di `operator.admin`, altrimenti ricevono `403 missing scope: operator.admin`. |
| `x-openclaw-agent-id: <agentId>`                | Sostituzione di compatibilità per la selezione dell'agente.                                                                                                                                                                                                                                                                                              |
| `x-openclaw-session-key: <sessionKey>`          | Instradamento esplicito della sessione. Viene rifiutato con `400 invalid_request_error` se utilizza uno spazio dei nomi interno riservato (`subagent:`, `cron:`, `acp:`).                                                                                                                                                                                   |
| `x-openclaw-message-channel: <channel>`         | Imposta il contesto sintetico del canale di ingresso per prompt/criteri dipendenti dal canale.                                                                                                                                                                                                                                                           |

`/v1/models` elenca le destinazioni agente di primo livello (`openclaw`, `openclaw/default`, `openclaw/<agentId>`), non i modelli dei provider di backend né i sottoagenti; i sottoagenti rimangono parte della topologia di esecuzione interna. Se ometti `x-openclaw-model`, l'agente selezionato viene eseguito con il modello normalmente configurato.

`/v1/embeddings` utilizza gli stessi ID `model` delle destinazioni agente. Invia `x-openclaw-model` (da un chiamante con segreto condiviso oppure da un chiamante con identità e `operator.admin`) per scegliere un modello di embedding specifico; in caso contrario, la richiesta utilizza la normale configurazione degli embedding dell'agente selezionato.

## Comportamento della sessione

Per impostazione predefinita, l'endpoint è **senza stato per ogni richiesta** (a ogni chiamata viene generata una nuova chiave di sessione).

Se la richiesta include una stringa OpenAI `user`, il Gateway ne deriva una chiave di sessione stabile, in modo che le chiamate ripetute possano condividere una sessione dell'agente. Per le applicazioni personalizzate, riutilizza lo stesso valore `user` per ogni thread di conversazione; evita gli identificatori a livello di account, a meno che tu non voglia che più conversazioni o dispositivi condividano una singola sessione OpenClaw. Utilizza `x-openclaw-session-key` solo quando ti serve un controllo esplicito dell'instradamento tra più client/thread, con chiavi gestite dall'applicazione che evitino gli spazi dei nomi riservati indicati sopra.

## Limiti delle richieste (configurazione)

I valori predefiniti possono essere regolati in `gateway.http.endpoints.chatCompletions`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxImageParts: 8,
          maxTotalImageBytes: 20000000,
          images: {
            allowUrl: false,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Valori predefiniti quando omessi:

| Chiave                | Valore predefinito                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `maxBodyBytes`        | 20 MB                                                                                               |
| `maxImageParts`       | 8 (numero massimo di parti `image_url` lette dall'ultimo messaggio dell'utente)                      |
| `maxTotalImageBytes`  | 20 MB (byte decodificati complessivi in tutte le parti `image_url` di una singola richiesta)        |
| `images.allowUrl`     | `false` (le parti `image_url` provenienti da URL vengono rifiutate, a meno che non siano abilitate) |
| `images.maxBytes`     | 10 MB per immagine                                                                                  |
| `images.maxRedirects` | 3                                                                                                   |
| `images.timeoutMs`    | 10 s                                                                                                |

Le sorgenti `image_url` HEIC/HEIF vengono accettate e normalizzate in JPEG prima della consegna al provider tramite il processore di immagini condiviso di OpenClaw (Rastermill), che ricorre a un convertitore di sistema (`sips`, ImageMagick, GraphicsMagick o ffmpeg) per i formati che richiedono il supporto di codec esterni.

Nota di sicurezza: l'inserimento di un nome host nell'elenco consentito non aggira il blocco degli indirizzi IP privati/interni. Per i Gateway esposti a Internet, applica controlli sul traffico di rete in uscita oltre alle protezioni a livello di applicazione. Consulta [Sicurezza](/it/gateway/security).

## Contratto degli strumenti di chat

`/v1/chat/completions` supporta un sottoinsieme di strumenti funzione compatibile con i comuni client di chat OpenAI.

### Campi della richiesta supportati

| Campo                      | Note                                                                                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | Array di `{ "type": "function", "function": { ... } }`                                                                                                                |
| `tool_choice`              | `"auto"`, `"none"`, `"required"` oppure `{ "type": "function", "function": { "name": "..." } }`                                                                        |
| `messages[*].role: "tool"` | Turni successivi                                                                                                                                                       |
| `messages[*].tool_call_id` | Associa il risultato di uno strumento a una precedente chiamata dello strumento                                                                                        |
| `max_completion_tokens`    | Numero; limite per chiamata dei token di completamento totali (inclusi i token di ragionamento). Nome attuale del campo; usato quando vengono inviati sia questo sia `max_tokens`. |
| `max_tokens`               | Numero; alias precedente, ignorato quando è presente anche `max_completion_tokens`.                                                                                    |
| `temperature`              | Numero da 0 a 2; applicato ove possibile e inoltrato al provider upstream. `400 invalid_request_error` se non rientra nell'intervallo.                                  |
| `top_p`                    | Numero da 0 a 1; applicato ove possibile. `400 invalid_request_error` se non rientra nell'intervallo.                                                                  |
| `frequency_penalty`        | Numero da -2.0 a 2.0; applicato ove possibile. `400 invalid_request_error` se non rientra nell'intervallo.                                                              |
| `presence_penalty`         | Numero da -2.0 a 2.0; applicato ove possibile. `400 invalid_request_error` se non rientra nell'intervallo.                                                              |
| `seed`                     | Intero; applicato ove possibile. `400 invalid_request_error` per valori non interi.                                                                                    |
| `stop`                     | Stringa o array contenente fino a 4 stringhe; applicato ove possibile. `400 invalid_request_error` per più di 4 sequenze o per elementi non stringa/vuoti.             |

Tutti i campi di campionamento e limite dei token utilizzano lo stesso canale dei parametri del flusso dell'agente e vengono inoltrati ove possibile:

- Limite dei token: il nome del campo nel protocollo viene scelto dal trasporto del provider: `max_completion_tokens` per gli endpoint della famiglia OpenAI, `max_tokens` per i provider che accettano solo il nome precedente (Mistral, Chutes).
- `stop` viene associato al campo di arresto del trasporto: `stop` per i backend Chat Completions, `stop_sequences` per Anthropic. L'API Responses di OpenAI non dispone di un parametro di arresto, quindi `stop` non viene applicato ai modelli basati su Responses.
- Il backend Codex Responses basato su ChatGPT utilizza un campionamento fisso lato server e rimuove `temperature`/`top_p` (insieme a `max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`) prima che la richiesta raggiunga tale backend.

### Varianti non supportate

Restituisce `400 invalid_request_error` per:

- `tools` che non è un array, elementi dello strumento che non sono funzioni o `tool.function.name` mancante
- varianti di `tool_choice` come `allowed_tools` e `custom`
- valori di `tool_choice.function.name` che non corrispondono a uno strumento fornito

Per `tool_choice: "required"` e `tool_choice` vincolato a una funzione, l'endpoint restringe l'insieme esposto degli strumenti funzione del client, indica al runtime di chiamare uno strumento del client prima di rispondere e restituisce un errore se la risposta dell'agente non contiene una chiamata strutturata corrispondente a uno strumento del client. Ciò si applica all'elenco HTTP `tools` fornito dal chiamante, non a tutti gli strumenti interni dell'agente OpenClaw.

### Struttura della risposta non in streaming degli strumenti

Quando l'agente chiama gli strumenti, la risposta utilizza:

- `choices[0].finish_reason = "tool_calls"`
- elementi `choices[0].message.tool_calls[]` con `id`, `type: "function"`, `function.name`, `function.arguments` (stringa JSON)
- Commento dell'assistente prima della chiamata dello strumento, in `choices[0].message.content` (eventualmente vuoto)

### Struttura della risposta in streaming degli strumenti

Quando `stream: true`, le chiamate degli strumenti arrivano come blocchi SSE incrementali: un delta iniziale con il ruolo dell'assistente, delta facoltativi con i commenti dell'assistente, uno o più blocchi `delta.tool_calls` contenenti l'identità dello strumento e frammenti degli argomenti, quindi un blocco finale con `finish_reason: "tool_calls"` e `data: [DONE]`.

Se `stream_options.include_usage=true`, prima di `[DONE]` viene emesso un blocco finale relativo all'utilizzo.

### Ciclo di proseguimento degli strumenti

Dopo aver ricevuto `tool_calls`, esegui le funzioni richieste e invia una richiesta successiva che includa il precedente messaggio dell'assistente con la chiamata dello strumento, più uno o più messaggi con `role: "tool"` e `tool_call_id` corrispondente. In questo modo, lo stesso ciclo di ragionamento dell'agente prosegue fino a produrre la risposta finale.

## Streaming (SSE)

Imposta `stream: true` per ricevere eventi inviati dal server:

- `Content-Type: text/event-stream`
- Ogni riga di evento è `data: <json>`
- Il flusso termina con `data: [DONE]`

## Configurazione rapida di Open WebUI

- URL di base: `http://127.0.0.1:18789/v1`
- URL di base per Docker su macOS: `http://host.docker.internal:18789/v1`
- Chiave API: il tuo token bearer del Gateway
- Modello: `openclaw/default`

Comportamento previsto: `GET /v1/models` elenca `openclaw/default` e Open WebUI lo utilizza come ID del modello di chat. Per un provider/modello backend specifico, imposta il normale modello predefinito dell'agente oppure invia `x-openclaw-model` (chiamante con segreto condiviso oppure chiamante con identità e `operator.admin`).

Test rapido di verifica:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Se restituisce `openclaw/default`, la maggior parte delle configurazioni di Open WebUI può connettersi con lo stesso URL di base e token.

## Esempi

Sessione stabile per una conversazione dell'app:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

Riutilizza lo stesso valore `user` nelle chiamate successive relative a tale conversazione per continuare la stessa sessione dell'agente.

Senza streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Con streaming:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Elenca i modelli:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Recupera un modello:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Crea incorporamenti:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

`/v1/embeddings` supporta `input` come stringa o array di stringhe.

## Contenuti correlati

- [Riferimento della configurazione](/it/gateway/configuration-reference)
- [Ambiti dell'operatore](/it/gateway/operator-scopes)
- [OpenAI](/it/providers/openai)
