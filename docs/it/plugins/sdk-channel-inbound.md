---
read_when:
    - Stai creando o rifattorizzando il percorso di ricezione di un plugin per un canale di messaggistica
    - Ti occorre la costruzione condivisa del contesto in ingresso, la registrazione della sessione o l'invio di risposte predisposte
    - Stai migrando i vecchi helper dei turni dei canali alle API inbound/message
summary: 'Helper per gli eventi in ingresso dei Plugin di canale: creazione del contesto, orchestrazione del runner condiviso, record della sessione e invio della risposta preparata'
title: API in ingresso del canale
x-i18n:
    generated_at: "2026-07-12T07:20:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

I percorsi di ricezione dei canali seguono un unico flusso:

```text
evento della piattaforma -> dati/contesto in ingresso -> risposta dell'agente -> consegna del messaggio
```

Usa `openclaw/plugin-sdk/channel-inbound` per la normalizzazione degli eventi in ingresso,
la formattazione, le radici e l'orchestrazione. Usa
`openclaw/plugin-sdk/channel-outbound` per l'invio nativo, la ricevuta, la consegna
persistente e il comportamento dell'anteprima in tempo reale.

## Helper principali

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: proietta i dati normalizzati del canale
  nel contesto del prompt/della sessione. Passa i metadati del mittente/della chat
  gestiti dal canale tramite `channelContext`, che gli hook del plugin vedono come
  `ctx.channelContext`. Estendi `PluginHookChannelSenderContext` o
  `PluginHookChannelChatContext` da questo percorso secondario per i campi specifici
  del canale.
- `runChannelInboundEvent(...)`: esegue acquisizione, classificazione, verifica preliminare,
  risoluzione, registrazione, invio e finalizzazione per un evento della piattaforma
  in ingresso.
- `dispatchChannelInboundReply(...)`: registra e invia una risposta in ingresso
  già assemblata mediante un adattatore di consegna.

I canali integrati/nativi che ricevono già l'oggetto runtime del plugin inserito
possono chiamare gli stessi helper tramite `runtime.channel.inbound.*` anziché
importare direttamente questo percorso secondario:

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

Assembla gli input di `dispatchChannelInboundReply(...)` per i dispatcher di
compatibilità che mantengono la consegna alla piattaforma nell'adattatore di
consegna. I nuovi percorsi di invio devono invece usare gli adattatori dei messaggi
e gli helper per i messaggi persistenti di `channel-outbound`.

## Migrazione

Gli alias runtime `runtime.channel.turn.*` sono stati rimossi. Usa:

- `runtime.channel.inbound.run(...)` per gli eventi grezzi in ingresso.
- `runtime.channel.inbound.dispatchReply(...)` per i contesti di risposta assemblati.
- `runtime.channel.inbound.buildContext(...)` per i payload del contesto in ingresso.
- `runtime.channel.inbound.runPreparedReply(...)`, deprecato, solo per i
  percorsi di invio preparati gestiti dal canale che assemblano già la propria
  closure di invio.

Il nuovo codice dei plugin non deve introdurre API di canale con nomi contenenti
`turn`. Mantieni la terminologia relativa ai turni del modello o dell'agente nel
codice dell'agente/del provider; i plugin dei canali usano termini relativi a
ingresso, messaggio, consegna e risposta.
