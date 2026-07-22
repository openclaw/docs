---
read_when:
    - Ajuste del análisis, el modo rápido o el análisis y los valores predeterminados de la directiva de verbosidad
summary: Sintaxis de las directivas /think, /fast, /verbose, /trace y visibilidad del razonamiento
title: Niveles de razonamiento
x-i18n:
    generated_at: "2026-07-22T10:50:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51b8be31d23400aa80f2e4809b8bd2487ecc6b7899ee541acec4a95fedc8fc1c
    source_path: tools/thinking.md
    workflow: 16
---

## Qué hace

- Directiva en línea en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, que reflejan aproximadamente la clásica escala de palabras mágicas de Anthropic «think» < «think hard» < «think harder» < «ultrathink»:
  - minimal ~ «piensa»
  - low ~ «piensa detenidamente»
  - medium ~ «piensa aún más detenidamente»
  - high ~ «ultrathink» (presupuesto máximo)
  - xhigh ~ «ultrathink+» (modelos GPT-5.2+ y Codex, además del esfuerzo de Anthropic Claude Opus 4.7+)
  - adaptive → pensamiento adaptativo gestionado por el proveedor (compatible con Claude 4.6 en Anthropic/Bedrock, Anthropic Claude Opus 4.7+ y el pensamiento dinámico de Google Gemini)
  - max → razonamiento máximo del proveedor (Anthropic Claude Opus 4.7+; Ollama lo asigna a su máximo esfuerzo nativo `think`)
  - ultra → razonamiento máximo del proveedor más orquestación proactiva de subagentes cuando el modelo o entorno de ejecución seleccionado lo admite
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest` se asigna a `high`.
- Notas sobre proveedores:
  - Los menús y selectores de pensamiento dependen del perfil del proveedor. Los plugins de proveedor declaran el conjunto exacto de niveles para el modelo seleccionado, incluidas etiquetas como el `on` binario.
  - `adaptive`, `xhigh`, `max` y `ultra` solo se anuncian para perfiles de proveedor, modelo y entorno de ejecución que los admitan. Las directivas escritas para niveles no compatibles se rechazan con las opciones válidas de ese modelo.
  - Los niveles no compatibles almacenados se reasignan según el rango del perfil del proveedor. `adaptive` recurre a `medium` en modelos no adaptativos, mientras que `xhigh` y `max` recurren al mayor nivel compatible distinto de desactivado para el modelo seleccionado.
  - Los modelos Anthropic Claude 4.6 utilizan `adaptive` de forma predeterminada cuando no se establece un nivel de pensamiento explícito.
  - Anthropic Claude Opus 4.8 y Opus 4.7 mantienen el pensamiento desactivado a menos que se establezca explícitamente un nivel de pensamiento. El esfuerzo predeterminado propiedad del proveedor de Opus 4.8 es `high` después de habilitar el pensamiento adaptativo.
  - Anthropic Claude Opus 4.7+ asigna `/think xhigh` al pensamiento adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de pensamiento y `xhigh` es la configuración de esfuerzo de Opus.
  - Anthropic Claude Opus 4.7+ también ofrece `/think max`; se asigna a la misma ruta de esfuerzo máximo propiedad del proveedor.
  - Los modelos DeepSeek V4 directos ofrecen `/think xhigh|max`; ambos se asignan a `reasoning_effort: "max"` de DeepSeek, mientras que los niveles inferiores distintos de desactivado se asignan a `high`.
  - Los modelos DeepSeek V4 enrutados mediante OpenRouter ofrecen `/think xhigh` y envían valores `reasoning.effort` compatibles con OpenRouter en lugar del `reasoning_effort` de nivel superior nativo de DeepSeek. Los niveles inferiores distintos de desactivado se asignan a `high`, y las sustituciones almacenadas de `max` recurren a `xhigh`.
  - Los modelos de Ollama con capacidad de pensamiento ofrecen `/think low|medium|high|max`; `max` se asigna al `think: "high"` nativo porque la API nativa de Ollama acepta las cadenas de esfuerzo `low`, `medium` y `high`.
  - Los modelos GPT de OpenAI asignan `/think` mediante la compatibilidad de esfuerzo específica de cada modelo en la API Responses. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo de destino lo admite; de lo contrario, OpenClaw omite la carga útil de razonamiento desactivada en lugar de enviar un valor no compatible.
  - GPT-5.6 Sol y Terra ofrecen `/think ultra` nativo mediante el entorno de ejecución de Codex. GPT-5.6 Luna ofrece niveles mediante `max` porque su catálogo de Codex no anuncia Ultra.
  - El entorno de ejecución integrado de OpenClaw ofrece `/think ultra` lógico para GPT-5.6 Sol, Terra y Luna. Envía el esfuerzo máximo del proveedor y añade indicaciones de orquestación proactiva de subagentes con alcance de ejecución.
  - Las entradas personalizadas del catálogo compatible con OpenAI pueden habilitar `/think xhigh` estableciendo `models.providers.<provider>.models[].compat.supportedReasoningEfforts` para incluir `"xhigh"`. Esto utiliza los mismos metadatos de compatibilidad que asignan las cargas útiles salientes de esfuerzo de razonamiento de OpenAI, de modo que los menús, la validación de sesiones, la CLI del agente y `llm-task` concuerden con el comportamiento del transporte.
  - Las referencias obsoletas configuradas de OpenRouter Hunter Alpha omiten la inyección de razonamiento del proxy porque esa ruta retirada podía devolver el texto de la respuesta final mediante campos de razonamiento.
  - Google Gemini asigna `/think adaptive` al pensamiento dinámico propiedad del proveedor de Gemini. Las solicitudes de Gemini 3 omiten un `thinkingLevel` fijo, mientras que las solicitudes de Gemini 2.5 envían `thinkingBudget: -1`; los niveles fijos siguen asignándose al `thinkingLevel` o presupuesto de Gemini más cercano para esa familia de modelos.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) en la ruta de transmisión compatible con Anthropic utiliza `thinking: { type: "disabled" }` de forma predeterminada, a menos que se establezca explícitamente el pensamiento en los parámetros del modelo o de la solicitud. Esto evita la filtración de deltas `reasoning_content` del formato de transmisión de Anthropic no nativo de M2.x. MiniMax-M3 (y M3.x) queda exento: M3 emite bloques de pensamiento de Anthropic correctos y devuelve contenido vacío cuando el pensamiento está desactivado, por lo que OpenClaw mantiene M3 en la ruta de pensamiento omitido/adaptativo del proveedor.
  - Z.AI (`zai/*`) es binario (`on`/`off`) para la mayoría de los modelos GLM. GLM-5.2 es la excepción: ofrece `/think off|low|high|max`, asigna `low` y `high` a `reasoning_effort: "high"` de Z.AI, y asigna `max` a `reasoning_effort: "max"`.
  - Kimi K3 de la API de Moonshot (`moonshot/kimi-k3`) siempre piensa con `max`, envía `reasoning_effort: "max"`, omite el campo `thinking` de K2 y las sustituciones de muestreo fijas, y conserva las opciones de herramientas compatibles con K3. Kimi Code K3 (`kimi/k3` y `kimi/k3[1m]`) ofrece `/think off|max`: desactivado envía `thinking.type: "disabled"`, mientras que máximo envía pensamiento adaptativo con esfuerzo máximo. Las referencias actuales de Kimi Code también incluyen `kimi/kimi-for-coding` y `kimi/kimi-for-coding-highspeed`. Kimi K2.7 Code (`moonshot/kimi-k2.7-code` y `moonshot/kimi-k2.7-code-highspeed`) siempre piensa, solo ofrece `on` y omite tanto `thinking` como `reasoning_effort` salientes. Otros modelos `moonshot/*` asignan `/think off` a `thinking: { type: "disabled" }` y cualquier nivel distinto de `off` a `thinking: { type: "enabled" }`. Cuando el pensamiento de K2 está habilitado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva en línea en el mensaje (se aplica únicamente a ese mensaje).
2. Sustitución de sesión (establecida al enviar un mensaje que solo contenga una directiva).
3. Valor predeterminado por agente (`agents.entries.*.thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Alternativa: valor predeterminado declarado por el proveedor cuando esté disponible; de lo contrario, los modelos con capacidad de razonamiento se resuelven en `medium` o en el nivel compatible distinto de `off` más cercano para ese modelo, y los modelos sin razonamiento permanecen en `off`.

## Establecer un valor predeterminado de sesión

- Envíe un mensaje que contenga **únicamente** la directiva (se permiten espacios en blanco), por ejemplo, `/think:medium` o `/t high`.
- Esto se mantiene durante la sesión actual (de forma predeterminada, por remitente). Utilice `/think default` para borrar la sustitución de sesión y heredar el valor predeterminado configurado o del proveedor; los alias incluyen `inherit`, `clear`, `reset` y `unpin`.
- `/think off` almacena una sustitución explícita de desactivación. Deshabilita el pensamiento hasta que se cambie o borre la sustitución de sesión.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo, `/thinking big`), el comando se rechaza con una indicación y el estado de la sesión permanece sin cambios.
- Envíe `/think` (o `/think:`) sin argumentos para ver el nivel de pensamiento actual.

## Aplicación por agente

- **OpenClaw integrado**: el nivel resuelto se pasa al entorno de ejecución del agente OpenClaw en el mismo proceso.
- **Backend de la CLI de Claude**: los niveles concretos distintos de desactivado se pasan a Claude Code como `--effort` cuando se utiliza `claude-cli`; `adaptive` elimina los indicadores de esfuerzo configurados y delega el esfuerzo efectivo al entorno, la configuración y los valores predeterminados del modelo de Claude Code. Consulte [backends de la CLI](/es/gateway/cli-backends).

## Modo rápido (/fast)

- Niveles: `auto|on|off|default`.
- Un mensaje que solo contenga la directiva alterna una sustitución del modo rápido de la sesión y responde con `Fast mode set to auto.`, `Fast mode enabled.` o `Fast mode disabled.`. Utilice `/fast default` para borrar la sustitución de sesión y heredar el valor predeterminado configurado; los alias incluyen `inherit`, `clear`, `reset` y `unpin`.
- Envíe `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. Sustitución `/fast auto|on|off` en línea o como única directiva (`/fast default` borra esta capa)
  2. Sustitución de sesión
  3. Valor predeterminado por agente (`agents.entries.*.fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Alternativa: `off`
- `auto` mantiene el modo de sesión/configuración como automático, pero resuelve cada nueva llamada al modelo de forma independiente. Las llamadas que comienzan antes del límite automático tienen habilitado el modo rápido; las llamadas posteriores de reintento, alternativa, resultado de herramienta o continuación comienzan con el modo rápido deshabilitado. El límite predeterminado es de 60 segundos; establezca `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` en el modelo activo para cambiarlo.
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI mediante el envío de `service_tier=priority` en solicitudes Responses compatibles.
- Para los modelos `openai/*` / `openai-codex/*` respaldados por Codex, el modo rápido envía el mismo indicador `service_tier=priority` en Codex Responses. Los turnos nativos del servidor de aplicaciones de Codex reciben el nivel solo en `turn/start` o al iniciar o reanudar el hilo, por lo que `auto` no puede cambiar el nivel de un turno del servidor de aplicaciones que ya esté en ejecución; se aplica al siguiente turno del modelo que inicia OpenClaw.
- Para solicitudes públicas directas de `anthropic/*`, incluido el tráfico autenticado mediante OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a los niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto`, y `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
- Los parámetros explícitos del modelo `serviceTier` / `service_tier` de Anthropic sustituyen el valor predeterminado del modo rápido cuando ambos están establecidos. OpenClaw sigue omitiendo la inyección del nivel de servicio de Anthropic para las URL base de proxy que no sean de Anthropic.
- `/status` muestra `Fast` cuando el modo rápido está habilitado y `Fast:auto` cuando el modo configurado es automático.

## Directivas detalladas (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje que solo contiene la directiva cambia el nivel de detalle de la sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una sugerencia sin cambiar el estado.
- `/verbose off` almacena una sobrescritura explícita de la sesión; elimínela mediante la interfaz de usuario de sesiones eligiendo `inherit`.
- Los remitentes autorizados de canales externos pueden conservar la sobrescritura del nivel de detalle de la sesión. Los clientes internos del Gateway/chat web necesitan `operator.admin` para conservarla.
- La directiva en línea solo afecta a ese mensaje; de lo contrario, se aplican los valores predeterminados de la sesión/globales.
- Envíe `/verbose` (o `/verbose:`) sin argumentos para ver el nivel de detalle actual.
- Cuando el nivel de detalle está activado, los agentes que emiten resultados estructurados de herramientas devuelven cada llamada a herramienta como un mensaje independiente que solo contiene metadatos, con el prefijo `<emoji> <tool-name>: <arg>` cuando está disponible. Estos resúmenes de herramientas se envían en cuanto se inicia cada herramienta (en burbujas separadas), no como incrementos de transmisión.
- Los resúmenes de errores de herramientas permanecen visibles en el modo normal, pero los sufijos con detalles de error sin procesar se ocultan a menos que el nivel de detalle sea `full`.
- Cuando el nivel de detalle es `full`, las salidas de las herramientas también se reenvían después de completarse (en una burbuja separada, truncadas a una longitud segura). Si cambia `/verbose on|full|off` mientras hay una ejecución en curso, las burbujas de herramientas posteriores respetan la nueva configuración.
- `agents.defaults.toolProgressDetail` controla el formato de los resúmenes de herramientas de `/verbose` y de las líneas de herramientas de los borradores de progreso. Use `"explain"` (predeterminado) para etiquetas humanas compactas como `🛠️ Exec: checking JS syntax`; use `"raw"` cuando también quiera que se añadan el comando o los detalles sin procesar para la depuración. El valor `agents.entries.*.toolProgressDetail` por agente sobrescribe el predeterminado.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Directivas de seguimiento de plugins (/trace)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje que solo contiene la directiva cambia la salida de seguimiento de plugins de la sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva en línea solo afecta a ese mensaje; de lo contrario, se aplican los valores predeterminados de la sesión/globales.
- Envíe `/trace` (o `/trace:`) sin argumentos para ver el nivel de seguimiento actual.
- `/trace` tiene un alcance más limitado que `/verbose`: solo expone líneas de seguimiento/depuración pertenecientes a plugins, como los resúmenes de depuración de Active Memory.
- Las líneas de seguimiento pueden aparecer en `/status` y como un mensaje de diagnóstico posterior a la respuesta normal del asistente.

## Visibilidad del razonamiento (/reasoning)

- Niveles: `on|off|stream`.
- Un mensaje que solo contiene la directiva cambia si los bloques de pensamiento se muestran en las respuestas.
- Cuando está activado, el razonamiento se envía como un **mensaje independiente** con el prefijo `Thinking`.
- `stream`: transmite el razonamiento mientras se genera la respuesta cuando el canal activo admite vistas previas del razonamiento y, después, envía la respuesta final sin el razonamiento.
- Alias: `/reason`.
- Envíe `/reasoning` (o `/reasoning:`) sin argumentos para ver el nivel de razonamiento actual.
- Orden de resolución: directiva en línea, después sobrescritura de la sesión, después valor predeterminado por agente (`agents.entries.*.reasoningDefault`), después valor predeterminado global (`agents.defaults.reasoningDefault`) y, por último, valor alternativo (`off`).

Las etiquetas de razonamiento mal formadas de los modelos locales se gestionan de forma conservadora. Los bloques `<think>...</think>` cerrados permanecen ocultos en las respuestas normales, al igual que el razonamiento sin cerrar que aparece después de texto ya visible. Si una respuesta está completamente envuelta en una única etiqueta de apertura sin cerrar y, de otro modo, se entregaría como texto vacío, OpenClaw elimina la etiqueta de apertura mal formada y entrega el texto restante.

## Temas relacionados

- La documentación del modo elevado se encuentra en [Modo elevado](/es/tools/elevated).

## Heartbeats

- El cuerpo de la prueba de Heartbeat es el prompt de Heartbeat configurado (valor predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas en línea de un mensaje de Heartbeat se aplican como de costumbre (pero evite cambiar los valores predeterminados de la sesión desde los Heartbeats).
- De forma predeterminada, la entrega del Heartbeat solo incluye la carga útil final. Para enviar también el mensaje independiente `Thinking` (cuando esté disponible), establezca `agents.defaults.heartbeat.includeReasoning: true` o el valor por agente `agents.entries.*.heartbeat.includeReasoning: true`.

## Interfaz de usuario del chat web

- El selector de pensamiento del chat web refleja el nivel almacenado de la sesión procedente del almacén/configuración de la sesión entrante cuando se carga la página.
- Al elegir otro nivel, se escribe inmediatamente la sobrescritura de la sesión mediante `sessions.patch`; no se espera al siguiente envío ni se trata de una sobrescritura `thinkingOnce` de un solo uso.
- Si se realiza un envío mientras todavía se están aplicando cambios en los selectores de modelo, razonamiento o velocidad, se espera a que se completen todos los parches pendientes de los selectores; si un cambio falla, el mensaje permanece sin enviar para su revisión.
- La primera opción siempre permite eliminar la sobrescritura. Muestra `Inherited: <resolved level>`, incluido `Inherited: Off` cuando el pensamiento heredado está desactivado.
- Las elecciones explícitas del selector usan directamente sus etiquetas de nivel y conservan las etiquetas del proveedor cuando están presentes (por ejemplo, `Maximum` para una opción `max` etiquetada por el proveedor).
- El selector usa `thinkingLevels`, devuelto por la fila/los valores predeterminados de la sesión del Gateway, y conserva `thinkingOptions` como lista de etiquetas heredada. La interfaz de usuario del navegador no mantiene su propia lista de expresiones regulares de proveedores; los plugins son responsables de los conjuntos de niveles específicos de cada modelo.
- `/think:<level>` sigue funcionando y actualiza el mismo nivel de sesión almacenado, por lo que las directivas del chat y el selector permanecen sincronizados.

## Perfiles de proveedores

- Los plugins de proveedores pueden exponer `resolveThinkingProfile(ctx)` para definir los niveles compatibles del modelo y el valor predeterminado.
- Los plugins de proveedores que actúan como proxy de modelos Claude deben reutilizar `resolveClaudeThinkingProfile(modelId)` de `openclaw/plugin-sdk/provider-model-shared` para que los catálogos directos de Anthropic y los catálogos proxy permanezcan alineados.
- Cada nivel de perfil tiene un `id` canónico almacenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` o `ultra`) y puede incluir un `label` para mostrar. Los proveedores binarios usan `{ id: "low", label: "on" }`.
- Los hooks de perfil reciben los datos combinados del catálogo cuando están disponibles, incluidos `reasoning`, `compat.thinkingFormat` y `compat.supportedReasoningEfforts`. Use esos datos para exponer perfiles binarios o personalizados solo cuando el contrato de solicitud configurado admita la carga útil correspondiente.
- Los plugins de herramientas que necesiten validar una sobrescritura explícita del pensamiento deben usar `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` junto con `api.runtime.agent.normalizeThinkingLevel(...)`; no deben mantener sus propias listas de niveles de proveedores/modelos. Pase `agentRuntime` cuando la herramienta sea responsable de la ruta de ejecución, como en una ejecución siempre integrada.
- Los plugins de herramientas con acceso a metadatos configurados de modelos personalizados pueden pasar `catalog` a `resolveThinkingPolicy` para que las inclusiones voluntarias de `compat.supportedReasoningEfforts` se reflejen en la validación del lado del plugin.
- Los hooks heredados publicados (`supportsXHighThinking`, `isBinaryThinking` y `resolveDefaultThinkingLevel`) se mantienen como adaptadores de compatibilidad, pero los nuevos conjuntos de niveles personalizados deben usar `resolveThinkingProfile`.
- Las filas/los valores predeterminados del Gateway exponen `thinkingLevels`, `thinkingOptions` y `thinkingDefault` para que los clientes de ACP/chat representen los mismos identificadores y etiquetas de perfil que utiliza la validación en tiempo de ejecución.
