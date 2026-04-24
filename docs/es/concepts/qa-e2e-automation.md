---
read_when:
    - Ampliar qa-lab o qa-channel
    - Añadir escenarios de QA respaldados por el repositorio
    - Crear automatización de QA con mayor realismo en torno al panel de Gateway
summary: Estructura de automatización de QA privada para qa-lab, qa-channel, escenarios sembrados e informes de protocolo
title: Automatización E2E de QA
x-i18n:
    generated_at: "2026-04-24T05:26:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbde51169a1572dc6753ab550ca29ca98abb2394e8991a8482bd7b66ea80ce76
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

La pila privada de QA está pensada para ejercitar OpenClaw de una forma más realista,
con forma de canal, que la que puede ofrecer una sola prueba unitaria.

Piezas actuales:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de MD, canal, hilo,
  reacción, edición y eliminación.
- `extensions/qa-lab`: interfaz de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe en Markdown.
- `qa/`: recursos semilla respaldados por el repositorio para la tarea inicial y los
  escenarios base de QA.

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel de Gateway (Control UI) con el agente.
- Derecha: QA Lab, mostrando la transcripción estilo Slack y el plan del escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso compila el sitio de QA, inicia la línea de gateway respaldada por Docker y expone la
página de QA Lab donde un operador o un bucle de automatización puede asignarle al agente una misión de QA,
observar el comportamiento real del canal y registrar qué funcionó, qué falló o qué
siguió bloqueado.

Para una iteración más rápida de la interfaz de QA Lab sin reconstruir la imagen de Docker cada vez,
inicia la pila con un paquete de QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios de Docker sobre una imagen precompilada y monta por bind
`extensions/qa-lab/web/dist` dentro del contenedor `qa-lab`. `qa:lab:watch`
recompila ese paquete cuando hay cambios, y el navegador se recarga automáticamente cuando cambia el hash de recursos de QA Lab.

Para una línea de smoke de Matrix con transporte real, ejecuta:

```bash
pnpm openclaw qa matrix
```

