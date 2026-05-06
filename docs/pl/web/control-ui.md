---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz dostępu do Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Interfejs sterowania oparty na przeglądarce dla Gateway (czat, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-05-06T09:34:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c16b37405d7a490b89ea90f2b006c01b9a7b1a3e5278769006b4dc94e7d83aa
    source_path: web/control-ui.md
    workflow: 16
---

Interfejs Control UI to mała jednostronicowa aplikacja **Vite + Lit** obsługiwana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Komunikuje się **bezpośrednio z Gateway WebSocket** na tym samym porcie.

## Szybkie otwarcie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (albo [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

Uwierzytelnianie jest przekazywane podczas uzgadniania WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień pulpitu zachowuje token dla bieżącej sesji karty przeglądarki i wybranego adresu URL gateway; hasła nie są utrwalane. Onboarding zwykle generuje token gateway dla uwierzytelniania współdzielonym sekretem przy pierwszym połączeniu, ale uwierzytelnianie hasłem też działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z Control UI z nowej przeglądarki lub urządzenia, Gateway zwykle wymaga **jednorazowego zatwierdzenia parowania**. To środek bezpieczeństwa zapobiegający nieautoryzowanemu dostępowi.

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

Jeśli przeglądarka ponawia próbę parowania ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/admin, zostanie to potraktowane jako podniesienie poziomu zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw utrzymuje stare zatwierdzenie jako aktywne, blokuje ponowne połączenie z szerszymi uprawnieniami i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie jest zapamiętywane i nie będzie wymagać ponownego zatwierdzenia, chyba że je odwołasz poleceniem `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby uzyskać informacje o rotacji i odwoływaniu tokenów.

<Note>
- Bezpośrednie połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć rundę parowania dla sesji operatora Control UI, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie powiązania Tailnet, połączenia przeglądarki przez LAN oraz profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikalny identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

</Note>

## Tożsamość osobista (lokalna dla przeglądarki)

Control UI obsługuje osobistą tożsamość dla każdej przeglądarki (nazwę wyświetlaną i awatar), dołączaną do wychodzących wiadomości w celu przypisania autorstwa w sesjach współdzielonych. Znajduje się ona w pamięci przeglądarki, jest ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza zwykłymi metadanymi autorstwa transkrypcji przy wiadomościach, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam lokalny dla przeglądarki wzorzec dotyczy nadpisania awatara asystenta. Przesłane awatary asystenta nakładają tożsamość rozwiązaną przez gateway tylko w lokalnej przeglądarce i nigdy nie wykonują rundy przez `config.patch`. Wspólne pole konfiguracji `ui.assistant.avatar` jest nadal dostępne dla klientów innych niż UI, którzy zapisują to pole bezpośrednio (takich jak skryptowane gatewaye lub niestandardowe pulpity).

## Endpoint konfiguracji runtime

Control UI pobiera swoje ustawienia runtime z `/__openclaw/control-ui-config.json`. Ten endpoint jest chroniony tym samym uwierzytelnianiem gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a udane pobranie wymaga albo już ważnego tokenu/hasła gateway, tożsamości Tailscale Serve, albo tożsamości zaufanego proxy.

## Obsługa języków

Control UI może lokalizować się przy pierwszym ładowaniu na podstawie języka przeglądarki. Aby później to nadpisać, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor języka znajduje się na karcie Dostęp do Gateway, nie pod Wyglądem.

- Obsługiwane języki: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są ładowane leniwie w przeglądarce.
- Wybrany język jest zapisywany w pamięci przeglądarki i używany ponownie podczas przyszłych wizyt.
- Brakujące klucze tłumaczeń wracają do angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu języków innych niż angielski, ale wbudowany selektor języka witryny dokumentacji Mintlify jest ograniczony do kodów języków akceptowanych przez Mintlify. Dokumentacja tajska (`th`) i perska (`fa`) nadal jest generowana w repozytorium publikacji; może nie pojawić się w tym selektorze, dopóki Mintlify nie zacznie obsługiwać tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [edytor tweakcn](https://tweakcn.com/editor/theme), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link do motywu w Wyglądzie. Importer akceptuje też adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, względne ścieżki `/themes/<id>`, surowe identyfikatory motywów oraz domyślne nazwy motywów, takie jak `amethyst-haze`.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane w konfiguracji gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; jego wyczyszczenie przełącza aktywny motyw z powrotem na Claw, jeśli wybrany był zaimportowany motyw.

## Co potrafi (dzisiaj)

<AccordionGroup>
  <Accordion title="Czat i rozmowa">
    - Czatuj z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Odświeżenia historii czatu żądają ograniczonego ostatniego okna z limitami tekstu dla każdej wiadomości, aby duże sesje nie zmuszały przeglądarki do renderowania pełnego ładunku transkrypcji, zanim czat stanie się używalny.
    - Rozmawiaj przez przeglądarkowe sesje realtime. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokenu przeglądarki przez WebSocket, a wyłącznie backendowe Pluginy głosowe realtime używają transportu przekaźnikowego Gateway. Sesje dostawcy należące do klienta zaczynają się od `talk.client.create`; sesje przekaźnikowe Gateway zaczynają się od `talk.session.create`. Przekaźnik utrzymuje dane uwierzytelniające dostawcy w Gateway, podczas gdy przeglądarka strumieniuje PCM mikrofonu przez `talk.session.appendAudio` i przekazuje wywołania narzędzi dostawcy `openclaw_agent_consult` przez `talk.client.toolCall` na potrzeby polityki Gateway i większego skonfigurowanego modelu OpenClaw.
    - Strumieniuj wywołania narzędzi + karty wyjścia narzędzi na żywo w czacie (zdarzenia agenta).

  </Accordion>
  <Accordion title="Kanały, instancje, sesje, sny">
    - Kanały: status wbudowanych oraz dołączonych/zewnętrznych kanałów Plugin, logowanie QR i konfiguracja dla każdego kanału (`channels.status`, `web.login.*`, `config.patch`).
    - Odświeżenia sond kanałów utrzymują poprzednią migawkę widoczną, gdy wolne sprawdzenia dostawcy się kończą, a częściowe migawki są oznaczane, gdy sonda lub audyt przekroczy budżet UI.
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: lista + nadpisania modelu/myślenia/trybu szybkiego/trybu szczegółowego/śledzenia/rozumowania dla każdej sesji (`sessions.list`, `sessions.patch`).
    - Sny: status dreaming, przełącznik włączenia/wyłączenia i czytnik Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, węzły, zatwierdzenia exec">
    - Zadania Cron: lista/dodawanie/edycja/uruchamianie/włączanie/wyłączanie + historia uruchomień (`cron.*`).
    - Skills: status, włączanie/wyłączanie, instalowanie, aktualizacje kluczy API (`skills.*`).
    - Węzły: lista + możliwości (`node.list`).
    - Zatwierdzenia exec: edytuj listy dozwolonych gateway lub węzła + politykę pytania dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguracja">
    - Wyświetl/edytuj `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Zastosuj + uruchom ponownie z walidacją (`config.apply`) i wybudź ostatnią aktywną sesję.
    - Zapisy obejmują ochronę hashem bazowym, aby zapobiec nadpisaniu równoczesnych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wykonują wstępne sprawdzenie rozwiązywania aktywnych SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Renderowanie schematu + formularza (`config.schema` / `config.schema.lookup`, w tym pola `title` / `description`, dopasowane podpowiedzi UI, bezpośrednie podsumowania elementów potomnych, metadane dokumentacji dla zagnieżdżonych węzłów obiektów/wildcard/tablic/kompozycji oraz schematy Plugin + kanałów, gdy są dostępne); edytor surowego JSON jest dostępny tylko wtedy, gdy migawka ma bezpieczną rundę surową.
    - Jeśli migawka nie może bezpiecznie wykonać rundy surowego tekstu, Control UI wymusza tryb formularza i wyłącza tryb surowy dla tej migawki.
    - Edytor surowego JSON "Resetuj do zapisanej wersji" zachowuje surowo utworzony kształt (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczoną migawkę, więc zewnętrzne edycje przetrwają reset, gdy migawka może bezpiecznie wykonać rundę.
    - Ustrukturyzowane wartości obiektowe SecretRef są renderowane jako tylko do odczytu w tekstowych polach formularza, aby zapobiec przypadkowemu uszkodzeniu obiektu przez zamianę na ciąg znaków.

  </Accordion>
  <Accordion title="Debugowanie, logi, aktualizacja">
    - Debugowanie: migawki statusu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Dziennik zdarzeń obejmuje czasy odświeżania/RPC Control UI, czasy wolnego renderowania czatu/konfiguracji oraz wpisy responsywności przeglądarki dla długich klatek animacji lub długich zadań, gdy przeglądarka udostępnia te typy wpisów PerformanceObserver.
    - Logi: śledzenie na żywo logów plików gateway z filtrowaniem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + restart (`update.run`) z raportem restartu, a następnie odpytuj `update.status` po ponownym połączeniu, aby zweryfikować wersję działającego gateway.

  </Accordion>
  <Accordion title="Uwagi panelu zadań Cron">
    - Dla zadań izolowanych dostarczanie domyślnie ogłasza podsumowanie. Możesz przełączyć na brak, jeśli chcesz uruchomień tylko wewnętrznych.
    - Pola kanału/celu pojawiają się, gdy wybrane jest ogłoszenie.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy adres URL webhook HTTP(S).
    - Dla zadań sesji głównej dostępne są tryby dostarczania webhook i brak.
    - Zaawansowane kontrolki edycji obejmują usunięcie po uruchomieniu, wyczyszczenie nadpisania agenta, opcje cron dokładne/rozłożone w czasie, nadpisania modelu/myślenia agenta oraz przełączniki dostarczania best-effort.
    - Walidacja formularza jest wbudowana, z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu poprawienia.
    - Ustaw `cron.webhookToken`, aby wysyłać dedykowany token bearer; jeśli zostanie pominięty, webhook jest wysyłany bez nagłówka uwierzytelniania.
    - Przestarzały fallback: zapisane starsze zadania z `notify: true` nadal mogą używać `cron.webhook` do czasu migracji.

  </Accordion>
</AccordionGroup>

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: natychmiast potwierdza z `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`.
    - Przesyłanie do czatu akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; inne pliki są przechowywane jako zarządzane media i pokazywane w historii jako linki załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po zakończeniu.
    - Odpowiedzi `chat.history` mają ograniczony rozmiar ze względu na bezpieczeństwo UI. Gdy wpisy transkrypcji są zbyt duże, Gateway może skracać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować nadmiernie duże wiadomości symbolem zastępczym (`[chat.history omitted: message too large]`).
    - Obrazy asystenta/wygenerowane obrazy są utrwalane jako zarządzane referencje mediów i zwracane przez uwierzytelnione adresy URL mediów Gateway, więc ponowne wczytania nie zależą od pozostawania surowych ładunków obrazów base64 w odpowiedzi historii czatu.
    - Podczas renderowania `chat.history` Control UI usuwa z widocznego tekstu asystenta wyłącznie wyświetlaniowe znaczniki dyrektyw inline (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), zwykłotekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz skrócone bloki wywołań narzędzi), a także ujawnione tokeny sterujące modelu w ASCII/pełnej szerokości, oraz pomija wpisy asystenta, których cały widoczny tekst jest tylko dokładnym cichym tokenem `NO_REPLY` / `no_reply` albo tokenem potwierdzenia heartbeat `HEARTBEAT_OK`.
    - Podczas aktywnego wysyłania i końcowego odświeżenia historii widok czatu zachowuje widoczność lokalnych optymistycznych wiadomości użytkownika/asystenta, jeśli `chat.history` krótko zwróci starszy zrzut; kanoniczna transkrypcja zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległość.
    - Zdarzenia `chat` na żywo reprezentują stan dostarczania, natomiast `chat.history` jest odbudowywane z trwałej transkrypcji sesji. Po zdarzeniach końcowych narzędzi Control UI ponownie wczytuje historię i scala tylko niewielki optymistyczny ogon; granica transkrypcji jest udokumentowana w [WebChat](/pl/web/webchat).
    - `chat.inject` dołącza notatkę asystenta do transkrypcji sesji i rozgłasza zdarzenie `chat` na potrzeby aktualizacji wyłącznie UI (bez uruchomienia agenta, bez dostarczania kanałem).
    - Nagłówek czatu pokazuje filtr agenta przed selektorem sesji, a selektor sesji jest ograniczony do wybranego agenta. Przełączenie agentów pokazuje tylko sesje powiązane z tym agentem i wraca do głównej sesji tego agenta, gdy nie ma on jeszcze zapisanych sesji panelu.
    - Przy szerokościach desktopowych elementy sterujące czatu pozostają w jednym zwartym wierszu i zwijają się podczas przewijania transkrypcji w dół; przewinięcie w górę, powrót na początek albo dotarcie do dołu przywraca elementy sterujące.
    - Kolejne zduplikowane wiadomości zawierające tylko tekst renderują się jako jeden dymek z odznaką liczby. Wiadomości zawierające obrazy, załączniki, wynik narzędzia lub podglądy kanwy pozostają niezwinięte.
    - Selektory modelu czatu i myślenia natychmiast aktualizują aktywną sesję przez `sessions.patch`; są to trwałe nadpisania sesji, a nie opcje wysyłania tylko dla jednej tury.
    - Wpisanie `/new` w Control UI tworzy i przełącza na tę samą nową sesję panelu co New Chat. Wpisanie `/reset` zachowuje jawny reset w miejscu Gateway dla bieżącej sesji.
    - Selektor modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli obecne jest `agents.defaults.models`, ta lista dozwolonych wartości steruje selektorem. W przeciwnym razie selektor pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnieniem. Pełny katalog pozostaje dostępny przez debugowy RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway wskazują wysoką presję kontekstu, obszar kompozytora czatu pokazuje powiadomienie o kontekście, a przy zalecanych poziomach compaction także kompaktowy przycisk uruchamiający zwykłą ścieżkę compaction sesji. Nieaktualne zrzuty tokenów są ukrywane, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb rozmowy (czas rzeczywisty w przeglądarce)">
    Tryb rozmowy używa zarejestrowanego dostawcy głosu czasu rzeczywistego. Skonfiguruj OpenAI za pomocą `talk.realtime.provider: "openai"` oraz `talk.realtime.providers.openai.apiKey`, albo skonfiguruj Google za pomocą `talk.realtime.provider: "google"` oraz `talk.realtime.providers.google.apiKey`. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy ograniczony token uwierzytelnienia Live API dla sesji WebSocket w przeglądarce, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy, którzy udostępniają tylko backendowy most czasu rzeczywistego, działają przez transport przekaźnikowy Gateway, więc poświadczenia i gniazda dostawców pozostają po stronie serwera, a dźwięk z przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.client.create` nie akceptuje nadpisań instrukcji dostarczanych przez wywołującego.

    W kompozytorze czatu element sterujący rozmową to przycisk fal obok przycisku dyktowania mikrofonem. Gdy rozmowa się rozpoczyna, wiersz stanu kompozytora pokazuje `Connecting Talk...`, potem `Talk live`, gdy dźwięk jest połączony, albo `Asking OpenClaw...`, gdy wywołanie narzędzia czasu rzeczywistego konsultuje się ze skonfigurowanym większym modelem przez `talk.client.toolCall`.

    Test dymny na żywo dla opiekunów: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje wymianę SDP OpenAI WebRTC w przeglądarce, konfigurację ograniczonego tokena Google Live dla WebSocket w przeglądarce oraz adapter przekaźnika Gateway dla przeglądarki z fałszywym medium mikrofonu. Polecenie wypisuje tylko status dostawcy i nie loguje sekretów.

  </Accordion>
  <Accordion title="Zatrzymanie i przerwanie">
    - Kliknij **Stop** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe dalsze wiadomości trafiają do kolejki. Kliknij **Steer** przy wiadomości w kolejce, aby wstrzyknąć tę dalszą wiadomość do bieżącej tury.
    - Wpisz `/stop` (albo samodzielne frazy przerwania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji.

  </Accordion>
  <Accordion title="Zachowanie części po przerwaniu">
    - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta nadal może być pokazywany w UI.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje buforowany wynik.
    - Utrwalone wpisy zawierają metadane przerwania, aby konsumenci transkrypcji mogli odróżnić części po przerwaniu od normalnego wyniku zakończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i web push

Control UI dostarcza `manifest.webmanifest` i service workera, więc nowoczesne przeglądarki mogą zainstalować go jako samodzielną PWA. Web Push pozwala Gateway wybudzać zainstalowaną PWA za pomocą powiadomień nawet wtedy, gdy karta lub okno przeglądarki nie są otwarte.

| Powierzchnia                                          | Co robi                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy będzie osiągalny. |
| `ui/public/sw.js`                                     | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw) | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone punkty końcowe subskrypcji przeglądarki.                          |

Nadpisz parę kluczy VAPID przez zmienne środowiskowe w procesie Gateway, gdy chcesz przypiąć klucze (dla wdrożeń wielohostowych, rotacji sekretów lub testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `mailto:openclaw@localhost`)

Control UI używa tych metod Gateway ograniczonych zakresem, aby rejestrować i testować subskrypcje przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany punkt końcowy.
- `push.web.test` — wysyła powiadomienie testowe do subskrypcji wywołującego.

<Note>
Web Push jest niezależny od ścieżki przekaźnika iOS APNS (zobacz [Konfiguracja](/pl/gateway/configuration) dla push opartego na przekaźniku) oraz istniejącej metody `push.test`, które są kierowane do natywnego parowania mobilnego.
</Note>

## Hostowane osadzenia

Wiadomości asystenta mogą renderować hostowane treści internetowe inline za pomocą shortcode'u `[embed ...]`. Polityka piaskownicy iframe jest kontrolowana przez `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (domyślnie)">
    Zezwala na interaktywne osadzenia, zachowując izolację pochodzenia; jest to ustawienie domyślne i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście potrzebuje zachowania tego samego pochodzenia. Dla większości gier generowanych przez agentów i interaktywnych kanw `scripts` jest bezpieczniejszym wyborem.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` pozostają domyślnie blokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` wczytywało strony firm trzecich, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

## Szerokość wiadomości czatu

Zgrupowane wiadomości czatu używają domyślnej maksymalnej szerokości ułatwiającej czytanie. Wdrożenia na szerokich monitorach mogą ją nadpisać bez łatania dołączonego CSS, ustawiając `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Wartość jest walidowana, zanim trafi do przeglądarki. Obsługiwane wartości obejmują proste długości i procenty, takie jak `960px` lub `82%`, a także ograniczone wyrażenia szerokości `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` i `fit-content(...)`.

## Dostęp przez tailnet (zalecane)

<Tabs>
  <Tab title="Zintegrowane Tailscale Serve (preferowane)">
    Pozostaw Gateway na loopback i pozwól Tailscale Serve pośredniczyć przez HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (albo skonfigurowane `gateway.controlUi.basePath`)

    Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` za pomocą `tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy żądanie trafia na loopback z nagłówkami `x-forwarded-*` Tailscale. Dla sesji operatora Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija także rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia roli węzła nadal przechodzą normalne kontrole urządzenia. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń współdzielonego sekretu nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` albo `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia dla tego samego adresu IP klienta i zakresu uwierzytelnienia są serializowane przed zapisami limitu szybkości. Równoczesne nieudane ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niedopasowań ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokena zakłada, że host gateway jest zaufany. Jeśli na tym hoście może działać niezaufany kod lokalny, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Powiązanie z tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (albo skonfigurowane `gateway.controlUi.basePath`)

    Wklej pasujący współdzielony sekret w ustawieniach UI (wysyłany jako `connect.params.auth.token` lub `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niebezpieczny HTTP

Jeśli otworzysz panel przez zwykły HTTP (`http://<lan-ip>` lub `http://<tailscale-ip>`), przeglądarka działa w **niebezpiecznym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność z niebezpiecznym HTTP tylko dla localhost przy użyciu `gateway.controlUi.allowInsecureAuth=true`
- pomyślne uwierzytelnienie operatora w Control UI przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana poprawka:** użyj HTTPS (Tailscale Serve) albo otwórz UI lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście Gateway)

