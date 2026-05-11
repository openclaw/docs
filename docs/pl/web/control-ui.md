---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Potrzebujesz dostępu do Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Przeglądarkowy interfejs sterowania dla Gateway (czat, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-05-11T20:40:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0033b2666fe76bd23d5585d05b39fdd33f8d15d4e7c16561b5cfd0e75b8d22e
    source_path: web/control-ui.md
    workflow: 16
---

Interfejs sterowania to mała jednostronicowa aplikacja **Vite + Lit** serwowana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Komunikuje się **bezpośrednio z WebSocketem Gateway** na tym samym porcie.

## Szybkie otwarcie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

Uwierzytelnianie jest przekazywane podczas uzgadniania WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień pulpitu przechowuje token dla bieżącej sesji karty przeglądarki i wybranego adresu URL Gateway; hasła nie są utrwalane. Onboarding zwykle generuje token Gateway dla uwierzytelniania współdzielonym sekretem przy pierwszym połączeniu, ale uwierzytelnianie hasłem również działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzeń (pierwsze połączenie)

Gdy łączysz się z interfejsem sterowania z nowej przeglądarki lub urządzenia, Gateway zwykle wymaga **jednorazowego zatwierdzenia parowania**. To środek bezpieczeństwa zapobiegający nieautoryzowanemu dostępowi.

**Co zobaczysz:** "disconnected (1008): pairing required"

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

Jeśli przeglądarka ponawia próbę parowania ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/administrację, jest to traktowane jako podniesienie zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw utrzymuje stare zatwierdzenie jako aktywne, blokuje ponowne połączenie z szerszym zakresem i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie zostaje zapamiętane i nie będzie wymagać ponownego zatwierdzenia, chyba że je unieważnisz za pomocą `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby dowiedzieć się o rotacji i unieważnianiu tokenów.

<Note>
- Bezpośrednie połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć rundę parowania dla sesji operatora interfejsu sterowania, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie powiązania Tailnet, połączenia przeglądarki przez LAN oraz profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikalny identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego sparowania.

</Note>

## Tożsamość osobista (lokalna dla przeglądarki)

Interfejs sterowania obsługuje osobistą tożsamość per przeglądarka (nazwę wyświetlaną i awatar) dołączaną do wiadomości wychodzących w celu przypisania autorstwa we współdzielonych sesjach. Jest przechowywana w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza zwykłymi metadanymi autorstwa transkryptu dla wiadomości, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam wzorzec lokalny dla przeglądarki dotyczy nadpisania awatara asystenta. Przesłane awatary asystenta nakładają się na tożsamość rozwiązaną przez Gateway tylko w lokalnej przeglądarce i nigdy nie przechodzą tam i z powrotem przez `config.patch`. Współdzielone pole konfiguracji `ui.assistant.avatar` jest nadal dostępne dla klientów innych niż UI, którzy zapisują to pole bezpośrednio (takich jak skryptowane bramy lub niestandardowe pulpity).

## Endpoint konfiguracji runtime

Interfejs sterowania pobiera swoje ustawienia runtime z `/__openclaw/control-ui-config.json`. Ten endpoint jest chroniony tym samym uwierzytelnianiem Gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a pomyślne pobranie wymaga albo już ważnego tokenu/hasła Gateway, tożsamości Tailscale Serve, albo tożsamości zaufanego proxy.

## Obsługa języków

Interfejs sterowania może zlokalizować się przy pierwszym ładowaniu na podstawie ustawień regionalnych przeglądarki. Aby później to nadpisać, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor ustawień regionalnych znajduje się na karcie Dostęp do Gateway, a nie w sekcji Wygląd.

- Obsługiwane ustawienia regionalne: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia na języki inne niż angielski są ładowane leniwie w przeglądarce.
- Wybrane ustawienie regionalne jest zapisywane w pamięci przeglądarki i używane ponownie podczas przyszłych wizyt.
- Brakujące klucze tłumaczeń wracają do języka angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu ustawień regionalnych innych niż angielski, ale wbudowany selektor języka witryny dokumentacji Mintlify jest ograniczony do kodów ustawień regionalnych akceptowanych przez Mintlify. Dokumentacja tajska (`th`) i perska (`fa`) nadal jest generowana w repozytorium publikacji; może nie pojawić się w tym selektorze, dopóki Mintlify nie zacznie obsługiwać tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [edytor tweakcn](https://tweakcn.com/editor/theme), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link motywu w sekcji Wygląd. Importer akceptuje również adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, względne ścieżki `/themes/<id>`, surowe identyfikatory motywów oraz domyślne nazwy motywów, takie jak `amethyst-haze`.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane w konfiguracji Gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; wyczyszczenie go przełącza aktywny motyw z powrotem na Claw, jeśli wybrany był zaimportowany motyw.

## Co potrafi (obecnie)

<AccordionGroup>
  <Accordion title="Czat i rozmowa">
    - Rozmawiaj z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Odświeżenia historii czatu żądają ograniczonego ostatniego okna z limitami tekstu na wiadomość, aby duże sesje nie zmuszały przeglądarki do renderowania pełnego ładunku transkryptu, zanim czat stanie się użyteczny.
    - Rozmawiaj przez sesje realtime w przeglądarce. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokenu przeglądarki przez WebSocket, a pluginy głosowe realtime wyłącznie po stronie backendu używają transportu przekaźnikowego Gateway. Sesje dostawcy należące do klienta zaczynają się od `talk.client.create`; sesje przekaźnika Gateway zaczynają się od `talk.session.create`. Przekaźnik przechowuje dane uwierzytelniające dostawcy w Gateway, podczas gdy przeglądarka strumieniuje PCM mikrofonu przez `talk.session.appendAudio` i przekazuje wywołania narzędzi dostawcy `openclaw_agent_consult` przez `talk.client.toolCall` dla polityki Gateway oraz większego skonfigurowanego modelu OpenClaw.
    - Strumieniuj wywołania narzędzi + karty wyników narzędzi na żywo w czacie (zdarzenia agenta).

  </Accordion>
  <Accordion title="Kanały, instancje, sesje, sny">
    - Kanały: status kanałów wbudowanych oraz kanałów pluginów dołączonych/zewnętrznych, logowanie QR i konfiguracja per kanał (`channels.status`, `web.login.*`, `config.patch`).
    - Odświeżenia sond kanałów utrzymują poprzedni zrzut jako widoczny, gdy wolne kontrole dostawców się kończą, a częściowe zrzuty są oznaczane, gdy sonda lub audyt przekroczy budżet UI.
    - Instancje: lista obecności + odświeżenie (`system-presence`).
    - Sesje: domyślnie wyświetlaj sesje skonfigurowanych agentów, wycofuj się ze starych kluczy sesji nieskonfigurowanych agentów i stosuj nadpisania modelu/myślenia/trybu szybkiego/szczegółowości/śledzenia/rozumowania per sesja (`sessions.list`, `sessions.patch`).
    - Sny: status Dreaming, przełącznik włącz/wyłącz oraz czytnik Dziennika snów (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, węzły, zatwierdzenia exec">
    - Zadania Cron: lista/dodaj/edytuj/uruchom/włącz/wyłącz + historia uruchomień (`cron.*`).
    - Skills: status, włącz/wyłącz, instalacja, aktualizacje klucza API (`skills.*`).
    - Węzły: lista + możliwości (`node.list`).
    - Zatwierdzenia exec: edytuj listy dozwolonych Gateway lub węzła + politykę zapytań dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguracja">
    - Wyświetl/edytuj `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Zastosuj + uruchom ponownie z walidacją (`config.apply`) i wybudź ostatnią aktywną sesję.
    - Zapisy obejmują zabezpieczenie base-hash zapobiegające nadpisaniu równoczesnych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wykonują preflight rozwiązywania aktywnych SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Schemat + renderowanie formularza (`config.schema` / `config.schema.lookup`, w tym pola `title` / `description`, dopasowane wskazówki UI, natychmiastowe podsumowania elementów potomnych, metadane dokumentacji dla zagnieżdżonych węzłów obiektów/wildcard/tablic/kompozycji oraz schematy pluginów + kanałów, gdy są dostępne); edytor surowego JSON jest dostępny tylko wtedy, gdy zrzut ma bezpieczną surową rundę tam i z powrotem.
    - Jeśli zrzut nie może bezpiecznie przejść surowej rundy tam i z powrotem, interfejs sterowania wymusza tryb formularza i wyłącza tryb surowy dla tego zrzutu.
    - Edytor surowego JSON „Resetuj do zapisanych” zachowuje kształt utworzony w surowym formacie (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczony zrzut, więc zewnętrzne edycje przetrwają reset, gdy zrzut może bezpiecznie przejść rundę tam i z powrotem.
    - Strukturalne wartości obiektów SecretRef są renderowane jako tylko do odczytu w tekstowych polach formularza, aby zapobiec przypadkowemu uszkodzeniu przez konwersję obiektu na ciąg znaków.

  </Accordion>
  <Accordion title="Debugowanie, logi, aktualizacja">
    - Debugowanie: zrzuty statusu/zdrowia/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Dziennik zdarzeń obejmuje czasy odświeżania/RPC interfejsu sterowania, czasy wolnego renderowania czatu/konfiguracji oraz wpisy responsywności przeglądarki dla długich klatek animacji lub długich zadań, gdy przeglądarka udostępnia te typy wpisów PerformanceObserver.
    - Logi: ogon na żywo logów plikowych Gateway z filtrowaniem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + restart (`update.run`) z raportem restartu, a następnie odpytywanie `update.status` po ponownym połączeniu, aby zweryfikować działającą wersję Gateway.

  </Accordion>
  <Accordion title="Uwagi panelu zadań Cron">
    - Dla izolowanych zadań domyślną dostawą jest ogłoszenie podsumowania. Możesz przełączyć na brak, jeśli chcesz uruchomienia wyłącznie wewnętrzne.
    - Pola kanału/celu pojawiają się, gdy wybrane jest ogłoszenie.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy adres URL Webhook HTTP(S).
    - Dla zadań głównej sesji dostępne są tryby dostawy Webhook i brak.
    - Zaawansowane kontrolki edycji obejmują usuń-po-uruchomieniu, wyczyść nadpisanie agenta, dokładne/rozłożone opcje cron, nadpisania modelu/myślenia agenta oraz przełączniki dostawy best-effort.
    - Walidacja formularza jest wbudowana z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu poprawienia.
    - Ustaw `cron.webhookToken`, aby wysłać dedykowany token bearer; jeśli zostanie pominięty, Webhook zostanie wysłany bez nagłówka uwierzytelniania.
    - Przestarzały fallback: zapisane starsze zadania z `notify: true` nadal mogą używać `cron.webhook` do czasu migracji.

  </Accordion>
</AccordionGroup>

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: potwierdza natychmiast z `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`.
    - Przesyłanie do czatu akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; pozostałe pliki są przechowywane jako zarządzane media i wyświetlane w historii jako linki załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po zakończeniu.
    - Odpowiedzi `chat.history` mają ograniczony rozmiar dla bezpieczeństwa interfejsu użytkownika. Gdy wpisy transkrypcji są zbyt duże, Gateway może skracać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować zbyt duże wiadomości placeholderem (`[chat.history omitted: message too large]`).
    - Obrazy asystenta/wygenerowane są utrwalane jako odwołania do zarządzanych mediów i zwracane przez uwierzytelnione adresy URL mediów Gateway, więc ponowne wczytania nie zależą od tego, czy surowe ładunki obrazów base64 pozostaną w odpowiedzi historii czatu.
    - Podczas renderowania `chat.history` Control UI usuwa z widocznego tekstu asystenta wyłącznie wyświetleniowe znaczniki dyrektyw inline (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), zwykłotekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz skrócone bloki wywołań narzędzi), a także ujawnione tokeny sterujące modelu ASCII/pełnej szerokości, oraz pomija wpisy asystenta, których cały widoczny tekst jest tylko dokładnym cichym tokenem `NO_REPLY` / `no_reply` albo tokenem potwierdzenia heartbeat `HEARTBEAT_OK`.
    - Podczas aktywnego wysyłania i końcowego odświeżenia historii widok czatu utrzymuje widoczne lokalne optymistyczne wiadomości użytkownika/asystenta, jeśli `chat.history` krótko zwróci starszy snapshot; kanoniczna transkrypcja zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległość.
    - Zdarzenia `chat` na żywo są stanem dostarczenia, natomiast `chat.history` jest odbudowywane z trwałej transkrypcji sesji. Po zdarzeniach końcowych narzędzi Control UI ponownie wczytuje historię i scala tylko niewielki optymistyczny ogon; granica transkrypcji jest udokumentowana w [WebChat](/pl/web/webchat).
    - `chat.inject` dopisuje notatkę asystenta do transkrypcji sesji i rozgłasza zdarzenie `chat` na potrzeby aktualizacji wyłącznie interfejsu użytkownika (bez uruchomienia agenta, bez dostarczenia przez kanał).
    - Nagłówek czatu pokazuje filtr agenta przed selektorem sesji, a selektor sesji jest zawężony do wybranego agenta. Przełączanie agentów pokazuje tylko sesje powiązane z tym agentem i wraca do głównej sesji tego agenta, gdy nie ma on jeszcze zapisanych sesji panelu.
    - Na szerokościach desktopowych kontrolki czatu pozostają w jednym kompaktowym wierszu i zwijają się podczas przewijania transkrypcji w dół; przewinięcie w górę, powrót na górę albo dotarcie do dołu przywraca kontrolki.
    - Kolejne zduplikowane wiadomości wyłącznie tekstowe renderują się jako jeden dymek z plakietką liczby. Wiadomości zawierające obrazy, załączniki, wyjście narzędzi albo podglądy canvas pozostają niezwinięte.
    - Selektory modelu i myślenia w nagłówku czatu natychmiast aktualizują aktywną sesję przez `sessions.patch`; są trwałymi nadpisaniami sesji, a nie opcjami wysłania tylko dla jednej tury.
    - Jeśli wyślesz wiadomość, gdy zmiana selektora modelu dla tej samej sesji nadal się zapisuje, edytor wiadomości czeka na tę poprawkę sesji przed wywołaniem `chat.send`, aby wysłanie użyło wybranego modelu.
    - Wpisanie `/new` w Control UI tworzy i przełącza na tę samą świeżą sesję panelu co Nowy czat, z wyjątkiem sytuacji, gdy skonfigurowano `session.dmScope: "main"` i bieżący rodzic jest główną sesją agenta; wtedy resetuje główną sesję w miejscu. Wpisanie `/reset` zachowuje jawny reset Gateway w miejscu dla bieżącej sesji.
    - Selektor modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli obecne jest `agents.defaults.models`, ta lista dozwolonych wartości steruje selektorem, w tym wpisami `provider/*`, które utrzymują katalogi zawężone do dostawcy jako dynamiczne. W przeciwnym razie selektor pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnieniem. Pełny katalog pozostaje dostępny przez debugowe RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway zawierają bieżące tokeny kontekstu, obszar edytora wiadomości czatu pokazuje kompaktowy wskaźnik użycia kontekstu. Przy wysokiej presji kontekstu przełącza się na styl ostrzegawczy, a przy zalecanych poziomach Compaction pokazuje kompaktowy przycisk uruchamiający normalną ścieżkę Compaction sesji. Nieaktualne snapshoty tokenów są ukrywane, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb rozmowy (czas rzeczywisty w przeglądarce)">
    Tryb rozmowy używa zarejestrowanego dostawcy głosu czasu rzeczywistego. Skonfiguruj OpenAI przez `talk.realtime.provider: "openai"` oraz `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY` albo profil OAuth `openai-codex`; skonfiguruj Google przez `talk.realtime.provider: "google"` oraz `talk.realtime.providers.google.apiKey`. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy, ograniczony token uwierzytelniania Live API dla sesji WebSocket w przeglądarce, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy, którzy udostępniają tylko backendowy most czasu rzeczywistego, działają przez transport przekaźnika Gateway, więc poświadczenia i gniazda dostawcy pozostają po stronie serwera, a dźwięk przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.client.create` nie akceptuje nadpisań instrukcji dostarczonych przez wywołującego.

    Edytor wiadomości czatu zawiera przycisk opcji rozmowy obok przycisku rozpoczęcia/zatrzymania rozmowy. Opcje dotyczą następnej sesji rozmowy i mogą nadpisać dostawcę, transport, model, głos, wysiłek rozumowania, próg VAD, czas trwania ciszy oraz dopełnienie prefiksu. Gdy opcja jest pusta, Gateway używa skonfigurowanych wartości domyślnych, jeśli są dostępne, albo wartości domyślnej dostawcy. Wybranie przekaźnika Gateway wymusza backendową ścieżkę przekaźnika; wybranie WebRTC utrzymuje sesję jako należącą do klienta i kończy się niepowodzeniem zamiast po cichu przechodzić na przekaźnik, jeśli dostawca nie może utworzyć sesji przeglądarkowej.

    W edytorze wiadomości czatu kontrolką rozmowy jest przycisk fal obok przycisku dyktowania mikrofonem. Gdy rozmowa się rozpoczyna, wiersz stanu edytora pokazuje `Connecting Talk...`, następnie `Talk live`, gdy dźwięk jest połączony, albo `Asking OpenClaw...`, gdy wywołanie narzędzia czasu rzeczywistego konsultuje się ze skonfigurowanym większym modelem przez `talk.client.toolCall`.

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje backendowy most WebSocket OpenAI, wymianę SDP WebRTC przeglądarki OpenAI, konfigurację przeglądarkowego WebSocket Google Live z ograniczonym tokenem oraz przeglądarkowy adapter przekaźnika Gateway z fałszywymi mediami mikrofonu. Polecenie wypisuje tylko status dostawcy i nie loguje sekretów.

  </Accordion>
  <Accordion title="Zatrzymanie i przerwanie">
    - Kliknij **Zatrzymaj** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe wiadomości następcze są kolejkowane. Kliknij **Steruj** przy skolejkowanej wiadomości, aby wstrzyknąć tę wiadomość następczą do trwającej tury.
    - Wpisz `/stop` (albo samodzielne frazy przerwania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji.

  </Accordion>
  <Accordion title="Zachowanie częściowej zawartości po przerwaniu">
    - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta nadal może być pokazany w interfejsie użytkownika.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje zbuforowane wyjście.
    - Utrwalone wpisy zawierają metadane przerwania, aby konsumenci transkrypcji mogli odróżnić części po przerwaniu od normalnego wyjścia zakończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i web push

Control UI dostarcza `manifest.webmanifest` i service worker, więc nowoczesne przeglądarki mogą zainstalować go jako samodzielną PWA. Web Push pozwala Gateway wybudzać zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie jest otwarte.

| Powierzchnia                                           | Co robi                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                       | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy jest osiągalny. |
| `ui/public/sw.js`                                      | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw)     | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                     | Utrwalone endpointy subskrypcji przeglądarki.                      |

Nadpisz parę kluczy VAPID przez zmienne środowiskowe w procesie Gateway, gdy chcesz przypiąć klucze (dla wdrożeń wielohostowych, rotacji sekretów albo testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `mailto:openclaw@localhost`)

Control UI używa tych metod Gateway ograniczonych zakresem, aby rejestrować i testować subskrypcje przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany endpoint.
- `push.web.test` — wysyła powiadomienie testowe do subskrypcji wywołującego.

<Note>
Web Push jest niezależny od ścieżki przekaźnika APNS iOS (zobacz [Konfiguracja](/pl/gateway/configuration) dla push opartego na przekaźniku) oraz istniejącej metody `push.test`, które są przeznaczone dla natywnego parowania mobilnego.
</Note>

## Osadzenia hostowane

Wiadomości asystenta mogą renderować hostowaną zawartość webową inline za pomocą shortcode `[embed ...]`. Polityką piaskownicy iframe steruje `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (default)">
    Zezwala na interaktywne osadzenia przy zachowaniu izolacji origin; to ustawienie domyślne i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
  </Tab>
  <Tab title="trusted">
    Dodaje `allow-same-origin` na podstawie `allow-scripts` dla dokumentów w tej samej witrynie, które celowo potrzebują silniejszych uprawnień.
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście potrzebuje zachowania same-origin. Dla większości gier generowanych przez agentów i interaktywnych canvas `scripts` jest bezpieczniejszym wyborem.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` pozostają domyślnie blokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` ładowało strony podmiotów trzecich, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

## Szerokość wiadomości czatu

Zgrupowane wiadomości czatu używają czytelnej domyślnej maksymalnej szerokości. Wdrożenia na szerokich monitorach mogą ją nadpisać bez modyfikowania dołączonego CSS przez ustawienie `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Wartość jest walidowana, zanim trafi do przeglądarki. Obsługiwane wartości obejmują proste długości i procenty, takie jak `960px` lub `82%`, oraz ograniczone wyrażenia szerokości `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` i `fit-content(...)`.

## Dostęp tailnet (zalecane)

<Tabs>
  <Tab title="Zintegrowane Tailscale Serve (preferowane)">
    Pozostaw Gateway na loopback i pozwól Tailscale Serve pośredniczyć z HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (albo skonfigurowany `gateway.controlUi.basePath`)

    Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość przez rozwiązywanie adresu `x-forwarded-for` za pomocą `tailscale whois` i dopasowanie go do nagłówka, a akceptuje je tylko wtedy, gdy żądanie trafia w loopback z nagłówkami Tailscale `x-forwarded-*`. W przypadku sesji operatora Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija też rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia z rolą węzła nadal przechodzą standardowe kontrole urządzenia. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń współdzielonego sekretu nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` albo `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia dla tego samego adresu IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Równoczesne błędne ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niezgodności ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokena zakłada, że host gateway jest zaufany. Jeśli na tym hoście może działać niezaufany kod lokalny, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Powiąż z tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (albo skonfigurowany przez siebie `gateway.controlUi.basePath`)

    Wklej pasujący współdzielony sekret w ustawieniach UI (wysyłany jako `connect.params.auth.token` albo `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niezabezpieczony HTTP

Jeśli otworzysz dashboard przez zwykły HTTP (`http://<lan-ip>` albo `http://<tailscale-ip>`), przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność niezabezpieczonego HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- pomyślne uwierzytelnienie operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana poprawka:** użyj HTTPS (Tailscale Serve) albo otwórz UI lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście gateway)

