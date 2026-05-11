---
read_when:
    - Ajustar el razonamiento, el modo rápido o el análisis sintáctico de directivas detalladas, o sus valores predeterminados
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y visibilidad del razonamiento
title: Niveles de pensamiento
x-i18n:
    generated_at: "2026-05-11T20:58:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e2360a260aaf4571f2da6c7519fb4987e4c8c7947e3dc37f94a0ad260ad55
    source_path: tools/thinking.md
    workflow: 16
---

## Qué hace

- Directiva en línea en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (presupuesto máximo)
  - xhigh → "ultrathink+" (modelos GPT-5.2+ y Codex, más esfuerzo Anthropic Claude Opus 4.7)
  - adaptive → razonamiento adaptativo gestionado por el proveedor (compatible con Claude 4.6 en Anthropic/Bedrock, Anthropic Claude Opus 4.7 y pensamiento dinámico de Google Gemini)
  - max → razonamiento máximo del proveedor (Anthropic Claude Opus 4.7; Ollama lo asigna a su esfuerzo `think` nativo más alto)
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest` se asigna a `high`.
- Notas de proveedor:
  - Los menús y selectores de razonamiento se controlan mediante perfiles de proveedor. Los plugins de proveedor declaran el conjunto exacto de niveles para el modelo seleccionado, incluidas etiquetas como el binario `on`.
  - `adaptive`, `xhigh` y `max` solo se anuncian para perfiles de proveedor/modelo que los admiten. Las directivas escritas para niveles no admitidos se rechazan con las opciones válidas de ese modelo.
  - Los niveles no admitidos almacenados existentes se reasignan según el rango del perfil de proveedor. `adaptive` retrocede a `medium` en modelos no adaptativos, mientras que `xhigh` y `max` retroceden al mayor nivel no `off` admitido para el modelo seleccionado.
  - Los modelos Anthropic Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece ningún nivel de razonamiento explícito.
  - Anthropic Claude Opus 4.7 no usa razonamiento adaptativo de forma predeterminada. El valor predeterminado de esfuerzo de su API sigue siendo propiedad del proveedor salvo que establezcas explícitamente un nivel de razonamiento.
  - Anthropic Claude Opus 4.7 asigna `/think xhigh` a razonamiento adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de razonamiento y `xhigh` es el ajuste de esfuerzo de Opus 4.7.
  - Anthropic Claude Opus 4.7 también expone `/think max`; se asigna a la misma ruta de esfuerzo máximo propiedad del proveedor.
  - Los modelos DeepSeek V4 directos exponen `/think xhigh|max`; ambos se asignan a `reasoning_effort: "max"` de DeepSeek, mientras que los niveles no `off` inferiores se asignan a `high`.
  - Los modelos DeepSeek V4 enrutados por OpenRouter exponen `/think xhigh` y envían valores `reasoning_effort` compatibles con OpenRouter. Las anulaciones `max` almacenadas retroceden a `xhigh`.
  - Los modelos de Ollama con capacidad de razonamiento exponen `/think low|medium|high|max`; `max` se asigna a `think: "high"` nativo porque la API nativa de Ollama acepta las cadenas de esfuerzo `low`, `medium` y `high`.
  - Los modelos GPT de OpenAI asignan `/think` mediante el soporte de esfuerzo específico del modelo de la Responses API. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo de destino lo admite; de lo contrario, OpenClaw omite la carga útil de razonamiento deshabilitado en lugar de enviar un valor no admitido.
  - Las entradas de catálogo personalizadas compatibles con OpenAI pueden optar por `/think xhigh` configurando `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para incluir `"xhigh"`. Esto usa los mismos metadatos de compatibilidad que asignan las cargas útiles salientes de esfuerzo de razonamiento de OpenAI, por lo que los menús, la validación de sesión, la CLI del agente y `llm-task` concuerdan con el comportamiento de transporte.
  - Las referencias configuradas obsoletas de OpenRouter Hunter Alpha omiten la inyección de razonamiento de proxy porque esa ruta retirada podía devolver texto de respuesta final mediante campos de razonamiento.
  - Google Gemini asigna `/think adaptive` al pensamiento dinámico propiedad del proveedor de Gemini. Las solicitudes de Gemini 3 omiten un `thinkingLevel` fijo, mientras que las solicitudes de Gemini 2.5 envían `thinkingBudget: -1`; los niveles fijos siguen asignándose al `thinkingLevel` o presupuesto de Gemini más cercano para esa familia de modelos.
  - MiniMax (`minimax/*`) en la ruta de streaming compatible con Anthropic usa de forma predeterminada `thinking: { type: "disabled" }` salvo que establezcas explícitamente el razonamiento en los parámetros del modelo o de la solicitud. Esto evita deltas `reasoning_content` filtrados desde el formato de stream no nativo de Anthropic de MiniMax.
  - Z.AI (`zai/*`) solo admite razonamiento binario (`on`/`off`). Cualquier nivel que no sea `off` se trata como `on` (asignado a `low`).
  - Moonshot (`moonshot/*`) asigna `/think off` a `thinking: { type: "disabled" }` y cualquier nivel que no sea `off` a `thinking: { type: "enabled" }`. Cuando el razonamiento está habilitado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva en línea en el mensaje (se aplica solo a ese mensaje).
