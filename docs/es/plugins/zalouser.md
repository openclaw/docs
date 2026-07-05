---
read_when:
    - Quieres soporte para Zalo Personal (no oficial) en OpenClaw
    - Está configurando o desarrollando el plugin zalouser
summary: 'Plugin de Zalo Personal: inicio de sesión con QR + mensajería mediante zca-js nativo (instalación del plugin + configuración del canal + herramienta)'
title: Plugin personal de Zalo
x-i18n:
    generated_at: "2026-07-05T11:34:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

Compatibilidad de Zalo Personal con OpenClaw mediante un Plugin que usa `zca-js` nativo para
automatizar una cuenta de usuario normal de Zalo. No se requiere ningún binario
CLI externo de `zca`/`openzca`.

<Warning>
La automatización no oficial puede provocar la suspensión o el bloqueo de la cuenta. Úsala bajo tu propia responsabilidad.
</Warning>

## Nomenclatura

El id del canal es `zalouser` para dejar explícito que esto automatiza una **cuenta
personal de usuario de Zalo** (no oficial). El id de canal separado `zalo` es la integración oficial
incluida de Zalo Bot/Webhook - consulta [Zalo](/es/channels/zalo).

## Dónde se ejecuta

Este Plugin se ejecuta **dentro del proceso Gateway**. Para un Gateway remoto,
instálalo/configúralo en ese host y luego reinicia el Gateway.

## Instalación

### Desde npm

```bash
openclaw plugins install @openclaw/zalouser
```

Usa el paquete sin versión para seguir la etiqueta de versión oficial actual; fija una
versión exacta solo cuando necesites una instalación reproducible. Reinicia el Gateway
después.

### Desde una carpeta local (desarrollo)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Reinicia el Gateway después.

## Configuración

La configuración del canal reside en `channels.zalouser` (no en `plugins.entries.*`):

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

Consulta [configuración del canal personal de Zalo](/es/channels/zalouser) para el control de acceso
a DM/grupos, la configuración de varias cuentas, variables de entorno y solución de problemas.

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "name"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Herramienta de agente

Nombre de la herramienta: `zalouser`

Acciones: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Las acciones de mensajes de canal (no la herramienta de agente) también admiten `react` para
reacciones a mensajes.

## Relacionado

- [configuración del canal personal de Zalo](/es/channels/zalouser)
- [Zalo (canal oficial de Bot/Webhook)](/es/channels/zalo)
- [Creación de Plugins](/es/plugins/building-plugins)
- [ClawHub](/clawhub)
