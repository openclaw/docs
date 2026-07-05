---
read_when:
    - Alojar PeekabooBridge en OpenClaw.app
    - Integración de Peekaboo mediante Swift Package Manager
    - Cambiar el protocolo/las rutas de PeekabooBridge
    - Decidir entre PeekabooBridge, Codex Computer Use y cua-driver MCP
summary: Integración de PeekabooBridge para automatización de la interfaz de usuario de macOS
title: Puente Peekaboo
x-i18n:
    generated_at: "2026-07-05T11:29:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54749a292f92d6b9fe88a0efb1f263b3a5576a600588324d7da53a4cd24f12cd
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw puede alojar **PeekabooBridge** como un intermediario local de automatización de UI consciente de permisos (`PeekabooBridgeHostCoordinator`, respaldado por el paquete Swift `steipete/Peekaboo`). Esto permite que la CLI `peekaboo` controle la automatización de UI reutilizando los permisos TCC de la app de macOS.

## Qué es esto (y qué no es)

- **Host**: OpenClaw.app puede actuar como host de PeekabooBridge.
- **Cliente**: la CLI `peekaboo` (no hay una superficie `openclaw ui ...` separada).
- **UI**: las superposiciones visuales permanecen en Peekaboo.app; OpenClaw es un host intermediario ligero.

## Relación con otras rutas de control de escritorio

OpenClaw tiene tres rutas de control de escritorio que se mantienen separadas intencionalmente:

- **Host de PeekabooBridge**: OpenClaw.app aloja el socket local de PeekabooBridge. La CLI `peekaboo` es el cliente y usa los permisos de macOS de OpenClaw.app para capturas de pantalla, clics, menús, cuadros de diálogo, acciones del Dock y gestión de ventanas.
- **Codex Computer Use**: el Plugin `codex` incluido comprueba y puede instalar el Plugin MCP `computer-use` de Codex (`extensions/codex/src/app-server/computer-use.ts`), y luego permite que Codex sea propietario de las llamadas de herramientas nativas de control de escritorio durante turnos en modo Codex. OpenClaw no redirige esas acciones a través de PeekabooBridge.
- **MCP directo `cua-driver`**: OpenClaw puede registrar el servidor `cua-driver mcp` upstream de TryCua como un servidor MCP normal, lo que da a los agentes los esquemas propios del controlador CUA y el flujo de trabajo de pid/ventana/índice de elemento sin enrutar a través del marketplace de Codex ni del socket de PeekabooBridge.

Usa Peekaboo para la amplia superficie de automatización de macOS mediante el host puente consciente de permisos de OpenClaw.app. Usa Codex Computer Use cuando un agente en modo Codex deba depender del Plugin nativo de Codex. Usa `cua-driver mcp` directo para exponer el controlador CUA a cualquier runtime gestionado por OpenClaw como un servidor MCP normal.

## Activar el puente

En la app de macOS: **Configuración -> Activar Peekaboo Bridge**.

Cuando está activado, OpenClaw inicia un servidor de socket UNIX local en `~/Library/Application Support/OpenClaw/<socket-name>`. Si se desactiva, el host se detiene y `peekaboo` recurre a otros hosts disponibles. El coordinador también mantiene enlaces simbólicos de sockets heredados (`clawdbot`, `clawdis`, `moltbot` en Application Support) que apuntan al socket actual para instalaciones antiguas de `peekaboo`.

## Orden de descubrimiento del cliente

Los clientes de Peekaboo suelen probar hosts en este orden:

1. Peekaboo.app (UX completa)
2. Claude.app (si está instalada)
3. OpenClaw.app (intermediario ligero)

Usa `peekaboo bridge status --verbose` para ver qué host está activo y qué ruta de socket se está usando. Sobrescríbelo con:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Seguridad y permisos

- El puente valida **firmas de código del llamador**; se aplica una lista de permitidos de TeamIDs (el TeamID del host de Peekaboo más el TeamID propio de la app en ejecución).
- Prefiere la identidad firmada del puente/app en lugar de un runtime genérico `node` para Accesibilidad. Conceder Accesibilidad a `node` permite que cualquier paquete iniciado por ese ejecutable de Node herede acceso de automatización de GUI; consulta [permisos de macOS](/es/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Las solicitudes agotan el tiempo de espera tras 10 segundos (`requestTimeoutSec: 10`).
- Si faltan permisos necesarios, el puente devuelve un mensaje de error claro en lugar de abrir Configuración del Sistema.

## Comportamiento de instantáneas (automatización)

Las instantáneas se almacenan en memoria con una ventana de validez de 10 minutos y un límite de 50 instantáneas (`InMemorySnapshotManager`); los artefactos no se eliminan durante la limpieza. Si necesitas una retención más larga, vuelve a capturar desde el cliente.

## Solución de problemas

- Si `peekaboo` informa "bridge client is not authorized", asegúrate de que el cliente esté firmado correctamente o ejecuta el host con `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` solo en modo **debug**.
- Si no se encuentran hosts, abre una de las apps host (Peekaboo.app u OpenClaw.app) y confirma que los permisos estén concedidos.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [permisos de macOS](/es/platforms/mac/permissions)
