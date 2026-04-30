---
read_when:
    - Tworzenie skryptów lub debugowanie przeglądarki agenta za pomocą lokalnego interfejsu API sterowania
    - Szukasz dokumentacji referencyjnej CLI `openclaw browser`
    - Dodawanie niestandardowej automatyzacji przeglądarki z migawkami i odwołaniami
summary: API sterowania przeglądarką OpenClaw, dokumentacja referencyjna CLI i akcje skryptowe
title: API sterowania przeglądarką
x-i18n:
    generated_at: "2026-04-30T10:20:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bd0c0e5a5be9a8ec865c932d28456ace6a047d15a534a79c0b81a5e8904736f
    source_path: tools/browser-control.md
    workflow: 16
---

Do konfiguracji, ustawień i rozwiązywania problemów zobacz [Przeglądarka](/pl/tools/browser).
Ta strona jest materiałem referencyjnym dla lokalnego kontrolnego API HTTP, CLI `openclaw browser`
oraz wzorców skryptowania (zrzuty, referencje, oczekiwania, przepływy debugowania).

## Kontrolne API (opcjonalne)

Tylko dla lokalnych integracji Gateway udostępnia małe API HTTP local loopback:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Karty: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Zrzut/zrzut ekranu: `GET /snapshot`, `POST /screenshot`
- Akcje: `POST /navigate`, `POST /act`
- Hooki: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Pobrania: `POST /download`, `POST /wait/download`
- Uprawnienia: `POST /permissions/grant`
- Debugowanie: `GET /console`, `POST /pdf`
- Debugowanie: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Sieć: `POST /response/body`
- Stan: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stan: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ustawienia: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Wszystkie endpointy akceptują `?profile=<name>`. `POST /start?headless=true` żąda
jednorazowego uruchomienia bez interfejsu dla lokalnych profili zarządzanych bez zmiany utrwalonej
konfiguracji przeglądarki; profile tylko z dołączaniem, zdalne CDP i istniejące sesje odrzucają
to nadpisanie, ponieważ OpenClaw nie uruchamia tych procesów przeglądarki.

