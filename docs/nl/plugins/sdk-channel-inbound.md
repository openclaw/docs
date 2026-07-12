---
read_when:
    - Je bouwt of herstructureert het ontvangstpad van een Plugin voor een berichtenkanaal
    - U hebt gedeelde opbouw van binnenkomende context, sessieregistratie of voorbereide antwoordverzending nodig
    - Je migreert oude helpers voor kanaalbeurten naar API's voor inkomende berichten/berichten
summary: 'Helpers voor inkomende gebeurtenissen voor kanaalplugins: contextopbouw, gedeelde runner-orkestratie, sessierecord en voorbereide antwoordverzending'
title: API voor inkomende kanaalberichten
x-i18n:
    generated_at: "2026-07-12T09:09:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Ontvangstpaden van kanalen volgen één stroom:

```text
platformgebeurtenis -> inkomende feiten/context -> agentantwoord -> berichtbezorging
```

Gebruik `openclaw/plugin-sdk/channel-inbound` voor de normalisatie,
opmaak, basispaden en orkestratie van inkomende gebeurtenissen. Gebruik
`openclaw/plugin-sdk/channel-outbound` voor systeemeigen verzending, ontvangstbewijzen, duurzame
bezorging en gedrag voor livevoorbeelden.

## Kernhulpfuncties

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: projecteert genormaliseerde kanaalfeiten
  naar de prompt-/sessiecontext. Geef door het kanaal beheerde metadata over
  afzender/chat door via `channelContext`, die Plugin-hooks zien als
  `ctx.channelContext`. Breid `PluginHookChannelSenderContext` of
  `PluginHookChannelChatContext` vanuit dit subpad uit met kanaalspecifieke velden.
- `runChannelInboundEvent(...)`: voert opname, classificatie, voorafgaande controle,
  oplossing, registratie, verzending en afronding uit voor één inkomende platformgebeurtenis.
- `dispatchChannelInboundReply(...)`: registreert en verzendt een reeds
  samengesteld inkomend antwoord met een bezorgingsadapter.

Gebundelde/systeemeigen kanalen die het geïnjecteerde Plugin-runtimeobject al ontvangen,
kunnen dezelfde hulpfuncties aanroepen onder `runtime.channel.inbound.*` in plaats van
dit subpad rechtstreeks te importeren:

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

Stel invoer voor `dispatchChannelInboundReply(...)` samen voor compatibiliteitsdispatchers
die platformbezorging in de bezorgingsadapter houden. Nieuwe verzendpaden
moeten in plaats daarvan berichtadapters en hulpfuncties voor duurzame berichten uit
`channel-outbound` gebruiken.

## Migratie

Runtimealiassen van `runtime.channel.turn.*` zijn verwijderd. Gebruik:

- `runtime.channel.inbound.run(...)` voor onbewerkte inkomende gebeurtenissen.
- `runtime.channel.inbound.dispatchReply(...)` voor samengestelde antwoordcontexten.
- `runtime.channel.inbound.buildContext(...)` voor inkomende contextpayloads.
- `runtime.channel.inbound.runPreparedReply(...)`, afgeschaft, alleen voor
  door het kanaal beheerde voorbereide verzendpaden die hun eigen
  verzendclosure al samenstellen.

Nieuwe Plugincode mag geen kanaal-API's met `turn` in de naam introduceren. Houd terminologie
voor model- of agentbeurten binnen agent-/providercode; kanaalplugins gebruiken termen
voor inkomend verkeer, berichten, bezorging en antwoorden.
