---
read_when:
    - Crear o ejecutar control de calidad visual en vivo para errores de OpenClaw
    - Añadir verificación previa y posterior para una solicitud de incorporación de cambios
    - Agregar escenarios de transporte en vivo de Discord, Slack, WhatsApp u otros
    - Depuración de ejecuciones de QA que necesitan capturas de pantalla, automatización del navegador o acceso VNC
summary: Mantis es el sistema visual de verificación de extremo a extremo para reproducir errores de OpenClaw en transportes en vivo, capturar evidencia de antes y después y adjuntar artefactos a los PR.
title: Mantis
x-i18n:
    generated_at: "2026-05-06T05:30:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis es el sistema de verificación de extremo a extremo de OpenClaw para errores que necesitan un
runtime real, un transporte real y evidencia visible. Ejecuta un escenario contra una ref
defectuosa conocida, captura evidencia, ejecuta el mismo escenario contra una ref candidata y
publica la comparación como artefactos que un mantenedor puede inspeccionar desde un PR o
desde un comando local.

Mantis comienza con Discord porque Discord nos da un primer carril de alto valor:
autenticación real de bot, canales reales de guild, reacciones, hilos, comandos nativos y una
interfaz de navegador donde las personas pueden confirmar visualmente lo que mostró el transporte.

## Objetivos

- Reproducir un error de un issue o PR de GitHub con la misma forma de transporte que los usuarios
  ven.
- Capturar un artefacto **antes** en la ref de referencia antes de aplicar la corrección.
- Capturar un artefacto **después** en la ref candidata después de aplicar la corrección.
- Usar un oráculo determinista siempre que sea posible, como una lectura de reacción por REST de Discord
  o una comprobación de transcripción de canal.
- Capturar capturas de pantalla cuando el error tenga una superficie de IU visible.
- Ejecutarse localmente desde una CLI controlada por un agente y de forma remota desde GitHub.
- Preservar suficiente estado de la máquina para rescate por VNC cuando el inicio de sesión, la automatización del navegador o
  la autenticación del proveedor se atasquen.
- Publicar estado conciso en un canal de Discord para operadores cuando la ejecución esté bloqueada,
  necesite ayuda manual por VNC o finalice.

## No objetivos

- Mantis no sustituye a las pruebas unitarias. Una ejecución de Mantis normalmente debería convertirse
  en una prueba de regresión más pequeña después de entender la corrección.
- Mantis no es la puerta rápida normal de CI. Es más lento, usa credenciales reales y
  se reserva para errores donde el entorno real importa.
- Mantis no debería requerir una persona para la operación normal. VNC manual es una ruta de rescate,
  no el camino esperado.
- Mantis no almacena secretos sin procesar en artefactos, registros, capturas de pantalla, informes Markdown
  ni comentarios de PR.

## Propiedad

Mantis vive en la pila de QA de OpenClaw.

- OpenClaw posee el runtime de escenarios, los adaptadores de transporte, el esquema de evidencia y
  la CLI local bajo `pnpm openclaw qa mantis`.
- QA Lab posee las piezas del arnés de transporte real, los helpers de captura de navegador y
  los escritores de artefactos.
- Crabbox posee máquinas Linux preparadas cuando se necesita una VM remota.
- GitHub Actions posee el punto de entrada del workflow remoto y la retención de artefactos.
- ClawSweeper posee el enrutamiento de comentarios de GitHub: analizar comandos de mantenedores,
  despachar el workflow y publicar el comentario final en el PR.
- Los agentes de OpenClaw controlan Mantis mediante Codex cuando un escenario necesita configuración agéntica,
  depuración o reporte de estado atascado.

Este límite mantiene el conocimiento de transporte en OpenClaw, la programación de máquinas en
Crabbox y el pegamento del flujo de trabajo de mantenedores en ClawSweeper.

## Forma del comando

El primer comando local verifica el bot de Discord, guild, canal, envío de mensaje,
envío de reacción y ruta de artefactos:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

El ejecutor local de antes y después acepta esta forma:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

