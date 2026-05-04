---
read_when:
    - Comprender cómo se integra la pila de control de calidad
    - Extender qa-lab, qa-channel o un adaptador de transporte
    - Agregar escenarios de QA respaldados por el repositorio
    - Creación de automatización de QA más realista en torno al panel de Gateway
summary: 'Descripción general de la pila de QA: qa-lab, qa-channel, escenarios respaldados por el repositorio, carriles de transporte en vivo, adaptadores de transporte e informes.'
title: Resumen de QA
x-i18n:
    generated_at: "2026-05-04T05:28:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pila privada de QA está pensada para ejercitar OpenClaw de una forma más realista,
con forma de canal, de lo que puede hacerlo una sola prueba unitaria.

Piezas actuales:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de DM, canal, hilo,
  reacción, edición y eliminación.
- `extensions/qa-lab`: interfaz de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe en Markdown.
- `extensions/qa-matrix`, futuros plugins ejecutores: adaptadores de transporte en vivo que
  controlan un canal real dentro de un Gateway de QA hijo.
- `qa/`: recursos semilla respaldados por el repositorio para la tarea de inicio y escenarios
  de QA base.
- [Mantis](/es/concepts/mantis): verificación en vivo de antes y después para errores que
  necesitan transportes reales, capturas de pantalla del navegador, estado de VM y evidencia de PR.

## Superficie de comandos

Cada flujo de QA se ejecuta bajo `pnpm openclaw qa <subcommand>`. Muchos tienen alias de script `pnpm qa:*`; ambas formas son compatibles.

