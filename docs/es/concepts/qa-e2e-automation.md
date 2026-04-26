---
read_when:
    - Extender qa-lab o qa-channel
    - Añadir escenarios de QA respaldados por el repositorio
    - Crear automatización de QA de mayor realismo alrededor del panel del Gateway
summary: Forma de automatización de QA privada para qa-lab, qa-channel, escenarios sembrados e informes de protocolo
title: Automatización E2E de QA
x-i18n:
    generated_at: "2026-04-26T11:27:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3803f2bc5cdf2368c3af59b412de8ef732708995a54f7771d3f6f16e8be0592b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

La pila privada de QA está pensada para ejercitar OpenClaw de una forma más realista,
con forma de canal, que la que puede ofrecer una sola prueba unitaria.

Componentes actuales:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de DM, canal, hilo,
  reacción, edición y eliminación.
- `extensions/qa-lab`: UI de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe en Markdown.
- `qa/`: recursos semilla respaldados por el repositorio para la tarea de arranque y los
  escenarios base de QA.

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel del Gateway (Control UI) con el agente.
- Derecha: QA Lab, que muestra la transcripción estilo Slack y el plan de escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso compila el sitio de QA, inicia el carril de gateway respaldado por Docker y expone la
página de QA Lab donde un operador o un bucle de automatización puede dar al agente una
misión de QA, observar el comportamiento real del canal y registrar qué funcionó, qué falló o
qué siguió bloqueado.

Para una iteración más rápida de la UI de QA Lab sin reconstruir la imagen de Docker cada vez,
inicia la pila con un paquete de QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios de Docker sobre una imagen precompilada y monta por bind
`extensions/qa-lab/web/dist` dentro del contenedor `qa-lab`. `qa:lab:watch`
recompila ese paquete cuando hay cambios, y el navegador se recarga automáticamente cuando cambia
el hash de recursos de QA Lab.

Para una prueba local de trazas de OpenTelemetry, ejecuta:

```bash
pnpm qa:otel:smoke
```

Ese script inicia un receptor local de trazas OTLP/HTTP, ejecuta el
escenario de QA `otel-trace-smoke` con el Plugin `diagnostics-otel` habilitado, luego
decodifica los spans protobuf exportados y comprueba la forma crítica para la versión:
deben estar presentes `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` y `openclaw.message.delivery`;
las llamadas al modelo no deben exportar `StreamAbandoned` en turnos correctos; los IDs de diagnóstico sin procesar y los
atributos `openclaw.content.*` deben quedar fuera de la traza. Escribe
`otel-smoke-summary.json` junto a los artefactos de la suite de QA.

Para un carril de Matrix real a nivel de transporte, ejecuta:

```bash
pnpm openclaw qa matrix
```

Ese carril aprovisiona un homeserver Tuwunel desechable en Docker, registra
usuarios temporales de controlador, SUT y observador, crea una sala privada y luego ejecuta
el Plugin real de Matrix dentro de un proceso hijo de gateway de QA. El carril de transporte en vivo mantiene
la configuración del proceso hijo limitada al transporte bajo prueba, por lo que Matrix se ejecuta sin
`qa-channel` en la configuración hija. Escribe los artefactos estructurados del informe y
un log combinado de stdout/stderr en el directorio de salida de QA de Matrix seleccionado. Para
capturar también la salida externa de compilación/lanzamiento de `scripts/run-node.mjs`, configura
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` con un archivo de log dentro del repositorio.
El progreso de Matrix se imprime de forma predeterminada. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` limita
la ejecución completa, y `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` limita la limpieza para que un
desmontaje de Docker bloqueado informe el comando exacto de recuperación en lugar de quedarse colgado.

Para un carril de Telegram real a nivel de transporte, ejecuta:

```bash
pnpm openclaw qa telegram
```

Ese carril apunta a un grupo privado real de Telegram en lugar de aprovisionar un
servidor desechable. Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, además de dos bots distintos en el mismo
grupo privado. El bot SUT debe tener un nombre de usuario de Telegram, y la observación bot a bot
funciona mejor cuando ambos bots tienen habilitado Bot-to-Bot Communication Mode
en `@BotFather`.
El comando sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida de error.
El informe y el resumen de Telegram incluyen RTT por respuesta desde la solicitud de envío del mensaje del controlador
hasta la respuesta observada del SUT, empezando por el canario.

Antes de usar credenciales en vivo agrupadas, ejecuta:

```bash
pnpm openclaw qa credentials doctor
```

