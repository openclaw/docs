---
read_when:
    - Crear o ejecutar control de calidad visual en vivo para errores de OpenClaw
    - Agregar verificación previa y posterior para una solicitud de incorporación de cambios
    - Agregar escenarios de transporte en vivo de Discord, Slack, WhatsApp u otros
    - Depuración de ejecuciones de QA que necesitan capturas de pantalla, automatización del navegador o acceso VNC
summary: Mantis es el sistema visual de verificación de extremo a extremo para reproducir errores de OpenClaw en transportes en vivo, capturar evidencia previa y posterior, y adjuntar artefactos a las PR.
title: Mantis
x-i18n:
    generated_at: "2026-05-03T21:29:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis es el sistema de verificación integral de OpenClaw para errores que necesitan un
runtime real, un transporte real y prueba visible. Ejecuta un escenario contra una
ref incorrecta conocida, captura evidencia, ejecuta el mismo escenario contra una ref candidata y
publica la comparación como artefactos que un mantenedor puede inspeccionar desde un PR o
desde un comando local.

Mantis empieza con Discord porque Discord nos da una primera vía de alto valor:
autenticación real del bot, canales reales de guild, reacciones, hilos, comandos nativos y una
UI de navegador donde los humanos pueden confirmar visualmente lo que mostró el transporte.

## Objetivos

- Reproducir un error de un issue o PR de GitHub con la misma forma de transporte que ven los usuarios.
- Capturar un artefacto **antes** en la ref base antes de aplicar la corrección.
- Capturar un artefacto **después** en la ref candidata después de aplicar la corrección.
- Usar un oráculo determinista siempre que sea posible, como una lectura de reacciones por REST
  de Discord o una comprobación de transcripción de canal.
- Capturar capturas de pantalla cuando el error tenga una superficie de UI visible.
- Ejecutarse localmente desde una CLI controlada por un agente y remotamente desde GitHub.
- Conservar suficiente estado de máquina para rescate por VNC cuando el inicio de sesión, la automatización del navegador o
  la autenticación del proveedor se atasquen.
- Publicar estado conciso en un canal de operador de Discord cuando la ejecución esté bloqueada,
  necesite ayuda manual por VNC o finalice.

## No objetivos

- Mantis no sustituye las pruebas unitarias. Una ejecución de Mantis normalmente debería convertirse
  en una prueba de regresión más pequeña después de que se comprenda la corrección.
- Mantis no es la puerta de CI rápida normal. Es más lento, usa credenciales reales y
  se reserva para errores donde el entorno en vivo importa.
- Mantis no debería requerir una persona para el funcionamiento normal. VNC manual es una ruta de rescate,
  no la ruta esperada.
- Mantis no almacena secretos sin procesar en artefactos, registros, capturas de pantalla, informes Markdown
  ni comentarios de PR.

## Propiedad

Mantis vive en la pila de QA de OpenClaw.

- OpenClaw posee el runtime de escenarios, los adaptadores de transporte, el esquema de evidencia y
  la CLI local bajo `pnpm openclaw qa mantis`.
- QA Lab posee las piezas del arnés de transporte en vivo, los ayudantes de captura del navegador y
  los escritores de artefactos.
- Crabbox posee las máquinas Linux precalentadas cuando se necesita una VM remota.
- GitHub Actions posee el punto de entrada del workflow remoto y la retención de artefactos.
- ClawSweeper posee el enrutamiento de comentarios de GitHub: analizar comandos de mantenedores,
  despachar el workflow y publicar el comentario final del PR.
- Los agentes de OpenClaw impulsan Mantis mediante Codex cuando un escenario necesita configuración agéntica,
  depuración o informes de estado atascado.

Este límite mantiene el conocimiento de transporte en OpenClaw, la programación de máquinas en
Crabbox y el pegamento del workflow de mantenedores en ClawSweeper.

## Forma del comando

El primer comando local verifica el bot de Discord, la guild, el canal, el envío de mensajes,
el envío de reacciones y la ruta de artefactos:

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

