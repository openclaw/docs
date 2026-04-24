---
read_when:
    - Ajustar el análisis o los valores predeterminados de thinking, fast-mode o verbose directives
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y visibilidad del reasoning
title: Niveles de thinking
x-i18n:
    generated_at: "2026-04-24T05:56:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc251ffa601646bf8672200b416661ae91fb21ff84525eedf6d6c538ff0e36cf
    source_path: tools/thinking.md
    workflow: 15
---

## Qué hace

- Directiva inline en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (presupuesto máximo)
  - xhigh → “ultrathink+” (modelos GPT-5.2+ y Codex, además del esfuerzo de Anthropic Claude Opus 4.7)
  - adaptive → thinking adaptativo gestionado por el proveedor (compatible con Claude 4.6 en Anthropic/Bedrock y Anthropic Claude Opus 4.7)
  - max → reasoning máximo del proveedor (actualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest` se asigna a `high`.
- Notas por proveedor:
  - Los menús y selectores de thinking dependen del perfil del proveedor. Los Plugins de proveedor declaran el conjunto exacto de niveles para el modelo seleccionado, incluidas etiquetas como el binario `on`.
  - `adaptive`, `xhigh` y `max` solo se anuncian para perfiles de proveedor/modelo que los admiten. Las directivas escritas para niveles no compatibles se rechazan con las opciones válidas de ese modelo.
  - Los niveles no compatibles ya almacenados se reasignan por rango de perfil de proveedor. `adaptive` recurre a `medium` en modelos no adaptativos, mientras que `xhigh` y `max` recurren al mayor nivel compatible distinto de off para el modelo seleccionado.
  - Los modelos Anthropic Claude 4.6 usan `adaptive` por defecto cuando no se configura ningún nivel explícito de thinking.
  - Anthropic Claude Opus 4.7 no usa thinking adaptativo por defecto. El valor predeterminado de esfuerzo de su API sigue siendo propiedad del proveedor salvo que configures explícitamente un nivel de thinking.
  - Anthropic Claude Opus 4.7 asigna `/think xhigh` a thinking adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de thinking y `xhigh` es el ajuste de esfuerzo de Opus 4.7.
  - Anthropic Claude Opus 4.7 también expone `/think max`; se asigna a la misma ruta de esfuerzo máximo propiedad del proveedor.
  - Los modelos GPT de OpenAI asignan `/think` mediante compatibilidad específica del modelo con el esfuerzo de la Responses API. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo de destino lo admite; en caso contrario, OpenClaw omite la carga útil de reasoning deshabilitado en lugar de enviar un valor no compatible.
  - MiniMax (`minimax/*`) en la ruta de streaming compatible con Anthropic usa por defecto `thinking: { type: "disabled" }` salvo que configures explícitamente thinking en los params del modelo o de la solicitud. Esto evita deltas filtrados de `reasoning_content` del formato de stream Anthropic no nativo de MiniMax.
  - Z.AI (`zai/*`) solo admite thinking binario (`on`/`off`). Cualquier nivel distinto de `off` se trata como `on` (asignado a `low`).
  - Moonshot (`moonshot/*`) asigna `/think off` a `thinking: { type: "disabled" }` y cualquier nivel distinto de `off` a `thinking: { type: "enabled" }`. Cuando el thinking está habilitado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza valores incompatibles a `auto`.

## Orden de resolución

1. Directiva inline en el mensaje (se aplica solo a ese mensaje).
2. Sobrescritura de sesión (configurada enviando un mensaje que solo contiene la directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Respaldo: valor predeterminado declarado por el proveedor cuando está disponible; en caso contrario, los modelos con capacidad de reasoning se resuelven a `medium` o al nivel compatible más cercano distinto de `off` para ese modelo, y los modelos sin reasoning permanecen en `off`.

## Configurar un valor predeterminado de sesión

- Envía un mensaje que sea **solo** la directiva (se permiten espacios), por ejemplo `/think:medium` o `/t high`.
- Eso queda fijado para la sesión actual (por remitente de forma predeterminada); se borra con `/think:off` o con el restablecimiento por inactividad de la sesión.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo `/thinking big`), el comando se rechaza con una indicación y el estado de la sesión permanece sin cambios.
- Envía `/think` (o `/think:`) sin argumento para ver el nivel actual de thinking.

## Aplicación por agente

- **Pi embebido**: el nivel resuelto se pasa al runtime en proceso del agente Pi.

## Modo rápido (/fast)

- Niveles: `on|off`.
- Un mensaje que solo contenga la directiva activa una sobrescritura de sesión de modo rápido y responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envía `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. `/fast on|off` inline o en mensaje solo de directiva
  2. Sobrescritura de sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Respaldo: `off`
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI enviando `service_tier=priority` en solicitudes Responses compatibles.
- Para `openai-codex/*`, el modo rápido envía la misma flag `service_tier=priority` en Codex Responses. OpenClaw mantiene un único interruptor compartido `/fast` en ambas rutas de autenticación.
- Para solicitudes públicas directas `anthropic/*`, incluido el tráfico autenticado por OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a niveles de servicio de Anthropic: `/fast on` configura `service_tier=auto`, `/fast off` configura `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` a `MiniMax-M2.7-highspeed`.
- Los params explícitos de modelo Anthropic `serviceTier` / `service_tier` sobrescriben el valor predeterminado del modo rápido cuando ambos están configurados. OpenClaw sigue omitiendo la inyección de nivel de servicio de Anthropic para URL base proxy que no son Anthropic.
- `/status` muestra `Fast` solo cuando el modo rápido está habilitado.

## Directivas verbose (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje solo de directiva activa verbose de sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una indicación sin cambiar el estado.
- `/verbose off` almacena una sobrescritura explícita de sesión; bórrala mediante la UI de Sessions eligiendo `inherit`.
- La directiva inline afecta solo a ese mensaje; los valores predeterminados de sesión/globales se aplican en caso contrario.
- Envía `/verbose` (o `/verbose:`) sin argumento para ver el nivel actual de verbose.
- Cuando verbose está activado, los agentes que emiten resultados estructurados de herramientas (Pi, otros agentes JSON) envían cada llamada de herramienta como su propio mensaje solo de metadatos, con prefijo `<emoji> <tool-name>: <arg>` cuando está disponible (ruta/comando). Estos resúmenes de herramientas se envían en cuanto empieza cada herramienta (burbujas separadas), no como deltas de streaming.
- Los resúmenes de fallo de herramientas siguen visibles en modo normal, pero los sufijos detallados de error se ocultan salvo que verbose esté en `on` o `full`.
- Cuando verbose es `full`, las salidas de herramientas también se reenvían tras completarse (burbuja separada, truncada a una longitud segura). Si cambias `/verbose on|full|off` mientras una ejecución está en curso, las burbujas posteriores de herramientas respetan el nuevo ajuste.

## Directivas de traza de Plugin (/trace)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje solo de directiva activa la salida de traza de Plugins de la sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva inline afecta solo a ese mensaje; los valores predeterminados de sesión/globales se aplican en caso contrario.
- Envía `/trace` (o `/trace:`) sin argumento para ver el nivel actual de traza.
- `/trace` es más limitado que `/verbose`: solo expone líneas de traza/depuración propiedad de Plugins, como resúmenes de depuración de Active Memory.
- Las líneas de traza pueden aparecer en `/status` y como mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.

## Visibilidad de reasoning (/reasoning)

- Niveles: `on|off|stream`.
- Un mensaje solo de directiva activa o desactiva si se muestran bloques de thinking en las respuestas.
- Cuando está habilitado, el reasoning se envía como un **mensaje separado** con prefijo `Reasoning:`.
- `stream` (solo Telegram): transmite reasoning en la burbuja borrador de Telegram mientras se genera la respuesta, y luego envía la respuesta final sin reasoning.
- Alias: `/reason`.
- Envía `/reasoning` (o `/reasoning:`) sin argumento para ver el nivel actual de reasoning.
- Orden de resolución: directiva inline, luego sobrescritura de sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`) y luego respaldo (`off`).

## Relacionado

- La documentación del modo elevado está en [Modo elevado](/es/tools/elevated).

## Heartbeats

- El cuerpo de sonda de Heartbeat es el prompt de Heartbeat configurado (predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas inline en un mensaje de Heartbeat se aplican como de costumbre (pero evita cambiar los valores predeterminados de sesión desde Heartbeats).
- La entrega de Heartbeat usa por defecto solo la carga útil final. Para enviar también el mensaje separado `Reasoning:` (cuando esté disponible), configura `agents.defaults.heartbeat.includeReasoning: true` o por agente `agents.list[].heartbeat.includeReasoning: true`.

## Web chat UI

- El selector de thinking del chat web refleja el nivel almacenado de la sesión desde el almacén o configuración de sesión entrante cuando se carga la página.
- Elegir otro nivel escribe inmediatamente la sobrescritura de sesión mediante `sessions.patch`; no espera al siguiente envío y no es una sobrescritura de una sola vez `thinkingOnce`.
- La primera opción siempre es `Default (<resolved level>)`, donde el valor predeterminado resuelto viene del perfil de thinking del proveedor del modelo activo de la sesión más la misma lógica de respaldo que usan `/status` y `session_status`.
- El selector usa `thinkingOptions` devuelto por la fila de sesión del gateway. La UI del navegador no mantiene su propia lista regex de proveedores; los Plugins son propietarios de los conjuntos de niveles específicos de cada modelo.
- `/think:<level>` sigue funcionando y actualiza el mismo nivel almacenado de la sesión, por lo que las directivas de chat y el selector permanecen sincronizados.

## Perfiles de proveedor

- Los Plugins de proveedor pueden exponer `resolveThinkingProfile(ctx)` para definir los niveles compatibles y el valor predeterminado del modelo.
- Cada nivel del perfil tiene un `id` canónico almacenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) y puede incluir una `label` de presentación. Los proveedores binarios usan `{ id: "low", label: "on" }`.
- Los hooks heredados publicados (`supportsXHighThinking`, `isBinaryThinking` y `resolveDefaultThinkingLevel`) permanecen como adaptadores de compatibilidad, pero los nuevos conjuntos de niveles personalizados deberían usar `resolveThinkingProfile`.
- Las filas del gateway exponen `thinkingOptions` y `thinkingDefault` para que los clientes ACP/chat rendericen el mismo perfil que usa la validación del runtime.
