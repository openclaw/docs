---
read_when:
    - Debugowanie lub konfigurowanie dostępu do WebChat
summary: Lokalny host statyczny WebChat i użycie Gateway WS w interfejsie czatu
title: Czat internetowy
x-i18n:
    generated_at: "2026-07-16T19:12:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e31558b3f82fc75b660455ad7835e0b43ea07de28fbbc98d4efd82f5d30425fc
    source_path: web/webchat.md
    workflow: 16
---

Status: interfejs czatu SwiftUI w systemach macOS/iOS komunikuje się bezpośrednio z WebSocketem Gateway. Bez osadzonej przeglądarki i bez lokalnego serwera plików statycznych.

## Czym jest

- Natywny interfejs czatu dla Gateway.
- Korzysta z tych samych sesji i reguł routingu co inne kanały.
- Deterministyczny routing: odpowiedzi zawsze wracają do WebChat.
- Historia jest zawsze pobierana z Gateway (bez lokalnego monitorowania plików). Jeśli Gateway jest nieosiągalny, WebChat działa tylko do odczytu.

## Szybki start

1. Uruchom Gateway.
2. Otwórz interfejs WebChat (aplikację macOS/iOS) lub kartę czatu Control UI.
3. Upewnij się, że skonfigurowano prawidłową metodę uwierzytelniania w Gateway (domyślnie współdzielony sekret, nawet w interfejsie pętli zwrotnej).

## Jak to działa

- Interfejs łączy się z WebSocketem Gateway i używa metod RPC `chat.history`, `chat.send`, `chat.inject` oraz `chat.message.get`.
- `chat.history` ma ograniczony rozmiar w celu zapewnienia stabilności: Gateway może skracać długie pola tekstowe, pomijać rozbudowane metadane i zastępować zbyt duże wpisy wartością `[chat.history omitted: message too large]`. Klienci API mogą wysłać dla danego żądania parametr `maxChars`, aby zastąpić domyślny limit dla jednego wywołania.
- Gdy widoczna wiadomość asystenta została skrócona w `chat.history`, Control UI może otworzyć boczny panel czytnika i na żądanie pobrać pełny wpis po normalizacji do wyświetlania za pośrednictwem `chat.message.get`, bez zwiększania domyślnego rozmiaru historii. `chat.message.get` używa tej samej gałęzi transkrypcji i reguł wyświetlania co `chat.history`, ale wskazuje jeden wpis za pomocą `messageId` i zwraca zgodny ze stanem faktycznym powód niedostępności, gdy nie można już zwrócić pełnej treści.
- `chat.history` podąża za aktywną gałęzią transkrypcji w plikach sesji, do których dane są tylko dopisywane, dzięki czemu porzucone gałęzie po przepisaniu i zastąpione kopie promptów nie są renderowane w WebChat.
- Wpisy Compaction są renderowane jako separator „Skompaktowana historia” z wyjaśnieniem, że skompaktowana transkrypcja jest zachowywana jako punkt kontrolny, oraz z akcją otwierającą punkty kontrolne sesji (utworzenie gałęzi lub przywrócenie, jeśli pozwalają na to uprawnienia).
- Control UI zapamiętuje bazową wartość `sessionId` Gateway zwróconą przez `chat.history` i dołącza ją do kolejnych wywołań `chat.send`, dzięki czemu ponowne połączenia i odświeżenia strony kontynuują tę samą zapisaną rozmowę, chyba że użytkownik rozpocznie lub zresetuje sesję.
- `chat.send` przyjmuje klucz idempotencji (Control UI używa identyfikatora uruchomienia); Gateway deduplikuje powtarzające się żądania używające tego samego klucza, więc ponawiane lub zduplikowane, trwające wysłania dla tej samej sesji, wiadomości i załączników nie tworzą drugiego uruchomienia.
- Pliki startowe przestrzeni roboczej i oczekujące instrukcje `BOOTSTRAP.md` są przekazywane w sekcji `# Project Context` promptu systemowego agenta, a nie kopiowane do wiadomości użytkownika WebChat. Jeśli zawartość inicjalizacyjna zostanie skrócona, prompt systemowy otrzyma zamiast niej krótkie „Powiadomienie o kontekście inicjalizacyjnym”; szczegółowe liczby i ustawienia konfiguracji pozostają dostępne w interfejsach diagnostycznych.
- Normalizacja wyświetlania w `chat.history` usuwa: kontekst OpenClaw przeznaczony wyłącznie dla środowiska uruchomieniowego, otoczki przychodzących komunikatów, wbudowane znaczniki dyrektyw dostarczania, takie jak `[[reply_to_current]]`, `[[reply_to:<id>]]` i `[[audio_as_voice]]`, tekstowe ładunki XML wywołań narzędzi (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, w tym skrócone bloki) oraz ujawnione tokeny sterujące modelu zapisane znakami ASCII lub pełnej szerokości. Wpisy asystenta, których cały widoczny tekst zawiera wyłącznie token ciszy `NO_REPLY` (bez rozróżniania wielkości liter), są pomijane.
- Ładunki odpowiedzi oznaczone jako rozumowanie (`isReasoning: true`) są wykluczane z treści asystenta w WebChat, tekstu odtwarzanej transkrypcji i bloków zawartości audio, dzięki czemu ładunki zawierające wyłącznie tok rozumowania nie są wyświetlane jako widoczne wiadomości asystenta ani udostępniane jako dźwięk do odtworzenia.
- `chat.inject` dopisuje notatkę asystenta bezpośrednio do transkrypcji i rozsyła ją do interfejsu (bez uruchamiania agenta).
- Przerwane uruchomienia mogą pozostawiać częściową odpowiedź asystenta widoczną w interfejsie. Gdy istnieje zbuforowana odpowiedź, Gateway zapisuje jej częściowy tekst w historii transkrypcji i oznacza wpis metadanymi przerwania.

