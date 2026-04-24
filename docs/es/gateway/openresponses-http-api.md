---
read_when:
    - Integrar clientes que hablan la API OpenResponses
    - Quieres entradas basadas en elementos, llamadas de herramientas del cliente o eventos SSE
summary: Exponer un endpoint HTTP `/v1/responses` compatible con OpenResponses desde Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-24T05:29:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73f2e075b78e5153633af17c3f59cace4516e5aaa88952d643cfafb9d0df8022
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# API OpenResponses (HTTP)

Gateway de OpenClaw puede servir un endpoint `POST /v1/responses` compatible con OpenResponses.

Este endpoint está **desactivado de forma predeterminada**. Actívalo primero en la configuración.

- `POST /v1/responses`
- Mismo puerto que Gateway (multiplexación WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Internamente, las solicitudes se ejecutan como una ejecución normal del agente de Gateway (la misma ruta de código que
`openclaw agent`), por lo que el enrutamiento/permisos/configuración coinciden con tu Gateway.

## Autenticación, seguridad y enrutamiento

El comportamiento operativo coincide con [OpenAI Chat Completions](/es/gateway/openai-http-api):

- usa la ruta de autenticación HTTP de Gateway correspondiente:
  - autenticación por secreto compartido (`gateway.auth.mode="token"` o `"password"`): `Authorization: Bearer <token-or-password>`
  - autenticación por proxy de confianza (`gateway.auth.mode="trusted-proxy"`): encabezados de proxy con reconocimiento de identidad desde una fuente de proxy de confianza configurada y no loopback
  - autenticación abierta con ingreso privado (`gateway.auth.mode="none"`): sin encabezado de autenticación
- trata el endpoint como acceso completo de operador para la instancia de Gateway
- para los modos de autenticación por secreto compartido (`token` y `password`), ignora los valores más restringidos de `x-openclaw-scopes` declarados por bearer y restaura los valores predeterminados normales completos del operador
- para modos HTTP confiables con identidad (por ejemplo, autenticación por proxy de confianza o `gateway.auth.mode="none"`), respeta `x-openclaw-scopes` cuando está presente y, en caso contrario, recurre al conjunto normal de ámbitos predeterminados del operador
- selecciona agentes con `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` o `x-openclaw-agent-id`
- usa `x-openclaw-model` cuando quieras anular el modelo backend del agente seleccionado
- usa `x-openclaw-session-key` para enrutamiento explícito de sesión
- usa `x-openclaw-message-channel` cuando quieras un contexto de canal de ingreso sintético distinto del predeterminado

Matriz de autenticación:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - demuestra posesión del secreto compartido de operador de Gateway
  - ignora `x-openclaw-scopes` más restringidos
  - restaura el conjunto completo predeterminado de ámbitos de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata los turnos de chat en este endpoint como turnos de remitente propietario
- modos HTTP confiables con identidad (por ejemplo autenticación por proxy de confianza o `gateway.auth.mode="none"` en ingreso privado)
  - respetan `x-openclaw-scopes` cuando el encabezado está presente
  - recurren al conjunto normal de ámbitos predeterminados del operador cuando el encabezado está ausente
  - solo pierden semántica de propietario cuando la persona que llama restringe explícitamente los ámbitos y omite `operator.admin`

Activa o desactiva este endpoint con `gateway.http.endpoints.responses.enabled`.

La misma superficie de compatibilidad también incluye:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Para la explicación canónica de cómo encajan los modelos objetivo de agente, `openclaw/default`, el pass-through de embeddings y las anulaciones de modelos backend, consulta [OpenAI Chat Completions](/es/gateway/openai-http-api#agent-first-model-contract) y [Lista de modelos y enrutamiento de agentes](/es/gateway/openai-http-api#model-list-and-agent-routing).

## Comportamiento de sesión

De forma predeterminada, el endpoint es **sin estado por solicitud** (se genera una nueva clave de sesión en cada llamada).

Si la solicitud incluye una cadena OpenResponses `user`, Gateway deriva de ella una clave de sesión estable,
de modo que las llamadas repetidas pueden compartir una sesión de agente.

## Forma de la solicitud (compatible)

La solicitud sigue la API OpenResponses con entrada basada en elementos. Compatibilidad actual:

- `input`: cadena o arreglo de objetos de elemento.
- `instructions`: se fusiona en el prompt del sistema.
- `tools`: definiciones de herramientas del cliente (herramientas de función).
- `tool_choice`: filtra o exige herramientas del cliente.
- `stream`: habilita streaming SSE.
- `max_output_tokens`: límite de salida de mejor esfuerzo (dependiente del proveedor).
- `user`: enrutamiento estable de sesión.

Aceptados pero **actualmente ignorados**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Compatibles:

- `previous_response_id`: OpenClaw reutiliza la sesión de la respuesta anterior cuando la solicitud permanece dentro del mismo alcance de agente/usuario/sesión solicitada.

## Elementos (`input`)

### `message`

Roles: `system`, `developer`, `user`, `assistant`.

- `system` y `developer` se agregan al prompt del sistema.
- El elemento `user` o `function_call_output` más reciente se convierte en el “mensaje actual”.
- Los mensajes anteriores de usuario/asistente se incluyen como historial para contexto.

### `function_call_output` (herramientas basadas en turnos)

Envía de vuelta al modelo los resultados de herramientas:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` y `item_reference`

Se aceptan por compatibilidad de esquema, pero se ignoran al construir el prompt.

## Herramientas (herramientas de función del lado del cliente)

Proporciona herramientas con `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Si el agente decide llamar a una herramienta, la respuesta devuelve un elemento de salida `function_call`.
Después envías una solicitud de seguimiento con `function_call_output` para continuar el turno.

## Imágenes (`input_image`)

Admite fuentes base64 o URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Tipos MIME permitidos (actuales): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Tamaño máximo (actual): 10 MB.

## Archivos (`input_file`)

Admite fuentes base64 o URL:

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

Tipos MIME permitidos (actuales): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Tamaño máximo (actual): 5 MB.

Comportamiento actual:

- El contenido del archivo se decodifica y se agrega al **prompt del sistema**, no al mensaje del usuario,
  para que siga siendo efímero (no se conserve en el historial de la sesión).
- El texto decodificado del archivo se encapsula como **contenido externo no confiable** antes de agregarse,
  por lo que los bytes del archivo se tratan como datos, no como instrucciones confiables.
- El bloque inyectado usa marcadores explícitos de límite como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e incluye una
  línea de metadatos `Source: External`.
- Esta ruta de entrada de archivos omite intencionalmente el largo banner `SECURITY NOTICE:`
  para preservar el presupuesto del prompt; los marcadores de límite y metadatos siguen en su lugar.
- Primero se analiza el texto de los PDFs. Si se encuentra poco texto, las primeras páginas se
  rasterizan en imágenes y se pasan al modelo, y el bloque de archivo inyectado usa
  el marcador `[PDF content rendered to images]`.

El análisis de PDF usa la compilación heredada de `pdfjs-dist` compatible con Node (sin worker). La compilación moderna
de PDF.js espera workers del navegador/globals de DOM, por lo que no se usa en Gateway.

Valores predeterminados de obtención por URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (total de partes basadas en URL `input_file` + `input_image` por solicitud)
- Las solicitudes están protegidas (resolución DNS, bloqueo de IP privadas, límites de redirección, tiempos de espera).
- Se admiten listas permitidas opcionales de hostname por tipo de entrada (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host exacto: `"cdn.example.com"`
  - Subdominios con comodín: `"*.assets.example.com"` (no coincide con el ápice)
  - Las listas permitidas vacías u omitidas significan sin restricción de lista permitida de hostname.
- Para desactivar por completo las obtenciones basadas en URL, establece `files.allowUrl: false` y/o `images.allowUrl: false`.

## Límites de archivos + imágenes (configuración)

Los valores predeterminados pueden ajustarse en `gateway.http.endpoints.responses`:

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

Valores predeterminados cuando se omiten:

- `maxBodyBytes`: 20 MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5 MB
- `files.maxChars`: 200 k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10 s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4 000 000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10 MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10 s
- Las fuentes `input_image` HEIC/HEIF se aceptan y se normalizan a JPEG antes de la entrega al proveedor.

Nota de seguridad:

- Las listas permitidas de URL se aplican antes de la obtención y en los saltos de redirección.
- Permitir un hostname no evita el bloqueo de IP privadas/internas.
- Para gateways expuestos a internet, aplica controles de salida de red además de las protecciones a nivel de aplicación.
  Consulta [Seguridad](/es/gateway/security).

## Streaming (SSE)

Establece `stream: true` para recibir Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Cada línea de evento es `event: <type>` y `data: <json>`
- El flujo termina con `data: [DONE]`

Tipos de evento emitidos actualmente:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (en caso de error)

## `usage`

`usage` se completa cuando el proveedor subyacente informa recuentos de tokens.
OpenClaw normaliza los alias comunes de estilo OpenAI antes de que esos contadores lleguen
a superficies descendentes de estado/sesión, incluyendo `input_tokens` / `output_tokens`
y `prompt_tokens` / `completion_tokens`.

## Errores

Los errores usan un objeto JSON como:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Casos comunes:

- `401` autenticación ausente/inválida
- `400` cuerpo de solicitud no válido
- `405` método incorrecto

## Ejemplos

Sin streaming:

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

## Relacionado

- [OpenAI chat completions](/es/gateway/openai-http-api)
- [OpenAI](/es/providers/openai)
