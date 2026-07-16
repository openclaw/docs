---
read_when:
    - Instalación de la aplicación para macOS
    - Cómo elegir entre el modo Gateway local y remoto en macOS
    - Buscando descargas de versiones de la aplicación para macOS
summary: Instalar y usar la aplicación de OpenClaw para la barra de menús de macOS
title: Aplicación para macOS
x-i18n:
    generated_at: "2026-07-16T11:48:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6aaf107eb564dd8a444069fee31bb190efe41da9f26b3c52f42fdbbcaf8690c
    source_path: platforms/macos.md
    workflow: 16
---

La app para macOS es el **complemento de la barra de menús** de OpenClaw: interfaz nativa de la bandeja, solicitudes de permisos de macOS, notificaciones, WebChat, entrada de voz, Canvas y herramientas de Node alojadas en el Mac, como `system.run`.

¿Solo se necesitan la CLI y el Gateway? Empiece por [Primeros pasos](/es/start/getting-started).

## Descarga

Obtenga las compilaciones de la app para macOS en las [versiones de OpenClaw en GitHub](https://github.com/openclaw/openclaw/releases).
Cuando una versión incluya recursos de la app para macOS, busque:

- `OpenClaw-<version>.dmg` (preferido)
- `OpenClaw-<version>.zip`

Algunas versiones solo incluyen la CLI, pruebas o recursos para Windows. Si la versión más reciente no tiene ningún recurso de la app para macOS, use la más reciente que sí lo tenga o compile desde el código fuente con la [configuración de desarrollo para macOS](/es/platforms/mac/dev-setup).

## Primera ejecución

1. Instale e inicie **OpenClaw.app**.
2. Elija **This Mac** para un Gateway local o conéctese a un Gateway remoto.
3. Espere mientras la app instala el entorno de ejecución de la CLI correspondiente. En modo local, también instala e inicia el Gateway.
4. Establezca la inferencia mediante una comprobación con un modelo activo. Una vez superada, OpenClaw se encarga del resto de la configuración.
5. Complete la lista de comprobación de permisos de macOS y envíe el mensaje de prueba de incorporación.

Si la app accede a un Gateway existente cuyo agente predeterminado tiene un modelo configurado, considera que ese Gateway ya está configurado, omite la incorporación del proveedor y de OpenClaw y abre el panel. Si no se puede conectar al Gateway o su agente predeterminado no tiene ningún modelo, la incorporación de inferencia sigue disponible para la recuperación.

Para configurar la CLI y el Gateway, consulte [Primeros pasos](/es/start/getting-started).
Para recuperar permisos, consulte [Permisos de macOS](/es/platforms/mac/permissions).

## Actualizaciones

La tarjeta de actualización del panel indica qué actualizará la app:

- **Actualizar la app para Mac y el Gateway** significa que la app firmada gestiona el Gateway local de launchd. Sparkle actualiza primero la app; tras reiniciarla, la app actualiza y reinicia automáticamente su Gateway con la versión correspondiente y, después, verifica la conexión.
- **Actualizar el Gateway** significa que la app está conectada a un Gateway remoto, a un Gateway local administrado manualmente o a otra instalación que la app no gestiona. El botón ejecuta el flujo de actualización normal de ese Gateway en lugar de modificar la app para Mac.

Una actualización coordinada fallida permanece en su ventana de configuración, con acciones para reintentar, consultar la [guía de actualización](/es/install/updating) y acceder a Discord. La reparación automática nunca revierte un Gateway más reciente a una versión anterior ni sustituye una fijación de canal `extended-stable`.

Tras una actualización correcta, la app busca la sesión directa de nivel superior utilizada más recientemente por una persona y envía a ese agente un evento de actualización único. La actividad de Heartbeat y Cron no influye en esta elección. A continuación, el agente puede darle la bienvenida de nuevo desde la conversación que probablemente estaba utilizando. En modo remoto, la app solo actualiza el entorno de ejecución local de Node del Mac y omite la notificación cuando el Gateway remoto es anterior a la app.

Sparkle utiliza la configuración `update.channel` del Gateway. `beta` y `dev` habilitan las compilaciones beta de la app; `stable`, `extended-stable` y los valores ausentes o desconocidos mantienen las compilaciones estables de la app.

## Apertura de enlaces del panel

En el panel integrado de la app para macOS, al hacer clic en un enlace web externo, este se abre en una barra lateral redimensionable del navegador que ocupa la mitad del ancho de la ventana, mientras la navegación del panel permanece visible. Arrastre el separador para elegir otro ancho; la app lo recuerda. Cada enlace se abre en su propia pestaña, la barra de pestañas aparece cuando hay varias páginas abiertas y, al volver a hacer clic en el mismo enlace, se reutiliza la pestaña existente. Arrastre las pestañas para reordenarlas, ciérrelas con el botón de cierre de pestaña o con un clic central y haga clic con el botón derecho en una pestaña para acceder a **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** y **Close Other Tabs**. Los controles de retroceso y avance de la barra de título de la ventana y los gestos de deslizamiento del panel táctil permiten navegar por el historial del panel; los controles de retroceso y avance de la propia barra lateral permiten navegar por el historial de la pestaña activa. La barra lateral también cuenta con controles para recargar, abrir en el navegador predeterminado y cerrar.

Los controles de la barra de título siguen a la barra lateral de la app: cuando está expandida, los controles de retroceso y avance aparecen en su extremo derecho, junto al botón de alternancia de la barra lateral; cuando está contraída, dejan espacio para un botón de búsqueda (que abre la paleta de comandos) y un botón de nueva sesión.

Haga clic con el botón derecho en un enlace externo para elegir **Open in Sidebar**, **Open in Default Browser** o **Copy Link**. Los clics con teclas modificadoras y los enlaces de nueva ventana activados por el usuario desde el panel siguen abriéndose en el navegador predeterminado; los enlaces de nueva ventana dentro de la barra lateral se abren como nuevas pestañas de la barra lateral. Las páginas normales de la interfaz de control alojadas en el navegador mantienen el comportamiento habitual del navegador para los enlaces y el menú contextual.

## Importación de sesiones del navegador

La primera vez que se abre la barra lateral del navegador mientras la app funciona con un Gateway local, el panel muestra un aviso descartable si existe en el Mac un perfil de la familia Chrome con cookies. El aviso ofrece copiar esas cookies a un perfil administrado y aislado que los agentes utilizan para navegar. Elija un perfil mediante su control **Import** (puede requerirse Touch ID); el progreso y el número de cookies importadas aparecen en línea, y solo se copian las cookies: las contraseñas nunca abandonan el navegador de origen. Al descartar el aviso se registra la elección; **Settings → General → Browser login → Import…** vuelve a ofrecerla en cualquier momento. Consulte [Navegador](/es/cli/browser) para conocer el flujo de importación subyacente y la condición `browser.allowSystemProfileImport`.

## Elección de un modo de Gateway

| Modo   | Cuándo utilizarlo                                                              | Página de detalles                                  |
| ------ | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| Local  | Este Mac debe ejecutar el Gateway y mantenerlo activo mediante launchd.        | [Gateway en macOS](/es/platforms/mac/bundled-gateway)  |
| Remoto | Otro host ejecuta el Gateway; este Mac lo controla mediante SSH, LAN o Tailnet. | [Control remoto](/es/platforms/mac/remote)             |

Ambos modos necesitan una CLI `openclaw` instalada porque la app reutiliza su entorno de ejecución del host de Node. En un Mac nuevo, la app instala automáticamente la CLI correspondiente; a continuación, el modo local inicia el asistente del Gateway, mientras que el modo remoto se conecta al Gateway seleccionado sin iniciar un segundo Gateway local.
Consulte [Gateway en macOS](/es/platforms/mac/bundled-gateway) para realizar una recuperación manual.

## Elementos gestionados por la app

- Estado de la barra de menús, notificaciones, estado del sistema y WebChat.
- Solicitudes de permisos de macOS para la pantalla, el micrófono, el habla, la automatización y la accesibilidad.
- Un Node de Mac que combina Canvas nativo, captura de cámara y pantalla, notificaciones, ubicación y control del ordenador con los comandos de sistema, navegador, Plugin, Skills y MCP del host de Node de la CLI.
- Solicitudes de aprobación de ejecución para comandos alojados en el Mac.
- Ejecución en el contexto de la app para comandos de shell aprobados, conservando la atribución de permisos de macOS de la app mientras el entorno de ejecución de la CLI gestiona la política compartida de Node.
- Túneles SSH en modo remoto o conexiones directas al Gateway.

La app **no** sustituye la documentación del Gateway ni la documentación general de la CLI. La configuración del Gateway, los proveedores, los plugins, los canales, las herramientas y la seguridad se describen en su propia documentación.

## Páginas detalladas de macOS

| Tarea                                         | Lectura                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Instalar o depurar el servicio CLI/Gateway    | [Gateway en macOS](/es/platforms/mac/bundled-gateway)                                          |
| Mantener el estado fuera de carpetas sincronizadas con la nube | [Gateway en macOS](/es/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Depurar la detección y conectividad de la app | [Gateway en macOS](/es/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| Comprender el comportamiento de launchd       | [Ciclo de vida del Gateway](/es/platforms/mac/child-process)                                   |
| Corregir problemas de permisos o firma/TCC    | [Permisos de macOS](/es/platforms/mac/permissions)                                             |
| Detectar el Mac utilizado más recientemente   | [Presencia del ordenador activo](/es/nodes/presence)                                           |
| Conectarse a un Gateway remoto                | [Control remoto](/es/platforms/mac/remote)                                                     |
| Consultar el estado de la barra de menús y las comprobaciones de estado | [Barra de menús](/es/platforms/mac/menu-bar), [Comprobaciones de estado](/es/platforms/mac/health) |
| Usar la interfaz de chat integrada            | [WebChat](/es/platforms/mac/webchat)                                                           |
| Usar la activación por voz o pulsar para hablar | [Activación por voz](/es/platforms/mac/voicewake)                                            |
| Usar Canvas y los enlaces profundos de Canvas | [Canvas](/es/platforms/mac/canvas)                                                             |
| Alojar PeekabooBridge para automatizar la interfaz de usuario | [Puente de Peekaboo](/es/platforms/mac/peekaboo)                                    |
| Configurar las aprobaciones de comandos       | [Aprobaciones de ejecución](/es/tools/exec-approvals), [detalles avanzados](/es/tools/exec-approvals-advanced) |
| Inspeccionar los comandos de Node de Mac y el IPC de la app | [IPC de macOS](/es/platforms/mac/xpc)                                              |
| Capturar registros                            | [Registro de macOS](/es/platforms/mac/logging)                                                 |
| Compilar desde el código fuente               | [Configuración de desarrollo para macOS](/es/platforms/mac/dev-setup)                          |

## Contenido relacionado

- [Plataformas](/es/platforms)
- [Primeros pasos](/es/start/getting-started)
- [Gateway](/es/gateway)
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
