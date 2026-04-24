---
read_when:
    - Vuoi il supporto a Zalo personale (non ufficiale) in OpenClaw
    - Stai configurando o sviluppando il Plugin zalouser
summary: 'Plugin Zalo personale: accesso tramite QR + messaggistica via `zca-js` nativo (installazione del Plugin + configurazione del canale + strumento)'
title: Plugin Zalo personale
x-i18n:
    generated_at: "2026-04-24T08:55:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d678bd55fd405a9c689d1202870cc03bfb825a9314c433a0ab729d376e3b67a3
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo personale (Plugin)

Supporto Zalo personale per OpenClaw tramite un Plugin, usando `zca-js` nativo per automatizzare un normale account utente Zalo.

> **Avviso:** l'automazione non ufficiale può comportare la sospensione/il ban dell'account. Usala a tuo rischio.

## Denominazione

L'ID del canale è `zalouser` per rendere esplicito che questo automatizza un **account utente personale Zalo** (non ufficiale). Manteniamo `zalo` riservato per una possibile futura integrazione ufficiale con l'API Zalo.

## Dove viene eseguito

Questo Plugin viene eseguito **all'interno del processo Gateway**.

Se usi un Gateway remoto, installalo/configuralo sulla **macchina che esegue il Gateway**, poi riavvia il Gateway.

Non è richiesto alcun binario CLI esterno `zca`/`openzca`.

## Installazione

### Opzione A: installazione da npm

```bash
openclaw plugins install @openclaw/zalouser
```

Riavvia il Gateway in seguito.

### Opzione B: installazione da una cartella locale (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Riavvia il Gateway in seguito.

## Configurazione

La configurazione del canale si trova sotto `channels.zalouser` (non `plugins.entries.*`):

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

## Strumento dell'agente

Nome dello strumento: `zalouser`

Azioni: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Le azioni messaggio del canale supportano anche `react` per le reazioni ai messaggi.

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins)
- [Plugin della community](/it/plugins/community)
