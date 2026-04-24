---
read_when:
    - Integrare strumenti che si aspettano Chat Completions OpenAI-compatible
summary: Esporre un endpoint HTTP OpenAI-compatibile `/v1/chat/completions` dal Gateway
title: Completamenti chat OpenAI-compatible
x-i18n:
    generated_at: "2026-04-24T08:41:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55f581d56edbc23a8e8a6f8f1c5960db46042991abb3ee4436f477abafde2926
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# Chat Completions OpenAI-compatible (HTTP)

Il Gateway di OpenClaw può servire un piccolo endpoint Chat Completions OpenAI-compatible.

Questo endpoint è **disabilitato per impostazione predefinita**. Abilitalo prima nella configurazione.

- `POST /v1/chat/completions`
- Stessa porta del Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Quando la superficie HTTP OpenAI-compatible del Gateway è abilitata, serve anche:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Internamente, le richieste vengono eseguite come una normale esecuzione agente del Gateway (stesso codepath di `openclaw agent`), quindi instradamento/permessi/configurazione corrispondono al tuo Gateway.

## Autenticazione

Usa la configurazione di autenticazione del Gateway.

Percorsi comuni di autenticazione HTTP:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` oppure `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticazione HTTP trusted con identità (`gateway.auth.mode="trusted-proxy"`):
  instrada tramite il proxy identity-aware configurato e lascia che inietti le
  intestazioni di identità richieste
- autenticazione aperta su ingresso privato (`gateway.auth.mode="none"`):
  nessuna intestazione di autenticazione richiesta

Note:

