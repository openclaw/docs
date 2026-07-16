---
read_when:
    - Skryptowa obsługa lub debugowanie przeglądarki agenta za pomocą lokalnego interfejsu API sterowania
    - Szukasz dokumentacji CLI `openclaw browser`
    - Dodawanie niestandardowej automatyzacji przeglądarki z migawkami i odwołaniami
summary: Interfejs API sterowania przeglądarką OpenClaw, dokumentacja CLI i akcje skryptowe
title: API sterowania przeglądarką
x-i18n:
    generated_at: "2026-07-16T19:12:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

Informacje o instalacji, konfiguracji i rozwiązywaniu problemów zawiera strona [Przeglądarka](/pl/tools/browser).
Ta strona stanowi dokumentację lokalnego interfejsu HTTP API sterowania, interfejsu `openclaw browser`
CLI oraz wzorców skryptów (migawki, odwołania, oczekiwanie, przepływy debugowania).

## Interfejs API sterowania (opcjonalny)

Wyłącznie na potrzeby lokalnych integracji Gateway udostępnia niewielki interfejs HTTP API w interfejsie pętli zwrotnej.
Ten autonomiczny serwer jest opcjonalny — należy ustawić zmienną środowiskową
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` w środowisku usługi Gateway
i ponownie uruchomić Gateway, zanim punkty końcowe HTTP staną się dostępne. Bez
tej zmiennej środowisko wykonawcze sterowania przeglądarką nadal działa za pośrednictwem CLI i
narzędzi agenta, ale nic nie nasłuchuje na porcie sterowania interfejsu pętli zwrotnej.

- Stan/uruchamianie/zatrzymywanie: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- Profile: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- Karty: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- Migawka/zrzut ekranu: `GET /snapshot`, `POST /screenshot`
- Działania: `POST /navigate`, `POST /act`
- Punkty zaczepienia: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Pobieranie: `POST /download`, `POST /wait/download`
- Uprawnienia: `POST /permissions/grant`
- Debugowanie: `GET /console`, `POST /pdf`
- Debugowanie: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Sieć: `POST /response/body`
- Stan: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stan: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ustawienia: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` jest formą wsadową używaną wewnętrznie przez CLI dla
podpoleceń `browser tab` (`{"action":"new"|"label"|"select"|"close"|"list", ...}`);
podczas bezpośredniego tworzenia skryptów zaleca się używanie wymienionych wyżej tras przeznaczonych do konkretnych operacji na kartach.

Wszystkie punkty końcowe akceptują `?profile=<name>`. `POST /start?headless=true` żąda
jednorazowego uruchomienia w trybie bez interfejsu dla lokalnych profili zarządzanych bez zmiany utrwalonej
konfiguracji przeglądarki; profile tylko do dołączania, zdalnego CDP i istniejących sesji odrzucają
to nadpisanie, ponieważ OpenClaw nie uruchamia tych procesów przeglądarki.

W przypadku punktów końcowych kart `targetId` jest nazwą pola zgodności. Zaleca się przekazywanie
`suggestedTargetId` z `GET /tabs` lub `POST /tabs/open`; akceptowane są także etykiety i uchwyty `tabId`
takie jak `t1`. Nieprzetworzone identyfikatory docelowe CDP i unikatowe prefiksy nieprzetworzonych
identyfikatorów docelowych nadal działają, ale są nietrwałymi uchwytami diagnostycznymi.

