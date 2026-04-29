---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Los CDP-opstartproblemen in Chrome/Brave/Edge/Chromium op voor de browserbesturing van OpenClaw op Linux
title: Browserproblemen oplossen
x-i18n:
    generated_at: "2026-04-29T23:21:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9a91ea42a8a600163bcf66ad398677175bd0c5186d3e1dddb629a55c2ea66ed
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Probleem: "Failed to start Chrome CDP on port 18800"

De browserbesturingsserver van OpenClaw kan Chrome/Brave/Edge/Chromium niet starten met de fout:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Hoofdoorzaak

Op Ubuntu (en veel Linux-distributies) is de standaardinstallatie van Chromium een **snap-pakket**. De AppArmor-afscherming van snap verstoort de manier waarop OpenClaw het browserproces start en bewaakt.

De opdracht `apt install chromium` installeert een stubpakket dat doorverwijst naar snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Dit is GEEN echte browser - het is alleen een wrapper.

Andere veelvoorkomende Linux-startfouten:

- `The profile appears to be in use by another Chromium process` betekent dat Chrome
  verouderde `Singleton*`-lockbestanden in de beheerde profielmap heeft gevonden. OpenClaw
  verwijdert die locks en probeert het eenmaal opnieuw wanneer de lock verwijst naar een dood
  proces of een proces op een andere host.
- `Missing X server or $DISPLAY` betekent dat er expliciet om een zichtbare browser is
  gevraagd op een host zonder desktopsessie. Standaard vallen lokale beheerde
  profielen op Linux nu terug op headless-modus wanneer `DISPLAY` en
  `WAYLAND_DISPLAY` allebei niet zijn ingesteld. Als je `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false` of `browser.profiles.<name>.headless: false` hebt ingesteld,
  verwijder dan die headed-override, stel `OPENCLAW_BROWSER_HEADLESS=1` in, start `Xvfb`,
  voer `openclaw browser start --headless` uit voor een eenmalige beheerde start, of voer
  OpenClaw uit in een echte desktopsessie.

### Oplossing 1: Installeer Google Chrome (Aanbevolen)

Installeer het officiële Google Chrome `.deb`-pakket, dat niet door snap wordt gesandboxt:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

Werk daarna je OpenClaw-configuratie bij (`~/.openclaw/openclaw.json`):

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

### Oplossing 2: Gebruik Snap Chromium met alleen-koppelenmodus

Als je snap Chromium moet gebruiken, configureer OpenClaw dan om te koppelen aan een handmatig gestarte browser:

1. Werk de configuratie bij:

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

2. Start Chromium handmatig:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Maak eventueel een systemd-gebruikersservice om Chrome automatisch te starten:

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

Schakel in met: `systemctl --user enable --now openclaw-browser.service`

### Controleren of de browser werkt

Controleer de status:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Test browsen:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Configuratiereferentie

| Optie                            | Beschrijving                                                        | Standaard                                                   |
| -------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | Browserbesturing inschakelen                                        | `true`                                                      |
| `browser.executablePath`         | Pad naar een op Chromium gebaseerde browser-binary (Chrome/Brave/Edge/Chromium) | automatisch gedetecteerd (geeft voorkeur aan standaardbrowser wanneer die op Chromium is gebaseerd) |
| `browser.headless`               | Uitvoeren zonder GUI                                                | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | Override per proces voor headless-modus van lokale beheerde browser | niet ingesteld                                              |
| `browser.noSandbox`              | Voeg de vlag `--no-sandbox` toe (nodig voor sommige Linux-setups)   | `false`                                                     |
| `browser.attachOnly`             | Browser niet starten, alleen koppelen aan bestaande browser         | `false`                                                     |
| `browser.cdpPort`                | Chrome DevTools Protocol-poort                                      | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | Time-out voor lokale beheerde Chrome-detectie                       | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | Time-out voor CDP-gereedheid na lokale beheerde start               | `8000`                                                      |

Verhoog op Raspberry Pi, oudere VPS-hosts of trage opslag
`browser.localLaunchTimeoutMs` wanneer Chrome meer tijd nodig heeft om zijn CDP HTTP-
endpoint beschikbaar te maken. Verhoog `browser.localCdpReadyTimeoutMs` wanneer het starten lukt maar
`openclaw browser start` nog steeds `not reachable after start` meldt. Waarden moeten
positieve gehele getallen tot `120000` ms zijn; ongeldige configuratiewaarden worden geweigerd.

### Probleem: "No Chrome tabs found for profile=\"user\""

Je gebruikt een `existing-session` / Chrome MCP-profiel. OpenClaw kan lokale Chrome zien,
maar er zijn geen open tabbladen beschikbaar om aan te koppelen.

Oplossingsopties:

1. **Gebruik de beheerde browser:** `openclaw browser start --browser-profile openclaw`
   (of stel `browser.defaultProfile: "openclaw"` in).
2. **Gebruik Chrome MCP:** zorg ervoor dat lokale Chrome actief is met minstens één open tabblad, en probeer het daarna opnieuw met `--browser-profile user`.

Opmerkingen:

- `user` is alleen voor de host. Geef voor Linux-servers, containers of externe hosts de voorkeur aan CDP-profielen.
- `user` / andere `existing-session`-profielen behouden de huidige Chrome MCP-beperkingen:
  ref-gestuurde acties, hooks voor uploaden van één bestand, geen overrides voor dialoogtime-outs, geen
  `wait --load networkidle`, en geen `responsebody`, PDF-export, download-
  interceptie of batchacties.
- Lokale `openclaw`-profielen wijzen `cdpPort`/`cdpUrl` automatisch toe; stel die alleen in voor externe CDP.
- Externe CDP-profielen accepteren `http://`, `https://`, `ws://` en `wss://`.
  Gebruik HTTP(S) voor `/json/version`-detectie, of WS(S) wanneer je browser-
  service je een directe DevTools-socket-URL geeft.

## Gerelateerd

- [Browser](/nl/tools/browser)
- [Browseraanmelding](/nl/tools/browser-login)
- [Browser WSL2-probleemoplossing](/nl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
