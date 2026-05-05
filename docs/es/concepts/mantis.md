---
read_when:
    - Crear o ejecutar control de calidad visual en vivo para errores de OpenClaw
    - Agregar verificación previa y posterior para una solicitud de cambios
    - Añadir escenarios de transporte en vivo de Discord, Slack, WhatsApp u otros
    - Depuración de ejecuciones de control de calidad que necesitan capturas de pantalla, automatización del navegador o acceso a VNC
summary: Mantis es el sistema de verificación visual de extremo a extremo para reproducir errores de OpenClaw en transportes en vivo, capturar evidencia de antes y después, y adjuntar artefactos a los PR.
title: Mantis
x-i18n:
    generated_at: "2026-05-05T08:25:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis es el sistema de verificación de extremo a extremo de OpenClaw para errores que necesitan un runtime real, un transporte real y pruebas visibles. Ejecuta un escenario contra una ref conocida como defectuosa, captura evidencia, ejecuta el mismo escenario contra una ref candidata y publica la comparación como artefactos que un mantenedor puede inspeccionar desde una PR o desde un comando local.

Mantis comienza con Discord porque Discord nos da un primer carril de alto valor: autenticación real de bot, canales de guild reales, reacciones, hilos, comandos nativos y una UI de navegador donde las personas pueden confirmar visualmente lo que mostró el transporte.

## Objetivos

- Reproducir un error de un issue o PR de GitHub con la misma forma de transporte que ven los usuarios.
- Capturar un artefacto **antes** en la ref base antes de aplicar la corrección.
- Capturar un artefacto **después** en la ref candidata después de aplicar la corrección.
- Usar un oráculo determinista siempre que sea posible, como una lectura de reacción de la REST de Discord o una comprobación de transcripción del canal.
- Capturar capturas de pantalla cuando el error tenga una superficie visible de UI.
- Ejecutarse localmente desde una CLI controlada por agente y de forma remota desde GitHub.
- Conservar suficiente estado de máquina para rescate por VNC cuando el inicio de sesión, la automatización del navegador o la autenticación del proveedor se atasquen.
- Publicar estado conciso en un canal de Discord de operadores cuando la ejecución esté bloqueada, necesite ayuda manual por VNC o termine.

## No objetivos

- Mantis no sustituye a las pruebas unitarias. Una ejecución de Mantis normalmente debería convertirse en una prueba de regresión más pequeña después de entender la corrección.
- Mantis no es la puerta rápida normal de CI. Es más lento, usa credenciales en vivo y se reserva para errores donde importa el entorno en vivo.
- Mantis no debería requerir una persona para la operación normal. VNC manual es una ruta de rescate, no el flujo feliz.
- Mantis no almacena secretos sin procesar en artefactos, registros, capturas de pantalla, informes Markdown ni comentarios de PR.

## Propiedad

Mantis vive en la pila de QA de OpenClaw.

- OpenClaw es propietario del runtime de escenarios, los adaptadores de transporte, el esquema de evidencia y la CLI local bajo `pnpm openclaw qa mantis`.
- QA Lab es propietario de las piezas de arnés de transporte en vivo, los helpers de captura de navegador y los escritores de artefactos.
- Crabbox es propietario de las máquinas Linux calentadas cuando se necesita una VM remota.
- GitHub Actions es propietario del punto de entrada del workflow remoto y la retención de artefactos.
- ClawSweeper es propietario del enrutamiento de comentarios de GitHub: analizar comandos de mantenedores, despachar el workflow y publicar el comentario final en la PR.
- Los agentes de OpenClaw impulsan Mantis mediante Codex cuando un escenario necesita preparación agéntica, depuración o informe de estado atascado.

Este límite mantiene el conocimiento de transporte en OpenClaw, la programación de máquinas en Crabbox y el pegamento del flujo de mantenedores en ClawSweeper.

## Forma del comando

El primer comando local verifica el bot de Discord, la guild, el canal, el envío de mensajes, el envío de reacciones y la ruta de artefactos:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

El runner local de antes y después acepta esta forma:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

El runner crea worktrees independientes de base y candidata bajo el directorio de salida, instala dependencias, compila cada ref, ejecuta el escenario con `--allow-failures`, y luego escribe `baseline/`, `candidate/`, `comparison.json` y `mantis-report.md`. Para el primer escenario de Discord, una verificación correcta significa que el estado de base es `fail` y el estado de candidata es `pass`.

