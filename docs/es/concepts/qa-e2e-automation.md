---
read_when:
    - Comprender cómo encaja la pila de QA
    - Extender qa-lab, qa-channel o un adaptador de transporte
    - Añadir escenarios de QA respaldados por repositorio
    - Creación de una automatización de QA de mayor realismo en torno al panel de control del Gateway
summary: 'Descripción general de la pila de QA: qa-lab, qa-channel, escenarios respaldados por el repositorio, rutas de transporte en vivo, adaptadores de transporte e informes.'
title: Descripción general del aseguramiento de calidad
x-i18n:
    generated_at: "2026-05-07T13:15:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pila privada de QA está pensada para ejercitar OpenClaw de una forma más realista y
con forma de canal de lo que puede hacerlo una sola prueba unitaria.

Componentes actuales:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de DM, canal, hilo,
  reacción, edición y eliminación.
- `extensions/qa-lab`: interfaz de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe en Markdown.
- `extensions/qa-matrix`, futuros plugins de ejecución: adaptadores de transporte en vivo que
  manejan un canal real dentro de un gateway de QA secundario.
- `qa/`: recursos semilla respaldados por el repositorio para la tarea inicial y los escenarios
  base de QA.
- [Mantis](/es/concepts/mantis): verificación en vivo antes y después para errores que
  necesitan transportes reales, capturas de pantalla del navegador, estado de VM y evidencia de PR.

## Superficie de comandos

Cada flujo de QA se ejecuta bajo `pnpm openclaw qa <subcommand>`. Muchos tienen alias de script `pnpm qa:*`;
ambas formas son compatibles.