El ejecutor crea worktrees desacoplados de referencia y candidato bajo el directorio de salida,
instala dependencias, compila cada ref, ejecuta el escenario con
`--allow-failures`, y luego escribe `baseline/`, `candidate/`, `comparison.json`
y `mantis-report.md`. Para el primer escenario de Discord, una verificación exitosa
significa que el estado de referencia es `fail` y el estado candidato es `pass`.

La segunda sonda de Discord de antes/después apunta a adjuntos en hilos:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Ese escenario publica un mensaje padre con el bot controlador, crea un hilo real de Discord,
llama a la acción `message.thread-reply` de OpenClaw con un `filePath` local del repo,
y luego sondea el hilo para la respuesta del SUT y el nombre de archivo del adjunto. La
captura de pantalla de referencia muestra la respuesta sin adjunto; la captura candidata
muestra el adjunto esperado `mantis-thread-report.md`.

La primera primitiva de VM/navegador es el smoke de escritorio:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Alquila o reutiliza una máquina de escritorio Crabbox, inicia un navegador visible dentro de la
sesión VNC, captura el escritorio, trae los artefactos de vuelta al directorio de salida
local y escribe el comando de reconexión en el informe. El comando usa por defecto
el proveedor Hetzner porque es el primer proveedor con cobertura funcional de escritorio/VNC
en el carril de Mantis. Sobrescríbelo con `--provider`, `--crabbox-bin` u
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` cuando ejecutes contra otra flota de Crabbox.

Flags útiles del smoke de escritorio:

- `--lease-id <cbx_...>` u `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reutiliza un escritorio preparado.
- `--browser-url <url>` cambia la página abierta en el navegador visible.
- `--html-file <path>` renderiza un artefacto HTML local del repo en el navegador visible. Mantis usa esto para capturar la cronología generada de reacciones de estado de Discord mediante un escritorio Crabbox real.
- `--browser-profile-dir <remote-path>` reutiliza un user-data-dir remoto de Chrome para que un escritorio persistente de Mantis pueda permanecer conectado entre ejecuciones. Úsalo para el perfil de visor de Discord Web de larga duración.
- `--browser-profile-archive-env <name>` restaura un archivo `.tgz` de user-data-dir de Chrome en base64 desde la variable de entorno nombrada antes de iniciar el navegador. Úsalo para testigos con sesión iniciada, como Discord Web. La variable de entorno predeterminada es `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` controla la duración de la captura MP4. Usa una duración más larga para apps web lentas con sesión iniciada que necesitan tiempo para estabilizarse.
- `--keep-lease` u `OPENCLAW_MANTIS_KEEP_VM=1` mantiene abierta una lease recién creada y exitosa para inspección por VNC. Las ejecuciones fallidas mantienen la lease por defecto cuando se creó una, para que un operador pueda reconectarse.
- `--class`, `--idle-timeout` y `--ttl` ajustan el tamaño de la máquina y la vida útil de la lease.

Para evidencia de Discord Web, Mantis usa una cuenta de visor dedicada en lugar de un
token de bot. El escenario de API real de Discord sigue siendo el oráculo: crea el hilo real,
envía el `thread-reply` del SUT y comprueba el adjunto mediante REST de Discord. Cuando
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` está configurado, el escenario también
escribe un artefacto de URL de Discord Web. Cuando `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` está
configurado, deja ese hilo disponible el tiempo suficiente para que un navegador con sesión iniciada lo abra
y lo grabe.

El workflow de GitHub abre la URL del hilo candidato en Discord Web, captura una
captura de pantalla, graba un MP4 y genera una vista previa GIF recortada cuando las
herramientas multimedia de Crabbox están disponibles. Prefiere una ruta de perfil de visor persistente configurada
mediante `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, porque los archivos completos de perfil de Chrome
pueden superar el límite de tamaño de secretos de GitHub. Para perfiles pequeños/de arranque,
el workflow también puede restaurar un archivo `.tgz` en base64 desde
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Si no se configura ninguna fuente de perfil,
el workflow aún publica las capturas de pantalla deterministas de adjuntos de referencia/candidato
y registra un aviso de que se omitió el testigo con sesión iniciada en Discord Web.

