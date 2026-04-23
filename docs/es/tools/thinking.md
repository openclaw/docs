---
read_when:
    - Ajustar el análisis o los valores predeterminados de razonamiento, modo rápido o verbose
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y visibilidad del razonamiento
title: Niveles de razonamiento
x-i18n:
    generated_at: "2026-04-23T14:09:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4efe899f7b47244745a105583b3239effa7975fadd06bd7bcad6327afcc91207
    source_path: tools/thinking.md
    workflow: 15
---

# Niveles de razonamiento (directivas `/think`)

## Qué hace

- Directiva en línea en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (presupuesto máximo)
  - xhigh → “ultrathink+” (esfuerzo de GPT-5.2 + modelos Codex y Anthropic Claude Opus 4.7)
  - adaptive → razonamiento adaptativo gestionado por el proveedor (compatible con Claude 4.6 en Anthropic/Bedrock y Anthropic Claude Opus 4.7)
  - max → razonamiento máximo del proveedor (actualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest` se asigna a `high`.
- Notas de proveedor:
  - Los menús y selectores de razonamiento dependen del perfil del proveedor. Los plugins de proveedor declaran el conjunto exacto de niveles para el modelo seleccionado, incluidas etiquetas como `on` binario.
  - `adaptive`, `xhigh` y `max` solo se anuncian para perfiles proveedor/modelo que los admiten. Las directivas escritas para niveles no admitidos se rechazan con las opciones válidas de ese modelo.
  - Los niveles no admitidos ya almacenados se reasignan por rango del perfil del proveedor. `adaptive` recurre a `medium` en modelos no adaptativos, mientras que `xhigh` y `max` recurren al mayor nivel compatible distinto de off para el modelo seleccionado.
  - Los modelos Anthropic Claude 4.6 usan `adaptive` por defecto cuando no se establece explícitamente un nivel de razonamiento.
  - Anthropic Claude Opus 4.7 no usa por defecto razonamiento adaptativo. Su esfuerzo de API predeterminado sigue siendo propiedad del proveedor salvo que establezcas explícitamente un nivel de razonamiento.
  - Anthropic Claude Opus 4.7 asigna `/think xhigh` a razonamiento adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de razonamiento y `xhigh` es el ajuste de esfuerzo de Opus 4.7.
  - Anthropic Claude Opus 4.7 también expone `/think max`; se asigna a la misma ruta de esfuerzo máximo propiedad del proveedor.
  - Los modelos OpenAI GPT asignan `/think` mediante el soporte específico del modelo para esfuerzo en la Responses API. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo de destino lo admite; en caso contrario, OpenClaw omite la carga útil de razonamiento deshabilitado en lugar de enviar un valor no admitido.
  - MiniMax (`minimax/*`) en la ruta de streaming compatible con Anthropic usa por defecto `thinking: { type: "disabled" }` salvo que establezcas explícitamente razonamiento en params del modelo o params de la solicitud. Esto evita filtraciones de deltas `reasoning_content` del formato de stream Anthropic no nativo de MiniMax.
  - Z.AI (`zai/*`) solo admite razonamiento binario (`on`/`off`). Cualquier nivel distinto de `off` se trata como `on` (asignado a `low`).
  - Moonshot (`moonshot/*`) asigna `/think off` a `thinking: { type: "disabled" }` y cualquier nivel distinto de `off` a `thinking: { type: "enabled" }`. Cuando el razonamiento está habilitado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva en línea en el mensaje (se aplica solo a ese mensaje).
2. Anulación de sesión (establecida enviando un mensaje que solo contenga una directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Respaldo: valor predeterminado declarado por el proveedor cuando esté disponible; en caso contrario, los modelos con capacidad de razonamiento se resuelven a `medium` o al nivel compatible más cercano distinto de `off` para ese modelo, y los modelos sin razonamiento permanecen en `off`.

## Establecer un valor predeterminado de sesión

- Envía un mensaje que sea **solo** la directiva (se permiten espacios en blanco), p. ej. `/think:medium` o `/t high`.
- Esto queda fijado para la sesión actual (por remitente de forma predeterminada); se borra con `/think:off` o con el reinicio por inactividad de sesión.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel es inválido (p. ej. `/thinking big`), el comando se rechaza con una pista y el estado de la sesión queda sin cambios.
- Envía `/think` (o `/think:`) sin argumento para ver el nivel actual de razonamiento.

## Aplicación por agente

- **Pi integrado**: el nivel resuelto se pasa al runtime del agente Pi dentro del proceso.

## Modo rápido (/fast)

- Niveles: `on|off`.
- Un mensaje solo con directiva alterna una anulación de modo rápido de sesión y responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envía `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. `/fast on|off` en línea/solo directiva
  2. Anulación de sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Respaldo: `off`
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI enviando `service_tier=priority` en solicitudes Responses compatibles.
- Para `openai-codex/*`, el modo rápido envía la misma bandera `service_tier=priority` en Codex Responses. OpenClaw mantiene un único interruptor compartido `/fast` en ambas rutas de autenticación.
- Para solicitudes directas públicas `anthropic/*`, incluido tráfico autenticado por OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto`, `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` a `MiniMax-M2.7-highspeed`.
- Los params de modelo explícitos Anthropic `serviceTier` / `service_tier` anulan el valor predeterminado del modo rápido cuando ambos están establecidos. OpenClaw sigue omitiendo la inyección de nivel de servicio de Anthropic para base URLs proxy no Anthropic.
- `/status` muestra `Fast` solo cuando el modo rápido está habilitado.

## Directivas verbose (`/verbose` o `/v`)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje solo con directiva alterna verbose de sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles inválidos devuelven una pista sin cambiar el estado.
- `/verbose off` guarda una anulación explícita de sesión; bórrala mediante la UI de Sesiones eligiendo `inherit`.
- La directiva en línea afecta solo a ese mensaje; en otros casos se aplican los valores predeterminados de sesión/globales.
- Envía `/verbose` (o `/verbose:`) sin argumento para ver el nivel verbose actual.
- Cuando verbose está activado, los agentes que emiten resultados de herramienta estructurados (Pi, otros agentes JSON) envían de vuelta cada llamada a herramienta como su propio mensaje solo de metadatos, con prefijo `<emoji> <tool-name>: <arg>` cuando está disponible (ruta/comando). Estos resúmenes de herramientas se envían en cuanto empieza cada herramienta (burbujas separadas), no como deltas de streaming.
- Los resúmenes de fallo de herramienta siguen siendo visibles en modo normal, pero los sufijos de detalle de error sin procesar se ocultan salvo que verbose esté en `on` o `full`.
- Cuando verbose es `full`, las salidas de herramientas también se reenvían tras completarse (burbuja separada, truncada a una longitud segura). Si alternas `/verbose on|full|off` mientras una ejecución está en curso, las burbujas posteriores de herramientas respetarán el nuevo ajuste.

## Directivas de trace de Plugin (`/trace`)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje solo con directiva alterna la salida de trace de Plugin de sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva en línea afecta solo a ese mensaje; en otros casos se aplican los valores predeterminados de sesión/globales.
- Envía `/trace` (o `/trace:`) sin argumento para ver el nivel actual de trace.
- `/trace` es más estrecho que `/verbose`: solo expone líneas de trace/depuración propiedad de plugins, como resúmenes de depuración de Active Memory.
- Las líneas de trace pueden aparecer en `/status` y como mensaje de diagnóstico de seguimiento tras la respuesta normal del asistente.

## Visibilidad del razonamiento (`/reasoning`)

- Niveles: `on|off|stream`.
- Un mensaje solo con directiva alterna si los bloques de razonamiento se muestran en las respuestas.
- Cuando está habilitado, el razonamiento se envía como un **mensaje separado** con el prefijo `Reasoning:`.
- `stream` (solo Telegram): transmite el razonamiento en la burbuja borrador de Telegram mientras se genera la respuesta y luego envía la respuesta final sin razonamiento.
- Alias: `/reason`.
- Envía `/reasoning` (o `/reasoning:`) sin argumento para ver el nivel actual de razonamiento.
- Orden de resolución: directiva en línea, luego anulación de sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`) y luego respaldo (`off`).

## Relacionado

- La documentación del modo elevado está en [Elevated mode](/es/tools/elevated).

## Heartbeats

- El cuerpo de la sonda Heartbeat es el prompt Heartbeat configurado (predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas en línea en un mensaje Heartbeat se aplican con normalidad (pero evita cambiar valores predeterminados de sesión desde Heartbeats).
- La entrega de Heartbeat usa por defecto solo la carga útil final. Para enviar también el mensaje separado `Reasoning:` (cuando esté disponible), establece `agents.defaults.heartbeat.includeReasoning: true` o por agente `agents.list[].heartbeat.includeReasoning: true`.

## UI de chat web

- El selector de razonamiento del chat web refleja el nivel almacenado de la sesión desde el almacén/configuración de sesión entrante cuando se carga la página.
- Elegir otro nivel escribe inmediatamente la anulación de sesión mediante `sessions.patch`; no espera al siguiente envío y no es una anulación puntual `thinkingOnce`.
- La primera opción siempre es `Default (<resolved level>)`, donde el valor predeterminado resuelto viene del perfil de razonamiento del proveedor del modelo activo de la sesión más la misma lógica de respaldo que usan `/status` y `session_status`.
- El selector usa `thinkingOptions` devuelto por la fila de sesión del gateway. La UI del navegador no mantiene su propia lista regex de proveedores; los plugins son propietarios de los conjuntos de niveles específicos de cada modelo.
- `/think:<level>` sigue funcionando y actualiza el mismo nivel de sesión almacenado, de modo que las directivas del chat y el selector se mantienen sincronizados.

## Perfiles de proveedor

- Los plugins de proveedor pueden exponer `resolveThinkingProfile(ctx)` para definir los niveles compatibles y el valor predeterminado del modelo.
- Cada nivel del perfil tiene un `id` canónico almacenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) y puede incluir una `label` para mostrar. Los proveedores binarios usan `{ id: "low", label: "on" }`.
- Los hooks heredados publicados (`supportsXHighThinking`, `isBinaryThinking` y `resolveDefaultThinkingLevel`) siguen siendo adaptadores de compatibilidad, pero los nuevos conjuntos de niveles personalizados deberían usar `resolveThinkingProfile`.
- Las filas del Gateway exponen `thinkingOptions` y `thinkingDefault` para que los clientes ACP/chat muestren el mismo perfil que usa la validación en runtime.
