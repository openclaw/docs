---
read_when:
    - Integrare client compatibili con l'API OpenResponses
    - Ti servono input basati su elementi, chiamate a strumenti client o eventi SSE
summary: Esporre dal Gateway un endpoint HTTP /v1/responses compatibile con OpenResponses
title: API OpenResponses
x-i18n:
    generated_at: "2026-05-06T08:51:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69d46dc448a8856a6f3213f2fbfdba000a342ec4dcf258435b7029102cfb8119
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Il Gateway di OpenClaw può servire un endpoint `POST /v1/responses` compatibile con OpenResponses.

Questo endpoint è **disabilitato per impostazione predefinita**. Abilitalo prima nella configurazione.

- `POST /v1/responses`
- Stessa porta del Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Sotto il cofano, le richieste vengono eseguite come una normale esecuzione agente del Gateway (lo stesso percorso di codice di
`openclaw agent`), quindi routing/permessi/configurazione corrispondono al tuo Gateway.

## Autenticazione, sicurezza e routing

Il comportamento operativo corrisponde a [Completamenti chat OpenAI](/it/gateway/openai-http-api):

- usa il percorso di autenticazione HTTP del Gateway corrispondente:
  - autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`): `Authorization: Bearer <token-or-password>`
  - autenticazione trusted-proxy (`gateway.auth.mode="trusted-proxy"`): header proxy sensibili all'identità da una sorgente proxy attendibile configurata; i proxy local loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito
  - autenticazione aperta private-ingress (`gateway.auth.mode="none"`): nessun header di autenticazione
- tratta l'endpoint come accesso operatore completo per l'istanza gateway
- per le modalità di autenticazione con segreto condiviso (`token` e `password`), ignora i valori `x-openclaw-scopes` più ristretti dichiarati dal bearer e ripristina i normali valori predefiniti dell'operatore completo
- per le modalità HTTP con identità attendibile (per esempio autenticazione trusted proxy o `gateway.auth.mode="none"`), rispetta `x-openclaw-scopes` quando presente e altrimenti ripiega sul normale set di ambiti operatore predefinito
- seleziona gli agenti con `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` o `x-openclaw-agent-id`
- usa `x-openclaw-model` quando vuoi sovrascrivere il modello backend dell'agente selezionato
- usa `x-openclaw-session-key` per il routing esplicito della sessione
- usa `x-openclaw-message-channel` quando vuoi un contesto di canale di ingresso sintetico non predefinito

Matrice di autenticazione:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - prova il possesso del segreto operatore gateway condiviso
  - ignora `x-openclaw-scopes` più ristretti
  - ripristina il set completo di ambiti operatore predefinito:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta i turni di chat su questo endpoint come turni del mittente-proprietario
- modalità HTTP con identità attendibile (per esempio autenticazione trusted proxy, o `gateway.auth.mode="none"` su ingresso privato)
  - rispettano `x-openclaw-scopes` quando l'header è presente
  - ripiegano sul normale set di ambiti operatore predefinito quando l'header è assente
  - perdono le semantiche di proprietario solo quando il chiamante restringe esplicitamente gli ambiti e omette `operator.admin`

Abilita o disabilita questo endpoint con `gateway.http.endpoints.responses.enabled`.

La stessa superficie di compatibilità include anche:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Per la spiegazione canonica di come modelli destinati agli agenti, `openclaw/default`, pass-through degli embedding e override dei modelli backend si combinano, vedi [Completamenti chat OpenAI](/it/gateway/openai-http-api#agent-first-model-contract) e [Elenco dei modelli e routing degli agenti](/it/gateway/openai-http-api#model-list-and-agent-routing).

## Comportamento della sessione

Per impostazione predefinita, l'endpoint è **stateless per richiesta** (a ogni chiamata viene generata una nuova chiave di sessione).

Se la richiesta include una stringa OpenResponses `user`, il Gateway ne deriva una chiave di sessione stabile, così le chiamate ripetute possono condividere una sessione agente.

## Forma della richiesta (supportata)

La richiesta segue l'API OpenResponses con input basato su elementi. Supporto attuale:

- `input`: stringa o array di oggetti elemento.
- `instructions`: unite al prompt di sistema.
- `tools`: definizioni di strumenti client (function tools).
- `tool_choice`: filtra o richiede strumenti client.
- `stream`: abilita lo streaming SSE.
- `max_output_tokens`: limite di output best-effort (dipendente dal provider).
- `user`: routing stabile della sessione.

Accettati ma **attualmente ignorati**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Supportato:

- `previous_response_id`: OpenClaw riusa la sessione della risposta precedente quando la richiesta resta entro lo stesso ambito agente/utente/sessione richiesta.

## Elementi (input)

### `message`

Ruoli: `system`, `developer`, `user`, `assistant`.

- `system` e `developer` vengono aggiunti al prompt di sistema.
- L'elemento `user` o `function_call_output` più recente diventa il "messaggio corrente".
- I messaggi utente/assistente precedenti sono inclusi come cronologia per il contesto.

### `function_call_output` (strumenti basati su turno)

Invia i risultati degli strumenti al modello:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` e `item_reference`

