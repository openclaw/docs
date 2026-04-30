---
read_when:
    - Integrare strumenti che si aspettano OpenAI Chat Completions
summary: Esporre un endpoint HTTP /v1/chat/completions compatibile con OpenAI dal Gateway
title: Completamenti chat OpenAI
x-i18n:
    generated_at: "2026-04-30T08:53:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a19f9d9d6d8ce6d605f8af5324ae3eb0c100c167609341c8dfb569970b0b2c9
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

Dietro le quinte, le richieste vengono eseguite come una normale esecuzione di agente del Gateway (stesso percorso di codice di `openclaw agent`), quindi routing/autorizzazioni/configurazione corrispondono al tuo Gateway.

## Autenticazione

Usa la configurazione di autenticazione del Gateway.

Percorsi comuni di autenticazione HTTP:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticazione HTTP con identità attendibile (`gateway.auth.mode="trusted-proxy"`):
  instrada tramite il proxy configurato consapevole dell'identità e lascia che inietti gli
  header di identità richiesti
- autenticazione aperta su ingresso privato (`gateway.auth.mode="none"`):
  nessun header di autenticazione richiesto

Note:

- Quando `gateway.auth.mode="token"`, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, la richiesta HTTP deve provenire da una
  sorgente proxy attendibile configurata; i proxy local loopback sullo stesso host richiedono
  `gateway.auth.trustedProxy.allowLoopback = true` esplicito.
- Se `gateway.auth.rateLimit` è configurato e si verificano troppi errori di autenticazione, l'endpoint restituisce `429` con `Retry-After`.

## Confine di sicurezza (importante)

Tratta questo endpoint come una superficie con **accesso completo da operatore** per l'istanza Gateway.

- L'autenticazione bearer HTTP qui non è un modello ristretto con ambito per utente.
- Un token/password valido del Gateway per questo endpoint deve essere trattato come credenziale owner/operatore.
- Le richieste passano attraverso lo stesso percorso di agente del piano di controllo delle azioni attendibili dell'operatore.
- Non esiste un confine separato per strumenti non-owner/per utente su questo endpoint; una volta che un chiamante supera l'autenticazione del Gateway qui, OpenClaw tratta quel chiamante come operatore attendibile per questo gateway.
- Per le modalità di autenticazione con segreto condiviso (`token` e `password`), l'endpoint ripristina i normali valori predefiniti da operatore completo anche se il chiamante invia un header `x-openclaw-scopes` più ristretto.
- Le modalità HTTP con identità attendibile (per esempio autenticazione trusted proxy o `gateway.auth.mode="none"`) rispettano `x-openclaw-scopes` quando presente e altrimenti ripiegano sul normale set di ambiti predefinito da operatore.
- Se la policy dell'agente di destinazione consente strumenti sensibili, questo endpoint può usarli.
- Mantieni questo endpoint solo su local loopback/tailnet/ingresso privato; non esporlo direttamente a Internet pubblico.

Matrice di autenticazione:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - dimostra il possesso del segreto condiviso dell'operatore Gateway
  - ignora `x-openclaw-scopes` più ristretto
  - ripristina il set completo di ambiti predefiniti dell'operatore:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta i turni di chat su questo endpoint come turni owner-sender
- modalità HTTP con identità attendibile (per esempio autenticazione trusted proxy, o `gateway.auth.mode="none"` su ingresso privato)
  - autenticano un'identità attendibile esterna o un confine di distribuzione
  - rispettano `x-openclaw-scopes` quando l'header è presente
  - ripiegano sul normale set di ambiti predefinito dell'operatore quando l'header è assente
  - perdono la semantica owner solo quando il chiamante restringe esplicitamente gli ambiti e omette `operator.admin`

Vedi [Sicurezza](/it/gateway/security) e [Accesso remoto](/it/gateway/remote).

## Contratto modello agent-first

OpenClaw tratta il campo OpenAI `model` come una **destinazione agente**, non come un id grezzo di modello provider.

- `model: "openclaw"` instrada all'agente predefinito configurato.
- `model: "openclaw/default"` instrada anche all'agente predefinito configurato.
- `model: "openclaw/<agentId>"` instrada a un agente specifico.

Header di richiesta opzionali:

- `x-openclaw-model: <provider/model-or-bare-id>` sovrascrive il modello backend per l'agente selezionato.
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

Per impostazione predefinita l'endpoint è **stateless per richiesta** (a ogni chiamata viene generata una nuova chiave di sessione).

Se la richiesta include una stringa OpenAI `user`, il Gateway ne deriva una chiave di sessione stabile, quindi chiamate ripetute possono condividere una sessione agente.

## Perché questa superficie è importante

Questo è il set di compatibilità a più alta leva per frontend e strumenti self-hosted:

- La maggior parte delle configurazioni Open WebUI, LobeChat e LibreChat si aspetta `/v1/models`.
- Molti sistemi RAG si aspettano `/v1/embeddings`.
- I client chat OpenAI esistenti di solito possono iniziare con `/v1/chat/completions`.
- Client più agent-native preferiscono sempre più `/v1/responses`.

## Elenco modelli e routing degli agenti

<AccordionGroup>
  <Accordion title="Cosa restituisce `/v1/models`?">
    Un elenco di destinazioni agente OpenClaw.

    Gli id restituiti sono voci `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
    Usali direttamente come valori OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` elenca agenti o sotto-agenti?">
    Elenca destinazioni agente di primo livello, non modelli del provider backend e non sotto-agenti.

    I sotto-agenti rimangono una topologia di esecuzione interna. Non compaiono come pseudo-modelli.

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
    Quando ti serve un modello embedding specifico, invialo in `x-openclaw-model`.
    Senza quell'header, la richiesta passa alla normale configurazione embedding dell'agente selezionato.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Imposta `stream: true` per ricevere Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Ogni riga di evento è `data: <json>`
- Lo stream termina con `data: [DONE]`

## Configurazione rapida di Open WebUI

Per una connessione Open WebUI di base:

- URL di base: `http://127.0.0.1:18789/v1`
- URL di base Docker su macOS: `http://host.docker.internal:18789/v1`
- Chiave API: il tuo token bearer Gateway
- Modello: `openclaw/default`

Comportamento previsto:

- `GET /v1/models` dovrebbe elencare `openclaw/default`
- Open WebUI dovrebbe usare `openclaw/default` come id del modello chat
- Se vuoi un provider/modello backend specifico per quell'agente, imposta il normale modello predefinito dell'agente o invia `x-openclaw-model`

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

- `/v1/models` restituisce destinazioni agente OpenClaw, non cataloghi grezzi dei provider.
- `openclaw/default` è sempre presente, quindi un id stabile funziona tra ambienti.
- Gli override di provider/modello backend appartengono a `x-openclaw-model`, non al campo OpenAI `model`.
- `/v1/embeddings` supporta `input` come stringa o array di stringhe.

## Correlati

- [Riferimento configurazione](/it/gateway/configuration-reference)
- [OpenAI](/it/providers/openai)
