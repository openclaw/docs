---
read_when:
    - Crear o ejecutar QA visual en vivo para errores de OpenClaw
    - Agregar verificación antes y después para un pull request
    - Agregar escenarios de transporte en vivo de Discord, Slack, WhatsApp u otros
    - Depurar ejecuciones de QA que necesitan capturas de pantalla, automatización del navegador o acceso VNC
summary: Mantis es el sistema de verificación visual de extremo a extremo para reproducir errores de OpenClaw en transportes en vivo, capturar evidencias de antes y después, y adjuntar artefactos a PRs.
title: Mantis
x-i18n:
    generated_at: "2026-07-05T11:12:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9900316f179fbb42fb8cef603bd6719b55a8fb769409980ff7b17cf3e562ae70
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis vuelve a ejecutar un escenario de bug contra una referencia base conocida como defectuosa y una referencia candidata en un transporte real; luego publica una comparación antes/después como artefactos de CI y un comentario en el PR. Discord se envió primero: autenticación de bot real, canales de servidor reales, reacciones, hilos y un testigo en navegador que una persona puede comprobar. También existen carriles de Slack y Telegram; WhatsApp y Matrix no están implementados.

## Propiedad

- OpenClaw (`extensions/qa-lab/src/mantis/*`): runtime de escenarios, CLI `pnpm openclaw qa mantis <command>`, esquema de evidencia.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): arnés de transporte en vivo, bots de controlador/SUT, escritores de informes/evidencia.
- Crabbox (`openclaw/crabbox`): máquinas Linux preinicializadas, reservas, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): puntos de entrada remotos, retención de artefactos.
- ClawSweeper: analiza comandos de PR de mantenedores, despacha workflows, publica el comentario final en el PR.

## Comandos CLI

Todos los comandos son `pnpm openclaw qa mantis <command>`, definidos en
`extensions/qa-lab/src/mantis/cli.ts`. Requiere `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
en tiempo de build/ejecución (los workflows empaquetados establecen `OPENCLAW_BUILD_PRIVATE_QA=1` y
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` antes de compilar).

| Comando                         | Propósito                                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Verificar que el bot de Discord de Mantis pueda ver el servidor/canal, publicar y reaccionar.                                                            |
| `run`                           | Ejecutar un escenario antes/después contra referencias base y candidata (solo Discord).                                                                   |
| `desktop-browser-smoke`         | Reservar/reutilizar un escritorio Crabbox, abrir un navegador visible, capturar captura de pantalla + video.                                             |
| `slack-desktop-smoke`           | Reservar/reutilizar un escritorio Crabbox, ejecutar QA de Slack dentro de él, abrir Slack Web, capturar evidencia.                                       |
| `telegram-desktop-builder`      | Reservar/reutilizar un escritorio Crabbox, instalar Telegram Desktop, configurar opcionalmente un Gateway de OpenClaw.                                   |
| `visual-task` / `visual-driver` | Captura genérica de escritorio Crabbox con aserciones opcionales de comprensión de imágenes; `visual-driver` es la mitad controladora lanzada bajo `crabbox record --while`. |

Cada comando acepta `--repo-root <path>` y `--output-dir <path>`; los comandos de Crabbox
también aceptan `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` y `--keep-lease`. Los valores predeterminados de CLI local
para proveedor/clase son `hetzner`/`beast`, salvo que se indique lo contrario; los workflows de CI
normalmente sobrescriben ambos.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Llama a la API REST de Discord (`https://discord.com/api/v10`) para obtener el usuario
del bot, el servidor, los canales del servidor y el canal objetivo; afirma que el
canal pertenece al servidor; luego (salvo `--skip-post`) publica un mensaje y
añade una reacción `👀`. Escribe `mantis-discord-smoke-summary.json` y
`mantis-discord-smoke-report.md`.

