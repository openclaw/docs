---
read_when:
    - De agentbrowser scripten of debuggen via de lokale besturings-API
    - Op zoek naar de `openclaw browser` CLI-referentie
    - Aangepaste browserautomatisering toevoegen met snapshots en refs
summary: OpenClaw-API voor browserbesturing, CLI-referentie en scriptacties
title: API voor browserbesturing
x-i18n:
    generated_at: "2026-07-16T16:38:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

Zie [Browser](/nl/tools/browser) voor installatie, configuratie en probleemoplossing.
Deze pagina bevat de naslaginformatie voor de lokale HTTP-besturings-API, de `openclaw browser`
CLI en scriptpatronen (snapshots, refs, wachttijden, foutopsporingsstromen).

## Besturings-API (optioneel)

Alleen voor lokale integraties stelt de Gateway een kleine HTTP-loopback-API beschikbaar.
Deze zelfstandige server is opt-in — stel de omgevingsvariabele
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` in de omgeving van de Gateway-service in
en start de Gateway opnieuw voordat de HTTP-eindpunten beschikbaar worden. Zonder
deze variabele blijft de browserbesturingsruntime werken via de CLI en
agenttools, maar luistert er niets op de loopback-besturingspoort.

- Status/starten/stoppen: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- Profielen: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- Tabbladen: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- Snapshot/schermafbeelding: `GET /snapshot`, `POST /screenshot`
- Acties: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Machtigingen: `POST /permissions/grant`
- Foutopsporing: `GET /console`, `POST /pdf`
- Foutopsporing: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Netwerk: `POST /response/body`
- Status: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Status: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Instellingen: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` is de gebundelde vorm die de CLI intern gebruikt voor
`browser tab`-subopdrachten (`{"action":"new"|"label"|"select"|"close"|"list", ...}`);
gebruik bij directe scripts bij voorkeur de routes voor afzonderlijke tabbladen hierboven.

Alle eindpunten accepteren `?profile=<name>`. `POST /start?headless=true` vraagt om een
eenmalige headless-start voor lokaal beheerde profielen zonder de opgeslagen
browserconfiguratie te wijzigen; profielen die alleen koppelen, externe CDP-profielen en profielen met bestaande sessies weigeren
die overschrijving omdat OpenClaw die browserprocessen niet start.

Voor tabbladeindpunten is `targetId` de compatibiliteitsveldnaam. Geef bij voorkeur
`suggestedTargetId` van `GET /tabs` of `POST /tabs/open` door; labels en `tabId`-
handles zoals `t1` worden ook geaccepteerd. Ruwe CDP-doel-ID's en unieke ruwe
voorvoegsels van doel-ID's blijven werken, maar zijn vluchtige diagnostische handles.

