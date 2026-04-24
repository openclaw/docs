---
read_when:
    - Skryptowanie lub debugowanie przeglądarki agenta przez lokalne API sterowania
    - Szukasz dokumentacji CLI dla `openclaw browser`
    - Dodawanie niestandardowej automatyzacji przeglądarki z snapshotami i referencjami
summary: API sterowania przeglądarką OpenClaw, dokumentacja CLI i akcje skryptowe
title: API sterowania przeglądarką
x-i18n:
    generated_at: "2026-04-24T09:35:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: e29ad295085e2c36a6c2ce01366a4186e45a7ecfe1d3c3072353c55794b05b5f
    source_path: tools/browser-control.md
    workflow: 15
---

Informacje o konfiguracji, rozwiązywaniu problemów i ustawieniach znajdziesz w [Browser](/pl/tools/browser).
Ta strona jest dokumentacją lokalnego HTTP API sterowania, CLI `openclaw browser`
oraz wzorców skryptowych (snapshoty, referencje, oczekiwania, przepływy debugowania).

## Control API (opcjonalne)

Do integracji lokalnych Gateway udostępnia małe loopback HTTP API:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Karty: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/zrzut ekranu: `GET /snapshot`, `POST /screenshot`
- Akcje: `POST /navigate`, `POST /act`
- Hooki: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Pobieranie: `POST /download`, `POST /wait/download`
- Debugowanie: `GET /console`, `POST /pdf`
- Debugowanie: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Sieć: `POST /response/body`
- Stan: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stan: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ustawienia: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Wszystkie endpointy akceptują `?profile=<name>`.

Jeśli skonfigurowano uwierzytelnianie gateway współdzielonym sekretem, trasy HTTP przeglądarki również wymagają auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` albo HTTP Basic auth z tym hasłem

Uwagi:

- To samodzielne loopback API przeglądarki **nie** używa nagłówków tożsamości trusted-proxy ani
  Tailscale Serve.
- Jeśli `gateway.auth.mode` ma wartość `none` albo `trusted-proxy`, te loopbackowe trasy przeglądarki
  nie dziedziczą tych trybów przenoszących tożsamość; zachowaj je tylko dla loopback.

### Kontrakt błędów `/act`

`POST /act` używa ustrukturyzowanej odpowiedzi błędu dla walidacji na poziomie trasy i
awarii polityki:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Bieżące wartości `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): brak `kind` albo jest nierozpoznane.
- `ACT_INVALID_REQUEST` (HTTP 400): ładunek akcji nie przeszedł normalizacji albo walidacji.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): użyto `selector` z nieobsługiwanym rodzajem akcji.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (albo `wait --fn`) jest wyłączone przez konfigurację.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): najwyższego poziomu albo wsadowe `targetId` koliduje z celem żądania.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): akcja nie jest obsługiwana dla profili existing-session.

Inne błędy runtime nadal mogą zwracać `{ "error": "<message>" }` bez pola
`code`.

### Wymaganie Playwright

Niektóre funkcje (navigate/act/AI snapshot/role snapshot, zrzuty ekranów elementów,
PDF) wymagają Playwright. Jeśli Playwright nie jest zainstalowany, te endpointy zwracają
czytelny błąd 501.

Co nadal działa bez Playwright:

- Snapshoty ARIA
- Zrzuty całej strony dla zarządzanej przeglądarki `openclaw`, gdy dostępny jest
  WebSocket CDP per karta
- Zrzuty całej strony dla profili `existing-session` / Chrome MCP
- Zrzuty z referencją `existing-session` (`--ref`) z danych wyjściowych snapshotu

Co nadal wymaga Playwright:

- `navigate`
- `act`
- Snapshoty AI / role snapshoty
- Zrzuty ekranów elementów według selektora CSS (`--element`)
- pełny eksport PDF przeglądarki

Zrzuty ekranów elementów odrzucają także `--full-page`; trasa zwraca `fullPage is
not supported for element screenshots`.