Orden de resolución del token: valor de `--token-file`, luego `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(sobrescribir con `--token-env`), luego un archivo nombrado por `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(sobrescribir con `--token-file-env`). Los IDs de servidor/canal vienen de
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (sobrescribir con
`--guild-id` / `--channel-id`) y deben ser snowflakes de Discord de 17-20 dígitos. Establece
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para reemplazar IDs y nombres de bot/servidor/canal/mensaje
con `<redacted>` en el resumen y el informe publicados.

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
IDs integrados, cada uno con su propia referencia base predeterminada y etiquetas
antes/después esperadas (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Escenario                                  | Base predeterminada                         | La base espera                            | La candidata espera         |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | --------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | la respuesta del hilo omite el adjunto `filePath` | la respuesta del hilo lo incluye |

`--candidate` usa `HEAD` de forma predeterminada. Otros flags: `--credential-source`
(predeterminado `convex`), `--credential-role` (predeterminado `ci`), `--provider-mode`
(predeterminado `live-frontier`), `--fast` (activado de forma predeterminada), `--skip-install`, `--skip-build`.

El runner crea checkouts separados de `git worktree` para la base y la
candidata bajo `<output-dir>/worktrees/`, ejecuta `pnpm install`/`pnpm build` en
cada uno (salvo que se omitan), y luego ejecuta
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
contra cada worktree. Cada carril escribe `discord-qa-reaction-timelines.json`
más un par `<scenario-id>-timeline.html`/`.png`; el runner copia esta
evidencia de vuelta bajo `baseline/`/`candidate/`, escribe `comparison.json`,
`mantis-report.md` y `mantis-evidence.json` en el directorio de salida, y
sale con código distinto de cero si la comparación no pasó (base `fail` y candidata
`pass`).

El segundo escenario de Discord (`discord-thread-reply-filepath-attachment`) publica
un mensaje padre con el bot controlador, crea un hilo real, llama a la acción
`message.thread-reply` del SUT con un `filePath` local del repo y luego sondea el
hilo en busca de la respuesta y del nombre del archivo adjunto. Espera un adjunto
llamado `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Reserva o reutiliza un escritorio Crabbox, lanza un navegador dentro de la sesión VNC
apuntando a `--browser-url` (predeterminado `https://openclaw.ai`) o a un
`--html-file` renderizado, espera, toma capturas con `scrot`, opcionalmente graba un MP4 con
`ffmpeg`, y sincroniza mediante rsync `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
de vuelta a `--output-dir`.

Flags:

- `--lease-id <cbx_...>` reutiliza un escritorio preinicializado en lugar de crear uno.
- `--browser-profile-dir <remote-path>` reutiliza un Chrome user-data-dir remoto para que un escritorio persistente permanezca conectado entre ejecuciones (usado para un perfil de visor de Discord Web de larga duración).
- `--browser-profile-archive-env <name>` restaura un archivo de perfil de Chrome `.tgz` en base64 desde esa variable de entorno antes del lanzamiento (predeterminado `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); se usa para testigos con sesión iniciada como Discord Web.
- `--video-duration <seconds>` controla la duración de captura del MP4 (predeterminado 10s).
- `--keep-lease` (o `OPENCLAW_MANTIS_KEEP_VM=1`) mantiene abierta una reserva creada por esta ejecución para inspección VNC; las ejecuciones fallidas que crearon una reserva también la mantienen por defecto.

Para evidencia de Discord Web, Mantis usa una cuenta de visor dedicada, no un
token de bot. El oráculo REST de Discord (mediante `qa discord`) sigue siendo autoritativo; cuando
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` está establecido, el escenario también escribe un
artefacto de URL de Discord Web, y `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` deja el
hilo abierto el tiempo suficiente para que el navegador lo abra.

El workflow de GitHub prefiere un perfil de visor persistente mediante
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (los archivos de perfil completos pueden superar
el límite de tamaño de secretos de GitHub); para perfiles pequeños/de arranque, en cambio puede restaurar un
`.tgz` en base64 desde `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Sin
ninguna fuente configurada, el workflow aún publica las capturas de pantalla deterministas
de base/candidata y registra que el testigo con sesión iniciada fue
omitido.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Reserva o reutiliza un escritorio Crabbox, sincroniza el checkout dentro de la VM, ejecuta
`pnpm openclaw qa slack` dentro de ella, abre Slack Web en el navegador VNC,
captura el escritorio y copia tanto los artefactos de QA de Slack (`slack-qa/`) como
la captura de pantalla/video de VNC de vuelta localmente. Esta es la única forma de Mantis donde el
Gateway SUT y el navegador se ejecutan ambos dentro de la misma VM.

