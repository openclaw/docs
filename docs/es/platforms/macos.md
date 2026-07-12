---
read_when:
    - Instalación de la aplicación para macOS
    - Decidir entre el modo Gateway local y remoto en macOS
    - ¿Busca descargas de versiones de la aplicación para macOS?
summary: Instalar y usar la aplicación de OpenClaw para la barra de menús de macOS
title: aplicación para macOS
x-i18n:
    generated_at: "2026-07-12T14:39:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6f15d0840b7ceb8ac4d82f2c67c060c4b7e8bd25cbb12c216b93be31cb2604b0
    source_path: platforms/macos.md
    workflow: 16
---

La aplicación para macOS es la **aplicación complementaria de la barra de menús** de OpenClaw: interfaz nativa de la bandeja, solicitudes de permisos de macOS, notificaciones, WebChat, entrada de voz, Canvas y herramientas de Node alojadas en el Mac, como `system.run`.

¿Solo se necesitan la CLI y el Gateway? Consulte [Primeros pasos](/es/start/getting-started).

## Descarga

Obtenga las compilaciones de la aplicación para macOS en las [versiones de OpenClaw en GitHub](https://github.com/openclaw/openclaw/releases).
Cuando una versión incluya recursos de la aplicación para macOS, busque:

- `OpenClaw-<version>.dmg` (preferido)
- `OpenClaw-<version>.zip`

Algunas versiones solo incluyen la CLI, evidencias o recursos para Windows. Si la versión más reciente no contiene ningún recurso de la aplicación para macOS, use la más reciente que sí lo contenga o compile desde el código fuente con la [configuración de desarrollo para macOS](/es/platforms/mac/dev-setup).

## Primera ejecución

1. Instale e inicie **OpenClaw.app**.
2. Elija **Este Mac** para usar un Gateway local o conéctese a un Gateway remoto.
3. Modo local: espere mientras la aplicación instala su entorno de ejecución en el espacio del usuario y el Gateway.
4. Establezca la inferencia mediante una comprobación con un modelo activo. Una vez superada, Crestodian se encarga del resto de la configuración.
5. Complete la lista de comprobación de permisos de macOS y envíe el mensaje de prueba de incorporación.

Si la aplicación accede a un Gateway existente cuyo agente predeterminado tiene configurado un modelo, considera que ese Gateway ya está configurado, omite la incorporación del proveedor y Crestodian, y abre el panel. Si no es posible conectarse al Gateway o su agente predeterminado no tiene ningún modelo, la incorporación de inferencia continúa disponible para la recuperación.

Para la ruta de configuración de la CLI y el Gateway, consulte [Primeros pasos](/es/start/getting-started).
Para recuperar permisos, consulte [Permisos de macOS](/es/platforms/mac/permissions).

## Actualizaciones

La tarjeta de actualización del panel actualiza primero la aplicación firmada para macOS mediante Sparkle.
Después de reiniciar la aplicación, esta actualiza y reinicia automáticamente el Gateway local correspondiente administrado por la aplicación. Las instalaciones de la CLI mediante Homebrew y otras instalaciones administradas por el usuario conservan el flujo normal de actualización del Gateway (la tarjeta ejecuta directamente la actualización del Gateway), y la reparación automática nunca instala una versión anterior a la de un Gateway más reciente ni anula la fijación del canal `extended-stable`.

Sparkle sigue el ajuste `update.channel` del Gateway. `beta` y `dev` habilitan las compilaciones beta de la aplicación; `stable`, `extended-stable` y los valores ausentes o desconocidos permanecen en las compilaciones estables de la aplicación.

## Abrir enlaces del panel

En el panel integrado de la aplicación para macOS, al hacer clic en un enlace web externo, este se abre en una barra lateral de navegador cuyo tamaño puede ajustarse. Cada enlace se abre en su propia pestaña; al volver a hacer clic en el mismo enlace, se reutiliza la pestaña existente. Arrastre las pestañas para reordenarlas, ciérrelas con el botón de cierre de la pestaña o con un clic central, y haga clic con el botón derecho en una pestaña para acceder a **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** y **Close Other Tabs**. Los controles de retroceso y avance de la barra de título de la ventana y los gestos del panel táctil permiten navegar por el historial del panel; los controles propios de retroceso y avance de la barra lateral permiten navegar por el historial de la pestaña activa. La barra lateral también incluye controles para recargar, abrir en el navegador predeterminado y cerrar, y recuerda su anchura.

Los controles de la barra de título siguen a la barra lateral de la aplicación: mientras está expandida, los controles de retroceso y avance se sitúan en su borde derecho, junto al conmutador de la barra lateral; mientras está contraída, dejan espacio a un botón de búsqueda (que abre la paleta de comandos) y a un botón de nueva sesión.

Haga clic con el botón derecho en un enlace externo para elegir **Open in Sidebar**, **Open in Default Browser** o **Copy Link**. Los clics modificados y los enlaces de nueva ventana activados por el usuario desde el panel se siguen abriendo en el navegador predeterminado; los enlaces de nueva ventana dentro de la barra lateral se abren como nuevas pestañas de la barra lateral. Las páginas normales de la interfaz de control alojadas en el navegador conservan el comportamiento habitual de los enlaces y del menú contextual del navegador.

## Importar inicios de sesión del navegador

Cuando la aplicación se ejecuta con un Gateway local y existe en el Mac un perfil de la familia Chrome con cookies, la ventana del panel muestra un banner descartable que ofrece copiar esas cookies a un perfil administrado y aislado que los agentes utilizan para navegar. Elija un perfil mediante el control **Import** del banner (puede que se requiera Touch ID); el progreso y el número de cookies importadas aparecen en línea, y solo se copian las cookies: las contraseñas nunca salen del navegador de origen. Al descartar el banner, se registra la elección; **Settings → General → Browser login → Import…** vuelve a ofrecerla en cualquier momento. Consulte [Navegador](/es/cli/browser) para conocer el flujo de importación subyacente y la restricción `browser.allowSystemProfileImport`.

## Elegir un modo de Gateway

| Modo   | Cuándo usarlo                                                                    | Página de detalles                                        |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| Local  | Este Mac debe ejecutar el Gateway y mantenerlo activo mediante launchd.                | [Gateway en macOS](/es/platforms/mac/bundled-gateway) |
| Remoto | Otro equipo ejecuta el Gateway; este Mac lo controla mediante SSH, LAN o Tailnet. | [Control remoto](/es/platforms/mac/remote)            |

El modo local requiere una CLI `openclaw` instalada. En un Mac nuevo, la aplicación instala automáticamente la CLI y el entorno de ejecución correspondientes antes de iniciar el asistente del Gateway.
Consulte [Gateway en macOS](/es/platforms/mac/bundled-gateway) para la recuperación manual.

## Qué administra la aplicación

- Estado de la barra de menús, notificaciones, estado general y WebChat.
- Solicitudes de permisos de macOS para la pantalla, el micrófono, el habla, la automatización y la accesibilidad.
- Herramientas locales de Node: Canvas, captura de la cámara o la pantalla, notificaciones y `system.run`.
- Solicitudes de aprobación de ejecución para comandos alojados en el Mac.
- Túneles SSH del modo remoto o conexiones directas al Gateway.

La aplicación **no** sustituye la documentación general del Gateway ni de la CLI. La configuración del Gateway, los proveedores, los plugins, los canales, las herramientas y la seguridad se describen en su propia documentación.

## Páginas detalladas de macOS

| Tarea                                     | Consulte                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Instalar o depurar el servicio de la CLI y el Gateway | [Gateway en macOS](/es/platforms/mac/bundled-gateway)                                          |
| Mantener el estado fuera de carpetas sincronizadas con la nube   | [Gateway en macOS](/es/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Depurar la detección y la conectividad de la aplicación     | [Gateway en macOS](/es/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| Comprender el comportamiento de launchd              | [Ciclo de vida del Gateway](/es/platforms/mac/child-process)                                           |
| Corregir problemas de permisos, firma o TCC    | [Permisos de macOS](/es/platforms/mac/permissions)                                             |
| Detectar el Mac utilizado más recientemente    | [Presencia del equipo activo](/es/nodes/presence)                                                 |
| Conectarse a un Gateway remoto              | [Control remoto](/es/platforms/mac/remote)                                                     |
| Consultar el estado de la barra de menús y las comprobaciones de estado   | [Barra de menús](/es/platforms/mac/menu-bar), [Comprobaciones de estado](/es/platforms/mac/health)                 |
| Usar la interfaz de chat integrada                 | [WebChat](/es/platforms/mac/webchat)                                                           |
| Usar la activación por voz o pulsar para hablar           | [Activación por voz](/es/platforms/mac/voicewake)                                                      |
| Usar Canvas y sus enlaces profundos         | [Canvas](/es/platforms/mac/canvas)                                                             |
| Alojar PeekabooBridge para automatizar la interfaz de usuario    | [Puente Peekaboo](/es/platforms/mac/peekaboo)                                                  |
| Configurar las aprobaciones de comandos              | [Aprobaciones de ejecución](/es/tools/exec-approvals), [detalles avanzados](/es/tools/exec-approvals-advanced) |
| Inspeccionar los comandos de Node del Mac y el IPC de la aplicación    | [IPC de macOS](/es/platforms/mac/xpc)                                                             |
| Capturar registros                             | [Registro de macOS](/es/platforms/mac/logging)                                                     |
| Compilar desde el código fuente                        | [Configuración de desarrollo para macOS](/es/platforms/mac/dev-setup)                                                 |

## Temas relacionados

- [Plataformas](/es/platforms)
- [Primeros pasos](/es/start/getting-started)
- [Gateway](/es/gateway)
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
