---
read_when:
    - Je gebruikt `openclaw browser` en wilt voorbeelden voor veelvoorkomende taken
    - Je wilt via een nodehost een browser besturen die op een andere machine draait
    - Je wilt via Chrome MCP verbinding maken met je lokale Chrome waarin je bent ingelogd
summary: CLI-referentie voor `openclaw browser` (levenscyclus, profielen, tabbladen, acties, status en foutopsporing)
title: Browser
x-i18n:
    generated_at: "2026-07-16T15:23:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Beheer het browserbesturingsoppervlak van OpenClaw en voer browseracties uit: levenscyclus, profielen, tabbladen, momentopnamen, schermafbeeldingen, navigatie, invoer, statusemulatie en foutopsporing.

Gerelateerd: [Browsertool](/nl/tools/browser)

## Algemene vlaggen

- `--url <gatewayWsUrl>`: Gateway-WebSocket-URL (standaard uit de configuratie).
- `--token <token>`: Gateway-token (indien vereist).
- `--timeout <ms>`: time-out van het verzoek in ms (standaard: `30000`).
- `--expect-final`: wacht op een definitief antwoord van de Gateway.
- `--browser-profile <name>`: kies een browserprofiel (standaard: `openclaw` of `browser.defaultProfile`).
- `--json`: machineleesbare uitvoer (waar ondersteund). Dit is een optie op browserniveau, dus
  plaats deze vóór de subopdracht voor een ondubbelzinnige vorm, zoals
  `openclaw browser --json status`. Plaatsing aan het einde, zoals
  `openclaw browser status --json`, werkt ook wanneer de geselecteerde onderliggende opdracht
  geen eigen `--json` definieert.

## Snel aan de slag (lokaal)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agents kunnen dezelfde gereedheidscontrole uitvoeren met `browser({ action: "doctor" })`.

## Snelle probleemoplossing

Als `start` mislukt met `not reachable after start`, los dan eerst problemen met de CDP-gereedheid op. Als `start` en `tabs` slagen, maar `open` of `navigate` mislukt, is het browserbesturingsvlak in orde en wordt de fout meestal veroorzaakt door een blokkering volgens het SSRF-beleid voor navigatie.

