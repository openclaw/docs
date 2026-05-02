---
read_when:
    - Comprender cómo encaja la pila de QA
    - Extender qa-lab, qa-channel o un adaptador de transporte
    - Agregar escenarios de QA respaldados por el repositorio
    - Creación de automatización de QA más realista en torno al panel de Gateway
summary: 'Descripción general de la pila de QA: qa-lab, qa-channel, escenarios respaldados por repositorio, rutas de transporte en vivo, adaptadores de transporte e informes.'
title: Descripción general de control de calidad
x-i18n:
    generated_at: "2026-05-02T20:46:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1cba04d6624bb1e0fc54105bd836f16ada0ba1cc1de9ab7065b90220e23bdf
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pila privada de QA está pensada para ejercitar OpenClaw de una forma más realista,
con forma de canal, de lo que puede hacerlo una sola prueba unitaria.

Piezas actuales:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de DM,
  canal, hilo, reacción, edición y eliminación.
- `extensions/qa-lab`: UI de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe Markdown.
- `extensions/qa-matrix`, futuros plugins ejecutores: adaptadores de transporte en vivo que
  controlan un canal real dentro de un Gateway de QA hijo.
- `qa/`: recursos semilla respaldados por el repositorio para la tarea de inicio y los
  escenarios de QA de referencia.

## Superficie de comandos

Cada flujo de QA se ejecuta bajo `pnpm openclaw qa <subcommand>`. Muchos tienen alias de script `pnpm qa:*`;
ambas formas son compatibles.

