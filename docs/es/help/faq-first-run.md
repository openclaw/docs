---
read_when:
    - Nueva instalación, incorporación atascada o errores en la primera ejecución
    - Elegir la autenticación y las suscripciones de proveedores
    - No se puede acceder a docs.openclaw.ai, no se puede abrir el panel de control, la instalación se queda bloqueada
sidebarTitle: First-run FAQ
summary: 'Preguntas frecuentes: inicio rápido y configuración de primera ejecución — instalación, incorporación, autenticación, suscripciones, errores iniciales'
title: 'Preguntas frecuentes: configuración de primera ejecución'
x-i18n:
    generated_at: "2026-05-02T05:27:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 469fbd24fea69d91c5b0408dff9c7d7b2382f9c59430a1d5331cb5dcabdce295
    source_path: help/faq-first-run.md
    workflow: 16
---

  Inicio rápido y preguntas frecuentes del primer uso. Para operaciones cotidianas, modelos, autenticación, sesiones y solución de problemas, consulta la [FAQ](/es/help/faq) principal.

  ## Inicio rápido y configuración del primer uso

  <AccordionGroup>
  <Accordion title="Estoy bloqueado, forma más rápida de desbloquearme">
    Usa un agente de IA local que pueda **ver tu máquina**. Eso es mucho más eficaz que preguntar
    en Discord, porque la mayoría de los casos de "estoy bloqueado" son **problemas locales de configuración o entorno** que
    los ayudantes remotos no pueden inspeccionar.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Estas herramientas pueden leer el repositorio, ejecutar comandos, inspeccionar registros y ayudar a corregir tu configuración
    a nivel de máquina (PATH, servicios, permisos, archivos de autenticación). Dales el **checkout completo del código fuente** mediante
    la instalación hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Esto instala OpenClaw **desde un checkout de git**, de modo que el agente pueda leer el código + la documentación y
    razonar sobre la versión exacta que estás ejecutando. Siempre puedes volver a estable más tarde
    ejecutando de nuevo el instalador sin `--install-method git`.

    Consejo: pide al agente que **planifique y supervise** la corrección (paso a paso), y luego ejecute solo los
    comandos necesarios. Eso mantiene los cambios pequeños y más fáciles de auditar.

    Si descubres un error real o una corrección, abre un issue de GitHub o envía un PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Empieza con estos comandos (comparte las salidas al pedir ayuda):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Qué hacen:

    - `openclaw status`: instantánea rápida del estado de gateway/agente + configuración básica.
    - `openclaw models status`: comprueba la autenticación del proveedor + disponibilidad de modelos.
    - `openclaw doctor`: valida y repara problemas comunes de configuración/estado.

    Otras comprobaciones útiles de la CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Bucle rápido de depuración: [Primeros 60 segundos si algo está roto](#first-60-seconds-if-something-is-broken).
    Documentación de instalación: [Instalar](/es/install), [Opciones del instalador](/es/install/installer), [Actualizar](/es/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sigue omitiéndose. ¿Qué significan los motivos de omisión?">
    Motivos comunes de omisión de Heartbeat:

    - `quiet-hours`: fuera de la ventana de horas activas configurada
    - `empty-heartbeat-file`: `HEARTBEAT.md` existe pero solo contiene un esqueleto en blanco o solo con encabezados
    - `no-tasks-due`: el modo de tareas de `HEARTBEAT.md` está activo, pero ninguno de los intervalos de tareas vence todavía
    - `alerts-disabled`: toda la visibilidad de Heartbeat está desactivada (`showOk`, `showAlerts` y `useIndicator` están desactivados)

    En modo de tareas, las marcas de tiempo de vencimiento solo avanzan después de que se complete
    una ejecución real de Heartbeat. Las ejecuciones omitidas no marcan tareas como completadas.

    Documentación: [Heartbeat](/es/gateway/heartbeat), [Automatización y tareas](/es/automation).

  </Accordion>

  <Accordion title="Forma recomendada de instalar y configurar OpenClaw">
    El repositorio recomienda ejecutar desde el código fuente y usar onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    El asistente también puede compilar automáticamente los recursos de la interfaz. Después del onboarding, normalmente ejecutas el Gateway en el puerto **18789**.

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

  <Accordion title="¿Cómo abro el panel después del onboarding?">
    El asistente abre tu navegador con una URL limpia del panel (sin token) justo después del onboarding y también imprime el enlace en el resumen. Mantén esa pestaña abierta; si no se abrió, copia/pega la URL impresa en la misma máquina.
  </Accordion>

  <Accordion title="¿Cómo autentico el panel en localhost frente a remoto?">
    **Localhost (misma máquina):**

    - Abre `http://127.0.0.1:18789/`.
    - Si pide autenticación con secreto compartido, pega el token o la contraseña configurados en los ajustes de Control UI.
    - Origen del token: `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
    - Origen de la contraseña: `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Si todavía no hay un secreto compartido configurado, genera un token con `openclaw doctor --generate-gateway-token`.

    **No en localhost:**

    - **Tailscale Serve** (recomendado): mantén bind en loopback, ejecuta `openclaw gateway --tailscale serve`, abre `https://<magicdns>/`. Si `gateway.auth.allowTailscale` es `true`, los encabezados de identidad satisfacen la autenticación de Control UI/WebSocket (sin secreto compartido pegado, asume un host de Gateway de confianza); las API HTTP siguen requiriendo autenticación con secreto compartido a menos que uses deliberadamente private-ingress `none` o autenticación HTTP de trusted-proxy.
      Los intentos incorrectos simultáneos de autenticación de Serve desde el mismo cliente se serializan antes de que el limitador de autenticación fallida los registre, por lo que el segundo reintento incorrecto ya puede mostrar `retry later`.
    - **Bind de tailnet**: ejecuta `openclaw gateway --bind tailnet --token "<token>"` (o configura autenticación por contraseña), abre `http://<tailscale-ip>:18789/` y luego pega el secreto compartido correspondiente en los ajustes del panel.
    - **Proxy inverso consciente de identidad**: mantén el Gateway detrás de un proxy de confianza, configura `gateway.auth.mode: "trusted-proxy"` y luego abre la URL del proxy. Los proxies loopback del mismo host requieren `gateway.auth.trustedProxy.allowLoopback = true` explícito.
    - **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`. La autenticación con secreto compartido sigue aplicándose sobre el túnel; pega el token o la contraseña configurados si se solicita.

    Consulta [Panel](/es/web/dashboard) y [Superficies web](/es/web) para ver modos de bind y detalles de autenticación.

  </Accordion>

  <Accordion title="¿Por qué hay dos configuraciones de aprobación exec para aprobaciones por chat?">
    Controlan capas distintas:

    - `approvals.exec`: reenvía solicitudes de aprobación a destinos de chat
    - `channels.<channel>.execApprovals`: hace que ese canal actúe como cliente nativo de aprobación para aprobaciones exec

    La política exec del host sigue siendo la puerta de aprobación real. La configuración de chat solo controla dónde
    aparecen las solicitudes de aprobación y cómo las personas pueden responderlas.

    En la mayoría de las configuraciones **no** necesitas ambas:

    - Si el chat ya admite comandos y respuestas, `/approve` en el mismo chat funciona mediante la ruta compartida.
    - Si un canal nativo compatible puede inferir aprobadores de forma segura, OpenClaw ahora habilita automáticamente aprobaciones nativas primero por DM cuando `channels.<channel>.execApprovals.enabled` no está establecido o es `"auto"`.
    - Cuando hay tarjetas/botones de aprobación nativos disponibles, esa interfaz nativa es la ruta principal; el agente solo debe incluir un comando manual `/approve` si el resultado de la herramienta indica que las aprobaciones por chat no están disponibles o que la aprobación manual es la única ruta.
    - Usa `approvals.exec` solo cuando las solicitudes también deban reenviarse a otros chats o salas explícitas de operaciones.
    - Usa `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo cuando quieras explícitamente que las solicitudes de aprobación se publiquen de vuelta en la sala/tema de origen.
    - Las aprobaciones de Plugin vuelven a estar separadas: usan `/approve` en el mismo chat por defecto, reenvío opcional con `approvals.plugin`, y solo algunos canales nativos mantienen manejo nativo de aprobación de Plugin encima.

    Versión corta: el reenvío sirve para enrutar; la configuración de cliente nativo sirve para una UX más rica específica del canal.
    Consulta [Aprobaciones exec](/es/tools/exec-approvals).

  </Accordion>

  <Accordion title="¿Qué runtime necesito?">
    Se requiere Node **>= 22**. Se recomienda `pnpm`. Bun **no se recomienda** para el Gateway.
  </Accordion>

  <Accordion title="¿Funciona en Raspberry Pi?">
    Sí. El Gateway es ligero: la documentación indica **512 MB-1 GB de RAM**, **1 núcleo** y alrededor de **500 MB**
    de disco como suficiente para uso personal, y señala que una **Raspberry Pi 4 puede ejecutarlo**.

    Si quieres margen adicional (registros, medios, otros servicios), se recomiendan **2 GB**, pero
    no es un mínimo estricto.

    Consejo: un Pi/VPS pequeño puede alojar el Gateway, y puedes emparejar **nodos** en tu portátil/teléfono para
    pantalla/cámara/lienzo local o ejecución de comandos. Consulta [Nodos](/es/nodes).

  </Accordion>

  <Accordion title="¿Algún consejo para instalaciones en Raspberry Pi?">
    Versión corta: funciona, pero espera asperezas.

    - Usa un sistema operativo de **64 bits** y mantén Node >= 22.
    - Prefiere la **instalación hackable (git)** para poder ver registros y actualizar rápido.
    - Empieza sin canales/Skills, luego añádelos uno por uno.
    - Si encuentras problemas binarios extraños, normalmente es un problema de **compatibilidad ARM**.

    Documentación: [Linux](/es/platforms/linux), [Instalar](/es/install).

  </Accordion>

  <Accordion title="Está bloqueado en wake up my friend / el onboarding no eclosiona. ¿Y ahora qué?">
    Esa pantalla depende de que el Gateway esté accesible y autenticado. La TUI también envía
    "Wake up, my friend!" automáticamente en la primera eclosión. Si ves esa línea **sin respuesta**
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

    3. Si sigue colgado, ejecuta:

    ```bash
    openclaw doctor
    ```

    Si el Gateway es remoto, asegúrate de que el túnel/la conexión Tailscale esté activa y de que la interfaz
    apunte al Gateway correcto. Consulta [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Puedo migrar mi configuración a una máquina nueva (Mac mini) sin rehacer el onboarding?">
    Sí. Copia el **directorio de estado** y el **espacio de trabajo**, y luego ejecuta Doctor una vez. Esto
    mantiene tu bot "exactamente igual" (memoria, historial de sesiones, autenticación y estado de canal)
    siempre que copies **ambas** ubicaciones:

    1. Instala OpenClaw en la máquina nueva.
    2. Copia `$OPENCLAW_STATE_DIR` (predeterminado: `~/.openclaw`) desde la máquina antigua.
    3. Copia tu espacio de trabajo (predeterminado: `~/.openclaw/workspace`).
    4. Ejecuta `openclaw doctor` y reinicia el servicio Gateway.

    Eso conserva la configuración, los perfiles de autenticación, las credenciales de WhatsApp, las sesiones y la memoria. Si estás en
    modo remoto, recuerda que el host de gateway es propietario del almacén de sesiones y el espacio de trabajo.

    **Importante:** si solo haces commit/push de tu espacio de trabajo a GitHub, estás haciendo copia de seguridad de
    **memoria + archivos de arranque**, pero **no** del historial de sesiones ni de la autenticación. Esos viven
    bajo `~/.openclaw/` (por ejemplo `~/.openclaw/agents/<agentId>/sessions/`).

    Relacionado: [Migrar](/es/install/migrating), [Dónde viven las cosas en disco](#where-things-live-on-disk),
    [Espacio de trabajo del agente](/es/concepts/agent-workspace), [Doctor](/es/gateway/doctor),
    [Modo remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Dónde veo qué hay de nuevo en la versión más reciente?">
    Consulta el changelog de GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Las entradas más nuevas están arriba. Si la sección superior está marcada como **Unreleased**, la siguiente sección
    con fecha es la última versión publicada. Las entradas se agrupan por **Destacados**, **Cambios** y
    **Correcciones** (además de secciones de documentación/otras cuando sea necesario).

  </Accordion>

  <Accordion title="No puedo acceder a docs.openclaw.ai (error SSL)">
    Algunas conexiones de Comcast/Xfinity bloquean incorrectamente `docs.openclaw.ai` mediante Xfinity
    Advanced Security. Desactívalo o agrega `docs.openclaw.ai` a la lista de permitidos, y vuelve a intentarlo.
    Ayúdanos a desbloquearlo informando aquí: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Si todavía no puedes acceder al sitio, la documentación está replicada en GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Diferencia entre estable y beta">
    **Estable** y **beta** son **npm dist-tags**, no líneas de código separadas:

    - `latest` = estable
    - `beta` = compilación temprana para pruebas

    Normalmente, una versión estable llega primero a **beta** y luego un paso explícito
    de promoción mueve esa misma versión a `latest`. Los mantenedores también pueden
    publicar directamente en `latest` cuando sea necesario. Por eso beta y estable pueden
    apuntar a la **misma versión** después de la promoción.

    Ve qué cambió:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Para comandos de instalación de una sola línea y la diferencia entre beta y dev, consulta el acordeón de abajo.

  </Accordion>

  <Accordion title="¿Cómo instalo la versión beta y cuál es la diferencia entre beta y dev?">
    **Beta** es el npm dist-tag `beta` (puede coincidir con `latest` después de la promoción).
    **Dev** es la punta cambiante de `main` (git); cuando se publica, usa el npm dist-tag `dev`.

    Comandos de una sola línea (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalador de Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Más detalles: [Canales de desarrollo](/es/install/development-channels) y [Opciones del instalador](/es/install/installer).

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

    Eso te da un repositorio local que puedes editar y luego actualizar mediante git.

    Si prefieres un clon limpio manualmente, usa:

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
    - **Onboarding:** 5-15 minutos, según cuántos canales/modelos configures

    Si se bloquea, usa [Instalador atascado](#quick-start-and-first-run-setup)
    y el ciclo rápido de depuración en [Estoy atascado](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="¿Instalador atascado? ¿Cómo obtengo más información?">
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

    Más opciones: [Opciones del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="La instalación de Windows dice que no se encontró git o que openclaw no se reconoce">
    Dos problemas comunes en Windows:

    **1) error de npm spawn git / no se encontró git**

    - Instala **Git for Windows** y asegúrate de que `git` esté en tu PATH.
    - Cierra y vuelve a abrir PowerShell, luego vuelve a ejecutar el instalador.

    **2) openclaw no se reconoce después de la instalación**

    - Tu carpeta bin global de npm no está en PATH.
    - Comprueba la ruta:

      ```powershell
      npm config get prefix
      ```

    - Agrega ese directorio a tu PATH de usuario (no hace falta el sufijo `\bin` en Windows; en la mayoría de los sistemas es `%AppData%\npm`).
    - Cierra y vuelve a abrir PowerShell después de actualizar PATH.

    Si quieres la configuración de Windows más sencilla, usa **WSL2** en lugar de Windows nativo.
    Documentación: [Windows](/es/platforms/windows).

  </Accordion>

  <Accordion title="La salida de exec en Windows muestra texto chino ilegible: ¿qué debo hacer?">
    Esto suele ser una discrepancia de página de códigos de la consola en shells nativos de Windows.

    Síntomas:

    - La salida de `system.run`/`exec` muestra el chino como mojibake
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
    a tu bot (o Claude/Codex) _desde esa carpeta_ para que pueda leer el repositorio y responder con precisión.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Más detalles: [Instalar](/es/install) y [Opciones del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="¿Cómo instalo OpenClaw en Linux?">
    Respuesta breve: sigue la guía de Linux y luego ejecuta el onboarding.

    - Ruta rápida de Linux + instalación del servicio: [Linux](/es/platforms/linux).
    - Recorrido completo: [Primeros pasos](/es/start/getting-started).
    - Instalador + actualizaciones: [Instalación y actualizaciones](/es/install/updating).

  </Accordion>

  <Accordion title="¿Cómo instalo OpenClaw en un VPS?">
    Cualquier VPS Linux funciona. Instálalo en el servidor y luego usa SSH/Tailscale para llegar al Gateway.

    Guías: [exe.dev](/es/install/exe-dev), [Hetzner](/es/install/hetzner), [Fly.io](/es/install/fly).
    Acceso remoto: [Gateway remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Dónde están las guías de instalación en la nube/VPS?">
    Mantenemos un **hub de alojamiento** con los proveedores comunes. Elige uno y sigue la guía:

    - [Alojamiento VPS](/es/vps) (todos los proveedores en un solo lugar)
    - [Fly.io](/es/install/fly)
    - [Hetzner](/es/install/hetzner)
    - [exe.dev](/es/install/exe-dev)

    Cómo funciona en la nube: el **Gateway se ejecuta en el servidor**, y accedes a él
    desde tu portátil/teléfono mediante la Control UI (o Tailscale/SSH). Tu estado + espacio de trabajo
    viven en el servidor, así que trata el host como la fuente de verdad y haz copias de seguridad.

    Puedes emparejar **nodos** (Mac/iOS/Android/headless) con ese Gateway en la nube para acceder
    a la pantalla/cámara/canvas local o ejecutar comandos en tu portátil mientras mantienes el
    Gateway en la nube.

    Hub: [Plataformas](/es/platforms). Acceso remoto: [Gateway remoto](/es/gateway/remote).
    Nodos: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes).

  </Accordion>

  <Accordion title="¿Puedo pedirle a OpenClaw que se actualice a sí mismo?">
    Respuesta breve: **posible, no recomendado**. El flujo de actualización puede reiniciar el
    Gateway (lo que interrumpe la sesión activa), puede necesitar un git checkout limpio y
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
    - Ubicación del **espacio de trabajo** + archivos de inicialización
    - **Configuración del Gateway** (bind/port/auth/tailscale)
    - **Canales** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, además de plugins de canal incluidos como QQ Bot)
    - **Instalación del daemon** (LaunchAgent en macOS; unidad de usuario systemd en Linux/WSL2)
    - **Comprobaciones de salud** y selección de **Skills**

    También advierte si tu modelo configurado es desconocido o no tiene autenticación.

  </Accordion>

  <Accordion title="¿Necesito una suscripción a Claude u OpenAI para ejecutar esto?">
    No. Puedes ejecutar OpenClaw con **claves de API** (Anthropic/OpenAI/otros) o con
    **modelos solo locales** para que tus datos permanezcan en tu dispositivo. Las suscripciones (Claude
    Pro/Max u OpenAI Codex) son formas opcionales de autenticar esos proveedores.

    Para Anthropic en OpenClaw, la división práctica es:

    - **Clave de API de Anthropic**: facturación normal de la API de Anthropic
    - **Claude CLI / autenticación de suscripción de Claude en OpenClaw**: el personal de Anthropic
      nos dijo que este uso vuelve a estar permitido, y OpenClaw está tratando el uso de `claude -p`
      como autorizado para esta integración salvo que Anthropic publique una nueva
      política

    Para hosts de Gateway de larga duración, las claves de API de Anthropic siguen siendo la configuración más
    predecible. OpenAI Codex OAuth es compatible explícitamente con herramientas externas
    como OpenClaw.

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
    OpenClaw trata la autenticación de suscripción de Claude y el uso de `claude -p` como autorizados
    para esta integración salvo que Anthropic publique una nueva política. Si quieres
    la configuración del lado del servidor más predecible, usa una clave de API de Anthropic en su lugar.

  </Accordion>

  <Accordion title="¿Admiten autenticación de suscripción de Claude (Claude Pro o Max)?">
    Sí.

    El personal de Anthropic nos dijo que este uso vuelve a estar permitido, así que OpenClaw trata
    la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración
    salvo que Anthropic publique una nueva política.

    Anthropic setup-token sigue disponible como una ruta de token compatible con OpenClaw, pero OpenClaw ahora prefiere la reutilización de Claude CLI y `claude -p` cuando estén disponibles.
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
    la beta de contexto 1M de Anthropic (`context1m: true`). Eso solo funciona cuando tu
    credencial es apta para facturación de contexto largo (facturación con clave de API o la
    ruta de inicio de sesión de Claude en OpenClaw con Extra Usage activado).

    Consejo: configura un **modelo alternativo** para que OpenClaw pueda seguir respondiendo mientras un proveedor tiene límite de frecuencia.
    Consulta [Modelos](/es/cli/models), [OAuth](/es/concepts/oauth) y
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/es/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="¿AWS Bedrock es compatible?">
    Sí. OpenClaw incluye un proveedor **Amazon Bedrock (Converse)** integrado. Con marcadores de entorno de AWS presentes, OpenClaw puede descubrir automáticamente el catálogo Bedrock de streaming/texto y fusionarlo como un proveedor `amazon-bedrock` implícito; de lo contrario, puedes habilitar explícitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` o añadir una entrada manual de proveedor. Consulta [Amazon Bedrock](/es/providers/bedrock) y [Proveedores de modelos](/es/providers/models). Si prefieres un flujo de clave gestionado, un proxy compatible con OpenAI delante de Bedrock sigue siendo una opción válida.
  </Accordion>

  <Accordion title="¿Cómo funciona la autenticación de Codex?">
    OpenClaw admite **OpenAI Code (Codex)** mediante OAuth (inicio de sesión de ChatGPT). Usa
    `openai/gpt-5.5` con `agentRuntime.id: "codex"` para la configuración común:
    autenticación de suscripción ChatGPT/Codex más ejecución nativa del servidor de aplicaciones de Codex. Usa
    `openai-codex/gpt-5.5` solo cuando quieras OAuth de Codex mediante el ejecutor
    PI predeterminado. Usa `openai/gpt-5.5` sin la anulación de runtime de Codex para
    acceso directo con clave de API de OpenAI.
    Consulta [Proveedores de modelos](/es/concepts/model-providers) e [Incorporación (CLI)](/es/start/wizard).
  </Accordion>

  <Accordion title="¿Por qué OpenClaw todavía menciona openai-codex?">
    `openai-codex` es el id del proveedor y del perfil de autenticación para OAuth de ChatGPT/Codex.
    También es el prefijo explícito de modelo PI para OAuth de Codex:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = autenticación de suscripción ChatGPT/Codex con runtime nativo de Codex
    - `openai-codex/gpt-5.5` = ruta OAuth de Codex en PI
    - `openai/gpt-5.5` sin anulación del runtime de Codex = ruta directa con clave de API de OpenAI en PI
    - `openai-codex:...` = id de perfil de autenticación, no una referencia de modelo

    Si quieres la ruta directa de facturación/límites de OpenAI Platform, configura
    `OPENAI_API_KEY`. Si quieres autenticación de suscripción ChatGPT/Codex, inicia sesión con
    `openclaw models auth login --provider openai-codex`. Para el runtime nativo de Codex,
    conserva la referencia de modelo como `openai/gpt-5.5` y configura
    `agentRuntime.id: "codex"`. Usa referencias de modelo `openai-codex/*` solo para
    ejecuciones de PI.

  </Accordion>

  <Accordion title="¿Por qué los límites de OAuth de Codex pueden diferir de ChatGPT web?">
    OAuth de Codex usa ventanas de cuota gestionadas por OpenAI y dependientes del plan. En la práctica,
    esos límites pueden diferir de la experiencia del sitio web/aplicación de ChatGPT, incluso cuando
    ambos están vinculados a la misma cuenta.

    OpenClaw puede mostrar las ventanas de uso/cuota del proveedor actualmente visibles en
    `openclaw models status`, pero no inventa ni normaliza derechos de ChatGPT web
    en acceso directo a la API. Si quieres la ruta directa de facturación/límites de OpenAI Platform,
    usa `openai/*` con una clave de API.

  </Accordion>

  <Accordion title="¿Admiten autenticación de suscripción de OpenAI (OAuth de Codex)?">
    Sí. OpenClaw admite por completo **OAuth de suscripción de OpenAI Code (Codex)**.
    OpenAI permite explícitamente el uso de OAuth de suscripción en herramientas/flujos de trabajo externos
    como OpenClaw. La incorporación puede ejecutar el flujo OAuth por ti.

    Consulta [OAuth](/es/concepts/oauth), [Proveedores de modelos](/es/concepts/model-providers) e [Incorporación (CLI)](/es/start/wizard).

  </Accordion>

  <Accordion title="¿Cómo configuro OAuth de Gemini CLI?">
    Gemini CLI usa un **flujo de autenticación de Plugin**, no un id de cliente ni un secreto en `openclaw.json`.

    Pasos:

    1. Instala Gemini CLI localmente para que `gemini` esté en `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Habilita el Plugin: `openclaw plugins enable google`
    3. Inicia sesión: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modelo predeterminado tras iniciar sesión: `google-gemini-cli/gemini-3-flash-preview`
    5. Si las solicitudes fallan, configura `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host del Gateway

    Esto almacena los tokens OAuth en perfiles de autenticación en el host del Gateway. Detalles: [Proveedores de modelos](/es/concepts/model-providers).

  </Accordion>

  <Accordion title="¿Un modelo local sirve para chats casuales?">
    Normalmente no. OpenClaw necesita un contexto grande y una seguridad sólida; las tarjetas pequeñas truncan y filtran. Si debes hacerlo, ejecuta localmente la compilación de modelo **más grande** que puedas (LM Studio) y consulta [/gateway/local-models](/es/gateway/local-models). Los modelos más pequeños/cuantizados aumentan el riesgo de inyección de prompts; consulta [Seguridad](/es/gateway/security).
  </Accordion>

  <Accordion title="¿Cómo mantengo el tráfico de modelos alojados en una región específica?">
    Elige endpoints fijados a una región. OpenRouter expone opciones alojadas en EE. UU. para MiniMax, Kimi y GLM; elige la variante alojada en EE. UU. para mantener los datos en la región. Aun así puedes listar Anthropic/OpenAI junto a estos usando `models.mode: "merge"` para que los modelos alternativos sigan disponibles mientras se respeta el proveedor regional que selecciones.
  </Accordion>

  <Accordion title="¿Tengo que comprar un Mac Mini para instalar esto?">
    No. OpenClaw se ejecuta en macOS o Linux (Windows mediante WSL2). Un Mac mini es opcional: algunas personas
    compran uno como host siempre encendido, pero un VPS pequeño, un servidor doméstico o una máquina de clase Raspberry Pi también funcionan.

    Solo necesitas un Mac **para herramientas exclusivas de macOS**. Para iMessage, usa [BlueBubbles](/es/channels/bluebubbles) (recomendado): el servidor BlueBubbles se ejecuta en cualquier Mac, y el Gateway puede ejecutarse en Linux o en otro lugar. Si quieres otras herramientas exclusivas de macOS, ejecuta el Gateway en un Mac o empareja un Node macOS.

    Documentación: [BlueBubbles](/es/channels/bluebubbles), [Nodes](/es/nodes), [Modo remoto de Mac](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Necesito un Mac mini para admitir iMessage?">
    Necesitas **algún dispositivo macOS** con sesión iniciada en Mensajes. **No** tiene que ser un Mac mini:
    cualquier Mac sirve. **Usa [BlueBubbles](/es/channels/bluebubbles)** (recomendado) para iMessage: el servidor BlueBubbles se ejecuta en macOS, mientras que el Gateway puede ejecutarse en Linux o en otro lugar.

    Configuraciones comunes:

    - Ejecuta el Gateway en Linux/VPS y ejecuta el servidor BlueBubbles en cualquier Mac con sesión iniciada en Mensajes.
    - Ejecuta todo en el Mac si quieres la configuración más simple en una sola máquina.

    Documentación: [BlueBubbles](/es/channels/bluebubbles), [Nodes](/es/nodes),
    [Modo remoto de Mac](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si compro un Mac mini para ejecutar OpenClaw, ¿puedo conectarlo a mi MacBook Pro?">
    Sí. El **Mac mini puede ejecutar el Gateway**, y tu MacBook Pro puede conectarse como un
    **Node** (dispositivo complementario). Los Nodes no ejecutan el Gateway: proporcionan capacidades
    adicionales como pantalla/cámara/lienzo y `system.run` en ese dispositivo.

    Patrón común:

    - Gateway en el Mac mini (siempre encendido).
    - MacBook Pro ejecuta la aplicación macOS o un host Node y se empareja con el Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` para verlo.

    Documentación: [Nodes](/es/nodes), [CLI de Nodes](/es/cli/nodes).

  </Accordion>

  <Accordion title="¿Puedo usar Bun?">
    Bun **no se recomienda**. Vemos errores de runtime, especialmente con WhatsApp y Telegram.
    Usa **Node** para gateways estables.

    Si aun así quieres experimentar con Bun, hazlo en un gateway que no sea de producción
    y sin WhatsApp/Telegram.

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

  <Accordion title="¿Pueden varias personas usar un número de WhatsApp con distintas instancias de OpenClaw?">
    Sí, mediante **enrutamiento multiagente**. Vincula el **DM** de WhatsApp de cada remitente (peer `kind: "direct"`, remitente E.164 como `+15551234567`) a un `agentId` distinto, para que cada persona tenga su propio espacio de trabajo y almacén de sesiones. Las respuestas siguen saliendo de la **misma cuenta de WhatsApp**, y el control de acceso de DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) es global por cuenta de WhatsApp. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent) y [WhatsApp](/es/channels/whatsapp).
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

    Si ejecutas OpenClaw mediante systemd, asegúrate de que el PATH del servicio incluya `/home/linuxbrew/.linuxbrew/bin` (o tu prefijo de brew) para que las herramientas instaladas con `brew` se resuelvan en shells no interactivos.
    Las compilaciones recientes también anteponen directorios bin de usuario comunes en servicios systemd de Linux (por ejemplo `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) y respetan `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` y `FNM_DIR` cuando están configuradas.

  </Accordion>

  <Accordion title="Diferencia entre la instalación git modificable y la instalación npm">
    - **Instalación modificable (git):** checkout completo del código fuente, editable, ideal para colaboradores.
      Ejecutas compilaciones localmente y puedes parchear código/documentación.
    - **Instalación npm:** instalación global de CLI, sin repositorio, ideal para "solo ejecutarlo".
      Las actualizaciones vienen de dist-tags de npm.

    Documentación: [Primeros pasos](/es/start/getting-started), [Actualización](/es/install/updating).

  </Accordion>

  <Accordion title="¿Puedo cambiar entre instalaciones npm y git más adelante?">
    Sí. Usa `openclaw update --channel ...` cuando OpenClaw ya esté instalado.
    Esto **no elimina tus datos**: solo cambia la instalación del código de OpenClaw.
    Tu estado (`~/.openclaw`) y espacio de trabajo (`~/.openclaw/workspace`) permanecen intactos.

    De npm a git:

    ```bash
    openclaw update --channel dev
    ```

    De git a npm:

    ```bash
    openclaw update --channel stable
    ```

    Añade `--dry-run` para previsualizar primero el cambio de modo previsto. El actualizador ejecuta
    seguimientos de Doctor, actualiza las fuentes de Plugins para el canal de destino y
    reinicia el gateway salvo que pases `--no-restart`.

    El instalador también puede forzar cualquiera de los modos:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Consejos de copia de seguridad: consulta [Estrategia de copia de seguridad](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="¿Debería ejecutar el Gateway en mi portátil o en un VPS?">
    Respuesta breve: **si quieres fiabilidad 24/7, usa un VPS**. Si quieres la
    menor fricción y te parece bien que haya suspensión/reinicios, ejecútalo localmente.

    **Portátil (Gateway local)**

    - **Ventajas:** sin coste de servidor, acceso directo a archivos locales, ventana de navegador en vivo.
    - **Desventajas:** suspensión/caídas de red = desconexiones, actualizaciones/reinicios del SO interrumpen, debe permanecer despierto.

    **VPS / nube**

    - **Ventajas:** siempre activo, red estable, sin problemas de suspensión del portátil, más fácil de mantener en ejecución.
    - **Desventajas:** suele ejecutarse sin interfaz gráfica (usa capturas de pantalla), solo acceso remoto a archivos, debes usar SSH para las actualizaciones.

    **Nota específica de OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funcionan bien desde un VPS. La única diferencia real es **navegador sin interfaz gráfica** frente a una ventana visible. Consulta [Navegador](/es/tools/browser).

    **Valor predeterminado recomendado:** VPS si antes tuviste desconexiones del Gateway. Local es excelente cuando usas activamente la Mac y quieres acceso a archivos locales o automatización de UI con un navegador visible.

  </Accordion>

  <Accordion title="¿Qué tan importante es ejecutar OpenClaw en una máquina dedicada?">
    No es obligatorio, pero se **recomienda para mayor fiabilidad y aislamiento**.

    - **Host dedicado (VPS/Mac mini/Pi):** siempre activo, menos interrupciones por suspensión o reinicio, permisos más limpios, más fácil de mantener en ejecución.
    - **Portátil/escritorio compartido:** totalmente válido para pruebas y uso activo, pero espera pausas cuando la máquina entre en suspensión o se actualice.

    Si quieres lo mejor de ambos mundos, mantén el Gateway en un host dedicado y empareja tu portátil como un **Node** para herramientas locales de pantalla/cámara/exec. Consulta [Nodes](/es/nodes).
    Para orientación de seguridad, lee [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Cuáles son los requisitos mínimos para un VPS y el sistema operativo recomendado?">
    OpenClaw es ligero. Para un Gateway básico + un canal de chat:

    - **Mínimo absoluto:** 1 vCPU, 1 GB de RAM, ~500 MB de disco.
    - **Recomendado:** 1-2 vCPU, 2 GB de RAM o más para margen adicional (registros, medios, varios canales). Las herramientas de Node y la automatización del navegador pueden consumir muchos recursos.

    SO: usa **Ubuntu LTS** (o cualquier Debian/Ubuntu moderno). La ruta de instalación en Linux está mejor probada allí.

    Documentación: [Linux](/es/platforms/linux), [alojamiento VPS](/es/vps).

  </Accordion>

  <Accordion title="¿Puedo ejecutar OpenClaw en una VM y cuáles son los requisitos?">
    Sí. Trata una VM igual que un VPS: debe estar siempre encendida, ser accesible y tener suficiente
    RAM para el Gateway y cualquier canal que actives.

    Guía básica:

    - **Mínimo absoluto:** 1 vCPU, 1 GB de RAM.
    - **Recomendado:** 2 GB de RAM o más si ejecutas varios canales, automatización del navegador o herramientas de medios.
    - **SO:** Ubuntu LTS u otro Debian/Ubuntu moderno.

    Si estás en Windows, **WSL2 es la configuración de estilo VM más sencilla** y tiene la mejor compatibilidad
    con herramientas. Consulta [Windows](/es/platforms/windows), [alojamiento VPS](/es/vps).
    Si ejecutas macOS en una VM, consulta [VM de macOS](/es/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Relacionado

- [FAQ](/es/help/faq) — la FAQ principal (modelos, sesiones, Gateway, seguridad y más)
- [Resumen de instalación](/es/install)
- [Primeros pasos](/es/start/getting-started)
- [Solución de problemas](/es/help/troubleshooting)
