---
read_when:
    - Integración de herramientas que requieren OpenAI Chat Completions
summary: Expón un endpoint HTTP `/v1/chat/completions` compatible con OpenAI desde el Gateway
title: Finalizaciones de chat de OpenAI
x-i18n:
    generated_at: "2026-07-20T00:49:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc5a1a56972bb9070da0f8f60d6efd673cc1d1d516b730c55bc9d171fc7a5b3
    source_path: gateway/openai-http-api.md
    workflow: 16
---

El Gateway puede ofrecer una pequeña interfaz de Chat Completions compatible con OpenAI. Está **deshabilitada de forma predeterminada**.

Una vez habilitada, ofrece todo lo siguiente en el mismo puerto que el Gateway (multiplexación de WS + HTTP):

| Método | Ruta                   |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

Las solicitudes se ejecutan como una ejecución normal de un agente del Gateway (la misma ruta de código que `openclaw agent`), por lo que el enrutamiento, los permisos y la configuración coinciden con los del Gateway.

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

Establezca `enabled: false` (u omítalo) para deshabilitarlo.

## Límite de seguridad (importante)

Trate este endpoint como **acceso total de operador** a la instancia del Gateway:

- Un token o una contraseña válidos del Gateway para este endpoint equivalen a una credencial de propietario u operador, no a un ámbito limitado por usuario.
- Las solicitudes se ejecutan mediante la misma ruta del agente del plano de control que las acciones de operadores de confianza, por lo que, si la política del agente de destino permite herramientas sensibles, este endpoint puede utilizarlas.
- Manténgalo únicamente en loopback, tailnet o una entrada privada. No lo exponga a la Internet pública.

Matriz de autenticación:

| Ruta de autenticación                                                                                            | Comportamiento                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`                            | Demuestra la posesión del secreto compartido del Gateway. Ignora cualquier encabezado `x-openclaw-scopes` y restaura el conjunto completo de ámbitos predeterminados del operador: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Trata los turnos de chat como turnos enviados por el propietario. |
| HTTP de confianza con identidad (autenticación mediante proxy de confianza o `gateway.auth.mode="none"` en una entrada privada) | Respeta `x-openclaw-scopes` cuando está presente; cuando no está presente, recurre al conjunto predeterminado de ámbitos del operador. Solo pierde la semántica de propietario cuando el llamador restringe explícitamente los ámbitos y omite `operator.admin`. Requiere `operator.admin` para controles de nivel de propietario como `x-openclaw-model`.                        |

Consulte [Ámbitos del operador](/es/gateway/operator-scopes), [Seguridad](/es/gateway/security) y [Acceso remoto](/es/gateway/remote).

## Autenticación

Utiliza la configuración de autenticación del Gateway (consulte [Autenticación mediante proxy de confianza](/es/gateway/trusted-proxy-auth) para obtener detalles sobre ese modo):

| Modo                                | Cómo autenticarse                                                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. Se establece mediante `gateway.auth.token` o `OPENCLAW_GATEWAY_TOKEN`.                                                                                              |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. Se establece mediante `gateway.auth.password` o `OPENCLAW_GATEWAY_PASSWORD`.                                                                                     |
| `gateway.auth.mode="trusted-proxy"` | Enrute mediante el proxy configurado que reconoce identidades; este inyecta los encabezados de identidad necesarios. Los proxies de loopback en el mismo host necesitan `gateway.auth.trustedProxy.allowLoopback = true` explícito. |
| `gateway.auth.mode="none"`          | No se requiere un encabezado de autenticación (solo para entradas privadas).                                                                                                                                         |

Notas:

- Los llamadores del mismo host que omiten el proxy en un Gateway `trusted-proxy` pueden recurrir directamente a `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Cualquier evidencia de los encabezados `Forwarded`, `X-Forwarded-*` o `X-Real-IP` mantiene la solicitud en la ruta del proxy de confianza.
- Si `gateway.auth.rateLimit` está configurado y fallan demasiados intentos de autenticación, el endpoint devuelve `429` con un encabezado `Retry-After`.

