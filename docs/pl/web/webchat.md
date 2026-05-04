---
read_when:
    - Debugowanie lub konfigurowanie dostępu do WebChat
summary: Statyczny host WebChat w pętli zwrotnej i użycie Gateway WS w interfejsie czatu
title: Czat internetowy
x-i18n:
    generated_at: "2026-05-04T02:27:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

Status: interfejs czatu macOS/iOS SwiftUI komunikuje się bezpośrednio z Gateway WebSocket.

## Czym jest

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
- `chat.history` ma ograniczenia dla stabilności: Gateway może skracać długie pola tekstowe, pomijać ciężkie metadane i zastępować zbyt duże wpisy tekstem `[chat.history omitted: message too large]`.
- `chat.history` podąża za aktywną gałęzią transkrypcji w nowoczesnych plikach sesji typu append-only, więc porzucone gałęzie przepisywania i zastąpione kopie promptów nie są renderowane w WebChat.
- Wpisy Compaction są renderowane jako jawny separator skompaktowanej historii. Separator wyjaśnia, że wcześniejsze tury są zachowane w punkcie kontrolnym, i prowadzi do kontrolek punktów kontrolnych sesji, gdzie operatorzy mogą utworzyć gałąź lub przywrócić widok sprzed Compaction, jeśli pozwalają na to ich uprawnienia.
- Control UI zapamiętuje bazowy `sessionId` Gateway zwrócony przez `chat.history` i dołącza go do kolejnych wywołań `chat.send`, więc ponowne połączenia i odświeżenia strony kontynuują tę samą zapisaną rozmowę, chyba że użytkownik rozpocznie lub zresetuje sesję.
- Control UI scala zduplikowane wysyłki w toku dla tej samej sesji, wiadomości i załączników przed wygenerowaniem nowego identyfikatora uruchomienia `chat.send`; Gateway nadal deduplikuje powtórzone żądania, które ponownie używają tego samego klucza idempotencji.
- Pliki startowe przestrzeni roboczej i oczekujące instrukcje `BOOTSTRAP.md` są dostarczane przez Project Context w prompcie systemowym agenta, a nie kopiowane do wiadomości użytkownika WebChat. Obcięcie bootstrapa dodaje tylko zwięzłe powiadomienie odzyskiwania w prompcie systemowym; szczegółowe liczniki i pokrętła konfiguracji pozostają na powierzchniach diagnostycznych.
- `chat.history` jest też normalizowane pod kątem wyświetlania: kontekst OpenClaw wyłącznie czasu wykonania,
  przychodzące opakowania kopert, wbudowane znaczniki dyrektyw dostarczania
  takie jak `[[reply_to_*]]` i `[[audio_as_voice]]`, tekstowe ładunki XML wywołań narzędzi
  (w tym `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi), a także
  ujawnione tokeny sterowania modelem ASCII/pełnej szerokości są usuwane z widocznego tekstu,
  a wpisy asystenta, których cały widoczny tekst jest wyłącznie dokładnym cichym
  tokenem `NO_REPLY` / `no_reply`, są pomijane.
- Ładunki odpowiedzi oznaczone jako rozumowanie (`isReasoning: true`) są wykluczane z treści asystenta w WebChat, tekstu odtwarzanej transkrypcji i bloków treści audio, więc ładunki wyłącznie z myśleniem nie pojawiają się jako widoczne wiadomości asystenta ani odtwarzalne audio.
- `chat.inject` dopisuje notatkę asystenta bezpośrednio do transkrypcji i rozgłasza ją do interfejsu (bez uruchamiania agenta).
- Przerwane uruchomienia mogą pozostawić częściowe wyjście asystenta widoczne w interfejsie.
- Gateway zapisuje przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje zbuforowane wyjście, i oznacza te wpisy metadanymi przerwania.
- Historia jest zawsze pobierana z Gateway (bez lokalnego obserwowania plików).
- Jeśli Gateway jest nieosiągalny, WebChat działa tylko do odczytu.

### Model transkrypcji i dostarczania

WebChat ma dwie oddzielne ścieżki danych:

- Plik JSONL sesji jest trwałą transkrypcją modelu/czasu wykonania. W przypadku normalnych uruchomień agenta Pi zapisuje widoczne dla modelu wiadomości `user`, `assistant` i `toolResult` przez menedżera sesji. WebChat nie zapisuje do tej transkrypcji dowolnego tekstu dostarczania, statusu ani pomocniczego.
- Zdarzenia Gateway `ReplyPayload` są projekcją dostarczania na żywo. Mogą być normalizowane na potrzeby wyświetlania w WebChat/kanale, strumieniowania bloków, znaczników dyrektyw, osadzania multimediów, flag TTS/audio i zachowania awaryjnego interfejsu. Same nie są kanonicznym dziennikiem sesji.
- WebChat wstrzykuje wpisy transkrypcji asystenta tylko wtedy, gdy Gateway jest właścicielem wyświetlanej wiadomości poza normalną turą asystenta Pi: `chat.inject`, odpowiedzi poleceń bez agenta, przerwane częściowe wyjście oraz uzupełnienia transkrypcji multimediów zarządzane przez WebChat.
- `chat.history` odczytuje zapisaną transkrypcję sesji i stosuje projekcję wyświetlania WebChat. Jeśli tekst asystenta na żywo pojawia się podczas uruchomienia, ale znika po ponownym wczytaniu historii, najpierw sprawdź, czy surowy JSONL zawiera tekst asystenta, potem czy projekcja `chat.history` go usunęła, a następnie czy optymistyczne scalenie ogona w Control UI zastąpiło lokalny stan dostarczania utrwaloną migawką.

Końcowe odpowiedzi normalnych uruchomień agenta powinny być trwałe, ponieważ Pi zapisuje `message_end` asystenta. Każdy mechanizm awaryjny, który odzwierciedla dostarczony końcowy ładunek w transkrypcji, musi najpierw uniknąć duplikowania tury asystenta, którą Pi już zapisało.

## Panel narzędzi agentów w Control UI

- Panel Narzędzia `/agents` w Control UI ma dwa oddzielne widoki:
  - **Dostępne teraz** używa `tools.effective(sessionKey=...)` i pokazuje, czego bieżąca
    sesja może faktycznie używać w czasie wykonania, w tym narzędzia należące do rdzenia, Plugin i kanału.
  - **Konfiguracja narzędzi** używa `tools.catalog` i pozostaje skupiona na profilach, nadpisaniach oraz
    semantyce katalogu.
- Dostępność w czasie wykonania jest ograniczona do sesji. Przełączanie sesji tego samego agenta może zmienić
  listę **Dostępne teraz**.
- Edytor konfiguracji nie oznacza dostępności w czasie wykonania; skuteczny dostęp nadal wynika z priorytetu zasad
  (`allow`/`deny`, nadpisania dla agenta i dostawcy/kanału).

## Użycie zdalne

- Tryb zdalny tuneluje Gateway WebSocket przez SSH/Tailscale.
- Nie trzeba uruchamiać oddzielnego serwera WebChat.

## Odniesienie konfiguracji (WebChat)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Opcje WebChat:

- `gateway.webchat.chatHistoryMaxChars`: maksymalna liczba znaków dla pól tekstowych w odpowiedziach `chat.history`. Gdy wpis transkrypcji przekroczy ten limit, Gateway skraca długie pola tekstowe i może zastąpić zbyt duże wiadomości symbolem zastępczym. Klient może też wysłać `maxChars` dla pojedynczego żądania, aby nadpisać tę wartość domyślną dla jednego wywołania `chat.history`.

Powiązane opcje globalne:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  uwierzytelnianie WebSocket wspólnym sekretem.
- `gateway.auth.allowTailscale`: karta czatu Control UI w przeglądarce może używać nagłówków tożsamości Tailscale
  Serve, gdy ta opcja jest włączona.
- `gateway.auth.mode: "trusted-proxy"`: uwierzytelnianie przez odwrotne proxy dla klientów przeglądarkowych za świadomym tożsamości źródłem proxy **niebędącym loopback** (zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: zdalny cel Gateway.
- `session.*`: magazyn sesji i domyślne wartości klucza głównego.

## Powiązane

- [Control UI](/pl/web/control-ui)
- [Dashboard](/pl/web/dashboard)
