---
read_when:
    - De agentbrowser scripten of debuggen via de lokale besturings-API
    - Op zoek naar de `openclaw browser` CLI-referentie
    - Aangepaste browserautomatisering toevoegen met snapshots en refs
summary: OpenClaw-API voor browserbesturing, CLI-referentie en scriptacties
title: API voor browserbesturing
x-i18n:
    generated_at: "2026-04-29T23:21:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bd0c0e5a5be9a8ec865c932d28456ace6a047d15a534a79c0b81a5e8904736f
    source_path: tools/browser-control.md
    workflow: 16
---

Voor installatie, configuratie en probleemoplossing, zie [Browser](/nl/tools/browser).
Deze pagina is de referentie voor de lokale controle-HTTP-API, de `openclaw browser`
CLI en scriptingpatronen (snapshots, refs, waits, debug-flows).

## Controle-API (optioneel)

Alleen voor lokale integraties stelt de Gateway een kleine loopback-HTTP-API beschikbaar:

- Status/starten/stoppen: `GET /`, `POST /start`, `POST /stop`
- Tabbladen: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Acties: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Machtigingen: `POST /permissions/grant`
- Debuggen: `GET /console`, `POST /pdf`
- Debuggen: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Netwerk: `POST /response/body`
- Status: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Status: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Instellingen: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Alle eindpunten accepteren `?profile=<name>`. `POST /start?headless=true` vraagt een
eenmalige headless-start aan voor lokaal beheerde profielen zonder de persistente
browserconfiguratie te wijzigen; attach-only-, remote CDP- en existing-session-profielen weigeren
die override omdat OpenClaw die browserprocessen niet start.

Als gedeelde-geheime Gateway-authenticatie is geconfigureerd, vereisen browser-HTTP-routes ook authenticatie:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` of HTTP Basic-authenticatie met dat wachtwoord

Opmerkingen:

- Deze zelfstandige loopback-browser-API gebruikt **geen** trusted-proxy- of
  Tailscale Serve-identiteitsheaders.
- Als `gateway.auth.mode` `none` of `trusted-proxy` is, erven deze loopback-browserroutes
  die identiteitsdragende modi niet; houd ze alleen via loopback toegankelijk.

### `/act`-foutcontract

`POST /act` gebruikt een gestructureerde foutrespons voor validatie op routeniveau en
beleidsfouten:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Huidige `code`-waarden:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` ontbreekt of wordt niet herkend.
- `ACT_INVALID_REQUEST` (HTTP 400): de actiepayload is niet genormaliseerd of gevalideerd.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` is gebruikt met een niet-ondersteund actietype.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (of `wait --fn`) is uitgeschakeld door de configuratie.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` op topniveau of in batches conflicteert met het aanvraagdoel.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): de actie wordt niet ondersteund voor existing-session-profielen.

Andere runtimefouten kunnen nog steeds `{ "error": "<message>" }` retourneren zonder
`code`-veld.

### Playwright-vereiste

Sommige functies (navigate/act/AI-snapshot/role-snapshot, elementscreenshots,
PDF) vereisen Playwright. Als Playwright niet is geïnstalleerd, retourneren die eindpunten
een duidelijke 501-fout.

Wat nog werkt zonder Playwright:

- ARIA-snapshots
- Role-stijl toegankelijkheidssnapshots (`--interactive`, `--compact`,
  `--depth`, `--efficient`) wanneer een per-tab CDP-WebSocket beschikbaar is. Dit is
  een fallback voor inspectie en ref-detectie; Playwright blijft de primaire
  actie-engine.
- Paginascreenshots voor de beheerde `openclaw`-browser wanneer een per-tab CDP
  WebSocket beschikbaar is
- Paginascreenshots voor `existing-session` / Chrome MCP-profielen
- `existing-session` ref-gebaseerde screenshots (`--ref`) uit snapshotuitvoer

Wat nog steeds Playwright nodig heeft:

- `navigate`
- `act`
- AI-snapshots die afhankelijk zijn van Playwrights native AI-snapshotformaat
- CSS-selector-elementscreenshots (`--element`)
- volledige browser-PDF-export

Elementscreenshots weigeren ook `--full-page`; de route retourneert `fullPage is
not supported for element screenshots`.

