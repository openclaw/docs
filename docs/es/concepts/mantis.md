---
read_when:
    - Creación o ejecución de pruebas visuales de calidad en vivo para errores de OpenClaw
    - Adición de verificaciones previas y posteriores para una solicitud de incorporación de cambios
    - Adición de escenarios de transporte en vivo de Discord, Slack, WhatsApp u otros servicios
    - Ejecución de una prueba específica en el navegador de la interfaz de control para una referencia candidata
    - Depuración de ejecuciones de control de calidad que requieren capturas de pantalla, automatización del navegador o acceso VNC
summary: Mantis captura evidencia visual de extremo a extremo para comparaciones de transporte en vivo y pruebas de navegador específicas centradas únicamente en candidatos, y luego adjunta los artefactos a los PR.
title: Mantis
x-i18n:
    generated_at: "2026-07-16T11:36:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis publica evidencia visual de CI y un comentario en el PR sobre el comportamiento de OpenClaw.
Los escenarios de transporte en vivo comparan una línea base con errores conocidos con una referencia candidata;
las vías específicas del navegador pueden, en cambio, demostrar un candidato frente a un transporte simulado
determinista. Discord fue el primero en publicarse, con autenticación real de bot, canales de servidor,
reacciones, hilos y un testigo en el navegador. También existen vías de chat de Slack, Telegram y específicas de la interfaz de
control; WhatsApp y Matrix no están implementados.

## Responsabilidad

- OpenClaw (`extensions/qa-lab/src/mantis/*`): entorno de ejecución de escenarios, CLI `pnpm openclaw qa mantis <command>`, esquema de evidencias.
- Laboratorio de control de calidad (`extensions/qa-lab/src/live-transports/*`): arnés de transporte en vivo, bots controladores/SUT, generadores de informes/evidencias.
- Crabbox (`openclaw/crabbox`): máquinas Linux preparadas, concesiones, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): puntos de entrada remotos, conservación de artefactos.
- ClawSweeper: analiza comandos de mantenedores en PR, ejecuta flujos de trabajo y publica el comentario final en el PR.

## Comandos de la CLI

Todos los comandos son `pnpm openclaw qa mantis <command>`, definidos en
`extensions/qa-lab/src/mantis/cli.ts`. Requiere `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
durante la compilación/ejecución (los flujos de trabajo incluidos establecen `OPENCLAW_BUILD_PRIVATE_QA=1` y
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` antes de compilar).

| Comando                         | Propósito                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Verificar que el bot de Discord de Mantis pueda ver el servidor/canal, publicar y reaccionar.                                                                                 |
| `run`                           | Ejecutar un escenario anterior/posterior con referencias de línea base y candidata (solo Discord).                                                                           |
| `desktop-browser-smoke`         | Conceder/reutilizar un escritorio Crabbox, abrir un navegador visible y capturar una imagen de pantalla y un vídeo.                                                                        |
| `slack-desktop-smoke`           | Conceder/reutilizar un escritorio Crabbox, ejecutar el control de calidad de Slack en él, abrir Slack Web y capturar evidencias.                                                                  |
| `telegram-desktop-builder`      | Conceder/reutilizar un escritorio Crabbox, instalar Telegram Desktop y, opcionalmente, configurar un Gateway de OpenClaw.                                                        |
| `visual-task` / `visual-driver` | Captura genérica de escritorio Crabbox con aserciones opcionales de comprensión de imágenes; `visual-driver` es la parte del controlador iniciada mediante `crabbox record --while`. |

Todos los comandos aceptan `--repo-root <path>` y `--output-dir <path>`; los comandos de Crabbox
también aceptan `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` y `--keep-lease`. Los valores predeterminados de la CLI local
para el proveedor/la clase son `hetzner`/`beast`, salvo que se indique lo contrario; los flujos de trabajo de CI
suelen reemplazar ambos.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Llama a la API REST de Discord (`https://discord.com/api/v10`) para obtener el usuario
del bot, el servidor, los canales del servidor y el canal de destino; comprueba que el
canal pertenezca al servidor y, a continuación (a menos que se use `--skip-post`), publica un mensaje y
añade una reacción `👀`. Escribe `mantis-discord-smoke-summary.json` y
`mantis-discord-smoke-report.md`.

