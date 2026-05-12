---
read_when:
    - Integrazione di strumenti che si aspettano OpenAI Chat Completions
summary: Esporre un endpoint HTTP /v1/chat/completions compatibile con OpenAI dal Gateway
title: Completamenti chat OpenAI
x-i18n:
    generated_at: "2026-05-12T15:43:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
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

Sotto il cofano, le richieste vengono eseguite come una normale esecuzione dell'agente Gateway (lo stesso percorso di codice di `openclaw agent`), quindi routing/permessi/configurazione corrispondono al tuo Gateway.

## Autenticazione

Usa la configurazione di autenticazione del Gateway.

Percorsi comuni di autenticazione HTTP:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticazione HTTP attendibile con identità (`gateway.auth.mode="trusted-proxy"`):
  inoltra attraverso il proxy configurato consapevole dell'identità e lascia che inserisca gli
  header di identità richiesti
- autenticazione aperta su ingresso privato (`gateway.auth.mode="none"`):
  nessun header di autenticazione richiesto

Note:

- Quando `gateway.auth.mode="token"`, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, la richiesta HTTP deve provenire da una
  sorgente proxy attendibile configurata; i proxy di loopback sullo stesso host richiedono
  `gateway.auth.trustedProxy.allowLoopback = true` esplicito.
- Se `gateway.auth.rateLimit` è configurato e si verificano troppi errori di autenticazione, l'endpoint restituisce `429` con `Retry-After`.

## Confine di sicurezza (importante)

Tratta questo endpoint come una superficie di **accesso completo da operatore** per l'istanza gateway.

- L'autenticazione bearer HTTP qui non è un modello di ambito ristretto per utente.
- Un token/password Gateway valido per questo endpoint deve essere trattato come una credenziale owner/operatore.
- Le richieste passano attraverso lo stesso percorso agente del piano di controllo delle azioni operatore attendibili.
- Non esiste un confine strumenti separato non-owner/per utente su questo endpoint; una volta che un chiamante supera qui l'autenticazione Gateway, OpenClaw tratta quel chiamante come operatore attendibile per questo gateway.
- Per le modalità di autenticazione con segreto condiviso (`token` e `password`), l'endpoint ripristina i normali valori predefiniti completi da operatore anche se il chiamante invia un header `x-openclaw-scopes` più ristretto.
- Le modalità HTTP attendibili con identità (ad esempio autenticazione tramite proxy attendibile o `gateway.auth.mode="none"`) rispettano `x-openclaw-scopes` quando presente e altrimenti ripiegano sul normale insieme di ambiti predefinito da operatore.
- Se la policy dell'agente di destinazione consente strumenti sensibili, questo endpoint può usarli.
- Mantieni questo endpoint solo su loopback/tailnet/ingresso privato; non esporlo direttamente a Internet pubblico.

Matrice di autenticazione:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - prova il possesso del segreto condiviso dell'operatore gateway
  - ignora `x-openclaw-scopes` più ristretti
  - ripristina l'intero insieme di ambiti predefinito da operatore:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta i turni chat su questo endpoint come turni inviati dall'owner
- modalità HTTP attendibili con identità (ad esempio autenticazione tramite proxy attendibile, o `gateway.auth.mode="none"` su ingresso privato)
  - autenticano un'identità attendibile esterna o un confine di deployment
  - rispettano `x-openclaw-scopes` quando l'header è presente
  - ripiegano sul normale insieme di ambiti predefinito da operatore quando l'header è assente
  - perdono la semantica owner solo quando il chiamante restringe esplicitamente gli ambiti e omette `operator.admin`

Vedi [Sicurezza](/it/gateway/security) e [Accesso remoto](/it/gateway/remote).

## Contratto del modello agent-first

OpenClaw tratta il campo OpenAI `model` come una **destinazione agente**, non come un id grezzo di modello provider.

- `model: "openclaw"` indirizza all'agente predefinito configurato.
- `model: "openclaw/default"` indirizza anch'esso all'agente predefinito configurato.
- `model: "openclaw/<agentId>"` indirizza a un agente specifico.

Header di richiesta opzionali:

- `x-openclaw-model: <provider/model-or-bare-id>` sostituisce il modello backend per l'agente selezionato.
- `x-openclaw-agent-id: <agentId>` resta supportato come override di compatibilità.
- `x-openclaw-session-key: <sessionKey>` controlla completamente il routing della sessione.
- `x-openclaw-message-channel: <channel>` imposta il contesto sintetico del canale di ingresso per prompt e policy consapevoli del canale.

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

Per impostazione predefinita l'endpoint è **senza stato per richiesta** (a ogni chiamata viene generata una nuova chiave di sessione).

Se la richiesta include una stringa OpenAI `user`, il Gateway deriva da essa una chiave di sessione stabile, quindi chiamate ripetute possono condividere una sessione agente.

## Perché questa superficie è importante

Questo è l'insieme di compatibilità con maggiore leva per frontend e tooling self-hosted:

- La maggior parte delle configurazioni Open WebUI, LobeChat e LibreChat si aspetta `/v1/models`.
- Molti sistemi RAG si aspettano `/v1/embeddings`.
- I client chat OpenAI esistenti di solito possono iniziare con `/v1/chat/completions`.
- I client più agent-native preferiscono sempre più `/v1/responses`.

## Elenco modelli e routing agente

