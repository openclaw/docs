---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz mieć dostęp do Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Oparty na przeglądarce interfejs sterowania dla Gateway (czat, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-05-10T20:00:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb158d1b6b92b7097fe7ba8d61aee5d6c6e67a8d45fc2cb2514c555ef3e52d81
    source_path: web/control-ui.md
    workflow: 16
---

Interfejs sterowania to mała jednostronicowa aplikacja **Vite + Lit** obsługiwana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Komunikuje się **bezpośrednio z WebSocket Gateway** na tym samym porcie.

## Szybkie otwarcie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

Uwierzytelnianie jest przekazywane podczas uzgadniania WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień pulpitu przechowuje token dla bieżącej sesji karty przeglądarki i wybranego adresu URL gateway; hasła nie są utrwalane. Wprowadzenie zwykle generuje token gateway do uwierzytelniania ze wspólnym sekretem przy pierwszym połączeniu, ale uwierzytelnianie hasłem też działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z interfejsem sterowania z nowej przeglądarki lub urządzenia, Gateway zwykle wymaga **jednorazowego zatwierdzenia parowania**. To środek bezpieczeństwa zapobiegający nieautoryzowanemu dostępowi.

**Co zobaczysz:** „disconnected (1008): pairing required”

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Jeśli przeglądarka ponawia parowanie ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/administrację, jest to traktowane jako rozszerzenie zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw utrzymuje aktywne stare zatwierdzenie, blokuje ponowne połączenie z szerszymi uprawnieniami i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie zostaje zapamiętane i nie wymaga ponownego zatwierdzania, chyba że je unieważnisz poleceniem `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby uzyskać informacje o rotacji tokenów i unieważnianiu.

<Note>
- Bezpośrednie połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć pełny cykl parowania dla sesji operatora interfejsu sterowania, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie powiązania Tailnet, połączenia przeglądarki z sieci LAN oraz profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikalny identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

</Note>

## Tożsamość osobista (lokalna dla przeglądarki)

Interfejs sterowania obsługuje osobistą tożsamość przypisaną do przeglądarki (nazwę wyświetlaną i awatar), dołączaną do wychodzących wiadomości w celu przypisania autorstwa we współdzielonych sesjach. Jest przechowywana w magazynie przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza normalnymi metadanymi autorstwa transkryptu w wiadomościach, które faktycznie wyślesz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam wzorzec lokalny dla przeglądarki dotyczy zastąpienia awatara asystenta. Przesłane awatary asystenta nakładają tożsamość ustaloną przez gateway tylko w lokalnej przeglądarce i nigdy nie przechodzą pełnego cyklu przez `config.patch`. Wspólne pole konfiguracji `ui.assistant.avatar` nadal jest dostępne dla klientów innych niż UI, którzy zapisują to pole bezpośrednio (takich jak skryptowane gatewaye lub niestandardowe pulpity).

## Punkt końcowy konfiguracji runtime

Interfejs sterowania pobiera swoje ustawienia runtime z `/__openclaw/control-ui-config.json`. Ten punkt końcowy jest chroniony tym samym uwierzytelnianiem gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a pomyślne pobranie wymaga albo już poprawnego tokenu/hasła gateway, tożsamości Tailscale Serve, albo tożsamości zaufanego proxy.

## Obsługa języków

Interfejs sterowania może lokalizować się przy pierwszym ładowaniu na podstawie ustawień regionalnych przeglądarki. Aby później to nadpisać, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor ustawień regionalnych znajduje się na karcie Dostęp do Gateway, a nie w sekcji Wygląd.

- Obsługiwane ustawienia regionalne: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są ładowane leniwie w przeglądarce.
- Wybrane ustawienie regionalne jest zapisywane w magazynie przeglądarki i ponownie używane przy kolejnych wizytach.
- Brakujące klucze tłumaczeń wracają do angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu ustawień regionalnych innych niż angielskie, ale wbudowany selektor języków witryny dokumentacji Mintlify jest ograniczony do kodów ustawień regionalnych akceptowanych przez Mintlify. Dokumentacja tajska (`th`) i perska (`fa`) nadal jest generowana w repo publikacji; może nie pojawiać się w tym selektorze, dopóki Mintlify nie zacznie obsługiwać tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [edytor tweakcn](https://tweakcn.com/editor/theme), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link do motywu w sekcji Wygląd. Importer akceptuje także adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, względne ścieżki `/themes/<id>`, surowe identyfikatory motywów oraz domyślne nazwy motywów, takie jak `amethyst-haze`.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane w konfiguracji gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; wyczyszczenie go przełącza aktywny motyw z powrotem na Claw, jeśli wybrany był zaimportowany motyw.

## Co potrafi (obecnie)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Czatuj z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Odświeżanie historii czatu żąda ograniczonego ostatniego okna z limitami tekstu na wiadomość, aby duże sesje nie zmuszały przeglądarki do renderowania pełnego ładunku transkryptu, zanim czat stanie się użyteczny.
    - Rozmawiaj przez przeglądarkowe sesje realtime. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokenu przeglądarki przez WebSocket, a głosowe pluginy realtime działające tylko po stronie backendu używają transportu przekaźnikowego Gateway. Sesje dostawcy należące do klienta zaczynają się od `talk.client.create`; sesje przekaźnikowe Gateway zaczynają się od `talk.session.create`. Przekaźnik przechowuje poświadczenia dostawcy w Gateway, gdy przeglądarka strumieniuje PCM mikrofonu przez `talk.session.appendAudio` i przekazuje wywołania narzędzi dostawcy `openclaw_agent_consult` przez `talk.client.toolCall` na potrzeby polityki Gateway oraz większego skonfigurowanego modelu OpenClaw.
    - Strumieniuj wywołania narzędzi + karty wyjścia narzędzi na żywo w Czacie (zdarzenia agenta).

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Kanały: wbudowane oraz status kanałów pluginów dołączonych/zewnętrznych, logowanie QR i konfiguracja dla kanału (`channels.status`, `web.login.*`, `config.patch`).
    - Odświeżenia sond kanałów utrzymują widoczną poprzednią migawkę, gdy powolne kontrole dostawców się kończą, a częściowe migawki są oznaczane, gdy sonda lub audyt przekracza budżet UI.
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: domyślnie wyświetlaj sesje skonfigurowanych agentów, wracaj ze starych kluczy sesji nieskonfigurowanych agentów i stosuj dla sesji nadpisania modelu/myślenia/szybkiego trybu/szczegółowości/śledzenia/rozumowania (`sessions.list`, `sessions.patch`).
    - Sny: status Dreaming, przełącznik włącz/wyłącz i czytnik dziennika snów (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Zadania Cron: lista/dodawanie/edycja/uruchamianie/włączanie/wyłączanie + historia uruchomień (`cron.*`).
    - Skills: status, włączanie/wyłączanie, instalacja, aktualizacje klucza API (`skills.*`).
    - Węzły: lista + możliwości (`node.list`).
    - Zatwierdzenia exec: edytuj listy dozwolonych gateway lub węzła + politykę pytań dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Wyświetl/edytuj `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Zastosuj + uruchom ponownie z walidacją (`config.apply`) i wybudź ostatnią aktywną sesję.
    - Zapisy obejmują strażnika bazowego hasha, aby zapobiec nadpisaniu równoczesnych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wykonują przed zapisem wstępne sprawdzenie rozwiązywania aktywnych SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Schemat + renderowanie formularza (`config.schema` / `config.schema.lookup`, w tym pola `title` / `description`, dopasowane wskazówki UI, natychmiastowe podsumowania dzieci, metadane dokumentacji na zagnieżdżonych węzłach obiektu/wieloznacznika/tablicy/kompozycji oraz schematy pluginów + kanałów, gdy są dostępne); edytor surowego JSON jest dostępny tylko wtedy, gdy migawka ma bezpieczny surowy pełny cykl.
    - Jeśli migawka nie może bezpiecznie wykonać pełnego cyklu surowego tekstu, interfejs sterowania wymusza tryb formularza i wyłącza tryb surowy dla tej migawki.
    - „Resetuj do zapisanej” w edytorze surowego JSON zachowuje surowy kształt autora (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczoną migawkę, dzięki czemu zewnętrzne edycje przetrwają reset, gdy migawka może bezpiecznie wykonać pełny cykl.
    - Strukturalne wartości obiektów SecretRef są renderowane tylko do odczytu w tekstowych polach formularza, aby zapobiec przypadkowemu uszkodzeniu obiektu przez konwersję na ciąg znaków.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debugowanie: migawki statusu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Dziennik zdarzeń zawiera czasy odświeżania/RPC interfejsu sterowania, czasy wolnego renderowania czatu/konfiguracji oraz wpisy responsywności przeglądarki dla długich klatek animacji lub długich zadań, gdy przeglądarka udostępnia te typy wpisów PerformanceObserver.
    - Logi: ogon na żywo logów plików gateway z filtrem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + restart (`update.run`) z raportem restartu, a następnie po ponownym połączeniu odpytuj `update.status`, aby zweryfikować uruchomioną wersję gateway.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Dla izolowanych zadań dostarczanie domyślnie ogłasza podsumowanie. Możesz przełączyć na brak, jeśli chcesz uruchomienia wyłącznie wewnętrzne.
    - Pola kanału/celu pojawiają się, gdy wybrane jest ogłaszanie.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na poprawny adres URL webhooka HTTP(S).
    - Dla zadań głównej sesji dostępne są tryby dostarczania webhook i brak.
    - Zaawansowane kontrolki edycji obejmują usunięcie po uruchomieniu, wyczyszczenie nadpisania agenta, opcje dokładnego/rozłożonego Cron, nadpisania modelu/myślenia agenta oraz przełączniki dostarczania best-effort.
    - Walidacja formularza jest wbudowana z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu naprawy.
    - Ustaw `cron.webhookToken`, aby wysyłać dedykowany token bearer; jeśli zostanie pominięty, webhook jest wysyłany bez nagłówka uwierzytelniania.
    - Przestarzały fallback: zapisane starsze zadania z `notify: true` nadal mogą używać `cron.webhook` do czasu migracji.

  </Accordion>
</AccordionGroup>

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: natychmiast potwierdza przyjęcie przez `{ runId, status: "started" }`, a odpowiedź jest przesyłana strumieniowo przez zdarzenia `chat`.
    - Przesyłanie do czatu akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; inne pliki są przechowywane jako zarządzane media i pokazywane w historii jako linki do załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po ukończeniu.
    - Odpowiedzi `chat.history` mają ograniczony rozmiar dla bezpieczeństwa UI. Gdy wpisy transkrypcji są zbyt duże, Gateway może obcinać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować nadmiernie duże wiadomości symbolem zastępczym (`[chat.history omitted: message too large]`).
    - Obrazy asystenta/wygenerowane są utrwalane jako zarządzane odwołania do mediów i zwracane przez uwierzytelnione adresy URL mediów Gateway, więc ponowne wczytania nie zależą od pozostania surowych ładunków obrazów base64 w odpowiedzi historii czatu.
    - Podczas renderowania `chat.history` interfejs Control UI usuwa z widocznego tekstu asystenta wyłącznie prezentacyjne wbudowane tagi dyrektyw (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi), a także ujawnione tokeny sterujące modelu ASCII/pełnej szerokości, oraz pomija wpisy asystenta, których cały widoczny tekst jest tylko dokładnym tokenem ciszy `NO_REPLY` / `no_reply` albo tokenem potwierdzenia Heartbeat `HEARTBEAT_OK`.
    - Podczas aktywnego wysyłania i końcowego odświeżania historii widok czatu utrzymuje widoczne lokalne optymistyczne wiadomości użytkownika/asystenta, jeśli `chat.history` krótko zwraca starszy zrzut; kanoniczna transkrypcja zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi opóźnienie.
    - Zdarzenia `chat` na żywo są stanem dostarczenia, podczas gdy `chat.history` jest odbudowywane z trwałej transkrypcji sesji. Po końcowych zdarzeniach narzędzi interfejs Control UI ponownie wczytuje historię i scala tylko mały optymistyczny ogon; granica transkrypcji jest udokumentowana w [WebChat](/pl/web/webchat).
    - `chat.inject` dołącza notatkę asystenta do transkrypcji sesji i rozgłasza zdarzenie `chat` dla aktualizacji wyłącznie UI (bez uruchomienia agenta, bez dostarczenia kanałem).
    - Nagłówek czatu pokazuje filtr agenta przed selektorem sesji, a selektor sesji jest ograniczony do wybranego agenta. Przełączanie agentów pokazuje tylko sesje powiązane z tym agentem i wraca do głównej sesji tego agenta, gdy nie ma on jeszcze zapisanych sesji panelu.
    - Przy szerokościach desktopowych kontrolki czatu pozostają w jednym zwartym wierszu i zwijają się podczas przewijania transkrypcji w dół; przewinięcie w górę, powrót na górę albo dotarcie do dołu przywraca kontrolki.
    - Kolejne zduplikowane wiadomości zawierające tylko tekst renderują się jako jeden dymek z odznaką liczby. Wiadomości zawierające obrazy, załączniki, wyjście narzędzia lub podglądy canvas pozostają niezwinięte.
    - Selektory modelu i myślenia w nagłówku czatu natychmiast aktualizują aktywną sesję przez `sessions.patch`; są to trwałe nadpisania sesji, a nie opcje wysyłki tylko na jedną turę.
    - Jeśli wyślesz wiadomość, gdy zmiana selektora modelu dla tej samej sesji nadal się zapisuje, composer czeka na tę poprawkę sesji przed wywołaniem `chat.send`, aby wysyłka użyła wybranego modelu.
    - Wpisanie `/new` w interfejsie Control UI tworzy i przełącza na tę samą świeżą sesję panelu co Nowy czat, chyba że skonfigurowano `session.dmScope: "main"` i bieżący element nadrzędny jest główną sesją agenta; w takim przypadku resetuje główną sesję w miejscu. Wpisanie `/reset` zachowuje jawny reset w miejscu Gateway dla bieżącej sesji.
    - Selektor modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli obecne jest `agents.defaults.models`, ta allowlista steruje selektorem, w tym wpisami `provider/*`, które utrzymują katalogi ograniczone do providera jako dynamiczne. W przeciwnym razie selektor pokazuje jawne wpisy `models.providers.*.models` oraz providerów z użytecznym uwierzytelnieniem. Pełny katalog pozostaje dostępny przez debugowe RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway zawierają bieżące tokeny kontekstu, obszar composera czatu pokazuje zwarty wskaźnik użycia kontekstu. Przy wysokiej presji kontekstu przełącza się na styl ostrzegawczy, a przy zalecanych poziomach Compaction pokazuje zwarty przycisk uruchamiający normalną ścieżkę Compaction sesji. Nieaktualne zrzuty tokenów są ukrywane, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb rozmowy (realtime w przeglądarce)">
    Tryb rozmowy używa zarejestrowanego providera głosu realtime. Skonfiguruj OpenAI za pomocą `talk.realtime.provider: "openai"` oraz jednego z: `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY` albo profilu OAuth `openai-codex`; skonfiguruj Google za pomocą `talk.realtime.provider: "google"` oraz `talk.realtime.providers.google.apiKey`. Przeglądarka nigdy nie otrzymuje standardowego klucza API providera. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy, ograniczony token uwierzytelniania Live API dla przeglądarkowej sesji WebSocket, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Providerzy, którzy udostępniają tylko backendowy most realtime, działają przez transport przekaźnikowy Gateway, dzięki czemu poświadczenia i gniazda dostawców pozostają po stronie serwera, a dźwięk przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.client.create` nie akceptuje nadpisań instrukcji dostarczonych przez wywołującego.

    Composer czatu zawiera przycisk opcji rozmowy obok przycisku start/stop rozmowy. Opcje dotyczą następnej sesji rozmowy i mogą nadpisać providera, transport, model, głos, wysiłek rozumowania, próg VAD, czas trwania ciszy oraz dopełnienie prefiksu. Gdy opcja jest pusta, Gateway używa skonfigurowanych wartości domyślnych, jeśli są dostępne, albo wartości domyślnej providera. Wybranie przekaźnika Gateway wymusza backendową ścieżkę przekaźnikową; wybranie WebRTC utrzymuje sesję jako posiadaną przez klienta i kończy się błędem zamiast cicho wracać do przekaźnika, jeśli provider nie może utworzyć sesji przeglądarkowej.

    W composerze czatu kontrolka rozmowy to przycisk fal obok przycisku dyktowania mikrofonem. Gdy rozmowa się rozpoczyna, wiersz stanu composera pokazuje `Connecting Talk...`, potem `Talk live`, gdy dźwięk jest połączony, albo `Asking OpenClaw...`, gdy wywołanie narzędzia realtime konsultuje się ze skonfigurowanym większym modelem przez `talk.client.toolCall`.

    Smoke test na żywo dla maintainerów: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje backendowy most WebSocket OpenAI, wymianę SDP WebRTC przeglądarki OpenAI, konfigurację przeglądarkowego WebSocket Google Live z ograniczonym tokenem oraz adapter przeglądarki przekaźnika Gateway z fałszywym medium mikrofonu. Polecenie wypisuje tylko stan providera i nie loguje sekretów.

  </Accordion>
  <Accordion title="Zatrzymanie i przerwanie">
    - Kliknij **Zatrzymaj** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe wiadomości następcze trafiają do kolejki. Kliknij **Steruj** przy wiadomości w kolejce, aby wstrzyknąć tę wiadomość następczą do trwającej tury.
    - Wpisz `/stop` (albo samodzielne frazy przerywania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`) do przerwania wszystkich aktywnych uruchomień dla tej sesji.

  </Accordion>
  <Accordion title="Zachowywanie części po przerwaniu">
    - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta nadal może być pokazywany w UI.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje zbuforowane wyjście.
    - Utrwalone wpisy zawierają metadane przerwania, dzięki czemu konsumenci transkrypcji mogą odróżnić części po przerwaniu od normalnego wyjścia ukończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i web push

Interfejs Control UI dostarcza `manifest.webmanifest` oraz service workera, więc nowoczesne przeglądarki mogą zainstalować go jako samodzielną PWA. Web Push pozwala Gateway wybudzać zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie jest otwarte.

| Powierzchnia                                          | Co robi                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy stanie się osiągalny. |
| `ui/public/sw.js`                                     | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw)    | Automatycznie generowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone endpointy subskrypcji przeglądarki.                      |

