---
read_when:
    - Integrazione di strumenti che si aspettano OpenAI Chat Completions
summary: Esporre dal Gateway un endpoint HTTP /v1/chat/completions compatibile con OpenAI
title: Completamenti chat di OpenAI
x-i18n:
    generated_at: "2026-06-27T17:33:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Il Gateway di OpenClaw può servire un piccolo endpoint Chat Completions compatibile con OpenAI.

Questo endpoint è **disabilitato per impostazione predefinita**. Abilitalo prima nella configurazione.

- `POST /v1/chat/completions`
- Stessa porta del Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Quando la superficie HTTP compatibile con OpenAI del Gateway è abilitata, serve anche:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Sotto il cofano, le richieste vengono eseguite come una normale esecuzione dell'agente Gateway (stesso percorso di codice di `openclaw agent`), quindi routing/permessi/configurazione corrispondono al tuo Gateway.

## Autenticazione

Usa la configurazione di autenticazione del Gateway.

Percorsi comuni di autenticazione HTTP:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticazione HTTP con identità attendibile (`gateway.auth.mode="trusted-proxy"`):
  instrada tramite il proxy configurato consapevole dell'identità e lascia che inserisca gli
  header di identità richiesti
- autenticazione aperta su ingresso privato (`gateway.auth.mode="none"`):
  nessun header di autenticazione richiesto

Note:

- Quando `gateway.auth.mode="token"`, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, la richiesta HTTP deve provenire da una
  sorgente proxy attendibile configurata; i proxy loopback sullo stesso host richiedono
  `gateway.auth.trustedProxy.allowLoopback = true` esplicito.
