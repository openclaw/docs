---
read_when:
    - Skryptowanie lub debugowanie przeglądarki agenta za pomocą lokalnego API sterowania
    - Szukasz dokumentacji referencyjnej CLI `openclaw browser`
    - Dodawanie niestandardowej automatyzacji przeglądarki z migawkami i referencjami
summary: API sterowania przeglądarką OpenClaw, dokumentacja referencyjna CLI i akcje skryptowe
title: Interfejs API sterowania przeglądarką
x-i18n:
    generated_at: "2026-05-06T09:31:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5367561122448fa21037c9125581eb38b7f01413310e9f9ca5880942acfffa5d
    source_path: tools/browser-control.md
    workflow: 16
---

W celu konfiguracji, ustawień i rozwiązywania problemów zobacz [Przeglądarka](/pl/tools/browser).
Ta strona jest dokumentacją referencyjną dla lokalnego API HTTP sterowania, CLI `openclaw browser`
oraz wzorców skryptowych (migawki, refs, oczekiwania, przepływy debugowania).

## API sterowania (opcjonalne)

Wyłącznie dla lokalnych integracji Gateway udostępnia małe API HTTP loopback:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Karty: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Migawka/zrzut ekranu: `GET /snapshot`, `POST /screenshot`
- Akcje: `POST /navigate`, `POST /act`
- Haki: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Pobieranie: `POST /download`, `POST /wait/download`
- Uprawnienia: `POST /permissions/grant`
- Debugowanie: `GET /console`, `POST /pdf`
- Debugowanie: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Sieć: `POST /response/body`
- Stan: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stan: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ustawienia: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Wszystkie punkty końcowe akceptują `?profile=<name>`. `POST /start?headless=true` żąda
jednorazowego uruchomienia headless dla lokalnych profili zarządzanych bez zmiany utrwalonej
konfiguracji przeglądarki; profile attach-only, zdalne CDP i istniejących sesji odrzucają
to nadpisanie, ponieważ OpenClaw nie uruchamia tych procesów przeglądarki.

