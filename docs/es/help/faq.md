---
read_when:
    - Respuestas a preguntas comunes de soporte sobre configuración, instalación, incorporación o ejecución
    - Triaje de incidencias reportadas por usuarios antes de una depuración más profunda
summary: Preguntas frecuentes sobre la instalación, la configuración y el uso de OpenClaw
title: Preguntas frecuentes
x-i18n:
    generated_at: "2026-07-05T11:24:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2ad033bbe300af0c0f769fc2729ee17f0fbab9facdb3c640be23f9e9a5bd01ab
    source_path: help/faq.md
    workflow: 16
---

Respuestas rápidas y solución de problemas más profunda para configuraciones reales (desarrollo local, VPS, multiagente, OAuth/claves de API, conmutación por error de modelos). Para diagnósticos en tiempo de ejecución, consulta [Solución de problemas](/es/gateway/troubleshooting). Para la referencia completa de configuración, consulta [Configuración](/es/gateway/configuration).

## Primeros 60 segundos si algo está roto

<Steps>
  <Step title="Estado rápido">
    ```bash
    openclaw status
    ```
    Resumen local rápido: SO + actualización, accesibilidad de gateway/servicio, agentes/sesiones, configuración del proveedor + problemas de tiempo de ejecución (cuando se puede acceder al gateway).
  </Step>
  <Step title="Informe pegable (seguro para compartir)">
    ```bash
    openclaw status --all
    ```
    Diagnóstico de solo lectura con cola de logs (tokens redactados).
  </Step>
  <Step title="Estado del daemon + puerto">
    ```bash
    openclaw gateway status
    ```
    Muestra el tiempo de ejecución del supervisor frente a la accesibilidad RPC, la URL de destino de la sonda y qué configuración probablemente usó el servicio.
  </Step>
  <Step title="Sondas profundas">
    ```bash
    openclaw status --deep
    ```
    Sonda de estado del gateway en vivo, incluidas sondas de canales cuando son compatibles (requiere un gateway accesible). Consulta [Estado](/es/gateway/health).
  </Step>
  <Step title="Seguir el log más reciente">
    ```bash
    openclaw logs --follow
    ```
    Si RPC está caído, recurre a:
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    Los logs de archivos están separados de los logs del servicio; consulta [Logging](/es/logging) y [Solución de problemas](/es/gateway/troubleshooting).
  </Step>
  <Step title="Ejecutar doctor (reparaciones)">
    ```bash
    openclaw doctor
    ```
    Repara/migra la configuración y el estado, y luego ejecuta comprobaciones de salud. Consulta [Doctor](/es/gateway/doctor).
  </Step>
  <Step title="Instantánea del Gateway (solo WS)">
    ```bash
    openclaw health --json
    openclaw health --verbose   # shows the target URL + config path on errors
    ```
    Pide al gateway en ejecución una instantánea completa. Consulta [Estado](/es/gateway/health).
  </Step>
</Steps>

## Inicio rápido y configuración de primera ejecución

Las preguntas y respuestas de primera ejecución - instalación, incorporación, rutas de autenticación, suscripciones, fallos iniciales - están en las [Preguntas frecuentes de primera ejecución](/es/help/faq-first-run).

## ¿Qué es OpenClaw?

