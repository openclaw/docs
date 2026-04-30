---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz mieć dostęp do Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Przeglądarkowy interfejs sterowania dla Gateway (czat, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-04-30T10:25:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 982d25d48770b753faa4e57d9a284e9bff10c15cda21dd9c00848d2a6b912d41
    source_path: web/control-ui.md
    workflow: 16
---

Interfejs Control UI to niewielka jednostronicowa aplikacja **Vite + Lit** serwowana przez Gateway:

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

Panel ustawień pulpitu przechowuje token dla bieżącej sesji karty przeglądarki i wybranego URL Gateway; hasła nie są utrwalane. Onboarding zwykle generuje token Gateway do uwierzytelniania współdzielonym sekretem przy pierwszym połączeniu, ale uwierzytelnianie hasłem też działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z Control UI z nowej przeglądarki lub urządzenia, Gateway zwykle wymaga **jednorazowego zatwierdzenia parowania**. To środek bezpieczeństwa zapobiegający nieautoryzowanemu dostępowi.

**Co zobaczysz:** „disconnected (1008): pairing required”

<Steps>
  <Step title="Wyświetl oczekujące żądania">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Zatwierdź według ID żądania">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Jeśli przeglądarka ponowi próbę parowania ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostanie zastąpione i zostanie utworzone nowe `requestId`. Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/administrację, zostanie to potraktowane jako podniesienie zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw utrzymuje stare zatwierdzenie jako aktywne, blokuje szersze ponowne połączenie i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie zostanie zapamiętane i nie będzie wymagać ponownego zatwierdzania, chyba że je odwołasz za pomocą `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby dowiedzieć się o rotacji i odwoływaniu tokenów.

<Note>
- Bezpośrednie połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć rundę parowania dla sesji operatora Control UI, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie powiązania Tailnet, połączenia przeglądarki przez LAN oraz profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikalny ID urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego sparowania.

</Note>

## Tożsamość osobista (lokalna w przeglądarce)

Control UI obsługuje osobistą tożsamość per przeglądarka (nazwę wyświetlaną i awatar) dołączaną do wiadomości wychodzących na potrzeby atrybucji w sesjach współdzielonych. Jest przechowywana w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza zwykłymi metadanymi autorstwa transkrypcji dla wiadomości, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam wzorzec lokalny w przeglądarce dotyczy nadpisania awatara asystenta. Przesłane awatary asystenta nakładają tożsamość ustaloną przez Gateway tylko w lokalnej przeglądarce i nigdy nie przechodzą w obie strony przez `config.patch`. Współdzielone pole konfiguracji `ui.assistant.avatar` nadal jest dostępne dla klientów innych niż UI, którzy zapisują to pole bezpośrednio (takich jak skryptowane gatewaye lub niestandardowe pulpity).

## Punkt końcowy konfiguracji wykonawczej

Control UI pobiera swoje ustawienia wykonawcze z `/__openclaw/control-ui-config.json`. Ten punkt końcowy jest chroniony tym samym uwierzytelnianiem Gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a pomyślne pobranie wymaga już prawidłowego tokenu/hasła Gateway, tożsamości Tailscale Serve albo tożsamości zaufanego proxy.

## Obsługa języków

Control UI może zlokalizować się przy pierwszym ładowaniu na podstawie lokalizacji przeglądarki. Aby później ją nadpisać, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor lokalizacji znajduje się w karcie Dostęp do Gateway, a nie w sekcji Wygląd.

- Obsługiwane lokalizacje: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są ładowane leniwie w przeglądarce.
- Wybrana lokalizacja jest zapisywana w pamięci przeglądarki i ponownie używana podczas przyszłych wizyt.
- Brakujące klucze tłumaczeń wracają do języka angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu lokalizacji innych niż angielska, ale wbudowany selektor języka witryny dokumentacji Mintlify jest ograniczony do kodów lokalizacji akceptowanych przez Mintlify. Dokumentacja po tajsku (`th`) i persku (`fa`) nadal jest generowana w repo publikacji; może nie pojawiać się w tym selektorze, dopóki Mintlify nie obsłuży tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [motywy tweakcn](https://tweakcn.com/themes), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link motywu w sekcji Wygląd. Importer akceptuje też adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, względne ścieżki `/themes/<id>`, surowe ID motywów oraz domyślne nazwy motywów, takie jak `amethyst-haze`.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane do konfiguracji Gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; wyczyszczenie go przełącza aktywny motyw z powrotem na Claw, jeśli zaimportowany motyw był wybrany.

## Co potrafi (obecnie)

<AccordionGroup>
  <Accordion title="Czat i rozmowa">
    - Rozmawiaj z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Rozmawiaj przez przeglądarkowe sesje w czasie rzeczywistym. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokenu przeglądarki przez WebSocket, a wyłącznie backendowe Pluginy głosowe czasu rzeczywistego używają transportu przekaźnikowego Gateway. Przekaźnik utrzymuje poświadczenia dostawcy na Gateway, gdy przeglądarka strumieniuje PCM z mikrofonu przez RPC `talk.realtime.relay*` i odsyła wywołania narzędzia `openclaw_agent_consult` przez `chat.send` do większego skonfigurowanego modelu OpenClaw.
    - Strumieniuj wywołania narzędzi oraz karty wyników narzędzi na żywo w czacie (zdarzenia agenta).

  </Accordion>
  <Accordion title="Kanały, instancje, sesje, sny">
    - Kanały: status kanałów wbudowanych oraz kanałów z bundlowanych/zewnętrznych Pluginów, logowanie QR i konfiguracja per kanał (`channels.status`, `web.login.*`, `config.patch`).
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: lista + nadpisania modelu/myślenia/szybkości/szczegółowości/śledzenia/rozumowania per sesja (`sessions.list`, `sessions.patch`).
    - Sny: status Dreaming, przełącznik włącz/wyłącz oraz czytnik Dziennika snów (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, węzły, zatwierdzenia exec">
    - Zadania Cron: lista/dodawanie/edycja/uruchomienie/włączanie/wyłączanie + historia uruchomień (`cron.*`).
    - Skills: status, włączanie/wyłączanie, instalacja, aktualizacje kluczy API (`skills.*`).
    - Węzły: lista + możliwości (`node.list`).
    - Zatwierdzenia exec: edytuj allowlisty Gateway lub węzła + politykę pytania dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguracja">
    - Wyświetl/edytuj `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Zastosuj + uruchom ponownie z walidacją (`config.apply`) i wybudź ostatnią aktywną sesję.
    - Zapisy obejmują zabezpieczenie haszem bazowym, aby zapobiec nadpisaniu równoczesnych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wykonują wstępną kontrolę rozwiązywania aktywnych SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Schemat + renderowanie formularza (`config.schema` / `config.schema.lookup`, w tym pola `title` / `description`, dopasowane podpowiedzi UI, podsumowania bezpośrednich elementów potomnych, metadane dokumentacji na zagnieżdżonych węzłach obiektów/wildcard/tablic/kompozycji oraz schematy Pluginów + kanałów, gdy są dostępne); edytor Raw JSON jest dostępny tylko wtedy, gdy migawka ma bezpieczną surową podróż w obie strony.
    - Jeśli migawka nie może bezpiecznie odbyć surowej podróży w obie strony, Control UI wymusza tryb formularza i wyłącza tryb Raw dla tej migawki.
    - „Resetuj do zapisanych” w edytorze Raw JSON zachowuje surowo utworzony kształt (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczoną migawkę, więc zewnętrzne edycje przetrwają reset, gdy migawka może bezpiecznie odbyć podróż w obie strony.
    - Strukturalne wartości obiektów SecretRef są renderowane jako tylko do odczytu w polach tekstowych formularza, aby zapobiec przypadkowemu uszkodzeniu przez konwersję obiektu na ciąg.

  </Accordion>
  <Accordion title="Debugowanie, logi, aktualizacja">
    - Debugowanie: migawki statusu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Logi: podgląd na żywo logów plikowych Gateway z filtrowaniem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + restart (`update.run`) z raportem restartu, a następnie odpytuj `update.status` po ponownym połączeniu, aby zweryfikować działającą wersję Gateway.

  </Accordion>
  <Accordion title="Uwagi panelu zadań Cron">
    - Dla zadań izolowanych dostarczanie domyślnie ogłasza podsumowanie. Możesz przełączyć na brak, jeśli chcesz uruchomień tylko wewnętrznych.
    - Pola kanału/celu pojawiają się, gdy wybrane jest ogłaszanie.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy adres URL Webhook HTTP(S).
    - Dla zadań sesji głównej dostępne są tryby dostarczania Webhook i brak.
    - Zaawansowane kontrolki edycji obejmują usunięcie po uruchomieniu, wyczyszczenie nadpisania agenta, dokładne/rozproszone opcje Cron, nadpisania modelu/myślenia agenta oraz przełączniki dostarczania best-effort.
    - Walidacja formularza jest liniowa z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu poprawienia.
    - Ustaw `cron.webhookToken`, aby wysłać dedykowany token bearer; jeśli zostanie pominięty, Webhook zostanie wysłany bez nagłówka uwierzytelniania.
    - Przestarzały mechanizm awaryjny: zapisane starsze zadania z `notify: true` nadal mogą używać `cron.webhook` do czasu migracji.

  </Accordion>
</AccordionGroup>

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: natychmiast potwierdza przyjęcie przez `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`.
    - Przesyłanie do czatu akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; pozostałe pliki są przechowywane jako zarządzane multimedia i wyświetlane w historii jako linki do załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po zakończeniu.
    - Odpowiedzi `chat.history` mają ograniczony rozmiar ze względu na bezpieczeństwo UI. Gdy wpisy transkrypcji są zbyt duże, Gateway może skracać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować nadmiernie duże wiadomości placeholderem (`[chat.history omitted: message too large]`).
    - Obrazy asystenta/wygenerowane obrazy są utrwalane jako zarządzane odwołania do multimediów i zwracane przez uwierzytelnione adresy URL multimediów Gateway, więc ponowne wczytania nie zależą od pozostawania surowych ładunków obrazów base64 w odpowiedzi historii czatu.
    - `chat.history` usuwa też z widocznego tekstu asystenta wyłącznie prezentacyjne wbudowane tagi dyrektyw (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), zwykłotekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz skrócone bloki wywołań narzędzi), a także ujawnione tokeny sterujące modelu w zapisie ASCII/pełnej szerokości, oraz pomija wpisy asystenta, których cały widoczny tekst jest wyłącznie dokładnym cichym tokenem `NO_REPLY` / `no_reply`.
    - Podczas aktywnego wysyłania i końcowego odświeżania historii widok czatu utrzymuje widoczność lokalnych optymistycznych wiadomości użytkownika/asystenta, jeśli `chat.history` krótko zwróci starszą migawkę; kanoniczna transkrypcja zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległość.
    - `chat.inject` dopisuje notatkę asystenta do transkrypcji sesji i rozsyła zdarzenie `chat` na potrzeby aktualizacji wyłącznie w UI (bez uruchomienia agenta, bez dostarczenia kanałem).
    - Selektory modelu i myślenia w nagłówku czatu natychmiast aktualizują aktywną sesję przez `sessions.patch`; są trwałymi nadpisaniami sesji, a nie opcjami wysyłki tylko dla jednej tury.
    - Selektor modelu czatu żąda skonfigurowanego widoku modeli z Gateway. Jeśli `agents.defaults.models` jest obecne, ta lista dozwolonych pozycji steruje selektorem. W przeciwnym razie selektor pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnieniem. Pełny katalog pozostaje dostępny przez debugujące RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway wskazują wysoką presję kontekstu, obszar kompozytora czatu pokazuje powiadomienie o kontekście, a przy zalecanych poziomach Compaction kompaktowy przycisk uruchamiający zwykłą ścieżkę Compaction sesji. Nieaktualne migawki tokenów są ukrywane, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb rozmowy (realtime w przeglądarce)">
    Tryb rozmowy używa zarejestrowanego dostawcy głosu realtime. Skonfiguruj OpenAI za pomocą `talk.provider: "openai"` oraz `talk.providers.openai.apiKey` albo skonfiguruj Google za pomocą `talk.provider: "google"` oraz `talk.providers.google.apiKey`; konfiguracja dostawcy realtime Voice Call nadal może być ponownie użyta jako rozwiązanie zapasowe. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy ograniczony token uwierzytelniający Live API dla sesji WebSocket w przeglądarce, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy udostępniający wyłącznie backendowy most realtime działają przez transport przekaźnikowy Gateway, więc poświadczenia i gniazda dostawców pozostają po stronie serwera, podczas gdy audio przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.realtime.session` nie przyjmuje nadpisań instrukcji dostarczanych przez wywołującego.

    W kompozytorze czatu kontrolka rozmowy to przycisk fal obok przycisku dyktowania mikrofonem. Po rozpoczęciu rozmowy wiersz statusu kompozytora pokazuje `Connecting Talk...`, następnie `Talk live`, gdy audio jest połączone, albo `Asking OpenClaw...`, gdy wywołanie narzędzia realtime konsultuje skonfigurowany większy model przez `chat.send`.

    Dymny test live dla opiekunów: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje wymianę SDP WebRTC OpenAI w przeglądarce, konfigurację przeglądarkowego WebSocket Google Live z ograniczonym tokenem oraz przeglądarkowy adapter przekaźnika Gateway z fałszywymi multimediami mikrofonu. Polecenie wypisuje tylko status dostawcy i nie loguje sekretów.

  </Accordion>
  <Accordion title="Zatrzymywanie i przerywanie">
    - Kliknij **Stop** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe kolejne wiadomości trafiają do kolejki. Kliknij **Steer** przy wiadomości w kolejce, aby wstrzyknąć tę kolejną wiadomość do trwającej tury.
    - Wpisz `/stop` (albo samodzielne frazy przerwania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji.

  </Accordion>
  <Accordion title="Zachowywanie części po przerwaniu">
    - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta nadal może być wyświetlany w UI.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje zbuforowane wyjście.
    - Utrwalone wpisy zawierają metadane przerwania, aby konsumenci transkrypcji mogli odróżnić części po przerwaniu od zwykłego wyjścia zakończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i Web Push

Control UI dostarcza `manifest.webmanifest` oraz service worker, więc nowoczesne przeglądarki mogą instalować go jako samodzielną PWA. Web Push pozwala Gateway wybudzać zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie jest otwarte.

| Powierzchnia                                          | Co robi                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy stanie się osiągalny. |
| `ui/public/sw.js`                                     | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw)    | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone endpointy subskrypcji przeglądarek.                      |

Nadpisz parę kluczy VAPID przez zmienne środowiskowe w procesie Gateway, gdy chcesz przypiąć klucze (dla wdrożeń wielohostowych, rotacji sekretów lub testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `mailto:openclaw@localhost`)

Control UI używa tych metod Gateway ograniczonych zakresem, aby rejestrować i testować subskrypcje przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany endpoint.
- `push.web.test` — wysyła testowe powiadomienie do subskrypcji wywołującego.

<Note>
Web Push jest niezależny od ścieżki przekaźnika iOS APNS (zobacz [Konfiguracja](/pl/gateway/configuration) dla powiadomień push opartych na przekaźniku) oraz od istniejącej metody `push.test`, które są przeznaczone dla natywnego parowania mobilnego.
</Note>

## Hostowane osadzenia

Wiadomości asystenta mogą renderować hostowaną zawartość webową w wierszu za pomocą shortcode `[embed ...]`. Polityka sandbox iframe jest kontrolowana przez `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (default)">
    Pozwala na interaktywne osadzenia przy zachowaniu izolacji pochodzenia; to ustawienie domyślne i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście potrzebuje zachowania tego samego pochodzenia. Dla większości gier generowanych przez agenta i interaktywnych canvasów `scripts` jest bezpieczniejszym wyborem.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` pozostają domyślnie blokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` ładował strony zewnętrzne, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

## Dostęp przez tailnet (zalecane)

<Tabs>
  <Tab title="Zintegrowany Tailscale Serve (preferowane)">
    Utrzymuj Gateway na local loopback i pozwól Tailscale Serve pośredniczyć przez HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (albo skonfigurowany `gateway.controlUi.basePath`)

    Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` za pomocą `tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy żądanie trafia na local loopback z nagłówkami `x-forwarded-*` Tailscale. Dla sesji operatora Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija też rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia w roli węzła nadal przechodzą zwykłe kontrole urządzenia. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń współdzielonego sekretu nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` albo `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia dla tego samego adresu IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Równoległe nieudane ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niedopasowań ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokena zakłada, że host bramy jest zaufany. Jeśli na tym hoście może działać niezaufany kod lokalny, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Powiązanie z tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (albo skonfigurowany `gateway.controlUi.basePath`)

    Wklej pasujący współdzielony sekret w ustawieniach UI (wysyłany jako `connect.params.auth.token` albo `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niebezpieczny HTTP

Jeśli otworzysz dashboard przez zwykły HTTP (`http://<lan-ip>` albo `http://<tailscale-ip>`), przeglądarka działa w **niebezpiecznym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność niebezpiecznego HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- pomyślne uwierzytelnienie operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana poprawka:** użyj HTTPS (Tailscale Serve) albo otwórz UI lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście bramy)

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

    `allowInsecureAuth` jest wyłącznie lokalnym przełącznikiem zgodności:

    - Pozwala sesjom localhost Control UI kontynuować bez tożsamości urządzenia w niebezpiecznych kontekstach HTTP.
    - Nie omija kontroli parowania.
    - Nie luzuje wymagań tożsamości urządzenia zdalnego (innego niż localhost).

  </Accordion>
  <Accordion title="Tylko awaryjnie">
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
    `dangerouslyDisableDeviceAuth` wyłącza sprawdzanie tożsamości urządzenia Control UI i stanowi poważne obniżenie poziomu bezpieczeństwa. Cofnij tę zmianę szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Uwaga o zaufanym proxy">
    - Pomyślne uwierzytelnienie zaufanego proxy może dopuścić sesje Control UI **operatora** bez tożsamości urządzenia.
    - Nie obejmuje to sesji Control UI o roli węzła.
    - Zwrotne proxy odwrotne na tym samym hoście nadal nie spełniają wymagań uwierzytelnienia zaufanego proxy; zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki dotyczące konfiguracji HTTPS.

## Polityka bezpieczeństwa treści

Control UI jest dostarczany z rygorystyczną polityką `img-src`: dozwolone są tylko zasoby **same-origin**, URL-e `data:` oraz lokalnie wygenerowane URL-e `blob:`. Zdalne URL-e obrazów `http(s)` i URL-e obrazów względne względem protokołu są odrzucane przez przeglądarkę i nie powodują żądań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy awatarów, które UI pobiera i konwertuje na lokalne URL-e `blob:`.
- Wbudowane URL-e `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Lokalne URL-e `blob:` utworzone przez Control UI nadal się renderują.
- Zdalne URL-e awatarów emitowane przez metadane kanału są usuwane przez pomocniki awatarów Control UI i zastępowane wbudowanym logo/odznaką, więc przejęty lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz niczego zmieniać, aby uzyskać to zachowanie — jest zawsze włączone i nie można go konfigurować.

## Uwierzytelnianie trasy awatara

Gdy uwierzytelnianie Gateway jest skonfigurowane, punkt końcowy awatara Control UI wymaga tego samego tokenu Gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara według tej samej reguły.
- Nieuwierzytelnione żądania do którejkolwiek z tych tras są odrzucane (tak jak w siostrzanej trasie multimediów asystenta). Zapobiega to wyciekowi tożsamości agenta przez trasę awatara na hostach, które poza tym są chronione.
- Sam Control UI przekazuje token Gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych URL-i blob, dzięki czemu obraz nadal renderuje się w panelach.

Jeśli wyłączysz uwierzytelnianie Gateway (niezalecane na współdzielonych hostach), trasa awatara również staje się nieuwierzytelniona, zgodnie z resztą Gateway.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je za pomocą:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz stałe URL-e zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do programowania lokalnego (osobny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

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

    Opcjonalne jednorazowe uwierzytelnianie (jeśli potrzebne):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uwagi">
    - `gatewayUrl` jest zapisywany w localStorage po załadowaniu i usuwany z URL-a.
    - Jeśli przekazujesz pełny punkt końcowy `ws://` lub `wss://` przez `gatewayUrl`, zakoduj wartość `gatewayUrl` jako URL, aby przeglądarka poprawnie przeanalizowała ciąg zapytania.
    - `token` należy przekazywać przez fragment URL-a (`#token=...`), gdy tylko jest to możliwe. Fragmenty nie są wysyłane do serwera, co zapobiega wyciekowi do logów żądań i nagłówka Referer. Starsze parametry zapytania `?token=` są nadal importowane raz ze względu na zgodność, ale tylko jako rozwiązanie awaryjne, i są usuwane natychmiast po bootstrapie.
    - `password` jest przechowywany tylko w pamięci.
    - Gdy `gatewayUrl` jest ustawiony, UI nie wraca do poświadczeń z konfiguracji ani środowiska. Podaj jawnie `token` (lub `password`). Brak jawnych poświadczeń jest błędem.
    - Używaj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itd.).
    - `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
    - Wdrożenia Control UI inne niż local loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne źródła). Dotyczy to także zdalnych konfiguracji deweloperskich.
    - Uruchomienie Gateway może zasiać lokalne źródła, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, z efektywnego powiązania i portu środowiska wykonawczego, ale zdalne źródła przeglądarki nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanymi testami lokalnymi. Oznacza to zezwolenie na dowolne źródło przeglądarki, a nie „dopasuj dowolny host, którego używam”.
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

Szczegóły konfiguracji dostępu zdalnego: [Dostęp zdalny](/pl/gateway/remote).

## Powiązane

- [Panel](/pl/web/dashboard) — panel Gateway
- [Kontrole kondycji](/pl/gateway/health) — monitorowanie kondycji Gateway
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [WebChat](/pl/web/webchat) — interfejs czatu w przeglądarce
