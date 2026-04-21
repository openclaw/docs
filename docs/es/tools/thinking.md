---
read_when:
    - Ajustar el análisis o los valores predeterminados de las directivas de thinking, modo rápido o verbose
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y visibilidad del razonamiento
title: Niveles de thinking
x-i18n:
    generated_at: "2026-04-21T05:19:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: c41d7bd19bf1dc25ba9e6bc2d706a2963e8466eeaa1c62fd01ac782ad1fc99f0
    source_path: tools/thinking.md
    workflow: 15
---

# Niveles de thinking (/think directivas)

## Qué hace

- Directiva inline en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (presupuesto máximo)
  - xhigh → “ultrathink+” (GPT-5.2 + modelos Codex y esfuerzo de Anthropic Claude Opus 4.7)
  - adaptive → thinking adaptativo gestionado por el proveedor (compatible con Anthropic Claude 4.6 y Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest`, `max` se asignan a `high`.
- Notas del proveedor:
  - Los modelos Anthropic Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece un nivel de thinking explícito.
  - Anthropic Claude Opus 4.7 no usa thinking adaptativo de forma predeterminada. Su esfuerzo predeterminado de API sigue siendo gestionado por el proveedor a menos que establezcas explícitamente un nivel de thinking.
  - Anthropic Claude Opus 4.7 asigna `/think xhigh` a thinking adaptativo más `output_config.effort: "xhigh"`, porque `/think` es una directiva de thinking y `xhigh` es la configuración de esfuerzo de Opus 4.7.
  - Los modelos OpenAI GPT asignan `/think` mediante soporte específico por modelo de esfuerzo de la API Responses. `/think off` envía `reasoning.effort: "none"` solo cuando el modelo de destino lo admite; de lo contrario OpenClaw omite el payload de razonamiento desactivado en lugar de enviar un valor no compatible.
  - MiniMax (`minimax/*`) en la ruta de streaming compatible con Anthropic usa por defecto `thinking: { type: "disabled" }` a menos que establezcas explícitamente thinking en los parámetros del modelo o de la solicitud. Esto evita deltas filtrados de `reasoning_content` del formato de stream Anthropic no nativo de MiniMax.
  - Z.AI (`zai/*`) solo admite thinking binario (`on`/`off`). Cualquier nivel distinto de `off` se trata como `on` (asignado a `low`).
  - Moonshot (`moonshot/*`) asigna `/think off` a `thinking: { type: "disabled" }` y cualquier nivel distinto de `off` a `thinking: { type: "enabled" }`. Cuando thinking está habilitado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva inline en el mensaje (se aplica solo a ese mensaje).
2. Anulación de sesión (establecida enviando un mensaje solo con directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Fallback: `adaptive` para modelos Anthropic Claude 4.6, `off` para Anthropic Claude Opus 4.7 salvo que se configure explícitamente, `low` para otros modelos con capacidad de razonamiento, `off` en caso contrario.

## Establecer un valor predeterminado de sesión

- Envía un mensaje que sea **solo** la directiva (se permiten espacios), por ejemplo `/think:medium` o `/t high`.
- Eso queda fijado para la sesión actual (por remitente de forma predeterminada); se borra con `/think:off` o con el restablecimiento por inactividad de la sesión.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo `/thinking big`), el comando se rechaza con una sugerencia y el estado de la sesión no cambia.
- Envía `/think` (o `/think:`) sin argumento para ver el nivel de thinking actual.

## Aplicación por agente

- **Pi integrado**: el nivel resuelto se pasa al runtime del agente Pi en proceso.

## Modo rápido (/fast)

- Niveles: `on|off`.
- Un mensaje solo con directiva activa una anulación de sesión del modo rápido y responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envía `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. `/fast on|off` inline/solo directiva
  2. Anulación de sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI enviando `service_tier=priority` en solicitudes Responses compatibles.
- Para `openai-codex/*`, el modo rápido envía la misma marca `service_tier=priority` en Codex Responses. OpenClaw mantiene un único interruptor compartido `/fast` en ambas rutas de autenticación.
- Para solicitudes públicas directas `anthropic/*`, incluido el tráfico autenticado con OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a los niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto`, `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` a `MiniMax-M2.7-highspeed`.
- Los parámetros explícitos de modelo de Anthropic `serviceTier` / `service_tier` reemplazan el valor predeterminado del modo rápido cuando ambos están establecidos. OpenClaw sigue omitiendo la inyección de service tier de Anthropic para URLs base de proxy que no sean Anthropic.

## Directivas verbose (/verbose o /v)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje solo con directiva activa verbose de sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una sugerencia sin cambiar el estado.
- `/verbose off` almacena una anulación de sesión explícita; bórrala mediante la interfaz de usuario de Sessions eligiendo `inherit`.
- La directiva inline afecta solo a ese mensaje; en caso contrario se aplican los valores predeterminados de sesión/globales.
- Envía `/verbose` (o `/verbose:`) sin argumento para ver el nivel verbose actual.
- Cuando verbose está activado, los agentes que emiten resultados estructurados de herramientas (Pi, otros agentes JSON) devuelven cada llamada a herramienta como su propio mensaje solo de metadatos, con prefijo `<emoji> <tool-name>: <arg>` cuando está disponible (ruta/comando). Estos resúmenes de herramientas se envían tan pronto como se inicia cada herramienta (burbujas separadas), no como deltas de streaming.
- Los resúmenes de fallo de herramientas siguen visibles en modo normal, pero los sufijos con detalles de error raw se ocultan a menos que verbose sea `on` o `full`.
- Cuando verbose es `full`, las salidas de herramientas también se reenvían después de completarse (burbuja separada, truncada a una longitud segura). Si cambias `/verbose on|full|off` mientras una ejecución está en curso, las burbujas posteriores de herramientas respetan la nueva configuración.

## Directivas de trazas de Plugin (/trace)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje solo con directiva activa la salida de trazas de Plugin de la sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva inline afecta solo a ese mensaje; en caso contrario se aplican los valores predeterminados de sesión/globales.
- Envía `/trace` (o `/trace:`) sin argumento para ver el nivel de traza actual.
- `/trace` es más específico que `/verbose`: solo expone líneas de traza/depuración gestionadas por el Plugin, como resúmenes de depuración de Active Memory.
- Las líneas de traza pueden aparecer en `/status` y como mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.

## Visibilidad del razonamiento (/reasoning)

- Niveles: `on|off|stream`.
- Un mensaje solo con directiva activa si los bloques de thinking se muestran en las respuestas.
- Cuando está habilitado, el razonamiento se envía como un **mensaje separado** con el prefijo `Reasoning:`.
- `stream` (solo Telegram): transmite el razonamiento en la burbuja de borrador de Telegram mientras se genera la respuesta y luego envía la respuesta final sin razonamiento.
- Alias: `/reason`.
- Envía `/reasoning` (o `/reasoning:`) sin argumento para ver el nivel actual de razonamiento.
- Orden de resolución: directiva inline, luego anulación de sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`), luego fallback (`off`).

## Relacionado

- La documentación del modo elevado está en [Elevated mode](/es/tools/elevated).

## Heartbeats

- El cuerpo del sondeo Heartbeat es el prompt configurado de Heartbeat (predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas inline en un mensaje Heartbeat se aplican como de costumbre (pero evita cambiar los valores predeterminados de sesión desde Heartbeats).
- La entrega de Heartbeat usa por defecto solo el payload final. Para enviar también el mensaje separado `Reasoning:` (cuando esté disponible), establece `agents.defaults.heartbeat.includeReasoning: true` o por agente `agents.list[].heartbeat.includeReasoning: true`.

## Interfaz de chat web

- El selector de thinking del chat web refleja el nivel almacenado de la sesión desde el almacén/configuración de sesión entrante cuando se carga la página.
- Elegir otro nivel escribe la anulación de sesión inmediatamente mediante `sessions.patch`; no espera al siguiente envío y no es una anulación de un solo uso `thinkingOnce`.
- La primera opción siempre es `Default (<resolved level>)`, donde el valor predeterminado resuelto proviene del modelo activo de la sesión: `adaptive` para Claude 4.6 en Anthropic, `off` para Anthropic Claude Opus 4.7 salvo que se configure, `low` para otros modelos con capacidad de razonamiento, `off` en caso contrario.
- El selector sigue siendo consciente del proveedor:
  - la mayoría de los proveedores muestran `off | minimal | low | medium | high | adaptive`
  - Anthropic Claude Opus 4.7 muestra `off | minimal | low | medium | high | xhigh | adaptive`
  - Z.AI muestra binario `off | on`
- `/think:<level>` sigue funcionando y actualiza el mismo nivel de sesión almacenado, de modo que las directivas del chat y el selector permanecen sincronizados.
