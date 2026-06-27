---
read_when:
    - Skryptowanie lub debugowanie przeglądarki agenta za pomocą lokalnego API sterowania
    - Szukasz dokumentacji referencyjnej CLI `openclaw browser`
    - Dodawanie niestandardowej automatyzacji przeglądarki z migawkami i odwołaniami
summary: API sterowania przeglądarką OpenClaw, dokumentacja CLI i akcje skryptowe
title: API sterowania przeglądarką
x-i18n:
    generated_at: "2026-06-27T18:24:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

Informacje o konfiguracji, ustawieniach i rozwiązywaniu problemów znajdziesz w sekcji [Przeglądarka](/pl/tools/browser).
Ta strona jest dokumentacją referencyjną dla lokalnego kontrolnego interfejsu HTTP API, CLI `openclaw browser`
oraz wzorców skryptowania (migawki, referencje, oczekiwania, przepływy debugowania).

## Kontrolny interfejs API (opcjonalny)

Tylko na potrzeby lokalnych integracji Gateway udostępnia niewielki interfejs HTTP API przez loopback.
Ten samodzielny serwer jest opcjonalny — ustaw zmienną środowiskową
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` w środowisku usługi Gateway
i zrestartuj Gateway, zanim punkty końcowe HTTP staną się dostępne. Bez
tej zmiennej środowisko wykonawcze sterowania przeglądarką nadal działa przez CLI i
narzędzia agenta, ale nic nie nasłuchuje na kontrolnym porcie loopback.

- Stan/uruchomienie/zatrzymanie: `GET /`, `POST /start`, `POST /stop`
- Karty: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Migawka/zrzut ekranu: `GET /snapshot`, `POST /screenshot`
- Akcje: `POST /navigate`, `POST /act`
- Hooki: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Pobieranie: `POST /download`, `POST /wait/download`
- Uprawnienia: `POST /permissions/grant`
- Debugowanie: `GET /console`, `POST /pdf`
- Debugowanie: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Sieć: `POST /response/body`
- Stan: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stan: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ustawienia: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Wszystkie punkty końcowe akceptują `?profile=<name>`. `POST /start?headless=true` żąda
jednorazowego uruchomienia bez interfejsu graficznego dla lokalnych zarządzanych profili bez zmieniania utrwalonej
konfiguracji przeglądarki; profile attach-only, zdalnego CDP i istniejącej sesji odrzucają
to nadpisanie, ponieważ OpenClaw nie uruchamia tych procesów przeglądarki.

Dla punktów końcowych kart `targetId` jest nazwą pola zgodności. Preferuj przekazywanie
`suggestedTargetId` z `GET /tabs` lub `POST /tabs/open`; etykiety i uchwyty `tabId`
takie jak `t1` też są akceptowane. Surowe identyfikatory celu CDP i unikatowe surowe
prefiksy identyfikatorów celu nadal działają, ale są ulotnymi uchwytami diagnostycznymi.

Jeśli skonfigurowano uwierzytelnianie Gateway ze współdzielonym sekretem, trasy HTTP przeglądarki również wymagają uwierzytelnienia:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` lub uwierzytelnianie HTTP Basic z tym hasłem

Uwagi:

- Ten samodzielny interfejs API przeglądarki przez loopback **nie** używa nagłówków tożsamości trusted-proxy ani
  Tailscale Serve.
- Jeśli `gateway.auth.mode` to `none` lub `trusted-proxy`, te trasy przeglądarki przez loopback
  nie dziedziczą tych trybów niosących tożsamość; pozostaw je wyłącznie na loopback.

### Kontrakt błędów `/act`

`POST /act` używa ustrukturyzowanej odpowiedzi błędu dla walidacji na poziomie trasy i
niepowodzeń zasad:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Aktualne wartości `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): brakuje `kind` albo jest nierozpoznane.
- `ACT_INVALID_REQUEST` (HTTP 400): ładunek akcji nie przeszedł normalizacji lub walidacji.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` został użyty z nieobsługiwanym rodzajem akcji.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (lub `wait --fn`) jest wyłączone przez konfigurację.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): najwyższego poziomu albo wsadowe `targetId` koliduje z celem żądania.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): akcja nie jest obsługiwana dla profili istniejącej sesji.

Inne awarie środowiska wykonawczego mogą nadal zwracać `{ "error": "<message>" }` bez pola
`code`.

### Wymaganie Playwright

Niektóre funkcje (navigate/act/migawka AI/migawka roli, zrzuty ekranu elementów,
PDF) wymagają Playwright. Jeśli Playwright nie jest zainstalowany, te punkty końcowe zwracają
czytelny błąd 501.

Co nadal działa bez Playwright:

- Migawki ARIA
- Migawki dostępności w stylu ról (`--interactive`, `--compact`,
  `--depth`, `--efficient`), gdy dostępny jest WebSocket CDP dla danej karty. To
  mechanizm awaryjny do inspekcji i odkrywania referencji; Playwright pozostaje podstawowym
  silnikiem akcji.
- Zrzuty ekranu strony dla zarządzanej przeglądarki `openclaw`, gdy dostępny jest WebSocket CDP
  dla danej karty
- Zrzuty ekranu strony dla profili `existing-session` / Chrome MCP
- Zrzuty ekranu oparte na referencjach `existing-session` (`--ref`) z wyjścia migawki

Co nadal wymaga Playwright:

- `navigate`
- `act`
- Migawki AI zależne od natywnego formatu migawek AI Playwright
- Zrzuty ekranu elementów przez selektor CSS (`--element`)
- pełny eksport przeglądarki do PDF

Zrzuty ekranu elementów odrzucają też `--full-page`; trasa zwraca `fullPage is
not supported for element screenshots`.

Jeśli widzisz `Playwright is not available in this gateway build`, spakowany
Gateway nie ma podstawowej zależności środowiska wykonawczego przeglądarki. Zainstaluj ponownie lub zaktualizuj
OpenClaw, a następnie zrestartuj Gateway. Dla Docker zainstaluj też binaria przeglądarki
Chromium zgodnie z przykładem poniżej.

#### Instalacja Docker Playwright

Jeśli Twój Gateway działa w Docker, unikaj `npx playwright` (konflikty nadpisań npm).
Dla niestandardowych obrazów wbuduj Chromium w obraz:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Dla istniejącego obrazu zainstaluj przez dołączone CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Aby utrwalić pobrania przeglądarki, ustaw `PLAYWRIGHT_BROWSERS_PATH` (na przykład
`/home/node/.cache/ms-playwright`) i upewnij się, że `/home/node` jest utrwalane przez
`OPENCLAW_HOME_VOLUME` albo bind mount. OpenClaw automatycznie wykrywa utrwalone
Chromium w Linux. Zobacz [Docker](/pl/install/docker).

## Jak to działa (wewnętrznie)

Niewielki kontrolny serwer loopback przyjmuje żądania HTTP i łączy się z przeglądarkami opartymi na Chromium przez CDP. Zaawansowane akcje (click/type/snapshot/PDF) przechodzą przez Playwright na CDP; gdy brakuje Playwright, dostępne są tylko operacje niezależne od Playwright. Agent widzi jeden stabilny interfejs, podczas gdy lokalne/zdalne przeglądarki i profile mogą być swobodnie podmieniane pod spodem.

## Szybka dokumentacja CLI

Wszystkie polecenia akceptują `--browser-profile <name>`, aby wskazać konkretny profil, oraz `--json` dla wyjścia czytelnego maszynowo.

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
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

<Accordion title="State: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Uwagi:

- `upload` i `dialog` to wywołania **uzbrajające**; uruchom je przed kliknięciem/naciśnięciem, które wyzwala wybierak/okno dialogowe. Jeśli akcja otwiera modal, odpowiedź akcji zawiera `blockedByDialog` i `browserState.dialogs.pending`; przekaż to `dialogId`, aby odpowiedzieć bezpośrednio. Okna dialogowe obsłużone poza OpenClaw pojawiają się pod `browserState.dialogs.recent`.
- `click`/`type`/itd. wymagają `ref` z `snapshot` (numeryczne `12`, referencja roli `e12` lub używalna referencja ARIA `ax12`). Selektory CSS celowo nie są obsługiwane dla akcji. Użyj `click-coords`, gdy widoczna pozycja w obszarze widoku jest jedynym niezawodnym celem.
- Ścieżki pobierania i śledzenia są ograniczone do tymczasowych katalogów głównych OpenClaw: `/tmp/openclaw{,/downloads}` (mechanizm awaryjny: `${os.tmpdir()}/openclaw/...`).
- `upload` akceptuje pliki z tymczasowego katalogu głównego przesyłania OpenClaw i
  zarządzane przez OpenClaw media przychodzące. Do zarządzanych mediów przychodzących można odwoływać się jako
  `media://inbound/<id>`, względnie wobec piaskownicy `media/inbound/<id>` albo przez rozwiązaną
  ścieżkę wewnątrz zarządzanego katalogu mediów przychodzących. Zagnieżdżone referencje mediów,
  traversal, symlinki, hardlinki i dowolne ścieżki lokalne nadal są odrzucane.
- `upload` może też ustawiać wejścia plików bezpośrednio przez `--input-ref` lub `--element`.

