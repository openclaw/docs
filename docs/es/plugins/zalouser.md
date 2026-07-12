---
read_when:
    - Quieres compatibilidad con Zalo Personal (no oficial) en OpenClaw
    - Estás configurando o desarrollando el plugin zalouser
summary: 'Plugin Zalo Personal: inicio de sesión con QR + mensajería mediante zca-js nativo (instalación del plugin + configuración del canal + herramienta)'
title: Plugin personal de Zalo
x-i18n:
    generated_at: "2026-07-11T23:24:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

Compatibilidad con Zalo Personal para OpenClaw mediante un plugin que utiliza `zca-js` nativo para automatizar una cuenta de usuario normal de Zalo. No se requiere ningún binario CLI externo de `zca`/`openzca`.

<Warning>
La automatización no oficial puede provocar la suspensión o el bloqueo de la cuenta. Úsela bajo su propia responsabilidad.
</Warning>

## Nomenclatura

El identificador del canal es `zalouser` para dejar explícito que automatiza una **cuenta personal de usuario de Zalo** (no oficial). El identificador de canal independiente `zalo` corresponde a la integración oficial incluida de Zalo Bot/Webhook; consulte [Zalo](/es/channels/zalo).

## Dónde se ejecuta

Este plugin se ejecuta **dentro del proceso del Gateway**. Para un Gateway remoto, instálelo y configúrelo en ese host y, a continuación, reinicie el Gateway.

## Instalación

### Desde npm

```bash
openclaw plugins install @openclaw/zalouser
```

Use el paquete sin especificar una versión para seguir la etiqueta de la versión oficial actual; fije una versión exacta solo cuando necesite una instalación reproducible. Después, reinicie el Gateway.

### Desde una carpeta local (desarrollo)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Después, reinicie el Gateway.

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

Consulte [Configuración del canal personal de Zalo](/es/channels/zalouser) para obtener información sobre el control de acceso a mensajes directos y grupos, la configuración de varias cuentas, las variables de entorno y la solución de problemas.

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

## Herramienta del agente

Nombre de la herramienta: `zalouser`

Acciones: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Las acciones de mensajes del canal (no la herramienta del agente) también admiten `react` para las reacciones a mensajes.

## Contenido relacionado

- [Configuración del canal personal de Zalo](/es/channels/zalouser)
- [Zalo (canal oficial de Bot/Webhook)](/es/channels/zalo)
- [Creación de plugins](/es/plugins/building-plugins)
- [ClawHub](/clawhub)