La primera primitiva de VM/navegador es el smoke de escritorio:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Arrienda o reutiliza una máquina de escritorio Crabbox, inicia un navegador visible dentro de la sesión VNC, captura el escritorio, trae los artefactos de vuelta al directorio de salida local y escribe el comando de reconexión en el informe. El comando usa de forma predeterminada el proveedor Hetzner porque es el primer proveedor con cobertura de escritorio/VNC funcional en el carril Mantis. Sobrescríbelo con `--provider`, `--crabbox-bin` u `OPENCLAW_MANTIS_CRABBOX_PROVIDER` cuando ejecutes contra otra flota de Crabbox.

Flags útiles para el smoke de escritorio:

- `--lease-id <cbx_...>` u `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reutiliza un escritorio calentado.
- `--browser-url <url>` cambia la página abierta en el navegador visible.
- `--html-file <path>` renderiza un artefacto HTML local del repo en el navegador visible. Mantis usa esto para capturar la línea de tiempo generada de reacciones de estado de Discord mediante un escritorio real de Crabbox.
- `--keep-lease` u `OPENCLAW_MANTIS_KEEP_VM=1` mantiene abierto un arriendo recién creado que pasó para inspección por VNC. Las ejecuciones fallidas mantienen el arriendo por defecto cuando se creó uno para que un operador pueda reconectarse.
- `--class`, `--idle-timeout` y `--ttl` ajustan el tamaño de la máquina y la vida útil del arriendo.

La primera primitiva completa de transporte de escritorio es el smoke de escritorio de Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Arrienda o reutiliza una máquina de escritorio Crabbox, sincroniza el checkout actual en la VM, ejecuta `pnpm openclaw qa slack` dentro de esa VM, abre Slack Web en el navegador VNC, captura el escritorio visible y copia tanto los artefactos de QA de Slack como la captura de pantalla VNC de vuelta al directorio de salida local. Esta es la primera forma de Mantis donde el Gateway de OpenClaw del SUT y el navegador viven ambos dentro de la misma VM de escritorio Linux.

Con `--gateway-setup`, el comando prepara un home persistente y desechable de OpenClaw en `$HOME/.openclaw-mantis/slack-openclaw`, parchea la configuración de Slack Socket Mode para el canal seleccionado, inicia `openclaw gateway run` en el puerto `38973` y mantiene Chrome ejecutándose en la sesión VNC. Este es el modo "déjame un escritorio Linux con Slack y un claw en ejecución"; el carril de QA de Slack bot a bot sigue siendo el predeterminado cuando se omite `--gateway-setup`.

Entradas requeridas para `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para el carril de modelo remoto. Si solo `OPENAI_API_KEY` está configurada localmente, Mantis la asigna a `OPENCLAW_LIVE_OPENAI_KEY` antes de invocar Crabbox para que el reenvío de env `OPENCLAW_*` de Crabbox pueda llevarla a la VM.

Flags útiles para el escritorio de Slack:

- `--lease-id <cbx_...>` vuelve a ejecutar contra una máquina donde un operador ya inició sesión en Slack Web mediante VNC.
- `--gateway-setup` inicia un Gateway persistente de OpenClaw para Slack en la VM en lugar de solo ejecutar el carril de QA bot a bot.
- `--slack-url <url>` abre una URL específica de Slack Web. Sin ella, Mantis deriva `https://app.slack.com/client/<team>/<channel>` desde `auth.test` de Slack cuando el token del bot SUT está disponible.
- `--slack-channel-id <id>` controla la allowlist de canales de Slack usada por la configuración del Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla el perfil persistente de Chrome dentro de la VM. El valor predeterminado es `$HOME/.config/openclaw-mantis/slack-chrome-profile`, así que un inicio de sesión manual de Slack Web sobrevive a nuevas ejecuciones en el mismo arriendo.
- `--credential-source convex --credential-role ci` usa el pool compartido de credenciales en lugar de tokens env directos de Slack.
- `--provider-mode`, `--model`, `--alt-model` y `--fast` se pasan al carril en vivo de Slack.

