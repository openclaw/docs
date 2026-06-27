---
read_when:
    - Debugowanie lub konfigurowanie dostępu do WebChat
summary: Statyczny host WebChat w pętli zwrotnej i użycie Gateway WS dla interfejsu czatu
title: Czat internetowy
x-i18n:
    generated_at: "2026-06-27T18:33:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 108dd98f975a2d2e980921bd0f486c3683c18ba6eb37111163af87929a9d7973
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
2. Otwórz interfejs WebChat (aplikację macOS/iOS) albo kartę czatu Control UI.
3. Upewnij się, że skonfigurowano prawidłową ścieżkę uwierzytelniania Gateway (domyślnie shared-secret,
   nawet na loopback).

## Jak to działa (zachowanie)

- Interfejs łączy się z Gateway WebSocket i używa `chat.history`, `chat.send` oraz `chat.inject`.
- `chat.history` jest ograniczone dla stabilności: Gateway może obcinać długie pola tekstowe, pomijać ciężkie metadane i zastępować zbyt duże wpisy tekstem `[chat.history omitted: message too large]`.
- Gdy widoczna wiadomość asystenta została obcięta w `chat.history`, Control UI może otworzyć boczny czytnik i na żądanie pobrać pełny, znormalizowany do wyświetlania wpis przez `chat.message.get`, bez zwiększania domyślnego ładunku historii.
- `chat.history` podąża za aktywną gałęzią transkrypcji dla nowoczesnych plików sesji tylko z dopisywaniem, więc porzucone gałęzie przepisywania i zastąpione kopie promptów nie są renderowane w WebChat.
- Wpisy Compaction renderują się jako jawny separator skompaktowanej historii. Separator wyjaśnia, że skompaktowana transkrypcja jest zachowana jako punkt kontrolny, i prowadzi do kontrolek punktów kontrolnych sesji, gdzie operatorzy mogą tworzyć gałęzie lub przywracać z tego skompaktowanego widoku, jeśli pozwalają na to ich uprawnienia.
- Control UI zapamiętuje bazowy `sessionId` Gateway zwrócony przez `chat.history` i dołącza go do kolejnych wywołań `chat.send`, więc ponowne połączenia i odświeżenia strony kontynuują tę samą zapisaną rozmowę, chyba że użytkownik rozpocznie albo zresetuje sesję.
- Control UI scala zduplikowane zgłoszenia w toku dla tej samej sesji, wiadomości i załączników przed wygenerowaniem nowego identyfikatora uruchomienia `chat.send`; Gateway nadal deduplikuje powtarzane żądania, które ponownie używają tego samego klucza idempotencji.
- Pliki startowe przestrzeni roboczej i oczekujące instrukcje `BOOTSTRAP.md` są dostarczane przez Project Context w prompcie systemowym agenta, a nie kopiowane do wiadomości użytkownika WebChat. Obcięcie bootstrap dodaje tylko zwięzłe powiadomienie odzyskiwania w prompcie systemowym; szczegółowe liczniki i pokrętła konfiguracji pozostają na powierzchniach diagnostycznych.
- `chat.history` jest także znormalizowane do wyświetlania: kontekst OpenClaw tylko dla runtime,
  opakowania przychodzących envelope, wbudowane tagi dyrektyw dostarczania,
  takie jak `[[reply_to_*]]` i `[[audio_as_voice]]`, tekstowe ładunki XML wywołań narzędzi
  (w tym `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi), a także
  wyciekłe tokeny sterujące modelu ASCII/pełnej szerokości są usuwane z widocznego tekstu,
  a wpisy asystenta, których cały widoczny tekst jest wyłącznie dokładnym cichym
  tokenem `NO_REPLY` / `no_reply`, są pomijane.
- Ładunki odpowiedzi oznaczone flagą rozumowania (`isReasoning: true`) są wykluczane z treści asystenta w WebChat, tekstu odtwarzania transkrypcji i bloków treści audio, więc ładunki służące wyłącznie myśleniu nie pojawiają się jako widoczne wiadomości asystenta ani odtwarzalne audio.
- `chat.inject` dopisuje notatkę asystenta bezpośrednio do transkrypcji i rozgłasza ją do interfejsu (bez uruchomienia agenta).
- Przerwane uruchomienia mogą zachować częściowe wyjście asystenta widoczne w interfejsie.
- Gateway utrwala przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje zbuforowane wyjście, i oznacza te wpisy metadanymi przerwania.
- Historia jest zawsze pobierana z Gateway (bez obserwowania lokalnych plików).
- Jeśli Gateway jest nieosiągalny, WebChat jest tylko do odczytu.

### Model transkrypcji i dostarczania

WebChat ma dwie oddzielne ścieżki danych:

- Plik JSONL sesji jest trwałą transkrypcją modelu/runtime. Dla zwykłych uruchomień agenta osadzony runtime OpenClaw utrwala widoczne dla modelu wiadomości `user`, `assistant` i `toolResult` przez swój menedżer sesji. WebChat nie zapisuje arbitralnej treści dostarczania, statusu ani tekstu pomocniczego do tej transkrypcji.
- Zdarzenia Gateway `ReplyPayload` są projekcją dostarczania na żywo. Mogą być normalizowane pod kątem wyświetlania w WebChat/kanale, streamingu bloków, tagów dyrektyw, osadzania mediów, flag TTS/audio i zachowania awaryjnego interfejsu. Same nie są kanonicznym dziennikiem sesji.
- Harnessy wymagające widocznych odpowiedzi przez `tools.message` nadal używają WebChat jako wewnętrznego odbiornika odpowiedzi źródłowych dla bieżącego uruchomienia. Bezcellowe `message.send` z tego aktywnego uruchomienia WebChat jest projektowane do tego samego czatu i odzwierciedlane w transkrypcji sesji; WebChat nie staje się wielokrotnego użytku kanałem wychodzącym i nigdy nie dziedziczy `lastChannel`.
- WebChat wstrzykuje wpisy transkrypcji asystenta tylko wtedy, gdy Gateway jest właścicielem wyświetlanej wiadomości poza normalną osadzoną turą agenta: `chat.inject`, odpowiedzi poleceń niebędące agentem, przerwane częściowe wyjście oraz zarządzane przez WebChat uzupełnienia transkrypcji mediów.
- `chat.history` odczytuje zapisaną transkrypcję sesji i stosuje projekcję wyświetlania WebChat. Jeśli tekst asystenta na żywo pojawia się podczas uruchomienia, ale znika po przeładowaniu historii, najpierw sprawdź, czy surowy JSONL zawiera tekst asystenta, potem czy projekcja `chat.history` go usunęła, a następnie czy optymistyczne scalanie końcówki w Control UI zastąpiło lokalny stan dostarczania utrwaloną migawką.
- `chat.message.get` używa tych samych reguł gałęzi transkrypcji i projekcji wyświetlania co `chat.history`, w tym zakresowania aktywnego agenta, ale celuje w jeden wpis transkrypcji według `messageId` i zwraca uczciwy powód niedostępności, gdy pełna treść nie może już zostać zwrócona.

Końcowe odpowiedzi zwykłego uruchomienia agenta powinny być trwałe, ponieważ osadzony runtime zapisuje `message_end` asystenta. Każdy mechanizm awaryjny, który odzwierciedla dostarczony końcowy ładunek w transkrypcji, musi najpierw uniknąć zduplikowania tury asystenta, którą osadzony runtime już zapisał.

## Panel narzędzi agentów Control UI

- Panel Tools w Control UI `/agents` ma dwa oddzielne widoki:
  - **Available Right Now** używa `tools.effective(sessionKey=...)` i pokazuje wyprowadzoną przez serwer
    projekcję tylko do odczytu bieżącego inwentarza sesji, w tym narzędzia core, Plugin, należące do kanałów
    oraz już wykryte narzędzia serwera MCP.
  - **Tool Configuration** używa `tools.catalog` i pozostaje skupiony na profilach, nadpisaniach oraz
    semantyce katalogu.
- Dostępność runtime ma zakres sesji. Przełączanie sesji na tym samym agencie może zmienić
  listę **Available Right Now**. Jeśli skonfigurowane serwery MCP nie zostały połączone albo zostały zmienione
  od ostatniego wykrywania, panel pokazuje powiadomienie zamiast po cichu uruchamiać transporty MCP
  ze ścieżki odczytu.
- Edytor konfiguracji nie implikuje dostępności runtime; efektywny dostęp nadal podąża za precedencją zasad
  (`allow`/`deny`, nadpisania per agent oraz provider/kanał).

## Użycie zdalne

- Tryb zdalny tuneluje Gateway WebSocket przez SSH/Tailscale.
- Nie musisz uruchamiać oddzielnego serwera WebChat.

## Odniesienie konfiguracji (WebChat)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

WebChat nie ma utrwalonej sekcji konfiguracji. Gateway używa wbudowanego limitu wyświetlania `chat.history`; klienci API mogą wysyłać `maxChars` na żądanie, aby nadpisać go dla pojedynczego wywołania `chat.history`. Starsza konfiguracja `channels.webchat` i `gateway.webchat` została wycofana; uruchom `openclaw doctor --fix`, aby ją usunąć.

Powiązane opcje globalne:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  uwierzytelnianie WebSocket shared-secret.
- `gateway.auth.allowTailscale`: karta czatu Control UI w przeglądarce może używać nagłówków tożsamości Tailscale
  Serve, gdy są włączone.
- `gateway.auth.mode: "trusted-proxy"`: uwierzytelnianie przez reverse-proxy dla klientów przeglądarkowych za świadomym tożsamości źródłem proxy **niebędącym loopback** (zobacz [Uwierzytelnianie Trusted Proxy](/pl/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: zdalny cel Gateway.
- `session.*`: przechowywanie sesji i domyślne wartości klucza głównego.

## Powiązane

- [Control UI](/pl/web/control-ui)
- [Dashboard](/pl/web/dashboard)
