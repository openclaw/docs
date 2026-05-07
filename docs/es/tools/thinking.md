---
read_when:
    - Ajustar el análisis o los valores predeterminados de las directivas thinking, fast-mode o verbose
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y visibilidad del razonamiento
title: Niveles de pensamiento
x-i18n:
    generated_at: "2026-05-07T13:25:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8890563aa0171d41549f1d1a6af3279babbcba17eb19302753275e9e2ff01980
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
  - xhigh → "ultrathink+" (modelos GPT-5.2+ y Codex, además del esfuerzo de Anthropic Claude Opus 4.7)
  - adaptive → razonamiento adaptativo gestionado por el proveedor (compatible con Claude 4.6 en Anthropic/Bedrock, Anthropic Claude Opus 4.7 y el razonamiento dinámico de Google Gemini)
  - max → razonamiento máximo del proveedor (Anthropic Claude Opus 4.7; Ollama lo asigna a su mayor esfuerzo nativo de `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest` se asigna a `high`.
- Notas de proveedores:
  - Los menús y selectores de razonamiento se basan en el perfil del proveedor. Los Plugin de proveedor declaran el conjunto exacto de niveles para el modelo seleccionado, incluidas etiquetas como el `on` binario.
  - `adaptive`, `xhigh` y `max` solo se anuncian para perfiles de proveedor/modelo que los admiten. Las directivas escritas para niveles no compatibles se rechazan con las opciones válidas de ese modelo.
  - Los niveles no compatibles almacenados existentes se reasignan según el rango del perfil del proveedor. `adaptive` recurre a `medium` en modelos no adaptativos, mientras que `xhigh` y `max` recurren al mayor nivel compatible distinto de `off` para el modelo seleccionado.
  - Los modelos Anthropic Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece ningún nivel de razonamiento explícito.
  - Anthropic Claude Opus 4.7 no usa razonamiento adaptativo de forma predeterminada. El valor predeterminado de esfuerzo de su API sigue perteneciendo al proveedor salvo que establezcas explícitamente un nivel de razonamiento.
  - Anthropic Claude Opus 4.7 asigna `/think xhigh` al razonamiento adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de razonamiento y `xhigh` es el ajuste de esfuerzo de Opus 4.7.
  - Anthropic Claude Opus 4.7 también expone `/think max`; se asigna a la misma ruta de esfuerzo máximo propiedad del proveedor.
  - Los modelos directos DeepSeek V4 exponen `/think xhigh|max`; ambos se asignan a DeepSeek `reasoning_effort: "max"`, mientras que los niveles inferiores distintos de `off` se asignan a `high`.
  - Los modelos DeepSeek V4 enrutados por OpenRouter exponen `/think xhigh` y envían valores de `reasoning_effort` compatibles con OpenRouter. Las anulaciones `max` almacenadas recurren a `xhigh`.
  - Los modelos de Ollama con capacidad de razonamiento exponen `/think low|medium|high|max`; `max` se asigna al `think: "high"` nativo porque la API nativa de Ollama acepta las cadenas de esfuerzo `low`, `medium` y `high`.
  - Los modelos GPT de OpenAI asignan `/think` mediante la compatibilidad de esfuerzo específica del modelo en la Responses API. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo de destino lo admite; de lo contrario, OpenClaw omite la carga útil de razonamiento deshabilitada en lugar de enviar un valor no compatible.
  - Las entradas de catálogo personalizadas compatibles con OpenAI pueden optar por `/think xhigh` estableciendo `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para incluir `"xhigh"`. Esto usa los mismos metadatos de compatibilidad que asignan las cargas útiles de esfuerzo de razonamiento salientes de OpenAI, de modo que los menús, la validación de sesiones, la CLI de agente y `llm-task` coinciden con el comportamiento de transporte.
  - Las referencias obsoletas configuradas de OpenRouter Hunter Alpha omiten la inyección de razonamiento del proxy porque esa ruta retirada podía devolver texto de respuesta final mediante campos de razonamiento.
  - Google Gemini asigna `/think adaptive` al razonamiento dinámico propiedad del proveedor de Gemini. Las solicitudes de Gemini 3 omiten un `thinkingLevel` fijo, mientras que las solicitudes de Gemini 2.5 envían `thinkingBudget: -1`; los niveles fijos siguen asignándose al `thinkingLevel` o presupuesto de Gemini más cercano para esa familia de modelos.
  - MiniMax (`minimax/*`) en la ruta de streaming compatible con Anthropic usa de forma predeterminada `thinking: { type: "disabled" }` salvo que establezcas explícitamente el razonamiento en los parámetros del modelo o de la solicitud. Esto evita deltas filtrados de `reasoning_content` desde el formato de stream Anthropic no nativo de MiniMax.
  - Z.AI (`zai/*`) solo admite razonamiento binario (`on`/`off`). Cualquier nivel distinto de `off` se trata como `on` (asignado a `low`).
  - Moonshot (`moonshot/*`) asigna `/think off` a `thinking: { type: "disabled" }` y cualquier nivel distinto de `off` a `thinking: { type: "enabled" }`. Cuando el razonamiento está habilitado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva en línea en el mensaje (se aplica solo a ese mensaje).
2. Anulación de sesión (establecida enviando un mensaje solo con la directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Respaldo: valor predeterminado declarado por el proveedor cuando está disponible; de lo contrario, los modelos con capacidad de razonamiento se resuelven a `medium` o al nivel compatible distinto de `off` más cercano para ese modelo, y los modelos sin razonamiento permanecen en `off`.

## Establecer un valor predeterminado de sesión

- Envía un mensaje que sea **solo** la directiva (se permiten espacios en blanco), por ejemplo, `/think:medium` o `/t high`.
- Eso se mantiene para la sesión actual (por remitente de forma predeterminada); se borra con `/think:off` o con el restablecimiento por inactividad de la sesión.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo, `/thinking big`), el comando se rechaza con una sugerencia y el estado de la sesión queda sin cambios.
- Envía `/think` (o `/think:`) sin argumento para ver el nivel de razonamiento actual.

## Aplicación por agente

- **Pi integrado**: el nivel resuelto se pasa al runtime del agente Pi en proceso.
- **Backend de CLI de Claude**: los niveles distintos de `off` se pasan a Claude Code como `--effort` cuando se usa `claude-cli`; consulta [backends de CLI](/es/gateway/cli-backends).

## Modo rápido (/fast)

- Niveles: `on|off`.
- Un mensaje solo con la directiva alterna una anulación de modo rápido de sesión y responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envía `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. `/fast on|off` en línea o solo como directiva
  2. Anulación de sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Respaldo: `off`
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI enviando `service_tier=priority` en solicitudes Responses compatibles.
- Para `openai-codex/*`, el modo rápido envía la misma marca `service_tier=priority` en Codex Responses. OpenClaw mantiene un único interruptor `/fast` compartido entre ambas rutas de autenticación.
- Para solicitudes públicas directas `anthropic/*`, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a los niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto`, `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
- Los parámetros de modelo explícitos `serviceTier` / `service_tier` de Anthropic anulan el valor predeterminado del modo rápido cuando ambos están establecidos. OpenClaw sigue omitiendo la inyección de nivel de servicio de Anthropic para URL base de proxy que no son de Anthropic.
- `/status` muestra `Fast` solo cuando el modo rápido está habilitado.

## Directivas detalladas (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje solo con la directiva alterna el modo detallado de sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una sugerencia sin cambiar el estado.
- `/verbose off` almacena una anulación explícita de sesión; bórrala mediante la interfaz de sesiones eligiendo `inherit`.
- La directiva en línea afecta solo a ese mensaje; de lo contrario, se aplican los valores predeterminados de sesión/globales.
- Envía `/verbose` (o `/verbose:`) sin argumento para ver el nivel detallado actual.
- Cuando el modo detallado está activado, los agentes que emiten resultados estructurados de herramientas (Pi, otros agentes JSON) envían cada llamada a herramienta como su propio mensaje solo de metadatos, con el prefijo `<emoji> <tool-name>: <arg>` cuando está disponible. Estos resúmenes de herramientas se envían en cuanto se inicia cada herramienta (burbujas separadas), no como deltas de streaming.
- Los resúmenes de fallos de herramientas siguen visibles en modo normal, pero los sufijos de detalles de error sin procesar se ocultan salvo que el modo detallado esté en `on` o `full`.
- Cuando el modo detallado está en `full`, las salidas de herramientas también se reenvían tras completarse (burbuja separada, truncada a una longitud segura). Si alternas `/verbose on|full|off` mientras una ejecución está en curso, las burbujas de herramientas posteriores respetan la nueva configuración.
- `agents.defaults.toolProgressDetail` controla la forma de los resúmenes de herramientas de `/verbose` y las líneas de herramientas de borrador de progreso. Usa `"explain"` (predeterminado) para etiquetas humanas compactas como `🛠️ Exec: checking JS syntax`; usa `"raw"` cuando también quieras que se añada el comando/detalle sin procesar para depuración. `agents.list[].toolProgressDetail` por agente anula el valor predeterminado.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Directivas de traza de Plugin (/trace)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje solo con la directiva alterna la salida de traza de Plugin de sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva en línea afecta solo a ese mensaje; de lo contrario, se aplican los valores predeterminados de sesión/globales.
- Envía `/trace` (o `/trace:`) sin argumento para ver el nivel de traza actual.
- `/trace` es más específico que `/verbose`: solo expone líneas de traza/depuración propiedad del Plugin, como resúmenes de depuración de Active Memory.
- Las líneas de traza pueden aparecer en `/status` y como un mensaje de diagnóstico posterior después de la respuesta normal del asistente.

## Visibilidad del razonamiento (/reasoning)

- Niveles: `on|off|stream`.
- Un mensaje solo con la directiva alterna si los bloques de razonamiento se muestran en las respuestas.
- Cuando está habilitado, el razonamiento se envía como un **mensaje separado** con el prefijo `Reasoning:`.
- `stream` (solo Telegram): transmite el razonamiento en la burbuja de borrador de Telegram mientras se genera la respuesta y luego envía la respuesta final sin razonamiento.
- Alias: `/reason`.
- Envía `/reasoning` (o `/reasoning:`) sin argumento para ver el nivel de razonamiento actual.
- Orden de resolución: directiva en línea, luego anulación de sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`) y después respaldo (`off`).

Las etiquetas de razonamiento de modelo local mal formadas se manejan de forma conservadora. Los bloques cerrados `<think>...</think>` permanecen ocultos en respuestas normales, y el razonamiento no cerrado después de texto ya visible también se oculta. Si una respuesta está completamente envuelta en una única etiqueta de apertura no cerrada y de otro modo se entregaría como texto vacío, OpenClaw elimina la etiqueta de apertura mal formada y entrega el texto restante.

## Relacionado

- La documentación del modo elevado está en [modo elevado](/es/tools/elevated).

## Heartbeats

- El cuerpo de la sonda de Heartbeat es el prompt de Heartbeat configurado (predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas en línea de un mensaje de Heartbeat se aplican como siempre (pero evita cambiar los valores predeterminados de sesión desde Heartbeats).
- La entrega de Heartbeat usa de forma predeterminada solo la carga útil final. Para enviar también el mensaje separado `Reasoning:` (cuando esté disponible), establece `agents.defaults.heartbeat.includeReasoning: true` o `agents.list[].heartbeat.includeReasoning: true` por agente.

## Interfaz de chat web

- El selector de pensamiento del chat web refleja el nivel almacenado de la sesión desde el almacén/configuración de sesión entrante cuando se carga la página.
- Elegir otro nivel escribe la anulación de la sesión inmediatamente mediante `sessions.patch`; no espera al siguiente envío y no es una anulación puntual `thinkingOnce`.
- La primera opción es siempre la opción para borrar la anulación. Muestra `Heredado: <resolved level>` cuando la sesión hereda un valor predeterminado efectivo distinto de desactivado, o `Off` cuando el pensamiento heredado está desactivado.
- Las opciones explícitas del selector se etiquetan como anulaciones, preservando las etiquetas del proveedor cuando estén presentes (por ejemplo, `Anulación: maximum` para una opción `max` etiquetada por el proveedor).
- El selector usa `thinkingLevels` devuelto por la fila/valores predeterminados de sesión del Gateway, con `thinkingOptions` mantenido como una lista de etiquetas heredada. La interfaz de usuario del navegador no mantiene su propia lista de regex de proveedores; los plugins son propietarios de los conjuntos de niveles específicos de modelo.
- `/think:<level>` sigue funcionando y actualiza el mismo nivel de sesión almacenado, de modo que las directivas de chat y el selector permanecen sincronizados.

## Perfiles de proveedor

- Los plugins de proveedor pueden exponer `resolveThinkingProfile(ctx)` para definir los niveles admitidos y el valor predeterminado del modelo.
- Los plugins de proveedor que actúan como proxy para modelos Claude deben reutilizar `resolveClaudeThinkingProfile(modelId)` de `openclaw/plugin-sdk/provider-model-shared` para que los catálogos directos de Anthropic y los catálogos proxy permanezcan alineados.
- Cada nivel de perfil tiene un `id` canónico almacenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) y puede incluir una `label` de visualización. Los proveedores binarios usan `{ id: "low", label: "on" }`.
- Los plugins de herramientas que necesiten validar una anulación explícita de pensamiento deben usar `api.runtime.agent.resolveThinkingPolicy({ provider, model })` junto con `api.runtime.agent.normalizeThinkingLevel(...)`; no deben mantener sus propias listas de niveles de proveedor/modelo.
- Los plugins de herramientas con acceso a metadatos de modelos personalizados configurados pueden pasar `catalog` a `resolveThinkingPolicy` para que las inclusiones voluntarias de `compat.supportedReasoningEfforts` se reflejen en la validación del lado del plugin.
- Los hooks heredados publicados (`supportsXHighThinking`, `isBinaryThinking` y `resolveDefaultThinkingLevel`) permanecen como adaptadores de compatibilidad, pero los nuevos conjuntos de niveles personalizados deben usar `resolveThinkingProfile`.
- Las filas/valores predeterminados del Gateway exponen `thinkingLevels`, `thinkingOptions` y `thinkingDefault` para que los clientes ACP/chat rendericen los mismos ids y etiquetas de perfil que usa la validación en tiempo de ejecución.
