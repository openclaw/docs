---
read_when:
    - Używasz `openclaw browser` i potrzebujesz przykładów typowych zadań
    - Chcesz sterować przeglądarką działającą na innym komputerze za pośrednictwem hosta Node
    - Chcesz połączyć się z lokalną przeglądarką Chrome, w której jesteś zalogowany, za pomocą Chrome MCP
summary: Dokumentacja CLI dla `openclaw browser` (cykl życia, profile, karty, działania, stan i debugowanie)
title: Przeglądarka
x-i18n:
    generated_at: "2026-07-16T18:07:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Zarządzaj powierzchnią sterowania przeglądarką OpenClaw i wykonuj działania w przeglądarce: obsługuj cykl życia, profile, karty, migawki, zrzuty ekranu, nawigację, wprowadzanie danych, emulację stanu i debugowanie.

Powiązane: [Narzędzie przeglądarki](/pl/tools/browser)

## Typowe flagi

- `--url <gatewayWsUrl>`: adres URL WebSocket Gateway (domyślnie z konfiguracji).
- `--token <token>`: token Gateway (jeśli jest wymagany).
- `--timeout <ms>`: limit czasu żądania w ms (domyślnie: `30000`).
- `--expect-final`: oczekiwanie na końcową odpowiedź Gateway.
- `--browser-profile <name>`: wybór profilu przeglądarki (domyślnie: `openclaw` lub `browser.defaultProfile`).
- `--json`: dane wyjściowe w formacie do odczytu maszynowego (jeśli są obsługiwane). Jest to opcja na poziomie przeglądarki, dlatego
  należy umieścić ją przed podpoleceniem, aby uzyskać jednoznaczną postać, na przykład
  `openclaw browser --json status`. Umieszczenie jej na końcu, na przykład
  `openclaw browser status --json`, również działa, jeśli wybrane polecenie podrzędne nie
  definiuje własnej opcji `--json`.

## Szybki start (lokalnie)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agenty mogą wykonać tę samą kontrolę gotowości za pomocą `browser({ action: "doctor" })`.

## Szybkie rozwiązywanie problemów

Jeśli `start` kończy się niepowodzeniem z błędem `not reachable after start`, najpierw należy rozwiązać problemy z gotowością CDP. Jeśli `start` i `tabs` działają, ale `open` lub `navigate` kończy się niepowodzeniem, płaszczyzna sterowania przeglądarką działa prawidłowo, a przyczyną niepowodzenia jest zwykle blokada zasad SSRF nawigacji.