- I chiamanti interni sullo stesso host che bypassano il proxy possono usare
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` come fallback diretto locale.
  Qualsiasi evidenza negli header `Forwarded`, `X-Forwarded-*` o `X-Real-IP`
  mantiene invece la richiesta sul percorso trusted-proxy.
- Se `gateway.auth.rateLimit` è configurato e si verificano troppi errori di autenticazione, l'endpoint restituisce `429` con `Retry-After`.

## Confine di sicurezza (importante)

Tratta questo endpoint come una superficie con **accesso completo da operatore** per l'istanza del gateway.

- L'autenticazione bearer HTTP qui non è un modello con ambito ristretto per utente.
- Un token/password Gateway valido per questo endpoint deve essere trattato come una credenziale proprietario/operatore.
- Le richieste passano attraverso lo stesso percorso agente del piano di controllo delle azioni operatore attendibili.
- Non esiste un confine strumenti separato non proprietario/per utente su questo endpoint; una volta che un chiamante supera qui l'autenticazione Gateway, OpenClaw tratta quel chiamante come operatore attendibile per questo gateway.
- Per le modalità di autenticazione con segreto condiviso (`token` e `password`), l'endpoint ripristina le normali impostazioni predefinite complete dell'operatore anche se il chiamante invia un header `x-openclaw-scopes` più ristretto.
- Le modalità HTTP con identità attendibile (per esempio autenticazione tramite proxy attendibile o `gateway.auth.mode="none"`) rispettano `x-openclaw-scopes` quando presente e altrimenti ripiegano sul normale insieme di ambiti predefinito dell'operatore.
- Se la policy dell'agente di destinazione consente strumenti sensibili, questo endpoint può usarli.
- Mantieni questo endpoint solo su loopback/tailnet/ingresso privato; non esporlo direttamente a internet pubblico.

Matrice di autenticazione:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - prova il possesso del segreto operatore condiviso del gateway
  - ignora `x-openclaw-scopes` più ristretto
  - ripristina l'insieme completo degli ambiti operatore predefiniti:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta i turni chat su questo endpoint come turni inviati dal proprietario
- modalità HTTP con identità attendibile (per esempio autenticazione tramite proxy attendibile, o `gateway.auth.mode="none"` su ingresso privato)
  - autenticano un'identità attendibile esterna o un confine di distribuzione
  - rispettano `x-openclaw-scopes` quando l'header è presente
  - ripiegano sul normale insieme di ambiti predefinito dell'operatore quando l'header è assente
  - perdono la semantica di proprietario solo quando il chiamante restringe esplicitamente gli ambiti e omette `operator.admin`
  - richiedono `operator.admin` per controlli di richiesta a livello proprietario come `x-openclaw-model`

Vedi [Sicurezza](/it/gateway/security) e [Accesso remoto](/it/gateway/remote).

## Quando usare questo endpoint

Usa `/v1/chat/completions` quando stai integrando strumenti o un backend lato app attendibile con un gateway esistente e puoi conservare in modo sicuro le credenziali operatore del gateway.

- Preferiscilo all'aggiunta di un nuovo canale integrato quando la tua integrazione è solo un'altra superficie operatore/client per lo stesso gateway.
- Per client mobili nativi che si connettono direttamente a un gateway remoto, preferisci [WebChat](/it/web/webchat) o il [Protocollo Gateway](/it/gateway/protocol) e implementa il flusso bootstrap dispositivo associato/token dispositivo, così il dispositivo non ha bisogno di un token/password HTTP condiviso.
- Crea invece un Plugin di canale quando stai integrando una rete di messaggistica esterna con i propri utenti, stanze, consegna Webhook o trasporto in uscita. Vedi [Creazione di plugin](/it/plugins/building-plugins).

## Contratto modello agent-first

OpenClaw tratta il campo `model` di OpenAI come una **destinazione agente**, non come un id modello provider grezzo.

- `model: "openclaw"` instrada all'agente predefinito configurato.
- `model: "openclaw/default"` instrada anch'esso all'agente predefinito configurato.
- `model: "openclaw/<agentId>"` instrada a un agente specifico.

Header di richiesta opzionali:

- `x-openclaw-model: <provider/model-or-bare-id>` sovrascrive il modello backend per l'agente selezionato. I chiamanti bearer con segreto condiviso possono usare questo header. I chiamanti con identità, come richieste trusted-proxy o ingresso privato senza autenticazione con `x-openclaw-scopes`, necessitano di `operator.admin`; i chiamanti in sola scrittura ricevono `403 missing scope: operator.admin`.
- `x-openclaw-agent-id: <agentId>` rimane supportato come override di compatibilità.
- `x-openclaw-session-key: <sessionKey>` controlla esplicitamente il routing della sessione. Il valore non deve usare namespace di sessione interni riservati come `subagent:`, `cron:` o `acp:`; tali richieste vengono rifiutate con `400 invalid_request_error`.
- `x-openclaw-message-channel: <channel>` imposta il contesto sintetico del canale di ingresso per prompt e policy consapevoli del canale.

Alias di compatibilità ancora accettati:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Abilitazione dell'endpoint

Imposta `gateway.http.endpoints.chatCompletions.enabled` su `true`:

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

## Disabilitare l'endpoint

Imposta `gateway.http.endpoints.chatCompletions.enabled` su `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Comportamento della sessione

Per impostazione predefinita, l'endpoint è **senza stato per richiesta** (a ogni chiamata viene generata una nuova chiave di sessione).

Se la richiesta include una stringa OpenAI `user`, il Gateway ne deriva una chiave di sessione stabile, così le chiamate ripetute possono condividere una sessione agente.

Per le app personalizzate, l'impostazione predefinita più sicura è riutilizzare lo stesso valore `user` per ogni thread di conversazione. Evita identificatori a livello di account, a meno che tu non voglia esplicitamente che più conversazioni o dispositivi condividano una sessione OpenClaw. Usa `x-openclaw-session-key` solo quando ti serve un controllo esplicito dell'instradamento tra più client o thread e scegli chiavi di proprietà dell'applicazione che non inizino con namespace interni riservati come `subagent:`, `cron:` o `acp:`.

## Perché questa superficie è importante

Questo è il set di compatibilità a maggiore leva per frontend e strumenti self-hosted:

- La maggior parte delle configurazioni Open WebUI, LobeChat e LibreChat si aspetta `/v1/models`.
- Molti sistemi RAG si aspettano `/v1/embeddings`.
- I client di chat OpenAI esistenti possono di solito iniziare con `/v1/chat/completions`.
- I client più nativi per agenti preferiscono sempre più spesso `/v1/responses`.

