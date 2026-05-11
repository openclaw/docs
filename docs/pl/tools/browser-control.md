---
read_when:
    - Skryptowanie lub debugowanie przeglądarki agenta za pomocą lokalnego API sterowania
    - Szukasz dokumentacji referencyjnej CLI `openclaw browser`
    - Dodawanie niestandardowej automatyzacji przeglądarki z migawkami i referencjami
summary: Interfejs API sterowania przeglądarką OpenClaw, dokumentacja referencyjna CLI i akcje skryptowe
title: API sterowania przeglądarką
x-i18n:
    generated_at: "2026-05-11T20:37:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 317ac82cb9060ae1f9495a992dcbb25356ef23b98a5802cf0ed65d1720c2a57d
    source_path: tools/browser-control.md
    workflow: 16
---

Konfigurację, ustawienia i rozwiązywanie problemów opisuje strona [Przeglądarka](/pl/tools/browser).
Ta strona jest odniesieniem dla lokalnego sterującego interfejsu API HTTP, CLI `openclaw browser`
oraz wzorców skryptowania (migawki, odwołania, oczekiwania, przepływy debugowania).

## Sterujący interfejs API (opcjonalnie)

Wyłącznie dla lokalnych integracji Gateway udostępnia niewielki interfejs API HTTP loopback:

- Status/uruchamianie/zatrzymywanie: `GET /`, `POST /start`, `POST /stop`
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

Wszystkie endpointy akceptują `?profile=<name>`. `POST /start?headless=true` żąda
jednorazowego uruchomienia headless dla lokalnych profili zarządzanych bez zmieniania utrwalonej
konfiguracji przeglądarki; profile attach-only, zdalne CDP i istniejące sesje odrzucają
to nadpisanie, ponieważ OpenClaw nie uruchamia tych procesów przeglądarki.

Jeśli skonfigurowano uwierzytelnianie Gateway przy użyciu współdzielonego sekretu, trasy HTTP przeglądarki także wymagają uwierzytelniania:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` albo uwierzytelnianie HTTP Basic z tym hasłem

Uwagi:

- Ten samodzielny interfejs API przeglądarki loopback **nie** używa nagłówków tożsamości trusted-proxy ani
  Tailscale Serve.
- Jeśli `gateway.auth.mode` to `none` albo `trusted-proxy`, te trasy przeglądarki loopback
  nie dziedziczą tych trybów przenoszących tożsamość; utrzymuj je wyłącznie jako loopback.

### Kontrakt błędów `/act`

`POST /act` używa ustrukturyzowanej odpowiedzi błędu dla walidacji na poziomie trasy i
niepowodzeń zasad:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Aktualne wartości `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): brakuje `kind` albo jest nierozpoznany.
- `ACT_INVALID_REQUEST` (HTTP 400): ładunek akcji nie przeszedł normalizacji albo walidacji.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): użyto `selector` z nieobsługiwanym rodzajem akcji.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (albo `wait --fn`) jest wyłączone przez konfigurację.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): najwyższego poziomu albo wsadowe `targetId` koliduje z celem żądania.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): akcja nie jest obsługiwana dla profili istniejących sesji.

Inne błędy czasu działania nadal mogą zwracać `{ "error": "<message>" }` bez pola
`code`.

### Wymaganie Playwright

Niektóre funkcje (navigate/act/migawka AI/migawka ról, zrzuty ekranu elementów,
PDF) wymagają Playwright. Jeśli Playwright nie jest zainstalowany, te endpointy zwracają
czytelny błąd 501.

Co nadal działa bez Playwright:

- Migawki ARIA
- Migawki dostępności w stylu ról (`--interactive`, `--compact`,
  `--depth`, `--efficient`), gdy dostępny jest WebSocket CDP dla danej karty. Jest to
  mechanizm zapasowy do inspekcji i wykrywania odwołań; Playwright pozostaje podstawowym
  silnikiem akcji.
- Zrzuty ekranu stron dla zarządzanej przeglądarki `openclaw`, gdy dostępny jest WebSocket CDP
  dla danej karty
- Zrzuty ekranu stron dla profili `existing-session` / Chrome MCP
- Zrzuty ekranu oparte na odwołaniach `existing-session` (`--ref`) z wyjścia migawki

Co nadal wymaga Playwright:

- `navigate`
- `act`
- Migawki AI zależne od natywnego formatu migawek AI Playwright
- Zrzuty ekranu elementów z selektorem CSS (`--element`)
- pełny eksport PDF przeglądarki

Zrzuty ekranu elementów odrzucają również `--full-page`; trasa zwraca `fullPage is
not supported for element screenshots`.

Jeśli widzisz `Playwright is not available in this gateway build`, spakowany
Gateway nie ma podstawowej zależności środowiska uruchomieniowego przeglądarki. Zainstaluj ponownie albo zaktualizuj
OpenClaw, a następnie zrestartuj gateway. W przypadku Dockera zainstaluj także binaria przeglądarki
Chromium zgodnie z poniższym opisem.

#### Instalacja Playwright w Dockerze

