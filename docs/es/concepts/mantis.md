---
read_when:
    - Crear o ejecutar QA visual en vivo para bugs de OpenClaw
    - Agregar verificación previa y posterior para una solicitud de incorporación de cambios
    - Agregar escenarios de transporte en vivo para Discord, Slack, WhatsApp u otros
    - Depurar ejecuciones de QA que necesitan capturas de pantalla, automatización del navegador o acceso VNC
summary: Mantis es el sistema visual de verificación de extremo a extremo para reproducir errores de OpenClaw en transportes en vivo, capturar evidencia del antes y el después, y adjuntar artefactos a las solicitudes de extracción.
title: Mantis
x-i18n:
    generated_at: "2026-06-27T11:12:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis es el sistema de verificación de extremo a extremo de OpenClaw para errores que necesitan un runtime real, un transporte real y pruebas visibles. Ejecuta un escenario contra una referencia conocida como defectuosa, captura evidencia, ejecuta el mismo escenario contra una referencia candidata y publica la comparación como artefactos que un mantenedor puede inspeccionar desde un PR o desde un comando local.

Mantis empieza con Discord porque Discord nos da una primera vía de alto valor: autenticación de bot real, canales de servidor reales, reacciones, hilos, comandos nativos y una interfaz de navegador donde los humanos pueden confirmar visualmente lo que mostró el transporte.

## Objetivos

- Reproducir un error de un issue o PR de GitHub con la misma forma de transporte que ven los usuarios.
- Capturar un artefacto **antes** en la referencia base antes de aplicar la corrección.
- Capturar un artefacto **después** en la referencia candidata después de aplicar la corrección.
- Usar un oráculo determinista siempre que sea posible, como una lectura de reacción mediante la REST API de Discord o una comprobación de transcripción del canal.
- Capturar capturas de pantalla cuando el error tenga una superficie de interfaz visible.
- Ejecutarse localmente desde una CLI controlada por un agente y de forma remota desde GitHub.
- Conservar suficiente estado de la máquina para rescate por VNC cuando el inicio de sesión, la automatización del navegador o la autenticación del proveedor se bloqueen.
- Publicar estado conciso en un canal de operador de Discord cuando la ejecución esté bloqueada, necesite ayuda manual por VNC o termine.

## No objetivos

- Mantis no sustituye a las pruebas unitarias. Una ejecución de Mantis normalmente debería convertirse en una prueba de regresión más pequeña después de entender la corrección.
- Mantis no es la puerta rápida normal de CI. Es más lento, usa credenciales en vivo y se reserva para errores donde el entorno en vivo importa.
- Mantis no debería requerir a un humano para la operación normal. El VNC manual es una ruta de rescate, no la ruta esperada.
- Mantis no almacena secretos sin procesar en artefactos, registros, capturas de pantalla, informes Markdown ni comentarios de PR.

## Propiedad

Mantis vive en la pila de QA de OpenClaw.

- OpenClaw posee el runtime de escenarios, los adaptadores de transporte, el esquema de evidencia y la CLI local bajo `pnpm openclaw qa mantis`.
- QA Lab posee las piezas del arnés de transporte en vivo, los ayudantes de captura de navegador y los escritores de artefactos.
- Crabbox posee las máquinas Linux precalentadas cuando se necesita una VM remota.
- GitHub Actions posee el punto de entrada del flujo de trabajo remoto y la retención de artefactos.
- ClawSweeper posee el enrutamiento de comentarios de GitHub: analizar comandos de mantenedores, despachar el flujo de trabajo y publicar el comentario final del PR.
- Los agentes de OpenClaw dirigen Mantis mediante Codex cuando un escenario necesita preparación agentiva, depuración o informe de estado bloqueado.

Este límite mantiene el conocimiento de transporte en OpenClaw, la programación de máquinas en Crabbox y el pegamento del flujo de trabajo de mantenedores en ClawSweeper.

## Forma del comando

El primer comando local verifica el bot de Discord, el servidor, el canal, el envío de mensajes, el envío de reacciones y la ruta de artefactos:

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

