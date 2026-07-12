---
read_when:
    - Creación o ejecución de control de calidad visual en vivo para errores de OpenClaw
    - Añadir verificación previa y posterior para una solicitud de incorporación de cambios
    - Añadir escenarios de transporte en tiempo real de Discord, Slack, WhatsApp u otros servicios
    - Ejecución de una prueba enfocada en el navegador de la interfaz de control para una referencia candidata
    - Depuración de ejecuciones de control de calidad que requieren capturas de pantalla, automatización del navegador o acceso VNC
summary: Mantis captura evidencia visual integral para comparaciones de transporte en vivo y pruebas específicas en el navegador únicamente para candidatos, y luego adjunta los artefactos a las PR.
title: Mantis
x-i18n:
    generated_at: "2026-07-12T14:25:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis publica evidencia visual de CI y un comentario en el PR sobre el comportamiento de OpenClaw.
Los escenarios de transporte en vivo comparan una referencia base que se sabe que falla con una referencia candidata;
en cambio, los flujos específicos del navegador pueden demostrar una sola candidata frente a un
transporte simulado determinista. Discord fue el primero en publicarse, con autenticación real de bot, canales de servidor,
reacciones, hilos y un testigo en el navegador. También existen flujos de chat de Slack, Telegram y específicos de la interfaz de
control; WhatsApp y Matrix no están implementados.

## Responsabilidad

- OpenClaw (`extensions/qa-lab/src/mantis/*`): entorno de ejecución de escenarios, CLI `pnpm openclaw qa mantis <command>`, esquema de evidencia.
- Laboratorio de QA (`extensions/qa-lab/src/live-transports/*`): infraestructura de transportes en vivo, bots controladores/SUT, generadores de informes/evidencia.
- Crabbox (`openclaw/crabbox`): máquinas Linux precalentadas, arrendamientos, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): puntos de entrada remotos, retención de artefactos.
- ClawSweeper: analiza comandos de mantenedores en PR, ejecuta flujos de trabajo y publica el comentario final en el PR.

## Comandos de la CLI

Todos los comandos siguen el formato `pnpm openclaw qa mantis <command>` y se definen en
`extensions/qa-lab/src/mantis/cli.ts`. Requiere `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
durante la compilación/ejecución (los flujos de trabajo incluidos establecen `OPENCLAW_BUILD_PRIVATE_QA=1` y
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` antes de compilar).

| Comando                         | Propósito                                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Verificar que el bot de Discord de Mantis pueda ver el servidor/canal, publicar y reaccionar.                                                              |
| `run`                           | Ejecutar un escenario de antes/después con referencias base y candidata (solo Discord).                                                                    |
| `desktop-browser-smoke`         | Arrendar/reutilizar un escritorio de Crabbox, abrir un navegador visible y capturar una imagen + vídeo.                                                    |
| `slack-desktop-smoke`           | Arrendar/reutilizar un escritorio de Crabbox, ejecutar QA de Slack en él, abrir Slack Web y capturar evidencia.                                             |
| `telegram-desktop-builder`      | Arrendar/reutilizar un escritorio de Crabbox, instalar Telegram Desktop y, opcionalmente, configurar un Gateway de OpenClaw.                               |
| `visual-task` / `visual-driver` | Captura genérica del escritorio de Crabbox con aserciones opcionales de comprensión de imágenes; `visual-driver` es la parte controladora iniciada mediante `crabbox record --while`. |

Todos los comandos aceptan `--repo-root <path>` y `--output-dir <path>`; los comandos de Crabbox
también aceptan `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` y `--keep-lease`. Los valores predeterminados de la CLI local
para proveedor/clase son `hetzner`/`beast`, salvo que se indique lo contrario; los flujos de trabajo de CI
normalmente reemplazan ambos.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Llama a la API REST de Discord (`https://discord.com/api/v10`) para obtener el usuario
del bot, el servidor, los canales del servidor y el canal de destino; comprueba que el
canal pertenece al servidor y, después (salvo que se use `--skip-post`), publica un mensaje y
añade una reacción `👀`. Escribe `mantis-discord-smoke-summary.json` y
`mantis-discord-smoke-report.md`.

