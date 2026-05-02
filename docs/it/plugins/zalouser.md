---
read_when:
    - Vuoi il supporto per Zalo Personal (non ufficiale) in OpenClaw
    - Stai configurando o sviluppando il Plugin zalouser
summary: 'Plugin Zalo Personal: accesso tramite QR + messaggistica tramite zca-js nativo (installazione del Plugin + configurazione del canale + strumento)'
title: Plugin personale Zalo
x-i18n:
    generated_at: "2026-05-02T22:21:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8bcead1a6425587a2cae40e4e817c45b9adf8afbfce6dc673065cc98353f844
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

Supporto di Zalo Personal per OpenClaw tramite un Plugin, usando `zca-js` nativo per automatizzare un normale account utente Zalo.

<Warning>
L'automazione non ufficiale può comportare la sospensione o il ban dell'account. Usala a tuo rischio.
</Warning>

## Denominazione

L'id del canale è `zalouser` per rendere esplicito che automatizza un **account utente Zalo personale** (non ufficiale). Manteniamo `zalo` riservato per una possibile futura integrazione ufficiale con l'API Zalo.

## Dove viene eseguito

Questo Plugin viene eseguito **all'interno del processo Gateway**.

Se utilizzi un Gateway remoto, installalo/configuralo sulla **macchina che esegue il Gateway**, quindi riavvia il Gateway.

Non è richiesto alcun binario CLI esterno `zca`/`openzca`.

## Installazione

### Opzione A: installazione da npm

```bash
openclaw plugins install @openclaw/zalouser
```

Usa il pacchetto bare per seguire il tag della release ufficiale corrente. Fissa una
versione esatta solo quando hai bisogno di un'installazione riproducibile.

Riavvia quindi il Gateway.

### Opzione B: installazione da una cartella locale (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Riavvia quindi il Gateway.

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

## Strumento agent

Nome dello strumento: `zalouser`

Azioni: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Le azioni dei messaggi del canale supportano anche `react` per le reazioni ai messaggi.

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins)
- [Plugin della community](/it/plugins/community)