El ejecutor crea árboles de trabajo separados de base y candidato bajo el directorio de salida, instala dependencias, compila cada referencia, ejecuta el escenario con `--allow-failures` y luego escribe `baseline/`, `candidate/`, `comparison.json` y `mantis-report.md`. Para el primer escenario de Discord, una verificación correcta significa que el estado de base es `fail` y el estado del candidato es `pass`.

La segunda sonda de antes/después de Discord apunta a adjuntos en hilos:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Ese escenario publica un mensaje padre con el bot controlador, crea un hilo real de Discord, llama a la acción `message.thread-reply` de OpenClaw con un `filePath` local del repositorio y luego sondea el hilo para obtener la respuesta del SUT y el nombre de archivo del adjunto. La captura de pantalla de base muestra la respuesta sin adjunto; la captura de pantalla del candidato muestra el adjunto esperado `mantis-thread-report.md`.

La primera primitiva de VM/navegador es el smoke de escritorio:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Arrienda o reutiliza una máquina de escritorio de Crabbox, inicia un navegador visible dentro de la sesión VNC, captura el escritorio, trae los artefactos de vuelta al directorio de salida local y escribe el comando de reconexión en el informe. El comando usa de forma predeterminada el proveedor Hetzner porque es el primer proveedor con cobertura de escritorio/VNC funcional en la vía de Mantis. Sobrescríbelo con `--provider`, `--crabbox-bin` u `OPENCLAW_MANTIS_CRABBOX_PROVIDER` cuando ejecutes contra otra flota de Crabbox.

Flags útiles del smoke de escritorio:

- `--lease-id <cbx_...>` u `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reutiliza un escritorio precalentado.
- `--browser-url <url>` cambia la página abierta en el navegador visible.
- `--html-file <path>` renderiza un artefacto HTML local del repositorio en el navegador visible. Mantis usa esto para capturar la línea de tiempo generada de reacciones de estado de Discord mediante un escritorio Crabbox real.
- `--browser-profile-dir <remote-path>` reutiliza un Chrome user-data-dir remoto para que un escritorio persistente de Mantis pueda permanecer conectado entre ejecuciones. Usa esto para el perfil de visor de Discord Web de larga duración.
- `--browser-profile-archive-env <name>` restaura un archivo `.tgz` base64 de Chrome user-data-dir desde la variable de entorno nombrada antes de iniciar el navegador. Usa esto para testigos con sesión iniciada, como Discord Web. La variable de entorno predeterminada es `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` controla la duración de la captura MP4. Usa una duración mayor para aplicaciones web lentas con sesión iniciada que necesiten tiempo para estabilizarse.
- `--keep-lease` u `OPENCLAW_MANTIS_KEEP_VM=1` mantiene abierto un arrendamiento recién creado que pasa para inspección por VNC. Las ejecuciones fallidas mantienen el arrendamiento de forma predeterminada cuando se creó uno, para que un operador pueda reconectarse.
- `--class`, `--idle-timeout` y `--ttl` ajustan el tamaño de la máquina y la vida útil del arrendamiento.

Para evidencia de Discord Web, Mantis usa una cuenta de visor dedicada en lugar de un token de bot. El escenario de la API en vivo de Discord sigue siendo el oráculo: crea el hilo real, envía el `thread-reply` del SUT y comprueba el adjunto mediante Discord REST. Cuando `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` está definido, el escenario también escribe un artefacto de URL de Discord Web. Cuando `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` está definido, deja ese hilo disponible el tiempo suficiente para que un navegador con sesión iniciada lo abra y lo grabe.

El flujo de trabajo de GitHub abre la URL del hilo candidato en Discord Web, captura una captura de pantalla, graba un MP4 y genera una vista previa GIF recortada por movimiento cuando las herramientas multimedia de Crabbox están disponibles. Prefiere una ruta de perfil de visor persistente configurada mediante `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, porque los archivos completos de perfil de Chrome pueden superar el límite de tamaño de secretos de GitHub. Para perfiles pequeños/de arranque, el flujo de trabajo también puede restaurar un archivo `.tgz` base64 desde `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Si no se configura ninguna fuente de perfil, el flujo de trabajo aún publica las capturas de pantalla deterministas de adjuntos de base/candidato y registra un aviso de que se omitió el testigo de Discord Web con sesión iniciada.

La primera primitiva completa de transporte de escritorio es el smoke de escritorio de Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Arrienda o reutiliza una máquina de escritorio de Crabbox, sincroniza el checkout actual en la VM, ejecuta `pnpm openclaw qa slack` dentro de esa VM, abre Slack Web en el navegador VNC, captura el escritorio visible y copia tanto los artefactos de QA de Slack como la captura de pantalla VNC de vuelta al directorio de salida local. Esta es la primera forma de Mantis donde el Gateway OpenClaw del SUT y el navegador viven ambos dentro de la misma VM de escritorio Linux.

Con `--gateway-setup`, el comando prepara un home persistente descartable de OpenClaw en `$HOME/.openclaw-mantis/slack-openclaw`, parchea la configuración de Slack Socket Mode para el canal seleccionado, inicia `openclaw gateway run` en el puerto `38973` y mantiene Chrome ejecutándose en la sesión VNC. Este es el modo "déjame un escritorio Linux con Slack y un claw ejecutándose"; la vía de QA de Slack bot a bot sigue siendo la predeterminada cuando se omite `--gateway-setup`.

Entradas requeridas para `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para la vía del modelo remoto. Si solo `OPENAI_API_KEY` está definida localmente, Mantis la asigna a `OPENCLAW_LIVE_OPENAI_KEY` antes de invocar Crabbox para que el reenvío de variables de entorno `OPENCLAW_*` de Crabbox pueda llevarla dentro de la VM.

