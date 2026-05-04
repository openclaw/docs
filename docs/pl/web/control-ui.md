---
read_when:
    - Chcesz obsługiwać Gateway z przeglądarki
    - Chcesz mieć dostęp do Tailnet bez tuneli SSH
sidebarTitle: Control UI
summary: Interfejs sterowania działający w przeglądarce dla Gateway (czat, węzły, konfiguracja)
title: Interfejs sterowania
x-i18n:
    generated_at: "2026-05-04T07:06:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07fbbe1c7fec5f67a04a231e02bdf0f7d16be9c5fe188915674d71fcd69002a5
    source_path: web/control-ui.md
    workflow: 16
---

Interfejs Control UI to mała jednostronicowa aplikacja **Vite + Lit** serwowana przez Gateway:

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

Gdy łączysz się z Control UI z nowej przeglądarki lub urządzenia, Gateway zwykle wymaga **jednorazowego zatwierdzenia parowania**. To środek bezpieczeństwa zapobiegający nieautoryzowanemu dostępowi.

**Co zobaczysz:** "disconnected (1008): pairing required"

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

Jeśli przeglądarka ponawia parowanie ze zmienionymi szczegółami uwierzytelniania (rola/zakresy/klucz publiczny), poprzednie oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz jej dostęp z odczytu na zapis/administrację, jest to traktowane jako podniesienie poziomu zatwierdzenia, a nie ciche ponowne połączenie. OpenClaw utrzymuje stare zatwierdzenie jako aktywne, blokuje ponowne połączenie z szerszymi uprawnieniami i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie jest zapamiętywane i nie będzie wymagać ponownego zatwierdzenia, chyba że unieważnisz je poleceniem `openclaw devices revoke --device <id> --role <role>`. Zobacz [CLI urządzeń](/pl/cli/devices), aby poznać rotację i unieważnianie tokenów.

<Note>
- Bezpośrednie połączenia przeglądarki przez local loopback (`127.0.0.1` / `localhost`) są zatwierdzane automatycznie.
- Tailscale Serve może pominąć rundę parowania dla sesji operatora Control UI, gdy `gateway.auth.allowTailscale: true`, tożsamość Tailscale zostanie zweryfikowana, a przeglądarka przedstawi swoją tożsamość urządzenia.
- Bezpośrednie powiązania Tailnet, połączenia przeglądarki z sieci LAN oraz profile przeglądarki bez tożsamości urządzenia nadal wymagają jawnego zatwierdzenia.
- Każdy profil przeglądarki generuje unikalny identyfikator urządzenia, więc zmiana przeglądarki lub wyczyszczenie danych przeglądarki będzie wymagać ponownego parowania.

</Note>

## Tożsamość osobista (lokalna dla przeglądarki)

Control UI obsługuje osobistą tożsamość per przeglądarka (nazwa wyświetlana i avatar), dołączaną do wiadomości wychodzących na potrzeby przypisania autorstwa we współdzielonych sesjach. Znajduje się w pamięci przeglądarki, jest ograniczona do bieżącego profilu przeglądarki i nie jest synchronizowana z innymi urządzeniami ani utrwalana po stronie serwera poza zwykłymi metadanymi autorstwa transkryptu dla wiadomości, które faktycznie wysyłasz. Wyczyszczenie danych witryny lub zmiana przeglądarki resetuje ją do pustej wartości.

Ten sam wzorzec lokalny dla przeglądarki dotyczy nadpisania avatara asystenta. Przesłane avatary asystenta nakładają lokalnie w przeglądarce tożsamość rozwiązaną przez gateway i nigdy nie wykonują rundy przez `config.patch`. Wspólne pole konfiguracji `ui.assistant.avatar` pozostaje dostępne dla klientów innych niż UI, którzy zapisują to pole bezpośrednio (takich jak skryptowane gateway lub niestandardowe pulpity).

## Punkt końcowy konfiguracji runtime

Control UI pobiera swoje ustawienia runtime z `/__openclaw/control-ui-config.json`. Ten punkt końcowy jest chroniony tym samym uwierzytelnianiem gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać, a pomyślne pobranie wymaga już ważnego tokenu/hasła gateway, tożsamości Tailscale Serve albo tożsamości zaufanego proxy.