| Comando                                             | Propósito                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | Autocomprobación de QA integrada; escribe un informe Markdown.                                                                                                           |
| `qa suite`                                          | Ejecuta escenarios respaldados por el repositorio contra el carril del Gateway de QA. Alias: `pnpm openclaw qa suite --runner multipass` para una VM Linux desechable.   |
| `qa coverage`                                       | Imprime el inventario de cobertura de escenarios en markdown (`--json` para salida de máquina).                                                                          |
| `qa parity-report`                                  | Compara dos archivos `qa-suite-summary.json` y escribe el informe de paridad agéntica.                                                                                   |
| `qa character-eval`                                 | Ejecuta el escenario de QA de personaje en varios modelos en vivo con un informe evaluado. Consulta [Informes](#reporting).                                              |
| `qa manual`                                         | Ejecuta un prompt puntual contra el carril de proveedor/modelo seleccionado.                                                                                             |
| `qa ui`                                             | Inicia la UI de depuración de QA y el bus de QA local (alias: `pnpm qa:lab:ui`).                                                                                         |
| `qa docker-build-image`                             | Construye la imagen Docker de QA prehorneada.                                                                                                                           |
| `qa docker-scaffold`                                | Escribe un andamiaje de docker-compose para el panel de QA + carril del Gateway.                                                                                         |
| `qa up`                                             | Construye el sitio de QA, inicia la pila respaldada por Docker, imprime la URL (alias: `pnpm qa:lab:up`; la variante `:fast` agrega `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Inicia solo el servidor proveedor AIMock.                                                                                                                               |
| `qa mock-openai`                                    | Inicia solo el servidor proveedor `mock-openai` consciente de escenarios.                                                                                                |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestiona el pool compartido de credenciales de Convex.                                                                                                                  |
| `qa matrix`                                         | Carril de transporte en vivo contra un homeserver Tuwunel desechable. Consulta [QA de Matrix](/es/concepts/qa-matrix).                                                     |
| `qa telegram`                                       | Carril de transporte en vivo contra un grupo privado real de Telegram.                                                                                                   |
| `qa discord`                                        | Carril de transporte en vivo contra un canal de servidor privado real de Discord.                                                                                        |

## Flujo del operador

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel del Gateway (Control UI) con el agente.
- Derecha: QA Lab, que muestra la transcripción similar a Slack y el plan de escenarios.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso construye el sitio de QA, inicia el carril del Gateway respaldado por Docker y expone la
página de QA Lab donde un operador o bucle de automatización puede darle al agente una misión
de QA, observar el comportamiento real del canal y registrar qué funcionó, falló o
quedó bloqueado.

Para iterar más rápido en la UI de QA Lab sin reconstruir la imagen Docker cada vez,
inicia la pila con un paquete de QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios Docker en una imagen preconstruida y monta por bind
`extensions/qa-lab/web/dist` en el contenedor `qa-lab`. `qa:lab:watch`
reconstruye ese paquete al cambiar, y el navegador se recarga automáticamente cuando cambia el
hash de recursos de QA Lab.

Para una prueba rápida local de trazas de OpenTelemetry, ejecuta:

```bash
pnpm qa:otel:smoke
```

Ese script inicia un receptor local de trazas OTLP/HTTP, ejecuta el escenario de QA
`otel-trace-smoke` con el plugin `diagnostics-otel` habilitado, luego
decodifica los spans protobuf exportados y afirma la forma crítica para el lanzamiento:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` y `openclaw.message.delivery` deben estar presentes;
las llamadas al modelo no deben exportar `StreamAbandoned` en turnos exitosos; los ID de diagnóstico sin procesar y los
atributos `openclaw.content.*` deben quedar fuera de la traza. Escribe
`otel-smoke-summary.json` junto a los artefactos de la suite de QA.

La QA de observabilidad permanece solo para checkout de código fuente. El tarball de npm omite
intencionalmente QA Lab, por lo que los carriles de lanzamiento Docker de paquetes no ejecutan comandos `qa`. Usa
`pnpm qa:otel:smoke` desde un checkout de código fuente construido al cambiar la instrumentación
de diagnóstico.

Para un carril rápido de Matrix con transporte real, ejecuta:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La referencia completa de CLI, el catálogo de perfiles/escenarios, las variables de entorno y el diseño de artefactos de este carril viven en [QA de Matrix](/es/concepts/qa-matrix). En resumen: aprovisiona un homeserver Tuwunel desechable en Docker, registra usuarios temporales de controlador/SUT/observador, ejecuta el plugin real de Matrix dentro de un Gateway de QA hijo acotado a ese transporte (sin `qa-channel`), luego escribe un informe Markdown, resumen JSON, artefacto de eventos observados y registro de salida combinado bajo `.artifacts/qa-e2e/matrix-<timestamp>/`.

Para carriles rápidos de Telegram y Discord con transporte real:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Ambos apuntan a un canal real preexistente con dos bots (controlador + SUT). Las variables de entorno requeridas, listas de escenarios, artefactos de salida y el pool de credenciales de Convex están documentados en la [referencia de QA de Telegram y Discord](#telegram-and-discord-qa-reference) más abajo.

Antes de usar credenciales en vivo agrupadas, ejecuta:

```bash
pnpm openclaw qa credentials doctor
```

El doctor comprueba el entorno del broker de Convex, valida la configuración de endpoints y verifica la accesibilidad de administración/listado cuando el secreto de mantenedor está presente. Solo informa el estado establecido/faltante de los secretos.

## Cobertura de transporte en vivo

Los carriles de transporte en vivo comparten un contrato en lugar de que cada uno invente su propia forma de lista de escenarios. `qa-channel` es la suite sintética amplia de comportamiento del producto y no forma parte de la matriz de cobertura de transporte en vivo.

| Carril   | Canary | Control de menciones | Bot a bot | Bloqueo de lista de permitidos | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento de hilo | Aislamiento de hilo | Observación de reacciones | Comando de ayuda | Registro de comandos nativos |
| -------- | ------ | -------------------- | --------- | ------------------------------ | --------------------------- | ------------------------- | ------------------- | ------------------- | -------------------------- | ---------------- | ----------------------------- |
| Matrix   | x      | x                    | x         | x                              | x                           | x                         | x                   | x                   | x                          |                  |                               |
| Telegram | x      | x                    | x         |                                |                             |                           |                     |                     |                            | x                |                               |
| Discord  | x      | x                    | x         |                                |                             |                           |                     |                     |                            |                  | x                             |

Esto mantiene `qa-channel` como la suite amplia de comportamiento del producto mientras Matrix,
Telegram y futuros transportes en vivo comparten una lista de comprobación explícita
de contrato de transporte.

Para un carril de VM Linux desechable sin incorporar Docker a la ruta de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto inicia un invitado Multipass nuevo, instala dependencias, construye OpenClaw
dentro del invitado, ejecuta `qa suite` y luego copia el informe de QA normal y el
resumen de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de suite en host y Multipass ejecutan varios escenarios seleccionados en paralelo
con trabajadores de Gateway aislados de forma predeterminada. `qa-channel` usa concurrencia
4 de forma predeterminada, limitada por el recuento de escenarios seleccionado. Usa `--concurrency <count>` para ajustar
el número de trabajadores, o `--concurrency 1` para ejecución serial.
El comando sale con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida fallido.
Las ejecuciones en vivo reenvían las entradas de autenticación de QA compatibles que son prácticas para el
invitado: claves de proveedor basadas en entorno, la ruta de configuración del proveedor en vivo de QA y
`CODEX_HOME` cuando esté presente. Mantén `--output-dir` bajo la raíz del repositorio para que el invitado
pueda escribir de vuelta a través del espacio de trabajo montado.

## Referencia de QA de Telegram y Discord

Matrix tiene una [página dedicada](/es/concepts/qa-matrix) por su cantidad de escenarios y el aprovisionamiento de homeserver respaldado por Docker. Telegram y Discord son más pequeños: un puñado de escenarios cada uno, sin sistema de perfiles, contra canales reales preexistentes, por lo que su referencia vive aquí.

### Flags de CLI compartidos

Ambos carriles se registran mediante `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` y aceptan los mismos flags:

| Opción                                | Predeterminado                                           | Descripción                                                                                                                     |
| ------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                        | Ejecuta solo este escenario. Repetible.                                                                                         |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Dónde se escriben los informes/resumen/mensajes observados y el registro de salida. Las rutas relativas se resuelven respecto a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                          | Raíz del repositorio al invocar desde un cwd neutro.                                                                             |
| `--sut-account <id>`                  | `sut`                                                    | Id de cuenta temporal dentro de la configuración del Gateway de QA.                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                          | `mock-openai` o `live-frontier` (`live-openai` heredado sigue funcionando).                                                      |
| `--model <ref>` / `--alt-model <ref>` | valor predeterminado del proveedor                       | Refs del modelo principal/alternativo.                                                                                          |
| `--fast`                              | desactivado                                              | Modo rápido del proveedor cuando es compatible.                                                                                  |
| `--credential-source <env\|convex>`   | `env`                                                    | Consulta [pool de credenciales de Convex](#convex-credential-pool).                                                             |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, `maintainer` en caso contrario               | Rol usado cuando `--credential-source convex`.                                                                                   |

Ambos terminan con código distinto de cero en cualquier escenario fallido. `--allow-failures` escribe artefactos sin establecer un código de salida fallido.

### QA de Telegram

```bash
pnpm openclaw qa telegram
```

Apunta a un grupo privado real de Telegram con dos bots distintos (driver + SUT). El bot SUT debe tener un nombre de usuario de Telegram; la observación bot a bot funciona mejor cuando ambos bots tienen **Bot-to-Bot Communication Mode** habilitado en `@BotFather`.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id numérico del chat (cadena).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en los artefactos de mensajes observados (el valor predeterminado los redacta).

Escenarios (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Artefactos de salida:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — incluye el RTT por respuesta (envío del driver → respuesta SUT observada) empezando por el canario.
- `telegram-qa-observed-messages.json` — cuerpos redactados salvo que `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA de Discord

```bash
pnpm openclaw qa discord
```

Apunta a un canal de guild privado real de Discord con dos bots: un bot driver controlado por el arnés y un bot SUT iniciado por el Gateway hijo de OpenClaw mediante el plugin incluido de Discord. Verifica el manejo de menciones del canal y que el bot SUT haya registrado el comando nativo `/help` con Discord.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — debe coincidir con el id de usuario del bot SUT devuelto por Discord (de lo contrario, el carril falla rápido).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en los artefactos de mensajes observados.

Escenarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Artefactos de salida:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — cuerpos redactados salvo que `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.

### Pool de credenciales de Convex

Tanto los carriles de Telegram como los de Discord pueden arrendar credenciales desde un pool compartido de Convex en lugar de leer las variables de entorno anteriores. Pasa `--credential-source convex` (o establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab adquiere un arrendamiento exclusivo, le envía heartbeats durante la ejecución y lo libera al apagarse. Los tipos de pool son `"telegram"` y `"discord"`.

Formas de payload que el broker valida en `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` debe ser una cadena de id de chat numérico.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Las variables de entorno operativas y el contrato del endpoint del broker de Convex están en [Testing → Credenciales compartidas de Telegram mediante Convex](/es/help/testing#shared-telegram-credentials-via-convex-v1) (el nombre de la sección es anterior al soporte de Discord; la semántica del broker es idéntica para ambos tipos).

## Semillas respaldadas por el repositorio

Los recursos semilla están en `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Estos están intencionadamente en git para que el plan de QA sea visible tanto para humanos como para el agente.

`qa-lab` debe seguir siendo un ejecutor de markdown genérico. Cada archivo markdown de escenario es la fuente de verdad de una ejecución de prueba y debe definir:

- metadatos del escenario
- metadatos opcionales de categoría, capacidad, carril y riesgo
- refs de documentación y código
- requisitos opcionales de plugin
- parche opcional de configuración del Gateway
- el `qa-flow` ejecutable

La superficie de runtime reutilizable que respalda `qa-flow` puede seguir siendo genérica y transversal. Por ejemplo, los escenarios markdown pueden combinar helpers del lado del transporte con helpers del lado del navegador que controlan la Control UI incrustada mediante la costura `browser.request` del Gateway sin agregar un ejecutor de caso especial.

Los archivos de escenario deben agruparse por capacidad de producto, no por carpeta del árbol fuente. Mantén estables los IDs de escenario cuando los archivos se muevan; usa `docsRefs` y `codeRefs` para la trazabilidad de implementación.

La lista base debe seguir siendo lo bastante amplia como para cubrir:

- chat de DM y canal
- comportamiento de hilos
- ciclo de vida de acciones de mensaje
- callbacks de cron
- recuperación de memoria
- cambio de modelo
- traspaso a subagente
- lectura de repositorio y lectura de documentación
- una tarea pequeña de build como Lobster Invaders

## Carriles de mock de proveedores

`qa suite` tiene dos carriles locales de mock de proveedores:

- `mock-openai` es el mock de OpenClaw consciente de escenarios. Sigue siendo el carril de mock determinista predeterminado para la QA respaldada por el repositorio y las puertas de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo, fixture, grabación/reproducción y caos. Es aditivo y no reemplaza al despachador de escenarios `mock-openai`.

La implementación de carriles de proveedor vive bajo `extensions/qa-lab/src/providers/`. Cada proveedor es dueño de sus valores predeterminados, arranque de servidor local, configuración de modelo del Gateway, necesidades de preparación de auth-profile y marcas de capacidad live/mock. El código compartido de suite y Gateway debe enrutar mediante el registro de proveedores en lugar de ramificar por nombres de proveedor.

## Adaptadores de transporte

`qa-lab` posee una costura de transporte genérica para escenarios de QA en markdown. `qa-channel` es el primer adaptador en esa costura, pero el objetivo de diseño es más amplio: los canales reales o sintéticos futuros deben conectarse al mismo ejecutor de suite en lugar de agregar un ejecutor de QA específico de transporte.

En el nivel de arquitectura, la división es:

- `qa-lab` posee la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos y los informes.
- El adaptador de transporte posee la configuración del Gateway, la preparación, la observación entrante y saliente, las acciones de transporte y el estado de transporte normalizado.
- Los archivos de escenario markdown bajo `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie de runtime reutilizable que los ejecuta.

### Agregar un canal

Agregar un canal al sistema de QA en markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejercite el contrato del canal.

No agregues una nueva raíz de comando de QA de nivel superior cuando el host compartido `qa-lab` pueda poseer el flujo.

`qa-lab` posee la mecánica del host compartido:

- la raíz de comando `openclaw qa`
- arranque y desmontaje de suite
- concurrencia de workers
- escritura de artefactos
- generación de informes
- ejecución de escenarios
- aliases de compatibilidad para escenarios antiguos de `qa-channel`

Los plugins de ejecución poseen el contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura el Gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan eventos entrantes
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado de transporte normalizado
- cómo se ejecutan las acciones respaldadas por transporte
- cómo se maneja el restablecimiento o limpieza específicos del transporte

El mínimo de adopción para un canal nuevo:

1. Mantén `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementa el runner de transporte en la costura del host compartido `qa-lab`.
3. Mantén la mecánica específica del transporte dentro del plugin runner o del arnés del canal.
4. Monta el runner como `openclaw qa <runner>` en lugar de registrar un comando raíz competidor. Los plugins runner deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un arreglo `qaRunnerCliRegistrations` coincidente desde `runtime-api.ts`. Mantén `runtime-api.ts` ligero; la CLI lazy y la ejecución del runner deben permanecer detrás de entrypoints separados.
5. Crea o adapta escenarios markdown bajo los directorios temáticos `qa/scenarios/`.
6. Usa los helpers genéricos de escenario para escenarios nuevos.
7. Mantén funcionando los aliases de compatibilidad existentes salvo que el repositorio esté haciendo una migración intencional.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una vez en `qa-lab`, ponlo en `qa-lab`.
- Si el comportamiento depende de un transporte de canal, mantenlo en ese plugin runner o arnés de plugin.
- Si un escenario necesita una capacidad nueva que pueda usar más de un canal, agrega un helper genérico en lugar de una rama específica de canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario específico del transporte y hazlo explícito en el contrato del escenario.

### Nombres de helpers de escenario

Helpers genéricos preferidos para escenarios nuevos:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Los aliases de compatibilidad siguen disponibles para escenarios existentes — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — pero la creación de escenarios nuevos debe usar los nombres genéricos. Los aliases existen para evitar una migración de un solo paso, no como el modelo de ahora en adelante.

## Informes

`qa-lab` exporta un informe de protocolo en Markdown desde la línea de tiempo del bus observado.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué siguió bloqueado
- Qué escenarios de seguimiento vale la pena agregar

Para ver el inventario de escenarios disponibles, útil al dimensionar trabajo de seguimiento o conectar un nuevo transporte, ejecuta `pnpm openclaw qa coverage` (añade `--json` para obtener salida legible por máquina).

Para comprobaciones de personaje y estilo, ejecuta el mismo escenario en varias
referencias de modelos en vivo y escribe un informe Markdown evaluado:

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

El comando ejecuta procesos secundarios locales del Gateway de QA, no Docker. Los
escenarios de evaluación de personaje deben establecer la persona mediante `SOUL.md`
y luego ejecutar turnos de usuario ordinarios, como chat, ayuda con el workspace y
pequeñas tareas de archivos. Al modelo candidato no se le debe decir que está
siendo evaluado. El comando conserva cada transcripción completa, registra
estadísticas básicas de la ejecución y luego pide a los modelos jueces en modo rápido
con razonamiento `xhigh`, donde esté disponible, que clasifiquen las ejecuciones por
naturalidad, tono y humor.
Usa `--blind-judge-models` al comparar proveedores: el prompt del juez sigue
recibiendo cada transcripción y estado de ejecución, pero las referencias candidatas
se sustituyen por etiquetas neutras como `candidate-01`; el informe asigna las
clasificaciones de vuelta a las referencias reales después del análisis.
Las ejecuciones candidatas usan de forma predeterminada pensamiento `high`, con
`medium` para GPT-5.5 y `xhigh` para referencias de evaluación de OpenAI anteriores
que lo admiten. Sobrescribe un candidato específico en línea con
`--model provider/model,thinking=<level>`. `--thinking <level>` sigue definiendo una
reserva global, y la forma anterior `--model-thinking <provider/model=level>` se
mantiene por compatibilidad.
Las referencias candidatas de OpenAI usan de forma predeterminada el modo rápido, de
modo que se utiliza el procesamiento prioritario donde el proveedor lo admite.
Añade `,fast`, `,no-fast` o `,fast=false` en línea cuando un solo candidato o juez
necesite una sobrescritura. Pasa `--fast` solo cuando quieras forzar el modo rápido
para todos los modelos candidatos. Las duraciones de candidatos y jueces se registran
en el informe para el análisis de benchmarks, pero los prompts de los jueces indican
explícitamente que no clasifiquen por velocidad.
Las ejecuciones de modelos candidatos y jueces usan ambas una concurrencia
predeterminada de 16. Reduce `--concurrency` o `--judge-concurrency` cuando los
límites del proveedor o la presión sobre el Gateway local hagan que una ejecución
tenga demasiado ruido.
Cuando no se pasa ningún candidato `--model`, la evaluación de personaje usa de forma
predeterminada `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`,
`zai/glm-5.1`, `moonshot/kimi-k2.5` y
`google/gemini-3.1-pro-preview` cuando no se pasa ningún `--model`.
Cuando no se pasa ningún `--judge-model`, los jueces usan de forma predeterminada
`openai/gpt-5.5,thinking=xhigh,fast` y
`anthropic/claude-opus-4-6,thinking=high`.

## Documentos relacionados

- [QA de matriz](/es/concepts/qa-matrix)
- [Canal de QA](/es/channels/qa-channel)
- [Pruebas](/es/help/testing)
- [Panel](/es/web/dashboard)
