---
read_when:
    - Debugowanie lub konfigurowanie dostępu do WebChat
summary: Statyczny host Loopback WebChat i użycie WS Gateway dla interfejsu czatu
title: Czat internetowy
x-i18n:
    generated_at: "2026-05-02T10:06:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d3cb30ed18d651b0d0ca8fd188b47c5f1d186410ee340deb79315f194ed8d
    source_path: web/webchat.md
    workflow: 16
---

Status: interfejs czatu SwiftUI dla macOS/iOS komunikuje się bezpośrednio z WebSocket Gateway.

## Czym to jest

- Natywny interfejs czatu dla Gateway (bez osadzonej przeglądarki i bez lokalnego serwera statycznego).
- Używa tych samych sesji i reguł routingu co inne kanały.
- Deterministyczny routing: odpowiedzi zawsze wracają do WebChat.

## Szybki start

1. Uruchom Gateway.
2. Otwórz interfejs WebChat (aplikacja macOS/iOS) albo kartę czatu Control UI.
3. Upewnij się, że skonfigurowano prawidłową ścieżkę uwierzytelniania Gateway (domyślnie shared-secret,
   nawet na loopback).

## Jak to działa (zachowanie)

- UI łączy się z WebSocket Gateway i używa `chat.history`, `chat.send` oraz `chat.inject`.
- `chat.history` jest ograniczone dla stabilności: Gateway może przycinać długie pola tekstowe, pomijać ciężkie metadane i zastępować zbyt duże wpisy tekstem `[chat.history omitted: message too large]`.
- `chat.history` podąża za aktywną gałęzią transkrypcji w nowoczesnych plikach sesji typu append-only, więc porzucone gałęzie przepisywania i zastąpione kopie promptów nie są renderowane w WebChat.
- Control UI zapamiętuje bazowy `sessionId` Gateway zwrócony przez `chat.history` i dołącza go do kolejnych wywołań `chat.send`, dzięki czemu ponowne połączenia i odświeżenia strony kontynuują tę samą zapisaną rozmowę, chyba że użytkownik rozpocznie albo zresetuje sesję.
- Control UI scala zduplikowane wysłania w toku dla tej samej sesji, wiadomości i załączników przed wygenerowaniem nowego identyfikatora uruchomienia `chat.send`; Gateway nadal deduplikuje powtarzane żądania, które ponownie używają tego samego klucza idempotencji.
- `chat.history` jest również normalizowane do wyświetlania: kontekst OpenClaw wyłącznie z czasu działania,
  przychodzące opakowania envelope, wbudowane tagi dyrektyw dostarczania
  takie jak `[[reply_to_*]]` i `[[audio_as_voice]]`, tekstowe ładunki XML wywołań narzędzi
  (w tym `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` oraz przycięte bloki wywołań narzędzi), a także
  ujawnione tokeny sterujące modelu w ASCII/pełnej szerokości są usuwane z widocznego tekstu,
  a wpisy asystenta, których cały widoczny tekst jest tylko dokładnym cichym
  tokenem `NO_REPLY` / `no_reply`, są pomijane.
- Ładunki odpowiedzi oznaczone jako rozumowanie (`isReasoning: true`) są wykluczane z treści asystenta WebChat, tekstu odtwarzania transkrypcji i bloków treści audio, więc ładunki przeznaczone wyłącznie do myślenia nie pojawiają się jako widoczne wiadomości asystenta ani odtwarzalne audio.
- `chat.inject` dopisuje notatkę asystenta bezpośrednio do transkrypcji i rozgłasza ją do UI (bez uruchomienia agenta).
- Przerwane uruchomienia mogą pozostawiać częściowe wyjście asystenta widoczne w UI.
- Gateway zapisuje przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje zbuforowane wyjście, i oznacza te wpisy metadanymi przerwania.
- Historia jest zawsze pobierana z Gateway (bez obserwowania plików lokalnych).
- Jeśli Gateway jest nieosiągalny, WebChat działa tylko do odczytu.

## Panel narzędzi agentów Control UI

- Panel Narzędzia Control UI `/agents` ma dwa oddzielne widoki:
  - **Dostępne teraz** używa `tools.effective(sessionKey=...)` i pokazuje, czego bieżąca
    sesja może faktycznie używać w czasie działania, w tym narzędzia należące do rdzenia, Plugin i kanału.
  - **Konfiguracja narzędzi** używa `tools.catalog` i skupia się na profilach, nadpisaniach oraz
    semantyce katalogu.
- Dostępność w czasie działania jest ograniczona do sesji. Przełączanie sesji na tym samym agencie może zmienić
  listę **Dostępne teraz**.
- Edytor konfiguracji nie oznacza dostępności w czasie działania; efektywny dostęp nadal wynika z priorytetu zasad
  (`allow`/`deny`, nadpisania per agent oraz dostawca/kanał).

## Użycie zdalne

- Tryb zdalny tuneluje WebSocket Gateway przez SSH/Tailscale.
- Nie musisz uruchamiać osobnego serwera WebChat.

## Dokumentacja konfiguracji (WebChat)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje WebChat:

- `gateway.webchat.chatHistoryMaxChars`: maksymalna liczba znaków dla pól tekstowych w odpowiedziach `chat.history`. Gdy wpis transkrypcji przekracza ten limit, Gateway przycina długie pola tekstowe i może zastąpić zbyt duże wiadomości symbolem zastępczym. Klient może również wysłać `maxChars` dla pojedynczego żądania, aby zastąpić tę wartość domyślną dla jednego wywołania `chat.history`.

Powiązane opcje globalne:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  uwierzytelnianie WebSocket typu shared-secret.
- `gateway.auth.allowTailscale`: karta czatu Control UI w przeglądarce może używać nagłówków tożsamości Tailscale
  Serve, gdy ta opcja jest włączona.
- `gateway.auth.mode: "trusted-proxy"`: uwierzytelnianie przez odwrotny proxy dla klientów przeglądarkowych za świadomym tożsamości źródłem proxy **non-loopback** (zobacz [Uwierzytelnianie przez zaufany proxy](/pl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: zdalny cel Gateway.
- `session.*`: przechowywanie sesji i domyślne wartości klucza głównego.

## Powiązane

- [Control UI](/pl/web/control-ui)
- [Pulpit](/pl/web/dashboard)