Orden de resolución del token: valor de `--token-file`, luego `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(reemplazable con `--token-env`) y después un archivo cuyo nombre especifica `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(reemplazable con `--token-file-env`). Los identificadores de servidor/canal proceden de
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (reemplazables con
`--guild-id` / `--channel-id`) y deben ser snowflakes de Discord de 17-20 dígitos. Establezca
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para sustituir los identificadores
y nombres del bot/servidor/canal/mensaje por `<redacted>` en el resumen y el informe publicados.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` actualmente solo acepta `discord`. `--scenario` es uno de dos
identificadores integrados, cada uno con su propia referencia de línea base predeterminada y etiquetas esperadas
para antes/después (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Escenario                                   | Línea base predeterminada                           | La línea base espera                         | El candidato espera            |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | la respuesta del hilo omite el archivo adjunto `filePath` | la respuesta del hilo lo incluye     |

`--candidate` usa `HEAD` de forma predeterminada. Otras marcas: `--credential-source`
(valor predeterminado: `convex`), `--credential-role` (valor predeterminado: `ci`), `--provider-mode`
(valor predeterminado: `live-frontier`), `--fast` (activada de forma predeterminada), `--skip-install`, `--skip-build`.

El ejecutor crea checkouts `git worktree` separados para la línea base y
el candidato en `<output-dir>/worktrees/`, ejecuta `pnpm install`/`pnpm build` en
cada uno (salvo que se omita) y, a continuación, ejecuta
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
en cada árbol de trabajo. Cada vía escribe `discord-qa-reaction-timelines.json`
además de un par `<scenario-id>-timeline.html`/`.png`; el ejecutor vuelve a copiar estas
evidencias en `baseline/`/`candidate/`, escribe `comparison.json`,
`mantis-report.md` y `mantis-evidence.json` en el directorio de salida y
termina con un código distinto de cero si la comparación no supera la prueba (línea base `fail` y candidato
`pass`).

El segundo escenario de Discord (`discord-thread-reply-filepath-attachment`) publica
un mensaje principal con el bot controlador, crea un hilo real, llama a la acción
`message.thread-reply` del SUT con un `filePath` local del repositorio y, a continuación, consulta periódicamente el
hilo para buscar la respuesta y el nombre del archivo adjunto. Espera un archivo adjunto
llamado `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Concede o reutiliza un escritorio Crabbox, inicia un navegador dentro de la sesión VNC
apuntando a `--browser-url` (valor predeterminado: `https://openclaw.ai`) o a un
`--html-file` renderizado, espera, toma una captura de pantalla con `scrot`, opcionalmente graba un MP4 con
`ffmpeg` y sincroniza mediante rsync `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
de vuelta a `--output-dir`.

Marcas:

- `--lease-id <cbx_...>` reutiliza un escritorio preparado en lugar de crear uno.
- `--browser-profile-dir <remote-path>` reutiliza un directorio remoto de datos de usuario de Chrome para que un escritorio persistente conserve la sesión iniciada entre ejecuciones (se utiliza para un perfil de visualización de Discord Web de larga duración).
- `--browser-profile-archive-env <name>` restaura antes del inicio un archivo de perfil `.tgz` de Chrome codificado en base64 desde esa variable de entorno (valor predeterminado: `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); se utiliza para testigos con sesión iniciada, como Discord Web.
- `--video-duration <seconds>` controla la duración de la captura MP4 (valor predeterminado: 10s).
- `--keep-lease` (o `OPENCLAW_MANTIS_KEEP_VM=1`) mantiene abierta para su inspección mediante VNC una concesión creada por esta ejecución; las ejecuciones fallidas que crearon una concesión también la mantienen abierta de forma predeterminada.

