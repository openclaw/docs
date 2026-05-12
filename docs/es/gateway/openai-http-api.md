---
read_when:
    - Integrar herramientas que esperan OpenAI Chat Completions
summary: Exponer un punto de conexión HTTP /v1/chat/completions compatible con OpenAI desde el Gateway
title: Completados de chat de OpenAI
x-i18n:
    generated_at: "2026-05-12T15:43:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw's Gateway puede servir un pequeño endpoint de Chat Completions compatible con OpenAI.

Este endpoint está **deshabilitado de forma predeterminada**. Habilítalo primero en la configuración.

- `POST /v1/chat/completions`
- El mismo puerto que el Gateway (multiplexación WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Cuando la superficie HTTP compatible con OpenAI del Gateway está habilitada, también sirve:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Por debajo, las solicitudes se ejecutan como una ejecución normal de agente del Gateway (la misma ruta de código que `openclaw agent`), por lo que el enrutamiento, los permisos y la configuración coinciden con tu Gateway.

## Autenticación

Usa la configuración de autenticación del Gateway.

Rutas comunes de autenticación HTTP:

- autenticación con secreto compartido (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticación HTTP confiable con identidad (`gateway.auth.mode="trusted-proxy"`):
  enruta a través del proxy configurado con conocimiento de identidad y deja que inyecte los
  encabezados de identidad requeridos
- autenticación abierta de ingreso privado (`gateway.auth.mode="none"`):
  no se requiere encabezado de autenticación

Notas:

- Cuando `gateway.auth.mode="token"`, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Cuando `gateway.auth.mode="password"`, usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Cuando `gateway.auth.mode="trusted-proxy"`, la solicitud HTTP debe provenir de una
  fuente de proxy confiable configurada; los proxies de loopback del mismo host requieren
  `gateway.auth.trustedProxy.allowLoopback = true` explícito.
- Si `gateway.auth.rateLimit` está configurado y ocurren demasiados fallos de autenticación, el endpoint devuelve `429` con `Retry-After`.

## Límite de seguridad (importante)

Trata este endpoint como una superficie de **acceso completo de operador** para la instancia del gateway.

- La autenticación bearer HTTP aquí no es un modelo de alcance limitado por usuario.
- Un token/contraseña válido del Gateway para este endpoint debe tratarse como una credencial de propietario/operador.
- Las solicitudes se ejecutan a través de la misma ruta de agente de plano de control que las acciones de operador confiables.
- No hay un límite de herramientas separado de no propietario/por usuario en este endpoint; una vez que un llamador supera la autenticación del Gateway aquí, OpenClaw trata a ese llamador como un operador confiable para este gateway.
- Para los modos de autenticación con secreto compartido (`token` y `password`), el endpoint restaura los valores predeterminados normales de operador completo incluso si el llamador envía un encabezado `x-openclaw-scopes` más limitado.
- Los modos HTTP confiables con identidad (por ejemplo, autenticación de proxy confiable o `gateway.auth.mode="none"`) respetan `x-openclaw-scopes` cuando está presente y, de lo contrario, recurren al conjunto de alcances predeterminado normal del operador.
- Si la política del agente de destino permite herramientas sensibles, este endpoint puede usarlas.
- Mantén este endpoint solo en loopback/tailnet/ingreso privado; no lo expongas directamente a Internet pública.

Matriz de autenticación:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - demuestra posesión del secreto compartido de operador del gateway
  - ignora `x-openclaw-scopes` más limitados
  - restaura el conjunto completo de alcances predeterminados de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata los turnos de chat en este endpoint como turnos enviados por el propietario
- modos HTTP confiables con identidad (por ejemplo, autenticación de proxy confiable, o `gateway.auth.mode="none"` en ingreso privado)
  - autentican alguna identidad externa confiable o límite de despliegue
  - respetan `x-openclaw-scopes` cuando el encabezado está presente
  - recurren al conjunto de alcances predeterminado normal del operador cuando el encabezado está ausente
  - solo pierden semántica de propietario cuando el llamador limita explícitamente los alcances y omite `operator.admin`

Consulta [Seguridad](/es/gateway/security) y [Acceso remoto](/es/gateway/remote).

## Contrato de modelo centrado en agentes

OpenClaw trata el campo `model` de OpenAI como un **destino de agente**, no como un id de modelo de proveedor sin procesar.

- `model: "openclaw"` enruta al agente predeterminado configurado.
- `model: "openclaw/default"` también enruta al agente predeterminado configurado.
- `model: "openclaw/<agentId>"` enruta a un agente específico.

Encabezados opcionales de solicitud:

- `x-openclaw-model: <provider/model-or-bare-id>` sobrescribe el modelo de backend para el agente seleccionado.
- `x-openclaw-agent-id: <agentId>` sigue admitiéndose como sobrescritura de compatibilidad.
- `x-openclaw-session-key: <sessionKey>` controla completamente el enrutamiento de sesión.
- `x-openclaw-message-channel: <channel>` establece el contexto sintético de canal de ingreso para prompts y políticas con conocimiento de canal.

Alias de compatibilidad que aún se aceptan:

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

Si la solicitud incluye una cadena `user` de OpenAI, el Gateway deriva una clave de sesión estable a partir de ella, por lo que las llamadas repetidas pueden compartir una sesión de agente.

## Por qué importa esta superficie

Este es el conjunto de compatibilidad de mayor impacto para frontends y herramientas autoalojados:

- La mayoría de las configuraciones de Open WebUI, LobeChat y LibreChat esperan `/v1/models`.
- Muchos sistemas RAG esperan `/v1/embeddings`.
- Los clientes de chat existentes de OpenAI normalmente pueden empezar con `/v1/chat/completions`.
- Cada vez más clientes más nativos de agentes prefieren `/v1/responses`.

## Lista de modelos y enrutamiento de agentes

<AccordionGroup>
  <Accordion title="¿Qué devuelve `/v1/models`?">
    Una lista de destinos de agente de OpenClaw.

    Los ids devueltos son entradas `openclaw`, `openclaw/default` y `openclaw/<agentId>`.
    Úsalos directamente como valores `model` de OpenAI.

  </Accordion>
  <Accordion title="¿`/v1/models` lista agentes o subagentes?">
    Lista destinos de agente de nivel superior, no modelos de proveedor de backend ni subagentes.

    Los subagentes siguen siendo topología de ejecución interna. No aparecen como seudomodelos.

  </Accordion>
  <Accordion title="¿Por qué se incluye `openclaw/default`?">
    `openclaw/default` es el alias estable para el agente predeterminado configurado.

    Eso significa que los clientes pueden seguir usando un id predecible aunque el id real del agente predeterminado cambie entre entornos.

  </Accordion>
  <Accordion title="¿Cómo sobrescribo el modelo de backend?">
    Usa `x-openclaw-model`.

    Ejemplos:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Si lo omites, el agente seleccionado se ejecuta con su elección de modelo configurada normal.

  </Accordion>
  <Accordion title="¿Cómo encajan los embeddings en este contrato?">
    `/v1/embeddings` usa los mismos ids `model` de destino de agente.

    Usa `model: "openclaw/default"` o `model: "openclaw/<agentId>"`.
    Cuando necesites un modelo de embeddings específico, envíalo en `x-openclaw-model`.
    Sin ese encabezado, la solicitud pasa a la configuración normal de embeddings del agente seleccionado.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Establece `stream: true` para recibir eventos enviados por el servidor (SSE):

- `Content-Type: text/event-stream`
- Cada línea de evento es `data: <json>`
- El stream termina con `data: [DONE]`

## Contrato de herramientas de chat

`/v1/chat/completions` admite un subconjunto de herramientas de función compatible con clientes comunes de Chat de OpenAI.

### Campos de solicitud admitidos

- `tools`: array de `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- turnos de seguimiento `messages[*].role: "tool"`
- `messages[*].tool_call_id` para vincular resultados de herramientas a una llamada de herramienta anterior
- `max_completion_tokens`: número; límite por llamada para el total de tokens de finalización (incluidos tokens de razonamiento). Nombre de campo actual de Chat Completions de OpenAI; se prefiere cuando se envían tanto `max_completion_tokens` como `max_tokens`.
- `max_tokens`: número; alias heredado aceptado por compatibilidad hacia atrás. Se ignora cuando `max_completion_tokens` también está presente.

Cuando cualquiera de los campos está establecido, el valor se reenvía al proveedor upstream a través del canal de parámetros de stream del agente. El nombre real del campo enviado por cable al proveedor upstream lo elige el transporte del proveedor: `max_completion_tokens` para endpoints de la familia OpenAI, y `max_tokens` para proveedores que solo aceptan el nombre heredado (como Mistral y Chutes).

### Variantes no admitidas

El endpoint devuelve `400 invalid_request_error` para variantes de herramientas no admitidas, incluidas:

- `tools` que no sean arrays
- entradas de herramientas que no sean función
- falta de `tool.function.name`
- variantes de `tool_choice` como `allowed_tools` y `custom`
- `tool_choice: "required"` (aún no se aplica en tiempo de ejecución; se admitirá cuando se implemente la aplicación estricta)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (misma justificación que `required`)
- valores de `tool_choice.function.name` que no coinciden con las `tools` proporcionadas

### Forma de respuesta de herramientas sin streaming

Cuando el agente decide llamar herramientas, la respuesta usa:

- `choices[0].finish_reason = "tool_calls"`
- entradas `choices[0].message.tool_calls[]` con:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (cadena JSON)

El comentario del asistente antes de la llamada de herramienta se devuelve en `choices[0].message.content` (posiblemente vacío).

### Forma de respuesta de herramientas con streaming

Cuando `stream: true`, las llamadas de herramientas se emiten como fragmentos SSE incrementales:

- delta inicial del rol de asistente
- deltas opcionales de comentario del asistente
- uno o más fragmentos `delta.tool_calls` que transportan identidad de herramienta y fragmentos de argumentos
- fragmento final con `finish_reason: "tool_calls"`
- `data: [DONE]`

Si `stream_options.include_usage=true`, se emite un fragmento de uso final antes de `[DONE]`.

### Bucle de seguimiento de herramientas

Después de recibir `tool_calls`, el cliente debe ejecutar las funciones solicitadas y enviar una solicitud de seguimiento que incluya:

- mensaje de llamada de herramienta anterior del asistente
- uno o más mensajes `role: "tool"` con `tool_call_id` coincidente

Esto permite que la ejecución del agente del gateway continúe el mismo bucle de razonamiento y produzca la respuesta final del asistente.

## Configuración rápida de Open WebUI

Para una conexión básica de Open WebUI:

- URL base: `http://127.0.0.1:18789/v1`
- URL base de Docker en macOS: `http://host.docker.internal:18789/v1`
- Clave de API: tu token bearer del Gateway
- Modelo: `openclaw/default`

Comportamiento esperado:

- `GET /v1/models` debe listar `openclaw/default`
- Open WebUI debe usar `openclaw/default` como id del modelo de chat
- Si quieres un proveedor/modelo de backend específico para ese agente, establece el modelo predeterminado normal del agente o envía `x-openclaw-model`

Prueba rápida:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Si eso devuelve `openclaw/default`, la mayoría de las configuraciones de Open WebUI pueden conectarse con la misma URL base y token.

## Ejemplos

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

- `/v1/models` devuelve destinos de agentes de OpenClaw, no catálogos de proveedores sin procesar.
- `openclaw/default` siempre está presente para que un identificador estable funcione en todos los entornos.
- Las sustituciones de proveedor/modelo del backend se definen en `x-openclaw-model`, no en el campo `model` de OpenAI.
- `/v1/embeddings` admite `input` como cadena o matriz de cadenas.

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [OpenAI](/es/providers/openai)