### Model transkrypcji i dostarczania

WebChat ma dwie oddzielne ścieżki danych:

- Wiersze transkrypcji SQLite stanowią trwałą transkrypcję modelu i środowiska uruchomieniowego. W przypadku zwykłych uruchomień agenta osadzone środowisko uruchomieniowe OpenClaw zapisuje widoczne dla modelu wiadomości `user`, `assistant` i `toolResult` za pośrednictwem akcesora sesji. WebChat nie zapisuje w tej transkrypcji dowolnego tekstu dotyczącego dostarczania, statusu ani komunikatów pomocniczych.
- Zdarzenia `ReplyPayload` Gateway stanowią bieżącą projekcję dostarczania: znormalizowaną pod kątem wyświetlania w WebChat lub kanale, strumieniowania blokowego, znaczników dyrektyw, osadzania multimediów, flag TTS/audio i zachowania awaryjnego interfejsu. Same nie stanowią kanonicznego dziennika sesji.
- Środowiska testowe wymagające widocznych odpowiedzi za pośrednictwem `tools.message` nadal używają WebChat jako wewnętrznego miejsca docelowego odpowiedzi źródłowej dla bieżącego uruchomienia. Pozbawione celu `message.send` z tego aktywnego uruchomienia WebChat jest rzutowane do tego samego czatu i kopiowane do transkrypcji sesji; WebChat nie staje się kanałem wychodzącym wielokrotnego użytku i nigdy nie dziedziczy `lastChannel`.
- WebChat wstawia wpisy asystenta do transkrypcji tylko wtedy, gdy Gateway jest właścicielem wyświetlanej wiadomości poza zwykłą osadzoną turą agenta: `chat.inject`, odpowiedzi poleceń niewymagających agenta, przerwana częściowa odpowiedź oraz zarządzane przez WebChat uzupełnienia transkrypcji dotyczące multimediów.
- Jeśli tekst asystenta pojawia się na żywo podczas uruchomienia, ale znika po ponownym załadowaniu historii, należy sprawdzić kolejno: czy transkrypcja SQLite zawiera tekst asystenta, czy projekcja wyświetlania `chat.history` go usunęła, a następnie czy optymistyczne scalanie końca transkrypcji w Control UI zastąpiło lokalny stan dostarczania utrwalonym zrzutem.

Końcowe odpowiedzi zwykłych uruchomień agenta powinny być trwałe, ponieważ osadzone środowisko uruchomieniowe zapisuje `message_end` asystenta. Każdy mechanizm awaryjny kopiujący dostarczony końcowy ładunek do transkrypcji musi najpierw zapobiec zduplikowaniu tury asystenta, którą osadzone środowisko uruchomieniowe już zapisało.

## Panel narzędzi agentów w Control UI

- Panel Tools w `/agents` interfejsu Control UI zawiera widok „Dostępne teraz” obsługiwany przez `tools.effective(sessionKey=...)`: generowaną przez serwer projekcję inwentarza narzędzi bieżącej sesji przeznaczoną tylko do odczytu, obejmującą narzędzia podstawowe, Plugin, należące do kanałów oraz narzędzia już wykrytych serwerów MCP.
- Oddzielny widok edycji konfiguracji (obsługiwany przez `tools.catalog`) obejmuje profile, nadpisania dla poszczególnych agentów i semantykę katalogu.
- Dostępność w środowisku uruchomieniowym jest zależna od sesji. Przełączenie sesji tego samego agenta może zmienić listę „Dostępne teraz”. Jeśli skonfigurowane serwery MCP nie zostały połączone lub zmieniły się od ostatniego wykrywania, panel wyświetla powiadomienie zamiast po cichu uruchamiać transporty MCP ze ścieżki odczytu.
- Edytor konfiguracji nie oznacza dostępności w środowisku uruchomieniowym; efektywny dostęp nadal podlega hierarchii zasad (`allow`/`deny` oraz nadpisaniom dla poszczególnych agentów, dostawców i kanałów).

## Użycie zdalne

- Tryb zdalny tuneluje WebSocket Gateway przez SSH/Tailscale.
- Nie trzeba uruchamiać oddzielnego serwera WebChat.

## Dokumentacja konfiguracji (WebChat)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

WebChat nie ma utrwalanej sekcji konfiguracji. Gateway używa wbudowanego limitu wyświetlania `chat.history`; klienci API mogą wysłać dla danego żądania parametr `maxChars`, aby zastąpić go dla pojedynczego wywołania. Starsza konfiguracja `channels.webchat` i `gateway.webchat` została wycofana; uruchom `openclaw doctor --fix`, aby ją usunąć.

Powiązane opcje globalne:

- `gateway.port`, `gateway.bind`: host/port WebSocketu.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  uwierzytelnianie WebSocketu za pomocą współdzielonego sekretu.
- `gateway.auth.allowTailscale`: karta czatu Control UI w przeglądarce może używać nagłówków
  tożsamości Tailscale Serve, gdy ta opcja jest włączona.
- `gateway.auth.mode: "trusted-proxy"`: uwierzytelnianie przez odwrotne proxy dla klientów przeglądarkowych za rozpoznającym tożsamość źródłem proxy **innym niż interfejs pętli zwrotnej** (zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: docelowy zdalny Gateway.
- `session.*`: pamięć sesji i domyślne ustawienia klucza głównego.

## Powiązane

- [Control UI](/pl/web/control-ui)
- [Panel sterowania](/pl/web/dashboard)