<AccordionGroup>
  <Accordion title="Che cosa restituisce `/v1/models`?">
    Un elenco di destinazioni agente OpenClaw.

    Gli id restituiti sono voci `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
    Usali direttamente come valori OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` elenca agenti o sotto-agenti?">
    Elenca destinazioni agente di primo livello, non modelli provider backend e non sotto-agenti.

    I sotto-agenti rimangono topologia di esecuzione interna. Non appaiono come pseudo-modelli.

  </Accordion>
  <Accordion title="Perché è incluso `openclaw/default`?">
    `openclaw/default` è l'alias stabile per l'agente predefinito configurato.

    Questo significa che i client possono continuare a usare un id prevedibile anche se l'id reale dell'agente predefinito cambia tra ambienti.

  </Accordion>
  <Accordion title="Come sovrascrivo il modello backend?">
    Usa `x-openclaw-model`.

    Esempi:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Se lo ometti, l'agente selezionato viene eseguito con la sua normale scelta di modello configurata.

  </Accordion>
  <Accordion title="Come si inseriscono gli embedding in questo contratto?">
    `/v1/embeddings` usa gli stessi id `model` di destinazione agente.

    Usa `model: "openclaw/default"` o `model: "openclaw/<agentId>"`.
    Quando hai bisogno di un modello di embedding specifico, invialo in `x-openclaw-model`.
    Senza quell'header, la richiesta passa alla normale configurazione di embedding dell'agente selezionato.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Imposta `stream: true` per ricevere Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Ogni riga evento è `data: <json>`
- Lo stream termina con `data: [DONE]`

## Contratto degli strumenti chat

`/v1/chat/completions` supporta un sottoinsieme di function-tool compatibile con i comuni client Chat OpenAI.

### Campi di richiesta supportati

- `tools`: array di `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- turni di follow-up `messages[*].role: "tool"`
- `messages[*].tool_call_id` per associare i risultati dello strumento a una chiamata strumento precedente
- `max_completion_tokens`: numero; limite per chiamata per i token totali di completamento (token di ragionamento inclusi). Nome del campo corrente di OpenAI Chat Completions; preferito quando vengono inviati sia `max_completion_tokens` sia `max_tokens`.
- `max_tokens`: numero; alias legacy accettato per compatibilità all'indietro. Ignorato quando è presente anche `max_completion_tokens`.

Quando uno dei due campi è impostato, il valore viene inoltrato al provider upstream tramite il canale stream-param dell'agente. Il nome effettivo del campo sul wire inviato al provider upstream viene scelto dal trasporto provider: `max_completion_tokens` per endpoint della famiglia OpenAI e `max_tokens` per provider che accettano solo il nome legacy (come Mistral e Chutes).

### Varianti non supportate

L'endpoint restituisce `400 invalid_request_error` per varianti di strumenti non supportate, incluse:

- `tools` non array
- voci strumento non function
- `tool.function.name` mancante
- varianti `tool_choice` come `allowed_tools` e `custom`
- `tool_choice: "required"` (non ancora applicato a runtime; sarà supportato una volta implementata l'applicazione rigida)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (stessa motivazione di `required`)
- valori `tool_choice.function.name` che non corrispondono ai `tools` forniti

### Forma della risposta strumento non in streaming

Quando l'agente decide di chiamare strumenti, la risposta usa:

- `choices[0].finish_reason = "tool_calls"`
- voci `choices[0].message.tool_calls[]` con:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (stringa JSON)

Il commento dell'assistente prima della chiamata strumento viene restituito in `choices[0].message.content` (possibilmente vuoto).

### Forma della risposta strumento in streaming

Quando `stream: true`, le chiamate strumento vengono emesse come chunk SSE incrementali:

- delta iniziale del ruolo assistant
- delta opzionali del commento dell'assistente
- uno o più chunk `delta.tool_calls` che trasportano identità dello strumento e frammenti di argomenti
- chunk finale con `finish_reason: "tool_calls"`
- `data: [DONE]`

Se `stream_options.include_usage=true`, un chunk finale di utilizzo viene emesso prima di `[DONE]`.

### Ciclo di follow-up degli strumenti

Dopo aver ricevuto `tool_calls`, il client deve eseguire le funzioni richieste e inviare una richiesta di follow-up che includa:

- messaggio precedente dell'assistente con chiamata strumento
- uno o più messaggi `role: "tool"` con `tool_call_id` corrispondente

Questo consente all'esecuzione dell'agente gateway di continuare lo stesso ciclo di ragionamento e produrre la risposta finale dell'assistente.

## Configurazione rapida di Open WebUI

Per una connessione Open WebUI di base:

- URL base: `http://127.0.0.1:18789/v1`
- URL base Docker su macOS: `http://host.docker.internal:18789/v1`
- Chiave API: il tuo token bearer del Gateway
- Modello: `openclaw/default`

Comportamento atteso:

- `GET /v1/models` dovrebbe elencare `openclaw/default`
- Open WebUI dovrebbe usare `openclaw/default` come id del modello chat
- Se vuoi un provider/modello backend specifico per quell'agente, imposta il normale modello predefinito dell'agente oppure invia `x-openclaw-model`

Smoke rapido:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Se restituisce `openclaw/default`, la maggior parte delle configurazioni Open WebUI può connettersi con lo stesso URL base e token.

## Esempi

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

- `/v1/models` restituisce i target degli agenti OpenClaw, non i cataloghi grezzi dei provider.
- `openclaw/default` è sempre presente, quindi un ID stabile funziona in tutti gli ambienti.
- Le sovrascritture del provider/modello backend vanno in `x-openclaw-model`, non nel campo OpenAI `model`.
- `/v1/embeddings` supporta `input` come stringa o array di stringhe.

## Correlati

- [Riferimento di configurazione](/it/gateway/configuration-reference)
- [OpenAI](/it/providers/openai)
