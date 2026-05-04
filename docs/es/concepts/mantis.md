---
read_when:
    - Compilar o ejecutar el control de calidad visual en vivo para errores de OpenClaw
    - Agregar verificación antes y después para una solicitud de extracción
    - Añadir escenarios de transporte en vivo de Discord, Slack, WhatsApp u otros
    - Depuración de ejecuciones de QA que necesitan capturas de pantalla, automatización del navegador o acceso VNC
summary: Mantis es el sistema de verificación visual de extremo a extremo para reproducir errores de OpenClaw en transportes reales, capturar evidencia de antes y después y adjuntar artefactos a las PR.
title: Mantis
x-i18n:
    generated_at: "2026-05-04T05:28:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis es el sistema de verificación integral de OpenClaw para errores que necesitan un runtime real, un transporte real y prueba visible. Ejecuta un escenario contra una ref conocida como defectuosa, captura evidencia, ejecuta el mismo escenario contra una ref candidata y publica la comparación como artefactos que un mantenedor puede inspeccionar desde un PR o desde un comando local.

Mantis empieza con Discord porque Discord nos da una primera vía de alto valor: autenticación de bot real, canales de servidor reales, reacciones, hilos, comandos nativos y una interfaz de navegador donde los humanos pueden confirmar visualmente lo que mostró el transporte.

## Objetivos

- Reproducir un error de un issue o PR de GitHub con la misma forma de transporte que ven los usuarios.
- Capturar un artefacto **antes** en la ref de referencia antes de aplicar la corrección.
- Capturar un artefacto **después** en la ref candidata después de aplicar la corrección.
- Usar un oráculo determinista siempre que sea posible, como una lectura de reacción mediante REST de Discord o una comprobación de transcripción de canal.
- Capturar capturas de pantalla cuando el error tenga una superficie de interfaz visible.
- Ejecutarse localmente desde una CLI controlada por agente y remotamente desde GitHub.
- Conservar suficiente estado de máquina para rescate por VNC cuando el inicio de sesión, la automatización del navegador o la autenticación del proveedor se atasquen.
- Publicar estado conciso en un canal de operador de Discord cuando la ejecución esté bloqueada, necesite ayuda manual por VNC o finalice.

## No objetivos

- Mantis no sustituye las pruebas unitarias. Una ejecución de Mantis normalmente debería convertirse en una prueba de regresión más pequeña después de entender la corrección.
- Mantis no es la puerta rápida normal de CI. Es más lento, usa credenciales reales y se reserva para errores donde el entorno real importa.
- Mantis no debería requerir una persona para la operación normal. VNC manual es una ruta de rescate, no la ruta feliz.
- Mantis no almacena secretos sin procesar en artefactos, registros, capturas de pantalla, informes Markdown ni comentarios de PR.

## Propiedad

Mantis vive en la pila de QA de OpenClaw.

- OpenClaw posee el runtime de escenarios, los adaptadores de transporte, el esquema de evidencia y la CLI local bajo `pnpm openclaw qa mantis`.
- QA Lab posee las piezas del arnés de transporte real, los ayudantes de captura de navegador y los escritores de artefactos.
- Crabbox posee las máquinas Linux preparadas cuando se necesita una VM remota.
- GitHub Actions posee el punto de entrada del flujo de trabajo remoto y la retención de artefactos.
- ClawSweeper posee el enrutamiento de comentarios de GitHub: analizar comandos de mantenedores, despachar el flujo de trabajo y publicar el comentario final del PR.
- Los agentes de OpenClaw controlan Mantis mediante Codex cuando un escenario necesita configuración agéntica, depuración o reporte de estado atascado.

Este límite mantiene el conocimiento de transporte en OpenClaw, la planificación de máquinas en Crabbox y el pegamento del flujo de trabajo de mantenedores en ClawSweeper.

## Forma del comando

El primer comando local verifica el bot de Discord, servidor, canal, envío de mensaje, envío de reacción y ruta de artefactos:

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

El ejecutor crea worktrees independientes de referencia y candidato bajo el directorio de salida, instala dependencias, compila cada ref, ejecuta el escenario con `--allow-failures` y luego escribe `baseline/`, `candidate/`, `comparison.json` y `mantis-report.md`. Para el primer escenario de Discord, una verificación correcta significa que el estado de referencia es `fail` y el estado candidato es `pass`.