La primera primitiva completa de transporte de escritorio es el smoke de escritorio de Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Alquila o reutiliza una máquina de escritorio Crabbox, sincroniza el checkout actual en
la VM, ejecuta `pnpm openclaw qa slack` dentro de esa VM, abre Slack Web en el navegador
VNC, captura el escritorio visible y copia tanto los artefactos de QA de Slack como
la captura de pantalla VNC de vuelta al directorio de salida local. Esta es la primera forma de Mantis
donde el Gateway de OpenClaw del SUT y el navegador viven ambos dentro de la misma
VM de escritorio Linux.

Con `--gateway-setup`, el comando prepara un home persistente y desechable de OpenClaw
en `$HOME/.openclaw-mantis/slack-openclaw`, parchea la configuración de Slack Socket Mode
para el canal seleccionado, inicia `openclaw gateway run` en el puerto
`38973` y mantiene Chrome ejecutándose en la sesión VNC. Este es el modo "déjame un
escritorio Linux con Slack y una claw en ejecución"; el carril de QA de Slack bot a bot
sigue siendo el predeterminado cuando se omite `--gateway-setup`.

Entradas requeridas para `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para el carril de modelo remoto. Si solo
  `OPENAI_API_KEY` está configurado localmente, Mantis lo mapea a `OPENCLAW_LIVE_OPENAI_KEY`
  antes de invocar Crabbox para que el reenvío de env `OPENCLAW_*` de Crabbox pueda llevarlo
  a la VM.

Con `--gateway-setup --credential-source convex`, Mantis alquila la credencial SUT de Slack
del pool compartido antes de crear la VM y reenvía el id de canal alquilado,
el token de app Socket Mode y el token de bot como env runtime `OPENCLAW_MANTIS_SLACK_*`
dentro del escritorio. Eso mantiene ligeros los workflows de GitHub: solo necesitan
el secreto del broker Convex, no tokens sin procesar de bot o app de Slack.

Flags útiles de escritorio de Slack:

- `--lease-id <cbx_...>` vuelve a ejecutar contra una máquina donde un operador ya inició sesión en Slack Web mediante VNC.
- `--gateway-setup` inicia un Gateway persistente de Slack de OpenClaw en la VM en lugar de solo ejecutar el carril de QA bot a bot.
- `--keep-lease` mantiene abierta la VM del Gateway para inspección por VNC después del éxito; `--no-keep-lease` la detiene después de recopilar artefactos.
- `--slack-url <url>` abre una URL específica de Slack Web. Sin esto, Mantis deriva `https://app.slack.com/client/<team>/<channel>` desde `auth.test` de Slack cuando el token de bot del SUT está disponible.
- `--slack-channel-id <id>` controla la allowlist de canales de Slack usada por la configuración del Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla el perfil persistente de Chrome dentro de la VM. El valor predeterminado es `$HOME/.config/openclaw-mantis/slack-chrome-profile`, así que un inicio de sesión manual en Slack Web sobrevive a nuevas ejecuciones en la misma lease.
- `--credential-source convex --credential-role ci` usa el pool de credenciales compartido en lugar de tokens env directos de Slack.
- `--provider-mode`, `--model`, `--alt-model` y `--fast` se transfieren al carril real de Slack.

El workflow smoke de GitHub es `Mantis Discord Smoke`. El workflow de antes y después de GitHub
para el primer escenario real es `Mantis Discord Status Reactions`. Acepta:

- `baseline_ref`: la ref que se espera que reproduzca el comportamiento de solo en cola.
- `candidate_ref`: la ref que se espera que muestre `queued -> thinking -> done`.

Hace checkout de la ref del arnés de workflow, compila worktrees separados de referencia y candidato,
ejecuta `discord-status-reactions-tool-only` contra cada worktree y
sube `baseline/`, `candidate/`, `comparison.json` y `mantis-report.md` como
artefactos de Actions. También renderiza el HTML de cronología de cada carril en un navegador
de escritorio Crabbox y publica esas capturas de pantalla VNC junto a los PNG deterministas
de cronología en el comentario del PR. El mismo comentario del PR incrusta vistas previas GIF
ligeras recortadas por movimiento generadas por `crabbox media preview`, enlaza a los clips MP4
recortados por movimiento correspondientes y conserva los archivos MP4 completos del escritorio para inspección
profunda. Las capturas de pantalla permanecen inline para una revisión rápida. El workflow compila la
CLI de Crabbox desde
`openclaw/crabbox` main para poder usar los flags actuales de lease de escritorio/navegador
antes de que se publique el próximo binario de Crabbox.