- Quando `gateway.auth.mode="token"`, usa `gateway.auth.token` (oppure `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, usa `gateway.auth.password` (oppure `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, la richiesta HTTP deve provenire da una
  sorgente trusted proxy non loopback configurata; i proxy loopback sullo stesso host
  non soddisfano questa modalità.
- Se `gateway.auth.rateLimit` è configurato e si verificano troppi fallimenti di autenticazione, l’endpoint restituisce `429` con `Retry-After`.

## Confine di sicurezza (importante)

Tratta questo endpoint come una superficie di **accesso completo da operatore** per l’istanza gateway.

- L’autenticazione bearer HTTP qui non è un modello ristretto di scope per utente.
- Un token/password Gateway valido per questo endpoint deve essere trattato come una credenziale di proprietario/operatore.
- Le richieste passano attraverso lo stesso percorso agente del control plane delle azioni di operatori trusted.
- Non esiste un confine separato strumenti non-proprietario/per-utente su questo endpoint; una volta che un chiamante supera qui l’autenticazione del Gateway, OpenClaw tratta quel chiamante come operatore trusted per questo gateway.
- Per le modalità di autenticazione con segreto condiviso (`token` e `password`), l’endpoint ripristina i normali valori predefiniti completi da operatore anche se il chiamante invia un’intestazione `x-openclaw-scopes` più ristretta.
- Le modalità HTTP trusted con identità (per esempio autenticazione trusted proxy oppure `gateway.auth.mode="none"`) rispettano `x-openclaw-scopes` quando presente e altrimenti usano come fallback il normale insieme di scope predefiniti da operatore.
- Se la policy dell’agente di destinazione consente strumenti sensibili, questo endpoint può usarli.
- Mantieni questo endpoint solo su loopback/tailnet/ingresso privato; non esporlo direttamente a Internet pubblico.

Matrice di autenticazione:

- `gateway.auth.mode="token"` oppure `"password"` + `Authorization: Bearer ...`
  - prova il possesso del segreto operatore condiviso del gateway
  - ignora `x-openclaw-scopes` più ristrette
  - ripristina l’insieme completo di scope predefiniti da operatore:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta i turni chat su questo endpoint come turni mittente proprietario
- modalità HTTP trusted con identità (per esempio autenticazione trusted proxy, oppure `gateway.auth.mode="none"` su ingresso privato)
  - autenticano un’identità esterna trusted o un confine di deployment
  - rispettano `x-openclaw-scopes` quando l’intestazione è presente
  - usano come fallback il normale insieme di scope predefiniti da operatore quando l’intestazione è assente
  - perdono la semantica proprietario solo quando il chiamante restringe esplicitamente gli scope e omette `operator.admin`

Vedi [Security](/it/gateway/security) e [Accesso remoto](/it/gateway/remote).

## Contratto modello agent-first

OpenClaw tratta il campo OpenAI `model` come una **destinazione agente**, non come un ID modello provider grezzo.

- `model: "openclaw"` instrada verso l’agente predefinito configurato.
- `model: "openclaw/default"` instrada anch’esso verso l’agente predefinito configurato.
- `model: "openclaw/<agentId>"` instrada verso un agente specifico.

Intestazioni di richiesta opzionali:

- `x-openclaw-model: <provider/model-or-bare-id>` sostituisce il modello backend per l’agente selezionato.
- `x-openclaw-agent-id: <agentId>` resta supportato come override di compatibilità.
- `x-openclaw-session-key: <sessionKey>` controlla completamente l’instradamento della sessione.
- `x-openclaw-message-channel: <channel>` imposta il contesto sintetico del canale di ingresso per prompt e policy sensibili al canale.

Alias di compatibilità ancora accettati:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Abilitare l’endpoint

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

## Disabilitare l’endpoint

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

Per impostazione predefinita l’endpoint è **stateless per richiesta** (a ogni chiamata viene generata una nuova chiave di sessione).

Se la richiesta include una stringa OpenAI `user`, il Gateway deriva da essa una chiave di sessione stabile, così le chiamate ripetute possono condividere una sessione agente.

## Perché questa superficie è importante

Questo è l’insieme di compatibilità con il miglior rapporto utilità/impatto per frontend e strumenti self-hosted:

- La maggior parte delle configurazioni Open WebUI, LobeChat e LibreChat si aspetta `/v1/models`.
- Molti sistemi RAG si aspettano `/v1/embeddings`.
- I client chat OpenAI esistenti possono di solito iniziare con `/v1/chat/completions`.
- I client più nativi per agenti preferiscono sempre più `/v1/responses`.

## Elenco modelli e instradamento degli agenti

<AccordionGroup>
  <Accordion title="Che cosa restituisce `/v1/models`?">
    Un elenco di destinazioni agente OpenClaw.

    Gli ID restituiti sono `openclaw`, `openclaw/default` e voci `openclaw/<agentId>`.
    Usali direttamente come valori OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` elenca agenti o subagenti?">
    Elenca destinazioni di agenti di primo livello, non modelli backend dei provider e non subagenti.

    I subagenti restano topologia di esecuzione interna. Non compaiono come pseudo-modelli.

  </Accordion>
  <Accordion title="Perché è incluso `openclaw/default`?">
    `openclaw/default` è l’alias stabile per l’agente predefinito configurato.

    Questo significa che i client possono continuare a usare un ID prevedibile anche se il vero ID dell’agente predefinito cambia tra ambienti diversi.

  </Accordion>
  <Accordion title="Come posso sostituire il modello backend?">
    Usa `x-openclaw-model`.

    Esempi:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Se lo ometti, l’agente selezionato viene eseguito con la sua normale scelta di modello configurata.

  </Accordion>
  <Accordion title="Come si inseriscono gli embeddings in questo contratto?">
    `/v1/embeddings` usa gli stessi ID `model` di destinazione agente.

    Usa `model: "openclaw/default"` oppure `model: "openclaw/<agentId>"`.
    Quando ti serve un modello di embedding specifico, invialo in `x-openclaw-model`.
    Senza quell’intestazione, la richiesta passa alla normale configurazione di embedding dell’agente selezionato.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Imposta `stream: true` per ricevere Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Ogni riga evento è `data: <json>`
- Lo stream termina con `data: [DONE]`

## Configurazione rapida Open WebUI

Per una connessione Open WebUI di base:

- URL base: `http://127.0.0.1:18789/v1`
- URL base Docker su macOS: `http://host.docker.internal:18789/v1`
- Chiave API: il tuo token bearer Gateway
- Modello: `openclaw/default`

Comportamento atteso:

- `GET /v1/models` dovrebbe elencare `openclaw/default`
- Open WebUI dovrebbe usare `openclaw/default` come ID modello chat
- Se vuoi uno specifico provider/modello backend per quell’agente, imposta il normale modello predefinito dell’agente oppure invia `x-openclaw-model`

Smoke test rapido:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Se questo restituisce `openclaw/default`, la maggior parte delle configurazioni Open WebUI può connettersi con lo stesso URL base e token.

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

Elencare i modelli:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Recuperare un modello:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Creare embeddings:

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

- `/v1/models` restituisce destinazioni agente OpenClaw, non cataloghi provider grezzi.
- `openclaw/default` è sempre presente così un ID stabile funziona in tutti gli ambienti.
- Gli override del provider/modello backend appartengono a `x-openclaw-model`, non al campo OpenAI `model`.
- `/v1/embeddings` supporta `input` come stringa o array di stringhe.

## Correlati

- [Riferimento della configurazione](/it/gateway/configuration-reference)
- [OpenAI](/it/providers/openai)
