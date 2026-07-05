---
read_when:
    - Integración de clientes que usan la API OpenResponses
    - Quieres entradas basadas en elementos, llamadas a herramientas del cliente o eventos SSE
summary: Expón un endpoint HTTP /v1/responses compatible con OpenResponses desde Gateway
title: API de OpenResponses
x-i18n:
    generated_at: "2026-07-05T11:20:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

El Gateway puede servir un endpoint `POST /v1/responses` compatible con OpenResponses. Está **deshabilitado de forma predeterminada** y comparte su puerto con el Gateway (multiplexación WS + HTTP): `http://<gateway-host>:<port>/v1/responses`.

Las solicitudes se ejecutan como una ejecución normal de agente del Gateway (la misma ruta de código que `openclaw agent`), por lo que el enrutamiento, los permisos y la configuración coinciden con tu Gateway.

Habilítalo o deshabilítalo con `gateway.http.endpoints.responses.enabled`. Cuando está habilitado, la misma superficie de compatibilidad también sirve `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` y `POST /v1/chat/completions`.

## Autenticación, seguridad y enrutamiento

El comportamiento operativo coincide con [OpenAI Chat Completions](/es/gateway/openai-http-api):

- La ruta de autenticación coincide con `gateway.auth.mode`: shared-secret (`token`/`password`) usa `Authorization: Bearer <token-or-password>`; trusted-proxy usa encabezados de proxy conscientes de identidad (los proxies loopback del mismo host necesitan `gateway.auth.trustedProxy.allowLoopback = true`, con una alternativa directa del mismo host mediante `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` cuando no hay encabezado `Forwarded`/`X-Forwarded-*`/`X-Real-IP` presente); `none` en una entrada privada no necesita encabezado de autenticación. Consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).
- Trata el endpoint como acceso completo de operador a la instancia del gateway.
- Los modos de autenticación shared-secret ignoran un `x-openclaw-scopes` declarado por bearer más restringido y restauran el conjunto completo de ámbitos de operador predeterminado: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Los turnos de chat en este endpoint se tratan como turnos de remitente propietario.
- Los modos HTTP con identidad de confianza (trusted-proxy, o `gateway.auth.mode="none"`) respetan `x-openclaw-scopes` cuando está presente; de lo contrario, recurren al conjunto predeterminado de ámbitos de operador. La semántica de propietario solo se pierde cuando el llamador restringe explícitamente los ámbitos y omite `operator.admin`.
- Selecciona agentes con `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` o el encabezado `x-openclaw-agent-id`.
- Usa `x-openclaw-model` para anular el modelo backend del agente seleccionado (requiere `operator.admin` en rutas de autenticación con identidad).
- Usa `x-openclaw-session-key` para el enrutamiento explícito de sesión (se rechaza con `400 invalid_request_error` si usa un espacio de nombres reservado: `subagent:`, `cron:`, `acp:`).
- Usa `x-openclaw-message-channel` para un contexto de canal de entrada sintético no predeterminado.