Als je `Playwright is not available in this gateway build` ziet, herstel dan de
gebundelde runtime-afhankelijkheden van de browser-Plugin zodat `playwright-core` is geïnstalleerd,
en herstart daarna de Gateway. Voor pakketinstallaties voer je `openclaw doctor --fix` uit.
Voor Docker installeer je ook de Chromium-browserbinaries zoals hieronder getoond.

#### Docker Playwright-installatie

Als je Gateway in Docker draait, vermijd dan `npx playwright` (npm-overrideconflicten).
Gebruik in plaats daarvan de gebundelde CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Om browserdownloads te behouden, stel je `PLAYWRIGHT_BROWSERS_PATH` in (bijvoorbeeld
`/home/node/.cache/ms-playwright`) en zorg je dat `/home/node` persistent is via
`OPENCLAW_HOME_VOLUME` of een bind mount. Zie [Docker](/nl/install/docker).

## Hoe het werkt (intern)

Een kleine loopback-controleserver accepteert HTTP-aanvragen en maakt verbinding met op Chromium gebaseerde browsers via CDP. Geavanceerde acties (click/type/snapshot/PDF) verlopen via Playwright boven op CDP; wanneer Playwright ontbreekt, zijn alleen niet-Playwright-bewerkingen beschikbaar. De agent ziet één stabiele interface terwijl lokale/externe browsers en profielen eronder vrij kunnen wisselen.

## CLI-snelreferentie

Alle opdrachten accepteren `--browser-profile <name>` om een specifiek profiel te gebruiken, en `--json` voor machineleesbare uitvoer.

<AccordionGroup>

<Accordion title="Basis: status, tabbladen, openen/focussen/sluiten">

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