| Comando                                             | Propósito                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autocomprobación de QA incluida; escribe un informe en Markdown.                                                                                                                                             |
| `qa suite`                                          | Ejecuta escenarios respaldados por el repositorio contra el carril del Gateway de QA. Alias: `pnpm openclaw qa suite --runner multipass` para una VM Linux desechable.                                                       |
| `qa coverage`                                       | Imprime el inventario de cobertura de escenarios en Markdown (`--json` para salida legible por máquina).                                                                                                                |
| `qa parity-report`                                  | Compara dos archivos `qa-suite-summary.json` y escribe el informe de paridad agéntico.                                                                                                               |
| `qa character-eval`                                 | Ejecuta el escenario de QA de carácter en varios modelos en vivo con un informe evaluado. Consulta [Informes](#reporting).                                                                                 |
| `qa manual`                                         | Ejecuta un prompt puntual contra el carril del proveedor/modelo seleccionado.                                                                                                                               |
| `qa ui`                                             | Inicia la interfaz de depuración de QA y el bus de QA local (alias: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | Construye la imagen Docker de QA prehorneada.                                                                                                                                                          |
| `qa docker-scaffold`                                | Escribe un andamiaje docker-compose para el panel de QA + carril de Gateway.                                                                                                                         |
| `qa up`                                             | Construye el sitio de QA, inicia la pila respaldada por Docker, imprime la URL (alias: `pnpm qa:lab:up`; la variante `:fast` añade `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                       |
| `qa aimock`                                         | Inicia solo el servidor proveedor AIMock.                                                                                                                                                       |
| `qa mock-openai`                                    | Inicia solo el servidor proveedor `mock-openai` consciente de escenarios.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestiona el grupo compartido de credenciales de Convex.                                                                                                                                                    |
| `qa matrix`                                         | Carril de transporte en vivo contra un homeserver Tuwunel desechable. Consulta [QA de Matrix](/es/concepts/qa-matrix).                                                                                           |
| `qa telegram`                                       | Carril de transporte en vivo contra un grupo privado real de Telegram.                                                                                                                                   |
| `qa discord`                                        | Carril de transporte en vivo contra un canal de guild privado real de Discord.                                                                                                                            |
| `qa slack`                                          | Carril de transporte en vivo contra un canal privado real de Slack.                                                                                                                                    |
| `qa mantis`                                         | Ejecutor de verificación de antes y después para errores de transporte en vivo, con evidencia de reacciones de estado de Discord, smoke de escritorio/navegador de Crabbox y smoke de Slack en VNC. Consulta [Mantis](/es/concepts/mantis). |

## Flujo del operador

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel del Gateway (Control UI) con el agente.
- Derecha: QA Lab, que muestra la transcripción estilo Slack y el plan de escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso construye el sitio de QA, inicia el carril de Gateway respaldado por Docker y expone la
página de QA Lab, donde un operador o bucle de automatización puede dar al agente una
misión de QA, observar el comportamiento real del canal y registrar qué funcionó, falló o
quedó bloqueado.

Para iteraciones más rápidas de la interfaz de QA Lab sin reconstruir la imagen Docker cada vez,
inicia la pila con un paquete de QA Lab montado mediante bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios Docker en una imagen preconstruida y monta mediante bind mount
`extensions/qa-lab/web/dist` en el contenedor `qa-lab`. `qa:lab:watch`
reconstruye ese paquete cuando hay cambios, y el navegador se recarga automáticamente cuando cambia el hash de recursos de QA Lab.

Para un smoke local de trazas de OpenTelemetry, ejecuta:

```bash
pnpm qa:otel:smoke
```

Ese script inicia un receptor local de trazas OTLP/HTTP, ejecuta el escenario de QA
`otel-trace-smoke` con el plugin `diagnostics-otel` habilitado, luego
decodifica los spans protobuf exportados y afirma la forma crítica para la versión:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` y `openclaw.message.delivery` deben estar presentes;
las llamadas al modelo no deben exportar `StreamAbandoned` en turnos correctos; los ID de diagnóstico sin procesar y los
atributos `openclaw.content.*` deben quedar fuera de la traza. Escribe
`otel-smoke-summary.json` junto a los artefactos de la suite de QA.

La QA de observabilidad sigue siendo solo para checkout de código fuente. El tarball de npm omite
intencionalmente QA Lab, por lo que los carriles de versión Docker del paquete no ejecutan comandos `qa`. Usa
`pnpm qa:otel:smoke` desde un checkout de código fuente construido al cambiar instrumentación
de diagnóstico.

Para un carril smoke Matrix con transporte real, ejecuta:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La referencia completa de CLI, el catálogo de perfiles/escenarios, las variables de entorno y el diseño de artefactos para este carril están en [QA de Matrix](/es/concepts/qa-matrix). En resumen: aprovisiona un homeserver Tuwunel desechable en Docker, registra usuarios temporales driver/SUT/observador, ejecuta el plugin real de Matrix dentro de un Gateway de QA hijo limitado a ese transporte (sin `qa-channel`), luego escribe un informe en Markdown, un resumen JSON, un artefacto de eventos observados y un registro de salida combinado bajo `.artifacts/qa-e2e/matrix-<timestamp>/`.

Para carriles smoke con transporte real de Telegram, Discord y Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Apuntan a un canal real preexistente con dos bots (driver + SUT). Las variables de entorno requeridas, las listas de escenarios, los artefactos de salida y el grupo de credenciales de Convex se documentan en la [referencia de QA de Telegram, Discord y Slack](#telegram-discord-and-slack-qa-reference) a continuación.

Para una ejecución completa de VM de escritorio de Slack con rescate por VNC, ejecuta:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ese comando arrienda una máquina de escritorio/navegador de Crabbox, ejecuta el carril en vivo de Slack
dentro de la VM, abre Slack Web en el navegador VNC, captura el escritorio y
copia `slack-qa/` más `slack-desktop-smoke.png` de vuelta al directorio de artefactos
de Mantis. Reutiliza `--lease-id <cbx_...>` después de iniciar sesión en Slack Web manualmente
mediante VNC. Con `--gateway-setup`, Mantis deja un Gateway de Slack de OpenClaw
persistente ejecutándose dentro de la VM en el puerto `38973`; sin él, el comando ejecuta el
carril normal de QA de Slack bot a bot y sale después de capturar los artefactos.

Antes de usar credenciales en vivo compartidas, ejecuta:

```bash
pnpm openclaw qa credentials doctor
```

El doctor comprueba el entorno del broker de Convex, valida la configuración de endpoints y verifica la accesibilidad de admin/list cuando el secreto de mantenedor está presente. Solo informa el estado configurado/faltante de los secretos.

## Cobertura de transporte en vivo

Los carriles de transporte en vivo comparten un contrato en lugar de que cada uno invente su propia forma de lista de escenarios. `qa-channel` es la amplia suite sintética de comportamiento de producto y no forma parte de la matriz de cobertura de transporte en vivo.

| Carril   | Canary | Control de menciones | Bot a bot | Bloqueo de allowlist | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento de hilo | Aislamiento de hilo | Observación de reacciones | Comando de ayuda | Registro de comandos nativo |
| -------- | ------ | -------------------- | ---------- | -------------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | -------------------------- | ---------------- | --------------------------- |
| Matrix   | x      | x                    | x          | x                    | x                           | x                         | x                   | x                   | x                          |                  |                             |
| Telegram | x      | x                    | x          |                      |                             |                           |                     |                     |                            | x                |                             |
| Discord  | x      | x                    | x          |                      |                             |                           |                     |                     |                            |                  | x                           |
| Slack    | x      | x                    | x          |                      |                             |                           |                     |                     |                            |                  |                             |

Esto mantiene `qa-channel` como la amplia suite de comportamiento de producto mientras Matrix,
Telegram y futuros transportes en vivo comparten una lista de comprobación explícita de contrato
de transporte.

Para un carril de VM Linux desechable sin llevar Docker a la ruta de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto inicia un invitado Multipass nuevo, instala dependencias, compila OpenClaw
dentro del invitado, ejecuta `qa suite` y luego copia el informe de QA normal y
el resumen de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de suites en el host y Multipass ejecutan de forma predeterminada varios escenarios seleccionados en paralelo
con workers de Gateway aislados. `qa-channel` usa de forma predeterminada una concurrencia
de 4, limitada por la cantidad de escenarios seleccionados. Usa `--concurrency <count>` para ajustar
la cantidad de workers, o `--concurrency 1` para ejecución en serie.
El comando sale con código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida fallido.
Las ejecuciones en vivo reenvían las entradas de autenticación de QA compatibles que son prácticas para el
invitado: claves de proveedor basadas en env, la ruta de configuración del proveedor en vivo de QA y
`CODEX_HOME` cuando está presente. Mantén `--output-dir` bajo la raíz del repositorio para que el invitado
pueda escribir de vuelta mediante el workspace montado.

## Referencia de QA de Telegram, Discord y Slack

Matrix tiene una [página dedicada](/es/concepts/qa-matrix) por su cantidad de escenarios y el aprovisionamiento de homeserver respaldado por Docker. Telegram, Discord y Slack son más pequeños: unos pocos escenarios cada uno, sin sistema de perfiles, contra canales reales preexistentes, por lo que su referencia vive aquí.

### Flags compartidos de CLI

Estos lanes se registran mediante `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` y aceptan los mismos flags:

| Flag                                  | Predeterminado                                                 | Descripción                                                                                                                    |
| ------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                     | —                                                              | Ejecuta solo este escenario. Repetible.                                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Dónde se escriben los informes/resumen/mensajes observados y el registro de salida. Las rutas relativas se resuelven contra `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Raíz del repositorio al invocar desde un cwd neutral.                                                                          |
| `--sut-account <id>`                  | `sut`                                                          | Id de cuenta temporal dentro de la configuración del Gateway de QA.                                                            |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` o `live-frontier` (`live-openai` heredado aún funciona).                                                         |
| `--model <ref>` / `--alt-model <ref>` | valor predeterminado del proveedor                             | Refs de modelo primario/alternativo.                                                                                           |
| `--fast`                              | desactivado                                                    | Modo rápido del proveedor donde sea compatible.                                                                                |
| `--credential-source <env\|convex>`   | `env`                                                          | Consulta [pool de credenciales Convex](#convex-credential-pool).                                                               |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, de lo contrario `maintainer`                       | Rol usado cuando `--credential-source convex`.                                                                                 |

Cada lane sale con código distinto de cero ante cualquier escenario fallido. `--allow-failures` escribe artefactos sin establecer un código de salida fallido.

### QA de Telegram

```bash
pnpm openclaw qa telegram
```

Apunta a un grupo privado real de Telegram con dos bots distintos (driver + SUT). El bot SUT debe tener un nombre de usuario de Telegram; la observación bot a bot funciona mejor cuando ambos bots tienen **Bot-to-Bot Communication Mode** habilitado en `@BotFather`.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id numérico del chat (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserva los cuerpos de mensajes en los artefactos de mensajes observados (por defecto se redactan).

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
- `telegram-qa-summary.json` — incluye RTT por respuesta (envío del driver → respuesta SUT observada) empezando por el canary.
- `telegram-qa-observed-messages.json` — cuerpos redactados salvo que `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA de Discord

```bash
pnpm openclaw qa discord
```

Apunta a un canal real privado de guild de Discord con dos bots: un bot driver controlado por el harness y un bot SUT iniciado por el Gateway hijo de OpenClaw mediante el plugin de Discord incluido. Verifica el manejo de menciones del canal, que el bot SUT haya registrado el comando nativo `/help` con Discord y escenarios de evidencia Mantis opcionales.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — debe coincidir con el id de usuario del bot SUT devuelto por Discord (de lo contrario, el lane falla rápido).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserva los cuerpos de mensajes en los artefactos de mensajes observados.

Escenarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — escenario Mantis opcional. Se ejecuta por sí solo porque cambia el SUT a respuestas de guild siempre activas y solo con herramientas con `messages.statusReactions.enabled=true`, y luego captura una línea de tiempo de reacciones REST más un artefacto visual HTML/PNG.

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

### QA de Slack

```bash
pnpm openclaw qa slack
```

Apunta a un canal real privado de Slack con dos bots distintos: un bot driver controlado por el harness y un bot SUT iniciado por el Gateway hijo de OpenClaw mediante el plugin de Slack incluido.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserva los cuerpos de mensajes en los artefactos de mensajes observados.

Escenarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artefactos de salida:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — cuerpos redactados salvo que `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### Pool de credenciales Convex

Los lanes de Telegram, Discord y Slack pueden arrendar credenciales de un pool compartido de Convex en lugar de leer las variables env anteriores. Pasa `--credential-source convex` (o establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab adquiere un arriendo exclusivo, le envía heartbeats durante la ejecución y lo libera al apagarse. Los tipos de pool son `"telegram"`, `"discord"` y `"slack"`.

Formas de payload que el broker valida en `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` debe ser un string de chat-id numérico.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Las variables env operativas y el contrato del endpoint del broker Convex viven en [Pruebas → Credenciales compartidas de Telegram mediante Convex](/es/help/testing#shared-telegram-credentials-via-convex-v1) (el nombre de la sección precede al soporte de Discord; la semántica del broker es idéntica para ambos tipos).

## Seeds respaldadas por el repositorio

Los assets seed viven en `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Están intencionadamente en git para que el plan de QA sea visible tanto para humanos como para el
agente.

`qa-lab` debe seguir siendo un runner genérico de Markdown. Cada archivo Markdown de escenario es
la fuente de verdad para una ejecución de prueba y debe definir:

- metadatos del escenario
- metadatos opcionales de categoría, capacidad, lane y riesgo
- refs de documentación y código
- requisitos opcionales de plugin
- parche opcional de configuración de Gateway
- el `qa-flow` ejecutable

La superficie de runtime reutilizable que respalda `qa-flow` puede seguir siendo genérica
y transversal. Por ejemplo, los escenarios Markdown pueden combinar helpers del lado de transporte
con helpers del lado del navegador que controlan la Control UI embebida mediante el
seam `browser.request` de Gateway sin añadir un runner de caso especial.

Los archivos de escenario deben agruparse por capacidad de producto en lugar de por carpeta
del árbol de código. Mantén estables los IDs de escenario cuando se muevan archivos; usa `docsRefs` y `codeRefs`
para la trazabilidad de implementación.

La lista base debe seguir siendo lo bastante amplia para cubrir:

- chat por DM y canal
- comportamiento de hilos
- ciclo de vida de acciones de mensaje
- callbacks de cron
- recuperación de memoria
- cambio de modelo
- handoff de subagente
- lectura de repositorio y lectura de documentación
- una tarea de compilación pequeña como Lobster Invaders

## Lanes de mock de proveedor

`qa suite` tiene dos lanes locales de mock de proveedor:

- `mock-openai` es el mock de OpenClaw consciente de escenarios. Sigue siendo el lane de mock
  determinista predeterminado para QA respaldado por el repositorio y gates de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo,
  fixtures, grabación/reproducción y caos. Es aditivo y no
  reemplaza el despachador de escenarios `mock-openai`.

La implementación de lanes de proveedor vive bajo `extensions/qa-lab/src/providers/`.
Cada proveedor posee sus valores predeterminados, inicio de servidor local, configuración de modelo de Gateway,
necesidades de preparación de auth-profile y flags de capacidades live/mock. El código compartido de suite y
Gateway debe enrutar mediante el registro de proveedores en lugar de ramificarse según
nombres de proveedores.

## Adaptadores de transporte

`qa-lab` posee un seam de transporte genérico para escenarios de QA en Markdown. `qa-channel` es el primer adaptador en ese seam, pero el objetivo de diseño es más amplio: los canales reales o sintéticos futuros deben conectarse al mismo runner de suite en lugar de añadir un runner de QA específico de transporte.

A nivel de arquitectura, la división es:

- `qa-lab` posee la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos y los informes.
- El adaptador de transporte posee la configuración de Gateway, preparación, observación entrante y saliente, acciones de transporte y estado normalizado de transporte.
- Los archivos de escenario Markdown bajo `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie de runtime reutilizable que los ejecuta.

### Añadir un canal

Añadir un canal al sistema de QA en Markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejercite el contrato del canal.

No añadas una nueva raíz de comando de QA de nivel superior cuando el host compartido `qa-lab` pueda poseer el flujo.

`qa-lab` posee la mecánica compartida del host:

- la raíz del comando `openclaw qa`
- inicio y desmontaje de suites
- concurrencia de workers
- escritura de artefactos
- generación de informes
- ejecución de escenarios
- alias de compatibilidad para escenarios antiguos de `qa-channel`

Los plugins de ejecutor son propietarios del contrato de transporte:

- cómo `openclaw qa <runner>` se monta bajo la raíz compartida `qa`
- cómo se configura el gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan los eventos entrantes
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado de transporte normalizado
- cómo se ejecutan las acciones respaldadas por el transporte
- cómo se maneja el restablecimiento o la limpieza específica del transporte

El umbral mínimo de adopción para un nuevo canal:

1. Mantén `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementa el ejecutor de transporte en la unión de host compartida de `qa-lab`.
3. Mantén la mecánica específica del transporte dentro del plugin de ejecutor o del arnés del canal.
4. Monta el ejecutor como `openclaw qa <runner>` en lugar de registrar un comando raíz competidor. Los plugins de ejecutor deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un arreglo `qaRunnerCliRegistrations` coincidente desde `runtime-api.ts`. Mantén `runtime-api.ts` ligero; la CLI diferida y la ejecución del ejecutor deben permanecer detrás de puntos de entrada separados.
5. Crea o adapta escenarios en Markdown bajo los directorios temáticos `qa/scenarios/`.
6. Usa los helpers genéricos de escenario para nuevos escenarios.
7. Mantén funcionando los alias de compatibilidad existentes a menos que el repositorio esté haciendo una migración intencional.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una sola vez en `qa-lab`, ponlo en `qa-lab`.
- Si el comportamiento depende de un transporte de canal, mantenlo en ese plugin de ejecutor o arnés de Plugin.
- Si un escenario necesita una nueva capacidad que más de un canal puede usar, agrega un helper genérico en lugar de una rama específica del canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario específico del transporte y hazlo explícito en el contrato del escenario.

### Nombres de helpers de escenario

Helpers genéricos preferidos para nuevos escenarios:

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

Los alias de compatibilidad siguen disponibles para escenarios existentes — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — pero la creación de nuevos escenarios debe usar los nombres genéricos. Los alias existen para evitar una migración de una sola vez, no como el modelo futuro.

## Informes

`qa-lab` exporta un informe de protocolo Markdown a partir de la línea de tiempo del bus observada.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué quedó bloqueado
- Qué escenarios de seguimiento vale la pena agregar

Para ver el inventario de escenarios disponibles — útil al dimensionar trabajo de seguimiento o al cablear un nuevo transporte — ejecuta `pnpm openclaw qa coverage` (agrega `--json` para salida legible por máquina).

Para comprobaciones de carácter y estilo, ejecuta el mismo escenario en varias refs de modelos en vivo y escribe un informe Markdown evaluado:

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

El comando ejecuta procesos secundarios locales del Gateway de QA, no Docker. Los escenarios de evaluación de carácter deben definir la persona mediante `SOUL.md` y luego ejecutar turnos de usuario ordinarios como chat, ayuda de workspace y tareas pequeñas de archivos. No se debe decir al modelo candidato que está siendo evaluado. El comando conserva cada transcripción completa, registra estadísticas básicas de ejecución y luego pide a los modelos jueces en modo rápido con razonamiento `xhigh` donde esté soportado que clasifiquen las ejecuciones por naturalidad, tono y humor.
Usa `--blind-judge-models` al comparar proveedores: el prompt del juez sigue recibiendo cada transcripción y estado de ejecución, pero las refs candidatas se reemplazan por etiquetas neutrales como `candidate-01`; el informe mapea las clasificaciones de vuelta a las refs reales después del análisis.
Las ejecuciones candidatas usan `high` thinking de forma predeterminada, con `medium` para GPT-5.5 y `xhigh` para refs de evaluación antiguas de OpenAI que lo soporten. Sobrescribe un candidato específico en línea con `--model provider/model,thinking=<level>`. `--thinking <level>` todavía define un valor global de respaldo, y la forma antigua `--model-thinking <provider/model=level>` se mantiene por compatibilidad.
Las refs candidatas de OpenAI usan modo rápido de forma predeterminada para que se use procesamiento prioritario donde el proveedor lo soporte. Agrega `,fast`, `,no-fast` o `,fast=false` en línea cuando un solo candidato o juez necesite una sobrescritura. Pasa `--fast` solo cuando quieras forzar el modo rápido para todos los modelos candidatos. Las duraciones de candidatos y jueces se registran en el informe para análisis de benchmarks, pero los prompts de los jueces dicen explícitamente que no clasifiquen por velocidad.
Las ejecuciones de modelos candidatos y jueces usan concurrencia 16 de forma predeterminada. Reduce `--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión local del Gateway hagan que una ejecución sea demasiado ruidosa.
Cuando no se pasa ningún candidato `--model`, la evaluación de carácter usa de forma predeterminada `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` y `google/gemini-3.1-pro-preview` cuando no se pasa ningún `--model`.
Cuando no se pasa ningún `--judge-model`, los jueces usan de forma predeterminada `openai/gpt-5.5,thinking=xhigh,fast` y `anthropic/claude-opus-4-6,thinking=high`.

## Documentación relacionada

- [QA de matriz](/es/concepts/qa-matrix)
- [Canal de QA](/es/channels/qa-channel)
- [Pruebas](/es/help/testing)
- [Panel](/es/web/dashboard)
