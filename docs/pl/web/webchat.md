---
read_when:
    - Debugowanie lub konfigurowanie dostępu do WebChat
summary: Statyczny host Loopback WebChat i użycie WS Gateway w interfejsie czatu
title: Czat internetowy
x-i18n:
    generated_at: "2026-05-03T09:53:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48024e58259901c6feb67168c5c1ce32f46b8ad9b6f4511e56d2000478a3ed60
    source_path: web/webchat.md
    workflow: 16
---

Status: interfejs czatu macOS/iOS SwiftUI komunikuje się bezpośrednio z WebSocketem Gateway.

## Czym to jest

- Natywny interfejs czatu dla Gateway (bez osadzonej przeglądarki i bez lokalnego serwera statycznego).
- Używa tych samych sesji i reguł routingu co inne kanały.
- Deterministyczny routing: odpowiedzi zawsze wracają do WebChat.

## Szybki start

1. Uruchom Gateway.
2. Otwórz interfejs WebChat (aplikacja macOS/iOS) albo kartę czatu Control UI.
3. Upewnij się, że skonfigurowano prawidłową ścieżkę uwierzytelniania Gateway (domyślnie shared-secret,
   nawet na pętli zwrotnej).

## Jak to działa (zachowanie)

- Interfejs łączy się z WebSocketem Gateway i używa `chat.history`, `chat.send` oraz `chat.inject`.
- `chat.history` jest ograniczone dla stabilności: Gateway może skracać długie pola tekstowe, pomijać ciężkie metadane i zastępować zbyt duże wpisy tekstem `[chat.history omitted: message too large]`.
- `chat.history` podąża za aktywną gałęzią transkrypcji dla nowoczesnych plików sesji typu append-only, więc porzucone gałęzie przepisywania i zastąpione kopie promptów nie są renderowane w WebChat.
- Wpisy Compaction renderują się jako jawny separator skompaktowanej historii. Separator wyjaśnia, że wcześniejsze tury są zachowane w punkcie kontrolnym, i linkuje do kontrolek punktów kontrolnych sesji, gdzie operatorzy mogą rozgałęzić lub przywrócić widok sprzed Compaction, jeśli pozwalają na to ich uprawnienia.
- Control UI zapamiętuje bazowy `sessionId` Gateway zwrócony przez `chat.history` i dołącza go do kolejnych wywołań `chat.send`, więc ponowne połączenia i odświeżenia strony kontynuują tę samą zapisaną konwersację, chyba że użytkownik rozpocznie lub zresetuje sesję.
- Control UI scala zduplikowane wysłania w toku dla tej samej sesji, wiadomości i załączników przed wygenerowaniem nowego identyfikatora uruchomienia `chat.send`; Gateway nadal deduplikuje powtórzone żądania, które ponownie używają tego samego klucza idempotencji.
- `chat.history` jest też normalizowane do wyświetlania: kontekst OpenClaw używany tylko w czasie działania,
  opakowania przychodzących kopert, wbudowane tagi dyrektyw dostarczania
  takie jak `[[reply_to_*]]` i `[[audio_as_voice]]`, tekstowe ładunki XML wywołań narzędzi
  (w tym `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi) i
  ujawnione tokeny sterujące modelu ASCII/pełnej szerokości są usuwane z widocznego tekstu,
  a wpisy asystenta, których cały widoczny tekst jest tylko dokładnym cichym
  tokenem `NO_REPLY` / `no_reply`, są pomijane.
- Ładunki odpowiedzi oznaczone flagą rozumowania (`isReasoning: true`) są wykluczane z treści asystenta w WebChat, tekstu odtwarzania transkrypcji i bloków treści audio, więc ładunki służące tylko do myślenia nie pojawiają się jako widoczne wiadomości asystenta ani odtwarzalne audio.
- `chat.inject` dopisuje notatkę asystenta bezpośrednio do transkrypcji i rozgłasza ją do interfejsu (bez uruchomienia agenta).
- Przerwane uruchomienia mogą zachować częściowe wyjście asystenta widoczne w interfejsie.
- Gateway zapisuje przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje zbuforowane wyjście, i oznacza te wpisy metadanymi przerwania.
- Historia jest zawsze pobierana z Gateway (bez lokalnego obserwowania plików).
- Jeśli Gateway jest nieosiągalny, WebChat działa tylko do odczytu.

## Panel narzędzi agentów w Control UI

- Panel Narzędzia Control UI `/agents` ma dwa oddzielne widoki:
  - **Dostępne teraz** używa `tools.effective(sessionKey=...)` i pokazuje, czego bieżąca
    sesja może faktycznie używać w czasie działania, w tym narzędzia rdzenia, Plugin i należące do kanałów.
  - **Konfiguracja narzędzi** używa `tools.catalog` i pozostaje skupiona na profilach, nadpisaniach oraz
    semantyce katalogu.
- Dostępność w czasie działania jest ograniczona do sesji. Przełączanie sesji na tym samym agencie może zmienić
  listę **Dostępne teraz**.
- Edytor konfiguracji nie implikuje dostępności w czasie działania; efektywny dostęp nadal wynika z kolejności pierwszeństwa zasad
  (`allow`/`deny`, nadpisania per agent oraz nadpisania dostawcy/kanału).

## Użycie zdalne

- Tryb zdalny tuneluje WebSocket Gateway przez SSH/Tailscale.
- Nie musisz uruchamiać oddzielnego serwera WebChat.

## Dokumentacja konfiguracji (WebChat)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje WebChat:

- `gateway.webchat.chatHistoryMaxChars`: maksymalna liczba znaków dla pól tekstowych w odpowiedziach `chat.history`. Gdy wpis transkrypcji przekroczy ten limit, Gateway skraca długie pola tekstowe i może zastąpić zbyt duże wiadomości placeholderem. Klient może też wysłać `maxChars` dla pojedynczego żądania, aby nadpisać tę wartość domyślną dla jednego wywołania `chat.history`.

Powiązane opcje globalne:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  uwierzytelnianie WebSocket za pomocą shared-secret.
- `gateway.auth.allowTailscale`: karta czatu Control UI w przeglądarce może używać nagłówków tożsamości Tailscale
  Serve, gdy jest włączona.
- `gateway.auth.mode: "trusted-proxy"`: uwierzytelnianie przez odwrotny serwer proxy dla klientów przeglądarkowych za źródłem proxy **spoza pętli zwrotnej**, świadomym tożsamości (zobacz [Uwierzytelnianie przez zaufany serwer proxy](/pl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: zdalny cel Gateway.
- `session.*`: przechowywanie sesji i domyślne wartości klucza głównego.

## Powiązane

- [Control UI](/pl/web/control-ui)
- [Panel](/pl/web/dashboard)
