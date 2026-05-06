---
read_when:
    - Integrazione di strumenti che si aspettano OpenAI Chat Completions
summary: Esporre dal Gateway un endpoint HTTP /v1/chat/completions compatibile con OpenAI
title: Completamenti chat di OpenAI
x-i18n:
    generated_at: "2026-05-06T08:51:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8cd0995cf5f897ae8f99f35fc4b8ea28ebde3cba41da0f3e768ec1de7874b2f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw Gateway può servire un piccolo endpoint Chat Completions compatibile con OpenAI.

Questo endpoint è **disabilitato per impostazione predefinita**. Abilitalo prima nella configurazione.

- `POST /v1/chat/completions`
- Stessa porta del Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Quando la superficie HTTP compatibile con OpenAI del Gateway è abilitata, serve anche:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Dietro le quinte, le richieste vengono eseguite come una normale esecuzione di un agente Gateway (lo stesso percorso di codice di `openclaw agent`), quindi routing/permessi/configurazione corrispondono al tuo Gateway.

## Autenticazione

Usa la configurazione di autenticazione del Gateway.

Percorsi comuni di autenticazione HTTP:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticazione HTTP affidabile con identità (`gateway.auth.mode="trusted-proxy"`):
  instrada attraverso il proxy configurato consapevole dell'identità e lascia che inietti le
  intestazioni di identità richieste
- autenticazione aperta su ingresso privato (`gateway.auth.mode="none"`):
  nessuna intestazione di autenticazione richiesta

Note:

- Quando `gateway.auth.mode="token"`, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, la richiesta HTTP deve provenire da una
  sorgente proxy attendibile configurata; i proxy loopback sullo stesso host richiedono esplicitamente
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Se `gateway.auth.rateLimit` è configurato e si verificano troppi errori di autenticazione, l'endpoint restituisce `429` con `Retry-After`.

## Confine di sicurezza (importante)

Tratta questo endpoint come una superficie con **accesso operatore completo** per l'istanza gateway.

