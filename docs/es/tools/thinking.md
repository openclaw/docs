---
read_when:
    - Ajuste del análisis de directivas o de los valores predeterminados de pensamiento, modo rápido o modo detallado
summary: Sintaxis de las directivas /think, /fast, /verbose, /trace y visibilidad del razonamiento
title: Niveles de razonamiento
x-i18n:
    generated_at: "2026-07-19T02:27:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bb2a4ed4179e115c184d89ecf3a0a22379d3d0dad4a4838d9c5db851e1334728
    source_path: tools/thinking.md
    workflow: 16
---

## Qué hace

- Directiva en línea en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, que reflejan aproximadamente la clásica escala de palabras mágicas de Anthropic «think» < «think hard» < «think harder» < «ultrathink»:
  - minimal ~ «think»
  - low ~ «think hard»
  - medium ~ «think harder»
  - high ~ «ultrathink» (presupuesto máximo)
  - xhigh ~ «ultrathink+» (modelos GPT-5.2+ y Codex, además del esfuerzo de Anthropic Claude Opus 4.7+)
  - adaptive → pensamiento adaptativo gestionado por el proveedor (compatible con Claude 4.6 en Anthropic/Bedrock, Anthropic Claude Opus 4.7+ y el pensamiento dinámico de Google Gemini)
  - max → razonamiento máximo del proveedor (Anthropic Claude Opus 4.7+; Ollama lo asigna a su esfuerzo nativo `think` más alto)
  - ultra → razonamiento máximo del proveedor más orquestación proactiva de subagentes cuando el modelo o entorno de ejecución seleccionado lo admite
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest` se asigna a `high`.
- Notas sobre proveedores:
  - Los menús y selectores de pensamiento se basan en el perfil del proveedor. Los plugins de proveedor declaran el conjunto exacto de niveles para el modelo seleccionado, incluidas etiquetas como el valor binario `on`.
  - `adaptive`, `xhigh`, `max` y `ultra` solo se anuncian para perfiles de proveedor, modelo o entorno de ejecución que los admiten. Las directivas escritas para niveles no compatibles se rechazan indicando las opciones válidas del modelo.
  - Los niveles no compatibles almacenados se reasignan según la clasificación del perfil del proveedor. `adaptive` recurre a `medium` en modelos no adaptativos, mientras que `xhigh` y `max` recurren al mayor nivel compatible distinto de desactivado para el modelo seleccionado.
  - Los modelos Anthropic Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece un nivel de pensamiento explícito.
  - Anthropic Claude Opus 4.8 y Opus 4.7 mantienen el pensamiento desactivado a menos que se establezca explícitamente un nivel de pensamiento. El esfuerzo predeterminado propiedad del proveedor para Opus 4.8 es `high` después de activar el pensamiento adaptativo.
  - Anthropic Claude Opus 4.7+ asigna `/think xhigh` al pensamiento adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de pensamiento y `xhigh` es el ajuste de esfuerzo de Opus.
  - Anthropic Claude Opus 4.7+ también expone `/think max`; se asigna a la misma ruta de esfuerzo máximo propiedad del proveedor.
  - Los modelos DeepSeek V4 directos exponen `/think xhigh|max`; ambos se asignan a `reasoning_effort: "max"` de DeepSeek, mientras que los niveles inferiores distintos de desactivado se asignan a `high`.
  - Los modelos DeepSeek V4 enrutados por OpenRouter exponen `/think xhigh` y envían valores `reasoning.effort` compatibles con OpenRouter en lugar del valor `reasoning_effort` de nivel superior nativo de DeepSeek. Los niveles inferiores distintos de desactivado se asignan a `high`, y las anulaciones `max` almacenadas recurren a `xhigh`.
  - Los modelos de Ollama con capacidad de pensamiento exponen `/think low|medium|high|max`; `max` se asigna al valor nativo `think: "high"` porque la API nativa de Ollama acepta las cadenas de esfuerzo `low`, `medium` y `high`.
  - Los modelos GPT de OpenAI asignan `/think` mediante la compatibilidad de esfuerzo específica del modelo de la API Responses. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo de destino lo admite; de lo contrario, OpenClaw omite la carga de razonamiento desactivada en lugar de enviar un valor no compatible.
  - GPT-5.6 Sol y Terra exponen `/think ultra` nativo mediante el entorno de ejecución de Codex. GPT-5.6 Luna expone los niveles hasta `max` porque su catálogo de Codex no anuncia Ultra.
  - El entorno de ejecución integrado de OpenClaw expone el valor lógico `/think ultra` para GPT-5.6 Sol, Terra y Luna. Envía el esfuerzo máximo del proveedor y añade instrucciones de orquestación proactiva de subagentes con alcance de ejecución.
  - Las entradas personalizadas del catálogo compatible con OpenAI pueden habilitar `/think xhigh` estableciendo `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para que incluya `"xhigh"`. Esto utiliza los mismos metadatos de compatibilidad que asignan las cargas de esfuerzo de razonamiento salientes de OpenAI, de modo que los menús, la validación de sesiones, la CLI del agente y `llm-task` coincidan con el comportamiento del transporte.
  - Las referencias configuradas obsoletas de OpenRouter Hunter Alpha omiten la inyección de razonamiento del proxy porque esa ruta retirada podía devolver el texto de la respuesta final mediante campos de razonamiento.
  - Google Gemini asigna `/think adaptive` al pensamiento dinámico propiedad del proveedor de Gemini. Las solicitudes de Gemini 3 omiten un valor `thinkingLevel` fijo, mientras que las solicitudes de Gemini 2.5 envían `thinkingBudget: -1`; los niveles fijos siguen asignándose al valor `thinkingLevel` o presupuesto de Gemini más cercano para esa familia de modelos.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) en la ruta de transmisión compatible con Anthropic usa `thinking: { type: "disabled" }` de forma predeterminada, a menos que se establezca explícitamente el pensamiento en los parámetros del modelo o de la solicitud. Esto evita la filtración de deltas `reasoning_content` del formato de transmisión de Anthropic no nativo de M2.x. MiniMax-M3 (y M3.x) está exento: M3 emite bloques de pensamiento de Anthropic adecuados y devuelve contenido vacío cuando el pensamiento está desactivado, por lo que OpenClaw mantiene M3 en la ruta de pensamiento omitido/adaptativo del proveedor.
  - Z.AI (`zai/*`) es binario (`on`/`off`) para la mayoría de los modelos GLM. GLM-5.2 es la excepción: expone `/think off|low|high|max`, asigna `low` y `high` a `reasoning_effort: "high"` de Z.AI, y asigna `max` a `reasoning_effort: "max"`.
  - Kimi K3 de la API de Moonshot (`moonshot/kimi-k3`) siempre piensa con `max`, envía `reasoning_effort: "max"`, omite el campo `thinking` de K2 y las anulaciones de muestreo fijas, y conserva las opciones de herramientas compatibles con K3. Kimi Code K3 (`kimi/k3` y `kimi/k3[1m]`) expone `/think off|max`: desactivado envía `thinking.type: "disabled"`, mientras que máximo envía pensamiento adaptativo con esfuerzo máximo. Las referencias actuales de Kimi Code también incluyen `kimi/kimi-for-coding` y `kimi/kimi-for-coding-highspeed`. Kimi K2.7 Code (`moonshot/kimi-k2.7-code` y `moonshot/kimi-k2.7-code-highspeed`) siempre piensa, expone únicamente `on` y omite tanto `thinking` como `reasoning_effort` en la salida. Otros modelos `moonshot/*` asignan `/think off` a `thinking: { type: "disabled" }` y cualquier nivel distinto de `off` a `thinking: { type: "enabled" }`. Cuando el pensamiento de K2 está activado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva en línea en el mensaje (se aplica únicamente a ese mensaje).
