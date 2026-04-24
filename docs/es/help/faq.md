---
read_when:
    - Responder preguntas comunes de soporte sobre configuración, instalación, incorporación o tiempo de ejecución
    - Clasificar problemas reportados por usuarios antes de una depuración más profunda
summary: Preguntas frecuentes sobre la configuración, los ajustes y el uso de OpenClaw
title: Preguntas frecuentes
x-i18n:
    generated_at: "2026-04-24T05:32:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd0e951ed4accd924b94d6aa2963547e06b6961c7c3c98563397a9b6d36e4979
    source_path: help/faq.md
    workflow: 15
---

Respuestas rápidas más solución de problemas más profunda para configuraciones del mundo real (desarrollo local, VPS, multiagente, OAuth/claves API, conmutación por error de modelos). Para diagnósticos de tiempo de ejecución, consulta [Solución de problemas](/es/gateway/troubleshooting). Para la referencia completa de configuración, consulta [Configuración](/es/gateway/configuration).

## Los primeros 60 segundos si algo está roto

1. **Estado rápido (primera comprobación)**

   ```bash
   openclaw status
   ```

   Resumen local rápido: SO + actualización, accesibilidad del gateway/servicio, agentes/sesiones, configuración del proveedor + problemas de tiempo de ejecución (cuando el gateway es accesible).

2. **Informe que se puede pegar (seguro para compartir)**

   ```bash
   openclaw status --all
   ```

   Diagnóstico de solo lectura con cola de registros (tokens redactados).

3. **Estado del daemon + puerto**

   ```bash
   openclaw gateway status
   ```

   Muestra el tiempo de ejecución del supervisor frente a la accesibilidad RPC, la URL de destino del probe y qué configuración probablemente usó el servicio.

4. **Probes profundos**

   ```bash
   openclaw status --deep
   ```

   Ejecuta un probe de estado del gateway en vivo, incluidos probes de canal cuando son compatibles
   (requiere un gateway accesible). Consulta [Health](/es/gateway/health).

5. **Seguir el registro más reciente**

   ```bash
   openclaw logs --follow
   ```

   Si RPC está caído, recurre a:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Los registros de archivo son independientes de los registros del servicio; consulta [Logging](/es/logging) y [Solución de problemas](/es/gateway/troubleshooting).

6. **Ejecutar doctor (reparaciones)**

   ```bash
   openclaw doctor
   ```

   Repara/migra configuración/estado + ejecuta comprobaciones de estado. Consulta [Doctor](/es/gateway/doctor).

