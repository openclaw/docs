---
read_when:
    - Comprender cómo encaja la pila de QA
    - Extender qa-lab, qa-channel o un adaptador de transporte
    - Añadir escenarios de QA respaldados por el repositorio
    - Creación de automatización de QA de mayor realismo en torno al panel de Gateway
summary: 'Descripción general de la pila de QA: qa-lab, qa-channel, escenarios respaldados por el repositorio, carriles de transporte en vivo, adaptadores de transporte e informes.'
title: Descripción general de QA
x-i18n:
    generated_at: "2026-05-06T05:32:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec1184395c8771c7bff755c97e5418e0c8b258f9953f1c945327d5c9753a69e
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pila privada de QA está pensada para ejercitar OpenClaw de una forma más realista,
con estructura de canal, de lo que puede lograr una sola prueba unitaria.

Componentes actuales:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de DM, canal, hilo,
  reacción, edición y eliminación.
- `extensions/qa-lab`: UI de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe en Markdown.
- `extensions/qa-matrix`, futuros plugins ejecutores: adaptadores de transporte en vivo que
  controlan un canal real dentro de un Gateway de QA hijo.
- `qa/`: recursos semilla respaldados por el repositorio para la tarea inicial y escenarios
  base de QA.
- [Mantis](/es/concepts/mantis): verificación en vivo de antes y después para errores que
  necesitan transportes reales, capturas de pantalla del navegador, estado de VM y evidencia de PR.

## Superficie de comandos

Cada flujo de QA se ejecuta bajo `pnpm openclaw qa <subcommand>`. Muchos tienen alias de scripts `pnpm qa:*`;
ambas formas son compatibles.

