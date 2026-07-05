---
read_when:
    - Integración de herramientas que esperan OpenAI Chat Completions
summary: Exponer un endpoint HTTP compatible con OpenAI `/v1/chat/completions` desde el Gateway
title: Completions de chat de OpenAI
x-i18n:
    generated_at: "2026-07-05T11:20:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

El Gateway puede servir una pequeña superficie de Chat Completions compatible con OpenAI. Está **deshabilitada de forma predeterminada**.

Una vez habilitada, sirve todo esto en el mismo puerto que el Gateway (multiplexación WS + HTTP):

| Método | Ruta                   |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

Las solicitudes se ejecutan como una ejecución normal de agente de Gateway (la misma ruta de código que `openclaw agent`), por lo que el enrutamiento, los permisos y la configuración coinciden con tu Gateway.

## Habilitar el endpoint

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

Establece `enabled: false` (u omítelo) para deshabilitarlo.

## Límite de seguridad (importante)

Trata este endpoint como **acceso completo de operador** a la instancia de gateway:

- Un token/contraseña de Gateway válido para este endpoint equivale a una credencial de propietario/operador, no a un alcance estrecho por usuario.
- Las solicitudes pasan por la misma ruta de agente del plano de control que las acciones de operador de confianza, por lo que, si la política del agente de destino permite herramientas sensibles, este endpoint puede usarlas.
- Mantenlo solo en loopback/tailnet/entrada privada. No lo expongas a la internet pública.

Matriz de autenticación:

| Ruta de autenticación                                                                                 | Comportamiento                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`                              | Demuestra la posesión del secreto compartido del gateway. Ignora cualquier encabezado `x-openclaw-scopes` y restaura el conjunto completo de alcances de operador predeterminado: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Trata los turnos de chat como turnos enviados por el propietario. |
| HTTP de confianza con identidad (autenticación de proxy de confianza, o `gateway.auth.mode="none"` en entrada privada) | Respeta `x-openclaw-scopes` cuando está presente; si falta, recurre al conjunto de alcances de operador predeterminado. Solo pierde la semántica de propietario cuando el llamador estrecha explícitamente los alcances y omite `operator.admin`. Requiere `operator.admin` para controles de nivel de propietario como `x-openclaw-model`.                                  |

Consulta [Alcances de operador](/es/gateway/operator-scopes), [Seguridad](/es/gateway/security) y [Acceso remoto](/es/gateway/remote).

## Autenticación

Usa la configuración de autenticación del Gateway (consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth) para los detalles de ese modo):

| Modo                                | Cómo autenticarse                                                                                                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. Configúralo mediante `gateway.auth.token` u `OPENCLAW_GATEWAY_TOKEN`.                                                                             |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. Configúralo mediante `gateway.auth.password` u `OPENCLAW_GATEWAY_PASSWORD`.                                                                   |
| `gateway.auth.mode="trusted-proxy"` | Enruta a través del proxy configurado con conocimiento de identidad; este inyecta los encabezados de identidad requeridos. Los proxies de loopback del mismo host necesitan `gateway.auth.trustedProxy.allowLoopback = true` explícito. |
| `gateway.auth.mode="none"`          | No se requiere encabezado de autenticación (solo entrada privada).                                                                                                                 |

Notas:

- Los llamadores del mismo host que omiten el proxy en un gateway `trusted-proxy` pueden recurrir directamente a `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Cualquier evidencia de encabezado `Forwarded`, `X-Forwarded-*` o `X-Real-IP` mantiene la solicitud en la ruta de proxy de confianza.
- Si `gateway.auth.rateLimit` está configurado y fallan demasiados intentos de autenticación, el endpoint devuelve `429` con un encabezado `Retry-After`.

## Cuándo usar este endpoint

- Prefiere esto antes que añadir un nuevo canal integrado cuando tu integración sea solo otra superficie de operador/cliente para el mismo gateway.
- Para clientes móviles nativos que se conectan directamente a un gateway remoto, prefiere [WebChat](/es/web/webchat) o el [Protocolo de Gateway](/es/gateway/protocol) con el flujo de arranque de dispositivo emparejado/token de dispositivo, para que el dispositivo no necesite un token/contraseña HTTP compartido.
- En su lugar, crea un plugin de canal cuando integres una red de mensajería externa con sus propios usuarios, salas, entrega por webhook o transporte saliente. Consulta [Crear plugins](/es/plugins/building-plugins).

## Contrato de modelo centrado en agentes

OpenClaw trata el campo `model` de OpenAI como un **destino de agente**, no como un id de modelo de proveedor sin procesar.

| Valor de `model`                            | Enruta a                                                                                                                    |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `openclaw`                                  | Agente predeterminado configurado                                                                                           |
| `openclaw/default`                          | Agente predeterminado configurado (alias estable; seguro de hardcodear incluso si el id real del agente predeterminado cambia entre entornos) |
| `openclaw/<agentId>` o `openclaw:<agentId>` | Agente específico                                                                                                           |
| `agent:<agentId>`                           | Agente específico (alias de compatibilidad)                                                                                 |

Encabezados de solicitud opcionales:

