---
read_when:
    - Debugujesz lub konfigurujesz dostęp do WebChat
summary: Host statyczny WebChat na loopback i użycie Gateway WS dla interfejsu czatu
title: WebChat
x-i18n:
    generated_at: "2026-04-05T14:10:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2588be04e9ae38149bdf284bf4d75b6784d63899026d2351c4e0e7efdf05ff39
    source_path: web/webchat.md
    workflow: 15
---

# WebChat (interfejs Gateway WebSocket)

Status: interfejs czatu SwiftUI na macOS/iOS komunikuje się bezpośrednio z Gateway WebSocket.

## Co to jest

- Natywny interfejs czatu dla gateway (bez osadzonej przeglądarki i bez lokalnego serwera statycznego).
- Używa tych samych sesji i zasad routingu co inne kanały.
- Deterministyczny routing: odpowiedzi zawsze wracają do WebChat.

## Szybki start

1. Uruchom gateway.
2. Otwórz interfejs WebChat (aplikacja macOS/iOS) albo kartę czatu w Control UI.
3. Upewnij się, że skonfigurowano prawidłową ścieżkę uwierzytelniania gateway (domyślnie współdzielony sekret,
   nawet na loopback).

## Jak to działa (zachowanie)

- Interfejs łączy się z Gateway WebSocket i używa `chat.history`, `chat.send` oraz `chat.inject`.
- `chat.history` jest ograniczane dla stabilności: Gateway może przycinać długie pola tekstowe, pomijać ciężkie metadane i zastępować zbyt duże wpisy komunikatem `[chat.history omitted: message too large]`.
- `chat.history` jest także normalizowane do wyświetlania: inline tagi dyrektyw dostarczania
  takie jak `[[reply_to_*]]` i `[[audio_as_voice]]`, ładunki XML wywołań narzędzi w postaci zwykłego tekstu
  (w tym `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi), a także
  wyciekłe tokeny sterujące modelem w ASCII/pełnoszerokie są usuwane z widocznego tekstu,
  a wpisy asystenta, których cały widoczny tekst jest dokładnie cichym
  tokenem `NO_REPLY` / `no_reply`, są pomijane.
- `chat.inject` dopisuje notatkę asystenta bezpośrednio do transkryptu i rozsyła ją do interfejsu (bez uruchamiania agenta).
- Przerwane uruchomienia mogą pozostawiać częściowe dane wyjściowe asystenta widoczne w interfejsie.
- Gateway utrwala częściowy tekst asystenta z przerwanych uruchomień w historii transkryptu, gdy istnieje buforowane wyjście, i oznacza te wpisy metadanymi przerwania.
- Historia jest zawsze pobierana z gateway (bez lokalnego obserwowania plików).
- Jeśli gateway jest nieosiągalny, WebChat działa tylko do odczytu.

## Panel narzędzi agentów w Control UI

- Panel Tools w `/agents` w Control UI ma dwa oddzielne widoki:
  - **Available Right Now** używa `tools.effective(sessionKey=...)` i pokazuje, czego bieżąca
    sesja faktycznie może używać w runtime, w tym narzędzi rdzenia, pluginów i narzędzi należących do kanałów.
  - **Tool Configuration** używa `tools.catalog` i pozostaje skupiony na profilach, nadpisaniach i
    semantyce katalogu.
- Dostępność runtime jest ograniczona do sesji. Przełączanie sesji na tym samym agencie może zmienić
  listę **Available Right Now**.
- Edytor konfiguracji nie implikuje dostępności runtime; efektywny dostęp nadal podlega pierwszeństwu polityk
  (`allow`/`deny`, nadpisania dla agenta oraz dostawcy/kanału).

## Użycie zdalne

- Tryb zdalny tuneluje Gateway WebSocket przez SSH/Tailscale.
- Nie musisz uruchamiać osobnego serwera WebChat.

## Dokumentacja konfiguracji (WebChat)

Pełna konfiguracja: [Konfiguracja](/gateway/configuration)

Opcje WebChat:

- `gateway.webchat.chatHistoryMaxChars`: maksymalna liczba znaków dla pól tekstowych w odpowiedziach `chat.history`. Gdy wpis transkryptu przekroczy ten limit, Gateway przycina długie pola tekstowe i może zastąpić zbyt duże wiadomości placeholderem. Klient może też wysłać `maxChars` dla pojedynczego żądania, aby nadpisać tę wartość domyślną dla jednego wywołania `chat.history`.

Powiązane opcje globalne:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  uwierzytelnianie WebSocket współdzielonym sekretem.
- `gateway.auth.allowTailscale`: karta czatu przeglądarkowego Control UI może używać nagłówków tożsamości
  Tailscale Serve, gdy opcja jest włączona.
- `gateway.auth.mode: "trusted-proxy"`: uwierzytelnianie reverse proxy dla klientów przeglądarkowych za proxy uwzględniającym tożsamość ze źródłem **spoza loopback** (zobacz [Trusted Proxy Auth](/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: docelowy zdalny gateway.
- `session.*`: przechowywanie sesji i domyślne klucze główne.