Orden de resolución del token: valor de `--token-file`, después `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(se reemplaza con `--token-env`) y, después, un archivo cuyo nombre indica `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(se reemplaza con `--token-file-env`). Los identificadores del servidor/canal proceden de
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (se reemplazan con
`--guild-id` / `--channel-id`) y deben ser identificadores snowflake de Discord de 17-20 dígitos. Establezca
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

Actualmente, `--transport` solo acepta `discord`. `--scenario` es uno de dos
identificadores integrados, cada uno con su propia referencia base predeterminada y etiquetas esperadas de antes/después
(`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Escenario                                  | Referencia base predeterminada              | Resultado esperado en la referencia base     | Resultado esperado en la candidata |
| ------------------------------------------ | ------------------------------------------ | --------------------------------------------- | ---------------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                                 | `queued -> thinking -> done`       |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | la respuesta del hilo omite el adjunto `filePath` | la respuesta del hilo lo incluye   |

El valor predeterminado de `--candidate` es `HEAD`. Otras opciones: `--credential-source`
(valor predeterminado: `convex`), `--credential-role` (valor predeterminado: `ci`), `--provider-mode`
(valor predeterminado: `live-frontier`), `--fast` (activado de forma predeterminada), `--skip-install`, `--skip-build`.

El ejecutor crea checkouts `git worktree` separados para la referencia base y la
candidata en `<output-dir>/worktrees/`, ejecuta `pnpm install`/`pnpm build` en
cada uno (salvo que se omitan) y, después, ejecuta
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
en cada worktree. Cada flujo escribe `discord-qa-reaction-timelines.json`
junto con un par `<scenario-id>-timeline.html`/`.png`; el ejecutor vuelve a copiar esta
evidencia en `baseline/`/`candidate/`, escribe `comparison.json`,
`mantis-report.md` y `mantis-evidence.json` en el directorio de salida, y
finaliza con un código distinto de cero si la comparación no fue satisfactoria (referencia base `fail` y candidata
`pass`).

El segundo escenario de Discord (`discord-thread-reply-filepath-attachment`) publica
un mensaje principal con el bot controlador, crea un hilo real, llama a la acción
`message.thread-reply` del SUT con un `filePath` local del repositorio y, después, consulta periódicamente el
hilo para encontrar la respuesta y el nombre de archivo del adjunto. Espera un adjunto
llamado `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Arrienda o reutiliza un escritorio de Crabbox, inicia un navegador dentro de la sesión VNC
dirigido a `--browser-url` (valor predeterminado: `https://openclaw.ai`) o a un
`--html-file` renderizado, espera, captura una imagen con `scrot`, opcionalmente graba un MP4 con
`ffmpeg` y sincroniza mediante rsync `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
de vuelta en `--output-dir`.

Opciones:

- `--lease-id <cbx_...>` reutiliza un escritorio precalentado en lugar de crear uno.
- `--browser-profile-dir <remote-path>` reutiliza un directorio remoto de datos de usuario de Chrome para que un escritorio persistente conserve la sesión iniciada entre ejecuciones (se usa para un perfil de visualización de Discord Web de larga duración).
- `--browser-profile-archive-env <name>` restaura un archivo de perfil de Chrome `.tgz` codificado en base64 desde esa variable de entorno antes de iniciar (valor predeterminado: `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); se usa para testigos con sesión iniciada, como Discord Web.
- `--video-duration <seconds>` controla la duración de la captura MP4 (valor predeterminado: 10s).
- `--keep-lease` (o `OPENCLAW_MANTIS_KEEP_VM=1`) mantiene abierto para la inspección mediante VNC un arrendamiento creado por esta ejecución; las ejecuciones fallidas que crearon un arrendamiento también lo mantienen de forma predeterminada.