Jeśli widzisz `Playwright is not available in this gateway build`, napraw
dołączone zależności runtime Pluginu przeglądarki tak, aby `playwright-core` było zainstalowane,
a następnie uruchom ponownie gateway. Dla instalacji pakietowych uruchom `openclaw doctor --fix`.
Dla Docker dodatkowo zainstaluj binaria przeglądarki Chromium, jak pokazano poniżej.

#### Instalacja Playwright w Docker

Jeśli Gateway działa w Docker, unikaj `npx playwright` (konflikty nadpisań npm).
Użyj zamiast tego dołączonego CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Aby utrwalić pobrania przeglądarki, ustaw `PLAYWRIGHT_BROWSERS_PATH` (na przykład,
`/home/node/.cache/ms-playwright`) i upewnij się, że `/home/node` jest utrwalone przez
`OPENCLAW_HOME_VOLUME` albo bind mount. Zobacz [Docker](/pl/install/docker).

## Jak to działa (wewnętrznie)

Mały loopbackowy serwer sterowania akceptuje żądania HTTP i łączy się z przeglądarkami opartymi na Chromium przez CDP. Zaawansowane akcje (click/type/snapshot/PDF) przechodzą przez Playwright na CDP; gdy Playwright nie ma, dostępne są tylko operacje niezależne od Playwright. Agent widzi jeden stabilny interfejs, podczas gdy lokalne/zdalne przeglądarki i profile mogą się swobodnie zmieniać pod spodem.

## Szybka dokumentacja CLI

Wszystkie polecenia akceptują `--browser-profile <name>` do wskazania konkretnego profilu oraz `--json` dla danych wyjściowych czytelnych maszynowo.

<AccordionGroup>

<Accordion title="Podstawy: status, karty, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # czyści także emulację w attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # skrót do bieżącej karty
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
openclaw browser screenshot --ref 12        # albo --ref e12
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
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
openclaw browser click 12 --double           # albo e12 dla referencji ról
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
openclaw browser set credentials user pass            # --clear usuwa
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Uwagi:

- `upload` i `dialog` to wywołania **uzbrajające**; uruchom je przed kliknięciem/naciśnięciem, które wywoła chooser/dialog.
- `click`/`type`/itd. wymagają `ref` ze `snapshot` (numeryczne `12` albo referencja roli `e12`). Selektory CSS są celowo nieobsługiwane dla akcji.
- Ścieżki download, trace i upload są ograniczone do katalogów tymczasowych OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` może także bezpośrednio ustawiać inputy plików przez `--input-ref` albo `--element`.

Szybki przegląd flag snapshot:

- `--format ai` (domyślnie z Playwright): AI snapshot z referencjami numerycznymi (`aria-ref="<n>"`).
- `--format aria`: drzewo dostępności, bez referencji; tylko do inspekcji.
- `--efficient` (albo `--mode efficient`): preset kompaktowego role snapshot. Ustaw `browser.snapshotDefaults.mode: "efficient"`, aby był to tryb domyślny (zobacz [Gateway configuration](/pl/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` wymuszają role snapshot z referencjami `ref=e12`. `--frame "<iframe>"` ogranicza role snapshoty do iframe.
- `--labels` dodaje zrzut ekranu tylko viewportu z nałożonymi etykietami referencji (wypisuje `MEDIA:<path>`).

## Snapshoty i referencje

OpenClaw obsługuje dwa style „snapshotów”:

- **AI snapshot (referencje numeryczne)**: `openclaw browser snapshot` (domyślnie; `--format ai`)
  - Dane wyjściowe: tekstowy snapshot zawierający referencje numeryczne.
  - Akcje: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Wewnętrznie referencja jest rozwiązywana przez `aria-ref` Playwright.