## Elenco dei modelli e instradamento degli agenti

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    Un elenco OpenClaw di destinazioni agente.

    Gli id restituiti sono voci `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
    Usali direttamente come valori OpenAI `model`.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    Elenca destinazioni agente di primo livello, non modelli provider backend e non sub-agenti.

    I sub-agenti restano una topologia di esecuzione interna. Non compaiono come pseudo-modelli.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` è l'alias stabile per l'agente predefinito configurato.

    Ciò significa che i client possono continuare a usare un id prevedibile anche se l'id reale dell'agente predefinito cambia tra ambienti.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    Usa `x-openclaw-model`. Questa è una sostituzione a livello di proprietario: funziona con il percorso token bearer/password del segreto condiviso del Gateway e richiede `operator.admin` sui percorsi HTTP con identità, come l'autenticazione tramite proxy attendibile.

    Esempi:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Se lo ometti, l'agente selezionato viene eseguito con la sua normale scelta di modello configurata.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` usa gli stessi id `model` di destinazione agente.

    Usa `model: "openclaw/default"` o `model: "openclaw/<agentId>"`.
    Quando ti serve un modello di embedding specifico, invialo in `x-openclaw-model` da un chiamante con segreto condiviso o da un chiamante con identità e `operator.admin`.
    Senza quell'header, la richiesta viene inoltrata alla normale configurazione di embedding dell'agente selezionato.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Imposta `stream: true` per ricevere Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Ogni riga di evento è `data: <json>`
- Lo stream termina con `data: [DONE]`

## Contratto degli strumenti di chat

`/v1/chat/completions` supporta un sottoinsieme di strumenti funzione compatibile con i comuni client OpenAI Chat.

### Campi richiesta supportati

- `tools`: array di `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`, `"required"` oppure `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"` turni di follow-up
- `messages[*].tool_call_id` per collegare i risultati degli strumenti a una chiamata strumento precedente
- `max_completion_tokens`: numero; limite per chiamata per i token di completamento totali (token di ragionamento inclusi). Nome campo corrente di OpenAI Chat Completions; preferito quando vengono inviati sia `max_completion_tokens` sia `max_tokens`.
- `max_tokens`: numero; alias legacy accettato per compatibilità all'indietro. Ignorato quando è presente anche `max_completion_tokens`.
- `temperature`: numero; temperatura di campionamento best-effort inoltrata al provider upstream tramite il canale dei parametri di stream dell'agente.
- `top_p`: numero; campionamento nucleus best-effort inoltrato al provider upstream tramite il canale dei parametri di stream dell'agente.
- `frequency_penalty`: numero; penalità di frequenza best-effort inoltrata al provider upstream tramite il canale dei parametri di stream dell'agente. Intervallo convalidato: da -2.0 a 2.0. Restituisce `400 invalid_request_error` per valori fuori intervallo.
- `presence_penalty`: numero; penalità di presenza best-effort inoltrata al provider upstream tramite il canale dei parametri di stream dell'agente. Intervallo convalidato: da -2.0 a 2.0. Restituisce `400 invalid_request_error` per valori fuori intervallo.
- `seed`: numero (intero); seed best-effort inoltrato al provider upstream tramite il canale dei parametri di stream dell'agente. Restituisce `400 invalid_request_error` per valori non interi.
- `stop`: stringa o array di massimo 4 stringhe; sequenze di stop best-effort inoltrate al provider upstream tramite il canale dei parametri di stream dell'agente. Restituisce `400 invalid_request_error` per più di 4 sequenze o voci non stringa/vuote.

Quando uno dei campi di limite dei token è impostato, il valore viene inoltrato al provider upstream tramite il canale dei parametri di streaming dell'agente. Il nome effettivo del campo wire inviato al provider upstream viene scelto dal trasporto del provider: `max_completion_tokens` per gli endpoint della famiglia OpenAI e `max_tokens` per i provider che accettano solo il nome legacy (come Mistral e Chutes). I campi di campionamento (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) seguono lo stesso canale dei parametri di streaming; il backend Codex Responses basato su ChatGPT li rimuove lato server perché usa un campionamento fisso. Anche `stop` passa attraverso il canale dei parametri di streaming e viene mappato al campo stop del trasporto (`stop` per i backend Chat Completions, `stop_sequences` per Anthropic); l'API OpenAI Responses non ha un parametro stop, quindi `stop` non viene applicato sui modelli basati su Responses.

