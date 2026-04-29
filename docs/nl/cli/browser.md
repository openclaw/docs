---
read_when:
    - Je gebruikt `openclaw browser` en wilt voorbeelden voor veelvoorkomende taken
    - Je wilt een browser bedienen die op een andere machine draait via een Node-host
    - Je wilt via Chrome MCP verbinding maken met je lokale Chrome waarin je bent ingelogd
summary: CLI-referentie voor `openclaw browser` (levenscyclus, profielen, tabbladen, acties, status en foutopsporing)
title: Browser
x-i18n:
    generated_at: "2026-04-29T22:30:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b5112c61e8289ab6a02bc30c9aefe640c053271f82197c0ee810b4a5efa580
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Beheer het browserbesturingsoppervlak van OpenClaw en voer browseracties uit (levenscyclus, profielen, tabbladen, snapshots, screenshots, navigatie, invoer, status-emulatie en foutopsporing).

Gerelateerd:

- Browsertool + API: [Browsertool](/nl/tools/browser)

## Algemene vlaggen

- `--url <gatewayWsUrl>`: Gateway WebSocket-URL (standaard uit configuratie).
- `--token <token>`: Gateway-token (indien vereist).
- `--timeout <ms>`: time-out voor verzoek (ms).
- `--expect-final`: wacht op een definitieve Gateway-respons.
- `--browser-profile <name>`: kies een browserprofiel (standaard uit configuratie).
- `--json`: machineleesbare uitvoer (waar ondersteund).

## Snel starten (lokaal)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agents kunnen dezelfde gereedheidscontrole uitvoeren met `browser({ action: "doctor" })`.

## Snelle probleemoplossing

Als `start` mislukt met `not reachable after start`, los dan eerst de CDP-gereedheid op. Als `start` en `tabs` slagen maar `open` of `navigate` mislukt, is het browserbesturingsvlak gezond en is de fout meestal het SSRF-beleid voor navigatie.

