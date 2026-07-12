---
read_when:
    - Integración de clientes compatibles con la API OpenResponses
    - Quieres entradas basadas en elementos, llamadas a herramientas del cliente o eventos SSE
summary: Expón un endpoint HTTP `/v1/responses` compatible con OpenResponses desde el Gateway
title: API de OpenResponses
x-i18n:
    generated_at: "2026-07-11T23:06:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

El Gateway puede servir un endpoint `POST /v1/responses` compatible con OpenResponses. Está **deshabilitado de forma predeterminada** y comparte su puerto con el Gateway (multiplexación de WS + HTTP): `http://<gateway-host>:<port>/v1/responses`.

Las solicitudes se ejecutan como una ejecución normal de un agente del Gateway (la misma ruta de código que `openclaw agent`), por lo que el enrutamiento, los permisos y la configuración coinciden con los de tu Gateway.

Habilítalo o deshabilítalo con `gateway.http.endpoints.responses.enabled`. Cuando está habilitado, la misma superficie de compatibilidad también sirve `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` y `POST /v1/chat/completions`.

## Autenticación, seguridad y enrutamiento

El comportamiento operativo coincide con [Finalizaciones de chat de OpenAI](/es/gateway/openai-http-api):

- La ruta de autenticación coincide con `gateway.auth.mode`: el secreto compartido (`token`/`password`) usa `Authorization: Bearer <token-or-password>`; el proxy de confianza usa encabezados de proxy con información de identidad (los proxies de local loopback en el mismo host necesitan `gateway.auth.trustedProxy.allowLoopback = true`, con una alternativa directa en el mismo host mediante `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` cuando no hay ningún encabezado `Forwarded`/`X-Forwarded-*`/`X-Real-IP`); `none` en una entrada privada no necesita encabezado de autenticación. Consulta [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth).
- Trata el endpoint como acceso completo de operador a la instancia del Gateway.
- Los modos de autenticación con secreto compartido ignoran un `x-openclaw-scopes` más restringido declarado mediante bearer y restauran el conjunto completo predeterminado de ámbitos del operador: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Los turnos de chat en este endpoint se tratan como turnos enviados por el propietario.
- Los modos HTTP de confianza que portan identidad (proxy de confianza o `gateway.auth.mode="none"`) respetan `x-openclaw-scopes` cuando está presente; de lo contrario, recurren al conjunto predeterminado de ámbitos del operador. La semántica de propietario solo se pierde cuando el llamador restringe explícitamente los ámbitos y omite `operator.admin`.
- Selecciona agentes con `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` o el encabezado `x-openclaw-agent-id`.
- Usa `x-openclaw-model` para reemplazar el modelo de backend del agente seleccionado (requiere `operator.admin` en las rutas de autenticación que portan identidad).
- Usa `x-openclaw-session-key` para el enrutamiento explícito de sesiones (se rechaza con `400 invalid_request_error` si usa un espacio de nombres reservado: `subagent:`, `cron:`, `acp:`).
- Usa `x-openclaw-message-channel` para un contexto de canal de entrada sintético no predeterminado.