Con `--gateway-setup --credential-source convex`, Mantis arrienda la credencial SUT de Slack desde el pool compartido antes de crear la VM y reenvía el id de canal arrendado, el token de app de Socket Mode y el token de bot como variables de entorno de runtime `OPENCLAW_MANTIS_SLACK_*` dentro del escritorio. Eso mantiene ligeros los flujos de trabajo de GitHub: solo necesitan el secreto del broker Convex, no tokens sin procesar de bot o app de Slack.

Flags útiles del escritorio de Slack:

- `--lease-id <cbx_...>` vuelve a ejecutar contra una máquina donde un operador ya inició sesión en Slack Web mediante VNC.
- `--gateway-setup` inicia un Gateway persistente de Slack de OpenClaw en la VM en lugar de ejecutar solo la vía de QA bot a bot.
- `--keep-lease` mantiene la VM del Gateway abierta para inspección por VNC después del éxito; `--no-keep-lease` la detiene después de recolectar artefactos.
- `--slack-url <url>` abre una URL específica de Slack Web. Sin ella, Mantis deriva `https://app.slack.com/client/<team>/<channel>` desde `auth.test` de Slack cuando el token del bot SUT está disponible.
- `--slack-channel-id <id>` controla la lista de canales permitidos de Slack usada por la preparación del Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla el perfil persistente de Chrome dentro de la VM. El valor predeterminado es `$HOME/.config/openclaw-mantis/slack-chrome-profile`, por lo que un inicio de sesión manual en Slack Web sobrevive a nuevas ejecuciones en el mismo arrendamiento.
- `--credential-source convex --credential-role ci` usa el pool de credenciales compartido en lugar de tokens directos de Slack desde variables de entorno.
- `--provider-mode`, `--model`, `--alt-model` y `--fast` se pasan a la vía en vivo de Slack.

Las ejecuciones de punto de control de aprobación renderizan instantáneas de mensajes de la API de Slack en PNG de punto de control para pruebas visuales seguras en CI. `slack-desktop-smoke.png` solo es prueba de Slack Web cuando el arrendamiento usa un perfil de navegador cálido que ya tiene sesión iniciada.

El flujo de trabajo smoke de GitHub es `Mantis Discord Smoke`. El flujo de trabajo de GitHub de antes y después para el primer escenario real es `Mantis Discord Status Reactions`. Acepta:

- `baseline_ref`: la referencia que se espera que reproduzca el comportamiento solo en cola.
- `candidate_ref`: la referencia que se espera que muestre `queued -> thinking -> done`.

