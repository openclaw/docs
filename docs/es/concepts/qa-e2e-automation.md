---
read_when:
    - Comprender cómo encaja la pila de QA
    - Ampliar qa-lab, qa-channel o un adaptador de transporte
    - Añadir escenarios de control de calidad respaldados por repositorio
    - Creación de automatización de control de calidad de mayor realismo en torno al panel del Gateway
summary: 'Resumen de la pila de QA: qa-lab, qa-channel, escenarios respaldados por el repositorio, vías de transporte en vivo, adaptadores de transporte y generación de informes.'
title: Resumen de QA
x-i18n:
    generated_at: "2026-05-05T01:45:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
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
- `qa/`: recursos semilla respaldados por el repositorio para la tarea inicial y los escenarios
  base de QA.
- [Mantis](/es/concepts/mantis): verificación en vivo antes y después para errores que
  necesitan transportes reales, capturas de navegador, estado de VM y evidencia de PR.

## Superficie de comandos

Cada flujo de QA se ejecuta bajo `pnpm openclaw qa <subcommand>`. Muchos tienen alias de scripts `pnpm qa:*`; se admiten ambas formas.

| Comando                                             | Propósito                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autocomprobación de QA incluida; escribe un informe en Markdown.                                                                                                                                             |
| `qa suite`                                          | Ejecuta escenarios respaldados por el repositorio contra el carril del Gateway de QA. Alias: `pnpm openclaw qa suite --runner multipass` para una VM Linux desechable.                                                       |
| `qa coverage`                                       | Imprime el inventario Markdown de cobertura de escenarios (`--json` para salida de máquina).                                                                                                                |
| `qa parity-report`                                  | Compara dos archivos `qa-suite-summary.json` y escribe el informe de paridad agéntica.                                                                                                               |
| `qa character-eval`                                 | Ejecuta el escenario de QA de carácter en varios modelos en vivo con un informe evaluado. Consulta [Informes](#reporting).                                                                                 |
| `qa manual`                                         | Ejecuta un prompt puntual contra el carril de proveedor/modelo seleccionado.                                                                                                                               |
| `qa ui`                                             | Inicia la interfaz de depuración de QA y el bus local de QA (alias: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | Construye la imagen Docker de QA precompilada.                                                                                                                                                          |
| `qa docker-scaffold`                                | Escribe una plantilla docker-compose para el panel de QA + carril de Gateway.                                                                                                                         |
| `qa up`                                             | Construye el sitio de QA, inicia la pila respaldada por Docker e imprime la URL (alias: `pnpm qa:lab:up`; la variante `:fast` agrega `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                       |
| `qa aimock`                                         | Inicia solo el servidor proveedor AIMock.                                                                                                                                                       |
| `qa mock-openai`                                    | Inicia solo el servidor proveedor `mock-openai` consciente de escenarios.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Administra el pool compartido de credenciales de Convex.                                                                                                                                                    |
| `qa matrix`                                         | Carril de transporte en vivo contra un homeserver Tuwunel desechable. Consulta [QA de Matrix](/es/concepts/qa-matrix).                                                                                           |
| `qa telegram`                                       | Carril de transporte en vivo contra un grupo privado real de Telegram.                                                                                                                                   |
| `qa discord`                                        | Carril de transporte en vivo contra un canal real de servidor Discord privado.                                                                                                                            |
| `qa slack`                                          | Carril de transporte en vivo contra un canal privado real de Slack.                                                                                                                                    |
| `qa mantis`                                         | Ejecutor de verificación antes y después para errores de transporte en vivo, con evidencia de reacciones de estado en Discord, smoke de escritorio/navegador Crabbox y smoke de Slack en VNC. Consulta [Mantis](/es/concepts/mantis). |

## Flujo del operador

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel de Gateway (Control UI) con el agente.
- Derecha: QA Lab, que muestra la transcripción similar a Slack y el plan del escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso construye el sitio de QA, inicia el carril de Gateway respaldado por Docker y expone la
página de QA Lab donde un operador o bucle de automatización puede dar al agente una
misión de QA, observar el comportamiento real del canal y registrar lo que funcionó, falló o
quedó bloqueado.

Para iterar más rápido en la interfaz de QA Lab sin reconstruir la imagen Docker cada vez,
inicia la pila con un paquete de QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios Docker en una imagen precompilada y monta por bind
`extensions/qa-lab/web/dist` dentro del contenedor `qa-lab`. `qa:lab:watch`
reconstruye ese paquete al cambiar, y el navegador se recarga automáticamente cuando cambia el hash de recursos de QA Lab.

Para un smoke local de trazas de OpenTelemetry, ejecuta:

```bash
pnpm qa:otel:smoke
```

Ese script inicia un receptor local de trazas OTLP/HTTP, ejecuta el escenario de QA
`otel-trace-smoke` con el plugin `diagnostics-otel` habilitado, luego decodifica
los spans protobuf exportados y verifica la forma crítica para la release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` y `openclaw.message.delivery` deben estar presentes;
las llamadas al modelo no deben exportar `StreamAbandoned` en turnos exitosos; los ID de diagnóstico sin procesar y los
atributos `openclaw.content.*` deben quedarse fuera de la traza. Escribe
`otel-smoke-summary.json` junto a los artefactos de la suite de QA.

El QA de observabilidad permanece solo para checkout de código fuente. El tarball de npm omite intencionalmente
QA Lab, por lo que los carriles de release Docker de paquetes no ejecutan comandos `qa`. Usa
`pnpm qa:otel:smoke` desde un checkout de código fuente construido al cambiar la instrumentación de diagnósticos.

Para un carril de smoke de Matrix con transporte real, ejecuta:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La referencia completa de CLI, el catálogo de perfiles/escenarios, las variables de entorno y el diseño de artefactos para este carril están en [QA de Matrix](/es/concepts/qa-matrix). En resumen: aprovisiona un homeserver Tuwunel desechable en Docker, registra usuarios temporales de controlador/SUT/observador, ejecuta el plugin real de Matrix dentro de un Gateway de QA hijo limitado a ese transporte (sin `qa-channel`), luego escribe un informe en Markdown, un resumen JSON, un artefacto de eventos observados y un registro de salida combinado bajo `.artifacts/qa-e2e/matrix-<timestamp>/`.

Para carriles de smoke con transporte real de Telegram, Discord y Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Apuntan a un canal real preexistente con dos bots (controlador + SUT). Las variables de entorno requeridas, las listas de escenarios, los artefactos de salida y el pool de credenciales de Convex están documentados en la [referencia de QA de Telegram, Discord y Slack](#telegram-discord-and-slack-qa-reference) a continuación.

Para una ejecución completa de VM de escritorio Slack con rescate VNC, ejecuta:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ese comando reserva una máquina Crabbox de escritorio/navegador, ejecuta el carril en vivo de Slack
dentro de la VM, abre Slack Web en el navegador VNC, captura el escritorio y
copia `slack-qa/` junto con `slack-desktop-smoke.png` al directorio de artefactos de Mantis.
Reutiliza `--lease-id <cbx_...>` después de iniciar sesión manualmente en Slack Web
mediante VNC. Con `--gateway-setup`, Mantis deja un Gateway persistente de OpenClaw Slack
ejecutándose dentro de la VM en el puerto `38973`; sin eso, el comando ejecuta el
carril normal de QA de Slack bot-a-bot y sale después de capturar artefactos.

Antes de usar credenciales en vivo agrupadas, ejecuta:

```bash
pnpm openclaw qa credentials doctor
```

El doctor comprueba el entorno del broker Convex, valida la configuración del endpoint y verifica la alcanzabilidad de admin/list cuando está presente el secreto del mantenedor. Informa solo el estado establecido/faltante de los secretos.

## Cobertura de transporte en vivo

Los carriles de transporte en vivo comparten un contrato en lugar de que cada uno invente su propia forma de lista de escenarios. `qa-channel` es la suite sintética amplia de comportamiento del producto y no forma parte de la matriz de cobertura de transporte en vivo.

| Carril   | Canary | Puerta por mención | Bot-a-bot | Bloqueo de lista permitida | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento en hilo | Aislamiento de hilo | Observación de reacción | Comando de ayuda | Registro de comando nativo |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

Esto mantiene `qa-channel` como la suite amplia de comportamiento del producto mientras Matrix,
Telegram y futuros transportes en vivo comparten una lista de comprobación explícita de contrato de transporte.

Para un carril de VM Linux desechable sin llevar Docker a la ruta de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto arranca un invitado Multipass nuevo, instala dependencias, compila OpenClaw
dentro del invitado, ejecuta `qa suite`, y luego copia el informe normal de QA y el
resumen de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de la suite en el host y en Multipass ejecutan varios escenarios seleccionados en paralelo
con trabajadores de gateway aislados de forma predeterminada. `qa-channel` usa concurrencia
4 de forma predeterminada, limitada por la cantidad de escenarios seleccionados. Usa `--concurrency <count>` para ajustar
la cantidad de trabajadores, o `--concurrency 1` para la ejecución en serie.
El comando sale con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida fallido.
Las ejecuciones en vivo reenvían las entradas de autenticación de QA compatibles que son prácticas para el
invitado: claves de proveedor basadas en env, la ruta de configuración del proveedor en vivo de QA, y
`CODEX_HOME` cuando está presente. Mantén `--output-dir` bajo la raíz del repositorio para que el invitado
pueda escribir de vuelta a través del workspace montado.

## Referencia de QA para Telegram, Discord y Slack

Matrix tiene una [página dedicada](/es/concepts/qa-matrix) por su cantidad de escenarios y el aprovisionamiento de homeserver respaldado por Docker. Telegram, Discord y Slack son más pequeños: un puñado de escenarios cada uno, sin sistema de perfiles, contra canales reales preexistentes, por lo que su referencia vive aquí.

### Flags compartidos de CLI

Estos carriles se registran a través de `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` y aceptan los mismos flags:

| Flag                                  | Predeterminado                                                 | Descripción                                                                                                                      |
| ------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                              | Ejecuta solo este escenario. Repetible.                                                                                          |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Donde se escriben informes/resumen/mensajes observados y el registro de salida. Las rutas relativas se resuelven contra `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Raíz del repositorio al invocar desde un cwd neutral.                                                                             |
| `--sut-account <id>`                  | `sut`                                                          | Id de cuenta temporal dentro de la configuración del Gateway de QA.                                                               |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` o `live-frontier` (`live-openai` heredado aún funciona).                                                            |
| `--model <ref>` / `--alt-model <ref>` | valor predeterminado del proveedor                             | Referencias de modelo principal/alternativo.                                                                                     |
| `--fast`                              | desactivado                                                    | Modo rápido del proveedor donde sea compatible.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                          | Consulta [pool de credenciales de Convex](#convex-credential-pool).                                                              |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, `maintainer` en caso contrario                     | Rol usado cuando `--credential-source convex`.                                                                                    |

Cada carril sale con un código distinto de cero ante cualquier escenario fallido. `--allow-failures` escribe artefactos sin establecer un código de salida fallido.

### QA de Telegram

```bash
pnpm openclaw qa telegram
```

Apunta a un grupo privado real de Telegram con dos bots distintos (driver + SUT). El bot SUT debe tener un nombre de usuario de Telegram; la observación bot a bot funciona mejor cuando ambos bots tienen **Bot-to-Bot Communication Mode** habilitado en `@BotFather`.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id numérico de chat (cadena).
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
- `telegram-qa-summary.json` — incluye RTT por respuesta (envío del driver → respuesta SUT observada) a partir del canario.
- `telegram-qa-observed-messages.json` — cuerpos redactados salvo que `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA de Discord

```bash
pnpm openclaw qa discord
```

Apunta a un canal real de guild privada de Discord con dos bots: un bot driver controlado por el harness y un bot SUT iniciado por el Gateway hijo de OpenClaw a través del plugin Discord incluido. Verifica el manejo de menciones de canal, que el bot SUT haya registrado el comando nativo `/help` con Discord, y escenarios de evidencia Mantis opcionales.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — debe coincidir con el id de usuario del bot SUT devuelto por Discord (si no, el carril falla rápido).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en los artefactos de mensajes observados.

Escenarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — escenario Mantis opcional. Se ejecuta por sí solo porque cambia el SUT a respuestas de guild siempre activas y solo con herramientas con `messages.statusReactions.enabled=true`, luego captura una línea de tiempo de reacciones REST más un artefacto visual HTML/PNG.

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

Apunta a un canal privado real de Slack con dos bots distintos: un bot driver controlado por el harness y un bot SUT iniciado por el Gateway hijo de OpenClaw a través del plugin Slack incluido.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en los artefactos de mensajes observados.

Escenarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artefactos de salida:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — cuerpos redactados salvo que `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Configurar el workspace de Slack

El carril necesita dos apps de Slack distintas en un workspace, además de un canal del que ambos bots sean miembros:

- `channelId` — el id `Cxxxxxxxxxx` de un canal al que ambos bots hayan sido invitados. Usa un canal dedicado; el carril publica en cada ejecución.
- `driverBotToken` — token de bot (`xoxb-...`) de la app **Driver**.
- `sutBotToken` — token de bot (`xoxb-...`) de la app **SUT**, que debe ser una app de Slack separada del driver para que su id de usuario de bot sea distinto.
- `sutAppToken` — token de nivel de app (`xapp-...`) de la app SUT con `connections:write`, usado por Socket Mode para que la app SUT pueda recibir eventos.

Prefiere un workspace de Slack dedicado a QA en lugar de reutilizar un workspace de producción.

El manifiesto SUT siguiente refleja la instalación de producción del plugin Slack incluido (`extensions/slack/src/setup-shared.ts:10`). Para la configuración del canal de producción tal como la ven los usuarios, consulta [configuración rápida del canal de Slack](/es/channels/slack#quick-setup); el par Driver/SUT de QA es intencionalmente separado porque el carril necesita dos ids de usuario de bot distintos en un workspace.

**1. Crea la app Driver**

Ve a [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → elige el workspace de QA, pega el siguiente manifiesto y luego _Install to Workspace_:

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

Copia el _Bot User OAuth Token_ (`xoxb-...`): eso se convierte en `driverBotToken`. El driver solo necesita publicar mensajes e identificarse; sin eventos, sin Socket Mode.

**2. Crea la app SUT**

Repite _Create New App → From a manifest_ en el mismo workspace. El conjunto de permisos refleja la instalación de producción del plugin Slack incluido (`extensions/slack/src/setup-shared.ts:10`):

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
        "reactions:read",
        "reactions:write",
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
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Después de que Slack cree la app, haz dos cosas en su página de configuración:

- _Install to Workspace_ → copia el _Bot User OAuth Token_ → eso se convierte en `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → agrega el permiso `connections:write` → guarda → copia el valor `xapp-...` → eso se convierte en `sutAppToken`.

Verifica que los dos bots tengan ids de usuario distintos llamando a `auth.test` en cada token. El runtime distingue el controlador y el SUT por id de usuario; reutilizar una app para ambos hará que la compuerta de menciones falle inmediatamente.

**3. Crea el canal**

En el espacio de trabajo de QA, crea un canal (por ejemplo, `#openclaw-qa`) e invita a ambos bots desde dentro del canal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copia el id `Cxxxxxxxxxx` desde _información del canal → Acerca de → ID del canal_; eso se convierte en `channelId`. Un canal público funciona; si usas un canal privado, ambas apps ya tienen `groups:history`, así que las lecturas de historial del harness seguirán funcionando.

**4. Registra las credenciales**

Hay dos opciones. Usa variables de entorno para depurar en una sola máquina (define las cuatro variables `OPENCLAW_QA_SLACK_*` y pasa `--credential-source env`), o siembra el pool compartido de Convex para que CI y otros maintainers puedan alquilarlas.

Para el pool de Convex, escribe los cuatro campos en un archivo JSON:

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

Ejecuta el lane localmente para confirmar que ambos bots puedan hablar entre sí a través del broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Una ejecución correcta termina en bastante menos de 30 segundos y `slack-qa-report.md` muestra tanto `slack-canary` como `slack-mention-gating` con estado `pass`. Si el lane se queda colgado durante ~90 segundos y sale con `Convex credential pool exhausted for kind "slack"`, el pool está vacío o todas las filas están alquiladas; `qa credentials list --kind slack --status all --json` te dirá cuál de las dos cosas ocurre.

### Pool de credenciales de Convex

Los lanes de Telegram, Discord y Slack pueden alquilar credenciales desde un pool compartido de Convex en lugar de leer las variables de entorno anteriores. Pasa `--credential-source convex` (o define `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab adquiere un alquiler exclusivo, le envía Heartbeat durante toda la ejecución y lo libera al apagarse. Los tipos de pool son `"telegram"`, `"discord"` y `"slack"`.

Formas de payload que el broker valida en `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }`; `groupId` debe ser una cadena de id de chat numérica.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`; `channelId` debe coincidir con `^[A-Z][A-Z0-9]+$` (un id de Slack como `Cxxxxxxxxxx`). Consulta [Configurar el espacio de trabajo de Slack](#setting-up-the-slack-workspace) para el aprovisionamiento de apps y scopes.

Las variables de entorno operativas y el contrato del endpoint del broker de Convex están en [Pruebas → Credenciales compartidas de Telegram mediante Convex](/es/help/testing#shared-telegram-credentials-via-convex-v1) (el nombre de la sección es anterior al soporte de Discord; la semántica del broker es idéntica para ambos tipos).

## Seeds respaldados por el repo

Los assets seed viven en `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Están intencionalmente en git para que el plan de QA sea visible tanto para humanos como para el agente.

`qa-lab` debe seguir siendo un runner genérico de Markdown. Cada archivo Markdown de escenario es la fuente de verdad para una ejecución de prueba y debe definir:

- metadatos del escenario
- metadatos opcionales de categoría, capacidad, lane y riesgo
- referencias de docs y código
- requisitos opcionales de Plugin
- parche opcional de configuración del Gateway
- el `qa-flow` ejecutable

La superficie de runtime reutilizable que respalda `qa-flow` puede seguir siendo genérica y transversal. Por ejemplo, los escenarios Markdown pueden combinar helpers del lado de transporte con helpers del lado del navegador que controlan la Control UI incrustada a través del seam `browser.request` del Gateway sin agregar un runner de caso especial.

Los archivos de escenario deben agruparse por capacidad del producto en lugar de por carpeta del árbol de código fuente. Mantén estables los IDs de escenario cuando se muevan archivos; usa `docsRefs` y `codeRefs` para la trazabilidad de implementación.

La lista de baseline debe seguir siendo lo bastante amplia como para cubrir:

- chat por DM y por canal
- comportamiento de hilos
- ciclo de vida de acciones de mensaje
- callbacks de Cron
- recuperación de memoria
- cambio de modelo
- transferencia a subagente
- lectura de repos y lectura de docs
- una tarea pequeña de build como Lobster Invaders

## Lanes mock de proveedor

`qa suite` tiene dos lanes mock de proveedor locales:

- `mock-openai` es el mock de OpenClaw consciente de escenarios. Sigue siendo el lane mock determinista predeterminado para QA respaldado por el repo y compuertas de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo, fixtures, grabación/reproducción y caos. Es aditivo y no reemplaza al despachador de escenarios `mock-openai`.

La implementación de lanes de proveedor vive bajo `extensions/qa-lab/src/providers/`. Cada proveedor posee sus valores predeterminados, arranque de servidor local, configuración de modelo del Gateway, necesidades de staging de auth-profile y flags de capacidad live/mock. El código compartido de suite y Gateway debe enrutar a través del registro de proveedores en lugar de ramificarse por nombres de proveedor.

## Adaptadores de transporte

`qa-lab` posee un seam de transporte genérico para escenarios de QA en Markdown. `qa-channel` es el primer adaptador sobre ese seam, pero el objetivo de diseño es más amplio: los canales reales o sintéticos futuros deben conectarse al mismo runner de suite en lugar de agregar un runner de QA específico de transporte.

A nivel de arquitectura, la división es:

- `qa-lab` posee la ejecución genérica de escenarios, concurrencia de workers, escritura de artefactos y reportes.
- El adaptador de transporte posee la configuración del Gateway, preparación, observación entrante y saliente, acciones de transporte y estado de transporte normalizado.
- Los archivos de escenario Markdown bajo `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie de runtime reutilizable que los ejecuta.

### Agregar un canal

Agregar un canal al sistema de QA en Markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejercite el contrato del canal.

No agregues una nueva raíz de comando de QA de nivel superior cuando el host compartido `qa-lab` puede poseer el flujo.

`qa-lab` posee la mecánica del host compartido:

- la raíz de comando `openclaw qa`
- arranque y desmontaje de la suite
- concurrencia de workers
- escritura de artefactos
- generación de reportes
- ejecución de escenarios
- aliases de compatibilidad para escenarios antiguos de `qa-channel`

Los Plugins runner poseen el contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura el Gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan eventos entrantes
- cómo se observan mensajes salientes
- cómo se exponen transcripciones y estado de transporte normalizado
- cómo se ejecutan acciones respaldadas por transporte
- cómo se gestiona el reset o la limpieza específicos del transporte

El umbral mínimo de adopción para un nuevo canal:

1. Mantén `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementa el runner de transporte sobre el seam del host compartido `qa-lab`.
3. Mantén la mecánica específica de transporte dentro del Plugin runner o del harness del canal.
4. Monta el runner como `openclaw qa <runner>` en lugar de registrar un comando raíz competidor. Los Plugins runner deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un array `qaRunnerCliRegistrations` correspondiente desde `runtime-api.ts`. Mantén `runtime-api.ts` ligero; la CLI lazy y la ejecución del runner deben quedar detrás de entrypoints separados.
5. Crea o adapta escenarios Markdown bajo los directorios temáticos `qa/scenarios/`.
6. Usa los helpers genéricos de escenarios para escenarios nuevos.
7. Mantén funcionando los aliases de compatibilidad existentes salvo que el repo esté haciendo una migración intencional.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una vez en `qa-lab`, ponlo en `qa-lab`.
- Si el comportamiento depende de un transporte de canal, mantenlo en ese Plugin runner o harness de Plugin.
- Si un escenario necesita una nueva capacidad que puede usar más de un canal, agrega un helper genérico en lugar de una rama específica de canal en `suite.ts`.
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

Los aliases de compatibilidad siguen disponibles para escenarios existentes: `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`, pero la creación de escenarios nuevos debe usar los nombres genéricos. Los aliases existen para evitar una migración de día fijo, no como el modelo a futuro.

## Reportes

`qa-lab` exporta un informe de protocolo en Markdown a partir de la línea temporal observada del bus. El informe debe responder:

- Qué funcionó
- Qué falló
- Qué quedó bloqueado
- Qué escenarios de seguimiento vale la pena agregar

Para el inventario de escenarios disponibles, útil al dimensionar trabajo de seguimiento o cablear un transporte nuevo, ejecuta `pnpm openclaw qa coverage` (agrega `--json` para una salida legible por máquina).

Para comprobaciones de carácter y estilo, ejecuta el mismo escenario con múltiples refs de modelo live y escribe un informe Markdown evaluado:

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

El comando ejecuta procesos secundarios locales del Gateway de QA, no Docker. Los escenarios de evaluación de personajes deben definir la persona mediante `SOUL.md` y luego ejecutar turnos de usuario ordinarios, como chat, ayuda con el espacio de trabajo y tareas pequeñas con archivos. Al modelo candidato no se le debe decir que está siendo evaluado. El comando conserva cada transcripción completa, registra estadísticas básicas de la ejecución y luego pide a los modelos jueces en modo rápido, con razonamiento `xhigh` donde sea compatible, que clasifiquen las ejecuciones por naturalidad, ambiente y humor.
Usa `--blind-judge-models` al comparar proveedores: el prompt del juez sigue recibiendo cada transcripción y estado de ejecución, pero las referencias de los candidatos se reemplazan por etiquetas neutras como `candidate-01`; el informe asigna las clasificaciones de vuelta a las referencias reales después del análisis.
Las ejecuciones de candidatos usan de forma predeterminada razonamiento `high`, con `medium` para GPT-5.5 y `xhigh` para referencias de evaluación de OpenAI más antiguas que lo admiten. Sobrescribe un candidato específico en línea con `--model provider/model,thinking=<level>`. `--thinking <level>` todavía define un valor global de respaldo, y la forma anterior `--model-thinking <provider/model=level>` se mantiene por compatibilidad.
Las referencias de candidatos de OpenAI usan de forma predeterminada el modo rápido, de modo que se utiliza procesamiento prioritario donde el proveedor lo admite. Agrega `,fast`, `,no-fast` o `,fast=false` en línea cuando un solo candidato o juez necesite una sobrescritura. Pasa `--fast` solo cuando quieras forzar el modo rápido para todos los modelos candidatos. Las duraciones de candidatos y jueces se registran en el informe para el análisis comparativo, pero los prompts de los jueces indican explícitamente que no deben clasificar por velocidad.
Las ejecuciones de modelos candidatos y jueces usan ambas de forma predeterminada una concurrencia de 16. Reduce `--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión del Gateway local hagan que una ejecución tenga demasiado ruido.
Cuando no se pasa ningún candidato `--model`, la evaluación de personajes usa de forma predeterminada
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y
`google/gemini-3.1-pro-preview` cuando no se pasa ningún `--model`.
Cuando no se pasa ningún `--judge-model`, los jueces usan de forma predeterminada
`openai/gpt-5.5,thinking=xhigh,fast` y
`anthropic/claude-opus-4-6,thinking=high`.

## Documentación relacionada

- [Matriz de QA](/es/concepts/qa-matrix)
- [Canal de QA](/es/channels/qa-channel)
- [Pruebas](/es/help/testing)
- [Panel](/es/web/dashboard)