La primera primitiva de VM/navegador es el smoke de escritorio:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Arrienda o reutiliza una máquina de escritorio Crabbox, inicia un navegador visible dentro de la sesión VNC, captura el escritorio, recupera los artefactos en el directorio de salida local y escribe el comando de reconexión en el informe. El comando usa por defecto el proveedor Hetzner porque es el primer proveedor con cobertura de escritorio/VNC funcional en la vía de Mantis. Sobrescríbelo con `--provider`, `--crabbox-bin` u `OPENCLAW_MANTIS_CRABBOX_PROVIDER` al ejecutar contra otra flota de Crabbox.

Flags útiles del smoke de escritorio:

- `--lease-id <cbx_...>` u `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reutiliza un escritorio preparado.
- `--browser-url <url>` cambia la página abierta en el navegador visible.
- `--html-file <path>` renderiza un artefacto HTML local del repo en el navegador visible. Mantis usa esto para capturar la línea de tiempo generada de reacciones de estado de Discord mediante un escritorio real de Crabbox.
- `--keep-lease` u `OPENCLAW_MANTIS_KEEP_VM=1` mantiene abierto un arriendo recién creado que pasa para inspección por VNC. Las ejecuciones fallidas conservan el arriendo por defecto cuando se creó uno, para que un operador pueda reconectarse.
- `--class`, `--idle-timeout` y `--ttl` ajustan el tamaño de la máquina y la vida útil del arriendo.

La primera primitiva completa de transporte de escritorio es el smoke de escritorio de Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Arrienda o reutiliza una máquina de escritorio Crabbox, sincroniza el checkout actual en la VM, ejecuta `pnpm openclaw qa slack` dentro de esa VM, abre Slack Web en el navegador VNC, captura el escritorio visible y copia tanto los artefactos de QA de Slack como la captura de pantalla VNC al directorio de salida local. Esta es la primera forma de Mantis donde el Gateway de OpenClaw del SUT y el navegador viven ambos dentro de la misma VM de escritorio Linux.

Con `--gateway-setup`, el comando prepara un hogar persistente desechable de OpenClaw en `$HOME/.openclaw-mantis/slack-openclaw`, parchea la configuración de Slack Socket Mode para el canal seleccionado, inicia `openclaw gateway run` en el puerto `38973` y mantiene Chrome ejecutándose en la sesión VNC. Este es el modo de "déjame un escritorio Linux con Slack y una claw ejecutándose"; la vía de QA de Slack bot a bot sigue siendo la predeterminada cuando se omite `--gateway-setup`.

Entradas requeridas para `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para la vía de modelo remoto. Si solo `OPENAI_API_KEY` está establecido localmente, Mantis lo asigna a `OPENCLAW_LIVE_OPENAI_KEY` antes de invocar Crabbox para que el reenvío de entorno `OPENCLAW_*` de Crabbox pueda llevarlo a la VM.

Flags útiles del escritorio de Slack:

- `--lease-id <cbx_...>` vuelve a ejecutar contra una máquina donde un operador ya inició sesión en Slack Web mediante VNC.
- `--gateway-setup` inicia un Gateway persistente de OpenClaw Slack en la VM en lugar de ejecutar solo la vía de QA bot a bot.
- `--slack-url <url>` abre una URL específica de Slack Web. Sin ella, Mantis deriva `https://app.slack.com/client/<team>/<channel>` desde `auth.test` de Slack cuando el token del bot SUT está disponible.
- `--slack-channel-id <id>` controla la lista de permitidos de canales de Slack usada por la configuración del Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla el perfil persistente de Chrome dentro de la VM. El valor predeterminado es `$HOME/.config/openclaw-mantis/slack-chrome-profile`, por lo que un inicio de sesión manual en Slack Web sobrevive a nuevas ejecuciones en el mismo arriendo.
- `--credential-source convex --credential-role ci` usa el conjunto compartido de credenciales en lugar de tokens directos de entorno de Slack.
- `--provider-mode`, `--model`, `--alt-model` y `--fast` se transfieren a la vía live de Slack.

El flujo de trabajo smoke de GitHub es `Mantis Discord Smoke`. El flujo de trabajo de GitHub de antes y después para el primer escenario real es `Mantis Discord Status Reactions`. Acepta:

- `baseline_ref`: la ref que se espera que reproduzca el comportamiento solo en cola.
- `candidate_ref`: la ref que se espera que muestre `queued -> thinking -> done`.