2. Anulación de sesión (establecida al enviar un mensaje que solo contiene una directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Reserva: valor predeterminado declarado por el proveedor cuando esté disponible; de lo contrario, los modelos con capacidad de razonamiento resuelven a `medium` o al nivel no `off` admitido más cercano para ese modelo, y los modelos sin razonamiento permanecen en `off`.

## Configurar un valor predeterminado de sesión

- Envía un mensaje que sea **solo** la directiva (se permiten espacios), por ejemplo `/think:medium` o `/t high`.
- Eso queda fijado para la sesión actual (por remitente de forma predeterminada). Usa `/think default` para borrar la anulación de sesión y heredar el valor predeterminado configurado/del proveedor; los alias incluyen `inherit`, `clear`, `reset` y `unpin`.
- `/think off` almacena una anulación explícita de desactivado. Deshabilita el razonamiento hasta que cambies o borres la anulación de sesión.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo, `/thinking big`), el comando se rechaza con una sugerencia y el estado de la sesión queda sin cambios.
- Envía `/think` (o `/think:`) sin argumento para ver el nivel de razonamiento actual.

## Aplicación por agente

- **Pi integrado**: el nivel resuelto se pasa al runtime del agente Pi en proceso.
- **Backend de Claude CLI**: los niveles no desactivados se pasan a Claude Code como `--effort` al usar `claude-cli`; consulta [backends de CLI](/es/gateway/cli-backends).

## Modo rápido (/fast)

