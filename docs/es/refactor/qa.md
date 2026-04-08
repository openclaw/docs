---
x-i18n:
    generated_at: "2026-04-08T05:03:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a9066b2a939c5a9ba69141d75405f0e8097997b523164340e2f0e9a0d5060dd
    source_path: refactor/qa.md
    workflow: 15
---

# Refactorización de QA

Estado: migración fundacional completada.

## Objetivo

Mover QA de OpenClaw de un modelo de definición dividida a una única fuente de verdad:

- metadatos de escenarios
- prompts enviados al modelo
- configuración y limpieza
- lógica del harness
- aserciones y criterios de éxito
- artefactos e indicaciones para informes

El estado final deseado es un harness de QA genérico que cargue archivos potentes de definición de escenarios en lugar de codificar la mayor parte del comportamiento en TypeScript.

## Estado actual

La fuente principal de verdad ahora vive en `qa/scenarios/index.md` más un archivo por
escenario en `qa/scenarios/*.md`.

Implementado:

- `qa/scenarios/index.md`
  - metadatos canónicos del paquete de QA
  - identidad del operador
  - misión inicial
- `qa/scenarios/*.md`
  - un archivo Markdown por escenario
  - metadatos del escenario
  - vinculaciones de handlers
  - configuración de ejecución específica del escenario