7. **Instantánea del gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # muestra la URL de destino + la ruta de configuración en errores
   ```

   Pide al gateway en ejecución una instantánea completa (solo WS). Consulta [Health](/es/gateway/health).

## Inicio rápido y configuración de la primera ejecución

Las preguntas y respuestas sobre la primera ejecución — instalación, incorporación, rutas de autenticación, suscripciones, fallos iniciales — se trasladaron a una página dedicada:
[FAQ — inicio rápido y configuración de la primera ejecución](/es/help/faq-first-run).

## ¿Qué es OpenClaw?

<AccordionGroup>
  <Accordion title="¿Qué es OpenClaw, en un párrafo?">
    OpenClaw es un asistente de IA personal que ejecutas en tus propios dispositivos. Responde en las superficies de mensajería que ya usas (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat y plugins de canal incluidos como QQ Bot) y también puede hacer voz + un Canvas en vivo en plataformas compatibles. El **Gateway** es el plano de control siempre activo; el asistente es el producto.
  </Accordion>

  <Accordion title="Propuesta de valor">
    OpenClaw no es "solo un wrapper de Claude". Es un **plano de control local-first** que te permite ejecutar un
    asistente capaz en **tu propio hardware**, accesible desde las apps de chat que ya usas, con
    sesiones con estado, memoria y herramientas, sin ceder el control de tus flujos de trabajo a un
    SaaS alojado.

    Puntos destacados:

    - **Tus dispositivos, tus datos:** ejecuta el Gateway donde quieras (Mac, Linux, VPS) y mantén
      el espacio de trabajo + el historial de sesiones en local.
    - **Canales reales, no un sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc.,
      además de voz móvil y Canvas en plataformas compatibles.
    - **Independiente del modelo:** usa Anthropic, OpenAI, MiniMax, OpenRouter, etc., con enrutamiento
      y conmutación por error por agente.
    - **Opción solo local:** ejecuta modelos locales para que **todos los datos puedan permanecer en tu dispositivo** si quieres.
    - **Enrutamiento multiagente:** agentes separados por canal, cuenta o tarea, cada uno con su
      propio espacio de trabajo y valores predeterminados.
    - **Código abierto y hackeable:** inspecciónalo, extiéndelo y autoalójalo sin dependencia de proveedor.

    Documentación: [Gateway](/es/gateway), [Channels](/es/channels), [Multi-agent](/es/concepts/multi-agent),
    [Memory](/es/concepts/memory).

  </Accordion>

  <Accordion title="Acabo de configurarlo. ¿Qué debería hacer primero?">
    Buenos primeros proyectos:

    - Crear un sitio web (WordPress, Shopify o un sitio estático sencillo).
    - Prototipar una app móvil (estructura, pantallas, plan de API).
    - Organizar archivos y carpetas (limpieza, nombres, etiquetado).
    - Conectar Gmail y automatizar resúmenes o seguimientos.

    Puede manejar tareas grandes, pero funciona mejor cuando las divides en fases y
    usas subagentes para trabajo en paralelo.

  </Accordion>

  <Accordion title="¿Cuáles son los cinco casos de uso cotidianos principales de OpenClaw?">
    Las ventajas del día a día suelen ser:

    - **Briefings personales:** resúmenes de bandeja de entrada, calendario y noticias que te importan.
    - **Investigación y redacción:** investigación rápida, resúmenes y primeros borradores para correos o documentos.
    - **Recordatorios y seguimientos:** avisos y listas de verificación impulsados por Cron o Heartbeat.
    - **Automatización del navegador:** rellenar formularios, recopilar datos y repetir tareas web.
    - **Coordinación entre dispositivos:** envía una tarea desde tu teléfono, deja que el Gateway la ejecute en un servidor y recibe el resultado de vuelta en el chat.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ayudar con lead gen, outreach, anuncios y blogs para un SaaS?">
    Sí, para **investigación, cualificación y redacción**. Puede escanear sitios, crear listas cortas,
    resumir prospectos y redactar borradores de outreach o textos para anuncios.

    Para **outreach o campañas publicitarias**, mantén a un humano en el circuito. Evita el spam, sigue las leyes locales y
    las políticas de la plataforma, y revisa cualquier cosa antes de enviarla. El patrón más seguro es dejar
    que OpenClaw redacte y que tú apruebes.

    Documentación: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Qué ventajas tiene frente a Claude Code para desarrollo web?">
    OpenClaw es un **asistente personal** y capa de coordinación, no un reemplazo del IDE. Usa
    Claude Code o Codex para el bucle de codificación directa más rápido dentro de un repositorio. Usa OpenClaw cuando
    quieras memoria duradera, acceso entre dispositivos y orquestación de herramientas.

    Ventajas:

    - **Memoria + espacio de trabajo persistentes** entre sesiones
    - **Acceso multiplataforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orquestación de herramientas** (navegador, archivos, programación, hooks)
    - **Gateway siempre activo** (ejecútalo en un VPS, interactúa desde cualquier lugar)
    - **Nodes** para navegador/pantalla/cámara/exec locales

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills y automatización

<AccordionGroup>
  <Accordion title="¿Cómo personalizo Skills sin ensuciar el repositorio?">
    Usa sobrescrituras gestionadas en lugar de editar la copia del repositorio. Pon tus cambios en `~/.openclaw/skills/<name>/SKILL.md` (o agrega una carpeta mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json`). La precedencia es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluidas → `skills.load.extraDirs`, así que las sobrescrituras gestionadas siguen teniendo prioridad sobre las Skills incluidas sin tocar git. Si necesitas la Skill instalada globalmente pero visible solo para algunos agentes, mantén la copia compartida en `~/.openclaw/skills` y controla la visibilidad con `agents.defaults.skills` y `agents.list[].skills`. Solo los cambios que merezcan enviarse aguas arriba deberían vivir en el repositorio y salir como PR.
  </Accordion>

  <Accordion title="¿Puedo cargar Skills desde una carpeta personalizada?">
    Sí. Agrega directorios adicionales mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json` (precedencia más baja). La precedencia predeterminada es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluidas → `skills.load.extraDirs`. `clawhub` instala en `./skills` por defecto, que OpenClaw trata como `<workspace>/skills` en la siguiente sesión. Si la Skill solo debe ser visible para ciertos agentes, combínalo con `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="¿Cómo puedo usar modelos distintos para tareas distintas?">
    Hoy, los patrones compatibles son:

    - **Trabajos Cron**: los trabajos aislados pueden establecer una sobrescritura `model` por trabajo.
    - **Subagentes**: enruta tareas a agentes separados con distintos modelos predeterminados.
    - **Cambio bajo demanda**: usa `/model` para cambiar el modelo de la sesión actual en cualquier momento.

    Consulta [Cron jobs](/es/automation/cron-jobs), [Multi-Agent Routing](/es/concepts/multi-agent) y [Slash commands](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="El bot se congela mientras hace trabajo pesado. ¿Cómo descargo eso?">
    Usa **subagentes** para tareas largas o paralelas. Los subagentes se ejecutan en su propia sesión,
    devuelven un resumen y mantienen tu chat principal con capacidad de respuesta.

    Pide a tu bot que "genere un subagente para esta tarea" o usa `/subagents`.
    Usa `/status` en el chat para ver qué está haciendo ahora mismo el Gateway (y si está ocupado).

    Consejo sobre tokens: tanto las tareas largas como los subagentes consumen tokens. Si el coste es un problema, establece un
    modelo más barato para los subagentes mediante `agents.defaults.subagents.model`.

    Documentación: [Sub-agents](/es/tools/subagents), [Background Tasks](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Cómo funcionan las sesiones de subagente vinculadas a hilos en Discord?">
    Usa bindings de hilo. Puedes vincular un hilo de Discord a un subagente o a un destino de sesión para que los mensajes de seguimiento en ese hilo permanezcan en esa sesión vinculada.

    Flujo básico:

    - Genera con `sessions_spawn` usando `thread: true` (y opcionalmente `mode: "session"` para seguimiento persistente).
    - O vincula manualmente con `/focus <target>`.
    - Usa `/agents` para inspeccionar el estado del binding.
    - Usa `/session idle <duration|off>` y `/session max-age <duration|off>` para controlar el desfoco automático.
    - Usa `/unfocus` para desvincular el hilo.

    Configuración requerida:

    - Valores predeterminados globales: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Sobrescrituras de Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Vinculación automática al generar: establece `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Documentación: [Sub-agents](/es/tools/subagents), [Discord](/es/channels/discord), [Configuration Reference](/es/gateway/configuration-reference), [Slash commands](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagente terminó, pero la actualización de finalización fue al lugar equivocado o nunca se publicó. ¿Qué debería comprobar?">
    Comprueba primero la ruta del solicitante resuelta:

    - La entrega en modo de finalización de subagente prefiere cualquier hilo vinculado o ruta de conversación cuando existe uno.
    - Si el origen de finalización solo lleva un canal, OpenClaw recurre a la ruta almacenada de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa aún pueda funcionar.
    - Si no existe ni una ruta vinculada ni una ruta almacenada utilizable, la entrega directa puede fallar y el resultado recurre en su lugar a entrega en sesión en cola en vez de publicarse inmediatamente en el chat.
    - Los destinos no válidos o obsoletos pueden seguir forzando la alternativa de cola o el fallo final de entrega.
    - Si la última respuesta visible del asistente del hijo es exactamente el token silencioso `NO_REPLY` / `no_reply`, o exactamente `ANNOUNCE_SKIP`, OpenClaw suprime intencionalmente el anuncio en lugar de publicar progreso anterior obsoleto.
    - Si el hijo agotó el tiempo tras solo llamadas a herramientas, el anuncio puede colapsar eso en un breve resumen de progreso parcial en lugar de reproducir la salida bruta de herramientas.

    Depuración:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Sub-agents](/es/tools/subagents), [Background Tasks](/es/automation/tasks), [Session Tools](/es/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o recordatorios no se disparan. ¿Qué debería comprobar?">
    Cron se ejecuta dentro del proceso del Gateway. Si el Gateway no está funcionando de forma continua,
    los trabajos programados no se ejecutarán.

    Lista de comprobación:

    - Confirma que Cron esté habilitado (`cron.enabled`) y que `OPENCLAW_SKIP_CRON` no esté definido.
    - Comprueba que el Gateway esté ejecutándose 24/7 (sin suspensión/reinicios).
    - Verifica la configuración de zona horaria del trabajo (`--tz` frente a la zona horaria del host).

    Depuración:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentación: [Cron jobs](/es/automation/cron-jobs), [Automation & Tasks](/es/automation).

  </Accordion>

  <Accordion title="Cron se disparó, pero no se envió nada al canal. ¿Por qué?">
    Comprueba primero el modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"` significa que no se espera envío alternativo del runner.
    - Un destino de anuncio faltante o inválido (`channel` / `to`) significa que el runner omitió la entrega saliente.
    - Los fallos de autenticación del canal (`unauthorized`, `Forbidden`) significan que el runner intentó entregar, pero las credenciales lo bloquearon.
    - Un resultado aislado silencioso (`NO_REPLY` / `no_reply` únicamente) se trata como intencionalmente no entregable, así que el runner también suprime la entrega alternativa en cola.

    En trabajos Cron aislados, el agente aún puede enviar directamente con la herramienta `message`
    cuando hay disponible una ruta de chat. `--announce` solo controla la ruta alternativa del runner
    para el texto final que el agente no haya enviado ya.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Cron jobs](/es/automation/cron-jobs), [Background Tasks](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Por qué una ejecución aislada de Cron cambió de modelo o reintentó una vez?">
    Eso suele ser la ruta activa de cambio de modelo, no una programación duplicada.

    Cron aislado puede conservar una transferencia de modelo en tiempo de ejecución y reintentar cuando la ejecución activa
    lanza `LiveSessionModelSwitchError`. El reintento conserva el
    proveedor/modelo cambiado y, si el cambio llevaba una nueva sobrescritura de perfil de autenticación, Cron
    también la conserva antes de reintentar.

    Reglas de selección relacionadas:

    - La sobrescritura de modelo del hook de Gmail gana primero cuando aplica.
    - Luego, el `model` por trabajo.
    - Luego, cualquier sobrescritura almacenada del modelo de la sesión de Cron.
    - Luego, la selección normal del modelo predeterminado/del agente.

    El bucle de reintento está acotado. Después del intento inicial más 2 reintentos por cambio,
    Cron aborta en lugar de entrar en un bucle infinito.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Cron jobs](/es/automation/cron-jobs), [cron CLI](/es/cli/cron).

  </Accordion>

  <Accordion title="¿Cómo instalo Skills en Linux?">
    Usa los comandos nativos `openclaw skills` o coloca Skills en tu espacio de trabajo. La IU de Skills de macOS no está disponible en Linux.
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

    La instalación nativa `openclaw skills install` escribe en el directorio `skills/`
    del espacio de trabajo activo. Instala la CLI separada `clawhub` solo si quieres publicar o
    sincronizar tus propias Skills. Para instalaciones compartidas entre agentes, coloca la Skill bajo
    `~/.openclaw/skills` y usa `agents.defaults.skills` o
    `agents.list[].skills` si quieres limitar qué agentes pueden verla.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ejecutar tareas según un horario o continuamente en segundo plano?">
    Sí. Usa el programador del Gateway:

    - **Trabajos Cron** para tareas programadas o recurrentes (persisten tras reinicios).
    - **Heartbeat** para comprobaciones periódicas de la "sesión principal".
    - **Trabajos aislados** para agentes autónomos que publican resúmenes o entregan a chats.

    Documentación: [Cron jobs](/es/automation/cron-jobs), [Automation & Tasks](/es/automation),
    [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title="¿Puedo ejecutar Skills solo de macOS desde Linux?">
    No directamente. Las Skills de macOS están restringidas por `metadata.openclaw.os` más los binarios requeridos, y las Skills solo aparecen en el prompt del sistema cuando son aptas en el **host del Gateway**. En Linux, las Skills solo para `darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) no se cargarán a menos que sobrescribas esa restricción.

    Tienes tres patrones compatibles:

    **Opción A - ejecutar el Gateway en un Mac (lo más simple).**
    Ejecuta el Gateway donde existan los binarios de macOS y luego conéctate desde Linux en [modo remoto](#gateway-ports-already-running-and-remote-mode) o mediante Tailscale. Las Skills se cargan normalmente porque el host del Gateway es macOS.

    **Opción B - usar un Node de macOS (sin SSH).**
    Ejecuta el Gateway en Linux, empareja un Node de macOS (app de barra de menú) y establece **Node Run Commands** en "Always Ask" o "Always Allow" en el Mac. OpenClaw puede tratar las Skills solo de macOS como aptas cuando los binarios requeridos existen en el Node. El agente ejecuta esas Skills mediante la herramienta `nodes`. Si eliges "Always Ask", aprobar "Always Allow" en el prompt agrega ese comando a la allowlist.

    **Opción C - hacer proxy de binarios de macOS mediante SSH (avanzado).**
    Mantén el Gateway en Linux, pero haz que los binarios CLI requeridos se resuelvan a wrappers SSH que se ejecuten en un Mac. Luego sobrescribe la Skill para permitir Linux y que siga siendo apta.

    1. Crea un wrapper SSH para el binario (ejemplo: `memo` para Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Pon el wrapper en `PATH` en el host Linux (por ejemplo `~/bin/memo`).
    3. Sobrescribe los metadatos de la Skill (espacio de trabajo o `~/.openclaw/skills`) para permitir Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Inicia una sesión nueva para que se actualice la instantánea de Skills.

  </Accordion>

  <Accordion title="¿Tienen integración con Notion o HeyGen?">
    No integrada actualmente.

    Opciones:

    - **Skill / Plugin personalizados:** mejor para acceso fiable a la API (tanto Notion como HeyGen tienen APIs).
    - **Automatización del navegador:** funciona sin código, pero es más lenta y más frágil.

    Si quieres mantener contexto por cliente (flujos de trabajo de agencia), un patrón sencillo es:

    - Una página de Notion por cliente (contexto + preferencias + trabajo activo).
    - Pedir al agente que obtenga esa página al inicio de una sesión.

    Si quieres una integración nativa, abre una solicitud de función o crea una Skill
    dirigida a esas APIs.

    Instalar Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Las instalaciones nativas terminan en el directorio `skills/` del espacio de trabajo activo. Para Skills compartidas entre agentes, colócalas en `~/.openclaw/skills/<name>/SKILL.md`. Si solo algunos agentes deben ver una instalación compartida, configura `agents.defaults.skills` o `agents.list[].skills`. Algunas Skills esperan binarios instalados mediante Homebrew; en Linux eso significa Linuxbrew (consulta la entrada correspondiente de la FAQ de Homebrew en Linux más arriba). Consulta [Skills](/es/tools/skills), [Skills config](/es/tools/skills-config) y [ClawHub](/es/tools/clawhub).

  </Accordion>

  <Accordion title="¿Cómo uso mi Chrome ya autenticado con OpenClaw?">
    Usa el perfil de navegador integrado `user`, que se adjunta mediante Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Si quieres un nombre personalizado, crea un perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Esta ruta puede usar el navegador local del host o un Node de navegador conectado. Si el Gateway se ejecuta en otro lugar, ejecuta un host Node en la máquina del navegador o usa CDP remoto.

    Límites actuales de `existing-session` / `user`:

    - las acciones usan refs, no selectores CSS
    - las subidas requieren `ref` / `inputRef` y actualmente admiten un archivo cada vez
    - `responsebody`, exportación PDF, interceptación de descargas y acciones por lotes siguen necesitando un navegador gestionado o un perfil CDP sin procesar

  </Accordion>
</AccordionGroup>

## Sandboxing y memoria

<AccordionGroup>
  <Accordion title="¿Hay una documentación dedicada para sandboxing?">
    Sí. Consulta [Sandboxing](/es/gateway/sandboxing). Para configuración específica de Docker (gateway completo en Docker o imágenes de sandbox), consulta [Docker](/es/install/docker).
  </Accordion>

  <Accordion title="Docker se siente limitado. ¿Cómo habilito todas las funciones?">
    La imagen predeterminada prioriza la seguridad y se ejecuta como el usuario `node`, por lo que no
    incluye paquetes del sistema, Homebrew ni navegadores incluidos. Para una configuración más completa:

    - Conserva `/home/node` con `OPENCLAW_HOME_VOLUME` para que las cachés sobrevivan.
    - Incorpora dependencias del sistema a la imagen con `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instala navegadores Playwright mediante la CLI incluida:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Establece `PLAYWRIGHT_BROWSERS_PATH` y asegúrate de que la ruta se conserve.

    Documentación: [Docker](/es/install/docker), [Browser](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Puedo mantener los DMs privados pero hacer públicos/en sandbox los grupos con un solo agente?">
    Sí, si tu tráfico privado son **DMs** y tu tráfico público son **grupos**.

    Usa `agents.defaults.sandbox.mode: "non-main"` para que las sesiones de grupo/canal (claves que no son main) se ejecuten en el backend de sandbox configurado, mientras la sesión principal de DM permanece en el host. Docker es el backend predeterminado si no eliges uno. Luego restringe qué herramientas están disponibles en sesiones en sandbox mediante `tools.sandbox.tools`.

    Recorrido de configuración + ejemplo: [Groups: DMs personales + grupos públicos](/es/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referencia clave de configuración: [Configuración del Gateway](/es/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="¿Cómo vinculo una carpeta del host dentro del sandbox?">
    Establece `agents.defaults.sandbox.docker.binds` en `["host:path:mode"]` (por ejemplo `"/home/user/src:/src:ro"`). Los binds globales + por agente se fusionan; los binds por agente se ignoran cuando `scope: "shared"`. Usa `:ro` para cualquier cosa sensible y recuerda que los binds atraviesan las paredes del sistema de archivos del sandbox.

    OpenClaw valida los orígenes de bind tanto contra la ruta normalizada como contra la ruta canónica resuelta a través del ancestro existente más profundo. Eso significa que los escapes por padre con symlink siguen fallando con cierre por defecto incluso cuando el último segmento de la ruta todavía no existe, y las comprobaciones de raíz permitida siguen aplicándose después de la resolución del symlink.

    Consulta [Sandboxing](/es/gateway/sandboxing#custom-bind-mounts) y [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) para ver ejemplos y notas de seguridad.

  </Accordion>

  <Accordion title="¿Cómo funciona la memoria?">
    La memoria de OpenClaw son simplemente archivos Markdown en el espacio de trabajo del agente:

    - Notas diarias en `memory/YYYY-MM-DD.md`
    - Notas curadas a largo plazo en `MEMORY.md` (solo sesiones principales/privadas)

    OpenClaw también ejecuta un **memory flush silencioso antes de Compaction** para recordar al modelo
    que escriba notas duraderas antes de la autocompactación. Esto solo se ejecuta cuando el espacio de trabajo
    es escribible (los sandboxes de solo lectura lo omiten). Consulta [Memory](/es/concepts/memory).

  </Accordion>

  <Accordion title="La memoria sigue olvidando cosas. ¿Cómo hago que se conserven?">
    Pide al bot que **escriba el dato en la memoria**. Las notas a largo plazo van en `MEMORY.md`,
    el contexto a corto plazo va en `memory/YYYY-MM-DD.md`.

    Esta sigue siendo un área que estamos mejorando. Ayuda recordar al modelo que almacene memorias;
    sabrá qué hacer. Si sigue olvidando cosas, verifica que el Gateway esté usando el mismo
    espacio de trabajo en cada ejecución.

    Documentación: [Memory](/es/concepts/memory), [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿La memoria persiste para siempre? ¿Cuáles son los límites?">
    Los archivos de memoria viven en disco y persisten hasta que los eliminas. El límite es tu
    almacenamiento, no el modelo. El **contexto de sesión** sigue estando limitado por la
    ventana de contexto del modelo, por lo que las conversaciones largas pueden compactarse o truncarse. Por eso
    existe la búsqueda en memoria: recupera solo las partes relevantes al contexto.

    Documentación: [Memory](/es/concepts/memory), [Contexto](/es/concepts/context).

  </Accordion>

  <Accordion title="¿La búsqueda semántica en memoria requiere una clave API de OpenAI?">
    Solo si usas **embeddings de OpenAI**. OAuth de Codex cubre chat/completions y
    **no** concede acceso a embeddings, así que **iniciar sesión con Codex (OAuth o el
    login de la CLI de Codex)** no sirve para la búsqueda semántica en memoria. Los embeddings de OpenAI
    siguen necesitando una clave API real (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Si no estableces un proveedor explícitamente, OpenClaw selecciona automáticamente un proveedor cuando
    puede resolver una clave API (perfiles de autenticación, `models.providers.*.apiKey` o variables de entorno).
    Prefiere OpenAI si se resuelve una clave de OpenAI; en caso contrario Gemini si se resuelve una clave de Gemini;
    luego Voyage y luego Mistral. Si no hay ninguna clave remota disponible, la búsqueda en memoria
    permanece deshabilitada hasta que la configures. Si tienes configurada y presente una ruta de modelo local, OpenClaw
    prefiere `local`. Ollama es compatible cuando estableces explícitamente
    `memorySearch.provider = "ollama"`.

    Si prefieres mantenerte en local, establece `memorySearch.provider = "local"` (y opcionalmente
    `memorySearch.fallback = "none"`). Si quieres embeddings de Gemini, establece
    `memorySearch.provider = "gemini"` y proporciona `GEMINI_API_KEY` (o
    `memorySearch.remote.apiKey`). Admitimos modelos de embeddings de **OpenAI, Gemini, Voyage, Mistral, Ollama o local**.
    Consulta [Memory](/es/concepts/memory) para ver los detalles de configuración.

  </Accordion>
</AccordionGroup>

## Dónde viven las cosas en disco

<AccordionGroup>
  <Accordion title="¿Todos los datos usados con OpenClaw se guardan localmente?">
    No: **el estado de OpenClaw es local**, pero **los servicios externos siguen viendo lo que les envías**.

    - **Local por defecto:** sesiones, archivos de memoria, configuración y espacio de trabajo viven en el host del Gateway
      (`~/.openclaw` + tu directorio de espacio de trabajo).
    - **Remoto por necesidad:** los mensajes que envías a proveedores de modelos (Anthropic/OpenAI/etc.) van a
      sus APIs, y las plataformas de chat (WhatsApp/Telegram/Slack/etc.) almacenan datos de mensajes en sus
      servidores.
    - **Tú controlas la huella:** usar modelos locales mantiene los prompts en tu máquina, pero el
      tráfico de canal sigue pasando por los servidores del canal.

    Relacionado: [Espacio de trabajo del agente](/es/concepts/agent-workspace), [Memory](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Dónde almacena OpenClaw sus datos?">
    Todo vive bajo `$OPENCLAW_STATE_DIR` (predeterminado: `~/.openclaw`):

    | Ruta                                                            | Finalidad                                                          |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuración principal (JSON5)                                    |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importación heredada de OAuth (copiada a perfiles de autenticación en el primer uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfiles de autenticación (OAuth, claves API y opcionalmente `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Carga útil opcional de secretos basada en archivo para proveedores SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Archivo heredado de compatibilidad (se depuran entradas estáticas `api_key`) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Estado del proveedor (por ejemplo `whatsapp/<accountId>/creds.json`) |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Estado por agente (agentDir + sesiones)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historial y estado de conversación (por agente)                    |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadatos de sesión (por agente)                                   |

    Ruta heredada de agente único: `~/.openclaw/agent/*` (migrada por `openclaw doctor`).

    Tu **espacio de trabajo** (`workspace`) (AGENTS.md, archivos de memoria, Skills, etc.) es independiente y se configura mediante `agents.defaults.workspace` (predeterminado: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="¿Dónde deberían vivir AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Estos archivos viven en el **espacio de trabajo del agente**, no en `~/.openclaw`.

    - **Espacio de trabajo (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, opcionalmente `HEARTBEAT.md`.
      El `memory.md` en minúsculas en la raíz es solo entrada heredada de reparación; `openclaw doctor --fix`
      puede fusionarlo en `MEMORY.md` cuando existen ambos archivos.
    - **Directorio de estado (`~/.openclaw`)**: configuración, estado de canal/proveedor, perfiles de autenticación, sesiones, registros,
      y Skills compartidas (`~/.openclaw/skills`).

    El espacio de trabajo predeterminado es `~/.openclaw/workspace`, configurable mediante:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si el bot "olvida" después de un reinicio, confirma que el Gateway esté usando el mismo
    espacio de trabajo en cada inicio (y recuerda: el modo remoto usa el **espacio de trabajo del host del gateway**,
    no el de tu portátil local).

    Consejo: si quieres un comportamiento o preferencia duraderos, pide al bot que **lo escriba en
    AGENTS.md o MEMORY.md** en lugar de depender del historial del chat.

    Consulta [Espacio de trabajo del agente](/es/concepts/agent-workspace) y [Memory](/es/concepts/memory).

  </Accordion>

  <Accordion title="Estrategia de copia de seguridad recomendada">
    Pon tu **espacio de trabajo del agente** en un repositorio git **privado** y haz una copia de seguridad en algún lugar
    privado (por ejemplo GitHub privado). Esto captura archivos de memoria + AGENTS/SOUL/USER
    y te permite restaurar más tarde la "mente" del asistente.

    **No** hagas commit de nada bajo `~/.openclaw` (credenciales, sesiones, tokens o cargas útiles cifradas de secretos).
    Si necesitas una restauración completa, haz copias de seguridad por separado tanto del espacio de trabajo como del directorio de estado
    (consulta la pregunta de migración más arriba).

    Documentación: [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿Cómo desinstalo OpenClaw por completo?">
    Consulta la guía dedicada: [Desinstalar](/es/install/uninstall).
  </Accordion>

  <Accordion title="¿Pueden los agentes trabajar fuera del espacio de trabajo?">
    Sí. El espacio de trabajo es el **cwd predeterminado** y el ancla de memoria, no un sandbox rígido.
    Las rutas relativas se resuelven dentro del espacio de trabajo, pero las rutas absolutas pueden acceder a otras
    ubicaciones del host a menos que el sandboxing esté habilitado. Si necesitas aislamiento, usa
    [`agents.defaults.sandbox`](/es/gateway/sandboxing) o configuración de sandbox por agente. Si
    quieres que un repositorio sea el directorio de trabajo predeterminado, apunta el
    `workspace` de ese agente a la raíz del repositorio. El repositorio de OpenClaw es solo código fuente; mantén el
    espacio de trabajo separado salvo que quieras intencionadamente que el agente trabaje dentro de él.

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
    El estado de sesión es propiedad del **host del gateway**. Si estás en modo remoto, el almacén de sesiones que te importa está en la máquina remota, no en tu portátil local. Consulta [Gestión de sesiones](/es/concepts/session).
  </Accordion>
</AccordionGroup>

## Conceptos básicos de configuración

<AccordionGroup>
  <Accordion title="¿Qué formato tiene la configuración? ¿Dónde está?">
    OpenClaw lee una configuración opcional en **JSON5** desde `$OPENCLAW_CONFIG_PATH` (predeterminado: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Si falta el archivo, usa valores predeterminados razonablemente seguros (incluido un espacio de trabajo predeterminado `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Definí gateway.bind: "lan" (o "tailnet") y ahora nada escucha / la IU dice unauthorized'>
    Los binds no loopback **requieren una ruta válida de autenticación del gateway**. En la práctica eso significa:

    - autenticación con secreto compartido: token o password
    - `gateway.auth.mode: "trusted-proxy"` detrás de un proxy inverso con reconocimiento de identidad y no loopback correctamente configurado

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

    - `gateway.remote.token` / `.password` **no** habilitan por sí mismos la autenticación local del gateway.
    - Las rutas de llamada locales pueden usar `gateway.remote.*` como alternativa solo cuando `gateway.auth.*` no está definido.
    - Para autenticación con password, establece `gateway.auth.mode: "password"` más `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`) en su lugar.
    - Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución falla con cierre por defecto (sin que la alternativa remota lo oculte).
    - Las configuraciones de IU de Control con secreto compartido se autentican mediante `connect.params.auth.token` o `connect.params.auth.password` (almacenados en la app/configuración de la IU). Los modos con identidad, como Tailscale Serve o `trusted-proxy`, usan en su lugar cabeceras de solicitud. Evita poner secretos compartidos en URLs.
    - Con `gateway.auth.mode: "trusted-proxy"`, los proxies inversos loopback en el mismo host siguen **sin** satisfacer la autenticación trusted-proxy. El proxy confiable debe ser una fuente no loopback configurada.

  </Accordion>

  <Accordion title="¿Por qué ahora necesito un token en localhost?">
    OpenClaw exige autenticación del gateway por defecto, incluido loopback. En la ruta predeterminada normal eso significa autenticación por token: si no se configura una ruta de autenticación explícita, el inicio del gateway se resuelve al modo token y genera automáticamente uno, guardándolo en `gateway.auth.token`, así que **los clientes WS locales deben autenticarse**. Esto impide que otros procesos locales llamen al Gateway.

    Si prefieres una ruta de autenticación distinta, puedes elegir explícitamente el modo password (o, para proxies inversos con reconocimiento de identidad y no loopback, `trusted-proxy`). Si **de verdad** quieres loopback abierto, establece `gateway.auth.mode: "none"` explícitamente en tu configuración. Doctor puede generarte un token en cualquier momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="¿Tengo que reiniciar después de cambiar la configuración?">
    El Gateway vigila la configuración y admite recarga en caliente:

    - `gateway.reload.mode: "hybrid"` (predeterminado): aplica en caliente cambios seguros, reinicia para los críticos
    - También se admiten `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="¿Cómo desactivo los eslóganes graciosos de la CLI?">
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

    - `off`: oculta el texto del eslogan pero mantiene la línea de título/versión del banner.
    - `default`: usa `All your chats, one OpenClaw.` siempre.
    - `random`: eslóganes rotativos graciosos/de temporada (comportamiento predeterminado).
    - Si no quieres ningún banner, establece la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="¿Cómo habilito web search (y web fetch)?">
    `web_fetch` funciona sin clave API. `web_search` depende del
    proveedor seleccionado:

    - Los proveedores respaldados por API como Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity y Tavily requieren la configuración normal de su clave API.
    - Ollama Web Search no requiere clave, pero usa tu host Ollama configurado y requiere `ollama signin`.
    - DuckDuckGo no requiere clave, pero es una integración no oficial basada en HTML.
    - SearXNG no requiere clave y es autoalojado; configura `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recomendado:** ejecuta `openclaw configure --section web` y elige un proveedor.
    Alternativas mediante variables de entorno:

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
              provider: "firecrawl", // opcional; omítelo para detección automática
            },
          },
        },
    }
    ```

    La configuración específica del proveedor para web search ahora vive en `plugins.entries.<plugin>.config.webSearch.*`.
    Las rutas heredadas de proveedor `tools.web.search.*` siguen cargándose temporalmente por compatibilidad, pero no deberían usarse en configuraciones nuevas.
    La configuración alternativa de web fetch de Firecrawl vive en `plugins.entries.firecrawl.config.webFetch.*`.

    Notas:

    - Si usas allowlists, agrega `web_search`/`web_fetch`/`x_search` o `group:web`.
    - `web_fetch` está habilitado por defecto (a menos que se deshabilite explícitamente).
    - Si se omite `tools.web.fetch.provider`, OpenClaw detecta automáticamente el primer proveedor alternativo de fetch listo a partir de las credenciales disponibles. Hoy el proveedor incluido es Firecrawl.
    - Los daemons leen variables de entorno desde `~/.openclaw/.env` (o el entorno del servicio).

    Documentación: [Herramientas web](/es/tools/web).

  </Accordion>

  <Accordion title="config.apply borró mi configuración. ¿Cómo la recupero y cómo evito esto?">
    `config.apply` reemplaza la **configuración completa**. Si envías un objeto parcial, todo
    lo demás se elimina.

    El OpenClaw actual protege contra muchos sobrescritos accidentales:

    - Las escrituras de configuración propiedad de OpenClaw validan toda la configuración posterior al cambio antes de escribir.
    - Las escrituras propiedad de OpenClaw inválidas o destructivas se rechazan y se guardan como `openclaw.json.rejected.*`.
    - Si una edición directa rompe el inicio o la recarga en caliente, el Gateway restaura la última configuración válida conocida y guarda el archivo rechazado como `openclaw.json.clobbered.*`.
    - El agente principal recibe una advertencia al arrancar después de la recuperación para que no vuelva a escribir ciegamente la configuración incorrecta.

    Recuperación:

    - Comprueba `openclaw logs --follow` para ver `Config auto-restored from last-known-good`, `Config write rejected:` o `config reload restored last-known-good config`.
    - Inspecciona el archivo más reciente `openclaw.json.clobbered.*` o `openclaw.json.rejected.*` junto a la configuración activa.
    - Conserva la configuración activa restaurada si funciona y luego copia de vuelta solo las claves pretendidas con `openclaw config set` o `config.patch`.
    - Ejecuta `openclaw config validate` y `openclaw doctor`.
    - Si no tienes ninguna carga útil rechazada o de última configuración válida conocida, restaura desde una copia de seguridad, o vuelve a ejecutar `openclaw doctor` y reconfigura canales/modelos.
    - Si esto fue inesperado, reporta un bug e incluye tu última configuración conocida o cualquier copia de seguridad.
    - Un agente local de programación a menudo puede reconstruir una configuración funcional a partir de registros o historial.

    Evítalo:

    - Usa `openclaw config set` para cambios pequeños.
    - Usa `openclaw configure` para ediciones interactivas.
    - Usa primero `config.schema.lookup` cuando no estés seguro de una ruta exacta o de la forma de un campo; devuelve un nodo de esquema superficial más resúmenes inmediatos de hijos para profundizar.
    - Usa `config.patch` para ediciones RPC parciales; reserva `config.apply` solo para reemplazo de configuración completa.
    - Si usas la herramienta `gateway`, solo para propietarios, desde una ejecución del agente, seguirá rechazando escrituras en `tools.exec.ask` / `tools.exec.security` (incluidos alias heredados `tools.bash.*` que se normalizan a las mismas rutas protegidas de exec).

    Documentación: [Config](/es/cli/config), [Configure](/es/cli/configure), [Solución de problemas del gateway](/es/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Cómo ejecuto un Gateway central con workers especializados en varios dispositivos?">
    El patrón común es **un Gateway** (por ejemplo Raspberry Pi) más **Nodes** y **agentes**:

    - **Gateway (central):** es propietario de canales (Signal/WhatsApp), enrutamiento y sesiones.
    - **Nodes (dispositivos):** Macs/iOS/Android se conectan como periféricos y exponen herramientas locales (`system.run`, `canvas`, `camera`).
    - **Agentes (workers):** cerebros/espacios de trabajo separados para funciones especiales (por ejemplo "Hetzner ops", "Personal data").
    - **Subagentes:** generan trabajo en segundo plano desde un agente principal cuando quieres paralelismo.
    - **TUI:** se conecta al Gateway y cambia entre agentes/sesiones.

    Documentación: [Nodes](/es/nodes), [Acceso remoto](/es/gateway/remote), [Enrutamiento multiagente](/es/concepts/multi-agent), [Sub-agents](/es/tools/subagents), [TUI](/es/web/tui).

  </Accordion>

  <Accordion title="¿Puede ejecutarse sin interfaz el navegador de OpenClaw?">
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

    El valor predeterminado es `false` (con interfaz). El modo headless tiene más probabilidades de activar comprobaciones antibot en algunos sitios. Consulta [Browser](/es/tools/browser).

    El modo headless usa el **mismo motor Chromium** y funciona para la mayoría de automatizaciones (formularios, clics, scraping, logins). Las diferencias principales:

    - No hay una ventana visible del navegador (usa capturas de pantalla si necesitas elementos visuales).
    - Algunos sitios son más estrictos con la automatización en modo headless (CAPTCHA, antibot).
      Por ejemplo, X/Twitter suele bloquear sesiones headless.

  </Accordion>

  <Accordion title="¿Cómo uso Brave para el control del navegador?">
    Establece `browser.executablePath` en tu binario de Brave (o cualquier navegador basado en Chromium) y reinicia el Gateway.
    Consulta los ejemplos completos de configuración en [Browser](/es/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways remotos y Nodes

<AccordionGroup>
  <Accordion title="¿Cómo se propagan los comandos entre Telegram, el gateway y los Nodes?">
    Los mensajes de Telegram los maneja el **gateway**. El gateway ejecuta el agente y
    solo después llama a los Nodes a través del **Gateway WebSocket** cuando se necesita una herramienta de Node:

    Telegram → Gateway → Agente → `node.*` → Node → Gateway → Telegram

    Los Nodes no ven tráfico entrante del proveedor; solo reciben llamadas RPC de Node.

  </Accordion>

  <Accordion title="¿Cómo puede mi agente acceder a mi ordenador si el Gateway está alojado de forma remota?">
    Respuesta corta: **empareja tu ordenador como un Node**. El Gateway se ejecuta en otro lugar, pero puede
    llamar herramientas `node.*` (pantalla, cámara, sistema) en tu máquina local mediante el Gateway WebSocket.

    Configuración típica:

    1. Ejecuta el Gateway en el host siempre activo (VPS/servidor doméstico).
    2. Pon el host del Gateway + tu ordenador en la misma tailnet.
    3. Asegúrate de que el WS del Gateway sea accesible (bind de tailnet o túnel SSH).
    4. Abre la app de macOS localmente y conéctate en modo **Remote over SSH** (o tailnet directo)
       para que pueda registrarse como Node.
    5. Aprueba el Node en el Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    No hace falta un puente TCP separado; los Nodes se conectan mediante el Gateway WebSocket.

    Recordatorio de seguridad: emparejar un Node de macOS permite `system.run` en esa máquina. Empareja solo
    dispositivos en los que confíes y revisa [Seguridad](/es/gateway/security).

    Documentación: [Nodes](/es/nodes), [Protocolo del Gateway](/es/gateway/protocol), [modo remoto en macOS](/es/platforms/mac/remote), [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="Tailscale está conectado pero no recibo respuestas. ¿Y ahora qué?">
    Comprueba lo básico:

    - El Gateway se está ejecutando: `openclaw gateway status`
    - Estado del Gateway: `openclaw status`
    - Estado de canales: `openclaw channels status`

    Luego verifica autenticación y enrutamiento:

    - Si usas Tailscale Serve, asegúrate de que `gateway.auth.allowTailscale` esté configurado correctamente.
    - Si te conectas mediante túnel SSH, confirma que el túnel local está activo y apunta al puerto correcto.
    - Confirma que tus allowlists (DM o grupo) incluyen tu cuenta.

    Documentación: [Tailscale](/es/gateway/tailscale), [Acceso remoto](/es/gateway/remote), [Channels](/es/channels).

  </Accordion>

  <Accordion title="¿Pueden comunicarse entre sí dos instancias de OpenClaw (local + VPS)?">
    Sí. No hay un puente integrado “bot a bot”, pero puedes conectarlas de varias
    maneras fiables:

    **La más simple:** usa un canal de chat normal al que ambos bots puedan acceder (Telegram/Slack/WhatsApp).
    Haz que el bot A envíe un mensaje al bot B y luego deja que el bot B responda como de costumbre.

    **Puente de CLI (genérico):** ejecuta un script que llame al otro Gateway con
    `openclaw agent --message ... --deliver`, apuntando a un chat donde el otro bot
    escuche. Si uno de los bots está en un VPS remoto, apunta tu CLI a ese Gateway remoto
    mediante SSH/Tailscale (consulta [Acceso remoto](/es/gateway/remote)).

    Patrón de ejemplo (ejecuta desde una máquina que pueda alcanzar el Gateway de destino):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Consejo: agrega una protección para que los dos bots no entren en un bucle sin fin (solo mención, allowlists de canal o una regla de “no responder a mensajes de bots”).

    Documentación: [Acceso remoto](/es/gateway/remote), [Agent CLI](/es/cli/agent), [Agent send](/es/tools/agent-send).

  </Accordion>

  <Accordion title="¿Necesito VPS separados para varios agentes?">
    No. Un Gateway puede alojar varios agentes, cada uno con su propio espacio de trabajo, valores predeterminados de modelo
    y enrutamiento. Esa es la configuración normal y es mucho más barata y más simple que ejecutar
    un VPS por agente.

    Usa VPS separados solo cuando necesites aislamiento fuerte (límites de seguridad) o configuraciones muy
    diferentes que no quieras compartir. En caso contrario, mantén un Gateway y
    usa varios agentes o subagentes.

  </Accordion>

  <Accordion title="¿Hay alguna ventaja en usar un Node en mi portátil personal en lugar de SSH desde un VPS?">
    Sí: los Nodes son la forma de primera clase de acceder a tu portátil desde un Gateway remoto, y
    habilitan más que acceso shell. El Gateway se ejecuta en macOS/Linux (Windows mediante WSL2) y es
    ligero (vale un VPS pequeño o una máquina tipo Raspberry Pi; 4 GB de RAM son suficientes), así que una configuración
    común es un host siempre activo más tu portátil como Node.

    - **No requiere SSH entrante.** Los Nodes se conectan hacia fuera al Gateway WebSocket y usan emparejamiento de dispositivos.
    - **Controles de ejecución más seguros.** `system.run` está restringido por allowlists/aprobaciones del Node en ese portátil.
    - **Más herramientas de dispositivo.** Los Nodes exponen `canvas`, `camera` y `screen` además de `system.run`.
    - **Automatización local del navegador.** Mantén el Gateway en un VPS, pero ejecuta Chrome localmente mediante un host Node en el portátil, o adjúntate al Chrome local en el host mediante Chrome MCP.

    SSH está bien para acceso shell ad hoc, pero los Nodes son más simples para flujos de trabajo continuos del agente y
    automatización de dispositivos.

    Documentación: [Nodes](/es/nodes), [Nodes CLI](/es/cli/nodes), [Browser](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Los Nodes ejecutan un servicio de gateway?">
    No. Solo **un gateway** debería ejecutarse por host, salvo que ejecutes intencionadamente perfiles aislados (consulta [Varios gateways](/es/gateway/multiple-gateways)). Los Nodes son periféricos que se conectan
    al gateway (Nodes de iOS/Android o el “modo Node” de macOS en la app de barra de menú). Para hosts Node sin interfaz
    y control por CLI, consulta [Node host CLI](/es/cli/node).

    Se requiere un reinicio completo para cambios en `gateway`, `discovery` y `canvasHost`.

  </Accordion>

  <Accordion title="¿Hay una forma API / RPC de aplicar configuración?">
    Sí.

    - `config.schema.lookup`: inspecciona un subárbol de configuración con su nodo de esquema superficial, pista de IU coincidente y resúmenes inmediatos de hijos antes de escribir
    - `config.get`: obtiene la instantánea actual + hash
    - `config.patch`: actualización parcial segura (preferida para la mayoría de ediciones RPC); recarga en caliente cuando es posible y reinicia cuando es necesario
    - `config.apply`: valida + reemplaza la configuración completa; recarga en caliente cuando es posible y reinicia cuando es necesario
    - La herramienta de tiempo de ejecución `gateway`, solo para propietarios, sigue negándose a reescribir `tools.exec.ask` / `tools.exec.security`; los alias heredados `tools.bash.*` se normalizan a las mismas rutas protegidas de exec

  </Accordion>

  <Accordion title="Configuración mínima sensata para una primera instalación">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Esto configura tu espacio de trabajo y restringe quién puede activar el bot.

  </Accordion>

  <Accordion title="¿Cómo configuro Tailscale en un VPS y me conecto desde mi Mac?">
    Pasos mínimos:

    1. **Instalar + iniciar sesión en el VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Instalar + iniciar sesión en tu Mac**
       - Usa la app de Tailscale e inicia sesión en la misma tailnet.
    3. **Habilitar MagicDNS (recomendado)**
       - En la consola de administración de Tailscale, habilita MagicDNS para que el VPS tenga un nombre estable.
    4. **Usar el nombre de host de la tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Si quieres la IU de Control sin SSH, usa Tailscale Serve en el VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Esto mantiene el gateway enlazado a loopback y expone HTTPS mediante Tailscale. Consulta [Tailscale](/es/gateway/tailscale).

  </Accordion>

  <Accordion title="¿Cómo conecto un Node de Mac a un Gateway remoto (Tailscale Serve)?">
    Serve expone la **IU de Control + WS** del Gateway. Los Nodes se conectan por el mismo endpoint WS del Gateway.

    Configuración recomendada:

    1. **Asegúrate de que el VPS + el Mac estén en la misma tailnet**.
    2. **Usa la app de macOS en modo Remote** (el objetivo SSH puede ser el nombre de host de la tailnet).
       La app tunelizará el puerto del Gateway y se conectará como Node.
    3. **Aprueba el Node** en el gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentación: [Protocolo del Gateway](/es/gateway/protocol), [Discovery](/es/gateway/discovery), [modo remoto en macOS](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Debería instalarlo en un segundo portátil o simplemente agregar un Node?">
    Si solo necesitas **herramientas locales** (pantalla/cámara/exec) en el segundo portátil, agrégalo como
    **Node**. Eso mantiene un único Gateway y evita configuración duplicada. Las herramientas locales de Node son
    actualmente solo para macOS, pero planeamos ampliarlas a otros sistemas operativos.

    Instala un segundo Gateway solo cuando necesites **aislamiento fuerte** o dos bots completamente separados.

    Documentación: [Nodes](/es/nodes), [Nodes CLI](/es/cli/nodes), [Varios gateways](/es/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables de entorno y carga de .env

<AccordionGroup>
  <Accordion title="¿Cómo carga OpenClaw las variables de entorno?">
    OpenClaw lee variables de entorno del proceso padre (shell, launchd/systemd, CI, etc.) y además carga:

    - `.env` del directorio de trabajo actual
    - un `.env` global alternativo desde `~/.openclaw/.env` (también `$OPENCLAW_STATE_DIR/.env`)

    Ninguno de los archivos `.env` sobrescribe variables de entorno existentes.

    También puedes definir variables de entorno inline en la configuración (se aplican solo si faltan en el entorno del proceso):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Consulta [/environment](/es/help/environment) para ver la precedencia completa y las fuentes.

  </Accordion>

  <Accordion title="Inicié el Gateway mediante el servicio y mis variables de entorno desaparecieron. ¿Y ahora?">
    Dos correcciones comunes:

    1. Pon las claves que faltan en `~/.openclaw/.env` para que se recojan incluso cuando el servicio no herede el entorno de tu shell.
    2. Habilita la importación del shell (comodidad opcional):

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

    Esto ejecuta tu shell de login e importa solo las claves esperadas que faltan (nunca sobrescribe). Equivalentes en variables de entorno:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Definí COPILOT_GITHUB_TOKEN, pero models status muestra "Shell env: off." ¿Por qué?'>
    `openclaw models status` informa si la **importación del entorno de shell** está habilitada. "Shell env: off"
    **no** significa que falten tus variables de entorno; solo significa que OpenClaw no cargará
    tu shell de login automáticamente.

    Si el Gateway se ejecuta como servicio (launchd/systemd), no heredará el
    entorno de tu shell. Corrígelo haciendo una de estas cosas:

    1. Pon el token en `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. O habilita la importación del shell (`env.shellEnv.enabled: true`).
    3. O agrégalo al bloque `env` de tu configuración (se aplica solo si falta).

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

  <Accordion title="¿Las sesiones se reinician automáticamente si nunca envío /new?">
    Las sesiones pueden caducar después de `session.idleMinutes`, pero esto está **deshabilitado por defecto** (predeterminado **0**).
    Establécelo en un valor positivo para habilitar la caducidad por inactividad. Cuando está habilitado, el **siguiente**
    mensaje después del período de inactividad inicia un ID de sesión nuevo para esa clave de chat.
    Esto no elimina transcripciones; solo inicia una nueva sesión.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="¿Hay una forma de crear un equipo de instancias de OpenClaw (un CEO y muchos agentes)?">
    Sí, mediante **enrutamiento multiagente** y **subagentes**. Puedes crear un agente coordinador
    y varios agentes workers con sus propios espacios de trabajo y modelos.

    Dicho eso, esto se entiende mejor como un **experimento divertido**. Consume muchos tokens y a menudo
    es menos eficiente que usar un bot con sesiones separadas. El modelo típico que
    imaginamos es un bot con el que hablas, con diferentes sesiones para trabajo en paralelo. Ese
    bot también puede generar subagentes cuando sea necesario.

    Documentación: [Enrutamiento multiagente](/es/concepts/multi-agent), [Sub-agents](/es/tools/subagents), [Agents CLI](/es/cli/agents).

  </Accordion>

  <Accordion title="¿Por qué se truncó el contexto a mitad de tarea? ¿Cómo lo evito?">
    El contexto de la sesión está limitado por la ventana del modelo. Los chats largos, las salidas grandes de herramientas o muchos
    archivos pueden activar Compaction o truncamiento.

    Qué ayuda:

    - Pide al bot que resuma el estado actual y lo escriba en un archivo.
    - Usa `/compact` antes de tareas largas y `/new` al cambiar de tema.
    - Mantén el contexto importante en el espacio de trabajo y pide al bot que lo vuelva a leer.
    - Usa subagentes para trabajo largo o en paralelo para que el chat principal siga siendo más pequeño.
    - Elige un modelo con una ventana de contexto más grande si esto ocurre a menudo.

  </Accordion>

  <Accordion title="¿Cómo restablezco OpenClaw por completo pero manteniéndolo instalado?">
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

    - La incorporación también ofrece **Reset** si detecta una configuración existente. Consulta [Onboarding (CLI)](/es/start/wizard).
    - Si usaste perfiles (`--profile` / `OPENCLAW_PROFILE`), restablece cada directorio de estado (los predeterminados son `~/.openclaw-<profile>`).
    - Restablecimiento de desarrollo: `openclaw gateway --dev --reset` (solo desarrollo; borra configuración de desarrollo + credenciales + sesiones + espacio de trabajo).

  </Accordion>

  <Accordion title='Estoy recibiendo errores de "context too large". ¿Cómo restablezco o compacto?'>
    Usa una de estas opciones:

    - **Compactar** (mantiene la conversación pero resume los turnos más antiguos):

      ```
      /compact
      ```

      o `/compact <instructions>` para guiar el resumen.

    - **Restablecer** (ID de sesión nuevo para la misma clave de chat):

      ```
      /new
      /reset
      ```

    Si sigue ocurriendo:

    - Habilita o ajusta la **poda de sesión** (`agents.defaults.contextPruning`) para recortar salidas antiguas de herramientas.
    - Usa un modelo con una ventana de contexto mayor.

    Documentación: [Compaction](/es/concepts/compaction), [Poda de sesión](/es/concepts/session-pruning), [Gestión de sesiones](/es/concepts/session).

  </Accordion>

  <Accordion title='¿Por qué veo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Esto es un error de validación del proveedor: el modelo emitió un bloque `tool_use` sin el
    `input` requerido. Suele significar que el historial de sesión está obsoleto o dañado (a menudo tras hilos largos
    o un cambio de herramienta/esquema).

    Solución: inicia una sesión nueva con `/new` (mensaje independiente).

  </Accordion>

  <Accordion title="¿Por qué recibo mensajes de Heartbeat cada 30 minutos?">
    Los Heartbeats se ejecutan cada **30m** por defecto (**1h** cuando se usa autenticación OAuth). Ajústalos o deshabilítalos:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // o "0m" para deshabilitar
          },
        },
      },
    }
    ```

    Si `HEARTBEAT.md` existe pero está prácticamente vacío (solo líneas en blanco y encabezados
    Markdown como `# Heading`), OpenClaw omite la ejecución de Heartbeat para ahorrar llamadas API.
    Si el archivo falta, el Heartbeat sigue ejecutándose y el modelo decide qué hacer.

    Las sobrescrituras por agente usan `agents.list[].heartbeat`. Documentación: [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title='¿Tengo que añadir una "cuenta de bot" a un grupo de WhatsApp?'>
    No. OpenClaw se ejecuta en **tu propia cuenta**, así que si estás en el grupo, OpenClaw puede verlo.
    Por defecto, las respuestas en grupo están bloqueadas hasta que permites remitentes (`groupPolicy: "allowlist"`).

    Si quieres que solo **tú** puedas activar respuestas en grupo:

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

    Busca `chatId` (o `from`) terminado en `@g.us`, por ejemplo:
    `1234567890-1234567890@g.us`.

    Opción 2 (si ya está configurado/en allowlist): lista grupos desde la configuración:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentación: [WhatsApp](/es/channels/whatsapp), [Directory](/es/cli/directory), [Logs](/es/cli/logs).

  </Accordion>

  <Accordion title="¿Por qué OpenClaw no responde en un grupo?">
    Dos causas comunes:

    - La restricción por mención está activada (predeterminado). Debes @mencionar al bot (o coincidir con `mentionPatterns`).
    - Configuraste `channels.whatsapp.groups` sin `"*"` y el grupo no está en allowlist.

    Consulta [Groups](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).

  </Accordion>

  <Accordion title="¿Los grupos/hilos comparten contexto con los DMs?">
    Los chats directos se reducen a la sesión principal por defecto. Los grupos/canales tienen sus propias claves de sesión, y los temas de Telegram / hilos de Discord son sesiones separadas. Consulta [Groups](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).
  </Accordion>

  <Accordion title="¿Cuántos espacios de trabajo y agentes puedo crear?">
    No hay límites estrictos. Docenas (incluso cientos) están bien, pero vigila:

    - **Crecimiento en disco:** las sesiones + transcripciones viven bajo `~/.openclaw/agents/<agentId>/sessions/`.
    - **Coste de tokens:** más agentes significa más uso concurrente del modelo.
    - **Sobrecarga operativa:** perfiles de autenticación, espacios de trabajo y enrutamiento de canales por agente.

    Consejos:

    - Mantén un espacio de trabajo **activo** por agente (`agents.defaults.workspace`).
    - Poda sesiones antiguas (elimina JSONL o entradas del almacén) si el disco crece.
    - Usa `openclaw doctor` para detectar espacios de trabajo sueltos y desajustes de perfiles.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios bots o chats al mismo tiempo (Slack), y cómo debería configurarlo?">
    Sí. Usa **enrutamiento multiagente** para ejecutar varios agentes aislados y enrutar mensajes entrantes por
    canal/cuenta/peer. Slack es compatible como canal y puede vincularse a agentes específicos.

    El acceso al navegador es potente, pero no equivale a "hacer cualquier cosa que un humano pueda" — antibot, CAPTCHA y MFA pueden
    seguir bloqueando la automatización. Para el control más fiable del navegador, usa Chrome MCP local en el host,
    o usa CDP en la máquina que realmente ejecuta el navegador.

    Configuración recomendada:

    - Host de Gateway siempre activo (VPS/Mac mini).
    - Un agente por función (bindings).
    - Canales de Slack vinculados a esos agentes.
    - Navegador local mediante Chrome MCP o un Node cuando sea necesario.

    Documentación: [Enrutamiento multiagente](/es/concepts/multi-agent), [Slack](/es/channels/slack),
    [Browser](/es/tools/browser), [Nodes](/es/nodes).

  </Accordion>
</AccordionGroup>

## Modelos, conmutación por error y perfiles de autenticación

Las preguntas y respuestas sobre modelos — valores predeterminados, selección, alias, cambio, conmutación por error y perfiles de autenticación —
se trasladaron a una página dedicada:
[FAQ — modelos y perfiles de autenticación](/es/help/faq-models).

## Gateway: puertos, "already running" y modo remoto

<AccordionGroup>
  <Accordion title="¿Qué puerto usa el Gateway?">
    `gateway.port` controla el único puerto multiplexado para WebSocket + HTTP (IU de Control, hooks, etc.).

    Precedencia:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > predeterminado 18789
    ```

  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status dice "Runtime: running" pero "Connectivity probe: failed"?'>
    Porque "running" es la vista del **supervisor** (launchd/systemd/schtasks). El connectivity probe es la CLI conectándose realmente al Gateway WebSocket.

    Usa `openclaw gateway status` y confía en estas líneas:

    - `Probe target:` (la URL que el probe usó realmente)
    - `Listening:` (lo que realmente está enlazado en el puerto)
    - `Last gateway error:` (causa raíz común cuando el proceso está vivo pero el puerto no escucha)

  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status muestra "Config (cli)" y "Config (service)" diferentes?'>
    Estás editando un archivo de configuración mientras el servicio ejecuta otro distinto (a menudo un desajuste de `--profile` / `OPENCLAW_STATE_DIR`).

    Solución:

    ```bash
    openclaw gateway install --force
    ```

    Ejecútalo desde el mismo `--profile` / entorno que quieras que use el servicio.

  </Accordion>

  <Accordion title='¿Qué significa "another gateway instance is already listening"?'>
    OpenClaw impone un bloqueo de tiempo de ejecución enlazando inmediatamente el listener WebSocket al arrancar (predeterminado `ws://127.0.0.1:18789`). Si el bind falla con `EADDRINUSE`, lanza `GatewayLockError` indicando que otra instancia ya está escuchando.

    Solución: detén la otra instancia, libera el puerto o ejecuta con `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="¿Cómo ejecuto OpenClaw en modo remoto (el cliente se conecta a un Gateway en otro sitio)?">
    Establece `gateway.mode: "remote"` y apunta a una URL remota WebSocket, opcionalmente con credenciales remotas de secreto compartido:

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

    - `openclaw gateway` solo se inicia cuando `gateway.mode` es `local` (o si pasas la bandera de sobrescritura).
    - La app de macOS vigila el archivo de configuración y cambia de modo en vivo cuando estos valores cambian.
    - `gateway.remote.token` / `.password` son solo credenciales remotas del lado cliente; no habilitan por sí solas la autenticación local del gateway.

  </Accordion>

  <Accordion title='La IU de Control dice "unauthorized" (o sigue reconectándose). ¿Y ahora qué?'>
    La ruta de autenticación de tu gateway y el método de autenticación de la IU no coinciden.

    Hechos (según el código):

    - La IU de Control mantiene el token en `sessionStorage` para la sesión actual de la pestaña del navegador y la URL seleccionada del gateway, por lo que las actualizaciones en la misma pestaña siguen funcionando sin restaurar la persistencia de token de larga duración en localStorage.
    - En `AUTH_TOKEN_MISMATCH`, los clientes de confianza pueden intentar un reintento limitado con un token de dispositivo almacenado en caché cuando el gateway devuelve sugerencias de reintento (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ese reintento con token en caché ahora reutiliza los scopes aprobados almacenados con el token del dispositivo. Los llamadores con `deviceToken` explícito / `scopes` explícitos siguen manteniendo su conjunto de scopes solicitado en lugar de heredar los scopes almacenados en caché.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es token/password compartidos explícitos primero, luego `deviceToken` explícito, luego token de dispositivo almacenado y después token bootstrap.
    - Las comprobaciones de alcance del token bootstrap usan prefijos de rol. La allowlist integrada de operador bootstrap solo satisface solicitudes de operador; los Nodes u otros roles no operadores siguen necesitando scopes bajo su propio prefijo de rol.

    Solución:

    - La más rápida: `openclaw dashboard` (imprime + copia la URL del dashboard, intenta abrir; muestra una sugerencia SSH si no hay interfaz).
    - Si aún no tienes token: `openclaw doctor --generate-gateway-token`.
    - Si estás en remoto, tuneliza primero: `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`.
    - Modo de secreto compartido: establece `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, y luego pega el secreto correspondiente en la configuración de la IU de Control.
    - Modo Tailscale Serve: asegúrate de que `gateway.auth.allowTailscale` esté habilitado y de que estés abriendo la URL de Serve, no una URL loopback/tailnet sin procesar que omita las cabeceras de identidad de Tailscale.
    - Modo trusted-proxy: asegúrate de pasar por el proxy con reconocimiento de identidad y no loopback configurado, no por un proxy loopback en el mismo host ni por la URL directa del gateway.
    - Si la discrepancia persiste después del único reintento, rota o vuelve a aprobar el token del dispositivo emparejado:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Si esa llamada rotate dice que fue denegada, comprueba dos cosas:
      - las sesiones de dispositivo emparejado solo pueden rotar **su propio** dispositivo a menos que también tengan `operator.admin`
      - los valores explícitos de `--scope` no pueden exceder los scopes actuales de operador del llamador
    - ¿Sigues atascado? Ejecuta `openclaw status --all` y sigue [Solución de problemas](/es/gateway/troubleshooting). Consulta [Dashboard](/es/web/dashboard) para detalles de autenticación.

  </Accordion>

  <Accordion title="Definí gateway.bind tailnet pero no puede enlazar y nada escucha">
    El bind `tailnet` elige una IP de Tailscale a partir de tus interfaces de red (100.64.0.0/10). Si la máquina no está en Tailscale (o la interfaz está caída), no hay nada a lo que enlazarse.

    Solución:

    - Inicia Tailscale en ese host (para que tenga una dirección 100.x), o
    - Cambia a `gateway.bind: "loopback"` / `"lan"`.

    Nota: `tailnet` es explícito. `auto` prefiere loopback; usa `gateway.bind: "tailnet"` cuando quieras un bind solo de tailnet.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios Gateways en el mismo host?">
    Normalmente no: un solo Gateway puede ejecutar varios canales de mensajería y agentes. Usa varios Gateways solo cuando necesites redundancia (por ejemplo, bot de rescate) o aislamiento fuerte.

    Sí, pero debes aislar:

    - `OPENCLAW_CONFIG_PATH` (configuración por instancia)
    - `OPENCLAW_STATE_DIR` (estado por instancia)
    - `agents.defaults.workspace` (aislamiento del espacio de trabajo)
    - `gateway.port` (puertos únicos)

    Configuración rápida (recomendada):

    - Usa `openclaw --profile <name> ...` por instancia (crea automáticamente `~/.openclaw-<name>`).
    - Establece un `gateway.port` único en la configuración de cada perfil (o pasa `--port` para ejecuciones manuales).
    - Instala un servicio por perfil: `openclaw --profile <name> gateway install`.

    Los perfiles también añaden sufijos a los nombres de servicio (`ai.openclaw.<profile>`; heredado `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guía completa: [Varios gateways](/es/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='¿Qué significa "invalid handshake" / code 1008?'>
    El Gateway es un **servidor WebSocket** y espera que el primer mensaje sea
    un frame `connect`. Si recibe cualquier otra cosa, cierra la conexión
    con el **código 1008** (violación de política).

    Causas comunes:

    - Abriste la URL **HTTP** en un navegador (`http://...`) en lugar de un cliente WS.
    - Usaste el puerto o la ruta incorrectos.
    - Un proxy o túnel eliminó cabeceras de autenticación o envió una solicitud que no era del Gateway.

    Soluciones rápidas:

    1. Usa la URL WS: `ws://<host>:18789` (o `wss://...` si es HTTPS).
    2. No abras el puerto WS en una pestaña normal del navegador.
    3. Si la autenticación está activada, incluye el token/password en el frame `connect`.

    Si usas la CLI o la TUI, la URL debería verse así:

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

    Puedes establecer una ruta estable mediante `logging.file`. El nivel de registro del archivo se controla con `logging.level`. La verbosidad de la consola se controla con `--verbose` y `logging.consoleLevel`.

    Forma más rápida de seguir registros:

    ```bash
    openclaw logs --follow
    ```

    Registros del servicio/supervisor (cuando el gateway se ejecuta mediante launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` y `gateway.err.log` (predeterminado: `~/.openclaw/logs/...`; los perfiles usan `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Consulta [Solución de problemas](/es/gateway/troubleshooting) para más información.

  </Accordion>

  <Accordion title="¿Cómo inicio/detengo/reinicio el servicio Gateway?">
    Usa los ayudantes del gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Si ejecutas el gateway manualmente, `openclaw gateway --force` puede recuperar el puerto. Consulta [Gateway](/es/gateway).

  </Accordion>

  <Accordion title="Cerré mi terminal en Windows. ¿Cómo reinicio OpenClaw?">
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

    Documentación: [Windows (WSL2)](/es/platforms/windows), [Runbook del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="El Gateway está activo pero las respuestas nunca llegan. ¿Qué debería comprobar?">
    Empieza con una comprobación rápida de estado:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causas comunes:

    - La autenticación del modelo no está cargada en el **host del gateway** (comprueba `models status`).
    - El pairing/allowlist del canal bloquea respuestas (comprueba la configuración del canal + registros).
    - WebChat/Dashboard está abierto sin el token correcto.

    Si estás en remoto, confirma que la conexión SSH/Tailscale esté activa y que el
    Gateway WebSocket sea accesible.

    Documentación: [Channels](/es/channels), [Solución de problemas](/es/gateway/troubleshooting), [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — ¿y ahora qué?'>
    Esto normalmente significa que la IU perdió la conexión WebSocket. Comprueba:

    1. ¿El Gateway se está ejecutando? `openclaw gateway status`
    2. ¿El Gateway está en buen estado? `openclaw status`
    3. ¿La IU tiene el token correcto? `openclaw dashboard`
    4. Si es remoto, ¿está activa la conexión del túnel/Tailscale?

    Luego sigue los registros:

    ```bash
    openclaw logs --follow
    ```

    Documentación: [Dashboard](/es/web/dashboard), [Acceso remoto](/es/gateway/remote), [Solución de problemas](/es/gateway/troubleshooting).

  </Accordion>

  <Accordion title="¿Falla Telegram setMyCommands? ¿Qué debería comprobar?">
    Empieza por los registros y el estado del canal:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Luego haz coincidir el error:

    - `BOT_COMMANDS_TOO_MUCH`: el menú de Telegram tiene demasiadas entradas. OpenClaw ya recorta hasta el límite de Telegram y reintenta con menos comandos, pero aún así hay que eliminar algunas entradas del menú. Reduce comandos de plugins/Skills/personalizados, o desactiva `channels.telegram.commands.native` si no necesitas el menú.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` u errores de red similares: si estás en un VPS o detrás de un proxy, confirma que HTTPS saliente esté permitido y que DNS funcione para `api.telegram.org`.

    Si el Gateway es remoto, asegúrate de estar viendo los registros en el host del Gateway.

    Documentación: [Telegram](/es/channels/telegram), [Solución de problemas de canales](/es/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI no muestra salida. ¿Qué debería comprobar?">
    Primero confirma que el Gateway sea accesible y que el agente pueda ejecutarse:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    En la TUI, usa `/status` para ver el estado actual. Si esperas respuestas en un
    canal de chat, asegúrate de que la entrega esté habilitada (`/deliver on`).

    Documentación: [TUI](/es/web/tui), [Slash commands](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo detengo por completo y luego inicio el Gateway?">
    Si instalaste el servicio:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Esto detiene/inicia el **servicio supervisado** (launchd en macOS, systemd en Linux).
    Úsalo cuando el Gateway se ejecuta en segundo plano como daemon.

    Si lo estás ejecutando en primer plano, detén con Ctrl-C y luego:

    ```bash
    openclaw gateway run
    ```

    Documentación: [Runbook del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="Explícamelo fácil: openclaw gateway restart frente a openclaw gateway">
    - `openclaw gateway restart`: reinicia el **servicio en segundo plano** (launchd/systemd).
    - `openclaw gateway`: ejecuta el gateway **en primer plano** para esta sesión de terminal.

    Si instalaste el servicio, usa los comandos del gateway. Usa `openclaw gateway` cuando
    quieras una ejecución puntual en primer plano.

  </Accordion>

  <Accordion title="La forma más rápida de obtener más detalles cuando algo falla">
    Inicia el Gateway con `--verbose` para obtener más detalle en la consola. Luego inspecciona el archivo de registro para ver autenticación de canal, enrutamiento de modelos y errores RPC.
  </Accordion>
</AccordionGroup>

## Medios y adjuntos

<AccordionGroup>
  <Accordion title="Mi Skill generó una imagen/PDF, pero no se envió nada">
    Los adjuntos salientes del agente deben incluir una línea `MEDIA:<path-or-url>` (en su propia línea). Consulta [Configuración del asistente OpenClaw](/es/start/openclaw) y [Agent send](/es/tools/agent-send).

    Envío por CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Comprueba también:

    - El canal de destino admite medios salientes y no está bloqueado por allowlists.
    - El archivo está dentro de los límites de tamaño del proveedor (las imágenes se redimensionan a un máximo de 2048 px).
    - `tools.fs.workspaceOnly=true` mantiene los envíos de ruta local limitados al espacio de trabajo, temp/media-store y archivos validados por sandbox.
    - `tools.fs.workspaceOnly=false` permite que `MEDIA:` envíe archivos locales del host que el agente ya puede leer, pero solo para medios y tipos de documento seguros (imágenes, audio, video, PDF y documentos de Office). Los archivos de texto plano y similares a secretos siguen bloqueados.

    Consulta [Images](/es/nodes/images).

  </Accordion>
</AccordionGroup>

## Seguridad y control de acceso

<AccordionGroup>
  <Accordion title="¿Es seguro exponer OpenClaw a DMs entrantes?">
    Trata los DMs entrantes como entrada no confiable. Los valores predeterminados están diseñados para reducir el riesgo:

    - El comportamiento predeterminado en canales compatibles con DM es **pairing**:
      - Los remitentes desconocidos reciben un código de pairing; el bot no procesa su mensaje.
      - Aprueba con: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Las solicitudes pendientes están limitadas a **3 por canal**; comprueba `openclaw pairing list --channel <channel> [--account <id>]` si no llegó un código.
    - Abrir los DMs públicamente requiere habilitación explícita (`dmPolicy: "open"` y allowlist `"*"`).

    Ejecuta `openclaw doctor` para detectar políticas de DM arriesgadas.

  </Accordion>

  <Accordion title="¿La inyección de prompts solo es un problema para bots públicos?">
    No. La inyección de prompts trata sobre **contenido no confiable**, no solo sobre quién puede enviar DMs al bot.
    Si tu asistente lee contenido externo (web search/fetch, páginas del navegador, correos electrónicos,
    documentos, adjuntos, registros pegados), ese contenido puede incluir instrucciones que intenten
    secuestrar el modelo. Esto puede ocurrir incluso si **tú eres el único remitente**.

    El mayor riesgo aparece cuando las herramientas están habilitadas: se puede engañar al modelo para
    exfiltrar contexto o llamar herramientas en tu nombre. Reduce el alcance del daño mediante:

    - usar un agente "lector" de solo lectura o sin herramientas para resumir contenido no confiable
    - mantener `web_search` / `web_fetch` / `browser` desactivados para agentes con herramientas habilitadas
    - tratar también como no confiable el texto decodificado de archivos/documentos: OpenResponses
      `input_file` y la extracción de medios adjuntos envuelven ambos el texto extraído en
      marcadores explícitos de límite de contenido externo en lugar de pasar texto sin procesar del archivo
    - sandboxing y allowlists estrictas de herramientas

    Detalles: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Mi bot debería tener su propio correo electrónico, cuenta de GitHub o número de teléfono?">
    Sí, en la mayoría de las configuraciones. Aislar el bot con cuentas y números de teléfono separados
    reduce el alcance del daño si algo sale mal. También facilita rotar
    credenciales o revocar acceso sin afectar a tus cuentas personales.

    Empieza poco a poco. Da acceso solo a las herramientas y cuentas que realmente necesites, y amplía
    más adelante si hace falta.

    Documentación: [Seguridad](/es/gateway/security), [Pairing](/es/channels/pairing).

  </Accordion>

  <Accordion title="¿Puedo darle autonomía sobre mis mensajes de texto y es seguro?">
    **No** recomendamos autonomía total sobre tus mensajes personales. El patrón más seguro es:

    - Mantener los DMs en **modo pairing** o con una allowlist estricta.
    - Usar un **número o cuenta separados** si quieres que envíe mensajes en tu nombre.
    - Dejar que redacte, y **aprobar antes de enviar**.

    Si quieres experimentar, hazlo en una cuenta dedicada y mantenla aislada. Consulta
    [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Puedo usar modelos más baratos para tareas de asistente personal?">
    Sí, **si** el agente es solo de chat y la entrada es confiable. Los niveles más pequeños son
    más susceptibles al secuestro por instrucciones, así que evítalos para agentes con herramientas habilitadas
    o cuando lean contenido no confiable. Si tienes que usar un modelo más pequeño, restringe
    las herramientas y ejecútalo dentro de un sandbox. Consulta [Seguridad](/es/gateway/security).
  </Accordion>

  <Accordion title="Ejecuté /start en Telegram pero no recibí un código de pairing">
    Los códigos de pairing se envían **solo** cuando un remitente desconocido envía un mensaje al bot y
    `dmPolicy: "pairing"` está habilitado. `/start` por sí solo no genera un código.

    Comprueba las solicitudes pendientes:

    ```bash
    openclaw pairing list telegram
    ```

    Si quieres acceso inmediato, añade tu id de remitente a la allowlist o establece `dmPolicy: "open"`
    para esa cuenta.

  </Accordion>

  <Accordion title="WhatsApp: ¿enviará mensajes a mis contactos? ¿Cómo funciona pairing?">
    No. La política predeterminada de DM de WhatsApp es **pairing**. Los remitentes desconocidos solo reciben un código de pairing y su mensaje **no se procesa**. OpenClaw solo responde a chats que recibe o a envíos explícitos que tú activas.

    Aprueba el pairing con:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Lista solicitudes pendientes:

    ```bash
    openclaw pairing list whatsapp
    ```

    Pregunta del asistente sobre el número de teléfono: se usa para establecer tu **allowlist/propietario** de forma que tus propios DMs estén permitidos. No se usa para envío automático. Si ejecutas OpenClaw en tu número personal de WhatsApp, usa ese número y habilita `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandos de chat, abortar tareas y "no se detiene"

<AccordionGroup>
  <Accordion title="¿Cómo evito que se muestren mensajes internos del sistema en el chat?">
    La mayoría de los mensajes internos o de herramientas solo aparecen cuando están habilitados **verbose**, **trace** o **reasoning**
    para esa sesión.

    Corrígelo en el chat donde lo ves:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Si sigue siendo ruidoso, comprueba la configuración de la sesión en la IU de Control y establece verbose
    en **inherit**. Confirma también que no estás usando un perfil de bot con `verboseDefault` establecido
    en `on` en la configuración.

    Documentación: [Thinking y verbose](/es/tools/thinking), [Seguridad](/es/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="¿Cómo detengo/cancelo una tarea en ejecución?">
    Envía cualquiera de estas opciones **como mensaje independiente** (sin barra):

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

    Estos son disparadores de aborto (no comandos con barra).

    Para procesos en segundo plano (de la herramienta exec), puedes pedir al agente que ejecute:

    ```
    process action:kill sessionId:XXX
    ```

    Resumen de comandos con barra: consulta [Slash commands](/es/tools/slash-commands).

    La mayoría de los comandos deben enviarse como un mensaje **independiente** que empiece por `/`, pero algunos atajos (como `/status`) también funcionan en línea para remitentes en allowlist.

  </Accordion>

  <Accordion title='¿Cómo envío un mensaje de Discord desde Telegram? ("Cross-context messaging denied")'>
    OpenClaw bloquea por defecto la mensajería **entre proveedores**. Si una llamada de herramienta está vinculada
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

    - `steer` - los mensajes nuevos redirigen la tarea actual
    - `followup` - ejecuta los mensajes uno a uno
    - `collect` - agrupa mensajes y responde una vez (predeterminado)
    - `steer-backlog` - redirige ahora y luego procesa la cola
    - `interrupt` - aborta la ejecución actual y empieza de nuevo

    Puedes agregar opciones como `debounce:2s cap:25 drop:summarize` para modos de seguimiento.

  </Accordion>
</AccordionGroup>

## Varios

<AccordionGroup>
  <Accordion title='¿Cuál es el modelo predeterminado para Anthropic con una clave API?'>
    En OpenClaw, las credenciales y la selección de modelo están separadas. Establecer `ANTHROPIC_API_KEY` (o almacenar una clave API de Anthropic en perfiles de autenticación) habilita la autenticación, pero el modelo predeterminado real es el que configures en `agents.defaults.model.primary` (por ejemplo, `anthropic/claude-sonnet-4-6` o `anthropic/claude-opus-4-6`). Si ves `No credentials found for profile "anthropic:default"`, significa que el Gateway no pudo encontrar credenciales de Anthropic en el `auth-profiles.json` esperado para el agente que se está ejecutando.
  </Accordion>
</AccordionGroup>

---

¿Sigues atascado? Pregunta en [Discord](https://discord.com/invite/clawd) o abre una [discusión en GitHub](https://github.com/openclaw/openclaw/discussions).

## Relacionado

- [FAQ — inicio rápido y configuración de la primera ejecución](/es/help/faq-first-run)
- [FAQ — modelos y perfiles de autenticación](/es/help/faq-models)
- [Solución de problemas](/es/help/troubleshooting)