Als Gateway-authenticatie met een gedeeld geheim is geconfigureerd, vereisen de HTTP-browserroutes ook authenticatie:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` of HTTP Basic-authenticatie met dat wachtwoord

Opmerkingen:

- Deze zelfstandige loopback-browser-API gebruikt **geen** identiteitsheaders van vertrouwde proxy's of
  Tailscale Serve.
- Als `gateway.auth.mode` `none` of `trusted-proxy` is, nemen deze loopback-browserroutes
  die identiteitsdragende modi niet over; houd ze uitsluitend op loopback.

### Foutcontract van `/act`

`POST /act` gebruikt een gestructureerd foutantwoord voor validatie op routeniveau en
beleidsfouten:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Huidige waarden voor `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` ontbreekt of wordt niet herkend.
- `ACT_INVALID_REQUEST` (HTTP 400): normalisatie of validatie van de actiepayload is mislukt.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` is gebruikt met een niet-ondersteund actietype.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (of `wait --fn`) is uitgeschakeld via de configuratie.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` op het hoogste niveau of in een batch conflicteert met het doel van de aanvraag.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): de actie wordt niet ondersteund voor profielen met bestaande sessies.

Andere runtimefouten kunnen nog steeds `{ "error": "<message>" }` retourneren zonder een
`code`-veld.

### Playwright-vereiste

Voor sommige functies (navigeren/handelen/AI-snapshot/rolsnapshot, elementscherm­afbeeldingen,
PDF) is Playwright vereist. Als Playwright niet is geïnstalleerd, retourneren die eindpunten
een duidelijke 501-fout.

Wat zonder Playwright blijft werken:

- ARIA-snapshots
- Toegankelijkheidssnapshots in rolstijl (`--interactive`, `--compact`,
  `--depth`, `--efficient`) wanneer een CDP-WebSocket per tabblad beschikbaar is. Dit is
  een terugvaloptie voor inspectie en het vinden van refs; Playwright blijft de primaire
  actie-engine.
- Paginaschermafbeeldingen voor de beheerde `openclaw`-browser wanneer een CDP-
  WebSocket per tabblad beschikbaar is
- Paginaschermafbeeldingen voor `existing-session`- / Chrome MCP-profielen
- Op `existing-session`-refs gebaseerde schermafbeeldingen (`--ref`) uit snapshotuitvoer

Waarvoor Playwright nog steeds nodig is:

- `navigate`
- `act`
- AI-snapshots die afhankelijk zijn van de systeemeigen AI-snapshotindeling van Playwright
- Elementschermafbeeldingen met CSS-selectors (`--element`)
- volledige PDF-export van de browser

Elementschermafbeeldingen weigeren ook `--full-page`; de route retourneert `fullPage is
not supported for element screenshots`.

Als je `Playwright is not available in this gateway build` ziet, ontbreekt de kern­afhankelijkheid voor de browserruntime in de verpakte
Gateway. Installeer OpenClaw opnieuw of werk het bij en start vervolgens
de Gateway opnieuw. Installeer voor Docker ook de Chromium-
browserbinaire bestanden zoals hieronder weergegeven.

#### Playwright-installatie voor Docker

Als je Gateway in Docker draait, vermijd dan `npx playwright` (conflicten met npm-overschrijvingen).
Neem voor aangepaste images Chromium op in de image:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Installeer bij een bestaande image in plaats daarvan via de meegeleverde CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Stel `PLAYWRIGHT_BROWSERS_PATH` in (bijvoorbeeld
`/home/node/.cache/ms-playwright`) om browserdownloads te behouden en zorg dat `/home/node` behouden blijft via
`OPENCLAW_HOME_VOLUME` of een bind-mount. OpenClaw detecteert de bewaarde
Chromium-installatie automatisch op Linux. Zie [Docker](/nl/install/docker).

## Hoe het werkt (intern)

Een kleine loopback-besturingsserver accepteert HTTP-aanvragen en maakt via CDP verbinding met Chromium-gebaseerde browsers. Geavanceerde acties (klikken/typen/snapshot/PDF) verlopen via Playwright boven op CDP; wanneer Playwright ontbreekt, zijn alleen bewerkingen zonder Playwright beschikbaar. De agent ziet één stabiele interface, terwijl lokale en externe browsers en profielen daaronder vrij kunnen wisselen.

## Beknopt CLI-overzicht

Alle opdrachten accepteren `--browser-profile <name>` om een specifiek profiel te kiezen en `--json` voor machineleesbare uitvoer.

<AccordionGroup>

<Accordion title="Basis: status, tabbladen, openen/focussen/sluiten">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # voeg een live snapshotcontrole toe
openclaw browser start
openclaw browser start --headless # eenmalige lokaal beheerde headless-start
openclaw browser stop            # wist ook emulatie bij alleen koppelen/externe CDP
openclaw browser reset-profile   # verplaatst de browsergegevens van het profiel naar de prullenmand
openclaw browser tabs
openclaw browser tab             # snelkoppeling voor het huidige tabblad
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Profielen: weergeven, maken, verwijderen">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="Inspectie: schermafbeelding, snapshot, console, fouten, aanvragen">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # of --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Acties: navigeren, klikken, typen, slepen, wachten, evalueren">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # of e12 voor rolrefs
openclaw browser click-coords 120 340        # viewportcoördinaten
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Status: cookies, opslag, offline, headers, geolocatie, apparaat">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear om te verwijderen
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Opmerkingen:

- De agentgerichte tool `browser` biedt `action=download` (vereiste `ref` en
  `path`) en `action=waitfordownload` (optionele `path`). Beide retourneren de opgeslagen
  download-URL, voorgestelde bestandsnaam en beveiligde lokale pad. Expliciete onderschepping van downloads
  is beschikbaar voor beheerde Playwright-profielen; profielen met bestaande sessies
  retourneren een fout voor een niet-ondersteunde bewerking.
- Geef de voorkeur aan atomische uploads via een bestandskiezer: geef de trigger `--ref` door bij de upload, zodat OpenClaw deze in één aanvraag activeert en aanklikt. `upload` met alleen paden blijft ondersteund wanneer een latere trigger bewust is gekozen. Gebruik `--input-ref` of `--element` om rechtstreeks een bestandsinvoer in te stellen. `dialog` is een activeringsaanroep; voer deze uit vóór de klik/toetsaanslag die het dialoogvenster activeert. Als een actie een modaal venster opent, bevat het actierespons `blockedByDialog` en `browserState.dialogs.pending`; geef die `dialogId` door om rechtstreeks te antwoorden. Dialoogvensters die buiten OpenClaw worden afgehandeld, verschijnen onder `browserState.dialogs.recent`.
- `click`/`type`/enz. vereisen een `ref` uit `snapshot` (numerieke `12`, rolreferentie `e12` of uitvoerbare ARIA-referentie `ax12`). CSS-selectors worden bewust niet ondersteund voor acties. Gebruik `click-coords` wanneer de zichtbare positie in de viewport het enige betrouwbare doel is.
- Download- en traceerpaden zijn beperkt tot tijdelijke OpenClaw-hoofdmappen: `/tmp/openclaw{,/downloads}` (terugvaloptie: `${os.tmpdir()}/openclaw/...`).
- `upload` accepteert bestanden uit de hoofdmap voor tijdelijke OpenClaw-uploads en
  door OpenClaw beheerde inkomende media. Naar beheerde inkomende media kan worden verwezen als
  `media://inbound/<id>`, sandbox-relatieve `media/inbound/<id>` of een herleid
  pad binnen de map voor beheerde inkomende media. Geneste mediareferenties,
  padtraversal, symbolische koppelingen, harde koppelingen en willekeurige lokale paden worden nog steeds geweigerd.
