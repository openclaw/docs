---
read_when:
    - Integrazione di strumenti che si aspettano OpenAI Chat Completions
summary: Esporre dal Gateway un endpoint HTTP /v1/chat/completions compatibile con OpenAI
title: Completamenti chat OpenAI
x-i18n:
    generated_at: "2026-05-11T20:29:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71e25fc1299754ebc65d3998834dc5e9c03acfbd005387aef96f946be1d04a1
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

Sotto il cofano, le richieste vengono eseguite come una normale esecuzione dell'agente del Gateway (lo stesso codepath di `openclaw agent`), quindi routing/permessi/configurazione corrispondono al tuo Gateway.

## Autenticazione

Usa la configurazione di autenticazione del Gateway.

Percorsi comuni di autenticazione HTTP:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticazione HTTP attendibile con identità (`gateway.auth.mode="trusted-proxy"`):
  instrada tramite il proxy configurato consapevole dell'identità e lascia che inserisca gli
  header di identità richiesti
- autenticazione aperta su ingress privato (`gateway.auth.mode="none"`):
  nessun header di autenticazione richiesto

Note:

- Quando `gateway.auth.mode="token"`, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, la richiesta HTTP deve provenire da una
  sorgente proxy attendibile configurata; i proxy loopback sullo stesso host richiedono esplicitamente
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Se `gateway.auth.rateLimit` è configurato e si verificano troppi errori di autenticazione, l'endpoint restituisce `429` con `Retry-After`.

## Confine di sicurezza (importante)

Tratta questo endpoint come una superficie con **accesso completo da operatore** per l'istanza gateway.

- L'autenticazione bearer HTTP qui non è un modello a scope ristretto per utente.
- Un token/password Gateway valido per questo endpoint deve essere trattato come una credenziale owner/operatore.
- Le richieste passano attraverso lo stesso percorso agente del piano di controllo delle azioni di operatore attendibili.
- Non esiste un confine separato degli strumenti non-owner/per utente su questo endpoint; una volta che un chiamante supera qui l'autenticazione Gateway, OpenClaw tratta quel chiamante come un operatore attendibile per questo gateway.
- Per le modalità di autenticazione con segreto condiviso (`token` e `password`), l'endpoint ripristina i normali valori predefiniti di operatore completo anche se il chiamante invia un header `x-openclaw-scopes` più ristretto.
- Le modalità HTTP attendibili con identità (per esempio autenticazione trusted proxy o `gateway.auth.mode="none"`) rispettano `x-openclaw-scopes` quando presente e altrimenti ricadono sul normale insieme di scope predefinito dell'operatore.
- Se la policy dell'agente target consente strumenti sensibili, questo endpoint può usarli.
- Mantieni questo endpoint solo su loopback/tailnet/ingress privato; non esporlo direttamente a Internet pubblico.

Matrice di autenticazione:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - dimostra il possesso del segreto operatore gateway condiviso
  - ignora `x-openclaw-scopes` più ristretti
  - ripristina l'insieme completo degli scope operatore predefiniti:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta i turni di chat su questo endpoint come turni owner-sender
- modalità HTTP attendibili con identità (per esempio autenticazione trusted proxy, o `gateway.auth.mode="none"` su ingress privato)
  - autenticano qualche identità attendibile esterna o confine di distribuzione
  - rispettano `x-openclaw-scopes` quando l'header è presente
  - ricadono sul normale insieme di scope predefinito dell'operatore quando l'header è assente
  - perdono la semantica owner solo quando il chiamante restringe esplicitamente gli scope e omette `operator.admin`

Vedi [Sicurezza](/it/gateway/security) e [Accesso remoto](/it/gateway/remote).

## Contratto modello agent-first

OpenClaw tratta il campo OpenAI `model` come un **target agente**, non come un id modello provider grezzo.

- `model: "openclaw"` instrada all'agente predefinito configurato.
- `model: "openclaw/default"` instrada anch'esso all'agente predefinito configurato.
- `model: "openclaw/<agentId>"` instrada a un agente specifico.

Header di richiesta opzionali:

- `x-openclaw-model: <provider/model-or-bare-id>` sovrascrive il modello backend per l'agente selezionato.
- `x-openclaw-agent-id: <agentId>` rimane supportato come override di compatibilità.
- `x-openclaw-session-key: <sessionKey>` controlla completamente il routing della sessione.
- `x-openclaw-message-channel: <channel>` imposta il contesto sintetico del canale di ingress per prompt e policy consapevoli del canale.

Alias di compatibilità ancora accettati:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Abilitare l'endpoint

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

Per impostazione predefinita l'endpoint è **stateless per richiesta** (a ogni chiamata viene generata una nuova chiave di sessione).

Se la richiesta include una stringa OpenAI `user`, il Gateway ne deriva una chiave di sessione stabile, così le chiamate ripetute possono condividere una sessione agente.

## Perché questa superficie è importante

Questo è l'insieme di compatibilità a più alto impatto per frontend e strumenti self-hosted:

- La maggior parte delle configurazioni Open WebUI, LobeChat e LibreChat si aspetta `/v1/models`.
- Molti sistemi RAG si aspettano `/v1/embeddings`.
- I client di chat OpenAI esistenti di solito possono iniziare con `/v1/chat/completions`.
- Sempre più client più nativi per agenti preferiscono `/v1/responses`.