## Cuándo utilizar este endpoint

- Prefiera esta opción en lugar de añadir un nuevo canal integrado cuando la integración sea simplemente otra interfaz de operador o cliente para el mismo Gateway.
- Para clientes móviles nativos que se conectan directamente a un Gateway remoto, prefiera [WebChat](/es/web/webchat) o el [Protocolo del Gateway](/es/gateway/protocol) con el flujo de arranque de dispositivo emparejado y token de dispositivo, de modo que el dispositivo no necesite un token o una contraseña HTTP compartidos.
- En su lugar, cree un plugin de canal al integrar una red de mensajería externa con sus propios usuarios, salas, entrega mediante Webhook o transporte saliente. Consulte [Creación de plugins](/es/plugins/building-plugins).

## Contrato de modelo centrado en el agente

OpenClaw trata el campo `model` de OpenAI como un **destino de agente**, no como un identificador de modelo del proveedor sin procesar.

| Valor de `model`                                | Se enruta a                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `openclaw`                                   | Agente predeterminado configurado                                                                                                 |
| `openclaw/default`                           | Agente predeterminado configurado (alias estable; se puede codificar de forma fija con seguridad aunque el identificador real del agente predeterminado cambie entre entornos) |
| `openclaw/<agentId>` o `openclaw:<agentId>` | Agente específico                                                                                                           |
| `agent:<agentId>`                            | Agente específico (alias de compatibilidad)                                                                                     |

Encabezados opcionales de la solicitud:

| Encabezado                                          | Efecto                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Sustituye el modelo de backend del agente seleccionado. Los llamadores bearer con secreto compartido pueden utilizarlo directamente; los llamadores con identidad (proxy de confianza o entrada privada sin autenticación con `x-openclaw-scopes`) necesitan `operator.admin`; de lo contrario, `403 missing scope: operator.admin`. |
| `x-openclaw-agent-id: <agentId>`                | Sustitución de compatibilidad para la selección del agente.                                                                                                                                                                                                                                 |
| `x-openclaw-session-key: <sessionKey>`          | Enrutamiento explícito de la sesión. Se rechaza con `400 invalid_request_error` si utiliza un espacio de nombres interno reservado (`subagent:`, `cron:`, `acp:`).                                                                                                                                |
| `x-openclaw-message-channel: <channel>`         | Establece el contexto del canal de entrada sintético para prompts o políticas que reconocen el canal.                                                                                                                                                                                              |

`/v1/models` enumera destinos de agentes de nivel superior (`openclaw`, `openclaw/default`, `openclaw/<agentId>`), no modelos de proveedores de backend ni subagentes; los subagentes permanecen como topología de ejecución interna. Si se omite `x-openclaw-model`, el agente seleccionado se ejecuta con su modelo configurado habitual.

`/v1/embeddings` utiliza los mismos identificadores `model` de destino del agente. Envíe `x-openclaw-model` (desde un llamador con secreto compartido o un llamador con identidad que tenga `operator.admin`) para elegir un modelo de embeddings específico; de lo contrario, la solicitud utiliza la configuración normal de embeddings del agente seleccionado.

## Comportamiento de las sesiones

De forma predeterminada, el endpoint es **sin estado por solicitud** (se genera una clave de sesión nueva en cada llamada).

Si la solicitud incluye una cadena `user` de OpenAI, el Gateway deriva de ella una clave de sesión estable para que las llamadas repetidas puedan compartir una sesión de agente. Para aplicaciones personalizadas, reutilice el mismo valor `user` en cada hilo de conversación; evite los identificadores de nivel de cuenta, salvo que se quiera que varias conversaciones o dispositivos compartan una única sesión de OpenClaw. Utilice `x-openclaw-session-key` únicamente cuando necesite un control explícito del enrutamiento entre varios clientes o hilos, con claves propiedad de la aplicación que eviten los espacios de nombres reservados indicados anteriormente.

