---
read_when:
    - Respuesta a preguntas frecuentes de soporte sobre configuración, instalación, incorporación o entorno de ejecución
    - Clasificación de problemas informados por usuarios antes de una depuración más profunda
summary: Preguntas frecuentes sobre la instalación, la configuración y el uso de OpenClaw
title: Preguntas frecuentes
x-i18n:
    generated_at: "2026-07-12T14:36:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 80b94b9d403d04cde5c734927502393417d5f1bfd50c2505b6b4fdcfcdc9f524
    source_path: help/faq.md
    workflow: 16
---

Respuestas rápidas y solución de problemas más detallada para configuraciones reales (desarrollo local, VPS, múltiples agentes, OAuth/claves de API, conmutación por error de modelos). Para diagnósticos en tiempo de ejecución, consulta [Solución de problemas](/es/gateway/troubleshooting). Para ver la referencia completa de configuración, consulta [Configuración](/es/gateway/configuration).

## Primeros 60 segundos si algo no funciona

<Steps>
  <Step title="Estado rápido">
    ```bash
    openclaw status
    ```
    Resumen local rápido: SO + actualización, accesibilidad del gateway/servicio, agentes/sesiones, configuración del proveedor + problemas en tiempo de ejecución (cuando el gateway está accesible).
  </Step>
  <Step title="Informe que se puede pegar (seguro para compartir)">
    ```bash
    openclaw status --all
    ```
    Diagnóstico de solo lectura con las últimas líneas del registro (tokens ocultos).
  </Step>
  <Step title="Estado del daemon + puerto">
    ```bash
    openclaw gateway status
    ```
    Muestra el tiempo de ejecución del supervisor frente a la accesibilidad mediante RPC, la URL de destino de la comprobación y qué configuración probablemente utilizó el servicio.
  </Step>
  <Step title="Comprobaciones exhaustivas">
    ```bash
    openclaw status --deep
    ```
    Comprobación en vivo del estado del gateway, incluidas las comprobaciones de canales cuando sean compatibles (requiere un gateway accesible). Consulta [Estado](/es/gateway/health).
  </Step>
  <Step title="Seguir el registro más reciente">
    ```bash
    openclaw logs --follow
    ```
    Si RPC no está disponible, recurre a:
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    Los registros de archivos son independientes de los registros del servicio; consulta [Registro](/es/logging) y [Solución de problemas](/es/gateway/troubleshooting).
  </Step>
  <Step title="Ejecutar el doctor (reparaciones)">
    ```bash
    openclaw doctor
    ```
    Repara/migra la configuración y el estado, y después ejecuta comprobaciones de estado. Consulta [Doctor](/es/gateway/doctor).
  </Step>
  <Step title="Instantánea del Gateway (solo WS)">
    ```bash
    openclaw health --json
    openclaw health --verbose   # muestra la URL de destino + la ruta de configuración en caso de errores
    ```
    Solicita una instantánea completa al gateway en ejecución. Consulta [Estado](/es/gateway/health).
  </Step>
</Steps>

## Inicio rápido y configuración de la primera ejecución

Las preguntas y respuestas sobre la primera ejecución —instalación, incorporación, rutas de autenticación, suscripciones y errores iniciales— se encuentran en las [Preguntas frecuentes sobre la primera ejecución](/es/help/faq-first-run).

## ¿Qué es OpenClaw?

