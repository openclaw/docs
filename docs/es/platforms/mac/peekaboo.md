---
read_when:
    - Alojamiento de PeekabooBridge en OpenClaw.app
    - Integración de Peekaboo mediante Swift Package Manager
    - Cambio del protocolo o las rutas de PeekabooBridge
    - Cómo decidir entre PeekabooBridge, Codex Computer Use y cua-driver MCP
summary: Integración de PeekabooBridge para la automatización de la interfaz de usuario de macOS
title: Puente Peekaboo
x-i18n:
    generated_at: "2026-07-14T13:53:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw puede alojar **PeekabooBridge** como un intermediario local de automatización de la interfaz de usuario que tiene en cuenta los permisos (`PeekabooBridgeHostCoordinator`, respaldado por el paquete Swift `steipete/Peekaboo`). Esto permite que la CLI `peekaboo` controle la automatización de la interfaz de usuario mientras reutiliza los permisos TCC de la aplicación para macOS.

## Qué es (y qué no es)

- **Host**: OpenClaw.app puede actuar como host de PeekabooBridge.
- **Cliente**: la CLI `peekaboo` (no existe una interfaz `openclaw ui ...` independiente).
- **Interfaz de usuario**: las superposiciones visuales permanecen en Peekaboo.app; OpenClaw es un host intermediario ligero.

## Relación con otras vías de control del escritorio

OpenClaw tiene cuatro vías de control del escritorio que se mantienen separadas intencionadamente:

- **Host de PeekabooBridge**: OpenClaw.app aloja el socket local de PeekabooBridge. La CLI `peekaboo` es el cliente y utiliza los permisos de macOS de OpenClaw.app para capturas de pantalla, clics, menús, cuadros de diálogo, acciones del Dock y gestión de ventanas.
- **Uso del ordenador controlado por el agente (`computer.act`)**: la herramienta integrada `computer` del agente del Gateway realiza capturas de pantalla mediante `screen.snapshot` y controla el puntero y el teclado mediante el peligroso comando de nodo `computer.act`. Un nodo de macOS ejecuta `computer.act` dentro del proceso utilizando los servicios de automatización de Peekaboo integrados que expone este puente, además de primitivas limitadas de CoreGraphics, sin pasar por el socket de PeekabooBridge ni por la CLI `peekaboo`. Consulte [Uso del ordenador](/es/nodes/computer-use).
- **Codex Computer Use**: el plugin incluido `codex` comprueba y puede instalar el plugin MCP `computer-use` de Codex (`extensions/codex/src/app-server/computer-use.ts`) y, a continuación, permite que Codex gestione las llamadas a herramientas nativas de control del escritorio durante los turnos en modo Codex. OpenClaw no canaliza esas acciones mediante PeekabooBridge.
- **MCP `cua-driver` directo**: OpenClaw puede registrar el servidor `cua-driver mcp` original de TryCua como un servidor MCP normal, lo que proporciona a los agentes los esquemas propios del controlador CUA y su flujo de trabajo basado en pid/ventana/índice de elementos, sin enrutarlo a través del marketplace de Codex ni del socket de PeekabooBridge.

Utilice Peekaboo para acceder a la amplia funcionalidad de automatización de macOS mediante el host puente de OpenClaw.app que tiene en cuenta los permisos. Utilice el uso del ordenador controlado por el agente cuando el agente del Gateway deba ver y controlar el escritorio mediante un comando de nodo uniforme `computer.act` que cualquier modelo de visión pueda controlar. Utilice Codex Computer Use cuando un agente en modo Codex deba depender del plugin nativo de Codex. Utilice `cua-driver mcp` directamente para exponer el controlador CUA a cualquier entorno de ejecución gestionado por OpenClaw como un servidor MCP normal.

## Activar el puente

En la aplicación para macOS: **Settings -> Enable Peekaboo Bridge**. El interruptor requiere que **Allow Computer Control** esté activado, ya que ambos conceden automatización local de la interfaz de usuario; cuando Computer Control está desactivado, el interruptor está deshabilitado y el host no se ejecuta. Para controlar Peekaboo sin Computer Control, ejecute en su lugar la propia aplicación para Mac de Peekaboo como host.

Cuando está activado (y Computer Control está habilitado), OpenClaw inicia un servidor de socket UNIX local en `~/Library/Application Support/OpenClaw/<socket-name>`. Si está desactivado, el host se detiene y `peekaboo` recurre a otros hosts disponibles. El coordinador también mantiene enlaces simbólicos de sockets heredados (`clawdbot`, `clawdis`, `moltbot` en Application Support) que apuntan al socket actual para instalaciones anteriores de `peekaboo`.

## Orden de detección de clientes

Los clientes de Peekaboo suelen probar los hosts en este orden:

1. Peekaboo.app (experiencia de usuario completa)
2. Claude.app (si está instalada)
3. OpenClaw.app (intermediario ligero)

Utilice `peekaboo bridge status --verbose` para ver qué host está activo y qué ruta de socket se está utilizando. Sobrescríbala con:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Seguridad y permisos

- El puente valida las **firmas de código del solicitante**; se aplica una lista de TeamID permitidos (el TeamID del host de Peekaboo y el TeamID propio de la aplicación en ejecución).
- Para Accesibilidad, prefiera la identidad firmada del puente o de la aplicación antes que un entorno de ejecución genérico `node`. Conceder Accesibilidad a `node` permite que cualquier paquete iniciado por ese ejecutable de Node herede el acceso a la automatización de la interfaz gráfica; consulte [Permisos de macOS](/es/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Las solicitudes agotan el tiempo de espera tras 10 segundos (`requestTimeoutSec: 10`).
- Si faltan permisos necesarios, el puente devuelve un mensaje de error claro en lugar de iniciar System Settings.

## Comportamiento de las instantáneas (automatización)

Las instantáneas se almacenan en memoria con un periodo de validez de 10 minutos y un límite de 50 instantáneas (`InMemorySnapshotManager`); los artefactos no se eliminan durante la limpieza. Si se necesita conservarlos durante más tiempo, vuelva a realizar la captura desde el cliente.

## Solución de problemas

- Si `peekaboo` informa de que "el cliente del puente no está autorizado", asegúrese de que el cliente esté firmado correctamente o ejecute el host con `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` únicamente en modo **debug**.
- Si no se encuentra ningún host, abra una de las aplicaciones host (Peekaboo.app u OpenClaw.app) y confirme que se hayan concedido los permisos.

## Contenido relacionado

- [Aplicación para macOS](/es/platforms/macos)
- [Permisos de macOS](/es/platforms/mac/permissions)
