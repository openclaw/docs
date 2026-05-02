---
read_when:
    - De agentbrowser scripten of debuggen via de lokale controle-API
    - Op zoek naar de `openclaw browser` CLI-referentie
    - Aangepaste browserautomatisering toevoegen met momentopnamen en verwijzingen
summary: OpenClaw-browserbesturings-API, CLI-referentie en scriptacties
title: API voor browserbesturing
x-i18n:
    generated_at: "2026-05-02T11:28:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef996319c09bfa8de9b5c3a340c68496ac3698295b62f4f07c79f3e233eda2a2
    source_path: tools/browser-control.md
    workflow: 16
---

Voor installatie, configuratie en probleemoplossing, zie [Browser](/nl/tools/browser).
Deze pagina is de referentie voor de lokale control HTTP API, de `openclaw browser`
CLI en scriptingpatronen (snapshots, refs, wachttijden, debug-flows).

## Control API (optioneel)

Alleen voor lokale integraties stelt de Gateway een kleine loopback HTTP API beschikbaar:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Tabs: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Acties: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Machtigingen: `POST /permissions/grant`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Netwerk: `POST /response/body`
- Status: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Status: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Instellingen: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Alle endpoints accepteren `?profile=<name>`. `POST /start?headless=true` vraagt een
eenmalige headless start aan voor lokaal beheerde profielen zonder de opgeslagen
browserconfiguratie te wijzigen; attach-only-, remote CDP- en existing-session-profielen weigeren
die overschrijving omdat OpenClaw die browserprocessen niet start.

Als Gateway-authenticatie met een gedeeld geheim is geconfigureerd, vereisen browser HTTP-routes ook authenticatie:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` of HTTP Basic-authenticatie met dat wachtwoord

Opmerkingen:

- Deze zelfstandige loopback browser API gebruikt **geen** trusted-proxy- of
  Tailscale Serve-identiteitsheaders.
- Als `gateway.auth.mode` `none` of `trusted-proxy` is, erven deze loopback browser
  routes die identiteitsdragende modi niet; houd ze alleen loopback.

### `/act`-foutcontract

`POST /act` gebruikt een gestructureerd foutantwoord voor validatie op routeniveau en
beleidsfouten:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Huidige `code`-waarden:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` ontbreekt of wordt niet herkend.
- `ACT_INVALID_REQUEST` (HTTP 400): actiepayload is niet genormaliseerd of gevalideerd.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` is gebruikt met een niet-ondersteund actietype.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (of `wait --fn`) is uitgeschakeld door de configuratie.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): top-level of batchgewijze `targetId` conflicteert met het aanvraagdoel.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): actie wordt niet ondersteund voor existing-session-profielen.

Andere runtimefouten kunnen nog steeds `{ "error": "<message>" }` retourneren zonder een
`code`-veld.

### Playwright-vereiste

Sommige functies (navigate/act/AI-snapshot/role-snapshot, elementscreenshots,
PDF) vereisen Playwright. Als Playwright niet is geïnstalleerd, retourneren die endpoints
een duidelijke 501-fout.

Wat nog werkt zonder Playwright:

- ARIA-snapshots
- Role-style toegankelijkheidssnapshots (`--interactive`, `--compact`,
  `--depth`, `--efficient`) wanneer een per-tab CDP WebSocket beschikbaar is. Dit is
  een fallback voor inspectie en ref-ontdekking; Playwright blijft de primaire
  actie-engine.
- Paginascreenshots voor de beheerde `openclaw`-browser wanneer een per-tab CDP
  WebSocket beschikbaar is
- Paginascreenshots voor `existing-session` / Chrome MCP-profielen
- `existing-session` ref-gebaseerde screenshots (`--ref`) uit snapshotuitvoer

Wat nog steeds Playwright nodig heeft:

- `navigate`
- `act`
- AI-snapshots die afhankelijk zijn van Playwright's native AI-snapshotformaat
- CSS-selector-elementscreenshots (`--element`)
- volledige browser-PDF-export

Elementscreenshots weigeren ook `--full-page`; de route retourneert `fullPage is
not supported for element screenshots`.

Als je `Playwright is not available in this gateway build` ziet, mist de verpakte
Gateway de kernbrowser-runtime-afhankelijkheid. Installeer OpenClaw opnieuw of werk het bij,
en herstart daarna de Gateway. Installeer voor Docker ook de Chromium
browserbinaries zoals hieronder getoond.

#### Docker Playwright-installatie

Als je Gateway in Docker draait, vermijd dan `npx playwright` (npm-overrideconflicten).
Gebruik in plaats daarvan de meegeleverde CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Om browserdownloads te behouden, stel je `PLAYWRIGHT_BROWSERS_PATH` in (bijvoorbeeld
`/home/node/.cache/ms-playwright`) en zorg je dat `/home/node` behouden blijft via
`OPENCLAW_HOME_VOLUME` of een bind mount. Zie [Docker](/nl/install/docker).

## Hoe het werkt (intern)

Een kleine loopback-controlserver accepteert HTTP-aanvragen en maakt verbinding met Chromium-gebaseerde browsers via CDP. Geavanceerde acties (click/type/snapshot/PDF) lopen via Playwright bovenop CDP; wanneer Playwright ontbreekt, zijn alleen niet-Playwright-bewerkingen beschikbaar. De agent ziet één stabiele interface terwijl lokale/externe browsers en profielen daaronder vrij worden gewisseld.

## CLI-snelreferentie

Alle opdrachten accepteren `--browser-profile <name>` om een specifiek profiel te targeten, en `--json` voor machineleesbare uitvoer.

<AccordionGroup>

<Accordion title="Basis: status, tabs, openen/focussen/sluiten">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspectie: screenshot, snapshot, console, fouten, aanvragen">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
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
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Status: cookies, opslag, offline, headers, geo, apparaat">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Opmerkingen:

- `upload` en `dialog` zijn **voorbereidende** calls; voer ze uit vóór de click/press die de chooser/dialog activeert.
- `click`/`type`/enz. vereisen een `ref` uit `snapshot` (numeriek `12`, rol-ref `e12` of bruikbare ARIA-ref `ax12`). CSS-selectors worden bewust niet ondersteund voor acties. Gebruik `click-coords` wanneer de zichtbare viewportpositie het enige betrouwbare doel is.
- Download-, trace- en uploadpaden zijn beperkt tot OpenClaw-temp-roots: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` kan bestandsinputs ook direct instellen via `--input-ref` of `--element`.

