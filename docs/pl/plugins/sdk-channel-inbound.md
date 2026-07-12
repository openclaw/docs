---
read_when:
    - Budujesz lub refaktoryzujesz ścieżkę odbioru wtyczki kanału komunikacyjnego
    - Potrzebujesz współdzielonego tworzenia kontekstu przychodzącego, rejestrowania sesji lub wysyłania przygotowanych odpowiedzi
    - Migrujesz stare funkcje pomocnicze tur kanału do interfejsów API wiadomości przychodzących/message
summary: 'Narzędzia pomocnicze zdarzeń przychodzących dla pluginów kanałów: tworzenie kontekstu, współdzielona orkiestracja modułu uruchamiającego, rekord sesji i wysyłanie przygotowanej odpowiedzi'
title: Interfejs API wiadomości przychodzących kanału
x-i18n:
    generated_at: "2026-07-12T15:28:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Ścieżki odbierania kanałów korzystają z jednego przepływu:

```text
zdarzenie platformy -> fakty/kontekst wejściowy -> odpowiedź agenta -> dostarczenie wiadomości
```

Użyj `openclaw/plugin-sdk/channel-inbound` do normalizacji zdarzeń wejściowych,
formatowania, katalogów głównych i orkiestracji. Użyj
`openclaw/plugin-sdk/channel-outbound` do natywnego wysyłania, potwierdzeń, trwałego
dostarczania i działania podglądu na żywo.

## Podstawowe funkcje pomocnicze

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: odwzorowuje znormalizowane fakty kanału
  w kontekście promptu/sesji. Przekaż metadane nadawcy/czatu należące do kanału
  przez `channelContext`, który hooki Pluginu otrzymują jako `ctx.channelContext`.
  Rozszerz `PluginHookChannelSenderContext` lub `PluginHookChannelChatContext`
  z tej podścieżki o pola specyficzne dla kanału.
- `runChannelInboundEvent(...)`: wykonuje przyjęcie, klasyfikację, kontrolę wstępną, rozpoznanie,
  zapis, wysłanie i finalizację jednego przychodzącego zdarzenia platformy.
- `dispatchChannelInboundReply(...)`: zapisuje i wysyła już
  złożoną odpowiedź wejściową za pomocą adaptera dostarczania.

Wbudowane/natywne kanały, które już otrzymują wstrzyknięty obiekt środowiska uruchomieniowego Pluginu,
mogą wywoływać te same funkcje pomocnicze przez `runtime.channel.inbound.*`, zamiast
bezpośrednio importować tę podścieżkę:

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

Przygotuj dane wejściowe `dispatchChannelInboundReply(...)` dla zgodnych wstecznie
dyspozytorów, które pozostawiają dostarczanie przez platformę w adapterze dostarczania. Nowe ścieżki
wysyłania powinny zamiast tego używać adapterów wiadomości i funkcji pomocniczych trwałych wiadomości z
`channel-outbound`.

## Migracja

Aliasy środowiska uruchomieniowego `runtime.channel.turn.*` zostały usunięte. Użyj:

- `runtime.channel.inbound.run(...)` dla nieprzetworzonych zdarzeń wejściowych.
- `runtime.channel.inbound.dispatchReply(...)` dla złożonych kontekstów odpowiedzi.
- `runtime.channel.inbound.buildContext(...)` dla ładunków kontekstu wejściowego.
- `runtime.channel.inbound.runPreparedReply(...)`, przestarzałe, tylko dla
  należących do kanału ścieżek wysyłania przygotowanych odpowiedzi, które już tworzą własne
  domknięcie wysyłające.

Nowy kod Pluginu nie powinien wprowadzać interfejsów API kanałów z `turn` w nazwie. Terminologię dotyczącą przebiegu modelu lub
agenta należy zachować w kodzie agenta/dostawcy; Pluginy kanałów używają terminów dotyczących danych wejściowych,
wiadomości, dostarczania i odpowiedzi.