Para las evidencias de Discord Web, Mantis utiliza una cuenta de visualización dedicada, no un token
de bot. El oráculo REST de Discord (mediante `qa discord`) sigue siendo la fuente autoritativa; cuando
se establece `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, el escenario también escribe un
artefacto de URL de Discord Web, y `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` mantiene el
hilo abierto el tiempo suficiente para que el navegador pueda abrirlo.

El flujo de trabajo de GitHub prefiere un perfil de visualización persistente mediante
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (los archivos de perfil completos pueden superar
el límite de tamaño de secretos de GitHub); para perfiles pequeños/de arranque, puede restaurar en su lugar un
`.tgz` codificado en base64 desde `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Si no se configura
ninguna de las fuentes, el flujo de trabajo sigue publicando las capturas de pantalla deterministas
de línea base/candidato y registra que se omitió el testigo con sesión iniciada.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Concede o reutiliza un escritorio Crabbox, sincroniza el checkout con la máquina virtual, ejecuta
`pnpm openclaw qa slack` en ella, abre Slack Web en el navegador VNC,
captura el escritorio y copia localmente tanto los artefactos de control de calidad de Slack (`slack-qa/`) como
la captura de pantalla/el vídeo de VNC. Esta es la única modalidad de Mantis en la que el
Gateway del SUT y el navegador se ejecutan dentro de la misma máquina virtual.

Con `--gateway-setup`, el comando crea un directorio principal desechable y persistente de OpenClaw
en `$HOME/.openclaw-mantis/slack-openclaw` dentro de la máquina virtual, modifica la configuración de
Socket Mode de Slack para el canal de destino, inicia
`openclaw gateway run --dev --allow-unconfigured --port 38973` y deja
Chrome ejecutándose en la sesión VNC; si se omite `--gateway-setup`, se ejecuta en su lugar la vía normal
de control de calidad de Slack entre bots.

