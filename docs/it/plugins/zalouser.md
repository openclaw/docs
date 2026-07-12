---
read_when:
    - Vuoi il supporto per Zalo Personal (non ufficiale) in OpenClaw
    - Stai configurando o sviluppando il plugin zalouser
summary: 'Plugin Zalo Personal: accesso tramite codice QR + messaggistica mediante zca-js nativo (installazione del plugin + configurazione del canale + strumento)'
title: Plugin personale Zalo
x-i18n:
    generated_at: "2026-07-12T07:23:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

Supporto Zalo Personal per OpenClaw tramite un plugin che usa direttamente `zca-js` per
automatizzare un normale account utente Zalo. Non è richiesto alcun eseguibile CLI
esterno `zca`/`openzca`.

<Warning>
L'automazione non ufficiale può comportare la sospensione o il blocco dell'account. Usala a tuo rischio.
</Warning>

## Denominazione

L'id del canale è `zalouser` per indicare esplicitamente che automatizza un **account
utente Zalo personale** (non ufficiale). L'id canale separato `zalo` identifica
l'integrazione ufficiale inclusa per Zalo Bot/Webhook; consulta [Zalo](/it/channels/zalo).

## Dove viene eseguito

Questo plugin viene eseguito **all'interno del processo Gateway**. Per un Gateway remoto,
installalo e configuralo sull'host corrispondente, quindi riavvia il Gateway.

## Installazione

### Da npm

```bash
openclaw plugins install @openclaw/zalouser
```

Usa il pacchetto senza versione per seguire il tag della versione ufficiale corrente; specifica
una versione esatta solo quando ti serve un'installazione riproducibile. In seguito,
riavvia il Gateway.

### Da una cartella locale (sviluppo)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

In seguito, riavvia il Gateway.

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

Consulta [Configurazione del canale Zalo personale](/it/channels/zalouser) per il controllo
dell'accesso ai messaggi diretti e ai gruppi, la configurazione di più account, le variabili
d'ambiente e la risoluzione dei problemi.

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

## Strumento dell'agente

Nome dello strumento: `zalouser`

Azioni: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Le azioni dei messaggi del canale (non lo strumento dell'agente) supportano anche `react`
per le reazioni ai messaggi.

## Contenuti correlati

- [Configurazione del canale Zalo personale](/it/channels/zalouser)
- [Zalo (canale ufficiale Bot/Webhook)](/it/channels/zalo)
- [Creazione di plugin](/it/plugins/building-plugins)
- [ClawHub](/clawhub)
