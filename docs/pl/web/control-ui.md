---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz dostępu do Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Oparty na przeglądarce interfejs sterowania dla Gateway (czat, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-05-02T20:59:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88959ccf435b31015039bf28c3043023d99f0b953a1489986ab2d0cbd261771c
    source_path: web/control-ui.md
    workflow: 16
---

Interfejs Control UI to mała jednostronicowa aplikacja **Vite + Lit** obsługiwana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Komunikuje się **bezpośrednio z Gateway WebSocket** na tym samym porcie.

## Szybkie otwarcie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

Uwierzytelnianie jest przekazywane podczas uzgadniania połączenia WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień pulpitu przechowuje token dla bieżącej sesji karty przeglądarki i wybranego adresu URL gateway; hasła nie są utrwalane. Onboarding zwykle generuje token gateway do uwierzytelniania współdzielonym sekretem przy pierwszym połączeniu, ale uwierzytelnianie hasłem też działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z interfejsem Control UI z nowej przeglądarki lub urządzenia, Gateway zwykle wymaga **jednorazowego zatwierdzenia parowania**. To środek bezpieczeństwa zapobiegający nieautoryzowanemu dostępowi.

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

Jeśli przeglądarka ponawia próbę parowania ze zmienionymi danymi uwierzytelniania (rola/zakresy/klucz publiczny), poprzednia oczekująca prośba zostaje zastąpiona i tworzony jest nowy `requestId`. Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz ją z dostępu do odczytu na dostęp do zapisu/administracyjny, jest to traktowane jako rozszerzenie zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw utrzymuje stare zatwierdzenie jako aktywne, blokuje ponowne połączenie o szerszym zakresie i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie zostaje zapamiętane i nie będzie wymagać ponownego zatwierdzenia, chyba że je unieważnisz poleceniem `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby uzyskać informacje o rotacji i unieważnianiu tokenów.

<Note>
- Bezpośrednie połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć rundę parowania dla sesji operatora Control UI, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie powiązania Tailnet, połączenia przeglądarki w sieci LAN oraz profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikatowy identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

</Note>

## Tożsamość osobista (lokalna dla przeglądarki)

Control UI obsługuje osobistą tożsamość dla każdej przeglądarki (nazwę wyświetlaną i awatar) dołączaną do wiadomości wychodzących na potrzeby przypisania autorstwa we współdzielonych sesjach. Jest przechowywana w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza standardowymi metadanymi autorstwa transkrypcji przy wiadomościach, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam wzorzec lokalny dla przeglądarki dotyczy nadpisania awatara asystenta. Przesłane awatary asystenta nakładają tożsamość rozpoznaną przez gateway tylko w lokalnej przeglądarce i nigdy nie są przesyłane zwrotnie przez `config.patch`. Współdzielone pole konfiguracji `ui.assistant.avatar` jest nadal dostępne dla klientów innych niż UI, którzy zapisują to pole bezpośrednio (takich jak skryptowane gateway lub niestandardowe pulpity).

## Punkt końcowy konfiguracji runtime

Control UI pobiera swoje ustawienia runtime z `/__openclaw/control-ui-config.json`. Ten punkt końcowy jest chroniony tym samym uwierzytelnianiem gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a udane pobranie wymaga już ważnego tokena/hasła gateway, tożsamości Tailscale Serve albo tożsamości zaufanego proxy.

## Obsługa języków

Control UI może zlokalizować się przy pierwszym ładowaniu na podstawie ustawień regionalnych przeglądarki. Aby później to zmienić, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor ustawień regionalnych znajduje się na karcie Dostęp do Gateway, a nie w sekcji Wygląd.

- Obsługiwane ustawienia regionalne: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są leniwie ładowane w przeglądarce.
- Wybrane ustawienie regionalne jest zapisywane w pamięci przeglądarki i ponownie używane przy kolejnych wizytach.
- Brakujące klucze tłumaczeń wracają do języka angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu ustawień regionalnych innych niż angielskie, ale wbudowany selektor języka witryny dokumentacji Mintlify jest ograniczony do kodów ustawień regionalnych akceptowanych przez Mintlify. Dokumentacja tajska (`th`) i perska (`fa`) nadal jest generowana w repozytorium publikacji; może nie pojawić się w tym selektorze, dopóki Mintlify nie zacznie obsługiwać tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [motywy tweakcn](https://tweakcn.com/themes), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link motywu w sekcji Wygląd. Importer akceptuje też adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, względne ścieżki `/themes/<id>`, surowe identyfikatory motywów i domyślne nazwy motywów, takie jak `amethyst-haze`.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane w konfiguracji gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; wyczyszczenie go przełącza aktywny motyw z powrotem na Claw, jeśli zaimportowany motyw był wybrany.

## Co potrafi (obecnie)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Czat z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Rozmowy przez sesje przeglądarkowe w czasie rzeczywistym. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokena przeglądarki przez WebSocket, a backendowe Plugin głosu w czasie rzeczywistym używają transportu przekaźnikowego Gateway. Przekaźnik utrzymuje dane uwierzytelniające dostawcy w Gateway, podczas gdy przeglądarka strumieniuje PCM z mikrofonu przez RPC `talk.realtime.relay*` i wysyła wywołania narzędzia `openclaw_agent_consult` z powrotem przez `chat.send` do większego skonfigurowanego modelu OpenClaw.
    - Strumieniowe wywołania narzędzi + karty wyników narzędzi na żywo w czacie (zdarzenia agenta).

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Kanały: wbudowane oraz status kanałów z dołączonych/zewnętrznych Plugin, logowanie QR i konfiguracja per kanał (`channels.status`, `web.login.*`, `config.patch`).
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: lista + nadpisania modelu/myślenia/trybu szybkiego/szczegółowości/śladu/rozumowania per sesja (`sessions.list`, `sessions.patch`).
    - Sny: status Dreaming, przełącznik włączania/wyłączania i czytnik dziennika snów (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Zadania Cron: lista/dodawanie/edycja/uruchamianie/włączanie/wyłączanie + historia uruchomień (`cron.*`).
    - Skills: status, włączanie/wyłączanie, instalacja, aktualizacje kluczy API (`skills.*`).
    - Nodes: lista + możliwości (`node.list`).
    - Zatwierdzenia exec: edycja list dozwolonych gateway lub node + zasady pytań dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Wyświetlanie/edycja `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Zastosowanie + restart z walidacją (`config.apply`) i wybudzenie ostatniej aktywnej sesji.
    - Zapisy obejmują strażnika skrótu bazowego, aby zapobiec nadpisaniu równoległych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wykonują wstępną kontrolę rozwiązywania aktywnych SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Renderowanie schematu + formularza (`config.schema` / `config.schema.lookup`, w tym `title` / `description` pola, dopasowane wskazówki UI, natychmiastowe podsumowania elementów potomnych, metadane dokumentacji na zagnieżdżonych węzłach obiektów/wieloznacznych/tablic/kompozycji oraz schematy Plugin + kanałów, gdy są dostępne); edytor Raw JSON jest dostępny tylko wtedy, gdy migawka ma bezpieczny surowy obieg zwrotny.
    - Jeśli migawka nie może bezpiecznie przejść surowego obiegu zwrotnego, Control UI wymusza tryb Formularza i wyłącza tryb Raw dla tej migawki.
    - „Resetuj do zapisanego” w edytorze Raw JSON zachowuje surowo utworzony kształt (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczoną migawkę, dzięki czemu zewnętrzne edycje przetrwają reset, gdy migawka może bezpiecznie przejść obieg zwrotny.
    - Strukturalne wartości obiektów SecretRef są renderowane jako tylko do odczytu w polach tekstowych formularza, aby zapobiec przypadkowemu uszkodzeniu przez konwersję obiektu na ciąg znaków.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debugowanie: migawki statusu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Logi: śledzenie na żywo logów plikowych gateway z filtrem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + restart (`update.run`) z raportem restartu, a następnie odpytuj `update.status` po ponownym połączeniu, aby zweryfikować wersję uruchomionego gateway.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Dla zadań izolowanych dostarczanie domyślnie ogłasza podsumowanie. Możesz przełączyć na brak, jeśli chcesz uruchomienia tylko wewnętrzne.
    - Pola kanału/celu pojawiają się, gdy wybrane jest ogłoszenie.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy adres URL Webhook HTTP(S).
    - Dla zadań sesji głównej dostępne są tryby dostarczania Webhook i brak.
    - Zaawansowane kontrolki edycji obejmują usuwanie po uruchomieniu, czyszczenie nadpisania agenta, opcje dokładnego/rozłożonego Cron, nadpisania modelu/myślenia agenta oraz przełączniki dostarczania best-effort.
    - Walidacja formularza jest liniowa, z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu ich naprawienia.
    - Ustaw `cron.webhookToken`, aby wysłać dedykowany token bearer; jeśli zostanie pominięty, Webhook zostanie wysłany bez nagłówka uwierzytelniania.
    - Przestarzałe rozwiązanie awaryjne: zapisane starsze zadania z `notify: true` mogą nadal używać `cron.webhook` do czasu migracji.

  </Accordion>
</AccordionGroup>

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` jest **nieblokujące**: natychmiast potwierdza z `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`.
    - Przesyłanie w czacie akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; inne pliki są przechowywane jako zarządzane media i pokazywane w historii jako linki do załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po zakończeniu.
    - Odpowiedzi `chat.history` mają ograniczony rozmiar ze względu na bezpieczeństwo UI. Gdy wpisy transkrypcji są zbyt duże, Gateway może skrócić długie pola tekstowe, pominąć ciężkie bloki metadanych i zastąpić zbyt duże wiadomości symbolem zastępczym (`[chat.history omitted: message too large]`).
    - Obrazy asystenta/wygenerowane są utrwalane jako zarządzane odwołania do mediów i zwracane przez uwierzytelnione adresy URL mediów Gateway, więc ponowne wczytania nie zależą od tego, czy surowe ładunki obrazów base64 pozostaną w odpowiedzi historii czatu.
    - `chat.history` usuwa też z widocznego tekstu asystenta wyłącznie prezentacyjne wbudowane tagi dyrektyw (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz skrócone bloki wywołań narzędzi), a także ujawnione tokeny sterujące modelu ASCII/pełnej szerokości, oraz pomija wpisy asystenta, których cały widoczny tekst jest wyłącznie dokładnym tokenem ciszy `NO_REPLY` / `no_reply`.
    - Podczas aktywnego wysyłania i końcowego odświeżenia historii widok czatu utrzymuje widoczne lokalne optymistyczne wiadomości użytkownika/asystenta, jeśli `chat.history` krótko zwraca starszą migawkę; kanoniczna transkrypcja zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległość.
    - `chat.inject` dołącza notatkę asystenta do transkrypcji sesji i rozgłasza zdarzenie `chat` na potrzeby aktualizacji wyłącznie w UI (bez uruchomienia agenta i bez dostarczenia kanałowego).
    - Selektory modelu i myślenia w nagłówku czatu natychmiast aktualizują aktywną sesję przez `sessions.patch`; są to trwałe nadpisania sesji, a nie opcje wysyłania tylko na jedną turę.
    - Wpisanie `/new` w Control UI tworzy i przełącza na tę samą świeżą sesję pulpitu co Nowy czat. Wpisanie `/reset` zachowuje jawny reset w miejscu Gateway dla bieżącej sesji.
    - Selektor modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli istnieje `agents.defaults.models`, ta lista dozwolonych wartości steruje selektorem. W przeciwnym razie selektor pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnianiem. Pełny katalog pozostaje dostępny przez debugujące RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway pokazują wysoką presję kontekstu, obszar kompozytora czatu pokazuje powiadomienie kontekstowe, a przy zalecanych poziomach Compaction także kompaktowy przycisk uruchamiający normalną ścieżkę Compaction sesji. Nieaktualne migawki tokenów są ukrywane, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Talk mode (browser realtime)">
    Tryb rozmowy używa zarejestrowanego dostawcy głosu w czasie rzeczywistym. Skonfiguruj OpenAI za pomocą `talk.provider: "openai"` oraz `talk.providers.openai.apiKey` albo skonfiguruj Google za pomocą `talk.provider: "google"` oraz `talk.providers.google.apiKey`; konfiguracja dostawcy czasu rzeczywistego Voice Call może nadal zostać ponownie użyta jako awaryjna. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy ograniczony token uwierzytelniania Live API dla sesji WebSocket przeglądarki, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy, którzy udostępniają tylko backendowy most czasu rzeczywistego, działają przez transport przekaźnikowy Gateway, więc poświadczenia i gniazda dostawcy pozostają po stronie serwera, podczas gdy dźwięk przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.realtime.session` nie akceptuje nadpisań instrukcji dostarczanych przez wywołującego.

    W kompozytorze czatu kontrolka Rozmowa to przycisk z falami obok przycisku dyktowania mikrofonem. Po rozpoczęciu rozmowy wiersz stanu kompozytora pokazuje `Connecting Talk...`, następnie `Talk live`, gdy dźwięk jest połączony, albo `Asking OpenClaw...`, gdy wywołanie narzędzia czasu rzeczywistego konsultuje skonfigurowany większy model przez `chat.send`.

    Test dymny na żywo dla opiekunów: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje wymianę SDP WebRTC przeglądarki OpenAI, konfigurację WebSocket przeglądarki Google Live z ograniczonym tokenem oraz adapter przeglądarki przekaźnika Gateway z fałszywym nośnikiem mikrofonu. Polecenie wypisuje tylko status dostawcy i nie zapisuje sekretów w logach.

  </Accordion>
  <Accordion title="Stop and abort">
    - Kliknij **Stop** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe kolejne wiadomości trafiają do kolejki. Kliknij **Steer** przy wiadomości w kolejce, aby wstrzyknąć tę kolejną wiadomość do trwającej tury.
    - Wpisz `/stop` (lub samodzielne frazy przerwania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji.

  </Accordion>
  <Accordion title="Abort partial retention">
    - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta może nadal być pokazywany w UI.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje buforowane wyjście.
    - Utrwalone wpisy zawierają metadane przerwania, aby konsumenci transkrypcji mogli odróżnić częściowe wyniki przerwania od zwykłego wyjścia ukończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i Web Push

Control UI dostarcza `manifest.webmanifest` oraz service worker, więc nowoczesne przeglądarki mogą zainstalować go jako samodzielną PWA. Web Push pozwala Gateway wybudzić zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie jest otwarte.

| Powierzchnia                                           | Co robi                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy stanie się osiągalny. |
| `ui/public/sw.js`                                     | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw) | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone punkty końcowe subskrypcji przeglądarki.                 |

Nadpisz parę kluczy VAPID przez zmienne środowiskowe w procesie Gateway, gdy chcesz przypiąć klucze (dla wdrożeń wielohostowych, rotacji sekretów lub testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `mailto:openclaw@localhost`)

Control UI używa tych metod Gateway ograniczonych zakresem do rejestrowania i testowania subskrypcji przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany punkt końcowy.
- `push.web.test` — wysyła testowe powiadomienie do subskrypcji wywołującego.

<Note>
Web Push jest niezależny od ścieżki przekaźnika iOS APNS (zobacz [Konfiguracja](/pl/gateway/configuration) dla powiadomień push opartych na przekaźniku) oraz istniejącej metody `push.test`, które są przeznaczone dla natywnego parowania mobilnego.
</Note>

## Hostowane osadzenia

Wiadomości asystenta mogą renderować hostowane treści internetowe w wierszu za pomocą krótkiego kodu `[embed ...]`. Polityka piaskownicy iframe jest kontrolowana przez `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (default)">
    Pozwala na interaktywne osadzenia przy zachowaniu izolacji origin; to ustawienie domyślne i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
  </Tab>
  <Tab title="trusted">
    Dodaje `allow-same-origin` oprócz `allow-scripts` dla dokumentów w tej samej witrynie, które celowo potrzebują silniejszych uprawnień.
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście potrzebuje zachowania same-origin. Dla większości gier generowanych przez agentów i interaktywnych płócien bezpieczniejszym wyborem jest `scripts`.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` pozostają domyślnie blokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` ładowało strony zewnętrzne, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

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

Wartość jest walidowana, zanim trafi do przeglądarki. Obsługiwane wartości obejmują proste długości i procenty, takie jak `960px` lub `82%`, oraz ograniczone wyrażenia szerokości `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` i `fit-content(...)`.

## Dostęp przez tailnet (zalecane)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Utrzymuj Gateway na loopback i pozwól Tailscale Serve pośredniczyć z HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (lub skonfigurowany `gateway.controlUi.basePath`)

    Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` za pomocą `tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy żądanie trafia na loopback z nagłówkami `x-forwarded-*` Tailscale. W przypadku sesji operatora Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija również rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia w roli węzła nadal przechodzą normalne kontrole urządzeń. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń współdzielonego sekretu nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` lub `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia dla tego samego adresu IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Współbieżne nieudane ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niedopasowań ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokena zakłada, że host Gateway jest zaufany. Jeśli na tym hoście może działać niezaufany kod lokalny, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (lub skonfigurowany `gateway.controlUi.basePath`)

    Wklej pasujący współdzielony sekret w ustawieniach UI (wysyłany jako `connect.params.auth.token` lub `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niezabezpieczony HTTP

Jeśli otworzysz pulpit przez zwykły HTTP (`http://<lan-ip>` lub `http://<tailscale-ip>`), przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność niezabezpieczonego HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- pomyślne uwierzytelnianie operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana poprawka:** użyj HTTPS (Tailscale Serve) albo otwórz UI lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście Gateway)

<AccordionGroup>
  <Accordion title="Zachowanie przełącznika insecure-auth">
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
    - Nie łagodzi wymagań dotyczących tożsamości urządzenia zdalnego (nie-localhost).

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
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia Control UI i stanowi poważne obniżenie poziomu bezpieczeństwa. Przywróć poprzednie ustawienie szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Uwaga o zaufanym proxy">
    - Udane uwierzytelnianie przez zaufane proxy może dopuścić sesje Control UI **operatora** bez tożsamości urządzenia.
    - Nie obejmuje to sesji Control UI z rolą węzła.
    - Zwrotne proxy odwrotne na tym samym hoście nadal nie spełniają wymagań uwierzytelniania przez zaufane proxy; zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki dotyczące konfiguracji HTTPS.

## Polityka bezpieczeństwa treści

Control UI jest dostarczany z restrykcyjną polityką `img-src`: dozwolone są tylko zasoby **same-origin**, adresy URL `data:` oraz lokalnie generowane adresy URL `blob:`. Zdalne adresy URL obrazów `http(s)` i względne względem protokołu są odrzucane przez przeglądarkę i nie powodują żądań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy awatarów, które UI pobiera i konwertuje na lokalne adresy URL `blob:`.
- Wbudowane adresy URL `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Lokalne adresy URL `blob:` utworzone przez Control UI nadal się renderują.
- Zdalne adresy URL awatarów emitowane przez metadane kanału są usuwane w helperach awatarów Control UI i zastępowane wbudowanym logo/znaczkiem, więc przejęty lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz niczego zmieniać, aby uzyskać to zachowanie — jest ono zawsze włączone i nie można go konfigurować.

## Uwierzytelnianie trasy awatara

Gdy uwierzytelnianie gateway jest skonfigurowane, punkt końcowy awatara Control UI wymaga tego samego tokena gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara według tej samej reguły.
- Nieuwierzytelnione żądania do dowolnej z tych tras są odrzucane (tak samo jak sąsiednia trasa assistant-media). Zapobiega to wyciekowi tożsamości agenta przez trasę awatara na hostach, które poza tym są chronione.
- Sam Control UI przekazuje token gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych adresów URL blob, dzięki czemu obraz nadal renderuje się w dashboardach.

Jeśli wyłączysz uwierzytelnianie gateway (niezalecane na współdzielonych hostach), trasa awatara również stanie się nieuwierzytelniona, zgodnie z resztą gateway.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je za pomocą:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz mieć stałe adresy URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do lokalnego developmentu (oddzielny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na adres URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

## Debugowanie/testowanie: serwer deweloperski + zdalny Gateway

Control UI to pliki statyczne; cel WebSocket jest konfigurowalny i może różnić się od origin HTTP. To przydatne, gdy chcesz uruchomić lokalnie serwer deweloperski Vite, ale Gateway działa gdzie indziej.

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
    - Jeśli przekazujesz pełny punkt końcowy `ws://` lub `wss://` przez `gatewayUrl`, zakoduj wartość `gatewayUrl` w URL, aby przeglądarka poprawnie sparsowała ciąg zapytania.
    - `token` należy przekazywać przez fragment adresu URL (`#token=...`), gdy tylko jest to możliwe. Fragmenty nie są wysyłane na serwer, co pozwala uniknąć wycieku przez logi żądań i Referer. Starsze parametry zapytania `?token=` nadal są importowane jednorazowo dla zgodności, ale tylko jako rozwiązanie awaryjne, i są usuwane natychmiast po bootstrapie.
    - `password` jest przechowywane tylko w pamięci.
    - Gdy `gatewayUrl` jest ustawiony, UI nie wraca do danych uwierzytelniających z konfiguracji ani środowiska. Podaj `token` (lub `password`) jawnie. Brak jawnych danych uwierzytelniających jest błędem.
    - Użyj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itp.).
    - `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
    - Wdrożenia Control UI poza local loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne origin). Dotyczy to również zdalnych konfiguracji deweloperskich.
    - Start Gateway może zainicjować lokalne origin, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, na podstawie efektywnego runtime bind i portu, ale zdalne origin przeglądarki nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanym lokalnym testowaniem. Oznacza to zezwolenie na dowolny origin przeglądarki, a nie „dopasuj dowolny host, którego używam”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb awaryjnego użycia origin z nagłówka Host, ale jest to niebezpieczny tryb bezpieczeństwa.

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

- [Dashboard](/pl/web/dashboard) — dashboard gateway
- [Kontrole kondycji](/pl/gateway/health) — monitorowanie kondycji gateway
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [WebChat](/pl/web/webchat) — interfejs czatu w przeglądarce