Hace checkout de la referencia del arnés del flujo de trabajo, compila árboles de trabajo separados de base y candidato, ejecuta `discord-status-reactions-tool-only` contra cada árbol de trabajo y sube `baseline/`, `candidate/`, `comparison.json` y `mantis-report.md` como artefactos de Actions. También renderiza el HTML de la línea de tiempo de cada vía en un navegador de escritorio de Crabbox y publica esas capturas de pantalla VNC junto a los PNG deterministas de línea de tiempo en el comentario del PR. El mismo comentario del PR incrusta vistas previas GIF ligeras recortadas por movimiento generadas por `crabbox media preview`, enlaza a los clips MP4 coincidentes recortados por movimiento y conserva los archivos MP4 completos del escritorio para inspección profunda. Las capturas de pantalla permanecen insertadas para revisión rápida. El flujo de trabajo compila la CLI de Crabbox desde `openclaw/crabbox` main para poder usar los flags actuales de arrendamiento de escritorio/navegador antes de que se publique la siguiente versión binaria de Crabbox.

`Mantis Scenario` es el punto de entrada manual genérico. Toma un `scenario_id`,
`candidate_ref`, un `baseline_ref` opcional y un `pr_number` opcional; luego
despacha el flujo de trabajo propiedad del escenario. El contenedor es
intencionalmente ligero: los flujos de trabajo de escenario siguen siendo
responsables de su configuración de transporte, credenciales, clase de VM,
oráculo esperado y manifiesto de artefactos.

`Mantis Slack Desktop Smoke` es el primer flujo de trabajo de VM de Slack.
Extrae la ref de candidato de confianza en un worktree separado, arrienda un
escritorio Linux de Crabbox, ejecuta `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` contra ese
candidato, abre Slack Web en el navegador VNC, graba el escritorio, genera una
vista previa recortada por movimiento con `crabbox media preview`, sube el
directorio completo de artefactos y, opcionalmente, publica el comentario de
evidencia insertada en el PR de destino. De forma predeterminada usa AWS para el
arriendo del escritorio y expone una entrada manual de proveedor para que los
operadores puedan cambiar a Hetzner cuando la capacidad de AWS sea lenta o no
esté disponible. Usa este carril cuando quieras "un escritorio Linux con Slack y
una claw en ejecución" en lugar de solo una transcripción de Slack de bot a bot.