- `upload` en `dialog` zijn **arming**-aanroepen; voer ze uit vóór de klik/toetsdruk die de kiezer/dialoog triggert.
- `click`/`type`/enz. vereisen een `ref` uit `snapshot` (numeriek `12`, role-ref `e12`, of uitvoerbare ARIA-ref `ax12`). CSS-selectors worden bewust niet ondersteund voor acties. Gebruik `click-coords` wanneer de zichtbare viewportpositie het enige betrouwbare doel is.
- Download-, trace- en uploadpaden zijn beperkt tot OpenClaw-temp-roots: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` kan ook bestandsinputs direct instellen via `--input-ref` of `--element`.

Stabiele tabblad-id's en labels overleven Chromium-raw-targetvervanging wanneer OpenClaw
de vervangende tab kan bewijzen, zoals dezelfde URL of één oud tabblad dat na formulierverzending
één nieuw tabblad wordt. Raw target-id's blijven vluchtig; gebruik bij scripts bij voorkeur
`suggestedTargetId` uit `tabs`.

Snapshotvlaggen in één oogopslag:

- `--format ai` (standaard met Playwright): AI-snapshot met numerieke refs (`aria-ref="<n>"`).
- `--format aria`: toegankelijkheidsboom met `axN`-refs. Wanneer Playwright beschikbaar is, bindt OpenClaw refs met backend-DOM-id's aan de livepagina zodat vervolgacties ze kunnen gebruiken; anders behandel je de uitvoer alleen als inspectie.
- `--efficient` (of `--mode efficient`): compacte role-snapshotpreset. Stel `browser.snapshotDefaults.mode: "efficient"` in om dit de standaard te maken (zie [Gateway-configuratie](/nl/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forceren een role-snapshot met `ref=e12`-refs. `--frame "<iframe>"` beperkt role-snapshots tot een iframe.
- `--labels` voegt een viewport-only screenshot toe met overlay-reflabels (print `MEDIA:<path>`).
- `--urls` voegt gevonden linkbestemmingen toe aan AI-snapshots.

## Snapshots en refs

OpenClaw ondersteunt twee “snapshot”-stijlen:

- **AI-snapshot (numerieke refs)**: `openclaw browser snapshot` (standaard; `--format ai`)
  - Uitvoer: een tekstsnapshot met numerieke refs.
  - Acties: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Intern wordt de ref opgelost via Playwrights `aria-ref`.

- **Role-snapshot (role-refs zoals `e12`)**: `openclaw browser snapshot --interactive` (of `--compact`, `--depth`, `--selector`, `--frame`)
  - Uitvoer: een role-gebaseerde lijst/boom met `[ref=e12]` (en optioneel `[nth=1]`).
  - Acties: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Intern wordt de ref opgelost via `getByRole(...)` (plus `nth()` voor duplicaten).
  - Voeg `--labels` toe om een viewportscreenshot met overlayde `e12`-labels op te nemen.
  - Voeg `--urls` toe wanneer linktekst dubbelzinnig is en de agent concrete
    navigatiedoelen nodig heeft.

- **ARIA-snapshot (ARIA-refs zoals `ax12`)**: `openclaw browser snapshot --format aria`
  - Uitvoer: de toegankelijkheidsboom als gestructureerde nodes.
  - Acties: `openclaw browser click ax12` werkt wanneer het snapshotpad de ref kan binden
    via Playwright en Chrome-backend-DOM-id's.
- Als Playwright niet beschikbaar is, kunnen ARIA-snapshots nog steeds nuttig zijn voor
  inspectie, maar refs zijn mogelijk niet uitvoerbaar. Maak opnieuw een snapshot met `--format ai`
  of `--interactive` wanneer je actierefs nodig hebt.
- Docker-bewijs voor het raw-CDP-fallbackpad: `pnpm test:docker:browser-cdp-snapshot`
  start Chromium met CDP, voert `browser doctor --deep` uit en verifieert dat role-
  snapshots link-URL's, cursor-gepromote klikbare elementen en iframe-metadata bevatten.

Ref-gedrag:

- Refs zijn **niet stabiel tussen navigaties**; als iets mislukt, voer `snapshot` opnieuw uit en gebruik een nieuwe ref.
- `/act` retourneert de huidige ruwe `targetId` na door een actie veroorzaakte vervanging
  wanneer het de vervangende tab kan bewijzen. Blijf stabiele tab-id's/labels gebruiken voor
  vervolgopdrachten.
- Als de rolsnapshot met `--frame` is gemaakt, zijn rol-refs beperkt tot dat iframe tot de volgende rolsnapshot.
- Onbekende of verouderde `axN`-refs falen snel in plaats van door te vallen naar
  Playwright's `aria-ref`-selector. Maak een nieuwe snapshot op dezelfde tab wanneer
  dat gebeurt.

## Wacht-uitbreidingen

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

Wanneer een actie mislukt (bijv. “niet zichtbaar”, “strict-mode-schending”, “bedekt”):

1. `openclaw browser snapshot --interactive`
2. Gebruik `click <ref>` / `type <ref>` (geef in interactieve modus de voorkeur aan rol-refs)
3. Als het nog steeds mislukt: `openclaw browser highlight <ref>` om te zien waarop Playwright mikt
4. Als de pagina zich vreemd gedraagt:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Voor diepgaand debuggen: neem een trace op:
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

Rolsnapshots in JSON bevatten `refs` plus een klein `stats`-blok (lines/chars/refs/interactive), zodat tools kunnen redeneren over payloadgrootte en dichtheid.

## Status- en omgevingsinstellingen

Deze zijn handig voor workflows zoals “laat de site zich gedragen als X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Opslag: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (legacy `set headers --json '{"X-Debug":"1"}'` blijft ondersteund)
- HTTP-basic-auth: `set credentials user pass` (of `--clear`)
- Geolocatie: `set geo <lat> <lon> --origin "https://example.com"` (of `--clear`)
- Media: `set media dark|light|no-preference|none`
- Tijdzone / locale: `set timezone ...`, `set locale ...`
- Apparaat / viewport:
  - `set device "iPhone 14"` (Playwright-apparaatpresets)
  - `set viewport 1280 720`

## Beveiliging en privacy

- Het openclaw-browserprofiel kan ingelogde sessies bevatten; behandel het als gevoelig.
- `browser act kind=evaluate` / `openclaw browser evaluate` en `wait --fn`
  voeren willekeurige JavaScript uit in de paginacontext. Prompt injection kan
  dit sturen. Schakel het uit met `browser.evaluateEnabled=false` als je het niet nodig hebt.
- Zie voor logins en anti-botnotities (X/Twitter, enz.) [Browserlogin + posten op X/Twitter](/nl/tools/browser-login).
- Houd de Gateway/node-host privé (loopback of alleen tailnet).
- Externe CDP-eindpunten zijn krachtig; tunnel en bescherm ze.

Strict-mode-voorbeeld (blokkeer standaard privé/interne bestemmingen):

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
- [Browserlogin](/nl/tools/browser-login) — inloggen bij sites
- [Browser Linux-probleemoplossing](/nl/tools/browser-linux-troubleshooting)
- [Browser WSL2-probleemoplossing](/nl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
