---
read_when:
    - Stai creando o rifattorizzando il percorso di ricezione di un plugin per canale di messaggistica
    - Ti serve la costruzione condivisa del contesto in ingresso, la registrazione delle sessioni o l'invio di risposte preparate
    - Stai migrando i vecchi helper dei turni del canale alle API inbound/message
summary: 'Helper per eventi in ingresso per Plugin di canale: creazione del contesto, orchestrazione del runner condiviso, record di sessione e invio della risposta preparata'
title: API in ingresso del canale
x-i18n:
    generated_at: "2026-06-27T18:00:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

I Plugin di canale dovrebbero modellare i percorsi di ricezione con i sostantivi inbound e message:

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

Usa `openclaw/plugin-sdk/channel-inbound` per la normalizzazione degli eventi inbound,
la formattazione, le root e l'orchestrazione. Usa
`openclaw/plugin-sdk/channel-outbound` per il comportamento nativo di
invio, ricevuta, consegna durevole e anteprima live.

## Helper Di Base

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: proietta i fatti di canale normalizzati nel
  contesto di prompt/sessione. Usa `channelContext` per passare i metadati
  sender/chat di proprietà del canale a `ctx.channelContext` dell'hook del Plugin; estendi
  `PluginHookChannelSenderContext` o `PluginHookChannelChatContext` da questo
  subpath per i campi specifici del canale.
- `runChannelInboundEvent(...)`: esegue ingest, classificazione, preflight, risoluzione,
  registrazione, dispatch e finalizzazione per un evento di piattaforma inbound.
- `dispatchChannelInboundReply(...)`: registra e invia una risposta inbound già assemblata
  con un adattatore di consegna.

Il runtime del Plugin iniettato espone gli stessi helper di alto livello sotto
`runtime.channel.inbound.*` per i canali in bundle/nativi che ricevono già
l'oggetto runtime.

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

I dispatcher di compatibilità dovrebbero assemblare gli input di `dispatchChannelInboundReply(...)`
e mantenere la consegna della piattaforma nell'adattatore di consegna. I nuovi percorsi di invio dovrebbero
preferire gli adattatori message e gli helper message durevoli.

## Migrazione

I vecchi alias runtime `runtime.channel.turn.*` sono stati rimossi. Usa:

- `runtime.channel.inbound.run(...)` per eventi inbound raw.
- `runtime.channel.inbound.dispatchReply(...)` per contesti di risposta assemblati.
- `runtime.channel.inbound.buildContext(...)` per payload di contesto inbound.
- `runtime.channel.inbound.runPreparedReply(...)` solo per percorsi di dispatch preparati
  di proprietà del canale che assemblano già la propria closure di dispatch.

Il nuovo codice Plugin non dovrebbe introdurre API di canale denominate `turn`. Mantieni il vocabolario
turn del modello o dell'agente nel codice agent/provider; i Plugin di canale usano i termini inbound,
message, delivery e reply.