`Mantis Telegram Live` envuelve el carril existente de QA en vivo de Telegram en
la misma canalización de evidencia de PR. Extrae la ref de candidato de
confianza en un worktree separado, ejecuta `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, escribe un manifiesto `mantis-evidence.json` a partir del
resumen de QA de Telegram, `qa-evidence.json` y los artefactos de informe,
renderiza el HTML de evidencia redactada mediante un navegador de escritorio de
Crabbox, genera un GIF recortado por movimiento con `crabbox media preview` y
publica el comentario de evidencia insertada del PR cuando hay un número de PR
disponible. Este carril es visual de evidencia de QA en vez de prueba de
Telegram Web con sesión iniciada: la API de Telegram Bot proporciona evidencia
estable de mensajes en vivo, pero el estado de inicio de sesión de Telegram Web
no es necesario para la automatización normal de Mantis.

`Mantis Telegram Desktop Proof` es el contenedor agéntico nativo de Telegram
Desktop antes/después. Un mantenedor puede activarlo desde un comentario de PR
con `@openclaw-mantis telegram desktop proof`, desde la interfaz de Actions con
instrucciones libres o mediante el despachador genérico `Mantis Scenario`. El
flujo de trabajo entrega el PR, la ref de baseline, la ref de candidato y las
instrucciones del mantenedor a Codex. El agente lee el PR, decide qué
comportamiento visible en Telegram prueba el cambio, ejecuta el carril de prueba
de Telegram Desktop de usuario real en Crabbox para baseline y candidato, itera
hasta que los GIF nativos sean útiles, escribe artefactos `motionPreview`
emparejados en `mantis-evidence.json`, sube el paquete y publica una tabla de
evidencia de PR de 2 columnas cuando hay un número de PR disponible.

Para la configuración de Telegram Desktop con intervención humana, usa el
constructor de escenarios:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

El constructor arrienda o reutiliza un escritorio Crabbox, instala el binario
nativo de Telegram Desktop para Linux, opcionalmente restaura un archivo de
sesión de usuario, configura OpenClaw con el token del bot SUT de Telegram
arrendado, inicia `openclaw gateway run` en el puerto `38974`, publica un mensaje
de disponibilidad del bot controlador en el grupo privado arrendado y luego
captura una captura de pantalla y un MP4 desde el escritorio VNC visible. Un
token de bot nunca inicia sesión en Telegram Desktop; solo configura OpenClaw. El
visor de escritorio es una sesión de usuario de Telegram separada restaurada
desde `--telegram-profile-archive-env <name>` o creada manualmente mediante VNC
y mantenida activa con `--keep-lease`.

Marcas útiles del constructor de Telegram Desktop:

- `--lease-id <cbx_...>` vuelve a ejecutar contra una VM donde un operador ya inició sesión en Telegram Desktop.
- `--telegram-profile-archive-env <name>` lee un archivo de perfil de Telegram Desktop `.tgz` en base64 desde esa variable de entorno y lo restaura antes del lanzamiento.
- `--telegram-profile-dir <remote-path>` controla el directorio remoto de perfil de Telegram Desktop. El valor predeterminado es `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` instala y abre Telegram Desktop sin configurar OpenClaw.
- `--credential-source convex --credential-role ci` usa el broker de credenciales compartido en lugar de tokens de entorno directos de Telegram.

Cada escenario que publica en PR escribe `mantis-evidence.json` junto a su
informe. Este esquema es la transferencia entre el código de escenario y los
comentarios de GitHub:

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

Los valores `path` de artefacto son relativos al directorio del manifiesto.
Los valores `targetPath` son rutas relativas bajo el prefijo configurado de
artefactos Mantis R2/S3. El publicador rechaza el recorrido de rutas y omite las
entradas marcadas como `"required": false` cuando las vistas previas o los videos
opcionales no están disponibles.

Tipos de artefacto admitidos:

- `timeline`: captura de pantalla determinista del escenario, normalmente antes/después.
- `desktopScreenshot`: captura de pantalla del escritorio VNC/navegador.
- `motionPreview`: GIF animado insertado generado a partir de la grabación del escritorio.
- `motionClip`: MP4 recortado por movimiento que elimina la entrada y la cola estáticas.
- `fullVideo`: grabación MP4 completa para inspección profunda.
- `metadata`: archivo complementario JSON/log.
- `report`: informe Markdown.

El publicador reutilizable es `scripts/mantis/publish-pr-evidence.mjs`. Los
flujos de trabajo lo llaman con el manifiesto, el PR de destino, la raíz de
destino de artefactos, el marcador de comentario, la URL del artefacto de
Actions, la URL de la ejecución y el origen de la solicitud. Sube los artefactos
declarados al bucket Mantis R2/S3 configurado, construye un comentario de PR con
resumen primero e imágenes/vistas previas insertadas y videos enlazados, y luego
actualiza el comentario marcador existente o crea uno. Los flujos de trabajo
publican en `openclaw-crabbox-artifacts` con URL públicas bajo
`https://artifacts.openclaw.ai`. Proporcionan directamente los valores de bucket,
región y URL pública. El publicador reutilizable requiere:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

También puedes activar la ejecución de reacciones de estado directamente desde
un comentario de PR:

```text
@openclaw-mantis discord status reactions
```

El activador por comentario es intencionalmente estrecho. Solo se ejecuta en
comentarios de pull request de usuarios con acceso de escritura, mantenimiento o
administración, y solo reconoce solicitudes de reacciones de estado de Discord.
De forma predeterminada usa la ref de baseline incorrecta conocida y el SHA
actual de la cabecera del PR como candidato. Los mantenedores pueden sobrescribir
cualquiera de las refs:

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

La QA en vivo de Telegram también puede activarse desde un comentario de PR:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

De forma predeterminada usa el SHA actual de la cabecera del PR como candidato y
ejecuta `telegram-status-command`. Los mantenedores pueden sobrescribir
`candidate=...`, `provider=aws|hetzner` y `lease=<cbx_...>` cuando necesitan una
ref específica o un escritorio Crabbox precalentado.

Ejemplos de comandos de ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

El primer comando es explícito y centrado en el escenario. El segundo puede más
adelante asignar un PR o issue a escenarios Mantis recomendados a partir de
etiquetas, archivos cambiados y hallazgos de revisión de ClawSweeper.