Accettati per compatibilità dello schema ma ignorati quando viene costruito il prompt.

## Strumenti (function tools lato client)

Fornisci strumenti con `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Se l'agente decide di chiamare uno strumento, la risposta restituisce un elemento di output `function_call`.
Poi invii una richiesta di follow-up con `function_call_output` per continuare il turno.

## Immagini (`input_image`)

Supporta sorgenti base64 o URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Tipi MIME consentiti (attuali): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Dimensione massima (attuale): 10MB.

## File (`input_file`)

Supporta sorgenti base64 o URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Tipi MIME consentiti (attuali): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Dimensione massima (attuale): 5MB.

Comportamento attuale:

- Il contenuto del file viene decodificato e aggiunto al **prompt di sistema**, non al messaggio utente,
  quindi rimane effimero (non persistito nella cronologia della sessione).
- Il testo del file decodificato viene avvolto come **contenuto esterno non attendibile** prima di essere aggiunto,
  quindi i byte del file sono trattati come dati, non come istruzioni attendibili.
- Il blocco iniettato usa marcatori di confine espliciti come
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e include una riga di metadati
  `Source: External`.
- Questo percorso di input file omette intenzionalmente il lungo banner `SECURITY NOTICE:`
  per preservare il budget del prompt; i marcatori di confine e i metadati restano comunque presenti.
- I PDF vengono prima analizzati per estrarre testo. Se viene trovato poco testo, le prime pagine vengono
  rasterizzate in immagini e passate al modello, e il blocco file iniettato usa
  il segnaposto `[PDF content rendered to images]`.

L'analisi dei PDF è fornita dal Plugin `document-extract` in bundle, che usa la build legacy
di `pdfjs-dist` compatibile con Node (senza worker). La build moderna di PDF.js
si aspetta worker del browser/globali DOM, quindi non viene usata nel Gateway.

Valori predefiniti del fetch URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (parti totali `input_file` + `input_image` basate su URL per richiesta)
- Le richieste sono protette (risoluzione DNS, blocco IP privati, limiti di redirect, timeout).
- Allowlist opzionali di hostname sono supportate per tipo di input (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host esatto: `"cdn.example.com"`
  - Sottodomini wildcard: `"*.assets.example.com"` (non corrisponde all'apex)
  - Allowlist vuote o omesse indicano nessuna restrizione di allowlist hostname.
- Per disabilitare completamente i fetch basati su URL, imposta `files.allowUrl: false` e/o `images.allowUrl: false`.

## Limiti per file + immagini (configurazione)

I valori predefiniti possono essere regolati sotto `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
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

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- Le sorgenti HEIC/HEIF `input_image` sono accettate e normalizzate in JPEG prima della consegna al provider.

Nota di sicurezza:

- Le allowlist URL sono applicate prima del fetch e sui salti di redirect.
- L'inserimento di un hostname in allowlist non aggira il blocco degli IP privati/interni.
- Per gateway esposti a Internet, applica controlli di uscita di rete oltre alle protezioni a livello applicazione.
  Vedi [Sicurezza](/it/gateway/security).

## Streaming (SSE)

Imposta `stream: true` per ricevere Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Ogni riga di evento è `event: <type>` e `data: <json>`
- Lo stream termina con `data: [DONE]`

Tipi di evento attualmente emessi:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (in caso di errore)

## Utilizzo

`usage` viene popolato quando il provider sottostante riporta i conteggi dei token.
OpenClaw normalizza gli alias comuni in stile OpenAI prima che quei contatori raggiungano
le superfici downstream di stato/sessione, inclusi `input_tokens` / `output_tokens`
e `prompt_tokens` / `completion_tokens`.

## Errori

Gli errori usano un oggetto JSON come:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Casi comuni:

- `401` autenticazione mancante/non valida
- `400` corpo della richiesta non valido
- `405` metodo errato

## Esempi

Non streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Streaming:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## Correlati

- [Completamenti chat OpenAI](/it/gateway/openai-http-api)
- [OpenAI](/it/providers/openai)
