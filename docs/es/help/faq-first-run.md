---
read_when:
    - Nueva instalación, incorporación bloqueada o errores de primera ejecución
    - Elegir suscripciones de autenticación y proveedor
    - No se puede acceder a docs.openclaw.ai, no se puede abrir el panel, la instalación está bloqueada
sidebarTitle: First-run FAQ
summary: 'FAQ: configuración de inicio rápido y primera ejecución — instalación, onboarding, autenticación, suscripciones, fallos iniciales'
title: 'FAQ: configuración del primer uso'
x-i18n:
    generated_at: "2026-07-05T11:23:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89d84968e13ae48ff730e0107363d4d44abc644b9dccf12d05888f1c51ed1ed5
    source_path: help/faq-first-run.md
    workflow: 16
---

  Preguntas y respuestas de inicio rápido y primera ejecución. Para operaciones cotidianas, modelos, autenticación, sesiones
  y solución de problemas, consulta la [FAQ](/es/help/faq) principal.

  ## Inicio rápido y configuración de primera ejecución

  <AccordionGroup>
  <Accordion title="Estoy atascado, la forma más rápida de destrabarme">
    Usa un agente de IA local que pueda **ver tu máquina**. La mayoría de los casos de "estoy atascado" son
    **problemas de configuración local o del entorno** que un ayudante remoto no puede inspeccionar, así que esto supera
    a preguntar en Discord.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Dale al agente el checkout completo del código fuente mediante la instalación hackeable (git) para que pueda leer
    código + documentación y razonar sobre la versión exacta que ejecutas:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Pide al agente que planifique y supervise la corrección paso a paso, y luego ejecuta solo los
    comandos necesarios; los diffs más pequeños son más fáciles de auditar.

    Comparte estas salidas al pedir ayuda (en Discord o en un issue de GitHub):

    | Comando | Muestra |
    | --- | --- |
    | `openclaw status` | Estado del Gateway/agente + instantánea básica de configuración |
    | `openclaw status --all` | Diagnóstico completo de solo lectura, apto para pegar |
    | `openclaw models status` | Autenticación del proveedor + disponibilidad de modelos |
    | `openclaw doctor` | Valida y repara problemas comunes de configuración/estado |
    | `openclaw logs --follow` | Cola de logs en vivo |
    | `openclaw gateway status --deep` | Comprobación profunda de salud de gateway/configuración/plugin |
    | `openclaw health --verbose` | Informe de salud detallado |

    ¿Encontraste un bug real o una corrección? Abre un issue o envía un PR:
    [Issues](https://github.com/openclaw/openclaw/issues) /
    [Pull requests](https://github.com/openclaw/openclaw/pulls).

    Bucle rápido de depuración: [Primeros 60 segundos si algo está roto](/es/help/faq#first-60-seconds-if-something-is-broken).
    Documentación de instalación: [Instalar](/es/install), [Flags del instalador](/es/install/installer), [Actualizar](/es/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sigue omitiéndose. ¿Qué significan los motivos de omisión?">
    | Motivo de omisión | Significado |
    | --- | --- |
    | `quiet-hours` | Fuera de la ventana de horas activas configurada |
    | `empty-heartbeat-file` | `HEARTBEAT.md` existe pero solo tiene andamiaje en blanco, comentario, encabezado, bloque, o checklist vacío |
    | `no-tasks-due` | El modo de tareas está activo, pero todavía no vence ningún intervalo de tarea |
    | `alerts-disabled` | Toda la visibilidad de Heartbeat está desactivada (`showOk`, `showAlerts` y `useIndicator` todos desactivados) |

    En modo de tareas, las marcas de tiempo de vencimiento avanzan solo después de que se complete una ejecución real de Heartbeat.
    Las ejecuciones omitidas no marcan tareas como completadas.

    Documentación: [Heartbeat](/es/gateway/heartbeat), [Automatización](/es/automation).

  </Accordion>

  <Accordion title="Forma recomendada de instalar y configurar OpenClaw">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Desde el código fuente (contribuidores/desarrollo):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    ¿Aún no hay instalación global? Ejecuta `pnpm openclaw onboard` en su lugar. Si faltan los recursos de Control UI,
    el onboarding intenta compilarlos por sí mismo, con respaldo a `pnpm ui:build`.

  </Accordion>

  <Accordion title="¿Cómo abro el panel después del onboarding?">
    El onboarding abre tu navegador en una URL limpia (sin token) del panel justo después de la
    configuración e imprime el enlace en el resumen. Mantén esa pestaña abierta; si no se inició,
    copia y pega la URL impresa en la misma máquina.
  </Accordion>

  <Accordion title="¿Cómo autentico el panel en localhost frente a remoto?">
    **Localhost (misma máquina):**

    - Abre `http://127.0.0.1:18789/`.
    - Si solicita autenticación con secreto compartido, pega el token o la contraseña configurados en los ajustes de Control UI.
    - Fuente del token: `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
    - Fuente de la contraseña: `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - ¿Aún no hay secreto compartido configurado? Ejecuta `openclaw doctor --generate-gateway-token` (o `openclaw doctor --fix --generate-gateway-token`).

    **No en localhost:**

    - **Tailscale Serve** (recomendado): mantén bind en loopback, ejecuta `openclaw gateway --tailscale serve`, abre `https://<magicdns>/`. Con `gateway.auth.allowTailscale: true`, los encabezados de identidad satisfacen la autenticación de Control UI/WebSocket (sin pegar secreto compartido, asume un host de Gateway confiable); las API HTTP aún necesitan autenticación con secreto compartido salvo que uses deliberadamente `none` de ingreso privado o autenticación HTTP de proxy confiable.
      Los intentos simultáneos de autenticación incorrecta con Serve desde el mismo cliente se serializan antes de que el limitador de autenticación fallida los registre, así que un segundo reintento incorrecto ya puede mostrar `retry later`.
    - **Bind de tailnet**: ejecuta `openclaw gateway --bind tailnet --token "<token>"` (o configura autenticación por contraseña), abre `http://<tailscale-ip>:18789/`, pega el secreto compartido correspondiente en los ajustes del panel.
    - **Proxy inverso con identidad**: mantén el Gateway detrás de un proxy confiable, define `gateway.auth.mode: "trusted-proxy"`, abre la URL del proxy. Los proxies loopback en el mismo host necesitan `gateway.auth.trustedProxy.allowLoopback: true` explícito.
    - **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, luego abre `http://127.0.0.1:18789/`. La autenticación con secreto compartido sigue aplicándose sobre el túnel; pega el token o la contraseña configurados si se solicita.

    Consulta [Panel](/es/web/dashboard) y [Superficies web](/es/web) para modos de bind y detalles de autenticación.

  </Accordion>

  <Accordion title="¿Por qué hay dos configuraciones de aprobación de exec para aprobaciones por chat?">
    Controlan capas distintas:

    - `approvals.exec` - reenvía solicitudes de aprobación a destinos de chat.
    - `channels.<channel>.execApprovals` - hace que ese canal sea un cliente de aprobación nativo para aprobaciones de exec.

    La política de exec del host sigue siendo la puerta de aprobación real; la configuración de chat solo controla dónde
    aparecen las solicitudes y cómo las personas las responden.

    Rara vez necesitas ambas:

    - Si el chat ya admite comandos y respuestas, `/approve` en el mismo chat funciona mediante la ruta compartida.
    - Cuando un canal nativo compatible puede inferir aprobadores con seguridad, OpenClaw activa automáticamente las aprobaciones nativas primero por DM si `channels.<channel>.execApprovals.enabled` no está definido o es `"auto"`.
    - Cuando hay tarjetas/botones de aprobación nativos disponibles, esa UI es la principal; menciona un comando manual `/approve` solo si el resultado de la herramienta dice que las aprobaciones por chat no están disponibles.
    - Usa `approvals.exec` solo cuando las solicitudes también deban llegar a otros chats o salas explícitas de operaciones.
    - Usa `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo cuando quieras que las solicitudes de aprobación se publiquen de vuelta en la sala/tema de origen.
    - Las aprobaciones de Plugin son separadas: `/approve` en el mismo chat de forma predeterminada, reenvío opcional con `approvals.plugin`, y solo algunos canales nativos conservan el manejo nativo también para esas.

    Versión corta: el reenvío es para enrutamiento, la configuración de cliente nativo es para una UX más rica específica del canal.
    Consulta [Aprobaciones de exec](/es/tools/exec-approvals).

  </Accordion>

  <Accordion title="¿Qué runtime necesito?">
    Se requiere Node **22.19+** (se recomienda Node 24). `pnpm` es el gestor de paquetes del repo.
    Bun **no se recomienda** para el Gateway.
  </Accordion>

  <Accordion title="¿Funciona en Raspberry Pi?">
    Sí, pero comprueba primero la RAM: Pi 5 y Pi 4 (2 GB+) son el punto ideal; Pi 3B+ (1 GB) funciona pero es lento; Pi Zero 2 W (512 MB) no se recomienda.

    | Modelo | RAM | Adecuación |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | Mejor |
    | Pi 4 | 4 GB | Buena |
    | Pi 4 | 2 GB | Aceptable, añade swap |
    | Pi 4 | 1 GB | Ajustado |
    | Pi 3B+ | 1 GB | Lento |
    | Pi Zero 2 W | 512 MB | No recomendado |

    Mínimo absoluto: 1 GB de RAM, 1 núcleo, 500 MB libres en disco, SO de 64 bits. Como la Pi solo ejecuta
    el Gateway (los modelos llaman a API en la nube), incluso una Pi modesta maneja la carga.

    Una Pi/VPS pequeña también puede alojar solo el Gateway mientras emparejas **nodos** en tu
    portátil/teléfono para pantalla/cámara/lienzo local o ejecución de comandos. Consulta [Nodos](/es/nodes).

    Guía completa de configuración: [Raspberry Pi](/es/install/raspberry-pi).

  </Accordion>

  <Accordion title="¿Algún consejo para instalaciones en Raspberry Pi?">
    - Usa un SO de **64 bits**; no uses Raspberry Pi OS de 32 bits.
    - Añade swap en placas de 2 GB o menos.
    - Prefiere un **SSD USB** en lugar de una tarjeta SD por rendimiento y longevidad.
    - Prefiere la instalación hackeable (git) para poder ver logs y actualizar rápido.
    - Empieza sin canales/skills, añádelos uno por uno.
    - Los fallos binarios extraños ("exec format error") suelen ser una compilación ARM64 faltante para una herramienta opcional de skill.

    Guía completa: [Raspberry Pi](/es/install/raspberry-pi). Consulta también [Linux](/es/platforms/linux).

  </Accordion>

  <Accordion title="Está atascado en wake up my friend / el onboarding no eclosiona. ¿Ahora qué?">
    Esa pantalla depende de que el Gateway sea accesible y esté autenticado. La TUI también envía
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

    3. ¿Sigue colgado? Ejecuta:

    ```bash
    openclaw doctor
    ```

    Si el Gateway es remoto, confirma que la conexión del túnel/Tailscale esté activa y que la UI
    apunte al Gateway correcto. Consulta [Acceso remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Puedo migrar mi configuración a una máquina nueva sin rehacer el onboarding?">
    Sí. Copia el **directorio de estado** y el **workspace**, luego ejecuta Doctor una vez:

    1. Instala OpenClaw en la máquina nueva.
    2. Copia `$OPENCLAW_STATE_DIR` (predeterminado: `~/.openclaw`) desde la máquina antigua.
    3. Copia tu workspace (predeterminado: `~/.openclaw/workspace`).
    4. Ejecuta `openclaw doctor` y reinicia el servicio del Gateway.

    Esto conserva configuración, perfiles de autenticación, credenciales de WhatsApp, sesiones y memoria; mantiene
    tu bot exactamente igual, siempre que copies **ambas** ubicaciones. En modo remoto, el
    host del Gateway posee el almacén de sesiones y el workspace.

    **Importante:** si solo haces commit/push de tu workspace a GitHub, haces copia de seguridad de
    **memoria + archivos bootstrap**, pero no del historial de sesiones ni de la autenticación. Esos viven bajo
    `~/.openclaw/` (por ejemplo `~/.openclaw/agents/<agentId>/sessions/`).

    Relacionado: [Migración](/es/install/migrating), [Dónde viven las cosas en disco](/es/help/faq#where-things-live-on-disk),
    [Workspace del agente](/es/concepts/agent-workspace), [Doctor](/es/gateway/doctor),
    [Modo remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Dónde veo qué hay de nuevo en la versión más reciente?">
    Consulta el changelog de GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Las entradas más nuevas están arriba. Si la sección superior es **Unreleased**, la siguiente sección
    con fecha es la versión publicada más reciente. Las entradas se agrupan bajo **Highlights**, **Changes**,
    y **Fixes** (además de secciones de documentación/otras cuando sea necesario).

  </Accordion>

  <Accordion title="No puedo acceder a docs.openclaw.ai (error SSL)">
    Algunas conexiones de Comcast/Xfinity bloquean incorrectamente `docs.openclaw.ai` mediante Xfinity
    Advanced Security. Desactívalo o añade `docs.openclaw.ai` a la lista de permitidos, luego vuelve a intentarlo. Ayúdanos
    a desbloquearlo: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    ¿Sigue bloqueado? La documentación está replicada en GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Diferencia entre stable y beta">
    **Stable** y **beta** son **npm dist-tags**, no líneas de código separadas:

    - `latest` = estable
    - `beta` = compilación temprana para pruebas (vuelve a `latest` cuando beta falta o es anterior a la versión estable actual)

    Una versión estable normalmente llega primero a **beta**; luego, un paso explícito de promoción
    mueve esa misma versión a `latest` sin cambiar el número de versión. Los mantenedores
    también pueden publicar directamente en `latest`. Por eso beta y estable pueden apuntar a la
    **misma versión** después de la promoción.

    Consulta qué cambió: [CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md).

    Para comandos de instalación de una sola línea y la diferencia entre beta y dev, consulta el siguiente acordeón.

  </Accordion>

  <Accordion title="¿Cómo instalo la versión beta y cuál es la diferencia entre beta y dev?">
    **Beta** es la etiqueta dist-tag de npm `beta` (puede coincidir con `latest` después de la promoción).
    **Dev** es la punta móvil de `main` (git); cuando se publica en npm usa la dist-tag `dev`.

    Comandos de una sola línea (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalador de Windows (PowerShell): `iwr -useb https://openclaw.ai/install.ps1 | iex`

    Más detalles: [Canales de desarrollo](/es/install/development-channels) y [Opciones del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="¿Cómo pruebo los últimos cambios?">
    Dos opciones:

    1. **Canal dev (instalación existente):**

    ```bash
    openclaw update --channel dev
    ```

    Esto cambia a un checkout de git de `main`, hace rebase sobre upstream, compila e instala
    la CLI desde ese checkout.

    2. **Instalación modificable (git) (máquina nueva):**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Prefiere un clon manual:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentación: [Actualizar](/es/cli/update), [Canales de desarrollo](/es/install/development-channels), [Instalar](/es/install).

  </Accordion>

  <Accordion title="¿Cuánto suelen tardar la instalación y la configuración inicial?">
    Guía aproximada:

    - **Instalación:** 2-5 minutos.
    - **Configuración inicial QuickStart:** unos minutos (Gateway de loopback, token automático, espacio de trabajo predeterminado).
    - **Configuración inicial avanzada/completa:** más tiempo cuando el inicio de sesión del proveedor, el emparejamiento de canales, la instalación del daemon, las descargas de red o las Skills requieren configuración adicional.

    El asistente muestra esta línea de tiempo al principio. Omite los pasos opcionales y vuelve más tarde con
    `openclaw configure`.

    ¿Se queda colgado? Consulta [Estoy bloqueado](#quick-start-and-first-run-setup) arriba.

  </Accordion>

  <Accordion title="¿Instalador atascado? ¿Cómo obtengo más información?">
    Vuelve a ejecutarlo con `--verbose`:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` no tiene un conmutador verbose dedicado; envuélvelo en `Set-PSDebug -Trace 1` /
    `-Trace 0` en su lugar. Referencia completa de opciones: [Opciones del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="La instalación en Windows dice que no se encontró git o que openclaw no se reconoce">
    Dos problemas comunes en Windows:

    **1) error de npm spawn git / git no encontrado**

    - Instala **Git for Windows** y asegúrate de que `git` esté en PATH.
    - Cierra y vuelve a abrir PowerShell, luego vuelve a ejecutar el instalador.

    **2) openclaw no se reconoce después de la instalación**

    - La carpeta bin global de npm no está en PATH.
    - Compruébalo: `npm config get prefix`.
    - Agrega ese directorio al PATH de tu usuario (no hace falta el sufijo `\bin`; en la mayoría de los sistemas es `%AppData%\npm`).
    - Cierra y vuelve a abrir PowerShell.

    ¿Prefieres una aplicación de escritorio? Usa **Windows Hub**. Configuración solo con terminal: el instalador de PowerShell
    y las rutas de WSL2 Gateway son compatibles. Documentación: [Windows](/es/platforms/windows).

  </Accordion>

  <Accordion title="La salida de exec en Windows muestra texto chino ilegible: ¿qué debo hacer?">
    Normalmente es una incompatibilidad de página de códigos de consola en shells nativos de Windows.

    Síntomas: la salida de `system.run`/`exec` muestra chino como mojibake; el mismo comando
    se ve bien en otro perfil de terminal.

    Solución alternativa en PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Luego reinicia el Gateway y vuelve a intentarlo:

    ```powershell
    openclaw gateway restart
    ```

    ¿Todavía puedes reproducir esto en la versión más reciente de OpenClaw? Haz seguimiento o repórtalo: [Issue #30640](https://github.com/openclaw/openclaw/issues/30640).

  </Accordion>

  <Accordion title="La documentación no respondió mi pregunta: ¿cómo obtengo una respuesta mejor?">
    Usa la instalación modificable (git) para tener todo el código fuente y la documentación localmente, luego pregúntale
    a tu bot (o Claude/Codex) **desde esa carpeta** para que pueda leer el repo y responder con precisión.

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Más detalles: [Instalar](/es/install) y [Opciones del instalador](/es/install/installer).

  </Accordion>

  <Accordion title="¿Cómo instalo OpenClaw en Linux?">
    - Ruta rápida en Linux + instalación del servicio: [Linux](/es/platforms/linux).
    - Guía completa paso a paso: [Primeros pasos](/es/start/getting-started).
    - Instalador + actualizaciones: [Instalación y actualizaciones](/es/install/updating).

  </Accordion>

  <Accordion title="¿Cómo instalo OpenClaw en un VPS?">
    Cualquier VPS Linux funciona. Instálalo en el servidor y luego accede al Gateway mediante SSH/Tailscale.

    Guías: [exe.dev](/es/install/exe-dev), [Hetzner](/es/install/hetzner), [Fly.io](/es/install/fly).
    Acceso remoto: [Gateway remoto](/es/gateway/remote).

  </Accordion>

  <Accordion title="¿Dónde están las guías de instalación en la nube/VPS?">
    Centro de hosting con proveedores comunes:

    - [Hosting VPS](/es/vps) (todos los proveedores en un solo lugar)
    - [Fly.io](/es/install/fly)
    - [Hetzner](/es/install/hetzner)
    - [exe.dev](/es/install/exe-dev)

    En la nube, el **Gateway se ejecuta en el servidor** y accedes a él desde tu portátil/teléfono
    mediante la Control UI (o Tailscale/SSH). Tu estado + espacio de trabajo viven en el servidor, así que
    trata el host como la fuente de verdad y haz copias de seguridad.

    Empareja **nodos** (Mac/iOS/Android/headless) con ese Gateway en la nube para ejecución local
    de pantalla/cámara/lienzo o comandos en tu portátil mientras el Gateway permanece en
    la nube.

    Centro: [Plataformas](/es/platforms). Acceso remoto: [Gateway remoto](/es/gateway/remote).
    Nodos: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes).

  </Accordion>

  <Accordion title="¿Puedo pedirle a OpenClaw que se actualice solo?">
    Es posible, pero no recomendado. El flujo de actualización puede reiniciar el Gateway (interrumpiendo la
    sesión activa), puede necesitar un checkout de git limpio y puede pedir confirmación.
    Es más seguro ejecutar actualizaciones desde un shell como operador.

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Automatización desde un agente:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentación: [Actualizar](/es/cli/update), [Actualización](/es/install/updating).

  </Accordion>

  <Accordion title="¿Qué hace realmente la configuración inicial?">
    `openclaw onboard` es la ruta de configuración recomendada. En **modo local** te guía por:

    1. **Modelo/Autenticación**: OAuth del proveedor, claves de API o autenticación manual (incluidas opciones locales como LM Studio); elige un modelo predeterminado.
    2. **Espacio de trabajo**: ubicación + archivos de arranque.
    3. **Gateway**: puerto, dirección de escucha, modo de autenticación, exposición mediante Tailscale.
    4. **Canales**: canales de chat integrados y de Plugin oficial: iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp y más.
    5. **Daemon**: LaunchAgent (macOS), unidad de usuario systemd (Linux/WSL2) o tarea programada nativa de Windows.
    6. **Comprobación de estado**: inicia el Gateway y verifica que se esté ejecutando.
    7. **Skills**: instala Skills recomendadas y dependencias opcionales.

    Establece expectativas de duración al principio y advierte si tu modelo configurado es desconocido
    o carece de autenticación. Desglose completo: [Configuración inicial (CLI)](/es/start/wizard).

  </Accordion>

  <Accordion title="¿Necesito una suscripción a Claude u OpenAI para ejecutar esto?">
    No. Ejecuta OpenClaw con **claves de API** (Anthropic/OpenAI/otros) o **modelos solo locales**
    para que tus datos permanezcan en tu dispositivo. Las suscripciones (Claude Pro/Max, ChatGPT/Codex) son
    formas opcionales de autenticar esos proveedores.

    Para Anthropic: una **clave de API** ofrece facturación estándar de pago por uso; **Claude CLI**
    reutiliza un inicio de sesión existente de Claude Code en el mismo host. Actualmente Anthropic trata
    la ruta no interactiva `claude -p` de Claude CLI como uso de Agent SDK/programático que
    aún consume los límites del plan de tu suscripción; consulta la documentación actual de facturación de Anthropic
    antes de depender del comportamiento de la suscripción. Para hosts de Gateway de larga duración y automatización
    compartida, una clave de API de Anthropic es la opción más predecible.

    OAuth de OpenAI Codex (suscripción a ChatGPT/Codex) es totalmente compatible para modelos de agente.
    OpenClaw también admite opciones alojadas de estilo suscripción, como **Qwen Cloud
    Coding Plan**, **MiniMax Coding Plan** y **Z.AI / GLM Coding Plan**.

    Documentación: [Anthropic](/es/providers/anthropic), [OpenAI](/es/providers/openai),
    [Qwen Cloud](/es/providers/qwen), [MiniMax](/es/providers/minimax), [Z.AI (GLM)](/es/providers/zai),
    [Modelos locales](/es/gateway/local-models), [Modelos](/es/concepts/models).

  </Accordion>

  <Accordion title="¿Puedo usar la suscripción Claude Max sin una clave de API?">
    Sí. OpenClaw admite la reutilización de Claude CLI para planes Pro/Max/Team/Enterprise. Anthropic
    actualmente trata la ruta `claude -p` que usa OpenClaw como uso del plan de suscripción sujeto
    a los límites de tu plan, no como una asignación gratuita independiente; consulta
    [Anthropic](/es/providers/anthropic) para ver los detalles actuales de facturación y enlaces a
    los propios artículos de soporte de Anthropic. Para la configuración del lado del servidor más predecible, usa una
    clave de API de Anthropic en su lugar.
  </Accordion>

  <Accordion title="¿Admiten autenticación por suscripción de Claude (Claude Pro o Max)?">
    Sí, mediante reutilización de Claude CLI. El tratamiento de facturación de Anthropic para el uso de `claude -p`/Agent SDK
    ha cambiado con el tiempo; consulta [Anthropic](/es/providers/anthropic) para ver el estado actual y
    enlaces con fecha a los artículos de soporte de Anthropic antes de depender de un comportamiento
    de facturación específico.

    La autenticación setup-token de Anthropic también sigue siendo una ruta de token compatible, pero OpenClaw prefiere
    la reutilización de Claude CLI y `claude -p` cuando estén disponibles. Para cargas de trabajo de producción o multiusuario,
    una clave de API de Anthropic sigue siendo la opción más segura y predecible. Otras
    opciones alojadas de estilo suscripción: [OpenAI](/es/providers/openai), [Qwen Cloud](/es/providers/qwen),
    [MiniMax](/es/providers/minimax), [Z.AI (GLM)](/es/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="¿Por qué veo HTTP 429 rate_limit_error de Anthropic?">
    Tu **cuota/límite de tasa de Anthropic** se agotó para la ventana actual. En **Claude
    CLI**, espera a que la ventana se restablezca o mejora tu plan. Con una **clave de API de Anthropic**,
    revisa el uso/facturación en Anthropic Console y aumenta los límites según sea necesario.

    Si el mensaje es específicamente `Extra usage is required for long context requests`,
    la solicitud está intentando usar la ventana de contexto de 1M de Anthropic (un modelo Claude 4.x de 1M apto para GA,
    o la configuración heredada `params.context1m: true`), y tu credencial actual no
    es apta para la facturación de contexto largo.

    Configura un **modelo de reserva** para que OpenClaw siga respondiendo mientras un proveedor está limitado por tasa.
    Consulta [Modelos](/es/cli/models), [OAuth](/es/concepts/oauth) y
    [Anthropic 429 extra usage required for long context](/es/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="¿AWS Bedrock es compatible?">
    Sí. OpenClaw incluye un proveedor **Amazon Bedrock (Converse)** integrado. Con marcadores de entorno de AWS
    presentes (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_BEARER_TOKEN_BEDROCK`),
    OpenClaw habilita automáticamente el proveedor Bedrock implícito para el descubrimiento de modelos; de lo contrario,
    configura `plugins.entries.amazon-bedrock.config.discovery.enabled: true` o agrega una entrada de proveedor
    manual. Consulta [Amazon Bedrock](/es/providers/bedrock) y [Proveedores de modelos](/es/providers/models).
    Un proxy compatible con OpenAI delante de Bedrock sigue siendo una opción válida si prefieres un flujo de claves administrado.
  </Accordion>

  <Accordion title="¿Cómo funciona la autenticación de Codex?">
    OpenClaw admite **OpenAI Codex** mediante OAuth (inicio de sesión con ChatGPT). Usa `openai/gpt-5.5`
    para la configuración predeterminada: autenticación de suscripción ChatGPT/Codex más ejecución nativa del servidor de aplicaciones de Codex.
    Las referencias de modelo heredadas con prefijo Codex son configuración heredada reparada por
    `openclaw doctor --fix`. El acceso directo con clave de API de OpenAI sigue disponible para superficies de API de OpenAI
    que no son de agente y, mediante un perfil de clave de API `openai` ordenado, también para modelos de agente.
    Consulta [Proveedores de modelos](/es/concepts/model-providers) y [Asistente de incorporación (CLI)](/es/start/wizard).
  </Accordion>

  <Accordion title="¿Por qué OpenClaw todavía menciona el prefijo heredado OpenAI Codex?">
    `openai` es el proveedor y el id de perfil de autenticación actuales tanto para claves de API de OpenAI como para
    OAuth de ChatGPT/Codex: OpenAI Codex está integrado en él. Aún puedes ver un prefijo heredado
    `openai-codex` en configuraciones antiguas y advertencias de migración:

    - `openai/gpt-5.5` = autenticación de suscripción ChatGPT/Codex con runtime Codex nativo para turnos de agente.
    - Referencias de modelo heredadas `openai-codex/*` = ruta heredada reparada por `openclaw doctor --fix`.
    - `openai/gpt-5.5` más un perfil de clave de API `openai` ordenado = autenticación con clave de API para un modelo de agente de OpenAI.
    - Ids de perfil de autenticación heredados `openai-codex` = ids heredados migrados por `openclaw doctor --fix`.

    ¿Quieres facturación directa de OpenAI Platform? Configura `OPENAI_API_KEY`. ¿Quieres autenticación de suscripción
    ChatGPT/Codex? Ejecuta `openclaw models auth login --provider openai`. Mantén la referencia de modelo
    como `openai/gpt-5.5`; las referencias heredadas con prefijo Codex son las que `openclaw doctor --fix` reescribe.

  </Accordion>

  <Accordion title="¿Por qué los límites de OAuth de Codex pueden diferir de ChatGPT web?">
    OAuth de Codex usa ventanas de cuota administradas por OpenAI y dependientes del plan que pueden diferir de la
    experiencia del sitio web/aplicación de ChatGPT, incluso en la misma cuenta.

    `openclaw models status` muestra las ventanas de uso/cuota del proveedor visibles actualmente, pero
    no inventa ni normaliza derechos de ChatGPT web en acceso directo a la API. Para la
    ruta de facturación/límites directa de OpenAI Platform, usa `openai/*` con una clave de API.

  </Accordion>

  <Accordion title="¿Admiten autenticación de suscripción de OpenAI (OAuth de Codex)?">
    Sí, completamente. OpenAI permite explícitamente el uso de OAuth de suscripción en herramientas/flujos de trabajo
    externos como OpenClaw. La incorporación puede ejecutar el flujo OAuth por ti.

    Consulta [OAuth](/es/concepts/oauth), [Proveedores de modelos](/es/concepts/model-providers) y [Asistente de incorporación (CLI)](/es/start/wizard).

  </Accordion>

  <Accordion title="¿Cómo configuro OAuth de Gemini CLI?">
    Gemini CLI usa un **flujo de autenticación de Plugin**, no un id de cliente ni un secreto en `openclaw.json`.

    1. Instala Gemini CLI localmente para que `gemini` esté en `PATH`:
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Habilita el Plugin: `openclaw plugins enable google`
    3. Inicia sesión: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modelo predeterminado después del inicio de sesión: `google/gemini-3.1-pro-preview` (runtime `google-gemini-cli`)
    5. ¿Las solicitudes fallan después del inicio de sesión? Configura `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` en el host del Gateway y vuelve a intentarlo.

    Los tokens OAuth se almacenan en perfiles de autenticación en el host del Gateway. Detalles: [Google](/es/providers/google), [Proveedores de modelos](/es/concepts/model-providers).

  </Accordion>

  <Accordion title="¿Un modelo local está bien para chats informales?">
    Normalmente no. OpenClaw necesita contexto amplio y seguridad sólida; las tarjetas pequeñas truncan el contexto
    y omiten los filtros de seguridad del lado del proveedor. Si debes hacerlo, ejecuta localmente la compilación de modelo **más grande**
    que puedas (LM Studio); consulta [Modelos locales](/es/gateway/local-models). Los modelos más pequeños/cuantizados
    aumentan el riesgo de inyección de prompts; consulta [Seguridad](/es/gateway/security).
  </Accordion>

  <Accordion title="¿Cómo mantengo el tráfico de modelos alojados en una región específica?">
    Elige endpoints fijados a una región. OpenRouter expone opciones alojadas en EE. UU. para MiniMax, Kimi
    y GLM; elige la variante alojada en EE. UU. para mantener los datos dentro de la región. Aun así puedes listar
    Anthropic/OpenAI junto con estas opciones con `models.mode: "merge"` para que los modelos de reserva sigan
    disponibles mientras se respeta el proveedor regional que selecciones.
  </Accordion>

  <Accordion title="¿Tengo que comprar un Mac Mini para instalar esto?">
    No. OpenClaw se ejecuta en macOS o Linux (Windows mediante WSL2). Un Mac mini es una opción popular
    de host siempre activo, pero un VPS pequeño, un servidor doméstico o una máquina de clase Raspberry Pi también sirve.

    Solo necesitas un Mac **para herramientas exclusivas de macOS**. Para iMessage, usa [iMessage](/es/channels/imessage)
    con `imsg` en cualquier Mac con sesión iniciada en Messages; si el Gateway se ejecuta en Linux o en otro lugar,
    configura `channels.imessage.cliPath` como un contenedor SSH que ejecute `imsg` en ese Mac. Para otras
    herramientas exclusivas de macOS, ejecuta el Gateway en un Mac o empareja un nodo macOS.

    Documentación: [iMessage](/es/channels/imessage), [Nodos](/es/nodes), [Modo remoto de Mac](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="¿Necesito un Mac mini para la compatibilidad con iMessage?">
    Necesitas **algún dispositivo macOS** con sesión iniciada en Messages, no necesariamente un Mac mini; cualquier
    Mac sirve. Usa [iMessage](/es/channels/imessage) con `imsg`; el Gateway puede ejecutarse en ese
    Mac, o en otro lugar con un contenedor SSH `cliPath`.

    Configuraciones comunes:

    - Gateway en Linux/VPS, `channels.imessage.cliPath` configurado como un contenedor SSH que ejecuta `imsg` en un Mac con sesión iniciada en Messages.
    - Todo en un solo Mac para la configuración más simple en una sola máquina.

    Documentación: [iMessage](/es/channels/imessage), [Nodos](/es/nodes), [Modo remoto de Mac](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si compro un Mac mini para ejecutar OpenClaw, ¿puedo conectarlo a mi MacBook Pro?">
    Sí. El **Mac mini puede ejecutar el Gateway**, y tu MacBook Pro se conecta como un **nodo**
    (dispositivo complementario). Los nodos no ejecutan el Gateway: agregan capacidades como
    pantalla/cámara/lienzo y `system.run` en ese dispositivo.

    Patrón común: Gateway en el Mac mini siempre encendido; MacBook Pro ejecuta la app de macOS o un
    host de Node y se empareja con el Gateway. Compruébalo con `openclaw nodes status` / `openclaw nodes list`.

    Documentación: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes).

  </Accordion>

  <Accordion title="¿Puedo usar Bun?">
    No se recomienda: Bun tiene errores de runtime, especialmente con WhatsApp y Telegram. Usa
    **Node** para gateways estables. Si aun así quieres experimentar, hazlo en un
    gateway que no sea de producción y sin WhatsApp/Telegram.
  </Accordion>

  <Accordion title="Telegram: ¿qué va en allowFrom?">
    `channels.telegram.allowFrom` es el **ID de usuario de Telegram del remitente humano** (numérico),
    no el nombre de usuario del bot. La configuración pide solo IDs de usuario numéricos; `openclaw doctor --fix`
    puede intentar resolver entradas heredadas de `@username`.

    Más seguro (sin bot de terceros): envía un DM a tu bot, ejecuta `openclaw logs --follow`, lee `from.id`.

    Bot API oficial: envía un DM a tu bot, llama a `https://api.telegram.org/bot<bot_token>/getUpdates`, lee `message.from.id`.

    Terceros (menos privado): envía un DM a `@userinfobot` o `@getidsbot`.

    Consulta [control de acceso de Telegram](/es/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="¿Pueden varias personas usar un número de WhatsApp con distintas instancias de OpenClaw?">
    Sí, mediante **enrutamiento multiagente**. Vincula el DM de WhatsApp de cada remitente (`peer: { kind: "direct", id: "+15551234567" }`) a un `agentId` distinto, dando a cada persona su propio espacio de trabajo y almacén de sesión. Las respuestas siguen saliendo de la **misma cuenta de WhatsApp**; el control de acceso de DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) es global por cuenta. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent) y [WhatsApp](/es/channels/whatsapp).
  </Accordion>

  <Accordion title='¿Puedo ejecutar un agente de "chat rápido" y un agente de "Opus para programar"?'>
    Sí. Usa el enrutamiento multiagente: da a cada agente su propio modelo predeterminado y luego vincula las
    rutas entrantes (cuenta de proveedor o pares específicos) a cada agente. Configuración de ejemplo:
    [Enrutamiento multiagente](/es/concepts/multi-agent). Consulta también [Modelos](/es/concepts/models) y
    [Configuración](/es/gateway/configuration).
  </Accordion>

  <Accordion title="¿Homebrew funciona en Linux?">
    Sí, mediante Linuxbrew:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Ejecutar OpenClaw mediante systemd: asegúrate de que el PATH del servicio incluya
    `/home/linuxbrew/.linuxbrew/bin` (o tu prefijo de brew) para que las herramientas instaladas con `brew`
    se resuelvan en shells que no son de inicio de sesión. Las compilaciones recientes también anteponen directorios bin de usuario comunes en servicios
    systemd de Linux (por ejemplo `~/.local/bin`, `~/.npm-global/bin`,
    `~/.local/share/pnpm`, `~/.bun/bin`) y respetan `PNPM_HOME`, `NPM_CONFIG_PREFIX`,
    `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` y `FNM_DIR` cuando están configurados.

  </Accordion>

  <Accordion title="Diferencia entre la instalación hackeable con git y la instalación con npm">
    - **Instalación hackeable (git):** checkout completo del código fuente, editable, ideal para colaboradores. Compilas localmente y puedes parchear código/documentación.
    - **Instalación con npm:** instalación global de la CLI, sin repo, ideal para "solo ejecutarlo". Las actualizaciones vienen de dist-tags de npm.

    Documentación: [Primeros pasos](/es/start/getting-started), [Actualizar](/es/install/updating).

  </Accordion>

  <Accordion title="¿Puedo cambiar entre instalaciones con npm y git más adelante?">
    Sí, con `openclaw update --channel ...` en una instalación existente. Esto **no
    elimina tus datos**: solo cambia la instalación del código de OpenClaw. El estado (`~/.openclaw`) y el
    espacio de trabajo (`~/.openclaw/workspace`) permanecen intactos.

    De npm a git:

    ```bash
    openclaw update --channel dev
    ```

    De git a npm:

    ```bash
    openclaw update --channel stable
    ```

    Añade `--dry-run` para previsualizar primero el cambio de modo planificado. El actualizador ejecuta acciones de seguimiento de Doctor,
    actualiza las fuentes de plugins para el canal de destino y reinicia el gateway
    salvo que pases `--no-restart`.

    El instalador también puede forzar cualquiera de los dos modos:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Consejos de copia de seguridad: [Dónde viven las cosas en el disco](/es/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="¿Debería ejecutar el Gateway en mi portátil o en un VPS?">
    ¿Quieres fiabilidad 24/7? Usa un **VPS**. ¿Quieres la menor fricción y te parece bien
    que haya suspensión/reinicios? Ejecútalo localmente.

    **Portátil (Gateway local)**

    - **Ventajas:** sin coste de servidor, acceso directo a archivos locales, una ventana de navegador activa.
    - **Desventajas:** la suspensión o las caídas de red lo desconectan, las actualizaciones/reinicios del SO lo interrumpen, debe permanecer despierto.

    **VPS / nube**

    - **Ventajas:** siempre encendido, red estable, sin problemas de suspensión del portátil, más fácil de mantener en ejecución.
    - **Desventajas:** a menudo sin interfaz gráfica (usa capturas de pantalla), solo acceso remoto a archivos, se necesita SSH para actualizaciones.

    WhatsApp/Telegram/Slack/Mattermost/Discord funcionan bien desde un VPS; la verdadera
    disyuntiva es navegador sin interfaz gráfica frente a una ventana visible. Consulta [Navegador](/es/tools/browser).

    Recomendación predeterminada: VPS si antes has tenido desconexiones del gateway; local es ideal
    cuando estás usando activamente el Mac y quieres acceso local a archivos o automatización de interfaz de usuario
    con navegador visible.

  </Accordion>

  <Accordion title="¿Qué tan importante es ejecutar OpenClaw en una máquina dedicada?">
    No es obligatorio, pero se recomienda para mejorar la fiabilidad y el aislamiento.

    - **Host dedicado (VPS/Mac mini/Raspberry Pi):** siempre encendido, menos interrupciones por suspensión/reinicio, permisos más limpios, más fácil de mantener en ejecución.
    - **Portátil/escritorio compartido:** está bien para pruebas y uso activo, pero espera pausas cuando la máquina se suspenda o se actualice.

    Lo mejor de ambos mundos: mantén el Gateway en un host dedicado y empareja tu portátil como
    **nodo** para herramientas locales de pantalla/cámara/ejecución. Consulta [Nodos](/es/nodes) y [Seguridad](/es/gateway/security).

  </Accordion>

  <Accordion title="¿Cuáles son los requisitos mínimos de VPS y el sistema operativo recomendado?">
    - **Mínimo absoluto:** 1 vCPU, 1 GB de RAM, ~500 MB de disco.
    - **Recomendado:** 1-2 vCPU, 2 GB o más de RAM para margen (registros, medios, varios canales). Las herramientas de nodo y la automatización del navegador pueden consumir muchos recursos.

    SO: **Ubuntu LTS** (o cualquier Debian/Ubuntu moderno): la ruta de instalación en Linux mejor probada.

    Documentos: [Linux](/es/platforms/linux), [Alojamiento VPS](/es/vps).

  </Accordion>

  <Accordion title="¿Puedo ejecutar OpenClaw en una máquina virtual y cuáles son los requisitos?">
    Sí. Trata una máquina virtual como un VPS: debe estar siempre encendida, ser accesible y tener suficiente RAM
    para el Gateway y cualquier canal que habilites.

    - **Mínimo absoluto:** 1 vCPU, 1 GB de RAM.
    - **Recomendado:** 2 GB o más de RAM para varios canales, automatización del navegador o herramientas multimedia.
    - **SO:** Ubuntu LTS u otro Debian/Ubuntu moderno.

    En Windows, usa **Windows Hub** para la configuración de escritorio, o WSL2 para una máquina virtual de Gateway de estilo Linux
    con amplia compatibilidad de herramientas. Consulta [Windows](/es/platforms/windows), [Alojamiento VPS](/es/vps).
    Ejecutar macOS en una máquina virtual: consulta [máquina virtual de macOS](/es/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Preguntas frecuentes](/es/help/faq) - las preguntas frecuentes principales (modelos, sesiones, gateway, seguridad, más)
- [Resumen de instalación](/es/install)
- [Primeros pasos](/es/start/getting-started)
- [Solución de problemas](/es/help/troubleshooting)
