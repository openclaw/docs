---
read_when:
    - Instalación nueva, incorporación bloqueada o errores en la primera ejecución
    - Elegir autenticación y suscripciones de proveedor
    - No se puede acceder a docs.openclaw.ai, no se puede abrir el dashboard, instalación bloqueada
sidebarTitle: First-run FAQ
summary: 'Preguntas frecuentes: inicio rápido y configuración inicial — instalación, incorporación, autenticación, suscripciones y fallos iniciales'
title: 'Preguntas frecuentes: configuración inicial'
x-i18n:
    generated_at: "2026-04-24T05:32:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68dd2d2c306735dc213a25c4d2a3e5c20e2a707ffca553f3e7503d75efd74f5c
    source_path: help/faq-first-run.md
    workflow: 15
---

  Preguntas y respuestas de inicio rápido y primera configuración. Para operaciones diarias, modelos, autenticación, sesiones
  y solución de problemas, consulta la [FAQ](/es/help/faq) principal.

  ## Inicio rápido y configuración inicial

  <AccordionGroup>
  <Accordion title="Estoy bloqueado, ¿cuál es la forma más rápida de desbloquearme?">
    Usa un agente de IA local que pueda **ver tu máquina**. Eso es mucho más eficaz que preguntar
    en Discord, porque la mayoría de los casos de “estoy bloqueado” son **problemas locales de configuración o entorno** que
    los ayudantes remotos no pueden inspeccionar.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Estas herramientas pueden leer el repositorio, ejecutar comandos, inspeccionar registros y ayudar a corregir tu
    configuración a nivel de máquina (PATH, servicios, permisos, archivos de autenticación). Dales el **checkout completo del código fuente** mediante
    la instalación editable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Esto instala OpenClaw **desde un checkout de git**, para que el agente pueda leer el código + la documentación y
    razonar sobre la versión exacta que estás ejecutando. Siempre puedes volver más tarde a la versión estable
    ejecutando de nuevo el instalador sin `--install-method git`.

    Consejo: pide al agente que **planifique y supervise** la solución (paso a paso), y luego ejecute solo los
    comandos necesarios. Eso mantiene los cambios pequeños y más fáciles de auditar.

    Si descubres un error real o una corrección, por favor abre una incidencia en GitHub o envía un PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Empieza con estos comandos (comparte la salida cuando pidas ayuda):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Qué hacen:

    - `openclaw status`: instantánea rápida del estado del gateway/agente + configuración básica.
    - `openclaw models status`: comprueba la autenticación del proveedor + disponibilidad de modelos.
    - `openclaw doctor`: valida y repara problemas comunes de configuración/estado.

    Otras comprobaciones útiles de CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Bucle rápido de depuración: [Primeros 60 segundos si algo está roto](#first-60-seconds-if-something-is-broken).
    Documentación de instalación: [Instalación](/es/install), [Flags del instalador](/es/install/installer), [Actualización](/es/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sigue omitiéndose. ¿Qué significan los motivos de omisión?">
    Motivos comunes de omisión de Heartbeat:

    - `quiet-hours`: fuera de la ventana configurada de horas activas
    - `empty-heartbeat-file`: `HEARTBEAT.md` existe pero solo contiene andamiaje vacío o solo encabezados
    - `no-tasks-due`: el modo de tareas de `HEARTBEAT.md` está activo pero todavía no vence ninguno de los intervalos de tareas
    - `alerts-disabled`: toda la visibilidad de Heartbeat está desactivada (`showOk`, `showAlerts` y `useIndicator` están todos desactivados)

    En modo de tareas, las marcas de tiempo de vencimiento solo avanzan después de que se complete
    una ejecución real de Heartbeat. Las ejecuciones omitidas no marcan las tareas como completadas.

    Documentación: [Heartbeat](/es/gateway/heartbeat), [Automatización y tareas](/es/automation).

  </Accordion>

  <Accordion title="Forma recomendada de instalar y configurar OpenClaw">
    El repositorio recomienda ejecutar desde el código fuente y usar la incorporación:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    El asistente también puede compilar automáticamente los recursos de la UI. Después de la incorporación, normalmente ejecutas el Gateway en el puerto **18789**.

    Desde el código fuente (colaboradores/desarrollo):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Si todavía no tienes una instalación global, ejecútalo mediante `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="¿Cómo abro el dashboard después de la incorporación?">
    El asistente abre tu navegador con una URL limpia del dashboard (sin token) justo después de la incorporación y también imprime el enlace en el resumen. Mantén abierta esa pestaña; si no se abrió, copia y pega la URL impresa en la misma máquina.
  </Accordion>

  <Accordion title="¿Cómo autentico el dashboard en localhost frente a remoto?">
    **Localhost (misma máquina):**

    - Abre `http://127.0.0.1:18789/`.
    - Si solicita autenticación con secreto compartido, pega el token o la contraseña configurados en la configuración de Control UI.
    - Origen del token: `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
    - Origen de la contraseña: `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Si todavía no hay ningún secreto compartido configurado, genera un token con `openclaw doctor --generate-gateway-token`.

    **No en localhost:**

    - **Tailscale Serve** (recomendado): mantén el bind en loopback, ejecuta `openclaw gateway --tailscale serve`, abre `https://<magicdns>/`. Si `gateway.auth.allowTailscale` es `true`, las cabeceras de identidad satisfacen la autenticación de Control UI/WebSocket (sin pegar secreto compartido, asume host del gateway de confianza); las API HTTP siguen requiriendo autenticación con secreto compartido salvo que uses deliberadamente `none` en ingreso privado o autenticación HTTP de trusted-proxy.
      Los intentos concurrentes incorrectos de autenticación Serve desde el mismo cliente se serializan antes de que el limitador de autenticación fallida los registre, por lo que el segundo reintento incorrecto ya puede mostrar `retry later`.
    - **Bind de tailnet**: ejecuta `openclaw gateway --bind tailnet --token "<token>"` (o configura autenticación por contraseña), abre `http://<tailscale-ip>:18789/` y luego pega el secreto compartido correspondiente en la configuración del dashboard.
    - **Proxy inverso con reconocimiento de identidad**: mantén el Gateway detrás de un trusted proxy sin loopback, configura `gateway.auth.mode: "trusted-proxy"` y luego abre la URL del proxy.
    - **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`. La autenticación con secreto compartido sigue aplicándose a través del túnel; pega el token o la contraseña configurados si se solicita.

    Consulta [Dashboard](/es/web/dashboard) y [Superficies web](/es/web) para detalles sobre modos de bind y autenticación.

  </Accordion>

  <Accordion title="¿Por qué hay dos configuraciones de aprobación de exec para aprobaciones por chat?">
    Controlan capas diferentes:

    - `approvals.exec`: reenvía prompts de aprobación a destinos de chat
    - `channels.<channel>.execApprovals`: hace que ese canal actúe como cliente nativo de aprobación para aprobaciones de exec

    La política de exec del host sigue siendo la puerta real de aprobación. La configuración del chat solo controla dónde aparecen
    los prompts de aprobación y cómo pueden responder las personas.

    En la mayoría de configuraciones **no** necesitas ambas:

    - Si el chat ya admite comandos y respuestas, `/approve` en el mismo chat funciona a través de la ruta compartida.
    - Si un canal nativo compatible puede inferir aprobadores de forma segura, OpenClaw ahora habilita automáticamente aprobaciones nativas con prioridad a DM cuando `channels.<channel>.execApprovals.enabled` no está configurado o está en `"auto"`.
    - Cuando hay tarjetas/botones nativos de aprobación disponibles, esa UI nativa es la ruta principal; el agente solo debería incluir un comando manual `/approve` si el resultado de la herramienta dice que las aprobaciones por chat no están disponibles o que la aprobación manual es la única vía.
    - Usa `approvals.exec` solo cuando los prompts también deban reenviarse a otros chats o a salas explícitas de operaciones.
    - Usa `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo cuando quieras explícitamente que los prompts de aprobación se publiquen de vuelta en la sala/tema de origen.
    - Las aprobaciones de Plugins son otra cosa aparte: usan `/approve` en el mismo chat de forma predeterminada, `approvals.plugin` opcional para reenvío, y solo algunos canales nativos mantienen además el manejo nativo de aprobación de Plugins.

    Versión corta: el reenvío es para enrutamiento, la configuración del cliente nativo es para una UX más rica específica del canal.
    Consulta [Aprobaciones de Exec](/es/tools/exec-approvals).

  </Accordion>

  <Accordion title="¿Qué runtime necesito?">
    Se requiere Node **>= 22**. Se recomienda `pnpm`. Bun **no se recomienda** para el Gateway.
  </Accordion>

  <Accordion title="¿Funciona en Raspberry Pi?">
    Sí. El Gateway es ligero; la documentación indica que **512MB-1GB de RAM**, **1 núcleo** y unos **500MB**
    de disco son suficientes para uso personal, y señala que una **Raspberry Pi 4 puede ejecutarlo**.

    Si quieres margen adicional (registros, multimedia, otros servicios), se recomiendan **2GB**, pero no es un mínimo estricto.

    Consejo: un Pi/VPS pequeño puede alojar el Gateway, y puedes emparejar **Nodes** en tu portátil/teléfono para
    pantalla/cámara/canvas locales o ejecución de comandos. Consulta [Nodes](/es/nodes).

  </Accordion>

  <Accordion title="¿Algún consejo para instalaciones en Raspberry Pi?">
    Versión corta: funciona, pero espera algunas asperezas.

    - Usa un sistema operativo de **64 bits** y mantén Node >= 22.
    - Prefiere la instalación **editable (git)** para poder ver registros y actualizar rápido.
    - Empieza sin canales/Skills, luego añádelos uno por uno.
    - Si te encuentras con problemas raros de binarios, normalmente es un problema de **compatibilidad ARM**.

    Documentación: [Linux](/es/platforms/linux), [Instalación](/es/install).

  </Accordion>

  <Accordion title="Se queda atascado en wake up my friend / la incorporación no termina de arrancar. ¿Y ahora qué?">
    Esa pantalla depende de que el Gateway sea accesible y esté autenticado. La TUI también envía
    "Wake up, my friend!" automáticamente en el primer inicio. Si ves esa línea **sin respuesta**
    y los tokens permanecen en 0, el agente nunca se ejecutó.

    1. Reinicia el Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Comprueba estado + autenticación:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Si sigue bloqueado, ejecuta:

    ```bash
    openclaw doctor
    ```

    Si el Gateway es remoto, asegúrate de que la conexión del túnel/Tailscale esté activa y de que la UI
    apunte al Gateway correcto. Consulta [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Puedo migrar mi configuración a una máquina nueva (Mac mini) sin rehacer la incorporación?">
    Sí. Copia el **directorio de estado** y el **espacio de trabajo**, luego ejecuta Doctor una vez. Esto
    mantiene tu bot “exactamente igual” (memory, historial de sesiones, autenticación y estado
    de canales) siempre que copies **ambas** ubicaciones:

    1. Instala OpenClaw en la nueva máquina.
    2. Copia `$OPENCLAW_STATE_DIR` (predeterminado: `~/.openclaw`) desde la máquina antigua.
    3. Copia tu espacio de trabajo (predeterminado: `~/.openclaw/workspace`).
    4. Ejecuta `openclaw doctor` y reinicia el servicio Gateway.

    Eso conserva configuración, perfiles de autenticación, credenciales de WhatsApp, sesiones y memory. Si estás en
    modo remoto, recuerda que el host del gateway es propietario del almacén de sesiones y del espacio de trabajo.

    **Importante:** si solo haces commit/push de tu espacio de trabajo a GitHub, estás haciendo copia de seguridad
    de **memory + archivos de arranque**, pero **no** del historial de sesiones ni de la autenticación. Esos viven
    en `~/.openclaw/` (por ejemplo `~/.openclaw/agents/<agentId>/sessions/`).

    Relacionado: [Migración](/es/install/migrating), [Dónde vive cada cosa en disco](#where-things-live-on-disk),
    [Espacio de trabajo del agente](/es/concepts/agent-workspace), [Doctor](/es/gateway/doctor),
    [Modo remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Dónde veo qué hay de nuevo en la última versión?">
    Consulta el changelog en GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Las entradas más recientes están arriba. Si la sección superior está marcada como **Unreleased**, la siguiente
    sección fechada es la última versión publicada. Las entradas se agrupan por **Highlights**, **Changes** y
    **Fixes** (más secciones de docs/u otras cuando haga falta).

  </Accordion>

  <Accordion title="No se puede acceder a docs.openclaw.ai (error SSL)">
    Algunas conexiones de Comcast/Xfinity bloquean incorrectamente `docs.openclaw.ai` mediante Xfinity
    Advanced Security. Desactívalo o añade `docs.openclaw.ai` a la lista de permitidos y vuelve a intentarlo.
    Por favor ayúdanos a desbloquearlo informándolo aquí: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Si sigues sin poder acceder al sitio, la documentación está replicada en GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Diferencia entre estable y beta">
    **Estable** y **beta** son **dist-tags de npm**, no líneas de código separadas:

    - `latest` = estable
    - `beta` = compilación temprana para pruebas

    Normalmente, una versión estable llega primero a **beta** y luego un paso explícito
    de promoción mueve esa misma versión a `latest`. Los responsables también pueden
    publicar directamente en `latest` cuando sea necesario. Por eso beta y estable pueden
    apuntar a la **misma versión** después de la promoción.

    Consulta qué cambió:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Para comandos de instalación en una línea y la diferencia entre beta y dev, consulta el acordeón de abajo.

  </Accordion>

  <Accordion title="¿Cómo instalo la versión beta y cuál es la diferencia entre beta y dev?">
    **Beta** es el dist-tag de npm `beta` (puede coincidir con `latest` después de la promoción).
    **Dev** es la cabeza móvil de `main` (git); cuando se publica, usa el dist-tag de npm `dev`.

    Comandos en una línea (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalador de Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Más detalle: [Canales de desarrollo](/es/install/development-channels) y [Flags del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="¿Cómo pruebo lo último disponible?">
    Dos opciones:

    1. **Canal dev (checkout de git):**

    ```bash
    openclaw update --channel dev
    ```

    Esto cambia a la rama `main` y actualiza desde el código fuente.

    2. **Instalación editable (desde el sitio del instalador):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Eso te da un repositorio local que puedes editar y luego actualizar mediante git.

    Si prefieres un clon limpio manual, usa:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentación: [Actualizar](/es/cli/update), [Canales de desarrollo](/es/install/development-channels),
    [Instalación](/es/install).

  </Accordion>

  <Accordion title="¿Cuánto suelen tardar la instalación y la incorporación?">
    Guía aproximada:

    - **Instalación:** 2-5 minutos
    - **Incorporación:** 5-15 minutos dependiendo de cuántos canales/modelos configures

    Si se queda colgado, usa [Instalador bloqueado](#quick-start-and-first-run-setup)
    y el bucle rápido de depuración de [Estoy bloqueado](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="¿El instalador está bloqueado? ¿Cómo obtengo más información?">
    Vuelve a ejecutar el instalador con **salida detallada**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalación beta con detalle:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Para una instalación editable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Equivalente en Windows (PowerShell):

    ```powershell
    # install.ps1 aún no tiene una flag -Verbose específica.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Más opciones: [Flags del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="La instalación en Windows dice git not found o openclaw not recognized">
    Dos problemas comunes en Windows:

    **1) error de npm spawn git / git not found**

    - Instala **Git for Windows** y asegúrate de que `git` esté en tu PATH.
    - Cierra y vuelve a abrir PowerShell, luego vuelve a ejecutar el instalador.

    **2) openclaw is not recognized después de instalar**

    - Tu carpeta bin global de npm no está en PATH.
    - Comprueba la ruta:

      ```powershell
      npm config get prefix
      ```

    - Añade ese directorio a tu PATH de usuario (en Windows no hace falta el sufijo `\bin`; en la mayoría de sistemas es `%AppData%\npm`).
    - Cierra y vuelve a abrir PowerShell después de actualizar PATH.

    Si quieres la configuración más fluida en Windows, usa **WSL2** en lugar de Windows nativo.
    Documentación: [Windows](/es/platforms/windows).

  </Accordion>

  <Accordion title="La salida de exec en Windows muestra texto chino corrupto. ¿Qué debo hacer?">
    Esto normalmente es un desajuste de página de códigos de consola en shells nativos de Windows.

    Síntomas:

    - La salida de `system.run`/`exec` muestra texto chino como mojibake
    - El mismo comando se ve bien en otro perfil de terminal

    Solución rápida en PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Luego reinicia el Gateway y vuelve a probar el comando:

    ```powershell
    openclaw gateway restart
    ```

    Si sigues reproduciendo esto en la última versión de OpenClaw, sigue/informa aquí:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentación no respondió a mi pregunta. ¿Cómo consigo una mejor respuesta?">
    Usa la **instalación editable (git)** para tener el código fuente y la documentación completos de forma local, luego pregunta
    a tu bot (o a Claude/Codex) _desde esa carpeta_ para que pueda leer el repositorio y responder con precisión.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Más detalle: [Instalación](/es/install) y [Flags del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="¿Cómo instalo OpenClaw en Linux?">
    Respuesta corta: sigue la guía de Linux y luego ejecuta la incorporación.

    - Ruta rápida de Linux + instalación del servicio: [Linux](/es/platforms/linux).
    - Recorrido completo: [Primeros pasos](/es/start/getting-started).
    - Instalador + actualizaciones: [Instalación y actualizaciones](/es/install/updating).

  </Accordion>

  <Accordion title="¿Cómo instalo OpenClaw en un VPS?">
    Cualquier VPS Linux sirve. Instálalo en el servidor y luego usa SSH/Tailscale para acceder al Gateway.

    Guías: [exe.dev](/es/install/exe-dev), [Hetzner](/es/install/hetzner), [Fly.io](/es/install/fly).
    Acceso remoto: [Gateway remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Dónde están las guías de instalación en la nube/VPS?">
    Mantenemos un **centro de alojamiento** con los proveedores más comunes. Elige uno y sigue la guía:

    - [Alojamiento VPS](/es/vps) (todos los proveedores en un solo lugar)
    - [Fly.io](/es/install/fly)
    - [Hetzner](/es/install/hetzner)
    - [exe.dev](/es/install/exe-dev)

    Cómo funciona en la nube: el **Gateway se ejecuta en el servidor**, y accedes a él
    desde tu portátil/teléfono mediante la Control UI (o Tailscale/SSH). Tu estado + espacio de trabajo
    viven en el servidor, así que trata el host como fuente de verdad y haz copias de seguridad.

    Puedes emparejar **Nodes** (Mac/iOS/Android/headless) con ese Gateway en la nube para acceder a
    pantalla/cámara/canvas locales o ejecutar comandos en tu portátil mientras mantienes el
    Gateway en la nube.

    Centro: [Plataformas](/es/platforms). Acceso remoto: [Gateway remoto](/es/gateway/remote).
    Nodes: [Nodes](/es/nodes), [CLI de Nodes](/es/cli/nodes).

  </Accordion>

  <Accordion title="¿Puedo pedirle a OpenClaw que se actualice a sí mismo?">
    Respuesta corta: **posible, no recomendable**. El flujo de actualización puede reiniciar el
    Gateway (lo que cierra la sesión activa), puede necesitar un checkout limpio de git y
    puede pedir confirmación. Es más seguro ejecutar las actualizaciones desde un shell como operador.

    Usa la CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Si necesitas automatizarlo desde un agente:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentación: [Actualizar](/es/cli/update), [Actualización](/es/install/updating).

  </Accordion>

  <Accordion title="¿Qué hace realmente la incorporación?">
    `openclaw onboard` es la ruta de configuración recomendada. En **modo local** te guía por:

    - **Configuración de modelo/autenticación** (OAuth del proveedor, API keys, setup-token de Anthropic, además de opciones de modelos locales como LM Studio)
    - Ubicación del **espacio de trabajo** + archivos de arranque
    - **Ajustes del Gateway** (bind/puerto/autenticación/tailscale)
    - **Canales** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, además de Plugins de canal incluidos como QQ Bot)
    - **Instalación de daemon** (LaunchAgent en macOS; unidad de usuario systemd en Linux/WSL2)
    - **Comprobaciones de estado** y selección de **Skills**

    También avisa si tu modelo configurado es desconocido o le falta autenticación.

  </Accordion>

  <Accordion title="¿Necesito una suscripción de Claude o OpenAI para ejecutar esto?">
    No. Puedes ejecutar OpenClaw con **API keys** (Anthropic/OpenAI/otros) o con
    **modelos solo locales** para que tus datos permanezcan en tu dispositivo. Las suscripciones (Claude
    Pro/Max u OpenAI Codex) son formas opcionales de autenticar esos proveedores.

    Para Anthropic en OpenClaw, la división práctica es:

    - **API key de Anthropic**: facturación normal de la API de Anthropic
    - **Claude CLI / autenticación por suscripción de Claude en OpenClaw**: el personal de Anthropic
      nos dijo que este uso vuelve a estar permitido, y OpenClaw está tratando el uso de `claude -p`
      como autorizado para esta integración salvo que Anthropic publique una nueva
      política

    Para hosts Gateway de larga duración, las API keys de Anthropic siguen siendo la configuración más
    predecible. OpenAI Codex OAuth está explícitamente soportado para herramientas externas
    como OpenClaw.

    OpenClaw también admite otras opciones alojadas tipo suscripción, incluidas
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** y
    **Z.AI / GLM Coding Plan**.

    Documentación: [Anthropic](/es/providers/anthropic), [OpenAI](/es/providers/openai),
    [Qwen Cloud](/es/providers/qwen),
    [MiniMax](/es/providers/minimax), [Modelos GLM](/es/providers/glm),
    [Modelos locales](/es/gateway/local-models), [Modelos](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Puedo usar la suscripción Claude Max sin API key?">
    Sí.

    El personal de Anthropic nos dijo que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, así que
    OpenClaw trata la autenticación por suscripción de Claude y el uso de `claude -p` como autorizados
    para esta integración salvo que Anthropic publique una nueva política. Si quieres
    la configuración del lado del servidor más predecible, usa una API key de Anthropic en su lugar.

  </Accordion>

  <Accordion title="¿Soportan autenticación por suscripción de Claude (Claude Pro o Max)?">
    Sí.

    El personal de Anthropic nos dijo que este uso vuelve a estar permitido, así que OpenClaw trata
    la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración
    salvo que Anthropic publique una nueva política.

    El setup-token de Anthropic sigue disponible como ruta de token compatible en OpenClaw, pero ahora OpenClaw prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.
    Para cargas de trabajo de producción o multiusuario, la autenticación por API key de Anthropic sigue siendo la
    opción más segura y predecible. Si quieres otras opciones alojadas tipo suscripción
    en OpenClaw, consulta [OpenAI](/es/providers/openai), [Qwen / Model
    Cloud](/es/providers/qwen), [MiniMax](/es/providers/minimax) y [Modelos
    GLM](/es/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="¿Por qué veo HTTP 429 rate_limit_error de Anthropic?">
    Eso significa que tu **cuota/límite de velocidad de Anthropic** está agotado para la ventana actual. Si
    usas **Claude CLI**, espera a que se restablezca la ventana o mejora tu plan. Si
    usas una **API key de Anthropic**, revisa Anthropic Console
    para ver uso/facturación y aumenta los límites según sea necesario.

    Si el mensaje es específicamente:
    `Extra usage is required for long context requests`, la solicitud intenta usar
    la beta de contexto 1M de Anthropic (`context1m: true`). Eso solo funciona cuando tu
    credencial es apta para facturación de contexto largo (facturación con API key o la
    ruta de inicio de sesión de Claude de OpenClaw con Extra Usage habilitado).

    Consejo: configura un **modelo de respaldo** para que OpenClaw pueda seguir respondiendo mientras un proveedor está limitado por tasa.
    Consulta [Modelos](/es/cli/models), [OAuth](/es/concepts/oauth), y
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/es/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="¿Se admite AWS Bedrock?">
    Sí. OpenClaw incluye un proveedor **Amazon Bedrock (Converse)**. Con marcadores de entorno de AWS presentes, OpenClaw puede detectar automáticamente el catálogo Bedrock de streaming/texto y fusionarlo como un proveedor implícito `amazon-bedrock`; en caso contrario, puedes habilitar explícitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` o añadir una entrada manual de proveedor. Consulta [Amazon Bedrock](/es/providers/bedrock) y [Proveedores de modelos](/es/providers/models). Si prefieres un flujo de claves gestionado, un proxy compatible con OpenAI delante de Bedrock sigue siendo una opción válida.
  </Accordion>

  <Accordion title="¿Cómo funciona la autenticación de Codex?">
    OpenClaw admite **OpenAI Code (Codex)** mediante OAuth (inicio de sesión de ChatGPT). Usa
    `openai-codex/gpt-5.5` para OAuth de Codex mediante el runner PI predeterminado. Usa
    `openai/gpt-5.4` para el acceso directo actual mediante API key de OpenAI. El acceso directo con
    API key a GPT-5.5 se admite una vez que OpenAI lo habilite en la API pública; hoy
    GPT-5.5 usa suscripción/OAuth mediante `openai-codex/gpt-5.5` o ejecuciones nativas
    de app-server de Codex con `openai/gpt-5.5` y `embeddedHarness.runtime: "codex"`.
    Consulta [Proveedores de modelos](/es/concepts/model-providers) e [Incorporación (CLI)](/es/start/wizard).
  </Accordion>

  <Accordion title="¿Por qué OpenClaw sigue mencionando openai-codex?">
    `openai-codex` es el id del proveedor y del perfil de autenticación para OAuth de ChatGPT/Codex.
    También es el prefijo explícito del modelo PI para OAuth de Codex:

    - `openai/gpt-5.4` = ruta directa actual de API key de OpenAI en PI
    - `openai/gpt-5.5` = futura ruta directa con API key una vez OpenAI habilite GPT-5.5 en la API
    - `openai-codex/gpt-5.5` = ruta OAuth de Codex en PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = ruta nativa de app-server de Codex
    - `openai-codex:...` = id del perfil de autenticación, no una referencia de modelo

    Si quieres la ruta directa de facturación/límites de OpenAI Platform, configura
    `OPENAI_API_KEY`. Si quieres autenticación por suscripción de ChatGPT/Codex, inicia sesión con
    `openclaw models auth login --provider openai-codex` y usa
    referencias de modelo `openai-codex/*` para ejecuciones PI.

  </Accordion>

  <Accordion title="¿Por qué los límites de Codex OAuth pueden diferir de los de ChatGPT web?">
    Codex OAuth usa ventanas de cuota dependientes del plan y gestionadas por OpenAI. En la práctica,
    esos límites pueden diferir de la experiencia del sitio/app de ChatGPT, incluso cuando
    ambos están vinculados a la misma cuenta.

    OpenClaw puede mostrar las ventanas visibles actuales de uso/cuota del proveedor en
    `openclaw models status`, pero no inventa ni normaliza
    los derechos de ChatGPT web en acceso directo a API. Si quieres la ruta directa de
    facturación/límites de OpenAI Platform, usa `openai/*` con una API key.

  </Accordion>

  <Accordion title="¿Admiten autenticación por suscripción de OpenAI (Codex OAuth)?">
    Sí. OpenClaw admite completamente **OpenAI Code (Codex) subscription OAuth**.
    OpenAI permite explícitamente el uso de OAuth por suscripción en herramientas/flujos externos
    como OpenClaw. La incorporación puede ejecutar el flujo OAuth por ti.

    Consulta [OAuth](/es/concepts/oauth), [Proveedores de modelos](/es/concepts/model-providers), e [Incorporación (CLI)](/es/start/wizard).

  </Accordion>

  <Accordion title="¿Cómo configuro OAuth de Gemini CLI?">
    Gemini CLI usa un **flujo de autenticación de Plugin**, no un client id ni un secret en `openclaw.json`.

    Pasos:

    1. Instala Gemini CLI localmente para que `gemini` esté en `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Habilita el Plugin: `openclaw plugins enable google`
    3. Inicia sesión: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modelo predeterminado después del inicio de sesión: `google-gemini-cli/gemini-3-flash-preview`
    5. Si las solicitudes fallan, configura `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host del gateway

    Esto almacena los tokens OAuth en perfiles de autenticación en el host del gateway. Detalles: [Proveedores de modelos](/es/concepts/model-providers).

  </Accordion>

  <Accordion title="¿Un modelo local sirve para chats casuales?">
    Normalmente no. OpenClaw necesita gran contexto + seguridad sólida; las tarjetas pequeñas truncan y filtran información. Si debes hacerlo, ejecuta la compilación de modelo **más grande** que puedas localmente (LM Studio) y consulta [/gateway/local-models](/es/gateway/local-models). Los modelos más pequeños/cuantizados aumentan el riesgo de inyección de prompts; consulta [Seguridad](/es/gateway/security).
  </Accordion>

  <Accordion title="¿Cómo mantengo el tráfico de modelos alojados en una región específica?">
    Elige endpoints fijados a una región. OpenRouter expone opciones alojadas en EE. UU. para MiniMax, Kimi y GLM; elige la variante alojada en EE. UU. para mantener los datos dentro de esa región. Puedes seguir listando Anthropic/OpenAI junto con estos usando `models.mode: "merge"` para que los respaldos sigan disponibles respetando al mismo tiempo el proveedor regional que selecciones.
  </Accordion>

  <Accordion title="¿Tengo que comprar un Mac Mini para instalar esto?">
    No. OpenClaw funciona en macOS o Linux (Windows mediante WSL2). Un Mac mini es opcional; algunas personas
    compran uno como host siempre activo, pero también sirve un VPS pequeño, un servidor doméstico o una caja tipo Raspberry Pi.

    Solo necesitas un Mac **para herramientas exclusivas de macOS**. Para iMessage, usa [BlueBubbles](/es/channels/bluebubbles) (recomendado); el servidor BlueBubbles funciona en cualquier Mac, y el Gateway puede ejecutarse en Linux o en otro lugar. Si quieres otras herramientas exclusivas de macOS, ejecuta el Gateway en un Mac o empareja un Node de macOS.

    Documentación: [BlueBubbles](/es/channels/bluebubbles), [Nodes](/es/nodes), [Modo remoto de Mac](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Necesito un Mac mini para soporte de iMessage?">
    Necesitas **algún dispositivo macOS** con sesión iniciada en Mensajes. **No** tiene que ser un Mac mini;
    cualquier Mac sirve. **Usa [BlueBubbles](/es/channels/bluebubbles)** (recomendado) para iMessage; el servidor BlueBubbles funciona en macOS, mientras que el Gateway puede ejecutarse en Linux o en otro lugar.

    Configuraciones comunes:

    - Ejecutar el Gateway en Linux/VPS y ejecutar el servidor BlueBubbles en cualquier Mac con sesión iniciada en Mensajes.
    - Ejecutarlo todo en el Mac si quieres la configuración más simple en una sola máquina.

    Documentación: [BlueBubbles](/es/channels/bluebubbles), [Nodes](/es/nodes),
    [Modo remoto de Mac](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si compro un Mac mini para ejecutar OpenClaw, ¿puedo conectarlo a mi MacBook Pro?">
    Sí. El **Mac mini puede ejecutar el Gateway**, y tu MacBook Pro puede conectarse como
    **Node** (dispositivo complementario). Los Nodes no ejecutan el Gateway; proporcionan capacidades
    adicionales como pantalla/cámara/canvas y `system.run` en ese dispositivo.

    Patrón común:

    - Gateway en el Mac mini (siempre activo).
    - El MacBook Pro ejecuta la app de macOS o un host Node y se empareja con el Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` para verlo.

    Documentación: [Nodes](/es/nodes), [CLI de Nodes](/es/cli/nodes).

  </Accordion>

  <Accordion title="¿Puedo usar Bun?">
    Bun **no se recomienda**. Vemos errores de runtime, especialmente con WhatsApp y Telegram.
    Usa **Node** para gateways estables.

    Si aun así quieres experimentar con Bun, hazlo en un gateway no productivo
    sin WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ¿qué va en allowFrom?">
    `channels.telegram.allowFrom` es **el ID de usuario de Telegram del remitente humano** (numérico). No es el nombre de usuario del bot.

    La configuración pide solo ID numéricos de usuario. Si ya tienes entradas heredadas `@username` en la configuración, `openclaw doctor --fix` puede intentar resolverlas.

    Más seguro (sin bot de terceros):

    - Envía un DM a tu bot y luego ejecuta `openclaw logs --follow` y lee `from.id`.

    API oficial de bots:

    - Envía un DM a tu bot y luego llama a `https://api.telegram.org/bot<bot_token>/getUpdates` y lee `message.from.id`.

    Terceros (menos privado):

    - Envía un DM a `@userinfobot` o `@getidsbot`.

    Consulta [/channels/telegram](/es/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="¿Pueden varias personas usar un número de WhatsApp con distintas instancias de OpenClaw?">
    Sí, mediante **enrutamiento multiagente**. Vincula el **DM** de WhatsApp de cada remitente (peer `kind: "direct"`, remitente E.164 como `+15551234567`) a un `agentId` distinto, para que cada persona tenga su propio espacio de trabajo y almacén de sesiones. Las respuestas seguirán viniendo de la **misma cuenta de WhatsApp**, y el control de acceso de DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) es global por cuenta de WhatsApp. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent) y [WhatsApp](/es/channels/whatsapp).
  </Accordion>

  <Accordion title='¿Puedo tener un agente de "chat rápido" y otro de "Opus para programación"?'>
    Sí. Usa enrutamiento multiagente: da a cada agente su propio modelo predeterminado y luego vincula rutas de entrada (cuenta del proveedor o peers específicos) a cada agente. Hay una configuración de ejemplo en [Enrutamiento multiagente](/es/concepts/multi-agent). Consulta también [Modelos](/es/concepts/models) y [Configuración](/es/gateway/configuration).
  </Accordion>

  <Accordion title="¿Homebrew funciona en Linux?">
    Sí. Homebrew es compatible con Linux (Linuxbrew). Configuración rápida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Si ejecutas OpenClaw mediante systemd, asegúrate de que el PATH del servicio incluya `/home/linuxbrew/.linuxbrew/bin` (o tu prefijo de brew) para que las herramientas instaladas con `brew` se resuelvan en shells sin login.
    Las compilaciones recientes también anteponen directorios bin comunes de usuario en servicios Linux systemd (por ejemplo `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) y respetan `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` y `FNM_DIR` cuando están configurados.

  </Accordion>

  <Accordion title="Diferencia entre la instalación editable con git y npm install">
    - **Instalación editable (git):** checkout completo del código fuente, editable, ideal para colaboradores.
      Ejecutas compilaciones localmente y puedes parchear código/documentación.
    - **npm install:** instalación global de la CLI, sin repositorio, ideal para “simplemente ejecutarlo”.
      Las actualizaciones vienen de los dist-tags de npm.

    Documentación: [Primeros pasos](/es/start/getting-started), [Actualización](/es/install/updating).

  </Accordion>

  <Accordion title="¿Puedo cambiar más tarde entre instalación npm y git?">
    Sí. Instala la otra variante y luego ejecuta Doctor para que el servicio gateway apunte al nuevo punto de entrada.
    Esto **no borra tus datos**; solo cambia la instalación del código de OpenClaw. Tu estado
    (`~/.openclaw`) y espacio de trabajo (`~/.openclaw/workspace`) permanecen intactos.

    De npm a git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    De git a npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor detecta una discrepancia de punto de entrada del servicio gateway y ofrece reescribir la configuración del servicio para que coincida con la instalación actual (usa `--repair` en automatización).

    Consejos de copia de seguridad: consulta [Estrategia de copia de seguridad](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="¿Debería ejecutar el Gateway en mi portátil o en un VPS?">
    Respuesta corta: **si quieres fiabilidad 24/7, usa un VPS**. Si quieres la
    menor fricción posible y te sirven los modos de suspensión/reinicio, ejecútalo localmente.

    **Portátil (Gateway local)**

    - **Ventajas:** sin coste de servidor, acceso directo a archivos locales, ventana del navegador en vivo.
    - **Desventajas:** suspensión/cortes de red = desconexiones, actualizaciones/reinicios del sistema operativo interrumpen, debe permanecer despierto.

    **VPS / nube**

    - **Ventajas:** siempre activo, red estable, sin problemas de suspensión del portátil, más fácil de mantener en ejecución.
    - **Desventajas:** normalmente en modo headless (usa capturas de pantalla), acceso a archivos solo remoto, debes usar SSH para actualizar.

    **Nota específica de OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funcionan perfectamente desde un VPS. La única compensación real es **navegador headless** frente a una ventana visible. Consulta [Browser](/es/tools/browser).

    **Valor predeterminado recomendado:** VPS si antes tuviste desconexiones del gateway. La ejecución local es excelente cuando estás usando activamente el Mac y quieres acceso a archivos locales o automatización de UI con un navegador visible.

  </Accordion>

  <Accordion title="¿Qué tan importante es ejecutar OpenClaw en una máquina dedicada?">
    No es obligatorio, pero **sí recomendable para fiabilidad y aislamiento**.

    - **Host dedicado (VPS/Mac mini/Pi):** siempre activo, menos interrupciones por suspensión/reinicio, permisos más limpios, más fácil de mantener en ejecución.
    - **Portátil/escritorio compartido:** totalmente válido para pruebas y uso activo, pero espera pausas cuando la máquina se suspenda o se actualice.

    Si quieres lo mejor de ambos mundos, mantén el Gateway en un host dedicado y empareja tu portátil como **Node** para herramientas locales de pantalla/cámara/exec. Consulta [Nodes](/es/nodes).
    Para orientación de seguridad, lee [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Cuáles son los requisitos mínimos de VPS y el sistema operativo recomendado?">
    OpenClaw es ligero. Para un Gateway básico + un canal de chat:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM, ~500MB de disco.
    - **Recomendado:** 1-2 vCPU, 2GB de RAM o más para tener margen (registros, multimedia, múltiples canales). Las herramientas Node y la automatización del navegador pueden consumir bastantes recursos.

    SO: usa **Ubuntu LTS** (o cualquier Debian/Ubuntu moderno). La ruta de instalación en Linux está mejor probada ahí.

    Documentación: [Linux](/es/platforms/linux), [Alojamiento VPS](/es/vps).

  </Accordion>

  <Accordion title="¿Puedo ejecutar OpenClaw en una VM y cuáles son los requisitos?">
    Sí. Trata una VM igual que un VPS: debe estar siempre encendida, ser accesible y tener suficiente
    RAM para el Gateway y cualquier canal que habilites.

    Orientación de base:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM.
    - **Recomendado:** 2GB de RAM o más si ejecutas múltiples canales, automatización del navegador o herramientas multimedia.
    - **SO:** Ubuntu LTS u otro Debian/Ubuntu moderno.

    Si estás en Windows, **WSL2 es la configuración tipo VM más sencilla** y la que ofrece mejor compatibilidad
    con las herramientas. Consulta [Windows](/es/platforms/windows), [Alojamiento VPS](/es/vps).
    Si estás ejecutando macOS en una VM, consulta [VM de macOS](/es/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Relacionado

- [FAQ](/es/help/faq): la FAQ principal (modelos, sesiones, gateway, seguridad y más)
- [Resumen de instalación](/es/install)
- [Primeros pasos](/es/start/getting-started)
- [Solución de problemas](/es/help/troubleshooting)