Hace checkout de la ref del arnés de flujo de trabajo, compila worktrees separados de referencia y candidato, ejecuta `discord-status-reactions-tool-only` contra cada worktree y carga `baseline/`, `candidate/`, `comparison.json` y `mantis-report.md` como artefactos de Actions. También renderiza el HTML de la línea de tiempo de cada vía en un navegador de escritorio de Crabbox y publica esas capturas de pantalla VNC junto a los PNG deterministas de la línea de tiempo en el comentario del PR. El flujo de trabajo compila la CLI de Crabbox desde main de `openclaw/crabbox` para poder usar los flags actuales de arriendo de escritorio/navegador antes de que se corte la próxima versión binaria de Crabbox.

También puedes activar la ejecución de reacciones de estado directamente desde un comentario de PR:

```text
@Mantis discord status reactions
```

El disparador por comentario es intencionalmente estrecho. Solo se ejecuta en comentarios de pull request de usuarios con acceso write, maintain o admin, y solo reconoce solicitudes de reacciones de estado de Discord. Por defecto usa la ref de referencia defectuosa conocida y el SHA de HEAD del PR actual como candidato. Los mantenedores pueden sobrescribir cualquiera de las refs:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Ejemplos de comandos de ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

El primer comando es explícito y centrado en el escenario. El segundo puede mapear más adelante un PR o issue a escenarios recomendados de Mantis a partir de etiquetas, archivos cambiados y hallazgos de revisión de ClawSweeper.

## Ciclo de vida de la ejecución

1. Obtener credenciales.
2. Asignar o reutilizar una VM.
3. Preparar el perfil de escritorio/navegador cuando el escenario necesite evidencia de interfaz.
4. Preparar un checkout limpio para la ref de referencia.
5. Instalar dependencias y compilar solo lo que necesita el escenario.
6. Iniciar un Gateway de OpenClaw hijo con un directorio de estado aislado.
7. Configurar el transporte real, proveedor, modelo y perfil de navegador.
8. Ejecutar el escenario y capturar evidencia de referencia.
9. Detener el Gateway y conservar registros.
10. Preparar la ref candidata en la misma VM.
11. Ejecutar el mismo escenario y capturar evidencia candidata.
12. Comparar los resultados del oráculo y la evidencia visual.
13. Escribir Markdown, JSON, registros, capturas de pantalla y artefactos de traza opcionales.
14. Cargar artefactos de GitHub Actions.
15. Publicar un mensaje de estado conciso en PR o Discord.

El escenario debería poder fallar de dos maneras diferentes:

- **Error reproducido**: la referencia falló de la manera esperada.
- **Fallo del arnés**: la configuración del entorno, las credenciales, la API de Discord, el navegador o el proveedor fallaron antes de que el oráculo del error fuera significativo.

El informe final debe separar estos casos para que los mantenedores no confundan un entorno inestable con el comportamiento del producto.

## MVP de Discord

El primer escenario debería apuntar a reacciones de estado de Discord en canales de servidor donde el modo de entrega de respuesta de origen es `message_tool_only`.

Por qué es una buena semilla de Mantis:

- Es visible en Discord como reacciones sobre el mensaje disparador.
- Tiene un oráculo REST sólido mediante el estado de reacción del mensaje de Discord.
- Ejercita un Gateway real de OpenClaw, autenticación de bot de Discord, despacho de mensajes, modo de entrega de respuesta de origen, estado de reacción de estado y ciclo de vida de turno de modelo.
- Es lo bastante estrecho para mantener honesta la primera implementación.

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

La evidencia de referencia debería mostrar la reacción de acuse de recibo en cola, pero ninguna transición de ciclo de vida en modo solo herramienta. La evidencia candidata debería mostrar reacciones de estado de ciclo de vida ejecutándose cuando `messages.statusReactions.enabled` está explícitamente en true.