Nadpisz parę kluczy VAPID przez zmienne env w procesie Gateway, gdy chcesz przypiąć klucze (dla wdrożeń wielohostowych, rotacji sekretów albo testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `mailto:openclaw@localhost`)

Interfejs Control UI używa tych metod Gateway ograniczonych zakresem do rejestrowania i testowania subskrypcji przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany endpoint.
- `push.web.test` — wysyła powiadomienie testowe do subskrypcji wywołującego.

<Note>
Web Push jest niezależny od ścieżki przekaźnika APNS iOS (zobacz [Konfiguracja](/pl/gateway/configuration) dla push opartego na przekaźniku) oraz istniejącej metody `push.test`, które są przeznaczone dla natywnego parowania mobilnego.
</Note>

## Osadzenia hostowane

Wiadomości asystenta mogą renderować hostowaną zawartość webową inline za pomocą shortcode’u `[embed ...]`. Polityka sandbox iframe jest kontrolowana przez `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (default)">
    Zezwala na interaktywne osadzenia przy zachowaniu izolacji origin; jest to wartość domyślna i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
  </Tab>
  <Tab title="trusted">
    Dodaje `allow-same-origin` oprócz `allow-scripts` dla dokumentów z tej samej witryny, które celowo potrzebują silniejszych uprawnień.
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście potrzebuje zachowania same-origin. Dla większości gier generowanych przez agenta i interaktywnych canvasów `scripts` jest bezpieczniejszym wyborem.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` pozostają domyślnie blokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` ładowało strony firm trzecich, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

## Szerokość wiadomości czatu

Zgrupowane wiadomości czatu używają czytelnej domyślnej maksymalnej szerokości. Wdrożenia na szerokich monitorach mogą ją nadpisać bez poprawiania dołączonego CSS, ustawiając `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Wartość jest walidowana, zanim dotrze do przeglądarki. Obsługiwane wartości obejmują zwykłe długości i procenty, takie jak `960px` lub `82%`, a także ograniczone wyrażenia szerokości `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` i `fit-content(...)`.

