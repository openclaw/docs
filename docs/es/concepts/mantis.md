---
read_when:
    - Creación o ejecución de control de calidad visual en vivo para errores de OpenClaw
    - Adición de verificaciones previas y posteriores para una solicitud de incorporación de cambios
    - Añadir escenarios de transporte en vivo de Discord, Slack, WhatsApp u otros servicios
    - Ejecución de una prueba específica en el navegador de la interfaz de control para una referencia candidata
    - Depuración de ejecuciones de control de calidad que requieren capturas de pantalla, automatización del navegador o acceso VNC
summary: Mantis captura evidencia visual de extremo a extremo para comparaciones de transportes en vivo y pruebas específicas en el navegador solo para candidatos, y luego adjunta los artefactos a las PR.
title: Mantis
x-i18n:
    generated_at: "2026-07-11T22:59:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis publica pruebas visuales de CI y un comentario en la PR sobre el comportamiento de OpenClaw.
Los escenarios de transporte en vivo comparan una referencia de base que se sabe que es defectuosa con una referencia candidata;
en su lugar, los flujos específicos del navegador pueden validar una candidata frente a un transporte simulado
determinista. Discord fue el primero en publicarse, con autenticación de bot real, canales de servidor,
reacciones, hilos y un testigo en el navegador. También existen flujos de chat para Slack, Telegram y la interfaz de control
específica; WhatsApp y Matrix no están implementados.

## Responsabilidades

- OpenClaw (`extensions/qa-lab/src/mantis/*`): entorno de ejecución de escenarios, CLI `pnpm openclaw qa mantis <command>`, esquema de pruebas.
- Laboratorio de control de calidad (`extensions/qa-lab/src/live-transports/*`): arnés de transportes en vivo, bots controlador/SUT, generadores de informes y pruebas.
- Crabbox (`openclaw/crabbox`): máquinas Linux preparadas, concesiones, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): puntos de entrada remotos, retención de artefactos.
- ClawSweeper: analiza los comandos de mantenedores en las PR, inicia flujos de trabajo y publica el comentario final en la PR.

## Comandos de la CLI

Todos los comandos tienen la forma `pnpm openclaw qa mantis <command>` y se definen en
`extensions/qa-lab/src/mantis/cli.ts`. Requieren `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
durante la compilación o ejecución (los flujos de trabajo incluidos establecen `OPENCLAW_BUILD_PRIVATE_QA=1` y
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` antes de compilar).

| Comando                         | Finalidad                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Verificar que el bot de Discord de Mantis pueda ver el servidor y el canal, publicar y reaccionar.                                                                                 |
| `run`                           | Ejecutar un escenario de antes/después con las referencias de base y candidata (solo Discord).                                                                           |
| `desktop-browser-smoke`         | Conceder o reutilizar un escritorio de Crabbox, abrir un navegador visible y capturar una imagen y un vídeo.                                                                        |
| `slack-desktop-smoke`           | Conceder o reutilizar un escritorio de Crabbox, ejecutar el control de calidad de Slack en él, abrir Slack Web y capturar pruebas.                                                                  |
| `telegram-desktop-builder`      | Conceder o reutilizar un escritorio de Crabbox, instalar Telegram Desktop y, opcionalmente, configurar un Gateway de OpenClaw.                                                        |
| `visual-task` / `visual-driver` | Captura genérica del escritorio de Crabbox con aserciones opcionales de comprensión de imágenes; `visual-driver` es la parte del controlador iniciada mediante `crabbox record --while`. |

Todos los comandos aceptan `--repo-root <path>` y `--output-dir <path>`; los comandos de Crabbox
también aceptan `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` y `--keep-lease`. Los valores predeterminados de la CLI local
para el proveedor y la clase son `hetzner`/`beast`, salvo que se indique lo contrario; los flujos de trabajo de CI
suelen sobrescribir ambos.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Llama a la API REST de Discord (`https://discord.com/api/v10`) para obtener el usuario
del bot, el servidor, los canales del servidor y el canal de destino; verifica que el
canal pertenezca al servidor y, a continuación, salvo que se use `--skip-post`, publica un mensaje y
añade una reacción `👀`. Escribe `mantis-discord-smoke-summary.json` y
`mantis-discord-smoke-report.md`.

