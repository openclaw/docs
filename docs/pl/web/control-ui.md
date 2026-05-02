---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz mieć dostęp do Tailnetu bez tuneli SSH
sidebarTitle: Control UI
summary: Przeglądarkowy interfejs sterowania dla Gateway (czat, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-05-02T10:06:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: b49118ee964f9efb68479494d2bc1ba4029f0ec5c12fc69bd3975c3ea5082e14
    source_path: web/control-ui.md
    workflow: 16
---

Control UI to mała jednostronicowa aplikacja **Vite + Lit** obsługiwana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Komunikuje się **bezpośrednio z Gateway WebSocket** na tym samym porcie.

## Szybkie otwieranie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

Uwierzytelnianie jest przekazywane podczas uzgadniania WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień dashboardu przechowuje token dla bieżącej sesji karty przeglądarki i wybranego adresu URL Gateway; hasła nie są utrwalane. Onboarding zwykle generuje token gatewaya dla uwierzytelniania współdzielonym sekretem przy pierwszym połączeniu, ale uwierzytelnianie hasłem też działa, gdy `gateway.auth.mode` ma wartość `"password"`.

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

Jeśli przeglądarka ponowi próbę parowania ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostanie zastąpione i zostanie utworzony nowy `requestId`. Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/admin, zostanie to potraktowane jako podniesienie zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw zachowuje stare zatwierdzenie jako aktywne, blokuje szersze ponowne połączenie i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie jest zapamiętywane i nie będzie wymagać ponownego zatwierdzenia, chyba że je odwołasz za pomocą `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby uzyskać informacje o rotacji i odwoływaniu tokenów.

<Note>
- Bezpośrednie połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są automatycznie zatwierdzane.
- Tailscale Serve może pominąć obieg parowania dla sesji operatora Control UI, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie bindowania Tailnet, połączenia przeglądarki przez LAN i profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikatowy identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

</Note>

## Tożsamość osobista (lokalna dla przeglądarki)

Control UI obsługuje osobistą tożsamość dla każdej przeglądarki (nazwę wyświetlaną i awatar) dołączaną do wychodzących wiadomości na potrzeby atrybucji we współdzielonych sesjach. Jest przechowywana w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza zwykłymi metadanymi autorstwa transkryptu w wiadomościach, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam lokalny dla przeglądarki wzorzec dotyczy nadpisania awatara asystenta. Przesłane awatary asystenta nakładają tożsamość rozwiązaną przez gateway tylko w lokalnej przeglądarce i nigdy nie przechodzą w obie strony przez `config.patch`. Współdzielone pole konfiguracji `ui.assistant.avatar` nadal jest dostępne dla klientów innych niż UI, którzy zapisują to pole bezpośrednio (takich jak skryptowe gatewaye lub niestandardowe dashboardy).

## Endpoint konfiguracji runtime

Control UI pobiera swoje ustawienia runtime z `/__openclaw/control-ui-config.json`. Ten endpoint jest chroniony tym samym uwierzytelnianiem gatewaya co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a pomyślne pobranie wymaga już prawidłowego tokena/hasła gatewaya, tożsamości Tailscale Serve albo tożsamości zaufanego proxy.

## Obsługa języków

Control UI może zlokalizować się przy pierwszym ładowaniu na podstawie ustawień regionalnych przeglądarki. Aby później to nadpisać, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor ustawień regionalnych znajduje się na karcie Dostęp do Gateway, a nie w sekcji Wygląd.

- Obsługiwane ustawienia regionalne: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są ładowane leniwie w przeglądarce.
- Wybrane ustawienie regionalne jest zapisywane w pamięci przeglądarki i używane ponownie przy kolejnych wizytach.
- Brakujące klucze tłumaczeń wracają do angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu ustawień regionalnych innych niż angielskie, ale wbudowany selektor języka witryny dokumentacji Mintlify jest ograniczony do kodów ustawień regionalnych akceptowanych przez Mintlify. Dokumentacja tajska (`th`) i perska (`fa`) nadal jest generowana w repozytorium publikacji; może nie pojawiać się w tym selektorze, dopóki Mintlify nie będzie obsługiwać tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [motywy tweakcn](https://tweakcn.com/themes), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link motywu w sekcji Wygląd. Importer akceptuje także adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, ścieżki względne `/themes/<id>`, surowe identyfikatory motywów i domyślne nazwy motywów, takie jak `amethyst-haze`.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane w konfiguracji gatewaya i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; wyczyszczenie go przełącza aktywny motyw z powrotem na Claw, jeśli wybrany był zaimportowany motyw.

## Co potrafi (obecnie)

<AccordionGroup>
  <Accordion title="Czat i rozmowa">
    - Czat z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Rozmowa przez przeglądarkowe sesje w czasie rzeczywistym. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokena przeglądarki przez WebSocket, a pluginy głosu w czasie rzeczywistym działające tylko po stronie backendu używają transportu przekaźnikowego Gateway. Przekaźnik utrzymuje poświadczenia dostawcy na Gateway, podczas gdy przeglądarka strumieniuje PCM z mikrofonu przez RPC `talk.realtime.relay*` i odsyła wywołania narzędzia `openclaw_agent_consult` przez `chat.send` do większego skonfigurowanego modelu OpenClaw.
    - Strumieniowanie wywołań narzędzi + karty wyjścia narzędzi na żywo w czacie (zdarzenia agenta).

  </Accordion>
  <Accordion title="Kanały, instancje, sesje, sny">
    - Kanały: status kanałów wbudowanych oraz pluginów dołączonych/zewnętrznych, logowanie QR i konfiguracja dla kanału (`channels.status`, `web.login.*`, `config.patch`).
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: lista + nadpisania modelu/myślenia/trybu szybkiego/szczegółowego/śledzenia/rozumowania dla sesji (`sessions.list`, `sessions.patch`).
    - Sny: status Dreaming, przełącznik włącz/wyłącz oraz czytnik Dziennika snów (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, węzły, zatwierdzenia exec">
    - Zadania Cron: lista/dodawanie/edycja/uruchamianie/włączanie/wyłączanie + historia uruchomień (`cron.*`).
    - Skills: status, włączanie/wyłączanie, instalacja, aktualizacje kluczy API (`skills.*`).
    - Węzły: lista + możliwości (`node.list`).
    - Zatwierdzenia exec: edycja allowlist gatewaya lub węzła + zasady pytania dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguracja">
    - Wyświetlanie/edycja `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Zastosowanie + ponowne uruchomienie z walidacją (`config.apply`) i wybudzenie ostatniej aktywnej sesji.
    - Zapisy obejmują ochronę bazowego hasha, aby zapobiec nadpisaniu równoległych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wykonują kontrolę wstępną rozwiązywania aktywnych SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Renderowanie schematu + formularza (`config.schema` / `config.schema.lookup`, w tym `title` / `description` pola, dopasowane wskazówki UI, bezpośrednie podsumowania elementów podrzędnych, metadane dokumentacji na zagnieżdżonych węzłach obiektów/wildcard/tablic/kompozycji oraz schematy pluginów + kanałów, gdy są dostępne); edytor surowego JSON jest dostępny tylko wtedy, gdy migawka ma bezpieczny surowy obieg w obie strony.
    - Jeśli migawka nie może bezpiecznie przejść obiegu surowego tekstu, Control UI wymusza tryb Formularz i wyłącza tryb Surowy dla tej migawki.
    - Edytor surowego JSON „Resetuj do zapisanych” zachowuje kształt utworzony w surowej postaci (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczoną migawkę, więc zewnętrzne edycje przetrwają reset, gdy migawka może bezpiecznie przejść obieg w obie strony.
    - Strukturalne wartości obiektów SecretRef są renderowane jako tylko do odczytu w tekstowych polach formularza, aby zapobiec przypadkowemu uszkodzeniu typu obiekt-na-ciąg.

  </Accordion>
  <Accordion title="Debugowanie, logi, aktualizacja">
    - Debugowanie: migawki statusu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Logi: podgląd na żywo końca plików logów gatewaya z filtrem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + restart (`update.run`) z raportem restartu, a następnie odpytuj `update.status` po ponownym połączeniu, aby zweryfikować wersję działającego gatewaya.

  </Accordion>
  <Accordion title="Uwagi do panelu zadań Cron">
    - Dla zadań izolowanych domyślnym sposobem dostarczenia jest ogłoszenie podsumowania. Możesz przełączyć na brak, jeśli chcesz uruchomień wyłącznie wewnętrznych.
    - Pola kanału/celu pojawiają się po wybraniu ogłoszenia.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy adres URL webhooka HTTP(S).
    - Dla zadań sesji głównej dostępne są tryby dostarczenia webhook i brak.
    - Zaawansowane kontrolki edycji obejmują usunięcie po uruchomieniu, wyczyszczenie nadpisania agenta, opcje dokładnego/rozłożonego Cron, nadpisania modelu/myślenia agenta oraz przełączniki dostarczania best-effort.
    - Walidacja formularza jest wbudowana z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu poprawienia.
    - Ustaw `cron.webhookToken`, aby wysyłać dedykowany token bearer; jeśli zostanie pominięty, webhook zostanie wysłany bez nagłówka uwierzytelniania.
    - Przestarzała ścieżka awaryjna: przechowywane starsze zadania z `notify: true` nadal mogą używać `cron.webhook` do czasu migracji.

  </Accordion>
</AccordionGroup>

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: natychmiast potwierdza żądanie przez `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`.
    - Przesyłanie w czacie akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; inne pliki są przechowywane jako zarządzane media i pokazywane w historii jako linki do załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po ukończeniu.
    - Odpowiedzi `chat.history` mają ograniczony rozmiar ze względu na bezpieczeństwo UI. Gdy wpisy transkrypcji są zbyt duże, Gateway może skracać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować zbyt duże wiadomości symbolem zastępczym (`[chat.history omitted: message too large]`).
    - Obrazy asystenta/wygenerowane obrazy są utrwalane jako zarządzane odwołania do mediów i zwracane przez uwierzytelnione adresy URL mediów Gateway, dzięki czemu ponowne wczytania nie zależą od pozostania surowych ładunków obrazów base64 w odpowiedzi historii czatu.
    - `chat.history` usuwa też z widocznego tekstu asystenta wyłącznie prezentacyjne wbudowane tagi dyrektyw (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), zwykłotekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi), a także wyciekłe tokeny sterujące modelu ASCII/pełnej szerokości, oraz pomija wpisy asystenta, których cały widoczny tekst jest tylko dokładnym cichym tokenem `NO_REPLY` / `no_reply`.
    - Podczas aktywnego wysyłania i końcowego odświeżenia historii widok czatu zachowuje widoczne lokalne optymistyczne wiadomości użytkownika/asystenta, jeśli `chat.history` krótko zwraca starszy zrzut; kanoniczna transkrypcja zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległości.
    - `chat.inject` dopisuje notatkę asystenta do transkrypcji sesji i rozgłasza zdarzenie `chat` dla aktualizacji wyłącznie UI (bez uruchomienia agenta, bez dostarczenia do kanału).
    - Selektory modelu i trybu myślenia w nagłówku czatu natychmiast modyfikują aktywną sesję przez `sessions.patch`; są to trwałe nadpisania sesji, a nie opcje wysyłania tylko dla jednej tury.
    - Wpisanie `/new` w Control UI tworzy tę samą świeżą sesję pulpitu co Nowy czat i przełącza się na nią. Wpisanie `/reset` zachowuje jawny reset Gateway wykonywany w miejscu dla bieżącej sesji.
    - Selektor modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli istnieje `agents.defaults.models`, ta lista dozwolonych wartości steruje selektorem. W przeciwnym razie selektor pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnianiem. Pełny katalog pozostaje dostępny przez debugujące RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway pokazują wysokie obciążenie kontekstu, obszar kompozytora czatu pokazuje powiadomienie o kontekście, a przy zalecanych poziomach Compaction także kompaktowy przycisk uruchamiający zwykłą ścieżkę Compaction sesji. Nieaktualne zrzuty tokenów są ukryte, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb rozmowy (czas rzeczywisty w przeglądarce)">
    Tryb rozmowy używa zarejestrowanego dostawcy głosu czasu rzeczywistego. Skonfiguruj OpenAI za pomocą `talk.provider: "openai"` oraz `talk.providers.openai.apiKey` albo skonfiguruj Google za pomocą `talk.provider: "google"` oraz `talk.providers.google.apiKey`; konfigurację dostawcy czasu rzeczywistego Voice Call nadal można ponownie wykorzystać jako rozwiązanie awaryjne. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy, ograniczony token uwierzytelniania Live API dla przeglądarkowej sesji WebSocket, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy, którzy udostępniają tylko backendowy most czasu rzeczywistego, działają przez transport przekaźnika Gateway, więc poświadczenia i gniazda dostawców pozostają po stronie serwera, a dźwięk przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.realtime.session` nie akceptuje nadpisań instrukcji dostarczanych przez wywołującego.

    W kompozytorze czatu kontrolka rozmowy to przycisk z falami obok przycisku dyktowania mikrofonem. Gdy rozmowa się rozpoczyna, wiersz stanu kompozytora pokazuje `Connecting Talk...`, następnie `Talk live`, gdy dźwięk jest połączony, albo `Asking OpenClaw...`, gdy wywołanie narzędzia czasu rzeczywistego konsultuje skonfigurowany większy model przez `chat.send`.

    Dymny test live dla maintainerów: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje wymianę SDP OpenAI browser WebRTC, konfigurację przeglądarkowego WebSocket Google Live z ograniczonym tokenem oraz adapter przeglądarkowy przekaźnika Gateway z fałszywymi mediami mikrofonu. Polecenie wypisuje tylko status dostawcy i nie loguje sekretów.

  </Accordion>
  <Accordion title="Zatrzymanie i przerwanie">
    - Kliknij **Zatrzymaj** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe kontynuacje trafiają do kolejki. Kliknij **Steruj** przy wiadomości w kolejce, aby wstrzyknąć tę kontynuację do trwającej tury.
    - Wpisz `/stop` (albo samodzielne frazy przerwania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji.

  </Accordion>
  <Accordion title="Zachowanie częściowej treści po przerwaniu">
    - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta nadal może być pokazany w UI.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje zbuforowane wyjście.
    - Utrwalone wpisy zawierają metadane przerwania, aby konsumenci transkrypcji mogli odróżnić częściowe treści po przerwaniu od wyjścia z normalnego ukończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i Web Push

Control UI dostarcza `manifest.webmanifest` oraz service worker, więc nowoczesne przeglądarki mogą zainstalować je jako samodzielną PWA. Web Push pozwala Gateway wybudzić zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie są otwarte.

| Powierzchnia                                           | Co robi                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy jest osiągalny. |
| `ui/public/sw.js`                                     | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw) | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone punkty końcowe subskrypcji przeglądarki.                  |

Nadpisz parę kluczy VAPID przez zmienne środowiskowe w procesie Gateway, gdy chcesz przypiąć klucze (dla wdrożeń wielohostowych, rotacji sekretów lub testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `mailto:openclaw@localhost`)

Control UI używa tych ograniczonych zakresem metod Gateway do rejestrowania i testowania subskrypcji przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany punkt końcowy.
- `push.web.test` — wysyła powiadomienie testowe do subskrypcji wywołującego.

<Note>
Web Push jest niezależny od ścieżki przekaźnika APNS iOS (zobacz [Konfiguracja](/pl/gateway/configuration) dla powiadomień push wspieranych przekaźnikiem) oraz istniejącej metody `push.test`, które są przeznaczone dla natywnego parowania mobilnego.
</Note>

## Hostowane osadzenia

Wiadomości asystenta mogą renderować hostowane treści webowe w wierszu za pomocą shortcode’u `[embed ...]`. Polityka piaskownicy iframe jest kontrolowana przez `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (default)">
    Pozwala na interaktywne osadzenia, zachowując izolację pochodzenia; jest to ustawienie domyślne i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście potrzebuje zachowania same-origin. Dla większości gier generowanych przez agentów i interaktywnych canvasów `scripts` jest bezpieczniejszym wyborem.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` pozostają domyślnie blokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` ładował strony innych firm, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

## Dostęp przez tailnet (zalecane)

<Tabs>
  <Tab title="Zintegrowane Tailscale Serve (preferowane)">
    Pozostaw Gateway na loopback i pozwól Tailscale Serve proxy’ować go przez HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (albo skonfigurowane `gateway.controlUi.basePath`)

    Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` za pomocą `tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy żądanie trafia na loopback z nagłówkami Tailscale `x-forwarded-*`. Dla sesji operatora Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija też rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia w roli węzła nadal przechodzą zwykłe kontrole urządzeń. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń ze współdzielonym sekretem nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` albo `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia dla tego samego adresu IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Współbieżne błędne ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niedopasowań ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokenu zakłada, że host Gateway jest zaufany. Jeśli na tym hoście może działać niezaufany kod lokalny, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Powiąż z tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (albo skonfigurowane `gateway.controlUi.basePath`)

    Wklej pasujący współdzielony sekret w ustawieniach UI (wysyłany jako `connect.params.auth.token` albo `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niezabezpieczony HTTP

Jeśli otwierasz pulpit przez zwykły HTTP (`http://<lan-ip>` albo `http://<tailscale-ip>`), przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność niezabezpieczonego HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- udane uwierzytelnianie operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana poprawka:** użyj HTTPS (Tailscale Serve) albo otwórz UI lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście Gateway)

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

    `allowInsecureAuth` jest wyłącznie lokalnym przełącznikiem zgodności:

    - Pozwala sesjom Control UI z localhost kontynuować bez tożsamości urządzenia w niezabezpieczonych kontekstach HTTP.
    - Nie omija kontroli parowania.
    - Nie rozluźnia wymagań tożsamości urządzenia zdalnego (nie-localhost).

  </Accordion>
  <Accordion title="Tylko break-glass">
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
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia w Control UI i jest poważnym obniżeniem poziomu bezpieczeństwa. Cofnij to szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Uwaga o zaufanym proxy">
    - Pomyślne uwierzytelnienie przez zaufane proxy może dopuścić sesje Control UI **operatora** bez tożsamości urządzenia.
    - Nie obejmuje to sesji Control UI o roli węzła.
    - Odwrotne proxy pętli zwrotnej na tym samym hoście nadal nie spełniają warunków uwierzytelnienia zaufanego proxy; zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki dotyczące konfiguracji HTTPS.

## Zasady bezpieczeństwa treści

Control UI jest dostarczany z restrykcyjną zasadą `img-src`: dozwolone są tylko zasoby **tego samego pochodzenia**, adresy URL `data:` oraz lokalnie generowane adresy URL `blob:`. Zdalne adresy URL obrazów `http(s)` i względne względem protokołu są odrzucane przez przeglądarkę i nie wywołują żądań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy awatarów, które interfejs UI pobiera i konwertuje na lokalne adresy URL `blob:`.
- Wbudowane adresy URL `data:image/...` nadal się renderują (przydatne dla ładunków przesyłanych w protokole).
- Lokalne adresy URL `blob:` utworzone przez Control UI nadal się renderują.
- Zdalne adresy URL awatarów emitowane przez metadane kanału są usuwane w helperach awatarów Control UI i zastępowane wbudowanym logo/znaczkiem, więc przejęty lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz niczego zmieniać, aby uzyskać to zachowanie — jest ono zawsze włączone i nie można go konfigurować.

## Uwierzytelnianie trasy awatara

Gdy uwierzytelnianie Gateway jest skonfigurowane, punkt końcowy awatara Control UI wymaga tego samego tokenu Gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara według tej samej reguły.
- Nieuwierzytelnione żądania do obu tras są odrzucane (tak jak w siostrzanej trasie assistant-media). Zapobiega to wyciekowi tożsamości agenta przez trasę awatara na hostach, które są poza tym chronione.
- Sam Control UI przekazuje token Gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych adresów URL blob, dzięki czemu obraz nadal renderuje się w pulpitach.

Jeśli wyłączysz uwierzytelnianie Gateway (niezalecane na współdzielonych hostach), trasa awatara również staje się nieuwierzytelniona, zgodnie z resztą Gateway.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je poleceniem:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz mieć stałe adresy URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do lokalnego developmentu (oddzielny serwer developerski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na adres URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

## Debugowanie/testowanie: serwer developerski + zdalny Gateway

Control UI to pliki statyczne; cel WebSocket jest konfigurowalny i może różnić się od pochodzenia HTTP. Jest to przydatne, gdy chcesz uruchomić lokalnie serwer developerski Vite, ale Gateway działa gdzie indziej.

<Steps>
  <Step title="Uruchom serwer developerski UI">
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
    - Jeśli przekazujesz pełny punkt końcowy `ws://` lub `wss://` przez `gatewayUrl`, zakoduj wartość `gatewayUrl` jako URL, aby przeglądarka poprawnie przetworzyła ciąg zapytania.
    - `token` należy przekazywać przez fragment adresu URL (`#token=...`), gdy tylko to możliwe. Fragmenty nie są wysyłane do serwera, co pozwala uniknąć wycieków w logach żądań i nagłówku Referer. Starsze parametry zapytania `?token=` są nadal jednorazowo importowane dla zgodności, ale tylko jako mechanizm awaryjny, i są usuwane natychmiast po bootstrapie.
    - `password` jest przechowywane tylko w pamięci.
    - Gdy `gatewayUrl` jest ustawiony, UI nie wraca do danych uwierzytelniających z konfiguracji ani środowiska. Podaj `token` (lub `password`) jawnie. Brak jawnych danych uwierzytelniających jest błędem.
    - Użyj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itd.).
    - `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
    - Wdrożenia Control UI poza pętlą zwrotną muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne pochodzenia). Obejmuje to zdalne konfiguracje developerskie.
    - Uruchomienie Gateway może zasilić lokalne pochodzenia, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, na podstawie efektywnego runtime bind i portu, ale zdalne pochodzenia przeglądarki nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanymi testami lokalnymi. Oznacza to zezwolenie na dowolne pochodzenie przeglądarki, a nie „dopasuj dowolny host, którego używam”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb awaryjnego pochodzenia z nagłówka Host, ale jest to niebezpieczny tryb bezpieczeństwa.

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

- [Pulpit](/pl/web/dashboard) — pulpit Gateway
- [Kontrole kondycji](/pl/gateway/health) — monitorowanie kondycji Gateway
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [WebChat](/pl/web/webchat) — interfejs czatu w przeglądarce
