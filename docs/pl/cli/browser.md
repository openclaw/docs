---
read_when:
    - Używasz `openclaw browser` i chcesz przykładów typowych zadań
    - Chcesz sterować przeglądarką działającą na innej maszynie przez host Node
    - Chcesz podłączyć się do lokalnego zalogowanego Chrome przez Chrome MCP
summary: Dokumentacja CLI dla `openclaw browser` (cykl życia, profile, karty, akcje, stan i debugowanie)
title: Przeglądarka
x-i18n:
    generated_at: "2026-04-24T09:01:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b93ea053b7fc047fad79397e0298cc530673a64d5873d98be9f910df1ea2fde
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Zarządzaj powierzchnią sterowania przeglądarką OpenClaw i uruchamiaj akcje przeglądarki (cykl życia, profile, karty, snapshoty, zrzuty ekranu, nawigacja, wprowadzanie danych, emulacja stanu i debugowanie).

Powiązane:

- Narzędzie przeglądarki + API: [Narzędzie przeglądarki](/pl/tools/browser)

## Wspólne flagi

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (domyślnie z konfiguracji).
- `--token <token>`: token Gateway (jeśli wymagany).
- `--timeout <ms>`: limit czasu żądania (ms).
- `--expect-final`: czekaj na końcową odpowiedź Gateway.
- `--browser-profile <name>`: wybierz profil przeglądarki (domyślny z konfiguracji).
- `--json`: dane wyjściowe czytelne maszynowo (tam, gdzie obsługiwane).

## Szybki start (lokalnie)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Szybkie rozwiązywanie problemów

Jeśli `start` kończy się błędem `not reachable after start`, najpierw sprawdź gotowość CDP. Jeśli `start` i `tabs` działają, ale `open` lub `navigate` kończy się błędem, płaszczyzna sterowania przeglądarką działa prawidłowo, a problem zwykle dotyczy polityki SSRF dla nawigacji.

Minimalna sekwencja:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Szczegółowe wskazówki: [Rozwiązywanie problemów z przeglądarką](/pl/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Cykl życia

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Uwagi:

- Dla profili `attachOnly` i zdalnych profili CDP polecenie `openclaw browser stop` zamyka
  aktywną sesję sterowania i czyści tymczasowe nadpisania emulacji, nawet gdy
  OpenClaw nie uruchomił sam procesu przeglądarki.
- Dla lokalnych zarządzanych profili polecenie `openclaw browser stop` zatrzymuje uruchomiony
  proces przeglądarki.

## Jeśli polecenie nie istnieje

Jeśli `openclaw browser` jest nieznanym poleceniem, sprawdź `plugins.allow` w
`~/.openclaw/openclaw.json`.

Gdy `plugins.allow` jest obecne, dołączony Plugin przeglądarki musi być jawnie wymieniony:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` nie przywraca podpolecenia CLI, gdy lista dozwolonych Pluginów
wyklucza `browser`.

Powiązane: [Narzędzie przeglądarki](/pl/tools/browser#missing-browser-command-or-tool)

## Profile

Profile to nazwane konfiguracje routingu przeglądarki. W praktyce:

- `openclaw`: uruchamia lub podłącza się do dedykowanej instancji Chrome zarządzanej przez OpenClaw (izolowany katalog danych użytkownika).
- `user`: steruje Twoją istniejącą zalogowaną sesją Chrome przez Chrome DevTools MCP.
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
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Snapshot / zrzut ekranu / akcje

Snapshot:

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
- Profile `existing-session` / `user` obsługują zrzuty całej strony i zrzuty `--ref`
  na podstawie danych wyjściowych snapshotu, ale nie obsługują zrzutów CSS `--element`.

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

## Stan i pamięć

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

Cookies + pamięć:

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

Obecne ograniczenia `existing-session`:

- akcje oparte na snapshotach używają ref, a nie selektorów CSS
- `click` obsługuje tylko kliknięcie lewym przyciskiem
- `type` nie obsługuje `slowly=true`
- `press` nie obsługuje `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` i `evaluate` odrzucają
  nadpisania limitu czasu dla pojedynczego wywołania
- `select` obsługuje tylko jedną wartość
- `wait --load networkidle` nie jest obsługiwane
- przesyłanie plików wymaga `--ref` / `--input-ref`, nie obsługuje CSS
  `--element` i obecnie obsługuje tylko jeden plik naraz
- hooki okien dialogowych nie obsługują `--timeout`
- zrzuty ekranu obsługują przechwytywanie stron i `--ref`, ale nie CSS `--element`
- `responsebody`, przechwytywanie pobrań, eksport PDF i akcje wsadowe nadal
  wymagają zarządzanej przeglądarki lub surowego profilu CDP

## Zdalne sterowanie przeglądarką (proxy hosta Node)

Jeśli Gateway działa na innej maszynie niż przeglądarka, uruchom **host Node** na maszynie z Chrome/Brave/Edge/Chromium. Gateway będzie przekazywać akcje przeglądarki do tego Node (bez potrzeby używania osobnego serwera sterowania przeglądarką).

Użyj `gateway.nodes.browser.mode`, aby sterować automatycznym routingiem, i `gateway.nodes.browser.node`, aby przypiąć konkretny Node, jeśli podłączonych jest kilka.

Bezpieczeństwo + konfiguracja zdalna: [Narzędzie przeglądarki](/pl/tools/browser), [Dostęp zdalny](/pl/gateway/remote), [Tailscale](/pl/gateway/tailscale), [Bezpieczeństwo](/pl/gateway/security)

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Przeglądarka](/pl/tools/browser)
