---
read_when:
    - Responder preguntas frecuentes de configuración, instalación, incorporación o soporte en tiempo de ejecución
    - Clasificación de problemas informados por usuarios antes de una depuración más profunda
summary: Preguntas frecuentes sobre la instalación, configuración y uso de OpenClaw
title: Preguntas frecuentes
x-i18n:
    generated_at: "2026-06-27T11:41:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

Respuestas rápidas y solución de problemas más profunda para configuraciones reales (desarrollo local, VPS, multiagente, OAuth/claves de API, conmutación por error de modelos). Para diagnósticos de runtime, consulta [Solución de problemas](/es/gateway/troubleshooting). Para la referencia completa de configuración, consulta [Configuración](/es/gateway/configuration).

## Primeros 60 segundos si algo está roto

1. **Estado rápido (primera comprobación)**

   ```bash
   openclaw status
   ```

   Resumen local rápido: SO + actualización, accesibilidad de gateway/servicio, agentes/sesiones, configuración de proveedor + problemas de runtime (cuando el Gateway está accesible).

2. **Informe pegable (seguro para compartir)**

   ```bash
   openclaw status --all
   ```

   Diagnóstico de solo lectura con cola de logs (tokens redactados).

3. **Estado del daemon + puerto**

   ```bash
   openclaw gateway status
   ```

   Muestra el runtime del supervisor frente a la accesibilidad RPC, la URL de destino de la sonda y qué configuración probablemente usó el servicio.

4. **Sondas profundas**

   ```bash
   openclaw status --deep
   ```

   Ejecuta una sonda de estado en vivo del Gateway, incluidas sondas de canal cuando son compatibles
   (requiere un Gateway accesible). Consulta [Salud](/es/gateway/health).

5. **Seguir el log más reciente**

   ```bash
   openclaw logs --follow
   ```

   Si RPC no está disponible, usa como alternativa:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Los logs de archivo están separados de los logs de servicio; consulta [Registro](/es/logging) y [Solución de problemas](/es/gateway/troubleshooting).

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

   Solicita al Gateway en ejecución una instantánea completa (solo WS). Consulta [Salud](/es/gateway/health).

## Inicio rápido y configuración de primer uso

Las preguntas y respuestas del primer uso — instalación, onboarding, rutas de autenticación, suscripciones, fallos iniciales —
están en las [Preguntas frecuentes del primer uso](/es/help/faq-first-run).

## ¿Qué es OpenClaw?