## Obsługa języków

Control UI może zlokalizować się przy pierwszym ładowaniu na podstawie ustawień regionalnych przeglądarki. Aby później to nadpisać, otwórz **Overview -> Gateway Access -> Language**. Selektor ustawień regionalnych znajduje się w karcie Gateway Access, a nie w Appearance.

- Obsługiwane ustawienia regionalne: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Tłumaczenia inne niż angielskie są leniwie ładowane w przeglądarce.
- Wybrane ustawienia regionalne są zapisywane w pamięci przeglądarki i używane ponownie podczas przyszłych wizyt.
- Brakujące klucze tłumaczeń wracają do języka angielskiego.

Tłumaczenia dokumentacji są generowane dla tego samego zestawu ustawień regionalnych innych niż angielskie, ale wbudowany selektor języka witryny dokumentacji Mintlify jest ograniczony do kodów ustawień regionalnych akceptowanych przez Mintlify. Dokumentacja tajska (`th`) i perska (`fa`) nadal jest generowana w repozytorium publikacji; może nie pojawiać się w tym selektorze, dopóki Mintlify nie obsłuży tych kodów.

## Motywy wyglądu

Panel Appearance zachowuje wbudowane motywy Claw, Knot i Dash oraz jedno lokalne dla przeglądarki miejsce importu tweakcn. Aby zaimportować motyw, otwórz [edytor tweakcn](https://tweakcn.com/editor/theme), wybierz lub utwórz motyw, kliknij **Share** i wklej skopiowany link motywu do Appearance. Importer akceptuje także adresy URL rejestru `https://tweakcn.com/r/themes/<id>`, adresy URL edytora takie jak `https://tweakcn.com/editor/theme?theme=amethyst-haze`, ścieżki względne `/themes/<id>`, surowe identyfikatory motywów oraz domyślne nazwy motywów, takie jak `amethyst-haze`.

Zaimportowane motywy są przechowywane tylko w bieżącym profilu przeglądarki. Nie są zapisywane w konfiguracji gateway i nie synchronizują się między urządzeniami. Zastąpienie zaimportowanego motywu aktualizuje jedno lokalne miejsce; wyczyszczenie go przełącza aktywny motyw z powrotem na Claw, jeśli zaimportowany motyw był wybrany.

## Co potrafi robić (dzisiaj)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Czatuj z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Rozmawiaj przez sesje czasu rzeczywistego w przeglądarce. OpenAI używa bezpośredniego WebRTC, Google Live używa ograniczonego, jednorazowego tokenu przeglądarki przez WebSocket, a Plugin głosu czasu rzeczywistego działające wyłącznie po stronie backendu używają transportu przekaźnikowego Gateway. Przekaźnik utrzymuje poświadczenia dostawcy na Gateway, podczas gdy przeglądarka strumieniuje PCM z mikrofonu przez RPC `talk.realtime.relay*` i wysyła wywołania narzędzia `openclaw_agent_consult` z powrotem przez `chat.send` dla większego skonfigurowanego modelu OpenClaw.
    - Strumieniuj wywołania narzędzi oraz karty wyjścia narzędzi na żywo w czacie (zdarzenia agenta).

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Kanały: wbudowane oraz dołączone/zewnętrzne kanały Plugin, status, logowanie QR i konfiguracja per kanał (`channels.status`, `web.login.*`, `config.patch`).
    - Instancje: lista obecności + odświeżanie (`system-presence`).
    - Sesje: lista + nadpisania modelu/myślenia/trybu szybkiego/szczegółowości/śledzenia/rozumowania per sesja (`sessions.list`, `sessions.patch`).
    - Dreams: status Dreaming, przełącznik włącz/wyłącz oraz czytnik Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Zadania Cron: lista/dodaj/edytuj/uruchom/włącz/wyłącz + historia uruchomień (`cron.*`).
    - Skills: status, włączanie/wyłączanie, instalacja, aktualizacje klucza API (`skills.*`).
    - Node: lista + możliwości (`node.list`).
    - Zatwierdzenia exec: edytuj listy dozwolonych elementów gateway lub Node + politykę pytań dla `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Wyświetlaj/edytuj `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Zastosuj + uruchom ponownie z walidacją (`config.apply`) i wybudź ostatnią aktywną sesję.
    - Zapisy obejmują strażnika skrótu bazowego, aby zapobiec nadpisaniu równoczesnych edycji.
    - Zapisy (`config.set`/`config.apply`/`config.patch`) wykonują wstępne rozwiązanie aktywnych SecretRef dla referencji w przesłanym ładunku konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem.
    - Schemat + renderowanie formularza (`config.schema` / `config.schema.lookup`, w tym pola `title` / `description`, dopasowane wskazówki UI, natychmiastowe podsumowania dzieci, metadane dokumentacji na zagnieżdżonych węzłach obiektów/wieloznaczników/tablic/kompozycji oraz schematy Plugin + kanałów, gdy są dostępne); edytor surowego JSON jest dostępny tylko wtedy, gdy migawka ma bezpieczną surową rundę zapisu i odczytu.
    - Jeśli migawka nie może bezpiecznie wykonać surowej rundy zapisu i odczytu tekstu, Control UI wymusza tryb Form i wyłącza tryb Raw dla tej migawki.
    - Edytor surowego JSON "Reset to saved" zachowuje kształt utworzony w surowym widoku (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczoną migawkę, dzięki czemu zewnętrzne edycje przetrwają reset, gdy migawka może bezpiecznie wykonać rundę zapisu i odczytu.
    - Ustrukturyzowane wartości obiektów SecretRef są renderowane w tekstowych polach formularza jako tylko do odczytu, aby zapobiec przypadkowemu uszkodzeniu przez konwersję obiektu na ciąg znaków.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debugowanie: migawki statusu/kondycji/modeli + dziennik zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`).
    - Logi: ogon na żywo logów plików gateway z filtrem/eksportem (`logs.tail`).
    - Aktualizacja: uruchom aktualizację pakietu/git + restart (`update.run`) z raportem restartu, a potem odpytuj `update.status` po ponownym połączeniu, aby zweryfikować uruchomioną wersję gateway.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Dla zadań izolowanych domyślną dostawą jest ogłoszenie podsumowania. Możesz przełączyć na brak, jeśli chcesz uruchomienia wyłącznie wewnętrzne.
    - Pola kanału/celu pojawiają się, gdy wybrano ogłoszenie.
    - Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy adres URL Webhook HTTP(S).
    - Dla zadań głównej sesji dostępne są tryby dostawy Webhook i brak.
    - Zaawansowane kontrolki edycji obejmują usuń po uruchomieniu, wyczyszczenie nadpisania agenta, opcje dokładnego/rozłożonego Cron, nadpisania modelu/myślenia agenta oraz przełączniki dostawy w trybie najlepszych starań.
    - Walidacja formularza jest wbudowana z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu naprawy.
    - Ustaw `cron.webhookToken`, aby wysłać dedykowany token bearer; jeśli zostanie pominięty, Webhook jest wysyłany bez nagłówka uwierzytelniania.
    - Przestarzały fallback: przechowywane starsze zadania z `notify: true` mogą nadal używać `cron.webhook`, dopóki nie zostaną zmigrowane.

  </Accordion>
</AccordionGroup>

## Zachowanie czatu

<AccordionGroup>
  <Accordion title="Semantyka wysyłania i historii">
    - `chat.send` jest **nieblokujące**: potwierdza natychmiast wartością `{ runId, status: "started" }`, a odpowiedź jest przesyłana strumieniowo przez zdarzenia `chat`.
    - Przesyłanie plików na czacie akceptuje obrazy oraz pliki inne niż wideo. Obrazy zachowują natywną ścieżkę obrazu; pozostałe pliki są przechowywane jako zarządzane multimedia i pokazywane w historii jako linki załączników.
    - Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po zakończeniu.
    - Odpowiedzi `chat.history` mają ograniczony rozmiar dla bezpieczeństwa UI. Gdy wpisy transkrypcji są zbyt duże, Gateway może skrócić długie pola tekstowe, pominąć ciężkie bloki metadanych i zastąpić nadmiernie duże wiadomości symbolem zastępczym (`[chat.history omitted: message too large]`).
    - Obrazy asystenta/wygenerowane są utrwalane jako odwołania do zarządzanych multimediów i zwracane przez uwierzytelnione adresy URL multimediów Gateway, więc ponowne wczytania nie zależą od pozostawania surowych ładunków obrazów base64 w odpowiedzi historii czatu.
    - `chat.history` usuwa też z widocznego tekstu asystenta wyłącznie prezentacyjne wbudowane znaczniki dyrektyw (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), zwykłotekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz skrócone bloki wywołań narzędzi), a także ujawnione tokeny sterujące modelu ASCII/pełnej szerokości, oraz pomija wpisy asystenta, których cały widoczny tekst jest tylko dokładnym cichym tokenem `NO_REPLY` / `no_reply`.
    - Podczas aktywnego wysyłania i końcowego odświeżania historii widok czatu utrzymuje widoczne lokalne optymistyczne wiadomości użytkownika/asystenta, jeśli `chat.history` na krótko zwróci starszy migawkowy stan; kanoniczna transkrypcja zastępuje te lokalne wiadomości, gdy historia Gateway nadrobi zaległości.
    - Zdarzenia `chat` na żywo są stanem dostarczenia, natomiast `chat.history` jest odbudowywane z trwałej transkrypcji sesji. Po zdarzeniach końcowych narzędzi Control UI ponownie wczytuje historię i scala tylko mały optymistyczny ogon; granica transkrypcji jest udokumentowana w [WebChat](/pl/web/webchat).
    - `chat.inject` dodaje notatkę asystenta do transkrypcji sesji i rozgłasza zdarzenie `chat` dla aktualizacji wyłącznie w UI (bez uruchomienia agenta, bez dostarczenia kanałowego).
    - Selektory modelu i myślenia w nagłówku czatu natychmiast aktualizują aktywną sesję przez `sessions.patch`; są trwałymi nadpisaniami sesji, a nie opcjami wysyłki tylko dla jednej tury.
    - Wpisanie `/new` w Control UI tworzy i przełącza na tę samą świeżą sesję pulpitu co Nowy czat. Wpisanie `/reset` zachowuje jawne resetowanie w miejscu Gateway dla bieżącej sesji.
    - Selektor modelu czatu żąda skonfigurowanego widoku modeli Gateway. Jeśli obecne jest `agents.defaults.models`, ta lista dozwolonych steruje selektorem. W przeciwnym razie selektor pokazuje jawne wpisy `models.providers.*.models` oraz dostawców z użytecznym uwierzytelnieniem. Pełny katalog pozostaje dostępny przez debugujące RPC `models.list` z `view: "all"`.
    - Gdy świeże raporty użycia sesji Gateway wskazują wysoką presję kontekstu, obszar kompozytora czatu pokazuje informację o kontekście, a przy zalecanych poziomach Compaction także przycisk kompaktowania uruchamiający normalną ścieżkę Compaction sesji. Nieaktualne migawki tokenów są ukrywane, dopóki Gateway ponownie nie zgłosi świeżego użycia.

  </Accordion>
  <Accordion title="Tryb rozmowy (czas rzeczywisty w przeglądarce)">
    Tryb rozmowy używa zarejestrowanego dostawcy głosu w czasie rzeczywistym. Skonfiguruj OpenAI za pomocą `talk.provider: "openai"` oraz `talk.providers.openai.apiKey` albo skonfiguruj Google za pomocą `talk.provider: "google"` oraz `talk.providers.google.apiKey`; konfigurację dostawcy czasu rzeczywistego połączeń głosowych nadal można ponownie wykorzystać jako opcję awaryjną. Przeglądarka nigdy nie otrzymuje standardowego klucza API dostawcy. OpenAI otrzymuje efemeryczny sekret klienta Realtime dla WebRTC. Google Live otrzymuje jednorazowy ograniczony token uwierzytelniania Live API dla sesji WebSocket w przeglądarce, z instrukcjami i deklaracjami narzędzi zablokowanymi w tokenie przez Gateway. Dostawcy, którzy udostępniają tylko backendowy most czasu rzeczywistego, działają przez transport przekaźnika Gateway, więc poświadczenia i gniazda dostawców pozostają po stronie serwera, podczas gdy dźwięk przeglądarki przechodzi przez uwierzytelnione RPC Gateway. Prompt sesji Realtime jest składany przez Gateway; `talk.realtime.session` nie akceptuje nadpisań instrukcji dostarczanych przez wywołującego.

    W kompozytorze czatu element sterujący rozmową to przycisk fal obok przycisku dyktowania mikrofonem. Po rozpoczęciu rozmowy wiersz statusu kompozytora pokazuje `Connecting Talk...`, potem `Talk live`, gdy dźwięk jest połączony, albo `Asking OpenClaw...`, gdy wywołanie narzędzia czasu rzeczywistego konsultuje się ze skonfigurowanym większym modelem przez `chat.send`.

    Dymny test na żywo dla opiekunów: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` weryfikuje wymianę SDP WebRTC przeglądarki OpenAI, konfigurację ograniczonego tokena Google Live dla WebSocket w przeglądarce oraz adapter przeglądarkowy przekaźnika Gateway z fałszywymi multimediami mikrofonu. Polecenie wypisuje tylko status dostawcy i nie loguje sekretów.

  </Accordion>
  <Accordion title="Zatrzymanie i przerwanie">
    - Kliknij **Zatrzymaj** (wywołuje `chat.abort`).
    - Gdy uruchomienie jest aktywne, zwykłe odpowiedzi uzupełniające trafiają do kolejki. Kliknij **Steruj** przy wiadomości w kolejce, aby wstrzyknąć tę odpowiedź uzupełniającą do trwającej tury.
    - Wpisz `/stop` (lub samodzielne frazy przerwania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza głównym kanałem.
    - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne uruchomienia dla tej sesji.

  </Accordion>
  <Accordion title="Zachowywanie części po przerwaniu">
    - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta nadal może być pokazany w UI.
    - Gateway utrwala przerwany częściowy tekst asystenta w historii transkrypcji, gdy istnieje zbuforowane wyjście.
    - Utrwalone wpisy zawierają metadane przerwania, aby konsumenci transkrypcji mogli odróżnić części po przerwaniu od normalnego wyjścia zakończenia.

  </Accordion>
</AccordionGroup>

## Instalacja PWA i Web Push

Control UI zawiera `manifest.webmanifest` i service worker, więc nowoczesne przeglądarki mogą zainstalować go jako samodzielną PWA. Web Push pozwala Gateway wybudzać zainstalowaną PWA powiadomieniami nawet wtedy, gdy karta lub okno przeglądarki nie jest otwarte.

| Powierzchnia                                          | Co robi                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Przeglądarki oferują „Zainstaluj aplikację”, gdy jest osiągalny. |
| `ui/public/sw.js`                                     | Service worker obsługujący zdarzenia `push` i kliknięcia powiadomień. |
| `push/vapid-keys.json` (w katalogu stanu OpenClaw)    | Automatycznie wygenerowana para kluczy VAPID używana do podpisywania ładunków Web Push. |
| `push/web-push-subscriptions.json`                    | Utrwalone punkty końcowe subskrypcji przeglądarki.                 |

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
Web Push jest niezależny od ścieżki przekaźnika APNS iOS (zobacz [Konfigurację](/pl/gateway/configuration) dla powiadomień push wspieranych przekaźnikiem) oraz od istniejącej metody `push.test`, które są kierowane do natywnego parowania mobilnego.
</Note>

## Osadzenia hostowane

Wiadomości asystenta mogą renderować hostowaną zawartość webową wbudowaną za pomocą shortcode'u `[embed ...]`. Polityką piaskownicy iframe steruje `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Wyłącza wykonywanie skryptów wewnątrz hostowanych osadzeń.
  </Tab>
  <Tab title="scripts (domyślne)">
    Zezwala na interaktywne osadzenia, zachowując izolację pochodzenia; jest to wartość domyślna i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych.
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
Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście potrzebuje zachowania tego samego pochodzenia. Dla większości gier generowanych przez agentów i interaktywnych płócien `scripts` jest bezpieczniejszym wyborem.
</Warning>

Bezwzględne zewnętrzne adresy URL osadzeń `http(s)` pozostają domyślnie blokowane. Jeśli celowo chcesz, aby `[embed url="https://..."]` wczytywał strony firm trzecich, ustaw `gateway.controlUi.allowExternalEmbedUrls: true`.

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

## Dostęp tailnet (zalecane)

<Tabs>
  <Tab title="Zintegrowane Tailscale Serve (preferowane)">
    Pozostaw Gateway na local loopback i pozwól Tailscale Serve pośredniczyć z HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Otwórz:

    - `https://<magicdns>/` (lub skonfigurowany `gateway.controlUi.basePath`)

    Domyślnie żądania Serve Control UI/WebSocket mogą uwierzytelniać się przez nagłówki tożsamości Tailscale (`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` za pomocą `tailscale whois` i dopasowując go do nagłówka, oraz akceptuje je tylko wtedy, gdy żądanie trafia na local loopback z nagłówkami `x-forwarded-*` Tailscale. Dla sesji operatora Control UI z tożsamością urządzenia przeglądarki ta zweryfikowana ścieżka Serve pomija też rundę parowania urządzenia; przeglądarki bez urządzenia i połączenia w roli węzła nadal przechodzą normalne sprawdzenia urządzenia. Ustaw `gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń wspólnego sekretu nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` lub `"password"`.

    Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia dla tego samego adresu IP klienta i zakresu uwierzytelniania są serializowane przed zapisami limitu szybkości. Współbieżne błędne ponowienia z tej samej przeglądarki mogą więc pokazać `retry later` przy drugim żądaniu zamiast dwóch zwykłych niedopasowań ścigających się równolegle.

    <Warning>
    Uwierzytelnianie Serve bez tokena zakłada, że host gatewaya jest zaufany. Jeśli na tym hoście może działać niezaufany kod lokalny, wymagaj uwierzytelniania tokenem/hasłem.
    </Warning>

  </Tab>
  <Tab title="Powiązanie z tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Następnie otwórz:

    - `http://<tailscale-ip>:18789/` (lub skonfigurowany `gateway.controlUi.basePath`)

    Wklej pasujący wspólny sekret w ustawieniach UI (wysyłany jako `connect.params.auth.token` lub `connect.params.auth.password`).

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
    - Nie rozluźnia wymagań dotyczących tożsamości urządzenia zdalnego (spoza localhost).

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
    `dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia w Control UI i jest poważnym obniżeniem poziomu zabezpieczeń. Cofnij tę zmianę szybko po użyciu awaryjnym.
    </Warning>

  </Accordion>
  <Accordion title="Uwaga o zaufanym proxy">
    - Pomyślne uwierzytelnianie przez zaufane proxy może dopuścić sesje **operatora** Control UI bez tożsamości urządzenia.
    - Nie obejmuje to sesji Control UI z rolą węzła.
    - Zwrotne proxy loopback na tym samym hoście nadal nie spełniają wymagań uwierzytelniania zaufanego proxy; zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zobacz [Tailscale](/pl/gateway/tailscale), aby uzyskać wskazówki dotyczące konfiguracji HTTPS.

## Zasady bezpieczeństwa treści

Control UI jest dostarczany ze ścisłą polityką `img-src`: dozwolone są tylko zasoby **z tego samego źródła**, adresy URL `data:` i lokalnie wygenerowane adresy URL `blob:`. Zdalne adresy URL obrazów `http(s)` i względne względem protokołu są odrzucane przez przeglądarkę i nie powodują wysyłania żądań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal się renderują, w tym uwierzytelnione trasy awatarów, które UI pobiera i konwertuje na lokalne adresy URL `blob:`.
- Wbudowane adresy URL `data:image/...` nadal się renderują (przydatne dla ładunków w protokole).
- Lokalne adresy URL `blob:` utworzone przez Control UI nadal się renderują.
- Zdalne adresy URL awatarów emitowane przez metadane kanałów są usuwane przez pomocnicze funkcje awatarów Control UI i zastępowane wbudowanym logo/odznaką, więc przejęty lub złośliwy kanał nie może wymusić dowolnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz niczego zmieniać, aby uzyskać to zachowanie — jest ono zawsze włączone i nie można go konfigurować.

## Uwierzytelnianie trasy awatarów

Gdy uwierzytelnianie gateway jest skonfigurowane, punkt końcowy awatarów Control UI wymaga tego samego tokenu gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awatara tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awatara na tej samej zasadzie.
- Nieuwierzytelnione żądania do dowolnej z tych tras są odrzucane (tak jak w siostrzanej trasie assistant-media). Zapobiega to ujawnianiu tożsamości agenta przez trasę awatara na hostach, które poza tym są chronione.
- Sam Control UI przekazuje token gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych adresów URL blob, dzięki czemu obraz nadal renderuje się w dashboardach.

Jeśli wyłączysz uwierzytelnianie gateway (niezalecane na hostach współdzielonych), trasa awatara również staje się nieuwierzytelniona, zgodnie z resztą gateway.

## Uwierzytelnianie trasy multimediów asystenta

Gdy uwierzytelnianie gateway jest skonfigurowane, lokalne podglądy multimediów asystenta używają dwuetapowej trasy:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` wymaga standardowego uwierzytelniania operatora Control UI. Przeglądarka wysyła token gateway jako nagłówek bearer podczas sprawdzania dostępności.
- Pomyślne odpowiedzi metadanych zawierają krótkotrwały `mediaTicket` ograniczony do dokładnie tej ścieżki źródłowej.
- Renderowane przez przeglądarkę adresy URL obrazów, audio, wideo i dokumentów używają `mediaTicket=<ticket>` zamiast aktywnego tokenu lub hasła gateway. Bilet szybko wygasa i nie może autoryzować innego źródła.

Dzięki temu zwykłe renderowanie multimediów pozostaje zgodne z natywnymi elementami multimedialnymi przeglądarki bez umieszczania wielokrotnego użytku poświadczeń gateway w widocznych adresach URL multimediów.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je poleceniem:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz stałych adresów URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do lokalnego programowania (osobny serwer deweloperski):

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

    Opcjonalne jednorazowe uwierzytelnianie (jeśli potrzebne):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uwagi">
    - `gatewayUrl` jest zapisywany w localStorage po wczytaniu i usuwany z adresu URL.
    - Jeśli przekazujesz pełny punkt końcowy `ws://` lub `wss://` przez `gatewayUrl`, zakoduj wartość `gatewayUrl` w URL, aby przeglądarka poprawnie sparsowała ciąg zapytania.
    - `token` należy przekazywać przez fragment adresu URL (`#token=...`), gdy tylko to możliwe. Fragmenty nie są wysyłane do serwera, co pozwala uniknąć wycieku w logach żądań i nagłówku Referer. Starsze parametry zapytania `?token=` nadal są importowane jednorazowo dla zgodności, ale tylko jako rozwiązanie awaryjne, i są usuwane natychmiast po bootstrapie.
    - `password` jest przechowywane wyłącznie w pamięci.
    - Gdy ustawiono `gatewayUrl`, UI nie wraca do poświadczeń z konfiguracji ani środowiska. Podaj jawnie `token` (lub `password`). Brak jawnych poświadczeń jest błędem.
    - Użyj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, proxy HTTPS itd.).
    - `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
    - Wdrożenia Control UI poza loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins` (pełne źródła). Obejmuje to zdalne konfiguracje deweloperskie.
    - Uruchomienie Gateway może zasilić lokalne źródła, takie jak `http://localhost:<port>` i `http://127.0.0.1:<port>`, na podstawie efektywnego bindowania i portu środowiska uruchomieniowego, ale zdalne źródła przeglądarki nadal wymagają jawnych wpisów.
    - Nie używaj `gateway.controlUi.allowedOrigins: ["*"]` poza ściśle kontrolowanym lokalnym testowaniem. Oznacza to zezwolenie na dowolne źródło przeglądarki, a nie „dopasuj dowolny host, którego używam”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb awaryjnego użycia źródła z nagłówka Host, ale jest to niebezpieczny tryb zabezpieczeń.

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
- [WebChat](/pl/web/webchat) — interfejs czatu oparty na przeglądarce