2. Anulación de sesión (establecida mediante el envío de un mensaje que contenga únicamente una directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Alternativa: valor predeterminado declarado por el proveedor cuando esté disponible; de lo contrario, los modelos con capacidad de razonamiento se resuelven en `medium` o en el nivel compatible distinto de `off` más cercano para ese modelo, y los modelos sin razonamiento permanecen en `off`.

## Establecer un valor predeterminado de sesión

- Envíe un mensaje que contenga **únicamente** la directiva (se permiten espacios en blanco), por ejemplo, `/think:medium` o `/t high`.
- Esto se conserva durante la sesión actual (de forma predeterminada, por remitente). Use `/think default` para borrar la anulación de sesión y heredar el valor predeterminado configurado o del proveedor; los alias incluyen `inherit`, `clear`, `reset` y `unpin`.
- `/think off` almacena una anulación explícita de desactivación. Desactiva el pensamiento hasta que se cambie o borre la anulación de sesión.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo, `/thinking big`), el comando se rechaza con una indicación y el estado de la sesión permanece sin cambios.
- Envíe `/think` (o `/think:`) sin argumentos para ver el nivel de pensamiento actual.

## Aplicación por agente

- **OpenClaw integrado**: el nivel resuelto se pasa al entorno de ejecución del agente OpenClaw dentro del proceso.
- **Backend de la CLI de Claude**: los niveles concretos distintos de desactivado se pasan a Claude Code como `--effort` al usar `claude-cli`; `adaptive` elimina las opciones de esfuerzo configuradas y delega el esfuerzo efectivo al entorno, la configuración y los valores predeterminados del modelo de Claude Code. Consulte [backends de la CLI](/es/gateway/cli-backends).

