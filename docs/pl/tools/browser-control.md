---
read_when:
    - Skryptowanie lub debugowanie przeglądarki agenta za pomocą lokalnego API sterowania
    - Szukasz dokumentacji referencyjnej CLI `openclaw browser`
    - Dodawanie niestandardowej automatyzacji przeglądarki przy użyciu migawek i referencji
summary: API sterowania przeglądarką OpenClaw, dokumentacja referencyjna CLI i akcje skryptowe
title: Interfejs API sterowania przeglądarką
x-i18n:
    generated_at: "2026-05-02T10:03:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef996319c09bfa8de9b5c3a340c68496ac3698295b62f4f07c79f3e233eda2a2
    source_path: tools/browser-control.md
    workflow: 16
---

Do konfiguracji, ustawień i rozwiązywania problemów zobacz [Przeglądarkę](/pl/tools/browser).
Ta strona jest dokumentacją referencyjną lokalnego API HTTP sterowania, CLI `openclaw browser`
oraz wzorców skryptowych (migawki, odwołania, oczekiwania, przepływy debugowania).

## API sterowania (opcjonalne)

Tylko na potrzeby lokalnych integracji Gateway udostępnia małe API HTTP local loopback:

- Stan/uruchamianie/zatrzymywanie: `GET /`, `POST /start`, `POST /stop`
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
jednorazowego uruchomienia bez interfejsu dla lokalnych profili zarządzanych bez zmieniania utrwalonej
konfiguracji przeglądarki; profile typu attach-only, zdalne CDP i istniejących sesji odrzucają
to nadpisanie, ponieważ OpenClaw nie uruchamia tych procesów przeglądarki.

Jeśli skonfigurowano uwierzytelnianie Gateway z sekretem współdzielonym, trasy HTTP przeglądarki również wymagają uwierzytelniania:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` lub HTTP Basic auth z tym hasłem

Uwagi:

- To samodzielne API przeglądarki local loopback **nie** używa nagłówków tożsamości trusted-proxy ani
  Tailscale Serve.
- Jeśli `gateway.auth.mode` ma wartość `none` lub `trusted-proxy`, te trasy przeglądarki local loopback
  nie dziedziczą trybów przenoszących tożsamość; pozostaw je wyłącznie jako local loopback.

### Kontrakt błędów `/act`

`POST /act` używa ustrukturyzowanej odpowiedzi błędu dla walidacji na poziomie trasy i
błędów zasad:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Bieżące wartości `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): brakuje `kind` albo nie jest rozpoznany.
- `ACT_INVALID_REQUEST` (HTTP 400): ładunek akcji nie przeszedł normalizacji lub walidacji.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): użyto `selector` z nieobsługiwanym rodzajem akcji.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (lub `wait --fn`) jest wyłączone przez konfigurację.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): najwyższego poziomu albo wsadowe `targetId` koliduje z celem żądania.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): akcja nie jest obsługiwana dla profili istniejącej sesji.

Inne błędy wykonania nadal mogą zwracać `{ "error": "<message>" }` bez pola
`code`.

### Wymaganie Playwright

Niektóre funkcje (navigate/act/migawka AI/migawka ról, zrzuty ekranu elementów,
PDF) wymagają Playwright. Jeśli Playwright nie jest zainstalowany, te punkty końcowe zwracają
czytelny błąd 501.

Co nadal działa bez Playwright:

- Migawki ARIA
- Migawki dostępności w stylu ról (`--interactive`, `--compact`,
  `--depth`, `--efficient`), gdy dostępny jest WebSocket CDP dla danej karty. To jest
  mechanizm zapasowy do inspekcji i odkrywania odwołań; Playwright pozostaje głównym
  silnikiem akcji.
- Zrzuty ekranu strony dla zarządzanej przeglądarki `openclaw`, gdy dostępny jest WebSocket CDP
  dla danej karty
- Zrzuty ekranu strony dla profili `existing-session` / Chrome MCP
- Zrzuty ekranu oparte na odwołaniach `existing-session` (`--ref`) z wyniku migawki

Co nadal wymaga Playwright:

- `navigate`
- `act`
- Migawki AI, które zależą od natywnego formatu migawek AI Playwright
- Zrzuty ekranu elementów według selektora CSS (`--element`)
- pełny eksport przeglądarki do PDF

