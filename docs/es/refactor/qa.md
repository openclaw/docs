---
read_when:
    - Refactorizar definiciones de escenarios de QA o código del arnés de qa-lab
    - Mover comportamiento de QA entre escenarios Markdown y lógica del arnés TypeScript
summary: Plan de refactorización de QA para el catálogo de escenarios y la consolidación del arnés
title: Refactorización de QA
x-i18n:
    generated_at: "2026-04-23T14:07:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16867d5be372ab414aa516144193144414c326ea53a52627f3ff91f85b8fdf9d
    source_path: refactor/qa.md
    workflow: 15
---

# Refactorización de QA

Estado: migración fundacional completada.

## Objetivo

Mover el QA de OpenClaw de un modelo de definición dividido a una única fuente de verdad:

- metadatos de escenarios
- prompts enviados al modelo
- configuración y desmontaje
- lógica del arnés
- aserciones y criterios de éxito
- artefactos y sugerencias para informes

El estado final deseado es un arnés de QA genérico que cargue archivos potentes de definición de escenarios en lugar de codificar la mayor parte del comportamiento en TypeScript.

## Estado actual

La fuente principal de verdad ahora vive en `qa/scenarios/index.md` más un archivo por
escenario en `qa/scenarios/<theme>/*.md`.

Implementado:

- `qa/scenarios/index.md`
  - metadatos canónicos del paquete QA
  - identidad del operador
  - misión de arranque
