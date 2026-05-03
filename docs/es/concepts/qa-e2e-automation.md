---
read_when:
    - Comprender cómo encaja el stack de QA
    - Ampliar qa-lab, qa-channel o un adaptador de transporte
    - Añadir escenarios de control de calidad respaldados por el repositorio
    - Creación de automatización de control de calidad de mayor realismo en torno al panel de Gateway
summary: 'Descripción general de la pila de QA: qa-lab, qa-channel, escenarios respaldados por el repositorio, rutas de transporte en vivo, adaptadores de transporte y generación de informes.'
title: Resumen de QA
x-i18n:
    generated_at: "2026-05-03T21:30:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La stack privada de QA está pensada para ejercitar OpenClaw de una forma más realista,
con forma de canal, que lo que permite una sola prueba unitaria.

Componentes actuales:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de DM,
  canal, hilo, reacción, edición y eliminación.
- `extensions/qa-lab`: UI de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe Markdown.
- `extensions/qa-matrix`, futuros plugins ejecutores: adaptadores de transporte en vivo que
  controlan un canal real dentro de un Gateway de QA secundario.
- `qa/`: recursos semilla respaldados por el repositorio para la tarea inicial y los escenarios
  base de QA.
- [Mantis](/es/concepts/mantis): verificación en vivo antes y después para errores que
  necesitan transportes reales, capturas de pantalla del navegador, estado de VM y evidencia de PR.

## Superficie de comandos

Cada flujo de QA se ejecuta bajo `pnpm openclaw qa <subcommand>`. Muchos tienen alias de script `pnpm qa:*`;
ambas formas están soportadas.

