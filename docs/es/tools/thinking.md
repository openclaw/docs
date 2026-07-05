---
read_when:
    - Ajuste del análisis, del modo rápido o del análisis sintáctico o los valores predeterminados de directivas verbosas
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y visibilidad del razonamiento
title: Niveles de pensamiento
x-i18n:
    generated_at: "2026-07-05T11:52:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11723a45d9b38c8eb32ca837dd2fa64eb737ca711e6d35f8a628dbc75ad10edc
    source_path: tools/thinking.md
    workflow: 16
---

## Qué hace

- Directiva en línea en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`, que reflejan aproximadamente la escala clásica de palabras mágicas de Anthropic "think" < "think hard" < "think harder" < "ultrathink":
  - minimal ~ "think"
  - low ~ "think hard"
  - medium ~ "think harder"
  - high ~ "ultrathink" (presupuesto máximo)
  - xhigh ~ "ultrathink+" (modelos GPT-5.2+ y Codex, además del esfuerzo de Anthropic Claude Opus 4.7+)
  - adaptive → pensamiento adaptativo gestionado por el proveedor (compatible con Claude 4.6 en Anthropic/Bedrock, Anthropic Claude Opus 4.7+ y pensamiento dinámico de Google Gemini)
  - max → razonamiento máximo del proveedor (Anthropic Claude Opus 4.7+; Ollama lo asigna a su mayor esfuerzo `think` nativo)
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest` se asigna a `high`.
- Notas del proveedor:
  - Los menús y selectores de pensamiento se controlan por perfil de proveedor. Los Plugins de proveedor declaran el conjunto exacto de niveles para el modelo seleccionado, incluidas etiquetas como `on` binario.
  - `adaptive`, `xhigh` y `max` solo se anuncian para perfiles de proveedor/modelo que los admiten. Las directivas escritas para niveles no admitidos se rechazan con las opciones válidas de ese modelo.
  - Los niveles no admitidos almacenados existentes se reasignan por rango del perfil de proveedor. `adaptive` vuelve a `medium` en modelos no adaptativos, mientras que `xhigh` y `max` vuelven al mayor nivel admitido distinto de `off` para el modelo seleccionado.
  - Los modelos Anthropic Claude 4.6 usan `adaptive` de forma predeterminada cuando no se define ningún nivel de pensamiento explícito.
  - Anthropic Claude Opus 4.8 y Opus 4.7 mantienen el pensamiento desactivado salvo que definas explícitamente un nivel de pensamiento. El valor predeterminado de esfuerzo propiedad del proveedor de Opus 4.8 es `high` después de habilitar el pensamiento adaptativo.
  - Anthropic Claude Opus 4.7+ asigna `/think xhigh` a pensamiento adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de pensamiento y `xhigh` es la configuración de esfuerzo de Opus.
  - Anthropic Claude Opus 4.7+ también expone `/think max`; se asigna a la misma ruta de esfuerzo máximo propiedad del proveedor.
  - Los modelos directos DeepSeek V4 exponen `/think xhigh|max`; ambos se asignan a DeepSeek `reasoning_effort: "max"`, mientras que los niveles inferiores distintos de `off` se asignan a `high`.
  - Los modelos DeepSeek V4 enrutados por OpenRouter exponen `/think xhigh` y envían valores `reasoning.effort` compatibles con OpenRouter en lugar del `reasoning_effort` de nivel superior nativo de DeepSeek. Los niveles inferiores distintos de `off` se asignan a `high`, y las anulaciones `max` almacenadas vuelven a `xhigh`.
  - Los modelos de Ollama con capacidad de pensamiento exponen `/think low|medium|high|max`; `max` se asigna al `think: "high"` nativo porque la API nativa de Ollama acepta cadenas de esfuerzo `low`, `medium` y `high`.
  - Los modelos OpenAI GPT asignan `/think` mediante la compatibilidad de esfuerzo específica del modelo en la Responses API. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo de destino lo admite; de lo contrario, OpenClaw omite la carga de razonamiento deshabilitada en lugar de enviar un valor no admitido.
  - Las entradas de catálogo personalizadas compatibles con OpenAI pueden optar por `/think xhigh` configurando `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para que incluya `"xhigh"`. Esto usa los mismos metadatos de compatibilidad que asignan las cargas de esfuerzo de razonamiento salientes de OpenAI, de modo que los menús, la validación de sesión, la CLI del agente y `llm-task` coincidan con el comportamiento de transporte.
  - Las referencias obsoletas configuradas de OpenRouter Hunter Alpha omiten la inyección de razonamiento del proxy porque esa ruta retirada podía devolver texto de respuesta final mediante campos de razonamiento.
  - Google Gemini asigna `/think adaptive` al pensamiento dinámico propiedad del proveedor de Gemini. Las solicitudes de Gemini 3 omiten un `thinkingLevel` fijo, mientras que las solicitudes de Gemini 2.5 envían `thinkingBudget: -1`; los niveles fijos aún se asignan al `thinkingLevel` o presupuesto de Gemini más cercano para esa familia de modelos.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) en la ruta de streaming compatible con Anthropic usa de forma predeterminada `thinking: { type: "disabled" }` salvo que definas explícitamente el pensamiento en los parámetros del modelo o de la solicitud. Esto evita deltas `reasoning_content` filtrados desde el formato de flujo no nativo de Anthropic de M2.x. MiniMax-M3 (y M3.x) queda exento: M3 emite bloques de pensamiento Anthropic correctos y devuelve contenido vacío cuando el pensamiento está deshabilitado, por lo que OpenClaw mantiene M3 en la ruta de pensamiento omitida/adaptativa del proveedor.
  - Z.AI (`zai/*`) es binario (`on`/`off`) para la mayoría de los modelos GLM. GLM-5.2 es la excepción: expone `/think off|low|high|max`, asigna `low` y `high` a Z.AI `reasoning_effort: "high"` y asigna `max` a `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) siempre piensa. Su perfil expone solo `on`, y OpenClaw omite el campo saliente `thinking` como exige Moonshot. Otros modelos `moonshot/*` asignan `/think off` a `thinking: { type: "disabled" }` y cualquier nivel distinto de `off` a `thinking: { type: "enabled" }`. Cuando el pensamiento está habilitado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva en línea en el mensaje (se aplica solo a ese mensaje).
2. Anulación de sesión (definida enviando un mensaje que contiene solo la directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Respaldo: valor predeterminado declarado por el proveedor cuando esté disponible; de lo contrario, los modelos con capacidad de razonamiento se resuelven a `medium` o al nivel distinto de `off` más cercano admitido por ese modelo, y los modelos sin razonamiento permanecen en `off`.

## Definir un valor predeterminado de sesión

- Envía un mensaje que sea **solo** la directiva (se permiten espacios en blanco), por ejemplo, `/think:medium` o `/t high`.
- Eso queda fijado para la sesión actual (por remitente de forma predeterminada). Usa `/think default` para borrar la anulación de sesión y heredar el valor predeterminado configurado/del proveedor; los alias incluyen `inherit`, `clear`, `reset` y `unpin`.
- `/think off` almacena una anulación explícita de desactivado. Deshabilita el pensamiento hasta que cambies o borres la anulación de sesión.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo, `/thinking big`), el comando se rechaza con una sugerencia y el estado de la sesión no cambia.
- Envía `/think` (o `/think:`) sin argumento para ver el nivel de pensamiento actual.

## Aplicación por agente

- **OpenClaw integrado**: el nivel resuelto se pasa al runtime del agente OpenClaw en proceso.
- **Backend Claude CLI**: los niveles distintos de `off` se pasan a Claude Code como `--effort` cuando se usa `claude-cli`; consulta [backends de CLI](/es/gateway/cli-backends).

## Modo rápido (/fast)

- Niveles: `auto|on|off|default`.
- Un mensaje que contiene solo la directiva alterna una anulación de modo rápido de sesión y responde `Fast mode set to auto.`, `Fast mode enabled.` o `Fast mode disabled.`. Usa `/fast default` para borrar la anulación de sesión y heredar el valor predeterminado configurado; los alias incluyen `inherit`, `clear`, `reset` y `unpin`.
- Envía `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. Anulación `/fast auto|on|off` en línea/solo directiva (`/fast default` borra esta capa)
  2. Anulación de sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Respaldo: `off`
- `auto` mantiene el modo de sesión/configuración como automático, pero resuelve cada nueva llamada al modelo de forma independiente. Las llamadas que comienzan antes del corte automático tienen el modo rápido habilitado; las llamadas posteriores de reintento, respaldo, resultado de herramienta o continuación comienzan con el modo rápido deshabilitado. El corte predeterminado es de 60 segundos; define `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` en el modelo activo para cambiarlo.
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI enviando `service_tier=priority` en solicitudes Responses compatibles.
- Para modelos `openai/*` / `openai-codex/*` respaldados por Codex, el modo rápido envía la misma marca `service_tier=priority` en Codex Responses. Los turnos nativos del servidor de aplicación de Codex reciben el nivel solo en `turn/start` o al iniciar/reanudar el hilo, por lo que `auto` no puede reasignar el nivel de un turno del servidor de aplicación que ya está en ejecución; se aplica al siguiente turno de modelo que OpenClaw inicia.
- Para solicitudes públicas directas `anthropic/*`, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a los niveles de servicio de Anthropic: `/fast on` define `service_tier=auto`, `/fast off` define `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
- Los parámetros de modelo Anthropic explícitos `serviceTier` / `service_tier` anulan el valor predeterminado del modo rápido cuando ambos están definidos. OpenClaw sigue omitiendo la inyección de nivel de servicio de Anthropic para URL base de proxy que no sean de Anthropic.
- `/status` muestra `Fast` cuando el modo rápido está habilitado y `Fast:auto` cuando el modo configurado es automático.

## Directivas detalladas (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje que contiene solo la directiva alterna el modo detallado de la sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una sugerencia sin cambiar el estado.
- `/verbose off` almacena una anulación explícita de sesión; bórrala mediante la interfaz de sesiones eligiendo `inherit`.
- Los remitentes autorizados de canales externos pueden persistir la anulación detallada de sesión. Los clientes internos de gateway/webchat necesitan `operator.admin` para persistirla.
- La directiva en línea afecta solo a ese mensaje; de lo contrario, se aplican los valores predeterminados de sesión/globales.
- Envía `/verbose` (o `/verbose:`) sin argumento para ver el nivel detallado actual.
- Cuando el modo detallado está activado, los agentes que emiten resultados de herramientas estructurados devuelven cada llamada de herramienta como su propio mensaje solo de metadatos, prefijado con `<emoji> <tool-name>: <arg>` cuando está disponible. Estos resúmenes de herramientas se envían tan pronto como cada herramienta comienza (burbujas separadas), no como deltas de streaming.
- Los resúmenes de fallo de herramientas permanecen visibles en modo normal, pero los sufijos de detalle de error sin procesar se ocultan salvo que el modo detallado sea `full`.
- Cuando el modo detallado es `full`, las salidas de herramientas también se reenvían después de completarse (burbuja separada, truncada a una longitud segura). Si alternas `/verbose on|full|off` mientras una ejecución está en curso, las burbujas de herramientas posteriores respetan la nueva configuración.
- `agents.defaults.toolProgressDetail` controla la forma de los resúmenes de herramientas de `/verbose` y las líneas de herramientas de borrador de progreso. Usa `"explain"` (predeterminado) para etiquetas humanas compactas como `🛠️ Exec: checking JS syntax`; usa `"raw"` cuando también quieras anexar el comando/detalle sin procesar para depuración. `agents.list[].toolProgressDetail` por agente anula el valor predeterminado.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Directivas de traza de Plugin (/trace)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje que contiene solo la directiva alterna la salida de traza de Plugin de sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva en línea afecta solo a ese mensaje; de lo contrario, se aplican los valores predeterminados de sesión/globales.
- Envía `/trace` (o `/trace:`) sin argumento para ver el nivel de traza actual.
- `/trace` es más limitado que `/verbose`: solo expone líneas de traza/depuración propiedad del Plugin, como resúmenes de depuración de Active Memory.
- Las líneas de traza pueden aparecer en `/status` y como un mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.

## Visibilidad del razonamiento (/reasoning)

- Niveles: `on|off|stream`.
- Un mensaje que contiene solo la directiva alterna si los bloques de pensamiento se muestran en las respuestas.
- Cuando está habilitado, el razonamiento se envía como un **mensaje separado** prefijado con `Thinking`.
- `stream`: transmite el razonamiento mientras se genera la respuesta cuando el canal activo admite vistas previas de razonamiento, luego envía la respuesta final sin razonamiento.
- Alias: `/reason`.
- Envía `/reasoning` (o `/reasoning:`) sin argumento para ver el nivel de razonamiento actual.
- Orden de resolución: directiva en línea, luego anulación de sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`), luego valor predeterminado global (`agents.defaults.reasoningDefault`), luego respaldo (`off`).

Las etiquetas de razonamiento de modelos locales con formato incorrecto se manejan de forma conservadora. Los bloques cerrados `<think>...</think>` permanecen ocultos en las respuestas normales, y el razonamiento sin cerrar después de texto ya visible también se oculta. Si una respuesta está completamente envuelta en una sola etiqueta de apertura sin cerrar y, de otro modo, se entregaría como texto vacío, OpenClaw elimina la etiqueta de apertura con formato incorrecto y entrega el texto restante.

## Relacionado

- La documentación del modo elevado está en [Modo elevado](/es/tools/elevated).

## Heartbeats

- El cuerpo de la sonda Heartbeat es el prompt de Heartbeat configurado (predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas en línea de un mensaje Heartbeat se aplican como siempre (pero evita cambiar los valores predeterminados de la sesión desde Heartbeats).
- La entrega de Heartbeat usa de forma predeterminada solo la carga final. Para enviar también el mensaje `Thinking` separado (cuando esté disponible), define `agents.defaults.heartbeat.includeReasoning: true` o, por agente, `agents.list[].heartbeat.includeReasoning: true`.

## IU de chat web

- El selector de razonamiento del chat web refleja el nivel almacenado de la sesión desde el almacén/configuración de sesión entrante cuando se carga la página.
- Elegir otro nivel escribe la anulación de sesión inmediatamente mediante `sessions.patch`; no espera al siguiente envío y no es una anulación puntual `thinkingOnce`.
- La primera opción siempre es la opción para borrar la anulación. Muestra `Inherited: <resolved level>`, incluido `Inherited: Off` cuando el razonamiento heredado está deshabilitado.
- Las opciones explícitas del selector usan sus etiquetas de nivel directas mientras conservan las etiquetas del proveedor cuando existen (por ejemplo, `Maximum` para una opción `max` etiquetada por el proveedor).
- El selector usa `thinkingLevels` devuelto por la fila/valores predeterminados de sesión del Gateway, con `thinkingOptions` conservado como lista de etiquetas heredada. La IU del navegador no mantiene su propia lista de expresiones regulares de proveedores; los plugins poseen los conjuntos de niveles específicos del modelo.
- `/think:<level>` sigue funcionando y actualiza el mismo nivel de sesión almacenado, por lo que las directivas del chat y el selector permanecen sincronizados.

## Perfiles de proveedor

- Los plugins de proveedor pueden exponer `resolveThinkingProfile(ctx)` para definir los niveles compatibles del modelo y el valor predeterminado.
- Los plugins de proveedor que hacen proxy de modelos Claude deben reutilizar `resolveClaudeThinkingProfile(modelId)` de `openclaw/plugin-sdk/provider-model-shared` para que los catálogos directos de Anthropic y de proxy permanezcan alineados.
- Cada nivel de perfil tiene un `id` canónico almacenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) y puede incluir una `label` de visualización. Los proveedores binarios usan `{ id: "low", label: "on" }`.
- Los hooks de perfil reciben datos de catálogo combinados cuando están disponibles, incluidos `reasoning`, `compat.thinkingFormat` y `compat.supportedReasoningEfforts`. Usa esos datos para exponer perfiles binarios o personalizados solo cuando el contrato de solicitud configurado admite la carga correspondiente.
- Los plugins de herramientas que necesitan validar una anulación explícita de razonamiento deben usar `api.runtime.agent.resolveThinkingPolicy({ provider, model })` junto con `api.runtime.agent.normalizeThinkingLevel(...)`; no deben mantener sus propias listas de niveles de proveedor/modelo.
- Los plugins de herramientas con acceso a metadatos configurados de modelos personalizados pueden pasar `catalog` a `resolveThinkingPolicy` para que las suscripciones explícitas `compat.supportedReasoningEfforts` se reflejen en la validación del lado del plugin.
- Los hooks heredados publicados (`supportsXHighThinking`, `isBinaryThinking` y `resolveDefaultThinkingLevel`) permanecen como adaptadores de compatibilidad, pero los nuevos conjuntos de niveles personalizados deben usar `resolveThinkingProfile`.
- Las filas/valores predeterminados del Gateway exponen `thinkingLevels`, `thinkingOptions` y `thinkingDefault` para que los clientes ACP/chat rendericen los mismos ids y etiquetas de perfil que usa la validación en tiempo de ejecución.
