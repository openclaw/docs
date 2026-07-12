---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Beheben von Chrome-/Brave-/Edge-/Chromium-CDP-Startproblemen bei der OpenClaw-Browsersteuerung unter Linux
title: Fehlerbehebung im Browser
x-i18n:
    generated_at: "2026-07-12T15:56:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Problem: Chrome CDP konnte auf Port 18800 nicht gestartet werden

```json
{ "error": "Fehler: Chrome CDP konnte für das Profil \"openclaw\" nicht auf Port 18800 gestartet werden." }
```

### Ursache

Unter Ubuntu und den meisten Linux-Distributionen installiert `apt install chromium` einen Snap-
Wrapper und keinen echten Browser:

```text
Hinweis: »chromium-browser« wird anstelle von »chromium« gewählt.
chromium-browser ist bereits die neueste Version (2:1snap1-0ubuntu2).
```

Die AppArmor-Beschränkungen von Snap beeinträchtigen die Art und Weise, wie OpenClaw
den Browserprozess startet und überwacht.

Weitere häufige Startfehler unter Linux:

- `The profile appears to be in use by another Chromium process`: veraltete
  `Singleton*`-Sperrdateien im verwalteten Profilverzeichnis. OpenClaw entfernt
  diese Sperren und versucht es einmal erneut, wenn die Sperre auf einen nicht mehr laufenden Prozess
  oder einen Prozess auf einem anderen Host verweist.
- `Missing X server or $DISPLAY`: Auf einem Host ohne Desktop-Sitzung wurde
  ausdrücklich ein sichtbarer Browser angefordert. Lokale verwaltete Profile wechseln unter Linux
  in den Headless-Modus, wenn sowohl `DISPLAY` als auch `WAYLAND_DISPLAY` nicht gesetzt sind.
  Wenn Sie `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` oder
  `browser.profiles.<name>.headless: false` festgelegt haben, entfernen Sie diese Überschreibung
  für den sichtbaren Modus, legen Sie `OPENCLAW_BROWSER_HEADLESS=1` fest, starten Sie `Xvfb`, führen Sie
  für einen einmaligen verwalteten Start `openclaw browser start --headless` aus oder führen Sie
  OpenClaw in einer echten Desktop-Sitzung aus.

### Lösung 1: Google Chrome installieren (empfohlen)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # falls Abhängigkeitsfehler auftreten
```

Aktualisieren Sie `~/.openclaw/openclaw.json`:

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

### Lösung 2: Snap Chromium im reinen Verbindungsmodus verwenden

Wenn Sie Snap Chromium beibehalten müssen, konfigurieren Sie OpenClaw so, dass es sich mit einem
manuell gestarteten Browser verbindet, anstatt ihn zu starten:

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

Starten Sie Chromium manuell:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

Optional können Sie ihn mit einem systemd-Benutzerdienst automatisch starten:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw-Browser (Chrome CDP)
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

### Funktionsfähigkeit des Browsers überprüfen

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Konfigurationsreferenz

| Option                           | Beschreibung                                                                 | Standardwert                                                               |
| -------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `browser.enabled`                | Browsersteuerung aktivieren                                                  | `true`                                                                     |
| `browser.executablePath`         | Pfad zu einer Chromium-basierten Browser-Binärdatei (Chrome/Brave/Edge/Chromium) | automatisch erkannt (bevorzugt den Standardbrowser des Betriebssystems, wenn er Chromium-basiert ist) |
| `browser.headless`               | Ohne grafische Benutzeroberfläche ausführen                                  | `false`                                                                    |
| `OPENCLAW_BROWSER_HEADLESS`      | Prozessspezifische Überschreibung für den Headless-Modus des lokal verwalteten Browsers | nicht gesetzt                                                     |
| `browser.noSandbox`              | Flag `--no-sandbox` hinzufügen (für einige Linux-Konfigurationen erforderlich) | `false`                                                                  |
| `browser.attachOnly`             | Keinen Browser starten, sondern nur eine Verbindung zu einem vorhandenen herstellen | `false`                                                             |
| `browser.cdpPortRangeStart`      | Erster lokaler CDP-Port für automatisch zugewiesene Profile                  | `18800` (vom Gateway-Port abgeleitet)                                      |
| `browser.localLaunchTimeoutMs`   | Zeitlimit für die Erkennung des lokal verwalteten Chrome, bis zu `120000`     | `15000`                                                                    |
| `browser.localCdpReadyTimeoutMs` | Zeitlimit für die CDP-Bereitschaft nach dem lokalen Start, bis zu `120000`    | `8000`                                                                     |

Beide Zeitlimitwerte müssen positive Ganzzahlen bis zu `120000` ms sein; andere Werte
werden beim Laden der Konfiguration abgelehnt. Erhöhen Sie auf Raspberry Pi, älteren
VPS-Hosts oder langsamen Speichermedien `browser.localLaunchTimeoutMs`, wenn Chrome mehr
Zeit benötigt, um seinen CDP-HTTP-Endpunkt bereitzustellen. Erhöhen Sie
`browser.localCdpReadyTimeoutMs`, wenn der Start erfolgreich ist, aber
`openclaw browser start` weiterhin `not reachable
after start` meldet.

### Problem: Keine Chrome-Tabs für profile="user" gefunden

Sie verwenden das Profil `user` (`existing-session` / Chrome MCP), und es sind
keine Tabs geöffnet, zu denen eine Verbindung hergestellt werden kann.

Lösungsmöglichkeiten:

1. Verwenden Sie stattdessen den verwalteten Browser:
   `openclaw browser --browser-profile openclaw start` (oder legen Sie
   `browser.defaultProfile: "openclaw"` fest).
2. Lassen Sie lokales Chrome mit mindestens einem geöffneten Tab laufen und versuchen Sie es dann erneut mit
   `--browser-profile user`.

Hinweise:

- `user` ist ausschließlich auf dem Host verfügbar. Bevorzugen Sie auf Linux-Servern,
  in Containern oder auf Remote-Hosts stattdessen CDP-Profile.
- Für `user` und andere `existing-session`-Profile gelten die aktuellen Einschränkungen
  von Chrome MCP: nur referenzgesteuerte Aktionen, eine Datei pro Upload, keine
  Überschreibungen von `timeoutMs` für Dialoge, kein `wait --load networkidle` und
  weder `responsebody`, PDF-Export, Download-Abfangung noch Batch-Aktionen.
- Lokale Profile mit `openclaw`-Treiber weisen `cdpPort`/`cdpUrl` automatisch zu;
  legen Sie diese nur für Remote-CDP manuell fest.
- Remote-CDP-Profile akzeptieren `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S) für die Erkennung über `/json/version` oder WS(S), wenn Ihr
  Browserdienst Ihnen eine direkte DevTools-Socket-URL bereitstellt.

## Verwandte Themen

- [Browser](/de/tools/browser)
- [Browser-Anmeldung](/de/tools/browser-login)
- [Fehlerbehebung für Browser mit WSL2](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