| Comando                                             | Propósito                                                                                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autocomprobación de QA incluida; escribe un informe Markdown.                                                                                                          |
| `qa suite`                                          | Ejecuta escenarios respaldados por el repositorio contra el carril del Gateway de QA. Alias: `pnpm openclaw qa suite --runner multipass` para una VM Linux desechable. |
| `qa coverage`                                       | Imprime el inventario Markdown de cobertura de escenarios (`--json` para salida de máquina).                                                                           |
| `qa parity-report`                                  | Compara dos archivos `qa-suite-summary.json` y escribe el informe de paridad agéntica.                                                                                 |
| `qa character-eval`                                 | Ejecuta el escenario de QA de personaje en varios modelos en vivo con un informe evaluado. Consulta [Informes](#reporting).                                            |
| `qa manual`                                         | Ejecuta un prompt puntual contra el carril de proveedor/modelo seleccionado.                                                                                           |
| `qa ui`                                             | Inicia la UI de depuración de QA y el bus local de QA (alias: `pnpm qa:lab:ui`).                                                                                       |
| `qa docker-build-image`                             | Construye la imagen Docker prehorneada de QA.                                                                                                                          |
| `qa docker-scaffold`                                | Escribe un andamiaje de docker-compose para el panel de QA + carril de Gateway.                                                                                        |
| `qa up`                                             | Construye el sitio de QA, inicia la stack respaldada por Docker e imprime la URL (alias: `pnpm qa:lab:up`; la variante `:fast` añade `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Inicia solo el servidor del proveedor AIMock.                                                                                                                          |
| `qa mock-openai`                                    | Inicia solo el servidor del proveedor `mock-openai` con conocimiento de escenarios.                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestiona el pool compartido de credenciales de Convex.                                                                                                                 |
| `qa matrix`                                         | Carril de transporte en vivo contra un homeserver Tuwunel desechable. Consulta [QA de Matrix](/es/concepts/qa-matrix).                                                   |
| `qa telegram`                                       | Carril de transporte en vivo contra un grupo privado real de Telegram.                                                                                                 |
| `qa discord`                                        | Carril de transporte en vivo contra un canal de guild privado real de Discord.                                                                                         |
| `qa mantis`                                         | Ejecutor de verificación antes y después para errores de transporte en vivo, con el primer escenario de reacciones de estado de Discord. Consulta [Mantis](/es/concepts/mantis). |

## Flujo del operador

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel del Gateway (Control UI) con el agente.
- Derecha: QA Lab, que muestra la transcripción similar a Slack y el plan de escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso construye el sitio de QA, inicia el carril de Gateway respaldado por Docker y expone la
página de QA Lab, donde un operador o un loop de automatización puede dar al agente una
misión de QA, observar el comportamiento real del canal y registrar qué funcionó, falló o
quedó bloqueado.

Para una iteración más rápida de la UI de QA Lab sin reconstruir la imagen Docker cada vez,
inicia la stack con un paquete de QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios Docker en una imagen preconstruida y monta por bind
`extensions/qa-lab/web/dist` en el contenedor `qa-lab`. `qa:lab:watch`
reconstruye ese paquete ante cambios, y el navegador se recarga automáticamente cuando cambia el hash
de los recursos de QA Lab.

Para un smoke local de traza OpenTelemetry, ejecuta:

```bash
pnpm qa:otel:smoke
```

Ese script inicia un receptor local de trazas OTLP/HTTP, ejecuta el escenario de QA
`otel-trace-smoke` con el Plugin `diagnostics-otel` habilitado, luego
decodifica los spans protobuf exportados y verifica la forma crítica para la release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` y `openclaw.message.delivery` deben estar presentes;
las llamadas al modelo no deben exportar `StreamAbandoned` en turnos exitosos; los ID de diagnóstico sin procesar y los
atributos `openclaw.content.*` deben quedar fuera de la traza. Escribe
`otel-smoke-summary.json` junto a los artefactos de la suite de QA.

La QA de observabilidad sigue siendo solo para checkout de código fuente. El tarball de npm omite
intencionalmente QA Lab, por lo que los carriles de release Docker de paquetes no ejecutan comandos `qa`. Usa
`pnpm qa:otel:smoke` desde un checkout de código fuente construido cuando cambies la instrumentación
de diagnóstico.

Para un carril de smoke Matrix con transporte real, ejecuta:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La referencia completa de CLI, el catálogo de perfiles/escenarios, las variables de entorno y la disposición de artefactos de este carril viven en [QA de Matrix](/es/concepts/qa-matrix). En resumen: aprovisiona un homeserver Tuwunel desechable en Docker, registra usuarios temporales de controlador/SUT/observador, ejecuta el Plugin real de Matrix dentro de un Gateway de QA secundario acotado a ese transporte (sin `qa-channel`), y luego escribe un informe Markdown, un resumen JSON, un artefacto de eventos observados y un log de salida combinado en `.artifacts/qa-e2e/matrix-<timestamp>/`.

Para carriles de smoke Telegram y Discord con transporte real:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Ambos apuntan a un canal real preexistente con dos bots (controlador + SUT). Las variables de entorno requeridas, las listas de escenarios, los artefactos de salida y el pool de credenciales de Convex están documentados en la [referencia de QA de Telegram y Discord](#telegram-and-discord-qa-reference) más abajo.

Antes de usar credenciales en vivo agrupadas, ejecuta:

```bash
pnpm openclaw qa credentials doctor
```

El doctor comprueba el entorno del broker de Convex, valida la configuración de endpoints y verifica la accesibilidad de admin/list cuando el secreto de mantenedor está presente. Informa solo el estado definido/faltante de los secretos.

## Cobertura de transportes en vivo

Los carriles de transporte en vivo comparten un contrato en lugar de que cada uno invente su propia forma de lista de escenarios. `qa-channel` es la suite sintética amplia de comportamiento del producto y no forma parte de la matriz de cobertura de transporte en vivo.

| Carril   | Canary | Compuerta por mención | Bot a bot | Bloqueo de allowlist | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento de hilo | Aislamiento de hilo | Observación de reacciones | Comando de ayuda | Registro de comando nativo |
| -------- | ------ | --------------------- | --------- | -------------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | -------------------------- | ---------------- | -------------------------- |
| Matrix   | x      | x                     | x         | x                    | x                           | x                         | x                   | x                   | x                          |                  |                            |
| Telegram | x      | x                     | x         |                      |                             |                           |                     |                     |                            | x                |                            |
| Discord  | x      | x                     | x         |                      |                             |                           |                     |                     |                            |                  | x                          |

Esto mantiene `qa-channel` como la suite amplia de comportamiento del producto, mientras Matrix,
Telegram y futuros transportes en vivo comparten una checklist explícita de contrato de transporte.

Para un carril de VM Linux desechable sin introducir Docker en la ruta de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto arranca un invitado Multipass nuevo, instala dependencias, construye OpenClaw
dentro del invitado, ejecuta `qa suite` y luego copia el informe de QA normal y el
resumen de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de suite en host y Multipass ejecutan varios escenarios seleccionados en paralelo
con workers de Gateway aislados de forma predeterminada. `qa-channel` usa una concurrencia predeterminada
de 4, limitada por el recuento de escenarios seleccionados. Usa `--concurrency <count>` para ajustar
el recuento de workers, o `--concurrency 1` para ejecución serial.
El comando sale con código distinto de cero cuando cualquier escenario falla. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida fallido.
Las ejecuciones en vivo reenvían las entradas de autenticación de QA soportadas que son prácticas para el
invitado: claves de proveedor basadas en env, la ruta de configuración del proveedor en vivo de QA y
`CODEX_HOME` cuando está presente. Mantén `--output-dir` bajo la raíz del repositorio para que el invitado
pueda escribir de vuelta a través del workspace montado.

## Referencia de QA de Telegram y Discord

Matrix tiene una [página dedicada](/es/concepts/qa-matrix) por su recuento de escenarios y el aprovisionamiento de homeserver respaldado por Docker. Telegram y Discord son más pequeños: un puñado de escenarios cada uno, sin sistema de perfiles, contra canales reales preexistentes, así que su referencia vive aquí.

### Flags compartidos de CLI

Ambos carriles se registran mediante `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` y aceptan los mismos flags:

| Opción                               | Valor predeterminado                                      | Descripción                                                                                                           |
| ------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                    | —                                                         | Ejecuta solo este escenario. Repetible.                                                                               |
| `--output-dir <path>`                | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Dónde se escriben los informes/resumen/mensajes observados y el log de salida. Las rutas relativas se resuelven con respecto a `--repo-root`. |
| `--repo-root <path>`                 | `process.cwd()`                                           | Raíz del repositorio al invocar desde un cwd neutral.                                                                 |
| `--sut-account <id>`                 | `sut`                                                     | Id de cuenta temporal dentro de la configuración del Gateway de QA.                                                   |
| `--provider-mode <mode>`             | `live-frontier`                                           | `mock-openai` o `live-frontier` (`live-openai` heredado todavía funciona).                                            |
| `--model <ref>` / `--alt-model <ref>` | valor predeterminado del proveedor                        | Referencias de modelo primaria/alternativa.                                                                           |
| `--fast`                             | desactivado                                               | Modo rápido del proveedor donde sea compatible.                                                                       |
| `--credential-source <env\|convex>`  | `env`                                                     | Consulta [pool de credenciales de Convex](#convex-credential-pool).                                                   |
| `--credential-role <maintainer\|ci>` | `ci` en CI, `maintainer` en caso contrario                | Rol usado cuando `--credential-source convex`.                                                                        |

Ambos salen con un código distinto de cero ante cualquier escenario fallido. `--allow-failures` escribe artefactos sin establecer un código de salida fallido.

### QA de Telegram

```bash
pnpm openclaw qa telegram
```

Apunta a un grupo privado real de Telegram con dos bots distintos (controlador + SUT). El bot SUT debe tener un nombre de usuario de Telegram; la observación bot a bot funciona mejor cuando ambos bots tienen **Bot-to-Bot Communication Mode** habilitado en `@BotFather`.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id numérico del chat (cadena).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en los artefactos de mensajes observados (por defecto se redactan).

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
- `telegram-qa-summary.json` — incluye RTT por respuesta (envío del controlador → respuesta SUT observada) empezando por el canario.
- `telegram-qa-observed-messages.json` — cuerpos redactados salvo que `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA de Discord

```bash
pnpm openclaw qa discord
```

Apunta a un canal de servidor privado real de Discord con dos bots: un bot controlador controlado por el arnés y un bot SUT iniciado por el Gateway hijo de OpenClaw mediante el Plugin de Discord incluido. Verifica el manejo de menciones de canal, que el bot SUT haya registrado el comando nativo `/help` con Discord, y escenarios de evidencia Mantis opcionales.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — debe coincidir con el id de usuario del bot SUT devuelto por Discord (de lo contrario, la pista falla rápidamente).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en los artefactos de mensajes observados.

Escenarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — escenario Mantis opcional. Se ejecuta por sí solo porque cambia el SUT a respuestas de servidor siempre activas y solo con herramientas con `messages.statusReactions.enabled=true`, y luego captura una línea de tiempo de reacciones REST más un artefacto visual HTML/PNG.

Ejecuta explícitamente el escenario de reacciones de estado de Mantis:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Artefactos de salida:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — cuerpos redactados salvo que `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` y `discord-status-reactions-tool-only-timeline.png` cuando se ejecuta el escenario de reacciones de estado.

### Pool de credenciales de Convex

Tanto la pista de Telegram como la de Discord pueden arrendar credenciales de un pool compartido de Convex en lugar de leer las variables de entorno anteriores. Pasa `--credential-source convex` (o establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab adquiere un arrendamiento exclusivo, le envía Heartbeat durante la ejecución y lo libera al apagarse. Los tipos del pool son `"telegram"` y `"discord"`.

Formas de payload que valida el broker en `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` debe ser una cadena de chat-id numérica.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Las variables de entorno operativas y el contrato del endpoint del broker de Convex están en [Pruebas → Credenciales compartidas de Telegram mediante Convex](/es/help/testing#shared-telegram-credentials-via-convex-v1) (el nombre de la sección es anterior al soporte de Discord; la semántica del broker es idéntica para ambos tipos).

## Seeds respaldados por el repositorio

Los recursos seed viven en `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Están intencionadamente en git para que el plan de QA sea visible tanto para personas como para el agente.

`qa-lab` debe seguir siendo un ejecutor genérico de markdown. Cada archivo markdown de escenario es la fuente de verdad para una ejecución de prueba y debe definir:

- metadatos del escenario
- metadatos opcionales de categoría, capacidad, pista y riesgo
- referencias de docs y código
- requisitos opcionales de Plugin
- parche opcional de configuración del Gateway
- el `qa-flow` ejecutable

La superficie reutilizable de runtime que respalda `qa-flow` puede mantenerse genérica y transversal. Por ejemplo, los escenarios markdown pueden combinar helpers del lado del transporte con helpers del lado del navegador que controlan la Control UI incrustada mediante la unión `browser.request` del Gateway sin añadir un ejecutor de caso especial.

Los archivos de escenario deben agruparse por capacidad de producto en lugar de por carpeta del árbol de código fuente. Mantén estables los IDs de escenario cuando se muevan archivos; usa `docsRefs` y `codeRefs` para la trazabilidad de implementación.

La lista de baseline debe mantenerse lo bastante amplia para cubrir:

- chat por DM y canal
- comportamiento de hilos
- ciclo de vida de acciones de mensaje
- callbacks de cron
- recuperación de memoria
- cambio de modelo
- traspaso a subagente
- lectura de repositorio y lectura de docs
- una tarea de compilación pequeña como Lobster Invaders

## Pistas mock de proveedor

`qa suite` tiene dos pistas mock de proveedor locales:

- `mock-openai` es el mock de OpenClaw consciente de escenarios. Sigue siendo la pista mock determinista predeterminada para QA respaldado por el repositorio y puertas de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo, fixture, grabación/reproducción y caos. Es aditivo y no reemplaza al despachador de escenarios `mock-openai`.

La implementación de pistas de proveedor vive bajo `extensions/qa-lab/src/providers/`. Cada proveedor posee sus valores predeterminados, el arranque del servidor local, la configuración del modelo del Gateway, las necesidades de staging de perfiles de autenticación y las marcas de capacidad live/mock. El código compartido de suite y Gateway debe enrutar mediante el registro de proveedores en lugar de bifurcar por nombres de proveedor.

## Adaptadores de transporte

`qa-lab` posee una unión de transporte genérica para escenarios QA en markdown. `qa-channel` es el primer adaptador en esa unión, pero el objetivo de diseño es más amplio: los canales reales o sintéticos futuros deben conectarse al mismo ejecutor de suite en lugar de añadir un ejecutor QA específico de transporte.

A nivel de arquitectura, la división es:

- `qa-lab` posee la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos y los informes.
- El adaptador de transporte posee la configuración del Gateway, la preparación, la observación entrante y saliente, las acciones de transporte y el estado de transporte normalizado.
- Los archivos de escenario markdown bajo `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie reutilizable de runtime que los ejecuta.

### Añadir un canal

Añadir un canal al sistema de QA en markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejercite el contrato del canal.

No añadas una nueva raíz de comando QA de nivel superior cuando el host compartido `qa-lab` pueda poseer el flujo.

`qa-lab` posee la mecánica del host compartido:

- la raíz de comando `openclaw qa`
- arranque y desmontaje de suite
- concurrencia de workers
- escritura de artefactos
- generación de informes
- ejecución de escenarios
- alias de compatibilidad para escenarios `qa-channel` antiguos

Los Plugins de ejecutor poseen el contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura el Gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan eventos entrantes
- cómo se observan mensajes salientes
- cómo se exponen transcripciones y estado de transporte normalizado
- cómo se ejecutan acciones respaldadas por transporte
- cómo se maneja el restablecimiento o la limpieza específica del transporte

La barra mínima de adopción para un canal nuevo:

1. Mantén `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementa el runner de transporte en la unión de host compartido `qa-lab`.
3. Mantén la mecánica específica del transporte dentro del Plugin runner o arnés del canal.
4. Monta el runner como `openclaw qa <runner>` en lugar de registrar un comando raíz competidor. Los Plugins runner deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un array `qaRunnerCliRegistrations` coincidente desde `runtime-api.ts`. Mantén `runtime-api.ts` ligero; la CLI perezosa y la ejecución del runner deben permanecer detrás de puntos de entrada separados.
5. Crea o adapta escenarios markdown bajo los directorios temáticos `qa/scenarios/`.
6. Usa los helpers genéricos de escenario para nuevos escenarios.
7. Mantén funcionando los alias de compatibilidad existentes salvo que el repositorio esté haciendo una migración intencionada.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una vez en `qa-lab`, ponlo en `qa-lab`.
- Si el comportamiento depende de un transporte de canal, mantenlo en ese Plugin runner o arnés de Plugin.
- Si un escenario necesita una capacidad nueva que pueda usar más de un canal, añade un helper genérico en lugar de una rama específica de canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario específico de transporte y hazlo explícito en el contrato del escenario.

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

Los alias de compatibilidad siguen disponibles para los escenarios existentes — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — pero la creación de escenarios nuevos debería usar los nombres genéricos. Los alias existen para evitar una migración coordinada, no como el modelo a seguir en adelante.

## Informes

`qa-lab` exporta un informe de protocolo en Markdown a partir de la línea temporal del bus observada.
El informe debería responder:

- Qué funcionó
- Qué falló
- Qué quedó bloqueado
- Qué escenarios de seguimiento vale la pena agregar

Para consultar el inventario de escenarios disponibles — útil al dimensionar trabajo de seguimiento o conectar un nuevo transporte — ejecuta `pnpm openclaw qa coverage` (agrega `--json` para obtener salida legible por máquina).

Para comprobaciones de carácter y estilo, ejecuta el mismo escenario en varias referencias de modelos en vivo
y escribe un informe Markdown evaluado:

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

El comando ejecuta procesos hijo locales del Gateway de QA, no Docker. Los escenarios de evaluación de carácter
deberían establecer la personalidad mediante `SOUL.md` y luego ejecutar turnos de usuario ordinarios
como chat, ayuda con el espacio de trabajo y pequeñas tareas de archivos. No se debería decir al modelo candidato
que está siendo evaluado. El comando conserva cada transcripción completa,
registra estadísticas básicas de ejecución y luego pide a los modelos jueces en modo rápido con
razonamiento `xhigh`, cuando se admite, que clasifiquen las ejecuciones por naturalidad, estilo y humor.
Usa `--blind-judge-models` al comparar proveedores: el prompt del juez sigue recibiendo
cada transcripción y estado de ejecución, pero las referencias candidatas se reemplazan por etiquetas neutrales
como `candidate-01`; el informe asigna las clasificaciones de vuelta a las referencias reales después del
análisis.
Las ejecuciones candidatas usan de forma predeterminada razonamiento `high`, con `medium` para GPT-5.5 y `xhigh`
para referencias de evaluación de OpenAI anteriores que lo admiten. Sobrescribe un candidato específico en línea con
`--model provider/model,thinking=<level>`. `--thinking <level>` todavía establece una
alternativa global, y la forma anterior `--model-thinking <provider/model=level>` se
mantiene por compatibilidad.
Las referencias candidatas de OpenAI usan de forma predeterminada el modo rápido para que se use
procesamiento prioritario cuando el proveedor lo admite. Agrega `,fast`, `,no-fast` o `,fast=false` en línea cuando un
candidato o juez individual necesite una sobrescritura. Pasa `--fast` solo cuando quieras
forzar el modo rápido para todos los modelos candidatos. Las duraciones de candidatos y jueces se
registran en el informe para análisis comparativo, pero los prompts de los jueces indican explícitamente
que no clasifiquen por velocidad.
Las ejecuciones de modelos candidatos y jueces usan ambas, de forma predeterminada, concurrencia 16. Reduce
`--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la
presión del Gateway local hagan que una ejecución sea demasiado ruidosa.
Cuando no se pasa ningún `--model` candidato, la evaluación de carácter usa de forma predeterminada
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y
`google/gemini-3.1-pro-preview` cuando no se pasa ningún `--model`.
Cuando no se pasa ningún `--judge-model`, los jueces usan de forma predeterminada
`openai/gpt-5.5,thinking=xhigh,fast` y
`anthropic/claude-opus-4-6,thinking=high`.

## Documentación relacionada

- [QA de matriz](/es/concepts/qa-matrix)
- [Canal de QA](/es/channels/qa-channel)
- [Pruebas](/es/help/testing)
- [Panel](/es/web/dashboard)