## Ciclo de vida de la ejecución

1. Obtener credenciales.
2. Asignar o reutilizar una VM.
3. Preparar el perfil de escritorio/navegador cuando el escenario necesite evidencia de UI.
4. Preparar un checkout limpio para la ref de baseline.
5. Instalar dependencias y compilar solo lo que el escenario necesite.
6. Iniciar un OpenClaw Gateway hijo con un directorio de estado aislado.
7. Configurar el transporte en vivo, el proveedor, el modelo y el perfil del navegador.
8. Ejecutar el escenario y capturar evidencia de baseline.
9. Detener el Gateway y conservar los registros.
10. Preparar la ref de candidato en la misma VM.
11. Ejecutar el mismo escenario y capturar evidencia de candidato.
12. Comparar los resultados del oráculo y la evidencia visual.
13. Escribir Markdown, JSON, registros, capturas de pantalla y artefactos de traza opcionales.
14. Subir artefactos de GitHub Actions.
15. Publicar un mensaje conciso de estado en el PR o en Discord.

El escenario debería poder fallar de dos maneras diferentes:

- **Bug reproducido**: baseline falló de la forma esperada.
- **Fallo del arnés**: la configuración del entorno, las credenciales, la API de Discord, el navegador o el proveedor fallaron antes de que el oráculo del bug fuera significativo.

El informe final debe separar estos casos para que los mantenedores no confundan
un entorno inestable con el comportamiento del producto.

## MVP de Discord

El primer escenario debería apuntar a reacciones de estado de Discord en canales
de gremio donde el modo de entrega de respuesta de origen sea `message_tool_only`.

Por qué es una buena semilla de Mantis:

- Es visible en Discord como reacciones en el mensaje que activa la ejecución.
- Tiene un oráculo REST sólido mediante el estado de reacción del mensaje de Discord.
- Ejercita un OpenClaw Gateway real, autenticación de bot de Discord, despacho de mensajes, modo de entrega de respuesta de origen, estado de reacción de estado y ciclo de vida del turno del modelo.
- Es lo bastante estrecho como para mantener honesta la primera implementación.

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

La evidencia de baseline debería mostrar la reacción de reconocimiento en cola,
pero ninguna transición de ciclo de vida en modo solo herramienta. La evidencia
de candidato debería mostrar reacciones de estado de ciclo de vida ejecutándose
cuando `messages.statusReactions.enabled` está explícitamente en true.