## Dostęp przez tailnet (zalecane)

<Tabs>
  <Tab title="Zintegrowane Tailscale Serve (preferowane)">
    Utrzymaj Gateway na local loopback i pozwól Tailscale Serve pośredniczyć przez HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (albo skonfigurowany `gateway.controlUi.basePath`)

    Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozpoznając adres `x-forwarded-for` za pomocą `tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy żądanie trafia na local loopback z nagłówkami `x-forwarded-*` Tailscale. W przypadku sesji operatorskich Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija także rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia o roli węzła nadal przechodzą zwykłe kontrole urządzenia. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń współdzielonego sekretu nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` albo `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia dla tego samego adresu IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Równoczesne nieudane ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niezgodności ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokena zakłada, że host gatewaya jest zaufany. Jeśli na tym hoście może działać niezaufany kod lokalny, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (albo skonfigurowaną wartość `gateway.controlUi.basePath`)

    Wklej pasujący współdzielony sekret w ustawieniach UI (wysyłany jako `connect.params.auth.token` albo `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niezabezpieczony HTTP

Jeśli otworzysz pulpit przez zwykły HTTP (`http://<lan-ip>` albo `http://<tailscale-ip>`), przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność z niezabezpieczonym HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- udane uwierzytelnianie operatorskiego Control UI przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana poprawka:** użyj HTTPS (Tailscale Serve) albo otwórz UI lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście gatewaya)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
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
    - Nie rozluźnia wymagań tożsamości urządzenia dla zdalnych (innych niż localhost) połączeń.

  </Accordion>
  <Accordion title="Break-glass only">
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
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia Control UI i stanowi poważne obniżenie poziomu bezpieczeństwa. Przywróć poprzednie ustawienie szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Udane uwierzytelnianie trusted-proxy może dopuścić **operatorskie** sesje Control UI bez tożsamości urządzenia.
    - Nie rozszerza się to na sesje Control UI o roli węzła.
    - Odwrotne proxy local loopback na tym samym hoście nadal nie spełniają wymagań uwierzytelniania trusted-proxy; zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki dotyczące konfiguracji HTTPS.

