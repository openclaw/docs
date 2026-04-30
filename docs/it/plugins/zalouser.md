---
read_when:
    - Vuoi il supporto per Zalo Personal (non ufficiale) in OpenClaw
    - Stai configurando o sviluppando il Plugin zalouser
summary: 'Plugin Zalo Personal: accesso tramite QR + messaggistica via zca-js nativo (installazione del Plugin + configurazione del canale + strumento)'
title: Plugin personale Zalo
x-i18n:
    generated_at: "2026-04-30T09:07:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

Supporto per Zalo Personal in OpenClaw tramite un Plugin, usando `zca-js` nativo per automatizzare un normale account utente Zalo.

<Warning>
L'automazione non ufficiale può portare alla sospensione o al ban dell'account. Usala a tuo rischio.
</Warning>

## Nomenclatura

L'id del canale è `zalouser` per rendere esplicito che questo automatizza un **account utente Zalo personale** (non ufficiale). Manteniamo `zalo` riservato per una potenziale integrazione futura con l'API ufficiale di Zalo.

## Dove viene eseguito

Questo Plugin viene eseguito **all'interno del processo Gateway**.

Se usi un Gateway remoto, installalo/configuralo sulla **macchina che esegue il Gateway**, quindi riavvia il Gateway.

Non è richiesto alcun binario CLI esterno `zca`/`openzca`.

## Installazione

### Opzione A: installazione da npm

```bash
openclaw plugins install @openclaw/zalouser
```

Se npm segnala il pacchetto di proprietà di OpenClaw come deprecato, quella versione del pacchetto
proviene da una serie di pacchetti esterni precedente; usa una build OpenClaw pacchettizzata corrente oppure
il percorso della cartella locale finché non viene pubblicato un pacchetto npm più recente.

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

## Strumento dell'agente

Nome dello strumento: `zalouser`

Azioni: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Le azioni per i messaggi del canale supportano anche `react` per le reazioni ai messaggi.

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins)
- [Plugin della community](/it/plugins/community)
