---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz mieć dostęp przez Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Interfejs sterowania Gateway oparty na przeglądarce (czat, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-04-26T11:44:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a419e627c2b4e18687e946494d170b005102ba242b5f72c03ba0e55de2b8d4b3
    source_path: web/control-ui.md
    workflow: 15
---

Interfejs sterowania to mała jednoplikowa aplikacja **Vite + Lit** serwowana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Komunikuje się **bezpośrednio z WebSocket Gateway** na tym samym porcie.

## Szybkie otwarcie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

Uwierzytelnianie jest dostarczane podczas handshake WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości trusted-proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień dashboardu przechowuje token dla bieżącej sesji karty przeglądarki i wybranego URL gateway; hasła nie są utrwalane. Onboarding zwykle generuje token gateway do uwierzytelniania shared-secret przy pierwszym połączeniu, ale uwierzytelnianie hasłem także działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z interfejsem sterowania z nowej przeglądarki lub nowego urządzenia, Gateway zwykle wymaga **jednorazowego zatwierdzenia parowania**. To środek bezpieczeństwa zapobiegający nieautoryzowanemu dostępowi.

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

Jeśli przeglądarka ponawia próbę parowania ze zmienionymi danymi uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/admin, jest to traktowane jako podniesienie poziomu zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw zachowuje stare zatwierdzenie jako aktywne, blokuje ponowne połączenie z szerszym zakresem i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie jest zapamiętywane i nie wymaga ponownego zatwierdzania, chyba że cofniesz je poleceniem `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby uzyskać informacje o rotacji tokenów i cofnięciu.

<Note>
- Bezpośrednie lokalne połączenia przeglądarki przez loopback (`127.0.0.1` / `localhost`) są automatycznie zatwierdzane.
- Tailscale Serve może pominąć przebieg parowania dla sesji operatora interfejsu sterowania, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie bindowanie Tailnet, połączenia przeglądarki przez LAN i profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikalne ID urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagało ponownego sparowania.

</Note>

## Tożsamość osobista (lokalnie w przeglądarce)

Interfejs sterowania obsługuje osobistą tożsamość przypisaną do przeglądarki (nazwa wyświetlana i awatar), dołączaną do wiadomości wychodzących na potrzeby atrybucji we współdzielonych sesjach. Jest ona przechowywana w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza zwykłymi metadanymi autorstwa w transkrypcie dla wiadomości, które rzeczywiście wyślesz. Wyczyszczenie danych strony lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam lokalny dla przeglądarki wzorzec dotyczy nadpisania awatara asystenta. Wgrane awatary asystenta nakładają się na tożsamość rozwiązaną przez gateway tylko w lokalnej przeglądarce i nigdy nie przechodzą z powrotem przez `config.patch`. Współdzielone pole konfiguracji `ui.assistant.avatar` jest nadal dostępne dla klientów innych niż UI, którzy zapisują to pole bezpośrednio (takich jak skryptowane gatewaye lub niestandardowe dashboardy).

## Punkt końcowy konfiguracji środowiska uruchomieniowego

Interfejs sterowania pobiera ustawienia środowiska uruchomieniowego z `/__openclaw/control-ui-config.json`. Ten punkt końcowy jest chroniony tym samym uwierzytelnianiem gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a pomyślne pobranie wymaga już ważnego tokenu/hasła gateway, tożsamości Tailscale Serve albo tożsamości trusted-proxy.

## Obsługa języków

Interfejs sterowania może lokalizować się przy pierwszym wczytaniu na podstawie ustawień regionalnych przeglądarki. Aby później to nadpisać, otwórz **Overview -> Gateway Access -> Language**. Selektor języka znajduje się na karcie Gateway Access, a nie w sekcji Appearance.

- Obsługiwane ustawienia regionalne: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Tłumaczenia inne niż angielskie są lazy-loaded w przeglądarce.
- Wybrane ustawienie regionalne jest zapisywane w pamięci przeglądarki i używane ponownie przy kolejnych wizytach.
- Brakujące klucze tłumaczeń przechodzą z fallbackiem do angielskiego.

## Co potrafi (obecnie)

<AccordionGroup>
  <Accordion title="Czat i rozmowa">
    - Czat z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Rozmowa z OpenAI Realtime bezpośrednio z przeglądarki przez WebRTC. Gateway generuje krótkotrwały sekret klienta Realtime przez `talk.realtime.session`; przeglądarka wysyła dźwięk z mikrofonu bezpośrednio do OpenAI i przekazuje wywołania narzędzia `openclaw_agent_consult` z powrotem przez `chat.send` do większego skonfigurowanego modelu OpenClaw.
    - Strumieniowanie wywołań narzędzi + karty wyjścia narzędzi na żywo w czacie (zdarzenia agenta).

  </Accordion>
  <Accordion title="Kanały, instancje, sesje, sny">
    - Kanały: status wbudowanych oraz dołączonych/zewnętrznych kanałów pluginów, logowanie QR i konfiguracja per kanał (`channels.status`, `web.login.*`, `config.patch`).
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: lista + nadpisania per sesja dla modelu/myślenia/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sny: status Dreaming, przełącznik włącz/wyłącz oraz czytnik Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, węzły, zatwierdzenia exec">
    - Zadania Cron: lista/dodawanie/edycja/uruchamianie/włączanie/wyłączanie + historia uruchomień (`cron.*`).
    - Skills: status, włączanie/wyłączanie, instalacja, aktualizacje kluczy API (`skills.*`).
    - Węzły: lista + capabilities (`node.list`).
    - Zatwierdzenia exec: edycja allowlist gateway lub węzła + polityka pytania dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Konfiguracja">
    - Wyświetlanie/edycja `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Zastosowanie + restart z walidacją (`config.apply`) oraz wybudzenie ostatniej aktywnej sesji.
    - Zapisy zawierają ochronę base-hash, aby zapobiec nadpisaniu równoległych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wykonują preflight aktywnego rozwiązywania SecretRef dla refów w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane refy są odrzucane przed zapisem.
    - Renderowanie schematu + formularza (`config.schema` / `config.schema.lookup`, w tym pola `title` / `description`, dopasowane wskazówki UI, podsumowania bezpośrednich elementów potomnych, metadane dokumentacji dla zagnieżdżonych węzłów obiektu/wildcard/tablicy/kompozycji oraz schematy pluginów + kanałów, gdy są dostępne); edytor Raw JSON jest dostępny tylko wtedy, gdy snapshot ma bezpieczny round-trip surowych danych.
    - Jeśli snapshot nie może bezpiecznie wykonać round-trip surowego tekstu, interfejs sterowania wymusza tryb formularza i wyłącza tryb Raw dla tego snapshotu.
    - Funkcja „Reset to saved” w edytorze Raw JSON zachowuje kształt utworzony w trybie raw (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczony snapshot, więc zewnętrzne edycje przetrwają reset, gdy snapshot może bezpiecznie wykonać round-trip.
    - Strukturalne wartości obiektowe SecretRef są renderowane jako tylko do odczytu w tekstowych polach formularza, aby zapobiec przypadkowemu uszkodzeniu typu obiekt-na-string.

  </Accordion>
  <Accordion title="Debugowanie, logi, aktualizacja">
    - Debugowanie: snapshoty status/health/models + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Logi: tail na żywo logów plikowych gateway z filtrowaniem/eksportem (`logs.tail`).
    - Aktualizacja: uruchomienie aktualizacji pakietu/git + restart (`update.run`) z raportem restartu.

  </Accordion>
  <Accordion title="Uwagi do panelu zadań Cron">
    - Dla zadań izolowanych sposób dostarczenia domyślnie ogłasza podsumowanie. Możesz przełączyć na none, jeśli chcesz uruchomienia tylko wewnętrzne.
    - Pola kanału/celu pojawiają się po wybraniu announce.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy URL Webhook HTTP(S).
    - Dla zadań sesji głównej dostępne są tryby dostarczania webhook i none.
    - Zaawansowane kontrolki edycji obejmują usuwanie po uruchomieniu, czyszczenie nadpisania agenta, opcje dokładnego/stagger Cron, nadpisania modelu/myślenia agenta oraz przełączniki dostarczania best-effort.
    - Walidacja formularza jest inline z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do momentu naprawy.
    - Ustaw `cron.webhookToken`, aby wysyłać dedykowany token bearer; jeśli jest pominięty, webhook jest wysyłany bez nagłówka uwierzytelniania.
    - Przestarzały fallback: zapisane starsze zadania z `notify: true` nadal mogą używać `cron.webhook`, dopóki nie zostaną zmigrowane.

  </Accordion>
</AccordionGroup>

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: natychmiast potwierdza `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po zakończeniu.
    - Odpowiedzi `chat.history` są ograniczone rozmiarem dla bezpieczeństwa UI. Gdy wpisy transkryptu są zbyt duże, Gateway może obcinać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować zbyt duże wiadomości placeholderem (`[chat.history omitted: message too large]`).
    - Obrazy asystenta/generowane są utrwalane jako zarządzane referencje mediów i odsyłane przez uwierzytelnione URL mediów Gateway, więc ponowne wczytania nie zależą od tego, czy surowe ładunki obrazów base64 pozostaną w odpowiedzi historii czatu.
    - `chat.history` usuwa także z widocznego tekstu asystenta tylko-wyświetlaniowe tagi dyrektyw inline (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), ładunki XML wywołań narzędzi w postaci zwykłego tekstu (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` i obcięte bloki wywołań narzędzi), a także wyciekające tokeny sterujące modelu ASCII/full-width, oraz pomija wpisy asystenta, których cały widoczny tekst to wyłącznie dokładny cichy token `NO_REPLY` / `no_reply`.
    - Podczas aktywnego wysyłania i końcowego odświeżenia historii widok czatu utrzymuje lokalne optymistyczne wiadomości użytkownika/asystenta widoczne, jeśli `chat.history` chwilowo zwraca starszy snapshot; kanoniczny transkrypt zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległość.
    - `chat.inject` dopisuje notatkę asystenta do transkryptu sesji i rozgłasza zdarzenie `chat` na potrzeby aktualizacji tylko UI (bez uruchamiania agenta, bez dostarczania do kanału).
    - Selektory modelu i myślenia w nagłówku czatu natychmiast modyfikują aktywną sesję przez `sessions.patch`; są to trwałe nadpisania sesji, a nie opcje wysyłki tylko na jedną turę.
    - Gdy świeże raporty użycia sesji z Gateway pokazują wysokie ciśnienie kontekstu, obszar tworzenia wiadomości w czacie pokazuje powiadomienie o kontekście i, na zalecanych poziomach Compaction, przycisk kompaktowania uruchamiający normalną ścieżkę Compaction sesji. Nieaktualne snapshoty tokenów są ukrywane, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb rozmowy (WebRTC w przeglądarce)">
    Tryb rozmowy używa zarejestrowanego dostawcy głosu realtime, który obsługuje sesje WebRTC w przeglądarce. Skonfiguruj OpenAI z `talk.provider: "openai"` oraz `talk.providers.openai.apiKey`, albo użyj ponownie konfiguracji dostawcy realtime Voice Call. Przeglądarka nigdy nie otrzymuje standardowego klucza API OpenAI; otrzymuje tylko efemeryczny sekret klienta Realtime. Google Live realtime voice jest obsługiwane dla backendowych mostów Voice Call i Google Meet, ale jeszcze nie dla tej ścieżki WebRTC w przeglądarce. Prompt sesji Realtime jest składany przez Gateway; `talk.realtime.session` nie przyjmuje nadpisań instrukcji dostarczonych przez wywołującego.

    W komponencie tworzenia wiadomości czatu kontrolka Talk to przycisk fal obok przycisku dyktowania mikrofonowego. Gdy Talk się uruchamia, w wierszu statusu komponowania pojawia się `Connecting Talk...`, potem `Talk live`, gdy audio jest połączone, albo `Asking OpenClaw...`, gdy wywołanie narzędzia realtime konsultuje większy skonfigurowany model OpenClaw przez `chat.send`.

  </Accordion>
  <Accordion title="Zatrzymanie i przerwanie">
    - Kliknij **Stop** (wywołuje `chat.abort`).
    - Gdy przebieg jest aktywny, zwykłe wiadomości uzupełniające trafiają do kolejki. Kliknij **Steer** przy wiadomości w kolejce, aby wstrzyknąć tę wiadomość uzupełniającą do bieżącej tury.
    - Wpisz `/stop` (lub samodzielne frazy przerywające, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne przebiegi dla tej sesji.

  </Accordion>
  <Accordion title="Zachowanie częściowego wyniku po przerwaniu">
    - Gdy przebieg zostanie przerwany, częściowy tekst asystenta nadal może być wyświetlany w UI.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkryptu, gdy istnieje zbuforowane wyjście.
    - Utrwalone wpisy zawierają metadane przerwania, dzięki czemu konsumenci transkryptu mogą odróżnić częściowe wyniki po przerwaniu od zwykłego pełnego wyniku.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i Web Push

Interfejs sterowania dostarcza `manifest.webmanifest` i service worker, więc nowoczesne przeglądarki mogą instalować go jako samodzielne PWA. Web Push pozwala Gateway wybudzić zainstalowane PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie są otwarte.

| Powierzchnia                                          | Co robi                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują „Install app”, gdy tylko będzie osiągalna. |
| `ui/public/sw.js`                                     | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw)    | Automatycznie generowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone punkty końcowe subskrypcji przeglądarki.                 |

Nadpisz parę kluczy VAPID przez zmienne środowiskowe w procesie Gateway, jeśli chcesz przypiąć klucze (dla wdrożeń wielohostowych, rotacji sekretów lub testów):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (domyślnie `mailto:openclaw@localhost`)

Interfejs sterowania używa tych metod Gateway ograniczanych zakresem do rejestrowania i testowania subskrypcji przeglądarki:

- `push.web.vapidPublicKey` — pobiera aktywny klucz publiczny VAPID.
- `push.web.subscribe` — rejestruje `endpoint` oraz `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — usuwa zarejestrowany punkt końcowy.
- `push.web.test` — wysyła testowe powiadomienie do subskrypcji wywołującego.

<Note>
Web Push działa niezależnie od ścieżki przekaźnika iOS APNS (zobacz [Konfiguracja](/pl/gateway/configuration), aby poznać push oparty na przekaźniku) oraz istniejącej metody `push.test`, które są przeznaczone dla natywnego parowania mobilnego.
</Note>

## Osadzanie hostowane

Wiadomości asystenta mogą renderować hostowane treści internetowe inline za pomocą shortcode `[embed ...]`. Polityka sandbox iframe jest kontrolowana przez `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (default)">
    Umożliwia interaktywne osadzenia przy zachowaniu izolacji origin; to ustawienie domyślne i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
  </Tab>
  <Tab title="trusted">
    Dodaje `allow-same-origin` oprócz `allow-scripts` dla dokumentów z tej samej witryny, które celowo wymagają silniejszych uprawnień.
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście wymaga zachowania same-origin. Dla większości gier generowanych przez agenta i interaktywnych canvasów bezpieczniejszym wyborem jest `scripts`.
</Warning>

Bezwzględne zewnętrzne URL-e osadzeń `http(s)` pozostają domyślnie blokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` ładowało strony firm trzecich, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

## Dostęp przez Tailnet (zalecany)

<Tabs>
  <Tab title="Zintegrowane Tailscale Serve (preferowane)">
    Utrzymaj Gateway na loopback i pozwól, by Tailscale Serve proxy’owało go przez HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (lub skonfigurowany `gateway.controlUi.basePath`)

    Domyślnie żądania Serve interfejsu sterowania/WebSocket mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` przez `tailscale whois` i dopasowując go do nagłówka, a także akceptuje je tylko wtedy, gdy żądanie trafia na loopback z nagłówkami `x-forwarded-*` Tailscale. Dla sesji operatora interfejsu sterowania z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija też przebieg parowania urządzenia; przeglądarki bez tożsamości urządzenia i połączenia w roli węzła nadal przechodzą zwykłe kontrole urządzeń. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń shared-secret nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` lub `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia dla tego samego IP klienta i zakresu uwierzytelnienia są serializowane przed zapisami ograniczania szybkości. Równoczesne błędne ponowienia z tej samej przeglądarki mogą więc przy drugim żądaniu pokazać `retry later` zamiast dwóch zwykłych niedopasowań ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokena zakłada, że host gateway jest zaufany. Jeśli na tym hoście może działać niezaufany kod lokalny, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Powiązanie z tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (lub skonfigurowany `gateway.controlUi.basePath`)

    Wklej pasujący shared secret do ustawień UI (wysyłany jako `connect.params.auth.token` lub `connect.params.auth.password`).

  </Tab>
</Tabs>

## Niezabezpieczone HTTP

Jeśli otwierasz dashboard przez zwykłe HTTP (`http://<lan-ip>` lub `http://<tailscale-ip>`), przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie OpenClaw **blokuje** połączenia interfejsu sterowania bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność localhost-only dla niezabezpieczonego HTTP z `gateway.controlUi.allowInsecureAuth=true`
- pomyślne uwierzytelnienie operatora interfejsu sterowania przez `gateway.auth.mode: "trusted-proxy"`
- tryb awaryjny `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana poprawka:** użyj HTTPS (Tailscale Serve) albo otwórz UI lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście gateway)

<AccordionGroup>
  <Accordion title="Zachowanie przełącznika allowInsecureAuth">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` to tylko lokalny przełącznik zgodności:

    - Pozwala sesjom interfejsu sterowania localhost działać bez tożsamości urządzenia w niezabezpieczonych kontekstach HTTP.
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
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzeń interfejsu sterowania i stanowi poważne obniżenie poziomu bezpieczeństwa. Po użyciu awaryjnym szybko cofnij tę zmianę.
    </Warning>

  </Accordion>
  <Accordion title="Uwaga o trusted-proxy">
    - Pomyślne uwierzytelnienie trusted-proxy może dopuścić sesje **operatora** interfejsu sterowania bez tożsamości urządzenia.
    - To **nie** rozszerza się na sesje interfejsu sterowania w roli węzła.
    - Reverse proxy loopback na tym samym hoście nadal nie spełniają wymagań uwierzytelniania trusted-proxy; zobacz [Uwierzytelnianie trusted-proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki dotyczące konfiguracji HTTPS.

## Content Security Policy

Interfejs sterowania jest dostarczany z restrykcyjną polityką `img-src`: dozwolone są tylko zasoby **same-origin**, URL-e `data:` oraz lokalnie generowane URL-e `blob:`. Zdalne URL-e obrazów `http(s)` i względne względem protokołu są odrzucane przez przeglądarkę i nie powodują żądań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal są renderowane, w tym uwierzytelnione trasy awatarów, które UI pobiera i zamienia na lokalne URL-e `blob:`.
- Inline URL-e `data:image/...` nadal są renderowane (przydatne dla ładunków w protokole).
- Lokalne URL-e `blob:` utworzone przez interfejs sterowania nadal są renderowane.
- Zdalne URL-e awatarów emitowane przez metadane kanałów są usuwane w helperach awatarów interfejsu sterowania i zastępowane wbudowanym logo/identyfikatorem, dzięki czemu naruszony lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz nic zmieniać, aby uzyskać to zachowanie — jest ono zawsze włączone i nie można go konfigurować.

## Uwierzytelnianie trasy awatara

Gdy skonfigurowano uwierzytelnianie gateway, punkt końcowy awatara interfejsu sterowania wymaga tego samego tokenu gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara na tej samej zasadzie.
- Nieuwierzytelnione żądania do obu tras są odrzucane (zgodnie z siostrzaną trasą mediów asystenta). Zapobiega to wyciekowi tożsamości agenta przez trasę awatara na hostach, które poza tym są chronione.
- Sam interfejs sterowania przekazuje token gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych URL-i blob, dzięki czemu obraz nadal renderuje się w dashboardach.

Jeśli wyłączysz uwierzytelnianie gateway (niezalecane na hostach współdzielonych), trasa awatara również stanie się nieuwierzytelniona, zgodnie z resztą gateway.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je poleceniem:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz stałych URL-i zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do lokalnego developmentu (oddzielny serwer developerski):

```bash
pnpm ui:dev
```

Następnie skieruj UI na URL WebSocket swojego Gateway (np. `ws://127.0.0.1:18789`).

## Debugowanie/testowanie: serwer developerski + zdalny Gateway

Interfejs sterowania to pliki statyczne; docelowy WebSocket jest konfigurowalny i może różnić się od HTTP origin. Jest to przydatne, gdy chcesz używać lokalnie serwera developerskiego Vite, ale Gateway działa gdzie indziej.

<Steps>
  <Step title="Uruchom serwer developerski UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Otwórz z gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
    ```

    Opcjonalne jednorazowe uwierzytelnienie (jeśli potrzebne):

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uwagi">
    - `gatewayUrl` jest zapisywany w `localStorage` po załadowaniu i usuwany z URL.
    - `token` powinien być przekazywany przez fragment URL (`#token=...`) wszędzie tam, gdzie to możliwe. Fragmenty nie są wysyłane do serwera, co zapobiega wyciekom w logach żądań i przez Referer. Starsze parametry query `?token=` są nadal jednorazowo importowane dla zgodności, ale tylko jako fallback, i są usuwane natychmiast po bootstrapie.
    - `password` jest przechowywane tylko w pamięci.
    - Gdy ustawiono `gatewayUrl`, UI nie przechodzi z fallbackiem do poświadczeń z konfiguracji ani środowiska. Podaj jawnie `token` (lub `password`). Brak jawnych poświadczeń jest błędem.
    - Używaj `wss://`, gdy Gateway działa za TLS (Tailscale Serve, proxy HTTPS itp.).
    - `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
    - Wdrożenia interfejsu sterowania poza loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne originy). Obejmuje to także zdalne konfiguracje deweloperskie.
    - Uruchomienie Gateway może zasilić lokalne originy, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, na podstawie efektywnego runtime bind i portu, ale zdalne originy przeglądarki nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]`, chyba że do ściśle kontrolowanych testów lokalnych. Oznacza to dopuszczenie dowolnego originu przeglądarki, a nie „dopasuj dowolny host, którego używam”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb fallbacku origin oparty na nagłówku Host, ale jest to niebezpieczny tryb bezpieczeństwa.

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
- [Health Checks](/pl/gateway/health) — monitorowanie stanu gateway
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [WebChat](/pl/web/webchat) — interfejs czatu oparty na przeglądarce