Jeśli Gateway działa w Dockerze, unikaj `npx playwright` (konflikty nadpisań npm).
W przypadku obrazów niestandardowych wbuduj Chromium w obraz:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

W przypadku istniejącego obrazu zainstaluj przez dołączone CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Aby utrwalić pobrane pliki przeglądarki, ustaw `PLAYWRIGHT_BROWSERS_PATH` (na przykład
`/home/node/.cache/ms-playwright`) i upewnij się, że `/home/node` jest utrwalane przez
`OPENCLAW_HOME_VOLUME` albo bind mount. OpenClaw automatycznie wykrywa utrwalone
Chromium w systemie Linux. Zobacz [Docker](/pl/install/docker).

## Jak to działa (wewnętrznie)

Niewielki serwer sterujący loopback przyjmuje żądania HTTP i łączy się z przeglądarkami opartymi na Chromium przez CDP. Zaawansowane akcje (kliknięcie/wpisywanie/migawka/PDF) przechodzą przez Playwright na CDP; gdy brakuje Playwright, dostępne są tylko operacje niezależne od Playwright. Agent widzi jeden stabilny interfejs, podczas gdy lokalne/zdalne przeglądarki i profile swobodnie zmieniają się pod spodem.

## Szybka ściągawka CLI

Wszystkie polecenia akceptują `--browser-profile <name>`, aby wskazać konkretny profil, oraz `--json` dla wyjścia czytelnego maszynowo.

<AccordionGroup>

<Accordion title="Podstawy: status, karty, otwieranie/fokus/zamykanie">

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

<Accordion title="Inspekcja: zrzut ekranu, migawka, konsola, błędy, żądania">

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

<Accordion title="Akcje: navigate, kliknięcie, wpisywanie, przeciąganie, oczekiwanie, evaluate">

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
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Stan: ciasteczka, storage, offline, nagłówki, geo, urządzenie">

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

- `upload` i `dialog` są wywołaniami **uzbrajającymi**; uruchom je przed kliknięciem/naciśnięciem, które wywołuje wybór pliku/okno dialogowe.
- `click`/`type`/itd. wymagają `ref` z `snapshot` (numeryczne `12`, odwołanie roli `e12` albo akcyjne odwołanie ARIA `ax12`). Selektory CSS celowo nie są obsługiwane dla akcji. Użyj `click-coords`, gdy widoczna pozycja w viewporcie jest jedynym niezawodnym celem.
- Ścieżki pobierania, trace i upload są ograniczone do katalogów tymczasowych OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` może także ustawiać wejścia plików bezpośrednio przez `--input-ref` albo `--element`.

Stabilne identyfikatory i etykiety kart przetrwają zastąpienie surowego celu Chromium, gdy OpenClaw
może udowodnić kartę zastępczą, na przykład ten sam URL albo jedna stara karta stająca się
jedną nową kartą po przesłaniu formularza. Surowe identyfikatory celów nadal są zmienne; w skryptach preferuj
`suggestedTargetId` z `tabs`.

Flagi migawek w skrócie:

- `--format ai` (domyślnie z Playwright): migawka AI z odwołaniami numerycznymi (`aria-ref="<n>"`).
- `--format aria`: drzewo dostępności z odwołaniami `axN`. Gdy Playwright jest dostępny, OpenClaw wiąże odwołania z backendowymi identyfikatorami DOM do żywej strony, aby kolejne akcje mogły ich używać; w przeciwnym razie traktuj wyjście wyłącznie jako inspekcyjne.
- `--efficient` (albo `--mode efficient`): kompaktowy preset migawki ról. Ustaw `browser.snapshotDefaults.mode: "efficient"`, aby uczynić go domyślnym (zobacz [konfigurację Gateway](/pl/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` wymuszają migawkę ról z odwołaniami `ref=e12`. `--frame "<iframe>"` zawęża migawki ról do iframe.
- `--labels` dodaje zrzut ekranu tylko viewportu z nałożonymi etykietami odwołań (wypisuje `MEDIA:<path>`).
- `--urls` dołącza wykryte miejsca docelowe linków do migawek AI.

## Migawki i odwołania

OpenClaw obsługuje dwa style „migawek”:

- **Migawka AI (odwołania numeryczne)**: `openclaw browser snapshot` (domyślnie; `--format ai`)
  - Wyjście: migawka tekstowa zawierająca odwołania numeryczne.
  - Akcje: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Wewnętrznie odwołanie jest rozwiązywane przez `aria-ref` Playwright.

- **Migawka ról (odwołania ról takie jak `e12`)**: `openclaw browser snapshot --interactive` (albo `--compact`, `--depth`, `--selector`, `--frame`)
  - Wyjście: lista/drzewo oparte na rolach z `[ref=e12]` (i opcjonalnie `[nth=1]`).
  - Akcje: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Wewnętrznie odwołanie jest rozwiązywane przez `getByRole(...)` (plus `nth()` dla duplikatów).
  - Dodaj `--labels`, aby dołączyć zrzut ekranu viewportu z nałożonymi etykietami `e12`.
  - Dodaj `--urls`, gdy tekst linku jest niejednoznaczny, a agent potrzebuje konkretnych
    celów nawigacji.

