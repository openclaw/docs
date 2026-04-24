---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz uzyskać dostęp przez Tailnet bez tuneli SSH
summary: Interfejs użytkownika Control oparty na przeglądarce dla Gateway (czat, Node, konfiguracja)
title: Control UI
x-i18n:
    generated_at: "2026-04-24T09:39:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c84a74e20d6c8829168025830ff4ec8f650f10f72fcaed7c8d2f5d92ab98d616
    source_path: web/control-ui.md
    workflow: 15
---

Control UI to mała jednoplikowa aplikacja **Vite + Lit** serwowana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Komunikuje się **bezpośrednio z WebSocket Gateway** na tym samym porcie.

## Szybkie otwieranie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (lub [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

Uwierzytelnianie jest dostarczane podczas handshake WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości zaufanego proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień dashboardu przechowuje token dla bieżącej sesji karty przeglądarki
i wybrany URL Gateway; hasła nie są zapisywane. Onboarding zwykle
generuje token Gateway dla uwierzytelniania współdzielonym sekretem przy pierwszym połączeniu, ale
uwierzytelnianie hasłem także działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z Control UI z nowej przeglądarki lub urządzenia, Gateway
wymaga **jednorazowego zatwierdzenia parowania** — nawet jeśli jesteś w tym samym Tailnet
z `gateway.auth.allowTailscale: true`. To środek bezpieczeństwa zapobiegający
nieautoryzowanemu dostępowi.

**Co zobaczysz:** „rozłączono (1008): wymagane parowanie”

**Aby zatwierdzić urządzenie:**

```bash
# Wyświetl oczekujące żądania
openclaw devices list

# Zatwierdź przez identyfikator żądania
openclaw devices approve <requestId>
```

Jeśli przeglądarka ponowi próbę parowania ze zmienionymi danymi uwierzytelniania (rola/zakresy/klucz
publiczny), poprzednie oczekujące żądanie zostanie zastąpione i utworzony zostanie nowy `requestId`.
Przed zatwierdzeniem ponownie uruchom `openclaw devices list`.

Jeśli przeglądarka jest już sparowana i zmienisz ją z dostępu tylko do odczytu na
dostęp do zapisu/admin, jest to traktowane jako podniesienie poziomu zatwierdzenia, a nie ciche
ponowne połączenie. OpenClaw utrzymuje stare zatwierdzenie jako aktywne, blokuje szersze ponowne połączenie
i prosi o jawne zatwierdzenie nowego zestawu zakresów.

Po zatwierdzeniu urządzenie jest zapamiętywane i nie będzie wymagało ponownego zatwierdzenia, chyba że
cofniesz je przez `openclaw devices revoke --device <id> --role <role>`. Zobacz
[Devices CLI](/pl/cli/devices), aby poznać rotację tokenów i cofanie.

**Uwagi:**

- Bezpośrednie lokalne połączenia przeglądarki przez loopback (`127.0.0.1` / `localhost`) są
  zatwierdzane automatycznie.
- Połączenia przeglądarki przez Tailnet i LAN nadal wymagają jawnego zatwierdzenia, nawet jeśli
  pochodzą z tej samej maszyny.
- Każdy profil przeglądarki generuje unikalny identyfikator urządzenia, więc zmiana przeglądarki lub
  wyczyszczenie danych przeglądarki będzie wymagało ponownego parowania.

## Tożsamość osobista (lokalna dla przeglądarki)

Control UI obsługuje tożsamość osobistą przypisaną do przeglądarki (nazwa wyświetlana i
awatar) dołączaną do wiadomości wychodzących w celu atrybucji we współdzielonych sesjach. Jest ona
przechowywana w pamięci przeglądarki, ograniczona do bieżącego profilu przeglądarki i nie jest
synchronizowana z innymi urządzeniami ani zapisywana po stronie serwera poza zwykłymi metadanymi
autorstwa w transkrypcji wiadomości, które faktycznie wysyłasz. Wyczyszczenie danych strony lub
zmiana przeglądarki resetuje ją do pustej wartości.

## Endpoint konfiguracji runtime

Control UI pobiera swoje ustawienia runtime z
`/__openclaw/control-ui-config.json`. Ten endpoint jest chroniony tym samym
uwierzytelnianiem Gateway co reszta powierzchni HTTP: nieuwierzytelnione przeglądarki nie mogą go pobrać,
a pomyślne pobranie wymaga albo już prawidłowego tokena/hasła Gateway,
tożsamości Tailscale Serve albo tożsamości zaufanego proxy.

