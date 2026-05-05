---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz dostępu do Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Przeglądarkowy interfejs sterowania Gateway (czat, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-05-05T06:20:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d249559d26ef8d257a14b104a797442e9fbb67a8ab31c7fcc9eaa4127f29c933
    source_path: web/control-ui.md
    workflow: 16
---

Interfejs sterowania to mała jednostronicowa aplikacja **Vite + Lit** udostępniana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Komunikuje się **bezpośrednio z Gateway WebSocket** na tym samym porcie.

## Szybkie otwarcie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

Uwierzytelnianie jest przekazywane podczas uzgadniania WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego serwera proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień pulpitu zachowuje token dla bieżącej sesji karty przeglądarki i wybranego adresu URL gateway; hasła nie są utrwalane. Onboarding zwykle generuje token gateway do uwierzytelniania współdzielonym sekretem przy pierwszym połączeniu, ale uwierzytelnianie hasłem też działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z interfejsem sterowania z nowej przeglądarki lub urządzenia, Gateway zwykle wymaga **jednorazowej zgody na parowanie**. To zabezpieczenie przed nieautoryzowanym dostępem.

**Co zobaczysz:** „disconnected (1008): pairing required”

<Steps>
  <Step title="Wyświetl oczekujące żądania">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Zatwierdź według identyfikatora żądania">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Jeśli przeglądarka ponawia parowanie ze zmienionymi danymi uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/admin, jest to traktowane jako podniesienie poziomu zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw utrzymuje starą zgodę aktywną, blokuje ponowne połączenie z szerszym zakresem i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie zostaje zapamiętane i nie będzie wymagać ponownego zatwierdzenia, chyba że je odwołasz za pomocą `openclaw devices revoke --device <id> --role <role>`. Rotację i odwoływanie tokenów opisuje [CLI urządzeń](/pl/cli/devices).

<Note>
- Bezpośrednie połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć rundę parowania dla sesji operatora interfejsu sterowania, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie powiązania Tailnet, połączenia przeglądarki z LAN i profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikalny identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

</Note>

## Tożsamość osobista (lokalna dla przeglądarki)

Interfejs sterowania obsługuje osobistą tożsamość przypisaną do przeglądarki (wyświetlaną nazwę i awatar), dołączaną do wiadomości wychodzących w celu atrybucji w sesjach współdzielonych. Jest przechowywana w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza zwykłymi metadanymi autorstwa transkrypcji dla wiadomości, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam wzorzec lokalny dla przeglądarki dotyczy nadpisania awatara asystenta. Przesłane awatary asystenta nakładają tożsamość ustaloną przez gateway tylko w lokalnej przeglądarce i nigdy nie są przesyłane w obie strony przez `config.patch`. Współdzielone pole konfiguracji `ui.assistant.avatar` nadal jest dostępne dla klientów innych niż UI, którzy zapisują to pole bezpośrednio (takich jak skryptowe gateway lub niestandardowe pulpity).

## Endpoint konfiguracji środowiska uruchomieniowego

Interfejs sterowania pobiera ustawienia środowiska uruchomieniowego z `/__openclaw/control-ui-config.json`. Ten endpoint jest chroniony tym samym uwierzytelnianiem gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a udane pobranie wymaga już prawidłowego tokenu/hasła gateway, tożsamości Tailscale Serve albo tożsamości zaufanego serwera proxy.

## Obsługa języków

Interfejs sterowania może zlokalizować się przy pierwszym załadowaniu na podstawie ustawień regionalnych przeglądarki. Aby później to nadpisać, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor ustawień regionalnych znajduje się w karcie Dostęp do Gateway, a nie w sekcji Wygląd.

- Obsługiwane ustawienia regionalne: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są ładowane leniwie w przeglądarce.
- Wybrane ustawienia regionalne są zapisywane w pamięci przeglądarki i używane ponownie podczas kolejnych wizyt.
- Brakujące klucze tłumaczeń używają języka angielskiego jako wartości zastępczej.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu ustawień regionalnych innych niż angielskie, ale wbudowany selektor języka witryny dokumentacji Mintlify jest ograniczony do kodów ustawień regionalnych akceptowanych przez Mintlify. Dokumentacja tajska (`th`) i perska (`fa`) nadal jest generowana w repozytorium publikacji; może nie pojawiać się w tym selektorze, dopóki Mintlify nie będzie obsługiwać tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [edytor tweakcn](https://tweakcn.com/editor/theme), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link motywu w sekcji Wygląd. Importer akceptuje też adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, względne ścieżki `/themes/<id>`, surowe identyfikatory motywów i domyślne nazwy motywów, takie jak `amethyst-haze`.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane w konfiguracji gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; wyczyszczenie go przełącza aktywny motyw z powrotem na Claw, jeśli zaimportowany motyw był wybrany.

## Co może robić (obecnie)

<AccordionGroup>
  <Accordion title="Czat i rozmowa głosowa">
    - Czatuj z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Rozmawiaj przez przeglądarkowe sesje czasu rzeczywistego. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokenu przeglądarki przez WebSocket, a pluginy głosu czasu rzeczywistego działające wyłącznie po stronie backendu używają transportu przekaźnikowego Gateway. Przekaźnik utrzymuje poświadczenia dostawcy na Gateway, podczas gdy przeglądarka strumieniuje mikrofonowy PCM przez RPC `talk.realtime.relay*` i odsyła wywołania narzędzi `openclaw_agent_consult` przez `chat.send` do większego skonfigurowanego modelu OpenClaw.
    - Strumieniuj wywołania narzędzi + karty wyjścia narzędzi na żywo w czacie (zdarzenia agenta).

  </Accordion>
  <Accordion title="Kanały, instancje, sesje, sny">
    - Kanały: status kanałów wbudowanych oraz dołączonych/zewnętrznych kanałów pluginów, logowanie QR i konfiguracja per kanał (`channels.status`, `web.login.*`, `config.patch`).
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: lista + nadpisania modelu/myślenia/szybkiego trybu/pełnej szczegółowości/śledzenia/rozumowania per sesja (`sessions.list`, `sessions.patch`).
    - Sny: status dreaming, przełącznik włącz/wyłącz i czytnik dziennika snów (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, zatwierdzenia exec">
    - Zadania Cron: lista/dodawanie/edycja/uruchamianie/włączanie/wyłączanie + historia uruchomień (`cron.*`).
    - Skills: status, włączanie/wyłączanie, instalacja, aktualizacje kluczy API (`skills.*`).
    - Nodes: lista + możliwości (`node.list`).
    - Zatwierdzenia exec: edycja list dozwolonych gateway lub node + polityka pytań dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguracja">
    - Wyświetl/edytuj `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Zastosuj + uruchom ponownie z walidacją (`config.apply`) i wybudź ostatnią aktywną sesję.
    - Zapisy zawierają zabezpieczenie base-hash, aby zapobiec nadpisaniu równoczesnych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wykonują wstępną kontrolę rozwiązywania aktywnych SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Schemat + renderowanie formularza (`config.schema` / `config.schema.lookup`, w tym pola `title` / `description`, dopasowane wskazówki UI, podsumowania bezpośrednich elementów podrzędnych, metadane dokumentacji na zagnieżdżonych węzłach obiektów/wieloznacznych/tablic/kompozycji oraz schematy pluginów + kanałów, gdy są dostępne); edytor surowego JSON jest dostępny tylko wtedy, gdy migawka ma bezpieczną surową rundę w obie strony.
    - Jeśli migawka nie może bezpiecznie wykonać rundy w obie strony jako surowy tekst, interfejs sterowania wymusza tryb formularza i wyłącza tryb surowy dla tej migawki.
    - Opcja edytora surowego JSON „Resetuj do zapisanych” zachowuje kształt utworzony jako surowy tekst (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczoną migawkę, więc zewnętrzne edycje przetrwają reset, gdy migawka może bezpiecznie wykonać rundę w obie strony.
    - Strukturalne wartości obiektów SecretRef są renderowane jako tylko do odczytu w tekstowych polach formularza, aby zapobiec przypadkowemu uszkodzeniu przez konwersję obiektu na ciąg znaków.

  </Accordion>
  <Accordion title="Debugowanie, logi, aktualizacja">
    - Debugowanie: migawki statusu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Dziennik zdarzeń obejmuje czasy odświeżania/RPC interfejsu sterowania oraz wpisy responsywności przeglądarki dla długich klatek animacji lub długich zadań, gdy przeglądarka udostępnia te typy wpisów PerformanceObserver.
    - Logi: podgląd na żywo logów plikowych gateway z filtrowaniem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + restart (`update.run`) z raportem restartu, a następnie odpytuj `update.status` po ponownym połączeniu, aby zweryfikować działającą wersję gateway.

  </Accordion>
  <Accordion title="Uwagi do panelu zadań Cron">
    - Dla zadań izolowanych dostarczanie domyślnie ogłasza podsumowanie. Możesz przełączyć na brak, jeśli chcesz uruchomienia tylko wewnętrzne.
    - Pola kanału/celu pojawiają się, gdy wybrane jest ogłaszanie.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy adres URL Webhook HTTP(S).
    - Dla zadań sesji głównej dostępne są tryby dostarczania Webhook i brak.
    - Zaawansowane kontrolki edycji obejmują usunięcie po uruchomieniu, wyczyszczenie nadpisania agenta, opcje dokładnego/rozłożonego Cron, nadpisania modelu/myślenia agenta oraz przełączniki dostarczania best-effort.
    - Walidacja formularza jest wbudowana z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu poprawienia.
    - Ustaw `cron.webhookToken`, aby wysyłać dedykowany token bearer; jeśli zostanie pominięty, Webhook jest wysyłany bez nagłówka uwierzytelniania.
    - Przestarzały mechanizm zastępczy: zapisane starsze zadania z `notify: true` nadal mogą używać `cron.webhook` do czasu migracji.

  </Accordion>
</AccordionGroup>

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: natychmiast potwierdza z `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`.
    - Przesyłanie w czacie akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; pozostałe pliki są przechowywane jako zarządzane multimedia i pokazywane w historii jako linki do załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` w trakcie działania oraz `{ status: "ok" }` po zakończeniu.
    - Odpowiedzi `chat.history` mają ograniczony rozmiar dla bezpieczeństwa UI. Gdy wpisy transkryptu są zbyt duże, Gateway może obciąć długie pola tekstowe, pominąć ciężkie bloki metadanych i zastąpić zbyt duże wiadomości symbolem zastępczym (`[chat.history omitted: message too large]`).
    - Obrazy asystenta/wygenerowane są utrwalane jako odwołania do zarządzanych multimediów i zwracane przez uwierzytelnione adresy URL multimediów Gateway, więc ponowne załadowania nie zależą od pozostawania surowych ładunków obrazów base64 w odpowiedzi historii czatu.
    - Podczas renderowania `chat.history` Control UI usuwa z widocznego tekstu asystenta wyłącznie prezentacyjne wbudowane tagi dyrektyw (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi), a także ujawnione tokeny sterujące modelu ASCII/pełnej szerokości, oraz pomija wpisy asystenta, których cały widoczny tekst jest tylko dokładnym cichym tokenem `NO_REPLY` / `no_reply` albo tokenem potwierdzenia Heartbeat `HEARTBEAT_OK`.
    - Podczas aktywnego wysyłania i końcowego odświeżenia historii widok czatu zachowuje widoczne lokalne optymistyczne wiadomości użytkownika/asystenta, jeśli `chat.history` chwilowo zwraca starszą migawkę; kanoniczny transkrypt zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległości.
    - Zdarzenia `chat` na żywo są stanem dostarczenia, natomiast `chat.history` jest odbudowywane z trwałego transkryptu sesji. Po zdarzeniach końcowych narzędzi Control UI przeładowuje historię i scala tylko mały optymistyczny ogon; granica transkryptu jest udokumentowana w [WebChat](/pl/web/webchat).
    - `chat.inject` dołącza notatkę asystenta do transkryptu sesji i rozgłasza zdarzenie `chat` wyłącznie dla aktualizacji UI (bez uruchomienia agenta, bez dostarczenia do kanału).
    - Nagłówek czatu pokazuje filtr agenta przed selektorem sesji, a selektor sesji jest zawężony do wybranego agenta. Przełączenie agentów pokazuje tylko sesje powiązane z tym agentem i wraca do głównej sesji tego agenta, gdy nie ma on jeszcze zapisanych sesji panelu.
    - Przy szerokościach desktopowych elementy sterujące czatu pozostają w jednym kompaktowym wierszu i zwijają się podczas przewijania transkryptu w dół; przewinięcie w górę, powrót na początek lub dojście do końca przywraca elementy sterujące.
    - Kolejne zduplikowane wiadomości zawierające tylko tekst renderują się jako jeden dymek z odznaką liczby. Wiadomości zawierające obrazy, załączniki, wynik narzędzia lub podglądy canvas pozostają niezwinięte.
    - Selektory modelu czatu i myślenia natychmiast aktualizują aktywną sesję przez `sessions.patch`; są trwałymi nadpisaniami sesji, a nie opcjami wysyłania tylko dla jednej tury.
    - Wpisanie `/new` w Control UI tworzy i przełącza na tę samą nową sesję panelu co New Chat. Wpisanie `/reset` zachowuje jawny reset w miejscu Gateway dla bieżącej sesji.
    - Selektor modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli obecne jest `agents.defaults.models`, ta lista dozwolonych elementów steruje selektorem. W przeciwnym razie selektor pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnianiem. Pełny katalog pozostaje dostępny przez debugowe RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway pokazują wysoką presję kontekstu, obszar kompozytora czatu pokazuje powiadomienie o kontekście, a na zalecanych poziomach Compaction kompaktowy przycisk uruchamiający normalną ścieżkę Compaction sesji. Nieaktualne migawki tokenów są ukryte, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb rozmowy (realtime w przeglądarce)">
    Tryb rozmowy używa zarejestrowanego dostawcy głosu realtime. Skonfiguruj OpenAI za pomocą `talk.provider: "openai"` oraz `talk.providers.openai.apiKey` albo skonfiguruj Google za pomocą `talk.provider: "google"` oraz `talk.providers.google.apiKey`; konfigurację dostawcy realtime Voice Call nadal można wykorzystać jako rozwiązanie awaryjne. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy, ograniczony token uwierzytelniania Live API dla sesji WebSocket w przeglądarce, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy, którzy udostępniają tylko backendowy most realtime, działają przez transport przekaźnikowy Gateway, dzięki czemu poświadczenia i gniazda dostawców pozostają po stronie serwera, a dźwięk z przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.realtime.session` nie akceptuje nadpisań instrukcji podanych przez wywołującego.

    W kompozytorze czatu kontrolka rozmowy to przycisk fal obok przycisku dyktowania mikrofonem. Po uruchomieniu rozmowy wiersz stanu kompozytora pokazuje `Connecting Talk...`, następnie `Talk live`, gdy dźwięk jest połączony, albo `Asking OpenClaw...`, gdy wywołanie narzędzia realtime konsultuje się ze skonfigurowanym większym modelem przez `chat.send`.

    Utrzymaniowy smoke test na żywo: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje wymianę SDP WebRTC przeglądarki OpenAI, konfigurację WebSocket przeglądarki Google Live z ograniczonym tokenem oraz przekaźnikowy adapter przeglądarki Gateway z fałszywymi multimediami mikrofonu. Polecenie wypisuje tylko status dostawcy i nie zapisuje sekretów w logach.

  </Accordion>
  <Accordion title="Zatrzymanie i przerwanie">
    - Kliknij **Stop** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe odpowiedzi następcze trafiają do kolejki. Kliknij **Steer** na wiadomości w kolejce, aby wstrzyknąć tę odpowiedź następczą do trwającej tury.
    - Wpisz `/stop` (lub samodzielne frazy przerywania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`) w celu przerwania wszystkich aktywnych uruchomień dla tej sesji.

  </Accordion>
  <Accordion title="Zachowanie częściowej treści po przerwaniu">
    - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta nadal może być pokazany w UI.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkryptu, gdy istnieje zbuforowany wynik.
    - Utrwalone wpisy zawierają metadane przerwania, dzięki czemu konsumenci transkryptu mogą odróżnić częściowe treści po przerwaniu od normalnego wyniku zakończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i web push

Control UI dostarcza `manifest.webmanifest` i service worker, więc nowoczesne przeglądarki mogą zainstalować je jako samodzielną PWA. Web Push pozwala Gateway wybudzać zainstalowaną PWA za pomocą powiadomień nawet wtedy, gdy karta lub okno przeglądarki nie jest otwarte.

| Powierzchnia                                           | Co robi                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                       | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy stanie się osiągalna. |
| `ui/public/sw.js`                                      | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw)     | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                     | Utrwalone endpointy subskrypcji przeglądarek.                      |

Nadpisz parę kluczy VAPID przez zmienne środowiskowe w procesie Gateway, gdy chcesz przypiąć klucze (dla wdrożeń wielohostowych, rotacji sekretów lub testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `mailto:openclaw@localhost`)

Control UI używa tych metod Gateway ograniczonych zakresem do rejestrowania i testowania subskrypcji przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany endpoint.
- `push.web.test` — wysyła powiadomienie testowe do subskrypcji wywołującego.

<Note>
Web Push jest niezależny od ścieżki przekaźnika APNS iOS (zobacz [Konfiguracja](/pl/gateway/configuration) dla powiadomień push opartych na przekaźniku) oraz istniejącej metody `push.test`, które celują w natywne parowanie mobilne.
</Note>

## Hostowane osadzenia

Wiadomości asystenta mogą renderować hostowaną treść webową w wierszu za pomocą shortcode `[embed ...]`. Polityka piaskownicy iframe jest kontrolowana przez `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (default)">
    Zezwala na interaktywne osadzenia przy zachowaniu izolacji pochodzenia; jest to wartość domyślna i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
  </Tab>
  <Tab title="trusted">
    Dodaje `allow-same-origin` na wierzchu `allow-scripts` dla dokumentów z tej samej witryny, które celowo potrzebują silniejszych uprawnień.
  </Tab>
</Tabs>

Przykład:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Używaj `trusted` tylko wtedy, gdy osadzony dokument naprawdę potrzebuje zachowania same-origin. Dla większości gier i interaktywnych canvas generowanych przez agentów `scripts` jest bezpieczniejszym wyborem.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` pozostają domyślnie zablokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` ładowało strony innych firm, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

## Szerokość wiadomości czatu

Zgrupowane wiadomości czatu używają czytelnej domyślnej maksymalnej szerokości. Wdrożenia na szerokich monitorach mogą ją nadpisać bez łatania dołączonego CSS, ustawiając `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Wartość jest walidowana, zanim trafi do przeglądarki. Obsługiwane wartości obejmują zwykłe długości i procenty, takie jak `960px` lub `82%`, oraz ograniczone wyrażenia szerokości `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` i `fit-content(...)`.

## Dostęp przez tailnet (zalecane)

<Tabs>
  <Tab title="Zintegrowany Tailscale Serve (preferowane)">
    Zachowaj Gateway na loopback i pozwól Tailscale Serve proxywać go przez HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (lub skonfigurowany `gateway.controlUi.basePath`)

    Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość przez rozwiązywanie adresu `x-forwarded-for` za pomocą `tailscale whois` i dopasowanie go do nagłówka, a akceptuje je tylko wtedy, gdy żądanie trafia w loopback z nagłówkami `x-forwarded-*` Tailscale. Dla sesji operatora Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija także rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia z rolą węzła nadal przechodzą normalne kontrole urządzenia. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń współdzielonego sekretu nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` lub `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia dla tego samego IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Równoległe błędne ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niezgodności ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokena zakłada, że host gateway jest zaufany. Jeśli na tym hoście może działać niezaufany lokalny kod, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Powiąż z tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (lub skonfigurowany `gateway.controlUi.basePath`)

    Wklej pasujący współdzielony sekret w ustawieniach UI (wysyłany jako `connect.params.auth.token` lub `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niezabezpieczony HTTP

Jeśli otworzysz panel przez zwykły HTTP (`http://<lan-ip>` lub `http://<tailscale-ip>`), przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność niezabezpieczonego HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- pomyślne uwierzytelnianie operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana poprawka:** użyj HTTPS (Tailscale Serve) albo otwórz UI lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście Gateway)

<AccordionGroup>
  <Accordion title="Działanie przełącznika niezabezpieczonego uwierzytelniania">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` to wyłącznie lokalny przełącznik zgodności:

    - Pozwala sesjom Control UI na localhost kontynuować bez tożsamości urządzenia w niezabezpieczonych kontekstach HTTP.
    - Nie omija kontroli parowania.
    - Nie łagodzi wymagań dotyczących tożsamości urządzenia dla zdalnych (innych niż localhost) połączeń.

  </Accordion>
  <Accordion title="Tylko tryb awaryjny">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia Control UI i jest poważnym obniżeniem poziomu bezpieczeństwa. Cofnij tę zmianę szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Uwaga o trusted-proxy">
    - Pomyślne uwierzytelnianie trusted-proxy może dopuścić sesje Control UI **operatora** bez tożsamości urządzenia.
    - To **nie** obejmuje sesji Control UI z rolą node.
    - Zwrotne proxy reverse proxy na tym samym hoście nadal nie spełniają uwierzytelniania trusted-proxy; zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki dotyczące konfiguracji HTTPS.

## Polityka bezpieczeństwa treści

Control UI jest dostarczany z restrykcyjną polityką `img-src`: dozwolone są tylko zasoby **same-origin**, adresy URL `data:` i lokalnie wygenerowane adresy URL `blob:`. Zdalne adresy URL obrazów `http(s)` i zależne od protokołu są odrzucane przez przeglądarkę i nie powodują wysyłania żądań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy awatarów, które UI pobiera i konwertuje na lokalne adresy URL `blob:`.
- Wbudowane adresy URL `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Lokalne adresy URL `blob:` utworzone przez Control UI nadal się renderują.
- Zdalne adresy URL awatarów emitowane przez metadane kanałów są usuwane przez pomocniki awatarów Control UI i zastępowane wbudowanym logo/znaczkiem, więc przejęty lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz nic zmieniać, aby uzyskać to zachowanie — jest zawsze włączone i nie można go konfigurować.

## Uwierzytelnianie trasy awatara

Gdy uwierzytelnianie Gateway jest skonfigurowane, punkt końcowy awatarów Control UI wymaga tego samego tokenu Gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara na tej samej zasadzie.
- Nieuwierzytelnione żądania do którejkolwiek trasy są odrzucane (zgodnie z sąsiednią trasą assistant-media). Zapobiega to ujawnianiu przez trasę awatara tożsamości agenta na hostach, które poza tym są chronione.
- Sam Control UI przekazuje token Gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych adresów URL blob, dzięki czemu obraz nadal renderuje się w panelach.

Jeśli wyłączysz uwierzytelnianie Gateway (niezalecane na współdzielonych hostach), trasa awatara również staje się nieuwierzytelniona, zgodnie z resztą Gateway.

## Uwierzytelnianie trasy multimediów asystenta

Gdy uwierzytelnianie Gateway jest skonfigurowane, lokalne podglądy multimediów asystenta używają trasy dwuetapowej:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` wymaga normalnego uwierzytelniania operatora Control UI. Przeglądarka wysyła token Gateway jako nagłówek bearer podczas sprawdzania dostępności.
- Pomyślne odpowiedzi z metadanymi zawierają krótkotrwały `mediaTicket` ograniczony do dokładnie tej ścieżki źródłowej.
- Adresy URL obrazów, dźwięku, wideo i dokumentów renderowanych przez przeglądarkę używają `mediaTicket=<ticket>` zamiast aktywnego tokenu lub hasła Gateway. Bilet szybko wygasa i nie może autoryzować innego źródła.

Dzięki temu normalne renderowanie multimediów pozostaje zgodne z natywnymi elementami multimedialnymi przeglądarki bez umieszczania wielokrotnego użytku poświadczeń Gateway w widocznych adresach URL multimediów.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je za pomocą:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz mieć stałe adresy URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do lokalnego programowania (osobny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na adres URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

## Debugowanie/testowanie: serwer deweloperski + zdalny Gateway

Control UI to pliki statyczne; cel WebSocket jest konfigurowalny i może różnić się od źródła HTTP. Jest to wygodne, gdy chcesz używać lokalnie serwera deweloperskiego Vite, ale Gateway działa gdzie indziej.

<Steps>
  <Step title="Uruchom serwer deweloperski UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Otwórz z gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Opcjonalne jednorazowe uwierzytelnianie (jeśli potrzebne):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uwagi">
    - `gatewayUrl` jest zapisywany w localStorage po załadowaniu i usuwany z adresu URL.
    - Jeśli przekazujesz pełny punkt końcowy `ws://` lub `wss://` przez `gatewayUrl`, zakoduj wartość `gatewayUrl` w URL, aby przeglądarka poprawnie przeanalizowała ciąg zapytania.
    - `token` powinien być przekazywany przez fragment adresu URL (`#token=...`), gdy tylko jest to możliwe. Fragmenty nie są wysyłane do serwera, co zapobiega wyciekom w logach żądań i Referer. Starsze parametry zapytania `?token=` nadal są importowane jednorazowo dla zgodności, ale tylko jako rozwiązanie awaryjne, i są usuwane natychmiast po bootstrapie.
    - `password` jest przechowywane tylko w pamięci.
    - Gdy `gatewayUrl` jest ustawione, UI nie wraca do konfiguracji ani poświadczeń środowiskowych. Podaj `token` (lub `password`) jawnie. Brak jawnych poświadczeń jest błędem.
    - Używaj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itd.).
    - `gatewayUrl` jest akceptowane tylko w oknie najwyższego poziomu (nie osadzone), aby zapobiec clickjackingowi.
    - Wdrożenia Control UI inne niż local loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne źródła). Obejmuje to zdalne konfiguracje deweloperskie.
    - Start Gateway może zasilić lokalne źródła, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, na podstawie efektywnego runtime bind i portu, ale zdalne źródła przeglądarek nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanymi lokalnymi testami. Oznacza to zezwolenie na dowolne źródło przeglądarki, a nie „dopasuj dowolny host, którego używam”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb awaryjnego źródła z nagłówka Host, ale jest to niebezpieczny tryb bezpieczeństwa.

  </Accordion>
</AccordionGroup>

Przykład:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Szczegóły konfiguracji zdalnego dostępu: [Zdalny dostęp](/pl/gateway/remote).

## Powiązane

- [Panel](/pl/web/dashboard) — panel Gateway
- [Kontrole stanu](/pl/gateway/health) — monitorowanie stanu Gateway
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [WebChat](/pl/web/webchat) — interfejs czatu oparty na przeglądarce