El primer tramo ejecutable es el escenario de QA live de Discord opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Configura el SUT con gestión de servidor siempre activa, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` y reacciones de estado explícitas. El oráculo
consulta el mensaje real de Discord que dispara el flujo y espera la secuencia observada
`👀 -> 🤔 -> 👍`. Los artefactos incluyen `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` y
`discord-status-reactions-tool-only-timeline.png`.

## Piezas de QA existentes

Mantis debe apoyarse en la pila de QA privada existente en lugar de empezar desde
cero:

- `pnpm openclaw qa discord` ya ejecuta una vía de Discord en vivo con bots de controlador y
  SUT.
- El ejecutor de transporte en vivo ya escribe informes y artefactos de mensajes
  observados en `.artifacts/qa-e2e/`.
- Los arrendamientos de credenciales de Convex ya proporcionan acceso exclusivo a credenciales
  compartidas de transporte en vivo.
- El servicio de control del navegador ya admite capturas de pantalla, instantáneas,
  perfiles gestionados sin interfaz y perfiles CDP remotos.
- QA Lab ya tiene una interfaz de depuración y un bus para pruebas con forma de transporte.

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

`mantis-summary.json` debe ser la fuente de verdad legible por máquina. El
informe en Markdown es para comentarios en PR y revisión humana.

El resumen debe incluir:

- refs y SHA probados
- transporte e id de escenario
- proveedor de máquina e id de máquina o id de arrendamiento
- origen de credenciales sin valores secretos
- resultado de la baseline
- resultado del candidato
- si el error se reprodujo en la baseline
- si el candidato lo corrigió
- rutas de artefactos
- problemas de configuración o limpieza saneados

Las capturas de pantalla son evidencia, no secretos. Aun así necesitan disciplina de censura:
pueden aparecer nombres de canales privados, nombres de usuario o contenido de mensajes. Para PRs públicos,
prefiere enlaces a artefactos de GitHub Actions en lugar de imágenes insertadas hasta que la estrategia de censura
sea más sólida.

## Navegador y VNC

La vía del navegador tiene dos modos:

- **Automatización sin interfaz**: predeterminado para CI. Chrome se ejecuta con CDP habilitado, y
  Playwright o el control de navegador de OpenClaw captura capturas de pantalla.
- **Rescate por VNC**: habilitado en la misma VM cuando el inicio de sesión, MFA, la anti-automatización de Discord
  o la depuración visual necesitan a una persona.

El perfil de navegador observador de Discord debe ser lo bastante persistente para evitar
iniciar sesión en cada ejecución, pero aislado del estado del navegador personal. Un perfil
pertenece al grupo de máquinas de Mantis, no al portátil de un desarrollador.

Cuando Mantis se bloquea, publica un mensaje de estado de Discord con:

- id de ejecución
- id de escenario
- proveedor de máquina
- directorio de artefactos
- instrucciones de conexión VNC o noVNC si están disponibles
- texto breve del bloqueo

El primer despliegue privado puede publicar estos mensajes en el canal de operadores existente
y pasar a un canal dedicado de Mantis más adelante.

## Máquinas

Mantis debe preferir AWS a través de Crabbox para la primera implementación remota.
Crabbox nos da máquinas preparadas, seguimiento de arrendamientos, hidratación, registros, resultados y
limpieza. Si la capacidad de AWS es demasiado lenta o no está disponible, añade un proveedor de Hetzner
detrás de la misma interfaz de máquina.

Requisitos mínimos de la VM:

- Linux con una instalación de Chrome o Chromium apta para escritorio
- acceso CDP para automatización del navegador
- VNC o noVNC para rescate
- Node 22 y pnpm
- checkout de OpenClaw y caché de dependencias
- caché del navegador Chromium de Playwright cuando se use Playwright
- CPU y memoria suficientes para un OpenClaw Gateway, un navegador y una ejecución de modelo
- acceso saliente a Discord, GitHub, proveedores de modelos y el intermediario de credenciales

La VM no debe conservar secretos sin procesar de larga duración fuera de los almacenes de credenciales o
perfiles de navegador esperados.

## Secretos

Los secretos viven en secretos de organización o repositorio de GitHub para ejecuciones remotas, y en
un archivo de secretos local controlado por el operador para ejecuciones locales.

Nombres de secretos recomendados:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para cargas públicas de artefactos de GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

A largo plazo, el grupo de credenciales de Convex debe seguir siendo la fuente normal para credenciales
de transporte en vivo. Los secretos de GitHub inicializan el intermediario y las vías de reserva.
El flujo de trabajo de reacciones de estado de Discord asigna los secretos de Mantis Crabbox de vuelta a
las variables de entorno `CRABBOX_COORDINATOR` y `CRABBOX_COORDINATOR_TOKEN`
que espera la CLI de Crabbox. Los nombres simples de secretos de GitHub `CRABBOX_*` siguen
aceptándose como reserva de compatibilidad.

El ejecutor de Mantis nunca debe imprimir:

- tokens de bots de Discord
- claves API de proveedores
- cookies del navegador
- contenidos de perfiles de autenticación
- contraseñas VNC
- cargas útiles de credenciales sin procesar

Las cargas públicas de artefactos también deben censurar metadatos de destino de Discord como ids de bot,
servidor, canal y mensaje. El flujo de trabajo de smoke de GitHub habilita
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` por este motivo.