Variables de entorno requeridas para `--credential-source env` (el valor local predeterminado es `env`; el valor predeterminado
del rol es `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para la vía del modelo remoto (si solo `OPENAI_API_KEY`
  se establece localmente, Mantis la copia a `OPENCLAW_LIVE_OPENAI_KEY` antes
  de invocar Crabbox)

Con `--credential-source convex`, Mantis obtiene mediante concesión la credencial del SUT de Slack del
grupo compartido antes de crear la máquina virtual y reenvía el identificador del canal, el token de la aplicación y
el token del bot a la máquina virtual como variables de entorno `OPENCLAW_MANTIS_SLACK_*`, de modo que los flujos de trabajo de GitHub
solo necesiten el secreto del intermediario Convex, no los tokens de Slack sin procesar.

Otras marcas: `--slack-url <url>` abre una URL específica (de lo contrario, Mantis deriva
`https://app.slack.com/client/<team>/<channel>` de `auth.test`);
`--slack-channel-id <id>` establece el canal de la lista de permitidos del Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla el perfil persistente de Chrome
dentro de la máquina virtual (valor predeterminado: `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` ejecuta los escenarios nativos de aprobación de Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) y renderiza
capturas de pantalla de puntos de control pendientes/resueltos en lugar de configurar el Gateway (es mutuamente
excluyente con `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` y `--fast` se transfieren a la
vía en vivo de Slack.

Las capturas de pantalla de los puntos de control de aprobación se renderizan a partir del mensaje de la API de Slack que
observó el escenario, no de la interfaz de usuario de Slack en vivo; `slack-desktop-smoke.png` solo constituye
una prueba del propio Slack Web cuando el perfil del navegador de la concesión ya tenía
la sesión iniciada.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Concede o reutiliza un escritorio Crabbox, instala Telegram Desktop nativo para Linux,
restaura opcionalmente un archivo de sesión de usuario, configura OpenClaw con el
token de bot del SUT de Telegram concedido, inicia
`openclaw gateway run --dev --allow-unconfigured --port 38974`, publica un
mensaje de disponibilidad del bot controlador en el grupo privado concedido y, a continuación, captura una
imagen de pantalla y un MP4. Un token de bot solo configura OpenClaw; nunca inicia
sesión en Telegram Desktop. El visualizador de escritorio es una sesión de usuario de Telegram independiente
restaurada desde `--telegram-profile-archive-env <name>` o iniciada manualmente
mediante VNC y mantenida activa con `--keep-lease`.

Marcas: `--lease-id <cbx_...>` vuelve a ejecutar en una máquina virtual que ya tiene una sesión iniciada en
Telegram Desktop; `--telegram-profile-archive-env <name>` restaura un archivo de perfil
`.tgz` codificado en base64 antes del inicio; `--telegram-profile-dir <remote-path>`
establece el directorio remoto del perfil (valor predeterminado: `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` solo instala y abre Telegram Desktop;
`--credential-source`/`--credential-role` usan de forma predeterminada `convex`/`maintainer`.

## Manifiesto de evidencias

Cada escenario que publica en un PR escribe `mantis-evidence.json` junto a
su informe:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "QA de reacciones de estado de Discord de Mantis",
  "summary": "Resumen principal legible para personas para el comentario del PR.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Línea base solo en cola",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Cronología de Discord de la línea base",
      "width": 420
    }
  ]
}
```

El `path` del artefacto es relativo al directorio del manifiesto; `targetPath` es
relativo al prefijo de artefactos de R2/S3 configurado. `scripts/mantis/publish-pr-evidence.mjs`
rechaza el recorrido de rutas y omite las entradas con `"required": false` cuando
falta el archivo.

Tipos de artefactos: `timeline` (captura de pantalla determinista del antes/después),
`desktopScreenshot` (captura de pantalla de VNC/navegador), `motionPreview` (GIF animado
integrado de la grabación), `motionClip` (MP4 recortado según el movimiento), `fullVideo` (grabación
completa), `metadata` (archivo auxiliar JSON/registro), `report` (informe Markdown).

Disposición de los artefactos de una ejecución en disco:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Las capturas de pantalla son pruebas, no secretos, pero aun así requieren una redacción rigurosa:
pueden aparecer nombres de canales privados, nombres de usuario o contenido de mensajes. Configure
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para las cargas públicas de artefactos; está
habilitado de forma predeterminada en los flujos de trabajo de GitHub para Discord/Slack/Telegram.

## Automatización de GitHub

`scripts/mantis/publish-pr-evidence.mjs` es el publicador reutilizable. Los flujos de trabajo
lo invocan con el manifiesto, el PR de destino, la raíz de destino de los artefactos, el marcador del comentario,
la URL de los artefactos, la URL de la ejecución y el origen de la solicitud. Carga los artefactos declarados en
el bucket R2 de Mantis, crea un comentario de PR que comienza con un resumen e incluye
imágenes/vistas previas integradas y vídeos enlazados, y después actualiza el comentario existente con el marcador o
crea uno nuevo. Variables de entorno obligatorias:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (los flujos de trabajo configuran `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (los flujos de trabajo configuran `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (los flujos de trabajo configuran `https://artifacts.openclaw.ai`)

Los comentarios se publican mediante la aplicación de GitHub Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), no mediante `github-actions[bot]`, usando un comentario
marcador oculto como clave de inserción o actualización.