## Polityka bezpieczeństwa treści

Control UI jest dostarczany z restrykcyjną polityką `img-src`: dozwolone są tylko zasoby **same-origin**, adresy URL `data:` oraz lokalnie generowane adresy URL `blob:`. Zdalne adresy URL obrazów `http(s)` i względne względem protokołu są odrzucane przez przeglądarkę i nie powodują żądań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy awatarów, które UI pobiera i konwertuje na lokalne adresy URL `blob:`.
- Wbudowane adresy URL `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Lokalne adresy URL `blob:` utworzone przez Control UI nadal się renderują.
- Zdalne adresy URL awatarów emitowane przez metadane kanału są usuwane w helperach awatarów Control UI i zastępowane wbudowanym logo/znaczkiem, więc skompromitowany albo złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz niczego zmieniać, aby uzyskać to zachowanie — jest zawsze włączone i niekonfigurowalne.

## Uwierzytelnianie trasy awatara

Gdy uwierzytelnianie gatewaya jest skonfigurowane, endpoint awatarów Control UI wymaga tego samego tokena gatewaya co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara według tej samej reguły.
- Nieuwierzytelnione żądania do którejkolwiek trasy są odrzucane (zgodnie z sąsiednią trasą assistant-media). Zapobiega to wyciekowi tożsamości agenta przez trasę awatara na hostach, które w innych miejscach są chronione.
- Sam Control UI przekazuje token gatewaya jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych adresów URL blob, dzięki czemu obraz nadal renderuje się w pulpitach.

Jeśli wyłączysz uwierzytelnianie gatewaya (niezalecane na hostach współdzielonych), trasa awatara również staje się nieuwierzytelniona, zgodnie z resztą gatewaya.

## Uwierzytelnianie trasy multimediów asystenta

Gdy uwierzytelnianie gatewaya jest skonfigurowane, lokalne podglądy multimediów asystenta używają dwuetapowej trasy:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` wymaga zwykłego operatorskiego uwierzytelniania Control UI. Przeglądarka wysyła token gatewaya jako nagłówek bearer podczas sprawdzania dostępności.
- Udane odpowiedzi metadanych zawierają krótkotrwały `mediaTicket` ograniczony do dokładnie tej ścieżki źródłowej.
- Renderowane przez przeglądarkę adresy URL obrazów, audio, wideo i dokumentów używają `mediaTicket=<ticket>` zamiast aktywnego tokena albo hasła gatewaya. Bilet szybko wygasa i nie może autoryzować innego źródła.

