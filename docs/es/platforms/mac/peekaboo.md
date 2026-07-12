---
read_when:
    - Alojamiento de PeekabooBridge en OpenClaw.app
    - Integración de Peekaboo mediante Swift Package Manager
    - Cambio del protocolo o las rutas de PeekabooBridge
    - Cómo elegir entre PeekabooBridge, Codex Computer Use y cua-driver MCP
summary: Integración de PeekabooBridge para la automatización de la interfaz de usuario de macOS
title: Puente Peekaboo
x-i18n:
    generated_at: "2026-07-11T23:14:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw puede alojar **PeekabooBridge** como intermediario local de automatización de la interfaz de usuario que tiene en cuenta los permisos (`PeekabooBridgeHostCoordinator`, respaldado por el paquete Swift `steipete/Peekaboo`). Esto permite que la CLI `peekaboo` controle la automatización de la interfaz de usuario mientras reutiliza los permisos TCC de la aplicación de macOS.

## Qué es (y qué no es)

- **Host**: OpenClaw.app puede actuar como host de PeekabooBridge.
- **Cliente**: la CLI `peekaboo` (no existe una interfaz independiente `openclaw ui ...`).
- **Interfaz de usuario**: las superposiciones visuales permanecen en Peekaboo.app; OpenClaw es un host intermediario ligero.

## Relación con otras vías de control del escritorio

OpenClaw tiene cuatro vías de control del escritorio que se mantienen separadas de forma intencionada:

- **Host de PeekabooBridge**: OpenClaw.app aloja el socket local de PeekabooBridge. La CLI `peekaboo` es el cliente y utiliza los permisos de macOS de OpenClaw.app para capturas de pantalla, clics, menús, cuadros de diálogo, acciones del Dock y gestión de ventanas.
- **Uso del ordenador controlado por el agente (`computer.act`)**: la herramienta `computer` integrada del agente del Gateway captura imágenes de pantalla mediante `screen.snapshot` y controla el puntero y el teclado mediante el peligroso comando de Node `computer.act`. Un Node de macOS ejecuta `computer.act` dentro del proceso mediante los servicios integrados de automatización de Peekaboo que expone este puente y un conjunto limitado de primitivas de CoreGraphics, sin pasar por el socket de PeekabooBridge ni por la CLI `peekaboo`. Consulta [Uso del ordenador](/nodes/computer-use).
- **Codex Computer Use**: el Plugin `codex` incluido comprueba y puede instalar el Plugin MCP `computer-use` de Codex (`extensions/codex/src/app-server/computer-use.ts`) y, a continuación, permite que Codex controle las llamadas nativas a herramientas de control del escritorio durante los turnos en modo Codex. OpenClaw no redirige esas acciones a través de PeekabooBridge.
- **MCP `cua-driver` directo**: OpenClaw puede registrar el servidor `cua-driver mcp` original de TryCua como un servidor MCP normal, lo que proporciona a los agentes los esquemas propios del controlador CUA y su flujo de trabajo de pid/ventana/índice de elementos, sin pasar por el catálogo de Codex ni por el socket de PeekabooBridge.

Usa Peekaboo para acceder a la amplia superficie de automatización de macOS mediante el host de puente de OpenClaw.app que tiene en cuenta los permisos. Usa el control del ordenador dirigido por el agente cuando el agente del Gateway deba ver y controlar el escritorio mediante un comando de Node `computer.act` uniforme que pueda utilizar cualquier modelo de visión. Usa Codex Computer Use cuando un agente en modo Codex deba utilizar el Plugin nativo de Codex. Usa `cua-driver mcp` directamente para exponer el controlador CUA a cualquier entorno de ejecución gestionado por OpenClaw como un servidor MCP normal.

## Activar el puente

En la aplicación de macOS: **Settings -> Enable Peekaboo Bridge**.

Cuando está activado, OpenClaw inicia un servidor de socket UNIX local en `~/Library/Application Support/OpenClaw/<socket-name>`. Si está desactivado, el host se detiene y `peekaboo` recurre a otros hosts disponibles. El coordinador también mantiene enlaces simbólicos de sockets heredados (`clawdbot`, `clawdis` y `moltbot` en Application Support) que apuntan al socket actual para instalaciones antiguas de `peekaboo`.

## Orden de detección de clientes

Los clientes de Peekaboo suelen probar los hosts en este orden:

1. Peekaboo.app (experiencia de usuario completa)
2. Claude.app (si está instalada)
3. OpenClaw.app (intermediario ligero)

Usa `peekaboo bridge status --verbose` para ver qué host está activo y qué ruta de socket se está utilizando. Sobrescríbela con:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Seguridad y permisos

- El puente valida las **firmas de código del proceso que realiza la llamada**; se aplica una lista de permitidos de TeamIDs (el TeamID del host de Peekaboo y el TeamID propio de la aplicación en ejecución).
- Para Accesibilidad, prefiere la identidad firmada del puente o de la aplicación frente a un entorno de ejecución genérico de `node`. Conceder acceso de Accesibilidad a `node` permite que cualquier paquete iniciado por ese ejecutable de Node herede el acceso a la automatización de la interfaz gráfica; consulta [Permisos de macOS](/es/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Las solicitudes agotan el tiempo de espera después de 10 segundos (`requestTimeoutSec: 10`).
- Si faltan permisos obligatorios, el puente devuelve un mensaje de error claro en lugar de iniciar System Settings.

## Comportamiento de las instantáneas (automatización)

Las instantáneas se almacenan en memoria con una validez de 10 minutos y un límite de 50 instantáneas (`InMemorySnapshotManager`); los artefactos no se eliminan durante la limpieza. Si necesitas conservarlos durante más tiempo, vuelve a capturarlos desde el cliente.

## Solución de problemas

- Si `peekaboo` informa de que "el cliente del puente no está autorizado", asegúrate de que el cliente esté firmado correctamente o ejecuta el host con `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` únicamente en modo **depuración**.
- Si no se encuentra ningún host, abre una de las aplicaciones host (Peekaboo.app u OpenClaw.app) y confirma que se hayan concedido los permisos.

## Contenido relacionado

- [Aplicación de macOS](/es/platforms/macos)
- [Permisos de macOS](/es/platforms/mac/permissions)