<AccordionGroup>
  <Accordion title="¿Qué es OpenClaw, en un párrafo?">
    OpenClaw es un asistente personal de IA que ejecutas en tus propios dispositivos. Responde en las superficies de mensajería que ya usas (Discord, Google Chat, iMessage, Mattermost, Signal, Slack, Telegram, WebChat, WhatsApp y plugins de canal incluidos como QQ Bot) y también puede hacer voz además de un Canvas en vivo en plataformas compatibles. El **Gateway** es el plano de control siempre activo; el asistente es el producto.
  </Accordion>

  <Accordion title="Propuesta de valor">
    OpenClaw no es "solo un envoltorio de Claude". Es un **plano de control local-first** que ejecuta un asistente capaz en **tu propio hardware**, accesible desde las apps de chat que ya usas, con sesiones con estado, memoria y herramientas, sin entregar tus flujos de trabajo a un SaaS alojado.

    - **Tus dispositivos, tus datos**: ejecuta el Gateway donde quieras (Mac, Linux, VPS) y mantén el espacio de trabajo y el historial de sesiones en local.
    - **Canales reales, no un sandbox web**: Discord/iMessage/Signal/Slack/Telegram/WhatsApp/etc., además de voz móvil y Canvas en plataformas compatibles.
    - **Independiente del modelo**: usa Anthropic, MiniMax, OpenAI, OpenRouter, etc., con enrutamiento y conmutación por error por agente.
    - **Opción solo local**: ejecuta modelos locales para que todos los datos puedan permanecer en tu dispositivo.
    - **Enrutamiento multiagente**: agentes separados por canal, cuenta o tarea, cada uno con su propio espacio de trabajo y valores predeterminados.
    - **Código abierto y modificable**: inspecciona, amplía y autoaloja sin dependencia de proveedor.

    Docs: [Gateway](/es/gateway), [Canales](/es/channels), [Multiagente](/es/concepts/multi-agent), [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="Acabo de configurarlo: ¿qué debería hacer primero?">
    Buenos primeros proyectos: crear un sitio web (WordPress, Shopify o un sitio estático); prototipar una app móvil (esquema, pantallas, plan de API); organizar archivos y carpetas; conectar Gmail y automatizar resúmenes o seguimientos.

    Puede manejar tareas grandes, pero funciona mejor dividido en fases con subagentes para trabajo en paralelo.

  </Accordion>

  <Accordion title="¿Cuáles son los cinco principales casos de uso cotidianos de OpenClaw?">
    - **Informes personales**: resúmenes de bandeja de entrada, calendario y noticias que te interesan.
    - **Investigación y redacción**: investigación rápida, resúmenes y primeros borradores para correos o docs.
    - **Recordatorios y seguimientos**: avisos y listas de comprobación impulsados por Cron o Heartbeat.
    - **Automatización del navegador**: rellenar formularios, recopilar datos, repetir tareas web.
    - **Coordinación entre dispositivos**: envía una tarea desde tu teléfono, deja que el Gateway la ejecute en un servidor y recibe el resultado de vuelta en el chat.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ayudar con generación de leads, contacto, anuncios y blogs para un SaaS?">
    Sí, para **investigación, cualificación y redacción**: escanear sitios, crear listas preliminares, resumir prospectos, redactar borradores de contacto o de textos publicitarios.

    Para **campañas de contacto o anuncios**, mantén a un humano en el circuito. Evita el spam, cumple las leyes locales y las políticas de la plataforma, y revisa cualquier cosa antes de enviarla. Deja que OpenClaw redacte; tú apruebas.

    Docs: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Cuáles son las ventajas frente a Claude Code para desarrollo web?">
    OpenClaw es un **asistente personal** y una capa de coordinación, no un reemplazo del IDE. Usa Claude Code o Codex para el ciclo de codificación directo más rápido dentro de un repo. Usa OpenClaw para memoria duradera, acceso entre dispositivos y orquestación de herramientas.

    - Memoria y espacio de trabajo persistentes entre sesiones.
    - Acceso multiplataforma (Telegram, WhatsApp, TUI, WebChat).
    - Orquestación de herramientas (navegador, archivos, programación, hooks).
    - Gateway siempre activo (ejecútalo en un VPS, interactúa desde cualquier lugar).
    - Nodos para navegador/pantalla/cámara/exec locales.

    Muestra: [https://openclaw.ai/showcase](https://openclaw.ai/showcase).

  </Accordion>
</AccordionGroup>

## Skills y automatización

<AccordionGroup>
  <Accordion title="¿Cómo personalizo skills sin mantener el repo sucio?">
    Usa sobrescrituras administradas en lugar de editar la copia del repo. Pon los cambios en `~/.openclaw/skills/<name>/SKILL.md` (o añade una carpeta mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json`). Precedencia: `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> incluidas -> `skills.load.extraDirs`, por lo que las sobrescrituras administradas ganan frente a las skills incluidas sin tocar git. Para instalar globalmente pero limitar la visibilidad a algunos agentes, mantén la copia compartida en `~/.openclaw/skills` y controla la visibilidad con `agents.defaults.skills` / `agents.list[].skills`. Solo las ediciones que merezcan ir upstream deberían salir como PRs contra la copia del repo.
  </Accordion>

  <Accordion title="¿Puedo cargar skills desde una carpeta personalizada?">
    Sí: añade directorios mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json` (la precedencia más baja en el orden anterior). `clawhub` instala en `./skills` de forma predeterminada, que OpenClaw trata como `<workspace>/skills` en la siguiente sesión. Para limitar la visibilidad a ciertos agentes, combínalo con `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="¿Cómo puedo usar modelos o ajustes diferentes para distintas tareas?">
    Patrones compatibles:

    - **Trabajos Cron**: los trabajos aislados pueden establecer una sobrescritura de `model` por trabajo.
    - **Agentes**: enruta tareas a agentes separados con modelos predeterminados, niveles de razonamiento y parámetros de stream diferentes.
    - **Cambio bajo demanda**: `/model` cambia el modelo de la sesión actual en cualquier momento.

    Ejemplo: mismo modelo, ajustes diferentes por agente:

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

    Pon los valores predeterminados compartidos por modelo en `agents.defaults.models["provider/model"].params` y luego las sobrescrituras específicas del agente en `agents.list[].params` plano. No dupliques el mismo modelo bajo `agents.list[].models["provider/model"].params` anidado; esa ruta es para el catálogo de modelos por agente y sobrescrituras de tiempo de ejecución.

    Consulta [Trabajos Cron](/es/automation/cron-jobs), [Enrutamiento multiagente](/es/concepts/multi-agent), [Configuración](/es/gateway/config-agents), [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="El bot se congela mientras hace trabajo pesado. ¿Cómo lo descargo?">
    Usa **subagentes** para tareas largas o paralelas: se ejecutan en su propia sesión, devuelven un resumen y mantienen tu chat principal receptivo. Pide al bot que "genere un subagente para esta tarea" o usa `/subagents`. Usa `/status` para ver si el Gateway está ocupado actualmente.

    Tanto las tareas largas como los subagentes consumen tokens; establece un modelo más barato para subagentes mediante `agents.defaults.subagents.model` si el coste importa.

    Docs: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Cómo funcionan las sesiones de subagente vinculadas a hilos en Discord?">
    Vincula un hilo de Discord a un subagente o destino de sesión para que los mensajes de seguimiento allí permanezcan en esa sesión vinculada.

    - Genera con `sessions_spawn` usando `thread: true` (opcionalmente `mode: "session"` para seguimiento persistente).
    - O vincula manualmente con `/focus <target>`.
    - `/agents` inspecciona el estado de vinculación.
    - `/session idle <duration|off>` y `/session max-age <duration|off>` controlan el desenfoque automático.
    - `/unfocus` desvincula el hilo.

    Configuración: `session.threadBindings.enabled` (interruptor global), `session.threadBindings.idleHours` (predeterminado `24`, `0` desactiva), `session.threadBindings.maxAgeHours` (predeterminado `0` = sin límite estricto) y sobrescrituras por canal `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`. `channels.discord.threadBindings.spawnSessions` controla la vinculación automática al generar (predeterminado `true`).

    Docs: [Subagentes](/es/tools/subagents), [Discord](/es/channels/discord), [Referencia de configuración](/es/gateway/configuration-reference), [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagente terminó, pero la actualización de finalización fue al lugar equivocado o nunca se publicó. ¿Qué debería comprobar?">
    Comprueba la ruta del solicitante resuelta:

    - La entrega de subagente en modo de finalización prefiere un hilo vinculado o una ruta de conversación cuando existe.
    - Si el origen de finalización solo lleva un canal, OpenClaw recurre a la ruta almacenada de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa aún pueda tener éxito.
    - Sin ruta vinculada y sin ruta almacenada utilizable: la entrega directa puede fallar y el resultado recurre a la entrega de sesión en cola en lugar de publicarse inmediatamente.
    - Los destinos no válidos u obsoletos también pueden forzar el fallback a cola o un fallo de entrega final.
    - Si la última respuesta visible del asistente hijo es exactamente `NO_REPLY` / `no_reply` o `ANNOUNCE_SKIP`, OpenClaw suprime intencionalmente el anuncio en lugar de publicar progreso anterior obsoleto.

    Depuración: `openclaw tasks show <lookup>`, donde `<lookup>` es un id de tarea, id de ejecución o clave de sesión.

    Docs: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks), [Herramientas de sesión](/es/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o los recordatorios no se disparan. ¿Qué debería comprobar?">
    Cron se ejecuta dentro del proceso del Gateway; no se dispara si el Gateway no está ejecutándose continuamente.

    - Confirma que cron está habilitado (`cron.enabled`) y que `OPENCLAW_SKIP_CRON` no está establecido.
    - Confirma que el Gateway se ejecuta 24/7 (sin suspensión/reinicios).
    - Verifica la zona horaria del trabajo (`--tz` frente a la zona horaria del host).

    Depuración:
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs: [Trabajos Cron](/es/automation/cron-jobs), [Automatización](/es/automation).

  </Accordion>

  <Accordion title="Cron se ejecutó, pero no se envió nada al canal. ¿Por qué?">
    Comprueba el modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"`: no se espera ningún envío de reserva del ejecutor.
    - Destino de anuncio ausente o no válido (`channel` / `to`): el ejecutor omitió la entrega saliente.
    - Fallos de autenticación del canal (`unauthorized`, `Forbidden`): el ejecutor intentó entregar, pero las credenciales lo bloquearon.
    - Un resultado aislado silencioso (solo `NO_REPLY` / `no_reply`) se trata como intencionadamente no entregable, así que la entrega de reserva en cola también se suprime.

    Para trabajos Cron aislados, el agente aún puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible. `--announce` solo controla la entrega de reserva del ejecutor para el texto final que el agente no haya enviado ya por sí mismo.

    Depuración:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Por qué una ejecución Cron aislada cambió de modelo o reintentó una vez?">
    Esa es la ruta de cambio de modelo en vivo, no una programación duplicada. Cron aislado persiste una transferencia de modelo en tiempo de ejecución y reintenta cuando la ejecución activa lanza `LiveSessionModelSwitchError`, conservando el proveedor/modelo cambiado (y cualquier anulación de perfil de autenticación cambiado) antes de reintentar.

    Precedencia de selección de modelo: primero la anulación de modelo del hook de Gmail (`hooks.gmail.model`), luego `model` por trabajo, luego cualquier anulación de modelo de sesión Cron almacenada y, después, la selección normal de modelo del agente/predeterminado.

    El bucle de reintento está limitado al intento inicial más 2 reintentos por cambio; después, Cron aborta en lugar de entrar en un bucle infinito.

    Depuración:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [CLI de Cron](/es/cli/cron).

  </Accordion>

  <Accordion title="¿Cómo instalo Skills en Linux?">
    Usa comandos nativos de `openclaw skills` o coloca Skills en tu espacio de trabajo; la interfaz de Skills de macOS no está disponible en Linux. Explora Skills en [https://clawhub.ai](https://clawhub.ai).

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

    `openclaw skills install` nativo escribe en el directorio `skills/` del espacio de trabajo activo de forma predeterminada. Añade `--global` para instalar en el directorio compartido de Skills administradas para todos los agentes locales. Instala la CLI `clawhub` separada solo para publicar o sincronizar tus propias Skills. Usa `agents.defaults.skills` o `agents.list[].skills` para restringir qué agentes ven las Skills compartidas.

  </Accordion>

  <Accordion title="¿OpenClaw puede ejecutar tareas según una programación o continuamente en segundo plano?">
    Sí, mediante el programador del Gateway:

    - **Trabajos Cron** para tareas programadas o recurrentes (persisten entre reinicios).
    - **Heartbeat** para comprobaciones periódicas de la sesión principal.
    - **Trabajos aislados** para agentes autónomos que publican resúmenes o entregan en chats.

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [Automatización](/es/automation), [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title="¿Puedo ejecutar Skills exclusivas de Apple macOS desde Linux?">
    No directamente. Las Skills de macOS están controladas por `metadata.openclaw.os` más los binarios requeridos, y solo se cargan cuando son elegibles en el **host del Gateway**. En Linux, las Skills solo para `darwin` (`apple-notes`, `apple-reminders`, `things-mac`) no se cargarán a menos que anules el control.

    Tres patrones compatibles:

    **Opción A: ejecuta el Gateway en un Mac (lo más sencillo)**. Ejecuta el Gateway donde existan los binarios de macOS y luego conéctate desde Linux en [modo remoto](#gateway-ports-already-running-and-remote-mode) o mediante Tailscale. Las Skills se cargan normalmente porque el host del Gateway es macOS.

    **Opción B: usa un Node de macOS (sin SSH)**. Ejecuta el Gateway en Linux, empareja un Node de macOS (aplicación de barra de menús) y configura **Comandos de ejecución de Node** como "Preguntar siempre" o "Permitir siempre" en el Mac. OpenClaw trata las Skills exclusivas de macOS como elegibles cuando los binarios requeridos existen en el Node; el agente las ejecuta mediante la herramienta `nodes`. Con "Preguntar siempre", aprobar "Permitir siempre" en el aviso añade ese comando a la lista de permitidos.

    **Opción C: proxy de binarios de macOS mediante SSH (avanzado)**. Mantén el Gateway en Linux, pero haz que los binarios de CLI requeridos se resuelvan a envoltorios SSH que se ejecutan en un Mac y luego anula la Skill para permitir Linux, de modo que siga siendo elegible.

    1. Crea un envoltorio SSH para el binario (ejemplo: `memo` para Apple Notes):
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. Coloca el envoltorio en `PATH` en el host Linux (por ejemplo, `~/bin/memo`).
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
    No integrada hoy. Opciones:

    - **Skill / Plugin personalizado**: lo mejor para acceso fiable a la API (ambos tienen APIs).
    - **Automatización del navegador**: funciona sin código, pero es más lenta y más frágil.

    Para contexto por cliente al estilo de una agencia: mantén una página de Notion por cliente (contexto + preferencias + trabajo activo) y pide al agente que obtenga esa página al inicio de una sesión.

    Para una integración nativa, abre una solicitud de función o crea una Skill contra esas APIs.

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Las instalaciones nativas llegan al directorio `skills/` del espacio de trabajo activo; usa `--global` para todos los agentes locales, o configura `agents.defaults.skills` / `agents.list[].skills` para limitar la visibilidad. Algunas Skills esperan binarios instalados con Homebrew; en Linux eso significa Linuxbrew.

    Consulta [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config), [ClawHub](/es/clawhub).

  </Accordion>

  <Accordion title="¿Cómo uso mi Chrome existente con sesión iniciada con OpenClaw?">
    Usa el perfil de navegador `user` integrado, que se adjunta mediante Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Para un nombre personalizado, crea un perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Esto puede usar el navegador del host local o un Node de navegador conectado. Si el Gateway se ejecuta en otro lugar, ejecuta un host de Node en la máquina del navegador o usa CDP remoto en su lugar.

    Límites actuales de los perfiles `existing-session` / `user` frente al perfil administrado `openclaw`:

    - `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren referencias de instantánea, no selectores CSS.
    - Los hooks de carga requieren `ref` o `inputRef`, un archivo a la vez, sin `element` CSS.
    - `responsebody`, la exportación de PDF, la interceptación de descargas y las acciones por lotes aún requieren la ruta del navegador administrado.

    Consulta [Navegador](/es/tools/browser#existing-session-via-chrome-devtools-mcp) para ver la comparación completa.

  </Accordion>
</AccordionGroup>

## Aislamiento y memoria

<AccordionGroup>
  <Accordion title="¿Hay una documentación dedicada sobre aislamiento?">
    Sí: [Aislamiento](/es/gateway/sandboxing). Para configuración específica de Docker (Gateway completo en Docker o imágenes de aislamiento), consulta [Docker](/es/install/docker).
  </Accordion>

  <Accordion title="Docker se siente limitado: ¿cómo habilito todas las funciones?">
    La imagen predeterminada prioriza la seguridad y se ejecuta como el usuario `node`, por lo que excluye paquetes del sistema, Homebrew y navegadores incluidos. Para una configuración más completa:

    - Persiste `/home/node` con `OPENCLAW_HOME_VOLUME` para que las cachés sobrevivan.
    - Incorpora dependencias del sistema en la imagen con `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Instala navegadores de Playwright mediante la CLI incluida: `node /app/node_modules/playwright-core/cli.js install chromium`.
    - Configura `PLAYWRIGHT_BROWSERS_PATH` y persiste esa ruta.

    Documentación: [Docker](/es/install/docker), [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Puedo mantener los DM personales pero hacer que los grupos sean públicos/aislados con un solo agente?">
    Sí, si el tráfico privado son **DM** y el tráfico público son **grupos**. Configura `agents.defaults.sandbox.mode: "non-main"` para que las sesiones de grupo/canal (claves no principales) se ejecuten en el backend de aislamiento configurado mientras la sesión principal de DM permanece en el host. Docker es el backend predeterminado una vez habilitado el aislamiento. Restringe las herramientas disponibles en sesiones aisladas mediante `tools.sandbox.tools`.

    Guía de configuración: [Grupos: DM personales + grupos públicos](/es/channels/groups#pattern-personal-dms-public-groups-single-agent). Referencia clave: [Configuración del Gateway](/es/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="¿Cómo enlazo una carpeta del host en el aislamiento?">
    Configura `agents.defaults.sandbox.docker.binds` como `["host:container:mode"]` (por ejemplo, `"/home/user/src:/src:ro"`). Los enlaces globales y por agente se combinan; los enlaces por agente se ignoran cuando `scope: "shared"`. Usa `:ro` para cualquier cosa sensible; los enlaces eluden las barreras del sistema de archivos del aislamiento.

    OpenClaw valida las fuentes de enlace contra la ruta normalizada y la ruta canónica resuelta a través del ancestro existente más profundo, por lo que las fugas por padres de symlink fallan de forma cerrada incluso cuando el segmento de ruta final aún no existe.

    Consulta [Aislamiento](/es/gateway/sandboxing#custom-bind-mounts) y [Aislamiento vs. política de herramientas vs. elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="¿Cómo funciona la memoria?">
    La memoria de OpenClaw son archivos Markdown en el espacio de trabajo del agente: notas diarias en `memory/YYYY-MM-DD.md`, notas seleccionadas a largo plazo en `MEMORY.md` (solo sesiones principales/privadas).

    OpenClaw también ejecuta un **vaciado de memoria previo a Compaction** silencioso antes de que Compaction resuma la conversación, recordando al modelo que escriba primero notas duraderas. Solo se ejecuta cuando el espacio de trabajo permite escritura (los aislamientos de solo lectura lo omiten); desactívalo con `agents.defaults.compaction.memoryFlush.enabled: false`. Consulta [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="La memoria sigue olvidando cosas. ¿Cómo hago que se mantengan?">
    Pide al bot que **escriba el dato en la memoria**: las notas a largo plazo van en `MEMORY.md`, el contexto a corto plazo en `memory/YYYY-MM-DD.md`. Recordarle al modelo que guarde recuerdos normalmente lo resuelve. Si sigue olvidando, verifica que el Gateway use el mismo espacio de trabajo en cada ejecución.

    Documentación: [Memoria](/es/concepts/memory), [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿La memoria persiste para siempre? ¿Cuáles son los límites?">
    Los archivos de memoria viven en el disco y persisten hasta que se eliminan; el límite es tu almacenamiento, no el modelo. El **contexto de sesión** sigue limitado por la ventana de contexto del modelo, por lo que las conversaciones largas pueden compactarse o truncarse; por eso existe la búsqueda en memoria, que devuelve al contexto solo las partes relevantes.

    Documentación: [Memoria](/es/concepts/memory), [Contexto](/es/concepts/context).

  </Accordion>

  <Accordion title="¿La búsqueda semántica en memoria requiere una clave de API de OpenAI?">
    Solo si usas **embeddings de OpenAI**, que es el proveedor predeterminado. Codex OAuth cubre chat/completions y **no** concede acceso a embeddings, así que iniciar sesión con Codex (OAuth o el inicio de sesión de la CLI de Codex) no habilita la búsqueda semántica en memoria. Los embeddings de OpenAI aún necesitan una clave de API real (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Para permanecer local, establece `agents.defaults.memorySearch.provider: "local"` (GGUF/llama.cpp). Otros proveedores compatibles: Bedrock, DeepInfra, Gemini (`GEMINI_API_KEY` o `memorySearch.remote.apiKey`), GitHub Copilot, LM Studio, Mistral, Ollama, compatible con OpenAI y Voyage. Consulta [Memoria](/es/concepts/memory) y [Búsqueda de memoria](/es/concepts/memory-search) para ver los detalles de configuración.

  </Accordion>
</AccordionGroup>

## Dónde viven las cosas en el disco

<AccordionGroup>
  <Accordion title="¿Todos los datos usados con OpenClaw se guardan localmente?">
    No: **el estado propio de OpenClaw es local**, pero **los servicios externos siguen viendo lo que les envías**.

    - **Local de forma predeterminada**: las sesiones, los archivos de memoria, la configuración y el espacio de trabajo viven en el host del Gateway (`~/.openclaw` más el directorio de tu espacio de trabajo).
    - **Remoto por necesidad**: los mensajes enviados a proveedores de modelos (Anthropic/OpenAI/etc.) van a sus APIs, y las plataformas de chat (Slack/Telegram/WhatsApp/etc.) almacenan datos de mensajes en sus servidores.
    - **Tú controlas la huella**: los modelos locales mantienen los prompts en tu máquina, pero el tráfico del canal sigue pasando por los servidores del canal.

    Relacionado: [Espacio de trabajo del agente](/es/concepts/agent-workspace), [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Dónde almacena OpenClaw sus datos?">
    Todo vive bajo `$OPENCLAW_STATE_DIR` (valor predeterminado: `~/.openclaw`):

    | Ruta                                                             | Propósito                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | Configuración principal (JSON5)                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | Importación OAuth heredada (se copia en los perfiles de autenticación en el primer uso)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | Perfiles de autenticación (OAuth, claves de API, `keyRef`/`tokenRef` opcionales)        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | Carga útil secreta opcional respaldada por archivo para proveedores SecretRef de `file`   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | Archivo de compatibilidad heredado (entradas estáticas `api_key` depuradas)        |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | Estado del proveedor (por ejemplo `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | Estado por agente (agentDir + sesiones)                                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | Historial y estado de conversaciones (por agente)                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`       | Metadatos de sesión (por agente)                                        |

    La ruta heredada de agente único `~/.openclaw/agent/*` se migra mediante `openclaw doctor`.

    Tu **espacio de trabajo** (AGENTS.md, archivos de memoria, Skills, etc.) está separado y se configura mediante `agents.defaults.workspace` (valor predeterminado: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="¿Dónde deberían vivir AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Estos viven en el **espacio de trabajo del agente**, no en `~/.openclaw`.

    - **Espacio de trabajo (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opcional. La raíz en minúsculas `memory.md` es solo entrada de reparación heredada; `openclaw doctor --fix` puede fusionarla en `MEMORY.md` cuando ambos existen.
    - **Directorio de estado (`~/.openclaw`)**: configuración, estado de canal/proveedor, perfiles de autenticación, sesiones, registros, Skills compartidas (`~/.openclaw/skills`).

    El espacio de trabajo predeterminado es `~/.openclaw/workspace`, configurable:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si el bot "olvida" después de reiniciar, confirma que el Gateway use el mismo espacio de trabajo en cada lanzamiento (el modo remoto usa el espacio de trabajo del **host del gateway**, no tu portátil local).

    Consejo: para comportamiento o preferencias duraderas, pídele al bot que **lo escriba en AGENTS.md o MEMORY.md** en lugar de depender del historial de chat.

    Consulta [Espacio de trabajo del agente](/es/concepts/agent-workspace) y [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Puedo hacer SOUL.md más grande?">
    Sí. `SOUL.md` es uno de los archivos de arranque del espacio de trabajo inyectados en el contexto del agente. El límite predeterminado de inyección por archivo es de `20000` caracteres; el presupuesto total de arranque entre archivos es de `60000` caracteres.

    Cambia los valores predeterminados compartidos:

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

    O sobrescribe un agente bajo `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars`.

    Usa `/context` para comprobar los tamaños sin procesar frente a los inyectados y si hubo truncamiento. Mantén `SOUL.md` centrado en voz, postura y personalidad; pon las reglas operativas en `AGENTS.md` y los hechos duraderos en la memoria.

    Consulta [Contexto](/es/concepts/context) y [Configuración de agente](/es/gateway/config-agents).

  </Accordion>

  <Accordion title="Estrategia de copia de seguridad recomendada">
    Pon tu **espacio de trabajo del agente** en un repositorio git **privado** y haz una copia de seguridad en algún lugar privado (por ejemplo, GitHub privado). Esto captura la memoria más los archivos AGENTS/SOUL/USER y te permite restaurar la "mente" del asistente más adelante.

    **No** confirmes nada bajo `~/.openclaw` (credenciales, sesiones, tokens, cargas útiles de secretos cifrados). Para una restauración completa, haz copias de seguridad del espacio de trabajo y del directorio de estado por separado.

    Documentación: [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿Cómo desinstalo OpenClaw por completo?">
    Consulta [Desinstalar](/es/install/uninstall).
  </Accordion>

  <Accordion title="¿Pueden los agentes trabajar fuera del espacio de trabajo?">
    Sí. El espacio de trabajo es el **cwd predeterminado** y el ancla de memoria, no un sandbox estricto. Las rutas relativas se resuelven dentro del espacio de trabajo; las rutas absolutas pueden acceder a otras ubicaciones del host salvo que el sandboxing esté habilitado. Para aislamiento, usa [`agents.defaults.sandbox`](/es/gateway/sandboxing) o configuraciones de sandbox por agente. Para convertir un repositorio en el directorio de trabajo predeterminado, apunta el `workspace` de ese agente a la raíz del repositorio; el repositorio de OpenClaw en sí es solo código fuente, así que mantén separado el espacio de trabajo salvo que quieras intencionalmente que el agente trabaje dentro de él.

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
    El estado de sesión pertenece al **host del gateway**. En modo remoto, el almacén de sesiones que te importa está en la máquina remota, no en tu portátil local. Consulta [Gestión de sesiones](/es/concepts/session).
  </Accordion>
</AccordionGroup>

## Conceptos básicos de configuración

<AccordionGroup>
  <Accordion title="¿Qué formato tiene la configuración? ¿Dónde está?">
    OpenClaw lee una configuración **JSON5** opcional desde `$OPENCLAW_CONFIG_PATH` (valor predeterminado: `~/.openclaw/openclaw.json`). Si falta el archivo, usa valores predeterminados relativamente seguros, incluido un espacio de trabajo predeterminado de `~/.openclaw/workspace`.
  </Accordion>

  <Accordion title='Configuré gateway.bind: "lan" (o "tailnet") y ahora nada escucha / la UI dice no autorizado'>
    Los enlaces que no son loopback **requieren una ruta válida de autenticación del gateway**: autenticación con secreto compartido (token o contraseña), o `gateway.auth.mode: "trusted-proxy"` detrás de un proxy inverso consciente de identidad configurado correctamente.

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

    - `gateway.remote.token` / `.password` **no** habilitan por sí solos la autenticación del gateway local; las rutas de llamada locales pueden usar `gateway.remote.*` como fallback solo cuando `gateway.auth.*` no está configurado.
    - Para autenticación con contraseña, establece `gateway.auth.mode: "password"` más `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Si `gateway.auth.token` / `.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución falla cerrada (sin enmascaramiento mediante fallback remoto).
    - Las configuraciones de Control UI con secreto compartido se autentican mediante `connect.params.auth.token` o `connect.params.auth.password` (almacenados en la configuración de la app/UI). Los modos con identidad, como Tailscale Serve o `trusted-proxy`, usan encabezados de solicitud en su lugar; evita poner secretos compartidos en URLs.
    - Con `gateway.auth.mode: "trusted-proxy"`, los proxies inversos loopback del mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito y una entrada loopback en `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="¿Por qué necesito ahora un token en localhost?">
    OpenClaw exige autenticación del gateway de forma predeterminada, incluido loopback. Si no hay una ruta de autenticación explícita configurada, el inicio se resuelve en modo token y genera un token solo de ejecución para ese inicio, por lo que los clientes WS locales deben autenticarse. Esto bloquea que otros procesos locales llamen al Gateway.

    Configura `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` o `OPENCLAW_GATEWAY_PASSWORD` explícitamente cuando los clientes necesiten un secreto estable entre reinicios. También puedes elegir el modo contraseña, o `trusted-proxy` para proxies inversos conscientes de identidad. Para loopback abierto, establece `gateway.auth.mode: "none"` explícitamente. `openclaw doctor --generate-gateway-token` genera un token en cualquier momento.

  </Accordion>

  <Accordion title="¿Tengo que reiniciar después de cambiar la configuración?">
    El Gateway observa la configuración y admite recarga en caliente: `gateway.reload.mode: "hybrid"` (valor predeterminado) aplica en caliente los cambios seguros y reinicia para los críticos. También se admiten `hot`, `restart` y `off`. La mayoría de los cambios en `tools.*`, políticas de `agents.*`, `session.*` y `messages.*` se aplican de inmediato sin ninguna acción de recarga; los cambios de enlace/puerto de `gateway.*` requieren un reinicio.
  </Accordion>

  <Accordion title="¿Cómo deshabilito los lemas divertidos de la CLI?">
    Establece `cli.banner.taglineMode`:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: oculta el texto del lema pero conserva la línea de título/versión del banner.
    - `default`: siempre usa `All your chats, one OpenClaw.`.
    - `random`: lemas divertidos/estacionales rotativos (comportamiento predeterminado).
    - Para no mostrar ningún banner, establece la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="¿Cómo habilito la búsqueda web (y la obtención web)?">
    `web_fetch` funciona sin una clave de API. `web_search` depende del proveedor seleccionado:

    | Proveedor | Sin clave | Variable(s) de entorno |
    | --- | --- | --- |
    | Brave | No | `BRAVE_API_KEY` |
    | DuckDuckGo | Sí (no oficial, basado en HTML) | - |
    | Exa | No | `EXA_API_KEY` |
    | Firecrawl | No | `FIRECRAWL_API_KEY` |
    | Gemini | No | `GEMINI_API_KEY` |
    | Grok | No (OAuth o clave de xAI) | `XAI_API_KEY` |
    | Kimi | No | `KIMI_API_KEY` o `MOONSHOT_API_KEY` |
    | MiniMax Search | No | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY` |
    | Ollama Web Search | Sí (requiere `ollama signin`) | - |
    | Perplexity | No | `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY` |
    | SearXNG | Sí (autohospedado) | `SEARXNG_BASE_URL` |
    | Tavily | No | `TAVILY_API_KEY` |

    Grok también puede reutilizar OAuth de xAI de la autenticación del modelo (`openclaw onboard --auth-choice xai-oauth`).

    **Recomendado**: `openclaw configure --section web` y elige un proveedor.

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

    La configuración de búsqueda web específica del proveedor reside en `plugins.entries.<plugin>.config.webSearch.*`. Las rutas de proveedor heredadas `tools.web.search.*` todavía se cargan por compatibilidad, pero no deben usarse en configuraciones nuevas. La configuración de alternativa de obtención web de Firecrawl reside en `plugins.entries.firecrawl.config.webFetch.*`.

    - Listas de permitidos: agrega `web_search`/`web_fetch`/`x_search`, o `group:web` para los tres.
    - `web_fetch` está habilitado de forma predeterminada.
    - Si se omite `tools.web.fetch.provider`, OpenClaw detecta automáticamente el primer proveedor alternativo de obtención listo a partir de las credenciales disponibles; el Plugin oficial de Firecrawl proporciona esa alternativa.
    - Los demonios leen variables de entorno desde `~/.openclaw/.env` (o desde el entorno del servicio).

    Docs: [Herramientas web](/es/tools/web).

  </Accordion>

  <Accordion title="config.apply borró mi configuración. ¿Cómo la recupero y evito que ocurra?">
    `config.apply` reemplaza la **configuración completa**; un objeto parcial elimina todo lo demás.

    OpenClaw actual protege contra la mayoría de sobrescrituras accidentales:

    - Las escrituras de configuración propiedad de OpenClaw validan toda la configuración posterior al cambio antes de escribir.
    - Las escrituras inválidas o destructivas propiedad de OpenClaw se rechazan y se guardan como `openclaw.json.rejected.*`.
    - Una edición directa que rompe el arranque o la recarga en caliente hace que el Gateway falle en modo cerrado u omita la recarga; no reescribe `openclaw.json`.
    - `openclaw doctor --fix` es responsable de la reparación, puede restaurar la última configuración correcta conocida y guarda el archivo rechazado como `openclaw.json.clobbered.*`.

    Recuperación:

    - Revisa `openclaw logs --follow` para buscar `Invalid config at`, `Config write rejected:` o `config reload skipped (invalid config)`.
    - Inspecciona el `openclaw.json.clobbered.*` o `openclaw.json.rejected.*` más reciente junto a la configuración activa.
    - Ejecuta `openclaw config validate` y `openclaw doctor --fix`.
    - Copia de vuelta solo las claves previstas con `openclaw config set` o `config.patch`.
    - Sin una última configuración correcta conocida ni una carga útil rechazada: restaura desde una copia de seguridad, o vuelve a ejecutar `openclaw doctor` y reconfigura canales/modelos.
    - Pérdida inesperada: informa un error con tu última configuración conocida o una copia de seguridad. Un agente de programación local a menudo puede reconstruir una configuración funcional a partir de registros o historial.

    Evítalo: usa `openclaw config set` para cambios pequeños, `openclaw configure` para ediciones interactivas, `config.schema.lookup` para inspeccionar una ruta desconocida (devuelve un nodo de esquema superficial más resúmenes de hijos inmediatos) y `config.patch` para ediciones RPC parciales; reserva `config.apply` para el reemplazo de la configuración completa. La herramienta de runtime `gateway` orientada al agente se niega a reescribir `tools.exec.ask` / `tools.exec.security` incluso mediante alias heredados `tools.bash.*`.

    Docs: [Configuración](/es/cli/config), [Configurar](/es/cli/configure), [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Cómo ejecuto un Gateway central con trabajadores especializados en varios dispositivos?">
    Patrón común: **un Gateway** (por ejemplo, una Raspberry Pi) más **nodos** y **agentes**.

    - **Gateway (central)**: posee canales (Signal/WhatsApp), enrutamiento y sesiones.
    - **Nodos (dispositivos)**: Macs/iOS/Android se conectan como periféricos y exponen herramientas locales (`system.run`, `canvas`, `camera`).
    - **Agentes (trabajadores)**: cerebros/espacios de trabajo separados para roles especiales (por ejemplo, operaciones frente a datos personales).
    - **Subagentes**: generan trabajo en segundo plano desde un agente principal para paralelismo.
    - **TUI**: conéctate al Gateway y cambia de agentes/sesiones.

    Docs: [Nodos](/es/nodes), [Acceso remoto](/es/gateway/remote), [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [TUI](/es/web/tui).

  </Accordion>

  <Accordion title="¿Puede el navegador de OpenClaw ejecutarse sin interfaz?">
    Sí:

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

    El valor predeterminado es `false` (con interfaz visible). El modo sin interfaz tiene más probabilidades de activar comprobaciones antibot en algunos sitios (X/Twitter a menudo bloquea sesiones sin interfaz). Usa el mismo motor Chromium y funciona para la mayoría de automatizaciones; la diferencia principal es que no hay una ventana de navegador visible (usa capturas de pantalla para lo visual). Consulta [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Cómo uso Brave para controlar el navegador?">
    Configura `browser.executablePath` con tu binario de Brave (o cualquier navegador basado en Chromium) y reinicia el Gateway. Consulta [Navegador](/es/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways y nodos remotos

<AccordionGroup>
  <Accordion title="¿Cómo se propagan los comandos entre Telegram, el gateway y los nodos?">
    Los mensajes de Telegram los gestiona el **gateway**, que ejecuta el agente y solo después llama a los nodos mediante el **WebSocket del Gateway** cuando se necesita una herramienta de nodo:

    Telegram -> Gateway -> Agente -> `node.*` -> Nodo -> Gateway -> Telegram

    Los nodos no ven tráfico entrante del proveedor; solo reciben llamadas RPC de nodo.

  </Accordion>

  <Accordion title="¿Cómo puede mi agente acceder a mi computadora si el Gateway está alojado de forma remota?">
    Empareja tu computadora como un **nodo**. El Gateway se ejecuta en otro lugar, pero puede llamar a herramientas `node.*` (pantalla, cámara, sistema) en tu máquina local mediante el WebSocket del Gateway.

    1. Ejecuta el Gateway en el host siempre activo (VPS/servidor doméstico).
    2. Pon el host del Gateway y tu computadora en la misma tailnet.
    3. Asegúrate de que el WS del Gateway sea accesible (enlace de tailnet o túnel SSH).
    4. Abre la app de macOS localmente y conéctate en modo **Remoto por SSH** (o tailnet directa) para que se registre como nodo.
    5. Aprueba el nodo:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    No se requiere un puente TCP separado; los nodos se conectan mediante el WebSocket del Gateway.

    Recordatorio de seguridad: emparejar un nodo macOS permite `system.run` en esa máquina. Empareja solo dispositivos en los que confíes; revisa [Seguridad](/es/gateway/security).

    Docs: [Nodos](/es/nodes), [Protocolo del Gateway](/es/gateway/protocol), [Modo remoto de macOS](/es/platforms/mac/remote), [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="Tailscale está conectado, pero no recibo respuestas. ¿Qué hago ahora?">
    Comprueba lo básico:

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    Luego verifica la autenticación y el enrutamiento: si usas Tailscale Serve, confirma que `gateway.auth.allowTailscale` esté configurado correctamente; si te conectas mediante un túnel SSH, confirma que el túnel esté activo y apunte al puerto correcto; confirma que las listas de permitidos de tus DM/grupos incluyan tu cuenta.

    Docs: [Tailscale](/es/gateway/tailscale), [Acceso remoto](/es/gateway/remote), [Canales](/es/channels).

  </Accordion>

  <Accordion title="¿Pueden dos instancias de OpenClaw comunicarse entre sí (local + VPS)?">
    Sí, aunque no hay un puente bot a bot integrado.

    **Lo más simple**: usa un canal de chat normal al que ambos bots puedan acceder (Slack/Telegram/WhatsApp). Haz que el Bot A envíe un mensaje al Bot B y luego deja que el Bot B responda como de costumbre.

    **Puente CLI (genérico)**: ejecuta un script que llame al otro Gateway con `openclaw agent --message ... --deliver`, apuntando a un chat donde el otro bot escuche. Si un bot está en un VPS remoto, apunta tu CLI a ese Gateway remoto mediante SSH/Tailscale (consulta [Acceso remoto](/es/gateway/remote)):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Añade una protección para que los dos bots no entren en un bucle infinito (solo menciones, listas de permitidos de canales o una regla de "no responder a mensajes de bots").

    Docs: [Acceso remoto](/es/gateway/remote), [CLI del agente](/es/cli/agent), [Envío del agente](/es/tools/agent-send).

  </Accordion>

  <Accordion title="¿Necesito VPS separados para varios agentes?">
    No. Un Gateway aloja varios agentes, cada uno con su propio workspace, valores predeterminados de modelo y enrutamiento; esta es la configuración normal y es mucho más barata/simple que un VPS por agente. Usa VPS separados solo para aislamiento estricto (límites de seguridad) o configuraciones muy diferentes que no quieras compartir.
  </Accordion>

  <Accordion title="¿Hay alguna ventaja en usar un nodo en mi laptop personal en vez de SSH desde un VPS?">
    Sí: los nodos son la forma principal de llegar a tu laptop desde un Gateway remoto y desbloquean más que el acceso al shell. El Gateway se ejecuta en macOS/Linux (Windows mediante WSL2) y es ligero (un VPS pequeño o una máquina de clase Raspberry Pi funciona bien; 4 GB de RAM es suficiente), así que una configuración común es un host siempre activo más tu laptop como nodo.

    - **No se requiere SSH entrante** - los nodos se conectan hacia el Gateway WebSocket mediante emparejamiento de dispositivos.
    - **Controles de ejecución más seguros** - `system.run` está protegido por listas de permitidos/aprobaciones de nodos en esa laptop.
    - **Más herramientas del dispositivo** - los nodos exponen `canvas`, `camera` y `screen` además de `system.run`.
    - **Automatización del navegador local** - mantén el Gateway en un VPS, pero ejecuta Chrome localmente mediante un host de nodo, o conéctate a Chrome local mediante Chrome MCP.

    SSH está bien para acceso ad hoc al shell; los nodos son más simples para flujos de trabajo continuos de agentes y automatización de dispositivos.

    Docs: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes), [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Los nodos ejecutan un servicio de Gateway?">
    No. Solo **un gateway** debe ejecutarse por host, a menos que ejecutes perfiles aislados intencionalmente (consulta [Múltiples gateways](/es/gateway/multiple-gateways)). Los nodos son periféricos que se conectan al gateway (nodos iOS/Android, o "modo nodo" de macOS en la app de la barra de menús). Para hosts de nodos sin interfaz y control por CLI, consulta [CLI del host Node](/es/cli/node).

    Se requiere un reinicio completo para cambios en `gateway`, `discovery` y superficies de plugins alojados.

  </Accordion>

  <Accordion title="¿Hay una forma API / RPC de aplicar configuración?">
    Sí:

    - `config.schema.lookup`: inspecciona un subárbol de configuración con su nodo de esquema superficial, la sugerencia de UI coincidente y resúmenes de hijos inmediatos antes de escribir.
    - `config.get`: obtiene la instantánea actual más el hash.
    - `config.patch`: actualización parcial segura (preferida para la mayoría de ediciones RPC); recarga en caliente cuando es posible, reinicia cuando es necesario.
    - `config.apply`: valida y reemplaza la configuración completa; recarga en caliente cuando es posible, reinicia cuando es necesario.
    - La herramienta de runtime `gateway` orientada al agente todavía se niega a reescribir `tools.exec.ask` / `tools.exec.security`; los alias heredados `tools.bash.*` se normalizan a las mismas rutas protegidas.

  </Accordion>

  <Accordion title="Configuración mínima sensata para una primera instalación">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Define tu workspace y restringe quién puede activar el bot.

  </Accordion>

  <Accordion title="¿Cómo configuro Tailscale en un VPS y me conecto desde mi Mac?">
    1. **Instala + inicia sesión en el VPS**:
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. **Instala + inicia sesión en tu Mac** usando la app de Tailscale, en la misma tailnet.
    3. **Activa MagicDNS** en la consola de administración de Tailscale para que el VPS tenga un nombre estable.
    4. **Usa el nombre de host de la tailnet**: SSH `ssh user@your-vps.tailnet-xxxx.ts.net`; Gateway WS `ws://your-vps.tailnet-xxxx.ts.net:18789`.

    Para la Control UI sin SSH, usa Tailscale Serve en el VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Esto mantiene el gateway vinculado a loopback y expone HTTPS mediante Tailscale. Consulta [Tailscale](/es/gateway/tailscale).

  </Accordion>

  <Accordion title="¿Cómo conecto un nodo Mac a un Gateway remoto (Tailscale Serve)?">
    Serve expone la **interfaz de control del Gateway + WS**; los nodos se conectan mediante el mismo endpoint WS del Gateway.

    1. Asegúrate de que el VPS y el Mac estén en la misma tailnet.
    2. Usa la app de macOS en modo remoto (el destino SSH puede ser el nombre de host de la tailnet): crea un túnel al puerto del Gateway y se conecta como nodo.
    3. Aprueba el nodo:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentación: [Protocolo del Gateway](/es/gateway/protocol), [Descubrimiento](/es/gateway/discovery), [modo remoto de macOS](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Debería instalarlo en una segunda laptop o solo agregar un nodo?">
    Para **herramientas locales únicamente** (pantalla/cámara/exec) en la segunda laptop, agrégala como **nodo**: un solo Gateway, sin configuración duplicada. Actualmente, las herramientas de nodo local solo están disponibles en macOS. Instala un segundo Gateway solo para **aislamiento estricto** o para dos bots completamente separados.

    Documentación: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes), [Múltiples gateways](/es/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables de entorno y carga de .env

<AccordionGroup>
  <Accordion title="¿Cómo carga OpenClaw las variables de entorno?">
    OpenClaw lee variables de entorno del proceso padre (shell, launchd/systemd, CI, etc.) y además carga:

    - `.env` desde el directorio de trabajo actual.
    - una `.env` global de respaldo desde `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`).

    Ningún archivo `.env` sobrescribe las variables de entorno existentes. Las claves de credenciales de proveedores son una excepción para el `.env` del espacio de trabajo: claves como `GEMINI_API_KEY`, `XAI_API_KEY` o `MISTRAL_API_KEY` (y otras variables de entorno de autenticación de proveedores incluidos) se ignoran desde el `.env` del espacio de trabajo y deberían vivir en el entorno del proceso, `~/.openclaw/.env` o la configuración `env`.

    Las variables de entorno en línea en la configuración se aplican solo si faltan en el entorno del proceso:

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
    Dos soluciones:

    1. Coloca las claves faltantes en `~/.openclaw/.env` para que se carguen incluso cuando el servicio no herede el entorno de tu shell.
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
       Esto ejecuta tu shell de inicio de sesión e importa solo las claves esperadas que falten (nunca sobrescribe). Equivalentes de variables de entorno: `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Configuré COPILOT_GITHUB_TOKEN, pero el estado de modelos muestra "Shell env: off". ¿Por qué?'>
    `openclaw models status` informa si la **importación del entorno del shell** está habilitada. "Shell env: off" **no** significa que falten tus variables de entorno: solo significa que OpenClaw no cargará tu shell de inicio de sesión automáticamente.

    Si el Gateway se ejecuta como servicio (launchd/systemd), no heredará el entorno de tu shell. Soluciónalo colocando el token en `~/.openclaw/.env`, habilitando `env.shellEnv.enabled: true` o agregándolo a la configuración `env` (se aplica solo si falta), luego reinicia el gateway y vuelve a comprobar:

    ```bash
    openclaw models status
    ```

    Los tokens de Copilot se resuelven en este orden: `OPENCLAW_GITHUB_TOKEN`, luego `COPILOT_GITHUB_TOKEN`, luego `GH_TOKEN`, luego `GITHUB_TOKEN`.

    Consulta [/concepts/model-providers](/es/concepts/model-providers) y [/environment](/es/help/environment).

  </Accordion>
</AccordionGroup>

## Sesiones y múltiples chats

<AccordionGroup>
  <Accordion title="¿Cómo inicio una conversación nueva?">
    Envía `/new` o `/reset` como mensaje independiente. Consulta [Gestión de sesiones](/es/concepts/session).
  </Accordion>

  <Accordion title="¿Las sesiones se restablecen automáticamente si nunca envío /new?">
    Sí. La política de restablecimiento predeterminada es **diaria**: una sesión pasa a una nueva al llegar a una hora local configurada en el host del gateway (`session.reset.atHour`, valor predeterminado `4`, 0-23), según cuándo comenzó la sesión actual. Cambia a un restablecimiento basado en inactividad con `mode: "idle"` y `session.reset.idleMinutes`, que expira una sesión después de un período de inactividad (según la última interacción real, no eventos del sistema de heartbeat/cron/exec).

    ```json5
    {
      session: {
        reset: { mode: "daily", atHour: 4 },
        resetByType: {
          group: { mode: "idle", idleMinutes: 120 },
          thread: { mode: "daily", atHour: 6 },
        },
        resetByChannel: {
          discord: { mode: "idle", idleMinutes: 10080 },
        },
      },
    }
    ```

    `resetByType` admite `direct` (alias heredado `dm`), `group` y `thread`. El `session.idleMinutes` de nivel superior heredado sigue funcionando como alias de compatibilidad para un valor predeterminado en modo inactivo cuando no se define ningún bloque `session.reset`/`resetByType`. Las sesiones con una sesión de CLI activa propiedad del proveedor no se cortan por el valor predeterminado diario implícito. Consulta [Gestión de sesiones](/es/concepts/session) para ver el ciclo de vida completo.

  </Accordion>

  <Accordion title="¿Hay una forma de crear un equipo de instancias de OpenClaw (un CEO y muchos agentes)?">
    Sí, mediante **enrutamiento multiagente** y **subagentes**: un agente coordinador más varios agentes trabajadores con sus propios espacios de trabajo y modelos.

    Es mejor verlo como un experimento divertido: consume muchos tokens y a menudo es menos eficiente que un bot con sesiones separadas. El modelo típico es un bot con el que hablas, con distintas sesiones para trabajo paralelo, que genera subagentes cuando hace falta.

    Documentación: [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [CLI de agentes](/es/cli/agents).

  </Accordion>

  <Accordion title="¿Por qué se truncó el contexto a mitad de una tarea? ¿Cómo lo evito?">
    El contexto de la sesión está limitado por la ventana del modelo. Chats largos, salidas grandes de herramientas o muchos archivos pueden activar Compaction o truncamiento.

    - Pide al bot que resuma el estado actual y lo escriba en un archivo.
    - Usa `/compact` antes de tareas largas, `/new` al cambiar de tema.
    - Mantén el contexto importante en el espacio de trabajo y pide al bot que lo vuelva a leer.
    - Usa subagentes para trabajos largos o paralelos, de modo que el chat principal siga siendo más pequeño.
    - Elige un modelo con una ventana de contexto mayor si esto ocurre con frecuencia.

  </Accordion>

  <Accordion title="¿Cómo restablezco OpenClaw por completo pero lo mantengo instalado?">
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

    Onboarding también ofrece **Restablecer** si detecta una configuración existente; consulta [Onboarding (CLI)](/es/start/wizard). Si usaste perfiles (`--profile` / `OPENCLAW_PROFILE`), restablece cada directorio de estado (predeterminado `~/.openclaw-<profile>`). Restablecimiento solo para desarrollo: `openclaw gateway --dev --reset` borra la configuración de desarrollo, las credenciales, las sesiones y el espacio de trabajo.

  </Accordion>

  <Accordion title='Recibo errores de "context too large": ¿cómo restablezco o compacto?'>
    - **Compactar** (mantiene la conversación, resume turnos antiguos): `/compact` o `/compact <instructions>` para orientar el resumen.
    - **Restablecer** (ID de sesión nuevo para la misma clave de chat): `/new` o `/reset`.

    Si sigue ocurriendo, ajusta la **poda de sesiones** (`agents.defaults.contextPruning`) para recortar salidas antiguas de herramientas, o usa un modelo con una ventana de contexto mayor.

    Documentación: [Compaction](/es/concepts/compaction), [Poda de sesiones](/es/concepts/session-pruning), [Gestión de sesiones](/es/concepts/session).

  </Accordion>

  <Accordion title='¿Por qué veo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Error de validación del proveedor: el modelo emitió un bloque `tool_use` sin el `input` requerido. Por lo general significa que el historial de la sesión está obsoleto o dañado (a menudo después de hilos largos o un cambio de herramienta/esquema).

    Solución: inicia una sesión nueva con `/new` (mensaje independiente).

  </Accordion>

  <Accordion title="¿Por qué recibo mensajes de Heartbeat cada 30 minutos?">
    Los Heartbeats se ejecutan cada **30m** de forma predeterminada, o cada **1h** cuando el modo de autenticación resuelto es autenticación Anthropic OAuth/token (incluida la reutilización de Claude CLI) y `heartbeat.every` no está configurado. Ajusta o deshabilita:

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

    Si `HEARTBEAT.md` existe pero está efectivamente vacío (solo líneas en blanco, comentarios Markdown/HTML, encabezados ATX, marcadores de bloque cercado o stubs de elementos de lista vacíos), OpenClaw omite la ejecución de heartbeat para ahorrar llamadas de API. Si falta el archivo, el heartbeat sigue ejecutándose y el modelo decide qué hacer.

    Las anulaciones por agente usan `agents.list[].heartbeat`. Documentación: [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title='¿Necesito agregar una "cuenta de bot" a un grupo de WhatsApp?'>
    No. OpenClaw se ejecuta en **tu propia cuenta**: si estás en el grupo, OpenClaw puede verlo. De forma predeterminada, las respuestas en grupos están bloqueadas hasta que permitas remitentes (`groupPolicy: "allowlist"`).

    Para restringir las respuestas en grupos solo a ti:

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
    Lo más rápido: sigue los logs y envía un mensaje de prueba en el grupo.

    ```bash
    openclaw logs --follow --json
    ```

    Busca `chatId` (o `from`) que termine en `@g.us`, como `1234567890-1234567890@g.us`.

    Si ya está configurado/en allowlist, lista los grupos desde la configuración:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentación: [WhatsApp](/es/channels/whatsapp), [Directorio](/es/cli/directory), [Logs](/es/cli/logs).

  </Accordion>

  <Accordion title="¿Por qué OpenClaw no responde en un grupo?">
    Dos causas comunes: el filtrado por mención está activado de forma predeterminada (debes @mencionar al bot, o coincidir con `mentionPatterns`), o configuraste `channels.whatsapp.groups` sin `"*"` y el grupo no está en allowlist.

    Consulta [Grupos](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).

  </Accordion>

  <Accordion title="¿Los grupos/hilos comparten contexto con los DM?">
    Los chats directos se agrupan en la sesión principal de forma predeterminada. Los grupos/canales tienen sus propias claves de sesión, y los temas de Telegram / hilos de Discord son sesiones separadas. Consulta [Grupos](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).
  </Accordion>

  <Accordion title="¿Cuántos espacios de trabajo y agentes puedo crear?">
    No hay límites estrictos: docenas o incluso cientos están bien, pero vigila:

    - **Crecimiento del disco**: las sesiones y transcripciones viven en `~/.openclaw/agents/<agentId>/sessions/`.
    - **Costo de tokens**: más agentes implican más uso concurrente de modelos.
    - **Sobrecarga operativa**: perfiles de autenticación, espacios de trabajo y enrutamiento de canales por agente.

    Mantén un espacio de trabajo **activo** por agente (`agents.defaults.workspace`), poda sesiones antiguas si el disco crece y usa `openclaw doctor` para detectar espacios de trabajo sueltos y discrepancias de perfiles.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios bots o chats al mismo tiempo (Slack), y cómo debería configurarlo?">
    Sí, mediante **Enrutamiento Multiagente**: ejecuta varios agentes aislados y enruta los mensajes entrantes por canal/cuenta/par. Slack está admitido como canal y se puede vincular a agentes específicos.

    El acceso al navegador es potente, pero no "puede hacer cualquier cosa que una persona pueda": anti-bot, CAPTCHAs y MFA aún pueden bloquear la automatización. Para el control más fiable, usa Chrome MCP local en el host, o CDP en la máquina que realmente ejecuta el navegador.

    Configuración recomendada: host de Gateway siempre activo (VPS/Mac mini), un agente por rol (vinculaciones), canales de Slack vinculados a esos agentes y navegador local mediante Chrome MCP o un nodo cuando haga falta.

    Docs: [Enrutamiento multiagente](/es/concepts/multi-agent), [Slack](/es/channels/slack), [Navegador](/es/tools/browser), [Nodes](/es/nodes).

  </Accordion>
</AccordionGroup>

## Modelos, conmutación por error y perfiles de autenticación

Las preguntas y respuestas sobre modelos (valores predeterminados, selección, alias, cambio, conmutación por error y perfiles de autenticación) están en las [preguntas frecuentes sobre modelos](/es/help/faq-models).

## Gateway: puertos, "ya está en ejecución" y modo remoto

<AccordionGroup>
  <Accordion title="¿Qué puerto usa el Gateway?">
    `gateway.port` controla el único puerto multiplexado para WebSocket + HTTP (interfaz de control, hooks, etc.). Precedencia:

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status dice "Runtime: running" pero "Connectivity probe: failed"?'>
    "Running" es la vista del **supervisor** (launchd/systemd/schtasks); la sonda de conectividad es la CLI conectándose realmente al WebSocket del gateway. Confía en estas líneas de `openclaw gateway status`: `Probe target:` (la URL que usó la sonda), `Listening:` (lo que realmente está enlazado en el puerto), `Last gateway error:` (causa raíz común cuando el proceso está activo pero el puerto no escucha).
  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status muestra "Config (cli)" y "Config (service)" diferentes?'>
    Estás editando un archivo de configuración mientras el servicio ejecuta otro (a menudo por una discrepancia de `--profile` / `OPENCLAW_STATE_DIR`).

    Solución: ejecútalo desde el mismo `--profile` / entorno que quieres que use el servicio:

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='¿Qué significa "another gateway instance is already listening"?'>
    OpenClaw aplica un bloqueo de runtime enlazando el listener WebSocket inmediatamente al iniciar (predeterminado: `ws://127.0.0.1:18789`). Si el enlace falla con `EADDRINUSE`, lanza `GatewayLockError` ("another gateway instance is already listening").

    Solución: detén la otra instancia, libera el puerto o ejecútalo con `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="¿Cómo ejecuto OpenClaw en modo remoto (el cliente se conecta a un Gateway en otro lugar)?">
    Define `gateway.mode: "remote"` y apunta a una URL WebSocket remota, opcionalmente con credenciales remotas de secreto compartido:

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

    - `openclaw gateway` solo se inicia cuando `gateway.mode` es `local` (o pasas una marca de anulación).
    - La app de macOS observa el archivo de configuración y cambia de modo en vivo cuando estos valores cambian.
    - `gateway.remote.token` / `.password` son solo credenciales remotas del lado del cliente; no habilitan por sí mismas la autenticación del gateway local.

  </Accordion>

  <Accordion title='La interfaz de control dice "unauthorized" (o sigue reconectándose). ¿Qué hago ahora?'>
    La ruta de autenticación de tu gateway y el método de autenticación de la interfaz no coinciden.

    Hechos (desde el código):

    - La interfaz de control conserva el token en `sessionStorage`, acotado a la pestaña actual del navegador y a la URL de gateway seleccionada, por lo que las recargas en la misma pestaña siguen funcionando sin persistencia de token de larga duración en localStorage.
    - En `AUTH_TOKEN_MISMATCH`, los clientes de confianza pueden intentar un reintento acotado con un token de dispositivo en caché cuando el gateway devuelve sugerencias de reintento (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ese reintento con token en caché reutiliza los alcances aprobados en caché almacenados con el token de dispositivo; los llamadores con `deviceToken` explícito / `scopes` explícitos mantienen el conjunto de alcances solicitado en lugar de heredar los alcances en caché.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token de arranque.
    - El arranque integrado con código de configuración devuelve un token de dispositivo de nodo con `scopes: []` más un token acotado de transferencia al operador para incorporación móvil de confianza. La transferencia al operador puede leer la configuración nativa de tiempo de configuración, pero no concede alcances de mutación de emparejamiento ni `operator.admin`.

    Solución:

    - Más rápido: `openclaw dashboard` (imprime y copia la URL del panel, intenta abrirla; muestra una sugerencia de SSH si no hay interfaz gráfica).
    - Aún no hay token: `openclaw doctor --generate-gateway-token`.
    - Remoto: primero crea un túnel con `ssh -N -L 18789:127.0.0.1:18789 user@host`, luego abre `http://127.0.0.1:18789/`.
    - Modo de secreto compartido: define `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, luego pega el secreto correspondiente en los ajustes de la interfaz de control.
    - Modo Tailscale Serve: confirma que `gateway.auth.allowTailscale` esté habilitado y que estás abriendo la URL de Serve, no una URL sin procesar de loopback/tailnet que omite los encabezados de identidad de Tailscale.
    - Modo de proxy de confianza: confirma que estás entrando a través del proxy configurado con identidad. Los proxies de loopback en el mismo host también necesitan `gateway.auth.trustedProxy.allowLoopback = true`.
    - La discrepancia persiste después del único reintento: rota/vuelve a aprobar el token del dispositivo emparejado:
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - Rotación denegada: las sesiones de dispositivo emparejado solo pueden rotar su **propio** dispositivo, salvo que también tengan `operator.admin`, y los valores explícitos de `--scope` no pueden superar los alcances de operador actuales del llamador.
    - Sigue bloqueado: `openclaw status --all` más [Solución de problemas](/es/gateway/troubleshooting). Consulta [Panel](/es/web/dashboard) para detalles de autenticación.

  </Accordion>

  <Accordion title="Definí gateway.bind tailnet, pero no puede enlazar y nada escucha">
    El enlace `tailnet` elige una IP de Tailscale desde tus interfaces de red (100.64.0.0/10). Si la máquina no está en Tailscale (o la interfaz está caída), no hay nada a lo que enlazar.

    Solución: inicia Tailscale en ese host o cambia a `gateway.bind: "loopback"` / `"lan"`.

    `tailnet` es explícito; `auto` prefiere loopback. Usa `gateway.bind: "tailnet"` para un enlace solo de tailnet.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios Gateways en el mismo host?">
    Normalmente no: un Gateway puede ejecutar varios canales de mensajería y agentes. Usa varios Gateways solo para redundancia (por ejemplo, un bot de rescate) o aislamiento estricto, y aísla cada uno con su propio `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `agents.defaults.workspace` y `gateway.port` único.

    Recomendado: `openclaw --profile <name> ...` por instancia (crea automáticamente `~/.openclaw-<name>`), un `gateway.port` único por configuración de perfil (o `--port` para ejecuciones manuales) y un servicio por perfil con `openclaw --profile <name> gateway install`.

    Los perfiles también añaden sufijos a los nombres de servicio: launchd `ai.openclaw.<profile>`, systemd `openclaw-gateway-<profile>.service`, Windows `OpenClaw Gateway (<profile>)`. La unidad systemd sin calificador `openclaw-gateway` solo existe para el perfil predeterminado; el nombre de unidad systemd heredado anterior al cambio de nombre `clawdbot-gateway` se migra automáticamente.

    Guía completa: [Varios gateways](/es/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='¿Qué significa "invalid handshake" / código 1008?'>
    El Gateway es un **servidor WebSocket** y espera que el primer mensaje sea una trama `connect`. Cualquier otra cosa cierra la conexión con **código 1008** (infracción de política).

    Causas comunes: abriste la URL **HTTP** en un navegador en lugar de un cliente WS, usaste el puerto/ruta incorrectos o un proxy/túnel eliminó los encabezados de autenticación o envió una solicitud que no era de Gateway.

    Solución: usa la URL WS (`ws://<host>:18789`, o `wss://...` sobre HTTPS), no abras el puerto WS en una pestaña normal del navegador e incluye el token/contraseña en la trama `connect` cuando la autenticación esté activada. Ejemplo de CLI/TUI:

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Detalles del protocolo: [protocolo de Gateway](/es/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Registro y depuración

<AccordionGroup>
  <Accordion title="¿Dónde están los registros?">
    Registros de archivo (estructurados): `/tmp/openclaw/openclaw-YYYY-MM-DD.log`. Define una ruta estable mediante `logging.file`; el nivel de registro de archivo mediante `logging.level`; la verbosidad de consola mediante `--verbose` y `logging.consoleLevel`.

    Seguimiento más rápido:

    ```bash
    openclaw logs --follow
    ```

    Registros de servicio/supervisor (cuando el gateway se ejecuta mediante launchd/systemd):

    - stdout de launchd en macOS: `~/Library/Logs/openclaw/gateway.log` (los perfiles usan `gateway-<profile>.log`; stderr se suprime).
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`.
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`.

    Consulta [Solución de problemas](/es/gateway/troubleshooting) para más información.

  </Accordion>

  <Accordion title="¿Cómo inicio/detengo/reinicio el servicio Gateway?">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Si ejecutas el gateway manualmente, `openclaw gateway --force` puede recuperar el puerto. Consulta [Gateway](/es/gateway).

  </Accordion>

  <Accordion title="Cerré mi terminal en Windows: ¿cómo reinicio OpenClaw?">
    Tres modos de instalación en Windows:

    **1) Configuración local de Windows Hub**: la app nativa gestiona un Gateway WSL local propiedad de la app. Abre **OpenClaw Companion** desde el menú Inicio o la bandeja, luego usa **Configuración de Gateway** o la pestaña Conexiones.

    **2) Gateway WSL2 manual**: el Gateway se ejecuta dentro de Linux.
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    Si nunca instalaste el servicio, inícialo en primer plano: `openclaw gateway run`.

    **3) CLI/Gateway nativo de Windows**: se ejecuta directamente en Windows.
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    Si lo ejecutas manualmente (sin servicio): `openclaw gateway run`.

    Docs: [Windows](/es/platforms/windows), [runbook del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="El Gateway está activo, pero las respuestas nunca llegan. ¿Qué debo revisar?">
    Revisión rápida de salud:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causas comunes: autenticación del modelo no cargada en el **host del gateway** (revisa `models status`), emparejamiento/lista de permitidos del canal bloqueando respuestas (revisa la configuración y los registros del canal), o WebChat/Panel abierto sin el token correcto. Si es remoto, confirma que la conexión de túnel/Tailscale esté activa y que el WebSocket del Gateway sea accesible.

    Docs: [Canales](/es/channels), [Solución de problemas](/es/gateway/troubleshooting), [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason": ¿qué hago ahora?'>
    Normalmente significa que la interfaz perdió la conexión WebSocket. Revisa: ¿está en ejecución el Gateway (`openclaw gateway status`)? ¿Está sano (`openclaw status`)? ¿Tiene la interfaz el token correcto (`openclaw dashboard`)? Si es remoto, ¿está activo el enlace de túnel/Tailscale?

    Luego sigue los registros:

    ```bash
    openclaw logs --follow
    ```

    Docs: [Panel](/es/web/dashboard), [Acceso remoto](/es/gateway/remote), [Solución de problemas](/es/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands falla. ¿Qué debo revisar?">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Luego compara el error:

    - `BOT_COMMANDS_TOO_MUCH`: el menú de Telegram tiene demasiadas entradas. OpenClaw ya recorta al límite de Telegram y reintenta con menos comandos, pero algunas entradas del menú aún pueden descartarse. Reduce los comandos de plugin/skill/personalizados, o deshabilita `channels.telegram.commands.native` si no necesitas el menú.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, o errores de red similares: en un VPS o detrás de un proxy, confirma que HTTPS saliente esté permitido y que DNS funcione para `api.telegram.org`.

    Si el Gateway es remoto, revisa los registros en el host del Gateway.

    Docs: [Telegram](/es/channels/telegram), [Solución de problemas de canales](/es/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI no muestra salida. ¿Qué debo comprobar?">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    En la TUI, usa `/status` para ver el estado actual. Si esperas respuestas en un canal de chat, confirma que la entrega esté habilitada (`/deliver on`).

    Docs: [TUI](/es/web/tui), [comandos de barra](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo detengo por completo y luego inicio el Gateway?">
    Si instalaste el servicio (launchd en macOS, systemd en Linux):

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    En primer plano, detén con Ctrl-C y luego `openclaw gateway run`.

    Docs: [runbook del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart frente a openclaw gateway">
    `openclaw gateway restart` reinicia el **servicio en segundo plano** (launchd/systemd). `openclaw gateway` ejecuta el gateway **en primer plano** para esta sesión de terminal. Usa los subcomandos de gateway si instalaste el servicio; usa la ejecución en primer plano sin argumentos para una ejecución puntual.
  </Accordion>

  <Accordion title="La forma más rápida de obtener más detalles cuando algo falla">
    Inicia el Gateway con `--verbose` para obtener más detalle en la consola y luego inspecciona el archivo de registro para ver errores de autenticación de canales, enrutamiento de modelos y RPC.
  </Accordion>
</AccordionGroup>

## Medios y archivos adjuntos

<AccordionGroup>
  <Accordion title="Mi skill generó una imagen/PDF, pero no se envió nada">
    Los archivos adjuntos salientes del agente deben usar campos de medios estructurados como `media`, `mediaUrl`, `path` o `filePath`. Consulta [configuración del asistente OpenClaw](/es/start/openclaw) y [envío del agente](/es/tools/agent-send).

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Comprueba también: el canal de destino admite medios salientes y no está bloqueado por listas de permitidos; el archivo está dentro de los límites de tamaño del proveedor (las imágenes se redimensionan a un lado máximo de 2048px); `tools.fs.workspaceOnly=true` limita los envíos de rutas locales al espacio de trabajo, temp/media-store y archivos validados por sandbox; `tools.fs.workspaceOnly=false` (predeterminado) permite que los envíos de medios locales estructurados usen archivos locales del host que el agente ya puede leer, para medios y tipos de documentos seguros (imágenes, audio, video, PDF, documentos de Office y documentos de texto validados como Markdown/MD, TXT, JSON, YAML/YML). Esto no es un escáner de secretos: un `secret.txt` o `config.json` legible por el agente se puede adjuntar cuando coincidan la validación de la extensión y del contenido. Mantén los archivos sensibles fuera de las rutas legibles por el agente, o conserva `tools.fs.workspaceOnly=true` para envíos de rutas locales más estrictos.

    Consulta [imágenes](/es/nodes/images).

  </Accordion>
</AccordionGroup>

## Seguridad y control de acceso

<AccordionGroup>
  <Accordion title="¿Es seguro exponer OpenClaw a mensajes directos entrantes?">
    Trata los mensajes directos entrantes como entrada no confiable. Los valores predeterminados reducen el riesgo:

    - El comportamiento predeterminado en canales que admiten mensajes directos es **emparejamiento**: los remitentes desconocidos reciben un código de emparejamiento y su mensaje no se procesa. Aprueba con `openclaw pairing approve --channel <channel> [--account <id>] <code>`. Las solicitudes pendientes tienen un límite de **3 por canal**; comprueba `openclaw pairing list --channel <channel> [--account <id>]` si no llegó un código.
    - Abrir los mensajes directos públicamente requiere una aceptación explícita (`dmPolicy: "open"` y lista de permitidos `"*"`).

    Ejecuta `openclaw doctor` para mostrar políticas de mensajes directos riesgosas.

  </Accordion>

  <Accordion title="¿La inyección de prompts solo es una preocupación para bots públicos?">
    No. La inyección de prompts trata sobre **contenido no confiable**, no solo sobre quién puede enviar mensajes directos al bot. Si tu asistente lee contenido externo (búsqueda/obtención web, páginas del navegador, correos electrónicos, docs, archivos adjuntos, registros pegados), ese contenido puede llevar instrucciones que intenten secuestrar el modelo, incluso si tú eres el único remitente.

    El mayor riesgo aparece cuando las herramientas están habilitadas: el modelo puede ser engañado para exfiltrar contexto o invocar herramientas en tu nombre. Reduce el radio de impacto:

    - usa un agente "lector" de solo lectura o con herramientas deshabilitadas para resumir contenido no confiable
    - mantén `web_search` / `web_fetch` / `browser` desactivados para agentes con herramientas habilitadas
    - trata también el texto decodificado de archivos/documentos como no confiable: OpenResponses `input_file` y la extracción de adjuntos multimedia envuelven el texto extraído en marcadores explícitos de límite de contenido externo en lugar de pasar texto de archivo sin procesar
    - usa sandbox y listas estrictas de herramientas permitidas

    Detalles: [seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿OpenClaw es menos seguro porque usa TypeScript/Node en lugar de Rust/WASM?">
    El lenguaje y el runtime importan, pero no son el riesgo principal para un agente personal. Los riesgos prácticos son la exposición del gateway, quién puede enviar mensajes al bot, la inyección de prompts, el alcance de las herramientas, el manejo de credenciales, el acceso al navegador, el acceso exec y la confianza en skills/plugins de terceros.

    Rust y WASM pueden ofrecer un aislamiento más fuerte para algunas clases de código, pero no resuelven la inyección de prompts, las listas de permitidos deficientes, la exposición pública del gateway, herramientas demasiado amplias ni un perfil de navegador que ya haya iniciado sesión en cuentas sensibles. Trata estos como los controles principales: mantén el Gateway privado o autenticado, usa emparejamiento y listas de permitidos para mensajes directos/grupos, deniega o aísla con sandbox las herramientas riesgosas para entradas no confiables, instala solo plugins y skills de confianza, y ejecuta `openclaw security audit --deep` después de cambios de configuración.

    Detalles: [seguridad](/es/gateway/security), [sandboxing](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="Vi informes sobre instancias de OpenClaw expuestas. ¿Qué debo comprobar?">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Una base más segura: Gateway vinculado a `loopback`, o expuesto solo mediante acceso privado autenticado (tailnet, túnel SSH, autenticación con token/contraseña o un proxy de confianza correctamente configurado); mensajes directos en modo `pairing` o `allowlist`; grupos en lista de permitidos y con requerimiento de mención salvo que todos los miembros sean de confianza; herramientas de alto riesgo (`exec`, `browser`, `gateway`, `cron`) denegadas o con alcance muy restringido para agentes que leen contenido no confiable; sandboxing habilitado donde la ejecución de herramientas necesite un radio de impacto menor.

    Los hallazgos que debes corregir primero son enlaces públicos sin autenticación, mensajes directos/grupos abiertos con herramientas y control de navegador expuesto. Detalles: [openclaw security audit](/es/gateway/security#openclaw-security-audit).

  </Accordion>

  <Accordion title="¿Es seguro instalar Skills de ClawHub y plugins de terceros?">
    Trata las Skills y los plugins de terceros como código en el que decides confiar. Las páginas de Skills de ClawHub muestran el estado del análisis antes de la instalación, pero los análisis no son un límite de seguridad completo. OpenClaw no ejecuta bloqueo local integrado de código peligroso durante la instalación o actualización de plugins/Skills; usa `security.installPolicy`, propiedad del operador, para decisiones locales de permitir/bloquear.

    Patrón más seguro: prefiere autores de confianza y versiones fijadas, lee la Skill/plugin antes de habilitarla, mantén listas de permitidos de plugins/Skills reducidas, ejecuta flujos de trabajo con entradas no confiables en un sandbox con herramientas mínimas y evita dar al código de terceros acceso amplio al sistema de archivos, exec, navegador o secretos.

    Detalles: [Skills](/es/tools/skills), [Plugins](/es/tools/plugin), [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Mi bot debería tener su propio correo electrónico, cuenta de GitHub o número de teléfono?">
    Sí, para la mayoría de las configuraciones. Aislar el bot con cuentas y números de teléfono separados reduce el radio de impacto si algo sale mal, y facilita rotar credenciales o revocar el acceso sin afectar tus cuentas personales.

    Empieza con poco: da acceso solo a las herramientas y cuentas que realmente necesitas, y amplíalo más adelante si hace falta.

    Documentación: [Seguridad](/es/gateway/security), [Emparejamiento](/es/channels/pairing).

  </Accordion>

  <Accordion title="¿Puedo darle autonomía sobre mis mensajes de texto y es seguro?">
    **No** recomendamos autonomía completa sobre tus mensajes personales. Patrón más seguro: mantén los DM en **modo de emparejamiento** o con una lista de permitidos estricta, usa un **número o cuenta separados** si debe enviar mensajes en tu nombre, y deja que redacte mientras tú **apruebas antes de enviar**.

    Para experimentar, hazlo en una cuenta dedicada y aislada. Consulta [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Puedo usar modelos más baratos para tareas de asistente personal?">
    Sí, **si** el agente es solo de chat y la entrada es de confianza. Los niveles más pequeños son más susceptibles al secuestro de instrucciones, así que evítalos para agentes con herramientas habilitadas o al leer contenido no confiable. Si tienes que usar un modelo más pequeño, restringe las herramientas y ejecútalo dentro de un sandbox. Consulta [Seguridad](/es/gateway/security).
  </Accordion>

  <Accordion title="Ejecuté /start en Telegram pero no recibí un código de emparejamiento">
    Los códigos de emparejamiento se envían **solo** cuando un remitente desconocido envía un mensaje al bot y `dmPolicy: "pairing"` está habilitado; `/start` por sí solo no genera un código.

    Revisa las solicitudes pendientes:

    ```bash
    openclaw pairing list telegram
    ```

    Para acceso inmediato, añade el id de tu remitente a la lista de permitidos o establece `dmPolicy: "open"` para esa cuenta.

  </Accordion>

  <Accordion title="WhatsApp: ¿enviará mensajes a mis contactos? ¿Cómo funciona el emparejamiento?">
    No. La política de DM predeterminada de WhatsApp es **emparejamiento**. Los remitentes desconocidos solo reciben un código de emparejamiento; su mensaje **no se procesa**. OpenClaw solo responde a chats que recibe o a envíos explícitos que tú activas.

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    La solicitud de número de teléfono del asistente configura tu **lista de permitidos/propietario** para que tus propios DM estén permitidos; no se usa para envíos automáticos. En tu número personal de WhatsApp, usa ese número y habilita `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandos de chat, cancelación de tareas y "no se detiene"

<AccordionGroup>
  <Accordion title="¿Cómo evito que los mensajes internos del sistema aparezcan en el chat?">
    La mayoría de los mensajes internos/de herramientas solo aparecen cuando **verbose**, **trace** o **reasoning** están habilitados para esa sesión.

    Corrígelo en el chat donde lo ves:

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    Si sigue habiendo demasiado ruido: revisa la configuración de la sesión en la Control UI y establece verbose en **inherit**; confirma que no estás usando un perfil de bot con `verboseDefault: "on"` en la configuración.

    Documentación: [Pensamiento y verbose](/es/tools/thinking), [Seguridad](/es/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="¿Cómo detengo/cancelo una tarea en ejecución?">
    Envía cualquiera de estos **como mensaje independiente** (sin barra) para activar una cancelación: `stop`, `stop action`, `stop current action`, `stop run`, `stop current run`, `stop agent`, `stop the agent`, `stop openclaw`, `openclaw stop`, `stop don't do anything`, `stop do not do anything`, `stop doing anything`, `do not do that`, `please stop`, `stop please`, `abort`, `esc`, `wait`, `exit`, `interrupt`, `halt`. También funcionan activadores comunes en idiomas distintos del inglés (francés, alemán, español, chino, japonés, hindi, árabe, ruso).

    Para procesos en segundo plano iniciados por la herramienta exec, pide al agente que ejecute:

    ```text
    process action:kill sessionId:XXX
    ```

    La mayoría de los comandos con barra deben enviarse como un mensaje **independiente** que empiece por `/`, pero algunos atajos (como `/status`) también funcionan en línea para remitentes en lista de permitidos. Consulta [Comandos con barra](/es/tools/slash-commands).

  </Accordion>

  <Accordion title='¿Cómo envío un mensaje de Discord desde Telegram? ("Mensajería entre contextos denegada")'>
    OpenClaw bloquea la mensajería **entre proveedores** de forma predeterminada. Si una llamada de herramienta está vinculada a Telegram, no enviará a Discord a menos que lo permitas explícitamente, y esto entra en vigor de inmediato, sin necesidad de reiniciar el Gateway:

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

  </Accordion>

  <Accordion title='¿Por qué parece que el bot "ignora" los mensajes enviados en ráfaga?'>
    De forma predeterminada, las indicaciones durante una ejecución se dirigen a la ejecución activa. Usa `/queue` para elegir el comportamiento de la ejecución activa:

    - `steer` (predeterminado) - guía la ejecución activa en el siguiente límite del modelo.
    - `followup` - pone los mensajes en cola y los ejecuta uno por uno después de que termine la ejecución actual.
    - `collect` - pone en cola los mensajes compatibles y responde una vez después de que termine la ejecución actual.
    - `interrupt` - cancela la ejecución actual y empieza de nuevo.

    Agrega opciones a los modos en cola como `debounce:0.5s cap:25 drop:summarize`. Consulta [Cola de comandos](/es/concepts/queue) y [Cola de dirección](/es/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Varios

<AccordionGroup>
  <Accordion title='¿Cuál es el modelo predeterminado para Anthropic con una clave de API?'>
    Las credenciales y la selección de modelo son independientes. Configurar `ANTHROPIC_API_KEY` (o guardar una clave de API de Anthropic en perfiles de autenticación) habilita la autenticación, pero el modelo predeterminado real es el que configures en `agents.defaults.model.primary` (por ejemplo, `anthropic/claude-sonnet-4-6` o `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` significa que el Gateway no pudo encontrar credenciales de Anthropic en el `auth-profiles.json` esperado para el agente en ejecución.
  </Accordion>
</AccordionGroup>

---

¿Aún tienes problemas? Pregunta en [Discord](https://discord.com/invite/clawd) o abre una [discusión de GitHub](https://github.com/openclaw/openclaw/discussions).

## Relacionado

- [Preguntas frecuentes de la primera ejecución](/es/help/faq-first-run) - instalación, incorporación, autenticación, suscripciones, errores iniciales
- [Preguntas frecuentes sobre modelos](/es/help/faq-models) - selección de modelo, conmutación por error, perfiles de autenticación
- [Solución de problemas](/es/help/troubleshooting) - triaje por síntomas
