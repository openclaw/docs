---
read_when:
    - Responder preguntas comunes de soporte sobre configuración, instalación, incorporación o tiempo de ejecución
    - Clasificar los problemas reportados por los usuarios antes de una depuración más profunda
summary: Preguntas frecuentes sobre la configuración, la configuración y el uso de OpenClaw
title: Preguntas frecuentes
x-i18n:
    generated_at: "2026-04-20T05:21:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bdb17fc4d8c61a36f3a9fc3ca4a20f723cfa6c9bbbc92f963d6e313181f3451
    source_path: help/faq.md
    workflow: 15
---

# Preguntas frecuentes

Respuestas rápidas más una solución de problemas más profunda para configuraciones reales (desarrollo local, VPS, multiagente, OAuth/claves de API, conmutación por error del modelo). Para diagnósticos en tiempo de ejecución, consulta [Solución de problemas](/es/gateway/troubleshooting). Para la referencia completa de configuración, consulta [Configuración](/es/gateway/configuration).

## Primeros 60 segundos si algo está roto

1. **Estado rápido (primera comprobación)**

   ```bash
   openclaw status
   ```

   Resumen local rápido: SO + actualización, accesibilidad del gateway/servicio, agentes/sesiones, configuración del proveedor + problemas en tiempo de ejecución (cuando el gateway es accesible).

2. **Informe copiable (seguro para compartir)**

   ```bash
   openclaw status --all
   ```

   Diagnóstico de solo lectura con cola del registro (tokens redactados).

3. **Estado del demonio + puerto**

   ```bash
   openclaw gateway status
   ```

   Muestra el tiempo de ejecución del supervisor frente a la accesibilidad de RPC, la URL de destino de la sonda y qué configuración probablemente usó el servicio.

4. **Sondas profundas**

   ```bash
   openclaw status --deep
   ```

   Ejecuta una sonda de estado del gateway en vivo, incluidas las sondas de canal cuando son compatibles
   (requiere un gateway accesible). Consulta [Health](/es/gateway/health).

5. **Seguir el último registro**

   ```bash
   openclaw logs --follow
   ```

   Si RPC no está disponible, usa esto como alternativa:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Los registros de archivo están separados de los registros del servicio; consulta [Registro](/es/logging) y [Solución de problemas](/es/gateway/troubleshooting).

6. **Ejecutar Doctor (reparaciones)**

   ```bash
   openclaw doctor
   ```

   Repara/migra configuración/estado + ejecuta comprobaciones de estado. Consulta [Doctor](/es/gateway/doctor).