| Encabezado                                      | Efecto                                                                                                                                                                                                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Sobrescribe el modelo de backend para el agente seleccionado. Los llamadores bearer con secreto compartido pueden usarlo directamente; los llamadores con identidad (proxy de confianza, o entrada privada sin autenticación con `x-openclaw-scopes`) necesitan `operator.admin`; de lo contrario, `403 missing scope: operator.admin`. |
| `x-openclaw-agent-id: <agentId>`                | Sobrescritura de compatibilidad para la selección de agente.                                                                                                                                                                                                                    |
| `x-openclaw-session-key: <sessionKey>`          | Enrutamiento de sesión explícito. Se rechaza con `400 invalid_request_error` si usa un espacio de nombres interno reservado (`subagent:`, `cron:`, `acp:`).                                                                                                                     |
| `x-openclaw-message-channel: <channel>`         | Establece el contexto sintético de canal de entrada para prompts/políticas conscientes del canal.                                                                                                                                                                               |

`/v1/models` lista destinos de agente de nivel superior (`openclaw`, `openclaw/default`, `openclaw/<agentId>`), no modelos de proveedores de backend ni subagentes; los subagentes permanecen como topología de ejecución interna. Si omites `x-openclaw-model`, el agente seleccionado se ejecuta con su modelo configurado normal.

`/v1/embeddings` usa los mismos ids de `model` de destino de agente. Envía `x-openclaw-model` (desde un llamador con secreto compartido, o un llamador con identidad con `operator.admin`) para elegir un modelo de embeddings específico; de lo contrario, la solicitud usa la configuración normal de embeddings del agente seleccionado.

## Comportamiento de sesión

De forma predeterminada, el endpoint es **sin estado por solicitud** (se genera una nueva clave de sesión en cada llamada).

Si la solicitud incluye una cadena `user` de OpenAI, el Gateway deriva una clave de sesión estable a partir de ella para que las llamadas repetidas puedan compartir una sesión de agente. Para aplicaciones personalizadas, reutiliza el mismo valor de `user` por hilo de conversación; evita identificadores de nivel de cuenta salvo que quieras que varias conversaciones/dispositivos compartan una sesión de OpenClaw. Usa `x-openclaw-session-key` solo cuando necesites control de enrutamiento explícito entre varios clientes/hilos, con claves propiedad de la aplicación que eviten los espacios de nombres reservados anteriores.

## Límites de solicitud (configuración)