El workflow de smoke de GitHub es `Mantis Discord Smoke`. El workflow de GitHub de antes y después para el primer escenario real es `Mantis Discord Status Reactions`. Acepta:

- `baseline_ref`: la ref que se espera que reproduzca el comportamiento de solo encolado.
- `candidate_ref`: la ref que se espera que muestre `queued -> thinking -> done`.

Hace checkout de la ref del arnés del workflow, compila worktrees separados de base y candidata, ejecuta `discord-status-reactions-tool-only` contra cada worktree y sube `baseline/`, `candidate/`, `comparison.json` y `mantis-report.md` como artefactos de Actions. También renderiza el HTML de línea de tiempo de cada carril en un navegador de escritorio Crabbox y publica esas capturas de pantalla VNC junto a los PNG de línea de tiempo deterministas en el comentario de PR. El mismo comentario de PR incrusta vistas previas GIF ligeras y recortadas por movimiento generadas por `crabbox media preview`, enlaza a los clips MP4 correspondientes recortados por movimiento y conserva los archivos MP4 completos del escritorio para inspección profunda. Las capturas de pantalla permanecen inline para revisión rápida. El workflow compila la CLI de Crabbox desde `openclaw/crabbox` main para poder usar las flags actuales de arriendo de escritorio/navegador antes de que se publique la siguiente versión binaria de Crabbox.

`Mantis Scenario` es el punto de entrada manual genérico. Toma un `scenario_id`, `candidate_ref`, un `baseline_ref` opcional y un `pr_number` opcional, luego despacha el workflow propiedad del escenario. El wrapper es intencionalmente delgado: los workflows de escenarios siguen siendo propietarios de su configuración de transporte, credenciales, clase de VM, oráculo esperado y manifiesto de artefactos.

`Mantis Slack Desktop Smoke` es el primer workflow de VM de Slack. Hace checkout de la ref candidata confiable en un worktree separado, arrienda un escritorio Linux de Crabbox, ejecuta `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` contra esa candidata, abre Slack Web en el navegador VNC, graba el escritorio, genera una vista previa recortada por movimiento con `crabbox media preview`, sube el directorio completo de artefactos y opcionalmente publica el comentario de evidencia inline en la PR objetivo. Usa este carril cuando quieras "un escritorio Linux con Slack y un claw en ejecución" en lugar de solo una transcripción de Slack bot a bot.

Cada escenario que publica en PR escribe `mantis-evidence.json` junto a su informe. Este esquema es el traspaso entre el código del escenario y los comentarios de GitHub:

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

Los valores `path` de artefactos son relativos al directorio del manifiesto. Los valores `targetPath` son rutas relativas bajo el directorio de publicación de la rama `qa-artifacts`. El publicador rechaza el path traversal y omite las entradas marcadas como `"required": false` cuando las vistas previas o videos opcionales no están disponibles.

Tipos de artefacto admitidos:

- `timeline`: captura de pantalla determinista del escenario, normalmente antes/después.
- `desktopScreenshot`: captura de pantalla del escritorio VNC/navegador.
- `motionPreview`: GIF animado inline generado desde la grabación del escritorio.
- `motionClip`: MP4 recortado por movimiento que elimina la entrada y cola estáticas.
- `fullVideo`: grabación MP4 completa para inspección profunda.
- `metadata`: archivo acompañante JSON/registro.
- `report`: informe Markdown.

El publicador reutilizable es `scripts/mantis/publish-pr-evidence.mjs`. Los workflows lo llaman con el manifiesto, la PR objetivo, la raíz objetivo de `qa-artifacts`, el marcador de comentario, la URL del artefacto de Actions, la URL de ejecución y el origen de la solicitud. Copia los artefactos declarados a la rama `qa-artifacts`, construye un comentario de PR con el resumen primero con imágenes/vistas previas inline y videos enlazados, y luego actualiza el comentario de marcador existente o crea uno.

También puedes activar la ejecución de reacciones de estado directamente desde un comentario de PR:

```text
@Mantis discord status reactions
```

El disparador por comentario es intencionalmente estrecho. Solo se ejecuta en comentarios de pull request de usuarios con acceso write, maintain o admin, y solo reconoce solicitudes de reacciones de estado de Discord. Por defecto usa la ref base defectuosa conocida y el SHA actual de la cabeza de la PR como candidata. Los mantenedores pueden sobrescribir cualquiera de las dos refs:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Ejemplos de comandos de ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