Jeśli skonfigurowano uwierzytelnianie Gateway za pomocą współdzielonego sekretu, trasy HTTP przeglądarki również wymagają uwierzytelnienia:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` albo uwierzytelnienie HTTP Basic z tym hasłem

Uwagi:

- To samodzielne API przeglądarki loopback **nie** używa nagłówków tożsamości trusted-proxy ani
  Tailscale Serve.
- Jeśli `gateway.auth.mode` to `none` albo `trusted-proxy`, te trasy przeglądarki loopback
  nie dziedziczą tych trybów niosących tożsamość; trzymaj je wyłącznie w trybie loopback.

### Kontrakt błędów `/act`

`POST /act` używa strukturalnej odpowiedzi błędu dla walidacji na poziomie trasy i
błędów zasad:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Bieżące wartości `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): brakuje `kind` albo jest nierozpoznany.
- `ACT_INVALID_REQUEST` (HTTP 400): ładunek akcji nie przeszedł normalizacji lub walidacji.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` został użyty z nieobsługiwanym rodzajem akcji.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (albo `wait --fn`) jest wyłączone przez konfigurację.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): najwyższego poziomu albo wsadowy `targetId` koliduje z celem żądania.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): akcja nie jest obsługiwana dla profili istniejącej sesji.

Inne błędy czasu wykonywania nadal mogą zwracać `{ "error": "<message>" }` bez pola
`code`.

### Wymaganie Playwright

Niektóre funkcje (navigate/act/migawka AI/migawka roli, zrzuty ekranu elementów,
PDF) wymagają Playwright. Jeśli Playwright nie jest zainstalowany, te punkty końcowe zwracają
jasny błąd 501.

Co nadal działa bez Playwright:

- Migawki ARIA
- Migawki dostępności w stylu ról (`--interactive`, `--compact`,
  `--depth`, `--efficient`), gdy dostępny jest WebSocket CDP dla pojedynczej karty. To jest
  ścieżka awaryjna do inspekcji i odkrywania refs; Playwright pozostaje głównym
  silnikiem akcji.
- Zrzuty ekranu stron dla zarządzanej przeglądarki `openclaw`, gdy dostępny jest
  WebSocket CDP dla pojedynczej karty
- Zrzuty ekranu stron dla profili `existing-session` / Chrome MCP
- Zrzuty ekranu oparte na refs (`--ref`) z wyjścia migawki dla `existing-session`

Co nadal wymaga Playwright:

- `navigate`
- `act`
- Migawki AI zależne od natywnego formatu migawki AI Playwright
- Zrzuty ekranu elementów selektorem CSS (`--element`)
- Pełny eksport PDF przeglądarki

Zrzuty ekranu elementów odrzucają też `--full-page`; trasa zwraca `fullPage is
not supported for element screenshots`.

Jeśli widzisz `Playwright is not available in this gateway build`, spakowany
Gateway nie ma podstawowej zależności środowiska uruchomieniowego przeglądarki. Zainstaluj ponownie lub zaktualizuj
OpenClaw, a następnie zrestartuj Gateway. Dla Docker zainstaluj także binaria przeglądarki
Chromium, jak pokazano niżej.

#### Instalacja Playwright w Docker

Jeśli Twój Gateway działa w Docker, unikaj `npx playwright` (konflikty nadpisań npm).
Zamiast tego użyj dołączonego CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Aby utrwalić pobierane przeglądarki, ustaw `PLAYWRIGHT_BROWSERS_PATH` (na przykład
`/home/node/.cache/ms-playwright`) i upewnij się, że `/home/node` jest utrwalone przez
`OPENCLAW_HOME_VOLUME` albo bind mount. Zobacz [Docker](/pl/install/docker).

## Jak to działa (wewnętrznie)

Mały serwer sterowania loopback przyjmuje żądania HTTP i łączy się z przeglądarkami opartymi na Chromium przez CDP. Zaawansowane akcje (click/type/snapshot/PDF) przechodzą przez Playwright nad CDP; gdy brakuje Playwright, dostępne są tylko operacje niezależne od Playwright. Agent widzi jeden stabilny interfejs, podczas gdy lokalne/zdalne przeglądarki i profile mogą się pod spodem swobodnie zmieniać.

## Szybka dokumentacja CLI

Wszystkie polecenia akceptują `--browser-profile <name>` do wskazania konkretnego profilu oraz `--json` dla wyjścia czytelnego maszynowo.

<AccordionGroup>

<Accordion title="Podstawy: status, karty, open/focus/close">

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

<Accordion title="Inspekcja: screenshot, snapshot, console, errors, requests">

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

<Accordion title="Akcje: navigate, click, type, drag, wait, evaluate">

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

<Accordion title="Stan: cookies, storage, offline, headers, geo, device">

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

- `upload` i `dialog` są wywołaniami **uzbrajającymi**; uruchom je przed kliknięciem/naciśnięciem wyzwalającym wybierak/okno dialogowe.
- `click`/`type`/itd. wymagają `ref` z `snapshot` (numeryczny `12`, ref roli `e12` albo używalny ref ARIA `ax12`). Selektory CSS celowo nie są obsługiwane dla akcji. Użyj `click-coords`, gdy widoczna pozycja w viewport jest jedynym wiarygodnym celem.
- Ścieżki pobierania, śledzenia i wysyłania są ograniczone do katalogów tymczasowych OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (awaryjnie: `${os.tmpdir()}/openclaw/...`).
- `upload` może też ustawiać wejścia plików bezpośrednio przez `--input-ref` albo `--element`.

Stabilne identyfikatory i etykiety kart przetrwają zastąpienie surowego celu Chromium, gdy OpenClaw
może potwierdzić kartę zastępującą, na przykład ten sam URL albo sytuację, w której jedna stara karta staje się
jedną nową kartą po przesłaniu formularza. Surowe identyfikatory celów nadal są zmienne; w skryptach preferuj
`suggestedTargetId` z `tabs`.

Flagi migawek w skrócie:

- `--format ai` (domyślne z Playwright): migawka AI z numerycznymi refs (`aria-ref="<n>"`).
- `--format aria`: drzewo dostępności z refs `axN`. Gdy Playwright jest dostępny, OpenClaw wiąże refs z backendowymi identyfikatorami DOM z bieżącą stroną, aby kolejne akcje mogły ich używać; w przeciwnym razie traktuj wyjście wyłącznie jako inspekcyjne.
- `--efficient` (albo `--mode efficient`): kompaktowy preset migawki roli. Ustaw `browser.snapshotDefaults.mode: "efficient"`, aby uczynić go domyślnym (zobacz [konfigurację Gateway](/pl/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` wymuszają migawkę roli z refs `ref=e12`. `--frame "<iframe>"` ogranicza migawki ról do iframe.
- `--labels` dodaje zrzut ekranu tylko viewport z nałożonymi etykietami refs (wypisuje `MEDIA:<path>`).
- `--urls` dołącza odkryte cele linków do migawek AI.

## Migawki i refs

OpenClaw obsługuje dwa style „migawek”:

- **Migawka AI (numeryczne refs)**: `openclaw browser snapshot` (domyślnie; `--format ai`)
  - Wyjście: tekstowa migawka zawierająca numeryczne refs.
  - Akcje: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Wewnętrznie ref jest rozwiązywany przez `aria-ref` Playwright.

- **Migawka roli (refs ról, takie jak `e12`)**: `openclaw browser snapshot --interactive` (albo `--compact`, `--depth`, `--selector`, `--frame`)
  - Wyjście: lista/drzewo oparte na rolach z `[ref=e12]` (i opcjonalnie `[nth=1]`).
  - Akcje: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Wewnętrznie ref jest rozwiązywany przez `getByRole(...)` (plus `nth()` dla duplikatów).
  - Dodaj `--labels`, aby dołączyć zrzut ekranu viewport z nałożonymi etykietami `e12`.
  - Dodaj `--urls`, gdy tekst linku jest niejednoznaczny, a agent potrzebuje konkretnych
    celów nawigacji.

