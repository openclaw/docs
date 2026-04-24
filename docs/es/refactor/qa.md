---
read_when:
    - Refactorizar definiciones de escenarios de QA o código del arnés qa-lab
    - Mover comportamiento de QA entre escenarios markdown y lógica del arnés TypeScript
summary: Plan de refactorización de QA para la consolidación del catálogo de escenarios y del arnés
title: Refactorización de QA
x-i18n:
    generated_at: "2026-04-24T05:47:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d774d7b5e0fffd5c2504d9a4d6063198d77b866263ea8448474dce6246012d4
    source_path: refactor/qa.md
    workflow: 15
---

Estado: migración fundacional implementada.

## Objetivo

Mover el QA de OpenClaw desde un modelo de definiciones divididas a una única fuente de verdad:

- metadatos del escenario
- prompts enviados al modelo
- configuración y limpieza
- lógica del arnés
- aserciones y criterios de éxito
- artefactos e indicaciones para informes

El estado final deseado es un arnés de QA genérico que cargue archivos potentes de definición de escenarios en lugar de codificar rígidamente la mayor parte del comportamiento en TypeScript.

## Estado actual

La fuente principal de verdad ahora vive en `qa/scenarios/index.md` más un archivo por
escenario en `qa/scenarios/<theme>/*.md`.

Implementado:

- `qa/scenarios/index.md`
  - metadatos canónicos del paquete de QA
  - identidad del operador
  - misión de arranque
