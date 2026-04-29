---
read_when:
    - Agentgestuurde browserautomatisering toevoegen
    - Debuggen waarom OpenClaw je eigen Chrome verstoort
    - Browserinstellingen + levenscyclus implementeren in de macOS-app
summary: Geïntegreerde browserbesturingsservice + actieopdrachten
title: Browser (beheerd door OpenClaw)
x-i18n:
    generated_at: "2026-04-29T23:21:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8f0456505f4e1711626a539a0a0c48d67ca10d4788838eb53855bc83c766d2f
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw kan een **speciaal Chrome/Brave/Edge/Chromium-profiel** uitvoeren dat de agent bestuurt.
Het is geisoleerd van je persoonlijke browser en wordt beheerd via een kleine lokale
controleservice binnen de Gateway (alleen loopback).

Beginnersweergave:

- Zie het als een **afzonderlijke browser alleen voor agents**.
- Het `openclaw`-profiel raakt je persoonlijke browserprofiel **niet** aan.
- De agent kan **tabbladen openen, pagina's lezen, klikken en typen** in een veilige baan.
- Het ingebouwde `user`-profiel koppelt aan je echte aangemelde Chrome-sessie via Chrome MCP.

## Wat je krijgt

- Een afzonderlijk browserprofiel met de naam **openclaw** (standaard met oranje accent).
- Deterministische tabbladbesturing (weergeven/openen/focussen/sluiten).
- Agentacties (klikken/typen/slepen/selecteren), snapshots, schermafbeeldingen, PDF's.
- Een meegeleverde `browser-automation`-skill die agents de herstelcyclus voor snapshots,
  stabiele tabbladen, verouderde referenties en handmatige blokkers leert wanneer de browser-
  Plugin is ingeschakeld.
- Optionele ondersteuning voor meerdere profielen (`openclaw`, `work`, `remote`, ...).

Deze browser is **niet** je dagelijkse browser. Het is een veilig, geisoleerd oppervlak voor
agentautomatisering en verificatie.

## Snel starten

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Als je "Browser disabled" krijgt, schakel dit dan in de configuratie in (zie hieronder) en herstart de
Gateway.

