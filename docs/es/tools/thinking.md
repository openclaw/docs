---
read_when:
    - Ajuste del análisis o los valores predeterminados de las directivas de thinking, modo rápido o detalle
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y visibilidad del razonamiento
title: Niveles de thinking
x-i18n:
    generated_at: "2026-04-21T13:39:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b0217f6e5a5cb3400090f31ad5271ca61848a40f77d3f942851e7c2f2352886
    source_path: tools/thinking.md
    workflow: 15
---

# Niveles de thinking (directivas `/think`)

## Qué hace

- Directiva inline en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (presupuesto máximo)
  - xhigh → “ultrathink+” (esfuerzo de GPT-5.2 + modelos Codex y Anthropic Claude Opus 4.7)
  - adaptive → thinking adaptativo gestionado por el proveedor (compatible con Claude 4.6 en Anthropic/Bedrock y Anthropic Claude Opus 4.7)
  - max → razonamiento máximo del proveedor (actualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest` se asigna a `high`.
- Notas del proveedor:
  - Los menús y selectores de thinking dependen del perfil del proveedor. Los plugins de proveedor declaran el conjunto exacto de niveles para el modelo seleccionado, incluidas etiquetas como el binario `on`.
  - `adaptive`, `xhigh` y `max` solo se anuncian para perfiles de proveedor/modelo que los admiten. Las directivas escritas para niveles no compatibles se rechazan con las opciones válidas de ese modelo.
  - Los niveles no compatibles ya almacenados, incluidos los valores antiguos `max` después de cambiar de modelo, se reasignan al nivel compatible más alto para el modelo seleccionado.
  - Los modelos Anthropic Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece un nivel explícito de thinking.
  - Anthropic Claude Opus 4.7 no usa thinking adaptativo de forma predeterminada. El valor predeterminado de esfuerzo de su API sigue siendo gestionado por el proveedor salvo que establezcas explícitamente un nivel de thinking.
  - Anthropic Claude Opus 4.7 asigna `/think xhigh` a thinking adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de thinking y `xhigh` es la configuración de esfuerzo de Opus 4.7.
  - Anthropic Claude Opus 4.7 también expone `/think max`; se asigna a la misma ruta de esfuerzo máximo gestionada por el proveedor.
  - Los modelos OpenAI GPT asignan `/think` mediante la compatibilidad de esfuerzo de la API Responses específica de cada modelo. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo de destino lo admite; de lo contrario, OpenClaw omite el payload de razonamiento desactivado en lugar de enviar un valor no compatible.
  - MiniMax (`minimax/*`) en la ruta de streaming compatible con Anthropic usa por defecto `thinking: { type: "disabled" }` salvo que establezcas explícitamente thinking en los parámetros del modelo o de la solicitud. Esto evita deltas filtrados de `reasoning_content` del formato de stream Anthropic no nativo de MiniMax.
  - Z.AI (`zai/*`) solo admite thinking binario (`on`/`off`). Cualquier nivel distinto de `off` se trata como `on` (asignado a `low`).
  - Moonshot (`moonshot/*`) asigna `/think off` a `thinking: { type: "disabled" }` y cualquier nivel distinto de `off` a `thinking: { type: "enabled" }`. Cuando thinking está habilitado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva inline en el mensaje (se aplica solo a ese mensaje).
2. Anulación de sesión (se establece enviando un mensaje que solo contiene la directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Fallback: valor predeterminado declarado por el proveedor cuando está disponible, `low` para otros modelos del catálogo marcados como compatibles con razonamiento, `off` en caso contrario.

## Establecer un valor predeterminado de sesión

- Envía un mensaje que sea **solo** la directiva (se permiten espacios), por ejemplo `/think:medium` o `/t high`.
- Esto permanece para la sesión actual (por remitente de forma predeterminada); se borra con `/think:off` o con el restablecimiento por inactividad de la sesión.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo `/thinking big`), el comando se rechaza con una sugerencia y el estado de la sesión se deja sin cambios.
- Envía `/think` (o `/think:`) sin argumento para ver el nivel actual de thinking.

## Aplicación por agente

- **Embedded Pi**: el nivel resuelto se pasa al runtime del agente Pi en proceso.

## Modo rápido (/fast)

- Niveles: `on|off`.
- Un mensaje que solo contiene la directiva activa una anulación de modo rápido de sesión y responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envía `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. `/fast on|off` inline/solo-directiva
  2. Anulación de sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI enviando `service_tier=priority` en las solicitudes Responses compatibles.
- Para `openai-codex/*`, el modo rápido envía la misma marca `service_tier=priority` en Codex Responses. OpenClaw mantiene un único interruptor compartido `/fast` en ambas rutas de autenticación.
- Para solicitudes públicas directas `anthropic/*`, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a los niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto`, `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` a `MiniMax-M2.7-highspeed`.
- Los parámetros explícitos de modelo Anthropic `serviceTier` / `service_tier` anulan el valor predeterminado del modo rápido cuando ambos están configurados. OpenClaw sigue omitiendo la inyección de nivel de servicio de Anthropic para URL base proxy no Anthropic.

## Directivas de detalle (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje que solo contiene la directiva activa el detalle de la sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una sugerencia sin cambiar el estado.
- `/verbose off` almacena una anulación explícita de sesión; bórrala mediante la UI de Sessions eligiendo `inherit`.
- La directiva inline afecta solo a ese mensaje; en otros casos se aplican los valores predeterminados de sesión/globales.
- Envía `/verbose` (o `/verbose:`) sin argumento para ver el nivel actual de detalle.
- Cuando el detalle está activado, los agentes que emiten resultados estructurados de herramientas (Pi, otros agentes JSON) envían cada llamada de herramienta de vuelta como su propio mensaje solo de metadatos, con el prefijo `<emoji> <tool-name>: <arg>` cuando esté disponible (ruta/comando). Estos resúmenes de herramientas se envían en cuanto se inicia cada herramienta (burbujas separadas), no como deltas de streaming.
- Los resúmenes de fallos de herramientas siguen siendo visibles en modo normal, pero los sufijos de detalle de error sin procesar se ocultan salvo que verbose esté en `on` o `full`.
- Cuando verbose es `full`, las salidas de herramientas también se reenvían al finalizar (burbuja separada, truncada a una longitud segura). Si cambias `/verbose on|full|off` mientras una ejecución está en curso, las burbujas de herramientas posteriores respetan la nueva configuración.

## Directivas de rastreo de plugins (/trace)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje que solo contiene la directiva activa la salida de rastreo de plugins de la sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva inline afecta solo a ese mensaje; en otros casos se aplican los valores predeterminados de sesión/globales.
- Envía `/trace` (o `/trace:`) sin argumento para ver el nivel actual de rastreo.
- `/trace` es más limitado que `/verbose`: solo expone líneas de rastreo/depuración controladas por plugins, como resúmenes de depuración de Active Memory.
- Las líneas de rastreo pueden aparecer en `/status` y como mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.

## Visibilidad del razonamiento (/reasoning)

- Niveles: `on|off|stream`.
- Un mensaje que solo contiene la directiva activa si los bloques de thinking se muestran en las respuestas.
- Cuando está habilitado, el razonamiento se envía como un **mensaje separado** con el prefijo `Reasoning:`.
- `stream` (solo Telegram): transmite el razonamiento en la burbuja de borrador de Telegram mientras se genera la respuesta y luego envía la respuesta final sin razonamiento.
- Alias: `/reason`.
- Envía `/reasoning` (o `/reasoning:`) sin argumento para ver el nivel actual de razonamiento.
- Orden de resolución: directiva inline, luego anulación de sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`) y luego fallback (`off`).

## Relacionado

- La documentación del modo elevado se encuentra en [Elevated mode](/es/tools/elevated).

## Heartbeats

- El cuerpo de la sonda de Heartbeat es el prompt de heartbeat configurado (predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas inline en un mensaje heartbeat se aplican como de costumbre (pero evita cambiar los valores predeterminados de sesión desde heartbeats).
- La entrega de Heartbeat usa por defecto solo el payload final. Para enviar también el mensaje separado `Reasoning:` (cuando esté disponible), establece `agents.defaults.heartbeat.includeReasoning: true` o `agents.list[].heartbeat.includeReasoning: true` por agente.

## UI de chat web

- El selector de thinking del chat web refleja el nivel almacenado de la sesión desde el almacén/configuración de sesión entrante cuando se carga la página.
- Elegir otro nivel escribe inmediatamente la anulación de sesión mediante `sessions.patch`; no espera al siguiente envío y no es una anulación puntual `thinkingOnce`.
- La primera opción es siempre `Default (<resolved level>)`, donde el valor predeterminado resuelto proviene del perfil de thinking del proveedor del modelo activo de la sesión.
- El selector usa `thinkingOptions` devuelto por la fila de sesión del gateway. La UI del navegador no mantiene su propia lista regex de proveedores; los plugins se encargan de los conjuntos de niveles específicos de cada modelo.
- `/think:<level>` sigue funcionando y actualiza el mismo nivel almacenado de sesión, por lo que las directivas de chat y el selector permanecen sincronizados.

## Perfiles de proveedor

- Los plugins de proveedor pueden exponer `resolveThinkingProfile(ctx)` para definir los niveles compatibles y el valor predeterminado del modelo.
- Cada nivel de perfil tiene un `id` canónico almacenado (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) y puede incluir una `label` para mostrar. Los proveedores binarios usan `{ id: "low", label: "on" }`.
- Los hooks heredados publicados (`supportsXHighThinking`, `isBinaryThinking` y `resolveDefaultThinkingLevel`) siguen existiendo como adaptadores de compatibilidad, pero los nuevos conjuntos de niveles personalizados deben usar `resolveThinkingProfile`.
- Las filas del Gateway exponen `thinkingOptions` y `thinkingDefault` para que los clientes ACP/chat muestren el mismo perfil que usa la validación del runtime.
