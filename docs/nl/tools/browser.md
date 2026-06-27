---
read_when:
    - Agentgestuurde browserautomatisering toevoegen
    - Debuggen waarom openclaw je eigen Chrome verstoort
    - Browserinstellingen + levenscyclus implementeren in de macOS-app
summary: Geïntegreerde browserbesturingsservice + actiecommando's
title: Browser (door OpenClaw beheerd)
x-i18n:
    generated_at: "2026-06-27T18:23:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw kan een **speciaal Chrome/Brave/Edge/Chromium-profiel** uitvoeren dat de agent beheert.
Het is geïsoleerd van je persoonlijke browser en wordt beheerd via een kleine lokale
besturingsservice binnen de Gateway (alleen loopback).

Beginnersweergave:

- Zie het als een **aparte browser, alleen voor de agent**.
- Het `openclaw`-profiel raakt je persoonlijke browserprofiel **niet** aan.
- De agent kan **tabbladen openen, pagina's lezen, klikken en typen** in een veilige baan.
- Het ingebouwde `user`-profiel koppelt aan je echte aangemelde Chrome-sessie via Chrome MCP.

## Wat je krijgt

- Een apart browserprofiel met de naam **openclaw** (standaard met oranje accent).
- Deterministische tabbladbesturing (weergeven/openen/focussen/sluiten).
- Agentacties (klikken/typen/slepen/selecteren), snapshots, schermafbeeldingen, PDF's.
- Een gebundelde `browser-automation`-Skill die agents de herstelcyclus voor snapshots,
  stabiele tabbladen, verlopen refs en handmatige blokkades leert wanneer de browser-
  Plugin is ingeschakeld.
- Optionele ondersteuning voor meerdere profielen (`openclaw`, `work`, `remote`, ...).

Deze browser is **niet** je dagelijkse browser. Het is een veilig, geïsoleerd oppervlak voor
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

Als je "Browser disabled" krijgt, schakel deze dan in de configuratie in (zie hieronder) en start de
Gateway opnieuw.

