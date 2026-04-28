---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: CDP-Startprobleme von Chrome/Brave/Edge/Chromium für die OpenClaw-Browsersteuerung unter Linux beheben
title: Browser-Fehlerbehebung
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:39:49Z"
  model: gpt-5.4
  provider: openai
  source_hash: 69e5b42532af002af3d6a3ab21df7f82d2d62ce9f23b57a94cdb97e8ac65df3b
  source_path: tools/browser-linux-troubleshooting.md
  workflow: 15
---

## Problem: „Chrome CDP auf Port 18800 konnte nicht gestartet werden“

Der Browser-Control-Server von OpenClaw kann Chrome/Brave/Edge/Chromium nicht mit folgendem Fehler starten:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Grundursache

Unter Ubuntu (und vielen Linux-Distributionen) ist die Standardinstallation von Chromium ein **Snap-Paket**. Die AppArmor-Isolation von Snap stört die Art und Weise, wie OpenClaw den Browserprozess startet und überwacht.

Der Befehl `apt install chromium` installiert ein Stub-Paket, das auf Snap umleitet:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Dies ist **kein** echter Browser, sondern nur ein Wrapper.

Weitere häufige Linux-Startfehler:

- `The profile appears to be in use by another Chromium process` bedeutet, dass Chrome veraltete `Singleton*`-Lock-Dateien im verwalteten Profilverzeichnis gefunden hat. OpenClaw entfernt diese Sperren und versucht es einmal erneut, wenn die Sperre auf einen beendeten Prozess oder einen Prozess auf einem anderen Host verweist.
- `Missing X server or $DISPLAY` bedeutet, dass ein sichtbarer Browser explizit auf einem Host ohne Desktop-Sitzung angefordert wurde. Standardmäßig fallen lokal verwaltete Profile unter Linux jetzt auf den Headless-Modus zurück, wenn sowohl `DISPLAY` als auch `WAYLAND_DISPLAY` nicht gesetzt sind. Wenn Sie `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` oder `browser.profiles.<name>.headless: false` gesetzt haben, entfernen Sie diese Headed-Überschreibung, setzen Sie `OPENCLAW_BROWSER_HEADLESS=1`, starten Sie `Xvfb`, führen Sie `openclaw browser start --headless` für einen einmaligen verwalteten Start aus oder führen Sie OpenClaw in einer echten Desktop-Sitzung aus.

### Lösung 1: Google Chrome installieren (empfohlen)

Installieren Sie das offizielle `.deb`-Paket von Google Chrome, das nicht durch Snap sandboxed ist:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # falls Abhängigkeitsfehler auftreten
```

Aktualisieren Sie dann Ihre OpenClaw-Konfiguration (`~/.openclaw/openclaw.json`):

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

### Lösung 2: Snap-Chromium mit dem Attach-only-Modus verwenden

Wenn Sie Snap-Chromium verwenden müssen, konfigurieren Sie OpenClaw so, dass es sich an einen manuell gestarteten Browser anhängt:

1. Konfiguration aktualisieren:

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

2. Chromium manuell starten:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Optional einen systemd-Benutzerdienst erstellen, um Chrome automatisch zu starten:

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

Aktivieren mit: `systemctl --user enable --now openclaw-browser.service`

### Überprüfen, ob der Browser funktioniert

Status prüfen:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Browsing testen:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Konfigurationsreferenz

| Option                           | Beschreibung                                                        | Standard                                                     |
| -------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `browser.enabled`                | Browsersteuerung aktivieren                                         | `true`                                                       |
| `browser.executablePath`         | Pfad zu einer Chromium-basierten Browser-Binärdatei (Chrome/Brave/Edge/Chromium) | automatisch erkannt (bevorzugt den Standardbrowser, wenn er Chromium-basiert ist) |
| `browser.headless`               | Ohne GUI ausführen                                                  | `false`                                                      |
| `OPENCLAW_BROWSER_HEADLESS`      | Prozessbezogene Überschreibung für den Headless-Modus des lokalen verwalteten Browsers | nicht gesetzt                                                |
| `browser.noSandbox`              | Flag `--no-sandbox` hinzufügen (für einige Linux-Setups erforderlich) | `false`                                                      |
| `browser.attachOnly`             | Browser nicht starten, sondern nur an einen vorhandenen anhängen    | `false`                                                      |
| `browser.cdpPort`                | Chrome DevTools Protocol-Port                                       | `18800`                                                      |
| `browser.localLaunchTimeoutMs`   | Timeout für die Erkennung von lokal verwaltetem Chrome             | `15000`                                                      |
| `browser.localCdpReadyTimeoutMs` | Timeout für die CDP-Bereitschaft nach lokal verwaltetem Start      | `8000`                                                       |

Erhöhen Sie auf Raspberry Pi, älteren VPS-Hosts oder bei langsamen Speichermedien
`browser.localLaunchTimeoutMs`, wenn Chrome mehr Zeit benötigt, um seinen CDP-HTTP-
Endpunkt bereitzustellen. Erhöhen Sie `browser.localCdpReadyTimeoutMs`, wenn der
Start erfolgreich ist, aber `openclaw browser start` weiterhin `not reachable after start`
meldet. Die Werte müssen positive Ganzzahlen bis `120000` ms sein; ungültige
Konfigurationswerte werden abgelehnt.

### Problem: „Keine Chrome-Tabs für profile=\"user\" gefunden“

Sie verwenden ein `existing-session`-/Chrome-MCP-Profil. OpenClaw kann lokales Chrome sehen,
aber es sind keine offenen Tabs verfügbar, an die angehängt werden kann.

Mögliche Lösungen:

1. **Den verwalteten Browser verwenden:** `openclaw browser start --browser-profile openclaw`
   (oder `browser.defaultProfile: "openclaw"` setzen).
2. **Chrome MCP verwenden:** Stellen Sie sicher, dass lokales Chrome mit mindestens einem offenen Tab läuft, und versuchen Sie es dann erneut mit `--browser-profile user`.

Hinweise:

- `user` ist nur für den Host. Für Linux-Server, Container oder entfernte Hosts sollten CDP-Profile bevorzugt werden.
- `user` / andere `existing-session`-Profile behalten die aktuellen Beschränkungen von Chrome MCP:
  ref-gesteuerte Aktionen, Hooks für Einzeldatei-Uploads, keine Überschreibungen für Dialog-Timeouts, kein
  `wait --load networkidle` und kein `responsebody`, kein PDF-Export, keine Download-
  Interception und keine Batch-Aktionen.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu; setzen Sie diese nur für Remote-CDP.
- Remote-CDP-Profile akzeptieren `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S) für die Erkennung über `/json/version` oder WS(S), wenn Ihr Browser-
  Dienst Ihnen eine direkte DevTools-Socket-URL bereitstellt.

## Verwandt

- [Browser](/de/tools/browser)
- [Browser-Login](/de/tools/browser-login)
- [Browser-Fehlerbehebung für WSL2](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