Los valores predeterminados se pueden ajustar bajo `gateway.http.endpoints.chatCompletions`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxImageParts: 8,
          maxTotalImageBytes: 20000000,
          images: {
            allowUrl: false,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
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

| Clave                 | Predeterminado                                                              |
| --------------------- | --------------------------------------------------------------------------- |
| `maxBodyBytes`        | 20MB                                                                        |
| `maxImageParts`       | 8 (máx. partes `image_url` leídas del mensaje de usuario más reciente)      |
| `maxTotalImageBytes`  | 20MB (bytes decodificados acumulados entre todas las partes `image_url` en una solicitud) |
| `images.allowUrl`     | `false` (las partes `image_url` originadas en URL se rechazan salvo que estén habilitadas) |
| `images.maxBytes`     | 10MB por imagen                                                             |
| `images.maxRedirects` | 3                                                                           |
| `images.timeoutMs`    | 10s                                                                         |

Las fuentes HEIC/HEIF de `image_url` se aceptan y se normalizan a JPEG antes de entregarlas al proveedor mediante el procesador de imágenes compartido de OpenClaw (Rastermill), que recurre a un conversor del sistema (`sips`, ImageMagick, GraphicsMagick o ffmpeg) para formatos que necesitan compatibilidad con códecs externos.

Nota de seguridad: incluir un nombre de host en la lista de permitidos no omite el bloqueo de IP privadas/internas. Para gateways expuestos a internet, aplica controles de egreso de red además de las protecciones a nivel de aplicación. Consulta [Seguridad](/es/gateway/security).

## Contrato de herramientas de chat

`/v1/chat/completions` admite un subconjunto de herramientas de función compatible con clientes comunes de OpenAI Chat.

### Campos de solicitud admitidos

| Campo                      | Notas                                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | Array de `{ "type": "function", "function": { ... } }`                                                                                                                     |
| `tool_choice`              | `"auto"`, `"none"`, `"required"` o `{ "type": "function", "function": { "name": "..." } }`                                                                                 |
| `messages[*].role: "tool"` | Turnos de seguimiento                                                                                                                                                      |
| `messages[*].tool_call_id` | Vincula el resultado de una herramienta con una llamada previa a herramienta                                                                                               |
| `max_completion_tokens`    | Número; límite por llamada sobre el total de tokens de finalización (tokens de razonamiento incluidos). Nombre de campo actual; se usa cuando también se envía `max_tokens`. |
| `max_tokens`               | Número; alias heredado, se ignora cuando `max_completion_tokens` también está presente.                                                                                    |
| `temperature`              | Número 0-2; máximo esfuerzo, se reenvía al proveedor upstream. `400 invalid_request_error` si está fuera de rango.                                                        |
| `top_p`                    | Número 0-1; máximo esfuerzo. `400 invalid_request_error` si está fuera de rango.                                                                                          |
| `frequency_penalty`        | Número -2.0 a 2.0; máximo esfuerzo. `400 invalid_request_error` si está fuera de rango.                                                                                    |
| `presence_penalty`         | Número -2.0 a 2.0; máximo esfuerzo. `400 invalid_request_error` si está fuera de rango.                                                                                    |
| `seed`                     | Entero; máximo esfuerzo. `400 invalid_request_error` para valores no enteros.                                                                                              |
| `stop`                     | Cadena o array de hasta 4 cadenas; máximo esfuerzo. `400 invalid_request_error` para más de 4 secuencias o entradas que no sean cadenas o estén vacías.                    |

Todos los campos de muestreo y límite de tokens viajan por el mismo canal de parámetros de stream del agente y se reenvían con máximo esfuerzo:

- Límite de tokens: el transporte del proveedor elige el nombre del campo en la conexión: `max_completion_tokens` para endpoints de la familia OpenAI, `max_tokens` para proveedores que solo aceptan el nombre heredado (Mistral, Chutes).
- `stop` se asigna al campo de parada del transporte: `stop` para backends de Chat Completions, `stop_sequences` para Anthropic. La OpenAI Responses API no tiene parámetro de parada, por lo que `stop` no se aplica en modelos respaldados por Responses.
- El backend Codex Responses basado en ChatGPT usa muestreo fijo del lado del servidor y elimina `temperature`/`top_p` (junto con `max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`) antes de que la solicitud llegue a ese backend.

### Variantes no admitidas

Devuelve `400 invalid_request_error` para:

- `tools` que no sea un array, entradas de herramientas que no sean de función, o falta de `tool.function.name`
- variantes de `tool_choice` como `allowed_tools` y `custom`
- valores de `tool_choice.function.name` que no coinciden con una herramienta proporcionada

Para `tool_choice: "required"` y `tool_choice` fijado a función, el endpoint restringe el conjunto de herramientas de función de cliente expuesto, indica al runtime que llame a una herramienta de cliente antes de responder y genera un error si la respuesta del agente no tiene una llamada estructurada coincidente a herramienta de cliente. Esto se aplica a la lista HTTP `tools` proporcionada por el llamador, no a todas las herramientas internas del agente de OpenClaw.

### Forma de respuesta de herramienta sin streaming

Cuando el agente llama a herramientas, la respuesta usa:

- `choices[0].finish_reason = "tool_calls"`
- entradas `choices[0].message.tool_calls[]` con `id`, `type: "function"`, `function.name`, `function.arguments` (cadena JSON)
- comentario del asistente antes de la llamada a herramienta, en `choices[0].message.content` (posiblemente vacío)

### Forma de respuesta de herramienta con streaming

Cuando `stream: true`, las llamadas a herramientas llegan como fragmentos SSE incrementales: un delta inicial de rol de asistente, deltas opcionales de comentario del asistente, uno o más fragmentos `delta.tool_calls` que llevan la identidad de la herramienta y fragmentos de argumentos, luego un fragmento final con `finish_reason: "tool_calls"` y `data: [DONE]`.

Si `stream_options.include_usage=true`, se emite un fragmento final de uso antes de `[DONE]`.

### Bucle de seguimiento de herramientas

Después de recibir `tool_calls`, ejecuta las funciones solicitadas y envía una solicitud de seguimiento que incluya el mensaje previo de llamada a herramienta del asistente más uno o más mensajes `role: "tool"` con `tool_call_id` coincidente. Esto continúa el mismo bucle de razonamiento del agente para producir la respuesta final.

## Streaming (SSE)

Establece `stream: true` para recibir Server-Sent Events:

- `Content-Type: text/event-stream`
- Cada línea de evento es `data: <json>`
- El stream termina con `data: [DONE]`

## Configuración rápida de Open WebUI

- URL base: `http://127.0.0.1:18789/v1`
- URL base de Docker en macOS: `http://host.docker.internal:18789/v1`
- Clave de API: tu token bearer de Gateway
- Modelo: `openclaw/default`

Comportamiento esperado: `GET /v1/models` lista `openclaw/default`, y Open WebUI lo usa como id de modelo de chat. Para un proveedor/modelo de backend específico, establece el modelo predeterminado normal del agente o envía `x-openclaw-model` (llamador con secreto compartido, o llamador con identidad y `operator.admin`).

Prueba rápida de humo:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Si eso devuelve `openclaw/default`, la mayoría de las configuraciones de Open WebUI pueden conectarse con la misma URL base y token.

## Ejemplos

Sesión estable para una conversación de una app:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

Reutiliza el mismo valor `user` en llamadas posteriores para esa conversación para continuar la misma sesión de agente.

Sin streaming:

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

Listar modelos:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Obtener un modelo:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Crear embeddings:

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

`/v1/embeddings` admite `input` como cadena o array de cadenas.

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Ámbitos de operador](/es/gateway/operator-scopes)
- [OpenAI](/es/providers/openai)