<AccordionGroup>
  <Accordion title="Zachowanie przełącznika niezabezpieczonego uwierzytelniania">
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
    - Nie rozluźnia wymagań tożsamości urządzenia dla połączeń zdalnych (nie-localhost).

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
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia Control UI i jest poważnym obniżeniem poziomu bezpieczeństwa. Cofnij to szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Uwaga o zaufanym proxy">
    - Pomyślne uwierzytelnienie zaufanego proxy może dopuścić sesje Control UI **operatora** bez tożsamości urządzenia.
    - Nie obejmuje to sesji Control UI z rolą węzła.
    - Odwrotne proxy przez loopback na tym samym hoście nadal nie spełniają uwierzytelniania zaufanego proxy; zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki dotyczące konfiguracji HTTPS.

## Polityka bezpieczeństwa treści

Control UI jest dostarczany z restrykcyjną polityką `img-src`: dozwolone są tylko zasoby **same-origin**, adresy URL `data:` i lokalnie wygenerowane adresy URL `blob:`. Zdalne adresy URL obrazów `http(s)` i względne względem protokołu są odrzucane przez przeglądarkę i nie powodują pobrań sieciowych.

Co to oznacza w praktyce:

- Avatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy avatarów, które UI pobiera i konwertuje na lokalne adresy URL `blob:`.
- Wbudowane adresy URL `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Lokalne adresy URL `blob:` utworzone przez Control UI nadal się renderują.
- Zdalne adresy URL avatarów emitowane przez metadane kanału są usuwane w helperach avatarów Control UI i zastępowane wbudowanym logo/znaczkiem, więc przejęty albo złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz niczego zmieniać, aby uzyskać to zachowanie — jest zawsze włączone i niekonfigurowalne.

## Uwierzytelnianie trasy avatarów

Gdy uwierzytelnianie gateway jest skonfigurowane, endpoint avatarów Control UI wymaga tego samego tokena gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz avatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane avatara według tej samej reguły.
- Nieuwierzytelnione żądania do dowolnej z tych tras są odrzucane (tak samo jak w siostrzanej trasie assistant-media). Zapobiega to wyciekowi tożsamości agenta przez trasę avatara na hostach, które poza tym są chronione.
- Sam Control UI przekazuje token gateway jako nagłówek bearer podczas pobierania avatarów i używa uwierzytelnionych adresów URL blob, aby obraz nadal renderował się w dashboardach.

Jeśli wyłączysz uwierzytelnianie gateway (niezalecane na hostach współdzielonych), trasa avatarów również staje się nieuwierzytelniona, zgodnie z resztą gateway.

## Uwierzytelnianie trasy multimediów asystenta

Gdy uwierzytelnianie gateway jest skonfigurowane, lokalne podglądy multimediów asystenta używają dwuetapowej trasy:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` wymaga standardowego uwierzytelniania operatora Control UI. Przeglądarka wysyła token gateway jako nagłówek bearer podczas sprawdzania dostępności.
- Pomyślne odpowiedzi metadanych zawierają krótkotrwały `mediaTicket` ograniczony do tej dokładnej ścieżki źródłowej.
- Renderowane przez przeglądarkę adresy URL obrazów, audio, wideo i dokumentów używają `mediaTicket=<ticket>` zamiast aktywnego tokena gateway albo hasła. Bilet szybko wygasa i nie może autoryzować innego źródła.