Con `--gateway-setup`, el comando crea un home persistente y desechable de OpenClaw
en `$HOME/.openclaw-mantis/slack-openclaw` en la VM, parchea la configuración de Slack
Socket Mode para el canal objetivo, inicia
`openclaw gateway run --dev --allow-unconfigured --port 38973` y deja
Chrome ejecutándose en la sesión VNC; omitir `--gateway-setup` ejecuta en cambio el
carril normal de QA de Slack bot-a-bot.

Entorno requerido para `--credential-source env` (el valor local predeterminado es `env`; el rol
predeterminado es `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para el carril de modelo remoto (si solo `OPENAI_API_KEY`
  está establecido localmente, Mantis lo copia a `OPENCLAW_LIVE_OPENAI_KEY` antes de
  invocar Crabbox)

Con `--credential-source convex`, Mantis reserva la credencial SUT de Slack desde
el pool compartido antes de crear la VM y reenvía el ID de canal, el token de app y
el token de bot a la VM como variables de entorno `OPENCLAW_MANTIS_SLACK_*`, por lo que los workflows de GitHub
solo necesitan el secreto del broker de Convex, no tokens sin procesar de Slack.

Otros flags: `--slack-url <url>` abre una URL específica (si no, Mantis deriva
`https://app.slack.com/client/<team>/<channel>` desde `auth.test`);
`--slack-channel-id <id>` establece el canal de la lista de permitidos del Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla el perfil persistente de Chrome
dentro de la VM (predeterminado `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` ejecuta los escenarios nativos de aprobación de Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) y renderiza
capturas de checkpoints pendientes/resueltos en lugar de configurar el Gateway (mutuamente
excluyente con `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` y `--fast` se pasan al
carril en vivo de Slack.

Las capturas de checkpoints de aprobación se renderizan desde el mensaje de la API de Slack que
observó el escenario, no desde la UI en vivo de Slack; `slack-desktop-smoke.png` es solo
prueba de Slack Web en sí cuando el perfil de navegador de la reserva ya tenía una sesión
iniciada.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Reserva o reutiliza un escritorio Crabbox, instala Telegram Desktop nativo para Linux,
opcionalmente restaura un archivo de sesión de usuario, configura OpenClaw con el
token de bot SUT de Telegram reservado, inicia
`openclaw gateway run --dev --allow-unconfigured --port 38974`, publica un
mensaje de disponibilidad del bot controlador en el grupo privado reservado y luego captura una
captura de pantalla y un MP4. Un token de bot solo configura OpenClaw; nunca inicia
sesión en Telegram Desktop. El visor de escritorio es una sesión de usuario separada de Telegram
restaurada desde `--telegram-profile-archive-env <name>` o iniciada manualmente
mediante VNC y mantenida activa con `--keep-lease`.

Indicadores: `--lease-id <cbx_...>` vuelve a ejecutar contra una VM que ya tiene sesión iniciada en
Telegram Desktop; `--telegram-profile-archive-env <name>` restaura un archivo de perfil
`.tgz` en base64 antes del inicio; `--telegram-profile-dir <remote-path>`
establece el directorio de perfil remoto (predeterminado: `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` solo instala y abre Telegram Desktop;
`--credential-source`/`--credential-role` usan de forma predeterminada `convex`/`maintainer`.

## Manifiesto de evidencia

Cada escenario que publica en un PR escribe `mantis-evidence.json` junto a
su informe:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
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
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

El `path` del artefacto es relativo al directorio del manifiesto; `targetPath` es
relativo al prefijo de artefactos R2/S3 configurado. `scripts/mantis/publish-pr-evidence.mjs`
rechaza el recorrido de rutas y omite entradas con `"required": false` cuando
falta el archivo.

Tipos de artefacto: `timeline` (captura de pantalla determinista de antes/después),
`desktopScreenshot` (captura de pantalla de VNC/navegador), `motionPreview` (GIF animado
integrado desde la grabación), `motionClip` (MP4 recortado por movimiento), `fullVideo` (grabación
completa), `metadata` (archivo complementario JSON/log), `report` (informe Markdown).

Diseño de artefactos en disco de una ejecución:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Las capturas de pantalla son evidencia, no secretos, pero aun así requieren disciplina de redacción:
pueden aparecer nombres de canales privados, nombres de usuario o contenido de mensajes. Establece
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para cargas públicas de artefactos; está
habilitado de forma predeterminada en los flujos de trabajo de GitHub de Discord/Slack/Telegram.

## Automatización de GitHub

`scripts/mantis/publish-pr-evidence.mjs` es el publicador reutilizable. Los flujos de trabajo
lo llaman con el manifiesto, el PR de destino, la raíz de destino de artefactos, el marcador de comentario,
la URL del artefacto, la URL de ejecución y el origen de la solicitud. Carga los artefactos declarados en
el bucket R2 de Mantis, construye un comentario de PR con el resumen primero, con
imágenes/vistas previas integradas y videos enlazados, y luego actualiza el comentario marcador existente o
crea uno nuevo. Entorno requerido:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (los flujos de trabajo establecen `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (los flujos de trabajo establecen `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (los flujos de trabajo establecen `https://artifacts.openclaw.ai`)

Los comentarios se publican mediante la GitHub App de Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), no `github-actions[bot]`, usando un comentario marcador
oculto como clave de upsert.

| Flujo de trabajo                 | Disparador                                                                                 | Qué hace                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`           | despacho manual                                                                            | Ejecuta `discord-smoke` contra una referencia elegida.                                                                                                                                                                                                                                         |
| `Mantis Discord Status Reactions` | comentario de PR o despacho manual                                                        | Construye árboles de trabajo separados de referencia base/candidata, ejecuta `discord-status-reactions-tool-only` en cada uno, renderiza la cronología de cada carril en un navegador de escritorio de Crabbox, genera vistas previas GIF/MP4 recortadas por movimiento con `crabbox media preview`, carga artefactos y publica evidencia integrada en el PR. |
| `Mantis Scenario`                | despacho manual                                                                            | Despachador genérico: toma `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`), `baseline_ref`, `candidate_ref`, `pr_number`, y lo reenvía al flujo de trabajo de escenario correspondiente. |
| `Mantis Slack Desktop Smoke`     | despacho manual                                                                            | Arrienda un escritorio Linux de Crabbox (predeterminado `aws`, opción de `hetzner`), ejecuta `slack-desktop-smoke --gateway-setup` contra la candidata, graba el escritorio, genera una vista previa de movimiento, carga artefactos y publica evidencia en el PR cuando se proporciona un número de PR. |
| `Mantis Telegram Live`           | comentario de PR o despacho manual                                                        | Ejecuta el carril de QA en vivo de Telegram mediante la API del bot (`openclaw qa telegram`), escribe `mantis-evidence.json` desde el resumen de QA, renderiza HTML de evidencia redactada mediante un navegador de escritorio de Crabbox, genera un GIF de movimiento y publica evidencia en el PR. No se requiere inicio de sesión en Telegram Web para este carril. |
| `Mantis Telegram Desktop Proof`  | etiqueta de PR de maintainer (`mantis: telegram-visible-proof`) más comentario de PR, o despacho manual | Prueba agentic nativa de Telegram Desktop de antes/después. Entrega el PR, las referencias base/candidata y las instrucciones del maintainer a Codex, que ejecuta el carril de prueba de Telegram Desktop con usuario real en Crabbox para ambas referencias y publica una tabla de evidencia de PR de 2 columnas. |

`Mantis Discord Status Reactions` y `Mantis Telegram Live` aceptan
`baseline_ref`/`candidate_ref` (o `baseline=`/`candidate=` en un comentario de PR)
y validan que el SHA resuelto sea un ancestro de `origin/main`, una
etiqueta de lanzamiento (`v*`) o la cabecera de un PR abierto antes de ejecutarse con
credenciales que contienen secretos.

Disparadores por comentario, desde un PR con acceso de escritura/mantenimiento/administración:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Los disparadores de comentario de Telegram usan de forma predeterminada el SHA de cabecera del PR como candidata y
`telegram-status-command` como escenario; aceptan `provider=aws|hetzner` y
`lease=<cbx_...>` para apuntar a un proveedor específico de Crabbox o a un escritorio
precalentado. `Mantis Telegram Desktop Proof` solo responde a un comentario de PR cuando
el PR ya tiene la etiqueta `mantis: telegram-visible-proof`.

ClawSweeper también puede despachar un escenario directamente:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Máquinas y secretos

Los valores predeterminados de Crabbox en la CLI local son `--provider hetzner --class beast`; sobrescríbelos
con `--provider`, `--class`/`--machine-class`, o
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Los flujos de trabajo de GitHub
suelen sobrescribir ambos (por ejemplo `--class standard`, y la entrada de elección de proveedor
`aws`/`hetzner` del flujo de trabajo de Slack). Si un proveedor es demasiado
lento o no está disponible, agrégalo detrás de la misma interfaz de Crabbox en lugar de
codificar una alternativa.

Base de VM: Linux con Chrome/Chromium apto para escritorio, acceso CDP, VNC/
noVNC, Node 22+ y pnpm, un checkout de OpenClaw y acceso saliente al
transporte de destino, GitHub, proveedores de modelos y el intermediario de credenciales.

Nombres de secretos usados en los flujos de trabajo de Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para cargas públicas de artefactos
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (los flujos de trabajo también aceptan
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` como alternativa y los asignan
  a los nombres simples antes de invocar Crabbox)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

El ejecutor de Mantis nunca debe imprimir tokens de bots de Discord/Slack/Telegram,
claves de API de proveedores, cookies del navegador, contenidos de perfiles de autenticación, contraseñas de VNC ni
cargas útiles de credenciales sin procesar. Si un token se filtra en un issue, PR, chat o log,
rótalo después de almacenar el secreto de reemplazo.

## Resultados de ejecución

Un escenario falla de una de dos maneras distinguibles, y el informe las separa
para que un entorno inestable no se lea como una regresión del producto:

- **Bug reproducido**: la referencia base falló de la forma que espera el escenario.
- **Fallo del harness**: la configuración del entorno, las credenciales, la API del transporte, el navegador
  o el proveedor fallaron antes de que el oráculo fuera significativo.

## Agregar un escenario

Los escenarios se definen en TypeScript por transporte (consulta
`MANTIS_SCENARIO_CONFIGS` en `extensions/qa-lab/src/mantis/run.runtime.ts` para
la forma de antes/después de Discord), no en un formato de archivo declarativo independiente.
Cada escenario necesita: id y título, transporte, credenciales requeridas, política de referencia
base, política de referencia candidata, parche de configuración de OpenClaw, pasos de configuración/estímulo,
oráculo esperado de referencia base y candidata, destinos de captura visual, presupuesto de tiempo de espera
y pasos de limpieza.

Prefiere oráculos pequeños y tipados sobre comprobaciones de visión: estado de reacciones de Discord o
referencias de mensajes, `ts` de hilo de Slack/estado de API de reacciones, ids de mensajes de correo
y encabezados. Usa capturas de pantalla del navegador cuando la UI sea el único observable fiable,
y mantén las comprobaciones de visión como aditivas a un oráculo de API de plataforma cuando exista uno.

Después de Discord, Slack y Telegram, la misma forma de ejecutor se extiende a WhatsApp
(inicio de sesión por QR, reidentificación, entrega, medios, reacciones) y Matrix
(salas cifradas, relaciones de hilo/respuesta, reanudación tras reinicio); ninguno está
implementado todavía.

## Preguntas abiertas

- ¿Qué bot de Discord debería ser el controlador frente al SUT cuando se reutiliza el bot existente de Mantis?
- ¿Durante cuánto tiempo debería GitHub conservar los artefactos de Mantis para los PR?
- ¿Cuándo debería ClawSweeper recomendar automáticamente un escenario de Mantis en lugar de
  esperar un comando de maintainer?
- ¿Deben redactarse o recortarse las capturas de pantalla antes de cargarlas para PR públicos?