Zrzuty ekranu elementów odrzucają też `--full-page`; trasa zwraca komunikat `fullPage is
not supported for element screenshots`.

Jeśli widzisz `Playwright is not available in this gateway build`, spakowany
Gateway nie ma podstawowej zależności środowiska przeglądarki. Zainstaluj ponownie lub zaktualizuj
OpenClaw, a następnie zrestartuj Gateway. W przypadku Docker zainstaluj też pliki binarne przeglądarki
Chromium, jak pokazano poniżej.

#### Instalacja Playwright w Docker

Jeśli Twój Gateway działa w Docker, unikaj `npx playwright` (konflikty nadpisań npm).
Zamiast tego użyj dołączonego CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Aby zachować pobrane przeglądarki, ustaw `PLAYWRIGHT_BROWSERS_PATH` (na przykład
`/home/node/.cache/ms-playwright`) i upewnij się, że `/home/node` jest utrwalone przez
`OPENCLAW_HOME_VOLUME` albo bind mount. Zobacz [Docker](/pl/install/docker).

## Jak to działa (wewnętrznie)

Mały serwer sterowania local loopback przyjmuje żądania HTTP i łączy się z przeglądarkami opartymi na Chromium przez CDP. Zaawansowane akcje (click/type/snapshot/PDF) przechodzą przez Playwright na CDP; gdy brakuje Playwright, dostępne są tylko operacje niewymagające Playwright. Agent widzi jeden stabilny interfejs, podczas gdy lokalne/zdalne przeglądarki i profile mogą się swobodnie zmieniać pod spodem.

## Szybka dokumentacja CLI

Wszystkie polecenia akceptują `--browser-profile <name>` do wskazania konkretnego profilu oraz `--json` dla danych wyjściowych czytelnych maszynowo.

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

- `upload` i `dialog` to wywołania **uzbrajające**; uruchom je przed kliknięciem/naciśnięciem, które wyzwala selektor/okno dialogowe.
- `click`/`type`/itd. wymagają `ref` z `snapshot` (numeryczne `12`, odwołanie roli `e12` albo możliwe do użycia odwołanie ARIA `ax12`). Selektory CSS celowo nie są obsługiwane dla akcji. Użyj `click-coords`, gdy widoczna pozycja w obszarze widoku jest jedynym niezawodnym celem.
- Ścieżki pobierania, trace i przesyłania są ograniczone do tymczasowych katalogów głównych OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (wariant zapasowy: `${os.tmpdir()}/openclaw/...`).
- `upload` może też ustawiać wejścia plików bezpośrednio przez `--input-ref` albo `--element`.

Stabilne identyfikatory i etykiety kart przetrwają zastąpienie surowego celu Chromium, gdy OpenClaw
może potwierdzić kartę zastępczą, na przykład ten sam URL albo pojedyncza stara karta stająca się
pojedynczą nową kartą po wysłaniu formularza. Surowe identyfikatory celów nadal są ulotne; w skryptach preferuj
`suggestedTargetId` z `tabs`.

Flagi migawek w skrócie:

