---
read_when:
    - Ampliación de qa-lab o qa-channel
    - Agregar escenarios de control de calidad respaldados por el repositorio
    - Creación de automatización de control de calidad de mayor realismo en torno al panel de Gateway
summary: Forma de la automatización privada de control de calidad para qa-lab, qa-channel, escenarios con semillas e informes de protocolo
title: Automatización E2E de control de calidad
x-i18n:
    generated_at: "2026-04-20T05:21:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34245ce871356caeab0d9e0eeeaa9fb4e408920a4a97ad27567fa365d8db17c7
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatización E2E de control de calidad

La pila privada de control de calidad está pensada para ejercitar OpenClaw de una forma más realista y con forma de canal que una sola prueba unitaria.

Piezas actuales:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de DM, canal, hilo, reacción, edición y eliminación.
- `extensions/qa-lab`: interfaz de depuración y bus de control de calidad para observar la transcripción, inyectar mensajes entrantes y exportar un informe en Markdown.
- `qa/`: recursos semilla respaldados por el repositorio para la tarea inicial y los escenarios base de control de calidad.

El flujo actual del operador de control de calidad es un sitio de control de calidad de dos paneles:

- Izquierda: panel de Gateway (Control UI) con el agente.
- Derecha: QA Lab, que muestra la transcripción estilo Slack y el plan del escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso compila el sitio de control de calidad, inicia el carril de Gateway respaldado por Docker y expone la página de QA Lab donde un operador o un bucle de automatización puede darle al agente una misión de control de calidad, observar el comportamiento real del canal y registrar qué funcionó, qué falló o qué siguió bloqueado.

Para una iteración más rápida de la interfaz de QA Lab sin reconstruir la imagen de Docker cada vez, inicia la pila con un bundle de QA Lab montado con bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios de Docker sobre una imagen precompilada y monta con bind `extensions/qa-lab/web/dist` dentro del contenedor `qa-lab`. `qa:lab:watch` recompila ese bundle cuando hay cambios, y el navegador se recarga automáticamente cuando cambia el hash de recursos de QA Lab.

Para un carril de humo de Matrix con transporte real, ejecuta:

```bash
pnpm openclaw qa matrix
```

Ese carril aprovisiona un homeserver Tuwunel desechable en Docker, registra usuarios temporales de controlador, SUT y observador, crea una sala privada y luego ejecuta el plugin real de Matrix dentro de un proceso hijo de Gateway de control de calidad. El carril de transporte en vivo mantiene la configuración hija acotada al transporte bajo prueba, de modo que Matrix se ejecuta sin `qa-channel` en la configuración hija. Escribe los artefactos de informe estructurado y un registro combinado de stdout/stderr en el directorio de salida de QA de Matrix seleccionado. Para capturar también la salida externa de compilación/lanzamiento de `scripts/run-node.mjs`, establece `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` en un archivo de registro local del repositorio.

Para un carril de humo de Telegram con transporte real, ejecuta:

```bash
pnpm openclaw qa telegram
```

Ese carril apunta a un grupo privado real de Telegram en lugar de aprovisionar un servidor desechable. Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, además de dos bots distintos en el mismo grupo privado. El bot SUT debe tener un nombre de usuario de Telegram, y la observación entre bots funciona mejor cuando ambos bots tienen habilitado el Bot-to-Bot Communication Mode en `@BotFather`.
El comando sale con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando quieras artefactos sin un código de salida fallido.

Los carriles de transporte en vivo ahora comparten un contrato más pequeño en lugar de que cada uno invente su propia forma de lista de escenarios:

`qa-channel` sigue siendo la suite amplia de comportamiento sintético del producto y no forma parte de la matriz de cobertura de transporte en vivo.

| Carril   | Canary | Restricción por mención | Bloqueo por lista de permitidos | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento en hilo | Aislamiento de hilo | Observación de reacciones | Comando de ayuda |
| -------- | ------ | ----------------------- | -------------------------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------- | ---------------- |
| Matrix   | x      | x                       | x                                | x                           | x                         | x                   | x                   | x                         |                  |
| Telegram | x      |                         |                                  |                             |                           |                     |                     |                           | x                |

Esto mantiene `qa-channel` como la suite amplia de comportamiento del producto, mientras que Matrix, Telegram y futuros transportes en vivo comparten una lista de verificación explícita del contrato de transporte.

Para un carril en VM Linux desechable sin incorporar Docker en la ruta de control de calidad, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto arranca un invitado nuevo de Multipass, instala dependencias, compila OpenClaw dentro del invitado, ejecuta `qa suite` y luego copia el informe y resumen normales de control de calidad de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de suite en host y en Multipass ejecutan varios escenarios seleccionados en paralelo con workers de Gateway aislados por defecto. `qa-channel` usa por defecto una concurrencia de 4, limitada por el número de escenarios seleccionados. Usa `--concurrency <count>` para ajustar el número de workers, o `--concurrency 1` para ejecución en serie.
El comando sale con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando quieras artefactos sin un código de salida fallido.
Las ejecuciones en vivo reenvían las entradas de autenticación de control de calidad compatibles que son prácticas para el invitado: claves de proveedor basadas en entorno, la ruta de configuración del proveedor en vivo de control de calidad y `CODEX_HOME` cuando está presente. Mantén `--output-dir` bajo la raíz del repositorio para que el invitado pueda escribir de vuelta a través del espacio de trabajo montado.

## Semillas respaldadas por el repositorio