- Niveles: `on|off|default`.
- Un mensaje que solo contiene una directiva activa o desactiva una anulación de modo rápido de sesión y responde `Fast mode enabled.` / `Fast mode disabled.`. Usa `/fast default` para borrar la anulación de sesión y heredar el valor predeterminado configurado; los alias incluyen `inherit`, `clear`, `reset` y `unpin`.
- Envía `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. Anulación `/fast on|off` en línea/solo directiva (`/fast default` borra esta capa)
  2. Anulación de sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Reserva: `off`
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI enviando `service_tier=priority` en solicitudes Responses compatibles.
- Para `openai-codex/*`, el modo rápido envía la misma marca `service_tier=priority` en Responses de Codex. OpenClaw mantiene un único interruptor `/fast` compartido entre ambas rutas de autenticación.
- Para solicitudes públicas directas `anthropic/*`, incluido el tráfico autenticado por OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a los niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto`, `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` a `MiniMax-M2.7-highspeed`.
- Los parámetros de modelo Anthropic explícitos `serviceTier` / `service_tier` anulan el valor predeterminado de modo rápido cuando ambos están establecidos. OpenClaw sigue omitiendo la inyección de nivel de servicio de Anthropic para URL base de proxy que no sean de Anthropic.
- `/status` muestra `Fast` solo cuando el modo rápido está habilitado.

## Directivas detalladas (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje que solo contiene una directiva activa o desactiva el modo detallado de sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una sugerencia sin cambiar el estado.
- `/verbose off` almacena una anulación explícita de sesión; bórrala mediante la UI de sesiones eligiendo `inherit`.
- La directiva en línea afecta solo a ese mensaje; de lo contrario, se aplican los valores predeterminados de sesión/globales.
- Envía `/verbose` (o `/verbose:`) sin argumento para ver el nivel detallado actual.
- Cuando el modo detallado está activado, los agentes que emiten resultados de herramientas estructurados (Pi, otros agentes JSON) devuelven cada llamada de herramienta como su propio mensaje solo de metadatos, con el prefijo `<emoji> <tool-name>: <arg>` cuando esté disponible. Estos resúmenes de herramientas se envían tan pronto como se inicia cada herramienta (burbujas separadas), no como deltas de streaming.
- Los resúmenes de fallos de herramientas siguen visibles en modo normal, pero los sufijos con detalles de error sin procesar se ocultan salvo que el modo detallado sea `on` o `full`.
- Cuando el modo detallado es `full`, las salidas de herramientas también se reenvían tras completarse (burbuja separada, truncada a una longitud segura). Si cambias `/verbose on|full|off` mientras una ejecución está en curso, las burbujas de herramientas posteriores respetan el nuevo ajuste.
- `agents.defaults.toolProgressDetail` controla la forma de los resúmenes de herramientas de `/verbose` y las líneas de herramientas de borrador de progreso. Usa `"explain"` (predeterminado) para etiquetas humanas compactas como `🛠️ Exec: checking JS syntax`; usa `"raw"` cuando también quieras añadir el comando/detalle sin procesar para depuración. `agents.list[].toolProgressDetail` por agente anula el valor predeterminado.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Directivas de traza de Plugin (/trace)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje que solo contiene una directiva activa o desactiva la salida de traza de Plugin de sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva en línea afecta solo a ese mensaje; de lo contrario, se aplican los valores predeterminados de sesión/globales.
- Envía `/trace` (o `/trace:`) sin argumento para ver el nivel de traza actual.
- `/trace` es más estrecho que `/verbose`: solo expone líneas de traza/depuración propiedad del plugin, como resúmenes de depuración de Active Memory.
- Las líneas de traza pueden aparecer en `/status` y como mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.

## Visibilidad del razonamiento (/reasoning)

- Niveles: `on|off|stream`.
- Un mensaje que solo contiene una directiva activa o desactiva si los bloques de razonamiento se muestran en las respuestas.
- Cuando está habilitado, el razonamiento se envía como un **mensaje separado** con el prefijo `Reasoning:`.
- `stream` (solo Telegram): transmite el razonamiento en la burbuja de borrador de Telegram mientras se genera la respuesta, y luego envía la respuesta final sin razonamiento.
- Alias: `/reason`.
- Envía `/reasoning` (o `/reasoning:`) sin argumento para ver el nivel de razonamiento actual.
- Orden de resolución: directiva en línea, luego anulación de sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`), luego valor predeterminado global (`agents.defaults.reasoningDefault`), luego reserva (`off`).

Las etiquetas de razonamiento de modelos locales con formato incorrecto se gestionan de forma conservadora. Los bloques cerrados `<think>...</think>` permanecen ocultos en respuestas normales, y el razonamiento no cerrado después de texto ya visible también se oculta. Si una respuesta está completamente envuelta en una única etiqueta de apertura no cerrada y de otro modo se entregaría como texto vacío, OpenClaw elimina la etiqueta de apertura con formato incorrecto y entrega el texto restante.

## Relacionado

- La documentación del modo elevado está en [modo elevado](/es/tools/elevated).

## Heartbeats

- El cuerpo de la sonda Heartbeat es el prompt de Heartbeat configurado (predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas en línea en un mensaje de Heartbeat se aplican como de costumbre (pero evita cambiar los valores predeterminados de sesión desde Heartbeats).
- La entrega de Heartbeat usa de forma predeterminada solo la carga útil final. Para enviar también el mensaje separado `Reasoning:` (cuando esté disponible), establece `agents.defaults.heartbeat.includeReasoning: true` o `agents.list[].heartbeat.includeReasoning: true` por agente.

## UI de chat web

- El selector de razonamiento del chat web refleja el nivel almacenado de la sesión desde el almacén/configuración de sesión entrante cuando se carga la página.
- Elegir otro nivel escribe la anulación de sesión inmediatamente mediante `sessions.patch`; no espera al siguiente envío y no es una anulación puntual de `thinkingOnce`.
- La primera opción es siempre la elección para borrar la anulación. Muestra `Heredado: <nivel resuelto>` cuando la sesión hereda un valor predeterminado efectivo que no está desactivado, u `Desactivado` cuando el razonamiento heredado está deshabilitado.
- Las elecciones explícitas del selector se etiquetan como anulaciones, conservando las etiquetas del proveedor cuando están presentes (por ejemplo, `Anulación: máximo` para una opción `max` etiquetada por el proveedor).
- El selector usa `thinkingLevels` devuelto por la fila/valores predeterminados de sesión del Gateway, con `thinkingOptions` conservado como una lista de etiquetas heredada. La interfaz de usuario del navegador no conserva su propia lista de regex de proveedores; los plugins son responsables de los conjuntos de niveles específicos de cada modelo.
- `/think:<level>` sigue funcionando y actualiza el mismo nivel de sesión almacenado, por lo que las directivas del chat y el selector permanecen sincronizados.

## Perfiles de proveedor

- Los plugins de proveedor pueden exponer `resolveThinkingProfile(ctx)` para definir los niveles admitidos y el valor predeterminado del modelo.
- Los plugins de proveedor que actúan como proxy de modelos Claude deben reutilizar `resolveClaudeThinkingProfile(modelId)` desde `openclaw/plugin-sdk/provider-model-shared` para que Anthropic directo y los catálogos proxy permanezcan alineados.
- Cada nivel de perfil tiene un `id` canónico almacenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) y puede incluir una `label` de visualización. Los proveedores binarios usan `{ id: "low", label: "on" }`.
- Los plugins de herramientas que necesiten validar una anulación explícita de razonamiento deben usar `api.runtime.agent.resolveThinkingPolicy({ provider, model })` junto con `api.runtime.agent.normalizeThinkingLevel(...)`; no deben conservar sus propias listas de niveles de proveedor/modelo.
- Los plugins de herramientas con acceso a metadatos de modelos personalizados configurados pueden pasar `catalog` a `resolveThinkingPolicy` para que las opciones de inclusión de `compat.supportedReasoningEfforts` se reflejen en la validación del lado del plugin.
- Los hooks heredados publicados (`supportsXHighThinking`, `isBinaryThinking` y `resolveDefaultThinkingLevel`) permanecen como adaptadores de compatibilidad, pero los nuevos conjuntos de niveles personalizados deben usar `resolveThinkingProfile`.
- Las filas/valores predeterminados del Gateway exponen `thinkingLevels`, `thinkingOptions` y `thinkingDefault` para que los clientes ACP/chat representen los mismos ids y etiquetas de perfil que usa la validación en tiempo de ejecución.