| Flujo de trabajo                  | Activador                                                                                  | Qué hace                                                                                                                                                                                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | ejecución manual                                                                           | Ejecuta `discord-smoke` en una referencia elegida.                                                                                                                                                                                                                                                               |
| `Mantis Discord Status Reactions` | comentario de PR o ejecución manual                                                        | Crea árboles de trabajo separados para la línea base y el candidato, ejecuta `discord-status-reactions-tool-only` en cada uno, representa la cronología de cada vía en un navegador de escritorio de Crabbox, genera vistas previas GIF/MP4 recortadas según el movimiento con `crabbox media preview`, carga los artefactos y publica pruebas integradas en el PR. |
| `Mantis Scenario`                 | ejecución manual                                                                           | Despachador genérico: recibe `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` y los reenvía al flujo de trabajo del escenario correspondiente. |
| `Mantis Slack Desktop Smoke`      | ejecución manual                                                                           | Reserva un escritorio Linux de Crabbox (de forma predeterminada, `aws`, con la opción de `hetzner`), ejecuta `slack-desktop-smoke --gateway-setup` en el candidato, graba el escritorio, genera una vista previa de movimiento, carga los artefactos y publica pruebas en el PR cuando se proporciona un número de PR. |
| `Mantis Telegram Live`            | comentario de PR o ejecución manual                                                        | Ejecuta la vía de QA en vivo de Telegram mediante la API de bot (`openclaw qa telegram`), escribe `mantis-evidence.json` a partir del resumen de QA, representa el HTML de las pruebas redactadas mediante un navegador de escritorio de Crabbox, genera un GIF de movimiento y publica pruebas en el PR. No se requiere iniciar sesión en Telegram Web para esta vía. |
| `Mantis Telegram Desktop Proof`   | etiqueta de PR de mantenedor (`mantis: telegram-visible-proof`) más comentario de PR, o ejecución manual | Prueba agéntica nativa del antes/después en Telegram Desktop. Entrega a Codex el PR, las referencias de la línea base y del candidato y las instrucciones del mantenedor; Codex ejecuta la vía de prueba de Telegram Desktop con un usuario real en Crabbox para ambas referencias y publica una tabla de pruebas de PR de 2 columnas. |
| `Mantis Web UI Chat Proof`        | comentario de PR o ejecución manual                                                        | Ejecuta en el candidato la prueba específica de chat de OpenClaw Control UI con Playwright, verifica que el navegador envíe mediante el Gateway simulado, captura artefactos de captura de pantalla/vídeo y publica pruebas en el PR. Esta vía solo prueba el chat web, no WinUI/aplicaciones nativas ni pruebas visuales arbitrarias. |

Tanto `Mantis Discord Status Reactions` como `Mantis Telegram Live` aceptan
`baseline_ref`/`candidate_ref` (o `baseline=`/`candidate=` en un comentario de PR)
y validan que el SHA resuelto sea un ancestro de `origin/main`, una
etiqueta de versión (`v*`) o la cabecera de un PR abierto antes de ejecutarse con
credenciales que contienen secretos.

Activadores por comentario, desde un PR con acceso de escritura/mantenimiento/administración:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Los activadores por comentario de Telegram usan de forma predeterminada el SHA de cabecera del PR como candidato y
`telegram-status-command` como escenario; aceptan `provider=aws|hetzner` y
`lease=<cbx_...>` para seleccionar un proveedor específico de Crabbox o un
escritorio precalentado. `Mantis Telegram Desktop Proof` solo responde a un comentario de PR cuando
el PR ya tiene la etiqueta `mantis: telegram-visible-proof`.

Los activadores por comentario del chat de la interfaz web usan de forma predeterminada el SHA de cabecera del PR como candidato. Ejecutan
la prueba de chat de Control UI con un Gateway simulado y publican artefactos del navegador; use
pruebas normales de Playwright/navegador, capturas de pantalla del mantenedor, Crabbox o artefactos
locales para otras páginas web y superficies de aplicaciones nativas.

ClawSweeper también puede despachar directamente un escenario:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Máquinas y secretos

Los valores predeterminados de Crabbox para la CLI local son `--provider hetzner --class beast`; sobrescríbalos
con `--provider`, `--class`/`--machine-class` o
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Los flujos de trabajo de GitHub
suelen sobrescribir ambos (por ejemplo, `--class standard` y la entrada de selección de proveedor
`aws`/`hetzner` del flujo de trabajo de Slack). Si un proveedor es demasiado
lento o no está disponible, añádalo tras la misma interfaz de Crabbox en lugar de
codificar una alternativa fija.

Base de la máquina virtual: Linux con Chrome/Chromium compatible con escritorio, acceso CDP, VNC/
noVNC, Node 22.22.3+, 24.15+ o 25.9+ y pnpm, un repositorio de trabajo de OpenClaw y
acceso saliente al transporte de destino, GitHub, los proveedores de modelos y el
intermediario de credenciales.