Stabiele tab-id's en labels overleven vervanging van Chromium raw targets wanneer OpenClaw
de vervangende tab kan bewijzen, zoals dezelfde URL of één oude tab die na
formulierverzending één nieuwe tab wordt. Raw target-id's blijven vluchtig; geef in scripts de voorkeur aan
`suggestedTargetId` uit `tabs`.

Snapshotflags in één oogopslag:

- `--format ai` (standaard met Playwright): AI-snapshot met numerieke refs (`aria-ref="<n>"`).
- `--format aria`: toegankelijkheidsstructuur met `axN`-refs. Wanneer Playwright beschikbaar is, bindt OpenClaw refs met backend DOM-id's aan de live pagina zodat vervolgacties ze kunnen gebruiken; behandel de uitvoer anders als alleen voor inspectie.
- `--efficient` (of `--mode efficient`): compacte role-snapshotpreset. Stel `browser.snapshotDefaults.mode: "efficient"` in om dit de standaard te maken (zie [Gateway-configuratie](/nl/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forceren een role-snapshot met `ref=e12`-refs. `--frame "<iframe>"` beperkt role-snapshots tot een iframe.
- `--labels` voegt een viewport-only screenshot toe met overlayde ref-labels (print `MEDIA:<path>`).
- `--urls` voegt ontdekte linkbestemmingen toe aan AI-snapshots.

## Snapshots en refs

OpenClaw ondersteunt twee “snapshot”-stijlen:

- **AI-snapshot (numerieke refs)**: `openclaw browser snapshot` (standaard; `--format ai`)
  - Uitvoer: een tekstsnapshot met numerieke refs.
  - Acties: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Intern wordt de ref opgelost via Playwright's `aria-ref`.

- **Role-snapshot (role-refs zoals `e12`)**: `openclaw browser snapshot --interactive` (of `--compact`, `--depth`, `--selector`, `--frame`)
  - Uitvoer: een role-gebaseerde lijst/boom met `[ref=e12]` (en optioneel `[nth=1]`).
  - Acties: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Intern wordt de ref opgelost via `getByRole(...)` (plus `nth()` voor duplicaten).
  - Voeg `--labels` toe om een viewportscreenshot met overlayde `e12`-labels op te nemen.
  - Voeg `--urls` toe wanneer linktekst ambigu is en de agent concrete
    navigatiedoelen nodig heeft.

- **ARIA-snapshot (ARIA-refs zoals `ax12`)**: `openclaw browser snapshot --format aria`
  - Uitvoer: de toegankelijkheidsstructuur als gestructureerde nodes.
  - Acties: `openclaw browser click ax12` werkt wanneer het snapshotpad de ref kan binden
    via Playwright en Chrome backend DOM-id's.
- Als Playwright niet beschikbaar is, kunnen ARIA-snapshots nog steeds nuttig zijn voor
  inspectie, maar refs zijn mogelijk niet bruikbaar voor acties. Maak opnieuw een snapshot met `--format ai`
  of `--interactive` wanneer je actierefs nodig hebt.
- Docker-bewijs voor het raw-CDP-fallbackpad: `pnpm test:docker:browser-cdp-snapshot`
  start Chromium met CDP, voert `browser doctor --deep` uit en verifieert dat role-
  snapshots link-URL's, door de cursor gepromoveerde klikbare elementen en iframe-metadata bevatten.

Ref-gedrag:

- Refs zijn **niet stabiel tussen navigaties**; als iets mislukt, voer `snapshot` opnieuw uit en gebruik een nieuwe ref.
- `/act` retourneert de huidige ruwe `targetId` na door een actie geactiveerde vervanging
  wanneer het het vervangende tabblad kan aantonen. Blijf stabiele tab-id's/labels gebruiken voor
  vervolgopdrachten.
- Als de rolesnapshot met `--frame` is gemaakt, zijn role-refs beperkt tot dat iframe tot de volgende rolesnapshot.
- Onbekende of verouderde `axN`-refs mislukken direct in plaats van door te vallen naar
  Playwrights `aria-ref`-selector. Maak een nieuwe snapshot op hetzelfde tabblad wanneer
  dat gebeurt.

## Wacht-power-ups

Je kunt op meer wachten dan alleen tijd/tekst:

- Wachten op URL (globs ondersteund door Playwright):
  - `openclaw browser wait --url "**/dash"`
- Wachten op laadstatus:
  - `openclaw browser wait --load networkidle`
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

## Debugworkflows

Wanneer een actie mislukt (bijv. "niet zichtbaar", "strict mode-overtreding", "bedekt"):

1. `openclaw browser snapshot --interactive`
2. Gebruik `click <ref>` / `type <ref>` (geef in interactieve modus de voorkeur aan role-refs)
3. Als het nog steeds mislukt: `openclaw browser highlight <ref>` om te zien waarop Playwright zich richt
4. Als de pagina zich vreemd gedraagt:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Voor diepgaande debugging: neem een trace op:
   - `openclaw browser trace start`
   - reproduceer het probleem
   - `openclaw browser trace stop` (print `TRACE:<path>`)

## JSON-uitvoer

`--json` is bedoeld voor scripting en gestructureerde tooling.

Voorbeelden:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Rolesnapshots in JSON bevatten `refs` plus een klein `stats`-blok (lines/chars/refs/interactive), zodat tools kunnen redeneren over payloadgrootte en dichtheid.

## Status- en omgevingsknoppen

Deze zijn nuttig voor workflows zoals "laat de site zich gedragen als X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Opslag: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (legacy `set headers --json '{"X-Debug":"1"}'` blijft ondersteund)
- HTTP basic auth: `set credentials user pass` (of `--clear`)
- Geolocatie: `set geo <lat> <lon> --origin "https://example.com"` (of `--clear`)
- Media: `set media dark|light|no-preference|none`
- Tijdzone / locale: `set timezone ...`, `set locale ...`
- Apparaat / viewport:
  - `set device "iPhone 14"` (Playwright-apparaatpresets)
  - `set viewport 1280 720`

## Beveiliging en privacy

- Het openclaw-browserprofiel kan ingelogde sessies bevatten; behandel het als gevoelig.
- `browser act kind=evaluate` / `openclaw browser evaluate` en `wait --fn`
  voeren willekeurige JavaScript uit in de paginacontext. Promptinjectie kan dit sturen.
  Schakel dit uit met `browser.evaluateEnabled=false` als je het niet nodig hebt.
- Voor logins en anti-botnotities (X/Twitter, enz.), zie [Browserlogin + posten op X/Twitter](/nl/tools/browser-login).
- Houd de Gateway/node-host privé (loopback of alleen tailnet).
- Remote CDP-endpoints zijn krachtig; tunnel en bescherm ze.

Strict-modevoorbeeld (blokkeer standaard privé/interne bestemmingen):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Gerelateerd

- [Browser](/nl/tools/browser) — overzicht, configuratie, profielen, beveiliging
- [Browserlogin](/nl/tools/browser-login) — inloggen op sites
- [Browser Linux-probleemoplossing](/nl/tools/browser-linux-troubleshooting)
- [Browser WSL2-probleemoplossing](/nl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
