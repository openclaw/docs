---
read_when:
    - Je bouwt of refactort een ontvangstpad voor een Plugin voor berichtenkanalen
    - Je hebt gedeelde opbouw van inkomende context, sessieopname of verzending van voorbereide antwoorden nodig
    - Je migreert oude helpers voor kanaalbeurten naar inbound/message-API's
summary: 'Inkomende-eventhelpers voor kanaalplugins: contextopbouw, gedeelde runnerorchestratie, sessierecord en voorbereide antwoordverzending'
title: Kanaal-inbound-API
x-i18n:
    generated_at: "2026-06-27T18:05:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Kanaalplugins moeten ontvangstpaden modelleren met de zelfstandige naamwoorden `inbound` en `message`:

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

Gebruik `openclaw/plugin-sdk/channel-inbound` voor normalisatie,
opmaak, roots en orkestratie van inkomende events. Gebruik
`openclaw/plugin-sdk/channel-outbound` voor native
verzenden, ontvangstbevestiging, duurzame bezorging en livevoorbeeldgedrag.

## Kernhelpers

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: projecteer genormaliseerde kanaalgegevens naar
  de prompt-/sessiecontext. Gebruik `channelContext` om door het kanaal beheerde
  metadata van afzender/chat door te geven aan pluginhook `ctx.channelContext`; breid
  `PluginHookChannelSenderContext` of `PluginHookChannelChatContext` vanuit dit
  subpad uit voor kanaalspecifieke velden.
- `runChannelInboundEvent(...)`: voer ingest, classificatie, preflight, resolutie,
  registratie, dispatch en afronding uit voor één inkomend platformevent.
- `dispatchChannelInboundReply(...)`: registreer en dispatch een al samengesteld
  inkomend antwoord met een bezorgadapter.

De geïnjecteerde Plugin-runtime stelt dezelfde high-level helpers beschikbaar onder
`runtime.channel.inbound.*` voor gebundelde/native kanalen die het
runtimeobject al ontvangen.

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

Compatibiliteitsdispatchers moeten invoer voor `dispatchChannelInboundReply(...)`
samenstellen en platformbezorging in de bezorgadapter houden. Nieuwe verzendpaden moeten
de voorkeur geven aan berichtadapters en duurzame berichthelpers.

## Migratie

De oude runtimealiassen `runtime.channel.turn.*` zijn verwijderd. Gebruik:

- `runtime.channel.inbound.run(...)` voor ruwe inkomende events.
- `runtime.channel.inbound.dispatchReply(...)` voor samengestelde antwoordcontexten.
- `runtime.channel.inbound.buildContext(...)` voor payloads van inkomende context.
- `runtime.channel.inbound.runPreparedReply(...)` alleen voor door het kanaal beheerde voorbereide
  dispatchpaden die hun eigen dispatchclosure al samenstellen.

Nieuwe plugincode mag geen kanaal-API's met de naam `turn` introduceren. Houd model- of
agentturn-vocabulaire binnen agent-/providercode; kanaalplugins gebruiken termen voor inkomend,
bericht, bezorging en antwoord.