El ejecutor crea worktrees separados de base y candidato bajo el directorio de salida,
instala dependencias, compila cada ref, ejecuta el escenario con
`--allow-failures` y luego escribe `baseline/`, `candidate/`, `comparison.json`
y `mantis-report.md`. Para el primer escenario de Discord, una verificación correcta
significa que el estado de base es `fail` y el estado de candidato es `pass`.

El workflow de smoke de GitHub es `Mantis Discord Smoke`. El workflow de antes y después de GitHub
para el primer escenario real es `Mantis Discord Status Reactions`. Acepta:

- `baseline_ref`: la ref que se espera que reproduzca el comportamiento solo en cola.
- `candidate_ref`: la ref que se espera que muestre `queued -> thinking -> done`.

Hace checkout de la ref del arnés del workflow, compila worktrees separados de base y candidato,
ejecuta `discord-status-reactions-tool-only` contra cada worktree y
sube `baseline/`, `candidate/`, `comparison.json` y `mantis-report.md` como
artefactos de Actions.

También puedes activar la ejecución de reacciones de estado directamente desde un comentario de PR:

```text
@Mantis discord status reactions
```

El disparador por comentario es intencionalmente estrecho. Solo se ejecuta en comentarios de pull request
de usuarios con acceso write, maintain o admin, y solo reconoce
solicitudes de reacciones de estado de Discord. De forma predeterminada usa la ref base incorrecta conocida
y el SHA HEAD del PR actual como candidato. Los mantenedores pueden sobrescribir cualquiera de las dos
refs:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Ejemplos de comandos de ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

El primer comando es explícito y centrado en el escenario. El segundo puede mapear más adelante un PR
o issue a escenarios de Mantis recomendados a partir de etiquetas, archivos cambiados y
hallazgos de revisión de ClawSweeper.

## Ciclo de vida de la ejecución

1. Adquirir credenciales.
2. Asignar o reutilizar una VM.
3. Preparar un checkout limpio para la ref base.
4. Instalar dependencias y compilar solo lo que necesita el escenario.
5. Iniciar un Gateway de OpenClaw hijo con un directorio de estado aislado.
6. Configurar el transporte en vivo, el proveedor, el modelo y el perfil de navegador.
7. Ejecutar el escenario y capturar evidencia de base.
8. Detener el gateway y conservar registros.
9. Preparar la ref candidata en la misma VM.
10. Ejecutar el mismo escenario y capturar evidencia candidata.
11. Comparar los resultados del oráculo y la evidencia visual.
12. Escribir Markdown, JSON, registros, capturas de pantalla y artefactos de trazas opcionales.
13. Subir artefactos de GitHub Actions.
14. Publicar un mensaje conciso de estado en el PR o en Discord.

El escenario debería poder fallar de dos maneras distintas:

- **Error reproducido**: la base falló de la manera esperada.
- **Fallo del arnés**: la configuración del entorno, las credenciales, la API de Discord, el navegador o
  el proveedor fallaron antes de que el oráculo del error fuera significativo.

El informe final debe separar estos casos para que los mantenedores no confundan un entorno
inestable con el comportamiento del producto.

## MVP de Discord

El primer escenario debería apuntar a reacciones de estado de Discord en canales de guild donde
el modo de entrega de respuesta de origen sea `message_tool_only`.

Por qué es una buena semilla de Mantis:

- Es visible en Discord como reacciones en el mensaje disparador.
- Tiene un oráculo REST sólido mediante el estado de reacciones de mensajes de Discord.
- Ejercita un Gateway real de OpenClaw, autenticación de bot de Discord, despacho de mensajes,
  modo de entrega de respuesta de origen, estado de reacción de estado y ciclo de vida de turno del modelo.
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

La evidencia de base debería mostrar la reacción de reconocimiento en cola, pero ninguna
transición de ciclo de vida en modo solo herramienta. La evidencia candidata debería mostrar reacciones de estado
de ciclo de vida ejecutándose cuando `messages.statusReactions.enabled` está explícitamente
en `true`.