<AccordionGroup>
  <Accordion title="¿Qué es OpenClaw, en un párrafo?">
    OpenClaw es un asistente personal de IA que se ejecuta en tus propios dispositivos. Responde en las plataformas de mensajería que ya utilizas (Discord, Google Chat, iMessage, Mattermost, Signal, Slack, Telegram, WebChat, WhatsApp y plugins de canales incluidos, como QQ Bot) y también puede ofrecer voz junto con un Canvas en vivo en las plataformas compatibles. El **Gateway** es el plano de control siempre activo; el asistente es el producto.
  </Accordion>

  <Accordion title="Propuesta de valor">
    OpenClaw no es «solo un envoltorio para Claude». Es un **plano de control que prioriza la ejecución local** y ejecuta un asistente capaz en **tu propio hardware**, accesible desde las aplicaciones de chat que ya utilizas, con sesiones con estado, memoria y herramientas, sin entregar tus flujos de trabajo a un SaaS alojado.

    - **Tus dispositivos, tus datos**: ejecuta el Gateway donde quieras (Mac, Linux, VPS) y conserva localmente el espacio de trabajo y el historial de sesiones.
    - **Canales reales, no un entorno aislado web**: Discord/iMessage/Signal/Slack/Telegram/WhatsApp/etc., además de voz móvil y Canvas en las plataformas compatibles.
    - **Independiente del modelo**: utiliza Anthropic, MiniMax, OpenAI, OpenRouter, etc., con enrutamiento por agente y conmutación por error.
    - **Opción exclusivamente local**: ejecuta modelos locales para que todos los datos puedan permanecer en tu dispositivo.
    - **Enrutamiento multiagente**: utiliza agentes independientes por canal, cuenta o tarea, cada uno con su propio espacio de trabajo y valores predeterminados.
    - **Código abierto y modificable**: inspecciona, amplía y autoaloja el sistema sin dependencia de un proveedor.

    Documentación: [Gateway](/es/gateway), [Canales](/es/channels), [Multiagente](/es/concepts/multi-agent), [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="Acabo de configurarlo: ¿qué debería hacer primero?">
    Buenos primeros proyectos: crear un sitio web (WordPress, Shopify o un sitio estático); crear el prototipo de una aplicación móvil (esquema, pantallas, plan de API); organizar archivos y carpetas; conectar Gmail y automatizar resúmenes o seguimientos.

    Puede gestionar tareas grandes, pero funciona mejor si se dividen en fases con subagentes para realizar trabajo en paralelo.

  </Accordion>

  <Accordion title="¿Cuáles son los cinco principales casos de uso cotidiano de OpenClaw?">
    - **Informes personales**: resúmenes de la bandeja de entrada, el calendario y las noticias que te interesan.
    - **Investigación y redacción**: investigación rápida, resúmenes y primeros borradores de correos electrónicos o documentos.
    - **Recordatorios y seguimientos**: avisos y listas de comprobación activados mediante Cron o Heartbeat.
    - **Automatización del navegador**: completar formularios, recopilar datos y repetir tareas web.
    - **Coordinación entre dispositivos**: envía una tarea desde el teléfono, deja que el Gateway la ejecute en un servidor y recibe el resultado en el chat.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ayudar con la generación de clientes potenciales, la comunicación, los anuncios y los blogs de un SaaS?">
    Sí, para **investigación, cualificación y redacción**: analizar sitios, crear listas de candidatos, resumir clientes potenciales y redactar borradores de mensajes de contacto o textos publicitarios.

    Para **campañas de contacto o publicitarias**, mantén a una persona en el proceso. Evita el spam, cumple las leyes locales y las políticas de las plataformas, y revisa todo antes de enviarlo. Deja que OpenClaw redacte; tú apruebas.

    Documentación: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Cuáles son las ventajas frente a Claude Code para el desarrollo web?">
    OpenClaw es un **asistente personal** y una capa de coordinación, no un sustituto del IDE. Utiliza Claude Code o Codex para obtener el ciclo de programación directa más rápido dentro de un repositorio. Utiliza OpenClaw para disponer de memoria duradera, acceso entre dispositivos y orquestación de herramientas.

    - Memoria persistente y espacio de trabajo entre sesiones.
    - Acceso multiplataforma (Telegram, WhatsApp, TUI, WebChat).
    - Orquestación de herramientas (navegador, archivos, programación, hooks).
    - Gateway siempre activo (ejecútalo en un VPS e interactúa desde cualquier lugar).
    - Nodes para navegador/pantalla/cámara/ejecución locales.

    Ejemplos: [https://openclaw.ai/showcase](https://openclaw.ai/showcase).

  </Accordion>
</AccordionGroup>

## Skills y automatización

<AccordionGroup>
  <Accordion title="¿Cómo personalizo las Skills sin mantener sucio el repositorio?">
    Utiliza anulaciones administradas en lugar de editar la copia del repositorio. Coloca los cambios en `~/.openclaw/skills/<name>/SKILL.md` (o añade una carpeta mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json`). Precedencia: `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> incluidas -> `skills.load.extraDirs`, de modo que las anulaciones administradas prevalecen sobre las Skills incluidas sin modificar git. Para instalarlas globalmente pero limitar su visibilidad a determinados agentes, conserva la copia compartida en `~/.openclaw/skills` y controla la visibilidad mediante `agents.defaults.skills` / `agents.list[].skills`. Solo los cambios que merezcan incorporarse al proyecto original deben enviarse como PR al repositorio.
  </Accordion>

  <Accordion title="¿Puedo cargar Skills desde una carpeta personalizada?">
    Sí: añade directorios mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json` (la precedencia más baja en el orden anterior). `clawhub` instala de forma predeterminada en `./skills`, que OpenClaw trata como `<workspace>/skills` en la siguiente sesión. Para limitar la visibilidad a determinados agentes, combínalo con `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="¿Cómo puedo utilizar distintos modelos o ajustes para diferentes tareas?">
    Patrones compatibles:

    - **Trabajos de Cron**: los trabajos aislados pueden establecer una anulación de `model` para cada trabajo.
    - **Agentes**: enruta las tareas a agentes independientes con distintos modelos predeterminados, niveles de razonamiento y parámetros de transmisión.
    - **Cambio bajo demanda**: `/model` cambia el modelo de la sesión actual en cualquier momento.

    Ejemplo: mismo modelo, distintos ajustes por agente:

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

    Coloca los valores predeterminados compartidos por modelo en `agents.defaults.models["provider/model"].params` y, después, las anulaciones específicas del agente en `agents.list[].params` sin anidar. No dupliques el mismo modelo en `agents.list[].models["provider/model"].params` anidado; esa ruta se utiliza para el catálogo de modelos por agente y las anulaciones en tiempo de ejecución.

    Consulta [Trabajos de Cron](/es/automation/cron-jobs), [Enrutamiento multiagente](/es/concepts/multi-agent), [Configuración](/es/gateway/config-agents), [Comandos de barra](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="El bot se bloquea mientras realiza trabajo pesado. ¿Cómo puedo delegarlo?">
    Utiliza **subagentes** para tareas largas o paralelas: se ejecutan en su propia sesión, devuelven un resumen y mantienen el chat principal disponible. Pide al bot que «inicie un subagente para esta tarea» o utiliza `/subagents`. Utiliza `/status` para comprobar si el Gateway está ocupado en ese momento.

    Tanto las tareas largas como los subagentes consumen tokens; configura un modelo más económico para los subagentes mediante `agents.defaults.subagents.model` si el coste es importante.

    Documentación: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Cómo funcionan en Discord las sesiones de subagentes vinculadas a hilos?">
    Vincula un hilo de Discord a un subagente o destino de sesión para que los mensajes de seguimiento permanezcan en esa sesión vinculada.

    - Inicia con `sessions_spawn` utilizando `thread: true` (opcionalmente, `mode: "session"` para un seguimiento persistente).
    - O vincúlalo manualmente con `/focus <target>`.
    - `/agents` inspecciona el estado de vinculación.
    - `/session idle <duration|off>` y `/session max-age <duration|off>` controlan la desvinculación automática.
    - `/unfocus` desvincula el hilo.

    Configuración: `session.threadBindings.enabled` (interruptor global), `session.threadBindings.idleHours` (valor predeterminado `24`; `0` lo desactiva), `session.threadBindings.maxAgeHours` (valor predeterminado `0` = sin límite estricto) y anulaciones por canal `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`. `channels.discord.threadBindings.spawnSessions` controla la vinculación automática al iniciar una sesión (valor predeterminado `true`).

    Documentación: [Subagentes](/es/tools/subagents), [Discord](/es/channels/discord), [Referencia de configuración](/es/gateway/configuration-reference), [Comandos de barra](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagente terminó, pero la actualización de finalización se envió al lugar equivocado o nunca se publicó. ¿Qué debo comprobar?">
    Comprueba la ruta resuelta del solicitante:

    - La entrega de subagentes en modo de finalización prioriza una ruta de hilo o conversación vinculada cuando existe.
    - Si el origen de finalización solo contiene un canal, OpenClaw recurre a la ruta almacenada de la sesión del solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa todavía pueda realizarse correctamente.
    - Si no hay una ruta vinculada ni una ruta almacenada utilizable, la entrega directa puede fallar y el resultado pasa a la entrega en cola de la sesión en lugar de publicarse inmediatamente.
    - Los destinos no válidos u obsoletos también pueden forzar el uso de la cola o provocar un fallo definitivo de entrega.
    - Si la última respuesta visible del asistente secundario es exactamente `NO_REPLY` / `no_reply` o `ANNOUNCE_SKIP`, OpenClaw omite intencionadamente el anuncio en lugar de publicar avances anteriores obsoletos.

    Depuración: `openclaw tasks show <lookup>`, donde `<lookup>` es un identificador de tarea, un identificador de ejecución o una clave de sesión.

    Documentación: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks), [Herramientas de sesión](/es/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o los recordatorios no se ejecutan. ¿Qué debo comprobar?">
    Cron se ejecuta dentro del proceso del Gateway; no se activa si el Gateway no se ejecuta continuamente.

    - Confirma que Cron está habilitado (`cron.enabled`) y que `OPENCLAW_SKIP_CRON` no está establecido.
    - Confirma que el Gateway se ejecuta las 24 horas del día, los 7 días de la semana (sin suspensión ni reinicios).
    - Verifica la zona horaria del trabajo (`--tz` frente a la zona horaria del host).

    Depuración:
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentación: [Trabajos de Cron](/es/automation/cron-jobs), [Automatización](/es/automation).

  </Accordion>

  <Accordion title="Cron se ejecutó, pero no se envió nada al canal. ¿Por qué?">
    Compruebe el modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"`: no se espera ningún envío alternativo del ejecutor.
    - Destino de anuncio ausente o no válido (`channel` / `to`): el ejecutor omitió la entrega saliente.
    - Fallos de autenticación del canal (`unauthorized`, `Forbidden`): el ejecutor intentó realizar la entrega, pero las credenciales lo impidieron.
    - Un resultado aislado silencioso (solo `NO_REPLY` / `no_reply`) se considera intencionadamente no entregable, por lo que también se suprime la entrega alternativa en cola.

    En los trabajos Cron aislados, el agente puede seguir enviando directamente con la herramienta `message` cuando haya disponible una ruta de chat. `--announce` solo controla la entrega alternativa del ejecutor para el texto final que el agente no haya enviado ya por sí mismo.

    Depuración:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Por qué una ejecución aislada de Cron cambió de modelo o volvió a intentarlo una vez?">
    Esa es la ruta de cambio de modelo en vivo, no una programación duplicada. Cron aislado conserva una transferencia del modelo en tiempo de ejecución y vuelve a intentarlo cuando la ejecución activa genera `LiveSessionModelSwitchError`, manteniendo el proveedor/modelo cambiado (y cualquier sustitución del perfil de autenticación que se haya cambiado) antes de reintentar.

    Precedencia de selección del modelo: primero, la sustitución del modelo del enlace de Gmail (`hooks.gmail.model`); después, el `model` de cada trabajo; luego, cualquier sustitución almacenada del modelo de la sesión de Cron; y, por último, la selección normal del modelo predeterminado o del agente.

    El bucle de reintentos está limitado al intento inicial más 2 reintentos por cambio; después, Cron se interrumpe en lugar de continuar indefinidamente.

    Depuración:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [CLI de Cron](/es/cli/cron).

  </Accordion>

  <Accordion title="¿Cómo instalo Skills en Linux?">
    Utilice los comandos nativos `openclaw skills` o coloque las Skills en su espacio de trabajo; la interfaz de Skills de macOS no está disponible en Linux. Explore Skills en [https://clawhub.ai](https://clawhub.ai).

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

    De forma predeterminada, el comando nativo `openclaw skills install` escribe en el directorio `skills/` del espacio de trabajo activo. Añada `--global` para instalar en el directorio compartido de Skills administradas para todos los agentes locales. Instale la CLI `clawhub` por separado solo para publicar o sincronizar sus propias Skills. Utilice `agents.defaults.skills` o `agents.list[].skills` para limitar qué agentes ven las Skills compartidas.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ejecutar tareas de forma programada o continuamente en segundo plano?">
    Sí, mediante el programador del Gateway:

    - **Trabajos Cron** para tareas programadas o recurrentes (se conservan entre reinicios).
    - **Heartbeat** para comprobaciones periódicas de la sesión principal.
    - **Trabajos aislados** para agentes autónomos que publican resúmenes o realizan entregas en chats.

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [Automatización](/es/automation), [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title="¿Puedo ejecutar desde Linux Skills exclusivas de Apple macOS?">
    No directamente. Las Skills de macOS están condicionadas por `metadata.openclaw.os` y por los binarios requeridos, y solo se cargan cuando son aptas en el **host del Gateway**. En Linux, las Skills exclusivas de `darwin` (`apple-notes`, `apple-reminders`, `things-mac`) no se cargarán a menos que se sustituya esa restricción.

    Tres patrones compatibles:

    **Opción A: ejecutar el Gateway en un Mac (la más sencilla)**. Ejecute el Gateway donde existan los binarios de macOS y, después, conéctese desde Linux en [modo remoto](#gateway-ports-already-running-and-remote-mode) o mediante Tailscale. Las Skills se cargan normalmente porque el host del Gateway es macOS.

    **Opción B: utilizar un Node de macOS (sin SSH)**. Ejecute el Gateway en Linux, empareje un Node de macOS (aplicación de la barra de menús) y establezca **Node Run Commands** en "Always Ask" o "Always Allow" en el Mac. OpenClaw considera aptas las Skills exclusivas de macOS cuando los binarios requeridos existen en el Node; el agente las ejecuta mediante la herramienta `nodes`. Con "Always Ask", aprobar "Always Allow" en el mensaje añade ese comando a la lista de permitidos.

    **Opción C: utilizar binarios de macOS mediante un proxy SSH (avanzado)**. Mantenga el Gateway en Linux, pero haga que los binarios de la CLI requeridos se resuelvan mediante envoltorios SSH que se ejecuten en un Mac y, después, sustituya la configuración de la Skill para permitir Linux y mantenerla apta.

    1. Cree un envoltorio SSH para el binario (ejemplo: `memo` para Apple Notes):
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. Coloque el envoltorio en el `PATH` del host Linux (por ejemplo, `~/bin/memo`).
    3. Sustituya los metadatos de la Skill (en el espacio de trabajo o en `~/.openclaw/skills`) para permitir Linux:
       ```markdown
       ---
       name: apple-notes
       description: Gestiona Apple Notes mediante la CLI memo en macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```
    4. Inicie una sesión nueva para actualizar la instantánea de Skills.

  </Accordion>

  <Accordion title="¿Existe una integración con Notion o HeyGen?">
    Actualmente no está integrada. Opciones:

    - **Skill / Plugin personalizado**: la mejor opción para obtener un acceso fiable a la API (ambos disponen de API).
    - **Automatización del navegador**: funciona sin código, pero es más lenta y frágil.

    Para disponer de contexto por cliente al estilo de una agencia: mantenga una página de Notion por cliente (contexto + preferencias + trabajo activo) y solicite al agente que recupere esa página al inicio de una sesión.

    Para obtener una integración nativa, abra una solicitud de funcionalidad o cree una Skill basada en esas API.

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Las instalaciones nativas se guardan en el directorio `skills/` del espacio de trabajo activo; utilice `--global` para todos los agentes locales o configure `agents.defaults.skills` / `agents.list[].skills` para limitar la visibilidad. Algunas Skills requieren binarios instalados mediante Homebrew; en Linux, esto implica Linuxbrew.

    Consulte [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config), [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="¿Cómo utilizo con OpenClaw mi sesión existente de Chrome?">
    Utilice el perfil de navegador `user` integrado, que se conecta mediante Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Para utilizar un nombre personalizado, cree un perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Se puede utilizar el navegador del host local o un Node de navegador conectado. Si el Gateway se ejecuta en otro lugar, ejecute un host de Node en el equipo del navegador o utilice CDP remoto.

    Limitaciones actuales de los perfiles `existing-session` / `user` en comparación con el perfil `openclaw` administrado:

    - `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren referencias de instantáneas, no selectores CSS.
    - Los enlaces de carga requieren `ref` o `inputRef`, un archivo cada vez, sin `element` CSS.
    - `responsebody`, la exportación a PDF, la interceptación de descargas y las acciones por lotes siguen requiriendo la ruta del navegador administrado.

    Consulte [Navegador](/es/tools/browser#existing-session-via-chrome-devtools-mcp) para ver la comparación completa.

  </Accordion>
</AccordionGroup>

## Aislamiento y memoria

<AccordionGroup>
  <Accordion title="¿Existe documentación específica sobre el aislamiento?">
    Sí: [Aislamiento](/es/gateway/sandboxing). Para la configuración específica de Docker (Gateway completo en Docker o imágenes de entorno aislado), consulte [Docker](/es/install/docker).
  </Accordion>

  <Accordion title="Docker parece limitado: ¿cómo habilito todas las funciones?">
    La imagen predeterminada prioriza la seguridad y se ejecuta como el usuario `node`, por lo que excluye paquetes del sistema, Homebrew y navegadores incluidos. Para obtener una configuración más completa:

    - Conserve `/home/node` con `OPENCLAW_HOME_VOLUME` para que las cachés persistan.
    - Incorpore las dependencias del sistema en la imagen con `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Instale los navegadores de Playwright mediante la CLI incluida: `node /app/node_modules/playwright-core/cli.js install chromium`.
    - Establezca `PLAYWRIGHT_BROWSERS_PATH` y conserve esa ruta.

    Documentación: [Docker](/es/install/docker), [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Puedo mantener privados los mensajes directos y hacer públicos o aislados los grupos con un solo agente?">
    Sí, si el tráfico privado son **mensajes directos** y el tráfico público son **grupos**. Establezca `agents.defaults.sandbox.mode: "non-main"` para que las sesiones de grupo/canal (claves no principales) se ejecuten en el backend de aislamiento configurado mientras la sesión principal de mensajes directos permanece en el host. Docker es el backend predeterminado una vez habilitado el aislamiento. Restrinja las herramientas disponibles en las sesiones aisladas mediante `tools.sandbox.tools`.

    Guía de configuración: [Grupos: mensajes directos personales + grupos públicos](/es/channels/groups#pattern-personal-dms-public-groups-single-agent). Referencia clave: [Configuración del Gateway](/es/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="¿Cómo vinculo una carpeta del host con el entorno aislado?">
    Establezca `agents.defaults.sandbox.docker.binds` en `["host:container:mode"]` (por ejemplo, `"/home/user/src:/src:ro"`). Los enlaces globales y por agente se combinan; los enlaces por agente se ignoran cuando se utiliza `scope: "shared"`. Utilice `:ro` para cualquier elemento sensible; los enlaces omiten las barreras del sistema de archivos del entorno aislado.

    OpenClaw valida los orígenes de los enlaces tanto con la ruta normalizada como con la ruta canónica resuelta a través del ancestro existente más profundo, por lo que los escapes mediante un enlace simbólico principal se rechazan de forma segura incluso cuando el segmento final de la ruta aún no existe.

    Consulte [Aislamiento](/es/gateway/sandboxing#custom-bind-mounts) y [Entorno aislado frente a política de herramientas frente a privilegios elevados](/es/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="¿Cómo funciona la memoria?">
    La memoria de OpenClaw consiste en archivos Markdown del espacio de trabajo del agente: notas diarias en `memory/YYYY-MM-DD.md` y notas seleccionadas a largo plazo en `MEMORY.md` (solo para sesiones principales/privadas).

    OpenClaw también ejecuta silenciosamente un **vaciado de memoria previo a la Compaction** antes de que la Compaction resuma la conversación, lo que recuerda al modelo que debe escribir primero las notas duraderas. Solo se ejecuta cuando se puede escribir en el espacio de trabajo (los entornos aislados de solo lectura lo omiten); desactívelo con `agents.defaults.compaction.memoryFlush.enabled: false`. Consulte [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="La memoria sigue olvidando cosas. ¿Cómo hago que las conserve?">
    Pida al bot que **escriba el dato en la memoria**: las notas a largo plazo se guardan en `MEMORY.md` y el contexto a corto plazo en `memory/YYYY-MM-DD.md`. Recordar al modelo que almacene los recuerdos suele resolver el problema. Si sigue olvidándolos, verifique que el Gateway utilice el mismo espacio de trabajo en cada ejecución.

    Documentación: [Memoria](/es/concepts/memory), [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿La memoria persiste para siempre? ¿Cuáles son los límites?">
    Los archivos de memoria residen en el disco y persisten hasta que se eliminan; el límite es el almacenamiento, no el modelo. El **contexto de la sesión** sigue estando limitado por la ventana de contexto del modelo, por lo que las conversaciones largas pueden compactarse o truncarse; por eso existe la búsqueda en memoria, que vuelve a incorporar al contexto únicamente las partes pertinentes.

    Documentación: [Memoria](/es/concepts/memory), [Contexto](/es/concepts/context).

  </Accordion>

  <Accordion title="¿La búsqueda semántica en memoria requiere una clave de API de OpenAI?">
    Solo si utiliza **incrustaciones de OpenAI**, que es el proveedor predeterminado. OAuth de Codex cubre el chat y las finalizaciones, pero **no** concede acceso a las incrustaciones, por lo que iniciar sesión con Codex (mediante OAuth o el inicio de sesión de la CLI de Codex) no habilita la búsqueda semántica en memoria. Las incrustaciones de OpenAI siguen necesitando una clave de API real (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Para mantener todo en local, establece `agents.defaults.memorySearch.provider: "local"` (GGUF/llama.cpp). Otros proveedores compatibles: Bedrock, DeepInfra, Gemini (`GEMINI_API_KEY` o `memorySearch.remote.apiKey`), GitHub Copilot, LM Studio, Mistral, Ollama, compatible con OpenAI y Voyage. Consulta [Memoria](/es/concepts/memory) y [Búsqueda en memoria](/es/concepts/memory-search) para obtener información detallada sobre la configuración.

  </Accordion>
</AccordionGroup>

## Dónde se almacenan los elementos en el disco

<AccordionGroup>
  <Accordion title="¿Se guardan localmente todos los datos utilizados con OpenClaw?">
    No: **el estado propio de OpenClaw es local**, pero **los servicios externos siguen viendo lo que se les envía**.

    - **Local de forma predeterminada**: las sesiones, los archivos de memoria, la configuración y el espacio de trabajo se encuentran en el host del Gateway (`~/.openclaw` más el directorio del espacio de trabajo).
    - **Remoto por necesidad**: los mensajes enviados a proveedores de modelos (Anthropic/OpenAI/etc.) van a sus API, y las plataformas de chat (Slack/Telegram/WhatsApp/etc.) almacenan los datos de los mensajes en sus servidores.
    - **Se puede controlar el alcance**: los modelos locales mantienen los prompts en el equipo, pero el tráfico del canal sigue pasando por los servidores del canal.

    Temas relacionados: [Espacio de trabajo del agente](/es/concepts/agent-workspace), [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Dónde almacena OpenClaw sus datos?">
    Todo se encuentra en `$OPENCLAW_STATE_DIR` (valor predeterminado: `~/.openclaw`):

    | Ruta                                                               | Propósito                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | Configuración principal (JSON5)                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | Importación de OAuth heredada (se copia en los perfiles de autenticación durante el primer uso)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | Perfiles de autenticación (OAuth, claves de API, `keyRef`/`tokenRef` opcionales)        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | Carga útil de secretos opcional respaldada por archivos para proveedores SecretRef de `file`   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | Archivo de compatibilidad heredado (se eliminan las entradas estáticas `api_key`)        |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | Estado del proveedor (por ejemplo, `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | Estado por agente (agentDir + artefactos de sesión heredados/archivados)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`  | Estado de SQLite por agente, incluidas las filas de sesiones y las transcripciones      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | Fuentes de migración de sesiones heredadas y artefactos de archivo/soporte      |

    `openclaw doctor` migra la ruta heredada de agente único `~/.openclaw/agent/*`.

    El **espacio de trabajo** (AGENTS.md, archivos de memoria, Skills, etc.) es independiente y se configura mediante `agents.defaults.workspace` (valor predeterminado: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="¿Dónde deben estar AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Estos archivos se encuentran en el **espacio de trabajo del agente**, no en `~/.openclaw`.

    - **Espacio de trabajo (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `memory/YYYY-MM-DD.md` y, opcionalmente, `HEARTBEAT.md`. El archivo heredado `memory.md` en minúsculas en la raíz solo sirve como entrada de reparación; `openclaw doctor --fix` puede combinarlo con `MEMORY.md` cuando ambos existen.
    - **Directorio de estado (`~/.openclaw`)**: configuración, estado de canales/proveedores, perfiles de autenticación, sesiones, registros y Skills compartidas (`~/.openclaw/skills`).

    El espacio de trabajo predeterminado es `~/.openclaw/workspace` y se puede configurar:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si el bot «olvida» después de reiniciarse, confirma que el Gateway utilice el mismo espacio de trabajo en cada inicio (el modo remoto utiliza el espacio de trabajo **del host del Gateway**, no el del equipo portátil local).

    Consejo: para que un comportamiento o una preferencia sean duraderos, pide al bot que **los escriba en AGENTS.md o MEMORY.md** en lugar de depender del historial del chat.

    Consulta [Espacio de trabajo del agente](/es/concepts/agent-workspace) y [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Puedo ampliar SOUL.md?">
    Sí. `SOUL.md` es uno de los archivos de arranque del espacio de trabajo que se insertan en el contexto del agente. El límite de inserción predeterminado por archivo es de `20000` caracteres; el presupuesto total de arranque para todos los archivos es de `60000` caracteres.

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

    También se pueden sobrescribir para un agente en `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars`.

    Utiliza `/context` para comprobar los tamaños sin procesar frente a los insertados y si se produjo algún truncamiento. Mantén `SOUL.md` centrado en la voz, la postura y la personalidad; coloca las reglas operativas en `AGENTS.md` y los datos duraderos en la memoria.

    Consulta [Contexto](/es/concepts/context) y [Configuración del agente](/es/gateway/config-agents).

  </Accordion>

  <Accordion title="Estrategia de copia de seguridad recomendada">
    Coloque su **espacio de trabajo del agente** en un repositorio git **privado** y haga una copia de seguridad en una ubicación privada (por ejemplo, un repositorio privado de GitHub). Esto conserva la memoria junto con los archivos AGENTS/SOUL/USER y permite restaurar la «mente» del asistente posteriormente.

    **No** confirme nada que se encuentre en `~/.openclaw` (credenciales, sesiones, tokens, cargas de secretos cifrados). Para realizar una restauración completa, haga copias de seguridad del espacio de trabajo y del directorio de estado por separado.

    Documentación: [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿Cómo desinstalo OpenClaw por completo?">
    Consulte [Desinstalación](/es/install/uninstall).
  </Accordion>

  <Accordion title="¿Pueden los agentes trabajar fuera del espacio de trabajo?">
    Sí. El espacio de trabajo es el **directorio de trabajo actual predeterminado** y el punto de referencia de la memoria, no un entorno aislado estricto. Las rutas relativas se resuelven dentro del espacio de trabajo; las rutas absolutas pueden acceder a otras ubicaciones del host, a menos que se habilite el aislamiento. Para lograr aislamiento, use [`agents.defaults.sandbox`](/es/gateway/sandboxing) o la configuración de aislamiento de cada agente. Para convertir un repositorio en el directorio de trabajo predeterminado, establezca el valor `workspace` de ese agente en la raíz del repositorio; el repositorio de OpenClaw en sí solo contiene código fuente, por lo que se debe mantener separado del espacio de trabajo, salvo que se desee deliberadamente que el agente trabaje dentro de él.

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

  <Accordion title="Modo remoto: ¿dónde se encuentra el almacén de sesiones?">
    El estado de las sesiones pertenece al **host del Gateway**. En el modo remoto, el almacén de sesiones relevante se encuentra en la máquina remota, no en el equipo portátil local. Consulte [Administración de sesiones](/es/concepts/session).
  </Accordion>
</AccordionGroup>

## Conceptos básicos de configuración

<AccordionGroup>
  <Accordion title="¿Qué formato tiene la configuración? ¿Dónde se encuentra?">
    OpenClaw lee una configuración **JSON5** opcional desde `$OPENCLAW_CONFIG_PATH` (valor predeterminado: `~/.openclaw/openclaw.json`). Si el archivo no existe, utiliza valores predeterminados razonablemente seguros, incluido un espacio de trabajo predeterminado en `~/.openclaw/workspace`.
  </Accordion>

  <Accordion title='He establecido gateway.bind: "lan" (o "tailnet") y ahora no hay ningún proceso escuchando o la interfaz indica que no hay autorización'>
    Los enlaces que no sean de bucle invertido **requieren una ruta válida de autenticación del Gateway**: autenticación mediante secreto compartido (token o contraseña), o `gateway.auth.mode: "trusted-proxy"` detrás de un proxy inverso con reconocimiento de identidad configurado correctamente.

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

    - `gateway.remote.token` / `.password` **no** habilitan por sí mismos la autenticación del gateway local; las rutas de llamadas locales pueden usar `gateway.remote.*` como alternativa solo cuando `gateway.auth.*` no está configurado.
    - Para la autenticación mediante contraseña, configure `gateway.auth.mode: "password"` junto con `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Si `gateway.auth.token` / `.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución falla de forma cerrada (sin que la alternativa remota oculte el fallo).
    - Las configuraciones de la interfaz de control con secreto compartido se autentican mediante `connect.params.auth.token` o `connect.params.auth.password` (almacenados en la configuración de la aplicación/interfaz). Los modos basados en identidad, como Tailscale Serve o `trusted-proxy`, usan en su lugar encabezados de solicitud; evite incluir secretos compartidos en las URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, los proxies inversos de bucle invertido en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito y una entrada de bucle invertido en `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="¿Por qué ahora necesito un token en localhost?">
    OpenClaw aplica de forma predeterminada la autenticación del gateway, incluido el bucle invertido. Si no se configura una ruta de autenticación explícita, al iniciarse se selecciona el modo de token y se genera un token exclusivo del entorno de ejecución para ese inicio, por lo que los clientes WS locales deben autenticarse. Esto impide que otros procesos locales realicen llamadas al Gateway.

    Configure explícitamente `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` o `OPENCLAW_GATEWAY_PASSWORD` cuando los clientes necesiten un secreto estable entre reinicios. También puede elegir el modo de contraseña o `trusted-proxy` para proxies inversos con reconocimiento de identidad. Para permitir el bucle invertido abierto, configure explícitamente `gateway.auth.mode: "none"`. `openclaw doctor --generate-gateway-token` genera un token en cualquier momento.

  </Accordion>

  <Accordion title="¿Tengo que reiniciar después de cambiar la configuración?">
    El Gateway supervisa la configuración y admite la recarga en caliente: `gateway.reload.mode: "hybrid"` (valor predeterminado) aplica en caliente los cambios seguros y reinicia cuando hay cambios críticos. También se admiten `hot`, `restart` y `off`. La mayoría de los cambios en `tools.*`, las políticas de `agents.*`, `session.*` y `messages.*` se aplican inmediatamente sin ninguna acción de recarga; los cambios de enlace o puerto en `gateway.*` requieren un reinicio.
  </Accordion>

  <Accordion title="¿Cómo desactivo los eslóganes graciosos de la CLI?">
    Configure `cli.banner.taglineMode`:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: oculta el texto del eslogan, pero mantiene la línea del título y la versión del banner.
    - `default`: siempre usa `All your chats, one OpenClaw.`.
    - `random`: eslóganes graciosos o de temporada que van rotando (comportamiento predeterminado).
    - Para no mostrar ningún banner, configure la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="¿Cómo habilito la búsqueda web (y la obtención de contenido web)?">
    `web_fetch` funciona sin una clave de API. `web_search` depende del proveedor seleccionado:

    | Proveedor | Sin clave | Variable(s) de entorno |
    | --- | --- | --- |
    | Brave | No | `BRAVE_API_KEY` |
    | DuckDuckGo | Sí (implementación no oficial basada en HTML) | - |
    | Exa | No | `EXA_API_KEY` |
    | Firecrawl | No | `FIRECRAWL_API_KEY` |
    | Gemini | No | `GEMINI_API_KEY` |
    | Grok | No (OAuth de xAI o clave) | `XAI_API_KEY` |
    | Kimi | No | `KIMI_API_KEY` o `MOONSHOT_API_KEY` |
    | MiniMax Search | No | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY` |
    | Ollama Web Search | Sí (requiere `ollama signin`) | - |
    | Perplexity | No | `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY` |
    | SearXNG | Sí (autoalojado) | `SEARXNG_BASE_URL` |
    | Tavily | No | `TAVILY_API_KEY` |

    Grok también puede reutilizar el OAuth de xAI de la autenticación del modelo (`openclaw onboard --auth-choice xai-oauth`).

    **Recomendado**: ejecute `openclaw configure --section web` y elija un proveedor.

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
    ```
    ```json5
        web: {
          search: {
            enabled: true,
            provider: "brave",
            maxResults: 5,
          },
          fetch: {
    ```
    ```json5
            enabled: true,
    ```
    ```json5
            provider: "firecrawl", // opcional; omítalo para la detección automática
    ```
    ```json5
          },
    ```
    ```json5
        },
      },
    }
    ```
    La configuración de búsqueda web específica del proveedor se encuentra en `plugins.entries.<plugin>.config.webSearch.*`. Las rutas heredadas del proveedor `tools.web.search.*` siguen cargándose por compatibilidad, pero no deben usarse en configuraciones nuevas. La configuración de respaldo de obtención web de Firecrawl se encuentra en `plugins.entries.firecrawl.config.webFetch.*`.

    - Listas de permitidos: añade `web_search`/`web_fetch`/`x_search`, o `group:web` para las tres.
    - `web_fetch` está habilitado de forma predeterminada.
    - Si se omite `tools.web.fetch.provider`, OpenClaw detecta automáticamente el primer proveedor alternativo de obtención que esté listo según las credenciales disponibles; el Plugin oficial de Firecrawl proporciona esa alternativa.
    - Los demonios leen las variables de entorno de `~/.openclaw/.env` (o del entorno del servicio).

    Documentación: [Herramientas web](/es/tools/web).

  </Accordion>

  <Accordion title="config.apply borró mi configuración. ¿Cómo puedo recuperarla y evitar que vuelva a ocurrir?">
    `config.apply` reemplaza la **configuración completa**; un objeto parcial elimina todo lo demás.

    La versión actual de OpenClaw protege contra la mayoría de las sobrescrituras accidentales:

    - Las escrituras de configuración gestionadas por OpenClaw validan toda la configuración resultante antes de escribirla.
    - Las escrituras no válidas o destructivas gestionadas por OpenClaw se rechazan y se guardan como `openclaw.json.rejected.*`.
    - Una edición directa que impida el inicio o la recarga en caliente hace que el Gateway se cierre de forma segura o que omita la recarga; no reescribe `openclaw.json`.
    - `openclaw doctor --fix` se encarga de la reparación, puede restaurar la última configuración válida conocida y guarda el archivo rechazado como `openclaw.json.clobbered.*`.

    Recuperación:

    - Consulta `openclaw logs --follow` para detectar `Invalid config at`, `Config write rejected:` o `config reload skipped (invalid config)`.
    - Inspecciona el archivo `openclaw.json.clobbered.*` o `openclaw.json.rejected.*` más reciente junto a la configuración activa.
    - Ejecuta `openclaw config validate` y `openclaw doctor --fix`.
    - Vuelve a copiar únicamente las claves previstas con `openclaw config set` o `config.patch`.
    - Si no hay una última configuración válida conocida ni una carga útil rechazada: restaura desde una copia de seguridad, o vuelve a ejecutar `openclaw doctor` y reconfigura los canales/modelos.
    - Ante una pérdida inesperada: informa de un error e incluye la última configuración conocida o una copia de seguridad. Un agente de programación local a menudo puede reconstruir una configuración funcional a partir de los registros o el historial.

    Para evitarlo: usa `openclaw config set` para cambios pequeños, `openclaw configure` para ediciones interactivas, `config.schema.lookup` para inspeccionar una ruta desconocida (devuelve un nodo de esquema superficial junto con resúmenes de sus elementos secundarios inmediatos) y `config.patch` para ediciones RPC parciales; reserva `config.apply` para reemplazar la configuración completa. La herramienta de tiempo de ejecución `gateway` destinada a agentes se niega a reescribir `tools.exec.ask` / `tools.exec.security`, incluso mediante los alias heredados `tools.bash.*`.

    Documentación: [Configuración](/es/cli/config), [Configurar](/es/cli/configure), [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Cómo ejecuto un Gateway central con trabajadores especializados distribuidos entre varios dispositivos?">
    Patrón habitual: **un Gateway** (por ejemplo, una Raspberry Pi), además de **nodos** y **agentes**.

    - **Gateway (central)**: administra los canales (Signal/WhatsApp), el enrutamiento y las sesiones.
    - **Nodos (dispositivos)**: los dispositivos Mac/iOS/Android se conectan como periféricos y exponen herramientas locales (`system.run`, `canvas`, `camera`).
    - **Agentes (trabajadores)**: cerebros/espacios de trabajo independientes para funciones especializadas (por ejemplo, operaciones frente a datos personales).
    - **Subagentes**: inician trabajo en segundo plano desde un agente principal para ejecutarlo en paralelo.
    - **TUI**: se conecta al Gateway y permite cambiar de agente o sesión.

    Documentación: [Nodos](/es/nodes), [Acceso remoto](/es/gateway/remote), [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [TUI](/es/web/tui).

  </Accordion>

  <Accordion title="¿Puede el navegador de OpenClaw ejecutarse en modo headless?">
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

    El valor predeterminado es `false` (con interfaz gráfica). El modo headless tiene más probabilidades de activar comprobaciones contra bots en algunos sitios (X/Twitter suele bloquear las sesiones headless). Utiliza el mismo motor Chromium y funciona para la mayoría de las automatizaciones; la principal diferencia es que no hay una ventana visible del navegador (utilice capturas de pantalla para el contenido visual). Consulte [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Cómo utilizo Brave para controlar el navegador?">
    Establezca `browser.executablePath` en el binario de Brave (o de cualquier navegador basado en Chromium) y reinicie el Gateway. Consulte [Navegador](/es/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways y nodos remotos

<AccordionGroup>
  <Accordion title="¿Cómo se propagan los comandos entre Telegram, el Gateway y los nodos?">
    Los mensajes de Telegram son procesados por el **Gateway**, que ejecuta el agente y solo entonces llama a los nodos mediante el **WebSocket del Gateway** cuando se necesita una herramienta de nodo:

    Telegram -> Gateway -> Agente -> `node.*` -> Nodo -> Gateway -> Telegram

    Los nodos no ven el tráfico entrante del proveedor; solo reciben llamadas RPC de nodo.

  </Accordion>

  <Accordion title="¿Cómo puede mi agente acceder a mi equipo si el Gateway está alojado de forma remota?">
    Empareje su equipo como un **nodo**. El Gateway se ejecuta en otro lugar, pero puede llamar a las herramientas `node.*` (pantalla, cámara, sistema) en su máquina local mediante el WebSocket del Gateway.

    1. Ejecute el Gateway en el host que permanece siempre encendido (VPS/servidor doméstico).
    2. Conecte el host del Gateway y su equipo a la misma tailnet.
    3. Asegúrese de que el WS del Gateway sea accesible (vinculación a la tailnet o túnel SSH).
    4. Abra localmente la aplicación de macOS y conéctese en el modo **Remote over SSH** (o directamente mediante la tailnet) para que se registre como nodo.
    5. Apruebe el nodo:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    No se requiere un puente TCP independiente; los nodos se conectan mediante el WebSocket del Gateway.

    Recordatorio de seguridad: emparejar un nodo macOS permite ejecutar `system.run` en esa máquina. Empareje únicamente dispositivos de confianza; consulte [Seguridad](/es/gateway/security).

    Documentación: [Nodos](/es/nodes), [Protocolo del Gateway](/es/gateway/protocol), [Modo remoto de macOS](/es/platforms/mac/remote), [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="Tailscale está conectado, pero no recibo respuestas. ¿Qué hago ahora?">
    Compruebe lo básico:

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    Después, verifique la autenticación y el enrutamiento: si usa Tailscale Serve, confirme que `gateway.auth.allowTailscale` esté configurado correctamente; si se conecta mediante un túnel SSH, confirme que el túnel esté activo y apunte al puerto correcto; confirme que las listas de permitidos de mensajes directos/grupos incluyan su cuenta.

    Documentación: [Tailscale](/es/gateway/tailscale), [Acceso remoto](/es/gateway/remote), [Canales](/es/channels).

  </Accordion>

  <Accordion title="¿Pueden comunicarse dos instancias de OpenClaw entre sí (local + VPS)?">
    Sí, aunque no existe un puente integrado entre bots.

    **La opción más sencilla**: use un canal de chat normal al que ambos bots puedan acceder (Slack/Telegram/WhatsApp). Haga que el Bot A envíe un mensaje al Bot B y deje que el Bot B responda de la forma habitual.

    **Puente mediante CLI (genérico)**: ejecute un script que llame al otro Gateway con `openclaw agent --message ... --deliver`, dirigido a un chat en el que escuche el otro bot. Si uno de los bots está en un VPS remoto, apunte su CLI a ese Gateway remoto mediante SSH/Tailscale (consulte [Acceso remoto](/es/gateway/remote)):

    ```bash
    openclaw agent --message "Hola desde el bot local" --deliver --channel telegram --reply-to <chat-id>
    ```

    Añada una medida de protección para que los dos bots no entren en un bucle infinito (solo menciones, listas de canales permitidos o una regla de «no responder a mensajes de bots»).

    Documentación: [Acceso remoto](/es/gateway/remote), [CLI del agente](/es/cli/agent), [Envío del agente](/es/tools/agent-send).

  </Accordion>

  <Accordion title="¿Necesito VPS separados para varios agentes?">
    No. Un Gateway aloja varios agentes, cada uno con su propio espacio de trabajo, valores predeterminados del modelo y enrutamiento; esta es la configuración habitual y resulta mucho más económica y sencilla que usar un VPS por agente. Use VPS separados únicamente para lograr un aislamiento estricto (límites de seguridad) o para configuraciones muy diferentes que no quiera compartir.
  </Accordion>

  <Accordion title="¿Hay alguna ventaja en usar un Node en mi portátil personal en lugar de SSH desde un VPS?">
    Sí: los nodos son la forma de primera clase de acceder a su portátil desde un Gateway remoto y permiten mucho más que el acceso al shell. El Gateway se ejecuta en macOS/Linux (Windows mediante WSL2) y consume pocos recursos (basta con un VPS pequeño o un equipo de la categoría de Raspberry Pi; 4 GB de RAM son suficientes), por lo que una configuración habitual consiste en un host siempre activo y su portátil como Node.

    - **No se requiere SSH entrante**: los nodos se conectan al WebSocket del Gateway mediante el emparejamiento de dispositivos.
    - **Controles de ejecución más seguros**: `system.run` está restringido mediante listas de permitidos/aprobaciones del Node en ese portátil.
    - **Más herramientas del dispositivo**: además de `system.run`, los nodos exponen `canvas`, `camera` y `screen`.
    - **Automatización local del navegador**: mantenga el Gateway en un VPS, pero ejecute Chrome localmente mediante un host Node, o conéctese al Chrome local mediante Chrome MCP.

    SSH es adecuado para el acceso ocasional al shell; los nodos son más sencillos para los flujos de trabajo continuos de agentes y la automatización de dispositivos.

    Documentación: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes), [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Los nodos ejecutan un servicio de Gateway?">
    No. Solo debe ejecutarse **un Gateway** por host, a menos que ejecute intencionadamente perfiles aislados (consulte [Varios Gateways](/es/gateway/multiple-gateways)). Los nodos son periféricos que se conectan al Gateway (nodos iOS/Android o el «modo Node» de macOS en la aplicación de la barra de menús). Para hosts Node sin interfaz gráfica y control mediante CLI, consulte [CLI del host Node](/es/cli/node).

    Se requiere un reinicio completo para los cambios en `gateway`, `discovery` y las superficies de plugins alojados.

  </Accordion>

  <Accordion title="¿Existe alguna forma de aplicar la configuración mediante API/RPC?">
    Sí:

    - `config.schema.lookup`: inspecciona un subárbol de configuración con su nodo de esquema superficial, la sugerencia de interfaz coincidente y los resúmenes de los elementos secundarios inmediatos antes de escribir.
    - `config.get`: obtiene la instantánea actual junto con su hash.
    - `config.patch`: actualización parcial segura (preferida para la mayoría de las ediciones mediante RPC); aplica una recarga en caliente cuando es posible y reinicia cuando es necesario.
    - `config.apply`: valida y reemplaza la configuración completa; aplica una recarga en caliente cuando es posible y reinicia cuando es necesario.
    - La herramienta de ejecución `gateway` orientada al agente sigue rechazando la reescritura de `tools.exec.ask` / `tools.exec.security`; los alias heredados `tools.bash.*` se normalizan a las mismas rutas protegidas.

  </Accordion>

  <Accordion title="Configuración mínima razonable para una primera instalación">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Establece su espacio de trabajo y restringe quién puede activar el bot.

  </Accordion>

  <Accordion title="¿Cómo configuro Tailscale en un VPS y me conecto desde mi Mac?">
    1. **Instale Tailscale e inicie sesión en el VPS**:
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. **Instale Tailscale e inicie sesión en su Mac** mediante la aplicación de Tailscale, en la misma tailnet.
    3. **Active MagicDNS** en la consola de administración de Tailscale para que el VPS tenga un nombre estable.
    4. **Use el nombre de host de la tailnet**: SSH `ssh user@your-vps.tailnet-xxxx.ts.net`; WS del Gateway `ws://your-vps.tailnet-xxxx.ts.net:18789`.

    Para acceder a la interfaz de control sin SSH, use Tailscale Serve en el VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Esto mantiene el Gateway vinculado a la interfaz de bucle invertido y expone HTTPS mediante Tailscale. Consulte [Tailscale](/es/gateway/tailscale).

  </Accordion>

  <Accordion title="¿Cómo conecto un nodo Mac a un Gateway remoto (Tailscale Serve)?">
    Serve expone la **interfaz de control del Gateway + WS**; los nodos se conectan mediante el mismo endpoint WS del Gateway.

    1. Asegúrese de que el VPS y el Mac estén en la misma tailnet.
    2. Use la aplicación de macOS en modo remoto (el destino SSH puede ser el nombre de host de la tailnet): esta crea un túnel al puerto del Gateway y se conecta como nodo.
    3. Apruebe el nodo:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentación: [Protocolo del Gateway](/es/gateway/protocol), [Detección](/es/gateway/discovery), [modo remoto de macOS](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Debo instalarlo en un segundo portátil o simplemente añadir un nodo?">
    Para usar **solo herramientas locales** (pantalla/cámara/ejecución) en el segundo portátil, añádalo como **nodo**: un solo Gateway, sin duplicar la configuración. Actualmente, las herramientas de nodo local solo están disponibles en macOS. Instale un segundo Gateway únicamente para lograr un **aislamiento estricto** o tener dos bots completamente independientes.

    Documentación: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes), [Varios gateways](/es/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables de entorno y carga de .env

<AccordionGroup>
  <Accordion title="¿Cómo carga OpenClaw las variables de entorno?">
    OpenClaw lee las variables de entorno del proceso principal (shell, launchd/systemd, CI, etc.) y, además, carga:

    - `.env` desde el directorio de trabajo actual.
    - un `.env` global de respaldo desde `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`).

    Ninguno de los archivos `.env` sustituye las variables de entorno existentes. Las claves de credenciales de proveedores son una excepción para el `.env` del espacio de trabajo: las claves como `GEMINI_API_KEY`, `XAI_API_KEY` o `MISTRAL_API_KEY` (y otras variables de entorno de autenticación de proveedores incluidos) se ignoran en el `.env` del espacio de trabajo y deben estar en el entorno del proceso, en `~/.openclaw/.env` o en la configuración `env`.

    Las variables de entorno insertadas en la configuración solo se aplican si no existen en el entorno del proceso:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Consulte [/environment](/es/help/environment) para conocer la precedencia y las fuentes completas.

  </Accordion>

  <Accordion title="Inicié el Gateway mediante el servicio y mis variables de entorno desaparecieron. ¿Qué hago ahora?">
    Hay dos soluciones:

    1. Coloque las claves que faltan en `~/.openclaw/.env` para que se carguen incluso cuando el servicio no herede el entorno de su shell.
    2. Habilite la importación del shell (función opcional):
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
       Esto ejecuta su shell de inicio de sesión e importa únicamente las claves esperadas que falten (nunca sustituye las existentes). Variables de entorno equivalentes: `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Configuré COPILOT_GITHUB_TOKEN, pero el estado de los modelos muestra "Shell env: off." ¿Por qué?'>
    `openclaw models status` indica si está habilitada la **importación del entorno del shell**. "Shell env: off" **no** significa que falten sus variables de entorno; solo significa que OpenClaw no cargará automáticamente su shell de inicio de sesión.

    Si el Gateway se ejecuta como servicio (launchd/systemd), no heredará el entorno de su shell. Para solucionarlo, coloque el token en `~/.openclaw/.env`, habilite `env.shellEnv.enabled: true` o añádalo a la configuración `env` (solo se aplica si falta); después, reinicie el Gateway y vuelva a comprobarlo:

    ```bash
    openclaw models status
    ```

    Los tokens de Copilot se resuelven en este orden: `OPENCLAW_GITHUB_TOKEN`, luego `COPILOT_GITHUB_TOKEN`, después `GH_TOKEN` y, por último, `GITHUB_TOKEN`.

    Consulte [/concepts/model-providers](/es/concepts/model-providers) y [/environment](/es/help/environment).

  </Accordion>
</AccordionGroup>

## Sesiones y varios chats

<AccordionGroup>
  <Accordion title="¿Cómo inicio una conversación nueva?">
    Envíe `/new` o `/reset` como mensaje independiente. Consulte [Gestión de sesiones](/es/concepts/session).
  </Accordion>

  <Accordion title="¿Las sesiones se restablecen automáticamente si nunca envío /new?">
    Sí. La política de restablecimiento predeterminada es **diaria**: una sesión se renueva a una hora local configurada en el host del Gateway (`session.reset.atHour`, valor predeterminado `4`, 0-23), según el momento en que se inició la sesión actual. En su lugar, puede cambiar al restablecimiento basado en inactividad con `mode: "idle"` y `session.reset.idleMinutes`, que hace caducar una sesión tras un periodo de inactividad (según la última interacción real, no los eventos del sistema de Heartbeat/Cron/ejecución).

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

    `resetByType` admite `direct` (alias heredado `dm`), `group` y `thread`. La propiedad heredada de nivel superior `session.idleMinutes` sigue funcionando como alias de compatibilidad para un valor predeterminado en modo de inactividad cuando no se configura ningún bloque `session.reset`/`resetByType`. Las sesiones con una sesión de CLI activa perteneciente al proveedor no se interrumpen por el valor predeterminado diario implícito. Consulte [Gestión de sesiones](/es/concepts/session) para conocer el ciclo de vida completo.

  </Accordion>

  <Accordion title="¿Hay alguna forma de crear un equipo de instancias de OpenClaw (un director general y muchos agentes)?">
    Sí, mediante el **enrutamiento multiagente** y los **subagentes**: un agente coordinador y varios agentes de trabajo con sus propios espacios de trabajo y modelos.

    Es mejor considerarlo un experimento entretenido: consume muchos tokens y suele ser menos eficiente que un solo bot con sesiones separadas. El modelo habitual consiste en un bot con el que se interactúa, distintas sesiones para el trabajo en paralelo y la creación de subagentes cuando sea necesario.

    Documentación: [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [CLI de agentes](/es/cli/agents).

  </Accordion>

  <Accordion title="¿Por qué se truncó el contexto en mitad de una tarea? ¿Cómo puedo evitarlo?">
    El contexto de la sesión está limitado por la ventana del modelo. Los chats largos, las salidas extensas de herramientas o una gran cantidad de archivos pueden activar la Compaction o el truncamiento.

    - Pida al bot que resuma el estado actual y lo escriba en un archivo.
    - Use `/compact` antes de tareas largas y `/new` al cambiar de tema.
    - Mantenga el contexto importante en el espacio de trabajo y pida al bot que vuelva a leerlo.
    - Use subagentes para trabajos largos o en paralelo a fin de que el chat principal se mantenga más pequeño.
    - Elija un modelo con una ventana de contexto mayor si esto ocurre con frecuencia.

  </Accordion>

  <Accordion title="¿Cómo restablezco OpenClaw por completo sin desinstalarlo?">
    ```bash
    openclaw reset
    ```

    Restablecimiento completo no interactivo:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Después, vuelva a ejecutar la configuración:

    ```bash
    openclaw onboard --install-daemon
    ```

    El proceso de incorporación también ofrece **Restablecer** si detecta una configuración existente; consulte [Incorporación (CLI)](/es/start/wizard). Si utilizó perfiles (`--profile` / `OPENCLAW_PROFILE`), restablezca cada directorio de estado (valor predeterminado `~/.openclaw-<profile>`). Restablecimiento exclusivo para desarrollo: `openclaw gateway --dev --reset` borra la configuración de desarrollo, las credenciales, las sesiones y el espacio de trabajo.

  </Accordion>

  <Accordion title='Recibo errores de "context too large": ¿cómo restablezco o compacto?'>
    - **Compactar** (conserva la conversación y resume los turnos anteriores): `/compact` o `/compact <instructions>` para orientar el resumen.
    - **Restablecer** (nuevo ID de sesión para la misma clave de chat): `/new` o `/reset`.

    Si sigue ocurriendo, ajuste la **depuración de sesiones** (`agents.defaults.contextPruning`) para recortar las salidas antiguas de herramientas o utilice un modelo con una ventana de contexto mayor.

    Documentación: [Compaction](/es/concepts/compaction), [Depuración de sesiones](/es/concepts/session-pruning), [Gestión de sesiones](/es/concepts/session).

  </Accordion>

  <Accordion title='¿Por qué veo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Error de validación del proveedor: el modelo emitió un bloque `tool_use` sin el campo `input` obligatorio. Normalmente significa que el historial de la sesión está obsoleto o dañado (a menudo después de hilos largos o de un cambio de herramienta/esquema).

    Solución: inicie una sesión nueva con `/new` (como mensaje independiente).

  </Accordion>

  <Accordion title="¿Por qué recibo mensajes de Heartbeat cada 30 minutos?">
    Los Heartbeats se ejecutan cada **30m** de forma predeterminada, o cada **1h** cuando el modo de autenticación resuelto es OAuth de Anthropic/autenticación mediante token (incluida la reutilización de la CLI de Claude) y `heartbeat.every` no está definido. Ajústelo o desactívelo:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // o "0m" para desactivarlo
          },
        },
      },
    }
    ```

    Si existe `HEARTBEAT.md` pero está efectivamente vacío (solo contiene líneas en blanco, comentarios Markdown/HTML, encabezados ATX, marcadores de bloques delimitados o elementos de lista vacíos), OpenClaw omite la ejecución del Heartbeat para ahorrar llamadas a la API. Si falta el archivo, el Heartbeat se sigue ejecutando y el modelo decide qué hacer.

    Las sustituciones por agente usan `agents.list[].heartbeat`. Documentación: [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title='¿Tengo que añadir una "cuenta de bot" a un grupo de WhatsApp?'>
    No. OpenClaw se ejecuta en **su propia cuenta**: si está en el grupo, OpenClaw puede verlo. De forma predeterminada, las respuestas en grupos están bloqueadas hasta que permita remitentes (`groupPolicy: "allowlist"`).

    Para restringir las respuestas en grupos únicamente a usted:

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
    La forma más rápida es seguir los registros y enviar un mensaje de prueba en el grupo.

    ```bash
    openclaw logs --follow --json
    ```

    Busque `chatId` (o `from`) que termine en `@g.us`, como `1234567890-1234567890@g.us`.

    Si ya está configurado/incluido en la lista de permitidos, enumere los grupos desde la configuración:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentación: [WhatsApp](/es/channels/whatsapp), [Directorio](/es/cli/directory), [Registros](/es/cli/logs).

  </Accordion>

  <Accordion title="¿Por qué OpenClaw no responde en un grupo?">
    Hay dos causas habituales: el requisito de mención está activado de forma predeterminada (debe mencionar al bot con @ o coincidir con `mentionPatterns`) o configuró `channels.whatsapp.groups` sin `"*"` y el grupo no está en la lista de permitidos.

    Consulte [Grupos](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).

  </Accordion>

  <Accordion title="¿Los grupos/hilos comparten contexto con los mensajes directos?">
    Los chats directos se integran en la sesión principal de forma predeterminada. Los grupos/canales tienen sus propias claves de sesión, y los temas de Telegram/hilos de Discord son sesiones independientes. Consulte [Grupos](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).
  </Accordion>

  <Accordion title="¿Cuántos espacios de trabajo y agentes puedo crear?">
    No hay límites estrictos: puede usar decenas o incluso cientos, pero tenga en cuenta:

    - **Crecimiento del disco**: las sesiones activas y las transcripciones se almacenan en la base de datos SQLite de cada agente; los artefactos heredados/de archivo aún pueden acumularse en `~/.openclaw/agents/<agentId>/sessions/`.
    - **Coste de tokens**: más agentes implican un mayor uso simultáneo de modelos.
    - **Carga operativa**: perfiles de autenticación, espacios de trabajo y enrutamiento de canales por agente.

    Mantenga un espacio de trabajo **activo** por agente (`agents.defaults.workspace`), depure las sesiones antiguas con `openclaw sessions cleanup` si aumenta el uso del disco (no edite manualmente el estado activo de SQLite) y use `openclaw doctor` para detectar espacios de trabajo aislados y discrepancias entre perfiles.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios bots o chats al mismo tiempo (Slack) y cómo debo configurarlo?">
    Sí, mediante el **enrutamiento multiagente**: ejecute varios agentes aislados y enrute los mensajes entrantes según el canal, la cuenta o el interlocutor. Slack es compatible como canal y puede vincularse a agentes específicos.

    El acceso mediante navegador es potente, pero no permite «hacer todo lo que puede hacer una persona»: las medidas antibots, los CAPTCHA y la MFA aún pueden bloquear la automatización. Para lograr el control más fiable, use MCP de Chrome local en el host o CDP en la máquina que realmente ejecuta el navegador.

    Configuración recomendada: host del Gateway siempre activo (VPS/Mac mini), un agente por función (vinculaciones), canales de Slack vinculados a esos agentes y navegador local mediante Chrome MCP o un nodo cuando sea necesario.

    Documentación: [Enrutamiento multiagente](/es/concepts/multi-agent), [Slack](/es/channels/slack), [Navegador](/es/tools/browser), [Nodos](/es/nodes).

  </Accordion>
</AccordionGroup>

## Modelos, conmutación por error y perfiles de autenticación

Las preguntas y respuestas sobre modelos —valores predeterminados, selección, alias, cambio, conmutación por error y perfiles de autenticación— se encuentran en las [Preguntas frecuentes sobre modelos](/es/help/faq-models).

## Gateway: puertos, «ya está en ejecución» y modo remoto

<AccordionGroup>
  <Accordion title="¿Qué puerto utiliza el Gateway?">
    `gateway.port` controla el único puerto multiplexado para WebSocket + HTTP (interfaz de control, hooks, etc.). Precedencia:

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > valor predeterminado 18789
    ```

  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status indica "Runtime: running" pero "Connectivity probe: failed"?'>
    «En ejecución» es la perspectiva del **supervisor** (launchd/systemd/schtasks); la prueba de conectividad es la CLI conectándose realmente al WebSocket del Gateway. Consulte estas líneas de `openclaw gateway status`: `Probe target:` (la URL utilizada por la prueba), `Listening:` (lo que realmente está vinculado al puerto), `Last gateway error:` (causa raíz habitual cuando el proceso está activo, pero el puerto no está escuchando).
  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status muestra valores diferentes para "Config (cli)" y "Config (service)"?'>
    Está editando un archivo de configuración mientras el servicio utiliza otro (a menudo por una discrepancia de `--profile` / `OPENCLAW_STATE_DIR`).

    Para corregirlo, ejecute lo siguiente desde el mismo `--profile` / entorno que desea que utilice el servicio:

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='¿Qué significa "another gateway instance is already listening"?'>
    OpenClaw aplica un bloqueo en tiempo de ejecución vinculando inmediatamente el listener de WebSocket durante el inicio (`ws://127.0.0.1:18789` de forma predeterminada). Si la vinculación falla con `EADDRINUSE`, genera `GatewayLockError` («otra instancia del Gateway ya está escuchando»).

    Solución: detenga la otra instancia, libere el puerto o ejecute `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="¿Cómo ejecuto OpenClaw en modo remoto (el cliente se conecta a un Gateway ubicado en otro lugar)?">
    Establezca `gateway.mode: "remote"` y apunte a una URL de WebSocket remota, opcionalmente con credenciales remotas de secreto compartido:

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

    - `openclaw gateway` solo se inicia cuando `gateway.mode` es `local` (o cuando se proporciona una opción de anulación).
    - La aplicación de macOS supervisa el archivo de configuración y cambia de modo en tiempo real cuando cambian estos valores.
    - `gateway.remote.token` / `.password` son únicamente credenciales remotas del lado del cliente; por sí solas no habilitan la autenticación del Gateway local.

  </Accordion>

  <Accordion title='La interfaz de control indica "unauthorized" (o sigue reconectándose). ¿Qué hago?'>
    La ruta de autenticación del Gateway y el método de autenticación de la interfaz no coinciden.

    Datos (del código):

    - La interfaz de control conserva el token en `sessionStorage`, limitado a la pestaña actual del navegador y a la URL del Gateway seleccionada, por lo que las actualizaciones en la misma pestaña siguen funcionando sin persistencia prolongada del token en localStorage.
    - Ante `AUTH_TOKEN_MISMATCH`, los clientes de confianza pueden realizar un único reintento limitado con un token de dispositivo almacenado en caché cuando el Gateway devuelve indicaciones de reintento (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ese reintento con el token almacenado en caché reutiliza los ámbitos aprobados almacenados junto con el token del dispositivo; quienes proporcionan explícitamente `deviceToken` / `scopes` conservan el conjunto de ámbitos solicitado en lugar de heredar los ámbitos almacenados en caché.
    - Fuera de esa ruta de reintento, la precedencia de autenticación durante la conexión es: primero el token compartido o la contraseña explícitos, después un `deviceToken` explícito, luego el token de dispositivo almacenado y, por último, el token de arranque.
    - El arranque integrado mediante código de configuración devuelve un token de dispositivo de nodo con `scopes: []`, además de un token limitado de transferencia al operador para la incorporación móvil de confianza. La transferencia al operador puede leer la configuración nativa del momento de la configuración, pero no concede ámbitos de modificación del emparejamiento ni `operator.admin`.

    Solución:

    - Más rápido: `openclaw dashboard` (muestra y copia la URL del panel e intenta abrirla; si no hay entorno gráfico, muestra una indicación para SSH).
    - Si aún no tiene un token: `openclaw doctor --generate-gateway-token`.
    - En remoto: primero cree un túnel con `ssh -N -L 18789:127.0.0.1:18789 user@host` y, después, abra `http://127.0.0.1:18789/`.
    - Modo de secreto compartido: establezca `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` y, después, pegue el secreto correspondiente en la configuración de la interfaz de control.
    - Modo Tailscale Serve: confirme que `gateway.auth.allowTailscale` esté habilitado y que esté abriendo la URL de Serve, no una URL directa de loopback/tailnet que omita los encabezados de identidad de Tailscale.
    - Modo de proxy de confianza: confirme que está accediendo mediante el proxy configurado con conocimiento de identidad. Los proxies loopback del mismo host también necesitan `gateway.auth.trustedProxy.allowLoopback = true`.
    - Si la discrepancia persiste tras el único reintento: rote o vuelva a aprobar el token del dispositivo emparejado:
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - Si se deniega la rotación: las sesiones de dispositivos emparejados solo pueden rotar su **propio** dispositivo, salvo que también tengan `operator.admin`, y los valores explícitos de `--scope` no pueden superar los ámbitos actuales de operador del llamador.
    - Si el problema persiste: ejecute `openclaw status --all` y consulte [Solución de problemas](/es/gateway/troubleshooting). Consulte [Panel](/es/web/dashboard) para obtener detalles de autenticación.

  </Accordion>

  <Accordion title="Configuré gateway.bind como tailnet, pero solo escucha en loopback">
    La vinculación `tailnet` selecciona una IP de Tailscale de las interfaces de red (100.64.0.0/10). Si el equipo no está conectado a Tailscale (o la interfaz está inactiva), el Gateway recurre a loopback en lugar de exponer otra interfaz de red.

    Solución: inicie Tailscale en ese host y reinicie el Gateway, o cambie explícitamente a `gateway.bind: "loopback"` / `"lan"`.

    `tailnet` es explícito; `auto` prefiere loopback. Use `gateway.bind: "tailnet"` para limitar la exposición fuera de loopback a la Tailnet, conservando al mismo tiempo el listener requerido `127.0.0.1` en el mismo host.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios Gateways en el mismo host?">
    Por lo general, no: un Gateway puede ejecutar varios canales de mensajería y agentes. Utilice varios Gateways únicamente para redundancia (por ejemplo, un bot de rescate) o aislamiento estricto, y aísle cada uno con sus propios `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `agents.defaults.workspace` y un `gateway.port` único.

    Recomendación: use `openclaw --profile <name> ...` por instancia (crea automáticamente `~/.openclaw-<name>`), un `gateway.port` único por configuración de perfil (o `--port` para ejecuciones manuales) y un servicio por perfil con `openclaw --profile <name> gateway install`.

    Los perfiles también añaden un sufijo a los nombres de los servicios: launchd `ai.openclaw.<profile>`, systemd `openclaw-gateway-<profile>.service`, Windows `OpenClaw Gateway (<profile>)`. La unidad systemd sin calificar `openclaw-gateway` solo existe para el perfil predeterminado; el nombre heredado de la unidad systemd anterior al cambio de nombre, `clawdbot-gateway`, se migra automáticamente.

    Guía completa: [Varios Gateways](/es/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='¿Qué significa "invalid handshake" / código 1008?'>
    El Gateway es un **servidor WebSocket** y espera que el primer mensaje sea una trama `connect`. Cualquier otro mensaje cierra la conexión con el **código 1008** (infracción de la política).

    Causas habituales: abrió la URL **HTTP** en un navegador en lugar de utilizar un cliente WS, usó un puerto o una ruta incorrectos, o un proxy/túnel eliminó los encabezados de autenticación o envió una solicitud que no era del Gateway.

    Solución: use la URL de WS (`ws://<host>:18789` o `wss://...` sobre HTTPS), no abra el puerto de WS en una pestaña normal del navegador e incluya el token o la contraseña en la trama `connect` cuando la autenticación esté habilitada. Ejemplo de CLI/TUI:

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Detalles del protocolo: [Protocolo del Gateway](/es/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Registro y depuración

<AccordionGroup>
  <Accordion title="¿Dónde están los registros?">
    Registros de archivo (estructurados): `/tmp/openclaw/openclaw-YYYY-MM-DD.log`. Establezca una ruta estable mediante `logging.file`; el nivel de registro del archivo mediante `logging.level`; y el nivel de detalle de la consola mediante `--verbose` y `logging.consoleLevel`.

    Forma más rápida de seguirlos:

    ```bash
    openclaw logs --follow
    ```

    Registros del servicio/supervisor (cuando el Gateway se ejecuta mediante launchd/systemd):

    - stdout de launchd en macOS: `~/Library/Logs/openclaw/gateway.log` (los perfiles utilizan `gateway-<profile>.log`; stderr se suprime).
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`.
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`.

    Consulte [Solución de problemas](/es/gateway/troubleshooting) para obtener más información.

  </Accordion>

  <Accordion title="¿Cómo inicio, detengo o reinicio el servicio del Gateway?">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Si ejecuta el Gateway manualmente, `openclaw gateway --force` puede recuperar el puerto. Consulte [Gateway](/es/gateway).

  </Accordion>

  <Accordion title="Cerré la terminal en Windows: ¿cómo reinicio OpenClaw?">
    Tres modos de instalación en Windows:

    **1) Configuración local de Windows Hub**: la aplicación nativa administra un Gateway WSL local propiedad de la aplicación. Abra **OpenClaw Companion** desde el menú Start o la bandeja y, a continuación, use **Gateway Setup** o la pestaña Connections.

    **2) Gateway WSL2 manual**: el Gateway se ejecuta dentro de Linux.
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    Si nunca instaló el servicio, inícielo en primer plano: `openclaw gateway run`.

    **3) CLI/Gateway nativo de Windows**: se ejecuta directamente en Windows.
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    Si lo ejecuta manualmente (sin servicio): `openclaw gateway run`.

    Documentación: [Windows](/es/platforms/windows), [Guía operativa del servicio del Gateway](/es/gateway).

  </Accordion>

  <Accordion title="El Gateway está activo, pero las respuestas nunca llegan. ¿Qué debo comprobar?">
    Comprobación rápida del estado:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causas habituales: la autenticación del modelo no está cargada en el **host del Gateway** (compruebe `models status`), el emparejamiento o la lista de permitidos del canal bloquea las respuestas (compruebe la configuración y los registros del canal), o WebChat/Panel está abierto sin el token correcto. Si la conexión es remota, confirme que el túnel o la conexión de Tailscale estén activos y que el WebSocket del Gateway sea accesible.

    Documentación: [Canales](/es/channels), [Solución de problemas](/es/gateway/troubleshooting), [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason": ¿qué hago?'>
    Normalmente significa que la interfaz perdió la conexión WebSocket. Compruebe: ¿está ejecutándose el Gateway (`openclaw gateway status`)? ¿Está en buen estado (`openclaw status`)? ¿Tiene la interfaz el token correcto (`openclaw dashboard`)? Si la conexión es remota, ¿está activo el enlace del túnel o de Tailscale?

    A continuación, siga los registros:

    ```bash
    openclaw logs --follow
    ```

    Documentación: [Panel](/es/web/dashboard), [Acceso remoto](/es/gateway/remote), [Solución de problemas](/es/gateway/troubleshooting).

  </Accordion>

  <Accordion title="setMyCommands de Telegram falla. ¿Qué debo comprobar?">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    A continuación, identifique el error:

    - `BOT_COMMANDS_TOO_MUCH`: el menú de Telegram tiene demasiadas entradas. OpenClaw ya lo reduce al límite de Telegram y vuelve a intentarlo con menos comandos, pero aun así pueden omitirse algunas entradas del menú. Reduzca los comandos de plugins, Skills o personalizados, o desactive `channels.telegram.commands.native` si no necesita el menú.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` o errores de red similares: en un VPS o detrás de un proxy, confirme que se permite HTTPS saliente y que DNS funciona para `api.telegram.org`.

    Si el Gateway es remoto, revise los registros en el host del Gateway.

    Documentación: [Telegram](/es/channels/telegram), [Solución de problemas de canales](/es/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI no muestra ninguna salida. ¿Qué debo comprobar?">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    En la TUI, use `/status` para ver el estado actual. Si espera respuestas en un canal de chat, confirme que la entrega esté habilitada (`/deliver on`).

    Documentación: [TUI](/es/web/tui), [Comandos con barra diagonal](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo detengo por completo el Gateway y luego lo inicio?">
    Si instaló el servicio (launchd en macOS, systemd en Linux):

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    En primer plano, deténgalo con Ctrl-C y luego ejecute `openclaw gateway run`.

    Documentación: [Guía operativa del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="Explicación sencilla: openclaw gateway restart frente a openclaw gateway">
    `openclaw gateway restart` reinicia el **servicio en segundo plano** (launchd/systemd). `openclaw gateway` ejecuta el Gateway **en primer plano** durante esta sesión de terminal. Use los subcomandos de Gateway si instaló el servicio; use la ejecución directa en primer plano para una ejecución puntual.
  </Accordion>

  <Accordion title="La forma más rápida de obtener más detalles cuando algo falla">
    Inicie el Gateway con `--verbose` para obtener más detalles en la consola y luego examine el archivo de registro para detectar errores de autenticación del canal, enrutamiento de modelos y RPC.
  </Accordion>
</AccordionGroup>

## Medios y archivos adjuntos

<AccordionGroup>
  <Accordion title="Mi Skill generó una imagen o un PDF, pero no se envió nada">
    Los archivos adjuntos salientes del agente deben usar campos de medios estructurados como `media`, `mediaUrl`, `path` o `filePath`. Consulte [Configuración del asistente de OpenClaw](/es/start/openclaw) y [Envío del agente](/es/tools/agent-send).

    ```bash
    openclaw message send --target +15555550123 --message "Aquí lo tiene" --media /path/to/file.png
    ```

    Compruebe también lo siguiente: el canal de destino admite medios salientes y no está bloqueado por listas de permitidos; el archivo se encuentra dentro de los límites de tamaño del proveedor (las imágenes se redimensionan hasta un lado máximo de 2048px); `tools.fs.workspaceOnly=true` limita los envíos desde rutas locales al espacio de trabajo, al almacén temporal/de medios y a los archivos validados por el entorno aislado; `tools.fs.workspaceOnly=false` (valor predeterminado) permite que los envíos estructurados de medios locales utilicen archivos locales del host que el agente ya pueda leer, tanto medios como tipos de documentos seguros (imágenes, audio, vídeo, PDF, documentos de Office y documentos de texto validados como Markdown/MD, TXT, JSON, YAML/YML). Esto no es un escáner de secretos: se puede adjuntar un archivo `secret.txt` o `config.json` legible por el agente cuando la extensión y la validación del contenido coincidan. Mantenga los archivos sensibles fuera de las rutas legibles por el agente o conserve `tools.fs.workspaceOnly=true` para aplicar restricciones más estrictas a los envíos desde rutas locales.

    Consulte [Imágenes](/es/nodes/images).

  </Accordion>
</AccordionGroup>

## Seguridad y control de acceso

<AccordionGroup>
  <Accordion title="¿Es seguro exponer OpenClaw a mensajes directos entrantes?">
    Trate los mensajes directos entrantes como entradas no confiables. Los valores predeterminados reducen el riesgo:

    - El comportamiento predeterminado en los canales que admiten mensajes directos es el **emparejamiento**: los remitentes desconocidos reciben un código de emparejamiento y su mensaje no se procesa. Apruébelo con `openclaw pairing approve --channel <channel> [--account <id>] <code>`. Las solicitudes pendientes están limitadas a **3 por canal**; consulte `openclaw pairing list --channel <channel> [--account <id>]` si no llegó un código.
    - Abrir públicamente los mensajes directos requiere consentimiento explícito (`dmPolicy: "open"` y la lista de permitidos `"*"`).

    Ejecute `openclaw doctor` para detectar políticas de mensajes directos arriesgadas.

  </Accordion>

  <Accordion title="¿La inyección de instrucciones solo supone un problema para los bots públicos?">
    No. La inyección de instrucciones se relaciona con el **contenido no confiable**, no solo con quién puede enviar mensajes directos al bot. Si el asistente lee contenido externo (búsquedas u obtención de contenido web, páginas del navegador, correos electrónicos, documentos, archivos adjuntos o registros pegados), ese contenido puede incluir instrucciones que intenten tomar el control del modelo, aunque usted sea el único remitente.

    El mayor riesgo aparece cuando las herramientas están habilitadas: se puede engañar al modelo para que exfiltre contexto o invoque herramientas en su nombre. Reduzca el radio de impacto:

    - use un agente «lector» de solo lectura o sin herramientas para resumir contenido no confiable
    - mantenga `web_search` / `web_fetch` / `browser` desactivados para los agentes con herramientas habilitadas
    - trate también como no confiable el texto decodificado de archivos o documentos: tanto `input_file` de OpenResponses como la extracción de archivos adjuntos multimedia envuelven el texto extraído en marcadores explícitos de límites de contenido externo, en lugar de pasar el texto sin procesar del archivo
    - use un entorno aislado y listas estrictas de herramientas permitidas

    Detalles: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿OpenClaw es menos seguro porque usa TypeScript/Node en lugar de Rust/WASM?">
    El lenguaje y el entorno de ejecución importan, pero no constituyen el principal riesgo para un agente personal. Los riesgos prácticos son la exposición del Gateway, quién puede enviar mensajes al bot, la inyección de instrucciones, el alcance de las herramientas, la gestión de credenciales, el acceso al navegador, el acceso de ejecución y la confianza en Skills y plugins de terceros.

    Rust y WASM pueden proporcionar un aislamiento más sólido para algunas clases de código, pero no solucionan la inyección de instrucciones, las listas de permitidos incorrectas, la exposición pública del Gateway, las herramientas con permisos excesivos ni un perfil de navegador que ya tenga sesiones iniciadas en cuentas sensibles. Considere estos como los controles principales: mantenga el Gateway privado o autenticado, use emparejamiento y listas de permitidos para mensajes directos y grupos, deniegue o aísle las herramientas arriesgadas para entradas no confiables, instale solo plugins y Skills confiables y ejecute `openclaw security audit --deep` después de cambiar la configuración.

    Detalles: [Seguridad](/es/gateway/security), [Aislamiento](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="He visto informes sobre instancias de OpenClaw expuestas. ¿Qué debo comprobar?">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Una base más segura: el Gateway vinculado a `loopback` o expuesto únicamente mediante acceso privado autenticado (tailnet, túnel SSH, autenticación con token/contraseña o un proxy de confianza configurado correctamente); mensajes directos en modo `pairing` o `allowlist`; grupos incluidos en una lista de permitidos y con requisito de mención, salvo que todos los miembros sean de confianza; herramientas de alto riesgo (`exec`, `browser`, `gateway`, `cron`) denegadas o con un alcance estrictamente limitado para los agentes que leen contenido no confiable; aislamiento habilitado cuando la ejecución de herramientas requiera un radio de impacto menor.

    Las vinculaciones públicas sin autenticación, los mensajes directos o grupos abiertos con herramientas y el control expuesto del navegador son los problemas que deben corregirse primero. Detalles: [openclaw security audit](/es/gateway/security#openclaw-security-audit).

  </Accordion>

  <Accordion title="¿Es seguro instalar Skills de ClawHub y plugins de terceros?">
    Trate las Skills y los plugins de terceros como código en el que decide confiar. Las páginas de Skills de ClawHub muestran el estado del análisis antes de la instalación, pero los análisis no constituyen un límite de seguridad completo. OpenClaw no ejecuta un bloqueo local integrado de código peligroso durante la instalación o actualización de plugins o Skills; use `security.installPolicy`, controlado por el operador, para tomar decisiones locales de permiso o bloqueo.

    Patrón más seguro: prefiera autores confiables y versiones fijadas, lea la Skill o el plugin antes de habilitarlo, mantenga restringidas las listas de plugins y Skills permitidos, ejecute los flujos de trabajo con entradas no confiables en un entorno aislado y con herramientas mínimas, y evite proporcionar al código de terceros acceso amplio al sistema de archivos, la ejecución, el navegador o los secretos.

    Detalles: [Skills](/es/tools/skills), [Plugins](/es/tools/plugin), [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Debe mi bot tener su propio correo electrónico, cuenta de GitHub o número de teléfono?">
    Sí, para la mayoría de las configuraciones. Aislar el bot mediante cuentas y números de teléfono independientes reduce el radio de impacto si algo sale mal y facilita la rotación de credenciales o la revocación del acceso sin afectar a sus cuentas personales.

    Empiece con lo mínimo: conceda acceso únicamente a las herramientas y cuentas que realmente necesite y amplíelo más adelante si es necesario.

    Documentación: [Seguridad](/es/gateway/security), [Emparejamiento](/es/channels/pairing).

  </Accordion>

  <Accordion title="¿Puedo darle autonomía sobre mis mensajes de texto y es seguro hacerlo?">
    **No** recomendamos concederle autonomía total sobre sus mensajes personales. El patrón más seguro es mantener los mensajes directos en **modo de emparejamiento** o con una lista de permitidos estricta, usar un **número o una cuenta independientes** si debe enviar mensajes en su nombre y dejar que prepare borradores mientras usted **aprueba antes de enviar**.

    Para experimentar, hágalo con una cuenta dedicada y aislada. Consulte [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Puedo usar modelos más baratos para las tareas de un asistente personal?">
    Sí, **si** el agente solo usa chat y la entrada es confiable. Los niveles más pequeños son más susceptibles al secuestro mediante instrucciones, así que evítelos para agentes con herramientas habilitadas o al leer contenido no confiable. Si debe usar un modelo más pequeño, restrinja las herramientas y ejecútelo dentro de un entorno aislado. Consulte [Seguridad](/es/gateway/security).
  </Accordion>

  <Accordion title="Ejecuté /start en Telegram, pero no recibí un código de emparejamiento">
    Los códigos de emparejamiento se envían **solo** cuando un remitente desconocido envía un mensaje al bot y `dmPolicy: "pairing"` está habilitado; `/start` por sí solo no genera ningún código.

    Compruebe las solicitudes pendientes:

    ```bash
    openclaw pairing list telegram
    ```

    Para obtener acceso inmediato, añada el identificador del remitente a la lista de permitidos o establezca `dmPolicy: "open"` para esa cuenta.

  </Accordion>

  <Accordion title="WhatsApp: ¿enviará mensajes a mis contactos? ¿Cómo funciona el emparejamiento?">
    No. La política predeterminada de mensajes directos de WhatsApp es el **emparejamiento**. Los remitentes desconocidos solo reciben un código de emparejamiento; su mensaje **no se procesa**. OpenClaw solo responde a los chats que recibe o a envíos explícitos que usted activa.

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    La solicitud del número de teléfono del asistente de configuración establece su **lista de permitidos/propietario** para autorizar sus propios mensajes directos; no se utiliza para realizar envíos automáticos. En su número personal de WhatsApp, use ese número y habilite `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandos de chat, cancelación de tareas y «no se detiene»

<AccordionGroup>
  <Accordion title="¿Cómo evito que los mensajes internos del sistema aparezcan en el chat?">
    La mayoría de los mensajes internos o de herramientas solo aparecen cuando **verbose**, **trace** o **reasoning** están habilitados para esa sesión.

    Corríjalo en el chat donde los vea:

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    Si continúa generando demasiado contenido: compruebe la configuración de la sesión en la interfaz de control y establezca el modo detallado en **inherit**; confirme que no esté usando un perfil de bot con `verboseDefault: "on"` en la configuración.

    Documentación: [Razonamiento y modo detallado](/es/tools/thinking), [Seguridad](/es/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="¿Cómo detengo o cancelo una tarea en ejecución?">
    Envíe cualquiera de estos textos **como mensaje independiente** (sin barra diagonal) para activar una cancelación: `stop`, `stop action`, `stop current action`, `stop run`, `stop current run`, `stop agent`, `stop the agent`, `stop openclaw`, `openclaw stop`, `stop don't do anything`, `stop do not do anything`, `stop doing anything`, `do not do that`, `please stop`, `stop please`, `abort`, `esc`, `exit`, `interrupt`, `halt`. También funcionan desencadenadores habituales en otros idiomas (francés, alemán, español, chino, japonés, hindi, árabe y ruso).

    Para los procesos en segundo plano iniciados por la herramienta de ejecución, pida al agente que ejecute:

    ```text
    process action:kill sessionId:XXX
    ```

    La mayoría de los comandos con barra diagonal deben enviarse como un mensaje **independiente** que comience por `/`, pero algunos accesos directos (como `/status`) también funcionan dentro del texto para remitentes incluidos en la lista de permitidos. Consulte [Comandos con barra diagonal](/es/tools/slash-commands).

  </Accordion>

  <Accordion title='¿Cómo envío un mensaje de Discord desde Telegram? ("Mensajería entre contextos denegada")'>
    OpenClaw bloquea de forma predeterminada la mensajería **entre proveedores**. Si una llamada a una herramienta está vinculada a Telegram, no enviará mensajes a Discord a menos que se permita explícitamente; el cambio surte efecto de inmediato, sin necesidad de reiniciar el Gateway:

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

  <Accordion title='¿Por qué parece que el bot "ignora" los mensajes enviados rápidamente?'>
    De forma predeterminada, las instrucciones recibidas durante una ejecución se incorporan a la ejecución activa. Use `/queue` para elegir el comportamiento de la ejecución activa:

    - `steer` (predeterminado): guía la ejecución activa en el siguiente límite del modelo.
    - `followup`: pone los mensajes en cola y los procesa uno a uno después de que finalice la ejecución actual.
    - `collect`: pone en cola los mensajes compatibles y responde una sola vez después de que finalice la ejecución actual.
    - `interrupt`: cancela la ejecución actual e inicia una nueva.

    Añada opciones a los modos en cola, como `debounce:0.5s cap:25 drop:summarize`. Consulte [Cola de comandos](/es/concepts/queue) y [Cola de direccionamiento](/es/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Varios

<AccordionGroup>
  <Accordion title='¿Cuál es el modelo predeterminado de Anthropic con una clave de API?'>
    Las credenciales y la selección del modelo son aspectos independientes. Configurar `ANTHROPIC_API_KEY` (o almacenar una clave de API de Anthropic en los perfiles de autenticación) habilita la autenticación, pero el modelo predeterminado real es el que se configure en `agents.defaults.model.primary` (por ejemplo, `anthropic/claude-sonnet-4-6` o `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` significa que el Gateway no pudo encontrar las credenciales de Anthropic en el archivo `auth-profiles.json` esperado para el agente en ejecución.
  </Accordion>
</AccordionGroup>

---

¿Sigue sin poder resolverlo? Pregunte en [Discord](https://discord.com/invite/clawd) o abra un [debate en GitHub](https://github.com/openclaw/openclaw/discussions).

## Temas relacionados

- [Preguntas frecuentes sobre la primera ejecución](/es/help/faq-first-run): instalación, incorporación, autenticación, suscripciones y errores iniciales
- [Preguntas frecuentes sobre modelos](/es/help/faq-models): selección de modelos, conmutación por error y perfiles de autenticación
- [Solución de problemas](/es/help/troubleshooting): triaje basado primero en los síntomas
