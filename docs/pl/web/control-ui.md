---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz mieć dostęp do Tailnetu bez tuneli SSH
sidebarTitle: Control UI
summary: Przeglądarkowy interfejs sterowania dla Gateway (czat, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-05-07T13:27:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9ef19392f0d14aef9373e4469789f5916250f76038c8c81fe8a932c47913ca8
    source_path: web/control-ui.md
    workflow: 16
---

Panel sterowania to mała jednostronicowa aplikacja **Vite + Lit** serwowana przez Gateway:

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
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień pulpitu zachowuje token dla bieżącej sesji karty przeglądarki i wybranego adresu URL gateway; hasła nie są utrwalane. Onboarding zwykle generuje token gateway dla uwierzytelniania współdzielonym sekretem przy pierwszym połączeniu, ale uwierzytelnianie hasłem też działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z panelem sterowania z nowej przeglądarki lub urządzenia, Gateway zwykle wymaga **jednorazowego zatwierdzenia parowania**. To środek bezpieczeństwa zapobiegający nieautoryzowanemu dostępowi.

**Co zobaczysz:** "rozłączono (1008): wymagane parowanie"

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

Jeśli przeglądarka ponawia parowanie ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/administrację, jest to traktowane jako podniesienie poziomu zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw zachowuje stare zatwierdzenie jako aktywne, blokuje szersze ponowne połączenie i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie jest zapamiętywane i nie będzie wymagać ponownego zatwierdzenia, chyba że je odwołasz poleceniem `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby poznać rotację i odwoływanie tokenów.

<Note>
- Bezpośrednie połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć rundę parowania dla sesji operatora panelu sterowania, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie powiązania Tailnet, połączenia przeglądarki z sieci LAN i profile przeglądarek bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikatowy identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

</Note>

## Tożsamość osobista (lokalna dla przeglądarki)

Panel sterowania obsługuje osobistą tożsamość dla każdej przeglądarki (nazwę wyświetlaną i awatar) dołączaną do wychodzących wiadomości w celu przypisania autorstwa w sesjach współdzielonych. Jest przechowywana w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza standardowymi metadanymi autorstwa transkrypcji wiadomości, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam lokalny dla przeglądarki wzorzec dotyczy nadpisania awatara asystenta. Przesłane awatary asystenta nakładają tożsamość rozwiązaną przez gateway tylko w lokalnej przeglądarce i nigdy nie przechodzą w obie strony przez `config.patch`. Wspólne pole konfiguracji `ui.assistant.avatar` pozostaje dostępne dla klientów innych niż interfejs użytkownika, którzy zapisują pole bezpośrednio (takich jak skryptowane gatewaye lub niestandardowe pulpity).

## Endpoint konfiguracji środowiska uruchomieniowego

Panel sterowania pobiera swoje ustawienia środowiska uruchomieniowego z `/__openclaw/control-ui-config.json`. Ten endpoint jest chroniony tym samym uwierzytelnianiem gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a udane pobranie wymaga albo już ważnego tokenu/hasła gateway, tożsamości Tailscale Serve, albo tożsamości zaufanego proxy.

## Obsługa języków

Panel sterowania może lokalizować się przy pierwszym ładowaniu na podstawie ustawień regionalnych przeglądarki. Aby później je nadpisać, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor ustawień regionalnych znajduje się na karcie Dostęp do Gateway, a nie w sekcji Wygląd.

- Obsługiwane ustawienia regionalne: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są ładowane leniwie w przeglądarce.
- Wybrane ustawienie regionalne jest zapisywane w pamięci przeglądarki i używane ponownie podczas kolejnych wizyt.
- Brakujące klucze tłumaczeń wracają do angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu ustawień regionalnych innych niż angielskie, ale wbudowany selektor języków witryny dokumentacji Mintlify jest ograniczony do kodów ustawień regionalnych akceptowanych przez Mintlify. Dokumentacja tajska (`th`) i perska (`fa`) nadal jest generowana w repozytorium publikacji; może nie pojawić się w tym selektorze, dopóki Mintlify nie będzie obsługiwać tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [edytor tweakcn](https://tweakcn.com/editor/theme), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link motywu w sekcji Wygląd. Importer akceptuje także adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, względne ścieżki `/themes/<id>`, surowe identyfikatory motywów oraz domyślne nazwy motywów, takie jak `amethyst-haze`.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane w konfiguracji gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; wyczyszczenie go przełącza aktywny motyw z powrotem na Claw, jeśli wybrany był zaimportowany motyw.

## Co potrafi (obecnie)

<AccordionGroup>
  <Accordion title="Czat i rozmowa">
    - Czatuj z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Odświeżenia historii czatu żądają ograniczonego ostatniego okna z limitami tekstu dla wiadomości, aby duże sesje nie zmuszały przeglądarki do renderowania pełnego ładunku transkrypcji, zanim czat stanie się użyteczny.
    - Rozmawiaj przez sesje czasu rzeczywistego w przeglądarce. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokenu przeglądarki przez WebSocket, a backendowe Pluginy głosu w czasie rzeczywistym używają transportu przekaźnikowego Gateway. Sesje dostawcy będące własnością klienta zaczynają się od `talk.client.create`; sesje przekaźnikowe Gateway zaczynają się od `talk.session.create`. Przekaźnik przechowuje dane uwierzytelniające dostawcy na Gateway, podczas gdy przeglądarka strumieniuje PCM z mikrofonu przez `talk.session.appendAudio` i przekazuje wywołania narzędzi dostawcy `openclaw_agent_consult` przez `talk.client.toolCall` dla zasad Gateway i większego skonfigurowanego modelu OpenClaw.
    - Strumieniuj wywołania narzędzi i karty wyjścia narzędzi na żywo w czacie (zdarzenia agenta).

  </Accordion>
  <Accordion title="Kanały, instancje, sesje, dreams">
    - Kanały: wbudowane oraz status kanałów Pluginów dołączonych/zewnętrznych, logowanie QR i konfiguracja dla kanału (`channels.status`, `web.login.*`, `config.patch`).
    - Odświeżenia sond kanałów utrzymują poprzedni zrzut jako widoczny, gdy powolne kontrole dostawców się kończą, a częściowe zrzuty są oznaczane, gdy sonda lub audyt przekroczy budżet interfejsu użytkownika.
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: domyślnie wyświetlaj sesje skonfigurowanych agentów, wracaj z przestarzałych kluczy sesji nieskonfigurowanych agentów i stosuj nadpisania modelu/myślenia/szybkiego trybu/szczegółowości/śledzenia/rozumowania dla sesji (`sessions.list`, `sessions.patch`).
    - Dreams: status dreaming, przełącznik włączania/wyłączania i czytnik Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Node, zatwierdzenia exec">
    - Zadania Cron: wyświetlanie/dodawanie/edycja/uruchamianie/włączanie/wyłączanie + historia uruchomień (`cron.*`).
    - Skills: status, włączanie/wyłączanie, instalacja, aktualizacje kluczy API (`skills.*`).
    - Node: lista + limity możliwości (`node.list`).
    - Zatwierdzenia exec: edytuj listy dozwolonych gateway lub Node + zasady pytań dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguracja">
    - Wyświetl/edytuj `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Zastosuj + uruchom ponownie z walidacją (`config.apply`) i wybudź ostatnią aktywną sesję.
    - Zapisy obejmują zabezpieczenie hash bazowego, aby zapobiec nadpisaniu równoczesnych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wykonują wstępną kontrolę rozwiązywania aktywnych SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Schemat + renderowanie formularza (`config.schema` / `config.schema.lookup`, w tym pola `title` / `description`, dopasowane wskazówki interfejsu użytkownika, natychmiastowe podsumowania dzieci, metadane dokumentacji w zagnieżdżonych węzłach obiektów/wieloznacznych/tablic/kompozycji oraz schematy Pluginów + kanałów, gdy są dostępne); edytor surowego JSON jest dostępny tylko wtedy, gdy zrzut ma bezpieczną surową rundę w obie strony.
    - Jeśli zrzut nie może bezpiecznie przejść surowej rundy w obie strony, panel sterowania wymusza tryb formularza i wyłącza tryb surowy dla tego zrzutu.
    - Edytor surowego JSON "Resetuj do zapisanych" zachowuje surowo utworzony kształt (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczony zrzut, więc zewnętrzne edycje przetrwają reset, gdy zrzut może bezpiecznie przejść rundę w obie strony.
    - Strukturalne wartości obiektów SecretRef są renderowane tylko do odczytu w tekstowych polach formularza, aby zapobiec przypadkowemu uszkodzeniu przez konwersję obiektu na ciąg znaków.

  </Accordion>
  <Accordion title="Debugowanie, logi, aktualizacja">
    - Debugowanie: zrzuty statusu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Dziennik zdarzeń obejmuje czasy odświeżania/RPC panelu sterowania, czasy powolnego renderowania czatu/konfiguracji oraz wpisy responsywności przeglądarki dla długich klatek animacji lub długich zadań, gdy przeglądarka udostępnia te typy wpisów PerformanceObserver.
    - Logi: podgląd na żywo końca logów plikowych gateway z filtrem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + ponowne uruchomienie (`update.run`) z raportem ponownego uruchomienia, a następnie odpytywanie `update.status` po ponownym połączeniu w celu weryfikacji wersji działającego gateway.

  </Accordion>
  <Accordion title="Uwagi panelu zadań Cron">
    - Dla zadań izolowanych dostarczanie domyślnie ogłasza podsumowanie. Możesz przełączyć na brak, jeśli chcesz uruchomienia wyłącznie wewnętrzne.
    - Pola kanału/celu pojawiają się, gdy wybrane jest ogłaszanie.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy adres URL Webhook HTTP(S).
    - Dla zadań głównej sesji dostępne są tryby dostarczania webhook i brak.
    - Zaawansowane kontrolki edycji obejmują usuwanie po uruchomieniu, czyszczenie nadpisania agenta, opcje dokładnego/rozłożonego Cron, nadpisania modelu/myślenia agenta oraz przełączniki dostarczania best-effort.
    - Walidacja formularza jest wbudowana z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu, dopóki nie zostaną poprawione.
    - Ustaw `cron.webhookToken`, aby wysyłać dedykowany token bearer; jeśli zostanie pominięty, webhook jest wysyłany bez nagłówka uwierzytelniania.
    - Przestarzały fallback: przechowywane starsze zadania z `notify: true` nadal mogą używać `cron.webhook` do czasu migracji.

  </Accordion>
</AccordionGroup>

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: natychmiast potwierdza odbiór przez `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`.
    - Przesyłanie na czacie akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; pozostałe pliki są przechowywane jako zarządzane multimedia i pokazywane w historii jako linki do załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po ukończeniu.
    - Odpowiedzi `chat.history` mają ograniczony rozmiar ze względów bezpieczeństwa UI. Gdy wpisy transkrypcji są zbyt duże, Gateway może skracać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować zbyt duże wiadomości symbolem zastępczym (`[chat.history omitted: message too large]`).
    - Obrazy asystenta/wygenerowane są utrwalane jako zarządzane odwołania do multimediów i serwowane z powrotem przez uwierzytelnione adresy URL multimediów Gateway, więc ponowne wczytania nie zależą od tego, czy surowe ładunki obrazów base64 pozostają w odpowiedzi historii czatu.
    - Podczas renderowania `chat.history` Control UI usuwa z widocznego tekstu asystenta znaczniki dyrektyw inline wyłącznie do wyświetlania (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), zwykłotekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz skrócone bloki wywołań narzędzi), a także ujawnione tokeny sterujące modelu ASCII/pełnej szerokości, oraz pomija wpisy asystenta, których cały widoczny tekst jest wyłącznie dokładnym cichym tokenem `NO_REPLY` / `no_reply` albo tokenem potwierdzenia Heartbeat `HEARTBEAT_OK`.
    - Podczas aktywnego wysyłania i końcowego odświeżenia historii widok czatu zachowuje widoczne lokalne optymistyczne wiadomości użytkownika/asystenta, jeśli `chat.history` krótko zwróci starszą migawkę; kanoniczna transkrypcja zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległość.
    - Zdarzenia `chat` na żywo są stanem dostarczenia, natomiast `chat.history` jest odbudowywane z trwałej transkrypcji sesji. Po zdarzeniach końcowych narzędzi Control UI ponownie wczytuje historię i scala tylko niewielki optymistyczny ogon; granica transkrypcji jest udokumentowana w [WebChat](/pl/web/webchat).
    - `chat.inject` dołącza notatkę asystenta do transkrypcji sesji i rozgłasza zdarzenie `chat` na potrzeby aktualizacji wyłącznie UI (bez uruchomienia agenta, bez dostarczenia kanałem).
    - Nagłówek czatu pokazuje filtr agenta przed selektorem sesji, a selektor sesji jest zawężony do wybranego agenta. Przełączanie agentów pokazuje tylko sesje powiązane z tym agentem i wraca do głównej sesji tego agenta, gdy nie ma on jeszcze zapisanych sesji panelu.
    - Na szerokościach desktopowych kontrolki czatu pozostają w jednym kompaktowym wierszu i zwijają się podczas przewijania transkrypcji w dół; przewijanie w górę, powrót na górę lub dotarcie do dołu przywraca kontrolki.
    - Kolejne zduplikowane wiadomości zawierające tylko tekst renderują się jako jeden dymek z odznaką liczby. Wiadomości zawierające obrazy, załączniki, wynik narzędzia lub podglądy canvas pozostają niezwinięte.
    - Selektory modelu i myślenia w nagłówku czatu natychmiast aktualizują aktywną sesję przez `sessions.patch`; są to trwałe nadpisania sesji, a nie opcje wysyłania tylko na jedną turę.
    - Wpisanie `/new` w Control UI tworzy i przełącza na tę samą świeżą sesję panelu co Nowy czat. Wpisanie `/reset` zachowuje jawny reset w miejscu Gateway dla bieżącej sesji.
    - Selektor modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli obecne jest `agents.defaults.models`, ta lista dozwolonych wartości steruje selektorem. W przeciwnym razie selektor pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnieniem. Pełny katalog pozostaje dostępny przez debugowe RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway zawierają bieżące tokeny kontekstu, obszar kompozytora czatu pokazuje kompaktowy wskaźnik użycia kontekstu. Przełącza się na styl ostrzegawczy przy wysokiej presji kontekstu i, przy zalecanych poziomach Compaction, pokazuje kompaktowy przycisk uruchamiający normalną ścieżkę Compaction sesji. Nieaktualne migawki tokenów są ukrywane, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb rozmowy (czas rzeczywisty w przeglądarce)">
    Tryb rozmowy używa zarejestrowanego dostawcy głosu w czasie rzeczywistym. Skonfiguruj OpenAI za pomocą `talk.realtime.provider: "openai"` oraz `talk.realtime.providers.openai.apiKey` albo skonfiguruj Google za pomocą `talk.realtime.provider: "google"` oraz `talk.realtime.providers.google.apiKey`. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy ograniczony token uwierzytelniania Live API dla sesji WebSocket w przeglądarce, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy, którzy udostępniają tylko most czasu rzeczywistego zaplecza, działają przez transport przekaźnika Gateway, dzięki czemu dane uwierzytelniające i gniazda dostawcy pozostają po stronie serwera, a dźwięk przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.client.create` nie akceptuje nadpisań instrukcji dostarczonych przez wywołującego.

    W kompozytorze czatu kontrolka rozmowy to przycisk z falami obok przycisku dyktowania mikrofonem. Po uruchomieniu rozmowy wiersz stanu kompozytora pokazuje `Connecting Talk...`, następnie `Talk live`, gdy dźwięk jest połączony, albo `Asking OpenClaw...`, gdy wywołanie narzędzia czasu rzeczywistego konsultuje skonfigurowany większy model przez `talk.client.toolCall`.

    Test live smoke dla opiekunów: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje wymianę SDP OpenAI WebRTC w przeglądarce, konfigurację WebSocket przeglądarki Google Live z ograniczonym tokenem oraz adapter przeglądarki przekaźnika Gateway z fałszywym nośnikiem mikrofonu. Polecenie wypisuje tylko status dostawcy i nie rejestruje sekretów.

  </Accordion>
  <Accordion title="Zatrzymanie i przerwanie">
    - Kliknij **Stop** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe dalsze wiadomości trafiają do kolejki. Kliknij **Steer** przy wiadomości w kolejce, aby wstrzyknąć tę dalszą wiadomość do trwającej tury.
    - Wpisz `/stop` (albo samodzielne frazy przerwania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji.

  </Accordion>
  <Accordion title="Zachowanie części po przerwaniu">
    - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta nadal może być pokazany w UI.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje zbuforowany wynik.
    - Utrwalone wpisy zawierają metadane przerwania, aby konsumenci transkrypcji mogli odróżnić części po przerwaniu od normalnego wyniku ukończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i web push

Control UI dostarcza `manifest.webmanifest` i service worker, więc nowoczesne przeglądarki mogą zainstalować go jako samodzielną PWA. Web Push pozwala Gateway wybudzać zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie jest otwarte.

| Powierzchnia                                          | Co robi                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy stanie się dostępny. |
| `ui/public/sw.js`                                     | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw) | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone punkty końcowe subskrypcji przeglądarki.                          |

Nadpisz parę kluczy VAPID przez zmienne env w procesie Gateway, gdy chcesz przypiąć klucze (dla wdrożeń wielohostowych, rotacji sekretów lub testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `mailto:openclaw@localhost`)

Control UI używa tych metod Gateway ograniczonych zakresem, aby rejestrować i testować subskrypcje przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany punkt końcowy.
- `push.web.test` — wysyła powiadomienie testowe do subskrypcji wywołującego.

<Note>
Web Push jest niezależny od ścieżki przekaźnika APNS iOS (zobacz [Konfiguracja](/pl/gateway/configuration) dla push opartego na przekaźniku) oraz istniejącej metody `push.test`, które są skierowane do natywnego parowania mobilnego.
</Note>

## Hostowane osadzenia

Wiadomości asystenta mogą renderować hostowaną treść webową inline za pomocą shortcode `[embed ...]`. Polityka sandbox iframe jest kontrolowana przez `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (default)">
    Zezwala na interaktywne osadzenia przy zachowaniu izolacji pochodzenia; jest to ustawienie domyślne i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
  </Tab>
  <Tab title="trusted">
    Dodaje `allow-same-origin` oprócz `allow-scripts` dla dokumentów tej samej witryny, które celowo potrzebują silniejszych uprawnień.
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście potrzebuje zachowania same-origin. Dla większości gier generowanych przez agenta i interaktywnych canvas bezpieczniejszym wyborem jest `scripts`.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` pozostają domyślnie blokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` ładowało strony zewnętrzne, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

## Szerokość wiadomości czatu

Pogrupowane wiadomości czatu używają czytelnej domyślnej maksymalnej szerokości. Wdrożenia na szerokich monitorach mogą ją nadpisać bez łatania dołączonego CSS przez ustawienie `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Wartość jest walidowana, zanim dotrze do przeglądarki. Obsługiwane wartości obejmują zwykłe długości i wartości procentowe, takie jak `960px` lub `82%`, oraz ograniczone wyrażenia szerokości `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` i `fit-content(...)`.

## Dostęp przez tailnet (zalecane)

<Tabs>
  <Tab title="Zintegrowane Tailscale Serve (preferowane)">
    Pozostaw Gateway na local loopback i pozwól Tailscale Serve pośredniczyć przez HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (lub skonfigurowane `gateway.controlUi.basePath`)

    Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` za pomocą `tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy żądanie trafia na local loopback z nagłówkami `x-forwarded-*` Tailscale. Dla sesji operatora Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija także rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia z rolą węzła nadal przechodzą normalne kontrole urządzenia. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych danych uwierzytelniających ze współdzielonym sekretem nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` lub `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia dla tego samego adresu IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Równoległe błędne ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niedopasowań ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokena zakłada, że host gateway jest zaufany. Jeśli na tym hoście może działać niezaufany kod lokalny, wymagaj uwierzytelniania tokenem/hasłem.
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

Jeśli otworzysz panel przez zwykły HTTP (`http://<lan-ip>` lub `http://<tailscale-ip>`), przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia interfejsu sterowania bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność niezabezpieczonego HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- pomyślne uwierzytelnienie operatora interfejsu sterowania przez `gateway.auth.mode: "trusted-proxy"`
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

    - Pozwala sesjom interfejsu sterowania na localhost kontynuować bez tożsamości urządzenia w niezabezpieczonych kontekstach HTTP.
    - Nie omija kontroli parowania.
    - Nie rozluźnia wymagań dotyczących tożsamości urządzenia zdalnego (innego niż localhost).

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
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia interfejsu sterowania i znacząco obniża bezpieczeństwo. Cofnij to szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Uwaga o trusted-proxy">
    - Pomyślne uwierzytelnienie trusted-proxy może dopuścić sesje interfejsu sterowania **operatora** bez tożsamości urządzenia.
    - Nie obejmuje to sesji interfejsu sterowania z rolą węzła.
    - Zwrotne serwery proxy na tym samym hoście nadal nie spełniają uwierzytelniania trusted-proxy; zobacz [Uwierzytelnianie przez zaufany serwer proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki dotyczące konfiguracji HTTPS.

## Zasady bezpieczeństwa treści

Interfejs sterowania jest dostarczany z restrykcyjną polityką `img-src`: dozwolone są tylko zasoby z **tego samego źródła**, adresy URL `data:` oraz lokalnie wygenerowane adresy URL `blob:`. Zdalne adresy URL obrazów `http(s)` i względne względem protokołu są odrzucane przez przeglądarkę i nie powodują pobrań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy udostępniane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy awatarów, które UI pobiera i konwertuje na lokalne adresy URL `blob:`.
- Wbudowane adresy URL `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Lokalne adresy URL `blob:` utworzone przez interfejs sterowania nadal się renderują.
- Zdalne adresy URL awatarów emitowane przez metadane kanału są usuwane w pomocnikach awatarów interfejsu sterowania i zastępowane wbudowanym logo/znaczkiem, więc przejęty lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz niczego zmieniać, aby uzyskać to zachowanie — jest zawsze włączone i nie można go skonfigurować.

## Uwierzytelnianie trasy awatara

Gdy uwierzytelnianie Gateway jest skonfigurowane, punkt końcowy awatara interfejsu sterowania wymaga tego samego tokenu Gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara zgodnie z tą samą regułą.
- Nieuwierzytelnione żądania do którejkolwiek trasy są odrzucane (zgodnie z sąsiednią trasą multimediów asystenta). Zapobiega to wyciekowi tożsamości agenta przez trasę awatara na hostach, które w innym przypadku są chronione.
- Sam interfejs sterowania przekazuje token Gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych adresów URL blob, dzięki czemu obraz nadal renderuje się w panelach.

Jeśli wyłączysz uwierzytelnianie Gateway (niezalecane na współdzielonych hostach), trasa awatara również staje się nieuwierzytelniona, zgodnie z resztą Gateway.

## Uwierzytelnianie trasy multimediów asystenta

Gdy uwierzytelnianie Gateway jest skonfigurowane, podglądy lokalnych multimediów asystenta używają trasy dwuetapowej:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` wymaga normalnego uwierzytelnienia operatora interfejsu sterowania. Przeglądarka wysyła token Gateway jako nagłówek bearer podczas sprawdzania dostępności.
- Pomyślne odpowiedzi metadanych zawierają krótkotrwały `mediaTicket` ograniczony do dokładnie tej ścieżki źródłowej.
- Renderowane przez przeglądarkę adresy URL obrazów, audio, wideo i dokumentów używają `mediaTicket=<ticket>` zamiast aktywnego tokenu lub hasła Gateway. Bilet szybko wygasa i nie może autoryzować innego źródła.

Dzięki temu normalne renderowanie multimediów pozostaje zgodne z natywnymi elementami multimedialnymi przeglądarki, bez umieszczania wielokrotnego użytku danych uwierzytelniających Gateway w widocznych adresach URL multimediów.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je za pomocą:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz stałych adresów URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do rozwoju lokalnego (osobny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na adres URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

## Debugowanie/testowanie: serwer deweloperski + zdalny Gateway

Interfejs sterowania to pliki statyczne; cel WebSocket jest konfigurowalny i może różnić się od źródła HTTP. Jest to przydatne, gdy chcesz używać lokalnie serwera deweloperskiego Vite, ale Gateway działa gdzie indziej.

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

    Opcjonalne jednorazowe uwierzytelnienie (jeśli potrzebne):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uwagi">
    - `gatewayUrl` jest zapisywany w localStorage po załadowaniu i usuwany z adresu URL.
    - Jeśli przekazujesz pełny punkt końcowy `ws://` lub `wss://` przez `gatewayUrl`, zakoduj wartość `gatewayUrl` jako URL, aby przeglądarka poprawnie przeanalizowała ciąg zapytania.
    - `token` należy przekazywać przez fragment adresu URL (`#token=...`), gdy tylko to możliwe. Fragmenty nie są wysyłane na serwer, co pozwala uniknąć wycieków w dziennikach żądań i nagłówku Referer. Starsze parametry zapytania `?token=` nadal są importowane raz dla zgodności, ale tylko jako rozwiązanie awaryjne i są usuwane natychmiast po inicjalizacji.
    - `password` jest przechowywane tylko w pamięci.
    - Gdy `gatewayUrl` jest ustawiony, UI nie wraca do danych uwierzytelniających z konfiguracji ani środowiska. Podaj `token` (lub `password`) jawnie. Brak jawnych danych uwierzytelniających jest błędem.
    - Użyj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itd.).
    - `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
    - Wdrożenia interfejsu sterowania inne niż local loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne źródła). Dotyczy to także zdalnych konfiguracji deweloperskich.
    - Uruchomienie Gateway może zasiać lokalne źródła, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, na podstawie efektywnego bindowania i portu w czasie działania, ale zdalne źródła przeglądarki nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanymi testami lokalnymi. Oznacza to zezwolenie na dowolne źródło przeglądarki, a nie „dopasuj dowolnego hosta, którego używam”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb awaryjny źródła oparty na nagłówku Host, ale jest to niebezpieczny tryb bezpieczeństwa.

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

Szczegóły konfiguracji dostępu zdalnego: [Dostęp zdalny](/pl/gateway/remote).

## Powiązane

- [Panel](/pl/web/dashboard) — panel Gateway
- [Kontrole kondycji](/pl/gateway/health) — monitorowanie kondycji Gateway
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [WebChat](/pl/web/webchat) — interfejs czatu w przeglądarce
