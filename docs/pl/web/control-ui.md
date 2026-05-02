---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz mieć dostęp do Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Przeglądarkowy interfejs sterowania dla Gateway (czat, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-05-02T23:39:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50bef807915f27406e19f1c6ca7d839a610d79ba79da85d7a78523400cbf9208
    source_path: web/control-ui.md
    workflow: 16
---

Control UI to mała jednostronicowa aplikacja **Vite + Lit** obsługiwana przez Gateway:

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

Panel ustawień pulpitu przechowuje token dla bieżącej sesji karty przeglądarki i wybranego adresu URL gateway; hasła nie są utrwalane. Onboarding zwykle generuje token gateway do uwierzytelniania wspólnym sekretem przy pierwszym połączeniu, ale uwierzytelnianie hasłem też działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z Control UI z nowej przeglądarki lub urządzenia, Gateway zwykle wymaga **jednorazowego zatwierdzenia parowania**. To środek bezpieczeństwa zapobiegający nieautoryzowanemu dostępowi.

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

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/administrację, jest to traktowane jako podniesienie poziomu zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw utrzymuje stare zatwierdzenie jako aktywne, blokuje ponowne połączenie z szerszymi uprawnieniami i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie jest zapamiętywane i nie będzie wymagać ponownego zatwierdzenia, chyba że je odwołasz poleceniem `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby uzyskać informacje o rotacji i odwoływaniu tokenów.

<Note>
- Bezpośrednie połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć rundę parowania dla sesji operatora Control UI, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie powiązania Tailnet, połączenia przeglądarki z sieci LAN oraz profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikatowy identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

</Note>

## Tożsamość osobista (lokalna w przeglądarce)

Control UI obsługuje osobistą tożsamość dla danej przeglądarki (nazwę wyświetlaną i awatar), dołączaną do wiadomości wychodzących w celu przypisania autorstwa we współdzielonych sesjach. Jest przechowywana w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza zwykłymi metadanymi autorstwa transkryptu dla wiadomości, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam lokalny w przeglądarce wzorzec dotyczy nadpisania awatara asystenta. Przesłane awatary asystenta nakładają tożsamość rozwiązaną przez gateway tylko w lokalnej przeglądarce i nigdy nie przechodzą w obie strony przez `config.patch`. Współdzielone pole konfiguracji `ui.assistant.avatar` jest nadal dostępne dla klientów innych niż UI, którzy zapisują to pole bezpośrednio (takich jak skryptowane gatewaye lub niestandardowe pulpity).

## Punkt końcowy konfiguracji środowiska uruchomieniowego

Control UI pobiera swoje ustawienia środowiska uruchomieniowego z `/__openclaw/control-ui-config.json`. Ten punkt końcowy jest chroniony tym samym uwierzytelnianiem gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a udane pobranie wymaga już ważnego tokenu/hasła gateway, tożsamości Tailscale Serve albo tożsamości zaufanego proxy.

## Obsługa języków

Control UI może zlokalizować się przy pierwszym ładowaniu na podstawie lokalizacji przeglądarki. Aby później to zmienić, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor lokalizacji znajduje się w karcie Dostęp do Gateway, a nie w Wyglądzie.

- Obsługiwane lokalizacje: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są leniwie ładowane w przeglądarce.
- Wybrana lokalizacja jest zapisywana w pamięci przeglądarki i używana ponownie podczas kolejnych wizyt.
- Brakujące klucze tłumaczeń wracają do języka angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu lokalizacji innych niż angielska, ale wbudowany w witrynę dokumentacji selektor języka Mintlify jest ograniczony do kodów lokalizacji akceptowanych przez Mintlify. Dokumentacja tajska (`th`) i perska (`fa`) nadal jest generowana w repozytorium publikacji; może nie pojawiać się w tym selektorze, dopóki Mintlify nie będzie obsługiwać tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne w przeglądarce miejsce importu tweakcn. Aby zaimportować motyw, otwórz [motywy tweakcn](https://tweakcn.com/themes), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link motywu w Wyglądzie. Importer akceptuje też adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, względne ścieżki `/themes/<id>`, surowe identyfikatory motywów i domyślne nazwy motywów, takie jak `amethyst-haze`.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane w konfiguracji gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; wyczyszczenie go przełącza aktywny motyw z powrotem na Claw, jeśli wybrany był zaimportowany motyw.

## Co potrafi (obecnie)

<AccordionGroup>
  <Accordion title="Czat i rozmowa">
    - Rozmawiaj z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Dyktuj do kompozytora czatu za pomocą STT po stronie serwera (`chat.transcribeAudio`). Przeglądarka nagrywa krótki klip z mikrofonu i wysyła go do Gateway, który uruchamia skonfigurowany potok transkrypcji `tools.media.audio` i zwraca szkic tekstu bez ujawniania danych uwierzytelniających dostawcy przeglądarce.
    - Rozmawiaj przez sesje czasu rzeczywistego w przeglądarce. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokenu przeglądarki przez WebSocket, a wtyczki głosowe czasu rzeczywistego działające tylko w backendzie używają transportu przekaźnikowego Gateway. Przekaźnik utrzymuje dane uwierzytelniające dostawcy na Gateway, podczas gdy przeglądarka strumieniuje PCM z mikrofonu przez RPC `talk.realtime.relay*` i wysyła wywołania narzędzia `openclaw_agent_consult` z powrotem przez `chat.send` do większego skonfigurowanego modelu OpenClaw.
    - Strumieniuj wywołania narzędzi i karty wyjścia narzędzi na żywo w czacie (zdarzenia agenta).

  </Accordion>
  <Accordion title="Kanały, instancje, sesje, sny">
    - Kanały: status kanałów wbudowanych oraz kanałów Plugin w pakiecie/zewnętrznych, logowanie QR i konfiguracja dla poszczególnych kanałów (`channels.status`, `web.login.*`, `config.patch`).
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: lista + nadpisania modelu/myślenia/trybu szybkiego/trybu szczegółowego/śledzenia/rozumowania dla poszczególnych sesji (`sessions.list`, `sessions.patch`).
    - Sny: status Dreaming, przełącznik włączania/wyłączania i czytnik Dziennika snów (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, węzły, zatwierdzenia exec">
    - Zadania Cron: lista/dodawanie/edycja/uruchamianie/włączanie/wyłączanie + historia uruchomień (`cron.*`).
    - Skills: status, włączanie/wyłączanie, instalacja, aktualizacje kluczy API (`skills.*`).
    - Węzły: lista + możliwości (`node.list`).
    - Zatwierdzenia exec: edycja list dozwolonych gateway lub węzła + zasady pytania dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguracja">
    - Wyświetl/edytuj `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Zastosuj + uruchom ponownie z walidacją (`config.apply`) i wybudź ostatnią aktywną sesję.
    - Zapisy obejmują zabezpieczenie bazowego hasha, aby zapobiec nadpisaniu równoległych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wstępnie sprawdzają rozwiązywanie aktywnych SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Renderowanie schematu + formularza (`config.schema` / `config.schema.lookup`, w tym pola `title` / `description`, dopasowane wskazówki UI, podsumowania bezpośrednich elementów podrzędnych, metadane dokumentacji w zagnieżdżonych węzłach obiektów/wieloznacznych/tablic/kompozycji oraz schematy Plugin + kanałów, gdy są dostępne); surowy edytor JSON jest dostępny tylko wtedy, gdy migawka ma bezpieczny surowy obieg w obie strony.
    - Jeśli migawka nie może bezpiecznie przejść surowego obiegu w obie strony, Control UI wymusza tryb formularza i wyłącza tryb surowy dla tej migawki.
    - „Reset to saved” w surowym edytorze JSON zachowuje kształt utworzony w trybie surowym (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczoną migawkę, dzięki czemu zewnętrzne edycje przetrwają reset, gdy migawka może bezpiecznie przejść obieg w obie strony.
    - Ustrukturyzowane wartości obiektów SecretRef są renderowane jako tylko do odczytu w tekstowych polach formularza, aby zapobiec przypadkowemu uszkodzeniu przez zmianę obiektu na ciąg znaków.

  </Accordion>
  <Accordion title="Debugowanie, logi, aktualizacja">
    - Debugowanie: migawki statusu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Logi: podgląd na żywo końca logów plikowych gateway z filtrowaniem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + restart (`update.run`) z raportem restartu, a następnie odpytuj `update.status` po ponownym połączeniu, aby zweryfikować działającą wersję gateway.

  </Accordion>
  <Accordion title="Uwagi do panelu zadań Cron">
    - Dla zadań izolowanych dostarczanie domyślnie ogłasza podsumowanie. Możesz przełączyć na brak, jeśli chcesz uruchomienia wyłącznie wewnętrzne.
    - Pola kanału/celu pojawiają się po wybraniu ogłaszania.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy adres URL HTTP(S) webhook.
    - Dla zadań sesji głównej dostępne są tryby dostarczania Webhook i brak.
    - Zaawansowane kontrolki edycji obejmują usuwanie po uruchomieniu, czyszczenie nadpisania agenta, dokładne/rozłożone opcje cron, nadpisania modelu/myślenia agenta oraz przełączniki dostarczania w trybie najlepszych starań.
    - Walidacja formularza jest wbudowana i pokazuje błędy na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu naprawy.
    - Ustaw `cron.webhookToken`, aby wysyłać dedykowany token bearer; jeśli zostanie pominięty, webhook zostanie wysłany bez nagłówka uwierzytelniania.
    - Przestarzały fallback: zapisane starsze zadania z `notify: true` nadal mogą używać `cron.webhook` do czasu migracji.

  </Accordion>
</AccordionGroup>

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: natychmiast potwierdza z `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`.
    - `chat.transcribeAudio` to jednorazowy pomocnik dyktowania dla wersji roboczych czatu. Przyjmuje nagrany w przeglądarce dźwięk base64, utrzymuje przesyłane dane poniżej limitu ramki WebSocket Gateway, zapisuje tymczasowy plik lokalny, uruchamia transkrypcję dźwięku z rozumieniem multimediów z aktywną konfiguracją Gateway, zwraca `{ text, provider, model }` i usuwa plik tymczasowy. Nie tworzy uruchomienia agenta i jest oddzielne od Talk w czasie rzeczywistym.
    - Przesyłanie do czatu akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; inne pliki są przechowywane jako zarządzane multimedia i pokazywane w historii jako linki załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po ukończeniu.
    - Odpowiedzi `chat.history` są ograniczone rozmiarem dla bezpieczeństwa UI. Gdy wpisy transkrypcji są zbyt duże, Gateway może skracać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować zbyt duże wiadomości symbolem zastępczym (`[chat.history omitted: message too large]`).
    - Obrazy asystenta/wygenerowane są utrwalane jako zarządzane odwołania do multimediów i udostępniane z powrotem przez uwierzytelnione adresy URL multimediów Gateway, więc ponowne załadowania nie zależą od tego, czy surowe ładunki obrazów base64 pozostaną w odpowiedzi historii czatu.
    - `chat.history` usuwa także z widocznego tekstu asystenta tylko-wyświetleniowe znaczniki dyrektyw inline (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), zwykłotekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz skrócone bloki wywołań narzędzi), ujawnione tokeny sterujące modelu ASCII/pełnej szerokości, a także pomija wpisy asystenta, których cały widoczny tekst to wyłącznie dokładny cichy token `NO_REPLY` / `no_reply`.
    - Podczas aktywnego wysyłania i końcowego odświeżania historii widok czatu utrzymuje lokalne optymistyczne wiadomości użytkownika/asystenta widoczne, jeśli `chat.history` na chwilę zwróci starszą migawkę; kanoniczna transkrypcja zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległości.
    - `chat.inject` dodaje notatkę asystenta do transkrypcji sesji i rozgłasza zdarzenie `chat` dla aktualizacji wyłącznie UI (bez uruchomienia agenta, bez dostarczenia kanałem).
    - Selektory modelu i myślenia w nagłówku czatu natychmiast aktualizują aktywną sesję przez `sessions.patch`; są trwałymi nadpisaniami sesji, a nie opcjami wysłania tylko dla jednej tury.
    - Wpisanie `/new` w Control UI tworzy i przełącza na taką samą świeżą sesję pulpitu jak New Chat. Wpisanie `/reset` zachowuje jawne resetowanie w miejscu przez Gateway dla bieżącej sesji.
    - Selektor modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli `agents.defaults.models` jest obecne, ta lista dozwolonych modeli steruje selektorem. W przeciwnym razie selektor pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnieniem. Pełny katalog pozostaje dostępny przez debugowe RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway pokazują wysoką presję kontekstu, obszar kompozytora czatu pokazuje powiadomienie o kontekście, a przy zalecanych poziomach Compaction przycisk kompaktowania, który uruchamia normalną ścieżkę Compaction sesji. Nieaktualne migawki tokenów są ukrywane, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb Talk (przeglądarka w czasie rzeczywistym)">
    Tryb Talk używa zarejestrowanego dostawcy głosu w czasie rzeczywistym. Skonfiguruj OpenAI z `talk.provider: "openai"` oraz `talk.providers.openai.apiKey`, albo skonfiguruj Google z `talk.provider: "google"` oraz `talk.providers.google.apiKey`; konfiguracja dostawcy czasu rzeczywistego Voice Call nadal może być użyta jako fallback. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy, ograniczony token uwierzytelniania Live API dla sesji WebSocket przeglądarki, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy, którzy udostępniają tylko backendowy most czasu rzeczywistego, działają przez transport przekaźnikowy Gateway, więc poświadczenia i gniazda dostawców pozostają po stronie serwera, podczas gdy dźwięk przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.realtime.session` nie akceptuje dostarczonych przez wywołującego nadpisań instrukcji.

    W kompozytorze czatu kontrolka Talk to przycisk z falami obok przycisku dyktowania mikrofonem. Gdy Talk się uruchamia, wiersz statusu kompozytora pokazuje `Connecting Talk...`, następnie `Talk live`, gdy dźwięk jest połączony, albo `Asking OpenClaw...`, gdy wywołanie narzędzia czasu rzeczywistego konsultuje skonfigurowany większy model przez `chat.send`.

    Test dymny live dla maintainerów: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje wymianę SDP OpenAI WebRTC w przeglądarce, konfigurację ograniczonego tokenu Google Live dla WebSocket przeglądarki oraz adapter przeglądarkowy przekaźnika Gateway z fałszywymi multimediami mikrofonu. Polecenie wypisuje tylko status dostawcy i nie loguje sekretów.

  </Accordion>
  <Accordion title="Zatrzymanie i przerwanie">
    - Kliknij **Stop** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe dalsze wiadomości trafiają do kolejki. Kliknij **Steer** na zakolejkowanej wiadomości, aby wstrzyknąć tę dalszą wiadomość do działającej tury.
    - Wpisz `/stop` (lub samodzielne frazy przerwania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji.

  </Accordion>
  <Accordion title="Zachowanie częściowej treści po przerwaniu">
    - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta nadal może być pokazywany w UI.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje zbuforowane wyjście.
    - Utrwalone wpisy zawierają metadane przerwania, aby konsumenci transkrypcji mogli odróżnić częściowe treści przerwania od normalnego wyjścia ukończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i web push

Control UI dostarcza `manifest.webmanifest` i service worker, więc nowoczesne przeglądarki mogą zainstalować go jako samodzielną PWA. Web Push pozwala Gateway wybudzić zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie są otwarte.

| Powierzchnia                                          | Co robi                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują „Install app”, gdy staje się osiągalny. |
| `ui/public/sw.js`                                     | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw)    | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone endpointy subskrypcji przeglądarki.                      |

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
Web Push jest niezależny od ścieżki przekaźnika APNS iOS (zobacz [Konfiguracja](/pl/gateway/configuration) dla push opartego na przekaźniku) oraz istniejącej metody `push.test`, które celują w natywne parowanie mobilne.
</Note>

## Osadzenia hostowane

Wiadomości asystenta mogą renderować hostowane treści internetowe inline za pomocą shortcode `[embed ...]`. Polityka sandbox iframe jest kontrolowana przez `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (default)">
    Zezwala na interaktywne osadzenia przy zachowaniu izolacji origin; jest to wartość domyślna i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście potrzebuje zachowania same-origin. Dla większości gier generowanych przez agentów i interaktywnych płócien `scripts` jest bezpieczniejszym wyborem.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` pozostają domyślnie blokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` ładował strony zewnętrzne, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

## Szerokość wiadomości czatu

Zgrupowane wiadomości czatu używają czytelnej domyślnej maksymalnej szerokości. Wdrożenia na szerokich monitorach mogą ją nadpisać bez łatania dołączonego CSS przez ustawienie `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Wartość jest walidowana, zanim dotrze do przeglądarki. Obsługiwane wartości obejmują proste długości i procenty, takie jak `960px` lub `82%`, oraz ograniczone wyrażenia szerokości `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` i `fit-content(...)`.

## Dostęp przez tailnet (zalecane)

<Tabs>
  <Tab title="Zintegrowane Tailscale Serve (preferowane)">
    Utrzymaj Gateway na loopback i pozwól Tailscale Serve pośredniczyć przez HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (lub skonfigurowane `gateway.controlUi.basePath`)

    Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` za pomocą `tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy żądanie trafia na loopback z nagłówkami `x-forwarded-*` Tailscale. Dla sesji operatora Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija także rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia roli węzła nadal przechodzą normalne kontrole urządzeń. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń wspólnego sekretu nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` lub `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia dla tego samego adresu IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Współbieżne błędne ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niedopasowań ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokenu zakłada, że host gateway jest zaufany. Jeśli niezaufany lokalny kod może działać na tym hoście, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Powiąż z tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (lub skonfigurowane `gateway.controlUi.basePath`)

    Wklej pasujący wspólny sekret w ustawieniach UI (wysyłany jako `connect.params.auth.token` lub `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niezabezpieczony HTTP

Jeśli otworzysz pulpit przez zwykły HTTP (`http://<lan-ip>` lub `http://<tailscale-ip>`), przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność z niezabezpieczonym HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- pomyślne uwierzytelnianie operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana poprawka:** użyj HTTPS (Tailscale Serve) albo otwórz UI lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście gateway)

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

    - Pozwala sesjom localhost Control UI działać bez tożsamości urządzenia w niezabezpieczonych kontekstach HTTP.
    - Nie omija kontroli parowania.
    - Nie łagodzi wymagań dotyczących tożsamości urządzenia zdalnego (innego niż localhost).

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
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia Control UI i jest poważnym obniżeniem poziomu bezpieczeństwa. Cofnij tę zmianę szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Uwaga o trusted-proxy">
    - Pomyślne uwierzytelnianie trusted-proxy może dopuścić **operatorskie** sesje Control UI bez tożsamości urządzenia.
    - To **nie** obejmuje sesji Control UI w roli node.
    - Zwrotne serwery proxy na tym samym hoście nadal nie spełniają warunków uwierzytelniania trusted-proxy; zobacz [Uwierzytelnianie przez zaufany serwer proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki dotyczące konfiguracji HTTPS.

## Polityka bezpieczeństwa treści

Control UI jest dostarczany ze ścisłą polityką `img-src`: dozwolone są tylko zasoby **tego samego origin**, adresy URL `data:` oraz lokalnie wygenerowane adresy URL `blob:`. Zdalne adresy URL obrazów `http(s)` i zależne od protokołu są odrzucane przez przeglądarkę i nie powodują pobierania przez sieć.

Co to oznacza w praktyce:

- Awatary i obrazy udostępniane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal są renderowane, w tym uwierzytelnione trasy awatarów, które UI pobiera i konwertuje na lokalne adresy URL `blob:`.
- Wbudowane adresy URL `data:image/...` nadal są renderowane (przydatne dla ładunków w protokole).
- Lokalne adresy URL `blob:` utworzone przez Control UI nadal są renderowane.
- Zdalne adresy URL awatarów emitowane przez metadane kanału są usuwane w helperach awatarów Control UI i zastępowane wbudowanym logo/znaczkiem, więc przejęty lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz niczego zmieniać, aby uzyskać to zachowanie — jest zawsze włączone i nie można go skonfigurować.

## Uwierzytelnianie trasy awatara

Gdy uwierzytelnianie gateway jest skonfigurowane, endpoint awatara Control UI wymaga tego samego tokenu gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara według tej samej reguły.
- Nieuwierzytelnione żądania do którejkolwiek trasy są odrzucane (tak jak w pokrewnej trasie assistant-media). Zapobiega to ujawnianiu tożsamości agenta przez trasę awatara na hostach, które poza tym są chronione.
- Sam Control UI przekazuje token gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych adresów URL blob, dzięki czemu obraz nadal renderuje się w dashboardach.

Jeśli wyłączysz uwierzytelnianie gateway (niezalecane na hostach współdzielonych), trasa awatara również stanie się nieuwierzytelniona, zgodnie z resztą gateway.

## Budowanie UI

Gateway udostępnia pliki statyczne z `dist/control-ui`. Zbuduj je za pomocą:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz stałych adresów URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do rozwoju lokalnego (oddzielny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

## Debugowanie/testowanie: serwer deweloperski + zdalny Gateway

Control UI to pliki statyczne; cel WebSocket jest konfigurowalny i może różnić się od origin HTTP. Jest to przydatne, gdy chcesz uruchomić lokalnie serwer deweloperski Vite, ale Gateway działa gdzie indziej.

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
    - Jeśli przekazujesz pełny endpoint `ws://` lub `wss://` przez `gatewayUrl`, zakoduj wartość `gatewayUrl` jako URL, aby przeglądarka poprawnie przeanalizowała ciąg zapytania.
    - `token` należy przekazywać przez fragment URL (`#token=...`), kiedy tylko jest to możliwe. Fragmenty nie są wysyłane na serwer, co pozwala uniknąć wycieku w logach żądań i nagłówku Referer. Starsze parametry zapytania `?token=` nadal są jednorazowo importowane ze względu na zgodność, ale tylko jako rozwiązanie awaryjne, i są usuwane natychmiast po bootstrapie.
    - `password` jest przechowywane tylko w pamięci.
    - Gdy `gatewayUrl` jest ustawiony, UI nie wraca do danych uwierzytelniających z konfiguracji ani środowiska. Podaj jawnie `token` (lub `password`). Brak jawnych danych uwierzytelniających jest błędem.
    - Użyj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itd.).
    - `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
    - Wdrożenia Control UI inne niż loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne origin). Obejmuje to zdalne konfiguracje deweloperskie.
    - Uruchomienie Gateway może zainicjować lokalne origin, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, na podstawie efektywnego powiązania i portu runtime, ale zdalne origin przeglądarki nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanymi testami lokalnymi. Oznacza to zezwolenie na dowolny origin przeglądarki, a nie „dopasuj dowolny host, którego używam”.
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
