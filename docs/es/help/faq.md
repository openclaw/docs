---
read_when:
    - Respuesta a preguntas frecuentes de soporte sobre configuración, instalación, incorporación o ejecución
    - Triaje de problemas informados por usuarios antes de una depuración más profunda
summary: Preguntas frecuentes sobre la configuración inicial, la configuración y el uso de OpenClaw
title: Preguntas frecuentes
x-i18n:
    generated_at: "2026-07-03T13:17:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d55385d187c20dfce05022b76fcaa054c19fc22e46da66d4a24e2538dd95708
    source_path: help/faq.md
    workflow: 16
---

Respuestas rápidas y solución de problemas más profunda para configuraciones reales (desarrollo local, VPS, multiagente, OAuth/claves de API, conmutación por error de modelos). Para diagnósticos de runtime, consulta [Solución de problemas](/es/gateway/troubleshooting). Para la referencia completa de configuración, consulta [Configuración](/es/gateway/configuration).

## Primeros 60 segundos si algo está roto

1. **Estado rápido (primera comprobación)**

   ```bash
   openclaw status
   ```

   Resumen local rápido: SO + actualización, accesibilidad del gateway/servicio, agentes/sesiones, configuración de proveedor + problemas de runtime (cuando el gateway está accesible).

2. **Informe para pegar (seguro para compartir)**

   ```bash
   openclaw status --all
   ```

   Diagnóstico de solo lectura con cola de logs (tokens censurados).

3. **Estado del daemon + puerto**

   ```bash
   openclaw gateway status
   ```

   Muestra el runtime del supervisor frente a la accesibilidad RPC, la URL objetivo de la sonda y qué configuración probablemente usó el servicio.

4. **Sondas profundas**

   ```bash
   openclaw status --deep
   ```

   Ejecuta una sonda de salud del gateway en vivo, incluidas sondas de canal cuando se admiten
   (requiere un gateway accesible). Consulta [Salud](/es/gateway/health).

5. **Seguir el log más reciente**

   ```bash
   openclaw logs --follow
   ```

   Si RPC está caído, usa como alternativa:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Los logs de archivo están separados de los logs del servicio; consulta [Registro](/es/logging) y [Solución de problemas](/es/gateway/troubleshooting).

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

   Solicita al gateway en ejecución una instantánea completa (solo WS). Consulta [Salud](/es/gateway/health).

## Inicio rápido y configuración inicial

Las preguntas y respuestas del primer uso — instalación, incorporación, rutas de autenticación, suscripciones, fallos iniciales —
están en las [Preguntas frecuentes del primer uso](/es/help/faq-first-run).

## ¿Qué es OpenClaw?