## Límites de las solicitudes

El endpoint utiliza límites integrados de 20 MB por cuerpo de solicitud, 8 partes `image_url`
del mensaje de usuario más reciente y 20 MB de datos de imagen decodificados
acumulados. La política de fuentes de imágenes sigue siendo configurable en
`gateway.http.endpoints.chatCompletions.images`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
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

La configuración de imágenes tiene los siguientes valores predeterminados:

| Clave                   | Valor predeterminado                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `images.allowUrl`     | `false` (las partes `image_url` procedentes de una URL se rechazan salvo que se habiliten) |
| `images.maxBytes`     | 10MB por imagen                                                      |
| `images.maxRedirects` | 3                                                                   |
| `images.timeoutMs`    | 10s                                                                 |

Las fuentes `image_url` HEIC/HEIF se aceptan y se normalizan a JPEG antes de entregarlas al proveedor mediante el procesador de imágenes compartido de OpenClaw (Rastermill), que recurre a un conversor del sistema (`sips`, ImageMagick, GraphicsMagick o ffmpeg) para los formatos que necesitan compatibilidad con códecs externos.

Nota de seguridad: incluir un nombre de host en una lista de permitidos no evita el bloqueo de direcciones IP privadas o internas. En Gateways expuestos a Internet, aplique controles de salida de red además de las protecciones de la aplicación. Consulte [Seguridad](/es/gateway/security).

## Contrato de herramientas de chat

`/v1/chat/completions` admite un subconjunto de herramientas de función compatible con clientes comunes de Chat de OpenAI.

### Campos de solicitud compatibles

| Campo                      | Notas                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | Matriz de `{ "type": "function", "function": { ... } }`                                                                                        |
| `tool_choice`              | `"auto"`, `"none"`, `"required"` o `{ "type": "function", "function": { "name": "..." } }`                                                  |
| `messages[*].role: "tool"` | Turnos de seguimiento                                                                                                                               |
| `messages[*].tool_call_id` | Vincula el resultado de una herramienta con una llamada anterior a una herramienta                                                                                                 |
| `max_completion_tokens`    | Número; límite por llamada del total de tokens de finalización (incluidos los tokens de razonamiento). Nombre de campo actual; se utiliza cuando se envían tanto este como `max_tokens`. |
| `max_tokens`               | Número; alias heredado, se ignora cuando también está presente `max_completion_tokens`.                                                                   |
| `temperature`              | Número de 0 a 2; mejor esfuerzo, se reenvía al proveedor ascendente. `400 invalid_request_error` si está fuera del intervalo.                                     |
| `top_p`                    | Número de 0 a 1; mejor esfuerzo. `400 invalid_request_error` si está fuera del intervalo.                                                                         |
| `frequency_penalty`        | Número de -2.0 a 2.0; mejor esfuerzo. `400 invalid_request_error` si está fuera del intervalo.                                                                 |
| `presence_penalty`         | Número de -2.0 a 2.0; mejor esfuerzo. `400 invalid_request_error` si está fuera del intervalo.                                                                 |
| `seed`                     | Entero; mejor esfuerzo. `400 invalid_request_error` para valores no enteros.                                                                     |
| `stop`                     | Cadena o matriz de hasta 4 cadenas; mejor esfuerzo. `400 invalid_request_error` para más de 4 secuencias o entradas que no sean cadenas o estén vacías.           |

Todos los campos de muestreo y límite de tokens utilizan el mismo canal de parámetros de flujo del agente y se reenvían con el mejor esfuerzo:

- Límite de tokens: el nombre del campo de protocolo lo elige el transporte del proveedor: `max_completion_tokens` para los endpoints de la familia OpenAI, `max_tokens` para los proveedores que solo aceptan el nombre heredado (Mistral, Chutes).
- `stop` se asigna al campo de detención del transporte: `stop` para backends de Chat Completions, `stop_sequences` para Anthropic. La API Responses de OpenAI no tiene ningún parámetro de detención, por lo que `stop` no se aplica a los modelos basados en Responses.
- El backend Codex Responses basado en ChatGPT utiliza muestreo fijo del lado del servidor y elimina `temperature`/`top_p` (junto con `max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`) antes de que la solicitud llegue a ese backend.

