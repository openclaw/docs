---
read_when:
    - Debugowanie lub konfigurowanie dostępu do WebChat
summary: Statyczny host WebChat na loopback i użycie Gateway WS dla interfejsu czatu
title: WebChat
x-i18n:
    generated_at: "2026-04-24T09:39:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466e1e92ea5b8bb979a34985b9cd9618c94a0a4a424444024edda26c46540f1e
    source_path: web/webchat.md
    workflow: 15
---

Status: interfejs czatu SwiftUI na macOS/iOS komunikuje się bezpośrednio z Gateway WebSocket.

## Czym to jest

- Natywny interfejs czatu dla gateway (bez osadzonej przeglądarki i bez lokalnego serwera statycznego).
- Używa tych samych sesji i reguł routingu co inne kanały.
- Deterministyczny routing: odpowiedzi zawsze wracają do WebChat.

## Szybki start

1. Uruchom gateway.
2. Otwórz UI WebChat (aplikacja macOS/iOS) albo kartę czatu w Control UI.
3. Upewnij się, że skonfigurowano prawidłową ścieżkę auth gateway (domyślnie shared-secret,
   nawet na loopback).

## Jak to działa (zachowanie)

- UI łączy się z Gateway WebSocket i używa `chat.history`, `chat.send` oraz `chat.inject`.
- `chat.history` jest ograniczone dla stabilności: Gateway może przycinać długie pola tekstowe, pomijać ciężkie metadane i zastępować zbyt duże wpisy tekstem `[chat.history omitted: message too large]`.
- `chat.history` jest również normalizowane na potrzeby wyświetlania: inline tagi dyrektyw dostarczania,
  takie jak `[[reply_to_*]]` i `[[audio_as_voice]]`, payloady XML wywołań narzędzi w postaci plaintext
  (w tym `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi), a także
  wyciekłe tokeny kontroli modelu ASCII/full-width są usuwane z widocznego tekstu,
  a wpisy asystenta, których cały widoczny tekst to wyłącznie dokładny
  cichy token `NO_REPLY` / `no_reply`, są pomijane.
- `chat.inject` dopisuje notatkę asystenta bezpośrednio do transkryptu i rozsyła ją do UI (bez uruchamiania agenta).
- Przerwane przebiegi mogą pozostawiać częściowe wyjście asystenta widoczne w UI.
- Gateway zapisuje przerwany częściowy tekst asystenta w historii transkryptu, gdy istnieje zbuforowane wyjście, i oznacza te wpisy metadanymi przerwania.
- Historia jest zawsze pobierana z gateway (bez obserwowania lokalnych plików).
- Jeśli gateway jest nieosiągalny, WebChat działa tylko do odczytu.

## Panel narzędzi agentów w Control UI

- Panel Tools w `/agents` w Control UI ma dwa osobne widoki:
  - **Available Right Now** używa `tools.effective(sessionKey=...)` i pokazuje, czego bieżąca
    sesja może faktycznie używać w runtime, w tym narzędzi należących do core, Pluginów i kanałów.
  - **Tool Configuration** używa `tools.catalog` i pozostaje skupione na profilach, nadpisaniach i
    semantyce katalogu.
- Dostępność runtime jest ograniczona do sesji. Przełączanie sesji na tym samym agencie może zmienić
  listę **Available Right Now**.
- Edytor konfiguracji nie implikuje dostępności runtime; efektywny dostęp nadal podlega pierwszeństwu polityk
  (`allow`/`deny`, nadpisania per agent oraz provider/kanał).

## Użycie zdalne

- Tryb zdalny tuneluje Gateway WebSocket przez SSH/Tailscale.
- Nie musisz uruchamiać osobnego serwera WebChat.

## Dokumentacja konfiguracji (WebChat)

Pełna konfiguracja: [Configuration](/pl/gateway/configuration)

Opcje WebChat:

- `gateway.webchat.chatHistoryMaxChars`: maksymalna liczba znaków dla pól tekstowych w odpowiedziach `chat.history`. Gdy wpis transkryptu przekracza ten limit, Gateway przycina długie pola tekstowe i może zastępować zbyt duże wiadomości placeholderem. Klient może też wysłać `maxChars` per żądanie, aby nadpisać tę wartość domyślną dla pojedynczego wywołania `chat.history`.

Powiązane opcje globalne:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  auth WebSocket oparty na shared-secret.
- `gateway.auth.allowTailscale`: karta czatu przeglądarkowego Control UI może używać nagłówków tożsamości Tailscale
  Serve, gdy opcja jest włączona.
- `gateway.auth.mode: "trusted-proxy"`: auth reverse proxy dla klientów przeglądarkowych za świadomym tożsamości **nie-loopbackowym** źródłem proxy (zobacz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: cel zdalnego gateway.
- `session.*`: przechowywanie sesji i domyślne ustawienia klucza głównego.

## Powiązane

- [Control UI](/pl/web/control-ui)
- [Dashboard](/pl/web/dashboard)