- `qa/scenarios/<theme>/*.md`
  - un archivo markdown por escenario
  - metadatos del escenario
  - enlaces de handlers
  - configuración de ejecución específica del escenario
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser del paquete markdown + validación con zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - renderizado del plan desde el paquete markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - genera archivos de compatibilidad sembrados más `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - selecciona escenarios ejecutables mediante enlaces de handlers definidos en markdown
- Protocolo de bus QA + UI
  - adjuntos en línea genéricos para renderizado de imagen/video/audio/archivo

Superficies divididas restantes:

- `extensions/qa-lab/src/suite.ts`
  - todavía controla la mayor parte de la lógica ejecutable personalizada de handlers
- `extensions/qa-lab/src/report.ts`
  - todavía deriva la estructura del informe a partir de salidas de runtime

Así que la división de la fuente de verdad ya está arreglada, pero la ejecución sigue estando respaldada principalmente por handlers en lugar de ser totalmente declarativa.

## Cómo es realmente la superficie de escenarios

Leyendo la suite actual se observan algunas clases distintas de escenarios.

### Interacción simple

- línea base de canal
- línea base de DM
- seguimiento en hilo
- cambio de modelo
- continuación de aprobación
- reacción/edición/eliminación

### Mutación de configuración y runtime

- deshabilitación de Skill mediante parche de configuración
- activación tras reinicio por aplicación de configuración
- cambio de capacidad tras reinicio de configuración
- comprobación de deriva del inventario de runtime

### Aserciones de sistema de archivos y repositorio

- informe de descubrimiento de source/docs
- compilación de Lobster Invaders
- búsqueda de artefacto de imagen generado

### Orquestación de memoria

- recuperación de memoria
- herramientas de memoria en contexto de canal
- fallback ante fallo de memoria
- clasificación de memoria de sesión
- aislamiento de memoria por hilo
- barrido de Dreaming de memoria

### Integración de herramientas y Plugins

- llamada MCP de plugin-tools
- visibilidad de Skills
- instalación en caliente de Skills
- generación nativa de imágenes
- roundtrip de imagen
- comprensión de imagen desde adjunto

### Multiturno y multiactor

- transferencia a subagente
- síntesis de fanout de subagente
- flujos de estilo de recuperación tras reinicio

Estas categorías importan porque determinan los requisitos del DSL. Una lista plana de prompt + texto esperado no es suficiente.

## Dirección

### Fuente única de verdad

Usar `qa/scenarios/index.md` más `qa/scenarios/<theme>/*.md` como la
fuente de verdad editada.

El paquete debe seguir siendo:

- legible para humanos en revisión
- analizable por máquina
- lo bastante rico como para controlar:
  - ejecución de la suite
  - bootstrap del espacio de trabajo de QA
  - metadatos de la UI de QA Lab
  - prompts de documentación/descubrimiento
  - generación de informes

### Formato de autoría preferido

Usar markdown como formato de nivel superior, con YAML estructurado dentro.

Forma recomendada:

- frontmatter YAML
  - id
  - title
  - surface
  - tags
  - refs de documentación
  - refs de código
  - sobrescrituras de modelo/proveedor
  - prerrequisitos
- secciones en prosa
  - objetivo
  - notas
  - pistas de depuración
- bloques YAML delimitados
  - setup
  - steps
  - assertions
  - cleanup

Esto ofrece:

- mejor legibilidad en PR que JSON gigantesco
- contexto más rico que YAML puro
- parsing estricto y validación con zod

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

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

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

# Steps

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

# Expect

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

## Capacidades del runner que el DSL debe cubrir

Según la suite actual, el runner genérico necesita algo más que ejecución de prompts.

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

### Acciones de configuración y runtime

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

El DSL debe soportar salidas guardadas y referencias posteriores.

Ejemplos de la suite actual:

- crear un hilo y luego reutilizar `threadId`
- crear una sesión y luego reutilizar `sessionKey`
- generar una imagen y luego adjuntar el archivo en el siguiente turno
- generar una cadena marcador de activación y luego afirmar que aparece más tarde

Capacidades necesarias:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- referencias tipadas para rutas, claves de sesión, ids de hilo, marcadores y salidas de herramientas

Sin soporte de variables, el arnés seguirá devolviendo lógica del escenario a TypeScript.

## Qué debería quedarse como escape hatches

Un runner totalmente declarativo no es realista en la fase 1.

Algunos escenarios son intrínsecamente pesados en orquestación:

- barrido de Dreaming de memoria
- activación tras reinicio por aplicación de configuración
- cambio de capacidad tras reinicio de configuración
- resolución de artefactos de imagen generada por marca temporal/ruta
- evaluación de informes de descubrimiento

Por ahora, estos deberían usar handlers personalizados explícitos.

Regla recomendada:

- 85-90% declarativo
- pasos `customHandler` explícitos para el resto difícil
- solo handlers personalizados con nombre y documentados
- sin código anónimo en línea dentro del archivo de escenario

Eso mantiene limpio el motor genérico y aun así permite avanzar.

## Cambio de arquitectura

### Actual

El markdown del escenario ya es la fuente de verdad para:

- ejecución de la suite
- archivos bootstrap del espacio de trabajo
- catálogo de escenarios de la UI de QA Lab
- metadatos del informe
- prompts de descubrimiento

Compatibilidad generada:

- el espacio de trabajo sembrado sigue incluyendo `QA_KICKOFF_TASK.md`
- el espacio de trabajo sembrado sigue incluyendo `QA_SCENARIO_PLAN.md`
- el espacio de trabajo sembrado ahora también incluye `QA_SCENARIOS.md`

## Plan de refactorización

### Fase 1: cargador y esquema

Hecho.

- se añadió `qa/scenarios/index.md`
- se dividieron los escenarios en `qa/scenarios/<theme>/*.md`
- se añadió un parser para contenido de paquete markdown YAML con nombre
- se validó con zod
- se cambiaron los consumidores al paquete analizado
- se eliminaron `qa/seed-scenarios.json` y `qa/QA_KICKOFF_TASK.md` del nivel del repositorio

### Fase 2: motor genérico

- dividir `extensions/qa-lab/src/suite.ts` en:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- mantener las funciones helper existentes como operaciones del motor

Resultado esperado:

- el motor ejecuta escenarios declarativos simples

Empezar con escenarios que sean principalmente prompt + espera + aserción:

- seguimiento en hilo
- comprensión de imagen desde adjunto
- visibilidad e invocación de Skills
- línea base de canal

Resultado esperado:

- primeros escenarios reales definidos en markdown enviados mediante el motor genérico

### Fase 4: migrar escenarios intermedios

- roundtrip de generación de imágenes
- herramientas de memoria en contexto de canal
- clasificación de memoria de sesión
- transferencia a subagente
- síntesis de fanout de subagente

Resultado esperado:

- variables, artefactos, aserciones de herramientas y aserciones de request-log validadas

### Fase 5: mantener escenarios difíciles con handlers personalizados

- barrido de Dreaming de memoria
- activación tras reinicio por aplicación de configuración
- cambio de capacidad tras reinicio de configuración
- inventario de runtime

Resultado esperado:

- mismo formato de autoría, pero con bloques de pasos personalizados explícitos cuando sea necesario

### Fase 6: eliminar el mapa de escenarios hardcodeado

Cuando la cobertura del paquete sea suficientemente buena:

- eliminar la mayor parte de las ramas TypeScript específicas de escenario de `extensions/qa-lab/src/suite.ts`

## Fake Slack / soporte de medios enriquecidos

El bus de QA actual está centrado en texto.

Archivos relevantes:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Hoy el bus de QA soporta:

- texto
- reacciones
- hilos

Todavía no modela adjuntos de medios en línea.

### Contrato de transporte necesario

Añadir un modelo genérico de adjuntos del bus de QA:

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

- un único modelo genérico de transporte de QA
- varios renderizadores encima
  - chat actual de QA Lab
  - futuro fake Slack web
  - cualquier otra vista de transporte falsa

Esto evita lógica duplicada y permite que los escenarios de medios sigan siendo agnósticos al transporte.

### Trabajo de UI necesario

Actualizar la UI de QA para renderizar:

- vista previa de imagen en línea
- reproductor de audio en línea
- reproductor de video en línea
- chip de archivo adjunto

La UI actual ya puede renderizar hilos y reacciones, así que el renderizado de adjuntos debería añadirse al mismo modelo de tarjeta de mensaje.

### Trabajo de escenarios habilitado por el transporte de medios

Una vez que los adjuntos fluyan por el bus de QA, podremos añadir escenarios de chat falso más ricos:

- respuesta con imagen en línea en fake Slack
- comprensión de adjunto de audio
- comprensión de adjunto de video
- orden mixto de adjuntos
- respuesta en hilo con medios conservados

## Recomendación

El siguiente bloque de implementación debería ser:

1. añadir cargador de escenarios markdown + esquema zod
2. generar el catálogo actual a partir de markdown
3. migrar primero algunos escenarios simples
4. añadir soporte genérico de adjuntos al bus de QA
5. renderizar imagen en línea en la UI de QA
6. luego ampliar a audio y video

Este es el camino más pequeño que demuestra ambos objetivos:

- QA genérico definido por markdown
- superficies de mensajería falsa más ricas

## Preguntas abiertas

- si los archivos de escenario deberían permitir plantillas de prompt markdown incrustadas con interpolación de variables
- si setup/cleanup deberían ser secciones con nombre o solo listas ordenadas de acciones
- si las referencias de artefactos deberían estar fuertemente tipadas en el esquema o basadas en cadenas
- si los handlers personalizados deberían vivir en un solo registro o en registros por superficie
- si el archivo de compatibilidad JSON generado debería seguir versionado durante la migración

## Relacionado

- [Automatización E2E de QA](/es/concepts/qa-e2e-automation)
