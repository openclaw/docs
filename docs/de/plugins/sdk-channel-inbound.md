---
read_when:
    - Sie erstellen oder refaktorieren den Empfangspfad eines Plugins für einen Nachrichtenkanal
    - Sie benötigen eine gemeinsame Erstellung des Kontexts für eingehende Nachrichten, Sitzungsprotokollierung oder den vorbereiteten Antwortversand
    - Sie migrieren alte Hilfsfunktionen für Channel-Turns zu Inbound-/Message-APIs
summary: 'Hilfsfunktionen für eingehende Ereignisse in Kanal-Plugins: Kontexterstellung, gemeinsame Runner-Orchestrierung, Sitzungsdatensatz und vorbereiteter Antwortversand'
title: API für eingehende Kanalnachrichten
x-i18n:
    generated_at: "2026-07-12T15:38:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Empfangspfade für Channels folgen einem einheitlichen Ablauf:

```text
Plattformereignis -> eingehende Fakten/Kontext -> Agentenantwort -> Nachrichtenzustellung
```

Verwenden Sie `openclaw/plugin-sdk/channel-inbound` für die Normalisierung,
Formatierung, Roots und Orchestrierung eingehender Ereignisse. Verwenden Sie
`openclaw/plugin-sdk/channel-outbound` für nativen Versand, Empfangsbestätigungen,
dauerhafte Zustellung und das Verhalten der Live-Vorschau.

## Zentrale Hilfsfunktionen

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: überträgt normalisierte Channel-Fakten
  in den Prompt-/Sitzungskontext. Übergeben Sie vom Channel verwaltete Metadaten
  zu Absender und Chat über `channelContext`, die Plugin-Hooks als
  `ctx.channelContext` erhalten. Erweitern Sie `PluginHookChannelSenderContext`
  oder `PluginHookChannelChatContext` aus diesem Unterpfad um
  Channel-spezifische Felder.
- `runChannelInboundEvent(...)`: führt Aufnahme, Klassifizierung, Vorabprüfung,
  Auflösung, Aufzeichnung, Weiterleitung und Abschluss für ein eingehendes
  Plattformereignis aus.
- `dispatchChannelInboundReply(...)`: zeichnet eine bereits zusammengestellte
  eingehende Antwort auf und leitet sie mit einem Zustelladapter weiter.

Gebündelte/native Channels, die bereits das injizierte Plugin-Laufzeitobjekt
erhalten, können dieselben Hilfsfunktionen unter `runtime.channel.inbound.*`
aufrufen, anstatt diesen Unterpfad direkt zu importieren:

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

Stellen Sie Eingaben für `dispatchChannelInboundReply(...)` für
Kompatibilitäts-Dispatcher zusammen, bei denen die Plattformzustellung im
Zustelladapter verbleibt. Neue Versandpfade sollten stattdessen
Nachrichtenadapter und Hilfsfunktionen für dauerhafte Nachrichten aus
`channel-outbound` verwenden.

## Migration

Die Laufzeit-Aliasse `runtime.channel.turn.*` wurden entfernt. Verwenden Sie:

- `runtime.channel.inbound.run(...)` für rohe eingehende Ereignisse.
- `runtime.channel.inbound.dispatchReply(...)` für zusammengestellte Antwortkontexte.
- `runtime.channel.inbound.buildContext(...)` für eingehende Kontext-Nutzlasten.
- `runtime.channel.inbound.runPreparedReply(...)`, veraltet, ausschließlich für
  vom Channel verwaltete vorbereitete Weiterleitungspfade, die bereits ihre
  eigene Weiterleitungs-Closure zusammenstellen.

Neuer Plugin-Code sollte keine mit `turn` benannten Channel-APIs einführen.
Verwenden Sie die Terminologie für Modell- oder Agentendurchläufe nur im
Agenten-/Provider-Code; Channel-Plugins verwenden Begriffe für Eingang,
Nachricht, Zustellung und Antwort.
