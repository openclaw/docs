---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Napraw problemy z uruchamianiem CDP w Chrome/Brave/Edge/Chromium dla sterowania przeglądarką OpenClaw w systemie Linux
title: Rozwiązywanie problemów z przeglądarką
x-i18n:
    generated_at: "2026-04-30T10:20:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9a91ea42a8a600163bcf66ad398677175bd0c5186d3e1dddb629a55c2ea66ed
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Problem: „Nie udało się uruchomić Chrome CDP na porcie 18800”

Serwer sterowania przeglądarką OpenClaw nie uruchamia Chrome/Brave/Edge/Chromium i zwraca błąd:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Przyczyna

W Ubuntu (i wielu dystrybucjach Linuxa) domyślna instalacja Chromium to **pakiet snap**. Ograniczenia AppArmor w snap zakłócają sposób, w jaki OpenClaw uruchamia i monitoruje proces przeglądarki.

Polecenie `apt install chromium` instaluje pakiet-pośrednik, który przekierowuje do snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

To NIE jest prawdziwa przeglądarka - to tylko wrapper.

Inne typowe błędy uruchamiania w Linuxie:

- `The profile appears to be in use by another Chromium process` oznacza, że Chrome
  znalazł przestarzałe pliki blokady `Singleton*` w katalogu zarządzanego profilu. OpenClaw
  usuwa te blokady i próbuje ponownie jeden raz, gdy blokada wskazuje martwy proces albo
  proces na innym hoście.
- `Missing X server or $DISPLAY` oznacza, że widoczna przeglądarka została jawnie
  zażądana na hoście bez sesji pulpitu. Domyślnie lokalne zarządzane profile
  przełączają się teraz w Linuxie na tryb headless, gdy `DISPLAY` i
  `WAYLAND_DISPLAY` są nieustawione. Jeśli ustawiono `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false` albo `browser.profiles.<name>.headless: false`,
  usuń to wymuszenie trybu z interfejsem, ustaw `OPENCLAW_BROWSER_HEADLESS=1`, uruchom `Xvfb`,
  uruchom `openclaw browser start --headless` dla jednorazowego zarządzanego uruchomienia albo uruchom
  OpenClaw w prawdziwej sesji pulpitu.

### Rozwiązanie 1: Zainstaluj Google Chrome (zalecane)

Zainstaluj oficjalny pakiet `.deb` Google Chrome, który nie jest sandboxowany przez snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

Następnie zaktualizuj konfigurację OpenClaw (`~/.openclaw/openclaw.json`):

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

### Rozwiązanie 2: Użyj Snap Chromium w trybie samego dołączania

Jeśli musisz używać Snap Chromium, skonfiguruj OpenClaw tak, aby dołączał do ręcznie uruchomionej przeglądarki:

1. Zaktualizuj konfigurację:

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

2. Uruchom Chromium ręcznie:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Opcjonalnie utwórz usługę użytkownika systemd, aby automatycznie uruchamiać Chrome:

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

Włącz za pomocą: `systemctl --user enable --now openclaw-browser.service`

### Weryfikacja działania przeglądarki

Sprawdź stan:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Przetestuj przeglądanie:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Dokumentacja konfiguracji

| Opcja                            | Opis                                                                 | Domyślnie                                                  |
| -------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| `browser.enabled`                | Włącz sterowanie przeglądarką                                        | `true`                                                     |
| `browser.executablePath`         | Ścieżka do binarnej przeglądarki opartej na Chromium (Chrome/Brave/Edge/Chromium) | wykrywane automatycznie (preferuje domyślną przeglądarkę, jeśli jest oparta na Chromium) |
| `browser.headless`               | Uruchamiaj bez GUI                                                   | `false`                                                    |
| `OPENCLAW_BROWSER_HEADLESS`      | Nadpisanie dla procesu dla trybu headless lokalnej zarządzanej przeglądarki | nieustawione                                               |
| `browser.noSandbox`              | Dodaj flagę `--no-sandbox` (wymagane w niektórych konfiguracjach Linuxa) | `false`                                                    |
| `browser.attachOnly`             | Nie uruchamiaj przeglądarki, tylko dołącz do istniejącej             | `false`                                                    |
| `browser.cdpPort`                | Port Chrome DevTools Protocol                                        | `18800`                                                    |
| `browser.localLaunchTimeoutMs`   | Limit czasu wykrywania lokalnego zarządzanego Chrome                 | `15000`                                                    |
| `browser.localCdpReadyTimeoutMs` | Limit czasu gotowości CDP po uruchomieniu lokalnego zarządzanego Chrome | `8000`                                                     |

Na Raspberry Pi, starszych hostach VPS albo wolnej pamięci masowej zwiększ
`browser.localLaunchTimeoutMs`, gdy Chrome potrzebuje więcej czasu, aby udostępnić swój punkt końcowy HTTP CDP.
Zwiększ `browser.localCdpReadyTimeoutMs`, gdy uruchomienie się udaje, ale
`openclaw browser start` nadal zgłasza `not reachable after start`. Wartości muszą
być dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe wartości konfiguracji są odrzucane.

### Problem: „Nie znaleziono kart Chrome dla profile=\"user\"”

Używasz profilu `existing-session` / Chrome MCP. OpenClaw widzi lokalnego Chrome,
ale nie ma dostępnych otwartych kart, do których można dołączyć.

Opcje naprawy:

1. **Użyj zarządzanej przeglądarki:** `openclaw browser start --browser-profile openclaw`
   (albo ustaw `browser.defaultProfile: "openclaw"`).
2. **Użyj Chrome MCP:** upewnij się, że lokalny Chrome jest uruchomiony i ma co najmniej jedną otwartą kartę, a następnie spróbuj ponownie z `--browser-profile user`.

Uwagi:

- `user` działa tylko na hoście lokalnym. Dla serwerów Linux, kontenerów albo zdalnych hostów preferuj profile CDP.
- Profile `user` / inne `existing-session` zachowują obecne ograniczenia Chrome MCP:
  działania oparte na ref, hooki przesyłania jednego pliku, brak nadpisań limitu czasu okna dialogowego, brak
  `wait --load networkidle` oraz brak `responsebody`, eksportu PDF, przechwytywania pobierania
  i działań wsadowych.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl`; ustawiaj je tylko dla zdalnego CDP.
- Zdalne profile CDP akceptują `http://`, `https://`, `ws://` i `wss://`.
  Użyj HTTP(S) do wykrywania `/json/version` albo WS(S), gdy usługa przeglądarki
  podaje bezpośredni URL gniazda DevTools.

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Logowanie w przeglądarce](/pl/tools/browser-login)
- [Rozwiązywanie problemów z przeglądarką WSL2](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
