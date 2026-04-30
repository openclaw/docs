---
read_when:
    - Debugowanie lub konfigurowanie dostępu do WebChat
summary: Statyczny host Loopback WebChat i użycie Gateway WS w interfejsie czatu
title: Czat internetowy
x-i18n:
    generated_at: "2026-04-30T10:26:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8a4fef0aab37ca82bff249c6b31eb65475f12c16dfb9b86ddd62c1a938a34f3
    source_path: web/webchat.md
    workflow: 16
---

Status: interfejs czatu SwiftUI dla macOS/iOS komunikuje się bezpośrednio z Gateway WebSocket.

## Czym to jest

- Natywny interfejs czatu dla Gateway (bez osadzonej przeglądarki i bez lokalnego serwera statycznego).
- Używa tych samych sesji i reguł routingu co inne kanały.
- Deterministyczny routing: odpowiedzi zawsze wracają do WebChat.

## Szybki start

1. Uruchom Gateway.
2. Otwórz interfejs WebChat (aplikacja macOS/iOS) albo kartę czatu Control UI.
3. Upewnij się, że skonfigurowano prawidłową ścieżkę uwierzytelniania Gateway (domyślnie wspólny sekret,
   nawet na loopback).

## Jak to działa (zachowanie)

- Interfejs łączy się z Gateway WebSocket i używa `chat.history`, `chat.send` oraz `chat.inject`.
- `chat.history` jest ograniczone dla stabilności: Gateway może przycinać długie pola tekstowe, pomijać ciężkie metadane i zastępować zbyt duże wpisy ciągiem `[chat.history omitted: message too large]`.
- `chat.history` podąża za aktywną gałęzią transkryptu dla nowoczesnych plików sesji typu append-only, więc porzucone gałęzie przepisań i zastąpione kopie promptów nie są renderowane w WebChat.
- Control UI scala zduplikowane wysłania w toku dla tej samej sesji, wiadomości i załączników przed wygenerowaniem nowego identyfikatora uruchomienia `chat.send`; Gateway nadal deduplikuje powtarzane żądania, które ponownie używają tego samego klucza idempotencji.
- `chat.history` jest także normalizowane do wyświetlania: kontekst OpenClaw używany tylko w czasie wykonywania,
  opakowania kopert przychodzących, wbudowane tagi dyrektyw dostarczania
  takie jak `[[reply_to_*]]` i `[[audio_as_voice]]`, tekstowe ładunki XML wywołań narzędzi
  (w tym `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` oraz przycięte bloki wywołań narzędzi), a także
  ujawnione ASCII/pełnoszerokie tokeny sterujące modelu są usuwane z widocznego tekstu,
  a wpisy asystenta, których cały widoczny tekst jest wyłącznie dokładnym cichym
  tokenem `NO_REPLY` / `no_reply`, są pomijane.
- Ładunki odpowiedzi oznaczone jako rozumowanie (`isReasoning: true`) są wykluczane z treści asystenta w WebChat, tekstu odtwarzania transkryptu i bloków treści audio, więc ładunki służące wyłącznie myśleniu nie pojawiają się jako widoczne wiadomości asystenta ani odtwarzalne audio.
- `chat.inject` dopisuje notatkę asystenta bezpośrednio do transkryptu i rozgłasza ją do interfejsu (bez uruchamiania agenta).
- Przerwane uruchomienia mogą pozostawiać częściową odpowiedź asystenta widoczną w interfejsie.
- Gateway zapisuje przerwany częściowy tekst asystenta w historii transkryptu, gdy istnieje buforowana odpowiedź, i oznacza te wpisy metadanymi przerwania.
- Historia jest zawsze pobierana z Gateway (bez obserwowania plików lokalnych).
- Jeśli Gateway jest nieosiągalny, WebChat działa tylko do odczytu.

## Panel narzędzi agentów w Control UI

- Panel Tools w Control UI `/agents` ma dwa oddzielne widoki:
  - **Dostępne teraz** używa `tools.effective(sessionKey=...)` i pokazuje, z czego bieżąca
    sesja może faktycznie korzystać w czasie wykonywania, w tym narzędzia rdzenia, pluginów i kanałów.
  - **Konfiguracja narzędzi** używa `tools.catalog` i skupia się na profilach, nadpisaniach oraz
    semantyce katalogu.
- Dostępność w czasie wykonywania jest ograniczona do sesji. Przełączanie sesji na tym samym agencie może zmienić
  listę **Dostępne teraz**.
- Edytor konfiguracji nie oznacza dostępności w czasie wykonywania; efektywny dostęp nadal podąża za priorytetem polityk
  (`allow`/`deny`, nadpisania na poziomie agenta oraz providera/kanału).

## Użycie zdalne

- Tryb zdalny tuneluje Gateway WebSocket przez SSH/Tailscale.
- Nie musisz uruchamiać osobnego serwera WebChat.

## Informacje o konfiguracji (WebChat)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje WebChat:

- `gateway.webchat.chatHistoryMaxChars`: maksymalna liczba znaków dla pól tekstowych w odpowiedziach `chat.history`. Gdy wpis transkryptu przekracza ten limit, Gateway przycina długie pola tekstowe i może zastąpić zbyt duże wiadomości placeholderem. Klient może też wysłać `maxChars` dla pojedynczego żądania, aby nadpisać tę wartość domyślną dla jednego wywołania `chat.history`.

Powiązane opcje globalne:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  uwierzytelnianie WebSocket wspólnym sekretem.
- `gateway.auth.allowTailscale`: karta czatu w przeglądarkowym Control UI może używać nagłówków tożsamości Tailscale
  Serve, gdy ta opcja jest włączona.
- `gateway.auth.mode: "trusted-proxy"`: uwierzytelnianie przez odwrotne proxy dla klientów przeglądarkowych za świadomym tożsamości źródłem proxy **innym niż loopback** (zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: docelowy zdalny Gateway.
- `session.*`: przechowywanie sesji i domyślne wartości klucza głównego.

## Powiązane

- [Control UI](/pl/web/control-ui)
- [Dashboard](/pl/web/dashboard)