Orden de resolución del token: valor de `--token-file`, después `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(se sobrescribe con `--token-env`) y, por último, un archivo cuyo nombre indique `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(se sobrescribe con `--token-file-env`). Los identificadores del servidor y del canal proceden de
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (se sobrescriben con
`--guild-id` / `--channel-id`) y deben ser identificadores snowflake de Discord de entre 17 y 20 dígitos. Establezca
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para sustituir los identificadores
y nombres del bot, servidor, canal y mensaje por `<redacted>` en el resumen y el informe publicados.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Actualmente, `--transport` solo acepta `discord`. `--scenario` es uno de los dos
identificadores integrados, cada uno con su propia referencia de base predeterminada y sus etiquetas esperadas de antes/después
(`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Escenario                                   | Base predeterminada                           | Resultado esperado de la base                         | Resultado esperado de la candidata            |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | la respuesta del hilo omite el archivo adjunto de `filePath` | la respuesta del hilo lo incluye     |

El valor predeterminado de `--candidate` es `HEAD`. Otras opciones: `--credential-source`
(valor predeterminado: `convex`), `--credential-role` (valor predeterminado: `ci`), `--provider-mode`
(valor predeterminado: `live-frontier`), `--fast` (activado de forma predeterminada), `--skip-install`, `--skip-build`.

El ejecutor crea copias de trabajo `git worktree` desconectadas para la base y la
candidata en `<output-dir>/worktrees/`, ejecuta `pnpm install`/`pnpm build` en
cada una (salvo que se omitan) y, a continuación, ejecuta
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
en cada copia de trabajo. Cada flujo escribe `discord-qa-reaction-timelines.json`,
además de un par `<scenario-id>-timeline.html`/`.png`; el ejecutor vuelve a copiar estas
pruebas en `baseline/`/`candidate/`, escribe `comparison.json`,
`mantis-report.md` y `mantis-evidence.json` en el directorio de salida, y
finaliza con un código distinto de cero si la comparación no supera la prueba (base `fail` y candidata
`pass`).

El segundo escenario de Discord (`discord-thread-reply-filepath-attachment`) publica
un mensaje principal con el bot controlador, crea un hilo real, llama a la acción
`message.thread-reply` del SUT con un `filePath` local al repositorio y, a continuación, consulta periódicamente el
hilo para buscar la respuesta y el nombre del archivo adjunto. Espera un archivo adjunto
llamado `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Concede o reutiliza un escritorio de Crabbox, inicia un navegador dentro de la sesión VNC
que apunta a `--browser-url` (valor predeterminado: `https://openclaw.ai`) o a un archivo
`--html-file` renderizado, espera, captura una imagen con `scrot`, graba opcionalmente un MP4 con
`ffmpeg` y sincroniza mediante rsync `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
de vuelta en `--output-dir`.

Opciones:

- `--lease-id <cbx_...>` reutiliza un escritorio preparado en lugar de crear uno.
- `--browser-profile-dir <remote-path>` reutiliza un directorio remoto de datos de usuario de Chrome para que un escritorio persistente mantenga la sesión iniciada entre ejecuciones (se utiliza para un perfil de visualización de Discord Web de larga duración).
- `--browser-profile-archive-env <name>` restaura antes del inicio un archivo de perfil de Chrome `.tgz` codificado en base64 desde esa variable de entorno (valor predeterminado: `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); se utiliza para testigos con sesión iniciada, como Discord Web.
- `--video-duration <seconds>` controla la duración de la captura MP4 (10 s de forma predeterminada).
- `--keep-lease` (o `OPENCLAW_MANTIS_KEEP_VM=1`) mantiene abierta para su inspección mediante VNC una concesión creada por esta ejecución; de forma predeterminada, las ejecuciones fallidas que hayan creado una concesión también la mantienen.

