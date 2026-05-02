---
read_when:
    - Instalación nueva, incorporación bloqueada o errores de primera ejecución
    - Elegir autenticación y suscripciones de proveedores
    - No se puede acceder a docs.openclaw.ai, no se puede abrir el panel de control, la instalación se queda bloqueada
sidebarTitle: First-run FAQ
summary: 'Preguntas frecuentes: inicio rápido y configuración de primera ejecución — instalación, incorporación, autenticación, suscripciones, fallos iniciales'
title: 'Preguntas frecuentes: configuración de la primera ejecución'
x-i18n:
    generated_at: "2026-05-02T22:19:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1205a046617c5d25ca1b180fca1a34fe0a5e7d0fc6a820ef44ebba4d723236f5
    source_path: help/faq-first-run.md
    workflow: 16
---

  Preguntas y respuestas de inicio rápido y primera ejecución. Para operaciones cotidianas, modelos, autenticación, sesiones
  y solución de problemas, consulta la [FAQ](/es/help/faq) principal.

  ## Inicio rápido y configuración de primera ejecución

  <AccordionGroup>
  <Accordion title="Estoy atascado, la forma más rápida de desatascarme">
    Usa un agente de IA local que pueda **ver tu máquina**. Eso es mucho más eficaz que preguntar
    en Discord, porque la mayoría de los casos de "estoy atascado" son **problemas locales de configuración o entorno** que
    las personas que ayudan en remoto no pueden inspeccionar.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Estas herramientas pueden leer el repositorio, ejecutar comandos, inspeccionar registros y ayudar a corregir la configuración
    de tu máquina (PATH, servicios, permisos, archivos de autenticación). Dales el **checkout completo del código fuente** mediante
    la instalación modificable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Esto instala OpenClaw **desde un checkout de git**, para que el agente pueda leer el código y la documentación, y
    razonar sobre la versión exacta que estás ejecutando. Siempre puedes volver a la versión estable más tarde
    volviendo a ejecutar el instalador sin `--install-method git`.

    Consejo: pide al agente que **planifique y supervise** la corrección (paso a paso), y luego ejecuta solo los
    comandos necesarios. Así los cambios se mantienen pequeños y son más fáciles de auditar.

    Si descubres un error real o una corrección, abre un issue en GitHub o envía un PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Empieza con estos comandos (comparte las salidas cuando pidas ayuda):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Qué hacen:

    - `openclaw status`: instantánea rápida del estado del gateway/agente y configuración básica.
    - `openclaw models status`: comprueba la autenticación del proveedor y la disponibilidad de modelos.
    - `openclaw doctor`: valida y repara problemas comunes de configuración/estado.

    Otras comprobaciones útiles de la CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Bucle rápido de depuración: [Primeros 60 segundos si algo está roto](/es/help/faq#first-60-seconds-if-something-is-broken).
    Documentación de instalación: [Instalación](/es/install), [Flags del instalador](/es/install/installer), [Actualización](/es/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sigue omitiéndose. ¿Qué significan los motivos de omisión?">
    Motivos comunes de omisión de Heartbeat:

    - `quiet-hours`: fuera de la ventana de horas activas configurada
    - `empty-heartbeat-file`: `HEARTBEAT.md` existe pero solo contiene un andamiaje vacío o solo con encabezados
    - `no-tasks-due`: el modo de tareas de `HEARTBEAT.md` está activo, pero todavía no vence ninguno de los intervalos de tareas
    - `alerts-disabled`: toda la visibilidad de Heartbeat está desactivada (`showOk`, `showAlerts` y `useIndicator` están todos desactivados)

    En modo de tareas, las marcas de tiempo de vencimiento solo avanzan después de que una ejecución real de Heartbeat
    se completa. Las ejecuciones omitidas no marcan tareas como completadas.

    Documentación: [Heartbeat](/es/gateway/heartbeat), [Automatización y tareas](/es/automation).

  </Accordion>

  <Accordion title="Forma recomendada de instalar y configurar OpenClaw">
    El repositorio recomienda ejecutarlo desde el código fuente y usar el onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    El asistente también puede compilar los recursos de la UI automáticamente. Después del onboarding, normalmente ejecutas el Gateway en el puerto **18789**.

    Desde el código fuente (colaboradores/desarrollo):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Si aún no tienes una instalación global, ejecútalo mediante `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="¿Cómo abro el panel después del onboarding?">
    El asistente abre tu navegador con una URL limpia (sin token) del panel justo después del onboarding y también imprime el enlace en el resumen. Mantén esa pestaña abierta; si no se inició, copia y pega la URL impresa en la misma máquina.
  </Accordion>

  <Accordion title="¿Cómo autentico el panel en localhost frente a remoto?">
    **Localhost (misma máquina):**

    - Abre `http://127.0.0.1:18789/`.
    - Si solicita autenticación con secreto compartido, pega el token o la contraseña configurados en la configuración de Control UI.
    - Origen del token: `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
    - Origen de la contraseña: `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Si todavía no hay un secreto compartido configurado, genera un token con `openclaw doctor --generate-gateway-token`.

    **No en localhost:**

    - **Tailscale Serve** (recomendado): mantén el enlace en local loopback, ejecuta `openclaw gateway --tailscale serve`, abre `https://<magicdns>/`. Si `gateway.auth.allowTailscale` es `true`, las cabeceras de identidad satisfacen la autenticación de Control UI/WebSocket (sin pegar un secreto compartido, asume un host de gateway de confianza); las APIs HTTP siguen requiriendo autenticación con secreto compartido, salvo que uses deliberadamente `none` para ingreso privado o autenticación HTTP de proxy de confianza.
      Los intentos incorrectos simultáneos de autenticación de Serve desde el mismo cliente se serializan antes de que el limitador de autenticación fallida los registre, así que el segundo reintento incorrecto ya puede mostrar `retry later`.
    - **Enlace de tailnet**: ejecuta `openclaw gateway --bind tailnet --token "<token>"` (o configura autenticación por contraseña), abre `http://<tailscale-ip>:18789/` y luego pega el secreto compartido correspondiente en la configuración del panel.
    - **Proxy inverso con identidad**: mantén el Gateway detrás de un proxy de confianza, configura `gateway.auth.mode: "trusted-proxy"` y luego abre la URL del proxy. Los proxies de local loopback en el mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito.
    - **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`. La autenticación con secreto compartido sigue aplicándose a través del túnel; pega el token o la contraseña configurados si se solicita.

    Consulta [Panel](/es/web/dashboard) y [Superficies web](/es/web) para ver los modos de enlace y los detalles de autenticación.

  </Accordion>

  <Accordion title="¿Por qué hay dos configuraciones de aprobación de ejecución para aprobaciones por chat?">
    Controlan capas distintas:

    - `approvals.exec`: reenvía solicitudes de aprobación a destinos de chat
    - `channels.<channel>.execApprovals`: hace que ese canal actúe como cliente de aprobación nativo para aprobaciones de ejecución

    La política de ejecución del host sigue siendo la puerta de aprobación real. La configuración del chat solo controla dónde
    aparecen las solicitudes de aprobación y cómo las personas pueden responderlas.

    En la mayoría de las configuraciones **no** necesitas ambas:

    - Si el chat ya admite comandos y respuestas, `/approve` en el mismo chat funciona mediante la ruta compartida.
    - Si un canal nativo compatible puede inferir aprobadores de forma segura, OpenClaw ahora habilita automáticamente aprobaciones nativas priorizando DM cuando `channels.<channel>.execApprovals.enabled` no está establecido o es `"auto"`.
    - Cuando hay tarjetas/botones de aprobación nativos disponibles, esa UI nativa es la ruta principal; el agente solo debería incluir un comando manual `/approve` si el resultado de la herramienta dice que las aprobaciones por chat no están disponibles o que la aprobación manual es la única ruta.
    - Usa `approvals.exec` solo cuando las solicitudes también deban reenviarse a otros chats o salas de operaciones explícitas.
    - Usa `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo cuando quieras explícitamente que las solicitudes de aprobación se publiquen de vuelta en la sala/tema de origen.
    - Las aprobaciones de Plugin vuelven a ser independientes: usan `/approve` en el mismo chat por defecto, reenvío opcional con `approvals.plugin`, y solo algunos canales nativos mantienen manejo nativo de aprobación de Plugin encima.

    Versión corta: el reenvío sirve para enrutar; la configuración de cliente nativo sirve para una UX más rica específica del canal.
    Consulta [Aprobaciones de ejecución](/es/tools/exec-approvals).

  </Accordion>

  <Accordion title="¿Qué runtime necesito?">
    Se requiere Node **>= 22**. Se recomienda `pnpm`. Bun **no se recomienda** para el Gateway.
  </Accordion>

  <Accordion title="¿Funciona en Raspberry Pi?">
    Sí. El Gateway es ligero: la documentación indica **512MB-1GB RAM**, **1 núcleo** y unos **500MB**
    de disco como suficiente para uso personal, y señala que una **Raspberry Pi 4 puede ejecutarlo**.

    Si quieres más margen (registros, medios, otros servicios), se recomiendan **2GB**, pero
    no es un mínimo estricto.

    Consejo: una Pi/VPS pequeña puede alojar el Gateway, y puedes emparejar **nodos** en tu portátil/teléfono para
    pantalla/cámara/lienzo local o ejecución de comandos. Consulta [Nodos](/es/nodes).

  </Accordion>

  <Accordion title="¿Algún consejo para instalaciones en Raspberry Pi?">
    Versión corta: funciona, pero espera algunas asperezas.

    - Usa un sistema operativo de **64 bits** y mantén Node >= 22.
    - Prefiere la **instalación modificable (git)** para poder ver registros y actualizar rápido.
    - Empieza sin canales/Skills y luego añádelos uno por uno.
    - Si encuentras problemas binarios extraños, normalmente es un problema de **compatibilidad con ARM**.

    Documentación: [Linux](/es/platforms/linux), [Instalación](/es/install).

  </Accordion>

  <Accordion title="Está atascado en wake up my friend / el onboarding no eclosiona. ¿Ahora qué?">
    Esa pantalla depende de que el Gateway esté accesible y autenticado. La TUI también envía
    "Wake up, my friend!" automáticamente en la primera eclosión. Si ves esa línea **sin respuesta**
    y los tokens se quedan en 0, el agente nunca se ejecutó.

    1. Reinicia el Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Comprueba estado y autenticación:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Si sigue colgado, ejecuta:

    ```bash
    openclaw doctor
    ```

    Si el Gateway es remoto, asegúrate de que el túnel/la conexión Tailscale esté activa y de que la UI
    apunte al Gateway correcto. Consulta [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Puedo migrar mi configuración a una máquina nueva (Mac mini) sin rehacer el onboarding?">
    Sí. Copia el **directorio de estado** y el **workspace**, y luego ejecuta Doctor una vez. Esto
    mantiene tu bot "exactamente igual" (memoria, historial de sesiones, autenticación y estado de canales)
    siempre que copies **ambas** ubicaciones:

    1. Instala OpenClaw en la nueva máquina.
    2. Copia `$OPENCLAW_STATE_DIR` (predeterminado: `~/.openclaw`) desde la máquina antigua.
    3. Copia tu workspace (predeterminado: `~/.openclaw/workspace`).
    4. Ejecuta `openclaw doctor` y reinicia el servicio Gateway.

    Eso conserva la configuración, perfiles de autenticación, credenciales de WhatsApp, sesiones y memoria. Si estás en
    modo remoto, recuerda que el host del gateway posee el almacén de sesiones y el workspace.

    **Importante:** si solo confirmas/envías tu workspace a GitHub, estás haciendo copia de seguridad
    de **memoria + archivos de arranque**, pero **no** del historial de sesiones ni de la autenticación. Esos viven
    bajo `~/.openclaw/` (por ejemplo `~/.openclaw/agents/<agentId>/sessions/`).

    Relacionado: [Migración](/es/install/migrating), [Dónde viven las cosas en disco](/es/help/faq#where-things-live-on-disk),
    [Workspace del agente](/es/concepts/agent-workspace), [Doctor](/es/gateway/doctor),
    [Modo remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Dónde veo qué hay de nuevo en la versión más reciente?">
    Consulta el changelog de GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Las entradas más recientes están arriba. Si la sección superior está marcada como **Unreleased**, la siguiente sección
    con fecha es la versión publicada más reciente. Las entradas se agrupan por **Aspectos destacados**, **Cambios** y
    **Correcciones** (más secciones de documentación/otras cuando sea necesario).

  </Accordion>

  <Accordion title="No se puede acceder a docs.openclaw.ai (error SSL)">
    Algunas conexiones de Comcast/Xfinity bloquean incorrectamente `docs.openclaw.ai` mediante Xfinity
    Advanced Security. Desactívalo o añade `docs.openclaw.ai` a la lista de permitidos, y vuelve a intentarlo.
    Ayúdanos a desbloquearlo informando aquí: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Si todavía no puedes acceder al sitio, la documentación está reflejada en GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Diferencia entre estable y beta">
    **Stable** y **beta** son **dist-tags de npm**, no líneas de código separadas:

    - `latest` = estable
    - `beta` = compilación temprana para pruebas

    Normalmente, una versión estable llega primero a **beta**, y luego un paso explícito
    de promoción mueve esa misma versión a `latest`. Los mantenedores también pueden
    publicar directamente en `latest` cuando sea necesario. Por eso beta y estable pueden
    apuntar a la **misma versión** después de la promoción.

    Mira qué cambió:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Para comandos de instalación de una línea y la diferencia entre beta y dev, consulta el acordeón de abajo.

  </Accordion>

  <Accordion title="¿Cómo instalo la versión beta y cuál es la diferencia entre beta y dev?">
    **Beta** es el dist-tag de npm `beta` (puede coincidir con `latest` después de la promoción).
    **Dev** es la cabecera móvil de `main` (git); cuando se publica, usa el dist-tag de npm `dev`.

    Comandos de una línea (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalador de Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Más detalles: [Canales de desarrollo](/es/install/development-channels) y [Flags del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="¿Cómo pruebo los bits más recientes?">
    Dos opciones:

    1. **Canal dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Esto cambia a la rama `main` y actualiza desde el código fuente.

    2. **Instalación modificable (desde el sitio del instalador):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Eso te da un repo local que puedes editar y luego actualizar mediante git.

    Si prefieres un clon limpio manual, usa:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentación: [Actualizar](/es/cli/update), [Canales de desarrollo](/es/install/development-channels),
    [Instalar](/es/install).

  </Accordion>

  <Accordion title="¿Cuánto suelen tardar la instalación y el onboarding?">
    Guía aproximada:

    - **Instalación:** 2-5 minutos
    - **Onboarding:** 5-15 minutos según cuántos canales/modelos configures

    Si se queda colgado, usa [Instalador atascado](#quick-start-and-first-run-setup)
    y el bucle rápido de depuración en [Estoy atascado](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="¿Instalador atascado? ¿Cómo obtengo más feedback?">
    Vuelve a ejecutar el instalador con **salida detallada**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalación beta con salida detallada:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Para una instalación modificable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Equivalente en Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Más opciones: [Flags del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="La instalación en Windows dice git not found u openclaw not recognized">
    Dos problemas comunes en Windows:

    **1) Error de npm spawn git / git no encontrado**

    - Instala **Git for Windows** y asegúrate de que `git` esté en tu PATH.
    - Cierra y vuelve a abrir PowerShell, luego vuelve a ejecutar el instalador.

    **2) openclaw no se reconoce después de la instalación**

    - Tu carpeta global bin de npm no está en PATH.
    - Comprueba la ruta:

      ```powershell
      npm config get prefix
      ```

    - Añade ese directorio a tu PATH de usuario (no hace falta el sufijo `\bin` en Windows; en la mayoría de sistemas es `%AppData%\npm`).
    - Cierra y vuelve a abrir PowerShell después de actualizar PATH.

    Si quieres la configuración más fluida en Windows, usa **WSL2** en lugar de Windows nativo.
    Documentación: [Windows](/es/platforms/windows).

  </Accordion>

  <Accordion title="La salida de exec en Windows muestra texto chino ilegible: ¿qué debo hacer?">
    Esto suele ser una discrepancia de página de códigos de la consola en shells nativos de Windows.

    Síntomas:

    - La salida de `system.run`/`exec` muestra chino como mojibake
    - El mismo comando se ve bien en otro perfil de terminal

    Solución rápida en PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Luego reinicia el Gateway y vuelve a intentar tu comando:

    ```powershell
    openclaw gateway restart
    ```

    Si todavía puedes reproducir esto en la versión más reciente de OpenClaw, haz seguimiento o repórtalo en:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentación no respondió mi pregunta: ¿cómo obtengo una mejor respuesta?">
    Usa la **instalación modificable (git)** para tener todo el código fuente y la documentación localmente, luego pregunta
    a tu bot (o Claude/Codex) _desde esa carpeta_ para que pueda leer el repo y responder con precisión.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Más detalles: [Instalar](/es/install) y [Flags del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="¿Cómo instalo OpenClaw en Linux?">
    Respuesta corta: sigue la guía de Linux y luego ejecuta el onboarding.

    - Ruta rápida de Linux + instalación como servicio: [Linux](/es/platforms/linux).
    - Recorrido completo: [Primeros pasos](/es/start/getting-started).
    - Instalador + actualizaciones: [Instalación y actualizaciones](/es/install/updating).

  </Accordion>

  <Accordion title="¿Cómo instalo OpenClaw en un VPS?">
    Cualquier VPS Linux funciona. Instala en el servidor y luego usa SSH/Tailscale para acceder al Gateway.

    Guías: [exe.dev](/es/install/exe-dev), [Hetzner](/es/install/hetzner), [Fly.io](/es/install/fly).
    Acceso remoto: [Gateway remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Dónde están las guías de instalación en la nube/VPS?">
    Mantenemos un **hub de hosting** con los proveedores comunes. Elige uno y sigue la guía:

    - [Hosting VPS](/es/vps) (todos los proveedores en un solo lugar)
    - [Fly.io](/es/install/fly)
    - [Hetzner](/es/install/hetzner)
    - [exe.dev](/es/install/exe-dev)

    Cómo funciona en la nube: el **Gateway se ejecuta en el servidor**, y accedes a él
    desde tu portátil/teléfono mediante la Control UI (o Tailscale/SSH). Tu estado + workspace
    viven en el servidor, así que trata el host como la fuente de verdad y haz copias de seguridad.

    Puedes emparejar **nodes** (Mac/iOS/Android/headless) con ese Gateway en la nube para acceder
    a pantalla/cámara/canvas locales o ejecutar comandos en tu portátil mientras mantienes el
    Gateway en la nube.

    Hub: [Plataformas](/es/platforms). Acceso remoto: [Gateway remoto](/es/gateway/remote).
    Nodes: [Nodes](/es/nodes), [CLI de Nodes](/es/cli/nodes).

  </Accordion>

  <Accordion title="¿Puedo pedirle a OpenClaw que se actualice a sí mismo?">
    Respuesta corta: **posible, no recomendado**. El flujo de actualización puede reiniciar el
    Gateway (lo que corta la sesión activa), puede necesitar un git checkout limpio y
    puede pedir confirmación. Más seguro: ejecuta las actualizaciones desde una shell como operador.

    Usa la CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Si debes automatizar desde un agente:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentación: [Actualizar](/es/cli/update), [Actualización](/es/install/updating).

  </Accordion>

  <Accordion title="¿Qué hace realmente el onboarding?">
    `openclaw onboard` es la ruta de configuración recomendada. En **modo local** te guía por:

    - **Configuración de modelo/autenticación** (OAuth de proveedor, claves de API, setup-token de Anthropic, además de opciones de modelo local como LM Studio)
    - Ubicación de **workspace** + archivos de arranque
    - **Configuración del Gateway** (bind/port/auth/tailscale)
    - **Canales** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, además de plugins de canal incluidos como QQ Bot)
    - **Instalación de daemon** (LaunchAgent en macOS; unidad de usuario systemd en Linux/WSL2)
    - **Comprobaciones de salud** y selección de **skills**

    También avisa si tu modelo configurado es desconocido o no tiene autenticación.

  </Accordion>

  <Accordion title="¿Necesito una suscripción de Claude u OpenAI para ejecutar esto?">
    No. Puedes ejecutar OpenClaw con **claves de API** (Anthropic/OpenAI/otros) o con
    **modelos solo locales** para que tus datos permanezcan en tu dispositivo. Las suscripciones (Claude
    Pro/Max u OpenAI Codex) son formas opcionales de autenticar esos proveedores.

    Para Anthropic en OpenClaw, la división práctica es:

    - **Clave de API de Anthropic**: facturación normal de la API de Anthropic
    - **Claude CLI / autenticación de suscripción de Claude en OpenClaw**: personal de Anthropic
      nos dijo que este uso vuelve a estar permitido, y OpenClaw está tratando el uso de `claude -p`
      como autorizado para esta integración a menos que Anthropic publique una nueva
      política

    Para hosts de gateway de larga duración, las claves de API de Anthropic siguen siendo la configuración más
    predecible. OpenAI Codex OAuth está explícitamente admitido para herramientas externas
    como OpenClaw.

    OpenClaw también admite otras opciones alojadas de estilo suscripción, incluidas
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** y
    **Z.AI / GLM Coding Plan**.

    Documentación: [Anthropic](/es/providers/anthropic), [OpenAI](/es/providers/openai),
    [Qwen Cloud](/es/providers/qwen),
    [MiniMax](/es/providers/minimax), [Modelos GLM](/es/providers/glm),
    [Modelos locales](/es/gateway/local-models), [Modelos](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Puedo usar una suscripción Claude Max sin una clave de API?">
    Sí.

    Personal de Anthropic nos dijo que el uso de Claude CLI al estilo de OpenClaw vuelve a estar permitido, así que
    OpenClaw trata la autenticación de suscripción de Claude y el uso de `claude -p` como autorizados
    para esta integración a menos que Anthropic publique una nueva política. Si quieres
    la configuración del lado del servidor más predecible, usa una clave de API de Anthropic en su lugar.

  </Accordion>

  <Accordion title="¿Admiten autenticación de suscripción de Claude (Claude Pro o Max)?">
    Sí.

    Personal de Anthropic nos dijo que este uso vuelve a estar permitido, así que OpenClaw trata
    la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración
    a menos que Anthropic publique una nueva política.

    El setup-token de Anthropic sigue disponible como una ruta de token admitida por OpenClaw, pero OpenClaw ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.
    Para cargas de trabajo de producción o multiusuario, la autenticación con clave de API de Anthropic sigue siendo la
    opción más segura y predecible. Si quieres otras opciones alojadas de estilo suscripción
    en OpenClaw, consulta [OpenAI](/es/providers/openai), [Qwen / Model
    Cloud](/es/providers/qwen), [MiniMax](/es/providers/minimax) y [Modelos
    GLM](/es/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="¿Por qué veo HTTP 429 rate_limit_error de Anthropic?">
    Eso significa que tu **cuota/límite de tasa de Anthropic** está agotado para la ventana actual. Si
    usas **Claude CLI**, espera a que la ventana se restablezca o mejora tu plan. Si
    usas una **clave de API de Anthropic**, revisa la Anthropic Console
    para ver uso/facturación y aumenta los límites según sea necesario.

    Si el mensaje es específicamente:
    `Extra usage is required for long context requests`, la solicitud está intentando usar
    la beta de contexto de 1M de Anthropic (`context1m: true`). Eso solo funciona cuando tu
    credencial es elegible para facturación de contexto largo (facturación con clave de API o la
    ruta de inicio de sesión de Claude de OpenClaw con Extra Usage habilitado).

    Consejo: configura un **modelo alternativo** para que OpenClaw pueda seguir respondiendo mientras un proveedor tiene límite de tasa.
    Consulta [Modelos](/es/cli/models), [OAuth](/es/concepts/oauth) y
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/es/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="¿Se admite AWS Bedrock?">
    Sí. OpenClaw incluye un proveedor **Amazon Bedrock (Converse)** integrado. Con marcadores de entorno de AWS presentes, OpenClaw puede descubrir automáticamente el catálogo de streaming/texto de Bedrock y combinarlo como un proveedor `amazon-bedrock` implícito; de lo contrario, puedes habilitar explícitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` o agregar una entrada de proveedor manual. Consulta [Amazon Bedrock](/es/providers/bedrock) y [Proveedores de modelos](/es/providers/models). Si prefieres un flujo de clave gestionada, un proxy compatible con OpenAI delante de Bedrock sigue siendo una opción válida.
  </Accordion>

  <Accordion title="¿Cómo funciona la autenticación de Codex?">
    OpenClaw admite **OpenAI Code (Codex)** mediante OAuth (inicio de sesión con ChatGPT). Usa
    `openai/gpt-5.5` con `agentRuntime.id: "codex"` para la configuración habitual:
    autenticación de suscripción de ChatGPT/Codex más ejecución nativa del servidor de aplicaciones de Codex. Usa
    `openai-codex/gpt-5.5` solo cuando quieras OAuth de Codex a través del runner predeterminado
    PI. Usa `openai/gpt-5.5` sin la anulación del runtime de Codex para
    acceso directo con clave de API de OpenAI.
    Consulta [Proveedores de modelos](/es/concepts/model-providers) y [Onboarding (CLI)](/es/start/wizard).
  </Accordion>

  <Accordion title="¿Por qué OpenClaw todavía menciona openai-codex?">
    `openai-codex` es el id del proveedor y del perfil de autenticación para OAuth de ChatGPT/Codex.
    También es el prefijo explícito del modelo PI para OAuth de Codex:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = autenticación de suscripción de ChatGPT/Codex con runtime nativo de Codex
    - `openai-codex/gpt-5.5` = ruta OAuth de Codex en PI
    - `openai/gpt-5.5` sin una anulación del runtime de Codex = ruta directa con clave de API de OpenAI en PI
    - `openai-codex:...` = id de perfil de autenticación, no una referencia de modelo

    Si quieres la ruta directa de facturación/límites de OpenAI Platform, configura
    `OPENAI_API_KEY`. Si quieres autenticación de suscripción de ChatGPT/Codex, inicia sesión con
    `openclaw models auth login --provider openai-codex`. Para el runtime nativo de Codex,
    mantén la referencia de modelo como `openai/gpt-5.5` y configura
    `agentRuntime.id: "codex"`. Usa referencias de modelo `openai-codex/*` solo para ejecuciones
    de PI.

  </Accordion>

  <Accordion title="¿Por qué los límites de OAuth de Codex pueden diferir de ChatGPT web?">
    OAuth de Codex usa ventanas de cuota gestionadas por OpenAI y dependientes del plan. En la práctica,
    esos límites pueden diferir de la experiencia en el sitio web/app de ChatGPT, incluso cuando
    ambos están vinculados a la misma cuenta.

    OpenClaw puede mostrar las ventanas de uso/cuota del proveedor visibles actualmente en
    `openclaw models status`, pero no inventa ni normaliza derechos de ChatGPT web
    en acceso directo a API. Si quieres la ruta directa de facturación/límites de OpenAI Platform,
    usa `openai/*` con una clave de API.

  </Accordion>

  <Accordion title="¿Admiten autenticación de suscripción de OpenAI (OAuth de Codex)?">
    Sí. OpenClaw admite por completo **OAuth de suscripción de OpenAI Code (Codex)**.
    OpenAI permite explícitamente el uso de OAuth de suscripción en herramientas/flujos de trabajo externos
    como OpenClaw. El Onboarding puede ejecutar el flujo OAuth por ti.

    Consulta [OAuth](/es/concepts/oauth), [Proveedores de modelos](/es/concepts/model-providers) y [Onboarding (CLI)](/es/start/wizard).

  </Accordion>

  <Accordion title="¿Cómo configuro OAuth de Gemini CLI?">
    Gemini CLI usa un **flujo de autenticación de Plugin**, no un id de cliente ni secreto en `openclaw.json`.

    Pasos:

    1. Instala Gemini CLI localmente para que `gemini` esté en `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Habilita el Plugin: `openclaw plugins enable google`
    3. Inicia sesión: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modelo predeterminado después de iniciar sesión: `google-gemini-cli/gemini-3-flash-preview`
    5. Si las solicitudes fallan, configura `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host del gateway

    Esto almacena tokens OAuth en perfiles de autenticación en el host del gateway. Detalles: [Proveedores de modelos](/es/concepts/model-providers).

  </Accordion>

  <Accordion title="¿Está bien un modelo local para chats casuales?">
    Normalmente no. OpenClaw necesita contexto grande + seguridad sólida; las tarjetas pequeñas truncan y filtran. Si tienes que hacerlo, ejecuta localmente la compilación de modelo **más grande** que puedas (LM Studio) y consulta [/gateway/local-models](/es/gateway/local-models). Los modelos más pequeños/cuantizados aumentan el riesgo de inyección de prompts; consulta [Seguridad](/es/gateway/security).
  </Accordion>

  <Accordion title="¿Cómo mantengo el tráfico de modelos alojados en una región específica?">
    Elige endpoints fijados a una región. OpenRouter expone opciones alojadas en EE. UU. para MiniMax, Kimi y GLM; elige la variante alojada en EE. UU. para mantener los datos en la región. Aún puedes listar Anthropic/OpenAI junto con estos usando `models.mode: "merge"` para que los modelos alternativos sigan disponibles mientras respetas el proveedor regional que selecciones.
  </Accordion>

  <Accordion title="¿Tengo que comprar un Mac Mini para instalar esto?">
    No. OpenClaw se ejecuta en macOS o Linux (Windows mediante WSL2). Un Mac mini es opcional; algunas personas
    compran uno como host siempre encendido, pero un VPS pequeño, un servidor doméstico o una máquina de clase Raspberry Pi también funciona.

    Solo necesitas un Mac **para herramientas exclusivas de macOS**. Para iMessage, usa [BlueBubbles](/es/channels/bluebubbles) (recomendado): el servidor de BlueBubbles se ejecuta en cualquier Mac y el Gateway puede ejecutarse en Linux o en otro lugar. Si quieres otras herramientas exclusivas de macOS, ejecuta el Gateway en un Mac o empareja un nodo macOS.

    Documentación: [BlueBubbles](/es/channels/bluebubbles), [Nodos](/es/nodes), [Modo remoto de Mac](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Necesito un Mac mini para admitir iMessage?">
    Necesitas **algún dispositivo macOS** con sesión iniciada en Mensajes. **No** tiene que ser un Mac mini:
    cualquier Mac sirve. **Usa [BlueBubbles](/es/channels/bluebubbles)** (recomendado) para iMessage: el servidor de BlueBubbles se ejecuta en macOS, mientras que el Gateway puede ejecutarse en Linux o en otro lugar.

    Configuraciones comunes:

    - Ejecuta el Gateway en Linux/VPS y ejecuta el servidor de BlueBubbles en cualquier Mac con sesión iniciada en Mensajes.
    - Ejecuta todo en el Mac si quieres la configuración más simple en una sola máquina.

    Documentación: [BlueBubbles](/es/channels/bluebubbles), [Nodos](/es/nodes),
    [Modo remoto de Mac](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si compro un Mac mini para ejecutar OpenClaw, ¿puedo conectarlo a mi MacBook Pro?">
    Sí. El **Mac mini puede ejecutar el Gateway**, y tu MacBook Pro puede conectarse como
    **nodo** (dispositivo complementario). Los nodos no ejecutan el Gateway; proporcionan capacidades
    adicionales como pantalla/cámara/lienzo y `system.run` en ese dispositivo.

    Patrón común:

    - Gateway en el Mac mini (siempre encendido).
    - MacBook Pro ejecuta la app de macOS o un host de nodo y se empareja con el Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` para verlo.

    Documentación: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes).

  </Accordion>

  <Accordion title="¿Puedo usar Bun?">
    Bun **no se recomienda**. Vemos errores de runtime, especialmente con WhatsApp y Telegram.
    Usa **Node** para gateways estables.

    Si aun así quieres experimentar con Bun, hazlo en un gateway que no sea de producción
    sin WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ¿qué va en allowFrom?">
    `channels.telegram.allowFrom` es **el ID de usuario de Telegram del remitente humano** (numérico). No es el nombre de usuario del bot.

    La configuración solo pide IDs de usuario numéricos. Si ya tienes entradas heredadas `@username` en la configuración, `openclaw doctor --fix` puede intentar resolverlas.

    Más seguro (sin bot de terceros):

    - Envía un DM a tu bot, luego ejecuta `openclaw logs --follow` y lee `from.id`.

    API oficial de bots:

    - Envía un DM a tu bot, luego llama a `https://api.telegram.org/bot<bot_token>/getUpdates` y lee `message.from.id`.

    Terceros (menos privado):

    - Envía un DM a `@userinfobot` o `@getidsbot`.

    Consulta [/channels/telegram](/es/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="¿Pueden varias personas usar un número de WhatsApp con diferentes instancias de OpenClaw?">
    Sí, mediante **enrutamiento multiagente**. Vincula el **DM** de WhatsApp de cada remitente (peer `kind: "direct"`, remitente E.164 como `+15551234567`) a un `agentId` diferente, para que cada persona tenga su propio espacio de trabajo y almacén de sesiones. Las respuestas aún salen de la **misma cuenta de WhatsApp**, y el control de acceso de DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) es global por cuenta de WhatsApp. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent) y [WhatsApp](/es/channels/whatsapp).
  </Accordion>

  <Accordion title='¿Puedo ejecutar un agente de "chat rápido" y un agente de "Opus para programación"?'>
    Sí. Usa enrutamiento multiagente: da a cada agente su propio modelo predeterminado y luego vincula rutas entrantes (cuenta de proveedor o peers específicos) a cada agente. La configuración de ejemplo está en [Enrutamiento multiagente](/es/concepts/multi-agent). Consulta también [Modelos](/es/concepts/models) y [Configuración](/es/gateway/configuration).
  </Accordion>

  <Accordion title="¿Homebrew funciona en Linux?">
    Sí. Homebrew admite Linux (Linuxbrew). Configuración rápida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Si ejecutas OpenClaw mediante systemd, asegúrate de que el PATH del servicio incluya `/home/linuxbrew/.linuxbrew/bin` (o tu prefijo de brew) para que las herramientas instaladas con `brew` se resuelvan en shells que no sean de inicio de sesión.
    Las compilaciones recientes también anteponen directorios bin comunes de usuario en servicios systemd de Linux (por ejemplo, `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) y respetan `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` y `FNM_DIR` cuando están configurados.

  </Accordion>

  <Accordion title="Diferencia entre la instalación git modificable y la instalación npm">
    - **Instalación modificable (git):** checkout completo del código fuente, editable, ideal para contribuidores.
      Ejecutas compilaciones localmente y puedes parchear código/documentación.
    - **Instalación npm:** instalación global de CLI, sin repositorio, ideal para "solo ejecutarlo".
      Las actualizaciones vienen de dist-tags de npm.

    Documentación: [Primeros pasos](/es/start/getting-started), [Actualización](/es/install/updating).

  </Accordion>

  <Accordion title="¿Puedo cambiar entre instalaciones npm y git más adelante?">
    Sí. Usa `openclaw update --channel ...` cuando OpenClaw ya esté instalado.
    Esto **no elimina tus datos**: solo cambia la instalación del código de OpenClaw.
    Tu estado (`~/.openclaw`) y espacio de trabajo (`~/.openclaw/workspace`) quedan intactos.

    De npm a git:

    ```bash
    openclaw update --channel dev
    ```

    De git a npm:

    ```bash
    openclaw update --channel stable
    ```

    Agrega `--dry-run` para previsualizar primero el cambio de modo planificado. El actualizador ejecuta
    seguimientos de Doctor, actualiza las fuentes de Plugin para el canal de destino y
    reinicia el gateway a menos que pases `--no-restart`.

    El instalador también puede forzar cualquiera de los modos:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Consejos de copia de seguridad: consulta [Estrategia de copia de seguridad](/es/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="¿Debería ejecutar el Gateway en mi portátil o en un VPS?">
    Respuesta corta: **si quieres fiabilidad 24/7, usa un VPS**. Si quieres la
    menor fricción y te parecen bien las suspensiones/reinicios, ejecútalo localmente.

    **Portátil (Gateway local)**

    - **Ventajas:** sin costo de servidor, acceso directo a archivos locales, ventana del navegador en vivo.
    - **Desventajas:** suspensión/caídas de red = desconexiones, las actualizaciones/reinicios del sistema operativo interrumpen, debe permanecer activo.

    **VPS / nube**

    - **Ventajas:** siempre activo, red estable, sin problemas de suspensión del portátil, más fácil de mantener en ejecución.
    - **Desventajas:** a menudo se ejecuta sin interfaz gráfica (usa capturas de pantalla), solo acceso remoto a archivos, debes usar SSH para las actualizaciones.

    **Nota específica de OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funcionan bien desde un VPS. La única compensación real es **navegador sin interfaz gráfica** frente a una ventana visible. Consulta [Navegador](/es/tools/browser).

    **Opción predeterminada recomendada:** VPS si antes tuviste desconexiones del Gateway. Local es excelente cuando estás usando activamente la Mac y quieres acceso a archivos locales o automatización de IU con un navegador visible.

  </Accordion>

  <Accordion title="¿Qué tan importante es ejecutar OpenClaw en una máquina dedicada?">
    No es obligatorio, pero se **recomienda por fiabilidad y aislamiento**.

    - **Host dedicado (VPS/Mac mini/Pi):** siempre activo, menos interrupciones por suspensión/reinicio, permisos más limpios, más fácil de mantener en ejecución.
    - **Portátil/escritorio compartido:** totalmente válido para pruebas y uso activo, pero espera pausas cuando la máquina se suspenda o se actualice.

    Si quieres lo mejor de ambos mundos, mantén el Gateway en un host dedicado y empareja tu portátil como un **Node** para herramientas locales de pantalla/cámara/exec. Consulta [Nodes](/es/nodes).
    Para orientación de seguridad, lee [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Cuáles son los requisitos mínimos de VPS y el sistema operativo recomendado?">
    OpenClaw es ligero. Para un Gateway básico + un canal de chat:

    - **Mínimo absoluto:** 1 vCPU, 1 GB de RAM, ~500 MB de disco.
    - **Recomendado:** 1-2 vCPU, 2 GB de RAM o más para margen adicional (registros, medios, varios canales). Las herramientas de Node y la automatización del navegador pueden consumir muchos recursos.

    SO: usa **Ubuntu LTS** (o cualquier Debian/Ubuntu moderno). La ruta de instalación en Linux está mejor probada allí.

    Documentación: [Linux](/es/platforms/linux), [Alojamiento VPS](/es/vps).

  </Accordion>

  <Accordion title="¿Puedo ejecutar OpenClaw en una VM y cuáles son los requisitos?">
    Sí. Trata una VM igual que un VPS: debe estar siempre activa, ser accesible y tener suficiente
    RAM para el Gateway y cualquier canal que habilites.

    Guía de referencia:

    - **Mínimo absoluto:** 1 vCPU, 1 GB de RAM.
    - **Recomendado:** 2 GB de RAM o más si ejecutas varios canales, automatización del navegador o herramientas de medios.
    - **SO:** Ubuntu LTS u otro Debian/Ubuntu moderno.

    Si estás en Windows, **WSL2 es la configuración de estilo VM más fácil** y tiene la mejor compatibilidad
    con herramientas. Consulta [Windows](/es/platforms/windows), [Alojamiento VPS](/es/vps).
    Si estás ejecutando macOS en una VM, consulta [VM de macOS](/es/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Preguntas frecuentes](/es/help/faq) — las preguntas frecuentes principales (modelos, sesiones, Gateway, seguridad, más)
- [Resumen de instalación](/es/install)
- [Primeros pasos](/es/start/getting-started)
- [Solución de problemas](/es/help/troubleshooting)
