---
read_when:
    - Browserautomatisering toevoegen die door agents wordt aangestuurd
    - Foutopsporing waarom OpenClaw je eigen Chrome verstoort
    - Browserinstellingen + levenscyclus implementeren in de macOS-app
summary: Geïntegreerde browserbesturingsservice + actieopdrachten
title: Browser (beheerd door OpenClaw)
x-i18n:
    generated_at: "2026-07-16T16:30:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cf43bd54994d29d48cfc1e16889ec34af83e885c1dd1b63c287f0df116c7f0bf
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw kan een **speciaal Chrome/Brave/Edge/Chromium-profiel** uitvoeren dat door de agent wordt bestuurd. Het werkt via een kleine lokale besturingsservice binnen de Gateway (alleen loopback) en is geïsoleerd van je persoonlijke browser.

- Zie het als een **afzonderlijke browser uitsluitend voor de agent**. Het `openclaw`-profiel raakt je persoonlijke browserprofiel nooit.
- De agent opent tabbladen, leest pagina's, klikt en typt binnen deze geïsoleerde omgeving.
- Het ingebouwde `user`-profiel maakt in plaats daarvan via Chrome DevTools MCP verbinding met je echte, aangemelde Chrome-sessie.

## Wat je krijgt

- Een afzonderlijk browserprofiel met de naam **openclaw** (standaard met een oranje accent).
- Deterministische bediening van tabbladen (weergeven/openen/focussen/sluiten).
- Agentacties (klikken/typen/slepen/selecteren), momentopnamen, schermafbeeldingen en pdf's.
- Door Playwright ondersteunde profielen slaan directe navigaties naar bijlagen op in de map voor beheerde downloads en retourneren na validatie van het beleid voor de uiteindelijke URL `{ url, suggestedFilename, path }`-metagegevens.
- Door Playwright ondersteunde agentacties retourneren een `downloads`-array met dezelfde beheerde metagegevens wanneer de actie onmiddellijk een of meer downloads start.
- Een meegeleverde `browser-automation`-skill die agents de herstellus voor momentopnamen,
  stabiele tabbladen, verouderde verwijzingen en handmatige blokkades leert wanneer de browser-
  plugin is ingeschakeld.
- Optionele ondersteuning voor meerdere profielen (`openclaw`, `work`, `remote`, ...).

Deze browser is **niet** je dagelijkse browser. Het is een veilig, geïsoleerd oppervlak voor
automatisering en verificatie door agents.

