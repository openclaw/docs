---
read_when:
    - Vuoi il supporto Zalo Personal (non ufficiale) in OpenClaw
    - Stai configurando o sviluppando il plugin zalouser
summary: 'Plugin Zalo Personal: login tramite QR + messaggistica via `zca-js` nativo (installazione plugin + configurazione canale + tool)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-05T14:00:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3218c3ee34f36466d952aec1b479d451a6235c7c46918beb28698234a7fd0968
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (plugin)

Supporto Zalo Personal per OpenClaw tramite un plugin, usando `zca-js` nativo per automatizzare un normale account utente Zalo.

> **Warning:** L'automazione non ufficiale può portare alla sospensione/al ban dell'account. Usala a tuo rischio.

## Naming

L'id del canale è `zalouser` per rendere esplicito che automatizza un **account utente personale Zalo** (non ufficiale). Manteniamo `zalo` riservato per una possibile futura integrazione ufficiale con l'API Zalo.

## Dove viene eseguito

Questo plugin viene eseguito **all'interno del processo Gateway**.

Se usi un Gateway remoto, installalo/configuralo sulla **macchina che esegue il Gateway**, quindi riavvia il Gateway.

Non è richiesto alcun binario CLI esterno `zca`/`openzca`.

## Installazione

### Opzione A: installazione da npm

```bash
openclaw plugins install @openclaw/zalouser
```

Riavvia poi il Gateway.

### Opzione B: installazione da una cartella locale (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Riavvia poi il Gateway.

## Configurazione

La configurazione del canale si trova in `channels.zalouser` (non in `plugins.entries.*`):

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

## Tool dell'agente

Nome del tool: `zalouser`

Azioni: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Le azioni sui messaggi del canale supportano anche `react` per le reazioni ai messaggi.
