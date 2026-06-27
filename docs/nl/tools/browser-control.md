---
read_when:
    - De agentbrowser scripten of debuggen via de lokale control-API
    - Op zoek naar de `openclaw browser` CLI-referentie
    - Aangepaste browserautomatisering toevoegen met momentopnamen en refs
summary: OpenClaw-API voor browserbesturing, CLI-referentie en scriptacties
title: Browserbesturings-API
x-i18n:
    generated_at: "2026-06-27T18:23:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

Zie [Browser](/nl/tools/browser) voor installatie, configuratie en probleemoplossing.
Deze pagina is de referentie voor de lokale HTTP-API voor besturing, de `openclaw browser`
CLI en scriptpatronen (snapshots, refs, waits, debugflows).

## Besturings-API (optioneel)

Alleen voor lokale integraties stelt de Gateway een kleine loopback-HTTP-API beschikbaar.
Deze zelfstandige server is opt-in: stel de omgevingsvariabele
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` in de gateway-serviceomgeving in
en herstart de Gateway voordat de HTTP-eindpunten beschikbaar worden. Zonder
deze variabele werkt de browserbesturingsruntime nog steeds via de CLI en
agenttools, maar luistert er niets op de loopback-besturingspoort.

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Tabbladen: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/schermafbeelding: `GET /snapshot`, `POST /screenshot`
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
eenmalige headless-start aan voor lokale beheerde profielen zonder opgeslagen
browserconfiguratie te wijzigen; attach-only-, externe CDP- en bestaande-sessieprofielen weigeren
die override omdat OpenClaw die browserprocessen niet start.

Voor tabbladeindpunten is `targetId` de compatibiliteitsveldnaam. Geef bij voorkeur
`suggestedTargetId` door uit `GET /tabs` of `POST /tabs/open`; labels en `tabId`-
handles zoals `t1` worden ook geaccepteerd. Ruwe CDP-doel-ID's en unieke ruwe
doel-ID-prefixen werken nog steeds, maar het zijn vluchtige diagnostische handles.

Als Gateway-authenticatie met gedeeld geheim is geconfigureerd, vereisen browser-HTTP-routes ook authenticatie:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` of HTTP Basic-authenticatie met dat wachtwoord

Opmerkingen:

- Deze zelfstandige loopback-browser-API gebruikt **geen** trusted-proxy- of
  Tailscale Serve-identiteitsheaders.
- Als `gateway.auth.mode` `none` of `trusted-proxy` is, erven deze loopback-browserroutes
  die identiteitsdragende modi niet; houd ze uitsluitend loopback.

### `/act`-foutcontract