Stabilne identyfikatory i etykiety kart przetrwają zastąpienie surowego celu Chromium, gdy OpenClaw
może udowodnić kartę zastępczą, na przykład ten sam URL albo przejście pojedynczej starej karty w
pojedynczą nową kartę po przesłaniu formularza. Surowe identyfikatory celu nadal są ulotne; w skryptach preferuj
`suggestedTargetId` z `tabs`.

Skrót flag migawek:

- `--format ai` (domyślne z Playwright): migawka AI z liczbowymi odwołaniami (`aria-ref="<n>"`).
- `--format aria`: drzewo dostępności z odwołaniami `axN`. Gdy Playwright jest dostępny, OpenClaw wiąże odwołania z backendowymi identyfikatorami DOM z aktywną stroną, aby kolejne akcje mogły ich używać; w przeciwnym razie traktuj wynik wyłącznie jako inspekcyjny.
- `--efficient` (lub `--mode efficient`): kompaktowy preset migawki ról. Ustaw `browser.snapshotDefaults.mode: "efficient"`, aby stał się domyślny (zobacz [konfiguracja Gateway](/pl/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` wymuszają migawkę ról z odwołaniami `ref=e12`. `--frame "<iframe>"` ogranicza migawki ról do elementu iframe.
- Z Playwright opcja `--labels` dodaje zrzut ekranu z nałożonymi etykietami odwołań
  (wypisuje `MEDIA:<path>`) oraz tablicę `annotations` z ramką ograniczającą
  każdego odwołania. Przy `screenshot` etykiety oparte na Playwright działają z
  `--full-page`, `--ref` i `--element`; przy `snapshot` dołączony zrzut ekranu
  pozostaje ograniczony do widoku. Profile existing-session/chrome-mcp renderują
  etykiety nakładki na zrzutach ekranu strony, ale nie zwracają `annotations`
  ani nie używają pomocnika projekcji pełnej strony/odwołania/elementu z Playwright.
  Bez Playwright lub chrome-mcp etykietowane zrzuty ekranu nie są dostępne.
- `--urls` dołącza wykryte miejsca docelowe linków do migawek AI.

## Migawki i odwołania

OpenClaw obsługuje dwa style „migawek”:

- **Migawka AI (liczbowe odwołania)**: `openclaw browser snapshot` (domyślne; `--format ai`)
  - Wynik: tekstowa migawka zawierająca liczbowe odwołania.
  - Akcje: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Wewnętrznie odwołanie jest rozwiązywane przez `aria-ref` Playwright.

- **Migawka ról (odwołania ról, takie jak `e12`)**: `openclaw browser snapshot --interactive` (lub `--compact`, `--depth`, `--selector`, `--frame`)
  - Wynik: lista/drzewo oparte na rolach z `[ref=e12]` (i opcjonalnie `[nth=1]`).
  - Akcje: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Wewnętrznie odwołanie jest rozwiązywane przez `getByRole(...)` (oraz `nth()` dla duplikatów).
  - Dodaj `--labels`, aby dołączyć zrzut ekranu z nałożonymi etykietami `e12`. W
    profilach opartych na Playwright zwraca to także metadane ramek ograniczających
    dla każdego odwołania (`annotations[]`).
  - Dodaj `--urls`, gdy tekst linku jest niejednoznaczny, a agent potrzebuje konkretnych
    celów nawigacji.

- **Migawka ARIA (odwołania ARIA, takie jak `ax12`)**: `openclaw browser snapshot --format aria`
  - Wynik: drzewo dostępności jako ustrukturyzowane węzły.
  - Akcje: `openclaw browser click ax12` działa, gdy ścieżka migawki może powiązać
    odwołanie przez Playwright i backendowe identyfikatory DOM Chrome.
- Jeśli Playwright jest niedostępny, migawki ARIA nadal mogą być przydatne do
  inspekcji, ale odwołania mogą nie nadawać się do akcji. Wykonaj ponownie migawkę
  z `--format ai` lub `--interactive`, gdy potrzebujesz odwołań do akcji.
- Dowód Docker dla ścieżki awaryjnej raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  uruchamia Chromium z CDP, wykonuje `browser doctor --deep` i weryfikuje, że migawki
  ról zawierają adresy URL linków, elementy klikalne promowane przez kursor oraz metadane iframe.

Zachowanie odwołań:

- Odwołania **nie są stabilne między nawigacjami**; jeśli coś się nie powiedzie, uruchom ponownie `snapshot` i użyj świeżego odwołania.
- `/act` zwraca bieżący surowy `targetId` po zastąpieniu wywołanym akcją,
  gdy może udowodnić kartę zastępczą. W kolejnych poleceniach nadal używaj
  stabilnych identyfikatorów/etykiet kart.
- Jeśli migawka ról została wykonana z `--frame`, odwołania ról są ograniczone do tego iframe do następnej migawki ról.
- Nieznane lub nieaktualne odwołania `axN` kończą się szybko błędem zamiast przechodzić do
  selektora `aria-ref` Playwright. Gdy tak się stanie, uruchom świeżą migawkę na tej samej karcie.

## Ulepszenia oczekiwania

Możesz oczekiwać nie tylko na czas/tekst:

- Oczekiwanie na URL (glob obsługiwane przez Playwright):
  - `openclaw browser wait --url "**/dash"`
- Oczekiwanie na stan ładowania:
  - `openclaw browser wait --load networkidle`
  - Obsługiwane w zarządzanych profilach `openclaw` oraz surowych/zdalnych profilach CDP. Profile `user` i `existing-session` odrzucają `networkidle`; użyj tam oczekiwań `--url`, `--text`, selektora lub `--fn`.
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

## Przepływy debugowania

Gdy akcja się nie powiedzie (np. „niewidoczny”, „naruszenie trybu strict”, „zakryty”):

1. `openclaw browser snapshot --interactive`
2. Użyj `click <ref>` / `type <ref>` (preferuj odwołania ról w trybie interaktywnym)
3. Jeśli nadal się nie udaje: `openclaw browser highlight <ref>`, aby zobaczyć, w co celuje Playwright
4. Jeśli strona zachowuje się nietypowo:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Do głębokiego debugowania: nagraj ślad:
   - `openclaw browser trace start`
   - odtwórz problem
   - `openclaw browser trace stop` (wypisuje `TRACE:<path>`)

## Wynik JSON

`--json` służy do skryptów i narzędzi strukturalnych.

Przykłady:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Migawki ról w JSON zawierają `refs` oraz mały blok `stats` (lines/chars/refs/interactive), aby narzędzia mogły wnioskować o rozmiarze i gęstości ładunku.

## Stan i ustawienia środowiska

Są przydatne w przepływach typu „spraw, aby strona zachowywała się jak X”:

- Ciasteczka: `cookies`, `cookies set`, `cookies clear`
- Magazyn: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Nagłówki: `set headers --headers-json '{"X-Debug":"1"}'` (starsze `set headers --json '{"X-Debug":"1"}'` pozostaje obsługiwane)
- Podstawowe uwierzytelnianie HTTP: `set credentials user pass` (lub `--clear`)
- Geolokalizacja: `set geo <lat> <lon> --origin "https://example.com"` (lub `--clear`)
- Media: `set media dark|light|no-preference|none`
- Strefa czasowa / locale: `set timezone ...`, `set locale ...`
- Urządzenie / widok:
  - `set device "iPhone 14"` (presety urządzeń Playwright)
  - `set viewport 1280 720`

## Bezpieczeństwo i prywatność

- Profil przeglądarki openclaw może zawierać zalogowane sesje; traktuj go jako wrażliwy.
- `browser act kind=evaluate` / `openclaw browser evaluate` oraz `wait --fn`
  wykonują dowolny JavaScript w kontekście strony. Prompt injection może tym sterować.
  Wyłącz to za pomocą `browser.evaluateEnabled=false`, jeśli tego nie potrzebujesz.
- `openclaw browser evaluate --fn` akceptuje źródło funkcji, wyrażenie lub
  ciało instrukcji. Ciała instrukcji są opakowywane jako funkcje asynchroniczne, więc użyj
  `return` dla wartości, którą chcesz otrzymać z powrotem. Użyj `--timeout-ms <ms>`, gdy
  funkcja po stronie strony może potrzebować więcej czasu niż domyślny limit czasu evaluate.
- Informacje o logowaniach i uwagach dotyczących ochrony przed botami (X/Twitter itd.) znajdziesz w [logowanie w przeglądarce + publikowanie w X/Twitter](/pl/tools/browser-login).
- Utrzymuj host Gateway/node jako prywatny (loopback lub tylko tailnet).
- Zdalne punkty końcowe CDP są potężne; tuneluj je i chroń.

Przykład trybu strict (domyślnie blokuj prywatne/wewnętrzne miejsca docelowe):

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

## Powiązane

- [Przeglądarka](/pl/tools/browser) - omówienie, konfiguracja, profile, bezpieczeństwo
- [Logowanie w przeglądarce](/pl/tools/browser-login) - logowanie do witryn
- [Rozwiązywanie problemów z przeglądarką w systemie Linux](/pl/tools/browser-linux-troubleshooting)
- [Rozwiązywanie problemów z przeglądarką w WSL2 i zdalnym CDP w Windows](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