7. **Instantánea del Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # muestra la URL de destino + la ruta de configuración en los errores
   ```

   Solicita al gateway en ejecución una instantánea completa (solo WS). Consulta [Health](/es/gateway/health).

## Inicio rápido y configuración inicial

<AccordionGroup>
  <Accordion title="Estoy bloqueado; la forma más rápida de desbloquearme">
    Usa un agente de IA local que pueda **ver tu máquina**. Eso es mucho más efectivo que preguntar
    en Discord, porque la mayoría de los casos de "estoy bloqueado" son **problemas locales de configuración o entorno** que
    los ayudantes remotos no pueden inspeccionar.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Estas herramientas pueden leer el repositorio, ejecutar comandos, inspeccionar registros y ayudar a corregir la configuración
    de tu máquina (PATH, servicios, permisos, archivos de autenticación). Dales el **checkout completo del código fuente** mediante
    la instalación hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Esto instala OpenClaw **desde un checkout de git**, para que el agente pueda leer el código + la documentación y
    razonar sobre la versión exacta que estás ejecutando. Siempre puedes volver a estable más adelante
    volviendo a ejecutar el instalador sin `--install-method git`.

    Consejo: pídele al agente que **planifique y supervise** la corrección (paso a paso), y luego ejecute solo los
    comandos necesarios. Eso mantiene los cambios pequeños y más fáciles de auditar.

    Si descubres un error real o una corrección, por favor abre un issue en GitHub o envía un PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Empieza con estos comandos (comparte las salidas al pedir ayuda):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Lo que hacen:

    - `openclaw status`: instantánea rápida del estado del gateway/agente + configuración básica.
    - `openclaw models status`: comprueba la autenticación del proveedor + la disponibilidad del modelo.
    - `openclaw doctor`: valida y repara problemas comunes de configuración/estado.

    Otras comprobaciones útiles de CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Bucle de depuración rápida: [Primeros 60 segundos si algo está roto](#primeros-60-segundos-si-algo-está-roto).
    Documentación de instalación: [Instalación](/es/install), [Indicadores del instalador](/es/install/installer), [Actualización](/es/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sigue saltándose ejecuciones. ¿Qué significan las razones de omisión?">
    Razones comunes por las que Heartbeat omite ejecuciones:

    - `quiet-hours`: fuera de la ventana configurada de horas activas
    - `empty-heartbeat-file`: `HEARTBEAT.md` existe pero solo contiene una estructura en blanco o solo encabezados
    - `no-tasks-due`: el modo de tareas de `HEARTBEAT.md` está activo pero ninguno de los intervalos de las tareas vence todavía
    - `alerts-disabled`: toda la visibilidad de heartbeat está desactivada (`showOk`, `showAlerts` y `useIndicator` están desactivados)

    En modo de tareas, las marcas de tiempo de vencimiento solo se adelantan después de que
    se completa una ejecución real de heartbeat.
    Las ejecuciones omitidas no marcan las tareas como completadas.

    Documentación: [Heartbeat](/es/gateway/heartbeat), [Automatización y tareas](/es/automation).

  </Accordion>

  <Accordion title="Forma recomendada de instalar y configurar OpenClaw">
    El repositorio recomienda ejecutar desde el código fuente y usar el onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    El asistente también puede compilar automáticamente los recursos de la UI. Después del onboarding, normalmente ejecutas el Gateway en el puerto **18789**.

    Desde el código fuente (colaboradores/desarrollo):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Si todavía no tienes una instalación global, ejecútalo con `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="¿Cómo abro el panel después del onboarding?">
    El asistente abre tu navegador con una URL limpia del panel (sin token) justo después del onboarding y también imprime el enlace en el resumen. Mantén abierta esa pestaña; si no se abrió, copia y pega la URL impresa en la misma máquina.
  </Accordion>

  <Accordion title="¿Cómo autentico el panel en localhost frente a remoto?">
    **Localhost (misma máquina):**

    - Abre `http://127.0.0.1:18789/`.
    - Si solicita autenticación con secreto compartido, pega el token o la contraseña configurados en la configuración de Control UI.
    - Origen del token: `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
    - Origen de la contraseña: `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Si todavía no hay ningún secreto compartido configurado, genera un token con `openclaw doctor --generate-gateway-token`.

    **No en localhost:**

    - **Tailscale Serve** (recomendado): mantén el enlace en loopback, ejecuta `openclaw gateway --tailscale serve`, abre `https://<magicdns>/`. Si `gateway.auth.allowTailscale` es `true`, los encabezados de identidad satisfacen la autenticación de Control UI/WebSocket (sin pegar un secreto compartido, asume un host de gateway de confianza); las API HTTP siguen requiriendo autenticación con secreto compartido a menos que uses deliberadamente `none` de entrada privada o autenticación HTTP de proxy de confianza.
      Los intentos concurrentes fallidos de autenticación de Serve desde el mismo cliente se serializan antes de que el limitador de autenticación fallida los registre, por lo que el segundo reintento fallido ya puede mostrar `retry later`.
    - **Enlace a tailnet**: ejecuta `openclaw gateway --bind tailnet --token "<token>"` (o configura autenticación con contraseña), abre `http://<tailscale-ip>:18789/`, luego pega el secreto compartido correspondiente en la configuración del panel.
    - **Proxy inverso con conocimiento de identidad**: mantén el Gateway detrás de un proxy de confianza que no sea loopback, configura `gateway.auth.mode: "trusted-proxy"`, luego abre la URL del proxy.
    - **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`. La autenticación con secreto compartido sigue aplicándose a través del túnel; pega el token o la contraseña configurados si se solicita.

    Consulta [Panel](/web/dashboard) y [Superficies web](/web) para ver los modos de enlace y los detalles de autenticación.

  </Accordion>

  <Accordion title="¿Por qué hay dos configuraciones de aprobación de exec para las aprobaciones en chat?">
    Controlan capas diferentes:

    - `approvals.exec`: reenvía solicitudes de aprobación a destinos de chat
    - `channels.<channel>.execApprovals`: hace que ese canal actúe como un cliente nativo de aprobación para aprobaciones de exec

    La política de exec del host sigue siendo la puerta real de aprobación. La configuración del chat solo controla dónde aparecen
    las solicitudes de aprobación y cómo la gente puede responderlas.

    En la mayoría de las configuraciones **no** necesitas ambas:

    - Si el chat ya admite comandos y respuestas, `/approve` en el mismo chat funciona mediante la ruta compartida.
    - Si un canal nativo compatible puede inferir aprobadores de forma segura, OpenClaw ahora habilita automáticamente aprobaciones nativas priorizando DM cuando `channels.<channel>.execApprovals.enabled` no está configurado o es `"auto"`.
    - Cuando las tarjetas/botones de aprobación nativa están disponibles, esa UI nativa es la ruta principal; el agente solo debe incluir un comando manual `/approve` si el resultado de la herramienta dice que las aprobaciones por chat no están disponibles o si la aprobación manual es la única ruta.
    - Usa `approvals.exec` solo cuando las solicitudes también deban reenviarse a otros chats o salas de operaciones explícitas.
    - Usa `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo cuando quieras explícitamente que las solicitudes de aprobación vuelvan a publicarse en la sala/tema de origen.
    - Las aprobaciones de Plugin vuelven a estar separadas: usan `/approve` en el mismo chat de forma predeterminada, reenvío opcional con `approvals.plugin`, y solo algunos canales nativos mantienen además el manejo nativo de aprobación de plugins.

    En resumen: el reenvío es para el enrutamiento; la configuración del cliente nativo es para una UX específica del canal más rica.
    Consulta [Aprobaciones de exec](/es/tools/exec-approvals).

  </Accordion>

  <Accordion title="¿Qué tiempo de ejecución necesito?">
    Se requiere Node **>= 22**. Se recomienda `pnpm`. Bun **no está recomendado** para el Gateway.
  </Accordion>

  <Accordion title="¿Funciona en Raspberry Pi?">
    Sí. El Gateway es ligero: la documentación indica que **512 MB-1 GB de RAM**, **1 núcleo** y aproximadamente **500 MB**
    de disco son suficientes para uso personal, y señala que una **Raspberry Pi 4 puede ejecutarlo**.

    Si quieres margen adicional (registros, medios, otros servicios), se recomiendan **2 GB**, pero
    no es un mínimo estricto.

    Consejo: un Pi/VPS pequeño puede alojar el Gateway, y puedes emparejar **nodes** en tu portátil/teléfono para
    pantalla/cámara/canvas locales o ejecución de comandos. Consulta [Nodes](/es/nodes).

  </Accordion>

  <Accordion title="¿Algún consejo para instalaciones en Raspberry Pi?">
    En resumen: funciona, pero espera ciertas asperezas.

    - Usa un SO de **64 bits** y mantén Node >= 22.
    - Prefiere la **instalación hackable (git)** para poder ver los registros y actualizar rápidamente.
    - Empieza sin channels/Skills, luego añádelos uno por uno.
    - Si encuentras problemas binarios extraños, normalmente es un problema de **compatibilidad ARM**.

    Documentación: [Linux](/es/platforms/linux), [Instalación](/es/install).

  </Accordion>

  <Accordion title="Se queda bloqueado en wake up my friend / el onboarding no termina de iniciarse. ¿Y ahora qué?">
    Esa pantalla depende de que el Gateway sea accesible y esté autenticado. La TUI también envía
    "Wake up, my friend!" automáticamente en la primera activación. Si ves esa línea con **sin respuesta**
    y los tokens permanecen en 0, el agente nunca se ejecutó.

    1. Reinicia el Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Comprueba el estado + autenticación:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Si sigue bloqueado, ejecuta:

    ```bash
    openclaw doctor
    ```

    Si el Gateway es remoto, asegúrate de que la conexión de túnel/Tailscale esté activa y de que la UI
    apunte al Gateway correcto. Consulta [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Puedo migrar mi configuración a una máquina nueva (Mac mini) sin rehacer el onboarding?">
    Sí. Copia el **directorio de estado** y el **workspace**, luego ejecuta Doctor una vez. Esto
    mantiene tu bot "exactamente igual" (memoria, historial de sesión, autenticación y
    estado del canal) siempre que copies **ambas** ubicaciones:

    1. Instala OpenClaw en la nueva máquina.
    2. Copia `$OPENCLAW_STATE_DIR` (predeterminado: `~/.openclaw`) desde la máquina antigua.
    3. Copia tu workspace (predeterminado: `~/.openclaw/workspace`).
    4. Ejecuta `openclaw doctor` y reinicia el servicio Gateway.

    Eso preserva la configuración, los perfiles de autenticación, las credenciales de WhatsApp, las sesiones y la memoria. Si estás en
    modo remoto, recuerda que el host del gateway es el propietario del almacén de sesiones y del workspace.

    **Importante:** si solo haces commit/push de tu workspace a GitHub, estarás haciendo una copia de seguridad de
    **la memoria + los archivos de arranque**, pero **no** del historial de sesiones ni de la autenticación. Esos viven
    en `~/.openclaw/` (por ejemplo `~/.openclaw/agents/<agentId>/sessions/`).

    Relacionado: [Migración](/es/install/migrating), [Dónde viven las cosas en disco](#where-things-live-on-disk),
    [Workspace del agente](/es/concepts/agent-workspace), [Doctor](/es/gateway/doctor),
    [Modo remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Dónde veo qué hay de nuevo en la última versión?">
    Consulta el changelog de GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Las entradas más recientes están arriba. Si la sección superior está marcada como **Unreleased**, la siguiente sección
    con fecha es la última versión publicada. Las entradas se agrupan por **Highlights**, **Changes** y
    **Fixes** (además de secciones de documentación/u otras cuando es necesario).

  </Accordion>

  <Accordion title="No se puede acceder a docs.openclaw.ai (error SSL)">
    Algunas conexiones de Comcast/Xfinity bloquean incorrectamente `docs.openclaw.ai` mediante Xfinity
    Advanced Security. Desactívalo o añade `docs.openclaw.ai` a la lista de permitidos y vuelve a intentarlo.
    Ayúdanos a desbloquearlo reportándolo aquí: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Si todavía no puedes acceder al sitio, la documentación está replicada en GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Diferencia entre estable y beta">
    **Estable** y **beta** son **dist-tags de npm**, no líneas de código separadas:

    - `latest` = estable
    - `beta` = compilación temprana para pruebas

    Normalmente, una versión estable llega primero a **beta**, y luego un paso explícito
    de promoción mueve esa misma versión a `latest`. Los mantenedores también pueden
    publicar directamente en `latest` cuando sea necesario. Por eso beta y estable pueden
    apuntar a la **misma versión** después de la promoción.

    Consulta qué cambió:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Para los comandos de instalación en una sola línea y la diferencia entre beta y dev, consulta el acordeón de abajo.

  </Accordion>

  <Accordion title="¿Cómo instalo la versión beta y cuál es la diferencia entre beta y dev?">
    **Beta** es el dist-tag `beta` de npm (puede coincidir con `latest` después de la promoción).
    **Dev** es la cabecera en movimiento de `main` (git); cuando se publica, usa el dist-tag `dev` de npm.

    Comandos de una línea (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalador para Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Más detalle: [Canales de desarrollo](/es/install/development-channels) e [Indicadores del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="¿Cómo pruebo lo último?">
    Dos opciones:

    1. **Canal dev (checkout de git):**

    ```bash
    openclaw update --channel dev
    ```

    Esto cambia a la rama `main` y actualiza desde el código fuente.

    2. **Instalación hackable (desde el sitio del instalador):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Eso te da un repositorio local que puedes editar y luego actualizar con git.

    Si prefieres un clon limpio manualmente, usa:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentación: [Actualización](/cli/update), [Canales de desarrollo](/es/install/development-channels),
    [Instalación](/es/install).

  </Accordion>

  <Accordion title="¿Cuánto suelen tardar la instalación y el onboarding?">
    Guía aproximada:

    - **Instalación:** 2-5 minutos
    - **Onboarding:** 5-15 minutos según cuántos canales/modelos configures

    Si se queda bloqueado, usa [Instalador bloqueado](#quick-start-and-first-run-setup)
    y el bucle rápido de depuración en [Estoy bloqueado](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="¿El instalador está bloqueado? ¿Cómo obtengo más información?">
    Vuelve a ejecutar el instalador con **salida detallada**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalación beta con salida detallada:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Para una instalación hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Equivalente en Windows (PowerShell):

    ```powershell
    # install.ps1 todavía no tiene un indicador -Verbose dedicado.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Más opciones: [Indicadores del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="La instalación en Windows dice git not found o openclaw not recognized">
    Dos problemas comunes en Windows:

    **1) error de npm spawn git / git not found**

    - Instala **Git for Windows** y asegúrate de que `git` esté en tu PATH.
    - Cierra y vuelve a abrir PowerShell, luego vuelve a ejecutar el instalador.

    **2) openclaw is not recognized después de la instalación**

    - Tu carpeta global bin de npm no está en PATH.
    - Comprueba la ruta:

      ```powershell
      npm config get prefix
      ```

    - Añade ese directorio a tu PATH de usuario (no hace falta el sufijo `\bin` en Windows; en la mayoría de los sistemas es `%AppData%\npm`).
    - Cierra y vuelve a abrir PowerShell después de actualizar PATH.

    Si quieres la configuración más fluida en Windows, usa **WSL2** en lugar de Windows nativo.
    Documentación: [Windows](/es/platforms/windows).

  </Accordion>

  <Accordion title="La salida de exec en Windows muestra texto chino distorsionado. ¿Qué debo hacer?">
    Esto suele deberse a una incompatibilidad de página de códigos de la consola en shells nativos de Windows.

    Síntomas:

    - La salida de `system.run`/`exec` muestra chino como texto ilegible
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

    Si todavía puedes reproducir esto en la última versión de OpenClaw, síguelo/repórtalo en:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentación no respondió mi pregunta. ¿Cómo obtengo una mejor respuesta?">
    Usa la **instalación hackable (git)** para tener el código fuente completo y la documentación localmente, luego pregunta
    a tu bot (o Claude/Codex) _desde esa carpeta_ para que pueda leer el repositorio y responder con precisión.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Más detalle: [Instalación](/es/install) e [Indicadores del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="¿Cómo instalo OpenClaw en Linux?">
    Respuesta corta: sigue la guía de Linux y luego ejecuta el onboarding.

    - Ruta rápida de Linux + instalación del servicio: [Linux](/es/platforms/linux).
    - Guía completa: [Primeros pasos](/es/start/getting-started).
    - Instalador + actualizaciones: [Instalación y actualizaciones](/es/install/updating).

  </Accordion>

  <Accordion title="¿Cómo instalo OpenClaw en un VPS?">
    Cualquier VPS con Linux funciona. Instálalo en el servidor y luego usa SSH/Tailscale para acceder al Gateway.

    Guías: [exe.dev](/es/install/exe-dev), [Hetzner](/es/install/hetzner), [Fly.io](/es/install/fly).
    Acceso remoto: [Gateway remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Dónde están las guías de instalación en la nube/VPS?">
    Tenemos un **centro de hosting** con los proveedores más comunes. Elige uno y sigue la guía:

    - [Hosting VPS](/es/vps) (todos los proveedores en un solo lugar)
    - [Fly.io](/es/install/fly)
    - [Hetzner](/es/install/hetzner)
    - [exe.dev](/es/install/exe-dev)

    Cómo funciona en la nube: el **Gateway se ejecuta en el servidor**, y accedes a él
    desde tu portátil/teléfono mediante la Control UI (o Tailscale/SSH). Tu estado + workspace
    viven en el servidor, así que trata al host como la fuente de verdad y haz copias de seguridad.

    Puedes emparejar **nodes** (Mac/iOS/Android/headless) con ese Gateway en la nube para acceder a
    pantalla/cámara/canvas locales o ejecutar comandos en tu portátil mientras mantienes el
    Gateway en la nube.

    Centro: [Plataformas](/es/platforms). Acceso remoto: [Gateway remoto](/es/gateway/remote).
    Nodes: [Nodes](/es/nodes), [CLI de Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="¿Puedo pedirle a OpenClaw que se actualice a sí mismo?">
    Respuesta corta: **es posible, pero no se recomienda**. El flujo de actualización puede reiniciar el
    Gateway (lo que interrumpe la sesión activa), puede necesitar un checkout de git limpio y
    puede pedir confirmación. Es más seguro: ejecutar las actualizaciones desde un shell como operador.

    Usa la CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Si debes automatizarlo desde un agente:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentación: [Actualización](/cli/update), [Actualización](/es/install/updating).

  </Accordion>

  <Accordion title="¿Qué hace realmente el onboarding?">
    `openclaw onboard` es la ruta de configuración recomendada. En **modo local** te guía por:

    - **Configuración de modelo/autenticación** (OAuth del proveedor, claves de API, setup-token de Anthropic, además de opciones de modelos locales como LM Studio)
    - Ubicación del **workspace** + archivos de arranque
    - **Configuración del Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, además de plugins de canal incluidos como QQ Bot)
    - **Instalación del demonio** (LaunchAgent en macOS; unidad de usuario systemd en Linux/WSL2)
    - **Comprobaciones de estado** y selección de **Skills**

    También avisa si tu modelo configurado es desconocido o si falta autenticación.

  </Accordion>

  <Accordion title="¿Necesito una suscripción a Claude u OpenAI para ejecutar esto?">
    No. Puedes ejecutar OpenClaw con **claves de API** (Anthropic/OpenAI/otros) o con
    **modelos solo locales** para que tus datos permanezcan en tu dispositivo. Las suscripciones (Claude
    Pro/Max u OpenAI Codex) son formas opcionales de autenticar esos proveedores.

    Para Anthropic en OpenClaw, la división práctica es:

    - **Clave de API de Anthropic**: facturación normal de la API de Anthropic
    - **Autenticación de Claude CLI / suscripción de Claude en OpenClaw**: el personal de Anthropic
      nos dijo que este uso vuelve a estar permitido, y OpenClaw está tratando el uso de `claude -p`
      como autorizado para esta integración salvo que Anthropic publique una nueva
      política

    Para hosts de gateway de larga duración, las claves de API de Anthropic siguen siendo la
    configuración más predecible. OpenAI Codex OAuth es compatible explícitamente para herramientas
    externas como OpenClaw.

    OpenClaw también admite otras opciones alojadas de estilo suscripción, incluidas
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** y
    **Z.AI / GLM Coding Plan**.

    Documentación: [Anthropic](/es/providers/anthropic), [OpenAI](/es/providers/openai),
    [Qwen Cloud](/es/providers/qwen),
    [MiniMax](/es/providers/minimax), [Modelos GLM](/es/providers/glm),
    [Modelos locales](/es/gateway/local-models), [Modelos](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Puedo usar la suscripción Claude Max sin una clave de API?">
    Sí.

    El personal de Anthropic nos dijo que el uso de Claude CLI al estilo OpenClaw vuelve a estar permitido, así que
    OpenClaw trata la autenticación con suscripción de Claude y el uso de `claude -p` como autorizados
    para esta integración salvo que Anthropic publique una nueva política. Si quieres
    la configuración del lado del servidor más predecible, usa en su lugar una clave de API de Anthropic.

  </Accordion>

  <Accordion title="¿Admiten autenticación con suscripción de Claude (Claude Pro o Max)?">
    Sí.

    El personal de Anthropic nos dijo que este uso vuelve a estar permitido, por lo que OpenClaw trata
    la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración
    salvo que Anthropic publique una nueva política.

    El setup-token de Anthropic sigue estando disponible como una ruta de token compatible en OpenClaw, pero OpenClaw ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.
    Para cargas de trabajo de producción o multiusuario, la autenticación con clave de API de Anthropic sigue siendo la
    opción más segura y predecible. Si quieres otras opciones alojadas de estilo suscripción
    en OpenClaw, consulta [OpenAI](/es/providers/openai), [Qwen / Model
    Cloud](/es/providers/qwen), [MiniMax](/es/providers/minimax) y [Modelos
    GLM](/es/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="¿Por qué veo HTTP 429 rate_limit_error de Anthropic?">
Eso significa que tu **cuota/límite de tasa de Anthropic** está agotado para la ventana actual. Si
usas **Claude CLI**, espera a que la ventana se restablezca o mejora tu plan. Si
usas una **clave de API de Anthropic**, consulta la consola de Anthropic
para ver el uso/la facturación y aumenta los límites según sea necesario.

    Si el mensaje es específicamente:
    `Extra usage is required for long context requests`, la solicitud está intentando usar
    la beta de contexto de 1 M de Anthropic (`context1m: true`). Eso solo funciona cuando tu
    credencial es apta para la facturación de contexto largo (facturación con clave de API o la
    ruta de inicio de sesión de Claude de OpenClaw con Uso Extra habilitado).

    Consejo: configura un **modelo de respaldo** para que OpenClaw pueda seguir respondiendo mientras un proveedor tiene límite de tasa.
    Consulta [Modelos](/cli/models), [OAuth](/es/concepts/oauth) y
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/es/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="¿Se admite AWS Bedrock?">
    Sí. OpenClaw incluye un proveedor de **Amazon Bedrock (Converse)**. Con los marcadores de entorno de AWS presentes, OpenClaw puede detectar automáticamente el catálogo de Bedrock de streaming/texto y combinarlo como un proveedor implícito `amazon-bedrock`; de lo contrario, puedes habilitar explícitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` o añadir una entrada de proveedor manual. Consulta [Amazon Bedrock](/es/providers/bedrock) y [Proveedores de modelos](/es/providers/models). Si prefieres un flujo de clave administrada, un proxy compatible con OpenAI delante de Bedrock sigue siendo una opción válida.
  </Accordion>

  <Accordion title="¿Cómo funciona la autenticación de Codex?">
    OpenClaw admite **OpenAI Code (Codex)** mediante OAuth (inicio de sesión de ChatGPT). El onboarding puede ejecutar el flujo OAuth y establecerá el modelo predeterminado en `openai-codex/gpt-5.4` cuando corresponda. Consulta [Proveedores de modelos](/es/concepts/model-providers) y [Onboarding (CLI)](/es/start/wizard).
  </Accordion>

  <Accordion title="¿Por qué ChatGPT GPT-5.4 no desbloquea openai/gpt-5.4 en OpenClaw?">
    OpenClaw trata las dos rutas por separado:

    - `openai-codex/gpt-5.4` = OAuth de ChatGPT/Codex
    - `openai/gpt-5.4` = API directa de OpenAI Platform

    En OpenClaw, el inicio de sesión de ChatGPT/Codex está conectado a la ruta `openai-codex/*`,
    no a la ruta directa `openai/*`. Si quieres la ruta de API directa en
    OpenClaw, configura `OPENAI_API_KEY` (o la configuración equivalente del proveedor OpenAI).
    Si quieres usar el inicio de sesión de ChatGPT/Codex en OpenClaw, usa `openai-codex/*`.

  </Accordion>

  <Accordion title="¿Por qué los límites de OAuth de Codex pueden diferir de ChatGPT web?">
    `openai-codex/*` usa la ruta OAuth de Codex, y sus ventanas de cuota utilizables son
    administradas por OpenAI y dependen del plan. En la práctica, esos límites pueden diferir de
    la experiencia del sitio web/aplicación de ChatGPT, incluso cuando ambos están vinculados a la misma cuenta.

    OpenClaw puede mostrar las ventanas de uso/cuota del proveedor actualmente visibles en
    `openclaw models status`, pero no inventa ni normaliza los derechos de ChatGPT web
    en acceso directo a la API. Si quieres la ruta directa de facturación/límites de OpenAI Platform,
    usa `openai/*` con una clave de API.

  </Accordion>

  <Accordion title="¿Admiten autenticación con suscripción de OpenAI (Codex OAuth)?">
    Sí. OpenClaw admite completamente **OAuth de suscripción de OpenAI Code (Codex)**.
    OpenAI permite explícitamente el uso de OAuth de suscripción en herramientas/flujos de trabajo externos
    como OpenClaw. El onboarding puede ejecutar el flujo OAuth por ti.

    Consulta [OAuth](/es/concepts/oauth), [Proveedores de modelos](/es/concepts/model-providers) y [Onboarding (CLI)](/es/start/wizard).

  </Accordion>

  <Accordion title="¿Cómo configuro Gemini CLI OAuth?">
    Gemini CLI usa un **flujo de autenticación de Plugin**, no un client id o un secret en `openclaw.json`.

    Pasos:

    1. Instala Gemini CLI localmente para que `gemini` esté en `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Habilita el plugin: `openclaw plugins enable google`
    3. Inicia sesión: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modelo predeterminado después del inicio de sesión: `google-gemini-cli/gemini-3-flash-preview`
    5. Si las solicitudes fallan, configura `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host del gateway

    Esto almacena tokens OAuth en perfiles de autenticación en el host del gateway. Detalles: [Proveedores de modelos](/es/concepts/model-providers).

  </Accordion>

  <Accordion title="¿Un modelo local está bien para chats casuales?">
    Normalmente no. OpenClaw necesita un contexto amplio + seguridad sólida; las tarjetas pequeñas truncan y filtran. Si es imprescindible, ejecuta localmente la compilación del modelo **más grande** que puedas (LM Studio) y consulta [/gateway/local-models](/es/gateway/local-models). Los modelos más pequeños/cuantizados aumentan el riesgo de inyección de prompts; consulta [Seguridad](/es/gateway/security).
  </Accordion>

  <Accordion title="¿Cómo mantengo el tráfico del modelo alojado en una región específica?">
    Elige endpoints fijados por región. OpenRouter ofrece opciones alojadas en EE. UU. para MiniMax, Kimi y GLM; elige la variante alojada en EE. UU. para mantener los datos dentro de la región. Aun así, puedes listar Anthropic/OpenAI junto con estos usando `models.mode: "merge"` para que los respaldos sigan disponibles mientras respetas el proveedor regional que seleccionaste.
  </Accordion>

  <Accordion title="¿Tengo que comprar un Mac mini para instalar esto?">
    No. OpenClaw funciona en macOS o Linux (Windows mediante WSL2). Un Mac mini es opcional; algunas personas
    compran uno como host siempre activo, pero también sirve un VPS pequeño, un servidor doméstico o un equipo tipo Raspberry Pi.

    Solo necesitas un Mac **para herramientas exclusivas de macOS**. Para iMessage, usa [BlueBubbles](/es/channels/bluebubbles) (recomendado): el servidor BlueBubbles se ejecuta en cualquier Mac, y el Gateway puede ejecutarse en Linux o en otro lugar. Si quieres otras herramientas exclusivas de macOS, ejecuta el Gateway en un Mac o empareja un node de macOS.

    Documentación: [BlueBubbles](/es/channels/bluebubbles), [Nodes](/es/nodes), [Modo remoto en Mac](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Necesito un Mac mini para tener compatibilidad con iMessage?">
    Necesitas **algún dispositivo macOS** con sesión iniciada en Mensajes. **No** tiene que ser un Mac mini;
    cualquier Mac funciona. **Usa [BlueBubbles](/es/channels/bluebubbles)** (recomendado) para iMessage: el servidor BlueBubbles se ejecuta en macOS, mientras que el Gateway puede ejecutarse en Linux o en otro lugar.

    Configuraciones habituales:

    - Ejecuta el Gateway en Linux/VPS y ejecuta el servidor BlueBubbles en cualquier Mac con sesión iniciada en Mensajes.
    - Ejecuta todo en el Mac si quieres la configuración más simple en una sola máquina.

    Documentación: [BlueBubbles](/es/channels/bluebubbles), [Nodes](/es/nodes),
    [Modo remoto en Mac](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si compro un Mac mini para ejecutar OpenClaw, ¿puedo conectarlo a mi MacBook Pro?">
    Sí. El **Mac mini puede ejecutar el Gateway**, y tu MacBook Pro puede conectarse como
    **node** (dispositivo complementario). Los nodes no ejecutan el Gateway; proporcionan
    capacidades adicionales como pantalla/cámara/canvas y `system.run` en ese dispositivo.

    Patrón habitual:

    - Gateway en el Mac mini (siempre activo).
    - El MacBook Pro ejecuta la app de macOS o un host de node y se empareja con el Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` para verlo.

    Documentación: [Nodes](/es/nodes), [CLI de Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="¿Puedo usar Bun?">
    Bun **no está recomendado**. Vemos errores en tiempo de ejecución, especialmente con WhatsApp y Telegram.
    Usa **Node** para gateways estables.

    Si aun así quieres experimentar con Bun, hazlo en un gateway que no sea de producción
    y sin WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ¿qué va en allowFrom?">
    `channels.telegram.allowFrom` es **el ID de usuario de Telegram del remitente humano** (numérico). No es el nombre de usuario del bot.

    La configuración solicita solo IDs de usuario numéricos. Si ya tienes entradas heredadas de `@username` en la configuración, `openclaw doctor --fix` puede intentar resolverlas.

    Más seguro (sin bot de terceros):

    - Envía un MD a tu bot y luego ejecuta `openclaw logs --follow` y lee `from.id`.

    API oficial de Bot:

    - Envía un MD a tu bot y luego llama a `https://api.telegram.org/bot<bot_token>/getUpdates` y lee `message.from.id`.

    Terceros (menos privado):

    - Envía un MD a `@userinfobot` o `@getidsbot`.

    Consulta [/channels/telegram](/es/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="¿Pueden varias personas usar un número de WhatsApp con distintas instancias de OpenClaw?">
    Sí, mediante **enrutamiento multiagente**. Vincula el **MD** de WhatsApp de cada remitente (peer `kind: "direct"`, remitente E.164 como `+15551234567`) a un `agentId` distinto, para que cada persona tenga su propio workspace y almacén de sesiones. Las respuestas seguirán saliendo desde la **misma cuenta de WhatsApp**, y el control de acceso de MD (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) es global por cuenta de WhatsApp. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent) y [WhatsApp](/es/channels/whatsapp).
  </Accordion>

  <Accordion title='¿Puedo ejecutar un agente de "chat rápido" y un agente de "Opus para programación"?'>
    Sí. Usa enrutamiento multiagente: da a cada agente su propio modelo predeterminado y luego vincula las rutas entrantes (cuenta del proveedor o peers específicos) a cada agente. Hay un ejemplo de configuración en [Enrutamiento multiagente](/es/concepts/multi-agent). Consulta también [Modelos](/es/concepts/models) y [Configuración](/es/gateway/configuration).
  </Accordion>

  <Accordion title="¿Homebrew funciona en Linux?">
    Sí. Homebrew es compatible con Linux (Linuxbrew). Configuración rápida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Si ejecutas OpenClaw mediante systemd, asegúrate de que el PATH del servicio incluya `/home/linuxbrew/.linuxbrew/bin` (o tu prefijo de brew) para que las herramientas instaladas con `brew` se resuelvan en shells sin inicio de sesión.
    Las compilaciones recientes también anteponen directorios bin de usuario comunes en servicios systemd de Linux (por ejemplo `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) y respetan `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` y `FNM_DIR` cuando están definidos.

  </Accordion>

  <Accordion title="Diferencia entre la instalación hackable con git y npm install">
    - **Instalación hackable (git):** checkout completo del código fuente, editable, ideal para colaboradores.
      Ejecutas las compilaciones localmente y puedes corregir código/documentación.
    - **npm install:** instalación global de la CLI, sin repositorio, ideal para simplemente ejecutarlo.
      Las actualizaciones vienen de los dist-tags de npm.

    Documentación: [Primeros pasos](/es/start/getting-started), [Actualización](/es/install/updating).

  </Accordion>

  <Accordion title="¿Puedo cambiar entre instalaciones con npm y git más adelante?">
    Sí. Instala la otra variante y luego ejecuta Doctor para que el servicio del gateway apunte al nuevo punto de entrada.
    Esto **no elimina tus datos**; solo cambia la instalación del código de OpenClaw. Tu estado
    (`~/.openclaw`) y workspace (`~/.openclaw/workspace`) permanecen intactos.

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

    Doctor detecta una discrepancia en el punto de entrada del servicio Gateway y ofrece reescribir la configuración del servicio para que coincida con la instalación actual (usa `--repair` en automatización).

    Consejos de copia de seguridad: consulta [Estrategia de copia de seguridad](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="¿Debería ejecutar el Gateway en mi portátil o en un VPS?">
    Respuesta corta: **si quieres fiabilidad 24/7, usa un VPS**. Si quieres la
    menor fricción y no te importan las suspensiones/reinicios, ejecútalo localmente.

    **Portátil (Gateway local)**

    - **Ventajas:** sin coste de servidor, acceso directo a archivos locales, ventana del navegador visible.
    - **Desventajas:** suspensión/cortes de red = desconexiones, las actualizaciones/reinicios del SO interrumpen, debe permanecer encendido.

    **VPS / nube**

    - **Ventajas:** siempre activo, red estable, sin problemas de suspensión del portátil, más fácil de mantener en ejecución.
    - **Desventajas:** a menudo se ejecuta sin interfaz (usa capturas de pantalla), acceso solo a archivos remotos, debes usar SSH para las actualizaciones.

    **Nota específica de OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funcionan perfectamente desde un VPS. La única diferencia real es **navegador sin interfaz** frente a una ventana visible. Consulta [Browser](/es/tools/browser).

    **Recomendación predeterminada:** VPS si antes tuviste desconexiones del gateway. Lo local es ideal cuando estás usando activamente el Mac y quieres acceso a archivos locales o automatización de UI con un navegador visible.

  </Accordion>

  <Accordion title="¿Qué tan importante es ejecutar OpenClaw en una máquina dedicada?">
    No es obligatorio, pero **sí recomendable por fiabilidad y aislamiento**.

    - **Host dedicado (VPS/Mac mini/Pi):** siempre activo, menos interrupciones por suspensión/reinicio, permisos más limpios, más fácil de mantener en ejecución.
    - **Portátil/escritorio compartido:** totalmente válido para pruebas y uso activo, pero espera pausas cuando la máquina se suspenda o se actualice.

    Si quieres lo mejor de ambos mundos, mantén el Gateway en un host dedicado y empareja tu portátil como **node** para herramientas locales de pantalla/cámara/exec. Consulta [Nodes](/es/nodes).
    Para orientación de seguridad, lee [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Cuáles son los requisitos mínimos de un VPS y el SO recomendado?">
    OpenClaw es ligero. Para un Gateway básico + un canal de chat:

    - **Mínimo absoluto:** 1 vCPU, 1 GB de RAM, ~500 MB de disco.
    - **Recomendado:** 1-2 vCPU, 2 GB de RAM o más para tener margen (registros, medios, múltiples canales). Las herramientas de Node y la automatización del navegador pueden consumir muchos recursos.

    SO: usa **Ubuntu LTS** (o cualquier Debian/Ubuntu moderno). La ruta de instalación de Linux está mejor probada ahí.

    Documentación: [Linux](/es/platforms/linux), [Hosting VPS](/es/vps).

  </Accordion>

  <Accordion title="¿Puedo ejecutar OpenClaw en una VM y cuáles son los requisitos?">
    Sí. Trata una VM igual que un VPS: debe estar siempre encendida, accesible y tener suficiente
    RAM para el Gateway y cualquier canal que habilites.

    Guía base:

    - **Mínimo absoluto:** 1 vCPU, 1 GB de RAM.
    - **Recomendado:** 2 GB de RAM o más si ejecutas múltiples canales, automatización del navegador o herramientas multimedia.
    - **SO:** Ubuntu LTS u otro Debian/Ubuntu moderno.

    Si estás en Windows, **WSL2 es la configuración estilo VM más sencilla** y la que tiene la mejor compatibilidad
    de herramientas. Consulta [Windows](/es/platforms/windows), [Hosting VPS](/es/vps).
    Si ejecutas macOS en una VM, consulta [VM de macOS](/es/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ¿Qué es OpenClaw?

<AccordionGroup>
  <Accordion title="¿Qué es OpenClaw, en un párrafo?">
    OpenClaw es un asistente personal de IA que ejecutas en tus propios dispositivos. Responde en las superficies de mensajería que ya usas (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat y plugins de canal incluidos como QQ Bot) y también puede ofrecer voz + un Canvas en vivo en plataformas compatibles. El **Gateway** es el plano de control siempre activo; el asistente es el producto.
  </Accordion>

  <Accordion title="Propuesta de valor">
    OpenClaw no es "solo un wrapper de Claude". Es un **plano de control local-first** que te permite ejecutar un
    asistente capaz en **tu propio hardware**, accesible desde las aplicaciones de chat que ya usas, con
    sesiones con estado, memoria y herramientas, sin ceder el control de tus flujos de trabajo a un
    SaaS alojado.

    Aspectos destacados:

    - **Tus dispositivos, tus datos:** ejecuta el Gateway donde quieras (Mac, Linux, VPS) y mantén el
      workspace + historial de sesiones en local.
    - **Canales reales, no una sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc.,
      además de voz móvil y Canvas en plataformas compatibles.
    - **Independiente del modelo:** usa Anthropic, OpenAI, MiniMax, OpenRouter, etc., con enrutamiento
      por agente y conmutación por error.
    - **Opción solo local:** ejecuta modelos locales para que **todos los datos puedan permanecer en tu dispositivo** si quieres.
    - **Enrutamiento multiagente:** agentes separados por canal, cuenta o tarea, cada uno con su propio
      workspace y valores predeterminados.
    - **Código abierto y modificable:** inspecciónalo, amplíalo y autohospédalo sin dependencia de un proveedor.

    Documentación: [Gateway](/es/gateway), [Channels](/es/channels), [Multiagente](/es/concepts/multi-agent),
    [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="Acabo de configurarlo. ¿Qué debería hacer primero?">
    Buenos primeros proyectos:

    - Crear un sitio web (WordPress, Shopify o un sitio estático sencillo).
    - Prototipar una aplicación móvil (esquema, pantallas, plan de API).
    - Organizar archivos y carpetas (limpieza, nombres, etiquetado).
    - Conectar Gmail y automatizar resúmenes o seguimientos.

    Puede manejar tareas grandes, pero funciona mejor cuando las divides en fases y
    usas subagentes para trabajo en paralelo.

  </Accordion>

  <Accordion title="¿Cuáles son los cinco principales casos de uso cotidianos de OpenClaw?">
    Los usos cotidianos más útiles suelen verse así:

    - **Informes personales:** resúmenes de bandeja de entrada, calendario y noticias que te importan.
    - **Investigación y redacción:** investigación rápida, resúmenes y primeros borradores para correos o documentos.
    - **Recordatorios y seguimientos:** avisos y listas de verificación impulsados por Cron o Heartbeat.
    - **Automatización del navegador:** rellenar formularios, recopilar datos y repetir tareas web.
    - **Coordinación entre dispositivos:** envía una tarea desde tu teléfono, deja que el Gateway la ejecute en un servidor y recibe el resultado en el chat.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ayudar con generación de leads, outreach, anuncios y blogs para un SaaS?">
    Sí para **investigación, cualificación y redacción**. Puede escanear sitios, crear listas cortas,
    resumir prospectos y redactar borradores de mensajes de outreach o anuncios.

    Para **campañas de outreach o anuncios**, mantén a una persona en el circuito. Evita el spam, cumple las leyes locales y
    las políticas de la plataforma, y revisa cualquier contenido antes de enviarlo. El patrón más seguro es dejar que
    OpenClaw redacte y que tú apruebes.

    Documentación: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Cuáles son las ventajas frente a Claude Code para desarrollo web?">
    OpenClaw es un **asistente personal** y una capa de coordinación, no un reemplazo del IDE. Usa
    Claude Code o Codex para el ciclo de programación directa más rápido dentro de un repositorio. Usa OpenClaw cuando
    quieras memoria duradera, acceso entre dispositivos y orquestación de herramientas.

    Ventajas:

    - **Memoria + workspace persistentes** entre sesiones
    - **Acceso multiplataforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orquestación de herramientas** (navegador, archivos, programación, hooks)
    - **Gateway siempre activo** (ejecútalo en un VPS, interactúa desde cualquier lugar)
    - **Nodes** para navegador/pantalla/cámara/exec locales

    Demostración: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills y automatización

<AccordionGroup>
  <Accordion title="¿Cómo personalizo Skills sin mantener el repositorio sucio?">
    Usa anulaciones gestionadas en lugar de editar la copia del repositorio. Pon tus cambios en `~/.openclaw/skills/<name>/SKILL.md` (o añade una carpeta mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json`). La precedencia es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluidos → `skills.load.extraDirs`, así que las anulaciones gestionadas siguen teniendo prioridad sobre las Skills incluidas sin tocar git. Si necesitas que la skill se instale globalmente pero solo sea visible para algunos agentes, mantén la copia compartida en `~/.openclaw/skills` y controla la visibilidad con `agents.defaults.skills` y `agents.list[].skills`. Solo las ediciones que valga la pena enviar upstream deben vivir en el repositorio y salir como PR.
  </Accordion>

  <Accordion title="¿Puedo cargar Skills desde una carpeta personalizada?">
    Sí. Añade directorios adicionales mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json` (menor precedencia). La precedencia predeterminada es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluidos → `skills.load.extraDirs`. `clawhub` instala en `./skills` de forma predeterminada, que OpenClaw trata como `<workspace>/skills` en la siguiente sesión. Si la skill solo debe ser visible para determinados agentes, combínalo con `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="¿Cómo puedo usar distintos modelos para distintas tareas?">
    Actualmente, los patrones compatibles son:

    - **Trabajos de Cron**: los trabajos aislados pueden establecer una anulación de `model` por trabajo.
    - **Subagentes**: enruta tareas a agentes separados con distintos modelos predeterminados.
    - **Cambio bajo demanda**: usa `/model` para cambiar el modelo de la sesión actual en cualquier momento.

    Consulta [Trabajos de Cron](/es/automation/cron-jobs), [Enrutamiento multiagente](/es/concepts/multi-agent) y [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="El bot se congela mientras hace trabajo pesado. ¿Cómo descargo eso?">
    Usa **subagentes** para tareas largas o paralelas. Los subagentes se ejecutan en su propia sesión,
    devuelven un resumen y mantienen tu chat principal con capacidad de respuesta.

    Pídele a tu bot que "genere un subagente para esta tarea" o usa `/subagents`.
    Usa `/status` en el chat para ver qué está haciendo el Gateway ahora mismo (y si está ocupado).

    Consejo sobre tokens: las tareas largas y los subagentes consumen tokens. Si el coste es una preocupación, configura un
    modelo más barato para subagentes mediante `agents.defaults.subagents.model`.

    Documentación: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Cómo funcionan en Discord las sesiones de subagentes vinculadas a hilos?">
    Usa vinculaciones de hilos. Puedes vincular un hilo de Discord a un subagente o a un destino de sesión para que los mensajes de seguimiento en ese hilo permanezcan en esa sesión vinculada.

    Flujo básico:

    - Genera con `sessions_spawn` usando `thread: true` (y opcionalmente `mode: "session"` para seguimiento persistente).
    - O vincula manualmente con `/focus <target>`.
    - Usa `/agents` para inspeccionar el estado de la vinculación.
    - Usa `/session idle <duration|off>` y `/session max-age <duration|off>` para controlar el desenfoque automático.
    - Usa `/unfocus` para desvincular el hilo.

    Configuración necesaria:

    - Valores predeterminados globales: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Anulaciones de Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Vinculación automática al generar: configura `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Documentación: [Subagentes](/es/tools/subagents), [Discord](/es/channels/discord), [Referencia de configuración](/es/gateway/configuration-reference), [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagente terminó, pero la actualización de finalización fue al lugar equivocado o nunca se publicó. ¿Qué debo comprobar?">
    Comprueba primero la ruta del solicitante resuelta:

    - La entrega del subagente en modo finalización prioriza cualquier hilo vinculado o ruta de conversación cuando existe.
    - Si el origen de la finalización solo lleva un canal, OpenClaw recurre a la ruta almacenada de la sesión del solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa pueda seguir funcionando.
    - Si no existe ni una ruta vinculada ni una ruta almacenada utilizable, la entrega directa puede fallar y el resultado vuelve a la entrega en cola de la sesión en lugar de publicarse inmediatamente en el chat.
    - Los destinos no válidos o desactualizados pueden seguir forzando la vuelta a la cola o el fallo de la entrega final.
    - Si la última respuesta visible del asistente hijo es exactamente el token silencioso `NO_REPLY` / `no_reply`, o exactamente `ANNOUNCE_SKIP`, OpenClaw suprime intencionadamente el anuncio en lugar de publicar un progreso anterior desactualizado.
    - Si el hijo agotó el tiempo de espera después de solo llamadas a herramientas, el anuncio puede reducir eso a un breve resumen de progreso parcial en lugar de reproducir la salida sin procesar de las herramientas.

    Depuración:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks), [Herramientas de sesión](/es/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o los recordatorios no se activan. ¿Qué debo comprobar?">
    Cron se ejecuta dentro del proceso Gateway. Si el Gateway no se está ejecutando de forma continua,
    los trabajos programados no se ejecutarán.

    Lista de comprobación:

    - Confirma que Cron está habilitado (`cron.enabled`) y que `OPENCLAW_SKIP_CRON` no está configurado.
    - Comprueba que el Gateway se está ejecutando 24/7 (sin suspensión/reinicios).
    - Verifica la configuración de zona horaria del trabajo (`--tz` frente a la zona horaria del host).

    Depuración:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentación: [Trabajos de Cron](/es/automation/cron-jobs), [Automatización y tareas](/es/automation).

  </Accordion>

  <Accordion title="Cron se activó, pero no se envió nada al canal. ¿Por qué?">
    Comprueba primero el modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"` significa que no se espera ningún mensaje externo.
    - Un destino de anuncio faltante o no válido (`channel` / `to`) significa que el ejecutor omitió la entrega saliente.
    - Los fallos de autenticación del canal (`unauthorized`, `Forbidden`) significan que el ejecutor intentó entregar, pero las credenciales lo bloquearon.
    - Un resultado aislado silencioso (`NO_REPLY` / `no_reply` solamente) se trata como intencionadamente no entregable, así que el ejecutor también suprime la entrega de respaldo en cola.

    Para trabajos Cron aislados, el ejecutor es el responsable de la entrega final. Se espera que el agente
    devuelva un resumen en texto plano para que el ejecutor lo envíe. `--no-deliver` mantiene
    ese resultado interno; no permite que el agente envíe directamente con la
    herramienta de mensajes en su lugar.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Trabajos de Cron](/es/automation/cron-jobs), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Por qué una ejecución aislada de Cron cambió de modelo o reintentó una vez?">
    Normalmente esa es la ruta de cambio de modelo en vivo, no una programación duplicada.

    Cron aislado puede conservar una transferencia de modelo en tiempo de ejecución y reintentar cuando la
    ejecución activa lanza `LiveSessionModelSwitchError`. El reintento conserva el
    proveedor/modelo cambiado, y si el cambio llevaba una nueva anulación de perfil de autenticación, Cron
    también la conserva antes de reintentar.

    Reglas de selección relacionadas:

    - La anulación del modelo del hook de Gmail gana primero cuando corresponde.
    - Luego el `model` por trabajo.
    - Luego cualquier anulación de modelo almacenada para la sesión de Cron.
    - Luego la selección normal del modelo del agente/predeterminado.

    El bucle de reintento es acotado. Después del intento inicial más 2 reintentos por cambio,
    Cron aborta en lugar de entrar en un bucle infinito.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Trabajos de Cron](/es/automation/cron-jobs), [CLI de Cron](/cli/cron).

  </Accordion>

  <Accordion title="¿Cómo instalo Skills en Linux?">
    Usa los comandos nativos `openclaw skills` o coloca Skills en tu workspace. La UI de Skills de macOS no está disponible en Linux.
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
    del workspace activo. Instala la CLI `clawhub` por separado solo si quieres publicar o
    sincronizar tus propias Skills. Para instalaciones compartidas entre agentes, coloca la skill en
    `~/.openclaw/skills` y usa `agents.defaults.skills` o
    `agents.list[].skills` si quieres limitar qué agentes pueden verla.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ejecutar tareas según un horario o continuamente en segundo plano?">
    Sí. Usa el programador del Gateway:

    - **Trabajos de Cron** para tareas programadas o recurrentes (persisten entre reinicios).
    - **Heartbeat** para comprobaciones periódicas de la "sesión principal".
    - **Trabajos aislados** para agentes autónomos que publican resúmenes o entregan en chats.

    Documentación: [Trabajos de Cron](/es/automation/cron-jobs), [Automatización y tareas](/es/automation),
    [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title="¿Puedo ejecutar Skills exclusivas de macOS de Apple desde Linux?">
    No directamente. Las Skills de macOS están controladas por `metadata.openclaw.os` más los binarios requeridos, y las Skills solo aparecen en el prompt del sistema cuando son aptas en el **host del Gateway**. En Linux, las Skills exclusivas de `darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) no se cargarán a menos que anules esa restricción.

    Tienes tres patrones compatibles:

    **Opción A - ejecutar el Gateway en un Mac (lo más simple).**
    Ejecuta el Gateway donde existan los binarios de macOS y luego conéctate desde Linux en [modo remoto](#gateway-ports-already-running-and-remote-mode) o mediante Tailscale. Las Skills se cargan normalmente porque el host del Gateway es macOS.

    **Opción B - usar un node de macOS (sin SSH).**
    Ejecuta el Gateway en Linux, empareja un node de macOS (app de barra de menús) y configura **Node Run Commands** como "Always Ask" o "Always Allow" en el Mac. OpenClaw puede tratar las Skills exclusivas de macOS como aptas cuando los binarios requeridos existen en el node. El agente ejecuta esas Skills mediante la herramienta `nodes`. Si eliges "Always Ask", aprobar "Always Allow" en el prompt añade ese comando a la lista de permitidos.

    **Opción C - usar proxy de binarios de macOS mediante SSH (avanzado).**
    Mantén el Gateway en Linux, pero haz que los binarios CLI requeridos se resuelvan a wrappers SSH que se ejecuten en un Mac. Luego anula la skill para permitir Linux y que siga siendo apta.

    1. Crea un wrapper SSH para el binario (ejemplo: `memo` para Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Coloca el wrapper en `PATH` en el host Linux (por ejemplo `~/bin/memo`).
    3. Anula los metadatos de la skill (workspace o `~/.openclaw/skills`) para permitir Linux:

       ```markdown
       ---
       name: apple-notes
       description: Gestiona Apple Notes mediante la CLI memo en macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Inicia una nueva sesión para que se actualice la instantánea de Skills.

  </Accordion>

  <Accordion title="¿Tienen integración con Notion o HeyGen?">
    No incorporada por ahora.

    Opciones:

    - **Skill / Plugin personalizado:** ideal para acceso fiable a la API (Notion y HeyGen tienen API).
    - **Automatización del navegador:** funciona sin código, pero es más lenta y frágil.

    Si quieres mantener contexto por cliente (flujos de trabajo de agencia), un patrón sencillo es:

    - Una página de Notion por cliente (contexto + preferencias + trabajo activo).
    - Pedir al agente que recupere esa página al comienzo de una sesión.

    Si quieres una integración nativa, abre una solicitud de función o crea una skill
    orientada a esas API.

    Instalar Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Las instalaciones nativas se colocan en el directorio `skills/` del workspace activo. Para Skills compartidas entre agentes, colócalas en `~/.openclaw/skills/<name>/SKILL.md`. Si solo algunos agentes deben ver una instalación compartida, configura `agents.defaults.skills` o `agents.list[].skills`. Algunas Skills esperan binarios instalados mediante Homebrew; en Linux eso significa Linuxbrew (consulta la entrada de preguntas frecuentes sobre Homebrew en Linux más arriba). Consulta [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config) y [ClawHub](/es/tools/clawhub).

  </Accordion>

  <Accordion title="¿Cómo uso mi Chrome con sesión iniciada existente con OpenClaw?">
    Usa el perfil de navegador integrado `user`, que se conecta a través de Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Si quieres un nombre personalizado, crea un perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Esta ruta puede usar el navegador del host local o un browser node conectado. Si el Gateway se ejecuta en otro lugar, ejecuta un host de node en la máquina del navegador o usa CDP remoto.

    Límites actuales de `existing-session` / `user`:

    - las acciones están basadas en refs, no en selectores CSS
    - las cargas requieren `ref` / `inputRef` y actualmente admiten un archivo a la vez
    - `responsebody`, exportación a PDF, interceptación de descargas y acciones por lotes siguen necesitando un navegador gestionado o un perfil CDP sin procesar

  </Accordion>
</AccordionGroup>

## Sandboxing y memoria

<AccordionGroup>
  <Accordion title="¿Existe una documentación dedicada al sandboxing?">
    Sí. Consulta [Sandboxing](/es/gateway/sandboxing). Para configuración específica de Docker (Gateway completo en Docker o imágenes de sandbox), consulta [Docker](/es/install/docker).
  </Accordion>

  <Accordion title="Docker parece limitado. ¿Cómo habilito todas las funciones?">
    La imagen predeterminada prioriza la seguridad y se ejecuta como el usuario `node`, por lo que no
    incluye paquetes del sistema, Homebrew ni navegadores incluidos. Para una configuración más completa:

    - Conserva `/home/node` con `OPENCLAW_HOME_VOLUME` para que las cachés sobrevivan.
    - Incorpora dependencias del sistema en la imagen con `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instala navegadores de Playwright mediante la CLI incluida:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Configura `PLAYWRIGHT_BROWSERS_PATH` y asegúrate de que la ruta sea persistente.

    Documentación: [Docker](/es/install/docker), [Browser](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Puedo mantener los MD personales pero hacer públicos/sandboxed los grupos con un solo agente?">
    Sí, si tu tráfico privado son **MD** y tu tráfico público son **grupos**.

    Usa `agents.defaults.sandbox.mode: "non-main"` para que las sesiones de grupo/canal (claves no principales) se ejecuten en Docker, mientras la sesión principal de MD permanece en el host. Luego restringe qué herramientas están disponibles en las sesiones en sandbox mediante `tools.sandbox.tools`.

    Guía de configuración + ejemplo de configuración: [Grupos: MD personales + grupos públicos](/es/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referencia clave de configuración: [Configuración del Gateway](/es/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="¿Cómo vinculo una carpeta del host al sandbox?">
    Configura `agents.defaults.sandbox.docker.binds` como `["host:path:mode"]` (por ejemplo `"/home/user/src:/src:ro"`). Los vínculos globales + por agente se combinan; los vínculos por agente se ignoran cuando `scope: "shared"`. Usa `:ro` para cualquier cosa sensible y recuerda que los vínculos evitan las barreras del sistema de archivos del sandbox.

    OpenClaw valida los orígenes de bind tanto con la ruta normalizada como con la ruta canónica resuelta a través del ancestro existente más profundo. Eso significa que los escapes mediante padres con symlink siguen fallando de forma cerrada incluso cuando el último segmento de la ruta todavía no existe, y las comprobaciones de raíz permitida siguen aplicándose después de la resolución de symlink.

    Consulta [Sandboxing](/es/gateway/sandboxing#custom-bind-mounts) y [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) para ver ejemplos y notas de seguridad.

  </Accordion>

  <Accordion title="¿Cómo funciona la memoria?">
    La memoria de OpenClaw son simplemente archivos Markdown en el workspace del agente:

    - Notas diarias en `memory/YYYY-MM-DD.md`
    - Notas seleccionadas a largo plazo en `MEMORY.md` (solo sesiones principales/privadas)

    OpenClaw también ejecuta un **vaciado silencioso de memoria previo a la Compaction** para recordarle al modelo
    que escriba notas duraderas antes de la Compaction automática. Esto solo se ejecuta cuando el workspace
    se puede escribir (los sandboxes de solo lectura lo omiten). Consulta [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="La memoria sigue olvidando cosas. ¿Cómo hago que se conserven?">
    Pídele al bot que **escriba el dato en la memoria**. Las notas a largo plazo pertenecen a `MEMORY.md`,
    y el contexto a corto plazo va en `memory/YYYY-MM-DD.md`.

    Esta sigue siendo un área que estamos mejorando. Ayuda recordarle al modelo que almacene memorias;
    sabrá qué hacer. Si sigue olvidando, verifica que el Gateway esté usando el mismo
    workspace en cada ejecución.

    Documentación: [Memoria](/es/concepts/memory), [Workspace del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿La memoria persiste para siempre? ¿Cuáles son los límites?">
    Los archivos de memoria viven en el disco y persisten hasta que los eliminas. El límite es tu
    almacenamiento, no el modelo. El **contexto de la sesión** sigue estando limitado por la ventana de contexto
    del modelo, por lo que las conversaciones largas pueden compactarse o truncarse. Por eso
    existe la búsqueda en memoria: recupera solo las partes relevantes dentro del contexto.

    Documentación: [Memoria](/es/concepts/memory), [Contexto](/es/concepts/context).

  </Accordion>

  <Accordion title="¿La búsqueda semántica en memoria requiere una clave de API de OpenAI?">
    Solo si usas **embeddings de OpenAI**. Codex OAuth cubre chat/completions y
    **no** concede acceso a embeddings, así que **iniciar sesión con Codex (OAuth o el
    inicio de sesión de Codex CLI)** no ayuda para la búsqueda semántica en memoria. Los embeddings de OpenAI
    siguen necesitando una clave de API real (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Si no configuras un proveedor explícitamente, OpenClaw selecciona automáticamente un proveedor cuando
    puede resolver una clave de API (perfiles de autenticación, `models.providers.*.apiKey` o variables de entorno).
    Prefiere OpenAI si se resuelve una clave de OpenAI; en caso contrario Gemini si se resuelve una clave de Gemini;
    luego Voyage; luego Mistral. Si no hay ninguna clave remota disponible, la búsqueda en memoria
    permanece deshabilitada hasta que la configures. Si tienes configurada y presente una ruta de modelo local, OpenClaw
    prefiere `local`. Ollama es compatible cuando configuras explícitamente
    `memorySearch.provider = "ollama"`.

    Si prefieres mantenerlo local, configura `memorySearch.provider = "local"` (y opcionalmente
    `memorySearch.fallback = "none"`). Si quieres embeddings de Gemini, configura
    `memorySearch.provider = "gemini"` y proporciona `GEMINI_API_KEY` (o
    `memorySearch.remote.apiKey`). Admitimos modelos de embedding de **OpenAI, Gemini, Voyage, Mistral, Ollama o locales**;
    consulta [Memoria](/es/concepts/memory) para conocer los detalles de configuración.

  </Accordion>
</AccordionGroup>

## Dónde viven las cosas en el disco

<AccordionGroup>
  <Accordion title="¿Todos los datos usados con OpenClaw se guardan localmente?">
    No: **el estado de OpenClaw es local**, pero **los servicios externos siguen viendo lo que les envías**.

    - **Local por defecto:** las sesiones, archivos de memoria, configuración y workspace viven en el host del Gateway
      (`~/.openclaw` + tu directorio de workspace).
    - **Remoto por necesidad:** los mensajes que envías a proveedores de modelos (Anthropic/OpenAI/etc.) van a
      sus API, y las plataformas de chat (WhatsApp/Telegram/Slack/etc.) almacenan los datos de los mensajes en sus
      servidores.
    - **Tú controlas la huella:** usar modelos locales mantiene los prompts en tu máquina, pero el tráfico
      del canal sigue pasando por los servidores del canal.

    Relacionado: [Workspace del agente](/es/concepts/agent-workspace), [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Dónde almacena OpenClaw sus datos?">
    Todo vive bajo `$OPENCLAW_STATE_DIR` (predeterminado: `~/.openclaw`):

    | Path                                                            | Propósito                                                          |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuración principal (JSON5)                                    |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importación heredada de OAuth (copiada en los perfiles de autenticación en el primer uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfiles de autenticación (OAuth, claves de API y `keyRef`/`tokenRef` opcionales) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Carga útil opcional de secretos respaldada por archivos para proveedores `file` de SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Archivo de compatibilidad heredado (entradas estáticas `api_key` depuradas) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Estado del proveedor (por ejemplo `whatsapp/<accountId>/creds.json`) |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Estado por agente (agentDir + sesiones)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historial y estado de conversación (por agente)                    |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadatos de sesión (por agente)                                   |

    Ruta heredada de agente único: `~/.openclaw/agent/*` (migrada por `openclaw doctor`).

    Tu **workspace** (`AGENTS.md`, archivos de memoria, Skills, etc.) es independiente y se configura mediante `agents.defaults.workspace` (predeterminado: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="¿Dónde deberían vivir AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Estos archivos viven en el **workspace del agente**, no en `~/.openclaw`.

    - **Workspace (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (o el fallback heredado `memory.md` cuando `MEMORY.md` no existe),
      `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opcional.
    - **Directorio de estado (`~/.openclaw`)**: configuración, estado de canal/proveedor, perfiles de autenticación, sesiones, registros,
      y Skills compartidas (`~/.openclaw/skills`).

    El workspace predeterminado es `~/.openclaw/workspace`, configurable mediante:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si el bot "olvida" después de un reinicio, confirma que el Gateway esté usando el mismo
    workspace en cada inicio (y recuerda: el modo remoto usa el workspace del **host del gateway**,
    no el de tu portátil local).

    Consejo: si quieres un comportamiento o preferencia duraderos, pídele al bot que **lo escriba en
    AGENTS.md o MEMORY.md** en lugar de confiar en el historial del chat.

    Consulta [Workspace del agente](/es/concepts/agent-workspace) y [Memoria](/es/concepts/memory).

  </Accordion>

  <Accordion title="Estrategia de copia de seguridad recomendada">
    Pon tu **workspace del agente** en un repositorio git **privado** y haz una copia de seguridad en algún lugar
    privado (por ejemplo GitHub privado). Esto captura la memoria + los archivos AGENTS/SOUL/USER
    y te permite restaurar más adelante la "mente" del asistente.

    **No** hagas commit de nada bajo `~/.openclaw` (credenciales, sesiones, tokens o cargas útiles de secretos cifrados).
    Si necesitas una restauración completa, haz copia de seguridad del workspace y del directorio de estado
    por separado (consulta la pregunta de migración anterior).

    Documentación: [Workspace del agente](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿Cómo desinstalo OpenClaw por completo?">
    Consulta la guía dedicada: [Desinstalación](/es/install/uninstall).
  </Accordion>

  <Accordion title="¿Pueden los agentes trabajar fuera del workspace?">
    Sí. El workspace es el **cwd predeterminado** y el ancla de memoria, no un sandbox rígido.
    Las rutas relativas se resuelven dentro del workspace, pero las rutas absolutas pueden acceder a otras
    ubicaciones del host a menos que el sandboxing esté habilitado. Si necesitas aislamiento, usa
    [`agents.defaults.sandbox`](/es/gateway/sandboxing) o la configuración de sandbox por agente. Si
    quieres que un repositorio sea el directorio de trabajo predeterminado, apunta el
    `workspace` de ese agente a la raíz del repositorio. El repositorio de OpenClaw es solo código fuente; mantén el
    workspace separado a menos que intencionadamente quieras que el agente trabaje dentro de él.

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
    El estado de la sesión pertenece al **host del gateway**. Si estás en modo remoto, el almacén de sesiones que te importa está en la máquina remota, no en tu portátil local. Consulta [Gestión de sesiones](/es/concepts/session).
  </Accordion>
</AccordionGroup>

## Conceptos básicos de configuración

<AccordionGroup>
  <Accordion title="¿Qué formato tiene la configuración? ¿Dónde está?">
    OpenClaw lee una configuración opcional **JSON5** desde `$OPENCLAW_CONFIG_PATH` (predeterminado: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Si falta el archivo, usa valores predeterminados razonablemente seguros (incluido un workspace predeterminado de `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='He configurado gateway.bind: "lan" (o "tailnet") y ahora no escucha nada / la UI dice unauthorized'>
    Los enlaces que no son loopback **requieren una ruta de autenticación de gateway válida**. En la práctica eso significa:

    - autenticación con secreto compartido: token o contraseña
    - `gateway.auth.mode: "trusted-proxy"` detrás de un proxy inverso con reconocimiento de identidad que no sea loopback y esté configurado correctamente

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

    - `gateway.remote.token` / `.password` por sí solos **no** habilitan la autenticación del gateway local.
    - Las rutas de llamada local pueden usar `gateway.remote.*` como respaldo solo cuando `gateway.auth.*` no está configurado.
    - Para autenticación con contraseña, configura `gateway.auth.mode: "password"` junto con `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`) en su lugar.
    - Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución falla de forma cerrada (sin que el respaldo remoto lo oculte).
    - Las configuraciones de Control UI con secreto compartido se autentican mediante `connect.params.auth.token` o `connect.params.auth.password` (almacenados en la configuración de la app/UI). Los modos con identidad, como Tailscale Serve o `trusted-proxy`, usan encabezados de solicitud en su lugar. Evita poner secretos compartidos en las URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, los proxies inversos loopback del mismo host siguen **sin** satisfacer la autenticación de trusted-proxy. El proxy de confianza debe ser una fuente no loopback configurada.

  </Accordion>

  <Accordion title="¿Por qué ahora necesito un token en localhost?">
    OpenClaw aplica autenticación del gateway de forma predeterminada, incluido loopback. En la ruta predeterminada normal eso significa autenticación por token: si no hay ninguna ruta de autenticación explícita configurada, el inicio del gateway se resuelve en modo token y genera uno automáticamente, guardándolo en `gateway.auth.token`, por lo que **los clientes WS locales deben autenticarse**. Esto bloquea que otros procesos locales llamen al Gateway.

    Si prefieres una ruta de autenticación diferente, puedes elegir explícitamente el modo contraseña (o, para proxies inversos con reconocimiento de identidad que no sean loopback, `trusted-proxy`). Si **realmente** quieres loopback abierto, configura `gateway.auth.mode: "none"` explícitamente en tu configuración. Doctor puede generarte un token en cualquier momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="¿Tengo que reiniciar después de cambiar la configuración?">
    El Gateway observa la configuración y admite recarga en caliente:

    - `gateway.reload.mode: "hybrid"` (predeterminado): aplica en caliente los cambios seguros, reinicia para los críticos
    - También se admiten `hot`, `restart` y `off`

  </Accordion>

  <Accordion title="¿Cómo desactivo los lemas graciosos de la CLI?">
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

    - `off`: oculta el texto del lema, pero mantiene la línea del título/versión del banner.
    - `default`: usa `All your chats, one OpenClaw.` siempre.
    - `random`: lemas graciosos/de temporada rotativos (comportamiento predeterminado).
    - Si no quieres ningún banner, configura la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="¿Cómo habilito la búsqueda web (y web fetch)?">
    `web_fetch` funciona sin clave de API. `web_search` depende del proveedor
    seleccionado:

    - Los proveedores respaldados por API como Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity y Tavily requieren su configuración normal de clave de API.
    - Ollama Web Search no necesita clave, pero usa el host de Ollama configurado y requiere `ollama signin`.
    - DuckDuckGo no necesita clave, pero es una integración no oficial basada en HTML.
    - SearXNG no necesita clave y puede autohospedarse; configura `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl`.

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

    La configuración específica del proveedor para búsqueda web ahora vive bajo `plugins.entries.<plugin>.config.webSearch.*`.
    Las rutas heredadas de proveedor `tools.web.search.*` siguen cargándose temporalmente por compatibilidad, pero no deben usarse para configuraciones nuevas.
    La configuración de respaldo de web-fetch de Firecrawl vive bajo `plugins.entries.firecrawl.config.webFetch.*`.

    Notas:

    - Si usas listas de permitidos, añade `web_search`/`web_fetch`/`x_search` o `group:web`.
    - `web_fetch` está habilitado de forma predeterminada (a menos que se deshabilite explícitamente).
    - Si se omite `tools.web.fetch.provider`, OpenClaw detecta automáticamente el primer proveedor de respaldo de fetch listo a partir de las credenciales disponibles. Actualmente el proveedor incluido es Firecrawl.
    - Los demonios leen variables de entorno desde `~/.openclaw/.env` (o desde el entorno del servicio).

    Documentación: [Herramientas web](/es/tools/web).

  </Accordion>

  <Accordion title="config.apply borró mi configuración. ¿Cómo la recupero y cómo evito que vuelva a pasar?">
    `config.apply` reemplaza la **configuración completa**. Si envías un objeto parcial, todo
    lo demás se elimina.

    Recuperación:

    - Restaura desde una copia de seguridad (git o una copia de `~/.openclaw/openclaw.json`).
    - Si no tienes copia de seguridad, vuelve a ejecutar `openclaw doctor` y reconfigura canales/modelos.
    - Si esto fue inesperado, abre un error e incluye tu última configuración conocida o cualquier copia de seguridad.
    - Un agente local de programación a menudo puede reconstruir una configuración funcional a partir de registros o historial.

    Para evitarlo:

    - Usa `openclaw config set` para cambios pequeños.
    - Usa `openclaw configure` para ediciones interactivas.
    - Usa primero `config.schema.lookup` cuando no estés seguro de una ruta exacta o de la forma de un campo; devuelve un nodo de esquema superficial más resúmenes inmediatos de nodos hijo para profundizar.
    - Usa `config.patch` para ediciones parciales por RPC; reserva `config.apply` solo para reemplazar la configuración completa.
    - Si estás usando la herramienta `gateway`, solo para propietarios, desde una ejecución de agente, seguirá rechazando escrituras en `tools.exec.ask` / `tools.exec.security` (incluidos los alias heredados `tools.bash.*` que se normalizan a las mismas rutas protegidas de exec).

    Documentación: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Cómo ejecuto un Gateway central con workers especializados en distintos dispositivos?">
    El patrón habitual es **un Gateway** (por ejemplo, Raspberry Pi) más **nodes** y **agents**:

    - **Gateway (central):** es propietario de los canales (Signal/WhatsApp), el enrutamiento y las sesiones.
    - **Nodes (dispositivos):** Macs/iOS/Android se conectan como periféricos y exponen herramientas locales (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** cerebros/workspaces separados para funciones especializadas (por ejemplo, "operaciones de Hetzner", "datos personales").
    - **Subagentes:** generan trabajo en segundo plano desde un agente principal cuando quieres paralelismo.
    - **TUI:** conéctate al Gateway y cambia de agents/sesiones.

    Documentación: [Nodes](/es/nodes), [Acceso remoto](/es/gateway/remote), [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="¿Puede el browser de OpenClaw ejecutarse sin interfaz?">
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

    El valor predeterminado es `false` (con interfaz). El modo sin interfaz tiene más probabilidades de activar comprobaciones antibots en algunos sitios. Consulta [Browser](/es/tools/browser).

    El modo sin interfaz usa el **mismo motor Chromium** y funciona para la mayoría de las automatizaciones (formularios, clics, scraping, inicios de sesión). Las principales diferencias son:

    - No hay ventana visible del navegador (usa capturas de pantalla si necesitas elementos visuales).
    - Algunos sitios son más estrictos con la automatización en modo sin interfaz (CAPTCHAs, antibots).
      Por ejemplo, X/Twitter suele bloquear sesiones sin interfaz.

  </Accordion>

  <Accordion title="¿Cómo uso Brave para controlar el navegador?">
    Configura `browser.executablePath` con tu binario de Brave (o cualquier navegador basado en Chromium) y reinicia el Gateway.
    Consulta los ejemplos completos de configuración en [Browser](/es/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways remotos y nodes

<AccordionGroup>
  <Accordion title="¿Cómo se propagan los comandos entre Telegram, el gateway y los nodes?">
    Los mensajes de Telegram son manejados por el **gateway**. El gateway ejecuta el agente y
    solo entonces llama a los nodes a través del **Gateway WebSocket** cuando se necesita una herramienta de node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Los nodes no ven el tráfico entrante del proveedor; solo reciben llamadas RPC de node.

  </Accordion>

  <Accordion title="¿Cómo puede mi agente acceder a mi equipo si el Gateway está alojado de forma remota?">
    Respuesta corta: **empareja tu equipo como un node**. El Gateway se ejecuta en otro lugar, pero puede
    llamar a las herramientas `node.*` (pantalla, cámara, sistema) en tu máquina local a través del Gateway WebSocket.

    Configuración típica:

    1. Ejecuta el Gateway en el host siempre activo (VPS/servidor doméstico).
    2. Pon el host del Gateway y tu equipo en la misma tailnet.
    3. Asegúrate de que el WS del Gateway sea accesible (bind de tailnet o túnel SSH).
    4. Abre la app de macOS localmente y conéctate en modo **Remote over SSH** (o tailnet directo)
       para que pueda registrarse como node.
    5. Aprueba el node en el Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    No se requiere ningún puente TCP separado; los nodes se conectan a través del Gateway WebSocket.

    Recordatorio de seguridad: emparejar un node de macOS permite `system.run` en esa máquina. Solo
    empareja dispositivos en los que confíes y revisa [Seguridad](/es/gateway/security).

    Documentación: [Nodes](/es/nodes), [Protocolo Gateway](/es/gateway/protocol), [Modo remoto de macOS](/es/platforms/mac/remote), [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="Tailscale está conectado, pero no recibo respuestas. ¿Y ahora qué?">
    Comprueba lo básico:

    - El Gateway está en ejecución: `openclaw gateway status`
    - Estado del Gateway: `openclaw status`
    - Estado del canal: `openclaw channels status`

    Luego verifica la autenticación y el enrutamiento:

    - Si usas Tailscale Serve, asegúrate de que `gateway.auth.allowTailscale` esté configurado correctamente.
    - Si te conectas mediante túnel SSH, confirma que el túnel local esté activo y apunte al puerto correcto.
    - Confirma que tus listas de permitidos (MD o grupo) incluyan tu cuenta.

    Documentación: [Tailscale](/es/gateway/tailscale), [Acceso remoto](/es/gateway/remote), [Channels](/es/channels).

  </Accordion>

  <Accordion title="¿Pueden dos instancias de OpenClaw hablar entre sí (local + VPS)?">
    Sí. No hay un puente "bot a bot" integrado, pero puedes conectarlas de varias
    formas fiables:

    **La más simple:** usa un canal de chat normal al que ambos bots puedan acceder (Telegram/Slack/WhatsApp).
    Haz que el Bot A envíe un mensaje al Bot B y luego deja que el Bot B responda como siempre.

    **Puente de CLI (genérico):** ejecuta un script que llame al otro Gateway con
    `openclaw agent --message ... --deliver`, apuntando a un chat donde el otro bot
    escuche. Si uno de los bots está en un VPS remoto, apunta tu CLI a ese Gateway remoto
    mediante SSH/Tailscale (consulta [Acceso remoto](/es/gateway/remote)).

    Patrón de ejemplo (ejecútalo desde una máquina que pueda alcanzar el Gateway de destino):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Consejo: añade una barrera de protección para que los dos bots no entren en un bucle infinito (solo menciones, listas de permitidos del canal
    o una regla de "no responder a mensajes de bots").

    Documentación: [Acceso remoto](/es/gateway/remote), [CLI de Agent](/cli/agent), [Envío de Agent](/es/tools/agent-send).

  </Accordion>

  <Accordion title="¿Necesito VPS independientes para varios agents?">
    No. Un Gateway puede alojar varios agents, cada uno con su propio workspace, modelos predeterminados
    y enrutamiento. Esa es la configuración normal, y es mucho más barata y sencilla que ejecutar
    un VPS por agent.

    Usa VPS independientes solo cuando necesites aislamiento fuerte (límites de seguridad) o configuraciones muy
    diferentes que no quieras compartir. En caso contrario, mantén un Gateway y
    usa varios agents o subagentes.

  </Accordion>

  <Accordion title="¿Hay alguna ventaja en usar un node en mi portátil personal en lugar de SSH desde un VPS?">
    Sí: los nodes son la forma de primera clase de llegar a tu portátil desde un Gateway remoto, y
    desbloquean más que acceso al shell. El Gateway se ejecuta en macOS/Linux (Windows mediante WSL2) y es
    ligero (un VPS pequeño o una máquina tipo Raspberry Pi es suficiente; 4 GB de RAM son más que suficientes), por lo que una configuración
    habitual es un host siempre activo más tu portátil como node.

    - **No requiere SSH entrante.** Los nodes se conectan hacia fuera al Gateway WebSocket y usan emparejamiento de dispositivos.
    - **Controles de ejecución más seguros.** `system.run` está protegido por listas de permitidos/aprobaciones de node en ese portátil.
    - **Más herramientas de dispositivo.** Los nodes exponen `canvas`, `camera` y `screen` además de `system.run`.
    - **Automatización local del navegador.** Mantén el Gateway en un VPS, pero ejecuta Chrome localmente a través de un host de node en el portátil, o conéctate a Chrome local en el host mediante Chrome MCP.

    SSH está bien para acceso puntual al shell, pero los nodes son más simples para flujos de trabajo continuos de agentes y
    automatización de dispositivos.

    Documentación: [Nodes](/es/nodes), [CLI de Nodes](/cli/nodes), [Browser](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Los nodes ejecutan un servicio gateway?">
    No. Solo debe ejecutarse **un gateway** por host, a menos que intencionadamente ejecutes perfiles aislados (consulta [Múltiples gateways](/es/gateway/multiple-gateways)). Los nodes son periféricos que se conectan
    al gateway (nodes de iOS/Android o "modo node" de macOS en la app de la barra de menús). Para hosts de node sin interfaz
    y control por CLI, consulta [CLI de Node host](/cli/node).

    Se requiere un reinicio completo para cambios en `gateway`, `discovery` y `canvasHost`.

  </Accordion>

  <Accordion title="¿Existe una forma de API / RPC para aplicar configuración?">
    Sí.

    - `config.schema.lookup`: inspecciona un subárbol de configuración con su nodo de esquema superficial, la sugerencia de UI coincidente y resúmenes inmediatos de nodos hijo antes de escribir
    - `config.get`: obtiene la instantánea actual + hash
    - `config.patch`: actualización parcial segura (preferida para la mayoría de las ediciones RPC); recarga en caliente cuando es posible y reinicia cuando es necesario
    - `config.apply`: valida + reemplaza la configuración completa; recarga en caliente cuando es posible y reinicia cuando es necesario
    - La herramienta de tiempo de ejecución `gateway`, solo para propietarios, sigue negándose a reescribir `tools.exec.ask` / `tools.exec.security`; los alias heredados `tools.bash.*` se normalizan a las mismas rutas protegidas de exec

  </Accordion>

  <Accordion title="Configuración mínima razonable para una primera instalación">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Esto configura tu workspace y restringe quién puede activar el bot.

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
    4. **Usar el hostname de tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Si quieres la Control UI sin SSH, usa Tailscale Serve en el VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Esto mantiene el gateway vinculado a loopback y expone HTTPS mediante Tailscale. Consulta [Tailscale](/es/gateway/tailscale).

  </Accordion>

  <Accordion title="¿Cómo conecto un node de Mac a un Gateway remoto (Tailscale Serve)?">
    Serve expone la **Control UI + WS del Gateway**. Los nodes se conectan a través del mismo endpoint WS del Gateway.

    Configuración recomendada:

    1. **Asegúrate de que el VPS + Mac estén en la misma tailnet**.
    2. **Usa la app de macOS en modo Remoto** (el destino SSH puede ser el hostname de tailnet).
       La app tunelizará el puerto del Gateway y se conectará como node.
    3. **Aprueba el node** en el gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentación: [Protocolo Gateway](/es/gateway/protocol), [Discovery](/es/gateway/discovery), [Modo remoto de macOS](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Debería instalarlo en un segundo portátil o simplemente añadir un node?">
    Si solo necesitas **herramientas locales** (pantalla/cámara/exec) en el segundo portátil, añádelo como
    **node**. Eso mantiene un solo Gateway y evita configuración duplicada. Las herramientas locales de node son
    actualmente solo para macOS, pero planeamos ampliarlas a otros SO.

    Instala un segundo Gateway solo cuando necesites **aislamiento fuerte** o dos bots completamente independientes.

    Documentación: [Nodes](/es/nodes), [CLI de Nodes](/cli/nodes), [Múltiples gateways](/es/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables de entorno y carga de .env

<AccordionGroup>
  <Accordion title="¿Cómo carga OpenClaw las variables de entorno?">
    OpenClaw lee variables de entorno del proceso padre (shell, launchd/systemd, CI, etc.) y además carga:

    - `.env` desde el directorio de trabajo actual
    - un `.env` global de respaldo desde `~/.openclaw/.env` (también conocido como `$OPENCLAW_STATE_DIR/.env`)

    Ninguno de los archivos `.env` reemplaza las variables de entorno existentes.

    También puedes definir variables de entorno en línea en la configuración (se aplican solo si faltan en el entorno del proceso):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Consulta [/environment](/es/help/environment) para conocer la precedencia completa y las fuentes.

  </Accordion>

  <Accordion title="Inicié el Gateway mediante el servicio y mis variables de entorno desaparecieron. ¿Y ahora qué?">
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

    Esto ejecuta tu shell de inicio de sesión e importa solo las claves esperadas que falten (nunca reemplaza). Equivalentes en variables de entorno:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='He configurado COPILOT_GITHUB_TOKEN, pero models status muestra "Shell env: off." ¿Por qué?'>
    `openclaw models status` informa si la **importación del entorno del shell** está habilitada. "Shell env: off"
    **no** significa que falten tus variables de entorno; solo significa que OpenClaw no cargará
    tu shell de inicio de sesión automáticamente.

    Si el Gateway se ejecuta como servicio (launchd/systemd), no heredará tu
    entorno del shell. Corrígelo haciendo una de estas cosas:

    1. Pon el token en `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. O habilita la importación del shell (`env.shellEnv.enabled: true`).
    3. O añádelo al bloque `env` de tu configuración (se aplica solo si falta).

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
    Las sesiones pueden expirar después de `session.idleMinutes`, pero esto está **deshabilitado de forma predeterminada** (valor predeterminado **0**).
    Configúralo con un valor positivo para habilitar la expiración por inactividad. Cuando está habilitado, el **siguiente**
    mensaje después del período de inactividad inicia un ID de sesión nuevo para esa clave de chat.
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
    Sí, mediante **enrutamiento multiagente** y **subagentes**. Puedes crear un agente
    coordinador y varios agentes worker con sus propios workspaces y modelos.

    Dicho esto, es mejor verlo como un **experimento divertido**. Consume muchos tokens y a menudo
    es menos eficiente que usar un bot con sesiones separadas. El modelo típico que
    imaginamos es un bot con el que hablas, con distintas sesiones para trabajo en paralelo. Ese
    bot también puede generar subagentes cuando sea necesario.

    Documentación: [Enrutamiento multiagente](/es/concepts/multi-agent), [Subagentes](/es/tools/subagents), [CLI de Agents](/cli/agents).

  </Accordion>

  <Accordion title="¿Por qué se truncó el contexto a mitad de una tarea? ¿Cómo lo evito?">
    El contexto de la sesión está limitado por la ventana del modelo. Chats largos, salidas grandes de herramientas o muchos
    archivos pueden activar Compaction o truncamiento.

    Qué ayuda:

    - Pídele al bot que resuma el estado actual y lo escriba en un archivo.
    - Usa `/compact` antes de tareas largas y `/new` al cambiar de tema.
    - Mantén el contexto importante en el workspace y pídele al bot que lo lea de nuevo.
    - Usa subagentes para trabajo largo o en paralelo, para que el chat principal siga siendo más pequeño.
    - Elige un modelo con una ventana de contexto más grande si esto ocurre con frecuencia.

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

    - Onboarding también ofrece **Reset** si detecta una configuración existente. Consulta [Onboarding (CLI)](/es/start/wizard).
    - Si usaste perfiles (`--profile` / `OPENCLAW_PROFILE`), restablece cada directorio de estado (los predeterminados son `~/.openclaw-<profile>`).
    - Restablecimiento de desarrollo: `openclaw gateway --dev --reset` (solo desarrollo; borra configuración de desarrollo + credenciales + sesiones + workspace).

  </Accordion>

  <Accordion title='Estoy recibiendo errores de "context too large". ¿Cómo restablezco o compacto?'>
    Usa una de estas opciones:

    - **Compactar** (mantiene la conversación pero resume los turnos anteriores):

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

    - Habilita o ajusta la **depuración de sesión** (`agents.defaults.contextPruning`) para recortar salidas antiguas de herramientas.
    - Usa un modelo con una ventana de contexto más grande.

    Documentación: [Compaction](/es/concepts/compaction), [Depuración de sesión](/es/concepts/session-pruning), [Gestión de sesiones](/es/concepts/session).

  </Accordion>

  <Accordion title='¿Por qué veo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Este es un error de validación del proveedor: el modelo emitió un bloque `tool_use` sin el
    `input` requerido. Normalmente significa que el historial de la sesión está obsoleto o dañado (a menudo después de hilos largos
    o un cambio de herramienta/esquema).

    Solución: inicia una sesión nueva con `/new` (mensaje independiente).

  </Accordion>

  <Accordion title="¿Por qué recibo mensajes de heartbeat cada 30 minutos?">
    Los Heartbeats se ejecutan cada **30m** de forma predeterminada (**1h** cuando se usa autenticación OAuth). Ajústalos o desactívalos:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // o "0m" para desactivar
          },
        },
      },
    }
    ```

    Si `HEARTBEAT.md` existe pero está efectivamente vacío (solo líneas en blanco y encabezados
    markdown como `# Heading`), OpenClaw omite la ejecución de heartbeat para ahorrar llamadas a la API.
    Si falta el archivo, el heartbeat se sigue ejecutando y el modelo decide qué hacer.

    Las anulaciones por agente usan `agents.list[].heartbeat`. Documentación: [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title='¿Necesito añadir una "cuenta bot" a un grupo de WhatsApp?'>
    No. OpenClaw se ejecuta en **tu propia cuenta**, así que si estás en el grupo, OpenClaw puede verlo.
    De forma predeterminada, las respuestas en grupos están bloqueadas hasta que permites remitentes (`groupPolicy: "allowlist"`).

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

    Busca `chatId` (o `from`) terminando en `@g.us`, como:
    `1234567890-1234567890@g.us`.

    Opción 2 (si ya está configurado/en lista de permitidos): lista grupos desde la configuración:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentación: [WhatsApp](/es/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="¿Por qué OpenClaw no responde en un grupo?">
    Dos causas comunes:

    - La puerta de menciones está activada (predeterminado). Debes @mencionar al bot (o coincidir con `mentionPatterns`).
    - Configuraste `channels.whatsapp.groups` sin `"*"` y el grupo no está en la lista de permitidos.

    Consulta [Grupos](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).

  </Accordion>

  <Accordion title="¿Los grupos/hilos comparten contexto con los MD?">
    Los chats directos se contraen en la sesión principal de forma predeterminada. Los grupos/canales tienen sus propias claves de sesión, y los topics de Telegram / hilos de Discord son sesiones separadas. Consulta [Grupos](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).
  </Accordion>

  <Accordion title="¿Cuántos workspaces y agents puedo crear?">
    No hay límites estrictos. Decenas (incluso cientos) están bien, pero ten en cuenta:

    - **Crecimiento del disco:** las sesiones + transcripciones viven bajo `~/.openclaw/agents/<agentId>/sessions/`.
    - **Coste de tokens:** más agents significa más uso concurrente del modelo.
    - **Sobrecarga operativa:** perfiles de autenticación, workspaces y enrutamiento de canales por agent.

    Consejos:

    - Mantén un workspace **activo** por agent (`agents.defaults.workspace`).
    - Depura sesiones antiguas (elimina entradas JSONL o del almacén) si el disco crece.
    - Usa `openclaw doctor` para detectar workspaces errantes y desajustes de perfiles.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios bots o chats al mismo tiempo (Slack), y cómo debería configurarlo?">
    Sí. Usa **Enrutamiento multiagente** para ejecutar varios agents aislados y enrutar mensajes entrantes por
    canal/cuenta/peer. Slack es compatible como canal y puede vincularse a agents específicos.

    El acceso al navegador es potente, pero no es "hacer cualquier cosa que pueda hacer un humano": antibots, CAPTCHAs y MFA pueden
    seguir bloqueando la automatización. Para el control del navegador más fiable, usa Chrome MCP local en el host,
    o usa CDP en la máquina que realmente ejecuta el navegador.

    Configuración de buenas prácticas:

    - Host de Gateway siempre activo (VPS/Mac mini).
    - Un agent por función (vinculaciones).
    - Canal(es) de Slack vinculados a esos agents.
    - Navegador local mediante Chrome MCP o un node cuando sea necesario.

    Documentación: [Enrutamiento multiagente](/es/concepts/multi-agent), [Slack](/es/channels/slack),
    [Browser](/es/tools/browser), [Nodes](/es/nodes).

  </Accordion>
</AccordionGroup>

## Modelos: predeterminados, selección, alias, cambio

<AccordionGroup>
  <Accordion title='¿Qué es el "modelo predeterminado"?'>
    El modelo predeterminado de OpenClaw es el que configuras como:

    ```
    agents.defaults.model.primary
    ```

    Se hace referencia a los modelos como `provider/model` (ejemplo: `openai/gpt-5.4`). Si omites el proveedor, OpenClaw primero intenta un alias, luego una coincidencia única del proveedor configurado para ese id exacto de modelo y solo después recurre al proveedor predeterminado configurado como ruta de compatibilidad obsoleta. Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado. Aun así, deberías configurar **explícitamente** `provider/model`.

  </Accordion>

  <Accordion title="¿Qué modelo recomiendan?">
    **Predeterminado recomendado:** usa el modelo de última generación más potente disponible en tu pila de proveedores.
    **Para agents con herramientas habilitadas o entrada no confiable:** prioriza la potencia del modelo sobre el coste.
    **Para chat rutinario/de bajo riesgo:** usa modelos de respaldo más baratos y enruta por función del agent.

    MiniMax tiene su propia documentación: [MiniMax](/es/providers/minimax) y
    [Modelos locales](/es/gateway/local-models).

    Regla general: usa el **mejor modelo que puedas permitirte** para trabajo de alto riesgo, y un modelo más barato
    para chat rutinario o resúmenes. Puedes enrutar modelos por agent y usar subagentes para
    paralelizar tareas largas (cada subagente consume tokens). Consulta [Modelos](/es/concepts/models) y
    [Subagentes](/es/tools/subagents).

    Advertencia importante: los modelos más débiles o demasiado cuantizados son más vulnerables a la inyección de prompts
    y a comportamientos inseguros. Consulta [Seguridad](/es/gateway/security).

    Más contexto: [Modelos](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Cómo cambio de modelo sin borrar mi configuración?">
    Usa **comandos de modelo** o edita solo los campos de **modelo**. Evita reemplazos completos de configuración.

    Opciones seguras:

    - `/model` en el chat (rápido, por sesión)
    - `openclaw models set ...` (actualiza solo la configuración del modelo)
    - `openclaw configure --section model` (interactivo)
    - edita `agents.defaults.model` en `~/.openclaw/openclaw.json`

    Evita `config.apply` con un objeto parcial a menos que pretendas reemplazar toda la configuración.
    Para ediciones RPC, inspecciona primero con `config.schema.lookup` y prefiere `config.patch`. La carga útil de lookup te da la ruta normalizada, documentación/restricciones superficiales del esquema y resúmenes inmediatos de nodos hijo.
    para actualizaciones parciales.
    Si sobrescribiste la configuración, restaura desde una copia de seguridad o vuelve a ejecutar `openclaw doctor` para repararla.

    Documentación: [Modelos](/es/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Puedo usar modelos autohospedados (llama.cpp, vLLM, Ollama)?">
    Sí. Ollama es la ruta más sencilla para modelos locales.

    Configuración más rápida:

    1. Instala Ollama desde `https://ollama.com/download`
    2. Descarga un modelo local como `ollama pull gemma4`
    3. Si también quieres modelos en la nube, ejecuta `ollama signin`
    4. Ejecuta `openclaw onboard` y elige `Ollama`
    5. Elige `Local` o `Cloud + Local`

    Notas:

    - `Cloud + Local` te da modelos en la nube más tus modelos locales de Ollama
    - los modelos en la nube como `kimi-k2.5:cloud` no necesitan descarga local
    - para cambio manual, usa `openclaw models list` y `openclaw models set ollama/<model>`

    Nota de seguridad: los modelos más pequeños o muy cuantizados son más vulnerables a la inyección de prompts.
    Recomendamos firmemente **modelos grandes** para cualquier bot que pueda usar herramientas.
    Si aun así quieres modelos pequeños, habilita sandboxing y listas estrictas de herramientas permitidas.

    Documentación: [Ollama](/es/providers/ollama), [Modelos locales](/es/gateway/local-models),
    [Proveedores de modelos](/es/concepts/model-providers), [Seguridad](/es/gateway/security),
    [Sandboxing](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="¿Qué usan OpenClaw, Flawd y Krill para los modelos?">
    - Estas implementaciones pueden diferir y cambiar con el tiempo; no hay una recomendación fija de proveedor.
    - Comprueba la configuración actual en tiempo de ejecución en cada gateway con `openclaw models status`.
    - Para agents sensibles a la seguridad o con herramientas habilitadas, usa el modelo de última generación más potente disponible.
  </Accordion>

  <Accordion title="¿Cómo cambio de modelo sobre la marcha (sin reiniciar)?">
    Usa el comando `/model` como mensaje independiente:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Estos son los alias integrados. Se pueden añadir alias personalizados mediante `agents.defaults.models`.

    Puedes listar los modelos disponibles con `/model`, `/model list` o `/model status`.

    `/model` (y `/model list`) muestra un selector compacto y numerado. Selecciona por número:

    ```
    /model 3
    ```

    También puedes forzar un perfil de autenticación específico para el proveedor (por sesión):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Consejo: `/model status` muestra qué agent está activo, qué archivo `auth-profiles.json` se está usando y qué perfil de autenticación se probará a continuación.
    También muestra el endpoint del proveedor configurado (`baseUrl`) y el modo de API (`api`) cuando están disponibles.

    **¿Cómo quito la fijación de un perfil que configuré con @profile?**

    Vuelve a ejecutar `/model` **sin** el sufijo `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Si quieres volver al valor predeterminado, selecciónalo desde `/model` (o envía `/model <default provider/model>`).
    Usa `/model status` para confirmar qué perfil de autenticación está activo.

  </Accordion>

  <Accordion title="¿Puedo usar GPT 5.2 para tareas diarias y Codex 5.3 para programación?">
    Sí. Configura uno como predeterminado y cambia según sea necesario:

    - **Cambio rápido (por sesión):** `/model gpt-5.4` para tareas diarias, `/model openai-codex/gpt-5.4` para programar con Codex OAuth.
    - **Predeterminado + cambio:** configura `agents.defaults.model.primary` en `openai/gpt-5.4`, luego cambia a `openai-codex/gpt-5.4` al programar (o al revés).
    - **Subagentes:** enruta las tareas de programación a subagentes con un modelo predeterminado diferente.

    Consulta [Modelos](/es/concepts/models) y [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo configuro el modo rápido para GPT 5.4?">
    Usa un cambio por sesión o un valor predeterminado en la configuración:

    - **Por sesión:** envía `/fast on` mientras la sesión usa `openai/gpt-5.4` o `openai-codex/gpt-5.4`.
    - **Predeterminado por modelo:** configura `agents.defaults.models["openai/gpt-5.4"].params.fastMode` en `true`.
    - **También Codex OAuth:** si también usas `openai-codex/gpt-5.4`, configura la misma marca ahí.

    Ejemplo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Para OpenAI, el modo rápido se asigna a `service_tier = "priority"` en solicitudes nativas de Responses compatibles. Las anulaciones por sesión con `/fast` tienen prioridad sobre los valores predeterminados de configuración.

    Consulta [Thinking y modo rápido](/es/tools/thinking) y [Modo rápido de OpenAI](/es/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='¿Por qué veo "Model ... is not allowed" y luego no hay respuesta?'>
    Si `agents.defaults.models` está configurado, se convierte en la **lista de permitidos** para `/model` y cualquier
    anulación de sesión. Elegir un modelo que no esté en esa lista devuelve:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ese error se devuelve **en lugar de** una respuesta normal. Solución: añade el modelo a
    `agents.defaults.models`, elimina la lista de permitidos o elige un modelo de `/model list`.

  </Accordion>

  <Accordion title='¿Por qué veo "Unknown model: minimax/MiniMax-M2.7"?'>
    Esto significa que el **proveedor no está configurado** (no se encontró ninguna configuración de proveedor MiniMax ni ningún
    perfil de autenticación), por lo que el modelo no puede resolverse.

    Lista de comprobación para corregirlo:

    1. Actualiza a una versión actual de OpenClaw (o ejecuta desde el código fuente `main`) y luego reinicia el gateway.
    2. Asegúrate de que MiniMax esté configurado (asistente o JSON), o de que exista autenticación de MiniMax
       en env/perfiles de autenticación para que pueda inyectarse el proveedor coincidente
       (`MINIMAX_API_KEY` para `minimax`, `MINIMAX_OAUTH_TOKEN` o MiniMax
       OAuth almacenado para `minimax-portal`).
    3. Usa el id exacto del modelo (distingue mayúsculas y minúsculas) para tu ruta de autenticación:
       `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed` para configuración
       con clave de API, o `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` para configuración OAuth.
    4. Ejecuta:

       ```bash
       openclaw models list
       ```

       y elige de la lista (o `/model list` en el chat).

    Consulta [MiniMax](/es/providers/minimax) y [Modelos](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Puedo usar MiniMax como predeterminado y OpenAI para tareas complejas?">
    Sí. Usa **MiniMax como predeterminado** y cambia de modelo **por sesión** cuando sea necesario.
    Los respaldos son para **errores**, no para "tareas difíciles", así que usa `/model` o un agent separado.

    **Opción A: cambiar por sesión**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Luego:

    ```
    /model gpt
    ```

    **Opción B: agents separados**

    - Agent A predeterminado: MiniMax
    - Agent B predeterminado: OpenAI
    - Enruta por agent o usa `/agent` para cambiar

    Documentación: [Modelos](/es/concepts/models), [Enrutamiento multiagente](/es/concepts/multi-agent), [MiniMax](/es/providers/minimax), [OpenAI](/es/providers/openai).

  </Accordion>

  <Accordion title="¿opus / sonnet / gpt son atajos integrados?">
    Sí. OpenClaw incluye algunos atajos predeterminados (solo se aplican cuando el modelo existe en `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Si configuras tu propio alias con el mismo nombre, prevalece tu valor.

  </Accordion>

  <Accordion title="¿Cómo defino/anulo atajos de modelo (aliases)?">
    Los aliases vienen de `agents.defaults.models.<modelId>.alias`. Ejemplo:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Luego `/model sonnet` (o `/<alias>` cuando se admita) se resuelve a ese id de modelo.

  </Accordion>

  <Accordion title="¿Cómo añado modelos de otros proveedores como OpenRouter o Z.AI?">
    OpenRouter (pago por token; muchos modelos):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (modelos GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Si haces referencia a un proveedor/modelo pero falta la clave requerida del proveedor, obtendrás un error de autenticación en tiempo de ejecución (por ejemplo `No API key found for provider "zai"`).

    **No se encontró ninguna clave de API para el proveedor después de añadir un nuevo agent**

    Esto normalmente significa que el **nuevo agent** tiene un almacén de autenticación vacío. La autenticación es por agent y
    se almacena en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opciones para corregirlo:

    - Ejecuta `openclaw agents add <id>` y configura la autenticación durante el asistente.
    - O copia `auth-profiles.json` desde `agentDir` del agent principal al `agentDir` del nuevo agent.

    **No** reutilices `agentDir` entre agents; provoca colisiones de autenticación/sesión.

  </Accordion>
</AccordionGroup>

## Conmutación por error de modelos y "All models failed"

<AccordionGroup>
  <Accordion title="¿Cómo funciona la conmutación por error?">
    La conmutación por error ocurre en dos fases:

    1. **Rotación de perfil de autenticación** dentro del mismo proveedor.
    2. **Respaldo de modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

    Se aplican enfriamientos a los perfiles que fallan (retroceso exponencial), por lo que OpenClaw puede seguir respondiendo incluso cuando un proveedor tiene límite de tasa o falla temporalmente.

    El bucket de límite de tasa incluye algo más que respuestas `429` simples. OpenClaw
    también trata mensajes como `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` y límites
    periódicos de ventana de uso (`weekly/monthly limit reached`) como límites de tasa
    dignos de conmutación por error.

    Algunas respuestas que parecen de facturación no son `402`, y algunas respuestas HTTP `402`
    también permanecen en ese bucket transitorio. Si un proveedor devuelve
    texto explícito de facturación en `401` o `403`, OpenClaw aún puede mantener eso en
    la vía de facturación, pero los comparadores de texto específicos del proveedor siguen limitados al
    proveedor al que pertenecen (por ejemplo OpenRouter `Key limit exceeded`). Si un mensaje `402`
    en cambio parece una ventana de uso reintentable o un
    límite de gasto de organización/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo trata como
    `rate_limit`, no como una deshabilitación prolongada por facturación.

    Los errores de desbordamiento de contexto son diferentes: firmas como
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` u `ollama error: context length
    exceeded` permanecen en la ruta de Compaction/reintento en lugar de avanzar el
    respaldo de modelo.

    El texto genérico de error del servidor es intencionadamente más estrecho que "cualquier cosa con
    unknown/error dentro". OpenClaw sí trata formas transitorias delimitadas por proveedor
    como Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, errores de razón de detención como `Unhandled stop reason:
    error`, cargas JSON `api_error` con texto transitorio de servidor
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) y errores de proveedor ocupado como `ModelNotReadyException` como
    señales de tiempo de espera/sobrecarga dignas de conmutación por error cuando el contexto del proveedor
    coincide.
    El texto de respaldo interno genérico como `LLM request failed with an unknown
    error.` se mantiene conservador y no activa por sí mismo el respaldo de modelo.

  </Accordion>

  <Accordion title='¿Qué significa "No credentials found for profile anthropic:default"?'>
    Significa que el sistema intentó usar el id de perfil de autenticación `anthropic:default`, pero no pudo encontrar credenciales para él en el almacén de autenticación esperado.

    **Lista de comprobación para corregirlo:**

    - **Confirma dónde viven los perfiles de autenticación** (rutas nuevas frente a heredadas)
      - Actual: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Heredada: `~/.openclaw/agent/*` (migrada por `openclaw doctor`)
    - **Confirma que el Gateway cargue tu variable de entorno**
      - Si configuras `ANTHROPIC_API_KEY` en tu shell pero ejecutas el Gateway mediante systemd/launchd, puede que no la herede. Ponla en `~/.openclaw/.env` o habilita `env.shellEnv`.
    - **Asegúrate de estar editando el agent correcto**
      - Las configuraciones multiagente significan que puede haber varios archivos `auth-profiles.json`.
    - **Comprueba el estado de modelo/autenticación**
      - Usa `openclaw models status` para ver los modelos configurados y si los proveedores están autenticados.

    **Lista de comprobación para corregir "No credentials found for profile anthropic"**

    Esto significa que la ejecución está fijada a un perfil de autenticación de Anthropic, pero el Gateway
    no puede encontrarlo en su almacén de autenticación.

    - **Usa Claude CLI**
      - Ejecuta `openclaw models auth login --provider anthropic --method cli --set-default` en el host del gateway.
    - **Si quieres usar una clave de API en su lugar**
      - Pon `ANTHROPIC_API_KEY` en `~/.openclaw/.env` en el **host del gateway**.
      - Borra cualquier orden fijado que fuerce un perfil ausente:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirma que estás ejecutando los comandos en el host del gateway**
      - En modo remoto, los perfiles de autenticación viven en la máquina del gateway, no en tu portátil.

  </Accordion>

  <Accordion title="¿Por qué también probó Google Gemini y falló?">
    Si tu configuración de modelo incluye Google Gemini como respaldo (o cambiaste a un atajo de Gemini), OpenClaw lo probará durante el respaldo de modelo. Si no has configurado credenciales de Google, verás `No API key found for provider "google"`.

    Solución: proporciona autenticación de Google o elimina/evita los modelos de Google en `agents.defaults.model.fallbacks` / aliases para que el respaldo no se enrute allí.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Causa: el historial de la sesión contiene **bloques de thinking sin firmas** (a menudo de
    un stream abortado/parcial). Google Antigravity requiere firmas para los bloques de thinking.

    Solución: OpenClaw ahora elimina los bloques de thinking sin firmar para Google Antigravity Claude. Si sigue apareciendo, inicia una **sesión nueva** o configura `/thinking off` para ese agent.

  </Accordion>
</AccordionGroup>

## Perfiles de autenticación: qué son y cómo gestionarlos

Relacionado: [/concepts/oauth](/es/concepts/oauth) (flujos OAuth, almacenamiento de tokens, patrones de múltiples cuentas)

<AccordionGroup>
  <Accordion title="¿Qué es un perfil de autenticación?">
    Un perfil de autenticación es un registro de credenciales con nombre (OAuth o clave de API) vinculado a un proveedor. Los perfiles viven en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="¿Cuáles son los ids de perfil típicos?">
    OpenClaw usa ids con prefijo del proveedor como:

    - `anthropic:default` (común cuando no existe identidad de correo electrónico)
    - `anthropic:<email>` para identidades OAuth
    - ids personalizados que elijas (por ejemplo `anthropic:work`)

  </Accordion>

  <Accordion title="¿Puedo controlar qué perfil de autenticación se prueba primero?">
    Sí. La configuración admite metadatos opcionales para perfiles y un orden por proveedor (`auth.order.<provider>`). Esto **no** almacena secretos; asigna ids a proveedor/modo y establece el orden de rotación.

    OpenClaw puede omitir temporalmente un perfil si está en un **enfriamiento** corto (límites de tasa/tiempos de espera/fallos de autenticación) o en un estado **deshabilitado** más largo (facturación/créditos insuficientes). Para inspeccionarlo, ejecuta `openclaw models status --json` y comprueba `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

    Los enfriamientos por límite de tasa pueden estar delimitados por modelo. Un perfil que está en enfriamiento
    para un modelo aún puede ser utilizable para un modelo hermano del mismo proveedor,
    mientras que las ventanas de facturación/deshabilitación siguen bloqueando todo el perfil.

    También puedes establecer una anulación de orden **por agent** (almacenada en `auth-state.json` de ese agent) mediante la CLI:

    ```bash
    # El valor predeterminado es el agent predeterminado configurado (omite --agent)
    openclaw models auth order get --provider anthropic

    # Bloquea la rotación a un único perfil (solo prueba este)
    openclaw models auth order set --provider anthropic anthropic:default

    # O establece un orden explícito (respaldo dentro del proveedor)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Borra la anulación (vuelve a auth.order de config / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Para apuntar a un agent específico:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Para verificar qué se probará realmente, usa:

    ```bash
    openclaw models status --probe
    ```

    Si se omite un perfil almacenado del orden explícito, probe informa
    `excluded_by_auth_order` para ese perfil en lugar de probarlo silenciosamente.

  </Accordion>

  <Accordion title="OAuth frente a clave de API: ¿cuál es la diferencia?">
    OpenClaw admite ambos:

    - **OAuth** suele aprovechar acceso por suscripción (cuando corresponde).
    - **Claves de API** usan facturación por token.

    El asistente admite explícitamente Anthropic Claude CLI, OpenAI Codex OAuth y claves de API.

  </Accordion>
</AccordionGroup>

## Gateway: puertos, "already running" y modo remoto

<AccordionGroup>
  <Accordion title="¿Qué puerto usa el Gateway?">
    `gateway.port` controla el único puerto multiplexado para WebSocket + HTTP (Control UI, hooks, etc.).

    Precedencia:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status dice "Runtime: running" pero "RPC probe: failed"?'>
    Porque "running" es la vista del **supervisor** (launchd/systemd/schtasks). La sonda RPC es la CLI conectándose realmente al Gateway WebSocket y llamando a `status`.

    Usa `openclaw gateway status` y confía en estas líneas:

    - `Probe target:` (la URL que realmente usó la sonda)
    - `Listening:` (lo que realmente está vinculado al puerto)
    - `Last gateway error:` (causa raíz común cuando el proceso está activo pero el puerto no está escuchando)

  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status muestra "Config (cli)" y "Config (service)" diferentes?'>
    Estás editando un archivo de configuración mientras el servicio está ejecutando otro distinto (a menudo por un desajuste de `--profile` / `OPENCLAW_STATE_DIR`).

    Solución:

    ```bash
    openclaw gateway install --force
    ```

    Ejecútalo desde el mismo `--profile` / entorno que quieres que use el servicio.

  </Accordion>

  <Accordion title='¿Qué significa "another gateway instance is already listening"?'>
    OpenClaw aplica un bloqueo de tiempo de ejecución vinculando el listener WebSocket inmediatamente al iniciar (predeterminado `ws://127.0.0.1:18789`). Si el bind falla con `EADDRINUSE`, lanza `GatewayLockError` indicando que otra instancia ya está escuchando.

    Solución: detén la otra instancia, libera el puerto o ejecuta con `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="¿Cómo ejecuto OpenClaw en modo remoto (el cliente se conecta a un Gateway en otro lugar)?">
    Configura `gateway.mode: "remote"` y apunta a una URL remota de WebSocket, opcionalmente con credenciales remotas de secreto compartido:

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

    - `openclaw gateway` solo se inicia cuando `gateway.mode` es `local` (o si pasas el indicador de anulación).
    - La app de macOS observa el archivo de configuración y cambia de modo en vivo cuando cambian estos valores.
    - `gateway.remote.token` / `.password` son solo credenciales remotas del lado del cliente; no habilitan por sí solas la autenticación local del gateway.

  </Accordion>

  <Accordion title='La Control UI dice "unauthorized" (o sigue reconectándose). ¿Y ahora qué?'>
    La ruta de autenticación de tu gateway y el método de autenticación de la UI no coinciden.

    Hechos (según el código):

    - La Control UI mantiene el token en `sessionStorage` para la sesión actual de la pestaña del navegador y la URL del gateway seleccionada, de modo que las actualizaciones en la misma pestaña siguen funcionando sin restaurar la persistencia de token de larga duración en localStorage.
    - En `AUTH_TOKEN_MISMATCH`, los clientes de confianza pueden intentar un reintento acotado con un token de dispositivo en caché cuando el gateway devuelve sugerencias de reintento (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ese reintento con token en caché ahora reutiliza los ámbitos aprobados en caché almacenados con el token del dispositivo. Los llamadores explícitos de `deviceToken` / `scopes` explícitos siguen manteniendo su conjunto de ámbitos solicitado en lugar de heredar los ámbitos en caché.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es: token/contraseña compartidos explícitos primero, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token de bootstrap.
    - Las comprobaciones de ámbito de token de bootstrap llevan prefijo de rol. La lista de permitidos del operador de bootstrap integrada solo satisface solicitudes de operador; los roles node u otros roles no operadores siguen necesitando ámbitos con su propio prefijo de rol.

    Solución:

    - La forma más rápida: `openclaw dashboard` (imprime + copia la URL del panel, intenta abrirlo; muestra una sugerencia SSH si está sin interfaz).
    - Si aún no tienes token: `openclaw doctor --generate-gateway-token`.
    - Si es remoto, primero crea un túnel: `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`.
    - Modo de secreto compartido: configura `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, y luego pega el secreto correspondiente en la configuración de Control UI.
    - Modo Tailscale Serve: asegúrate de que `gateway.auth.allowTailscale` esté habilitado y de que estés abriendo la URL de Serve, no una URL sin procesar de loopback/tailnet que omita los encabezados de identidad de Tailscale.
    - Modo trusted-proxy: asegúrate de estar llegando a través del proxy con reconocimiento de identidad no loopback configurado, no a través de un proxy loopback del mismo host ni de una URL sin procesar del gateway.
    - Si el desajuste persiste después del único reintento, rota o vuelve a aprobar el token del dispositivo emparejado:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Si esa llamada de rotación dice que fue denegada, comprueba dos cosas:
      - las sesiones de dispositivos emparejados solo pueden rotar **su propio** dispositivo a menos que también tengan `operator.admin`
      - los valores explícitos de `--scope` no pueden superar los ámbitos actuales de operador del llamador
    - ¿Sigues atascado? Ejecuta `openclaw status --all` y sigue [Solución de problemas](/es/gateway/troubleshooting). Consulta [Dashboard](/web/dashboard) para obtener detalles de autenticación.

  </Accordion>

  <Accordion title="He configurado gateway.bind tailnet pero no puede vincularse y nada escucha">
    El bind `tailnet` elige una IP de Tailscale de tus interfaces de red (100.64.0.0/10). Si la máquina no está en Tailscale (o la interfaz está caída), no hay nada a lo que vincularse.

    Solución:

    - Inicia Tailscale en ese host (para que tenga una dirección 100.x), o
    - Cambia a `gateway.bind: "loopback"` / `"lan"`.

    Nota: `tailnet` es explícito. `auto` prefiere loopback; usa `gateway.bind: "tailnet"` cuando quieras un bind solo de tailnet.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios Gateways en el mismo host?">
    Normalmente no: un Gateway puede ejecutar múltiples canales de mensajería y agents. Usa varios Gateways solo cuando necesites redundancia (por ejemplo, bot de rescate) o aislamiento fuerte.

    Sí, pero debes aislar:

    - `OPENCLAW_CONFIG_PATH` (configuración por instancia)
    - `OPENCLAW_STATE_DIR` (estado por instancia)
    - `agents.defaults.workspace` (aislamiento del workspace)
    - `gateway.port` (puertos únicos)

    Configuración rápida (recomendada):

    - Usa `openclaw --profile <name> ...` por instancia (crea automáticamente `~/.openclaw-<name>`).
    - Configura un `gateway.port` único en la configuración de cada perfil (o pasa `--port` para ejecuciones manuales).
    - Instala un servicio por perfil: `openclaw --profile <name> gateway install`.

    Los perfiles también añaden sufijos a los nombres de servicio (`ai.openclaw.<profile>`; heredados `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guía completa: [Múltiples gateways](/es/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='¿Qué significa "invalid handshake" / code 1008?'>
    El Gateway es un **servidor WebSocket**, y espera que el primer mensaje sea
    una trama `connect`. Si recibe cualquier otra cosa, cierra la conexión
    con **code 1008** (violación de política).

    Causas comunes:

    - Abriste la URL **HTTP** en un navegador (`http://...`) en lugar de un cliente WS.
    - Usaste el puerto o la ruta incorrectos.
    - Un proxy o túnel eliminó los encabezados de autenticación o envió una solicitud que no era del Gateway.

    Soluciones rápidas:

    1. Usa la URL WS: `ws://<host>:18789` (o `wss://...` si es HTTPS).
    2. No abras el puerto WS en una pestaña normal del navegador.
    3. Si la autenticación está activada, incluye el token/contraseña en la trama `connect`.

    Si estás usando la CLI o la TUI, la URL debería verse así:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Detalles del protocolo: [Protocolo Gateway](/es/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Registro y depuración

<AccordionGroup>
  <Accordion title="¿Dónde están los registros?">
    Registros de archivo (estructurados):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Puedes configurar una ruta estable mediante `logging.file`. El nivel de registro del archivo se controla con `logging.level`. La verbosidad de la consola se controla con `--verbose` y `logging.consoleLevel`.

    La forma más rápida de seguir el registro:

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
    Usa los asistentes del gateway:

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

    Documentación: [Windows (WSL2)](/es/platforms/windows), [Guía operativa del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="El Gateway está activo pero las respuestas nunca llegan. ¿Qué debo comprobar?">
    Empieza con una revisión rápida del estado:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causas comunes:

    - La autenticación del modelo no está cargada en el **host del gateway** (comprueba `models status`).
    - El emparejamiento/lista de permitidos del canal bloquea las respuestas (comprueba la configuración del canal + los registros).
    - WebChat/Dashboard está abierto sin el token correcto.

    Si estás en remoto, confirma que la conexión de túnel/Tailscale esté activa y que el
    Gateway WebSocket sea accesible.

    Documentación: [Channels](/es/channels), [Solución de problemas](/es/gateway/troubleshooting), [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ¿y ahora qué?'>
    Normalmente esto significa que la UI perdió la conexión WebSocket. Comprueba:

    1. ¿El Gateway está en ejecución? `openclaw gateway status`
    2. ¿El Gateway está bien? `openclaw status`
    3. ¿La UI tiene el token correcto? `openclaw dashboard`
    4. Si es remoto, ¿está activa la conexión de túnel/Tailscale?

    Luego sigue los registros:

    ```bash
    openclaw logs --follow
    ```

    Documentación: [Dashboard](/web/dashboard), [Acceso remoto](/es/gateway/remote), [Solución de problemas](/es/gateway/troubleshooting).

  </Accordion>

  <Accordion title="setMyCommands de Telegram falla. ¿Qué debo comprobar?">
    Empieza con los registros y el estado del canal:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Luego relaciona el error:

    - `BOT_COMMANDS_TOO_MUCH`: el menú de Telegram tiene demasiadas entradas. OpenClaw ya recorta al límite de Telegram y vuelve a intentarlo con menos comandos, pero algunas entradas del menú aún deben eliminarse. Reduce los comandos de plugins/skills/personalizados o desactiva `channels.telegram.commands.native` si no necesitas el menú.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` o errores de red similares: si estás en un VPS o detrás de un proxy, confirma que HTTPS saliente esté permitido y que DNS funcione para `api.telegram.org`.

    Si el Gateway es remoto, asegúrate de estar consultando los registros en el host del Gateway.

    Documentación: [Telegram](/es/channels/telegram), [Solución de problemas de canales](/es/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI no muestra salida. ¿Qué debo comprobar?">
    Primero confirma que el Gateway sea accesible y que el agent pueda ejecutarse:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    En la TUI, usa `/status` para ver el estado actual. Si esperas respuestas en un canal de chat,
    asegúrate de que la entrega esté habilitada (`/deliver on`).

    Documentación: [TUI](/web/tui), [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo detengo completamente y luego inicio el Gateway?">
    Si instalaste el servicio:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Esto detiene/inicia el **servicio supervisado** (launchd en macOS, systemd en Linux).
    Usa esto cuando el Gateway se ejecute en segundo plano como demonio.

    Si lo estás ejecutando en primer plano, deténlo con Ctrl-C y luego:

    ```bash
    openclaw gateway run
    ```

    Documentación: [Guía operativa del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="Explícamelo fácil: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: reinicia el **servicio en segundo plano** (launchd/systemd).
    - `openclaw gateway`: ejecuta el gateway **en primer plano** para esta sesión de terminal.

    Si instalaste el servicio, usa los comandos de gateway. Usa `openclaw gateway` cuando
    quieras una ejecución puntual en primer plano.

  </Accordion>

  <Accordion title="La forma más rápida de obtener más detalles cuando algo falla">
    Inicia el Gateway con `--verbose` para obtener más detalle en la consola. Luego inspecciona el archivo de registro para ver autenticación de canales, enrutamiento de modelos y errores de RPC.
  </Accordion>
</AccordionGroup>

## Medios y archivos adjuntos

<AccordionGroup>
  <Accordion title="Mi skill generó una imagen/PDF, pero no se envió nada">
    Los archivos adjuntos salientes del agente deben incluir una línea `MEDIA:<path-or-url>` (en su propia línea). Consulta [Configuración del asistente OpenClaw](/es/start/openclaw) y [Envío de Agent](/es/tools/agent-send).

    Envío por CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Comprueba también:

    - El canal de destino admite medios salientes y no está bloqueado por listas de permitidos.
    - El archivo está dentro de los límites de tamaño del proveedor (las imágenes se redimensionan a un máximo de 2048 px).
    - `tools.fs.workspaceOnly=true` mantiene los envíos de rutas locales limitados al workspace, temp/media-store y archivos validados por sandbox.
    - `tools.fs.workspaceOnly=false` permite que `MEDIA:` envíe archivos locales del host que el agente ya puede leer, pero solo para medios más tipos de documento seguros (imágenes, audio, video, PDF y documentos de Office). Los archivos de texto sin formato y similares a secretos siguen bloqueados.

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
      - Las solicitudes pendientes están limitadas a **3 por canal**; comprueba `openclaw pairing list --channel <channel> [--account <id>]` si no llegó un código.
    - Abrir los MD públicamente requiere aceptación explícita (`dmPolicy: "open"` y lista de permitidos `"*"`).

    Ejecuta `openclaw doctor` para detectar políticas de MD arriesgadas.

  </Accordion>

  <Accordion title="¿La inyección de prompts solo es una preocupación para bots públicos?">
    No. La inyección de prompts trata sobre **contenido no confiable**, no solo sobre quién puede enviar MD al bot.
    Si tu asistente lee contenido externo (búsqueda/captura web, páginas del navegador, correos,
    documentos, archivos adjuntos, registros pegados), ese contenido puede incluir instrucciones que intenten
    secuestrar el modelo. Esto puede ocurrir incluso si **tú eres el único remitente**.

    El mayor riesgo aparece cuando las herramientas están habilitadas: se puede engañar al modelo para
    que exfiltre contexto o llame herramientas en tu nombre. Reduce el alcance del daño:

    - usando un agent "lector" de solo lectura o con herramientas deshabilitadas para resumir contenido no confiable
    - manteniendo `web_search` / `web_fetch` / `browser` desactivados para agents con herramientas habilitadas
    - tratando también como no confiable el texto decodificado de archivos/documentos: OpenResponses
      `input_file` y la extracción de archivos adjuntos multimedia envuelven el texto extraído en
      marcadores explícitos de límite de contenido externo en lugar de pasar el texto bruto del archivo
    - usando sandboxing y listas estrictas de herramientas permitidas

    Detalles: [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Debería mi bot tener su propio correo electrónico, cuenta de GitHub o número de teléfono?">
    Sí, para la mayoría de las configuraciones. Aislar el bot con cuentas y números de teléfono separados
    reduce el alcance del daño si algo sale mal. También facilita rotar
    credenciales o revocar acceso sin afectar a tus cuentas personales.

    Empieza poco a poco. Dale acceso solo a las herramientas y cuentas que realmente necesites, y amplíalo
    más adelante si hace falta.

    Documentación: [Seguridad](/es/gateway/security), [Emparejamiento](/es/channels/pairing).

  </Accordion>

  <Accordion title="¿Puedo darle autonomía sobre mis mensajes de texto y es seguro?">
    **No** recomendamos autonomía total sobre tus mensajes personales. El patrón más seguro es:

    - Mantener los MD en **modo de emparejamiento** o con una lista de permitidos estricta.
    - Usar un **número o cuenta separados** si quieres que envíe mensajes en tu nombre.
    - Dejar que redacte y luego **aprobar antes de enviar**.

    Si quieres experimentar, hazlo con una cuenta dedicada y mantenla aislada. Consulta
    [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Puedo usar modelos más baratos para tareas de asistente personal?">
    Sí, **si** el agent es solo de chat y la entrada es confiable. Los niveles más pequeños son
    más susceptibles al secuestro por instrucciones, así que evítalos en agents con herramientas habilitadas
    o al leer contenido no confiable. Si debes usar un modelo más pequeño, bloquea
    las herramientas y ejecútalo dentro de un sandbox. Consulta [Seguridad](/es/gateway/security).
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
    No. La política predeterminada de MD de WhatsApp es **emparejamiento**. Los remitentes desconocidos solo reciben un código de emparejamiento y su mensaje **no se procesa**. OpenClaw solo responde a los chats que recibe o a envíos explícitos que tú actives.

    Aprueba el emparejamiento con:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Lista las solicitudes pendientes:

    ```bash
    openclaw pairing list whatsapp
    ```

    Aviso del número de teléfono en el asistente: se usa para configurar tu **lista de permitidos/propietario** para que tus propios MD estén permitidos. No se usa para envío automático. Si ejecutas OpenClaw con tu número personal de WhatsApp, usa ese número y habilita `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandos de chat, abortar tareas y "no se detiene"

<AccordionGroup>
  <Accordion title="¿Cómo evito que los mensajes internos del sistema aparezcan en el chat?">
    La mayoría de los mensajes internos o de herramientas solo aparecen cuando **verbose**, **trace** o **reasoning** están habilitados
    para esa sesión.

    Solución en el chat donde lo ves:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Si sigue habiendo demasiado ruido, comprueba la configuración de la sesión en la Control UI y pon verbose
    en **inherit**. Confirma también que no estés usando un perfil de bot con `verboseDefault` configurado
    en `on` en la configuración.

    Documentación: [Thinking y verbose](/es/tools/thinking), [Seguridad](/es/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="¿Cómo detengo/cancelo una tarea en ejecución?">
    Envía cualquiera de estas opciones **como mensaje independiente** (sin slash):

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

    Estos son activadores de aborto (no comandos slash).

    Para procesos en segundo plano (de la herramienta exec), puedes pedir al agente que ejecute:

    ```
    process action:kill sessionId:XXX
    ```

    Resumen de comandos slash: consulta [Comandos slash](/es/tools/slash-commands).

    La mayoría de los comandos deben enviarse como mensaje **independiente** que empiece por `/`, pero algunos atajos (como `/status`) también funcionan en línea para remitentes en lista de permitidos.

  </Accordion>

  <Accordion title='¿Cómo envío un mensaje de Discord desde Telegram? ("Cross-context messaging denied")'>
    OpenClaw bloquea la mensajería **entre proveedores** de forma predeterminada. Si una llamada de herramienta está vinculada
    a Telegram, no enviará a Discord a menos que lo permitas explícitamente.

    Habilita la mensajería entre proveedores para el agent:

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

  <Accordion title='¿Por qué da la sensación de que el bot "ignora" mensajes enviados muy rápido?'>
    El modo de cola controla cómo interactúan los mensajes nuevos con una ejecución en curso. Usa `/queue` para cambiar de modo:

    - `steer` - los mensajes nuevos redirigen la tarea actual
    - `followup` - ejecuta los mensajes uno a uno
    - `collect` - agrupa los mensajes y responde una sola vez (predeterminado)
    - `steer-backlog` - redirige ahora y luego procesa la cola acumulada
    - `interrupt` - aborta la ejecución actual y empieza de nuevo

    Puedes añadir opciones como `debounce:2s cap:25 drop:summarize` para modos de seguimiento.

  </Accordion>
</AccordionGroup>

## Miscelánea

<AccordionGroup>
  <Accordion title='¿Cuál es el modelo predeterminado para Anthropic con una clave de API?'>
    En OpenClaw, las credenciales y la selección de modelo están separadas. Configurar `ANTHROPIC_API_KEY` (o almacenar una clave de API de Anthropic en perfiles de autenticación) habilita la autenticación, pero el modelo predeterminado real es el que configures en `agents.defaults.model.primary` (por ejemplo, `anthropic/claude-sonnet-4-6` o `anthropic/claude-opus-4-6`). Si ves `No credentials found for profile "anthropic:default"`, significa que el Gateway no pudo encontrar credenciales de Anthropic en el `auth-profiles.json` esperado para el agent en ejecución.
  </Accordion>
</AccordionGroup>

---

¿Sigues atascado? Pregunta en [Discord](https://discord.com/invite/clawd) o abre una [discusión en GitHub](https://github.com/openclaw/openclaw/discussions).