Minimale volgorde:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Gedetailleerde richtlijnen: [Probleemoplossing voor de browser](/nl/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

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

- `doctor --deep` voegt een live momentopnamecontrole toe: nuttig wanneer de basisgereedheid van CDP groen is, maar je bewijs wilt dat het huidige tabblad kan worden geïnspecteerd.
- Voor een actief lokaal beheerd profiel rapporteren `status` en `doctor` diagnostische
  grafische gegevens uit de cache van Chrome: hardware-/softwareclassificatie, renderer,
  backend, apparaat/stuurprogramma, details over functies en uitgeschakelde statussen en
  mogelijkheden voor versnelde video. `openclaw browser --json status` retourneert de volledige gestructureerde nettolading.
  Een passieve status start Chrome nooit alleen om deze gegevens te verzamelen.
- `stop` sluit de actieve besturingssessie en wist tijdelijke emulatie-instellingen, zelfs voor `attachOnly` en externe CDP-profielen waarbij OpenClaw het browserproces niet zelf heeft gestart. Voor lokaal beheerde profielen stopt `stop` ook het gestarte browserproces.
- `start --headless` geldt alleen voor dat startverzoek en alleen wanneer OpenClaw een lokaal beheerde browser start. Het herschrijft `browser.headless` of de profielconfiguratie niet en heeft geen effect op een browser die al actief is.
- Op Linux-hosts zonder `DISPLAY` of `WAYLAND_DISPLAY` worden lokaal beheerde profielen automatisch headless uitgevoerd, tenzij `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` of `browser.profiles.<name>.headless=false` expliciet om een zichtbare browser vraagt.

## Als de opdracht ontbreekt

Als `openclaw browser` een onbekende opdracht is, controleer dan `plugins.allow` in `~/.openclaw/openclaw.json`. Wanneer `plugins.allow` aanwezig is, vermeld dan expliciet de meegeleverde browser-Plugin, tenzij de configuratie al een `browser`-blok op hoofdniveau bevat:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Een expliciet `browser`-blok op hoofdniveau (bijvoorbeeld `browser.enabled=true` of `browser.profiles.<name>`) activeert de meegeleverde browser-Plugin ook onder een beperkende toelatingslijst voor Plugins.

Gerelateerd: [Browsertool](/nl/tools/browser#missing-browser-command-or-tool)

## Profielen

Profielen zijn benoemde routeringsconfiguraties voor browsers:

- `openclaw` (standaard): start of koppelt met een speciale door OpenClaw beheerde Chrome-instantie (geïsoleerde map met gebruikersgegevens).
- `user`: bestuurt je bestaande aangemelde Chrome-sessie via Chrome DevTools MCP.
- aangepaste CDP-profielen: verwijzen naar een lokaal of extern CDP-eindpunt.

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Gebruik bij elke subopdracht een specifiek profiel met `--browser-profile <name>`, bijvoorbeeld `openclaw browser --browser-profile work tabs`.

Op macOS vermeldt `system-profiles` de echte Chrome-, Brave-, Edge- of Chromium-profielen die op de host beschikbaar zijn. `import-profile` ontsleutelt hun cookies na één toestemmingsprompt van macOS Keychain/Touch ID en injecteert ze in een nieuw door OpenClaw beheerd profiel. Alleen cookies worden geïmporteerd; lokale opslag en IndexedDB blijven ongewijzigd. Sommige Google-sessies gebruiken apparaatsgebonden sessiereferenties (DBSC) en kunnen na het importeren nog steeds vereisen dat je je opnieuw verifieert.

Wanneer de macOS-app een lokale Gateway gebruikt, kan deze de import eenmaal aanbieden en het geïsoleerde geïmporteerde profiel als standaard instellen voor browsen door agents. Importeren vereist altijd een expliciete klik; een geslaagde import of het sluiten van de melding onderdrukt latere automatische prompts en **Settings → General → Browser login** blijft beschikbaar om opnieuw te importeren.

Importeren van systeemprofielen is standaard ingeschakeld. Stel `browser.allowSystemProfileImport=false` in om zowel door de CLI als door agents geactiveerde imports uit te schakelen. Importeren is lokaal voor de host en kan niet via de browser-Node-proxy worden uitgevoerd.

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

`tabs` retourneert eerst `suggestedTargetId`, daarna de stabiele `tabId` (zoals `t1`), het optionele label en de onbewerkte `targetId`. Geef `suggestedTargetId` weer door aan `focus`, `close`, momentopnamen en acties. Wijs een label toe met `open --label`, `tab new --label` of `tab label`; labels, tabblad-id's, onbewerkte doel-id's en unieke voorvoegsels van doel-id's worden allemaal geaccepteerd. Het aanvraagveld heet voor compatibiliteit nog steeds `targetId`, maar accepteert elk van deze tabbladverwijzingen.

Onbewerkte doel-id's zijn vluchtige diagnostische verwijzingen, geen duurzaam agentgeheugen: wanneer Chromium tijdens navigatie of het verzenden van een formulier het onderliggende onbewerkte doel vervangt, houdt OpenClaw de stabiele `tabId`/het label aan het vervangende tabblad gekoppeld wanneer de overeenkomst kan worden bewezen. Geef de voorkeur aan `suggestedTargetId`.

## Momentopname / schermafbeelding / acties

Momentopname:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Schermafbeelding:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

- `--full-page` is alleen bedoeld voor paginaopnamen; het kan niet worden gecombineerd met `--ref` of `--element`.
- `existing-session`- / `user`-profielen ondersteunen schermafbeeldingen van pagina's en `--ref`-schermafbeeldingen uit momentopname-uitvoer, maar geen schermafbeeldingen met CSS-`--element`.
- `--labels` legt de huidige momentopnameverwijzingen over de schermafbeelding. Bij profielen die door Playwright worden ondersteund, werkt dit met `--full-page` (overlay van de volledige pagina), `--ref` (overlay van een elementuitsnede via een ARIA-verwijzing) en `--element` (overlay van een elementuitsnede via een CSS-selector); in modi voor elementuitsneden worden labels relatief ten opzichte van het element geprojecteerd. Het antwoord bevat ook een `annotations`-array (weggelaten wanneer deze leeg is) met het begrenzingsvak van elke verwijzing: `ref`, `number`, `role`, optioneel `name` en `box: {x, y, width, height}` in het coördinatenstelsel van de vastgelegde afbeelding (viewport / volledige pagina / elementrelatief).
  `existing-session`-profielen renderen een chrome-mcp-overlay op schermafbeeldingen van pagina's, maar gebruiken de Playwright-projectiehelper niet en bevatten geen `annotations`; schermafbeeldingen met CSS-`--element` worden daar niet ondersteund. Zonder Playwright of chrome-mcp zijn schermafbeeldingen met labels niet beschikbaar.
- `snapshot --urls` voegt gevonden linkbestemmingen toe aan AI-momentopnamen, zodat agents rechtstreekse navigatiedoelen kunnen kiezen in plaats van uitsluitend op basis van linktekst te gokken.

Navigeren/klikken/typen (UI-automatisering op basis van verwijzingen):

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

`evaluate --fn` accepteert de bron van een functie, een expressie of een instructieblok. Instructieblokken worden verpakt als asynchrone functies, dus gebruik `return` voor de waarde die je terug wilt krijgen. Gebruik `--timeout-ms` wanneer de functie aan de paginazijde mogelijk langer nodig heeft dan de standaardtime-out voor evaluatie. `browser.evaluateEnabled=false` (standaard: `true`) schakelt zowel `evaluate` als `wait --fn` uit.

Actieantwoorden retourneren de huidige onbewerkte `targetId` na een door een actie geactiveerde paginavervanging wanneer OpenClaw het vervangende tabblad kan bewijzen. Scripts moeten voor langdurige workflows nog steeds `suggestedTargetId`/labels opslaan en doorgeven.

Hulpmiddelen voor bestanden en dialoogvensters:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Beheerde Chrome-profielen slaan gewone door klikken geactiveerde downloads op in de downloadmap van OpenClaw (standaard `/tmp/openclaw/downloads`, of de geconfigureerde tijdelijke hoofdmap). Gebruik `waitfordownload` of `download` wanneer de agent op een specifiek bestand moet wachten en het pad ervan moet retourneren; deze expliciete wachters nemen de volgende download voor hun rekening. Uploads accepteren bestanden uit de tijdelijke hoofdmap voor uploads van OpenClaw en door OpenClaw beheerde inkomende media, waaronder `media://inbound/<id>` en sandbox-relatieve `media/inbound/<id>`-verwijzingen. Geneste mediaverwijzingen, padtraversatie en willekeurige lokale paden worden geweigerd.

Wanneer een actie een modaal dialoogvenster opent, retourneert het actieantwoord `blockedByDialog` met `browserState.dialogs.pending`; geef `--dialog-id` door om er rechtstreeks op te antwoorden. Dialoogvensters die buiten OpenClaw worden afgehandeld, verschijnen onder `browserState.dialogs.recent`.

## Status en opslag

Viewport en emulatie:

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

Gebruik het ingebouwde `user`-profiel of maak je eigen `existing-session`-profiel:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Het standaardpad voor bestaande sessies is automatische Chrome MCP-verbinding uitsluitend op de host. Als de browser al met een DevTools-eindpunt wordt uitgevoerd, geef je `--cdp-url` door zodat Chrome MCP in plaats daarvan verbinding maakt met dat eindpunt. Gebruik voor Docker, Browserless of andere externe configuraties waarvoor Chrome MCP-semantiek niet nodig is een CDP-profiel.

Huidige beperkingen voor bestaande sessies:

- Acties op basis van momentopnamen gebruiken verwijzingen, geen CSS-selectors.
- `browser.actionTimeoutMs` stelt ondersteunde `act`-aanvragen standaard in op 60000 ms wanneer aanroepers `timeoutMs` weglaten; `timeoutMs` per aanroep heeft nog steeds voorrang.
- `click` ondersteunt alleen klikken met de linkermuisknop.
- `type` ondersteunt `slowly=true` niet.
- `press` ondersteunt `delayMs` niet.
- `hover`, `scrollintoview`, `drag`, `select` en `fill` weigeren time-outoverschrijvingen per aanroep; `evaluate` accepteert `--timeout-ms`.
- `select` ondersteunt slechts één waarde.
- `wait --load networkidle` wordt niet ondersteund (werkt met beheerde en onbewerkte/externe CDP-profielen).
- Voor bestandsuploads zijn `--ref` / `--input-ref` vereist; ze ondersteunen CSS-`--element` niet en ondersteunen één bestand tegelijk.
- Dialooghooks ondersteunen `--timeout` niet.
- Schermafbeeldingen ondersteunen pagina-opnamen en `--ref`, maar geen CSS-`--element`.
- `responsebody`, onderschepping van downloads, PDF-export en batchacties vereisen nog steeds een beheerde browser of een onbewerkt CDP-profiel.

## Externe browserbesturing (nodehostproxy)

Als de Gateway op een andere machine wordt uitgevoerd dan de browser, voer je een **nodehost** uit op de machine waarop Chrome/Brave/Edge/Chromium staat. De Gateway stuurt browseracties via een proxy door naar die node; er is geen afzonderlijke server voor browserbesturing nodig.

Gebruik `gateway.nodes.browser.mode` om automatische routering te beheren en `gateway.nodes.browser.node` om een specifieke node vast te zetten als er meerdere verbonden zijn.

Beveiliging + externe configuratie: [Browsertool](/nl/tools/browser), [Externe toegang](/nl/gateway/remote), [Tailscale](/nl/gateway/tailscale), [Beveiliging](/nl/gateway/security)

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Browser](/nl/tools/browser)