El primer comando es explícito y enfocado en el escenario. El segundo puede asignar más adelante un PR o issue a escenarios de Mantis recomendados a partir de etiquetas, archivos modificados y hallazgos de revisión de ClawSweeper.

## Ciclo de vida de la ejecución

1. Obtener credenciales.
2. Asignar o reutilizar una VM.
3. Preparar el perfil de escritorio/navegador cuando el escenario necesite evidencia de UI.
4. Preparar un checkout limpio para la referencia base.
5. Instalar dependencias y compilar solo lo que el escenario necesita.
6. Iniciar un OpenClaw Gateway secundario con un directorio de estado aislado.
7. Configurar el transporte en vivo, el proveedor, el modelo y el perfil del navegador.
8. Ejecutar el escenario y capturar evidencia de referencia.
9. Detener el Gateway y conservar los registros.
10. Preparar la referencia candidata en la misma VM.
11. Ejecutar el mismo escenario y capturar evidencia de la candidata.
12. Comparar los resultados del oráculo y la evidencia visual.
13. Escribir Markdown, JSON, registros, capturas de pantalla y artefactos de traza opcionales.
14. Subir artefactos de GitHub Actions.
15. Publicar un mensaje conciso de estado en el PR o en Discord.

El escenario debería poder fallar de dos formas distintas:

- **Error reproducido**: la referencia base falló de la forma esperada.
- **Fallo del arnés**: la configuración del entorno, las credenciales, la API de Discord, el navegador o el proveedor fallaron antes de que el oráculo del error fuera significativo.

El informe final debe separar estos casos para que los mantenedores no confundan un entorno inestable con el comportamiento del producto.

## MVP de Discord

El primer escenario debería apuntar a reacciones de estado de Discord en canales de gremio donde el modo de entrega de respuesta de origen es `message_tool_only`.

Por qué es una buena semilla de Mantis:

- Es visible en Discord como reacciones en el mensaje desencadenante.
- Tiene un oráculo REST sólido a través del estado de reacciones de mensajes de Discord.
- Ejercita un OpenClaw Gateway real, autenticación de bot de Discord, despacho de mensajes, modo de entrega de respuesta de origen, estado de reacciones de estado y ciclo de vida del turno del modelo.
- Es lo bastante acotado como para mantener honesta la primera implementación.

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

La evidencia de referencia debería mostrar la reacción de acuse en cola, pero ninguna transición del ciclo de vida en modo solo herramienta. La evidencia de la candidata debería mostrar reacciones de estado del ciclo de vida ejecutándose cuando `messages.statusReactions.enabled` es explícitamente `true`.

