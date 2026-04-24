---
read_when:
    - Quieres compatibilidad con Zalo Personal (no oficial) en OpenClaw
    - Estás configurando o desarrollando el Plugin zalouser
summary: 'Plugin de Zalo Personal: inicio de sesión por QR + mensajería mediante `zca-js` nativo (instalación del Plugin + configuración del canal + herramienta)'
title: Plugin de Zalo Personal
x-i18n:
    generated_at: "2026-04-24T05:43:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: d678bd55fd405a9c689d1202870cc03bfb825a9314c433a0ab729d376e3b67a3
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (Plugin)

Compatibilidad con Zalo Personal para OpenClaw mediante un Plugin, usando `zca-js` nativo para automatizar una cuenta normal de usuario de Zalo.

> **Advertencia:** La automatización no oficial puede provocar la suspensión o el bloqueo de la cuenta. Úsalo bajo tu propia responsabilidad.

## Nomenclatura

El id del canal es `zalouser` para dejar explícito que esto automatiza una **cuenta personal de usuario de Zalo** (no oficial). Mantenemos `zalo` reservado para una posible integración oficial futura con la API de Zalo.

## Dónde se ejecuta

Este Plugin se ejecuta **dentro del proceso de Gateway**.

Si usas un Gateway remoto, instálalo/configúralo en la **máquina que ejecuta Gateway** y luego reinicia Gateway.

No se requiere ningún binario CLI externo `zca`/`openzca`.

## Instalación

### Opción A: instalar desde npm

```bash
openclaw plugins install @openclaw/zalouser
```

Reinicia Gateway después.

### Opción B: instalar desde una carpeta local (desarrollo)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Reinicia Gateway después.

## Configuración

La configuración del canal vive bajo `channels.zalouser` (no `plugins.entries.*`):

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

Las acciones de mensaje del canal también admiten `react` para reacciones a mensajes.

## Relacionado

- [Crear Plugins](/es/plugins/building-plugins)
- [Plugins de la comunidad](/es/plugins/community)
