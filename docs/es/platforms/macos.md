---
read_when:
    - Instalar la app de macOS
    - Decidir entre el modo Gateway local y remoto en macOS
    - Buscando descargas de versiones de la app para macOS
summary: Instala y usa la app de OpenClaw para la barra de menús de macOS
title: app de macOS
x-i18n:
    generated_at: "2026-07-04T06:22:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

La app de macOS es la **compañera de barra de menús** de OpenClaw. Úsala cuando quieras una
interfaz nativa de bandeja, solicitudes de permisos de macOS, notificaciones, WebChat, entrada de voz,
Canvas o herramientas de nodo alojadas en Mac, como `system.run`.

Si solo necesitas la CLI y el Gateway, empieza con [Primeros pasos](/es/start/getting-started).

## Descarga

Descarga las compilaciones de la app de macOS desde los
[lanzamientos de OpenClaw en GitHub](https://github.com/openclaw/openclaw/releases).
Cuando un lanzamiento incluya recursos de la app de macOS, busca:

- `OpenClaw-<version>.dmg` (preferido)
- `OpenClaw-<version>.zip`

Algunos lanzamientos solo incluyen recursos de CLI, evidencia o Windows. Si el lanzamiento más reciente
no tiene ningún recurso de la app de macOS, usa el lanzamiento más reciente que sí lo tenga, o compila la
app desde el código fuente con [configuración de desarrollo de macOS](/es/platforms/mac/dev-setup).

## Primera ejecución

1. Instala e inicia **OpenClaw.app**.
2. Elige **Este Mac** para un Gateway local, o conéctate a un Gateway remoto.
3. En modo local, espera mientras la app instala su runtime de espacio de usuario y Gateway.
4. Completa la configuración del proveedor y la lista de comprobación de permisos de macOS.
5. Envía el mensaje de prueba de incorporación.

Para la ruta de configuración de la CLI/Gateway, usa [Primeros pasos](/es/start/getting-started).
Para recuperar permisos, usa [permisos de macOS](/es/platforms/mac/permissions).

## Elige un modo de Gateway

| Modo   | Cuándo usarlo                                                                            | Página de detalles                                  |
| ------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Local  | Este Mac debe ejecutar el Gateway y mantenerlo activo con launchd.                       | [Gateway en macOS](/es/platforms/mac/bundled-gateway) |
| Remoto | Otro host ejecuta el Gateway y este Mac debe controlarlo por SSH, LAN o Tailnet.         | [Control remoto](/es/platforms/mac/remote)            |

El modo local requiere una CLI `openclaw` instalada. En un Mac nuevo, la app instala
automáticamente la CLI y el runtime correspondientes antes de iniciar el asistente del Gateway.
Consulta [Gateway en macOS](/es/platforms/mac/bundled-gateway) para recuperación manual.

## Qué gestiona la app

- Estado de la barra de menús, notificaciones, estado de salud y WebChat.
- Solicitudes de permisos de macOS para pantalla, micrófono, voz, automatización y accesibilidad.
- Herramientas de nodo locales como Canvas, captura de cámara/pantalla, notificaciones y `system.run`.
- Solicitudes de aprobación de ejecución para comandos alojados en Mac.
- Túneles SSH en modo remoto o conexiones directas al Gateway.

La app **no** sustituye al Gateway de OpenClaw ni a la documentación general de la CLI. La configuración
principal del Gateway, los proveedores, plugins, canales, herramientas y seguridad tienen su propia
documentación.

## Páginas detalladas de macOS

| Tarea                                    | Leer                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Instalar o depurar el servicio CLI/Gateway | [Gateway en macOS](/es/platforms/mac/bundled-gateway)                                        |
| Mantener el estado fuera de carpetas sincronizadas con la nube | [Gateway en macOS](/es/platforms/mac/bundled-gateway#state-directory-on-macos) |
| Depurar el descubrimiento y la conectividad de la app | [Gateway en macOS](/es/platforms/mac/bundled-gateway#debug-app-connectivity)        |
| Entender el comportamiento de launchd    | [Ciclo de vida del Gateway](/es/platforms/mac/child-process)                                  |
| Corregir permisos o problemas de firma/TCC | [permisos de macOS](/es/platforms/mac/permissions)                                           |
| Conectarse a un Gateway remoto           | [Control remoto](/es/platforms/mac/remote)                                                     |
| Leer el estado de la barra de menús y las comprobaciones de salud | [Barra de menús](/es/platforms/mac/menu-bar), [Comprobaciones de salud](/es/platforms/mac/health) |
| Usar la interfaz de chat integrada       | [WebChat](/es/platforms/mac/webchat)                                                           |
| Usar activación por voz o pulsar para hablar | [Activación por voz](/es/platforms/mac/voicewake)                                           |
| Usar Canvas y enlaces profundos de Canvas | [Canvas](/es/platforms/mac/canvas)                                                            |
| Alojar PeekabooBridge para automatización de interfaz | [Puente Peekaboo](/es/platforms/mac/peekaboo)                                      |
| Configurar aprobaciones de comandos      | [Aprobaciones de ejecución](/es/tools/exec-approvals), [detalles avanzados](/es/tools/exec-approvals-advanced) |
| Inspeccionar comandos de nodo de Mac e IPC de la app | [IPC de macOS](/es/platforms/mac/xpc)                                               |
| Capturar registros                       | [Registro de macOS](/es/platforms/mac/logging)                                                 |
| Compilar desde el código fuente          | [Configuración de desarrollo de macOS](/es/platforms/mac/dev-setup)                            |

## Relacionado

- [Plataformas](/es/platforms)
- [Primeros pasos](/es/start/getting-started)
- [Gateway](/es/gateway)
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