## Elenco modelli e routing degli agenti

<AccordionGroup>
  <Accordion title="Cosa restituisce `/v1/models`?">
    Un elenco di target agente OpenClaw.

    Gli id restituiti sono voci `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
    Usali direttamente come valori OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` elenca agenti o sub-agenti?">
    Elenca target agente di primo livello, non modelli provider backend e non sub-agenti.

    I sub-agenti restano topologia di esecuzione interna. Non compaiono come pseudo-modelli.

  </Accordion>
  <Accordion title="Perché è incluso `openclaw/default`?">
    `openclaw/default` è l'alias stabile per l'agente predefinito configurato.

    Questo significa che i client possono continuare a usare un id prevedibile anche se il vero id dell'agente predefinito cambia tra ambienti.

  </Accordion>
  <Accordion title="Come sovrascrivo il modello backend?">
    Usa `x-openclaw-model`.

    Esempi:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Se lo ometti, l'agente selezionato viene eseguito con la sua normale scelta di modello configurata.

  </Accordion>
  <Accordion title="Come si inseriscono gli embeddings in questo contratto?">
    `/v1/embeddings` usa gli stessi id `model` dei target agente.

    Usa `model: "openclaw/default"` o `model: "openclaw/<agentId>"`.
    Quando ti serve un modello embedding specifico, invialo in `x-openclaw-model`.
    Senza quell'header, la richiesta passa alla normale configurazione embedding dell'agente selezionato.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Imposta `stream: true` per ricevere Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Ogni riga evento è `data: <json>`
- Lo stream termina con `data: [DONE]`

## Contratto degli strumenti di chat

`/v1/chat/completions` supporta un sottoinsieme di function-tool compatibile con i comuni client OpenAI Chat.

### Campi di richiesta supportati

- `tools`: array di `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- turni di follow-up `messages[*].role: "tool"`
- `messages[*].tool_call_id` per collegare i risultati degli strumenti a una chiamata strumento precedente

### Varianti non supportate

L'endpoint restituisce `400 invalid_request_error` per varianti di strumenti non supportate, incluse:

- `tools` non array
- voci strumento non function
- `tool.function.name` mancante
- varianti di `tool_choice` come `allowed_tools` e `custom`
- `tool_choice: "required"` (non ancora applicato a runtime; sarà supportato una volta implementata l'applicazione rigida)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (stessa motivazione di `required`)
- valori `tool_choice.function.name` che non corrispondono ai `tools` forniti

### Forma della risposta strumento non streaming

Quando l'agente decide di chiamare strumenti, la risposta usa:

- `choices[0].finish_reason = "tool_calls"`
- voci `choices[0].message.tool_calls[]` con:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (stringa JSON)

Il commento dell'assistente prima della chiamata strumento viene restituito in `choices[0].message.content` (eventualmente vuoto).

### Forma della risposta strumento streaming

Quando `stream: true`, le chiamate strumento vengono emesse come chunk SSE incrementali:

- delta iniziale del ruolo assistente
- delta opzionali del commento dell'assistente
- uno o più chunk `delta.tool_calls` che trasportano identità dello strumento e frammenti di argomenti
- chunk finale con `finish_reason: "tool_calls"`
- `data: [DONE]`

Se `stream_options.include_usage=true`, viene emesso un chunk finale di usage prima di `[DONE]`.

### Loop di follow-up degli strumenti

Dopo aver ricevuto `tool_calls`, il client deve eseguire le function richieste e inviare una richiesta di follow-up che includa:

- messaggio precedente dell'assistente con chiamata strumento
- uno o più messaggi `role: "tool"` con `tool_call_id` corrispondente

Questo consente all'esecuzione dell'agente gateway di continuare lo stesso loop di ragionamento e produrre la risposta finale dell'assistente.

## Configurazione rapida di Open WebUI

Per una connessione Open WebUI di base:

- URL di base: `http://127.0.0.1:18789/v1`
- URL di base Docker su macOS: `http://host.docker.internal:18789/v1`
- Chiave API: il tuo token bearer Gateway
- Modello: `openclaw/default`

Comportamento previsto:

- `GET /v1/models` deve elencare `openclaw/default`
- Open WebUI deve usare `openclaw/default` come id modello di chat
- Se vuoi uno specifico provider/modello backend per quell'agente, imposta il normale modello predefinito dell'agente o invia `x-openclaw-model`

Smoke rapido:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Se restituisce `openclaw/default`, la maggior parte delle configurazioni Open WebUI può connettersi con lo stesso URL di base e token.

## Esempi

Non streaming:

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

Elenca modelli:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Recupera un modello:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Crea embeddings:

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

- `/v1/models` restituisce target agente OpenClaw, non cataloghi provider grezzi.
- `openclaw/default` è sempre presente, quindi un id stabile funziona tra ambienti.
- Gli override di provider/modello backend appartengono a `x-openclaw-model`, non al campo OpenAI `model`.
- `/v1/embeddings` supporta `input` come stringa o array di stringhe.

## Correlati

- [Riferimento di configurazione](/it/gateway/configuration-reference)
- [OpenAI](/it/providers/openai)