Dzięki temu zwykłe renderowanie multimediów pozostaje zgodne z natywnymi elementami multimedialnymi przeglądarki bez umieszczania poświadczeń gatewaya wielokrotnego użytku w widocznych adresach URL multimediów.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je za pomocą:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz stałych adresów URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do lokalnego developmentu (osobny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na adres URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

## Debugowanie/testowanie: serwer deweloperski + zdalny Gateway

Control UI to pliki statyczne; cel WebSocket jest konfigurowalny i może różnić się od źródła HTTP. Jest to przydatne, gdy chcesz mieć lokalnie serwer deweloperski Vite, ale Gateway działa gdzie indziej.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
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
  <Accordion title="Notes">
    - `gatewayUrl` jest przechowywany w localStorage po załadowaniu i usuwany z adresu URL.
    - Jeśli przekazujesz pełny endpoint `ws://` albo `wss://` przez `gatewayUrl`, zakoduj wartość `gatewayUrl` w URL, aby przeglądarka poprawnie sparsowała query string.
    - `token` należy przekazywać przez fragment adresu URL (`#token=...`), gdy tylko jest to możliwe. Fragmenty nie są wysyłane na serwer, co pozwala uniknąć wycieku w logach żądań i nagłówku Referer. Starsze parametry zapytania `?token=` nadal są importowane jednorazowo dla zgodności, ale tylko jako mechanizm awaryjny, i są usuwane natychmiast po bootstrapie.
    - `password` jest przechowywane tylko w pamięci.
    - Gdy ustawiono `gatewayUrl`, UI nie wraca do poświadczeń z konfiguracji ani środowiska. Podaj jawnie `token` (albo `password`). Brak jawnych poświadczeń jest błędem.
    - Używaj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itd.).
    - `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
    - Wdrożenia Control UI poza local loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne źródła). Obejmuje to zdalne konfiguracje deweloperskie.
    - Start gatewaya może zasiać lokalne źródła, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, z efektywnego powiązania i portu środowiska uruchomieniowego, ale zdalne źródła przeglądarki nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanymi testami lokalnymi. Oznacza to zezwolenie na dowolne źródło przeglądarki, a nie „dopasuj dowolny host, którego używam”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb fallbacku źródła z nagłówka Host, ale jest to niebezpieczny tryb bezpieczeństwa.

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

- [Dashboard](/pl/web/dashboard) — pulpit gatewaya
- [Health Checks](/pl/gateway/health) — monitorowanie kondycji gatewaya
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [WebChat](/pl/web/webchat) — interfejs czatu w przeglądarce