<AccordionGroup>
  <Accordion title="Zachowanie przełącznika niebezpiecznego uwierzytelniania">
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

    - Pozwala sesjom Control UI z localhost kontynuować bez tożsamości urządzenia w niebezpiecznych kontekstach HTTP.
    - Nie omija kontroli parowania.
    - Nie luzuje wymagań dotyczących tożsamości urządzenia dla zdalnych (innych niż localhost) połączeń.

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
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia w Control UI i stanowi poważne obniżenie poziomu zabezpieczeń. Cofnij tę zmianę szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Uwaga o zaufanym proxy">
    - Pomyślne uwierzytelnienie przez zaufane proxy może dopuścić sesje Control UI **operatora** bez tożsamości urządzenia.
    - Nie rozszerza się to na sesje Control UI w roli węzła.
    - Zwrotne reverse proxy na tym samym hoście nadal nie spełniają wymagań uwierzytelniania przez zaufane proxy; zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki dotyczące konfiguracji HTTPS.

## Polityka bezpieczeństwa treści

Control UI jest dostarczany z rygorystyczną polityką `img-src`: dozwolone są tylko zasoby **z tego samego źródła**, adresy URL `data:` oraz lokalnie wygenerowane adresy URL `blob:`. Zdalne adresy URL obrazów `http(s)` i względne względem protokołu są odrzucane przez przeglądarkę i nie powodują żądań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy udostępniane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy awatarów, które UI pobiera i konwertuje na lokalne adresy URL `blob:`.
- Wbudowane adresy URL `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Lokalne adresy URL `blob:` utworzone przez Control UI nadal się renderują.
- Zdalne adresy URL awatarów emitowane przez metadane kanału są usuwane przez pomocnicze funkcje awatarów w Control UI i zastępowane wbudowanym logo/znaczkiem, więc przejęty lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz niczego zmieniać, aby uzyskać to zachowanie — jest zawsze włączone i nie można go konfigurować.

## Uwierzytelnianie trasy awatara

Gdy uwierzytelnianie Gateway jest skonfigurowane, endpoint awatarów Control UI wymaga tego samego tokena Gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara według tej samej reguły.
- Nieuwierzytelnione żądania do dowolnej z tych tras są odrzucane (zgodnie z siostrzaną trasą assistant-media). Zapobiega to wyciekowi tożsamości agenta przez trasę awatara na hostach, które poza tym są chronione.
- Control UI sam przekazuje token Gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych adresów URL blob, dzięki czemu obraz nadal renderuje się w panelach.

Jeśli wyłączysz uwierzytelnianie Gateway (niezalecane na współdzielonych hostach), trasa awatara również staje się nieuwierzytelniona, zgodnie z resztą Gateway.

## Uwierzytelnianie trasy multimediów asystenta

Gdy uwierzytelnianie Gateway jest skonfigurowane, lokalne podglądy multimediów asystenta używają dwuetapowej trasy:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` wymaga zwykłego uwierzytelniania operatora Control UI. Przeglądarka wysyła token Gateway jako nagłówek bearer podczas sprawdzania dostępności.
- Pomyślne odpowiedzi metadanych zawierają krótkotrwały `mediaTicket` ograniczony do dokładnie tej ścieżki źródłowej.
- Renderowane przez przeglądarkę adresy URL obrazów, audio, wideo i dokumentów używają `mediaTicket=<ticket>` zamiast aktywnego tokena lub hasła Gateway. Bilet szybko wygasa i nie może autoryzować innego źródła.

