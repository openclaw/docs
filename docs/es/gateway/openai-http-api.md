---
read_when:
    - Integración de herramientas que esperan OpenAI Chat Completions
summary: Exponer un endpoint HTTP /v1/chat/completions compatible con OpenAI desde el Gateway
title: Completions de chat de OpenAI
x-i18n:
    generated_at: "2026-06-27T11:31:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw's Gateway puede servir un pequeño endpoint de Chat Completions compatible con OpenAI.

Este endpoint está **deshabilitado de forma predeterminada**. Habilítalo primero en la configuración.

- `POST /v1/chat/completions`
- Mismo puerto que Gateway (multiplexación WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Cuando la superficie HTTP compatible con OpenAI de Gateway está habilitada, también sirve:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Internamente, las solicitudes se ejecutan como una ejecución normal de agente de Gateway (la misma ruta de código que `openclaw agent`), por lo que el enrutamiento, los permisos y la configuración coinciden con tu Gateway.

## Autenticación

Usa la configuración de autenticación de Gateway.

Rutas comunes de autenticación HTTP:

- autenticación con secreto compartido (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticación HTTP de confianza con identidad (`gateway.auth.mode="trusted-proxy"`):
  enruta a través del proxy configurado con conocimiento de identidad y permite que inyecte los
  encabezados de identidad requeridos
- autenticación abierta de ingreso privado (`gateway.auth.mode="none"`):
  no se requiere encabezado de autenticación

Notas:

- Cuando `gateway.auth.mode="token"`, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Cuando `gateway.auth.mode="password"`, usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Cuando `gateway.auth.mode="trusted-proxy"`, la solicitud HTTP debe venir de una
  fuente de proxy de confianza configurada; los proxies de loopback del mismo host requieren
  `gateway.auth.trustedProxy.allowLoopback = true` explícito.
- Los llamadores internos del mismo host que omiten el proxy pueden usar
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` como respaldo directo local.
  Cualquier evidencia de encabezado `Forwarded`, `X-Forwarded-*` o `X-Real-IP`
  mantiene la solicitud en la ruta de proxy de confianza en su lugar.
- Si `gateway.auth.rateLimit` está configurado y ocurren demasios fallos de autenticación, el endpoint devuelve `429` con `Retry-After`.

## Límite de seguridad (importante)

Trata este endpoint como una superficie de **acceso completo de operador** para la instancia de gateway.

- La autenticación HTTP bearer aquí no es un modelo de alcance estrecho por usuario.
- Un token/contraseña válido de Gateway para este endpoint debe tratarse como una credencial de propietario/operador.
- Las solicitudes pasan por la misma ruta de agente del plano de control que las acciones de operador de confianza.
- No hay un límite separado de herramientas para no propietarios/por usuario en este endpoint; una vez que un llamador supera la autenticación de Gateway aquí, OpenClaw trata a ese llamador como un operador de confianza para este gateway.
- Para modos de autenticación con secreto compartido (`token` y `password`), el endpoint restaura los valores predeterminados normales de operador completo incluso si el llamador envía un encabezado `x-openclaw-scopes` más estrecho.
- Los modos HTTP de confianza con identidad (por ejemplo, autenticación de proxy de confianza o `gateway.auth.mode="none"`) respetan `x-openclaw-scopes` cuando está presente y, de lo contrario, recurren al conjunto normal de alcances predeterminados de operador.
- Si la política del agente objetivo permite herramientas sensibles, este endpoint puede usarlas.
- Mantén este endpoint solo en loopback/tailnet/ingreso privado; no lo expongas directamente a la Internet pública.

Matriz de autenticación:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - prueba la posesión del secreto compartido de operador de gateway
  - ignora `x-openclaw-scopes` más estrechos
  - restaura el conjunto completo de alcances predeterminados de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata los turnos de chat en este endpoint como turnos enviados por el propietario
- modos HTTP de confianza con identidad (por ejemplo, autenticación de proxy de confianza, o `gateway.auth.mode="none"` en ingreso privado)
  - autentican alguna identidad externa de confianza o límite de despliegue
  - respetan `x-openclaw-scopes` cuando el encabezado está presente
  - recurren al conjunto normal de alcances predeterminados de operador cuando el encabezado está ausente
  - solo pierden la semántica de propietario cuando el llamador estrecha explícitamente los alcances y omite `operator.admin`
  - requieren `operator.admin` para controles de solicitud de nivel propietario como `x-openclaw-model`

Consulta [Seguridad](/es/gateway/security) y [Acceso remoto](/es/gateway/remote).

## Cuándo usar este endpoint

Usa `/v1/chat/completions` cuando integres herramientas o un backend de aplicación de confianza con un gateway existente y puedas conservar de forma segura credenciales de operador de gateway.

- Prefiere esto antes que añadir un nuevo canal integrado cuando tu integración es simplemente otra superficie de operador/cliente para el mismo gateway.
- Para clientes móviles nativos que se conectan directamente a un gateway remoto, prefiere [WebChat](/es/web/webchat) o el [Protocolo de Gateway](/es/gateway/protocol) e implementa el flujo de arranque de dispositivo emparejado/token de dispositivo para que el dispositivo no necesite un token/contraseña HTTP compartido.
- Crea un plugin de canal en su lugar cuando integres una red de mensajería externa con sus propios usuarios, salas, entrega por webhook o transporte saliente. Consulta [Crear plugins](/es/plugins/building-plugins).

## Contrato de modelo orientado al agente

OpenClaw trata el campo `model` de OpenAI como un **objetivo de agente**, no como un id de modelo de proveedor sin procesar.

- `model: "openclaw"` enruta al agente predeterminado configurado.
- `model: "openclaw/default"` también enruta al agente predeterminado configurado.
- `model: "openclaw/<agentId>"` enruta a un agente específico.

Encabezados opcionales de solicitud:

- `x-openclaw-model: <provider/model-or-bare-id>` anula el modelo de backend para el agente seleccionado. Los llamadores bearer con secreto compartido pueden usar este encabezado. Los llamadores con identidad, como solicitudes de proxy de confianza o de ingreso privado sin autenticación con `x-openclaw-scopes`, necesitan `operator.admin`; los llamadores solo de escritura reciben `403 missing scope: operator.admin`.
- `x-openclaw-agent-id: <agentId>` sigue siendo compatible como anulación de compatibilidad.
- `x-openclaw-session-key: <sessionKey>` controla explícitamente el enrutamiento de sesión. El valor no debe usar espacios de nombres internos de sesión reservados como `subagent:`, `cron:` o `acp:`; esas solicitudes se rechazan con `400 invalid_request_error`.
- `x-openclaw-message-channel: <channel>` establece el contexto sintético de canal de ingreso para prompts y políticas conscientes del canal.

Alias de compatibilidad que todavía se aceptan:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Habilitar el endpoint

Establece `gateway.http.endpoints.chatCompletions.enabled` en `true`:

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

## Deshabilitar el endpoint

Establece `gateway.http.endpoints.chatCompletions.enabled` en `false`:

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

## Comportamiento de sesión

De forma predeterminada, el endpoint es **sin estado por solicitud** (se genera una nueva clave de sesión en cada llamada).

Si la solicitud incluye una cadena `user` de OpenAI, Gateway deriva de ella una clave de sesión estable, de modo que las llamadas repetidas pueden compartir una sesión de agente.

Para aplicaciones personalizadas, el valor predeterminado más seguro es reutilizar el mismo valor de `user` por hilo de conversación. Evita identificadores de nivel de cuenta salvo que quieras explícitamente que varias conversaciones o dispositivos compartan una sesión de OpenClaw. Usa `x-openclaw-session-key` solo cuando necesites control explícito de enrutamiento entre varios clientes o hilos, y elige claves propiedad de la aplicación que no comiencen con espacios de nombres internos reservados como `subagent:`, `cron:` o `acp:`.

## Por qué importa esta superficie

Este es el conjunto de compatibilidad de mayor impacto para frontends y herramientas autoalojados:

- La mayoría de configuraciones de Open WebUI, LobeChat y LibreChat esperan `/v1/models`.
- Muchos sistemas RAG esperan `/v1/embeddings`.
- Los clientes de chat existentes de OpenAI normalmente pueden empezar con `/v1/chat/completions`.
- Cada vez más clientes nativos de agente prefieren `/v1/responses`.

## Lista de modelos y enrutamiento de agentes

<AccordionGroup>
  <Accordion title="¿Qué devuelve `/v1/models`?">
    Una lista de objetivos de agente de OpenClaw.

    Los ids devueltos son entradas `openclaw`, `openclaw/default` y `openclaw/<agentId>`.
    Úsalos directamente como valores `model` de OpenAI.

  </Accordion>
  <Accordion title="¿`/v1/models` lista agentes o subagentes?">
    Lista objetivos de agente de nivel superior, no modelos de proveedores de backend ni subagentes.

    Los subagentes siguen siendo topología interna de ejecución. No aparecen como seudomodelos.

  </Accordion>
  <Accordion title="¿Por qué se incluye `openclaw/default`?">
    `openclaw/default` es el alias estable para el agente predeterminado configurado.

    Eso significa que los clientes pueden seguir usando un id predecible aunque el id real del agente predeterminado cambie entre entornos.

  </Accordion>
  <Accordion title="¿Cómo anulo el modelo de backend?">
    Usa `x-openclaw-model`. Esta es una anulación de nivel propietario: funciona con la ruta de token/contraseña bearer de secreto compartido de Gateway y requiere `operator.admin` en rutas HTTP con identidad, como autenticación de proxy de confianza.

    Ejemplos:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Si lo omites, el agente seleccionado se ejecuta con su elección normal de modelo configurada.

  </Accordion>
  <Accordion title="¿Cómo encajan los embeddings en este contrato?">
    `/v1/embeddings` usa los mismos ids `model` de objetivo de agente.

    Usa `model: "openclaw/default"` o `model: "openclaw/<agentId>"`.
    Cuando necesites un modelo de embeddings específico, envíalo en `x-openclaw-model` desde un llamador con secreto compartido o un llamador con identidad que tenga `operator.admin`.
    Sin ese encabezado, la solicitud pasa a la configuración normal de embeddings del agente seleccionado.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Establece `stream: true` para recibir eventos Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Cada línea de evento es `data: <json>`
- El flujo termina con `data: [DONE]`

## Contrato de herramientas de chat

`/v1/chat/completions` admite un subconjunto de herramientas de función compatible con clientes comunes de OpenAI Chat.

### Campos de solicitud admitidos

- `tools`: array de `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`, `"required"` o `{ "type": "function", "function": { "name": "..." } }`
- turnos de seguimiento `messages[*].role: "tool"`
- `messages[*].tool_call_id` para vincular resultados de herramientas a una llamada de herramienta previa
- `max_completion_tokens`: número; límite por llamada para el total de tokens de finalización (incluidos los tokens de razonamiento). Nombre de campo actual de OpenAI Chat Completions; preferido cuando se envían tanto `max_completion_tokens` como `max_tokens`.
- `max_tokens`: número; alias heredado aceptado por compatibilidad hacia atrás. Se ignora cuando `max_completion_tokens` también está presente.
- `temperature`: número; temperatura de muestreo de mejor esfuerzo reenviada al proveedor upstream mediante el canal de parámetros de flujo del agente.
- `top_p`: número; muestreo nucleus de mejor esfuerzo reenviado al proveedor upstream mediante el canal de parámetros de flujo del agente.
- `frequency_penalty`: número; penalización de frecuencia de mejor esfuerzo reenviada al proveedor upstream mediante el canal de parámetros de flujo del agente. Rango validado: -2.0 a 2.0. Devuelve `400 invalid_request_error` para valores fuera de rango.
- `presence_penalty`: número; penalización de presencia de mejor esfuerzo reenviada al proveedor upstream mediante el canal de parámetros de flujo del agente. Rango validado: -2.0 a 2.0. Devuelve `400 invalid_request_error` para valores fuera de rango.
- `seed`: número (entero); semilla de mejor esfuerzo reenviada al proveedor upstream mediante el canal de parámetros de flujo del agente. Devuelve `400 invalid_request_error` para valores no enteros.
- `stop`: cadena o array de hasta 4 cadenas; secuencias de parada de mejor esfuerzo reenviadas al proveedor upstream mediante el canal de parámetros de flujo del agente. Devuelve `400 invalid_request_error` para más de 4 secuencias o entradas que no sean cadenas o estén vacías.

Cuando se establece cualquiera de los campos de límite de tokens, el valor se reenvía al proveedor ascendente mediante el canal stream-param del agente. El nombre real del campo enviado por cable al proveedor ascendente lo elige el transporte del proveedor: `max_completion_tokens` para endpoints de la familia OpenAI, y `max_tokens` para proveedores que solo aceptan el nombre heredado (como Mistral y Chutes). Los campos de muestreo (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) siguen el mismo canal stream-param; el backend Codex Responses basado en ChatGPT los elimina del lado del servidor porque usa muestreo fijo. `stop` también viaja por el canal stream-param y se asigna al campo de parada del transporte (`stop` para backends de Chat Completions, `stop_sequences` para Anthropic); la API Responses de OpenAI no tiene parámetro de parada, por lo que `stop` no se aplica en modelos respaldados por Responses.

### Variantes no compatibles

El endpoint devuelve `400 invalid_request_error` para variantes de herramientas no compatibles, incluidas:

- `tools` que no sea un arreglo
- entradas de herramientas que no sean funciones
- falta de `tool.function.name`
- variantes de `tool_choice` como `allowed_tools` y `custom`
- valores de `tool_choice.function.name` que no coinciden con las `tools` proporcionadas

Para `tool_choice: "required"` y `tool_choice` fijado a una función, el endpoint reduce el conjunto expuesto de herramientas de función del cliente, indica al runtime que llame a una herramienta del cliente antes de responder y devuelve un error si la respuesta del agente no incluye una llamada estructurada coincidente a una herramienta del cliente. Este contrato se aplica a la lista HTTP `tools` proporcionada por el llamador, no a todas las herramientas internas del agente de OpenClaw.

### Forma de respuesta de herramienta sin streaming

Cuando el agente decide llamar a herramientas, la respuesta usa:

- `choices[0].finish_reason = "tool_calls"`
- entradas `choices[0].message.tool_calls[]` con:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (cadena JSON)

El comentario del asistente antes de la llamada a la herramienta se devuelve en `choices[0].message.content` (posiblemente vacío).

### Forma de respuesta de herramienta con streaming

Cuando `stream: true`, las llamadas a herramientas se emiten como fragmentos SSE incrementales:

- delta inicial del rol del asistente
- deltas opcionales de comentario del asistente
- uno o más fragmentos `delta.tool_calls` que contienen la identidad de la herramienta y fragmentos de argumentos
- fragmento final con `finish_reason: "tool_calls"`
- `data: [DONE]`

Si `stream_options.include_usage=true`, se emite un fragmento final de uso antes de `[DONE]`.

### Bucle de seguimiento de herramientas

Después de recibir `tool_calls`, el cliente debe ejecutar las funciones solicitadas y enviar una solicitud de seguimiento que incluya:

- mensaje previo del asistente con llamada a herramienta
- uno o más mensajes `role: "tool"` con `tool_call_id` coincidente

Esto permite que la ejecución del agente del Gateway continúe el mismo bucle de razonamiento y produzca la respuesta final del asistente.

## Configuración rápida de Open WebUI

Para una conexión básica de Open WebUI:

- URL base: `http://127.0.0.1:18789/v1`
- URL base de Docker en macOS: `http://host.docker.internal:18789/v1`
- Clave de API: tu token bearer del Gateway
- Modelo: `openclaw/default`

Comportamiento esperado:

- `GET /v1/models` debe listar `openclaw/default`
- Open WebUI debe usar `openclaw/default` como id del modelo de chat
- Si quieres un proveedor/modelo de backend específico para ese agente, establece el modelo predeterminado normal del agente o envía `x-openclaw-model` desde un llamador con secreto compartido o un llamador con identidad que tenga `operator.admin`

Prueba rápida:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Si eso devuelve `openclaw/default`, la mayoría de las configuraciones de Open WebUI pueden conectarse con la misma URL base y el mismo token.

## Ejemplos

Sesión estable para una conversación de una aplicación:

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

Reutiliza el mismo valor de `user` en llamadas posteriores para esa conversación para continuar la misma sesión del agente.

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

Notas:

- `/v1/models` devuelve destinos de agentes de OpenClaw, no catálogos sin procesar de proveedores.
- `openclaw/default` siempre está presente para que un id estable funcione en todos los entornos.
- Las anulaciones de proveedor/modelo de backend pertenecen a `x-openclaw-model`, no al campo `model` de OpenAI. En rutas de autenticación HTTP con identidad, este encabezado requiere `operator.admin`.
- `/v1/embeddings` admite `input` como una cadena o un arreglo de cadenas.

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [OpenAI](/es/providers/openai)
