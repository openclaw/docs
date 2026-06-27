---
read_when:
    - Budujesz lub refaktoryzujesz ścieżkę odbioru Pluginu kanału komunikacyjnego
    - Potrzebujesz współdzielonego konstruowania kontekstu przychodzącego, rejestrowania sesji lub wysyłania przygotowanych odpowiedzi
    - Migrujesz stare funkcje pomocnicze tur kanałów do interfejsów API przychodzących/wiadomości
summary: 'Pomocnicze funkcje zdarzeń przychodzących dla pluginów kanałów: budowanie kontekstu, orkiestracja współdzielonego runnera, rekord sesji i wysyłka przygotowanych odpowiedzi'
title: Interfejs API przychodzący kanału
x-i18n:
    generated_at: "2026-06-27T18:05:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Wtyczki kanałów powinny modelować ścieżki odbioru rzeczownikami związanymi z przychodzącymi zdarzeniami i wiadomościami:

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

Używaj `openclaw/plugin-sdk/channel-inbound` do normalizacji zdarzeń przychodzących,
formatowania, korzeni i orkiestracji. Używaj
`openclaw/plugin-sdk/channel-outbound` do natywnego
wysyłania, potwierdzeń odbioru, trwałego dostarczania i działania podglądu na żywo.

## Główne helpery

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: rzutuje znormalizowane fakty kanału na
  kontekst promptu/sesji. Użyj `channelContext`, aby przekazać należące do kanału
  metadane nadawcy/czatu do hooka wtyczki `ctx.channelContext`; rozszerz
  `PluginHookChannelSenderContext` lub `PluginHookChannelChatContext` z tej
  ścieżki podrzędnej o pola specyficzne dla kanału.
- `runChannelInboundEvent(...)`: uruchamia pobieranie, klasyfikację, kontrolę wstępną, rozwiązywanie,
  rejestrowanie, wysyłkę i finalizację dla jednego przychodzącego zdarzenia platformy.
- `dispatchChannelInboundReply(...)`: rejestruje i wysyła już złożoną
  odpowiedź przychodzącą za pomocą adaptera dostarczania.

Wstrzyknięte środowisko uruchomieniowe wtyczki udostępnia te same wysokopoziomowe helpery pod
`runtime.channel.inbound.*` dla kanałów dołączonych/natywnych, które już otrzymują
obiekt środowiska uruchomieniowego.

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

Dispatchery zgodności powinny składać dane wejściowe `dispatchChannelInboundReply(...)`
i utrzymywać dostarczanie platformowe w adapterze dostarczania. Nowe ścieżki wysyłania powinny
preferować adaptery wiadomości i trwałe helpery wiadomości.

## Migracja

Stare aliasy środowiska uruchomieniowego `runtime.channel.turn.*` zostały usunięte. Używaj:

- `runtime.channel.inbound.run(...)` dla surowych zdarzeń przychodzących.
- `runtime.channel.inbound.dispatchReply(...)` dla złożonych kontekstów odpowiedzi.
- `runtime.channel.inbound.buildContext(...)` dla ładunków kontekstu przychodzącego.
- `runtime.channel.inbound.runPreparedReply(...)` tylko dla należących do kanału przygotowanych
  ścieżek wysyłki, które już składają własne domknięcie wysyłki.

Nowy kod wtyczki nie powinien wprowadzać interfejsów API kanału nazwanych `turn`. Słownictwo tur modelu lub
agenta trzymaj w kodzie agenta/dostawcy; wtyczki kanałów używają terminów dotyczących danych przychodzących,
wiadomości, dostarczania i odpowiedzi.
