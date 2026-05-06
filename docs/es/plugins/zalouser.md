---
read_when:
    - Quieres compatibilidad con Zalo Personal (no oficial) en OpenClaw
    - Está configurando o desarrollando el Plugin zalouser
summary: 'Plugin Zalo Personal: inicio de sesión con QR + mensajería mediante zca-js nativo (instalación del Plugin + configuración del canal + herramienta)'
title: Plugin personal de Zalo
x-i18n:
    generated_at: "2026-05-06T17:59:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423325f99ddb5b39bba4c5f3aa71215edfdc092c872f92b5d2f00b6ea691246f
    source_path: plugins/zalouser.md
    workflow: 16
---

Compatibilidad de Zalo Personal con OpenClaw mediante un Plugin, usando `zca-js` nativo para automatizar una cuenta normal de usuario de Zalo.

<Warning>
La automatización no oficial puede provocar la suspensión o el veto de la cuenta. Úsalo bajo tu propio riesgo.
</Warning>

## Nomenclatura

El id del canal es `zalouser` para dejar explícito que automatiza una **cuenta personal de usuario de Zalo** (no oficial). Mantenemos `zalo` reservado para una posible integración futura con la API oficial de Zalo.

## Dónde se ejecuta

Este Plugin se ejecuta **dentro del proceso Gateway**.

Si usas un Gateway remoto, instálalo/configúralo en la **máquina que ejecuta el Gateway** y luego reinicia el Gateway.

No se requiere ningún binario CLI externo de `zca`/`openzca`.

## Instalación

### Opción A: instalar desde npm

```bash
openclaw plugins install @openclaw/zalouser
```

Usa el paquete sin prefijo para seguir la etiqueta de versión oficial actual. Fija una versión exacta solo cuando necesites una instalación reproducible.

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

Las acciones de mensajes de canal también admiten `react` para reacciones a mensajes.

## Relacionado

- [Creación de Plugins](/es/plugins/building-plugins)
- [Plugins de la comunidad](/es/plugins/community)