## Obsługa języków

Control UI może zlokalizować się przy pierwszym załadowaniu na podstawie ustawień regionalnych Twojej przeglądarki.
Aby nadpisać to później, otwórz **Overview -> Gateway Access -> Language**. Selektor
języka znajduje się na karcie Gateway Access, a nie w sekcji Appearance.

- Obsługiwane lokalizacje: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Tłumaczenia inne niż angielskie są lazy-loadowane w przeglądarce.
- Wybrana lokalizacja jest zapisywana w pamięci przeglądarki i ponownie używana przy przyszłych wizytach.
- Brakujące klucze tłumaczeń przechodzą na angielski.

## Co to dziś potrafi

- Czat z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Bezpośrednia rozmowa z OpenAI Realtime z poziomu przeglądarki przez WebRTC. Gateway
  tworzy krótkotrwały sekret klienta Realtime przez `talk.realtime.session`; przeglądarka wysyła
  dźwięk z mikrofonu bezpośrednio do OpenAI i przekazuje wywołania narzędzia
  `openclaw_agent_consult` z powrotem przez `chat.send` do większego
  skonfigurowanego modelu OpenClaw.
- Strumieniowanie wywołań narzędzi + kart z wyjściem narzędzi na żywo w Czat (zdarzenia agenta)
- Kanały: stan kanałów wbudowanych oraz z wbudowanych/zewnętrznych Pluginów, logowanie QR i konfiguracja per kanał (`channels.status`, `web.login.*`, `config.patch`)
- Instancje: lista obecności + odświeżanie (`system-presence`)
- Sesje: lista + nadpisania per sesja dla modelu/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreaming: stan Dreaming, przełącznik włączania/wyłączania oraz czytnik Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Zadania Cron: list/add/edit/run/enable/disable + historia uruchomień (`cron.*`)
- Skills: stan, włączanie/wyłączanie, instalacja, aktualizacje kluczy API (`skills.*`)
- Node: lista + caps (`node.list`)
- Akceptacje exec: edycja list dozwolonych Gateway lub Node + polityka ask dla `exec host=gateway/node` (`exec.approvals.*`)
- Konfiguracja: podgląd/edycja `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Konfiguracja: apply + restart z walidacją (`config.apply`) i wybudzenie ostatniej aktywnej sesji
- Zapisy konfiguracji zawierają ochronę base-hash, aby zapobiec nadpisaniu równoczesnych edycji
- Zapisy konfiguracji (`config.set`/`config.apply`/`config.patch`) wykonują także wstępne sprawdzenie aktywnego rozwiązywania SecretRef dla referencji w przesłanym payloadzie konfiguracji; nierozwiązane aktywne przesłane referencje są odrzucane przed zapisem
- Schemat konfiguracji + renderowanie formularza (`config.schema` / `config.schema.lookup`,
  w tym pola `title` / `description`, dopasowane wskazówki UI, podsumowania bezpośrednich
  elementów potomnych, metadane dokumentacji na zagnieżdżonych węzłach object/wildcard/array/composition,
  a także schematy Plugin i kanałów, gdy są dostępne); edytor Raw JSON jest
  dostępny tylko wtedy, gdy migawka ma bezpieczny raw round-trip
- Jeśli migawka nie może bezpiecznie wykonać raw round-trip, Control UI wymusza tryb formularza i wyłącza tryb Raw dla tej migawki
- „Reset to saved” w edytorze Raw JSON zachowuje kształt stworzony w raw (formatowanie, komentarze, układ `$include`) zamiast ponownie renderować spłaszczoną migawkę, więc zewnętrzne edycje przetrwają reset, gdy migawka może bezpiecznie wykonać raw round-trip
- Ustrukturyzowane wartości obiektów SecretRef są renderowane w formularzowych polach tekstowych tylko do odczytu, aby zapobiec przypadkowemu uszkodzeniu przez zamianę obiektu na string
- Debugowanie: migawki status/health/models + log zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`)
- Logi: live tail logów plikowych Gateway z filtrowaniem/eksportem (`logs.tail`)
- Aktualizacja: uruchomienie aktualizacji pakietu/gita + restart (`update.run`) z raportem restartu

Uwagi dotyczące panelu zadań Cron:

- Dla zadań izolowanych dostarczanie domyślnie ogłasza podsumowanie. Możesz przełączyć na brak, jeśli chcesz uruchomienia tylko wewnętrzne.
- Pola kanału/celu pojawiają się po wybraniu announce.
- Tryb Webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy URL Webhook HTTP(S).
- Dla zadań głównej sesji dostępne są tryby dostarczania webhook i none.
- Zaawansowane kontrolki edycji obejmują delete-after-run, clear agent override, dokładne/rozproszone opcje Cron,
  nadpisania agent model/thinking oraz przełączniki dostarczania best-effort.
