---
read_when:
    - Używasz `openclaw browser` i chcesz przykłady typowych zadań
    - Chcesz sterować przeglądarką działającą na innym komputerze za pośrednictwem hosta Node
    - Chcesz połączyć się z lokalnie zalogowaną przeglądarką Chrome za pomocą Chrome MCP
summary: Dokumentacja referencyjna CLI dla `openclaw browser` (cykl życia, profile, karty, akcje, stan i debugowanie)
title: Przeglądarka
x-i18n:
    generated_at: "2026-06-27T17:19:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Zarządzaj powierzchnią sterowania przeglądarką OpenClaw i uruchamiaj akcje przeglądarki (cykl życia, profile, karty, migawki, zrzuty ekranu, nawigacja, wprowadzanie danych, emulacja stanu i debugowanie).

Powiązane:

- Narzędzie przeglądarki + API: [Narzędzie przeglądarki](/pl/tools/browser)

## Typowe flagi

- `--url <gatewayWsUrl>`: adres URL WebSocket Gateway (domyślnie z konfiguracji).
- `--token <token>`: token Gateway (jeśli wymagany).
- `--timeout <ms>`: limit czasu żądania (ms).
- `--expect-final`: czekaj na końcową odpowiedź Gateway.
- `--browser-profile <name>`: wybierz profil przeglądarki (domyślnie z konfiguracji).
- `--json`: dane wyjściowe czytelne maszynowo (tam, gdzie obsługiwane).

## Szybki start (lokalnie)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agenci mogą uruchomić tę samą kontrolę gotowości za pomocą `browser({ action: "doctor" })`.

## Szybkie rozwiązywanie problemów

Jeśli `start` kończy się błędem `not reachable after start`, najpierw rozwiąż problem z gotowością CDP. Jeśli `start` i `tabs` działają, ale `open` lub `navigate` kończy się niepowodzeniem, płaszczyzna sterowania przeglądarką jest zdrowa, a przyczyną błędu jest zwykle polityka SSRF dla nawigacji.

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

Uwagi:

- `doctor --deep` dodaje sondę migawki na żywo. Jest przydatne, gdy podstawowa
  gotowość CDP jest zielona, ale chcesz dowodu, że bieżącą kartę można zbadać.
- W przypadku profili `attachOnly` i zdalnych profili CDP `openclaw browser stop` zamyka
  aktywną sesję sterowania i czyści tymczasowe nadpisania emulacji nawet wtedy, gdy
  OpenClaw nie uruchomił samodzielnie procesu przeglądarki.
- W przypadku lokalnie zarządzanych profili `openclaw browser stop` zatrzymuje uruchomiony
  proces przeglądarki.
- `openclaw browser start --headless` dotyczy tylko tego żądania uruchomienia i
  tylko wtedy, gdy OpenClaw uruchamia lokalnie zarządzaną przeglądarkę. Nie przepisuje
  `browser.headless` ani konfiguracji profilu i nie ma efektu dla już działającej
  przeglądarki.
- Na hostach Linux bez `DISPLAY` ani `WAYLAND_DISPLAY` lokalnie zarządzane profile
  działają automatycznie w trybie headless, chyba że `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false` lub `browser.profiles.<name>.headless=false`
  jawnie żąda widocznej przeglądarki.

## Jeśli brakuje polecenia

Jeśli `openclaw browser` jest nieznanym poleceniem, sprawdź `plugins.allow` w
`~/.openclaw/openclaw.json`.

Gdy `plugins.allow` jest obecne, jawnie wymień wbudowany Plugin przeglądarki,
chyba że konfiguracja ma już główny blok `browser`:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Jawny główny blok `browser`, na przykład `browser.enabled=true` lub
`browser.profiles.<name>`, również aktywuje wbudowany Plugin przeglądarki przy
restrykcyjnej liście dozwolonych Pluginów.

