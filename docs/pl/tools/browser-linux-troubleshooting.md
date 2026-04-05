---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Napraw problemy z uruchamianiem CDP w Chrome/Brave/Edge/Chromium dla sterowania przeglądarką OpenClaw w systemie Linux
title: Rozwiązywanie problemów z przeglądarką
x-i18n:
    generated_at: "2026-04-05T14:06:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ff8e6741558c1b5db86826c5e1cbafe35e35afe5cb2a53296c16653da59e516
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z przeglądarką (Linux)

## Problem: „Nie udało się uruchomić Chrome CDP na porcie 18800”

Serwer sterowania przeglądarką OpenClaw nie może uruchomić Chrome/Brave/Edge/Chromium i zwraca błąd:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Główna przyczyna

W Ubuntu (i wielu dystrybucjach Linuxa) domyślna instalacja Chromium jest **pakietem snap**. Ograniczenia AppArmor w snapie zakłócają sposób, w jaki OpenClaw uruchamia i monitoruje proces przeglądarki.

Polecenie `apt install chromium` instaluje pakiet pośredni, który przekierowuje do snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

To NIE jest prawdziwa przeglądarka — to tylko opakowanie.

### Rozwiązanie 1: zainstaluj Google Chrome (zalecane)

Zainstaluj oficjalny pakiet `.deb` Google Chrome, który nie jest ograniczony przez snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # jeśli wystąpią błędy zależności
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

### Rozwiązanie 2: użyj Snap Chromium w trybie tylko dołączania

Jeśli musisz używać snap Chromium, skonfiguruj OpenClaw tak, aby dołączał do ręcznie uruchomionej przeglądarki:

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

### Odniesienie do konfiguracji

| Opcja                    | Opis                                                                 | Domyślnie                                                   |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Włącza sterowanie przeglądarką                                       | `true`                                                      |
| `browser.executablePath` | Ścieżka do pliku binarnego przeglądarki opartej na Chromium (Chrome/Brave/Edge/Chromium) | wykrywana automatycznie (preferuje domyślną przeglądarkę, jeśli jest oparta na Chromium) |
| `browser.headless`       | Uruchamia bez GUI                                                    | `false`                                                     |
| `browser.noSandbox`      | Dodaje flagę `--no-sandbox` (wymagane w niektórych konfiguracjach Linuxa) | `false`                                                     |
| `browser.attachOnly`     | Nie uruchamia przeglądarki, tylko dołącza do istniejącej             | `false`                                                     |
| `browser.cdpPort`        | Port Chrome DevTools Protocol                                        | `18800`                                                     |

### Problem: „Nie znaleziono kart Chrome dla profile="user"”

Używasz profilu `existing-session` / Chrome MCP. OpenClaw widzi lokalny Chrome,
ale nie ma otwartych kart, do których można się dołączyć.

Opcje naprawy:

1. **Użyj przeglądarki zarządzanej:** `openclaw browser start --browser-profile openclaw`
   (lub ustaw `browser.defaultProfile: "openclaw"`).
2. **Użyj Chrome MCP:** upewnij się, że lokalny Chrome działa z co najmniej jedną otwartą kartą, a następnie ponów próbę z `--browser-profile user`.

Uwagi:

- `user` działa tylko na hoście. Dla serwerów Linux, kontenerów lub zdalnych hostów preferuj profile CDP.
- `user` / inne profile `existing-session` zachowują bieżące ograniczenia Chrome MCP:
  działania oparte na odwołaniach, hooki przesyłania jednego pliku, brak nadpisań limitu czasu dialogów, brak
  `wait --load networkidle` oraz brak `responsebody`, eksportu PDF, przechwytywania pobrań
  i działań wsadowych.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl`; ustawiaj je tylko dla zdalnego CDP.
- Zdalne profile CDP akceptują `http://`, `https://`, `ws://` i `wss://`.
  Używaj HTTP(S) do wykrywania `/json/version`, albo WS(S), gdy usługa przeglądarki
  udostępnia bezpośredni URL gniazda DevTools.
