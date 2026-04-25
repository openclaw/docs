---
read_when:
    - Ampliación de qa-lab o qa-channel
    - Adición de escenarios de QA respaldados por el repositorio
    - Creación de automatización de QA de mayor realismo alrededor del panel del Gateway
summary: Estructura de la automatización privada de QA para qa-lab, qa-channel, escenarios preconfigurados e informes de protocolo
title: Automatización E2E de QA
x-i18n:
    generated_at: "2026-04-25T18:17:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: be2cfc97a33519e0c4263dc7da356136b10ddcbeef436ab821e645688b6b2cfc
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
- `qa/`: recursos semilla respaldados por el repositorio para la tarea de inicio y los
  escenarios base de QA.

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel del Gateway (Control UI) con el agente.
- Derecha: QA Lab, que muestra la transcripción estilo Slack y el plan del escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso construye el sitio de QA, inicia la vía del gateway respaldada por Docker y expone la
página de QA Lab donde un operador o un bucle de automatización puede dar al agente una
misión de QA, observar el comportamiento real del canal y registrar qué funcionó, qué falló o
qué siguió bloqueado.

Para una iteración más rápida de la interfaz de QA Lab sin reconstruir la imagen de Docker cada vez,
inicia la pila con un paquete de QA Lab montado mediante bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios de Docker sobre una imagen preconstruida y monta mediante bind mount
`extensions/qa-lab/web/dist` dentro del contenedor `qa-lab`. `qa:lab:watch`
reconstruye ese paquete cuando hay cambios, y el navegador se recarga automáticamente cuando cambia el hash de recursos de QA Lab.

Para una vía de humo de Matrix con transporte real, ejecuta:

```bash
pnpm openclaw qa matrix
```

Esa vía aprovisiona un homeserver Tuwunel desechable en Docker, registra usuarios temporales de
driver, SUT y observador, crea una sala privada y luego ejecuta
el plugin real de Matrix dentro de un gateway hijo de QA. La vía de transporte en vivo mantiene
la configuración hija limitada al transporte bajo prueba, por lo que Matrix se ejecuta sin
`qa-channel` en la configuración hija. Escribe los artefactos de informe estructurado y
un registro combinado de stdout/stderr en el directorio de salida de Matrix QA seleccionado. Para
capturar también la salida de compilación/lanzamiento externa de `scripts/run-node.mjs`, establece
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` en un archivo de registro local al repositorio.
El progreso de Matrix se imprime de forma predeterminada. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` limita
la ejecución completa, y `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` limita la limpieza para que un
desmontaje de Docker bloqueado informe el comando exacto de recuperación en lugar de quedarse colgado.

Para una vía de humo de Telegram con transporte real, ejecuta:

```bash
pnpm openclaw qa telegram
```

Esa vía apunta a un grupo privado real de Telegram en lugar de aprovisionar un servidor
desechable. Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, además de dos bots distintos en el mismo
grupo privado. El bot SUT debe tener un nombre de usuario de Telegram, y la observación entre bots
funciona mejor cuando ambos bots tienen habilitado el modo de comunicación bot a bot
en `@BotFather`.
El comando termina con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida de fallo.
El informe y el resumen de Telegram incluyen el RTT por respuesta desde la solicitud de envío
del mensaje del driver hasta la respuesta observada del SUT, empezando por el canario.

Antes de usar credenciales en vivo agrupadas, ejecuta:

```bash
pnpm openclaw qa credentials doctor
```

El doctor comprueba el entorno del broker Convex, valida la configuración de endpoints y verifica
la accesibilidad de admin/list cuando está presente el secreto del mantenedor. Solo informa
el estado de establecido/faltante de los secretos.

Para una vía de humo de Discord con transporte real, ejecuta:

```bash
pnpm openclaw qa discord
```

Esa vía apunta a un canal real de guild privado de Discord con dos bots: un bot driver
controlado por el arnés y un bot SUT iniciado por el gateway hijo de OpenClaw a través
del plugin integrado de Discord. Requiere
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
y `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` al usar credenciales por entorno.
La vía verifica el manejo de menciones del canal y comprueba que el bot SUT haya
registrado el comando nativo `/help` con Discord.
El comando termina con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida de fallo.

