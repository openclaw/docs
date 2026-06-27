---
read_when:
    - Quieres compatibilidad con Zalo Personal (no oficial) en OpenClaw
    - Estás configurando o desarrollando el Plugin zalouser
summary: 'Plugin Zalo Personal: inicio de sesión con QR + mensajería mediante zca-js nativo (instalación del Plugin + configuración del canal + herramienta)'
title: Plugin personal de Zalo
x-i18n:
    generated_at: "2026-05-11T20:49:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Compatibilidad de Zalo Personal para OpenClaw mediante un Plugin, usando `zca-js` nativo para automatizar una cuenta normal de usuario de Zalo.

<Warning>
La automatización no oficial puede provocar la suspensión o el bloqueo de la cuenta. Úsela bajo su propia responsabilidad.
</Warning>

## Nomenclatura

El id de canal es `zalouser` para dejar explícito que esto automatiza una **cuenta personal de usuario de Zalo** (no oficial). Mantenemos `zalo` reservado para una posible integración futura con la API oficial de Zalo.

## Dónde se ejecuta

Este Plugin se ejecuta **dentro del proceso del Gateway**.

Si usa un Gateway remoto, instálelo/configúrelo en la **máquina que ejecuta el Gateway** y luego reinicie el Gateway.

No se requiere ningún binario externo de CLI `zca`/`openzca`.

## Instalación

### Opción A: instalar desde npm

```bash
openclaw plugins install @openclaw/zalouser
```

Use el paquete sin versión para seguir la etiqueta de versión oficial actual. Fije una
versión exacta solo cuando necesite una instalación reproducible.

Reinicie el Gateway después.

### Opción B: instalar desde una carpeta local (desarrollo)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Reinicie el Gateway después.

## Configuración

La configuración del canal reside bajo `channels.zalouser` (no `plugins.entries.*`):

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

## Herramienta de agente

Nombre de la herramienta: `zalouser`

Acciones: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Las acciones de mensaje de canal también admiten `react` para reacciones a mensajes.

## Relacionado

- [Crear plugins](/es/plugins/building-plugins)
- [ClawHub](/es/clawhub)
