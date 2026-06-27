---
read_when:
    - Integración de clientes que usan la API OpenResponses
    - Quieres entradas basadas en elementos, llamadas a herramientas del cliente o eventos SSE
summary: Exponer un endpoint HTTP /v1/responses compatible con OpenResponses desde el Gateway
title: API de OpenResponses
x-i18n:
    generated_at: "2026-06-27T11:31:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

El Gateway de OpenClaw puede servir un endpoint `POST /v1/responses` compatible con OpenResponses.

Este endpoint está **deshabilitado de forma predeterminada**. Habilítalo primero en la configuración.

- `POST /v1/responses`
- Mismo puerto que el Gateway (multiplexación WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Internamente, las solicitudes se ejecutan como una ejecución normal de agente del Gateway (la misma ruta de código que
`openclaw agent`), por lo que el enrutamiento, los permisos y la configuración coinciden con tu Gateway.

## Autenticación, seguridad y enrutamiento

El comportamiento operativo coincide con [OpenAI Chat Completions](/es/gateway/openai-http-api):

- usa la ruta de autenticación HTTP del Gateway correspondiente:
  - autenticación con secreto compartido (`gateway.auth.mode="token"` o `"password"`): `Authorization: Bearer <token-or-password>`
  - autenticación con proxy de confianza (`gateway.auth.mode="trusted-proxy"`): encabezados de proxy con identidad desde una fuente de proxy de confianza configurada; los proxies de bucle invertido del mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito
  - reserva directa local para proxy de confianza: los llamadores del mismo host sin encabezados `Forwarded`, `X-Forwarded-*` ni `X-Real-IP` pueden usar `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`
  - autenticación abierta de ingreso privado (`gateway.auth.mode="none"`): sin encabezado de autenticación
- trata el endpoint como acceso completo de operador para la instancia del gateway
- para modos de autenticación con secreto compartido (`token` y `password`), ignora valores más limitados de `x-openclaw-scopes` declarados por bearer y restaura los valores predeterminados normales de operador completo
- para modos HTTP con identidad de confianza (por ejemplo, autenticación con proxy de confianza o `gateway.auth.mode="none"`), respeta `x-openclaw-scopes` cuando esté presente y, de lo contrario, recurre al conjunto de ámbitos predeterminado normal del operador
- selecciona agentes con `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` o `x-openclaw-agent-id`
- usa `x-openclaw-model` cuando quieras sobrescribir el modelo backend del agente seleccionado
- usa `x-openclaw-session-key` para enrutamiento explícito de sesión
- usa `x-openclaw-message-channel` cuando quieras un contexto de canal de ingreso sintético no predeterminado

Matriz de autenticación:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - demuestra posesión del secreto compartido de operador del gateway
  - ignora `x-openclaw-scopes` más limitados
  - restaura el conjunto completo de ámbitos predeterminado del operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata los turnos de chat en este endpoint como turnos de remitente propietario
- modos HTTP con identidad de confianza (por ejemplo, autenticación con proxy de confianza, o `gateway.auth.mode="none"` en ingreso privado)
  - respetan `x-openclaw-scopes` cuando el encabezado está presente
  - recurren al conjunto de ámbitos predeterminado normal del operador cuando el encabezado está ausente
  - solo pierden la semántica de propietario cuando el llamador limita explícitamente los ámbitos y omite `operator.admin`

Habilita o deshabilita este endpoint con `gateway.http.endpoints.responses.enabled`.

La misma superficie de compatibilidad también incluye:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Para la explicación canónica de cómo encajan los modelos orientados a agentes, `openclaw/default`, el paso directo de embeddings y las sobrescrituras de modelo backend, consulta [OpenAI Chat Completions](/es/gateway/openai-http-api#agent-first-model-contract) y [Lista de modelos y enrutamiento de agentes](/es/gateway/openai-http-api#model-list-and-agent-routing).

## Comportamiento de sesión

De forma predeterminada, el endpoint es **sin estado por solicitud** (se genera una nueva clave de sesión en cada llamada).

Si la solicitud incluye una cadena `user` de OpenResponses, el Gateway deriva de ella una clave de sesión estable, por lo que las llamadas repetidas pueden compartir una sesión de agente.

## Forma de la solicitud (compatible)

La solicitud sigue la API de OpenResponses con entrada basada en elementos. Compatibilidad actual:

- `input`: cadena o arreglo de objetos de elemento.
- `instructions`: se fusiona en el prompt del sistema.
- `tools`: definiciones de herramientas del cliente (herramientas de función).
- `tool_choice`: `"auto"`, `"none"`, `"required"` o `{ "type": "function", "name": "..." }` para filtrar o requerir herramientas del cliente.
- `stream`: habilita streaming SSE.
- `max_output_tokens`: límite de salida de mejor esfuerzo (dependiente del proveedor).
- `temperature`: temperatura de muestreo de mejor esfuerzo reenviada al proveedor. Ignorada por el backend Codex Responses basado en ChatGPT, que usa muestreo fijo del lado del servidor.
- `top_p`: muestreo nucleus de mejor esfuerzo reenviado al proveedor. Misma salvedad de Codex Responses que `temperature`.
- `user`: enrutamiento de sesión estable.

Aceptados pero **actualmente ignorados**:

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

- `system` y `developer` se anexan al prompt del sistema.
- El elemento `user` o `function_call_output` más reciente se convierte en el "mensaje actual".
- Los mensajes anteriores de usuario/asistente se incluyen como historial para contexto.

### `function_call_output` (herramientas basadas en turnos)

Envía los resultados de herramientas de vuelta al modelo:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` e `item_reference`

Aceptados para compatibilidad de esquema, pero ignorados al construir el prompt.

## Herramientas (herramientas de función del lado del cliente)

Proporciona herramientas con `tools: [{ type: "function", name, description?, parameters? }]`.

Si el agente decide llamar a una herramienta, la respuesta devuelve un elemento de salida `function_call`.
Luego envía una solicitud de seguimiento con `function_call_output` para continuar el turno.

Para `tool_choice: "required"` y `tool_choice` fijado a una función, el endpoint limita el conjunto expuesto de herramientas de función del cliente, instruye al runtime para que llame a una herramienta del cliente antes de responder y rechaza el turno si no incluye una llamada estructurada coincidente a una herramienta del cliente. Este contrato se aplica a la lista HTTP `tools` proporcionada por el llamador, no a todas las herramientas internas de agente de OpenClaw. Las solicitudes sin streaming devuelven `502` con un `api_error`; las solicitudes con streaming emiten un evento `response.failed`. Esto coincide con el contrato de `/v1/chat/completions`.

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

- El contenido del archivo se decodifica y se agrega al **system prompt**, no al mensaje del usuario,
  por lo que permanece efímero (no se conserva en el historial de la sesión).
- El texto decodificado del archivo se envuelve como **contenido externo no confiable** antes de agregarse,
  por lo que los bytes del archivo se tratan como datos, no como instrucciones confiables.
- El bloque inyectado usa marcadores de límite explícitos como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e incluye una línea de metadatos
  `Source: External`.
- Esta ruta de entrada de archivos omite intencionalmente el banner largo `SECURITY NOTICE:` para
  preservar el presupuesto del prompt; los marcadores de límite y los metadatos siguen en su lugar.
- Los PDF se analizan primero para extraer texto. Si se encuentra poco texto, las primeras páginas se
  rasterizan en imágenes y se pasan al modelo, y el bloque de archivo inyectado usa
  el marcador de posición `[PDF content rendered to images]`.

El análisis de PDF lo proporciona el plugin incluido `document-extract`, que usa
`clawpdf` y su runtime PDFium WebAssembly empaquetado para la extracción de texto y
el renderizado de páginas.

Valores predeterminados de obtención de URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (total de partes `input_file` + `input_image` basadas en URL por solicitud)
- Las solicitudes están protegidas (resolución DNS, bloqueo de IP privadas, límites de redirección, tiempos de espera).
- Se admiten listas de permitidos opcionales de nombres de host por tipo de entrada (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host exacto: `"cdn.example.com"`
  - Subdominios comodín: `"*.assets.example.com"` (no coincide con el dominio raíz)
  - Las listas de permitidos vacías u omitidas significan que no hay restricción de lista de permitidos de nombres de host.
- Para deshabilitar por completo las obtenciones basadas en URL, establece `files.allowUrl: false` y/o `images.allowUrl: false`.

## Límites de archivos e imágenes (configuración)

Los valores predeterminados se pueden ajustar en `gateway.http.endpoints.responses`:

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
- Las fuentes HEIC/HEIF de `input_image` se aceptan cuando hay un conversor del sistema disponible y se normalizan a JPEG antes de la entrega al proveedor. Los conversores compatibles son `sips` de macOS, ImageMagick, GraphicsMagick o ffmpeg.

Nota de seguridad:

- Las listas de permitidos de URL se aplican antes de la obtención y en los saltos de redirección.
- Permitir un nombre de host no omite el bloqueo de IP privadas/internas.
- Para gateways expuestos a Internet, aplica controles de salida de red además de las protecciones a nivel de aplicación.
  Consulta [Seguridad](/es/gateway/security).

## Streaming (SSE)

Establece `stream: true` para recibir Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Cada línea de evento es `event: <type>` y `data: <json>`
- El flujo termina con `data: [DONE]`

Tipos de eventos emitidos actualmente:

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

## Uso

`usage` se rellena cuando el proveedor subyacente informa los recuentos de tokens.
OpenClaw normaliza alias comunes de estilo OpenAI antes de que esos contadores lleguen
a las superficies posteriores de estado/sesión, incluidos `input_tokens` / `output_tokens`
y `prompt_tokens` / `completion_tokens`.

## Errores

Los errores usan un objeto JSON como:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Casos comunes:

- `401` autenticación faltante/no válida
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

## Relacionado

- [Completions de chat de OpenAI](/es/gateway/openai-http-api)
- [OpenAI](/es/providers/openai)
