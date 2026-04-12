---
read_when:
    - Ajustar el thinking, el modo rápido o el análisis y los valores predeterminados de las directivas verbose
summary: Sintaxis de directivas para /think, /fast, /verbose, /trace y visibilidad de reasoning
title: Niveles de thinking
x-i18n:
    generated_at: "2026-04-12T23:33:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3b1341281f07ba4e9061e3355845dca234be04cc0d358594312beeb7676e68
    source_path: tools/thinking.md
    workflow: 15
---

# Niveles de thinking (directivas `/think`)

## Qué hace

- Directiva en línea en cualquier cuerpo entrante: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Niveles (alias): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (presupuesto máximo)
  - xhigh → “ultrathink+” (solo GPT-5.2 + modelos Codex)
  - adaptive → presupuesto de reasoning adaptativo gestionado por el proveedor (compatible con la familia de modelos Anthropic Claude 4.6)
  - `x-high`, `x_high`, `extra-high`, `extra high` y `extra_high` se asignan a `xhigh`.
  - `highest`, `max` se asignan a `high`.
- Notas sobre proveedores:
  - Los modelos Anthropic Claude 4.6 usan `adaptive` de forma predeterminada cuando no se establece un nivel explícito de thinking.
  - MiniMax (`minimax/*`) en la ruta de streaming compatible con Anthropic usa `thinking: { type: "disabled" }` de forma predeterminada a menos que establezcas thinking explícitamente en los parámetros del modelo o de la solicitud. Esto evita deltas filtradas de `reasoning_content` del formato de stream Anthropic no nativo de MiniMax.
  - Z.AI (`zai/*`) solo admite thinking binario (`on`/`off`). Cualquier nivel distinto de `off` se trata como `on` (asignado a `low`).
  - Moonshot (`moonshot/*`) asigna `/think off` a `thinking: { type: "disabled" }` y cualquier nivel distinto de `off` a `thinking: { type: "enabled" }`. Cuando thinking está habilitado, Moonshot solo acepta `tool_choice` `auto|none`; OpenClaw normaliza los valores incompatibles a `auto`.

## Orden de resolución

1. Directiva en línea en el mensaje (se aplica solo a ese mensaje).
2. Sobrescritura de sesión (establecida enviando un mensaje solo con la directiva).
3. Valor predeterminado por agente (`agents.list[].thinkingDefault` en la configuración).
4. Valor predeterminado global (`agents.defaults.thinkingDefault` en la configuración).
5. Respaldo: `adaptive` para modelos Anthropic Claude 4.6, `low` para otros modelos compatibles con reasoning, `off` en caso contrario.

## Establecer un valor predeterminado de sesión

- Envía un mensaje que sea **solo** la directiva (se permiten espacios), por ejemplo `/think:medium` o `/t high`.
- Eso se mantiene para la sesión actual (por remitente de forma predeterminada); se borra con `/think:off` o al restablecerse la sesión por inactividad.
- Se envía una respuesta de confirmación (`Thinking level set to high.` / `Thinking disabled.`). Si el nivel no es válido (por ejemplo `/thinking big`), el comando se rechaza con una pista y el estado de la sesión no cambia.
- Envía `/think` (o `/think:`) sin argumento para ver el nivel actual de thinking.

## Aplicación por agente

- **Pi integrado**: el nivel resuelto se pasa al runtime del agente Pi en proceso.

## Modo rápido (/fast)

- Niveles: `on|off`.
- Un mensaje solo con la directiva alterna una sobrescritura de modo rápido de la sesión y responde `Fast mode enabled.` / `Fast mode disabled.`.
- Envía `/fast` (o `/fast status`) sin modo para ver el estado efectivo actual del modo rápido.
- OpenClaw resuelve el modo rápido en este orden:
  1. `/fast on|off` en línea/solo directiva
  2. Sobrescritura de sesión
  3. Valor predeterminado por agente (`agents.list[].fastModeDefault`)
  4. Configuración por modelo: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Respaldo: `off`
- Para `openai/*`, el modo rápido se asigna al procesamiento prioritario de OpenAI enviando `service_tier=priority` en solicitudes Responses compatibles.
- Para `openai-codex/*`, el modo rápido envía el mismo flag `service_tier=priority` en Codex Responses. OpenClaw mantiene un único interruptor compartido `/fast` en ambas rutas de autenticación.
- Para solicitudes públicas directas `anthropic/*`, incluido el tráfico autenticado por OAuth enviado a `api.anthropic.com`, el modo rápido se asigna a los niveles de servicio de Anthropic: `/fast on` establece `service_tier=auto`, `/fast off` establece `service_tier=standard_only`.
- Para `minimax/*` en la ruta compatible con Anthropic, `/fast on` (o `params.fastMode: true`) reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.
- Los parámetros explícitos de modelo Anthropic `serviceTier` / `service_tier` sobrescriben el valor predeterminado del modo rápido cuando ambos están configurados. OpenClaw sigue omitiendo la inyección de nivel de servicio de Anthropic para URL base proxy que no sean de Anthropic.

