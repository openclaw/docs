---
read_when:
    - Respuesta a preguntas frecuentes de asistencia sobre configuración, instalación, incorporación o entorno de ejecución
    - Clasificación de problemas notificados por los usuarios antes de una depuración más profunda
summary: Preguntas frecuentes sobre la instalación, la configuración y el uso de OpenClaw
title: Preguntas frecuentes
x-i18n:
    generated_at: "2026-07-14T13:44:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 913757fcc748a15370dc49874b54184d891c954df45b76c8a3212da5bc1da845
    source_path: help/faq.md
    workflow: 16
---

Respuestas rápidas y solución de problemas más detallada para configuraciones reales (desarrollo local, VPS, múltiples agentes, claves de OAuth/API, conmutación por error de modelos). Para diagnósticos de ejecución, consulte [Solución de problemas](/es/gateway/troubleshooting). Para obtener la referencia completa de configuración, consulte [Configuración](/es/gateway/configuration).

## Primeros 60 segundos si algo no funciona

<Steps>
  <Step title="Estado rápido">
    ```bash
    openclaw status
    ```
    Resumen local rápido: SO + actualización, accesibilidad del gateway/servicio, agentes/sesiones, configuración del proveedor + problemas de ejecución (cuando se puede acceder al gateway).
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
    Muestra la ejecución del supervisor frente a la accesibilidad mediante RPC, la URL de destino del sondeo y qué configuración probablemente utilizó el servicio.
  </Step>
  <Step title="Sondeos exhaustivos">
    ```bash
    openclaw status --deep
    ```
    Sondeo en vivo del estado del gateway, incluidos los sondeos de canales cuando se admiten (requiere un gateway accesible). Consulte [Estado](/es/gateway/health).
  </Step>
  <Step title="Seguir el registro más reciente">
    ```bash
    openclaw logs --follow
    ```
    Si RPC no está disponible, recurra a:
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    Los registros de archivos son independientes de los registros del servicio; consulte [Registro](/es/logging) y [Solución de problemas](/es/gateway/troubleshooting).
  </Step>
  <Step title="Ejecutar el diagnóstico (reparaciones)">
    ```bash
    openclaw doctor
    ```
    Repara/migra la configuración y el estado, y después ejecuta comprobaciones de estado. Consulte [Diagnóstico](/es/gateway/doctor).
  </Step>
  <Step title="Instantánea del Gateway (solo WS)">
    ```bash
    openclaw health --json
    openclaw health --verbose   # muestra la URL de destino + la ruta de configuración cuando hay errores
    ```
    Solicita al gateway en ejecución una instantánea completa. Consulte [Estado](/es/gateway/health).
  </Step>
</Steps>

## Inicio rápido y configuración de la primera ejecución

Las preguntas y respuestas sobre la primera ejecución —instalación, incorporación, rutas de autenticación, suscripciones y fallos iniciales— se encuentran en las [Preguntas frecuentes sobre la primera ejecución](/es/help/faq-first-run).

## ¿Qué es OpenClaw?