| Comando                                             | Propósito                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autocomprobación de QA incluida; escribe un informe en Markdown.                                                                                                                                                                                                                        |
| `qa suite`                                          | Ejecuta escenarios respaldados por el repositorio contra el carril del Gateway de QA. Alias: `pnpm openclaw qa suite --runner multipass` para una VM Linux desechable.                                                                                                                                  |
| `qa coverage`                                       | Imprime el inventario de cobertura de escenarios en markdown (`--json` para salida de máquina).                                                                                                                                                                                           |
| `qa parity-report`                                  | Compara dos archivos `qa-suite-summary.json` y escribe el informe de paridad agéntico.                                                                                                                                                                                          |
| `qa character-eval`                                 | Ejecuta el escenario de QA de personaje en varios modelos en vivo con un informe evaluado. Consulta [Informes](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Ejecuta un prompt puntual contra el carril de proveedor/modelo seleccionado.                                                                                                                                                                                                          |
| `qa ui`                                             | Inicia la UI de depuración de QA y el bus de QA local (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Construye la imagen Docker de QA prehorneada.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Escribe un scaffold de docker-compose para el panel de QA + el carril de Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Construye el sitio de QA, inicia la pila respaldada por Docker e imprime la URL (alias: `pnpm qa:lab:up`; la variante `:fast` agrega `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Inicia solo el servidor proveedor AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Inicia solo el servidor proveedor `mock-openai` consciente de escenarios.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Administra el pool compartido de credenciales Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Carril de transporte en vivo contra un homeserver Tuwunel desechable. Consulta [QA de Matrix](/es/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Carril de transporte en vivo contra un grupo privado real de Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Carril de transporte en vivo contra un canal de guild privada real de Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | Carril de transporte en vivo contra un canal privado real de Slack.                                                                                                                                                                                                               |
| `qa mantis`                                         | Ejecutor de verificación de antes y después para errores de transporte en vivo, con evidencia de reacciones de estado de Discord, smoke de escritorio/navegador Crabbox y smoke de Slack en VNC. Consulta [Mantis](/es/concepts/mantis) y [Runbook de Mantis Slack Desktop](/es/concepts/mantis-slack-desktop-runbook). |

## Flujo del operador

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel del Gateway (Control UI) con el agente.
- Derecha: QA Lab, que muestra la transcripción estilo Slack y el plan del escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso construye el sitio de QA, inicia el carril de Gateway respaldado por Docker y expone la
página de QA Lab donde un operador o bucle de automatización puede dar al agente una
misión de QA, observar el comportamiento real del canal y registrar qué funcionó, falló o
quedó bloqueado.

Para una iteración más rápida de la UI de QA Lab sin reconstruir la imagen Docker cada vez,
inicia la pila con un bundle de QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios Docker sobre una imagen preconstruida y monta por bind
`extensions/qa-lab/web/dist` en el contenedor `qa-lab`. `qa:lab:watch`
reconstruye ese bundle al cambiar, y el navegador se recarga automáticamente cuando cambia el hash
de recursos de QA Lab.

Para un smoke local de trazas OpenTelemetry, ejecuta:

```bash
pnpm qa:otel:smoke
```

Ese script inicia un receptor local de trazas OTLP/HTTP, ejecuta el escenario de QA
`otel-trace-smoke` con el plugin `diagnostics-otel` habilitado, luego decodifica los spans
protobuf exportados y afirma la forma crítica para la release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` y `openclaw.message.delivery` deben estar presentes;
las llamadas al modelo no deben exportar `StreamAbandoned` en turnos exitosos; los ID de diagnóstico sin procesar y los
atributos `openclaw.content.*` deben quedar fuera de la traza. Escribe
`otel-smoke-summary.json` junto a los artefactos de la suite de QA.

La QA de observabilidad sigue siendo solo para checkout de código fuente. El tarball de npm omite intencionalmente
QA Lab, así que los carriles de release Docker de paquete no ejecutan comandos `qa`. Usa
`pnpm qa:otel:smoke` desde un checkout de código fuente construido al cambiar la instrumentación
de diagnósticos.

Para un carril de smoke Matrix con transporte real, ejecuta:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La referencia completa de CLI, el catálogo de perfiles/escenarios, las variables de entorno y la disposición de artefactos de este carril están en [QA de Matrix](/es/concepts/qa-matrix). En resumen: aprovisiona un homeserver Tuwunel desechable en Docker, registra usuarios temporales de controlador/SUT/observador, ejecuta el plugin real de Matrix dentro de un Gateway de QA hijo acotado a ese transporte (sin `qa-channel`), y luego escribe un informe Markdown, un resumen JSON, un artefacto de eventos observados y un log combinado de salida bajo `.artifacts/qa-e2e/matrix-<timestamp>/`.

Los escenarios cubren comportamiento de transporte que las pruebas unitarias no pueden probar de extremo a extremo: puerta de menciones, políticas allow-bot, listas de permitidos, respuestas de nivel superior y en hilos, enrutamiento de DM, manejo de reacciones, supresión de ediciones entrantes, deduplicación de replay tras reinicio, recuperación ante interrupción del homeserver, entrega de metadatos de aprobación, manejo de medios y flujos de arranque/recuperación/verificación de E2EE en Matrix. El perfil de CLI de E2EE también ejecuta `openclaw matrix encryption setup` y comandos de verificación a través del mismo homeserver desechable antes de comprobar las respuestas del Gateway.

Discord también tiene escenarios opcionales solo de Mantis para reproducción de errores. Usa
`--scenario discord-status-reactions-tool-only` para la línea de tiempo explícita de reacción de estado,
o `--scenario discord-thread-reply-filepath-attachment` para crear un
hilo real de Discord y verificar que `message.thread-reply` preserve un adjunto
`filePath`. Estos escenarios quedan fuera del carril predeterminado en vivo de Discord
porque son sondas de reproducción de antes/después, no cobertura amplia de smoke.
El flujo de trabajo Mantis de adjuntos en hilo también puede agregar un video testigo de Discord Web
con sesión iniciada cuando `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` o
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` está configurado en el entorno de QA.
Ese perfil de visor es solo para captura visual; la decisión de aprobado/fallido
sigue viniendo del oráculo REST de Discord.

CI usa la misma superficie de comandos en `.github/workflows/qa-live-transports-convex.yml`. Las ejecuciones programadas y manuales predeterminadas ejecutan el perfil rápido de Matrix con credenciales frontier en vivo, `--fast` y `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. El `matrix_profile=all` manual se distribuye en los cinco shards de perfil para que el catálogo exhaustivo pueda ejecutarse en paralelo manteniendo un directorio de artefactos por shard.

Para carriles de smoke Telegram, Discord y Slack con transporte real:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Apuntan a un canal real preexistente con dos bots (controlador + SUT). Las variables de entorno requeridas, listas de escenarios, artefactos de salida y el pool de credenciales Convex están documentados en la [referencia de QA de Telegram, Discord y Slack](#telegram-discord-and-slack-qa-reference) más abajo.

Para una ejecución completa de una VM de escritorio de Slack con rescate por VNC, ejecuta:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ese comando arrienda una máquina de escritorio/navegador de Crabbox, ejecuta el carril live de Slack
dentro de la VM, abre Slack Web en el navegador VNC, captura el escritorio y
copia `slack-qa/`, `slack-desktop-smoke.png` y `slack-desktop-smoke.mp4`
cuando la captura de video está disponible de vuelta al directorio de artefactos de Mantis. Los arriendos
de escritorio/navegador de Crabbox proporcionan las herramientas de captura y los paquetes auxiliares
de navegador/compilación nativa de antemano, así que el escenario solo debería instalar alternativas en arriendos
más antiguos. Mantis informa los tiempos totales y por fase en
`mantis-slack-desktop-smoke-report.md`, de modo que las ejecuciones lentas muestran si el tiempo se dedicó al
calentamiento del arriendo, la adquisición de credenciales, la configuración remota o la copia de artefactos. Reutiliza
`--lease-id <cbx_...>` después de iniciar sesión en Slack Web manualmente mediante VNC;
los arriendos reutilizados también mantienen caliente la caché del almacén pnpm de Crabbox. El modo predeterminado
`--hydrate-mode source` verifica desde un checkout de código fuente y ejecuta la instalación/compilación
dentro de la VM. Usa `--hydrate-mode prehydrated` solo cuando el espacio de trabajo remoto reutilizado
ya tenga `node_modules` y un `dist/` compilado; ese modo omite el
costoso paso de instalación/compilación y falla de forma cerrada cuando el espacio de trabajo no está listo.
Con `--gateway-setup`, Mantis deja un Gateway persistente de Slack de OpenClaw
ejecutándose dentro de la VM en el puerto `38973`; sin él, el comando ejecuta el carril normal
de QA de Slack de bot a bot y sale después de capturar los artefactos.

La lista de verificación del operador, el comando de despacho de workflow de GitHub, el contrato de comentario de evidencia, la tabla de decisión de hydrate-mode, la interpretación de tiempos y los pasos de manejo de fallos están en [runbook de escritorio de Slack de Mantis](/es/concepts/mantis-slack-desktop-runbook).

Para una tarea de escritorio de estilo agente/CV, ejecuta:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` arrienda o reutiliza una máquina de escritorio/navegador de Crabbox, inicia
`crabbox record --while`, controla el navegador visible mediante un
`visual-driver` anidado, captura `visual-task.png`, ejecuta `openclaw infer image describe`
contra la captura de pantalla cuando se selecciona `--vision-mode image-describe`, y
escribe `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` y `mantis-visual-task-report.md`.
Cuando se establece `--expect-text`, el prompt de visión solicita un veredicto JSON
estructurado y solo pasa cuando el modelo informa evidencia visible positiva; una
respuesta negativa que simplemente cite el texto objetivo falla la aserción.
Usa `--vision-mode metadata` para una prueba de humo sin modelo que demuestre la infraestructura de
escritorio, navegador, captura de pantalla y video sin llamar a un proveedor de comprensión de imágenes.
La grabación es un artefacto obligatorio para `visual-task`; si Crabbox no graba
un `visual-task.mp4` no vacío, la tarea falla aunque el controlador visual
haya pasado. En caso de fallo, Mantis conserva el arriendo para VNC a menos que la tarea ya
hubiera pasado y no se haya establecido `--keep-lease`.

Antes de usar credenciales live agrupadas, ejecuta:

```bash
pnpm openclaw qa credentials doctor
```

El doctor comprueba el entorno del broker de Convex, valida la configuración del endpoint y verifica la accesibilidad de administración/listado cuando está presente el secreto de mantenedor. Solo informa el estado establecido/faltante de los secretos.

## Cobertura de transporte live

Los carriles de transporte live comparten un contrato en lugar de que cada uno invente su propia forma de lista de escenarios. `qa-channel` es la suite sintética amplia de comportamiento de producto y no forma parte de la matriz de cobertura de transporte live.

| Carril   | Canary | Gating de menciones | Bot a bot | Bloqueo por lista de permitidos | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento de hilo | Aislamiento de hilo | Observación de reacciones | Comando de ayuda | Registro de comandos nativos |
| -------- | ------ | ------------------- | --------- | -------------------------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | -------------------------- | ---------------- | ---------------------------- |
| Matrix   | x      | x                   | x         | x                                | x                           | x                         | x                   | x                   | x                          |                  |                              |
| Telegram | x      | x                   | x         |                                  |                             |                           |                     |                     |                            | x                |                              |
| Discord  | x      | x                   | x         |                                  |                             |                           |                     |                     |                            |                  | x                            |
| Slack    | x      | x                   | x         | x                                | x                           | x                         | x                   | x                   |                            |                  |                              |

Esto mantiene `qa-channel` como la suite amplia de comportamiento de producto mientras Matrix,
Telegram y futuros transportes live comparten una lista de verificación explícita de contrato de transporte.

Para un carril de VM Linux desechable sin incorporar Docker en la ruta de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto inicia un invitado nuevo de Multipass, instala dependencias, compila OpenClaw
dentro del invitado, ejecuta `qa suite` y luego copia el informe y el
resumen normales de QA de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de la suite en host y Multipass ejecutan varios escenarios seleccionados en paralelo
con trabajadores de Gateway aislados de forma predeterminada. `qa-channel` usa concurrencia
4 de forma predeterminada, limitada por el recuento de escenarios seleccionados. Usa `--concurrency <count>` para ajustar
el recuento de trabajadores, o `--concurrency 1` para ejecución serial.
El comando sale con código distinto de cero cuando cualquier escenario falla. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida fallido.
Las ejecuciones live reenvían las entradas de autenticación de QA admitidas que son prácticas para el
invitado: claves de proveedor basadas en env, la ruta de configuración del proveedor live de QA y
`CODEX_HOME` cuando está presente. Mantén `--output-dir` bajo la raíz del repositorio para que el invitado
pueda escribir de vuelta mediante el espacio de trabajo montado.

## Referencia de QA de Telegram, Discord y Slack

Matrix tiene una [página dedicada](/es/concepts/qa-matrix) debido a su cantidad de escenarios y al aprovisionamiento de homeserver respaldado por Docker. Telegram, Discord y Slack son más pequeños: unos pocos escenarios cada uno, sin sistema de perfiles, contra canales reales preexistentes, así que su referencia está aquí.

### Flags compartidos de CLI

Estos carriles se registran mediante `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` y aceptan los mismos flags:

| Flag                                  | Predeterminado                                                 | Descripción                                                                                                           |
| ------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                              | Ejecuta solo este escenario. Repetible.                                                                               |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Donde se escriben los informes/resumen/mensajes observados y el registro de salida. Las rutas relativas se resuelven contra `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Raíz del repositorio al invocar desde un cwd neutral.                                                                 |
| `--sut-account <id>`                  | `sut`                                                          | Id de cuenta temporal dentro de la configuración del Gateway de QA.                                                   |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` o `live-frontier` (`live-openai` heredado todavía funciona).                                            |
| `--model <ref>` / `--alt-model <ref>` | valor predeterminado del proveedor                             | Referencias de modelo principal/alternativo.                                                                          |
| `--fast`                              | desactivado                                                    | Modo rápido del proveedor donde sea compatible.                                                                       |
| `--credential-source <env\|convex>`   | `env`                                                          | Consulta [pool de credenciales de Convex](#convex-credential-pool).                                                   |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, `maintainer` en caso contrario                     | Rol usado cuando `--credential-source convex`.                                                                        |

Cada carril sale con código distinto de cero ante cualquier escenario fallido. `--allow-failures` escribe artefactos sin establecer un código de salida fallido.

### QA de Telegram

```bash
pnpm openclaw qa telegram
```

Apunta a un grupo privado real de Telegram con dos bots distintos (controlador + SUT). El bot SUT debe tener un nombre de usuario de Telegram; la observación de bot a bot funciona mejor cuando ambos bots tienen **Bot-to-Bot Communication Mode** habilitado en `@BotFather`.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id numérico de chat (cadena).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en los artefactos de mensajes observados (redactados de forma predeterminada).

Escenarios (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Artefactos de salida:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - incluye RTT por respuesta (envío del controlador → respuesta SUT observada) empezando por el canary.
- `telegram-qa-observed-messages.json` - cuerpos redactados salvo que `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA de Discord

```bash
pnpm openclaw qa discord
```

Apunta a un canal de guild privado real de Discord con dos bots: un bot controlador manejado por el harness y un bot SUT iniciado por el Gateway hijo de OpenClaw mediante el plugin incluido de Discord. Verifica el manejo de menciones del canal, que el bot SUT haya registrado el comando nativo `/help` con Discord y escenarios opcionales de evidencia de Mantis.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - debe coincidir con el id de usuario del bot SUT devuelto por Discord (de lo contrario, el carril falla rápidamente).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en los artefactos de mensajes observados.

Escenarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` - escenario opcional de Mantis. Se ejecuta solo porque cambia el SUT a respuestas de guild siempre activas y solo con herramientas con `messages.statusReactions.enabled=true`, luego captura una línea de tiempo de reacciones REST más artefactos visuales HTML/PNG. Los informes antes/después de Mantis también conservan los artefactos MP4 proporcionados por el escenario como `baseline.mp4` y `candidate.mp4`.

Ejecuta explícitamente el escenario de Mantis de reacciones de estado:

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
- `discord-qa-observed-messages.json` - cuerpos redactados salvo que `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` y `discord-status-reactions-tool-only-timeline.png` cuando se ejecuta el escenario de reacciones de estado.

### QA de Slack

```bash
pnpm openclaw qa slack
```

Apunta a un canal privado real de Slack con dos bots distintos: un bot controlador gestionado por el arnés y un bot SUT iniciado por el Gateway secundario de OpenClaw mediante el Plugin de Slack incluido.

Entorno obligatorio cuando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en los artefactos de mensajes observados.

Escenarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

Artefactos de salida:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - cuerpos redactados salvo que `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Configuración del espacio de trabajo de Slack

El carril necesita dos aplicaciones de Slack distintas en un espacio de trabajo, además de un canal del que ambos bots sean miembros:

- `channelId` - el id `Cxxxxxxxxxx` de un canal al que se haya invitado a ambos bots. Usa un canal dedicado; el carril publica en cada ejecución.
- `driverBotToken` - token de bot (`xoxb-...`) de la aplicación **Driver**.
- `sutBotToken` - token de bot (`xoxb-...`) de la aplicación **SUT**, que debe ser una aplicación de Slack separada de la del controlador para que su id de usuario de bot sea distinto.
- `sutAppToken` - token de nivel de aplicación (`xapp-...`) de la aplicación SUT con `connections:write`, usado por Socket Mode para que la aplicación SUT pueda recibir eventos.

Prefiere un espacio de trabajo de Slack dedicado a QA antes que reutilizar un espacio de trabajo de producción.

El manifiesto de SUT siguiente reduce intencionadamente la instalación de producción del Plugin de Slack incluido (`extensions/slack/src/setup-shared.ts:10`) a los permisos y eventos cubiertos por la suite de QA en vivo de Slack. Para la configuración del canal de producción tal como la ven los usuarios, consulta [Configuración rápida del canal de Slack](/es/channels/slack#quick-setup); el par QA Driver/SUT está separado intencionadamente porque el carril necesita dos ids de usuario de bot distintos en un espacio de trabajo.

**1. Crea la aplicación Driver**

Ve a [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → elige el espacio de trabajo de QA, pega el siguiente manifiesto y luego _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Copia el _Bot User OAuth Token_ (`xoxb-...`); ese pasa a ser `driverBotToken`. El controlador solo necesita publicar mensajes e identificarse; sin eventos, sin Socket Mode.

**2. Crea la aplicación SUT**

Repite _Create New App → From a manifest_ en el mismo espacio de trabajo. Esta aplicación de QA usa intencionadamente una versión más restringida del manifiesto de producción del Plugin de Slack incluido (`extensions/slack/src/setup-shared.ts:10`): se omiten los permisos y eventos de reacciones porque la suite de QA en vivo de Slack aún no cubre el manejo de reacciones.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Después de que Slack cree la aplicación, haz dos cosas en su página de configuración:

- _Install to Workspace_ → copia el _Bot User OAuth Token_ → eso pasa a ser `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → agrega el permiso `connections:write` → guarda → copia el valor `xapp-...` → eso pasa a ser `sutAppToken`.

Verifica que los dos bots tengan ids de usuario distintos llamando a `auth.test` en cada token. El runtime distingue el controlador y el SUT por id de usuario; reutilizar una aplicación para ambos fallará inmediatamente en la compuerta de menciones.

**3. Crea el canal**

En el espacio de trabajo de QA, crea un canal (por ejemplo, `#openclaw-qa`) e invita a ambos bots desde dentro del canal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copia el id `Cxxxxxxxxxx` desde _channel info → About → Channel ID_; eso pasa a ser `channelId`. Un canal público funciona; si usas un canal privado, ambas aplicaciones ya tienen `groups:history`, por lo que las lecturas de historial del arnés seguirán funcionando.

**4. Registra las credenciales**

Dos opciones. Usa variables de entorno para depuración en una sola máquina (define las cuatro variables `OPENCLAW_QA_SLACK_*` y pasa `--credential-source env`), o inicializa el grupo compartido de Convex para que CI y otros mantenedores puedan alquilarlas.

Para el grupo de Convex, escribe los cuatro campos en un archivo JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Con `OPENCLAW_QA_CONVEX_SITE_URL` y `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` exportadas en tu shell, registra y verifica:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Espera `count: 1`, `status: "active"`, sin campo `lease`.

**5. Verifica de extremo a extremo**

Ejecuta el carril localmente para confirmar que ambos bots pueden hablar entre sí a través del broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Una ejecución correcta termina en mucho menos de 30 segundos y `slack-qa-report.md` muestra tanto `slack-canary` como `slack-mention-gating` con estado `pass`. Si el carril se queda bloqueado durante ~90 segundos y sale con `Convex credential pool exhausted for kind "slack"`, o el grupo está vacío o todas las filas están alquiladas; `qa credentials list --kind slack --status all --json` te dirá cuál caso es.

### Grupo de credenciales de Convex

Los carriles de Telegram, Discord y Slack pueden alquilar credenciales desde un grupo compartido de Convex en lugar de leer las variables de entorno anteriores. Pasa `--credential-source convex` (o define `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab adquiere un alquiler exclusivo, lo mantiene activo con latidos durante la ejecución y lo libera al cerrarse. Los tipos de grupo son `"telegram"`, `"discord"` y `"slack"`.

Formas de payload que el broker valida en `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` debe ser una cadena de id de chat numérico.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` debe coincidir con `^[A-Z][A-Z0-9]+$` (un id de Slack como `Cxxxxxxxxxx`). Consulta [Configuración del espacio de trabajo de Slack](#setting-up-the-slack-workspace) para el aprovisionamiento de aplicaciones y permisos.

Las variables de entorno operativas y el contrato del endpoint del broker de Convex están en [Pruebas → Credenciales compartidas de Telegram mediante Convex](/es/help/testing#shared-telegram-credentials-via-convex-v1) (el nombre de la sección es anterior al soporte de Discord; la semántica del broker es idéntica para ambos tipos).

## Semillas respaldadas por el repositorio

Los recursos de semilla viven en `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Estos están intencionadamente en git para que el plan de QA sea visible tanto para humanos como para el agente.

`qa-lab` debe seguir siendo un ejecutor genérico de Markdown. Cada archivo Markdown de escenario es la fuente de verdad para una ejecución de prueba y debe definir:

- metadatos del escenario
- metadatos opcionales de categoría, capacidad, carril y riesgo
- referencias a documentación y código
- requisitos opcionales de Plugin
- parche opcional de configuración de Gateway
- el `qa-flow` ejecutable

La superficie de runtime reutilizable que respalda `qa-flow` puede seguir siendo genérica y transversal. Por ejemplo, los escenarios Markdown pueden combinar ayudantes del lado de transporte con ayudantes del lado del navegador que manejan la Control UI embebida mediante el mecanismo `browser.request` del Gateway sin agregar un ejecutor de caso especial.

Los archivos de escenario deben agruparse por capacidad de producto en lugar de por carpeta del árbol de código fuente. Mantén estables los ids de escenario cuando se muevan archivos; usa `docsRefs` y `codeRefs` para la trazabilidad de implementación.

La lista de referencia debe seguir siendo lo bastante amplia como para cubrir:

- chat de DM y de canal
- comportamiento de hilos
- ciclo de vida de acciones de mensajes
- callbacks de cron
- recuperación de memoria
- cambio de modelo
- traspaso a subagente
- lectura de repositorio y lectura de documentación
- una pequeña tarea de compilación como Lobster Invaders

## Carriles de proveedor simulado

`qa suite` tiene dos carriles locales de proveedor simulado:

- `mock-openai` es el simulador de OpenClaw consciente de escenarios. Sigue siendo el carril simulado determinista predeterminado para QA respaldada por el repositorio y compuertas de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo, fixture, grabación/reproducción y caos. Es aditivo y no reemplaza al despachador de escenarios `mock-openai`.

La implementación de carriles de proveedor vive bajo `extensions/qa-lab/src/providers/`. Cada proveedor posee sus valores predeterminados, el arranque de su servidor local, la configuración de modelo de Gateway, las necesidades de preparación de perfiles de autenticación y las banderas de capacidad en vivo/simulada. El código compartido de suite y Gateway debe enrutar mediante el registro de proveedores en lugar de bifurcar por nombres de proveedor.

## Adaptadores de transporte

`qa-lab` posee una unión de transporte genérica para escenarios de QA en Markdown. `qa-channel` es el primer adaptador en esa unión, pero el objetivo de diseño es más amplio: los futuros canales reales o sintéticos deberían conectarse al mismo ejecutor de suite en lugar de agregar un ejecutor de QA específico de transporte.

En el nivel de arquitectura, la división es:

- `qa-lab` posee la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos y los informes.
- El adaptador de transporte posee la configuración de Gateway, la preparación, la observación entrante y saliente, las acciones de transporte y el estado de transporte normalizado.
- Los archivos de escenario Markdown bajo `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie de runtime reutilizable que los ejecuta.

### Agregar un canal

Agregar un canal al sistema de QA en Markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejercite el contrato del canal.

No agregues una nueva raíz de comando de QA de nivel superior cuando el host compartido `qa-lab` pueda poseer el flujo.

`qa-lab` posee la mecánica compartida del host:

- la raíz del comando `openclaw qa`
- inicio y desmontaje de la suite
- concurrencia de workers
- escritura de artefactos
- generación de informes
- ejecución de escenarios
- alias de compatibilidad para escenarios `qa-channel` anteriores

Los Plugins ejecutores son dueños del contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura el gateway para ese transporte
- cómo se comprueba la disponibilidad
- cómo se inyectan eventos entrantes
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado de transporte normalizado
- cómo se ejecutan las acciones respaldadas por transporte
- cómo se gestiona el restablecimiento o la limpieza específicos del transporte

El umbral mínimo de adopción para un canal nuevo:

1. Mantener `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementar el ejecutor de transporte en el seam de host compartido de `qa-lab`.
3. Mantener la mecánica específica del transporte dentro del Plugin ejecutor o del harness del canal.
4. Montar el ejecutor como `openclaw qa <runner>` en lugar de registrar un comando raíz competidor. Los Plugins ejecutores deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un array `qaRunnerCliRegistrations` coincidente desde `runtime-api.ts`. Mantén `runtime-api.ts` ligero; la CLI diferida y la ejecución del runner deben permanecer detrás de puntos de entrada separados.
5. Crear o adaptar escenarios Markdown bajo los directorios temáticos `qa/scenarios/`.
6. Usar los helpers de escenario genéricos para escenarios nuevos.
7. Mantener funcionando los alias de compatibilidad existentes salvo que el repositorio esté realizando una migración intencional.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una vez en `qa-lab`, ponlo en `qa-lab`.
- Si el comportamiento depende de un transporte de canal, mantenlo en ese Plugin ejecutor o harness de Plugin.
- Si un escenario necesita una capacidad nueva que puede usar más de un canal, añade un helper genérico en lugar de una rama específica del canal en `suite.ts`.
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

Los alias de compatibilidad siguen disponibles para escenarios existentes - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - pero la creación de escenarios nuevos debe usar los nombres genéricos. Los alias existen para evitar una migración de un solo golpe, no como el modelo futuro.

## Informes

`qa-lab` exporta un informe de protocolo en Markdown a partir de la cronología observada del bus.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué quedó bloqueado
- Qué escenarios de seguimiento vale la pena añadir

Para el inventario de escenarios disponibles - útil al dimensionar trabajo de seguimiento o conectar un transporte nuevo - ejecuta `pnpm openclaw qa coverage` (añade `--json` para salida legible por máquina).

Para comprobaciones de carácter y estilo, ejecuta el mismo escenario en varios refs de modelo en vivo y escribe un informe Markdown evaluado:

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

El comando ejecuta procesos hijo del Gateway QA local, no Docker. Los escenarios de evaluación de carácter deben establecer la persona mediante `SOUL.md` y luego ejecutar turnos de usuario ordinarios como chat, ayuda de workspace y tareas pequeñas con archivos. Al modelo candidato no se le debe decir que está siendo evaluado. El comando conserva cada transcripción completa, registra estadísticas básicas de ejecución y luego pide a los modelos jueces en modo rápido con razonamiento `xhigh` donde esté soportado que clasifiquen las ejecuciones por naturalidad, tono y humor.
Usa `--blind-judge-models` al comparar proveedores: el prompt del juez sigue recibiendo cada transcripción y estado de ejecución, pero los refs candidatos se sustituyen por etiquetas neutrales como `candidate-01`; el informe vuelve a mapear las clasificaciones a los refs reales después del análisis.
Las ejecuciones candidatas usan por defecto pensamiento `high`, con `medium` para GPT-5.5 y `xhigh` para refs de evaluación OpenAI anteriores que lo soportan. Sobrescribe un candidato específico en línea con `--model provider/model,thinking=<level>`. `--thinking <level>` todavía establece un fallback global, y la forma anterior `--model-thinking <provider/model=level>` se conserva por compatibilidad.
Los refs candidatos de OpenAI usan por defecto modo rápido para que se use procesamiento prioritario donde el proveedor lo soporte. Añade `,fast`, `,no-fast` o `,fast=false` en línea cuando un único candidato o juez necesite una sobrescritura. Pasa `--fast` solo cuando quieras forzar el modo rápido para todos los modelos candidatos. Las duraciones de candidatos y jueces se registran en el informe para análisis de benchmark, pero los prompts de juez dicen explícitamente que no se clasifique por velocidad.
Las ejecuciones de modelos candidatos y jueces usan por defecto concurrencia 16. Reduce `--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión del Gateway local hagan que una ejecución sea demasiado ruidosa.
Cuando no se pasa ningún `--model` candidato, la evaluación de carácter usa por defecto `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y
`google/gemini-3.1-pro-preview` cuando no se pasa ningún `--model`.
Cuando no se pasa ningún `--judge-model`, los jueces usan por defecto
`openai/gpt-5.5,thinking=xhigh,fast` y
`anthropic/claude-opus-4-6,thinking=high`.

## Documentos relacionados

- [QA de matriz](/es/concepts/qa-matrix)
- [Canal QA](/es/channels/qa-channel)
- [Pruebas](/es/help/testing)
- [Panel de control](/es/web/dashboard)
