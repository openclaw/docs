---
read_when:
    - Integrare strumenti che si aspettano OpenAI Chat Completions
summary: Esporre dal Gateway un endpoint HTTP `/v1/chat/completions` compatibile con OpenAI
title: OpenAI Chat Completions
x-i18n:
    generated_at: "2026-04-05T13:52:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c374b2f32ce693a8c752e2b0a2532c5f0299ed280f9a0e97b1a9d73bcec37b95
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions (HTTP)

Il Gateway di OpenClaw può servire un piccolo endpoint Chat Completions compatibile con OpenAI.

Questo endpoint è **disabilitato per impostazione predefinita**. Abilitalo prima nella configurazione.

- `POST /v1/chat/completions`
- Stessa porta del Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Quando la superficie HTTP compatibile con OpenAI del Gateway è abilitata, serve anche:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Sotto il cofano, le richieste vengono eseguite come una normale esecuzione dell'agente del Gateway (stesso codepath di `openclaw agent`), quindi routing/permessi/configurazione corrispondono al tuo Gateway.

## Autenticazione

Usa la configurazione di autenticazione del Gateway.

Percorsi comuni di autenticazione HTTP:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticazione HTTP fidata con identità (`gateway.auth.mode="trusted-proxy"`):
  instrada attraverso il proxy identity-aware configurato e lascia che inietti gli
  header di identità richiesti
- autenticazione aperta su ingresso privato (`gateway.auth.mode="none"`):
  non è richiesto alcun header di autenticazione

Note:

- Quando `gateway.auth.mode="token"`, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, la richiesta HTTP deve provenire da una
  sorgente trusted proxy non loopback configurata; i proxy loopback sullo stesso host non
  soddisfano questa modalità.
- Se `gateway.auth.rateLimit` è configurato e si verificano troppi errori di autenticazione, l'endpoint restituisce `429` con `Retry-After`.

## Confine di sicurezza (importante)

Tratta questo endpoint come una superficie di **accesso completo da operatore** per l'istanza del gateway.

- L'autenticazione HTTP bearer qui non è un modello a ambito ristretto per utente.
- Un token/password Gateway valido per questo endpoint deve essere trattato come una credenziale da proprietario/operatore.
- Le richieste passano attraverso lo stesso percorso agente del control plane delle azioni fidate dell'operatore.
- Non esiste un confine strumenti separato non-owner/per-user su questo endpoint; una volta che un chiamante supera qui l'autenticazione del Gateway, OpenClaw tratta quel chiamante come un operatore fidato per questo gateway.
- Per le modalità di autenticazione con segreto condiviso (`token` e `password`), l'endpoint ripristina i normali valori predefiniti completi da operatore anche se il chiamante invia un header `x-openclaw-scopes` più restrittivo.
- Le modalità HTTP fidate con identità (`trusted-proxy` o `gateway.auth.mode="none"`, ad esempio) rispettano `x-openclaw-scopes` quando presente e altrimenti ricadono nel normale insieme di scope predefiniti dell'operatore.
- Se la policy dell'agente di destinazione consente strumenti sensibili, questo endpoint può usarli.
- Mantieni questo endpoint solo su loopback/tailnet/ingresso privato; non esporlo direttamente alla internet pubblica.

Matrice di autenticazione:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - dimostra il possesso del segreto condiviso dell'operatore del gateway
  - ignora `x-openclaw-scopes` più restrittivi
  - ripristina l'intero insieme di scope predefiniti dell'operatore:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta i turni di chat su questo endpoint come turni owner-sender
- modalità HTTP fidate con identità (ad esempio autenticazione trusted proxy o `gateway.auth.mode="none"` su ingresso privato)
  - autenticano una qualche identità fidata esterna o un confine di deployment
  - rispettano `x-openclaw-scopes` quando l'header è presente
  - ricadono nel normale insieme di scope predefiniti dell'operatore quando l'header è assente
  - perdono la semantica owner solo quando il chiamante restringe esplicitamente gli scope e omette `operator.admin`

Vedi [Security](/gateway/security) e [Remote access](/gateway/remote).

## Contratto del modello agent-first

OpenClaw tratta il campo OpenAI `model` come una **destinazione agente**, non come un ID grezzo di modello provider.