Als `openclaw browser` volledig ontbreekt, of als de agent zegt dat de browsertool
niet beschikbaar is, ga dan naar [Ontbrekende browseropdracht of tool](/nl/tools/browser#missing-browser-command-or-tool).

## Pluginbeheer

De standaardtool `browser` is een meegeleverde Plugin. Schakel deze uit om hem te vervangen door een andere Plugin die dezelfde toolnaam `browser` registreert:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Standaarden hebben zowel `plugins.entries.browser.enabled` **als** `browser.enabled=true` nodig. Alleen de Plugin uitschakelen verwijdert de `openclaw browser`-CLI, de Gateway-methode `browser.request`, de agenttool en de controleservice als een eenheid; je `browser.*`-configuratie blijft intact voor een vervanging.

Wijzigingen in de browserconfiguratie vereisen een herstart van de Gateway zodat de Plugin zijn service opnieuw kan registreren.

## Agentrichtlijnen

Opmerking over toolprofiel: `tools.profile: "coding"` bevat `web_search` en
`web_fetch`, maar bevat niet de volledige `browser`-tool. Als de agent of een
gestarte subagent browserautomatisering moet gebruiken, voeg browser dan toe in de profiel-
fase:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gebruik voor een enkele agent `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` alleen is niet genoeg, omdat subagent-
beleid wordt toegepast na profielfiltering.

De browser-Plugin levert twee niveaus van agentrichtlijnen:

- De toolbeschrijving van `browser` bevat het compacte altijd-actieve contract: kies
  het juiste profiel, houd referenties op hetzelfde tabblad, gebruik `tabId`/labels voor tabblad-
  targeting en laad de browser-Skills voor werk met meerdere stappen.
- De meegeleverde `browser-automation`-Skills bevat de langere bedieningscyclus:
  controleer eerst status/tabbladen, label taak-tabbladen, maak een snapshot voor handelingen, maak opnieuw een snapshot
  na UI-wijzigingen, herstel verouderde referenties een keer, en rapporteer login/2FA/captcha of
  camera-/microfoonblokkers als handmatige actie in plaats van te gokken.

Door Plugins meegeleverde Skills worden weergegeven in de beschikbare Skills van de agent wanneer de
Plugin is ingeschakeld. De volledige Skills-instructies worden op aanvraag geladen, zodat routinematige
beurten niet de volledige tokenkosten betalen.

## Ontbrekende browseropdracht of tool

Als `openclaw browser` onbekend is na een upgrade, `browser.request` ontbreekt, of de agent meldt dat de browsertool niet beschikbaar is, is de gebruikelijke oorzaak een `plugins.allow`-lijst die `browser` weglaat en geen root-`browser`-configuratieblok heeft. Voeg dit toe:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Een expliciet root-`browser`-blok, bijvoorbeeld `browser.enabled=true` of `browser.profiles.<name>`, activeert de meegeleverde browser-Plugin zelfs onder een beperkende `plugins.allow`, overeenkomstig het gedrag van kanaalconfiguratie. `plugins.entries.browser.enabled=true` en `tools.alsoAllow: ["browser"]` vervangen allowlist-lidmaatschap op zichzelf niet. `plugins.allow` volledig verwijderen herstelt ook de standaardinstelling.

## Profielen: `openclaw` vs `user`

- `openclaw`: beheerde, geisoleerde browser (geen extensie vereist).
- `user`: ingebouwd Chrome MCP-koppelprofiel voor je **echte aangemelde Chrome**-
  sessie.

Voor browsertoolaanroepen van agents:

- Standaard: gebruik de geisoleerde `openclaw`-browser.
- Geef de voorkeur aan `profile="user"` wanneer bestaande aangemelde sessies belangrijk zijn en de gebruiker
  bij de computer is om op een koppelprompt te klikken of deze goed te keuren.
- `profile` is de expliciete override wanneer je een specifieke browsermodus wilt.

Stel `browser.defaultProfile: "openclaw"` in als je standaard de beheerde modus wilt gebruiken.

## Configuratie

Browserinstellingen staan in `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="Poorten en bereikbaarheid">

- De controleservice bindt aan loopback op een poort die is afgeleid van `gateway.port` (standaard `18791` = gateway + 2). Het overschrijven van `gateway.port` of `OPENCLAW_GATEWAY_PORT` verschuift de afgeleide poorten binnen dezelfde familie.
- Lokale `openclaw`-profielen wijzen `cdpPort`/`cdpUrl` automatisch toe; stel deze alleen in voor externe CDP. `cdpUrl` gebruikt standaard de beheerde lokale CDP-poort wanneer niet ingesteld.
- `remoteCdpTimeoutMs` is van toepassing op externe en `attachOnly` CDP HTTP-bereikbaarheids-
  controles en HTTP-verzoeken om tabbladen te openen; `remoteCdpHandshakeTimeoutMs` is van toepassing op
  hun CDP WebSocket-handshakes.
- `localLaunchTimeoutMs` is het budget voor een lokaal gestart beheerd Chrome-
  proces om zijn CDP HTTP-eindpunt beschikbaar te maken. `localCdpReadyTimeoutMs` is het
  vervolgbudget voor CDP-websocketgereedheid nadat het proces is ontdekt.
  Verhoog deze waarden op Raspberry Pi, low-end VPS of oudere hardware waarop Chromium
  langzaam start. Waarden moeten positieve gehele getallen tot `120000` ms zijn; ongeldige
  configuratiewaarden worden geweigerd.
- Herhaalde fouten bij starten/gereedheid van beheerd Chrome worden per
  profiel met een circuit breaker onderbroken. Na meerdere opeenvolgende fouten pauzeert OpenClaw nieuwe start-
  pogingen kort in plaats van Chromium te starten bij elke browsertoolaanroep. Los
  het opstartprobleem op, schakel de browser uit als die niet nodig is, of herstart de
  Gateway na herstel.
- `actionTimeoutMs` is het standaardbudget voor browser-`act`-verzoeken wanneer de aanroeper geen `timeoutMs` doorgeeft. Het clienttransport voegt een klein slackvenster toe zodat lange wachttijden kunnen voltooien in plaats van bij de HTTP-grens te verlopen.
- `tabCleanup` is best-effort-opruiming voor tabbladen die zijn geopend door browsersessies van primaire agents. Subagent-, Cron- en ACP-levenscyclusopruiming sluit nog steeds hun expliciet gevolgde tabbladen aan het einde van de sessie; primaire sessies houden actieve tabbladen herbruikbaar en sluiten daarna inactieve of overtollige gevolgde tabbladen op de achtergrond.

</Accordion>

<Accordion title="SSRF-beleid">

- Browsernavigatie en tabblad openen worden vóór navigatie door SSRF bewaakt en daarna op basis van best effort opnieuw gecontroleerd op de uiteindelijke `http(s)`-URL.
- In strikte SSRF-modus worden externe CDP-eindpuntdetectie en `/json/version`-probes (`cdpUrl`) ook gecontroleerd.
- Gateway/provider-omgevingsvariabelen `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` en `NO_PROXY` proxyen de door OpenClaw beheerde browser niet automatisch. Beheerd Chrome start standaard direct, zodat providerproxy-instellingen de SSRF-controles van de browser niet verzwakken.
- Om de beheerde browser zelf via een proxy te laten lopen, geef je expliciete Chrome-proxyvlaggen door via `browser.extraArgs`, zoals `--proxy-server=...` of `--proxy-pac-url=...`. Strikte SSRF-modus blokkeert expliciete browserproxyrouting tenzij browsertoegang tot het privénetwerk bewust is ingeschakeld.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` staat standaard uit; schakel dit alleen in wanneer browsertoegang tot het privénetwerk bewust wordt vertrouwd.
- `browser.ssrfPolicy.allowPrivateNetwork` blijft ondersteund als legacy-alias.

</Accordion>

<Accordion title="Profielgedrag">

- `attachOnly: true` betekent dat er nooit een lokale browser wordt gestart; er wordt alleen gekoppeld als er al een actief is.
- `headless` kan globaal of per lokaal beheerd profiel worden ingesteld. Waarden per profiel overschrijven `browser.headless`, zodat het ene lokaal gestarte profiel headless kan blijven terwijl een ander zichtbaar blijft.
- `POST /start?headless=true` en `openclaw browser start --headless` vragen een
  eenmalige headless-start aan voor lokaal beheerde profielen zonder
  `browser.headless` of de profielconfiguratie te herschrijven. Bestaande sessies, attach-only-profielen en
  externe CDP-profielen weigeren de override omdat OpenClaw die
  browserprocessen niet start.
- Op Linux-hosts zonder `DISPLAY` of `WAYLAND_DISPLAY` schakelen lokaal beheerde profielen
  automatisch standaard over naar headless wanneer noch de omgeving noch de profiel-/globale
  configuratie expliciet voor headed-modus kiest. `openclaw browser status --json`
  rapporteert `headlessSource` als `env`, `profile`, `config`,
  `request`, `linux-display-fallback` of `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` dwingt lokaal beheerde starts voor het
  huidige proces naar headless. `OPENCLAW_BROWSER_HEADLESS=0` dwingt headed-modus af voor gewone
  starts en geeft een bruikbare fout terug op Linux-hosts zonder displayserver;
  een expliciet `start --headless`-verzoek wint nog steeds voor die ene start.
- `executablePath` kan globaal of per lokaal beheerd profiel worden ingesteld. Waarden per profiel overschrijven `browser.executablePath`, zodat verschillende beheerde profielen verschillende op Chromium gebaseerde browsers kunnen starten. Beide vormen accepteren `~` voor de homedirectory van je besturingssysteem.
- `color` (top-level en per profiel) geeft de browser-UI een tint zodat je kunt zien welk profiel actief is.
- Het standaardprofiel is `openclaw` (beheerd standalone). Gebruik `defaultProfile: "user"` om te kiezen voor de aangemelde gebruikersbrowser.
- Volgorde voor automatische detectie: systeemstandaardbrowser als die op Chromium is gebaseerd; anders Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` gebruikt Chrome DevTools MCP in plaats van ruwe CDP. Stel `cdpUrl` niet in voor die driver.
- Stel `browser.profiles.<name>.userDataDir` in wanneer een existing-session-profiel moet koppelen aan een niet-standaard Chromium-gebruikersprofiel (Brave, Edge, enz.). Dit pad accepteert ook `~` voor de homedirectory van je besturingssysteem.

</Accordion>

</AccordionGroup>

## Brave of een andere op Chromium gebaseerde browser gebruiken

Als je **systeemstandaardbrowser** op Chromium is gebaseerd (Chrome/Brave/Edge/enz.),
gebruikt OpenClaw deze automatisch. Stel `browser.executablePath` in om
automatische detectie te overschrijven. Top-level en per-profiel `executablePath`-waarden accepteren `~`
voor de homedirectory van je besturingssysteem:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Of stel het in de configuratie in, per platform:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

Per-profiel `executablePath` heeft alleen effect op lokaal beheerde profielen die OpenClaw
start. `existing-session`-profielen koppelen in plaats daarvan aan een al actieve browser,
en externe CDP-profielen gebruiken de browser achter `cdpUrl`.

## Lokale versus externe bediening

- **Lokale bediening (standaard):** de Gateway start de loopback-besturingsservice en kan een lokale browser starten.
- **Externe bediening (node-host):** voer een node-host uit op de machine met de browser; de Gateway proxyt browseracties ernaartoe.
- **Externe CDP:** stel `browser.profiles.<name>.cdpUrl` (of `browser.cdpUrl`) in om
  te koppelen aan een externe op Chromium gebaseerde browser. In dit geval start OpenClaw geen lokale browser.
- Voor extern beheerde CDP-services op loopback (bijvoorbeeld Browserless in
  Docker gepubliceerd naar `127.0.0.1`), stel ook `attachOnly: true` in. Loopback-CDP
  zonder `attachOnly` wordt behandeld als een lokaal door OpenClaw beheerd browserprofiel.
- `headless` heeft alleen effect op lokaal beheerde profielen die OpenClaw start. Het herstart of wijzigt existing-session- of externe CDP-browsers niet.
- `executablePath` volgt dezelfde regel voor lokaal beheerde profielen. Als je dit op een
  actief lokaal beheerd profiel wijzigt, wordt dat profiel gemarkeerd voor herstart/reconcile zodat de
  volgende start de nieuwe binary gebruikt.

Stopgedrag verschilt per profielmodus:

- lokaal beheerde profielen: `openclaw browser stop` stopt het browserproces dat
  OpenClaw heeft gestart
- attach-only- en externe CDP-profielen: `openclaw browser stop` sluit de actieve
  besturingssessie en geeft Playwright/CDP-emulatie-overrides vrij (viewport,
  kleurenschema, locale, tijdzone, offlinemodus en vergelijkbare status), ook
  al is er geen browserproces door OpenClaw gestart

Externe CDP-URL's kunnen auth bevatten:

- Querytokens (bijv. `https://provider.example?token=<token>`)
- HTTP Basic-auth (bijv. `https://user:pass@provider.example`)

OpenClaw behoudt de auth bij het aanroepen van `/json/*`-endpoints en bij het verbinden
met de CDP-WebSocket. Geef de voorkeur aan omgevingsvariabelen of secrets managers voor
tokens in plaats van ze vast te leggen in configuratiebestanden.

## Node-browserproxy (standaard zonder configuratie)

Als je een **node-host** uitvoert op de machine met je browser, kan OpenClaw
browsertoolaanroepen automatisch naar die node routeren zonder extra browserconfiguratie.
Dit is het standaardpad voor externe gateways.

Opmerkingen:

- De node-host maakt zijn lokale browserbesturingsserver beschikbaar via een **proxyopdracht**.
- Profielen komen uit de eigen `browser.profiles`-configuratie van de node (hetzelfde als lokaal).
- `nodeHost.browserProxy.allowProfiles` is optioneel. Laat dit leeg voor het legacy-/standaardgedrag: alle geconfigureerde profielen blijven bereikbaar via de proxy, inclusief routes voor het aanmaken/verwijderen van profielen.
- Als je `nodeHost.browserProxy.allowProfiles` instelt, behandelt OpenClaw dit als een least-privilege-grens: alleen profielen op de allowlist kunnen worden gericht, en permanente routes voor het aanmaken/verwijderen van profielen worden op het proxyoppervlak geblokkeerd.
- Schakel dit uit als je het niet wilt:
  - Op de node: `nodeHost.browserProxy.enabled=false`
  - Op de Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (gehoste externe CDP)

[Browserless](https://browserless.io) is een gehoste Chromium-service die
CDP-verbindings-URL's via HTTPS en WebSocket beschikbaar maakt. OpenClaw kan beide vormen gebruiken, maar
voor een extern browserprofiel is de eenvoudigste optie de directe WebSocket-URL
uit de verbindingsdocumentatie van Browserless.

Voorbeeld:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Opmerkingen:

- Vervang `<BROWSERLESS_API_KEY>` door je echte Browserless-token.
- Kies het regio-endpoint dat overeenkomt met je Browserless-account (zie hun documentatie).
- Als Browserless je een HTTPS-basis-URL geeft, kun je deze omzetten naar
  `wss://` voor een directe CDP-verbinding of de HTTPS-URL behouden en OpenClaw
  `/json/version` laten ontdekken.

### Browserless Docker op dezelfde host

Wanneer Browserless self-hosted in Docker draait en OpenClaw op de host draait, behandel
Browserless dan als een extern beheerde CDP-service:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Het adres in `browser.profiles.browserless.cdpUrl` moet bereikbaar zijn vanuit het
OpenClaw-proces. Browserless moet ook een overeenkomend bereikbaar endpoint adverteren;
stel Browserless `EXTERNAL` in op dezelfde publiek-naar-OpenClaw WebSocket-basis, zoals
`ws://127.0.0.1:3000`, `ws://browserless:3000` of een stabiel privé-Docker-
netwerkadres. Als `/json/version` `webSocketDebuggerUrl` teruggeeft dat naar
een adres wijst dat OpenClaw niet kan bereiken, kan CDP HTTP er gezond uitzien terwijl het koppelen via WebSocket
nog steeds mislukt.

Laat `attachOnly` niet unset voor een loopback-Browserless-profiel. Zonder
`attachOnly` behandelt OpenClaw de loopback-poort als een lokaal beheerd browserprofiel
en kan het melden dat de poort in gebruik is maar niet eigendom is van OpenClaw.

## Directe WebSocket-CDP-providers

Sommige gehoste browserservices bieden een **direct WebSocket**-endpoint in plaats van
de standaard op HTTP gebaseerde CDP-discovery (`/json/version`). OpenClaw accepteert drie
CDP-URL-vormen en kiest automatisch de juiste verbindingsstrategie:

- **HTTP(S)-discovery** — `http://host[:port]` of `https://host[:port]`.
  OpenClaw roept `/json/version` aan om de WebSocket-debugger-URL te ontdekken en
  verbindt daarna. Geen WebSocket-fallback.
- **Directe WebSocket-endpoints** — `ws://host[:port]/devtools/<kind>/<id>` of
  `wss://...` met een `/devtools/browser|page|worker|shared_worker|service_worker/<id>`-
  pad. OpenClaw verbindt rechtstreeks via een WebSocket-handshake en slaat
  `/json/version` volledig over.
- **Kale WebSocket-roots** — `ws://host[:port]` of `wss://host[:port]` zonder
  `/devtools/...`-pad (bijv. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw probeert eerst HTTP-
  `/json/version`-discovery (waarbij het schema wordt genormaliseerd naar `http`/`https`);
  als discovery een `webSocketDebuggerUrl` teruggeeft, wordt die gebruikt, anders valt OpenClaw
  terug op een directe WebSocket-handshake op de kale root. Als het geadverteerde
  WebSocket-endpoint de CDP-handshake weigert maar de geconfigureerde kale root
  deze accepteert, valt OpenClaw ook terug op die root. Hierdoor kan een kale `ws://`
  die naar een lokale Chrome wijst nog steeds verbinden, omdat Chrome alleen WebSocket-
  upgrades accepteert op het specifieke per-target-pad uit `/json/version`, terwijl gehoste
  providers nog steeds hun root-WebSocket-endpoint kunnen gebruiken wanneer hun discovery-
  endpoint een kortlevende URL adverteert die niet geschikt is voor Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) is een cloudplatform voor het uitvoeren van
headless browsers met ingebouwde CAPTCHA-oplossing, stealth-modus en residentiële
proxy's.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Opmerkingen:

- [Meld je aan](https://www.browserbase.com/sign-up) en kopieer je **API Key**
  uit het [Overview-dashboard](https://www.browserbase.com/overview).
- Vervang `<BROWSERBASE_API_KEY>` door je echte Browserbase-API-sleutel.
- Browserbase maakt automatisch een browsersessie aan bij WebSocket-verbinding, dus er is geen
  handmatige stap voor sessieaanmaak nodig.
- De gratis tier staat één gelijktijdige sessie en één browseruur per maand toe.
  Zie [pricing](https://www.browserbase.com/pricing) voor limieten van betaalde abonnementen.
- Zie de [Browserbase-docs](https://docs.browserbase.com) voor volledige API-
  referentie, SDK-gidsen en integratievoorbeelden.

## Beveiliging

Kernideeën:

- Browserbediening is alleen via loopback; toegang loopt via de authenticatie van de Gateway of Node-koppeling.
- De zelfstandige loopback-browser-HTTP-API gebruikt **alleen authenticatie met gedeeld geheim**:
  bearer-authenticatie met Gateway-token, `x-openclaw-password`, of HTTP Basic-authenticatie met het
  geconfigureerde Gateway-wachtwoord.
- Identiteitsheaders van Tailscale Serve en `gateway.auth.mode: "trusted-proxy"` authenticeren
  deze zelfstandige loopback-browser-API **niet**.
- Als browserbediening is ingeschakeld en er geen authenticatie met gedeeld geheim is geconfigureerd, genereert OpenClaw
  bij het opstarten automatisch `gateway.auth.token` en bewaart het in de configuratie.
- OpenClaw genereert dat token **niet** automatisch wanneer `gateway.auth.mode` al
  `password`, `none` of `trusted-proxy` is.
- Houd de Gateway en eventuele Node-hosts op een privénetwerk (Tailscale); vermijd publieke blootstelling.
- Behandel externe CDP-URL's/tokens als geheimen; geef de voorkeur aan omgevingsvariabelen of een secretsmanager.

Tips voor externe CDP:

- Geef waar mogelijk de voorkeur aan versleutelde eindpunten (HTTPS of WSS) en kortlevende tokens.
- Vermijd het rechtstreeks opnemen van langlevende tokens in configuratiebestanden.

## Profielen (multi-browser)

OpenClaw ondersteunt meerdere benoemde profielen (routeringsconfiguraties). Profielen kunnen zijn:

- **door OpenClaw beheerd**: een dedicated Chromium-gebaseerde browserinstantie met een eigen gebruikersdatamap + CDP-poort
- **extern**: een expliciete CDP-URL (Chromium-gebaseerde browser die ergens anders draait)
- **bestaande sessie**: je bestaande Chrome-profiel via automatische verbinding met Chrome DevTools MCP

Standaardwaarden:

- Het profiel `openclaw` wordt automatisch aangemaakt als het ontbreekt.
- Het profiel `user` is ingebouwd voor Chrome MCP-koppeling aan een bestaande sessie.
- Bestaande-sessieprofielen zijn opt-in naast `user`; maak ze aan met `--driver existing-session`.
- Lokale CDP-poorten worden standaard toegewezen vanuit **18800–18899**.
- Als een profiel wordt verwijderd, wordt de lokale datamap ervan naar de Prullenmand verplaatst.

Alle bedieningseindpunten accepteren `?profile=<name>`; de CLI gebruikt `--browser-profile`.

## Bestaande sessie via Chrome DevTools MCP

OpenClaw kan ook koppelen aan een actief Chromium-gebaseerd browserprofiel via de
officiële Chrome DevTools MCP-server. Dit hergebruikt de tabbladen en aanmeldstatus
die al in dat browserprofiel open zijn.

Officiële achtergrond- en installatieverwijzingen:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Ingebouwd profiel:

- `user`

Optioneel: maak je eigen aangepaste bestaande-sessieprofiel als je een
andere naam, kleur of browserdatamap wilt.

Standaardgedrag:

- Het ingebouwde profiel `user` gebruikt Chrome MCP-auto-connect, dat zich richt op het
  standaard lokale Google Chrome-profiel.

Gebruik `userDataDir` voor Brave, Edge, Chromium of een niet-standaard Chrome-profiel.
`~` wordt uitgebreid naar de thuismap van je besturingssysteem:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Daarna in de bijbehorende browser:

1. Open de inspectiepagina van die browser voor extern debuggen.
2. Schakel extern debuggen in.
3. Houd de browser actief en keur de verbindingsprompt goed wanneer OpenClaw koppelt.

Gangbare inspectiepagina's:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live smoke-test voor koppeling:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Zo ziet succes eruit:

- `status` toont `driver: existing-session`
- `status` toont `transport: chrome-mcp`
- `status` toont `running: true`
- `tabs` vermeldt je al geopende browsertabbladen
- `snapshot` geeft refs terug uit het geselecteerde live tabblad

Wat je moet controleren als koppelen niet werkt:

- de doelbrowser op basis van Chromium heeft versie `144+`
- extern debuggen is ingeschakeld op de inspectiepagina van die browser
- de browser heeft de toestemmingsprompt voor koppeling getoond en je hebt die geaccepteerd
- `openclaw doctor` migreert oude extensiegebaseerde browserconfiguratie en controleert of
  Chrome lokaal is geïnstalleerd voor standaardprofielen met automatische verbinding, maar het kan
  browser-side extern debuggen niet voor je inschakelen

Agentgebruik:

- Gebruik `profile="user"` wanneer je de aangemelde browserstatus van de gebruiker nodig hebt.
- Als je een aangepast bestaande-sessieprofiel gebruikt, geef dan die expliciete profielnaam door.
- Kies deze modus alleen wanneer de gebruiker bij de computer is om de koppelingsprompt
  goed te keuren.
- de Gateway of Node-host kan `npx chrome-devtools-mcp@latest --autoConnect` starten

Opmerkingen:

- Dit pad heeft een hoger risico dan het geïsoleerde profiel `openclaw`, omdat het kan
  handelen binnen je aangemelde browsersessie.
- OpenClaw start de browser niet voor deze driver; het koppelt alleen.
- OpenClaw gebruikt hier de officiële Chrome DevTools MCP-`--autoConnect`-flow. Als
  `userDataDir` is ingesteld, wordt dit doorgegeven om die gebruikersdatamap te targeten.
- Bestaande sessie kan koppelen op de geselecteerde host of via een verbonden
  browser-Node. Als Chrome ergens anders draait en er geen browser-Node is verbonden, gebruik dan
  externe CDP of een Node-host.

### Aangepaste Chrome MCP-start

Overschrijf de gestarte Chrome DevTools MCP-server per profiel wanneer de standaard
`npx chrome-devtools-mcp@latest`-flow niet is wat je wilt (offline hosts,
vastgepinde versies, meegeleverde binaries):

| Veld         | Wat het doet                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Uitvoerbaar bestand om te starten in plaats van `npx`. Wordt ongewijzigd opgelost; absolute paden worden gerespecteerd.    |
| `mcpArgs`    | Argumentarray die letterlijk aan `mcpCommand` wordt doorgegeven. Vervangt de standaardargumenten `chrome-devtools-mcp@latest --autoConnect`. |

Wanneer `cdpUrl` is ingesteld op een bestaande-sessieprofiel, slaat OpenClaw
`--autoConnect` over en stuurt het eindpunt automatisch door naar Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (DevTools HTTP-discovery-eindpunt).
- `ws(s)://...` → `--wsEndpoint <url>` (directe CDP-WebSocket).

Eindpuntvlaggen en `userDataDir` kunnen niet worden gecombineerd: wanneer `cdpUrl` is ingesteld,
wordt `userDataDir` genegeerd voor het starten van Chrome MCP, omdat Chrome MCP koppelt aan
de actieve browser achter het eindpunt in plaats van een profielmap
te openen.

<Accordion title="Existing-session feature limitations">

Vergeleken met het beheerde profiel `openclaw` zijn bestaande-sessiedrivers beperkter:

- **Schermafbeeldingen** — pagina-opnames en `--ref`-elementopnames werken; CSS-`--element`-selectors niet. `--full-page` kan niet worden gecombineerd met `--ref` of `--element`. Playwright is niet vereist voor pagina- of ref-gebaseerde elementschermafbeeldingen.
- **Acties** — `click`, `type`, `hover`, `scrollIntoView`, `drag` en `select` vereisen snapshotrefs (geen CSS-selectors). `click-coords` klikt zichtbare viewportcoördinaten en vereist geen snapshotref. `click` gebruikt alleen de linkermuisknop. `type` ondersteunt `slowly=true` niet; gebruik `fill` of `press`. `press` ondersteunt `delayMs` niet. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` en `evaluate` ondersteunen geen time-outs per aanroep. `select` accepteert één waarde.
- **Wachten / uploaden / dialoogvenster** — `wait --url` ondersteunt exacte patronen, deeltekenreeksen en glob-patronen; `wait --load networkidle` wordt niet ondersteund. Uploadhooks vereisen `ref` of `inputRef`, één bestand tegelijk, geen CSS-`element`. Dialoogvensterhooks ondersteunen geen time-outoverschrijvingen.
- **Alleen beheerde functies** — batchacties, PDF-export, downloadonderschepping en `responsebody` vereisen nog steeds het beheerde browserpad.

</Accordion>

## Isolatiegaranties

- **Dedicated gebruikersdatamap**: raakt nooit je persoonlijke browserprofiel aan.
- **Dedicated poorten**: vermijdt `9222` om botsingen met ontwikkelworkflows te voorkomen.
- **Deterministische tabbladbediening**: `tabs` geeft eerst `suggestedTargetId` terug, daarna
  stabiele `tabId`-handles zoals `t1`, optionele labels en de ruwe `targetId`.
  Agents moeten `suggestedTargetId` hergebruiken; ruwe id's blijven beschikbaar voor
  debuggen en compatibiliteit.

## Browserselectie

Bij lokaal starten kiest OpenClaw de eerste beschikbare:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Je kunt dit overschrijven met `browser.executablePath`.

Platformen:

- macOS: controleert `/Applications` en `~/Applications`.
- Linux: controleert gangbare Chrome/Brave/Edge/Chromium-locaties onder `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` en
  `/usr/lib/chromium-browser`.
- Windows: controleert gangbare installatielocaties.

## Bedienings-API (optioneel)

Voor scripts en debuggen stelt de Gateway een kleine **alleen-via-loopback HTTP
bedienings-API** beschikbaar, plus een bijbehorende `openclaw browser`-CLI (snapshots, refs,
wait-power-ups, JSON-uitvoer, debugworkflows). Zie
[Browserbedienings-API](/nl/tools/browser-control) voor de volledige referentie.

## Probleemoplossing

Voor Linux-specifieke problemen (vooral snap Chromium), zie
[Browserprobleemoplossing](/nl/tools/browser-linux-troubleshooting).

Voor WSL2 Gateway + Windows Chrome split-host-opstellingen, zie
[Probleemoplossing voor WSL2 + Windows + externe Chrome CDP](/nl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-opstartfout versus navigatie-SSRF-blokkade

Dit zijn verschillende foutklassen en ze wijzen naar verschillende codepaden.

- **CDP-opstart- of gereedheidsfout** betekent dat OpenClaw niet kan bevestigen dat het besturingsvlak voor browserbediening gezond is.
- **Navigatie-SSRF-blokkade** betekent dat het besturingsvlak voor browserbediening gezond is, maar dat een doel voor paginanavigatie door beleid wordt geweigerd.

Veelvoorkomende voorbeelden:

- CDP-opstart- of gereedheidsfout:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` wanneer een
    loopback externe CDP-service is geconfigureerd zonder `attachOnly: true`
- Navigatie-SSRF-blokkade:
  - `open`-, `navigate`-, snapshot- of tabbladopeningsflows mislukken met een browser-/netwerkbeleidsfout terwijl `start` en `tabs` nog steeds werken

Gebruik deze minimale reeks om de twee te scheiden:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Zo lees je de resultaten:

- Als `start` mislukt met `not reachable after start`, los dan eerst CDP-gereedheid op.
- Als `start` slaagt maar `tabs` mislukt, is het besturingsvlak nog steeds ongezond. Behandel dit als een CDP-bereikbaarheidsprobleem, niet als een probleem met paginanavigatie.
- Als `start` en `tabs` slagen maar `open` of `navigate` mislukt, is het besturingsvlak van de browser actief en zit de fout in het navigatiebeleid of de doelpagina.
- Als `start`, `tabs` en `open` allemaal slagen, is het basispad voor beheerde browserbediening gezond.

Belangrijke gedragsdetails:

- Browserconfiguratie gebruikt standaard een fail-closed SSRF-beleidsobject, zelfs wanneer je `browser.ssrfPolicy` niet configureert.
- Voor het beheerde local loopback-profiel `openclaw` slaan CDP-healthchecks bewust de afdwinging van browser-SSRF-bereikbaarheid over voor OpenClaw's eigen lokale besturingsvlak.
- Navigatiebescherming staat los hiervan. Een succesvol `start`- of `tabs`-resultaat betekent niet dat een later `open`- of `navigate`-doel is toegestaan.

Beveiligingsrichtlijnen:

- Versoepel browser-SSRF-beleid standaard **niet**.
- Geef de voorkeur aan smalle hostuitzonderingen zoals `hostnameAllowlist` of `allowedHostnames` boven brede toegang tot privénetwerken.
- Gebruik `dangerouslyAllowPrivateNetwork: true` alleen in bewust vertrouwde omgevingen waar browsertoegang tot privénetwerken vereist en beoordeeld is.

## Agenttools + hoe bediening werkt

De agent krijgt **één tool** voor browserautomatisering:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Hoe dit wordt gemapt:

- `browser snapshot` retourneert een stabiele UI-boom (AI of ARIA).
- `browser act` gebruikt de snapshot-`ref`-ID's om te klikken/typen/slepen/selecteren.
- `browser screenshot` legt pixels vast (volledige pagina, element of gelabelde refs).
- `browser doctor` controleert of Gateway, Plugin, profiel, browser en tabblad gereed zijn.
- `browser` accepteert:
  - `profile` om een benoemd browserprofiel te kiezen (openclaw, chrome of externe CDP).
  - `target` (`sandbox` | `host` | `node`) om te selecteren waar de browser draait.
  - In sandboxsessies vereist `target: "host"` `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Als `target` wordt weggelaten: sandboxsessies gebruiken standaard `sandbox`, niet-sandboxsessies gebruiken standaard `host`.
  - Als een browsergeschikte node is verbonden, kan de tool er automatisch naartoe routeren, tenzij je `target="host"` of `target="node"` vastzet.

Dit houdt de agent deterministisch en voorkomt kwetsbare selectors.

## Gerelateerd

- [Tooloverzicht](/nl/tools) — alle beschikbare agenttools
- [Sandboxing](/nl/gateway/sandboxing) — browserbesturing in sandboxomgevingen
- [Beveiliging](/nl/gateway/security) — risico's en hardening van browserbesturing
