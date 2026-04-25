---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Behebe CDP-Startprobleme von Chrome/Brave/Edge/Chromium für die OpenClaw-Browsersteuerung unter Linux.
title: Fehlerbehebung im Browser
x-i18n:
    generated_at: "2026-04-25T13:57:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6540de2c3141a92ad8bf7f6aedfc0ecb68293c939da2fed59e7fe2dd07ce8901
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Problem: „Chrome-CDP konnte auf Port 18800 nicht gestartet werden“

Der Browsersteuerungsserver von OpenClaw kann Chrome/Brave/Edge/Chromium nicht starten und meldet den Fehler:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Ursache

Unter Ubuntu (und vielen Linux-Distributionen) ist die Standardinstallation von Chromium ein **Snap-Paket**. Die AppArmor-Isolierung von Snap beeinträchtigt, wie OpenClaw den Browserprozess startet und überwacht.

Der Befehl `apt install chromium` installiert ein Stub-Paket, das an Snap weiterleitet:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Dies ist **kein** echter Browser – es ist nur ein Wrapper.

Weitere häufige Startfehler unter Linux:

- `The profile appears to be in use by another Chromium process` bedeutet, dass Chrome veraltete `Singleton*`-Sperrdateien im verwalteten Profilverzeichnis gefunden hat. OpenClaw entfernt diese Sperren und versucht es einmal erneut, wenn die Sperre auf einen beendeten Prozess oder einen Prozess auf einem anderen Host verweist.
- `Missing X server or $DISPLAY` bedeutet, dass ausdrücklich ein sichtbarer Browser auf einem Host ohne Desktop-Sitzung angefordert wurde. Standardmäßig fallen lokal verwaltete Profile unter Linux jetzt auf den Headless-Modus zurück, wenn sowohl `DISPLAY` als auch `WAYLAND_DISPLAY` nicht gesetzt sind. Wenn du `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` oder `browser.profiles.<name>.headless: false` gesetzt hast, entferne diese headed-Überschreibung, setze `OPENCLAW_BROWSER_HEADLESS=1`, starte `Xvfb`, führe `openclaw browser start --headless` für einen einmaligen verwalteten Start aus oder führe OpenClaw in einer echten Desktop-Sitzung aus.

### Lösung 1: Google Chrome installieren (empfohlen)

Installiere das offizielle `.deb`-Paket von Google Chrome, das nicht durch Snap sandboxed ist:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # falls Abhängigkeitsfehler auftreten
```

Aktualisiere dann deine OpenClaw-Konfiguration (`~/.openclaw/openclaw.json`):

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

### Lösung 2: Snap-Chromium mit Nur-Attach-Modus verwenden

Wenn du Snap-Chromium verwenden musst, konfiguriere OpenClaw so, dass es sich an einen manuell gestarteten Browser anhängt:

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

Browsen testen:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Konfigurationsreferenz

| Option                           | Beschreibung                                                         | Standard                                                    |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | Browsersteuerung aktivieren                                          | `true`                                                      |
| `browser.executablePath`         | Pfad zu einem Chromium-basierten Browser-Binary (Chrome/Brave/Edge/Chromium) | automatisch erkannt (bevorzugt den Standardbrowser, wenn Chromium-basiert) |
| `browser.headless`               | Ohne GUI ausführen                                                   | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | Pro-Prozess-Überschreibung für den Headless-Modus lokal verwalteter Browser | nicht gesetzt                                               |
| `browser.noSandbox`              | Flag `--no-sandbox` hinzufügen (für einige Linux-Setups erforderlich) | `false`                                                     |
| `browser.attachOnly`             | Browser nicht starten, nur an vorhandenen anhängen                   | `false`                                                     |
| `browser.cdpPort`                | Port für das Chrome DevTools Protocol                                | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | Timeout für die Erkennung von lokal verwaltetem Chrome               | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | Timeout für die CDP-Bereitschaft nach lokal verwaltetem Start        | `8000`                                                      |

Auf Raspberry Pi, älteren VPS-Hosts oder bei langsamem Speicher erhöhe
`browser.localLaunchTimeoutMs`, wenn Chrome mehr Zeit benötigt, um seinen CDP-HTTP-Endpunkt bereitzustellen. Erhöhe `browser.localCdpReadyTimeoutMs`, wenn der Start erfolgreich ist, `openclaw browser start` aber weiterhin `not reachable after start` meldet. Werte sind auf 120000 ms begrenzt.

### Problem: „Keine Chrome-Tabs für profile=\"user\" gefunden“

Du verwendest ein `existing-session`-/Chrome-MCP-Profil. OpenClaw kann lokales Chrome sehen, aber es stehen keine offenen Tabs zum Anhängen zur Verfügung.

Lösungsoptionen:

1. **Den verwalteten Browser verwenden:** `openclaw browser start --browser-profile openclaw`
   (oder `browser.defaultProfile: "openclaw"` setzen).
2. **Chrome MCP verwenden:** Stelle sicher, dass lokales Chrome läuft und mindestens ein Tab geöffnet ist, und versuche es dann erneut mit `--browser-profile user`.

Hinweise:

- `user` ist nur für den Host. Für Linux-Server, Container oder Remote-Hosts solltest du CDP-Profile bevorzugen.
- `user` und andere `existing-session`-Profile behalten die aktuellen Einschränkungen von Chrome MCP bei:
  referenzgesteuerte Aktionen, Hooks für Einzeldatei-Uploads, keine Überschreibungen für Dialog-Timeouts, kein
  `wait --load networkidle` sowie kein `responsebody`, kein PDF-Export, keine Download-Interception und keine Batch-Aktionen.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu; setze diese nur für Remote-CDP.
- Remote-CDP-Profile akzeptieren `http://`, `https://`, `ws://` und `wss://`.
  Verwende HTTP(S) für die Erkennung über `/json/version` oder WS(S), wenn dein Browserdienst dir eine direkte DevTools-Socket-URL bereitstellt.

## Zugehörig

- [Browser](/de/tools/browser)
- [Browser-Login](/de/tools/browser-login)
- [Fehlerbehebung für Browser unter WSL2](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
