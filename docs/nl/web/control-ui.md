---
read_when:
    - Je wilt de Gateway vanuit een browser bedienen
    - Je wilt Tailnet-toegang zonder SSH-tunnels
sidebarTitle: Control UI
summary: Browsergebaseerde beheer-UI voor de Gateway (chat, knooppunten, configuratie)
title: Controle-UI
x-i18n:
    generated_at: "2026-05-04T09:37:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b68b5203b369de6a3354a7e7442ee38ee790875b2d7054b0c8ec997098fd9de
    source_path: web/control-ui.md
    workflow: 16
---

De Control UI is een kleine **Vite + Lit** single-page app die door de Gateway wordt geserveerd:

- standaard: `http://<host>:18789/`
- optioneel voorvoegsel: stel `gateway.controlUi.basePath` in (bijv. `/openclaw`)

Deze communiceert **rechtstreeks met de Gateway WebSocket** op dezelfde poort.

## Snel openen (lokaal)

Als de Gateway op dezelfde computer draait, open dan:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (of [http://localhost:18789/](http://localhost:18789/))

Als de pagina niet laadt, start dan eerst de Gateway: `openclaw gateway`.

Auth wordt tijdens de WebSocket-handshake aangeleverd via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-identiteitsheaders wanneer `gateway.auth.allowTailscale: true`
- trusted-proxy-identiteitsheaders wanneer `gateway.auth.mode: "trusted-proxy"`

Het instellingenpaneel van het dashboard bewaart een token voor de huidige browsertabsessie en de geselecteerde gateway-URL; wachtwoorden worden niet persistent opgeslagen. Onboarding genereert meestal een gateway-token voor gedeelde-geheim-auth bij de eerste verbinding, maar wachtwoordauth werkt ook wanneer `gateway.auth.mode` `"password"` is.

## Apparaat koppelen (eerste verbinding)

Wanneer je vanaf een nieuwe browser of een nieuw apparaat verbinding maakt met de Control UI, vereist de Gateway meestal een **eenmalige koppelingsgoedkeuring**. Dit is een beveiligingsmaatregel om onbevoegde toegang te voorkomen.

**Wat je ziet:** "disconnected (1008): pairing required"

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Als de browser opnieuw probeert te koppelen met gewijzigde auth-gegevens (rol/scopes/openbare sleutel), wordt het vorige openstaande verzoek vervangen en wordt er een nieuwe `requestId` aangemaakt. Voer `openclaw devices list` opnieuw uit vóór goedkeuring.

Als de browser al is gekoppeld en je deze wijzigt van leestoegang naar schrijf-/admintoegang, wordt dit behandeld als een goedkeuringsupgrade, niet als een stille herverbinding. OpenClaw houdt de oude goedkeuring actief, blokkeert de bredere herverbinding en vraagt je de nieuwe scopeset expliciet goed te keuren.

Na goedkeuring wordt het apparaat onthouden en is geen nieuwe goedkeuring vereist, tenzij je het intrekt met `openclaw devices revoke --device <id> --role <role>`. Zie [Devices CLI](/nl/cli/devices) voor tokenrotatie en intrekking.

<Note>
- Rechtstreekse browserverbindingen via local loopback (`127.0.0.1` / `localhost`) worden automatisch goedgekeurd.
- Tailscale Serve kan de koppelingsronde overslaan voor Control UI-operatorsessies wanneer `gateway.auth.allowTailscale: true`, de Tailscale-identiteit wordt geverifieerd en de browser zijn apparaatidentiteit presenteert.
- Rechtstreekse Tailnet-bindings, LAN-browserverbindingen en browserprofielen zonder apparaatidentiteit vereisen nog steeds expliciete goedkeuring.
- Elk browserprofiel genereert een unieke apparaat-ID, dus wisselen van browser of browsergegevens wissen vereist opnieuw koppelen.

</Note>

## Persoonlijke identiteit (browser-lokaal)

De Control UI ondersteunt een persoonlijke identiteit per browser (weergavenaam en avatar) die aan uitgaande berichten wordt gekoppeld voor attributie in gedeelde sessies. Deze leeft in browseropslag, is beperkt tot het huidige browserprofiel en wordt niet gesynchroniseerd naar andere apparaten of server-side persistent opgeslagen buiten de normale transcript-auteurschapsmetadata op berichten die je daadwerkelijk verzendt. Sitegegevens wissen of van browser wisselen zet deze terug naar leeg.

Hetzelfde browser-lokale patroon geldt voor de override van de assistent-avatar. Geüploade assistent-avatars leggen de door de gateway opgeloste identiteit alleen over de lokale browser heen en maken nooit een round-trip via `config.patch`. Het gedeelde configuratieveld `ui.assistant.avatar` blijft beschikbaar voor niet-UI-clients die het veld rechtstreeks schrijven (zoals gescripte gateways of aangepaste dashboards).

## Runtimeconfiguratie-endpoint

De Control UI haalt zijn runtime-instellingen op uit `/__openclaw/control-ui-config.json`. Dat endpoint wordt beschermd door dezelfde gateway-auth als de rest van het HTTP-oppervlak: niet-geauthenticeerde browsers kunnen het niet ophalen, en een succesvolle fetch vereist een al geldig gateway-token/wachtwoord, Tailscale Serve-identiteit of trusted-proxy-identiteit.

## Taalondersteuning

De Control UI kan zichzelf bij de eerste laadbeurt lokaliseren op basis van je browserlocale. Om dit later te overschrijven, open **Overview -> Gateway Access -> Language**. De locale-kiezer staat in de Gateway Access-kaart, niet onder Appearance.

- Ondersteunde locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Niet-Engelse vertalingen worden lazy-loaded in de browser.
- De geselecteerde locale wordt opgeslagen in browseropslag en hergebruikt bij toekomstige bezoeken.
- Ontbrekende vertaalsleutels vallen terug op Engels.

Docs-vertalingen worden gegenereerd voor dezelfde niet-Engelse localeset, maar de ingebouwde Mintlify-taalkiezer van de documentatiesite is beperkt tot de locale-codes die Mintlify accepteert. Thaise (`th`) en Perzische (`fa`) docs worden nog steeds gegenereerd in de publish-repo; ze verschijnen mogelijk pas in die kiezer wanneer Mintlify die codes ondersteunt.

## Weergavethema's

Het Appearance-paneel behoudt de ingebouwde Claw-, Knot- en Dash-thema's, plus één browser-lokaal tweakcn-importslot. Om een thema te importeren, open [tweakcn editor](https://tweakcn.com/editor/theme), kies of maak een thema, klik op **Share** en plak de gekopieerde themalink in Appearance. De importer accepteert ook `https://tweakcn.com/r/themes/<id>`-registry-URL's, editor-URL's zoals `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relatieve `/themes/<id>`-paden, ruwe thema-ID's en standaardthemanamen zoals `amethyst-haze`.

Geïmporteerde thema's worden alleen opgeslagen in het huidige browserprofiel. Ze worden niet naar gateway-configuratie geschreven en synchroniseren niet tussen apparaten. Het geïmporteerde thema vervangen werkt het ene lokale slot bij; het wissen schakelt het actieve thema terug naar Claw als het geïmporteerde thema was geselecteerd.

## Wat het kan doen (vandaag)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Chat met het model via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Praat via realtime browsersessies. OpenAI gebruikt directe WebRTC, Google Live gebruikt een beperkt eenmalig browsertoken via WebSocket, en backend-only realtime voice-plugins gebruiken het Gateway-relaytransport. De relay houdt providerreferenties op de Gateway terwijl de browser microfoon-PCM streamt via `talk.realtime.relay*`-RPC's en `openclaw_agent_consult`-toolaanroepen terugstuurt via `chat.send` voor het grotere geconfigureerde OpenClaw-model.
    - Stream toolaanroepen + live tooluitvoerkaarten in Chat (agent-events).

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Kanalen: ingebouwde plus gebundelde/externe plugin-kanaalstatus, QR-login en configuratie per kanaal (`channels.status`, `web.login.*`, `config.patch`).
    - Instanties: aanwezigheidslijst + vernieuwen (`system-presence`).
    - Sessies: lijst + model-/thinking-/fast-/verbose-/trace-/reasoning-overrides per sessie (`sessions.list`, `sessions.patch`).
    - Dreams: dreaming-status, inschakel-/uitschakelknop en Dream Diary-lezer (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Cron-taken: weergeven/toevoegen/bewerken/uitvoeren/inschakelen/uitschakelen + uitvoeringsgeschiedenis (`cron.*`).
    - Skills: status, inschakelen/uitschakelen, installeren, API-sleutelupdates (`skills.*`).
    - Nodes: lijst + caps (`node.list`).
    - Exec-goedkeuringen: gateway- of node-toelatingslijsten bewerken + vraagbeleid voor `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Bekijk/bewerk `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Toepassen + herstarten met validatie (`config.apply`) en de laatst actieve sessie wekken.
    - Schrijfacties bevatten een base-hash-guard om te voorkomen dat gelijktijdige bewerkingen worden overschreven.
    - Schrijfacties (`config.set`/`config.apply`/`config.patch`) voeren vooraf resolutie van actieve SecretRef's uit voor refs in de ingediende configuratiepayload; niet-opgeloste actieve ingediende refs worden vóór schrijven geweigerd.
    - Schema + formulierweergave (`config.schema` / `config.schema.lookup`, inclusief veld `title` / `description`, gematchte UI-hints, directe child-samenvattingen, docs-metadata op geneste object-/wildcard-/array-/composition-nodes, plus plugin- en kanaalschema's wanneer beschikbaar); Raw JSON-editor is alleen beschikbaar wanneer de snapshot een veilige ruwe round-trip heeft.
    - Als een snapshot ruwe tekst niet veilig kan round-trippen, dwingt Control UI de formuliermodus af en schakelt Raw-modus uit voor die snapshot.
    - Raw JSON-editor "Reset to saved" behoudt de ruwe authored-vorm (opmaak, opmerkingen, `$include`-layout) in plaats van een afgeplatte snapshot opnieuw te renderen, zodat externe bewerkingen een reset overleven wanneer de snapshot veilig kan round-trippen.
    - Gestructureerde SecretRef-objectwaarden worden read-only weergegeven in formulier-tekstinputs om onbedoelde object-naar-string-corruptie te voorkomen.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status-/health-/models-snapshots + eventlog + handmatige RPC-aanroepen (`status`, `health`, `models.list`).
    - Het eventlog bevat Control UI-verversings-/RPC-timings plus browserresponsiviteit-items voor lange animatieframes of lange taken wanneer de browser die PerformanceObserver-entrytypes aanbiedt.
    - Logs: live tail van gateway-bestandslogs met filter/export (`logs.tail`).
    - Update: voer een package-/git-update + herstart uit (`update.run`) met een herstartrapport en poll daarna `update.status` na herverbinding om de draaiende gatewayversie te verifiëren.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Voor geïsoleerde taken is de bezorgstandaard samenvatting aankondigen. Je kunt overschakelen naar geen als je alleen interne runs wilt.
    - Kanaal-/doelvelden verschijnen wanneer aankondigen is geselecteerd.
    - Webhook-modus gebruikt `delivery.mode = "webhook"` met `delivery.to` ingesteld op een geldige HTTP(S)-webhook-URL.
    - Voor hoofdsessie-taken zijn Webhook- en geen-bezorgmodi beschikbaar.
    - Geavanceerde bewerkingsopties omvatten verwijderen-na-uitvoer, agent-override wissen, exacte/stagger Cron-opties, agent-model-/thinking-overrides en best-effort-bezorgschakelaars.
    - Formuliervalidatie is inline met fouten op veldniveau; ongeldige waarden schakelen de opslagknop uit totdat ze zijn opgelost.
    - Stel `cron.webhookToken` in om een speciaal bearer-token te verzenden; indien weggelaten wordt de Webhook zonder auth-header verzonden.
    - Verouderde fallback: opgeslagen legacy-taken met `notify: true` kunnen nog steeds `cron.webhook` gebruiken totdat ze zijn gemigreerd.

  </Accordion>
</AccordionGroup>

## Chatgedrag

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` is **niet-blokkerend**: het bevestigt direct met `{ runId, status: "started" }` en de reactie wordt gestreamd via `chat`-events.
    - Chat-uploads accepteren afbeeldingen plus niet-videobestanden. Afbeeldingen behouden het native afbeeldingspad; andere bestanden worden opgeslagen als beheerde media en in de geschiedenis getoond als bijlagelinks.
    - Opnieuw verzenden met dezelfde `idempotencyKey` retourneert `{ status: "in_flight" }` zolang de uitvoering loopt, en `{ status: "ok" }` na voltooiing.
    - `chat.history`-reacties zijn in grootte begrensd voor UI-veiligheid. Wanneer transcriptitems te groot zijn, kan de Gateway lange tekstvelden inkorten, zware metadatablokken weglaten en te grote berichten vervangen door een placeholder (`[chat.history omitted: message too large]`).
    - Door de assistent gegenereerde afbeeldingen worden bewaard als beheerde mediareferenties en teruggeleverd via geauthenticeerde Gateway-media-URL's, zodat herladen niet afhankelijk is van onbewerkte base64-afbeeldingspayloads die in de chatgeschiedenisreactie blijven staan.
    - `chat.history` verwijdert ook alleen-voor-weergave inline directivetags uit zichtbare assistenttekst (bijvoorbeeld `[[reply_to_*]]` en `[[audio_as_voice]]`), XML-payloads voor tool-aanroepen in platte tekst (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en ingekorte tool-aanroepblokken), en gelekte ASCII-/volledige-breedte modelcontroletokens, en laat assistentitems weg waarvan de volledige zichtbare tekst alleen het exacte stille token `NO_REPLY` / `no_reply` is.
    - Tijdens een actieve verzending en de laatste geschiedenisverversing houdt de chatweergave lokale optimistische gebruikers-/assistentberichten zichtbaar als `chat.history` kort een oudere snapshot retourneert; het canonieke transcript vervangt die lokale berichten zodra de Gateway-geschiedenis is bijgewerkt.
    - Live `chat`-events zijn afleverstatus, terwijl `chat.history` opnieuw wordt opgebouwd uit het duurzame sessietranscript. Na tool-final-events laadt de Control UI de geschiedenis opnieuw en voegt alleen een kleine optimistische staart samen; de transcriptgrens is gedocumenteerd in [WebChat](/nl/web/webchat).
    - `chat.inject` voegt een assistentnotitie toe aan het sessietranscript en zendt een `chat`-event uit voor alleen-UI-updates (geen agentuitvoering, geen kanaalaflevering).
    - De chatheader toont het agentfilter vóór de sessiekiezer, en de sessiekiezer wordt beperkt tot de geselecteerde agent. Wisselen van agent toont alleen sessies die aan die agent zijn gekoppeld en valt terug op de hoofdsessie van die agent wanneer die nog geen opgeslagen dashboardsessies heeft.
    - Op desktopbreedtes blijven chatbedieningselementen op één compacte rij en klappen ze in tijdens omlaag scrollen door het transcript; omhoog scrollen, terugkeren naar de bovenkant of de onderkant bereiken herstelt de bedieningselementen.
    - Opeenvolgende dubbele berichten met alleen tekst worden weergegeven als één ballon met een tellerbadge. Berichten met afbeeldingen, bijlagen, tool-uitvoer of canvasvoorvertoningen blijven niet-ingeklapt.
    - De model- en denkkeuzes in de chatheader patchen de actieve sessie direct via `sessions.patch`; het zijn persistente sessie-overschrijvingen, geen verzendopties voor slechts één beurt.
    - `/new` typen in de Control UI maakt dezelfde nieuwe dashboardsessie als New Chat en schakelt ernaar over. `/reset` typen behoudt de expliciete in-place reset van de Gateway voor de huidige sessie.
    - De chatmodelkiezer vraagt de geconfigureerde modelweergave van de Gateway op. Als `agents.defaults.models` aanwezig is, stuurt die toelatingslijst de kiezer aan. Anders toont de kiezer expliciete `models.providers.*.models`-items plus providers met bruikbare authenticatie. De volledige catalogus blijft beschikbaar via de debug-`models.list`-RPC met `view: "all"`.
    - Wanneer recente gebruiksrapporten van Gateway-sessies hoge contextdruk tonen, toont het chatcomponistgebied een contextmelding en, bij aanbevolen Compaction-niveaus, een compacte knop die het normale sessie-Compaction-pad uitvoert. Verouderde tokensnapshots worden verborgen totdat de Gateway opnieuw recent gebruik rapporteert.

  </Accordion>
  <Accordion title="Talk mode (browser realtime)">
    Talk-modus gebruikt een geregistreerde realtime spraakprovider. Configureer OpenAI met `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, of configureer Google met `talk.provider: "google"` plus `talk.providers.google.apiKey`; realtime providerconfiguratie voor Voice Call kan nog steeds als fallback worden hergebruikt. De browser ontvangt nooit een standaard provider-API-sleutel. OpenAI ontvangt een tijdelijke Realtime-clientsecret voor WebRTC. Google Live ontvangt een eenmalig beperkt Live API-authenticatietoken voor een browser-WebSocket-sessie, waarbij instructies en tooldeclaraties door de Gateway in het token zijn vergrendeld. Providers die alleen een backend realtime bridge aanbieden, lopen via het Gateway-relaytransport, zodat referenties en leverancierssockets server-side blijven terwijl browseraudio via geauthenticeerde Gateway-RPC's beweegt. De Realtime-sessieprompt wordt samengesteld door de Gateway; `talk.realtime.session` accepteert geen door de aanroeper aangeleverde instructie-overschrijvingen.

    In de chatcomponist is het Talk-bedieningselement de golfknop naast de microfoonknop voor dicteren. Wanneer Talk start, toont de statusrij van de componist `Connecting Talk...`, daarna `Talk live` terwijl audio is verbonden, of `Asking OpenClaw...` terwijl een realtime tool-aanroep het geconfigureerde grotere model raadpleegt via `chat.send`.

    Live-smoketest voor maintainers: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifieert de OpenAI browser-WebRTC SDP-uitwisseling, de Google Live constrained-token browser-WebSocket-instelling en de Gateway-relaybrowseradapter met neppe microfoonmedia. De opdracht print alleen providerstatus en logt geen geheimen.

  </Accordion>
  <Accordion title="Stop and abort">
    - Klik op **Stop** (roept `chat.abort` aan).
    - Terwijl een uitvoering actief is, worden normale vervolgberichten in de wachtrij gezet. Klik op **Steer** bij een bericht in de wachtrij om dat vervolgbericht in de lopende beurt te injecteren.
    - Typ `/stop` (of losse afbreekzinnen zoals `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) om out-of-band af te breken.
    - `chat.abort` ondersteunt `{ sessionKey }` (geen `runId`) om alle actieve uitvoeringen voor die sessie af te breken.

  </Accordion>
  <Accordion title="Abort partial retention">
    - Wanneer een uitvoering wordt afgebroken, kan gedeeltelijke assistenttekst nog steeds in de UI worden getoond.
    - Gateway bewaart afgebroken gedeeltelijke assistenttekst in de transcriptgeschiedenis wanneer er gebufferde uitvoer bestaat.
    - Bewaarde items bevatten afbreekmetadata, zodat transcriptgebruikers afgebroken gedeeltelijke uitvoer kunnen onderscheiden van normale voltooiingsuitvoer.

  </Accordion>
</AccordionGroup>

## PWA-installatie en webpush

De Control UI levert een `manifest.webmanifest` en een service worker mee, zodat moderne browsers deze als zelfstandige PWA kunnen installeren. Web Push laat de Gateway de geïnstalleerde PWA wekken met meldingen, zelfs wanneer het tabblad of browservenster niet open is.

| Oppervlak                                             | Wat het doet                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-manifest. Browsers bieden "App installeren" aan zodra het bereikbaar is. |
| `ui/public/sw.js`                                     | Service worker die `push`-events en klikken op meldingen afhandelt. |
| `push/vapid-keys.json` (onder de OpenClaw-statusmap) | Automatisch gegenereerd VAPID-sleutelpaar dat wordt gebruikt om Web Push-payloads te ondertekenen. |
| `push/web-push-subscriptions.json`                    | Bewaarde browserabonnementseindpunten.                             |

Overschrijf het VAPID-sleutelpaar via env-vars op het Gateway-proces wanneer je sleutels wilt vastzetten (voor multi-host-deployments, geheime-rotatie of tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standaard `mailto:openclaw@localhost`)

De Control UI gebruikt deze scope-gated Gateway-methoden om browserabonnementen te registreren en te testen:

- `push.web.vapidPublicKey` — haalt de actieve openbare VAPID-sleutel op.
- `push.web.subscribe` — registreert een `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — verwijdert een geregistreerd eindpunt.
- `push.web.test` — verstuurt een testmelding naar het abonnement van de aanroeper.

<Note>
Web Push staat los van het iOS APNS-relaypad (zie [Configuratie](/nl/gateway/configuration) voor relay-ondersteunde push) en de bestaande methode `push.test`, die gericht zijn op native mobiele koppeling.
</Note>

## Gehoste embeds

Assistentberichten kunnen gehoste webinhoud inline weergeven met de `[embed ...]`-shortcode. Het iframe-sandboxbeleid wordt beheerd door `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Schakelt scriptuitvoering binnen gehoste embeds uit.
  </Tab>
  <Tab title="scripts (default)">
    Staat interactieve embeds toe terwijl origin-isolatie behouden blijft; dit is de standaard en is meestal voldoende voor zelfstandige browsergames/widgets.
  </Tab>
  <Tab title="trusted">
    Voegt `allow-same-origin` toe boven op `allow-scripts` voor documenten op dezelfde site die bewust sterkere rechten nodig hebben.
  </Tab>
</Tabs>

Voorbeeld:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Gebruik `trusted` alleen wanneer het ingesloten document echt same-origin-gedrag nodig heeft. Voor de meeste door agents gegenereerde games en interactieve canvassen is `scripts` de veiligere keuze.
</Warning>

Absolute externe `http(s)`-embed-URL's blijven standaard geblokkeerd. Als je bewust wilt dat `[embed url="https://..."]` pagina's van derden laadt, stel dan `gateway.controlUi.allowExternalEmbedUrls: true` in.

## Breedte van chatberichten

Gegroepeerde chatberichten gebruiken een leesbare standaard max-width. Deployments met brede monitoren kunnen dit overschrijven zonder gebundelde CSS te patchen door `gateway.controlUi.chatMessageMaxWidth` in te stellen:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

De waarde wordt gevalideerd voordat deze de browser bereikt. Ondersteunde waarden omvatten gewone lengtes en percentages zoals `960px` of `82%`, plus begrensde `min(...)`-, `max(...)`-, `clamp(...)`-, `calc(...)`- en `fit-content(...)`-breedte-expressies.

## Tailnet-toegang (aanbevolen)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Houd de Gateway op loopback en laat Tailscale Serve deze via HTTPS proxyen:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Open:

    - `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Standaard kunnen Control UI-/WebSocket Serve-verzoeken authenticeren via Tailscale-identiteitsheaders (`tailscale-user-login`) wanneer `gateway.auth.allowTailscale` `true` is. OpenClaw verifieert de identiteit door het `x-forwarded-for`-adres op te lossen met `tailscale whois` en dit te matchen met de header, en accepteert deze alleen wanneer het verzoek loopback bereikt met de `x-forwarded-*`-headers van Tailscale. Voor Control UI-operatorsessies met browserapparaatidentiteit slaat dit geverifieerde Serve-pad ook de apparaatkoppelingsronde over; browsers zonder apparaat en node-role-verbindingen volgen nog steeds de normale apparaatcontroles. Stel `gateway.auth.allowTailscale: false` in als je expliciete shared-secret-referenties wilt vereisen, zelfs voor Serve-verkeer. Gebruik dan `gateway.auth.mode: "token"` of `"password"`.

    Voor dat asynchrone Serve-identiteitspad worden mislukte authenticatiepogingen voor hetzelfde client-IP en dezelfde authenticatiescope geserialiseerd voordat rate-limit-writes plaatsvinden. Gelijktijdige foutieve retries vanuit dezelfde browser kunnen daarom bij het tweede verzoek `retry later` tonen in plaats van twee gewone mismatches die parallel racen.

    <Warning>
    Tokenloze Serve-authenticatie gaat ervan uit dat de gatewayhost vertrouwd is. Als onvertrouwde lokale code op die host kan draaien, vereis dan token-/wachtwoordauthenticatie.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Open daarna:

    - `http://<tailscale-ip>:18789/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Plak het overeenkomende gedeelde geheim in de UI-instellingen (verzonden als `connect.params.auth.token` of `connect.params.auth.password`).

  </Tab>
</Tabs>

## Onveilige HTTP

Als je het dashboard opent via gewone HTTP (`http://<lan-ip>` of `http://<tailscale-ip>`), draait de browser in een **niet-beveiligde context** en blokkeert WebCrypto. Standaard **blokkeert** OpenClaw Control UI-verbindingen zonder apparaatidentiteit.

Gedocumenteerde uitzonderingen:

- localhost-only onveilige HTTP-compatibiliteit met `gateway.controlUi.allowInsecureAuth=true`
- geslaagde operator-Control UI-authenticatie via `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Aanbevolen oplossing:** gebruik HTTPS (Tailscale Serve) of open de UI lokaal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (op de gatewayhost)

<AccordionGroup>
  <Accordion title="Gedrag van onveilige-authenticatieschakelaar">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` is alleen een lokale compatibiliteitsschakelaar:

    - Hiermee kunnen localhost-Control UI-sessies doorgaan zonder apparaatidentiteit in niet-beveiligde HTTP-contexten.
    - Dit omzeilt geen koppelingscontroles.
    - Dit versoepelt geen vereisten voor apparaatidentiteit op afstand (niet-localhost).

  </Accordion>
  <Accordion title="Alleen break-glass">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` schakelt Control UI-controles voor apparaatidentiteit uit en is een ernstige beveiligingsverlaging. Draai dit snel terug na noodgebruik.
    </Warning>

  </Accordion>
  <Accordion title="Opmerking over trusted-proxy">
    - Geslaagde trusted-proxy-authenticatie kan **operator**-Control UI-sessies toelaten zonder apparaatidentiteit.
    - Dit geldt **niet** voor Control UI-sessies met node-rol.
    - Same-host local loopback reverse proxies voldoen nog steeds niet aan trusted-proxy-authenticatie; zie [Trusted proxy auth](/nl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zie [Tailscale](/nl/gateway/tailscale) voor richtlijnen voor HTTPS-configuratie.

## Content security policy

De Control UI wordt geleverd met een strikt `img-src`-beleid: alleen **same-origin** assets, `data:`-URL's en lokaal gegenereerde `blob:`-URL's zijn toegestaan. Externe `http(s)`- en protocol-relative afbeeldings-URL's worden door de browser geweigerd en veroorzaken geen netwerkverzoeken.

Wat dit in de praktijk betekent:

- Avatars en afbeeldingen die via relatieve paden worden geleverd (bijvoorbeeld `/avatars/<id>`) worden nog steeds weergegeven, inclusief geauthenticeerde avatarroutes die de UI ophaalt en omzet naar lokale `blob:`-URL's.
- Inline `data:image/...`-URL's worden nog steeds weergegeven (handig voor payloads binnen het protocol).
- Lokale `blob:`-URL's die door de Control UI zijn gemaakt, worden nog steeds weergegeven.
- Externe avatar-URL's die door kanaalmetadata worden uitgegeven, worden bij de avatarhelpers van de Control UI verwijderd en vervangen door het ingebouwde logo/de ingebouwde badge, zodat een gecompromitteerd of kwaadaardig kanaal geen willekeurige externe afbeeldingsverzoeken vanuit een operatorbrowser kan afdwingen.

Je hoeft niets te wijzigen om dit gedrag te krijgen — het staat altijd aan en is niet configureerbaar.

## Authenticatie voor avatarroute

Wanneer gatewayauthenticatie is geconfigureerd, vereist het avatarendpoint van de Control UI hetzelfde gatewaytoken als de rest van de API:

- `GET /avatar/<agentId>` retourneert de avatarafbeelding alleen aan geauthenticeerde aanroepers. `GET /avatar/<agentId>?meta=1` retourneert de avatarmetadata volgens dezelfde regel.
- Niet-geauthenticeerde verzoeken naar beide routes worden geweigerd (overeenkomstig de naastliggende assistant-media-route). Dit voorkomt dat de avatarroute agentidentiteit lekt op hosts die verder beschermd zijn.
- De Control UI zelf stuurt het gatewaytoken door als bearerheader bij het ophalen van avatars, en gebruikt geauthenticeerde blob-URL's zodat de afbeelding nog steeds in dashboards wordt weergegeven.

Als je gatewayauthenticatie uitschakelt (niet aanbevolen op gedeelde hosts), wordt de avatarroute ook niet-geauthenticeerd, in lijn met de rest van de Gateway.

## Authenticatie voor assistant-media-route

Wanneer gatewayauthenticatie is geconfigureerd, gebruiken lokale mediavoorbeelden van de assistant een tweestapsroute:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` vereist de normale operatorauthenticatie van de Control UI. De browser verzendt het gatewaytoken als bearerheader bij het controleren van beschikbaarheid.
- Geslaagde metadataresponses bevatten een kortlevende `mediaTicket` die is beperkt tot dat exacte bronpad.
- Door de browser weergegeven afbeeldings-, audio-, video- en document-URL's gebruiken `mediaTicket=<ticket>` in plaats van het actieve gatewaytoken of wachtwoord. Het ticket verloopt snel en kan geen andere bron autoriseren.

Dit houdt normale mediaweergave compatibel met browser-native media-elementen zonder herbruikbare gatewayreferenties in zichtbare media-URL's te plaatsen.

## De UI bouwen

De Gateway levert statische bestanden vanuit `dist/control-ui`. Bouw ze met:

```bash
pnpm ui:build
```

Optionele absolute basis (wanneer je vaste asset-URL's wilt):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Voor lokale ontwikkeling (aparte devserver):

```bash
pnpm ui:dev
```

Wijs de UI vervolgens naar je Gateway-WS-URL (bijv. `ws://127.0.0.1:18789`).

## Debuggen/testen: devserver + externe Gateway

De Control UI bestaat uit statische bestanden; het WebSocket-doel is configureerbaar en kan verschillen van de HTTP-origin. Dit is handig wanneer je de Vite-devserver lokaal wilt gebruiken, maar de Gateway elders draait.

<Steps>
  <Step title="Start de UI-devserver">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Openen met gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Optionele eenmalige authenticatie (indien nodig):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Opmerkingen">
    - `gatewayUrl` wordt na het laden opgeslagen in localStorage en uit de URL verwijderd.
    - Als je een volledig `ws://`- of `wss://`-endpoint via `gatewayUrl` doorgeeft, URL-encodeer dan de waarde van `gatewayUrl` zodat de browser de querystring correct parseert.
    - `token` moet waar mogelijk via het URL-fragment (`#token=...`) worden doorgegeven. Fragmenten worden niet naar de server verzonden, waardoor lekkage via verzoeklogs en Referer wordt voorkomen. Verouderde `?token=`-queryparameters worden nog steeds eenmaal geïmporteerd voor compatibiliteit, maar alleen als fallback, en worden direct na bootstrap verwijderd.
    - `password` wordt alleen in het geheugen bewaard.
    - Wanneer `gatewayUrl` is ingesteld, valt de UI niet terug op config- of omgevingsreferenties. Geef `token` (of `password`) expliciet op. Ontbrekende expliciete referenties zijn een fout.
    - Gebruik `wss://` wanneer de Gateway achter TLS staat (Tailscale Serve, HTTPS-proxy, enz.).
    - `gatewayUrl` wordt alleen geaccepteerd in een venster op topniveau (niet ingesloten) om clickjacking te voorkomen.
    - Niet-loopback Control UI-implementaties moeten `gateway.controlUi.allowedOrigins` expliciet instellen (volledige origins). Dit omvat externe devopstellingen.
    - Het opstarten van de Gateway kan lokale origins zoals `http://localhost:<port>` en `http://127.0.0.1:<port>` seeden vanuit de effectieve runtime-bind en poort, maar externe browserorigins hebben nog steeds expliciete vermeldingen nodig.
    - Gebruik `gateway.controlUi.allowedOrigins: ["*"]` niet, behalve voor strikt gecontroleerd lokaal testen. Het betekent dat elke browserorigin wordt toegestaan, niet "match welke host ik ook gebruik."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` schakelt Host-header-origin-fallbackmodus in, maar dit is een gevaarlijke beveiligingsmodus.

  </Accordion>
</AccordionGroup>

Voorbeeld:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Details voor externe toegang instellen: [Externe toegang](/nl/gateway/remote).

## Gerelateerd

- [Dashboard](/nl/web/dashboard) — gatewaydashboard
- [Health Checks](/nl/gateway/health) — gezondheidsmonitoring van de gateway
- [TUI](/nl/web/tui) — terminalgebruikersinterface
- [WebChat](/nl/web/webchat) — browsergebaseerde chatinterface
