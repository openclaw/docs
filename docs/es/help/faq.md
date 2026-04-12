---
read_when:
    - Responder preguntas frecuentes de soporte sobre instalación, configuración inicial o tiempo de ejecución
    - Clasificar problemas reportados por usuarios antes de una depuración más profunda
summary: Preguntas frecuentes sobre la instalación, la configuración y el uso de OpenClaw
title: Preguntas frecuentes
x-i18n:
    generated_at: "2026-04-12T23:28:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: d2a78d0fea9596625cc2753e6dc8cc42c2379a3a0c91729265eee0261fe53eaa
    source_path: help/faq.md
    workflow: 15
---

# Preguntas frecuentes

Respuestas rápidas más una solución de problemas más profunda para configuraciones del mundo real (desarrollo local, VPS, multi-agent, OAuth/claves de API, failover de modelos). Para diagnósticos de tiempo de ejecución, consulta [Solución de problemas](/es/gateway/troubleshooting). Para la referencia completa de configuración, consulta [Configuración](/es/gateway/configuration).

## Los primeros 60 segundos si algo está roto

1. **Estado rápido (primera comprobación)**

   ```bash
   openclaw status
   ```

   Resumen local rápido: SO + actualización, accesibilidad del gateway/servicio, agents/sessions, configuración del proveedor + problemas de tiempo de ejecución (cuando el gateway es accesible).

2. **Informe listo para compartir (seguro para compartir)**

   ```bash
   openclaw status --all
   ```

   Diagnóstico de solo lectura con cola de logs (tokens redactados).

3. **Estado del daemon + puerto**

   ```bash
   openclaw gateway status
   ```

   Muestra el tiempo de ejecución del supervisor frente a la accesibilidad RPC, la URL objetivo del probe y qué configuración probablemente usó el servicio.

4. **Probes profundos**

   ```bash
   openclaw status --deep
   ```

   Ejecuta un probe activo del estado del gateway, incluidos probes de canales cuando están soportados
   (requiere un gateway accesible). Consulta [Health](/es/gateway/health).

5. **Seguir el log más reciente**

   ```bash
   openclaw logs --follow
   ```

   Si RPC está caído, usa como alternativa:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Los logs de archivos son independientes de los logs del servicio; consulta [Logging](/es/logging) y [Solución de problemas](/es/gateway/troubleshooting).

6. **Ejecutar doctor (reparaciones)**

   ```bash
   openclaw doctor
   ```

   Repara/migra configuración/estado + ejecuta comprobaciones de salud. Consulta [Doctor](/es/gateway/doctor).