Para la explicación canónica de los modelos dirigidos a agentes, `openclaw/default`, el paso directo de embeddings y las anulaciones de modelo backend, consulta [OpenAI Chat Completions](/es/gateway/openai-http-api#agent-first-model-contract).

Consulta [Ámbitos de operador](/es/gateway/operator-scopes) y [Seguridad](/es/gateway/security).

## Comportamiento de sesión

De forma predeterminada, el endpoint es **sin estado por solicitud** (se genera una nueva clave de sesión en cada llamada).

Si la solicitud incluye una cadena OpenResponses `user`, el Gateway deriva de ella una clave de sesión estable para que las llamadas repetidas puedan compartir una sesión de agente.

`previous_response_id` reutiliza la sesión de la respuesta anterior cuando la solicitud permanece dentro del mismo ámbito de agente/usuario/sesión solicitada (coincidencia por sujeto de autenticación, id de agente y `x-openclaw-session-key`).

## Forma de la solicitud

| Campo                                                            | Compatibilidad                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | Cadena o matriz de objetos de elemento.                                                                                               |
| `instructions`                                                   | Se fusiona en el prompt del sistema.                                                                                                 |
| `tools`                                                          | Definiciones de herramientas del cliente (herramientas de función).                                                                                      |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` o `{ "type": "function", "name": "..." }` para filtrar o requerir herramientas del cliente.                |
| `stream`                                                         | Habilita streaming SSE.                                                                                                         |
| `max_output_tokens`                                              | Límite de salida de mejor esfuerzo (dependiente del proveedor).                                                                                 |
| `temperature`                                                    | Temperatura de muestreo de mejor esfuerzo. Ignorada por el backend Codex Responses basado en ChatGPT, que usa muestreo fijo del lado del servidor. |
| `top_p`                                                          | Muestreo por núcleo de mejor esfuerzo. Misma salvedad de Codex Responses que `temperature`.                                                    |
| `user`                                                           | Enrutamiento de sesión estable.                                                                                                        |
| `previous_response_id`                                           | Continuidad de sesión (consulta arriba).                                                                                                |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Aceptados, pero actualmente ignorados.                                                                                                |

## Elementos (`input`)

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

Aceptados por compatibilidad de esquema, pero ignorados al construir el prompt.

## Herramientas (herramientas de función del lado del cliente)

Proporciona herramientas con `tools: [{ type: "function", name, description?, parameters? }]`.

Si el agente llama a una herramienta, la respuesta devuelve un elemento de salida `function_call`. Envía una solicitud de seguimiento con `function_call_output` para continuar el turno.

Para `tool_choice: "required"` y `tool_choice` fijado a una función, el endpoint restringe el conjunto expuesto de herramientas de función del cliente, instruye al runtime para que llame a una herramienta del cliente antes de responder y rechaza el turno si no incluye una llamada estructurada coincidente a una herramienta del cliente, de acuerdo con el contrato de `/v1/chat/completions`. Las solicitudes sin streaming devuelven `502` con un `api_error`; las solicitudes con streaming emiten un evento `response.failed`.

## Imágenes (`input_image`)

Admite fuentes base64 o URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Tipos MIME permitidos (predeterminado): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. Tamaño máximo (predeterminado): 10 MB.

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

Tipos MIME permitidos (predeterminado): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. Tamaño máximo (predeterminado): 5 MB.

Comportamiento actual:

- El contenido del archivo se decodifica y se agrega al **prompt del sistema**, no al mensaje de usuario, por lo que permanece efímero (no se persiste en el historial de sesión).
- El texto de archivo decodificado se envuelve como **contenido externo no confiable** antes de agregarse, por lo que los bytes del archivo se tratan como datos, no como instrucciones de confianza. El bloque inyectado usa marcadores de límite explícitos (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) y una línea de metadatos `Source: External`. Omite intencionalmente el banner largo `SECURITY NOTICE:` para preservar el presupuesto del prompt; los marcadores de límite y los metadatos siguen aplicándose.
- Los PDF se analizan primero para extraer texto. Si se encuentra poco texto, las primeras páginas se rasterizan como imágenes y se pasan al modelo, y el bloque de archivo inyectado usa el marcador de posición `[PDF content rendered to images]`.

El análisis de PDF lo proporciona el Plugin incluido `document-extract`, que usa `clawpdf` y su runtime PDFium WebAssembly empaquetado para la extracción de texto y el renderizado de páginas.

Valores predeterminados de recuperación de URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (total de partes `input_file` + `input_image` basadas en URL por solicitud)
- Las solicitudes están protegidas (resolución DNS, bloqueo de IP privadas, límites de redirección, tiempos de espera).
- Se admiten listas de permitidos de nombres de host opcionales por tipo de entrada (`files.urlAllowlist`, `images.urlAllowlist`): host exacto (`"cdn.example.com"`) o subdominios comodín (`"*.assets.example.com"`, no coincide con el apex). Las listas de permitidos vacías u omitidas significan que no hay restricción de lista de permitidos de nombres de host.
- Para deshabilitar por completo las recuperaciones basadas en URL, establece `files.allowUrl: false` y/o `images.allowUrl: false`.

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

Valores predeterminados cuando se omiten:

| Clave                    | Predeterminado |
| ------------------------ | --------- |
| `maxBodyBytes`           | 20 MB      |
| `maxUrlParts`            | 8         |
| `files.maxBytes`         | 5 MB       |
| `files.maxChars`         | 60k       |
| `files.maxRedirects`     | 3         |
| `files.timeoutMs`        | 10s       |
| `files.pdf.maxPages`     | 4         |
| `files.pdf.maxPixels`    | 4,000,000 |
| `files.pdf.minTextChars` | 200       |
| `images.maxBytes`        | 10 MB      |
| `images.maxRedirects`    | 3         |
| `images.timeoutMs`       | 10s       |

Las fuentes HEIC/HEIF `input_image` se normalizan a JPEG antes de entregarse al proveedor mediante el procesador de imágenes compartido de OpenClaw (Rastermill), que recurre a un conversor del sistema (`sips`, ImageMagick, GraphicsMagick o ffmpeg) para formatos que necesitan compatibilidad con códecs externos.

Nota de seguridad: las listas de permitidos de URL se aplican antes de la recuperación y en los saltos de redirección. Permitir un nombre de host no omite el bloqueo de IP privadas/internas. Para gateways expuestos a internet, aplica controles de salida de red además de las protecciones a nivel de aplicación. Consulta [Seguridad](/es/gateway/security).

## Streaming (SSE)

Establece `stream: true` para recibir Server-Sent Events:

- `Content-Type: text/event-stream`
- Cada línea de evento es `event: <type>` y `data: <json>`
- El flujo termina con `data: [DONE]`

Tipos de eventos emitidos actualmente: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (en caso de error).

## Uso

`usage` se completa cuando el proveedor subyacente informa recuentos de tokens. OpenClaw normaliza alias comunes de estilo OpenAI antes de que esos contadores lleguen a las superficies de estado/sesión posteriores, incluidos `input_tokens` / `output_tokens` y `prompt_tokens` / `completion_tokens`.

## Errores

Los errores usan un objeto JSON como:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Casos comunes: cuerpo de solicitud no válido `400`, autenticación faltante/no válida `401`, alcance de operador faltante `403`, método incorrecto `405`, demasiados intentos de autenticación fallidos `429` (con `Retry-After`).

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

- [Finalizaciones de chat de OpenAI](/es/gateway/openai-http-api)
- [Alcances de operador](/es/gateway/operator-scopes)
- [OpenAI](/es/providers/openai)
