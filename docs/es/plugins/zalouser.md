---
read_when:
    - Quieres compatibilidad con Zalo Personal (no oficial) en OpenClaw
    - Estás configurando o desarrollando el Plugin zalouser
summary: 'Plugin Zalo Personal: inicio de sesión con QR + mensajería mediante zca-js nativo (instalación del Plugin + configuración del canal + herramienta)'
title: Plugin personal de Zalo
x-i18n:
    generated_at: "2026-04-30T05:56:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

Compatibilidad de Zalo Personal para OpenClaw mediante un Plugin, usando `zca-js` nativo para automatizar una cuenta normal de usuario de Zalo.

<Warning>
La automatización no oficial puede provocar la suspensión o el bloqueo de la cuenta. Úsala bajo tu propia responsabilidad.
</Warning>

## Nomenclatura

El id del canal es `zalouser` para dejar explícito que esto automatiza una **cuenta personal de usuario de Zalo** (no oficial). Mantenemos `zalo` reservado para una posible integración futura con la API oficial de Zalo.

## Dónde se ejecuta

Este Plugin se ejecuta **dentro del proceso Gateway**.

Si usas un Gateway remoto, instálalo/configúralo en la **máquina que ejecuta el Gateway** y luego reinicia el Gateway.

No se requiere ningún binario CLI externo de `zca`/`openzca`.

## Instalación

### Opción A: instalar desde npm

```bash
openclaw plugins install @openclaw/zalouser
```

Si npm informa que el paquete propiedad de OpenClaw está obsoleto, esa versión del paquete proviene de una línea de paquetes externa anterior; usa una compilación empaquetada actual de OpenClaw o la ruta de la carpeta local hasta que se publique un paquete npm más reciente.

Reinicia el Gateway después.

### Opción B: instalar desde una carpeta local (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Reinicia el Gateway después.

## Configuración

La configuración del canal se encuentra en `channels.zalouser` (no en `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Herramienta del agente

Nombre de la herramienta: `zalouser`

Acciones: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Las acciones de mensajes del canal también admiten `react` para reacciones a mensajes.

## Relacionado

- [Creación de Plugins](/es/plugins/building-plugins)
- [Plugins de la comunidad](/es/plugins/community)
