---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Napraw problemy z uruchamianiem CDP w Chrome/Brave/Edge/Chromium na potrzeby sterowania przeglądarką przez OpenClaw w systemie Linux
title: Rozwiązywanie problemów z przeglądarką
x-i18n:
    generated_at: "2026-07-12T15:39:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Problem: nie udało się uruchomić Chrome CDP na porcie 18800

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### Główna przyczyna

W systemie Ubuntu i większości dystrybucji systemu Linux polecenie `apt install chromium` instaluje
nakładkę snap, a nie rzeczywistą przeglądarkę:

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Mechanizm izolacji AppArmor pakietu snap zakłóca sposób, w jaki OpenClaw uruchamia
i monitoruje proces przeglądarki.

Inne częste błędy uruchamiania w systemie Linux:

- `The profile appears to be in use by another Chromium process`: nieaktualne
  pliki blokad `Singleton*` w katalogu zarządzanego profilu. OpenClaw usuwa
  te blokady i ponawia próbę jeden raz, gdy blokada wskazuje na zakończony proces lub
  proces na innym hoście.
- `Missing X server or $DISPLAY`: jawnie zażądano widocznej przeglądarki
  na hoście bez sesji pulpitu. Lokalne zarządzane profile w systemie Linux przechodzą
  w tryb bez interfejsu graficznego, gdy nie ustawiono ani `DISPLAY`, ani `WAYLAND_DISPLAY`.
  Jeśli ustawiono `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` lub
  `browser.profiles.<name>.headless: false`, usuń to wymuszenie trybu z interfejsem,
  ustaw `OPENCLAW_BROWSER_HEADLESS=1`, uruchom `Xvfb`, wykonaj
  `openclaw browser start --headless`, aby jednorazowo uruchomić zarządzaną przeglądarkę, albo uruchom
  OpenClaw w rzeczywistej sesji pulpitu.

### Rozwiązanie 1: zainstaluj Google Chrome (zalecane)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # w przypadku błędów zależności
```

Zaktualizuj `~/.openclaw/openclaw.json`:

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Rozwiązanie 2: użyj Chromium z pakietu snap w trybie wyłącznie dołączania

Jeśli musisz zachować Chromium z pakietu snap, skonfiguruj OpenClaw tak, aby dołączał do
ręcznie uruchomionej przeglądarki zamiast ją uruchamiać:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

Uruchom Chromium ręcznie:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

Opcjonalnie skonfiguruj automatyczne uruchamianie za pomocą usługi użytkownika systemd:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now openclaw-browser.service
```

### Sprawdź działanie przeglądarki

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Dokumentacja konfiguracji

| Opcja                            | Opis                                                                         | Wartość domyślna                                                              |
| -------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `browser.enabled`                | Włącza sterowanie przeglądarką                                                | `true`                                                                        |
| `browser.executablePath`         | Ścieżka do pliku wykonywalnego przeglądarki opartej na Chromium (Chrome/Brave/Edge/Chromium) | wykrywana automatycznie (preferowana jest domyślna przeglądarka systemu operacyjnego, jeśli jest oparta na Chromium) |
| `browser.headless`               | Uruchamia bez interfejsu graficznego                                          | `false`                                                                       |
| `OPENCLAW_BROWSER_HEADLESS`      | Nadpisanie trybu bez interfejsu lokalnej zarządzanej przeglądarki dla danego procesu | nieustawiona                                                            |
| `browser.noSandbox`              | Dodaje flagę `--no-sandbox` (wymaganą w niektórych konfiguracjach systemu Linux) | `false`                                                                    |
| `browser.attachOnly`             | Nie uruchamia przeglądarki; wyłącznie dołącza do istniejącej                  | `false`                                                                       |
| `browser.cdpPortRangeStart`      | Początkowy lokalny port CDP dla automatycznie przypisywanych profili          | `18800` (wyprowadzany z portu Gateway)                                         |
| `browser.localLaunchTimeoutMs`   | Limit czasu wykrywania lokalnie zarządzanej przeglądarki Chrome, maksymalnie `120000` | `15000`                                                                |
| `browser.localCdpReadyTimeoutMs` | Limit czasu oczekiwania na gotowość CDP po uruchomieniu lokalnie zarządzanej przeglądarki, maksymalnie `120000` | `8000`                                               |

Obie wartości limitu czasu muszą być dodatnimi liczbami całkowitymi nieprzekraczającymi `120000` ms;
inne wartości są odrzucane podczas wczytywania konfiguracji. Na Raspberry Pi, starszych hostach VPS lub wolnych
nośnikach zwiększ `browser.localLaunchTimeoutMs`, gdy Chrome potrzebuje więcej czasu na
udostępnienie punktu końcowego HTTP CDP. Zwiększ `browser.localCdpReadyTimeoutMs`, gdy
uruchomienie się powiedzie, ale polecenie `openclaw browser start` nadal zgłasza `not reachable
after start`.

### Problem: nie znaleziono kart Chrome dla profilu="user"

Używasz profilu `user` (`existing-session` / Chrome MCP) i nie ma
otwartych kart, do których można się dołączyć.

Sposoby rozwiązania:

1. Zamiast tego użyj zarządzanej przeglądarki:
   `openclaw browser --browser-profile openclaw start` (lub ustaw
   `browser.defaultProfile: "openclaw"`).
2. Pozostaw lokalną przeglądarkę Chrome uruchomioną z co najmniej jedną otwartą kartą, a następnie ponów próbę z
   `--browser-profile user`.

Uwagi:

- Profil `user` działa wyłącznie na hoście. Na serwerach z systemem Linux, w kontenerach lub na hostach zdalnych preferuj
  profile CDP.
- Profil `user` i inne profile `existing-session` współdzielą obecne ograniczenia Chrome MCP:
  wyłącznie działania oparte na referencjach, jeden plik na każde przesłanie, brak możliwości nadpisania `timeoutMs`
  dla okien dialogowych, brak `wait --load networkidle` oraz brak `responsebody`, eksportu do PDF,
  przechwytywania pobierania i działań wsadowych.
- Lokalne profile sterownika `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl`; ustawiaj
  je ręcznie tylko dla zdalnego CDP.
- Zdalne profile CDP akceptują `http://`, `https://`, `ws://` i `wss://`.
  Użyj HTTP(S) do wykrywania za pomocą `/json/version` albo WS(S), gdy usługa
  przeglądarki udostępnia bezpośredni adres URL gniazda DevTools.

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Logowanie w przeglądarce](/pl/tools/browser-login)
- [Rozwiązywanie problemów ze zdalnym CDP przeglądarki w WSL2](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