| Comando                                             | Propósito                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autocomprobación de QA incluida; escribe un informe en Markdown.                                                                                                                                                                                                                        |
| `qa suite`                                          | Ejecuta escenarios respaldados por el repositorio contra el carril del Gateway de QA. Alias: `pnpm openclaw qa suite --runner multipass` para una VM Linux desechable.                                                                                                                                  |
| `qa coverage`                                       | Imprime el inventario de cobertura de escenarios en Markdown (`--json` para salida de máquina).                                                                                                                                                                                           |
| `qa parity-report`                                  | Compara dos archivos `qa-suite-summary.json` y escribe el informe de paridad agéntica.                                                                                                                                                                                          |
| `qa character-eval`                                 | Ejecuta el escenario de QA de carácter en varios modelos en vivo con un informe evaluado. Consulta [Informes](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Ejecuta un prompt puntual contra el carril de proveedor/modelo seleccionado.                                                                                                                                                                                                          |
| `qa ui`                                             | Inicia la interfaz de depuración de QA y el bus local de QA (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Construye la imagen Docker de QA prehorneada.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Escribe una plantilla docker-compose para el panel de QA + el carril de Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Construye el sitio de QA, inicia la pila respaldada por Docker, imprime la URL (alias: `pnpm qa:lab:up`; la variante `:fast` añade `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Inicia solo el servidor del proveedor AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Inicia solo el servidor del proveedor `mock-openai` consciente de escenarios.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Administra el conjunto compartido de credenciales de Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Carril de transporte en vivo contra un homeserver Tuwunel desechable. Consulta [QA de Matrix](/es/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Carril de transporte en vivo contra un grupo privado real de Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Carril de transporte en vivo contra un canal real de un guild privado de Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | Carril de transporte en vivo contra un canal privado real de Slack.                                                                                                                                                                                                               |
| `qa mantis`                                         | Ejecutor de verificación antes y después para errores de transporte en vivo, con evidencia de reacciones de estado en Discord, smoke de escritorio/navegador de Crabbox y smoke de Slack en VNC. Consulta [Mantis](/es/concepts/mantis) y [Manual operativo de escritorio de Slack para Mantis](/es/concepts/mantis-slack-desktop-runbook). |

## Flujo del operador

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel del Gateway (interfaz de control) con el agente.
- Derecha: QA Lab, que muestra la transcripción estilo Slack y el plan de escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso construye el sitio de QA, inicia el carril de Gateway respaldado por Docker y expone la
página de QA Lab, donde un operador o un bucle de automatización puede dar al agente una misión de QA,
observar el comportamiento real del canal y registrar lo que funcionó, falló o
quedó bloqueado.

Para iterar más rápido en la interfaz de QA Lab sin reconstruir la imagen Docker cada vez,
inicia la pila con un paquete de QA Lab montado por enlace:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios Docker sobre una imagen preconstruida y monta por enlace
`extensions/qa-lab/web/dist` en el contenedor `qa-lab`. `qa:lab:watch`
reconstruye ese paquete al cambiar, y el navegador se recarga automáticamente cuando cambia el hash de recursos de QA Lab.

Para un smoke local de trazas de OpenTelemetry, ejecuta:

```bash
pnpm qa:otel:smoke
```

Ese script inicia un receptor local de trazas OTLP/HTTP, ejecuta el escenario de QA
`otel-trace-smoke` con el Plugin `diagnostics-otel` habilitado, luego
decodifica los spans protobuf exportados y afirma la forma crítica para la versión:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` y `openclaw.message.delivery` deben estar presentes;
las llamadas al modelo no deben exportar `StreamAbandoned` en turnos correctos; los ID de diagnóstico sin procesar y los
atributos `openclaw.content.*` deben permanecer fuera de la traza. Escribe
`otel-smoke-summary.json` junto a los artefactos de la suite de QA.

La QA de observabilidad se mantiene solo para checkouts de código fuente. El tarball de npm omite intencionalmente
QA Lab, por lo que los carriles de lanzamiento Docker de paquete no ejecutan comandos `qa`. Usa
`pnpm qa:otel:smoke` desde un checkout de código fuente construido cuando cambies la instrumentación
de diagnósticos.

Para un carril smoke de Matrix con transporte real, ejecuta:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La referencia completa de CLI, el catálogo de perfiles/escenarios, las variables de entorno y el diseño de artefactos de este carril están en [QA de Matrix](/es/concepts/qa-matrix). En resumen: aprovisiona un homeserver Tuwunel desechable en Docker, registra usuarios temporales de controlador/SUT/observador, ejecuta el Plugin real de Matrix dentro de un Gateway de QA secundario limitado a ese transporte (sin `qa-channel`) y luego escribe un informe en Markdown, un resumen JSON, un artefacto de eventos observados y un registro de salida combinado bajo `.artifacts/qa-e2e/matrix-<timestamp>/`.

Los escenarios cubren comportamientos de transporte que las pruebas unitarias no pueden demostrar de extremo a extremo: compuerta de menciones, políticas allow-bot, listas de permitidos, respuestas de nivel superior y en hilos, enrutamiento de DM, manejo de reacciones, supresión de ediciones entrantes, deduplicación de repetición tras reinicio, recuperación ante interrupción del homeserver, entrega de metadatos de aprobación, manejo de medios y flujos de arranque/recuperación/verificación de E2EE de Matrix. El perfil CLI de E2EE también ejecuta `openclaw matrix encryption setup` y comandos de verificación a través del mismo homeserver desechable antes de comprobar las respuestas del Gateway.

Discord también tiene escenarios opcionales solo de Mantis para reproducción de errores. Usa
`--scenario discord-status-reactions-tool-only` para la línea temporal explícita de reacciones de estado,
o `--scenario discord-thread-reply-filepath-attachment` para crear un
hilo real de Discord y verificar que `message.thread-reply` preserve un adjunto
`filePath`. Estos escenarios quedan fuera del carril Discord en vivo predeterminado
porque son sondas de reproducción antes/después, no cobertura smoke amplia.
El flujo de trabajo de Mantis para adjuntos de hilo también puede añadir un video testigo de Discord Web
con sesión iniciada cuando `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` o
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` está configurado en el entorno de QA.
Ese perfil de visor es solo para captura visual; la decisión de aprobación/fallo
sigue viniendo del oráculo REST de Discord.

CI usa la misma superficie de comandos en `.github/workflows/qa-live-transports-convex.yml`. Las ejecuciones programadas y manuales predeterminadas ejecutan el perfil rápido de Matrix con credenciales frontier en vivo, `--fast` y `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. El `matrix_profile=all` manual se abre en abanico en los cinco fragmentos de perfil para que el catálogo exhaustivo pueda ejecutarse en paralelo manteniendo un directorio de artefactos por fragmento.

Para carriles smoke de Telegram, Discord y Slack con transporte real:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Apuntan a un canal real preexistente con dos bots (controlador + SUT). Las variables de entorno requeridas, las listas de escenarios, los artefactos de salida y el conjunto de credenciales de Convex están documentados en la [referencia de QA de Telegram, Discord y Slack](#telegram-discord-and-slack-qa-reference) a continuación.

Para una ejecución completa de una VM de escritorio de Slack con rescate por VNC, ejecuta:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ese comando alquila una máquina de escritorio/navegador de Crabbox, ejecuta el carril en vivo de Slack dentro de la VM, abre Slack Web en el navegador VNC, captura el escritorio y copia `slack-qa/`, `slack-desktop-smoke.png` y `slack-desktop-smoke.mp4`, cuando la captura de video está disponible, de vuelta al directorio de artefactos de Mantis. Los alquileres de escritorio/navegador de Crabbox proporcionan por adelantado las herramientas de captura y los paquetes auxiliares de navegador/compilación nativa, así que el escenario solo debería instalar alternativas en alquileres más antiguos. Mantis informa los tiempos totales y por fase en `mantis-slack-desktop-smoke-report.md`, de modo que las ejecuciones lentas muestran si el tiempo se dedicó al calentamiento del alquiler, la obtención de credenciales, la configuración remota o la copia de artefactos. Reutiliza `--lease-id <cbx_...>` después de iniciar sesión manualmente en Slack Web mediante VNC; los alquileres reutilizados también mantienen caliente la caché del almacén pnpm de Crabbox. El valor predeterminado `--hydrate-mode source` verifica desde un checkout de código fuente y ejecuta la instalación/compilación dentro de la VM. Usa `--hydrate-mode prehydrated` solo cuando el espacio de trabajo remoto reutilizado ya tenga `node_modules` y un `dist/` compilado; ese modo omite el costoso paso de instalación/compilación y falla de forma cerrada cuando el espacio de trabajo no está listo. Con `--gateway-setup`, Mantis deja un Gateway persistente de OpenClaw Slack ejecutándose dentro de la VM en el puerto `38973`; sin esa opción, el comando ejecuta el carril normal de QA de Slack bot a bot y sale después de capturar los artefactos.

La lista de verificación del operador, el comando de despacho del flujo de trabajo de GitHub, el contrato de comentario de evidencia, la tabla de decisión de modo de hidratación, la interpretación de tiempos y los pasos de gestión de fallos están en [Runbook de escritorio Slack de Mantis](/es/concepts/mantis-slack-desktop-runbook).

Para una tarea de escritorio de estilo agente/CV, ejecuta:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` alquila o reutiliza una máquina de escritorio/navegador de Crabbox, inicia `crabbox record --while`, controla el navegador visible mediante un `visual-driver` anidado, captura `visual-task.png`, ejecuta `openclaw infer image describe` contra la captura de pantalla cuando se selecciona `--vision-mode image-describe`, y escribe `visual-task.mp4`, `mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json` y `mantis-visual-task-report.md`. Cuando `--expect-text` está definido, el prompt de visión pide un veredicto JSON estructurado y solo aprueba cuando el modelo informa evidencia visible positiva; una respuesta negativa que solo cite el texto objetivo falla la aserción. Usa `--vision-mode metadata` para un smoke sin modelo que demuestre la infraestructura de escritorio, navegador, captura de pantalla y video sin llamar a un proveedor de comprensión de imágenes. La grabación es un artefacto requerido para `visual-task`; si Crabbox no graba ningún `visual-task.mp4` no vacío, la tarea falla aunque el controlador visual haya aprobado. En caso de fallo, Mantis conserva el alquiler para VNC salvo que la tarea ya hubiera aprobado y `--keep-lease` no estuviera definido.

Antes de usar credenciales en vivo agrupadas, ejecuta:

```bash
pnpm openclaw qa credentials doctor
```

El doctor comprueba el entorno del broker Convex, valida la configuración de endpoints y verifica la accesibilidad de admin/list cuando el secreto del mantenedor está presente. Solo informa el estado definido/ausente de los secretos.

## Cobertura de transporte en vivo

Los carriles de transporte en vivo comparten un único contrato en lugar de que cada uno invente su propia forma de lista de escenarios. `qa-channel` es la suite sintética amplia de comportamiento de producto y no forma parte de la matriz de cobertura de transporte en vivo.

| Carril   | Canary | Control de menciones | Bot a bot | Bloqueo por lista permitida | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento en hilo | Aislamiento de hilo | Observación de reacción | Comando de ayuda | Registro de comando nativo |
| -------- | ------ | -------------------- | --------- | --------------------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------ | ---------------- | -------------------------- |
| Matrix   | x      | x                    | x         | x                           | x                           | x                         | x                   | x                   | x                        |                  |                            |
| Telegram | x      | x                    | x         |                             |                             |                           |                     |                     |                          | x                |                            |
| Discord  | x      | x                    | x         |                             |                             |                           |                     |                     |                          |                  | x                          |
| Slack    | x      | x                    | x         | x                           | x                           | x                         | x                   | x                   |                          |                  |                            |

Esto mantiene `qa-channel` como la suite amplia de comportamiento de producto, mientras Matrix, Telegram y los futuros transportes en vivo comparten una lista de verificación explícita de contrato de transporte.

Para un carril de VM Linux descartable sin introducir Docker en la ruta de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto arranca un invitado Multipass nuevo, instala dependencias, compila OpenClaw dentro del invitado, ejecuta `qa suite` y luego copia el informe y el resumen normales de QA de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de suite en host y Multipass ejecutan de forma predeterminada varios escenarios seleccionados en paralelo con trabajadores de Gateway aislados. `qa-channel` usa por defecto una concurrencia de 4, limitada por el número de escenarios seleccionados. Usa `--concurrency <count>` para ajustar el número de trabajadores, o `--concurrency 1` para la ejecución en serie.
El comando sale con estado distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando quieras artefactos sin un código de salida fallido.
Las ejecuciones en vivo reenvían las entradas de autenticación de QA compatibles que son prácticas para el invitado: claves de proveedor basadas en entorno, la ruta de configuración del proveedor en vivo de QA y `CODEX_HOME` cuando está presente. Mantén `--output-dir` bajo la raíz del repositorio para que el invitado pueda escribir de vuelta mediante el espacio de trabajo montado.

## Referencia de QA de Telegram, Discord y Slack

Matrix tiene una [página dedicada](/es/concepts/qa-matrix) debido a su cantidad de escenarios y al aprovisionamiento de homeserver respaldado por Docker. Telegram, Discord y Slack son más pequeños: un puñado de escenarios cada uno, sin sistema de perfiles, contra canales reales preexistentes, así que su referencia vive aquí.

### Flags de CLI compartidos

Estos carriles se registran mediante `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` y aceptan los mismos flags:

| Flag                                  | Predeterminado                                                 | Descripción                                                                                                                        |
| ------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                              | Ejecuta solo este escenario. Repetible.                                                                                            |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Donde se escriben los informes/resumen/mensajes observados y el registro de salida. Las rutas relativas se resuelven contra `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Raíz del repositorio al invocar desde un cwd neutral.                                                                               |
| `--sut-account <id>`                  | `sut`                                                          | Id de cuenta temporal dentro de la configuración del Gateway de QA.                                                                 |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` o `live-frontier` (`live-openai` heredado todavía funciona).                                                          |
| `--model <ref>` / `--alt-model <ref>` | valor predeterminado del proveedor                             | Referencias de modelo principal/alternativo.                                                                                       |
| `--fast`                              | desactivado                                                    | Modo rápido del proveedor cuando es compatible.                                                                                     |
| `--credential-source <env\|convex>`   | `env`                                                          | Consulta [pool de credenciales Convex](#convex-credential-pool).                                                                    |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, `maintainer` en caso contrario                     | Rol usado cuando `--credential-source convex`.                                                                                      |

Cada carril sale con estado distinto de cero ante cualquier escenario fallido. `--allow-failures` escribe artefactos sin establecer un código de salida fallido.

### QA de Telegram

```bash
pnpm openclaw qa telegram
```

Apunta a un grupo privado real de Telegram con dos bots distintos (controlador + SUT). El bot SUT debe tener un nombre de usuario de Telegram; la observación bot a bot funciona mejor cuando ambos bots tienen habilitado **Bot-to-Bot Communication Mode** en `@BotFather`.

Entorno requerido cuando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id numérico de chat (cadena).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserva los cuerpos de mensaje en los artefactos de mensajes observados (por defecto los redacta).

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

Apunta a un canal de guild privado real de Discord con dos bots: un bot controlador controlado por el arnés y un bot SUT iniciado por el Gateway hijo de OpenClaw mediante el Plugin de Discord incluido. Verifica el manejo de menciones en el canal, que el bot SUT haya registrado el comando nativo `/help` con Discord, y escenarios de evidencia Mantis con opt-in.

Entorno requerido cuando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - debe coincidir con el id de usuario del bot SUT devuelto por Discord (si no, el carril falla rápido).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserva los cuerpos de mensaje en los artefactos de mensajes observados.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` selecciona el canal de voz/escenario para `discord-voice-autojoin`; sin él, el escenario elige el primer canal de voz/escenario visible para el bot SUT.

Escenarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - escenario de voz opcional. Se ejecuta por sí solo, habilita `channels.discord.voice.autoJoin` y verifica que el estado de voz actual de Discord del bot SUT sea el canal de voz/escenario de destino. Las credenciales de Discord de Convex pueden incluir `voiceChannelId` opcional; de lo contrario, el ejecutor descubre el primer canal de voz/escenario visible en el servidor.
- `discord-status-reactions-tool-only` - escenario Mantis opcional. Se ejecuta por sí solo porque cambia el SUT a respuestas de servidor siempre activas y solo con herramientas con `messages.statusReactions.enabled=true`; luego captura una línea de tiempo de reacciones REST y artefactos visuales HTML/PNG. Los informes antes/después de Mantis también conservan los artefactos MP4 proporcionados por el escenario como `baseline.mp4` y `candidate.mp4`.

Ejecuta explícitamente el escenario de auto-unión de voz de Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

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
- `discord-qa-observed-messages.json` - cuerpos redactados salvo que `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` y `discord-status-reactions-tool-only-timeline.png` cuando se ejecuta el escenario de reacciones de estado.

### QA de Slack

```bash
pnpm openclaw qa slack
```

Apunta a un canal privado real de Slack con dos bots distintos: un bot controlador manejado por el arnés y un bot SUT iniciado por el Gateway hijo de OpenClaw mediante el Plugin de Slack incluido.

Entorno requerido cuando `--credential-source env`:

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

#### Configurar el espacio de trabajo de Slack

La vía necesita dos apps de Slack distintas en un espacio de trabajo, además de un canal del que ambos bots sean miembros:

- `channelId` - el id `Cxxxxxxxxxx` de un canal al que ambos bots hayan sido invitados. Usa un canal dedicado; la vía publica en cada ejecución.
- `driverBotToken` - token de bot (`xoxb-...`) de la app **Driver**.
- `sutBotToken` - token de bot (`xoxb-...`) de la app **SUT**, que debe ser una app de Slack separada del controlador para que su id de usuario de bot sea distinto.
- `sutAppToken` - token de nivel de app (`xapp-...`) de la app SUT con `connections:write`, usado por Socket Mode para que la app SUT pueda recibir eventos.

Prefiere un espacio de trabajo de Slack dedicado a QA antes que reutilizar un espacio de trabajo de producción.

El manifiesto SUT siguiente reduce intencionadamente la instalación de producción del Plugin de Slack incluido (`extensions/slack/src/setup-shared.ts:10`) a los permisos y eventos cubiertos por el conjunto de QA en vivo de Slack. Para la configuración del canal de producción tal como la ven los usuarios, consulta [Configuración rápida del canal de Slack](/es/channels/slack#quick-setup); el par QA Driver/SUT está separado intencionadamente porque la vía necesita dos ids de usuario de bot distintos en un espacio de trabajo.

**1. Crea la app Driver**

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

Copia el _Bot User OAuth Token_ (`xoxb-...`): ese se convierte en `driverBotToken`. El controlador solo necesita publicar mensajes e identificarse; sin eventos, sin Socket Mode.

**2. Crea la app SUT**

Repite _Create New App → From a manifest_ en el mismo espacio de trabajo. Esta app de QA usa intencionadamente una versión más restringida del manifiesto de producción del Plugin de Slack incluido (`extensions/slack/src/setup-shared.ts:10`): se omiten los ámbitos y eventos de reacciones porque el conjunto de QA en vivo de Slack aún no cubre el manejo de reacciones.

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

Después de que Slack cree la app, haz dos cosas en su página de configuración:

- _Install to Workspace_ → copia el _Bot User OAuth Token_ → ese se convierte en `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → añade el ámbito `connections:write` → guarda → copia el valor `xapp-...` → ese se convierte en `sutAppToken`.

Verifica que los dos bots tengan ids de usuario distintos llamando a `auth.test` con cada token. El runtime distingue entre el controlador y el SUT por id de usuario; reutilizar una app para ambos hará que la restricción de menciones falle inmediatamente.

**3. Crea el canal**

En el espacio de trabajo de QA, crea un canal (p. ej., `#openclaw-qa`) e invita a ambos bots desde dentro del canal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copia el id `Cxxxxxxxxxx` desde _channel info → About → Channel ID_: ese se convierte en `channelId`. Un canal público funciona; si usas un canal privado, ambas apps ya tienen `groups:history`, así que las lecturas del historial del arnés seguirán funcionando.

**4. Registra las credenciales**

Dos opciones. Usa variables de entorno para depuración en una sola máquina (define las cuatro variables `OPENCLAW_QA_SLACK_*` y pasa `--credential-source env`), o inicializa el pool compartido de Convex para que CI y otros mantenedores puedan arrendarlas.

Para el pool de Convex, escribe los cuatro campos en un archivo JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Con `OPENCLAW_QA_CONVEX_SITE_URL` y `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` exportados en tu shell, registra y verifica:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Espera `count: 1`, `status: "active"`, sin campo `lease`.

**5. Verifica de extremo a extremo**

Ejecuta la vía localmente para confirmar que ambos bots puedan hablar entre sí a través del broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Una ejecución verde se completa en bastante menos de 30 segundos y `slack-qa-report.md` muestra tanto `slack-canary` como `slack-mention-gating` con estado `pass`. Si la vía se queda colgada durante unos 90 segundos y sale con `Convex credential pool exhausted for kind "slack"`, o el pool está vacío o todas las filas están arrendadas: `qa credentials list --kind slack --status all --json` te indicará cuál caso es.

### Pool de credenciales de Convex

Las vías de Telegram, Discord y Slack pueden arrendar credenciales de un pool compartido de Convex en lugar de leer las variables de entorno anteriores. Pasa `--credential-source convex` (o define `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab adquiere un arrendamiento exclusivo, le envía Heartbeat durante la ejecución y lo libera al apagarse. Los tipos de pool son `"telegram"`, `"discord"` y `"slack"`.

Formas de payload que el broker valida en `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` debe ser una cadena numérica de id de chat.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` debe coincidir con `^[A-Z][A-Z0-9]+$` (un id de Slack como `Cxxxxxxxxxx`). Consulta [Configurar el espacio de trabajo de Slack](#setting-up-the-slack-workspace) para el aprovisionamiento de apps y ámbitos.

Las variables de entorno operativas y el contrato del endpoint del broker de Convex están en [Pruebas → Credenciales compartidas de Telegram mediante Convex](/es/help/testing#shared-telegram-credentials-via-convex-v1) (el nombre de la sección es anterior al soporte de Discord; la semántica del broker es idéntica para ambos tipos).

## Semillas respaldadas por el repo

Los recursos semilla están en `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Estos están intencionadamente en git para que el plan de QA sea visible tanto para humanos como para el agente.

`qa-lab` debe seguir siendo un ejecutor genérico de markdown. Cada archivo markdown de escenario es la fuente de verdad de una ejecución de prueba y debe definir:

- metadatos del escenario
- metadatos opcionales de categoría, capacidad, vía y riesgo
- referencias de documentación y código
- requisitos opcionales de Plugin
- parche opcional de configuración del Gateway
- el `qa-flow` ejecutable

La superficie de runtime reutilizable que respalda `qa-flow` puede seguir siendo genérica y transversal. Por ejemplo, los escenarios markdown pueden combinar helpers del lado de transporte con helpers del lado del navegador que controlan la Control UI embebida mediante la interfaz `browser.request` del Gateway sin añadir un ejecutor de caso especial.

Los archivos de escenario deben agruparse por capacidad de producto en lugar de por carpeta del árbol de código fuente. Mantén estables los IDs de escenario cuando se muevan archivos; usa `docsRefs` y `codeRefs` para la trazabilidad de implementación.

La lista base debe seguir siendo lo bastante amplia para cubrir:

- chat por DM y canal
- comportamiento de hilos
- ciclo de vida de acciones de mensaje
- callbacks de Cron
- recuperación de memoria
- cambio de modelo
- traspaso a subagente
- lectura de repos y lectura de documentación
- una pequeña tarea de compilación, como Lobster Invaders

## Vías simuladas de proveedor

`qa suite` tiene dos vías locales simuladas de proveedor:

- `mock-openai` es el simulador de OpenClaw consciente de escenarios. Sigue siendo la vía simulada determinista predeterminada para QA respaldado por el repo y puertas de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo, fixtures, grabación/reproducción y caos. Es aditivo y no reemplaza el despachador de escenarios `mock-openai`.

La implementación de vías de proveedor está en `extensions/qa-lab/src/providers/`. Cada proveedor posee sus valores predeterminados, arranque de servidor local, configuración de modelo de Gateway, necesidades de preparación de perfiles de autenticación y flags de capacidad en vivo/simulada. El código compartido del conjunto y del Gateway debe enrutar mediante el registro de proveedores en lugar de ramificar por nombres de proveedor.

## Adaptadores de transporte

`qa-lab` es propietario de una costura de transporte genérica para escenarios de QA en markdown. `qa-channel` es el primer adaptador sobre esa costura, pero el objetivo de diseño es más amplio: los canales reales o sintéticos futuros deberían conectarse al mismo runner de suites en lugar de añadir un runner de QA específico del transporte.

En el nivel de arquitectura, la división es:

- `qa-lab` es propietario de la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos y los informes.
- El adaptador de transporte es propietario de la configuración del Gateway, la preparación, la observación de entrada y salida, las acciones de transporte y el estado de transporte normalizado.
- Los archivos de escenarios en markdown bajo `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie de runtime reutilizable que los ejecuta.

### Añadir un canal

Añadir un canal al sistema de QA en markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejercite el contrato del canal.

No añadas una nueva raíz de comando de QA de nivel superior cuando el host compartido `qa-lab` puede ser propietario del flujo.

`qa-lab` es propietario de la mecánica compartida del host:

- la raíz de comando `openclaw qa`
- inicio y cierre de suites
- concurrencia de workers
- escritura de artefactos
- generación de informes
- ejecución de escenarios
- alias de compatibilidad para escenarios antiguos de `qa-channel`

Los plugins de runner son propietarios del contrato de transporte:

- cómo se monta `openclaw qa <runner>` debajo de la raíz compartida `qa`
- cómo se configura el Gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan los eventos entrantes
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado de transporte normalizado
- cómo se ejecutan las acciones respaldadas por transporte
- cómo se gestiona el restablecimiento o la limpieza específicos del transporte

El nivel mínimo de adopción para un canal nuevo:

1. Mantén `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementa el runner de transporte sobre la costura del host compartido `qa-lab`.
3. Mantén la mecánica específica del transporte dentro del plugin de runner o del arnés del canal.
4. Monta el runner como `openclaw qa <runner>` en lugar de registrar un comando raíz competidor. Los plugins de runner deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un array `qaRunnerCliRegistrations` coincidente desde `runtime-api.ts`. Mantén `runtime-api.ts` ligero; la CLI diferida y la ejecución del runner deben permanecer detrás de entrypoints separados.
5. Crea o adapta escenarios en markdown bajo los directorios temáticos `qa/scenarios/`.
6. Usa los helpers genéricos de escenarios para escenarios nuevos.
7. Mantén funcionando los alias de compatibilidad existentes salvo que el repo esté haciendo una migración intencional.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una vez en `qa-lab`, ponlo en `qa-lab`.
- Si el comportamiento depende de un transporte de canal, mantenlo en ese plugin de runner o arnés del plugin.
- Si un escenario necesita una capacidad que más de un canal puede usar, añade un helper genérico en lugar de una rama específica del canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario específico del transporte y hazlo explícito en el contrato del escenario.

### Nombres de helpers de escenarios

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

Los alias de compatibilidad siguen disponibles para escenarios existentes: `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`; pero la creación de escenarios nuevos debería usar los nombres genéricos. Los alias existen para evitar una migración de día señalado, no como el modelo a futuro.

## Informes

`qa-lab` exporta un informe de protocolo en Markdown a partir de la línea temporal del bus observada.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué siguió bloqueado
- Qué escenarios de seguimiento vale la pena añadir

Para el inventario de escenarios disponibles, útil al dimensionar trabajo de seguimiento o cablear un transporte nuevo, ejecuta `pnpm openclaw qa coverage` (añade `--json` para salida legible por máquinas).

Para comprobaciones de carácter y estilo, ejecuta el mismo escenario con varias refs de modelos en vivo y escribe un informe en Markdown evaluado:

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

El comando ejecuta procesos secundarios locales del Gateway de QA, no Docker. Los escenarios de evaluación de carácter deben establecer la persona mediante `SOUL.md` y luego ejecutar turnos de usuario ordinarios, como chat, ayuda de workspace y tareas pequeñas de archivos. No se debe decir al modelo candidato que está siendo evaluado. El comando preserva cada transcripción completa, registra estadísticas básicas de ejecución y luego pide a los modelos jueces en modo rápido con razonamiento `xhigh`, donde se admita, que clasifiquen las ejecuciones por naturalidad, tono y humor.
Usa `--blind-judge-models` al comparar proveedores: el prompt del juez sigue recibiendo cada transcripción y estado de ejecución, pero las refs candidatas se sustituyen por etiquetas neutrales como `candidate-01`; el informe asigna de nuevo las clasificaciones a las refs reales después del análisis.
Las ejecuciones candidatas usan por defecto razonamiento `high`, con `medium` para GPT-5.5 y `xhigh` para refs de evaluación antiguas de OpenAI que lo admiten. Sobrescribe un candidato específico inline con `--model provider/model,thinking=<level>`. `--thinking <level>` sigue definiendo un fallback global, y la forma anterior `--model-thinking <provider/model=level>` se conserva por compatibilidad.
Las refs candidatas de OpenAI usan por defecto el modo rápido para que se use el procesamiento prioritario donde el proveedor lo admita. Añade `,fast`, `,no-fast` o `,fast=false` inline cuando un único candidato o juez necesite una sobrescritura. Pasa `--fast` solo cuando quieras forzar el modo rápido para todos los modelos candidatos. Las duraciones de candidatos y jueces se registran en el informe para análisis de benchmark, pero los prompts de juez dicen explícitamente que no clasifiquen por velocidad.
Las ejecuciones de modelos candidatos y jueces usan ambas concurrencia 16 por defecto. Baja `--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión del Gateway local hagan que una ejecución sea demasiado ruidosa.
Cuando no se pasa ningún `--model` candidato, la evaluación de carácter usa por defecto `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` y `google/gemini-3.1-pro-preview` cuando no se pasa ningún `--model`.
Cuando no se pasa ningún `--judge-model`, los jueces usan por defecto `openai/gpt-5.5,thinking=xhigh,fast` y `anthropic/claude-opus-4-6,thinking=high`.

## Documentación relacionada

- [QA de matriz](/es/concepts/qa-matrix)
- [Canal de QA](/es/channels/qa-channel)
- [Pruebas](/es/help/testing)
- [Dashboard](/es/web/dashboard)