Las vías de transporte en vivo ahora comparten un contrato más pequeño en lugar de que cada una invente
su propia forma de lista de escenarios:

`qa-channel` sigue siendo la suite amplia de comportamiento sintético del producto y no forma parte
de la matriz de cobertura de transporte en vivo.

| Vía      | Canario | Filtrado por mención | Bloqueo por allowlist | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento en hilo | Aislamiento de hilo | Observación de reacciones | Comando help | Registro de comando nativo |
| --------- | ------- | -------------------- | --------------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------- | ------------ | -------------------------- |
| Matrix    | x       | x                    | x                     | x                           | x                         | x                   | x                   | x                         |              |                            |
| Telegram  | x       | x                    |                       |                             |                           |                     |                     |                           | x            |                            |
| Discord   | x       | x                    |                       |                             |                           |                     |                     |                           |              | x                          |

Esto mantiene `qa-channel` como la suite amplia de comportamiento del producto, mientras que Matrix,
Telegram y futuros transportes en vivo comparten una lista explícita de comprobación de contrato de transporte.

Para una vía de VM Linux desechable sin incorporar Docker en la ruta de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto inicia un invitado nuevo de Multipass, instala dependencias, construye OpenClaw
dentro del invitado, ejecuta `qa suite` y luego copia el informe y el resumen normales de QA
de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de suite del host y de Multipass ejecutan varios escenarios seleccionados en paralelo
con workers de gateway aislados de forma predeterminada. `qa-channel` usa por defecto una concurrencia de
4, limitada por el recuento de escenarios seleccionado. Usa `--concurrency <count>` para ajustar
el número de workers, o `--concurrency 1` para ejecución en serie.
El comando termina con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida de fallo.
Las ejecuciones en vivo reenvían las entradas de autenticación de QA compatibles que resultan prácticas para el
invitado: claves de proveedor basadas en entorno, la ruta de configuración del proveedor en vivo de QA y
`CODEX_HOME` cuando está presente. Mantén `--output-dir` bajo la raíz del repositorio para que el invitado
pueda escribir de vuelta a través del espacio de trabajo montado.

## Semillas respaldadas por el repositorio

Los recursos semilla viven en `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Se mantienen intencionalmente en git para que el plan de QA sea visible tanto para humanos como para el
agente.

`qa-lab` debe seguir siendo un ejecutor genérico de Markdown. Cada archivo Markdown de escenario es
la fuente de verdad para una ejecución de prueba y debe definir:

- metadatos del escenario
- metadatos opcionales de categoría, capacidad, vía y riesgo
- referencias de documentación y código
- requisitos opcionales de plugin
- parche opcional de configuración del gateway
- el `qa-flow` ejecutable

La superficie de tiempo de ejecución reutilizable que respalda `qa-flow` puede seguir siendo genérica
y transversal. Por ejemplo, los escenarios Markdown pueden combinar ayudantes del lado del transporte
con ayudantes del lado del navegador que controlan la Control UI integrada mediante la
interfaz `browser.request` del Gateway sin añadir un ejecutor de caso especial.

Los archivos de escenario deben agruparse por capacidad del producto en lugar de por carpeta
del árbol de código fuente. Mantén estables los ID de escenario cuando los archivos se muevan; usa `docsRefs` y `codeRefs`
para la trazabilidad de la implementación.

La lista base debe seguir siendo lo bastante amplia como para cubrir:

- chat por MD y por canal
- comportamiento de hilos
- ciclo de vida de acciones sobre mensajes
- callbacks de Cron
- recuperación de memoria
- cambio de modelo
- traspaso a subagente
- lectura del repositorio y de la documentación
- una pequeña tarea de compilación, como Lobster Invaders

## Vías mock de proveedor

`qa suite` tiene dos vías locales mock de proveedor:

- `mock-openai` es el mock de OpenClaw consciente del escenario. Sigue siendo la
  vía mock determinista predeterminada para QA respaldado por el repositorio y puertas de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo,
  fixtures, grabación/reproducción y caos. Es aditivo y no sustituye al despachador de escenarios `mock-openai`.

La implementación de las vías de proveedor vive en `extensions/qa-lab/src/providers/`.
Cada proveedor es dueño de sus valores predeterminados, del inicio del servidor local, de la configuración de modelos del gateway,
de las necesidades de preparación del perfil de autenticación y de las marcas de capacidad en vivo/mock. El código compartido
de la suite y del gateway debe encaminarse a través del registro de proveedores en lugar de ramificarse según
los nombres de proveedor.

## Adaptadores de transporte

`qa-lab` es dueño de una interfaz genérica de transporte para escenarios Markdown de QA.
`qa-channel` es el primer adaptador sobre esa interfaz, pero el objetivo del diseño es más amplio:
futuros canales reales o sintéticos deben integrarse en el mismo ejecutor de suite en lugar de añadir
un ejecutor de QA específico de transporte.

A nivel de arquitectura, la división es:

- `qa-lab` es dueño de la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos y los informes.
- el adaptador de transporte es dueño de la configuración del gateway, la disponibilidad, la observación de entrada y salida, las acciones de transporte y el estado de transporte normalizado.
- los archivos Markdown de escenario bajo `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie de tiempo de ejecución reutilizable que los ejecuta.