`Mantis Scenario` es el punto de entrada manual genérico. Toma un `scenario_id`,
`candidate_ref`, un `baseline_ref` opcional y un `pr_number` opcional, y luego
despacha el workflow propiedad del escenario. El wrapper es intencionalmente fino:
los workflows de escenario siguen siendo dueños de su configuración de transporte, credenciales, clase de VM,
oráculo esperado y manifiesto de artefactos.

`Mantis Slack Desktop Smoke` es el primer flujo de trabajo de VM de Slack. Comprueba la
ref candidata de confianza en un worktree separado, arrienda un escritorio Linux
de Crabbox, ejecuta `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` contra esa
candidata, abre Slack Web en el navegador VNC, graba el escritorio, genera una
vista previa recortada por movimiento con `crabbox media preview`, sube el directorio
completo de artefactos y, opcionalmente, publica el comentario de evidencia
incrustada en el PR de destino. Usa AWS de forma predeterminada para el arriendo
del escritorio y expone una entrada manual de proveedor para que los operadores
puedan cambiar a Hetzner cuando la capacidad de AWS sea lenta o no esté disponible. Usa
esta vía cuando quieras "un escritorio Linux con Slack y una garra en ejecución" en lugar
de solo una transcripción de Slack de bot a bot.

Cada escenario de publicación en PR escribe `mantis-evidence.json` junto a su informe.
Este esquema es el traspaso entre el código del escenario y los comentarios de GitHub:

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

Los valores `path` de artefacto son relativos al directorio del manifiesto. Los valores
`targetPath` son rutas relativas bajo el directorio de publicación de la rama
`qa-artifacts`. El publicador rechaza el cruce de rutas y omite las entradas marcadas
como `"required": false` cuando las vistas previas o los videos opcionales no están disponibles.

Tipos de artefactos admitidos:

- `timeline`: captura de pantalla determinista del escenario, normalmente antes/después.
- `desktopScreenshot`: captura de pantalla del escritorio VNC/navegador.
- `motionPreview`: GIF animado incrustado generado a partir de la grabación del escritorio.
- `motionClip`: MP4 recortado por movimiento que elimina la entrada y la cola estáticas.
- `fullVideo`: grabación MP4 completa para inspección detallada.
- `metadata`: JSON/log complementario.
- `report`: informe en Markdown.

El publicador reutilizable es `scripts/mantis/publish-pr-evidence.mjs`. Los flujos de trabajo
lo llaman con el manifiesto, el PR de destino, la raíz de destino de `qa-artifacts`, el marcador
de comentario, la URL del artefacto de Actions, la URL de ejecución y el origen de la solicitud.
Copia los artefactos declarados a la rama `qa-artifacts`, crea un comentario de PR con el resumen
primero, con imágenes/vistas previas incrustadas y videos enlazados, y luego actualiza el comentario
marcador existente o crea uno.

También puedes activar la ejecución de reacciones de estado directamente desde un comentario de PR:

```text
@Mantis discord status reactions
```

El activador por comentario es intencionalmente limitado. Solo se ejecuta en comentarios de pull request
de usuarios con acceso de escritura, mantenimiento o administración, y solo reconoce solicitudes de
reacciones de estado de Discord. De forma predeterminada usa la ref base conocida como defectuosa
y el SHA de cabecera actual del PR como candidata. Los mantenedores pueden sobrescribir cualquiera
de las dos refs:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Ejemplos de comandos de ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

El primer comando es explícito y centrado en el escenario. El segundo puede mapear más adelante un PR
o issue a escenarios Mantis recomendados a partir de etiquetas, archivos modificados y hallazgos de
revisión de ClawSweeper.

## Ciclo de vida de la ejecución