Para las pruebas de Discord Web, Mantis utiliza una cuenta de visualización específica, no un token
de bot. El oráculo REST de Discord (mediante `qa discord`) sigue siendo la fuente autoritativa; cuando
se establece `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, el escenario también escribe un
artefacto de URL de Discord Web, y `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` mantiene el
hilo abierto el tiempo suficiente para que el navegador lo abra.

El flujo de trabajo de GitHub prefiere un perfil de visualización persistente mediante
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (los archivos de perfiles completos pueden superar
el límite de tamaño de secretos de GitHub); en el caso de perfiles pequeños o de arranque, puede restaurar en su lugar un
archivo `.tgz` codificado en base64 desde `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Si
no se configura ninguna de las dos fuentes, el flujo de trabajo sigue publicando las capturas de pantalla deterministas
de la base y la candidata, y registra que se omitió el testigo con sesión iniciada.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Concede o reutiliza un escritorio de Crabbox, sincroniza la copia de trabajo con la máquina virtual, ejecuta
`pnpm openclaw qa slack` dentro de ella, abre Slack Web en el navegador VNC,
captura el escritorio y copia de vuelta localmente tanto los artefactos del control de calidad de Slack (`slack-qa/`) como
la captura de pantalla y el vídeo de VNC. Esta es la única configuración de Mantis en la que el
Gateway del SUT y el navegador se ejecutan dentro de la misma máquina virtual.

Con `--gateway-setup`, el comando crea un directorio principal persistente y desechable de OpenClaw
en `$HOME/.openclaw-mantis/slack-openclaw` dentro de la máquina virtual, modifica la configuración de
Socket Mode de Slack para el canal de destino, inicia
`openclaw gateway run --dev --allow-unconfigured --port 38973` y deja
Chrome ejecutándose en la sesión VNC; si se omite `--gateway-setup`, se ejecuta en su lugar el flujo normal
de control de calidad de Slack entre bots.

