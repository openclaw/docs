---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: CDP-Startprobleme mit Chrome/Brave/Edge/Chromium für die OpenClaw-Browsersteuerung unter Linux beheben
title: Fehlerbehebung im Browser
x-i18n:
    generated_at: "2026-04-30T07:16:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9a91ea42a8a600163bcf66ad398677175bd0c5186d3e1dddb629a55c2ea66ed
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Problem: „Failed to start Chrome CDP on port 18800“

Der Browser-Steuerungsserver von OpenClaw kann Chrome/Brave/Edge/Chromium nicht starten und gibt folgenden Fehler aus:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Ursache

Unter Ubuntu (und vielen Linux-Distributionen) ist die Standardinstallation von Chromium ein **snap-Paket**. Die AppArmor-Einschränkung von snap beeinträchtigt, wie OpenClaw den Browserprozess startet und überwacht.

Der Befehl `apt install chromium` installiert ein Stub-Paket, das auf snap umleitet:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Das ist KEIN echter Browser - es ist nur ein Wrapper.

Weitere häufige Linux-Startfehler:

- `The profile appears to be in use by another Chromium process` bedeutet, dass Chrome
  veraltete `Singleton*`-Sperrdateien im verwalteten Profilverzeichnis gefunden hat. OpenClaw
  entfernt diese Sperren und versucht es einmal erneut, wenn die Sperre auf einen beendeten Prozess oder
  einen Prozess auf einem anderen Host verweist.
- `Missing X server or $DISPLAY` bedeutet, dass ein sichtbarer Browser ausdrücklich
  auf einem Host ohne Desktop-Sitzung angefordert wurde. Standardmäßig fallen lokal verwaltete
  Profile unter Linux jetzt auf den Headless-Modus zurück, wenn weder `DISPLAY` noch
  `WAYLAND_DISPLAY` gesetzt ist. Wenn Sie `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false` oder `browser.profiles.<name>.headless: false` festgelegt haben,
  entfernen Sie diese Headed-Überschreibung, setzen Sie `OPENCLAW_BROWSER_HEADLESS=1`, starten Sie `Xvfb`,
  führen Sie `openclaw browser start --headless` für einen einmaligen verwalteten Start aus oder führen Sie
  OpenClaw in einer echten Desktop-Sitzung aus.

### Lösung 1: Google Chrome installieren (empfohlen)

Installieren Sie das offizielle `.deb`-Paket von Google Chrome, das nicht durch snap sandboxed wird:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

Aktualisieren Sie anschließend Ihre OpenClaw-Konfiguration (`~/.openclaw/openclaw.json`):

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

### Lösung 2: Snap Chromium mit Attach-Only-Modus verwenden

Wenn Sie snap Chromium verwenden müssen, konfigurieren Sie OpenClaw so, dass es eine manuell gestartete Browserinstanz verbindet:

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

### Prüfen, ob der Browser funktioniert

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

| Option                           | Beschreibung                                                                  | Standardwert                                                           |
| -------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `browser.enabled`                | Browsersteuerung aktivieren                                                   | `true`                                                                 |
| `browser.executablePath`         | Pfad zu einer Chromium-basierten Browser-Binärdatei (Chrome/Brave/Edge/Chromium) | automatisch erkannt (bevorzugt den Standardbrowser, wenn Chromium-basiert) |
| `browser.headless`               | Ohne GUI ausführen                                                            | `false`                                                                |
| `OPENCLAW_BROWSER_HEADLESS`      | Prozessspezifische Überschreibung für den Headless-Modus des lokal verwalteten Browsers | nicht gesetzt                                                          |
| `browser.noSandbox`              | Flag `--no-sandbox` hinzufügen (für einige Linux-Setups erforderlich)         | `false`                                                                |
| `browser.attachOnly`             | Browser nicht starten, nur mit vorhandenem verbinden                          | `false`                                                                |
| `browser.cdpPort`                | Port des Chrome DevTools Protocol                                             | `18800`                                                                |
| `browser.localLaunchTimeoutMs`   | Timeout für die lokale verwaltete Chrome-Erkennung                            | `15000`                                                                |
| `browser.localCdpReadyTimeoutMs` | Timeout für die CDP-Bereitschaft nach lokalem verwaltetem Start               | `8000`                                                                 |

Auf Raspberry Pi, älteren VPS-Hosts oder langsamem Speicher erhöhen Sie
`browser.localLaunchTimeoutMs`, wenn Chrome mehr Zeit benötigt, um seinen CDP-HTTP-
Endpoint bereitzustellen. Erhöhen Sie `browser.localCdpReadyTimeoutMs`, wenn der Start erfolgreich ist, aber
`openclaw browser start` weiterhin `not reachable after start` meldet. Werte müssen
positive Ganzzahlen bis `120000` ms sein; ungültige Konfigurationswerte werden abgelehnt.

### Problem: „No Chrome tabs found for profile=\"user\"“

Sie verwenden ein `existing-session`- / Chrome-MCP-Profil. OpenClaw kann lokales Chrome sehen,
aber es sind keine geöffneten Tabs verfügbar, mit denen eine Verbindung hergestellt werden kann.

Behebungsoptionen:

1. **Den verwalteten Browser verwenden:** `openclaw browser start --browser-profile openclaw`
   (oder `browser.defaultProfile: "openclaw"` festlegen).
2. **Chrome MCP verwenden:** Stellen Sie sicher, dass lokales Chrome mit mindestens einem geöffneten Tab läuft, und versuchen Sie es anschließend erneut mit `--browser-profile user`.

Hinweise:

- `user` ist nur für den Host. Für Linux-Server, Container oder Remote-Hosts sollten Sie CDP-Profile bevorzugen.
- `user`- / andere `existing-session`-Profile behalten die aktuellen Chrome-MCP-Einschränkungen bei:
  referenzgesteuerte Aktionen, Hooks für Ein-Datei-Uploads, keine Überschreibungen für Dialog-Timeouts, kein
  `wait --load networkidle` und kein `responsebody`, kein PDF-Export, keine Download-
  Interception und keine Batch-Aktionen.
- Lokale `openclaw`-Profile weisen `cdpPort`/`cdpUrl` automatisch zu; legen Sie diese nur für Remote-CDP fest.
- Remote-CDP-Profile akzeptieren `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S) für die Erkennung über `/json/version` oder WS(S), wenn Ihr Browserdienst
  Ihnen eine direkte DevTools-Socket-URL bereitstellt.

## Verwandte Themen

- [Browser](/de/tools/browser)
- [Browser-Anmeldung](/de/tools/browser-login)
- [Browser-WSL2-Fehlerbehebung](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