Dzięki temu normalne renderowanie multimediów pozostaje zgodne z natywnymi elementami multimedialnymi przeglądarki bez umieszczania wielokrotnego użytku poświadczeń Gateway w widocznych adresach URL multimediów.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je za pomocą:

```bash
pnpm ui:build
```

Opcjonalna absolutna baza (gdy chcesz mieć stałe adresy URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do lokalnego programowania (oddzielny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na adres URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

## Debugowanie/testowanie: serwer deweloperski + zdalny Gateway

Control UI to pliki statyczne; cel WebSocket jest konfigurowalny i może różnić się od źródła HTTP. Jest to przydatne, gdy chcesz używać lokalnie serwera deweloperskiego Vite, ale Gateway działa gdzie indziej.

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

    Opcjonalne jednorazowe uwierzytelnianie (w razie potrzeby):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uwagi">
    - `gatewayUrl` jest zapisywany w localStorage po załadowaniu i usuwany z adresu URL.
    - Jeśli przekazujesz pełny endpoint `ws://` lub `wss://` przez `gatewayUrl`, zakoduj wartość `gatewayUrl` w URL, aby przeglądarka poprawnie przeanalizowała ciąg zapytania.
    - `token` należy przekazywać przez fragment adresu URL (`#token=...`) zawsze, gdy to możliwe. Fragmenty nie są wysyłane na serwer, co zapobiega wyciekom w logach żądań i nagłówku Referer. Starsze parametry zapytania `?token=` są nadal jednorazowo importowane dla zgodności, ale tylko awaryjnie, i są natychmiast usuwane po bootstrapie.
    - `password` jest przechowywane tylko w pamięci.
    - Gdy `gatewayUrl` jest ustawione, UI nie wraca do poświadczeń z konfiguracji ani środowiska. Podaj `token` (lub `password`) jawnie. Brak jawnych poświadczeń jest błędem.
    - Używaj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itp.).
    - `gatewayUrl` jest akceptowane tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
    - Wdrożenia Control UI poza loopbackiem muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne źródła). Obejmuje to zdalne konfiguracje deweloperskie.
    - Uruchomienie Gateway może zasilić lokalne źródła, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, na podstawie efektywnego powiązania i portu środowiska wykonawczego, ale zdalne źródła przeglądarki nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanymi lokalnymi testami. Oznacza to zezwolenie na dowolne źródło przeglądarki, a nie „dopasuj dowolny host, którego używam”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb fallbacku źródła na podstawie nagłówka Host, ale jest to niebezpieczny tryb zabezpieczeń.

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
- [WebChat](/pl/web/webchat) — interfejs czatu w przeglądarce