Variables de entorno necesarias para `--credential-source env` (el valor predeterminado local es `env`; el rol
predeterminado es `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para el flujo del modelo remoto (si solo se establece `OPENAI_API_KEY`
  localmente, Mantis la copia en `OPENCLAW_LIVE_OPENAI_KEY` antes de
  invocar Crabbox)

Con `--credential-source convex`, Mantis obtiene temporalmente la credencial del SUT de Slack del
grupo compartido antes de crear la máquina virtual y reenvía el identificador del canal, el token de la aplicación y
el token del bot a la máquina virtual como variables de entorno `OPENCLAW_MANTIS_SLACK_*`, por lo que los flujos de trabajo de GitHub
solo necesitan el secreto del intermediario de Convex, no los tokens sin procesar de Slack.

Otras opciones: `--slack-url <url>` abre una URL específica (de lo contrario, Mantis deriva
`https://app.slack.com/client/<team>/<channel>` a partir de `auth.test`);
`--slack-channel-id <id>` establece el canal de la lista de permitidos del Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla el perfil persistente de Chrome
dentro de la máquina virtual (valor predeterminado: `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` ejecuta los escenarios nativos de aprobación de Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) y renderiza
capturas de pantalla de los puntos de control pendientes y resueltos en lugar de configurar el Gateway (es
mutuamente excluyente con `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` y `--fast` se transfieren al
flujo en vivo de Slack.

Las capturas de pantalla de los puntos de control de aprobación se renderizan a partir del mensaje de la API de Slack que
observó el escenario, no de la interfaz de Slack en vivo; `slack-desktop-smoke.png` solo
demuestra el funcionamiento de Slack Web cuando el perfil del navegador de la concesión ya tenía la sesión
iniciada.

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
mensaje de disponibilidad del bot controlador en el grupo privado alquilado y, después, captura una
imagen de pantalla y un MP4. Un token de bot solo configura OpenClaw; nunca inicia
sesión en Telegram Desktop. El visor de escritorio es una sesión independiente de usuario de Telegram
restaurada desde `--telegram-profile-archive-env <name>` o iniciada manualmente
mediante VNC y mantenida activa con `--keep-lease`.

Opciones: `--lease-id <cbx_...>` vuelve a ejecutar el proceso en una máquina virtual que ya tiene iniciada la sesión en
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
  "title": "Control de calidad de reacciones de estado de Discord de Mantis",
  "summary": "Resumen principal legible para personas destinado al comentario de la PR.",
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

El `path` del artefacto es relativo al directorio del manifiesto; `targetPath` es
relativo al prefijo configurado de artefactos de R2/S3. `scripts/mantis/publish-pr-evidence.mjs`
rechaza el recorrido de rutas y omite las entradas con `"required": false` cuando
falta el archivo.

Tipos de artefactos: `timeline` (captura de pantalla determinista del antes y el después),
`desktopScreenshot` (captura de pantalla de VNC/navegador), `motionPreview` (GIF animado
insertado generado a partir de la grabación), `motionClip` (MP4 recortado según el movimiento), `fullVideo` (grabación
completa), `metadata` (archivo auxiliar JSON/de registro), `report` (informe en Markdown).

Disposición de los artefactos de una ejecución en disco:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Las capturas de pantalla son evidencias, no secretos, pero aun así requieren una redacción cuidadosa:
pueden aparecer nombres de canales privados, nombres de usuario o contenido de mensajes. Establece
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para las cargas públicas de artefactos; está
habilitado de forma predeterminada en los flujos de trabajo de GitHub para Discord/Slack/Telegram.

## Automatización de GitHub

`scripts/mantis/publish-pr-evidence.mjs` es el publicador reutilizable. Los flujos de trabajo
lo invocan con el manifiesto, la PR de destino, la raíz de destino de los artefactos, el marcador del comentario,
la URL de los artefactos, la URL de la ejecución y el origen de la solicitud. Carga los artefactos declarados en
el bucket R2 de Mantis, crea un comentario de PR que comienza con el resumen e incluye
imágenes/vistas previas insertadas y vídeos enlazados y, después, actualiza el comentario existente con el marcador o
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

| Flujo de trabajo                   | Activador                                                                                  | Qué hace                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`             | ejecución manual                                                                           | Ejecuta `discord-smoke` con una referencia elegida.                                                                                                                                                                                                                                                                                                           |
| `Mantis Discord Status Reactions`  | comentario en una PR o ejecución manual                                                    | Crea árboles de trabajo separados para la referencia y el candidato, ejecuta `discord-status-reactions-tool-only` en cada uno, representa la cronología de cada vía en un navegador de escritorio de Crabbox, genera vistas previas GIF/MP4 recortadas según el movimiento con `crabbox media preview`, carga los artefactos y publica evidencias insertadas en la PR. |
| `Mantis Scenario`                  | ejecución manual                                                                           | Ejecutor genérico: recibe `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` y reenvía la solicitud al flujo de trabajo del escenario correspondiente.                            |
| `Mantis Slack Desktop Smoke`       | ejecución manual                                                                           | Alquila un escritorio Linux de Crabbox (valor predeterminado: `aws`, con opción de `hetzner`), ejecuta `slack-desktop-smoke --gateway-setup` con el candidato, graba el escritorio, genera una vista previa del movimiento, carga los artefactos y publica evidencias en la PR cuando se proporciona un número de PR.                                                  |
| `Mantis Telegram Live`             | comentario en una PR o ejecución manual                                                    | Ejecuta la vía de control de calidad en vivo de Telegram mediante la API de bots (`openclaw qa telegram`), escribe `mantis-evidence.json` a partir del resumen del control de calidad, representa HTML de evidencias redactadas mediante un navegador de escritorio de Crabbox, genera un GIF de movimiento y publica evidencias en la PR. Esta vía no requiere iniciar sesión en Telegram Web. |
| `Mantis Telegram Desktop Proof`    | etiqueta de PR del mantenedor (`mantis: telegram-visible-proof`) más comentario en la PR, o ejecución manual | Prueba agéntica nativa del antes y el después en Telegram Desktop. Entrega la PR, las referencias de base/candidato y las instrucciones del mantenedor a Codex, que ejecuta la vía de prueba real de Telegram Desktop en Crabbox para ambas referencias y publica una tabla de evidencias de dos columnas en la PR.                                                    |
| `Mantis Web UI Chat Proof`         | comentario en una PR o ejecución manual                                                    | Ejecuta la prueba específica con Playwright del chat de la interfaz de control de OpenClaw con el candidato, verifica que el navegador envía datos mediante el Gateway simulado, captura artefactos de imagen y vídeo y publica evidencias en la PR. Esta vía solo demuestra el chat web, no WinUI/aplicaciones nativas ni pruebas visuales arbitrarias.             |

Tanto `Mantis Discord Status Reactions` como `Mantis Telegram Live` aceptan
`baseline_ref`/`candidate_ref` (o `baseline=`/`candidate=` en un comentario de PR)
y validan que el SHA resuelto sea un antecesor de `origin/main`, una
etiqueta de versión (`v*`) o la cabecera de una PR abierta antes de ejecutarse con
credenciales que contienen secretos.

Activadores mediante comentarios desde una PR con acceso de escritura/mantenimiento/administración:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Los activadores de Telegram mediante comentarios usan de forma predeterminada el SHA de cabecera de la PR como candidato y
`telegram-status-command` como escenario; aceptan `provider=aws|hetzner` y
`lease=<cbx_...>` para dirigirse a un proveedor específico de Crabbox o a un
escritorio precalentado. `Mantis Telegram Desktop Proof` solo responde a un comentario de PR cuando
la PR ya tiene la etiqueta `mantis: telegram-visible-proof`.

Los activadores mediante comentarios del chat de la interfaz web usan de forma predeterminada el SHA de cabecera de la PR como candidato. Ejecutan
la prueba de chat de la interfaz de control con un Gateway simulado y publican artefactos del navegador; utiliza
pruebas normales de Playwright/navegador, capturas de pantalla del mantenedor, Crabbox o artefactos
locales para otras páginas web y superficies de aplicaciones nativas.

ClawSweeper también puede ejecutar un escenario directamente:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Máquinas y secretos

Los valores predeterminados de Crabbox en la CLI local son `--provider hetzner --class beast`; sobrescríbelos
con `--provider`, `--class`/`--machine-class` o
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Los flujos de trabajo de GitHub
suelen sobrescribir ambos (por ejemplo, `--class standard` y la entrada de elección del proveedor
`aws`/`hetzner` del flujo de trabajo de Slack). Si un proveedor es demasiado
lento o no está disponible, añádelo detrás de la misma interfaz de Crabbox en lugar de
codificar de forma rígida una alternativa.

Configuración base de la máquina virtual: Linux con Chrome/Chromium compatible con escritorio, acceso CDP, VNC/
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
rótalo después de almacenar el secreto de sustitución.

## Resultados de ejecución

Los escenarios de transporte del antes y el después distinguen estos resultados para que un entorno
inestable no se interprete como una regresión del producto:

- **Error reproducido**: la referencia falló de la forma esperada por el escenario.
- **Fallo del entorno de pruebas**: la configuración del entorno, las credenciales, la API de transporte, el navegador
  o el proveedor fallaron antes de que el oráculo fuera significativo.

La prueba de navegador solo para el candidato informa si el candidato superó las
aserciones del Gateway simulado y de la interfaz visible; no afirma que se haya reproducido el comportamiento de referencia.

## Añadir un escenario

Los escenarios de transporte en vivo se definen en TypeScript para cada transporte (consulta
`MANTIS_SCENARIO_CONFIGS` en `extensions/qa-lab/src/mantis/run.runtime.ts` para
la estructura del antes y el después de Discord), no en un formato de archivo declarativo independiente.
Cada escenario necesita: identificador y título, transporte, credenciales requeridas, política de referencia
base, política de referencia candidata, parche de configuración de OpenClaw, pasos de preparación/estímulo,
oráculo esperado para la referencia y el candidato, objetivos de captura visual, presupuesto de
tiempo de espera y pasos de limpieza.

La evidencia enfocada únicamente en el candidato mediante navegador puede usar una prueba E2E determinista dedicada
y un flujo de trabajo. Mantén explícito su alcance, valida la referencia del candidato antes de
la ejecución, aísla la publicación respaldada por secretos y genera el mismo contrato
de manifiesto de evidencias.

Prefiere oráculos pequeños y tipados frente a comprobaciones visuales: el estado de las reacciones de Discord o
las referencias de mensajes, el `ts` del hilo de Slack o el estado de las reacciones mediante la API, y los identificadores
y encabezados de los mensajes de correo electrónico. Usa capturas de pantalla del navegador cuando la interfaz de usuario sea el único elemento observable fiable
y mantén las comprobaciones visuales como complemento de un oráculo de la API de la plataforma cuando exista.

Después de Discord, Slack y Telegram, la misma estructura del ejecutor se amplía a WhatsApp
(inicio de sesión mediante QR, reidentificación, entrega, contenido multimedia y reacciones) y Matrix
(salas cifradas, relaciones entre hilos y respuestas, y reanudación tras un reinicio); ninguno está
implementado todavía.

## Preguntas abiertas

- ¿Qué bot de Discord debería actuar como controlador y cuál como SUT cuando se reutilice el bot
  Mantis existente?
- ¿Durante cuánto tiempo debería GitHub conservar los artefactos de Mantis para las PR?
- ¿Cuándo debería ClawSweeper recomendar automáticamente un escenario de Mantis en lugar de
  esperar una orden de un mantenedor?
- ¿Deberían censurarse o recortarse las capturas de pantalla antes de subirlas a las PR públicas?