Para la evidencia de Discord Web, Mantis usa una cuenta de visualización dedicada, no un token
de bot. El oráculo REST de Discord (mediante `qa discord`) sigue siendo la fuente autoritativa; cuando
se establece `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, el escenario también escribe un
artefacto de URL de Discord Web, y `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` mantiene el
hilo abierto el tiempo suficiente para que el navegador lo abra.

El flujo de trabajo de GitHub prefiere un perfil de visualización persistente mediante
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (los archivos de perfil completos pueden superar
el límite de tamaño de secretos de GitHub); para perfiles pequeños/de arranque puede restaurar en su lugar un
`.tgz` codificado en base64 desde `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Si
no se configura ninguna de las fuentes, el flujo de trabajo sigue publicando las capturas de pantalla deterministas
de referencia base/candidata y registra que se omitió el testigo con sesión iniciada.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Arrienda o reutiliza un escritorio de Crabbox, sincroniza el checkout con la VM, ejecuta
`pnpm openclaw qa slack` en ella, abre Slack Web en el navegador VNC,
captura el escritorio y copia localmente tanto los artefactos de QA de Slack (`slack-qa/`) como
la captura de pantalla/vídeo de VNC. Esta es la única modalidad de Mantis en la que el
Gateway del SUT y el navegador se ejecutan en la misma VM.

Con `--gateway-setup`, el comando crea un directorio inicial persistente y desechable de OpenClaw
en `$HOME/.openclaw-mantis/slack-openclaw` dentro de la VM, modifica la configuración de Slack
Socket Mode para el canal de destino, inicia
`openclaw gateway run --dev --allow-unconfigured --port 38973` y deja
Chrome en ejecución en la sesión VNC; si se omite `--gateway-setup`, se ejecuta en su lugar el
flujo normal de QA de Slack entre bots.