- `qa/scenarios/<theme>/*.md`
  - un archivo Markdown por escenario
  - metadatos del escenario
  - bindings de manejadores
  - configuración de ejecución específica del escenario
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser del paquete Markdown + validación con zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - renderizado de planes a partir del paquete Markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - siembra de archivos de compatibilidad generados más `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - selecciona escenarios ejecutables mediante bindings de manejadores definidos en Markdown
- Protocolo de bus QA + interfaz
  - adjuntos inline genéricos para renderizado de imagen/video/audio/archivo

Superficies divididas restantes:

- `extensions/qa-lab/src/suite.ts`
  - todavía posee la mayor parte de la lógica ejecutable de manejadores personalizados
- `extensions/qa-lab/src/report.ts`
  - todavía deriva la estructura de informes a partir de salidas de tiempo de ejecución

Así que la división de la fuente de verdad está corregida, pero la ejecución sigue estando mayoritariamente respaldada por manejadores en lugar de ser totalmente declarativa.

## Cómo es realmente la superficie de escenarios

Leyendo la suite actual se ven algunas clases distintas de escenarios.

### Interacción simple

- línea base del canal
- línea base de mensajes directos
- seguimiento en hilo
- cambio de modelo
- continuación de aprobación
- reacción/edición/eliminación

### Mutación de configuración y tiempo de ejecución

- desactivación de skill con config patch
- activación tras reinicio por config apply
- cambio de capacidad por reinicio de configuración
- comprobación de deriva del inventario de tiempo de ejecución

### Aserciones sobre sistema de archivos y repositorio

- informe de descubrimiento de source/docs
- compilación de Lobster Invaders
- búsqueda de artefacto de imagen generado

### Orquestación de memoria

- recuperación de memoria
- herramientas de memoria en contexto de canal
- respaldo ante fallo de memoria
- clasificación de memoria de sesión
- aislamiento de memoria de hilo
- barrido de Dreaming de memoria

### Integración de herramientas y plugins

- llamada a herramientas de Plugin MCP
- visibilidad de skill
- instalación en caliente de skill
- generación nativa de imágenes
- ida y vuelta de imagen
- comprensión de imagen a partir de adjunto

### Multi-turno y multi-actor

- transferencia a subagente
- síntesis fanout de subagente
- flujos de estilo recuperación tras reinicio

Estas categorías importan porque impulsan los requisitos del DSL. Una lista plana de prompt + texto esperado no es suficiente.

## Dirección

### Fuente única de verdad

Usar `qa/scenarios/index.md` más `qa/scenarios/<theme>/*.md` como
fuente de verdad de autoría.

El paquete debe seguir siendo:

- legible por humanos en revisión
- parseable por máquina
- lo bastante rico como para conducir:
  - ejecución de la suite
  - arranque del espacio de trabajo QA
  - metadatos de la interfaz de QA Lab
  - prompts de documentación/descubrimiento
  - generación de informes

### Formato de autoría preferido

Usar Markdown como formato de nivel superior, con YAML estructurado dentro.

Forma recomendada:

- frontmatter YAML
  - id
  - title
  - surface
  - tags
  - referencias de documentación
  - referencias de código
  - sobrescrituras de modelo/proveedor
  - prerrequisitos
- secciones en prosa
  - objetivo
  - notas
  - sugerencias de depuración
- bloques YAML delimitados
  - setup
  - steps
  - assertions
  - cleanup

Esto da:

- mejor legibilidad en PR que un JSON gigante
- contexto más rico que YAML puro
- parseo estricto y validación con zod

JSON sin procesar es aceptable solo como formato generado intermedio.

## Forma propuesta del archivo de escenario

Ejemplo:

````md
---
id: image-generation-roundtrip
title: Ida y vuelta de generación de imagen
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objetivo

Verificar que los medios generados se vuelvan a adjuntar en el turno de seguimiento.

# Configuración

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Pasos

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Comprobación de generación de imagen: genera una imagen de un faro QA y resúmela en una frase corta.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Comprobación de generación de imagen
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Comprobación de inspección de imagen de ida y vuelta: describe el adjunto generado del faro en una frase corta.
  attachments:
    - fromArtifact: lighthouseImage
```

# Espera

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Comprobación de inspección de imagen de ida y vuelta
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Capacidades del runner que debe cubrir el DSL

Basándose en la suite actual, el runner genérico necesita más que ejecución de prompts.

### Acciones de entorno y configuración

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Acciones de turno del agente

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Acciones de configuración y tiempo de ejecución

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Acciones de archivos y artefactos

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Acciones de memoria y Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Acciones MCP

- `mcp.callTool`

### Aserciones

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Variables y referencias a artefactos

El DSL debe admitir salidas guardadas y referencias posteriores.

Ejemplos de la suite actual:

- crear un hilo y luego reutilizar `threadId`
- crear una sesión y luego reutilizar `sessionKey`
- generar una imagen y luego adjuntar el archivo en el siguiente turno
- generar una cadena de marcador de activación y luego afirmar que aparece más adelante

Capacidades necesarias:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- referencias tipadas para rutas, claves de sesión, ID de hilo, marcadores, salidas de herramientas

Sin soporte de variables, el arnés seguirá filtrando lógica de escenarios de vuelta a TypeScript.

## Qué debería seguir como vías de escape

Un runner totalmente declarativo puro no es realista en la fase 1.

Algunos escenarios son intrínsecamente pesados en orquestación:

- barrido de Dreaming de memoria
- activación tras reinicio por config apply
- cambio de capacidad por reinicio de configuración
- resolución de artefacto de imagen generado por marca temporal/ruta
- evaluación de informe de descubrimiento

Por ahora, estos deberían usar manejadores personalizados explícitos.

Regla recomendada:

- 85-90% declarativo
- pasos `customHandler` explícitos para el resto difícil
- solo manejadores personalizados con nombre y documentados
- sin código inline anónimo en el archivo del escenario

Eso mantiene limpio el motor genérico y al mismo tiempo permite avanzar.

## Cambio de arquitectura

### Actual

El Markdown de escenarios ya es la fuente de verdad para:

- ejecución de la suite
- archivos de arranque del espacio de trabajo
- catálogo de escenarios de la interfaz de QA Lab
- metadatos de informes
- prompts de descubrimiento

Compatibilidad generada:

- el espacio de trabajo sembrado sigue incluyendo `QA_KICKOFF_TASK.md`
- el espacio de trabajo sembrado sigue incluyendo `QA_SCENARIO_PLAN.md`
- el espacio de trabajo sembrado ahora también incluye `QA_SCENARIOS.md`

## Plan de refactorización

### Fase 1: loader y esquema

Hecho.

- se añadió `qa/scenarios/index.md`
- se dividieron los escenarios en `qa/scenarios/<theme>/*.md`
- se añadió un parser para contenido de paquete YAML nombrado en Markdown
- se validó con zod
- se cambiaron los consumidores para usar el paquete parseado
- se eliminaron `qa/seed-scenarios.json` y `qa/QA_KICKOFF_TASK.md` a nivel de repositorio

### Fase 2: motor genérico

- dividir `extensions/qa-lab/src/suite.ts` en:
  - loader
  - motor
  - registro de acciones
  - registro de aserciones
  - manejadores personalizados
- mantener las funciones auxiliares existentes como operaciones del motor

Entregable:

- el motor ejecuta escenarios declarativos simples

Empieza con escenarios que sean sobre todo prompt + espera + aserción:

- seguimiento en hilo
- comprensión de imagen a partir de adjunto
- visibilidad e invocación de skill
- línea base del canal

Entregable:

- primeros escenarios reales definidos en Markdown enviados a través del motor genérico

### Fase 4: migrar escenarios intermedios

- ida y vuelta de generación de imagen
- herramientas de memoria en contexto de canal
- clasificación de memoria de sesión
- transferencia a subagente
- síntesis fanout de subagente

Entregable:

- variables, artefactos, aserciones de herramientas y aserciones de request-log demostradas

### Fase 5: mantener los escenarios difíciles con manejadores personalizados

- barrido de Dreaming de memoria
- activación tras reinicio por config apply
- cambio de capacidad por reinicio de configuración
- deriva de inventario de tiempo de ejecución

Entregable:

- mismo formato de autoría, pero con bloques explícitos de pasos personalizados donde sea necesario

### Fase 6: eliminar el mapa de escenarios codificado

Una vez que la cobertura del paquete sea suficientemente buena:

- eliminar la mayor parte de la lógica condicional específica de escenarios en `extensions/qa-lab/src/suite.ts`

## Compatibilidad con Slack simulado / medios enriquecidos

El bus QA actual prioriza el texto.

Archivos relevantes:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Hoy el bus QA admite:

- texto
- reacciones
- hilos

Todavía no modela adjuntos de medios inline.

### Contrato de transporte necesario

Añadir un modelo genérico de adjuntos del bus QA:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Luego añadir `attachments?: QaBusAttachment[]` a:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Por qué primero genérico

No construyas un modelo de medios solo para Slack.

En su lugar:

- un modelo de transporte QA genérico
- varios renderizadores por encima
  - chat actual de QA Lab
  - futuro web de Slack simulado
  - cualquier otra vista de transporte simulada

Esto evita lógica duplicada y permite que los escenarios de medios sigan siendo agnósticos al transporte.

### Trabajo de interfaz necesario

Actualizar la interfaz de QA para renderizar:

- vista previa inline de imagen
- reproductor inline de audio
- reproductor inline de video
- chip de archivo adjunto

La interfaz actual ya puede renderizar hilos y reacciones, así que el renderizado de adjuntos debería montarse sobre el mismo modelo de tarjeta de mensaje.

### Trabajo de escenarios habilitado por el transporte de medios

Una vez que los adjuntos fluyan por el bus QA, podremos añadir escenarios más ricos de chat simulado:

- respuesta inline con imagen en Slack simulado
- comprensión de adjunto de audio
- comprensión de adjunto de video
- orden mixto de adjuntos
- respuesta en hilo con medios conservados

## Recomendación

El siguiente bloque de implementación debería ser:

1. añadir loader de escenarios Markdown + esquema zod
2. generar el catálogo actual a partir de Markdown
3. migrar primero algunos escenarios simples
4. añadir soporte genérico de adjuntos en el bus QA
5. renderizar imagen inline en la interfaz QA
6. luego ampliar a audio y video

Este es el camino más pequeño que demuestra ambos objetivos:

- QA genérico definido en Markdown
- superficies de mensajería simulada más ricas

## Preguntas abiertas

- si los archivos de escenario deben permitir plantillas de prompts Markdown incrustadas con interpolación de variables
- si setup/cleanup deben ser secciones con nombre o simplemente listas ordenadas de acciones
- si las referencias a artefactos deben estar fuertemente tipadas en el esquema o basarse en cadenas
- si los manejadores personalizados deben vivir en un único registro o en registros por superficie
- si el archivo de compatibilidad JSON generado debe seguir versionado durante la migración