Op macOS kun je cookies expliciet vanuit een systeemprofiel van de Chrome-familie naar een afzonderlijk beheerd profiel kopiëren. De beheerde browser gebruikt nog steeds een eigen map voor gebruikersgegevens; alleen de geselecteerde cookies worden gekopieerd en lokale opslag en IndexedDB blijven achter. Zie [Profielen](#profiles-multi-browser) of de [CLI-referentie voor `openclaw browser`](/nl/cli/browser) voor importopdrachten en beperkingen.

## Snel aan de slag

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

'Browser disabled' betekent dat de plugin of `browser.enabled` is uitgeschakeld; zie
[Configuratie](#configuration) en [Pluginbeheer](#plugin-control).

Als `openclaw browser` volledig ontbreekt of de agent zegt dat de browsertool
niet beschikbaar is, ga dan naar [Ontbrekende browseropdracht of -tool](#missing-browser-command-or-tool).

## Pluginbeheer

De standaardtool `browser` is een meegeleverde plugin. Schakel deze uit om hem te vervangen door een andere plugin die dezelfde toolnaam `browser` registreert:

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

Voor de standaardinstellingen zijn zowel `plugins.entries.browser.enabled` **als** `browser.enabled=true` nodig. Als alleen de plugin wordt uitgeschakeld, worden de CLI `openclaw browser`, de gatewaymethode `browser.request`, de agenttool en de besturingsservice als één geheel verwijderd; je `browser.*`-configuratie blijft intact voor een vervanging.

Voor wijzigingen in de browserconfiguratie moet de Gateway opnieuw worden gestart, zodat de plugin zijn service opnieuw kan registreren.

## Richtlijnen voor agents

Opmerking over toolprofielen: `tools.profile: "coding"` bevat `web_search` en
`web_fetch`, maar niet de volledige tool `browser`. Om de agent of een
gestarte subagent browserautomatisering te laten gebruiken, voeg je browser toe tijdens de
profielfase:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gebruik voor één agent `agents.list[].tools.alsoAllow: ["browser"]`.
Alleen `tools.subagents.tools.allow: ["browser"]` is niet voldoende, omdat het beleid voor subagents
na de profielfiltering wordt toegepast.

De browserplugin levert twee niveaus met richtlijnen voor agents:

- De toolbeschrijving van `browser` bevat het compacte, altijd actieve contract: kies
  het juiste profiel, houd verwijzingen op hetzelfde tabblad, gebruik `tabId`/labels om
  tabbladen te selecteren en laad de browserskill voor werk met meerdere stappen.
- De meegeleverde skill `browser-automation` bevat de uitgebreidere werklus:
  controleer eerst de status/tabbladen, label taakgerelateerde tabbladen, maak vóór handelingen een momentopname, maak
  na wijzigingen in de gebruikersinterface opnieuw een momentopname, herstel verouderde verwijzingen één keer en meld blokkades door aanmelding/2FA/captcha of
  camera/microfoon als een handmatige actie in plaats van te gokken.

Door plugins meegeleverde skills worden vermeld bij de beschikbare skills van de agent wanneer de
plugin is ingeschakeld. De volledige skill-instructies worden op aanvraag geladen, zodat routinematige
beurten niet de volledige tokenkosten met zich meebrengen.

## Ontbrekende browseropdracht of -tool

Als `openclaw browser` na een upgrade onbekend is, `browser.request` ontbreekt of de agent meldt dat de browsertool niet beschikbaar is, is de gebruikelijke oorzaak een `plugins.allow`-lijst waarin `browser` ontbreekt en er geen `browser`-configuratieblok op rootniveau bestaat. Voeg dit toe:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Een expliciet `browser`-blok op rootniveau (een willekeurige sleutel onder `browser`, zoals
`browser.enabled=true` of `browser.profiles.<name>`) activeert de meegeleverde
browserplugin zelfs bij een beperkende `plugins.allow`, overeenkomstig het gedrag van de configuratie
voor meegeleverde kanalen. `plugins.entries.browser.enabled=true` en
`tools.alsoAllow: ["browser"]` vervangen op zichzelf het lidmaatschap van de toelatingslijst niet.
Door `plugins.allow` volledig te verwijderen, wordt ook de standaardinstelling hersteld.

## Profielen: `openclaw`, `user`, `chrome`

- `openclaw`: beheerde, geïsoleerde browser (geen extensie vereist).
- `user`: ingebouwd Chrome DevTools MCP-koppelprofiel voor je **echte
  aangemelde Chrome**-sessie. Chrome toont de eerste keer dat OpenClaw verbinding maakt een blokkerende prompt 'Allow remote debugging?',
  dus er moet iemand bij de computer aanwezig zijn.
- `chrome`: ingebouwd [Chrome-extensie](/nl/tools/chrome-extension)-profiel voor
  je **echte aangemelde Chrome**-sessie. Werkt vanaf een telefoon zonder dat er iemand achter het
  bureau zit, omdat tabbladen via de OpenClaw-browserextensie worden bestuurd in plaats van via
  de poort voor foutopsporing op afstand, zodat er geen prompt 'Allow remote debugging?' verschijnt.

Voor aanroepen van de browsertool door agents:

- Standaard: gebruik de geïsoleerde `openclaw`-browser.
- Geef de voorkeur aan `profile="chrome"` (extensie) wanneer bestaande aangemelde sessies belangrijk zijn
  en de gebruiker **niet achter de computer zit** (Telegram, WhatsApp enzovoort).
- Geef de voorkeur aan `profile="user"` (Chrome MCP) wanneer bestaande aangemelde sessies belangrijk zijn
  en de gebruiker **achter de computer zit** om de koppelprompt goed te keuren.
- `profile` is de expliciete overschrijving wanneer je een specifieke browsermodus wilt.

Stel `browser.defaultProfile: "openclaw"` in als je standaard de beheerde modus wilt gebruiken.

## Configuratie

Browserinstellingen staan in `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // standaard: true
    evaluateEnabled: true, // standaard: true; false schakelt act:evaluate (willekeurige JS) uit
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // alleen inschakelen voor vertrouwde toegang tot privénetwerken
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // verouderde overschrijving voor één profiel
    remoteCdpTimeoutMs: 1500, // time-out voor externe CDP HTTP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // time-out voor externe CDP WebSocket-handshake (ms)
    localLaunchTimeoutMs: 15000, // time-out voor detectie van lokaal beheerd Chrome (ms)
    localCdpReadyTimeoutMs: 8000, // time-out voor gereedheid van lokaal beheerd CDP na het starten (ms)
    actionTimeoutMs: 60000, // standaardtime-out voor browseracties (ms)
    tabCleanup: {
      enabled: true, // standaard: true
      idleMinutes: 120, // stel in op 0 om opschoning wegens inactiviteit uit te schakelen
      maxTabsPerSession: 8, // stel in op 0 om de limiet per sessie uit te schakelen
      sweepMinutes: 5,
    },
    // snapshotDefaults: { mode: "efficient" }, // standaardmodus voor momentopnamen wanneer de aanroeper er geen opgeeft
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

`browser.snapshotDefaults.mode: "efficient"` wijzigt de standaardmodus voor `snapshot`-
extractie wanneer een aanroeper geen expliciete `snapshotFormat` of
`mode` doorgeeft; zie [API voor browserbesturing](/nl/tools/browser-control) voor opties voor momentopnamen
per aanroep.

### Schermafbeeldingsvisie (ondersteuning voor modellen die alleen tekst verwerken)

Wanneer het hoofdmodel alleen tekst verwerkt (geen ondersteuning voor beeld/multimodaliteit), retourneren
browserschermafbeeldingen afbeeldingsblokken die het model niet kan lezen. Browserschermafbeeldingen
hergebruiken de bestaande configuratie voor beeldherkenning, zodat een afbeeldingsmodel
dat voor mediabegrip is geconfigureerd schermafbeeldingen als tekst kan beschrijven zonder
browserspecifieke modelinstellingen.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Voeg terugvalkandidaten toe; het eerste succes wint
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Gedeelde mediamodellen werken ook wanneer ze voor afbeeldingsondersteuning zijn gelabeld.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Bestaande standaardinstellingen voor afbeeldingsmodellen worden ook gerespecteerd.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Zo werkt het:**

1. De agent roept `browser screenshot` aan en er wordt zoals gebruikelijk een afbeelding op schijf vastgelegd.
2. De browsertool vraagt de bestaande runtime voor beeldherkenning of deze
   de schermafbeelding kan beschrijven met geconfigureerde media-afbeeldingsmodellen, gedeelde media-
   modellen, standaardinstellingen voor afbeeldingsmodellen of een afbeeldingsprovider met verificatie.
3. Het visiemodel retourneert een tekstuele beschrijving, die wordt ingepakt met
   `wrapExternalContent` (beveiliging tegen promptinjectie) en als tekstblok aan de agent
   wordt geretourneerd in plaats van als afbeeldingsblok.
4. Als beeldherkenning niet beschikbaar is, wordt overgeslagen of mislukt, valt de browser
   terug op het retourneren van het oorspronkelijke afbeeldingsblok.

Afbeeldingsblokken van schermafbeeldingen zijn persoonlijke toolresultaten: de agent kan ze inspecteren,
maar OpenClaw voegt ze niet automatisch toe aan antwoorden in kanalen. Om een
schermafbeelding te delen, vraag je de agent deze expliciet met de berichtentool te verzenden.

Gebruik de bestaande velden `tools.media.image` / `tools.media.models` voor model-
terugvalopties, time-outs, bytelimieten, profielen en instellingen voor providerverzoeken.

Als het actieve hoofdmodel al beeld ondersteunt en er geen expliciet model voor
beeldherkenning is geconfigureerd, behoudt OpenClaw het normale afbeeldingsresultaat, zodat het
hoofdmodel de schermafbeelding rechtstreeks kan lezen.

<AccordionGroup>

<Accordion title="Poorten en bereikbaarheid">

- De besturingsservice bindt aan loopback op een poort die is afgeleid van `gateway.port` (standaard `18791` = Gateway + 2). `OPENCLAW_GATEWAY_PORT` heeft voorrang op `gateway.port`; beide verschuiven de afgeleide poorten binnen dezelfde reeks.
- Lokale `openclaw`-profielen wijzen automatisch `cdpPort`/`cdpUrl` toe uit een bereik dat 9 poorten boven de besturingspoort begint (standaard `18800`-`18899`); stel deze alleen in voor
  externe CDP-profielen of het koppelen van een eindpunt aan een bestaande sessie. `cdpUrl` gebruikt standaard
  de beheerde lokale CDP-poort wanneer deze niet is ingesteld.
- `remoteCdpTimeoutMs` is van toepassing op HTTP-bereikbaarheidscontroles van externe en `attachOnly`-CDP
  en HTTP-verzoeken om tabbladen te openen; `remoteCdpHandshakeTimeoutMs` is van toepassing op
  hun CDP-WebSocket-handshakes. Bij het inventariseren van permanente externe Playwright-tabbladen
  wordt de grootste van de twee als deadline voor de bewerking gebruikt.
- `localLaunchTimeoutMs` is het tijdsbudget waarbinnen een lokaal gestart, beheerd Chrome-proces
  zijn CDP-HTTP-eindpunt beschikbaar moet maken. `localCdpReadyTimeoutMs` is het
  daaropvolgende tijdsbudget voor de gereedheid van de CDP-WebSocket nadat het proces is gedetecteerd.
  Verhoog deze waarden op Raspberry Pi, eenvoudige VPS-systemen of oudere hardware waarop Chromium
  langzaam start. Waarden moeten positieve gehele getallen van maximaal `120000` ms zijn; ongeldige
  configuratiewaarden worden geweigerd.
- Herhaalde fouten bij het starten of gereedmaken van beheerd Chrome worden per
  profiel door een circuit breaker beperkt. Na meerdere opeenvolgende fouten pauzeert OpenClaw
  nieuwe startpogingen kort, in plaats van Chromium bij elke aanroep van een browsertool te starten. Los
  het opstartprobleem op, schakel de browser uit als deze niet nodig is of herstart de
  Gateway na de reparatie.
- `actionTimeoutMs` is het standaardtijdsbudget voor browser-`act`-verzoeken wanneer de aanroeper geen `timeoutMs` doorgeeft. Het clienttransport voegt een kleine reservemarge toe, zodat lange wachttijden kunnen worden voltooid in plaats van een time-out te krijgen bij de HTTP-grens.
- `tabCleanup` voert een best-effort-opruiming uit voor tabbladen die door browsersessies van de primaire agent zijn geopend. De levenscyclusopruiming van subagents, cron en ACP sluit hun expliciet bijgehouden tabbladen nog steeds aan het einde van de sessie; primaire sessies houden actieve tabbladen herbruikbaar en sluiten vervolgens inactieve of overtollige bijgehouden tabbladen op de achtergrond.

</Accordion>

<Accordion title="SSRF-beleid">

- Browsernavigatie en verzoeken om tabbladen te openen worden vooraf gecontroleerd. Tijdens de actie en een begrensde respijtperiode erna onderscheppen beveiligde Playwright-interacties (klikken, klikken op coördinaten, aanwijzen, slepen, scrollen, selecteren, toetsen indrukken, typen, formulieren invullen en evalueren) door het beleid geweigerde documentladingen op het hoogste niveau en in subframes voordat bytes van het HTTP-verzoek worden verzonden, waarna de uiteindelijke `http(s)`-URL opnieuw volgens het best-effort-principe wordt gecontroleerd.
- Vóór elke nieuwe start van door OpenClaw beheerd Chrome schakelt OpenClaw netwerkvoorspelling volgens het best-effort-principe uit, waardoor de waargenomen speculatieve preconnect van Chromium voor die geweigerde ladingen wordt onderdrukt. Dit is gelaagde beveiliging, geen beleidsgrens: een browser die opnieuw wordt gebruikt na een herstart van de besturingsservice en andere browserbackends delen deze beveiliging mogelijk niet. Playwright-routering is nog steeds geen netwerkfirewall en onderschept geen omleidingsstappen, het eerste verzoek van een pop-up, Service Worker-verkeer, paginacode die na het begrensde beveiligingsvenster wordt uitgevoerd of elk achtergrond-/subresourcepad. Volledige isolatie van uitgaand verkeer vereist isolatie door de eigenaar of een proxy die het beleid afdwingt.
- In de strikte SSRF-modus worden ook de detectie van externe CDP-eindpunten en `/json/version`-controles (`cdpUrl`) gecontroleerd.
- De Gateway-/provideromgevingsvariabelen `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` en `NO_PROXY` sturen de door OpenClaw beheerde browser niet automatisch via een proxy. Beheerd Chrome start standaard met een rechtstreekse verbinding, zodat proxyinstellingen van providers de SSRF-controles van de browser niet verzwakken.
- Lokale, door OpenClaw beheerde CDP-gereedheidscontroles en DevTools-WebSocket-verbindingen omzeilen de beheerde netwerkproxy voor het exacte gestarte loopback-eindpunt, zodat `openclaw browser start` blijft werken wanneer een beheerdersproxy uitgaand loopback-verkeer blokkeert.
- Om de beheerde browser zelf via een proxy te leiden, geef je expliciete Chrome-proxyvlaggen door via `browser.extraArgs`, zoals `--proxy-server=...` of `--proxy-pac-url=...`. De strikte SSRF-modus blokkeert expliciete browserproxyrouting, tenzij browsertoegang tot het privénetwerk bewust is ingeschakeld.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` is standaard uitgeschakeld; schakel dit alleen in wanneer browsertoegang tot het privénetwerk bewust wordt vertrouwd.
- `browser.ssrfPolicy.allowPrivateNetwork` blijft ondersteund als verouderde alias.

</Accordion>

<Accordion title="Profielgedrag">

- `attachOnly: true` betekent dat nooit een lokale browser wordt gestart; er wordt alleen gekoppeld als er al een actief is.
- `headless` kan globaal of per lokaal beheerd profiel worden ingesteld. Waarden per profiel overschrijven `browser.headless`, zodat het ene lokaal gestarte profiel headless kan blijven terwijl het andere zichtbaar blijft.
- `POST /start?headless=true` en `openclaw browser start --headless` vragen om een
  eenmalige headless-start voor lokaal beheerde profielen zonder
  `browser.headless` of de profielconfiguratie te herschrijven. Profielen voor bestaande sessies, profielen die alleen koppelen en
  externe CDP-profielen weigeren deze overschrijving, omdat OpenClaw die
  browserprocessen niet start.
- Op Linux-hosts zonder `DISPLAY` of `WAYLAND_DISPLAY` gebruiken lokaal beheerde profielen
  automatisch standaard de headless-modus wanneer noch de omgeving, noch de profiel-/globale
  configuratie expliciet de zichtbare modus kiest. Gebruik de ondubbelzinnige vorm op browserniveau
  `openclaw browser --json status`; een afsluitende `openclaw browser status --json`
  werkt ook, omdat `status` geen eigen `--json` definieert. De opdracht rapporteert
  `headlessSource` als `env`, `profile`, `config`,
  `request`, `linux-display-fallback` of `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` dwingt lokaal beheerde starts voor het
  huidige proces in headless-modus af. `OPENCLAW_BROWSER_HEADLESS=0` dwingt voor normale
  starts de zichtbare modus af en retourneert een bruikbare fout op Linux-hosts zonder beeldschermserver;
  een expliciet `start --headless`-verzoek heeft voor die ene start nog steeds voorrang.
- De browserbesturingsroute en programmatische client behouden de
  door mensen leesbare `error` van de fout voor een ontbrekend beeldscherm en stellen de stabiele reden
  `no_display_for_headed_profile` beschikbaar. De `details` daarvan bevatten uitsluitend `profile`,
  `requestedHeadless`, `headlessSource` en `displayPresent`, zodat API-clients
  de juiste oplossing kunnen kiezen zonder berichttekst te vergelijken.
- Voor een actief lokaal beheerd profiel vragen status en doctor het
  CDP-eindpunt op browserniveau van Chrome op voor de renderer, backend, het apparaat/stuurprogramma, de status van
  functies, tijdelijke oplossingen voor stuurprogramma's en mogelijkheden voor versnelde video. Het resultaat wordt
  voor dat browserproces in de cache opgeslagen en volledig beschikbaar gesteld via
  `openclaw browser --json status`. Een passieve statusaanroep start Chrome niet.
  Browsers voor bestaande sessies, extensies, externe CDP en sandboxes blijven afzonderlijk
  en worden niet via dit pad voor beheerde hosts geïnspecteerd.
- Headless beheerd Chrome gebruikt nog steeds de conservatieve standaard `--disable-gpu`.
  De diagnostiek schakelt versnelling niet in, voegt geen globale versnellingsinstelling toe
  en verleent sandboxbrowsers geen apparaattoegang.
- `executablePath` kan globaal of per lokaal beheerd profiel worden ingesteld. Waarden per profiel overschrijven `browser.executablePath`, zodat verschillende beheerde profielen verschillende Chromium-gebaseerde browsers kunnen starten. Beide vormen accepteren `~` voor de thuismap van je besturingssysteem.
- `color` (op het hoogste niveau en per profiel) geeft de browserinterface een tint, zodat je kunt zien welk profiel actief is.
- Het standaardprofiel is `openclaw` (zelfstandig beheerd). Gebruik `defaultProfile: "user"` om bewust de aangemelde gebruikersbrowser te gebruiken.
- Volgorde van automatische detectie: de standaardbrowser van het systeem als deze op Chromium is gebaseerd; anders Chrome, Brave, Edge, Chromium, Chrome Canary.
- `driver: "existing-session"` gebruikt Chrome DevTools MCP in plaats van onbewerkte CDP. Het kan koppelen via automatische verbinding van Chrome MCP of via `cdpUrl` wanneer je al een DevTools-eindpunt voor de actieve browser hebt.
- `driver: "extension"` bestuurt je aangemelde Chrome via de [OpenClaw Chrome-extensie](/nl/tools/chrome-extension). De relay beheert het loopback-eindpunt, dus deze profielen accepteren `cdpUrl` niet. Dit is de enige modus voor een aangemelde browser die werkt zonder dat er iemand achter de computer zit.
- Stel `browser.profiles.<name>.userDataDir` in wanneer een bestaand-sessieprofiel moet koppelen aan een niet-standaard Chromium-gebruikersprofiel (Brave, Edge enzovoort). Dit pad accepteert ook `~` voor de thuismap van je besturingssysteem.

</Accordion>

</AccordionGroup>

## Brave of een andere Chromium-gebaseerde browser gebruiken

Als je **standaardbrowser van het systeem** op Chromium is gebaseerd (Chrome/Brave/Edge/enzovoort),
gebruikt OpenClaw deze automatisch. Stel `browser.executablePath` in om
automatische detectie te overschrijven. Waarden van `executablePath` op het hoogste niveau en per profiel accepteren `~`
voor de thuismap van je besturingssysteem:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Of stel dit per platform in de configuratie in:

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

`executablePath` per profiel is alleen van invloed op lokaal beheerde profielen die OpenClaw
start. `existing-session`-profielen koppelen in plaats daarvan aan een browser die al actief is,
en externe CDP-profielen gebruiken de browser achter `cdpUrl`.

## Lokale versus externe besturing

- **Lokale besturing (standaard):** de Gateway start de loopback-besturingsservice en kan een lokale browser starten.
- **Externe besturing (Node-host):** voer een Node-host uit op de machine waarop de browser staat; de Gateway stuurt browseracties ernaartoe door.
- **Externe CDP:** stel `browser.profiles.<name>.cdpUrl` (of `browser.cdpUrl`) in om
  aan een externe Chromium-gebaseerde browser te koppelen. In dit geval start OpenClaw geen lokale browser.
- Stel voor extern beheerde CDP-services op loopback (bijvoorbeeld Browserless in
  Docker, gepubliceerd op `127.0.0.1`) ook `attachOnly: true` in. Loopback-CDP
  zonder `attachOnly` wordt behandeld als een lokaal, door OpenClaw beheerd browserprofiel.
- `headless` is alleen van invloed op lokaal beheerde profielen die OpenClaw start. Het herstart of wijzigt browsers voor bestaande sessies of externe CDP-browsers niet.
- `executablePath` volgt dezelfde regel voor lokaal beheerde profielen. Als je dit voor een
  actief lokaal beheerd profiel wijzigt, wordt dat profiel gemarkeerd voor herstart/reconciliatie, zodat bij
  de volgende start het nieuwe binaire bestand wordt gebruikt.

Het stopgedrag verschilt per profielmodus:

- lokaal beheerde profielen: `openclaw browser stop` stopt het browserproces dat
  OpenClaw heeft gestart
- profielen die alleen koppelen en externe CDP-profielen: `openclaw browser stop` sluit de actieve
  besturingssessie en verwijdert Playwright-/CDP-emulatieoverschrijvingen (viewport,
  kleurenschema, landinstelling, tijdzone, offlinemodus en vergelijkbare status),
  ook al heeft OpenClaw geen browserproces gestart

Externe CDP-URL's kunnen authenticatie bevatten:

- Querytokens (bijvoorbeeld `https://provider.example?token=<token>`)
- HTTP Basic-authenticatie (bijvoorbeeld `https://user:pass@provider.example`)

OpenClaw behoudt de authenticatie bij het aanroepen van `/json/*`-eindpunten en bij het verbinden
met de CDP-WebSocket. Gebruik voor tokens bij voorkeur omgevingsvariabelen of geheimenbeheerders
in plaats van ze vast te leggen in configuratiebestanden.

## Node-browserproxy (standaard zonder configuratie)

Als je een **node-host** uitvoert op de machine met je browser, kan OpenClaw
browsertoolaanroepen automatisch naar die node routeren zonder extra browserconfiguratie.
Dit is het standaardpad voor externe gateways.

Opmerkingen:

- De node-host stelt zijn lokale browserbesturingsserver beschikbaar via een **proxyopdracht**.
- Profielen zijn afkomstig uit de eigen `browser.profiles`-configuratie van de node (hetzelfde als lokaal).
- De proxyopdracht staat nooit permanente profielwijzigingen toe (`create-profile`, `delete-profile`, `reset-profile`), ongeacht `allowProfiles`; breng die wijzigingen rechtstreeks op de node aan.
- `nodeHost.browserProxy.allowProfiles` is optioneel. Laat dit leeg voor het verouderde/standaardgedrag: alle geconfigureerde profielen blijven bereikbaar via de proxy.
- Als je `nodeHost.browserProxy.allowProfiles` instelt, behandelt OpenClaw dit als een grens voor minimale bevoegdheden die beperkt op welke profielnamen de proxy zich richt.
- Schakel dit uit als je het niet wilt:
  - Op de node: `nodeHost.browserProxy.enabled=false`
  - Op de Gateway: `gateway.nodes.browser.mode="off"` (accepteert ook `"auto"` om één verbonden browsernode te kiezen, of `"manual"` om een expliciete nodeparameter te vereisen)

## Browserless (gehoste externe CDP)

[Browserless](https://browserless.io) is een gehoste Chromium-service die
CDP-verbindings-URL's via HTTPS en WebSocket beschikbaar stelt. OpenClaw kan beide vormen gebruiken, maar
voor een extern browserprofiel is de eenvoudigste optie de rechtstreekse WebSocket-URL
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
- Kies het regio-eindpunt dat overeenkomt met je Browserless-account (zie hun documentatie).
- Als Browserless je een HTTPS-basis-URL geeft, kun je deze omzetten naar
  `wss://` voor een rechtstreekse CDP-verbinding of de HTTPS-URL behouden en OpenClaw
  `/json/version` laten detecteren.

### Browserless Docker op dezelfde host

Wanneer Browserless zelf wordt gehost in Docker en OpenClaw op de host draait, behandel je
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
OpenClaw-proces. Browserless moet ook een overeenkomend bereikbaar eindpunt aankondigen;
stel Browserless `EXTERNAL` in op dezelfde van buitenaf voor OpenClaw bereikbare WebSocket-basis,
zoals `ws://127.0.0.1:3000`, `ws://browserless:3000` of een stabiel privé-Docker-
netwerkadres. Als `/json/version` `webSocketDebuggerUrl` retourneert dat verwijst naar
een adres dat OpenClaw niet kan bereiken, kan CDP HTTP gezond lijken terwijl het koppelen via
WebSocket nog steeds mislukt.

Laat `attachOnly` niet uitgeschakeld voor een Browserless-profiel op loopback. Zonder
`attachOnly` behandelt OpenClaw de loopbackpoort als een lokaal beheerd browserprofiel
en kan het melden dat de poort in gebruik is, maar niet eigendom is van OpenClaw.

## Rechtstreekse WebSocket-CDP-providers

Sommige gehoste browserservices bieden een **rechtstreeks WebSocket**-eindpunt in plaats van
de standaard op HTTP gebaseerde CDP-detectie (`/json/version`). OpenClaw accepteert drie
vormen van CDP-URL's en kiest automatisch de juiste verbindingsstrategie:

- **HTTP(S)-detectie** - `http://host[:port]` of `https://host[:port]`.
  OpenClaw roept `/json/version` aan om de WebSocket-debugger-URL te detecteren en maakt vervolgens
  verbinding. Geen WebSocket-terugval.
- **Rechtstreekse WebSocket-eindpunten** - `ws://host[:port]/devtools/<kind>/<id>` of
  `wss://...` met een `/devtools/browser|page|worker|shared_worker|service_worker/<id>`-
  pad. OpenClaw maakt rechtstreeks verbinding via een WebSocket-handshake en slaat
  `/json/version` volledig over.
- **Kale WebSocket-hoofd-URL's** - `ws://host[:port]` of `wss://host[:port]` zonder
  `/devtools/...`-pad (bijvoorbeeld [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw probeert eerst HTTP-
  detectie via `/json/version` (waarbij het schema wordt genormaliseerd naar `http`/`https`);
  als de detectie een `webSocketDebuggerUrl` retourneert, wordt deze gebruikt; anders valt OpenClaw
  terug op een rechtstreekse WebSocket-handshake op de kale hoofd-URL. Als het aangekondigde
  WebSocket-eindpunt de CDP-handshake weigert, maar de geconfigureerde kale hoofd-URL
  deze accepteert, valt OpenClaw ook terug op die hoofd-URL. Hierdoor kan een kale `ws://`
  die naar een lokale Chrome verwijst nog steeds verbinding maken, omdat Chrome alleen WebSocket-
  upgrades accepteert op het specifieke pad per doel uit `/json/version`, terwijl gehoste
  providers nog steeds hun WebSocket-hoofdeindpunt kunnen gebruiken wanneer hun detectie-
  eindpunt een kortlevende URL aankondigt die niet geschikt is voor Playwright CDP.

`openclaw browser doctor` gebruikt dezelfde logica waarbij eerst detectie en daarna
WebSocket-terugval plaatsvindt als bij koppelen tijdens runtime, zodat een kale hoofd-URL die met succes verbinding maakt niet
door diagnostiek als onbereikbaar wordt gemeld.

### Browserbase

[Browserbase](https://www.browserbase.com) is een cloudplatform voor het uitvoeren van
headless browsers met ingebouwde CAPTCHA-oplossing, stealthmodus en residentiële
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
- Browserbase maakt automatisch een browsersessie aan bij een WebSocket-verbinding, zodat er geen
  handmatige stap nodig is om een sessie aan te maken.
- Zie [prijzen](https://www.browserbase.com/pricing) voor de huidige limieten van de gratis laag en betaalde abonnementen.
- Zie de [Browserbase-documentatie](https://docs.browserbase.com) voor de volledige API-
  referentie, SDK-handleidingen en integratievoorbeelden.

### Notte

[Notte](https://www.notte.cc) is een cloudplatform voor het uitvoeren van headless
browsers met ingebouwde stealth, residentiële proxy's en een CDP-native
WebSocket-gateway.

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
- Notte maakt automatisch een browsersessie aan bij een WebSocket-verbinding, zodat er geen handmatige
  stap nodig is om een sessie aan te maken. De sessie wordt vernietigd wanneer de
  WebSocket-verbinding wordt verbroken.
- Zie [prijzen](https://www.notte.cc/#pricing) voor de huidige limieten van de gratis laag en betaalde abonnementen.
- Zie de [Notte-documentatie](https://docs.notte.cc) voor de volledige API-referentie, SDK-
  handleidingen en integratievoorbeelden.

## Beveiliging

Kernideeën:

- Browserbesturing is alleen beschikbaar via loopback; toegang verloopt via de authenticatie van de Gateway of nodekoppeling.
- De zelfstandige HTTP-API voor de loopbackbrowser gebruikt **uitsluitend authenticatie met een gedeeld geheim**:
  gatewaytoken-bearer-authenticatie, `x-openclaw-password` of HTTP Basic-authenticatie met het
  geconfigureerde gatewaywachtwoord.
- Tailscale Serve-identiteitsheaders en `gateway.auth.mode: "trusted-proxy"`
  **authenticeren deze zelfstandige HTTP-API voor de loopbackbrowser niet**.
- Als browserbesturing is ingeschakeld en er geen authenticatie met een gedeeld geheim is geconfigureerd, genereert
  en bewaart OpenClaw bij het opstarten automatisch een aanmeldgegeven voor browserbesturing:
  een token wanneer `gateway.auth.mode` `none` is, of een wachtwoord wanneer dit
  `trusted-proxy` is (bewaard via `gateway.auth.password`, zodat loopbackclients
  buiten het proces dit kunnen achterhalen). Automatische generatie wordt overgeslagen wanneer al een expliciet
  tekenreeksaanmeldgegeven voor die modus is geconfigureerd, of wanneer
  `gateway.auth.mode` `password` is.
- Configureer `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` of
  `OPENCLAW_GATEWAY_PASSWORD` expliciet als je een stabiel, door jou beheerd geheim wilt
  in plaats van het gegenereerde geheim.

Tips voor externe CDP:

- Geef waar mogelijk de voorkeur aan versleutelde eindpunten (HTTPS of WSS) en kortlevende tokens.
- Vermijd het rechtstreeks opnemen van langlevende tokens in configuratiebestanden.
- Houd de Gateway en eventuele node-hosts op een privénetwerk (Tailscale); vermijd openbare blootstelling.
- Behandel externe CDP-URL's/tokens als geheimen; geef de voorkeur aan omgevingsvariabelen of een geheimenbeheerder.

## Profielen (meerdere browsers)

OpenClaw ondersteunt meerdere benoemde profielen (routeringsconfiguraties). Profielen kunnen het volgende zijn:

- **beheerd door OpenClaw**: een speciale Chromium-gebaseerde browserinstantie met een eigen map voor gebruikersgegevens + CDP-poort
- **extern**: een expliciete CDP-URL (Chromium-gebaseerde browser die elders wordt uitgevoerd)
- **bestaande sessie**: je bestaande Chrome-profiel via automatische verbinding met Chrome DevTools MCP

Standaardwaarden:

- Het profiel `openclaw` wordt automatisch aangemaakt als het ontbreekt.
- Het profiel `user` is ingebouwd voor het koppelen van een bestaande sessie via Chrome MCP.
- Bestaande-sessieprofielen behalve `user` zijn opt-in; maak ze aan met `--driver existing-session`.
- Lokale CDP-poorten worden standaard toegewezen uit **18800-18899**.
- Als je een profiel verwijdert, wordt de lokale gegevensmap ervan naar de prullenmand verplaatst.

Alle besturingseindpunten accepteren `?profile=<name>`; de CLI gebruikt `--browser-profile`.

## Bestaande sessie via Chrome DevTools MCP

OpenClaw kan ook via de officiële Chrome DevTools MCP-server koppelen met een actief
Chromium-gebaseerd browserprofiel. Hierbij worden de tabbladen en aanmeldstatus hergebruikt
die al in dat browserprofiel zijn geopend.

Officiële achtergrond- en configuratiereferenties:

- [Chrome voor ontwikkelaars: Chrome DevTools MCP gebruiken met je browsersessie](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README van Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Ingebouwd profiel: `user`. Maak je eigen aangepaste bestaande-sessieprofiel als
je een andere naam, kleur of map voor browsergegevens wilt.

Het ingebouwde profiel `user` gebruikt standaard automatische verbinding via Chrome MCP, die
zich richt op het lokale standaardprofiel van Google Chrome. Gebruik `userDataDir` voor Brave,
Edge, Chromium of een niet-standaard Chrome-profiel. `~` wordt uitgebreid naar de basismap
van je besturingssysteem:

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

Vervolgens in de bijbehorende browser:

1. Open de inspectiepagina van die browser voor foutopsporing op afstand.
2. Schakel foutopsporing op afstand in.
3. Laat de browser actief en keur de verbindingsprompt goed wanneer OpenClaw koppelt.

Veelgebruikte inspectiepagina's:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live-rooktest voor koppeling:

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
- `tabs` vermeldt je reeds geopende browsertabbladen
- `snapshot` retourneert refs van het geselecteerde live tabblad

Wat je moet controleren als koppelen niet werkt:

- de doelbrowser op basis van Chromium is versie `144+`
- foutopsporing op afstand is ingeschakeld op de inspectiepagina van die browser
- de browser heeft de toestemmingsprompt voor koppelen getoond en je hebt deze geaccepteerd
- als Chrome is gestart met een expliciete `--remote-debugging-port`, stel
  `browser.profiles.<name>.cdpUrl` dan in op dat DevTools-eindpunt in plaats van te vertrouwen
  op automatisch verbinden via Chrome MCP
- `openclaw doctor` migreert oude browserconfiguratie op basis van extensies en controleert of
  Chrome lokaal is geïnstalleerd voor standaardprofielen met automatische verbinding, maar kan
  foutopsporing op afstand aan de browserzijde niet voor je inschakelen

Gebruik door agents:

- Gebruik `profile="user"` wanneer je de aangemelde browserstatus van de gebruiker nodig hebt.
- Als je een aangepast profiel voor een bestaande sessie gebruikt, geef dan expliciet de naam van dat profiel door.
- Kies deze modus alleen wanneer de gebruiker achter de computer zit om de
  koppelingsprompt goed te keuren.
- De Gateway- of Node-host kan `npx chrome-devtools-mcp@latest --autoConnect` starten.

Opmerkingen:

- Dit pad brengt meer risico met zich mee dan het geïsoleerde profiel `openclaw`, omdat het
  handelingen kan uitvoeren binnen je aangemelde browsersessie.
- OpenClaw start de browser niet voor dit stuurprogramma; het maakt alleen verbinding.
- OpenClaw gebruikt hier de officiële `--autoConnect`-stroom van Chrome DevTools MCP. Als
  `userDataDir` is ingesteld, wordt dit doorgegeven om die map met gebruikersgegevens te gebruiken.
- Een bestaande sessie kan worden gekoppeld op de geselecteerde host of via een verbonden
  browser-Node. Als Chrome elders draait en er geen browser-Node is verbonden, gebruik dan
  externe CDP of een Node-host.
- Chrome MCP-doelen en momentopnamerefs zijn beperkt tot één MCP-subproces. Nadat
  dat proces opnieuw is gestart, voer je `browser tabs` opnieuw uit, selecteer je expliciet een nieuw
  doel voordat je doelspecifiek werk uitvoert en maak je een nieuwe momentopname voordat je refs gebruikt.
  Elke ref is alleen geldig voor het bijbehorende doel en de nieuwste momentopname. Oude aliassen worden niet
  overgedragen naar een vervangend tabblad, zelfs niet wanneer de URL overeenkomt.
- Chrome DevTools MCP routeert paginatools momenteel via een proceslokale numerieke pagina-
  ID. Procesgebonden handles voorkomen hergebruik nadat een subproces is vervangen, maar als
  de browsercontext binnen hetzelfde proces tussen opeenvolgende toolaanroepen wordt vervangen, kan een actie nog steeds
  op een ander doel worden gericht. Volledig atomaire routering vereist upstreamondersteuning in paginatools
  voor stabiele doel-ID's.

### Aangepaste Chrome MCP-start

Overschrijf per profiel de gestarte Chrome DevTools MCP-server wanneer de standaardstroom
`npx chrome-devtools-mcp@latest` niet is wat je wilt (offline hosts,
vastgezette versies, meegeleverde binaire bestanden):

| Veld         | Functie                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Uitvoerbaar bestand dat wordt gestart in plaats van `npx`. Wordt ongewijzigd omgezet; absolute paden worden gerespecteerd.                 |
| `mcpArgs`    | Argumentenarray die letterlijk wordt doorgegeven aan `mcpCommand`. Vervangt de standaardargumenten van `chrome-devtools-mcp@latest --autoConnect`. |

Wanneer `cdpUrl` is ingesteld voor een profiel met een bestaande sessie, slaat OpenClaw
`--autoConnect` over en stuurt het eindpunt automatisch door naar Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (HTTP-detectie-eindpunt van DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (directe CDP-WebSocket).

Eindpuntvlaggen en `userDataDir` kunnen niet worden gecombineerd: wanneer `cdpUrl` is ingesteld,
wordt `userDataDir` genegeerd bij het starten van Chrome MCP, omdat Chrome MCP verbinding maakt met
de actieve browser achter het eindpunt in plaats van een profielmap
te openen.

<Accordion title="Functiebeperkingen van bestaande sessies">

Vergeleken met het beheerde profiel `openclaw` hebben stuurprogramma's voor bestaande sessies meer beperkingen:

- **Schermafbeeldingen** - paginaopnamen en elementopnamen via `--ref` werken; CSS-selectors van `--element` niet. Playwright is niet vereist voor schermafbeeldingen van pagina's of elementen op basis van refs. (`--full-page` kan met geen enkel profiel worden gecombineerd met `--ref` of `--element`, dus niet alleen bij bestaande sessies.)
- **Acties** - `click`, `type`, `hover`, `scrollIntoView`, `drag` en `select` vereisen momentopnamerefs (geen CSS-selectors). `click-coords` klikt op zichtbare viewportcoördinaten en vereist geen momentopnameref. `click` ondersteunt alleen de linkermuisknop (geen overschrijvingen van knoppen of modificatietoetsen). `type` ondersteunt `slowly=true` niet; gebruik `fill` of `press`. `press` ondersteunt `delayMs` niet. `type`, `hover`, `scrollIntoView`, `drag`, `select` en `fill` ondersteunen geen `timeoutMs`-overschrijvingen per aanroep; `evaluate` wel. `select` accepteert één waarde. `batch` wordt niet ondersteund; verstuur acties afzonderlijk.
- **Wachten/uploaden/dialoogvenster** - `wait --url` ondersteunt exacte patronen, subtekenreeksen en globpatronen (net als beheerd); `wait --load networkidle` wordt niet ondersteund voor profielen met bestaande sessies (het werkt bij beheerde en onbewerkte/externe CDP-profielen). Uploadhooks vereisen `ref` of `inputRef`, één bestand tegelijk, zonder CSS-`element`. Dialoogvensterhooks ondersteunen geen overschrijvingen van time-outs of `dialogId`.
- **Zichtbaarheid van dialoogvensters** - Reacties op beheerde browseracties bevatten `blockedByDialog` en `browserState.dialogs.pending` wanneer een actie een modaal dialoogvenster opent; momentopnamen bevatten ook de status van wachtende dialoogvensters. Reageer met `browser dialog --accept/--dismiss --dialog-id <id>` terwijl een dialoogvenster wacht. Dialoogvensters die buiten OpenClaw zijn afgehandeld, verschijnen onder `browserState.dialogs.recent`.
- **Functies alleen voor beheerde browsers** - PDF-export, onderschepping van downloads en `responsebody` vereisen nog steeds het beheerde browserpad.

</Accordion>

## Isolatiegaranties

- **Speciale map met gebruikersgegevens**: raakt je persoonlijke browserprofiel nooit aan.
- **Speciale poorten**: vermijdt `9222` om conflicten met ontwikkelworkflows te voorkomen.
- **Deterministisch tabbladbeheer**: `tabs` retourneert eerst `suggestedTargetId` en daarna
  stabiele `tabId`-handles zoals `t1`, optionele labels en de onbewerkte `targetId`.
  Agents moeten `suggestedTargetId` hergebruiken; onbewerkte ID's blijven beschikbaar voor
  foutopsporing en compatibiliteit.

## Browserselectie

Bij lokaal starten kiest OpenClaw de eerste beschikbare browser:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Je kunt dit overschrijven met `browser.executablePath`.

Platformen:

- macOS: controleert `/Applications` en `~/Applications`.
- Linux: controleert gangbare locaties van Chrome/Brave/Edge/Chromium onder `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` en
  `/usr/lib/chromium-browser`, plus door Playwright beheerde Chromium onder
  `PLAYWRIGHT_BROWSERS_PATH` of `~/.cache/ms-playwright`.
- Windows: controleert gangbare installatielocaties.

## Besturings-API (optioneel)

Voor scripts en foutopsporing biedt de Gateway een kleine **HTTP-besturings-API die
alleen via loopback toegankelijk is**, plus een bijbehorende `openclaw browser`-CLI (momentopnamen, refs, uitgebreide wachtfuncties,
JSON-uitvoer, foutopsporingsworkflows). Zie
[API voor browserbesturing](/nl/tools/browser-control) voor de volledige naslaginformatie.

## Problemen oplossen

Zie voor Linux-specifieke problemen (vooral snap Chromium)
[Browserproblemen oplossen](/nl/tools/browser-linux-troubleshooting).

Zie voor gesplitste hostconfiguraties met WSL2 Gateway en Windows Chrome
[Problemen oplossen met WSL2 + Windows + externe Chrome CDP](/nl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### CDP-startfout versus SSRF-blokkering bij navigatie

Dit zijn verschillende foutklassen die naar verschillende codepaden verwijzen.

- **CDP-start- of gereedheidsfout** betekent dat OpenClaw niet kan bevestigen dat het browserbesturingsvlak gezond is.
- **SSRF-blokkering bij navigatie** betekent dat het browserbesturingsvlak gezond is, maar dat een paginanavigatiedoel door beleid wordt geweigerd.

Veelvoorkomende voorbeelden:

- CDP-start- of gereedheidsfout:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` wanneer een
    externe CDP-service op loopback is geconfigureerd zonder `attachOnly: true`
- SSRF-blokkering bij navigatie:
  - `open`, `navigate`, momentopname- of tabbladopeningsstromen mislukken met een browser-/netwerkbeleidsfout terwijl `start` en `tabs` nog steeds werken

Gebruik deze minimale reeks om de twee te onderscheiden:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Zo interpreteer je de resultaten:

- Als `start` mislukt met `not reachable after start`, los dan eerst de CDP-gereedheid op.
- Als `start` slaagt maar `tabs` mislukt, is het besturingsvlak nog steeds niet gezond. Behandel dit als een CDP-bereikbaarheidsprobleem, niet als een paginanavigatieprobleem.
- Als `start` en `tabs` slagen maar `open` of `navigate` mislukt, is het browserbesturingsvlak actief en bevindt de fout zich in het navigatiebeleid of op de doelpagina.
- Als `start`, `tabs` en `open` allemaal slagen, is het basisbesturingspad voor de beheerde browser gezond.

Belangrijke gedragsdetails:

- De browserconfiguratie gebruikt standaard een fail-closed SSRF-beleidsobject, zelfs wanneer je `browser.ssrfPolicy` niet configureert.
- Voor het lokale beheerde loopbackprofiel `openclaw` slaan CDP-statuscontroles bewust de handhaving van browser-SSRF-bereikbaarheid over voor het eigen lokale besturingsvlak van OpenClaw.
- Navigatiebeveiliging staat hiervan los. Een geslaagd resultaat van `start` of `tabs` betekent niet dat een later doel van `open` of `navigate` is toegestaan.

Beveiligingsrichtlijnen:

- Versoepel het browser-SSRF-beleid standaard **niet**.
- Geef de voorkeur aan beperkte hostuitzonderingen zoals `hostnameAllowlist` of `allowedHostnames` boven brede toegang tot privénetwerken.
- Gebruik `dangerouslyAllowPrivateNetwork: true` alleen in bewust vertrouwde omgevingen waar browsertoegang tot privénetwerken vereist en beoordeeld is.

## Agent-tools + werking van de besturing

De agent krijgt **één tool** voor browserautomatisering:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Toewijzing:

- `browser snapshot` retourneert een stabiele UI-boom (AI of ARIA).
- `browser act` gebruikt de `ref`-ID's van de momentopname om te klikken, typen, slepen en selecteren.
- `browser screenshot` legt pixels vast (volledige pagina, element of gelabelde referenties).
- `browser doctor` controleert of de Gateway, Plugin, het profiel, de browser en het tabblad gereed zijn.
- `browser` accepteert:
  - `profile` om een benoemd browserprofiel te kiezen (openclaw, chrome of externe CDP).
  - `target` (`sandbox` | `host` | `node`) om te selecteren waar de browser wordt uitgevoerd.
  - In gesandboxte sessies vereist `target: "host"` `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Als `target` wordt weggelaten: gesandboxte sessies gebruiken standaard `sandbox`, niet-gesandboxte sessies gebruiken standaard `host`.
  - Als een Node met browsermogelijkheden is verbonden, kan de tool verzoeken er automatisch naartoe routeren, tenzij je `target="host"` of `target="node"` vastlegt.

Dit houdt de agent deterministisch en voorkomt kwetsbare selectors.

## Gerelateerd

- [Overzicht van tools](/nl/tools) - alle beschikbare agenttools
- [Sandboxing](/nl/gateway/sandboxing) - browserbesturing in gesandboxte omgevingen
- [Beveiliging](/nl/gateway/security) - risico's van browserbesturing en beveiligingsmaatregelen