Si un token se pega accidentalmente en una issue, PR, chat o registro, rótalo
después de almacenar el nuevo secreto.

## Artefactos de GitHub y comentarios de PR

Los flujos de trabajo de Mantis deben cargar el paquete completo de evidencia como un artefacto de Actions
de corta duración. Cuando el flujo de trabajo se ejecuta para un informe de error o un PR de corrección, también debe
publicar las capturas de pantalla PNG censuradas en la rama `qa-artifacts` y actualizar o insertar un
comentario en ese error o PR de corrección con capturas de antes/después insertadas. No publiques
la prueba principal solo en un PR genérico de automatización de QA. Los registros sin procesar, mensajes observados
y otra evidencia voluminosa permanecen en el artefacto de Actions.

Los flujos de trabajo de producción deben publicar esos comentarios con la GitHub App de Mantis, no
con `github-actions[bot]`. Almacena el id de la app y la clave privada como secretos de GitHub Actions
`MANTIS_GITHUB_APP_ID` y `MANTIS_GITHUB_APP_PRIVATE_KEY`. El flujo de trabajo usa un marcador oculto
como clave de actualización/inserción, actualiza ese comentario cuando el token puede editarlo y crea un
nuevo comentario propiedad de Mantis cuando un marcador antiguo propiedad de un bot no se puede editar.

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

Cuando la ejecución falla porque falló el arnés, el comentario debe decir eso en lugar
de insinuar que falló el candidato.

## Notas de despliegue privado

Puede que un despliegue privado ya tenga una aplicación de Discord de Mantis. Reutiliza esa
aplicación en lugar de crear otra app cuando tenga los permisos de bot adecuados
y pueda rotarse de forma segura.

Configura el canal inicial de notificaciones del operador mediante secretos o configuración de
despliegue. Puede apuntar primero a un canal existente de mantenedores u operaciones,
y luego moverse a un canal dedicado de Mantis cuando exista.

No pongas ids de servidor, ids de canal, tokens de bot, cookies del navegador ni contraseñas VNC
en este documento. Guárdalos en secretos de GitHub, el intermediario de credenciales o el
almacén local de secretos del operador.

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
- oráculo esperado de la baseline
- oráculo esperado del candidato
- objetivos de captura visual
- presupuesto de timeout
- pasos de limpieza

Los escenarios deben preferir oráculos pequeños y tipados:

- estado de reacciones de Discord para errores de reacciones
- referencias de mensajes de Discord para errores de hilos
- ts de hilo de Slack y estado de API de reacciones para errores de Slack
- ids y encabezados de mensajes de correo para errores de correo
- capturas de pantalla del navegador cuando la UI sea el único observable fiable

Las comprobaciones de visión deben ser aditivas. Si una API de plataforma puede probar el error, usa la
API como oráculo de aprobado/fallido y conserva las capturas de pantalla para dar confianza humana.

## Expansión de proveedores

Después de Discord, el mismo ejecutor puede añadir:

- Slack: reacciones, hilos, menciones de app, modales, cargas de archivos.
- Correo: autenticación de Gmail e hilos de mensajes usando `gog` donde los conectores no sean
  suficientes.
- WhatsApp: inicio de sesión por QR, reidentificación, entrega de mensajes, medios, reacciones.
- Telegram: control de menciones en grupo, comandos, reacciones donde estén disponibles.
- Matrix: salas cifradas, relaciones de hilo o respuesta, reanudación tras reinicio.

Cada transporte debe tener un escenario de smoke barato y uno o más escenarios por clase de error.
Los escenarios visuales caros deben permanecer opcionales.

## Preguntas abiertas

- ¿Qué bot de Discord debe ser el controlador y cuál debe ser el SUT cuando se reutilice el
  bot existente de Mantis?
- ¿El inicio de sesión del navegador observador debe usar una cuenta humana de Discord, una cuenta de prueba
  o solo evidencia REST legible por bots para la primera fase?
- ¿Durante cuánto tiempo debe GitHub conservar los artefactos de Mantis para PRs?
- ¿Cuándo debe ClawSweeper recomendar automáticamente Mantis en lugar de esperar a un
  comando de mantenedor?
- ¿Deben censurarse o recortarse las capturas de pantalla antes de cargarlas en PRs públicos?
