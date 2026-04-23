---
read_when:
    - Extendiendo qa-lab o qa-channel
    - Agregando escenarios de QA respaldados por el repositorio
    - Creando automatización de QA de mayor realismo alrededor del panel del Gateway
summary: Forma de automatización de QA privada para qa-lab, qa-channel, escenarios con seed e informes de protocolo
title: Automatización E2E de QA
x-i18n:
    generated_at: "2026-04-23T14:02:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967a74d2e70b042e9443c5ec954902b820d2e5a22cbecd9be74af13b9085553
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatización E2E de QA

La pila privada de QA está pensada para ejercitar OpenClaw de una manera más realista,
con forma de canal, de lo que puede hacerlo una sola prueba unitaria.

Componentes actuales:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de MD, canal, hilo,
  reacción, edición y eliminación.
- `extensions/qa-lab`: interfaz de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe en Markdown.
- `qa/`: recursos con seed respaldados por el repositorio para la tarea inicial y escenarios
  base de QA.

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel del Gateway (UI de control) con el agente.
- Derecha: QA Lab, que muestra la transcripción tipo Slack y el plan del escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso compila el sitio de QA, inicia la vía del Gateway respaldada por Docker y expone la
página de QA Lab, donde un operador o un bucle de automatización puede dar al agente una
misión de QA, observar el comportamiento real del canal y registrar qué funcionó, qué falló o qué
siguió bloqueado.

Para iterar más rápido en la UI de QA Lab sin recompilar la imagen de Docker cada vez,
inicia la pila con un paquete de QA Lab montado mediante enlace:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios Docker sobre una imagen precompilada y monta mediante enlace
`extensions/qa-lab/web/dist` dentro del contenedor `qa-lab`. `qa:lab:watch`
recompila ese paquete cuando hay cambios, y el navegador se recarga automáticamente cuando cambia el
hash de recursos de QA Lab.

Para una vía de humo Matrix con transporte real, ejecuta:

```bash
pnpm openclaw qa matrix
```

Esa vía aprovisiona un homeserver Tuwunel desechable en Docker, registra usuarios
temporales de controlador, SUT y observador, crea una sala privada y luego ejecuta
el Plugin real de Matrix dentro de un proceso hijo del Gateway de QA. La vía de transporte en vivo mantiene
la configuración hija limitada al transporte bajo prueba, por lo que Matrix se ejecuta sin
`qa-channel` en la configuración hija. Escribe los artefactos estructurados del informe y
un registro combinado de stdout/stderr en el directorio de salida de QA de Matrix seleccionado. Para
capturar también la salida externa de compilación/inicio de `scripts/run-node.mjs`, establece
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` en un archivo de registro local del repositorio.

Para una vía de humo Telegram con transporte real, ejecuta:

```bash
pnpm openclaw qa telegram
```

Esa vía apunta a un grupo privado real de Telegram en lugar de aprovisionar un
servidor desechable. Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, además de dos bots distintos en el mismo
grupo privado. El bot SUT debe tener un nombre de usuario de Telegram, y la observación bot a bot
funciona mejor cuando ambos bots tienen habilitado el modo de comunicación bot a bot
en `@BotFather`.
El comando termina con código distinto de cero cuando falla algún escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida de fallo.
El informe y el resumen de Telegram incluyen RTT por respuesta desde la solicitud de envío del
mensaje del controlador hasta la respuesta observada del SUT, comenzando por el canario.

Las vías de transporte en vivo ahora comparten un contrato más pequeño en lugar de que cada una invente
su propia forma de lista de escenarios:

`qa-channel` sigue siendo la suite amplia y sintética de comportamiento del producto, y no forma parte
de la matriz de cobertura de transporte en vivo.

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

Esto mantiene `qa-channel` como la suite amplia de comportamiento del producto, mientras que Matrix,
Telegram y futuros transportes en vivo comparten una lista explícita de verificación de contrato de transporte.

Para una vía de VM Linux desechable sin incorporar Docker en la ruta de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto arranca un invitado nuevo de Multipass, instala dependencias, compila OpenClaw
dentro del invitado, ejecuta `qa suite` y luego copia el informe y el resumen normales de QA de
vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de suite en host y Multipass ejecutan varios escenarios seleccionados en paralelo
con workers aislados del Gateway de forma predeterminada. `qa-channel` usa una concurrencia
predeterminada de 4, limitada por el número de escenarios seleccionados. Usa `--concurrency <count>` para ajustar
el número de workers, o `--concurrency 1` para ejecución en serie.
El comando termina con código distinto de cero cuando falla algún escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida de fallo.
Las ejecuciones en vivo reenvían las entradas de autenticación de QA admitidas que resultan prácticas para el
invitado: claves de proveedor basadas en variables de entorno, la ruta de configuración del proveedor vivo de QA y
`CODEX_HOME` cuando está presente. Mantén `--output-dir` bajo la raíz del repositorio para que el invitado
pueda escribir de vuelta a través del espacio de trabajo montado.

## Seeds respaldados por el repositorio

Los recursos con seed viven en `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Esto está intencionalmente en git para que el plan de QA sea visible tanto para humanos como para el
agente.

`qa-lab` debe seguir siendo un ejecutor genérico de Markdown. Cada archivo Markdown de escenario es
la fuente de verdad para una ejecución de prueba y debe definir:

- metadatos del escenario
- metadatos opcionales de categoría, capacidad, vía y riesgo
- referencias a documentación y código
- requisitos opcionales de plugins
- parche opcional de configuración del Gateway
- el `qa-flow` ejecutable

