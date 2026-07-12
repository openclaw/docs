---
read_when:
    - Ajuste del análisis, el modo rápido o el análisis y los valores predeterminados de las directivas detalladas
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y la visibilidad del razonamiento
title: Niveles de razonamiento
x-i18n:
    generated_at: "2026-07-12T14:53:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## Qué hace

- Directiva en línea en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, que reflejan aproximadamente la escala clásica de palabras mágicas de Anthropic "think" < "think hard" < "think harder" < "ultrathink":
  - minimal ~ "pensar"
  - low ~ "pensar mucho"
  - medium ~ "pensar aún más"
  - high ~ "ultrathink" (presupuesto máximo)
  - xhigh ~ "ultrathink+" (modelos GPT-5.2+ y Codex, además del esfuerzo de Anthropic Claude Opus 4.7+)
  - adaptive → pensamiento adaptativo gestionado por el proveedor (compatible con Claude 4.6 en Anthropic/Bedrock, Anthropic Claude Opus 4.7+ y el pensamiento dinámico de Google Gemini)
  - max → razonamiento máximo del proveedor (Anthropic Claude Opus 4.7+; Ollama lo asigna a su máximo esfuerzo `think` nativo)
  - ultra → razonamiento máximo del proveedor más orquestación proactiva de subagentes cuando el modelo o entorno de ejecución seleccionado lo admite
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest` se asigna a `high`.
- Notas sobre proveedores:
  - Los menús y selectores de pensamiento se basan en el perfil del proveedor. Los plugins de proveedor declaran el conjunto exacto de niveles para el modelo seleccionado, incluidas etiquetas como el valor binario `on`.
  - `adaptive`, `xhigh`, `max` y `ultra` solo se anuncian para los perfiles de proveedor, modelo y entorno de ejecución que los admiten. Las directivas escritas para niveles no compatibles se rechazan y se muestran las opciones válidas de ese modelo.
  - Los niveles no compatibles almacenados se reasignan según el rango del perfil del proveedor. `adaptive` recurre a `medium` en los modelos no adaptativos, mientras que `xhigh` y `max` recurren al mayor nivel compatible distinto de off para el modelo seleccionado.
  - Los modelos Anthropic Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece un nivel de pensamiento explícito.
  - Anthropic Claude Opus 4.8 y Opus 4.7 mantienen el pensamiento desactivado a menos que se establezca explícitamente un nivel de pensamiento. El valor predeterminado de esfuerzo propiedad del proveedor de Opus 4.8 es `high` una vez habilitado el pensamiento adaptativo.
  - Anthropic Claude Opus 4.7+ asigna `/think xhigh` al pensamiento adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de pensamiento y `xhigh` es el ajuste de esfuerzo de Opus.
  - Anthropic Claude Opus 4.7+ también expone `/think max`; se asigna a la misma ruta de esfuerzo máximo propiedad del proveedor.
  - Los modelos DeepSeek V4 directos exponen `/think xhigh|max`; ambos se asignan a `reasoning_effort: "max"` de DeepSeek, mientras que los niveles inferiores distintos de off se asignan a `high`.
  - Los modelos DeepSeek V4 enrutados mediante OpenRouter exponen `/think xhigh` y envían valores `reasoning.effort` compatibles con OpenRouter en lugar del campo de nivel superior `reasoning_effort` nativo de DeepSeek. Los niveles inferiores distintos de off se asignan a `high`, y las anulaciones de `max` almacenadas recurren a `xhigh`.
  - Los modelos de Ollama con capacidad de pensamiento exponen `/think low|medium|high|max`; `max` se asigna a `think: "high"` nativo porque la API nativa de Ollama acepta las cadenas de esfuerzo `low`, `medium` y `high`.
  - Los modelos GPT de OpenAI asignan `/think` mediante la compatibilidad con el esfuerzo específica del modelo de la Responses API. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo de destino lo admite; de lo contrario, OpenClaw omite la carga de razonamiento desactivado en lugar de enviar un valor no compatible.
  - GPT-5.6 Sol y Terra exponen `/think ultra` nativo mediante el entorno de ejecución Codex. GPT-5.6 Luna expone niveles hasta `max` porque su catálogo de Codex no anuncia Ultra.
  - El entorno de ejecución integrado de OpenClaw expone `/think ultra` lógico para GPT-5.6 Sol, Terra y Luna. Envía el esfuerzo máximo del proveedor y añade instrucciones de orquestación proactiva de subagentes con alcance de ejecución.
  - Las entradas personalizadas de catálogos compatibles con OpenAI pueden habilitar `/think xhigh` estableciendo `models.providers.<provider>.models[].compat.supportedReasoningEfforts` de modo que incluya `"xhigh"`. Esto utiliza los mismos metadatos de compatibilidad que asignan las cargas de esfuerzo de razonamiento salientes de OpenAI, por lo que los menús, la validación de sesiones, la CLI del agente y `llm-task` coinciden con el comportamiento del transporte.
  - Las referencias configuradas obsoletas de OpenRouter Hunter Alpha omiten la inyección de razonamiento del proxy porque esa ruta retirada podía devolver el texto de la respuesta final mediante los campos de razonamiento.
  - Google Gemini asigna `/think adaptive` al pensamiento dinámico propiedad del proveedor de Gemini. Las solicitudes de Gemini 3 omiten un `thinkingLevel` fijo, mientras que las solicitudes de Gemini 2.5 envían `thinkingBudget: -1`; los niveles fijos siguen asignándose al `thinkingLevel` o presupuesto de Gemini más cercano para esa familia de modelos.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) en la ruta de transmisión compatible con Anthropic usa de forma predeterminada `thinking: { type: "disabled" }`, a menos que se establezca explícitamente el pensamiento en los parámetros del modelo o de la solicitud. Esto evita la filtración de deltas `reasoning_content` del formato de transmisión de M2.x, que no es nativo de Anthropic. MiniMax-M3 (y M3.x) está exento: M3 emite bloques de pensamiento Anthropic correctos y devuelve contenido vacío cuando el pensamiento está desactivado, por lo que OpenClaw mantiene M3 en la ruta de pensamiento omitido/adaptativo del proveedor.
  - Z.AI (`zai/*`) es binario (`on`/`off`) para la mayoría de los modelos GLM. GLM-5.2 es la excepción: expone `/think off|low|high|max`, asigna `low` y `high` a `reasoning_effort: "high"` de Z.AI y asigna `max` a `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) siempre piensa. Su perfil solo expone `on` y OpenClaw omite el campo `thinking` saliente, tal como exige Moonshot. Otros modelos `moonshot/*` asignan `/think off` a `thinking: { type: "disabled" }` y cualquier nivel distinto de `off` a `thinking: { type: "enabled" }`. Cuando el pensamiento está habilitado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva en línea en el mensaje (se aplica únicamente a ese mensaje).
2. Anulación de sesión (se establece enviando un mensaje que contenga únicamente la directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Alternativa: valor predeterminado declarado por el proveedor cuando esté disponible; de lo contrario, los modelos con capacidad de razonamiento se establecen en `medium` o en el nivel compatible distinto de `off` más cercano para ese modelo, y los modelos sin capacidad de razonamiento permanecen en `off`.

## Establecer un valor predeterminado de sesión

- Envía un mensaje que contenga **solo** la directiva (se permiten espacios en blanco), por ejemplo, `/think:medium` o `/t high`.
- Esto se mantiene durante la sesión actual (de forma predeterminada, por remitente). Usa `/think default` para borrar la anulación de la sesión y heredar el valor predeterminado configurado o del proveedor; los alias incluyen `inherit`, `clear`, `reset` y `unpin`.
- `/think off` almacena una anulación explícita de desactivación. Desactiva el razonamiento hasta que cambies o borres la anulación de la sesión.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo, `/thinking big`), el comando se rechaza con una indicación y el estado de la sesión permanece sin cambios.
- Envía `/think` (o `/think:`) sin argumentos para ver el nivel de razonamiento actual.

## Aplicación por agente

- **OpenClaw integrado**: el nivel resuelto se pasa al entorno de ejecución del agente OpenClaw en proceso.
- **Backend de Claude CLI**: los niveles concretos distintos de desactivado se pasan a Claude Code como `--effort` cuando se usa `claude-cli`; `adaptive` elimina los indicadores de esfuerzo configurados y delega el esfuerzo efectivo en el entorno, la configuración y los valores predeterminados del modelo de Claude Code. Consulte [backends de CLI](/es/gateway/cli-backends).

## Modo rápido (/fast)

- Niveles: `auto|on|off|default`.
- Un mensaje que contiene solo la directiva activa o desactiva una anulación del modo rápido para la sesión y responde `Fast mode set to auto.`, `Fast mode enabled.` o `Fast mode disabled.`. Use `/fast default` para borrar la anulación de la sesión y heredar el valor predeterminado configurado; los alias incluyen `inherit`, `clear`, `reset` y `unpin`.
- Envíe `/fast` (o `/fast status`) sin ningún modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. Anulación mediante `/fast auto|on|off` en línea o como única directiva (`/fast default` borra esta capa)
  2. Anulación de la sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Alternativa: `off`
- `auto` mantiene el modo de sesión/configuración como automático, pero resuelve cada nueva llamada al modelo de forma independiente. Las llamadas que comienzan antes del límite automático tienen activado el modo rápido; las llamadas posteriores de reintento, alternativa, resultado de herramienta o continuación comienzan con el modo rápido desactivado. El límite predeterminado es de 60 segundos; configure `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` en el modelo activo para cambiarlo.
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI mediante el envío de `service_tier=priority` en las solicitudes Responses compatibles.
- Para los modelos `openai/*` / `openai-codex/*` respaldados por Codex, el modo rápido envía el mismo indicador `service_tier=priority` en Codex Responses. Los turnos nativos del servidor de aplicaciones de Codex reciben el nivel solo en `turn/start` o al iniciar/reanudar un hilo, por lo que `auto` no puede cambiar el nivel de un turno del servidor de aplicaciones que ya está en ejecución; se aplica al siguiente turno del modelo que inicia OpenClaw.
- Para las solicitudes públicas directas a `anthropic/*`, incluido el tráfico autenticado mediante OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a los niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto` y `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) sustituye `MiniMax-M2.7` por `MiniMax-M2.7-highspeed`.
- Los parámetros explícitos del modelo `serviceTier` / `service_tier` de Anthropic anulan el valor predeterminado del modo rápido cuando ambos están configurados. OpenClaw sigue omitiendo la inserción del nivel de servicio de Anthropic para las URL base de proxy que no son de Anthropic.
- `/status` muestra `Fast` cuando el modo rápido está activado y `Fast:auto` cuando el modo configurado es automático.

## Directivas de detalle (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje que solo contiene una directiva alterna el modo detallado de la sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una sugerencia sin cambiar el estado.
- `/verbose off` almacena una anulación explícita para la sesión; elimínela mediante la interfaz de Sesiones seleccionando `inherit`.
- Los remitentes autorizados de canales externos pueden conservar la anulación del modo detallado de la sesión. Los clientes internos del Gateway/webchat necesitan `operator.admin` para conservarla.
- Una directiva en línea afecta únicamente a ese mensaje; en caso contrario, se aplican los valores predeterminados de la sesión o globales.
- Envíe `/verbose` (o `/verbose:`) sin argumentos para ver el nivel de detalle actual.
- Cuando el modo detallado está activado, los agentes que emiten resultados estructurados de herramientas devuelven cada llamada a una herramienta como un mensaje independiente que solo contiene metadatos, con el prefijo `<emoji> <tool-name>: <arg>` cuando está disponible. Estos resúmenes de herramientas se envían en cuanto se inicia cada herramienta (en burbujas separadas), no como deltas de transmisión.
- Los resúmenes de fallos de herramientas permanecen visibles en el modo normal, pero los sufijos con detalles de errores sin procesar se ocultan a menos que el nivel de detalle sea `full`.
- Cuando el nivel de detalle es `full`, las salidas de las herramientas también se reenvían tras finalizar (en una burbuja separada y truncadas a una longitud segura). Si se cambia `/verbose on|full|off` mientras hay una ejecución en curso, las burbujas de herramientas posteriores respetan la nueva configuración.
- `agents.defaults.toolProgressDetail` controla el formato de los resúmenes de herramientas de `/verbose` y de las líneas de herramientas en borradores de progreso. Se usa `"explain"` (valor predeterminado) para etiquetas humanas compactas como `🛠️ Exec: checking JS syntax`; se usa `"raw"` cuando también se desea añadir el comando o detalle sin procesar para la depuración. El valor de `agents.list[].toolProgressDetail` de cada agente sustituye al predeterminado.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Directivas de seguimiento de Plugin (/trace)

- Niveles: `on` | `off` (predeterminado).
- El mensaje que contiene únicamente la directiva activa o desactiva la salida de trazas del Plugin para la sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva en línea solo afecta a ese mensaje; de lo contrario, se aplican los valores predeterminados de la sesión o globales.
- Envíe `/trace` (o `/trace:`) sin argumentos para ver el nivel de trazas actual.
- `/trace` tiene un alcance más limitado que `/verbose`: solo muestra líneas de traza o depuración propias del Plugin, como los resúmenes de depuración de Active Memory.
- Las líneas de traza pueden aparecer en `/status` y como mensaje de diagnóstico posterior a la respuesta normal del asistente.

## Visibilidad del razonamiento (/reasoning)

- Niveles: `on|off|stream`.
- El mensaje que solo contiene la directiva alterna si los bloques de razonamiento se muestran en las respuestas.
- Cuando está habilitado, el razonamiento se envía como un **mensaje independiente** con el prefijo `Thinking`.
- `stream`: transmite el razonamiento mientras se genera la respuesta cuando el canal activo admite vistas previas del razonamiento y, después, envía la respuesta final sin el razonamiento.
- Alias: `/reason`.
- Envíe `/reasoning` (o `/reasoning:`) sin argumentos para ver el nivel de razonamiento actual.
- Orden de resolución: directiva insertada, luego anulación de sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`), luego valor predeterminado global (`agents.defaults.reasoningDefault`) y, por último, valor de reserva (`off`).

Las etiquetas de razonamiento mal formadas de los modelos locales se gestionan de forma conservadora. Los bloques `<think>...</think>` cerrados permanecen ocultos en las respuestas normales, y el razonamiento sin cerrar después de texto ya visible también se oculta. Si una respuesta está completamente envuelta en una única etiqueta de apertura sin cerrar y, de otro modo, se entregaría como texto vacío, OpenClaw elimina la etiqueta de apertura mal formada y entrega el texto restante.

## Relacionado

- La documentación del modo elevado se encuentra en [Modo elevado](/es/tools/elevated).

## Heartbeats

- El cuerpo de la sonda de Heartbeat es la indicación de Heartbeat configurada (valor predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas insertadas en un mensaje de Heartbeat se aplican como de costumbre (pero se debe evitar cambiar los valores predeterminados de la sesión desde los Heartbeats).
- De forma predeterminada, la entrega de Heartbeat solo incluye la carga útil final. Para enviar también el mensaje `Thinking` independiente (cuando esté disponible), establezca `agents.defaults.heartbeat.includeReasoning: true` o, por agente, `agents.list[].heartbeat.includeReasoning: true`.

## Interfaz web de chat

- El selector de razonamiento del chat web refleja el nivel almacenado de la sesión desde el almacén o la configuración de la sesión entrante cuando se carga la página.
- Al elegir otro nivel, la anulación de sesión se escribe inmediatamente mediante `sessions.patch`; no se espera al siguiente envío ni se trata de una anulación puntual de `thinkingOnce`.
- Si se realiza un envío mientras aún se están aplicando cambios en los selectores de modelo, razonamiento o velocidad, se espera a que terminen todos los parches pendientes de los selectores; si un cambio falla, el mensaje permanece sin enviar para su revisión.
- La primera opción siempre permite borrar la anulación. Muestra `Inherited: <resolved level>`, incluido `Inherited: Off` cuando el razonamiento heredado está deshabilitado.
- Las opciones explícitas del selector usan directamente sus etiquetas de nivel y conservan las etiquetas del proveedor cuando existen (por ejemplo, `Maximum` para una opción `max` etiquetada por el proveedor).
- El selector usa `thinkingLevels`, devuelto por la fila o los valores predeterminados de la sesión del Gateway, mientras que `thinkingOptions` se conserva como una lista de etiquetas heredada. La interfaz del navegador no mantiene su propia lista de expresiones regulares de proveedores; los plugins son responsables de los conjuntos de niveles específicos de cada modelo.
- `/think:<level>` sigue funcionando y actualiza el mismo nivel almacenado de la sesión, por lo que las directivas del chat y el selector permanecen sincronizados.

## Perfiles de proveedores

- Los plugins de proveedores pueden exponer `resolveThinkingProfile(ctx)` para definir los niveles admitidos y el valor predeterminado del modelo.
- Los plugins de proveedores que actúan como proxy de modelos Claude deben reutilizar `resolveClaudeThinkingProfile(modelId)` de `openclaw/plugin-sdk/provider-model-shared` para que los catálogos directos de Anthropic y los catálogos proxy permanezcan alineados.
- Cada nivel de perfil tiene un `id` canónico almacenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` o `ultra`) y puede incluir una `label` para mostrar. Los proveedores binarios usan `{ id: "low", label: "on" }`.
- Los hooks de perfil reciben datos combinados del catálogo cuando están disponibles, incluidos `reasoning`, `compat.thinkingFormat` y `compat.supportedReasoningEfforts`. Use esos datos para exponer perfiles binarios o personalizados solo cuando el contrato de solicitud configurado admita la carga útil correspondiente.
- Los plugins de herramientas que necesiten validar una anulación explícita del razonamiento deben usar `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` junto con `api.runtime.agent.normalizeThinkingLevel(...)`; no deben mantener sus propias listas de niveles por proveedor o modelo. Pase `agentRuntime` cuando la herramienta sea responsable de la ruta de ejecución, como en una ejecución siempre integrada.
- Los plugins de herramientas con acceso a metadatos configurados de modelos personalizados pueden pasar `catalog` a `resolveThinkingPolicy` para que las inclusiones voluntarias de `compat.supportedReasoningEfforts` se reflejen en la validación realizada por el plugin.
- Los hooks heredados publicados (`supportsXHighThinking`, `isBinaryThinking` y `resolveDefaultThinkingLevel`) permanecen como adaptadores de compatibilidad, pero los nuevos conjuntos de niveles personalizados deben usar `resolveThinkingProfile`.
- Las filas y los valores predeterminados del Gateway exponen `thinkingLevels`, `thinkingOptions` y `thinkingDefault` para que los clientes de ACP y chat representen los mismos identificadores y etiquetas de perfil que usa la validación en tiempo de ejecución.