- L'autenticazione bearer HTTP qui non è un modello con ambito ristretto per utente.
- Un token/password Gateway valido per questo endpoint deve essere trattato come una credenziale proprietario/operatore.
- Le richieste passano attraverso lo stesso percorso dell'agente control-plane delle azioni operatore attendibili.
- Non esiste un confine separato per strumenti non proprietario/per utente su questo endpoint; quando un chiamante supera qui l'autenticazione Gateway, OpenClaw tratta quel chiamante come un operatore attendibile per questo gateway.
- Per le modalità di autenticazione con segreto condiviso (`token` e `password`), l'endpoint ripristina i normali valori predefiniti da operatore completo anche se il chiamante invia un'intestazione `x-openclaw-scopes` più ristretta.
- Le modalità HTTP affidabili con identità (per esempio l'autenticazione tramite proxy attendibile o `gateway.auth.mode="none"`) rispettano `x-openclaw-scopes` quando presente e altrimenti ripiegano sul normale insieme di ambiti predefinito dell'operatore.
- Se la policy dell'agente di destinazione consente strumenti sensibili, questo endpoint può usarli.
- Mantieni questo endpoint solo su loopback/tailnet/ingresso privato; non esporlo direttamente a Internet pubblico.

Matrice di autenticazione:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - prova il possesso del segreto operatore condiviso del gateway
  - ignora `x-openclaw-scopes` più ristretti
  - ripristina l'insieme completo degli ambiti operatore predefiniti:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta i turni di chat su questo endpoint come turni inviati dal proprietario
- modalità HTTP affidabili con identità (per esempio autenticazione tramite proxy attendibile, o `gateway.auth.mode="none"` su ingresso privato)
  - autenticano un'identità attendibile esterna o un confine di deployment
  - rispettano `x-openclaw-scopes` quando l'intestazione è presente
  - ripiegano sul normale insieme di ambiti operatore predefinito quando l'intestazione è assente
  - perdono la semantica di proprietario solo quando il chiamante restringe esplicitamente gli ambiti e omette `operator.admin`

Vedi [Sicurezza](/it/gateway/security) e [Accesso remoto](/it/gateway/remote).

## Contratto del modello agent-first

OpenClaw tratta il campo OpenAI `model` come una **destinazione agente**, non come un ID grezzo del modello provider.

- `model: "openclaw"` instrada all'agente predefinito configurato.
- `model: "openclaw/default"` instrada anche all'agente predefinito configurato.
- `model: "openclaw/<agentId>"` instrada a un agente specifico.

Intestazioni di richiesta opzionali:

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

Per impostazione predefinita l'endpoint è **senza stato per richiesta** (a ogni chiamata viene generata una nuova chiave di sessione).

Se la richiesta include una stringa OpenAI `user`, il Gateway deriva da essa una chiave di sessione stabile, così le chiamate ripetute possono condividere una sessione agente.

## Perché questa superficie è importante

Questo è l'insieme di compatibilità più incisivo per frontend e strumenti self-hosted:

- La maggior parte delle configurazioni Open WebUI, LobeChat e LibreChat si aspetta `/v1/models`.
- Molti sistemi RAG si aspettano `/v1/embeddings`.
- I client chat OpenAI esistenti di solito possono iniziare con `/v1/chat/completions`.
- I client più nativi per agenti preferiscono sempre più `/v1/responses`.

## Elenco dei modelli e routing degli agenti

<AccordionGroup>
  <Accordion title="Che cosa restituisce `/v1/models`?">
    Un elenco di destinazioni agente OpenClaw.

    Gli ID restituiti sono voci `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
    Usali direttamente come valori OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` elenca agenti o sub-agenti?">
    Elenca destinazioni agente di livello superiore, non modelli provider backend e non sub-agenti.

    I sub-agenti restano una topologia di esecuzione interna. Non appaiono come pseudo-modelli.

  </Accordion>
  <Accordion title="Perché è incluso `openclaw/default`?">
    `openclaw/default` è l'alias stabile per l'agente predefinito configurato.

    Questo significa che i client possono continuare a usare un ID prevedibile anche se l'ID reale dell'agente predefinito cambia tra ambienti.

  </Accordion>
  <Accordion title="Come sovrascrivo il modello backend?">
    Usa `x-openclaw-model`.

    Esempi:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Se lo ometti, l'agente selezionato viene eseguito con la sua normale scelta di modello configurata.

  </Accordion>
  <Accordion title="Come si inseriscono gli embedding in questo contratto?">
    `/v1/embeddings` usa gli stessi ID `model` di destinazione agente.

    Usa `model: "openclaw/default"` o `model: "openclaw/<agentId>"`.
    Quando ti serve un modello di embedding specifico, invialo in `x-openclaw-model`.
    Senza quell'intestazione, la richiesta passa alla normale configurazione di embedding dell'agente selezionato.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Imposta `stream: true` per ricevere Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Ogni riga di evento è `data: <json>`
- Lo stream termina con `data: [DONE]`

## Configurazione rapida di Open WebUI

Per una connessione Open WebUI di base:

- URL base: `http://127.0.0.1:18789/v1`
- URL base Docker su macOS: `http://host.docker.internal:18789/v1`
- Chiave API: il tuo token bearer Gateway
- Modello: `openclaw/default`

Comportamento atteso:

- `GET /v1/models` dovrebbe elencare `openclaw/default`
- Open WebUI dovrebbe usare `openclaw/default` come ID del modello chat
- Se vuoi un provider/modello backend specifico per quell'agente, imposta il normale modello predefinito dell'agente o invia `x-openclaw-model`

Smoke rapido:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Se restituisce `openclaw/default`, la maggior parte delle configurazioni Open WebUI può connettersi con lo stesso URL base e token.

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

Creare embedding:

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
- `openclaw/default` è sempre presente, così un unico ID stabile funziona tra ambienti.
- Gli override provider/modello backend vanno in `x-openclaw-model`, non nel campo OpenAI `model`.
- `/v1/embeddings` supporta `input` come stringa o array di stringhe.

## Correlati

- [Riferimento configurazione](/it/gateway/configuration-reference)
- [OpenAI](/it/providers/openai)