Minimalna sekwencja:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Szczegółowe wskazówki: [Rozwiązywanie problemów z przeglądarką](/pl/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Cykl życia

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

- `doctor --deep` dodaje aktywną sondę migawki: jest przydatna, gdy podstawowa gotowość CDP jest potwierdzona, ale potrzebny jest dowód, że można sprawdzić bieżącą kartę.
- W przypadku uruchomionego lokalnego profilu zarządzanego opcje `status` i `doctor` zgłaszają zapisane w pamięci podręcznej
  dane diagnostyczne grafiki z Chrome: klasyfikację sprzętową/programową, moduł renderujący,
  backend, urządzenie/sterownik, szczegóły funkcji i stanu wyłączenia oraz możliwości
  akceleracji wideo. `openclaw browser --json status` zwraca pełny ustrukturyzowany ładunek.
  Pasywne sprawdzanie stanu nigdy nie uruchamia Chrome wyłącznie w celu zebrania tych danych.
- `stop` zamyka aktywną sesję sterowania i usuwa tymczasowe nadpisania emulacji nawet dla profili `attachOnly` i zdalnych profili CDP, w których OpenClaw nie uruchomił samodzielnie procesu przeglądarki. W przypadku lokalnych profili zarządzanych `stop` zatrzymuje również uruchomiony proces przeglądarki.
- `start --headless` ma zastosowanie tylko do danego żądania uruchomienia i tylko wtedy, gdy OpenClaw uruchamia lokalną zarządzaną przeglądarkę. Nie zmienia `browser.headless` ani konfiguracji profilu i nie wykonuje żadnego działania w przypadku już uruchomionej przeglądarki.
- Na hostach z systemem Linux bez `DISPLAY` lub `WAYLAND_DISPLAY` lokalne profile zarządzane działają automatycznie w trybie bez interfejsu graficznego, chyba że `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` lub `browser.profiles.<name>.headless=false` jawnie zażąda widocznej przeglądarki.

## Jeśli polecenie jest niedostępne

Jeśli `openclaw browser` jest nieznanym poleceniem, należy sprawdzić `plugins.allow` w `~/.openclaw/openclaw.json`. Gdy występuje `plugins.allow`, należy jawnie dodać do listy dołączony plugin przeglądarki, chyba że konfiguracja zawiera już główny blok `browser`:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Jawny główny blok `browser` (na przykład `browser.enabled=true` lub `browser.profiles.<name>`) również aktywuje dołączony plugin przeglądarki przy restrykcyjnej liście dozwolonych pluginów.

Powiązane: [Narzędzie przeglądarki](/pl/tools/browser#missing-browser-command-or-tool)

## Profile

Profile to nazwane konfiguracje routingu przeglądarki:

- `openclaw` (domyślny): uruchamia dedykowaną instancję Chrome zarządzaną przez OpenClaw lub łączy się z nią (odizolowany katalog danych użytkownika).
- `user`: steruje istniejącą sesją Chrome z zalogowanym użytkownikiem za pośrednictwem Chrome DevTools MCP.
- niestandardowe profile CDP: wskazują lokalny lub zdalny punkt końcowy CDP.

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Określonego profilu można użyć z opcją `--browser-profile <name>` w dowolnym podpoleceniu, na przykład `openclaw browser --browser-profile work tabs`.

W systemie macOS polecenie `system-profiles` wyświetla rzeczywiste profile Chrome, Brave, Edge lub Chromium dostępne na hoście. Polecenie `import-profile` odszyfrowuje ich pliki cookie po jednokrotnym wyświetleniu monitu o zgodę przez pęk kluczy macOS/Touch ID i wstrzykuje je do nowego profilu zarządzanego przez OpenClaw. Importuje tylko pliki cookie; pamięć lokalna i IndexedDB pozostają bez zmian. Niektóre sesje Google korzystają z danych uwierzytelniających sesji powiązanych z urządzeniem (DBSC) i po imporcie mogą nadal wymagać ponownego uwierzytelnienia.

Gdy aplikacja macOS korzysta z lokalnego Gateway, może jednorazowo zaoferować ten import i ustawić odizolowany zaimportowany profil jako domyślny profil przeglądania dla agenta. Import zawsze wymaga jawnego kliknięcia; pomyślny import lub odrzucenie wyłącza późniejsze automatyczne monity, a opcja **Settings → General → Browser login** pozostaje dostępna do ponownego importu.

Import profilu systemowego jest domyślnie włączony. Ustawienie `browser.allowSystemProfileImport=false` wyłącza zarówno importy wywoływane przez CLI, jak i przez agenta. Import jest wykonywany lokalnie na hoście i nie może działać za pośrednictwem serwera proxy Node przeglądarki.

## Karty

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` zwraca najpierw `suggestedTargetId`, następnie stabilny `tabId` (na przykład `t1`), opcjonalną etykietę i surowy `targetId`. Wartość `suggestedTargetId` należy przekazywać z powrotem do `focus`, `close`, migawek i działań. Etykietę można przypisać za pomocą `open --label`, `tab new --label` lub `tab label`; akceptowane są etykiety, identyfikatory kart, surowe identyfikatory celów i unikatowe prefiksy identyfikatorów celów. Ze względu na zgodność pole żądania nadal nosi nazwę `targetId`, ale przyjmuje dowolne z tych odwołań do kart.

Surowe identyfikatory celów to nietrwałe uchwyty diagnostyczne, a nie trwała pamięć agenta: gdy Chromium zastępuje bazowy surowy cel podczas nawigacji lub przesyłania formularza, OpenClaw zachowuje stabilny `tabId`/etykietę przy zastępczej karcie, jeśli może potwierdzić dopasowanie. Preferowane jest użycie `suggestedTargetId`.

## Migawka / zrzut ekranu / działania

Migawka:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Zrzut ekranu:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

- `--full-page` służy wyłącznie do przechwytywania stron; nie można go łączyć z `--ref` ani `--element`.
- Profile `existing-session` / `user` obsługują zrzuty ekranu stron i zrzuty ekranu `--ref` z danych wyjściowych migawki, ale nie zrzuty ekranu CSS `--element`.
- `--labels` nakłada bieżące odwołania z migawki na zrzut ekranu. W profilach opartych na Playwright działa z `--full-page` (nakładka całej strony), `--ref` (nakładka wycinka elementu według odwołania ARIA) i `--element` (nakładka wycinka elementu według selektora CSS); w trybach wycinka elementu etykiety są rzutowane względem elementu. Odpowiedź zawiera również tablicę `annotations` (pomijaną, gdy jest pusta) z prostokątem ograniczającym każdego odwołania: `ref`, `number`, `role`, opcjonalnym `name` oraz `box: {x, y, width, height}` w przestrzeni współrzędnych przechwyconego obrazu (obszar roboczy / pełna strona / względem elementu).
  Profile `existing-session` renderują nakładkę chrome-mcp na zrzutach ekranu stron, ale nie używają pomocniczego mechanizmu projekcji Playwright i nie zawierają `annotations`; zrzuty ekranu CSS `--element` nie są tam obsługiwane. Bez Playwright lub chrome-mcp zrzuty ekranu z etykietami są niedostępne.
- `snapshot --urls` dołącza wykryte adresy docelowe odnośników do migawek AI, aby agenty mogły wybierać bezpośrednie cele nawigacji zamiast zgadywać wyłącznie na podstawie tekstu odnośnika.

Nawigacja/klikanie/wpisywanie (automatyzacja interfejsu oparta na odwołaniach):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` przyjmuje kod źródłowy funkcji, wyrażenie lub treść instrukcji. Treści instrukcji są opakowywane jako funkcje asynchroniczne, dlatego do zwracania żądanej wartości należy użyć `return`. Opcji `--timeout-ms` należy użyć, gdy funkcja wykonywana po stronie strony może wymagać więcej czasu niż domyślny limit czasu oceny. `browser.evaluateEnabled=false` (domyślnie: `true`) wyłącza zarówno `evaluate`, jak i `wait --fn`.

Odpowiedzi działań zwracają bieżący surowy `targetId` po zastąpieniu strony wywołanym przez działanie, jeśli OpenClaw może potwierdzić zastępczą kartę. W długotrwałych przepływach pracy skrypty nadal powinny przechowywać i przekazywać `suggestedTargetId`/etykiety.

Narzędzia pomocnicze plików i okien dialogowych:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Zarządzane profile Chrome zapisują zwykłe pliki pobrane w wyniku kliknięcia w katalogu pobierania OpenClaw (domyślnie `/tmp/openclaw/downloads` lub w skonfigurowanym głównym katalogu tymczasowym). Opcji `waitfordownload` lub `download` należy użyć, gdy agent musi zaczekać na określony plik i zwrócić jego ścieżkę; te jawne mechanizmy oczekiwania przejmują następne pobieranie. Przesyłanie akceptuje pliki z głównego tymczasowego katalogu przesyłania OpenClaw oraz przychodzące multimedia zarządzane przez OpenClaw, w tym odwołania `media://inbound/<id>` i odwołania `media/inbound/<id>` względne wobec piaskownicy. Zagnieżdżone odwołania do multimediów, przechodzenie między katalogami i dowolne ścieżki lokalne są odrzucane.

Gdy działanie otwiera modalne okno dialogowe, odpowiedź działania zwraca `blockedByDialog` z `browserState.dialogs.pending`; należy przekazać `--dialog-id`, aby odpowiedzieć bezpośrednio. Okna dialogowe obsłużone poza OpenClaw pojawiają się w `browserState.dialogs.recent`.

## Stan i pamięć masowa

Obszar roboczy i emulacja:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Pliki cookie + pamięć:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Debugowanie

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Istniejący Chrome przez MCP

Można użyć wbudowanego profilu `user` albo utworzyć własny profil `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Domyślna ścieżka istniejącej sesji służy do automatycznego łączenia Chrome MCP wyłącznie na hoście. Jeśli przeglądarka działa już z punktem końcowym DevTools, należy przekazać `--cdp-url`, aby Chrome MCP połączył się z tym punktem końcowym. W przypadku platformy Docker, Browserless lub innych konfiguracji zdalnych, w których semantyka Chrome MCP nie jest potrzebna, należy zamiast tego użyć profilu CDP.

Obecne ograniczenia istniejącej sesji:

- Akcje oparte na migawkach używają odwołań, a nie selektorów CSS.
- `browser.actionTimeoutMs` ustawia domyślnie obsługiwane żądania `act` na 60000 ms, gdy wywołujący pomijają `timeoutMs`; wartość `timeoutMs` określona dla danego wywołania nadal ma pierwszeństwo.
- `click` obsługuje tylko kliknięcie lewym przyciskiem.
- `type` nie obsługuje `slowly=true`.
- `press` nie obsługuje `delayMs`.
- `hover`, `scrollintoview`, `drag`, `select` i `fill` odrzucają nadpisania limitu czasu dla poszczególnych wywołań; `evaluate` akceptuje `--timeout-ms`.
- `select` obsługuje tylko jedną wartość.
- `wait --load networkidle` nie jest obsługiwane (działa w profilach zarządzanych oraz nieprzetworzonych/zdalnych profilach CDP).
- Przesyłanie plików wymaga `--ref` / `--input-ref`, nie obsługuje `--element` CSS i pozwala przesyłać tylko jeden plik naraz.
- Procedury obsługi okien dialogowych nie obsługują `--timeout`.
- Zrzuty ekranu obsługują przechwytywanie stron i `--ref`, ale nie selektor `--element` CSS.
- `responsebody`, przechwytywanie pobierania, eksport do PDF i akcje wsadowe nadal wymagają zarządzanej przeglądarki lub nieprzetworzonego profilu CDP.

## Zdalne sterowanie przeglądarką (serwer proxy hosta Node)

Jeśli Gateway działa na innym komputerze niż przeglądarka, należy uruchomić **host Node** na komputerze z Chrome/Brave/Edge/Chromium. Gateway przekazuje akcje przeglądarki do tego węzła przez serwer proxy; oddzielny serwer sterowania przeglądarką nie jest wymagany.

Do sterowania automatycznym trasowaniem służy `gateway.nodes.browser.mode`, a `gateway.nodes.browser.node` pozwala przypiąć określony węzeł, jeśli połączonych jest ich kilka.

Bezpieczeństwo + konfiguracja zdalna: [Narzędzie przeglądarki](/pl/tools/browser), [Dostęp zdalny](/pl/gateway/remote), [Tailscale](/pl/gateway/tailscale), [Bezpieczeństwo](/pl/gateway/security)

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Przeglądarka](/pl/tools/browser)
