---
read_when:
    - Quieres compatibilidad con Zalo Personal (no oficial) en OpenClaw
    - Está configurando o desarrollando el Plugin zalouser
summary: 'Plugin Zalo Personal: inicio de sesión con QR + mensajería mediante zca-js nativo (instalación del Plugin + configuración del canal + herramienta)'
title: Plugin personal de Zalo
x-i18n:
    generated_at: "2026-05-02T22:21:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8bcead1a6425587a2cae40e4e817c45b9adf8afbfce6dc673065cc98353f844
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (plugin)

Compatibilidad de Zalo Personal para OpenClaw mediante un plugin, usando `zca-js` nativo para automatizar una cuenta normal de usuario de Zalo.

<Warning>
La automatización no oficial puede provocar la suspensión o prohibición de la cuenta. Úsala bajo tu propia responsabilidad.
</Warning>

## Nomenclatura

El id del canal es `zalouser` para dejar explícito que esto automatiza una **cuenta personal de usuario de Zalo** (no oficial). Mantenemos `zalo` reservado para una posible integración oficial futura con la API de Zalo.

## Dónde se ejecuta

Este plugin se ejecuta **dentro del proceso Gateway**.

Si usas un Gateway remoto, instálalo/configúralo en la **máquina que ejecuta el Gateway** y luego reinicia el Gateway.

No se requiere ningún binario externo de CLI `zca`/`openzca`.

## Instalación

### Opción A: instalar desde npm

```bash
openclaw plugins install @openclaw/zalouser
```

Usa el paquete base para seguir la etiqueta de versión oficial actual. Fija una versión exacta solo cuando necesites una instalación reproducible.

Reinicia el Gateway después.

### Opción B: instalar desde una carpeta local (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Reinicia el Gateway después.

## Configuración

La configuración del canal está en `channels.zalouser` (no en `plugins.entries.*`):

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

- [Crear plugins](/es/plugins/building-plugins)
- [Plugins de la comunidad](/es/plugins/community)