- `--format ai` (domyślnie z Playwright): migawka AI z odwołaniami numerycznymi (`aria-ref="<n>"`).
- `--format aria`: drzewo dostępności z odwołaniami `axN`. Gdy Playwright jest dostępny, OpenClaw wiąże odwołania z backendowymi identyfikatorami DOM ze stroną na żywo, aby kolejne akcje mogły ich używać; w przeciwnym razie traktuj wynik wyłącznie jako materiał do inspekcji.
- `--efficient` (albo `--mode efficient`): kompaktowy preset migawki ról. Ustaw `browser.snapshotDefaults.mode: "efficient"`, aby uczynić go domyślnym (zobacz [konfigurację Gateway](/pl/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` wymuszają migawkę ról z odwołaniami `ref=e12`. `--frame "<iframe>"` ogranicza migawki ról do iframe.
- `--labels` dodaje zrzut ekranu tylko obszaru widoku z nałożonymi etykietami odwołań (wypisuje `MEDIA:<path>`).
- `--urls` dołącza wykryte miejsca docelowe linków do migawek AI.

## Migawki i odwołania

OpenClaw obsługuje dwa style „migawek”:

- **Migawka AI (odwołania numeryczne)**: `openclaw browser snapshot` (domyślnie; `--format ai`)
  - Wynik: migawka tekstowa zawierająca odwołania numeryczne.
  - Akcje: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Wewnętrznie odwołanie jest rozwiązywane przez `aria-ref` Playwright.

- **Migawka ról (odwołania ról, takie jak `e12`)**: `openclaw browser snapshot --interactive` (albo `--compact`, `--depth`, `--selector`, `--frame`)
  - Wynik: lista/drzewo oparte na rolach z `[ref=e12]` (i opcjonalnie `[nth=1]`).
  - Akcje: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Wewnętrznie odwołanie jest rozwiązywane przez `getByRole(...)` (plus `nth()` dla duplikatów).
  - Dodaj `--labels`, aby dołączyć zrzut ekranu obszaru widoku z nałożonymi etykietami `e12`.
  - Dodaj `--urls`, gdy tekst linku jest niejednoznaczny, a agent potrzebuje konkretnych
    celów nawigacji.

- **Migawka ARIA (odwołania ARIA, takie jak `ax12`)**: `openclaw browser snapshot --format aria`
  - Wynik: drzewo dostępności jako ustrukturyzowane węzły.
  - Akcje: `openclaw browser click ax12` działa, gdy ścieżka migawki może powiązać
    odwołanie przez Playwright i backendowe identyfikatory DOM Chrome.
- Jeśli Playwright jest niedostępny, migawki ARIA nadal mogą być użyteczne do
  inspekcji, ale odwołania mogą nie nadawać się do akcji. Wykonaj ponowną migawkę z `--format ai`
  lub `--interactive`, gdy potrzebujesz odwołań do akcji.
- Dowód Docker dla ścieżki zapasowej raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  uruchamia Chromium z CDP, wykonuje `browser doctor --deep` i weryfikuje, że migawki ról
  zawierają adresy URL linków, klikalne elementy promowane kursorem oraz metadane iframe.

Zachowanie odwołań:

- Referencje **nie są stabilne między nawigacjami**; jeśli coś się nie powiedzie, uruchom ponownie `snapshot` i użyj świeżej referencji.
- `/act` zwraca bieżący surowy `targetId` po zastąpieniu wywołanym akcją,
  gdy może potwierdzić kartę zastępującą. Nadal używaj stabilnych identyfikatorów/etykiet kart dla
  kolejnych poleceń.
- Jeśli migawka ról została wykonana z `--frame`, referencje ról są ograniczone do tego iframe aż do następnej migawki ról.
- Nieznane lub nieaktualne referencje `axN` szybko kończą się błędem zamiast przechodzić do
  selektora `aria-ref` Playwright. Gdy tak się stanie, uruchom świeżą migawkę na tej samej karcie.

## Usprawnienia oczekiwania

Możesz czekać na więcej niż tylko czas/tekst:

- Czekaj na adres URL (obsługiwane globy Playwright):
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
2. Użyj `click <ref>` / `type <ref>` (preferuj referencje ról w trybie interaktywnym)
3. Jeśli nadal się nie powiedzie: `openclaw browser highlight <ref>`, aby zobaczyć, co wskazuje Playwright
4. Jeśli strona zachowuje się nietypowo:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Do głębokiego debugowania: nagraj trace:
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

Migawki ról w JSON zawierają `refs` oraz mały blok `stats` (lines/chars/refs/interactive), aby narzędzia mogły wnioskować o rozmiarze i gęstości payloadu.

## Przełączniki stanu i środowiska

Są przydatne w przepływach typu „spraw, aby witryna zachowywała się jak X”:

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

- Profil przeglądarki openclaw może zawierać zalogowane sesje; traktuj go jako wrażliwy.
- `browser act kind=evaluate` / `openclaw browser evaluate` oraz `wait --fn`
  wykonują dowolny JavaScript w kontekście strony. Prompt injection może tym sterować.
  Wyłącz to za pomocą `browser.evaluateEnabled=false`, jeśli tego nie potrzebujesz.
- Informacje o logowaniach i uwagi dotyczące ochrony przed botami (X/Twitter itp.) znajdziesz w [Logowanie w przeglądarce + publikowanie na X/Twitter](/pl/tools/browser-login).
- Utrzymuj host Gateway/node jako prywatny (tylko local loopback lub tylko tailnet).
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
- [Rozwiązywanie problemów z przeglądarką w Linuksie](/pl/tools/browser-linux-troubleshooting)
- [Rozwiązywanie problemów z przeglądarką WSL2](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
