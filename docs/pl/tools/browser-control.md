---
read_when:
    - Skryptowanie lub debugowanie przeglądarki agenta za pośrednictwem lokalnego interfejsu API sterowania
    - Szukasz dokumentacji referencyjnej CLI `openclaw browser`
    - Dodawanie niestandardowej automatyzacji przeglądarki z migawkami i referencjami
summary: API sterowania przeglądarką OpenClaw, dokumentacja referencyjna CLI i akcje skryptowe
title: API sterowania przeglądarką
x-i18n:
    generated_at: "2026-05-10T19:56:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: eec952e6befed8911b83fc554b1c08cc5f20d3deff9c6cc791cb8a009bb9e7f3
    source_path: tools/browser-control.md
    workflow: 16
---

Informacje o konfiguracji, ustawieniach i rozwiązywaniu problemów znajdziesz w sekcji [Przeglądarka](/pl/tools/browser).
Ta strona jest odniesieniem dla lokalnego HTTP API sterowania, CLI `openclaw browser`
oraz wzorców skryptowania (migawki, refy, oczekiwania, przepływy debugowania).

## API sterowania (opcjonalne)

Tylko na potrzeby lokalnych integracji Gateway udostępnia małe HTTP API loopback:

- Status/uruchomienie/zatrzymanie: `GET /`, `POST /start`, `POST /stop`
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
jednorazowego uruchomienia headless dla lokalnych zarządzanych profili bez zmiany utrwalonej
konfiguracji przeglądarki; profile attach-only, zdalnego CDP i istniejących sesji odrzucają
to nadpisanie, ponieważ OpenClaw nie uruchamia tych procesów przeglądarki.

Jeśli skonfigurowano uwierzytelnianie Gateway za pomocą współdzielonego sekretu, trasy HTTP przeglądarki też wymagają uwierzytelnienia:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` albo uwierzytelnianie HTTP Basic z tym hasłem

Uwagi:

- To samodzielne API przeglądarki loopback **nie** używa nagłówków tożsamości trusted-proxy ani
  Tailscale Serve.
- Jeśli `gateway.auth.mode` ma wartość `none` lub `trusted-proxy`, te trasy przeglądarki loopback
  nie dziedziczą trybów przenoszących tożsamość; utrzymuj je wyłącznie jako loopback.

### Kontrakt błędów `/act`

`POST /act` używa ustrukturyzowanej odpowiedzi błędu dla walidacji na poziomie trasy i
niepowodzeń zasad:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Bieżące wartości `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): brakuje `kind` albo nie jest rozpoznane.
- `ACT_INVALID_REQUEST` (HTTP 400): ładunek akcji nie przeszedł normalizacji albo walidacji.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` został użyty z nieobsługiwanym rodzajem akcji.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (albo `wait --fn`) jest wyłączone w konfiguracji.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): najwyższego poziomu albo wsadowe `targetId` koliduje z celem żądania.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): akcja nie jest obsługiwana dla profili istniejącej sesji.

Inne niepowodzenia w czasie działania nadal mogą zwrócić `{ "error": "<message>" }` bez pola
`code`.

### Wymaganie Playwright

Niektóre funkcje (navigate/act/migawka AI/migawka ról, zrzuty ekranu elementów,
PDF) wymagają Playwright. Jeśli Playwright nie jest zainstalowany, te punkty końcowe zwracają
czytelny błąd 501.

Co nadal działa bez Playwright:

- Migawki ARIA
- Migawki dostępności w stylu ról (`--interactive`, `--compact`,
  `--depth`, `--efficient`), gdy dostępny jest WebSocket CDP dla karty. To
  rozwiązanie awaryjne do inspekcji i wykrywania refów; Playwright pozostaje głównym
  silnikiem akcji.
- Zrzuty ekranu stron dla zarządzanej przeglądarki `openclaw`, gdy dostępny jest WebSocket CDP
  dla karty
- Zrzuty ekranu stron dla profili `existing-session` / Chrome MCP
- Oparte na refach zrzuty ekranu `existing-session` (`--ref`) z wyniku migawki

Co nadal wymaga Playwright:

- `navigate`
- `act`
- Migawki AI zależne od natywnego formatu migawek AI w Playwright
- Zrzuty ekranu elementów według selektora CSS (`--element`)
- Pełny eksport przeglądarki do PDF

Zrzuty ekranu elementów odrzucają też `--full-page`; trasa zwraca `fullPage is
not supported for element screenshots`.

Jeśli widzisz `Playwright is not available in this gateway build`, spakowanemu
Gateway brakuje podstawowej zależności runtime przeglądarki. Zainstaluj ponownie albo zaktualizuj
OpenClaw, a potem zrestartuj gateway. W przypadku Docker zainstaluj też binaria przeglądarki
Chromium, jak pokazano niżej.

#### Instalacja Playwright w Docker

Jeśli Twój Gateway działa w Docker, unikaj `npx playwright` (konflikty nadpisań npm).
Zamiast tego użyj dołączonego CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Aby utrwalić pobrania przeglądarki, ustaw `PLAYWRIGHT_BROWSERS_PATH` (na przykład
`/home/node/.cache/ms-playwright`) i upewnij się, że `/home/node` jest utrwalane przez
`OPENCLAW_HOME_VOLUME` albo bind mount. OpenClaw automatycznie wykrywa utrwalony
Chromium w Linux. Zobacz [Docker](/pl/install/docker).

## Jak to działa (wewnętrznie)

Mały serwer sterowania loopback przyjmuje żądania HTTP i łączy się z przeglądarkami opartymi na Chromium przez CDP. Zaawansowane akcje (click/type/snapshot/PDF) przechodzą przez Playwright na CDP; gdy brakuje Playwright, dostępne są tylko operacje niezależne od Playwright. Agent widzi jeden stabilny interfejs, podczas gdy lokalne/zdalne przeglądarki i profile mogą być swobodnie podmieniane pod spodem.

## Szybka ściągawka CLI

Wszystkie polecenia akceptują `--browser-profile <name>`, aby wskazać konkretny profil, oraz `--json`, aby uzyskać wynik czytelny maszynowo.

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

- `upload` i `dialog` to wywołania **uzbrajające**; uruchom je przed kliknięciem/naciśnięciem, które wyzwala wybór pliku/dialog.
- `click`/`type`/itd. wymagają `ref` z `snapshot` (numerycznego `12`, refu roli `e12` albo wykonywalnego refu ARIA `ax12`). Selektory CSS celowo nie są obsługiwane dla akcji. Użyj `click-coords`, gdy widoczna pozycja w viewporcie jest jedynym wiarygodnym celem.
- Ścieżki pobierania, trace i upload są ograniczone do tymczasowych katalogów głównych OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` może też ustawiać inputy plików bezpośrednio przez `--input-ref` albo `--element`.