`POST /act` gebruikt een gestructureerde foutrespons voor validatie op routeniveau en
beleidsfouten:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Huidige `code`-waarden:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` ontbreekt of wordt niet herkend.
- `ACT_INVALID_REQUEST` (HTTP 400): normalisatie of validatie van de actielading is mislukt.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` is gebruikt met een niet-ondersteund actietype.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (of `wait --fn`) is uitgeschakeld door configuratie.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` op topniveau of in batches conflicteert met het aanvraagdoel.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): actie wordt niet ondersteund voor bestaande-sessieprofielen.

Andere runtimefouten kunnen nog steeds `{ "error": "<message>" }` retourneren zonder
`code`-veld.

### Playwright-vereiste

Sommige functies (navigate/act/AI-snapshot/rolsnapshot, element-schermafbeeldingen,
PDF) vereisen Playwright. Als Playwright niet is geinstalleerd, retourneren die eindpunten
een duidelijke 501-fout.

Wat nog werkt zonder Playwright:

- ARIA-snapshots
- Toegankelijkheidssnapshots in rolstijl (`--interactive`, `--compact`,
  `--depth`, `--efficient`) wanneer een per-tabblad CDP-WebSocket beschikbaar is. Dit is
  een fallback voor inspectie en ref-ontdekking; Playwright blijft de primaire
  actie-engine.
- Paginaschermafbeeldingen voor de beheerde `openclaw`-browser wanneer een per-tabblad CDP-
  WebSocket beschikbaar is
- Paginaschermafbeeldingen voor `existing-session`- / Chrome MCP-profielen
- Op refs gebaseerde `existing-session`-schermafbeeldingen (`--ref`) uit snapshotuitvoer

Wat nog steeds Playwright nodig heeft:

- `navigate`
- `act`
- AI-snapshots die afhankelijk zijn van Playwrights native AI-snapshotindeling
- Element-schermafbeeldingen met CSS-selector (`--element`)
- volledige browser-PDF-export

Element-schermafbeeldingen weigeren ook `--full-page`; de route retourneert `fullPage is
not supported for element screenshots`.

Als je `Playwright is not available in this gateway build` ziet, mist de verpakte
Gateway de kernruntime-afhankelijkheid voor browsers. Installeer OpenClaw opnieuw of werk
OpenClaw bij en herstart daarna de Gateway. Installeer voor Docker ook de Chromium-
browserbinaries zoals hieronder weergegeven.

#### Docker Playwright-installatie

Als je Gateway in Docker draait, vermijd dan `npx playwright` (npm-overrideconflicten).
Voor aangepaste images bak je Chromium in de image:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Voor een bestaande image installeer je in plaats daarvan via de meegeleverde CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Om browserdownloads te behouden, stel je `PLAYWRIGHT_BROWSERS_PATH` in (bijvoorbeeld
`/home/node/.cache/ms-playwright`) en zorg je dat `/home/node` behouden blijft via
`OPENCLAW_HOME_VOLUME` of een bind mount. OpenClaw detecteert de behouden
Chromium automatisch op Linux. Zie [Docker](/nl/install/docker).

## Hoe het werkt (intern)

Een kleine loopback-besturingsserver accepteert HTTP-aanvragen en maakt via CDP verbinding met Chromium-gebaseerde browsers. Geavanceerde acties (click/type/snapshot/PDF) lopen via Playwright boven op CDP; wanneer Playwright ontbreekt, zijn alleen niet-Playwright-bewerkingen beschikbaar. De agent ziet een stabiele interface terwijl lokale/externe browsers en profielen eronder vrij worden verwisseld.

## CLI-snelreferentie

Alle opdrachten accepteren `--browser-profile <name>` om een specifiek profiel te targeten, en `--json` voor machineleesbare uitvoer.

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

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

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

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

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

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

<Accordion title="State: cookies, storage, offline, headers, geo, device">

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

- `upload` en `dialog` zijn **bewapenings**-aanroepen; voer ze uit voor de click/press die de kiezer/dialoog activeert. Als een actie een modaal venster opent, bevat de actierespons `blockedByDialog` en `browserState.dialogs.pending`; geef die `dialogId` door om direct te reageren. Dialogen die buiten OpenClaw worden afgehandeld, verschijnen onder `browserState.dialogs.recent`.
- `click`/`type`/enzovoort vereisen een `ref` uit `snapshot` (numeriek `12`, rolref `e12` of uitvoerbare ARIA-ref `ax12`). CSS-selectors worden bewust niet ondersteund voor acties. Gebruik `click-coords` wanneer de zichtbare viewportpositie het enige betrouwbare doel is.
- Download- en tracepaden zijn beperkt tot tijdelijke OpenClaw-roots: `/tmp/openclaw{,/downloads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` accepteert bestanden uit de tijdelijke uploads-root van OpenClaw en
  door OpenClaw beheerde inkomende media. Beheerde inkomende media kunnen worden verwezen als
  `media://inbound/<id>`, sandbox-relatief `media/inbound/<id>`, of een opgelost
  pad binnen de beheerde directory voor inkomende media. Geneste mediarefs,
  traversal, symlinks, hardlinks en willekeurige lokale paden worden nog steeds geweigerd.
- `upload` kan ook bestandsinvoervelden direct instellen via `--input-ref` of `--element`.

Stabiele tabblad-ID's en labels overleven vervanging van Chromium-raw-target wanneer OpenClaw
de vervangende tab kan bewijzen, zoals dezelfde URL of een enkel oud tabblad dat na
formulierinzending een enkel nieuw tabblad wordt. Ruwe target-ID's blijven vluchtig; gebruik bij voorkeur
`suggestedTargetId` uit `tabs` in scripts.

Snapshotvlaggen in een oogopslag:

- `--format ai` (standaard met Playwright): AI-snapshot met numerieke refs (`aria-ref="<n>"`).
- `--format aria`: toegankelijkheidsstructuur met `axN`-refs. Wanneer Playwright beschikbaar is, koppelt OpenClaw refs met backend-DOM-id's aan de live pagina zodat vervolgacties ze kunnen gebruiken; behandel de uitvoer anders alleen als inspectie.
- `--efficient` (of `--mode efficient`): compacte voorinstelling voor rolesnapshot. Stel `browser.snapshotDefaults.mode: "efficient"` in om dit de standaard te maken (zie [Gateway-configuratie](/nl/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forceren een rolesnapshot met `ref=e12`-refs. `--frame "<iframe>"` beperkt rolesnapshots tot een iframe.
- Met Playwright voegt `--labels` een screenshot met overlappende ref-labels toe
  (print `MEDIA:<path>`) plus een `annotations`-array met de begrenzingsbox
  van elke ref. Bij `screenshot` werken door Playwright ondersteunde labels met
  `--full-page`, `--ref` en `--element`; bij `snapshot` blijft de bijbehorende
  screenshot beperkt tot de viewport. Bestaande-sessie-/chrome-mcp-profielen renderen overlaylabels op
  paginascreenshots, maar retourneren geen `annotations` en gebruiken de Playwright
  full-page/ref/element-projectiehelper niet. Zonder Playwright of chrome-mcp
  zijn gelabelde screenshots niet beschikbaar.
- `--urls` voegt ontdekte linkbestemmingen toe aan AI-snapshots.

## Snapshots en refs

OpenClaw ondersteunt twee "snapshot"-stijlen:

- **AI-snapshot (numerieke refs)**: `openclaw browser snapshot` (standaard; `--format ai`)
  - Uitvoer: een tekstsnapshot met numerieke refs.
  - Acties: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Intern wordt de ref opgelost via Playwrights `aria-ref`.

- **Rolesnapshot (rolrefs zoals `e12`)**: `openclaw browser snapshot --interactive` (of `--compact`, `--depth`, `--selector`, `--frame`)
  - Uitvoer: een op rollen gebaseerde lijst/structuur met `[ref=e12]` (en optioneel `[nth=1]`).
  - Acties: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Intern wordt de ref opgelost via `getByRole(...)` (plus `nth()` voor duplicaten).
  - Voeg `--labels` toe om een screenshot met overlappende `e12`-labels op te nemen. Op
    door Playwright ondersteunde profielen retourneert dit ook begrenzingsboxmetadata
    per ref (`annotations[]`).
  - Voeg `--urls` toe wanneer linktekst dubbelzinnig is en de agent concrete
    navigatiedoelen nodig heeft.

- **ARIA-snapshot (ARIA-refs zoals `ax12`)**: `openclaw browser snapshot --format aria`
  - Uitvoer: de toegankelijkheidsstructuur als gestructureerde knooppunten.
  - Acties: `openclaw browser click ax12` werkt wanneer het snapshotpad de ref kan koppelen
    via Playwright en Chrome backend-DOM-id's.
- Als Playwright niet beschikbaar is, kunnen ARIA-snapshots nog steeds nuttig zijn voor
  inspectie, maar refs zijn mogelijk niet bruikbaar voor acties. Maak opnieuw een snapshot met `--format ai`
  of `--interactive` wanneer je actierefs nodig hebt.
- Docker-bewijs voor het raw-CDP-terugvalpad: `pnpm test:docker:browser-cdp-snapshot`
  start Chromium met CDP, voert `browser doctor --deep` uit en verifieert dat rolesnapshots
  link-URL's, cursor-gepromoveerde aanklikbare elementen en iframe-metadata bevatten.

Ref-gedrag:

- Refs zijn **niet stabiel over navigaties heen**; als iets mislukt, voer `snapshot` opnieuw uit en gebruik een nieuwe ref.
- `/act` retourneert de huidige ruwe `targetId` na door actie getriggerde vervanging
  wanneer het de vervangende tab kan bewijzen. Blijf stabiele tab-id's/labels gebruiken voor
  vervolgopdrachten.
- Als de rolesnapshot met `--frame` is gemaakt, zijn rolrefs beperkt tot dat iframe tot de volgende rolesnapshot.
- Onbekende of verouderde `axN`-refs falen snel in plaats van terug te vallen op
  Playwrights `aria-ref`-selector. Voer een nieuwe snapshot uit op dezelfde tab wanneer
  dat gebeurt.

## Wachtuitbreidingen

Je kunt op meer wachten dan alleen tijd/tekst:

- Wachten op URL (globs ondersteund door Playwright):
  - `openclaw browser wait --url "**/dash"`
- Wachten op laadstatus:
  - `openclaw browser wait --load networkidle`
  - Ondersteund op beheerde `openclaw`- en raw/remote CDP-profielen. De profielen `user` en `existing-session` weigeren `networkidle`; gebruik daar `--url`, `--text`, een selector of `--fn`-wachters.
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

Wanneer een actie mislukt (bijv. "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. Gebruik `click <ref>` / `type <ref>` (geef de voorkeur aan rolrefs in interactieve modus)
3. Als het nog steeds mislukt: `openclaw browser highlight <ref>` om te zien waarop Playwright zich richt
4. Als de pagina zich vreemd gedraagt:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Voor diepgaande debugging: neem een trace op:
   - `openclaw browser trace start`
   - reproduceer het probleem
   - `openclaw browser trace stop` (print `TRACE:<path>`)

## JSON-uitvoer

`--json` is bedoeld voor scripts en gestructureerde tooling.

Voorbeelden:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Rolesnapshots in JSON bevatten `refs` plus een klein `stats`-blok (regels/tekens/refs/interactief), zodat tools kunnen redeneren over payloadgrootte en dichtheid.

## Status- en omgevingsknoppen

Deze zijn nuttig voor workflows van het type "laat de site zich gedragen als X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Opslag: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (legacy `set headers --json '{"X-Debug":"1"}'` blijft ondersteund)
- HTTP-basisverificatie: `set credentials user pass` (of `--clear`)
- Geolocatie: `set geo <lat> <lon> --origin "https://example.com"` (of `--clear`)
- Media: `set media dark|light|no-preference|none`
- Tijdzone / locale: `set timezone ...`, `set locale ...`
- Apparaat / viewport:
  - `set device "iPhone 14"` (Playwright-apparaatvoorinstellingen)
  - `set viewport 1280 720`

## Beveiliging en privacy

- Het openclaw-browserprofiel kan ingelogde sessies bevatten; behandel het als gevoelig.
- `browser act kind=evaluate` / `openclaw browser evaluate` en `wait --fn`
  voeren willekeurige JavaScript uit in de paginacontext. Promptinjectie kan dit sturen.
  Schakel dit uit met `browser.evaluateEnabled=false` als je het niet nodig hebt.
- `openclaw browser evaluate --fn` accepteert een functiebron, een expressie of
  een statement-body. Statement-body's worden verpakt als async functies, dus gebruik
  `return` voor de waarde die je terug wilt krijgen. Gebruik `--timeout-ms <ms>` wanneer de
  functie aan paginazijde langer nodig kan hebben dan de standaard-evaluatietime-out.
- Voor logins en anti-botnotities (X/Twitter, enz.), zie [Browserlogin + posten op X/Twitter](/nl/tools/browser-login).
- Houd de Gateway/Node-host privé (local loopback of alleen tailnet).
- Remote CDP-eindpunten zijn krachtig; tunnel en bescherm ze.

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

- [Browser](/nl/tools/browser) - overzicht, configuratie, profielen, beveiliging
- [Browserlogin](/nl/tools/browser-login) - inloggen op sites
- [Browser Linux-probleemoplossing](/nl/tools/browser-linux-troubleshooting)
- [Browser WSL2-probleemoplossing](/nl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
