---
read_when:
    - Ajustar el análisis sintáctico o los valores predeterminados de las directivas de razonamiento, modo rápido o verbosidad
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y visibilidad del razonamiento
title: Niveles de razonamiento
x-i18n:
    generated_at: "2026-04-30T16:31:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9adf065e46cb64e4c2149b95ecd69ed887a17e2eff5a5569894defa3e7217b7
    source_path: tools/thinking.md
    workflow: 16
---

## Qué hace

- Directiva en línea en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (presupuesto máximo)
  - xhigh → “ultrathink+” (modelos GPT-5.2+ y Codex, además de esfuerzo de Anthropic Claude Opus 4.7)
  - adaptive → pensamiento adaptativo gestionado por el proveedor (compatible con Claude 4.6 en Anthropic/Bedrock, Anthropic Claude Opus 4.7 y pensamiento dinámico de Google Gemini)
  - max → razonamiento máximo del proveedor (Anthropic Claude Opus 4.7; Ollama asigna esto a su mayor esfuerzo `think` nativo)
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest` se asigna a `high`.
- Notas del proveedor:
  - Los menús y selectores de pensamiento se basan en perfiles de proveedor. Los plugins de proveedor declaran el conjunto exacto de niveles para el modelo seleccionado, incluidas etiquetas como el binario `on`.
  - `adaptive`, `xhigh` y `max` solo se anuncian para perfiles de proveedor/modelo que los admiten. Las directivas escritas para niveles no admitidos se rechazan con las opciones válidas de ese modelo.
  - Los niveles no admitidos almacenados existentes se reasignan según el rango del perfil de proveedor. `adaptive` recurre a `medium` en modelos no adaptativos, mientras que `xhigh` y `max` recurren al mayor nivel no `off` admitido para el modelo seleccionado.
  - Los modelos Anthropic Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece un nivel de pensamiento explícito.
  - Anthropic Claude Opus 4.7 no usa pensamiento adaptativo de forma predeterminada. Su valor predeterminado de esfuerzo de API sigue siendo propiedad del proveedor, a menos que establezcas explícitamente un nivel de pensamiento.
  - Anthropic Claude Opus 4.7 asigna `/think xhigh` a pensamiento adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de pensamiento y `xhigh` es la configuración de esfuerzo de Opus 4.7.
  - Anthropic Claude Opus 4.7 también expone `/think max`; se asigna a la misma ruta de esfuerzo máximo propiedad del proveedor.
  - Los modelos DeepSeek V4 exponen `/think xhigh|max`; ambos se asignan a DeepSeek `reasoning_effort: "max"`, mientras que los niveles inferiores no `off` se asignan a `high`.
  - Los modelos de Ollama con capacidad de pensamiento exponen `/think low|medium|high|max`; `max` se asigna al `think: "high"` nativo porque la API nativa de Ollama acepta las cadenas de esfuerzo `low`, `medium` y `high`.
  - Los modelos OpenAI GPT asignan `/think` mediante la compatibilidad de esfuerzo específica del modelo en la Responses API. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo de destino lo admite; de lo contrario, OpenClaw omite la carga de razonamiento deshabilitado en lugar de enviar un valor no admitido.
  - Las entradas de catálogo personalizadas compatibles con OpenAI pueden activar `/think xhigh` configurando `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para incluir `"xhigh"`. Esto usa los mismos metadatos de compatibilidad que asignan las cargas de esfuerzo de razonamiento salientes de OpenAI, por lo que los menús, la validación de sesión, la CLI de agente y `llm-task` coinciden con el comportamiento de transporte.
  - Las referencias configuradas obsoletas de OpenRouter Hunter Alpha omiten la inyección de razonamiento por proxy porque esa ruta retirada podía devolver texto de respuesta final mediante campos de razonamiento.
  - Google Gemini asigna `/think adaptive` al pensamiento dinámico propiedad del proveedor de Gemini. Las solicitudes de Gemini 3 omiten un `thinkingLevel` fijo, mientras que las solicitudes de Gemini 2.5 envían `thinkingBudget: -1`; los niveles fijos siguen asignándose al `thinkingLevel` o presupuesto de Gemini más cercano para esa familia de modelos.
  - MiniMax (`minimax/*`) en la ruta de streaming compatible con Anthropic usa de forma predeterminada `thinking: { type: "disabled" }` a menos que establezcas explícitamente el pensamiento en parámetros de modelo o parámetros de solicitud. Esto evita deltas `reasoning_content` filtrados desde el formato de stream no nativo de Anthropic de MiniMax.
  - Z.AI (`zai/*`) solo admite pensamiento binario (`on`/`off`). Cualquier nivel que no sea `off` se trata como `on` (asignado a `low`).
  - Moonshot (`moonshot/*`) asigna `/think off` a `thinking: { type: "disabled" }` y cualquier nivel no `off` a `thinking: { type: "enabled" }`. Cuando el pensamiento está habilitado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva en línea en el mensaje (se aplica solo a ese mensaje).
