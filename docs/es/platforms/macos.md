---
read_when:
    - Instalación de la aplicación para macOS
    - Decidir entre el modo Gateway local y remoto en macOS
    - Buscando descargas de versiones de la aplicación para macOS
summary: Instalar y usar la aplicación de OpenClaw para la barra de menús de macOS
title: Aplicación para macOS
x-i18n:
    generated_at: "2026-07-12T21:23:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ef3ea75aa2f158829da643ca016681e40102cc4fad84e207e80b377d023c2e1f
    source_path: platforms/macos.md
    workflow: 16
---

La aplicación para macOS es el **complemento de la barra de menús** de OpenClaw: interfaz nativa de la bandeja, solicitudes de permisos de macOS, notificaciones, WebChat, entrada de voz, Canvas y herramientas de Node alojadas en el Mac, como `system.run`.

¿Solo se necesitan la CLI y el Gateway? Se puede empezar por [Primeros pasos](/es/start/getting-started).

## Descarga

Las compilaciones de la aplicación para macOS están disponibles en las [versiones de OpenClaw en GitHub](https://github.com/openclaw/openclaw/releases).
Cuando una versión incluya recursos de la aplicación para macOS, se deben buscar:

- `OpenClaw-<version>.dmg` (preferido)
- `OpenClaw-<version>.zip`

Algunas versiones solo incluyen la CLI, pruebas o recursos para Windows. Si la versión más reciente no incluye ningún recurso de la aplicación para macOS, se debe usar la más reciente que sí lo incluya o compilar desde el código fuente con la [configuración de desarrollo para macOS](/es/platforms/mac/dev-setup).

## Primera ejecución

1. Instalar e iniciar **OpenClaw.app**.
2. Elegir **This Mac** para un Gateway local o conectarse a un Gateway remoto.
3. Esperar mientras la aplicación instala el entorno de ejecución de la CLI correspondiente. En modo local, también instala e inicia el Gateway.
4. Establecer la inferencia mediante una comprobación con un modelo activo. Una vez superada, Crestodian se encarga del resto de la configuración.
5. Completar la lista de comprobación de permisos de macOS y enviar el mensaje de prueba de incorporación.

Si la aplicación llega a un Gateway existente cuyo agente predeterminado tiene un modelo configurado, considera que ese Gateway ya está configurado, omite la incorporación del proveedor y Crestodian, y abre el panel. Si el Gateway no puede conectarse o su agente predeterminado no tiene ningún modelo, la incorporación de inferencia sigue disponible para la recuperación.

Para la configuración mediante la CLI y el Gateway, se debe consultar [Primeros pasos](/es/start/getting-started).
Para recuperar permisos, se debe consultar [Permisos de macOS](/es/platforms/mac/permissions).

## Actualizaciones

La tarjeta de actualización del panel actualiza primero la aplicación firmada para macOS mediante Sparkle. Después de que la aplicación se reinicie, actualiza y reinicia automáticamente el Gateway local correspondiente administrado por la aplicación. Las instalaciones de la CLI mediante Homebrew y otras instalaciones administradas por el usuario conservan el flujo normal de actualización del Gateway (la tarjeta ejecuta directamente la actualización del Gateway), y la reparación automática nunca instala una versión anterior a la de un Gateway más reciente ni anula la fijación del canal `extended-stable`.

Sparkle sigue el ajuste `update.channel` del Gateway. `beta` y `dev` habilitan las compilaciones beta de la aplicación; `stable`, `extended-stable` y los valores ausentes o desconocidos permanecen en las compilaciones estables de la aplicación.

## Abrir enlaces del panel

En el panel integrado de la aplicación para macOS, al hacer clic en un enlace web externo, este se abre en una barra lateral de navegador cuyo tamaño puede modificarse. Cada enlace se abre en su propia pestaña; al volver a hacer clic en el mismo enlace, se reutiliza la pestaña existente. Se pueden arrastrar las pestañas para reordenarlas, cerrarlas con el botón de cierre de la pestaña o con un clic central, y hacer clic con el botón derecho en una pestaña para acceder a **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** y **Close Other Tabs**. Los controles de retroceso y avance de la barra de título de la ventana y los gestos de deslizamiento del trackpad permiten navegar por el historial del panel; los controles propios de retroceso y avance de la barra lateral permiten navegar por el historial de la pestaña activa. La barra lateral también dispone de controles para recargar, abrir en el navegador predeterminado y cerrar, y recuerda su anchura.

Los controles de la barra de título siguen a la barra lateral de la aplicación: mientras está expandida, los botones de retroceso y avance se sitúan en su borde derecho, junto al control para alternar la barra lateral; mientras está contraída, dejan sitio a un botón de búsqueda (que abre la paleta de comandos) y a un botón de nueva sesión.

Se puede hacer clic con el botón derecho en un enlace externo para elegir **Open in Sidebar**, **Open in Default Browser** o **Copy Link**. Los clics con teclas modificadoras y los enlaces de ventana nueva activados por el usuario desde el panel siguen abriéndose en el navegador predeterminado; los enlaces de ventana nueva dentro de la barra lateral se abren como pestañas nuevas de la barra lateral. Las páginas normales de la interfaz de control alojadas en el navegador conservan el comportamiento habitual del navegador para los enlaces y el menú contextual.

## Importar sesiones del navegador

Cuando la aplicación se ejecuta con un Gateway local y existe en el Mac un perfil de la familia Chrome con cookies, la ventana del panel muestra un banner descartable que ofrece copiar esas cookies a un perfil administrado y aislado que los agentes utilizan para navegar. Se debe elegir un perfil mediante el control **Import** del banner (puede ser necesario usar Touch ID); el progreso y la cantidad de cookies importadas aparecen en línea, y solo se copian las cookies: las contraseñas nunca salen del navegador de origen. Al descartar el banner, se registra la elección; **Settings → General → Browser login → Import…** vuelve a ofrecerla en cualquier momento. Se puede consultar [Navegador](/es/cli/browser) para conocer el flujo de importación subyacente y la restricción `browser.allowSystemProfileImport`.

## Elegir un modo de Gateway

| Modo   | Cuándo usarlo                                                                   | Página de detalles                                  |
| ------ | ------------------------------------------------------------------------------- | --------------------------------------------------- |
| Local  | Cuando este Mac deba ejecutar el Gateway y mantenerlo activo mediante launchd.  | [Gateway en macOS](/es/platforms/mac/bundled-gateway)  |
| Remoto | Cuando otro host ejecute el Gateway y este Mac lo controle mediante SSH, LAN o Tailnet. | [Control remoto](/es/platforms/mac/remote)       |

Ambos modos requieren una CLI `openclaw` instalada porque la aplicación reutiliza su entorno de ejecución del host de Node. En un Mac nuevo, la aplicación instala automáticamente la CLI correspondiente; el modo local inicia después el asistente del Gateway, mientras que el modo remoto se conecta al Gateway seleccionado sin iniciar un segundo Gateway local.
Para la recuperación manual, se debe consultar [Gateway en macOS](/es/platforms/mac/bundled-gateway).

## Componentes administrados por la aplicación

- Estado de la barra de menús, notificaciones, estado operativo y WebChat.
- Solicitudes de permisos de macOS para la pantalla, el micrófono, el reconocimiento de voz, la automatización y la accesibilidad.
- Un Node de Mac que combina Canvas nativo, captura de cámara y pantalla, notificaciones, ubicación y control del equipo con los comandos del sistema, navegador, plugins, Skills y MCP del host de Node de la CLI.
- Solicitudes de aprobación de ejecución para comandos alojados en el Mac.
- Ejecución en el contexto de la aplicación para comandos de shell aprobados, conservando la atribución de permisos de macOS a la aplicación mientras el entorno de ejecución de la CLI administra la política compartida de Node.
- Túneles SSH en modo remoto o conexiones directas con el Gateway.

La aplicación **no** sustituye la documentación general de la CLI ni del Gateway. La configuración del Gateway, los proveedores, los plugins, los canales, las herramientas y la seguridad se describen en sus propias páginas de documentación.

## Páginas detalladas de macOS

| Tarea                                      | Lectura                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Instalar o depurar el servicio de CLI/Gateway | [Gateway en macOS](/es/platforms/mac/bundled-gateway)                                       |
| Mantener el estado fuera de las carpetas sincronizadas con la nube | [Gateway en macOS](/es/platforms/mac/bundled-gateway#state-directory-on-macos) |
| Depurar la detección y conectividad de la aplicación | [Gateway en macOS](/es/platforms/mac/bundled-gateway#debug-app-connectivity)            |
| Comprender el comportamiento de launchd    | [Ciclo de vida del Gateway](/es/platforms/mac/child-process)                                   |
| Corregir problemas de permisos o firma/TCC | [Permisos de macOS](/es/platforms/mac/permissions)                                             |
| Detectar el Mac utilizado más recientemente | [Presencia del equipo activo](/es/nodes/presence)                                             |
| Conectarse a un Gateway remoto             | [Control remoto](/es/platforms/mac/remote)                                                     |
| Consultar el estado de la barra de menús y las comprobaciones de estado | [Barra de menús](/es/platforms/mac/menu-bar), [Comprobaciones de estado](/es/platforms/mac/health) |
| Usar la interfaz de chat integrada         | [WebChat](/es/platforms/mac/webchat)                                                           |
| Usar la activación por voz o pulsar para hablar | [Activación por voz](/es/platforms/mac/voicewake)                                          |
| Usar Canvas y sus enlaces profundos        | [Canvas](/es/platforms/mac/canvas)                                                             |
| Alojar PeekabooBridge para la automatización de la interfaz | [Puente de Peekaboo](/es/platforms/mac/peekaboo)                              |
| Configurar las aprobaciones de comandos    | [Aprobaciones de ejecución](/es/tools/exec-approvals), [detalles avanzados](/es/tools/exec-approvals-advanced) |
| Inspeccionar los comandos del Node de Mac y el IPC de la aplicación | [IPC de macOS](/es/platforms/mac/xpc)                                      |
| Capturar registros                         | [Registro de macOS](/es/platforms/mac/logging)                                                 |
| Compilar desde el código fuente            | [Configuración de desarrollo para macOS](/es/platforms/mac/dev-setup)                          |

## Contenido relacionado

- [Plataformas](/es/platforms)
- [Primeros pasos](/es/start/getting-started)
- [Gateway](/es/gateway)
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
