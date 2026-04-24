---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Naprawianie problemów z uruchamianiem CDP w Chrome/Brave/Edge/Chromium dla sterowania przeglądarką OpenClaw w systemie Linux
title: Rozwiązywanie problemów z przeglądarką
x-i18n:
    generated_at: "2026-04-24T09:34:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6f59048d6a5b587b8d6c9ac0d32b3215f68a7e39192256b28f22936cab752e1
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Problem: „Nie udało się uruchomić Chrome CDP na porcie 18800”

Serwer sterowania przeglądarką OpenClaw nie uruchamia Chrome/Brave/Edge/Chromium i zgłasza błąd:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Główna przyczyna

W Ubuntu (i wielu dystrybucjach Linux) domyślna instalacja Chromium jest **pakietem snap**. Ograniczenia AppArmor w snap zakłócają sposób, w jaki OpenClaw uruchamia i monitoruje proces przeglądarki.

Polecenie `apt install chromium` instaluje pakiet pośredni, który przekierowuje do snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

To NIE jest prawdziwa przeglądarka — to tylko wrapper.

### Rozwiązanie 1: Zainstaluj Google Chrome (zalecane)

Zainstaluj oficjalny pakiet `.deb` Google Chrome, który nie jest sandboxowany przez snap:

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

### Rozwiązanie 2: Użyj Snap Chromium w trybie tylko do podłączania

Jeśli musisz używać Snap Chromium, skonfiguruj OpenClaw tak, aby podłączał się do ręcznie uruchomionej przeglądarki:

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

Włącz przez: `systemctl --user enable --now openclaw-browser.service`

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

| Opcja                    | Opis                                                                 | Domyślnie                                                   |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Włącza sterowanie przeglądarką                                       | `true`                                                      |
| `browser.executablePath` | Ścieżka do binarium przeglądarki opartej na Chromium (Chrome/Brave/Edge/Chromium) | wykrywana automatycznie (preferuje domyślną przeglądarkę, jeśli oparta na Chromium) |
| `browser.headless`       | Uruchamianie bez GUI                                                 | `false`                                                     |
| `browser.noSandbox`      | Dodaje flagę `--no-sandbox` (wymagane w niektórych konfiguracjach Linux) | `false`                                                     |
| `browser.attachOnly`     | Nie uruchamia przeglądarki, tylko podłącza się do istniejącej        | `false`                                                     |
| `browser.cdpPort`        | Port Chrome DevTools Protocol                                        | `18800`                                                     |

### Problem: „Nie znaleziono kart Chrome dla profile="user"”

Używasz profilu `existing-session` / Chrome MCP. OpenClaw widzi lokalną przeglądarkę Chrome,
ale nie ma żadnych otwartych kart, do których można się podłączyć.

Opcje naprawy:

1. **Użyj zarządzanej przeglądarki:** `openclaw browser start --browser-profile openclaw`
   (lub ustaw `browser.defaultProfile: "openclaw"`).
2. **Użyj Chrome MCP:** upewnij się, że lokalna przeglądarka Chrome działa i ma co najmniej jedną otwartą kartę, a następnie ponów próbę z `--browser-profile user`.

Uwagi:

- `user` działa tylko na hoście. W przypadku serwerów Linux, kontenerów lub zdalnych hostów preferuj profile CDP.
- `user` / inne profile `existing-session` zachowują obecne ograniczenia Chrome MCP:
  działania sterowane przez referencje, hooki przesyłania pojedynczego pliku, brak nadpisywania limitów czasu okien dialogowych, brak
  `wait --load networkidle`, a także brak `responsebody`, eksportu PDF, przechwytywania pobierania
  i działań wsadowych.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl`; ustawiaj je tylko dla zdalnego CDP.
- Zdalne profile CDP akceptują `http://`, `https://`, `ws://` i `wss://`.
  Użyj HTTP(S) do wykrywania `/json/version` albo WS(S), gdy Twoja usługa
  przeglądarki podaje bezpośredni URL gniazda DevTools.

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Logowanie w przeglądarce](/pl/tools/browser-login)
- [Rozwiązywanie problemów z przeglądarką WSL2 w Windows przy zdalnym CDP](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