2. Anulación de sesión (establecida enviando un mensaje que solo contiene la directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Respaldo: valor predeterminado declarado por el proveedor cuando esté disponible; de lo contrario, los modelos con capacidad de razonamiento se resuelven a `medium` o al nivel no `off` admitido más cercano para ese modelo, y los modelos sin razonamiento permanecen en `off`.

## Establecer un valor predeterminado de sesión

- Envía un mensaje que sea **solo** la directiva (se permiten espacios en blanco), por ejemplo, `/think:medium` o `/t high`.
- Eso queda fijado para la sesión actual (por remitente de forma predeterminada); se borra con `/think:off` o al restablecerse la sesión por inactividad.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo, `/thinking big`), el comando se rechaza con una sugerencia y el estado de la sesión no cambia.
- Envía `/think` (o `/think:`) sin argumento para ver el nivel de pensamiento actual.

## Aplicación por agente

- **Pi integrado**: el nivel resuelto se pasa al runtime del agente Pi en proceso.

## Modo rápido (/fast)

- Niveles: `on|off`.
- Un mensaje que solo contiene la directiva alterna una anulación de modo rápido de sesión y responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envía `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. `/fast on|off` en línea/solo directiva
  2. Anulación de sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Respaldo: `off`
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI enviando `service_tier=priority` en solicitudes Responses compatibles.
- Para `openai-codex/*`, el modo rápido envía la misma marca `service_tier=priority` en Codex Responses. OpenClaw mantiene un único interruptor `/fast` compartido entre ambas rutas de autenticación.
- Para solicitudes públicas directas `anthropic/*`, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a los niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto`, `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
- Los parámetros de modelo explícitos `serviceTier` / `service_tier` de Anthropic anulan el valor predeterminado del modo rápido cuando ambos están establecidos. OpenClaw sigue omitiendo la inyección del nivel de servicio de Anthropic para URL base de proxy que no sean de Anthropic.
- `/status` muestra `Fast` solo cuando el modo rápido está habilitado.

## Directivas de registro detallado (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje que solo contiene la directiva alterna el modo detallado de la sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una sugerencia sin cambiar el estado.
- `/verbose off` almacena una anulación explícita de sesión; bórrala mediante la interfaz de usuario de Sessions eligiendo `inherit`.
- La directiva en línea afecta solo a ese mensaje; los valores predeterminados de sesión/globales se aplican en los demás casos.
- Envía `/verbose` (o `/verbose:`) sin argumento para ver el nivel detallado actual.
- Cuando el modo detallado está activado, los agentes que emiten resultados de herramientas estructurados (Pi, otros agentes JSON) envían cada llamada de herramienta como su propio mensaje solo de metadatos, con el prefijo `<emoji> <tool-name>: <arg>` cuando está disponible (ruta/comando). Estos resúmenes de herramientas se envían tan pronto como comienza cada herramienta (burbujas separadas), no como deltas de streaming.
- Los resúmenes de fallos de herramientas siguen visibles en modo normal, pero los sufijos con detalles de error sin procesar se ocultan a menos que el modo detallado esté en `on` o `full`.
- Cuando el modo detallado está en `full`, las salidas de herramientas también se reenvían después de completarse (burbuja separada, truncada a una longitud segura). Si alternas `/verbose on|full|off` mientras una ejecución está en curso, las burbujas de herramientas posteriores respetan la nueva configuración.

## Directivas de traza de Plugin (/trace)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje que solo contiene la directiva alterna la salida de traza de Plugin de la sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva en línea afecta solo a ese mensaje; los valores predeterminados de sesión/globales se aplican en los demás casos.
- Envía `/trace` (o `/trace:`) sin argumento para ver el nivel de traza actual.
- `/trace` es más limitado que `/verbose`: solo expone líneas de traza/depuración propiedad del Plugin, como los resúmenes de depuración de Active Memory.
- Las líneas de traza pueden aparecer en `/status` y como mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.

## Visibilidad del razonamiento (/reasoning)

- Niveles: `on|off|stream`.
- Un mensaje que solo contiene la directiva alterna si los bloques de pensamiento se muestran en las respuestas.
- Cuando está habilitado, el razonamiento se envía como un **mensaje separado** con el prefijo `Reasoning:`.
- `stream` (solo Telegram): transmite el razonamiento a la burbuja de borrador de Telegram mientras se genera la respuesta y luego envía la respuesta final sin razonamiento.
- Alias: `/reason`.
- Envía `/reasoning` (o `/reasoning:`) sin argumento para ver el nivel de razonamiento actual.
- Orden de resolución: directiva en línea, luego anulación de sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`), luego respaldo (`off`).

Las etiquetas de razonamiento de modelos locales con formato incorrecto se manejan de forma conservadora. Los bloques cerrados `<think>...</think>` permanecen ocultos en respuestas normales, y el razonamiento sin cerrar después de texto ya visible también se oculta. Si una respuesta está completamente envuelta en una sola etiqueta de apertura sin cerrar y, de lo contrario, se entregaría como texto vacío, OpenClaw elimina la etiqueta de apertura con formato incorrecto y entrega el texto restante.

## Relacionado

- La documentación del modo elevado está en [Modo elevado](/es/tools/elevated).

## Heartbeats

- El cuerpo de la prueba Heartbeat es el prompt de Heartbeat configurado (predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas en línea de un mensaje de Heartbeat se aplican como de costumbre (pero evita cambiar los valores predeterminados de sesión desde Heartbeats).
- La entrega de Heartbeat usa de forma predeterminada solo la carga final. Para enviar también el mensaje `Reasoning:` separado (cuando esté disponible), establece `agents.defaults.heartbeat.includeReasoning: true` o, por agente, `agents.list[].heartbeat.includeReasoning: true`.

## Interfaz de usuario de chat web

- El selector de pensamiento del chat web refleja el nivel almacenado de la sesión desde el almacén/configuración de sesión entrante cuando se carga la página.
- Elegir otro nivel escribe inmediatamente la anulación de sesión mediante `sessions.patch`; no espera al siguiente envío y no es una anulación `thinkingOnce` de un solo uso.
- La primera opción siempre es `Default (<resolved level>)`, donde el valor predeterminado resuelto proviene del perfil de pensamiento del proveedor del modelo de la sesión activa más la misma lógica de respaldo que usan `/status` y `session_status`.
- El selector usa `thinkingLevels` devuelto por la fila/valores predeterminados de sesión del Gateway, con `thinkingOptions` conservado como una lista de etiquetas heredada. La interfaz de usuario del navegador no mantiene su propia lista regex de proveedores; los plugins son dueños de los conjuntos de niveles específicos de modelo.
- `/think:<level>` sigue funcionando y actualiza el mismo nivel de sesión almacenado, por lo que las directivas de chat y el selector permanecen sincronizados.

## Perfiles de proveedor

- Los plugins de proveedor pueden exponer `resolveThinkingProfile(ctx)` para definir los niveles admitidos y el valor predeterminado del modelo.
- Los plugins de proveedor que actúan como proxy de modelos Claude deben reutilizar `resolveClaudeThinkingProfile(modelId)` de `openclaw/plugin-sdk/provider-model-shared` para que los catálogos directos de Anthropic y los de proxy permanezcan alineados.
- Cada nivel de perfil tiene un `id` canónico almacenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) y puede incluir una `label` de visualización. Los proveedores binarios usan `{ id: "low", label: "on" }`.
- Los plugins de herramientas que necesiten validar una anulación explícita de razonamiento deben usar `api.runtime.agent.resolveThinkingPolicy({ provider, model })` junto con `api.runtime.agent.normalizeThinkingLevel(...)`; no deben mantener sus propias listas de niveles por proveedor/modelo.
- Los plugins de herramientas con acceso a metadatos configurados de modelos personalizados pueden pasar `catalog` a `resolveThinkingPolicy` para que las adhesiones de `compat.supportedReasoningEfforts` se reflejen en la validación del lado del plugin.
- Los hooks heredados publicados (`supportsXHighThinking`, `isBinaryThinking` y `resolveDefaultThinkingLevel`) permanecen como adaptadores de compatibilidad, pero los nuevos conjuntos de niveles personalizados deben usar `resolveThinkingProfile`.
- Las filas/valores predeterminados del Gateway exponen `thinkingLevels`, `thinkingOptions` y `thinkingDefault` para que los clientes ACP/chat rendericen los mismos ids y etiquetas de perfil que usa la validación en tiempo de ejecución.