Para consultar la explicación canónica de los modelos dirigidos a agentes, `openclaw/default`, el paso directo de embeddings y los reemplazos de modelos de backend, consulta [Finalizaciones de chat de OpenAI](/es/gateway/openai-http-api#agent-first-model-contract).

Consulta [Ámbitos del operador](/es/gateway/operator-scopes) y [Seguridad](/es/gateway/security).

## Comportamiento de las sesiones

De forma predeterminada, el endpoint es **sin estado por solicitud** (se genera una nueva clave de sesión en cada llamada).

Si la solicitud incluye una cadena `user` de OpenResponses, el Gateway deriva de ella una clave de sesión estable para que las llamadas repetidas puedan compartir una sesión de agente.

`previous_response_id` reutiliza la sesión de la respuesta anterior cuando la solicitud permanece dentro del mismo ámbito de agente, usuario y sesión solicitada (según la coincidencia del sujeto de autenticación, el identificador del agente y `x-openclaw-session-key`).

## Estructura de la solicitud

| Campo                                                            | Compatibilidad                                                                                                                                            |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`                                                          | Cadena o matriz de objetos de elemento.                                                                                                                   |
| `instructions`                                                   | Se combina con el prompt del sistema.                                                                                                                     |
| `tools`                                                          | Definiciones de herramientas del cliente (herramientas de función).                                                                                       |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` o `{ "type": "function", "name": "..." }` para filtrar o exigir herramientas del cliente.                                |
| `stream`                                                         | Habilita la transmisión mediante SSE.                                                                                                                     |
| `max_output_tokens`                                              | Límite de salida de mejor esfuerzo (depende del proveedor).                                                                                               |
| `temperature`                                                    | Temperatura de muestreo de mejor esfuerzo. El backend Codex Responses basado en ChatGPT la ignora porque utiliza un muestreo fijo en el servidor.          |
| `top_p`                                                          | Muestreo de núcleo de mejor esfuerzo. Se aplica la misma salvedad de Codex Responses que para `temperature`.                                              |
| `user`                                                           | Enrutamiento estable de sesiones.                                                                                                                         |
| `previous_response_id`                                           | Continuidad de la sesión (consulta la explicación anterior).                                                                                              |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Se aceptan, pero actualmente se ignoran.                                                                                                                  |

## Elementos (`input`)

### `message`

Roles: `system`, `developer`, `user`, `assistant`.

- `system` y `developer` se añaden al prompt del sistema.
- El elemento `user` o `function_call_output` más reciente se convierte en el «mensaje actual».
- Los mensajes anteriores del usuario y del asistente se incluyen como historial para aportar contexto.

### `function_call_output` (herramientas basadas en turnos)

Devuelve los resultados de las herramientas al modelo:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` e `item_reference`

Se aceptan por compatibilidad con el esquema, pero se ignoran al crear el prompt.

## Herramientas (herramientas de función del lado del cliente)

Proporciona herramientas con `tools: [{ type: "function", name, description?, parameters? }]`.

Si el agente llama a una herramienta, la respuesta devuelve un elemento de salida `function_call`. Envía una solicitud posterior con `function_call_output` para continuar el turno.

Para `tool_choice: "required"` y un `tool_choice` fijado a una función, el endpoint restringe el conjunto expuesto de herramientas de función del cliente, indica al entorno de ejecución que llame a una herramienta del cliente antes de responder y rechaza el turno si no incluye una llamada estructurada coincidente a una herramienta del cliente, de acuerdo con el contrato de `/v1/chat/completions`. Las solicitudes sin transmisión devuelven `502` con un `api_error`; las solicitudes con transmisión emiten un evento `response.failed`.

## Imágenes (`input_image`)

Admite fuentes base64 o URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Tipos MIME permitidos (predeterminados): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. Tamaño máximo (predeterminado): 10 MB.

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

Tipos MIME permitidos (predeterminados): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. Tamaño máximo (predeterminado): 5 MB.

Comportamiento actual:

- El contenido del archivo se descodifica y se añade al **prompt del sistema**, no al mensaje del usuario, por lo que permanece efímero (no se conserva en el historial de la sesión).
- El texto descodificado del archivo se delimita como **contenido externo no confiable** antes de añadirlo, de modo que los bytes del archivo se tratan como datos, no como instrucciones de confianza. El bloque insertado utiliza marcadores de límite explícitos (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) y una línea de metadatos `Source: External`. Omite intencionadamente el extenso aviso `SECURITY NOTICE:` para preservar el presupuesto del prompt; los marcadores de límite y los metadatos siguen aplicándose.
- Primero se extrae el texto de los archivos PDF. Si se encuentra poco texto, las primeras páginas se rasterizan como imágenes y se pasan al modelo, y el bloque de archivo insertado usa el marcador de posición `[PDF content rendered to images]`.

El análisis de PDF lo proporciona el Plugin `document-extract` incluido, que utiliza `clawpdf` y su entorno de ejecución PDFium WebAssembly empaquetado para la extracción de texto y la representación de páginas.

Valores predeterminados de obtención mediante URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (número total de partes `input_file` + `input_image` basadas en URL por solicitud)
- Las solicitudes están protegidas (resolución DNS, bloqueo de direcciones IP privadas, límites de redirecciones y tiempos de espera).
- Se admiten listas opcionales de nombres de host permitidos por tipo de entrada (`files.urlAllowlist`, `images.urlAllowlist`): host exacto (`"cdn.example.com"`) o subdominios comodín (`"*.assets.example.com"`, no coincide con el dominio raíz). Las listas vacías u omitidas implican que no hay restricciones por lista de nombres de host permitidos.
- Para deshabilitar por completo la obtención basada en URL, establece `files.allowUrl: false` y/o `images.allowUrl: false`.

## Límites de archivos e imágenes (configuración)

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

| Clave                    | Valor predeterminado |
| ------------------------ | -------------------- |
| `maxBodyBytes`           | 20 MB                |
| `maxUrlParts`            | 8                    |
| `files.maxBytes`         | 5 MB                 |
| `files.maxChars`         | 60 000               |
| `files.maxRedirects`     | 3                    |
| `files.timeoutMs`        | 10 s                 |
| `files.pdf.maxPages`     | 4                    |
| `files.pdf.maxPixels`    | 4 000 000            |
| `files.pdf.minTextChars` | 200                  |
| `images.maxBytes`        | 10 MB                |
| `images.maxRedirects`    | 3                    |
| `images.timeoutMs`       | 10 s                 |

Las fuentes HEIC/HEIF de `input_image` se normalizan a JPEG antes de entregarlas al proveedor mediante el procesador de imágenes compartido de OpenClaw (Rastermill), que recurre a un conversor del sistema (`sips`, ImageMagick, GraphicsMagick o ffmpeg) para los formatos que necesitan compatibilidad con códecs externos.

Nota de seguridad: las listas de URL permitidas se aplican antes de la obtención y en cada salto de redirección. Permitir un nombre de host no evita el bloqueo de direcciones IP privadas o internas. Para Gateways expuestos a Internet, aplica controles de salida de red además de las protecciones de la aplicación. Consulta [Seguridad](/es/gateway/security).

## Transmisión (SSE)

Establece `stream: true` para recibir eventos enviados por el servidor:

- `Content-Type: text/event-stream`
- Cada línea de evento tiene el formato `event: <type>` y `data: <json>`
- El flujo termina con `data: [DONE]`

Tipos de eventos emitidos actualmente: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (en caso de error).

## Uso

`usage` se completa cuando el proveedor subyacente informa los recuentos de tokens. OpenClaw normaliza los alias habituales al estilo de OpenAI antes de que esos contadores lleguen a las superficies posteriores de estado y sesión, incluidos `input_tokens` / `output_tokens` y `prompt_tokens` / `completion_tokens`.

## Errores

Los errores usan un objeto JSON como este:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Casos habituales: `400` cuerpo de solicitud no válido, `401` autenticación ausente o no válida, `403` falta el ámbito de operador, `405` método incorrecto, `429` demasiados intentos de autenticación fallidos (con `Retry-After`).

## Ejemplos

Sin transmisión:

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

Con transmisión:

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

## Contenido relacionado

- [Finalizaciones de chat de OpenAI](/es/gateway/openai-http-api)
- [Ámbitos de operador](/es/gateway/operator-scopes)
- [OpenAI](/es/providers/openai)