El doctor comprueba el entorno del broker de Convex, valida la configuración de endpoints
y verifica el acceso de admin/list cuando está presente el secreto del mantenedor. Solo
informa el estado de presente/ausente de los secretos.

Para un carril de Discord real a nivel de transporte, ejecuta:

```bash
pnpm openclaw qa discord
```

Ese carril apunta a un canal real de guild privado de Discord con dos bots: un
bot controlador controlado por el arnés y un bot SUT iniciado por el gateway hijo de
OpenClaw mediante el Plugin de Discord incluido. Requiere
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
y `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` cuando se usan credenciales de entorno.
El carril verifica el manejo de menciones del canal y comprueba que el bot SUT haya
registrado el comando nativo `/help` en Discord.
El comando sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida de error.

Los carriles de transporte en vivo ahora comparten un contrato más pequeño en lugar de que cada uno invente
su propia forma de lista de escenarios:

`qa-channel` sigue siendo la suite amplia de comportamiento sintético del producto y no forma parte
de la matriz de cobertura de transporte en vivo.

| Carril   | Canario | Control por menciones | Bloqueo por allowlist | Respuesta de nivel superior | Reanudar tras reinicio | Seguimiento en hilo | Aislamiento de hilo | Observación de reacciones | Comando help | Registro de comandos nativos |
| -------- | ------- | --------------------- | --------------------- | --------------------------- | ---------------------- | ------------------- | ------------------- | ------------------------- | ------------ | ---------------------------- |
| Matrix   | x       | x                     | x                     | x                           | x                      | x                   | x                   | x                         |              |                              |
| Telegram | x       | x                     |                       |                             |                        |                     |                     |                           | x            |                              |
| Discord  | x       | x                     |                       |                             |                        |                     |                     |                           |              | x                            |

Esto mantiene `qa-channel` como la suite amplia de comportamiento del producto, mientras que Matrix,
Telegram y futuros transportes en vivo comparten una lista explícita de comprobación de contrato de transporte.

Para un carril de VM Linux desechable sin introducir Docker en la ruta de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto arranca un invitado nuevo de Multipass, instala dependencias, compila OpenClaw
dentro del invitado, ejecuta `qa suite` y luego copia el informe y el resumen normales de QA de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de suite en host y en Multipass ejecutan en paralelo por defecto
varios escenarios seleccionados con workers de gateway aislados. `qa-channel` usa por defecto concurrencia
4, limitada por el número de escenarios seleccionados. Usa `--concurrency <count>` para ajustar
el número de workers, o `--concurrency 1` para ejecución en serie.
El comando sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida de error.
Las ejecuciones en vivo reenvían las entradas de autenticación de QA compatibles que son prácticas para el
invitado: claves de proveedor basadas en entorno, la ruta de configuración del proveedor en vivo de QA y
`CODEX_HOME` cuando esté presente. Mantén `--output-dir` bajo la raíz del repositorio para que el invitado
pueda escribir de vuelta a través del espacio de trabajo montado.

## Semillas respaldadas por el repositorio

Los recursos semilla viven en `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Estos están intencionadamente en git para que el plan de QA sea visible tanto para humanos como para el
agente.

`qa-lab` debe seguir siendo un ejecutor genérico de Markdown. Cada archivo Markdown de escenario es
la fuente de verdad para una ejecución de prueba y debe definir:

- metadatos del escenario
- metadatos opcionales de categoría, capacidad, carril y riesgo
- referencias de documentación y código
- requisitos opcionales de Plugin
- parche opcional de configuración del gateway
- el `qa-flow` ejecutable

La superficie de runtime reutilizable que respalda `qa-flow` puede seguir siendo genérica
y transversal. Por ejemplo, los escenarios Markdown pueden combinar helpers del lado del transporte
con helpers del lado del navegador que controlan la Control UI incrustada a través de la
interfaz `browser.request` del Gateway sin añadir un ejecutor especial para casos particulares.

Los archivos de escenario deben agruparse por capacidad del producto en lugar de por carpeta del árbol de código fuente.
Mantén estables los IDs de escenario cuando se muevan archivos; usa `docsRefs` y `codeRefs`
para la trazabilidad de implementación.

La lista base debe seguir siendo lo bastante amplia para cubrir:

- chat por DM y canal
- comportamiento de hilos
- ciclo de vida de acciones de mensajes
- callbacks de cron
- recuperación de memoria
- cambio de modelo
- transferencia a subagente
- lectura del repositorio y de la documentación
- una pequeña tarea de compilación como Lobster Invaders

## Carriles de proveedor simulado

`qa suite` tiene dos carriles locales de proveedor simulado:

- `mock-openai` es el simulado de OpenClaw consciente del escenario. Sigue siendo el
  carril simulado determinista predeterminado para QA respaldada por el repositorio y controles de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo,
  fixtures, grabación/reproducción y caos. Es aditivo y no sustituye al despachador de escenarios `mock-openai`.

La implementación del carril de proveedor vive en `extensions/qa-lab/src/providers/`.
Cada proveedor posee sus valores predeterminados, el arranque del servidor local, la configuración del modelo del gateway,
las necesidades de preparación del perfil de autenticación y las banderas de capacidad en vivo/simulada. El código compartido de suite y gateway debe enrutar a través del registro de proveedores en lugar de bifurcar por nombres de proveedor.

## Adaptadores de transporte

`qa-lab` posee una interfaz genérica de transporte para escenarios de QA en Markdown.
`qa-channel` es el primer adaptador de esa interfaz, pero el objetivo de diseño es más amplio:
los futuros canales reales o sintéticos deben conectarse al mismo ejecutor de suite en lugar de añadir
un ejecutor de QA específico de transporte.

A nivel de arquitectura, la división es:

- `qa-lab` posee la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos y los informes.
- el adaptador de transporte posee la configuración del gateway, la preparación, la observación de entrada y salida, las acciones de transporte y el estado de transporte normalizado.
- los archivos Markdown de escenario bajo `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie de runtime reutilizable que los ejecuta.

