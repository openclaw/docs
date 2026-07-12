---
read_when:
    - Integrazione dei client che utilizzano l'API OpenResponses
    - Vuoi input basati su elementi, chiamate agli strumenti client o eventi SSE
summary: Esponi dal Gateway un endpoint HTTP `/v1/responses` compatibile con OpenResponses
title: API OpenResponses
x-i18n:
    generated_at: "2026-07-12T07:04:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Il Gateway può esporre un endpoint `POST /v1/responses` compatibile con OpenResponses. È **disabilitato per impostazione predefinita** e condivide la porta con il Gateway (multiplexing WS + HTTP): `http://<gateway-host>:<port>/v1/responses`.

Le richieste vengono eseguite come una normale esecuzione di un agente del Gateway (lo stesso percorso di codice di `openclaw agent`), quindi instradamento, autorizzazioni e configurazione corrispondono a quelli del Gateway.

Abilitalo o disabilitalo con `gateway.http.endpoints.responses.enabled`. Quando è abilitato, la stessa superficie di compatibilità espone anche `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` e `POST /v1/chat/completions`.

## Autenticazione, sicurezza e instradamento

Il comportamento operativo corrisponde a [OpenAI Chat Completions](/it/gateway/openai-http-api):

- Il percorso di autenticazione corrisponde a `gateway.auth.mode`: il segreto condiviso (`token`/`password`) usa `Authorization: Bearer <token-or-password>`; il proxy attendibile usa intestazioni del proxy con informazioni sull'identità (i proxy local loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true`, con un ripiego diretto sullo stesso host tramite `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` quando non è presente alcuna intestazione `Forwarded`/`X-Forwarded-*`/`X-Real-IP`); `none` su un ingresso privato non richiede alcuna intestazione di autenticazione. Vedi [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth).
- Considera l'endpoint come accesso completo dell'operatore all'istanza del Gateway.
- Le modalità di autenticazione con segreto condiviso ignorano un `x-openclaw-scopes` più ristretto dichiarato dal bearer e ripristinano l'insieme completo predefinito degli ambiti dell'operatore: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. I turni di chat su questo endpoint vengono considerati turni inviati dal proprietario.
- Le modalità HTTP attendibili che trasportano l'identità (proxy attendibile oppure `gateway.auth.mode="none"`) rispettano `x-openclaw-scopes` quando è presente; in caso contrario, usano l'insieme predefinito degli ambiti dell'operatore. La semantica del proprietario viene persa solo quando il chiamante restringe esplicitamente gli ambiti e omette `operator.admin`.
- Seleziona gli agenti con `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` oppure con l'intestazione `x-openclaw-agent-id`.
- Usa `x-openclaw-model` per sostituire il modello di backend dell'agente selezionato (richiede `operator.admin` nei percorsi di autenticazione che trasportano l'identità).
- Usa `x-openclaw-session-key` per l'instradamento esplicito della sessione (viene rifiutato con `400 invalid_request_error` se usa uno spazio dei nomi riservato: `subagent:`, `cron:`, `acp:`).
- Usa `x-openclaw-message-channel` per un contesto di canale d'ingresso sintetico non predefinito.

Per la spiegazione canonica dei modelli destinati agli agenti, di `openclaw/default`, dell'inoltro diretto degli embedding e delle sostituzioni del modello di backend, vedi [OpenAI Chat Completions](/it/gateway/openai-http-api#agent-first-model-contract).

