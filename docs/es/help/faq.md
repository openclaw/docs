---
read_when:
    - Responder preguntas frecuentes de soporte sobre configuración, instalación, incorporación o tiempo de ejecución
    - Clasificación de problemas reportados por usuarios antes de una depuración más profunda
summary: Preguntas frecuentes sobre la instalación, la configuración y el uso de OpenClaw
title: Preguntas frecuentes
x-i18n:
    generated_at: "2026-04-30T05:45:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: c09be6571e048b71e4e02288b22b51e70102872675dfc7bef133b955a06f6ac9
    source_path: help/faq.md
    workflow: 16
---

Respuestas rápidas y solución de problemas más profunda para configuraciones reales (desarrollo local, VPS, multiagente, claves OAuth/API, conmutación por error de modelos). Para diagnósticos de ejecución, consulta [Solución de problemas](/es/gateway/troubleshooting). Para la referencia completa de configuración, consulta [Configuración](/es/gateway/configuration).

## Primeros 60 segundos si algo está roto

1. **Estado rápido (primera comprobación)**

   ```bash
   openclaw status
   ```

   Resumen local rápido: SO + actualización, accesibilidad del gateway/servicio, agentes/sesiones, configuración de proveedores + problemas de ejecución (cuando el Gateway es accesible).

2. **Informe pegable (seguro para compartir)**

   ```bash
   openclaw status --all
   ```

   Diagnóstico de solo lectura con cola de registros (tokens redactados).

3. **Estado del daemon + puerto**

   ```bash
   openclaw gateway status
   ```

   Muestra el entorno de ejecución del supervisor frente a la accesibilidad RPC, la URL objetivo de la sonda y qué configuración probablemente usó el servicio.

4. **Sondas profundas**

   ```bash
   openclaw status --deep
   ```

   Ejecuta una sonda de salud del Gateway en vivo, incluidas sondas de canales cuando se admiten
   (requiere un Gateway accesible). Consulta [Salud](/es/gateway/health).

5. **Seguir el registro más reciente**

   ```bash
   openclaw logs --follow
   ```

   Si RPC no funciona, usa como alternativa:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Los registros de archivo están separados de los registros del servicio; consulta [Registro](/es/logging) y [Solución de problemas](/es/gateway/troubleshooting).

6. **Ejecutar el doctor (reparaciones)**

   ```bash
   openclaw doctor
   ```

   Repara/migra configuración/estado + ejecuta comprobaciones de salud. Consulta [Doctor](/es/gateway/doctor).

7. **Instantánea del Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Pide al Gateway en ejecución una instantánea completa (solo WS). Consulta [Salud](/es/gateway/health).

## Inicio rápido y configuración de primera ejecución

Las preguntas y respuestas de primera ejecución — instalación, incorporación, rutas de autenticación, suscripciones, fallos iniciales —
están en las [Preguntas frecuentes de primera ejecución](/es/help/faq-first-run).

## ¿Qué es OpenClaw?