Jeśli skonfigurowano uwierzytelnianie Gateway za pomocą współdzielonego sekretu, trasy HTTP przeglądarki również wymagają uwierzytelniania:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` lub uwierzytelnianie HTTP Basic przy użyciu tego hasła

Uwagi:

- Ten autonomiczny interfejs API przeglądarki w pętli zwrotnej **nie** używa nagłówków tożsamości zaufanego serwera proxy ani
  Tailscale Serve.
- Jeśli `gateway.auth.mode` ma wartość `none` lub `trusted-proxy`, te trasy przeglądarki w pętli zwrotnej
  nie dziedziczą tych trybów przenoszących tożsamość; należy zachować ich dostępność wyłącznie przez interfejs pętli zwrotnej.

### Kontrakt błędów `/act`

`POST /act` używa ustrukturyzowanej odpowiedzi o błędzie w przypadku błędów walidacji i
zasad na poziomie trasy:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Bieżące wartości `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): brakuje `kind` lub jego wartość jest nierozpoznana.
- `ACT_INVALID_REQUEST` (HTTP 400): nie powiodła się normalizacja lub walidacja ładunku działania.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` użyto z nieobsługiwanym rodzajem działania.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (lub `wait --fn`) jest wyłączone w konfiguracji.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): nadrzędne lub wsadowe `targetId` jest sprzeczne z celem żądania.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): działanie nie jest obsługiwane w profilach istniejących sesji.

Inne błędy środowiska wykonawczego mogą nadal zwracać `{ "error": "<message>" }` bez
pola `code`.

### Wymaganie dotyczące Playwright

Niektóre funkcje (nawigacja/działanie/migawka AI/migawka ról, zrzuty ekranu elementów,
PDF) wymagają Playwright. Jeśli Playwright nie jest zainstalowany, te punkty końcowe zwracają
jasny błąd 501.

Co nadal działa bez Playwright:

- Migawki ARIA
- Migawki dostępności w stylu ról (`--interactive`, `--compact`,
  `--depth`, `--efficient`), gdy dostępny jest WebSocket CDP dla danej karty. Jest to
  mechanizm zastępczy do inspekcji i wykrywania odwołań; Playwright pozostaje podstawowym
  mechanizmem działań.
- Zrzuty ekranu stron w zarządzanej przeglądarce `openclaw`, gdy dostępny jest WebSocket CDP
  dla danej karty
- Zrzuty ekranu stron dla profili `existing-session` / Chrome MCP
- Zrzuty ekranu oparte na odwołaniach `existing-session` (`--ref`) z wyniku migawki

Co nadal wymaga Playwright:

- `navigate`
- `act`
- Migawki AI zależne od natywnego formatu migawek AI w Playwright
- Zrzuty ekranu elementów wskazanych selektorem CSS (`--element`)
- Pełny eksport pliku PDF z przeglądarki

Zrzuty ekranu elementów również odrzucają `--full-page`; trasa zwraca `fullPage is
not supported for element screenshots`.

Jeśli pojawia się `Playwright is not available in this gateway build`, w spakowanym
Gateway brakuje podstawowej zależności środowiska wykonawczego przeglądarki. Należy ponownie zainstalować lub zaktualizować
OpenClaw, a następnie ponownie uruchomić Gateway. W przypadku platformy Docker należy również zainstalować pliki binarne
przeglądarki Chromium zgodnie z poniższymi instrukcjami.

#### Instalowanie Playwright w Dockerze

Jeśli Gateway działa w Dockerze, należy unikać `npx playwright` (konflikty nadpisań npm).
W przypadku niestandardowych obrazów należy wbudować Chromium w obraz:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

W przypadku istniejącego obrazu należy zamiast tego przeprowadzić instalację za pośrednictwem dołączonego CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Aby zachować pobrane pliki przeglądarki, należy ustawić `PLAYWRIGHT_BROWSERS_PATH` (na przykład
`/home/node/.cache/ms-playwright`) i upewnić się, że `/home/node` jest utrwalane za pomocą
`OPENCLAW_HOME_VOLUME` lub montowania powiązanego. OpenClaw automatycznie wykrywa utrwalone
Chromium w systemie Linux. Zobacz [Docker](/pl/install/docker).

## Jak to działa (wewnętrznie)

Niewielki serwer sterowania w interfejsie pętli zwrotnej przyjmuje żądania HTTP i łączy się z przeglądarkami opartymi na Chromium za pośrednictwem CDP. Zaawansowane działania (klikanie/wpisywanie/migawki/PDF) są wykonywane przez Playwright na bazie CDP; gdy brakuje Playwright, dostępne są tylko operacje niewymagające Playwright. Agent korzysta z jednego stabilnego interfejsu, podczas gdy lokalne i zdalne przeglądarki oraz profile mogą być swobodnie wymieniane w warstwach bazowych.

## Skrócona dokumentacja CLI

Wszystkie polecenia akceptują `--browser-profile <name>` w celu wskazania konkretnego profilu oraz `--json` w celu uzyskania danych wyjściowych przeznaczonych do przetwarzania maszynowego.

<AccordionGroup>

<Accordion title="Podstawy: stan, karty, otwieranie/aktywowanie/zamykanie">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # dodaje aktywną próbę wykonania migawki
openclaw browser start
openclaw browser start --headless # jednorazowe lokalne uruchomienie profilu zarządzanego bez interfejsu
openclaw browser stop            # czyści również emulację dla profili tylko do dołączania/zdalnego CDP
openclaw browser reset-profile   # przenosi dane przeglądarki profilu do kosza
openclaw browser tabs
openclaw browser tab             # skrót do bieżącej karty
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Profile: wyświetlanie, tworzenie, usuwanie">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="Inspekcja: zrzut ekranu, migawka, konsola, błędy, żądania">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # lub --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Działania: nawigacja, klikanie, wpisywanie, przeciąganie, oczekiwanie, obliczanie">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # lub e12 dla odwołań ról
openclaw browser click-coords 120 340        # współrzędne obszaru wyświetlania
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Stan: pliki cookie, pamięć, tryb offline, nagłówki, geolokalizacja, urządzenie">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear usuwa dane
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Uwagi:

- Narzędzie `action=download` (wymagane `ref` i
  `path`) oraz `action=waitfordownload` (opcjonalne `path`) udostępniane agentowi przez `browser`. Oba zwracają zapisany
  adres URL pobierania, sugerowaną nazwę pliku i chronioną ścieżkę lokalną. Jawne przechwytywanie
  pobierania jest dostępne dla zarządzanych profili Playwright; profile
  istniejących sesji zwracają błąd nieobsługiwanej operacji.
- Preferowane są atomowe przesyłania przez selektor: należy przekazać wyzwalacz `--ref` wraz z przesyłaniem, aby OpenClaw uzbroił go i kliknął w jednym żądaniu. `upload` zawierające tylko ścieżki pozostaje obsługiwane, gdy późniejszy wyzwalacz jest zamierzony. Aby ustawić bezpośrednio pole pliku, należy użyć `--input-ref` lub `--element`. `dialog` jest wywołaniem uzbrajającym; należy je uruchomić przed kliknięciem lub naciśnięciem wywołującym okno dialogowe. Jeśli akcja otwiera okno modalne, odpowiedź akcji zawiera `blockedByDialog` i `browserState.dialogs.pending`; należy przekazać ten `dialogId`, aby odpowiedzieć bezpośrednio. Okna dialogowe obsłużone poza OpenClaw są widoczne w `browserState.dialogs.recent`.
- `click`/`type`/itd. wymagają `ref` z `snapshot` (numerycznego `12`, odwołania roli `e12` lub odwołania ARIA umożliwiającego wykonanie akcji `ax12`). Selektory CSS celowo nie są obsługiwane dla akcji. Należy użyć `click-coords`, gdy jedynym niezawodnym celem jest pozycja w widocznym obszarze.
- Ścieżki pobierania i śledzenia są ograniczone do katalogów tymczasowych OpenClaw: `/tmp/openclaw{,/downloads}` (wartość zapasowa: `${os.tmpdir()}/openclaw/...`).
- `upload` przyjmuje pliki z katalogu głównego tymczasowo przesyłanych plików OpenClaw oraz
  przychodzące multimedia zarządzane przez OpenClaw. Do zarządzanych przychodzących multimediów można odwoływać się jako
  `media://inbound/<id>`, przez względną wobec piaskownicy ścieżkę `media/inbound/<id>` lub przez rozwiązaną
  ścieżkę wewnątrz katalogu zarządzanych przychodzących multimediów. Zagnieżdżone odwołania do multimediów,
  przechodzenie między katalogami, dowiązania symboliczne, dowiązania twarde i dowolne ścieżki lokalne nadal są odrzucane.