<AccordionGroup>
  <Accordion title="¿Qué es OpenClaw, en un párrafo?">
    OpenClaw es un asistente personal de IA que se ejecuta en los propios dispositivos. Responde en los servicios de mensajería que ya se utilizan (Discord, Google Chat, iMessage, Mattermost, Signal, Slack, Telegram, WebChat, WhatsApp y plugins de canales incluidos, como QQ Bot), y también puede ofrecer voz y un Canvas en vivo en las plataformas compatibles. El **Gateway** es el plano de control siempre activo; el asistente es el producto.
  </Accordion>

  <Accordion title="Propuesta de valor">
    OpenClaw no es «solo un envoltorio de Claude». Es un **plano de control centrado en la ejecución local** que ejecuta un asistente competente en **el propio hardware**, accesible desde las aplicaciones de chat que ya se utilizan, con sesiones con estado, memoria y herramientas, sin entregar los flujos de trabajo a un SaaS alojado.

    - **Los dispositivos y los datos son propios**: ejecute el Gateway donde prefiera (Mac, Linux, VPS) y conserve localmente el espacio de trabajo y el historial de sesiones.
    - **Canales reales, no un entorno web aislado**: Discord/iMessage/Signal/Slack/Telegram/WhatsApp/etc., además de voz móvil y Canvas en las plataformas compatibles.
    - **Independiente del modelo**: utilice Anthropic, MiniMax, OpenAI, OpenRouter, etc., con enrutamiento por agente y conmutación por error.
    - **Opción exclusivamente local**: ejecute modelos locales para que todos los datos puedan permanecer en el dispositivo.
    - **Enrutamiento multiagente**: agentes independientes por canal, cuenta o tarea, cada uno con su propio espacio de trabajo y valores predeterminados.
    - **Código abierto y modificable**: inspecciónelo, amplíelo y alójelo por cuenta propia sin dependencia de un proveedor.

    Documentación: [Gateway](/es/gateway), [Canales](/es/channels), [Multiagente](/es/concepts/multi-agent), [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="Acabo de configurarlo: ¿qué debería hacer primero?">
    Buenos primeros proyectos: crear un sitio web (WordPress, Shopify o un sitio estático); crear el prototipo de una aplicación móvil (esquema, pantallas, plan de API); organizar archivos y carpetas; conectar Gmail y automatizar resúmenes o seguimientos.

    Puede gestionar tareas grandes, pero funciona mejor si se dividen en fases y se utilizan subagentes para el trabajo en paralelo.

  </Accordion>

  <Accordion title="¿Cuáles son los cinco principales casos de uso cotidiano de OpenClaw?">
    - **Informes personales**: resúmenes de la bandeja de entrada, el calendario y las noticias de interés.
    - **Investigación y redacción**: investigación rápida, resúmenes y primeros borradores de correos electrónicos o documentos.
    - **Recordatorios y seguimientos**: avisos y listas de comprobación activados mediante Cron o Heartbeat.
    - **Automatización del navegador**: rellenar formularios, recopilar datos y repetir tareas web.
    - **Coordinación entre dispositivos**: envíe una tarea desde el teléfono, deje que el Gateway la ejecute en un servidor y reciba el resultado en el chat.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ayudar con la generación de clientes potenciales, los contactos, los anuncios y los blogs de un SaaS?">
    Sí, para la **investigación, cualificación y redacción**: analizar sitios, crear listas de candidatos, resumir clientes potenciales y redactar borradores de mensajes de contacto o textos publicitarios.

    Para las **campañas de contacto o anuncios**, mantenga a una persona en el proceso. Evite el spam, cumpla las leyes locales y las políticas de las plataformas, y revise todo antes de enviarlo. Deje que OpenClaw redacte; una persona debe aprobarlo.

    Documentación: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Qué ventajas ofrece frente a Claude Code para el desarrollo web?">
    OpenClaw es un **asistente personal** y una capa de coordinación, no un sustituto del IDE. Utilice Claude Code o Codex para obtener el ciclo de programación directa más rápido dentro de un repositorio. Utilice OpenClaw para disponer de memoria persistente, acceso entre dispositivos y coordinación de herramientas.

    - Memoria persistente y espacio de trabajo entre sesiones.
    - Acceso multiplataforma (Telegram, WhatsApp, TUI, WebChat).
    - Coordinación de herramientas (navegador, archivos, programación, hooks).
    - Gateway siempre activo (ejecútelo en un VPS e interactúe desde cualquier lugar).
    - Nodes para navegador/pantalla/cámara/ejecución locales.

    Muestra: [https://openclaw.ai/showcase](https://openclaw.ai/showcase).

  </Accordion>
</AccordionGroup>

## Skills y automatización

<AccordionGroup>
  <Accordion title="¿Cómo se personalizan las Skills sin mantener modificaciones pendientes en el repositorio?">
    Utilice anulaciones administradas en lugar de editar la copia del repositorio. Coloque los cambios en `~/.openclaw/skills/<name>/SKILL.md` (o añada una carpeta mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json`). Precedencia: `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> incluidas -> `skills.load.extraDirs`, por lo que las anulaciones administradas tienen prioridad sobre las Skills incluidas sin modificar git. Para realizar una instalación global pero limitar la visibilidad a algunos agentes, mantenga la copia compartida en `~/.openclaw/skills` y controle la visibilidad con `agents.defaults.skills` / `agents.list[].skills`. Solo las modificaciones aptas para incorporarse al proyecto original deben enviarse como PR contra la copia del repositorio.
  </Accordion>

  <Accordion title="¿Puedo cargar Skills desde una carpeta personalizada?">
    Sí: añada directorios mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json` (la precedencia más baja en el orden anterior). `clawhub` instala de forma predeterminada en `./skills`, que OpenClaw trata como `<workspace>/skills` en la siguiente sesión. Para limitar la visibilidad a determinados agentes, combínelo con `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="¿Cómo se pueden utilizar distintos modelos o ajustes para diferentes tareas?">
    Patrones compatibles:

    - **Trabajos de Cron**: los trabajos aislados pueden establecer una anulación de `model` por trabajo.
    - **Agentes**: enrute las tareas a agentes independientes con diferentes modelos predeterminados, niveles de razonamiento y parámetros de transmisión.
    - **Cambio bajo demanda**: `/model` cambia el modelo de la sesión actual en cualquier momento.

    Ejemplo: el mismo modelo, con diferentes ajustes por agente:

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

    Coloque los valores predeterminados compartidos por modelo en `agents.defaults.models["provider/model"].params` y después las anulaciones específicas de cada agente en el `agents.list[].params` plano. No duplique el mismo modelo bajo el `agents.list[].models["provider/model"].params` anidado; esa ruta se utiliza para el catálogo de modelos y las anulaciones de ejecución por agente.

    Consulte [Trabajos de Cron](/es/automation/cron-jobs), [Enrutamiento multiagente](/es/concepts/multi-agent), [Configuración](/es/gateway/config-agents), [Comandos con barra](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="El bot se bloquea al realizar trabajo intensivo. ¿Cómo se puede descargar ese trabajo?">
    Utilice **subagentes** para tareas largas o paralelas: se ejecutan en su propia sesión, devuelven un resumen y mantienen el chat principal disponible. Pida al bot que «cree un subagente para esta tarea» o utilice `/subagents`. Utilice `/status` para comprobar si el Gateway está ocupado en ese momento.

    Tanto las tareas largas como los subagentes consumen tokens; establezca un modelo más económico para los subagentes mediante `agents.defaults.subagents.model` si el coste es importante.

    Documentación: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Cómo funcionan en Discord las sesiones de subagentes vinculadas a hilos?">
    Vincule un hilo de Discord a un subagente o destino de sesión para que los mensajes de seguimiento permanezcan en esa sesión vinculada.

    - Créelo con `sessions_spawn` mediante `thread: true` (opcionalmente, `mode: "session"` para el seguimiento persistente).
    - O vincúlelo manualmente con `/focus <target>`.
    - `/agents` inspecciona el estado de vinculación.
    - `/session idle <duration|off>` y `/session max-age <duration|off>` controlan la pérdida automática de foco.
    - `/unfocus` desvincula el hilo.

    Configuración: `session.threadBindings.enabled` (conmutador global), `session.threadBindings.idleHours` (`24` predeterminado; `0` lo desactiva), `session.threadBindings.maxAgeHours` (`0` predeterminado = sin límite estricto) y anulaciones por canal `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`. `channels.discord.threadBindings.spawnSessions` controla la vinculación automática al crear el subagente (`true` predeterminado).

    Documentación: [Subagentes](/es/tools/subagents), [Discord](/es/channels/discord), [Referencia de configuración](/es/gateway/configuration-reference), [Comandos con barra](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagente terminó, pero la actualización de finalización se envió al lugar equivocado o nunca se publicó. ¿Qué se debe comprobar?">
    Compruebe la ruta resuelta del solicitante:

    - La entrega del subagente en modo de finalización prefiere un hilo o una ruta de conversación vinculados cuando existen.
    - Si el origen de finalización solo contiene un canal, OpenClaw recurre a la ruta almacenada de la sesión del solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa aún pueda realizarse correctamente.
    - Sin una ruta vinculada ni una ruta almacenada utilizable: la entrega directa puede fallar y el resultado pasa a la entrega en cola de la sesión en lugar de publicarse inmediatamente.
    - Los destinos no válidos u obsoletos también pueden forzar el uso de la cola o provocar el fallo definitivo de la entrega.
    - Si la última respuesta visible del asistente secundario es exactamente `NO_REPLY` / `no_reply` o `ANNOUNCE_SKIP`, OpenClaw omite intencionadamente el anuncio en lugar de publicar avances anteriores obsoletos.

    Depuración: `openclaw tasks show <lookup>`, donde `<lookup>` es un identificador de tarea, un identificador de ejecución o una clave de sesión.

    Documentación: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks), [Herramientas de sesión](/es/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o los recordatorios no se ejecutan. ¿Qué se debe comprobar?">
    Cron se ejecuta dentro del proceso del Gateway; no se activa si el Gateway no se ejecuta de forma continua.

    - Confirme que cron esté habilitado (`cron.enabled`) y que `OPENCLAW_SKIP_CRON` no esté definido.
    - Confirme que el Gateway se ejecute las 24 horas, todos los días (sin suspensión ni reinicios).
    - Verifique la zona horaria del trabajo (`--tz` frente a la zona horaria del host).

    Depuración:
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [Automatización](/es/automation).

  </Accordion>

  <Accordion title="Cron se ejecutó, pero no se envió nada al canal. ¿Por qué?">
    Compruebe el modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"`: no se espera ningún envío de respaldo del ejecutor.
    - Destino de anuncio ausente o no válido (`channel` / `to`): el ejecutor omitió la entrega saliente.
    - Fallos de autenticación del canal (`unauthorized`, `Forbidden`): el ejecutor intentó realizar la entrega, pero las credenciales lo impidieron.
    - Un resultado aislado silencioso (solo `NO_REPLY` / `no_reply`) se considera intencionadamente no entregable, por lo que también se suprime la entrega de respaldo en cola.

    Para los trabajos cron aislados, el agente aún puede enviar directamente con la herramienta `message` cuando haya una ruta de chat disponible. `--announce` solo controla la entrega de respaldo del ejecutor para el texto final que el propio agente aún no haya enviado.

    Depuración:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Por qué una ejecución cron aislada cambió de modelo o volvió a intentarlo una vez?">
    Esa es la ruta activa de cambio de modelo, no una programación duplicada. El cron aislado conserva una transferencia de modelo en tiempo de ejecución y vuelve a intentarlo cuando la ejecución activa genera `LiveSessionModelSwitchError`, manteniendo el proveedor/modelo cambiado (y cualquier sustitución del perfil de autenticación modificada) antes del nuevo intento.

    Precedencia de selección del modelo: primero, la sustitución del modelo del hook de Gmail (`hooks.gmail.model`); después, el `model` de cada trabajo; luego, cualquier sustitución de modelo almacenada en la sesión cron; y, por último, la selección normal del modelo predeterminado o del agente.

    El bucle de reintentos se limita al intento inicial más 2 reintentos de cambio; después, cron se cancela en lugar de continuar indefinidamente.

    Depuración:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [CLI de cron](/es/cli/cron).

  </Accordion>

  <Accordion title="¿Cómo se instalan Skills en Linux?">
    Utilice comandos nativos de `openclaw skills` o coloque Skills en el espacio de trabajo; la interfaz de Skills de macOS no está disponible en Linux. Explore Skills en [https://clawhub.ai](https://clawhub.ai).

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

    De forma predeterminada, `openclaw skills install` nativo escribe en el directorio `skills/` del espacio de trabajo activo. Añada `--global` para instalar en el directorio compartido de Skills administradas para todos los agentes locales. Instale la CLI independiente `clawhub` únicamente para publicar o sincronizar sus propias Skills. Utilice `agents.defaults.skills` o `agents.list[].skills` para limitar qué agentes pueden ver las Skills compartidas.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ejecutar tareas de forma programada o continuamente en segundo plano?">
    Sí, mediante el programador del Gateway:

    - **Trabajos Cron** para tareas programadas o recurrentes (persisten tras los reinicios).
    - **Heartbeat** para comprobaciones periódicas de la sesión principal.
    - **Trabajos aislados** para agentes autónomos que publican resúmenes o realizan entregas en chats.

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [Automatización](/es/automation), [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title="¿Se pueden ejecutar desde Linux Skills exclusivas de Apple macOS?">
    No directamente. Las Skills de macOS están restringidas por `metadata.openclaw.os` y por los binarios requeridos, y solo se cargan cuando son aptas en el **host del Gateway**. En Linux, las Skills exclusivas de `darwin` (`apple-notes`, `apple-reminders`, `things-mac`) no se cargarán a menos que se anule la restricción.

    Hay tres patrones compatibles:

    **Opción A: ejecutar el Gateway en un Mac (la más sencilla)**. Ejecute el Gateway donde existan los binarios de macOS y conéctese después desde Linux mediante el [modo remoto](#gateway-ports-already-running-and-remote-mode) o Tailscale. Las Skills se cargan normalmente porque el host del Gateway es macOS.

    **Opción B: utilizar un nodo macOS (sin SSH)**. Ejecute el Gateway en Linux, vincule un nodo macOS (aplicación de la barra de menús) y configure **Node Run Commands** como "Always Ask" o "Always Allow" en el Mac. OpenClaw considera aptas las Skills exclusivas de macOS cuando los binarios requeridos existen en el nodo; el agente las ejecuta mediante la herramienta `nodes`. Con "Always Ask", aprobar "Always Allow" en el aviso añade ese comando a la lista de permitidos.

    **Opción C: utilizar binarios de macOS mediante un proxy SSH (avanzada)**. Mantenga el Gateway en Linux, pero haga que los binarios de CLI requeridos se resuelvan como envoltorios SSH que se ejecuten en un Mac; después, modifique la Skill para permitir Linux y que siga siendo apta.

    1. Cree un envoltorio SSH para el binario (ejemplo: `memo` para Apple Notes):
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. Coloque el envoltorio en `PATH` en el host Linux (por ejemplo, `~/bin/memo`).
    3. Modifique los metadatos de la Skill (en el espacio de trabajo o `~/.openclaw/skills`) para permitir Linux:
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

    - **Skill o Plugin personalizado**: la mejor opción para obtener acceso fiable a la API (ambos tienen API).
    - **Automatización del navegador**: funciona sin código, pero es más lenta y frágil.

    Para mantener el contexto por cliente al estilo de una agencia: conserve una página de Notion por cliente (contexto, preferencias y trabajo activo) y solicite al agente que recupere esa página al inicio de cada sesión.

    Para una integración nativa, abra una solicitud de funcionalidad o cree una Skill que utilice esas API.

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Las instalaciones nativas se guardan en el directorio `skills/` del espacio de trabajo activo; utilice `--global` para todos los agentes locales o configure `agents.defaults.skills` / `agents.list[].skills` para limitar la visibilidad. Algunas Skills requieren binarios instalados mediante Homebrew; en Linux, esto implica Linuxbrew.

    Consulte [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config), [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="¿Cómo se utiliza una sesión existente de Chrome con OpenClaw?">
    Utilice el perfil de navegador integrado `user`, que se conecta mediante Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Para utilizar un nombre personalizado, cree un perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Puede utilizar el navegador del host local o un nodo de navegador conectado. Si el Gateway se ejecuta en otro lugar, ejecute un host de nodo en la máquina del navegador o utilice CDP remoto.

    Limitaciones actuales de los perfiles `existing-session` / `user` frente al perfil administrado `openclaw`:

    - `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren referencias de instantáneas, no selectores CSS.
    - Los hooks de carga requieren `ref` o `inputRef`, un archivo cada vez, sin `element` de CSS.
    - `responsebody`, la exportación a PDF, la interceptación de descargas y las acciones por lotes aún requieren la ruta del navegador administrado.

    Consulte [Navegador](/es/tools/browser#existing-session-via-chrome-devtools-mcp) para ver la comparación completa.

  </Accordion>
</AccordionGroup>

## Aislamiento y memoria

<AccordionGroup>
  <Accordion title="¿Existe documentación específica sobre el aislamiento?">
    Sí: [Aislamiento](/es/gateway/sandboxing). Para la configuración específica de Docker (Gateway completo en Docker o imágenes de aislamiento), consulte [Docker](/es/install/docker).
  </Accordion>

  <Accordion title="Docker parece limitado: ¿cómo se habilitan todas las funciones?">
    La imagen predeterminada prioriza la seguridad y se ejecuta como el usuario `node`, por lo que excluye paquetes del sistema, Homebrew y navegadores incluidos. Para obtener una configuración más completa:

    - Mantenga `/home/node` mediante `OPENCLAW_HOME_VOLUME` para que las cachés persistan.
    - Incorpore las dependencias del sistema en la imagen mediante `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Instale los navegadores de Playwright mediante la CLI incluida: `node /app/node_modules/playwright-core/cli.js install chromium`.
    - Defina `PLAYWRIGHT_BROWSERS_PATH` y haga que esa ruta sea persistente.

    Documentación: [Docker](/es/install/docker), [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Se pueden mantener privados los mensajes directos y hacer públicos o aislados los grupos con un solo agente?">
    Sí, si el tráfico privado corresponde a **mensajes directos** y el tráfico público a **grupos**. Configure `agents.defaults.sandbox.mode: "non-main"` para que las sesiones de grupo o canal (claves que no sean la principal) se ejecuten en el backend de aislamiento configurado mientras la sesión principal de mensajes directos permanece en el host. Docker es el backend predeterminado una vez habilitado el aislamiento. Restrinja mediante `tools.sandbox.tools` las herramientas disponibles en las sesiones aisladas.

    Guía de configuración: [Grupos: mensajes directos personales y grupos públicos](/es/channels/groups#pattern-personal-dms-public-groups-single-agent). Referencia principal: [Configuración del Gateway](/es/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="¿Cómo se vincula una carpeta del host con el entorno aislado?">
    Defina `agents.defaults.sandbox.docker.binds` como `["host:container:mode"]` (por ejemplo, `"/home/user/src:/src:ro"`). Las vinculaciones globales y por agente se combinan; las vinculaciones por agente se ignoran cuando `scope: "shared"`. Utilice `:ro` para cualquier contenido confidencial; las vinculaciones evitan las barreras del sistema de archivos del entorno aislado.

    OpenClaw valida los orígenes de las vinculaciones tanto con la ruta normalizada como con la ruta canónica resuelta mediante el antecesor existente más profundo, por lo que los escapes a través de un directorio padre que sea un enlace simbólico se rechazan de forma segura incluso si el segmento final de la ruta todavía no existe.

    Consulte [Aislamiento](/es/gateway/sandboxing#custom-bind-mounts) y [Entorno aislado frente a política de herramientas y modo elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="¿Cómo funciona la memoria?">
    La memoria de OpenClaw consiste en archivos Markdown en el espacio de trabajo del agente: notas diarias en `memory/YYYY-MM-DD.md` y notas seleccionadas a largo plazo en `MEMORY.md` (solo en sesiones principales o privadas).

    OpenClaw también ejecuta un **vaciado silencioso de memoria previo a la compactación** antes de que Compaction resuma la conversación, para recordar al modelo que escriba primero las notas persistentes. Solo se ejecuta cuando se puede escribir en el espacio de trabajo (los entornos aislados de solo lectura lo omiten); deshabilítelo con `agents.defaults.compaction.memoryFlush.enabled: false`. Consulte [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="La memoria sigue olvidando cosas. ¿Cómo se consigue que las recuerde?">
    Solicite al bot que **escriba el dato en la memoria**: las notas a largo plazo se guardan en `MEMORY.md` y el contexto a corto plazo en `memory/YYYY-MM-DD.md`. Recordar al modelo que almacene recuerdos suele resolver el problema. Si continúa olvidándolos, verifique que el Gateway utilice el mismo espacio de trabajo en cada ejecución.

    Documentación: [Memoria](/es/concepts/memory), [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿La memoria persiste para siempre? ¿Cuáles son los límites?">
    Los archivos de memoria residen en el disco y persisten hasta que se eliminan; el límite es el almacenamiento, no el modelo. El **contexto de sesión** sigue estando limitado por la ventana de contexto del modelo, por lo que las conversaciones largas pueden compactarse o truncarse; por eso existe la búsqueda en memoria, que reincorpora al contexto únicamente las partes relevantes.

    Documentación: [Memoria](/es/concepts/memory), [Contexto](/es/concepts/context).

  </Accordion>

  <Accordion title="¿La búsqueda semántica en memoria requiere una clave de API de OpenAI?">
    Solo si se usan **incrustaciones de OpenAI**, que es el proveedor predeterminado. OAuth de Codex cubre el chat y las finalizaciones, pero **no** concede acceso a las incrustaciones, por lo que iniciar sesión con Codex (mediante OAuth o el inicio de sesión de la CLI de Codex) no habilita la búsqueda semántica en memoria. Las incrustaciones de OpenAI siguen necesitando una clave de API real (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Para mantener todo en local, establezca `agents.defaults.memorySearch.provider: "local"` (GGUF/llama.cpp). Otros proveedores compatibles: Bedrock, DeepInfra, Gemini (`GEMINI_API_KEY` o `memorySearch.remote.apiKey`), GitHub Copilot, LM Studio, Mistral, Ollama, compatible con OpenAI y Voyage. Consulte [Memoria](/es/concepts/memory) y [Búsqueda en memoria](/es/concepts/memory-search) para obtener información sobre la configuración.

  </Accordion>
</AccordionGroup>

## Ubicación de los elementos en el disco

<AccordionGroup>
  <Accordion title="¿Todos los datos utilizados con OpenClaw se guardan localmente?">
    No: **el estado propio de OpenClaw es local**, pero **los servicios externos siguen viendo lo que se les envía**.

    - **Local de forma predeterminada**: las sesiones, los archivos de memoria, la configuración y el espacio de trabajo residen en el host del Gateway (`~/.openclaw` más el directorio del espacio de trabajo).
    - **Remoto por necesidad**: los mensajes enviados a proveedores de modelos (Anthropic/OpenAI/etc.) se transmiten a sus API, y las plataformas de chat (Slack/Telegram/WhatsApp/etc.) almacenan los datos de los mensajes en sus servidores.
    - **Se controla el alcance**: los modelos locales mantienen las instrucciones en el equipo, pero el tráfico del canal sigue pasando por los servidores del canal.

    Información relacionada: [Espacio de trabajo del agente](/es/concepts/agent-workspace), [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Dónde almacena OpenClaw sus datos?">
    Todo reside en `$OPENCLAW_STATE_DIR` (valor predeterminado: `~/.openclaw`):

    | Ruta                                                               | Finalidad                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | Configuración principal (JSON5)                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | Importación de OAuth heredada (se copia en los perfiles de autenticación durante el primer uso)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | Perfiles de autenticación (OAuth, claves de API, `keyRef`/`tokenRef` opcionales)        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | Carga secreta opcional respaldada por archivos para proveedores SecretRef de `file`   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | Archivo de compatibilidad heredado (se eliminan las entradas estáticas de `api_key`)        |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | Estado del proveedor (por ejemplo, `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | Estado por agente (agentDir y artefactos de sesiones heredados/archivados)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`  | Estado SQLite por agente, incluidas las filas de sesiones y las transcripciones      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | Orígenes de migración de sesiones heredadas y artefactos de archivo/asistencia      |

    La ruta heredada para un único agente `~/.openclaw/agent/*` se migra mediante `openclaw doctor`.

    El **espacio de trabajo** (AGENTS.md, archivos de memoria, skills, etc.) está separado y se configura mediante `agents.defaults.workspace` (valor predeterminado: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="¿Dónde deben residir AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Estos archivos residen en el **espacio de trabajo del agente**, no en `~/.openclaw`.

    - **Espacio de trabajo (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `memory/YYYY-MM-DD.md` y `HEARTBEAT.md` opcional. La raíz en minúsculas `memory.md` solo sirve como entrada para reparaciones heredadas; `openclaw doctor --fix` puede combinarla con `MEMORY.md` cuando ambas existen.
    - **Directorio de estado (`~/.openclaw`)**: configuración, estado de canales/proveedores, perfiles de autenticación, sesiones, registros y skills compartidas (`~/.openclaw/skills`).

    El espacio de trabajo predeterminado es `~/.openclaw/workspace` y se puede configurar:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si el bot «olvida» después de un reinicio, confirme que el Gateway usa el mismo espacio de trabajo en cada inicio (el modo remoto usa el espacio de trabajo del **host del Gateway**, no el del portátil local).

    Consejo: para que un comportamiento o una preferencia sea duradero, pida al bot que **lo escriba en AGENTS.md o MEMORY.md** en lugar de depender del historial del chat.

    Consulte [Espacio de trabajo del agente](/es/concepts/agent-workspace) y [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Puedo ampliar SOUL.md?">
    Sí. `SOUL.md` es uno de los archivos de arranque del espacio de trabajo que se inyectan en el contexto del agente. El límite predeterminado de inyección por archivo es de `20000` caracteres; el presupuesto total de arranque para todos los archivos es de `60000` caracteres.

    Cambie los valores predeterminados compartidos:

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

    O sobrescriba la configuración de un agente en `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars`.

    Use `/context` para comprobar los tamaños sin procesar y los inyectados, así como si se produjo un truncamiento. Mantenga `SOUL.md` centrado en la voz, la postura y la personalidad; coloque las reglas operativas en `AGENTS.md` y los datos duraderos en la memoria.

    Consulte [Contexto](/es/concepts/context) y [Configuración del agente](/es/gateway/config-agents).

  </Accordion>

  <Accordion title="Estrategia de copia de seguridad recomendada">
    Coloque el **espacio de trabajo del agente** en un repositorio git **privado** y haga una copia de seguridad en una ubicación privada (por ejemplo, GitHub privado). Esto conserva la memoria junto con los archivos AGENTS/SOUL/USER y permite restaurar posteriormente la «mente» del asistente.

    **No** confirme nada que se encuentre en `~/.openclaw` (credenciales, sesiones, tokens y cargas de secretos cifrados). Para una restauración completa, haga copias de seguridad separadas del espacio de trabajo y del directorio de estado.

    Documentación: [Espacio de trabajo del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿Cómo se desinstala completamente OpenClaw?">
    Consulte [Desinstalación](/es/install/uninstall).
  </Accordion>

  <Accordion title="¿Pueden los agentes trabajar fuera del espacio de trabajo?">
    Sí. El espacio de trabajo es el **cwd predeterminado** y el punto de referencia de la memoria, no un entorno aislado estricto. Las rutas relativas se resuelven dentro del espacio de trabajo; las rutas absolutas pueden acceder a otras ubicaciones del host, salvo que se haya habilitado el aislamiento. Para disponer de aislamiento, use [`agents.defaults.sandbox`](/es/gateway/sandboxing) o la configuración de aislamiento por agente. Para convertir un repositorio en el directorio de trabajo predeterminado, apunte el `workspace` de ese agente a la raíz del repositorio; el propio repositorio de OpenClaw es solo código fuente, por lo que conviene mantener separado el espacio de trabajo, a menos que se pretenda expresamente que el agente trabaje dentro de él.

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
    El estado de las sesiones pertenece al **host del Gateway**. En modo remoto, el almacén de sesiones relevante se encuentra en la máquina remota, no en el portátil local. Consulte [Gestión de sesiones](/es/concepts/session).
  </Accordion>
</AccordionGroup>

## Aspectos básicos de la configuración

<AccordionGroup>
  <Accordion title="¿Qué formato tiene la configuración? ¿Dónde se encuentra?">
    OpenClaw lee una configuración **JSON5** opcional desde `$OPENCLAW_CONFIG_PATH` (valor predeterminado: `~/.openclaw/openclaw.json`). Si falta el archivo, utiliza valores predeterminados relativamente seguros, incluido un espacio de trabajo predeterminado en `~/.openclaw/workspace`.
  </Accordion>

  <Accordion title='He establecido gateway.bind: "lan" (o "tailnet") y ahora no hay ningún proceso escuchando o la interfaz indica que no hay autorización'>
    Las vinculaciones que no sean de bucle invertido **requieren una ruta válida de autenticación del Gateway**: autenticación mediante secreto compartido (token o contraseña), o `gateway.auth.mode: "trusted-proxy"` detrás de un proxy inverso con reconocimiento de identidad configurado correctamente.

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

    - `gateway.remote.token` / `.password` **no** habilitan por sí mismos la autenticación local del Gateway; las rutas de llamadas locales solo pueden usar `gateway.remote.*` como alternativa cuando `gateway.auth.*` no está establecido.
    - Para la autenticación mediante contraseña, establezca `gateway.auth.mode: "password"` junto con `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Si `gateway.auth.token` / `.password` se configura explícitamente mediante SecretRef y no se resuelve, la resolución se cierra de forma segura (ninguna alternativa remota lo oculta).
    - Las configuraciones de la interfaz de control con secreto compartido se autentican mediante `connect.params.auth.token` o `connect.params.auth.password` (almacenado en la configuración de la aplicación/interfaz). Los modos basados en identidad, como Tailscale Serve o `trusted-proxy`, usan en su lugar encabezados de solicitud; evite incluir secretos compartidos en las URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, los proxies inversos de bucle invertido en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito y una entrada de bucle invertido en `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="¿Por qué se necesita ahora un token en localhost?">
    OpenClaw exige de forma predeterminada la autenticación del Gateway, incluido el bucle invertido. Si no se configura ninguna ruta de autenticación explícita, el inicio selecciona el modo de token y genera un token válido únicamente durante ese inicio, por lo que los clientes WS locales deben autenticarse. Esto impide que otros procesos locales llamen al Gateway.

    Configure explícitamente `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` o `OPENCLAW_GATEWAY_PASSWORD` cuando los clientes necesiten un secreto estable entre reinicios. También puede elegir el modo de contraseña o `trusted-proxy` para proxies inversos con reconocimiento de identidad. Para un bucle invertido abierto, establezca explícitamente `gateway.auth.mode: "none"`. `openclaw doctor --generate-gateway-token` genera un token en cualquier momento.

  </Accordion>

  <Accordion title="¿Es necesario reiniciar después de cambiar la configuración?">
    El Gateway supervisa la configuración y admite la recarga en caliente: `gateway.reload.mode: "hybrid"` (valor predeterminado) aplica en caliente los cambios seguros y reinicia para los críticos. También se admiten `hot`, `restart` y `off`. La mayoría de los cambios de `tools.*`, políticas de `agents.*`, `session.*` y `messages.*` se aplican inmediatamente sin ninguna acción de recarga; los cambios de vinculación/puerto de `gateway.*` requieren un reinicio.
  </Accordion>

  <Accordion title="¿Cómo se desactivan los eslóganes humorísticos de la CLI?">
    Establezca `cli.banner.taglineMode`:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: oculta el texto del eslogan, pero conserva la línea de título/versión del banner.
    - `default`: siempre usa `All your chats, one OpenClaw.`.
    - `random`: eslóganes humorísticos/de temporada rotatorios (comportamiento predeterminado).
    - Para no mostrar ningún banner, establezca la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="¿Cómo se habilitan la búsqueda web y la obtención de contenido web?">
    `web_fetch` funciona sin una clave de API. `web_search` depende del proveedor seleccionado:

    | Proveedor | Sin clave | Variable(s) de entorno |
    | --- | --- | --- |
    | Brave | No | `BRAVE_API_KEY` |
    | DuckDuckGo | Sí (no oficial, basado en HTML) | - |
    | Exa | No | `EXA_API_KEY` |
    | Firecrawl | No | `FIRECRAWL_API_KEY` |
    | Gemini | No | `GEMINI_API_KEY` |
    | Grok | No (OAuth de xAI o clave) | `XAI_API_KEY` |
    | Kimi | No | `KIMI_API_KEY` o `MOONSHOT_API_KEY` |
    | MiniMax Search | No | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY` |
    | Ollama Web Search | Sí (requiere `ollama signin`) | - |
    | Perplexity | No | `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY` |
    | SearXNG | Sí (autohospedado) | `SEARXNG_BASE_URL` |
    | Tavily | No | `TAVILY_API_KEY` |

    Grok también puede reutilizar el OAuth de xAI de la autenticación del modelo (`openclaw onboard --auth-choice xai-oauth`).

    **Recomendado**: `openclaw configure --section web` y elegir un proveedor.

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
            provider: "firecrawl", // opcional; omitir para la detección automática
          },
        },
      },
    }
    ```

    La configuración de búsqueda web específica de cada proveedor se encuentra en `plugins.entries.<plugin>.config.webSearch.*`. Las rutas de proveedores heredadas de `tools.web.search.*` aún se cargan por compatibilidad, pero no deben utilizarse en configuraciones nuevas. La configuración de reserva de obtención web de Firecrawl se encuentra en `plugins.entries.firecrawl.config.webFetch.*`.

    - Listas de permitidos: añadir `web_search`/`web_fetch`/`x_search`, o `group:web` para los tres.
    - `web_fetch` está habilitado de forma predeterminada.
    - Si se omite `tools.web.fetch.provider`, OpenClaw detecta automáticamente el primer proveedor de reserva de obtención listo a partir de las credenciales disponibles; el Plugin oficial de Firecrawl proporciona esa reserva.
    - Los demonios leen las variables de entorno de `~/.openclaw/.env` (o del entorno del servicio).

    Documentación: [Herramientas web](/es/tools/web).

  </Accordion>

  <Accordion title="config.apply borró mi configuración. ¿Cómo puedo recuperarla y evitar que vuelva a ocurrir?">
    `config.apply` reemplaza la **configuración completa**; un objeto parcial elimina todo lo demás.

    La versión actual de OpenClaw protege contra la mayoría de las sobrescrituras accidentales:

    - Las escrituras de configuración propiedad de OpenClaw validan toda la configuración posterior al cambio antes de escribirla.
    - Las escrituras no válidas o destructivas propiedad de OpenClaw se rechazan y se guardan como `openclaw.json.rejected.*`.
    - Una edición directa que impida el inicio o la recarga en caliente hace que el Gateway se cierre de forma segura o que omita la recarga; no reescribe `openclaw.json`.
    - `openclaw doctor --fix` se encarga de la reparación, puede restaurar la última configuración válida conocida y guarda el archivo rechazado como `openclaw.json.clobbered.*`.

    Recuperación:

    - Comprobar `openclaw logs --follow` para buscar `Invalid config at`, `Config write rejected:` o `config reload skipped (invalid config)`.
    - Inspeccionar el `openclaw.json.clobbered.*` o `openclaw.json.rejected.*` más reciente junto a la configuración activa.
    - Ejecutar `openclaw config validate` y `openclaw doctor --fix`.
    - Volver a copiar únicamente las claves previstas con `openclaw config set` o `config.patch`.
    - Si no existe una última configuración válida conocida ni una carga rechazada: restaurar desde una copia de seguridad, o volver a ejecutar `openclaw doctor` y reconfigurar los canales/modelos.
    - En caso de pérdida inesperada: informar de un error e incluir la última configuración conocida o una copia de seguridad. Un agente de programación local a menudo puede reconstruir una configuración funcional a partir de los registros o el historial.

    Para evitarlo: utilizar `openclaw config set` para cambios pequeños, `openclaw configure` para ediciones interactivas, `config.schema.lookup` para inspeccionar una ruta desconocida (devuelve un nodo de esquema superficial junto con resúmenes de sus elementos secundarios inmediatos) y `config.patch` para ediciones RPC parciales; reservar `config.apply` para reemplazar la configuración completa. La herramienta de tiempo de ejecución `gateway` orientada al agente se niega a reescribir `tools.exec.ask` / `tools.exec.security`, incluso mediante los alias heredados `tools.bash.*`.

    Documentación: [Configuración](/es/cli/config), [Configurar](/es/cli/configure), [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Cómo ejecuto un Gateway central con trabajadores especializados distribuidos entre varios dispositivos?">
    Patrón habitual: **un Gateway** (por ejemplo, una Raspberry Pi), además de **nodos** y **agentes**.

    - **Gateway (central)**: gestiona los canales (Signal/WhatsApp), el enrutamiento y las sesiones.
    - **Nodos (dispositivos)**: los equipos Mac y dispositivos iOS/Android se conectan como periféricos y exponen herramientas locales (`system.run`, `canvas`, `camera`).
    - **Agentes (trabajadores)**: cerebros/espacios de trabajo independientes para funciones especiales (por ejemplo, operaciones frente a datos personales).
    - **Subagentes**: generan trabajo en segundo plano desde un agente principal para ejecutarlo en paralelo.
    - **TUI**: se conecta al Gateway y permite cambiar de agente o sesión.

    Documentación: [Nodos](/es/nodes), [Acceso remoto](/es/gateway/remote), [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [TUI](/es/web/tui).

  </Accordion>

  <Accordion title="¿Puede ejecutarse sin interfaz gráfica el navegador de OpenClaw?">
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

    El valor predeterminado es `false` (con interfaz gráfica). El modo sin interfaz gráfica tiene más probabilidades de activar comprobaciones contra bots en algunos sitios (X/Twitter suele bloquear las sesiones sin interfaz gráfica). Utiliza el mismo motor Chromium y funciona para la mayoría de las automatizaciones; la diferencia principal es que no hay una ventana visible del navegador (utilizar capturas de pantalla para el contenido visual). Consultar [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Cómo utilizo Brave para controlar el navegador?">
    Establecer `browser.executablePath` en el binario de Brave (o de cualquier navegador basado en Chromium) y reiniciar el Gateway. Consultar [Navegador](/es/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways y nodos remotos

<AccordionGroup>
  <Accordion title="¿Cómo se propagan los comandos entre Telegram, el Gateway y los nodos?">
    Los mensajes de Telegram son gestionados por el **Gateway**, que ejecuta el agente y solo entonces llama a los nodos mediante el **WebSocket del Gateway** cuando se necesita una herramienta de nodo:

    Telegram -> Gateway -> Agente -> `node.*` -> Nodo -> Gateway -> Telegram

    Los nodos no ven el tráfico entrante del proveedor; solo reciben llamadas RPC de nodo.

  </Accordion>

  <Accordion title="¿Cómo puede acceder mi agente a mi equipo si el Gateway está alojado de forma remota?">
    Emparejar el equipo como un **nodo**. El Gateway se ejecuta en otro lugar, pero puede llamar a las herramientas `node.*` (pantalla, cámara, sistema) del equipo local mediante el WebSocket del Gateway.

    1. Ejecutar el Gateway en el host que permanece siempre encendido (VPS/servidor doméstico).
    2. Colocar el host del Gateway y el equipo en la misma red de Tailscale.
    3. Asegurarse de que el WebSocket del Gateway sea accesible (vinculación a la red de Tailscale o túnel SSH).
    4. Abrir localmente la aplicación para macOS y conectarse en el modo **Remoto mediante SSH** (o directamente mediante la red de Tailscale) para que se registre como nodo.
    5. Aprobar el nodo:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    No se requiere un puente TCP independiente; los nodos se conectan mediante el WebSocket del Gateway.

    Recordatorio de seguridad: emparejar un nodo macOS permite `system.run` en ese equipo. Emparejar únicamente dispositivos de confianza; consultar [Seguridad](/es/gateway/security).

    Documentación: [Nodos](/es/nodes), [Protocolo del Gateway](/es/gateway/protocol), [Modo remoto de macOS](/es/platforms/mac/remote), [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="Tailscale está conectado, pero no recibo respuestas. ¿Qué debo hacer?">
    Comprobar los aspectos básicos:

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    A continuación, verificar la autenticación y el enrutamiento: si se utiliza Tailscale Serve, confirmar que `gateway.auth.allowTailscale` esté configurado correctamente; si la conexión se realiza mediante un túnel SSH, confirmar que el túnel esté activo y apunte al puerto correcto; confirmar que las listas de permitidos de mensajes directos/grupos incluyan la cuenta correspondiente.

    Documentación: [Tailscale](/es/gateway/tailscale), [Acceso remoto](/es/gateway/remote), [Canales](/es/channels).

  </Accordion>

  <Accordion title="¿Pueden comunicarse entre sí dos instancias de OpenClaw (local + VPS)?">
    Sí, aunque no existe un puente integrado entre bots.

    **Opción más sencilla**: utilizar un canal de chat normal al que ambos bots puedan acceder (Slack/Telegram/WhatsApp). Hacer que el Bot A envíe un mensaje al Bot B y permitir que el Bot B responda con normalidad.

    **Puente de CLI (genérico)**: ejecutar un script que llame al otro Gateway con `openclaw agent --message ... --deliver`, dirigido a un chat en el que escuche el otro bot. Si uno de los bots se encuentra en una VPS remota, dirigir la CLI a ese Gateway remoto mediante SSH/Tailscale (consultar [Acceso remoto](/es/gateway/remote)):

    ```bash
    openclaw agent --message "Hola desde el bot local" --deliver --channel telegram --reply-to <chat-id>
    ```

    Añadir una medida de protección para que los dos bots no entren en un bucle infinito (solo menciones, listas de canales permitidos o una regla de «no responder a mensajes de bots»).

    Documentación: [Acceso remoto](/es/gateway/remote), [CLI del agente](/es/cli/agent), [Envío del agente](/es/tools/agent-send).

  </Accordion>

  <Accordion title="¿Necesito VPS independientes para varios agentes?">
    No. Un Gateway aloja varios agentes, cada uno con su propio espacio de trabajo, valores predeterminados de modelo y enrutamiento; esta es la configuración habitual y resulta mucho más económica y sencilla que utilizar una VPS por agente. Utilizar VPS independientes únicamente para un aislamiento estricto (límites de seguridad) o para configuraciones muy diferentes que no se quieran compartir.
  </Accordion>

  <Accordion title="¿Ofrece alguna ventaja utilizar un nodo en mi portátil personal en lugar de SSH desde una VPS?">
    Sí: los nodos son la forma principal de acceder al portátil desde un Gateway remoto y permiten mucho más que el acceso al shell. El Gateway se ejecuta en macOS/Linux (Windows mediante WSL2) y es ligero (basta con una VPS pequeña o un equipo de la categoría de Raspberry Pi; 4 GB de RAM son suficientes), por lo que una configuración habitual consiste en un host siempre encendido y el portátil como nodo.

    - **No se requiere SSH entrante**: los nodos establecen una conexión saliente con el WebSocket del Gateway mediante el emparejamiento de dispositivos.
    - **Controles de ejecución más seguros**: `system.run` está restringido mediante listas de permitidos/aprobaciones del nodo en ese portátil.
    - **Más herramientas de dispositivo**: además de `system.run`, los nodos exponen `canvas`, `camera` y `screen`.
    - **Automatización local del navegador**: mantener el Gateway en una VPS, pero ejecutar Chrome localmente mediante un host de nodo, o conectarse a la instancia local de Chrome mediante Chrome MCP.

    SSH resulta adecuado para el acceso puntual al shell; los nodos son más sencillos para flujos de trabajo continuos de agentes y para automatizar dispositivos.

    Documentación: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes), [Navegador](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Ejecutan los nodos un servicio de Gateway?">
    No. Solo debe ejecutarse **un Gateway** por host, a menos que se ejecuten intencionadamente perfiles aislados (consultar [Varios Gateways](/es/gateway/multiple-gateways)). Los nodos son periféricos que se conectan al Gateway (nodos iOS/Android o el «modo nodo» de macOS en la aplicación de la barra de menús). Para hosts de nodo sin interfaz gráfica y control mediante CLI, consultar [CLI del host de nodo](/es/cli/node).

    Se requiere un reinicio completo para `gateway`, `discovery` y los cambios en las superficies de Plugin alojadas.

  </Accordion>

  <Accordion title="¿Existe una forma de aplicar la configuración mediante API / RPC?">
    Sí:

    - `config.schema.lookup`: inspecciona un subárbol de configuración con su nodo de esquema superficial, la sugerencia de interfaz coincidente y los resúmenes de sus elementos secundarios inmediatos antes de escribir.
    - `config.get`: obtiene la instantánea actual junto con el hash.
    - `config.patch`: actualización parcial segura (preferida para la mayoría de las ediciones RPC); recarga en caliente cuando es posible y reinicia cuando es necesario.
    - `config.apply`: valida y reemplaza la configuración completa; recarga en caliente cuando es posible y reinicia cuando es necesario.
    - La herramienta de ejecución `gateway` orientada al agente sigue negándose a reescribir `tools.exec.ask` / `tools.exec.security`; los alias heredados `tools.bash.*` se normalizan a las mismas rutas protegidas.

  </Accordion>

  <Accordion title="Configuración mínima razonable para una primera instalación">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Establece el espacio de trabajo y restringe quién puede activar el bot.

  </Accordion>

  <Accordion title="¿Cómo configuro Tailscale en un VPS y me conecto desde mi Mac?">
    1. **Instala e inicia sesión en el VPS**:
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. **Instala e inicia sesión en tu Mac** mediante la aplicación Tailscale, en la misma tailnet.
    3. **Activa MagicDNS** en la consola de administración de Tailscale para que el VPS tenga un nombre estable.
    4. **Usa el nombre de host de la tailnet**: SSH `ssh user@your-vps.tailnet-xxxx.ts.net`; WS del Gateway `ws://your-vps.tailnet-xxxx.ts.net:18789`.

    Para usar la interfaz de control sin SSH, utiliza Tailscale Serve en el VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Esto mantiene el Gateway vinculado a la interfaz de bucle invertido y expone HTTPS mediante Tailscale. Consulta [Tailscale](/es/gateway/tailscale).

  </Accordion>

  <Accordion title="¿Cómo conecto un Node Mac a un Gateway remoto (Tailscale Serve)?">
    Serve expone la **interfaz de control del Gateway + WS**; los Nodes se conectan mediante el mismo punto de conexión WS del Gateway.

    1. Asegúrate de que el VPS y el Mac estén en la misma tailnet.
    2. Usa la aplicación de macOS en modo remoto (el destino SSH puede ser el nombre de host de la tailnet); esta crea un túnel para el puerto del Gateway y se conecta como Node.
    3. Aprueba el Node:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentación: [Protocolo del Gateway](/es/gateway/protocol), [Detección](/es/gateway/discovery), [modo remoto de macOS](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Debo instalarlo en un segundo portátil o simplemente añadir un Node?">
    Para usar **solo herramientas locales** (pantalla/cámara/ejecución) en el segundo portátil, añádelo como **Node**: un Gateway, sin configuración duplicada. Actualmente, las herramientas locales de Node solo están disponibles en macOS. Instala un segundo Gateway únicamente para obtener **aislamiento estricto** o dos bots completamente independientes.

    Documentación: [Nodes](/es/nodes), [CLI de Nodes](/es/cli/nodes), [Varios Gateways](/es/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables de entorno y carga de .env

<AccordionGroup>
  <Accordion title="¿Cómo carga OpenClaw las variables de entorno?">
    OpenClaw lee las variables de entorno del proceso principal (shell, launchd/systemd, CI, etc.) y además carga:

    - `.env` desde el directorio de trabajo actual.
    - un respaldo global `.env` desde `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`).

    Ninguno de los archivos `.env` sobrescribe las variables de entorno existentes. Las claves de credenciales de proveedores y enrutamiento de puntos de conexión son una excepción para el `.env` del espacio de trabajo: las claves como `GEMINI_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY` o cualquier clave que termine en `_ENDPOINT` (y otras variables de entorno de autenticación o puntos de conexión de proveedores incluidos) se ignoran en el `.env` del espacio de trabajo y deben estar en el entorno del proceso, `~/.openclaw/.env` o la configuración `env`.

    Las variables de entorno incorporadas en la configuración solo se aplican si no existen en el entorno del proceso:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Consulta [/environment](/es/help/environment) para conocer todas las fuentes y el orden de precedencia.

  </Accordion>

  <Accordion title="Inicié el Gateway mediante el servicio y mis variables de entorno desaparecieron. ¿Qué hago ahora?">
    Hay dos soluciones:

    1. Coloca las claves que faltan en `~/.openclaw/.env` para que se carguen incluso cuando el servicio no herede el entorno del shell.
    2. Activa la importación del shell (función opcional):
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
       Esto ejecuta el shell de inicio de sesión e importa únicamente las claves esperadas que falten (nunca las sobrescribe). Variables de entorno equivalentes: `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='He definido COPILOT_GITHUB_TOKEN, pero el estado de los modelos muestra "Shell env: off." ¿Por qué?'>
    `openclaw models status` indica si la **importación del entorno del shell** está activada. "Shell env: off" **no** significa que falten variables de entorno; solo significa que OpenClaw no cargará automáticamente el shell de inicio de sesión.

    Si el Gateway se ejecuta como servicio (launchd/systemd), no heredará el entorno del shell. Para solucionarlo, coloca el token en `~/.openclaw/.env`, activa `env.shellEnv.enabled: true` o añádelo a la configuración `env` (solo se aplica si falta); después, reinicia el Gateway y vuelve a comprobarlo:

    ```bash
    openclaw models status
    ```

    Los tokens de Copilot se resuelven en este orden: `OPENCLAW_GITHUB_TOKEN`, después `COPILOT_GITHUB_TOKEN`, luego `GH_TOKEN` y, por último, `GITHUB_TOKEN`.

    Consulta [/concepts/model-providers](/es/concepts/model-providers) y [/environment](/es/help/environment).

  </Accordion>
</AccordionGroup>

## Sesiones y varios chats

<AccordionGroup>
  <Accordion title="¿Cómo inicio una conversación nueva?">
    Envía `/new` o `/reset` como mensaje independiente. Consulta [Gestión de sesiones](/es/concepts/session).
  </Accordion>

  <Accordion title="¿Las sesiones se restablecen automáticamente si nunca envío /new?">
    Sí. La política de restablecimiento predeterminada es **diaria**: una sesión cambia a una nueva a una hora local configurada en el host del Gateway (`session.reset.atHour`, valor predeterminado `4`, 0-23), según el momento en que se inició la sesión actual. Como alternativa, cambia al restablecimiento por inactividad mediante `mode: "idle"` y `session.reset.idleMinutes`, que hace caducar una sesión después de un período de inactividad (según la última interacción real, no los eventos del sistema de Heartbeat/Cron/ejecución).

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

    `resetByType` admite `direct` (alias heredado `dm`), `group` y `thread`. El valor heredado de nivel superior `session.idleMinutes` sigue funcionando como alias de compatibilidad para un valor predeterminado del modo de inactividad cuando no se ha definido ningún bloque `session.reset`/`resetByType`. Las sesiones con una sesión CLI activa propiedad del proveedor no se interrumpen por el valor predeterminado diario implícito. Consulta [Gestión de sesiones](/es/concepts/session) para conocer el ciclo de vida completo.

  </Accordion>

  <Accordion title="¿Se puede crear un equipo de instancias de OpenClaw (un director ejecutivo y muchos agentes)?">
    Sí, mediante el **enrutamiento multiagente** y los **subagentes**: un agente coordinador y varios agentes de trabajo con sus propios espacios de trabajo y modelos.

    Es mejor considerarlo un experimento entretenido: consume muchos tokens y suele ser menos eficiente que un único bot con sesiones independientes. El modelo habitual consiste en un bot con el que se interactúa, con distintas sesiones para realizar trabajo en paralelo y que crea subagentes cuando es necesario.

    Documentación: [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [CLI de agentes](/es/cli/agents).

  </Accordion>

  <Accordion title="¿Por qué se truncó el contexto a mitad de una tarea? ¿Cómo puedo evitarlo?">
    El contexto de la sesión está limitado por la ventana del modelo. Los chats largos, las salidas extensas de herramientas o muchos archivos pueden activar Compaction o el truncamiento.

    - Pide al bot que resuma el estado actual y lo escriba en un archivo.
    - Usa `/compact` antes de tareas largas y `/new` al cambiar de tema.
    - Conserva el contexto importante en el espacio de trabajo y pide al bot que vuelva a leerlo.
    - Usa subagentes para trabajos largos o en paralelo, de modo que el chat principal se mantenga más pequeño.
    - Elige un modelo con una ventana de contexto mayor si esto ocurre con frecuencia.

  </Accordion>

  <Accordion title="¿Cómo restablezco OpenClaw por completo sin desinstalarlo?">
    ```bash
    openclaw reset
    ```

    Restablecimiento completo no interactivo:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Después, vuelve a ejecutar la configuración:

    ```bash
    openclaw onboard --install-daemon
    ```

    La incorporación también ofrece **Restablecer** si detecta una configuración existente; consulta [Incorporación (CLI)](/es/start/wizard). Si usaste perfiles (`--profile` / `OPENCLAW_PROFILE`), restablece cada directorio de estado (valor predeterminado `~/.openclaw-<profile>`). Restablecimiento exclusivo para desarrollo: `openclaw gateway --dev --reset` elimina la configuración de desarrollo, las credenciales, las sesiones y el espacio de trabajo.

  </Accordion>

  <Accordion title='Recibo errores de "context too large"; ¿cómo restablezco o compacto?'>
    - **Compactar** (conserva la conversación y resume los turnos anteriores): `/compact` o `/compact <instructions>` para orientar el resumen.
    - **Restablecer** (nuevo ID de sesión para la misma clave de chat): `/new` o `/reset`.

    Si sigue ocurriendo, ajusta la **depuración de sesiones** (`agents.defaults.contextPruning`) para recortar las salidas antiguas de herramientas o usa un modelo con una ventana de contexto mayor.

    Documentación: [Compaction](/es/concepts/compaction), [Depuración de sesiones](/es/concepts/session-pruning), [Gestión de sesiones](/es/concepts/session).

  </Accordion>

  <Accordion title='¿Por qué aparece "LLM request rejected: messages.content.tool_use.input field required"?'>
    Error de validación del proveedor: el modelo emitió un bloque `tool_use` sin el campo obligatorio `input`. Normalmente significa que el historial de la sesión está obsoleto o dañado (a menudo después de hilos largos o de un cambio en una herramienta o esquema).

    Solución: inicia una sesión nueva con `/new` (mensaje independiente).

  </Accordion>

  <Accordion title="¿Por qué recibo mensajes de Heartbeat cada 30 minutos?">
    Los Heartbeats se ejecutan cada **30m** de forma predeterminada, o cada **1h** cuando el modo de autenticación resuelto es OAuth/autenticación mediante token de Anthropic (incluida la reutilización de la CLI de Claude) y `heartbeat.every` no está definido. Ajústalos o desactívalos:

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

    Si existe `HEARTBEAT.md` pero está efectivamente vacío (solo contiene líneas en blanco, comentarios Markdown/HTML, encabezados ATX, marcadores de bloques delimitados o elementos de lista vacíos), OpenClaw omite la ejecución del Heartbeat para ahorrar llamadas a la API. Si falta el archivo, el Heartbeat se ejecuta de todos modos y el modelo decide qué hacer.

    Las sustituciones por agente usan `agents.list[].heartbeat`. Documentación: [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title='¿Necesito añadir una "cuenta de bot" a un grupo de WhatsApp?'>
    No. OpenClaw se ejecuta en **tu propia cuenta**: si perteneces al grupo, OpenClaw puede verlo. De forma predeterminada, las respuestas en grupos están bloqueadas hasta que se permiten remitentes (`groupPolicy: "allowlist"`).

    Para restringir las respuestas del grupo únicamente a ti:

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
    La forma más rápida es seguir los registros y enviar un mensaje de prueba al grupo.

    ```bash
    openclaw logs --follow --json
    ```

    Busca `chatId` (o `from`) que termine en `@g.us`, como `1234567890-1234567890@g.us`.

    Si ya está configurado o incluido en la lista de permitidos, enumera los grupos desde la configuración:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentación: [WhatsApp](/es/channels/whatsapp), [Directorio](/es/cli/directory), [Registros](/es/cli/logs).

  </Accordion>

  <Accordion title="¿Por qué OpenClaw no responde en un grupo?">
    Dos causas habituales: la restricción por mención está activada de forma predeterminada (se debe mencionar al bot con @ o coincidir con `mentionPatterns`), o se configuró `channels.whatsapp.groups` sin `"*"` y el grupo no está en la lista de permitidos.

    Consulte [Grupos](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).

  </Accordion>

  <Accordion title="¿Los grupos/hilos comparten contexto con los mensajes directos?">
    De forma predeterminada, los chats directos se agrupan en la sesión principal. Los grupos/canales tienen sus propias claves de sesión, y los temas de Telegram y los hilos de Discord son sesiones independientes. Consulte [Grupos](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).
  </Accordion>

  <Accordion title="¿Cuántos espacios de trabajo y agentes se pueden crear?">
    No hay límites estrictos: se pueden usar decenas o incluso cientos, pero se debe vigilar lo siguiente:

    - **Crecimiento del disco**: las sesiones activas y las transcripciones residen en la base de datos SQLite de cada agente; los artefactos heredados o archivados aún pueden acumularse en `~/.openclaw/agents/<agentId>/sessions/`.
    - **Coste de tokens**: más agentes implican un mayor uso simultáneo de modelos.
    - **Carga operativa**: perfiles de autenticación, espacios de trabajo y enrutamiento de canales por agente.

    Mantenga un espacio de trabajo **activo** por agente (`agents.defaults.workspace`), elimine las sesiones antiguas con `openclaw sessions cleanup` si aumenta el uso del disco (no edite manualmente el estado activo de SQLite) y use `openclaw doctor` para detectar espacios de trabajo aislados e incompatibilidades entre perfiles.

  </Accordion>

  <Accordion title="¿Se pueden ejecutar varios bots o chats al mismo tiempo (Slack) y cómo deben configurarse?">
    Sí, mediante el **enrutamiento multiagente**: ejecute varios agentes aislados y enrute los mensajes entrantes por canal/cuenta/interlocutor. Slack es compatible como canal y puede vincularse a agentes específicos.

    El acceso mediante navegador es potente, pero no permite «hacer cualquier cosa que pueda hacer una persona»: las medidas antibots, los CAPTCHA y la MFA aún pueden bloquear la automatización. Para lograr el control más fiable, use Chrome MCP localmente en el host o CDP en el equipo que ejecuta realmente el navegador.

    Configuración recomendada: un host del Gateway siempre activo (VPS/Mac mini), un agente por función (vinculaciones), los canales de Slack vinculados a esos agentes y un navegador local mediante Chrome MCP o un Node cuando sea necesario.

    Documentación: [Enrutamiento multiagente](/es/concepts/multi-agent), [Slack](/es/channels/slack), [Navegador](/es/tools/browser), [Nodes](/es/nodes).

  </Accordion>
</AccordionGroup>

## Modelos, conmutación por error y perfiles de autenticación

Las preguntas y respuestas sobre modelos (valores predeterminados, selección, alias, cambio, conmutación por error y perfiles de autenticación) se encuentran en las [Preguntas frecuentes sobre modelos](/es/help/faq-models).

## Gateway: puertos, «ya está en ejecución» y modo remoto

<AccordionGroup>
  <Accordion title="¿Qué puerto utiliza el Gateway?">
    `gateway.port` controla el único puerto multiplexado para WebSocket + HTTP (interfaz de control, hooks, etc.). Precedencia:

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > valor predeterminado 18789
    ```

  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status indica "Runtime: running", pero "Connectivity probe: failed"?'>
    «En ejecución» es la perspectiva del **supervisor** (launchd/systemd/schtasks); la prueba de conectividad corresponde a la CLI conectándose realmente al WebSocket del Gateway. Confíe en estas líneas de `openclaw gateway status`: `Probe target:` (la URL que usó la prueba), `Listening:` (lo que está realmente vinculado al puerto), `Last gateway error:` (causa raíz habitual cuando el proceso está activo, pero el puerto no está escuchando).
  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status muestra valores distintos para "Config (cli)" y "Config (service)"?'>
    Se está editando un archivo de configuración mientras el servicio utiliza otro (a menudo, una incompatibilidad entre `--profile` y `OPENCLAW_STATE_DIR`).

    Para corregirlo, ejecute lo siguiente desde el mismo `--profile` o entorno que deba utilizar el servicio:

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='¿Qué significa "another gateway instance is already listening"?'>
    OpenClaw aplica un bloqueo de ejecución vinculando el listener de WebSocket inmediatamente durante el inicio (valor predeterminado: `ws://127.0.0.1:18789`). Si la vinculación falla con `EADDRINUSE`, se genera `GatewayLockError` («ya hay otra instancia del Gateway escuchando»).

    Solución: detenga la otra instancia, libere el puerto o ejecute con `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="¿Cómo se ejecuta OpenClaw en modo remoto (el cliente se conecta a un Gateway ubicado en otro lugar)?">
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

    - `openclaw gateway` solo se inicia cuando `gateway.mode` es `local` (o se proporciona una marca de anulación).
    - La aplicación de macOS supervisa el archivo de configuración y cambia de modo en tiempo real cuando se modifican estos valores.
    - `gateway.remote.token` / `.password` son únicamente credenciales remotas del lado del cliente; no habilitan por sí solas la autenticación del Gateway local.

  </Accordion>

  <Accordion title='La interfaz de control indica "unauthorized" (o continúa reconectándose). ¿Qué se debe hacer?'>
    La ruta de autenticación del Gateway y el método de autenticación de la interfaz no coinciden.

    Datos (procedentes del código):

    - La interfaz de control conserva el token en `sessionStorage`, limitado a la pestaña actual del navegador y a la URL del Gateway seleccionada, por lo que las actualizaciones en la misma pestaña siguen funcionando sin persistencia prolongada del token en localStorage.
    - En `AUTH_TOKEN_MISMATCH`, los clientes de confianza pueden intentar un único reintento limitado con un token de dispositivo almacenado en caché cuando el Gateway devuelve indicaciones de reintento (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ese reintento con el token almacenado en caché reutiliza los ámbitos aprobados almacenados con el token del dispositivo; los invocadores con `deviceToken` explícito o `scopes` explícito conservan el conjunto de ámbitos solicitado en lugar de heredar los ámbitos almacenados en caché.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de la conexión es: primero el token o la contraseña compartidos explícitos, después `deviceToken` explícito, luego el token de dispositivo almacenado y, por último, el token de arranque.
    - El arranque integrado mediante código de configuración devuelve un token de dispositivo Node con `scopes: []`, además de un token limitado de transferencia al operador para la incorporación móvil de confianza. La transferencia al operador puede leer la configuración nativa durante la configuración, pero no concede ámbitos de modificación del emparejamiento ni `operator.admin`.

    Solución:

    - La opción más rápida: `openclaw dashboard` (muestra y copia la URL del panel e intenta abrirla; si no hay interfaz gráfica, muestra una sugerencia de SSH).
    - Si aún no hay token: `openclaw doctor --generate-gateway-token`.
    - En remoto: cree primero un túnel con `ssh -N -L 18789:127.0.0.1:18789 user@host` y después abra `http://127.0.0.1:18789/`.
    - Modo de secreto compartido: establezca `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` y, a continuación, pegue el secreto correspondiente en la configuración de la interfaz de control.
    - Modo Tailscale Serve: confirme que `gateway.auth.allowTailscale` esté habilitado y que se esté abriendo la URL de Serve, no una URL directa de bucle invertido o de la Tailnet que omita las cabeceras de identidad de Tailscale.
    - Modo de proxy de confianza: confirme que la conexión se realice a través del proxy configurado con reconocimiento de identidad. Los proxies de bucle invertido del mismo host también necesitan `gateway.auth.trustedProxy.allowLoopback = true`.
    - Si la incompatibilidad persiste después del único reintento, rote o vuelva a aprobar el token del dispositivo emparejado:
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - Si se deniega la rotación: las sesiones de dispositivos emparejados solo pueden rotar su **propio** dispositivo, salvo que también tengan `operator.admin`, y los valores explícitos de `--scope` no pueden superar los ámbitos de operador actuales del invocador.
    - Si el problema persiste: `openclaw status --all` y [Solución de problemas](/es/gateway/troubleshooting). Consulte [Panel](/es/web/dashboard) para obtener información detallada sobre la autenticación.

  </Accordion>

  <Accordion title="Se configuró gateway.bind como tailnet, pero solo escucha en el bucle invertido">
    La vinculación `tailnet` selecciona una IP de Tailscale de las interfaces de red (100.64.0.0/10). Si el equipo no está conectado a Tailscale (o la interfaz está inactiva), el Gateway recurre al bucle invertido en lugar de exponer otra interfaz de red.

    Solución: inicie Tailscale en ese host y reinicie el Gateway, o cambie explícitamente a `gateway.bind: "loopback"` / `"lan"`.

    `tailnet` es explícito; `auto` da preferencia al bucle invertido. Use `gateway.bind: "tailnet"` para limitar la exposición fuera del bucle invertido a la Tailnet y conservar al mismo tiempo el listener obligatorio `127.0.0.1` del mismo host.

  </Accordion>

  <Accordion title="¿Se pueden ejecutar varios Gateways en el mismo host?">
    Normalmente no: un Gateway puede ejecutar varios canales de mensajería y agentes. Use varios Gateways únicamente para redundancia (por ejemplo, un bot de rescate) o aislamiento estricto, y aísle cada uno con sus propios `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `agents.defaults.workspace` y un `gateway.port` único.

    Recomendación: `openclaw --profile <name> ...` por instancia (crea automáticamente `~/.openclaw-<name>`), un `gateway.port` único por configuración de perfil (o `--port` para ejecuciones manuales) y un servicio por perfil con `openclaw --profile <name> gateway install`.

    Los perfiles también añaden sufijos a los nombres de los servicios: launchd `ai.openclaw.<profile>`, systemd `openclaw-gateway-<profile>.service`, Windows `OpenClaw Gateway (<profile>)`. La unidad systemd `openclaw-gateway` sin calificador solo existe para el perfil predeterminado; el nombre heredado de la unidad systemd anterior al cambio de nombre, `clawdbot-gateway`, se migra automáticamente.

    Guía completa: [Varios Gateways](/es/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='¿Qué significa "invalid handshake" / código 1008?'>
    El Gateway es un **servidor WebSocket** y espera que el primer mensaje sea una trama `connect`. Cualquier otra cosa cierra la conexión con el **código 1008** (infracción de la política).

    Causas habituales: se abrió la URL **HTTP** en un navegador en lugar de utilizar un cliente WS, se usó un puerto o una ruta incorrectos, o un proxy/túnel eliminó las cabeceras de autenticación o envió una solicitud ajena al Gateway.

    Solución: use la URL WS (`ws://<host>:18789` o `wss://...` mediante HTTPS), no abra el puerto WS en una pestaña normal del navegador e incluya el token o la contraseña en la trama `connect` cuando la autenticación esté activada. Ejemplo de CLI/TUI:

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

    Seguimiento más rápido:

    ```bash
    openclaw logs --follow
    ```

    Registros del servicio/supervisor (cuando el Gateway se ejecuta mediante launchd/systemd):

    - Salida estándar de launchd en macOS: `~/Library/Logs/openclaw/gateway.log` (los perfiles usan `gateway-<profile>.log`; la salida de error estándar se suprime).
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`.
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`.

    Consulte [Solución de problemas](/es/gateway/troubleshooting) para obtener más información.

  </Accordion>

  <Accordion title="¿Cómo se inicia, detiene o reinicia el servicio del Gateway?">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Si se ejecuta el Gateway manualmente, `openclaw gateway --force` puede recuperar el puerto. Consulte [Gateway](/es/gateway).

  </Accordion>

  <Accordion title="Se cerró el terminal en Windows: ¿cómo se reinicia OpenClaw?">
    Hay tres modos de instalación en Windows:

    **1) Configuración local de Windows Hub**: la aplicación nativa administra un Gateway de WSL local propiedad de la aplicación. Abra **OpenClaw Companion** desde el menú Inicio o la bandeja y, a continuación, use **Gateway Setup** o la pestaña Connections.

    **2) Gateway manual en WSL2**: el Gateway se ejecuta dentro de Linux.
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

    Documentación: [Windows](/es/platforms/windows), [Guía operativa del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="El Gateway está activo, pero las respuestas nunca llegan. ¿Qué debo comprobar?">
    Comprobación rápida del estado:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causas habituales: la autenticación del modelo no está cargada en el **host del Gateway** (compruebe `models status`), el emparejamiento o la lista de permitidos del canal bloquea las respuestas (compruebe la configuración y los registros del canal), o WebChat/Dashboard está abierto sin el token correcto. Si es remoto, confirme que la conexión del túnel/Tailscale está activa y que se puede acceder al WebSocket del Gateway.

    Documentación: [Canales](/es/channels), [Solución de problemas](/es/gateway/troubleshooting), [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title='"Desconectado del Gateway: sin motivo": ¿qué hago ahora?'>
    Normalmente significa que la interfaz de usuario perdió la conexión WebSocket. Compruebe: ¿se está ejecutando el Gateway (`openclaw gateway status`)? ¿Funciona correctamente (`openclaw status`)? ¿Tiene la interfaz de usuario el token correcto (`openclaw dashboard`)? Si es remoto, ¿está activo el enlace del túnel/Tailscale?

    A continuación, siga los registros:

    ```bash
    openclaw logs --follow
    ```

    Documentación: [Dashboard](/es/web/dashboard), [Acceso remoto](/es/gateway/remote), [Solución de problemas](/es/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Falla setMyCommands de Telegram. ¿Qué debo comprobar?">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    A continuación, identifique el error:

    - `BOT_COMMANDS_TOO_MUCH`: el menú de Telegram tiene demasiadas entradas. OpenClaw ya lo recorta hasta el límite de Telegram y vuelve a intentarlo con menos comandos, pero aun así podrían omitirse algunas entradas del menú. Reduzca los comandos de plugins, skills o personalizados, o desactive `channels.telegram.commands.native` si no necesita el menú.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` o errores de red similares: en un VPS o detrás de un proxy, confirme que se permite HTTPS saliente y que DNS funciona para `api.telegram.org`.

    Si el Gateway es remoto, compruebe los registros en el host del Gateway.

    Documentación: [Telegram](/es/channels/telegram), [Solución de problemas de canales](/es/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI no muestra ninguna salida. ¿Qué debo comprobar?">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    En la TUI, use `/status` para ver el estado actual. Si espera respuestas en un canal de chat, confirme que la entrega esté habilitada (`/deliver on`).

    Documentación: [TUI](/es/web/tui), [Comandos de barra diagonal](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo detengo por completo el Gateway y vuelvo a iniciarlo?">
    Si instaló el servicio (launchd en macOS, systemd en Linux):

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    En primer plano, deténgalo con Ctrl-C y, a continuación, ejecute `openclaw gateway run`.

    Documentación: [Guía operativa del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="Explicación sencilla: openclaw gateway restart frente a openclaw gateway">
    `openclaw gateway restart` reinicia el **servicio en segundo plano** (launchd/systemd). `openclaw gateway` ejecuta el Gateway **en primer plano** durante esta sesión de terminal. Use los subcomandos del Gateway si instaló el servicio; use la ejecución en primer plano sin subcomandos para una ejecución puntual.
  </Accordion>

  <Accordion title="La forma más rápida de obtener más detalles cuando algo falla">
    Inicie el Gateway con `--verbose` para obtener más detalles en la consola y, a continuación, examine el archivo de registro para detectar errores de autenticación del canal, enrutamiento del modelo y RPC.
  </Accordion>
</AccordionGroup>

## Medios y archivos adjuntos

<AccordionGroup>
  <Accordion title="Mi skill generó una imagen o un PDF, pero no se envió nada">
    Los archivos adjuntos salientes del agente deben usar campos de medios estructurados como `media`, `mediaUrl`, `path` o `filePath`. Consulte [Configuración del asistente de OpenClaw](/es/start/openclaw) y [Envío del agente](/es/tools/agent-send).

    ```bash
    openclaw message send --target +15555550123 --message "Aquí lo tiene" --media /path/to/file.png
    ```

    Compruebe también lo siguiente: que el canal de destino admita medios salientes y no esté bloqueado por listas de permitidos; que el archivo esté dentro de los límites de tamaño del proveedor (las imágenes se redimensionan a un lado máximo de 2048px); `tools.fs.workspaceOnly=true` limita los envíos desde rutas locales a archivos del espacio de trabajo, del almacén temporal/de medios y validados por el entorno aislado; `tools.fs.workspaceOnly=false` (valor predeterminado) permite que los envíos estructurados de medios locales usen archivos locales del host que el agente ya puede leer, tanto para medios como para tipos de documentos seguros (imágenes, audio, vídeo, PDF, documentos de Office y documentos de texto validados como Markdown/MD, TXT, JSON, YAML/YML). Esto no es un escáner de secretos: se puede adjuntar un archivo `secret.txt` o `config.json` legible por el agente cuando coincidan la extensión y la validación del contenido. Mantenga los archivos confidenciales fuera de las rutas legibles por el agente o mantenga `tools.fs.workspaceOnly=true` para aplicar restricciones más estrictas a los envíos desde rutas locales.

    Consulte [Imágenes](/es/nodes/images).

  </Accordion>
</AccordionGroup>

## Seguridad y control de acceso

<AccordionGroup>
  <Accordion title="¿Es seguro exponer OpenClaw a mensajes directos entrantes?">
    Trate los mensajes directos entrantes como entradas no confiables. Los valores predeterminados reducen el riesgo:

    - El comportamiento predeterminado en los canales compatibles con mensajes directos es el **emparejamiento**: los remitentes desconocidos reciben un código de emparejamiento y su mensaje no se procesa. Apruébelos con `openclaw pairing approve --channel <channel> [--account <id>] <code>`. Las solicitudes pendientes tienen un límite de **3 por canal**; compruebe `openclaw pairing list --channel <channel> [--account <id>]` si no llegó un código.
    - Abrir públicamente los mensajes directos requiere una activación explícita (`dmPolicy: "open"` y la lista de permitidos `"*"`).

    Ejecute `openclaw doctor` para detectar políticas de mensajes directos que presenten riesgos.

  </Accordion>

  <Accordion title="¿La inyección de instrucciones solo es preocupante para los bots públicos?">
    No. La inyección de instrucciones está relacionada con el **contenido no confiable**, no solo con quién puede enviar mensajes directos al bot. Si el asistente lee contenido externo (búsquedas u obtención de contenido web, páginas del navegador, correos electrónicos, documentos, archivos adjuntos o registros pegados), ese contenido puede incluir instrucciones que intenten secuestrar el modelo, incluso si usted es el único remitente.

    El mayor riesgo surge cuando las herramientas están habilitadas: se puede engañar al modelo para que filtre contexto o invoque herramientas en su nombre. Reduzca el radio de impacto:

    - use un agente «lector» de solo lectura o sin herramientas para resumir contenido no confiable
    - mantenga `web_search` / `web_fetch` / `browser` desactivados para los agentes con herramientas habilitadas
    - trate también como no confiable el texto decodificado de archivos o documentos: tanto `input_file` de OpenResponses como la extracción de archivos multimedia adjuntos encapsulan el texto extraído entre marcadores explícitos de límites de contenido externo, en lugar de transmitir directamente el texto sin procesar del archivo
    - use un entorno aislado y listas estrictas de herramientas permitidas

    Detalles: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿OpenClaw es menos seguro porque usa TypeScript/Node en lugar de Rust/WASM?">
    El lenguaje y el entorno de ejecución son importantes, pero no constituyen el riesgo principal para un agente personal. Los riesgos prácticos son la exposición del Gateway, quién puede enviar mensajes al bot, la inyección de instrucciones, el alcance de las herramientas, la gestión de credenciales, el acceso al navegador, el acceso de ejecución y la confianza en skills/plugins de terceros.

    Rust y WASM pueden proporcionar un aislamiento más sólido para algunas clases de código, pero no resuelven la inyección de instrucciones, las listas de permitidos deficientes, la exposición pública del Gateway, las herramientas con permisos excesivos ni un perfil del navegador que ya tenga sesiones iniciadas en cuentas confidenciales. Considere estos los controles principales: mantenga el Gateway privado o autenticado, use el emparejamiento y listas de permitidos para mensajes directos/grupos, deniegue o aísle las herramientas de riesgo para entradas no confiables, instale únicamente plugins y skills de confianza y ejecute `openclaw security audit --deep` después de cambiar la configuración.

    Detalles: [Seguridad](/es/gateway/security), [Aislamiento](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="He visto informes sobre instancias de OpenClaw expuestas. ¿Qué debo comprobar?">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Una configuración de referencia más segura: el Gateway vinculado a `loopback`, o expuesto únicamente mediante acceso privado autenticado (tailnet, túnel SSH, autenticación por token/contraseña o un proxy de confianza correctamente configurado); mensajes directos en modo `pairing` o `allowlist`; grupos incluidos en listas de permitidos y con requisito de mención, salvo que todos sus miembros sean de confianza; herramientas de alto riesgo (`exec`, `browser`, `gateway`, `cron`) denegadas o estrictamente limitadas para los agentes que leen contenido no confiable; aislamiento habilitado cuando la ejecución de herramientas requiera un radio de impacto menor.

    Las vinculaciones públicas sin autenticación, los mensajes directos o grupos abiertos con herramientas y el control expuesto del navegador son los problemas que deben corregirse primero. Detalles: [openclaw security audit](/es/gateway/security#openclaw-security-audit).

  </Accordion>

  <Accordion title="¿Es seguro instalar skills de ClawHub y plugins de terceros?">
    Trate las skills y los plugins de terceros como código en el que decide confiar. Las páginas de skills de ClawHub muestran el estado del análisis antes de la instalación, pero los análisis no constituyen un límite de seguridad completo. OpenClaw no ejecuta un bloqueo local integrado de código peligroso durante la instalación o actualización de plugins/skills; use `security.installPolicy`, bajo control del operador, para tomar decisiones locales de permiso o bloqueo.

    Patrón más seguro: prefiera autores de confianza y versiones fijadas, revise la skill o el plugin antes de habilitarlo, mantenga restringidas las listas de plugins/skills permitidos, ejecute los flujos de trabajo con entradas no confiables en un entorno aislado y con herramientas mínimas, y evite conceder al código de terceros un acceso amplio al sistema de archivos, la ejecución, el navegador o los secretos.

    Detalles: [Skills](/es/tools/skills), [Plugins](/es/tools/plugin), [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Debe mi bot tener su propio correo electrónico, cuenta de GitHub o número de teléfono?">
    Sí, para la mayoría de las configuraciones. Aislar el bot mediante cuentas y números de teléfono independientes reduce el radio de impacto si algo sale mal y facilita rotar las credenciales o revocar el acceso sin afectar a las cuentas personales.

    Empiece con poco: conceda acceso únicamente a las herramientas y cuentas que realmente necesite y amplíelo más adelante si fuera necesario.

    Documentación: [Seguridad](/es/gateway/security), [Emparejamiento](/es/channels/pairing).

  </Accordion>

  <Accordion title="¿Puedo darle autonomía sobre mis mensajes de texto y es seguro hacerlo?">
    **No** se recomienda conceder autonomía total sobre los mensajes personales. El patrón más seguro consiste en mantener los mensajes directos en **modo de emparejamiento** o con una lista de permitidos estricta, usar un **número o una cuenta independiente** si debe enviar mensajes en su nombre y permitir que redacte los mensajes mientras usted los **aprueba antes de enviarlos**.

    Para experimentar, hágalo en una cuenta dedicada y aislada. Consulte [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Puedo usar modelos más económicos para tareas de asistente personal?">
    Sí, **si** el agente solo usa el chat y la entrada es confiable. Los niveles más pequeños son más susceptibles al secuestro de instrucciones, por lo que deben evitarse para agentes con herramientas habilitadas o al leer contenido no confiable. Si debe usar un modelo más pequeño, restrinja las herramientas y ejecútelo dentro de un entorno aislado. Consulte [Seguridad](/es/gateway/security).
  </Accordion>

  <Accordion title="Ejecuté /start en Telegram, pero no recibí ningún código de emparejamiento">
    Los códigos de emparejamiento se envían **únicamente** cuando un remitente desconocido envía un mensaje al bot y `dmPolicy: "pairing"` está habilitado; `/start` por sí solo no genera ningún código.

    Compruebe las solicitudes pendientes:

    ```bash
    openclaw pairing list telegram
    ```

    Para obtener acceso inmediato, añada el identificador del remitente a la lista de permitidos o establezca `dmPolicy: "open"` para esa cuenta.

  </Accordion>

  <Accordion title="WhatsApp: ¿enviará mensajes a mis contactos? ¿Cómo funciona el emparejamiento?">
    No. La política predeterminada de mensajes directos de WhatsApp es el **emparejamiento**. Los remitentes desconocidos solo reciben un código de emparejamiento; su mensaje **no se procesa**. OpenClaw solo responde a los chats que recibe o a los envíos explícitos que usted inicia.

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    La solicitud del número de teléfono del asistente configura la **lista de permitidos/propietario** para que se permitan sus propios mensajes directos; no se utiliza para el envío automático. Para su número personal de WhatsApp, use ese número y habilite `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandos de chat, cancelación de tareas y «no se detiene»

<AccordionGroup>
  <Accordion title="¿Cómo evito que los mensajes internos del sistema aparezcan en el chat?">
    La mayoría de los mensajes internos o de herramientas solo aparecen cuando **verbose**, **trace** o **reasoning** están habilitados para esa sesión.

    Para corregirlo en el chat donde aparecen:

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    Si sigue habiendo demasiado ruido, compruebe la configuración de la sesión en la interfaz de control y establezca verbose en **inherit**; confirme que no esté utilizando un perfil de bot con `verboseDefault: "on"` en la configuración.

    Documentación: [Razonamiento y modo detallado](/es/tools/thinking), [Seguridad](/es/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="¿Cómo detengo o cancelo una tarea en ejecución?">
    Envíe cualquiera de estas opciones **como mensaje independiente** (sin barra) para activar una cancelación: `stop`, `stop action`, `stop current action`, `stop run`, `stop current run`, `stop agent`, `stop the agent`, `stop openclaw`, `openclaw stop`, `stop don't do anything`, `stop do not do anything`, `stop doing anything`, `do not do that`, `please stop`, `stop please`, `abort`, `esc`, `exit`, `interrupt`, `halt`. También funcionan activadores habituales en otros idiomas (francés, alemán, español, chino, japonés, hindi, árabe y ruso).

    Para los procesos en segundo plano iniciados mediante la herramienta exec, solicite al agente que ejecute:

    ```text
    process action:kill sessionId:XXX
    ```

    La mayoría de los comandos con barra deben enviarse como un mensaje **independiente** que comience por `/`, pero algunos atajos (como `/status`) también funcionan dentro de un mensaje para remitentes incluidos en la lista de permitidos. Consulte [Comandos con barra](/es/tools/slash-commands).

  </Accordion>

  <Accordion title='¿Cómo envío un mensaje de Discord desde Telegram? («Mensajería entre contextos denegada»)'>
    OpenClaw bloquea de forma predeterminada la mensajería **entre proveedores**. Si una llamada a una herramienta está vinculada a Telegram, no enviará mensajes a Discord a menos que lo permita explícitamente; el cambio surte efecto de inmediato, sin necesidad de reiniciar el Gateway:

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

  <Accordion title='¿Por qué parece que el bot «ignora» los mensajes enviados rápidamente?'>
    De forma predeterminada, las instrucciones enviadas durante una ejecución se incorporan a la ejecución activa. Use `/queue` para elegir el comportamiento de la ejecución activa:

    - `steer` (predeterminado): orienta la ejecución activa en el siguiente límite del modelo.
    - `followup`: pone los mensajes en cola y los ejecuta uno por uno cuando finaliza la ejecución actual.
    - `collect`: pone en cola los mensajes compatibles y responde una sola vez cuando finaliza la ejecución actual.
    - `interrupt`: cancela la ejecución actual e inicia una nueva.

    Añada opciones a los modos en cola, como `debounce:0.5s cap:25 drop:summarize`. Consulte [Cola de comandos](/es/concepts/queue) y [Cola de orientación](/es/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Otros temas

<AccordionGroup>
  <Accordion title='¿Cuál es el modelo predeterminado de Anthropic cuando se usa una clave de API?'>
    Las credenciales y la selección del modelo son independientes. Configurar `ANTHROPIC_API_KEY` (o almacenar una clave de API de Anthropic en los perfiles de autenticación) habilita la autenticación, pero el modelo predeterminado real es el que se configure en `agents.defaults.model.primary` (por ejemplo, `anthropic/claude-sonnet-4-6` o `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` significa que el Gateway no pudo encontrar las credenciales de Anthropic en el `auth-profiles.json` esperado para el agente en ejecución.
  </Accordion>
</AccordionGroup>

---

¿Sigue teniendo problemas? Pregunte en [Discord](https://discord.com/invite/clawd) o abra un [debate en GitHub](https://github.com/openclaw/openclaw/discussions).

## Contenido relacionado

- [Preguntas frecuentes sobre la primera ejecución](/es/help/faq-first-run): instalación, incorporación, autenticación, suscripciones y fallos iniciales
- [Preguntas frecuentes sobre modelos](/es/help/faq-models): selección de modelos, conmutación por error y perfiles de autenticación
- [Solución de problemas](/es/help/troubleshooting): diagnóstico basado primero en los síntomas