Nombres de credenciales y variables de entorno utilizados en los comandos y flujos de trabajo de Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- El `qa mantis run --credential-source env` local también requiere
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
  y `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`. Los flujos de trabajo de GitHub normalmente usan
  `--credential-source convex` y las credenciales del intermediario indicadas a continuación en lugar de tokens
  sin procesar del bot de Discord.
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para cargas públicas de artefactos
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY` (o el valor específico de la prueba de Telegram Desktop
  `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`)
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (los flujos de trabajo también aceptan
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` como alternativa y los asignan
  a los nombres simples antes de invocar Crabbox)
- `CRABBOX_ACCESS_CLIENT_ID`, `CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

El ejecutor de Mantis nunca debe imprimir tokens de bots de Discord/Slack/Telegram,
claves de API de proveedores, cookies del navegador, contenido de perfiles de autenticación, contraseñas de VNC ni
cargas útiles de credenciales sin procesar. Si un token se filtra en una incidencia, un PR, un chat o un registro,
rótelo después de almacenar el secreto de sustitución.

## Resultados de la ejecución

Los escenarios de transporte del antes/después distinguen estos resultados para que un entorno
inestable no parezca una regresión del producto:

- **Error reproducido**: la línea base falló de la forma esperada por el escenario.
- **Fallo del arnés**: la configuración del entorno, las credenciales, la API de transporte, el navegador
  o el proveedor fallaron antes de que el oráculo pudiera ofrecer un resultado significativo.

La prueba de navegador solo para el candidato informa de si este superó las aserciones del
Gateway simulado y de la interfaz visible; no afirma que se haya reproducido el comportamiento de la línea base.

## Añadir un escenario

Los escenarios de transporte en vivo se definen en TypeScript para cada transporte (consulte
`MANTIS_SCENARIO_CONFIGS` en `extensions/qa-lab/src/mantis/run.runtime.ts` para
ver la estructura del antes/después de Discord), no en un formato de archivo declarativo independiente.
Cada escenario necesita: id y título, transporte, credenciales necesarias, política de referencias de la línea base,
política de referencias del candidato, parche de configuración de OpenClaw, pasos de preparación/estímulo,
oráculo esperado para la línea base y el candidato, objetivos de captura visual, presupuesto de
tiempo de espera y pasos de limpieza.

Las pruebas de navegador específicas solo para el candidato pueden usar una prueba E2E determinista
y un flujo de trabajo dedicados. Mantenga explícito su alcance, valide la referencia del candidato antes de
la ejecución, aísle la publicación respaldada por secretos y emita el mismo contrato de
manifiesto de pruebas.

Prefiera oráculos pequeños y tipados frente a comprobaciones visuales: el estado de las reacciones o
las referencias de mensajes de Discord, el `ts` del hilo/estado de la API de reacciones de Slack, los identificadores
y encabezados de mensajes de correo electrónico. Use capturas de pantalla del navegador cuando la interfaz de usuario sea el único elemento observable fiable
y mantenga las comprobaciones visuales como complemento de un oráculo de la API de la plataforma cuando exista.

Después de Discord, Slack y Telegram, la misma estructura del ejecutor se extiende a WhatsApp
(inicio de sesión mediante QR, reidentificación, entrega, contenido multimedia, reacciones) y Matrix
(salas cifradas, relaciones de hilo/respuesta, reanudación tras reiniciar); ninguno de los dos está
implementado todavía.

## Preguntas abiertas

- ¿Qué bot de Discord debe actuar como controlador y cuál como SUT cuando se reutiliza el bot Mantis
  existente?
- ¿Durante cuánto tiempo debe GitHub conservar los artefactos de Mantis para las PR?
- ¿Cuándo debe ClawSweeper recomendar automáticamente un escenario de Mantis en lugar de
  esperar una orden de un mantenedor?
- ¿Deben censurarse o recortarse las capturas de pantalla antes de subirlas a PR públicas?