1. Adquirir credenciales.
2. Asignar o reutilizar una VM.
3. Preparar el perfil de escritorio/navegador cuando el escenario necesite evidencia de UI.
4. Preparar un checkout limpio para la ref base.
5. Instalar dependencias y compilar solo lo que el escenario necesita.
6. Iniciar un OpenClaw Gateway hijo con un directorio de estado aislado.
7. Configurar el transporte en vivo, el proveedor, el modelo y el perfil del navegador.
8. Ejecutar el escenario y capturar evidencia base.
9. Detener el Gateway y conservar los logs.
10. Preparar la ref candidata en la misma VM.
11. Ejecutar el mismo escenario y capturar evidencia candidata.
12. Comparar los resultados del oráculo y la evidencia visual.
13. Escribir Markdown, JSON, logs, capturas de pantalla y artefactos de traza opcionales.
14. Subir artefactos de GitHub Actions.
15. Publicar un mensaje conciso de estado en PR o Discord.

El escenario debería poder fallar de dos maneras distintas:

- **Bug reproducido**: la base falló de la forma esperada.
- **Fallo del arnés**: la configuración del entorno, las credenciales, la API de Discord, el navegador o
  el proveedor fallaron antes de que el oráculo del bug fuera significativo.

El informe final debe separar estos casos para que los mantenedores no confundan un entorno inestable
con el comportamiento del producto.

## MVP de Discord

El primer escenario debería apuntar a reacciones de estado de Discord en canales de servidor donde
el modo de entrega de respuesta de origen es `message_tool_only`.

Por qué es una buena semilla para Mantis:

- Es visible en Discord como reacciones en el mensaje activador.
- Tiene un oráculo REST sólido mediante el estado de reacciones de mensajes de Discord.
- Ejercita un OpenClaw Gateway real, autenticación de bot de Discord, despacho de mensajes,
  modo de entrega de respuesta de origen, estado de reacciones de estado y ciclo de vida del turno del modelo.
- Es lo bastante limitado para mantener honesta la primera implementación.

Forma esperada del escenario:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

La evidencia base debería mostrar la reacción de confirmación en cola pero ninguna transición de
ciclo de vida en modo solo herramienta. La evidencia candidata debería mostrar reacciones de estado
de ciclo de vida ejecutándose cuando `messages.statusReactions.enabled` es explícitamente
true.

La primera porción ejecutable es el escenario de QA en vivo de Discord de participación explícita:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Configura el SUT con manejo de servidores siempre activo, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` y reacciones de estado explícitas. El oráculo
sondea el mensaje activador real de Discord y espera la secuencia observada
`👀 -> 🤔 -> 👍`. Los artefactos incluyen `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` y
`discord-status-reactions-tool-only-timeline.png`.

## Piezas de QA existentes

Mantis debería construirse sobre la pila privada de QA existente en lugar de partir de cero:

- `pnpm openclaw qa discord` ya ejecuta una vía de Discord en vivo con bots controlador y SUT.
- El ejecutor de transporte en vivo ya escribe informes y artefactos de mensajes observados
  bajo `.artifacts/qa-e2e/`.
- Los arriendos de credenciales de Convex ya proporcionan acceso exclusivo a credenciales compartidas
  de transporte en vivo.
- El servicio de control del navegador ya admite capturas de pantalla, snapshots,
  perfiles administrados headless y perfiles CDP remotos.
- QA Lab ya tiene una UI de depurador y un bus para pruebas con forma de transporte.

La primera implementación de Mantis puede ser un ejecutor ligero de antes/después sobre estas
piezas, más una capa de evidencia visual.

## Modelo de evidencia

Cada ejecución escribe un directorio de artefactos estable:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` debería ser la fuente de verdad legible por máquina. El
informe Markdown es para comentarios de PR y revisión humana.

El resumen debe incluir:

- refs y SHAs probados
- transporte e id de escenario
- proveedor de máquina e id de máquina o id de arriendo
- origen de credenciales sin valores secretos
- resultado base
- resultado candidato
- si el bug se reprodujo en la base
- si la candidata lo corrigió
- rutas de artefactos
- problemas de configuración o limpieza saneados