Vedi [Ambiti dell'operatore](/it/gateway/operator-scopes) e [Sicurezza](/it/gateway/security).

## Comportamento della sessione

Per impostazione predefinita, l'endpoint è **senza stato per ogni richiesta** (a ogni chiamata viene generata una nuova chiave di sessione).

Se la richiesta include una stringa OpenResponses `user`, il Gateway ne deriva una chiave di sessione stabile, così le chiamate ripetute possono condividere una sessione dell'agente.

`previous_response_id` riutilizza la sessione della risposta precedente quando la richiesta rimane nello stesso ambito agente/utente/sessione richiesta (determinato in base al soggetto di autenticazione, all'ID agente e a `x-openclaw-session-key`).

## Struttura della richiesta

| Campo                                                            | Supporto                                                                                                                                                    |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`                                                          | Stringa o array di oggetti elemento.                                                                                                                        |
| `instructions`                                                   | Integrate nel prompt di sistema.                                                                                                                            |
| `tools`                                                          | Definizioni degli strumenti del client (strumenti funzione).                                                                                                |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` oppure `{ "type": "function", "name": "..." }` per filtrare o richiedere gli strumenti del client.                         |
| `stream`                                                         | Abilita lo streaming SSE.                                                                                                                                   |
| `max_output_tokens`                                              | Limite di output applicato per quanto possibile (dipende dal provider).                                                                                     |
| `temperature`                                                    | Temperatura di campionamento applicata per quanto possibile. Ignorata dal backend Codex Responses basato su ChatGPT, che usa un campionamento fisso lato server. |
| `top_p`                                                          | Campionamento nucleus applicato per quanto possibile. Stessa limitazione di Codex Responses indicata per `temperature`.                                     |
| `user`                                                           | Instradamento stabile della sessione.                                                                                                                       |
| `previous_response_id`                                           | Continuità della sessione (vedi sopra).                                                                                                                     |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Accettati, ma attualmente ignorati.                                                                                                                         |

## Elementi (input)

### `message`

Ruoli: `system`, `developer`, `user`, `assistant`.

- `system` e `developer` vengono aggiunti al prompt di sistema.
- L'elemento `user` o `function_call_output` più recente diventa il "messaggio corrente".
- I messaggi precedenti dell'utente e dell'assistente vengono inclusi come cronologia per il contesto.

### `function_call_output` (strumenti basati sui turni)

Invia nuovamente al modello i risultati degli strumenti:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` e `item_reference`

Accettati per compatibilità con lo schema, ma ignorati durante la creazione del prompt.

## Strumenti (strumenti funzione lato client)

Fornisci gli strumenti con `tools: [{ type: "function", name, description?, parameters? }]`.

Se l'agente chiama uno strumento, la risposta restituisce un elemento di output `function_call`. Invia una richiesta successiva con `function_call_output` per continuare il turno.

Per `tool_choice: "required"` e per un `tool_choice` vincolato a una funzione, l'endpoint restringe l'insieme esposto degli strumenti funzione del client, indica al runtime di chiamare uno strumento del client prima di rispondere e rifiuta il turno se questo non include una chiamata strutturata corrispondente a uno strumento del client, in conformità al contratto di `/v1/chat/completions`. Le richieste senza streaming restituiscono `502` con un `api_error`; quelle con streaming emettono un evento `response.failed`.

## Immagini (`input_image`)

Supporta sorgenti base64 o URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Tipi MIME consentiti (impostazione predefinita): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. Dimensione massima (impostazione predefinita): 10 MB.

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

Tipi MIME consentiti (impostazione predefinita): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. Dimensione massima (impostazione predefinita): 5 MB.

Comportamento attuale:

- Il contenuto del file viene decodificato e aggiunto al **prompt di sistema**, non al messaggio dell'utente, quindi rimane effimero (non viene conservato nella cronologia della sessione).
- Prima dell'aggiunta, il testo decodificato del file viene racchiuso come **contenuto esterno non attendibile**, così i byte del file vengono trattati come dati e non come istruzioni attendibili. Il blocco inserito usa marcatori di delimitazione espliciti (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) e una riga di metadati `Source: External`. Il lungo banner `SECURITY NOTICE:` viene intenzionalmente omesso per preservare il budget del prompt; i marcatori di delimitazione e i metadati continuano comunque ad applicarsi.
- Nei PDF viene prima estratto il testo. Se ne viene trovato poco, le prime pagine vengono rasterizzate in immagini e passate al modello, mentre il blocco del file inserito usa il segnaposto `[PDF content rendered to images]`.

L'analisi dei PDF è fornita dal Plugin `document-extract` incluso, che usa `clawpdf` e il relativo runtime PDFium WebAssembly incluso nel pacchetto per l'estrazione del testo e il rendering delle pagine.

Impostazioni predefinite per il recupero tramite URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (numero totale di parti `input_file` + `input_image` basate su URL per richiesta)
- Le richieste sono protette (risoluzione DNS, blocco degli IP privati, limiti ai reindirizzamenti, timeout).
- Sono supportati elenchi facoltativi di nomi host consentiti per ciascun tipo di input (`files.urlAllowlist`, `images.urlAllowlist`): host esatto (`"cdn.example.com"`) o sottodomini con carattere jolly (`"*.assets.example.com"`, non corrisponde al dominio principale). Gli elenchi vuoti o omessi non impongono restrizioni sui nomi host.
- Per disabilitare completamente il recupero basato su URL, imposta `files.allowUrl: false` e/o `images.allowUrl: false`.

## Limiti di file e immagini (configurazione)

Le impostazioni predefinite possono essere regolate in `gateway.http.endpoints.responses`:

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
            maxChars: 60000,
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

| Chiave                   | Valore predefinito |
| ------------------------ | ------------------ |
| `maxBodyBytes`           | 20 MB              |
| `maxUrlParts`            | 8                  |
| `files.maxBytes`         | 5 MB               |
| `files.maxChars`         | 60.000             |
| `files.maxRedirects`     | 3                  |
| `files.timeoutMs`        | 10 s               |
| `files.pdf.maxPages`     | 4                  |
| `files.pdf.maxPixels`    | 4.000.000          |
| `files.pdf.minTextChars` | 200                |
| `images.maxBytes`        | 10 MB              |
| `images.maxRedirects`    | 3                  |
| `images.timeoutMs`       | 10 s               |

Le sorgenti HEIC/HEIF `input_image` vengono normalizzate in JPEG prima dell'invio al provider tramite il processore di immagini condiviso di OpenClaw (Rastermill), che ricorre a un convertitore di sistema (`sips`, ImageMagick, GraphicsMagick o ffmpeg) per i formati che richiedono il supporto di codec esterni.

Nota sulla sicurezza: gli elenchi di URL consentiti vengono applicati prima del recupero e a ogni passaggio di reindirizzamento. L'inclusione di un nome host nell'elenco non aggira il blocco degli IP privati o interni. Per i Gateway esposti a Internet, applica controlli sull'uscita di rete oltre alle protezioni a livello di applicazione. Vedi [Sicurezza](/it/gateway/security).

## Streaming (SSE)

Imposta `stream: true` per ricevere eventi inviati dal server:

- `Content-Type: text/event-stream`
- Ogni riga di evento è `event: <type>` e `data: <json>`
- Il flusso termina con `data: [DONE]`

Tipi di evento attualmente emessi: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (in caso di errore).

## Utilizzo

`usage` viene valorizzato quando il provider sottostante comunica i conteggi dei token. OpenClaw normalizza gli alias comuni in stile OpenAI prima che questi contatori raggiungano le superfici di stato/sessione a valle, inclusi `input_tokens` / `output_tokens` e `prompt_tokens` / `completion_tokens`.

## Errori

Gli errori utilizzano un oggetto JSON come il seguente:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Casi comuni: `400` corpo della richiesta non valido, `401` autenticazione mancante/non valida, `403` ambito operatore mancante, `405` metodo errato, `429` troppi tentativi di autenticazione non riusciti (con `Retry-After`).

## Esempi

Senza streaming:

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

Con streaming:

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

## Contenuti correlati

- [Completamenti chat di OpenAI](/it/gateway/openai-http-api)
- [Ambiti operatore](/it/gateway/operator-scopes)
- [OpenAI](/it/providers/openai)