Als `openclaw browser` volledig ontbreekt, of als de agent zegt dat de browsertool
niet beschikbaar is, ga dan naar [Ontbrekende browseropdracht of -tool](/nl/tools/browser#missing-browser-command-or-tool).

## Pluginbeheer

De standaardtool `browser` is een gebundelde Plugin. Schakel deze uit om hem te vervangen door een andere Plugin die dezelfde toolnaam `browser` registreert:

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

Standaarden hebben zowel `plugins.entries.browser.enabled` **als** `browser.enabled=true` nodig. Alleen de Plugin uitschakelen verwijdert de `openclaw browser`-CLI, de Gateway-methode `browser.request`, de agenttool en de besturingsservice als één geheel; je `browser.*`-configuratie blijft intact voor een vervanging.

Wijzigingen in browserconfiguratie vereisen een herstart van de Gateway, zodat de Plugin zijn service opnieuw kan registreren.

## Agentrichtlijnen

Toolprofielnotitie: `tools.profile: "coding"` bevat `web_search` en
`web_fetch`, maar bevat niet de volledige `browser`-tool. Als de agent of een
gestarte subagent browserautomatisering moet gebruiken, voeg dan browser toe in de profielstap:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gebruik voor één agent `agents.list[].tools.alsoAllow: ["browser"]`.
Alleen `tools.subagents.tools.allow: ["browser"]` is niet genoeg, omdat subagentbeleid
wordt toegepast na profielfiltering.

De browser-Plugin levert twee niveaus van agentrichtlijnen:

- De beschrijving van de `browser`-tool bevat het compacte, altijd actieve contract: kies
  het juiste profiel, houd refs op hetzelfde tabblad, gebruik `tabId`/labels voor tabblad-
  targeting en laad de browser-Skill voor werk in meerdere stappen.
- De gebundelde `browser-automation`-Skill bevat de langere werklus:
  controleer eerst status/tabbladen, label taak-tabbladen, maak een snapshot voordat je handelt, maak opnieuw een snapshot
  na UI-wijzigingen, herstel verlopen refs één keer en rapporteer login/2FA/captcha- of
  camera-/microfoonblokkades als handmatige actie in plaats van te gokken.

Door Plugins gebundelde Skills worden vermeld in de beschikbare Skills van de agent wanneer de
Plugin is ingeschakeld. De volledige Skill-instructies worden op aanvraag geladen, zodat routinematige
beurten niet de volledige tokenkosten dragen.

## Ontbrekende browseropdracht of -tool

Als `openclaw browser` onbekend is na een upgrade, `browser.request` ontbreekt, of de agent meldt dat de browsertool niet beschikbaar is, is de gebruikelijke oorzaak een `plugins.allow`-lijst die `browser` weglaat en er geen root-`browser`-configuratieblok bestaat. Voeg het toe:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Een expliciet root-`browser`-blok, bijvoorbeeld `browser.enabled=true` of `browser.profiles.<name>`, activeert de gebundelde browser-Plugin zelfs onder een beperkende `plugins.allow`, in lijn met het gedrag van kanaalconfiguratie. `plugins.entries.browser.enabled=true` en `tools.alsoAllow: ["browser"]` vervangen allowlist-lidmaatschap op zichzelf niet. Het volledig verwijderen van `plugins.allow` herstelt ook de standaard.

## Profielen: `openclaw` versus `user`

- `openclaw`: beheerde, geïsoleerde browser (geen extensie vereist).
- `user`: ingebouwd Chrome MCP-koppelprofiel voor je **echte aangemelde Chrome**-
  sessie.

Voor browsertoolaanroepen van agents:

- Standaard: gebruik de geïsoleerde `openclaw`-browser.
- Geef de voorkeur aan `profile="user"` wanneer bestaande aangemelde sessies belangrijk zijn en de gebruiker
  bij de computer is om op een koppelprompt te klikken of deze goed te keuren.
- `profile` is de expliciete override wanneer je een specifieke browsermodus wilt.

Stel `browser.defaultProfile: "openclaw"` in als je beheerde modus standaard wilt gebruiken.

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

### Screenshot-vision (ondersteuning voor modellen met alleen tekst)

Wanneer het hoofdmodel alleen tekst ondersteunt (geen vision/multimodale ondersteuning), geven browser-
schermafbeeldingen afbeeldingsblokken terug die het model niet kan lezen. Browser-schermafbeeldingen
hergebruiken de bestaande configuratie voor afbeeldingsbegrip, zodat een afbeeldingsmodel
dat is geconfigureerd voor mediabegrip schermafbeeldingen als tekst kan beschrijven zonder
browserspecifieke modelinstellingen.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Hoe het werkt:**

1. Agent roept `browser screenshot` aan → afbeelding wordt zoals gewoonlijk naar schijf vastgelegd.
2. De browsertool vraagt de bestaande runtime voor afbeeldingsbegrip of deze
   de schermafbeelding kan beschrijven met geconfigureerde media-afbeeldingsmodellen, gedeelde media-
   modellen, standaardwaarden voor afbeeldingsmodellen of een door auth ondersteunde afbeeldingsprovider.
3. Het vision-model retourneert een tekstbeschrijving, die wordt verpakt met
   `wrapExternalContent` (promptinjectiebescherming) en wordt teruggegeven aan de agent
   als tekstblok in plaats van als afbeeldingsblok.
4. Als afbeeldingsbegrip niet beschikbaar is, wordt overgeslagen of mislukt, valt de browser
   terug op het oorspronkelijke afbeeldingsblok.

Gebruik de bestaande velden `tools.media.image` / `tools.media.models` voor model-
fallbacks, time-outs, bytelimieten, profielen en instellingen voor providerverzoeken.

Als het actieve hoofdmodel al vision ondersteunt en er geen expliciet model voor afbeeldingsbegrip
is geconfigureerd, behoudt OpenClaw het normale afbeeldingsresultaat zodat het
hoofdmodel de schermafbeelding direct kan lezen.

<AccordionGroup>

<Accordion title="Poorten en bereikbaarheid">

- De besturingsservice bindt aan loopback op een poort die is afgeleid van `gateway.port` (standaard `18791` = Gateway + 2). Het overschrijven van `gateway.port` of `OPENCLAW_GATEWAY_PORT` verschuift de afgeleide poorten binnen dezelfde familie.
- Lokale `openclaw`-profielen wijzen `cdpPort`/`cdpUrl` automatisch toe; stel die alleen in voor
  externe CDP-profielen of endpointkoppeling voor bestaande sessies. `cdpUrl` valt standaard terug op
  de beheerde lokale CDP-poort wanneer niet ingesteld.
- `remoteCdpTimeoutMs` geldt voor bereikbaarheidcontroles via externe en `attachOnly` CDP HTTP
  en HTTP-verzoeken voor het openen van tabbladen; `remoteCdpHandshakeTimeoutMs` geldt voor
  hun CDP WebSocket-handshakes.
- `localLaunchTimeoutMs` is het budget voor een lokaal gestart beheerd Chrome-
  proces om zijn CDP HTTP-endpoint beschikbaar te maken. `localCdpReadyTimeoutMs` is het
  vervolgbudget voor CDP-websocketgereedheid nadat het proces is ontdekt.
  Verhoog deze op Raspberry Pi, low-end VPS of oudere hardware waar Chromium
  langzaam start. Waarden moeten positieve gehele getallen tot `120000` ms zijn; ongeldige
  configuratiewaarden worden geweigerd.
- Herhaalde fouten bij het starten/gereedmaken van beheerde Chrome worden per
  profiel door een circuit breaker onderbroken. Na meerdere opeenvolgende fouten pauzeert OpenClaw nieuwe start-
  pogingen kort in plaats van Chromium te starten bij elke browsertoolaanroep. Los
  het opstartprobleem op, schakel de browser uit als deze niet nodig is, of start de
  Gateway opnieuw na reparatie.
- `actionTimeoutMs` is het standaardbudget voor browser-`act`-verzoeken wanneer de aanroeper geen `timeoutMs` doorgeeft. Het clienttransport voegt een klein spelingvenster toe, zodat lange wachttijden kunnen afronden in plaats van bij de HTTP-grens te verlopen.
- `tabCleanup` is best-effort opschoning voor tabbladen die zijn geopend door browsersessies van primaire agents. Subagent-, Cron- en ACP-levenscyclusopschoning sluit nog steeds hun expliciet bijgehouden tabbladen aan het einde van de sessie; primaire sessies houden actieve tabbladen herbruikbaar en sluiten vervolgens inactieve of overtollige bijgehouden tabbladen op de achtergrond.

</Accordion>

<Accordion title="SSRF-beleid">

- Browsernavigatie en open-tab zijn vóór navigatie SSRF-beveiligd en worden daarna op best-effort-basis opnieuw gecontroleerd op de uiteindelijke `http(s)`-URL.
- In strikte SSRF-modus worden externe CDP-endpointdetectie en `/json/version`-probes (`cdpUrl`) ook gecontroleerd.
- Gateway/provider-omgevingsvariabelen `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` en `NO_PROXY` proxyen de door OpenClaw beheerde browser niet automatisch. Beheerde Chrome start standaard direct, zodat providerproxy-instellingen de browser-SSRF-controles niet verzwakken.
- Door OpenClaw beheerde lokale CDP-gereedheidsprobes en DevTools WebSocket-verbindingen omzeilen de beheerde netwerkproxy voor het exacte gestarte loopback-endpoint, zodat `openclaw browser start` nog steeds werkt wanneer een operatorproxy loopback-uitgaand verkeer blokkeert.
- Om de beheerde browser zelf via een proxy te laten lopen, geef je expliciete Chrome-proxyvlaggen door via `browser.extraArgs`, zoals `--proxy-server=...` of `--proxy-pac-url=...`. Strikte SSRF-modus blokkeert expliciete browserproxyrouting tenzij browsertoegang tot privé-netwerken bewust is ingeschakeld.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` staat standaard uit; schakel dit alleen in wanneer browsertoegang tot privé-netwerken bewust wordt vertrouwd.
- `browser.ssrfPolicy.allowPrivateNetwork` blijft ondersteund als legacy-alias.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` betekent dat er nooit een lokale browser wordt gestart; er wordt alleen gekoppeld als er al een draait.
- `headless` kan globaal of per lokaal beheerd profiel worden ingesteld. Waarden per profiel overschrijven `browser.headless`, zodat één lokaal gestart profiel headless kan blijven terwijl een ander zichtbaar blijft.
- `POST /start?headless=true` en `openclaw browser start --headless` vragen een
  eenmalige headless-start aan voor lokaal beheerde profielen zonder
  `browser.headless` of profielconfiguratie te herschrijven. Profielen voor bestaande sessies, attach-only-profielen en
  externe CDP-profielen weigeren de overschrijving omdat OpenClaw die
  browserprocessen niet start.
- Op Linux-hosts zonder `DISPLAY` of `WAYLAND_DISPLAY` gaan lokaal beheerde profielen
  automatisch standaard naar headless wanneer noch de omgeving noch profiel-/globale
  configuratie expliciet de headed-modus kiest. `openclaw browser status --json`
  rapporteert `headlessSource` als `env`, `profile`, `config`,
  `request`, `linux-display-fallback` of `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` forceert lokaal beheerde starts headless voor het
  huidige proces. `OPENCLAW_BROWSER_HEADLESS=0` forceert headed-modus voor gewone
  starts en retourneert een uitvoerbare fout op Linux-hosts zonder displayserver;
  een expliciet `start --headless`-verzoek wint nog steeds voor die ene start.
- `executablePath` kan globaal of per lokaal beheerd profiel worden ingesteld. Waarden per profiel overschrijven `browser.executablePath`, zodat verschillende beheerde profielen verschillende Chromium-gebaseerde browsers kunnen starten. Beide vormen accepteren `~` voor de homedirectory van je besturingssysteem.
- `color` (top-level en per profiel) kleurt de browserinterface zodat je kunt zien welk profiel actief is.
- Het standaardprofiel is `openclaw` (beheerd standalone). Gebruik `defaultProfile: "user"` om te kiezen voor de ingelogde gebruikersbrowser.
- Volgorde voor autodetectie: systeemstandaardbrowser als die Chromium-gebaseerd is; anders Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` gebruikt Chrome DevTools MCP in plaats van raw CDP. Het kan koppelen via Chrome MCP-auto-connect, of via `cdpUrl` wanneer je al een DevTools-endpoint voor de draaiende browser hebt.
- Stel `browser.profiles.<name>.userDataDir` in wanneer een bestaand-sessieprofiel moet koppelen aan een niet-standaard Chromium-gebruikersprofiel (Brave, Edge, enz.). Dit pad accepteert ook `~` voor de homedirectory van je besturingssysteem.

</Accordion>

</AccordionGroup>

## Brave of een andere Chromium-gebaseerde browser gebruiken

Als je **systeemstandaardbrowser** Chromium-gebaseerd is (Chrome/Brave/Edge/enz.),
gebruikt OpenClaw die automatisch. Stel `browser.executablePath` in om
autodetectie te overschrijven. Top-level en per-profiel `executablePath`-waarden accepteren `~`
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

Per-profiel `executablePath` beïnvloedt alleen lokaal beheerde profielen die OpenClaw
start. `existing-session`-profielen koppelen in plaats daarvan aan een al draaiende browser,
en externe CDP-profielen gebruiken de browser achter `cdpUrl`.

## Lokale versus externe bediening

- **Lokale bediening (standaard):** de Gateway start de loopback-besturingsservice en kan een lokale browser starten.
- **Externe bediening (Node-host):** draai een Node-host op de machine waarop de browser staat; de Gateway proxyt browseracties ernaartoe.
- **Externe CDP:** stel `browser.profiles.<name>.cdpUrl` (of `browser.cdpUrl`) in om
  aan een externe Chromium-gebaseerde browser te koppelen. In dit geval start OpenClaw geen lokale browser.
- Voor extern beheerde CDP-services op loopback (bijvoorbeeld Browserless in
  Docker gepubliceerd naar `127.0.0.1`) stel je ook `attachOnly: true` in. Loopback-CDP
  zonder `attachOnly` wordt behandeld als een lokaal door OpenClaw beheerd browserprofiel.
- `headless` beïnvloedt alleen lokaal beheerde profielen die OpenClaw start. Het herstart of wijzigt bestaande-sessie- of externe CDP-browsers niet.
- `executablePath` volgt dezelfde regel voor lokaal beheerde profielen. Als je dit wijzigt op een
  draaiend lokaal beheerd profiel, wordt dat profiel gemarkeerd voor herstart/reconcile zodat de
  volgende start de nieuwe binary gebruikt.

Stopgedrag verschilt per profielmodus:

- lokaal beheerde profielen: `openclaw browser stop` stopt het browserproces dat
  OpenClaw heeft gestart
- attach-only- en externe CDP-profielen: `openclaw browser stop` sluit de actieve
  besturingssessie en geeft Playwright/CDP-emulatie-overschrijvingen vrij (viewport,
  kleurenschema, locale, tijdzone, offline-modus en vergelijkbare status), ook
  al is er geen browserproces door OpenClaw gestart

Externe CDP-URL's kunnen auth bevatten:

- Querytokens (bijv. `https://provider.example?token=<token>`)
- HTTP Basic-auth (bijv. `https://user:pass@provider.example`)

OpenClaw behoudt de auth bij het aanroepen van `/json/*`-endpoints en bij het verbinden
met de CDP WebSocket. Geef de voorkeur aan omgevingsvariabelen of secretsmanagers voor
tokens in plaats van ze in configuratiebestanden te committen.

## Node-browserproxy (zero-config standaard)

Als je een **Node-host** draait op de machine waarop je browser staat, kan OpenClaw
browsertoolcalls automatisch naar die Node routeren zonder extra browserconfiguratie.
Dit is het standaardpad voor externe Gateways.

Opmerkingen:

- De Node-host stelt zijn lokale browserbesturingsserver beschikbaar via een **proxyopdracht**.
- Profielen komen uit de eigen `browser.profiles`-configuratie van de Node (hetzelfde als lokaal).
- `nodeHost.browserProxy.allowProfiles` is optioneel. Laat dit leeg voor het legacy-/standaardgedrag: alle geconfigureerde profielen blijven bereikbaar via de proxy, inclusief routes voor het maken/verwijderen van profielen.
- Als je `nodeHost.browserProxy.allowProfiles` instelt, behandelt OpenClaw dit als een least-privilege-grens: alleen allowlisted profielen kunnen worden getarget, en persistente routes voor profiel maken/verwijderen worden op het proxyoppervlak geblokkeerd.
- Schakel dit uit als je het niet wilt:
  - Op de Node: `nodeHost.browserProxy.enabled=false`
  - Op de gateway: `gateway.nodes.browser.mode="off"`

## Browserless (gehoste externe CDP)

[Browserless](https://browserless.io) is een gehoste Chromium-service die
CDP-verbindings-URL's aanbiedt via HTTPS en WebSocket. OpenClaw kan beide vormen gebruiken, maar
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
- Als Browserless je een HTTPS-basis-URL geeft, kun je die omzetten naar
  `wss://` voor een directe CDP-verbinding of de HTTPS-URL behouden en OpenClaw
  `/json/version` laten ontdekken.

### Browserless Docker op dezelfde host

Wanneer Browserless self-hosted is in Docker en OpenClaw op de host draait, behandel je
Browserless als een extern beheerde CDP-service:

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
stel Browserless `EXTERNAL` in op dezelfde public-to-OpenClaw WebSocket-basis, zoals
`ws://127.0.0.1:3000`, `ws://browserless:3000` of een stabiel privé-Docker-
netwerkadres. Als `/json/version` een `webSocketDebuggerUrl` retourneert die wijst naar
een adres dat OpenClaw niet kan bereiken, kan CDP HTTP gezond lijken terwijl het koppelen via WebSocket
nog steeds mislukt.

Laat `attachOnly` niet unset voor een loopback-Browserless-profiel. Zonder
`attachOnly` behandelt OpenClaw de loopback-poort als een lokaal beheerd browserprofiel
en kan het rapporteren dat de poort in gebruik is maar niet eigendom is van OpenClaw.

## Directe WebSocket-CDP-providers

Sommige gehoste browserservices bieden een **direct WebSocket**-endpoint in plaats van
de standaard HTTP-gebaseerde CDP-detectie (`/json/version`). OpenClaw accepteert drie
CDP-URL-vormen en kiest automatisch de juiste verbindingsstrategie:

- **HTTP(S)-detectie** - `http://host[:port]` of `https://host[:port]`.
  OpenClaw roept `/json/version` aan om de WebSocket-debugger-URL te ontdekken en maakt daarna
  verbinding. Geen WebSocket-fallback.
- **Directe WebSocket-endpoints** - `ws://host[:port]/devtools/<kind>/<id>` of
  `wss://...` met een `/devtools/browser|page|worker|shared_worker|service_worker/<id>`-
  pad. OpenClaw maakt direct verbinding via een WebSocket-handshake en slaat
  `/json/version` volledig over.
- **Kale WebSocket-roots** - `ws://host[:port]` of `wss://host[:port]` zonder
  `/devtools/...`-pad (bijv. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw probeert eerst HTTP-
  `/json/version`-detectie (waarbij het schema wordt genormaliseerd naar `http`/`https`);
  als detectie een `webSocketDebuggerUrl` retourneert, wordt die gebruikt, anders valt OpenClaw
  terug op een directe WebSocket-handshake op de kale root. Als het geadverteerde
  WebSocket-endpoint de CDP-handshake weigert maar de geconfigureerde kale root
  die accepteert, valt OpenClaw ook terug op die root. Hierdoor kan een kale `ws://`
  die naar een lokale Chrome wijst nog steeds verbinden, omdat Chrome alleen WebSocket-
  upgrades accepteert op het specifieke per-target-pad uit `/json/version`, terwijl gehoste
  providers nog steeds hun root-WebSocket-endpoint kunnen gebruiken wanneer hun detectie-
  endpoint een kortlevende URL adverteert die niet geschikt is voor Playwright CDP.

`openclaw browser doctor` gebruikt dezelfde detection-first, WebSocket-fallback-
logica als runtime-koppeling, zodat een kale-root-URL die succesvol verbindt niet
als onbereikbaar wordt gerapporteerd door diagnostiek.

### Browserbase

[Browserbase](https://www.browserbase.com) is een cloudplatform voor het draaien van
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
  uit het [Overview dashboard](https://www.browserbase.com/overview).
- Vervang `<BROWSERBASE_API_KEY>` door je echte Browserbase-API-sleutel.
- Browserbase maakt automatisch een browsersessie aan bij WebSocket-verbinding, dus er is geen
  handmatige stap voor sessieaanmaak nodig.
- De gratis laag staat één gelijktijdige sessie en één browseruur per maand toe.
  Zie [prijzen](https://www.browserbase.com/pricing) voor limieten van betaalde abonnementen.
- Zie de [Browserbase-documentatie](https://docs.browserbase.com) voor de volledige API-
  referentie, SDK-handleidingen en integratievoorbeelden.

### Notte

[Notte](https://www.notte.cc) is een cloudplatform voor het uitvoeren van headless
browsers met ingebouwde stealth, residentiële proxy's en een CDP-native
WebSocket-Gateway.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

Opmerkingen:

- [Meld je aan](https://console.notte.cc) en kopieer je **API Key** van de
  instellingenpagina van de console.
- Vervang `<NOTTE_API_KEY>` door je echte Notte-API-sleutel.
- Notte maakt automatisch een browsersessie aan bij WebSocket-verbinding, dus er is geen handmatige
  stap voor sessieaanmaak nodig. De sessie wordt vernietigd wanneer de
  WebSocket de verbinding verbreekt.
- De gratis laag staat vijf gelijktijdige sessies en 100 browseruren gedurende de hele looptijd toe.
  Zie [prijzen](https://www.notte.cc/#pricing) voor limieten van betaalde abonnementen.
- Zie de [Notte-documentatie](https://docs.notte.cc) voor de volledige API-referentie, SDK-
  handleidingen en integratievoorbeelden.

## Beveiliging

Kernideeën:

- Browserbesturing is alleen loopback; toegang loopt via de auth van de Gateway of node-koppeling.
- De zelfstandige loopback-browser-HTTP-API gebruikt **alleen auth met gedeeld geheim**:
  gateway-token bearer-auth, `x-openclaw-password`, of HTTP Basic auth met het
  geconfigureerde gatewaywachtwoord.
- Tailscale Serve-identiteitsheaders en `gateway.auth.mode: "trusted-proxy"` verifiëren
  **niet** deze zelfstandige loopback-browser-API.
- Als browserbesturing is ingeschakeld en er geen auth met gedeeld geheim is geconfigureerd, genereert OpenClaw
  een runtime-only gatewaytoken voor die opstart. Configureer
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, of
  `OPENCLAW_GATEWAY_PASSWORD` expliciet als clients een stabiel geheim over
  herstarts heen nodig hebben.
- OpenClaw genereert dat token **niet** automatisch wanneer `gateway.auth.mode` al
  `password`, `none`, of `trusted-proxy` is.
- Houd de Gateway en eventuele node-hosts op een privénetwerk (Tailscale); vermijd publieke blootstelling.
- Behandel externe CDP-URL's/tokens als geheimen; geef de voorkeur aan env vars of een secretsmanager.

Tips voor externe CDP:

- Geef waar mogelijk de voorkeur aan versleutelde eindpunten (HTTPS of WSS) en kortlevende tokens.
- Vermijd het direct insluiten van langlevende tokens in configuratiebestanden.

## Profielen (multi-browser)

OpenClaw ondersteunt meerdere benoemde profielen (routeringsconfiguraties). Profielen kunnen zijn:

- **openclaw-managed**: een toegewezen Chromium-gebaseerde browserinstantie met een eigen gebruikersdatamap + CDP-poort
- **remote**: een expliciete CDP-URL (Chromium-gebaseerde browser die elders draait)
- **existing session**: je bestaande Chrome-profiel via automatische verbinding met Chrome DevTools MCP

Standaarden:

- Het `openclaw`-profiel wordt automatisch aangemaakt als het ontbreekt.
- Het `user`-profiel is ingebouwd voor koppelen aan een bestaande sessie met Chrome MCP.
- Bestaande-sessieprofielen zijn opt-in buiten `user`; maak ze aan met `--driver existing-session`.
- Lokale CDP-poorten worden standaard toegewezen uit **18800-18899**.
- Het verwijderen van een profiel verplaatst de lokale datamap naar de prullenbak.

Alle besturingseindpunten accepteren `?profile=<name>`; de CLI gebruikt `--browser-profile`.

## Bestaande sessie via Chrome DevTools MCP

OpenClaw kan ook koppelen aan een actief Chromium-gebaseerd browserprofiel via de
officiële Chrome DevTools MCP-server. Dit hergebruikt de tabbladen en aanmeldstatus
die al in dat browserprofiel open zijn.

Officiële achtergrond- en installatiereferenties:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Ingebouwd profiel:

- `user`

Optioneel: maak je eigen aangepaste bestaande-sessieprofiel als je een
andere naam, kleur of browserdatamap wilt.

Standaardgedrag:

- Het ingebouwde `user`-profiel gebruikt automatische verbinding met Chrome MCP, die zich richt op het
  standaard lokale Google Chrome-profiel.

Gebruik `userDataDir` voor Brave, Edge, Chromium, of een niet-standaard Chrome-profiel.
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

Daarna in de overeenkomende browser:

1. Open de inspectiepagina van die browser voor extern debuggen.
2. Schakel extern debuggen in.
3. Laat de browser actief en keur de verbindingsprompt goed wanneer OpenClaw koppelt.

Veelgebruikte inspectiepagina's:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live-koppelingsrooktest:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Hoe succes eruitziet:

- `status` toont `driver: existing-session`
- `status` toont `transport: chrome-mcp`
- `status` toont `running: true`
- `tabs` vermeldt je al geopende browsertabbladen
- `snapshot` retourneert refs uit het geselecteerde live-tabblad

Wat je moet controleren als koppelen niet werkt:

- de doelbrowser op Chromium-basis is versie `144+`
- extern debuggen is ingeschakeld op de inspectiepagina van die browser
- de browser heeft de toestemmingsprompt voor koppelen getoond en je hebt die geaccepteerd
- als Chrome is gestart met een expliciete `--remote-debugging-port`, stel dan
  `browser.profiles.<name>.cdpUrl` in op dat DevTools-eindpunt in plaats van te vertrouwen
  op automatische verbinding met Chrome MCP
- `openclaw doctor` migreert oude extensiegebaseerde browserconfiguratie en controleert of
  Chrome lokaal is geïnstalleerd voor standaardprofielen met automatische verbinding, maar kan
  extern debuggen aan browserzijde niet voor je inschakelen

Agentgebruik:

- Gebruik `profile="user"` wanneer je de aangemelde browserstatus van de gebruiker nodig hebt.
- Als je een aangepast bestaande-sessieprofiel gebruikt, geef dan die expliciete profielnaam door.
- Kies deze modus alleen wanneer de gebruiker bij de computer is om de koppelingsprompt
  goed te keuren.
- de Gateway of node-host kan `npx chrome-devtools-mcp@latest --autoConnect` starten

Opmerkingen:

- Dit pad heeft een hoger risico dan het geïsoleerde `openclaw`-profiel, omdat het
  in je aangemelde browsersessie kan handelen.
- OpenClaw start de browser niet voor deze driver; het koppelt alleen.
- OpenClaw gebruikt hier de officiële Chrome DevTools MCP `--autoConnect`-flow. Als
  `userDataDir` is ingesteld, wordt die doorgegeven om die gebruikersdatamap te richten.
- Bestaande-sessie kan koppelen op de geselecteerde host of via een verbonden
  browsernode. Als Chrome elders staat en er geen browsernode is verbonden, gebruik dan
  externe CDP of een node-host.

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

<Accordion title="Functiebeperkingen van bestaande sessies">

Vergeleken met het beheerde `openclaw`-profiel zijn bestaande-sessiedrivers beperkter:

- **Schermafbeeldingen** - pagina-opnames en `--ref`-elementopnames werken; CSS `--element`-selectors niet. `--full-page` kan niet combineren met `--ref` of `--element`. Playwright is niet vereist voor pagina- of ref-gebaseerde element-schermafbeeldingen.
- **Acties** - `click`, `type`, `hover`, `scrollIntoView`, `drag`, en `select` vereisen snapshot-refs (geen CSS-selectors). `click-coords` klikt op zichtbare viewportcoördinaten en vereist geen snapshot-ref. `click` is alleen linkermuisknop. `type` ondersteunt `slowly=true` niet; gebruik `fill` of `press`. `press` ondersteunt `delayMs` niet. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, en `evaluate` ondersteunen geen time-outs per aanroep. `select` accepteert één waarde.
- **Wachten / uploaden / dialoog** - `wait --url` ondersteunt exacte, substring- en glob-patronen; `wait --load networkidle` wordt niet ondersteund op bestaande-sessieprofielen (het werkt op beheerde en raw/externe CDP-profielen). Uploadhooks vereisen `ref` of `inputRef`, één bestand tegelijk, geen CSS `element`. Dialooghooks ondersteunen geen time-outoverschrijvingen of `dialogId`.
- **Dialoogzichtbaarheid** - Antwoorden van beheerde browseracties bevatten `blockedByDialog` en `browserState.dialogs.pending` wanneer een actie een modaal dialoogvenster opent; snapshots bevatten ook de status van openstaande dialogen. Reageer met `browser dialog --accept/--dismiss --dialog-id <id>` terwijl een dialoog openstaat. Dialogen die buiten OpenClaw worden afgehandeld, verschijnen onder `browserState.dialogs.recent`.
- **Alleen-beheerde functies** - batchacties, PDF-export, downloadonderschepping en `responsebody` vereisen nog steeds het beheerde browserpad.

</Accordion>

## Isolatiegaranties

- **Toegewezen gebruikersdatamap**: raakt nooit je persoonlijke browserprofiel aan.
- **Toegewezen poorten**: vermijdt `9222` om botsingen met ontwikkelworkflows te voorkomen.
- **Deterministische tabbladbesturing**: `tabs` retourneert eerst `suggestedTargetId`, daarna
  stabiele `tabId`-handles zoals `t1`, optionele labels en de raw `targetId`.
  Agents moeten `suggestedTargetId` hergebruiken; raw ids blijven beschikbaar voor
  debuggen en compatibiliteit.

## Browserselectie

Bij lokaal starten kiest OpenClaw de eerste beschikbare:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Je kunt overschrijven met `browser.executablePath`.

Platformen:

- macOS: controleert `/Applications` en `~/Applications`.
- Linux: controleert veelgebruikte Chrome/Brave/Edge/Chromium-locaties onder `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, en
  `/usr/lib/chromium-browser`, plus door Playwright beheerde Chromium onder
  `PLAYWRIGHT_BROWSERS_PATH` of `~/.cache/ms-playwright`.
- Windows: controleert veelgebruikte installatielocaties.

## Besturings-API (optioneel)

Voor scripting en debuggen stelt de Gateway een kleine **alleen-loopback HTTP-
besturings-API** beschikbaar plus een overeenkomende `openclaw browser` CLI (snapshots, refs, wait-
power-ups, JSON-uitvoer, debugworkflows). Zie
[Browserbesturings-API](/nl/tools/browser-control) voor de volledige referentie.

## Probleemoplossing

Voor Linux-specifieke problemen (vooral snap Chromium), zie
[Browserprobleemoplossing](/nl/tools/browser-linux-troubleshooting).

Voor WSL2 Gateway + Windows Chrome split-host-setups, zie
[Probleemoplossing voor WSL2 + Windows + remote Chrome CDP](/nl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-opstartfout versus SSRF-blokkade bij navigatie

Dit zijn verschillende foutklassen en ze wijzen naar verschillende codepaden.

- **CDP-opstart- of gereedheidsfout** betekent dat OpenClaw niet kan bevestigen dat het browserbesturingsvlak gezond is.
- **SSRF-blokkade bij navigatie** betekent dat het browserbesturingsvlak gezond is, maar dat een paginanavigatiedoel door beleid wordt geweigerd.

Veelvoorkomende voorbeelden:

- CDP-opstart- of gereedheidsfout:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` wanneer een
    local loopback externe CDP-service is geconfigureerd zonder `attachOnly: true`
- SSRF-blokkade bij navigatie:
  - `open`-, `navigate`-, snapshot- of tab-openingsstromen mislukken met een browser-/netwerkbeleidsfout terwijl `start` en `tabs` nog steeds werken

Gebruik deze minimale reeks om de twee te onderscheiden:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Zo lees je de resultaten:

- Als `start` mislukt met `not reachable after start`, los dan eerst de CDP-gereedheid op.
- Als `start` slaagt maar `tabs` mislukt, is het besturingsvlak nog steeds ongezond. Behandel dit als een CDP-bereikbaarheidsprobleem, niet als een paginanavigatieprobleem.
- Als `start` en `tabs` slagen maar `open` of `navigate` mislukt, is het browserbesturingsvlak actief en zit de fout in het navigatiebeleid of de doelpagina.
- Als `start`, `tabs` en `open` allemaal slagen, is het basisbesturingspad voor de beheerde browser gezond.

Belangrijke gedragsdetails:

- Browserconfiguratie gebruikt standaard een fail-closed SSRF-beleidsobject, zelfs wanneer je `browser.ssrfPolicy` niet configureert.
- Voor het door OpenClaw beheerde local loopback-profiel `openclaw` slaan CDP-gezondheidscontroles bewust de handhaving van browser-SSRF-bereikbaarheid over voor OpenClaw's eigen lokale besturingsvlak.
- Navigatiebescherming staat los hiervan. Een geslaagd `start`- of `tabs`-resultaat betekent niet dat een later `open`- of `navigate`-doel is toegestaan.

Beveiligingsrichtlijnen:

- Versoepel het browser-SSRF-beleid **niet** standaard.
- Geef de voorkeur aan smalle hostuitzonderingen zoals `hostnameAllowlist` of `allowedHostnames` boven brede toegang tot privénetwerken.
- Gebruik `dangerouslyAllowPrivateNetwork: true` alleen in bewust vertrouwde omgevingen waar browsertoegang tot privénetwerken vereist en beoordeeld is.

## Agenttools + hoe besturing werkt

De agent krijgt **één tool** voor browserautomatisering:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Hoe dit wordt gekoppeld:

- `browser snapshot` retourneert een stabiele UI-boom (AI of ARIA).
- `browser act` gebruikt de snapshot-`ref`-ID's om te klikken/typen/slepen/selecteren.
- `browser screenshot` legt pixels vast (volledige pagina, element of gelabelde refs).
- `browser doctor` controleert de gereedheid van Gateway, Plugin, profiel, browser en tabblad.
- `browser` accepteert:
  - `profile` om een benoemd browserprofiel te kiezen (openclaw, chrome of remote CDP).
  - `target` (`sandbox` | `host` | `node`) om te selecteren waar de browser draait.
  - In gesandboxte sessies vereist `target: "host"` `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Als `target` wordt weggelaten: gesandboxte sessies gebruiken standaard `sandbox`, niet-gesandboxte sessies gebruiken standaard `host`.
  - Als een node met browsermogelijkheden is verbonden, kan de tool er automatisch naartoe routeren, tenzij je `target="host"` of `target="node"` vastzet.

Dit houdt de agent deterministisch en voorkomt kwetsbare selectors.

## Gerelateerd

- [Toolsoverzicht](/nl/tools) - alle beschikbare agenttools
- [Sandboxing](/nl/gateway/sandboxing) - browserbesturing in gesandboxte omgevingen
- [Beveiliging](/nl/gateway/security) - risico's en hardening voor browserbesturing
