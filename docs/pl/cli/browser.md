---
read_when:
    - Używasz `openclaw browser` i chcesz zobaczyć przykłady typowych zadań
    - Chcesz sterować przeglądarką uruchomioną na innej maszynie przez host node
    - Chcesz podłączyć się do lokalnego zalogowanego Chrome przez Chrome MCP
summary: Dokumentacja CLI dla `openclaw browser` (cykl życia, profile, karty, akcje, stan i debugowanie)
title: browser
x-i18n:
    generated_at: "2026-04-05T13:48:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: c89a7483dd733863dd8ebd47a14fbb411808ad07daaed515c1270978de9157e7
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Zarządzaj powierzchnią sterowania przeglądarką OpenClaw i uruchamiaj akcje przeglądarki (cykl życia, profile, karty, migawki, zrzuty ekranu, nawigacja, wejście, emulacja stanu i debugowanie).

Powiązane:

- Narzędzie przeglądarki + API: [Browser tool](/tools/browser)

## Typowe flagi

- `--url <gatewayWsUrl>`: adres URL WebSocket gateway (domyślnie z konfiguracji).
- `--token <token>`: token gateway (jeśli jest wymagany).
- `--timeout <ms>`: limit czasu żądania (ms).
- `--expect-final`: czekaj na końcową odpowiedź gateway.
- `--browser-profile <name>`: wybierz profil przeglądarki (domyślny z konfiguracji).
- `--json`: wyjście czytelne maszynowo (tam, gdzie jest obsługiwane).

## Szybki start (lokalnie)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Cykl życia

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Uwagi:

- Dla profili `attachOnly` i zdalnego CDP polecenie `openclaw browser stop` zamyka
  aktywną sesję sterowania i czyści tymczasowe nadpisania emulacji nawet wtedy,
  gdy OpenClaw nie uruchomił sam procesu przeglądarki.
- Dla lokalnych zarządzanych profili polecenie `openclaw browser stop` zatrzymuje uruchomiony
  proces przeglądarki.

## Jeśli polecenie nie istnieje

Jeśli `openclaw browser` jest nierozpoznanym poleceniem, sprawdź `plugins.allow` w
`~/.openclaw/openclaw.json`.

Gdy `plugins.allow` jest obecne, dołączona wtyczka przeglądarki musi być wymieniona
jawnie:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` nie przywraca podpolecenia CLI, gdy allowlista wtyczek
wyklucza `browser`.

Powiązane: [Browser tool](/tools/browser#missing-browser-command-or-tool)

## Profile

Profile to nazwane konfiguracje routowania przeglądarki. W praktyce:

- `openclaw`: uruchamia lub podłącza dedykowaną instancję Chrome zarządzaną przez OpenClaw (izolowany katalog danych użytkownika).
- `user`: steruje Twoją istniejącą zalogowaną sesją Chrome przez Chrome DevTools MCP.
- niestandardowe profile CDP: wskazują lokalny lub zdalny punkt końcowy CDP.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Użyj określonego profilu:

```bash
openclaw browser --browser-profile work tabs
```

## Karty

```bash
openclaw browser tabs
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Migawka / zrzut ekranu / akcje

Migawka:

```bash
openclaw browser snapshot
```

Zrzut ekranu:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

Uwagi:

- `--full-page` służy tylko do przechwytywania całej strony; nie można go łączyć z `--ref`
  ani `--element`.
- Profile `existing-session` / `user` obsługują zrzuty ekranu całej strony oraz zrzuty
  `--ref` na podstawie wyjścia migawki, ale nie obsługują zrzutów `--element` CSS.

Nawigacja/kliknięcie/pisanie (automatyzacja UI oparta na ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Pomocniki dla plików i okien dialogowych:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

## Stan i storage

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

Cookies + storage:

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
openclaw browser --browser-profile chrome-live tabs
```

Ta ścieżka działa tylko na hoście. Dla Docker, serwerów headless, Browserless lub innych zdalnych konfiguracji użyj zamiast tego profilu CDP.

Aktualne ograniczenia existing-session:

- akcje oparte na migawkach używają ref, a nie selektorów CSS
- `click` obsługuje tylko kliknięcie lewym przyciskiem
- `type` nie obsługuje `slowly=true`
- `press` nie obsługuje `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` i `evaluate` odrzucają
  nadpisania limitu czasu dla pojedynczego wywołania
- `select` obsługuje tylko jedną wartość
- `wait --load networkidle` nie jest obsługiwane
- wysyłanie plików wymaga `--ref` / `--input-ref`, nie obsługuje CSS
  `--element` i obecnie obsługuje tylko jeden plik naraz
- hooki dialogów nie obsługują `--timeout`
- zrzuty ekranu obsługują przechwytywanie strony i `--ref`, ale nie CSS `--element`
- `responsebody`, przechwytywanie pobrań, eksport PDF oraz akcje wsadowe nadal
  wymagają zarządzanej przeglądarki lub surowego profilu CDP

## Zdalne sterowanie przeglądarką (proxy hosta node)

Jeśli gateway działa na innej maszynie niż przeglądarka, uruchom **host node** na maszynie, która ma Chrome/Brave/Edge/Chromium. Gateway będzie proxywać akcje przeglądarki do tego noda (bez potrzeby uruchamiania osobnego serwera sterowania przeglądarką).

Użyj `gateway.nodes.browser.mode`, aby kontrolować automatyczne routowanie, oraz `gateway.nodes.browser.node`, aby przypiąć konkretny node, jeśli podłączonych jest kilka.

Bezpieczeństwo + konfiguracja zdalna: [Browser tool](/tools/browser), [Dostęp zdalny](/gateway/remote), [Tailscale](/gateway/tailscale), [Bezpieczeństwo](/gateway/security)
