---
read_when:
    - Sie erstellen oder refaktorieren einen Empfangspfad für ein Messaging-Channel-Plugin
    - Sie benötigen die gemeinsame Erstellung von Inbound-Kontexten, Sitzungsaufzeichnung oder den Versand vorbereiteter Antworten
    - Sie migrieren alte Hilfsfunktionen für Kanal-Turns auf Inbound-/Message-APIs
summary: 'Hilfsfunktionen für eingehende Ereignisse für Kanal-Plugins: Kontextaufbau, gemeinsame Runner-Orchestrierung, Sitzungsdatensatz und Versand vorbereiteter Antworten'
title: API für eingehende Kanäle
x-i18n:
    generated_at: "2026-06-27T17:58:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Channel-Plugins sollten Empfangspfade mit den Begriffen inbound und message modellieren:

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

Verwenden Sie `openclaw/plugin-sdk/channel-inbound` für die Normalisierung
eingehender Ereignisse, Formatierung, Roots und Orchestrierung. Verwenden Sie
`openclaw/plugin-sdk/channel-outbound` für natives Senden, Empfangsbestätigungen,
dauerhafte Zustellung und Live-Vorschauverhalten.

## Kernhilfen

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: projiziert normalisierte Channel-Fakten
  in den Prompt-/Sitzungskontext. Verwenden Sie `channelContext`, um
  sender/chat-Metadaten im Besitz des Channels an den Plugin-Hook
  `ctx.channelContext` weiterzugeben; erweitern Sie
  `PluginHookChannelSenderContext` oder `PluginHookChannelChatContext` aus diesem
  Unterpfad für channelspezifische Felder.
- `runChannelInboundEvent(...)`: führt Ingest, Klassifizierung, Preflight,
  Auflösung, Aufzeichnung, Dispatch und Finalisierung für ein eingehendes
  Plattformereignis aus.
- `dispatchChannelInboundReply(...)`: zeichnet eine bereits zusammengestellte
  eingehende Antwort auf und dispatcht sie mit einem Zustellungsadapter.

Die injizierte Plugin-Laufzeit stellt dieselben High-Level-Hilfen unter
`runtime.channel.inbound.*` für gebündelte/native Channels bereit, die bereits das
Laufzeitobjekt erhalten.

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

Kompatibilitäts-Dispatcher sollten Eingaben für
`dispatchChannelInboundReply(...)` zusammenstellen und die Plattformzustellung im
Zustellungsadapter belassen. Neue Sendepfade sollten Message-Adapter und
dauerhafte Message-Hilfen bevorzugen.

## Migration

Die alten Laufzeit-Aliasse `runtime.channel.turn.*` wurden entfernt. Verwenden
Sie:

- `runtime.channel.inbound.run(...)` für rohe eingehende Ereignisse.
- `runtime.channel.inbound.dispatchReply(...)` für zusammengestellte
  Antwortkontexte.
- `runtime.channel.inbound.buildContext(...)` für eingehende Kontext-Payloads.
- `runtime.channel.inbound.runPreparedReply(...)` nur für vorbereitete
  Dispatch-Pfade im Besitz des Channels, die bereits ihre eigene
  Dispatch-Closure zusammenstellen.

Neuer Plugin-Code sollte keine Channel-APIs mit `turn` im Namen einführen. Halten
Sie Modell- oder Agent-Turn-Vokabular in Agent-/Provider-Code; Channel-Plugins
verwenden Begriffe wie inbound, message, delivery und reply.
