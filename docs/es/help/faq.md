---
read_when:
    - Responder preguntas comunes de soporte sobre configuración, instalación, incorporación o tiempo de ejecución
    - Triaje de problemas reportados por usuarios antes de una depuración más profunda
summary: Preguntas frecuentes sobre la instalación, configuración y uso de OpenClaw
title: Preguntas frecuentes
x-i18n:
    generated_at: "2026-05-06T17:56:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d5724af921ab660da3d4453779f269bda440fb27518638541312e489f203318
    source_path: help/faq.md
    workflow: 16
---

Respuestas rápidas y solución de problemas más profunda para configuraciones reales (desarrollo local, VPS, multiagente, OAuth/claves API, conmutación por error del modelo). Para diagnósticos en tiempo de ejecución, consulta [Solución de problemas](/es/gateway/troubleshooting). Para la referencia completa de configuración, consulta [Configuración](/es/gateway/configuration).

## Primeros 60 segundos si algo está roto

1. **Estado rápido (primera comprobación)**

   ```bash
   openclaw status
   ```

   Resumen local rápido: SO + actualización, accesibilidad del gateway/servicio, agentes/sesiones, configuración de proveedores + problemas en tiempo de ejecución (cuando el Gateway es accesible).

2. **Informe para pegar (seguro para compartir)**

   ```bash
   openclaw status --all
   ```

   Diagnóstico de solo lectura con cola de registros (tokens censurados).

3. **Estado del demonio + puerto**

   ```bash
   openclaw gateway status
   ```

   Muestra el tiempo de ejecución del supervisor frente a la accesibilidad RPC, la URL objetivo de la sonda y qué configuración probablemente usó el servicio.

4. **Sondas profundas**

   ```bash
   openclaw status --deep
   ```

   Ejecuta una sonda de salud en vivo del Gateway, incluidas sondas de canales cuando son compatibles
   (requiere un Gateway accesible). Consulta [Salud](/es/gateway/health).

5. **Seguir el registro más reciente**

   ```bash
   openclaw logs --follow
   ```

   Si RPC no está disponible, usa como alternativa:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Los registros de archivo son independientes de los registros del servicio; consulta [Registro](/es/logging) y [Solución de problemas](/es/gateway/troubleshooting).

6. **Ejecutar el doctor (reparaciones)**

   ```bash
   openclaw doctor
   ```

   Repara/migra configuración/estado + ejecuta comprobaciones de salud. Consulta [Doctor](/es/gateway/doctor).