7. **Instantánea del Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # muestra la URL objetivo + la ruta de configuración en caso de errores
   ```

   Solicita al gateway en ejecución una instantánea completa (solo WS). Consulta [Health](/es/gateway/health).

## Inicio rápido y configuración de la primera ejecución

<AccordionGroup>
  <Accordion title="Estoy atascado, la forma más rápida de salir del atasco">
    Usa un agente de IA local que pueda **ver tu máquina**. Eso es mucho más eficaz que preguntar
    en Discord, porque la mayoría de los casos de "estoy atascado" son **problemas locales de configuración o de entorno**
    que los ayudantes remotos no pueden inspeccionar.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Estas herramientas pueden leer el repositorio, ejecutar comandos, inspeccionar logs y ayudar a arreglar la
    configuración a nivel de máquina (PATH, servicios, permisos, archivos de autenticación). Dales el **checkout completo del código fuente** mediante
    la instalación hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Esto instala OpenClaw **desde un checkout de git**, para que el agente pueda leer el código y la documentación y
    razonar sobre la versión exacta que estás ejecutando. Siempre puedes volver a la versión estable más adelante
    volviendo a ejecutar el instalador sin `--install-method git`.

    Consejo: pídele al agente que **planifique y supervise** la solución (paso a paso), y después ejecute solo los
    comandos necesarios. Eso mantiene los cambios pequeños y más fáciles de auditar.

    Si descubres un error real o una solución, por favor abre una incidencia en GitHub o envía un PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Empieza con estos comandos (comparte las salidas cuando pidas ayuda):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Qué hacen:

    - `openclaw status`: instantánea rápida de la salud del gateway/agent + configuración básica.
    - `openclaw models status`: comprueba la autenticación del proveedor + disponibilidad del modelo.
    - `openclaw doctor`: valida y repara problemas comunes de configuración/estado.

    Otras comprobaciones útiles de la CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Bucle rápido de depuración: [Los primeros 60 segundos si algo está roto](#los-primeros-60-segundos-si-algo-está-roto).
    Documentación de instalación: [Install](/es/install), [Flags del instalador](/es/install/installer), [Actualización](/es/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sigue omitiéndose. ¿Qué significan los motivos de omisión?">
    Motivos habituales de omisión de Heartbeat:

    - `quiet-hours`: fuera de la ventana configurada de horas activas
    - `empty-heartbeat-file`: `HEARTBEAT.md` existe pero solo contiene estructura vacía o solo encabezados
    - `no-tasks-due`: el modo de tareas de `HEARTBEAT.md` está activo pero todavía no vence ninguno de los intervalos de tareas
    - `alerts-disabled`: toda la visibilidad de heartbeat está desactivada (`showOk`, `showAlerts` y `useIndicator` están todos desactivados)

    En el modo de tareas, las marcas de tiempo de vencimiento solo se adelantan después de que se complete
    una ejecución real de heartbeat. Las ejecuciones omitidas no marcan las tareas como completadas.

    Documentación: [Heartbeat](/es/gateway/heartbeat), [Automatización y tareas](/es/automation).

  </Accordion>

  <Accordion title="Forma recomendada de instalar y configurar OpenClaw">
    El repositorio recomienda ejecutar desde el código fuente y usar la configuración inicial:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    El asistente también puede compilar automáticamente los recursos de la UI. Después de la configuración inicial, normalmente ejecutas el Gateway en el puerto **18789**.

    Desde el código fuente (colaboradores/desarrollo):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # instala automáticamente las dependencias de la UI en la primera ejecución
    openclaw onboard
    ```

    Si todavía no tienes una instalación global, ejecútalo con `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="¿Cómo abro el panel después de la configuración inicial?">
    El asistente abre tu navegador con una URL limpia del panel (sin token) justo después de la configuración inicial y también imprime el enlace en el resumen. Mantén esa pestaña abierta; si no se abrió, copia y pega la URL impresa en la misma máquina.
  </Accordion>

  <Accordion title="¿Cómo autentico el panel en localhost frente a remoto?">
    **Localhost (misma máquina):**

    - Abre `http://127.0.0.1:18789/`.
    - Si solicita autenticación con secreto compartido, pega el token o la contraseña configurados en la configuración de Control UI.
    - Origen del token: `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
    - Origen de la contraseña: `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Si todavía no hay ningún secreto compartido configurado, genera un token con `openclaw doctor --generate-gateway-token`.

    **No en localhost:**

    - **Tailscale Serve** (recomendado): mantén el bind en loopback, ejecuta `openclaw gateway --tailscale serve`, abre `https://<magicdns>/`. Si `gateway.auth.allowTailscale` es `true`, los encabezados de identidad satisfacen la autenticación de Control UI/WebSocket (sin pegar secreto compartido, asume un host de gateway de confianza); las API HTTP siguen requiriendo autenticación con secreto compartido a menos que uses deliberadamente `none` para private-ingress o autenticación HTTP de trusted-proxy.
      Los intentos concurrentes fallidos de autenticación de Serve desde el mismo cliente se serializan antes de que el limitador de autenticación fallida los registre, por lo que el segundo reintento fallido ya puede mostrar `retry later`.
    - **Bind de tailnet**: ejecuta `openclaw gateway --bind tailnet --token "<token>"` (o configura autenticación por contraseña), abre `http://<tailscale-ip>:18789/`, y luego pega el secreto compartido correspondiente en la configuración del panel.
    - **Proxy inverso con reconocimiento de identidad**: mantén el Gateway detrás de un trusted proxy no loopback, configura `gateway.auth.mode: "trusted-proxy"`, y luego abre la URL del proxy.
    - **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`. La autenticación con secreto compartido sigue aplicándose sobre el túnel; pega el token o la contraseña configurados si se te solicita.

    Consulta [Dashboard](/web/dashboard) y [Superficies web](/web) para los detalles de modos de bind y autenticación.

  </Accordion>

  <Accordion title="¿Por qué hay dos configuraciones de aprobación exec para aprobaciones en el chat?">
    Controlan capas distintas:

    - `approvals.exec`: reenvía solicitudes de aprobación a destinos de chat
    - `channels.<channel>.execApprovals`: hace que ese canal actúe como cliente nativo de aprobación para aprobaciones exec

    La política exec del host sigue siendo la puerta de aprobación real. La configuración de chat solo controla dónde aparecen
    las solicitudes de aprobación y cómo puede responder la gente.

    En la mayoría de las configuraciones **no** necesitas ambas:

    - Si el chat ya admite comandos y respuestas, `/approve` en el mismo chat funciona mediante la ruta compartida.
    - Si un canal nativo compatible puede inferir aprobadores de forma segura, OpenClaw ahora habilita automáticamente aprobaciones nativas DM-first cuando `channels.<channel>.execApprovals.enabled` no está definido o es `"auto"`.
    - Cuando hay tarjetas/botones nativos de aprobación disponibles, esa UI nativa es la ruta principal; el agent solo debe incluir un comando manual `/approve` si el resultado de la herramienta dice que las aprobaciones por chat no están disponibles o si la aprobación manual es la única vía.
    - Usa `approvals.exec` solo cuando las solicitudes también deban reenviarse a otros chats o salas operativas explícitas.
    - Usa `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo cuando quieras explícitamente que las solicitudes de aprobación se publiquen de vuelta en la sala o el tema de origen.
    - Las aprobaciones de plugins son otra cosa aparte: usan `/approve` en el mismo chat por defecto, reenvío opcional con `approvals.plugin`, y solo algunos canales nativos mantienen además el manejo nativo de aprobación de plugins.

    Versión corta: el reenvío es para el enrutamiento, la configuración del cliente nativo es para una UX más rica específica del canal.
    Consulta [Aprobaciones exec](/es/tools/exec-approvals).

  </Accordion>

  <Accordion title="¿Qué runtime necesito?">
    Se requiere Node **>= 22**. Se recomienda `pnpm`. Bun **no se recomienda** para el Gateway.
  </Accordion>

  <Accordion title="¿Funciona en Raspberry Pi?">
    Sí. El Gateway es ligero: la documentación indica que **512MB-1GB de RAM**, **1 núcleo** y aproximadamente **500MB**
    de disco son suficientes para uso personal, y señala que **Raspberry Pi 4 puede ejecutarlo**.

    Si quieres margen adicional (logs, medios, otros servicios), **se recomiendan 2GB**, pero
    no es un mínimo estricto.

    Consejo: un Pi/VPS pequeño puede alojar el Gateway, y puedes emparejar **nodes** en tu portátil/teléfono para
    pantalla/cámara/canvas locales o ejecución de comandos. Consulta [Nodes](/es/nodes).

  </Accordion>

  <Accordion title="¿Algún consejo para instalaciones en Raspberry Pi?">
    Versión corta: funciona, pero espera ciertas asperezas.

    - Usa un SO de **64 bits** y mantén Node >= 22.
    - Prefiere la **instalación hackable (git)** para poder ver logs y actualizar rápidamente.
    - Empieza sin canales/Skills, luego añádelos uno por uno.
    - Si encuentras problemas extraños con binarios, normalmente es un problema de **compatibilidad ARM**.

    Documentación: [Linux](/es/platforms/linux), [Install](/es/install).

  </Accordion>

  <Accordion title="Se queda atascado en wake up my friend / la configuración inicial no termina. ¿Y ahora qué?">
    Esa pantalla depende de que el Gateway sea accesible y esté autenticado. La TUI también envía
    "Wake up, my friend!" automáticamente en la primera apertura. Si ves esa línea **sin respuesta**
    y los tokens siguen en 0, el agent nunca se ejecutó.

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

    Si el Gateway es remoto, asegúrate de que la conexión de túnel/Tailscale esté activa y de que la UI
    apunte al Gateway correcto. Consulta [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Puedo migrar mi configuración a una máquina nueva (Mac mini) sin repetir la configuración inicial?">
    Sí. Copia el **directorio de estado** y el **espacio de trabajo**, luego ejecuta Doctor una vez. Esto
    mantiene tu bot "exactamente igual" (memoria, historial de sesiones, autenticación y estado
    del canal) siempre que copies **ambas** ubicaciones:

    1. Instala OpenClaw en la nueva máquina.
    2. Copia `$OPENCLAW_STATE_DIR` (predeterminado: `~/.openclaw`) desde la máquina antigua.
    3. Copia tu espacio de trabajo (predeterminado: `~/.openclaw/workspace`).
    4. Ejecuta `openclaw doctor` y reinicia el servicio Gateway.

    Eso conserva la configuración, los perfiles de autenticación, las credenciales de WhatsApp, las sesiones y la memoria. Si estás en
    modo remoto, recuerda que el host del gateway es el propietario del almacenamiento de sesiones y del espacio de trabajo.

    **Importante:** si solo haces commit/push de tu espacio de trabajo a GitHub, estás haciendo una copia de seguridad
    de **la memoria + archivos de arranque**, pero **no** del historial de sesiones ni de la autenticación. Esos viven
    en `~/.openclaw/` (por ejemplo `~/.openclaw/agents/<agentId>/sessions/`).

    Relacionado: [Migración](/es/install/migrating), [Dónde están las cosas en disco](#where-things-live-on-disk),
    [Espacio de trabajo del agent](/es/concepts/agent-workspace), [Doctor](/es/gateway/doctor),
    [Modo remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Dónde puedo ver qué hay de nuevo en la versión más reciente?">
    Consulta el changelog de GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Las entradas más recientes están arriba. Si la sección superior está marcada como **Unreleased**, la siguiente
    sección con fecha es la última versión publicada. Las entradas se agrupan en **Highlights**, **Changes** y
    **Fixes** (además de secciones de documentación/u otras cuando hace falta).

  </Accordion>

  <Accordion title="No puedo acceder a docs.openclaw.ai (error SSL)">
    Algunas conexiones de Comcast/Xfinity bloquean incorrectamente `docs.openclaw.ai` mediante Xfinity
    Advanced Security. Desactívalo o añade `docs.openclaw.ai` a la allowlist, y vuelve a intentarlo.
    Ayúdanos a desbloquearlo informándolo aquí: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Si aún no puedes acceder al sitio, la documentación está replicada en GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Diferencia entre stable y beta">
    **Stable** y **beta** son **npm dist-tags**, no líneas de código separadas:

    - `latest` = stable
    - `beta` = compilación temprana para pruebas

    Normalmente, una versión stable llega primero a **beta**, y luego un paso explícito
    de promoción mueve esa misma versión a `latest`. Los maintainers también pueden
    publicar directamente en `latest` cuando hace falta. Por eso beta y stable pueden
    apuntar a la **misma versión** después de la promoción.

    Consulta qué cambió:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Para comandos de instalación en una sola línea y la diferencia entre beta y dev, consulta el acordeón de abajo.

  </Accordion>

  <Accordion title="¿Cómo instalo la versión beta y cuál es la diferencia entre beta y dev?">
    **Beta** es la npm dist-tag `beta` (puede coincidir con `latest` después de la promoción).
    **Dev** es la cabecera móvil de `main` (git); cuando se publica, usa la npm dist-tag `dev`.

    Comandos en una sola línea (macOS/Linux):

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

  <Accordion title="¿Cómo pruebo lo último?">
    Tienes dos opciones:

    1. **Canal dev (checkout de git):**

    ```bash
    openclaw update --channel dev
    ```

    Esto cambia a la rama `main` y actualiza desde el código fuente.

    2. **Instalación hackable (desde el sitio del instalador):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Eso te da un repositorio local que puedes editar y luego actualizar mediante git.

    Si prefieres hacer manualmente un clon limpio, usa:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentación: [Update](/cli/update), [Canales de desarrollo](/es/install/development-channels),
    [Install](/es/install).

  </Accordion>

  <Accordion title="¿Cuánto tardan normalmente la instalación y la configuración inicial?">
    Guía aproximada:

    - **Instalación:** 2-5 minutos
    - **Configuración inicial:** 5-15 minutos según cuántos canales/modelos configures

    Si se queda colgado, usa [Instalador atascado](#quick-start-and-first-run-setup)
    y el bucle rápido de depuración en [Estoy atascado](#quick-start-and-first-run-setup).

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

    Para una instalación hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Equivalente en Windows (PowerShell):

    ```powershell
    # install.ps1 todavía no tiene un flag -Verbose específico.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Más opciones: [Flags del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="La instalación en Windows dice git not found o openclaw no se reconoce">
    Dos problemas comunes en Windows:

    **1) error de npm spawn git / git not found**

    - Instala **Git for Windows** y asegúrate de que `git` esté en tu PATH.
    - Cierra y vuelve a abrir PowerShell, luego vuelve a ejecutar el instalador.

    **2) openclaw no se reconoce después de la instalación**

    - La carpeta global bin de npm no está en tu PATH.
    - Comprueba la ruta:

      ```powershell
      npm config get prefix
      ```

    - Añade ese directorio a tu PATH de usuario (no hace falta el sufijo `\bin` en Windows; en la mayoría de los sistemas es `%AppData%\npm`).
    - Cierra y vuelve a abrir PowerShell después de actualizar PATH.

    Si quieres la configuración más fluida en Windows, usa **WSL2** en lugar de Windows nativo.
    Documentación: [Windows](/es/platforms/windows).

  </Accordion>

  <Accordion title="La salida exec en Windows muestra texto chino dañado: ¿qué debo hacer?">
    Normalmente esto es un desajuste de la página de códigos de la consola en shells nativos de Windows.

    Síntomas:

    - La salida de `system.run`/`exec` muestra caracteres chinos corruptos
    - El mismo comando se ve bien en otro perfil de terminal

    Solución temporal rápida en PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Luego reinicia el Gateway y vuelve a probar tu comando:

    ```powershell
    openclaw gateway restart
    ```

    Si esto sigue reproduciéndose en la última versión de OpenClaw, haz seguimiento/informa en:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentación no respondió mi pregunta. ¿Cómo obtengo una respuesta mejor?">
    Usa la **instalación hackable (git)** para tener localmente todo el código fuente y la documentación, luego pregunta
    a tu bot (o a Claude/Codex) _desde esa carpeta_ para que pueda leer el repositorio y responder con precisión.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Más detalles: [Install](/es/install) y [Flags del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="¿Cómo instalo OpenClaw en Linux?">
    Respuesta corta: sigue la guía de Linux y luego ejecuta la configuración inicial.

    - Ruta rápida de Linux + instalación del servicio: [Linux](/es/platforms/linux).
    - Guía completa: [Primeros pasos](/es/start/getting-started).
    - Instalador + actualizaciones: [Instalación y actualizaciones](/es/install/updating).

  </Accordion>

  <Accordion title="¿Cómo instalo OpenClaw en un VPS?">
    Cualquier VPS Linux funciona. Instálalo en el servidor y luego usa SSH/Tailscale para acceder al Gateway.

    Guías: [exe.dev](/es/install/exe-dev), [Hetzner](/es/install/hetzner), [Fly.io](/es/install/fly).
    Acceso remoto: [Gateway remote](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Dónde están las guías de instalación en la nube/VPS?">
    Tenemos un **centro de hosting** con los proveedores más habituales. Elige uno y sigue la guía:

    - [Hosting VPS](/es/vps) (todos los proveedores en un solo lugar)
    - [Fly.io](/es/install/fly)
    - [Hetzner](/es/install/hetzner)
    - [exe.dev](/es/install/exe-dev)

    Cómo funciona en la nube: el **Gateway se ejecuta en el servidor**, y accedes a él
    desde tu portátil/teléfono mediante la Control UI (o Tailscale/SSH). Tu estado + espacio de trabajo
    viven en el servidor, así que trata el host como la fuente de verdad y haz copias de seguridad.

    Puedes emparejar **nodes** (Mac/iOS/Android/headless) con ese Gateway en la nube para acceder a
    pantalla/cámara/canvas locales o ejecutar comandos en tu portátil mientras mantienes el
    Gateway en la nube.

    Centro: [Plataformas](/es/platforms). Acceso remoto: [Gateway remote](/es/gateway/remote).
    Nodes: [Nodes](/es/nodes), [CLI de Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="¿Puedo pedirle a OpenClaw que se actualice a sí mismo?">
    Respuesta corta: **es posible, pero no se recomienda**. El flujo de actualización puede reiniciar el
    Gateway (lo que corta la sesión activa), puede requerir un checkout de git limpio y
    puede pedir confirmación. Más seguro: ejecuta las actualizaciones desde un shell como operador.

    Usa la CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Si debes automatizarlo desde un agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentación: [Update](/cli/update), [Updating](/es/install/updating).

  </Accordion>

  <Accordion title="¿Qué hace realmente la configuración inicial?">
    `openclaw onboard` es la ruta de configuración recomendada. En **modo local** te guía por:

    - **Configuración de modelo/autenticación** (OAuth del proveedor, claves de API, setup-token de Anthropic, además de opciones de modelos locales como LM Studio)
    - Ubicación del **espacio de trabajo** + archivos de arranque
    - **Configuración del Gateway** (bind/puerto/autenticación/tailscale)
    - **Canales** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, además de plugins de canal incluidos como QQ Bot)
    - **Instalación del daemon** (LaunchAgent en macOS; unidad de usuario systemd en Linux/WSL2)
    - **Comprobaciones de salud** y selección de **Skills**

    También avisa si tu modelo configurado es desconocido o si falta autenticación.

  </Accordion>

  <Accordion title="¿Necesito una suscripción a Claude o OpenAI para ejecutar esto?">
    No. Puedes ejecutar OpenClaw con **claves de API** (Anthropic/OpenAI/otros) o con
    **modelos solo locales** para que tus datos permanezcan en tu dispositivo. Las suscripciones (Claude
    Pro/Max u OpenAI Codex) son formas opcionales de autenticar esos proveedores.

    Para Anthropic en OpenClaw, la división práctica es:

    - **Clave de API de Anthropic**: facturación normal de la API de Anthropic
    - **Autenticación con Claude CLI / suscripción de Claude en OpenClaw**: el personal de Anthropic
      nos dijo que este uso vuelve a estar permitido, y OpenClaw está tratando el uso de `claude -p`
      como autorizado para esta integración salvo que Anthropic publique una nueva
      política

    Para hosts de gateway de larga duración, las claves de API de Anthropic siguen siendo la configuración
    más predecible. OpenAI Codex OAuth está explícitamente soportado para herramientas externas
    como OpenClaw.

    OpenClaw también admite otras opciones alojadas de estilo suscripción, entre ellas
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** y
    **Z.AI / GLM Coding Plan**.

    Documentación: [Anthropic](/es/providers/anthropic), [OpenAI](/es/providers/openai),
    [Qwen Cloud](/es/providers/qwen),
    [MiniMax](/es/providers/minimax), [GLM Models](/es/providers/glm),
    [Modelos locales](/es/gateway/local-models), [Models](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Puedo usar la suscripción Claude Max sin una clave de API?">
    Sí.

    El personal de Anthropic nos dijo que el uso de Claude CLI al estilo de OpenClaw vuelve a estar permitido, así que
    OpenClaw trata la autenticación por suscripción de Claude y el uso de `claude -p` como autorizados
    para esta integración, salvo que Anthropic publique una nueva política. Si quieres
    la configuración del lado del servidor más predecible, usa en su lugar una clave de API de Anthropic.

  </Accordion>

  <Accordion title="¿Soportan autenticación por suscripción de Claude (Claude Pro o Max)?">
    Sí.

    El personal de Anthropic nos dijo que este uso vuelve a estar permitido, así que OpenClaw considera
    la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración
    salvo que Anthropic publique una nueva política.

    El setup-token de Anthropic sigue estando disponible como una ruta de token compatible de OpenClaw, pero OpenClaw ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.
    Para cargas de trabajo de producción o multi-user, la autenticación con clave de API de Anthropic sigue siendo la
    opción más segura y predecible. Si quieres otras opciones alojadas de estilo suscripción
    en OpenClaw, consulta [OpenAI](/es/providers/openai), [Qwen / Model
    Cloud](/es/providers/qwen), [MiniMax](/es/providers/minimax) y [GLM
    Models](/es/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="¿Por qué veo HTTP 429 rate_limit_error de Anthropic?">
Eso significa que tu **cuota/límite de tasa de Anthropic** está agotado para la ventana actual. Si
usas **Claude CLI**, espera a que la ventana se restablezca o mejora tu plan. Si
usas una **clave de API de Anthropic**, revisa la Consola de Anthropic
para ver uso/facturación y aumenta los límites según sea necesario.

    Si el mensaje es específicamente:
    `Extra usage is required for long context requests`, la solicitud está intentando usar
    la beta de contexto de 1M de Anthropic (`context1m: true`). Eso solo funciona cuando tu
    credencial es apta para la facturación de contexto largo (facturación con clave de API o la
    ruta de inicio de sesión de Claude de OpenClaw con Extra Usage habilitado).

    Consejo: configura un **modelo de fallback** para que OpenClaw pueda seguir respondiendo mientras un proveedor esté limitado por tasa.
    Consulta [Models](/cli/models), [OAuth](/es/concepts/oauth) y
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/es/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="¿AWS Bedrock es compatible?">
    Sí. OpenClaw tiene un proveedor incluido de **Amazon Bedrock (Converse)**. Con marcadores de entorno de AWS presentes, OpenClaw puede detectar automáticamente el catálogo de Bedrock de streaming/texto y fusionarlo como un proveedor implícito `amazon-bedrock`; de lo contrario puedes habilitar explícitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` o añadir una entrada manual de proveedor. Consulta [Amazon Bedrock](/es/providers/bedrock) y [Proveedores de modelos](/es/providers/models). Si prefieres un flujo gestionado con clave, un proxy compatible con OpenAI delante de Bedrock sigue siendo una opción válida.
  </Accordion>

  <Accordion title="¿Cómo funciona la autenticación de Codex?">
    OpenClaw soporta **OpenAI Code (Codex)** mediante OAuth (inicio de sesión de ChatGPT). La configuración inicial puede ejecutar el flujo OAuth y establecerá el modelo predeterminado en `openai-codex/gpt-5.4` cuando corresponda. Consulta [Proveedores de modelos](/es/concepts/model-providers) y [Configuración inicial (CLI)](/es/start/wizard).
  </Accordion>

  <Accordion title="¿Por qué ChatGPT GPT-5.4 no desbloquea openai/gpt-5.4 en OpenClaw?">
    OpenClaw trata las dos rutas por separado:

    - `openai-codex/gpt-5.4` = OAuth de ChatGPT/Codex
    - `openai/gpt-5.4` = API directa de OpenAI Platform

    En OpenClaw, el inicio de sesión de ChatGPT/Codex está conectado a la ruta `openai-codex/*`,
    no a la ruta directa `openai/*`. Si quieres la ruta de API directa en
    OpenClaw, establece `OPENAI_API_KEY` (o la configuración equivalente del proveedor OpenAI).
    Si quieres el inicio de sesión de ChatGPT/Codex en OpenClaw, usa `openai-codex/*`.

  </Accordion>

  <Accordion title="¿Por qué los límites de OAuth de Codex pueden diferir de los de ChatGPT web?">
    `openai-codex/*` usa la ruta OAuth de Codex, y sus ventanas de cuota utilizables son
    gestionadas por OpenAI y dependen del plan. En la práctica, esos límites pueden diferir de
    la experiencia del sitio web/aplicación de ChatGPT, incluso cuando ambos están vinculados a la misma cuenta.

    OpenClaw puede mostrar las ventanas de uso/cuota del proveedor actualmente visibles en
    `openclaw models status`, pero no inventa ni normaliza los
    derechos de ChatGPT web en acceso directo a la API. Si quieres la ruta directa de facturación/límites de OpenAI Platform,
    usa `openai/*` con una clave de API.

  </Accordion>

  <Accordion title="¿Soportan autenticación por suscripción de OpenAI (Codex OAuth)?">
    Sí. OpenClaw soporta completamente **OAuth por suscripción de OpenAI Code (Codex)**.
    OpenAI permite explícitamente el uso de OAuth por suscripción en herramientas/flujos externos
    como OpenClaw. La configuración inicial puede ejecutar el flujo OAuth por ti.

    Consulta [OAuth](/es/concepts/oauth), [Proveedores de modelos](/es/concepts/model-providers) y [Configuración inicial (CLI)](/es/start/wizard).

  </Accordion>

  <Accordion title="¿Cómo configuro Gemini CLI OAuth?">
    Gemini CLI usa un **flujo de autenticación de plugin**, no un client id o secret en `openclaw.json`.

    Pasos:

    1. Instala Gemini CLI localmente para que `gemini` esté en `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Habilita el plugin: `openclaw plugins enable google`
    3. Inicia sesión: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modelo predeterminado después del inicio de sesión: `google-gemini-cli/gemini-3-flash-preview`
    5. Si las solicitudes fallan, establece `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host del gateway

    Esto almacena tokens OAuth en perfiles de autenticación en el host del gateway. Detalles: [Proveedores de modelos](/es/concepts/model-providers).

  </Accordion>

  <Accordion title="¿Un modelo local es aceptable para chats casuales?">
    Normalmente no. OpenClaw necesita contexto amplio + seguridad sólida; las tarjetas pequeñas truncan y filtran. Si es imprescindible, ejecuta localmente la compilación del modelo **más grande** que puedas (LM Studio) y consulta [/gateway/local-models](/es/gateway/local-models). Los modelos más pequeños/cuantizados aumentan el riesgo de prompt injection; consulta [Security](/es/gateway/security).
  </Accordion>

  <Accordion title="¿Cómo mantengo el tráfico de modelos alojados en una región específica?">
    Elige endpoints fijados a una región. OpenRouter expone opciones alojadas en EE. UU. para MiniMax, Kimi y GLM; elige la variante alojada en EE. UU. para mantener los datos en esa región. Aun así puedes listar Anthropic/OpenAI junto con estos usando `models.mode: "merge"` para que los fallbacks sigan disponibles mientras respetas el proveedor regionalizado que selecciones.
  </Accordion>

  <Accordion title="¿Tengo que comprar un Mac Mini para instalar esto?">
    No. OpenClaw funciona en macOS o Linux (Windows mediante WSL2). Un Mac mini es opcional; algunas personas
    compran uno como host siempre activo, pero también sirve un VPS pequeño, un servidor doméstico o una máquina tipo Raspberry Pi.

    Solo necesitas un Mac **para herramientas exclusivas de macOS**. Para iMessage, usa [BlueBubbles](/es/channels/bluebubbles) (recomendado): el servidor de BlueBubbles se ejecuta en cualquier Mac, y el Gateway puede ejecutarse en Linux o en otro sitio. Si quieres otras herramientas exclusivas de macOS, ejecuta el Gateway en un Mac o empareja un node de macOS.

    Documentación: [BlueBubbles](/es/channels/bluebubbles), [Nodes](/es/nodes), [Modo remoto en Mac](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Necesito un Mac mini para soporte de iMessage?">
    Necesitas **algún dispositivo macOS** con sesión iniciada en Messages. **No** tiene que ser un Mac mini:
    cualquier Mac sirve. **Usa [BlueBubbles](/es/channels/bluebubbles)** (recomendado) para iMessage: el servidor BlueBubbles se ejecuta en macOS, mientras que el Gateway puede ejecutarse en Linux o en otro lugar.

    Configuraciones habituales:

    - Ejecuta el Gateway en Linux/VPS y el servidor BlueBubbles en cualquier Mac con sesión iniciada en Messages.
    - Ejecuta todo en el Mac si quieres la configuración más simple en una sola máquina.

    Documentación: [BlueBubbles](/es/channels/bluebubbles), [Nodes](/es/nodes),
    [Modo remoto en Mac](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si compro un Mac mini para ejecutar OpenClaw, ¿puedo conectarlo a mi MacBook Pro?">
    Sí. El **Mac mini puede ejecutar el Gateway**, y tu MacBook Pro puede conectarse como
    **node** (dispositivo complementario). Los nodes no ejecutan el Gateway: proporcionan capacidades
    adicionales como pantalla/cámara/canvas y `system.run` en ese dispositivo.

    Patrón habitual:

    - Gateway en el Mac mini (siempre activo).
    - El MacBook Pro ejecuta la app de macOS o un host de node y se empareja con el Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` para verlo.

    Documentación: [Nodes](/es/nodes), [CLI de Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="¿Puedo usar Bun?">
    Bun **no se recomienda**. Vemos errores de tiempo de ejecución, especialmente con WhatsApp y Telegram.
    Usa **Node** para gateways estables.

    Si aun así quieres experimentar con Bun, hazlo en un gateway no productivo
    sin WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ¿qué va en allowFrom?">
    `channels.telegram.allowFrom` es **el ID de usuario de Telegram del remitente humano** (numérico). No es el nombre de usuario del bot.

    La configuración inicial acepta entrada `@username` y la resuelve a un ID numérico, pero la autorización de OpenClaw usa solo IDs numéricos.

    Más seguro (sin bot de terceros):

    - Envía un DM a tu bot, luego ejecuta `openclaw logs --follow` y lee `from.id`.

    API oficial de Bot:

    - Envía un DM a tu bot, luego llama a `https://api.telegram.org/bot<bot_token>/getUpdates` y lee `message.from.id`.

    Terceros (menos privado):

    - Envía un DM a `@userinfobot` o `@getidsbot`.

    Consulta [/channels/telegram](/es/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="¿Pueden varias personas usar un número de WhatsApp con distintas instancias de OpenClaw?">
    Sí, mediante **enrutamiento multi-agent**. Vincula el **DM** de WhatsApp de cada remitente (peer `kind: "direct"`, remitente E.164 como `+15551234567`) a un `agentId` distinto, para que cada persona tenga su propio espacio de trabajo y almacenamiento de sesiones. Las respuestas siguen viniendo de la **misma cuenta de WhatsApp**, y el control de acceso de DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) es global por cuenta de WhatsApp. Consulta [Enrutamiento multi-agent](/es/concepts/multi-agent) y [WhatsApp](/es/channels/whatsapp).
  </Accordion>

  <Accordion title='¿Puedo ejecutar un agent de "chat rápido" y otro de "Opus para programación"?'>
    Sí. Usa enrutamiento multi-agent: da a cada agent su propio modelo predeterminado y luego vincula rutas de entrada (cuenta del proveedor o peers específicos) a cada agent. Hay un ejemplo de configuración en [Enrutamiento multi-agent](/es/concepts/multi-agent). Consulta también [Models](/es/concepts/models) y [Configuration](/es/gateway/configuration).
  </Accordion>

  <Accordion title="¿Homebrew funciona en Linux?">
    Sí. Homebrew soporta Linux (Linuxbrew). Configuración rápida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Si ejecutas OpenClaw mediante systemd, asegúrate de que el PATH del servicio incluya `/home/linuxbrew/.linuxbrew/bin` (o tu prefijo de brew) para que las herramientas instaladas con `brew` se resuelvan en shells sin login.
    Las compilaciones recientes también anteponen directorios bin de usuario comunes en servicios Linux systemd (por ejemplo `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) y respetan `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` y `FNM_DIR` cuando están definidos.

  </Accordion>

  <Accordion title="Diferencia entre la instalación hackable con git y npm install">
    - **Instalación hackable (git):** checkout completo del código fuente, editable, ideal para colaboradores.
      Ejecutas las compilaciones localmente y puedes modificar código/documentación.
    - **npm install:** instalación global de la CLI, sin repositorio, ideal para "simplemente ejecutarlo".
      Las actualizaciones llegan desde las dist-tags de npm.

    Documentación: [Primeros pasos](/es/start/getting-started), [Actualización](/es/install/updating).

  </Accordion>

  <Accordion title="¿Puedo cambiar entre instalaciones con npm y git más adelante?">
    Sí. Instala la otra variante y luego ejecuta Doctor para que el servicio del gateway apunte al nuevo entrypoint.
    Esto **no elimina tus datos**: solo cambia la instalación del código de OpenClaw. Tu estado
    (`~/.openclaw`) y tu espacio de trabajo (`~/.openclaw/workspace`) permanecen intactos.

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

    Doctor detecta un desajuste en el entrypoint del servicio del gateway y ofrece reescribir la configuración del servicio para que coincida con la instalación actual (usa `--repair` en automatización).

    Consejos de copia de seguridad: consulta [Estrategia de copia de seguridad](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="¿Debería ejecutar el Gateway en mi portátil o en un VPS?">
    Respuesta corta: **si quieres fiabilidad 24/7, usa un VPS**. Si quieres la
    menor fricción y te da igual el reposo/los reinicios, ejecútalo localmente.

    **Portátil (Gateway local)**

    - **Ventajas:** sin coste de servidor, acceso directo a archivos locales, ventana del navegador visible en vivo.
    - **Desventajas:** reposo/cortes de red = desconexiones, las actualizaciones/reinicios del SO interrumpen, debe permanecer activo.

    **VPS / nube**

    - **Ventajas:** siempre activo, red estable, sin problemas por el reposo del portátil, más fácil de mantener en ejecución.
    - **Desventajas:** a menudo funciona en modo headless (usa capturas de pantalla), acceso solo remoto a archivos, debes usar SSH para actualizaciones.

    **Nota específica de OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funcionan bien desde un VPS. El único intercambio real es **navegador headless** frente a una ventana visible. Consulta [Browser](/es/tools/browser).

    **Valor predeterminado recomendado:** VPS si antes tuviste desconexiones del gateway. Lo local es ideal cuando estás usando activamente el Mac y quieres acceso a archivos locales o automatización de UI con un navegador visible.

  </Accordion>

  <Accordion title="¿Qué tan importante es ejecutar OpenClaw en una máquina dedicada?">
    No es obligatorio, pero **sí recomendable para fiabilidad y aislamiento**.

    - **Host dedicado (VPS/Mac mini/Pi):** siempre activo, menos interrupciones por reposo/reinicio, permisos más limpios, más fácil de mantener en ejecución.
    - **Portátil/escritorio compartido:** totalmente válido para pruebas y uso activo, pero espera pausas cuando la máquina entre en reposo o se actualice.

    Si quieres lo mejor de ambos mundos, mantén el Gateway en un host dedicado y empareja tu portátil como un **node** para herramientas locales de pantalla/cámara/exec. Consulta [Nodes](/es/nodes).
    Para orientación de seguridad, lee [Security](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Cuáles son los requisitos mínimos para un VPS y el SO recomendado?">
    OpenClaw es ligero. Para un Gateway básico + un canal de chat:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM, ~500MB de disco.
    - **Recomendado:** 1-2 vCPU, 2GB de RAM o más para margen (logs, medios, varios canales). Las herramientas de Node y la automatización del navegador pueden consumir bastantes recursos.

    SO: usa **Ubuntu LTS** (o cualquier Debian/Ubuntu moderno). La ruta de instalación en Linux está mejor probada allí.

    Documentación: [Linux](/es/platforms/linux), [Hosting VPS](/es/vps).

  </Accordion>

  <Accordion title="¿Puedo ejecutar OpenClaw en una VM y cuáles son los requisitos?">
    Sí. Trata una VM igual que un VPS: debe estar siempre activa, ser accesible y tener suficiente
    RAM para el Gateway y cualquier canal que habilites.

    Guía base:

    - **Mínimo absoluto:** 1 vCPU, 1GB de RAM.
    - **Recomendado:** 2GB de RAM o más si ejecutas varios canales, automatización del navegador o herramientas multimedia.
    - **SO:** Ubuntu LTS u otro Debian/Ubuntu moderno.

    Si estás en Windows, **WSL2 es la configuración tipo VM más sencilla** y la que tiene mejor
    compatibilidad de herramientas. Consulta [Windows](/es/platforms/windows), [Hosting VPS](/es/vps).
    Si ejecutas macOS en una VM, consulta [VM de macOS](/es/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ¿Qué es OpenClaw?

<AccordionGroup>
  <Accordion title="¿Qué es OpenClaw, en un párrafo?">
    OpenClaw es un asistente de IA personal que ejecutas en tus propios dispositivos. Responde en las superficies de mensajería que ya usas (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat y plugins de canal incluidos como QQ Bot) y también puede ofrecer voz + un Canvas en vivo en las plataformas compatibles. El **Gateway** es el plano de control siempre activo; el asistente es el producto.
  </Accordion>

  <Accordion title="Propuesta de valor">
    OpenClaw no es "simplemente un wrapper de Claude". Es un **plano de control local-first** que te permite ejecutar un
    asistente capaz en **tu propio hardware**, accesible desde las aplicaciones de chat que ya usas, con
    sesiones con estado, memoria y herramientas, sin ceder el control de tus flujos de trabajo a un
    SaaS alojado.

    Puntos destacados:

    - **Tus dispositivos, tus datos:** ejecuta el Gateway donde quieras (Mac, Linux, VPS) y mantén el
      espacio de trabajo + historial de sesiones en local.
    - **Canales reales, no un sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc.,
      además de voz móvil y Canvas en las plataformas compatibles.
    - **Agnóstico respecto al modelo:** usa Anthropic, OpenAI, MiniMax, OpenRouter, etc., con enrutamiento
      por agent y failover.
    - **Opción solo local:** ejecuta modelos locales para que **todos los datos puedan permanecer en tu dispositivo** si así lo deseas.
    - **Enrutamiento multi-agent:** agents separados por canal, cuenta o tarea, cada uno con su propio
      espacio de trabajo y valores predeterminados.
    - **Open source y hackable:** inspecciónalo, extiéndelo y autoalójalo sin dependencia de proveedor.

    Documentación: [Gateway](/es/gateway), [Channels](/es/channels), [Multi-agent](/es/concepts/multi-agent),
    [Memory](/es/concepts/memory).

  </Accordion>

  <Accordion title="Acabo de configurarlo: ¿qué debería hacer primero?">
    Buenos primeros proyectos:

    - Crear un sitio web (WordPress, Shopify o un sitio estático sencillo).
    - Crear el prototipo de una app móvil (esquema, pantallas, plan de API).
    - Organizar archivos y carpetas (limpieza, nombres, etiquetas).
    - Conectar Gmail y automatizar resúmenes o seguimientos.

    Puede manejar tareas grandes, pero funciona mejor cuando las divides en fases y
    usas subagentes para trabajo en paralelo.

  </Accordion>

  <Accordion title="¿Cuáles son los cinco principales casos de uso cotidianos de OpenClaw?">
    Las ventajas cotidianas suelen ser:

    - **Informes personales:** resúmenes de la bandeja de entrada, el calendario y las noticias que te interesan.
    - **Investigación y redacción:** investigación rápida, resúmenes y primeros borradores para correos o documentos.
    - **Recordatorios y seguimientos:** avisos y listas de verificación impulsados por Cron o Heartbeat.
    - **Automatización del navegador:** rellenar formularios, recopilar datos y repetir tareas web.
    - **Coordinación entre dispositivos:** envía una tarea desde tu teléfono, deja que el Gateway la ejecute en un servidor y recibe el resultado de vuelta en el chat.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ayudar con lead gen, outreach, anuncios y blogs para un SaaS?">
    Sí para **investigación, cualificación y redacción**. Puede analizar sitios, crear listas cortas,
    resumir prospectos y redactar borradores de outreach o texto publicitario.

    Para **outreach o campañas publicitarias**, mantén a una persona en el circuito. Evita el spam, sigue las leyes locales y
    las políticas de la plataforma, y revisa todo antes de enviarlo. El patrón más seguro es dejar que
    OpenClaw redacte y que tú apruebes.

    Documentación: [Security](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Cuáles son las ventajas frente a Claude Code para desarrollo web?">
    OpenClaw es un **asistente personal** y una capa de coordinación, no un sustituto del IDE. Usa
    Claude Code o Codex para el bucle de programación directa más rápido dentro de un repositorio. Usa OpenClaw cuando quieras
    memoria duradera, acceso entre dispositivos y orquestación de herramientas.

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
  <Accordion title="¿Cómo personalizo Skills sin mantener el repositorio sucio?">
    Usa sobrescrituras administradas en lugar de editar la copia del repositorio. Pon tus cambios en `~/.openclaw/skills/<name>/SKILL.md` (o añade una carpeta mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json`). La precedencia es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, por lo que las sobrescrituras administradas siguen teniendo prioridad sobre las Skills incluidas sin tocar git. Si necesitas la Skill instalada globalmente pero visible solo para algunos agents, mantén la copia compartida en `~/.openclaw/skills` y controla la visibilidad con `agents.defaults.skills` y `agents.list[].skills`. Solo las ediciones dignas de incorporarse upstream deberían vivir en el repositorio y salir como PRs.
  </Accordion>

  <Accordion title="¿Puedo cargar Skills desde una carpeta personalizada?">
    Sí. Añade directorios adicionales mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json` (la precedencia más baja). La precedencia predeterminada es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` instala en `./skills` por defecto, que OpenClaw trata como `<workspace>/skills` en la siguiente sesión. Si la Skill solo debe ser visible para ciertos agents, combínalo con `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="¿Cómo puedo usar distintos modelos para diferentes tareas?">
    Hoy, los patrones compatibles son:

    - **Trabajos Cron**: los trabajos aislados pueden establecer una sobrescritura `model` por trabajo.
    - **Subagentes**: enruta tareas a agents separados con distintos modelos predeterminados.
    - **Cambio bajo demanda**: usa `/model` para cambiar el modelo de la sesión actual en cualquier momento.

    Consulta [Trabajos Cron](/es/automation/cron-jobs), [Enrutamiento Multi-Agent](/es/concepts/multi-agent) y [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="El bot se congela mientras realiza trabajo pesado. ¿Cómo descargo eso?">
    Usa **subagentes** para tareas largas o paralelas. Los subagentes se ejecutan en su propia sesión,
    devuelven un resumen y mantienen tu chat principal receptivo.

    Pídele a tu bot que "genere un subagente para esta tarea" o usa `/subagents`.
    Usa `/status` en el chat para ver qué está haciendo ahora mismo el Gateway (y si está ocupado).

    Consejo sobre tokens: tanto las tareas largas como los subagentes consumen tokens. Si el coste es un problema, configura un
    modelo más barato para subagentes mediante `agents.defaults.subagents.model`.

    Documentación: [Subagentes](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Cómo funcionan las sesiones de subagentes vinculadas a hilos en Discord?">
    Usa vinculaciones de hilos. Puedes vincular un hilo de Discord a un subagente o a un objetivo de sesión para que los mensajes de seguimiento en ese hilo permanezcan en esa sesión vinculada.

    Flujo básico:

    - Genera con `sessions_spawn` usando `thread: true` (y opcionalmente `mode: "session"` para seguimiento persistente).
    - O vincula manualmente con `/focus <target>`.
    - Usa `/agents` para inspeccionar el estado de la vinculación.
    - Usa `/session idle <duration|off>` y `/session max-age <duration|off>` para controlar el desenfoque automático.
    - Usa `/unfocus` para desvincular el hilo.

    Configuración necesaria:

    - Valores predeterminados globales: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Sobrescrituras de Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Vinculación automática al generar: establece `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Documentación: [Subagentes](/es/tools/subagents), [Discord](/es/channels/discord), [Referencia de configuración](/es/gateway/configuration-reference), [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagente terminó, pero la actualización de finalización fue al lugar equivocado o nunca se publicó. ¿Qué debería comprobar?">
    Comprueba primero la ruta del solicitante resuelta:

    - La entrega de subagentes en modo finalización prefiere cualquier hilo vinculado o ruta de conversación cuando existe.
    - Si el origen de la finalización solo lleva un canal, OpenClaw recurre a la ruta almacenada de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa aún pueda tener éxito.
    - Si no existe ni una ruta vinculada ni una ruta almacenada utilizable, la entrega directa puede fallar y el resultado recurre en su lugar a la entrega en cola de la sesión en vez de publicarse inmediatamente en el chat.
    - Los destinos no válidos o desactualizados aún pueden forzar el fallback a la cola o el fallo final de la entrega.
    - Si la última respuesta visible del asistente del hijo es exactamente el token silencioso `NO_REPLY` / `no_reply`, o exactamente `ANNOUNCE_SKIP`, OpenClaw suprime intencionadamente el anuncio en vez de publicar un progreso anterior obsoleto.
    - Si el hijo agotó el tiempo de espera después de solo llamadas a herramientas, el anuncio puede condensarlo en un breve resumen de progreso parcial en vez de reproducir la salida bruta de las herramientas.

    Depuración:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Sub-agents](/es/tools/subagents), [Tareas en segundo plano](/es/automation/tasks), [Herramienta de sesión](/es/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o los recordatorios no se ejecutan. ¿Qué debería comprobar?">
    Cron se ejecuta dentro del proceso Gateway. Si el Gateway no se está ejecutando continuamente,
    los trabajos programados no se ejecutarán.

    Lista de comprobación:

    - Confirma que Cron está habilitado (`cron.enabled`) y que `OPENCLAW_SKIP_CRON` no está definido.
    - Comprueba que el Gateway se está ejecutando 24/7 (sin reposo/reinicios).
    - Verifica la configuración de zona horaria del trabajo (`--tz` frente a la zona horaria del host).

    Depuración:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [Automatización y tareas](/es/automation).

  </Accordion>

  <Accordion title="Cron se ejecutó, pero no se envió nada al canal. ¿Por qué?">
    Comprueba primero el modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"` significa que no se espera ningún mensaje externo.
    - La falta de un destino de anuncio (`channel` / `to`) o que sea no válido significa que el ejecutor omitió la entrega saliente.
    - Los fallos de autenticación del canal (`unauthorized`, `Forbidden`) significan que el ejecutor intentó entregar, pero las credenciales lo bloquearon.
    - Un resultado aislado silencioso (`NO_REPLY` / `no_reply` únicamente) se trata como intencionadamente no entregable, por lo que el ejecutor también suprime la entrega de fallback en cola.

    Para trabajos Cron aislados, el ejecutor es el responsable de la entrega final. Se espera
    que el agent devuelva un resumen en texto plano para que el ejecutor lo envíe. `--no-deliver` mantiene
    ese resultado como interno; no permite que el agent envíe directamente con la
    herramienta de mensajes en su lugar.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [Tareas en segundo plano](/es/automation/tasks).

  </Accordion>

  <Accordion title="¿Por qué una ejecución Cron aislada cambió de modelo o reintentó una vez?">
    Normalmente esa es la ruta activa de cambio de modelo, no una programación duplicada.

    Cron aislado puede persistir una cesión de modelo en tiempo de ejecución y reintentar cuando la
    ejecución activa lanza `LiveSessionModelSwitchError`. El reintento mantiene el
    proveedor/modelo cambiado, y si el cambio llevaba una nueva sobrescritura del perfil de autenticación, Cron
    también la persiste antes de reintentar.

    Reglas de selección relacionadas:

    - La sobrescritura de modelo del hook de Gmail gana primero cuando corresponde.
    - Luego `model` por trabajo.
    - Luego cualquier sobrescritura de modelo almacenada de la sesión Cron.
    - Luego la selección normal de modelo predeterminado/del agent.

    El bucle de reintento es limitado. Tras el intento inicial más 2 reintentos por cambio,
    Cron se aborta en lugar de entrar en un bucle infinito.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [CLI de cron](/cli/cron).

  </Accordion>

  <Accordion title="¿Cómo instalo Skills en Linux?">
    Usa los comandos nativos `openclaw skills` o coloca Skills en tu espacio de trabajo. La UI de Skills de macOS no está disponible en Linux.
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

    La instalación nativa con `openclaw skills install` escribe en el directorio `skills/`
    del espacio de trabajo activo. Instala la CLI separada `clawhub` solo si quieres publicar o
    sincronizar tus propias Skills. Para instalaciones compartidas entre agents, coloca la Skill en
    `~/.openclaw/skills` y usa `agents.defaults.skills` o
    `agents.list[].skills` si quieres limitar qué agents pueden verla.

  </Accordion>

  <Accordion title="¿Puede OpenClaw ejecutar tareas según una programación o continuamente en segundo plano?">
    Sí. Usa el programador del Gateway:

    - **Trabajos Cron** para tareas programadas o recurrentes (persisten tras reinicios).
    - **Heartbeat** para comprobaciones periódicas de la "sesión principal".
    - **Trabajos aislados** para agents autónomos que publican resúmenes o entregan en chats.

    Documentación: [Trabajos Cron](/es/automation/cron-jobs), [Automatización y tareas](/es/automation),
    [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title="¿Puedo ejecutar Skills exclusivas de Apple macOS desde Linux?">
    No directamente. Las Skills de macOS están controladas por `metadata.openclaw.os` más los binarios requeridos, y las Skills solo aparecen en el prompt del sistema cuando son aptas en el **host Gateway**. En Linux, las Skills exclusivas de `darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) no se cargarán a menos que sobrescribas esa restricción.

    Tienes tres patrones compatibles:

    **Opción A: ejecutar el Gateway en un Mac (lo más sencillo).**
    Ejecuta el Gateway donde existan los binarios de macOS y luego conéctate desde Linux en [modo remoto](#gateway-ports-already-running-and-remote-mode) o mediante Tailscale. Las Skills se cargan normalmente porque el host Gateway es macOS.

    **Opción B: usar un node de macOS (sin SSH).**
    Ejecuta el Gateway en Linux, empareja un node de macOS (app de barra de menús) y configura **Node Run Commands** como "Always Ask" o "Always Allow" en el Mac. OpenClaw puede tratar las Skills exclusivas de macOS como aptas cuando los binarios requeridos existen en el node. El agent ejecuta esas Skills mediante la herramienta `nodes`. Si eliges "Always Ask", aprobar "Always Allow" en el prompt añade ese comando a la allowlist.

    **Opción C: usar proxy de binarios de macOS mediante SSH (avanzado).**
    Mantén el Gateway en Linux, pero haz que los binarios CLI necesarios resuelvan a wrappers SSH que se ejecuten en un Mac. Luego sobrescribe la Skill para permitir Linux y que siga siendo apta.

    1. Crea un wrapper SSH para el binario (ejemplo: `memo` para Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Coloca el wrapper en `PATH` en el host Linux (por ejemplo `~/bin/memo`).
    3. Sobrescribe los metadatos de la Skill (espacio de trabajo o `~/.openclaw/skills`) para permitir Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Inicia una nueva sesión para que se actualice la instantánea de Skills.

  </Accordion>

  <Accordion title="¿Tienen integración con Notion o HeyGen?">
    No incluida de forma nativa hoy.

    Opciones:

    - **Skill / Plugin personalizado:** lo mejor para un acceso fiable a la API (tanto Notion como HeyGen tienen API).
    - **Automatización del navegador:** funciona sin código, pero es más lenta y frágil.

    Si quieres mantener contexto por cliente (flujos de trabajo de agencia), un patrón sencillo es:

    - Una página de Notion por cliente (contexto + preferencias + trabajo activo).
    - Pedir al agent que recupere esa página al inicio de una sesión.

    Si quieres una integración nativa, abre una solicitud de funcionalidad o crea una Skill
    orientada a esas API.

    Instalar Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Las instalaciones nativas van al directorio `skills/` del espacio de trabajo activo. Para Skills compartidas entre agents, colócalas en `~/.openclaw/skills/<name>/SKILL.md`. Si solo algunos agents deben ver una instalación compartida, configura `agents.defaults.skills` o `agents.list[].skills`. Algunas Skills esperan binarios instalados mediante Homebrew; en Linux eso significa Linuxbrew (consulta la entrada de preguntas frecuentes sobre Homebrew en Linux anterior). Consulta [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config) y [ClawHub](/es/tools/clawhub).

  </Accordion>

  <Accordion title="¿Cómo uso mi Chrome ya autenticado con OpenClaw?">
    Usa el perfil de navegador integrado `user`, que se conecta mediante Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Si quieres un nombre personalizado, crea un perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Esta ruta es local al host. Si el Gateway se ejecuta en otro lugar, ejecuta un host de node en la máquina del navegador o usa CDP remoto.

    Límites actuales de `existing-session` / `user`:

    - las acciones están guiadas por ref, no por selectores CSS
    - las subidas requieren `ref` / `inputRef` y actualmente admiten un archivo cada vez
    - `responsebody`, exportación PDF, interceptación de descargas y acciones por lotes siguen necesitando un navegador gestionado o un perfil CDP sin procesar

  </Accordion>
</AccordionGroup>

## Sandboxing y memoria

<AccordionGroup>
  <Accordion title="¿Hay una documentación específica sobre sandboxing?">
    Sí. Consulta [Sandboxing](/es/gateway/sandboxing). Para la configuración específica de Docker (gateway completo en Docker o imágenes de sandbox), consulta [Docker](/es/install/docker).
  </Accordion>

  <Accordion title="Docker parece limitado: ¿cómo habilito las funciones completas?">
    La imagen predeterminada prioriza la seguridad y se ejecuta como el usuario `node`, por lo que no
    incluye paquetes del sistema, Homebrew ni navegadores incluidos. Para una configuración más completa:

    - Haz persistente `/home/node` con `OPENCLAW_HOME_VOLUME` para que las cachés sobrevivan.
    - Incorpora dependencias del sistema en la imagen con `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instala navegadores Playwright mediante la CLI incluida:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Establece `PLAYWRIGHT_BROWSERS_PATH` y asegúrate de que la ruta sea persistente.

    Documentación: [Docker](/es/install/docker), [Browser](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Puedo mantener los DM privados pero hacer que los grupos sean públicos/en sandbox con un solo agent?">
    Sí, si tu tráfico privado son **DM** y tu tráfico público son **grupos**.

    Usa `agents.defaults.sandbox.mode: "non-main"` para que las sesiones de grupo/canal (claves no principales) se ejecuten en Docker, mientras la sesión principal de DM permanece en el host. Luego restringe qué herramientas están disponibles en las sesiones en sandbox mediante `tools.sandbox.tools`.

    Guía de configuración + ejemplo: [Grupos: DM personales + grupos públicos](/es/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referencia clave de configuración: [Configuración del Gateway](/es/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="¿Cómo vinculo una carpeta del host al sandbox?">
    Establece `agents.defaults.sandbox.docker.binds` en `["host:path:mode"]` (por ejemplo, `"/home/user/src:/src:ro"`). Las vinculaciones globales y por agent se fusionan; las vinculaciones por agent se ignoran cuando `scope: "shared"`. Usa `:ro` para cualquier contenido sensible y recuerda que las vinculaciones omiten las barreras del sistema de archivos del sandbox.

    OpenClaw valida los orígenes de bind tanto con la ruta normalizada como con la ruta canónica resuelta a través del ancestro existente más profundo. Eso significa que los escapes mediante un padre con symlink siguen fallando de forma segura incluso cuando el último segmento de la ruta todavía no existe, y las comprobaciones de raíz permitida siguen aplicándose después de la resolución del symlink.

    Consulta [Sandboxing](/es/gateway/sandboxing#custom-bind-mounts) y [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) para ver ejemplos y notas de seguridad.

  </Accordion>

  <Accordion title="¿Cómo funciona la memoria?">
    La memoria de OpenClaw son simplemente archivos Markdown en el espacio de trabajo del agent:

    - Notas diarias en `memory/YYYY-MM-DD.md`
    - Notas curadas a largo plazo en `MEMORY.md` (solo sesiones principales/privadas)

    OpenClaw también ejecuta un **vaciado silencioso de memoria previo a la compactación** para recordarle al modelo
    que escriba notas duraderas antes de la autocompactación. Esto solo se ejecuta cuando el espacio de trabajo
    tiene permisos de escritura (los sandboxes de solo lectura lo omiten). Consulta [Memory](/es/concepts/memory).

  </Accordion>

  <Accordion title="La memoria sigue olvidando cosas. ¿Cómo hago que se quede?">
    Pídele al bot que **escriba el hecho en la memoria**. Las notas a largo plazo van en `MEMORY.md`,
    el contexto a corto plazo va en `memory/YYYY-MM-DD.md`.

    Esta sigue siendo un área que estamos mejorando. Ayuda recordarle al modelo que almacene recuerdos;
    sabrá qué hacer. Si sigue olvidando, verifica que el Gateway esté usando el mismo
    espacio de trabajo en cada ejecución.

    Documentación: [Memory](/es/concepts/memory), [Espacio de trabajo del agent](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿La memoria persiste para siempre? ¿Cuáles son los límites?">
    Los archivos de memoria viven en disco y persisten hasta que los eliminas. El límite es tu
    almacenamiento, no el modelo. El **contexto de sesión** sigue estando limitado por la ventana de contexto
    del modelo, así que las conversaciones largas pueden compactarse o truncarse. Por eso
    existe la búsqueda en memoria: recupera solo las partes relevantes al contexto.

    Documentación: [Memory](/es/concepts/memory), [Context](/es/concepts/context).

  </Accordion>

  <Accordion title="¿La búsqueda semántica en memoria requiere una clave de API de OpenAI?">
    Solo si usas **embeddings de OpenAI**. Codex OAuth cubre chat/completions y
    **no** concede acceso a embeddings, así que **iniciar sesión con Codex (OAuth o el
    inicio de sesión de la CLI de Codex)** no ayuda para la búsqueda semántica en memoria. Los embeddings de OpenAI
    siguen necesitando una clave de API real (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Si no estableces explícitamente un proveedor, OpenClaw selecciona automáticamente uno cuando
    puede resolver una clave de API (perfiles de autenticación, `models.providers.*.apiKey` o variables de entorno).
    Prefiere OpenAI si se resuelve una clave de OpenAI; de lo contrario Gemini si se resuelve una clave de Gemini;
    luego Voyage y después Mistral. Si no hay ninguna clave remota disponible, la
    búsqueda en memoria permanece desactivada hasta que la configures. Si tienes una ruta de modelo local
    configurada y presente, OpenClaw
    prefiere `local`. Ollama es compatible cuando estableces explícitamente
    `memorySearch.provider = "ollama"`.

    Si prefieres seguir en local, establece `memorySearch.provider = "local"` (y opcionalmente
    `memorySearch.fallback = "none"`). Si quieres embeddings de Gemini, establece
    `memorySearch.provider = "gemini"` y proporciona `GEMINI_API_KEY` (o
    `memorySearch.remote.apiKey`). Soportamos modelos de embedding de **OpenAI, Gemini, Voyage, Mistral, Ollama o local**;
    consulta [Memory](/es/concepts/memory) para los detalles de configuración.

  </Accordion>
</AccordionGroup>

## Dónde están las cosas en disco

<AccordionGroup>
  <Accordion title="¿Todos los datos usados con OpenClaw se guardan localmente?">
    No: **el estado de OpenClaw es local**, pero **los servicios externos siguen viendo lo que les envías**.

    - **Local por defecto:** las sesiones, archivos de memoria, configuración y espacio de trabajo viven en el host Gateway
      (`~/.openclaw` + tu directorio de espacio de trabajo).
    - **Remoto por necesidad:** los mensajes que envías a proveedores de modelos (Anthropic/OpenAI/etc.) van a
      sus API, y las plataformas de chat (WhatsApp/Telegram/Slack/etc.) almacenan los datos de los mensajes en
      sus servidores.
    - **Tú controlas la huella:** usar modelos locales mantiene los prompts en tu máquina, pero el
      tráfico de canales sigue pasando por los servidores del canal.

    Relacionado: [Espacio de trabajo del agent](/es/concepts/agent-workspace), [Memory](/es/concepts/memory).

  </Accordion>

  <Accordion title="¿Dónde almacena OpenClaw sus datos?">
    Todo vive bajo `$OPENCLAW_STATE_DIR` (valor predeterminado: `~/.openclaw`):

    | Path                                                            | Purpose                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuración principal (JSON5)                                    |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importación heredada de OAuth (copiada a perfiles de autenticación en el primer uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfiles de autenticación (OAuth, claves de API y `keyRef`/`tokenRef` opcionales) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Carga útil opcional de secretos basada en archivos para proveedores `file` de SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Archivo heredado de compatibilidad (entradas estáticas `api_key` depuradas) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Estado del proveedor (por ejemplo `whatsapp/<accountId>/creds.json`) |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Estado por agent (agentDir + sessions)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historial y estado de conversaciones (por agent)                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadatos de sesión (por agent)                                    |

    Ruta heredada de agent único: `~/.openclaw/agent/*` (migrada por `openclaw doctor`).

    Tu **espacio de trabajo** (`AGENTS.md`, archivos de memoria, Skills, etc.) es independiente y se configura mediante `agents.defaults.workspace` (predeterminado: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="¿Dónde deberían vivir AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Estos archivos viven en el **espacio de trabajo del agent**, no en `~/.openclaw`.

    - **Espacio de trabajo (por agent):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (o el fallback heredado `memory.md` cuando `MEMORY.md` no existe),
      `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opcional.
    - **Directorio de estado (`~/.openclaw`)**: configuración, estado de canal/proveedor, perfiles de autenticación, sesiones, logs
      y Skills compartidas (`~/.openclaw/skills`).

    El espacio de trabajo predeterminado es `~/.openclaw/workspace`, configurable mediante:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si el bot "olvida" después de un reinicio, confirma que el Gateway esté usando el mismo
    espacio de trabajo en cada inicio (y recuerda: el modo remoto usa el espacio de trabajo del **host del gateway**,
    no el de tu portátil local).

    Consejo: si quieres un comportamiento o preferencia duraderos, pídele al bot que **lo escriba en
    AGENTS.md o MEMORY.md** en lugar de depender del historial del chat.

    Consulta [Espacio de trabajo del agent](/es/concepts/agent-workspace) y [Memory](/es/concepts/memory).

  </Accordion>

  <Accordion title="Estrategia de copia de seguridad recomendada">
    Pon tu **espacio de trabajo del agent** en un repositorio git **privado** y haz una copia de seguridad en algún lugar
    privado (por ejemplo GitHub privado). Esto captura la memoria + los archivos AGENTS/SOUL/USER
    y te permite restaurar más tarde la "mente" del asistente.

    **No** hagas commit de nada bajo `~/.openclaw` (credenciales, sesiones, tokens o cargas útiles de secretos cifradas).
    Si necesitas una restauración completa, haz copias de seguridad tanto del espacio de trabajo como del directorio de estado
    por separado (consulta la pregunta sobre migración anterior).

    Documentación: [Espacio de trabajo del agent](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="¿Cómo desinstalo OpenClaw por completo?">
    Consulta la guía específica: [Uninstall](/es/install/uninstall).
  </Accordion>

  <Accordion title="¿Pueden los agents trabajar fuera del espacio de trabajo?">
    Sí. El espacio de trabajo es el **cwd predeterminado** y el ancla de memoria, no un sandbox rígido.
    Las rutas relativas se resuelven dentro del espacio de trabajo, pero las rutas absolutas pueden acceder a otras
    ubicaciones del host a menos que el sandboxing esté habilitado. Si necesitas aislamiento, usa
    [`agents.defaults.sandbox`](/es/gateway/sandboxing) o la configuración de sandbox por agent. Si
    quieres que un repositorio sea el directorio de trabajo predeterminado, apunta el
    `workspace` de ese agent a la raíz del repositorio. El repositorio de OpenClaw es solo código fuente; mantén el
    espacio de trabajo separado, salvo que quieras intencionadamente que el agent trabaje dentro de él.

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

  <Accordion title="Modo remoto: ¿dónde está el almacenamiento de sesiones?">
    El estado de las sesiones pertenece al **host del gateway**. Si estás en modo remoto, el almacenamiento de sesiones que te importa está en la máquina remota, no en tu portátil local. Consulta [Gestión de sesiones](/es/concepts/session).
  </Accordion>
</AccordionGroup>

## Conceptos básicos de configuración

<AccordionGroup>
  <Accordion title="¿Qué formato tiene la configuración? ¿Dónde está?">
    OpenClaw lee una configuración opcional en **JSON5** desde `$OPENCLAW_CONFIG_PATH` (predeterminado: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Si el archivo no existe, usa valores predeterminados razonablemente seguros (incluido un espacio de trabajo predeterminado de `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Establecí gateway.bind: "lan" (o "tailnet") y ahora no escucha nada / la UI dice unauthorized'>
    Los bind no loopback **requieren una ruta válida de autenticación del gateway**. En la práctica eso significa:

    - autenticación con secreto compartido: token o contraseña
    - `gateway.auth.mode: "trusted-proxy"` detrás de un proxy inverso con reconocimiento de identidad no loopback configurado correctamente

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

    - `gateway.remote.token` / `.password` **no** habilitan por sí solos la autenticación del gateway local.
    - Las rutas de llamada locales pueden usar `gateway.remote.*` como fallback solo cuando `gateway.auth.*` no está configurado.
    - Para autenticación por contraseña, establece `gateway.auth.mode: "password"` más `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`) en su lugar.
    - Si `gateway.auth.token` / `gateway.auth.password` se configuran explícitamente mediante SecretRef y no se resuelven, la resolución falla de forma segura (sin ocultar el problema mediante fallback remoto).
    - Las configuraciones de Control UI con secreto compartido se autentican mediante `connect.params.auth.token` o `connect.params.auth.password` (almacenados en la configuración de la app/UI). Los modos con identidad, como Tailscale Serve o `trusted-proxy`, usan en su lugar encabezados de solicitud. Evita poner secretos compartidos en URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, los proxies inversos loopback en el mismo host **tampoco** satisfacen la autenticación de trusted-proxy. El trusted proxy debe ser una fuente no loopback configurada.

  </Accordion>

  <Accordion title="¿Por qué ahora necesito un token en localhost?">
    OpenClaw aplica autenticación del gateway por defecto, incluido loopback. En la ruta predeterminada normal eso significa autenticación por token: si no hay una ruta de autenticación explícita configurada, el inicio del gateway se resuelve al modo token y genera uno automáticamente, guardándolo en `gateway.auth.token`, por lo que **los clientes WS locales deben autenticarse**. Esto impide que otros procesos locales llamen al Gateway.

    Si prefieres otra ruta de autenticación, puedes elegir explícitamente el modo contraseña (o, para proxies inversos no loopback con reconocimiento de identidad, `trusted-proxy`). Si **de verdad** quieres loopback abierto, establece explícitamente `gateway.auth.mode: "none"` en tu configuración. Doctor puede generarte un token en cualquier momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="¿Tengo que reiniciar después de cambiar la configuración?">
    El Gateway supervisa la configuración y soporta recarga en caliente:

    - `gateway.reload.mode: "hybrid"` (predeterminado): aplica en caliente los cambios seguros, reinicia para los críticos
    - También se soportan `hot`, `restart` y `off`

  </Accordion>

  <Accordion title="¿Cómo desactivo los lemas divertidos de la CLI?">
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

    - `off`: oculta el texto del lema pero mantiene la línea del título/versión del banner.
    - `default`: usa `All your chats, one OpenClaw.` siempre.
    - `random`: lemas rotativos divertidos/de temporada (comportamiento predeterminado).
    - Si no quieres ningún banner, establece la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="¿Cómo habilito la búsqueda web (y la recuperación web)?">
    `web_fetch` funciona sin clave de API. `web_search` depende del
    proveedor seleccionado:

    - Los proveedores respaldados por API, como Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity y Tavily, requieren su configuración normal de clave de API.
    - Ollama Web Search no requiere clave, pero usa el host de Ollama configurado y requiere `ollama signin`.
    - DuckDuckGo no requiere clave, pero es una integración no oficial basada en HTML.
    - SearXNG no requiere clave/puede autoalojarse; configura `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl`.

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

    La configuración específica del proveedor para la búsqueda web ahora vive en `plugins.entries.<plugin>.config.webSearch.*`.
    Las rutas heredadas de proveedor `tools.web.search.*` siguen cargándose temporalmente por compatibilidad, pero no deberían usarse para configuraciones nuevas.
    La configuración de fallback de recuperación web de Firecrawl vive en `plugins.entries.firecrawl.config.webFetch.*`.

    Notas:

    - Si usas allowlists, añade `web_search`/`web_fetch`/`x_search` o `group:web`.
    - `web_fetch` está habilitado por defecto (a menos que se deshabilite explícitamente).
    - Si se omite `tools.web.fetch.provider`, OpenClaw detecta automáticamente el primer proveedor de fallback de recuperación listo a partir de las credenciales disponibles. Hoy el proveedor incluido es Firecrawl.
    - Los daemons leen variables de entorno desde `~/.openclaw/.env` (o desde el entorno del servicio).

    Documentación: [Herramientas web](/es/tools/web).

  </Accordion>

  <Accordion title="config.apply borró mi configuración. ¿Cómo la recupero y cómo evito que vuelva a ocurrir?">
    `config.apply` sustituye la **configuración completa**. Si envías un objeto parcial, se elimina todo
    lo demás.

    Recuperación:

    - Restaura desde una copia de seguridad (git o una copia de `~/.openclaw/openclaw.json`).
    - Si no tienes copia de seguridad, vuelve a ejecutar `openclaw doctor` y vuelve a configurar canales/modelos.
    - Si esto fue inesperado, abre un bug e incluye tu última configuración conocida o cualquier copia de seguridad.
    - Un agente de programación local a menudo puede reconstruir una configuración funcional a partir de logs o del historial.

    Para evitarlo:

    - Usa `openclaw config set` para cambios pequeños.
    - Usa `openclaw configure` para ediciones interactivas.
    - Usa `config.schema.lookup` primero cuando no tengas claro una ruta exacta o la forma de un campo; devuelve un nodo de esquema superficial más resúmenes inmediatos de los hijos para profundizar.
    - Usa `config.patch` para ediciones RPC parciales; reserva `config.apply` solo para la sustitución completa de la configuración.
    - Si estás usando la herramienta exclusiva para propietarios `gateway` desde una ejecución de agent, seguirá rechazando escrituras en `tools.exec.ask` / `tools.exec.security` (incluidos los alias heredados `tools.bash.*` que se normalizan a las mismas rutas exec protegidas).

    Documentación: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Cómo ejecuto un Gateway central con workers especializados en varios dispositivos?">
    El patrón más habitual es **un Gateway** (por ejemplo, Raspberry Pi) más **nodes** y **agents**:

    - **Gateway (central):** posee canales (Signal/WhatsApp), enrutamiento y sesiones.
    - **Nodes (dispositivos):** Macs/iOS/Android se conectan como periféricos y exponen herramientas locales (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** cerebros/espacios de trabajo separados para roles especiales (por ejemplo, "Hetzner ops", "Datos personales").
    - **Subagentes:** generan trabajo en segundo plano desde un agent principal cuando quieres paralelismo.
    - **TUI:** conéctate al Gateway y cambia de agents/sessions.

    Documentación: [Nodes](/es/nodes), [Acceso remoto](/es/gateway/remote), [Enrutamiento Multi-Agent](/es/concepts/multi-agent), [Sub-agents](/es/tools/subagents), [TUI](/web/tui).

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

    El valor predeterminado es `false` (con interfaz). El modo headless tiene más probabilidades de activar comprobaciones anti-bot en algunos sitios. Consulta [Browser](/es/tools/browser).

    El modo headless usa el **mismo motor Chromium** y funciona para la mayoría de automatizaciones (formularios, clics, scraping, inicios de sesión). Las principales diferencias:

    - No hay ventana visible del navegador (usa capturas de pantalla si necesitas elementos visuales).
    - Algunos sitios son más estrictos con la automatización en modo headless (CAPTCHAs, anti-bot).
      Por ejemplo, X/Twitter a menudo bloquea sesiones headless.

  </Accordion>

  <Accordion title="¿Cómo uso Brave para controlar el navegador?">
    Establece `browser.executablePath` en tu binario de Brave (o cualquier navegador basado en Chromium) y reinicia el Gateway.
    Consulta los ejemplos completos de configuración en [Browser](/es/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

  ## Gateways remotos y nodes

  <AccordionGroup>
  <Accordion title="¿Cómo se propagan los comandos entre Telegram, el gateway y los nodes?">
    Los mensajes de Telegram los gestiona el **gateway**. El gateway ejecuta el agent y
    solo entonces llama a nodes a través del **Gateway WebSocket** cuando se necesita una herramienta de node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Los nodes no ven tráfico entrante del proveedor; solo reciben llamadas RPC de node.

  </Accordion>

  <Accordion title="¿Cómo puede mi agent acceder a mi ordenador si el Gateway está alojado en remoto?">
    Respuesta corta: **empareja tu ordenador como un node**. El Gateway se ejecuta en otro lugar, pero puede
    llamar a herramientas `node.*` (pantalla, cámara, sistema) en tu máquina local a través del Gateway WebSocket.

    Configuración típica:

    1. Ejecuta el Gateway en el host siempre activo (VPS/servidor doméstico).
    2. Pon el host del Gateway y tu ordenador en la misma tailnet.
    3. Asegúrate de que el WS del Gateway sea accesible (bind de tailnet o túnel SSH).
    4. Abre localmente la app de macOS y conéctate en modo **Remote over SSH** (o tailnet directo)
       para que pueda registrarse como un node.
    5. Aprueba el node en el Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    No hace falta ningún puente TCP independiente; los nodes se conectan a través del Gateway WebSocket.

    Recordatorio de seguridad: emparejar un node de macOS permite `system.run` en esa máquina. Empareja
    solo dispositivos de confianza y revisa [Security](/es/gateway/security).

    Documentación: [Nodes](/es/nodes), [Protocolo Gateway](/es/gateway/protocol), [Modo remoto de macOS](/es/platforms/mac/remote), [Security](/es/gateway/security).

  </Accordion>

  <Accordion title="Tailscale está conectado pero no recibo respuestas. ¿Y ahora qué?">
    Comprueba lo básico:

    - El Gateway está en ejecución: `openclaw gateway status`
    - Estado del Gateway: `openclaw status`
    - Estado del canal: `openclaw channels status`

    Después verifica autenticación y enrutamiento:

    - Si usas Tailscale Serve, asegúrate de que `gateway.auth.allowTailscale` esté configurado correctamente.
    - Si te conectas mediante túnel SSH, confirma que el túnel local esté activo y apunte al puerto correcto.
    - Confirma que tus allowlists (DM o grupo) incluyen tu cuenta.

    Documentación: [Tailscale](/es/gateway/tailscale), [Acceso remoto](/es/gateway/remote), [Channels](/es/channels).

  </Accordion>

  <Accordion title="¿Pueden comunicarse entre sí dos instancias de OpenClaw (local + VPS)?">
    Sí. No hay un puente "bot a bot" integrado, pero puedes conectarlo de unas cuantas
    formas fiables:

    **La más sencilla:** usa un canal de chat normal al que ambos bots puedan acceder (Telegram/Slack/WhatsApp).
    Haz que el Bot A envíe un mensaje al Bot B y luego deja que el Bot B responda como de costumbre.

    **Puente de CLI (genérico):** ejecuta un script que llame al otro Gateway con
    `openclaw agent --message ... --deliver`, apuntando a un chat donde el otro bot
    esté escuchando. Si uno de los bots está en un VPS remoto, apunta tu CLI a ese Gateway remoto
    mediante SSH/Tailscale (consulta [Acceso remoto](/es/gateway/remote)).

    Patrón de ejemplo (ejecuta desde una máquina que pueda alcanzar el Gateway de destino):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Consejo: añade una barrera para que los dos bots no entren en un bucle infinito (solo menciones,
    allowlists de canal o una regla de "no responder a mensajes de bots").

    Documentación: [Acceso remoto](/es/gateway/remote), [CLI del agent](/cli/agent), [Envío del agent](/es/tools/agent-send).

  </Accordion>

  <Accordion title="¿Necesito VPS separados para varios agents?">
    No. Un Gateway puede alojar varios agents, cada uno con su propio espacio de trabajo, modelos predeterminados
    y enrutamiento. Esa es la configuración normal y es mucho más barata y sencilla que ejecutar
    un VPS por agent.

    Usa VPS separados solo cuando necesites aislamiento estricto (límites de seguridad) o configuraciones
    muy distintas que no quieras compartir. En caso contrario, mantén un Gateway y
    usa varios agents o subagentes.

  </Accordion>

  <Accordion title="¿Hay alguna ventaja en usar un node en mi portátil personal en lugar de SSH desde un VPS?">
    Sí: los nodes son la forma principal de acceder a tu portátil desde un Gateway remoto y
    ofrecen más que acceso de shell. El Gateway se ejecuta en macOS/Linux (Windows mediante WSL2) y es
    ligero (vale un VPS pequeño o una máquina tipo Raspberry Pi; 4 GB de RAM es de sobra), así que una
    configuración habitual es un host siempre activo más tu portátil como node.

    - **No hace falta SSH entrante.** Los nodes se conectan saliendo al Gateway WebSocket y usan emparejamiento de dispositivos.
    - **Controles de ejecución más seguros.** `system.run` está controlado por allowlists/aprobaciones de node en ese portátil.
    - **Más herramientas de dispositivo.** Los nodes exponen `canvas`, `camera` y `screen` además de `system.run`.
    - **Automatización local del navegador.** Mantén el Gateway en un VPS, pero ejecuta Chrome localmente mediante un host de node en el portátil, o conéctate al Chrome local del host mediante Chrome MCP.

    SSH está bien para acceso puntual al shell, pero los nodes son más sencillos para flujos de trabajo continuos del agent y
    automatización del dispositivo.

    Documentación: [Nodes](/es/nodes), [CLI de Nodes](/cli/nodes), [Browser](/es/tools/browser).

  </Accordion>

  <Accordion title="¿Los nodes ejecutan un servicio de gateway?">
    No. Solo debería ejecutarse **un gateway** por host a menos que ejecutes intencionadamente perfiles aislados (consulta [Multiple gateways](/es/gateway/multiple-gateways)). Los nodes son periféricos que se conectan
    al gateway (nodes de iOS/Android o el "modo node" de macOS en la app de barra de menús). Para hosts de node
    headless y control por CLI, consulta [Node host CLI](/cli/node).

    Se requiere un reinicio completo para cambios en `gateway`, `discovery` y `canvasHost`.

  </Accordion>

  <Accordion title="¿Existe una forma mediante API / RPC de aplicar configuración?">
    Sí.

    - `config.schema.lookup`: inspecciona un subárbol de configuración con su nodo de esquema superficial, pista de UI coincidente y resúmenes inmediatos de hijos antes de escribir
    - `config.get`: obtiene la instantánea actual + hash
    - `config.patch`: actualización parcial segura (preferida para la mayoría de ediciones RPC); recarga en caliente cuando es posible y reinicia cuando es necesario
    - `config.apply`: valida + reemplaza la configuración completa; recarga en caliente cuando es posible y reinicia cuando es necesario
    - La herramienta de tiempo de ejecución `gateway`, exclusiva para propietarios, sigue negándose a reescribir `tools.exec.ask` / `tools.exec.security`; los alias heredados `tools.bash.*` se normalizan a las mismas rutas exec protegidas

  </Accordion>

  <Accordion title="Configuración mínima razonable para una primera instalación">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Esto establece tu espacio de trabajo y restringe quién puede activar el bot.

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
    Serve expone la **Control UI + WS del Gateway**. Los nodes se conectan mediante el mismo endpoint WS del Gateway.

    Configuración recomendada:

    1. **Asegúrate de que el VPS + Mac estén en la misma tailnet**.
    2. **Usa la app de macOS en modo Remote** (el destino SSH puede ser el hostname de tailnet).
       La app tunelizará el puerto del Gateway y se conectará como un node.
    3. **Aprueba el node** en el gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentación: [Protocolo Gateway](/es/gateway/protocol), [Discovery](/es/gateway/discovery), [Modo remoto de macOS](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Debería instalarlo en un segundo portátil o simplemente añadir un node?">
    Si solo necesitas **herramientas locales** (pantalla/cámara/exec) en el segundo portátil, añádelo como
    **node**. Eso mantiene un único Gateway y evita configuración duplicada. Las herramientas locales de node son
    actualmente exclusivas de macOS, pero planeamos extenderlas a otros SO.

    Instala un segundo Gateway solo cuando necesites **aislamiento estricto** o dos bots completamente separados.

    Documentación: [Nodes](/es/nodes), [CLI de Nodes](/cli/nodes), [Multiple gateways](/es/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables de entorno y carga de .env

<AccordionGroup>
  <Accordion title="¿Cómo carga OpenClaw las variables de entorno?">
    OpenClaw lee variables de entorno del proceso padre (shell, launchd/systemd, CI, etc.) y además carga:

    - `.env` del directorio de trabajo actual
    - un `.env` global de fallback desde `~/.openclaw/.env` (también conocido como `$OPENCLAW_STATE_DIR/.env`)

    Ninguno de los archivos `.env` sobrescribe variables de entorno existentes.

    También puedes definir variables de entorno inline en la configuración (aplicadas solo si faltan en el entorno del proceso):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Consulta [/environment](/es/help/environment) para ver toda la precedencia y las fuentes.

  </Accordion>

  <Accordion title="Inicié el Gateway mediante el servicio y desaparecieron mis variables de entorno. ¿Y ahora qué?">
    Dos soluciones habituales:

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

    Esto ejecuta tu shell de login e importa solo las claves esperadas que falten (nunca sobrescribe). Equivalentes por variable de entorno:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Establecí COPILOT_GITHUB_TOKEN, pero models status muestra "Shell env: off." ¿Por qué?'>
    `openclaw models status` informa de si la **importación del entorno del shell** está habilitada. "Shell env: off"
    **no** significa que falten tus variables de entorno; solo significa que OpenClaw no cargará
    automáticamente tu shell de login.

    Si el Gateway se ejecuta como servicio (launchd/systemd), no heredará tu
    entorno de shell. Arréglalo de una de estas formas:

    1. Pon el token en `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. O habilita la importación del shell (`env.shellEnv.enabled: true`).
    3. O añádelo al bloque `env` de tu configuración (solo se aplica si falta).

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
    Las sesiones pueden caducar después de `session.idleMinutes`, pero esto está **deshabilitado por defecto** (valor predeterminado **0**).
    Establécelo en un valor positivo para habilitar la caducidad por inactividad. Cuando está habilitado, el **siguiente**
    mensaje después del periodo de inactividad inicia un ID de sesión nuevo para esa clave de chat.
    Esto no elimina las transcripciones; solo inicia una sesión nueva.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="¿Hay alguna forma de crear un equipo de instancias de OpenClaw (un CEO y muchos agents)?">
    Sí, mediante **enrutamiento multi-agent** y **subagentes**. Puedes crear un agent
    coordinador y varios agents worker con sus propios espacios de trabajo y modelos.

    Dicho esto, es mejor verlo como un **experimento divertido**. Consume muchos tokens y a menudo
    es menos eficiente que usar un solo bot con sesiones separadas. El modelo típico que
    imaginamos es un bot con el que hablas, con diferentes sesiones para trabajo en paralelo. Ese
    bot también puede generar subagentes cuando haga falta.

    Documentación: [Enrutamiento multi-agent](/es/concepts/multi-agent), [Sub-agents](/es/tools/subagents), [CLI de Agents](/cli/agents).

  </Accordion>

  <Accordion title="¿Por qué se truncó el contexto a mitad de una tarea? ¿Cómo lo evito?">
    El contexto de la sesión está limitado por la ventana del modelo. Los chats largos, las salidas grandes de herramientas o muchos
    archivos pueden activar compactación o truncado.

    Qué ayuda:

    - Pídele al bot que resuma el estado actual y lo escriba en un archivo.
    - Usa `/compact` antes de tareas largas y `/new` al cambiar de tema.
    - Mantén el contexto importante en el espacio de trabajo y pídele al bot que lo vuelva a leer.
    - Usa subagentes para trabajo largo o en paralelo para que el chat principal siga siendo más pequeño.
    - Elige un modelo con una ventana de contexto mayor si esto ocurre con frecuencia.

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

    - La configuración inicial también ofrece **Reset** si detecta una configuración existente. Consulta [Configuración inicial (CLI)](/es/start/wizard).
    - Si usaste perfiles (`--profile` / `OPENCLAW_PROFILE`), restablece cada directorio de estado (los predeterminados son `~/.openclaw-<profile>`).
    - Restablecimiento de desarrollo: `openclaw gateway --dev --reset` (solo desarrollo; borra configuración de desarrollo + credenciales + sesiones + espacio de trabajo).

  </Accordion>

  <Accordion title='Recibo errores de "context too large". ¿Cómo restablezco o compacto?'>
    Usa una de estas opciones:

    - **Compactar** (mantiene la conversación pero resume turnos anteriores):

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
    `input` requerido. Normalmente significa que el historial de la sesión está desactualizado o dañado (a menudo después de hilos largos
    o de un cambio de herramienta/esquema).

    Solución: inicia una sesión nueva con `/new` (mensaje independiente).

  </Accordion>

  <Accordion title="¿Por qué recibo mensajes de heartbeat cada 30 minutos?">
    Los Heartbeat se ejecutan cada **30m** por defecto (**1h** al usar autenticación OAuth). Ajústalos o desactívalos:

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
    markdown como `# Heading`), OpenClaw omite la ejecución del heartbeat para ahorrar llamadas a la API.
    Si falta el archivo, el heartbeat sigue ejecutándose y el modelo decide qué hacer.

    Las sobrescrituras por agent usan `agents.list[].heartbeat`. Documentación: [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title='¿Necesito añadir una "cuenta de bot" a un grupo de WhatsApp?'>
    No. OpenClaw se ejecuta en **tu propia cuenta**, así que si estás en el grupo, OpenClaw puede verlo.
    Por defecto, las respuestas en grupos están bloqueadas hasta que permitas remitentes (`groupPolicy: "allowlist"`).

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

    Busca `chatId` (o `from`) terminado en `@g.us`, como:
    `1234567890-1234567890@g.us`.

    Opción 2 (si ya está configurado/en allowlist): lista grupos desde la configuración:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentación: [WhatsApp](/es/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="¿Por qué OpenClaw no responde en un grupo?">
    Dos causas comunes:

    - La restricción por mención está activada (predeterminada). Debes @mencionar al bot (o coincidir con `mentionPatterns`).
    - Configuraste `channels.whatsapp.groups` sin `"*"` y el grupo no está en la allowlist.

    Consulta [Groups](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).

  </Accordion>

  <Accordion title="¿Los grupos/hilos comparten contexto con los DM?">
    Los chats directos colapsan a la sesión principal por defecto. Los grupos/canales tienen sus propias claves de sesión, y los temas de Telegram / hilos de Discord son sesiones separadas. Consulta [Groups](/es/channels/groups) y [Mensajes de grupo](/es/channels/group-messages).
  </Accordion>

  <Accordion title="¿Cuántos espacios de trabajo y agents puedo crear?">
    No hay límites estrictos. Decenas (incluso cientos) están bien, pero vigila:

    - **Crecimiento del disco:** las sesiones + transcripciones viven en `~/.openclaw/agents/<agentId>/sessions/`.
    - **Coste de tokens:** más agents significa más uso concurrente del modelo.
    - **Sobrecarga operativa:** perfiles de autenticación, espacios de trabajo y enrutamiento de canales por agent.

    Consejos:

    - Mantén un espacio de trabajo **activo** por agent (`agents.defaults.workspace`).
    - Poda sesiones antiguas (elimina entradas JSONL o del almacén) si el disco crece.
    - Usa `openclaw doctor` para detectar espacios de trabajo perdidos y desajustes de perfiles.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios bots o chats al mismo tiempo (Slack), y cómo debería configurarlo?">
    Sí. Usa **Enrutamiento Multi-Agent** para ejecutar varios agents aislados y enrutar mensajes entrantes por
    canal/cuenta/peer. Slack está soportado como canal y puede vincularse a agents específicos.

    El acceso al navegador es potente, pero no significa "hacer cualquier cosa que pueda hacer un humano": anti-bot, CAPTCHA y MFA
    todavía pueden bloquear la automatización. Para el control más fiable del navegador, usa Chrome MCP local en el host,
    o usa CDP en la máquina que realmente ejecuta el navegador.

    Configuración recomendada:

    - Host Gateway siempre activo (VPS/Mac mini).
    - Un agent por rol (bindings).
    - Canal(es) de Slack vinculados a esos agents.
    - Navegador local mediante Chrome MCP o un node cuando haga falta.

    Documentación: [Enrutamiento Multi-Agent](/es/concepts/multi-agent), [Slack](/es/channels/slack),
    [Browser](/es/tools/browser), [Nodes](/es/nodes).

  </Accordion>
</AccordionGroup>

## Models: valores predeterminados, selección, alias, cambio

<AccordionGroup>
  <Accordion title='¿Qué es el "modelo predeterminado"?'>
    El modelo predeterminado de OpenClaw es el que estableces como:

    ```
    agents.defaults.model.primary
    ```

    A los modelos se hace referencia como `provider/model` (ejemplo: `openai/gpt-5.4`). Si omites el proveedor, OpenClaw primero intenta un alias, luego una coincidencia única de proveedor configurado para ese id de modelo exacto, y solo entonces recurre al proveedor predeterminado configurado como ruta de compatibilidad obsoleta. Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado. Aun así, deberías establecer **explícitamente** `provider/model`.

  </Accordion>

  <Accordion title="¿Qué modelo recomiendan?">
    **Predeterminado recomendado:** usa el modelo de última generación más potente disponible en tu stack de proveedores.
    **Para agents con herramientas habilitadas o entradas no fiables:** prioriza la capacidad del modelo por encima del coste.
    **Para chat rutinario/de bajo riesgo:** usa modelos de fallback más baratos y enruta por rol de agent.

    MiniMax tiene su propia documentación: [MiniMax](/es/providers/minimax) y
    [Modelos locales](/es/gateway/local-models).

    Regla general: usa el **mejor modelo que puedas permitirte** para trabajo de alto riesgo, y un modelo más barato
    para chat rutinario o resúmenes. Puedes enrutar modelos por agent y usar subagentes para
    paralelizar tareas largas (cada subagente consume tokens). Consulta [Models](/es/concepts/models) y
    [Sub-agents](/es/tools/subagents).

    Advertencia importante: los modelos más débiles o excesivamente cuantizados son más vulnerables a prompt
    injection y comportamientos inseguros. Consulta [Security](/es/gateway/security).

    Más contexto: [Models](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Cómo cambio de modelo sin borrar mi configuración?">
    Usa **comandos de modelo** o edita solo los campos de **modelo**. Evita reemplazos completos de configuración.

    Opciones seguras:

    - `/model` en el chat (rápido, por sesión)
    - `openclaw models set ...` (actualiza solo la configuración del modelo)
    - `openclaw configure --section model` (interactivo)
    - edita `agents.defaults.model` en `~/.openclaw/openclaw.json`

    Evita `config.apply` con un objeto parcial a menos que pretendas reemplazar toda la configuración.
    Para ediciones RPC, primero inspecciona con `config.schema.lookup` y prefiere `config.patch`. La carga útil de lookup te da la ruta normalizada, la documentación/restricciones superficiales del esquema y resúmenes inmediatos de hijos.
    para actualizaciones parciales.
    Si sobrescribiste la configuración, restaura desde una copia de seguridad o vuelve a ejecutar `openclaw doctor` para repararla.

    Documentación: [Models](/es/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="¿Puedo usar modelos autoalojados (llama.cpp, vLLM, Ollama)?">
    Sí. Ollama es la vía más sencilla para modelos locales.

    Configuración más rápida:

    1. Instala Ollama desde `https://ollama.com/download`
    2. Descarga un modelo local, como `ollama pull gemma4`
    3. Si también quieres modelos en la nube, ejecuta `ollama signin`
    4. Ejecuta `openclaw onboard` y elige `Ollama`
    5. Elige `Local` o `Cloud + Local`

    Notas:

    - `Cloud + Local` te da modelos en la nube más tus modelos locales de Ollama
    - los modelos en la nube, como `kimi-k2.5:cloud`, no necesitan una descarga local
    - para cambiar manualmente, usa `openclaw models list` y `openclaw models set ollama/<model>`

    Nota de seguridad: los modelos más pequeños o muy cuantizados son más vulnerables a prompt
    injection. Recomendamos encarecidamente **modelos grandes** para cualquier bot que pueda usar herramientas.
    Si aun así quieres modelos pequeños, habilita sandboxing y allowlists estrictas de herramientas.

    Documentación: [Ollama](/es/providers/ollama), [Modelos locales](/es/gateway/local-models),
    [Proveedores de modelos](/es/concepts/model-providers), [Security](/es/gateway/security),
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

    `/model` (y `/model list`) muestra un selector compacto numerado. Selecciona por número:

    ```
    /model 3
    ```

    También puedes forzar un perfil de autenticación específico para el proveedor (por sesión):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Consejo: `/model status` muestra qué agent está activo, qué archivo `auth-profiles.json` se está usando y qué perfil de autenticación se intentará a continuación.
    También muestra el endpoint configurado del proveedor (`baseUrl`) y el modo de API (`api`) cuando están disponibles.

    **¿Cómo desanclo un perfil que configuré con @profile?**

    Vuelve a ejecutar `/model` **sin** el sufijo `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Si quieres volver al valor predeterminado, selecciónalo desde `/model` (o envía `/model <default provider/model>`).
    Usa `/model status` para confirmar qué perfil de autenticación está activo.

  </Accordion>

  <Accordion title="¿Puedo usar GPT 5.2 para tareas diarias y Codex 5.3 para programación?">
    Sí. Establece uno como predeterminado y cambia según sea necesario:

    - **Cambio rápido (por sesión):** `/model gpt-5.4` para tareas diarias, `/model openai-codex/gpt-5.4` para programar con Codex OAuth.
    - **Predeterminado + cambio:** establece `agents.defaults.model.primary` en `openai/gpt-5.4`, luego cambia a `openai-codex/gpt-5.4` al programar (o al revés).
    - **Subagentes:** enruta tareas de programación a subagentes con un modelo predeterminado distinto.

    Consulta [Models](/es/concepts/models) y [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo configuro el modo fast para GPT 5.4?">
    Usa una alternancia por sesión o un valor predeterminado en la configuración:

    - **Por sesión:** envía `/fast on` mientras la sesión usa `openclaw/gpt-5.4` o `openai-codex/gpt-5.4`.
    - **Predeterminado por modelo:** establece `agents.defaults.models["openai/gpt-5.4"].params.fastMode` en `true`.
    - **También Codex OAuth:** si también usas `openai-codex/gpt-5.4`, establece la misma marca allí.

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

    Para OpenAI, el modo fast se asigna a `service_tier = "priority"` en solicitudes nativas de Responses compatibles. Las sobrescrituras de sesión con `/fast` tienen prioridad sobre los valores predeterminados de configuración.

    Consulta [Thinking y modo fast](/es/tools/thinking) y [Modo fast de OpenAI](/es/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='¿Por qué veo "Model ... is not allowed" y luego no hay respuesta?'>
    Si `agents.defaults.models` está configurado, se convierte en la **allowlist** para `/model` y cualquier
    sobrescritura de sesión. Elegir un modelo que no esté en esa lista devuelve:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ese error se devuelve **en lugar de** una respuesta normal. Solución: añade el modelo a
    `agents.defaults.models`, elimina la allowlist o elige un modelo de `/model list`.

  </Accordion>

  <Accordion title='¿Por qué veo "Unknown model: minimax/MiniMax-M2.7"?'>
    Esto significa que el **proveedor no está configurado** (no se encontró configuración del proveedor MiniMax ni
    perfil de autenticación), por lo que el modelo no puede resolverse.

    Lista de comprobación para solucionarlo:

    1. Actualiza a una versión actual de OpenClaw (o ejecuta desde `main` del código fuente) y luego reinicia el gateway.
    2. Asegúrate de que MiniMax esté configurado (asistente o JSON), o de que exista autenticación de MiniMax
       en el entorno/perfiles de autenticación para que pueda inyectarse el proveedor correspondiente
       (`MINIMAX_API_KEY` para `minimax`, `MINIMAX_OAUTH_TOKEN` o MiniMax
       OAuth almacenado para `minimax-portal`).
    3. Usa el id de modelo exacto (sensible a mayúsculas y minúsculas) para tu ruta de autenticación:
       `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed` para configuración con clave de API,
       o `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` para configuración con OAuth.
    4. Ejecuta:

       ```bash
       openclaw models list
       ```

       y elige de la lista (o `/model list` en el chat).

    Consulta [MiniMax](/es/providers/minimax) y [Models](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Puedo usar MiniMax como predeterminado y OpenAI para tareas complejas?">
    Sí. Usa **MiniMax como predeterminado** y cambia de modelo **por sesión** cuando sea necesario.
    Los fallbacks son para **errores**, no para "tareas difíciles", así que usa `/model` o un agent separado.

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

    Documentación: [Models](/es/concepts/models), [Enrutamiento Multi-Agent](/es/concepts/multi-agent), [MiniMax](/es/providers/minimax), [OpenAI](/es/providers/openai).

  </Accordion>

  <Accordion title="¿Son opus / sonnet / gpt atajos integrados?">
    Sí. OpenClaw incluye algunos atajos predeterminados (solo se aplican cuando el modelo existe en `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Si defines tu propio alias con el mismo nombre, prevalece tu valor.

  </Accordion>

  <Accordion title="¿Cómo defino/sobrescribo atajos de modelo (aliases)?">
    Los aliases provienen de `agents.defaults.models.<modelId>.alias`. Ejemplo:

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

    Luego `/model sonnet` (o `/<alias>` cuando sea compatible) se resuelve a ese id de modelo.

  </Accordion>

  <Accordion title="¿Cómo agrego modelos de otros proveedores como OpenRouter o Z.AI?">
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

    Si haces referencia a un proveedor/modelo pero falta la clave requerida del proveedor, obtendrás un error de autenticación en tiempo de ejecución (por ejemplo, `No API key found for provider "zai"`).

    **No API key found for provider después de añadir un agent nuevo**

    Normalmente esto significa que el **agent nuevo** tiene un almacén de autenticación vacío. La autenticación es por agent y
    se guarda en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opciones para solucionarlo:

    - Ejecuta `openclaw agents add <id>` y configura la autenticación durante el asistente.
    - O copia `auth-profiles.json` desde el `agentDir` del agent principal al `agentDir` del agent nuevo.

    **No** reutilices `agentDir` entre agents; provoca colisiones de autenticación/sesión.

  </Accordion>
</AccordionGroup>

## Failover de modelos y "All models failed"

<AccordionGroup>
  <Accordion title="¿Cómo funciona el failover?">
    El failover se produce en dos etapas:

    1. **Rotación de perfil de autenticación** dentro del mismo proveedor.
    2. **Fallback de modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

    A los perfiles que fallan se les aplican cooldowns (backoff exponencial), por lo que OpenClaw puede seguir respondiendo incluso cuando un proveedor está limitado por tasa o falla temporalmente.

    El bucket de límite de tasa incluye algo más que respuestas `429` simples. OpenClaw
    también trata mensajes como `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` y límites
    periódicos de ventana de uso (`weekly/monthly limit reached`) como
    límites de tasa dignos de failover.

    Algunas respuestas con aspecto de facturación no son `402`, y algunas respuestas HTTP `402`
    también permanecen en ese bucket transitorio. Si un proveedor devuelve
    texto explícito de facturación en `401` o `403`, OpenClaw puede seguir manteniéndolo en
    la vía de facturación, pero los comparadores de texto específicos del proveedor permanecen acotados al
    proveedor que los posee (por ejemplo, OpenRouter `Key limit exceeded`). Si un mensaje `402`
    en cambio parece un límite reintentable de ventana de uso o
    de gasto de organización/espacio de trabajo (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo trata como
    `rate_limit`, no como una desactivación larga por facturación.

    Los errores de desbordamiento de contexto son diferentes: firmas como
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` u `ollama error: context length
    exceeded` permanecen en la vía de compactación/reintento en lugar de avanzar al
    fallback de modelo.

    El texto genérico de error del servidor es deliberadamente más limitado que "cualquier cosa con
    unknown/error". OpenClaw sí trata formas transitorias acotadas al proveedor,
    como Anthropic con `An unknown error occurred` sin más,
    OpenRouter con `Provider returned error` sin más,
    errores de razón de parada como `Unhandled stop reason:
    error`, cargas JSON `api_error` con texto transitorio de servidor
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) y errores de proveedor ocupado como `ModelNotReadyException` como
    señales de timeout/sobrecarga dignas de failover cuando el contexto del proveedor
    coincide.
    El texto interno de fallback genérico como `LLM request failed with an unknown
    error.` sigue siendo conservador y no activa por sí solo el fallback de modelo.

  </Accordion>

  <Accordion title='¿Qué significa "No credentials found for profile anthropic:default"?'>
    Significa que el sistema intentó usar el id de perfil de autenticación `anthropic:default`, pero no pudo encontrar credenciales para él en el almacén de autenticación esperado.

    **Lista de comprobación para solucionarlo:**

    - **Confirma dónde viven los perfiles de autenticación** (rutas nuevas frente a heredadas)
      - Actual: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Heredada: `~/.openclaw/agent/*` (migrada por `openclaw doctor`)
    - **Confirma que la variable de entorno esté cargada por el Gateway**
      - Si estableces `ANTHROPIC_API_KEY` en tu shell pero ejecutas el Gateway mediante systemd/launchd, puede que no la herede. Ponla en `~/.openclaw/.env` o habilita `env.shellEnv`.
    - **Asegúrate de que estás editando el agent correcto**
      - Las configuraciones multi-agent significan que puede haber varios archivos `auth-profiles.json`.
    - **Haz una comprobación básica del estado de modelo/autenticación**
      - Usa `openclaw models status` para ver los modelos configurados y si los proveedores están autenticados.

    **Lista de comprobación para solucionar "No credentials found for profile anthropic"**

    Esto significa que la ejecución está fijada a un perfil de autenticación de Anthropic, pero el Gateway
    no puede encontrarlo en su almacén de autenticación.

    - **Usa Claude CLI**
      - Ejecuta `openclaw models auth login --provider anthropic --method cli --set-default` en el host del gateway.
    - **Si quieres usar una clave de API en su lugar**
      - Pon `ANTHROPIC_API_KEY` en `~/.openclaw/.env` en el **host del gateway**.
      - Borra cualquier orden fijado que fuerce un perfil inexistente:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirma que estás ejecutando comandos en el host del gateway**
      - En modo remoto, los perfiles de autenticación viven en la máquina del gateway, no en tu portátil.

  </Accordion>

  <Accordion title="¿Por qué también intentó Google Gemini y falló?">
    Si tu configuración de modelo incluye Google Gemini como fallback (o cambiaste a un atajo de Gemini), OpenClaw lo intentará durante el fallback de modelo. Si no has configurado credenciales de Google, verás `No API key found for provider "google"`.

    Solución: proporciona autenticación de Google o elimina/evita modelos de Google en `agents.defaults.model.fallbacks` / aliases para que el fallback no vaya allí.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Causa: el historial de la sesión contiene **bloques de thinking sin firmas** (a menudo procedentes de
    un flujo abortado/parcial). Google Antigravity exige firmas para los bloques de thinking.

    Solución: OpenClaw ahora elimina los bloques de thinking sin firma para Google Antigravity Claude. Si sigue apareciendo, inicia una **sesión nueva** o establece `/thinking off` para ese agent.

  </Accordion>
</AccordionGroup>

## Perfiles de autenticación: qué son y cómo gestionarlos

Relacionado: [/concepts/oauth](/es/concepts/oauth) (flujos OAuth, almacenamiento de tokens, patrones multi-account)

<AccordionGroup>
  <Accordion title="¿Qué es un perfil de autenticación?">
    Un perfil de autenticación es un registro de credenciales con nombre (OAuth o clave de API) vinculado a un proveedor. Los perfiles viven en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="¿Cuáles son los IDs de perfil típicos?">
    OpenClaw usa IDs con prefijo del proveedor, como:

    - `anthropic:default` (habitual cuando no existe identidad de correo electrónico)
    - `anthropic:<email>` para identidades OAuth
    - IDs personalizados que elijas (por ejemplo `anthropic:work`)

  </Accordion>

  <Accordion title="¿Puedo controlar qué perfil de autenticación se intenta primero?">
    Sí. La configuración admite metadatos opcionales para perfiles y un orden por proveedor (`auth.order.<provider>`). Esto **no** almacena secretos; asigna IDs a proveedor/modo y establece el orden de rotación.

    OpenClaw puede omitir temporalmente un perfil si está en un **cooldown** corto (límites de tasa/timeouts/fallos de autenticación) o en un estado **disabled** más largo (facturación/créditos insuficientes). Para inspeccionarlo, ejecuta `openclaw models status --json` y revisa `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

    Los cooldowns por límite de tasa pueden estar acotados al modelo. Un perfil que está en cooldown
    para un modelo puede seguir siendo utilizable para un modelo hermano del mismo proveedor,
    mientras que las ventanas de facturación/desactivación siguen bloqueando todo el perfil.

    También puedes establecer una sobrescritura de orden **por agent** (almacenada en `auth-state.json` de ese agent) mediante la CLI:

    ```bash
    # Por defecto, usa el agent predeterminado configurado (omite --agent)
    openclaw models auth order get --provider anthropic

    # Bloquear la rotación a un único perfil (probar solo este)
    openclaw models auth order set --provider anthropic anthropic:default

    # O establecer un orden explícito (fallback dentro del proveedor)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Borrar la sobrescritura (volver a config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Para apuntar a un agent específico:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Para verificar qué se intentará realmente, usa:

    ```bash
    openclaw models status --probe
    ```

    Si un perfil almacenado se omite del orden explícito, el probe informa
    `excluded_by_auth_order` para ese perfil en lugar de probarlo silenciosamente.

  </Accordion>

  <Accordion title="OAuth vs clave de API: ¿cuál es la diferencia?">
    OpenClaw admite ambas opciones:

    - **OAuth** a menudo aprovecha el acceso por suscripción (cuando corresponde).
    - **Las claves de API** usan facturación por token.

    El asistente soporta explícitamente Anthropic Claude CLI, OpenAI Codex OAuth y claves de API.

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
    Porque "running" es la vista del **supervisor** (launchd/systemd/schtasks). El probe RPC es la CLI conectándose realmente al WebSocket del gateway y llamando a `status`.

    Usa `openclaw gateway status` y confía en estas líneas:

    - `Probe target:` (la URL que el probe usó realmente)
    - `Listening:` (lo que realmente está vinculado al puerto)
    - `Last gateway error:` (causa raíz habitual cuando el proceso está vivo pero el puerto no está escuchando)

  </Accordion>

  <Accordion title='¿Por qué openclaw gateway status muestra "Config (cli)" y "Config (service)" diferentes?'>
    Estás editando un archivo de configuración mientras el servicio está ejecutando otro (a menudo por un desajuste de `--profile` / `OPENCLAW_STATE_DIR`).

    Solución:

    ```bash
    openclaw gateway install --force
    ```

    Ejecuta eso desde el mismo `--profile` / entorno que quieres que use el servicio.

  </Accordion>

  <Accordion title='¿Qué significa "another gateway instance is already listening"?'>
    OpenClaw aplica un bloqueo de tiempo de ejecución vinculando el listener WebSocket inmediatamente al iniciar (predeterminado `ws://127.0.0.1:18789`). Si el bind falla con `EADDRINUSE`, lanza `GatewayLockError` indicando que otra instancia ya está escuchando.

    Solución: detén la otra instancia, libera el puerto o ejecuta con `openclaw gateway --port <port>`.

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

    - `openclaw gateway` solo se inicia cuando `gateway.mode` es `local` (o si pasas la bandera de sobrescritura).
    - La app de macOS supervisa el archivo de configuración y cambia de modo en tiempo real cuando esos valores cambian.
    - `gateway.remote.token` / `.password` son solo credenciales remotas del lado del cliente; no habilitan por sí mismas la autenticación del gateway local.

  </Accordion>

  <Accordion title='La Control UI dice "unauthorized" (o sigue reconectándose). ¿Y ahora qué?'>
    Tu ruta de autenticación del gateway y el método de autenticación de la UI no coinciden.

    Datos (según el código):

    - La Control UI guarda el token en `sessionStorage` para la sesión actual de la pestaña del navegador y la URL de gateway seleccionada, por lo que las recargas en la misma pestaña siguen funcionando sin restaurar persistencia de token a largo plazo en localStorage.
    - En `AUTH_TOKEN_MISMATCH`, los clientes de confianza pueden intentar un reintento limitado con un token de dispositivo en caché cuando el gateway devuelve pistas de reintento (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ese reintento con token en caché ahora reutiliza los scopes aprobados en caché almacenados con el token del dispositivo. Los llamadores con `deviceToken` explícito / `scopes` explícitos siguen manteniendo el conjunto de scopes solicitado en lugar de heredar scopes en caché.
    - Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es: token/contraseña compartidos explícitos primero, luego `deviceToken` explícito, luego token de dispositivo almacenado y después token de bootstrap.
    - Las comprobaciones de alcance del token de bootstrap tienen prefijos por rol. La allowlist integrada del operador de bootstrap solo satisface solicitudes de operador; node u otros roles que no sean de operador siguen necesitando scopes bajo el prefijo de su propio rol.

    Solución:

    - La forma más rápida: `openclaw dashboard` (imprime + copia la URL del panel, intenta abrirla; muestra una pista de SSH si está en modo headless).
    - Si todavía no tienes un token: `openclaw doctor --generate-gateway-token`.
    - Si es remoto, primero crea un túnel: `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`.
    - Modo de secreto compartido: establece `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, y luego pega el secreto correspondiente en la configuración de Control UI.
    - Modo Tailscale Serve: asegúrate de que `gateway.auth.allowTailscale` esté habilitado y de que estés abriendo la URL de Serve, no una URL loopback/tailnet sin procesar que omita los encabezados de identidad de Tailscale.
    - Modo trusted-proxy: asegúrate de estar accediendo a través del proxy con reconocimiento de identidad no loopback configurado, no de un proxy loopback en el mismo host ni de una URL del gateway sin procesar.
    - Si el desajuste persiste después del único reintento, rota/vuelve a aprobar el token del dispositivo emparejado:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Si esa llamada de rotación dice que fue denegada, comprueba dos cosas:
      - las sesiones de dispositivos emparejados solo pueden rotar **su propio** dispositivo a menos que también tengan `operator.admin`
      - los valores explícitos de `--scope` no pueden exceder los scopes actuales de operador del llamador
    - ¿Sigues atascado? Ejecuta `openclaw status --all` y sigue [Troubleshooting](/es/gateway/troubleshooting). Consulta [Dashboard](/web/dashboard) para los detalles de autenticación.

  </Accordion>

  <Accordion title="Establecí gateway.bind tailnet, pero no puede hacer bind y nada escucha">
    El bind `tailnet` elige una IP de Tailscale de tus interfaces de red (100.64.0.0/10). Si la máquina no está en Tailscale (o la interfaz está caída), no hay nada a lo que hacer bind.

    Solución:

    - Inicia Tailscale en ese host (para que tenga una dirección 100.x), o
    - Cambia a `gateway.bind: "loopback"` / `"lan"`.

    Nota: `tailnet` es explícito. `auto` prefiere loopback; usa `gateway.bind: "tailnet"` cuando quieras un bind solo de tailnet.

  </Accordion>

  <Accordion title="¿Puedo ejecutar varios Gateways en el mismo host?">
    Normalmente no: un Gateway puede ejecutar varios canales de mensajería y agents. Usa varios Gateways solo cuando necesites redundancia (por ejemplo, un bot de rescate) o aislamiento estricto.

    Sí, pero debes aislar:

    - `OPENCLAW_CONFIG_PATH` (configuración por instancia)
    - `OPENCLAW_STATE_DIR` (estado por instancia)
    - `agents.defaults.workspace` (aislamiento del espacio de trabajo)
    - `gateway.port` (puertos únicos)

    Configuración rápida (recomendada):

    - Usa `openclaw --profile <name> ...` por instancia (crea automáticamente `~/.openclaw-<name>`).
    - Establece un `gateway.port` único en la configuración de cada perfil (o pasa `--port` para ejecuciones manuales).
    - Instala un servicio por perfil: `openclaw --profile <name> gateway install`.

    Los perfiles también añaden sufijos a los nombres de los servicios (`ai.openclaw.<profile>`; heredados `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guía completa: [Multiple gateways](/es/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='¿Qué significa "invalid handshake" / código 1008?'>
    El Gateway es un **servidor WebSocket**, y espera que el primer mensaje sea
    un frame `connect`. Si recibe cualquier otra cosa, cierra la conexión
    con **código 1008** (violación de política).

    Causas comunes:

    - Abriste la URL **HTTP** en un navegador (`http://...`) en lugar de en un cliente WS.
    - Usaste el puerto o la ruta incorrectos.
    - Un proxy o túnel eliminó encabezados de autenticación o envió una solicitud que no era de Gateway.

    Soluciones rápidas:

    1. Usa la URL WS: `ws://<host>:18789` (o `wss://...` si usas HTTPS).
    2. No abras el puerto WS en una pestaña normal del navegador.
    3. Si la autenticación está activa, incluye el token/contraseña en el frame `connect`.

    Si usas la CLI o la TUI, la URL debería tener este aspecto:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Detalles del protocolo: [Protocolo Gateway](/es/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging y depuración

<AccordionGroup>
  <Accordion title="¿Dónde están los logs?">
    Logs de archivo (estructurados):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Puedes establecer una ruta estable mediante `logging.file`. El nivel de log del archivo se controla con `logging.level`. La verbosidad de consola se controla con `--verbose` y `logging.consoleLevel`.

    La forma más rápida de seguir los logs:

    ```bash
    openclaw logs --follow
    ```

    Logs del servicio/supervisor (cuando el gateway se ejecuta mediante launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` y `gateway.err.log` (predeterminado: `~/.openclaw/logs/...`; los perfiles usan `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Consulta [Troubleshooting](/es/gateway/troubleshooting) para más información.

  </Accordion>

  <Accordion title="¿Cómo inicio/detengo/reinicio el servicio Gateway?">
    Usa los helpers de gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Si ejecutas el gateway manualmente, `openclaw gateway --force` puede reclamar el puerto. Consulta [Gateway](/es/gateway).

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

    Documentación: [Windows (WSL2)](/es/platforms/windows), [Manual operativo del servicio Gateway](/es/gateway).

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
    - El emparejamiento/allowlist del canal bloquea respuestas (comprueba la configuración del canal + logs).
    - WebChat/Dashboard está abierto sin el token correcto.

    Si estás en remoto, confirma que la conexión de túnel/Tailscale esté activa y que el
    WebSocket del Gateway sea accesible.

    Documentación: [Channels](/es/channels), [Troubleshooting](/es/gateway/troubleshooting), [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason": ¿y ahora qué?'>
    Normalmente esto significa que la UI perdió la conexión WebSocket. Comprueba:

    1. ¿El Gateway está en ejecución? `openclaw gateway status`
    2. ¿El Gateway está bien? `openclaw status`
    3. ¿La UI tiene el token correcto? `openclaw dashboard`
    4. Si es remoto, ¿el enlace de túnel/Tailscale está activo?

    Luego sigue los logs:

    ```bash
    openclaw logs --follow
    ```

    Documentación: [Dashboard](/web/dashboard), [Acceso remoto](/es/gateway/remote), [Troubleshooting](/es/gateway/troubleshooting).

  </Accordion>

  <Accordion title="setMyCommands de Telegram falla. ¿Qué debería comprobar?">
    Empieza con logs y estado del canal:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Luego relaciona el error:

    - `BOT_COMMANDS_TOO_MUCH`: el menú de Telegram tiene demasiadas entradas. OpenClaw ya recorta hasta el límite de Telegram y reintenta con menos comandos, pero algunas entradas del menú aún deben eliminarse. Reduce comandos de plugins/Skills/personalizados, o deshabilita `channels.telegram.commands.native` si no necesitas el menú.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` o errores de red similares: si estás en un VPS o detrás de un proxy, confirma que HTTPS saliente está permitido y que DNS funciona para `api.telegram.org`.

    Si el Gateway es remoto, asegúrate de estar mirando los logs en el host del Gateway.

    Documentación: [Telegram](/es/channels/telegram), [Solución de problemas de canales](/es/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI no muestra salida. ¿Qué debería comprobar?">
    Primero confirma que el Gateway sea accesible y que el agent pueda ejecutarse:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    En la TUI, usa `/status` para ver el estado actual. Si esperas respuestas en un
    canal de chat, asegúrate de que la entrega esté habilitada (`/deliver on`).

    Documentación: [TUI](/web/tui), [Comandos slash](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="¿Cómo detengo por completo y luego inicio el Gateway?">
    Si instalaste el servicio:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Esto detiene/inicia el **servicio supervisado** (launchd en macOS, systemd en Linux).
    Úsalo cuando el Gateway se ejecute en segundo plano como daemon.

    Si lo estás ejecutando en primer plano, deténlo con Ctrl-C y luego:

    ```bash
    openclaw gateway run
    ```

    Documentación: [Manual operativo del servicio Gateway](/es/gateway).

  </Accordion>

  <Accordion title="Explícamelo fácil: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: reinicia el **servicio en segundo plano** (launchd/systemd).
    - `openclaw gateway`: ejecuta el gateway **en primer plano** para esta sesión de terminal.

    Si instalaste el servicio, usa los comandos de gateway. Usa `openclaw gateway` cuando
    quieras una ejecución puntual en primer plano.

  </Accordion>

  <Accordion title="La forma más rápida de obtener más detalles cuando algo falla">
    Inicia el Gateway con `--verbose` para obtener más detalle en consola. Luego inspecciona el archivo de log para ver autenticación de canales, enrutamiento de modelos y errores RPC.
  </Accordion>
</AccordionGroup>

## Multimedia y archivos adjuntos

<AccordionGroup>
  <Accordion title="Mi Skill generó una imagen/PDF, pero no se envió nada">
    Los archivos adjuntos salientes del agent deben incluir una línea `MEDIA:<path-or-url>` (en su propia línea). Consulta [Configuración del asistente OpenClaw](/es/start/openclaw) y [Envío del agent](/es/tools/agent-send).

    Envío por CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Comprueba también:

    - El canal de destino soporta multimedia saliente y no está bloqueado por allowlists.
    - El archivo está dentro de los límites de tamaño del proveedor (las imágenes se redimensionan hasta un máximo de 2048 px).
    - `tools.fs.workspaceOnly=true` mantiene los envíos de rutas locales limitados al espacio de trabajo, temp/media-store y archivos validados por sandbox.
    - `tools.fs.workspaceOnly=false` permite que `MEDIA:` envíe archivos locales del host que el agent ya puede leer, pero solo para multimedia más tipos de documento seguros (imágenes, audio, vídeo, PDF y documentos de Office). El texto sin formato y los archivos con apariencia de secreto siguen bloqueados.

    Consulta [Imágenes](/es/nodes/images).

  </Accordion>
</AccordionGroup>

## Seguridad y control de acceso

<AccordionGroup>
  <Accordion title="¿Es seguro exponer OpenClaw a DM entrantes?">
    Trata los DM entrantes como entrada no fiable. Los valores predeterminados están diseñados para reducir el riesgo:

    - El comportamiento predeterminado en canales compatibles con DM es el **emparejamiento**:
      - Los remitentes desconocidos reciben un código de emparejamiento; el bot no procesa su mensaje.
      - Apruébalo con: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Las solicitudes pendientes están limitadas a **3 por canal**; comprueba `openclaw pairing list --channel <channel> [--account <id>]` si no llegó un código.
    - Abrir los DM públicamente requiere una activación explícita (`dmPolicy: "open"` y allowlist `"*"`).

    Ejecuta `openclaw doctor` para detectar políticas de DM arriesgadas.

  </Accordion>

  <Accordion title="¿La prompt injection es una preocupación solo para bots públicos?">
    No. La prompt injection tiene que ver con **contenido no fiable**, no solo con quién puede enviar DM al bot.
    Si tu asistente lee contenido externo (búsqueda/recuperación web, páginas del navegador, correos,
    documentos, archivos adjuntos, logs pegados), ese contenido puede incluir instrucciones que intenten
    secuestrar el modelo. Esto puede ocurrir incluso si **tú eres el único remitente**.

    El mayor riesgo aparece cuando hay herramientas habilitadas: se puede engañar al modelo para que
    exfiltre contexto o llame herramientas en tu nombre. Reduce el radio de impacto mediante:

    - usar un agent de "lector" de solo lectura o sin herramientas para resumir contenido no fiable
    - mantener `web_search` / `web_fetch` / `browser` desactivados en agents con herramientas habilitadas
    - tratar también como no fiable el texto decodificado de archivos/documentos: OpenResponses
      `input_file` y la extracción de archivos adjuntos multimedia envuelven ambos el texto extraído en
      marcadores explícitos de límite de contenido externo en lugar de pasar el texto bruto del archivo
    - sandboxing y allowlists estrictas de herramientas

    Detalles: [Security](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Debería mi bot tener su propio correo, cuenta de GitHub o número de teléfono?">
    Sí, en la mayoría de las configuraciones. Aislar el bot con cuentas y números de teléfono separados
    reduce el radio de impacto si algo sale mal. Esto también facilita rotar
    credenciales o revocar acceso sin afectar a tus cuentas personales.

    Empieza poco a poco. Da acceso solo a las herramientas y cuentas que realmente necesites y amplíalo
    más adelante si hace falta.

    Documentación: [Security](/es/gateway/security), [Pairing](/es/channels/pairing).

  </Accordion>

  <Accordion title="¿Puedo darle autonomía sobre mis mensajes de texto y es seguro?">
    **No** recomendamos autonomía total sobre tus mensajes personales. El patrón más seguro es:

    - Mantén los DM en **modo pairing** o con una allowlist estricta.
    - Usa un **número o cuenta independiente** si quieres que envíe mensajes en tu nombre.
    - Deja que redacte y luego **aprueba antes de enviar**.

    Si quieres experimentar, hazlo con una cuenta dedicada y mantenla aislada. Consulta
    [Security](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Puedo usar modelos más baratos para tareas de asistente personal?">
    Sí, **siempre que** el agent sea solo de chat y la entrada sea fiable. Los niveles más pequeños son
    más susceptibles al secuestro de instrucciones, así que evítalos en agents con herramientas habilitadas
    o cuando lean contenido no fiable. Si tienes que usar un modelo más pequeño, restringe
    las herramientas y ejecútalo dentro de un sandbox. Consulta [Security](/es/gateway/security).
  </Accordion>

  <Accordion title="Ejecuté /start en Telegram pero no recibí un código de pairing">
    Los códigos de pairing se envían **solo** cuando un remitente desconocido manda un mensaje al bot y
    `dmPolicy: "pairing"` está habilitado. `/start` por sí solo no genera un código.

    Comprueba las solicitudes pendientes:

    ```bash
    openclaw pairing list telegram
    ```

    Si quieres acceso inmediato, añade tu id de remitente a la allowlist o establece `dmPolicy: "open"`
    para esa cuenta.

  </Accordion>

  <Accordion title="WhatsApp: ¿enviará mensajes a mis contactos? ¿Cómo funciona el pairing?">
    No. La política predeterminada de DM de WhatsApp es **pairing**. Los remitentes desconocidos solo reciben un código de pairing y su mensaje **no se procesa**. OpenClaw solo responde a chats que recibe o a envíos explícitos que tú actives.

    Aprueba el pairing con:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Lista las solicitudes pendientes:

    ```bash
    openclaw pairing list whatsapp
    ```

    La solicitud del asistente para el número de teléfono se usa para establecer tu **allowlist/propietario** y permitir tus propios DM. No se usa para envío automático. Si lo ejecutas con tu número personal de WhatsApp, usa ese número y habilita `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandos de chat, cancelación de tareas y "no se detiene"

<AccordionGroup>
  <Accordion title="¿Cómo evito que se muestren mensajes internos del sistema en el chat?">
    La mayoría de los mensajes internos o de herramientas solo aparecen cuando **verbose**, **trace** o **reasoning** están habilitados
    para esa sesión.

    Solución en el chat donde lo ves:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Si sigue habiendo demasiado ruido, comprueba la configuración de la sesión en la Control UI y establece verbose
    en **inherit**. Confirma también que no estés usando un perfil de bot con `verboseDefault` establecido
    en `on` en la configuración.

    Documentación: [Thinking y verbose](/es/tools/thinking), [Security](/es/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="¿Cómo detengo/cancelo una tarea en ejecución?">
    Envía cualquiera de estos **como mensaje independiente** (sin slash):

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

    Estos son disparadores de cancelación (no comandos slash).

    Para procesos en segundo plano (de la herramienta exec), puedes pedir al agent que ejecute:

    ```
    process action:kill sessionId:XXX
    ```

    Resumen de comandos slash: consulta [Comandos slash](/es/tools/slash-commands).

    La mayoría de los comandos deben enviarse como mensaje **independiente** que comience con `/`, pero algunos atajos (como `/status`) también funcionan en línea para remitentes en allowlist.

  </Accordion>

  <Accordion title='¿Cómo envío un mensaje de Discord desde Telegram? ("Cross-context messaging denied")'>
    OpenClaw bloquea la mensajería **entre proveedores** por defecto. Si una llamada de herramienta está vinculada
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

  <Accordion title='¿Por qué da la impresión de que el bot "ignora" mensajes rápidos consecutivos?'>
    El modo de cola controla cómo interactúan los mensajes nuevos con una ejecución en curso. Usa `/queue` para cambiar de modo:

    - `steer` - los mensajes nuevos redirigen la tarea actual
    - `followup` - ejecuta los mensajes de uno en uno
    - `collect` - agrupa mensajes y responde una vez (predeterminado)
    - `steer-backlog` - redirige ahora y luego procesa la cola pendiente
    - `interrupt` - cancela la ejecución actual y empieza de nuevo

    Puedes añadir opciones como `debounce:2s cap:25 drop:summarize` para modos followup.

  </Accordion>
</AccordionGroup>

## Varios

<AccordionGroup>
  <Accordion title='¿Cuál es el modelo predeterminado para Anthropic con una clave de API?'>
    En OpenClaw, las credenciales y la selección de modelo son independientes. Establecer `ANTHROPIC_API_KEY` (o guardar una clave de API de Anthropic en perfiles de autenticación) habilita la autenticación, pero el modelo predeterminado real es el que configures en `agents.defaults.model.primary` (por ejemplo, `anthropic/claude-sonnet-4-6` o `anthropic/claude-opus-4-6`). Si ves `No credentials found for profile "anthropic:default"`, significa que el Gateway no pudo encontrar credenciales de Anthropic en el `auth-profiles.json` esperado para el agent que se está ejecutando.
  </Accordion>
</AccordionGroup>

---

¿Sigues atascado? Pregunta en [Discord](https://discord.com/invite/clawd) o abre una [discusión de GitHub](https://github.com/openclaw/openclaw/discussions).