Stabilne identyfikatory i etykiety kart przetrwają zastąpienie surowego celu Chromium, gdy OpenClaw
może udowodnić kartę zastępczą, na przykład ten sam URL albo jedna stara karta stająca się
jedną nową kartą po wysłaniu formularza. Surowe identyfikatory celów nadal są zmienne; w skryptach preferuj
`suggestedTargetId` z `tabs`.

Flagi migawek w skrócie:

- `--format ai` (domyślnie z Playwright): migawka AI z numerycznymi refami (`aria-ref="<n>"`).
- `--format aria`: drzewo dostępności z refami `axN`. Gdy Playwright jest dostępny, OpenClaw wiąże refy z backendowymi identyfikatorami DOM z żywą stroną, aby kolejne akcje mogły ich używać; w przeciwnym razie traktuj wynik tylko jako inspekcyjny.
- `--efficient` (albo `--mode efficient`): preset kompaktowej migawki ról. Ustaw `browser.snapshotDefaults.mode: "efficient"`, aby uczynić go domyślnym (zobacz [konfigurację Gateway](/pl/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` wymuszają migawkę ról z refami `ref=e12`. `--frame "<iframe>"` ogranicza migawki ról do iframe.
- `--labels` dodaje zrzut ekranu tylko viewportu z nałożonymi etykietami refów (wypisuje `MEDIA:<path>`).
- `--urls` dołącza wykryte miejsca docelowe linków do migawek AI.

## Migawki i refy

OpenClaw obsługuje dwa style „migawek”:

- **Migawka AI (refy numeryczne)**: `openclaw browser snapshot` (domyślnie; `--format ai`)
  - Wynik: tekstowa migawka zawierająca refy numeryczne.
  - Akcje: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Wewnętrznie ref jest rozwiązywany przez `aria-ref` Playwright.

- **Migawka ról (refy ról takie jak `e12`)**: `openclaw browser snapshot --interactive` (albo `--compact`, `--depth`, `--selector`, `--frame`)
  - Wynik: lista/drzewo oparte na rolach z `[ref=e12]` (i opcjonalnym `[nth=1]`).
  - Akcje: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Wewnętrznie ref jest rozwiązywany przez `getByRole(...)` (plus `nth()` dla duplikatów).
  - Dodaj `--labels`, aby dołączyć zrzut ekranu viewportu z nałożonymi etykietami `e12`.
  - Dodaj `--urls`, gdy tekst linku jest niejednoznaczny, a agent potrzebuje konkretnych
    celów nawigacji.

- **Migawka ARIA (refy ARIA takie jak `ax12`)**: `openclaw browser snapshot --format aria`
  - Wynik: drzewo dostępności jako ustrukturyzowane węzły.
  - Akcje: `openclaw browser click ax12` działa, gdy ścieżka migawki może powiązać
    ref przez Playwright i backendowe identyfikatory DOM Chrome.
- Jeśli Playwright jest niedostępny, migawki ARIA nadal mogą być przydatne do
  inspekcji, ale refy mogą nie nadawać się do akcji. Wykonaj ponowną migawkę z `--format ai`
  albo `--interactive`, gdy potrzebujesz refów akcji.
- Dowód Docker dla ścieżki fallback raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  uruchamia Chromium z CDP, uruchamia `browser doctor --deep` i weryfikuje, że migawki ról
  zawierają URL-e linków, elementy klikalne promowane przez kursor oraz metadane iframe.

Zachowanie refów:

- Referencje **nie są stabilne między nawigacjami**; jeśli coś się nie powiedzie, uruchom ponownie `snapshot` i użyj świeżej referencji.
- `/act` zwraca bieżący surowy `targetId` po zastąpieniu wywołanym akcją,
  gdy może potwierdzić zastąpioną kartę. Do kolejnych poleceń nadal używaj stabilnych identyfikatorów/etykiet kart.
- Jeśli migawka ról została wykonana z `--frame`, referencje ról są ograniczone do tego iframe aż do następnej migawki ról.
- Nieznane lub nieaktualne referencje `axN` szybko kończą się błędem zamiast przechodzić do
  selektora `aria-ref` Playwrighta. Gdy tak się stanie, wykonaj świeżą migawkę na tej samej karcie.

## Ulepszenia oczekiwania

Możesz czekać nie tylko na czas/tekst:

- Czekanie na URL (globy obsługiwane przez Playwright):
  - `openclaw browser wait --url "**/dash"`
- Czekanie na stan ładowania:
  - `openclaw browser wait --load networkidle`
- Czekanie na predykat JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Czekanie, aż selektor stanie się widoczny:
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

Gdy akcja się nie powiedzie (np. "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. Użyj `click <ref>` / `type <ref>` (w trybie interaktywnym preferuj referencje ról)
3. Jeśli nadal się nie powiedzie: `openclaw browser highlight <ref>`, aby zobaczyć, co wskazuje Playwright
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

Migawki ról w JSON zawierają `refs` oraz mały blok `stats` (lines/chars/refs/interactive), dzięki czemu narzędzia mogą wnioskować o rozmiarze i gęstości ładunku.

## Stan i przełączniki środowiska

Są przydatne w przepływach typu „spraw, aby strona zachowywała się jak X”:

- Ciasteczka: `cookies`, `cookies set`, `cookies clear`
- Pamięć: `storage local|session get|set|clear`
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

- Profil przeglądarki openclaw może zawierać zalogowane sesje; traktuj go jako dane wrażliwe.
- `browser act kind=evaluate` / `openclaw browser evaluate` oraz `wait --fn`
  wykonują dowolny JavaScript w kontekście strony. Prompt injection może tym sterować. Wyłącz to za pomocą `browser.evaluateEnabled=false`, jeśli nie jest potrzebne.
- Uwagi dotyczące logowania i mechanizmów antybotowych (X/Twitter itd.) znajdziesz w [Logowanie w przeglądarce + publikowanie na X/Twitter](/pl/tools/browser-login).
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

- [Przeglądarka](/pl/tools/browser) - przegląd, konfiguracja, profile, bezpieczeństwo
- [Logowanie w przeglądarce](/pl/tools/browser-login) - logowanie do witryn
- [Rozwiązywanie problemów z przeglądarką w Linux](/pl/tools/browser-linux-troubleshooting)
- [Rozwiązywanie problemów z przeglądarką WSL2](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
