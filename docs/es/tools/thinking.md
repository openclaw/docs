---
read_when:
    - Ajuste del análisis, el modo rápido o el análisis y los valores predeterminados de las directivas detalladas
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y la visibilidad del razonamiento
title: Niveles de razonamiento
x-i18n:
    generated_at: "2026-07-11T23:40:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## Qué hace

- Directiva insertada en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, que reflejan aproximadamente la escala clásica de palabras mágicas de Anthropic «piensa» < «piensa mucho» < «piensa aún más» < «ultrapiensa»:
  - minimal ~ «piensa»
  - low ~ «piensa mucho»
  - medium ~ «piensa aún más»
  - high ~ «ultrapiensa» (presupuesto máximo)
  - xhigh ~ «ultrapiensa+» (modelos GPT-5.2+ y Codex, además del esfuerzo de Anthropic Claude Opus 4.7+)
  - adaptive → razonamiento adaptativo administrado por el proveedor (compatible con Claude 4.6 en Anthropic/Bedrock, Anthropic Claude Opus 4.7+ y el razonamiento dinámico de Google Gemini)
  - max → razonamiento máximo del proveedor (Anthropic Claude Opus 4.7+; Ollama lo asigna a su máximo esfuerzo `think` nativo)
  - ultra → razonamiento máximo del proveedor más orquestación proactiva de subagentes cuando el modelo o entorno de ejecución seleccionado lo admite
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest` se asigna a `high`.
- Notas sobre proveedores:
  - Los menús y selectores de razonamiento se basan en el perfil del proveedor. Los Plugins de proveedor declaran el conjunto exacto de niveles para el modelo seleccionado, incluidas etiquetas como el valor binario `on`.
  - `adaptive`, `xhigh`, `max` y `ultra` solo se anuncian para perfiles de proveedor, modelo y entorno de ejecución que los admiten. Las directivas escritas con niveles no compatibles se rechazan mostrando las opciones válidas para ese modelo.
  - Los niveles no compatibles almacenados se reasignan según el rango del perfil del proveedor. `adaptive` retrocede a `medium` en modelos no adaptativos, mientras que `xhigh` y `max` retroceden al mayor nivel compatible distinto de `off` para el modelo seleccionado.
  - Los modelos Anthropic Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece un nivel de razonamiento explícito.
  - Anthropic Claude Opus 4.8 y Opus 4.7 mantienen el razonamiento desactivado a menos que establezcas explícitamente un nivel de razonamiento. El valor predeterminado de esfuerzo administrado por el proveedor de Opus 4.8 es `high` después de activar el razonamiento adaptativo.
  - Anthropic Claude Opus 4.7+ asigna `/think xhigh` al razonamiento adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de razonamiento y `xhigh` es el ajuste de esfuerzo de Opus.
  - Anthropic Claude Opus 4.7+ también ofrece `/think max`; se asigna a la misma ruta de esfuerzo máximo administrada por el proveedor.
  - Los modelos DeepSeek V4 directos ofrecen `/think xhigh|max`; ambos se asignan a `reasoning_effort: "max"` de DeepSeek, mientras que los niveles inferiores distintos de `off` se asignan a `high`.
  - Los modelos DeepSeek V4 enrutados mediante OpenRouter ofrecen `/think xhigh` y envían valores de `reasoning.effort` compatibles con OpenRouter en lugar del `reasoning_effort` de nivel superior nativo de DeepSeek. Los niveles inferiores distintos de `off` se asignan a `high`, y las anulaciones `max` almacenadas retroceden a `xhigh`.
  - Los modelos de Ollama con capacidad de razonamiento ofrecen `/think low|medium|high|max`; `max` se asigna al valor nativo `think: "high"` porque la API nativa de Ollama acepta las cadenas de esfuerzo `low`, `medium` y `high`.
  - Los modelos GPT de OpenAI asignan `/think` mediante la compatibilidad de esfuerzo específica del modelo en la API Responses. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo de destino lo admite; de lo contrario, OpenClaw omite la carga de razonamiento desactivado en lugar de enviar un valor no compatible.
  - GPT-5.6 Sol y Terra ofrecen `/think ultra` nativo mediante el entorno de ejecución de Codex. GPT-5.6 Luna ofrece niveles hasta `max` porque su catálogo de Codex no anuncia Ultra.
  - El entorno de ejecución integrado de OpenClaw ofrece `/think ultra` lógico para GPT-5.6 Sol, Terra y Luna. Envía el esfuerzo máximo del proveedor y añade instrucciones de orquestación proactiva de subagentes limitadas a la ejecución.
  - Las entradas personalizadas de catálogos compatibles con OpenAI pueden habilitar `/think xhigh` configurando `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para que incluya `"xhigh"`. Esto usa los mismos metadatos de compatibilidad que asignan las cargas de esfuerzo de razonamiento salientes de OpenAI, de modo que los menús, la validación de sesiones, la CLI del agente y `llm-task` coincidan con el comportamiento del transporte.
  - Las referencias obsoletas configuradas de OpenRouter Hunter Alpha omiten la inyección de razonamiento del proxy porque esa ruta retirada podía devolver texto de la respuesta final mediante campos de razonamiento.
  - Google Gemini asigna `/think adaptive` al razonamiento dinámico administrado por el proveedor de Gemini. Las solicitudes de Gemini 3 omiten un `thinkingLevel` fijo, mientras que las solicitudes de Gemini 2.5 envían `thinkingBudget: -1`; los niveles fijos continúan asignándose al `thinkingLevel` o presupuesto de Gemini más cercano para esa familia de modelos.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) en la ruta de transmisión compatible con Anthropic usa de forma predeterminada `thinking: { type: "disabled" }`, salvo que establezcas explícitamente el razonamiento en los parámetros del modelo o de la solicitud. Esto evita la filtración de incrementos de `reasoning_content` procedentes del formato de transmisión no nativo de Anthropic de M2.x. MiniMax-M3 (y M3.x) queda exento: M3 emite bloques de razonamiento de Anthropic correctos y devuelve contenido vacío cuando el razonamiento está desactivado, por lo que OpenClaw mantiene M3 en la ruta de razonamiento omitido o adaptativo del proveedor.
  - Z.AI (`zai/*`) es binario (`on`/`off`) para la mayoría de los modelos GLM. GLM-5.2 es la excepción: ofrece `/think off|low|high|max`, asigna `low` y `high` a `reasoning_effort: "high"` de Z.AI y asigna `max` a `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) siempre razona. Su perfil solo ofrece `on`, y OpenClaw omite el campo `thinking` saliente según exige Moonshot. Otros modelos `moonshot/*` asignan `/think off` a `thinking: { type: "disabled" }` y cualquier nivel distinto de `off` a `thinking: { type: "enabled" }`. Cuando el razonamiento está activado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva insertada en el mensaje (se aplica solo a ese mensaje).
2. Anulación de sesión (se establece enviando un mensaje que solo contenga la directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Alternativa: valor predeterminado declarado por el proveedor cuando esté disponible; de lo contrario, los modelos con capacidad de razonamiento se resuelven en `medium` o en el nivel compatible distinto de `off` más cercano para ese modelo, y los modelos sin razonamiento permanecen en `off`.

## Configurar un valor predeterminado de sesión

- Envía un mensaje que contenga **solo** la directiva (se permiten espacios en blanco), por ejemplo, `/think:medium` o `/t high`.
- Esto permanece activo durante la sesión actual (de forma predeterminada, por remitente). Usa `/think default` para borrar la anulación de sesión y heredar el valor predeterminado configurado o del proveedor; los alias incluyen `inherit`, `clear`, `reset` y `unpin`.
- `/think off` almacena una anulación explícita de desactivación. Desactiva el razonamiento hasta que cambies o borres la anulación de sesión.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo, `/thinking big`), el comando se rechaza con una sugerencia y el estado de la sesión permanece sin cambios.
- Envía `/think` (o `/think:`) sin argumentos para ver el nivel de razonamiento actual.

## Aplicación por agente

- **OpenClaw integrado**: el nivel resuelto se transfiere al entorno de ejecución del agente OpenClaw dentro del proceso.
- **Backend de la CLI de Claude**: los niveles concretos distintos de `off` se transfieren a Claude Code como `--effort` al usar `claude-cli`; `adaptive` elimina las marcas de esfuerzo configuradas y delega el esfuerzo efectivo al entorno, los ajustes y los valores predeterminados del modelo de Claude Code. Consulta [backends de la CLI](/es/gateway/cli-backends).

## Modo rápido (/fast)

- Niveles: `auto|on|off|default`.
- Un mensaje que solo contenga la directiva alterna una anulación del modo rápido de la sesión y responde `Fast mode set to auto.`, `Fast mode enabled.` o `Fast mode disabled.`. Usa `/fast default` para borrar la anulación de sesión y heredar el valor predeterminado configurado; los alias incluyen `inherit`, `clear`, `reset` y `unpin`.
- Envía `/fast` (o `/fast status`) sin indicar un modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. Anulación insertada o mediante una directiva exclusiva `/fast auto|on|off` (`/fast default` borra esta capa)
  2. Anulación de sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Alternativa: `off`
- `auto` mantiene el modo de la sesión o configuración en automático, pero resuelve cada nueva llamada al modelo de forma independiente. Las llamadas que comienzan antes del límite automático tienen activado el modo rápido; las llamadas posteriores de reintento, alternativa, resultado de herramienta o continuación comienzan con el modo rápido desactivado. El límite predeterminado es de 60 segundos; establece `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` en el modelo activo para cambiarlo.
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI mediante el envío de `service_tier=priority` en las solicitudes Responses compatibles.
- Para modelos `openai/*` / `openai-codex/*` respaldados por Codex, el modo rápido envía la misma marca `service_tier=priority` en Codex Responses. Los turnos nativos del servidor de aplicaciones de Codex reciben el nivel solo en `turn/start` o al iniciar o reanudar un hilo, por lo que `auto` no puede cambiar el nivel de un turno del servidor de aplicaciones que ya esté en ejecución; se aplica al siguiente turno del modelo que inicie OpenClaw.
- Para solicitudes públicas directas `anthropic/*`, incluido el tráfico autenticado mediante OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a los niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto` y `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) sustituye `MiniMax-M2.7` por `MiniMax-M2.7-highspeed`.
- Los parámetros explícitos del modelo `serviceTier` / `service_tier` de Anthropic anulan el valor predeterminado del modo rápido cuando ambos están establecidos. OpenClaw continúa omitiendo la inyección del nivel de servicio de Anthropic para las URL base de proxies que no sean de Anthropic.
- `/status` muestra `Fast` cuando el modo rápido está activado y `Fast:auto` cuando el modo configurado es automático.

## Directivas de registro detallado (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje que solo contenga la directiva alterna el registro detallado de la sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una sugerencia sin cambiar el estado.
- `/verbose off` almacena una anulación explícita de sesión; bórrala mediante la interfaz de sesiones eligiendo `inherit`.
- Los remitentes autorizados de canales externos pueden conservar la anulación del registro detallado de la sesión. Los clientes internos del Gateway o del chat web necesitan `operator.admin` para conservarla.
- Una directiva insertada solo afecta a ese mensaje; en los demás casos se aplican los valores predeterminados de la sesión o globales.
- Envía `/verbose` (o `/verbose:`) sin argumentos para ver el nivel actual de registro detallado.
- Cuando el registro detallado está activado, los agentes que emiten resultados estructurados de herramientas devuelven cada llamada de herramienta como un mensaje independiente que solo contiene metadatos, con el prefijo `<emoji> <tool-name>: <arg>` cuando está disponible. Estos resúmenes de herramientas se envían en cuanto se inicia cada herramienta (en burbujas separadas), no como incrementos de transmisión.
- Los resúmenes de fallos de herramientas permanecen visibles en el modo normal, pero los sufijos con detalles de errores sin procesar se ocultan a menos que el registro detallado sea `full`.
- Cuando el registro detallado es `full`, las salidas de las herramientas también se reenvían después de finalizar (en una burbuja separada y truncadas a una longitud segura). Si alternas `/verbose on|full|off` mientras una ejecución está en curso, las burbujas de herramientas posteriores respetan la nueva configuración.
- `agents.defaults.toolProgressDetail` controla la forma de los resúmenes de herramientas de `/verbose` y de las líneas de herramientas de los borradores de progreso. Usa `"explain"` (predeterminado) para obtener etiquetas humanas compactas como `🛠️ Exec: checking JS syntax`; usa `"raw"` cuando también quieras añadir el comando o detalle sin procesar para la depuración. El valor por agente `agents.list[].toolProgressDetail` anula el predeterminado.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Directivas de traza de Plugin (/trace)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje que solo contenga la directiva alterna la salida de traza del Plugin de la sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- Una directiva insertada solo afecta a ese mensaje; en los demás casos se aplican los valores predeterminados de la sesión o globales.
- Envía `/trace` (o `/trace:`) sin argumentos para ver el nivel de traza actual.
- `/trace` tiene un alcance más limitado que `/verbose`: solo muestra líneas de traza o depuración pertenecientes al Plugin, como los resúmenes de depuración de Active Memory.
- Las líneas de traza pueden aparecer en `/status` y como un mensaje de diagnóstico posterior a la respuesta normal del asistente.

## Visibilidad del razonamiento (/reasoning)

- Niveles: `on|off|stream`.
- El mensaje que contiene únicamente la directiva alterna si los bloques de razonamiento se muestran en las respuestas.
- Cuando está habilitado, el razonamiento se envía como un **mensaje separado** con el prefijo `Thinking`.
- `stream`: transmite el razonamiento mientras se genera la respuesta cuando el canal activo admite vistas previas del razonamiento y, después, envía la respuesta final sin el razonamiento.
- Alias: `/reason`.
- Envía `/reasoning` (o `/reasoning:`) sin argumentos para ver el nivel de razonamiento actual.
- Orden de resolución: directiva integrada, luego anulación de la sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`), luego valor predeterminado global (`agents.defaults.reasoningDefault`) y, por último, valor de reserva (`off`).

Las etiquetas de razonamiento mal formadas de modelos locales se gestionan de manera conservadora. Los bloques `<think>...</think>` cerrados permanecen ocultos en las respuestas normales, y también se oculta el razonamiento sin cerrar que aparezca después de texto ya visible. Si una respuesta está completamente envuelta en una única etiqueta de apertura sin cerrar y, de otro modo, se entregaría como texto vacío, OpenClaw elimina la etiqueta de apertura mal formada y entrega el texto restante.

## Relacionado

- La documentación del modo elevado se encuentra en [Modo elevado](/es/tools/elevated).

## Heartbeats

- El cuerpo de la comprobación de Heartbeat es el prompt de heartbeat configurado (valor predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas integradas en un mensaje de heartbeat se aplican como de costumbre (pero evita cambiar los valores predeterminados de la sesión desde los heartbeats).
- De forma predeterminada, la entrega de Heartbeat incluye únicamente la carga útil final. Para enviar también el mensaje `Thinking` separado (cuando esté disponible), establece `agents.defaults.heartbeat.includeReasoning: true` o, por agente, `agents.list[].heartbeat.includeReasoning: true`.

## Interfaz web de chat

- Al cargar la página, el selector de razonamiento del chat web refleja el nivel almacenado de la sesión procedente del almacén o la configuración de la sesión entrante.
- Al elegir otro nivel, se escribe inmediatamente la anulación de la sesión mediante `sessions.patch`; no se espera al siguiente envío y no se trata de una anulación puntual de `thinkingOnce`.
- Si se envía mientras todavía se están aplicando cambios en los selectores de modelo, razonamiento o velocidad, se espera a que finalicen todos los parches pendientes de los selectores; si un cambio falla, el mensaje permanece sin enviar para su revisión.
- La primera opción siempre permite borrar la anulación. Muestra `Inherited: <resolved level>`, incluido `Inherited: Off` cuando el razonamiento heredado está deshabilitado.
- Las selecciones explícitas del selector usan directamente las etiquetas de sus niveles, pero conservan las etiquetas del proveedor cuando existen (por ejemplo, `Maximum` para una opción `max` etiquetada por el proveedor).
- El selector usa `thinkingLevels`, devuelto por la fila o los valores predeterminados de la sesión del Gateway, mientras que `thinkingOptions` se conserva como lista de etiquetas heredada. La interfaz del navegador no mantiene su propia lista de expresiones regulares de proveedores; los plugins son responsables de los conjuntos de niveles específicos de cada modelo.
- `/think:<level>` sigue funcionando y actualiza el mismo nivel almacenado de la sesión, por lo que las directivas del chat y el selector permanecen sincronizados.

## Perfiles de proveedores

- Los plugins de proveedores pueden exponer `resolveThinkingProfile(ctx)` para definir los niveles admitidos y el valor predeterminado del modelo.
- Los plugins de proveedores que actúan como proxy para modelos Claude deben reutilizar `resolveClaudeThinkingProfile(modelId)` de `openclaw/plugin-sdk/provider-model-shared` para mantener alineados los catálogos directos de Anthropic y los catálogos de proxy.
- Cada nivel del perfil tiene un `id` canónico almacenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` o `ultra`) y puede incluir una `label` para mostrar. Los proveedores binarios usan `{ id: "low", label: "on" }`.
- Los hooks de perfil reciben datos combinados del catálogo cuando están disponibles, incluidos `reasoning`, `compat.thinkingFormat` y `compat.supportedReasoningEfforts`. Usa esos datos para exponer perfiles binarios o personalizados solo cuando el contrato de solicitud configurado admita la carga útil correspondiente.
- Los plugins de herramientas que necesiten validar una anulación explícita del razonamiento deben usar `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` junto con `api.runtime.agent.normalizeThinkingLevel(...)`; no deben mantener sus propias listas de niveles por proveedor o modelo. Pasa `agentRuntime` cuando la herramienta sea responsable de la ruta de ejecución, como en una ejecución siempre integrada.
- Los plugins de herramientas con acceso a metadatos configurados de modelos personalizados pueden pasar `catalog` a `resolveThinkingPolicy` para que las adhesiones voluntarias de `compat.supportedReasoningEfforts` se reflejen en la validación del lado del plugin.
- Los hooks heredados publicados (`supportsXHighThinking`, `isBinaryThinking` y `resolveDefaultThinkingLevel`) se mantienen como adaptadores de compatibilidad, pero los nuevos conjuntos de niveles personalizados deben usar `resolveThinkingProfile`.
- Las filas y los valores predeterminados del Gateway exponen `thinkingLevels`, `thinkingOptions` y `thinkingDefault` para que los clientes de ACP y chat representen los mismos identificadores y etiquetas de perfil que utiliza la validación en tiempo de ejecución.