- `model: "openclaw"` instrada all'agente predefinito configurato.
- `model: "openclaw/default"` instrada anch'esso all'agente predefinito configurato.
- `model: "openclaw/<agentId>"` instrada a un agente specifico.

Header di richiesta facoltativi:

- `x-openclaw-model: <provider/model-or-bare-id>` sovrascrive il modello backend per l'agente selezionato.
- `x-openclaw-agent-id: <agentId>` resta supportato come override di compatibilità.
- `x-openclaw-session-key: <sessionKey>` controlla completamente l'instradamento della sessione.
- `x-openclaw-message-channel: <channel>` imposta il contesto del canale di ingresso sintetico per prompt e policy consapevoli del canale.

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

Se la richiesta include una stringa OpenAI `user`, il Gateway deriva da essa una chiave di sessione stabile, così le chiamate ripetute possono condividere una sessione agente.

## Perché questa superficie è importante

Questo è l'insieme di compatibilità a più alto impatto per frontend e strumenti self-hosted:

- La maggior parte delle configurazioni Open WebUI, LobeChat e LibreChat si aspetta `/v1/models`.
- Molti sistemi RAG si aspettano `/v1/embeddings`.
- I client chat OpenAI esistenti in genere possono iniziare con `/v1/chat/completions`.
- I client più nativi per agenti preferiscono sempre più spesso `/v1/responses`.

## Elenco dei modelli e instradamento degli agenti

<AccordionGroup>
  <Accordion title="Cosa restituisce `/v1/models`?">
    Un elenco di destinazioni agente OpenClaw.

    Gli ID restituiti sono voci `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
    Usali direttamente come valori OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` elenca agenti o sottoagenti?">
    Elenca destinazioni di agenti di primo livello, non modelli provider backend e non sottoagenti.

    I sottoagenti restano topologia di esecuzione interna. Non compaiono come pseudo-modelli.

  </Accordion>
  <Accordion title="Perché è incluso `openclaw/default`?">
    `openclaw/default` è l'alias stabile per l'agente predefinito configurato.

    Questo significa che i client possono continuare a usare un unico ID prevedibile anche se il vero ID dell'agente predefinito cambia tra ambienti.

  </Accordion>
  <Accordion title="Come sovrascrivo il modello backend?">
    Usa `x-openclaw-model`.

    Esempi:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.4`

    Se lo ometti, l'agente selezionato viene eseguito con la sua normale scelta di modello configurata.

  </Accordion>
  <Accordion title="Come si inseriscono gli embeddings in questo contratto?">
    `/v1/embeddings` usa gli stessi ID `model` di destinazione agente.

    Usa `model: "openclaw/default"` o `model: "openclaw/<agentId>"`.
    Quando hai bisogno di un modello di embedding specifico, invialo in `x-openclaw-model`.
    Senza questo header, la richiesta passa alla normale configurazione di embedding dell'agente selezionato.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Imposta `stream: true` per ricevere Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Ogni riga evento è `data: <json>`
- Lo stream termina con `data: [DONE]`

## Configurazione rapida di Open WebUI

Per una connessione Open WebUI di base:

- URL base: `http://127.0.0.1:18789/v1`
- URL base Docker su macOS: `http://host.docker.internal:18789/v1`
- Chiave API: il tuo token bearer del Gateway
- Modello: `openclaw/default`

Comportamento previsto:

- `GET /v1/models` dovrebbe elencare `openclaw/default`
- Open WebUI dovrebbe usare `openclaw/default` come ID del modello chat
- Se vuoi un provider/modello backend specifico per quell'agente, imposta il normale modello predefinito dell'agente oppure invia `x-openclaw-model`

Smoke test rapido:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Se questo restituisce `openclaw/default`, la maggior parte delle configurazioni Open WebUI può connettersi con lo stesso URL base e token.

## Esempi

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

- `/v1/models` restituisce destinazioni agente OpenClaw, non cataloghi grezzi di provider.
- `openclaw/default` è sempre presente, così un unico ID stabile funziona in tutti gli ambienti.
- Gli override di provider/modello backend appartengono a `x-openclaw-model`, non al campo OpenAI `model`.
- `/v1/embeddings` supporta `input` come stringa o array di stringhe.