<AccordionGroup>
  <Accordion title="¿Qué es OpenClaw, en un párrafo?">
    OpenClaw es un asistente de IA personal que ejecutas en tus propios dispositivos. Responde en las superficies de mensajería que ya usas (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat y plugins de canal incluidos, como QQ Bot) y también puede usar voz + un Canvas en vivo en plataformas compatibles. El **Gateway** es el plano de control siempre activo; el asistente es el producto.
  </Accordion>

  <Accordion title="Propuesta de valor">
    OpenClaw no es "solo un envoltorio de Claude". Es un **plano de control local-first** que te permite ejecutar un
    asistente capaz en **tu propio hardware**, accesible desde las aplicaciones de chat que ya usas, con
    sesiones con estado, memoria y herramientas, sin entregar el control de tus flujos de trabajo a un
    SaaS alojado.

    Aspectos destacados:

    - **Tus dispositivos, tus datos:** ejecuta el Gateway donde quieras (Mac, Linux, VPS) y conserva el
      espacio de trabajo + historial de sesiones en local.
    - **Canales reales, no un entorno web aislado:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      además de voz móvil y Canvas en plataformas compatibles.
    - **Independiente del modelo:** usa Anthropic, OpenAI, MiniMax, OpenRouter, etc., con enrutamiento
      por agente y conmutación por error.
    - **Opción solo local:** ejecuta modelos locales para que **todos los datos puedan permanecer en tu dispositivo** si quieres.
    - **Enrutamiento multiagente:** agentes separados por canal, cuenta o tarea, cada uno con su propio
      espacio de trabajo y valores predeterminados.
    - **Código abierto y modificable:** inspecciona, amplía y autoaloja sin dependencia de proveedor.

    Documentación: [Gateway](/es/gateway), [Canales](/es/channels), [Multiagente](/es/concepts/multi-agent),
    [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="Acabo de configurarlo: ¿qué debería hacer primero?">
    Buenos primeros proyectos:

    - Crear un sitio web (WordPress, Shopify o un sitio estático simple).
    - Prototipar una aplicación móvil (esquema, pantallas, plan de API).
    - Organizar archivos y carpetas (limpieza, nombres, etiquetas).
    - Conectar Gmail y automatizar resúmenes o seguimientos.

    Puede manejar tareas grandes, pero funciona mejor cuando las divides en fases y
    usas subagentes para trabajo paralelo.

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
    Sí para **investigación, cualificación y redacción**. Puede escanear sitios, crear listas cortas,
    resumir prospectos y escribir borradores de outreach o textos publicitarios.

    Para **outreach o campañas publicitarias**, mantén a una persona en el proceso. Evita el spam, cumple las leyes locales y
    las políticas de las plataformas, y revisa todo antes de enviarlo. El patrón más seguro es dejar que
    OpenClaw redacte y que tú apruebes.

    Documentación: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Cuáles son las ventajas frente a Claude Code para desarrollo web?">
    OpenClaw es un **asistente personal** y una capa de coordinación, no un reemplazo del IDE. Usa
    Claude Code o Codex para el ciclo de codificación directa más rápido dentro de un repositorio. Usa OpenClaw cuando
    quieras memoria duradera, acceso entre dispositivos y orquestación de herramientas.

    Ventajas:

    - **Memoria persistente + espacio de trabajo** entre sesiones
    - **Acceso multiplataforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orquestación de herramientas** (navegador, archivos, programación, hooks)
    - **Gateway siempre activo** (ejecútalo en un VPS, interactúa desde cualquier lugar)
    - **Nodes** para navegador/pantalla/cámara/ejecución locales

    Muestra: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills y automatización

<AccordionGroup>
  <Accordion title="¿Cómo personalizo Skills sin mantener el repositorio sucio?">
    Usa sobrescrituras administradas en lugar de editar la copia del repositorio. Pon tus cambios en `~/.openclaw/skills/<name>/SKILL.md` (o añade una carpeta mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json`). La precedencia es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluidas → `skills.load.extraDirs`, por lo que las sobrescrituras administradas siguen ganando sobre las Skills incluidas sin tocar git. Si necesitas que la Skill esté instalada globalmente pero solo visible para algunos agentes, mantén la copia compartida en `~/.openclaw/skills` y controla la visibilidad con `agents.defaults.skills` y `agents.list[].skills`. Solo las ediciones dignas de upstream deberían vivir en el repositorio y salir como PR.
  </Accordion>

  <Accordion title="¿Puedo cargar Skills desde una carpeta personalizada?">
    Sí. Añade directorios adicionales mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json` (precedencia más baja). La precedencia predeterminada es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluidas → `skills.load.extraDirs`. `clawhub` instala en `./skills` de forma predeterminada, que OpenClaw trata como `<workspace>/skills` en la siguiente sesión. Si la Skill solo debería ser visible para ciertos agentes, combínalo con `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="¿Cómo puedo usar diferentes modelos para diferentes tareas?">
    Hoy los patrones compatibles son:

    - **Tareas Cron**: los trabajos aislados pueden establecer una sobrescritura de `model` por trabajo.
    - **Subagentes**: enruta tareas a agentes separados con diferentes modelos predeterminados.
    - **Cambio bajo demanda**: usa `/model` para cambiar el modelo de la sesión actual en cualquier momento.

    Consulta [Tareas Cron](/es/automation/cron-jobs), [Enrutamiento multiagente](/es/concepts/multi-agent) y [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="El bot se congela mientras hace trabajo pesado. ¿Cómo descargo eso?">
    Usa **subagentes** para tareas largas o paralelas. Los subagentes se ejecutan en su propia sesión,
    devuelven un resumen y mantienen tu chat principal receptivo.

    Pide a tu bot que "genere un subagente para esta tarea" o usa `/subagents`.
    Usa `/status` en el chat para ver qué está haciendo el Gateway ahora mismo (y si está ocupado).

    Consejo sobre tokens: las tareas largas y los subagentes consumen tokens. Si el coste te preocupa, establece un
    modelo más barato para subagentes mediante `agents.defaults.subagents.model`.

    Documentación: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Cómo funcionan las sesiones de subagente vinculadas a hilos en Discord?">
    Usa vinculaciones de hilos. Puedes vincular un hilo de Discord a un subagente u objetivo de sesión para que los mensajes de seguimiento en ese hilo permanezcan en esa sesión vinculada.

    Flujo básico:

    - Genera con `sessions_spawn` usando `thread: true` (y opcionalmente `mode: "session"` para seguimiento persistente).
    - O vincula manualmente con `/focus <target>`.
    - Usa `/agents` para inspeccionar el estado de la vinculación.
    - Usa `/session idle <duration|off>` y `/session max-age <duration|off>` para controlar el desenfoque automático.
    - Usa `/unfocus` para desvincular el hilo.

    Configuración necesaria:

    - Valores predeterminados globales: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Sobrescrituras de Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Vinculación automática al generar: establece `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Documentación: [Subagentes](/es/tools/subagents), [Discord](/es/channels/discord), [Referencia de configuración](/es/gateway/configuration-reference), [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagente terminó, pero la actualización de finalización fue al lugar equivocado o nunca se publicó. ¿Qué debería comprobar?">
    Primero comprueba la ruta resuelta del solicitante:

    - La entrega de subagente en modo de finalización prefiere cualquier hilo vinculado o ruta de conversación cuando existe.
    - Si el origen de finalización solo lleva un canal, OpenClaw recurre a la ruta almacenada de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa aún pueda tener éxito.
    - Si no existe una ruta vinculada ni una ruta almacenada utilizable, la entrega directa puede fallar y el resultado vuelve a la entrega de sesión en cola en lugar de publicarse inmediatamente en el chat.
    - Los destinos no válidos u obsoletos aún pueden forzar la alternativa de cola o un fallo final de entrega.
    - Si la última respuesta visible del asistente hijo es el token silencioso exacto `NO_REPLY` / `no_reply`, o exactamente `ANNOUNCE_SKIP`, OpenClaw suprime intencionalmente el anuncio en lugar de publicar progreso anterior obsoleto.
    - Si el hijo agotó el tiempo tras solo llamadas de herramientas, el anuncio puede condensar eso en un breve resumen de progreso parcial en lugar de reproducir la salida sin procesar de las herramientas.

    Depuración:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks), [Herramientas de sesión](/es/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o los recordatorios no se disparan. ¿Qué debería comprobar?">
    Cron se ejecuta dentro del proceso del Gateway. Si el Gateway no se ejecuta continuamente,
    los trabajos programados no se ejecutarán.

    Lista de comprobación:

    - Confirma que Cron esté habilitado (`cron.enabled`) y que `OPENCLAW_SKIP_CRON` no esté establecido.
    - Comprueba que el Gateway se ejecute 24/7 (sin suspensión/reinicios).
    - Verifica la configuración de zona horaria para el trabajo (`--tz` frente a la zona horaria del host).

    Depuración:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentación: [Tareas Cron](/es/automation/cron-jobs), [Automatización y tareas](/es/automation).

  </Accordion>

  <Accordion title="Cron se ejecutó, pero no se envió nada al canal. ¿Por qué?">
    Comprueba primero el modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"` significa que no se espera ningún envío de reserva del ejecutor.
    - Un destino de anuncio ausente o no válido (`channel` / `to`) significa que el ejecutor omitió la entrega saliente.
    - Los fallos de autenticación del canal (`unauthorized`, `Forbidden`) significan que el ejecutor intentó entregar, pero las credenciales lo bloquearon.
    - Un resultado aislado silencioso (`NO_REPLY` / `no_reply` solamente) se trata como no entregable intencionadamente, por lo que el ejecutor también suprime la entrega de reserva en cola.

    En trabajos Cron aislados, el agente aún puede enviar directamente con la herramienta
    `message` cuando hay una ruta de chat disponible. `--announce` solo controla la ruta
    de reserva del ejecutor para el texto final que el agente aún no envió.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Trabajos Cron](/es/automation/cron-jobs), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Por qué una ejecución Cron aislada cambió de modelo o reintentó una vez?">
    Normalmente eso es la ruta de cambio de modelo en vivo, no una programación duplicada.

    Cron aislado puede persistir una transferencia de modelo en tiempo de ejecución y reintentar cuando la
    ejecución activa lanza `LiveSessionModelSwitchError`. El reintento conserva el
    proveedor/modelo cambiado y, si el cambio llevaba una nueva anulación de perfil de autenticación, Cron
    también la persiste antes de reintentar.

    Reglas de selección relacionadas:

    - La anulación de modelo del hook de Gmail gana primero cuando aplica.
    - Luego `model` por trabajo.
    - Luego cualquier anulación de modelo almacenada de la sesión Cron.
    - Luego la selección normal de modelo del agente/predeterminado.

    El bucle de reintento está acotado. Tras el intento inicial más 2 reintentos por cambio,
    Cron aborta en lugar de entrar en un bucle infinito.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Trabajos Cron](/es/automation/cron-jobs), [CLI de Cron](/es/cli/cron).

  </Accordion>

  <Accordion title="¿Cómo instalo Skills en Linux?">
    Usa comandos nativos de `openclaw skills` o coloca Skills en tu espacio de trabajo. La interfaz de Skills de macOS no está disponible en Linux.
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
    activo. Instala la CLI `clawhub` separada solo si quieres publicar o
    sincronizar tus propias Skills. Para instalaciones compartidas entre agentes, coloca la Skill en
    `~/.openclaw/skills` y usa `agents.defaults.skills` o
    `agents.list[].skills` si quieres limitar qué agentes pueden verla.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ejecutar tareas según una programación o continuamente en segundo plano?">
    Sí. Usa el programador del Gateway:

    - **Trabajos Cron** para tareas programadas o recurrentes (persisten entre reinicios).
    - **Heartbeat** para comprobaciones periódicas de la "sesión principal".
    - **Trabajos aislados** para agentes autónomos que publican resúmenes o entregan a chats.

    Docs: [Trabajos Cron](/es/automation/cron-jobs), [Automatización y tareas](/es/automation),
    [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title="¿Puedo ejecutar Skills solo para Apple macOS desde Linux?">
    No directamente. Las Skills de macOS están protegidas por `metadata.openclaw.os` más los binarios requeridos, y las Skills solo aparecen en el prompt del sistema cuando son elegibles en el **host del Gateway**. En Linux, las Skills solo para `darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) no se cargarán a menos que anules la restricción.

    Tienes tres patrones compatibles:

    **Opción A - ejecutar el Gateway en un Mac (lo más simple).**
    Ejecuta el Gateway donde existan los binarios de macOS y luego conéctate desde Linux en [modo remoto](#gateway-ports-already-running-and-remote-mode) o mediante Tailscale. Las Skills se cargan normalmente porque el host del Gateway es macOS.

    **Opción B - usar un nodo macOS (sin SSH).**
    Ejecuta el Gateway en Linux, empareja un nodo macOS (aplicación de la barra de menús) y establece **Node Run Commands** en "Always Ask" o "Always Allow" en el Mac. OpenClaw puede tratar las Skills solo para macOS como elegibles cuando los binarios requeridos existen en el nodo. El agente ejecuta esas Skills mediante la herramienta `nodes`. Si eliges "Always Ask", aprobar "Always Allow" en el prompt añade ese comando a la lista de permitidos.

    **Opción C - proxificar binarios de macOS por SSH (avanzado).**
    Mantén el Gateway en Linux, pero haz que los binarios de CLI requeridos se resuelvan a wrappers SSH que se ejecuten en un Mac. Luego anula la Skill para permitir Linux, de modo que siga siendo elegible.

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

    4. Inicia una sesión nueva para que la instantánea de Skills se actualice.

  </Accordion>

  <Accordion title="¿Tienen una integración con Notion o HeyGen?">
    Hoy no está integrada.

    Opciones:

    - **Skill / Plugin personalizado:** lo mejor para acceso fiable a la API (Notion/HeyGen tienen APIs).
    - **Automatización del navegador:** funciona sin código, pero es más lenta y más frágil.

    Si quieres mantener contexto por cliente (flujos de trabajo de agencia), un patrón simple es:

    - Una página de Notion por cliente (contexto + preferencias + trabajo activo).
    - Pedir al agente que obtenga esa página al inicio de una sesión.

    Si quieres una integración nativa, abre una solicitud de funcionalidad o crea una Skill
    dirigida a esas APIs.

    Instalar Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Las instalaciones nativas quedan en el directorio `skills/` del espacio de trabajo activo. Para Skills compartidas entre agentes, colócalas en `~/.openclaw/skills/<name>/SKILL.md`. Si solo algunos agentes deben ver una instalación compartida, configura `agents.defaults.skills` o `agents.list[].skills`. Algunas Skills esperan binarios instalados mediante Homebrew; en Linux eso significa Linuxbrew (consulta la entrada anterior de las preguntas frecuentes de Homebrew para Linux). Consulta [Skills](/es/tools/skills), [configuración de Skills](/es/tools/skills-config) y [ClawHub](/es/tools/clawhub).

  </Accordion>

  <Accordion title="¿Cómo uso mi Chrome existente con sesión iniciada con OpenClaw?">
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

    Esta ruta puede usar el navegador del host local o un nodo de navegador conectado. Si el Gateway se ejecuta en otro lugar, ejecuta un host de nodo en la máquina del navegador o usa CDP remoto.

    Límites actuales de `existing-session` / `user`:

    - las acciones están controladas por refs, no por selectores CSS
    - las subidas requieren `ref` / `inputRef` y actualmente admiten un archivo a la vez
    - `responsebody`, la exportación de PDF, la interceptación de descargas y las acciones por lotes aún necesitan un navegador gestionado o un perfil CDP sin procesar

  </Accordion>
</AccordionGroup>

## Aislamiento y memoria

<AccordionGroup>
  <Accordion title="¿Hay un documento dedicado sobre aislamiento?">
    Sí. Consulta [Aislamiento](/es/gateway/sandboxing). Para la configuración específica de Docker (Gateway completo en Docker o imágenes de aislamiento), consulta [Docker](/es/install/docker).
  </Accordion>

  <Accordion title="Docker parece limitado: ¿cómo habilito todas las funciones?">
    La imagen predeterminada prioriza la seguridad y se ejecuta como el usuario `node`, por lo que no
    incluye paquetes del sistema, Homebrew ni navegadores incluidos. Para una configuración más completa:

    - Persiste `/home/node` con `OPENCLAW_HOME_VOLUME` para que las cachés sobrevivan.
    - Integra dependencias del sistema en la imagen con `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instala navegadores de Playwright mediante la CLI incluida:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Define `PLAYWRIGHT_BROWSERS_PATH` y asegúrate de que la ruta persista.

    Docs: [Docker](/es/install/docker), [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Puedo mantener los MD como personales, pero hacer que los grupos sean públicos/aislados con un agente?">
    Sí, si tu tráfico privado son **MD** y tu tráfico público son **grupos**.

    Usa `agents.defaults.sandbox.mode: "non-main"` para que las sesiones de grupo/canal (claves no principales) se ejecuten en el backend de aislamiento configurado, mientras la sesión principal de MD permanece en el host. Docker es el backend predeterminado si no eliges uno. Luego restringe qué herramientas están disponibles en sesiones aisladas mediante `tools.sandbox.tools`.

    Guía de configuración + ejemplo de configuración: [Grupos: MD personales + grupos públicos](/es/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referencia clave de configuración: [Configuración del Gateway](/es/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="¿Cómo vinculo una carpeta del host al entorno aislado?">
    Define `agents.defaults.sandbox.docker.binds` como `["host:path:mode"]` (p. ej., `"/home/user/src:/src:ro"`). Los binds globales y por agente se combinan; los binds por agente se ignoran cuando `scope: "shared"`. Usa `:ro` para cualquier cosa sensible y recuerda que los binds omiten las barreras del sistema de archivos del entorno aislado.

    OpenClaw valida los orígenes de bind tanto contra la ruta normalizada como contra la ruta canónica resuelta mediante el ancestro existente más profundo. Eso significa que los escapes por padre con symlink siguen fallando en modo cerrado incluso cuando el último segmento de la ruta aún no existe, y las comprobaciones de raíz permitida siguen aplicándose tras la resolución de symlinks.

    Consulta [Aislamiento](/es/gateway/sandboxing#custom-bind-mounts) y [Entorno aislado vs política de herramientas vs elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) para ver ejemplos y notas de seguridad.

  </Accordion>

  <Accordion title="¿Cómo funciona la memoria?">
    La memoria de OpenClaw son simplemente archivos Markdown en el espacio de trabajo del agente:

    - Notas diarias en `memory/YYYY-MM-DD.md`
    - Notas seleccionadas de largo plazo en `MEMORY.md` (solo sesiones principales/privadas)

    OpenClaw también ejecuta un **vaciado de memoria silencioso previo a la compactación** para recordar al modelo
    que escriba notas duraderas antes de la compactación automática. Esto solo se ejecuta cuando el espacio de trabajo
    es escribible (los entornos aislados de solo lectura lo omiten). Consulta [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="La memoria sigue olvidando cosas. ¿Cómo hago que se mantengan?">
    Pide al bot que **escriba el dato en la memoria**. Las notas de largo plazo pertenecen a `MEMORY.md`,
    el contexto de corto plazo va en `memory/YYYY-MM-DD.md`.

    Esta sigue siendo un área que estamos mejorando. Ayuda recordarle al modelo que almacene recuerdos;
    sabrá qué hacer. Si sigue olvidando, verifica que el Gateway use el mismo
    espacio de trabajo en cada ejecución.

    Docs: [Memoria](/es/concepts/memory), [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿La memoria persiste para siempre? ¿Cuáles son los límites?">
    Los archivos de memoria viven en disco y persisten hasta que los elimines. El límite es tu
    almacenamiento, no el modelo. El **contexto de sesión** sigue limitado por la ventana de contexto
    del modelo, por lo que las conversaciones largas pueden compactarse o truncarse. Por eso
    existe la búsqueda de memoria: trae de vuelta al contexto solo las partes relevantes.

    Docs: [Memoria](/es/concepts/memory), [Contexto](/es/concepts/context).

  </Accordion>

  <Accordion title="¿La búsqueda semántica en memoria requiere una clave de API de OpenAI?">
    Solo si usas **embeddings de OpenAI**. Codex OAuth cubre chat/completions y
    **no** concede acceso a embeddings, así que **iniciar sesión con Codex (OAuth o el
    inicio de sesión de Codex CLI)** no ayuda para la búsqueda semántica en memoria. Los embeddings de OpenAI
    aún necesitan una clave de API real (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Si no configuras explícitamente un proveedor, OpenClaw selecciona automáticamente un proveedor cuando
    puede resolver una clave de API (perfiles de autenticación, `models.providers.*.apiKey` o variables de entorno).
    Prefiere OpenAI si se resuelve una clave de OpenAI; de lo contrario, Gemini si se
    resuelve una clave de Gemini, luego Voyage y luego Mistral. Si no hay ninguna clave remota disponible, la búsqueda en
    memoria permanece deshabilitada hasta que la configures. Si tienes una ruta de modelo local
    configurada y presente, OpenClaw
    prefiere `local`. Ollama es compatible cuando configuras explícitamente
    `memorySearch.provider = "ollama"`.

    Si prefieres mantenerte local, configura `memorySearch.provider = "local"` (y opcionalmente
    `memorySearch.fallback = "none"`). Si quieres embeddings de Gemini, configura
    `memorySearch.provider = "gemini"` y proporciona `GEMINI_API_KEY` (o
    `memorySearch.remote.apiKey`). Admitimos modelos de embeddings **OpenAI, Gemini, Voyage, Mistral, Ollama o locales**:
    consulta [Memoria](/es/concepts/memory) para ver los detalles de configuración.

  </Accordion>
</AccordionGroup>

## Dónde viven las cosas en el disco

<AccordionGroup>
  <Accordion title="¿Todos los datos usados con OpenClaw se guardan localmente?">
    No: **el estado de OpenClaw es local**, pero **los servicios externos siguen viendo lo que les envías**.

    - **Local de forma predeterminada:** las sesiones, los archivos de memoria, la configuración y el espacio de trabajo viven en el host del Gateway
      (`~/.openclaw` + tu directorio de espacio de trabajo).
    - **Remoto por necesidad:** los mensajes que envías a proveedores de modelos (Anthropic/OpenAI/etc.) van a
      sus API, y las plataformas de chat (WhatsApp/Telegram/Slack/etc.) almacenan datos de mensajes en sus
      servidores.
    - **Tú controlas la huella:** usar modelos locales mantiene los prompts en tu máquina, pero el tráfico de canales
      sigue pasando por los servidores del canal.

    Relacionado: [Espacio de trabajo del agente](/es/concepts/agent-workspace), [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Dónde almacena OpenClaw sus datos?">
    Todo vive bajo `$OPENCLAW_STATE_DIR` (predeterminado: `~/.openclaw`):

    | Ruta                                                            | Propósito                                                          |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuración principal (JSON5)                                    |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importación OAuth heredada (copiada en perfiles de autenticación en el primer uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfiles de autenticación (OAuth, claves de API y `keyRef`/`tokenRef` opcionales) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Carga útil secreta opcional respaldada por archivo para proveedores SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Archivo de compatibilidad heredado (entradas `api_key` estáticas depuradas) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Estado del proveedor (p. ej., `whatsapp/<accountId>/creds.json`)   |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Estado por agente (agentDir + sesiones)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historial y estado de conversación (por agente)                    |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadatos de sesión (por agente)                                   |

    Ruta heredada de agente único: `~/.openclaw/agent/*` (migrada por `openclaw doctor`).

    Tu **espacio de trabajo** (AGENTS.md, archivos de memoria, Skills, etc.) está separado y se configura mediante `agents.defaults.workspace` (predeterminado: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="¿Dónde deberían vivir AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Estos archivos viven en el **espacio de trabajo del agente**, no en `~/.openclaw`.

    - **Espacio de trabajo (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opcional.
      La raíz en minúsculas `memory.md` es solo entrada de reparación heredada; `openclaw doctor --fix`
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
    espacio de trabajo en cada lanzamiento (y recuerda: el modo remoto usa el espacio de trabajo del **host del Gateway**,
    no el de tu portátil local).

    Consejo: si quieres un comportamiento o una preferencia duraderos, pídele al bot que **lo escriba en
    AGENTS.md o MEMORY.md** en lugar de depender del historial del chat.

    Consulta [Espacio de trabajo del agente](/es/concepts/agent-workspace) y [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="Estrategia de copia de seguridad recomendada">
    Pon tu **espacio de trabajo del agente** en un repositorio git **privado** y haz una copia de seguridad en algún lugar
    privado (por ejemplo, GitHub privado). Esto captura memoria + archivos AGENTS/SOUL/USER
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
    Sí. El espacio de trabajo es el **cwd predeterminado** y el ancla de memoria, no un sandbox rígido.
    Las rutas relativas se resuelven dentro del espacio de trabajo, pero las rutas absolutas pueden acceder a otras
    ubicaciones del host a menos que el sandbox esté habilitado. Si necesitas aislamiento, usa
    [`agents.defaults.sandbox`](/es/gateway/sandboxing) o la configuración de sandbox por agente. Si
    quieres que un repositorio sea el directorio de trabajo predeterminado, apunta el
    `workspace` de ese agente a la raíz del repositorio. El repositorio de OpenClaw es solo código fuente; mantén el
    espacio de trabajo separado a menos que intencionalmente quieras que el agente trabaje dentro de él.

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
    El estado de sesión pertenece al **host del Gateway**. Si estás en modo remoto, el almacén de sesiones que te importa está en la máquina remota, no en tu portátil local. Consulta [Gestión de sesiones](/es/concepts/session).
  </Accordion>
</AccordionGroup>

## Conceptos básicos de configuración

<AccordionGroup>
  <Accordion title="¿Qué formato tiene la configuración? ¿Dónde está?">
    OpenClaw lee una configuración **JSON5** opcional desde `$OPENCLAW_CONFIG_PATH` (predeterminado: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Si falta el archivo, usa valores predeterminados razonablemente seguros (incluido un espacio de trabajo predeterminado de `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Configuré gateway.bind: "lan" (o "tailnet") y ahora nada escucha / la UI dice no autorizado'>
    Los binds que no son de loopback **requieren una ruta de autenticación de Gateway válida**. En la práctica, eso significa:

    - autenticación de secreto compartido: token o contraseña
    - `gateway.auth.mode: "trusted-proxy"` detrás de un proxy inverso correctamente configurado y consciente de la identidad

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

    - `gateway.remote.token` / `.password` **no** habilitan por sí solos la autenticación del Gateway local.
    - Las rutas de llamadas locales pueden usar `gateway.remote.*` como alternativa solo cuando `gateway.auth.*` no está configurado.
    - Para autenticación con contraseña, configura `gateway.auth.mode: "password"` más `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`) en su lugar.
    - Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución falla cerrada (sin enmascaramiento mediante fallback remoto).
    - Las configuraciones de UI de Control con secreto compartido autentican mediante `connect.params.auth.token` o `connect.params.auth.password` (almacenados en la configuración de la app/UI). Los modos con identidad, como Tailscale Serve o `trusted-proxy`, usan encabezados de solicitud en su lugar. Evita poner secretos compartidos en URLs.
    - Con `gateway.auth.mode: "trusted-proxy"`, los proxies inversos de loopback en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito y una entrada de loopback en `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="¿Por qué necesito ahora un token en localhost?">
    OpenClaw aplica autenticación de Gateway de forma predeterminada, incluido loopback. En la ruta predeterminada normal, eso significa autenticación con token: si no hay una ruta de autenticación explícita configurada, el inicio del Gateway se resuelve en modo token y genera uno automáticamente, guardándolo en `gateway.auth.token`, así que **los clientes WS locales deben autenticarse**. Esto bloquea que otros procesos locales llamen al Gateway.

    Si prefieres una ruta de autenticación diferente, puedes elegir explícitamente el modo de contraseña (o, para proxies inversos conscientes de la identidad, `trusted-proxy`). Si **realmente** quieres loopback abierto, configura `gateway.auth.mode: "none"` explícitamente en tu configuración. Doctor puede generarte un token en cualquier momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="¿Tengo que reiniciar después de cambiar la configuración?">
    El Gateway observa la configuración y admite recarga en caliente:

    - `gateway.reload.mode: "hybrid"` (predeterminado): aplica en caliente los cambios seguros, reinicia para los críticos
    - `hot`, `restart`, `off` también son compatibles

  </Accordion>

  <Accordion title="¿Cómo deshabilito las frases divertidas de la CLI?">
    Configura `cli.banner.taglineMode` en la configuración:

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
    - Si no quieres ningún banner, configura la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="¿Cómo habilito la búsqueda web (y web fetch)?">
    `web_fetch` funciona sin una clave de API. `web_search` depende del
    proveedor seleccionado:

    - Los proveedores respaldados por API, como Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity y Tavily, requieren la configuración normal de su clave de API.
    - Ollama Web Search no requiere clave, pero usa tu host Ollama configurado y requiere `ollama signin`.
    - DuckDuckGo no requiere clave, pero es una integración no oficial basada en HTML.
    - SearXNG no requiere clave y puede ser autohospedado; configura `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl`.

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

    La configuración de búsqueda web específica del proveedor ahora vive en `plugins.entries.<plugin>.config.webSearch.*`.
    Las rutas heredadas de proveedor `tools.web.search.*` todavía se cargan temporalmente por compatibilidad, pero no deben usarse para configuraciones nuevas.
    La configuración de respaldo de obtención web de Firecrawl vive en `plugins.entries.firecrawl.config.webFetch.*`.

    Notas:

    - Si usas listas de permitidos, agrega `web_search`/`web_fetch`/`x_search` o `group:web`.
    - `web_fetch` está habilitado de forma predeterminada (a menos que se deshabilite explícitamente).
    - Si se omite `tools.web.fetch.provider`, OpenClaw detecta automáticamente el primer proveedor de respaldo de obtención listo a partir de las credenciales disponibles. Actualmente, el proveedor incluido es Firecrawl.
    - Los daemons leen variables de entorno desde `~/.openclaw/.env` (o el entorno del servicio).

    Documentación: [Herramientas web](/es/tools/web).

  </Accordion>

  <Accordion title="config.apply borró mi configuración. ¿Cómo la recupero y evito que ocurra?">
    `config.apply` reemplaza la **configuración completa**. Si envías un objeto parcial, todo
    lo demás se elimina.

    OpenClaw actual protege contra muchas sobrescrituras accidentales:

    - Las escrituras de configuración propiedad de OpenClaw validan toda la configuración posterior al cambio antes de escribir.
    - Las escrituras inválidas o destructivas propiedad de OpenClaw se rechazan y se guardan como `openclaw.json.rejected.*`.
    - Si una edición directa rompe el arranque o la recarga en caliente, el Gateway restaura la última configuración conocida como válida y guarda el archivo rechazado como `openclaw.json.clobbered.*`.
    - El agente principal recibe una advertencia de arranque después de la recuperación para que no vuelva a escribir a ciegas la configuración incorrecta.

    Recuperación:

    - Revisa `openclaw logs --follow` en busca de `Config auto-restored from last-known-good`, `Config write rejected:`, o `config reload restored last-known-good config`.
    - Inspecciona el `openclaw.json.clobbered.*` o `openclaw.json.rejected.*` más reciente junto a la configuración activa.
    - Conserva la configuración activa restaurada si funciona, luego copia de vuelta solo las claves previstas con `openclaw config set` o `config.patch`.
    - Ejecuta `openclaw config validate` y `openclaw doctor`.
    - Si no tienes una última configuración conocida como válida ni una carga útil rechazada, restaura desde una copia de seguridad, o vuelve a ejecutar `openclaw doctor` y reconfigura canales/modelos.
    - Si esto fue inesperado, informa un bug e incluye tu última configuración conocida o cualquier copia de seguridad.
    - Un agente de programación local a menudo puede reconstruir una configuración funcional a partir de logs o historial.

    Evítalo:

    - Usa `openclaw config set` para cambios pequeños.
    - Usa `openclaw configure` para ediciones interactivas.
    - Usa primero `config.schema.lookup` cuando no tengas certeza sobre una ruta exacta o la forma de un campo; devuelve un nodo de esquema superficial más resúmenes inmediatos de hijos para profundizar.
    - Usa `config.patch` para ediciones RPC parciales; reserva `config.apply` solo para reemplazo de configuración completa.
    - Si estás usando la herramienta `gateway` solo para propietarios desde una ejecución de agente, seguirá rechazando escrituras en `tools.exec.ask` / `tools.exec.security` (incluidos los alias heredados `tools.bash.*` que se normalizan a las mismas rutas exec protegidas).

    Documentación: [Configuración](/es/cli/config), [Configurar](/es/cli/configure), [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Cómo ejecuto un Gateway central con trabajadores especializados entre dispositivos?">
    El patrón común es **un Gateway** (por ejemplo, Raspberry Pi) más **Nodes** y **agentes**:

    - **Gateway (central):** posee canales (Signal/WhatsApp), enrutamiento y sesiones.
    - **Nodes (dispositivos):** Macs/iOS/Android se conectan como periféricos y exponen herramientas locales (`system.run`, `canvas`, `camera`).
    - **Agentes (trabajadores):** cerebros/espacios de trabajo separados para roles especiales (por ejemplo, "operaciones de Hetzner", "Datos personales").
    - **Subagentes:** generan trabajo en segundo plano desde un agente principal cuando quieres paralelismo.
    - **TUI:** conéctate al Gateway y cambia de agentes/sesiones.

    Documentación: [Nodes](/es/nodes), [Acceso remoto](/es/gateway/remote), [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [TUI](/es/web/tui).

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

    El valor predeterminado es `false` (con interfaz visible). Headless tiene más probabilidades de activar comprobaciones anti-bot en algunos sitios. Consulta [Navegador](/es/tools/browser).

    Headless usa el **mismo motor Chromium** y funciona para la mayoría de automatizaciones (formularios, clics, scraping, inicios de sesión). Las diferencias principales:

    - No hay ventana visible del navegador (usa capturas de pantalla si necesitas elementos visuales).
    - Algunos sitios son más estrictos con la automatización en modo headless (CAPTCHAs, anti-bot).
      Por ejemplo, X/Twitter suele bloquear sesiones headless.

  </Accordion>

  <Accordion title="¿Cómo uso Brave para controlar el navegador?">
    Establece `browser.executablePath` en tu binario de Brave (o cualquier navegador basado en Chromium) y reinicia el Gateway.
    Consulta los ejemplos completos de configuración en [Navegador](/es/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways y Nodes remotos

<AccordionGroup>
  <Accordion title="¿Cómo se propagan los comandos entre Telegram, el Gateway y los Nodes?">
    Los mensajes de Telegram los maneja el **Gateway**. El Gateway ejecuta el agente y
    solo entonces llama a los Nodes mediante el **Gateway WebSocket** cuando se necesita una herramienta de Node:

    Telegram → Gateway → Agente → `node.*` → Node → Gateway → Telegram

    Los Nodes no ven tráfico entrante del proveedor; solo reciben llamadas RPC de Node.

  </Accordion>

  <Accordion title="¿Cómo puede mi agente acceder a mi computadora si el Gateway está alojado de forma remota?">
    Respuesta corta: **empareja tu computadora como un Node**. El Gateway se ejecuta en otro lugar, pero puede
    llamar herramientas `node.*` (pantalla, cámara, sistema) en tu máquina local mediante el Gateway WebSocket.

    Configuración típica:

    1. Ejecuta el Gateway en el host siempre encendido (VPS/servidor doméstico).
    2. Pon el host del Gateway y tu computadora en la misma tailnet.
    3. Asegúrate de que el Gateway WS sea accesible (enlace de tailnet o túnel SSH).
    4. Abre la app de macOS localmente y conéctate en modo **Remoto por SSH** (o tailnet directa)
       para que pueda registrarse como Node.
    5. Aprueba el Node en el Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    No se requiere un puente TCP separado; los Nodes se conectan mediante el Gateway WebSocket.

    Recordatorio de seguridad: emparejar un Node de macOS permite `system.run` en esa máquina. Empareja
    solo dispositivos en los que confíes y revisa [Seguridad](/es/gateway/security).

    Documentación: [Nodes](/es/nodes), [Protocolo del Gateway](/es/gateway/protocol), [Modo remoto de macOS](/es/platforms/mac/remote), [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="Tailscale está conectado pero no recibo respuestas. ¿Qué hago ahora?">
    Revisa lo básico:

    - El Gateway está ejecutándose: `openclaw gateway status`
    - Salud del Gateway: `openclaw status`
    - Salud del canal: `openclaw channels status`

    Luego verifica la autenticación y el enrutamiento:

    - Si usas Tailscale Serve, asegúrate de que `gateway.auth.allowTailscale` esté configurado correctamente.
    - Si te conectas mediante un túnel SSH, confirma que el túnel local esté activo y apunte al puerto correcto.
    - Confirma que tus listas de permitidos (DM o grupo) incluyan tu cuenta.

    Documentación: [Tailscale](/es/gateway/tailscale), [Acceso remoto](/es/gateway/remote), [Canales](/es/channels).

  </Accordion>

  <Accordion title="¿Pueden dos instancias de OpenClaw hablar entre sí (local + VPS)?">
    Sí. No hay un puente "bot-a-bot" integrado, pero puedes conectarlas de algunas
    formas confiables:

    **La más simple:** usa un canal de chat normal al que ambos bots puedan acceder (Telegram/Slack/WhatsApp).
    Haz que el Bot A envíe un mensaje al Bot B y luego deja que el Bot B responda como de costumbre.

    **Puente CLI (genérico):** ejecuta un script que llame al otro Gateway con
    `openclaw agent --message ... --deliver`, apuntando a un chat donde el otro bot
    escuche. Si un bot está en un VPS remoto, apunta tu CLI a ese Gateway remoto
    mediante SSH/Tailscale (consulta [Acceso remoto](/es/gateway/remote)).

    Patrón de ejemplo (ejecutado desde una máquina que pueda llegar al Gateway de destino):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Consejo: agrega una protección para que los dos bots no entren en un bucle interminable (solo menciones, listas de permitidos
    de canales o una regla de "no responder a mensajes de bots").

    Documentación: [Acceso remoto](/es/gateway/remote), [CLI de agente](/es/cli/agent), [Envío de agente](/es/tools/agent-send).

  </Accordion>

  <Accordion title="¿Necesito VPS separados para varios agentes?">
    No. Un Gateway puede alojar varios agentes, cada uno con su propio espacio de trabajo, valores predeterminados de modelo
    y enrutamiento. Esa es la configuración normal y es mucho más barata y simple que ejecutar
    un VPS por agente.

    Usa VPS separados solo cuando necesites aislamiento fuerte (límites de seguridad) o configuraciones
    muy diferentes que no quieras compartir. De lo contrario, mantén un Gateway y
    usa varios agentes o subagentes.

  </Accordion>

  <Accordion title="¿Hay algún beneficio en usar un Node en mi laptop personal en lugar de SSH desde un VPS?">
    Sí: los Nodes son la forma de primera clase para llegar a tu laptop desde un Gateway remoto, y
    habilitan más que acceso shell. El Gateway se ejecuta en macOS/Linux (Windows mediante WSL2) y es
    ligero (un VPS pequeño o una máquina tipo Raspberry Pi está bien; 4 GB de RAM son suficientes), por lo que una configuración común
    es un host siempre encendido más tu laptop como Node.

    - **No se requiere SSH entrante.** Los Nodes se conectan hacia el Gateway WebSocket y usan emparejamiento de dispositivos.
    - **Controles de ejecución más seguros.** `system.run` está regulado por listas de permitidos/aprobaciones de Node en esa laptop.
    - **Más herramientas de dispositivo.** Los Nodes exponen `canvas`, `camera` y `screen` además de `system.run`.
    - **Automatización local del navegador.** Mantén el Gateway en un VPS, pero ejecuta Chrome localmente mediante un host de Node en la laptop, o conéctate a Chrome local en el host mediante Chrome MCP.

    SSH está bien para acceso shell ad hoc, pero los Nodes son más simples para flujos de trabajo continuos de agentes y
    automatización de dispositivos.

    Documentación: [Nodes](/es/nodes), [CLI de Nodes](/es/cli/nodes), [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Los Nodes ejecutan un servicio de Gateway?">
    No. Solo debe ejecutarse **un Gateway** por host, a menos que ejecutes intencionalmente perfiles aislados (consulta [Múltiples Gateways](/es/gateway/multiple-gateways)). Los Nodes son periféricos que se conectan
    al Gateway (Nodes iOS/Android, o "modo Node" de macOS en la app de la barra de menús). Para hosts de Node
    sin interfaz y control CLI, consulta [CLI de host de Node](/es/cli/node).

    Se requiere un reinicio completo para cambios en `gateway`, `discovery` y `canvasHost`.

  </Accordion>

  <Accordion title="¿Hay una forma API / RPC de aplicar configuración?">
    Sí.

    - `config.schema.lookup`: inspecciona un subárbol de configuración con su nodo de esquema superficial, sugerencia de UI coincidente y resúmenes inmediatos de hijos antes de escribir
    - `config.get`: obtiene la instantánea actual + hash
    - `config.patch`: actualización parcial segura (preferida para la mayoría de ediciones RPC); recarga en caliente cuando es posible y reinicia cuando se requiere
    - `config.apply`: valida + reemplaza la configuración completa; recarga en caliente cuando es posible y reinicia cuando se requiere
    - La herramienta de runtime `gateway` solo para propietarios aún se niega a reescribir `tools.exec.ask` / `tools.exec.security`; los alias heredados `tools.bash.*` se normalizan a las mismas rutas exec protegidas

  </Accordion>

  <Accordion title="Configuración mínima razonable para una primera instalación">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Esto establece tu espacio de trabajo y restringe quién puede activar el bot.

  </Accordion>

  <Accordion title="¿Cómo configuro Tailscale en un VPS y me conecto desde mi Mac?">
    Pasos mínimos:

    1. **Instalar + iniciar sesión en el VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Instalar + iniciar sesión en tu Mac**
       - Usa la aplicación Tailscale e inicia sesión en la misma tailnet.
    3. **Activar MagicDNS (recomendado)**
       - En la consola de administración de Tailscale, activa MagicDNS para que el VPS tenga un nombre estable.
    4. **Usar el nombre de host de la tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - WS del Gateway: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Si quieres la interfaz de control sin SSH, usa Tailscale Serve en el VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Esto mantiene el gateway enlazado a loopback y expone HTTPS mediante Tailscale. Consulta [Tailscale](/es/gateway/tailscale).

  </Accordion>

  <Accordion title="¿Cómo conecto un Node de Mac a un Gateway remoto (Tailscale Serve)?">
    Serve expone la **interfaz de control del Gateway + WS**. Los Nodes se conectan mediante el mismo endpoint WS del Gateway.

    Configuración recomendada:

    1. **Asegúrate de que el VPS + Mac estén en la misma tailnet**.
    2. **Usa la aplicación macOS en modo remoto** (el destino SSH puede ser el nombre de host de la tailnet).
       La aplicación tunelizará el puerto del Gateway y se conectará como Node.
    3. **Aprueba el Node** en el gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentación: [protocolo del Gateway](/es/gateway/protocol), [descubrimiento](/es/gateway/discovery), [modo remoto de macOS](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Debo instalarlo en una segunda laptop o solo añadir un Node?">
    Si solo necesitas **herramientas locales** (pantalla/cámara/exec) en la segunda laptop, añádela como
    **Node**. Eso mantiene un único Gateway y evita configuración duplicada. Las herramientas locales de Node
    actualmente solo están disponibles en macOS, pero planeamos extenderlas a otros sistemas operativos.

    Instala un segundo Gateway solo cuando necesites **aislamiento estricto** o dos bots completamente separados.

    Documentación: [Nodes](/es/nodes), [CLI de Nodes](/es/cli/nodes), [Múltiples gateways](/es/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables de entorno y carga de .env

<AccordionGroup>
  <Accordion title="¿Cómo carga OpenClaw las variables de entorno?">
    OpenClaw lee variables de entorno del proceso padre (shell, launchd/systemd, CI, etc.) y además carga:

    - `.env` desde el directorio de trabajo actual
    - una `.env` global de reserva desde `~/.openclaw/.env` (también conocida como `$OPENCLAW_STATE_DIR/.env`)

    Ningún archivo `.env` sobrescribe variables de entorno existentes.

    También puedes definir variables de entorno en línea en la configuración (se aplican solo si faltan en el entorno del proceso):

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

  <Accordion title="Inicié el Gateway mediante el servicio y mis variables de entorno desaparecieron. ¿Y ahora qué?">
    Dos soluciones comunes:

    1. Pon las claves faltantes en `~/.openclaw/.env` para que se recojan incluso cuando el servicio no herede el entorno de tu shell.
    2. Activa la importación del shell (comodidad opcional):

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

    Esto ejecuta tu shell de inicio de sesión e importa solo las claves esperadas que falten (nunca sobrescribe). Equivalentes de variables de entorno:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Configuré COPILOT_GITHUB_TOKEN, pero el estado de los modelos muestra "Shell env: off." ¿Por qué?'>
    `openclaw models status` informa si la **importación del entorno del shell** está activada. "Shell env: off"
    **no** significa que falten tus variables de entorno; solo significa que OpenClaw no cargará
    tu shell de inicio de sesión automáticamente.

    Si el Gateway se ejecuta como servicio (launchd/systemd), no heredará tu entorno de shell.
    Corrígelo de una de estas maneras:

    1. Pon el token en `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. O activa la importación del shell (`env.shellEnv.enabled: true`).
    3. O añádelo al bloque `env` de tu configuración (se aplica solo si falta).

    Después reinicia el gateway y vuelve a comprobarlo:

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
    Envía `/new` o `/reset` como mensaje independiente. Consulta [gestión de sesiones](/es/concepts/session).
  </Accordion>

  <Accordion title="¿Las sesiones se reinician automáticamente si nunca envío /new?">
    Las sesiones pueden expirar después de `session.idleMinutes`, pero esto está **desactivado de forma predeterminada** (valor predeterminado **0**).
    Configúralo con un valor positivo para activar la expiración por inactividad. Cuando está activada, el **siguiente**
    mensaje después del periodo de inactividad inicia un id. de sesión nuevo para esa clave de chat.
    Esto no elimina las transcripciones; solo inicia una sesión nueva.

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
    y varios agentes trabajadores con sus propios espacios de trabajo y modelos.

    Dicho esto, es mejor verlo como un **experimento divertido**. Consume muchos tokens y a menudo
    es menos eficiente que usar un bot con sesiones separadas. El modelo típico que
    imaginamos es un bot con el que hablas, con distintas sesiones para trabajo paralelo. Ese
    bot también puede generar subagentes cuando sea necesario.

    Documentación: [enrutamiento multiagente](/es/concepts/multi-agent), [subagentes](/es/tools/subagents), [CLI de agentes](/es/cli/agents).

  </Accordion>

  <Accordion title="¿Por qué se truncó el contexto a mitad de una tarea? ¿Cómo lo evito?">
    El contexto de sesión está limitado por la ventana del modelo. Los chats largos, las salidas extensas de herramientas o muchos
    archivos pueden activar Compaction o truncamiento.

    Lo que ayuda:

    - Pídele al bot que resuma el estado actual y lo escriba en un archivo.
    - Usa `/compact` antes de tareas largas y `/new` al cambiar de tema.
    - Mantén el contexto importante en el espacio de trabajo y pídele al bot que lo vuelva a leer.
    - Usa subagentes para trabajo largo o paralelo para que el chat principal se mantenga más pequeño.
    - Elige un modelo con una ventana de contexto mayor si esto ocurre a menudo.

  </Accordion>

  <Accordion title="¿Cómo restablezco OpenClaw por completo pero lo mantengo instalado?">
    Usa el comando de restablecimiento:

    ```bash
    openclaw reset
    ```

    Restablecimiento completo no interactivo:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Luego ejecuta la configuración de nuevo:

    ```bash
    openclaw onboard --install-daemon
    ```

    Notas:

    - Onboarding también ofrece **Restablecer** si detecta una configuración existente. Consulta [Onboarding (CLI)](/es/start/wizard).
    - Si usaste perfiles (`--profile` / `OPENCLAW_PROFILE`), restablece cada directorio de estado (los valores predeterminados son `~/.openclaw-<profile>`).
    - Restablecimiento de desarrollo: `openclaw gateway --dev --reset` (solo para desarrollo; borra la configuración de desarrollo + credenciales + sesiones + espacio de trabajo).

  </Accordion>

  <Accordion title='Recibo errores de "context too large"; ¿cómo restablezco o compacto?'>
    Usa una de estas opciones:

    - **Compactar** (mantiene la conversación, pero resume los turnos antiguos):

      ```
      /compact
      ```

      o `/compact <instructions>` para guiar el resumen.

    - **Restablecer** (id. de sesión nuevo para la misma clave de chat):

      ```
      /new
      /reset
      ```

    Si sigue ocurriendo:

    - Activa o ajusta la **poda de sesiones** (`agents.defaults.contextPruning`) para recortar salidas antiguas de herramientas.
    - Usa un modelo con una ventana de contexto mayor.

    Documentación: [Compaction](/es/concepts/compaction), [poda de sesiones](/es/concepts/session-pruning), [gestión de sesiones](/es/concepts/session).

  </Accordion>

  <Accordion title='¿Por qué veo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Este es un error de validación del proveedor: el modelo emitió un bloque `tool_use` sin el
    `input` requerido. Normalmente significa que el historial de la sesión está obsoleto o corrupto (a menudo después de hilos largos
    o de un cambio de herramienta/esquema).

    Solución: inicia una sesión nueva con `/new` (mensaje independiente).

  </Accordion>

  <Accordion title="¿Por qué recibo mensajes de Heartbeat cada 30 minutos?">
    Los Heartbeats se ejecutan cada **30m** de forma predeterminada (**1h** al usar autenticación OAuth). Ajústalos o desactívalos:

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

    Si `HEARTBEAT.md` existe pero está efectivamente vacío (solo líneas en blanco y encabezados
    de markdown como `# Heading`), OpenClaw omite la ejecución de heartbeat para ahorrar llamadas a la API.
    Si el archivo falta, el heartbeat aún se ejecuta y el modelo decide qué hacer.

    Las anulaciones por agente usan `agents.list[].heartbeat`. Documentación: [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title='¿Necesito añadir una "cuenta de bot" a un grupo de WhatsApp?'>
    No. OpenClaw se ejecuta en **tu propia cuenta**, así que si estás en el grupo, OpenClaw puede verlo.
    De forma predeterminada, las respuestas en grupos se bloquean hasta que permitas remitentes (`groupPolicy: "allowlist"`).

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

    Opción 2 (si ya está configurado/en la lista de permitidos): lista los grupos desde la configuración:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentación: [WhatsApp](/es/channels/whatsapp), [directorio](/es/cli/directory), [logs](/es/cli/logs).

  </Accordion>

  <Accordion title="¿Por qué OpenClaw no responde en un grupo?">
    Dos causas comunes:

    - El control por menciones está activado (valor predeterminado). Debes @mencionar al bot (o coincidir con `mentionPatterns`).
    - Configuraste `channels.whatsapp.groups` sin `"*"` y el grupo no está en la lista de permitidos.

    Consulta [grupos](/es/channels/groups) y [mensajes de grupo](/es/channels/group-messages).

  </Accordion>

  <Accordion title="¿Los grupos/hilos comparten contexto con los mensajes directos?">
    Los chats directos se condensan en la sesión principal de forma predeterminada. Los grupos/canales tienen sus propias claves de sesión, y los temas de Telegram / hilos de Discord son sesiones separadas. Consulta [grupos](/es/channels/groups) y [mensajes de grupo](/es/channels/group-messages).
  </Accordion>

  <Accordion title="¿Cuántos espacios de trabajo y agentes puedo crear?">
    No hay límites estrictos. Decenas (incluso cientos) están bien, pero ten en cuenta:

    - **Crecimiento del disco:** las sesiones + transcripciones viven en `~/.openclaw/agents/<agentId>/sessions/`.
    - **Costo de tokens:** más agentes significa más uso concurrente del modelo.
    - **Sobrecarga operativa:** perfiles de autenticación, espacios de trabajo y enrutamiento de canales por agente.

    Consejos:

    - Mantén un espacio de trabajo **activo** por agente (`agents.defaults.workspace`).
    - Poda sesiones antiguas (elimina JSONL o entradas de almacenamiento) si el disco crece.
    - Usa `openclaw doctor` para detectar espacios de trabajo sueltos y discrepancias de perfiles.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios bots o chats al mismo tiempo (Slack), y cómo debo configurarlo?">
    Sí. Usa **Enrutamiento multiagente** para ejecutar varios agentes aislados y enrutar los mensajes entrantes por
    canal/cuenta/par. Slack es compatible como canal y se puede vincular a agentes específicos.

    El acceso al navegador es potente, pero no permite "hacer cualquier cosa que pueda hacer un humano": los sistemas anti-bot, los CAPTCHAs y la MFA pueden
    seguir bloqueando la automatización. Para el control de navegador más fiable, usa Chrome MCP local en el host,
    o usa CDP en la máquina que realmente ejecuta el navegador.

    Configuración recomendada:

    - Host de Gateway siempre activo (VPS/Mac mini).
    - Un agente por rol (vinculaciones).
    - Canal(es) de Slack vinculados a esos agentes.
    - Navegador local mediante Chrome MCP o un nodo cuando sea necesario.

    Documentación: [Enrutamiento multiagente](/es/concepts/multi-agent), [Slack](/es/channels/slack),
    [Navegador](/es/tools/browser), [Nodos](/es/nodes).

  </Accordion>
</AccordionGroup>

## Modelos, conmutación por error y perfiles de autenticación

Las preguntas y respuestas sobre modelos — valores predeterminados, selección, alias, cambio, conmutación por error, perfiles de autenticación —
están en las [preguntas frecuentes sobre modelos](/es/help/faq-models).

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
    Porque "running" es la vista del **supervisor** (launchd/systemd/schtasks). La prueba de conectividad es la CLI conectándose realmente al WebSocket del gateway.

    Usa `openclaw gateway status` y confía en estas líneas:

    - `Probe target:` (la URL que la prueba usó realmente)
    - `Listening:` (lo que realmente está vinculado en el puerto)
    - `Last gateway error:` (causa raíz común cuando el proceso está vivo pero el puerto no está escuchando)

  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status muestra "Config (cli)" y "Config (service)" diferentes?'>
    Estás editando un archivo de configuración mientras el servicio ejecuta otro (a menudo una discrepancia de `--profile` / `OPENCLAW_STATE_DIR`).

    Solución:

    ```bash
    openclaw gateway install --force
    ```

    Ejecútalo desde el mismo `--profile` / entorno que quieres que use el servicio.

  </Accordion>

  <Accordion title='¿Qué significa "another gateway instance is already listening"?'>
    OpenClaw impone un bloqueo de ejecución vinculando el listener de WebSocket inmediatamente al iniciar (predeterminado `ws://127.0.0.1:18789`). Si la vinculación falla con `EADDRINUSE`, lanza `GatewayLockError`, que indica que otra instancia ya está escuchando.

    Solución: detén la otra instancia, libera el puerto o ejecuta con `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="¿Cómo ejecuto OpenClaw en modo remoto (el cliente se conecta a un Gateway en otro lugar)?">
    Define `gateway.mode: "remote"` y apunta a una URL de WebSocket remota, opcionalmente con credenciales remotas de secreto compartido:

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
    - La app de macOS vigila el archivo de configuración y cambia de modo en vivo cuando estos valores cambian.
    - `gateway.remote.token` / `.password` son solo credenciales remotas del lado del cliente; no habilitan por sí solas la autenticación del gateway local.

  </Accordion>

  <Accordion title='La Control UI dice "unauthorized" (o sigue reconectándose). ¿Qué hago ahora?'>
    La ruta de autenticación de tu gateway y el método de autenticación de la UI no coinciden.

    Datos (desde el código):

    - La Control UI conserva el token en `sessionStorage` para la sesión actual de la pestaña del navegador y la URL de gateway seleccionada, por lo que las actualizaciones en la misma pestaña siguen funcionando sin restaurar la persistencia de tokens de larga duración en localStorage.
    - En `AUTH_TOKEN_MISMATCH`, los clientes de confianza pueden intentar un único reintento acotado con un token de dispositivo en caché cuando el gateway devuelve indicaciones de reintento (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ese reintento con token en caché ahora reutiliza los alcances aprobados en caché almacenados con el token de dispositivo. Los llamadores con `deviceToken` explícito / `scopes` explícitos siguen manteniendo el conjunto de alcances solicitado en lugar de heredar los alcances en caché.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token de bootstrap.
    - Las comprobaciones de alcance del token de bootstrap tienen prefijo de rol. La lista de permitidos integrada del operador de bootstrap solo satisface solicitudes de operador; los nodos u otros roles que no sean de operador siguen necesitando alcances bajo su propio prefijo de rol.

    Solución:

    - Más rápido: `openclaw dashboard` (imprime y copia la URL del panel, intenta abrirla; muestra una pista de SSH si no hay interfaz gráfica).
    - Si todavía no tienes un token: `openclaw doctor --generate-gateway-token`.
    - Si es remoto, primero crea un túnel: `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`.
    - Modo de secreto compartido: define `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, y luego pega el secreto correspondiente en la configuración de Control UI.
    - Modo Tailscale Serve: asegúrate de que `gateway.auth.allowTailscale` esté habilitado y de que estés abriendo la URL de Serve, no una URL de loopback/tailnet sin procesar que omita los encabezados de identidad de Tailscale.
    - Modo de proxy de confianza: asegúrate de entrar a través del proxy configurado con reconocimiento de identidad, no mediante una URL de gateway sin procesar. Los proxies loopback del mismo host también necesitan `gateway.auth.trustedProxy.allowLoopback = true`.
    - Si la discrepancia persiste después del único reintento, rota/vuelve a aprobar el token de dispositivo emparejado:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Si esa llamada de rotación dice que fue denegada, comprueba dos cosas:
      - las sesiones de dispositivos emparejados solo pueden rotar su **propio** dispositivo salvo que también tengan `operator.admin`
      - los valores explícitos de `--scope` no pueden superar los alcances de operador actuales del llamador
    - ¿Sigues bloqueado? Ejecuta `openclaw status --all` y sigue [Solución de problemas](/es/gateway/troubleshooting). Consulta [Panel](/es/web/dashboard) para obtener detalles de autenticación.

  </Accordion>

  <Accordion title="Configuré gateway.bind tailnet pero no puede vincularse y nada escucha">
    La vinculación `tailnet` elige una IP de Tailscale de tus interfaces de red (100.64.0.0/10). Si la máquina no está en Tailscale (o la interfaz está caída), no hay nada a lo que vincularse.

    Solución:

    - Inicia Tailscale en ese host (para que tenga una dirección 100.x), o
    - Cambia a `gateway.bind: "loopback"` / `"lan"`.

    Nota: `tailnet` es explícito. `auto` prefiere loopback; usa `gateway.bind: "tailnet"` cuando quieras una vinculación solo de tailnet.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios Gateways en el mismo host?">
    Normalmente no: un Gateway puede ejecutar varios canales de mensajería y agentes. Usa varios Gateways solo cuando necesites redundancia (por ejemplo: bot de rescate) o aislamiento estricto.

    Sí, pero debes aislar:

    - `OPENCLAW_CONFIG_PATH` (configuración por instancia)
    - `OPENCLAW_STATE_DIR` (estado por instancia)
    - `agents.defaults.workspace` (aislamiento del espacio de trabajo)
    - `gateway.port` (puertos únicos)

    Configuración rápida (recomendada):

    - Usa `openclaw --profile <name> ...` por instancia (crea automáticamente `~/.openclaw-<name>`).
    - Define un `gateway.port` único en la configuración de cada perfil (o pasa `--port` para ejecuciones manuales).
    - Instala un servicio por perfil: `openclaw --profile <name> gateway install`.

    Los perfiles también añaden sufijos a los nombres de servicio (`ai.openclaw.<profile>`; heredados `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guía completa: [Múltiples gateways](/es/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='¿Qué significa "invalid handshake" / código 1008?'>
    El Gateway es un **servidor WebSocket**, y espera que el primerísimo mensaje
    sea un marco `connect`. Si recibe cualquier otra cosa, cierra la conexión
    con **código 1008** (infracción de política).

    Causas comunes:

    - Abriste la URL **HTTP** en un navegador (`http://...`) en lugar de un cliente WS.
    - Usaste el puerto o la ruta incorrectos.
    - Un proxy o túnel eliminó encabezados de autenticación o envió una solicitud que no era del Gateway.

    Soluciones rápidas:

    1. Usa la URL WS: `ws://<host>:18789` (o `wss://...` si es HTTPS).
    2. No abras el puerto WS en una pestaña normal del navegador.
    3. Si la autenticación está activada, incluye el token/contraseña en el marco `connect`.

    Si usas la CLI o TUI, la URL debería verse así:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Detalles del protocolo: [Protocolo del Gateway](/es/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Registro y depuración

<AccordionGroup>
  <Accordion title="¿Dónde están los registros?">
    Registros de archivo (estructurados):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Puedes definir una ruta estable mediante `logging.file`. El nivel de registro de archivo se controla con `logging.level`. La verbosidad de consola se controla con `--verbose` y `logging.consoleLevel`.

    Seguimiento rápido de registros:

    ```bash
    openclaw logs --follow
    ```

    Registros de servicio/supervisor (cuando el gateway se ejecuta mediante launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` y `gateway.err.log` (predeterminado: `~/.openclaw/logs/...`; los perfiles usan `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Consulta [Solución de problemas](/es/gateway/troubleshooting) para más información.

  </Accordion>

  <Accordion title="¿Cómo inicio/detengo/reinicio el servicio del Gateway?">
    Usa los ayudantes del gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Si ejecutas el gateway manualmente, `openclaw gateway --force` puede recuperar el puerto. Consulta [Gateway](/es/gateway).

  </Accordion>

  <Accordion title="Cerré mi terminal en Windows: ¿cómo reinicio OpenClaw?">
    Hay **dos modos de instalación en Windows**:

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

    Documentación: [Windows (WSL2)](/es/platforms/windows), [Guía operativa del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="El Gateway está activo pero las respuestas nunca llegan. ¿Qué debo revisar?">
    Empieza con una comprobación rápida de estado:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causas comunes:

    - La autenticación del modelo no está cargada en el **host del gateway** (comprueba `models status`).
    - El emparejamiento/lista de permitidos del canal bloquea las respuestas (comprueba la configuración del canal y los registros).
    - WebChat/Dashboard está abierto sin el token correcto.

    Si estás en remoto, confirma que la conexión de túnel/Tailscale esté activa y que el
    WebSocket del Gateway sea accesible.

    Documentación: [Canales](/es/channels), [Solución de problemas](/es/gateway/troubleshooting), [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title='"Desconectado del gateway: sin motivo" - ¿qué hago ahora?'>
    Esto suele significar que la UI perdió la conexión WebSocket. Comprueba:

    1. ¿El Gateway está en ejecución? `openclaw gateway status`
    2. ¿El Gateway está saludable? `openclaw status`
    3. ¿La UI tiene el token correcto? `openclaw dashboard`
    4. Si es remoto, ¿el enlace de túnel/Tailscale está activo?

    Luego sigue los registros:

    ```bash
    openclaw logs --follow
    ```

    Docs: [Panel de control](/es/web/dashboard), [Acceso remoto](/es/gateway/remote), [Solución de problemas](/es/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands falla. ¿Qué debo comprobar?">
    Empieza con los registros y el estado del canal:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Luego compara el error:

    - `BOT_COMMANDS_TOO_MUCH`: el menú de Telegram tiene demasiadas entradas. OpenClaw ya recorta hasta el límite de Telegram y reintenta con menos comandos, pero aún se deben descartar algunas entradas del menú. Reduce los comandos de plugin/skill/personalizados, o deshabilita `channels.telegram.commands.native` si no necesitas el menú.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, o errores de red similares: si estás en un VPS o detrás de un proxy, confirma que HTTPS saliente esté permitido y que DNS funcione para `api.telegram.org`.

    Si el Gateway es remoto, asegúrate de estar mirando los registros en el host del Gateway.

    Docs: [Telegram](/es/channels/telegram), [Solución de problemas de canales](/es/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI no muestra ninguna salida. ¿Qué debo comprobar?">
    Primero confirma que el Gateway sea accesible y que el agente pueda ejecutarse:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    En la TUI, usa `/status` para ver el estado actual. Si esperas respuestas en un canal
    de chat, asegúrate de que la entrega esté habilitada (`/deliver on`).

    Docs: [TUI](/es/web/tui), [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo detengo por completo y luego inicio el Gateway?">
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

    Docs: [Manual operativo del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart frente a openclaw gateway">
    - `openclaw gateway restart`: reinicia el **servicio en segundo plano** (launchd/systemd).
    - `openclaw gateway`: ejecuta el gateway **en primer plano** para esta sesión de terminal.

    Si instalaste el servicio, usa los comandos de gateway. Usa `openclaw gateway` cuando
    quieras una ejecución puntual en primer plano.

  </Accordion>

  <Accordion title="La forma más rápida de obtener más detalles cuando algo falla">
    Inicia el Gateway con `--verbose` para obtener más detalle en la consola. Luego inspecciona el archivo de registro para ver errores de autenticación de canales, enrutamiento de modelos y RPC.
  </Accordion>
</AccordionGroup>

## Medios y archivos adjuntos

<AccordionGroup>
  <Accordion title="Mi skill generó una imagen/PDF, pero no se envió nada">
    Los adjuntos salientes del agente deben incluir una línea `MEDIA:<path-or-url>` (en su propia línea). Consulta [Configuración del asistente de OpenClaw](/es/start/openclaw) y [Envío del agente](/es/tools/agent-send).

    Envío por CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Comprueba también:

    - El canal de destino admite medios salientes y no está bloqueado por listas de permitidos.
    - El archivo está dentro de los límites de tamaño del proveedor (las imágenes se redimensionan a un máximo de 2048px).
    - `tools.fs.workspaceOnly=true` limita los envíos de rutas locales al espacio de trabajo, temp/media-store y archivos validados por sandbox.
    - `tools.fs.workspaceOnly=false` permite que `MEDIA:` envíe archivos locales del host que el agente ya puede leer, pero solo para medios y tipos de documentos seguros (imágenes, audio, video, PDF y documentos de Office). Los archivos de texto plano y con apariencia de secretos siguen bloqueados.

    Consulta [Imágenes](/es/nodes/images).

  </Accordion>
</AccordionGroup>

## Seguridad y control de acceso

<AccordionGroup>
  <Accordion title="¿Es seguro exponer OpenClaw a DM entrantes?">
    Trata los DM entrantes como entrada no confiable. Los valores predeterminados están diseñados para reducir el riesgo:

    - El comportamiento predeterminado en canales compatibles con DM es **emparejamiento**:
      - Los remitentes desconocidos reciben un código de emparejamiento; el bot no procesa su mensaje.
      - Aprueba con: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Las solicitudes pendientes tienen un límite de **3 por canal**; revisa `openclaw pairing list --channel <channel> [--account <id>]` si no llegó un código.
    - Abrir DM públicamente requiere una suscripción explícita (`dmPolicy: "open"` y lista de permitidos `"*"`).

    Ejecuta `openclaw doctor` para mostrar políticas de DM riesgosas.

  </Accordion>

  <Accordion title="¿La inyección de prompts solo es una preocupación para bots públicos?">
    No. La inyección de prompts tiene que ver con **contenido no confiable**, no solo con quién puede enviar DM al bot.
    Si tu asistente lee contenido externo (búsqueda/obtención web, páginas del navegador, correos electrónicos,
    docs, adjuntos, registros pegados), ese contenido puede incluir instrucciones que intenten
    secuestrar el modelo. Esto puede ocurrir incluso si **tú eres el único remitente**.

    El mayor riesgo aparece cuando las herramientas están habilitadas: se puede engañar al modelo para que
    exfiltre contexto o llame herramientas en tu nombre. Reduce el radio de impacto de esta forma:

    - usar un agente "lector" de solo lectura o con herramientas deshabilitadas para resumir contenido no confiable
    - mantener `web_search` / `web_fetch` / `browser` desactivados para agentes con herramientas habilitadas
    - tratar también el texto decodificado de archivos/documentos como no confiable: OpenResponses
      `input_file` y la extracción de adjuntos multimedia envuelven el texto extraído en
      marcadores explícitos de límite de contenido externo en lugar de pasar texto de archivo sin procesar
    - usar sandbox y listas de permitidos estrictas para herramientas

    Detalles: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Mi bot debería tener su propio correo electrónico, cuenta de GitHub o número de teléfono?">
    Sí, para la mayoría de las configuraciones. Aislar el bot con cuentas y números de teléfono separados
    reduce el radio de impacto si algo sale mal. Esto también facilita rotar
    credenciales o revocar acceso sin afectar tus cuentas personales.

    Empieza de forma pequeña. Da acceso solo a las herramientas y cuentas que realmente necesitas, y amplíalo
    más adelante si hace falta.

    Docs: [Seguridad](/es/gateway/security), [Emparejamiento](/es/channels/pairing).

  </Accordion>

  <Accordion title="¿Puedo darle autonomía sobre mis mensajes de texto y es seguro?">
    **No** recomendamos autonomía completa sobre tus mensajes personales. El patrón más seguro es:

    - Mantén los DM en **modo de emparejamiento** o con una lista de permitidos estricta.
    - Usa un **número o cuenta separados** si quieres que envíe mensajes en tu nombre.
    - Deja que redacte y luego **aprueba antes de enviar**.

    Si quieres experimentar, hazlo en una cuenta dedicada y mantenla aislada. Consulta
    [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Puedo usar modelos más baratos para tareas de asistente personal?">
    Sí, **si** el agente solo es de chat y la entrada es confiable. Los niveles más pequeños son
    más susceptibles al secuestro de instrucciones, así que evítalos para agentes con herramientas habilitadas
    o cuando lean contenido no confiable. Si debes usar un modelo más pequeño, restringe las
    herramientas y ejecútalo dentro de un sandbox. Consulta [Seguridad](/es/gateway/security).
  </Accordion>

  <Accordion title="Ejecuté /start en Telegram pero no recibí un código de emparejamiento">
    Los códigos de emparejamiento se envían **solo** cuando un remitente desconocido envía un mensaje al bot y
    `dmPolicy: "pairing"` está habilitado. `/start` por sí solo no genera un código.

    Comprueba las solicitudes pendientes:

    ```bash
    openclaw pairing list telegram
    ```

    Si quieres acceso inmediato, añade tu id de remitente a la lista de permitidos o configura `dmPolicy: "open"`
    para esa cuenta.

  </Accordion>

  <Accordion title="WhatsApp: ¿enviará mensajes a mis contactos? ¿Cómo funciona el emparejamiento?">
    No. La política predeterminada de DM de WhatsApp es **emparejamiento**. Los remitentes desconocidos solo reciben un código de emparejamiento y su mensaje **no se procesa**. OpenClaw solo responde a chats que recibe o a envíos explícitos que activas.

    Aprueba el emparejamiento con:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Lista las solicitudes pendientes:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt de número de teléfono del asistente de configuración: se usa para configurar tu **lista de permitidos/propietario** de modo que tus propios DM estén permitidos. No se usa para envíos automáticos. Si lo ejecutas en tu número personal de WhatsApp, usa ese número y habilita `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandos de chat, cancelación de tareas y "no se detiene"

<AccordionGroup>
  <Accordion title="¿Cómo evito que los mensajes internos del sistema aparezcan en el chat?">
    La mayoría de los mensajes internos o de herramientas solo aparecen cuando **verbose**, **trace** o **reasoning** están habilitados
    para esa sesión.

    Corrígelo en el chat donde lo ves:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Si sigue siendo ruidoso, revisa la configuración de la sesión en la Control UI y configura verbose
    como **inherit**. Confirma también que no estés usando un perfil de bot con `verboseDefault` configurado
    como `on` en la configuración.

    Docs: [Pensamiento y verbose](/es/tools/thinking), [Seguridad](/es/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="¿Cómo detengo/cancelo una tarea en ejecución?">
    Envía cualquiera de estos **como mensaje independiente** (sin slash):

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

    Estos son disparadores de cancelación (no comandos slash).

    Para procesos en segundo plano (desde la herramienta exec), puedes pedir al agente que ejecute:

    ```
    process action:kill sessionId:XXX
    ```

    Resumen de comandos slash: consulta [Comandos slash](/es/tools/slash-commands).

    La mayoría de los comandos deben enviarse como un mensaje **independiente** que empiece con `/`, pero algunos accesos directos (como `/status`) también funcionan en línea para remitentes en la lista de permitidos.

  </Accordion>

  <Accordion title='¿Cómo envío un mensaje de Discord desde Telegram? ("Cross-context messaging denied")'>
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

  <Accordion title='¿Por qué parece que el bot "ignora" mensajes enviados muy rápido?'>
    El modo de cola controla cómo interactúan los mensajes nuevos con una ejecución en curso. Usa `/queue` para cambiar de modo:

    - `steer` - poner en cola toda la orientación pendiente para el siguiente límite del modelo en la ejecución actual
    - `queue` - orientación heredada de una en una
    - `followup` - ejecutar mensajes de uno en uno
    - `collect` - agrupar mensajes y responder una vez
    - `steer-backlog` - orientar ahora y luego procesar la acumulación pendiente
    - `interrupt` - cancelar la ejecución actual y empezar de nuevo

    El modo predeterminado es `steer`. Puedes añadir opciones como `debounce:0.5s cap:25 drop:summarize` para modos de seguimiento. Consulta [Cola de comandos](/es/concepts/queue) y [Cola de orientación](/es/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Misceláneo

<AccordionGroup>
  <Accordion title='¿Cuál es el modelo predeterminado para Anthropic con una clave de API?'>
    En OpenClaw, las credenciales y la selección del modelo son independientes. Configurar `ANTHROPIC_API_KEY` (o almacenar una clave de API de Anthropic en los perfiles de autenticación) habilita la autenticación, pero el modelo predeterminado real es el que configures en `agents.defaults.model.primary` (por ejemplo, `anthropic/claude-sonnet-4-6` o `anthropic/claude-opus-4-6`). Si ves `No credentials found for profile "anthropic:default"`, significa que el Gateway no pudo encontrar credenciales de Anthropic en el `auth-profiles.json` esperado para el agente que se está ejecutando.
  </Accordion>
</AccordionGroup>

---

¿Sigues atascado? Pregunta en [Discord](https://discord.com/invite/clawd) o abre una [discusión de GitHub](https://github.com/openclaw/openclaw/discussions).

## Relacionado

- [Preguntas frecuentes del primer inicio](/es/help/faq-first-run) — instalación, incorporación, autenticación, suscripciones, fallos iniciales
- [Preguntas frecuentes sobre modelos](/es/help/faq-models) — selección de modelo, conmutación por error, perfiles de autenticación
- [Solución de problemas](/es/help/troubleshooting) — triaje basado en síntomas
