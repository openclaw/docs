---
read_when:
    - Instalar la app de macOS
    - Decidir entre el modo Gateway local y remoto en macOS
    - Buscando descargas de la versión de la aplicación para macOS
summary: Instala y usa la app de barra de menús de macOS de OpenClaw
title: aplicación de macOS
x-i18n:
    generated_at: "2026-06-28T00:13:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

La aplicación de macOS es la **compañera de barra de menús** de OpenClaw. Úsala cuando quieras una
IU de bandeja nativa, solicitudes de permisos de macOS, notificaciones, WebChat, entrada de voz,
Canvas o herramientas de nodo alojadas en Mac como `system.run`.

Si solo necesitas la CLI y el Gateway, empieza con [Primeros pasos](/es/start/getting-started).

## Descargar

Descarga las compilaciones de la aplicación para macOS desde las
[versiones de OpenClaw en GitHub](https://github.com/openclaw/openclaw/releases).
Cuando una versión incluya recursos de la aplicación para macOS, busca:

- `OpenClaw-<version>.dmg` (preferido)
- `OpenClaw-<version>.zip`

Algunas versiones solo incluyen recursos de CLI, evidencia o Windows. Si la versión más reciente
no tiene ningún recurso de aplicación para macOS, usa la versión más reciente que sí lo tenga, o compila la
aplicación desde el código fuente con [configuración de desarrollo de macOS](/es/platforms/mac/dev-setup).

## Primera ejecución

1. Instala e inicia **OpenClaw.app**.
2. Completa la lista de comprobación de permisos de macOS.
3. Elige el modo **Local** o **Remoto**.
4. Instala la CLI `openclaw` si la aplicación lo solicita.
5. Abre WebChat desde la barra de menús y envía un mensaje de prueba.

Para la ruta de configuración de CLI/Gateway, usa [Primeros pasos](/es/start/getting-started).
Para recuperar permisos, usa [permisos de macOS](/es/platforms/mac/permissions).

## Elegir un modo de Gateway

| Modo   | Úsalo cuando                                                                             | Página de detalles                                  |
| ------ | --------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Local  | Este Mac debe ejecutar el Gateway y mantenerlo activo con launchd.                      | [Gateway en macOS](/es/platforms/mac/bundled-gateway)  |
| Remoto | Otro host ejecuta el Gateway y este Mac debe controlarlo por SSH, LAN o Tailnet.        | [Control remoto](/es/platforms/mac/remote)             |

El modo Local requiere una CLI `openclaw` instalada. La aplicación puede instalarla, o puedes
seguir [Gateway en macOS](/es/platforms/mac/bundled-gateway).

## Qué controla la aplicación

- Estado de la barra de menús, notificaciones, estado de salud y WebChat.
- Solicitudes de permisos de macOS para pantalla, micrófono, voz, automatización y accesibilidad.
- Herramientas de nodo locales como Canvas, captura de cámara/pantalla, notificaciones y `system.run`.
- Solicitudes de aprobación de ejecución para comandos alojados en Mac.
- Túneles SSH en modo remoto o conexiones directas al Gateway.

La aplicación **no** reemplaza al Gateway de OpenClaw ni la documentación general de la CLI. La
configuración principal del Gateway, proveedores, plugins, canales, herramientas y seguridad viven en
su propia documentación.

## Páginas detalladas de macOS

| Tarea                                    | Lee                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Instalar o depurar el servicio CLI/Gateway | [Gateway en macOS](/es/platforms/mac/bundled-gateway)                                        |
| Mantener el estado fuera de carpetas sincronizadas con la nube | [Gateway en macOS](/es/platforms/mac/bundled-gateway#state-directory-on-macos) |
| Depurar el descubrimiento y la conectividad de la aplicación | [Gateway en macOS](/es/platforms/mac/bundled-gateway#debug-app-connectivity)   |
| Entender el comportamiento de launchd    | [Ciclo de vida del Gateway](/es/platforms/mac/child-process)                                   |
| Corregir permisos o problemas de firma/TCC | [permisos de macOS](/es/platforms/mac/permissions)                                           |
| Conectarse a un Gateway remoto           | [Control remoto](/es/platforms/mac/remote)                                                     |
| Leer el estado de la barra de menús y las comprobaciones de salud | [Barra de menús](/es/platforms/mac/menu-bar), [Comprobaciones de salud](/es/platforms/mac/health) |
| Usar la IU de chat integrada             | [WebChat](/es/platforms/mac/webchat)                                                           |
| Usar activación por voz o pulsar para hablar | [Activación por voz](/es/platforms/mac/voicewake)                                           |
| Usar Canvas y enlaces profundos de Canvas | [Canvas](/es/platforms/mac/canvas)                                                            |
| Alojar PeekabooBridge para automatización de IU | [Puente Peekaboo](/es/platforms/mac/peekaboo)                                            |
| Configurar aprobaciones de comandos      | [Aprobaciones de ejecución](/es/tools/exec-approvals), [detalles avanzados](/es/tools/exec-approvals-advanced) |
| Inspeccionar comandos de nodo de Mac e IPC de la aplicación | [IPC de macOS](/es/platforms/mac/xpc)                                      |
| Capturar registros                       | [Registro de macOS](/es/platforms/mac/logging)                                                 |
| Compilar desde el código fuente          | [configuración de desarrollo de macOS](/es/platforms/mac/dev-setup)                            |

## Relacionado

- [Plataformas](/es/platforms)
- [Primeros pasos](/es/start/getting-started)
- [Gateway](/es/gateway)
- [Aprobaciones de ejecución](/es/tools/exec-approvals)
