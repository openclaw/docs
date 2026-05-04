---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz dostępu do Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Przeglądarkowy interfejs sterowania Gateway (czat, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-05-04T02:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c890d83da2c296b600e4b5a00a538f37e6bd54da31fbe62113ecd6177b15626e
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

Panel ustawień pulpitu przechowuje token dla bieżącej sesji karty przeglądarki i wybranego adresu URL gateway; hasła nie są utrwalane. Onboarding zwykle generuje token gateway do uwierzytelniania współdzielonym sekretem przy pierwszym połączeniu, ale uwierzytelnianie hasłem też działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z Control UI z nowej przeglądarki lub urządzenia, Gateway zwykle wymaga **jednorazowego zatwierdzenia parowania**. To środek bezpieczeństwa zapobiegający nieautoryzowanemu dostępowi.

**Co zobaczysz:** „rozłączono (1008): wymagane parowanie”

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

Jeśli przeglądarka ponowi próbę parowania ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostanie zastąpione i powstanie nowy `requestId`. Przed zatwierdzeniem uruchom ponownie `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/administratora, zostanie to potraktowane jako podniesienie poziomu zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw zachowuje stare zatwierdzenie jako aktywne, blokuje ponowne połączenie z szerszym zakresem i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie zostaje zapamiętane i nie będzie wymagać ponownego zatwierdzenia, chyba że je odwołasz przez `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby dowiedzieć się o rotacji i odwoływaniu tokenów.

<Note>
- Bezpośrednie połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć pełny cykl parowania dla sesji operatora Control UI, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie bindowania Tailnet, połączenia przeglądarki przez LAN oraz profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikalny identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

</Note>

## Tożsamość osobista (lokalna dla przeglądarki)

Control UI obsługuje osobistą tożsamość przypisaną do przeglądarki (nazwę wyświetlaną i awatar), dołączaną do wiadomości wychodzących w celu atrybucji we współdzielonych sesjach. Znajduje się ona w pamięci przeglądarki, jest ograniczona do bieżącego profilu przeglądarki i nie synchronizuje się z innymi urządzeniami ani nie jest utrwalana po stronie serwera poza zwykłymi metadanymi autorstwa transkrypcji przy wiadomościach, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam lokalny dla przeglądarki wzorzec dotyczy zastąpienia awatara asystenta. Przesłane awatary asystenta nakładają tożsamość rozwiązaną przez gateway tylko w lokalnej przeglądarce i nigdy nie przechodzą pełnego cyklu przez `config.patch`. Współdzielone pole konfiguracji `ui.assistant.avatar` jest nadal dostępne dla klientów innych niż UI, którzy zapisują pole bezpośrednio (takich jak skryptowane gateway lub niestandardowe pulpity).

## Endpoint konfiguracji środowiska uruchomieniowego

Control UI pobiera swoje ustawienia środowiska uruchomieniowego z `/__openclaw/control-ui-config.json`. Ten endpoint jest chroniony tym samym uwierzytelnianiem gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a pomyślne pobranie wymaga już ważnego tokenu/hasła gateway, tożsamości Tailscale Serve albo tożsamości zaufanego proxy.

## Obsługa języków

Control UI może lokalizować się przy pierwszym ładowaniu na podstawie ustawień regionalnych przeglądarki. Aby zastąpić je później, otwórz **Przegląd -> Dostęp do Gateway -> Język**. Selektor ustawień regionalnych znajduje się na karcie Dostęp do Gateway, a nie w sekcji Wygląd.

- Obsługiwane ustawienia regionalne: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są leniwie ładowane w przeglądarce.
- Wybrane ustawienie regionalne jest zapisywane w pamięci przeglądarki i ponownie używane podczas przyszłych wizyt.
- Brakujące klucze tłumaczeń wracają do angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu ustawień regionalnych innych niż angielskie, ale wbudowany selektor języka witryny dokumentacji Mintlify jest ograniczony do kodów ustawień regionalnych akceptowanych przez Mintlify. Dokumentacja tajska (`th`) i perska (`fa`) nadal jest generowana w repozytorium publikacji; może nie pojawiać się w tym selektorze, dopóki Mintlify nie obsłuży tych kodów.

## Motywy wyglądu

Panel Wygląd zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [motywy tweakcn](https://tweakcn.com/themes), wybierz lub utwórz motyw, kliknij **Udostępnij** i wklej skopiowany link motywu w sekcji Wygląd. Importer akceptuje również adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora, takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, względne ścieżki `/themes/<id>`, surowe identyfikatory motywów oraz domyślne nazwy motywów, takie jak `amethyst-haze`.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane w konfiguracji gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; wyczyszczenie go przełącza aktywny motyw z powrotem na Claw, jeśli zaimportowany motyw był wybrany.

## Co może robić (obecnie)

<AccordionGroup>
  <Accordion title="Czat i rozmowa">
    - Czatuj z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Rozmawiaj przez sesje czasu rzeczywistego w przeglądarce. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego jednorazowego tokenu przeglądarki przez WebSocket, a działające tylko w backendzie Plugin głosu czasu rzeczywistego używają transportu przekaźnikowego Gateway. Przekaźnik utrzymuje poświadczenia dostawcy na Gateway, podczas gdy przeglądarka strumieniuje PCM z mikrofonu przez RPC `talk.realtime.relay*` i odsyła wywołania narzędzia `openclaw_agent_consult` przez `chat.send` do większego skonfigurowanego modelu OpenClaw.
    - Strumieniuj wywołania narzędzi i karty wyników narzędzi na żywo w Czacie (zdarzenia agenta).

  </Accordion>
  <Accordion title="Kanały, instancje, sesje, sny">
    - Kanały: wbudowane oraz spakowane/zewnętrzne statusy kanałów Plugin, logowanie QR i konfiguracja per kanał (`channels.status`, `web.login.*`, `config.patch`).
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: lista + zastąpienia modelu/myślenia/szybkości/szczegółowości/śledzenia/rozumowania per sesja (`sessions.list`, `sessions.patch`).
    - Sny: status dreaming, przełącznik włączania/wyłączania i czytnik Dziennika snów (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, zatwierdzenia exec">
    - Zadania Cron: lista/dodaj/edytuj/uruchom/włącz/wyłącz + historia uruchomień (`cron.*`).
    - Skills: status, włączanie/wyłączanie, instalacja, aktualizacje kluczy API (`skills.*`).
    - Węzły: lista + możliwości (`node.list`).
    - Zatwierdzenia exec: edycja list dozwolonych gateway lub węzła + polityka pytania dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguracja">
    - Wyświetl/edytuj `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Zastosuj + uruchom ponownie z walidacją (`config.apply`) i wybudź ostatnią aktywną sesję.
    - Zapisy obejmują zabezpieczenie bazowym hashem, aby zapobiec nadpisaniu równoległych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wstępnie sprawdzają rozwiązywanie aktywnych SecretRef dla odwołań w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane odwołania są odrzucane przed zapisem.
    - Schemat + renderowanie formularza (`config.schema` / `config.schema.lookup`, w tym pola `title` / `description`, dopasowane wskazówki UI, natychmiastowe podsumowania elementów potomnych, metadane dokumentacji na zagnieżdżonych węzłach obiektów/wieloznaczników/tablic/kompozycji oraz schematy Plugin + kanałów, gdy są dostępne); edytor surowego JSON jest dostępny tylko wtedy, gdy migawka ma bezpieczny surowy pełny cykl.
    - Jeśli migawka nie może bezpiecznie wykonać pełnego cyklu surowego tekstu, Control UI wymusza tryb Formularz i wyłącza tryb Surowy dla tej migawki.
    - Edytor surowego JSON „Resetuj do zapisanej” zachowuje kształt utworzony w surowej postaci (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczoną migawkę, dzięki czemu zewnętrzne edycje przetrwają reset, gdy migawka może bezpiecznie wykonać pełny cykl.
    - Strukturalne wartości obiektów SecretRef są renderowane jako tylko do odczytu w tekstowych polach formularza, aby zapobiec przypadkowemu uszkodzeniu przez konwersję obiektu na ciąg znaków.

  </Accordion>
  <Accordion title="Debugowanie, logi, aktualizacja">
    - Debugowanie: migawki statusu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Logi: aktywne śledzenie logów plikowych gateway z filtrem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + restart (`update.run`) z raportem restartu, a następnie odpytuj `update.status` po ponownym połączeniu, aby zweryfikować działającą wersję gateway.

  </Accordion>
  <Accordion title="Uwagi panelu zadań Cron">
    - Dla zadań izolowanych dostarczanie domyślnie ogłasza podsumowanie. Możesz przełączyć na brak, jeśli chcesz uruchomienia wyłącznie wewnętrzne.
    - Pola kanału/celu pojawiają się po wybraniu ogłaszania.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy adres URL Webhook HTTP(S).
    - Dla zadań sesji głównej dostępne są tryby dostarczania webhook i brak.
    - Zaawansowane kontrolki edycji obejmują usunięcie po uruchomieniu, wyczyszczenie zastąpienia agenta, dokładne/rozłożone opcje cron, zastąpienia modelu/myślenia agenta oraz przełączniki dostarczania best-effort.
    - Walidacja formularza jest wbudowana z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu poprawy.
    - Ustaw `cron.webhookToken`, aby wysłać dedykowany token bearer; jeśli zostanie pominięty, webhook zostanie wysłany bez nagłówka auth.
    - Przestarzały fallback: zapisane starsze zadania z `notify: true` mogą nadal używać `cron.webhook` do czasu migracji.

  </Accordion>
</AccordionGroup>

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: natychmiast potwierdza z `{ runId, status: "started" }`, a odpowiedź jest przesyłana strumieniowo przez zdarzenia `chat`.
    - Przesyłanie do czatu akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; pozostałe pliki są przechowywane jako zarządzane media i pokazywane w historii jako linki załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po zakończeniu.
    - Odpowiedzi `chat.history` mają ograniczony rozmiar dla bezpieczeństwa UI. Gdy wpisy transkrypcji są zbyt duże, Gateway może przyciąć długie pola tekstowe, pominąć ciężkie bloki metadanych i zastąpić zbyt duże wiadomości placeholderem (`[chat.history omitted: message too large]`).
    - Obrazy asystenta/wygenerowane są utrwalane jako zarządzane odwołania do mediów i zwracane przez uwierzytelnione adresy URL mediów Gateway, więc ponowne wczytania nie zależą od pozostania surowych ładunków obrazów base64 w odpowiedzi historii czatu.
    - `chat.history` usuwa też z widocznego tekstu asystenta wyłącznie prezentacyjne wbudowane tagi dyrektyw (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz przycięte bloki wywołań narzędzi), a także ujawnione tokeny sterujące modelu w ASCII/pełnej szerokości, oraz pomija wpisy asystenta, których cały widoczny tekst jest wyłącznie dokładnym cichym tokenem `NO_REPLY` / `no_reply`.
    - Podczas aktywnego wysyłania i końcowego odświeżania historii widok czatu utrzymuje lokalne optymistyczne wiadomości użytkownika/asystenta jako widoczne, jeśli `chat.history` przez chwilę zwraca starszą migawkę; kanoniczna transkrypcja zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległość.
    - Zdarzenia `chat` na żywo są stanem dostarczania, natomiast `chat.history` jest odbudowywane z trwałej transkrypcji sesji. Po zdarzeniach końcowych narzędzi Control UI ponownie wczytuje historię i scala tylko mały optymistyczny ogon; granica transkrypcji jest udokumentowana w [WebChat](/pl/web/webchat).
    - `chat.inject` dołącza notatkę asystenta do transkrypcji sesji i rozgłasza zdarzenie `chat` na potrzeby aktualizacji wyłącznie UI (bez uruchomienia agenta, bez dostarczania kanałem).
    - Wybieraki modelu i myślenia w nagłówku czatu natychmiast aktualizują aktywną sesję przez `sessions.patch`; są trwałymi nadpisaniami sesji, a nie opcjami wysyłania tylko dla jednej tury.
    - Wpisanie `/new` w Control UI tworzy tę samą świeżą sesję panelu co New Chat i przełącza na nią. Wpisanie `/reset` zachowuje jawny reset Gateway w miejscu dla bieżącej sesji.
    - Wybierak modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli istnieje `agents.defaults.models`, ta lista dozwolonych wartości steruje wybierakiem. W przeciwnym razie wybierak pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnianiem. Pełny katalog pozostaje dostępny przez debugowe RPC `models.list` z `view: "all"`.
    - Gdy raporty użycia świeżej sesji Gateway pokazują wysoką presję kontekstu, obszar kompozytora czatu pokazuje powiadomienie o kontekście, a przy zalecanych poziomach Compaction także kompaktowy przycisk uruchamiający normalną ścieżkę Compaction sesji. Nieaktualne migawki tokenów są ukryte, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb rozmowy (czas rzeczywisty w przeglądarce)">
    Tryb rozmowy używa zarejestrowanego dostawcy głosu w czasie rzeczywistym. Skonfiguruj OpenAI przez `talk.provider: "openai"` oraz `talk.providers.openai.apiKey`, albo skonfiguruj Google przez `talk.provider: "google"` oraz `talk.providers.google.apiKey`; konfiguracja dostawcy czasu rzeczywistego Voice Call nadal może być używana jako rozwiązanie zapasowe. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy, ograniczony token uwierzytelniania Live API dla sesji WebSocket przeglądarki, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy, którzy udostępniają tylko most czasu rzeczywistego po stronie backendu, działają przez transport przekaźnikowy Gateway, więc poświadczenia i gniazda dostawcy pozostają po stronie serwera, podczas gdy dźwięk przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.realtime.session` nie akceptuje nadpisań instrukcji dostarczanych przez wywołującego.

    W kompozytorze czatu kontrolka Talk to przycisk fal obok przycisku dyktowania mikrofonem. Gdy Talk startuje, wiersz stanu kompozytora pokazuje `Connecting Talk...`, następnie `Talk live`, gdy dźwięk jest połączony, albo `Asking OpenClaw...`, gdy wywołanie narzędzia czasu rzeczywistego konsultuje się ze skonfigurowanym większym modelem przez `chat.send`.

    Smoke test live dla maintainerów: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje wymianę SDP OpenAI WebRTC w przeglądarce, konfigurację WebSocket przeglądarki z ograniczonym tokenem Google Live oraz adapter przeglądarki przekaźnika Gateway z fałszywymi mediami mikrofonu. Polecenie wypisuje tylko status dostawcy i nie loguje sekretów.

  </Accordion>
  <Accordion title="Zatrzymanie i przerwanie">
    - Kliknij **Stop** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe kolejne wiadomości trafiają do kolejki. Kliknij **Steer** przy wiadomości w kolejce, aby wstrzyknąć tę kolejną wiadomość do trwającej tury.
    - Wpisz `/stop` (lub samodzielne frazy przerwania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji.

  </Accordion>
  <Accordion title="Zachowanie części po przerwaniu">
    - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta nadal może być pokazany w UI.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje zbuforowane wyjście.
    - Utrwalone wpisy zawierają metadane przerwania, aby konsumenci transkrypcji mogli odróżnić części po przerwaniu od normalnego wyjścia ukończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i Web Push

Control UI dostarcza `manifest.webmanifest` i service worker, więc nowoczesne przeglądarki mogą instalować go jako samodzielną PWA. Web Push pozwala Gateway wybudzać zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie jest otwarte.

| Powierzchnia                                           | Co robi                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                       | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy jest osiągalny. |
| `ui/public/sw.js`                                      | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw)     | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                     | Utrwalone punkty końcowe subskrypcji przeglądarki.                  |

Nadpisz parę kluczy VAPID przez zmienne środowiskowe w procesie Gateway, gdy chcesz przypiąć klucze (dla wdrożeń wielohostowych, rotacji sekretów lub testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `mailto:openclaw@localhost`)

Control UI używa tych metod Gateway ograniczonych zakresem do rejestrowania i testowania subskrypcji przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany punkt końcowy.
- `push.web.test` — wysyła powiadomienie testowe do subskrypcji wywołującego.

<Note>
Web Push jest niezależny od ścieżki przekaźnika APNS iOS (zobacz [Konfiguracja](/pl/gateway/configuration) dla powiadomień push opartych na przekaźniku) oraz istniejącej metody `push.test`, które są skierowane do natywnego parowania mobilnego.
</Note>

## Hostowane osadzenia

Wiadomości asystenta mogą renderować hostowaną zawartość internetową wbudowaną za pomocą shortcode `[embed ...]`. Polityką sandbox iframe steruje `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (domyślne)">
    Pozwala na interaktywne osadzenia przy zachowaniu izolacji origin; to ustawienie domyślne i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument naprawdę potrzebuje zachowania same-origin. Dla większości gier generowanych przez agentów i interaktywnych canvasów `scripts` jest bezpieczniejszym wyborem.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` domyślnie pozostają blokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` wczytywało strony firm trzecich, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

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

Wartość jest walidowana, zanim trafi do przeglądarki. Obsługiwane wartości obejmują proste długości i procenty, takie jak `960px` lub `82%`, a także ograniczone wyrażenia szerokości `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` i `fit-content(...)`.

## Dostęp do tailnetu (zalecane)

<Tabs>
  <Tab title="Zintegrowane Tailscale Serve (preferowane)">
    Pozostaw Gateway na loopback i pozwól Tailscale Serve proxy'ować go przez HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (lub skonfigurowane `gateway.controlUi.basePath`)

    Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` za pomocą `tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy żądanie trafia w loopback z nagłówkami `x-forwarded-*` Tailscale. Dla sesji operatora Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija też rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia roli node nadal przechodzą normalne kontrole urządzenia. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń współdzielonego sekretu nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` lub `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelniania dla tego samego IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Równoczesne błędne ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niedopasowań ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokena zakłada, że host gateway jest zaufany. Jeśli niezaufany kod lokalny może działać na tym hoście, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Powiąż z tailnetem + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (lub skonfigurowane `gateway.controlUi.basePath`)

    Wklej pasujący współdzielony sekret w ustawieniach UI (wysyłany jako `connect.params.auth.token` lub `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niezabezpieczone HTTP

Jeśli otworzysz panel przez zwykłe HTTP (`http://<lan-ip>` lub `http://<tailscale-ip>`), przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność niezabezpieczonego HTTP tylko dla localhost z `gateway.controlUi.allowInsecureAuth=true`
- udane uwierzytelnienie operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`
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

    `allowInsecureAuth` jest wyłącznie lokalnym przełącznikiem zgodności:

    - Pozwala lokalnym sesjom Control UI kontynuować bez tożsamości urządzenia w niezabezpieczonych kontekstach HTTP.
    - Nie omija kontroli parowania.
    - Nie rozluźnia wymagań dotyczących tożsamości urządzenia dla zdalnych (innych niż localhost) połączeń.

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
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia w Control UI i stanowi poważne obniżenie poziomu bezpieczeństwa. Cofnij to szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Uwaga o zaufanym proxy">
    - Pomyślne uwierzytelnienie zaufanego proxy może dopuścić sesje Control UI **operatora** bez tożsamości urządzenia.
    - Nie obejmuje to sesji Control UI w roli węzła.
    - Zwrotne reverse proxy na tym samym hoście nadal nie spełniają wymagań uwierzytelnienia zaufanego proxy; zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki dotyczące konfiguracji HTTPS.

## Zasady bezpieczeństwa treści

Control UI jest dostarczane z rygorystyczną zasadą `img-src`: dozwolone są tylko zasoby **same-origin**, adresy URL `data:` oraz lokalnie wygenerowane adresy URL `blob:`. Zdalne adresy URL obrazów `http(s)` i względne względem protokołu są odrzucane przez przeglądarkę i nie powodują wysłania żądań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy awatarów, które UI pobiera i konwertuje na lokalne adresy URL `blob:`.
- Wbudowane adresy URL `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Lokalne adresy URL `blob:` utworzone przez Control UI nadal się renderują.
- Zdalne adresy URL awatarów emitowane przez metadane kanałów są usuwane przez pomocnicze funkcje awatarów Control UI i zastępowane wbudowanym logo/odznaką, więc przejęty lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz nic zmieniać, aby uzyskać to zachowanie — jest zawsze włączone i nie można go konfigurować.

## Uwierzytelnianie trasy awatara

Gdy uwierzytelnianie Gateway jest skonfigurowane, punkt końcowy awatara Control UI wymaga tego samego tokenu gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara zgodnie z tą samą regułą.
- Nieuwierzytelnione żądania do którejkolwiek z tras są odrzucane (tak jak w sąsiedniej trasie assistant-media). Zapobiega to wyciekowi tożsamości agenta przez trasę awatara na hostach, które poza tym są chronione.
- Control UI samo przekazuje token gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych adresów URL blob, dzięki czemu obraz nadal renderuje się w dashboardach.

Jeśli wyłączysz uwierzytelnianie gateway (niezalecane na współdzielonych hostach), trasa awatara również stanie się nieuwierzytelniona, zgodnie z resztą gateway.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je za pomocą:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz stałe adresy URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do lokalnego rozwoju (osobny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na adres URL WS swojego Gateway (np. `ws://127.0.0.1:18789`).

## Debugowanie/testowanie: serwer deweloperski + zdalny Gateway

Control UI to pliki statyczne; cel WebSocket jest konfigurowalny i może być inny niż origin HTTP. To przydatne, gdy chcesz używać lokalnego serwera deweloperskiego Vite, ale Gateway działa gdzie indziej.

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
    - `token` należy przekazywać przez fragment adresu URL (`#token=...`), gdy tylko jest to możliwe. Fragmenty nie są wysyłane do serwera, co zapobiega wyciekom w logach żądań i Referer. Starsze parametry zapytania `?token=` są nadal jednorazowo importowane dla zgodności, ale tylko jako rozwiązanie awaryjne, i są usuwane natychmiast po inicjalizacji.
    - `password` jest przechowywane tylko w pamięci.
    - Gdy `gatewayUrl` jest ustawione, UI nie wraca do danych uwierzytelniających z konfiguracji ani środowiska. Podaj jawnie `token` (lub `password`). Brak jawnych danych uwierzytelniających jest błędem.
    - Używaj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itd.).
    - `gatewayUrl` jest akceptowane tylko w oknie najwyższego poziomu (nie osadzone), aby zapobiec clickjackingowi.
    - Nielokalne wdrożenia Control UI muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne origins). Obejmuje to zdalne konfiguracje deweloperskie.
    - Start Gateway może zasiać lokalne origins, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, na podstawie efektywnego wiązania i portu runtime, ale origins zdalnych przeglądarek nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanym lokalnym testowaniem. Oznacza to zezwolenie na dowolny origin przeglądarki, a nie „dopasuj dowolny host, którego używam”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb awaryjny origin na podstawie nagłówka Host, ale jest to niebezpieczny tryb bezpieczeństwa.

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