La primera porción ejecutable es el escenario de QA en vivo de Discord con
participación explícita:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Configura el SUT con manejo de gremio siempre activo, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` y reacciones de estado explícitas. El
oráculo sondea el mensaje real de Discord que activó la ejecución y espera la
secuencia observada `👀 -> 🤔 -> 👍`. Los artefactos incluyen
`discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` y
`discord-status-reactions-tool-only-timeline.png`.

## Piezas existentes de QA

Mantis debería construirse sobre la pila privada de QA existente en lugar de
partir de cero:

- `pnpm openclaw qa discord` ya ejecuta un carril de Discord en vivo con bots controlador y SUT.
- El ejecutor de transporte en vivo ya escribe informes, evidencia de QA y artefactos específicos de transporte bajo `.artifacts/qa-e2e/`.
- Los arriendos de credenciales de Convex ya proporcionan acceso exclusivo a credenciales compartidas de transporte en vivo.
- El servicio de control del navegador ya admite capturas de pantalla, snapshots, perfiles administrados headless y perfiles CDP remotos.
- QA Lab ya tiene una UI de depurador y bus para pruebas con forma de transporte.

La primera implementación de Mantis puede ser un ejecutor ligero de antes/después
sobre estas piezas, más una capa de evidencia visual.

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

`mantis-summary.json` debe ser la fuente de verdad legible por máquina. El
informe en Markdown es para comentarios de PR y revisión humana.

El resumen debe incluir:

- refs y SHA probados
- transporte e id de escenario
- proveedor de máquina e id de máquina o id de concesión
- origen de credenciales sin valores secretos
- resultado de baseline
- resultado de candidato
- si el bug se reprodujo en baseline
- si el candidato lo corrigió
- rutas de artefactos
- problemas de configuración o limpieza saneados

Las capturas de pantalla son evidencia, no secretos. Aun así necesitan disciplina
de redacción: pueden aparecer nombres de canales privados, nombres de usuario o
contenido de mensajes. Para PR públicas, prefiere enlaces a artefactos de GitHub
Actions en lugar de imágenes incrustadas hasta que el enfoque de redacción sea
más sólido.

## Navegador y VNC

La vía de navegador tiene dos modos:

- **Automatización headless**: predeterminado para CI. Chrome se ejecuta con CDP
  habilitado, y Playwright o el control de navegador de OpenClaw captura
  capturas de pantalla.
- **Rescate por VNC**: habilitado en la misma VM cuando el inicio de sesión, MFA,
  la anti-automatización de Discord o la depuración visual necesitan una persona.

El perfil de navegador observador de Discord debe ser lo bastante persistente
como para evitar iniciar sesión en cada ejecución, pero estar aislado del estado
personal del navegador. Un perfil pertenece al pool de máquinas Mantis, no al
portátil de un desarrollador.

Cuando Mantis se bloquea, publica un mensaje de estado en Discord con:

- id de ejecución
- id de escenario
- proveedor de máquina
- directorio de artefactos
- instrucciones de conexión VNC o noVNC si están disponibles
- texto breve del bloqueo

El primer despliegue privado puede publicar estos mensajes en el canal de
operadores existente y pasar más tarde a un canal dedicado de Mantis.

## Máquinas

Mantis debe preferir AWS a través de Crabbox para la primera implementación
remota. Crabbox nos da máquinas precalentadas, seguimiento de concesiones,
hidratación, logs, resultados y limpieza. Si la capacidad de AWS es demasiado
lenta o no está disponible, añade un proveedor de Hetzner detrás de la misma
interfaz de máquina.

Requisitos mínimos de la VM:

- Linux con una instalación de Chrome o Chromium capaz de ejecutar escritorio
- acceso CDP para automatización de navegador
- VNC o noVNC para rescate
- Node 22 y pnpm
- checkout de OpenClaw y caché de dependencias
- caché del navegador Chromium de Playwright cuando se usa Playwright
- CPU y memoria suficientes para un OpenClaw Gateway, un navegador y una ejecución
  de modelo
- acceso saliente a Discord, GitHub, proveedores de modelos y el intermediario de
  credenciales

La VM no debe conservar secretos sin procesar de larga duración fuera de los
almacenes esperados de credenciales o perfiles de navegador.

## Secretos

Los secretos viven en secretos de organización o repositorio de GitHub para
ejecuciones remotas, y en un archivo local de secretos controlado por el operador
para ejecuciones locales.

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

A largo plazo, el pool de credenciales de Convex debe seguir siendo el origen
normal de credenciales de transporte en vivo. Los secretos de GitHub inicializan
el intermediario y las vías de fallback. El flujo de trabajo de reacciones de
estado de Discord asigna los secretos de Mantis Crabbox de vuelta a las variables
de entorno `CRABBOX_COORDINATOR` y `CRABBOX_COORDINATOR_TOKEN` que espera la CLI
de Crabbox. Los nombres simples de secretos de GitHub `CRABBOX_*` siguen
aceptándose como fallback de compatibilidad.

El runner de Mantis nunca debe imprimir:

- tokens de bots de Discord
- claves de API de proveedores
- cookies de navegador
- contenido de perfiles de autenticación
- contraseñas de VNC
- payloads de credenciales sin procesar

Las subidas públicas de artefactos también deben redactar metadatos de destino de
Discord, como ids de bot, servidor, canal y mensaje. El flujo de trabajo smoke de
GitHub habilita `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` por este motivo.

Si se pega accidentalmente un token en un issue, PR, chat o log, rótalo después
de que se haya almacenado el nuevo secreto.

## Artefactos de GitHub y comentarios de PR

Los flujos de trabajo de Mantis deben subir el paquete completo de evidencia como
un artefacto de Actions de corta duración. Cuando el flujo de trabajo se ejecute
para un reporte de bug o una PR de corrección, también debe publicar medios
incrustados redactados en el bucket R2/S3 configurado de Mantis y hacer upsert de
un comentario en ese bug o PR de corrección con capturas de pantalla incrustadas
de antes/después. No publiques la prueba principal solo en una PR genérica de
automatización de QA. Los logs sin procesar, mensajes observados y otra evidencia
voluminosa se quedan en el artefacto de Actions.

Los flujos de trabajo de producción deben publicar esos comentarios con la GitHub
App de Mantis, no con `github-actions[bot]`. Guarda el id de la app y la clave
privada como secretos de GitHub Actions `MANTIS_GITHUB_APP_ID` y
`MANTIS_GITHUB_APP_PRIVATE_KEY`. El flujo de trabajo usa un marcador oculto como
clave de upsert, actualiza ese comentario cuando el token puede editarlo y crea
un nuevo comentario propiedad de Mantis cuando no se puede editar un marcador más
antiguo propiedad de un bot.

El comentario de PR debe ser breve y visual:

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

Cuando la ejecución falla porque falló el harness, el comentario debe decir eso
en lugar de insinuar que falló el candidato.

## Notas de despliegue privado

Un despliegue privado puede tener ya una aplicación de Discord de Mantis. Reutiliza
esa aplicación en lugar de crear otra cuando tenga los permisos de bot correctos
y pueda rotarse de forma segura.

Configura el canal inicial de notificaciones para operadores mediante secretos o
configuración de despliegue. Puede apuntar primero a un canal existente de
maintainers u operaciones y luego pasar a un canal dedicado de Mantis cuando
exista uno.

No pongas ids de servidor, ids de canal, tokens de bot, cookies de navegador ni
contraseñas de VNC en este documento. Guárdalos en secretos de GitHub, el
intermediario de credenciales o el almacén local de secretos del operador.

## Añadir un escenario

Un escenario de Mantis debe declarar:

- id y título
- transporte
- credenciales requeridas
- política de ref de baseline
- política de ref de candidato
- parche de configuración de OpenClaw
- pasos de configuración
- estímulo
- oráculo esperado de baseline
- oráculo esperado de candidato
- objetivos de captura visual
- presupuesto de timeout
- pasos de limpieza

Los escenarios deben preferir oráculos pequeños y tipados:

- estado de reacción de Discord para bugs de reacciones
- referencias de mensajes de Discord para bugs de hilos
- ts de hilo de Slack y estado de API de reacciones para bugs de Slack
- ids de mensajes y encabezados de correo electrónico para bugs de correo
  electrónico
- capturas de pantalla del navegador cuando la UI es el único observable fiable

Las comprobaciones de visión deben ser aditivas. Si una API de plataforma puede
probar el bug, usa la API como oráculo de aprobado/fallado y conserva las
capturas de pantalla para confianza humana.

## Expansión de proveedores

Después de Discord, el mismo runner puede añadir:

- Slack: reacciones, hilos, menciones de app, modales, subidas de archivos.
- Correo electrónico: autenticación de Gmail e hilos de mensajes usando `gog`
  cuando los conectores no sean suficientes.
- WhatsApp: inicio de sesión por QR, reidentificación, entrega de mensajes,
  medios, reacciones.
- Telegram: compuerta de menciones de grupo, comandos, reacciones cuando estén
  disponibles.
- Matrix: salas cifradas, relaciones de hilo o respuesta, reanudación tras
  reinicio.

Cada transporte debe tener un escenario smoke barato y uno o más escenarios por
clase de bug. Los escenarios visuales costosos deben permanecer opt-in.

## Preguntas abiertas

- ¿Qué bot de Discord debe ser el controlador y cuál debe ser el SUT cuando se
  reutilice el bot existente de Mantis?
- ¿Debe el inicio de sesión del navegador observador usar una cuenta humana de
  Discord, una cuenta de prueba o solo evidencia REST legible por bots para la
  primera fase?
- ¿Durante cuánto tiempo debe GitHub conservar los artefactos de Mantis para PR?
- ¿Cuándo debe ClawSweeper recomendar automáticamente Mantis en lugar de esperar
  un comando de maintainer?
- ¿Deben redactarse o recortarse las capturas de pantalla antes de subirlas para
  PR públicas?