### Varianti non supportate

L'endpoint restituisce `400 invalid_request_error` per le varianti di strumenti non supportate, incluse:

- `tools` non array
- voci di strumenti non funzione
- `tool.function.name` mancante
- varianti di `tool_choice` come `allowed_tools` e `custom`
- valori di `tool_choice.function.name` che non corrispondono ai `tools` forniti

Per `tool_choice: "required"` e `tool_choice` vincolato a una funzione, l'endpoint restringe l'insieme esposto di strumenti funzione del client, istruisce il runtime a chiamare uno strumento client prima di rispondere e restituisce un errore se la risposta dell'agente non include una chiamata strutturata corrispondente a uno strumento client. Questo contratto si applica all'elenco HTTP `tools` fornito dal chiamante, non a ogni strumento interno dell'agente OpenClaw.

### Forma della risposta degli strumenti non in streaming

Quando l'agente decide di chiamare strumenti, la risposta usa:

- `choices[0].finish_reason = "tool_calls"`
- voci `choices[0].message.tool_calls[]` con:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (stringa JSON)

Il commento dell'assistente prima della chiamata allo strumento viene restituito in `choices[0].message.content` (possibilmente vuoto).

### Forma della risposta degli strumenti in streaming

Quando `stream: true`, le chiamate agli strumenti vengono emesse come chunk SSE incrementali:

- delta iniziale del ruolo dell'assistente
- delta opzionali dei commenti dell'assistente
- uno o più chunk `delta.tool_calls` che trasportano l'identità dello strumento e frammenti degli argomenti
- chunk finale con `finish_reason: "tool_calls"`
- `data: [DONE]`

Se `stream_options.include_usage=true`, viene emesso un chunk di utilizzo finale prima di `[DONE]`.

### Ciclo di follow-up degli strumenti

Dopo aver ricevuto `tool_calls`, il client deve eseguire le funzioni richieste e inviare una richiesta di follow-up che includa:

- messaggio precedente dell'assistente con chiamata allo strumento
- uno o più messaggi `role: "tool"` con `tool_call_id` corrispondente

Questo consente all'esecuzione dell'agente Gateway di continuare lo stesso ciclo di ragionamento e produrre la risposta finale dell'assistente.

## Configurazione rapida di Open WebUI

Per una connessione Open WebUI di base:

- URL di base: `http://127.0.0.1:18789/v1`
- URL di base Docker su macOS: `http://host.docker.internal:18789/v1`
- Chiave API: il tuo token bearer Gateway
- Modello: `openclaw/default`

Comportamento previsto:

- `GET /v1/models` dovrebbe elencare `openclaw/default`
- Open WebUI dovrebbe usare `openclaw/default` come ID del modello di chat
- Se vuoi uno specifico provider/modello backend per quell'agente, imposta il modello predefinito normale dell'agente oppure invia `x-openclaw-model` da un chiamante con segreto condiviso o da un chiamante con identità e `operator.admin`

Smoke test rapido:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Se restituisce `openclaw/default`, la maggior parte delle configurazioni Open WebUI può connettersi con lo stesso URL di base e token.

## Esempi

Sessione stabile per una conversazione di un'app:

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

Riutilizza lo stesso valore `user` nelle chiamate successive per quella conversazione per continuare la stessa sessione dell'agente.

Non in streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

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

Crea embedding:

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

Note:

- `/v1/models` restituisce destinazioni degli agenti OpenClaw, non cataloghi grezzi dei provider.
- `openclaw/default` è sempre presente, quindi un unico ID stabile funziona in tutti gli ambienti.
- Le sostituzioni di provider/modello backend appartengono a `x-openclaw-model`, non al campo OpenAI `model`. Nei percorsi di autenticazione HTTP con identità, questa intestazione richiede `operator.admin`.
- `/v1/embeddings` supporta `input` come stringa o array di stringhe.

## Correlati

- [Riferimento alla configurazione](/it/gateway/configuration-reference)
- [OpenAI](/it/providers/openai)