- `upload` może również ustawiać pola plików bezpośrednio za pomocą `--input-ref` lub `--element`.

Stabilne identyfikatory i etykiety kart zachowują ważność po zastąpieniu surowego celu Chromium, gdy OpenClaw
może potwierdzić kartę zastępczą, na przykład na podstawie unikatowej pary starego i nowego celu dla tego samego adresu URL albo
gdy pojedyncza stara karta staje się pojedynczą nową kartą po przesłaniu formularza. Niejednoznaczne
zastąpienia z powielonym adresem URL otrzymują nowe uchwyty. Surowe identyfikatory celów nadal są
nietrwałe; w skryptach należy preferować `suggestedTargetId` z `tabs`.

Przegląd flag migawek:

- `--format ai` (domyślnie z Playwright): migawka AI z odwołaniami numerycznymi (`aria-ref="<n>"`).
- `--format aria`: drzewo dostępności z odwołaniami `axN`. Gdy Playwright jest dostępny, OpenClaw wiąże odwołania za pomocą identyfikatorów DOM zaplecza z aktywną stroną, dzięki czemu można ich używać w kolejnych akcjach; w przeciwnym razie dane wyjściowe służą tylko do inspekcji.
- `--efficient` (lub `--mode efficient`): ustawienie wstępne zwartej migawki ról. Aby ustawić je jako domyślne, należy ustawić `browser.snapshotDefaults.mode: "efficient"` (zobacz [konfigurację Gateway](/pl/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` wymuszają migawkę ról z odwołaniami `ref=e12`. `--frame "<iframe>"` ogranicza migawki ról do elementu iframe.
- W przypadku Playwright opcja `--labels` dodaje zrzut ekranu z nałożonymi etykietami odwołań
  (wyświetla `MEDIA:<path>`) oraz tablicę `annotations` z prostokątem ograniczającym
  każdego odwołania. Przy `screenshot` etykiety obsługiwane przez Playwright działają z `--full-page`,
  `--ref` i `--element`; przy `snapshot` dołączony zrzut ekranu nadal
  obejmuje tylko obszar widoku. Profile istniejących sesji/chrome-mcp renderują nałożone etykiety na
  zrzutach ekranu strony, ale nie zwracają `annotations` ani nie używają pomocnika Playwright
  do projekcji całej strony, odwołań i elementów. Bez Playwright lub chrome-mcp
  zrzuty ekranu z etykietami nie są dostępne.
- `--urls` dołącza wykryte miejsca docelowe linków do migawek AI.

## Migawki i odwołania

OpenClaw obsługuje dwa style „migawek”:

- **Migawka AI (odwołania numeryczne)**: `openclaw browser snapshot` (domyślnie; `--format ai`)
  - Dane wyjściowe: migawka tekstowa zawierająca odwołania numeryczne.
  - Akcje: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Wewnętrznie odwołanie jest rozwiązywane za pomocą `aria-ref` biblioteki Playwright.

- **Migawka ról (odwołania ról, takie jak `e12`)**: `openclaw browser snapshot --interactive` (lub `--compact`, `--depth`, `--selector`, `--frame`)
  - Dane wyjściowe: lista lub drzewo oparte na rolach z `[ref=e12]` (oraz opcjonalnym `[nth=1]`).
  - Akcje: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Wewnętrznie odwołanie jest rozwiązywane za pomocą `getByRole(...)` (oraz `nth()` w przypadku duplikatów).
  - Należy dodać `--labels`, aby dołączyć zrzut ekranu z nałożonymi etykietami `e12`. W
    profilach obsługiwanych przez Playwright zwraca to również metadane prostokąta ograniczającego dla każdego odwołania
    (`annotations[]`).
  - Należy dodać `--urls`, gdy tekst linku jest niejednoznaczny, a agent potrzebuje konkretnych
    celów nawigacji.

- **Migawka ARIA (odwołania ARIA, takie jak `ax12`)**: `openclaw browser snapshot --format aria`
  - Dane wyjściowe: drzewo dostępności w postaci węzłów strukturalnych.
  - Akcje: `openclaw browser click ax12` działa, gdy ścieżka migawki może powiązać
    odwołanie za pośrednictwem Playwright i identyfikatorów DOM zaplecza Chrome.
- Jeśli Playwright jest niedostępny, migawki ARIA nadal mogą być przydatne do
  inspekcji, ale odwołania mogą nie umożliwiać wykonywania akcji. Gdy potrzebne są odwołania do akcji, należy ponownie wykonać migawkę za pomocą `--format ai`
  lub `--interactive`.
- Dowód Docker dla zapasowej ścieżki surowego CDP: `pnpm test:docker:browser-cdp-snapshot`
  uruchamia Chromium z CDP, wykonuje `browser doctor --deep` i sprawdza, czy migawki ról
  zawierają adresy URL linków, elementy klikalne rozpoznane na podstawie kursora oraz metadane elementów iframe.

Zachowanie odwołań:

- Odwołania **nie są stabilne między nawigacjami**; jeśli coś się nie powiedzie, należy ponownie uruchomić `snapshot` i użyć nowego odwołania.
- `/act` zwraca bieżący surowy `targetId` po zastąpieniu wywołanym akcją,
  jeśli może potwierdzić kartę zastępczą. W kolejnych poleceniach należy nadal używać
  stabilnych identyfikatorów i etykiet kart.
- Jeśli migawkę ról wykonano z `--frame`, odwołania ról są ograniczone do tego elementu iframe aż do następnej migawki ról.
- Nieznane lub nieaktualne odwołania `axN` szybko zgłaszają błąd zamiast przechodzić do
  selektora `aria-ref` biblioteki Playwright. W takim przypadku należy wykonać nową migawkę na tej samej karcie.

## Rozszerzone opcje oczekiwania

Można oczekiwać nie tylko na czas lub tekst:

- Oczekiwanie na adres URL (wzorce glob obsługiwane przez Playwright):
  - `openclaw browser wait --url "**/dash"`
- Oczekiwanie na stan ładowania:
  - `openclaw browser wait --load networkidle`
  - Obsługiwane w zarządzanych profilach `openclaw` oraz surowych/zdalnych profilach CDP. Profile używające sterownika `existing-session` (w tym domyślny profil `user`) odrzucają `networkidle`; należy tam użyć oczekiwania `--url`, `--text`, selektora lub `--fn`.
- Oczekiwanie na predykat JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Oczekiwanie, aż selektor stanie się widoczny:
  - `openclaw browser wait "#main"`

Można je łączyć:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Procedury debugowania

Gdy akcja się nie powiedzie (np. „niewidoczne”, „naruszenie trybu ścisłego”, „zasłonięte”):

1. `openclaw browser snapshot --interactive`
2. Należy użyć `click <ref>` / `type <ref>` (w trybie interaktywnym preferowane są odwołania ról)
3. Jeśli nadal się nie powiedzie: `openclaw browser highlight <ref>`, aby sprawdzić, na co wskazuje Playwright
4. Jeśli strona zachowuje się nietypowo:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Do szczegółowego debugowania należy zarejestrować ślad:
   - `openclaw browser trace start`
   - odtworzyć problem
   - `openclaw browser trace stop` (wyświetla `TRACE:<path>`)

## Dane wyjściowe JSON

`--json` służy do obsługi skryptowej i narzędzi strukturalnych.

Przykłady:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

Migawki ról w formacie JSON zawierają `refs` oraz mały blok `stats` (wiersze/znaki/odwołania/elementy interaktywne), dzięki czemu narzędzia mogą analizować rozmiar i gęstość ładunku.

## Ustawienia stanu i środowiska

Są przydatne w procedurach typu „spraw, aby witryna zachowywała się jak X”:

- Pliki cookie: `cookies`, `cookies set`, `cookies clear`
- Pamięć: `storage local|session get|set|clear`
- Tryb offline: `set offline on|off`
- Nagłówki: `set headers --headers-json '{"X-Debug":"1"}'` (lub forma pozycyjna `set headers '{"X-Debug":"1"}'`)
- Uwierzytelnianie podstawowe HTTP: `set credentials user pass` (lub `--clear`)
- Geolokalizacja: `set geo <lat> <lon> --origin "https://example.com"` (lub `--clear`)
- Multimedia: `set media dark|light|no-preference|none`
- Strefa czasowa / ustawienia regionalne: `set timezone ...`, `set locale ...`
- Urządzenie / obszar widoku:
  - `set device "iPhone 14"` (ustawienia wstępne urządzeń Playwright)
  - `set viewport 1280 720`

## Bezpieczeństwo i prywatność

- Profil przeglądarki openclaw może zawierać zalogowane sesje; należy traktować go jako poufny.
- `browser act kind=evaluate` / `openclaw browser evaluate` oraz `wait --fn`
  wykonują dowolny kod JavaScript w kontekście strony. Wstrzyknięcie polecenia może na to wpłynąć.
  Jeśli ta funkcja nie jest potrzebna, należy ją wyłączyć za pomocą `browser.evaluateEnabled=false`.
- `openclaw browser evaluate --fn` przyjmuje kod źródłowy funkcji, wyrażenie lub
  treść instrukcji. Treści instrukcji są opakowywane jako funkcje asynchroniczne, dlatego dla
  wartości, która ma zostać zwrócona, należy użyć `return`. Należy użyć `--timeout-ms <ms>`, gdy
  funkcja po stronie strony może wymagać więcej czasu niż domyślny limit czasu wykonywania.
- Informacje o logowaniu i zabezpieczeniach przed botami (X/Twitter itd.) znajdują się w sekcji [Logowanie w przeglądarce i publikowanie w X/Twitter](/pl/tools/browser-login).
- Host Gateway/Node powinien pozostać prywatny (tylko interfejs pętli zwrotnej lub tailnet).
- Zdalne punkty końcowe CDP mają duże uprawnienia; należy je tunelować i chronić.

Przykład trybu ścisłego (domyślne blokowanie prywatnych/wewnętrznych miejsc docelowych):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Powiązane materiały

- [Przeglądarka](/pl/tools/browser) — omówienie, konfiguracja, profile, bezpieczeństwo
- [Logowanie w przeglądarce](/pl/tools/browser-login) — logowanie się w witrynach
- [Rozwiązywanie problemów z przeglądarką w systemie Linux](/pl/tools/browser-linux-troubleshooting)
- [Rozwiązywanie problemów z przeglądarką w WSL2](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