La guía de adopción para mantenedores de nuevos adaptadores de canal está en
[Pruebas](/es/help/testing#adding-a-channel-to-qa).

## Informes

`qa-lab` exporta un informe de protocolo en Markdown desde la línea temporal observada del bus.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué siguió bloqueado
- Qué escenarios de seguimiento merece la pena añadir

Para comprobaciones de carácter y estilo, ejecuta el mismo escenario con varias referencias de modelo en vivo
y escribe un informe en Markdown evaluado:

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

El comando ejecuta procesos hijo locales del gateway de QA, no Docker. Los escenarios de evaluación de carácter
deben establecer la personalidad mediante `SOUL.md` y luego ejecutar turnos normales de usuario
como chat, ayuda del espacio de trabajo y pequeñas tareas de archivo. No se debe decir
al modelo candidato que está siendo evaluado. El comando conserva cada transcripción completa,
registra estadísticas básicas de ejecución y luego pide a los modelos juez en modo rápido con
razonamiento `xhigh` cuando sea compatible que clasifiquen las ejecuciones por naturalidad, vibra y humor.
Usa `--blind-judge-models` al comparar proveedores: el prompt del juez sigue recibiendo
cada transcripción y estado de ejecución, pero las referencias candidatas se sustituyen por
etiquetas neutras como `candidate-01`; el informe vuelve a asignar las clasificaciones a las referencias reales tras el análisis.
Las ejecuciones candidatas usan por defecto razonamiento `high`, con `medium` para GPT-5.5 y `xhigh`
para referencias de evaluación antiguas de OpenAI que lo admitan. Anula un candidato específico en línea con
`--model provider/model,thinking=<level>`. `--thinking <level>` sigue estableciendo una alternativa global, y la forma antigua `--model-thinking <provider/model=level>` se mantiene por compatibilidad.
Las referencias candidatas de OpenAI usan por defecto modo rápido para que se utilice procesamiento prioritario donde
el proveedor lo admita. Añade `,fast`, `,no-fast` o `,fast=false` en línea cuando un
candidato o juez concreto necesite una anulación. Pasa `--fast` solo cuando quieras
forzar el modo rápido para todos los modelos candidatos. Las duraciones de candidatos y jueces
se registran en el informe para análisis comparativo, pero los prompts del juez indican explícitamente
que no se clasifique por velocidad.
Tanto las ejecuciones de modelos candidatos como las de jueces usan por defecto concurrencia 16. Reduce
`--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión del gateway local
hagan que una ejecución sea demasiado ruidosa.
Cuando no se pasa ningún candidato `--model`, la evaluación de carácter usa por defecto
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y
`google/gemini-3.1-pro-preview` cuando no se pasa `--model`.
Cuando no se pasa `--judge-model`, los jueces usan por defecto
`openai/gpt-5.5,thinking=xhigh,fast` y
`anthropic/claude-opus-4-6,thinking=high`.

## Documentación relacionada

- [Pruebas](/es/help/testing)
- [Canal QA](/es/channels/qa-channel)
- [Panel](/es/web/dashboard)