## Modo rápido (/fast)

- Niveles: `auto|on|off|default`.
- Un mensaje que contenga únicamente una directiva alterna una anulación del modo rápido de la sesión y responde con `Fast mode set to auto.`, `Fast mode enabled.` o `Fast mode disabled.`. Use `/fast default` para borrar la anulación de sesión y heredar el valor predeterminado configurado; los alias incluyen `inherit`, `clear`, `reset` y `unpin`.
- Envíe `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. Anulación `/fast auto|on|off` en línea o mediante una directiva únicamente (`/fast default` borra esta capa)
  2. Anulación de sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Alternativa: `off`
- `auto` mantiene el modo de sesión o configuración como automático, pero resuelve cada nueva llamada al modelo de forma independiente. Las llamadas que comienzan antes del límite automático tienen activado el modo rápido; las llamadas posteriores de reintento, alternativa, resultado de herramienta o continuación comienzan con el modo rápido desactivado. El límite predeterminado es de 60 segundos; establezca `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` en el modelo activo para cambiarlo.
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI mediante el envío de `service_tier=priority` en solicitudes Responses compatibles.
- Para los modelos `openai/*` / `openai-codex/*` respaldados por Codex, el modo rápido envía la misma opción `service_tier=priority` en Codex Responses. Los turnos nativos del servidor de aplicaciones de Codex reciben el nivel únicamente en `turn/start` o al iniciar o reanudar un hilo, por lo que `auto` no puede cambiar el nivel de un turno del servidor de aplicaciones que ya se esté ejecutando; se aplica al siguiente turno del modelo que inicie OpenClaw.
- Para solicitudes públicas directas de `anthropic/*`, incluido el tráfico autenticado mediante OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a los niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto` y `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
- Los parámetros explícitos del modelo `serviceTier` / `service_tier` de Anthropic prevalecen sobre el valor predeterminado del modo rápido cuando ambos están establecidos. OpenClaw sigue omitiendo la inyección del nivel de servicio de Anthropic para URL base de proxy ajenas a Anthropic.
- `/status` muestra `Fast` cuando el modo rápido está activado y `Fast:auto` cuando el modo configurado es automático.

## Directivas detalladas (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje que solo contiene la directiva cambia el nivel de detalle de la sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una indicación sin cambiar el estado.
- `/verbose off` almacena una anulación explícita de la sesión; elimínela mediante la interfaz de sesiones eligiendo `inherit`.
- Los remitentes autorizados de canales externos pueden conservar la anulación del nivel de detalle de la sesión. Los clientes internos del Gateway/chat web necesitan `operator.admin` para conservarla.
- La directiva insertada afecta solo a ese mensaje; en los demás casos se aplican los valores predeterminados de la sesión o globales.
- Envíe `/verbose` (o `/verbose:`) sin argumentos para ver el nivel de detalle actual.
- Cuando el nivel de detalle está activado, los agentes que emiten resultados estructurados de herramientas devuelven cada llamada a una herramienta como un mensaje independiente que solo contiene metadatos, con el prefijo `<emoji> <tool-name>: <arg>` cuando está disponible. Estos resúmenes de herramientas se envían en cuanto se inicia cada herramienta (en burbujas separadas), no como incrementos de transmisión.
- Los resúmenes de errores de herramientas siguen visibles en el modo normal, pero los sufijos con detalles de errores sin procesar se ocultan salvo que el nivel de detalle sea `full`.
- Cuando el nivel de detalle es `full`, las salidas de las herramientas también se reenvían tras finalizar (en una burbuja separada y truncadas a una longitud segura). Si se cambia `/verbose on|full|off` mientras hay una ejecución en curso, las burbujas de herramientas posteriores respetan la nueva configuración.
- `agents.defaults.toolProgressDetail` controla el formato de los resúmenes de herramientas de `/verbose` y de las líneas de herramientas de los borradores de progreso. Use `"explain"` (predeterminado) para etiquetas breves y legibles, como `🛠️ Exec: checking JS syntax`; use `"raw"` si también desea añadir el comando o detalle sin procesar para la depuración. El valor `agents.list[].toolProgressDetail` de cada agente anula el predeterminado.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Directivas de seguimiento de plugins (/trace)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje que solo contiene la directiva activa o desactiva la salida de seguimiento de plugins de la sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva insertada afecta solo a ese mensaje; en los demás casos se aplican los valores predeterminados de la sesión o globales.
- Envíe `/trace` (o `/trace:`) sin argumentos para ver el nivel de seguimiento actual.
- `/trace` tiene un alcance más limitado que `/verbose`: solo muestra líneas de seguimiento o depuración propiedad de los plugins, como los resúmenes de depuración de Active Memory.
- Las líneas de seguimiento pueden aparecer en `/status` y como un mensaje de diagnóstico posterior a la respuesta normal del asistente.

## Visibilidad del razonamiento (/reasoning)

- Niveles: `on|off|stream`.
- Un mensaje que solo contiene la directiva activa o desactiva la visualización de los bloques de pensamiento en las respuestas.
- Cuando está activado, el razonamiento se envía como un **mensaje separado** con el prefijo `Thinking`.
- `stream`: transmite el razonamiento mientras se genera la respuesta cuando el canal activo admite vistas previas del razonamiento y, a continuación, envía la respuesta final sin el razonamiento.
- Alias: `/reason`.
- Envíe `/reasoning` (o `/reasoning:`) sin argumentos para ver el nivel de razonamiento actual.
- Orden de resolución: directiva insertada, anulación de la sesión, valor predeterminado del agente (`agents.list[].reasoningDefault`), valor predeterminado global (`agents.defaults.reasoningDefault`) y, por último, valor de reserva (`off`).

Las etiquetas de razonamiento mal formadas de modelos locales se gestionan de manera conservadora. Los bloques `<think>...</think>` cerrados permanecen ocultos en las respuestas normales y también se oculta el razonamiento sin cerrar que aparece después de texto ya visible. Si una respuesta está totalmente envuelta en una única etiqueta de apertura sin cerrar y, de otro modo, se entregaría como texto vacío, OpenClaw elimina la etiqueta de apertura mal formada y entrega el texto restante.

## Contenido relacionado

- La documentación del modo elevado se encuentra en [Modo elevado](/es/tools/elevated).

## Heartbeats

- El cuerpo de la comprobación de Heartbeat es la instrucción de Heartbeat configurada (valor predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas insertadas en un mensaje de Heartbeat se aplican del modo habitual (pero evite cambiar los valores predeterminados de la sesión desde los Heartbeats).
- De forma predeterminada, la entrega de Heartbeat incluye solo la carga útil final. Para enviar también el mensaje independiente `Thinking` (cuando esté disponible), establezca `agents.defaults.heartbeat.includeReasoning: true` o el valor `agents.list[].heartbeat.includeReasoning: true` de cada agente.

## Interfaz del chat web

- El selector de pensamiento del chat web refleja el nivel almacenado de la sesión procedente del almacén o la configuración de la sesión entrante cuando se carga la página.
- Al elegir otro nivel, la anulación de la sesión se escribe inmediatamente mediante `sessions.patch`; no se espera al siguiente envío ni se trata de una anulación de un solo uso de `thinkingOnce`.
- Si se realiza un envío mientras todavía se están aplicando cambios en los selectores de modelo, razonamiento o velocidad, se espera a que finalicen todos los parches pendientes de los selectores; si un cambio falla, el mensaje permanece sin enviar para su revisión.
- La primera opción siempre permite eliminar la anulación. Muestra `Inherited: <resolved level>`, incluido `Inherited: Off` cuando el pensamiento heredado está desactivado.
- Las opciones explícitas del selector usan directamente sus etiquetas de nivel y conservan las etiquetas del proveedor cuando existen (por ejemplo, `Maximum` para una opción `max` etiquetada por el proveedor).
- El selector usa `thinkingLevels` devuelto por la fila o los valores predeterminados de la sesión del Gateway, mientras que `thinkingOptions` se conserva como lista de etiquetas heredada. La interfaz del navegador no mantiene su propia lista de expresiones regulares de proveedores; los plugins son responsables de los conjuntos de niveles específicos de cada modelo.
- `/think:<level>` sigue funcionando y actualiza el mismo nivel almacenado de la sesión, por lo que las directivas del chat y el selector permanecen sincronizados.

## Perfiles de proveedores

- Los plugins de proveedores pueden exponer `resolveThinkingProfile(ctx)` para definir los niveles compatibles del modelo y el nivel predeterminado.
- Los plugins de proveedores que actúan como proxy de modelos Claude deben reutilizar `resolveClaudeThinkingProfile(modelId)` de `openclaw/plugin-sdk/provider-model-shared` para mantener alineados los catálogos directos de Anthropic y los catálogos de proxy.
- Cada nivel de perfil tiene un `id` canónico almacenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` o `ultra`) y puede incluir un `label` para mostrar. Los proveedores binarios usan `{ id: "low", label: "on" }`.
- Los enlaces de perfil reciben datos combinados del catálogo cuando están disponibles, incluidos `reasoning`, `compat.thinkingFormat` y `compat.supportedReasoningEfforts`. Use esos datos para mostrar perfiles binarios o personalizados solo cuando el contrato de solicitud configurado admita la carga útil correspondiente.
- Los plugins de herramientas que necesiten validar una anulación explícita del pensamiento deben usar `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` junto con `api.runtime.agent.normalizeThinkingLevel(...)`; no deben mantener sus propias listas de niveles de proveedores o modelos. Pase `agentRuntime` cuando la herramienta sea responsable de la ruta de ejecución, como en una ejecución siempre integrada.
- Los plugins de herramientas con acceso a metadatos configurados de modelos personalizados pueden pasar `catalog` a `resolveThinkingPolicy` para que las habilitaciones de `compat.supportedReasoningEfforts` se reflejen en la validación del lado del plugin.
- Los enlaces heredados publicados (`supportsXHighThinking`, `isBinaryThinking` y `resolveDefaultThinkingLevel`) se mantienen como adaptadores de compatibilidad, pero los nuevos conjuntos de niveles personalizados deben usar `resolveThinkingProfile`.
- Las filas y los valores predeterminados del Gateway exponen `thinkingLevels`, `thinkingOptions` y `thinkingDefault` para que los clientes ACP y de chat representen los mismos identificadores y etiquetas de perfil que usa la validación en tiempo de ejecución.
