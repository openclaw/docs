---
read_when:
    - Je gebruikt `openclaw browser` en wilt voorbeelden voor veelvoorkomende taken
    - Je wilt een browser bedienen die op een andere machine draait via een Node-host
    - Je wilt koppelen aan je lokale aangemelde Chrome via Chrome MCP
summary: CLI-referentie voor `openclaw browser` (levenscyclus, profielen, tabbladen, acties, status en foutopsporing)
title: Browser
x-i18n:
    generated_at: "2026-06-27T17:18:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Beheer het browserbesturingsvlak van OpenClaw en voer browseracties uit (levenscyclus, profielen, tabbladen, snapshots, screenshots, navigatie, invoer, statusemulatie en debugging).

Gerelateerd:

- Browsertool + API: [Browsertool](/nl/tools/browser)

## Algemene vlaggen

- `--url <gatewayWsUrl>`: Gateway WebSocket-URL (standaard uit config).
- `--token <token>`: Gateway-token (indien vereist).
- `--timeout <ms>`: aanvraagtime-out (ms).
- `--expect-final`: wacht op een definitieve Gateway-respons.
- `--browser-profile <name>`: kies een browserprofiel (standaard uit config).
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

Als `start` mislukt met `not reachable after start`, los dan eerst de CDP-gereedheid op. Als `start` en `tabs` slagen maar `open` of `navigate` mislukt, is het browserbesturingsvlak gezond en is de fout meestal navigatie-SSRF-beleid.

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
- Voor `attachOnly`- en externe CDP-profielen sluit `openclaw browser stop` de actieve besturingssessie en wist het tijdelijke emulatie-overschrijvingen, zelfs wanneer OpenClaw het browserproces niet zelf heeft gestart.
- Voor lokaal beheerde profielen stopt `openclaw browser stop` het gestarte browserproces.
- `openclaw browser start --headless` geldt alleen voor die startaanvraag en alleen wanneer OpenClaw een lokaal beheerde browser start. Het herschrijft `browser.headless` of profielconfig niet, en het heeft geen effect op een browser die al draait.
- Op Linux-hosts zonder `DISPLAY` of `WAYLAND_DISPLAY` draaien lokaal beheerde profielen automatisch headless, tenzij `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` of `browser.profiles.<name>.headless=false` expliciet om een zichtbare browser vraagt.

## Als de opdracht ontbreekt

Als `openclaw browser` een onbekende opdracht is, controleer dan `plugins.allow` in `~/.openclaw/openclaw.json`.

Wanneer `plugins.allow` aanwezig is, vermeld dan expliciet de gebundelde browser-Plugin, tenzij de config al een hoofdblok `browser` heeft:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Een expliciet hoofdblok `browser`, bijvoorbeeld `browser.enabled=true` of `browser.profiles.<name>`, activeert ook de gebundelde browser-Plugin onder een beperkende Plugin-toelatingslijst.