Minimale reeks:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Gedetailleerde richtlijnen: [Browserprobleemoplossing](/nl/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Levenscyclus

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Opmerkingen:

- `doctor --deep` voegt een live snapshot-probe toe. Dit is nuttig wanneer de basis-CDP-gereedheid groen is, maar je bewijs wilt dat het huidige tabblad kan worden geïnspecteerd.
- Voor `attachOnly` en externe CDP-profielen sluit `openclaw browser stop` de actieve besturingssessie en wist tijdelijke emulatie-overschrijvingen, zelfs wanneer OpenClaw het browserproces niet zelf heeft gestart.
- Voor lokaal beheerde profielen stopt `openclaw browser stop` het gestarte browserproces.
- `openclaw browser start --headless` geldt alleen voor dat startverzoek en alleen wanneer OpenClaw een lokaal beheerde browser start. Het herschrijft `browser.headless` of de profielconfiguratie niet, en doet niets voor een browser die al actief is.
- Op Linux-hosts zonder `DISPLAY` of `WAYLAND_DISPLAY` draaien lokaal beheerde profielen automatisch headless, tenzij `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` of `browser.profiles.<name>.headless=false` expliciet om een zichtbare browser vraagt.

## Als de opdracht ontbreekt

Als `openclaw browser` een onbekende opdracht is, controleer dan `plugins.allow` in `~/.openclaw/openclaw.json`.

Wanneer `plugins.allow` aanwezig is, vermeld dan de meegeleverde browser-Plugin expliciet, tenzij de configuratie al een hoofdblok `browser` heeft:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Een expliciet hoofdblok `browser`, bijvoorbeeld `browser.enabled=true` of `browser.profiles.<name>`, activeert ook de meegeleverde browser-Plugin onder een beperkende allowlist voor plugins.

Gerelateerd: [Browsertool](/nl/tools/browser#missing-browser-command-or-tool)

## Profielen

Profielen zijn benoemde browserrouteringsconfiguraties. In de praktijk:

- `openclaw`: start of koppelt aan een dedicated door OpenClaw beheerde Chrome-instantie (geïsoleerde gebruikersgegevensmap).
- `user`: bestuurt je bestaande aangemelde Chrome-sessie via Chrome DevTools MCP.
- aangepaste CDP-profielen: wijzen naar een lokaal of extern CDP-eindpunt.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Gebruik een specifiek profiel:

```bash
openclaw browser --browser-profile work tabs
```

## Tabbladen

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` retourneert eerst `suggestedTargetId`, daarna de stabiele `tabId` zoals `t1`, het optionele label en de ruwe `targetId`. Agents moeten `suggestedTargetId` teruggeven aan `focus`, `close`, snapshots en acties. Je kunt een label toewijzen met `open --label`, `tab new --label` of `tab label`; labels, tabblad-id's, ruwe target-id's en unieke target-id-voorvoegsels worden allemaal geaccepteerd.
Wanneer Chromium het onderliggende ruwe target tijdens navigatie of het verzenden van een formulier vervangt, houdt OpenClaw de stabiele `tabId`/het label gekoppeld aan het vervangende tabblad wanneer het de overeenkomst kan bewijzen. Ruwe target-id's blijven vluchtig; gebruik bij voorkeur `suggestedTargetId`.

## Snapshot / screenshot / acties

Snapshot:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Screenshot:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Opmerkingen:

- `--full-page` is alleen voor pagina-opnamen; het kan niet worden gecombineerd met `--ref` of `--element`.
- `existing-session`- / `user`-profielen ondersteunen paginascreenshots en `--ref`-screenshots uit snapshot-uitvoer, maar geen CSS-`--element`-screenshots.
- `--labels` legt huidige snapshotrefs over de screenshot heen.
- `snapshot --urls` voegt gevonden linkbestemmingen toe aan AI-snapshots, zodat agents directe navigatiedoelen kunnen kiezen in plaats van alleen op basis van linktekst te gokken.

Navigeren/klikken/typen (op refs gebaseerde UI-automatisering):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Actieresponsen retourneren de huidige ruwe `targetId` na door een actie getriggerde paginavervanging wanneer OpenClaw het vervangende tabblad kan bewijzen. Scripts moeten nog steeds `suggestedTargetId`/labels opslaan en doorgeven voor langlopende workflows.

Bestands- en dialooghulpen:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Beheerde Chrome-profielen slaan gewone door klikken getriggerde downloads op in de OpenClaw-downloadmap (`/tmp/openclaw/downloads` standaard, of de geconfigureerde tijdelijke root). Gebruik `waitfordownload` of `download` wanneer de agent op een specifiek bestand moet wachten en het pad moet teruggeven; die expliciete wachters bezitten de volgende download.

## Status en opslag

Viewport + emulatie:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookies + opslag:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Foutopsporing

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Bestaande Chrome via MCP

Gebruik het ingebouwde `user`-profiel, of maak je eigen `existing-session`-profiel:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Dit pad is alleen voor de host. Gebruik in plaats daarvan een CDP-profiel voor Docker, headless servers, Browserless of andere externe opstellingen.

Huidige beperkingen van existing-session:

- door snapshots gestuurde acties gebruiken refs, geen CSS-selectors
- `browser.actionTimeoutMs` zet ondersteunde `act`-verzoeken standaard op 60000 ms wanneer aanroepers `timeoutMs` weglaten; `timeoutMs` per aanroep heeft nog steeds voorrang.
- `click` is alleen linksklikken
- `type` ondersteunt `slowly=true` niet
- `press` ondersteunt `delayMs` niet
- `hover`, `scrollintoview`, `drag`, `select`, `fill` en `evaluate` weigeren time-outoverschrijvingen per aanroep
- `select` ondersteunt slechts één waarde
- `wait --load networkidle` wordt niet ondersteund
- bestandsuploads vereisen `--ref` / `--input-ref`, ondersteunen geen CSS-`--element` en ondersteunen momenteel één bestand tegelijk
- dialooghaken ondersteunen `--timeout` niet
- screenshots ondersteunen pagina-opnamen en `--ref`, maar geen CSS-`--element`
- `responsebody`, downloadonderschepping, PDF-export en batchacties vereisen nog steeds een beheerde browser of een ruw CDP-profiel

## Externe browserbesturing (node-hostproxy)

Als de Gateway op een andere machine draait dan de browser, voer dan een **node-host** uit op de machine met Chrome/Brave/Edge/Chromium. De Gateway proxyt browseracties naar die node (geen afzonderlijke browserbesturingsserver vereist).

Gebruik `gateway.nodes.browser.mode` om automatische routering te beheren en `gateway.nodes.browser.node` om een specifieke node vast te zetten als er meerdere zijn verbonden.

Beveiliging + externe installatie: [Browsertool](/nl/tools/browser), [Externe toegang](/nl/gateway/remote), [Tailscale](/nl/gateway/tailscale), [Beveiliging](/nl/gateway/security)

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Browser](/nl/tools/browser)