Variables de entorno necesarias para `--credential-source env` (el valor predeterminado local es `env`; el rol
predeterminado es `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para el flujo remoto del modelo (si solo se establece `OPENAI_API_KEY`
  localmente, Mantis lo copia en `OPENCLAW_LIVE_OPENAI_KEY` antes de
  invocar Crabbox)

Con `--credential-source convex`, Mantis arrienda las credenciales del SUT de Slack del
grupo compartido antes de crear la VM y reenvía el identificador del canal, el token de la aplicación y
el token del bot a la VM como variables de entorno `OPENCLAW_MANTIS_SLACK_*`, por lo que los flujos de trabajo de GitHub
solo necesitan el secreto del intermediario Convex, no los tokens de Slack sin procesar.

Otras opciones: `--slack-url <url>` abre una URL específica (de lo contrario, Mantis deriva
`https://app.slack.com/client/<team>/<channel>` a partir de `auth.test`);
`--slack-channel-id <id>` establece el canal de la lista de permitidos del Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla el perfil persistente de Chrome
dentro de la VM (valor predeterminado: `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` ejecuta los escenarios nativos de aprobación de Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) y renderiza
capturas de pantalla de puntos de control pendientes/resueltos en lugar de configurar el Gateway (es
mutuamente excluyente con `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` y `--fast` se transfieren al
flujo en vivo de Slack.

Las capturas de pantalla de los puntos de control de aprobación se renderizan a partir del mensaje de la API de Slack que
observó el escenario, no de la interfaz de Slack en vivo; `slack-desktop-smoke.png` solo
demuestra Slack Web cuando el perfil del navegador del arrendamiento ya tenía una
sesión iniciada.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Alquila o reutiliza un escritorio de Crabbox, instala Telegram Desktop nativo para Linux,
opcionalmente restaura un archivo de sesión de usuario, configura OpenClaw con el
token del bot SUT de Telegram alquilado, inicia
`openclaw gateway run --dev --allow-unconfigured --port 38974`, publica un
mensaje de disponibilidad del bot controlador en el grupo privado alquilado y, a continuación, captura una
imagen y un MP4. Un token de bot solo configura OpenClaw; nunca inicia
sesión en Telegram Desktop. El visor del escritorio es una sesión independiente de usuario de Telegram
restaurada desde `--telegram-profile-archive-env <name>` o iniciada manualmente
mediante VNC y mantenida activa con `--keep-lease`.

Marcas: `--lease-id <cbx_...>` vuelve a ejecutar en una VM que ya tiene una sesión iniciada en
Telegram Desktop; `--telegram-profile-archive-env <name>` restaura un archivo de perfil
`.tgz` codificado en base64 antes del inicio; `--telegram-profile-dir <remote-path>`
establece el directorio remoto del perfil (valor predeterminado: `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` solo instala y abre Telegram Desktop;
`--credential-source`/`--credential-role` tienen como valores predeterminados `convex`/`maintainer`.

## Manifiesto de evidencias

Cada escenario que publica en una PR escribe `mantis-evidence.json` junto a
su informe:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "QA de reacciones de estado de Discord con Mantis",
  "summary": "Resumen principal legible por personas para el comentario de la PR.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "solo en cola" },
    "candidate": { "sha": "...", "status": "pass", "expected": "en cola -> pensando -> terminado" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Referencia solo en cola",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Cronología de referencia de Discord",
      "width": 420
    }
  ]
}
```

La `path` del artefacto es relativa al directorio del manifiesto; `targetPath` es
relativa al prefijo de artefactos de R2/S3 configurado. `scripts/mantis/publish-pr-evidence.mjs`
rechaza el recorrido de rutas y omite las entradas con `"required": false` cuando falta el
archivo.

Tipos de artefacto: `timeline` (captura de pantalla determinista del antes y el después),
`desktopScreenshot` (captura de pantalla de VNC/navegador), `motionPreview` (GIF animado
en línea de la grabación), `motionClip` (MP4 recortado al movimiento), `fullVideo` (grabación
completa), `metadata` (archivo complementario JSON/de registro), `report` (informe Markdown).

Disposición de los artefactos de una ejecución en disco:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Las capturas de pantalla son evidencias, no secretos, pero aun así requieren rigor en la censura:
pueden aparecer nombres de canales privados, nombres de usuario o contenido de mensajes. Establezca
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para las cargas públicas de artefactos; está
habilitado de forma predeterminada en los flujos de trabajo de GitHub de Discord/Slack/Telegram.

## Automatización de GitHub

`scripts/mantis/publish-pr-evidence.mjs` es el publicador reutilizable. Los flujos de trabajo
lo invocan con el manifiesto, la PR de destino, la raíz de destino de los artefactos, el marcador del comentario,
la URL del artefacto, la URL de la ejecución y el origen de la solicitud. Carga los artefactos declarados en
el bucket R2 de Mantis, crea un comentario de PR que comienza con el resumen e incluye
imágenes/vistas previas en línea y vídeos enlazados y, a continuación, actualiza el comentario existente con el marcador o
crea uno nuevo. Variables de entorno requeridas:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (los flujos de trabajo establecen `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (los flujos de trabajo establecen `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (los flujos de trabajo establecen `https://artifacts.openclaw.ai`)

Los comentarios se publican mediante la aplicación de GitHub de Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), no mediante `github-actions[bot]`, usando un comentario
marcador oculto como clave de inserción o actualización.

| Flujo de trabajo                   | Desencadenador                                                                              | Qué hace                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`             | ejecución manual                                                                            | Ejecuta `discord-smoke` en una referencia elegida.                                                                                                                                                                                                                                                                          |
| `Mantis Discord Status Reactions`  | comentario en una PR o ejecución manual                                                     | Crea árboles de trabajo separados para la referencia y el candidato, ejecuta `discord-status-reactions-tool-only` en cada uno, representa la cronología de cada vía en un navegador de escritorio de Crabbox, genera vistas previas GIF/MP4 recortadas al movimiento con `crabbox media preview`, carga los artefactos y publica evidencias en línea en la PR. |
| `Mantis Scenario`                  | ejecución manual                                                                            | Despachador genérico: recibe `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` y los reenvía al flujo de trabajo del escenario correspondiente. |
| `Mantis Slack Desktop Smoke`       | ejecución manual                                                                            | Alquila un escritorio Linux de Crabbox (el valor predeterminado es `aws`, con opción de `hetzner`), ejecuta `slack-desktop-smoke --gateway-setup` en el candidato, graba el escritorio, genera una vista previa de movimiento, carga los artefactos y publica evidencias en la PR cuando se proporciona un número de PR.       |
| `Mantis Telegram Live`             | comentario en una PR o ejecución manual                                                     | Ejecuta la vía de QA en vivo de Telegram mediante la API de bots (`openclaw qa telegram`), escribe `mantis-evidence.json` a partir del resumen de QA, representa HTML de evidencias censuradas mediante un navegador de escritorio de Crabbox, genera un GIF de movimiento y publica evidencias en la PR. Esta vía no requiere iniciar sesión en Telegram Web. |
| `Mantis Telegram Desktop Proof`    | etiqueta de PR de mantenedor (`mantis: telegram-visible-proof`) más un comentario en la PR, o ejecución manual | Prueba agéntica del antes y el después en Telegram Desktop nativo. Entrega a Codex la PR, las referencias de la versión de referencia y del candidato y las instrucciones del mantenedor; Codex ejecuta la vía de prueba real de Telegram Desktop con un usuario de Crabbox para ambas referencias y publica una tabla de evidencias de dos columnas en la PR. |
| `Mantis Web UI Chat Proof`         | comentario en una PR o ejecución manual                                                     | Ejecuta en el candidato la prueba específica de chat de la interfaz de control de OpenClaw con Playwright, verifica que el navegador envíe a través del Gateway simulado, captura artefactos de imagen/vídeo y publica evidencias en la PR. Esta vía solo prueba el chat web, no WinUI/aplicaciones nativas ni pruebas visuales arbitrarias. |

Tanto `Mantis Discord Status Reactions` como `Mantis Telegram Live` aceptan
`baseline_ref`/`candidate_ref` (o `baseline=`/`candidate=` en un comentario de PR)
y validan que el SHA resuelto sea un antecesor de `origin/main`, una
etiqueta de versión (`v*`) o la cabecera de una PR abierta antes de ejecutarse con
credenciales que contienen secretos.

Desencadenadores mediante comentarios, desde una PR con acceso de escritura/mantenimiento/administración:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Los desencadenadores de Telegram mediante comentarios usan de forma predeterminada el SHA de la cabecera de la PR como candidato y
`telegram-status-command` como escenario; aceptan `provider=aws|hetzner` y
`lease=<cbx_...>` para seleccionar un proveedor específico de Crabbox o un escritorio
precalentado. `Mantis Telegram Desktop Proof` solo responde a un comentario de PR cuando
la PR ya tiene la etiqueta `mantis: telegram-visible-proof`.

Los desencadenadores del chat de la interfaz web mediante comentarios usan de forma predeterminada el SHA de la cabecera de la PR como candidato. Ejecutan
la prueba de chat de la interfaz de control con Gateway simulado y publican artefactos del navegador; use
pruebas normales de Playwright/navegador, capturas de pantalla del mantenedor, Crabbox o artefactos
locales para otras páginas web y superficies de aplicaciones nativas.

ClawSweeper también puede despachar un escenario directamente:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Máquinas y secretos

Los valores predeterminados de Crabbox para la CLI local son `--provider hetzner --class beast`; se pueden sustituir
con `--provider`, `--class`/`--machine-class` o
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Los flujos de trabajo de GitHub
suelen sustituir ambos (por ejemplo, `--class standard` y la entrada de selección del proveedor
`aws`/`hetzner` del flujo de trabajo de Slack). Si un proveedor es demasiado
lento o no está disponible, añádalo detrás de la misma interfaz de Crabbox en lugar de
codificar una alternativa.

Base de la VM: Linux con Chrome/Chromium compatible con escritorio, acceso CDP, VNC/
noVNC, Node 22+ y pnpm, una copia de trabajo de OpenClaw y acceso saliente al
transporte de destino, GitHub, los proveedores de modelos y el intermediario de credenciales.

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
claves de API de proveedores, cookies del navegador, contenido de perfiles de autenticación, contraseñas de VNC ni
cargas útiles de credenciales sin procesar. Si un token se filtra en una incidencia, PR, chat o registro,
rótelo después de almacenar el secreto de sustitución.

## Resultados de las ejecuciones

Los escenarios de transporte del antes y el después distinguen estos resultados para que un entorno
inestable no se interprete como una regresión del producto:

- **Error reproducido**: la versión de referencia falló de la manera esperada por el escenario.
- **Fallo del arnés**: la configuración del entorno, las credenciales, la API de transporte, el navegador
  o el proveedor fallaron antes de que el oráculo fuera significativo.

La prueba de navegador solo del candidato informa de si el candidato superó las aserciones del Gateway
simulado y de la interfaz visible; no afirma que se haya reproducido el comportamiento en la versión de referencia.

## Añadir un escenario

Los escenarios de transporte en vivo se definen en TypeScript para cada transporte (consulte
`MANTIS_SCENARIO_CONFIGS` en `extensions/qa-lab/src/mantis/run.runtime.ts` para
la estructura del antes y el después de Discord), no en un formato de archivo declarativo independiente.
Cada escenario necesita: id y título, transporte, credenciales requeridas, política de referencia
de la versión de referencia, política de referencia del candidato, parche de configuración de OpenClaw, pasos de configuración/estímulo,
oráculo esperado para la versión de referencia y el candidato, objetivos de captura visual, presupuesto de
tiempo de espera y pasos de limpieza.

La prueba enfocada en el navegador solo para candidatos puede usar una prueba E2E
y un flujo de trabajo deterministas y específicos. Mantenga explícito su alcance, valide la referencia del candidato antes de
la ejecución, aísle la publicación respaldada por secretos y emita el mismo contrato de
manifiesto de evidencias.

Prefiera oráculos pequeños y tipados en lugar de comprobaciones visuales: el estado de las reacciones o
las referencias de mensajes de Discord, el estado de la API de reacciones o del `ts` del hilo de Slack, y los identificadores
y encabezados de mensajes de correo electrónico. Use capturas de pantalla del navegador cuando la interfaz de usuario sea el único elemento observable fiable,
y mantenga las comprobaciones visuales como complemento de un oráculo de la API de la plataforma cuando exista.

Después de Discord, Slack y Telegram, la misma estructura de ejecución se extiende a WhatsApp
(inicio de sesión mediante QR, reidentificación, entrega, contenido multimedia y reacciones) y Matrix
(salas cifradas, relaciones entre hilos y respuestas, reanudación tras un reinicio); ninguno está
implementado todavía.

## Preguntas abiertas

- ¿Qué bot de Discord debe actuar como controlador y cuál como SUT cuando se reutilice el bot
  Mantis existente?
- ¿Durante cuánto tiempo debe GitHub conservar los artefactos de Mantis para las PR?
- ¿Cuándo debe ClawSweeper recomendar automáticamente un escenario de Mantis en lugar de
  esperar una orden de un mantenedor?
- ¿Deben censurarse o recortarse las capturas de pantalla antes de cargarlas en las PR públicas?