Esa línea aprovisiona un homeserver Tuwunel desechable en Docker, registra
usuarios temporales de controlador, SUT y observador, crea una sala privada y luego ejecuta
el Plugin real de Matrix dentro de un gateway QA hijo. La línea de transporte en vivo mantiene
la configuración hija limitada al transporte bajo prueba, por lo que Matrix se ejecuta sin
`qa-channel` en la configuración hija. Escribe los artefactos del informe estructurado y
un registro combinado de stdout/stderr en el directorio de salida de QA de Matrix seleccionado. Para
capturar también la salida externa de compilación/lanzamiento de `scripts/run-node.mjs`, establece
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` en un archivo de registro local al repositorio.

Para una línea de smoke de Telegram con transporte real, ejecuta:

```bash
pnpm openclaw qa telegram
```

Esa línea apunta a un grupo privado real de Telegram en lugar de aprovisionar un servidor
desechable. Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, además de dos bots distintos en el mismo
grupo privado. El bot SUT debe tener un nombre de usuario de Telegram, y la observación
bot a bot funciona mejor cuando ambos bots tienen habilitado el modo de comunicación bot a bot
en `@BotFather`.
El comando termina con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida de fallo.
El informe y el resumen de Telegram incluyen RTT por respuesta desde la solicitud de envío
del mensaje del controlador hasta la respuesta observada del SUT, empezando por el canario.

Para una línea de smoke de Discord con transporte real, ejecuta:

```bash
pnpm openclaw qa discord
```

Esa línea apunta a un canal real de un servidor privado de Discord con dos bots: un
bot controlador gestionado por el arnés y un bot SUT iniciado por el gateway hijo de
OpenClaw mediante el Plugin integrado de Discord. Requiere
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
y `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` cuando se usan credenciales de entorno.
La línea verifica el manejo de menciones de canal y comprueba que el bot SUT haya
registrado el comando nativo `/help` en Discord.
El comando termina con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida de fallo.

Las líneas de transporte en vivo ahora comparten un contrato más pequeño en lugar de que cada una invente
su propia forma de lista de escenarios:

`qa-channel` sigue siendo la suite amplia y sintética de comportamiento del producto y no forma parte
de la matriz de cobertura de transporte en vivo.

| Línea    | Canario | Restricción por mención | Bloqueo por allowlist | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento de hilo | Aislamiento de hilo | Observación de reacciones | Comando help | Registro de comandos nativos |
| -------- | ------- | ----------------------- | --------------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------- | ------------- | ---------------------------- |
| Matrix   | x       | x                       | x                     | x                           | x                         | x                   | x                   | x                         |               |                              |
| Telegram | x       | x                       |                       |                             |                           |                     |                     |                           | x             |                              |
| Discord  | x       | x                       |                       |                             |                           |                     |                     |                           |               | x                            |

Esto mantiene `qa-channel` como la suite amplia de comportamiento del producto, mientras que Matrix,
Telegram y futuros transportes en vivo comparten una lista de verificación explícita de contrato de transporte.

Para una línea de VM Linux desechable sin introducir Docker en la ruta de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto arranca un invitado Multipass nuevo, instala dependencias, compila OpenClaw
dentro del invitado, ejecuta `qa suite` y luego copia el informe y el resumen normales de QA
de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de suite en host y Multipass ejecutan varios escenarios seleccionados en paralelo
con workers de gateway aislados de forma predeterminada. `qa-channel` usa por defecto una concurrencia
de 4, limitada por el recuento de escenarios seleccionados. Usa `--concurrency <count>` para ajustar
el número de workers, o `--concurrency 1` para ejecución en serie.
El comando termina con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida de fallo.
Las ejecuciones en vivo reenvían las entradas de autenticación de QA compatibles que son prácticas para el
invitado: claves de proveedor basadas en entorno, la ruta de configuración del proveedor en vivo de QA y
`CODEX_HOME` cuando está presente. Mantén `--output-dir` bajo la raíz del repositorio para que el invitado
pueda escribir de vuelta a través del espacio de trabajo montado.

## Semillas respaldadas por el repositorio

Los recursos semilla viven en `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Estos están intencionalmente en git para que el plan de QA sea visible tanto para humanos como para el
agente.

`qa-lab` debe seguir siendo un ejecutor genérico de Markdown. Cada archivo Markdown de escenario
es la fuente de verdad para una ejecución de prueba y debe definir:

- metadatos del escenario
- metadatos opcionales de categoría, capacidad, línea y riesgo
- referencias de documentación y código
- requisitos opcionales de Plugin
- parche opcional de configuración de gateway
- el `qa-flow` ejecutable

La superficie de entorno de ejecución reutilizable que respalda `qa-flow` puede seguir siendo genérica
y transversal. Por ejemplo, los escenarios Markdown pueden combinar ayudantes del lado del transporte
con ayudantes del lado del navegador que controlan la Control UI integrada a través del
seam `browser.request` de Gateway sin añadir un ejecutor de casos especiales.

Los archivos de escenario deben agruparse por capacidad del producto en lugar de por carpeta
del árbol de código fuente. Mantén estables los IDs de escenario cuando se muevan archivos; usa `docsRefs` y `codeRefs`
para la trazabilidad de implementación.

La lista base debe seguir siendo lo suficientemente amplia como para cubrir:

- chat de MD y de canal
- comportamiento de hilos
- ciclo de vida de acciones de mensaje
- devoluciones de llamada de Cron
- recuperación de memoria
- cambio de modelo
- transferencia a subagente
- lectura de repositorio y lectura de documentación
- una tarea pequeña de compilación como Lobster Invaders

## Líneas mock de proveedor

`qa suite` tiene dos líneas mock de proveedor locales:

- `mock-openai` es el mock de OpenClaw consciente del escenario. Sigue siendo la
  línea mock determinista predeterminada para QA respaldado por repositorio y controles de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo,
  fixtures, grabación/reproducción y caos. Es aditivo y no reemplaza al despachador de escenarios `mock-openai`.