### Variantes no compatibles

Devuelve `400 invalid_request_error` para:

- `tools` que no sean matrices, entradas de herramientas que no sean funciones o ausencia de `tool.function.name`
- variantes de `tool_choice` como `allowed_tools` y `custom`
- valores de `tool_choice.function.name` que no coincidan con una herramienta proporcionada

Para `tool_choice: "required"` y `tool_choice` fijado a una función, el endpoint restringe el conjunto de herramientas de función del cliente expuesto, indica al entorno de ejecución que llame a una herramienta del cliente antes de responder y genera un error si la respuesta del agente no contiene una llamada estructurada coincidente a una herramienta del cliente. Esto se aplica a la lista HTTP `tools` proporcionada por quien realiza la llamada, no a todas las herramientas internas del agente de OpenClaw.

### Formato de respuesta de herramienta sin streaming

Cuando el agente llama a herramientas, la respuesta utiliza:

- `choices[0].finish_reason = "tool_calls"`
- entradas de `choices[0].message.tool_calls[]` con `id`, `type: "function"`, `function.name`, `function.arguments` (cadena JSON)
- Comentario del asistente anterior a la llamada a la herramienta, en `choices[0].message.content` (posiblemente vacío)

### Formato de respuesta de herramienta con streaming

Cuando `stream: true`, las llamadas a herramientas llegan como fragmentos SSE incrementales: un delta inicial del rol del asistente, deltas opcionales de comentarios del asistente, uno o más fragmentos de `delta.tool_calls` que contienen la identidad de la herramienta y fragmentos de argumentos, seguidos de un fragmento final con `finish_reason: "tool_calls"` y `data: [DONE]`.

Si `stream_options.include_usage=true`, se emite un fragmento final de uso antes de `[DONE]`.

### Bucle de seguimiento de herramientas

Después de recibir `tool_calls`, ejecute las funciones solicitadas y envíe una solicitud de seguimiento que incluya el mensaje anterior de llamada a herramienta del asistente, además de uno o más mensajes `role: "tool"` con un `tool_call_id` coincidente. Esto continúa el mismo bucle de razonamiento del agente para producir la respuesta final.

## Streaming (SSE)

Establezca `stream: true` para recibir eventos enviados por el servidor:

- `Content-Type: text/event-stream`
- Cada línea de evento es `data: <json>`
- El flujo termina con `data: [DONE]`

## Configuración rápida de Open WebUI

- URL base: `http://127.0.0.1:18789/v1`
- URL base de Docker en macOS: `http://host.docker.internal:18789/v1`
- Clave de API: su token de portador del Gateway
- Modelo: `openclaw/default`

Comportamiento esperado: `GET /v1/models` muestra `openclaw/default` y Open WebUI lo utiliza como identificador del modelo de chat. Para un proveedor/modelo de backend específico, establezca el modelo predeterminado habitual del agente o envíe `x-openclaw-model` (quien realiza la llamada con secreto compartido o con identidad y `operator.admin`).

Prueba rápida de funcionamiento:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Si devuelve `openclaw/default`, la mayoría de las configuraciones de Open WebUI pueden conectarse con la misma URL base y el mismo token.

## Ejemplos

Sesión estable para una conversación de una aplicación:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Resume mis tareas de hoy"}]
  }'
```

Reutilice el mismo valor de `user` en llamadas posteriores de esa conversación para continuar la misma sesión del agente.

Sin streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hola"}]
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
    "messages": [{"role":"user","content":"hola"}]
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

Crear incrustaciones:

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

`/v1/embeddings` admite `input` como cadena o matriz de cadenas.

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Ámbitos del operador](/es/gateway/operator-scopes)
- [OpenAI](/es/providers/openai)