Los recursos semilla viven en `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Estos están intencionalmente en git para que el plan de control de calidad sea visible tanto para humanos como para el agente.

`qa-lab` debe seguir siendo un ejecutor genérico de Markdown. Cada archivo Markdown de escenario es la fuente de verdad para una ejecución de prueba y debe definir:

- metadatos del escenario
- metadatos opcionales de categoría, capacidad, carril y riesgo
- referencias a documentación y código
- requisitos opcionales de plugin
- parche opcional de configuración de Gateway
- el `qa-flow` ejecutable

La superficie de tiempo de ejecución reutilizable que respalda `qa-flow` puede seguir siendo genérica y transversal. Por ejemplo, los escenarios Markdown pueden combinar helpers del lado del transporte con helpers del lado del navegador que controlan la Control UI incrustada a través de la superficie `browser.request` de Gateway sin agregar un ejecutor de caso especial.

Los archivos de escenario deben agruparse por capacidad del producto en lugar de por carpeta del árbol de código fuente. Mantén estables los IDs de escenario cuando se muevan archivos; usa `docsRefs` y `codeRefs` para la trazabilidad de implementación.

La lista base debe seguir siendo lo bastante amplia como para cubrir:

- chat por DM y por canal
- comportamiento de hilos
- ciclo de vida de acciones de mensajes
- callbacks de Cron
- recuperación de memoria
- cambio de modelo
- transferencia a subagente
- lectura del repositorio y de la documentación
- una tarea pequeña de compilación como Lobster Invaders

## Carriles de simulación de proveedores

`qa suite` tiene dos carriles locales de simulación de proveedores:

- `mock-openai` es el simulador de OpenClaw consciente de escenarios. Sigue siendo el carril de simulación determinista predeterminado para el control de calidad respaldado por el repositorio y las compuertas de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo, fixtures, grabación/reproducción y caos. Es aditivo y no reemplaza el despachador de escenarios de `mock-openai`.

La implementación del carril de proveedor vive en `extensions/qa-lab/src/providers/`.
Cada proveedor es dueño de sus valores predeterminados, el arranque del servidor local, la configuración del modelo de Gateway, las necesidades de preparación del perfil de autenticación y los indicadores de capacidad de vivo/simulado. El código compartido de suite y Gateway debe enrutar a través del registro de proveedores en lugar de bifurcar según nombres de proveedor.

## Adaptadores de transporte

`qa-lab` es dueño de una superficie genérica de transporte para escenarios de control de calidad en Markdown.
`qa-channel` es el primer adaptador sobre esa superficie, pero el objetivo de diseño es más amplio:
los futuros canales reales o sintéticos deben conectarse al mismo ejecutor de suite en lugar de agregar un ejecutor de control de calidad específico por transporte.

A nivel de arquitectura, la división es:

- `qa-lab` es dueño de la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos y la generación de informes.
- el adaptador de transporte es dueño de la configuración de Gateway, la preparación, la observación entrante y saliente, las acciones de transporte y el estado de transporte normalizado.
- los archivos de escenario Markdown en `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie de tiempo de ejecución reutilizable que los ejecuta.

La guía de adopción orientada a mantenedores para nuevos adaptadores de canal vive en
[Testing](/es/help/testing#adding-a-channel-to-qa).

## Informes

`qa-lab` exporta un informe de protocolo en Markdown a partir de la línea de tiempo observada del bus.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué siguió bloqueado
- Qué escenarios de seguimiento vale la pena agregar

Para verificaciones de carácter y estilo, ejecuta el mismo escenario en múltiples refs de modelos en vivo y escribe un informe evaluado en Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

El comando ejecuta procesos hijo locales de Gateway de control de calidad, no Docker. Los escenarios de evaluación de carácter deben establecer la persona mediante `SOUL.md`, y luego ejecutar turnos ordinarios de usuario como chat, ayuda del espacio de trabajo y pequeñas tareas de archivos. No se le debe decir al modelo candidato que está siendo evaluado. El comando conserva cada transcripción completa, registra estadísticas básicas de ejecución y luego pide a los modelos jueces en modo rápido con razonamiento `xhigh` que clasifiquen las ejecuciones por naturalidad, vibra y humor.
Usa `--blind-judge-models` al comparar proveedores: el prompt del juez sigue recibiendo cada transcripción y estado de ejecución, pero las refs candidatas se reemplazan por etiquetas neutrales como `candidate-01`; el informe vuelve a mapear las clasificaciones a las refs reales después del análisis.
Las ejecuciones candidatas usan por defecto thinking `high`, con `xhigh` para modelos OpenAI que lo admiten. Sustituye un candidato específico en línea con
`--model provider/model,thinking=<level>`. `--thinking <level>` sigue estableciendo un valor de respaldo global, y la forma anterior `--model-thinking <provider/model=level>` se mantiene por compatibilidad.
Las refs candidatas de OpenAI usan por defecto el modo rápido para que se use procesamiento prioritario cuando el proveedor lo admita. Agrega `,fast`, `,no-fast` o `,fast=false` en línea cuando un solo candidato o juez necesite una sustitución. Pasa `--fast` solo cuando quieras forzar el modo rápido para cada modelo candidato. Las duraciones de candidatos y jueces se registran en el informe para análisis comparativo, pero los prompts de los jueces indican explícitamente que no deben clasificar por velocidad.
Las ejecuciones de modelos candidatos y jueces usan ambas por defecto una concurrencia de 16. Reduce `--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión local sobre Gateway hagan que una ejecución sea demasiado ruidosa.
Cuando no se pasa ningún `--model` candidato, la evaluación de carácter usa por defecto
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y
`google/gemini-3.1-pro-preview` cuando no se pasa `--model`.
Cuando no se pasa ningún `--judge-model`, los jueces usan por defecto
`openai/gpt-5.4,thinking=xhigh,fast` y
`anthropic/claude-opus-4-6,thinking=high`.

## Documentación relacionada

- [Testing](/es/help/testing)
- [QA Channel](/es/channels/qa-channel)
- [Panel](/web/dashboard)