La guía de adopción orientada a mantenedores para nuevos adaptadores de canal se encuentra en
[Pruebas](/es/help/testing#adding-a-channel-to-qa).

## Informes

`qa-lab` exporta un informe de protocolo en Markdown a partir de la línea temporal observada del bus.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué siguió bloqueado
- Qué escenarios de seguimiento merece la pena añadir

Para comprobaciones de carácter y estilo, ejecuta el mismo escenario con varias referencias de modelo en vivo
y escribe un informe evaluado en Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

El comando ejecuta procesos hijo locales del gateway de QA, no Docker. Los
escenarios de evaluación de carácter deben establecer la personalidad mediante `SOUL.md`, luego ejecutar turnos normales de usuario
como chat, ayuda del espacio de trabajo y pequeñas tareas sobre archivos. No se le
debe decir al modelo candidato que está siendo evaluado. El comando conserva cada transcripción
completa, registra estadísticas básicas de ejecución y luego pide a los modelos juez en modo fast con
razonamiento `xhigh`, cuando sea compatible, que clasifiquen las ejecuciones por naturalidad, vibra y humor.
Usa `--blind-judge-models` al comparar proveedores: el prompt del juez sigue recibiendo
cada transcripción y estado de ejecución, pero las referencias candidatas se sustituyen por
etiquetas neutras como `candidate-01`; el informe vuelve a mapear las clasificaciones a las referencias reales después del
análisis.
Las ejecuciones candidatas usan por defecto razonamiento `high`, con `medium` para GPT-5.5 y `xhigh`
para referencias de evaluación más antiguas de OpenAI que lo admiten. Anula un candidato específico en línea con
`--model provider/model,thinking=<level>`. `--thinking <level>` sigue estableciendo un
respaldo global, y la forma anterior `--model-thinking <provider/model=level>` se
mantiene por compatibilidad.
Las referencias candidatas de OpenAI usan por defecto el modo fast para que se use el procesamiento
prioritario cuando el proveedor lo admita. Añade `,fast`, `,no-fast` o `,fast=false` en línea cuando
un solo candidato o juez necesite una anulación. Pasa `--fast` solo cuando quieras
forzar el modo fast para todos los modelos candidatos. Las duraciones de candidato y juez se
registran en el informe para análisis comparativos, pero los prompts del juez indican explícitamente
que no deben clasificar por velocidad.
Las ejecuciones de modelos candidatos y jueces usan ambas por defecto una concurrencia de 16. Reduce
`--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión del gateway local
hagan que una ejecución sea demasiado ruidosa.
Cuando no se pasa ningún `--model` candidato, la evaluación de carácter usa por defecto
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y
`google/gemini-3.1-pro-preview` cuando no se pasa ningún `--model`.
Cuando no se pasa ningún `--judge-model`, los jueces usan por defecto
`openai/gpt-5.5,thinking=xhigh,fast` y
`anthropic/claude-opus-4-6,thinking=high`.

## Documentación relacionada

- [Pruebas](/es/help/testing)
- [QA Channel](/es/channels/qa-channel)
- [Panel](/es/web/dashboard)
