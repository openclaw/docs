---
read_when:
    - Ajustar el análisis, el modo rápido o el análisis sintáctico o los valores predeterminados de las directivas detalladas
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y visibilidad del razonamiento
title: Niveles de razonamiento
x-i18n:
    generated_at: "2026-07-03T09:24:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6383ac18fbef0d06a97df5c204d57829ae4993b8287f8ef60aeae197ea711722
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
  - xhigh → "ultrathink+" (modelos GPT-5.2+ y Codex, además de esfuerzo de Anthropic Claude Opus 4.7+)
  - adaptive → pensamiento adaptativo administrado por el proveedor (compatible con Claude 4.6 en Anthropic/Bedrock, Anthropic Claude Opus 4.7+ y pensamiento dinámico de Google Gemini)
  - max → razonamiento máximo del proveedor (Anthropic Claude Opus 4.7+; Ollama lo asigna a su mayor esfuerzo `think` nativo)
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest` se asigna a `high`.
- Notas del proveedor:
  - Los menús y selectores de pensamiento se controlan mediante el perfil del proveedor. Los plugins de proveedor declaran el conjunto exacto de niveles para el modelo seleccionado, incluidas etiquetas como el binario `on`.
  - `adaptive`, `xhigh` y `max` solo se anuncian para perfiles de proveedor/modelo que los admiten. Las directivas escritas para niveles no admitidos se rechazan con las opciones válidas de ese modelo.
  - Los niveles no admitidos almacenados existentes se reasignan según el rango del perfil del proveedor. `adaptive` vuelve a `medium` en modelos no adaptativos, mientras que `xhigh` y `max` vuelven al mayor nivel no desactivado admitido por el modelo seleccionado.
  - Los modelos Anthropic Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece ningún nivel de pensamiento explícito.
  - Anthropic Claude Opus 4.8 y Opus 4.7 mantienen el pensamiento desactivado salvo que establezcas explícitamente un nivel de pensamiento. El valor predeterminado de esfuerzo propiedad del proveedor de Opus 4.8 es `high` después de activar el pensamiento adaptativo.
  - Anthropic Claude Opus 4.7+ asigna `/think xhigh` al pensamiento adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de pensamiento y `xhigh` es la configuración de esfuerzo de Opus.
  - Anthropic Claude Opus 4.7+ también expone `/think max`; se asigna a la misma ruta de esfuerzo máximo propiedad del proveedor.
  - Los modelos directos DeepSeek V4 exponen `/think xhigh|max`; ambos se asignan a DeepSeek `reasoning_effort: "max"`, mientras que los niveles inferiores no desactivados se asignan a `high`.
  - Los modelos DeepSeek V4 enrutados por OpenRouter exponen `/think xhigh` y envían valores `reasoning.effort` compatibles con OpenRouter en lugar de `reasoning_effort` de nivel superior nativo de DeepSeek. Los niveles inferiores no desactivados se asignan a `high`, y las sobrescrituras almacenadas de `max` vuelven a `xhigh`.
  - Los modelos de Ollama con capacidad de pensamiento exponen `/think low|medium|high|max`; `max` se asigna al `think: "high"` nativo porque la API nativa de Ollama acepta las cadenas de esfuerzo `low`, `medium` y `high`.
  - Los modelos OpenAI GPT asignan `/think` mediante la compatibilidad de esfuerzo específica del modelo en la Responses API. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo objetivo lo admite; de lo contrario, OpenClaw omite la carga de razonamiento desactivada en lugar de enviar un valor no admitido.
  - Las entradas de catálogo personalizadas compatibles con OpenAI pueden optar por `/think xhigh` estableciendo `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para incluir `"xhigh"`. Esto usa los mismos metadatos de compatibilidad que asignan las cargas salientes de esfuerzo de razonamiento de OpenAI, por lo que los menús, la validación de sesión, la CLI del agente y `llm-task` coinciden con el comportamiento de transporte.
  - Las referencias obsoletas configuradas de OpenRouter Hunter Alpha omiten la inyección de razonamiento del proxy porque esa ruta retirada podía devolver texto de respuesta final a través de campos de razonamiento.
  - Google Gemini asigna `/think adaptive` al pensamiento dinámico propiedad del proveedor de Gemini. Las solicitudes de Gemini 3 omiten un `thinkingLevel` fijo, mientras que las solicitudes de Gemini 2.5 envían `thinkingBudget: -1`; los niveles fijos aún se asignan al `thinkingLevel` o presupuesto de Gemini más cercano para esa familia de modelos.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) en la ruta de streaming compatible con Anthropic usa de forma predeterminada `thinking: { type: "disabled" }` salvo que establezcas explícitamente pensamiento en los parámetros del modelo o de la solicitud. Esto evita deltas de `reasoning_content` filtrados desde el formato de flujo no nativo de Anthropic de M2.x. MiniMax-M3 (y M3.x) está exento: M3 emite bloques de pensamiento adecuados de Anthropic y devuelve contenido vacío cuando el pensamiento está desactivado, por lo que OpenClaw mantiene M3 en la ruta de pensamiento omitido/adaptativo del proveedor.
  - Z.AI (`zai/*`) es binario (`on`/`off`) para la mayoría de los modelos GLM. GLM-5.2 es la excepción: expone `/think off|low|high|max`, asigna `low` y `high` a Z.AI `reasoning_effort: "high"` y asigna `max` a `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) siempre piensa. Su perfil expone solo `on`, y OpenClaw omite el campo saliente `thinking` según lo requiere Moonshot. Otros modelos `moonshot/*` asignan `/think off` a `thinking: { type: "disabled" }` y cualquier nivel no `off` a `thinking: { type: "enabled" }`. Cuando el pensamiento está activado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva en línea en el mensaje (se aplica solo a ese mensaje).
2. Sobrescritura de sesión (establecida al enviar un mensaje que solo contiene la directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Fallback: valor predeterminado declarado por el proveedor cuando esté disponible; de lo contrario, los modelos con capacidad de razonamiento resuelven a `medium` o al nivel no `off` admitido más cercano para ese modelo, y los modelos sin razonamiento permanecen en `off`.

## Establecer un valor predeterminado de sesión

- Envía un mensaje que sea **solo** la directiva (se permiten espacios), por ejemplo, `/think:medium` o `/t high`.
- Eso queda fijado para la sesión actual (por remitente de forma predeterminada). Usa `/think default` para borrar la sobrescritura de sesión y heredar el valor predeterminado configurado/del proveedor; los alias incluyen `inherit`, `clear`, `reset` y `unpin`.
- `/think off` almacena una sobrescritura explícita de desactivado. Desactiva el pensamiento hasta que cambies o borres la sobrescritura de sesión.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo, `/thinking big`), el comando se rechaza con una sugerencia y el estado de la sesión queda sin cambios.
- Envía `/think` (o `/think:`) sin argumento para ver el nivel de pensamiento actual.

## Aplicación por agente

- **OpenClaw incrustado**: el nivel resuelto se pasa al runtime del agente OpenClaw en proceso.
- **Backend de Claude CLI**: los niveles no desactivados se pasan a Claude Code como `--effort` cuando se usa `claude-cli`; consulta [Backends de CLI](/es/gateway/cli-backends).

## Modo rápido (/fast)

- Niveles: `auto|on|off|default`.
- Un mensaje que solo contiene la directiva activa o desactiva una sobrescritura de modo rápido de sesión y responde `Fast mode set to auto.`, `Fast mode enabled.` o `Fast mode disabled.`. Usa `/fast default` para borrar la sobrescritura de sesión y heredar el valor predeterminado configurado; los alias incluyen `inherit`, `clear`, `reset` y `unpin`.
- Envía `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. Sobrescritura en línea/solo directiva `/fast auto|on|off` (`/fast default` borra esta capa)
  2. Sobrescritura de sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `auto` mantiene el modo de sesión/configuración como auto, pero resuelve cada nueva llamada de modelo de forma independiente. Las llamadas que comienzan antes del corte automático tienen el modo rápido activado; las llamadas posteriores de reintento, fallback, resultado de herramienta o continuación comienzan con el modo rápido desactivado. El corte predeterminado es de 60 segundos; establece `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` en el modelo activo para cambiarlo.
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI enviando `service_tier=priority` en solicitudes Responses compatibles.
- Para modelos `openai/*` / `openai-codex/*` respaldados por Codex, el modo rápido envía la misma marca `service_tier=priority` en Codex Responses. Los turnos del servidor de aplicación nativo de Codex reciben el nivel solo en `turn/start` o al iniciar/reanudar un hilo, por lo que `auto` no puede cambiar el nivel de un turno de servidor de aplicación que ya está en ejecución; se aplica al siguiente turno de modelo que OpenClaw inicia.
- Para solicitudes públicas directas `anthropic/*`, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a los niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto`, `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
- Los parámetros de modelo explícitos de Anthropic `serviceTier` / `service_tier` sobrescriben el valor predeterminado del modo rápido cuando ambos están establecidos. OpenClaw aún omite la inyección de nivel de servicio de Anthropic para URL base de proxy que no son de Anthropic.
- `/status` muestra `Fast` cuando el modo rápido está activado y `Fast:auto` cuando el modo configurado es auto.

## Directivas detalladas (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje que solo contiene la directiva activa o desactiva el registro detallado de sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una sugerencia sin cambiar el estado.
- `/verbose off` almacena una sobrescritura explícita de sesión; bórrala desde la UI de sesiones eligiendo `inherit`.
- Los remitentes autorizados de canales externos pueden persistir la sobrescritura de registro detallado de sesión. Los clientes internos de Gateway/webchat necesitan `operator.admin` para persistirla.
- La directiva en línea afecta solo a ese mensaje; de lo contrario, se aplican los valores predeterminados de sesión/globales.
- Envía `/verbose` (o `/verbose:`) sin argumento para ver el nivel detallado actual.
- Cuando el modo detallado está activado, los agentes que emiten resultados estructurados de herramientas devuelven cada llamada de herramienta como su propio mensaje solo de metadatos, con el prefijo `<emoji> <tool-name>: <arg>` cuando esté disponible. Estos resúmenes de herramientas se envían tan pronto como comienza cada herramienta (burbujas separadas), no como deltas de streaming.
- Los resúmenes de fallos de herramientas siguen visibles en modo normal, pero los sufijos de detalle de error sin procesar se ocultan salvo que verbose sea `full`.
- Cuando verbose es `full`, las salidas de herramientas también se reenvían después de completarse (burbuja separada, truncada a una longitud segura). Si alternas `/verbose on|full|off` mientras una ejecución está en curso, las burbujas de herramientas posteriores respetan la nueva configuración.
- `agents.defaults.toolProgressDetail` controla la forma de los resúmenes de herramientas de `/verbose` y las líneas de herramienta en borradores de progreso. Usa `"explain"` (predeterminado) para etiquetas humanas compactas como `🛠️ Exec: checking JS syntax`; usa `"raw"` cuando también quieras anexar el comando/detalle sin procesar para depuración. `agents.list[].toolProgressDetail` por agente sobrescribe el valor predeterminado.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Directivas de traza de Plugin (/trace)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje que solo contiene la directiva activa o desactiva la salida de traza de plugin de sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva en línea afecta solo a ese mensaje; de lo contrario, se aplican los valores predeterminados de sesión/globales.
- Envía `/trace` (o `/trace:`) sin argumento para ver el nivel de traza actual.
- `/trace` es más limitado que `/verbose`: solo expone líneas de traza/depuración propiedad del plugin, como resúmenes de depuración de Active Memory.
- Las líneas de traza pueden aparecer en `/status` y como un mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.

## Visibilidad del razonamiento (/reasoning)

- Niveles: `on|off|stream`.
- Un mensaje que solo contiene la directiva alterna si los bloques de pensamiento se muestran en las respuestas.
- Cuando está activado, el razonamiento se envía como un **mensaje separado** con el prefijo `Thinking`.
- `stream`: transmite el razonamiento mientras se genera la respuesta cuando el canal activo admite vistas previas de razonamiento, luego envía la respuesta final sin razonamiento.
- Alias: `/reason`.
- Envía `/reasoning` (o `/reasoning:`) sin argumento para ver el nivel de razonamiento actual.
- Orden de resolución: directiva en línea, luego sobrescritura de sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`), luego valor predeterminado global (`agents.defaults.reasoningDefault`), luego fallback (`off`).

Las etiquetas de razonamiento de modelos locales mal formadas se gestionan de forma conservadora. Los bloques `<think>...</think>` cerrados permanecen ocultos en las respuestas normales, y el razonamiento sin cerrar después de texto ya visible también se oculta. Si una respuesta está completamente envuelta en una sola etiqueta de apertura sin cerrar y, de otro modo, se entregaría como texto vacío, OpenClaw elimina la etiqueta de apertura mal formada y entrega el texto restante.

## Relacionado

- La documentación del modo elevado está en [modo elevado](/es/tools/elevated).

## Heartbeat

- El cuerpo de la sonda Heartbeat es el prompt de Heartbeat configurado (valor predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas en línea de un mensaje de Heartbeat se aplican como de costumbre (pero evita cambiar los valores predeterminados de la sesión desde Heartbeat).
- La entrega de Heartbeat usa de forma predeterminada solo la carga final. Para enviar también el mensaje `Thinking` separado (cuando esté disponible), configura `agents.defaults.heartbeat.includeReasoning: true` o, por agente, `agents.list[].heartbeat.includeReasoning: true`.

## Interfaz de chat web

- El selector de razonamiento del chat web refleja el nivel almacenado de la sesión desde el almacén/configuración de sesión entrante cuando se carga la página.
- Elegir otro nivel escribe la sobrescritura de sesión inmediatamente mediante `sessions.patch`; no espera al siguiente envío y no es una sobrescritura puntual `thinkingOnce`.
- La primera opción siempre es la opción para borrar la sobrescritura. Muestra `Inherited: <resolved level>`, incluido `Inherited: Off` cuando el razonamiento heredado está deshabilitado.
- Las opciones explícitas del selector usan sus etiquetas de nivel directas, a la vez que conservan las etiquetas del proveedor cuando están presentes (por ejemplo, `Maximum` para una opción `max` etiquetada por el proveedor).
- El selector usa `thinkingLevels` devuelto por la fila/valores predeterminados de sesión del Gateway, con `thinkingOptions` conservado como lista de etiquetas heredada. La interfaz del navegador no mantiene su propia lista de regex de proveedores; los plugins son propietarios de los conjuntos de niveles específicos de modelo.
- `/think:<level>` sigue funcionando y actualiza el mismo nivel de sesión almacenado, por lo que las directivas del chat y el selector permanecen sincronizados.

## Perfiles de proveedor

- Los plugins de proveedor pueden exponer `resolveThinkingProfile(ctx)` para definir los niveles admitidos y el valor predeterminado del modelo.
- Los plugins de proveedor que actúan como proxy de modelos Claude deben reutilizar `resolveClaudeThinkingProfile(modelId)` desde `openclaw/plugin-sdk/provider-model-shared` para que los catálogos directos de Anthropic y los de proxy permanezcan alineados.
- Cada nivel de perfil tiene un `id` canónico almacenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) y puede incluir una `label` de visualización. Los proveedores binarios usan `{ id: "low", label: "on" }`.
- Los hooks de perfil reciben datos de catálogo fusionados cuando están disponibles, incluidos `reasoning`, `compat.thinkingFormat` y `compat.supportedReasoningEfforts`. Usa esos datos para exponer perfiles binarios o personalizados solo cuando el contrato de solicitud configurado admite la carga correspondiente.
- Los plugins de herramientas que necesiten validar una sobrescritura explícita de razonamiento deben usar `api.runtime.agent.resolveThinkingPolicy({ provider, model })` más `api.runtime.agent.normalizeThinkingLevel(...)`; no deben mantener sus propias listas de niveles por proveedor/modelo.
- Los plugins de herramientas con acceso a metadatos configurados de modelos personalizados pueden pasar `catalog` a `resolveThinkingPolicy` para que las inclusiones voluntarias de `compat.supportedReasoningEfforts` se reflejen en la validación del lado del plugin.
- Los hooks heredados publicados (`supportsXHighThinking`, `isBinaryThinking` y `resolveDefaultThinkingLevel`) permanecen como adaptadores de compatibilidad, pero los nuevos conjuntos de niveles personalizados deben usar `resolveThinkingProfile`.
- Las filas/valores predeterminados del Gateway exponen `thinkingLevels`, `thinkingOptions` y `thinkingDefault` para que los clientes ACP/chat representen los mismos ids y etiquetas de perfil que usa la validación en tiempo de ejecución.