Gerelateerd: [Browsertool](/nl/tools/browser#missing-browser-command-or-tool)

## Profielen

Profielen zijn benoemde browserrouteringsconfigs. In de praktijk:

- `openclaw`: start of koppelt aan een dedicated door OpenClaw beheerde Chrome-instantie (geïsoleerde map met gebruikersgegevens).
- `user`: bestuurt je bestaande aangemelde Chrome-sessie via Chrome DevTools MCP.
- aangepaste CDP-profielen: verwijzen naar een lokaal of extern CDP-eindpunt.

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

`tabs` retourneert eerst `suggestedTargetId`, daarna de stabiele `tabId` zoals `t1`, het optionele label en de ruwe `targetId`. Agents moeten `suggestedTargetId` teruggeven aan `focus`, `close`, snapshots en acties. Je kunt een label toewijzen met `open --label`, `tab new --label` of `tab label`; labels, tabblad-id's, ruwe doel-id's en unieke voorvoegsels van doel-id's worden allemaal geaccepteerd.
Het aanvraagveld heet voor compatibiliteit nog steeds `targetId`, maar accepteert deze tabbladverwijzingen. Behandel ruwe doel-id's als diagnostische handles, niet als duurzaam agentgeheugen.
Wanneer Chromium het onderliggende ruwe doel tijdens navigatie of formulierverzending vervangt, houdt OpenClaw de stabiele `tabId`/het label gekoppeld aan het vervangende tabblad wanneer het de match kan bewijzen. Ruwe doel-id's blijven vluchtig; geef de voorkeur aan `suggestedTargetId`.

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

- `--full-page` is alleen voor pagina-opnames; het kan niet worden gecombineerd met `--ref` of `--element`.
- `existing-session`- / `user`-profielen ondersteunen paginascreenshots en `--ref`-screenshots uit snapshotuitvoer, maar geen CSS-`--element`-screenshots.
- `--labels` legt huidige snapshotrefs over de screenshot heen. Op profielen met Playwright-ondersteuning werkt dit met `--full-page` (labeloverlay voor volledige pagina), `--ref` (labeloverlay voor elementclip op ARIA-ref) en `--element` (labeloverlay voor elementclip op CSS-selector); in elementclipmodi worden labels relatief aan het element geprojecteerd. De respons bevat ook een `annotations`-array met de bounding box van elke ref. Elk item heeft `ref`, `number`, `role`, optioneel `name` en `box: {x, y, width, height}`; coördinaten staan in de ruimte van de vastgelegde afbeelding (viewport / volledige pagina / relatief aan element). Het veld wordt weggelaten wanneer het leeg is.
  `existing-session`-profielen renderen een chrome-mcp-overlay op paginascreenshots, maar gebruiken de Playwright-projectiehelper niet en bevatten geen `annotations`; CSS-`--element`-screenshots worden daar niet ondersteund. Zonder Playwright of chrome-mcp zijn gelabelde screenshots niet beschikbaar. Eerdere releases negeerden `--full-page`, `--ref` en `--element` op gelabelde Playwright-screenshots en retourneerden altijd een viewportopname; gelabelde screenshots respecteren nu die scopes.
- `snapshot --urls` voegt ontdekte linkbestemmingen toe aan AI-snapshots zodat agents directe navigatiedoelen kunnen kiezen in plaats van alleen uit linktekst te gokken.

Navigeren/klikken/typen (op ref gebaseerde UI-automatisering):

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
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` accepteert een functiebron, een expressie of een statement-body.
Statement-body's worden verpakt als async functions, dus gebruik `return` voor de waarde die je terug wilt. Gebruik `evaluate --timeout-ms <ms>` wanneer de functie aan de paginazijde mogelijk langer nodig heeft dan de standaard evaluate-time-out.

Actieresponsen retourneren de huidige ruwe `targetId` na door een actie getriggerde paginavervanging wanneer OpenClaw het vervangende tabblad kan bewijzen. Scripts moeten nog steeds `suggestedTargetId`/labels opslaan en doorgeven voor langlopende workflows.

Bestands- en dialooghelpers:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Beheerde Chrome-profielen slaan gewone downloads die door klikken worden geactiveerd op in de downloadmap van OpenClaw (`/tmp/openclaw/downloads` standaard, of de geconfigureerde tijdelijke hoofdmap). Gebruik `waitfordownload` of `download` wanneer de agent op een specifiek bestand moet wachten en het pad ervan moet retourneren; die expliciete wachters bezitten de volgende download.
Uploads accepteren bestanden uit de tijdelijke uploadshoofdmap van OpenClaw en door OpenClaw beheerde inkomende media, inclusief `media://inbound/<id>`- en sandbox-relatieve `media/inbound/<id>`-verwijzingen. Geneste mediarefs, traversal en willekeurige lokale paden blijven geweigerd.
Wanneer een actie een modaal dialoogvenster opent, retourneert de actierespons `blockedByDialog` met `browserState.dialogs.pending`; geef `--dialog-id` door om het direct te beantwoorden. Dialogen die buiten OpenClaw worden afgehandeld, verschijnen onder `browserState.dialogs.recent`.

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

## Debugging

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
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Het standaardpad voor bestaande sessies is host-only Chrome MCP auto-connect. Als de browser al draait met een DevTools-eindpunt, geef dan `--cdp-url` door zodat Chrome MCP in plaats daarvan aan dat eindpunt koppelt.
Gebruik voor Docker, Browserless of andere externe setups waar Chrome MCP-semantiek niet nodig is een CDP-profiel.

Huidige beperkingen van bestaande sessies:

- snapshotgestuurde acties gebruiken refs, geen CSS-selectors
- `browser.actionTimeoutMs` stelt ondersteunde `act`-verzoeken standaard in op 60000 ms wanneer
  aanroepers `timeoutMs` weglaten; `timeoutMs` per aanroep heeft nog steeds voorrang.
- `click` is alleen linksklikken
- `type` ondersteunt geen `slowly=true`
- `press` ondersteunt geen `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` en `evaluate` weigeren
  timeout-overschrijvingen per aanroep
- `select` ondersteunt slechts één waarde
- `wait --load networkidle` wordt niet ondersteund op profielen met bestaande sessies (werkt op beheerde en raw/remote CDP)
- bestandsuploads vereisen `--ref` / `--input-ref`, ondersteunen geen CSS
  `--element` en ondersteunen momenteel één bestand tegelijk
- dialooghooks ondersteunen geen `--timeout`
- screenshots ondersteunen pagina-opnamen en `--ref`, maar geen CSS `--element`
- `responsebody`, downloadinterceptie, PDF-export en batchacties vereisen nog steeds
  een beheerde browser of raw CDP-profiel

## Externe browserbesturing (nodehostproxy)

Als de Gateway op een andere machine draait dan de browser, voer dan een **nodehost** uit op de machine met Chrome/Brave/Edge/Chromium. De Gateway proxyt browseracties naar die node (geen aparte browserbesturingsserver vereist).

Gebruik `gateway.nodes.browser.mode` om automatische routering te beheren en `gateway.nodes.browser.node` om een specifieke node vast te zetten als er meerdere zijn verbonden.

Beveiliging + externe configuratie: [Browsertool](/nl/tools/browser), [Externe toegang](/nl/gateway/remote), [Tailscale](/nl/gateway/tailscale), [Beveiliging](/nl/gateway/security)

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Browser](/nl/tools/browser)