La primera porción ejecutable es el escenario de QA en vivo de Discord con opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Configura el SUT con manejo de guild siempre activo, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` y reacciones de estado explícitas. El oráculo
sondea el mensaje disparador real de Discord y espera la secuencia observada
`👀 -> 🤔 -> 👍`. Los artefactos incluyen `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` y
`discord-status-reactions-tool-only-timeline.png`.

## Piezas de QA existentes

Mantis debería construirse sobre la pila privada de QA existente en lugar de empezar desde
cero:

- `pnpm openclaw qa discord` ya ejecuta una vía de Discord en vivo con bots de controlador y
  SUT.
- El ejecutor de transporte en vivo ya escribe informes y artefactos de mensajes observados
  bajo `.artifacts/qa-e2e/`.
- Los leases de credenciales de Convex ya proporcionan acceso exclusivo a credenciales compartidas de transporte
  en vivo.
- El servicio de control del navegador ya admite capturas de pantalla, snapshots,
  perfiles administrados headless y perfiles CDP remotos.
- QA Lab ya tiene una UI de depuración y un bus para pruebas con forma de transporte.

La primera implementación de Mantis puede ser un ejecutor delgado de antes/después sobre estas
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

- refs y SHA probados
- transporte e id de escenario
- proveedor de máquina e id de máquina o id de lease
- fuente de credenciales sin valores secretos
- resultado de base
- resultado de candidato
- si el error se reprodujo en la base
- si el candidato lo corrigió
- rutas de artefactos
- problemas sanitizados de configuración o limpieza

Las capturas de pantalla son evidencia, no secretos. Aun así necesitan disciplina de redacción:
pueden aparecer nombres de canales privados, nombres de usuarios o contenido de mensajes. Para PR públicos,
prefiere enlaces de artefactos de GitHub Actions en lugar de imágenes incrustadas hasta que la historia de redacción
sea más sólida.

## Navegador y VNC

La vía de navegador tiene dos modos:

- **Automatización headless**: predeterminada para CI. Chrome se ejecuta con CDP habilitado, y
  Playwright o el control de navegador de OpenClaw capturan capturas de pantalla.
- **Rescate por VNC**: habilitado en la misma VM cuando el inicio de sesión, MFA, la anti-automatización de Discord
  o la depuración visual necesitan una persona.

El perfil de navegador observador de Discord debería ser lo bastante persistente como para evitar
iniciar sesión en cada ejecución, pero estar aislado del estado de navegador personal. Un perfil
pertenece al pool de máquinas de Mantis, no al portátil de un desarrollador.

Cuando Mantis se atasca, publica un mensaje de estado en Discord con:

- id de ejecución
- id de escenario
- proveedor de máquina
- directorio de artefactos
- instrucciones de conexión VNC o noVNC si están disponibles
- texto breve del bloqueo

El primer despliegue privado puede publicar estos mensajes en el canal de operador existente
y moverse a un canal dedicado de Mantis más adelante.

## Máquinas

Mantis debería preferir AWS mediante Crabbox para la primera implementación remota.
Crabbox nos da máquinas precalentadas, seguimiento de leases, hidratación, registros, resultados y
limpieza. Si la capacidad de AWS es demasiado lenta o no está disponible, añade un proveedor de Hetzner
detrás de la misma interfaz de máquina.

Requisitos mínimos de VM:

- Linux con una instalación de Chrome o Chromium apta para escritorio
- acceso CDP para automatización de navegador
- VNC o noVNC para rescate
- Node 22 y pnpm
- checkout de OpenClaw y caché de dependencias
- caché del navegador Chromium de Playwright cuando se use Playwright
- CPU y memoria suficientes para un Gateway de OpenClaw, un navegador y una ejecución de modelo
- acceso saliente a Discord, GitHub, proveedores de modelos y el bróker de credenciales

La VM no debería conservar secretos sin procesar de larga duración fuera de los almacenes esperados de credenciales o
perfiles de navegador.

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
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para cargas de artefactos públicos de GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

A largo plazo, el grupo de credenciales de Convex debe seguir siendo la fuente normal para las credenciales de transporte en vivo. Los secretos de GitHub inicializan el broker y los carriles de respaldo.

El ejecutor de Mantis nunca debe imprimir:

- tokens de bot de Discord
- claves de API de proveedor
- cookies del navegador
- contenido de perfiles de autenticación
- contraseñas de VNC
- cargas útiles sin procesar de credenciales

Las cargas de artefactos públicos también deben redactar metadatos de destino de Discord como identificadores de bot, servidor, canal y mensaje. El flujo de trabajo de humo de GitHub habilita `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` por este motivo.

Si se pega accidentalmente un token en un issue, PR, chat o registro, rótalo después de que se haya almacenado el nuevo secreto.

## Artefactos de GitHub y comentarios de PR

Los flujos de trabajo de Mantis deben cargar el paquete completo de evidencias como un artefacto de Actions de corta duración. Cuando el flujo de trabajo se ejecuta para un informe de error o un PR de corrección, también debe publicar las capturas de pantalla PNG redactadas en la rama `qa-artifacts` y actualizar o insertar un comentario en ese error o PR de corrección con capturas de pantalla antes/después en línea. No publiques la prueba principal solo en un PR genérico de automatización de QA. Los registros sin procesar, los mensajes observados y otras evidencias voluminosas permanecen en el artefacto de Actions.

Los flujos de trabajo de producción deben publicar esos comentarios con la GitHub App de Mantis, no con `github-actions[bot]`. Almacena el id de la app y la clave privada como secretos de GitHub Actions `MANTIS_GITHUB_APP_ID` y `MANTIS_GITHUB_APP_PRIVATE_KEY`. El flujo de trabajo usa un marcador oculto como clave de actualización/inserción, actualiza ese comentario cuando el token puede editarlo y crea un nuevo comentario propiedad de Mantis cuando no se puede editar un marcador más antiguo propiedad de un bot.

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

Cuando la ejecución falla porque falló el arnés, el comentario debe decir eso en lugar de implicar que el candidato falló.

## Notas de despliegue privado

Un despliegue privado puede tener ya una aplicación de Discord de Mantis. Reutiliza esa aplicación en lugar de crear otra cuando tenga los permisos de bot correctos y pueda rotarse de forma segura.

Configura el canal inicial de notificaciones del operador mediante secretos o configuración de despliegue. Puede apuntar primero a un canal existente de mantenedores u operaciones y luego moverse a un canal dedicado de Mantis una vez que exista.

No pongas identificadores de servidor, identificadores de canal, tokens de bot, cookies del navegador ni contraseñas de VNC en este documento. Almacénalos en secretos de GitHub, el broker de credenciales o el almacén local de secretos del operador.

## Añadir un escenario

Un escenario de Mantis debe declarar:

- id y título
- transporte
- credenciales requeridas
- política de ref de línea base
- política de ref de candidato
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
- ts de hilo de Slack y estado de API de reacciones para errores de Slack
- ids y encabezados de mensajes de correo electrónico para errores de correo electrónico
- capturas de pantalla del navegador cuando la UI es el único observable fiable

Las comprobaciones de visión deben ser aditivas. Si una API de plataforma puede demostrar el error, usa la API como oráculo de aprobación/fallo y conserva las capturas de pantalla para la confianza humana.

## Expansión de proveedores

Después de Discord, el mismo ejecutor puede añadir:

- Slack: reacciones, hilos, menciones de app, modales, cargas de archivos.
- Correo electrónico: autenticación de Gmail e hilos de mensajes usando `gog` cuando los conectores no sean suficientes.
- WhatsApp: inicio de sesión por QR, reidentificación, entrega de mensajes, medios, reacciones.
- Telegram: control de menciones en grupo, comandos, reacciones donde estén disponibles.
- Matrix: salas cifradas, relaciones de hilo o respuesta, reanudación tras reinicio.

Cada transporte debe tener un escenario de humo barato y uno o más escenarios de clase de error. Los escenarios visuales costosos deben permanecer opcionales.

## Preguntas abiertas

- ¿Qué bot de Discord debe ser el conductor y cuál debe ser el SUT cuando se reutilice el bot existente de Mantis?
- ¿El inicio de sesión del navegador observador debe usar una cuenta humana de Discord, una cuenta de prueba o solo evidencia REST legible por bots para la primera fase?
- ¿Durante cuánto tiempo debe retener GitHub los artefactos de Mantis para PRs?
- ¿Cuándo debe ClawSweeper recomendar automáticamente Mantis en lugar de esperar un comando de mantenedor?
- ¿Deben redactarse o recortarse las capturas de pantalla antes de cargarlas para PRs públicos?