<AccordionGroup>
  <Accordion title="¿Qué es OpenClaw, en un párrafo?">
    OpenClaw es un asistente de IA personal que ejecutas en tus propios dispositivos. Responde en las superficies de mensajería que ya usas (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat y Plugins de canal incluidos como QQ Bot) y también puede usar voz + un Canvas en vivo en plataformas compatibles. El **Gateway** es el plano de control siempre activo; el asistente es el producto.
  </Accordion>

  <Accordion title="Propuesta de valor">
    OpenClaw no es "solo un wrapper de Claude". Es un **plano de control local-first** que te permite ejecutar un
    asistente capaz en **tu propio hardware**, accesible desde las apps de chat que ya usas, con
    sesiones con estado, memoria y herramientas, sin entregar el control de tus flujos de trabajo a un
    SaaS alojado.

    Puntos destacados:

    - **Tus dispositivos, tus datos:** ejecuta el Gateway donde quieras (Mac, Linux, VPS) y mantén el
      workspace + historial de sesiones en local.
    - **Canales reales, no un sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      además de voz móvil y Canvas en plataformas compatibles.
    - **Independiente del modelo:** usa Anthropic, OpenAI, MiniMax, OpenRouter, etc., con enrutamiento
      y conmutación por error por agente.
    - **Opción solo local:** ejecuta modelos locales para que **todos los datos puedan permanecer en tu dispositivo** si quieres.
    - **Enrutamiento multiagente:** agentes separados por canal, cuenta o tarea, cada uno con su propio
      workspace y valores predeterminados.
    - **Código abierto y modificable:** inspecciona, amplía y autoaloja sin dependencia de proveedor.

    Docs: [Gateway](/es/gateway), [Canales](/es/channels), [Multiagente](/es/concepts/multi-agent),
    [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="Acabo de configurarlo: ¿qué debería hacer primero?">
    Buenos primeros proyectos:

    - Construir un sitio web (WordPress, Shopify o un sitio estático simple).
    - Prototipar una app móvil (esquema, pantallas, plan de API).
    - Organizar archivos y carpetas (limpieza, nombres, etiquetas).
    - Conectar Gmail y automatizar resúmenes o seguimientos.

    Puede manejar tareas grandes, pero funciona mejor cuando las divides en fases y
    usas subagentes para trabajo en paralelo.

  </Accordion>

  <Accordion title="¿Cuáles son los cinco principales casos de uso cotidianos de OpenClaw?">
    Las victorias cotidianas suelen verse así:

    - **Resúmenes personales:** resúmenes de bandeja de entrada, calendario y noticias que te importan.
    - **Investigación y redacción:** investigación rápida, resúmenes y primeros borradores para correos o docs.
    - **Recordatorios y seguimientos:** avisos y listas de verificación impulsados por Cron o Heartbeat.
    - **Automatización del navegador:** completar formularios, recopilar datos y repetir tareas web.
    - **Coordinación entre dispositivos:** envía una tarea desde tu teléfono, deja que el Gateway la ejecute en un servidor y recibe el resultado de vuelta en el chat.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ayudar con generación de leads, prospección, anuncios y blogs para un SaaS?">
    Sí para **investigación, calificación y redacción**. Puede escanear sitios, crear listas cortas,
    resumir prospectos y escribir borradores de prospección o texto publicitario.

    Para **campañas de prospección o anuncios**, mantén a una persona en el circuito. Evita el spam, cumple las leyes locales y
    las políticas de la plataforma, y revisa todo antes de que se envíe. El patrón más seguro es dejar que
    OpenClaw redacte y tú apruebes.

    Docs: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Cuáles son las ventajas frente a Claude Code para desarrollo web?">
    OpenClaw es un **asistente personal** y una capa de coordinación, no un reemplazo del IDE. Usa
    Claude Code o Codex para el ciclo de codificación directa más rápido dentro de un repo. Usa OpenClaw cuando
    quieras memoria duradera, acceso entre dispositivos y orquestación de herramientas.

    Ventajas:

    - **Memoria persistente + workspace** entre sesiones
    - **Acceso multiplataforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orquestación de herramientas** (navegador, archivos, programación, hooks)
    - **Gateway siempre activo** (ejecútalo en un VPS, interactúa desde cualquier lugar)
    - **Nodes** para navegador/pantalla/cámara/exec locales

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills y automatización

<AccordionGroup>
  <Accordion title="¿Cómo personalizo Skills sin dejar el repo sucio?">
    Usa overrides administrados en lugar de editar la copia del repo. Pon tus cambios en `~/.openclaw/skills/<name>/SKILL.md` (o agrega una carpeta mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json`). La precedencia es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluidas → `skills.load.extraDirs`, por lo que los overrides administrados siguen teniendo prioridad sobre las Skills incluidas sin tocar git. Si necesitas que la skill esté instalada globalmente pero solo sea visible para algunos agentes, mantén la copia compartida en `~/.openclaw/skills` y controla la visibilidad con `agents.defaults.skills` y `agents.list[].skills`. Solo las ediciones aptas para upstream deberían vivir en el repo y salir como PRs.
  </Accordion>

  <Accordion title="¿Puedo cargar Skills desde una carpeta personalizada?">
    Sí. Agrega directorios adicionales mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json` (precedencia más baja). La precedencia predeterminada es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluidas → `skills.load.extraDirs`. `clawhub` instala en `./skills` de forma predeterminada, que OpenClaw trata como `<workspace>/skills` en la siguiente sesión. Si la skill solo debe ser visible para ciertos agentes, combínalo con `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="¿Cómo puedo usar distintos modelos o ajustes para distintas tareas?">
    Hoy los patrones compatibles son:

    - **Trabajos Cron**: los trabajos aislados pueden establecer un override de `model` por trabajo.
    - **Agentes**: enruta tareas a agentes separados con distintos modelos predeterminados, niveles de razonamiento y parámetros de stream.
    - **Cambio bajo demanda**: usa `/model` para cambiar el modelo de la sesión actual en cualquier momento.

    Por ejemplo, usa el mismo modelo con distintos ajustes por agente:

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

    Pon los valores predeterminados compartidos por modelo en `agents.defaults.models["provider/model"].params`, luego pon los overrides específicos del agente en `agents.list[].params` planos. No definas entradas anidadas separadas `agents.list[].models["provider/model"].params` para el mismo modelo; `agents.list[].models` es para el catálogo de modelos y overrides de runtime por agente.

    Consulta [Trabajos Cron](/es/automation/cron-jobs), [Enrutamiento multiagente](/es/concepts/multi-agent), [Configuración](/es/gateway/config-agents) y [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="El bot se congela mientras hace trabajo pesado. ¿Cómo lo descargo?">
    Usa **subagentes** para tareas largas o paralelas. Los subagentes se ejecutan en su propia sesión,
    devuelven un resumen y mantienen tu chat principal receptivo.

    Pide a tu bot que "spawn a sub-agent for this task" o usa `/subagents`.
    Usa `/status` en el chat para ver qué está haciendo el Gateway ahora mismo (y si está ocupado).

    Consejo sobre tokens: las tareas largas y los subagentes consumen tokens. Si el costo preocupa, establece un
    modelo más barato para subagentes mediante `agents.defaults.subagents.model`.

    Docs: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Cómo funcionan las sesiones de subagente vinculadas a hilos en Discord?">
    Usa vinculaciones de hilo. Puedes vincular un hilo de Discord a un subagente o destino de sesión para que los mensajes de seguimiento en ese hilo permanezcan en esa sesión vinculada.

    Flujo básico:

    - Genera con `sessions_spawn` usando `thread: true` (y opcionalmente `mode: "session"` para seguimiento persistente).
    - O vincula manualmente con `/focus <target>`.
    - Usa `/agents` para inspeccionar el estado de vinculación.
    - Usa `/session idle <duration|off>` y `/session max-age <duration|off>` para controlar el desenfoque automático.
    - Usa `/unfocus` para desvincular el hilo.

    Configuración requerida:

    - Valores predeterminados globales: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Overrides de Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Vinculación automática al generar: `channels.discord.threadBindings.spawnSessions` tiene `true` como valor predeterminado; establécelo en `false` para desactivar generaciones de sesión vinculadas a hilo.

    Docs: [Subagentes](/es/tools/subagents), [Discord](/es/channels/discord), [Referencia de configuración](/es/gateway/configuration-reference), [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagente terminó, pero la actualización de finalización fue al lugar equivocado o nunca se publicó. ¿Qué debo revisar?">
    Revisa primero la ruta del solicitante resuelta:

    - La entrega de subagente en modo de finalización prefiere cualquier hilo vinculado o ruta de conversación cuando existe.
    - Si el origen de finalización solo lleva un canal, OpenClaw recurre a la ruta almacenada de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa aún pueda tener éxito.
    - Si no existe una ruta vinculada ni una ruta almacenada utilizable, la entrega directa puede fallar y el resultado recurre a entrega de sesión en cola en lugar de publicarse inmediatamente en el chat.
    - Los destinos inválidos u obsoletos aún pueden forzar la alternativa de cola o un fallo de entrega final.
    - Si la última respuesta visible del asistente hijo es el token silencioso exacto `NO_REPLY` / `no_reply`, o exactamente `ANNOUNCE_SKIP`, OpenClaw suprime intencionalmente el anuncio en lugar de publicar progreso anterior obsoleto.
    - La salida de tool/toolResult no se promueve al texto del resultado hijo; el resultado es la última respuesta visible del asistente hijo.

    Depuración:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks), [Herramientas de sesión](/es/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o los recordatorios no se ejecutan. ¿Qué debo comprobar?">
    Cron se ejecuta dentro del proceso de Gateway. Si Gateway no se ejecuta continuamente,
    los trabajos programados no se ejecutarán.

    Lista de comprobación:

    - Confirma que cron esté habilitado (`cron.enabled`) y que `OPENCLAW_SKIP_CRON` no esté definido.
    - Comprueba que Gateway se esté ejecutando 24/7 (sin suspensión ni reinicios).
    - Verifica la configuración de zona horaria del trabajo (`--tz` frente a la zona horaria del host).

    Depuración:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentación: [Trabajos de Cron](/es/automation/cron-jobs), [Automatización](/es/automation).

  </Accordion>

  <Accordion title="Cron se ejecutó, pero no se envió nada al canal. ¿Por qué?">
    Comprueba primero el modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"` significa que no se espera ningún envío de reserva del ejecutor.
    - Un destino de anuncio ausente o no válido (`channel` / `to`) significa que el ejecutor omitió la entrega saliente.
    - Los fallos de autenticación del canal (`unauthorized`, `Forbidden`) significan que el ejecutor intentó entregar, pero las credenciales lo bloquearon.
    - Un resultado aislado silencioso (solo `NO_REPLY` / `no_reply`) se trata como intencionalmente no entregable, por lo que el ejecutor también suprime la entrega de reserva en cola.

    Para trabajos de Cron aislados, el agente todavía puede enviar directamente con la herramienta
    `message` cuando hay una ruta de chat disponible. `--announce` solo controla la ruta
    de reserva del ejecutor para el texto final que el agente aún no haya enviado.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Trabajos de Cron](/es/automation/cron-jobs), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Por qué una ejecución aislada de Cron cambió de modelo o reintentó una vez?">
    Por lo general, esa es la ruta de cambio de modelo en vivo, no una programación duplicada.

    Cron aislado puede persistir un traspaso de modelo en tiempo de ejecución y reintentar cuando la ejecución
    activa lanza `LiveSessionModelSwitchError`. El reintento conserva el proveedor/modelo
    cambiado y, si el cambio incluía una nueva anulación de perfil de autenticación, Cron
    también la persiste antes de reintentar.

    Reglas de selección relacionadas:

    - La anulación de modelo del hook de Gmail gana primero cuando corresponde.
    - Luego `model` por trabajo.
    - Luego cualquier anulación de modelo de sesión de Cron almacenada.
    - Luego la selección normal de modelo del agente/predeterminado.

    El bucle de reintentos está acotado. Después del intento inicial más 2 reintentos de cambio,
    Cron aborta en lugar de entrar en un bucle infinito.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Trabajos de Cron](/es/automation/cron-jobs), [CLI de cron](/es/cli/cron).

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

    `openclaw skills install` nativo escribe en el directorio `skills/` del espacio de trabajo activo
    de forma predeterminada. Añade `--global` para instalar en el directorio compartido administrado
    de Skills para todos los agentes locales. Instala la CLI `clawhub` separada
    solo si quieres publicar o sincronizar tus propias Skills. Usa
    `agents.defaults.skills` o `agents.list[].skills` si quieres restringir
    qué agentes pueden ver las Skills compartidas.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ejecutar tareas según una programación o continuamente en segundo plano?">
    Sí. Usa el programador de Gateway:

    - **Trabajos de Cron** para tareas programadas o recurrentes (persisten entre reinicios).
    - **Heartbeat** para comprobaciones periódicas de la "sesión principal".
    - **Trabajos aislados** para agentes autónomos que publican resúmenes o entregan en chats.

    Documentación: [Trabajos de Cron](/es/automation/cron-jobs), [Automatización](/es/automation),
    [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title="¿Puedo ejecutar Skills exclusivas de Apple macOS desde Linux?">
    No directamente. Las Skills de macOS están restringidas por `metadata.openclaw.os` más los binarios requeridos, y las Skills solo aparecen en el prompt del sistema cuando son elegibles en el **host de Gateway**. En Linux, las Skills exclusivas de `darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) no se cargarán a menos que anules la restricción.

    Tienes tres patrones compatibles:

    **Opción A - ejecutar Gateway en una Mac (lo más simple).**
    Ejecuta Gateway donde existan los binarios de macOS y luego conéctate desde Linux en [modo remoto](#gateway-ports-already-running-and-remote-mode) o mediante Tailscale. Las Skills se cargan normalmente porque el host de Gateway es macOS.

    **Opción B - usar un nodo de macOS (sin SSH).**
    Ejecuta Gateway en Linux, empareja un nodo de macOS (aplicación de la barra de menús) y define **Comandos de ejecución de Node** como "Preguntar siempre" o "Permitir siempre" en la Mac. OpenClaw puede tratar las Skills exclusivas de macOS como elegibles cuando los binarios requeridos existen en el nodo. El agente ejecuta esas Skills mediante la herramienta `nodes`. Si eliges "Preguntar siempre", aprobar "Permitir siempre" en el prompt añade ese comando a la lista de permitidos.

    **Opción C - usar un proxy para binarios de macOS mediante SSH (avanzado).**
    Mantén Gateway en Linux, pero haz que los binarios de CLI requeridos se resuelvan a wrappers SSH que se ejecuten en una Mac. Luego anula la Skill para permitir Linux de modo que siga siendo elegible.

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

    4. Inicia una nueva sesión para que se actualice la instantánea de Skills.

  </Accordion>

  <Accordion title="¿Tienen una integración con Notion o HeyGen?">
    No integrada hoy.

    Opciones:

    - **Skill / plugin personalizado:** lo mejor para un acceso confiable a la API (Notion/HeyGen tienen APIs).
    - **Automatización del navegador:** funciona sin código, pero es más lenta y más frágil.

    Si quieres mantener contexto por cliente (flujos de trabajo de agencia), un patrón simple es:

    - Una página de Notion por cliente (contexto + preferencias + trabajo activo).
    - Pide al agente que obtenga esa página al inicio de una sesión.

    Si quieres una integración nativa, abre una solicitud de función o crea una Skill
    orientada a esas APIs.

    Instala Skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Las instalaciones nativas terminan en el directorio `skills/` del espacio de trabajo activo. Para Skills compartidas entre todos los agentes locales, usa `openclaw skills install @owner/<skill-slug> --global` (o colócalas manualmente en `~/.openclaw/skills/<name>/SKILL.md`). Si solo algunos agentes deben ver una instalación compartida, configura `agents.defaults.skills` o `agents.list[].skills`. Algunas Skills esperan binarios instalados mediante Homebrew; en Linux eso significa Linuxbrew (consulta la entrada de preguntas frecuentes de Homebrew para Linux de arriba). Consulta [Skills](/es/tools/skills), [configuración de Skills](/es/tools/skills-config) y [ClawHub](/es/clawhub).

  </Accordion>

  <Accordion title="¿Cómo uso mi Chrome existente con sesión iniciada con OpenClaw?">
    Usa el perfil de navegador `user` integrado, que se adjunta mediante Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Si quieres un nombre personalizado, crea un perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Esta ruta puede usar el navegador host local o un nodo de navegador conectado. Si Gateway se ejecuta en otro lugar, ejecuta un host de nodo en la máquina del navegador o usa CDP remoto.

    Límites actuales de `existing-session` / `user`:

    - las acciones se basan en referencias, no en selectores CSS
    - las cargas requieren `ref` / `inputRef` y actualmente admiten un archivo a la vez
    - `responsebody`, exportación de PDF, interceptación de descargas y acciones por lotes aún necesitan un navegador administrado o un perfil CDP sin procesar

  </Accordion>
</AccordionGroup>

## Aislamiento y memoria

<AccordionGroup>
  <Accordion title="¿Hay una documentación dedicada al aislamiento?">
    Sí. Consulta [Aislamiento](/es/gateway/sandboxing). Para la configuración específica de Docker (Gateway completo en Docker o imágenes de aislamiento), consulta [Docker](/es/install/docker).
  </Accordion>

  <Accordion title="Docker se siente limitado - ¿cómo habilito todas las funciones?">
    La imagen predeterminada prioriza la seguridad y se ejecuta como el usuario `node`, por lo que no
    incluye paquetes del sistema, Homebrew ni navegadores incluidos. Para una configuración más completa:

    - Persiste `/home/node` con `OPENCLAW_HOME_VOLUME` para que las cachés sobrevivan.
    - Incorpora dependencias del sistema en la imagen con `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Instala navegadores de Playwright mediante la CLI incluida:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Define `PLAYWRIGHT_BROWSERS_PATH` y asegúrate de que la ruta persista.

    Documentación: [Docker](/es/install/docker), [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Puedo mantener los MD personales pero hacer que los grupos sean públicos/aislados con un solo agente?">
    Sí - si tu tráfico privado son **MD** y tu tráfico público son **grupos**.

    Usa `agents.defaults.sandbox.mode: "non-main"` para que las sesiones de grupo/canal (claves que no son principales) se ejecuten en el backend de aislamiento configurado, mientras que la sesión principal de MD permanece en el host. Docker es el backend predeterminado si no eliges uno. Luego restringe qué herramientas están disponibles en las sesiones aisladas mediante `tools.sandbox.tools`.

    Guía de configuración + ejemplo de configuración: [Grupos: MD personales + grupos públicos](/es/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referencia de configuración clave: [Configuración de Gateway](/es/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="¿Cómo vinculo una carpeta del host dentro del entorno aislado?">
    Define `agents.defaults.sandbox.docker.binds` como `["host:path:mode"]` (p. ej., `"/home/user/src:/src:ro"`). Las vinculaciones globales y por agente se combinan; las vinculaciones por agente se ignoran cuando `scope: "shared"`. Usa `:ro` para cualquier cosa sensible y recuerda que las vinculaciones eluden las paredes del sistema de archivos del entorno aislado.

    OpenClaw valida las fuentes de vinculación tanto contra la ruta normalizada como contra la ruta canónica resuelta mediante el ancestro existente más profundo. Eso significa que los escapes por padres con enlaces simbólicos siguen cerrándose de forma segura incluso cuando el último segmento de la ruta aún no existe, y las comprobaciones de raíz permitida siguen aplicándose después de resolver enlaces simbólicos.

    Consulta [Aislamiento](/es/gateway/sandboxing#custom-bind-mounts) y [Aislamiento frente a política de herramientas frente a elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) para ejemplos y notas de seguridad.

  </Accordion>

  <Accordion title="¿Cómo funciona la memoria?">
    La memoria de OpenClaw son simplemente archivos Markdown en el espacio de trabajo del agente:

    - Notas diarias en `memory/YYYY-MM-DD.md`
    - Notas seleccionadas a largo plazo en `MEMORY.md` (solo sesiones principales/privadas)

    OpenClaw también ejecuta un **vaciado de memoria silencioso previo a Compaction** para recordarle al modelo
    que escriba notas duraderas antes de la Compaction automática. Esto solo se ejecuta cuando el espacio de trabajo
    es escribible (los entornos aislados de solo lectura lo omiten). Consulta [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="La memoria sigue olvidando cosas. ¿Cómo hago que las conserve?">
    Pídele al bot que **escriba el dato en la memoria**. Las notas de largo plazo pertenecen a `MEMORY.md`,
    el contexto de corto plazo va en `memory/YYYY-MM-DD.md`.

    Esta sigue siendo un área que estamos mejorando. Ayuda recordar al modelo que almacene recuerdos;
    sabrá qué hacer. Si sigue olvidando, verifica que el Gateway esté usando el mismo
    espacio de trabajo en cada ejecución.

    Docs: [Memoria](/es/concepts/memory), [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿La memoria persiste para siempre? ¿Cuáles son los límites?">
    Los archivos de memoria viven en disco y persisten hasta que los eliminas. El límite es tu
    almacenamiento, no el modelo. El **contexto de sesión** sigue estando limitado por la ventana
    de contexto del modelo, por lo que las conversaciones largas pueden compactarse o truncarse. Por eso
    existe la búsqueda de memoria: vuelve a incorporar al contexto solo las partes relevantes.

    Docs: [Memoria](/es/concepts/memory), [Contexto](/es/concepts/context).

  </Accordion>

  <Accordion title="¿La búsqueda semántica de memoria requiere una clave de API de OpenAI?">
    Solo si usas **embeddings de OpenAI**. Codex OAuth cubre chat/completions y
    **no** concede acceso a embeddings, por lo que **iniciar sesión con Codex (OAuth o el
    inicio de sesión de Codex CLI)** no ayuda para la búsqueda semántica de memoria. Los embeddings de OpenAI
    todavía necesitan una clave de API real (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Si no estableces explícitamente un proveedor, OpenClaw usa embeddings de OpenAI. Las configuraciones
    heredadas que aún dicen `memorySearch.provider = "auto"` también se resuelven en OpenAI.
    Si no hay una clave de API de OpenAI disponible, la búsqueda semántica de memoria permanece no disponible
    hasta que configures una clave o elijas explícitamente otro proveedor.

    Si prefieres permanecer local, establece `memorySearch.provider = "local"` (y opcionalmente
    `memorySearch.fallback = "none"`). Si quieres embeddings de Gemini, establece
    `memorySearch.provider = "gemini"` y proporciona `GEMINI_API_KEY` (o
    `memorySearch.remote.apiKey`). Admitimos modelos de embeddings **OpenAI, compatibles con OpenAI, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra o locales**;
    consulta [Memoria](/es/concepts/memory) para los detalles de configuración.

  </Accordion>
</AccordionGroup>

## Dónde viven las cosas en disco

<AccordionGroup>
  <Accordion title="¿Todos los datos usados con OpenClaw se guardan localmente?">
    No: **el estado de OpenClaw es local**, pero **los servicios externos siguen viendo lo que les envías**.

    - **Local de forma predeterminada:** las sesiones, los archivos de memoria, la configuración y el espacio de trabajo viven en el host del Gateway
      (`~/.openclaw` + tu directorio de espacio de trabajo).
    - **Remoto por necesidad:** los mensajes que envías a proveedores de modelos (Anthropic/OpenAI/etc.) van a
      sus API, y las plataformas de chat (WhatsApp/Telegram/Slack/etc.) almacenan datos de mensajes en sus
      servidores.
    - **Tú controlas la huella:** usar modelos locales mantiene los prompts en tu máquina, pero el tráfico del canal
      sigue pasando por los servidores del canal.

    Relacionado: [Espacio de trabajo del agente](/es/concepts/agent-workspace), [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Dónde almacena OpenClaw sus datos?">
    Todo vive bajo `$OPENCLAW_STATE_DIR` (predeterminado: `~/.openclaw`):

    | Ruta                                                            | Propósito                                                          |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuración principal (JSON5)                                    |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importación OAuth heredada (copiada a perfiles de autenticación en el primer uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfiles de autenticación (OAuth, claves de API y `keyRef`/`tokenRef` opcionales) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Carga útil secreta opcional respaldada por archivo para proveedores SecretRef de `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Archivo de compatibilidad heredado (entradas estáticas `api_key` eliminadas) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Estado del proveedor (p. ej., `whatsapp/<accountId>/creds.json`)   |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Estado por agente (agentDir + sesiones)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historial y estado de conversaciones (por agente)                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadatos de sesión (por agente)                                   |

    Ruta heredada de agente único: `~/.openclaw/agent/*` (migrada por `openclaw doctor`).

    Tu **espacio de trabajo** (AGENTS.md, archivos de memoria, skills, etc.) está separado y se configura mediante `agents.defaults.workspace` (predeterminado: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="¿Dónde deberían vivir AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Estos archivos viven en el **espacio de trabajo del agente**, no en `~/.openclaw`.

    - **Espacio de trabajo (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opcional.
      La raíz en minúsculas `memory.md` es solo entrada de reparación heredada; `openclaw doctor --fix`
      puede fusionarla en `MEMORY.md` cuando ambos archivos existen.
    - **Directorio de estado (`~/.openclaw`)**: configuración, estado de canales/proveedores, perfiles de autenticación, sesiones, registros
      y Skills compartidos (`~/.openclaw/skills`).

    El espacio de trabajo predeterminado es `~/.openclaw/workspace`, configurable mediante:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si el bot "olvida" después de un reinicio, confirma que el Gateway esté usando el mismo
    espacio de trabajo en cada inicio (y recuerda: el modo remoto usa el espacio de trabajo
    **del host del gateway**, no el de tu portátil local).

    Consejo: si quieres un comportamiento o preferencia duraderos, pídele al bot que **lo escriba en
    AGENTS.md o MEMORY.md** en lugar de depender del historial de chat.

    Consulta [Espacio de trabajo del agente](/es/concepts/agent-workspace) y [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Puedo hacer SOUL.md más grande?">
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

    Usa `/context` para comprobar los tamaños sin procesar frente a los inyectados y si ocurrió truncamiento.
    Mantén `SOUL.md` centrado en la voz, la postura y la personalidad; pon las reglas operativas
    en `AGENTS.md` y los hechos duraderos en la memoria.

    Consulta [Contexto](/es/concepts/context) y [Configuración del agente](/es/gateway/config-agents).

  </Accordion>

  <Accordion title="Estrategia de copia de seguridad recomendada">
    Pon tu **espacio de trabajo del agente** en un repositorio git **privado** y haz una copia de seguridad en algún lugar
    privado (por ejemplo, GitHub privado). Esto captura la memoria y los archivos AGENTS/SOUL/USER,
    y te permite restaurar la "mente" del asistente más tarde.

    **No** hagas commit de nada bajo `~/.openclaw` (credenciales, sesiones, tokens o cargas útiles de secretos cifradas).
    Si necesitas una restauración completa, haz una copia de seguridad tanto del espacio de trabajo como del directorio de estado
    por separado (consulta la pregunta de migración anterior).

    Docs: [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿Cómo desinstalo OpenClaw por completo?">
    Consulta la guía dedicada: [Desinstalar](/es/install/uninstall).
  </Accordion>

  <Accordion title="¿Pueden los agentes trabajar fuera del espacio de trabajo?">
    Sí. El espacio de trabajo es el **cwd predeterminado** y ancla de memoria, no un sandbox estricto.
    Las rutas relativas se resuelven dentro del espacio de trabajo, pero las rutas absolutas pueden acceder a otras
    ubicaciones del host salvo que el sandboxing esté habilitado. Si necesitas aislamiento, usa
    [`agents.defaults.sandbox`](/es/gateway/sandboxing) o ajustes de sandbox por agente. Si
    quieres que un repositorio sea el directorio de trabajo predeterminado, apunta el
    `workspace` de ese agente a la raíz del repositorio. El repositorio de OpenClaw es solo código fuente; mantén el
    espacio de trabajo separado salvo que intencionalmente quieras que el agente trabaje dentro de él.

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
    OpenClaw lee una configuración **JSON5** opcional desde `$OPENCLAW_CONFIG_PATH` (predeterminado: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Si falta el archivo, usa valores predeterminados razonablemente seguros (incluido un espacio de trabajo predeterminado de `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Configuré gateway.bind: "lan" (o "tailnet") y ahora nada escucha / la UI dice no autorizado'>
    Los enlaces que no son loopback **requieren una ruta de autenticación válida para el gateway**. En la práctica, eso significa:

    - autenticación con secreto compartido: token o contraseña
    - `gateway.auth.mode: "trusted-proxy"` detrás de un proxy inverso consciente de la identidad correctamente configurado

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

    - `gateway.remote.token` / `.password` **no** habilitan la autenticación del gateway local por sí mismos.
    - Las rutas de llamadas locales pueden usar `gateway.remote.*` como respaldo solo cuando `gateway.auth.*` no está configurado.
    - Para autenticación con contraseña, establece `gateway.auth.mode: "password"` más `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`) en su lugar.
    - Si `gateway.auth.token` / `gateway.auth.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución falla de forma cerrada (sin enmascaramiento por respaldo remoto).
    - Las configuraciones de Control UI con secreto compartido se autentican mediante `connect.params.auth.token` o `connect.params.auth.password` (almacenado en la configuración de app/UI). Los modos portadores de identidad, como Tailscale Serve o `trusted-proxy`, usan encabezados de solicitud en su lugar. Evita poner secretos compartidos en las URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, los proxies inversos de loopback en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito y una entrada de loopback en `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="¿Por qué necesito un token en localhost ahora?">
    OpenClaw aplica la autenticación del gateway de forma predeterminada, incluido loopback. En la ruta predeterminada normal, eso significa autenticación con token: si no se configura una ruta de autenticación explícita, el inicio del gateway se resuelve en modo token y genera un token solo de ejecución para ese inicio, por lo que **los clientes WS locales deben autenticarse**. Configura `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` u `OPENCLAW_GATEWAY_PASSWORD` explícitamente cuando los clientes necesiten un secreto estable entre reinicios. Esto bloquea que otros procesos locales llamen al Gateway.

    Si prefieres una ruta de autenticación diferente, puedes elegir explícitamente el modo de contraseña (o, para proxies inversos conscientes de identidad, `trusted-proxy`). Si **realmente** quieres un loopback abierto, define explícitamente `gateway.auth.mode: "none"` en tu configuración. Doctor puede generar un token para ti en cualquier momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="¿Tengo que reiniciar después de cambiar la configuración?">
    El Gateway observa la configuración y admite recarga en caliente:

    - `gateway.reload.mode: "hybrid"` (predeterminado): aplica en caliente los cambios seguros, reinicia para los críticos
    - `hot`, `restart`, `off` también son compatibles

  </Accordion>

  <Accordion title="¿Cómo desactivo las frases graciosas de la CLI?">
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

    - `off`: oculta el texto de la frase, pero mantiene la línea de título/versión del banner.
    - `default`: usa `All your chats, one OpenClaw.` cada vez.
    - `random`: frases graciosas/estacionales rotativas (comportamiento predeterminado).
    - Si no quieres ningún banner, define la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="¿Cómo habilito la búsqueda web (y la obtención web)?">
    `web_fetch` funciona sin una clave de API. `web_search` depende de tu proveedor
    seleccionado:

    - Los proveedores respaldados por API como Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity y Tavily requieren su configuración normal de clave de API.
    - Grok puede reutilizar OAuth de xAI de la autenticación del modelo, o recurrir a `XAI_API_KEY` / configuración de búsqueda web del plugin.
    - Ollama Web Search no requiere clave, pero usa tu host de Ollama configurado y requiere `ollama signin`.
    - DuckDuckGo no requiere clave, pero es una integración no oficial basada en HTML.
    - SearXNG no requiere clave/es autoalojado; configura `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl`.

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

    La configuración de búsqueda web específica del proveedor ahora reside en `plugins.entries.<plugin>.config.webSearch.*`.
    Las rutas heredadas de proveedor `tools.web.search.*` todavía se cargan temporalmente por compatibilidad, pero no deben usarse para configuraciones nuevas.
    La configuración de respaldo de obtención web de Firecrawl reside en `plugins.entries.firecrawl.config.webFetch.*`.

    Notas:

    - Si usas listas de permitidos, agrega `web_search`/`web_fetch`/`x_search` o `group:web`.
    - `web_fetch` está habilitado de forma predeterminada (salvo que se deshabilite explícitamente).
    - Si se omite `tools.web.fetch.provider`, OpenClaw detecta automáticamente el primer proveedor de respaldo de obtención listo a partir de las credenciales disponibles. El plugin oficial de Firecrawl proporciona ese respaldo.
    - Los daemons leen variables de entorno desde `~/.openclaw/.env` (o el entorno del servicio).

    Documentación: [Herramientas web](/es/tools/web).

  </Accordion>

  <Accordion title="config.apply borró mi configuración. ¿Cómo la recupero y evito esto?">
    `config.apply` reemplaza la **configuración completa**. Si envías un objeto parcial, todo
    lo demás se elimina.

    OpenClaw actual protege contra muchos sobrescritos accidentales:

    - Las escrituras de configuración propiedad de OpenClaw validan toda la configuración posterior al cambio antes de escribir.
    - Las escrituras inválidas o destructivas propiedad de OpenClaw se rechazan y se guardan como `openclaw.json.rejected.*`.
    - Si una edición directa rompe el arranque o la recarga en caliente, Gateway falla cerrado u omite la recarga; no reescribe `openclaw.json`.
    - `openclaw doctor --fix` se encarga de la reparación y puede restaurar el último estado correcto conocido mientras guarda el archivo rechazado como `openclaw.json.clobbered.*`.

    Recuperación:

    - Revisa `openclaw logs --follow` en busca de `Invalid config at`, `Config write rejected:` o `config reload skipped (invalid config)`.
    - Inspecciona el `openclaw.json.clobbered.*` o `openclaw.json.rejected.*` más reciente junto a la configuración activa.
    - Ejecuta `openclaw config validate` y `openclaw doctor --fix`.
    - Copia de vuelta solo las claves previstas con `openclaw config set` o `config.patch`.
    - Si no tienes un último estado correcto conocido ni una carga útil rechazada, restaura desde una copia de seguridad, o vuelve a ejecutar `openclaw doctor` y reconfigura canales/modelos.
    - Si esto fue inesperado, presenta un error e incluye tu última configuración conocida o cualquier copia de seguridad.
    - Un agente de programación local a menudo puede reconstruir una configuración funcional a partir de registros o historial.

    Para evitarlo:

    - Usa `openclaw config set` para cambios pequeños.
    - Usa `openclaw configure` para ediciones interactivas.
    - Usa primero `config.schema.lookup` cuando no estés seguro de una ruta exacta o de la forma de un campo; devuelve un nodo de esquema superficial más resúmenes de hijos inmediatos para profundizar.
    - Usa `config.patch` para ediciones RPC parciales; reserva `config.apply` solo para reemplazar la configuración completa.
    - Si estás usando la herramienta `gateway` orientada a agentes desde una ejecución de agente, seguirá rechazando escrituras en `tools.exec.ask` / `tools.exec.security` (incluidos los alias heredados `tools.bash.*` que se normalizan a las mismas rutas de ejecución protegidas).

    Documentación: [Configuración](/es/cli/config), [Configurar](/es/cli/configure), [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Cómo ejecuto un Gateway central con trabajadores especializados entre dispositivos?">
    El patrón común es **un Gateway** (por ejemplo, Raspberry Pi) más **nodos** y **agentes**:

    - **Gateway (central):** posee canales (Signal/WhatsApp), enrutamiento y sesiones.
    - **Nodos (dispositivos):** Macs/iOS/Android se conectan como periféricos y exponen herramientas locales (`system.run`, `canvas`, `camera`).
    - **Agentes (trabajadores):** cerebros/espacios de trabajo separados para roles especiales (por ejemplo, "operaciones de Hetzner", "datos personales").
    - **Subagentes:** generan trabajo en segundo plano desde un agente principal cuando quieres paralelismo.
    - **TUI:** conéctate al Gateway y cambia entre agentes/sesiones.

    Documentación: [Nodos](/es/nodes), [Acceso remoto](/es/gateway/remote), [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [TUI](/es/web/tui).

  </Accordion>

  <Accordion title="¿Puede el navegador de OpenClaw ejecutarse sin interfaz gráfica?">
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

    El valor predeterminado es `false` (con interfaz gráfica). El modo sin interfaz gráfica es más propenso a activar controles anti-bot en algunos sitios. Consulta [Navegador](/es/tools/browser).

    El modo sin interfaz gráfica usa el **mismo motor Chromium** y funciona para la mayoría de automatizaciones (formularios, clics, scraping, inicios de sesión). Las diferencias principales:

    - Sin ventana de navegador visible (usa capturas de pantalla si necesitas imágenes).
    - Algunos sitios son más estrictos con la automatización en modo sin interfaz gráfica (CAPTCHAs, anti-bot).
      Por ejemplo, X/Twitter a menudo bloquea sesiones sin interfaz gráfica.

  </Accordion>

  <Accordion title="¿Cómo uso Brave para controlar el navegador?">
    Define `browser.executablePath` en tu binario de Brave (o cualquier navegador basado en Chromium) y reinicia el Gateway.
    Consulta los ejemplos completos de configuración en [Navegador](/es/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways y nodos remotos

<AccordionGroup>
  <Accordion title="¿Cómo se propagan los comandos entre Telegram, el gateway y los nodos?">
    Los mensajes de Telegram los maneja el **gateway**. El gateway ejecuta el agente y
    solo entonces llama a los nodos mediante el **Gateway WebSocket** cuando se necesita una herramienta de nodo:

    Telegram → Gateway → Agente → `node.*` → Nodo → Gateway → Telegram

    Los nodos no ven tráfico entrante de proveedores; solo reciben llamadas RPC de nodo.

  </Accordion>

  <Accordion title="¿Cómo puede mi agente acceder a mi computadora si el Gateway está alojado de forma remota?">
    Respuesta breve: **empareja tu computadora como nodo**. El Gateway se ejecuta en otro lugar, pero puede
    llamar a herramientas `node.*` (pantalla, cámara, sistema) en tu máquina local mediante el Gateway WebSocket.

    Configuración típica:

    1. Ejecuta el Gateway en el host siempre activo (VPS/servidor doméstico).
    2. Pon el host del Gateway y tu computadora en la misma tailnet.
    3. Asegúrate de que el WS del Gateway sea accesible (enlace de tailnet o túnel SSH).
    4. Abre la app de macOS localmente y conéctala en modo **Remoto por SSH** (o tailnet directa)
       para que pueda registrarse como nodo.
    5. Aprueba el nodo en el Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    No se requiere un puente TCP separado; los nodos se conectan mediante el Gateway WebSocket.

    Recordatorio de seguridad: emparejar un nodo macOS permite `system.run` en esa máquina. Empareja
    solo dispositivos en los que confíes y revisa [Seguridad](/es/gateway/security).

    Documentación: [Nodos](/es/nodes), [Protocolo del Gateway](/es/gateway/protocol), [modo remoto de macOS](/es/platforms/mac/remote), [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="Tailscale está conectado pero no recibo respuestas. ¿Y ahora?">
    Revisa lo básico:

    - El Gateway está en ejecución: `openclaw gateway status`
    - Estado del Gateway: `openclaw status`
    - Estado del canal: `openclaw channels status`

    Luego verifica la autenticación y el enrutamiento:

    - Si usas Tailscale Serve, asegúrate de que `gateway.auth.allowTailscale` esté configurado correctamente.
    - Si te conectas mediante un túnel SSH, confirma que el túnel local esté activo y apunte al puerto correcto.
    - Confirma que tus listas de permitidos (DM o grupo) incluyan tu cuenta.

    Documentación: [Tailscale](/es/gateway/tailscale), [Acceso remoto](/es/gateway/remote), [Canales](/es/channels).

  </Accordion>

  <Accordion title="¿Pueden dos instancias de OpenClaw hablar entre sí (local + VPS)?">
    Sí. No hay un puente "bot a bot" integrado, pero puedes conectarlas de varias
    formas fiables:

    **Lo más simple:** usa un canal de chat normal al que ambos bots puedan acceder (Telegram/Slack/WhatsApp).
    Haz que el bot A envíe un mensaje al bot B y luego deja que el bot B responda como de costumbre.

    **Puente CLI (genérico):** ejecuta un script que llame al otro Gateway con
    `openclaw agent --message ... --deliver`, dirigido a un chat donde escuche el otro bot.
    Si un bot está en un VPS remoto, apunta tu CLI a ese Gateway remoto
    mediante SSH/Tailscale (consulta [Acceso remoto](/es/gateway/remote)).

    Patrón de ejemplo (ejecutar desde una máquina que pueda llegar al Gateway de destino):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Consejo: agrega una barrera de seguridad para que los dos bots no entren en bucle sin fin (solo menciones, listas
    de permitidos de canal o una regla de "no responder a mensajes de bots").

    Documentación: [Acceso remoto](/es/gateway/remote), [CLI de agente](/es/cli/agent), [Envío de agente](/es/tools/agent-send).

  </Accordion>

  <Accordion title="¿Necesito VPS separados para varios agentes?">
    No. Un Gateway puede alojar varios agentes, cada uno con su propio espacio de trabajo, valores predeterminados de modelo
    y enrutamiento. Esa es la configuración normal y es mucho más barata y sencilla que ejecutar
    un VPS por agente.

    Usa VPS separados solo cuando necesites aislamiento estricto (límites de seguridad) o configuraciones muy
    diferentes que no quieras compartir. De lo contrario, mantén un Gateway y
    usa varios agentes o subagentes.

  </Accordion>

  <Accordion title="¿Hay alguna ventaja en usar un nodo en mi portátil personal en lugar de SSH desde un VPS?">
    Sí: los nodos son la forma principal de acceder a tu portátil desde un Gateway remoto, y
    desbloquean más que acceso al shell. El Gateway se ejecuta en macOS/Linux (Windows mediante WSL2) y es
    ligero (un VPS pequeño o una máquina de clase Raspberry Pi basta; 4 GB de RAM son suficientes), así que una
    configuración habitual es un host siempre activo más tu portátil como nodo.

    - **No se requiere SSH entrante.** Los nodos se conectan hacia el WebSocket del Gateway y usan emparejamiento de dispositivos.
    - **Controles de ejecución más seguros.** `system.run` está protegido por listas de permitidos/aprobaciones de nodos en ese portátil.
    - **Más herramientas de dispositivo.** Los nodos exponen `canvas`, `camera` y `screen` además de `system.run`.
    - **Automatización local del navegador.** Mantén el Gateway en un VPS, pero ejecuta Chrome localmente mediante un host de nodo en el portátil, o conéctate al Chrome local del host mediante Chrome MCP.

    SSH está bien para acceso puntual al shell, pero los nodos son más simples para flujos de trabajo de agentes continuos y
    automatización de dispositivos.

    Documentación: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes), [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Los nodos ejecutan un servicio de gateway?">
    No. Solo debe ejecutarse **un gateway** por host, salvo que ejecutes intencionalmente perfiles aislados (consulta [Múltiples gateways](/es/gateway/multiple-gateways)). Los nodos son periféricos que se conectan
    al gateway (nodos iOS/Android, o el "modo nodo" de macOS en la app de la barra de menús). Para hosts de nodo sin interfaz
    y control por CLI, consulta [CLI de host de nodo](/es/cli/node).

    Se requiere un reinicio completo para cambios en `gateway`, `discovery` y superficies de plugins alojadas.

  </Accordion>

  <Accordion title="¿Hay una forma API / RPC de aplicar configuración?">
    Sí.

    - `config.schema.lookup`: inspecciona un subárbol de configuración con su nodo de esquema superficial, la sugerencia de UI coincidente y resúmenes inmediatos de sus elementos hijos antes de escribir
    - `config.get`: obtiene la instantánea actual + hash
    - `config.patch`: actualización parcial segura (preferida para la mayoría de ediciones RPC); recarga en caliente cuando es posible y reinicia cuando es necesario
    - `config.apply`: valida + reemplaza la configuración completa; recarga en caliente cuando es posible y reinicia cuando es necesario
    - La herramienta de runtime `gateway` orientada al agente todavía se niega a reescribir `tools.exec.ask` / `tools.exec.security`; los alias heredados `tools.bash.*` se normalizan a las mismas rutas de ejecución protegidas

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
    3. **Activa MagicDNS (recomendado)**
       - En la consola de administración de Tailscale, activa MagicDNS para que el VPS tenga un nombre estable.
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
    Serve expone la **UI de control del Gateway + WS**. Los nodos se conectan mediante el mismo endpoint WS del Gateway.

    Configuración recomendada:

    1. **Asegúrate de que el VPS + Mac estén en la misma tailnet**.
    2. **Usa la app de macOS en modo remoto** (el destino SSH puede ser el nombre de host de la tailnet).
       La app tunelizará el puerto del Gateway y se conectará como nodo.
    3. **Aprueba el nodo** en el gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentación: [Protocolo de Gateway](/es/gateway/protocol), [Discovery](/es/gateway/discovery), [modo remoto de macOS](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Debería instalarlo en un segundo portátil o solo agregar un nodo?">
    Si solo necesitas **herramientas locales** (pantalla/cámara/exec) en el segundo portátil, agrégalo como
    **nodo**. Eso mantiene un solo Gateway y evita configuración duplicada. Actualmente, las herramientas de nodo local son
    solo para macOS, pero planeamos extenderlas a otros sistemas operativos.

    Instala un segundo Gateway solo cuando necesites **aislamiento estricto** o dos bots completamente separados.

    Documentación: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes), [Múltiples gateways](/es/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables de entorno y carga de .env

<AccordionGroup>
  <Accordion title="¿Cómo carga OpenClaw las variables de entorno?">
    OpenClaw lee variables de entorno del proceso padre (shell, launchd/systemd, CI, etc.) y además carga:

    - `.env` desde el directorio de trabajo actual
    - un `.env` global de respaldo desde `~/.openclaw/.env` (también conocido como `$OPENCLAW_STATE_DIR/.env`)

    Ningún archivo `.env` sobrescribe variables de entorno existentes.
    Las variables de credenciales de proveedores son una excepción para el `.env` del espacio de trabajo: claves como
    `GEMINI_API_KEY`, `XAI_API_KEY` o `MISTRAL_API_KEY` se ignoran desde el `.env` del espacio de trabajo
    y deben residir en el entorno del proceso, `~/.openclaw/.env` o `env` de configuración.

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

  <Accordion title="Inicié el Gateway mediante el servicio y mis variables de entorno desaparecieron. ¿Qué hago ahora?">
    Dos soluciones comunes:

    1. Coloca las claves faltantes en `~/.openclaw/.env` para que se recojan incluso cuando el servicio no herede el entorno de tu shell.
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

    Esto ejecuta tu shell de inicio de sesión e importa solo las claves esperadas que falten (nunca sobrescribe). Equivalentes como variables de entorno:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Definí COPILOT_GITHUB_TOKEN, pero el estado de modelos muestra "Shell env: off." ¿Por qué?'>
    `openclaw models status` informa si la **importación del entorno del shell** está habilitada. "Shell env: off"
    **no** significa que falten tus variables de entorno: solo significa que OpenClaw no cargará
    tu shell de inicio de sesión automáticamente.

    Si el Gateway se ejecuta como servicio (launchd/systemd), no heredará tu
    entorno del shell. Corrígelo haciendo una de estas cosas:

    1. Coloca el token en `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. O activa la importación del shell (`env.shellEnv.enabled: true`).
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
    Las sesiones pueden expirar después de `session.idleMinutes`, pero esto está **desactivado de forma predeterminada** (valor predeterminado **0**).
    Asígnale un valor positivo para habilitar la expiración por inactividad. Cuando está habilitada, el **siguiente**
    mensaje después del período de inactividad inicia un id de sesión nuevo para esa clave de chat.
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

    Dicho esto, es mejor verlo como un **experimento divertido**. Consume muchos tokens y a menudo
    es menos eficiente que usar un bot con sesiones separadas. El modelo típico que
    imaginamos es un bot con el que hablas, con diferentes sesiones para trabajo paralelo. Ese
    bot también puede generar subagentes cuando sea necesario.

    Documentación: [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [CLI de agentes](/es/cli/agents).

  </Accordion>

  <Accordion title="¿Por qué se truncó el contexto a mitad de tarea? ¿Cómo lo evito?">
    El contexto de la sesión está limitado por la ventana del modelo. Chats largos, salidas grandes de herramientas o muchos
    archivos pueden activar Compaction o truncamiento.

    Qué ayuda:

    - Pídele al bot que resuma el estado actual y lo escriba en un archivo.
    - Usa `/compact` antes de tareas largas, y `/new` al cambiar de tema.
    - Mantén el contexto importante en el espacio de trabajo y pídele al bot que lo vuelva a leer.
    - Usa subagentes para trabajo largo o paralelo, de modo que el chat principal se mantenga más pequeño.
    - Elige un modelo con una ventana de contexto más grande si esto ocurre a menudo.

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

    - Activa o ajusta la **poda de sesiones** (`agents.defaults.contextPruning`) para recortar salidas antiguas de herramientas.
    - Usa un modelo con una ventana de contexto más grande.

    Documentación: [Compaction](/es/concepts/compaction), [Poda de sesiones](/es/concepts/session-pruning), [Gestión de sesiones](/es/concepts/session).

  </Accordion>

  <Accordion title='¿Por qué veo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Este es un error de validación del proveedor: el modelo emitió un bloque `tool_use` sin el
    `input` requerido. Normalmente significa que el historial de la sesión está obsoleto o dañado (a menudo tras hilos largos
    o un cambio de herramienta/esquema).

    Solución: inicia una sesión nueva con `/new` (mensaje independiente).

  </Accordion>

  <Accordion title="¿Por qué recibo mensajes de Heartbeat cada 30 minutos?">
    Los Heartbeats se ejecutan cada **30m** de forma predeterminada (**1h** cuando se usa autenticación OAuth). Ajústalos o desactívalos:

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
    comentarios Markdown/HTML, encabezados Markdown como `# Heading`, marcadores de bloques,
    o stubs de listas de verificación vacíos), OpenClaw omite la ejecución de Heartbeat para ahorrar llamadas a la API.
    Si falta el archivo, Heartbeat se ejecuta de todos modos y el modelo decide qué hacer.

    Las anulaciones por agente usan `agents.list[].heartbeat`. Docs: [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title='¿Necesito añadir una "cuenta de bot" a un grupo de WhatsApp?'>
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
    Opción 1 (la más rápida): sigue los logs y envía un mensaje de prueba en el grupo:

    ```bash
    openclaw logs --follow --json
    ```

    Busca `chatId` (o `from`) que termine en `@g.us`, como:
    `1234567890-1234567890@g.us`.

    Opción 2 (si ya está configurado/en lista de permitidos): lista los grupos desde la configuración:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Docs: [WhatsApp](/es/channels/whatsapp), [Directorio](/es/cli/directory), [Logs](/es/cli/logs).

  </Accordion>

  <Accordion title="¿Por qué OpenClaw no responde en un grupo?">
    Dos causas comunes:

    - La activación por mención está habilitada (predeterminado). Debes @mencionar al bot (o coincidir con `mentionPatterns`).
    - Configuraste `channels.whatsapp.groups` sin `"*"` y el grupo no está en la lista de permitidos.

    Consulta [Grupos](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).

  </Accordion>

  <Accordion title="¿Los grupos/hilos comparten contexto con los DM?">
    Los chats directos se contraen a la sesión principal de forma predeterminada. Los grupos/canales tienen sus propias claves de sesión, y los temas de Telegram / hilos de Discord son sesiones separadas. Consulta [Grupos](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).
  </Accordion>

  <Accordion title="¿Cuántos espacios de trabajo y agentes puedo crear?">
    No hay límites estrictos. Decenas (incluso cientos) están bien, pero vigila:

    - **Crecimiento de disco:** las sesiones + transcripciones viven bajo `~/.openclaw/agents/<agentId>/sessions/`.
    - **Costo de tokens:** más agentes significa más uso concurrente del modelo.
    - **Sobrecarga operativa:** perfiles de autenticación, espacios de trabajo y enrutamiento de canales por agente.

    Consejos:

    - Mantén un espacio de trabajo **activo** por agente (`agents.defaults.workspace`).
    - Poda sesiones antiguas (elimina JSONL o entradas de almacenamiento) si el disco crece.
    - Usa `openclaw doctor` para detectar espacios de trabajo sueltos y discrepancias de perfiles.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios bots o chats al mismo tiempo (Slack), y cómo debería configurarlo?">
    Sí. Usa **enrutamiento multiagente** para ejecutar varios agentes aislados y enrutar mensajes entrantes por
    canal/cuenta/par. Slack es compatible como canal y puede vincularse a agentes específicos.

    El acceso al navegador es potente, pero no "puede hacer cualquier cosa que un humano pueda hacer": los sistemas antibot, CAPTCHA y MFA
    aún pueden bloquear la automatización. Para el control de navegador más fiable, usa Chrome MCP local en el host,
    o usa CDP en la máquina que realmente ejecuta el navegador.

    Configuración recomendada:

    - Host de Gateway siempre activo (VPS/Mac mini).
    - Un agente por rol (vinculaciones).
    - Canales de Slack vinculados a esos agentes.
    - Navegador local mediante Chrome MCP o un nodo cuando sea necesario.

    Docs: [Enrutamiento multiagente](/es/concepts/multi-agent), [Slack](/es/channels/slack),
    [Navegador](/es/tools/browser), [Nodos](/es/nodes).

  </Accordion>
</AccordionGroup>

## Modelos, conmutación por error y perfiles de autenticación

Las preguntas y respuestas sobre modelos — valores predeterminados, selección, alias, cambio, conmutación por error, perfiles de autenticación —
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

  <Accordion title='¿Por qué openclaw gateway status dice "Tiempo de ejecución: en ejecución" pero "Sondeo de conectividad: fallido"?'>
    Porque "en ejecución" es la vista del **supervisor** (launchd/systemd/schtasks). El sondeo de conectividad es la CLI conectándose realmente al WebSocket del Gateway.

    Usa `openclaw gateway status` y confía en estas líneas:

    - `Probe target:` (la URL que el sondeo realmente usó)
    - `Listening:` (lo que realmente está vinculado en el puerto)
    - `Last gateway error:` (causa raíz común cuando el proceso está vivo pero el puerto no está escuchando)

  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status muestra "Config (cli)" y "Config (service)" diferentes?'>
    Estás editando un archivo de configuración mientras el servicio ejecuta otro (a menudo una discrepancia de `--profile` / `OPENCLAW_STATE_DIR`).

    Corrección:

    ```bash
    openclaw gateway install --force
    ```

    Ejecuta eso desde el mismo `--profile` / entorno que quieres que use el servicio.

  </Accordion>

  <Accordion title='¿Qué significa "otra instancia de gateway ya está escuchando"?'>
    OpenClaw aplica un bloqueo de runtime vinculando el listener WebSocket inmediatamente al iniciar (predeterminado `ws://127.0.0.1:18789`). Si el enlace falla con `EADDRINUSE`, lanza `GatewayLockError`, que indica que otra instancia ya está escuchando.

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
    - `gateway.remote.token` / `.password` son solo credenciales remotas del lado del cliente; no habilitan por sí mismas la autenticación del gateway local.

  </Accordion>

  <Accordion title='La Control UI dice "no autorizado" (o sigue reconectando). ¿Y ahora qué?'>
    La ruta de autenticación de tu gateway y el método de autenticación de la UI no coinciden.

    Hechos (del código):

    - La Control UI mantiene el token en `sessionStorage` para la sesión actual de pestaña del navegador y la URL de gateway seleccionada, así que las actualizaciones en la misma pestaña siguen funcionando sin restaurar la persistencia de tokens de larga duración en localStorage.
    - En `AUTH_TOKEN_MISMATCH`, los clientes de confianza pueden intentar un único reintento acotado con un token de dispositivo en caché cuando el gateway devuelve pistas de reintento (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ese reintento con token en caché ahora reutiliza los scopes aprobados en caché almacenados con el token de dispositivo. Los llamadores con `deviceToken` explícito / `scopes` explícitos siguen conservando su conjunto de scopes solicitado en lugar de heredar scopes en caché.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado, luego token de bootstrap.
    - El bootstrap integrado con código de configuración es solo para nodos. Tras la aprobación, devuelve un token de dispositivo de nodo con `scopes: []` y no devuelve un token de operador transferido.

    Corrección:

    - Lo más rápido: `openclaw dashboard` (imprime + copia la URL del dashboard, intenta abrirla; muestra una pista de SSH si no hay interfaz gráfica).
    - Si aún no tienes un token: `openclaw doctor --generate-gateway-token`.
    - Si es remoto, crea primero el túnel: `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`.
    - Modo de secreto compartido: establece `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, luego pega el secreto correspondiente en la configuración de Control UI.
    - Modo Tailscale Serve: asegúrate de que `gateway.auth.allowTailscale` esté habilitado y de estar abriendo la URL de Serve, no una URL raw de loopback/tailnet que omita los encabezados de identidad de Tailscale.
    - Modo proxy de confianza: asegúrate de venir a través del proxy con conocimiento de identidad configurado, no de una URL raw del gateway. Los proxies de local loopback en el mismo host también necesitan `gateway.auth.trustedProxy.allowLoopback = true`.
    - Si la discrepancia persiste tras el único reintento, rota/vuelve a aprobar el token de dispositivo emparejado:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Si esa llamada de rotación dice que fue denegada, revisa dos cosas:
      - las sesiones de dispositivos emparejados solo pueden rotar su **propio** dispositivo a menos que también tengan `operator.admin`
      - los valores explícitos de `--scope` no pueden superar los scopes de operador actuales del llamador
    - ¿Sigues bloqueado? Ejecuta `openclaw status --all` y sigue [Solución de problemas](/es/gateway/troubleshooting). Consulta [Dashboard](/es/web/dashboard) para detalles de autenticación.

  </Accordion>

  <Accordion title="Configuré gateway.bind tailnet pero no puede vincularse y nada escucha">
    La vinculación `tailnet` elige una IP de Tailscale de tus interfaces de red (100.64.0.0/10). Si la máquina no está en Tailscale (o la interfaz está caída), no hay nada a lo que vincularse.

    Corrección:

    - Inicia Tailscale en ese host (para que tenga una dirección 100.x), o
    - Cambia a `gateway.bind: "loopback"` / `"lan"`.

    Nota: `tailnet` es explícito. `auto` prefiere loopback; usa `gateway.bind: "tailnet"` cuando quieras una vinculación solo para tailnet.

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
    - Establece un `gateway.port` único en la configuración de cada perfil (o pasa `--port` para ejecuciones manuales).
    - Instala un servicio por perfil: `openclaw --profile <name> gateway install`.

    Los perfiles también añaden un sufijo a los nombres de servicio (`ai.openclaw.<profile>`; heredados `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guía completa: [Múltiples gateways](/es/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='¿Qué significa "handshake inválido" / código 1008?'>
    El Gateway es un **servidor WebSocket**, y espera que el primer mensaje sea
    un frame `connect`. Si recibe cualquier otra cosa, cierra la conexión
    con **código 1008** (infracción de política).

    Causas comunes:

    - Abriste la URL **HTTP** en un navegador (`http://...`) en lugar de un cliente WS.
    - Usaste el puerto o la ruta incorrectos.
    - Un proxy o túnel eliminó encabezados de autenticación o envió una solicitud que no era del Gateway.

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
  <Accordion title="¿Dónde están los logs?">
    Logs de archivo (estructurados):

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

    Consulta [Solución de problemas](/es/gateway/troubleshooting) para más información.

  </Accordion>

  <Accordion title="¿Cómo inicio/detengo/reinicio el servicio Gateway?">
    Usa los asistentes del Gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Si ejecutas el Gateway manualmente, `openclaw gateway --force` puede reclamar el puerto. Consulta [Gateway](/es/gateway).

  </Accordion>

  <Accordion title="Cerré mi terminal en Windows: ¿cómo reinicio OpenClaw?">
    Hay **tres modos de instalación en Windows**:

    **1) Configuración local de Windows Hub:** la aplicación nativa administra un Gateway WSL local propiedad de la aplicación.

    Abre **OpenClaw Companion** desde el menú Inicio o la bandeja y luego usa
    **Configuración del Gateway** o la pestaña Conexiones.

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

    Documentación: [Windows](/es/platforms/windows), [runbook del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="El Gateway está activo, pero las respuestas nunca llegan. ¿Qué debo comprobar?">
    Empieza con un barrido rápido de estado:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causas comunes:

    - La autenticación del modelo no está cargada en el **host del Gateway** (comprueba `models status`).
    - El emparejamiento o la lista de permitidos del canal está bloqueando respuestas (comprueba la configuración del canal y los registros).
    - WebChat/Dashboard está abierto sin el token correcto.

    Si estás en remoto, confirma que la conexión del túnel/Tailscale esté activa y que el
    WebSocket del Gateway sea accesible.

    Documentación: [Canales](/es/channels), [Solución de problemas](/es/gateway/troubleshooting), [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title='"Desconectado del Gateway: sin motivo" - ¿qué hago ahora?'>
    Esto normalmente significa que la interfaz perdió la conexión WebSocket. Comprueba:

    1. ¿El Gateway está ejecutándose? `openclaw gateway status`
    2. ¿El Gateway está en buen estado? `openclaw status`
    3. ¿La interfaz tiene el token correcto? `openclaw dashboard`
    4. Si estás en remoto, ¿el enlace del túnel/Tailscale está activo?

    Luego sigue los registros:

    ```bash
    openclaw logs --follow
    ```

    Documentación: [Dashboard](/es/web/dashboard), [Acceso remoto](/es/gateway/remote), [Solución de problemas](/es/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands falla. ¿Qué debo comprobar?">
    Empieza con los registros y el estado del canal:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Luego compara el error:

    - `BOT_COMMANDS_TOO_MUCH`: el menú de Telegram tiene demasiadas entradas. OpenClaw ya recorta hasta el límite de Telegram y vuelve a intentarlo con menos comandos, pero aún hay que eliminar algunas entradas del menú. Reduce los comandos de plugins/skills/personalizados, o desactiva `channels.telegram.commands.native` si no necesitas el menú.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, o errores de red similares: si estás en un VPS o detrás de un proxy, confirma que se permita HTTPS saliente y que DNS funcione para `api.telegram.org`.

    Si el Gateway está en remoto, asegúrate de estar mirando los registros en el host del Gateway.

    Documentación: [Telegram](/es/channels/telegram), [Solución de problemas de canales](/es/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI no muestra salida. ¿Qué debo comprobar?">
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

  <Accordion title="¿Cómo detengo completamente y luego inicio el Gateway?">
    Si instalaste el servicio:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Esto detiene/inicia el **servicio supervisado** (launchd en macOS, systemd en Linux).
    Usa esto cuando el Gateway se ejecute en segundo plano como daemon.

    Si lo estás ejecutando en primer plano, deténlo con Ctrl-C y luego:

    ```bash
    openclaw gateway run
    ```

    Documentación: [runbook del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart frente a openclaw gateway">
    - `openclaw gateway restart`: reinicia el **servicio en segundo plano** (launchd/systemd).
    - `openclaw gateway`: ejecuta el gateway **en primer plano** para esta sesión de terminal.

    Si instalaste el servicio, usa los comandos de gateway. Usa `openclaw gateway` cuando
    quieras una ejecución puntual en primer plano.

  </Accordion>

  <Accordion title="La forma más rápida de obtener más detalles cuando algo falla">
    Inicia el Gateway con `--verbose` para obtener más detalle en consola. Luego inspecciona el archivo de registro en busca de errores de autenticación de canales, enrutamiento de modelos y RPC.
  </Accordion>
</AccordionGroup>

## Medios y archivos adjuntos

<AccordionGroup>
  <Accordion title="Mi skill generó una imagen/PDF, pero no se envió nada">
    Los archivos adjuntos salientes del agente deben usar campos multimedia estructurados como `media`, `mediaUrl`, `path` o `filePath`. Consulta [configuración del asistente de OpenClaw](/es/start/openclaw) y [envío del agente](/es/tools/agent-send).

    Envío mediante CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Comprueba también:

    - El canal de destino admite medios salientes y no está bloqueado por listas de permitidos.
    - El archivo está dentro de los límites de tamaño del proveedor (las imágenes se redimensionan a un máximo de 2048px).
    - `tools.fs.workspaceOnly=true` mantiene los envíos de rutas locales limitados al espacio de trabajo, temp/media-store y archivos validados por sandbox.
    - `tools.fs.workspaceOnly=false` permite que los envíos de medios locales estructurados usen archivos locales del host que el agente ya puede leer, pero solo para medios y tipos de documentos seguros (imágenes, audio, video, PDF, documentos de Office y documentos de texto validados como Markdown/MD, TXT, JSON, YAML y YML). Esto no es un escáner de secretos: se puede adjuntar un `secret.txt` o `config.json` legible por el agente cuando la extensión y la validación de contenido coinciden. Mantén los archivos sensibles fuera de rutas legibles por el agente, o conserva `tools.fs.workspaceOnly=true` para envíos de rutas locales más estrictos.

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

    Ejecuta `openclaw doctor` para detectar políticas de mensajes directos arriesgadas.

  </Accordion>

  <Accordion title="¿La inyección de prompts solo es un problema para bots públicos?">
    No. La inyección de prompts se trata de **contenido no confiable**, no solo de quién puede enviar mensajes directos al bot.
    Si tu asistente lee contenido externo (búsqueda/obtención web, páginas de navegador, correos electrónicos,
    documentación, archivos adjuntos, registros pegados), ese contenido puede incluir instrucciones que intenten
    secuestrar el modelo. Esto puede ocurrir incluso si **tú eres el único remitente**.

    El mayor riesgo aparece cuando las herramientas están habilitadas: se puede engañar al modelo para que
    exfiltre contexto o llame herramientas en tu nombre. Reduce el radio de impacto mediante:

    - usar un agente "lector" de solo lectura o sin herramientas para resumir contenido no confiable
    - mantener `web_search` / `web_fetch` / `browser` desactivados para agentes con herramientas habilitadas
    - tratar también el texto decodificado de archivos/documentos como no confiable: OpenResponses
      `input_file` y la extracción de adjuntos multimedia envuelven el texto extraído en
      marcadores explícitos de límite de contenido externo en lugar de pasar texto de archivo sin procesar
    - sandboxing y listas de permitidos estrictas de herramientas

    Detalles: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿OpenClaw es menos seguro porque usa TypeScript/Node en lugar de Rust/WASM?">
    El lenguaje y el runtime importan, pero no son el riesgo principal para un agente
    personal. Los riesgos prácticos de OpenClaw son la exposición del Gateway, quién puede enviar mensajes al
    bot, la inyección de prompts, el alcance de las herramientas, el manejo de credenciales, el acceso al navegador, el acceso exec
    y la confianza en skills o plugins de terceros.

    Rust y WASM pueden proporcionar un aislamiento más fuerte para algunas clases de código, pero
    no resuelven la inyección de prompts, las listas de permitidos deficientes, la exposición pública del Gateway,
    las herramientas demasiado amplias ni un perfil de navegador que ya haya iniciado sesión en cuentas
    sensibles. Trata esos puntos como los controles principales:

    - mantén el Gateway privado o autenticado
    - usa emparejamiento y listas de permitidos para mensajes directos y grupos
    - deniega o aísla en sandbox las herramientas arriesgadas para entradas no confiables
    - instala solo plugins y skills de confianza
    - ejecuta `openclaw security audit --deep` después de cambios de configuración

    Detalles: [Seguridad](/es/gateway/security), [Sandboxing](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="Vi informes sobre instancias de OpenClaw expuestas. ¿Qué debo comprobar?">
    Primero comprueba tu despliegue real:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Una línea base más segura es:

    - Gateway enlazado a `loopback`, o expuesto solo mediante acceso privado
      autenticado, como una tailnet, túnel SSH, autenticación con token/contraseña o un proxy de confianza
      configurado correctamente
    - mensajes directos en modo `pairing` o `allowlist`
    - grupos en lista de permitidos y con requisito de mención, salvo que todos los miembros sean de confianza
    - herramientas de alto riesgo (`exec`, `browser`, `gateway`, `cron`) denegadas o estrictamente
      limitadas para agentes que leen contenido no confiable
    - sandboxing habilitado cuando la ejecución de herramientas necesita un radio de impacto menor

    Enlaces públicos sin autenticación, mensajes directos/grupos abiertos con herramientas y control del navegador
    expuesto son los hallazgos que debes corregir primero. Detalles:
    [Lista de comprobación de auditoría de seguridad](/es/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="¿Es seguro instalar skills de ClawHub y plugins de terceros?">
    Trata las skills de terceros y los plugins como código que estás eligiendo confiar.
    Las páginas de skills de ClawHub exponen el estado de análisis antes de instalar, pero los análisis no son un
    límite de seguridad completo. OpenClaw no ejecuta bloqueo local integrado de
    código peligroso durante flujos de instalación/actualización de plugins o skills; usa
    `security.installPolicy` propiedad del operador para decisiones locales de permitir/bloquear.

    Patrón más seguro:

    - prefiere autores de confianza y versiones fijadas
    - lee la skill o el plugin antes de habilitarlo
    - mantén estrechas las listas de permitidos de plugins y skills
    - ejecuta flujos de trabajo con entradas no confiables en un sandbox con herramientas mínimas
    - evita conceder a código de terceros acceso amplio al sistema de archivos, exec, navegador o secretos

    Detalles: [Skills](/es/tools/skills), [Plugins](/es/tools/plugin),
    [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Mi bot debería tener su propio correo electrónico, cuenta de GitHub o número de teléfono?">
    Sí, para la mayoría de las configuraciones. Aislar el bot con cuentas y números de teléfono separados
    reduce el radio de impacto si algo sale mal. Esto también facilita rotar
    credenciales o revocar acceso sin afectar tus cuentas personales.

    Empieza poco a poco. Da acceso solo a las herramientas y cuentas que realmente necesitas, y amplíalo
    más adelante si hace falta.

    Documentación: [Seguridad](/es/gateway/security), [Emparejamiento](/es/channels/pairing).

  </Accordion>

  <Accordion title="¿Puedo darle autonomía sobre mis mensajes de texto y es seguro?">
    **No** recomendamos autonomía total sobre tus mensajes personales. El patrón más seguro es:

    - Mantén los MD en **modo de emparejamiento** o en una lista de permitidos estricta.
    - Usa un **número o cuenta separados** si quieres que envíe mensajes en tu nombre.
    - Deja que redacte y luego **aprueba antes de enviar**.

    Si quieres experimentar, hazlo en una cuenta dedicada y mantenla aislada. Consulta
    [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Puedo usar modelos más baratos para tareas de asistente personal?">
    Sí, **si** el agente es solo de chat y la entrada es de confianza. Los niveles más pequeños son
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
    No. La política predeterminada de MD de WhatsApp es **emparejamiento**. Los remitentes desconocidos solo reciben un código de emparejamiento y su mensaje **no se procesa**. OpenClaw solo responde a los chats que recibe o a envíos explícitos que tú activas.

    Aprueba el emparejamiento con:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Lista las solicitudes pendientes:

    ```bash
    openclaw pairing list whatsapp
    ```

    Solicitud del número de teléfono en el asistente: se usa para configurar tu **lista de permitidos/propietario** para que tus propios MD estén permitidos. No se usa para envíos automáticos. Si lo ejecutas en tu número personal de WhatsApp, usa ese número y habilita `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandos de chat, cancelación de tareas y "no se detiene"

<AccordionGroup>
  <Accordion title="¿Cómo evito que los mensajes internos del sistema aparezcan en el chat?">
    La mayoría de los mensajes internos o de herramientas solo aparecen cuando **verbose**, **trace** o **reasoning** están habilitados
    para esa sesión.

    Soluciónalo en el chat donde lo ves:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Si sigue generando demasiado ruido, revisa la configuración de la sesión en la Control UI y establece verbose
    en **heredar**. Confirma también que no estás usando un perfil de bot con `verboseDefault` establecido
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

    Estos son activadores de cancelación (no comandos de barra).

    Para procesos en segundo plano (desde la herramienta exec), puedes pedirle al agente que ejecute:

    ```
    process action:kill sessionId:XXX
    ```

    Resumen de comandos de barra: consulta [Comandos de barra](/es/tools/slash-commands).

    La mayoría de los comandos deben enviarse como mensaje **independiente** que empieza por `/`, pero algunos atajos (como `/status`) también funcionan en línea para remitentes en la lista de permitidos.

  </Accordion>

  <Accordion title='¿Cómo envío un mensaje de Discord desde Telegram? ("Mensajería entre contextos denegada")'>
    OpenClaw bloquea la mensajería **entre proveedores** de forma predeterminada. Si una llamada de herramienta está vinculada
    a Telegram, no enviará a Discord salvo que lo permitas explícitamente.

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

  <Accordion title='¿Por qué parece que el bot "ignora" los mensajes en ráfaga?'>
    De forma predeterminada, las indicaciones de mitad de ejecución se dirigen a la ejecución activa. Usa `/queue` para elegir el comportamiento de la ejecución activa:

    - `steer` - guiar la ejecución activa en el siguiente límite del modelo
    - `followup` - poner en cola los mensajes y ejecutarlos de uno en uno después de que termine la ejecución actual
    - `collect` - poner en cola mensajes compatibles y responder una vez después de que termine la ejecución actual
    - `interrupt` - cancelar la ejecución actual y empezar de nuevo

    El modo predeterminado es `steer`. Puedes añadir opciones como `debounce:0.5s cap:25 drop:summarize` para modos en cola. Consulta [Cola de comandos](/es/concepts/queue) y [Cola de direccionamiento](/es/concepts/queue-steering).

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
- [Preguntas frecuentes de modelos](/es/help/faq-models) — selección de modelo, conmutación por error, perfiles de autenticación
- [Solución de problemas](/es/help/troubleshooting) — triaje por síntoma primero
