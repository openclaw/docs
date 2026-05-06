---
read_when:
    - Alojamiento de PeekabooBridge en OpenClaw.app
    - Integración de Peekaboo mediante Swift Package Manager
    - Cambiar el protocolo/las rutas de PeekabooBridge
    - Decidir entre PeekabooBridge, Codex Computer Use y cua-driver MCP
summary: Integración de PeekabooBridge para la automatización de la interfaz de usuario de macOS
title: Puente de cucú
x-i18n:
    generated_at: "2026-05-06T05:42:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw puede alojar **PeekabooBridge** como un intermediario local de automatización de UI con control de permisos. Esto permite que la CLI `peekaboo` controle la automatización de UI mientras reutiliza los permisos TCC de la app de macOS.

## Qué es esto (y qué no es)

- **Anfitrión**: OpenClaw.app puede actuar como anfitrión de PeekabooBridge.
- **Cliente**: usa la CLI `peekaboo` (sin una superficie `openclaw ui ...` separada).
- **UI**: las superposiciones visuales permanecen en Peekaboo.app; OpenClaw es un anfitrión intermediario ligero.

## Relación con Computer Use

OpenClaw tiene tres rutas de control de escritorio, y se mantienen separadas intencionalmente:

- **Anfitrión de PeekabooBridge**: OpenClaw.app puede alojar el socket local de PeekabooBridge. La CLI `peekaboo` sigue siendo el cliente y usa los permisos de macOS de OpenClaw.app para primitivas de automatización de Peekaboo como capturas de pantalla, clics, menús, diálogos, acciones del Dock y administración de ventanas.
- **Codex Computer Use**: el Plugin `codex` incluido prepara el servidor de app de Codex, verifica que el servidor MCP `computer-use` de Codex esté disponible y luego permite que Codex sea propietario de las llamadas a herramientas nativas de control de escritorio durante turnos en modo Codex. OpenClaw no redirige esas acciones a través de PeekabooBridge.
- **MCP directo de `cua-driver`**: OpenClaw puede registrar el servidor `cua-driver mcp` upstream de TryCua como un servidor MCP normal. Eso ofrece a los agentes los esquemas propios del controlador CUA y el flujo de trabajo de pid/ventana/índice de elemento sin enrutar a través del marketplace de Codex ni del socket de PeekabooBridge.

Usa Peekaboo cuando quieras la amplia superficie de automatización de macOS y el anfitrión de puente con control de permisos de OpenClaw.app. Usa Codex Computer Use cuando un agente en modo Codex deba depender del Plugin nativo de computer-use de Codex. Usa `cua-driver mcp` directo cuando quieras exponer el controlador CUA a cualquier runtime administrado por OpenClaw como un servidor MCP normal.

## Habilitar el puente

En la app de macOS:

- Configuración → **Habilitar Peekaboo Bridge**

Cuando está habilitado, OpenClaw inicia un servidor de socket UNIX local. Si está deshabilitado, el anfitrión se detiene y `peekaboo` recurrirá a otros anfitriones disponibles.

## Orden de descubrimiento de clientes

Los clientes de Peekaboo suelen probar anfitriones en este orden:

1. Peekaboo.app (UX completa)
2. Claude.app (si está instalada)
3. OpenClaw.app (intermediario ligero)

Usa `peekaboo bridge status --verbose` para ver qué anfitrión está activo y qué ruta de socket está en uso. Puedes sobrescribirla con:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Seguridad y permisos

- El puente valida **firmas de código del llamador**; se aplica una lista de permitidos de TeamIDs (TeamID del anfitrión Peekaboo + TeamID de la app OpenClaw).
- Las solicitudes agotan el tiempo de espera después de ~10 segundos.
- Si faltan permisos requeridos, el puente devuelve un mensaje de error claro en lugar de abrir Configuración del Sistema.

## Comportamiento de instantáneas (automatización)

Las instantáneas se almacenan en memoria y caducan automáticamente después de un intervalo breve. Si necesitas una retención más larga, vuelve a capturarlas desde el cliente.

## Solución de problemas

- Si `peekaboo` informa "bridge client is not authorized", asegúrate de que el cliente esté firmado correctamente o ejecuta el anfitrión con `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` solo en modo **debug**.
- Si no se encuentra ningún anfitrión, abre una de las apps anfitrionas (Peekaboo.app u OpenClaw.app) y confirma que se hayan concedido los permisos.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [permisos de macOS](/es/platforms/mac/permissions)