- **Role snapshot (referencje ról jak `e12`)**: `openclaw browser snapshot --interactive` (albo `--compact`, `--depth`, `--selector`, `--frame`)
  - Dane wyjściowe: lista/drzewo oparte na rolach z `[ref=e12]` (i opcjonalnie `[nth=1]`).
  - Akcje: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Wewnętrznie referencja jest rozwiązywana przez `getByRole(...)` (plus `nth()` dla duplikatów).
  - Dodaj `--labels`, aby dołączyć zrzut viewportu z nałożonymi etykietami `e12`.

Zachowanie referencji:

- Referencje **nie są stabilne między nawigacjami**; jeśli coś się nie powiedzie, ponownie uruchom `snapshot` i użyj świeżej referencji.
- Jeśli role snapshot został wykonany z `--frame`, referencje ról są ograniczone do tego iframe do następnego role snapshotu.

## Ulepszone oczekiwanie

Możesz czekać na więcej niż tylko czas/tekst:

- Czekaj na URL (obsługiwane globy Playwright):
  - `openclaw browser wait --url "**/dash"`
- Czekaj na stan ładowania:
  - `openclaw browser wait --load networkidle`
- Czekaj na predykat JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Czekaj, aż selektor stanie się widoczny:
  - `openclaw browser wait "#main"`

Można to łączyć:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Przepływy debugowania

Gdy akcja kończy się błędem (np. „not visible”, „strict mode violation”, „covered”):

1. `openclaw browser snapshot --interactive`
2. Użyj `click <ref>` / `type <ref>` (w trybie interactive preferuj referencje ról)
3. Jeśli nadal nie działa: `openclaw browser highlight <ref>`, aby zobaczyć, co Playwright targetuje
4. Jeśli strona zachowuje się dziwnie:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Do głębokiego debugowania nagraj trace:
   - `openclaw browser trace start`
   - odtwórz problem
   - `openclaw browser trace stop` (wypisuje `TRACE:<path>`)

## Wyjście JSON

`--json` służy do skryptów i narzędzi uporządkowanych.

Przykłady:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshoty w JSON zawierają `refs` oraz mały blok `stats` (wiersze/znaki/refy/interactive), dzięki czemu narzędzia mogą analizować rozmiar i gęstość ładunku.

## Pokrętła stanu i środowiska

Są przydatne dla przepływów typu „spraw, żeby strona zachowywała się jak X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Nagłówki: `set headers --headers-json '{"X-Debug":"1"}'` (starsze `set headers --json '{"X-Debug":"1"}'` nadal jest obsługiwane)
- HTTP Basic auth: `set credentials user pass` (albo `--clear`)
- Geolokalizacja: `set geo <lat> <lon> --origin "https://example.com"` (albo `--clear`)
- Media: `set media dark|light|no-preference|none`
- Strefa czasowa / locale: `set timezone ...`, `set locale ...`
- Urządzenie / viewport:
  - `set device "iPhone 14"` (presety urządzeń Playwright)
  - `set viewport 1280 720`

## Bezpieczeństwo i prywatność

- Profil przeglądarki openclaw może zawierać zalogowane sesje; traktuj go jako wrażliwy.
- `browser act kind=evaluate` / `openclaw browser evaluate` oraz `wait --fn`
  wykonują dowolny JavaScript w kontekście strony. Prompt injection może tym sterować.
  Wyłącz to przez `browser.evaluateEnabled=false`, jeśli tego nie potrzebujesz.
- Informacje o logowaniach i uwagach anty-bot (X/Twitter itd.) znajdziesz w [Browser login + X/Twitter posting](/pl/tools/browser-login).
- Utrzymuj host Gateway/Node jako prywatny (tylko loopback albo tailnet).
- Zdalne endpointy CDP mają duże możliwości; tuneluj je i chroń.

Przykład strict-mode (domyślnie blokuj prywatne/wewnętrzne cele):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // opcjonalnie dokładne zezwolenie
    },
  },
}
```

## Powiązane

- [Browser](/pl/tools/browser) — przegląd, konfiguracja, profile, bezpieczeństwo
- [Browser login](/pl/tools/browser-login) — logowanie do stron
- [Browser Linux troubleshooting](/pl/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