Las capturas de pantalla son evidencia, no secretos. Aun así necesitan disciplina de redacción:
pueden aparecer nombres de canales privados, nombres de usuario o contenido de mensajes. Para PRs públicos,
prefiere enlaces de artefactos de GitHub Actions en lugar de imágenes incrustadas hasta que la historia
de redacción sea más sólida.

## Navegador y VNC

La vía del navegador tiene dos modos:

- **Automatización headless**: predeterminada para CI. Chrome se ejecuta con CDP habilitado, y
  Playwright o el control de navegador de OpenClaw captura capturas de pantalla.
- **Rescate VNC**: habilitado en la misma VM cuando el inicio de sesión, MFA, la anti-automatización de Discord
  o la depuración visual necesitan una persona.

El perfil de navegador observador de Discord debería ser lo bastante persistente para evitar iniciar sesión
en cada ejecución, pero estar aislado del estado personal del navegador. Un perfil pertenece al pool de
máquinas de Mantis, no al portátil de un desarrollador.

Cuando Mantis se atasca, publica un mensaje de estado en Discord con:

- id de ejecución
- id de escenario
- proveedor de máquina
- directorio de artefactos
- instrucciones de conexión VNC o noVNC si están disponibles
- texto breve del bloqueo

El primer despliegue privado puede publicar estos mensajes en el canal de operadores existente y moverse
más adelante a un canal dedicado de Mantis.

## Máquinas

Mantis debería preferir AWS a través de Crabbox para la primera implementación remota.
Crabbox nos da máquinas calentadas, seguimiento de arriendos, hidratación, logs, resultados y
limpieza. Si la capacidad de AWS es demasiado lenta o no está disponible, añade un proveedor Hetzner
detrás de la misma interfaz de máquina.

Requisitos mínimos de la VM:

- Linux con una instalación de Chrome o Chromium capaz de escritorio
- acceso CDP para automatización del navegador
- VNC o noVNC para rescate
- Node 22 y pnpm
- checkout de OpenClaw y caché de dependencias
- caché de navegador Playwright Chromium cuando se use Playwright
- suficiente CPU y memoria para un OpenClaw Gateway, un navegador y una ejecución de modelo
- acceso saliente a Discord, GitHub, proveedores de modelo y el intermediario de credenciales

La VM no debería conservar secretos sin procesar de larga duración fuera de los almacenes esperados
de credenciales o perfiles de navegador.

## Secretos

Los secretos viven en secretos de organización o repositorio de GitHub para ejecuciones remotas, y en
un archivo secreto controlado por el operador local para ejecuciones locales.

Nombres de secretos recomendados:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para subidas públicas de artefactos de GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

A largo plazo, el pool de credenciales de Convex debería seguir siendo la fuente normal para credenciales
de transporte en vivo. Los secretos de GitHub arrancan el intermediario y las vías de respaldo.
El flujo de trabajo de reacciones de estado de Discord asigna los secretos Mantis Crabbox de vuelta a
las variables de entorno `CRABBOX_COORDINATOR` y `CRABBOX_COORDINATOR_TOKEN`
que espera la CLI de Crabbox. Los nombres de secretos de GitHub `CRABBOX_*` simples siguen
aceptándose como respaldo de compatibilidad.

El ejecutor de Mantis nunca debe imprimir:

- tokens de bot de Discord
- claves API de proveedor
- cookies del navegador
- contenidos del perfil de autenticación
- contraseñas de VNC
- cargas útiles de credenciales sin procesar