La primera porción ejecutable es el escenario QA en vivo de Discord con activación explícita:

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
"message_tool"`, `ackReaction: "👀"` y reacciones de estado explícitas. El oráculo sondea el mensaje desencadenante real de Discord y espera la secuencia observada `👀 -> 🤔 -> 👍`. Los artefactos incluyen `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` y `discord-status-reactions-tool-only-timeline.png`.

## Piezas existentes de QA

Mantis debería basarse en la pila privada de QA existente en lugar de empezar desde cero:

- `pnpm openclaw qa discord` ya ejecuta un carril de Discord en vivo con bots controlador y SUT.
- El ejecutor de transporte en vivo ya escribe informes y artefactos de mensajes observados en `.artifacts/qa-e2e/`.
- Los arrendamientos de credenciales de Convex ya proporcionan acceso exclusivo a credenciales compartidas de transporte en vivo.
- El servicio de control del navegador ya admite capturas de pantalla, instantáneas, perfiles gestionados sin interfaz y perfiles CDP remotos.
- QA Lab ya tiene una UI de depuración y un bus para pruebas con forma de transporte.

La primera implementación de Mantis puede ser un ejecutor ligero de antes/después sobre estas piezas, más una capa de evidencia visual.

## Modelo de evidencia

Cada ejecución escribe un directorio estable de artefactos:

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

`mantis-summary.json` debería ser la fuente de verdad legible por máquina. El informe Markdown es para comentarios de PR y revisión humana.

El resumen debe incluir:

- referencias y SHAs probados
- transporte e id del escenario
- proveedor de máquina e id de máquina o id de arrendamiento
- origen de credenciales sin valores secretos
- resultado de la referencia base
- resultado de la candidata
- si el error se reprodujo en la referencia base
- si la candidata lo corrigió
- rutas de artefactos
- problemas saneados de configuración o limpieza

Las capturas de pantalla son evidencia, no secretos. Aun así necesitan disciplina de censura: pueden aparecer nombres de canales privados, nombres de usuario o contenido de mensajes. Para PR públicos, prefiere enlaces de artefactos de GitHub Actions en lugar de imágenes incrustadas hasta que el proceso de censura sea más sólido.

## Navegador y VNC

El carril de navegador tiene dos modos:

- **Automatización sin interfaz**: predeterminado para CI. Chrome se ejecuta con CDP habilitado, y Playwright o el control de navegador de OpenClaw captura capturas de pantalla.
- **Rescate VNC**: habilitado en la misma VM cuando el inicio de sesión, MFA, la automatización anti-bot de Discord o la depuración visual necesitan una persona.

El perfil de navegador observador de Discord debería ser lo bastante persistente como para evitar iniciar sesión en cada ejecución, pero estar aislado del estado del navegador personal. Un perfil pertenece al grupo de máquinas de Mantis, no al portátil de un desarrollador.

Cuando Mantis se atasca, publica un mensaje de estado en Discord con:

- id de ejecución
- id del escenario
- proveedor de máquina
- directorio de artefactos
- instrucciones de conexión VNC o noVNC si están disponibles
- texto breve del bloqueo

El primer despliegue privado puede publicar estos mensajes en el canal de operador existente y pasar más adelante a un canal dedicado de Mantis.

## Máquinas

Mantis debería preferir AWS mediante Crabbox para la primera implementación remota. Crabbox nos da máquinas precalentadas, seguimiento de arrendamientos, hidratación, registros, resultados y limpieza. Si la capacidad de AWS es demasiado lenta o no está disponible, añade un proveedor de Hetzner detrás de la misma interfaz de máquina.

Requisitos mínimos de VM:

- Linux con una instalación de Chrome o Chromium capaz de escritorio
- acceso CDP para automatización del navegador
- VNC o noVNC para rescate
- Node 22 y pnpm
- checkout de OpenClaw y caché de dependencias
- caché del navegador Chromium de Playwright cuando se usa Playwright
- suficiente CPU y memoria para un OpenClaw Gateway, un navegador y una ejecución de modelo
- acceso saliente a Discord, GitHub, proveedores de modelos y el agente de credenciales

La VM no debería conservar secretos sin procesar de larga duración fuera de los almacenes esperados de credenciales o perfiles de navegador.

## Secretos

Los secretos residen en secretos de organización o repositorio de GitHub para ejecuciones remotas, y en un archivo local de secretos controlado por el operador para ejecuciones locales.

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

A largo plazo, el grupo de credenciales de Convex debería seguir siendo la fuente normal para credenciales de transporte en vivo. Los secretos de GitHub inicializan el agente y los carriles de respaldo. El flujo de trabajo de reacciones de estado de Discord asigna los secretos de Mantis Crabbox de vuelta a las variables de entorno `CRABBOX_COORDINATOR` y `CRABBOX_COORDINATOR_TOKEN` que espera la CLI de Crabbox. Los nombres de secretos de GitHub `CRABBOX_*` sin prefijo siguen aceptándose como respaldo de compatibilidad.

El ejecutor de Mantis nunca debe imprimir:

- tokens de bots de Discord
- claves de API de proveedores
- cookies del navegador
- contenido de perfiles de autenticación
- contraseñas de VNC
- cargas útiles de credenciales sin procesar

Las subidas públicas de artefactos también deberían censurar metadatos de destino de Discord como ids de bot, gremio, canal y mensaje. El flujo de trabajo de humo de GitHub habilita `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` por este motivo.

Si un token se pega accidentalmente en un issue, PR, chat o registro, rótalo después de que el nuevo secreto se haya almacenado.

## Artefactos de GitHub y comentarios de PR

Los flujos de trabajo de Mantis deberían subir el paquete completo de evidencia como artefacto de Actions de corta duración. Cuando el flujo de trabajo se ejecuta para un informe de error o PR de corrección, también debería publicar las capturas PNG censuradas en la rama `qa-artifacts` y hacer upsert de un comentario en ese error o PR de corrección con capturas incrustadas de antes/después. No publiques la prueba principal solo en un PR genérico de automatización QA. Los registros sin procesar, mensajes observados y otra evidencia voluminosa permanecen en el artefacto de Actions.

Los flujos de trabajo de producción deberían publicar esos comentarios con la GitHub App de Mantis, no con `github-actions[bot]`. Almacena el id de app y la clave privada como secretos de GitHub Actions `MANTIS_GITHUB_APP_ID` y `MANTIS_GITHUB_APP_PRIVATE_KEY`. El flujo de trabajo usa un marcador oculto como clave de upsert, actualiza ese comentario cuando el token puede editarlo y crea un nuevo comentario propiedad de Mantis cuando no puede editarse un marcador antiguo propiedad de un bot.

El comentario del PR debería ser breve y visual:

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

Cuando la ejecución falla porque falló el arnés, el comentario debe decirlo en lugar de insinuar que falló la candidata.

## Notas de despliegue privado

Un despliegue privado puede tener ya una aplicación de Discord de Mantis. Reutiliza esa aplicación en lugar de crear otra cuando tenga los permisos de bot correctos y pueda rotarse de forma segura.

Configura el canal inicial de notificaciones del operador mediante secretos o configuración de despliegue. Puede apuntar primero a un canal existente de mantenedores u operaciones, y luego moverse a un canal dedicado de Mantis cuando exista.

No pongas ids de gremio, ids de canal, tokens de bot, cookies de navegador ni contraseñas de VNC en este documento. Guárdalos en secretos de GitHub, el agente de credenciales o el almacén local de secretos del operador.

## Añadir un escenario

Un escenario de Mantis debería declarar:

- id y título
- transporte
- credenciales requeridas
- política de referencia base
- política de referencia candidata
- parche de configuración de OpenClaw
- pasos de configuración
- estímulo
- oráculo esperado de la referencia base
- oráculo esperado de la candidata
- objetivos de captura visual
- presupuesto de tiempo de espera
- pasos de limpieza

Los escenarios deberían preferir oráculos pequeños y tipados:

- estado de reacciones de Discord para errores de reacciones
- referencias de mensajes de Discord para errores de hilos
- ts de hilo de Slack y estado de la API de reacciones para errores de Slack
- ids y encabezados de mensajes de email para errores de email
- capturas de pantalla del navegador cuando la UI es el único observable fiable

Las comprobaciones de visión deberían ser aditivas. Si una API de plataforma puede demostrar el error, usa la API como oráculo de aprobado/fallido y conserva las capturas de pantalla para confianza humana.

## Expansión de proveedores

Después de Discord, el mismo ejecutor puede añadir:

- Slack: reacciones, hilos, menciones de la aplicación, modales, cargas de archivos.
- Correo electrónico: autenticación de Gmail y encadenamiento de mensajes usando `gog` cuando los conectores no son
  suficientes.
- WhatsApp: inicio de sesión con QR, reidentificación, entrega de mensajes, medios, reacciones.
- Telegram: control de menciones en grupos, comandos, reacciones cuando estén disponibles.
- Matrix: salas cifradas, relaciones de hilo o respuesta, reanudación tras reinicio.

Cada transporte debe tener un escenario de humo barato y uno o más escenarios por clase de error. Los escenarios visuales costosos deben seguir siendo opcionales.

## Preguntas abiertas

- ¿Qué bot de Discord debe ser el controlador y cuál debe ser el SUT cuando se reutiliza el bot Mantis existente?
- ¿El inicio de sesión del navegador observador debe usar una cuenta humana de Discord, una cuenta de prueba o solo evidencia REST legible por bots para la primera fase?
- ¿Durante cuánto tiempo debe GitHub conservar los artefactos de Mantis para las PR?
- ¿Cuándo debe ClawSweeper recomendar automáticamente Mantis en lugar de esperar un comando de un mantenedor?
- ¿Deben redactarse o recortarse las capturas de pantalla antes de subirlas para PR públicas?