- `upload` kan bestandsinvoer ook rechtstreeks instellen via `--input-ref` of `--element`.

Stabiele tabblad-ID's en labels blijven behouden wanneer Chromium het ruwe doel vervangt en OpenClaw
het vervangende tabblad kan vaststellen, zoals bij een uniek oud/nieuw paar voor dezelfde URL of
wanneer één oud tabblad na het indienen van een formulier één nieuw tabblad wordt. Ambigue
vervangingen met dubbele URL's krijgen nieuwe handles. Ruwe doel-ID's blijven
vluchtig; geef in scripts de voorkeur aan `suggestedTargetId` uit `tabs`.

Snapshot-vlaggen in één oogopslag:

- `--format ai` (standaard met Playwright): AI-snapshot met numerieke referenties (`aria-ref="<n>"`).
- `--format aria`: toegankelijkheidsboom met `axN`-referenties. Wanneer Playwright beschikbaar is, koppelt OpenClaw referenties met DOM-ID's van de backend aan de livepagina, zodat vervolgacties ze kunnen gebruiken; behandel de uitvoer anders alleen als inspectiemateriaal.
- `--efficient` (of `--mode efficient`): compacte voorinstelling voor een rolsnapshot. Stel `browser.snapshotDefaults.mode: "efficient"` in om dit als standaard te gebruiken (zie [Gateway-configuratie](/nl/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth` en `--selector` dwingen een rolsnapshot met `ref=e12`-referenties af. `--frame "<iframe>"` beperkt rolsnapshots tot een iframe.
- Met Playwright voegt `--labels` een schermafbeelding met overlappende referentielabels toe
  (toont `MEDIA:<path>`), plus een `annotations`-array met het begrenzingsvak
  van elke referentie. Bij `screenshot` werken door Playwright ondersteunde labels met `--full-page`,
  `--ref` en `--element`; bij `snapshot` blijft de bijbehorende schermafbeelding
  beperkt tot de viewport. Profielen met bestaande sessies/chrome-mcp-profielen renderen overlappende labels op
  paginaschermafbeeldingen, maar retourneren geen `annotations` en gebruiken niet de Playwright-helper
  voor de projectie van volledige pagina's/referenties/elementen. Zonder Playwright of chrome-mcp
  zijn gelabelde schermafbeeldingen niet beschikbaar.
- `--urls` voegt gevonden linkbestemmingen toe aan AI-snapshots.

## Snapshots en referenties

OpenClaw ondersteunt twee stijlen voor "snapshots":

- **AI-snapshot (numerieke referenties)**: `openclaw browser snapshot` (standaard; `--format ai`)
  - Uitvoer: een tekstsnapshot met numerieke referenties.
  - Acties: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Intern wordt de referentie herleid via `aria-ref` van Playwright.

- **Rolsnapshot (rolreferenties zoals `e12`)**: `openclaw browser snapshot --interactive` (of `--compact`, `--depth`, `--selector`, `--frame`)
  - Uitvoer: een op rollen gebaseerde lijst/boom met `[ref=e12]` (en optioneel `[nth=1]`).
  - Acties: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Intern wordt de referentie herleid via `getByRole(...)` (plus `nth()` voor duplicaten).
  - Voeg `--labels` toe voor een schermafbeelding met overlappende `e12`-labels. Bij
    door Playwright ondersteunde profielen retourneert dit ook metagegevens over het begrenzingsvak per referentie
    (`annotations[]`).
  - Voeg `--urls` toe wanneer linktekst ambigu is en de agent concrete
    navigatiedoelen nodig heeft.

- **ARIA-snapshot (ARIA-referenties zoals `ax12`)**: `openclaw browser snapshot --format aria`
  - Uitvoer: de toegankelijkheidsboom als gestructureerde knooppunten.
  - Acties: `openclaw browser click ax12` werkt wanneer het snapshotpad de referentie
    via Playwright en DOM-ID's van de Chrome-backend kan koppelen.
- Als Playwright niet beschikbaar is, kunnen ARIA-snapshots nog steeds nuttig zijn voor
  inspectie, maar zijn referenties mogelijk niet uitvoerbaar. Maak opnieuw een snapshot met `--format ai`
  of `--interactive` wanneer je actiereferenties nodig hebt.
- Docker-bewijs voor het ruwe CDP-terugvalpad: `pnpm test:docker:browser-cdp-snapshot`
  start Chromium met CDP, voert `browser doctor --deep` uit en controleert of rol-
  snapshots link-URL's, via de cursor gepromoveerde klikbare elementen en iframe-metagegevens bevatten.

Gedrag van referenties:

- Referenties zijn **niet stabiel tussen navigaties**; als iets mislukt, voer je `snapshot` opnieuw uit en gebruik je een nieuwe referentie.
- `/act` retourneert de huidige ruwe `targetId` na een door een actie geactiveerde vervanging
  wanneer het vervangende tabblad kan worden vastgesteld. Blijf stabiele tabblad-ID's/labels gebruiken voor
  vervolgopdrachten.
- Als de rolsnapshot is gemaakt met `--frame`, zijn rolreferenties tot de volgende rolsnapshot beperkt tot dat iframe.
- Onbekende of verouderde `axN`-referenties mislukken direct in plaats van terug te vallen op
  de `aria-ref`-selector van Playwright. Maak in dat geval een nieuwe snapshot op hetzelfde tabblad.

## Uitgebreide wachtmogelijkheden

Je kunt op meer wachten dan alleen tijd/tekst:

- Wachten op URL (globpatronen ondersteund door Playwright):
  - `openclaw browser wait --url "**/dash"`
- Wachten op laadstatus:
  - `openclaw browser wait --load networkidle`
  - Ondersteund voor beheerde `openclaw`- en ruwe/externe CDP-profielen. Profielen die het `existing-session`-stuurprogramma gebruiken (waaronder het standaardprofiel `user`) weigeren `networkidle`; gebruik daar wachttijden voor `--url`, `--text`, een selector of `--fn`.
- Wachten op een JS-predicaat:
  - `openclaw browser wait --fn "window.ready===true"`
- Wachten tot een selector zichtbaar wordt:
  - `openclaw browser wait "#main"`

Deze kunnen worden gecombineerd:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Werkstromen voor foutopsporing

Wanneer een actie mislukt (bijvoorbeeld "niet zichtbaar", "schending van strikte modus", "bedekt"):

1. `openclaw browser snapshot --interactive`
2. Gebruik `click <ref>` / `type <ref>` (geef in interactieve modus de voorkeur aan rolreferenties)
3. Als het nog steeds mislukt: `openclaw browser highlight <ref>` om te zien waarop Playwright zich richt
4. Als de pagina zich vreemd gedraagt:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Voor diepgaande foutopsporing: neem een trace op:
   - `openclaw browser trace start`
   - reproduceer het probleem
   - `openclaw browser trace stop` (toont `TRACE:<path>`)

## JSON-uitvoer

`--json` is bedoeld voor scripts en gestructureerde hulpmiddelen.

Voorbeelden:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

Rolsnapshots in JSON bevatten `refs` plus een klein `stats`-blok (regels/tekens/referenties/interactief), zodat hulpmiddelen kunnen redeneren over de omvang en dichtheid van de payload.

## Instellingen voor status en omgeving

Deze zijn nuttig voor werkstromen waarbij je "de site zich als X laat gedragen":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Opslag: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (of de positionele vorm `set headers '{"X-Debug":"1"}'`)
- HTTP-basisverificatie: `set credentials user pass` (of `--clear`)
- Geolocatie: `set geo <lat> <lon> --origin "https://example.com"` (of `--clear`)
- Media: `set media dark|light|no-preference|none`
- Tijdzone / landinstelling: `set timezone ...`, `set locale ...`
- Apparaat / viewport:
  - `set device "iPhone 14"` (Playwright-apparaatvoorinstellingen)
  - `set viewport 1280 720`

## Beveiliging en privacy

- Het openclaw-browserprofiel kan aangemelde sessies bevatten; behandel het als gevoelig.
- `browser act kind=evaluate` / `openclaw browser evaluate` en `wait --fn`
  voeren willekeurige JavaScript uit in de paginacontext. Promptinjectie kan
  dit sturen. Schakel het uit met `browser.evaluateEnabled=false` als je het niet nodig hebt.
- `openclaw browser evaluate --fn` accepteert de bron van een functie, een expressie of
  een instructieblok. Instructieblokken worden verpakt als asynchrone functies, dus gebruik
  `return` voor de waarde die je terug wilt krijgen. Gebruik `--timeout-ms <ms>` wanneer de
  functie aan de paginazijde mogelijk langer nodig heeft dan de standaardtime-out voor evaluatie.
- Zie voor aanmeldingen en opmerkingen over antibotmaatregelen (X/Twitter enzovoort) [Aanmelden in de browser + posten op X/Twitter](/nl/tools/browser-login).
- Houd de Gateway-/Node-host privé (alleen loopback of tailnet).
- Externe CDP-eindpunten zijn krachtig; gebruik een tunnel en beveilig ze.

Voorbeeld voor strikte modus (privé/interne bestemmingen standaard blokkeren):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optionele exacte toestemming
    },
  },
}
```

## Gerelateerd

- [Browser](/nl/tools/browser) - overzicht, configuratie, profielen, beveiliging
- [Aanmelden in de browser](/nl/tools/browser-login) - aanmelden bij sites
- [Problemen met Browser op Linux oplossen](/nl/tools/browser-linux-troubleshooting)
- [Problemen met Browser via externe CDP op WSL2 oplossen](/nl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
