---
read_when:
    - Integración de clientes compatibles con la API de OpenResponses
    - Quieres entradas basadas en elementos, llamadas a herramientas del cliente o eventos SSE
summary: Expón un punto de conexión HTTP /v1/responses compatible con OpenResponses desde el Gateway
title: API de OpenResponses
x-i18n:
    generated_at: "2026-05-06T09:03:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69d46dc448a8856a6f3213f2fbfdba000a342ec4dcf258435b7029102cfb8119
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw's Gateway puede servir un endpoint `POST /v1/responses` compatible con OpenResponses.

Este endpoint está **deshabilitado de forma predeterminada**. Habilítalo primero en la configuración.

- `POST /v1/responses`
- El mismo puerto que el Gateway (multiplexación WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Internamente, las solicitudes se ejecutan como una ejecución normal de agente del Gateway (la misma ruta de código que
`openclaw agent`), por lo que el enrutamiento, los permisos y la configuración coinciden con tu Gateway.

## Autenticación, seguridad y enrutamiento

El comportamiento operativo coincide con [OpenAI Chat Completions](/es/gateway/openai-http-api):

- usa la ruta de autenticación HTTP del Gateway correspondiente:
  - autenticación con secreto compartido (`gateway.auth.mode="token"` o `"password"`): `Authorization: Bearer <token-or-password>`
  - autenticación de proxy de confianza (`gateway.auth.mode="trusted-proxy"`): encabezados de proxy conscientes de identidad desde una fuente de proxy de confianza configurada; los proxies local loopback del mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito
  - autenticación abierta de entrada privada (`gateway.auth.mode="none"`): sin encabezado de autenticación
- trata el endpoint como acceso completo de operador para la instancia del gateway
- para los modos de autenticación con secreto compartido (`token` y `password`), ignora los valores `x-openclaw-scopes` más estrechos declarados por bearer y restaura los valores predeterminados normales completos de operador
- para modos HTTP con identidad de confianza (por ejemplo, autenticación de proxy de confianza o `gateway.auth.mode="none"`), respeta `x-openclaw-scopes` cuando esté presente y, si no, recurre al conjunto normal de ámbitos predeterminado del operador
- selecciona agentes con `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` o `x-openclaw-agent-id`
- usa `x-openclaw-model` cuando quieras anular el modelo de backend del agente seleccionado
- usa `x-openclaw-session-key` para el enrutamiento explícito de sesión
- usa `x-openclaw-message-channel` cuando quieras un contexto de canal de entrada sintético no predeterminado

Matriz de autenticación:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - demuestra la posesión del secreto compartido de operador del gateway
  - ignora `x-openclaw-scopes` más estrechos
  - restaura el conjunto completo de ámbitos predeterminados del operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata los turnos de chat en este endpoint como turnos de remitente propietario
- modos HTTP con identidad de confianza (por ejemplo, autenticación de proxy de confianza, o `gateway.auth.mode="none"` en entrada privada)
  - respetan `x-openclaw-scopes` cuando el encabezado está presente
  - recurren al conjunto normal de ámbitos predeterminado del operador cuando el encabezado está ausente
  - solo pierden la semántica de propietario cuando el llamador restringe explícitamente los ámbitos y omite `operator.admin`

Habilita o deshabilita este endpoint con `gateway.http.endpoints.responses.enabled`.

La misma superficie de compatibilidad también incluye:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Para la explicación canónica de cómo encajan los modelos orientados a agentes, `openclaw/default`, el paso directo de embeddings y las anulaciones del modelo de backend, consulta [OpenAI Chat Completions](/es/gateway/openai-http-api#agent-first-model-contract) y [Lista de modelos y enrutamiento de agentes](/es/gateway/openai-http-api#model-list-and-agent-routing).

## Comportamiento de sesión

De forma predeterminada, el endpoint es **sin estado por solicitud** (se genera una nueva clave de sesión en cada llamada).

Si la solicitud incluye una cadena OpenResponses `user`, el Gateway deriva de ella una clave de sesión estable, por lo que las llamadas repetidas pueden compartir una sesión de agente.

## Forma de la solicitud (compatible)

La solicitud sigue la API OpenResponses con entrada basada en elementos. Compatibilidad actual:

- `input`: cadena o matriz de objetos de elemento.
- `instructions`: se fusiona con el prompt del sistema.
- `tools`: definiciones de herramientas del cliente (herramientas de función).
- `tool_choice`: filtra o requiere herramientas del cliente.
- `stream`: habilita el streaming SSE.
- `max_output_tokens`: límite de salida de mejor esfuerzo (dependiente del proveedor).
- `user`: enrutamiento de sesión estable.

Aceptado pero **actualmente ignorado**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Compatible:

- `previous_response_id`: OpenClaw reutiliza la sesión de respuesta anterior cuando la solicitud permanece dentro del mismo alcance de agente/usuario/sesión solicitada.

## Elementos (entrada)

### `message`

Roles: `system`, `developer`, `user`, `assistant`.

- `system` y `developer` se agregan al prompt del sistema.
- El elemento `user` o `function_call_output` más reciente se convierte en el "mensaje actual".
- Los mensajes anteriores de usuario/asistente se incluyen como historial para contexto.

### `function_call_output` (herramientas basadas en turnos)

Envía resultados de herramientas de vuelta al modelo:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` e `item_reference`

Se aceptan por compatibilidad de esquema, pero se ignoran al construir el prompt.

## Herramientas (herramientas de función del lado del cliente)

Proporciona herramientas con `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Si el agente decide llamar a una herramienta, la respuesta devuelve un elemento de salida `function_call`.
Después, envías una solicitud de seguimiento con `function_call_output` para continuar el turno.

## Imágenes (`input_image`)

Admite fuentes base64 o URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Tipos MIME permitidos (actuales): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Tamaño máximo (actual): 10MB.

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

Tamaño máximo (actual): 5MB.

Comportamiento actual:

- El contenido del archivo se decodifica y se agrega al **prompt del sistema**, no al mensaje del usuario,
  por lo que permanece efímero (no se conserva en el historial de sesión).
- El texto decodificado del archivo se envuelve como **contenido externo no confiable** antes de agregarse,
  por lo que los bytes del archivo se tratan como datos, no como instrucciones de confianza.
- El bloque inyectado usa marcadores de límite explícitos como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e incluye una línea de metadatos
  `Source: External`.
- Esta ruta de entrada de archivos omite intencionalmente el banner largo `SECURITY NOTICE:` para
  preservar el presupuesto de prompt; los marcadores de límite y los metadatos permanecen en su lugar.
- Los PDF se analizan primero para extraer texto. Si se encuentra poco texto, las primeras páginas se
  rasterizan en imágenes y se pasan al modelo, y el bloque de archivo inyectado usa
  el marcador de posición `[PDF content rendered to images]`.

El análisis de PDF lo proporciona el plugin `document-extract` incluido, que usa la compilación heredada de `pdfjs-dist` compatible con Node (sin worker). La compilación moderna de PDF.js espera workers del navegador/globales del DOM, por lo que no se usa en el Gateway.

Valores predeterminados de obtención de URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (partes totales basadas en URL de `input_file` + `input_image` por solicitud)
- Las solicitudes están protegidas (resolución DNS, bloqueo de IP privadas, límites de redirección, tiempos de espera).
- Se admiten listas opcionales de hosts permitidos por tipo de entrada (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host exacto: `"cdn.example.com"`
  - Subdominios comodín: `"*.assets.example.com"` (no coincide con el apex)
  - Las listas de permitidos vacías u omitidas significan que no hay restricción de lista de hosts permitidos.
- Para deshabilitar por completo las obtenciones basadas en URL, establece `files.allowUrl: false` y/o `images.allowUrl: false`.

## Límites de archivos e imágenes (configuración)

Los valores predeterminados se pueden ajustar bajo `gateway.http.endpoints.responses`:

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
- Las fuentes HEIC/HEIF `input_image` se aceptan y se normalizan a JPEG antes de entregarlas al proveedor.

Nota de seguridad:

- Las listas de URL permitidas se aplican antes de la obtención y en los saltos de redirección.
- Permitir un hostname no omite el bloqueo de IP privadas/internas.
- Para gateways expuestos a Internet, aplica controles de egreso de red además de las protecciones a nivel de aplicación.
  Consulta [Seguridad](/es/gateway/security).

## Streaming (SSE)

Establece `stream: true` para recibir Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Cada línea de evento es `event: <type>` y `data: <json>`
- El stream termina con `data: [DONE]`

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
- `response.failed` (en error)

## Uso

`usage` se rellena cuando el proveedor subyacente informa recuentos de tokens.
OpenClaw normaliza aliases comunes de estilo OpenAI antes de que esos contadores lleguen
a las superficies descendentes de estado/sesión, incluidos `input_tokens` / `output_tokens`
y `prompt_tokens` / `completion_tokens`.

## Errores

Los errores usan un objeto JSON como:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Casos comunes:

- `401` autenticación faltante/inválida
- `400` cuerpo de solicitud inválido
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
