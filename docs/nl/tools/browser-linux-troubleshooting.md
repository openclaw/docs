---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Problemen met het opstarten van Chrome/Brave/Edge/Chromium CDP voor OpenClaw-browserbesturing op Linux oplossen
title: Problemen met de browser oplossen
x-i18n:
    generated_at: "2026-07-12T09:20:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Probleem: Chrome CDP kan niet worden gestart op poort 18800

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### Hoofdoorzaak

Op Ubuntu en de meeste Linux-distributies installeert `apt install chromium` een snap-wrapper en geen echte browser:

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

De AppArmor-beperkingen van snap verstoren de manier waarop OpenClaw het browserproces start en bewaakt.

Andere veelvoorkomende opstartfouten in Linux:

- `The profile appears to be in use by another Chromium process`: verouderde `Singleton*`-vergrendelingsbestanden in de beheerde profielmap. OpenClaw verwijdert deze vergrendelingen en probeert het één keer opnieuw wanneer de vergrendeling verwijst naar een beëindigd proces of een proces op een andere host.
- `Missing X server or $DISPLAY`: er is expliciet om een zichtbare browser gevraagd op een host zonder desktopsessie. Lokale beheerde profielen vallen in Linux terug op headless-modus wanneer zowel `DISPLAY` als `WAYLAND_DISPLAY` niet is ingesteld. Als u `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` of `browser.profiles.<name>.headless: false` hebt ingesteld, verwijder dan die instelling voor zichtbare modus, stel `OPENCLAW_BROWSER_HEADLESS=1` in, start `Xvfb`, voer `openclaw browser start --headless` uit voor een eenmalige beheerde start of voer OpenClaw uit in een echte desktopsessie.

### Oplossing 1: installeer Google Chrome (aanbevolen)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # bij afhankelijkheidsfouten
```

Werk `~/.openclaw/openclaw.json` bij:

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

### Oplossing 2: gebruik snap Chromium in de modus voor uitsluitend koppelen

Als u snap Chromium moet behouden, configureert u OpenClaw om verbinding te maken met een handmatig gestarte browser in plaats van deze zelf te starten:

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

Start Chromium handmatig:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

U kunt Chromium desgewenst automatisch starten met een systemd-gebruikersservice:

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

### Controleren of de browser werkt

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Configuratieoverzicht

| Optie                            | Beschrijving                                                                 | Standaard                                                                |
| -------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `browser.enabled`                | Browserbesturing inschakelen                                                 | `true`                                                                   |
| `browser.executablePath`         | Pad naar een Chromium-browserprogramma (Chrome/Brave/Edge/Chromium)           | automatisch gedetecteerd (geeft de voorkeur aan de op Chromium gebaseerde standaardbrowser van het besturingssysteem) |
| `browser.headless`               | Zonder grafische gebruikersinterface uitvoeren                               | `false`                                                                  |
| `OPENCLAW_BROWSER_HEADLESS`      | Procesgebonden overschrijving voor de headless-modus van de lokaal beheerde browser | niet ingesteld                                                     |
| `browser.noSandbox`              | De vlag `--no-sandbox` toevoegen (vereist voor sommige Linux-configuraties)   | `false`                                                                  |
| `browser.attachOnly`             | Geen browser starten; alleen verbinding maken met een bestaande browser       | `false`                                                                  |
| `browser.cdpPortRangeStart`      | Eerste lokale CDP-poort voor automatisch toegewezen profielen                 | `18800` (afgeleid van de Gateway-poort)                                  |
| `browser.localLaunchTimeoutMs`   | Time-out voor het vinden van lokaal beheerde Chrome, maximaal `120000`        | `15000`                                                                  |
| `browser.localCdpReadyTimeoutMs` | Time-out voor CDP-gereedheid na het lokaal beheerd starten, maximaal `120000` | `8000`                                                                   |

Beide time-outwaarden moeten positieve gehele getallen van maximaal `120000` ms zijn; andere waarden worden geweigerd bij het laden van de configuratie. Verhoog op Raspberry Pi, oudere VPS-hosts of trage opslag `browser.localLaunchTimeoutMs` wanneer Chrome meer tijd nodig heeft om het HTTP-eindpunt van CDP beschikbaar te maken. Verhoog `browser.localCdpReadyTimeoutMs` wanneer het starten slaagt, maar `openclaw browser start` nog steeds `not reachable after start` meldt.

### Probleem: geen Chrome-tabbladen gevonden voor profile="user"

U gebruikt het profiel `user` (`existing-session` / Chrome MCP) en er zijn geen geopende tabbladen waarmee verbinding kan worden gemaakt.

Mogelijke oplossingen:

1. Gebruik in plaats daarvan de beheerde browser:
   `openclaw browser --browser-profile openclaw start` (of stel
   `browser.defaultProfile: "openclaw"` in).
2. Laat lokale Chrome actief met ten minste één geopend tabblad en probeer het vervolgens opnieuw met
   `--browser-profile user`.

Opmerkingen:

- `user` werkt alleen op de host. Geef op Linux-servers, in containers of op externe hosts de voorkeur aan CDP-profielen.
- `user` en andere `existing-session`-profielen delen de huidige beperkingen van Chrome MCP: alleen acties op basis van referenties, één bestand per upload, geen overschrijvingen van `timeoutMs` voor dialoogvensters, geen `wait --load networkidle` en geen `responsebody`, PDF-export, onderschepping van downloads of batchacties.
- Lokale profielen met het stuurprogramma `openclaw` wijzen automatisch `cdpPort`/`cdpUrl` toe; stel deze alleen handmatig in voor externe CDP.
- Externe CDP-profielen accepteren `http://`, `https://`, `ws://` en `wss://`. Gebruik HTTP(S) voor detectie via `/json/version` of WS(S) wanneer uw browserservice u een rechtstreekse DevTools-socket-URL verstrekt.

## Gerelateerd

- [Browser](/nl/tools/browser)
- [Browseraanmelding](/nl/tools/browser-login)
- [Problemen met Browser in WSL2 oplossen](/nl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