- `extensions/qa-lab/src/scenario-catalog.ts`
  - analizador del paquete Markdown + validación con zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - renderizado del plan a partir del paquete Markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - genera archivos de compatibilidad sembrados más `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - selecciona escenarios ejecutables mediante vinculaciones de handlers definidas en Markdown
- Protocolo del bus de QA + UI
  - adjuntos en línea genéricos para renderizado de imagen/video/audio/archivo

Superficies divididas restantes:

- `extensions/qa-lab/src/suite.ts`
  - todavía posee la mayor parte de la lógica ejecutable de handlers personalizados
- `extensions/qa-lab/src/report.ts`
  - todavía deriva la estructura del informe a partir de las salidas de tiempo de ejecución

Así que la división de la fuente de verdad está solucionada, pero la ejecución sigue estando mayormente respaldada por handlers en lugar de ser completamente declarativa.

## Cómo es la superficie real de escenarios

Al leer la suite actual se observan algunas clases distintas de escenarios.

### Interacción simple

- línea base de canal
- línea base de DM
- seguimiento en hilo
- cambio de modelo
- continuación de aprobación
- reacción/edición/eliminación

### Mutación de configuración y tiempo de ejecución

- desactivación de Skills mediante parche de configuración
- activación tras reinicio con aplicación de configuración
- cambio de capacidad tras reinicio de configuración
- verificación de deriva del inventario de tiempo de ejecución

### Aserciones de sistema de archivos y repositorio

- informe de descubrimiento de código/documentación
- compilar Lobster Invaders
- búsqueda de artefactos de imagen generada

### Orquestación de memoria

- recuperación de memoria
- herramientas de memoria en contexto de canal
- fallback ante fallo de memoria
- clasificación de memoria de sesión
- aislamiento de memoria de hilos
- barrido de memory dreaming

### Integración de herramientas y plugins

- llamada MCP plugin-tools
- visibilidad de Skills
- instalación en caliente de Skills
- generación de imágenes nativa
- ida y vuelta de imágenes
- comprensión de imágenes a partir de adjuntos

### Múltiples turnos y múltiples actores

- transferencia a subagentes
- síntesis fanout de subagentes
- flujos tipo recuperación tras reinicio

Estas categorías importan porque impulsan los requisitos del DSL. Una lista plana de prompt + texto esperado no es suficiente.

## Dirección

### Fuente única de verdad

Usar `qa/scenarios/index.md` más `qa/scenarios/*.md` como la fuente de verdad
creada.

El paquete debe seguir siendo:

- legible por humanos en revisión
- interpretable por máquinas
- lo bastante rico para impulsar:
  - ejecución de la suite
  - bootstrap del espacio de trabajo de QA
  - metadatos de la UI de QA Lab
  - prompts de documentación/descubrimiento
  - generación de informes

### Formato de autoría preferido

Usar Markdown como formato de nivel superior, con YAML estructurado dentro de él.

Forma recomendada:

- frontmatter YAML
  - id
  - título
  - superficie
  - tags
  - referencias de documentación
  - referencias de código
  - anulaciones de modelo/proveedor
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

Esto proporciona:

- mejor legibilidad en PR que un JSON gigante
- contexto más rico que YAML puro
- análisis estricto y validación con zod

El JSON sin procesar es aceptable solo como forma intermedia generada.

## Forma propuesta del archivo de escenario

Ejemplo:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
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
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expectativa

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Capacidades del runner que debe cubrir el DSL

Según la suite actual, el runner genérico necesita más que ejecución de prompts.

### Acciones de entorno y configuración

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Acciones de turnos del agente

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

### Acciones de memoria y cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Acciones de MCP

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
- generar una cadena de marcador de activación y luego afirmar que aparece más tarde

Capacidades necesarias:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- referencias tipadas para rutas, claves de sesión, ids de hilos, marcadores y salidas de herramientas

Sin soporte para variables, el harness seguirá filtrando la lógica de los escenarios de vuelta a TypeScript.

## Qué debería permanecer como escape hatches

Un runner declarativo completamente puro no es realista en la fase 1.

Algunos escenarios son inherentemente intensivos en orquestación:

- barrido de memory dreaming
- activación tras reinicio con aplicación de configuración
- cambio de capacidad tras reinicio de configuración
- resolución de artefactos de imagen generada por marca de tiempo/ruta
- evaluación de informes de descubrimiento

Por ahora, estos deberían usar handlers personalizados explícitos.

Regla recomendada:

- 85-90% declarativo
- pasos de `customHandler` explícitos para el resto difícil
- solo handlers personalizados con nombre y documentados
- nada de código en línea anónimo en el archivo de escenario

Eso mantiene limpio el motor genérico y al mismo tiempo permite seguir avanzando.

## Cambio de arquitectura

### Actual

El Markdown de escenarios ya es la fuente de verdad para:

- ejecución de la suite
- archivos de bootstrap del espacio de trabajo
- catálogo de escenarios de la UI de QA Lab
- metadatos de informes
- prompts de descubrimiento

Compatibilidad generada:

- el espacio de trabajo sembrado todavía incluye `QA_KICKOFF_TASK.md`
- el espacio de trabajo sembrado todavía incluye `QA_SCENARIO_PLAN.md`
- el espacio de trabajo sembrado ahora también incluye `QA_SCENARIOS.md`

## Plan de refactorización

### Fase 1: cargador y esquema

Hecho.

- se agregó `qa/scenarios/index.md`
- se dividieron los escenarios en `qa/scenarios/*.md`
- se agregó un analizador para el contenido del paquete Markdown YAML con nombre
- se validó con zod
- se cambiaron los consumidores al paquete analizado
- se eliminaron `qa/seed-scenarios.json` y `qa/QA_KICKOFF_TASK.md` a nivel de repositorio

### Fase 2: motor genérico

- dividir `extensions/qa-lab/src/suite.ts` en:
  - cargador
  - motor
  - registro de acciones
  - registro de aserciones
  - handlers personalizados
- mantener las funciones auxiliares existentes como operaciones del motor

Entregable:

- el motor ejecuta escenarios declarativos simples

Comenzar con escenarios que son principalmente prompt + espera + aserción:

- seguimiento en hilo
- comprensión de imágenes a partir de adjuntos
- visibilidad e invocación de Skills
- línea base de canal

Entregable:

- los primeros escenarios reales definidos en Markdown funcionando a través del motor genérico

### Fase 4: migrar escenarios intermedios

- ida y vuelta de generación de imágenes
- herramientas de memoria en contexto de canal
- clasificación de memoria de sesión
- transferencia a subagentes
- síntesis fanout de subagentes

Entregable:

- variables, artefactos, aserciones de herramientas y aserciones de logs de solicitudes demostradas

### Fase 5: mantener los escenarios difíciles en handlers personalizados

- barrido de memory dreaming
- activación tras reinicio con aplicación de configuración
- cambio de capacidad tras reinicio de configuración
- deriva del inventario de tiempo de ejecución

Entregable:

- el mismo formato de autoría, pero con bloques explícitos de pasos personalizados donde sea necesario

### Fase 6: eliminar el mapa de escenarios codificado

Una vez que la cobertura del paquete sea lo bastante buena:

- eliminar la mayor parte de la ramificación TypeScript específica por escenario de `extensions/qa-lab/src/suite.ts`

## Slack falso / soporte para contenido multimedia enriquecido

El bus de QA actual está orientado primero al texto.

Archivos relevantes:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Hoy el bus de QA admite:

- texto
- reacciones
- hilos

Todavía no modela adjuntos multimedia en línea.

### Contrato de transporte necesario

Agregar un modelo genérico de adjuntos del bus de QA:

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

Luego agregar `attachments?: QaBusAttachment[]` a:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Por qué genérico primero

No construir un modelo de multimedia solo para Slack.

En su lugar:

- un modelo genérico de transporte de QA
- múltiples renderizadores sobre él
  - el chat actual de QA Lab
  - un futuro Slack falso web
  - cualquier otra vista de transporte falsa

Esto evita lógica duplicada y permite que los escenarios multimedia sigan siendo agnósticos al transporte.

### Trabajo de UI necesario

Actualizar la UI de QA para renderizar:

- vista previa de imagen en línea
- reproductor de audio en línea
- reproductor de video en línea
- chip de adjunto de archivo

La UI actual ya puede renderizar hilos y reacciones, por lo que el renderizado de adjuntos debería integrarse sobre el mismo modelo de tarjeta de mensaje.

### Trabajo de escenarios habilitado por el transporte multimedia

Una vez que los adjuntos fluyan por el bus de QA, podremos agregar escenarios de chat falso más ricos:

- respuesta con imagen en línea en Slack falso
- comprensión de adjuntos de audio
- comprensión de adjuntos de video
- orden mixto de adjuntos
- respuesta en hilo con medios conservados

## Recomendación

El siguiente bloque de implementación debería ser:

1. agregar el cargador de escenarios Markdown + esquema zod
2. generar el catálogo actual a partir de Markdown
3. migrar primero algunos escenarios simples
4. agregar compatibilidad genérica con adjuntos del bus de QA
5. renderizar imágenes en línea en la UI de QA
6. luego ampliar a audio y video

Este es el camino más pequeño que demuestra ambos objetivos:

- QA genérico definido en Markdown
- superficies de mensajería falsa más ricas

## Preguntas abiertas

- si los archivos de escenarios deberían permitir plantillas de prompts Markdown incrustadas con interpolación de variables
- si setup/cleanup deberían ser secciones con nombre o simplemente listas ordenadas de acciones
- si las referencias a artefactos deberían estar fuertemente tipadas en el esquema o basadas en cadenas
- si los handlers personalizados deberían vivir en un único registro o en registros por superficie
- si el archivo de compatibilidad JSON generado debería seguir versionado durante la migración