## Directivas verbose (`/verbose` o `/v`)

- Niveles: `on` (mínimo) | `full` | `off` (predeterminado).
- Un mensaje solo con la directiva alterna verbose en la sesión y responde `Verbose logging enabled.` / `Verbose logging disabled.`; los niveles no válidos devuelven una pista sin cambiar el estado.
- `/verbose off` almacena una sobrescritura explícita de sesión; bórrala desde la UI de Sesiones eligiendo `inherit`.
- La directiva en línea afecta solo a ese mensaje; en caso contrario se aplican los valores predeterminados de sesión/globales.
- Envía `/verbose` (o `/verbose:`) sin argumento para ver el nivel actual de verbose.
- Cuando verbose está activado, los agentes que emiten resultados estructurados de herramientas (Pi, otros agentes JSON) envían cada llamada a herramienta como su propio mensaje solo de metadatos, con el prefijo `<emoji> <tool-name>: <arg>` cuando está disponible (ruta/comando). Estos resúmenes de herramientas se envían en cuanto cada herramienta empieza (burbujas separadas), no como deltas de streaming.
- Los resúmenes de fallos de herramientas siguen visibles en modo normal, pero los sufijos de detalle de error sin procesar se ocultan salvo que verbose esté en `on` o `full`.
- Cuando verbose está en `full`, las salidas de herramientas también se reenvían al completarse (burbuja separada, truncada a una longitud segura). Si cambias `/verbose on|full|off` mientras una ejecución está en curso, las burbujas de herramientas posteriores respetan la nueva configuración.

## Directivas de trace de Plugins (`/trace`)

- Niveles: `on` | `off` (predeterminado).
- Un mensaje solo con la directiva alterna la salida de trace de plugins de la sesión y responde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La directiva en línea afecta solo a ese mensaje; en caso contrario se aplican los valores predeterminados de sesión/globales.
- Envía `/trace` (o `/trace:`) sin argumento para ver el nivel actual de trace.
- `/trace` es más limitado que `/verbose`: solo expone líneas de trace/depuración propias de plugins, como resúmenes de depuración de Active Memory.
- Las líneas de trace pueden aparecer en `/status` y como mensaje de diagnóstico de seguimiento después de la respuesta normal del asistente.

## Visibilidad de reasoning (`/reasoning`)

- Niveles: `on|off|stream`.
- Un mensaje solo con la directiva alterna si los bloques de thinking se muestran en las respuestas.
- Cuando está habilitado, el reasoning se envía como un **mensaje separado** con el prefijo `Reasoning:`.
- `stream` (solo Telegram): transmite el reasoning en la burbuja de borrador de Telegram mientras se genera la respuesta y luego envía la respuesta final sin reasoning.
- Alias: `/reason`.
- Envía `/reasoning` (o `/reasoning:`) sin argumento para ver el nivel actual de reasoning.
- Orden de resolución: directiva en línea, luego sobrescritura de sesión, luego valor predeterminado por agente (`agents.list[].reasoningDefault`), luego respaldo (`off`).

## Relacionado

- La documentación del modo Elevated está en [Elevated mode](/es/tools/elevated).

## Heartbeat

- El cuerpo de la sonda Heartbeat es el prompt Heartbeat configurado (predeterminado: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Las directivas en línea en un mensaje Heartbeat se aplican con normalidad (pero evita cambiar valores predeterminados de sesión desde Heartbeat).
- La entrega de Heartbeat usa solo la carga útil final de forma predeterminada. Para enviar también el mensaje separado `Reasoning:` (cuando esté disponible), establece `agents.defaults.heartbeat.includeReasoning: true` o `agents.list[].heartbeat.includeReasoning: true` por agente.

## UI de chat web

- El selector de thinking del chat web refleja el nivel almacenado de la sesión desde el almacén/configuración de sesión entrante cuando carga la página.
- Elegir otro nivel escribe de inmediato la sobrescritura de sesión mediante `sessions.patch`; no espera al siguiente envío y no es una sobrescritura puntual `thinkingOnce`.
- La primera opción es siempre `Default (<resolved level>)`, donde el valor predeterminado resuelto proviene del modelo activo de la sesión: `adaptive` para Claude 4.6 en Anthropic/Bedrock, `low` para otros modelos compatibles con reasoning, `off` en caso contrario.
- El selector sigue siendo consciente del proveedor:
  - la mayoría de los proveedores muestran `off | minimal | low | medium | high | adaptive`
  - Z.AI muestra binario `off | on`
- `/think:<level>` sigue funcionando y actualiza el mismo nivel de sesión almacenado, de modo que las directivas de chat y el selector permanecen sincronizados.