Jeśli skonfigurowano uwierzytelnianie Gateway współdzielonym sekretem, trasy HTTP przeglądarki także wymagają uwierzytelnienia:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` albo uwierzytelnianie HTTP Basic z tym hasłem

Uwagi:

- To samodzielne API przeglądarki local loopback **nie** używa nagłówków tożsamości trusted-proxy ani
  Tailscale Serve.
- Jeśli `gateway.auth.mode` ma wartość `none` albo `trusted-proxy`, te trasy przeglądarki local loopback
  nie dziedziczą tych trybów niosących tożsamość; utrzymuj je jako dostępne tylko przez local loopback.

### Kontrakt błędu `/act`

`POST /act` używa ustrukturyzowanej odpowiedzi błędu dla walidacji na poziomie trasy i
błędów zasad:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Bieżące wartości `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): brakuje `kind` albo nie jest rozpoznany.
- `ACT_INVALID_REQUEST` (HTTP 400): ładunek akcji nie przeszedł normalizacji lub walidacji.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` został użyty z nieobsługiwanym rodzajem akcji.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (albo `wait --fn`) jest wyłączone w konfiguracji.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): najwyższego poziomu albo wsadowy `targetId` koliduje z celem żądania.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): akcja nie jest obsługiwana dla profili istniejącej sesji.

Inne błędy czasu wykonywania nadal mogą zwracać `{ "error": "<message>" }` bez pola
`code`.

### Wymaganie Playwright

Niektóre funkcje (navigate/act/zrzut AI/zrzut roli, zrzuty ekranu elementów,
PDF) wymagają Playwright. Jeśli Playwright nie jest zainstalowany, te endpointy zwracają
czytelny błąd 501.

Co nadal działa bez Playwright:

- Zrzuty ARIA
- Zrzuty dostępności w stylu ról (`--interactive`, `--compact`,
  `--depth`, `--efficient`), gdy dostępny jest WebSocket CDP dla karty. To jest
  ścieżka awaryjna do inspekcji i odkrywania referencji; Playwright pozostaje głównym
  silnikiem akcji.
- Zrzuty ekranu strony dla zarządzanej przeglądarki `openclaw`, gdy dostępny jest
  WebSocket CDP dla karty
- Zrzuty ekranu strony dla profili `existing-session` / Chrome MCP
- Zrzuty ekranu oparte na referencjach `existing-session` (`--ref`) z wyjścia zrzutu

Co nadal wymaga Playwright:

- `navigate`
- `act`
- Zrzuty AI zależne od natywnego formatu zrzutu AI Playwright
- Zrzuty ekranu elementów przez selektor CSS (`--element`)
- pełny eksport PDF przeglądarki

Zrzuty ekranu elementów odrzucają także `--full-page`; trasa zwraca komunikat `fullPage is
not supported for element screenshots`.

Jeśli widzisz `Playwright is not available in this gateway build`, napraw
zależności czasu wykonywania dołączonego Plugin przeglądarki, aby `playwright-core` było zainstalowane,
a następnie uruchom ponownie Gateway. Dla instalacji pakietowych uruchom `openclaw doctor --fix`.
Dla Docker zainstaluj też pliki binarne przeglądarki Chromium, jak pokazano poniżej.

#### Instalacja Playwright w Docker

Jeśli Twój Gateway działa w Docker, unikaj `npx playwright` (konflikty nadpisań npm).
Zamiast tego użyj dołączonego CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Aby utrwalić pobrania przeglądarki, ustaw `PLAYWRIGHT_BROWSERS_PATH` (na przykład
`/home/node/.cache/ms-playwright`) i upewnij się, że `/home/node` jest utrwalone przez
`OPENCLAW_HOME_VOLUME` albo montowanie bind. Zobacz [Docker](/pl/install/docker).

## Jak to działa (wewnętrznie)

Mały serwer kontrolny local loopback przyjmuje żądania HTTP i łączy się z przeglądarkami opartymi na Chromium przez CDP. Zaawansowane akcje (click/type/snapshot/PDF) przechodzą przez Playwright na CDP; gdy brakuje Playwright, dostępne są tylko operacje niezależne od Playwright. Agent widzi jeden stabilny interfejs, podczas gdy lokalne/zdalne przeglądarki i profile swobodnie zmieniają się pod spodem.

## Szybka referencja CLI

Wszystkie polecenia akceptują `--browser-profile <name>`, aby wskazać konkretny profil, oraz `--json` dla wyjścia czytelnego maszynowo.

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

<Accordion title="Inspekcja: zrzut ekranu, zrzut, konsola, błędy, żądania">

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

- `upload` i `dialog` są wywołaniami **uzbrajającymi**; uruchom je przed kliknięciem/naciśnięciem, które wyzwala selektor/okno dialogowe.
- `click`/`type`/itd. wymagają `ref` ze `snapshot` (numeryczne `12`, referencja roli `e12` albo wykonywalna referencja ARIA `ax12`). Selektory CSS celowo nie są obsługiwane dla akcji. Użyj `click-coords`, gdy widoczna pozycja w widoku jest jedynym wiarygodnym celem.
- Ścieżki pobierania, śladu i przesyłania są ograniczone do tymczasowych katalogów głównych OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (zastępczo: `${os.tmpdir()}/openclaw/...`).
- `upload` może też ustawiać pola plików bezpośrednio przez `--input-ref` albo `--element`.

Stabilne identyfikatory kart i etykiety przeżywają zastąpienie surowego celu Chromium, gdy OpenClaw
może udowodnić kartę zastępującą, na przykład ten sam URL albo jedna stara karta stająca się
jedną nową kartą po przesłaniu formularza. Surowe identyfikatory celów nadal są zmienne; w skryptach preferuj
`suggestedTargetId` z `tabs`.

Flagi zrzutu w skrócie:

- `--format ai` (domyślnie z Playwright): zrzut AI z numerycznymi referencjami (`aria-ref="<n>"`).
- `--format aria`: drzewo dostępności z referencjami `axN`. Gdy Playwright jest dostępny, OpenClaw wiąże referencje z identyfikatorami DOM backendu do żywej strony, aby kolejne akcje mogły ich używać; w przeciwnym razie traktuj wyjście tylko jako inspekcyjne.
- `--efficient` (albo `--mode efficient`): kompaktowy preset zrzutu roli. Ustaw `browser.snapshotDefaults.mode: "efficient"`, aby uczynić go domyślnym (zobacz [Konfiguracja Gateway](/pl/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` wymuszają zrzut roli z referencjami `ref=e12`. `--frame "<iframe>"` zawęża zrzuty ról do iframe.
- `--labels` dodaje zrzut ekranu tylko widoku z nałożonymi etykietami referencji (wypisuje `MEDIA:<path>`).
- `--urls` dołącza odkryte miejsca docelowe linków do zrzutów AI.

## Zrzuty i referencje

OpenClaw obsługuje dwa style „zrzutu”:

- **Zrzut AI (referencje numeryczne)**: `openclaw browser snapshot` (domyślnie; `--format ai`)
  - Wyjście: zrzut tekstowy zawierający referencje numeryczne.
  - Akcje: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Wewnętrznie referencja jest rozwiązywana przez `aria-ref` Playwright.