Powiązane: [Narzędzie przeglądarki](/pl/tools/browser#missing-browser-command-or-tool)

## Profile

Profile to nazwane konfiguracje routingu przeglądarki. W praktyce:

- `openclaw`: uruchamia lub dołącza do dedykowanej instancji Chrome zarządzanej przez OpenClaw (izolowany katalog danych użytkownika).
- `user`: steruje istniejącą, zalogowaną sesją Chrome przez Chrome DevTools MCP.
- niestandardowe profile CDP: wskazują lokalny lub zdalny punkt końcowy CDP.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Użyj konkretnego profilu:

```bash
openclaw browser --browser-profile work tabs
```

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

`tabs` zwraca najpierw `suggestedTargetId`, następnie stabilne `tabId`, takie jak `t1`,
opcjonalną etykietę oraz surowe `targetId`. Agenci powinni przekazywać
`suggestedTargetId` z powrotem do `focus`, `close`, migawek i akcji. Możesz
przypisać etykietę za pomocą `open --label`, `tab new --label` lub `tab label`; etykiety,
identyfikatory kart, surowe identyfikatory celów i unikalne prefiksy identyfikatorów celów są akceptowane.
Pole żądania nadal nazywa się `targetId` ze względu na zgodność, ale akceptuje
te odwołania do kart. Traktuj surowe identyfikatory celów jako uchwyty diagnostyczne, a nie trwałą
pamięć agenta.
Gdy Chromium zastępuje bazowy surowy cel podczas nawigacji lub wysłania formularza,
OpenClaw utrzymuje stabilne `tabId`/etykietę przypięte do karty zastępczej,
gdy może udowodnić dopasowanie. Surowe identyfikatory celów pozostają zmienne; preferuj
`suggestedTargetId`.

## Migawka / zrzut ekranu / akcje

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

Uwagi:

- `--full-page` służy tylko do przechwytywania stron; nie można go łączyć z `--ref`
  ani `--element`.
- Profile `existing-session` / `user` obsługują zrzuty ekranu stron oraz zrzuty ekranu `--ref`
  z danych wyjściowych migawki, ale nie zrzuty ekranu CSS `--element`.
- `--labels` nakłada bieżące referencje migawki na zrzut ekranu. W profilach
  opartych na Playwright działa z `--full-page` (nakładka etykiet pełnej strony),
  `--ref` (nakładka etykiet wycinka elementu według referencji ARIA) oraz `--element`
  (nakładka etykiet wycinka elementu według selektora CSS); w trybach wycinka elementu etykiety
  są rzutowane względem elementu. Odpowiedź zawiera też tablicę
  `annotations` z ramką ograniczającą każdej referencji. Każdy element ma `ref`,
  `number`, `role`, opcjonalne `name` oraz `box: {x, y, width, height}`;
  współrzędne są w przestrzeni przechwyconego obrazu (viewport / pełna strona /
  względem elementu). Pole jest pomijane, gdy jest puste.
  Profile `existing-session` renderują nakładkę chrome-mcp na zrzutach ekranu stron,
  ale nie używają pomocnika projekcji Playwright i nie zawierają
  `annotations`; zrzuty ekranu CSS `--element` nie są tam obsługiwane. Bez
  Playwright lub chrome-mcp etykietowane zrzuty ekranu nie są dostępne. Poprzednie
  wydania ignorowały `--full-page`, `--ref` i `--element` w etykietowanych
  zrzutach ekranu Playwright i zawsze zwracały przechwycony viewport; etykietowane
  zrzuty ekranu teraz respektują te zakresy.
- `snapshot --urls` dołącza wykryte miejsca docelowe linków do migawek AI, aby
  agenci mogli wybierać bezpośrednie cele nawigacji zamiast zgadywać wyłącznie na podstawie tekstu
  linku.

Nawigacja/kliknięcie/pisanie (automatyzacja UI oparta na referencjach):

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

`evaluate --fn` akceptuje źródło funkcji, wyrażenie lub ciało instrukcji.
Ciała instrukcji są opakowywane jako funkcje asynchroniczne, więc użyj `return` dla wartości,
którą chcesz otrzymać z powrotem. Użyj `evaluate --timeout-ms <ms>`, gdy funkcja po stronie strony może
potrzebować więcej czasu niż domyślny limit czasu evaluate.

Odpowiedzi akcji zwracają bieżące surowe `targetId` po zastąpieniu strony
wywołanym akcją, gdy OpenClaw może udowodnić kartę zastępczą. Skrypty powinny nadal
przechowywać i przekazywać `suggestedTargetId`/etykiety w długotrwałych przepływach pracy.

Pomocniki plików i okien dialogowych:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Zarządzane profile Chrome zapisują zwykłe pobrania wywołane kliknięciem w katalogu
pobrań OpenClaw (`/tmp/openclaw/downloads` domyślnie albo skonfigurowanym głównym katalogu tymczasowym).
Użyj `waitfordownload` lub `download`, gdy agent musi poczekać na
konkretny plik i zwrócić jego ścieżkę; te jawne oczekiwania przejmują następne pobranie.
Przesyłanie akceptuje pliki z głównego katalogu tymczasowych przesłań OpenClaw oraz zarządzanych przez OpenClaw
przychodzących multimediów, w tym referencje `media://inbound/<id>` i względne względem piaskownicy
`media/inbound/<id>`. Zagnieżdżone referencje multimediów, przechodzenie po katalogach i dowolne
ścieżki lokalne pozostają odrzucane.
Gdy akcja otwiera modalne okno dialogowe, odpowiedź akcji zwraca
`blockedByDialog` z `browserState.dialogs.pending`; przekaż `--dialog-id`, aby
odpowiedzieć bezpośrednio. Okna dialogowe obsłużone poza OpenClaw pojawiają się w
`browserState.dialogs.recent`.

## Stan i przechowywanie

Viewport + emulacja:

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

Ciasteczka + pamięć:

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

Użyj wbudowanego profilu `user` albo utwórz własny profil `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Domyślna ścieżka existing-session to automatyczne połączenie Chrome MCP tylko z hosta. Jeśli przeglądarka już
działa z punktem końcowym DevTools, przekaż `--cdp-url`, aby Chrome MCP dołączył zamiast tego do tego punktu końcowego.
W przypadku Dockera, Browserless lub innych zdalnych konfiguracji, w których semantyka Chrome MCP nie jest potrzebna, użyj
profilu CDP.

Obecne ograniczenia existing-session:

- akcje sterowane snapshotami używają referencji, a nie selektorów CSS
- `browser.actionTimeoutMs` domyślnie ustawia obsługiwane żądania `act` na 60000 ms, gdy
  wywołujący pominą `timeoutMs`; `timeoutMs` dla pojedynczego wywołania nadal ma pierwszeństwo.
- `click` obsługuje tylko kliknięcie lewym przyciskiem
- `type` nie obsługuje `slowly=true`
- `press` nie obsługuje `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` i `evaluate` odrzucają
  nadpisania limitu czasu dla pojedynczego wywołania
- `select` obsługuje tylko jedną wartość
- `wait --load networkidle` nie jest obsługiwane w profilach istniejących sesji (działa w zarządzanych i surowych/zdalnych CDP)
- przesyłanie plików wymaga `--ref` / `--input-ref`, nie obsługuje CSS
  `--element` i obecnie obsługuje jeden plik naraz
- hooki dialogów nie obsługują `--timeout`
- zrzuty ekranu obsługują przechwytywanie strony i `--ref`, ale nie CSS `--element`
- `responsebody`, przechwytywanie pobierania, eksport PDF i akcje wsadowe nadal
  wymagają zarządzanej przeglądarki lub surowego profilu CDP

## Zdalne sterowanie przeglądarką (proxy hosta node)

Jeśli Gateway działa na innym komputerze niż przeglądarka, uruchom **host node** na komputerze, który ma Chrome/Brave/Edge/Chromium. Gateway będzie przekazywać akcje przeglądarki do tego węzła (osobny serwer sterowania przeglądarką nie jest wymagany).

Użyj `gateway.nodes.browser.mode`, aby kontrolować automatyczne trasowanie, oraz `gateway.nodes.browser.node`, aby przypiąć konkretny węzeł, jeśli podłączonych jest wiele.

Bezpieczeństwo i konfiguracja zdalna: [Narzędzie przeglądarki](/pl/tools/browser), [Dostęp zdalny](/pl/gateway/remote), [Tailscale](/pl/gateway/tailscale), [Bezpieczeństwo](/pl/gateway/security)

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Przeglądarka](/pl/tools/browser)