La implementación de la línea de proveedor vive en `extensions/qa-lab/src/providers/`.
Cada proveedor es propietario de sus valores predeterminados, el inicio de su servidor local, la configuración
del modelo de gateway, las necesidades de preparación de perfiles de autenticación y los indicadores de capacidad en vivo/mock. El código compartido de suite y gateway debe enrutar a través del registro de proveedores en lugar de ramificarse según los nombres de proveedor.

## Adaptadores de transporte

`qa-lab` es propietario de un seam de transporte genérico para escenarios Markdown de QA.
`qa-channel` es el primer adaptador en ese seam, pero el objetivo del diseño es más amplio:
canales futuros, reales o sintéticos, deben conectarse al mismo ejecutor de suite
en lugar de añadir un ejecutor de QA específico de transporte.

A nivel de arquitectura, la división es:

- `qa-lab` es propietario de la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos y los informes.
- el adaptador de transporte es propietario de la configuración de gateway, disponibilidad, observación de entrada y salida, acciones de transporte y estado de transporte normalizado.
- los archivos Markdown de escenario bajo `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie reutilizable del entorno de ejecución que los ejecuta.

La guía de adopción orientada a mantenedores para nuevos adaptadores de canal vive en
[Testing](/es/help/testing#adding-a-channel-to-qa).

## Informes

`qa-lab` exporta un informe de protocolo en Markdown a partir de la cronología observada del bus.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué siguió bloqueado
- Qué escenarios de seguimiento merece la pena añadir

Para comprobaciones de carácter y estilo, ejecuta el mismo escenario en varias referencias de modelo en vivo
y escribe un informe en Markdown evaluado:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
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

El comando ejecuta procesos hijo locales del gateway de QA, no Docker. Los escenarios de evaluación de carácter
deben establecer la personalidad mediante `SOUL.md` y luego ejecutar turnos ordinarios de usuario
como chat, ayuda sobre el espacio de trabajo y pequeñas tareas sobre archivos. No se debe decir al
modelo candidato que está siendo evaluado. El comando conserva cada transcripción completa,
registra estadísticas básicas de ejecución y luego pide a los modelos juez en modo rápido con
razonamiento `xhigh`, donde sea compatible, que clasifiquen las ejecuciones por naturalidad, estilo y humor.
Usa `--blind-judge-models` al comparar proveedores: el prompt del juez sigue recibiendo
cada transcripción y estado de ejecución, pero las referencias candidatas se reemplazan por
etiquetas neutrales como `candidate-01`; el informe vuelve a asignar las clasificaciones a las referencias reales después
del análisis.

Las ejecuciones candidatas usan por defecto thinking `high`, con `medium` para GPT-5.4 y `xhigh`
para referencias de evaluación antiguas de OpenAI que lo admiten. Sobrescribe un candidato específico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` sigue configurando un respaldo global, y la forma antigua `--model-thinking <provider/model=level>` se conserva por compatibilidad.
Las referencias candidatas de OpenAI usan por defecto el modo rápido para aprovechar el procesamiento prioritario donde
el proveedor lo admita. Añade `,fast`, `,no-fast` o `,fast=false` inline cuando un
candidato o juez concreto necesite una sobrescritura. Pasa `--fast` solo cuando quieras
forzar el modo rápido para todos los modelos candidatos. Las duraciones de candidatos y jueces
se registran en el informe para análisis comparativo, pero los prompts de los jueces indican explícitamente
que no clasifiquen por velocidad.
Tanto las ejecuciones de modelos candidatos como las de jueces usan por defecto una concurrencia de 16. Reduce
`--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión del gateway local
hagan que una ejecución sea demasiado ruidosa.
Cuando no se pasa ningún `--model` candidato, la evaluación de carácter usa por defecto
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y
`google/gemini-3.1-pro-preview` cuando no se pasa `--model`.
Cuando no se pasa `--judge-model`, los jueces usan por defecto
`openai/gpt-5.4,thinking=xhigh,fast` y
`anthropic/claude-opus-4-6,thinking=high`.

## Documentación relacionada

- [Testing](/es/help/testing)
- [QA Channel](/es/channels/qa-channel)
- [Dashboard](/es/web/dashboard)