<AccordionGroup>
  <Accordion title="¿Qué es OpenClaw, en un párrafo?">
    OpenClaw es un asistente de IA personal que ejecutas en tus propios dispositivos. Responde en las superficies de mensajería que ya usas (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat y plugins de canal incluidos como QQ Bot) y también puede ofrecer voz + un Canvas en vivo en plataformas compatibles. El **Gateway** es el plano de control siempre activo; el asistente es el producto.
  </Accordion>

  <Accordion title="Propuesta de valor">
    OpenClaw no es "solo un wrapper de Claude". Es un **plano de control local-first** que te permite ejecutar un
    asistente capaz en **tu propio hardware**, accesible desde las apps de chat que ya usas, con
    sesiones con estado, memoria y herramientas, sin entregar el control de tus flujos de trabajo a un
    SaaS alojado.

    Puntos destacados:

    - **Tus dispositivos, tus datos:** ejecuta el Gateway donde quieras (Mac, Linux, VPS) y mantén el
      espacio de trabajo + historial de sesiones en local.
    - **Canales reales, no un sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      además de voz móvil y Canvas en plataformas compatibles.
    - **Independiente del modelo:** usa Anthropic, OpenAI, MiniMax, OpenRouter, etc., con enrutamiento
      por agente y conmutación por error.
    - **Opción solo local:** ejecuta modelos locales para que **todos los datos puedan permanecer en tu dispositivo** si quieres.
    - **Enrutamiento multiagente:** agentes separados por canal, cuenta o tarea, cada uno con su propio
      espacio de trabajo y valores predeterminados.
    - **Open source y modificable:** inspecciona, amplía y autoaloja sin dependencia de proveedor.

    Docs: [Gateway](/es/gateway), [Canales](/es/channels), [Multiagente](/es/concepts/multi-agent),
    [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="Acabo de configurarlo: ¿qué debería hacer primero?">
    Buenos primeros proyectos:

    - Crear un sitio web (WordPress, Shopify o un sitio estático simple).
    - Prototipar una app móvil (esquema, pantallas, plan de API).
    - Organizar archivos y carpetas (limpieza, nombres, etiquetas).
    - Conectar Gmail y automatizar resúmenes o seguimientos.

    Puede manejar tareas grandes, pero funciona mejor cuando las divides en fases y
    usas subagentes para trabajo en paralelo.

  </Accordion>

  <Accordion title="¿Cuáles son los cinco casos de uso cotidianos principales de OpenClaw?">
    Las victorias cotidianas suelen verse así:

    - **Informes personales:** resúmenes de la bandeja de entrada, calendario y noticias que te importan.
    - **Investigación y redacción:** investigación rápida, resúmenes y primeros borradores para correos o docs.
    - **Recordatorios y seguimientos:** avisos y listas de comprobación impulsados por Cron o Heartbeat.
    - **Automatización del navegador:** completar formularios, recopilar datos y repetir tareas web.
    - **Coordinación entre dispositivos:** envía una tarea desde tu teléfono, deja que el Gateway la ejecute en un servidor y recibe el resultado de vuelta en el chat.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ayudar con generación de leads, outreach, anuncios y blogs para un SaaS?">
    Sí para **investigación, cualificación y redacción**. Puede escanear sitios, crear listas cortas,
    resumir prospectos y escribir borradores de outreach o textos de anuncios.

    Para **outreach o campañas de anuncios**, mantén a una persona en el proceso. Evita el spam, cumple las leyes locales y
    las políticas de la plataforma, y revisa todo antes de enviarlo. El patrón más seguro es dejar que
    OpenClaw redacte y que tú apruebes.

    Docs: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Cuáles son las ventajas frente a Claude Code para desarrollo web?">
    OpenClaw es un **asistente personal** y una capa de coordinación, no un reemplazo del IDE. Usa
    Claude Code o Codex para el bucle de codificación directa más rápido dentro de un repo. Usa OpenClaw cuando
    quieras memoria duradera, acceso entre dispositivos y orquestación de herramientas.

    Ventajas:

    - **Memoria persistente + espacio de trabajo** entre sesiones
    - **Acceso multiplataforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orquestación de herramientas** (navegador, archivos, programación, hooks)
    - **Gateway siempre activo** (ejecútalo en un VPS, interactúa desde cualquier lugar)
    - **Nodos** para navegador/pantalla/cámara/exec locales

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills y automatización

<AccordionGroup>
  <Accordion title="¿Cómo personalizo Skills sin mantener el repo sucio?">
    Usa sobrescrituras gestionadas en lugar de editar la copia del repo. Coloca tus cambios en `~/.openclaw/skills/<name>/SKILL.md` (o añade una carpeta mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json`). La precedencia es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluidas → `skills.load.extraDirs`, por lo que las sobrescrituras gestionadas siguen ganando a las Skills incluidas sin tocar git. Si necesitas que la Skill esté instalada globalmente pero solo visible para algunos agentes, mantén la copia compartida en `~/.openclaw/skills` y controla la visibilidad con `agents.defaults.skills` y `agents.list[].skills`. Solo las ediciones dignas de upstream deberían vivir en el repo y salir como PRs.
  </Accordion>

  <Accordion title="¿Puedo cargar Skills desde una carpeta personalizada?">
    Sí. Añade directorios adicionales mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json` (precedencia más baja). La precedencia predeterminada es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluidas → `skills.load.extraDirs`. `clawhub` instala en `./skills` de forma predeterminada, que OpenClaw trata como `<workspace>/skills` en la siguiente sesión. Si la Skill solo debería ser visible para ciertos agentes, combínalo con `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="¿Cómo puedo usar diferentes modelos o ajustes para diferentes tareas?">
    Hoy los patrones compatibles son:

    - **Trabajos Cron**: los trabajos aislados pueden establecer una sobrescritura de `model` por trabajo.
    - **Agentes**: enruta tareas a agentes separados con distintos modelos predeterminados, niveles de razonamiento y parámetros de stream.
    - **Cambio bajo demanda**: usa `/model` para cambiar el modelo de la sesión actual en cualquier momento.

    Por ejemplo, usa el mismo modelo con diferentes ajustes por agente:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    Coloca los valores predeterminados compartidos por modelo en `agents.defaults.models["provider/model"].params`, luego coloca las sobrescrituras específicas del agente en `agents.list[].params` plano. No definas entradas anidadas separadas de `agents.list[].models["provider/model"].params` para el mismo modelo; `agents.list[].models` es para el catálogo de modelos por agente y sobrescrituras de runtime.

    Consulta [Trabajos Cron](/es/automation/cron-jobs), [Enrutamiento multiagente](/es/concepts/multi-agent), [Configuración](/es/gateway/config-agents) y [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="El bot se congela mientras hace trabajo pesado. ¿Cómo lo descargo?">
    Usa **subagentes** para tareas largas o paralelas. Los subagentes se ejecutan en su propia sesión,
    devuelven un resumen y mantienen tu chat principal receptivo.

    Pídele a tu bot que "spawn a sub-agent for this task" o usa `/subagents`.
    Usa `/status` en el chat para ver qué está haciendo el Gateway ahora mismo (y si está ocupado).

    Consejo sobre tokens: las tareas largas y los subagentes consumen tokens. Si el costo te preocupa, establece un
    modelo más barato para subagentes mediante `agents.defaults.subagents.model`.

    Docs: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Cómo funcionan las sesiones de subagente vinculadas a hilos en Discord?">
    Usa vinculaciones de hilos. Puedes vincular un hilo de Discord a un subagente o destino de sesión para que los mensajes de seguimiento en ese hilo permanezcan en esa sesión vinculada.

    Flujo básico:

    - Genera con `sessions_spawn` usando `thread: true` (y opcionalmente `mode: "session"` para seguimiento persistente).
    - O vincula manualmente con `/focus <target>`.
    - Usa `/agents` para inspeccionar el estado de vinculación.
    - Usa `/session idle <duration|off>` y `/session max-age <duration|off>` para controlar el auto-unfocus.
    - Usa `/unfocus` para desacoplar el hilo.

    Configuración requerida:

    - Valores predeterminados globales: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Sobrescrituras de Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Vinculación automática al generar: `channels.discord.threadBindings.spawnSessions` se predetermina en `true`; establécelo en `false` para desactivar la generación de sesiones vinculadas a hilos.

    Docs: [Subagentes](/es/tools/subagents), [Discord](/es/channels/discord), [Referencia de configuración](/es/gateway/configuration-reference), [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagente terminó, pero la actualización de finalización fue al lugar equivocado o nunca se publicó. ¿Qué debería comprobar?">
    Comprueba primero la ruta resuelta del solicitante:

    - La entrega de subagente en modo de finalización prefiere cualquier ruta de hilo o conversación vinculada cuando existe una.
    - Si el origen de finalización solo lleva un canal, OpenClaw recurre a la ruta almacenada de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa aún pueda tener éxito.
    - Si no existe ni una ruta vinculada ni una ruta almacenada utilizable, la entrega directa puede fallar y el resultado vuelve a la entrega de sesión en cola en lugar de publicarse inmediatamente en el chat.
    - Los destinos inválidos u obsoletos aún pueden forzar el fallback a cola o el fallo final de entrega.
    - Si la última respuesta visible del asistente hijo es el token silencioso exacto `NO_REPLY` / `no_reply`, o exactamente `ANNOUNCE_SKIP`, OpenClaw suprime intencionalmente el anuncio en lugar de publicar progreso anterior obsoleto.
    - La salida de Tool/toolResult no se promueve al texto del resultado hijo; el resultado es la última respuesta visible del asistente hijo.

    Depuración:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks), [Herramientas de sesión](/es/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o los recordatorios no se ejecutan. ¿Qué debo revisar?">
    Cron se ejecuta dentro del proceso Gateway. Si el Gateway no se ejecuta de forma continua,
    los trabajos programados no se ejecutarán.

    Lista de comprobación:

    - Confirma que cron esté habilitado (`cron.enabled`) y que `OPENCLAW_SKIP_CRON` no esté definido.
    - Comprueba que el Gateway se ejecute 24/7 (sin suspensión ni reinicios).
    - Verifica la configuración de zona horaria del trabajo (`--tz` frente a la zona horaria del host).

    Depuración:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [Automatización](/es/automation).

  </Accordion>

  <Accordion title="Cron se ejecutó, pero no se envió nada al canal. ¿Por qué?">
    Revisa primero el modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"` significa que no se espera ningún envío de reserva del ejecutor.
    - Un destino de anuncio ausente o no válido (`channel` / `to`) significa que el ejecutor omitió la entrega saliente.
    - Los fallos de autenticación del canal (`unauthorized`, `Forbidden`) significan que el ejecutor intentó entregar, pero las credenciales lo bloquearon.
    - Un resultado aislado silencioso (solo `NO_REPLY` / `no_reply`) se trata como intencionalmente no entregable, por lo que el ejecutor también suprime la entrega de reserva en cola.

    Para trabajos Cron aislados, el agente aún puede enviar directamente con la herramienta
    `message` cuando hay una ruta de chat disponible. `--announce` solo controla la ruta
    de reserva del ejecutor para el texto final que el agente aún no envió.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Por qué una ejecución Cron aislada cambió de modelo o reintentó una vez?">
    Normalmente es la ruta de cambio de modelo en vivo, no una programación duplicada.

    Cron aislado puede conservar una transferencia de modelo en tiempo de ejecución y reintentar cuando la ejecución
    activa lanza `LiveSessionModelSwitchError`. El reintento mantiene el
    proveedor/modelo cambiado y, si el cambio traía una nueva anulación del perfil de autenticación, Cron
    también la conserva antes de reintentar.

    Reglas de selección relacionadas:

    - La anulación de modelo del hook de Gmail gana primero cuando corresponde.
    - Luego `model` por trabajo.
    - Luego cualquier anulación de modelo de sesión Cron almacenada.
    - Luego la selección normal de modelo del agente/predeterminada.

    El bucle de reintento está acotado. Después del intento inicial más 2 reintentos de cambio,
    Cron aborta en lugar de entrar en un bucle infinito.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [CLI de Cron](/es/cli/cron).

  </Accordion>

  <Accordion title="¿Cómo instalo Skills en Linux?">
    Usa comandos nativos de `openclaw skills` o coloca Skills en tu espacio de trabajo. La interfaz de Skills de macOS no está disponible en Linux.
    Explora Skills en [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    El `openclaw skills install` nativo escribe en el directorio `skills/` del espacio de trabajo
    activo de forma predeterminada. Añade `--global` para instalar en el directorio
    compartido administrado de Skills para todos los agentes locales. Instala la CLI separada `clawhub`
    solo si quieres publicar o sincronizar tus propias Skills. Usa
    `agents.defaults.skills` o `agents.list[].skills` si quieres restringir
    qué agentes pueden ver Skills compartidas.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ejecutar tareas según un horario o de forma continua en segundo plano?">
    Sí. Usa el programador del Gateway:

    - **Trabajos Cron** para tareas programadas o recurrentes (persisten entre reinicios).
    - **Heartbeat** para comprobaciones periódicas de la "sesión principal".
    - **Trabajos aislados** para agentes autónomos que publican resúmenes o entregan a chats.

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [Automatización](/es/automation),
    [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title="¿Puedo ejecutar Skills exclusivas de Apple macOS desde Linux?">
    No directamente. Las Skills de macOS están restringidas por `metadata.openclaw.os` más los binarios requeridos, y las Skills solo aparecen en el prompt del sistema cuando son elegibles en el **host Gateway**. En Linux, las Skills solo para `darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) no se cargarán a menos que anules la restricción.

    Tienes tres patrones compatibles:

    **Opción A - ejecuta el Gateway en una Mac (lo más simple).**
    Ejecuta el Gateway donde existan los binarios de macOS y luego conéctate desde Linux en [modo remoto](#gateway-ports-already-running-and-remote-mode) o mediante Tailscale. Las Skills se cargan normalmente porque el host Gateway es macOS.

    **Opción B - usa un nodo macOS (sin SSH).**
    Ejecuta el Gateway en Linux, empareja un nodo macOS (app de la barra de menús) y establece **Comandos de ejecución de Node** en "Preguntar siempre" o "Permitir siempre" en la Mac. OpenClaw puede tratar las Skills exclusivas de macOS como elegibles cuando los binarios requeridos existen en el nodo. El agente ejecuta esas Skills mediante la herramienta `nodes`. Si eliges "Preguntar siempre", aprobar "Permitir siempre" en el prompt añade ese comando a la lista de permitidos.

    **Opción C - proxy de binarios de macOS mediante SSH (avanzado).**
    Mantén el Gateway en Linux, pero haz que los binarios CLI requeridos se resuelvan a wrappers SSH que se ejecutan en una Mac. Luego anula la Skill para permitir Linux de modo que siga siendo elegible.

    1. Crea un wrapper SSH para el binario (ejemplo: `memo` para Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Coloca el wrapper en `PATH` en el host Linux (por ejemplo, `~/bin/memo`).
    3. Anula los metadatos de la Skill (espacio de trabajo o `~/.openclaw/skills`) para permitir Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Inicia una nueva sesión para que se actualice la instantánea de Skills.

  </Accordion>

  <Accordion title="¿Tienen una integración con Notion o HeyGen?">
    No está integrada hoy.

    Opciones:

    - **Skill / Plugin personalizado:** lo mejor para acceso fiable a la API (Notion/HeyGen tienen API).
    - **Automatización del navegador:** funciona sin código, pero es más lenta y más frágil.

    Si quieres mantener contexto por cliente (flujos de trabajo de agencia), un patrón simple es:

    - Una página de Notion por cliente (contexto + preferencias + trabajo activo).
    - Pídele al agente que obtenga esa página al inicio de una sesión.

    Si quieres una integración nativa, abre una solicitud de función o crea una Skill
    dirigida a esas API.

    Instalar Skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Las instalaciones nativas llegan al directorio `skills/` del espacio de trabajo activo. Para Skills compartidas entre todos los agentes locales, usa `openclaw skills install @owner/<skill-slug> --global` (o colócalas manualmente en `~/.openclaw/skills/<name>/SKILL.md`). Si solo algunos agentes deben ver una instalación compartida, configura `agents.defaults.skills` o `agents.list[].skills`. Algunas Skills esperan binarios instalados mediante Homebrew; en Linux eso significa Linuxbrew (consulta la entrada de preguntas frecuentes de Homebrew para Linux más arriba). Consulta [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config) y [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="¿Cómo uso mi Chrome existente con sesión iniciada con OpenClaw?">
    Usa el perfil de navegador `user` integrado, que se conecta mediante Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Si quieres un nombre personalizado, crea un perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Esta ruta puede usar el navegador local del host o un nodo de navegador conectado. Si el Gateway se ejecuta en otro lugar, ejecuta un host de nodo en la máquina del navegador o usa CDP remoto.

    Límites actuales de `existing-session` / `user`:

    - las acciones se basan en referencias, no en selectores CSS
    - las cargas requieren `ref` / `inputRef` y actualmente admiten un archivo a la vez
    - `responsebody`, la exportación a PDF, la interceptación de descargas y las acciones por lotes aún necesitan un navegador administrado o un perfil CDP sin procesar

  </Accordion>
</AccordionGroup>

## Aislamiento y memoria

<AccordionGroup>
  <Accordion title="¿Hay una documentación dedicada sobre aislamiento?">
    Sí. Consulta [Aislamiento](/es/gateway/sandboxing). Para la configuración específica de Docker (Gateway completo en Docker o imágenes de aislamiento), consulta [Docker](/es/install/docker).
  </Accordion>

  <Accordion title="Docker se siente limitado: ¿cómo habilito todas las funciones?">
    La imagen predeterminada prioriza la seguridad y se ejecuta como el usuario `node`, por lo que no
    incluye paquetes del sistema, Homebrew ni navegadores incluidos. Para una configuración más completa:

    - Conserva `/home/node` con `OPENCLAW_HOME_VOLUME` para que las cachés sobrevivan.
    - Incorpora dependencias del sistema en la imagen con `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Instala navegadores de Playwright mediante la CLI incluida:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Define `PLAYWRIGHT_BROWSERS_PATH` y asegúrate de que la ruta se conserve.

    Documentación: [Docker](/es/install/docker), [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Puedo mantener los DM personales pero hacer que los grupos sean públicos/aislados con un solo agente?">
    Sí, si tu tráfico privado son **DM** y tu tráfico público son **grupos**.

    Usa `agents.defaults.sandbox.mode: "non-main"` para que las sesiones de grupo/canal (claves no principales) se ejecuten en el backend de aislamiento configurado, mientras que la sesión DM principal permanece en el host. Docker es el backend predeterminado si no eliges uno. Luego restringe qué herramientas están disponibles en sesiones aisladas mediante `tools.sandbox.tools`.

    Guía de configuración + ejemplo de configuración: [Grupos: DM personales + grupos públicos](/es/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referencia de configuración clave: [Configuración del Gateway](/es/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="¿Cómo monto una carpeta del host en el entorno aislado?">
    Define `agents.defaults.sandbox.docker.binds` como `["host:path:mode"]` (p. ej., `"/home/user/src:/src:ro"`). Los montajes globales y por agente se combinan; los montajes por agente se ignoran cuando `scope: "shared"`. Usa `:ro` para cualquier cosa sensible y recuerda que los montajes omiten los límites del sistema de archivos del entorno aislado.

    OpenClaw valida las fuentes de montaje tanto contra la ruta normalizada como contra la ruta canónica resuelta a través del ancestro existente más profundo. Eso significa que los escapes por padre con symlink siguen fallando cerrados incluso cuando el último segmento de la ruta aún no existe, y las comprobaciones de raíz permitida siguen aplicándose después de resolver symlinks.

    Consulta [Aislamiento](/es/gateway/sandboxing#custom-bind-mounts) y [Aislamiento frente a política de herramientas frente a Elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) para ver ejemplos y notas de seguridad.

  </Accordion>

  <Accordion title="¿Cómo funciona la memoria?">
    La memoria de OpenClaw son simplemente archivos Markdown en el espacio de trabajo del agente:

    - Notas diarias en `memory/YYYY-MM-DD.md`
    - Notas seleccionadas de largo plazo en `MEMORY.md` (solo sesiones principales/privadas)

    OpenClaw también ejecuta un **vaciado de memoria silencioso previo a Compaction** para recordar al modelo
    que escriba notas duraderas antes de la autocompactación. Esto solo se ejecuta cuando el espacio de trabajo
    permite escritura (los entornos aislados de solo lectura lo omiten). Consulta [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="La memoria sigue olvidando cosas. ¿Cómo hago que permanezcan?">
    Pide al bot que **escriba el dato en la memoria**. Las notas a largo plazo van en `MEMORY.md`,
    el contexto a corto plazo va en `memory/YYYY-MM-DD.md`.

    Esta sigue siendo un área que estamos mejorando. Ayuda recordarle al modelo que almacene recuerdos;
    sabrá qué hacer. Si sigue olvidando, verifica que el Gateway esté usando el mismo
    espacio de trabajo en cada ejecución.

    Documentación: [Memoria](/es/concepts/memory), [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿La memoria persiste para siempre? ¿Cuáles son los límites?">
    Los archivos de memoria viven en el disco y persisten hasta que los elimines. El límite es tu
    almacenamiento, no el modelo. El **contexto de sesión** sigue limitado por la ventana de contexto
    del modelo, por lo que las conversaciones largas pueden compactarse o truncarse. Por eso existe
    la búsqueda de memoria: vuelve a incorporar al contexto solo las partes relevantes.

    Documentación: [Memoria](/es/concepts/memory), [Contexto](/es/concepts/context).

  </Accordion>

  <Accordion title="¿La búsqueda semántica de memoria requiere una clave de API de OpenAI?">
    Solo si usas **embeddings de OpenAI**. Codex OAuth cubre chat/completions y
    **no** otorga acceso a embeddings, así que **iniciar sesión con Codex (OAuth o el
    inicio de sesión de la CLI de Codex)** no ayuda para la búsqueda semántica de memoria. Los embeddings de OpenAI
    siguen necesitando una clave de API real (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Si no estableces un proveedor explícitamente, OpenClaw usa embeddings de OpenAI. Las configuraciones
    heredadas que todavía dicen `memorySearch.provider = "auto"` también se resuelven a OpenAI.
    Si no hay ninguna clave de API de OpenAI disponible, la búsqueda semántica de memoria permanece no disponible
    hasta que configures una clave o elijas explícitamente otro proveedor.

    Si prefieres mantenerte local, establece `memorySearch.provider = "local"` (y opcionalmente
    `memorySearch.fallback = "none"`). Si quieres embeddings de Gemini, establece
    `memorySearch.provider = "gemini"` y proporciona `GEMINI_API_KEY` (o
    `memorySearch.remote.apiKey`). Admitimos modelos de embeddings de **OpenAI, compatibles con OpenAI, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra, o locales**:
    consulta [Memoria](/es/concepts/memory) para los detalles de configuración.

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
    - **Tú controlas la huella:** usar modelos locales mantiene los prompts en tu equipo, pero el tráfico de canal
      sigue pasando por los servidores del canal.

    Relacionado: [Espacio de trabajo del agente](/es/concepts/agent-workspace), [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Dónde almacena OpenClaw sus datos?">
    Todo vive bajo `$OPENCLAW_STATE_DIR` (valor predeterminado: `~/.openclaw`):

    | Ruta                                                            | Propósito                                                          |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuración principal (JSON5)                                    |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importación OAuth heredada (copiada a perfiles de autenticación en el primer uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfiles de autenticación (OAuth, claves de API y `keyRef`/`tokenRef` opcionales) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Carga secreta opcional respaldada por archivo para proveedores SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Archivo de compatibilidad heredado (entradas `api_key` estáticas depuradas) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Estado del proveedor (p. ej., `whatsapp/<accountId>/creds.json`)   |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Estado por agente (agentDir + sesiones)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historial y estado de conversación (por agente)                    |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadatos de sesión (por agente)                                   |

    Ruta heredada de agente único: `~/.openclaw/agent/*` (migrada por `openclaw doctor`).

    Tu **espacio de trabajo** (AGENTS.md, archivos de memoria, skills, etc.) está separado y se configura mediante `agents.defaults.workspace` (valor predeterminado: `~/.openclaw/workspace`).

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
    espacio de trabajo en cada inicio (y recuerda: el modo remoto usa el espacio de trabajo del **host del gateway**,
    no tu portátil local).

    Consejo: si quieres un comportamiento o preferencia duraderos, pide al bot que **lo escriba en
    AGENTS.md o MEMORY.md** en lugar de depender del historial de chat.

    Consulta [Espacio de trabajo del agente](/es/concepts/agent-workspace) y [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Puedo hacer que SOUL.md sea más grande?">
    Sí. `SOUL.md` es uno de los archivos de arranque del espacio de trabajo inyectados en el
    contexto del agente. El límite de inyección predeterminado por archivo es de `20000` caracteres,
    y el presupuesto total de arranque entre archivos es de `60000` caracteres.

    Cambia los valores predeterminados compartidos en tu configuración de OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    O sobrescribe un agente:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    Usa `/context` para comprobar los tamaños sin procesar frente a los inyectados y si se produjo truncamiento.
    Mantén `SOUL.md` centrado en la voz, la postura y la personalidad; pon las reglas operativas
    en `AGENTS.md` y los hechos duraderos en la memoria.

    Consulta [Contexto](/es/concepts/context) y [Configuración de agentes](/es/gateway/config-agents).

  </Accordion>

  <Accordion title="Estrategia de copia de seguridad recomendada">
    Pon tu **espacio de trabajo del agente** en un repositorio git **privado** y haz una copia de seguridad en algún lugar
    privado (por ejemplo, GitHub privado). Esto captura la memoria + los archivos AGENTS/SOUL/USER
    y te permite restaurar la "mente" del asistente más adelante.

    **No** confirmes nada bajo `~/.openclaw` (credenciales, sesiones, tokens o cargas de secretos cifrados).
    Si necesitas una restauración completa, haz una copia de seguridad tanto del espacio de trabajo como del directorio de estado
    por separado (consulta la pregunta sobre migración anterior).

    Documentación: [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿Cómo desinstalo OpenClaw por completo?">
    Consulta la guía dedicada: [Desinstalar](/es/install/uninstall).
  </Accordion>

  <Accordion title="¿Pueden los agentes trabajar fuera del espacio de trabajo?">
    Sí. El espacio de trabajo es el **cwd predeterminado** y ancla de memoria, no un sandbox rígido.
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
    El estado de la sesión pertenece al **host del Gateway**. Si estás en modo remoto, el almacén de sesiones que te importa está en la máquina remota, no en tu portátil local. Consulta [Gestión de sesiones](/es/concepts/session).
  </Accordion>
</AccordionGroup>

## Conceptos básicos de configuración

<AccordionGroup>
  <Accordion title="¿Qué formato tiene la configuración? ¿Dónde está?">
    OpenClaw lee una configuración **JSON5** opcional desde `$OPENCLAW_CONFIG_PATH` (predeterminado: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Si falta el archivo, usa valores predeterminados relativamente seguros (incluido un espacio de trabajo predeterminado de `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Configuré gateway.bind: "lan" (o "tailnet") y ahora nada escucha / la interfaz dice no autorizado'>
    Los enlaces que no son loopback **requieren una ruta de autenticación de Gateway válida**. En la práctica, eso significa:

    - autenticación de secreto compartido: token o contraseña
    - `gateway.auth.mode: "trusted-proxy"` detrás de un proxy inverso con reconocimiento de identidad correctamente configurado

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

    - `gateway.remote.token` / `.password` **no** habilitan la autenticación local del Gateway por sí solos.
    - Las rutas de llamada locales pueden usar `gateway.remote.*` como alternativa solo cuando `gateway.auth.*` no está establecido.
    - Para autenticación con contraseña, establece `gateway.auth.mode: "password"` más `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`) en su lugar.
    - Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución falla cerrada (sin enmascaramiento por alternativa remota).
    - Las configuraciones de la interfaz de control con secreto compartido se autentican mediante `connect.params.auth.token` o `connect.params.auth.password` (almacenados en la configuración de la app/interfaz). Los modos con identidad, como Tailscale Serve o `trusted-proxy`, usan encabezados de solicitud en su lugar. Evita poner secretos compartidos en URLs.
    - Con `gateway.auth.mode: "trusted-proxy"`, los proxies inversos local loopback del mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito y una entrada loopback en `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="¿Por qué necesito un token en localhost ahora?">
    OpenClaw aplica la autenticación del Gateway de forma predeterminada, incluido loopback. En la ruta predeterminada normal, eso significa autenticación con token: si no se configura una ruta de autenticación explícita, el arranque del Gateway se resuelve en modo token y genera un token solo de tiempo de ejecución para ese arranque, por lo que **los clientes WS locales deben autenticarse**. Configura `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` u `OPENCLAW_GATEWAY_PASSWORD` explícitamente cuando los clientes necesiten un secreto estable entre reinicios. Esto bloquea que otros procesos locales llamen al Gateway.

    Si prefieres una ruta de autenticación distinta, puedes elegir explícitamente el modo de contraseña (o, para proxies inversos con identidad, `trusted-proxy`). Si **realmente** quieres loopback abierto, define explícitamente `gateway.auth.mode: "none"` en tu configuración. Doctor puede generar un token para ti en cualquier momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="¿Tengo que reiniciar después de cambiar la configuración?">
    El Gateway observa la configuración y admite recarga en caliente:

    - `gateway.reload.mode: "hybrid"` (predeterminado): aplica en caliente los cambios seguros, reinicia para los críticos
    - `hot`, `restart`, `off` también son compatibles

  </Accordion>

  <Accordion title="¿Cómo desactivo los lemas divertidos de la CLI?">
    Define `cli.banner.taglineMode` en la configuración:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: oculta el texto del lema, pero conserva la línea de título/versión del banner.
    - `default`: usa `All your chats, one OpenClaw.` siempre.
    - `random`: lemas divertidos/estacionales rotativos (comportamiento predeterminado).
    - Si no quieres ningún banner, define la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="¿Cómo habilito la búsqueda web (y la obtención web)?">
    `web_fetch` funciona sin una clave de API. `web_search` depende del proveedor
    seleccionado:

    - Los proveedores respaldados por API, como Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity y Tavily, requieren su configuración normal de clave de API.
    - Grok puede reutilizar OAuth de xAI de la autenticación del modelo, o recurrir a `XAI_API_KEY` / la configuración de búsqueda web del plugin.
    - Ollama Web Search no requiere clave, pero usa tu host Ollama configurado y requiere `ollama signin`.
    - DuckDuckGo no requiere clave, pero es una integración no oficial basada en HTML.
    - SearXNG no requiere clave y puede autoalojarse; configura `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recomendado:** ejecuta `openclaw configure --section web` y elige un proveedor.
    Alternativas de entorno:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: OAuth de xAI, `XAI_API_KEY`
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
    Las rutas de proveedor heredadas `tools.web.search.*` aún se cargan temporalmente por compatibilidad, pero no deben usarse para configuraciones nuevas.
    La configuración de respaldo de obtención web de Firecrawl vive en `plugins.entries.firecrawl.config.webFetch.*`.

    Notas:

    - Si usas listas de permitidos, agrega `web_search`/`web_fetch`/`x_search` o `group:web`.
    - `web_fetch` está habilitado de forma predeterminada (salvo que se deshabilite explícitamente).
    - Si se omite `tools.web.fetch.provider`, OpenClaw detecta automáticamente el primer proveedor de respaldo de obtención listo a partir de las credenciales disponibles. El plugin oficial de Firecrawl proporciona ese respaldo.
    - Los daemons leen variables de entorno desde `~/.openclaw/.env` (o el entorno del servicio).

    Documentación: [Herramientas web](/es/tools/web).

  </Accordion>

  <Accordion title="config.apply borró mi configuración. ¿Cómo la recupero y evito que ocurra?">
    `config.apply` reemplaza la **configuración completa**. Si envías un objeto parcial, todo
    lo demás se elimina.

    OpenClaw actual protege contra muchas sobrescrituras accidentales:

    - Las escrituras de configuración propiedad de OpenClaw validan toda la configuración posterior al cambio antes de escribir.
    - Las escrituras propiedad de OpenClaw inválidas o destructivas se rechazan y se guardan como `openclaw.json.rejected.*`.
    - Si una edición directa rompe el arranque o la recarga en caliente, Gateway falla cerrado o omite la recarga; no reescribe `openclaw.json`.
    - `openclaw doctor --fix` es responsable de la reparación y puede restaurar la última configuración válida conocida mientras guarda el archivo rechazado como `openclaw.json.clobbered.*`.

    Recuperación:

    - Revisa `openclaw logs --follow` para buscar `Invalid config at`, `Config write rejected:` o `config reload skipped (invalid config)`.
    - Inspecciona el `openclaw.json.clobbered.*` o `openclaw.json.rejected.*` más reciente junto a la configuración activa.
    - Ejecuta `openclaw config validate` y `openclaw doctor --fix`.
    - Copia de vuelta solo las claves previstas con `openclaw config set` o `config.patch`.
    - Si no tienes una última configuración válida conocida ni una carga rechazada, restaura desde una copia de seguridad, o vuelve a ejecutar `openclaw doctor` y reconfigura canales/modelos.
    - Si esto fue inesperado, presenta un bug e incluye tu última configuración conocida o cualquier copia de seguridad.
    - Un agente de codificación local a menudo puede reconstruir una configuración funcional a partir de registros o historial.

    Para evitarlo:

    - Usa `openclaw config set` para cambios pequeños.
    - Usa `openclaw configure` para ediciones interactivas.
    - Usa primero `config.schema.lookup` cuando no tengas certeza sobre una ruta exacta o la forma de un campo; devuelve un nodo de esquema superficial más resúmenes de hijos inmediatos para profundizar.
    - Usa `config.patch` para ediciones RPC parciales; reserva `config.apply` solo para reemplazar la configuración completa.
    - Si usas la herramienta `gateway` orientada al agente desde una ejecución de agente, seguirá rechazando escrituras en `tools.exec.ask` / `tools.exec.security` (incluidos los alias heredados `tools.bash.*` que se normalizan a las mismas rutas de ejecución protegidas).

    Documentación: [Configuración](/es/cli/config), [Configurar](/es/cli/configure), [Solución de problemas de Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Cómo ejecuto un Gateway central con workers especializados entre dispositivos?">
    El patrón común es **un Gateway** (p. ej., Raspberry Pi) más **nodos** y **agentes**:

    - **Gateway (central):** posee canales (Signal/WhatsApp), enrutamiento y sesiones.
    - **Nodos (dispositivos):** Macs/iOS/Android se conectan como periféricos y exponen herramientas locales (`system.run`, `canvas`, `camera`).
    - **Agentes (workers):** cerebros/espacios de trabajo separados para roles especiales (p. ej., "Operaciones de Hetzner", "Datos personales").
    - **Subagentes:** generan trabajo en segundo plano desde un agente principal cuando quieres paralelismo.
    - **TUI:** conéctate al Gateway y cambia de agentes/sesiones.

    Documentación: [Nodos](/es/nodes), [Acceso remoto](/es/gateway/remote), [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [TUI](/es/web/tui).

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

    Headless usa el **mismo motor Chromium** y funciona para la mayoría de las automatizaciones (formularios, clics, scraping, inicios de sesión). Las principales diferencias:

    - No hay una ventana visible del navegador (usa capturas de pantalla si necesitas elementos visuales).
    - Algunos sitios son más estrictos con la automatización en modo headless (CAPTCHAs, anti-bot).
      Por ejemplo, X/Twitter suele bloquear sesiones headless.

  </Accordion>

  <Accordion title="¿Cómo uso Brave para controlar el navegador?">
    Define `browser.executablePath` en el binario de Brave (o cualquier navegador basado en Chromium) y reinicia el Gateway.
    Consulta los ejemplos completos de configuración en [Navegador](/es/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways remotos y nodos

<AccordionGroup>
  <Accordion title="¿Cómo se propagan los comandos entre Telegram, el gateway y los nodos?">
    Los mensajes de Telegram los gestiona el **gateway**. El gateway ejecuta el agente y
    solo entonces llama a los nodos por el **Gateway WebSocket** cuando se necesita una herramienta de nodo:

    Telegram → Gateway → Agente → `node.*` → Nodo → Gateway → Telegram

    Los nodos no ven tráfico entrante de proveedores; solo reciben llamadas RPC de nodo.

  </Accordion>

  <Accordion title="¿Cómo puede mi agente acceder a mi computadora si el Gateway está alojado de forma remota?">
    Respuesta corta: **empareja tu computadora como nodo**. El Gateway se ejecuta en otro lugar, pero puede
    llamar a herramientas `node.*` (pantalla, cámara, sistema) en tu máquina local mediante el Gateway WebSocket.

    Configuración típica:

    1. Ejecuta el Gateway en el host siempre encendido (VPS/servidor doméstico).
    2. Pon el host del Gateway y tu computadora en la misma tailnet.
    3. Asegúrate de que el WS del Gateway sea accesible (enlace de tailnet o túnel SSH).
    4. Abre la aplicación de macOS localmente y conéctate en modo **Remoto por SSH** (o tailnet directa)
       para que pueda registrarse como nodo.
    5. Aprueba el nodo en el Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    No se requiere un puente TCP separado; los nodos se conectan mediante el Gateway WebSocket.

    Recordatorio de seguridad: emparejar un nodo de macOS permite `system.run` en esa máquina. Empareja
    solo dispositivos en los que confíes y revisa [Seguridad](/es/gateway/security).

    Documentación: [Nodos](/es/nodes), [Protocolo de Gateway](/es/gateway/protocol), [Modo remoto de macOS](/es/platforms/mac/remote), [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="Tailscale está conectado, pero no recibo respuestas. ¿Qué hago ahora?">
    Comprueba lo básico:

    - Gateway en ejecución: `openclaw gateway status`
    - Salud del Gateway: `openclaw status`
    - Salud del canal: `openclaw channels status`

    Luego verifica la autenticación y el enrutamiento:

    - Si usas Tailscale Serve, asegúrate de que `gateway.auth.allowTailscale` esté configurado correctamente.
    - Si te conectas mediante un túnel SSH, confirma que el túnel local esté activo y apunte al puerto correcto.
    - Confirma que tus listas de permitidos (DM o grupo) incluyan tu cuenta.

    Documentación: [Tailscale](/es/gateway/tailscale), [Acceso remoto](/es/gateway/remote), [Canales](/es/channels).

  </Accordion>

  <Accordion title="¿Pueden dos instancias de OpenClaw comunicarse entre sí (local + VPS)?">
    Sí. No hay un puente "bot a bot" integrado, pero puedes conectarlas de algunas
    formas fiables:

    **Lo más simple:** usa un canal de chat normal al que ambos bots puedan acceder (Telegram/Slack/WhatsApp).
    Haz que el Bot A envíe un mensaje al Bot B y luego deja que el Bot B responda como de costumbre.

    **Puente CLI (genérico):** ejecuta un script que llame al otro Gateway con
    `openclaw agent --message ... --deliver`, apuntando a un chat donde el otro bot
    escuche. Si un bot está en un VPS remoto, apunta tu CLI a ese Gateway remoto
    mediante SSH/Tailscale (consulta [Acceso remoto](/es/gateway/remote)).

    Patrón de ejemplo (ejecutar desde una máquina que pueda alcanzar el Gateway de destino):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Consejo: añade una barrera de seguridad para que los dos bots no entren en un bucle infinito (solo menciones, listas
    de permitidos de canales o una regla de "no responder a mensajes de bot").

    Documentación: [Acceso remoto](/es/gateway/remote), [CLI de agente](/es/cli/agent), [Envío de agente](/es/tools/agent-send).

  </Accordion>

  <Accordion title="¿Necesito VPS separados para varios agentes?">
    No. Un Gateway puede alojar varios agentes, cada uno con su propio espacio de trabajo, valores predeterminados de modelo
    y enrutamiento. Esa es la configuración normal y es mucho más barata y sencilla que ejecutar
    un VPS por agente.

    Usa VPS separados solo cuando necesites aislamiento estricto (límites de seguridad) o configuraciones
    muy diferentes que no quieras compartir. De lo contrario, mantén un Gateway y
    usa varios agentes o subagentes.

  </Accordion>

  <Accordion title="¿Hay alguna ventaja en usar un nodo en mi portátil personal en lugar de SSH desde un VPS?">
    Sí: los nodos son la forma de primera clase de acceder a tu portátil desde un Gateway remoto, y
    habilitan más que acceso de shell. El Gateway se ejecuta en macOS/Linux (Windows mediante WSL2) y es
    ligero (un VPS pequeño o una máquina de clase Raspberry Pi está bien; 4 GB de RAM sobran), así que una
    configuración habitual es un host siempre encendido más tu portátil como nodo.

    - **No se requiere SSH entrante.** Los nodos se conectan hacia el Gateway WebSocket y usan emparejamiento de dispositivos.
    - **Controles de ejecución más seguros.** `system.run` está protegido por listas de permisos/aprobaciones de nodo en ese portátil.
    - **Más herramientas de dispositivo.** Los nodos exponen `canvas`, `camera` y `screen`, además de `system.run`.
    - **Automatización de navegador local.** Mantén el Gateway en un VPS, pero ejecuta Chrome localmente mediante un host de nodo en el portátil, o conéctate al Chrome local del host mediante Chrome MCP.

    SSH está bien para acceso de shell puntual, pero los nodos son más simples para flujos de trabajo continuos de agentes y
    automatización de dispositivos.

    Documentación: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes), [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Los nodos ejecutan un servicio de gateway?">
    No. Solo debería ejecutarse **un gateway** por host, salvo que ejecutes perfiles aislados intencionadamente (consulta [Varios gateways](/es/gateway/multiple-gateways)). Los nodos son periféricos que se conectan
    al gateway (nodos iOS/Android, o "modo nodo" de macOS en la app de la barra de menús). Para hosts de nodo
    sin interfaz y control por CLI, consulta [CLI de host de nodo](/es/cli/node).

    Se requiere un reinicio completo para cambios en `gateway`, `discovery` y la superficie de plugins alojados.

  </Accordion>

  <Accordion title="¿Hay una forma API / RPC de aplicar configuración?">
    Sí.

    - `config.schema.lookup`: inspecciona un subárbol de configuración con su nodo de esquema superficial, sugerencia de UI coincidente y resúmenes inmediatos de hijos antes de escribir
    - `config.get`: obtiene la instantánea actual + hash
    - `config.patch`: actualización parcial segura (preferida para la mayoría de ediciones RPC); recarga en caliente cuando es posible y reinicia cuando es necesario
    - `config.apply`: valida + reemplaza toda la configuración; recarga en caliente cuando es posible y reinicia cuando es necesario
    - La herramienta de runtime `gateway` orientada al agente sigue rechazando reescribir `tools.exec.ask` / `tools.exec.security`; los alias heredados `tools.bash.*` se normalizan a las mismas rutas exec protegidas

  </Accordion>

  <Accordion title="Configuración mínima razonable para una primera instalación">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Esto define tu espacio de trabajo y restringe quién puede activar el bot.

  </Accordion>

  <Accordion title="¿Cómo configuro Tailscale en un VPS y me conecto desde mi Mac?">
    Pasos mínimos:

    1. **Instala + inicia sesión en el VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Instala + inicia sesión en tu Mac**
       - Usa la app de Tailscale e inicia sesión en la misma tailnet.
    3. **Habilita MagicDNS (recomendado)**
       - En la consola de administración de Tailscale, habilita MagicDNS para que el VPS tenga un nombre estable.
    4. **Usa el nombre de host de la tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - WS del Gateway: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Si quieres la UI de control sin SSH, usa Tailscale Serve en el VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Esto mantiene el gateway enlazado a local loopback y expone HTTPS mediante Tailscale. Consulta [Tailscale](/es/gateway/tailscale).

  </Accordion>

  <Accordion title="¿Cómo conecto un nodo Mac a un Gateway remoto (Tailscale Serve)?">
    Serve expone la **UI de control del Gateway + WS**. Los nodos se conectan por el mismo endpoint WS del Gateway.

    Configuración recomendada:

    1. **Asegúrate de que el VPS + Mac estén en la misma tailnet**.
    2. **Usa la app de macOS en modo remoto** (el destino SSH puede ser el nombre de host de la tailnet).
       La app tunelizará el puerto del Gateway y se conectará como nodo.
    3. **Aprueba el nodo** en el gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentación: [Protocolo del Gateway](/es/gateway/protocol), [Discovery](/es/gateway/discovery), [modo remoto de macOS](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Debería instalar en un segundo portátil o simplemente añadir un nodo?">
    Si solo necesitas **herramientas locales** (pantalla/cámara/exec) en el segundo portátil, añádelo como
    **nodo**. Eso mantiene un único Gateway y evita configuración duplicada. Las herramientas de nodo locales son
    actualmente solo para macOS, pero planeamos extenderlas a otros sistemas operativos.

    Instala un segundo Gateway solo cuando necesites **aislamiento fuerte** o dos bots totalmente separados.

    Documentación: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes), [Varios gateways](/es/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables de entorno y carga de .env

<AccordionGroup>
  <Accordion title="¿Cómo carga OpenClaw las variables de entorno?">
    OpenClaw lee variables de entorno del proceso padre (shell, launchd/systemd, CI, etc.) y además carga:

    - `.env` desde el directorio de trabajo actual
    - un `.env` global de reserva desde `~/.openclaw/.env` (también conocido como `$OPENCLAW_STATE_DIR/.env`)

    Ningún archivo `.env` sobrescribe variables de entorno existentes.
    Las variables de credenciales de proveedores son una excepción para el `.env` del espacio de trabajo: claves como
    `GEMINI_API_KEY`, `XAI_API_KEY` o `MISTRAL_API_KEY` se ignoran desde el `.env` del espacio de trabajo
    y deberían residir en el entorno del proceso, `~/.openclaw/.env` o la configuración `env`.

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
    Dos soluciones habituales:

    1. Coloca las claves que faltan en `~/.openclaw/.env` para que se recojan incluso cuando el servicio no herede el entorno de tu shell.
    2. Habilita la importación de shell (comodidad opcional):

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
    `openclaw models status` informa si la **importación de entorno de shell** está habilitada. "Shell env: off"
    **no** significa que falten tus variables de entorno; solo significa que OpenClaw no cargará
    tu shell de inicio de sesión automáticamente.

    Si el Gateway se ejecuta como servicio (launchd/systemd), no heredará el entorno
    de tu shell. Soluciónalo de una de estas formas:

    1. Coloca el token en `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. O habilita la importación de shell (`env.shellEnv.enabled: true`).
    3. O añádelo al bloque `env` de tu configuración (se aplica solo si falta).

    Luego reinicia el gateway y vuelve a comprobar:

    ```bash
    openclaw models status
    ```

    Los tokens de Copilot se leen desde `COPILOT_GITHUB_TOKEN` (también `GH_TOKEN` / `GITHUB_TOKEN`).
    Consulta [/concepts/model-providers](/es/concepts/model-providers) y [/environment](/es/help/environment).

  </Accordion>
</AccordionGroup>

## Sesiones y varios chats

<AccordionGroup>
  <Accordion title="¿Cómo inicio una conversación nueva?">
    Envía `/new` o `/reset` como mensaje independiente. Consulta [Gestión de sesiones](/es/concepts/session).
  </Accordion>

  <Accordion title="¿Las sesiones se restablecen automáticamente si nunca envío /new?">
    Las sesiones pueden caducar después de `session.idleMinutes`, pero esto está **deshabilitado por defecto** (valor predeterminado **0**).
    Establécelo en un valor positivo para habilitar la caducidad por inactividad. Cuando está habilitado, el **siguiente**
    mensaje después del periodo de inactividad inicia un id de sesión nuevo para esa clave de chat.
    Esto no elimina transcripciones: solo inicia una sesión nueva.

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

    Dicho eso, es mejor verlo como un **experimento divertido**. Consume muchos tokens y a menudo
    es menos eficiente que usar un bot con sesiones separadas. El modelo típico que
    imaginamos es un bot con el que hablas, con distintas sesiones para trabajo paralelo. Ese
    bot también puede generar subagentes cuando sea necesario.

    Documentación: [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [CLI de agentes](/es/cli/agents).

  </Accordion>

  <Accordion title="¿Por qué se truncó el contexto a mitad de tarea? ¿Cómo lo evito?">
    El contexto de sesión está limitado por la ventana del modelo. Chats largos, salidas de herramientas grandes o muchos
    archivos pueden activar Compaction o truncamiento.

    Qué ayuda:

    - Pide al bot que resuma el estado actual y lo escriba en un archivo.
    - Usa `/compact` antes de tareas largas, y `/new` al cambiar de tema.
    - Mantén el contexto importante en el espacio de trabajo y pide al bot que lo vuelva a leer.
    - Usa subagentes para trabajo largo o paralelo, de modo que el chat principal se mantenga más pequeño.
    - Elige un modelo con una ventana de contexto más grande si esto ocurre a menudo.

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
    - Si usaste perfiles (`--profile` / `OPENCLAW_PROFILE`), restablece cada directorio de estado (los valores predeterminados son `~/.openclaw-<profile>`).
    - Restablecimiento de desarrollo: `openclaw gateway --dev --reset` (solo desarrollo; borra configuración de desarrollo + credenciales + sesiones + espacio de trabajo).

  </Accordion>

  <Accordion title='Recibo errores de "context too large": ¿cómo restablezco o compacto?'>
    Usa una de estas opciones:

    - **Compactar** (mantiene la conversación, pero resume turnos anteriores):

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

    - Habilita o ajusta la **poda de sesiones** (`agents.defaults.contextPruning`) para recortar salida antigua de herramientas.
    - Usa un modelo con una ventana de contexto más grande.

    Documentación: [Compaction](/es/concepts/compaction), [Poda de sesiones](/es/concepts/session-pruning), [Gestión de sesiones](/es/concepts/session).

  </Accordion>

  <Accordion title='¿Por qué veo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Este es un error de validación del proveedor: el modelo emitió un bloque `tool_use` sin el
    `input` requerido. Normalmente significa que el historial de sesión está obsoleto o dañado (a menudo después de hilos largos
    o de un cambio de herramienta/esquema).

    Solución: inicia una sesión nueva con `/new` (mensaje independiente).

  </Accordion>

  <Accordion title="¿Por qué recibo mensajes de Heartbeat cada 30 minutos?">
    Los Heartbeats se ejecutan cada **30m** por defecto (**1h** cuando se usa autenticación OAuth). Ajústalos o deshabilítalos:

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

    Si `HEARTBEAT.md` existe pero está efectivamente vacío (solo líneas en blanco,
    comentarios Markdown/HTML, encabezados Markdown como `# Heading`, marcadores de bloque,
    o stubs de listas de verificación vacíos), OpenClaw omite la ejecución de Heartbeat para ahorrar llamadas a la API.
    Si el archivo no existe, Heartbeat se sigue ejecutando y el modelo decide qué hacer.

    Las anulaciones por agente usan `agents.list[].heartbeat`. Documentación: [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title='¿Necesito agregar una "cuenta de bot" a un grupo de WhatsApp?'>
    No. OpenClaw se ejecuta en **tu propia cuenta**, así que si estás en el grupo, OpenClaw puede verlo.
    De forma predeterminada, las respuestas en grupos se bloquean hasta que permitas remitentes (`groupPolicy: "allowlist"`).

    Si quieres que solo **tú** puedas activar respuestas en grupos:

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
    Opción 1 (la más rápida): sigue los registros y envía un mensaje de prueba en el grupo:

    ```bash
    openclaw logs --follow --json
    ```

    Busca `chatId` (o `from`) que termine en `@g.us`, como:
    `1234567890-1234567890@g.us`.

    Opción 2 (si ya está configurado/en la lista de permitidos): lista los grupos desde la configuración:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentación: [WhatsApp](/es/channels/whatsapp), [Directorio](/es/cli/directory), [Registros](/es/cli/logs).

  </Accordion>

  <Accordion title="¿Por qué OpenClaw no responde en un grupo?">
    Dos causas comunes:

    - La activación por mención está habilitada (predeterminado). Debes @mencionar al bot (o coincidir con `mentionPatterns`).
    - Configuraste `channels.whatsapp.groups` sin `"*"` y el grupo no está en la lista de permitidos.

    Consulta [Grupos](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).

  </Accordion>

  <Accordion title="¿Los grupos/hilos comparten contexto con los MD?">
    Los chats directos se contraen a la sesión principal de forma predeterminada. Los grupos/canales tienen sus propias claves de sesión, y los temas de Telegram / hilos de Discord son sesiones separadas. Consulta [Grupos](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).
  </Accordion>

  <Accordion title="¿Cuántos espacios de trabajo y agentes puedo crear?">
    Sin límites estrictos. Decenas (incluso cientos) están bien, pero vigila:

    - **Crecimiento del disco:** las sesiones + transcripciones viven bajo `~/.openclaw/agents/<agentId>/sessions/`.
    - **Costo de tokens:** más agentes significa más uso concurrente del modelo.
    - **Sobrecarga operativa:** perfiles de autenticación, espacios de trabajo y enrutamiento de canales por agente.

    Consejos:

    - Mantén un espacio de trabajo **activo** por agente (`agents.defaults.workspace`).
    - Poda sesiones antiguas (elimina JSONL o entradas de almacenamiento) si el disco crece.
    - Usa `openclaw doctor` para detectar espacios de trabajo sueltos y discrepancias de perfiles.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios bots o chats al mismo tiempo (Slack), y cómo debo configurarlo?">
    Sí. Usa **Enrutamiento Multiagente** para ejecutar varios agentes aislados y enrutar mensajes entrantes por
    canal/cuenta/par. Slack es compatible como canal y puede vincularse a agentes específicos.

    El acceso al navegador es potente, pero no permite "hacer cualquier cosa que pueda hacer una persona": los sistemas antibot, CAPTCHA y MFA pueden
    seguir bloqueando la automatización. Para el control de navegador más fiable, usa Chrome MCP local en el host,
    o usa CDP en la máquina que realmente ejecuta el navegador.

    Configuración recomendada:

    - Host de Gateway siempre activo (VPS/Mac mini).
    - Un agente por rol (vinculaciones).
    - Canales de Slack vinculados a esos agentes.
    - Navegador local mediante Chrome MCP o un nodo cuando sea necesario.

    Documentación: [Enrutamiento Multiagente](/es/concepts/multi-agent), [Slack](/es/channels/slack),
    [Navegador](/es/tools/browser), [Nodos](/es/nodes).

  </Accordion>
</AccordionGroup>

## Modelos, conmutación por error y perfiles de autenticación

Las preguntas frecuentes sobre modelos — valores predeterminados, selección, alias, cambio, conmutación por error, perfiles de autenticación —
viven en las [Preguntas frecuentes sobre modelos](/es/help/faq-models).

## Gateway: puertos, "ya en ejecución" y modo remoto

<AccordionGroup>
  <Accordion title="¿Qué puerto usa el Gateway?">
    `gateway.port` controla el único puerto multiplexado para WebSocket + HTTP (Control UI, hooks, etc.).

    Precedencia:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status dice "Runtime: running" pero "Connectivity probe: failed"?'>
    Porque "running" es la vista del **supervisor** (launchd/systemd/schtasks). La prueba de conectividad es la CLI conectándose realmente al WebSocket del Gateway.

    Usa `openclaw gateway status` y confía en estas líneas:

    - `Probe target:` (la URL que realmente usó la prueba)
    - `Listening:` (lo que realmente está enlazado en el puerto)
    - `Last gateway error:` (causa raíz común cuando el proceso está vivo pero el puerto no está escuchando)

  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status muestra "Config (cli)" y "Config (service)" diferentes?'>
    Estás editando un archivo de configuración mientras el servicio está ejecutando otro (a menudo una discrepancia de `--profile` / `OPENCLAW_STATE_DIR`).

    Corrección:

    ```bash
    openclaw gateway install --force
    ```

    Ejecútalo desde el mismo `--profile` / entorno que quieres que use el servicio.

  </Accordion>

  <Accordion title='¿Qué significa "another gateway instance is already listening"?'>
    OpenClaw aplica un bloqueo de runtime enlazando el listener WebSocket inmediatamente al inicio (predeterminado `ws://127.0.0.1:18789`). Si el enlace falla con `EADDRINUSE`, lanza `GatewayLockError`, que indica que otra instancia ya está escuchando.

    Corrección: detén la otra instancia, libera el puerto o ejecuta con `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="¿Cómo ejecuto OpenClaw en modo remoto (el cliente se conecta a un Gateway en otro lugar)?">
    Establece `gateway.mode: "remote"` y apunta a una URL WebSocket remota, opcionalmente con credenciales remotas de secreto compartido:

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
    - `gateway.remote.token` / `.password` son solo credenciales remotas del lado del cliente; no habilitan autenticación del Gateway local por sí mismas.

  </Accordion>

  <Accordion title='La Control UI dice "unauthorized" (o sigue reconectándose). ¿Y ahora qué?'>
    La ruta de autenticación de tu Gateway y el método de autenticación de la UI no coinciden.

    Hechos (desde el código):

    - La Control UI mantiene el token en `sessionStorage` para la sesión actual de la pestaña del navegador y la URL de Gateway seleccionada, por lo que las actualizaciones en la misma pestaña siguen funcionando sin restaurar la persistencia de tokens de larga duración en localStorage.
    - En `AUTH_TOKEN_MISMATCH`, los clientes de confianza pueden intentar un reintento acotado con un token de dispositivo en caché cuando el Gateway devuelve pistas de reintento (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ese reintento con token en caché ahora reutiliza los alcances aprobados en caché almacenados con el token de dispositivo. Los llamadores con `deviceToken` explícito / `scopes` explícitos siguen manteniendo su conjunto de alcances solicitado en lugar de heredar los alcances en caché.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado, luego token de arranque.
    - El arranque integrado con código de configuración devuelve un token de dispositivo de nodo con `scopes: []` más un token acotado de traspaso de operador para incorporación móvil de confianza. El traspaso de operador puede leer la configuración nativa en tiempo de configuración, pero no concede alcances de mutación de emparejamiento ni `operator.admin`.

    Corrección:

    - Lo más rápido: `openclaw dashboard` (imprime + copia la URL del panel, intenta abrirla; muestra una pista de SSH si no hay interfaz gráfica).
    - Si aún no tienes un token: `openclaw doctor --generate-gateway-token`.
    - Si es remoto, crea primero un túnel: `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`.
    - Modo de secreto compartido: establece `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, luego pega el secreto coincidente en la configuración de Control UI.
    - Modo Tailscale Serve: asegúrate de que `gateway.auth.allowTailscale` esté habilitado y de abrir la URL de Serve, no una URL sin procesar de loopback/tailnet que omita los encabezados de identidad de Tailscale.
    - Modo proxy de confianza: asegúrate de llegar a través del proxy con reconocimiento de identidad configurado, no de una URL sin procesar del Gateway. Los proxies de loopback del mismo host también necesitan `gateway.auth.trustedProxy.allowLoopback = true`.
    - Si la discrepancia persiste después del único reintento, rota/vuelve a aprobar el token del dispositivo emparejado:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Si esa llamada de rotación dice que fue denegada, comprueba dos cosas:
      - las sesiones de dispositivos emparejados solo pueden rotar su **propio** dispositivo a menos que también tengan `operator.admin`
      - los valores explícitos de `--scope` no pueden superar los alcances de operador actuales del llamador
    - ¿Sigues atascado? Ejecuta `openclaw status --all` y sigue [Solución de problemas](/es/gateway/troubleshooting). Consulta [Panel](/es/web/dashboard) para detalles de autenticación.

  </Accordion>

  <Accordion title="Configuré gateway.bind como tailnet, pero no puede enlazar y nada escucha">
    El enlace `tailnet` elige una IP de Tailscale de tus interfaces de red (100.64.0.0/10). Si la máquina no está en Tailscale (o la interfaz está caída), no hay nada a lo que enlazar.

    Corrección:

    - Inicia Tailscale en ese host (para que tenga una dirección 100.x), o
    - Cambia a `gateway.bind: "loopback"` / `"lan"`.

    Nota: `tailnet` es explícito. `auto` prefiere loopback; usa `gateway.bind: "tailnet"` cuando quieras un enlace solo para tailnet.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios Gateways en el mismo host?">
    Normalmente no: un Gateway puede ejecutar varios canales de mensajería y agentes. Usa varios Gateways solo cuando necesites redundancia (p. ej., bot de rescate) o aislamiento estricto.

    Sí, pero debes aislar:

    - `OPENCLAW_CONFIG_PATH` (configuración por instancia)
    - `OPENCLAW_STATE_DIR` (estado por instancia)
    - `agents.defaults.workspace` (aislamiento de espacio de trabajo)
    - `gateway.port` (puertos únicos)

    Configuración rápida (recomendada):

    - Usa `openclaw --profile <name> ...` por instancia (crea automáticamente `~/.openclaw-<name>`).
    - Establece un `gateway.port` único en cada configuración de perfil (o pasa `--port` para ejecuciones manuales).
    - Instala un servicio por perfil: `openclaw --profile <name> gateway install`.

    Los perfiles también añaden un sufijo a los nombres de servicio (`ai.openclaw.<profile>`; heredado `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guía completa: [Varios gateways](/es/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='¿Qué significa "invalid handshake" / código 1008?'>
    El Gateway es un **servidor WebSocket**, y espera que el primer mensaje sea
    un marco `connect`. Si recibe cualquier otra cosa, cierra la conexión
    con **código 1008** (violación de política).

    Causas comunes:

    - Abriste la URL **HTTP** en un navegador (`http://...`) en lugar de un cliente WS.
    - Usaste el puerto o la ruta incorrectos.
    - Un proxy o túnel quitó los encabezados de autenticación o envió una solicitud que no era para el Gateway.

    Correcciones rápidas:

    1. Usa la URL WS: `ws://<host>:18789` (o `wss://...` si es HTTPS).
    2. No abras el puerto WS en una pestaña normal del navegador.
    3. Si la autenticación está activada, incluye el token/contraseña en el marco `connect`.

    Si usas la CLI o la TUI, la URL debería verse así:

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

    Puedes establecer una ruta estable mediante `logging.file`. El nivel de registro en archivo se controla con `logging.level`. La verbosidad de la consola se controla con `--verbose` y `logging.consoleLevel`.

    Seguimiento de registros más rápido:

    ```bash
    openclaw logs --follow
    ```

    Registros del servicio/supervisor (cuando el Gateway se ejecuta mediante launchd/systemd):

    - stdout de launchd en macOS: `~/Library/Logs/openclaw/gateway.log` (los perfiles usan `gateway-<profile>.log`; stderr se suprime)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Consulta [Solución de problemas](/es/gateway/troubleshooting) para obtener más información.

  </Accordion>

  <Accordion title="¿Cómo inicio/detengo/reinicio el servicio Gateway?">
    Usa los ayudantes del gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Si ejecutas el gateway manualmente, `openclaw gateway --force` puede recuperar el puerto. Consulta [Gateway](/es/gateway).

  </Accordion>

  <Accordion title="Cerré mi terminal en Windows: ¿cómo reinicio OpenClaw?">
    Hay **tres modos de instalación en Windows**:

    **1) Configuración local de Windows Hub:** la aplicación nativa administra un Gateway WSL local propiedad de la aplicación.

    Abre **OpenClaw Companion** desde el menú Inicio o la bandeja y luego usa
    **Configuración de Gateway** o la pestaña Conexiones.

    **2) Gateway WSL2 manual:** el Gateway se ejecuta dentro de Linux.

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

    **3) CLI/Gateway nativo de Windows:** el Gateway se ejecuta directamente en Windows.

    Abre PowerShell y ejecuta:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Si lo ejecutas manualmente (sin servicio), usa:

    ```powershell
    openclaw gateway run
    ```

    Documentación: [Windows](/es/platforms/windows), [Guía operativa del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="El Gateway está activo, pero las respuestas nunca llegan. ¿Qué debo revisar?">
    Empieza con una comprobación rápida de estado:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causas comunes:

    - La autenticación del modelo no está cargada en el **host del gateway** (revisa `models status`).
    - El emparejamiento/lista de permitidos del canal bloquea las respuestas (revisa la configuración del canal y los registros).
    - WebChat/Dashboard está abierto sin el token correcto.

    Si estás en remoto, confirma que la conexión del túnel/Tailscale está activa y que el
    WebSocket del Gateway es accesible.

    Documentación: [Canales](/es/channels), [Solución de problemas](/es/gateway/troubleshooting), [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title='"Desconectado del gateway: sin motivo": ¿qué hago ahora?'>
    Normalmente esto significa que la interfaz perdió la conexión WebSocket. Revisa:

    1. ¿El Gateway está en ejecución? `openclaw gateway status`
    2. ¿El Gateway está sano? `openclaw status`
    3. ¿La interfaz tiene el token correcto? `openclaw dashboard`
    4. Si estás en remoto, ¿el enlace de túnel/Tailscale está activo?

    Luego sigue los registros:

    ```bash
    openclaw logs --follow
    ```

    Documentación: [Dashboard](/es/web/dashboard), [Acceso remoto](/es/gateway/remote), [Solución de problemas](/es/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands falla. ¿Qué debo revisar?">
    Empieza con los registros y el estado del canal:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Luego relaciona el error:

    - `BOT_COMMANDS_TOO_MUCH`: el menú de Telegram tiene demasiadas entradas. OpenClaw ya recorta hasta el límite de Telegram y reintenta con menos comandos, pero aún es necesario eliminar algunas entradas del menú. Reduce los comandos de plugin/skill/personalizados, o desactiva `channels.telegram.commands.native` si no necesitas el menú.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` o errores de red similares: si estás en un VPS o detrás de un proxy, confirma que HTTPS saliente esté permitido y que DNS funcione para `api.telegram.org`.

    Si el Gateway está en remoto, asegúrate de estar mirando los registros en el host del Gateway.

    Documentación: [Telegram](/es/channels/telegram), [Solución de problemas de canales](/es/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI no muestra ninguna salida. ¿Qué debo revisar?">
    Primero confirma que el Gateway sea accesible y que el agente pueda ejecutarse:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    En la TUI, usa `/status` para ver el estado actual. Si esperas respuestas en un canal
    de chat, asegúrate de que la entrega esté habilitada (`/deliver on`).

    Documentación: [TUI](/es/web/tui), [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo detengo por completo y luego inicio el Gateway?">
    Si instalaste el servicio:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Esto detiene/inicia el **servicio supervisado** (launchd en macOS, systemd en Linux).
    Usa esto cuando el Gateway se ejecute en segundo plano como daemon.

    Si lo estás ejecutando en primer plano, detén con Ctrl-C y luego:

    ```bash
    openclaw gateway run
    ```

    Documentación: [Guía operativa del servicio Gateway](/es/gateway).

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

## Medios y adjuntos

<AccordionGroup>
  <Accordion title="Mi Skill generó una imagen/PDF, pero no se envió nada">
    Los adjuntos salientes del agente deben usar campos de medios estructurados como `media`, `mediaUrl`, `path` o `filePath`. Consulta [Configuración del asistente OpenClaw](/es/start/openclaw) y [Envío del agente](/es/tools/agent-send).

    Envío con CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Revisa también:

    - El canal de destino admite medios salientes y no está bloqueado por listas de permitidos.
    - El archivo está dentro de los límites de tamaño del proveedor (las imágenes se redimensionan a un máximo de 2048 px).
    - `tools.fs.workspaceOnly=true` mantiene los envíos de rutas locales limitados al workspace, temp/media-store y archivos validados por el sandbox.
    - `tools.fs.workspaceOnly=false` permite que los envíos de medios locales estructurados usen archivos locales del host que el agente ya puede leer, pero solo para medios y tipos de documentos seguros (imágenes, audio, video, PDF, documentos de Office y documentos de texto validados como Markdown/MD, TXT, JSON, YAML y YML). Esto no es un escáner de secretos: un `secret.txt` o `config.json` legible por el agente se puede adjuntar cuando la extensión y la validación de contenido coinciden. Mantén los archivos sensibles fuera de rutas legibles por el agente, o conserva `tools.fs.workspaceOnly=true` para envíos de rutas locales más estrictos.

    Consulta [Imágenes](/es/nodes/images).

  </Accordion>
</AccordionGroup>

## Seguridad y control de acceso

<AccordionGroup>
  <Accordion title="¿Es seguro exponer OpenClaw a MD entrantes?">
    Trata los MD entrantes como entrada no confiable. Los valores predeterminados están diseñados para reducir el riesgo:

    - El comportamiento predeterminado en canales compatibles con MD es **emparejamiento**:
      - Los remitentes desconocidos reciben un código de emparejamiento; el bot no procesa su mensaje.
      - Aprueba con: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Las solicitudes pendientes tienen un límite de **3 por canal**; revisa `openclaw pairing list --channel <channel> [--account <id>]` si no llegó un código.
    - Abrir MD públicamente requiere una aceptación explícita (`dmPolicy: "open"` y lista de permitidos `"*"`).

    Ejecuta `openclaw doctor` para mostrar políticas de MD riesgosas.

  </Accordion>

  <Accordion title="¿La inyección de prompts solo es un problema para bots públicos?">
    No. La inyección de prompts se trata de **contenido no confiable**, no solo de quién puede enviar MD al bot.
    Si tu asistente lee contenido externo (búsqueda/obtención web, páginas del navegador, correos,
    documentos, adjuntos, registros pegados), ese contenido puede incluir instrucciones que intenten
    secuestrar el modelo. Esto puede suceder incluso si **tú eres el único remitente**.

    El mayor riesgo aparece cuando las herramientas están habilitadas: se puede engañar al modelo para que
    exfiltre contexto o llame herramientas en tu nombre. Reduce el radio de impacto mediante:

    - usar un agente "lector" de solo lectura o sin herramientas para resumir contenido no confiable
    - mantener `web_search` / `web_fetch` / `browser` desactivados para agentes con herramientas habilitadas
    - tratar también como no confiable el texto decodificado de archivos/documentos: OpenResponses
      `input_file` y la extracción de adjuntos multimedia envuelven el texto extraído en
      marcadores explícitos de límite de contenido externo en lugar de pasar texto de archivo sin procesar
    - sandboxing y listas de permitidos estrictas para herramientas

    Detalles: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿OpenClaw es menos seguro porque usa TypeScript/Node en lugar de Rust/WASM?">
    El lenguaje y el runtime importan, pero no son el riesgo principal para un agente personal.
    Los riesgos prácticos de OpenClaw son la exposición del gateway, quién puede enviar mensajes al
    bot, la inyección de prompts, el alcance de las herramientas, la gestión de credenciales, el acceso al navegador, el acceso de exec
    y la confianza en skills o plugins de terceros.

    Rust y WASM pueden proporcionar un aislamiento más fuerte para algunas clases de código, pero
    no resuelven la inyección de prompts, listas de permitidos incorrectas, exposición pública del gateway,
    herramientas demasiado amplias ni un perfil de navegador que ya inició sesión en cuentas sensibles.
    Trata esos elementos como los controles principales:

    - mantener el Gateway privado o autenticado
    - usar emparejamiento y listas de permitidos para MD y grupos
    - denegar o aislar herramientas riesgosas para entradas no confiables
    - instalar solo plugins y Skills confiables
    - ejecutar `openclaw security audit --deep` después de cambios de configuración

    Detalles: [Seguridad](/es/gateway/security), [Sandboxing](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="Vi informes sobre instancias de OpenClaw expuestas. ¿Qué debo revisar?">
    Primero revisa tu despliegue real:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Una base más segura es:

    - Gateway enlazado a `loopback`, o expuesto solo mediante acceso privado autenticado
      como una tailnet, túnel SSH, autenticación con token/contraseña o un proxy de confianza
      configurado correctamente
    - MD en modo `pairing` o `allowlist`
    - grupos en listas de permitidos y con puerta por mención, salvo que todos los miembros sean de confianza
    - herramientas de alto riesgo (`exec`, `browser`, `gateway`, `cron`) denegadas o con alcance estricto
      para agentes que leen contenido no confiable
    - sandboxing habilitado donde la ejecución de herramientas necesite un radio de impacto menor

    Enlaces públicos sin autenticación, MD/grupos abiertos con herramientas y control de navegador
    expuesto son los hallazgos que debes corregir primero. Detalles:
    [Lista de verificación de auditoría de seguridad](/es/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="¿Es seguro instalar Skills de ClawHub y plugins de terceros?">
    Trata las Skills y los plugins de terceros como código en el que decides confiar.
    Las páginas de Skills de ClawHub exponen el estado de escaneo antes de instalar, pero los escaneos no son un
    límite de seguridad completo. OpenClaw no ejecuta bloqueo local integrado de
    código peligroso durante los flujos de instalación/actualización de plugins o Skills; usa
    `security.installPolicy` gestionado por el operador para decisiones locales de permitir/bloquear.

    Patrón más seguro:

    - preferir autores de confianza y versiones fijadas
    - leer la Skill o el plugin antes de habilitarlo
    - mantener estrechas las listas de permitidos de plugins y Skills
    - ejecutar flujos de trabajo con entradas no confiables en un sandbox con herramientas mínimas
    - evitar dar a código de terceros acceso amplio al sistema de archivos, exec, navegador o secretos

    Detalles: [Skills](/es/tools/skills), [Plugins](/es/tools/plugin),
    [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Mi bot debería tener su propio correo electrónico, cuenta de GitHub o número de teléfono?">
    Sí, para la mayoría de las configuraciones. Aislar el bot con cuentas y números de teléfono
    separados reduce el radio de impacto si algo sale mal. Esto también facilita rotar
    credenciales o revocar el acceso sin afectar tus cuentas personales.

    Empieza con poco. Da acceso solo a las herramientas y cuentas que realmente necesitas, y amplíalo
    más adelante si es necesario.

    Documentación: [Seguridad](/es/gateway/security), [Emparejamiento](/es/channels/pairing).

  </Accordion>

  <Accordion title="¿Puedo darle autonomía sobre mis mensajes de texto y es seguro?">
    **No** recomendamos autonomía completa sobre tus mensajes personales. El patrón más seguro es:

    - Mantener los DM en **modo de emparejamiento** o en una lista de permitidos estricta.
    - Usar un **número o cuenta separados** si quieres que envíe mensajes en tu nombre.
    - Dejar que redacte y luego **aprobar antes de enviar**.

    Si quieres experimentar, hazlo en una cuenta dedicada y mantenla aislada. Consulta
    [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Puedo usar modelos más baratos para tareas de asistente personal?">
    Sí, **si** el agente solo usa chat y la entrada es de confianza. Los niveles más pequeños son
    más susceptibles al secuestro de instrucciones, así que evítalos para agentes con herramientas
    habilitadas o al leer contenido no confiable. Si debes usar un modelo más pequeño, restringe
    las herramientas y ejecútalo dentro de un entorno aislado. Consulta [Seguridad](/es/gateway/security).
  </Accordion>

  <Accordion title="Ejecuté /start en Telegram, pero no recibí un código de emparejamiento">
    Los códigos de emparejamiento se envían **solo** cuando un remitente desconocido envía un mensaje al bot y
    `dmPolicy: "pairing"` está habilitado. `/start` por sí solo no genera un código.

    Revisa las solicitudes pendientes:

    ```bash
    openclaw pairing list telegram
    ```

    Si quieres acceso inmediato, agrega el id de tu remitente a la lista de permitidos o establece `dmPolicy: "open"`
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

    Solicitud del número de teléfono en el asistente: se usa para establecer tu **lista de permitidos/propietario**, de modo que tus propios DM estén permitidos. No se usa para envíos automáticos. Si lo ejecutas con tu número personal de WhatsApp, usa ese número y habilita `channels.whatsapp.selfChatMode`.

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

    Si aún hay demasiado ruido, revisa la configuración de la sesión en la interfaz de Control y establece verbose
    en **heredar**. Confirma también que no estés usando un perfil de bot con `verboseDefault` establecido
    en `on` en la configuración.

    Documentación: [Pensamiento y verbose](/es/tools/thinking), [Seguridad](/es/gateway/security/index#reasoning-and-verbose-output-in-groups).

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

    Estos son activadores de cancelación (no comandos con barra).

    Para procesos en segundo plano (desde la herramienta exec), puedes pedirle al agente que ejecute:

    ```
    process action:kill sessionId:XXX
    ```

    Resumen de comandos con barra: consulta [Comandos con barra](/es/tools/slash-commands).

    La mayoría de los comandos deben enviarse como un mensaje **independiente** que empiece con `/`, pero algunos atajos (como `/status`) también funcionan en línea para remitentes en la lista de permitidos.

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

  <Accordion title='¿Por qué parece que el bot "ignora" mensajes rápidos consecutivos?'>
    Las indicaciones enviadas durante una ejecución se redirigen a la ejecución activa de forma predeterminada. Usa `/queue` para elegir el comportamiento de la ejecución activa:

    - `steer` - guiar la ejecución activa en el siguiente límite del modelo
    - `followup` - poner mensajes en cola y ejecutarlos uno a uno después de que termine la ejecución actual
    - `collect` - poner en cola mensajes compatibles y responder una vez después de que termine la ejecución actual
    - `interrupt` - cancelar la ejecución actual y empezar de nuevo

    El modo predeterminado es `steer`. Puedes agregar opciones como `debounce:0.5s cap:25 drop:summarize` para modos en cola. Consulta [Cola de comandos](/es/concepts/queue) y [Cola de direccionamiento](/es/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Varios

<AccordionGroup>
  <Accordion title='¿Cuál es el modelo predeterminado para Anthropic con una clave de API?'>
    En OpenClaw, las credenciales y la selección de modelo están separadas. Establecer `ANTHROPIC_API_KEY` (o almacenar una clave de API de Anthropic en perfiles de autenticación) habilita la autenticación, pero el modelo predeterminado real es el que configures en `agents.defaults.model.primary` (por ejemplo, `anthropic/claude-sonnet-4-6` o `anthropic/claude-opus-4-6`). Si ves `No credentials found for profile "anthropic:default"`, significa que el Gateway no pudo encontrar credenciales de Anthropic en el `auth-profiles.json` esperado para el agente que se está ejecutando.
  </Accordion>
</AccordionGroup>

---

¿Sigues atascado? Pregunta en [Discord](https://discord.com/invite/clawd) o abre una [discusión de GitHub](https://github.com/openclaw/openclaw/discussions).

## Relacionado

- [Preguntas frecuentes de la primera ejecución](/es/help/faq-first-run) — instalación, incorporación, autenticación, suscripciones, fallos iniciales
- [Preguntas frecuentes sobre modelos](/es/help/faq-models) — selección de modelo, conmutación por error, perfiles de autenticación
- [Solución de problemas](/es/help/troubleshooting) — triaje por síntoma