Las subidas públicas de artefactos también deberían redactar metadatos de destino de Discord como ids de bot,
servidor, canal y mensaje. El flujo de trabajo de smoke de GitHub habilita
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` por este motivo.

Si un token se pega accidentalmente en un issue, PR, chat o log, rótalo
después de almacenar el nuevo secreto.

## Artefactos de GitHub y comentarios de PR

Los flujos de trabajo de Mantis deben subir el paquete completo de evidencias como un artefacto de Actions de corta duración. Cuando el flujo de trabajo se ejecuta para un informe de error o un PR de corrección, también debe publicar las capturas de pantalla PNG redactadas en la rama `qa-artifacts` y crear o actualizar un comentario en ese error o PR de corrección con capturas de pantalla antes/después en línea. No publiques la prueba principal únicamente en un PR genérico de automatización de QA. Los registros sin procesar, los mensajes observados y otras evidencias voluminosas permanecen en el artefacto de Actions.

Los flujos de trabajo de producción deben publicar esos comentarios con la GitHub App de Mantis, no con `github-actions[bot]`. Almacena el id de la aplicación y la clave privada como secretos de GitHub Actions `MANTIS_GITHUB_APP_ID` y `MANTIS_GITHUB_APP_PRIVATE_KEY`. El flujo de trabajo usa un marcador oculto como clave de creación o actualización, actualiza ese comentario cuando el token puede editarlo y crea un nuevo comentario propiedad de Mantis cuando no se puede editar un marcador antiguo propiedad del bot.

El comentario del PR debe ser breve y visual:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Cuando la ejecución falla porque falló el arnés, el comentario debe decir eso en lugar de insinuar que falló el candidato.

## Notas de despliegue privado

Un despliegue privado puede tener ya una aplicación de Discord de Mantis. Reutiliza esa aplicación en lugar de crear otra cuando tenga los permisos de bot adecuados y pueda rotarse de forma segura.

Configura el canal inicial de notificaciones del operador mediante secretos o la configuración del despliegue. Puede apuntar primero a un canal existente de mantenedores u operaciones, y luego moverse a un canal dedicado de Mantis cuando exista uno.

No pongas ids de gremios, ids de canales, tokens de bot, cookies del navegador ni contraseñas de VNC en este documento. Almacénalos en secretos de GitHub, el broker de credenciales o el almacén local de secretos del operador.

## Añadir un escenario

Un escenario de Mantis debe declarar:

- id y título
- transporte
- credenciales requeridas
- política de referencia de línea base
- política de referencia de candidato
- parche de configuración de OpenClaw
- pasos de preparación
- estímulo
- oráculo esperado de línea base
- oráculo esperado de candidato
- objetivos de captura visual
- presupuesto de tiempo de espera
- pasos de limpieza

Los escenarios deben preferir oráculos pequeños y tipados:

- estado de reacción de Discord para errores de reacciones
- referencias de mensajes de Discord para errores de hilos
- ts de hilo de Slack y estado de la API de reacciones para errores de Slack
- ids y encabezados de mensajes de correo electrónico para errores de correo electrónico
- capturas de pantalla del navegador cuando la UI sea el único observable fiable

Las comprobaciones de visión deben ser aditivas. Si una API de plataforma puede demostrar el error, usa la API como oráculo de aprobación/fallo y conserva las capturas de pantalla para dar confianza humana.

## Expansión de proveedores

Después de Discord, el mismo ejecutor puede añadir:

- Slack: reacciones, hilos, menciones de aplicación, modales, subidas de archivos.
- Correo electrónico: autenticación de Gmail e hilos de mensajes usando `gog` cuando los conectores no sean suficientes.
- WhatsApp: inicio de sesión por QR, reidentificación, entrega de mensajes, medios, reacciones.
- Telegram: control de menciones en grupos, comandos, reacciones cuando estén disponibles.
- Matrix: salas cifradas, relaciones de hilo o respuesta, reanudación tras reinicio.

Cada transporte debe tener un escenario de smoke barato y uno o más escenarios de clase de error. Los escenarios visuales costosos deben permanecer opcionales.

## Preguntas abiertas

- ¿Qué bot de Discord debe ser el controlador y cuál debe ser el SUT cuando se reutiliza el bot existente de Mantis?
- ¿El inicio de sesión del navegador observador debe usar una cuenta humana de Discord, una cuenta de prueba o solo evidencia REST legible por bot para la primera fase?
- ¿Durante cuánto tiempo debe GitHub conservar los artefactos de Mantis para los PR?
- ¿Cuándo debe ClawSweeper recomendar automáticamente Mantis en lugar de esperar un comando de un mantenedor?
- ¿Deben redactarse o recortarse las capturas de pantalla antes de subirlas para PR públicos?