7. **Instantánea del Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # muestra la URL objetivo + la ruta de configuración en errores
   ```

   Pide al Gateway en ejecución una instantánea completa (solo WS). Consulta [Salud](/es/gateway/health).

## Inicio rápido y configuración de primera ejecución

Las preguntas y respuestas de primera ejecución — instalación, incorporación, rutas de autenticación, suscripciones, fallos iniciales —
están en la [FAQ de primera ejecución](/es/help/faq-first-run).

## ¿Qué es OpenClaw?

<AccordionGroup>
  <Accordion title="¿Qué es OpenClaw, en un párrafo?">
    OpenClaw es un asistente personal de IA que ejecutas en tus propios dispositivos. Responde en las superficies de mensajería que ya usas (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat y plugins de canales incluidos como QQ Bot) y también puede hacer voz + un Canvas en vivo en plataformas compatibles. El **Gateway** es el plano de control siempre activo; el asistente es el producto.
  </Accordion>

  <Accordion title="Propuesta de valor">
    OpenClaw no es "solo un envoltorio de Claude". Es un **plano de control local-first** que te permite ejecutar un
    asistente capaz en **tu propio hardware**, accesible desde las aplicaciones de chat que ya usas, con
    sesiones con estado, memoria y herramientas, sin entregar el control de tus flujos de trabajo a un
    SaaS alojado.

    Puntos destacados:

    - **Tus dispositivos, tus datos:** ejecuta el Gateway donde quieras (Mac, Linux, VPS) y conserva el
      espacio de trabajo + historial de sesiones en local.
    - **Canales reales, no un sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      además de voz móvil y Canvas en plataformas compatibles.
    - **Agnóstico al modelo:** usa Anthropic, OpenAI, MiniMax, OpenRouter, etc., con enrutamiento
      por agente y conmutación por error.
    - **Opción solo local:** ejecuta modelos locales para que **todos los datos puedan permanecer en tu dispositivo** si quieres.
    - **Enrutamiento multiagente:** separa agentes por canal, cuenta o tarea, cada uno con su propio
      espacio de trabajo y valores predeterminados.
    - **Código abierto y modificable:** inspecciona, extiende y autoaloja sin dependencia de proveedor.

    Docs: [Gateway](/es/gateway), [Canales](/es/channels), [Multiagente](/es/concepts/multi-agent),
    [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="Acabo de configurarlo: ¿qué debería hacer primero?">
    Buenos primeros proyectos:

    - Crear un sitio web (WordPress, Shopify o un sitio estático sencillo).
    - Prototipar una aplicación móvil (esquema, pantallas, plan de API).
    - Organizar archivos y carpetas (limpieza, nombres, etiquetas).
    - Conectar Gmail y automatizar resúmenes o seguimientos.

    Puede manejar tareas grandes, pero funciona mejor cuando las divides en fases y
    usas subagentes para trabajo en paralelo.

  </Accordion>

  <Accordion title="¿Cuáles son los cinco principales casos de uso cotidianos de OpenClaw?">
    Las victorias cotidianas suelen verse así:

    - **Informes personales:** resúmenes de bandeja de entrada, calendario y noticias que te importan.
    - **Investigación y redacción:** investigación rápida, resúmenes y primeros borradores para correos o documentos.
    - **Recordatorios y seguimientos:** avisos y listas de verificación impulsados por Cron o Heartbeat.
    - **Automatización del navegador:** rellenar formularios, recopilar datos y repetir tareas web.
    - **Coordinación entre dispositivos:** envía una tarea desde tu teléfono, deja que el Gateway la ejecute en un servidor y recibe el resultado de vuelta en el chat.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ayudar con generación de leads, outreach, anuncios y blogs para un SaaS?">
    Sí para **investigación, calificación y redacción**. Puede escanear sitios, crear listas preliminares,
    resumir prospectos y escribir borradores de outreach o textos publicitarios.

    Para **outreach o campañas publicitarias**, mantén a una persona en el flujo. Evita el spam, cumple las leyes locales y
    las políticas de las plataformas, y revisa cualquier cosa antes de enviarla. El patrón más seguro es dejar que
    OpenClaw redacte y que tú apruebes.

    Docs: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Cuáles son las ventajas frente a Claude Code para desarrollo web?">
    OpenClaw es un **asistente personal** y una capa de coordinación, no un reemplazo de IDE. Usa
    Claude Code o Codex para el ciclo de codificación directa más rápido dentro de un repositorio. Usa OpenClaw cuando
    quieras memoria duradera, acceso entre dispositivos y orquestación de herramientas.

    Ventajas:

    - **Memoria persistente + espacio de trabajo** entre sesiones
    - **Acceso multiplataforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orquestación de herramientas** (navegador, archivos, programación, hooks)
    - **Gateway siempre activo** (ejecútalo en un VPS, interactúa desde cualquier lugar)
    - **Nodos** para navegador/pantalla/cámara/ejecución local

    Presentación: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills y automatización

<AccordionGroup>
  <Accordion title="¿Cómo personalizo Skills sin mantener el repositorio sucio?">
    Usa sobrescrituras gestionadas en lugar de editar la copia del repositorio. Pon tus cambios en `~/.openclaw/skills/<name>/SKILL.md` (o añade una carpeta mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json`). La precedencia es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluidas → `skills.load.extraDirs`, así que las sobrescrituras gestionadas siguen ganando a las Skills incluidas sin tocar git. Si necesitas que la Skill esté instalada globalmente pero solo sea visible para algunos agentes, conserva la copia compartida en `~/.openclaw/skills` y controla la visibilidad con `agents.defaults.skills` y `agents.list[].skills`. Solo las ediciones dignas de upstream deberían vivir en el repositorio y salir como PRs.
  </Accordion>

  <Accordion title="¿Puedo cargar Skills desde una carpeta personalizada?">
    Sí. Añade directorios extra mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json` (menor precedencia). La precedencia predeterminada es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluidas → `skills.load.extraDirs`. `clawhub` instala en `./skills` de forma predeterminada, que OpenClaw trata como `<workspace>/skills` en la siguiente sesión. Si la Skill solo debe ser visible para ciertos agentes, combínalo con `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="¿Cómo puedo usar distintos modelos para distintas tareas?">
    Hoy los patrones compatibles son:

    - **Trabajos Cron**: los trabajos aislados pueden establecer una sobrescritura de `model` por trabajo.
    - **Subagentes**: enruta tareas a agentes separados con distintos modelos predeterminados.
    - **Cambio bajo demanda**: usa `/model` para cambiar el modelo de la sesión actual en cualquier momento.

    Consulta [Trabajos Cron](/es/automation/cron-jobs), [Enrutamiento multiagente](/es/concepts/multi-agent) y [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="El bot se congela mientras hace trabajo pesado. ¿Cómo descargo eso?">
    Usa **subagentes** para tareas largas o paralelas. Los subagentes se ejecutan en su propia sesión,
    devuelven un resumen y mantienen tu chat principal receptivo.

    Pídele a tu bot que "spawn a sub-agent for this task" o usa `/subagents`.
    Usa `/status` en el chat para ver qué está haciendo el Gateway ahora mismo (y si está ocupado).

    Consejo sobre tokens: las tareas largas y los subagentes consumen tokens. Si el coste te preocupa, establece un
    modelo más barato para subagentes mediante `agents.defaults.subagents.model`.

    Docs: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Cómo funcionan las sesiones de subagentes vinculadas a hilos en Discord?">
    Usa vinculaciones de hilos. Puedes vincular un hilo de Discord a un subagente o destino de sesión para que los mensajes de seguimiento en ese hilo permanezcan en esa sesión vinculada.

    Flujo básico:

    - Genera con `sessions_spawn` usando `thread: true` (y opcionalmente `mode: "session"` para seguimiento persistente).
    - O vincula manualmente con `/focus <target>`.
    - Usa `/agents` para inspeccionar el estado de la vinculación.
    - Usa `/session idle <duration|off>` y `/session max-age <duration|off>` para controlar el desenfoque automático.
    - Usa `/unfocus` para desvincular el hilo.

    Configuración requerida:

    - Valores predeterminados globales: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Sobrescrituras de Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Vinculación automática al generar: `channels.discord.threadBindings.spawnSessions` usa `true` de forma predeterminada; establécelo en `false` para desactivar generaciones de sesiones vinculadas a hilos.

    Docs: [Subagentes](/es/tools/subagents), [Discord](/es/channels/discord), [Referencia de configuración](/es/gateway/configuration-reference), [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagente terminó, pero la actualización de finalización fue al lugar equivocado o nunca se publicó. ¿Qué debería revisar?">
    Revisa primero la ruta del solicitante resuelta:

    - La entrega de subagentes en modo de finalización prefiere cualquier ruta de hilo o conversación vinculada cuando existe una.
    - Si el origen de finalización solo incluye un canal, OpenClaw recurre a la ruta almacenada de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa todavía pueda tener éxito.
    - Si no existe ni una ruta vinculada ni una ruta almacenada utilizable, la entrega directa puede fallar y el resultado vuelve a la entrega de sesión en cola en lugar de publicarse inmediatamente en el chat.
    - Los destinos inválidos u obsoletos todavía pueden forzar la alternativa de cola o el fallo final de entrega.
    - Si la última respuesta visible del asistente hijo es el token silencioso exacto `NO_REPLY` / `no_reply`, o exactamente `ANNOUNCE_SKIP`, OpenClaw suprime intencionadamente el anuncio en lugar de publicar progreso anterior obsoleto.
    - Si el hijo agotó el tiempo de espera después de solo llamadas a herramientas, el anuncio puede condensar eso en un breve resumen de progreso parcial en lugar de reproducir la salida sin procesar de la herramienta.

    Depuración:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks), [Herramientas de sesión](/es/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o los recordatorios no se disparan. ¿Qué debería revisar?">
    Cron se ejecuta dentro del proceso del Gateway. Si el Gateway no se ejecuta continuamente,
    los trabajos programados no se ejecutarán.

    Lista de verificación:

    - Confirma que Cron esté activado (`cron.enabled`) y que `OPENCLAW_SKIP_CRON` no esté definido.
    - Comprueba que el Gateway se ejecute 24/7 (sin suspensión/reinicios).
    - Verifica la configuración de zona horaria del trabajo (`--tz` frente a la zona horaria del host).

    Depuración:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs: [Trabajos Cron](/es/automation/cron-jobs), [Automatización y tareas](/es/automation).

  </Accordion>

  <Accordion title="Cron se ejecutó, pero no se envió nada al canal. ¿Por qué?">
    Primero revisa el modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"` significa que no se espera ningún envío de respaldo del ejecutor.
    - Un destino de anuncio ausente o no válido (`channel` / `to`) significa que el ejecutor omitió la entrega saliente.
    - Los fallos de autenticación del canal (`unauthorized`, `Forbidden`) significan que el ejecutor intentó entregar, pero las credenciales lo bloquearon.
    - Un resultado aislado silencioso (`NO_REPLY` / `no_reply` solamente) se trata como intencionalmente no entregable, por lo que el ejecutor también suprime la entrega de respaldo en cola.

    En trabajos de cron aislados, el agente todavía puede enviar directamente con la herramienta `message`
    cuando hay una ruta de chat disponible. `--announce` solo controla la ruta de
    respaldo del ejecutor para el texto final que el agente aún no envió.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Trabajos de Cron](/es/automation/cron-jobs), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Por qué una ejecución de Cron aislada cambió de modelo o reintentó una vez?">
    Normalmente es la ruta de cambio de modelo en vivo, no una programación duplicada.

    Cron aislado puede conservar una transferencia de modelo en tiempo de ejecución y reintentar cuando la ejecución
    activa lanza `LiveSessionModelSwitchError`. El reintento conserva el proveedor/modelo
    cambiado y, si el cambio incluía una nueva anulación del perfil de autenticación, Cron
    también la conserva antes de reintentar.

    Reglas de selección relacionadas:

    - La anulación de modelo del hook de Gmail gana primero cuando corresponde.
    - Luego `model` por trabajo.
    - Luego cualquier anulación de modelo almacenada de la sesión de Cron.
    - Luego la selección normal de modelo del agente/predeterminada.

    El bucle de reintentos está acotado. Después del intento inicial más 2 reintentos de cambio,
    Cron aborta en lugar de quedar en un bucle infinito.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Trabajos de Cron](/es/automation/cron-jobs), [CLI de Cron](/es/cli/cron).

  </Accordion>

  <Accordion title="¿Cómo instalo Skills en Linux?">
    Usa los comandos nativos `openclaw skills` o coloca Skills en tu espacio de trabajo. La interfaz de Skills de macOS no está disponible en Linux.
    Explora Skills en [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    `openclaw skills install` nativo escribe en el directorio `skills/` del espacio de trabajo
    activo. Instala la CLI separada `clawhub` solo si quieres publicar o
    sincronizar tus propias Skills. Para instalaciones compartidas entre agentes, coloca la Skill en
    `~/.openclaw/skills` y usa `agents.defaults.skills` o
    `agents.list[].skills` si quieres restringir qué agentes pueden verla.

  </Accordion>

  <Accordion title="¿OpenClaw puede ejecutar tareas según una programación o continuamente en segundo plano?">
    Sí. Usa el programador del Gateway:

    - **Trabajos de Cron** para tareas programadas o recurrentes (persisten entre reinicios).
    - **Heartbeat** para comprobaciones periódicas de la "sesión principal".
    - **Trabajos aislados** para agentes autónomos que publican resúmenes o entregan en chats.

    Documentación: [Trabajos de Cron](/es/automation/cron-jobs), [Automatización y tareas](/es/automation),
    [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title="¿Puedo ejecutar Skills exclusivas de Apple macOS desde Linux?">
    No directamente. Las Skills de macOS están restringidas por `metadata.openclaw.os` más los binarios requeridos, y las Skills solo aparecen en el prompt del sistema cuando son elegibles en el **host del Gateway**. En Linux, las Skills exclusivas de `darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) no se cargarán a menos que anules la restricción.

    Tienes tres patrones compatibles:

    **Opción A - ejecutar el Gateway en una Mac (la más sencilla).**
    Ejecuta el Gateway donde existan los binarios de macOS y luego conéctate desde Linux en [modo remoto](#gateway-ports-already-running-and-remote-mode) o por Tailscale. Las Skills se cargan normalmente porque el host del Gateway es macOS.

    **Opción B - usar un Node de macOS (sin SSH).**
    Ejecuta el Gateway en Linux, empareja un Node de macOS (aplicación de barra de menús) y configura **Comandos de ejecución de Node** como "Preguntar siempre" o "Permitir siempre" en la Mac. OpenClaw puede tratar las Skills exclusivas de macOS como elegibles cuando los binarios requeridos existen en el Node. El agente ejecuta esas Skills mediante la herramienta `nodes`. Si eliges "Preguntar siempre", aprobar "Permitir siempre" en el prompt agrega ese comando a la lista de permitidos.

    **Opción C - proxificar binarios de macOS por SSH (avanzado).**
    Mantén el Gateway en Linux, pero haz que los binarios de CLI requeridos se resuelvan a wrappers SSH que se ejecuten en una Mac. Luego anula la Skill para permitir Linux de modo que siga siendo elegible.

    1. Crea un wrapper SSH para el binario (ejemplo: `memo` para Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Coloca el wrapper en `PATH` en el host Linux (por ejemplo `~/bin/memo`).
    3. Anula los metadatos de la Skill (espacio de trabajo o `~/.openclaw/skills`) para permitir Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Inicia una sesión nueva para que se actualice la instantánea de Skills.

  </Accordion>

  <Accordion title="¿Tienen una integración con Notion o HeyGen?">
    No integrada actualmente.

    Opciones:

    - **Skill / plugin personalizado:** lo mejor para un acceso fiable a la API (Notion/HeyGen tienen API).
    - **Automatización del navegador:** funciona sin código, pero es más lenta y más frágil.

    Si quieres mantener contexto por cliente (flujos de trabajo de agencia), un patrón sencillo es:

    - Una página de Notion por cliente (contexto + preferencias + trabajo activo).
    - Pedir al agente que recupere esa página al inicio de una sesión.

    Si quieres una integración nativa, abre una solicitud de funcionalidad o crea una Skill
    orientada a esas API.

    Instalar Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Las instalaciones nativas se ubican en el directorio `skills/` del espacio de trabajo activo. Para Skills compartidas entre agentes, colócalas en `~/.openclaw/skills/<name>/SKILL.md`. Si solo algunos agentes deberían ver una instalación compartida, configura `agents.defaults.skills` o `agents.list[].skills`. Algunas Skills esperan binarios instalados mediante Homebrew; en Linux eso significa Linuxbrew (consulta la entrada de preguntas frecuentes de Homebrew para Linux más arriba). Consulta [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config) y [ClawHub](/es/tools/clawhub).

  </Accordion>

  <Accordion title="¿Cómo uso mi Chrome ya conectado con OpenClaw?">
    Usa el perfil de navegador integrado `user`, que se conecta mediante Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Si quieres un nombre personalizado, crea un perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Esta ruta puede usar el navegador del host local o un Node de navegador conectado. Si el Gateway se ejecuta en otro lugar, ejecuta un host de Node en la máquina del navegador o usa CDP remoto.

    Límites actuales de `existing-session` / `user`:

    - las acciones se basan en ref, no en selectores CSS
    - las cargas requieren `ref` / `inputRef` y actualmente admiten un archivo a la vez
    - `responsebody`, exportación de PDF, interceptación de descargas y acciones por lotes aún necesitan un navegador administrado o un perfil CDP sin procesar

  </Accordion>
</AccordionGroup>

## Aislamiento y memoria

<AccordionGroup>
  <Accordion title="¿Hay un documento dedicado al aislamiento?">
    Sí. Consulta [Aislamiento](/es/gateway/sandboxing). Para configuración específica de Docker (Gateway completo en Docker o imágenes de aislamiento), consulta [Docker](/es/install/docker).
  </Accordion>

  <Accordion title="Docker se siente limitado; ¿cómo habilito todas las funciones?">
    La imagen predeterminada prioriza la seguridad y se ejecuta como el usuario `node`, por lo que no
    incluye paquetes del sistema, Homebrew ni navegadores incluidos. Para una configuración más completa:

    - Conserva `/home/node` con `OPENCLAW_HOME_VOLUME` para que las cachés sobrevivan.
    - Integra dependencias del sistema en la imagen con `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instala navegadores de Playwright mediante la CLI incluida:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Define `PLAYWRIGHT_BROWSERS_PATH` y asegúrate de que la ruta se conserve.

    Documentación: [Docker](/es/install/docker), [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Puedo mantener los DM personales pero hacer que los grupos sean públicos/aislados con un agente?">
    Sí, si tu tráfico privado son **DMs** y tu tráfico público son **grupos**.

    Usa `agents.defaults.sandbox.mode: "non-main"` para que las sesiones de grupo/canal (claves no principales) se ejecuten en el backend de aislamiento configurado, mientras que la sesión principal de DM permanece en el host. Docker es el backend predeterminado si no eliges uno. Luego restringe qué herramientas están disponibles en sesiones aisladas mediante `tools.sandbox.tools`.

    Guía de configuración + configuración de ejemplo: [Grupos: DM personales + grupos públicos](/es/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referencia de configuración clave: [Configuración del Gateway](/es/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="¿Cómo enlazo una carpeta del host en el aislamiento?">
    Define `agents.defaults.sandbox.docker.binds` como `["host:path:mode"]` (por ejemplo, `"/home/user/src:/src:ro"`). Los enlaces globales y por agente se combinan; los enlaces por agente se ignoran cuando `scope: "shared"`. Usa `:ro` para cualquier cosa sensible y recuerda que los enlaces eluden los muros del sistema de archivos del aislamiento.

    OpenClaw valida las fuentes de enlace tanto contra la ruta normalizada como contra la ruta canónica resuelta mediante el ancestro existente más profundo. Eso significa que los escapes por padres de symlink siguen fallando de forma cerrada incluso cuando el último segmento de la ruta aún no existe, y las comprobaciones de raíz permitida siguen aplicándose después de la resolución de symlinks.

    Consulta [Aislamiento](/es/gateway/sandboxing#custom-bind-mounts) y [Aislamiento frente a política de herramientas frente a elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) para ver ejemplos y notas de seguridad.

  </Accordion>

  <Accordion title="¿Cómo funciona la memoria?">
    La memoria de OpenClaw son simplemente archivos Markdown en el espacio de trabajo del agente:

    - Notas diarias en `memory/YYYY-MM-DD.md`
    - Notas seleccionadas de largo plazo en `MEMORY.md` (solo sesiones principales/privadas)

    OpenClaw también ejecuta un **vaciado de memoria silencioso previo a la Compaction** para recordar al modelo
    que escriba notas duraderas antes de la autocompactación. Esto solo se ejecuta cuando el espacio de trabajo
    permite escritura (los aislamientos de solo lectura lo omiten). Consulta [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="La memoria sigue olvidando cosas. ¿Cómo hago que se conserven?">
    Pídele al bot que **escriba el dato en la memoria**. Las notas de largo plazo van en `MEMORY.md`,
    el contexto de corto plazo va en `memory/YYYY-MM-DD.md`.

    Esta sigue siendo un área que estamos mejorando. Ayuda recordar al modelo que almacene recuerdos;
    sabrá qué hacer. Si sigue olvidando, verifica que el Gateway use el mismo
    espacio de trabajo en cada ejecución.

    Documentación: [Memoria](/es/concepts/memory), [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿La memoria persiste para siempre? ¿Cuáles son los límites?">
    Los archivos de memoria viven en disco y persisten hasta que los eliminas. El límite es tu
    almacenamiento, no el modelo. El **contexto de sesión** sigue limitado por la ventana de
    contexto del modelo, por lo que las conversaciones largas pueden compactarse o truncarse. Por eso
    existe la búsqueda de memoria: trae de vuelta al contexto solo las partes relevantes.

    Documentación: [Memoria](/es/concepts/memory), [Contexto](/es/concepts/context).

  </Accordion>

  <Accordion title="¿La búsqueda de memoria semántica requiere una clave de API de OpenAI?">
    Solo si usas **embeddings de OpenAI**. OAuth de Codex cubre chat/completions y
    **no** concede acceso a embeddings, así que **iniciar sesión con Codex (OAuth o el
    inicio de sesión de Codex CLI)** no ayuda para la búsqueda de memoria semántica. Los embeddings de OpenAI
    aún necesitan una clave de API real (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Si no estableces un proveedor explícitamente, OpenClaw selecciona automáticamente un proveedor cuando
    puede resolver una clave de API (perfiles de autenticación, `models.providers.*.apiKey` o variables de entorno).
    Prefiere OpenAI si se resuelve una clave de OpenAI; de lo contrario, Gemini si se
    resuelve una clave de Gemini, luego Voyage y luego Mistral. Si no hay ninguna clave remota disponible, la búsqueda de memoria
    permanece deshabilitada hasta que la configures. Si tienes una ruta de modelo local
    configurada y presente, OpenClaw
    prefiere `local`. Ollama es compatible cuando estableces explícitamente
    `memorySearch.provider = "ollama"`.

    Si prefieres permanecer en local, establece `memorySearch.provider = "local"` (y opcionalmente
    `memorySearch.fallback = "none"`). Si quieres embeddings de Gemini, establece
    `memorySearch.provider = "gemini"` y proporciona `GEMINI_API_KEY` (o
    `memorySearch.remote.apiKey`). Admitimos modelos de embeddings **OpenAI, Gemini, Voyage, Mistral, Ollama o locales**:
    consulta [Memoria](/es/concepts/memory) para los detalles de configuración.

  </Accordion>
</AccordionGroup>

## Dónde viven las cosas en el disco

<AccordionGroup>
  <Accordion title="¿Todos los datos usados con OpenClaw se guardan localmente?">
    No: **el estado de OpenClaw es local**, pero **los servicios externos aún ven lo que les envías**.

    - **Local de forma predeterminada:** las sesiones, los archivos de memoria, la configuración y el espacio de trabajo viven en el host del Gateway
      (`~/.openclaw` + tu directorio de espacio de trabajo).
    - **Remoto por necesidad:** los mensajes que envías a proveedores de modelos (Anthropic/OpenAI/etc.) van a
      sus API, y las plataformas de chat (WhatsApp/Telegram/Slack/etc.) almacenan datos de mensajes en sus
      servidores.
    - **Tú controlas la huella:** usar modelos locales mantiene los prompts en tu máquina, pero el tráfico del canal
      aún pasa por los servidores del canal.

    Relacionado: [Espacio de trabajo del agente](/es/concepts/agent-workspace), [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Dónde almacena OpenClaw sus datos?">
    Todo vive bajo `$OPENCLAW_STATE_DIR` (valor predeterminado: `~/.openclaw`):

    | Ruta                                                            | Propósito                                                          |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuración principal (JSON5)                                    |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importación OAuth heredada (copiada en perfiles de autenticación en el primer uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfiles de autenticación (OAuth, claves de API y `keyRef`/`tokenRef` opcional) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Carga útil secreta opcional respaldada por archivo para proveedores SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Archivo de compatibilidad heredado (entradas estáticas `api_key` depuradas) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Estado del proveedor (por ejemplo, `whatsapp/<accountId>/creds.json`) |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Estado por agente (agentDir + sesiones)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historial y estado de conversaciones (por agente)                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadatos de sesión (por agente)                                   |

    Ruta heredada de agente único: `~/.openclaw/agent/*` (migrada por `openclaw doctor`).

    Tu **espacio de trabajo** (AGENTS.md, archivos de memoria, Skills, etc.) está separado y se configura mediante `agents.defaults.workspace` (valor predeterminado: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="¿Dónde deberían vivir AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Estos archivos viven en el **espacio de trabajo del agente**, no en `~/.openclaw`.

    - **Espacio de trabajo (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opcional.
      La raíz en minúsculas `memory.md` solo es entrada de reparación heredada; `openclaw doctor --fix`
      puede fusionarla en `MEMORY.md` cuando ambos archivos existen.
    - **Directorio de estado (`~/.openclaw`)**: configuración, estado de canal/proveedor, perfiles de autenticación, sesiones, registros
      y Skills compartidas (`~/.openclaw/skills`).

    El espacio de trabajo predeterminado es `~/.openclaw/workspace`, configurable mediante:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si el bot "olvida" después de un reinicio, confirma que el Gateway esté usando el mismo
    espacio de trabajo en cada inicio (y recuerda: el modo remoto usa el espacio de trabajo **del host del gateway**,
    no el de tu portátil local).

    Consejo: si quieres un comportamiento o preferencia duraderos, pide al bot que **lo escriba en
    AGENTS.md o MEMORY.md** en lugar de depender del historial del chat.

    Consulta [Espacio de trabajo del agente](/es/concepts/agent-workspace) y [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="Estrategia de copia de seguridad recomendada">
    Pon tu **espacio de trabajo del agente** en un repositorio git **privado** y haz una copia de seguridad en algún lugar
    privado (por ejemplo, GitHub privado). Esto captura la memoria + archivos AGENTS/SOUL/USER
    y te permite restaurar la "mente" del asistente más adelante.

    **No** confirmes nada bajo `~/.openclaw` (credenciales, sesiones, tokens o cargas útiles de secretos cifrados).
    Si necesitas una restauración completa, haz una copia de seguridad tanto del espacio de trabajo como del directorio de estado
    por separado (consulta la pregunta de migración anterior).

    Documentación: [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿Cómo desinstalo OpenClaw por completo?">
    Consulta la guía dedicada: [Desinstalar](/es/install/uninstall).
  </Accordion>

  <Accordion title="¿Pueden los agentes trabajar fuera del espacio de trabajo?">
    Sí. El espacio de trabajo es el **cwd predeterminado** y el ancla de memoria, no un sandbox estricto.
    Las rutas relativas se resuelven dentro del espacio de trabajo, pero las rutas absolutas pueden acceder a otras
    ubicaciones del host a menos que el sandboxing esté habilitado. Si necesitas aislamiento, usa
    [`agents.defaults.sandbox`](/es/gateway/sandboxing) o configuraciones de sandbox por agente. Si
    quieres que un repositorio sea el directorio de trabajo predeterminado, apunta el
    `workspace` de ese agente a la raíz del repositorio. El repositorio de OpenClaw es solo código fuente; mantén el
    espacio de trabajo separado a menos que quieras intencionalmente que el agente trabaje dentro de él.

    Ejemplo (repositorio como cwd predeterminado):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modo remoto: ¿dónde está el almacén de sesiones?">
    El estado de sesión pertenece al **host del gateway**. Si estás en modo remoto, el almacén de sesiones que te importa está en la máquina remota, no en tu portátil local. Consulta [Gestión de sesiones](/es/concepts/session).
  </Accordion>
</AccordionGroup>

## Conceptos básicos de configuración

<AccordionGroup>
  <Accordion title="¿Qué formato tiene la configuración? ¿Dónde está?">
    OpenClaw lee una configuración **JSON5** opcional desde `$OPENCLAW_CONFIG_PATH` (valor predeterminado: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Si falta el archivo, usa valores predeterminados razonablemente seguros (incluido un espacio de trabajo predeterminado de `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Establecí gateway.bind: "lan" (o "tailnet") y ahora nada escucha / la UI dice no autorizado'>
    Los enlaces que no son loopback **requieren una ruta de autenticación de gateway válida**. En la práctica, eso significa:

    - autenticación con secreto compartido: token o contraseña
    - `gateway.auth.mode: "trusted-proxy"` detrás de un proxy inverso con reconocimiento de identidad configurado correctamente

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Notas:

    - `gateway.remote.token` / `.password` **no** habilitan por sí mismos la autenticación del gateway local.
    - Las rutas de llamada locales pueden usar `gateway.remote.*` como alternativa solo cuando `gateway.auth.*` no está establecido.
    - Para autenticación por contraseña, establece `gateway.auth.mode: "password"` más `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`) en su lugar.
    - Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución falla cerrada (sin enmascaramiento con alternativa remota).
    - Las configuraciones de Control UI con secreto compartido autentican mediante `connect.params.auth.token` o `connect.params.auth.password` (almacenado en la configuración de la app/UI). Los modos con identidad, como Tailscale Serve o `trusted-proxy`, usan encabezados de solicitud en su lugar. Evita poner secretos compartidos en las URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, los proxies inversos local loopback del mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito y una entrada loopback en `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="¿Por qué ahora necesito un token en localhost?">
    OpenClaw aplica autenticación de gateway de forma predeterminada, incluido loopback. En la ruta predeterminada normal, eso significa autenticación por token: si no se configura una ruta de autenticación explícita, el inicio del gateway se resuelve en modo token y genera un token solo de tiempo de ejecución para ese inicio, así que **los clientes WS locales deben autenticarse**. Configura `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` u `OPENCLAW_GATEWAY_PASSWORD` explícitamente cuando los clientes necesiten un secreto estable entre reinicios. Esto bloquea que otros procesos locales llamen al Gateway.

    Si prefieres una ruta de autenticación diferente, puedes elegir explícitamente el modo de contraseña (o, para proxies inversos con reconocimiento de identidad, `trusted-proxy`). Si **realmente** quieres loopback abierto, establece explícitamente `gateway.auth.mode: "none"` en tu configuración. Doctor puede generar un token por ti en cualquier momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="¿Tengo que reiniciar después de cambiar la configuración?">
    El Gateway observa la configuración y admite recarga en caliente:

    - `gateway.reload.mode: "hybrid"` (predeterminado): aplica en caliente los cambios seguros, reinicia para los críticos
    - `hot`, `restart`, `off` también son compatibles

  </Accordion>

  <Accordion title="¿Cómo deshabilito las frases divertidas de la CLI?">
    Establece `cli.banner.taglineMode` en la configuración:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: oculta el texto de la frase, pero mantiene la línea de título/versión del banner.
    - `default`: usa `All your chats, one OpenClaw.` cada vez.
    - `random`: frases divertidas/estacionales rotativas (comportamiento predeterminado).
    - Si no quieres ningún banner, establece la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="¿Cómo habilito la búsqueda web (y la obtención web)?">
    `web_fetch` funciona sin una clave de API. `web_search` depende del
    proveedor seleccionado:

    - Los proveedores respaldados por API, como Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity y Tavily, requieren su configuración normal de clave de API.
    - Ollama Web Search no requiere clave, pero usa tu host de Ollama configurado y requiere `ollama signin`.
    - DuckDuckGo no requiere clave, pero es una integración no oficial basada en HTML.
    - SearXNG no requiere clave/es autohospedado; configura `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recomendado:** ejecuta `openclaw configure --section web` y elige un proveedor.
    Alternativas de entorno:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` o `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    La configuración de búsqueda web específica del proveedor ahora está en `plugins.entries.<plugin>.config.webSearch.*`.
    Las rutas heredadas de proveedor `tools.web.search.*` aún se cargan temporalmente por compatibilidad, pero no deben usarse para configuraciones nuevas.
    La configuración de respaldo de obtención web de Firecrawl está en `plugins.entries.firecrawl.config.webFetch.*`.

    Notas:

    - Si usas listas de permitidos, agrega `web_search`/`web_fetch`/`x_search` o `group:web`.
    - `web_fetch` está habilitado de forma predeterminada (salvo que se deshabilite explícitamente).
    - Si se omite `tools.web.fetch.provider`, OpenClaw detecta automáticamente el primer proveedor de respaldo de obtención listo a partir de las credenciales disponibles. Actualmente, el proveedor incluido es Firecrawl.
    - Los daemons leen variables de entorno desde `~/.openclaw/.env` (o desde el entorno del servicio).

    Docs: [Herramientas web](/es/tools/web).

  </Accordion>

  <Accordion title="config.apply borró mi configuración. ¿Cómo la recupero y evito que ocurra?">
    `config.apply` reemplaza la **configuración completa**. Si envías un objeto parcial, todo
    lo demás se elimina.

    La versión actual de OpenClaw protege contra muchas sobrescrituras accidentales:

    - Las escrituras de configuración propiedad de OpenClaw validan toda la configuración posterior al cambio antes de escribir.
    - Las escrituras propiedad de OpenClaw inválidas o destructivas se rechazan y se guardan como `openclaw.json.rejected.*`.
    - Si una edición directa rompe el inicio o la recarga en caliente, Gateway falla de forma cerrada u omite la recarga; no reescribe `openclaw.json`.
    - `openclaw doctor --fix` se encarga de la reparación y puede restaurar la última configuración válida conocida mientras guarda el archivo rechazado como `openclaw.json.clobbered.*`.

    Recuperación:

    - Revisa `openclaw logs --follow` en busca de `Invalid config at`, `Config write rejected:` o `config reload skipped (invalid config)`.
    - Inspecciona el `openclaw.json.clobbered.*` o `openclaw.json.rejected.*` más reciente junto a la configuración activa.
    - Ejecuta `openclaw config validate` y `openclaw doctor --fix`.
    - Copia de vuelta solo las claves previstas con `openclaw config set` o `config.patch`.
    - Si no tienes una última configuración válida conocida ni una carga útil rechazada, restaura desde una copia de seguridad, o vuelve a ejecutar `openclaw doctor` y reconfigura canales/modelos.
    - Si esto fue inesperado, informa un bug e incluye tu última configuración conocida o cualquier copia de seguridad.
    - Un agente de programación local a menudo puede reconstruir una configuración funcional a partir de logs o historial.

    Evítalo:

    - Usa `openclaw config set` para cambios pequeños.
    - Usa `openclaw configure` para ediciones interactivas.
    - Usa `config.schema.lookup` primero cuando no estés seguro de una ruta exacta o de la forma de un campo; devuelve un nodo de esquema superficial más resúmenes de los hijos inmediatos para profundizar.
    - Usa `config.patch` para ediciones RPC parciales; reserva `config.apply` solo para reemplazar la configuración completa.
    - Si estás usando la herramienta `gateway` solo para propietarios desde una ejecución de agente, aún rechazará escrituras en `tools.exec.ask` / `tools.exec.security` (incluidos los alias heredados `tools.bash.*` que se normalizan a las mismas rutas exec protegidas).

    Docs: [Configuración](/es/cli/config), [Configurar](/es/cli/configure), [Solución de problemas de Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Cómo ejecuto un Gateway central con workers especializados entre dispositivos?">
    El patrón común es **un Gateway** (por ejemplo, Raspberry Pi) más **nodos** y **agentes**:

    - **Gateway (central):** administra canales (Signal/WhatsApp), enrutamiento y sesiones.
    - **Nodos (dispositivos):** Macs/iOS/Android se conectan como periféricos y exponen herramientas locales (`system.run`, `canvas`, `camera`).
    - **Agentes (workers):** cerebros/espacios de trabajo separados para roles especiales (por ejemplo, "Operaciones de Hetzner", "Datos personales").
    - **Subagentes:** generan trabajo en segundo plano desde un agente principal cuando quieres paralelismo.
    - **TUI:** conéctate al Gateway y cambia de agentes/sesiones.

    Docs: [Nodos](/es/nodes), [Acceso remoto](/es/gateway/remote), [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [TUI](/es/web/tui).

  </Accordion>

  <Accordion title="¿Puede el navegador de OpenClaw ejecutarse en modo headless?">
    Sí. Es una opción de configuración:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    El valor predeterminado es `false` (con interfaz). Headless tiene más probabilidades de activar comprobaciones anti-bot en algunos sitios. Consulta [Navegador](/es/tools/browser).

    Headless usa el **mismo motor Chromium** y funciona para la mayoría de automatizaciones (formularios, clics, scraping, inicios de sesión). Las principales diferencias:

    - No hay ventana visible del navegador (usa capturas de pantalla si necesitas elementos visuales).
    - Algunos sitios son más estrictos con la automatización en modo headless (CAPTCHAs, anti-bot).
      Por ejemplo, X/Twitter suele bloquear sesiones headless.

  </Accordion>

  <Accordion title="¿Cómo uso Brave para controlar el navegador?">
    Establece `browser.executablePath` en tu binario de Brave (o cualquier navegador basado en Chromium) y reinicia el Gateway.
    Consulta los ejemplos completos de configuración en [Navegador](/es/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways y nodos remotos

<AccordionGroup>
  <Accordion title="¿Cómo se propagan los comandos entre Telegram, el gateway y los nodos?">
    Los mensajes de Telegram los gestiona el **gateway**. El gateway ejecuta el agente y
    solo entonces llama a los nodos a través del **Gateway WebSocket** cuando se necesita una herramienta de nodo:

    Telegram → Gateway → Agente → `node.*` → Nodo → Gateway → Telegram

    Los nodos no ven tráfico entrante del proveedor; solo reciben llamadas RPC de nodo.

  </Accordion>

  <Accordion title="¿Cómo puede mi agente acceder a mi computadora si el Gateway está alojado remotamente?">
    Respuesta breve: **empareja tu computadora como un nodo**. El Gateway se ejecuta en otro lugar, pero puede
    llamar herramientas `node.*` (pantalla, cámara, sistema) en tu máquina local a través del Gateway WebSocket.

    Configuración típica:

    1. Ejecuta el Gateway en el host siempre encendido (VPS/servidor doméstico).
    2. Coloca el host del Gateway y tu computadora en la misma tailnet.
    3. Asegúrate de que el WS del Gateway sea accesible (vinculación a tailnet o túnel SSH).
    4. Abre la app de macOS localmente y conéctate en modo **Remoto por SSH** (o tailnet directa)
       para que pueda registrarse como nodo.
    5. Aprueba el nodo en el Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    No se requiere un puente TCP separado; los nodos se conectan a través del Gateway WebSocket.

    Recordatorio de seguridad: emparejar un nodo macOS permite `system.run` en esa máquina. Empareja
    solo dispositivos en los que confíes y revisa [Seguridad](/es/gateway/security).

    Docs: [Nodos](/es/nodes), [Protocolo Gateway](/es/gateway/protocol), [Modo remoto de macOS](/es/platforms/mac/remote), [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="Tailscale está conectado, pero no recibo respuestas. ¿Qué hago ahora?">
    Comprueba lo básico:

    - Gateway en ejecución: `openclaw gateway status`
    - Estado de Gateway: `openclaw status`
    - Estado de canales: `openclaw channels status`

    Luego verifica la autenticación y el enrutamiento:

    - Si usas Tailscale Serve, asegúrate de que `gateway.auth.allowTailscale` esté configurado correctamente.
    - Si te conectas mediante túnel SSH, confirma que el túnel local esté activo y apunte al puerto correcto.
    - Confirma que tus listas de permitidos (DM o grupo) incluyan tu cuenta.

    Docs: [Tailscale](/es/gateway/tailscale), [Acceso remoto](/es/gateway/remote), [Canales](/es/channels).

  </Accordion>

  <Accordion title="¿Pueden dos instancias de OpenClaw hablar entre sí (local + VPS)?">
    Sí. No hay un puente "bot a bot" integrado, pero puedes conectarlas de algunas
    formas fiables:

    **Lo más simple:** usa un canal de chat normal al que ambos bots puedan acceder (Telegram/Slack/WhatsApp).
    Haz que el Bot A envíe un mensaje al Bot B y luego deja que el Bot B responda como siempre.

    **Puente CLI (genérico):** ejecuta un script que llame al otro Gateway con
    `openclaw agent --message ... --deliver`, apuntando a un chat donde el otro bot
    escuche. Si un bot está en un VPS remoto, apunta tu CLI a ese Gateway remoto
    mediante SSH/Tailscale (consulta [Acceso remoto](/es/gateway/remote)).

    Patrón de ejemplo (ejecutar desde una máquina que pueda alcanzar el Gateway de destino):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Consejo: agrega una protección para que los dos bots no entren en bucle indefinidamente (solo menciones, listas
    de permitidos de canal o una regla de "no responder a mensajes de bots").

    Docs: [Acceso remoto](/es/gateway/remote), [CLI de agente](/es/cli/agent), [Envío de agente](/es/tools/agent-send).

  </Accordion>

  <Accordion title="¿Necesito VPS separados para varios agentes?">
    No. Un Gateway puede alojar varios agentes, cada uno con su propio espacio de trabajo, valores predeterminados de modelo
    y enrutamiento. Esa es la configuración normal y es mucho más barata y sencilla que ejecutar
    un VPS por agente.

    Usa VPS separados solo cuando necesites aislamiento estricto (límites de seguridad) o configuraciones muy
    diferentes que no quieras compartir. De lo contrario, mantén un Gateway y
    usa varios agentes o subagentes.

  </Accordion>

  <Accordion title="¿Hay alguna ventaja en usar un nodo en mi laptop personal en lugar de SSH desde un VPS?">
    Sí: los nodos son la forma de primera clase de acceder a tu laptop desde un Gateway remoto, y
    habilitan más que acceso shell. El Gateway se ejecuta en macOS/Linux (Windows mediante WSL2) y es
    ligero (un VPS pequeño o una máquina tipo Raspberry Pi está bien; 4 GB de RAM son suficientes), así que una configuración
    común es un host siempre encendido más tu laptop como nodo.

    - **No se requiere SSH entrante.** Los nodos se conectan hacia el Gateway WebSocket y usan emparejamiento de dispositivos.
    - **Controles de ejecución más seguros.** `system.run` está protegido por listas de permitidos/aprobaciones de nodo en esa laptop.
    - **Más herramientas de dispositivo.** Los nodos exponen `canvas`, `camera` y `screen` además de `system.run`.
    - **Automatización local del navegador.** Mantén el Gateway en un VPS, pero ejecuta Chrome localmente a través de un host de nodo en la laptop, o conéctate a Chrome local en el host mediante Chrome MCP.

    SSH está bien para acceso shell ad hoc, pero los nodos son más simples para flujos de trabajo continuos de agentes y
    automatización de dispositivos.

    Docs: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes), [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Los nodos ejecutan un servicio gateway?">
    No. Solo debe ejecutarse **un gateway** por host, salvo que ejecutes intencionalmente perfiles aislados (consulta [Varios gateways](/es/gateway/multiple-gateways)). Los nodos son periféricos que se conectan
    al gateway (nodos iOS/Android, o "modo nodo" de macOS en la app de la barra de menús). Para hosts de nodo headless
    y control por CLI, consulta [CLI de host de nodo](/es/cli/node).

    Se requiere un reinicio completo para cambios en `gateway`, `discovery` y `canvasHost`.

  </Accordion>

  <Accordion title="¿Hay una forma API / RPC de aplicar la configuración?">
    Sí.

    - `config.schema.lookup`: inspecciona un subárbol de configuración con su nodo de esquema superficial, la pista de UI coincidente y los resúmenes de hijos inmediatos antes de escribir
    - `config.get`: obtiene la instantánea actual + hash
    - `config.patch`: actualización parcial segura (preferida para la mayoría de ediciones RPC); recarga en caliente cuando es posible y reinicia cuando es necesario
    - `config.apply`: valida + reemplaza la configuración completa; recarga en caliente cuando es posible y reinicia cuando es necesario
    - La herramienta de runtime `gateway`, solo para propietarios, sigue rechazando reescribir `tools.exec.ask` / `tools.exec.security`; los alias heredados `tools.bash.*` se normalizan a las mismas rutas exec protegidas

  </Accordion>

  <Accordion title="Configuración mínima sensata para una primera instalación">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Esto establece tu workspace y restringe quién puede activar el bot.

  </Accordion>

  <Accordion title="¿Cómo configuro Tailscale en un VPS y me conecto desde mi Mac?">
    Pasos mínimos:

    1. **Instalar + iniciar sesión en el VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Instalar + iniciar sesión en tu Mac**
       - Usa la app de Tailscale e inicia sesión en el mismo tailnet.
    3. **Activar MagicDNS (recomendado)**
       - En la consola de administración de Tailscale, activa MagicDNS para que el VPS tenga un nombre estable.
    4. **Usar el hostname del tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - WS de Gateway: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Si quieres la UI de control sin SSH, usa Tailscale Serve en el VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Esto mantiene el gateway enlazado a loopback y expone HTTPS mediante Tailscale. Consulta [Tailscale](/es/gateway/tailscale).

  </Accordion>

  <Accordion title="¿Cómo conecto un nodo Mac a un Gateway remoto (Tailscale Serve)?">
    Serve expone la **UI de control del Gateway + WS**. Los nodos se conectan por el mismo endpoint WS del Gateway.

    Configuración recomendada:

    1. **Asegúrate de que el VPS + Mac estén en el mismo tailnet**.
    2. **Usa la app de macOS en modo remoto** (el destino SSH puede ser el hostname del tailnet).
       La app tunelizará el puerto del Gateway y se conectará como nodo.
    3. **Aprueba el nodo** en el gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Docs: [Protocolo de Gateway](/es/gateway/protocol), [Descubrimiento](/es/gateway/discovery), [Modo remoto de macOS](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Debería instalarlo en una segunda laptop o simplemente agregar un nodo?">
    Si solo necesitas **herramientas locales** (pantalla/cámara/exec) en la segunda laptop, agrégala como
    **nodo**. Eso mantiene un único Gateway y evita configuración duplicada. Las herramientas de nodo local
    actualmente son solo para macOS, pero planeamos extenderlas a otros sistemas operativos.

    Instala un segundo Gateway solo cuando necesites **aislamiento estricto** o dos bots completamente separados.

    Docs: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes), [Múltiples gateways](/es/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables de entorno y carga de .env

<AccordionGroup>
  <Accordion title="¿Cómo carga OpenClaw las variables de entorno?">
    OpenClaw lee variables de entorno del proceso padre (shell, launchd/systemd, CI, etc.) y además carga:

    - `.env` del directorio de trabajo actual
    - un `.env` de respaldo global desde `~/.openclaw/.env` (también `$OPENCLAW_STATE_DIR/.env`)

    Ningún archivo `.env` sobrescribe variables de entorno existentes.

    También puedes definir variables de entorno inline en la configuración (se aplican solo si faltan en el entorno del proceso):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Consulta [/environment](/es/help/environment) para ver la precedencia y las fuentes completas.

  </Accordion>

  <Accordion title="Inicié el Gateway mediante el servicio y mis variables de entorno desaparecieron. ¿Qué hago ahora?">
    Dos soluciones comunes:

    1. Coloca las claves faltantes en `~/.openclaw/.env` para que se recojan incluso cuando el servicio no herede el entorno de tu shell.
    2. Activa la importación de shell (comodidad opcional):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Esto ejecuta tu shell de inicio de sesión e importa solo las claves esperadas que faltan (nunca sobrescribe). Equivalentes de variables de entorno:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Configuré COPILOT_GITHUB_TOKEN, pero el estado de modelos muestra "Shell env: off." ¿Por qué?'>
    `openclaw models status` informa si la **importación del entorno de shell** está activada. "Shell env: off"
    **no** significa que falten tus variables de entorno; solo significa que OpenClaw no cargará
    automáticamente tu shell de inicio de sesión.

    Si el Gateway se ejecuta como servicio (launchd/systemd), no heredará tu entorno
    de shell. Corrígelo con una de estas opciones:

    1. Coloca el token en `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. O activa la importación de shell (`env.shellEnv.enabled: true`).
    3. O agrégalo al bloque `env` de tu configuración (se aplica solo si falta).

    Luego reinicia el gateway y vuelve a comprobar:

    ```bash
    openclaw models status
    ```

    Los tokens de Copilot se leen desde `COPILOT_GITHUB_TOKEN` (también `GH_TOKEN` / `GITHUB_TOKEN`).
    Consulta [/concepts/model-providers](/es/concepts/model-providers) y [/environment](/es/help/environment).

  </Accordion>
</AccordionGroup>

## Sesiones y múltiples chats

<AccordionGroup>
  <Accordion title="¿Cómo inicio una conversación nueva?">
    Envía `/new` o `/reset` como mensaje independiente. Consulta [Gestión de sesiones](/es/concepts/session).
  </Accordion>

  <Accordion title="¿Las sesiones se restablecen automáticamente si nunca envío /new?">
    Las sesiones pueden expirar después de `session.idleMinutes`, pero esto está **desactivado por defecto** (valor predeterminado **0**).
    Establécelo en un valor positivo para activar la expiración por inactividad. Cuando está activada, el **siguiente**
    mensaje después del periodo de inactividad inicia un id de sesión nuevo para esa clave de chat.
    Esto no elimina transcripciones; solo inicia una sesión nueva.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="¿Hay alguna forma de crear un equipo de instancias de OpenClaw (un CEO y muchos agentes)?">
    Sí, mediante **enrutamiento multiagente** y **subagentes**. Puedes crear un agente coordinador
    y varios agentes worker con sus propios workspaces y modelos.

    Dicho esto, conviene verlo como un **experimento divertido**. Consume muchos tokens y a menudo
    es menos eficiente que usar un bot con sesiones separadas. El modelo típico que
    imaginamos es un bot con el que hablas, con distintas sesiones para trabajo paralelo. Ese
    bot también puede generar subagentes cuando sea necesario.

    Docs: [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [CLI de agentes](/es/cli/agents).

  </Accordion>

  <Accordion title="¿Por qué se truncó el contexto a mitad de una tarea? ¿Cómo lo evito?">
    El contexto de sesión está limitado por la ventana del modelo. Chats largos, salidas grandes de herramientas o muchos
    archivos pueden activar compaction o truncamiento.

    Lo que ayuda:

    - Pide al bot que resuma el estado actual y lo escriba en un archivo.
    - Usa `/compact` antes de tareas largas y `/new` al cambiar de tema.
    - Mantén el contexto importante en el workspace y pide al bot que lo vuelva a leer.
    - Usa subagentes para trabajo largo o paralelo, de modo que el chat principal permanezca más pequeño.
    - Elige un modelo con una ventana de contexto mayor si esto ocurre a menudo.

  </Accordion>

  <Accordion title="¿Cómo restablezco completamente OpenClaw pero lo mantengo instalado?">
    Usa el comando de restablecimiento:

    ```bash
    openclaw reset
    ```

    Restablecimiento completo no interactivo:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Luego vuelve a ejecutar la configuración:

    ```bash
    openclaw onboard --install-daemon
    ```

    Notas:

    - Onboarding también ofrece **Restablecer** si detecta una configuración existente. Consulta [Onboarding (CLI)](/es/start/wizard).
    - Si usaste perfiles (`--profile` / `OPENCLAW_PROFILE`), restablece cada directorio de estado (los predeterminados son `~/.openclaw-<profile>`).
    - Restablecimiento de desarrollo: `openclaw gateway --dev --reset` (solo dev; borra configuración dev + credenciales + sesiones + workspace).

  </Accordion>

  <Accordion title='Recibo errores de "context too large": ¿cómo restablezco o compacto?'>
    Usa una de estas opciones:

    - **Compactar** (mantiene la conversación pero resume turnos antiguos):

      ```
      /compact
      ```

      o `/compact <instructions>` para guiar el resumen.

    - **Restablecer** (id de sesión nuevo para la misma clave de chat):

      ```
      /new
      /reset
      ```

    Si sigue ocurriendo:

    - Activa o ajusta la **poda de sesión** (`agents.defaults.contextPruning`) para recortar salidas de herramientas antiguas.
    - Usa un modelo con una ventana de contexto mayor.

    Docs: [Compaction](/es/concepts/compaction), [Poda de sesión](/es/concepts/session-pruning), [Gestión de sesiones](/es/concepts/session).

  </Accordion>

  <Accordion title='¿Por qué veo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Este es un error de validación del proveedor: el modelo emitió un bloque `tool_use` sin el
    `input` requerido. Normalmente significa que el historial de sesión está obsoleto o dañado (a menudo después de hilos largos
    o un cambio de herramienta/esquema).

    Solución: inicia una sesión nueva con `/new` (mensaje independiente).

  </Accordion>

  <Accordion title="¿Por qué recibo mensajes de heartbeat cada 30 minutos?">
    Los heartbeats se ejecutan cada **30m** por defecto (**1h** cuando se usa autenticación OAuth). Ajústalos o desactívalos:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    Si `HEARTBEAT.md` existe pero está prácticamente vacío (solo líneas en blanco y encabezados
    markdown como `# Heading`), OpenClaw omite la ejecución de heartbeat para ahorrar llamadas API.
    Si falta el archivo, el heartbeat se ejecuta de todos modos y el modelo decide qué hacer.

    Las anulaciones por agente usan `agents.list[].heartbeat`. Docs: [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title='¿Necesito agregar una "cuenta de bot" a un grupo de WhatsApp?'>
    No. OpenClaw se ejecuta en **tu propia cuenta**, así que si estás en el grupo, OpenClaw puede verlo.
    Por defecto, las respuestas de grupo están bloqueadas hasta que permitas remitentes (`groupPolicy: "allowlist"`).

    Si quieres que solo **tú** puedas activar respuestas de grupo:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="¿Cómo obtengo el JID de un grupo de WhatsApp?">
    Opción 1 (la más rápida): sigue los logs y envía un mensaje de prueba en el grupo:

    ```bash
    openclaw logs --follow --json
    ```

    Busca `chatId` (o `from`) que termine en `@g.us`, como:
    `1234567890-1234567890@g.us`.

    Opción 2 (si ya está configurado/en la allowlist): lista grupos desde la configuración:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Docs: [WhatsApp](/es/channels/whatsapp), [Directorio](/es/cli/directory), [Logs](/es/cli/logs).

  </Accordion>

  <Accordion title="¿Por qué OpenClaw no responde en un grupo?">
    Dos causas comunes:

    - La compuerta por mención está activada (por defecto). Debes @mencionar al bot (o coincidir con `mentionPatterns`).
    - Configuraste `channels.whatsapp.groups` sin `"*"` y el grupo no está en la allowlist.

    Consulta [Grupos](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).

  </Accordion>

  <Accordion title="¿Los grupos/hilos comparten contexto con los MD?">
    Los chats directos se reducen a la sesión principal por defecto. Los grupos/canales tienen sus propias claves de sesión, y los temas de Telegram / hilos de Discord son sesiones separadas. Consulta [Grupos](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).
  </Accordion>

  <Accordion title="¿Cuántos espacios de trabajo y agentes puedo crear?">
    No hay límites estrictos. Docenas (incluso cientos) están bien, pero vigila:

    - **Crecimiento de disco:** las sesiones y transcripciones viven en `~/.openclaw/agents/<agentId>/sessions/`.
    - **Costo de tokens:** más agentes significa más uso concurrente del modelo.
    - **Sobrecarga operativa:** perfiles de autenticación, espacios de trabajo y enrutamiento de canales por agente.

    Consejos:

    - Mantén un espacio de trabajo **activo** por agente (`agents.defaults.workspace`).
    - Poda sesiones antiguas (elimina JSONL o entradas del almacén) si el disco crece.
    - Usa `openclaw doctor` para detectar espacios de trabajo sueltos y discrepancias de perfiles.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios bots o chats al mismo tiempo (Slack), y cómo debo configurarlo?">
    Sí. Usa **Enrutamiento multiagente** para ejecutar varios agentes aislados y enrutar mensajes entrantes por
    canal/cuenta/par. Slack es compatible como canal y puede vincularse a agentes específicos.

    El acceso al navegador es potente, pero no permite "hacer cualquier cosa que pueda hacer una persona": los sistemas antibot, CAPTCHA y MFA
    todavía pueden bloquear la automatización. Para el control del navegador más fiable, usa Chrome MCP local en el host,
    o usa CDP en la máquina que realmente ejecuta el navegador.

    Configuración recomendada:

    - Host de Gateway siempre activo (VPS/Mac mini).
    - Un agente por rol (vinculaciones).
    - Canales de Slack vinculados a esos agentes.
    - Navegador local mediante Chrome MCP o un nodo cuando sea necesario.

    Documentación: [Enrutamiento multiagente](/es/concepts/multi-agent), [Slack](/es/channels/slack),
    [Navegador](/es/tools/browser), [Nodos](/es/nodes).

  </Accordion>
</AccordionGroup>

## Modelos, conmutación por error y perfiles de autenticación

Las preguntas y respuestas sobre modelos — valores predeterminados, selección, alias, cambio, conmutación por error, perfiles de autenticación —
viven en las [Preguntas frecuentes sobre modelos](/es/help/faq-models).

## Gateway: puertos, "ya está en ejecución" y modo remoto

<AccordionGroup>
  <Accordion title="¿Qué puerto usa el Gateway?">
    `gateway.port` controla el único puerto multiplexado para WebSocket + HTTP (Control UI, hooks, etc.).

    Precedencia:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status dice "Runtime: running" pero "Connectivity probe: failed"?'>
    Porque "running" es la vista del **supervisor** (launchd/systemd/schtasks). La sonda de conectividad es la CLI conectándose realmente al WebSocket del gateway.

    Usa `openclaw gateway status` y confía en estas líneas:

    - `Probe target:` (la URL que realmente usó la sonda)
    - `Listening:` (lo que realmente está vinculado al puerto)
    - `Last gateway error:` (causa raíz común cuando el proceso está vivo pero el puerto no está escuchando)

  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status muestra "Config (cli)" y "Config (service)" diferentes?'>
    Estás editando un archivo de configuración mientras el servicio ejecuta otro (a menudo una discrepancia de `--profile` / `OPENCLAW_STATE_DIR`).

    Corrección:

    ```bash
    openclaw gateway install --force
    ```

    Ejecútalo desde el mismo `--profile` / entorno que quieres que use el servicio.

  </Accordion>

  <Accordion title='¿Qué significa "another gateway instance is already listening"?'>
    OpenClaw aplica un bloqueo de runtime vinculando el listener de WebSocket inmediatamente al iniciar (predeterminado `ws://127.0.0.1:18789`). Si el vínculo falla con `EADDRINUSE`, lanza `GatewayLockError`, indicando que otra instancia ya está escuchando.

    Corrección: detén la otra instancia, libera el puerto o ejecuta con `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="¿Cómo ejecuto OpenClaw en modo remoto (el cliente se conecta a un Gateway en otro lugar)?">
    Configura `gateway.mode: "remote"` y apunta a una URL WebSocket remota, opcionalmente con credenciales remotas de secreto compartido:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Notas:

    - `openclaw gateway` solo se inicia cuando `gateway.mode` es `local` (o pasas la marca de anulación).
    - La app de macOS observa el archivo de configuración y cambia de modo en vivo cuando estos valores cambian.
    - `gateway.remote.token` / `.password` son solo credenciales remotas del lado del cliente; no habilitan por sí mismas la autenticación del gateway local.

  </Accordion>

  <Accordion title='La Control UI dice "unauthorized" (o sigue reconectándose). ¿Y ahora qué?'>
    La ruta de autenticación de tu gateway y el método de autenticación de la UI no coinciden.

    Datos (del código):

    - La Control UI mantiene el token en `sessionStorage` para la sesión de pestaña actual del navegador y la URL de gateway seleccionada, por lo que las recargas en la misma pestaña siguen funcionando sin restaurar la persistencia de tokens de larga duración en localStorage.
    - En `AUTH_TOKEN_MISMATCH`, los clientes de confianza pueden intentar un reintento acotado con un token de dispositivo en caché cuando el gateway devuelve pistas de reintento (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ese reintento con token en caché ahora reutiliza los ámbitos aprobados en caché almacenados con el token de dispositivo. Los llamadores con `deviceToken` explícito / `scopes` explícitos siguen conservando su conjunto de ámbitos solicitado en lugar de heredar ámbitos en caché.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token de arranque.
    - Las comprobaciones de ámbito del token de arranque tienen prefijo de rol. La allowlist integrada del operador de arranque solo satisface solicitudes de operador; los nodos u otros roles no operadores todavía necesitan ámbitos bajo su propio prefijo de rol.

    Corrección:

    - Lo más rápido: `openclaw dashboard` (imprime y copia la URL del panel, intenta abrirla; muestra una pista de SSH si no hay interfaz gráfica).
    - Si aún no tienes un token: `openclaw doctor --generate-gateway-token`.
    - Si es remoto, primero crea un túnel: `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`.
    - Modo de secreto compartido: configura `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, luego pega el secreto correspondiente en la configuración de Control UI.
    - Modo Tailscale Serve: asegúrate de que `gateway.auth.allowTailscale` esté habilitado y de abrir la URL de Serve, no una URL local loopback/tailnet sin procesar que omita los encabezados de identidad de Tailscale.
    - Modo de proxy de confianza: asegúrate de entrar por el proxy con reconocimiento de identidad configurado, no por una URL de gateway sin procesar. Los proxies local loopback del mismo host también necesitan `gateway.auth.trustedProxy.allowLoopback = true`.
    - Si la discrepancia persiste después del único reintento, rota/vuelve a aprobar el token de dispositivo emparejado:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Si esa llamada de rotación dice que fue denegada, revisa dos cosas:
      - las sesiones de dispositivo emparejado solo pueden rotar su **propio** dispositivo a menos que también tengan `operator.admin`
      - los valores explícitos de `--scope` no pueden exceder los ámbitos de operador actuales del llamador
    - ¿Sigues atascado? Ejecuta `openclaw status --all` y sigue [Solución de problemas](/es/gateway/troubleshooting). Consulta [Panel](/es/web/dashboard) para detalles de autenticación.

  </Accordion>

  <Accordion title="Configuré gateway.bind tailnet pero no puede vincularse y nada escucha">
    El vínculo `tailnet` elige una IP de Tailscale de tus interfaces de red (100.64.0.0/10). Si la máquina no está en Tailscale (o la interfaz está caída), no hay nada a lo que vincularse.

    Corrección:

    - Inicia Tailscale en ese host (para que tenga una dirección 100.x), o
    - Cambia a `gateway.bind: "loopback"` / `"lan"`.

    Nota: `tailnet` es explícito. `auto` prefiere local loopback; usa `gateway.bind: "tailnet"` cuando quieras un vínculo solo para tailnet.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios Gateways en el mismo host?">
    Normalmente no: un Gateway puede ejecutar varios canales de mensajería y agentes. Usa varios Gateways solo cuando necesites redundancia (por ejemplo: bot de rescate) o aislamiento estricto.

    Sí, pero debes aislar:

    - `OPENCLAW_CONFIG_PATH` (configuración por instancia)
    - `OPENCLAW_STATE_DIR` (estado por instancia)
    - `agents.defaults.workspace` (aislamiento de espacios de trabajo)
    - `gateway.port` (puertos únicos)

    Configuración rápida (recomendada):

    - Usa `openclaw --profile <name> ...` por instancia (crea automáticamente `~/.openclaw-<name>`).
    - Configura un `gateway.port` único en cada configuración de perfil (o pasa `--port` para ejecuciones manuales).
    - Instala un servicio por perfil: `openclaw --profile <name> gateway install`.

    Los perfiles también añaden sufijos a los nombres de servicio (`ai.openclaw.<profile>`; heredado `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guía completa: [Varios gateways](/es/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='¿Qué significa "invalid handshake" / código 1008?'>
    El Gateway es un **servidor WebSocket**, y espera que el primer mensaje
    sea un frame `connect`. Si recibe cualquier otra cosa, cierra la conexión
    con **código 1008** (infracción de política).

    Causas comunes:

    - Abriste la URL **HTTP** en un navegador (`http://...`) en lugar de un cliente WS.
    - Usaste el puerto o la ruta incorrectos.
    - Un proxy o túnel eliminó encabezados de autenticación o envió una solicitud que no es de Gateway.

    Correcciones rápidas:

    1. Usa la URL WS: `ws://<host>:18789` (o `wss://...` si es HTTPS).
    2. No abras el puerto WS en una pestaña normal del navegador.
    3. Si la autenticación está activada, incluye el token/contraseña en el frame `connect`.

    Si usas la CLI o TUI, la URL debería verse así:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Detalles del protocolo: [Protocolo de Gateway](/es/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Registro y depuración

<AccordionGroup>
  <Accordion title="¿Dónde están los registros?">
    Registros de archivo (estructurados):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Puedes configurar una ruta estable mediante `logging.file`. El nivel de registro de archivo se controla con `logging.level`. La verbosidad de consola se controla con `--verbose` y `logging.consoleLevel`.

    Seguimiento de registros más rápido:

    ```bash
    openclaw logs --follow
    ```

    Registros de servicio/supervisor (cuando el gateway se ejecuta mediante launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` y `gateway.err.log` (predeterminado: `~/.openclaw/logs/...`; los perfiles usan `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Consulta [Solución de problemas](/es/gateway/troubleshooting) para más información.

  </Accordion>

  <Accordion title="¿Cómo inicio/detengo/reinicio el servicio Gateway?">
    Usa los helpers de gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Si ejecutas el gateway manualmente, `openclaw gateway --force` puede recuperar el puerto. Consulta [Gateway](/es/gateway).

  </Accordion>

  <Accordion title="Cerré mi terminal en Windows: ¿cómo reinicio OpenClaw?">
    Hay **dos modos de instalación de Windows**:

    **1) WSL2 (recomendado):** el Gateway se ejecuta dentro de Linux.

    Abre PowerShell, entra en WSL y luego reinicia:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Si nunca instalaste el servicio, inícialo en primer plano:

    ```bash
    openclaw gateway run
    ```

    **2) Windows nativo (no recomendado):** el Gateway se ejecuta directamente en Windows.

    Abre PowerShell y ejecuta:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Si lo ejecutas manualmente (sin servicio), usa:

    ```powershell
    openclaw gateway run
    ```

    Documentación: [Windows (WSL2)](/es/platforms/windows), [Runbook del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="El Gateway está activo pero las respuestas nunca llegan. ¿Qué debo comprobar?">
    Empieza con una revisión rápida de salud:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causas comunes:

    - La autenticación del modelo no está cargada en el **host del Gateway** (comprueba `models status`).
    - El emparejamiento/lista de permitidos del canal está bloqueando respuestas (comprueba la configuración del canal y los registros).
    - WebChat/Panel está abierto sin el token correcto.

    Si estás en remoto, confirma que la conexión del túnel/Tailscale esté activa y que el
    WebSocket del Gateway sea alcanzable.

    Documentación: [Canales](/es/channels), [Solución de problemas](/es/gateway/troubleshooting), [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title='"Desconectado del gateway: sin motivo" - ¿y ahora qué?'>
    Esto normalmente significa que la interfaz perdió la conexión WebSocket. Comprueba:

    1. ¿Está el Gateway en ejecución? `openclaw gateway status`
    2. ¿Está el Gateway en buen estado? `openclaw status`
    3. ¿Tiene la interfaz el token correcto? `openclaw dashboard`
    4. Si estás en remoto, ¿está activo el enlace del túnel/Tailscale?

    Después sigue los registros:

    ```bash
    openclaw logs --follow
    ```

    Documentación: [Panel](/es/web/dashboard), [Acceso remoto](/es/gateway/remote), [Solución de problemas](/es/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands falla. ¿Qué debo comprobar?">
    Empieza por los registros y el estado del canal:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Después identifica el error:

    - `BOT_COMMANDS_TOO_MUCH`: el menú de Telegram tiene demasiadas entradas. OpenClaw ya lo recorta al límite de Telegram y reintenta con menos comandos, pero aún hay que quitar algunas entradas del menú. Reduce los comandos de Plugin/skill/personalizados, o desactiva `channels.telegram.commands.native` si no necesitas el menú.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, o errores de red similares: si estás en un VPS o detrás de un proxy, confirma que se permita HTTPS saliente y que DNS funcione para `api.telegram.org`.

    Si el Gateway es remoto, asegúrate de estar mirando los registros en el host del Gateway.

    Documentación: [Telegram](/es/channels/telegram), [Solución de problemas de canales](/es/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI no muestra salida. ¿Qué debo comprobar?">
    Primero confirma que el Gateway sea alcanzable y que el agente pueda ejecutarse:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    En la TUI, usa `/status` para ver el estado actual. Si esperas respuestas en un canal
    de chat, asegúrate de que la entrega esté activada (`/deliver on`).

    Documentación: [TUI](/es/web/tui), [Comandos de barra](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo detengo completamente y luego inicio el Gateway?">
    Si instalaste el servicio:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Esto detiene/inicia el **servicio supervisado** (launchd en macOS, systemd en Linux).
    Usa esto cuando el Gateway se ejecute en segundo plano como demonio.

    Si lo estás ejecutando en primer plano, detén con Ctrl-C y luego:

    ```bash
    openclaw gateway run
    ```

    Documentación: [Runbook del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart frente a openclaw gateway">
    - `openclaw gateway restart`: reinicia el **servicio en segundo plano** (launchd/systemd).
    - `openclaw gateway`: ejecuta el gateway **en primer plano** para esta sesión de terminal.

    Si instalaste el servicio, usa los comandos de gateway. Usa `openclaw gateway` cuando
    quieras una ejecución puntual en primer plano.

  </Accordion>

  <Accordion title="La forma más rápida de obtener más detalles cuando algo falla">
    Inicia el Gateway con `--verbose` para obtener más detalle en consola. Luego inspecciona el archivo de registro para errores de autenticación del canal, enrutamiento del modelo y RPC.
  </Accordion>
</AccordionGroup>

## Medios y archivos adjuntos

<AccordionGroup>
  <Accordion title="Mi skill generó una imagen/PDF, pero no se envió nada">
    Los archivos adjuntos salientes del agente deben incluir una línea `MEDIA:<path-or-url>` (en su propia línea). Consulta [Configuración del asistente de OpenClaw](/es/start/openclaw) y [Envío del agente](/es/tools/agent-send).

    Envío por CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Comprueba también:

    - Que el canal de destino admita medios salientes y no esté bloqueado por listas de permitidos.
    - Que el archivo esté dentro de los límites de tamaño del proveedor (las imágenes se redimensionan a un máximo de 2048 px).
    - `tools.fs.workspaceOnly=true` limita los envíos de rutas locales al espacio de trabajo, temp/media-store y archivos validados por el sandbox.
    - `tools.fs.workspaceOnly=false` permite que `MEDIA:` envíe archivos locales del host que el agente ya pueda leer, pero solo para medios y tipos de documentos seguros (imágenes, audio, video, PDF y documentos de Office). Los archivos de texto plano y de aspecto secreto siguen bloqueados.

    Consulta [Imágenes](/es/nodes/images).

  </Accordion>
</AccordionGroup>

## Seguridad y control de acceso

<AccordionGroup>
  <Accordion title="¿Es seguro exponer OpenClaw a mensajes directos entrantes?">
    Trata los mensajes directos entrantes como entrada no confiable. Los valores predeterminados están diseñados para reducir el riesgo:

    - El comportamiento predeterminado en canales con mensajes directos es **emparejamiento**:
      - Los remitentes desconocidos reciben un código de emparejamiento; el bot no procesa su mensaje.
      - Aprueba con: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Las solicitudes pendientes tienen un límite de **3 por canal**; comprueba `openclaw pairing list --channel <channel> [--account <id>]` si no llegó un código.
    - Abrir mensajes directos públicamente requiere aceptación explícita (`dmPolicy: "open"` y lista de permitidos `"*"`).

    Ejecuta `openclaw doctor` para mostrar políticas de mensajes directos riesgosas.

  </Accordion>

  <Accordion title="¿La inyección de prompt solo es una preocupación para bots públicos?">
    No. La inyección de prompt trata sobre **contenido no confiable**, no solo sobre quién puede enviar mensajes directos al bot.
    Si tu asistente lee contenido externo (búsqueda/obtención web, páginas del navegador, correos,
    documentación, archivos adjuntos, registros pegados), ese contenido puede incluir instrucciones que intenten
    secuestrar el modelo. Esto puede ocurrir incluso si **tú eres el único remitente**.

    El mayor riesgo aparece cuando las herramientas están habilitadas: se puede engañar al modelo para que
    exfiltre contexto o llame herramientas en tu nombre. Reduce el radio de impacto mediante:

    - usar un agente "lector" de solo lectura o sin herramientas para resumir contenido no confiable
    - mantener `web_search` / `web_fetch` / `browser` desactivados para agentes con herramientas habilitadas
    - tratar también el texto de archivos/documentos decodificados como no confiable: OpenResponses
      `input_file` y la extracción de archivos adjuntos multimedia envuelven el texto extraído en
      marcadores explícitos de límite de contenido externo en lugar de pasar texto de archivo sin procesar
    - sandboxing y listas estrictas de herramientas permitidas

    Detalles: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Debería mi bot tener su propio correo electrónico, cuenta de GitHub o número de teléfono?">
    Sí, para la mayoría de configuraciones. Aislar el bot con cuentas y números de teléfono separados
    reduce el radio de impacto si algo sale mal. Esto también facilita rotar
    credenciales o revocar acceso sin afectar tus cuentas personales.

    Empieza poco a poco. Da acceso solo a las herramientas y cuentas que realmente necesitas, y amplía
    más adelante si hace falta.

    Documentación: [Seguridad](/es/gateway/security), [Emparejamiento](/es/channels/pairing).

  </Accordion>

  <Accordion title="¿Puedo darle autonomía sobre mis mensajes de texto y es seguro?">
    **No** recomendamos autonomía completa sobre tus mensajes personales. El patrón más seguro es:

    - Mantén los mensajes directos en **modo de emparejamiento** o en una lista de permitidos estricta.
    - Usa un **número o cuenta separados** si quieres que envíe mensajes en tu nombre.
    - Permite que redacte y luego **aprueba antes de enviar**.

    Si quieres experimentar, hazlo en una cuenta dedicada y mantenla aislada. Consulta
    [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Puedo usar modelos más baratos para tareas de asistente personal?">
    Sí, **si** el agente solo chatea y la entrada es confiable. Los niveles más pequeños son
    más susceptibles al secuestro de instrucciones, así que evítalos para agentes con herramientas habilitadas
    o al leer contenido no confiable. Si debes usar un modelo más pequeño, restringe
    las herramientas y ejecútalo dentro de un sandbox. Consulta [Seguridad](/es/gateway/security).
  </Accordion>

  <Accordion title="Ejecuté /start en Telegram pero no recibí un código de emparejamiento">
    Los códigos de emparejamiento se envían **solo** cuando un remitente desconocido envía un mensaje al bot y
    `dmPolicy: "pairing"` está habilitado. `/start` por sí solo no genera un código.

    Comprueba las solicitudes pendientes:

    ```bash
    openclaw pairing list telegram
    ```

    Si quieres acceso inmediato, añade tu id de remitente a la lista de permitidos o establece `dmPolicy: "open"`
    para esa cuenta.

  </Accordion>

  <Accordion title="WhatsApp: ¿enviará mensajes a mis contactos? ¿Cómo funciona el emparejamiento?">
    No. La política predeterminada de mensajes directos de WhatsApp es **emparejamiento**. Los remitentes desconocidos solo reciben un código de emparejamiento y su mensaje **no se procesa**. OpenClaw solo responde a chats que recibe o a envíos explícitos que tú activas.

    Aprueba el emparejamiento con:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Lista las solicitudes pendientes:

    ```bash
    openclaw pairing list whatsapp
    ```

    Solicitud de número de teléfono del asistente de configuración: se usa para establecer tu **lista de permitidos/propietario** para que tus propios mensajes directos estén permitidos. No se usa para envío automático. Si lo ejecutas en tu número personal de WhatsApp, usa ese número y habilita `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandos de chat, cancelación de tareas y "no se detiene"

<AccordionGroup>
  <Accordion title="¿Cómo evito que los mensajes internos del sistema aparezcan en el chat?">
    La mayoría de mensajes internos o de herramientas solo aparecen cuando **verbose**, **trace** o **reasoning** está habilitado
    para esa sesión.

    Corrige esto en el chat donde lo ves:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Si sigue siendo ruidoso, comprueba la configuración de la sesión en la interfaz de control y establece verbose
    en **heredar**. Confirma también que no estés usando un perfil de bot con `verboseDefault` establecido
    en `on` en la configuración.

    Documentación: [Pensamiento y verbosidad](/es/tools/thinking), [Seguridad](/es/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="¿Cómo detengo/cancelo una tarea en ejecución?">
    Envía cualquiera de estos **como mensaje independiente** (sin barra):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Estos son activadores de cancelación (no comandos de barra).

    Para procesos en segundo plano (desde la herramienta exec), puedes pedirle al agente que ejecute:

    ```
    process action:kill sessionId:XXX
    ```

    Resumen de comandos de barra: consulta [Comandos de barra](/es/tools/slash-commands).

    La mayoría de los comandos deben enviarse como mensaje **independiente** que empiece con `/`, pero algunos atajos (como `/status`) también funcionan en línea para remitentes en la lista de permitidos.

  </Accordion>

  <Accordion title='¿Cómo envío un mensaje de Discord desde Telegram? ("Mensajería entre contextos denegada")'>
    OpenClaw bloquea la mensajería **entre proveedores** de forma predeterminada. Si una llamada de herramienta está vinculada
    a Telegram, no enviará a Discord a menos que lo permitas explícitamente.

    Habilita la mensajería entre proveedores para el agente:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Reinicia el gateway después de editar la configuración.

  </Accordion>

  <Accordion title='¿Por qué parece que el bot "ignora" mensajes rápidos uno tras otro?'>
    El modo de cola controla cómo interactúan los mensajes nuevos con una ejecución en curso. Usa `/queue` para cambiar de modo:

    - `steer` - pone en cola toda la orientación pendiente para el siguiente límite del modelo en la ejecución actual
    - `queue` - orientación heredada de una en una
    - `followup` - ejecuta los mensajes uno a la vez
    - `collect` - agrupa mensajes y responde una vez
    - `steer-backlog` - orienta ahora y luego procesa la acumulación
    - `interrupt` - cancela la ejecución actual y empieza de nuevo

    El modo predeterminado es `steer`. Puedes agregar opciones como `debounce:0.5s cap:25 drop:summarize` para modos de seguimiento. Consulta [Cola de comandos](/es/concepts/queue) y [Cola de direccionamiento](/es/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Varios

<AccordionGroup>
  <Accordion title='¿Cuál es el modelo predeterminado para Anthropic con una clave de API?'>
    En OpenClaw, las credenciales y la selección del modelo están separadas. Configurar `ANTHROPIC_API_KEY` (o almacenar una clave de API de Anthropic en perfiles de autenticación) habilita la autenticación, pero el modelo predeterminado real es el que configures en `agents.defaults.model.primary` (por ejemplo, `anthropic/claude-sonnet-4-6` o `anthropic/claude-opus-4-6`). Si ves `No credentials found for profile "anthropic:default"`, significa que el Gateway no pudo encontrar credenciales de Anthropic en el `auth-profiles.json` esperado para el agente que se está ejecutando.
  </Accordion>
</AccordionGroup>

---

¿Sigues bloqueado? Pregunta en [Discord](https://discord.com/invite/clawd) o abre una [discusión de GitHub](https://github.com/openclaw/openclaw/discussions).

## Relacionado

- [Preguntas frecuentes del primer inicio](/es/help/faq-first-run) — instalación, incorporación, autenticación, suscripciones, fallos iniciales
- [Preguntas frecuentes sobre modelos](/es/help/faq-models) — selección de modelos, conmutación por error, perfiles de autenticación
- [Solución de problemas](/es/help/troubleshooting) — triaje según síntomas
