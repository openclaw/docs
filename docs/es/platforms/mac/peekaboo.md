---
read_when:
    - Alojamiento de PeekabooBridge en OpenClaw.app
    - Integración de Peekaboo mediante Swift Package Manager
    - Cambiar el protocolo/las rutas de PeekabooBridge
    - Decidir entre PeekabooBridge, Codex Computer Use y cua-driver MCP
summary: Integración de PeekabooBridge para la automatización de la interfaz de usuario de macOS
title: Puente Peekaboo
x-i18n:
    generated_at: "2026-04-30T05:50:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92effdd6cfe4002fff2b8cd1092999f837e93694acf110eaebd30648b0a6946e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw puede alojar **PeekabooBridge** como un broker local de automatización de UI consciente de los permisos. Esto permite que la CLI `peekaboo` controle la automatización de UI mientras reutiliza los permisos TCC de la app de macOS.

## Qué es esto (y qué no es)

- **Host**: OpenClaw.app puede actuar como host de PeekabooBridge.
- **Cliente**: usa la CLI `peekaboo` (sin una superficie separada `openclaw ui ...`).
- **UI**: las superposiciones visuales permanecen en Peekaboo.app; OpenClaw es un host broker ligero.

## Relación con Computer Use

OpenClaw tiene tres rutas de control de escritorio, y se mantienen separadas intencionalmente:

- **Host de PeekabooBridge**: OpenClaw.app puede alojar el socket local de PeekabooBridge.
  La CLI `peekaboo` sigue siendo el cliente y usa los permisos de macOS de OpenClaw.app
  para primitivas de automatización de Peekaboo, como capturas de pantalla, clics,
  menús, diálogos, acciones del Dock y gestión de ventanas.
- **Codex Computer Use**: el Plugin `codex` incluido prepara el servidor de apps de Codex,
  verifica que el servidor MCP `computer-use` de Codex esté disponible y luego permite
  que Codex sea dueño de las llamadas a herramientas nativas de control de escritorio
  durante turnos en modo Codex. OpenClaw no retransmite esas acciones mediante PeekabooBridge.
- **MCP directo de `cua-driver`**: OpenClaw puede registrar el servidor
  `cua-driver mcp` upstream de TryCua como un servidor MCP normal. Eso proporciona a los agentes
  los propios esquemas del controlador CUA y el flujo de trabajo de pid/ventana/índice de elemento
  sin enrutar mediante el marketplace de Codex ni el socket de PeekabooBridge.

Usa Peekaboo cuando quieras la amplia superficie de automatización de macOS y el
host de puente consciente de permisos de OpenClaw.app. Usa Codex Computer Use cuando un agente en modo Codex
deba depender del Plugin nativo de computer-use de Codex. Usa `cua-driver mcp` directo
cuando quieras exponer el controlador CUA a cualquier runtime gestionado por OpenClaw como un servidor
MCP normal.

## Habilitar el puente

En la app de macOS:

- Ajustes → **Habilitar Peekaboo Bridge**

Cuando está habilitado, OpenClaw inicia un servidor de socket UNIX local. Si está deshabilitado, el host
se detiene y `peekaboo` recurrirá a otros hosts disponibles.

## Orden de descubrimiento del cliente

Los clientes de Peekaboo suelen probar los hosts en este orden:

1. Peekaboo.app (UX completa)
2. Claude.app (si está instalada)
3. OpenClaw.app (broker ligero)

Usa `peekaboo bridge status --verbose` para ver qué host está activo y qué
ruta de socket está en uso. Puedes anularla con:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Seguridad y permisos

- El puente valida **firmas de código del llamador**; se aplica una lista de TeamIDs
  permitidos (TeamID del host de Peekaboo + TeamID de la app OpenClaw).
- Las solicitudes caducan después de ~10 segundos.
- Si faltan permisos requeridos, el puente devuelve un mensaje de error claro
  en lugar de abrir Ajustes del Sistema.

## Comportamiento de instantáneas (automatización)

Las instantáneas se almacenan en memoria y caducan automáticamente después de un intervalo breve.
Si necesitas una retención más larga, vuelve a capturar desde el cliente.

## Solución de problemas

- Si `peekaboo` informa “el cliente del puente no está autorizado”, asegúrate de que el cliente esté
  firmado correctamente o ejecuta el host con `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  solo en modo **debug**.
- Si no se encuentra ningún host, abre una de las apps host (Peekaboo.app u OpenClaw.app)
  y confirma que los permisos estén concedidos.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [permisos de macOS](/es/platforms/mac/permissions)