- **Zrzut roli (referencje roli, takie jak `e12`)**: `openclaw browser snapshot --interactive` (albo `--compact`, `--depth`, `--selector`, `--frame`)
  - Wyjście: lista/drzewo oparte na rolach z `[ref=e12]` (i opcjonalnie `[nth=1]`).
  - Akcje: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Wewnętrznie referencja jest rozwiązywana przez `getByRole(...)` (plus `nth()` dla duplikatów).
  - Dodaj `--labels`, aby uwzględnić zrzut ekranu widoku z nałożonymi etykietami `e12`.
  - Dodaj `--urls`, gdy tekst linku jest niejednoznaczny, a agent potrzebuje konkretnych
    celów nawigacji.

- **Zrzut ARIA (referencje ARIA, takie jak `ax12`)**: `openclaw browser snapshot --format aria`
  - Wyjście: drzewo dostępności jako ustrukturyzowane węzły.
  - Akcje: `openclaw browser click ax12` działa, gdy ścieżka zrzutu może powiązać
    referencję przez Playwright i identyfikatory DOM backendu Chrome.
- Jeśli Playwright jest niedostępny, zrzuty ARIA nadal mogą być użyteczne do
  inspekcji, ale referencje mogą nie być wykonywalne. Wykonaj ponownie zrzut z `--format ai`
  albo `--interactive`, gdy potrzebujesz referencji akcji.
- Dowód Docker dla ścieżki awaryjnej raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  uruchamia Chromium z CDP, uruchamia `browser doctor --deep` i weryfikuje, że zrzuty ról
  zawierają adresy URL linków, klikalne elementy wypromowane przez kursor oraz metadane iframe.

Zachowanie referencji:

- Odwołania **nie są stabilne między nawigacjami**; jeśli coś się nie powiedzie, uruchom ponownie `snapshot` i użyj świeżego odwołania.
- `/act` zwraca bieżący surowy `targetId` po zastąpieniu wywołanym akcją,
  gdy może potwierdzić zastąpioną kartę. Do kolejnych poleceń nadal używaj stabilnych identyfikatorów/etykiet kart.
- Jeśli migawka ról została wykonana z `--frame`, odwołania ról są ograniczone do tego iframe aż do następnej migawki ról.
- Nieznane lub nieaktualne odwołania `axN` kończą się szybko błędem zamiast przechodzić do
  selektora `aria-ref` Playwright. Gdy tak się stanie, uruchom świeżą migawkę na tej samej karcie.

## Ulepszenia oczekiwania

Możesz czekać nie tylko na czas/tekst:

- Czekaj na adres URL (globy obsługiwane przez Playwright):
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
2. Użyj `click <ref>` / `type <ref>` (w trybie interaktywnym preferuj odwołania ról)
3. Jeśli nadal się nie powiedzie: `openclaw browser highlight <ref>`, aby zobaczyć, co celuje Playwright
4. Jeśli strona zachowuje się nietypowo:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Do głębokiego debugowania: nagraj ślad:
   - `openclaw browser trace start`
   - odtwórz problem
   - `openclaw browser trace stop` (drukuje `TRACE:<path>`)

## Dane wyjściowe JSON

`--json` służy do skryptowania i narzędzi strukturalnych.

Przykłady:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Migawki ról w JSON zawierają `refs` oraz mały blok `stats` (lines/chars/refs/interactive), aby narzędzia mogły wnioskować o rozmiarze i gęstości ładunku.

## Stan i przełączniki środowiska

Przydają się w przepływach typu „spraw, aby strona zachowywała się jak X”:

- Ciasteczka: `cookies`, `cookies set`, `cookies clear`
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

- Profil przeglądarki openclaw może zawierać zalogowane sesje; traktuj go jako poufny.
- `browser act kind=evaluate` / `openclaw browser evaluate` oraz `wait --fn`
  wykonują dowolny JavaScript w kontekście strony. Prompt injection może tym sterować.
  Wyłącz to za pomocą `browser.evaluateEnabled=false`, jeśli tego nie potrzebujesz.
- Informacje o logowaniu i uwagi dotyczące zabezpieczeń antybotowych (X/Twitter itp.) znajdziesz w [Logowanie w przeglądarce + publikowanie na X/Twitter](/pl/tools/browser-login).
- Zachowaj prywatność hosta Gateway/node (loopback lub tylko tailnet).
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

- [Przeglądarka](/pl/tools/browser) — omówienie, konfiguracja, profile, bezpieczeństwo
- [Logowanie w przeglądarce](/pl/tools/browser-login) — logowanie do witryn
- [Rozwiązywanie problemów z przeglądarką w Linux](/pl/tools/browser-linux-troubleshooting)
- [Rozwiązywanie problemów z przeglądarką w WSL2](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