La superficie reutilizable de tiempo de ejecución que respalda `qa-flow` puede seguir siendo genérica
y transversal. Por ejemplo, los escenarios Markdown pueden combinar ayudantes del lado del transporte
con ayudantes del lado del navegador que controlen la UI de control incrustada a través de la
costura `browser.request` del Gateway sin agregar un ejecutor con casos especiales.

Los archivos de escenarios deben agruparse por capacidad del producto en lugar de por carpeta del árbol
de código fuente. Mantén estables los ID de escenario cuando los archivos se muevan; usa `docsRefs` y `codeRefs`
para la trazabilidad de la implementación.

La lista base debe seguir siendo lo suficientemente amplia como para cubrir:

- chat por MD y canal
- comportamiento de hilos
- ciclo de vida de acciones de mensajes
- callbacks de Cron
- recuperación de memoria
- cambio de modelo
- transferencia a subagente
- lectura de repositorio y de documentación
- una pequeña tarea de compilación como Lobster Invaders

## Vías simuladas de proveedor

`qa suite` tiene dos vías locales simuladas de proveedor:

- `mock-openai` es el simulador de OpenClaw consciente del escenario. Sigue siendo la
  vía simulada determinista predeterminada para QA respaldada por el repositorio y puertas de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo,
  fixtures, grabación/reproducción y caos. Es aditivo y no reemplaza al despachador de escenarios
  `mock-openai`.

La implementación de la vía de proveedor vive en `extensions/qa-lab/src/providers/`.
Cada proveedor es dueño de sus valores predeterminados, inicio de servidor local, configuración del modelo del Gateway,
necesidades de preparación del perfil de autenticación y banderas de capacidad en vivo/simulada. El código compartido
de suite y Gateway debe enrutar a través del registro de proveedores en lugar de ramificarse según los nombres
de proveedores.

## Adaptadores de transporte

`qa-lab` es dueño de una costura genérica de transporte para escenarios de QA en Markdown.
`qa-channel` es el primer adaptador sobre esa costura, pero el objetivo del diseño es más amplio:
futuros canales reales o sintéticos deben conectarse al mismo ejecutor de suite en lugar de agregar
un ejecutor de QA específico por transporte.

A nivel de arquitectura, la división es:

- `qa-lab` es dueño de la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos y los informes.
- el adaptador de transporte es dueño de la configuración del Gateway, la disponibilidad, la observación entrante y saliente, las acciones de transporte y el estado normalizado del transporte.
- los archivos Markdown de escenarios en `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie reutilizable de tiempo de ejecución que los ejecuta.

La guía de adopción orientada a mantenedores para nuevos adaptadores de canal vive en
[Pruebas](/es/help/testing#adding-a-channel-to-qa).

## Informes

`qa-lab` exporta un informe de protocolo en Markdown a partir de la línea temporal observada del bus.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué siguió bloqueado
- Qué escenarios de seguimiento vale la pena agregar

Para comprobaciones de carácter y estilo, ejecuta el mismo escenario en varias referencias de modelos en vivo
y escribe un informe en Markdown evaluado:

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

El comando ejecuta procesos hijo locales del Gateway de QA, no Docker. Los escenarios de evaluación de carácter
deben establecer la personalidad mediante `SOUL.md` y luego ejecutar turnos normales de usuario
como chat, ayuda del espacio de trabajo y pequeñas tareas de archivos. Al modelo candidato
no se le debe decir que está siendo evaluado. El comando conserva cada transcripción completa,
registra estadísticas básicas de ejecución y luego pide a los modelos juez en modo rápido con
razonamiento `xhigh` que clasifiquen las ejecuciones por naturalidad, ambiente y humor.
Usa `--blind-judge-models` al comparar proveedores: la indicación del juez sigue recibiendo
cada transcripción y estado de ejecución, pero las referencias candidatas se reemplazan por etiquetas neutras
como `candidate-01`; el informe reasigna las clasificaciones a las referencias reales tras el
análisis.
Las ejecuciones candidatas usan `high` de pensamiento de forma predeterminada, con `xhigh` para modelos OpenAI que
lo admiten. Sobrescribe un candidato específico en línea con
`--model provider/model,thinking=<level>`. `--thinking <level>` sigue estableciendo un
respaldo global, y la forma antigua `--model-thinking <provider/model=level>` se
mantiene por compatibilidad.
Las referencias candidatas de OpenAI usan modo rápido de forma predeterminada para emplear
procesamiento prioritario donde el proveedor lo admite. Agrega `,fast`, `,no-fast` o `,fast=false` en línea cuando
un solo candidato o juez necesite una sobrescritura. Pasa `--fast` solo cuando quieras
forzar el modo rápido para todos los modelos candidatos. Las duraciones de candidatos y jueces se
registran en el informe para análisis comparativo, pero las indicaciones de los jueces indican explícitamente que
no deben clasificar por velocidad.
Tanto las ejecuciones de candidatos como las de jueces usan concurrencia 16 de forma predeterminada. Reduce
`--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión sobre el Gateway local
hagan que una ejecución resulte demasiado ruidosa.
Cuando no se pasa ningún `--model` candidato, la evaluación de carácter usa por defecto
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y
`google/gemini-3.1-pro-preview` cuando no se pasa `--model`.
Cuando no se pasa ningún `--judge-model`, los jueces usan por defecto
`openai/gpt-5.4,thinking=xhigh,fast` y
`anthropic/claude-opus-4-6,thinking=high`.

## Documentación relacionada

- [Pruebas](/es/help/testing)
- [Canal de QA](/es/channels/qa-channel)
- [Panel](/es/web/dashboard)
