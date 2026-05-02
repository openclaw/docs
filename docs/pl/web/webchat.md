---
read_when:
    - Debugowanie lub konfigurowanie dostępu do WebChat
summary: Statyczny host Loopback WebChat i użycie WS Gateway dla interfejsu czatu
title: WebChat
x-i18n:
    generated_at: "2026-05-02T23:39:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3a09c8962e3a6dda83716d319df7ba27e18105cee50721278b5cba0a85c52f
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
2. Otwórz interfejs WebChat UI (aplikacja macOS/iOS) lub kartę czatu Control UI.
3. Upewnij się, że skonfigurowano prawidłową ścieżkę uwierzytelniania Gateway (domyślnie shared-secret,
   nawet na loopback).

## Jak to działa (zachowanie)

- Interfejs UI łączy się z Gateway WebSocket i używa `chat.history`, `chat.send`, `chat.inject` oraz `chat.transcribeAudio`.
- `chat.history` jest ograniczone dla stabilności: Gateway może skracać długie pola tekstowe, pomijać ciężkie metadane i zastępować zbyt duże wpisy tekstem `[chat.history omitted: message too large]`.
- `chat.history` podąża za aktywną gałęzią transkryptu w nowoczesnych plikach sesji tylko do dopisywania, więc porzucone gałęzie przepisywania i zastąpione kopie promptów nie są renderowane w WebChat.
- Control UI zapamiętuje bazowy `sessionId` Gateway zwrócony przez `chat.history` i dołącza go do kolejnych wywołań `chat.send`, dzięki czemu ponowne połączenia i odświeżenia strony kontynuują tę samą zapisaną rozmowę, chyba że użytkownik rozpocznie lub zresetuje sesję.
- Control UI scala zduplikowane wysyłki w toku dla tej samej sesji, wiadomości i załączników przed wygenerowaniem nowego identyfikatora uruchomienia `chat.send`; Gateway nadal deduplikuje powtórzone żądania, które ponownie używają tego samego klucza idempotencji.
- `chat.history` jest także normalizowane do wyświetlania: kontekst OpenClaw wyłącznie środowiska uruchomieniowego,
  opakowania przychodzących kopert, wbudowane tagi dyrektyw dostarczania,
  takie jak `[[reply_to_*]]` i `[[audio_as_voice]]`, tekstowe ładunki XML wywołań narzędzi
  (w tym `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` oraz skrócone bloki wywołań narzędzi), a także
  ujawnione tokeny sterujące modelu ASCII/pełnej szerokości są usuwane z widocznego tekstu,
  a wpisy asystenta, których cały widoczny tekst jest tylko dokładnym cichym
  tokenem `NO_REPLY` / `no_reply`, są pomijane.
- Ładunki odpowiedzi oznaczone jako rozumowanie (`isReasoning: true`) są wykluczane z treści asystenta w WebChat, tekstu odtwarzania transkryptu i bloków treści audio, więc ładunki wyłącznie z tokiem rozumowania nie pojawiają się jako widoczne wiadomości asystenta ani odtwarzalne audio.
- `chat.transcribeAudio` obsługuje dyktowanie po stronie serwera w edytorze czatu Control UI. Przeglądarka nagrywa dźwięk z mikrofonu, wysyła go jako base64 do Gateway, a Gateway uruchamia skonfigurowany potok `tools.media.audio`. Zwrócony transkrypt jest wstawiany do wersji roboczej; uruchomienie agenta nie rozpoczyna się, dopóki użytkownik go nie wyśle.
- `chat.inject` dopisuje notatkę asystenta bezpośrednio do transkryptu i rozgłasza ją do interfejsu UI (bez uruchamiania agenta).
- Przerwane uruchomienia mogą pozostawiać częściowe dane wyjściowe asystenta widoczne w interfejsie UI.
- Gateway zapisuje przerwany częściowy tekst asystenta w historii transkryptu, gdy istnieją zbuforowane dane wyjściowe, i oznacza te wpisy metadanymi przerwania.
- Historia jest zawsze pobierana z Gateway (bez lokalnego obserwowania plików).
- Jeśli Gateway jest nieosiągalny, WebChat jest tylko do odczytu.

## Panel narzędzi agentów Control UI

- Panel Tools w `/agents` w Control UI ma dwa osobne widoki:
  - **Dostępne teraz** używa `tools.effective(sessionKey=...)` i pokazuje, czego bieżąca
    sesja może faktycznie używać w czasie wykonywania, w tym narzędzia rdzenia, Plugin i należące do kanałów.
  - **Konfiguracja narzędzi** używa `tools.catalog` i pozostaje skupiona na profilach, nadpisaniach oraz
    semantyce katalogu.
- Dostępność w czasie wykonywania jest ograniczona do sesji. Przełączanie sesji na tym samym agencie może zmienić
  listę **Dostępne teraz**.
- Edytor konfiguracji nie oznacza dostępności w czasie wykonywania; efektywny dostęp nadal podlega precedencji zasad
  (`allow`/`deny`, nadpisania dla poszczególnych agentów oraz dostawców/kanałów).

## Użycie zdalne

- Tryb zdalny tuneluje Gateway WebSocket przez SSH/Tailscale.
- Nie trzeba uruchamiać osobnego serwera WebChat.

## Dokumentacja konfiguracji (WebChat)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje WebChat:

- `gateway.webchat.chatHistoryMaxChars`: maksymalna liczba znaków dla pól tekstowych w odpowiedziach `chat.history`. Gdy wpis transkryptu przekroczy ten limit, Gateway skraca długie pola tekstowe i może zastąpić zbyt duże wiadomości symbolem zastępczym. Klient może także wysłać `maxChars` dla pojedynczego żądania, aby nadpisać tę wartość domyślną dla jednego wywołania `chat.history`.

Powiązane opcje globalne:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  uwierzytelnianie WebSocket typu shared-secret.
- `gateway.auth.allowTailscale`: karta czatu w przeglądarkowym Control UI może używać nagłówków tożsamości Tailscale
  Serve, gdy ta opcja jest włączona.
- `gateway.auth.mode: "trusted-proxy"`: uwierzytelnianie reverse-proxy dla klientów przeglądarkowych za świadomym tożsamości źródłem proxy **innym niż loopback** (zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: docelowy zdalny Gateway.
- `session.*`: przechowywanie sesji i domyślne wartości głównego klucza.

## Powiązane

- [Control UI](/pl/web/control-ui)
- [Pulpit](/pl/web/dashboard)