- **Migawka ARIA (refs ARIA, takie jak `ax12`)**: `openclaw browser snapshot --format aria`
  - Wyjście: drzewo dostępności jako ustrukturyzowane węzły.
  - Akcje: `openclaw browser click ax12` działa, gdy ścieżka migawki może powiązać
    ref przez Playwright i backendowe identyfikatory DOM Chrome.
- Jeśli Playwright jest niedostępny, migawki ARIA nadal mogą być przydatne do
  inspekcji, ale refs mogą nie być używalne do akcji. Wykonaj ponowną migawkę z `--format ai`
  albo `--interactive`, gdy potrzebujesz refs do akcji.
- Dowód Docker dla ścieżki awaryjnej raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  uruchamia Chromium z CDP, wykonuje `browser doctor --deep` i sprawdza, czy migawki ról
  zawierają URL-e linków, elementy klikalne promowane kursorem oraz metadane iframe.

Zachowanie refs:

- Refs są **niestabilne między nawigacjami**; jeśli coś zawiedzie, uruchom ponownie `snapshot` i użyj świeżego ref.
- `/act` zwraca bieżący surowy `targetId` po zastąpieniu wywołanym akcją,
  gdy może potwierdzić kartę zastępczą. Dla kolejnych poleceń nadal używaj stabilnych identyfikatorów/etykiet kart.
- Jeśli snapshot ról został wykonany z `--frame`, refy ról są ograniczone do tego iframe aż do następnego snapshotu ról.
- Nieznane lub nieaktualne refy `axN` szybko kończą się błędem zamiast przechodzić do
  selektora `aria-ref` Playwright. Gdy to się stanie, uruchom świeży snapshot na tej samej karcie.

## Ulepszenia oczekiwania

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

Gdy akcja zawiedzie (np. „niewidoczne”, „naruszenie trybu ścisłego”, „zasłonięte”):

1. `openclaw browser snapshot --interactive`
2. Użyj `click <ref>` / `type <ref>` (w trybie interaktywnym preferuj refy ról)
3. Jeśli nadal zawodzi: `openclaw browser highlight <ref>`, aby zobaczyć, w co celuje Playwright
4. Jeśli strona zachowuje się nietypowo:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Do głębokiego debugowania: nagraj ślad:
   - `openclaw browser trace start`
   - odtwórz problem
   - `openclaw browser trace stop` (wypisuje `TRACE:<path>`)

## Wyjście JSON

`--json` służy do skryptów i narzędzi strukturalnych.

Przykłady:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Snapshoty ról w JSON zawierają `refs` oraz mały blok `stats` (wiersze/znaki/refy/interaktywność), aby narzędzia mogły oceniać rozmiar i gęstość ładunku.

## Stan i ustawienia środowiska

Są przydatne w przepływach typu „spraw, aby witryna zachowywała się jak X”:

- Pliki cookie: `cookies`, `cookies set`, `cookies clear`
- Magazyn: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Nagłówki: `set headers --headers-json '{"X-Debug":"1"}'` (starsze `set headers --json '{"X-Debug":"1"}'` pozostaje obsługiwane)
- Podstawowe uwierzytelnianie HTTP: `set credentials user pass` (lub `--clear`)
- Geolokalizacja: `set geo <lat> <lon> --origin "https://example.com"` (lub `--clear`)
- Media: `set media dark|light|no-preference|none`
- Strefa czasowa / ustawienia regionalne: `set timezone ...`, `set locale ...`
- Urządzenie / viewport:
  - `set device "iPhone 14"` (presety urządzeń Playwright)
  - `set viewport 1280 720`

## Bezpieczeństwo i prywatność

- Profil przeglądarki openclaw może zawierać zalogowane sesje; traktuj go jako wrażliwy.
- `browser act kind=evaluate` / `openclaw browser evaluate` oraz `wait --fn`
  wykonują dowolny JavaScript w kontekście strony. Prompt injection może tym sterować.
  Wyłącz to za pomocą `browser.evaluateEnabled=false`, jeśli tego nie potrzebujesz.
- Informacje o logowaniu i uwagi dotyczące zabezpieczeń antybotowych (X/Twitter itd.) znajdziesz w [Logowanie w przeglądarce + publikowanie na X/Twitter](/pl/tools/browser-login).
- Utrzymuj host Gateway/node jako prywatny (loopback lub tylko tailnet).
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

- [Przeglądarka](/pl/tools/browser) - omówienie, konfiguracja, profile, bezpieczeństwo
- [Logowanie w przeglądarce](/pl/tools/browser-login) - logowanie do witryn
- [Rozwiązywanie problemów z przeglądarką w Linuksie](/pl/tools/browser-linux-troubleshooting)
- [Rozwiązywanie problemów z przeglądarką WSL2](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