Dzięki temu zwykłe renderowanie multimediów pozostaje zgodne z natywnymi elementami multimedialnymi przeglądarki bez umieszczania wielokrotnego użytku poświadczeń gateway w widocznych adresach URL multimediów.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je za pomocą:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz stałe adresy URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do lokalnego developmentu (oddzielny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

## Pusta strona Control UI

Jeśli przeglądarka ładuje pusty dashboard, a DevTools nie pokazuje użytecznego błędu, rozszerzenie albo wczesny skrypt treści mógł uniemożliwić ocenę modułowej aplikacji JavaScript. Strona statyczna zawiera zwykły panel odzyskiwania HTML, który pojawia się, gdy `<openclaw-app>` nie zostanie zarejestrowany po uruchomieniu.

Użyj akcji **Spróbuj ponownie** w panelu po zmianie środowiska przeglądarki albo przeładuj ręcznie po tych kontrolach:

- Wyłącz rozszerzenia, które wstrzykują kod do wszystkich stron, szczególnie rozszerzenia ze skryptami treści `<all_urls>`.
- Spróbuj okna prywatnego, czystego profilu przeglądarki albo innej przeglądarki.
- Utrzymaj działanie Gateway i zweryfikuj ten sam URL dashboardu po zmianie przeglądarki.

## Debugowanie/testowanie: serwer deweloperski + zdalny Gateway

Control UI to pliki statyczne; cel WebSocket jest konfigurowalny i może być inny niż origin HTTP. To przydatne, gdy chcesz lokalnie używać serwera deweloperskiego Vite, ale Gateway działa gdzie indziej.

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
    - Jeśli przekazujesz pełny endpoint `ws://` albo `wss://` przez `gatewayUrl`, zakoduj URL-em wartość `gatewayUrl`, aby przeglądarka poprawnie przeanalizowała ciąg zapytania.
    - `token` powinien być przekazywany przez fragment URL (`#token=...`), gdy tylko to możliwe. Fragmenty nie są wysyłane na serwer, co pozwala uniknąć wycieku w logach żądań i nagłówku Referer. Starsze parametry zapytania `?token=` nadal są jednorazowo importowane dla zgodności, ale tylko jako fallback, i są usuwane natychmiast po bootstrapie.
    - `password` jest przechowywane tylko w pamięci.
    - Gdy `gatewayUrl` jest ustawione, UI nie wraca do poświadczeń z konfiguracji ani środowiska. Podaj `token` (albo `password`) jawnie. Brak jawnych poświadczeń jest błędem.
    - Użyj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itd.).
    - `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiegać clickjackingowi.
    - Wdrożenia Control UI poza loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne originy). Obejmuje to zdalne konfiguracje deweloperskie.
    - Uruchomienie Gateway może zasilić lokalne originy, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, na podstawie efektywnego powiązania i portu runtime, ale originy zdalnych przeglądarek nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanym lokalnym testowaniem. Oznacza to zezwolenie na dowolny origin przeglądarki, a nie „dopasuj dowolny host, którego używam”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb fallbacku originu z nagłówka Host, ale jest to niebezpieczny tryb bezpieczeństwa.

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

- [Dashboard](/pl/web/dashboard) — dashboard gateway
- [Kontrole kondycji](/pl/gateway/health) — monitorowanie kondycji gateway
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [WebChat](/pl/web/webchat) — interfejs czatu w przeglądarce