- **Migawka ARIA (odwołania ARIA, takie jak `ax12`)**: `openclaw browser snapshot --format aria`
  - Dane wyjściowe: drzewo dostępności jako uporządkowane węzły.
  - Akcje: `openclaw browser click ax12` działa, gdy ścieżka migawki może powiązać
    odwołanie przez Playwright i identyfikatory DOM backendu Chrome.
- Jeśli Playwright jest niedostępny, migawki ARIA nadal mogą być przydatne do
  inspekcji, ale odwołania mogą nie obsługiwać akcji. Ponownie wykonaj migawkę z `--format ai`
  lub `--interactive`, gdy potrzebujesz odwołań akcji.
- Dowód Docker dla awaryjnej ścieżki raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  uruchamia Chromium z CDP, wykonuje `browser doctor --deep` i weryfikuje, że migawki
  ról zawierają adresy URL linków, klikalne elementy promowane kursorem oraz metadane iframe.

Zachowanie odwołań:

- Odwołania **nie są stabilne między nawigacjami**; jeśli coś się nie powiedzie, uruchom ponownie `snapshot` i użyj świeżego odwołania.
- `/act` zwraca bieżący surowy `targetId` po zastąpieniu wywołanym akcją,
  gdy może potwierdzić zastąpioną kartę. Nadal używaj stabilnych identyfikatorów/etykiet kart dla
  kolejnych poleceń.
- Jeśli migawka ról została wykonana z `--frame`, odwołania ról są ograniczone do tego iframe do następnej migawki ról.
- Nieznane lub przestarzałe odwołania `axN` szybko kończą się niepowodzeniem zamiast przechodzić do
  selektora `aria-ref` Playwright. Gdy tak się stanie,
  wykonaj świeżą migawkę na tej samej karcie.

## Ulepszenia czekania

Możesz czekać nie tylko na czas/tekst:

- Czekaj na URL (globy obsługiwane przez Playwright):
  - `openclaw browser wait --url "**/dash"`
- Czekaj na stan ładowania:
  - `openclaw browser wait --load networkidle`
- Czekaj na predykat JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Czekaj, aż selektor stanie się widoczny:
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

Gdy akcja się nie powiedzie (np. „niewidoczne”, „naruszenie trybu ścisłego”, „zasłonięte”):

1. `openclaw browser snapshot --interactive`
2. Użyj `click <ref>` / `type <ref>` (preferuj odwołania ról w trybie interaktywnym)
3. Jeśli nadal się nie powiedzie: `openclaw browser highlight <ref>`, aby zobaczyć, w co celuje Playwright
4. Jeśli strona zachowuje się nietypowo:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Do głębokiego debugowania: nagraj ślad:
   - `openclaw browser trace start`
   - odtwórz problem
   - `openclaw browser trace stop` (wypisuje `TRACE:<path>`)

## Dane wyjściowe JSON

`--json` służy do skryptów i narzędzi strukturalnych.

Przykłady:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Migawki ról w JSON zawierają `refs` oraz mały blok `stats` (lines/chars/refs/interactive), dzięki czemu narzędzia mogą oceniać rozmiar i gęstość ładunku.

## Stan i przełączniki środowiska

Są przydatne w przepływach „spraw, aby witryna zachowywała się jak X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (starsze `set headers --json '{"X-Debug":"1"}'` pozostaje obsługiwane)
- HTTP basic auth: `set credentials user pass` (lub `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (lub `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (presety urządzeń Playwright)
  - `set viewport 1280 720`

## Bezpieczeństwo i prywatność

- Profil przeglądarki openclaw może zawierać zalogowane sesje; traktuj go jako wrażliwy.
- `browser act kind=evaluate` / `openclaw browser evaluate` oraz `wait --fn`
  wykonują dowolny JavaScript w kontekście strony. Wstrzyknięcie promptu może tym sterować.
  Wyłącz to za pomocą `browser.evaluateEnabled=false`, jeśli tego nie potrzebujesz.
- Informacje o logowaniach i uwagach dotyczących mechanizmów antybotowych (X/Twitter itp.) znajdziesz w [Logowanie przez przeglądarkę + publikowanie na X/Twitter](/pl/tools/browser-login).
- Zachowaj prywatność hosta Gateway/węzła (loopback lub tylko tailnet).
- Zdalne punkty końcowe CDP są potężne; tuneluj je i chroń.

Przykład trybu ścisłego (domyślnie blokuj prywatne/wewnętrzne miejsca docelowe):

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

- [Przeglądarka](/pl/tools/browser) - przegląd, konfiguracja, profile, bezpieczeństwo
- [Logowanie przez przeglądarkę](/pl/tools/browser-login) - logowanie do witryn
- [Rozwiązywanie problemów z przeglądarką w Linuksie](/pl/tools/browser-linux-troubleshooting)
- [Rozwiązywanie problemów z przeglądarką WSL2](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