- Walidacja formularza jest inline z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu do czasu ich poprawienia.
- Ustaw `cron.webhookToken`, aby wysłać dedykowany token bearer; jeśli go pominięto, Webhook jest wysyłany bez nagłówka auth.
- Przestarzały fallback: zapisane starsze zadania z `notify: true` nadal mogą używać `cron.webhook`, dopóki nie zostaną zmigrowane.

## Zachowanie czatu

- `chat.send` jest **nieblokujące**: natychmiast potwierdza `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`.
- Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po zakończeniu.
- Odpowiedzi `chat.history` są ograniczone rozmiarem dla bezpieczeństwa UI. Gdy wpisy transkrypcji są zbyt duże, Gateway może obcinać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować zbyt duże wiadomości placeholderem (`[chat.history omitted: message too large]`).
- Obrazy asystenta/generowane są zapisywane jako zarządzane referencje multimedialne i zwracane przez uwierzytelnione URL multimediów Gateway, więc przeładowania nie zależą od utrzymywania surowych payloadów obrazów base64 w odpowiedzi historii czatu.
- `chat.history` usuwa także inline’owe tagi dyrektyw tylko do wyświetlania z widocznego tekstu asystenta (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), payloady XML wywołań narzędzi w zwykłym tekście (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi), a także wyciekłe tokeny sterujące modelem ASCII/full-width, i pomija wpisy asystenta, których cały widoczny tekst to wyłącznie dokładny cichy token `NO_REPLY` / `no_reply`.
- `chat.inject` dopisuje notatkę asystenta do transkrypcji sesji i rozsyła zdarzenie `chat` dla aktualizacji tylko-UI (bez uruchomienia agenta, bez dostarczania do kanału).
- Selektory modelu i thinking w nagłówku czatu natychmiast aktualizują aktywną sesję przez `sessions.patch`; są to trwałe nadpisania sesji, a nie opcje wysyłki tylko na jedną turę.
- Tryb Talk używa zarejestrowanego dostawcy głosu realtime, który obsługuje sesje WebRTC w przeglądarce. Skonfiguruj OpenAI przez `talk.provider: "openai"` wraz z `talk.providers.openai.apiKey`, albo użyj ponownie konfiguracji dostawcy realtime z Voice Call. Przeglądarka nigdy nie otrzymuje standardowego klucza API OpenAI; otrzymuje jedynie efemeryczny sekret klienta Realtime. Głos realtime Google Live jest obsługiwany dla backendowego Voice Call i mostów Google Meet, ale jeszcze nie dla tej ścieżki WebRTC przeglądarki. Prompt sesji Realtime jest składany przez Gateway; `talk.realtime.session` nie akceptuje nadpisań instrukcji podawanych przez wywołującego.
- W composerze czatu kontrolka Talk to przycisk fal obok przycisku dyktowania mikrofonem. Gdy Talk się uruchamia, wiersz stanu composera pokazuje `Connecting Talk...`, następnie `Talk live`, gdy audio jest połączone, albo `Asking OpenClaw...`, gdy wywołanie narzędzia realtime konsultuje skonfigurowany większy model przez `chat.send`.
- Zatrzymanie:
  - Kliknij **Stop** (wywołuje `chat.abort`)
  - Gdy przebieg jest aktywny, zwykłe wiadomości uzupełniające trafiają do kolejki. Kliknij **Steer** przy wiadomości w kolejce, aby wstrzyknąć to uzupełnienie do trwającej tury.
  - Wpisz `/stop` (lub samodzielne frazy przerywające, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem
  - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`), aby przerwać wszystkie aktywne przebiegi dla tej sesji
- Zachowanie częściowego wyniku po przerwaniu:
  - Gdy przebieg zostanie przerwany, częściowy tekst asystenta nadal może być pokazany w UI
  - Gateway zapisuje częściowy tekst asystenta przerwanego przebiegu do historii transkrypcji, gdy istnieje buforowane wyjście
  - Zapisane wpisy zawierają metadane przerwania, dzięki czemu konsumenci transkrypcji mogą odróżnić częściowe wyniki po przerwaniu od normalnego zakończenia

## Hostowane embedy

Wiadomości asystenta mogą renderować hostowaną treść web inline za pomocą shortcode `[embed ...]`.
Polityka sandbox iframe jest kontrolowana przez
`gateway.controlUi.embedSandbox`:

- `strict`: wyłącza wykonywanie skryptów wewnątrz hostowanych embedów
- `scripts`: pozwala na interaktywne embedy przy zachowaniu izolacji origin; to
  wartość domyślna i zwykle wystarcza dla samodzielnych gier/widgetów przeglądarkowych
- `trusted`: dodaje `allow-same-origin` oprócz `allow-scripts` dla dokumentów tej samej strony,
  które celowo wymagają silniejszych uprawnień

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

Używaj `trusted` tylko wtedy, gdy osadzony dokument rzeczywiście potrzebuje zachowania same-origin.
Dla większości generowanych przez agentów gier i interaktywnych canvas `scripts` jest
bezpieczniejszym wyborem.

Bezwzględne zewnętrzne URL embedu `http(s)` pozostają domyślnie blokowane. Jeśli
świadomie chcesz, aby `[embed url="https://..."]` ładowało strony zewnętrzne, ustaw
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Dostęp przez Tailnet (zalecane)

### Zintegrowany Tailscale Serve (preferowane)

Pozostaw Gateway na loopback i pozwól, aby Tailscale Serve proxy’ował go przez HTTPS:

```bash
openclaw gateway --tailscale serve
```

Otwórz:

- `https://<magicdns>/` (lub skonfigurowane `gateway.controlUi.basePath`)

Domyślnie żądania Control UI/WebSocket Serve mogą uwierzytelniać się przez nagłówki tożsamości Tailscale
(`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw
weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` przez
`tailscale whois` i dopasowując go do nagłówka, i akceptuje je tylko wtedy, gdy
żądanie trafia na loopback z nagłówkami `x-forwarded-*` Tailscale. Ustaw
`gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń współdzielonego sekretu
nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` lub
`"password"`.
Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby uwierzytelnienia dla tego samego IP klienta
i zakresu auth są serializowane przed zapisami limitu szybkości. Współbieżne błędne ponowienia
z tej samej przeglądarki mogą więc na drugim żądaniu pokazać `retry later` zamiast dwóch zwykłych niedopasowań ścigających się równolegle.
Uwierzytelnianie Serve bez tokena zakłada, że host Gateway jest zaufany. Jeśli na tym hoście może działać niezaufany lokalny kod, wymagaj uwierzytelniania tokenem/hasłem.

### Powiązanie z Tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Następnie otwórz:

- `http://<tailscale-ip>:18789/` (lub skonfigurowane `gateway.controlUi.basePath`)

Wklej pasujący współdzielony sekret w ustawieniach UI (wysyłany jako
`connect.params.auth.token` lub `connect.params.auth.password`).

## Niezabezpieczony HTTP

Jeśli otwierasz dashboard przez zwykły HTTP (`http://<lan-ip>` lub `http://<tailscale-ip>`),
przeglądarka działa w **niezabezpieczonym kontekście** i blokuje WebCrypto. Domyślnie
OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność localhost-only dla niezabezpieczonego HTTP z `gateway.controlUi.allowInsecureAuth=true`
- pomyślne uwierzytelnienie operatora w Control UI przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana poprawka:** użyj HTTPS (Tailscale Serve) albo otwórz UI lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście Gateway)

**Zachowanie przełącznika allowInsecureAuth:**

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

- Pozwala sesjom localhost w Control UI kontynuować bez tożsamości urządzenia w
  niezabezpieczonych kontekstach HTTP.
- Nie omija kontroli parowania.
- Nie łagodzi wymagań dotyczących zdalnej (spoza localhost) tożsamości urządzenia.

**Tylko awaryjnie:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` wyłącza kontrole tożsamości urządzenia w Control UI i jest
poważnym obniżeniem bezpieczeństwa. Po użyciu awaryjnym szybko przywróć poprzedni stan.

Uwaga dotycząca zaufanego proxy:

- pomyślne uwierzytelnienie trusted-proxy może dopuścić sesje operatora w Control UI bez
  tożsamości urządzenia
- to **nie** obejmuje sesji Control UI z rolą node
- proxy reverse loopback na tym samym hoście nadal nie spełniają wymagań uwierzytelniania trusted-proxy; zobacz
  [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth)

Wskazówki dotyczące konfiguracji HTTPS znajdziesz w [Tailscale](/pl/gateway/tailscale).

## Content Security Policy

Control UI jest dostarczane z ciasną polityką `img-src`: dozwolone są tylko zasoby **same-origin** i URL `data:`. Zdalne URL obrazów `http(s)` i względne do protokołu są odrzucane przez przeglądarkę i nie powodują żądań sieciowych.

Co to oznacza w praktyce:

- Awatary i obrazy serwowane pod ścieżkami względnymi (na przykład `/avatars/<id>`) nadal są renderowane.
- Inline’owe URL `data:image/...` nadal są renderowane (przydatne dla payloadów w protokole).
- Zdalne URL awatarów emitowane przez metadane kanału są usuwane przez helpery awatarów w Control UI i zastępowane wbudowanym logo/oznaczeniem, więc przejęty lub złośliwy kanał nie może wymusić arbitralnych zdalnych pobrań obrazów z przeglądarki operatora.

Nie musisz nic zmieniać, aby uzyskać to zachowanie — jest ono zawsze włączone i niekonfigurowalne.

## Uwierzytelnianie trasy awataru

Gdy skonfigurowane jest uwierzytelnianie Gateway, endpoint awataru w Control UI wymaga tego samego tokena Gateway co reszta API:

- `GET /avatar/<agentId>` zwraca obraz awataru tylko uwierzytelnionym wywołującym. `GET /avatar/<agentId>?meta=1` zwraca metadane awataru na tej samej zasadzie.
- Nieuwierzytelnione żądania do obu tras są odrzucane (zgodnie z siostrzaną trasą mediów asystenta). Zapobiega to wyciekowi tożsamości agenta przez trasę awataru na hostach, które poza tym są chronione.
- Samo Control UI przekazuje token Gateway jako nagłówek bearer podczas pobierania awatarów i używa uwierzytelnionych URL blob, dzięki czemu obraz nadal renderuje się w dashboardach.

Jeśli wyłączysz uwierzytelnianie Gateway (niezalecane na współdzielonych hostach), trasa awataru także staje się nieuwierzytelniona, zgodnie z resztą Gateway.

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je za pomocą:

```bash
pnpm ui:build
```

Opcjonalna bezwzględna baza (gdy chcesz mieć stałe URL zasobów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do lokalnego developmentu (osobny serwer deweloperski):

```bash
pnpm ui:dev
```

Następnie wskaż UI URL WebSocket swojego Gateway (np. `ws://127.0.0.1:18789`).

## Debugowanie/testowanie: serwer deweloperski + zdalny Gateway

Control UI to pliki statyczne; cel WebSocket jest konfigurowalny i może być
inny niż origin HTTP. Jest to przydatne, gdy chcesz uruchamiać lokalnie serwer deweloperski Vite,
ale Gateway działa gdzie indziej.

1. Uruchom serwer deweloperski UI: `pnpm ui:dev`
2. Otwórz URL taki jak:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Opcjonalne jednorazowe uwierzytelnianie (jeśli potrzebne):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Uwagi:

- `gatewayUrl` jest po załadowaniu zapisywany w localStorage i usuwany z URL.
- `token` powinien być przekazywany przez fragment URL (`#token=...`), gdy tylko to możliwe. Fragmenty nie są wysyłane do serwera, co zapobiega wyciekom w logach żądań i Referer. Starsze parametry zapytania `?token=` są nadal jednorazowo importowane dla zgodności, ale tylko jako fallback, i są usuwane natychmiast po bootstrapie.
- `password` jest przechowywane tylko w pamięci.
- Gdy ustawiono `gatewayUrl`, UI nie przechodzi na poświadczenia z konfiguracji ani środowiska.
  Podaj jawnie `token` (albo `password`). Brak jawnych poświadczeń jest błędem.
- Użyj `wss://`, gdy Gateway jest za TLS (Tailscale Serve, proxy HTTPS itd.).
- `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiegać clickjackingowi.
- Wdrożenia Control UI poza loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins`
  (pełne originy). Obejmuje to także zdalne konfiguracje deweloperskie.
- Nie używaj `gateway.controlUi.allowedOrigins: ["*"]`, chyba że do ściśle kontrolowanych
  testów lokalnych. Oznacza to zezwolenie na dowolny origin przeglądarki, a nie „dopasuj do dowolnego hosta, którego używam”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza
  tryb fallback origin na podstawie nagłówka Host, ale jest to niebezpieczny tryb bezpieczeństwa.

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

- [Dashboard](/pl/web/dashboard) — dashboard Gateway
- [WebChat](/pl/web/webchat) — interfejs czatu oparty na przeglądarce
- [TUI](/pl/web/tui) — terminalowy interfejs użytkownika
- [Health Checks](/pl/gateway/health) — monitorowanie stanu Gateway
